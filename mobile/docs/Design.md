# LESEN Mobile — Design System («طراحی مأمور گشت»)

Authoritative UI/UX specification for the LESEN patrol-officer mobile app. Every screen change must conform to this document. Product backlog: `docs/TODO.md`; next-task prompt: `docs/CONTINUE.md`.

Sources: the four PDF references in `mobile/ignoreAssets/` (login, Home dashboard, incident location picker, accident-form structure), mission-critical field-app UX research (ambulance dispatch, fire-service RTS, responder platforms), Material 3 bidirectionality guidance, Apple Arabic-design guidance, and the 2026 mobile design review.

---

## 1. Decision log

| Decision | Choice | Notes |
|---|---|---|
| Visual direction | **Refined Teal Ops** | Evolve the existing unwritten teal system (`#087f8c`) into a polished, calm, operational identity. Low-risk: the palette is already de-facto standard across screens. |
| Icons | **@expo/vector-icons multi-family** | Already installed; ships Ionicons, MaterialCommunityIcons, Feather. Zero new native deps; SDK-57-safe. Semantic icon-map layer on top (`src/constants/icon-map.ts`). |
| Dark mode | **Light-only for v1** | Sunlight-first field tool. `ThemedText`/`useTheme`/root layout are locked to light so hardcoded light surfaces never get white text. Token architecture stays dark-ready. |
| Login identity | **Email input** | Backend contract `user.login` is email-based. The PDF's numeric «کد پرسنلی» idea is recorded as a pending product/backend decision (see §10.1). |

---

## 2. Design principles — «Calm Operator»

The user is an amateur patrol officer under stress, often in sunlight, gloves, or a moving vehicle. The interface must be understandable without training.

1. **Glanceable in 2 seconds.** Home answers: who am I, which unit/vehicle, what shift, GPS/internet/sync status, where do I tap.
2. **One hero action per screen.** Register Incident on Home. Confirm Location on the map. Next on the wizard. Everything else is secondary.
3. **Never block fieldwork.** Offline never disables registration, drafts, media, GPS. CTAs degrade with a notice, never disappear.
4. **Forgiving UI.** Autosave everywhere; confirm destructive/emergency actions; errors offer recovery actions; nothing dead-ends.
5. **Minimize typing.** Chips/pickers over free text, photo over description, smart defaults, numeric keyboards for numerals.
6. **Speak human Persian.** Friendly translated messages only; raw backend errors never reach the UI. Persian digits in display values; API values stay numeric.
7. **Sunlight-first legibility.** WCAG-AA minimum contrast, no faint gray body text outdoors, ≥44–48dp touch targets, one-handed reach for primary controls.
8. **Calm motion.** 150–300 ms transitions that clarify cause/effect; respect reduced-motion; no decoration-only animation.

---

## 3. Color tokens

Defined once in `src/constants/theme.ts` (`AppTheme`). Screens never declare hex literals; they consume tokens. (Legacy inline hexes are replaced mechanically per-phase.)

### 3.1 Brand & surfaces (light theme, locked)

| Token | Value | Usage |
|---|---|---|
| `primary` | `#087f8c` | Primary buttons, active tab, links, progress fill, selected chips |
| `primaryStrong` | `#066671` | Pressed primary, small-text links on light bg |
| `primarySoft` | `#e5f3f4` | Selected-chip bg, tinted cards, avatar bg |
| `primaryBorder` | `#b8dee2` | Border of selected/tinted elements |
| `onPrimary` | `#ffffff` | Text/icons on primary fills |
| `onPrimaryMuted` | `#d8f1f3` | Subtle text on primary fills (CTA hints) |
| `background` | `#f4f7f9` | App background |
| `surface` | `#ffffff` | Cards, sheets, bars |
| `surfaceMuted` | `#f0f3f6` | Nested blocks inside cards |
| `surfaceSunken` | `#eaeff2` | Wells, skeleton tracks |
| `textStrong` | `#123248` | Headings, emphasized values |
| `textBody` | `#294858` | Body copy |
| `textSecondary` | `#607482` | Labels, secondary copy |
| `textFaint` | `#90a4ae` | Timestamps, placeholders only (never body text) |
| `border` | `#e3eaee` | Card borders, dividers, tracks |
| `borderStrong` | `#d6e0e5` | Input/chip borders |
| `hairline` | `#eef3f5` | Row separators inside cards |
| `overlayScrim` | `rgba(0,0,0,0.55)` | Modal backdrops |

