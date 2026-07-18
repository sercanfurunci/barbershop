import { validateSlot } from "@/lib/services/AvailabilityService";

// Validates that a slot [startMin, startMin+durationMin) on the given date is
// within the barber's working hours, not on a holiday, and not overlapping a
// break. Does NOT check appointment collisions — BookingService does that inside
// its own serializable transaction to avoid TOCTOU on the booked-appointments set.
//
// Returns { ok: true } or { ok: false, status, error }.
export async function validateBookingWindow({ shopId, barberId, date, startMin, durationMin }) {
  return validateSlot({ shopId, barberId, date, startMin, durationMin });
}
