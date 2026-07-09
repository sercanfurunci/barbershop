// Shared motion constants for every drawer / bottom sheet / slide-out.
// One duration + easing so the whole app feels like a single system.
// Easing matches BookingFlow's slide transition.
export const OVERLAY_TRANSITION = { duration: 0.25, ease: [0.32, 0.72, 0, 1] };
export const OVERLAY_BACKDROP = "rgba(0,0,0,0.4)";
export const OVERLAY_SHADOW = "0 -6px 28px rgba(0,0,0,0.14)";
export const OVERLAY_SHADOW_SIDE = "6px 0 28px rgba(0,0,0,0.14)";
