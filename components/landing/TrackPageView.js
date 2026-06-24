"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

export default function TrackPageView({ shopId }) {
  useEffect(() => {
    track(shopId, "page_view");
  }, [shopId]);
  return null;
}
