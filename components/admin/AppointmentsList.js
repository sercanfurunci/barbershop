"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, MoreVertical, Eye, Pencil, Trash2, ArrowRight, Phone, ChevronLeft, ChevronRight } from "lucide-react";
import { useAppointments } from "@/contexts/AppointmentsContext";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLang } from "@/contexts/LanguageContext";
import { useT } from "@/lib/translations";

const C = {
  bg:        "#F7F4EE",
  card:      "#FFFFFF",
  border:    "#E5DED3",
  surface:   "#EFEAE2",
  primary:   "#111111",
  secondary: "#4A4A4A",
  muted:     "#8A8480",
  dim:       "#C5BEB5",
};

function getStatusStyle(status) {
  const map = {
    confirmed:     { dot: "#2563EB", bg: "rgba(59,130,246,0.1)",  text: "#2563EB" },
    "in-progress": { dot: "#111111", bg: "rgba(17,17,17,0.12)", text: "#111111", pulse: true },
    pending:       { dot: "#B45309", bg: "rgba(245,158,11,0.1)",  text: "#B45309" },
    completed:     { dot: "#15803D", bg: "rgba(34,197,94,0.1)",   text: "#15803D" },
    cancelled:     { dot: "#52525b", bg: "rgba(82,82,91,0.15)",   text: "#71717a" },
    noshow:        { dot: "#111111", bg: "rgba(17,17,17,0.1)",   text: "#111111" },
  };
  return map[status] || map.pending;
}

function Avatar({ name, size = 28 }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  const hue = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className="flex items-center justify-center font-medium shrink-0"
      style={{
        width: size, height: size,
        borderRadius: "6px",
        background: `hsl(${hue}, 30%, 22%)`,
        color: `hsl(${hue}, 60%, 70%)`,
        fontSize: size * 0.38,
        border: `1px solid hsl(${hue}, 30%, 28%)`,
      }}
    >
      {initials}
    </div>
  );
}

function StatusPill({ status, label, style }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1" style={{ background: style.bg, borderRadius: "5px" }}>
      <span
        className={style.pulse ? "animate-pulse" : ""}
        style={{ width: "5px", height: "5px", borderRadius: "50%", background: style.dot, display: "inline-block", flexShrink: 0 }}
      />
      <span style={{ fontSize: "10px", fontWeight: 500, color: style.text, letterSpacing: "0.04em" }}>{label}</span>
    </span>
  );
}

const PAGE_SIZE = 20;

