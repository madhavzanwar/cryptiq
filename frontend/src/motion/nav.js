/* Cryptiq side dock controller (plain JS, no dependencies).
   Markup: #dock > .dock-launch[aria-controls=dockMenu] + ul#dockMenu > li > a[href][data-p?]
   API: window.CryptiqNav = { open(), close(), toggle(), isOpen(), setCurrent(hrefOrIndex) }
   Links with data-p="0.3" scroll the pinned #story track to that progress; other links scroll to their #id if it exists. */
(() => {
  const dock = document.getElementById('dock');
  if (!dock) return;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const btn = dock.querySelector('.dock-launch');
  const menu = dock.querySelector('.dock-menu');
  const links = [...menu.querySelectorAll('a')];
  links.forEach((a, i) => a.closest('li').style.setProperty('--i', i));

  let open = false;
  function set(v, returnFocus) {
    open = v;
    dock.classList.toggle('open', v);
    btn.setAttribute('aria-expanded', String(v));
    btn.setAttribute('aria-label', v ? 'Close menu' : 'Open menu');
    menu.toggleAttribute('inert', !v);
    menu.setAttribute('aria-hidden', String(!v));
    if (!v && returnFocus) btn.focus();
  }
  function setCurrent(which) {
    const a = typeof which === 'number' ? links[which] : links.find((l) => l.getAttribute('href') === which);
    links.forEach((l) => { if (l === a) l.setAttribute('aria-current', 'page'); else l.removeAttribute('aria-current'); });
  }

  btn.addEventListener('click', () => set(!open, false));
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); set(true); links[0].focus(); }
  });
  menu.addEventListener('keydown', (e) => {
    const i = links.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); links[(i + 1) % links.length].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); links[(i - 1 + links.length) % links.length].focus(); }
    else if (e.key === 'Home') { e.preventDefault(); links[0].focus(); }
    else if (e.key === 'End') { e.preventDefault(); links[links.length - 1].focus(); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) set(false, true); });
  document.addEventListener('pointerdown', (e) => { if (open && !dock.contains(e.target)) set(false, false); });

  links.forEach((a) => a.addEventListener('click', (e) => {
    const href = a.getAttribute('href');
    const story = document.getElementById('story');
    const behavior = RM ? 'auto' : 'smooth';
    if (a.dataset.p && story) {
      e.preventDefault();
      const total = story.offsetHeight - innerHeight;
      scrollTo({ top: story.offsetTop + parseFloat(a.dataset.p) * total, behavior });
    } else if (href && href.length > 1 && document.querySelector(href)) {
      e.preventDefault();
      document.querySelector(href).scrollIntoView({ behavior, block: 'start' });
      history.replaceState(null, '', href);
    } else if (href && href.length > 1) {
      e.preventDefault(); // destination page not built yet
    }
    setCurrent(href);
    set(false, true);
  }));

  // scroll spy for real sections
  const spy = links.map((a) => ({ a, t: a.getAttribute('href').length > 1 && !a.dataset.p ? document.querySelector(a.getAttribute('href')) : null })).filter((x) => x.t);
  if (spy.length && !document.getElementById('story')) {
    const onScroll = () => {
      let cur = null;
      spy.forEach(({ a, t }) => { if (t.getBoundingClientRect().top < innerHeight * 0.4) cur = a; });
      if (cur && !cur.hasAttribute('aria-current')) setCurrent(cur.getAttribute('href'));
    };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }

  set(false, false);
  window.CryptiqNav = { open: () => set(true), close: () => set(false, true), toggle: () => set(!open, false), isOpen: () => open, setCurrent };
})();
