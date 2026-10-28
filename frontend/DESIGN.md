# Cryptiq — Design System
> Lilac paper, flat surfaces, one violet action color. A printed editorial almanac for wallet safety: the evidence graph is the illustration.

**Theme:** light only (no dark mode, no theme toggle)

Visual language adapted from the ethereum.org style reference. Roles and recommendations here are interpreted for Cryptiq. Where this file and the product brief disagree: **this file wins on anything visual; the brief wins on functionality, content, honesty rules and accessibility.**

Cryptiq is a voice-first wallet safety checker. The interface reads like a calm editorial page, not a trading dashboard: a lavender canvas reads as paper, white cards sit on it, bold Inter 900 headlines anchor each section, and a single violet (`#6c24e0`) owns every primary action, eyebrow label and active link. Elevation is expressed through surface tint, never shadow. Verdict colors (green / amber / red) exist only to say ALLOW / WARN / BLOCK and to color graph nodes; they never decorate.

## Tokens — Colors

### Brand

| Name | Value | Token | Role |
|------|-------|-------|------|
| Lavender Paper | `#ece0ff` | `--color-lavender-paper` | Page canvas, feature-card tint, eyebrow pill fill |
| Pure White | `#ffffff` | `--color-pure-white` | Cards, nav, inputs, text on violet |
| Ash Gray | `#cfcfcf` | `--color-ash-gray` | Hairline borders, dividers, input borders |
| Onyx | `#121212` | `--color-onyx` | Primary text, headings, neutral icons |
| Graphite | `#616161` | `--color-graphite` | Secondary text, helper copy |
| Fog | `#8c8c8c` | `--color-fog` | Disabled text, placeholder, unknown graph nodes. **Fails AA as body text** (3.4:1): never for readable copy |
| Cryptiq Violet | `#6c24e0` | `--color-violet` | **The primary action color**: filled buttons, active nav, eyebrow text, links, focus ring, subject node in graph |
| Deep Iris | `#41128c` | `--color-deep-iris` | Hover on violet, deep accent surface |
| Iris Pressed | `#2f0d66` | `--color-iris-pressed` | Active/pressed on violet |
| Hot Magenta | `#f60e9d` | `--color-hot-magenta` | Secondary accent: flagged highlights in logo and illustration, tag accents. Large text / icons / marks only (3.8:1 on white) |
| Sapphire | `#3d4ceb` | `--color-sapphire` | Tertiary accent: secondary links, chart series B, cool illustration tone (6.1:1 on white) |
| Mint | `#0f9972` | `--color-mint` | Supporting accent in illustration and charts. For text use `--status-allow-ink` (mint fails 3.6:1 on white) |
| Lilac | `#9357f4` | `--color-lilac` | Gradient origin, illustration mid-tone |
| Lilac Wash | radial gradient | `--gradient-lilac-wash` | Hero glow. Never a flat fill |

### Pastel feature surfaces (no border, no shadow)

| Name | Value | Token |
|------|-------|-------|
| Lavender | `#ece0ff` | `--tint-lavender` |
| Mint | `#d9f3ea` | `--tint-mint` |
| Peach | `#ffe6d5` | `--tint-peach` |
| Pink | `#ffdff0` | `--tint-pink` |
| Sky | `#e3e7ff` | `--tint-sky` |
| Neutral | `#efefef` | `--tint-neutral` |

Onyx text on every pastel is ≥ 15:1.

### Verdict and status (derived; only for verdicts, graph nodes, alerts)

Each verdict has a **solid** (icons, graph, meter fill), a **tint** (badge/alert background) and an **ink** (text on the tint, AA-checked).

| Verdict | Solid | Tint | Ink | Ink on tint | Icon | Wording |
|---------|-------|------|-----|-------------|------|---------|
| ALLOW | `#0f9972` | `#dff5ec` | `#0b6b52` | 5.7:1 | check-circle | "No strong risk signals found in the dataset" (never "safe") |
| WARN | `#e08a00` | `#fdf0d5` | `#8a4b00` | 6.0:1 | alert-triangle | "Some risk signals found" |
| BLOCK | `#d1242f` | `#fde4e6` | `#a3171f` | 6.5:1 | shield-x | "Strong risk signals found" |
| UNKNOWN | `#8c8c8c` | `#efefef` | `#616161` | 5.4:1 | help-circle | "Not in our dataset, so we can't say" |

