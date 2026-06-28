// Single source of truth for appointment revenue split.
// Called from walk-in POST and status→COMPLETED PATCH. If these drift,
// barber payouts and shop net diverge silently.
export function splitRevenue(finalPrice, barber) {
  if (barber.paymentType === "FIXED") {
    return { barberAmount: 0, shopAmount: finalPrice };
  }
  const rate = Math.min(100, Math.max(0, barber.commissionRate ?? 50));
  const barberAmount = Math.round((finalPrice * rate) / 100);
  return { barberAmount, shopAmount: finalPrice - barberAmount };
}
