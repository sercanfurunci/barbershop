import { EventEmitter } from "events";

// ponytail: in-process bus — zero deps, zero latency.
// Swap `bus` for a Redis pub/sub client when you need cross-process delivery.
const bus = new EventEmitter();
bus.setMaxListeners(50);

export const emit = (event, payload) => bus.emit(event, payload);
export const on   = (event, handler) => { bus.on(event, handler); return () => bus.off(event, handler); };
export const off  = (event, handler) => bus.off(event, handler);

export const EVENTS = Object.freeze({
  APPOINTMENT_CREATED:     "appointment.created",
  APPOINTMENT_CONFIRMED:   "appointment.confirmed",
  APPOINTMENT_CANCELLED:   "appointment.cancelled",
  APPOINTMENT_COMPLETED:   "appointment.completed",
  APPOINTMENT_RESCHEDULED: "appointment.rescheduled",
  APPOINTMENT_NOSHOW:      "appointment.noshow",
  CUSTOMER_CREATED:        "customer.created",
  CUSTOMER_UPDATED:        "customer.updated",
  CUSTOMER_BLOCKED:        "customer.blocked",
  REVIEW_CREATED:          "review.created",
  FAVORITE_ADDED:          "favorite.added",
  FAVORITE_REMOVED:        "favorite.removed",
  WORKING_HOURS_CHANGED:   "shop.working_hours_changed",
  SHOP_CLOSED:             "shop.closed",
});
