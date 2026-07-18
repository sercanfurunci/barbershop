/**
 * Deterministic AI response quality score (0-100). No LLM cost.
 * Internal only — stored on AiUsageLog, never shown to customers.
 *
 * Signals:
 *  - provider success            (base gate)
 *  - self-review passed          (hallucination check)
 *  - tool failure rate
 *  - excessive tool rounds       (planner should prevent exploration)
 *  - clarification asked instead of a bad booking (positive signal)
 */
export function computeQualityScore({ success, review, toolLog = [], rounds = 1, planUsed = false }) {
  if (!success) return 0;

  let score = 100;

  if (review && review.ok === false) score -= 40; // hallucinated booking claim caught

  const failed = toolLog.filter(t => !t.ok).length;
  if (toolLog.length) score -= Math.min(30, Math.round((failed / toolLog.length) * 30));

  if (rounds >= 4) score -= 10;      // exploratory looping the planner should prevent
  else if (rounds === 3) score -= 5;

  if (planUsed) score += 0;          // plan present; neutral — absence isn't penalized for info intents

  const clarified = toolLog.some(t => t.name === "CreateAppointment" && !t.ok);
  if (clarified && review?.ok !== false) score = Math.min(score, 90); // asked instead of booked — fine, small ding

  return Math.max(0, Math.min(100, score));
}