### 3.2 Status tones (bg / border / text triplets)

Every status is rendered with its full triplet plus an icon — color is never the only signal (accessibility).

| Tone | bg | border | text/icon | Meaning in LESEN |
|---|---|---|---|---|
| `success` | `#e5f5ef` | `#c2e5d4` | `#217a5b` | آنلاین، GPS دقیق، همگام‌شده، تأییدشده، شیفت فعال |
| `warning` | `#fff8ec` | `#f0d9a8` | `#b45309` (deep `#7c5b12`) | اتصال ضعیف، GPS ضعیف، نزدیک پایان شیفت، خارج از محدوده، برگشت برای اصلاح |
| `danger` | `#fff0f0` | `#f5cccc` | `#b33a3a` | آفلاین (critical contexts)، خطا، رد‌شده، وضعیت اضطراری، شیفت خارج‌شده |
| `info` | `#e8f1fa` | `#c5dcf1` | `#2569a8` | در حال بررسی، پیام مرکزی، راهنما |
| `neutral` | `#eef3f5` | `#e3eaee` | `#607482` | پیش‌نویس، ارسال‌شده، پایان شیفت، غیرفعال |

Rules:
- Offline connectivity is shown `neutral`/`danger` contextually, but **never disables actions** (§2.3).
- Draft/queue status chips must reflect true state (`draft` neutral, `queued` info, `syncing` primary, `synced` success, `rejected` danger) — fixes today's always-green bug.
- Badges (counts) are `danger` red for announcements, `primary` for drafts, hidden when count = 0, capped at «+۹۹».

---

## 4. Typography (Estedad)

Loaded at root (`Estedad-Regular/Medium/SemiBold/Bold/ExtraBold`). One type scale; no ad-hoc sizes.

| Role | Size/Line | Weight | Usage |
|---|---|---|---|
| `display` | 28/38 | ExtraBold | Page titles (Home greeting, login title) |
| `heading` | 20/30 | Bold | Card titles, sheet titles |
| `subheading` | 17/26 | SemiBold | Section titles, list-row titles |
| `body` | 15/24 | Medium | Default copy |
| `bodyStrong` | 15/24 | Bold | Emphasized values |
| `caption` | 13/19 | Regular | Secondary copy, hints |
| `micro` | 11/16 | Medium | Tab labels, badges, footnotes |

Rules:
- Persian text always `textAlign: 'right'`; layouts flow RTL (`flexDirection: 'row-reverse'` or logical equivalents).
- Numbers displayed with `toLocaleString('fa-IR')`; identifiers (report IDs, coords, plates) render as LTR islands and stay machine-format.
- Latin/numeric-only inputs keep LTR alignment inside RTL forms.

---

## 5. Layout, spacing, shape, depth

### 5.1 Spacing (4pt grid)
`xs 4 · sm 8 · md 12 · lg 16 · xl 24 · xxl 32`. Screen gutters 24; intra-card gap 12–16; section gap 20–24.

### 5.2 Radius vocabulary (fixed set)

| Token | px | Usage |
|---|---|---|
| `sm` | 10 | Small chips, thumbnails, inner wells |
| `md` | 14 | Buttons, inputs |
| `lg` | 16 | Cards |
| `xl` | 24 | Sheets (top corners), hero blocks |
| `pill` | 999 | Status pills, badges, round buttons |

### 5.3 Elevation

| Level | Style | Usage |
|---|---|---|
| `flat` | none | Nested blocks |
| `card` | soft ambient (`#123248` @ 6% blur 12 / elevation 1) | Cards |
| `floating` | stronger (`#123248` @ 14% blur 20 / elevation 6) | Map controls, FAB, sheets, toasts |

### 5.4 Touch targets & reach
- Minimum interactive area 44×44 dp (buttons 48–56 high).
- Primary CTA: full-width, height ≥56, bottom-anchored on workflow screens.
- Thumb zone: primary actions live in the bottom third; destructive/rare actions away from primary CTA.
- Zoom/map control clusters stay one-sided, stacked, ≥48 dp circles.

---

## 6. Iconography

### 6.1 System

