/* Scheme 1: how WISP works, one step at a time.
   One picture of the (110) plane of MnPd, drawn on a canvas, that changes with the step: the atoms and their moments,
   the message passing between atoms, a query point that can be dragged, the field the decoder returns, the spin flip,
   and the comparison with DFT. The fields are the real ones (assets/wisp-plane.js) and so are the distances and the
   counts; the pictures of what happens inside the network (ripples, moving dots, the scatter of query points) are schematic. */
window.LP_flat1 = () => {
  'use strict';
  const host = document.getElementById('scheme-1'), D = window.LP_WISP;
  if (!host) return;
  if (!D) { host.hidden = true; return; }
  const $ = (s, r = host) => r.querySelector(s);
  const $$ = (s, r = host) => Array.from(r.querySelectorAll(s));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cite = window.LP_CITE ? window.LP_CITE('wisp') : '';

  // ---------- the crystal plane, in Å ----------
  const A = D.a, U = A * Math.SQRT2, V = A, N = D.n;   // periods of the plane along [110] and [001]
  const CUT = 5;                                       // cutoff of the atomic and of the query neighborhoods
  const WA = 3.4 * U;                                  // width of the picture
  const Q0 = [U / 2, 0];                               // where the query point starts: between two Mn, below a Pd
  const SPECIES = [{ el: 'Mn', rgb: [160, 72, 156], m: D.moments[0] }, { el: 'Pd', rgb: [180, 184, 178], m: D.moments[1] }];
  const R_BALL = 0.52, R_DOT = 0.16, ARROW = 0.46;     // atom radius, its radius once the field shows, arrow length per μB
  const VMAX = 0.45, DMAX = 0.03;                      // color limits of the ELF and of the difference
  const TEAL = [11, 122, 128], GOLD = [217, 154, 27], NAVY = [39, 64, 124], INK = [26, 25, 21];

  const decode = (b64) => {
    const s = atob(b64), f = new Float32Array(N * N);
    for (let i = 0; i < N * N; i++) f[i] = (s.charCodeAt(2 * i) + 256 * s.charCodeAt(2 * i + 1)) / 65535;
    return f;
  };
  const F = { wisp: { up: decode(D.wisp.up), down: decode(D.wisp.down) }, dft: { up: decode(D.dft.up), down: decode(D.dft.down) } };
  F.diff = {};
  for (const ch of ['up', 'down']) F.diff[ch] = F.wisp[ch].map((x, i) => Math.abs(x - F.dft[ch][i]));

  // periodic Catmull-Rom interpolation on the 28 x 28 plane
  const cr = (p0, p1, p2, p3, t) => p1 + 0.5 * t * (p2 - p0 + t * (2 * p0 - 5 * p1 + 4 * p2 - p3 + t * (3 * (p1 - p2) + p3 - p0)));
  const wrap = (i) => ((i % N) + N) % N;
  const sample = (f, u, v) => {
    const x = u / U * N, y = v / V * N, i = Math.floor(x), k = Math.floor(y), tx = x - i, ty = y - k;
    const row = (kk) => { const o = wrap(kk) * N; return cr(f[o + wrap(i - 1)], f[o + wrap(i)], f[o + wrap(i + 1)], f[o + wrap(i + 2)], tx); };
    return Math.max(0, Math.min(1, cr(row(k - 1), row(k), row(k + 1), row(k + 2), ty)));
  };
  // the same blue-green-red scale as the cut faces of the 3D figures, softened a little more because here it fills the picture
  const elfColor = (t) => {
    t = Math.max(0, Math.min(1, t));
    let c;
    if (t < 0.25) c = [0, t / 0.25, 1]; else if (t < 0.5) c = [0, 1, 1 - (t - 0.25) / 0.25];
    else if (t < 0.75) c = [(t - 0.5) / 0.25, 1, 0]; else c = [1, 1 - (t - 0.75) / 0.25, 0];
    return c.map((x) => Math.round(255 * (x + (1 - x) * 0.26)));
  };
  const diffColor = (t) => {   // white, amber, deep red
    t = Math.max(0, Math.min(1, t));
    const a = [255, 255, 255], b = [242, 182, 50], c = [168, 34, 28];
    return t < 0.5 ? a.map((x, i) => Math.round(x + (b[i] - x) * t * 2)) : b.map((x, i) => Math.round(x + (c[i] - x) * (t - 0.5) * 2));
  };

  // ---------- page elements ----------
  const figN = (window.LP_FIGS || []).findIndex((f) => f.id === 'fig-wisp') + 1;   // the number of the 3D figure that follows the scheme
  const STEPS = [
    { name: 'Structure', dur: 1900,
      text: 'WISP is given a crystal: which atoms it has, where they sit, the cell, and the magnetic moment on each atom. This is MnPd, cut along a plane that holds both atoms. The arrows are the moments, ' + D.moments[0].toFixed(2) + ' μ<sub>B</sub> on Mn and ' + D.moments[1].toFixed(2) + ' μ<sub>B</sub> on Pd.',
      alt: 'Rows of manganese and palladium atoms in a plane of MnPd. A long arrow on each manganese and a very short one on each palladium show the magnetic moments.' },
    { name: 'Encode', dur: 3200,
      text: 'An equivariant network passes messages between atoms up to 5 Å apart, twice. Afterwards every atom holds a set of features that describe its surroundings. Some are plain numbers and some have a direction (<i>ℓ</i> = 0, 1, 2), so they turn when the crystal turns.',
      alt: 'Rings spread out from every atom twice, and dots travel along the links between neighboring atoms. Each atom ends up with a ring around it.' },
    { name: 'Query', dur: 1700,
      text: 'Now I can ask about any point in the crystal, whether or not it lies on a grid. The point gathers the features of every atom within 5 Å, along with the direction to each one. Drag the point to try another place.',
      alt: 'A query point between the atoms, a dashed circle of radius 5 angstrom around it, and lines from the atoms inside the circle to the point.' },
    { name: 'Decode', dur: 3600,
      text: 'A small network combines what the point gathered into one number between 0 and 1: the ELF there. Asking at many points fills in the field. This is the spin-up channel.',
      alt: 'Colored dots appear at many query points and merge into a map of the spin-up electron localization function over the plane.' },
    { name: 'Flip spins', dur: 2000,
      text: 'For the other spin channel, the same network runs again with every moment reversed. Reversing the moments swaps the two channels exactly, because of how the network is built, so it never has to learn that. In MnPd the spin-down channel has a large region around Pd that the spin-up channel lacks.',
      alt: 'The moment arrows turn over and the map changes to the spin-down channel, which has a large region around each palladium atom.' },
    { name: 'Compare', dur: 1300,
      text: 'Left of the line is WISP, right of it the DFT calculation. MnPd was not in the training data. The mean difference here is ' + ((D.mae.up + D.mae.down) / 2).toFixed(3) + ' on the scale of 0 to 1, and 0.011 over all 21,922 test structures. Two parts are not shown: a branch for points with no atom within 5 Å, and a second network that predicts the moments when only the positions are known.' + (figN ? ' <a href="#fig-wisp">Figure ' + figN + '</a> has the same comparison in 3D.' : ''),
      alt: 'The same map with a line across it: the WISP prediction on the left and the DFT calculation on the right. The two sides match.' }
  ];
  host.innerHTML =
    '<div class="fig-main">' +
    '<ol class="steps" aria-label="Steps of Scheme 1">' + STEPS.map((s, i) => '<li><button type="button" data-step="' + i + '"><b>' + (i + 1) + '</b>' + s.name + '</button></li>').join('') + '</ol>' +
    '<div class="sch-wrap"><div class="stage sch-stage"><canvas class="sch" role="img"></canvas>' +
    '<div class="states sch-chan" role="group" aria-label="Spin channel shown" hidden>' +
    '<button type="button" data-ch="up">Spin up · <i>m</i></button><button type="button" data-ch="down">Spin down · −<i>m</i></button><button type="button" data-diff aria-pressed="false" hidden>Difference</button></div>' +
    '<div class="sch-read" hidden><canvas class="sig" aria-hidden="true"></canvas><div><p class="k"></p><p class="v"></p></div></div>' +
    '<div class="wipe sch-wipe" role="slider" tabindex="0" aria-label="Line between the WISP prediction and the DFT calculation" aria-valuemin="0" aria-valuemax="100" hidden><i></i><b></b><span class="l">WISP</span><span class="r">DFT</span></div>' +
    '<button type="button" class="sch-q" aria-label="Query point. Drag it, or move it with the arrow keys." hidden></button>' +
    '<p class="hint" hidden>drag the point</p></div><p class="sch-info"></p></div>' +
    '<div class="sch-nav"><button type="button" class="back">← Back</button><span class="where"><button type="button" class="replay">Replay</button><span class="count"></span></span><button type="button" class="next"></button></div>' +
    '</div>' +
    '<figcaption class="fig-side">' +
    '<p class="fig-title"><b>Scheme 1</b><span class="pipe">|</span>How WISP predicts where electrons localize, one step at a time. ' + cite + '</p>' +
    '<div class="sch-text" aria-live="polite"><h4></h4><p class="cap"></p></div>' +
    '<div class="legend"><span><i style="background:#A0489C"></i>Mn</span><span><i style="background:#B4B8B2"></i>Pd</span>' +
    '<span><em class="lg-arrow"></em>moment</span><span><em class="lg-ring"></em>encoded atom</span><span><em class="lg-q"></em>query point</span>' +
    '<span class="lg-elf">ELF 0<b></b>' + VMAX + '</span><span class="lg-diff" hidden>|WISP − DFT| 0<b></b>' + DMAX + '</span></div>' +
    '<p class="spec"><b>MnPd</b> · mp-1902 · (110) plane through Mn · <i>a</i> = ' + A.toFixed(3) + ' Å · fields on a ' + N + '×' + N + '×' + N + ' grid. The fields, distances and counts are real; the drawings of the network at work are schematic.</p>' +
    '</figcaption>';

  const stage = $('.sch-stage'), cv = $('canvas.sch'), ctx = cv.getContext('2d');
  const chan = $('.sch-chan'), read = $('.sch-read'), sig = $('canvas.sig'), wipeEl = $('.sch-wipe'), qEl = $('.sch-q'), info = $('.sch-info'), hint = $('.hint');
  const chips = $$('.steps button'), back = $('.back'), next = $('.next'), replay = $('.replay'), count = $('.count');
  const head = $('.sch-text h4'), body = $('.sch-text .cap');

  // ---------- state ----------
  const st = { step: 0, t: reduced ? 1 : 0, t0: 0, started: false, q: Q0.slice(), flip: 0, flipTo: 0, diff: false, split: 0.62, wipeTo: 0.62 };
  window.LP_SCHEME = st;   // for checking the page from the console
  let W = 0, H = 0, dpr = 1, HA = WA / 1.4, s = 1, u0 = 0, vTop = 0, atoms = [], links = [], dots = null, raf = 0, last = 0, dragging = false;
  const X = (u) => (u - u0) * s, Y = (v) => (vTop - v) * s;
  const smooth = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
  const easeOut = (x) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);
  const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a == null ? 1 : Math.max(0, Math.min(1, a)).toFixed(3)) + ')';
  const mixc = (c, w, t) => c.map((x) => Math.round(x + (w - x) * t));

  const layout = () => {
    const r = stage.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    W = r.width; H = r.height; dpr = Math.min(2, window.devicePixelRatio || 1);
    stage.classList.toggle('narrow', W < 520);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    s = W / WA; HA = H / s; u0 = Q0[0] - WA / 2; vTop = Q0[1] + HA / 2;
    // the atoms of the plane that fall in the picture: Mn on the corners of each U x V tile, Pd at its middle
    atoms = [];
    for (let m = Math.floor(u0 / U) - 1; m <= Math.ceil((u0 + WA) / U) + 1; m++) for (let n = Math.floor((vTop - HA) / V) - 1; n <= Math.ceil(vTop / V) + 1; n++) {
      atoms.push({ u: m * U, v: n * V, sp: 0 }, { u: (m + 0.5) * U, v: (n + 0.5) * V, sp: 1 });
    }
    atoms = atoms.filter((a) => a.u > u0 - 1 && a.u < u0 + WA + 1 && a.v > vTop - HA - 1 && a.v < vTop + 1);
    atoms.forEach((a) => { a.d0 = Math.hypot(a.u - Q0[0], a.v - Q0[1]); });
    // links between nearest neighbors (Mn-Pd), for the picture of the message passing
    links = [];
    const dnn = Math.hypot(U / 2, V / 2);
    for (const a of atoms) if (a.sp === 1) for (const b of atoms) if (b.sp === 0 && Math.abs(Math.hypot(a.u - b.u, a.v - b.v) - dnn) < 0.01) links.push([a, b]);
    dots = null;
    return true;
  };

  // number of atoms of the crystal within the cutoff of the query point, and how many of them lie in this plane
  const neighbors = (q) => {
    const p = [q[0] / Math.SQRT2, q[0] / Math.SQRT2, q[1]], R = Math.ceil(CUT / A) + 1, c = p.map((x) => Math.round(x / A));
    let all = 0;
    for (let i = c[0] - R; i <= c[0] + R; i++) for (let j = c[1] - R; j <= c[1] + R; j++) for (let k = c[2] - R; k <= c[2] + R; k++) {
      if (Math.hypot(i * A - p[0], j * A - p[1], k * A - p[2]) <= CUT) all++;
      if (Math.hypot((i + 0.5) * A - p[0], (j + 0.5) * A - p[1], (k + 0.5) * A - p[2]) <= CUT) all++;
    }
    return { all: all, plane: atoms.filter((a) => Math.hypot(a.u - q[0], a.v - q[1]) <= CUT).length };
  };

  // the field over the whole picture, as an image: made once for each field and size
  const images = {};
  const fieldImage = (key) => {
    const tag = key + '@' + HA.toFixed(2);
    if (images[tag]) return images[tag];
    const w = 720, h = Math.max(2, Math.round(w * HA / WA)), c = document.createElement('canvas');
    c.width = w; c.height = h;
    const f = key.split(':').reduce((o, k) => o[k], F), col = key.indexOf('diff') === 0 ? diffColor : elfColor, lim = key.indexOf('diff') === 0 ? DMAX : VMAX;
    // first along [110] for each of the N grid rows, then along [001]
    const rows = new Float32Array(N * w);
    for (let x = 0; x < w; x++) {
      const g = (u0 + (x + 0.5) / w * WA) / U * N, i = Math.floor(g), t = g - i;
      for (let k = 0; k < N; k++) rows[k * w + x] = cr(f[k * N + wrap(i - 1)], f[k * N + wrap(i)], f[k * N + wrap(i + 1)], f[k * N + wrap(i + 2)], t);
    }
    const g2 = c.getContext('2d'), img = g2.createImageData(w, h), px = img.data, lut = [];
    for (let i = 0; i <= 512; i++) lut.push(col(i / 512));
    for (let y = 0; y < h; y++) {
      const g = (vTop - (y + 0.5) / h * HA) / V * N, k = Math.floor(g), t = g - k;
      const r0 = wrap(k - 1) * w, r1 = wrap(k) * w, r2 = wrap(k + 1) * w, r3 = wrap(k + 2) * w;
      for (let x = 0; x < w; x++) {
        const val = cr(rows[r0 + x], rows[r1 + x], rows[r2 + x], rows[r3 + x], t);
        const cc = lut[Math.max(0, Math.min(512, Math.round(val / lim * 512)))], o = (y * w + x) * 4;
        px[o] = cc[0]; px[o + 1] = cc[1]; px[o + 2] = cc[2]; px[o + 3] = 255;
      }
    }
    g2.putImageData(img, 0, 0);
    images[tag] = c;
    return c;
  };
  // the scatter of query points that turns into the field in step 4: fixed places, colored by the spin-up prediction
  const scatter = () => {
    if (dots) return dots;
    let seed = 20261119;
    const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    dots = [];
    for (let i = 0; i < 2600; i++) {
      const u = u0 + rnd() * WA, v = vTop - rnd() * HA;
      dots.push([u, v, 'rgb(' + elfColor(sample(F.wisp.up, u, v) / VMAX).join(',') + ')']);
    }
    return dots;
  };

  // ---------- drawing ----------
  const ball = (x, y, r, c, a) => {
    const g = ctx.createRadialGradient(x - 0.32 * r, y - 0.36 * r, r * 0.06, x, y, r);
    g.addColorStop(0, rgba(mixc(c, 255, 0.55), a)); g.addColorStop(0.5, rgba(c, a)); g.addColorStop(1, rgba(mixc(c, 0, 0.3), a));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
  };
  // an arrow centered on (x, y); ang 0 points up the page, pi points down
  const arrow = (x, y, len, ang, wid, col, a, halo) => {
    if (len < 1) return;
    const dx = Math.sin(ang), dy = -Math.cos(ang), hl = Math.min(len * 0.55, wid * 3.4), hw = Math.max(wid * 1.9, Math.min(hl * 0.62, wid * 2.4));
    const tx = x + dx * len / 2, ty = y + dy * len / 2, bx = x - dx * len / 2, by = y - dy * len / 2, nx = tx - dx * hl, ny = ty - dy * hl;
    const path = () => {
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(nx, ny); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(nx - dy * hw, ny + dx * hw); ctx.lineTo(nx + dy * hw, ny - dx * hw); ctx.closePath(); ctx.fill();
    };
    ctx.lineCap = 'round';
    if (halo > 0) { ctx.strokeStyle = ctx.fillStyle = rgba([255, 255, 255], 0.9 * a * halo); ctx.lineWidth = wid + 3; ctx.lineJoin = 'round'; path(); ctx.stroke(); }
    ctx.strokeStyle = ctx.fillStyle = rgba(col, a); ctx.lineWidth = wid; path();
  };
  const label = (text, x, y, font, col, align) => {
    ctx.font = font; ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.92)'; ctx.strokeText(text, x, y);
    ctx.fillStyle = col; ctx.fillText(text, x, y);
  };
  const SANS = '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif', SERIF = '"Newsreader", Georgia, serif';

  const draw = () => {
    if (!W) return;
    const k = st.step, t = st.t, on = (n, a, b) => (k > n ? 1 : k < n ? 0 : smooth((t - (a || 0)) / ((b == null ? 1 : b) - (a || 0))));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H);
    const fld = on(3, 0.62, 1), small = on(3, 0, 0.14);   // how far the field has come in, and how far the atoms have shrunk to dots

    // the field: WISP, or WISP left of the line and DFT right of it, or their difference
    if (k >= 3) {
      const fl = st.flip, pair = (src, x0, x1) => {
        if (x1 - x0 < 0.5) return;
        ctx.save(); ctx.beginPath(); ctx.rect(x0, 0, x1 - x0, H); ctx.clip();
        ctx.globalAlpha = fld; ctx.drawImage(fieldImage(src + ':up'), 0, 0, W, H);
        if (fl > 0.002) { ctx.globalAlpha = fld * fl; ctx.drawImage(fieldImage(src + ':down'), 0, 0, W, H); }
        ctx.restore();
      };
      if (k === 3 && fld < 1) {
        // query points appear one by one, then faster, each already in the color of the value WISP returns there
        const all = scatter(), p = Math.max(0, Math.min(1, (t - 0.1) / 0.6)), n = Math.floor(all.length * Math.pow(p, 2.7)), r = 5.2 - 3 * p;
        ctx.globalAlpha = 1 - 0.85 * fld;
        for (let i = 0; i < n; i++) { ctx.fillStyle = all[i][2]; ctx.beginPath(); ctx.arc(X(all[i][0]), Y(all[i][1]), r, 0, 6.2832); ctx.fill(); }
        ctx.globalAlpha = 1;
      }
      if (st.diff && k === 5) pair('diff', 0, W);
      else if (k === 5) { pair('wisp', 0, st.split * W); pair('dft', st.split * W, W); }
      else pair('wisp', 0, W);
    }

    // the plane's own lattice: a faint dashed rectangle per tile
    ctx.save(); ctx.strokeStyle = rgba([150, 146, 134], 0.55 * (1 - 0.75 * fld) * on(0, 0, 0.3)); ctx.lineWidth = 1; ctx.setLineDash([3, 4]); ctx.beginPath();
    for (let m = Math.ceil(u0 / U); m * U < u0 + WA; m++) { ctx.moveTo(Math.round(X(m * U)) + 0.5, 0); ctx.lineTo(Math.round(X(m * U)) + 0.5, H); }
    for (let n = Math.ceil((vTop - HA) / V); n * V < vTop; n++) { ctx.moveTo(0, Math.round(Y(n * V)) + 0.5); ctx.lineTo(W, Math.round(Y(n * V)) + 0.5); }
    ctx.stroke(); ctx.restore();

    // message passing: links between neighbors, two rounds of ripples out to the cutoff, dots running along the links
    const la = (k === 1 ? 0.34 * smooth(t / 0.08) : k === 2 ? 0.16 : 0) * (1 - fld);
    if (la > 0) {
      ctx.strokeStyle = rgba(TEAL, la); ctx.lineWidth = 1.3; ctx.beginPath();
      for (const [a, b] of links) { ctx.moveTo(X(a.u), Y(a.v)); ctx.lineTo(X(b.u), Y(b.v)); }
      ctx.stroke();
    }
    if (k === 1 && t < 1) for (let w = 0; w < 2; w++) {
      const p = (t - 0.06 - 0.43 * w) / 0.42;
      if (p <= 0 || p >= 1) continue;
      ctx.lineWidth = 1.2;
      for (const a of atoms) { ctx.strokeStyle = rgba(TEAL, 0.2 * (1 - p)); ctx.beginPath(); ctx.arc(X(a.u), Y(a.v), CUT * s * easeOut(p), 0, 6.2832); ctx.stroke(); }
      const e = smooth(Math.min(1, p / 0.7));
      ctx.fillStyle = rgba(TEAL, 0.95 * Math.min(1, 4 * p) * Math.min(1, 4 * (1 - p)));
      for (const [a, b] of links) for (const [f, g] of [[a, b], [b, a]]) { ctx.beginPath(); ctx.arc(X(f.u + (g.u - f.u) * e), Y(f.v + (g.v - f.v) * e), 2.6, 0, 6.2832); ctx.fill(); }
    }

    // the query: its cutoff, and a line from every atom of the plane inside it
    const qa = on(2, 0, 0.2), qx = X(st.q[0]), qy = Y(st.q[1]), back = 1 - 0.6 * on(4, 0, 0.3);   // the circle and lines step back once the map is the subject
    if (qa > 0) {
      const grow = k === 2 ? easeOut((t - 0.06) / 0.5) : 1, reach = k === 2 ? smooth((t - 0.42) / 0.45) : 1;
      ctx.save(); ctx.setLineDash([5, 5]); ctx.lineWidth = 1.4;
      if (fld > 0) { ctx.strokeStyle = rgba([255, 255, 255], 0.85 * fld * back); ctx.lineWidth = 3.4; ctx.beginPath(); ctx.arc(qx, qy, CUT * s, 0, 6.2832); ctx.stroke(); ctx.lineWidth = 1.4; }
      ctx.strokeStyle = rgba(mixc(GOLD, 0, 0.25), 0.95 * qa * back); ctx.beginPath(); ctx.arc(qx, qy, CUT * s * grow, 0, 6.2832); ctx.stroke(); ctx.restore();
      if (grow > 0.98 && back > 0.9) label('5 Å', qx + CUT * s * 0.7071 + 7, qy + CUT * s * 0.7071 + 8, '500 12px ' + SANS, rgba(mixc(GOLD, 0, 0.45), qa), 'left');
      for (const a of atoms) {
        const d = Math.hypot(a.u - st.q[0], a.v - st.q[1]); if (d > CUT) continue;
        const al = reach * smooth((CUT - d) / 0.5) * (1 - 0.45 * fld) * back, ax = X(a.u), ay = Y(a.v);
        if (al <= 0) continue;
        // the line stops at the atom's edge and runs from the color of the atomic features to the color of the query
        const rr = (R_BALL + (R_DOT - R_BALL) * small) * s + 3, f0 = Math.min(0.9, rr / (d * s)), x0 = ax + (qx - ax) * f0, y0 = ay + (qy - ay) * f0;
        if (fld > 0) { ctx.strokeStyle = rgba([255, 255, 255], 0.7 * fld * al); ctx.lineWidth = 3.6; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(qx, qy); ctx.stroke(); }
        const g = ctx.createLinearGradient(x0, y0, qx, qy); g.addColorStop(0, rgba(TEAL, 0.9 * al)); g.addColorStop(1, rgba(GOLD, 0.95 * al));
        ctx.strokeStyle = g; ctx.lineWidth = 1.7; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(qx, qy); ctx.stroke();
        if (k === 2 && reach > 0 && reach < 1) { ctx.fillStyle = rgba(TEAL, 0.9); ctx.beginPath(); ctx.arc(x0 + (qx - x0) * reach, y0 + (qy - y0) * reach, 2.6, 0, 6.2832); ctx.fill(); }
      }
    }

    // atoms: spheres until the field shows, then dots; a ring once encoded; an arrow for the moment
    const ringA = on(1, 0.84, 1), ang = Math.PI * st.flip;
    for (const a of atoms) {
      const sp = SPECIES[a.sp], x = X(a.u), y = Y(a.v);
      const pop = k > 0 ? 1 : smooth((t - Math.min(0.42, a.d0 / 18)) / 0.3);
      if (pop <= 0) continue;
      const r = (R_BALL + (R_DOT - R_BALL) * small) * s * (0.6 + 0.4 * pop);
      if (small > 0) { ctx.fillStyle = rgba([255, 255, 255], small); ctx.beginPath(); ctx.arc(x, y, r + 1.6, 0, 6.2832); ctx.fill(); }
      ball(x, y, r, sp.rgb, pop);
      if (ringA > 0) { ctx.strokeStyle = rgba(TEAL, 0.95 * ringA * (1 - 0.6 * small)); ctx.lineWidth = 2 - 0.6 * small; ctx.beginPath(); ctx.arc(x, y, r + 3.4 - 1.2 * small, 0, 6.2832); ctx.stroke(); }
      const grown = k > 0 ? 1 : smooth((t - 0.5) / 0.45);
      arrow(x, y, Math.max(sp.m * ARROW * s, 9) * grown, ang, sp.m > 1 ? 3.2 - 0.8 * small : 2.2, NAVY, grown, small);
    }
    // name tags on one atom of each kind, until the query takes the middle of the picture
    const tagA = k === 0 ? smooth((t - 0.7) / 0.3) : k === 1 ? 1 : k === 2 ? 1 - smooth(t / 0.15) : 0;
    if (tagA > 0) for (const [sp, du, dv] of [[0, -1, 1], [1, -0.5, 0.5]]) {
      const a = atoms.find((b) => b.sp === sp && Math.abs(b.u - (Q0[0] - U / 2 + du * U)) < 0.01 && Math.abs(b.v - dv * V) < 0.01); if (!a) continue;
      ctx.globalAlpha = tagA;
      label(SPECIES[sp].el, X(a.u) + R_BALL * s + 9, Y(a.v) - 8, '600 13px ' + SANS, rgba(INK), 'left');
      label(SPECIES[sp].m.toFixed(2) + ' μB', X(a.u) + R_BALL * s + 9, Y(a.v) + 9, '500 11.5px ' + SANS, rgba(mixc(INK, 255, 0.3)), 'left');
      ctx.globalAlpha = 1;
    }

    // the query point itself
    if (qa > 0) {
      const pulse = k === 2 ? 1 + 0.5 * (1 - smooth(t / 0.25)) : 1;
      const g = ctx.createRadialGradient(qx, qy, 0, qx, qy, 19 * pulse); g.addColorStop(0, rgba(GOLD, 0.55 * qa)); g.addColorStop(1, rgba(GOLD, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(qx, qy, 19 * pulse, 0, 6.2832); ctx.fill();
      ctx.fillStyle = rgba([255, 255, 255], qa); ctx.strokeStyle = rgba(mixc(GOLD, 0, 0.3), qa); ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.arc(qx, qy, 6.2, 0, 6.2832); ctx.fill(); ctx.stroke();
      ctx.globalAlpha = qa; label('r', qx + 12, qy - 13, 'italic 700 17px ' + SERIF, rgba(INK), 'left'); ctx.globalAlpha = 1;
    }
  };

  // the small plot beside the value: the last stage of the decoder, a sigmoid, with the point's value on it
  const drawSig = (val) => {
    const w = 104, h = 54, d = Math.min(2, window.devicePixelRatio || 1);
    if (sig.width !== w * d) { sig.width = w * d; sig.height = h * d; }
    const c = sig.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, w, h);
    const px = (z) => 6 + (z + 6) / 12 * (w - 12), py = (v) => h - 8 - v * (h - 16);
    c.strokeStyle = '#D6D2C6'; c.lineWidth = 1; c.setLineDash([2, 3]);
    c.beginPath(); c.moveTo(6, py(0)); c.lineTo(w - 6, py(0)); c.moveTo(6, py(1)); c.lineTo(w - 6, py(1)); c.stroke(); c.setLineDash([]);
    c.strokeStyle = '#1A1915'; c.lineWidth = 1.6; c.beginPath();
    for (let i = 0; i <= 48; i++) { const z = -6 + i / 4; if (i) c.lineTo(px(z), py(1 / (1 + Math.exp(-z)))); else c.moveTo(px(z), py(1 / (1 + Math.exp(-z)))); }
    c.stroke();
    const v = Math.max(0.003, Math.min(0.997, val)), z = Math.log(v / (1 - v));
    c.fillStyle = rgba(GOLD); c.strokeStyle = '#FFFFFF'; c.lineWidth = 1.5; c.beginPath(); c.arc(px(z), py(v), 4.6, 0, 6.2832); c.fill(); c.stroke();
    c.fillStyle = '#8A867C'; c.font = '500 9.5px ' + SANS; c.textBaseline = 'middle'; c.textAlign = 'left'; c.fillText('1', 1, py(1) + 0.5); c.fillText('0', 1, py(0) + 0.5);
  };

  // ---------- the parts of the page around the picture ----------
  const GLYPHS = '<svg viewBox="0 0 46 16" width="46" height="16" aria-hidden="true"><g fill="#0B7A80"><circle cx="5" cy="8" r="3.2"/><ellipse cx="19" cy="4.4" rx="2.6" ry="3.4"/><ellipse cx="19" cy="11.6" rx="2.6" ry="3.4"/>' +
    '<g transform="translate(36 8) rotate(45)"><ellipse cx="0" cy="-4" rx="2.1" ry="3"/><ellipse cx="0" cy="4" rx="2.1" ry="3"/><ellipse cx="-4" cy="0" rx="3" ry="2.1"/><ellipse cx="4" cy="0" rx="3" ry="2.1"/></g></g></svg>';
  const chName = () => (st.flipTo ? 'down' : 'up');
  // an element's text is only rewritten when it changes, so dragging does not rebuild what stays the same
  const shown = new Map();
  const put = (el, html) => { if (shown.get(el) !== html) { shown.set(el, html); el.innerHTML = html; } };
  const readK = $('.k', read), readV = $('.v', read);
  // what follows the query point, the spin channel and the line: the note on the picture, the value, the handles
  const live = () => {
    const k = st.step, ch = chName(), arrowCh = ch === 'up' ? '↑' : '↓';
    const nb = k === 2 || k === 3 ? neighbors(st.q) : null;
    put(info, (k === 1 ? GLYPHS : '') + '<span>' + (k === 0 ? 'MnPd, a plane through both atoms' :
      k === 1 ? 'each atom: features with <i>ℓ</i> = 0, 1, 2' :
      k < 4 ? '<b>' + nb.all + '</b> atoms within 5 Å of <i>r</i>, ' + nb.plane + ' of them in this plane' :
      k === 4 ? 'the same network, run with <i>m</i> and with −<i>m</i>' :
      st.diff ? 'where WISP and DFT differ, spin ' + ch : 'mean |WISP − DFT| in MnPd: <b>' + D.mae[ch].toFixed(4) + '</b> for spin ' + ch) + '</span>');
    if (k >= 3) {
      const w = sample(F.wisp[ch], st.q[0], st.q[1]), d = sample(F.dft[ch], st.q[0], st.q[1]);
      put(readK, k === 5 ? 'ELF<sub>' + arrowCh + '</sub>(<i>r</i>) · WISP, DFT' : 'ELF<sub>' + arrowCh + '</sub>(<i>r</i>)');
      put(readV, k === 5 ? w.toFixed(3) + ' · ' + d.toFixed(3) : w.toFixed(3));
      if (!stage.classList.contains('narrow')) drawSig(w);
    }
    qEl.style.left = X(st.q[0]) + 'px'; qEl.style.top = Y(st.q[1]) + 'px';
    wipeEl.style.left = (st.split * 100) + '%'; wipeEl.setAttribute('aria-valuenow', String(Math.round(st.split * 100)));
  };
  // what changes with the step: the chips, the text beside the picture, which controls are there
  const sync = () => {
    const k = st.step, ch = chName();
    chips.forEach((b, i) => { b.classList.toggle('done', i < k); if (i === k) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
    const row = chips[0].closest('ol'), li = chips[k].parentNode;   // keep the chip of this step in sight when the row is wider than the column
    if (row.scrollWidth > row.clientWidth) row.scrollLeft = Math.max(0, li.offsetLeft - row.offsetLeft - (row.clientWidth - li.offsetWidth) / 2);
    put(head, (k + 1) + ' · ' + STEPS[k].name); put(body, STEPS[k].text);
    cv.setAttribute('aria-label', 'Scheme 1, step ' + (k + 1) + ' of ' + STEPS.length + ', ' + STEPS[k].name + '. ' + STEPS[k].alt);
    back.disabled = k === 0; count.textContent = (k + 1) + ' / ' + STEPS.length;
    put(next, k === STEPS.length - 1 ? 'Start over ↺' : 'Next: ' + STEPS[k + 1].name + ' →');
    chan.hidden = k < 4; $('[data-diff]', chan).hidden = k !== 5;
    $$('[data-ch]', chan).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ch === ch)));
    $('[data-diff]', chan).setAttribute('aria-pressed', String(st.diff));
    read.hidden = k < 3; qEl.hidden = k < 2; hint.hidden = k < 2 || stage.classList.contains('touched');
    wipeEl.hidden = !(k === 5 && !st.diff);
    $('.lg-diff').hidden = !(k === 5 && st.diff); $('.lg-elf').hidden = k === 5 && st.diff;
    live();
  };

  // ---------- time ----------
  const frame = (now) => {
    raf = 0;
    const dt = Math.min(64, now - (last || now)); last = now;
    let busy = dragging;
    if (st.started && st.t < 1) { st.t = Math.max(0, Math.min(1, (now - st.t0) / STEPS[st.step].dur)); busy = true; }   // until the first step starts the plate stays empty
    // the flip follows its target a little behind, so the arrows turn and the map changes together
    const target = st.step >= 4 ? (st.step === 4 && st.t < 0.12 && !st.touchedFlip ? 0 : st.flipTo) : 0;
    if (Math.abs(st.flip - target) > 0.001) { const d = dt / 700; st.flip += Math.max(-d, Math.min(d, target - st.flip)); busy = true; } else st.flip = target;
    if (st.step === 5 && Math.abs(st.split - st.wipeTo) > 0.001 && !st.wipeHeld) { st.split += (st.wipeTo - st.split) * Math.min(1, dt / 160); busy = true; wipeEl.style.left = (st.split * 100) + '%'; }
    draw();
    if (busy) raf = requestAnimationFrame(frame); else last = 0;
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
  const go = (k, again) => {
    k = Math.max(0, Math.min(STEPS.length - 1, k));
    if (k === st.step && !again && st.started) return;
    st.step = k; st.started = true; st.touchedFlip = false;
    st.t = reduced ? 1 : 0; st.t0 = performance.now();
    if (k === 3) st.flipTo = 0;                          // the decoder's first answer is the spin-up channel
    if (k === 4) st.flipTo = 1;                          // then the moments are reversed
    if (k < 3) { st.flipTo = 0; }
    if (k !== 5) st.diff = false;
    if (k === 5) { st.split = reduced ? 0.62 : 1; st.wipeTo = 0.62; st.wipeHeld = false; }
    if (reduced) st.flip = k >= 4 ? st.flipTo : 0;
    sync(); kick();
  };

  // ---------- controls ----------
  chips.forEach((b) => b.addEventListener('click', () => go(Number(b.dataset.step), true)));
  back.addEventListener('click', () => go(st.step - 1));
  next.addEventListener('click', () => go(st.step === STEPS.length - 1 ? 0 : st.step + 1));
  replay.addEventListener('click', () => go(st.step, true));
  chan.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.ch) { st.flipTo = b.dataset.ch === 'down' ? 1 : 0; st.touchedFlip = true; } else st.diff = !st.diff;
    sync(); kick();
  });
  // the query point: drag it, click somewhere else to send it there, or use the arrow keys
  const moveQ = (cx, cy) => {
    const r = stage.getBoundingClientRect(), m = 0.25;
    st.q = [Math.max(u0 + m, Math.min(u0 + WA - m, u0 + (cx - r.left) / s)), Math.max(vTop - HA + m, Math.min(vTop - m, vTop - (cy - r.top) / s))];
    if (!stage.classList.contains('touched')) { stage.classList.add('touched'); hint.hidden = true; }
    live(); kick();
  };
  qEl.addEventListener('pointerdown', (e) => { e.preventDefault(); dragging = true; try { qEl.setPointerCapture(e.pointerId); } catch (err) {} qEl.classList.add('on'); });
  qEl.addEventListener('pointermove', (e) => { if (dragging) moveQ(e.clientX, e.clientY); });
  const drop = () => { dragging = false; qEl.classList.remove('on'); };
  qEl.addEventListener('pointerup', drop); qEl.addEventListener('pointercancel', drop);
  qEl.addEventListener('keydown', (e) => {
    const d = e.shiftKey ? 0.5 : 0.1, m = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, d], ArrowDown: [0, -d] }[e.key]; if (!m) return;
    e.preventDefault();
    const r = stage.getBoundingClientRect(); moveQ(r.left + X(st.q[0] + m[0]), r.top + Y(st.q[1] + m[1]));
  });
  cv.addEventListener('click', (e) => { if (st.step >= 2) moveQ(e.clientX, e.clientY); });
  // the line between WISP and DFT
  const dragWipe = (e) => { const r = stage.getBoundingClientRect(); st.split = st.wipeTo = Math.max(0.05, Math.min(0.95, (e.clientX - r.left) / r.width)); live(); kick(); };
  wipeEl.addEventListener('pointerdown', (e) => { e.preventDefault(); st.wipeHeld = true; try { wipeEl.setPointerCapture(e.pointerId); } catch (err) {} wipeEl.classList.add('on'); dragWipe(e); });
  wipeEl.addEventListener('pointermove', (e) => { if (wipeEl.classList.contains('on')) dragWipe(e); });
  const letGo = () => { wipeEl.classList.remove('on'); st.wipeHeld = false; };
  wipeEl.addEventListener('pointerup', letGo); wipeEl.addEventListener('pointercancel', letGo);
  wipeEl.addEventListener('keydown', (e) => {
    const d = e.key === 'ArrowLeft' ? -0.04 : e.key === 'ArrowRight' ? 0.04 : 0; if (!d) return;
    e.preventDefault(); st.split = st.wipeTo = Math.max(0.05, Math.min(0.95, st.split + d)); live(); kick();
  });

  // ---------- start ----------
  // Nothing is measured or drawn until the scheme is about to scroll into view; the first step plays once it is in view.
  const textBox = $('.sch-text');
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
  const refit = () => { if (layout()) { roomForText(); sync(); kick(); } };
  const wake = () => {
    if ('ResizeObserver' in window) new ResizeObserver(refit).observe(stage); else { window.addEventListener('resize', refit); refit(); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { colW = -1; refit(); });
  };
  sync();
  if ('IntersectionObserver' in window) {
    const near = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { near.disconnect(); wake(); } }, { rootMargin: '500px 0px' });
    near.observe(stage);
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); if (!reduced && !st.started) go(0, true); } }, { threshold: 0.35 });   // not if a step was already picked
    io.observe(stage);
  } else { wake(); go(0, true); }
};
// the flat version runs unless the 3D one (scheme3d-wisp.js) has taken the figure; that one falls back to it without WebGL
if (!(document.getElementById('scheme-1') || { dataset: { view: '3d' } }).dataset.view) window.LP_flat1();
