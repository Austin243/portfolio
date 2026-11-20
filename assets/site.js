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

  // ---------- rows of cards that move sideways: the research list, and the Figures (one card per paper) ----------
  // Arrows and arrow keys move a row card by card, a click on a mark or a name brings that card to the left edge, a
  // trackpad or a finger moves it freely, and (where o.drag) so does a mouse drag. A row whose cards differ much in
  // height (o.fit) takes the height of the card in view.
  const motion = () => (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');
  const shelves = [];
  const makeShelf = (shelf, o) => {
    const prev = o.prev, next = o.next, count = o.count, shown = o.items;
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
    const nearest = () => { const x = shelf.scrollLeft, S = shown().map(startOf); let k = 0; S.forEach((v, i) => { if (Math.abs(v - x) < Math.abs(S[k] - x)) k = i; }); return k; };
    const current = () => (aim >= 0 && performance.now() - aimAt < 700 ? aim : nearest());
    // how many cards fit side by side
    const perView = () => { const c = shown()[0]; if (!c) return 1; const g = parseFloat(getComputedStyle(c.parentNode).columnGap) || 0; return Math.max(1, Math.floor((shelf.clientWidth - pad() + g) / (c.offsetWidth + g))); };
    const goTo = (i, instant) => { const cs = shown(); if (!cs.length) return; aim = Math.max(0, Math.min(cs.length - 1, i)); aimAt = performance.now(); to(startOf(cs[aim]), instant); };
    const step = (dir) => goTo(current() + dir);                 // the arrow keys: one card
    const page = (dir) => goTo(current() + dir * perView());    // the buttons: as many as fit

    // the marks (o.ticks: one per card, grouped by o.groups) or the names (o.names: [button, card]) that pick a card
    let ticks = [];
    const build = () => {
      if (!o.ticks) return;
      o.ticks.textContent = ''; ticks = [];
      o.groups().forEach((cs) => {
        cs = cs.filter((c) => !c.hidden);
        if (!cs.length) return;
        if (ticks.length) { const sep = document.createElement('span'); sep.className = 'sep'; o.ticks.appendChild(sep); }
        cs.forEach((c) => {
          const b = document.createElement('button'), h = $('h4', c);
          b.type = 'button'; b.tabIndex = -1; b.title = h ? h.textContent : '';
          b.addEventListener('click', () => to(startOf(c)));
          o.ticks.appendChild(b); ticks.push([c, b]);
        });
      });
    };
    (o.names || []).forEach(([b, c]) => b.addEventListener('click', () => goTo(shown().indexOf(c))));
    // the height of the card in view, for a row whose cards differ in height
    // A jump straight to a card sets the height at once, without the easing: the page then already has the length
    // the jump needs, and a link to a figure low in a tall card does not stop short of it.
    let fitH = 0;
    const fit = (instant) => {
      if (!o.fit) return;
      const c = shown()[nearest()]; if (!c) return;
      const cs = getComputedStyle(shelf), h = Math.ceil(c.offsetHeight + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom));
      if (h === fitH) return;
      fitH = h;
      if (instant) { shelf.style.transition = 'none'; shelf.style.height = h + 'px'; void shelf.offsetHeight; shelf.style.transition = ''; }
      else shelf.style.height = h + 'px';
    };
    let queued = 0;
    const update = (instant) => {
      queued = 0;
      const x = shelf.scrollLeft, m = maxLeft(), vis = inView(), all = shown();
      prev.disabled = x <= 2; next.disabled = x >= m - 2;
      shelf.classList.toggle('more-right', x < m - 2);
      ticks.forEach(([c, b]) => b.classList.toggle('on', vis.indexOf(c) >= 0));
      const a = all.indexOf(vis[0]) + 1, z = all.indexOf(vis[vis.length - 1]) + 1;
      count.textContent = vis.length ? (a === z ? a : a + '–' + z) + ' of ' + all.length : '';
      if (o.names) {
        const here = all[nearest()];
        o.names.forEach(([b, c]) => {
          const on = c === here;
          if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
          if (on && o.names.row && o.names.row.scrollWidth > o.names.row.clientWidth) {
            const row = o.names.row, want = b.offsetLeft - row.offsetLeft - (row.clientWidth - b.offsetWidth) / 2;
            if (Math.abs(row.scrollLeft - want) > 4) row.scrollTo({ left: Math.max(0, want), behavior: motion() });
          }
        });
      }
      fit(instant === true);
    };
    const later = () => { if (!queued) queued = requestAnimationFrame(update); };
    shelf.addEventListener('scroll', later, { passive: true });
    for (const ev of ['wheel', 'touchstart']) shelf.addEventListener(ev, () => { aim = -1; }, { passive: true });   // a move by hand starts from where the row is
    window.addEventListener('resize', later);
    if ('ResizeObserver' in window) { const ro = new ResizeObserver(later); ro.observe(shelf); if (o.fit) shown().forEach((c) => ro.observe(c)); }
    prev.addEventListener('click', () => page(-1));
    next.addEventListener('click', () => page(1));
    // keys: with the row (or something of its own) focused; the page-wide arrow keys are handled below, for all rows
    shelf.addEventListener('keydown', (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.target !== shelf && !(e.target.closest && e.target.closest('.ref'))) return;   // keys inside a figure are the figure's
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); step(e.key === 'ArrowRight' ? 1 : -1); }
      else if ((e.key === 'Home' || e.key === 'End') && e.target === shelf) { e.preventDefault(); to(e.key === 'Home' ? 0 : maxLeft()); }
    });
    // a drag with the mouse moves the row; a touch screen or a trackpad moves it on its own. A drag is not a click.
    if (o.drag) {
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
    }
    build(); update();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(later);
    const api = {
      shelf: shelf, step: step,
      reset: () => { aim = -1; build(); to(0, true); update(); },
      show: (c, instant) => { const i = shown().indexOf(c); if (i < 0) return; if (instant) { goTo(i, true); update(true); } else requestAnimationFrame(() => goTo(i)); }
    };
    shelves.push(api);
    return api;
  };
  // The arrow keys move the row in the middle of the screen, when nothing else has the keys (a button of a figure,
  // a canvas or a slider keeps them).
  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
    const t = e.target;
    if (!(t === document.body || t === root || (t.closest && t.closest('.shelf-nav, .filters, .papers-bar')))) return;
    const mid = window.innerHeight / 2, s = shelves.find((x) => { const r = x.shelf.getBoundingClientRect(); return r.top <= mid && r.bottom >= mid; });
    if (!s) return;
    e.preventDefault(); s.step(e.key === 'ArrowRight' ? 1 : -1);
  });

  const shelf = $('.shelf:not(.papers)'), shelfNav = $('.shelf-nav');
  let research = null;
  if (shelf && shelfNav) {
    research = makeShelf(shelf, {
      items: () => refs.filter((r) => !r.hidden), groups: () => $$('.refs', shelf).map((g) => $$('.ref', g)), ticks: $('.ticks', shelfNav),
      prev: $('.prev', shelfNav), next: $('.next', shelfNav), count: $('.count', shelfNav), drag: true
    });
  }
  const shelfReset = () => { if (research) research.reset(); };
  const shelfShow = (c) => { if (research) research.show(c); };

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

  // ---------- Figures: one card per paper, in a row that moves sideways ----------
  const papers = $('.shelf.papers'), papersBar = $('.papers-bar');
  let figuresRow = null;
  if (papers && papersBar) {
    const cards = $$('.paper', papers), namesRow = $('.paper-names', papersBar);
    const names = $$('button[data-card]', namesRow).map((b) => [b, document.getElementById(b.dataset.card)]).filter((x) => x[1]);
    names.row = namesRow;
    figuresRow = makeShelf(papers, { items: () => cards, names: names, prev: $('.prev', papersBar), next: $('.next', papersBar), count: $('.count', papersBar), fit: true });
  }
  // a link to anything in a paper's card brings that card into the row first, so the browser can scroll to it
  const cardOf = (el) => (el && el.closest ? el.closest('.shelf.papers .paper') : null);
  const reveal = (el) => { const c = cardOf(el); if (c && figuresRow) figuresRow.show(c, true); };
  window.LP_reveal = reveal;
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a || a.getAttribute('href').length < 2) return;
    const t = document.getElementById(a.getAttribute('href').slice(1)); if (t) reveal(t);
  }, true);
  const toHash = () => {
    const t = location.hash.length > 1 && document.getElementById(location.hash.slice(1));
    if (t && cardOf(t)) { reveal(t); requestAnimationFrame(() => t.scrollIntoView()); }
  };
  window.addEventListener('hashchange', toHash);
  window.addEventListener('load', toHash);
  toHash();

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

  // ---------- WebGL contexts: only the figures near the screen hold one ----------
  // A browser keeps only so many WebGL contexts (16 in Chrome and Safari) and drops the oldest beyond that, which leaves
  // that figure blank. So a figure wakes (makes its context) when it comes within a screen's height of the view, and
  // sleeps (gives the context back) a moment after it moves farther away or is hidden. However many figures the page
  // has, only the few near the screen hold a context.
  const glWatch = (() => {
    const jobs = new Map();
    const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => {
      es.forEach((e) => {
        const j = jobs.get(e.target); if (!j) return;
        clearTimeout(j.timer);
        if (e.isIntersecting) j.wake(); else j.timer = setTimeout(j.sleep, 1500);
      });
    }, { rootMargin: '100% 0px' }) : null;
    return (el, wake, sleep) => { if (!io) { wake(); return; } jobs.set(el, { wake: wake, sleep: sleep, timer: 0 }); io.observe(el); };
  })();
  // give a canvas's context back: lose it, and put a fresh canvas in its place, since a lost context cannot be made anew on the same canvas
  const freshCanvas = (cv, gl) => {
    const x = gl && gl.getExtension && gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext();
    const fresh = cv.cloneNode(false); cv.replaceWith(fresh); return fresh;
  };
  window.LP_glWatch = glWatch; window.LP_freshCanvas = freshCanvas;   // the step-by-step figures sleep and wake the same way

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
      // back from sleep on the same structure: the view as it was left
      if (sd.saved && sd.saved.id === id) { eng.M = sd.saved.M; eng.zoom = sd.saved.zoom; eng.dirty = true; }
      sd.saved = null;
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

    // The pointer and keys go to whichever canvas and engine the view has now (both are replaced when the figure sleeps).
    sides.forEach((sd) => {
      const on = (type, fn, opt) => sd.stage.addEventListener(type, (e) => { if (sd.eng && e.target === sd.cv) fn(e, sd.eng); }, opt);
      on('pointerdown', (e, eng) => { stages.forEach((el) => el.classList.add('touched')); eng.down(e); });
      on('pointermove', (e, eng) => { eng.move(e); if (eng.ptr.size) follow(sd); });
      on('pointerup', (e, eng) => eng.up(e));
      on('pointercancel', (e, eng) => eng.up(e));
      on('dblclick', () => reset());
      on('keydown', (e, eng) => { if (eng.key(e)) { e.preventDefault(); follow(sd); } });
      on('wheel', (e, eng) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); eng.zoomBy(Math.exp(-e.deltaY * 0.01)); follow(sd); } }, { passive: false });
      if ('ResizeObserver' in window) new ResizeObserver(() => { if (sd.eng && sd.stage.clientWidth > 0 && sd.stage.clientHeight > 0) sd.eng.resize(sd.stage.clientWidth, sd.stage.clientHeight); }).observe(sd.stage);
    });
    // WebGL starts when the figure comes near the screen, and stops when it is far away or hidden
    const start = () => {
      if (sides[0].eng) return;
      sides.forEach((sd) => {
        const eng = sd.eng = new VestaGL(Math.max(1, sd.stage.clientWidth), Math.max(1, sd.stage.clientHeight));
        eng.hint = ''; eng.triX = 38; eng.triY = 32; eng.readY = 22;
        eng.attach(undefined, sd.ov);
        eng.attach(sd.cv);
        engines.push(eng);
      });
      show();
    };
    const stop = () => {
      sides.forEach((sd) => {
        const eng = sd.eng; if (!eng) return;
        if (eng.M && sd.shown) sd.saved = { id: sd.shown, M: eng.M.map((r) => r.slice()), zoom: eng.zoom };
        const i = engines.indexOf(eng); if (i >= 0) engines.splice(i, 1);
        sd.cv = freshCanvas(sd.cv, eng.gl);
        sd.eng = null; sd.shown = null;
      });
    };
    glWatch(host, start, stop);
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