Tokens: `--status-{allow|warn|block|unknown}-{solid|tint|ink}`.

**Graph nodes** (color is never the only cue): illicit = red solid + diamond; licit = green solid + circle; unknown = fog + hollow circle; subject = violet + ring + larger. Links are Ash Gray with arrowheads; highlighted path is violet.

## Tokens — Typography

**Inter** (400 / 700 / 900) is the workhorse. **IBM Plex Mono** (400) is for technical strings only: wallet addresses, hashes, GSQL, JSON, keyboard hints. Never headings or body. **Noto Sans Devanagari** (400 / 700) carries Hindi; it has no 900, so Hindi display text uses 700.

| Role | Weight | Size | Line height | Token |
|------|--------|------|-------------|-------|
| caption | 400 (700 for eyebrow) | 14px | 1.6 | `--text-caption` |
| body-sm | 400 | 16px | 1.6 | `--text-body-sm` |
| body | 400 | 18px | 1.6 | `--text-body` |
| subheading | 700 | 24px | 1.3 | `--text-subheading` |
| heading-sm | 700 | 30px | 1.2 | `--text-heading-sm` |
| heading | 700 (900 allowed) | 36px | 1.2 | `--text-heading` |
| heading-lg | 900 | 48px | 1.1 | `--text-heading-lg` |
| display | 900 | 64px | 1.0 | `--text-display` |

Rules:
- **900 only at 48px and up**; 700 for 24–36px; 400 for body. Never 500, 600 or 800.
- Mobile (< 640px): display 40px, heading-lg 36px, heading 30px; other sizes unchanged.
- Body is always left-aligned, `max-width: 65ch`. No centered paragraphs.
- Numbers and addresses use Latin digits; addresses in Plex Mono 14–16px with `word-break: break-all`.
- Eyebrow: Inter 700, 14px, uppercase, letter-spacing 0.08em.

## Tokens — Spacing & Shapes

**Base unit:** 4px. **Density:** comfortable and airy.

| Token | Value | Token | Value |
|-------|-------|-------|-------|
| `--spacing-4` | 4px | `--spacing-32` | 32px |
| `--spacing-8` | 8px | `--spacing-40` | 40px |
| `--spacing-12` | 12px | `--spacing-48` | 48px |
| `--spacing-16` | 16px | `--spacing-64` | 64px |
| `--spacing-20` | 20px | `--spacing-80` | 80px |
| `--spacing-24` | 24px | `--spacing-128` | 128px |

Only these values are allowed for margin, padding and gap. No 5px, 10px, 15px.

### Layout constants

| Rule | Value |
|------|-------|
| Container | **1200px** max-width, centered; content never touches viewport edge |
| Page gutter | 16px mobile / 24px tablet / 32px desktop |
| Section gap | **64px** desktop and tablet; 48px mobile |
| Card padding | **32px** tablet and desktop; 24px mobile |
| Element gap | **8px** (between label and field, icon and text, chips) |
| Related-group gap | 16px; card-to-card gap = grid gap |
| Nav height | 64px |
| Tap target | min 44 × 44px |

### Breakpoints and grid

| Name | Range | Columns | Grid gap | Gutter |
|------|-------|---------|----------|--------|
| Mobile | 0–639px | 4 | 16px | 16px |
| Tablet | 640–1023px | 8 | 24px | 24px |
| Desktop | ≥ 1024px | 12 | 32px | 32px |

Common spans (desktop): two-column editorial 7 / 5; check page 5 / 7; three-card row 4 / 4 / 4; two-card row 6 / 6. Tablet: cards span 4 (two per row), editorial stacks. Mobile: everything spans 4 (one column). Every block starts and ends on a grid line; nothing is nudged by hand.

