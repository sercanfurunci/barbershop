"use client";

// Draggable bottom sheet for the mobile map view (Apple/Google Maps style).
// Snap points: 10% (collapsed: handle + count) / 45% (half: carousel) / 90% (expanded list).
// Drag via the grab handle; the inner content scrolls independently.

import { useEffect, useRef, useState } from "react";
import { motion, useDragControls } from "framer-motion";
import { OVERLAY_TRANSITION, OVERLAY_SHADOW } from "@/lib/overlay";

export const SNAPS = [0.1, 0.45, 0.9];
const MAX_SNAP = SNAPS[SNAPS.length - 1];

export default function MapBottomSheet({ snap, onSnapChange, header, children }) {
  const [vh, setVh] = useState(0);
  const dragControls = useDragControls();
  const listRef = useRef(null);

  useEffect(() => {
    const update = () => setVh(window.innerHeight);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (!vh) return null;

  const sheetH = vh * MAX_SNAP;
  const yFor = (s) => sheetH - vh * s; // translateY from fully-open position
  const y = yFor(snap);

  function handleDragEnd(_, info) {
    const endY = y + info.offset.y + info.velocity.y * 0.15;
    let best = SNAPS[0];
    let bestDist = Infinity;
    for (const s of SNAPS) {
      const d = Math.abs(yFor(s) - endY);
      if (d < bestDist) { bestDist = d; best = s; }
    }
    onSnapChange(best);
  }

  return (
    <motion.div
      className="motion-safety-exempt fixed inset-x-0 bottom-0 z-30 md:hidden flex flex-col rounded-t-[20px] bg-background border-t border-border"
      style={{ height: sheetH, boxShadow: OVERLAY_SHADOW }}
      initial={false}
      animate={{ y }}
      transition={OVERLAY_TRANSITION}
      drag="y"
      dragListener={false}
      dragControls={dragControls}
      dragConstraints={{ top: 0, bottom: yFor(SNAPS[0]) }}
      dragElastic={0.06}
      onDragEnd={handleDragEnd}
    >
      {/* Grab handle — tight padding so first card feels connected */}
      <div
        className="shrink-0 pt-2 pb-1 px-4 cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={(e) => dragControls.start(e)}
      >
        <div className="mx-auto w-10 h-1.5 rounded-full bg-border" />
        {header}
      </div>

      {/* Content — no overflow here so children own scrolling and cards never clip */}
      <div ref={listRef} className="flex-1 min-h-0 flex flex-col">
        {children}
      </div>
    </motion.div>
  );
}