- Single wrapper `src/components/ui/icon.tsx`: `<Icon family="ion"|"md"|"feather" name size color />`.
- Central semantic registry `src/constants/icon-map.ts` (`AppIcons.*`) — screens reference semantics, not raw glyphs, so a family swap never touches screens.
- Families: **Ionicons** (chrome/nav/actions), **MaterialCommunityIcons** (domain richness: weather, vehicles, road assets, roles), **Feather** (minimal utility).
- Default size 22 (inline), 20 (list rows), 24–28 (section headers), 48 (empty states).
- Style: outline for resting state, filled for active/selected where the family provides pairs.
- ⚠️ Exact glyph names must be checked against the installed `@expo/vector-icons` glyph maps when wiring a screen; fall back to the nearest Ionicons equivalent if a name is missing. Any option without a clear glyph uses a neutral bullet (`ellipse-outline` / `dots-horizontal`) — never a wrong metaphor.

### 6.2 Navigation & shell

| Semantic | Glyph (family) | Persian label |
|---|---|---|
| tab.reports | `document-text(-outline)` (ion) | گزارش‌ها |
| tab.announcements | `notifications(-outline)` (ion) | اعلان‌ها |
| tab.home | `home(-outline)` (ion) | خانه |
| tab.map | `map(-outline)` (ion) | نقشه |
| tab.more | `ellipsis-horizontal(-outline)` (ion) | بیشتر |
| nav.back | `arrow-forward` (ion) — RTL: back points right | بازگشت |
| nav.chevron | `chevron-forward` rotated for RTL disclosure (points left) | — |
| action.logout | `log-out-outline` (ion) | خروج از حساب |
| action.refresh | `refresh` (ion) | به‌روزرسانی |
| action.settings | `settings-outline` (ion) | تنظیمات |
| action.help | `help-circle-outline` (ion) | راهنما |
| action.support | `headset-outline` (md) | پشتیبانی |
| action.close | `close` (ion) | بستن |

### 6.3 Status & connectivity

| Semantic | Glyph (family) | Tone |
|---|---|---|
| status.online | `cloud-online`→fallback `wifi` (ion) | success |
| status.offline | `cloud-offline` (ion) | neutral/danger ctx |
| status.gps.ok | `location` (ion) | success |
| status.gps.weak | `location-outline` (ion) | warning |
| status.gps.off | `location-off`→fallback `navigate-off` style `md compass-off`→`ion location` struck | danger |
| sync.draft | `create-outline` (ion) | neutral |
| sync.queued | `time-outline` (ion) | info |
| sync.syncing | `sync` (ion, rotates while syncing) | primary |
| sync.synced | `checkmark-circle` (ion) | success |
| sync.rejected | `close-circle` (ion) | danger |
| sync.failed | `alert-circle` (ion) | danger |

### 6.4 Home dashboard

| Semantic | Glyph (family) |
|---|---|
| home.registerIncident | `add-circle` (ion) |
| home.emergency | `siren` (md) |
| home.shift | `clock-time-four-outline` (md) |
| home.unit | `shield-checkmark-outline` (ion) |
| home.vehicle | `car-side` (md) |
| home.drafts | `folder-open-outline` (ion) |
| home.myReports | `documents-outline` (ion) |
| home.announcements | `megaphone-outline` (md) |
| home.mapShortcut | `navigation-outline` (ion) |
| home.profile | `person-circle-outline` (ion) |
| home.lastSync | `cloud-done-outline` (ion) |
| home.mapOfflinePack | `map-download`→fallback `cloud-download-outline` (ion) |

### 6.5 Location picker & map

| Semantic | Glyph (family) |
|---|---|
| map.pinIncident | `location` (ion) filled, brand teal, drop-shadow |
| map.pinOfficer | `radio-button-on` ring + `person` (ion), info-blue |
| map.zoomIn / zoomOut | `add` / `remove` (ion) |
| map.locateMe | `locate` (ion) |
| map.layers | `layers-outline` (ion) |
| map.route | `route-md` (md `google-maps`→fallback `directions-fork`→`ion git-branch-outline`) |
| map.distance | `resize`→fallback `swap-horizontal` (ion) |
| map.accuracy | `pulse-outline` (ion) |
| map.confirmLocation | `checkmark` (ion) inside primary CTA |

### 6.6 Accident wizard phases

