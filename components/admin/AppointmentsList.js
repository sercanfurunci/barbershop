"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, MoreVertical, Eye, Pencil, Trash2, ArrowRight, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useAppointments } from "@/contexts/AppointmentsContext";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLang } from "@/contexts/LanguageContext";
import { useT } from "@/lib/translations";
import { DSAvatar, DSEmptyState } from "@/components/ds";

function getStatusStyle(status) {
  const map = {
    confirmed:       { dot: "#2563EB", bg: "rgba(59,130,246,0.1)",    text: "#2563EB" },
    "arrival-check": { dot: "#7C3AED", bg: "rgba(124,58,237,0.1)",    text: "#7C3AED", pulse: true },
    "in-progress":   { dot: "#2563EB", bg: "rgba(37,99,235,0.12)",    text: "#2563EB", pulse: true },
    pending:         { dot: "#B45309", bg: "rgba(245,158,11,0.1)",    text: "#B45309" },
    completed:       { dot: "#15803D", bg: "rgba(34,197,94,0.1)",     text: "#15803D" },
    cancelled:       { dot: "#52525b", bg: "rgba(82,82,91,0.15)",     text: "#71717a" },
    noshow:          { dot: "#111111", bg: "rgba(17,17,17,0.1)",      text: "#111111" },
  };
  return map[status] || map.pending;
}

function StatusPill({ status, label }) {
  const s = getStatusStyle(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] text-[10px] font-medium tracking-[0.04em]"
      style={{ background: s.bg, color: s.text }}
    >
      <span
        className={`w-[5px] h-[5px] rounded-full shrink-0 ${s.pulse ? "animate-pulse" : ""}`}
        style={{ background: s.dot }}
      />
      {label}
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

  useEffect(() => { setPage(0); }, [search, statusFilter, barberId]);

  const allFiltered = appointments
    .filter((a) => {
      const q = search.toLowerCase();
      const match = a.client.toLowerCase().includes(q) || a.service.toLowerCase().includes(q) || a.barber.toLowerCase().includes(q);
      return match && (statusFilter === "all" || a.status === statusFilter) && (!barberId || a.barberId === barberId);
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));

  const totalPages = Math.max(1, Math.ceil(allFiltered.length / PAGE_SIZE));
  const rows = limit
    ? allFiltered.slice(0, limit)
    : allFiltered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="bg-card border border-border rounded-[14px] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap px-5 py-4 border-b border-border">
        <div>
          <span className="text-[13px] font-medium text-foreground">
            {limit ? apptTx.recent : apptTx.all}
          </span>
          <span className="text-[12px] text-muted-foreground ml-2">
            {apptTx.entries(rows.length)}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2 flex-wrap justify-end">
          {!limit && (
            <>
              <div className="flex items-center gap-2 px-3 h-8 bg-card border border-border rounded-[6px] w-40">
                <Search size={11} className="text-muted-foreground shrink-0" />
                <input
                  placeholder={apptTx.search}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-[12px] text-foreground"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatus(e.target.value)}
                className="outline-none bg-card border border-border rounded-[6px] px-2.5 h-8 text-[12px] text-secondary-foreground"
              >
                <option value="all">{apptTx.allStatus}</option>
                <option value="confirmed">{apptTx.status.confirmed}</option>
                <option value="arrival-check">{apptTx.status["arrival-check"]}</option>
                <option value="in-progress">{apptTx.status["in-progress"]}</option>
                <option value="pending">{apptTx.status.pending}</option>
                <option value="completed">{apptTx.status.completed}</option>
              </select>
            </>
          )}
          {limit && onViewAll && (
            <button
              onClick={onViewAll}
              className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {apptTx.viewAll} <ArrowRight size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden">
        {rows.map((appt, i) => {
          const statusLabel = apptTx.status[appt.status] || appt.status;
          return (
            <div
              key={appt.id}
              className="px-4 py-3.5"
              style={{ borderBottom: i < rows.length - 1 ? "1px solid var(--makas-border)" : "none" }}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <DSAvatar name={appt.client} size={32} shape="square" radius={6} />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-medium text-foreground">{appt.client}</span>
                      {appt.source === "manual" && (
                        <span className="text-[8px] px-1 py-px rounded-[3px] font-semibold tracking-[0.05em]"
                          style={{ background: "rgba(96,165,250,0.1)", color: "#2563EB", border: "1px solid rgba(96,165,250,0.2)" }}>
                          TEL
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{appt.service}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[15px] font-semibold text-foreground">
                    {appt.price == null ? "Sorulur" : `₺${appt.price.toLocaleString()}`}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-px font-mono-custom">{appt.time}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <StatusPill status={appt.status} label={statusLabel} />
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">{appt.barber}</span>
                  <span className="text-[11px] text-muted-foreground">{appt.date}</span>
                </div>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <DSEmptyState icon={Calendar} title={apptTx.empty} compact />
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              {apptTx.cols.map((h, i) => (
                <th
                  key={i}
                  className="px-4 py-2.5 text-left text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-normal whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((appt, i) => {
              const statusLabel = apptTx.status[appt.status] || appt.status;
              return (
                <motion.tr
                  key={appt.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="group border-b border-border hover:bg-secondary/40 transition-colors"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <DSAvatar name={appt.client} size={28} shape="square" radius={6} />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-medium text-foreground leading-snug">{appt.client}</span>
                          {appt.source === "manual" && (
                            <span className="text-[8px] px-1.5 py-px rounded-[3px] font-semibold tracking-[0.06em]"
                              style={{ background: "rgba(96,165,250,0.1)", color: "#2563EB", border: "1px solid rgba(96,165,250,0.2)" }}>
                              TEL
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono-custom leading-snug">
                          {appt.phone || appt.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[12px] text-secondary-foreground whitespace-nowrap">{appt.service}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[12px] text-secondary-foreground whitespace-nowrap">{appt.barber}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-[12px] text-foreground leading-snug">{appt.date}</p>
                    <p className="text-[10px] text-muted-foreground font-mono-custom leading-snug">{appt.time}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-display font-semibold text-[16px] text-foreground">
                      {appt.price == null ? "Sorulur" : `₺${appt.price.toLocaleString()}`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={appt.status} label={statusLabel} />
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="w-7 h-7 flex items-center justify-center rounded-[5px] opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:bg-secondary">
                        <MoreVertical size={14} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-[160px]">
                        {[
                          { label: "Onaylandı",          action: () => updateStatus(appt.id, "confirmed"),   icon: Eye },
                          { label: "Tamamlandı",          action: () => updateStatus(appt.id, "completed"),   icon: Pencil },
                          { label: "Gelmedi",             action: () => updateStatus(appt.id, "noshow"),      icon: Trash2 },
                          { label: apptTx.actions.cancel, action: () => updateStatus(appt.id, "cancelled"),   icon: Trash2 },
                        ].map(({ label, icon: Icon, action }) => (
                          <DropdownMenuItem
                            key={label}
                            onSelect={action}
                            className="flex items-center gap-2.5 cursor-pointer text-[12px]"
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
          <DSEmptyState icon={Calendar} title={apptTx.empty} compact />
        )}
      </div>

      {/* Pagination */}
      {!limit && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border">
          <span className="text-[11px] text-muted-foreground">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, allFiltered.length)} / {allFiltered.length}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-border text-muted-foreground disabled:opacity-40 hover:bg-secondary transition-colors"
            >
              <ChevronLeft size={12} />
            </button>
            <span className="text-[11px] text-muted-foreground min-w-12 text-center">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-border text-muted-foreground disabled:opacity-40 hover:bg-secondary transition-colors"
            >
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
