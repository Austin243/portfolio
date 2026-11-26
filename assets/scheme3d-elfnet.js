/* How ELFNet works, in 3D: one step at a time, in one cell of the calcium lattice of CaH6 that can be turned.
   The atoms, the superposed atomic density as a dot on every point of its grid, a 5 x 5 x 5 convolution block that can
   be dragged through a face and comes back in at the opposite one, the reach of a grid point growing through the sixteen
   residual blocks, the ELF that comes out (a map on a plane through the middle of the cell, and the isosurface of the
   figures), and the comparison with DFT.
   The fields are the real ones (assets/elfnet-plane.js and the cah6_ca_* scenes); the drawings of the network at work
   are schematic. Where WebGL is missing, the flat version (scheme-elfnet.js) is shown instead. */
(() => {
  'use strict';
  const host = document.getElementById('scheme-2'), D = window.LP_ELFNET;
  if (!host || !D || !D.mid || typeof Stage3D === 'undefined' || !window.LP_scheme || typeof WebGLRenderingContext === 'undefined') return;
  host.dataset.view = '3d';   // the flat version stands back
  const cite = window.LP_CITE ? window.LP_CITE('elfnet') : '';

  // ---------- the cell, in Å ----------
  const A = D.a, N = D.n, ND = D.nd, V = A / N;   // cell edge, grid points along it (density and prediction; DFT), grid spacing
  const KZ = N / 2, ZC = A / 2;                   // the map is the grid plane through the middle of the cell
  const KH = 2, BLOCKS = 16, EVERY = 4, VMAX = 0.71, ISO = 0.45;
  const R_BALL = 0.34, R_DOT = 0.17;
  const CA = [0.369, 0.576, 0.722], HY = [0.86, 0.88, 0.91], ORANGE = [0.871, 0.408, 0.157], INK = [0.1, 0.098, 0.082], YELLOW = [0.98, 0.83, 0.22], WHITE = [1, 1, 1];
  const mix = (c, w, t) => [c[0] + (w[0] - c[0]) * t, c[1] + (w[1] - c[1]) * t, c[2] + (w[2] - c[2]) * t];

  const decode = (b64, n) => {
    const s = atob(b64), f = new Float32Array(n * n);
    for (let i = 0; i < n * n; i++) f[i] = (s.charCodeAt(2 * i) + 256 * s.charCodeAt(2 * i + 1)) / 65535;
    return f;
  };
  const F = { sad: decode(D.mid.sad, N), net: decode(D.mid.elfnet, N), dft: decode(D.mid.dft, ND) }, GRID = { sad: N, net: N, dft: ND };
  let sadMin = 1; for (const v of F.sad) if (v < sadMin) sadMin = v;
  const cr = (p0, p1, p2, p3, t) => p1 + 0.5 * t * (p2 - p0 + t * (2 * p0 - 5 * p1 + 4 * p2 - p3 + t * (3 * (p1 - p2) + p3 - p0)));
  const sample = (key, x, y) => {   // x and y are fractions of the cell edge
    const f = F[key], n = GRID[key], w = (i) => ((i % n) + n) % n, gx = x * n, gy = y * n, i = Math.floor(gx), k = Math.floor(gy), tx = gx - i, ty = gy - k;
    const row = (kk) => { const o = w(kk) * n; return cr(f[o + w(i - 1)], f[o + w(i)], f[o + w(i + 1)], f[o + w(i + 2)], tx); };
    return Math.max(0, Math.min(1, cr(row(k - 1), row(k), row(k + 1), row(k + 2), ty)));
  };
  const elfColor = (t) => {
    t = Math.max(0, Math.min(1, t));
    let c;
    if (t < 0.25) c = [0, t / 0.25, 1]; else if (t < 0.5) c = [0, 1, 1 - (t - 0.25) / 0.25];
    else if (t < 0.75) c = [(t - 0.5) / 0.25, 1, 0]; else c = [1, 1 - (t - 0.75) / 0.25, 0];
    return c.map((x) => Math.round(255 * (x + (1 - x) * 0.26)));
  };
  const sadColor = (t) => { t = Math.pow(Math.max(0, Math.min(1, t)), 0.62); return [255, 255, 255].map((x, i) => Math.round(x + ([38, 96, 178][i] - x) * t)); };
  // one cell of a field on the map's plane as a picture, 256 pixels each way, so that it can repeat as a texture
  const tiles = {};
  const tile = (key) => {
    if (tiles[key]) return tiles[key];
    const w = 256, c = document.createElement('canvas'), g = c.getContext('2d');
    c.width = c.height = w;
    if (key === 'grid') {   // one square around each grid point: the lines run half a spacing off the points
      g.fillStyle = 'rgb(112,116,124)';
      for (let i = 0; i < N; i++) { const p = Math.round((i + 0.5) * w / N); g.fillRect(p, 0, 1, w); g.fillRect(0, p, w, 1); }
      return (tiles[key] = c);
    }
    const img = g.createImageData(w, w), px = img.data;
    for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) {
      const v = sample(key, (x + 0.5) / w, 1 - (y + 0.5) / w), cc = key === 'sad' ? sadColor((v - sadMin) / (1 - sadMin)) : elfColor(v / VMAX), o = (y * w + x) * 4;
      px[o] = cc[0]; px[o + 1] = cc[1]; px[o + 2] = cc[2]; px[o + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return (tiles[key] = c);
  };
  // the stretches of 0..N-1 that a reach of h points around point c covers, once it has wrapped around the cell
  const spans = (c, h) => {
    if (2 * h + 1 >= N) return [[0, N - 1]];
    const a = c - h, b = c + h;
    if (a < 0) return [[0, b], [a + N, N - 1]];
    if (b > N - 1) return [[a, N - 1], [0, b - N]];
    return [[a, b]];
  };
  // The density on every grid point, for drawing it through the whole cell: x, y, z and how strongly the point shows.
  // The points on the far faces repeat those on the near ones, so the cell looks the same from every side. Most of the
  // cell lies in the lowest tenth of the stored range, so the range is stretched before it is drawn.
  let cloud = null, cloudN = 0;
  if (D.vol && D.vol.sad) {
    const b = atob(D.vol.sad), M = N + 1, d = new Float32Array(M * M * M * 4);
    let o = 0;
    for (let k = 0; k < M; k++) for (let j = 0; j < M; j++) for (let i = 0; i < M; i++) {
      const v = b.charCodeAt(((k % N) * N + (j % N)) * N + (i % N)) / 255;
      d[o++] = i * V; d[o++] = j * V; d[o++] = k * V; d[o++] = Math.pow(Math.max(0, Math.min(1, (v - 0.03) / 0.47)), 0.7);
    }
    cloud = d; cloudN = M * M * M;
  }
  // the calcium atoms of the cell, and every hydrogen site of CaH6 on its faces with the links of the cage between them
  const CAS = []; for (let i = 0; i < 8; i++) CAS.push([(i & 1) * A, (i >> 1 & 1) * A, (i >> 2) * A]); CAS.push([A / 2, A / 2, A / 2]);
  const HS = [];
  for (const p of D.hsites3) {
    const alt = p.map((x) => (Math.abs(x) < 1e-6 ? [0, 1] : [x]));
    for (const x of alt[0]) for (const y of alt[1]) for (const z of alt[2]) HS.push([x * A, y * A, z * A]);
  }
  const CAGE = [];
  for (let i = 0; i < HS.length; i++) for (let j = i + 1; j < HS.length; j++) if (Math.abs(Math.hypot(HS[i][0] - HS[j][0], HS[i][1] - HS[j][1], HS[i][2] - HS[j][2]) - A / (2 * Math.SQRT2)) < 0.02) CAGE.push([HS[i], HS[j]]);

  // ---------- the page around the picture ----------
  const STEPS = [
    { name: 'Structure', dur: 1500,
      text: 'The ELF shows where electrons localize in bonds, lone pairs and the interstitial space of a lattice, but it requires a DFT calculation, which is too slow for screening thousands of candidates. ELFNet predicts the ELF from the crystal structure alone. The example is the calcium lattice of CaH<sub>6</sub> with the hydrogen removed. The cubic cell has a calcium atom at each corner and one at its center, and it repeats in every direction. Drag to turn it.',
      alt: 'A cubic cell in 3D with a calcium atom at each corner and one at its center.' },
    { name: 'Density', dur: 2200,
      text: 'The densities of the free atoms are first summed on a grid over the cell. This superposed atomic density (SAD) requires no quantum calculation, only the atomic positions and a table of atomic densities. The grid, with ' + N + ' points along each edge here, is the only input to the network. Each dot is one grid point, and it is larger and bluer where the density is higher.',
      alt: 'The cell fills with a grid of dots for the superposed atomic density: dense blue clouds around each calcium atom, faint dots between them.' },
    { name: 'Convolve', dur: 2400,
      text: 'The network is built from 3D convolutions. Each convolution updates every grid point from the 5 × 5 × 5 block of points around it. Where the block extends past a face of the cell, it wraps around to the opposite face because the crystal is periodic. The orange dots are the points of one block. Drag it to a face or a corner.',
      alt: 'A small cube of five by five by five grid points, drawn in orange, sticks out through one face of the cell. The part that sticks out reappears at the opposite face.' },
    { name: 'Stack', dur: 4400,
      text: 'Sixteen residual blocks follow, each with two convolutions, with an attention block after every fourth. The grid keeps its size throughout. Each block extends the range of points that influence a given point, and in this cell four blocks are enough to cover all of it.',
      alt: 'The grid points that influence one point turn orange block by block: the region grows, wraps around the faces, and fills the whole cell.' },
    { name: 'Read out', dur: 2400,
      text: 'A final convolution and a sigmoid convert the 32 values at each grid point into one value between 0 and 1. This is the predicted ELF on the same grid as the input. The map shows it on a plane through the middle of the cell, and the yellow isosurface is at ' + ISO + '. The whole prediction is a single pass through the network.',
      alt: 'The dots of the density give way to a map of the predicted electron localization function on a plane through the middle of the cell, and a yellow isosurface appears in the cell.' },
    { name: 'Compare', dur: 1300,
      text: 'ELFNet is on the left of the line and the DFT calculation of the same lattice is on the right. Between the atoms both show the same network of high ELF, and the small spheres mark the hydrogen positions of CaH<sub>6</sub> on it. The two differ close to the nuclei. ELFNet was trained on 326,009 structures from about −50 to 500 GPa, and according to the paper the workflow is about 345 times faster than computing the ELF with VASP.',
      alt: 'The cell with a line across the picture: the ELFNet prediction on the left and the DFT calculation on the right, and small spheres at the hydrogen sites of CaH6.' },
    // a slide after the steps drawn here: the two calculations side by side, as views that turn together (fig-elfnet)
    { name: 'Side by side', dur: 1500,
      text: 'ELFNet (left) and DFT (right) are shown in full, side by side. Turning either view turns the other. In both, the yellow isosurface encloses the hydrogen sites of CaH<sub>6</sub>, which are drawn as small spheres. ELFNet is intended for this kind of fast first screening of many metal lattices, such as hosts for new superhydrides, before any DFT calculation.',
      slide: { fig: 'fig-elfnet', pick: [0, 0] } }
  ];
  let strip = '<span class="b" data-k="stem">Stem</span>';
  for (let i = 1; i <= BLOCKS; i++) strip += '<i class="rb"></i>' + (i % EVERY === 0 ? '<i class="at"></i>' : '');
  strip += '<span class="b" data-k="post">Post</span><span class="b" data-k="head">Head</span>';

  window.LP_scheme(host, {
    label: 'How ELFNet works', steps: STEPS, hint: 'drag to turn', hintFrom: 0,
    title: 'How ELFNet predicts an ELF map from a crystal structure.', cite: cite,
    stage: '<canvas class="gl" tabindex="0" role="img"></canvas><canvas class="ov" aria-hidden="true"></canvas>' +
      '<div class="sch-net" aria-hidden="true" hidden>' + strip + '</div>' +
      '<div class="sch-read" hidden><canvas class="sig" aria-hidden="true"></canvas><div><p class="k"></p><p class="v"></p></div></div>' +
      '<div class="wipe sch-wipe" role="slider" tabindex="0" aria-label="Line between the ELFNet prediction and the DFT calculation" aria-valuemin="0" aria-valuemax="100" hidden><i></i><b></b><span class="l">ELFNET</span><span class="r">DFT</span></div>' +
      '<button type="button" class="sch-q" aria-label="Grid point. Drag it, or move it with the arrow keys." hidden></button>',
    legend: '<span><i style="background:#5E93B8"></i>Ca</span><span><em class="lg-k"></em>5 × 5 × 5 block</span><span><i style="background:#DAE0E8"></i>H site of CaH₆</span>' +
      '<span class="lg-sad">density, low<b></b>high</span><span class="lg-elf">ELF 0<b></b>' + VMAX + '</span><span><i class="iso"></i>ELF ' + ISO + '</span>',
    spec: '<b>Ca lattice of CaH<sub>6</sub></b> · <i>a</i> = ' + A.toFixed(3) + ' Å · the ELF map is the plane through the middle of the cell · density and ELFNet on a ' + N + '×' + N + '×' + N + ' grid, DFT on ' + ND + '×' + ND + '×' + ND + ' · FlatResNet3D, 4,232,989 parameters. The fields are real, and the drawings of the network are schematic.',
    make: (api) => {
      const st = api.st, on = api.on, smooth = api.smooth, put = api.put, $ = api.$, $$ = api.$$, stage = api.stage, reduced = api.reduced;
      Object.assign(st, { f: [N - 1, 12], moved: false, split: 0.56, wipeTo: 0.56, wipeHeld: false });
      window.LP_SCHEME2 = st;   // for checking the page from the console
      let cv = $('canvas.gl'), saved = null;   // the canvas is replaced when the figure sleeps; saved: the view it had
      const ov = $('canvas.ov'), netEl = $('.sch-net'), read = $('.sch-read'), sig = $('canvas.sig'), wipeEl = $('.sch-wipe'), qEl = $('.sch-q'), hint = $('.hint');
      const readK = $('.k', read), readV = $('.v', read), netParts = $$('.sch-net > *');
      const scenes = {};   // the isosurfaces come from the cah6_ca_* scenes
      let eng = null, dragging = false;

      // the view: from the front, turned to the side and seen a little from above
      const view = (() => {
        const yaw = 0.52, pitch = 0.42, cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
        const X0 = [1, 0, 0], Y0 = [0, 0, 1], Z0 = [0, -1, 0];
        const x = X0.map((_, i) => cy * X0[i] + sy * Z0[i]), z1 = X0.map((_, i) => -sy * X0[i] + cy * Z0[i]);
        const y = Y0.map((_, i) => cp * Y0[i] - sp * z1[i]), z = Y0.map((_, i) => sp * Y0[i] + cp * z1[i]);
        return [x, y, z];
      })();
      const layout = () => {
        const W = stage.clientWidth, H = stage.clientHeight;
        if (W < 2 || H < 2) return false;
        stage.classList.toggle('narrow', W < 520);
        if (!eng) {
          eng = new Stage3D(W, H, { center: [A / 2, A / 2, A / 2], radius: 4.7, width: 9.4, aspect: 1.4, view: view, axes: [[A, 0, 0], [0, A, 0], [0, 0, A]] });
          eng.attach(undefined, ov); eng.attach(cv);
          if (saved && saved.M) { eng.M = saved.M; eng.zoom = saved.zoom; eng.dirty = true; }
          if (eng.status === 'nogl') { api.dead = true; api.giveBack(); host.removeAttribute('data-view'); host.innerHTML = ''; if (window.LP_flat2) window.LP_flat2(); return false; }   // no WebGL after all: the flat version
          eng.paint = paint;
          if (window.LP_loadScene) for (const id of ['cah6_ca_elfnet', 'cah6_ca_dft']) window.LP_loadScene(id, (d) => { scenes[id] = Object.assign({}, d); api.kick(); }, () => {});
        } else eng.resize(W, H);
        eng.triX = W - 44; eng.triY = 62;
        return true;
      };
      // the point on screen: during the entrance of "Convolve" it slides from the middle of the cell to where it will sit
      const focus = () => {
        if (st.step === 2 && st.t < 1 && !st.moved) { const e = smooth((st.t - 0.12) / 0.5); return [N / 2 + (st.f[0] - N / 2) * e, N / 2 + (st.f[1] - N / 2) * e]; }
        return st.f;
      };
      // how many residual blocks the picture of "Stack" has reached, as a number that grows smoothly
      const depth = () => (st.step > 3 ? BLOCKS : st.step < 3 ? 0 : st.t < 0.6 ? 4 * st.t / 0.6 : 4 + 12 * (st.t - 0.6) / 0.4);
      const P = (i, j, k) => [i * V, j * V, k * V];   // where grid point (i, j, k) is

      // ---------- one frame ----------
      const paint = (g) => {
        const k = st.step, t = st.t, f = focus(), fi = Math.round(f[0]), fj = Math.round(f[1]);
        const sadA = on(1, 0.2, 0.85), elfA = on(4, 0.1, 0.6), small = on(1, 0.1, 0.4), surfA = on(4, 0.5, 1), ha = on(5, 0.35, 0.8), pa = on(2, 0, 0.15);
        const dotted = !!(cloud && g.gridP);   // the density is drawn on the whole grid; without it, on the plane only
        g.solid();
        g.box([0, 0, 0], [A, A, A], INK, 0, 0.9 * on(0, 0, 0.3));
        // the calcium atoms: spheres at first, smaller once the map is there
        CAS.forEach((p, i) => {
          const pop = k > 0 ? 1 : smooth((t - 0.07 * i) / 0.4);
          if (pop > 0) g.sphere(p, (R_BALL + (R_DOT - R_BALL) * small) * (0.6 + 0.4 * pop), mix(CA, WHITE, 1 - pop));
        });
        // where the hydrogens of CaH6 sit, and the cage they make
        if (ha > 0) {
          for (const p of HS) g.sphere(p, 0.105 * ha, HY);
          for (const e of CAGE) g.rod(e[0], e[1], 0.032 * ha, HY);
        }
        // the grid point being followed
        if (pa > 0) g.sphere(P(f[0], f[1], KZ), 0.085 * pa, ORANGE);

        // the map on the plane through the middle of the cell: the density, then the ELF; fainter where the cell repeats around it
        const m = 0.26 * A, o = [-m, -m, ZC], eu = [A + 2 * m, 0, 0], ev = [0, A + 2 * m, 0], uv0 = [-m / A, -m / A], uv1 = [1 + m / A, 1 + m / A];
        const plate = (a, b, mixAB, alpha) => g.map(o, eu, ev, uv0, uv1, { a: g.texture(a, tile(a), true), b: g.texture(b, tile(b), true), mix: mixAB, alpha: alpha, grid: g.texture('grid', tile('grid'), true),
          gridAlpha: on(1, 0, 0.3) * (0.55 - 0.33 * elfA) * (stage.classList.contains('narrow') ? 0.6 : 1), inside: [0, 0, 1, 1], outside: 0.3, depth: true });
        const surface = (id, a) => { const sc = scenes[id]; if (sc && a > 0) g.surface(g.meshOf(sc), sc.planes, YELLOW, a); };
        if (sadA > 0) {
          if (k === 5) {
            g.between(0, st.split); plate('net', 'net', 0, 1); surface('cah6_ca_elfnet', 0.5);
            g.between(st.split, 1); plate('dft', 'dft', 0, 1); surface('cah6_ca_dft', 0.5);
            g.everywhere();
          } else if (dotted) { if (elfA > 0) plate('net', 'net', 0, elfA); surface('cah6_ca_elfnet', 0.5 * surfA); }
          else { plate('sad', 'net', elfA, sadA); surface('cah6_ca_elfnet', 0.5 * surfA); }
        }
        // The density on its grid: a dot at every grid point, larger and bluer where the density is higher. The points
        // that feed the grid point being followed are orange: its 5 x 5 x 5 block, then all that the stack has reached.
        const dotA = dotted ? on(1, 0.05, 0.3) * (1 - elfA) : 0;
        if (dotA > 0) {
          // the wider the reach, the fainter its points, so that a reach that fills the cell still shows what is inside
          const h = k === 2 ? KH : k === 3 ? Math.floor(KH + 4 * depth()) : -1, wide = Math.min(1, (2 * h + 1) / N);
          g.grid('sad', cloud, cloudN, { size: g.scale() * V * 0.92, show: on(1, 0.1, 0.95), alpha: dotA, step: V, period: N, low: [0.70, 0.77, 0.88], high: [0.13, 0.36, 0.70],
            box: [fi, fj, KZ, h], boxColor: ORANGE, boxAlpha: k === 2 ? on(2, 0, 0.18) : 1, boxMin: 0.8 - 0.68 * Math.pow(wide, 0.7) });
        }

        // the region that influences the point: a 5 x 5 x 5 block at "Convolve", then wider with every residual block
        if (k === 2 || k === 3) {
          const h = k === 2 ? KH : Math.floor(KH + 4 * depth()), a = k === 2 ? on(2, 0, 0.18) : 1, whole = 2 * h + 1 >= N;
          for (const ax of spans(fi, h)) for (const ay of spans(fj, h)) for (const az of spans(KZ, h)) {
            g.box([(ax[0] - 0.5) * V, (ay[0] - 0.5) * V, (az[0] - 0.5) * V], [(ax[1] + 0.5) * V, (ay[1] + 0.5) * V, (az[1] + 0.5) * V], ORANGE, (dotted ? 0.05 : whole ? 0.07 : 0.17) * a, 0.9 * a);
          }
          if (k === 2) {
            // the block as the convolution sees it, sticking out through the face, and an arc to where those points really are
            const lo = [(f[0] - KH - 0.5) * V, (f[1] - KH - 0.5) * V, (KZ - KH - 0.5) * V], hi = [(f[0] + KH + 0.5) * V, (f[1] + KH + 0.5) * V, (KZ + KH + 0.5) * V];
            g.box(lo, hi, ORANGE, 0, 0.45 * a);
            if (t >= 1 || st.moved) {
              const arc = (from, to) => {
                const pts = [], top = ZC + 0.62 * A;
                for (let s = 0; s <= 28; s++) { const u = s / 28, w = 2 * u * (1 - u); pts.push(from[0] + (to[0] - from[0]) * u, from[1] + (to[1] - from[1]) * u, (1 - u) * (1 - u) * from[2] + w * (2 * top - (from[2] + to[2]) / 2) + u * u * to[2]); }
                g.path(pts, mix(ORANGE, INK, 0.15), 0.95);
                const n = pts.length; g.solid(); g.cone([pts[n - 9], pts[n - 8], pts[n - 7]], [to[0], to[1], to[2]], 0.055, mix(ORANGE, INK, 0.15));
              };
              const zt = (KZ + KH + 0.5) * V;
              if (fi + KH > N - 1) arc([(N + (fi + KH - N) / 2) * V, f[1] * V, zt], [(fi + KH - N) / 2 * V, f[1] * V, zt]);
              if (fi - KH < 0) arc([((fi - KH - 1) / 2) * V, f[1] * V, zt], [(N - 1 + (fi - KH + 1) / 2) * V, f[1] * V, zt]);
              if (fj + KH > N - 1) arc([f[0] * V, (N + (fj + KH - N) / 2) * V, zt], [f[0] * V, (fj + KH - N) / 2 * V, zt]);
              if (fj - KH < 0) arc([f[0] * V, ((fj - KH - 1) / 2) * V, zt], [f[0] * V, (N - 1 + (fj - KH + 1) / 2) * V, zt]);
            }
          }
        }
      };

      // the small plot beside the value: the last stage of the network, a sigmoid, with the point's value on it
      const drawSig = (val) => {
        const w = 104, h = 54, d = Math.min(2, window.devicePixelRatio || 1), SANS = '"Inter", system-ui, sans-serif';
        if (sig.width !== w * d) { sig.width = w * d; sig.height = h * d; }
        const x = sig.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, w, h);
        const px = (z) => 6 + (z + 6) / 12 * (w - 12), py = (v) => h - 8 - v * (h - 16);
        x.strokeStyle = '#D6D2C6'; x.lineWidth = 1; x.setLineDash([2, 3]);
        x.beginPath(); x.moveTo(6, py(0)); x.lineTo(w - 6, py(0)); x.moveTo(6, py(1)); x.lineTo(w - 6, py(1)); x.stroke(); x.setLineDash([]);
        x.strokeStyle = '#1A1915'; x.lineWidth = 1.6; x.beginPath();
        for (let i = 0; i <= 48; i++) { const z = -6 + i / 4; if (i) x.lineTo(px(z), py(1 / (1 + Math.exp(-z)))); else x.moveTo(px(z), py(1 / (1 + Math.exp(-z)))); }
        x.stroke();
        const v = Math.max(0.003, Math.min(0.997, val)), z = Math.log(v / (1 - v));
        x.fillStyle = '#DE6828'; x.strokeStyle = '#FFFFFF'; x.lineWidth = 1.5; x.beginPath(); x.arc(px(z), py(v), 4.6, 0, 6.2832); x.fill(); x.stroke();
        x.fillStyle = '#8A867C'; x.font = '500 9.5px ' + SANS; x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillText('1', 1, py(1) + 0.5); x.fillText('0', 1, py(0) + 0.5);
      };

      const live = () => {
        const k = st.step, fi = st.f[0], fj = st.f[1];
        let note = '';
        if (k === 0) note = 'the calcium lattice of CaH<sub>6</sub>, one cell';
        else if (k === 1) note = 'superposed atomic density on a ' + N + ' × ' + N + ' × ' + N + ' grid';
        else if (k === 2) {
          let out = 0;
          for (let i = fi - KH; i <= fi + KH; i++) for (let j = fj - KH; j <= fj + KH; j++) if (i < 0 || i > N - 1 || j < 0 || j > N - 1) out += 2 * KH + 1;
          note = out ? '<b>' + out + '</b> of the 125 points of this block come from across a face' : 'here the block lies inside the cell';
        } else if (k === 3) {
          const d = Math.min(BLOCKS, Math.floor(depth() + 1e-6)), h = KH + 4 * d;
          note = (d ? 'after block <b>' + d + '</b>' : 'after the first convolution') + ': reach of ' + h + ' points, ' + (h * V).toFixed(1) + ' Å' + (2 * h + 1 >= N ? ' · the whole cell' : '');
        } else if (k === 4) note = 'the same ' + N + ' × ' + N + ' × ' + N + ' grid as the input';
        else note = 'at the hydrogen sites: ELFNet <b>' + D.atSite.elfnet.toFixed(2) + '</b>, DFT <b>' + D.atSite.dft.toFixed(2) + '</b>';
        put(api.info, '<span>' + note + '</span>');
        // the strip of blocks: the stem, sixteen residual blocks with attention after every fourth, the post block and the head
        const d = k < 2 ? -1 : k === 2 ? 0 : k === 3 ? Math.floor(depth() + 1e-6) : BLOCKS, lit = d < 0 ? 0 : 1 + d + Math.floor(d / EVERY) + (k >= 4 ? 2 : 0);
        netParts.forEach((el, i) => el.classList.toggle('on', i < lit));
        if (k >= 4) {
          const e = F.net[fj * N + fi], r = sample('dft', fi / N, fj / N);
          put(readK, k === 5 ? 'ELF at the point · ELFNet, DFT' : 'ELF at the point');
          put(readV, k === 5 ? e.toFixed(3) + ' · ' + r.toFixed(3) : e.toFixed(3));
          if (!stage.classList.contains('narrow')) drawSig(e);
        }
        if (eng && eng.M) { const f = focus(), p = eng.screen(P(f[0], f[1], KZ)); qEl.style.left = p[0] + 'px'; qEl.style.top = p[1] + 'px'; }
        wipeEl.style.left = (st.split * 100) + '%'; wipeEl.setAttribute('aria-valuenow', String(Math.round(st.split * 100)));
      };
      const sync = (k) => {
        cv.setAttribute('aria-label', 'How ELFNet works, step ' + (k + 1) + ' of ' + STEPS.length + ', ' + STEPS[k].name + '. ' + STEPS[k].alt);
        netEl.hidden = k < 2 || k > 4; read.hidden = k < 4; qEl.hidden = k < 2; wipeEl.hidden = k !== 5;
        hint.textContent = k < 2 ? 'drag to turn' : 'drag to turn · drag the point';
      };
      const enter = (k) => { if (k === 5) { st.split = reduced ? 0.56 : 1; st.wipeTo = 0.56; st.wipeHeld = false; } };
      const tick = (dt) => {
        let busy = dragging;
        if (st.step === 5 && Math.abs(st.split - st.wipeTo) > 0.001 && !st.wipeHeld) { st.split += (st.wipeTo - st.split) * Math.min(1, dt / 160); busy = true; wipeEl.style.left = (st.split * 100) + '%'; }
        if (eng && eng.dirty && eng.ptr.size > 0) busy = true;
        return busy;
      };
      const draw = () => { if (eng) eng.draw(); };

      // ---------- controls ----------
      // the grid point stays on the grid of the map's plane
      const setF = (i, j) => { st.f = [Math.max(0, Math.min(N - 1, Math.round(i))), Math.max(0, Math.min(N - 1, Math.round(j)))]; st.moved = true; api.touched(); live(); api.kick(); };
      const moveF = (e) => { const p = eng && eng.onPlane(e, [0, 0, ZC], [0, 0, 1]); if (p) setF(p[0] / V, p[1] / V); };
      qEl.addEventListener('pointerdown', (e) => { e.preventDefault(); dragging = true; try { qEl.setPointerCapture(e.pointerId); } catch (err) {} qEl.classList.add('on'); api.kick(); });
      qEl.addEventListener('pointermove', (e) => { if (dragging) moveF(e); });
      const drop = () => { dragging = false; qEl.classList.remove('on'); };
      qEl.addEventListener('pointerup', drop); qEl.addEventListener('pointercancel', drop);
      qEl.addEventListener('keydown', (e) => {
        const d = e.shiftKey ? 4 : 1, mv = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, d], ArrowDown: [0, -d] }[e.key]; if (!mv) return;
        e.preventDefault(); setF(st.f[0] + mv[0], st.f[1] + mv[1]);
      });
      // the picture turns when it is dragged; a click without a drag sends the grid point there
      let down = null;
      const onCv = (type, fn, opt) => stage.addEventListener(type, (e) => { if (e.target === cv) fn(e); }, opt);
      onCv('pointerdown', (e) => { if (!eng) return; api.touched(); down = [e.clientX, e.clientY]; eng.down(e); });
      onCv('pointermove', (e) => { if (!eng || !eng.ptr.size) return; eng.move(e); live(); api.kick(); });
      onCv('pointerup', (e) => { if (!eng) return; eng.up(e); if (down && st.step >= 2 && Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 4) moveF(e); down = null; });
      onCv('pointercancel', (e) => { if (eng) eng.up(e); down = null; });
      onCv('dblclick', () => { if (eng) { eng.resetView(); live(); api.kick(); } });
      onCv('keydown', (e) => { if (eng && eng.key(e)) { e.preventDefault(); live(); api.kick(); } });
      onCv('wheel', (e) => { if (eng && (e.ctrlKey || e.metaKey)) { e.preventDefault(); eng.zoomBy(Math.exp(-e.deltaY * 0.01)); live(); api.kick(); } }, { passive: false });
      // the line between ELFNet and DFT
      const dragWipe = (e) => { const r = stage.getBoundingClientRect(); st.split = st.wipeTo = Math.max(0.05, Math.min(0.95, (e.clientX - r.left) / r.width)); live(); api.kick(); };
      wipeEl.addEventListener('pointerdown', (e) => { e.preventDefault(); st.wipeHeld = true; try { wipeEl.setPointerCapture(e.pointerId); } catch (err) {} wipeEl.classList.add('on'); dragWipe(e); });
      wipeEl.addEventListener('pointermove', (e) => { if (wipeEl.classList.contains('on')) dragWipe(e); });
      const letGo = () => { wipeEl.classList.remove('on'); st.wipeHeld = false; };
      wipeEl.addEventListener('pointerup', letGo); wipeEl.addEventListener('pointercancel', letGo);
      wipeEl.addEventListener('keydown', (e) => {
        const d = e.key === 'ArrowLeft' ? -0.04 : e.key === 'ArrowRight' ? 0.04 : 0; if (!d) return;
        e.preventDefault(); st.split = st.wipeTo = Math.max(0.05, Math.min(0.95, st.split + d)); live(); api.kick();
      });
      // far from the screen or hidden: give the WebGL context back; layout() makes a new one on the way back
      const sleep = () => {
        if (!eng) return;
        saved = { M: eng.M ? eng.M.map((r) => r.slice()) : null, zoom: eng.zoom };
        cv = window.LP_freshCanvas ? window.LP_freshCanvas(cv, eng.gl) : cv;
        eng = null; dragging = false; down = null;
      };
      return { layout: layout, draw: draw, live: live, sync: sync, enter: enter, tick: tick, sleep: sleep };
    }
  });
})();