### Border radius

| Element | Value | Token |
|---------|-------|-------|
| Buttons, inputs | 4px | `--radius-buttons` |
| Tags, chips, eyebrow, badges | 8px | `--radius-tags` |
| Cards, alerts, tables, modals | 16px | `--radius-cards` |
| Illustration crops, hero image | 32px | `--radius-illustrations` |
| Pill (search / tag only) | 9999px | `--radius-pills` |

**Single exception:** the hero **mic button** is a circle. It is the only circular control in the product.

### Elevation

None. No `box-shadow` anywhere (`--shadow-md` is removed). Hierarchy comes from surface tint (canvas → white → pastel → violet), 1px Ash Gray borders where separation is needed, and the 2px violet focus outline. Modals and drawers use a flat `--scrim` overlay plus a white surface with a 1px border.

## Surfaces

| Level | Name | Value | Purpose |
|-------|------|-------|---------|
| 0 | Canvas | `#ece0ff` | Page background |
| 1 | Card | `#ffffff` | Cards, nav, inputs, tables, modals |
| 2 | Pastel feature | lavender / mint / peach / pink / sky | Feature tiles, grouped content, verdict tints |
| 3 | Inverse | `#6c24e0` | Primary buttons, rare inverted banner |
| 4 | Deep accent | `#41128c` | Hover on violet, footer band if used |

## Motion

- Durations 120 / 200 / 360ms, `cubic-bezier(0.2, 0, 0, 1)`. Animate color, opacity and transform only.
- Meaningful motion: mic ring pulse, credit meter ticking down, graph particles showing money direction, progress steps.
- `prefers-reduced-motion`: durations become 0, particles and pulses stop, state is conveyed by text and icon.

## Components

Dropped from the reference (no Cryptiq equivalent): diamond icon, Search Command Bar, Popular Topic Card, Ethereum illustration scenes. Everything below is built from the tokens above. Every interactive component has these shared states: **default, hover, focus-visible, active, disabled**; focus is always a 2px solid `--color-violet` outline with 2px offset (never a shadow).

### Top Navigation Bar
White, 64px tall, 1px Ash Gray bottom border, sticky. Left: logo mark + lowercase wordmark. Links: **Check, Benchmark, Credits, History, About** in Inter 700 16px onyx; hover violet; active violet with a 2px violet underline offset 4px below the label. Right cluster in order: language toggle (EN | हिं), credit pill, Connect wallet (ghost), overflow menu. Mobile: logo, credit pill, hamburger → full-height white sheet with the same links stacked at 48px rows.

### Primary Filled Button
Violet bg, white text, Inter 700 16px, padding 12px 24px (min height 44px), radius 4px, no border or shadow. Hover `--color-deep-iris`; active `--color-iris-pressed`; focus outline; disabled `#e4e4e4` bg + fog text, `cursor: not-allowed`; loading shows a 16px spinner left of the label and `aria-busy`. Large variant: padding 16px 32px, 18px text (hero CTA).

### Ghost Outline Button
Transparent, 1px Ash Gray border, onyx text 16px/700, padding 10px 16px (min height 44px), radius 4px, optional trailing `›`. Hover: border violet + violet text; active: lavender bg; disabled: fog text. Chromatic variant: violet border and text.

### Text Link / Card Arrow Link
Inter 400 16px violet + trailing `›`, underline on hover only. Visited stays violet. Secondary link: sapphire.

### Eyebrow Label
Inter 700 14px uppercase, violet text on lavender pill (radius 8px, padding 4px 12px). Sits directly above every section heading with 16px gap below it. Example copy: `HOW IT WORKS`, `CHECK A WALLET`, `HONEST LIMITS`.

### Hero
Lavender canvas with `--gradient-lilac-wash` glow at top. Left-aligned stack: eyebrow → display heading (Inter 900, 64px, 40px mobile) → body 18px at 65ch → primary + ghost button row (16px gap). Right (desktop, 5 cols): a bordered white card, radius 32px, holding the animated example (mic → address → verdict chip) labelled "Example". No text over imagery.

