import { clamp, eIO, eO, eOB, lerp, seg } from "./math";

/**
 * Cryptiq scroll story engine. One pinned stage; scroll progress `p` (0..1) drives every element through
 * pure functions of `p` (see `scenes`). The choreography, ranges and easing are the ones documented in
 * MOTION.md. `initStory` wires it to the DOM and returns a cleanup that removes every listener.
 *
 * Elements are found by `data-s="<name>"` attributes inside `root` (the pinned track element), so the
 * markup (ScrollStory.tsx) and the CSS module can rename classes freely. The engine is only started when
 * the person has not asked for reduced motion; otherwise a static stacked layout is shown (no scrub).
 */

export interface StoryOptions {
  /** Height of the top bar the story sits under (px). Chips and mobile cards start just below it. */
  barHeight?: number;
  /** Address typed into the device while the voice scene plays. */
  typed?: string;
  /** Layout switches to the stacked (mobile) variant below this stage width. */
  stackedBelow?: number;
  /** Called with the smoothed progress on every frame that renders (tests / dev read-out). */
  onProgress?: (p: number) => void;
}

/** Scroll windows [start, end] for each phase. Same numbers as MOTION.md. */
export const RANGES = {
  heroOut: [0.03, 0.1],
  heroBack: [0.965, 1],
  dockIn: [0.04, 0.12],
  dockOut: [0.96, 0.995],
  rise: [0.05, 0.14],
  deviceExit: [0.66, 0.74],
  collapse: [0.14, 0.19],
  stickersExit: [0.26, 0.3],
  screen1: [0.27, 0.31],
  screen1Out: [0.4, 0.44],
  screen2Out: [0.54, 0.58],
  typing: [0.285, 0.36],
  tapMove: [0.285, 0.315],
  tapPress: [0.315, 0.35],
  score: [0.43, 0.49],
  list: [0.47, 0.535],
  attest: [0.625, 0.65],
  chipsOut: [0.7, 0.745],
  wheelIn: [0.7, 0.73],
  wheelOut: [0.78, 0.81],
  wheelRoll: [0.715, 0.785],
  searchIn: [0.735, 0.76],
  statementIn: [0.8, 0.82],
  statementOut: [0.87, 0.895],
  statementLift: [0.86, 0.9],
  blob: [0.835, 0.875],
  card1In: [0.86, 0.9],
  card1Out: [0.915, 0.945],
  card2In: [0.925, 0.955],
  card2Out: [0.96, 0.985],
} as const;

export const CARDS = [
  { enter: [0.25, 0.29], col: [0.4, 0.44], rin: [0.27, 0.31], rout: [0.38, 0.42] },
  { enter: [0.43, 0.47], col: [0.54, 0.58], rin: [0.45, 0.49], rout: [0.52, 0.56] },
  { enter: [0.57, 0.61], col: [0.66, 0.7], rin: [0.59, 0.63], rout: [0.64, 0.68] },
] as const;

type Win = readonly [number, number];
const w = (p: number, r: Win): number => seg(p, r[0], r[1]);

export interface CardState {
  enter: number;
  collapse: number;
  textVisible: number;
}

export interface Scenes {
  /** Background tint amount (0 = canvas, 0.7 = bone mix). */
  bg: number;
  /** Hero visibility (1 at start and again at the end). */
  hero: number;
  /** 0 = green pill is full size in the hero, 1 = compact pill docked at the bottom. */
  dock: number;
  rise: number;
  deviceExit: number;
  collapse: number;
  stickersExit: number;
  screens: [number, number, number];
  typedFraction: number;
  tapMove: number;
  tapPress: number;
  score: number;
  list: number;
  attest: number;
  chipsOut: number;
  cards: [CardState, CardState, CardState];
  wheel: { visible: number; roll: number; search: number; textIn: number; textOut: number };
  statement: { visible: number; lift: number; blob: number };
  end: { card1: number; card2: number; card1In: number; card1Out: number; card2In: number; card2Out: number };
}

