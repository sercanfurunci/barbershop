"use client";

// Draggable bottom sheet — Google Maps / Uber style.
// Snaps: 17% peek (compact carousel) / 50% half (selected card + carousel) / 88% full list.
// Uses height animation — handle is always at the visible top edge.

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { OVERLAY_SHADOW } from "@/lib/overlay";

export const SNAPS = [0.17, 0.88];
const MIN_SNAP = SNAPS[0];
const MAX_SNAP = SNAPS[SNAPS.length - 1];

const SPRING = { type: "spring", stiffness: 400, damping: 40 };

export default function MapBottomSheet({ snap, onSnapChange, header, children }) {
  const [vh, setVh] = useState(0);
  const heightMV = useMotionValue(0);
  const animRef = useRef(null);

  // Drag state
  const dragging = useRef(false);
  const startY = useRef(0);
  const startH = useRef(0);
  const lastY = useRef(0);
  const lastT = useRef(0);
  const velocity = useRef(0);

  useEffect(() => {
    // ponytail: snapshot at mount; only re-measure on real orientation change (>100px)
    const snapshot = () => setVh(window.innerHeight);
    snapshot();
    let prevVh = window.innerHeight;
    const onResize = () => {
      const newVh = window.innerHeight;
      if (Math.abs(newVh - prevVh) > 100) { prevVh = newVh; snapshot(); }
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", snapshot);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", snapshot);
    };
  }, []);

  useEffect(() => {
    if (!vh) return;
    if (animRef.current) animRef.current.stop();
    animRef.current = animate(heightMV, vh * snap, SPRING);
  }, [vh, snap, heightMV]);

  if (!vh) return null;

  const snapH = (s) => vh * s;
  const clamp = (h) => Math.max(snapH(MIN_SNAP) * 0.7, Math.min(snapH(MAX_SNAP), h));

  function onPointerDown(e) {
    if (animRef.current) animRef.current.stop();
    dragging.current = true;
    startY.current = e.clientY;
    startH.current = heightMV.get();
    lastY.current = e.clientY;
    lastT.current = performance.now();
    velocity.current = 0;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e) {
    if (!dragging.current) return;
    const now = performance.now();
    const dt = now - lastT.current;
    if (dt > 0) {
      velocity.current = (e.clientY - lastY.current) / dt * 1000;
      lastY.current = e.clientY;
      lastT.current = now;
    }
    heightMV.set(clamp(startH.current - (e.clientY - startY.current)));
  }

  function onPointerUp() {
    if (!dragging.current) return;
    dragging.current = false;

    const vel = velocity.current; // positive = downward drag (shrinks height)
    const currentH = heightMV.get();
    const idx = SNAPS.indexOf(snap);

    // Fast fling: jump to adjacent snap in drag direction
    if (Math.abs(vel) > 350) {
      if (vel > 0 && idx > 0)                   { onSnapChange(SNAPS[idx - 1]); return; }
      if (vel < 0 && idx < SNAPS.length - 1)    { onSnapChange(SNAPS[idx + 1]); return; }
    }

    // Slow drag: nearest snap
    let best = SNAPS[0], bestDist = Infinity;
    for (const s of SNAPS) {
      const d = Math.abs(snapH(s) - currentH);
      if (d < bestDist) { bestDist = d; best = s; }
    }
    onSnapChange(best);
  }

  return (
    <motion.div
      className="motion-safety-exempt fixed inset-x-0 bottom-0 z-30 md:hidden flex flex-col bg-background overflow-hidden"
      style={{ height: heightMV, boxShadow: OVERLAY_SHADOW, borderRadius: "20px 20px 0 0" }}
    >
      {/* Grab handle — pointer events captured here */}
      <div
        className="shrink-0 flex flex-col items-center pt-2.5 pb-0.5 touch-none select-none cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { dragging.current = false; }}
      >
        <div className="w-9 h-[3px] rounded-full" style={{ background: "var(--makas-border, #e5e7eb)" }} />
        {header && <div className="w-full px-4 mt-1.5">{header}</div>}
      </div>

      {/* Content — safe-area padding so iOS home indicator never clips content */}
      <div
        className="flex-1 min-h-0 flex flex-col"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {children}
      </div>
    </motion.div>
  );
}