| Phase | Glyph (family) |
|---|---|
| ۱ اطلاعات پایه | `clipboard-outline` (ion) |
| ۲ طبقه‌بندی تصادف | `tag-outline` (ion) |
| ۳ پلیس و کروکی | `police-badge-outline` (md) |
| ۴ وسایل نقلیه | `car-outline` (ion) |
| ۵ افراد و تلفات | `people-outline` (ion) |
| ۶ محیط و راه | `road-variant` (md) |
| ۷ خسارت تأسیسات | `hammer-wrench` (md) |
| meta.autoFilled | `lock-closed-outline` (ion) — read-only marker |
| meta.editLocation | `location-outline` (ion) |

Severity: خسارتی `car-wrench`(md)·neutral، جرحی `medkit`(md)·warning، فوتی `coffin`(md)·danger.
Collision types: وسیله‑وسیله `car-multiple`(md)؛ موتورسیکلت `motorbike`(md)؛ عابر `walk`(md)؛ دوچرخه `bike`(md)؛ شیء ثابت `traffic-cone`؟fallback `octagon`(ion)؛ واژگونی `rotate-left`(ion)؛ خروج از مسیر `arrow-decision-outline`(md)؛ سقوط از پل `bridge`(md)+down؛ چندبرخوردی `car-multiple`+badge؛ حیوان `paw`(md)؛ نامشخص `help-circle-outline`(ion).
Police: حضور پلیس `police-badge`(md)؛ پاسگاه `office-building-outline`(ion)؛ کروکی سازشی `handshake-outline`(md)؛ غیرسازشی `gavel`(md).

Vehicle types: سواری `car-side`(md)، وانت `car-pickup`(md)، کامیون `truck`(md)، کشنده `truck-trailer`(md)، اتوبوس `bus`(md)، مینی‌بوس `bus-school`؟fallback `bus`(md)، موتورسیکلت `motorbike`(md)، ماشین‌آلات راهسازی `excavator`(md)، آمبولانس/امردادی `car-emergency`(md)، سایر `dots-horizontal`(ion).

Person roles: راننده `steering`(md)؟fallback `account`(md)، سرنشین `seat-passenger`؟fallback `account`(md)، عابر `walk`(md)، موتورسوار `motorbike`(md)، دوچرخه‌سوار `bike`(md)، نیروی امردادی `account-hard-hat`؟fallback `account`(md).
Injury status: بدون آسیب `checkmark-circle`(ion)، جزئی `bandage`(md)، جدی `heart-pulse`(md)، بحرانی `alert-octagon`(md)، فوت در محل `coffin`(md)، فوت پس از انتقال `coffin-outline`(md)؟fallback same، نامشخص `help-circle-outline`(ion).

### 6.7 Environment observations (phase 6)

| Domain | Options → glyphs (md unless noted) |
|---|---|
| جو | صاف `weather-sunny`، ابری `weather-cloudy`، بارانی `weather-rainy`، مه‌آلود `weather-fog`، گردوغبار `weather-hazy`؟fallback `weather-dust`، باد شدید `weather-windy`، سایر `dots-horizontal`(ion) |
| روشنایی | روز `white-balance-sunny`، طلوع `weather-sunset-up`، غروب `weather-sunset-down`، شب کافی `weather-night`، شب ناکافی `lightbulb-off` |
| سطح راه | خشک `water-off`، مرطوب `water-percent`، خیس `water`، آبگرفته `waves`، لغزنده `snowflake-melt`؟fallback `alert`، روغن/مواد `oil`؟fallback `drop`، شن/خاک `shovel`؟fallback `dots-horizontal`، نامشخص `help-circle-outline`(ion) |
| هندسه | مستقیم `arrow-right`(ion) mirrored، قوس `angle-obtuse`، شیب فراز `slope-uphill`، شیب فرود `slope-downhill`، پل `bridge`، تونل `tunnel`، رمپ `stairs-down`؟fallback، عوارضی `boom-gate`، راهسازی `construction`، تقاطع `call-split`(ion)، شانه راه `road-variant` |
| نواقص | روسازی `road-variant`، خط‌کشی `format-line-spacing`؟fallback، تابلو `sign-text`؟fallback `sign-caution`، روشنایی `lightbulb-off`، گاردریل `fence`، حفاظ `shield-off`(ion)؟fallback، مانع حریم `block-helper`، آبگرفتگی `waves`، دید `eye-off`(ion)، بدون نقص `checkmark-circle`(ion)، سایر `dots-horizontal`(ion) |