/** Every scalar the DOM needs, as a pure function of scroll progress. `scenes(0)` equals `scenes(1)` for the hero. */
export function scenes(p: number): Scenes {
  const heroOut = eIO(w(p, RANGES.heroOut));
  const heroBack = eIO(w(p, RANGES.heroBack));
  const dockEase = p < 0.5 ? eIO(w(p, RANGES.dockIn)) : 1 - eIO(w(p, RANGES.dockOut));
  const v1 = eIO(w(p, RANGES.screen1)) * (1 - eIO(w(p, RANGES.screen1Out)));
  const v2 = eIO(w(p, RANGES.screen1Out)) * (1 - eIO(w(p, RANGES.screen2Out)));
  const v3 = eIO(w(p, RANGES.screen2Out));
  const cards = CARDS.map((c) => ({
    enter: eIO(seg(p, c.enter[0], c.enter[1])),
    collapse: eIO(seg(p, c.col[0], c.col[1])),
    textVisible: eIO(seg(p, c.rin[0], c.rin[1])) * (1 - eIO(seg(p, c.rout[0], c.rout[1]))),
  })) as [CardState, CardState, CardState];
  const win = eIO(w(p, RANGES.wheelIn));
  const wout = eIO(w(p, RANGES.wheelOut));
  const e1 = eIO(w(p, RANGES.card1In));
  const e1o = eIO(w(p, RANGES.card1Out));
  const e2 = eIO(w(p, RANGES.card2In));
  const e2o = eIO(w(p, RANGES.card2Out));
  return {
    bg: seg(p, 0.24, 0.3) * (1 - seg(p, 0.955, 0.995)) * 0.7,
    hero: p < 0.5 ? 1 - heroOut : heroBack,
    dock: dockEase,
    rise: eIO(w(p, RANGES.rise)),
    deviceExit: eIO(w(p, RANGES.deviceExit)),
    collapse: eIO(w(p, RANGES.collapse)),
    stickersExit: eIO(w(p, RANGES.stickersExit)),
    screens: [v1, v2, v3],
    typedFraction: eIO(w(p, RANGES.typing)),
    tapMove: eIO(w(p, RANGES.tapMove)),
    tapPress: w(p, RANGES.tapPress),
    score: eO(w(p, RANGES.score)),
    list: eIO(w(p, RANGES.list)),
    attest: eO(w(p, RANGES.attest)),
    chipsOut: eIO(w(p, RANGES.chipsOut)),
    cards,
    wheel: {
      visible: win * (1 - wout),
      roll: eIO(w(p, RANGES.wheelRoll)),
      search: clamp(w(p, RANGES.searchIn)),
      textIn: win,
      textOut: wout,
    },
    statement: {
      visible: eIO(w(p, RANGES.statementIn)) * (1 - eIO(w(p, RANGES.statementOut))),
      lift: eIO(w(p, RANGES.statementLift)),
      blob: eOB(w(p, RANGES.blob)),
    },
    end: { card1: e1 * (1 - e1o), card2: e2 * (1 - e2o), card1In: e1, card1Out: e1o, card2In: e2, card2Out: e2o },
  };
}

// ----------------------------------------------------------------------------------------------- DOM

/** Where an element sits: `base` keeps its CSS centring; px/py are static position, x/y/s/r/blur are motion. */
type Base = "" | "X" | "Y" | "XY";
const BASE: Record<Base, [string, string]> = { "": ["0px", "0px"], X: ["-50%", "0px"], Y: ["0px", "-50%"], XY: ["-50%", "-50%"] };

function put(
  node: HTMLElement,
  o: number,
  x = 0,
  y = 0,
  s = 1,
  r = 0,
  blur = 0,
  base: Base = "",
  px = 0,
  py = 0,
): void {
  const b = BASE[base];
  node.style.opacity = o.toFixed(3);
  node.style.visibility = o <= 0.002 ? "hidden" : "visible";
  node.style.transform = `translate3d(calc(${b[0]} + ${(x + px).toFixed(2)}px),calc(${b[1]} + ${(y + py).toFixed(2)}px),0) scale(${s.toFixed(4)}) rotate(${r.toFixed(2)}deg)`;
  node.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "";
}

const num = (el: HTMLElement, key: string): number => Number(el.dataset[key] ?? 0);

