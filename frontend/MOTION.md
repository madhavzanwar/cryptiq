# Cryptiq motion

Source: the scroll-driven story in the reference screen recording, re-written for Cryptiq's content and `DESIGN.md`.
Live demo: `animation-preview.html` (scroll it) and `design-preview.html` (micro-interactions). Engine: `src/motion/story.js`. Helpers: `src/motion/reveal.js`. Styles: `src/styles/motion.css`.

## Principles
1. Every animation gives feedback, continuity or hierarchy; otherwise it is removed.
2. Only `transform`, `opacity`, `filter: blur`. No shadows, no `transition: all`.
3. Micro-interactions are 90–320ms; the scroll story is scrubbed by the scroll position, so it is as fast or slow as the person scrolls.
4. One saturated green per viewport: the CTA pill (it docks to the bottom of the screen after the hero).
5. Honest content: every screen inside the story says "Example · mock data"; the only real numbers are the confirmed Elliptic++ dataset counts.
6. `prefers-reduced-motion`: positions stay, movement/scale/blur/loops stop, elements only fade.

## Scroll story (scene table)
`p` = scroll progress through a 1000vh track (0.01 ≈ 10vh). All ranges are `[start, end]` with ease-in-out unless noted.

| p | Reference (video) | Cryptiq |
|---|---|---|
| 0.00–0.03 | Hero holds ("Take Ctrl.") | Hero holds: "Say a wallet. Get a verdict." Lines rise on load. Scroll hint pulses |
| 0.03–0.10 | Hero fades up, blurs, scales down; nav pill fades | Same |
| 0.04–0.12 | Green CTA shrinks to a compact pill and docks bottom-centre | Same; label collapses to an arrow |
| 0.05–0.14 | Phone rises from below with stickers inside | Device frame rises with 10 stickers (Hindi note, shield, ALLOW/WARN/BLOCK, "41 ms", ...) |
| 0.14–0.19 | Stickers collapse to the centre | Same (scale to 0.2, rotate, fade) |
| 0.19–0.26 | Stickers burst back out | Same, staggered, ease-out-back with spin |
| 0.24–0.30 | Background goes white to light grey; stickers fade | Canvas to Bone tint (70%); stickers fade/blur; logo tile shrinks |
| 0.25–0.44 | Blue card "Create your wallet" + right text; green tap dot on screen | Blue card "Say it or paste it." + right text; device screen: mic, typed address, tap indicator and press |
| 0.40–0.44 | Card collapses into a small chip top-left; screen blur-morphs | Same: card shrinks to a "Simple" chip, screen blur-morphs to the result |
| 0.43–0.58 | Yellow card "One wallet..." + portfolio list scrolls inside the phone | Yellow card "See the evidence, not just a score." Score counts to 86, meter fills, graph nodes pop (ease-out-back), reasons scroll inside the frame |
| 0.57–0.70 | (third card, chips stack) | Pink card "Keep the proof on-chain." Steps tick, attestation appears. Three chips stack top-left |
| 0.66–0.74 | Phone slides up and away | Same |
| 0.70–0.81 | "2,500+ chains. One wallet." + rolling chain list with fisheye fade, search bar appears | "822,942 wallets. One graph." + rolling list of demo wallets with verdict icons (fisheye fade), search pill appears |
| 0.80–0.88 | "Capture every opportunity on every chain." reveals word by word; orange pill grows inline | "Catch every risk before every payment." reveals word by word; yellow pill with the logo mark grows inline and wobbles |
| 0.86–0.945 | Cards rise ("10M+ assets", coins) | Card 1 "Wallets are dots. Transfers are links." with floating colour cluster |
| 0.925–0.985 | "Connect to every application" with toggles | Card 2 "Proof you can share." with four toggles that flip on in sequence (Carbon, not green) |
| 0.96–1.00 | Back to hero, CTA expands, nav pill returns | Same loop |

## Micro-interactions (apply everywhere)
Button hover fill + press `scale(.97)` + arrow nudge; chip hover lift; card lift on hover (position only); link underline draw; nav pill dims siblings on hover; scroll reveal (rise 18px + blur 6px to clear, 520ms, staggered by `--d`); line-by-line headline rise on load; meter fill and number count-up on view; accordion open with plus-to-cross; credit pill tick on use; mic ring pulse and waveform bars; skeleton shimmer.

## Porting to the Next.js app (framer-motion)
- Pinned stage: a `position: sticky` stage inside a `height: 1000vh` section; `const { scrollYProgress } = useScroll({ target: ref })`.
- Each element: `useTransform(scrollYProgress, [a, b], [from, to], { ease })` for `opacity`, `y`, `scale`, `filter`. The ranges above are the exact `[a, b]` pairs from `story.js`.
- Smoothing: wrap with `useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 })` (matches the 0.14 lerp).
- Words, stickers, wheel rows, toggles: map over arrays with per-index offsets (see `story.js`).
- Micro-interactions: `whileHover`, `whileTap={{ scale: .97 }}`, `<motion.div layout>` for the accordion; or keep the CSS in `motion.css`.
- Reduced motion: `useReducedMotion()` to render the static layout.

## Navigation dock and logo
- **Side dock:** one 53px Carbon launcher on the left edge (bitcoin glyph). Opening scales the Bone panel out from the launcher over 320ms, the four items (Check, Benchmark, Credits, About) stagger in 60ms apart with a 12px slide, and the glyph turns a quarter-turn into a cross. Closing takes 160ms. Below 1340px the closed dock becomes a flush 44px edge tab. Esc, outside click or choosing an item closes it and returns focus to the launcher; arrow keys, Home and End move between items. In the scroll story, Check, Benchmark and Credits jump to story progress 0.30, 0.50 and 0.93. API: `window.CryptiqNav = { open, close, toggle, isOpen, setCurrent }` in `src/motion/nav.js`; styles in `src/styles/nav.css`. Reduced motion: fade only.
- **Stacked layout breakpoint:** the story switches to its stacked layout below 1180px so the dock never covers the left cards.
- **Logo:** the needle of the Verdict Dial swings once on load (900ms, inside the SVG).