### 6.8 Facility damage (phase 7)

گاردریل `fence`، نیوجرسی `wall`، تابلو `sign-text`؟fallback `sign-caution`، پایه تابلو `sign-post`، پایه روشنایی `outdoor-lamp`؟fallback `lightbulb-on`، چراغ روشنایی `lightbulb-on`، فنس `fence`، دوربین `cctv`، تجهیزات عوارضی `boom-gate`، روسازی `road-variant`، پل/آبرو `bridge`، سایر `dots-horizontal`(ion).
Actions/flags: خطر فوری `flash-alert`؟fallback `alert`(ion)، نیاز به تعمیر `hammer-wrench`، اقدام موقت `tools`.

### 6.9 Media categories

پلاک `card-account-details-outline`(md)، بیمه‌نامه `shield-check-outline`(md)؟fallback `file-document-outline`(md)، کروکی `compass-drawing`؟fallback `draw`(md)، خسارت `car-brake-alert`؟fallback `alert`(ion)، camera capture `camera`(ion)، gallery `images`(ion)، preview `eye-outline`(ion)، replace `sync`(ion)، delete `trash-outline`(ion).

### 6.10 Announcements priority

فوری `alert-decagram`(md)·danger، مهم `flag`(ion)·warning، عادی `information-circle-outline`(ion)·neutral.

---

## 7. Component library (`src/components/ui/`)

All primitives consume §3–§5 tokens. No screen defines its own button/card/pill again.

| Component | Variants / API | Behavior contract |
|---|---|---|
| `Button` | `solid \| soft \| outline \| ghost \| danger`; sizes `md(48) lg(56)`; `loading`, `icon`, `fullWidth`, `disabled` | Loading swaps content w/ spinner; pressed = `primaryStrong`/opacity .85; disabled = 40% opacity, no press; min touch 44 |
| `IconButton` | circular 48, tone | Same feedback contract |
| `Card` | `flat \| outlined`; optional `header{icon,title,action}` | Surface bg, radius-lg, hairline separators inside |
| `ListRow` | leading icon, title, subtitle, trailing (`value \| badge \| chevron`) | Chevron points **left** (RTL disclosure); pressed highlight; ≥56 high |
| `ChoiceChip` | selected state, optional icon, optional check | Selected: `primarySoft` bg + `primaryBorder` + check; unselected: surface + `borderStrong`; ≥44 high |
| `StatusPill` | tone ∈ §3.2, dot or icon + label | Full triplet coloring; never color-only |
| `Badge` | `count \| dot` | Hidden at 0; cap «+۹۹»; Persian digits |
| `Banner` | tones §3.2; icon; optional action | Inline status communication (offline notice, zone warning, retry offers) |
| `Toast` | tones success/info/error; `useToast()` | Auto-dismiss ~3 s; floats above tab bar; non-blocking |
| `Skeleton` | line/card/list presets | Opacity pulse; replaces spinners for lists/detail loads |
| `EmptyState` | icon-in-soft-circle, title, description, optional action | Used by all lists (reports, drafts, announcements, search) |
| `SectionHeader` | icon + title + optional action link | Consistent card-group labeling |
| `StepperHeader` | 7 steps, icons + labels, progress bar | Progress animates width 200 ms; step chips: done=check, current=filled, upcoming=outline |
| `Sheet` (bottom) | grabber, title, content, actions | Radius-xl top; scrim tap closes; used for Emergency confirm, snap confirm, filters |
| `ConfirmDialog` | title, message, confirm/danger styles | Required for logout, delete draft, delete pack, emergency send |
| `FieldLabel` / `FormInput` | error state, hint, optional LTR-numeric mode | Focus ring `primaryBorder` 2px; error `danger`; numeric mode forces `keyboardType` + LTR island |
| `ScreenHeader` | back, title, action slot | Standard secondary-screen header; back = `arrow-forward` (RTL) |
| `MapControls` | zoom±, locate, optional layers | Shared by Map tab + location picker (removes duplication); left-edge column, 48 dp circles, floating shadow |

Feedback contract (all interactive primitives): visible pressed state, `accessibilityRole`, `accessibilityLabel` in Persian, disabled visuals, haptics added in the motion pass (Phase 7) if `expo-haptics` is adopted.

