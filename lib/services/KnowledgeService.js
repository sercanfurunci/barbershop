/**
 * Knowledge Base service.
 * Per-shop knowledge entries injected into the AI system prompt.
 */

import { prisma } from "@/lib/prisma";
import { cacheGet, cacheSet, cacheInvalidate } from "@/lib/ai/cache";

const ENTRY_SELECT = {
  id: true, category: true, title: true, content: true,
  tags: true, enabled: true, sortOrder: true, version: true,
  createdAt: true, updatedAt: true,
};

const VALID_CATEGORIES = [
  "POLICY", "FAQ", "CAMPAIGN", "WORKING_HOURS", "HOLIDAY_RULES",
  "PARKING", "PAYMENT", "PRODUCTS", "STAFF_BIO", "ABOUT", "NOTES",
];

/**
 * List entries with optional search and pagination.
 * @returns {{ data, total, page, limit }}
 */
export async function listEntries(shopId, { category, enabled, search, page = 1, limit = 50 } = {}) {
  const where = {
    shopId,
    ...(category ? { category } : {}),
    ...(enabled !== undefined ? { enabled } : {}),
    ...(search ? {
      OR: [
        { title:   { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ],
    } : {}),
  };
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.knowledgeEntry.findMany({
      where,
      select:  ENTRY_SELECT,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      skip,
      take: limit,
    }),
    prisma.knowledgeEntry.count({ where }),
  ]);
  return { data, total, page, limit };
}

/**
 * Get enabled entries formatted for AI system prompt injection.
 * Returns a compact text block; empty string when shop has no knowledge.
 * Cached for 60s and invalidated on any entry write.
 */
export async function getKnowledgeForPrompt(shopId) {
  const key = `kb:prompt:${shopId}`;
  const cached = cacheGet(key);
  if (cached !== null) return cached;

  const sections = await getKnowledgeSections(shopId);
  const parts = [];
  if (sections.policies)     parts.push(sections.policies);
  if (sections.other)        parts.push(sections.other);
  if (sections.campaigns)    parts.push(sections.campaigns);
  if (sections.workingHours) parts.push(sections.workingHours);
  const result = parts.join("\n\n");

  cacheSet(key, result);
  return result;
}

// Categories already covered by dynamicContext — when a dynamic context is
// present we skip those categories in the manual KB to avoid duplication.
const DYNAMIC_CATEGORIES = new Set(["WORKING_HOURS", "STAFF_BIO", "PAYMENT", "PARKING"]);

/**
 * Returns knowledge grouped by category type for structured prompt injection.
 * When dynamicContext is provided, entries whose categories are already
 * captured by dynamic data are skipped to avoid duplication.
 * When query is provided, entries are scored by keyword relevance and top 15 are used.
 * @param {string} shopId
 * @param {{ sections: object } | null} [dynamicContext]
 * @param {string} [query] — user message text for relevance scoring
 * @returns {{ policies: string, campaigns: string, workingHours: string, other: string, count: number }}
 */