### Two-Column Section Block
7 / 5 split on desktop (text / visual), stacked on tablet and mobile with text first. Text: eyebrow, heading (36–48px/900), two paragraphs at 18px, one button.

### Full-Width Editorial Band
Lavender or white band, full-bleed, 64px vertical padding, 1200px inner container, left-aligned 48–60px/900 heading. Resets the page rhythm between sections.

### Feature Card (Pastel)
Radius 16px, padding 32px (24px mobile), pastel bg, no border or shadow. Order: 32px icon (stroke 2px) → 16px gap → heading 24px/700 → 8px gap → body 16px → 24px gap → ghost button or arrow link. Hover: bg shifts to the next-lighter tint, no lift or shadow.

### Card (White)
White bg, 1px Ash Gray border, radius 16px, padding 32px, on lavender canvas. Used for the check form, result panels, credit packs, tables. Selected state (credit pack): 2px violet border, lavender-tint bg.

### Icon
24px or 32px, outlined (lucide), stroke 2px (1.5px at 32px). Neutral onyx, interactive violet, on violet surfaces white. Verdict icons use the status ink on tint. No filled icons except the logo.

### Logo
Mark: a violet shield (chamfered, flat) containing a three-node white link graph with a hot-magenta "flagged" node. It is the product in one glyph: protection + graph + a flagged wallet. Wordmark: **cryptiq**, lowercase, Inter 900, onyx, letter-spacing −0.02em, with the mark to the left at 32px tall and 8px gap. Minimum mark size 20px. On violet surfaces use white mark parts and a white wordmark. Do not rotate, outline, add shadows or recolor beyond violet/white/onyx. File: `public/brand/logo-mark.svg`.

### Form Controls
- **Text input / address field**: white bg, 1px Ash Gray border, radius 4px, height 48px, padding 0 16px, Plex Mono 16px for addresses, Inter for others. Hover border graphite; focus border violet + outline; error border `--status-block-solid` + message in block ink with an icon below at 8px gap; success border `--status-allow-solid`; disabled `--tint-neutral` bg. Label above (Inter 700 14px, 8px gap). Helper text 14px graphite.
- **Select / segmented control** (language, hop depth, coin): segmented: 1px Ash Gray container radius 4px, selected segment violet bg white text, others white; each segment min 44px wide.
- **Toggle switch** (history, reduce motion): 44 × 24px track radius 8px; off Ash Gray, on violet; white 18px thumb; focus outline.
- **Checkbox / radio**: 20px, radius 4px (checkbox) / circle (radio), violet when checked.
- **Tabs**: Inter 700 16px, graphite inactive, onyx hover, violet active with 2px violet bottom border; container has 1px Ash Gray bottom rule; min height 44px.

### Mic Button (hero control)
Circle 96px (80px mobile), violet fill, white mic icon 32px. **Idle:** a 2px violet ring pulses outward every 2s (static ring when reduced motion). **Hover:** deep-iris. **Recording:** fill `--status-block-solid`, live waveform bars in white, timer under it, label "Release to send". **Transcribing:** lavender fill, violet spinner. **Error / unsupported:** Ash Gray ring, graphite icon, message + Retry below. Caption below it in 14px graphite ("Hold to talk · Space").

### Chips and Tags
Radius 8px, padding 4px 12px, 14px/700. Neutral: lavender bg + violet text. Verdict chips use the tint/ink pair with icon. Demo-wallet chips: white bg, 1px Ash Gray, onyx text; hover violet border; selected lavender bg + violet border. Pill (9999px) allowed here only for the language toggle and filter tags.

### Credit Pill
Tag-shaped (8px radius), white bg, 1px Ash Gray, coin icon + number in 700. Digit ticks down with a 200ms vertical slide. Low (0–1 credits): block tint bg, block ink text, label "Top up". Opens the credits drawer.