---

## 8. RTL mirror matrix

| Mirror in RTL | Never mirror |
|---|---|
| Back arrows (`arrow-forward` = back), disclosure chevrons (point left), steppers & progress direction (right→left), carousel/swipe direction, drawer side, timeline order | Clocks, media controls, checkmarks/close, phone numbers, coordinates, plate numbers (LTR islands), logos, symmetric glyphs (search/home/settings) |
| Layout flows `row-reverse`; focal edge = right | Charts/time-series stay LTR |

---

## 9. Screen specifications

### 9.1 Login `/login`
Vertical rhythm: brand block (logo 88, سامانه مدیریت و ثبت وقایع آزادراه as eyebrow, ورود مأمور گشت as display title) → connectivity chip (آنلاین success / آفلاین neutral + note) → form card (email input w/ `mail` icon, password w/ eye toggle icon-button, inline validation) → primary CTA ورود به سامانه (lg, loading state) → رمز عبور را فراموش کرده‌اید؟ ghost link → footer: نسخه + مشکل در ورود؟ تماس با پشتیبانی. Errors as `danger` banner with icon. First-login-offline message per product copy. No shift/GPS/vehicle data here (PDF rule).

### 9.2 Home `/(tabs)/index`
Order top→bottom:
1. **Identity header**: greeting سلام {name} + role caption; avatar right (photo → initials fallback on `primarySoft`); logout icon-button left.
2. **Unit/vehicle strip**: single tinted card — واحد گشت + خودرو (from active shift, auto-updates), icons `shield`/`car-side`.
3. **Status trio**: three equal cards — شیفت کاری (`success` فعال / `warning` نزدیک پایان / `neutral` پایان یافته، خارج از شیفت / `neutral` اطلاعات دریافت نشده), اینترنت (`success` آنلاین / `warning` ضعیف / `neutral` آفلاین), GPS (دقیق/متوسط/ضعیف/در دسترس نیست + accuracy meters; tapping runs recovery `GpsActionButton` flow).
4. **Sync row**: آخرین همگام‌سازی … + pending-count hint («۳ گزارش در انتظار ارسال خودکار») + refresh icon-button.
5. **Hero CTA ثبت واقعه جدید**: largest element, subtitle ثبت تصادف، خرابی یا رخداد آزادراه, icon `add-circle`; **never disabled offline**; when offline shows inline `warning` banner: شما آفلاین هستید؛ اطلاعات روی دستگاه ذخیره و پس از اتصال ارسال می‌شود.
6. **اعلام وضعیت اضطراری**: `danger`-accented button → confirmation **Sheet**: «آیا درخواست وضعیت اضطراری ارسال شود؟» showing officer/unit/vehicle/location/time + دکمه ارسال درخواست فوری (danger). No silent sends.
7. **Quick access grid (2×2)**: پیش‌نویس‌ها (count badge, primary tone), گزارش‌های من (returned-for-correction highlighted), اعلان‌ها (unread badge red), نقشه.
8. **Offline map pack card** (existing behavior, restyled with `map.pack` icon + progress).
Pull-to-refresh refreshes shift/context/reports/announcements. Startup renders cache-first, refreshes in background.

### 9.3 Location picker `/incident/location`
Full-bleed map; center fixed pin (incident, teal, subtle pulse animation) distinct officer marker legend chip; GPS accuracy pill top (tone by quality); zoom/locate cluster via `MapControls`; OSM attribution kept; bottom Sheet (grabber) updating live: route, direction (with manual-correction affordance), km+meter, distance to officer (warn if far), coords as micro text; snap suggestion appears as confirm dialog («۱۸ متر با آزادراه فاصله دارد؛ انتقال به نزدیک‌ترین موقعیت؟») — never silent; out-of-zone → `warning` banner, still confirmable; big ثابت CTA تأیید موقعیت واقعه (disabled explains why). Works fully offline; autosaves selection.

### 9.4 Incident entry `/incident/index`
Type-selection cards with icons (تصادف first-class; خرابی/مانع/سایر marked به‌زودی until backend workflows land); read-only confirmed-location summary card + اصلاح موقعیت action; no raw UUID visible (replaced by friendly report ref when it exists).

