"use client";

import { useEffect } from "react";

// Lock background scroll while a modal is mounted. Restores prior overflow on
// unmount. iOS Safari note: combined with `overscroll-behavior: contain` on
// the modal's outer overlay, scroll bounces are kept inside the modal.
//
// ponytail: tiny hook — fine to inline if only one consumer, but we have
// 5+ modals, so a single source of truth is cheaper.
export function useBodyScrollLock(enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [enabled]);
}
