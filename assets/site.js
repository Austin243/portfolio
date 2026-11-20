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

  // ---------- a link to a paper in the list is named after where the paper appeared ----------
  const refs = $$('.ref'), refName = {};
  refs.forEach((r) => {
    const k = $('.ref-k', r), j = k && $('i', k), y = k && $('b', k);
    refName[r.id.replace(/^ref-/, '')] = j ? j.textContent + (y ? ' ' + y.textContent : '') : 'manuscript';
  });
  const cite = (key) => (refName[key] ? '<a class="cite" href="#ref-' + key + '" data-ref="' + key + '">' + refName[key] + '</a>' : '');
  window.LP_CITE = cite;   // the step-by-step figures name their paper the same way
  $$('a.cite[data-ref]').forEach((a) => { if (refName[a.dataset.ref]) a.textContent = refName[a.dataset.ref]; });
  $$('.refs').forEach((g) => { const c = $('.group small', g); if (c) c.textContent = String($$('.ref', g).length); });
  // arriving from another page at one entry (a paper in the list, a news item): mark it
  const arrived = /^#(ref-|v\d)/.test(location.hash) ? document.getElementById(location.hash.slice(1)) : null;
  if (arrived) arrived.classList.add('flash');

  // ---------- the research cards: one row that moves sideways, with the arrows, the arrow keys, a drag, or a swipe ----------
  const shelf = $('.shelf'), shelfNav = $('.shelf-nav');
  const motion = () => (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');
  let shelfReset = () => {}, shelfShow = () => {};
  if (shelf && shelfNav) {
    const prev = $('.prev', shelfNav), next = $('.next', shelfNav), count = $('.count', shelfNav), ticksEl = $('.ticks', shelfNav);
    const shown = () => refs.filter((r) => !r.hidden);
    const pad = () => parseFloat(getComputedStyle(shelf).scrollPaddingLeft) || 0;
    // the scroll position at which a card sits at the left edge of the row
    const startOf = (c) => c.getBoundingClientRect().left - shelf.getBoundingClientRect().left + shelf.scrollLeft - pad();
    const maxLeft = () => shelf.scrollWidth - shelf.clientWidth;
    const to = (x, instant) => shelf.scrollTo({ left: Math.max(0, Math.min(maxLeft(), x)), behavior: instant ? 'auto' : motion() });
    // the cards in view: most of each one inside the row
    const inView = () => {
      const r = shelf.getBoundingClientRect();
      return shown().filter((c) => { const b = c.getBoundingClientRect(); return Math.min(b.right, r.right) - Math.max(b.left, r.left) >= 0.6 * b.width; });
    };
    // the card at the left edge now, or the one the row is already on its way to (a second press during a move adds to it)
    let aim = -1, aimAt = 0;
    const current = () => {
      if (aim >= 0 && performance.now() - aimAt < 700) return aim;
      const x = shelf.scrollLeft, S = shown().map(startOf); let k = 0; S.forEach((v, i) => { if (Math.abs(v - x) < Math.abs(S[k] - x)) k = i; }); return k;
    };
    // how many cards fit side by side
    const perView = () => { const c = shown()[0]; if (!c) return 1; const g = parseFloat(getComputedStyle(c.parentNode).columnGap) || 0; return Math.max(1, Math.floor((shelf.clientWidth - pad() + g) / (c.offsetWidth + g))); };
    const goTo = (i) => { const cs = shown(); if (!cs.length) return; aim = Math.max(0, Math.min(cs.length - 1, i)); aimAt = performance.now(); to(startOf(cs[aim])); };
    const step = (dir) => goTo(current() + dir);                 // the arrow keys: one card
    const page = (dir) => goTo(current() + dir * perView());    // the buttons: as many as fit

    // under the row: a mark for every card shown, dark for the ones in view; a click on one brings that card to the edge
    let ticks = [];
    const build = () => {
      ticksEl.textContent = ''; ticks = [];
      $$('.refs', shelf).forEach((g) => {
        const cs = $$('.ref', g).filter((c) => !c.hidden);
        if (!cs.length) return;
        if (ticks.length) { const sep = document.createElement('span'); sep.className = 'sep'; ticksEl.appendChild(sep); }
        cs.forEach((c) => {
          const b = document.createElement('button'), h = $('h4', c);
          b.type = 'button'; b.tabIndex = -1; b.title = h ? h.textContent : '';
          b.addEventListener('click', () => to(startOf(c)));
          ticksEl.appendChild(b); ticks.push([c, b]);
        });
      });
    };
    let queued = 0;
    const update = () => {
      queued = 0;
      const x = shelf.scrollLeft, m = maxLeft(), vis = inView(), all = shown();
      prev.disabled = x <= 2; next.disabled = x >= m - 2;
      shelf.classList.toggle('more-right', x < m - 2);
      ticks.forEach(([c, b]) => b.classList.toggle('on', vis.indexOf(c) >= 0));
      const a = all.indexOf(vis[0]) + 1, z = all.indexOf(vis[vis.length - 1]) + 1;
      count.textContent = vis.length ? (a === z ? a : a + '–' + z) + ' of ' + all.length : '';
    };
    const later = () => { if (!queued) queued = requestAnimationFrame(update); };
    shelf.addEventListener('scroll', later, { passive: true });
    for (const ev of ['wheel', 'touchstart']) shelf.addEventListener(ev, () => { aim = -1; }, { passive: true });   // a move by hand starts from where the row is
    window.addEventListener('resize', later);
    if ('ResizeObserver' in window) new ResizeObserver(later).observe(shelf);
    prev.addEventListener('click', () => page(-1));
    next.addEventListener('click', () => page(1));

    // keys: with the row (or something in it) focused, and with nothing focused while the row is on screen
    shelf.addEventListener('keydown', (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); step(e.key === 'ArrowRight' ? 1 : -1); }
      else if ((e.key === 'Home' || e.key === 'End') && e.target === shelf) { e.preventDefault(); to(e.key === 'Home' ? 0 : maxLeft()); }
    });
    document.addEventListener('keydown', (e) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
      const t = e.target;
      if (!(t === document.body || t === root || (t.closest && t.closest('.shelf-nav, .filters')))) return;
      const r = shelf.getBoundingClientRect();
      if (r.bottom < window.innerHeight * 0.25 || r.top > window.innerHeight * 0.75) return;
      e.preventDefault(); step(e.key === 'ArrowRight' ? 1 : -1);
    });

    // a drag with the mouse moves the row; a touch screen or a trackpad moves it on its own. A drag is not a click.
    let drag = null, dragged = false;
    shelf.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('button, input, select, textarea')) return;
      drag = { x: e.clientX, left: shelf.scrollLeft, id: e.pointerId, moved: false };
      aim = -1;
    });
    shelf.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x;
      if (!drag.moved) {
        if (Math.abs(dx) < 6) return;
        drag.moved = true; shelf.classList.add('dragging');
        try { shelf.setPointerCapture(e.pointerId); } catch (err) {}
        const sel = window.getSelection && window.getSelection(); if (sel && sel.rangeCount) sel.collapseToStart();
      }
      shelf.scrollLeft = drag.left - dx;
    });
    const drop = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const moved = drag.moved; drag = null;
      if (!moved) return;
      dragged = true; setTimeout(() => { dragged = false; }, 0);
      shelf.classList.toggle('dragging', false);
      aim = -1; goTo(current());   // settle on the card nearest to where it was let go
    };
    shelf.addEventListener('pointerup', drop); shelf.addEventListener('pointercancel', drop);
    shelf.addEventListener('click', (e) => { if (dragged) { e.preventDefault(); e.stopPropagation(); } }, true);
    shelf.addEventListener('dragstart', (e) => e.preventDefault());   // no dragging the pictures or the links out of the page

    shelfReset = () => { aim = -1; build(); to(0, true); update(); };
    shelfShow = (c) => requestAnimationFrame(() => to(startOf(c)));
    build(); update();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(later);
  }

  // ---------- filter chips over the list ----------
  const chips = $$('.filters button[data-f]'), none = $('.empty');
  const tagged = (r, f) => f === 'all' || r.dataset.tags.split(' ').indexOf(f) >= 0;
  const applyFilter = (f) => {
    chips.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.f === f)));
    refs.forEach((r) => { r.hidden = !tagged(r, f); });
    $$('.refs').forEach((g) => { g.hidden = !$$('.ref', g).some((r) => !r.hidden); });
    if (none) none.hidden = refs.some((r) => !r.hidden);
    shelfReset();
  };
  chips.forEach((b) => {
    const n = refs.filter((r) => tagged(r, b.dataset.f)).length, c = $('small', b);
    if (c) c.textContent = String(n);
    b.hidden = n === 0;   // a topic with nothing in the list yet stays out of sight until something is added to it
    b.addEventListener('click', () => applyFilter(b.getAttribute('aria-pressed') === 'true' ? 'all' : b.dataset.f));
  });

  // ---------- a link to a paper shows it in a card on hover, and jumps to it in the list on click ----------
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
    // the page takes the move itself: down to the row, and along the row until the card is at its left edge
    e.preventDefault();
    if (location.hash !== '#ref-' + a.dataset.ref) history.pushState(null, '', '#ref-' + a.dataset.ref);
    if (r.hidden) applyFilter('all');
    const above = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
    window.scrollTo({ top: r.getBoundingClientRect().top + window.scrollY - above, behavior: motion() });
    r.classList.remove('flash'); void r.offsetWidth; r.classList.add('flash');
    shelfShow(r);
  });
  if (arrived && arrived.classList.contains('ref')) window.addEventListener('load', () => shelfShow(arrived));

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
  window.LP_loadScene = loadScene;   // the 3D schemes draw the isosurfaces of the figures' own scenes

  // ---------- live figures ----------
  const SC = window.LP_SCENES || {}, viewers = {}, engines = [];
  window.LP_ENGINES = engines;   // for checking the page from the console
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const level = (f, v) => (f.name ? f.name + ' ' : '') + (v * f.max).toFixed(f.max > 1 ? 1 : 2) + f.unit;

  // A figure is one 3D view, or with fig.pair two of them side by side (a prediction next to its reference) that turn
  // and zoom together. A state of a panel is [scene, name], or for a pair [left scene, right scene, name].
  function makeViewer(host, fig) {
    if (!host || typeof VestaGL === 'undefined') return null;
    const many = fig.panels.length > 1, pair = fig.pair || null;
    const stageHTML = (k) =>
      '<div class="stage"><canvas class="gl" tabindex="0" role="img"></canvas><canvas class="ov" aria-hidden="true"></canvas>' +
      (pair ? '<span class="side-in">' + pair[k] + '</span>' : '<div class="states" role="group" aria-label="State shown"></div>') +
      '<p class="hint">' + (pair ? 'drag either view · both turn' : coarse ? 'drag to rotate · pinch to zoom' : 'drag to rotate') + '</p></div>';
    // the first sentence of the title names the figure; what follows it says how to use it
    const dot = fig.title.indexOf('. '), name = dot < 0 ? fig.title : fig.title.slice(0, dot + 1), rest = dot < 0 ? '' : fig.title.slice(dot + 1);
    host.innerHTML =
      '<div class="fig-main">' +
      '<div class="fig-bar"><div class="panels" role="tablist" aria-label="' + name.replace(/\.$/, '') + '">' +
      (many ? fig.panels.map((p, i) => '<button type="button" role="tab" aria-selected="' + (i === 0) + '" tabindex="' + (i ? -1 : 0) + '">' + p.name + '</button>').join('') : '') +
      '</div>' + (pair ? '<div class="states in-bar" role="group" aria-label="State shown"></div>' : '') +
      '<div class="zoom"><button type="button" data-act="out" aria-label="Zoom out">−</button><button type="button" data-act="in" aria-label="Zoom in">+</button><button type="button" data-act="reset" aria-label="Reset the view">Reset</button></div></div>' +
      (pair ? '<div class="pair">' + stageHTML(0) + stageHTML(1) + '</div>' : stageHTML(0)) + '</div>' +
      '<figcaption class="fig-side">' + (pair ? '<div>' : '') +
      '<p class="fig-title"><b>' + name + '</b>' + rest + '</p>' +
      '<p class="cap"></p>' + (pair ? '</div><div>' : '') + '<div class="legend"></div>' +
      '<label class="iso-row" hidden><span>Isosurface level</span><input type="range" step="0.01" disabled><output></output></label><p class="spec"></p>' +
      (pair ? '</div>' : '') + '</figcaption>';
    const stages = $$('.stage', host), stage = stages[0];
    const sides = stages.map((el) => ({ stage: el, cv: $('canvas.gl', el), ov: $('canvas.ov', el), eng: null, shown: null }));
    const tabs = $$('.panels button', host), statesEl = $('.states', host), capEl = $('.cap', host), legendEl = $('.legend', host);
    const specEl = $('.spec', host), isoRow = $('.iso-row', host), range = isoRow ? $('input', isoRow) : null, out = isoRow ? $('output', isoRow) : null;
    let p = 0, s = 0, pending = null, cam = null;
    const mine = {};   // this figure's own copy of each scene, so its isosurface level is its own
    const state = () => { const st = fig.panels[p].states; return st[Math.min(s, st.length - 1)]; };
    const ids = () => (pair ? state().slice(0, 2) : [state()[0]]);   // the scene of each view
    const cur = () => state()[0];                                    // the scene the caption, legend and slider describe
    // the two views of a pair share one camera: when one is turned or zoomed the other follows
    const follow = (from) => {
      if (!pair || !from.eng || !from.eng.M) return;
      cam = { M: from.eng.M.map((r) => r.slice()), zoom: from.eng.zoom };
      for (const sd of sides) if (sd !== from && sd.eng && sd.eng.M) { sd.eng.M = cam.M.map((r) => r.slice()); sd.eng.zoom = cam.zoom; sd.eng.dirty = true; }
    };

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
    const put = (sd, id) => {
      const eng = sd.eng, d = mine[id], lead = mine[cur()];
      eng.setScene(d);
      if (pair) {
        // the view that arrives second takes the level and the camera of the one already on screen
        if (lead && lead !== d && d.grid && Math.abs(lead.iso - d.iso) > 1e-9) eng.setIso(lead.iso);
        if (cam) { eng.M = cam.M.map((r) => r.slice()); eng.zoom = cam.zoom; eng.dirty = true; }
      }
      syncIso();
    };
    const show = () => {
      const want = ids();
      sides.forEach((sd, k) => {
        const id = want[k], eng = sd.eng;
        if (!eng || id === sd.shown) return;
        sd.shown = id;
        if (mine[id]) { put(sd, id); return; }
        if (eng.status !== 'nogl') { eng.status = 'loading'; eng.dirty = true; }
        loadScene(id, (d) => {
          if (!mine[id]) mine[id] = Object.assign({}, d, { iso0: d.iso });
          if (sd.shown === id) put(sd, id);
        }, () => { if (sd.shown === id && eng.status !== 'nogl') { eng.status = 'error'; eng.dirty = true; } });
      });
    };
    const render = () => {
      const panel = fig.panels[p], id = cur(), sc = SC[id], want = ids();
      tabs.forEach((b, i) => { b.setAttribute('aria-selected', String(i === p)); b.tabIndex = i === p ? 0 : -1; });
      statesEl.hidden = panel.states.length < 2;
      statesEl.innerHTML = panel.states.length < 2 ? '' :
        panel.states.map((st, i) => '<button type="button" data-s="' + i + '" aria-pressed="' + (i === s) + '">' + st[st.length - 1] + '</button>').join('');
      const from = cite(sc.ref);   // the paper this panel comes from
      capEl.innerHTML = ((fig.caps && fig.caps[id]) || sc.cap) + (from ? ' (' + from + ')' : '');
      legendEl.innerHTML = sc.legend.map((e) => '<span><i style="background:' + e[1] + '"></i>' + e[0] + '</span>').join('') +
        (sc.field ? '<span><i class="iso"></i><span class="isoval"></span></span><span>0<b></b>' + (sc.field.max > 1 ? sc.field.max + sc.field.unit : sc.field.max) + '</span>' : '');
      if (specEl) specEl.innerHTML = (fig.specs && fig.specs[id]) || sc.spec;
      sides.forEach((sd, k) => sd.cv.setAttribute('aria-label', SC[want[k]].label));
      syncIso();
      show();
    };
    const pick = (panel, st) => {
      const to = Math.max(0, Math.min(fig.panels.length - 1, panel || 0));
      if (to !== p) cam = null;   // another structure starts from its own view
      p = to; s = st || 0; render();
    };

    tabs.forEach((b, i) => {
      b.addEventListener('click', () => pick(i, 0));
      b.addEventListener('keydown', (e) => {
        const k = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!k) return;
        e.preventDefault(); pick((p + k + tabs.length) % tabs.length, 0); tabs[p].focus();
      });
    });
    statesEl.addEventListener('click', (e) => { const b = e.target.closest('button[data-s]'); if (b) { s = Number(b.dataset.s); render(); } });
    // every view that has its scene on screen
    const live = (fn) => { const want = ids(); sides.forEach((sd, k) => { if (sd.eng && sd.shown === want[k] && mine[want[k]]) fn(sd, mine[want[k]]); }); };
    if (range) range.addEventListener('input', () => {
      const v = Number(range.value), d = mine[cur()]; if (!d) return;
      isoText(v); range.setAttribute('aria-valuetext', level(SC[cur()].field, v));
      if (pending === null) requestAnimationFrame(() => { const x = pending; pending = null; live((sd, sc) => { if (sc.grid) sd.eng.setIso(x); }); });
      pending = v;
    });
    const reset = () => {
      cam = null;
      live((sd, d) => { sd.eng.resetView(); if (d.grid && d.iso !== d.iso0) sd.eng.setIso(d.iso0); });
      syncIso();
    };
    $$('[data-act]', host).forEach((b) => b.addEventListener('click', () => {
      const a = b.dataset.act;
      if (a === 'reset') { reset(); return; }
      sides.forEach((sd) => { if (sd.eng) sd.eng.zoomBy(a === 'in' ? 1.25 : 0.8); });
      follow(sides[0]);
    }));

    // WebGL starts when the figure is about to scroll into view
    const start = () => {
      if (sides[0].eng) return;
      sides.forEach((sd) => {
        const eng = sd.eng = new VestaGL(Math.max(1, sd.stage.clientWidth), Math.max(1, sd.stage.clientHeight)), cv = sd.cv;
        eng.hint = ''; eng.triX = 38; eng.triY = 32; eng.readY = 22;
        eng.attach(undefined, sd.ov);
        eng.attach(cv);
        if ('ResizeObserver' in window) new ResizeObserver(() => { if (sd.stage.clientWidth > 0 && sd.stage.clientHeight > 0) eng.resize(sd.stage.clientWidth, sd.stage.clientHeight); }).observe(sd.stage);
        cv.addEventListener('pointerdown', (e) => { stages.forEach((el) => el.classList.add('touched')); eng.down(e); });
        cv.addEventListener('pointermove', (e) => { eng.move(e); if (eng.ptr.size) follow(sd); });
        cv.addEventListener('pointerup', (e) => eng.up(e));
        cv.addEventListener('pointercancel', (e) => eng.up(e));
        cv.addEventListener('dblclick', reset);
        cv.addEventListener('keydown', (e) => { if (eng.key(e)) { e.preventDefault(); follow(sd); } });
        cv.addEventListener('wheel', (e) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); eng.zoomBy(Math.exp(-e.deltaY * 0.01)); follow(sd); } }, { passive: false });
        engines.push(eng);
      });
      show();
    };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); start(); } }, { rootMargin: '300px 0px' });
      io.observe(stage);
    } else start();
    render();
    return { pick: pick };
  }

  (window.LP_FIGS || []).forEach((f) => { viewers[f.id] = makeViewer(document.getElementById(f.id), f); });

  // a link with data-fig="figure:panel:state" (in the research list and in the overview at the top) opens that view of the figure
  $$('a[data-fig]').forEach((a) => {
    const q = a.dataset.fig.split(':');
    a.addEventListener('click', () => { const v = viewers[q[0]]; if (v) v.pick(Number(q[1] || 0), Number(q[2] || 0)); });
  });

  const loop = () => {
    requestAnimationFrame(loop);
    for (const e of engines) if (e.dirty) { try { e.draw(); } catch (err) { e.dirty = false; console.error(err); } }
  };
  requestAnimationFrame(loop);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => engines.forEach((e) => { e.dirty = true; }));
})();
