/**
 * AI Rule Engine service.
 * Per-shop behavioral rules injected into every AI system prompt.
 * Lower priority number = higher precedence.
 */

import { prisma } from "@/lib/prisma";
import { cacheGet, cacheSet, cacheInvalidate } from "@/lib/ai/cache";

const RULE_SELECT = {
  id: true, rule: true, type: true, priority: true, enabled: true,
  createdAt: true, updatedAt: true,
};

export async function listRules(shopId) {
  return prisma.aiRule.findMany({
    where:   { shopId },
    select:  RULE_SELECT,
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
  });
}

/**
 * Get enabled rules as an ordered text block for system prompt injection.
 * Cached for 60s and invalidated on any rule write.
 */
export async function getRulesForPrompt(shopId) {
  const key = `rules:prompt:${shopId}`;
  const cached = cacheGet(key);
  if (cached !== null) return cached;

  const rules = await prisma.aiRule.findMany({
    where:   { shopId, enabled: true },
    select:  { rule: true, type: true },
    orderBy: [{ priority: "asc" }],
    take:    30,
  });

  // Positive rules: "- {rule}", Negative rules: "- ASLA: {rule}"
  const lines = rules.map(r =>
    r.type === "negative" ? `- ASLA: ${r.rule}` : `- ${r.rule}`
  );
  const result = lines.join("\n");

  cacheSet(key, result);
  return result;
}

export async function getRule(shopId, id) {
  const rule = await prisma.aiRule.findFirst({ where: { id, shopId }, select: RULE_SELECT });
  if (!rule) throw Object.assign(new Error("Kural bulunamadı"), { status: 404 });
  return rule;
}

export async function createRule(shopId, { rule, type = "positive", priority = 100, enabled = true }) {
  if (!rule?.trim()) throw Object.assign(new Error("Kural metni gerekli"), { status: 400 });
  if (!["positive", "negative"].includes(type)) type = "positive";
  const result = await prisma.aiRule.create({
    data:   { shopId, rule: rule.trim(), type, priority: Number(priority), enabled: Boolean(enabled) },
    select: RULE_SELECT,
  });
  cacheInvalidate(`rules:prompt:${shopId}`);
  return result;
}

export async function updateRule(shopId, id, data) {
  await getRule(shopId, id);
  const result = await prisma.aiRule.update({
    where: { id },
    data: {
      ...(data.rule     !== undefined ? { rule:     data.rule.trim()      } : {}),
      ...(data.type     !== undefined && ["positive", "negative"].includes(data.type) ? { type: data.type } : {}),
      ...(data.priority !== undefined ? { priority: Number(data.priority) } : {}),
      ...(data.enabled  !== undefined ? { enabled:  Boolean(data.enabled) } : {}),
    },
    select: RULE_SELECT,
  });
  cacheInvalidate(`rules:prompt:${shopId}`);
  return result;
}

export async function deleteRule(shopId, id) {
  await getRule(shopId, id);
  await prisma.aiRule.delete({ where: { id } });
  cacheInvalidate(`rules:prompt:${shopId}`);
}

/**
 * Reorder rules: accepts an ordered array of { id, priority } and batch-updates.
 */
export async function reorderRules(shopId, ordered) {
  await Promise.all(
    ordered.map(({ id, priority }) =>
      prisma.aiRule.updateMany({ where: { id, shopId }, data: { priority } }),
    ),
  );
  cacheInvalidate(`rules:prompt:${shopId}`);
}
