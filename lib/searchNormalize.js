// Turkish ↔ ASCII normalization for search.
// ı/İ/i ambiguity: normalize everything to ASCII equivalents so
// "darica" matches "Darıca" and vice versa.

const TR_MAP = [
  [/ğ/g, "g"], [/Ğ/g, "g"],
  [/ü/g, "u"], [/Ü/g, "u"],
  [/ş/g, "s"], [/Ş/g, "s"],
  [/ı/g, "i"], [/I/g,  "i"],
  [/ö/g, "o"], [/Ö/g, "o"],
  [/ç/g, "c"], [/Ç/g, "c"],
  [/İ/g, "i"],
];

export function normalizeTr(str) {
  let s = str.toLowerCase();
  for (const [re, sub] of TR_MAP) s = s.replace(re, sub);
  return s;
}

// Returns [original, normalized] deduplicated — both passed to OR searches
// so "darıca" finds "Darıca" AND "darica" also finds "Darıca".
export function searchTerms(raw) {
  const t = raw.slice(0, 200).trim();
  const n = normalizeTr(t);
  return [...new Set([t, n])];
}

// Build a Prisma OR clause that checks `field` against all terms using substring match.
// Good for names, descriptions, addresses — NOT for city (use buildCityClause).
export function buildFieldOR(terms, field) {
  return terms.map((t) => ({ [field]: { contains: t, mode: "insensitive" } }));
}

// Exact-match city/district clause. Prevents "Ankara Caddesi, Kocaeli" matching Ankara filter.
// Passes both original and normalized form to cover Turkish char variants (İ/I, etc).
export function buildCityClause(rawCity, field = "city") {
  const norm = normalizeTr(rawCity.trim());
  const vals = [...new Set([rawCity.trim(), norm])];
  return { OR: vals.map((v) => ({ [field]: { equals: v, mode: "insensitive" } })) };
}
