---
target: platform theme audit (4 surfaces)
total_score: 26
p0_count: 2
p1_count: 1
timestamp: 2026-06-10T23-37-09Z
slug: app-globals-css
---
# MAKAS Platform Theme Audit — Dark vs Light Luxury

Scope: Landing, Booking Flow, Admin Dashboard, Barber Dashboard. Screenshots in /tmp/makas-audit/.

## Design Health Score: 26/40 (Acceptable)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Stepper/chips/slot counts good; disabled-state hints at 1.5:1 invisible |
| 2 | Match System / Real World | 3 | Natural Turkish, ₺; "Soluk & Kıvrım" awkward literal translation |
| 3 | User Control and Freedom | 3 | Back-nav through stepper works; no edit-in-place from confirmation |
| 4 | Consistency and Standards | 2 | Two parallel token systems (globals.css vs per-component C objects); landing data ≠ DB data |
| 5 | Error Prevention | 2 | Past dates disabled; phone validated only on submit via toast |
| 6 | Recognition Rather Than Recall | 4 | Selection chips + sticky summary: textbook working-memory support |
| 7 | Flexibility and Efficiency | 3 | "Tercih Yok", hero quick-book, admin search |
| 8 | Aesthetic and Minimalist Design | 3 | Disciplined; undermined by illegible support text |
| 9 | Error Recovery | 2 | Generic "Bir hata oluştu" toasts |
| 10 | Help and Documentation | 1 | Microcopy only |

## Anti-Patterns Verdict

Borderline. Worst clichés (.red-glow, .noise-bg, .stripe-pattern) are defined in globals.css but unused. Tells: "Word + italic red word" headline formula repeated 9×, uppercase tracked red eyebrows above every section, emoji service icons. Detector: 5× side-tab accent borders (BarberDashboardClient.js:97,173; CalendarView.js:86,270; SettingsPage.js:183), 1× layout-property animation (AdminDashboard.js:830).

## Theme Fitness (contrast measured)

- #6B6660 muted on #080808 = 3.52:1 FAIL; on #111111 = 3.32:1 FAIL
- Booking C.muted #2e2d35 on #070707 = ~1.5:1 — hints, disclaimers, step descriptions effectively invisible
- #CC1A1A red text on black = 3.56:1 FAIL at small sizes
- #C8C4BC = 11.5:1 ✓; #F8F6F1 = 18.5:1 ✓

Per surface: Landing — dark is right (brand atmosphere), fix muted text. Booking — dark wrong default for outdoor mobile context unless contrast lifted. Admin — defensible on desktop but too dim (calendar grid near-invisible). Barber — worst fit: most glance-driven surface (bright salon) has dimmest hierarchy.

Proposed light palette (#F8F6F2 bg / #FFF surface / #F1EEE8 / #C62828 / #111): #111 text = ~17:1 ✓; #C62828 on white = 5.6:1 ✓; white on #C62828 = 5.6:1 ✓. AA passes trivially. Caveat: warm-cream body bg is the saturated 2026 AI default; carry warmth via type/imagery, keep muted text ≥4.5:1.

## Priority Issues

- [P0] Landing lies about prices: hardcoded lib/data.js (Klasik Kesim ₺650, 4.9·312 reviews) vs DB in booking (₺450, "5 · 0"). Trust-destroying.
- [P0] "Today" off by one day in admin calendar + barber dashboard (UTC/timezone bug): shows 10 Haziran BUGÜN on June 11.
- [P1] Contrast failures across all surfaces (see numbers above); cancellation reassurance at commitment moment is least legible text.
- [P2] Barber login picker truncates names on mobile, 4 identical red avatars.
- [P2] 23 undifferentiated time slots, no morning/afternoon grouping.

## Persona Red Flags

- Casey (mobile, sunlight): disabled Devam Et + 1.5:1 hint reads as dead end; progress shows 0% at step 1, 75% at final step, never 100%; fixed bottom CTA covers slot grid.
- Jordan (first-timer): price mismatch landing→booking; "5 · 0" reviews looks fabricated next to landing's "312 değerlendirme".
- Alex (admin): sidebar shows leftover dummy "Mehmet Yılmaz — Süper Admin"; wrong today; dim zero-state KPIs.

## Recommendation

Hybrid: keep dark (contrast-fixed) for customer-facing landing + booking; adopt light luxury theme for admin + barber dashboards. Dark IS the differentiator vs cheap local-business sites; the measured failures are contrast discipline, not theme choice. Operational surfaces used in bright daytime salon get the light theme.

## Minor Observations

- Success screen promises email; verify mailer exists.
- Consolidate per-component C color objects into CSS tokens.
- Emoji icons in DB services read cheap vs landing's line icons.
