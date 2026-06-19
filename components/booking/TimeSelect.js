"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { tr as dateFnsTr, enUS } from "date-fns/locale";
import { apiFetch } from "@/lib/api";

const C = {
  bg: "#F7F4EE", bgSoft: "#FDFBF7", surface: "#EFEAE2", card: "#FFFFFF",
  border: "#E5DED3", primary: "#111111", secondary: "#4A4A4A", muted: "#8A8480", dim: "#C5BEB5",
};

function SlotSkeleton({ count = 12 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", padding: "8px 16px 16px" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            height: "54px", background: C.surface, borderRadius: "10px",
            animation: "pulse 1.4s ease-in-out infinite",
            animationDelay: `${i * 0.06}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function TimeSelect({ shopId, booking, allBarbers = [], onSelect, lang = "tr" }) {
  const [slots, setSlots]             = useState([]);
  const [slotBarberMap, setSlotBarberMap] = useState({});
  const [loading, setLoading]         = useState(false);
  const locale = lang === "tr" ? dateFnsTr : enUS;

  useEffect(() => {
    if (!shopId || !booking.date || !booking.barber || !booking.service) return;
    const serviceId = booking.service.id;
    const isAny    = booking.barber.id === "any";
    const dateStr  = format(booking.date, "yyyy-MM-dd");
    const base     = `shopId=${shopId}&serviceId=${serviceId}&date=${dateStr}`;

    setLoading(true);
    setSlots([]);
    setSlotBarberMap({});

    if (!isAny) {
      apiFetch(`/api/availability?${base}&barberId=${booking.barber.id}`)
        .then((data) => setSlots(data.slots ?? []))
        .catch(() => setSlots([]))
        .finally(() => setLoading(false));
    } else {
      const barberList = allBarbers.filter((b) => b.available);
      if (barberList.length === 0) { setLoading(false); return; }
      Promise.all(
        barberList.map((b) =>
          apiFetch(`/api/availability?${base}&barberId=${b.id}`)
            .then((data) => ({ barberId: b.id, slots: data.slots ?? [] }))
            .catch(() => ({ barberId: b.id, slots: [] }))
        )
      ).then((results) => {
        const map = {};
        for (const { barberId, slots: s } of results) {
          for (const slot of s) {
            if (!map[slot]) map[slot] = barberId;
          }
        }
        setSlotBarberMap(map);
        setSlots(Object.keys(map).sort());
      }).finally(() => setLoading(false));
    }
  }, [booking.date, booking.barber?.id, booking.service?.id]);

  const handleSlotClick = (slot) => {
    let resolvedBarber = null;
    if (booking.barber?.id === "any" && slotBarberMap[slot]) {
      const b = allBarbers.find((barb) => barb.id === slotBarberMap[slot]);
      if (b) resolvedBarber = b;
    }
    onSelect(slot, resolvedBarber);
  };

  const dateLabel = booking.date
    ? format(booking.date, "EEEE, d MMMM", { locale })
    : "";

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Date chip header */}
      <div style={{ padding: "12px 16px 8px", flexShrink: 0 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "7px",
          padding: "7px 14px",
          background: C.card, border: `1px solid ${C.border}`, borderRadius: "20px",
          fontSize: "12px", color: C.secondary, fontWeight: 500,
        }}>
          <span style={{ color: C.primary, fontSize: "13px" }}>◷</span>
          {dateLabel}
        </div>
        {!loading && slots.length > 0 && (
          <span style={{ marginLeft: "8px", fontSize: "11px", color: C.muted }}>
            {slots.length} {lang === "tr" ? "uygun saat" : "available times"}
          </span>
        )}
      </div>

      {/* Slots */}
      <div style={{ flex: 1, overflowY: "auto" }} className="no-scrollbar">
        {loading ? (
          <SlotSkeleton count={12} />
        ) : slots.length === 0 ? (
          <div style={{ padding: "56px 24px", textAlign: "center", fontSize: "14px", color: C.muted }}>
            {lang === "tr" ? "Bu tarihte müsait saat bulunamadı" : "No available times on this date"}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", padding: "4px 16px 16px" }}>
            {slots.map((slot) => (
              <button
                key={slot}
                onClick={() => handleSlotClick(slot)}
                style={{
                  height: "54px", borderRadius: "10px",
                  border: `1px solid ${C.border}`,
                  background: C.card, color: C.primary,
                  fontSize: "14px", fontWeight: 500,
                  cursor: "pointer", transition: "all 0.12s",
                }}
                onTouchStart={(e) => {
                  e.currentTarget.style.background = C.surface;
                  e.currentTarget.style.borderColor = C.primary;
                  e.currentTarget.style.color = C.primary;
                }}
                onTouchEnd={(e) => {
                  e.currentTarget.style.background = C.card;
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.color = C.primary;
                }}
              >
                {slot}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