### Verdict Card
White card, radius 16px, padding 32px. Top: verdict badge (tint bg, ink text, icon 32px, word in Inter 900 36px) → wording line 16px → risk gauge → address row (Plex Mono, truncated middle + copy) → chip row (dataset label, nearest flagged wallet, OFAC, Ransomwhere) → TigerGraph badge → reasons list → footer with the two honesty lines in 14px graphite. A 4px solid left bar in the verdict solid is the only color accent besides the badge.

### Risk Gauge
Horizontal meter, 12px tall, radius 8px, track `--tint-neutral`, fill in the verdict solid, thresholds ticked at 30 and 70, numeric value 30px/900 beside it, `role="meter"`. Not-in-dataset shows "n/a" and an empty track.

### TigerGraph Badge
Lavender bg, radius 8px, padding 8px 12px, bolt icon violet, text "Graph query answered by TigerGraph in **N ms**", query name in Plex Mono 14px. Trailing `View GSQL` toggles a code block.

### Code Block
`--tint-neutral` bg, 1px Ash Gray border, radius 8px, padding 16px, Plex Mono 14px/1.6, horizontal scroll, copy button top-right (ghost, 44px target).

### Evidence Graph Panel
White card radius 16px; canvas on `--tint-lavender`-at-40% inner area with radius 8px; node/link styling per the Colors section; controls row (segmented hop selector 1|2|3, zoom, fullscreen, pause, highlight path) above with 8px gaps; legend row below (swatch + shape + label, 14px); counts strip. Node drawer: right-side sheet, white, 1px border-left, 360px wide (full width mobile). "Graph as a list" table beneath, collapsed by default.

### Progress Steps
Vertical list, 8px gap, 24px rail. Pending: hollow Ash Gray circle, graphite text. Active: violet spinner, onyx 700 text. Done: violet check, onyx text. Failed: block icon + block ink text.

### Explanation Panel
White card; tabs `English | हिन्दी`; text 18px at 65ch; a lavender "Based only on retrieved evidence" tag above; Listen / Copy / Share as ghost buttons in a row.

### Attest Stepper
Four numbered steps (Connect → Switch network → Sign → Done) in a horizontal row (vertical on mobile). Number badge 32px, radius 8px: done violet/white, current lavender/violet with violet border, upcoming white/graphite with Ash Gray border. Warning alert about permanence sits above the button.

### Alert / Inline Message
Radius 16px, padding 16px 24px, tint bg, no border, icon left 24px, ink text, optional ghost action. Variants: info (lavender/violet), success (allow), warning (warn), error and seed-phrase danger (block). Always icon + text, never color alone.

### Toast
White card, 1px Ash Gray border, radius 8px, padding 12px 16px, bottom-center desktop / bottom full-width mobile, 4s, `aria-live="polite"`, with a 4px left bar in the variant solid.

### Data Table
White, 1px Ash Gray border, radius 16px (overflow hidden). Header row `--tint-lavender`, 14px/700 uppercase graphite, padding 12px 16px. Body rows padding 16px, 1px Ash Gray row dividers, numbers right-aligned in tabular figures, hover row `--tint-neutral`. Mobile: becomes stacked cards (one per row).

### Bar Chart (Benchmark)
Two series only: violet (graph evidence) and sapphire (raw dump). Bars radius 4px top corners, 24px max thickness, direct value labels in 14px/700, Ash Gray baseline, no gridline shadows. A matching table sits underneath. "Not measured yet" empty state replaces the chart when no data.

### Credit Pack Card
White card; name 24px/700, credits 48px/900 violet, price 16px graphite, "Test mode, no real charge" tag, button. Selected = 2px violet border + lavender bg.

### QR / Invoice Card
White card; QR on white 160px with 16px quiet zone and 1px Ash Gray border radius 8px; payment URI in a code block with copy; countdown in violet 700; status tag waiting (lavender) / paid (allow) / expired (neutral).

### Modal, Drawer, Mobile Sheet
`--scrim` overlay (no blur), white surface, 1px Ash Gray border, radius 16px (top corners only for bottom sheets), padding 32px (24px mobile), close icon button 44px top-right, focus trapped, Esc closes. Drawers: 480px wide right edge.