export async function getKnowledgeSections(shopId, dynamicContext = null, query = null) {
  // Cache raw entries; scoring is in-memory and cheap
  const rawKey = `kb:entries:${shopId}`;
  let entries = cacheGet(rawKey);
  if (entries === null) {
    entries = await prisma.knowledgeEntry.findMany({
      where:   { shopId, enabled: true },
      select:  { category: true, title: true, content: true, tags: true, sortOrder: true },
      orderBy: [{ sortOrder: "asc" }],
      take:    60,
    });
    cacheSet(rawKey, entries, 120_000); // 2-minute TTL
  }

  if (!entries.length) return { policies: "", campaigns: "", workingHours: "", other: "", count: 0 };

  // Relevance scoring: if a query is provided, score and limit entries
  let scoredEntries = entries;
  if (query) {
    const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    if (keywords.length) {
      scoredEntries = entries.map(e => {
        const titleL   = e.title.toLowerCase();
        const contentL = e.content.toLowerCase();
        const tagsL    = (e.tags ?? []).join(" ").toLowerCase();
        let score = 0;
        for (const kw of keywords) {
          if (titleL.includes(kw))   score += 3;
          if (tagsL.includes(kw))    score += 2;
          if (contentL.includes(kw)) score += 1;
        }
        return { ...e, _score: score };
      });
      // Sort matched entries first; within matches, by sortOrder; take top 15
      scoredEntries.sort((a, b) => b._score - a._score || a.sortOrder - b.sortOrder);
      const hasMatches = scoredEntries.some(e => e._score > 0);
      if (hasMatches) scoredEntries = scoredEntries.slice(0, 15);
    }
  }

  const dedup = Boolean(dynamicContext);
  const policy = [], campaign = [], workingHours = [], otherMap = {};
  let usedCount = 0;
  for (const e of scoredEntries) {
    if (dedup && DYNAMIC_CATEGORIES.has(e.category)) continue;
    usedCount += 1;
    const line = `${e.title}: ${e.content}`;
    if (e.category === "POLICY")             policy.push(line);
    else if (e.category === "CAMPAIGN")      campaign.push(line);
    else if (e.category === "WORKING_HOURS") workingHours.push(line);
    else {
      otherMap[e.category] = otherMap[e.category] ?? [];
      otherMap[e.category].push(line);
    }
  }

  const otherText = Object.entries(otherMap)
    .map(([cat, lines]) => `[${cat}]\n${lines.join("\n")}`)
    .join("\n\n");

  return {
    policies:     policy.length        ? `[POLİTİKA]\n${policy.join("\n")}`               : "",
    campaigns:    campaign.length      ? `[KAMPANYA]\n${campaign.join("\n")}`              : "",
    workingHours: workingHours.length  ? `[ÇALIŞMA SAATLERİ]\n${workingHours.join("\n")}` : "",
    other:        otherText,
    count:        usedCount,
  };
}

export async function getEntry(shopId, id) {
  const entry = await prisma.knowledgeEntry.findFirst({
    where: { id, shopId },
    select: ENTRY_SELECT,
  });
  if (!entry) throw Object.assign(new Error("Bilgi girişi bulunamadı"), { status: 404 });
  return entry;
}

function _invalidateKb(shopId) {
  cacheInvalidate(`kb:prompt:${shopId}`);
  cacheInvalidate(`kb:entries:${shopId}`);
}

export async function createEntry(shopId, data) {
  _validate(data);
  const entry = await prisma.knowledgeEntry.create({
    data: {
      shopId,
      category:  data.category,
      title:     data.title.trim(),
      content:   data.content.trim(),
      tags:      data.tags      ?? [],
      enabled:   data.enabled   ?? true,
      sortOrder: data.sortOrder ?? data.priority ?? 0,
    },
    select: ENTRY_SELECT,
  });
  _invalidateKb(shopId);
  return entry;
}

export async function updateEntry(shopId, id, data) {
  const existing = await getEntry(shopId, id);
  const contentChanged = data.content !== undefined && data.content !== existing.content;
  const entry = await prisma.knowledgeEntry.update({
    where: { id },
    data: {
      ...(data.category  !== undefined ? { category:  data.category              } : {}),
      ...(data.title     !== undefined ? { title:     data.title.trim()          } : {}),
      ...(data.content   !== undefined ? { content:   data.content.trim()        } : {}),
      ...(data.tags      !== undefined ? { tags:      data.tags                  } : {}),
      ...(data.enabled   !== undefined ? { enabled:   Boolean(data.enabled)      } : {}),
      ...((data.sortOrder ?? data.priority) !== undefined
        ? { sortOrder: Number(data.sortOrder ?? data.priority) } : {}),
      ...(contentChanged ? { version: existing.version + 1 } : {}),
    },
    select: ENTRY_SELECT,
  });
  _invalidateKb(shopId);
  return entry;
}

export async function deleteEntry(shopId, id) {
  await getEntry(shopId, id);
  await prisma.knowledgeEntry.delete({ where: { id } });
  _invalidateKb(shopId);
}

export async function countEnabledEntries(shopId) {
  return prisma.knowledgeEntry.count({ where: { shopId, enabled: true } });
}

function _validate(data) {
  if (!data.title?.trim())   throw Object.assign(new Error("Başlık gerekli"),    { status: 400 });
  if (!data.content?.trim()) throw Object.assign(new Error("İçerik gerekli"),    { status: 400 });
  if (!VALID_CATEGORIES.includes(data.category)) {
    throw Object.assign(new Error("Geçersiz kategori"), { status: 400 });
  }
}
