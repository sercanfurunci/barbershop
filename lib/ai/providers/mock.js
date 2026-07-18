/**
 * Mock AI provider — zero dependencies, zero API keys.
 * Auto-selected when ANTHROPIC_API_KEY is absent.
 *
 * Responds in Turkish with context-aware canned replies.
 * The chat route's simulated-streaming path will animate them character-by-character,
 * so the widget experience is identical to the real provider.
 */

// ponytail: mock provider — used when no API key is set. Gives sensible replies
// without real tool calls. Never says "please call the salon" for things the real
// AI can handle; the real provider replaces this when a key is configured.
const PATTERNS = [
  [/randevu|rezervasyon|appointment|booking|book/i,
   "Randevu almak için size yardımcı olabilirim! Hangi hizmet için randevu almak istersiniz? Tercih ettiğiniz gün ve saati belirtin."],
  [/merhaba|selam|hey|hello|hi\b/i,
   "Merhaba! MAKAS'a hoş geldiniz 👋 Size nasıl yardımcı olabilirim?"],
  [/fiyat|ücret|kaç (para|tl|lira)|price|cost/i,
   "Hizmet fiyatlarımız için randevu ekranımızdaki Hizmetler listesine göz atabilirsiniz. Size en uygun seçeneği seçip randevu alabiliriz."],
  [/saat|çalışma|working|ne zaman|açık|kapalı|when|hour/i,
   "Çalışma saatlerimizi randevu ekranında güncel olarak görebilirsiniz. Hangi gün için müsaitlik aramak istersiniz?"],
  [/iptal|cancel/i,
   "Randevunuzu iptal etmek ister misiniz? Kayıtlı telefon numaranızı paylaşırsanız işlemi hemen gerçekleştirebilirim."],
  [/teşekkür|sağ ol|thanks|thank/i,
   "Rica ederim! Başka yardımcı olabileceğim bir konu var mı? 😊"],
];

function pick(messages) {
  const last = messages.at(-1)?.content ?? "";
  for (const [re, reply] of PATTERNS) {
    if (re.test(last)) return reply;
  }
  return "Anlıyorum! Size yardımcı olmak için buradayım. Randevu almak veya başka bir konuda yardım ister misiniz?";
}

async function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

export default {
  name: "mock",

  async agentic({ messages, onRound }) {
    await delay(280 + Math.random() * 320);
    const text = pick(messages);
    const usage = { inputTokens: 80, outputTokens: Math.ceil(text.length / 4) };
    if (onRound) await onRound(1, { ...usage, latencyMs: 300, stopReason: "end_turn" });
    return { text, usage, toolCallCount: 0, rounds: 1 };
  },

  async complete({ messages }) {
    await delay(180);
    return pick(messages);
  },
};