### Accordion
Rows separated by 1px Ash Gray, question in Inter 700 18px, chevron icon rotates 180° in 200ms, answer 16px graphite at 65ch, padding 16px 0.

### Skeleton and Empty State
Skeleton: `--tint-neutral` block, radius matching the target, no shimmer when reduced motion. Empty state: centered-in-card icon 32px violet, heading 24px/700, one sentence graphite, one primary or ghost action. (Only place centered text is allowed.)

### Mock-Data Ribbon
Fixed top-left strip, 28px tall, Hot Magenta bg, white 14px/700 text "MOCK DATA", radius 0 0 8px 0. Visible whenever mocks are on.

### Footer
White band, 1px Ash Gray top border, 64px vertical padding, 4-column grid desktop (pitch, product links, "Built with" text row, "Thanks" text row), stacked on mobile. Bottom row: honesty line "Risk signal, not an accusation. Research dataset, not the live blockchain." in 14px graphite. Sponsor names are plain text wordmarks only.

### Image Container
Radius 32px for large crops, 8px for inline diagrams, flat on a pastel surface, no white frame.

## Imagery

Cryptiq's visual anchor is **the evidence graph**, not stock art. Supporting illustration is flat inline SVG line art: 1.5px uniform strokes in violet and sapphire, with a single magenta accent for a "flagged" element, on lavender or white. Recurring motifs: shield, node-link graph, sound wave, a path hopping between nodes. No photography, no gradients inside illustrations (the Lilac Wash is hero background only), no sponsor logos.

## Layout

One sticky top bar, no sidebar, 1200px centered container. Pages alternate: lavender canvas hero → white or pastel card grids → full-width editorial bands, 64px apart (48px mobile). The check page uses a 5 / 7 split (input and verdict left, graph and tabs right) on desktop and a single column on mobile in the order input → verdict → graph → explanation → attest → details. Text is left-aligned throughout; only empty states and the final CTA block may center.

## Do's and Don'ts

### Do
- Use `--color-violet` for every primary action, eyebrow label, active link and focus ring.
- Use Inter 900 at 48–64px for section display headings; 700 for everything from 24 to 36px.
- Put an eyebrow label above every section heading.
- Use 4px radius on buttons and inputs, 8px on tags, 16px on cards, 32px on illustration crops.
- Separate layers with tint and 1px Ash Gray borders.
- Pair every verdict color with an icon and a word.
- Snap every margin, padding and gap to the 4px scale; use 64 / 32 / 8 for section / card / element spacing.
- Keep body text left-aligned at ≤ 65ch.
- Use Plex Mono for addresses, hashes, GSQL and JSON so they are unambiguous.

### Don't
- Don't use `box-shadow`, blur or glow for depth.
- Don't use a pill for primary actions; the mic button is the only circle.
- Don't use weights 500, 600 or 800, or 900 below 48px.
- Don't use green/amber/red outside verdicts, graph nodes and alerts.
- Don't use fog, magenta or mint for small readable text.
- Don't introduce new saturated hues beyond the palette above.
- Don't center body text or place text over illustration.
- Don't show invented numbers; empty states say "Not measured yet".
- Don't use odd spacing values (5, 10, 15, 18px) or nudge items by hand.
- Don't embed sponsor logos; use plain text wordmarks.

## Agent Prompt Guide

### Quick color reference
- text: `#121212` primary, `#616161` secondary, `#8c8c8c` disabled only
- background: `#ece0ff` canvas, `#ffffff` card
- border: `#cfcfcf` hairline
- **primary action: `#6c24e0`** (hover `#41128c`, pressed `#2f0d66`)
- accents: `#f60e9d` magenta, `#3d4ceb` sapphire, `#0f9972` mint
- verdicts: allow `#0f9972` / warn `#e08a00` / block `#d1242f` / unknown `#8c8c8c` with tint + ink pairs

