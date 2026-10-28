/* Cryptiq reveal helpers: scroll reveals, count-up, meter fill, accordion. No dependencies. */
(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Scroll reveal
  const targets = [...document.querySelectorAll('[data-reveal]')];
  if (RM || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    targets.forEach((el) => io.observe(el));
  }

  // Meter fill and count-up when visible: <div class="track" data-meter="86"> and <span data-count="86">
  const onView = (el, fn) => {
    if (RM || !('IntersectionObserver' in window)) return fn();
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { fn(); io.disconnect(); } }, { threshold: 0.4 });
    io.observe(el);
  };
  document.querySelectorAll('[data-meter]').forEach((track) => {
    const fill = track.querySelector('b'); if (!fill) return;
    fill.style.width = '0%';
    onView(track, () => requestAnimationFrame(() => { fill.style.width = track.dataset.meter + '%'; }));
  });
  document.querySelectorAll('[data-count]').forEach((el) => {
    const to = +el.dataset.count; const fmt = (n) => Math.round(n).toLocaleString('en-US');
    if (RM) { el.textContent = fmt(to); return; }
    el.textContent = '0';
    onView(el, () => {
      const t0 = performance.now(); const dur = 900;
      const step = (t) => { const k = Math.min(1, (t - t0) / dur); el.textContent = fmt(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  });

  // Accordion rows: <div class="faq" aria-expanded="false"> followed by <div class="faq-wrap"><div>answer</div></div>
  document.querySelectorAll('.faq').forEach((row) => {
    row.setAttribute('role', 'button'); row.tabIndex = 0;
    const wrap = row.nextElementSibling && row.nextElementSibling.classList.contains('faq-wrap') ? row.nextElementSibling : null;
    const toggle = () => {
      const open = row.getAttribute('aria-expanded') !== 'true';
      row.setAttribute('aria-expanded', String(open)); if (wrap) wrap.classList.toggle('open', open);
    };
    row.addEventListener('click', toggle);
    row.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  });

  // Credit pill tick demo: any [data-credit-tick] button decrements the sibling .credit .n
  document.querySelectorAll('[data-credit-tick]').forEach((btn) => btn.addEventListener('click', () => {
    const pill = document.querySelector('.credit'); const n = pill && pill.querySelector('.n'); if (!n) return;
    n.textContent = Math.max(0, +n.textContent - 1);
    pill.classList.remove('tick'); void pill.offsetWidth; pill.classList.add('tick');
    pill.classList.toggle('low', +n.textContent <= 1);
  }));
})();
