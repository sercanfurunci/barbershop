"use client";

import { useEffect, useState } from "react";

// undefined = still loading, null = no availability, obj = found
export function useFirstAvailable(shopId) {
  const [fa, setFa] = useState(undefined);
  useEffect(() => {
    fetch(`/api/shops/first-available?shopId=${shopId}`)
      .then(r => r.json())
      .then(d => setFa(d.date ? d : null))
      .catch(() => setFa(null));
  }, [shopId]);
  return fa;
}

const TR_MONTHS_SHORT = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];

export function fmtFirstAvail(date, time) {
  const todayStr    = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const tomorrowStr = new Date(Date.now() + 3 * 60 * 60 * 1000 + 86400000).toISOString().slice(0, 10);
  const d = new Date(date + "T12:00:00");
  const prefix = date === todayStr ? "Bugün" : date === tomorrowStr ? "Yarın" : `${d.getDate()} ${TR_MONTHS_SHORT[d.getMonth()]}`;
  return `${prefix} ${time}`;
}
