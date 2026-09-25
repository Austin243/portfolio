(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // ---------- light / dark theme: dark unless the visitor picks light ----------
  const root = document.documentElement;
  const themeBtns = $$('[data-theme-set]'), themeMeta = $('meta[name="theme-color"]');
  const setTheme = (t) => {
    root.dataset.theme = t;
    themeBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.themeSet === t)));
    if (themeMeta) themeMeta.content = getComputedStyle(root).getPropertyValue('--bg').trim();
  };
  themeBtns.forEach((b) => b.addEventListener('click', () => {
    try { localStorage.setItem('theme', b.dataset.themeSet); } catch (e) {}
    setTheme(b.dataset.themeSet);
  }));
  setTheme(root.dataset.theme === 'light' ? 'light' : 'dark');

  // ---------- links that leave the site, and PDFs and slides, open in a new tab ----------
  $$('a[href]').forEach((a) => {
    if (!/^https?:$/.test(a.protocol)) return;
    if (a.origin !== location.origin || /\.(pdf|pptx)$/i.test(a.pathname)) { a.target = '_blank'; a.rel = 'noopener'; }
  });

  // ---------- file tree as a drawer on narrow screens ----------
  const side = $('.side'), scrim = $('.scrim'), filesBtn = $('.brand .files');
  const setDrawer = (open) => {
    side.classList.toggle('open', open);
    scrim.classList.toggle('open', open);
    filesBtn.setAttribute('aria-expanded', String(open));
  };
  filesBtn.addEventListener('click', () => setDrawer(!side.classList.contains('open')));
  scrim.addEventListener('click', () => setDrawer(false));
  side.addEventListener('click', (e) => { if (e.target.closest('a')) setDrawer(false); });
  side.addEventListener('keydown', (e) => { if (e.key === 'Escape') { setDrawer(false); filesBtn.focus(); } });

  const tabBar = $('.tabs'), openTab = $('.tabs a.on');
  if (openTab && openTab.offsetLeft + openTab.offsetWidth > tabBar.clientWidth) tabBar.scrollLeft = openTab.offsetLeft - 16;

  // ---------- active file tab and status bar follow the scroll position ----------
  const names = { incar: 'INCAR', structures: 'structures/', research: 'jobs/', publications: 'OUTCAR', news: 'OSZICAR', about: 'CONTCAR' };
  const tabs = $$('.tabs a[href^="#"]'), statusFile = $('.status .file');
  const setActive = (id) => {
    tabs.forEach((a) => {
      const on = a.getAttribute('href') === '#' + id;
      a.classList.toggle('on', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    $$('.tree a[data-sec]').forEach((a) => a.classList.toggle('on', a.dataset.sec === id));
    if (statusFile && names[id]) statusFile.textContent = names[id];
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-20% 0px -70% 0px' });
    $$('main section[id]').forEach((s) => io.observe(s));
  }

  // ---------- structures viewers: one per group (electrides/, templates/) ----------
  const sceneData = $('#scene-data');
  if (!sceneData) return;
  const SCENES = JSON.parse(sceneData.textContent);
  // wide screens: header pane beside the view; phones: pane collapsed under the view
  const wide = window.matchMedia('(min-width: 900px)');
  $$('.vgroup').forEach((V) => {
    const TABS = JSON.parse(V.dataset.tabs);
    const cv = $('canvas.gl', V), ov = $('canvas.ov', V), stage = $('.vstage', V), pane = $('.vpane', V);
    const opts = $('.vopts', V), sbar = $('.sbar', V);
    let tab = 0, v = 0, eng = null, shown = -1;
    const cache = {};
    const si = () => { const t = TABS[tab]; return t[Math.min(v, t.length - 1)]; };

    function show(s) {
      if (!eng || s === shown) return;
      shown = s;
      if (cache[s]) { eng.setScene(cache[s]); return; }
      if (eng.status !== 'nogl') { eng.status = 'loading'; eng.dirty = true; }
      fetch(SCENES[s].src).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }).then((d) => {
        cache[s] = d;
        if (shown === s) eng.setScene(d);
      }).catch(() => { if (shown === s && eng.status !== 'nogl') { eng.status = 'error'; eng.dirty = true; } });
    }
    function render() {
      const s = si();
      $$('.vt', V).forEach((b, i) => { b.setAttribute('aria-selected', String(i === tab)); b.tabIndex = i === tab ? 0 : -1; });
      $$('[data-tab]', V).forEach((el) => { el.hidden = Number(el.dataset.tab) !== tab; });
      $$('[data-tab] .vb', V).forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.v) === v)));
      $$('[data-scene]', V).forEach((el) => { el.hidden = Number(el.dataset.scene) !== s; });
      $$('.vfile', V).forEach((el) => { el.textContent = SCENES[s].file; });
      cv.setAttribute('aria-label', SCENES[s].label);
      show(s);
    }
    function pick(t, variant) { tab = t; v = variant || 0; render(); }
    $$('.vt', V).forEach((b, i) => {
      b.addEventListener('click', () => pick(i));
      b.addEventListener('keydown', (e) => {
        const n = TABS.length, k = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!k) return;
        e.preventDefault(); pick((tab + k + n) % n); $$('.vt', V)[tab].focus();
      });
    });
    $$('[data-tab] .vb', V).forEach((b) => b.addEventListener('click', () => { v = Number(b.dataset.v); render(); }));
    $$(`[data-open-tab^="${V.id}:"]`).forEach((a) => a.addEventListener('click', () => pick(Number(a.dataset.openTab.split(':')[1]))));

    // the state switcher sits on the view when there is room for it, otherwise in the bar above
    const placeOpts = () => {
      const to = wide.matches && stage.clientWidth >= 560 ? stage : sbar;
      if (opts.parentElement !== to) to.prepend(opts);
    };
    const syncPane = () => { pane.open = wide.matches; placeOpts(); };
    window.addEventListener('resize', placeOpts);
    if ('ResizeObserver' in window) new ResizeObserver(placeOpts).observe(stage);
    syncPane();
    if (wide.addEventListener) wide.addEventListener('change', syncPane);

    // WebGL starts when the viewer is about to scroll into view
    function start() {
      if (eng) return;
      const r = stage.getBoundingClientRect();
      eng = new VestaGL(Math.max(1, Math.round(r.width)), Math.max(1, Math.round(r.height)));
      const coarse = window.matchMedia('(pointer: coarse)').matches;
      eng.hint = coarse ? 'drag to rotate · pinch to zoom' : 'drag to rotate · ⌘/ctrl-scroll to zoom';
      const small = r.width < 520;
      eng.triX = small ? 34 : 40; eng.triY = small ? 32 : 38; eng.readY = small ? 20 : 24;
      eng.attach(undefined, ov);
      eng.attach(cv);
      if ('ResizeObserver' in window) {
        new ResizeObserver(() => {
          const b = stage.getBoundingClientRect();
          if (b.width > 0 && b.height > 0) eng.resize(Math.round(b.width), Math.round(b.height));
        }).observe(stage);
      }
      cv.addEventListener('pointerdown', (e) => eng.down(e));
      cv.addEventListener('pointermove', (e) => eng.move(e));
      cv.addEventListener('pointerup', (e) => eng.up(e));
      cv.addEventListener('pointercancel', (e) => eng.up(e));
      cv.addEventListener('keydown', (e) => { if (eng.key(e)) e.preventDefault(); });
      cv.addEventListener('wheel', (e) => {
        if (e.ctrlKey || e.metaKey) { e.preventDefault(); eng.zoomBy(Math.exp(-e.deltaY * 0.01)); }
      }, { passive: false });
      $$('[data-act]', V).forEach((b) => b.addEventListener('click', () => {
        const a = b.dataset.act;
        if (a === 'in') eng.zoomBy(1.25); else if (a === 'out') eng.zoomBy(0.8); else eng.resetView();
      }));
      const loop = () => {
        requestAnimationFrame(loop);
        if (eng.dirty) { try { eng.draw(); } catch (err) { eng.dirty = false; console.error(err); } }
      };
      requestAnimationFrame(loop);
      show(si());
    }
    if ('IntersectionObserver' in window) {
      const vio = new IntersectionObserver((es) => {
        if (es.some((e) => e.isIntersecting)) { vio.disconnect(); start(); }
      }, { rootMargin: '300px 0px' });
      vio.observe(stage);
    } else {
      start();
    }
    render();
  });
})();