export function initStory(root: HTMLElement, opts: StoryOptions = {}): () => void {
  const barH = opts.barHeight ?? 70;
  const typedText = opts.typed ?? "DEMO-ILLICIT-01";
  const stackedBelow = opts.stackedBelow ?? 1180;

  const q = (name: string): HTMLElement | null => root.querySelector<HTMLElement>(`[data-s="${name}"]`);
  const all = (name: string): HTMLElement[] => [...root.querySelectorAll<HTMLElement>(`[data-s="${name}"]`)];
  const need = (name: string): HTMLElement => {
    const el = q(name);
    if (!el) throw new Error(`story: missing [data-s="${name}"]`);
    return el;
  };

  let el: Record<string, HTMLElement>;
  try {
    el = Object.fromEntries(
      ["stage", "hero", "hint", "cta", "lbl", "device", "s0", "s1", "s2", "s3", "s2in", "tile", "typed", "dmic", "tap", "score", "mfill", "attest",
        "lcA", "lcB", "lcC", "rtA", "rtB", "rtC", "wl", "search", "wheel", "statement", "slabel", "blob", "ec1", "ec2"].map((n) => [n, need(n)]),
    );
  } catch {
    return () => undefined; // markup incomplete: leave the page static rather than half-animated
  }
  const stage = el.stage as HTMLElement;
  const stickers = all("stk");
  const rows = all("row");
  const gnodes = all("gn");
  const steps = all("step");
  const togs = all("tog");
  const words = all("word");
  const cardEls = [el.lcA, el.lcB, el.lcC] as HTMLElement[];
  const textEls = [el.rtA, el.rtB, el.rtC] as HTMLElement[];
  gnodes.forEach((g) => {
    g.style.transformBox = "fill-box";
    g.style.transformOrigin = "center";
  });

  // ---- layout measurements ----
  let vh = 0, dh = 0, dw = 0, mobile = false, devTop = 0, ctaHeroY = 0, ctaBottomY = 0, lblW = 0, s2Max = 0, micX = 0, micY = 0;
  function layout(): void {
    vh = stage.clientHeight;
    mobile = stage.clientWidth < stackedBelow;
    dh = el.device!.offsetHeight;
    dw = el.device!.offsetWidth;
    devTop = vh * 0.54 - dh / 2;
    el.hero!.style.transform = "translateY(-50%)";
    el.hero!.style.filter = "";
    ctaHeroY = el.hero!.getBoundingClientRect().bottom - stage.getBoundingClientRect().top + 44;
    ctaBottomY = vh - 53 - 30;
    el.lbl!.style.maxWidth = "none";
    lblW = el.lbl!.scrollWidth;
    s2Max = Math.max(0, el.s2in!.scrollHeight - el.device!.clientHeight);
    const sr = el.s1!.getBoundingClientRect();
    const mr = el.dmic!.getBoundingClientRect();
    micX = (mr.left + mr.width / 2 - sr.left) / (sr.width / el.s1!.offsetWidth || 1);
    micY = (mr.top + mr.height / 2 - sr.top) / (sr.height / el.s1!.offsetHeight || 1);
  }

  function render(p: number): void {
    const S = scenes(p);
    stage.style.setProperty("--bgt", S.bg.toFixed(3));

    // 1. hero
    put(el.hero!, S.hero, 0, -vh * 0.12 * (1 - S.hero), 0.94 + 0.06 * S.hero, 0, (1 - S.hero) * 10, "Y");
    put(el.hint!, 1 - eIO(seg(p, 0, 0.025)), 0, 0, 1, 0, 0, "X");

    // CTA: full pill in the hero, compact pill docked at the bottom
    put(el.cta!, 1, 0, 0, 1, 0, 0, "X", 0, lerp(ctaHeroY, ctaBottomY, S.dock));
    el.lbl!.style.maxWidth = `${(lblW * (1 - S.dock)).toFixed(1)}px`;
    el.lbl!.style.marginRight = `${(9 * (1 - S.dock)).toFixed(1)}px`;
    el.lbl!.style.opacity = clamp(1 - S.dock * 1.3).toFixed(2);
    el.cta!.style.setProperty("--cp", `${lerp(26, 20, S.dock).toFixed(1)}px`);

    // 2. device rises; stickers collapse, then burst
    put(el.device!, clamp(S.rise * 4) * (S.deviceExit >= 1 ? 0 : 1), 0, lerp(vh * 0.8, 0, S.rise) - vh * 1.15 * S.deviceExit, 1, 0, 0, "XY");
    stickers.forEach((s, i) => {
      const fx = num(s, "fx"), fy = num(s, "fy"), rot = num(s, "r");
      let x = fx * dw, y = fy * dh, sc = 1, r = rot, o = 1;
      if (p >= 0.14 && p < 0.19) {
        x *= 1 - S.collapse; y *= 1 - S.collapse; sc = lerp(1, 0.2, S.collapse); r = rot + S.collapse * 40; o = 1 - S.collapse * 0.85;
      } else if (p >= 0.19) {
        const k = eOB(seg(p, 0.19 + i * 0.004, 0.25 + i * 0.004));
        x *= k; y *= k; sc = lerp(0.2, 1, clamp(k, 0, 1.15)); r = rot - (1 - k) * 120; o = lerp(0.15, 1, clamp(k));
      }
      put(s, o * (1 - S.stickersExit), x, y + S.stickersExit * 14, sc, r, S.stickersExit * 6, "XY");
    });
    put(el.tile!, 1 - S.stickersExit, 0, 0, lerp(1, 0.8, S.stickersExit), 0, S.stickersExit * 5, "");
    el.s0!.style.opacity = (1 - S.stickersExit).toFixed(3);
    el.s0!.style.visibility = S.stickersExit >= 1 ? "hidden" : "visible";

    // device screens (blur-morph between states)
    [el.s1!, el.s2!, el.s3!].forEach((n, i) => {
      const v = S.screens[i] as number;
      put(n, v, 0, 0, lerp(0.97, 1, v), 0, (1 - v) * 6, "");
    });

    // screen 1: voice -> typed address, tap indicator
    el.typed!.textContent = typedText.slice(0, Math.round(typedText.length * S.typedFraction));
    const w1 = el.s1!.offsetWidth, h1 = el.s1!.offsetHeight;
    el.tap!.style.transform = `translate(${(lerp(w1 * 0.78, micX, S.tapMove) - w1 * 0.78).toFixed(1)}px,${(lerp(h1 * 0.86, micY, S.tapMove) - h1 * 0.86).toFixed(1)}px) scale(${(1 + S.tapPress * 1.4).toFixed(2)})`;
    el.tap!.style.opacity = (seg(p, 0.285, 0.295) * (1 - S.tapPress)).toFixed(3);
    el.dmic!.style.transform = `scale(${(1 - 0.07 * Math.sin(Math.PI * seg(p, 0.315, 0.34))).toFixed(3)})`;

    // screen 2: score fills, nodes pop, list scrolls
    el.score!.textContent = String(Math.round(86 * S.score));
    el.mfill!.style.width = `${(86 * S.score).toFixed(1)}%`;
    gnodes.forEach((g, i) => {
      const k = eOB(seg(p, 0.44 + i * 0.005, 0.48 + i * 0.005));
      g.style.transform = `scale(${clamp(k, 0, 1.2).toFixed(3)})`;
      g.style.opacity = clamp(k * 2).toFixed(2);
    });
    el.s2in!.style.transform = `translateY(${(-s2Max * S.list).toFixed(1)}px)`;

    // screen 3: steps tick, attestation appears
    steps.forEach((s, i) => s.toggleAttribute("data-on", p > 0.575 + i * 0.012));
    el.attest!.style.opacity = S.attest.toFixed(2);
    el.attest!.style.transform = `translateY(${((1 - S.attest) * 12).toFixed(1)}px) scale(${lerp(0.96, 1, S.attest).toFixed(3)})`;

    // left cards collapse into chips; right texts swap
    const fullTop = mobile ? barH + 10 : devTop;
    cardEls.forEach((node, k) => {
      const c = S.cards[k] as CardState;
      node.style.setProperty("--c", c.collapse.toFixed(3));
      put(node, c.enter * (1 - S.chipsOut), lerp(-30, 0, c.enter), 0, 1, 0, (1 - c.enter) * 8, "", 0, lerp(fullTop, barH + 10 + k * 44, c.collapse));
      put(textEls[k] as HTMLElement, c.textVisible, mobile ? 0 : lerp(24, 0, c.textVisible), mobile ? lerp(16, 0, c.textVisible) : 0, 1, 0, (1 - c.textVisible) * 8, "", 0, mobile ? 0 : devTop + dh * 0.16);
    });

    // 3. wheel list: the device is gone, a rolling list scrubs past
    const W = S.wheel;
    put(el.wl!, W.visible, lerp(-24, 0, W.textIn) - 24 * W.textOut, 0, 1, 0, (1 - W.visible) * 8, "Y");
    el.search!.style.opacity = W.search.toFixed(2);
    const idx = lerp(1, rows.length - 2.5, W.roll);
    el.wheel!.style.opacity = W.visible.toFixed(3);
    el.wheel!.style.visibility = W.visible <= 0.002 ? "hidden" : "visible";
    rows.forEach((r, i) => {
      const d = i - idx, a = Math.abs(d), o = clamp(1 - (a - 1.4) / 1.9);
      put(r, o, 0, 0, 1 - 0.05 * Math.min(a, 3), 0, 0, "", -(a * a) * 3, d * 58 - 28);
    });

    // 4. statement: words reveal, inline pill grows
    put(el.statement!, S.statement.visible, 0, -vh * 0.34 * S.statement.lift, 1, 0, 0, "Y");
    words.forEach((wd, i) => {
      wd.style.opacity = (0.16 + 0.84 * seg(p, 0.805 + i * 0.0075, 0.817 + i * 0.0075)).toFixed(3);
    });
    el.slabel!.style.opacity = seg(p, 0.81, 0.83).toFixed(2);
    const g = S.statement.blob;
    el.blob!.style.width = `${(clamp(g, 0, 1.12) * 1.9).toFixed(3)}em`;
    el.blob!.style.transform = `rotate(${(Math.sin(p * 70) * 4 * clamp(g)).toFixed(2)}deg)`;
    const inner = el.blob!.firstElementChild as HTMLElement | null;
    if (inner) inner.style.opacity = clamp((g - 0.55) * 3).toFixed(2);

    // 5. cards rise, hold, leave; toggles flip
    put(el.ec1!, S.end.card1, 0, lerp(vh * 0.7, 0, S.end.card1In) - vh * 0.7 * S.end.card1Out, 1, 0, (1 - S.end.card1In) * 6, "X");
    put(el.ec2!, S.end.card2, 0, lerp(vh * 0.7, 0, S.end.card2In) - vh * 0.7 * S.end.card2Out, 1, 0, (1 - S.end.card2In) * 6, "X");
    togs.forEach((t, i) => t.toggleAttribute("data-on", p > 0.945 + i * 0.004));

    opts.onProgress?.(p);
  }

  // ---- scroll -> smoothed progress ----
  let cur = -1;
  let raf = 0;
  const targetP = (): number => {
    const total = root.offsetHeight - window.innerHeight;
    return total <= 0 ? 0 : clamp(-root.getBoundingClientRect().top / total);
  };
  function loop(): void {
    const tgt = targetP();
    cur = cur < 0 ? tgt : cur + (tgt - cur) * 0.14;
    if (Math.abs(tgt - cur) < 0.00008) cur = tgt;
    render(cur);
    raf = Math.abs(tgt - cur) > 0 ? requestAnimationFrame(loop) : 0;
  }
  const kick = (): void => {
    if (!raf) raf = requestAnimationFrame(loop);
  };
  const onResize = (): void => {
    layout();
    cur = -1;
    kick();
  };
  window.addEventListener("scroll", kick, { passive: true });
  window.addEventListener("resize", onResize);
  let alive = true;
  void (document.fonts?.ready ?? Promise.resolve()).then(() => {
    if (alive) onResize();
  });
  layout();
  root.dataset.ready = "1";
  kick();

  if (/[?&]dev\b/.test(window.location.search)) {
    (window as unknown as { __story?: unknown }).__story = {
      snap: (p: number) => {
        cur = p;
        render(p);
      },
    };
  }

  return () => {
    alive = false;
    cancelAnimationFrame(raf);
    window.removeEventListener("scroll", kick);
    window.removeEventListener("resize", onResize);
    delete root.dataset.ready;
  };
}