### Example prompts
1. **Hero:** lavender canvas with lilac-wash glow, left-aligned eyebrow pill "CRYPTIQ" (violet on lavender, 8px radius), then "Say a wallet. See if it's safe to pay." in Inter 900 64px/1.0 onyx, body 18px graphite at 65ch, primary button "Try a check" (violet, 4px radius) and ghost button "See how it works ›".
2. **Verdict card:** white, 1px #cfcfcf, 16px radius, 32px padding, 4px left bar in verdict solid, tint badge with icon + "BLOCK" in Inter 900 36px in ink color, gauge 12px tall, address in IBM Plex Mono, two honesty lines in 14px graphite.
3. **Feature card:** `--tint-mint` bg, 16px radius, 32px padding, 32px icon, heading 24px/700, body 16px, ghost button with ›.
4. **Top nav:** white, 64px, 1px bottom border, logo mark + "cryptiq", links Check / Benchmark / Credits / History / About in Inter 700 16px with violet active underline, right cluster language toggle, credit pill, Connect wallet ghost.
5. **Mic button:** 96px circle, violet, white mic icon, pulsing 2px violet ring; recording turns block-red with white waveform.

## Quick Start

Source files: `src/styles/tokens.css` (CSS custom properties, the single source of truth), `src/styles/theme.css` (Tailwind v4 mapping). Logo: `public/brand/logo-mark.svg`. Live reference: `design-preview.html`.

### CSS Custom Properties

```css
:root {
  --color-lavender-paper: #ece0ff;
  --color-pure-white: #ffffff;
  --color-ash-gray: #cfcfcf;
  --color-onyx: #121212;
  --color-graphite: #616161;
  --color-fog: #8c8c8c;
  --color-violet: #6c24e0;
  --color-deep-iris: #41128c;
  --color-iris-pressed: #2f0d66;
  --color-hot-magenta: #f60e9d;
  --color-sapphire: #3d4ceb;
  --color-mint: #0f9972;
  --color-lilac: #9357f4;

  --tint-lavender: #ece0ff;
  --tint-mint: #d9f3ea;
  --tint-peach: #ffe6d5;
  --tint-pink: #ffdff0;
  --tint-sky: #e3e7ff;
  --tint-neutral: #efefef;

  --status-allow-solid: #0f9972;  --status-allow-tint: #dff5ec;  --status-allow-ink: #0b6b52;
  --status-warn-solid: #e08a00;   --status-warn-tint: #fdf0d5;   --status-warn-ink: #8a4b00;
  --status-block-solid: #d1242f;  --status-block-tint: #fde4e6;  --status-block-ink: #a3171f;
  --status-unknown-solid: #8c8c8c; --status-unknown-tint: #efefef; --status-unknown-ink: #616161;

  --font-inter: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-devanagari: "Noto Sans Devanagari", "Inter", sans-serif;
  --font-ibm-plex-mono: "IBM Plex Mono", ui-monospace, monospace;

  --spacing-4: 4px; --spacing-8: 8px; --spacing-12: 12px; --spacing-16: 16px;
  --spacing-20: 20px; --spacing-24: 24px; --spacing-32: 32px; --spacing-40: 40px;
  --spacing-48: 48px; --spacing-64: 64px; --spacing-80: 80px; --spacing-128: 128px;

  --page-max-width: 1200px;
  --section-gap: 64px;   /* 48px below 1024px */
  --card-padding: 32px;  /* 24px below 640px */
  --element-gap: 8px;

  --radius-buttons: 4px;
  --radius-tags: 8px;
  --radius-cards: 16px;
  --radius-illustrations: 32px;
  --radius-pills: 9999px;
}
```

The complete file, including the responsive overrides, is in `src/styles/tokens.css`.

### Tailwind v4

```css
@import "tailwindcss";
@import "./tokens.css";
@import "./theme.css";
```

`theme.css` exposes utilities such as `bg-lavender-paper`, `text-onyx`, `bg-violet`, `text-allow-ink`, `bg-block-tint`, `font-mono`, `rounded-card`, `text-display`, and the `sm` (640px) / `lg` (1024px) breakpoints.
