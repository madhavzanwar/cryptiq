/* Cryptiq scroll story engine (vanilla, no dependencies).
   One pinned stage; scroll progress p (0..1) drives every element through pure functions of p.
   Maps 1:1 to framer-motion useScroll() + useTransform() in the Next.js app (see ../../MOTION.md). */
(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const eIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const eO = (t) => 1 - Math.pow(1 - t, 3);
  const eOB = (t) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

  const track = $('story'), stage = $('stage');
  const el = Object.fromEntries(['hero', 'hint', 'cta', 'lbl', 'device', 's0', 's1', 's2', 's3', 's2in', 'tile', 'stickers', 'typed', 'dmic', 'tap', 'score', 'mfill', 'attest',
    'lcA', 'lcB', 'lcC', 'rtA', 'rtB', 'rtC', 'wheelscene', 'wl', 'search', 'wheel', 'statement', 'slabel', 'sh', 'blob', 'ec1', 'ec2', 'togs', 'dev'].map((id) => [id, $(id)]));

  // ---- DOM generation: stickers and wheel rows ----
  const STK = [
    { c: 'y', t: 'SAY IT IN<br>HINDI', w: 5.6, h: 3.7, rad: '.5em', fx: -0.27, fy: -0.28, r: -10 },
    { c: 'pk', svg: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM9 12l2 2 4-4"/>', w: 3.8, h: 3.8, rad: '50%', fx: 0.07, fy: -0.23, r: 0 },
    { c: 'bl', svg: '<path d="M7 17L17 7M9 7h8v8"/>', w: 2.6, h: 2.6, rad: '50%', fx: 0.37, fy: -0.31, r: 0 },
    { c: 'al', t: 'KNOW BEFORE YOU PAY', w: 9.6, h: 2.7, rad: '99px', fx: 0.24, fy: 0.3, r: -32 },
    { c: 'y', coin: 1, w: 3.9, h: 3.9, rad: '50%', fx: -0.37, fy: 0.05, r: 0 },
    { c: 'bk', t: 'BLOCK', w: 4.8, h: 2.2, rad: '99px', fx: 0.07, fy: 0.37, r: -8 },
    { c: 'wn', t: 'WARN', w: 4.4, h: 2.2, rad: '99px', fx: 0.34, fy: 0.07, r: 14 },
    { c: 'al', t: 'ALLOW', w: 4.8, h: 2.2, rad: '99px', fx: -0.25, fy: 0.3, r: 12 },
    { c: 'bl', t: '41 ms', w: 4.4, h: 2.2, rad: '99px', fx: -0.3, fy: -0.1, r: -6 },
    { c: 'pk', coin: 1, w: 2.6, h: 2.6, rad: '50%', fx: 0.3, fy: -0.14, r: 0 },
  ];
  STK.forEach((s) => {
    const d = document.createElement('div');
    d.className = 'stk ' + s.c;
    d.style.cssText = `width:${s.w}em;height:${s.h}em;border-radius:${s.rad};font-size:.8em`;
    d.innerHTML = s.svg ? `<svg viewBox="0 0 24 24">${s.svg}</svg>` : s.coin ? '<i style="width:60%;height:60%;border:1.5px solid #0f0f0f;border-radius:50%;display:block"></i>' : s.t;
    el.stickers.appendChild(d); s.el = d;
  });

  const ROWS = [];
  const KINDS = [['LICIT', 'ALLOW'], ['ILLICIT', 'BLOCK'], ['BORDERLINE', 'WARN'], ['NOTFOUND', 'UNKNOWN']];
  for (let i = 0; i < 15; i++) { const [k, v] = KINDS[(i * 3 + (i > 7 ? 1 : 0)) % 4]; ROWS.push({ name: `DEMO-${k}-${String(i + 1).padStart(2, '0')}`, v }); }
  const ICON = {
    ALLOW: '<svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#4b9a6a"/></svg>',
    BLOCK: '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M12 2l10 10-10 10L2 12z" fill="#c8574f"/></svg>',
    WARN: '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M12 3l10 18H2z" fill="#e0b93a" stroke="#0f0f0f" stroke-width="1.2"/></svg>',
    UNKNOWN: '<svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="#fff" stroke="#6e726e" stroke-width="2.5"/></svg>',
  };
  const VCLS = { ALLOW: 'al', BLOCK: 'bk', WARN: 'wn', UNKNOWN: '' };
  ROWS.forEach((r) => {
    const d = document.createElement('div'); d.className = 'wrow';
    d.innerHTML = `<span class="ic">${ICON[r.v]}</span><span class="mono" style="font-size:.8em">${r.name}</span><span class="vt ${VCLS[r.v]}" style="${r.v === 'UNKNOWN' ? 'background:var(--color-bone);color:var(--color-ash-gray)' : ''}">${r.v}</span>`;
    el.wheel.appendChild(d); r.el = d;
  });
  const gnodes = [...document.querySelectorAll('#graph .gn')];
  gnodes.forEach((g) => { g.style.transformBox = 'fill-box'; g.style.transformOrigin = 'center'; });
  const steps = [...document.querySelectorAll('.step')];
  const togs = [...document.querySelectorAll('.tog')];

  // ---- transform helper (keeps CSS centring and hides what is invisible) ----
  const BASE = { '': ['0px', '0px'], X: ['-50%', '0px'], Y: ['0px', '-50%'], XY: ['-50%', '-50%'] };
  // x,y,s,r,blur are motion (dropped under reduced motion); px,py are the element's static position (always applied).
  function put(node, o, x = 0, y = 0, s = 1, r = 0, blur = 0, base = '', px = 0, py = 0) {
    const b = BASE[base];
    node.style.opacity = o.toFixed(3);
    node.style.visibility = o <= 0.002 ? 'hidden' : 'visible';
    if (RM) { node.style.transform = `translate3d(calc(${b[0]} + ${px.toFixed(2)}px),calc(${b[1]} + ${py.toFixed(2)}px),0)`; node.style.filter = ''; return; }
    node.style.transform = `translate3d(calc(${b[0]} + ${(x + px).toFixed(2)}px),calc(${b[1]} + ${(y + py).toFixed(2)}px),0) scale(${s.toFixed(4)}) rotate(${r.toFixed(2)}deg)`;
    node.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : '';
  }

  // ---- layout measurements ----
  let vh = 0, vw = 0, dh = 0, dw = 0, mobile = false, devTop = 0, ctaHeroY = 0, ctaBottomY = 0, lblW = 0, s2Max = 0, micX = 0, micY = 0;
  function layout() {
    vh = stage.clientHeight; vw = stage.clientWidth; mobile = vw < 1180;
    dh = el.device.offsetHeight; dw = el.device.offsetWidth;
    devTop = vh * 0.54 - dh / 2;
    el.hero.style.transform = 'translateY(-50%)'; el.hero.style.filter = '';
    ctaHeroY = el.hero.getBoundingClientRect().bottom - stage.getBoundingClientRect().top + 44;
    ctaBottomY = vh - 53 - 30;
    el.lbl.style.maxWidth = 'none'; lblW = el.lbl.scrollWidth;
    s2Max = Math.max(0, el.s2in.scrollHeight - el.device.clientHeight);
    const sr = el.s1.getBoundingClientRect(), mr = el.dmic.getBoundingClientRect();
    micX = (mr.left + mr.width / 2 - sr.left) / (sr.width / el.s1.offsetWidth || 1); micY = (mr.top + mr.height / 2 - sr.top) / (sr.height / el.s1.offsetHeight || 1);
  }

  // ---- the timeline: everything is a pure function of p ----
  const CARDS = [
    { n: 'lcA', rt: 'rtA', enter: [0.25, 0.29], col: [0.4, 0.44], rin: [0.27, 0.31], rout: [0.38, 0.42] },
    { n: 'lcB', rt: 'rtB', enter: [0.43, 0.47], col: [0.54, 0.58], rin: [0.45, 0.49], rout: [0.52, 0.56] },
    { n: 'lcC', rt: 'rtC', enter: [0.57, 0.61], col: [0.66, 0.7], rin: [0.59, 0.63], rout: [0.64, 0.68] },
  ];
  const TYPE = 'DEMO-ILLICIT-01';

  function render(p) {
    // background: white canvas -> bone tint during the feature scenes
    stage.style.setProperty('--bgt', (seg(p, 0.24, 0.3) * (1 - seg(p, 0.955, 0.995)) * 0.7).toFixed(3));

    // 1. hero out (and back at the end)
    const heroOut = eIO(seg(p, 0.03, 0.1)), heroBack = eIO(seg(p, 0.965, 1));
    const h = p < 0.5 ? 1 - heroOut : heroBack;
    put(el.hero, h, 0, -vh * 0.12 * (1 - h), 0.94 + 0.06 * h, 0, (1 - h) * 10, 'Y');
    put(el.hint, 1 - eIO(seg(p, 0, 0.025)), 0, 0, 1, 0, 0, 'X');

    // CTA: full pill in the hero, compact pill docked at the bottom
    const dock = p < 0.5 ? eIO(seg(p, 0.04, 0.12)) : 1 - eIO(seg(p, 0.96, 0.995));
    const dk = RM ? Math.round(dock) : dock;
    put(el.cta, 1, 0, 0, 1, 0, 0, 'X', 0, lerp(ctaHeroY, ctaBottomY, dk));
    el.lbl.style.maxWidth = (lblW * (1 - dk)).toFixed(1) + 'px'; el.lbl.style.marginRight = (9 * (1 - dk)).toFixed(1) + 'px';
    el.lbl.style.opacity = clamp(1 - dk * 1.3).toFixed(2);
    el.cta.style.setProperty('--cp', lerp(26, 20, dk).toFixed(1) + 'px');

    // 2. device rises; stickers collapse, then burst
    const rise = eIO(seg(p, 0.05, 0.14)), dexit = eIO(seg(p, 0.66, 0.74));
    put(el.device, clamp(rise * 4) * (dexit >= 1 ? 0 : 1), 0, lerp(vh * 0.8, 0, rise) - vh * 1.15 * dexit, 1, 0, 0, 'XY');
    const col = eIO(seg(p, 0.14, 0.19)), exi = eIO(seg(p, 0.26, 0.3));
    STK.forEach((s, i) => {
      if (RM) { put(s.el, (1 - exi) * (p >= 0.1 ? 1 : 0), 0, 0, 1, s.r, 0, 'XY', s.fx * dw, s.fy * dh); return; }
      let x = s.fx * dw, y = s.fy * dh, sc = 1, r = s.r, o = 1;
      if (p >= 0.14 && p < 0.19) { x *= 1 - col; y *= 1 - col; sc = lerp(1, 0.2, col); r = s.r + col * 40; o = 1 - col * 0.85; }
      else if (p >= 0.19) { const k = eOB(seg(p, 0.19 + i * 0.004, 0.25 + i * 0.004)); x *= k; y *= k; sc = lerp(0.2, 1, clamp(k, 0, 1.15)); r = s.r - (1 - k) * 120; o = lerp(0.15, 1, clamp(k)); }
      put(s.el, o * (1 - exi), x, y + exi * 14, sc, r, exi * 6, 'XY');
    });
    put(el.tile, 1 - exi, 0, 0, lerp(1, 0.8, exi), 0, exi * 5, '');
    el.s0.style.opacity = (1 - exi).toFixed(3); el.s0.style.visibility = exi >= 1 ? 'hidden' : 'visible';

    // device screens (blur-morph between states)
    const v1 = eIO(seg(p, 0.27, 0.31)) * (1 - eIO(seg(p, 0.4, 0.44)));
    const v2 = eIO(seg(p, 0.4, 0.44)) * (1 - eIO(seg(p, 0.54, 0.58)));
    const v3 = eIO(seg(p, 0.54, 0.58));
    [[el.s1, v1], [el.s2, v2], [el.s3, v3]].forEach(([n, v]) => put(n, v, 0, 0, lerp(0.97, 1, v), 0, (1 - v) * 6, ''));

    // screen 1: voice -> typed address, tap indicator
    el.typed.textContent = TYPE.slice(0, Math.round(TYPE.length * eIO(seg(p, 0.285, 0.36))));
    const t1 = eIO(seg(p, 0.285, 0.315)), t2 = seg(p, 0.315, 0.35);
    el.tap.style.transform = `translate(${(lerp(el.s1.offsetWidth * 0.78, micX, t1) - el.s1.offsetWidth * 0.78).toFixed(1)}px,${(lerp(el.s1.offsetHeight * 0.86, micY, t1) - el.s1.offsetHeight * 0.86).toFixed(1)}px) scale(${(1 + t2 * 1.4).toFixed(2)})`;
    el.tap.style.opacity = (seg(p, 0.285, 0.295) * (1 - t2)).toFixed(3);
    el.dmic.style.transform = `scale(${(1 - 0.07 * Math.sin(Math.PI * seg(p, 0.315, 0.34))).toFixed(3)})`;

    // screen 2: score fills, nodes pop, list scrolls
    const sc2 = eO(seg(p, 0.43, 0.49));
    el.score.textContent = Math.round(86 * sc2); el.mfill.style.width = (86 * sc2).toFixed(1) + '%';
    gnodes.forEach((g, i) => { const k = eOB(seg(p, 0.44 + i * 0.005, 0.48 + i * 0.005)); g.style.transform = RM ? '' : `scale(${clamp(k, 0, 1.2).toFixed(3)})`; g.style.opacity = clamp(k * 2).toFixed(2); });
    el.s2in.style.transform = `translateY(${(-s2Max * eIO(seg(p, 0.47, 0.535))).toFixed(1)}px)`;

    // screen 3: steps tick, attestation appears
    steps.forEach((s, i) => s.classList.toggle('on', p > 0.575 + i * 0.012));
    const at = eO(seg(p, 0.625, 0.65)); el.attest.style.opacity = at.toFixed(2); el.attest.style.transform = RM ? '' : `translateY(${((1 - at) * 12).toFixed(1)}px) scale(${lerp(0.96, 1, at).toFixed(3)})`;

    // left cards collapse into chips; right texts swap
    const chipsOut = eIO(seg(p, 0.7, 0.745)), fullTop = mobile ? 124 : devTop;
    CARDS.forEach((c, k) => {
      const e = eIO(seg(p, ...c.enter)), cl = eIO(seg(p, ...c.col));
      const node = el[c.n]; node.style.setProperty('--c', cl.toFixed(3));
      put(node, e * (1 - chipsOut), lerp(-30, 0, e), 0, 1, 0, (1 - e) * 8, '', 0, lerp(fullTop, 124 + k * 44, RM ? Math.round(cl) : cl));
      const rv = eIO(seg(p, ...c.rin)) * (1 - eIO(seg(p, ...c.rout)));
      put(el[c.rt], rv, mobile ? 0 : lerp(24, 0, rv), mobile ? lerp(16, 0, rv) : 0, 1, 0, (1 - rv) * 8, '', 0, mobile ? 0 : devTop + dh * 0.16);
    });

    // 3. wheel list: device is gone, a rolling list scrubs past
    const win = eIO(seg(p, 0.7, 0.73)), wout = eIO(seg(p, 0.78, 0.81)), wv = win * (1 - wout);
    put(el.wl, wv, lerp(-24, 0, win) - 24 * wout, 0, 1, 0, (1 - wv) * 8, 'Y');
    el.search.style.opacity = clamp(seg(p, 0.735, 0.76)).toFixed(2);
    const idx = RM ? 4 : lerp(1, ROWS.length - 2.5, eIO(seg(p, 0.715, 0.785)));
    el.wheel.style.opacity = wv.toFixed(3); el.wheel.style.visibility = wv <= 0.002 ? 'hidden' : 'visible';
    ROWS.forEach((r, i) => {
      const d = i - idx, a = Math.abs(d), o = clamp(1 - (a - 1.4) / 1.9);
      put(r.el, o, 0, 0, 1 - 0.05 * Math.min(a, 3), 0, 0, '', -(a * a) * 3, d * 58 - 28);
    });

    // 4. statement: words reveal, inline pill grows
    const sin = eIO(seg(p, 0.8, 0.82)), sout = eIO(seg(p, 0.87, 0.895)), lift = eIO(seg(p, 0.86, 0.9));
    put(el.statement, sin * (1 - sout), 0, -vh * 0.34 * lift, 1, 0, 0, 'Y');
    [...el.sh.querySelectorAll('.w')].forEach((w, i) => { const t = seg(p, 0.805 + i * 0.0075, 0.817 + i * 0.0075); w.style.opacity = (0.16 + 0.84 * t).toFixed(3); });
    el.slabel.style.opacity = seg(p, 0.81, 0.83).toFixed(2);
    const g = eOB(seg(p, 0.835, 0.875));
    el.blob.style.width = (clamp(g, 0, 1.12) * 1.9).toFixed(3) + 'em';
    el.blob.style.transform = RM ? '' : `rotate(${(Math.sin(p * 70) * 4 * clamp(g)).toFixed(2)}deg)`;
    el.blob.firstElementChild.style.opacity = clamp((g - 0.55) * 3).toFixed(2);

    // 5. cards rise, hold, leave; toggles flip
    const e1 = eIO(seg(p, 0.86, 0.9)), e1o = eIO(seg(p, 0.915, 0.945));
    put(el.ec1, e1 * (1 - e1o), 0, lerp(vh * 0.7, 0, e1) - vh * 0.7 * e1o, 1, 0, (1 - e1) * 6, 'X');
    const e2 = eIO(seg(p, 0.925, 0.955)), e2o = eIO(seg(p, 0.96, 0.985));
    put(el.ec2, e2 * (1 - e2o), 0, lerp(vh * 0.7, 0, e2) - vh * 0.7 * e2o, 1, 0, (1 - e2) * 6, 'X');
    togs.forEach((t, i) => t.classList.toggle('on', p > 0.945 + i * 0.004));

    if (el.dev && /dev/.test(location.search)) { el.dev.style.opacity = 1; el.dev.textContent = 'p=' + p.toFixed(3); }
  }

  // ---- scroll -> smoothed progress ----
  let cur = -1, tgt = 0, raf = 0;
  const targetP = () => { const total = track.offsetHeight - innerHeight; return clamp(-track.getBoundingClientRect().top / total); };
  function loop() {
    tgt = targetP();
    cur = cur < 0 ? tgt : cur + (tgt - cur) * (RM ? 1 : 0.14);
    if (Math.abs(tgt - cur) < 0.00008) cur = tgt;
    render(cur);
    raf = Math.abs(tgt - cur) > 0 ? requestAnimationFrame(loop) : 0;
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', () => { layout(); cur = -1; kick(); });
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => { layout(); cur = -1; kick(); });
  layout(); kick();
  window.__story = { render, layout, snap: (p) => { cur = p; render(p); } };
})();