export default function AppointmentsList({ limit, onViewAll, barberId }) {
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("all");
  const [page, setPage]           = useState(0);
  const { lang } = useLang();
  const tx = useT(lang);
  const apptTx = tx.admin.appointments;
  const { appointments, updateStatus, deleteAppointment } = useAppointments();

  // Reset page whenever filters change
  useEffect(() => { setPage(0); }, [search, statusFilter, barberId]);

  const allFiltered = appointments
    .filter((a) => {
      const q = search.toLowerCase();
      const match = a.client.toLowerCase().includes(q) || a.service.toLowerCase().includes(q) || a.barber.toLowerCase().includes(q);
      return match && (statusFilter === "all" || a.status === statusFilter) && (!barberId || a.barberId === barberId);
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));

  const totalPages = Math.max(1, Math.ceil(allFiltered.length / PAGE_SIZE));

  // limit prop → overview widget (no pagination); else → paginated full list
  const rows = limit
    ? allFiltered.slice(0, limit)
    : allFiltered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", overflow: "hidden" }}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div>
          <span style={{ fontSize: "13px", fontWeight: 500, color: C.primary }}>
            {limit ? apptTx.recent : apptTx.all}
          </span>
          <span style={{ fontSize: "12px", color: C.secondary, marginLeft: "8px" }}>
            {apptTx.entries(rows.length)}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2 flex-wrap justify-end">
          {!limit && (
            <>
              <div
                className="flex items-center gap-2 px-3 h-8"
                style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "6px", minWidth: 0, width: "160px" }}
              >
                <Search size={11} style={{ color: C.muted, flexShrink: 0 }} />
                <input
                  placeholder={apptTx.search}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent outline-none"
                  style={{ fontSize: "12px", color: C.primary, caretColor: C.primary }}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatus(e.target.value)}
                className="outline-none"
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: "6px",
                  padding: "0 10px",
                  height: "32px",
                  fontSize: "12px",
                  color: C.secondary,
                }}
              >
                <option value="all">{apptTx.allStatus}</option>
                <option value="confirmed">{apptTx.status.confirmed}</option>
                <option value="in-progress">{apptTx.status["in-progress"]}</option>
                <option value="pending">{apptTx.status.pending}</option>
                <option value="completed">{apptTx.status.completed}</option>
              </select>
            </>
          )}
          {limit && onViewAll && (
            <button
              onClick={onViewAll}
              className="flex items-center gap-1.5 transition-colors"
              style={{ fontSize: "12px", color: C.secondary }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.primary)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.secondary)}
            >
              {apptTx.viewAll} <ArrowRight size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden">
        {rows.map((appt, i) => {
          const statusStyle = getStatusStyle(appt.status);
          const statusLabel = apptTx.status[appt.status] || appt.status;
          return (
            <div
              key={appt.id}
              style={{ padding: "14px 16px", borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : "none" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Avatar name={appt.client} size={32} />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <div style={{ fontSize: "13px", color: C.primary, fontWeight: 500 }}>{appt.client}</div>
                      {appt.source === "phone" && (
                        <span style={{ fontSize: "8px", padding: "1px 4px", borderRadius: "3px", background: "rgba(96,165,250,0.1)", color: "#2563EB", border: "1px solid rgba(96,165,250,0.2)", letterSpacing: "0.05em", fontWeight: 600 }}>TEL</span>
                      )}
                    </div>
                    <div style={{ fontSize: "11px", color: C.secondary }}>{appt.service}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "15px", color: C.primary, fontWeight: 600 }}>₺{appt.price.toLocaleString()}</div>
                  <div style={{ fontSize: "10px", color: C.secondary, marginTop: "1px", fontFamily: "'DM Mono', monospace" }}>{appt.time}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <StatusPill status={appt.status} label={statusLabel} style={statusStyle} />
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "11px", color: C.muted }}>{appt.barber}</span>
                  <span style={{ fontSize: "11px", color: C.muted }}>{appt.date}</span>
                </div>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <div style={{ padding: "48px 16px", textAlign: "center" }}>
            <div style={{ fontSize: "28px", marginBottom: "8px", opacity: 0.3 }}>◎</div>
            <p style={{ fontSize: "13px", color: C.secondary }}>{apptTx.empty}</p>
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {apptTx.cols.map((h, i) => (
                <th
                  key={i}
                  style={{
                    padding: "10px 16px",
                    textAlign: "left",
                    fontSize: "10px",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: C.muted,
                    fontWeight: 400,
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((appt, i) => {
              const statusStyle = getStatusStyle(appt.status);
              const statusLabel = apptTx.status[appt.status] || appt.status;
              return (
                <motion.tr
                  key={appt.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="group"
                  style={{ borderBottom: `1px solid ${C.border}` }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = C.surface + "80")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={appt.client} />
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <div style={{ fontSize: "13px", color: C.primary, fontWeight: 500, lineHeight: 1.3 }}>{appt.client}</div>
                          {appt.source === "phone" && (
                            <span style={{ fontSize: "8px", padding: "1px 5px", borderRadius: "3px", background: "rgba(96,165,250,0.1)", color: "#2563EB", border: "1px solid rgba(96,165,250,0.2)", letterSpacing: "0.06em", fontWeight: 600 }}>
                              TEL
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "10px", color: C.muted, fontFamily: "'DM Mono', monospace", lineHeight: 1.3 }}>
                          {appt.phone || appt.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: "12px", color: C.secondary, whiteSpace: "nowrap" }}>{appt.service}</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: "12px", color: C.secondary, whiteSpace: "nowrap" }}>{appt.barber}</span>
                  </td>
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    <div style={{ fontSize: "12px", color: C.primary, lineHeight: 1.4 }}>{appt.date}</div>
                    <div style={{ fontSize: "10px", color: C.secondary, fontFamily: "'DM Mono', monospace", lineHeight: 1.4 }}>{appt.time}</div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span className="font-display font-light" style={{ fontSize: "16px", color: C.primary }}>₺{appt.price.toLocaleString()}</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <StatusPill status={appt.status} label={statusLabel} style={statusStyle} />
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: C.secondary, borderRadius: "5px" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = C.surface)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <MoreVertical size={14} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        style={{ background: "#FFFFFF", border: `1px solid ${C.border}`, borderRadius: "8px", minWidth: "160px" }}
                      >
                        {[
                          { label: "Onaylandı",      action: () => updateStatus(appt.id, "confirmed"),   icon: Eye,    danger: false },
                          { label: "Tamamlandı",     action: () => updateStatus(appt.id, "completed"),   icon: Pencil, danger: false },
                          { label: "Gelmedi",        action: () => updateStatus(appt.id, "noshow"),      icon: Trash2, danger: false },
                          { label: apptTx.actions.cancel, action: () => updateStatus(appt.id, "cancelled"), icon: Trash2, danger: true },
                        ].map(({ label, icon: Icon, danger, action }) => (
                          <DropdownMenuItem
                            key={label}
                            onSelect={action}
                            className="flex items-center gap-2.5 cursor-pointer"
                            style={{ padding: "7px 12px", fontSize: "12px", color: danger ? "#111111" : C.secondary, borderRadius: "5px" }}
                          >
                            <Icon size={12} />
                            {label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>

        {rows.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>◎</div>
            <p style={{ fontSize: "13px", color: C.secondary }}>{apptTx.empty}</p>
          </div>
        )}
      </div>

      {/* Pagination — only in full list mode */}
      {!limit && totalPages > 1 && (
        <div
          className="flex items-center justify-between"
          style={{ padding: "10px 16px", borderTop: `1px solid ${C.border}` }}
        >
          <span style={{ fontSize: "11px", color: C.muted }}>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, allFiltered.length)}{" "}
            / {allFiltered.length}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{
                width: 28, height: 28, borderRadius: 6,
                border: `1px solid ${C.border}`,
                background: page === 0 ? C.surface : C.card,
                color: page === 0 ? C.muted : C.secondary,
                cursor: page === 0 ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <ChevronLeft size={12} />
            </button>
            <span style={{ fontSize: "11px", color: C.secondary, minWidth: 48, textAlign: "center" }}>
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              style={{
                width: 28, height: 28, borderRadius: 6,
                border: `1px solid ${C.border}`,
                background: page === totalPages - 1 ? C.surface : C.card,
                color: page === totalPages - 1 ? C.muted : C.secondary,
                cursor: page === totalPages - 1 ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
