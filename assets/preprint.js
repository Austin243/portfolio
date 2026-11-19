(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;

  // ---------- light / dark: light unless the visitor picks dark ----------
  const themeBtn = $('.theme'), themeMeta = $('meta[name="theme-color"]');
  const setTheme = (t) => {
    root.dataset.theme = t;
    if (themeBtn) { themeBtn.setAttribute('aria-pressed', String(t === 'dark')); themeBtn.title = t === 'dark' ? 'Light page' : 'Dark page'; }
    if (themeMeta) themeMeta.content = getComputedStyle(root).getPropertyValue('--paper').trim();
  };
  if (themeBtn) themeBtn.addEventListener('click', () => {
    const t = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('lp-theme', t); } catch (e) {}
    setTheme(t);
  });
  setTheme(root.dataset.theme === 'dark' ? 'dark' : 'light');

  // ---------- links that leave the page, and PDFs, open in a new tab ----------
  $$('a[href]').forEach((a) => {
    const out = /^https?:$/.test(a.protocol) && a.host !== location.host;
    if (out || /\.(pdf|pptx)$/i.test(a.pathname)) { a.target = '_blank'; a.rel = 'noopener'; }
  });

  // ---------- the abstract's other format ----------
  const src = $('.src'), absText = $('.abs-text'), incar = $('.incar'), lineno = $('.lineno');
  // number the lines of the abstract in the gutter; the count follows the text as it rewraps
  const numberLines = () => {
    if (!lineno || !absText) return;
    lineno.hidden = absText.hidden;
    if (absText.hidden) return;
    const lh = parseFloat(getComputedStyle(absText).lineHeight), n = Math.round(absText.offsetHeight / lh);
    if (!(lh > 0) || n < 1 || n > 40) return;
    lineno.style.top = absText.offsetTop + 'px'; lineno.style.lineHeight = lh + 'px';
    if (lineno.childElementCount !== n) lineno.innerHTML = Array.from({ length: n }, (_, i) => '<span>' + (i + 1) + '</span>').join('');
  };
  numberLines();
  window.addEventListener('resize', numberLines);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(numberLines);
  if (src && absText && incar) src.addEventListener('click', () => {
    const on = incar.hidden;
    incar.hidden = !on; absText.hidden = on;
    src.textContent = on ? 'view as abstract' : 'view as INCAR';
    src.setAttribute('aria-pressed', String(on));
    numberLines();
  });

  // ---------- reference numbers follow the order of the list ----------
  const refs = $$('.ref'), refN = {};
  refs.forEach((r, i) => {
    refN[r.id.replace(/^ref-/, '')] = i + 1;
    const n = $('.ref-n', r); if (n) n.textContent = '[' + (i + 1) + ']';
  });
  const cite = (key) => (refN[key] ? '<a class="cite" href="#ref-' + key + '" data-ref="' + key + '">[' + refN[key] + ']</a>' : '');
  $$('a.cite[data-ref]').forEach((a) => { if (refN[a.dataset.ref]) a.textContent = '[' + refN[a.dataset.ref] + ']'; });
  $$('.refs').forEach((g) => { const c = $('.group small', g); if (c) c.textContent = String($$('.ref', g).length); });
  // arriving from another page at one entry (a paper in the list, a news item): mark it
  if (/^#(ref-|v\d)/.test(location.hash)) { const hit = document.getElementById(location.hash.slice(1)); if (hit) hit.classList.add('flash'); }

  // ---------- filter chips over the list ----------
  const chips = $$('.filters button[data-f]'), none = $('.empty');
  const tagged = (r, f) => f === 'all' || r.dataset.tags.split(' ').indexOf(f) >= 0;
  const applyFilter = (f) => {
    chips.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.f === f)));
    refs.forEach((r) => { r.hidden = !tagged(r, f); });
    $$('.refs').forEach((g) => { g.hidden = !$$('.ref', g).some((r) => !r.hidden); });
    if (none) none.hidden = refs.some((r) => !r.hidden);
  };
  chips.forEach((b) => {
    const c = $('small', b); if (c) c.textContent = String(refs.filter((r) => tagged(r, b.dataset.f)).length);
    b.addEventListener('click', () => applyFilter(b.getAttribute('aria-pressed') === 'true' ? 'all' : b.dataset.f));
  });

  // ---------- a citation shows its reference on hover, and jumps to it on click ----------
  const pop = document.createElement('div');
  pop.className = 'pop'; pop.setAttribute('role', 'tooltip');
  document.body.appendChild(pop);
  const citeOf = (t) => (t && t.closest ? t.closest('a.cite[data-ref]') : null);
  const showPop = (a) => {
    const r = document.getElementById('ref-' + a.dataset.ref); if (!r) return;
    const k = $('.ref-k', r), h = $('h4', r), au = $('.ref-au', r);
    pop.innerHTML = '<p class="ref-k">' + (k ? k.innerHTML : '') + '</p><h4>' + (h ? h.textContent : '') + '</h4><p class="ref-au">' + (au ? au.innerHTML : '') + '</p>';
    const b = a.getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight, top = parseFloat(getComputedStyle(root).getPropertyValue('--bar')) || 56;
    const x = Math.max(12, Math.min(window.innerWidth - pw - 12, b.left + b.width / 2 - pw / 2));
    const y = b.top - ph - 10 < top + 8 ? b.bottom + 10 : b.top - ph - 10;
    pop.style.left = (x + window.scrollX) + 'px'; pop.style.top = (y + window.scrollY) + 'px';
    pop.classList.add('on');
  };
  const hidePop = () => pop.classList.remove('on');
  document.addEventListener('mouseover', (e) => { const a = citeOf(e.target); if (a) showPop(a); });
  document.addEventListener('mouseout', (e) => { if (citeOf(e.target)) hidePop(); });
  document.addEventListener('focusin', (e) => { const a = citeOf(e.target); if (a) showPop(a); });
  document.addEventListener('focusout', (e) => { if (citeOf(e.target)) hidePop(); });
  document.addEventListener('click', (e) => {
    const a = citeOf(e.target); if (!a) return;
    hidePop();
    const r = document.getElementById('ref-' + a.dataset.ref); if (!r) return;
    if (r.hidden) applyFilter('all');
    r.classList.remove('flash'); void r.offsetWidth; r.classList.add('flash');
  });

  // ---------- the nav marks the section being read ----------
  const navLinks = $$('.nav a[href^="#"]');
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) navLinks.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id)); });
    }, { rootMargin: '-20% 0px -70% 0px' });
    $$('main section[id]').forEach((s) => spy.observe(s));
  }

  // ---------- scenes: one small script per scene, loaded when a figure first needs it ----------
  // calmer element colors than the VESTA defaults stored in the older scene files (the legends match)
  const PALETTE = { H: [0.855, 0.878, 0.91], S: [0.851, 0.706, 0.227], Na: [0.694, 0.643, 0.784] };
  const store = {}, waiting = {};
  window.__lpScene = (id, d) => {
    d.species.forEach((sp) => { if (PALETTE[sp.el]) sp.rgb = PALETTE[sp.el]; });
    store[id] = d;
    (waiting[id] || []).forEach((w) => w.ok(d));
    delete waiting[id];
  };
  const loadScene = (id, ok, fail) => {
    if (store[id]) { ok(store[id]); return; }
    if (!waiting[id]) {
      waiting[id] = [];
      const s = document.createElement('script');
      s.src = 'assets/scenes/' + id + '.js'; s.async = true;
      s.onerror = () => { (waiting[id] || []).forEach((w) => w.fail()); delete waiting[id]; };
      document.head.appendChild(s);
    }
    waiting[id].push({ ok: ok, fail: fail });
  };

  // ---------- live figures ----------
  const SC = window.LP_SCENES || {}, viewers = {}, engines = [];
  window.LP_ENGINES = engines;   // for checking the page from the console
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const L = 'abcdefgh';
  const level = (f, v) => (f.name ? f.name + ' ' : '') + (v * f.max).toFixed(f.max > 1 ? 1 : 2) + f.unit;

  function makeViewer(host, fig, opt) {
    if (!host || typeof VestaGL === 'undefined') return null;
    const many = fig.panels.length > 1;
    host.innerHTML =
      '<div class="fig-main">' +
      (opt.compact ? '' :
        '<div class="fig-bar"><div class="panels" role="tablist" aria-label="Panels of Figure ' + opt.n + '">' +
        fig.panels.map((p, i) => '<button type="button" role="tab" aria-selected="' + (i === 0) + '" tabindex="' + (i ? -1 : 0) + '"><b>' + L[i] + '</b><span>' + p.name + '</span></button>').join('') +
        '</div><div class="zoom"><button type="button" data-act="out" aria-label="Zoom out">−</button><button type="button" data-act="in" aria-label="Zoom in">+</button><button type="button" data-act="reset" aria-label="Reset the view">Reset</button></div></div>') +
      '<div class="stage"><canvas class="gl" tabindex="0" role="img"></canvas><canvas class="ov" aria-hidden="true"></canvas>' +
      '<div class="states" role="group" aria-label="State shown"></div><p class="hint">' + (coarse ? 'drag to rotate · pinch to zoom' : 'drag to rotate') + '</p></div></div>' +
      '<figcaption class="fig-side">' +
      (opt.compact ? '' : '<p class="fig-title"><b>Figure ' + opt.n + '</b><span class="pipe">|</span>' + fig.title + '</p>') +
      '<p class="cap"></p><div class="legend"></div>' +
      (opt.compact ? '' : '<label class="iso-row" hidden><span>Isosurface level</span><input type="range" step="0.01" disabled><output></output></label><p class="spec"></p>') +
      '</figcaption>';
    const stage = $('.stage', host), cv = $('canvas.gl', host), ov = $('canvas.ov', host);
    const tabs = $$('.panels button', host), statesEl = $('.states', host), capEl = $('.cap', host), legendEl = $('.legend', host);
    const specEl = $('.spec', host), isoRow = $('.iso-row', host), range = isoRow ? $('input', isoRow) : null, out = isoRow ? $('output', isoRow) : null;
    let p = 0, s = 0, eng = null, shown = null, pending = null;
    const mine = {};   // this figure's own copy of each scene, so its isosurface level is its own
    const cur = () => { const st = fig.panels[p].states; return st[Math.min(s, st.length - 1)][0]; };

    const isoText = (v) => {
      const f = SC[cur()].field, t = $('.isoval', legendEl);
      if (t) t.textContent = v == null ? f.name || 'isosurface' : level(f, v);
      if (out) out.textContent = v == null ? '' : (v * f.max).toFixed(f.max > 1 ? 1 : 2);
    };
    const syncIso = () => {
      const sc = SC[cur()], d = mine[cur()];
      if (isoRow) isoRow.hidden = !sc.field;
      if (!sc.field) return;
      if (!d) { if (range) range.disabled = true; isoText(null); return; }
      if (range) {
        range.min = Math.max(0.2, d.iso0 - 0.3).toFixed(2); range.max = Math.min(0.95, d.iso0 + 0.2).toFixed(2);
        range.value = d.iso; range.disabled = false;
        range.setAttribute('aria-valuetext', level(sc.field, d.iso));
      }
      isoText(d.iso);
    };
    const show = (id) => {
      if (!eng || id === shown) return;
      shown = id;
      if (mine[id]) { eng.setScene(mine[id]); syncIso(); return; }
      if (eng.status !== 'nogl') { eng.status = 'loading'; eng.dirty = true; }
      loadScene(id, (d) => {
        if (!mine[id]) mine[id] = Object.assign({}, d, { iso0: d.iso });
        if (shown === id) { eng.setScene(mine[id]); syncIso(); }
      }, () => { if (shown === id && eng.status !== 'nogl') { eng.status = 'error'; eng.dirty = true; } });
    };
    const render = () => {
      const panel = fig.panels[p], id = cur(), sc = SC[id];
      tabs.forEach((b, i) => { b.setAttribute('aria-selected', String(i === p)); b.tabIndex = i === p ? 0 : -1; });
      statesEl.hidden = panel.states.length < 2;
      statesEl.innerHTML = panel.states.length < 2 ? '' : panel.states.map((st, i) => '<button type="button" data-s="' + i + '" aria-pressed="' + (i === s) + '">' + st[1] + '</button>').join('');
      capEl.innerHTML = (opt.compact ? '<b>Graphical abstract</b><span class="pipe"> | </span>' : many ? '<b>' + L[p] + '</b>, ' : '') + sc.cap + ' ' + cite(sc.ref);
      legendEl.innerHTML = sc.legend.map((e) => '<span><i style="background:' + e[1] + '"></i>' + e[0] + '</span>').join('') +
        (sc.field ? '<span><i class="iso"></i><span class="isoval"></span></span><span>0<b></b>' + (sc.field.max > 1 ? sc.field.max + sc.field.unit : sc.field.max) + '</span>' : '');
      if (specEl) specEl.innerHTML = sc.spec;
      cv.setAttribute('aria-label', sc.label);
      syncIso();
      show(id);
    };
    const pick = (panel, state) => { p = Math.max(0, Math.min(fig.panels.length - 1, panel || 0)); s = state || 0; render(); };

    tabs.forEach((b, i) => {
      b.addEventListener('click', () => pick(i, 0));
      b.addEventListener('keydown', (e) => {
        const k = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!k) return;
        e.preventDefault(); pick((p + k + tabs.length) % tabs.length, 0); tabs[p].focus();
      });
    });
    statesEl.addEventListener('click', (e) => { const b = e.target.closest('button[data-s]'); if (b) { s = Number(b.dataset.s); render(); } });
    if (range) range.addEventListener('input', () => {
      const v = Number(range.value), d = mine[cur()]; if (!d) return;
      isoText(v); range.setAttribute('aria-valuetext', level(SC[cur()].field, v));
      if (pending === null) requestAnimationFrame(() => { const x = pending; pending = null; if (eng && shown === cur()) eng.setIso(x); });
      pending = v;
    });
    const reset = () => {
      if (!eng) return;
      const d = mine[cur()];
      eng.resetView();
      if (d && d.grid && d.iso !== d.iso0) { eng.setIso(d.iso0); syncIso(); }
    };
    $$('[data-act]', host).forEach((b) => b.addEventListener('click', () => {
      if (!eng) return;
      const a = b.dataset.act;
      if (a === 'in') eng.zoomBy(1.25); else if (a === 'out') eng.zoomBy(0.8); else reset();
    }));

    // WebGL starts when the figure is about to scroll into view
    const start = () => {
      if (eng) return;
      eng = new VestaGL(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight));
      eng.hint = ''; eng.triX = 38; eng.triY = 32; eng.readY = 22;
      eng.attach(undefined, ov);
      eng.attach(cv);
      if ('ResizeObserver' in window) new ResizeObserver(() => { if (stage.clientWidth > 0 && stage.clientHeight > 0) eng.resize(stage.clientWidth, stage.clientHeight); }).observe(stage);
      cv.addEventListener('pointerdown', (e) => { stage.classList.add('touched'); eng.down(e); });
      cv.addEventListener('pointermove', (e) => eng.move(e));
      cv.addEventListener('pointerup', (e) => eng.up(e));
      cv.addEventListener('pointercancel', (e) => eng.up(e));
      cv.addEventListener('dblclick', reset);
      cv.addEventListener('keydown', (e) => { if (eng.key(e)) e.preventDefault(); });
      cv.addEventListener('wheel', (e) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); eng.zoomBy(Math.exp(-e.deltaY * 0.01)); } }, { passive: false });
      engines.push(eng);
      show(cur());
    };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); start(); } }, { rootMargin: '300px 0px' });
      io.observe(stage);
    } else start();
    render();
    return { pick: pick };
  }

  (window.LP_FIGS || []).forEach((f, i) => { viewers[f.id] = makeViewer(document.getElementById(f.id), f, { n: i + 1 }); });
  if (window.LP_HERO) viewers.ga = makeViewer(document.getElementById('ga'), window.LP_HERO, { compact: true });

  // "Fig. 2b" in the list opens that panel of the figure
  $$('a[data-fig]').forEach((a) => a.addEventListener('click', () => {
    const q = a.dataset.fig.split(':'), v = viewers[q[0]];
    if (v) v.pick(Number(q[1] || 0), Number(q[2] || 0));
  }));

  const loop = () => {
    requestAnimationFrame(loop);
    for (const e of engines) if (e.dirty) { try { e.draw(); } catch (err) { e.dirty = false; console.error(err); } }
  };
  requestAnimationFrame(loop);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => engines.forEach((e) => { e.dirty = true; }));
})();
