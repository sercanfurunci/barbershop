// Status constants for the barber appointment workflow.
// Imported by NextAppointmentCard, TimelineItem, BarberAppointmentsList, BarberCustomersView.

export const FLOW = [
  { key: "confirmed",  label: "Onaylandı",  shortLabel: "Onayla",  color: "#15803D", bg: "rgba(34,197,94,0.12)"  },
  { key: "completed",  label: "Tamamlandı", shortLabel: "Tamam",   color: "#57514B", bg: "rgba(107,104,112,0.12)" },
  { key: "noshow",     label: "Gelmedi",    shortLabel: "Gelmedi", color: "#111111", bg: "rgba(17,17,17,0.12)"  },
];

export const ALL_STATUS = {
  pending:         { label: "Bekleniyor",        color: "#B45309", bg: "rgba(245,158,11,0.1)"   },
  confirmed:       { label: "Onaylandı",          color: "#15803D", bg: "rgba(34,197,94,0.1)"    },
  "arrival-check": { label: "Varış Bekleniyor",   color: "#7C3AED", bg: "rgba(124,58,237,0.1)"   },
  "in-progress":   { label: "Devam Ediyor",       color: "#2563EB", bg: "rgba(96,165,250,0.1)"   },
  completed:       { label: "Tamamlandı",          color: "#57514B", bg: "rgba(107,104,112,0.1)" },
  noshow:          { label: "Gelmedi",             color: "#111111", bg: "rgba(17,17,17,0.1)"    },
  cancelled:       { label: "İptal",               color: "#52525b", bg: "rgba(82,82,91,0.1)"    },
};
