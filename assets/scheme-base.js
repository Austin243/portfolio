/* What the step-by-step figures share: the row of step chips, the stage with its cards, Back / Next / Replay, the text beside
   the picture, and the clock that plays a step. A scheme hands over its steps and a `make` function; `make` gets the
   tools below and returns the hooks that draw its own picture:
     layout()        the stage changed size (false while it has none)
     draw()          paint one frame
     live()          the parts of the page that follow a drag or the clock (notes, values, handles)
     sync(k)         which controls step k shows
     enter(k)        step k was picked
     tick(dt)        advance things that move on their own; true while something still moves
   A step may also be a slide ({ slide: { fig, pick } }): after the steps the scheme draws itself, a figure of the page
   (by its id; pick = [panel, state]) takes the picture's place. The scheme moves that figure into its stage, and puts it
   back with giveBack() if it hands over to its flat version. Underneath a slide the scheme stays on the last step of its
   own (st.step), while st.at is the step on show, so a scheme never meets a step it does not know. */
window.LP_scheme = (host, def) => {
  'use strict';
  const $ = (s, r = host) => r.querySelector(s), $$ = (s, r = host) => Array.from(r.querySelectorAll(s));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches, STEPS = def.steps;
  const own = (k) => { while (k > 0 && STEPS[k].slide) k--; return k; };   // the step the scheme draws under step k
  const slides = STEPS.some((s) => s.slide);
  host.innerHTML =
    '<div class="fig-main">' +
    '<ol class="steps" aria-label="' + def.label + ': steps">' + STEPS.map((s, i) => '<li><button type="button" data-step="' + i + '"><b>' + (i + 1) + '</b>' + s.name + '</button></li>').join('') + '</ol>' +
    '<div class="sch-wrap"><div class="stage sch-stage sch-3d">' + def.stage + '<p class="hint" hidden>' + def.hint + '</p>' +
    (slides ? '<div class="sch-slide" hidden></div>' : '') + '</div><p class="sch-info"></p></div>' +
    '<div class="sch-nav"><button type="button" class="back">← Back</button><span class="where"><button type="button" class="replay">Replay</button><span class="count"></span></span><button type="button" class="next"></button></div>' +
    '</div>' +
    '<figcaption class="fig-side">' +
    '<p class="fig-title"><b>' + def.title + '</b>' + (def.cite ? ' (' + def.cite + ')' : '') + '</p>' +
    '<div class="sch-text" aria-live="polite"><h4></h4><p class="cap"></p></div>' +
    '<div class="legend">' + def.legend + '</div><p class="spec">' + def.spec + '</p></figcaption>';
  const stage = $('.sch-stage'), info = $('.sch-info'), hint = $('.hint'), chips = $$('.steps button'), back = $('.back'), next = $('.next'), replay = $('.replay'), count = $('.count');
  const head = $('.sch-text h4'), body = $('.sch-text .cap'), textBox = $('.sch-text');
  const slideEl = $('.sch-slide'), wrap = $('.sch-wrap'), homes = [];
  if (slideEl) STEPS.forEach((s) => {
    const f = s.slide && document.getElementById(s.slide.fig);
    if (f && f.parentNode !== slideEl) { homes.push([f, f.parentNode, f.nextSibling]); slideEl.appendChild(f); }
  });
  const giveBack = () => { homes.forEach(([f, p, n]) => p.insertBefore(f, n && n.parentNode === p ? n : null)); homes.length = 0; };
  const st = { step: 0, at: 0, t: reduced ? 1 : 0, t0: 0, started: false };
  const smooth = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
  // how far something that belongs to step n has come in: 0 before the step, 1 after it, and from a to b of the step's time in between
  const on = (n, a, b) => (st.step > n ? 1 : st.step < n ? 0 : smooth((st.t - (a || 0)) / ((b == null ? 1 : b) - (a || 0))));
  // an element's text is only rewritten when it changes, so a drag does not rebuild what stays the same
  const shown = new Map();
  const put = (el, html) => { if (shown.get(el) !== html) { shown.set(el, html); el.innerHTML = html; } };
  let raf = 0, last = 0, view = null;
  const frame = (now) => {
    raf = 0;
    if (api.dead) return;   // the scheme gave the figure back to its flat version
    const dt = Math.min(64, now - (last || now)); last = now;
    let busy = false;
    if (api.hold != null) { st.t = api.hold; view.live(); }   // a fixed moment of the step, for taking pictures of it
    else if (st.started && st.t < 1) { st.t = Math.max(0, Math.min(1, (now - st.t0) / STEPS[st.step].dur)); busy = true; view.live(); }
    if (view.tick && view.tick(dt)) busy = true;
    view.draw();
    if (busy) raf = requestAnimationFrame(frame); else last = 0;
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
  const sync = () => {
    const k = st.at;
    chips.forEach((b, i) => { b.classList.toggle('done', i < k); if (i === k) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
    const row = chips[0].closest('ol'), li = chips[k].parentNode;   // keep the chip of this step in sight when the row is wider than the column
    if (row.scrollWidth > row.clientWidth) row.scrollLeft = Math.max(0, li.offsetLeft - row.offsetLeft - (row.clientWidth - li.offsetWidth) / 2);
    put(head, (k + 1) + ' · ' + STEPS[k].name); put(body, STEPS[k].text);
    back.disabled = k === 0; count.textContent = (k + 1) + ' / ' + STEPS.length;
    put(next, k === STEPS.length - 1 ? 'Start over ↺' : 'Next<span class="nx">: ' + STEPS[k + 1].name + '</span> →');
    hint.hidden = k < def.hintFrom || stage.classList.contains('touched');
    view.sync(st.step); view.live();
    if (slideEl) {
      const sl = STEPS[k].slide;
      wrap.classList.toggle('slid', !!sl); stage.classList.toggle('pl-covered', !!sl);
      Array.from(slideEl.children).forEach((f) => { f.hidden = !sl || f.id !== sl.fig; });
      if (sl && slideEl.hidden) { slideEl.classList.remove('in'); void slideEl.offsetWidth; slideEl.classList.add('in'); }   // the slides fade in
      slideEl.hidden = !sl;
    }
  };
  const go = (k, again) => {
    if (api.dead) return;
    k = Math.max(0, Math.min(STEPS.length - 1, k));
    if (k === st.at && !again && st.started) return;
    const was = st.started ? st.step : -1, mine = own(k);
    st.at = k; st.step = mine; st.started = true;
    if (!STEPS[k].slide) { st.t = reduced ? 1 : 0; st.t0 = performance.now(); if (view.enter) view.enter(mine); }
    else if (mine !== was) { st.t = 1; if (view.enter) view.enter(mine); }   // under a slide the scheme rests at the end of its own last step
    sync(); kick();
    const sl = STEPS[k].slide;
    if (sl && sl.pick && window.LP_pick) window.LP_pick(sl.fig, sl.pick[0], sl.pick[1]);
  };
  const touched = () => { if (!stage.classList.contains('touched')) { stage.classList.add('touched'); hint.hidden = true; } };
  const api = { host: host, stage: stage, info: info, st: st, STEPS: STEPS, reduced: reduced, $: $, $$: $$, on: on, smooth: smooth, put: put, kick: kick, go: go, sync: sync, touched: touched, giveBack: giveBack };
  view = def.make(api);
  host.lpScheme = api;   // for checking the page and taking pictures of it
  chips.forEach((b) => b.addEventListener('click', () => go(Number(b.dataset.step), true)));
  back.addEventListener('click', () => go(st.at - 1));
  next.addEventListener('click', () => go(st.at === STEPS.length - 1 ? 0 : st.at + 1));
  replay.addEventListener('click', () => go(st.at, true));

  // Nothing is measured or drawn until the scheme is about to scroll into view; the first step plays once it is in view.
  let colW = -1;
  const roomForText = () => {
    // the text of the steps differs in length: beside the picture its box gets the height of the longest, so nothing below it moves
    if (textBox.clientWidth === colW) return;
    colW = textBox.clientWidth;
    textBox.style.minHeight = '';
    if (getComputedStyle(host).display !== 'grid') return;   // in one column the text is the last thing that moves, so it keeps its own height
    let tall = 0;
    for (const sp of STEPS) { body.innerHTML = sp.text; tall = Math.max(tall, textBox.offsetHeight); }
    shown.delete(body);
    textBox.style.minHeight = tall + 'px';
  };
  // The picture's WebGL context is made when the figure comes near the screen and given back when it is far away or
  // hidden (view.sleep), so that a page with many figures stays within what the browser allows.
  let awake = false, watching = false;
  const refit = () => { if (awake && !api.dead && view.layout()) { roomForText(); sync(); kick(); } };
  const watchSize = () => {
    if (watching) return;
    watching = true;
    if ('ResizeObserver' in window) new ResizeObserver(refit).observe(stage); else window.addEventListener('resize', refit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { colW = -1; refit(); });
  };
  const wake = () => { if (awake) return; awake = true; watchSize(); refit(); };
  const sleep = () => { if (!awake) return; awake = false; if (view.sleep) view.sleep(); };
  sync();
  if ('IntersectionObserver' in window) {
    if (window.LP_glWatch) window.LP_glWatch(stage, wake, sleep);
    else { const near = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { near.disconnect(); wake(); } }, { rootMargin: '500px 0px' }); near.observe(stage); }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); if (!reduced && !st.started) go(0, true); } }, { threshold: 0.35 });   // not if a step was already picked
    io.observe(stage);
  } else { wake(); go(0, true); }
  return api;
};