### 9.5 Wizard `/incident/details`
`StepperHeader` (icon chips ۱..۷ + progress bar, animated). Sticky meta card (auto-filled items marked with `lock` icon; date/time editable; location summary + اصلاح موقعیت). Phase bodies built from §6 glyph chips + §7 inputs/cards:
- Vehicles/people/facility: repeatable `Card`s with header icon, collapsible sections, ≥44 dp remove (trash icon-button + confirm), counts drive card creation, injured/deceased totals computed from person cards.
- Conditional logic visible: injury/fatal ⇒ people section required; police switch gates police fields; facility switch gates damage cards.
- Validation: field-level Persian errors; Next blocked with explanation banner, not silent.
- Autosave indicator: ذخیره شد ✓ becomes `success` pill with `checkmark-circle`.

### 9.6 Drafts `/drafts`
True status pills per §3.2 mapping; per-draft card: type/date/km/completion %, attempts + next retry (micro), last error (danger text), retry Button, swipe-to-delete (confirm) ; header action همگام‌سازی همه with spinner; skeletons while loading.

### 9.7 Reports `/(tabs)/reports`
Filter chips actually filter (Sent/Under review/Approved/Returned); report cards with status pill, rejection note in `danger` banner + اصلاح گزارش button routing to draft; empty states per filter; pull-to-refresh; skeletons.

### 9.8 Announcements `/(tabs)/announcements`
Priority icon + tone per §6.10; unread = `primary` right-border + bold title; expand/collapse animated with chevron; unread badge in header and on tab; expiry micro-caption.

### 9.9 Map tab `/(tabs)/map`
Full-bleed map; GPS status card top-right (RTL focal corner); `MapControls` cluster; attribution; tile-loading indicator; (future: incidents layer toggle behind `layers` icon when backend data lands).

### 9.10 More `/(tabs)/more`
Profile block (avatar, name, personnel code), grouped `ListRow` sections with icons + chevrons: پروفایل، شیفت و خودرو، نقشه آفلاین، تنظیمات (rows marked به‌زودی explain via toast), راهنما، پشتیبانی، درباره سامانه; device/session info; logout = `danger` ListRow → ConfirmDialog.

### 9.11 Offline maps `/map-offline`
Restyled with §7 primitives; pack status card (idle/downloading/paused/failed/done + upgrade upsell); Wi-Fi-only switch platform-native; storage hints; confirm dialogs for upgrade/delete.

---

## 10. Open product questions (recorded, not blocking)

1. **Login identifier**: PDF wants numeric کد پرسنلی; backend `user.login` is email-based. Redesign keeps email. If backend adds personnel-code login, only the login screen inputs change.
2. **Emergency offline fallback** (SMS/call) — awaiting ops policy; UI reserves the confirmation-sheet pattern.
3. **Satellite basemap** — PDF mentions it; product decided OSM-only (`TODO.md` §5). Recorded as intentionally unsupported.
4. **Conflict policy** for locally-edited synced reports — backend/product pending; UI surfaces server-authoritative state.

---

## 11. Accessibility & field checklist (applies to every PR)

- [ ] Contrast ≥ WCAG AA on every text/background pair (incl. status tints)
- [ ] Touch targets ≥ 44 dp; primary CTAs ≥ 56 dp
- [ ] Persian `accessibilityLabel` on all interactive elements; roles set
- [ ] RTL correct: alignment, `row-reverse`, mirrored arrows, LTR islands for IDs/coords/plates
- [ ] State coverage: loading (skeleton), empty, error+retry, offline notice — no blank screens
- [ ] No raw backend errors, UUIDs, or technical jargon in UI
- [ ] Persian digits in display values; machine formats preserved for APIs
- [ ] Works one-handed; primary action reachable in bottom third
- [ ] Reduced-motion respected for animations

## 12. Implementation mapping

- Tokens: `src/constants/theme.ts` (`AppTheme`, `Radius`, `Shadow`, `Motion`, `Type`)
- Primitives: `src/components/ui/*` (per §7)
- Icon registry: `src/constants/icon-map.ts` + `src/components/ui/icon.tsx`
- Light-lock: `src/hooks/use-theme.ts` + root `_layout.tsx` (dark-ready architecture retained)
- Rollout phases: Foundation → Shell → Login → Home → Location/Entry → Wizard → Lists/Secondary → Motion/QA (tracked in `TODO.md` / `CONTINUE.md`)
