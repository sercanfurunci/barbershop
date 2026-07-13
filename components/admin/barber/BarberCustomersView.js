"use client";

import { Phone, Users, X } from "lucide-react";
import { useState, useMemo } from "react";
import { C } from "@/lib/adminTheme";
import { todayStr } from "@/lib/utils";
import { toTelHref } from "@/lib/validation";

export function BarberCustomersView({ barberId, appointments, onNewBooking }) {
  const [search, setSearch] = useState("");

  const { customerMap, customers } = useMemo(() => {
    const customerMap = appointments
      .filter(a => a.barberId === barberId && a.status !== "cancelled")
      .reduce((acc, a) => {
        const key = a.client;
        if (!acc[key]) acc[key] = { name: a.client, phone: a.phone || "", visits: [], totalSpent: 0 };
        acc[key].visits.push(a);
        if (a.status === "completed") acc[key].totalSpent += a.price || 0;
        return acc;
      }, {});

    const sorted = Object.values(customerMap)
      .map(c => ({
        ...c,
        lastVisit: [...c.visits].sort((a, b) => b.date.localeCompare(a.date))[0],
        completedCount: c.visits.filter(v => v.status === "completed").length,
      }))
      .sort((a, b) => (b.lastVisit?.date || "").localeCompare(a.lastVisit?.date || ""));

    return { customerMap, customers: sorted };
  }, [appointments, barberId]);

  const filtered = useMemo(() =>
    !search
      ? customers
      : customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)),
    [customers, search]
  );

  const initials = (name) => name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const hue      = (name) => name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  const today    = todayStr();

  return (
    <div>
      {/* Header + search */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <span style={{ fontSize: "10px", color: C.muted, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Müşteriler · {Object.keys(customerMap).length}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "0 12px", height: "44px" }}>
          <Users size={13} style={{ color: C.muted, flexShrink: 0 }} />
          <input
            placeholder="İsim veya telefon ara…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: "13px", color: C.primary, caretColor: C.primary }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex" }}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "28px", marginBottom: "10px", opacity: 0.2 }}>👤</div>
          <div style={{ fontSize: "13px", color: C.secondary }}>
            {search ? "Eşleşen müşteri bulunamadı" : "Henüz müşteri yok"}
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {filtered.map((c) => {
          const h = hue(c.name);
          const lastAppt = c.lastVisit;
          const isRegular = c.completedCount >= 3;
          const isNew = lastAppt && lastAppt.date >= today;
          return (
            <div
              key={c.name}
              style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "14px 16px" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {/* Avatar */}
                <div style={{
                  width: "44px", height: "44px", borderRadius: "12px", flexShrink: 0,
                  background: `hsl(${h}, 28%, 18%)`,
                  border: `1px solid hsl(${h}, 28%, 26%)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "14px", fontWeight: 700, color: `hsl(${h}, 60%, 68%)`,
                }}>
                  {initials(c.name)}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                    <span style={{ fontSize: "14px", color: C.primary, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.name}
                    </span>
                    {isRegular && (
                      <span style={{ fontSize: "8px", padding: "1px 5px", borderRadius: "3px", background: "rgba(34,197,94,0.12)", color: "#15803D", border: "1px solid rgba(34,197,94,0.2)", fontWeight: 700, flexShrink: 0 }}>
                        SADIK
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {c.phone && (
                      <span style={{ fontSize: "11px", color: C.secondary, fontFamily: "'DM Mono', monospace" }}>{c.phone}</span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "14px", color: C.primary, fontWeight: 700 }}>₺{c.totalSpent.toLocaleString()}</div>
                  <div style={{ fontSize: "10px", color: C.muted, marginTop: "2px" }}>{c.completedCount} ziyaret</div>
                </div>
              </div>

              {/* Last appointment + quick call */}
              {lastAppt && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "10px", paddingTop: "10px", borderTop: `1px solid ${C.border}` }}>
                  <div>
                    <span style={{ fontSize: "10px", color: C.muted }}>Son ziyaret: </span>
                    <span style={{ fontSize: "10px", color: C.secondary }}>
                      {lastAppt.date} · {lastAppt.service}
                    </span>
                  </div>
                  {toTelHref(c.phone) && (
                    <a
                      href={toTelHref(c.phone)}
                      style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px", borderRadius: "10px", background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)", fontSize: "11px", color: "#2563EB", textDecoration: "none", fontWeight: 600 }}
                    >
                      <Phone size={11} /> Ara
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BarberCustomersView;
