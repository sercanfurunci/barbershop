// Shared constants for SettingsPage tab components

export const DAYS = [
  { key: "mon", label: "Pazartesi" },
  { key: "tue", label: "Salı"      },
  { key: "wed", label: "Çarşamba"  },
  { key: "thu", label: "Perşembe"  },
  { key: "fri", label: "Cuma"      },
  { key: "sat", label: "Cumartesi" },
  { key: "sun", label: "Pazar"     },
];

// Generate 30-min intervals 06:00–23:30
export const TIME_OPTIONS = (() => {
  const opts = [];
  for (let h = 6; h <= 23; h++) {
    for (let m = 0; m < 60; m += 30) {
      const val = h * 60 + m;
      opts.push({ value: val, label: `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}` });
    }
  }
  return opts;
})();

export function minToStr(min) {
  if (min == null) return "";
  return `${String(Math.floor(min / 60)).padStart(2,"0")}:${String(min % 60).padStart(2,"0")}`;
}
