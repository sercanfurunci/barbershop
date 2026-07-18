"use client";

/**
 * /widget/[shopSlug] — iframe host for the embed SDK (public/widget.js).
 * Renders ChatWidget in sdk mode: transparent bg, postMessages parent on open/close.
 */

import { use } from "react";
import { useSearchParams } from "next/navigation";
import ChatWidget from "@/components/chat/ChatWidget";

export default function WidgetPage({ params }) {
  const { shopSlug }   = use(params);
  const sp             = useSearchParams();
  const widgetConfig   = {
    ...(sp.get("primaryColor") && { primaryColor: sp.get("primaryColor") }),
    ...(sp.get("accentColor")  && { accentColor:  sp.get("accentColor") }),
    ...(sp.get("position")     && { position:     sp.get("position") }),
  };

  return (
    <div style={{ background: "transparent", margin: 0, padding: 0 }}>
      <ChatWidget shopSlug={shopSlug} widgetConfig={widgetConfig} sdk />
    </div>
  );
}
