# Cryptiq — Style Reference
> sticker-bombed white lab — confetti verdict cards on surgical chrome

**Theme:** light

Source measurements are normalized; roles and recommendations are interpreted. Font summary lists are independent, not paired by position. HTML examples are reconstructions, not source components.

Cryptiq uses a stark-white-canvas minimalism interrupted by playful chromatic confetti — a near-monochrome chrome where black type and thin borders do the structural work, and saturated yellow, pink, blue, and green cards scatter across the layout like sticky notes. The single functional color is vivid green (#05c92f), reserved for the primary CTA pill that anchors every screen. Typography is a single grotesque (Inter Tight) deployed at extreme display sizes with aggressive tight leading (0.77–0.90), making headlines feel architectural rather than typographic. Components are flat, border-driven, and generously rounded — pill buttons, soft-cornered cards at 17.5px, and larger 35–52px radii on interactive elements. The system avoids elevation entirely; hierarchy comes from size, weight, and chromatic contrast, not shadow depth.

## Tokens — Colors

| Name | Value | Token | Role |
|------|-------|-------|------|
| Acid Lime | `#05c92f` | `--color-acid-lime` | Primary action color: the background of the filled CTA pill that anchors every screen. Also used as a green wash for highlight backgrounds, decorative bands, and soft emphasis behind content |
| Sticker Yellow | `#fcea59` | `--color-sticker-yellow` | Decorative accent card backgrounds, icon fills, confetti highlights on hero and feature spreads |
| Cotton Pink | `#ffd0e2` | `--color-cotton-pink` | Decorative accent card backgrounds, soft chromatic punctuation on feature layouts |
| Powder Blue | `#a7cbf6` | `--color-powder-blue` | Decorative accent card backgrounds, informational callout surfaces |
| Obsidian | `#000000` | `--color-obsidian` | Primary text, primary icon strokes, hairline borders, filled button in nav |
| Carbon | `#0f0f0f` | `--color-carbon` | Secondary dark surface, button borders, card borders, strong interactive strokes |
| Ash Gray | `#5a585a` | `--color-ash-gray` | Muted body text, link borders, nav sublabels, secondary icon strokes |
| Slate Gray | `#6e726e` | `--color-slate-gray` | Helper text, low-emphasis borders, tertiary metadata |
| Paper White | `#f9faf9` | `--color-paper-white` | Page canvas, primary background, FAQ item surfaces |
| Pure White | `#ffffff` | `--color-pure-white` | Card surfaces, input fields, elevated content panels |
| Bone | `#ecefec` | `--color-bone` | Nav pill background, FAQ accordion rows, soft card surfaces, muted chips |
| Plaster | `#eeeeee` | `--color-plaster` | Input field backgrounds, subtle disabled surfaces |

## Tokens — Typography

### Inter Tight — The single typeface carrying the entire brand — a tight geometric grotesque deployed at extreme display sizes (up to 176px) with aggressively tight leading (0.77–0.80) that makes headlines feel like architectural cutouts rather than composed type. Weight 600 at display, 500 at body and UI. The tight line-height at hero scale is the signature: it stacks the words of a headline into a single visual block. · `--font-inter-tight`
- **Source:** Inter Tight (Google Fonts)
- **Weights:** 500, 600
- **Sizes:** 11, 13, 14, 18, 21, 25, 26, 28, 32, 35, 53, 70, 84, 105, 153, 158, 176
- **Line height:** 0.77–0.90 for display (70–176px), 1.0–1.13 for subheadings (25–53px), 1.25–1.50 for body
- **Letter spacing:** normal at all sizes — tracking stays default, the visual tightness comes from line-height compression, not negative tracking
- **Role:** The single typeface carrying the entire brand — a tight geometric grotesque deployed at extreme display sizes (up to 176px) with aggressively tight leading (0.77–0.80) that makes headlines feel like architectural cutouts rather than composed type. Weight 600 at display, 500 at body and UI. The tight line-height at hero scale is the signature: it stacks the words of a headline into a single visual block.

### Type Scale

| Role | Family | Weight | Size | Line Height | Letter Spacing | Token |
|------|--------|--------|------|-------------|----------------|-------|
| caption | — | — | 11px | 1.5 | — | `--text-caption` |
| body-lg | — | — | 18px | 1.5 | — | `--text-body-lg` |
| subheading | — | — | 25px | 1.13 | — | `--text-subheading` |
| heading-sm | — | — | 35px | 1.06 | — | `--text-heading-sm` |
| heading | — | — | 53px | 1.02 | — | `--text-heading` |
| heading-lg | — | — | 84px | 0.9 | — | `--text-heading-lg` |
| display | — | — | 153px | 0.8 | — | `--text-display` |
| display-xl | — | — | 176px | 0.77 | — | `--text-display-xl` |

## Tokens — Spacing & Shapes

**Density:** spacious

### Spacing Scale

| Name | Value | Token |
|------|-------|-------|
| 4 | 4px | `--spacing-4` |
| 7 | 7px | `--spacing-7` |
| 9 | 9px | `--spacing-9` |
| 11 | 11px | `--spacing-11` |
| 13 | 13px | `--spacing-13` |
| 18 | 18px | `--spacing-18` |
| 26 | 26px | `--spacing-26` |
| 31 | 31px | `--spacing-31` |
| 35 | 35px | `--spacing-35` |
| 42 | 42px | `--spacing-42` |
| 44 | 44px | `--spacing-44` |
| 53 | 53px | `--spacing-53` |
| 55 | 55px | `--spacing-55` |
| 70 | 70px | `--spacing-70` |
| 105 | 105px | `--spacing-105` |
| 149 | 149px | `--spacing-149` |

### Border Radius

| Element | Value |
|---------|-------|
| nav | 9px |
| tags | 14px |
| cards | 17.5px |
| inputs | 35px |
| buttons | 35px |
| largeElements | 53px |

### Layout

- **Page max-width:** 1200px
- **Section gap:** 80px
- **Card padding:** 26px
- **Element gap:** 18px

## Components

### Green CTA Pill
**Role:** Primary action CTA

Vivid green (#05c92f) pill with Carbon (#0f0f0f) text (white on this green is only 2.2:1 and fails WCAG AA; see Cryptiq Additions), 35px border-radius, 18px vertical padding, ~26px horizontal padding. Contains a 'Get started' label in Inter Tight 500 at 14–18px. This is the only filled chromatic button in the system — every other CTA is black or ghost.

### Black Nav Button
**Role:** Secondary action CTA in navigation

Solid black (#0f0f0f) pill, 35px radius, white text at 14px weight 500, 14px vertical / 18px horizontal padding, label 'Connect wallet'. Sits in the top-right of the header. Lighter weight than the green pill — use as a supporting action when green is already present on the page.

### Ghost Nav Pill
**Role:** Navigation container with secondary links

Bone-colored (#ecefec) rounded container, ~9px radius, 18px vertical / 18px+ horizontal padding, holding the Check | Benchmark | Credits | About links separated by thin vertical dividers in #0f0f0f. Links are 13–14px Inter Tight 500 in #0f0f0f.

### Confetti Accent Card
**Role:** Decorative feature cards with chromatic fills

Solid-fill cards in Sticker Yellow (#fcea59), Cotton Pink (#ffd0e2), or Powder Blue (#a7cbf6), 17.5px border-radius, 26px padding. Contains short headline at 18–25px weight 500 in #0f0f0f and a small pill tag (e.g. 'Simple') at 11–13px. These cards scatter across feature sections to inject color into the monochrome system — never use more than 3 chromatic cards per visual field.

### FAQ Accordion Row
**Role:** Expandable FAQ item

Bone (#ecefec) background, 17.5px border-radius, 26px vertical padding, question text at 18px weight 500 in #0f0f0f on the left, circular plus icon (1px border, 24px) on the right. Rows stack with 4–8px gaps. Expand reveals additional padding and answer text in #5a585a.

### Display Headline
**Role:** Hero and section title text

Inter Tight 600 at 153–176px, line-height 0.77–0.80, #0f0f0f or #000000. The extreme line-height compression makes multi-word titles feel like a single visual mass. Always centered or left-aligned — never justified.

### Section Eyebrow
**Role:** Small text above display headlines

Inter Tight 500 at 14–18px, #0f0f0f or #5a585a, centered above display headlines (e.g. 'Check before you pay' above 'Cryptiq'). Provides tonal context for the massive headline below.

### Plus Toggle Icon
**Role:** Expand/collapse indicator for accordions

Circular button, 1px #0f0f0f border, ~24px diameter, containing a thin plus glyph. Used on FAQ rows and any collapsible content. No fill — purely outline.

## Do's and Don'ts

### Do
- Use #05c92f (Acid Lime) exclusively for the primary CTA pill — it is the only chromatic action color in the system
- Set display headlines at 153–176px with line-height 0.77–0.80 to achieve the architectural cutout effect
- Use 17.5px radius for cards and 35px radius for buttons/inputs — this two-tier rounding is the system's structural signature
- Communicate elevation through surface color shifts (#f9faf9 → #ffffff → #ecefec) and 1px borders, never through drop shadows
- Scatter chromatic confetti cards (yellow, pink, blue) across feature sections to inject energy into the monochrome canvas — limit to 2–3 per visual field
- Keep all body and UI text at weight 500, all display text at weight 600 — do not introduce weight 400 or 700
- Use Inter Tight as the sole typeface; never pair it with a second font family (only exceptions: a Devanagari fallback for Hindi and a monospace for technical strings, see Cryptiq Additions)

### Don't
- Do not use drop shadows, glows, or blur effects — the system is intentionally flat and border-driven
- Do not use more than one chromatic accent card color in a single visual grouping — the confetti effect requires spacing between colors
- Do not set display text with line-height above 0.90 — the tight compression is what makes the headlines feel monumental
- Do not introduce a second action color for secondary CTAs — use black-filled or ghost buttons instead of more chromatic pills
- Do not use sharp corners (0px radius) on any interactive element — minimum 9px on nav, 17.5px on cards, 35px on buttons
- Do not pair the green CTA with another saturated green element on the same screen — it must remain the single chromatic focal point (ALLOW verdicts use a pale tint with dark ink, never this green)
- Do not use #000000 and #0f0f0f interchangeably — reserve #0f0f0f for borders and dark surfaces, #000000 for primary text and nav

## Surfaces

| Level | Name | Value | Purpose |
|-------|------|-------|---------|
| 0 | Canvas | `#f9faf9` | Page background — warm off-white that softens the stark contrast of pure white |
| 1 | Card | `#ffffff` | Content cards, feature panels, and elevated content blocks |
| 2 | Bone Surface | `#ecefec` | Nav pill, FAQ accordion rows, muted interactive surfaces |
| 3 | Input | `#eeeeee` | Form field backgrounds, disabled states |

## Elevation

This system deliberately avoids box-shadows. Elevation is communicated through surface color shifts (canvas #f9faf9 → card #ffffff → bone #ecefec) and thin 1–2px borders in #0f0f0f or #5a585a. The flat, border-driven approach keeps the interface feeling graphic and print-like, like stickers laid on paper. Do not introduce drop shadows, glows, or blur effects — they would break the sticker/collage language.

## Imagery

Product screenshots presented inside framed UI containers with scattered chromatic confetti elements (sticker-like chips in yellow, pink, blue with short playful text) arranged around them. No lifestyle photography, no human imagery. The visual language is sticker-bomb/collage — colorful paper-like accent pieces overlapping and floating around clean product frames on a white canvas. Icons are line-based, 1–1.5px stroke, monochrome (#0f0f0f) unless functioning as the confetti palette. The aesthetic reads as 'designer's moodboard' — curated chaos around a single clean product reveal.

## Layout

Full-width sections with max-width ~1200px centered content. Hero is centered: eyebrow text → massive display headline → green CTA pill, all stacked vertically with generous vertical breathing room. Feature sections alternate between left-text/right-visual and centered compositions. FAQ section is left-aligned with a centered eyebrow above the display heading. Navigation is a top bar with logo left, nav pill centered, nav button right. Vertical rhythm uses 80px section gaps; cards within sections use 26px padding. The overall feel is spacious but compact in type — wide whitespace surrounding dense, tightly-led text blocks.

## Agent Prompt Guide

## Quick Color Reference
- Text (primary): #0f0f0f
- Text (muted): #5a585a
- Background (canvas): #f9faf9
- Background (card): #ffffff
- Border: #0f0f0f
- Accent (confetti cards): #fcea59, #ffd0e2, #a7cbf6
- primary action: #05c92f (filled CTA pill)

## Example Component Prompts

1. Create a Primary Action Button: #05c92f background, #0f0f0f text, 35px radius, 18px vertical / 26px horizontal padding, label 'Get started' in Inter Tight 500. Use this filled treatment for the main CTA.

2. **Confetti Feature Card**: Cotton Pink (#ffd0e2) fill, 17.5px radius, 26px padding. Headline 'Check a wallet in seconds.' in Inter Tight 500, 25px, line-height 1.13, #0f0f0f, with a small lightning bolt icon. Bottom-left tag 'Simple' in 11px weight 500 on a white pill with 14px radius.

3. **FAQ Accordion Row**: #ecefec fill, 17.5px radius, 26px vertical padding. Question text in Inter Tight 500, 18px, #0f0f0f. Right-aligned circular plus toggle: 1px #0f0f0f border, 24px diameter, thin plus glyph.

4. **Ghost Nav Pill**: #ecefec background, 9px radius, 7px 18px padding. Four links ('Check', 'Benchmark', 'Credits', 'About') at 13px weight 500, #0f0f0f, separated by 1px vertical dividers in #0f0f0f.

5. **Display FAQ Heading**: Section eyebrow 'Any questions?' in 18px weight 500, #0f0f0f, centered. Below: 'FAQ' in Inter Tight 600, 153px, line-height 0.80, #0f0f0f, left-aligned.

## Cryptiq Additions

Product-specific rules that the source reference did not cover. They reuse the palette, radii, flat/no-shadow rule and weights above; nothing in the sections above is overridden except where marked.

### Accessibility override: text on the green CTA
White on `#05c92f` measures 2.2:1 (fails WCAG AA). The CTA pill and any other green-filled control use **Carbon `#0f0f0f` text** (8.6:1). The green value itself is unchanged.

### Verdict and status colors
Verdicts reuse the confetti language: quiet pastel chip, dark ink, icon, word. Color is never the only cue. These are the only colors added to the system.

| Verdict | Tint (chip bg) | Ink (text/icon) | Solid (graph, meter fill) | Icon | Contrast ink/tint |
|---------|----------------|-----------------|---------------------------|------|-------------------|
| ALLOW | `#dcf7e1` | `#0a6b20` | `#138a2e` | check-circle | 5.9:1 |
| WARN | Sticker Yellow `#fcea59` | `#0f0f0f` | `#fcea59` (meter fill, outlined `#0f0f0f`) | alert-triangle | 15.6:1 |
| BLOCK | `#ffd9d6` | `#a3171f` | `#d92d20` | shield-x | 6.0:1 |
| UNKNOWN | Bone `#ecefec` | Ash Gray `#5a585a` | Slate Gray `#6e726e` | help-circle | 6.1:1 |

Wording: ALLOW = "No strong risk signals found in the dataset" (never "safe"); WARN = "Some risk signals found"; BLOCK = "Strong risk signals found"; UNKNOWN = "Not in our dataset, so we can't say".

Graph nodes (shape plus color): illicit = BLOCK solid diamond; licit = ALLOW solid circle; unknown = hollow Slate Gray circle; checked wallet = Obsidian filled circle with a Carbon ring and a Sticker Yellow core. Links are Slate Gray with arrowheads; the highlighted path to the nearest flagged wallet is Obsidian, 3px.

### Typography additions
- **Hindi:** `--font-devanagari` = Noto Sans Devanagari (500, 600), listed after Inter Tight in the stack. Same weights and leading rules, but display leading is relaxed to 1.0 for Devanagari so the matras are not clipped.
- **Technical strings:** `--font-mono` = IBM Plex Mono 500, 13–14px, line-height 1.5, for wallet addresses, hashes, GSQL, JSON and keyboard hints only. Never headings or body. Addresses use `word-break: break-all`.
- **Weights:** headings and display 600; everything else 500. Bold tags (`b`, `strong`, `th`) are reset to 500 or 600; never 400 or 700.
- **Responsive display sizes:** mobile (<640px) display 56px / 0.9, heading-lg 40px / 0.95, heading 35px / 1.02; tablet (640–1023px) display 105px / 0.85, heading-lg 70px / 0.9; desktop (≥1024px) display 153px (176px for the hero only).

### Responsive layout
| Name | Range | Grid | Gutter | Section gap |
|------|-------|------|--------|-------------|
| Mobile | 0–639px | 4 columns | 18px | 53px |
| Tablet | 640–1023px | 8 columns | 26px | 80px |
| Desktop | ≥ 1024px | 12 columns | 35px | 80px |

Column gap equals the gutter. Check page desktop split: input and verdict 5 columns, graph and tabs 7. Three-card rows span 4 / 4 / 4. On mobile every block spans the full width in reading order. Tap targets are at least 44px.

### Focus and motion
Focus-visible: 2px solid `#0f0f0f` outline, 2px offset (a border, not a glow). Motion: 150–250ms ease-out, color/opacity/transform only; the mic ring pulse and graph particles stop under `prefers-reduced-motion`.

### One saturated green per viewport
The green appears once per screen as the primary action. On the check page that is the **mic button** (the product's headline action); "Check wallet" becomes a Black Nav Button style (Carbon fill, white text). On other pages it is the Green CTA Pill.

### Additional components
- **Text Input / Address Field:** Plaster `#eeeeee` fill, 1px Carbon border, 35px radius, 53px height, 26px horizontal padding, address in `--font-mono`. Hover: border Obsidian; focus: 2px Carbon outline; error: border `#d92d20` + message in BLOCK ink with icon; disabled: Bone, Slate Gray text. Label above at 14px/500, 9px gap; helper text 13px Ash Gray.
- **Segmented Control (language, hop depth, coin):** Pure White, 1px Carbon border, 35px radius, 44px tall segments; selected segment Carbon fill with white text.
- **Mic Button:** 105px circle (88px mobile), Acid Lime fill, Carbon mic icon (2px stroke), 1px Carbon border. Idle: a 2px Carbon ring pulses outward every 2s. Hover: ring offset 4px. Recording: fill `#d92d20`, white waveform bars, timer below, "Release to send". Transcribing: Bone fill with spinner. Error/unsupported: Plaster fill, Slate Gray icon, message and retry link below.
- **Chip / Tag:** 14px radius, 7px 13px padding, 13px/500. Neutral: Bone. Demo-wallet chips: Pure White with 1px Carbon border; selected: Carbon fill. Verdict chips use the tint/ink table above with an icon.
- **Verdict Card:** Pure White, 1px Carbon border, 17.5px radius, 26px padding. Order: verdict chip (icon + word in Inter Tight 600 at 53px, on the tint, 17.5px radius) → one wording line (18px) → risk meter → address row (mono, truncated middle, copy) → chip row (dataset label, nearest flagged wallet, OFAC, Ransomwhere) → TigerGraph badge → reasons list → two honesty lines in 13px Ash Gray ("Risk signal, not an accusation." and "Based on a research dataset of Bitcoin activity (Elliptic++), not the live blockchain.").
- **Risk Meter:** 13px tall, 35px radius, Plaster track, verdict-solid fill with a 1px Carbon outline, ticks at 30 and 70, numeric score at 35px/600, `role="meter"`. Not in dataset: "n/a" and an empty track.
- **TigerGraph Badge:** Powder Blue fill, 14px radius, 9px 13px padding, lightning icon, "Graph query answered by TigerGraph in N ms" with the query name in mono; trailing "View GSQL" link toggles a code block.
- **Code Block:** Plaster fill, 1px Carbon border, 17.5px radius, 18px padding, mono 13px, horizontal scroll, copy button top-right.
- **Evidence Graph Panel:** Pure White card; inner canvas Paper White with 1px Slate Gray border and 17.5px radius; controls row above (segmented hop selector, zoom, fullscreen, pause, highlight path); legend below (shape + color + label); "Graph as a list" table collapsed beneath.
- **Tabs:** 18px/500, Ash Gray inactive, Obsidian active with a 2px Obsidian underline; row has a 1px Carbon bottom rule.
- **Data Table:** Pure White, 1px Carbon border, 17.5px radius, header row Bone with 13px/500 Ash Gray text, 18px cell padding, 1px Bone row dividers, numbers right-aligned with tabular figures; below 640px rows become stacked cards.
- **Alert / Inline Message:** 17.5px radius, 18px 26px padding, no border, tint background, ink text, 24px icon. Variants: info (Powder Blue), success (ALLOW), warning (Sticker Yellow), error and seed-phrase danger (BLOCK).
- **Toast:** Pure White, 1px Carbon border, 17.5px radius, bottom-center, 4s, `aria-live="polite"`.
- **Modal / Drawer / Bottom Sheet:** Obsidian scrim at 40% (no blur), Pure White surface, 1px Carbon border, 17.5px radius, 26px padding, 44px close button, focus trapped. Drawers 480px wide.
- **Credit Pill:** Pure White, 1px Carbon border, 35px radius, 44px tall, coin icon + count; low credits (0–1): BLOCK tint with "Top up". The count ticks down with a short vertical slide.
- **Credit Pack Card:** Pure White card; pack name 25px/600; credit count 84px/600 at 0.9 leading; price in Ash Gray; "Test mode, no real charge" tag; selected pack gets a 2px Carbon border and a Sticker Yellow tag.
- **Stepper (attest flow):** four numbered steps, 35px circles: done = Carbon fill + white check; current = Sticker Yellow fill + Carbon border; upcoming = Plaster. Vertical on mobile.
- **Mock-Data Ribbon:** fixed top-left, 26px tall, Cotton Pink fill, 1px Carbon border, 13px/600 "MOCK DATA", bottom-right radius 14px.
- **Footer:** Pure White, 1px Carbon top border, 70px vertical padding, 12-column grid (pitch, "Built with", "Thanks"), honesty line at the bottom in 13px Ash Gray. Sponsor names are plain text wordmarks.

### Logo
A black sticker: Carbon rounded square (14px radius at 48px) holding a white shield outline with a three-node white link graph, one Cotton Pink "flagged" node, and a small Sticker Yellow dot peeking off the top-right corner like a confetti sticker. Wordmark: **cryptiq**, lowercase, Inter Tight 600, tight tracking left at normal, 25px, 9px gap from the mark. Mark minimum 24px. Monochrome only apart from the pink and yellow accents; no shadow, no outline, no rotation.

## Quick Start

### CSS Custom Properties

```css
:root {
  /* Colors */
  --color-acid-lime: #05c92f;
  --color-sticker-yellow: #fcea59;
  --color-cotton-pink: #ffd0e2;
  --color-powder-blue: #a7cbf6;
  --color-obsidian: #000000;
  --color-carbon: #0f0f0f;
  --color-ash-gray: #5a585a;
  --color-slate-gray: #6e726e;
  --color-paper-white: #f9faf9;
  --color-pure-white: #ffffff;
  --color-bone: #ecefec;
  --color-plaster: #eeeeee;

  /* Typography — Font Families */
  --font-inter-tight: 'Inter Tight', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  /* Typography — Scale */
  --text-caption: 11px;
  --leading-caption: 1.5;
  --text-body-lg: 18px;
  --leading-body-lg: 1.5;
  --text-subheading: 25px;
  --leading-subheading: 1.13;
  --text-heading-sm: 35px;
  --leading-heading-sm: 1.06;
  --text-heading: 53px;
  --leading-heading: 1.02;
  --text-heading-lg: 84px;
  --leading-heading-lg: 0.9;
  --text-display: 153px;
  --leading-display: 0.8;
  --text-display-xl: 176px;
  --leading-display-xl: 0.77;

  /* Typography — Weights */
  --font-weight-medium: 500;
  --font-weight-semibold: 600;

  /* Spacing */
  --spacing-4: 4px;
  --spacing-7: 7px;
  --spacing-9: 9px;
  --spacing-11: 11px;
  --spacing-13: 13px;
  --spacing-18: 18px;
  --spacing-26: 26px;
  --spacing-31: 31px;
  --spacing-35: 35px;
  --spacing-42: 42px;
  --spacing-44: 44px;
  --spacing-53: 53px;
  --spacing-55: 55px;
  --spacing-70: 70px;
  --spacing-105: 105px;
  --spacing-149: 149px;

  /* Layout */
  --page-max-width: 1200px;
  --section-gap: 80px;
  --card-padding: 26px;
  --element-gap: 18px;

  /* Border Radius */
  --radius-lg: 8.78054px;
  --radius-xl: 14px;
  --radius-2xl: 17.5611px;
  --radius-3xl: 26.3416px;
  --radius-3xl-2: 35.1222px;
  --radius-full: 52.6833px;

  /* Named Radii */
  --radius-nav: 9px;
  --radius-tags: 14px;
  --radius-cards: 17.5px;
  --radius-inputs: 35px;
  --radius-buttons: 35px;
  --radius-largeelements: 53px;

  /* Cryptiq additions */
  --font-devanagari: 'Noto Sans Devanagari', 'Inter Tight', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  --status-allow-tint: #dcf7e1;
  --status-allow-ink: #0a6b20;
  --status-allow-solid: #138a2e;
  --status-warn-tint: #fcea59;
  --status-warn-ink: #0f0f0f;
  --status-block-tint: #ffd9d6;
  --status-block-ink: #a3171f;
  --status-block-solid: #d92d20;
  --status-unknown-tint: #ecefec;
  --status-unknown-ink: #5a585a;
  --status-unknown-solid: #6e726e;
  --nav-height: 70px;
  --tap-target: 44px;

  /* Surfaces */
  --surface-canvas: #f9faf9;
  --surface-card: #ffffff;
  --surface-bone-surface: #ecefec;
  --surface-input: #eeeeee;
}
```

### Tailwind v4

```css
@theme {
  /* Colors */
  --color-acid-lime: #05c92f;
  --color-sticker-yellow: #fcea59;
  --color-cotton-pink: #ffd0e2;
  --color-powder-blue: #a7cbf6;
  --color-obsidian: #000000;
  --color-carbon: #0f0f0f;
  --color-ash-gray: #5a585a;
  --color-slate-gray: #6e726e;
  --color-paper-white: #f9faf9;
  --color-pure-white: #ffffff;
  --color-bone: #ecefec;
  --color-plaster: #eeeeee;

  /* Typography */
  --font-inter-tight: 'Inter Tight', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  /* Typography — Scale */
  --text-caption: 11px;
  --leading-caption: 1.5;
  --text-body-lg: 18px;
  --leading-body-lg: 1.5;
  --text-subheading: 25px;
  --leading-subheading: 1.13;
  --text-heading-sm: 35px;
  --leading-heading-sm: 1.06;
  --text-heading: 53px;
  --leading-heading: 1.02;
  --text-heading-lg: 84px;
  --leading-heading-lg: 0.9;
  --text-display: 153px;
  --leading-display: 0.8;
  --text-display-xl: 176px;
  --leading-display-xl: 0.77;

  /* Spacing */
  --spacing-4: 4px;
  --spacing-7: 7px;
  --spacing-9: 9px;
  --spacing-11: 11px;
  --spacing-13: 13px;
  --spacing-18: 18px;
  --spacing-26: 26px;
  --spacing-31: 31px;
  --spacing-35: 35px;
  --spacing-42: 42px;
  --spacing-44: 44px;
  --spacing-53: 53px;
  --spacing-55: 55px;
  --spacing-70: 70px;
  --spacing-105: 105px;
  --spacing-149: 149px;

  /* Border Radius */
  --radius-lg: 8.78054px;
  --radius-xl: 14px;
  --radius-2xl: 17.5611px;
  --radius-3xl: 26.3416px;
  --radius-3xl-2: 35.1222px;
  --radius-full: 52.6833px;

  /* Cryptiq additions */
  --font-devanagari: 'Noto Sans Devanagari', 'Inter Tight', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  --color-allow-tint: #dcf7e1;
  --color-allow-ink: #0a6b20;
  --color-allow: #138a2e;
  --color-warn-tint: #fcea59;
  --color-block-tint: #ffd9d6;
  --color-block-ink: #a3171f;
  --color-block: #d92d20;
  --color-unknown-solid: #6e726e;
  --breakpoint-sm: 640px;
  --breakpoint-lg: 1024px;
}
```
