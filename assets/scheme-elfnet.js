/* How ELFNet works, one step at a time: the flat version, shown where WebGL is missing.
   One face of the calcium lattice of CaH6, drawn on a canvas, that changes with the step: the atoms, the superposed
   atomic density on its grid, a convolution block that can be dragged across the edge of the cell, the reach of a grid
   point growing through the sixteen residual blocks, the ELF that comes out, and the comparison with DFT.
   The fields are the real ones (assets/elfnet-plane.js); the drawings of the network at work are schematic. */
window.LP_flat2 = () => {
  'use strict';
  const host = document.getElementById('scheme-2'), D = window.LP_ELFNET;
  if (!host) return;
  if (!D) { host.hidden = true; return; }
  const $ = (s, r = host) => r.querySelector(s);
  const $$ = (s, r = host) => Array.from(r.querySelectorAll(s));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cite = window.LP_CITE ? window.LP_CITE('elfnet') : '';
  const figN = (window.LP_FIGS || []).findIndex((f) => f.id === 'fig-elfnet') + 1;   // whether the 3D figure that follows is on the page

  // ---------- the face of the cell, in Å ----------
  const A = D.a, N = D.n, ND = D.nd;   // cell edge, grid points along it for the density and the prediction, and for DFT
  const WA = 1.72 * A;                 // width of the picture: the cell and a strip of its repeats on each side
  const KH = 2;                        // a 5 x 5 x 5 convolution reaches two grid points to each side
  const BLOCKS = 16, EVERY = 4;        // residual blocks, and an attention block after every fourth
  const VMAX = 0.71;                   // color limit of the ELF, the same as in the 3D figure
  const R_BALL = 0.3, R_DOT = 0.085;
  const CA = [94, 147, 184], ORANGE = [222, 104, 40], INK = [26, 25, 21], BLUE = [38, 96, 178];

  const decode = (b64, n) => {
    const s = atob(b64), f = new Float32Array(n * n);
    for (let i = 0; i < n * n; i++) f[i] = (s.charCodeAt(2 * i) + 256 * s.charCodeAt(2 * i + 1)) / 65535;
    return f;
  };
  const F = { sad: decode(D.sad, N), net: decode(D.elfnet, N), dft: decode(D.dft, ND) }, GRID = { sad: N, net: N, dft: ND };
  let sadMin = 1; for (const v of F.sad) if (v < sadMin) sadMin = v;
  // periodic Catmull-Rom interpolation; x and y are fractions of the cell edge
  const cr = (p0, p1, p2, p3, t) => p1 + 0.5 * t * (p2 - p0 + t * (2 * p0 - 5 * p1 + 4 * p2 - p3 + t * (3 * (p1 - p2) + p3 - p0)));
  const sample = (key, x, y) => {
    const f = F[key], n = GRID[key], w = (i) => ((i % n) + n) % n, gx = x * n, gy = y * n, i = Math.floor(gx), k = Math.floor(gy), tx = gx - i, ty = gy - k;
    const row = (kk) => { const o = w(kk) * n; return cr(f[o + w(i - 1)], f[o + w(i)], f[o + w(i + 1)], f[o + w(i + 2)], tx); };
    return Math.max(0, Math.min(1, cr(row(k - 1), row(k), row(k + 1), row(k + 2), ty)));
  };
  // the blue-green-red scale of the 3D figures, softened as in the WISP figure; and white to blue for the density
  const elfColor = (t) => {
    t = Math.max(0, Math.min(1, t));
    let c;
    if (t < 0.25) c = [0, t / 0.25, 1]; else if (t < 0.5) c = [0, 1, 1 - (t - 0.25) / 0.25];
    else if (t < 0.75) c = [(t - 0.5) / 0.25, 1, 0]; else c = [1, 1 - (t - 0.75) / 0.25, 0];
    return c.map((x) => Math.round(255 * (x + (1 - x) * 0.26)));
  };
  const sadColor = (t) => { t = Math.pow(Math.max(0, Math.min(1, t)), 0.62); return [255, 255, 255].map((x, i) => Math.round(x + (BLUE[i] - x) * t)); };

  // ---------- page elements ----------
  const STEPS = [
    { name: 'Structure', dur: 1500,
      text: 'ELFNet is given a crystal structure and nothing else. This is the calcium lattice of CaH<sub>6</sub> with the hydrogen left out, seen on one face of the cubic cell, with a calcium at each corner. The cell repeats in every direction.',
      alt: 'A square cell with a calcium atom at each of its four corners.' },
    { name: 'Density', dur: 2200,
      text: 'First the densities of the free atoms are added up on a grid over the cell. This superposed atomic density (SAD) takes no quantum calculation, only the positions and a table of atomic densities. The grid, ' + N + ' points along each edge here, is all the network sees.',
      alt: 'A grid over the cell, and on it a map of the superposed atomic density, highest at the calcium atoms.' },
    { name: 'Convolve', dur: 2400,
      text: 'The network is built from 3D convolutions. Each one updates every grid point from the 5 × 5 × 5 block of points around it. Where the block reaches past the edge of the cell it wraps around to the other side, because the crystal repeats. Drag the block to an edge or a corner.',
      alt: 'A block of five by five grid points at the right edge of the cell. The part that sticks out reappears at the left edge.' },
    { name: 'Stack', dur: 4400,
      text: 'Sixteen residual blocks follow, each with two convolutions, and an attention block after every fourth. The grid keeps its size the whole way. With each block a point is influenced by points farther away; in this cell, after four blocks it has seen all of it.',
      alt: 'The region that influences one grid point grows block by block, wraps around the edges, and covers the whole cell.' },
    { name: 'Read out', dur: 2200,
      text: 'A last convolution and a sigmoid turn the 32 numbers held at each grid point into one value between 0 and 1. That is the predicted ELF, on the same grid as the input. The whole prediction is one pass through the network.',
      alt: 'The density map changes into a map of the predicted electron localization function, with a network of high values between the atoms.' },
    { name: 'Compare', dur: 1300,
      text: 'Left of the line is ELFNet, right of it the DFT calculation of the same lattice. Between the atoms both have the same network of high ELF, and the squares mark where the hydrogens of CaH<sub>6</sub> sit on it. Close to the nuclei the two differ; ELFNet’s training puts its weight on the space between the atoms. The network was trained on 326,009 structures from about −50 to 500 GPa, and the whole workflow is about 350 times faster than computing the ELF with VASP, on the hardware in the paper.' + (figN ? ' <a href="#fig-elfnet">The figure below</a> has the same comparison in 3D.' : ''),
      alt: 'The same map with a line across it: the ELFNet prediction on the left and the DFT calculation on the right, and four squares at the hydrogen sites of CaH6.' }
  ];
  let net = '<span class="b" data-k="stem">Stem</span>';
  for (let i = 1; i <= BLOCKS; i++) net += '<i class="rb"></i>' + (i % EVERY === 0 ? '<i class="at"></i>' : '');
  net += '<span class="b" data-k="post">Post</span><span class="b" data-k="head">Head</span>';
  host.innerHTML =
    '<div class="fig-main">' +
    '<ol class="steps" aria-label="How ELFNet works: steps">' + STEPS.map((s, i) => '<li><button type="button" data-step="' + i + '"><b>' + (i + 1) + '</b>' + s.name + '</button></li>').join('') + '</ol>' +
    '<div class="sch-wrap"><div class="stage sch-stage"><canvas class="sch" role="img"></canvas>' +
    '<div class="sch-net" aria-hidden="true" hidden>' + net + '</div>' +
    '<div class="sch-read" hidden><canvas class="sig" aria-hidden="true"></canvas><div><p class="k"></p><p class="v"></p></div></div>' +
    '<div class="wipe sch-wipe" role="slider" tabindex="0" aria-label="Line between the ELFNet prediction and the DFT calculation" aria-valuemin="0" aria-valuemax="100" hidden><i></i><b></b><span class="l">ELFNET</span><span class="r">DFT</span></div>' +
    '<button type="button" class="sch-q" aria-label="Grid point. Drag it, or move it with the arrow keys." hidden></button>' +
    '<p class="hint" hidden>drag the point</p></div><p class="sch-info"></p></div>' +
    '<div class="sch-nav"><button type="button" class="back">← Back</button><span class="where"><button type="button" class="replay">Replay</button><span class="count"></span></span><button type="button" class="next"></button></div>' +
    '</div>' +
    '<figcaption class="fig-side">' +
    '<p class="fig-title"><b>How ELFNet turns a crystal structure into an ELF map, one step at a time.</b>' + (cite ? ' (' + cite + ')' : '') + '</p>' +
    '<div class="sch-text" aria-live="polite"><h4></h4><p class="cap"></p></div>' +
    '<div class="legend"><span><i style="background:#5E93B8"></i>Ca</span><span><em class="lg-k"></em>5 × 5 × 5 block</span><span><em class="lg-h"></em>H site of CaH₆</span>' +
    '<span class="lg-sad">density, low<b></b>high</span><span class="lg-elf">ELF 0<b></b>' + VMAX + '</span></div>' +
    '<p class="spec"><b>Ca lattice of CaH<sub>6</sub></b> · face <i>z</i> = 0 · <i>a</i> = ' + A.toFixed(3) + ' Å · density and ELFNet on a ' + N + '×' + N + '×' + N + ' grid, DFT on ' + ND + '×' + ND + '×' + ND + ' · FlatResNet3D, 4,232,989 parameters. The fields are real; the drawings of the network at work are schematic.</p>' +
    '</figcaption>';

  const stage = $('.sch-stage'), cv = $('canvas.sch'), ctx = cv.getContext('2d');
  const netEl = $('.sch-net'), read = $('.sch-read'), sig = $('canvas.sig'), wipeEl = $('.sch-wipe'), qEl = $('.sch-q'), info = $('.sch-info'), hint = $('.hint');
  const chips = $$('.steps button'), back = $('.back'), next = $('.next'), replay = $('.replay'), count = $('.count');
  const head = $('.sch-text h4'), body = $('.sch-text .cap'), netParts = $$('.sch-net > *');

  // ---------- state ----------
  const st = { step: 0, t: reduced ? 1 : 0, t0: 0, started: false, f: [N - 1, 12], moved: false, split: 0.56, wipeTo: 0.56 };
  window.LP_SCHEME2 = st;   // for checking the page from the console
  let W = 0, H = 0, dpr = 1, s = 1, ox = 0, oy = 0, raf = 0, last = 0, dragging = false;
  const X = (x) => ox + x * s, Y = (y) => oy - y * s, V = A / N;   // Å to pixels; V is the spacing of the grid
  const smooth = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
  const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a == null ? 1 : Math.max(0, Math.min(1, a)).toFixed(3)) + ')';
  const mixc = (c, w, t) => c.map((x) => Math.round(x + (w - x) * t));
  const wrapN = (i) => ((i % N) + N) % N;

  const layout = () => {
    const r = stage.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    W = r.width; H = r.height; dpr = Math.min(2, window.devicePixelRatio || 1);
    stage.classList.toggle('narrow', W < 520);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    s = Math.min(W / WA, (H - (W < 520 ? 76 : 112)) / A);   // the cell always fits, with room above and below for the cards
    ox = (W - A * s) / 2; oy = (H + A * s) / 2;       // the pixel of the cell's lower left corner
    return true;
  };

  // a field over the whole picture, as an image: made once for each field and size
  const images = {};
  const fieldImage = (key) => {
    const tag = key + '@' + W.toFixed(0) + 'x' + H.toFixed(0);
    if (images[tag]) return images[tag];
    const w = 720, h = Math.max(2, Math.round(w * H / W)), c = document.createElement('canvas'), f = F[key], n = GRID[key], wn = (i) => ((i % n) + n) % n;
    c.width = w; c.height = h;
    const rows = new Float32Array(n * w);
    for (let x = 0; x < w; x++) {
      const g = ((x + 0.5) / w * W - ox) / (A * s) * n, i = Math.floor(g), t = g - i;
      for (let k = 0; k < n; k++) rows[k * w + x] = cr(f[k * n + wn(i - 1)], f[k * n + wn(i)], f[k * n + wn(i + 1)], f[k * n + wn(i + 2)], t);
    }
    const g2 = c.getContext('2d'), img = g2.createImageData(w, h), px = img.data, lut = [];
    for (let i = 0; i <= 512; i++) lut.push(key === 'sad' ? sadColor((i / 512 - sadMin) / (1 - sadMin)) : elfColor(i / 512 / VMAX));
    for (let y = 0; y < h; y++) {
      const g = (oy - (y + 0.5) / h * H) / (A * s) * n, k = Math.floor(g), t = g - k;
      const r0 = wn(k - 1) * w, r1 = wn(k) * w, r2 = wn(k + 1) * w, r3 = wn(k + 2) * w;
      for (let x = 0; x < w; x++) {
        const cc = lut[Math.max(0, Math.min(512, Math.round(cr(rows[r0 + x], rows[r1 + x], rows[r2 + x], rows[r3 + x], t) * 512)))], o = (y * w + x) * 4;
        px[o] = cc[0]; px[o + 1] = cc[1]; px[o + 2] = cc[2]; px[o + 3] = 255;
      }
    }
    g2.putImageData(img, 0, 0);
    images[tag] = c;
    return c;
  };

  // ---------- drawing ----------
  const ball = (x, y, r, c, a) => {
    const g = ctx.createRadialGradient(x - 0.32 * r, y - 0.36 * r, r * 0.06, x, y, r);
    g.addColorStop(0, rgba(mixc(c, 255, 0.55), a)); g.addColorStop(0.5, rgba(c, a)); g.addColorStop(1, rgba(mixc(c, 0, 0.3), a));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
  };
  const label = (text, x, y, font, col, align) => {
    ctx.font = font; ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.92)'; ctx.strokeText(text, x, y);
    ctx.fillStyle = col; ctx.fillText(text, x, y);
  };
  const SANS = '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif';
  // the pixel rectangle of grid points i0..i1 by j0..j1; a point's square is centered on the point
  const rectOf = (i0, i1, j0, j1) => [X((i0 - 0.5) * V), Y((j1 + 0.5) * V), (i1 - i0 + 1) * V * s, (j1 - j0 + 1) * V * s];
  // the stretches of 0..N-1 that a reach of h points around point c covers, once it has wrapped around the cell
  const spans = (c, h) => {
    if (2 * h + 1 >= N) return [[0, N - 1]];
    const a = c - h, b = c + h;
    if (a < 0) return [[0, b], [a + N, N - 1]];
    if (b > N - 1) return [[a, N - 1], [0, b - N]];
    return [[a, b]];
  };
  // the point on screen: during the entrance of "Convolve" it slides from the middle of the cell to where it will sit
  const focus = () => {
    if (st.step === 2 && st.t < 1 && !st.moved) { const e = smooth((st.t - 0.12) / 0.5); return [N / 2 + (st.f[0] - N / 2) * e, N / 2 + (st.f[1] - N / 2) * e]; }
    return st.f;
  };
  // how many residual blocks the picture of "Stack" has reached, as a number that grows smoothly
  const depth = () => (st.step > 3 ? BLOCKS : st.step < 3 ? 0 : st.t < 0.6 ? 4 * st.t / 0.6 : 4 + 12 * (st.t - 0.6) / 0.4);

  const arrowArc = (x0, y0, x1, y1, bend, col) => {
    const mx = (x0 + x1) / 2 + bend[0], my = (y0 + y1) / 2 + bend[1];
    ctx.strokeStyle = ctx.fillStyle = col; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(mx, my, x1, y1); ctx.stroke();
    const ang = Math.atan2(y1 - my, x1 - mx), L = 7;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - L * Math.cos(ang - 0.45), y1 - L * Math.sin(ang - 0.45)); ctx.lineTo(x1 - L * Math.cos(ang + 0.45), y1 - L * Math.sin(ang + 0.45)); ctx.closePath(); ctx.fill();
  };

  const draw = () => {
    if (!W) return;
    const k = st.step, t = st.t, on = (n, a, b) => (k > n ? 1 : k < n ? 0 : smooth((t - (a || 0)) / ((b == null ? 1 : b) - (a || 0))));
    const cell = [X(0), Y(A), A * s, A * s];
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H);

    // the fields: the density from "Density" on, turning into the ELF at "Read out", and ELFNet | DFT at "Compare"
    const sadA = on(1, 0.25, 0.9), elfA = on(4, 0.1, 0.85);
    if (sadA > 0 && elfA < 1) { ctx.globalAlpha = sadA; ctx.drawImage(fieldImage('sad'), 0, 0, W, H); ctx.globalAlpha = 1; }
    if (elfA > 0) {
      const part = (key, x0, x1) => { if (x1 - x0 < 0.5) return; ctx.save(); ctx.beginPath(); ctx.rect(x0, 0, x1 - x0, H); ctx.clip(); ctx.globalAlpha = elfA; ctx.drawImage(fieldImage(key), 0, 0, W, H); ctx.restore(); };
      if (k === 5) { part('net', 0, st.split * W); part('dft', st.split * W, W); } else part('net', 0, W);
    }
    // outside the cell the picture repeats; it is drawn fainter there
    if (sadA > 0) {
      ctx.fillStyle = rgba([255, 255, 255], 0.6 * sadA);
      ctx.fillRect(0, 0, W, cell[1]); ctx.fillRect(0, cell[1] + cell[3], W, H - cell[1] - cell[3]);
      ctx.fillRect(0, cell[1], cell[0], cell[3]); ctx.fillRect(cell[0] + cell[2], cell[1], W - cell[0] - cell[2], cell[3]);
    }
    // the grid: one square around each grid point
    const gridA = on(1, 0, 0.3) * (0.34 - 0.2 * on(4, 0, 0.5)) * (stage.classList.contains('narrow') ? 0.6 : 1);
    if (gridA > 0) {
      ctx.strokeStyle = rgba([120, 124, 132], gridA); ctx.lineWidth = 1; ctx.beginPath();
      for (let i = Math.ceil(-ox / (V * s) + 0.5); X((i - 0.5) * V) < W; i++) { const x = Math.round(X((i - 0.5) * V)) + 0.5; ctx.moveTo(x, 0); ctx.lineTo(x, H); }
      for (let j = Math.ceil((oy - H) / (V * s) + 0.5); Y((j - 0.5) * V) > 0; j++) { const y = Math.round(Y((j - 0.5) * V)) + 0.5; ctx.moveTo(0, y); ctx.lineTo(W, y); }
      ctx.stroke();
    }

    // the region that influences the point: a 5 x 5 block at "Convolve", then wider with every residual block
    const f = focus(), fi = Math.round(f[0]), fj = Math.round(f[1]);
    if (k === 2 || k === 3) {
      const d = depth(), h = k === 2 ? KH : KH + 4 * d, a = k === 2 ? on(2, 0, 0.18) : 1;
      // inside the cell: every stretch the reach covers once it has wrapped around the edges
      ctx.fillStyle = rgba(ORANGE, (k === 2 ? 0.2 : 2 * Math.floor(h) + 1 >= N ? 0.11 : 0.17) * a); ctx.strokeStyle = rgba(ORANGE, 0.85 * a); ctx.lineWidth = 1.6;
      const hx = spans(fi, Math.floor(h)), hy = spans(fj, Math.floor(h));
      for (const ax of hx) for (const ay of hy) { const r = rectOf(ax[0], ax[1], ay[0], ay[1]); ctx.fillRect(r[0], r[1], r[2], r[3]); ctx.strokeRect(r[0] + 0.5, r[1] + 0.5, r[2] - 1, r[3] - 1); }
      if (k === 2) {
        // the block as the convolution sees it, sticking out past the edge, and an arrow to where those points really are
        const r = rectOf(f[0] - KH, f[0] + KH, f[1] - KH, f[1] + KH);
        ctx.save(); ctx.setLineDash([4, 3]); ctx.strokeStyle = rgba(ORANGE, 0.9 * a); ctx.lineWidth = 1.4; ctx.strokeRect(r[0] + 0.5, r[1] + 0.5, r[2] - 1, r[3] - 1); ctx.restore();
        if (t >= 1 || st.moved) {
          const col = rgba(mixc(ORANGE, 0, 0.15), 0.95), bend = -Math.max(40, 0.2 * A * s);
          if (fi + KH > N - 1) arrowArc(X((N + (fi + KH - N) / 2) * V), r[1] - 5, X((fi + KH - N) / 2 * V), r[1] - 5, [0, bend], col);
          if (fi - KH < 0) arrowArc(X((fi - KH) / 2 * V - V / 2), r[1] - 5, X((N - 1 + (fi - KH + 1) / 2) * V), r[1] - 5, [0, bend], col);
          if (fj + KH > N - 1) arrowArc(r[0] + r[2] + 5, Y((N + (fj + KH - N) / 2) * V), r[0] + r[2] + 5, Y((fj + KH - N) / 2 * V), [-bend, 0], col);
          if (fj - KH < 0) arrowArc(r[0] + r[2] + 5, Y((fj - KH) / 2 * V - V / 2), r[0] + r[2] + 5, Y((N - 1 + (fj - KH + 1) / 2) * V), [-bend, 0], col);
        }
      }
    }

    // the cell, and dashed where its edges run on into the repeats around it
    ctx.save(); ctx.setLineDash([3, 4]); ctx.strokeStyle = rgba([120, 116, 106], 0.6 * on(0, 0.2, 0.6)); ctx.lineWidth = 1; ctx.beginPath();
    for (const q of [0, A]) { const x = Math.round(X(q)) + 0.5, y = Math.round(Y(q)) + 0.5; ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke(); ctx.restore();
    ctx.strokeStyle = rgba(INK, 0.9 * on(0, 0, 0.3)); ctx.lineWidth = 1.5; ctx.strokeRect(Math.round(cell[0]) + 0.5, Math.round(cell[1]) + 0.5, Math.round(cell[2]), Math.round(cell[3]));

    // the calcium atoms at the corners: spheres at first, dots once the density is on the grid
    const small = on(1, 0.1, 0.4);
    for (let i = 0; i < 4; i++) {
      const x = X((i % 2) * A), y = Y((i >> 1) * A), pop = k > 0 ? 1 : smooth((t - 0.12 * i) / 0.45);
      if (pop <= 0) continue;
      const r = (R_BALL + (R_DOT - R_BALL) * small) * s * (0.6 + 0.4 * pop);
      if (small > 0) { ctx.fillStyle = rgba([255, 255, 255], small); ctx.beginPath(); ctx.arc(x, y, r + 1.6, 0, 6.2832); ctx.fill(); }
      ball(x, y, r, CA, pop);
    }
    const tagA = k === 0 ? smooth((t - 0.6) / 0.4) : 1 - on(1, 0, 0.2);
    if (tagA > 0) { ctx.globalAlpha = tagA; label('Ca', X(0) + R_BALL * s + 7, Y(A) - 14, '600 13px ' + SANS, rgba(INK), 'left'); ctx.globalAlpha = 1; }

    // where the hydrogens of CaH6 sit on this face
    const ha = on(5, 0.35, 0.8);
    if (ha > 0) for (const p of D.hsites) {
      const x = X(p[0] * A), y = Y(p[1] * A), q = 6.5;
      ctx.fillStyle = rgba([255, 255, 255], 0.96 * ha); ctx.strokeStyle = rgba(INK, ha); ctx.lineWidth = 1.8;
      ctx.fillRect(x - q, y - q, 2 * q, 2 * q); ctx.strokeRect(x - q, y - q, 2 * q, 2 * q);
    }

    // the grid point being followed
    const pa = on(2, 0, 0.15);
    if (pa > 0) {
      const x = X(f[0] * V), y = Y(f[1] * V);
      if (k < 4) { const r = rectOf(f[0], f[0], f[1], f[1]); ctx.fillStyle = rgba(ORANGE, 0.95 * pa); ctx.fillRect(r[0], r[1], r[2], r[3]); }
      else {
        const g = ctx.createRadialGradient(x, y, 0, x, y, 17); g.addColorStop(0, rgba(ORANGE, 0.5)); g.addColorStop(1, rgba(ORANGE, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 17, 0, 6.2832); ctx.fill();
        ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = rgba(mixc(ORANGE, 0, 0.25)); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(x, y, 5.8, 0, 6.2832); ctx.fill(); ctx.stroke();
      }
    }
  };

  // the small plot beside the value: the last stage of the network, a sigmoid, with the point's value on it
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
    c.fillStyle = rgba(ORANGE); c.strokeStyle = '#FFFFFF'; c.lineWidth = 1.5; c.beginPath(); c.arc(px(z), py(v), 4.6, 0, 6.2832); c.fill(); c.stroke();
    c.fillStyle = '#8A867C'; c.font = '500 9.5px ' + SANS; c.textBaseline = 'middle'; c.textAlign = 'left'; c.fillText('1', 1, py(1) + 0.5); c.fillText('0', 1, py(0) + 0.5);
  };

  // ---------- the parts of the page around the picture ----------
  const shown = new Map();
  const put = (el, html) => { if (shown.get(el) !== html) { shown.set(el, html); el.innerHTML = html; } };
  const readK = $('.k', read), readV = $('.v', read);
  // what follows the point, the depth and the line: the note on the picture, the strip of blocks, the value, the handles
  const live = () => {
    const k = st.step, fi = st.f[0], fj = st.f[1];
    let note = '';
    if (k === 0) note = 'the calcium lattice of CaH<sub>6</sub>, one face of the cell';
    else if (k === 1) note = 'superposed atomic density on a ' + N + ' × ' + N + ' × ' + N + ' grid';
    else if (k === 2) {
      let out = 0;
      for (let i = fi - KH; i <= fi + KH; i++) for (let j = fj - KH; j <= fj + KH; j++) if (i < 0 || i > N - 1 || j < 0 || j > N - 1) out++;
      note = out ? '<b>' + out + '</b> of the 25 points of this block come from across the edge' : 'here the block lies inside the cell';
    } else if (k === 3) {
      const d = Math.min(BLOCKS, Math.floor(depth() + 1e-6)), h = KH + 4 * d;
      note = (d ? 'after block <b>' + d + '</b>' : 'after the first convolution') + ': reach of ' + h + ' points, ' + (h * V).toFixed(1) + ' Å' + (2 * h + 1 >= N ? ' · the whole cell' : '');
    } else if (k === 4) note = 'the same ' + N + ' × ' + N + ' × ' + N + ' grid as the input';
    else note = 'at the hydrogen sites: ELFNet <b>' + D.atSite.elfnet.toFixed(2) + '</b>, DFT <b>' + D.atSite.dft.toFixed(2) + '</b>';
    put(info, '<span>' + note + '</span>');
    // the strip of blocks: the stem, sixteen residual blocks with attention after every fourth, the post block and the head
    const d = k < 2 ? -1 : k === 2 ? 0 : k === 3 ? Math.floor(depth() + 1e-6) : BLOCKS, lit = d < 0 ? 0 : 1 + d + Math.floor(d / EVERY) + (k >= 4 ? 2 : 0);
    netParts.forEach((el, i) => el.classList.toggle('on', i < lit));
    if (k >= 4) {
      const e = F.net[fj * N + fi], r = sample('dft', fi / N, fj / N);
      put(readK, k === 5 ? 'ELF at the point · ELFNet, DFT' : 'ELF at the point');
      put(readV, k === 5 ? e.toFixed(3) + ' · ' + r.toFixed(3) : e.toFixed(3));
      if (!stage.classList.contains('narrow')) drawSig(e);
    }
    const f = focus();
    qEl.style.left = X(f[0] * V) + 'px'; qEl.style.top = Y(f[1] * V) + 'px';
    wipeEl.style.left = (st.split * 100) + '%'; wipeEl.setAttribute('aria-valuenow', String(Math.round(st.split * 100)));
  };
  // what changes with the step: the chips, the text beside the picture, which controls are there
  const sync = () => {
    const k = st.step;
    chips.forEach((b, i) => { b.classList.toggle('done', i < k); if (i === k) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
    const row = chips[0].closest('ol'), li = chips[k].parentNode;   // keep the chip of this step in sight when the row is wider than the column
    if (row.scrollWidth > row.clientWidth) row.scrollLeft = Math.max(0, li.offsetLeft - row.offsetLeft - (row.clientWidth - li.offsetWidth) / 2);
    put(head, (k + 1) + ' · ' + STEPS[k].name); put(body, STEPS[k].text);
    cv.setAttribute('aria-label', 'How ELFNet works, step ' + (k + 1) + ' of ' + STEPS.length + ', ' + STEPS[k].name + '. ' + STEPS[k].alt);
    back.disabled = k === 0; count.textContent = (k + 1) + ' / ' + STEPS.length;
    put(next, k === STEPS.length - 1 ? 'Start over ↺' : 'Next<span class="nx">: ' + STEPS[k + 1].name + '</span> →');
    netEl.hidden = k < 2 || k > 4; read.hidden = k < 4; qEl.hidden = k < 2; wipeEl.hidden = k !== 5;
    hint.hidden = k < 2 || stage.classList.contains('touched');
    live();
  };

  // ---------- time ----------
  const frame = (now) => {
    raf = 0;
    const dt = Math.min(64, now - (last || now)); last = now;
    let busy = dragging;
    if (st.started && st.t < 1) { st.t = Math.max(0, Math.min(1, (now - st.t0) / STEPS[st.step].dur)); busy = true; if (st.step === 2 || st.step === 3) live(); }
    if (st.step === 5 && Math.abs(st.split - st.wipeTo) > 0.001 && !st.wipeHeld) { st.split += (st.wipeTo - st.split) * Math.min(1, dt / 160); busy = true; wipeEl.style.left = (st.split * 100) + '%'; }
    draw();
    if (busy) raf = requestAnimationFrame(frame); else last = 0;
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
  const go = (k, again) => {
    k = Math.max(0, Math.min(STEPS.length - 1, k));
    if (k === st.step && !again && st.started) return;
    st.step = k; st.started = true;
    st.t = reduced ? 1 : 0; st.t0 = performance.now();
    if (k === 5) { st.split = reduced ? 0.56 : 1; st.wipeTo = 0.56; st.wipeHeld = false; }
    sync(); kick();
  };

  // ---------- controls ----------
  chips.forEach((b) => b.addEventListener('click', () => go(Number(b.dataset.step), true)));
  back.addEventListener('click', () => go(st.step - 1));
  next.addEventListener('click', () => go(st.step === STEPS.length - 1 ? 0 : st.step + 1));
  replay.addEventListener('click', () => go(st.step, true));
  // the grid point: drag it, click somewhere else to send it there, or use the arrow keys; it stays on the grid of the cell
  const setF = (i, j) => {
    st.f = [Math.max(0, Math.min(N - 1, Math.round(i))), Math.max(0, Math.min(N - 1, Math.round(j)))]; st.moved = true;
    if (!stage.classList.contains('touched')) { stage.classList.add('touched'); hint.hidden = true; }
    live(); kick();
  };
  const moveF = (cx, cy) => { const r = stage.getBoundingClientRect(); setF((cx - r.left - ox) / (V * s), (oy - (cy - r.top)) / (V * s)); };
  qEl.addEventListener('pointerdown', (e) => { e.preventDefault(); dragging = true; try { qEl.setPointerCapture(e.pointerId); } catch (err) {} qEl.classList.add('on'); });
  qEl.addEventListener('pointermove', (e) => { if (dragging) moveF(e.clientX, e.clientY); });
  const drop = () => { dragging = false; qEl.classList.remove('on'); };
  qEl.addEventListener('pointerup', drop); qEl.addEventListener('pointercancel', drop);
  qEl.addEventListener('keydown', (e) => {
    const d = e.shiftKey ? 4 : 1, m = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, d], ArrowDown: [0, -d] }[e.key]; if (!m) return;
    e.preventDefault(); setF(st.f[0] + m[0], st.f[1] + m[1]);
  });
  cv.addEventListener('click', (e) => { if (st.step >= 2) moveF(e.clientX, e.clientY); });
  // the line between ELFNet and DFT
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
// the flat version runs unless the 3D one (scheme3d-elfnet.js) has taken the figure; that one falls back to it without WebGL
if (!(document.getElementById('scheme-2') || { dataset: { view: '3d' } }).dataset.view) window.LP_flat2();
