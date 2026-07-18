/**
 * Deterministic pre-execution planner. No LLM call, no latency.
 *
 * Extracts entities from the user message (date, time, phone, barber, service),
 * combines them with the customer profile, and emits a short internal PLAN
 * block for the system prompt: what is known, what is missing, which tools
 * to call in which order. This steers the model to the minimum tool sequence
 * instead of exploratory calls.
 */

const DAY_INDEX_TR = {
  pazartesi: 1, salı: 2, sali: 2, çarşamba: 3, carsamba: 3,
  perşembe: 4, persembe: 4, cuma: 5, cumartesi: 6, pazar: 0,
};

// TR local date (UTC+3) as YYYY-MM-DD, offset by n days
function trDate(daysAhead = 0) {
  const d = new Date(Date.now() + 3 * 60 * 60 * 1000 + daysAhead * 86_400_000);
  return d.toISOString().slice(0, 10);
}

function extractDate(msg) {
  const m = msg.toLowerCase();
  if (/bugün|today/.test(m))            return trDate(0);
  if (/yarın|yarin|tomorrow/.test(m))   return trDate(1);
  const dm = m.match(/(\d{1,2})[./](\d{1,2})(?:[./](\d{4}))?/);
  if (dm) {
    const now  = new Date(Date.now() + 3 * 60 * 60 * 1000);
    const year = dm[3] ?? now.getUTCFullYear();
    const date = `${year}-${dm[2].padStart(2, "0")}-${dm[1].padStart(2, "0")}`;
    return date >= trDate(0) ? date : null;
  }
  for (const [day, idx] of Object.entries(DAY_INDEX_TR)) {
    if (m.includes(day)) {
      const todayIdx = new Date(Date.now() + 3 * 60 * 60 * 1000).getUTCDay();
      let ahead = (idx - todayIdx + 7) % 7;
      if (ahead === 0) ahead = 7;
      return trDate(ahead);
    }
  }
  return null;
}

function extractTime(msg) {
  const t = msg.match(/\b(\d{1,2})[:.](\d{2})\b/);
  if (t) return `${t[1].padStart(2, "0")}:${t[2]}`;
  const h = msg.match(/saat\s+(\d{1,2})\b/i);
  if (h) return `${h[1].padStart(2, "0")}:00`;
  return null;
}

function extractPhone(msg) {
  const digits = msg.replace(/[\s()-]/g, "").match(/(?:\+?90|0)?(5\d{9})/);
  return digits ? digits[1] : null;
}

// Match a name from the dynamic context raw lists against the message
function matchByName(msg, items, nameKey = "nameTr") {
  if (!Array.isArray(items)) return null;
  const m = msg.toLowerCase();
  for (const item of items) {
    const first = item?.[nameKey]?.split(/\s+/)[0]?.toLowerCase();
    if (first && first.length >= 3 && m.includes(first)) return item;
  }
  return null;
}

const PLAN_INTENTS = new Set(["BOOKING", "AVAILABILITY", "CANCELLATION", "GENERAL"]);

/**
 * @param {string} message
 * @param {string} intent          — from detectIntent
 * @param {object|null} customer   — CustomerContext
 * @param {object|null} dc         — dynamicContext ({ raw: { barbers, services } })
 * @returns {string|null} internal PLAN block for the system prompt, or null
 */
export function buildPlan(message, intent, customer, dc) {
  if (!PLAN_INTENTS.has(intent)) return null;
  // GENERAL only gets a plan when the message smells like scheduling
  if (intent === "GENERAL" && !extractDate(message) && !extractTime(message)) return null;

  const date    = extractDate(message);
  const time    = extractTime(message);
  const phone   = extractPhone(message) ?? (customer?.phone ?? null);
  const barber  = matchByName(message, dc?.raw?.barbers)  ?? customer?.favoriteBarber  ?? null;
  const service = matchByName(message, dc?.raw?.services) ?? customer?.favoriteService ?? null;

  const known = [];
  const missing = [];
  if (customer?.name) known.push(`customer=${customer.name}`); else missing.push("name");
  if (phone)   known.push(`phone=${phone}`);                   else missing.push("phone");
  if (date)    known.push(`date=${date}`);                     else missing.push("date");
  if (time)    known.push(`time=${time}`);
  if (barber)  known.push(`barber=${barber.name ?? barber.nameTr} [${barber.id}]`);
  if (service) known.push(`service=${service.name ?? service.nameTr} [${service.id}]`);
  else missing.push("service");

  let steps;
  if (intent === "CANCELLATION") {
    steps = phone
      ? "1. FindCustomer(phone) 2. CancelAppointment(id from upcomingAppointments)"
      : "1. Ask for phone 2. FindCustomer 3. CancelAppointment";
  } else if (!date) {
    steps = "1. Ask for the date first — do NOT call availability tools without a date";
  } else if (barber) {
    steps = `1. GetAvailability(barberId=${barber.id}, date=${date}) 2. Confirm slot 3. ${phone ? "" : "Ask phone → "}FindCustomer 4. CreateAppointment`;
  } else {
    steps = `1. FindAvailableSlots(date=${date}) 2. Customer picks barber/slot 3. ${phone ? "" : "Ask phone → "}FindCustomer 4. CreateAppointment`;
  }

  return [
    "PLAN (internal - never show to the customer):",
    `- Intent: ${intent}`,
    known.length   ? `- Known: ${known.join(", ")}` : null,
    missing.length ? `- Missing: ${missing.join(", ")} — ask only for these` : null,
    `- Execute: ${steps}`,
    "- Do not call tools outside this plan unless a tool result requires it.",
  ].filter(Boolean).join("\n");
}

/**
 * Tool Router V2: refine the intent-level tool set using what the planner
 * knows about this specific customer/message. Fewer schemas → fewer tokens,
 * fewer wrong-tool calls.
 */
export function refineTools(tools, intent, customer) {
  if (!tools.length) return tools;
  const drop = new Set();

  // No upcoming appointments → cancel/reschedule are dead weight in booking flows
  if (intent !== "CANCELLATION" && !(customer?.upcomingAppointments?.length)) {
    drop.add("CancelAppointment");
    drop.add("RescheduleAppointment");
  }
  // Known customer → CreateAppointment auto-creates; explicit CreateCustomer unneeded
  if (customer?.clientId) drop.add("CreateCustomer");

  return drop.size ? tools.filter(t => !drop.has(t.name)) : tools;
}
