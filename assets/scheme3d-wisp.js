/* How WISP works, in 3D: one step at a time, inside a piece of the MnPd crystal that can be turned.
   The atoms and their moments, the message passing, a query point with its 5 Å sphere and a line from every atom in it,
   the field the decoder returns on a plane through the crystal, the spin flip, and the comparison with DFT.
   The fields are the real ones (assets/wisp-plane.js) and so are the distances and the counts; the pictures of what
   happens inside the network are schematic. Where WebGL is missing, the flat version (scheme.js) is shown instead. */
(() => {
  'use strict';
  const host = document.getElementById('scheme-1'), D = window.LP_WISP;
  if (!host || !D || typeof Stage3D === 'undefined' || !window.LP_scheme || typeof WebGLRenderingContext === 'undefined') return;
  host.dataset.view = '3d';   // the flat version stands back
  const cite = window.LP_CITE ? window.LP_CITE('wisp') : '';
  const figN = (window.LP_FIGS || []).findIndex((f) => f.id === 'fig-wisp') + 1;

  // ---------- the crystal, in Å ----------
  const A = D.a, U = A * Math.SQRT2, V = A, N = D.n;     // cell edge; periods of the map's plane along [110] and [001]
  const CUT = 5, SEE = 6.3;                              // the cutoff; atoms are drawn a little beyond it, fading out
  const EU = [Math.SQRT1_2, Math.SQRT1_2, 0], EV = [0, 0, 1], EN = [Math.SQRT1_2, -Math.SQRT1_2, 0];   // the plane's two axes and its normal
  const P3 = (q) => [q[0] * EU[0], q[0] * EU[1], q[1]];  // a point of the plane, from its two coordinates
  const Q0 = [U / 2, 0];                                 // where the query point starts: between two Mn, below a Pd
  const SPECIES = [{ el: 'Mn', rgb: [0.627, 0.282, 0.612], m: D.moments[0] }, { el: 'Pd', rgb: [0.706, 0.722, 0.698], m: D.moments[1] }];
  const R_BALL = 0.44, R_DOT = 0.2, ARROW = 0.3;         // atom radius, its radius once the map shows, arrow length per μB beyond the atom
  const VMAX = 0.45, DMAX = 0.03;
  const TEAL = [0.043, 0.478, 0.502], GOLD = [0.851, 0.604, 0.106], NAVY = [0.153, 0.251, 0.486], WHITE = [1, 1, 1];
  const mix = (c, w, t) => [c[0] + (w[0] - c[0]) * t, c[1] + (w[1] - c[1]) * t, c[2] + (w[2] - c[2]) * t];
  const add = (p, d, k) => [p[0] + d[0] * k, p[1] + d[1] * k, p[2] + d[2] * k];

  const decode = (b64) => {
    const s = atob(b64), f = new Float32Array(N * N);
    for (let i = 0; i < N * N; i++) f[i] = (s.charCodeAt(2 * i) + 256 * s.charCodeAt(2 * i + 1)) / 65535;
    return f;
  };
  const F = { wisp: { up: decode(D.wisp.up), down: decode(D.wisp.down) }, dft: { up: decode(D.dft.up), down: decode(D.dft.down) }, diff: {} };
  for (const ch of ['up', 'down']) F.diff[ch] = F.wisp[ch].map((x, i) => Math.abs(x - F.dft[ch][i]));
  const cr = (p0, p1, p2, p3, t) => p1 + 0.5 * t * (p2 - p0 + t * (2 * p0 - 5 * p1 + 4 * p2 - p3 + t * (3 * (p1 - p2) + p3 - p0)));
  const wrap = (i) => ((i % N) + N) % N;
  const sample = (f, u, v) => {
    const x = u / U * N, y = v / V * N, i = Math.floor(x), k = Math.floor(y), tx = x - i, ty = y - k;
    const row = (kk) => { const o = wrap(kk) * N; return cr(f[o + wrap(i - 1)], f[o + wrap(i)], f[o + wrap(i + 1)], f[o + wrap(i + 2)], tx); };
    return Math.max(0, Math.min(1, cr(row(k - 1), row(k), row(k + 1), row(k + 2), ty)));
  };
  const elfColor = (t) => {
    t = Math.max(0, Math.min(1, t));
    let c;
    if (t < 0.25) c = [0, t / 0.25, 1]; else if (t < 0.5) c = [0, 1, 1 - (t - 0.25) / 0.25];
    else if (t < 0.75) c = [(t - 0.5) / 0.25, 1, 0]; else c = [1, 1 - (t - 0.75) / 0.25, 0];
    return c.map((x) => Math.round(255 * (x + (1 - x) * 0.26)));
  };
  const diffColor = (t) => {
    t = Math.max(0, Math.min(1, t));
    const a = [255, 255, 255], b = [242, 182, 50], c = [168, 34, 28];
    return t < 0.5 ? a.map((x, i) => Math.round(x + (b[i] - x) * t * 2)) : b.map((x, i) => Math.round(x + (c[i] - x) * (t - 0.5) * 2));
  };
  // one period of a field on the plane as a picture, 256 pixels each way, so that it can repeat as a texture
  const tiles = {};
  const tile = (key) => {
    if (tiles[key]) return tiles[key];
    const w = 256, c = document.createElement('canvas'), f = key.split(':').reduce((o, k) => o[k], F), isDiff = key.indexOf('diff') === 0;
    c.width = c.height = w;
    const g = c.getContext('2d'), img = g.createImageData(w, w), px = img.data, rows = new Float32Array(N * w);
    for (let x = 0; x < w; x++) { const gx = (x + 0.5) / w * N, i = Math.floor(gx), t = gx - i; for (let k = 0; k < N; k++) rows[k * w + x] = cr(f[k * N + wrap(i - 1)], f[k * N + wrap(i)], f[k * N + wrap(i + 1)], f[k * N + wrap(i + 2)], t); }
    for (let y = 0; y < w; y++) {
      const gy = (1 - (y + 0.5) / w) * N, k = Math.floor(gy), t = gy - k, r0 = wrap(k - 1) * w, r1 = wrap(k) * w, r2 = wrap(k + 1) * w, r3 = wrap(k + 2) * w;
      for (let x = 0; x < w; x++) {
        const v = cr(rows[r0 + x], rows[r1 + x], rows[r2 + x], rows[r3 + x], t), cc = isDiff ? diffColor(v / DMAX) : elfColor(v / VMAX), o = (y * w + x) * 4;
        px[o] = cc[0]; px[o + 1] = cc[1]; px[o + 2] = cc[2]; px[o + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    return (tiles[key] = c);
  };
  // the atoms of the crystal within reach of a point: Mn on the corners of every cell, Pd at its middle
  const around = (c, reach) => {
    const out = [], b = c.map((x) => Math.floor(x / A)), R = Math.ceil(reach / A) + 1;
    for (let i = b[0] - R; i <= b[0] + R; i++) for (let j = b[1] - R; j <= b[1] + R; j++) for (let k = b[2] - R; k <= b[2] + R; k++) {
      for (let sp = 0; sp < 2; sp++) {
        const h = sp ? 0.5 : 0, p = [(i + h) * A, (j + h) * A, (k + h) * A], d = Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]);
        if (d <= reach) out.push({ p: p, sp: sp, d: d });
      }
    }
    return out;
  };
  const count = (q) => around(P3(q), CUT).length;

  // ---------- the page around the picture ----------
  const STEPS = [
    { name: 'Structure', dur: 1900,
      text: 'WISP is given a crystal: which atoms it has, where they sit, the cell, and the magnetic moment on each atom. This is a piece of MnPd; the crystal goes on in every direction. The arrows are the moments, ' + D.moments[0].toFixed(2) + ' μ<sub>B</sub> on Mn and ' + D.moments[1].toFixed(2) + ' μ<sub>B</sub> on Pd. Drag to turn it.',
      alt: 'A piece of the MnPd crystal in 3D. A long arrow through each manganese and a very short one through each palladium show the magnetic moments.' },
    { name: 'Encode', dur: 3200,
      text: 'An equivariant network passes messages between atoms up to 5 Å apart, twice. Afterwards every atom holds a set of features that describe its surroundings. Some are plain numbers and some have a direction (<i>ℓ</i> = 0, 1, 2), so they turn when the crystal turns.',
      alt: 'Dots run along the links between neighboring atoms, twice, and each atom ends up with a shell around it.' },
    { name: 'Query', dur: 1900,
      text: 'Now I can ask about any point in the crystal, whether or not it lies on a grid. The point gathers the features of every atom within 5 Å, along with the direction to each one. Drag the point to try another place.',
      alt: 'A query point between the atoms, a sphere of radius 5 angstrom around it, and a line from every atom inside the sphere to the point.' },
    { name: 'Decode', dur: 3600,
      text: 'A small network combines what the point gathered into one number between 0 and 1: the ELF there. Asking at many points fills in the field, shown here on one plane through the crystal. This is the spin-up channel.',
      alt: 'Colored dots appear at many query points on a plane through the crystal and merge into a map of the spin-up electron localization function.' },
    { name: 'Flip spins', dur: 2000,
      text: 'For the other spin channel, the same network runs again with every moment reversed. Reversing the moments swaps the two channels exactly, because of how the network is built, so it never has to learn that. In MnPd the spin-down channel has a large region around Pd that the spin-up channel lacks.',
      alt: 'The moment arrows turn over and the map changes to the spin-down channel, which has a large region around each palladium atom.' },
    { name: 'Compare', dur: 1300,
      text: 'Left of the line is WISP, right of it the DFT calculation. MnPd was not in the training data. The mean difference here is ' + ((D.mae.up + D.mae.down) / 2).toFixed(3) + ' on the scale of 0 to 1, and 0.011 over all 21,922 test structures. Two parts are not shown: a branch for points with no atom within 5 Å, and a second network that predicts the moments when only the positions are known.' + (figN ? ' <a href="#fig-wisp">The figure below</a> has the same comparison with isosurfaces.' : ''),
      alt: 'The same map with a line across the picture: the WISP prediction on the left and the DFT calculation on the right. The two sides match.' }
  ];
  const GLYPHS = '<svg viewBox="0 0 46 16" width="46" height="16" aria-hidden="true"><g fill="#0B7A80"><circle cx="5" cy="8" r="3.2"/><ellipse cx="19" cy="4.4" rx="2.6" ry="3.4"/><ellipse cx="19" cy="11.6" rx="2.6" ry="3.4"/>' +
    '<g transform="translate(36 8) rotate(45)"><ellipse cx="0" cy="-4" rx="2.1" ry="3"/><ellipse cx="0" cy="4" rx="2.1" ry="3"/><ellipse cx="-4" cy="0" rx="3" ry="2.1"/><ellipse cx="4" cy="0" rx="3" ry="2.1"/></g></g></svg>';

  window.LP_scheme(host, {
    label: 'How WISP works', steps: STEPS, hint: 'drag to turn', hintFrom: 0,
    title: 'How WISP predicts where electrons localize, one step at a time.', cite: cite,
    stage: '<canvas class="gl" tabindex="0" role="img"></canvas><canvas class="ov" aria-hidden="true"></canvas>' +
      '<div class="states sch-chan" role="group" aria-label="Spin channel shown" hidden>' +
      '<button type="button" data-ch="up">Spin up · <i>m</i></button><button type="button" data-ch="down">Spin down · −<i>m</i></button><button type="button" data-diff aria-pressed="false" hidden>Difference</button></div>' +
      '<div class="sch-read" hidden><canvas class="sig" aria-hidden="true"></canvas><div><p class="k"></p><p class="v"></p></div></div>' +
      '<div class="wipe sch-wipe" role="slider" tabindex="0" aria-label="Line between the WISP prediction and the DFT calculation" aria-valuemin="0" aria-valuemax="100" hidden><i></i><b></b><span class="l">WISP</span><span class="r">DFT</span></div>' +
      '<button type="button" class="sch-q" aria-label="Query point. Drag it, or move it with the arrow keys." hidden><i>r</i></button>',
    legend: '<span><i style="background:#A0489C"></i>Mn</span><span><i style="background:#B4B8B2"></i>Pd</span>' +
      '<span><em class="lg-arrow"></em>moment</span><span><em class="lg-ring"></em>encoded atom</span><span><em class="lg-q"></em>query point</span>' +
      '<span class="lg-elf">ELF 0<b></b>' + VMAX + '</span><span class="lg-diff" hidden>|WISP − DFT| 0<b></b>' + DMAX + '</span>',
    spec: '<b>MnPd</b> · mp-1902 · <i>a</i> = ' + A.toFixed(3) + ' Å · the map is the (110) plane through Mn · fields on a ' + N + '×' + N + '×' + N + ' grid. The fields, distances and counts are real; the drawings of the network at work are schematic.',
    make: (api) => {
      const st = api.st, on = api.on, smooth = api.smooth, put = api.put, $ = api.$, $$ = api.$$, stage = api.stage, reduced = api.reduced;
      Object.assign(st, { q: Q0.slice(), flip: 0, flipTo: 0, diff: false, split: 0.62, wipeTo: 0.62, wipeHeld: false, touchedFlip: false });
      window.LP_SCHEME = st;   // for checking the page from the console
      const cv = $('canvas.gl'), ov = $('canvas.ov'), chan = $('.sch-chan'), read = $('.sch-read'), sig = $('canvas.sig'), wipeEl = $('.sch-wipe'), qEl = $('.sch-q'), hint = $('.hint');
      const readK = $('.k', read), readV = $('.v', read);
      let eng = null, scatter = null, dragging = false, cam = P3(Q0);

      // the view: the plane seen from the front, then turned a little to the side and from above
      const view = (() => {
        const yaw = -0.6, pitch = 0.36, cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
        const x = EU.map((_, i) => cy * EU[i] + sy * EN[i]), z1 = EU.map((_, i) => -sy * EU[i] + cy * EN[i]);
        const y = EV.map((_, i) => cp * EV[i] - sp * z1[i]), z = EV.map((_, i) => sp * EV[i] + cp * z1[i]);
        return [x, y, z];
      })();

      const layout = () => {
        const W = stage.clientWidth, H = stage.clientHeight;
        if (W < 2 || H < 2) return false;
        stage.classList.toggle('narrow', W < 520);
        if (!eng) {
          eng = new Stage3D(W, H, { center: P3(Q0), radius: 9.5, width: 16.4, aspect: 1.4, view: view, axes: [[A, 0, 0], [0, A, 0], [0, 0, A]], triad: false });
          eng.attach(undefined, ov); eng.attach(cv);
          if (eng.status === 'nogl') { api.dead = true; host.removeAttribute('data-view'); host.innerHTML = ''; if (window.LP_flat1) window.LP_flat1(); return false; }   // no WebGL after all: the flat version
          eng.paint = paint;
        } else eng.resize(W, H);
        return true;
      };

      // ---------- one frame ----------
      const paint = (g) => {
        const k = st.step, t = st.t, q3 = P3(st.q), c = g.d.center;
        const fld = on(3, 0.62, 1), small = on(3, 0, 0.14), qa = on(2, 0, 0.2), ringA = on(1, 0.84, 1), back = 1 - 0.55 * on(4, 0, 0.3);
        const grow = k === 2 ? 1 - Math.pow(1 - Math.max(0, Math.min(1, (t - 0.06) / 0.5)), 3) : k > 2 ? 1 : 0, reach = k === 2 ? smooth((t - 0.42) / 0.45) : k > 2 ? 1 : 0;
        const dir = [Math.cos(Math.PI * st.flip) * EV[0] + Math.sin(Math.PI * st.flip) * EN[0], Math.cos(Math.PI * st.flip) * EV[1] + Math.sin(Math.PI * st.flip) * EN[1], Math.cos(Math.PI * st.flip) * EV[2] + Math.sin(Math.PI * st.flip) * EN[2]];
        const atoms = around(qa > 0 ? q3 : c, SEE), r0 = R_BALL + (R_DOT - R_BALL) * small;
        g.solid();
        // atoms and their moments; beyond the cutoff they pale out, so the piece of crystal has no hard edge
        for (const a of atoms) {
          const pop = k > 0 ? 1 : smooth((t - Math.min(0.42, a.d / 15)) / 0.3);
          if (pop <= 0) continue;
          // far: 0 inside the cutoff, 1 at the edge of what is drawn; out: outside the sphere of the query once there is one
          const sp = SPECIES[a.sp], far = smooth((a.d - CUT) / (SEE - CUT)), out = qa * (a.d > CUT ? 1 : 0), pale = Math.min(0.88, 0.8 * far + 0.5 * out);
          const r = r0 * (0.6 + 0.4 * pop) * (1 - 0.62 * far) * (1 - 0.3 * out);
          g.sphere(a.p, r, mix(sp.rgb, WHITE, pale));
          const grown = k > 0 ? 1 : smooth((t - 0.5) / 0.45);
          if (grown > 0 && pale < 0.8) g.arrow(a.p, dir, (2 * r + ARROW * sp.m * (1 - 0.6 * far)) * grown, (sp.m > 1 ? 0.045 : 0.03) * (1 - 0.5 * far), mix(NAVY, WHITE, pale));
        }
        // message passing: the links between neighbors (each Pd to the eight Mn around it)
        const la = (k === 1 ? smooth(t / 0.08) : k === 2 ? 1 - smooth(t / 0.3) : 0);
        if (la > 0) {
          const h = A / 2, pulses = [];
          for (const a of atoms) if (a.sp === 1) for (let m = 0; m < 8; m++) {
            const b = [a.p[0] + (m & 1 ? h : -h), a.p[1] + (m & 2 ? h : -h), a.p[2] + (m & 4 ? h : -h)], db = Math.hypot(b[0] - c[0], b[1] - c[1], b[2] - c[2]);
            if (db > SEE) continue;
            const pale = 1 - la * 0.75 * (1 - smooth((Math.max(a.d, db) - CUT + 0.4) / (SEE - CUT)));
            g.rod(a.p, b, 0.018, mix(TEAL, WHITE, pale));
            if (k === 1 && t < 1) for (let w = 0; w < 2; w++) {
              const p = (t - 0.06 - 0.43 * w) / 0.42; if (p <= 0 || p >= 1) continue;
              const e = smooth(Math.min(1, p / 0.7)), f = w ? b : a.p, to = w ? a.p : b;
              pulses.push(f[0] + (to[0] - f[0]) * e, f[1] + (to[1] - f[1]) * e, f[2] + (to[2] - f[2]) * e, TEAL[0], TEAL[1], TEAL[2]);
            }
          }
          if (pulses.length) { const key = 'pulse'; if (g.bufs[key]) { g.gl.deleteBuffer(g.bufs[key]); delete g.bufs[key]; } g.dots(key, new Float32Array(pulses), pulses.length / 6, 5.5, 0.95); }
        }
        // the query: a line from every atom inside the cutoff, teal at the atom and gold at the point
        if (qa > 0 && reach > 0) for (const a of atoms) {
          if (a.d > CUT) continue;
          const al = reach * smooth((CUT - a.d) / 0.5) * (1 - 0.3 * fld) * back, s0 = Math.min(0.9, (r0 + 0.04) / a.d);
          const from = [a.p[0] + (q3[0] - a.p[0]) * s0, a.p[1] + (q3[1] - a.p[1]) * s0, a.p[2] + (q3[2] - a.p[2]) * s0], mid = [(from[0] + q3[0]) / 2, (from[1] + q3[1]) / 2, (from[2] + q3[2]) / 2];
          g.rod(from, mid, 0.026, mix(TEAL, WHITE, 1 - al)); g.rod(mid, q3, 0.026, mix(GOLD, WHITE, 1 - al));
        }
        if (qa > 0) g.sphere(q3, 0.2 * (k === 2 ? 1 + 0.5 * (1 - smooth(t / 0.25)) : 1), mix(GOLD, WHITE, 1 - qa));

        // the field on the plane: WISP, or WISP left of the line and DFT right of it, or their difference
        if (k >= 3 && fld > 0) {
          const cu = c[0] * EU[0] + c[1] * EU[1] + c[2] * EU[2], cv2 = c[2], R = 7.2;
          const o = add(add(P3([cu, cv2]), EU, -R), EV, -R), eu = EU.map((x) => x * 2 * R), ev = EV.map((x) => x * 2 * R);
          const uv0 = [(cu - R) / U, (cv2 - R) / V], uv1 = [(cu + R) / U, (cv2 + R) / V];
          const show = (src) => g.map(o, eu, ev, uv0, uv1, { a: g.texture(src + ':up', tile(src + ':up'), true), b: g.texture(src + ':down', tile(src + ':down'), true), mix: st.flip, alpha: fld, fadeCenter: q3, fade: [CUT + 0.1, SEE + 0.5] });
          if (k === 5 && st.diff) show('diff');
          else if (k === 5) { g.between(0, st.split); show('wisp'); g.between(st.split, 1); show('dft'); g.everywhere(); }
          else show('wisp');
        }
        // query points appear one by one, then faster, each already in the color of the value WISP returns there
        if (k === 3 && fld < 1) {
          if (!scatter) {
            let seed = 20261119;
            const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let x = Math.imul(seed ^ seed >>> 15, 1 | seed); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; };
            const n = 2600, d = new Float32Array(n * 6);
            for (let i = 0; i < n; i++) {
              const rr = (SEE + 0.3) * Math.sqrt(rnd()), th = 6.2832 * rnd(), u = Q0[0] + rr * Math.cos(th), v = Q0[1] + rr * Math.sin(th), p = P3([u, v]), col = elfColor(sample(F.wisp.up, u, v) / VMAX);
              d.set([p[0], p[1], p[2], col[0] / 255, col[1] / 255, col[2] / 255], i * 6);
            }
            scatter = d;
          }
          const p = Math.max(0, Math.min(1, (t - 0.1) / 0.6)), n = Math.floor(2600 * Math.pow(p, 2.7));
          if (n > 0) g.dots('scatter', scatter, n, 9 - 4.5 * p, 1 - 0.85 * fld);
        }
        // see-through things last: the shell around each encoded atom, and the sphere of the cutoff
        if (ringA > 0) for (const a of atoms) {
          const far = smooth((a.d - CUT) / (SEE - CUT)), out = qa * (a.d > CUT ? 1 : 0);
          if (far < 0.9 && out < 0.5) g.shell(a.p, r0 * (1 - 0.62 * far) + 0.075, TEAL, 0.55 * ringA * (1 - far) * (1 - 0.5 * small), 0.1, 2.2);
        }
        if (qa > 0) g.shell(q3, 0.42, GOLD, 0.55 * qa, 0.1, 1.6);
        if (qa > 0 && grow > 0) g.shell(q3, CUT * grow, GOLD, 0.42 * qa * back, 0.02, 3.0);
      };

      // the small plot beside the value: the last stage of the decoder, a sigmoid, with the point's value on it
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
        x.fillStyle = '#D99A1B'; x.strokeStyle = '#FFFFFF'; x.lineWidth = 1.5; x.beginPath(); x.arc(px(z), py(v), 4.6, 0, 6.2832); x.fill(); x.stroke();
        x.fillStyle = '#8A867C'; x.font = '500 9.5px ' + SANS; x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillText('1', 1, py(1) + 0.5); x.fillText('0', 1, py(0) + 0.5);
      };

      const chName = () => (st.flipTo ? 'down' : 'up');
      const live = () => {
        const k = st.step, ch = chName(), arrowCh = ch === 'up' ? '↑' : '↓';
        put(api.info, (k === 1 ? GLYPHS : '') + '<span>' + (k === 0 ? 'a piece of the MnPd crystal' :
          k === 1 ? 'each atom: features with <i>ℓ</i> = 0, 1, 2' :
          k < 4 ? '<b>' + count(st.q) + '</b> atoms within 5 Å of <i>r</i>' :
          k === 4 ? 'the same network, run with <i>m</i> and with −<i>m</i>' :
          st.diff ? 'where WISP and DFT differ, spin ' + ch : 'mean |WISP − DFT| in MnPd: <b>' + D.mae[ch].toFixed(4) + '</b> for spin ' + ch) + '</span>');
        if (k >= 3) {
          const w = sample(F.wisp[ch], st.q[0], st.q[1]), d = sample(F.dft[ch], st.q[0], st.q[1]);
          put(readK, k === 5 ? 'ELF<sub>' + arrowCh + '</sub>(<i>r</i>) · WISP, DFT' : 'ELF<sub>' + arrowCh + '</sub>(<i>r</i>)');
          put(readV, k === 5 ? w.toFixed(3) + ' · ' + d.toFixed(3) : w.toFixed(3));
          if (!stage.classList.contains('narrow')) drawSig(w);
        }
        if (eng && eng.M) { const p = eng.screen(P3(st.q)); qEl.style.left = p[0] + 'px'; qEl.style.top = p[1] + 'px'; }
        wipeEl.style.left = (st.split * 100) + '%'; wipeEl.setAttribute('aria-valuenow', String(Math.round(st.split * 100)));
      };
      const sync = (k) => {
        const ch = chName();
        cv.setAttribute('aria-label', 'How WISP works, step ' + (k + 1) + ' of ' + STEPS.length + ', ' + STEPS[k].name + '. ' + STEPS[k].alt);
        chan.hidden = k < 4; $('[data-diff]', chan).hidden = k !== 5;
        $$('[data-ch]', chan).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ch === ch)));
        $('[data-diff]', chan).setAttribute('aria-pressed', String(st.diff));
        read.hidden = k < 3; qEl.hidden = k < 2; wipeEl.hidden = !(k === 5 && !st.diff);
        $('.lg-diff').hidden = !(k === 5 && st.diff); $('.lg-elf').hidden = k === 5 && st.diff;
        hint.textContent = k < 2 ? 'drag to turn' : 'drag to turn · drag the point';
      };
      const enter = (k) => {
        st.touchedFlip = false;
        if (k === 3) st.flipTo = 0;       // the decoder's first answer is the spin-up channel
        if (k === 4) st.flipTo = 1;       // then the moments are reversed
        if (k < 3) st.flipTo = 0;
        if (k !== 5) st.diff = false;
        if (k === 5) { st.split = reduced ? 0.62 : 1; st.wipeTo = 0.62; st.wipeHeld = false; }
        if (reduced) st.flip = k >= 4 ? st.flipTo : 0;
      };
      // what moves on its own: the flip follows its target, the line slides to its place, the view follows the point
      const tick = (dt) => {
        let busy = dragging;
        const target = st.step >= 4 ? (st.step === 4 && st.t < 0.12 && !st.touchedFlip ? 0 : st.flipTo) : 0;
        if (Math.abs(st.flip - target) > 0.001) { const d = dt / 700; st.flip += Math.max(-d, Math.min(d, target - st.flip)); busy = true; } else st.flip = target;
        if (st.step === 5 && Math.abs(st.split - st.wipeTo) > 0.001 && !st.wipeHeld) { st.split += (st.wipeTo - st.split) * Math.min(1, dt / 160); busy = true; wipeEl.style.left = (st.split * 100) + '%'; }
        if (eng) {
          const to = P3(st.q), c = eng.d.center, far = Math.hypot(to[0] - c[0], to[1] - c[1], to[2] - c[2]);
          if (far > 0.002) { const f = reduced ? 1 : Math.min(1, dt / 220); for (let i = 0; i < 3; i++) c[i] += (to[i] - c[i]) * f; busy = true; live(); }
          if (eng.dirty) busy = busy || eng.ptr.size > 0;
        }
        return busy;
      };
      const draw = () => { if (eng) eng.draw(); };

      // ---------- controls ----------
      chan.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.ch) { st.flipTo = b.dataset.ch === 'down' ? 1 : 0; st.touchedFlip = true; } else st.diff = !st.diff;
        api.sync(); api.kick();
      });
      // the query point stays on the map's plane, within one period of the crystal around where it started
      const setQ = (u, v) => {
        st.q = [Math.max(Q0[0] - U / 2, Math.min(Q0[0] + U / 2, u)), Math.max(Q0[1] - V / 2, Math.min(Q0[1] + V / 2, v))];
        api.touched(); live(); api.kick();
      };
      const moveQ = (e) => { const p = eng && eng.onPlane(e, [0, 0, 0], EN); if (p) setQ(p[0] * EU[0] + p[1] * EU[1], p[2]); };
      qEl.addEventListener('pointerdown', (e) => { e.preventDefault(); dragging = true; try { qEl.setPointerCapture(e.pointerId); } catch (err) {} qEl.classList.add('on'); api.kick(); });
      qEl.addEventListener('pointermove', (e) => { if (dragging) moveQ(e); });
      const drop = () => { dragging = false; qEl.classList.remove('on'); };
      qEl.addEventListener('pointerup', drop); qEl.addEventListener('pointercancel', drop);
      qEl.addEventListener('keydown', (e) => {
        const d = e.shiftKey ? 0.5 : 0.1, m = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, d], ArrowDown: [0, -d] }[e.key]; if (!m) return;
        e.preventDefault(); setQ(st.q[0] + m[0], st.q[1] + m[1]);
      });
      // the picture turns when it is dragged; a click without a drag sends the query point there
      let down = null;
      cv.addEventListener('pointerdown', (e) => { if (!eng) return; api.touched(); down = [e.clientX, e.clientY]; eng.down(e); });
      cv.addEventListener('pointermove', (e) => { if (!eng || !eng.ptr.size) return; eng.move(e); live(); api.kick(); });
      cv.addEventListener('pointerup', (e) => { if (!eng) return; eng.up(e); if (down && st.step >= 2 && Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 4) moveQ(e); down = null; });
      cv.addEventListener('pointercancel', (e) => { if (eng) eng.up(e); down = null; });
      cv.addEventListener('dblclick', () => { if (eng) { eng.resetView(); live(); api.kick(); } });
      cv.addEventListener('keydown', (e) => { if (eng && eng.key(e)) { e.preventDefault(); live(); api.kick(); } });
      cv.addEventListener('wheel', (e) => { if (eng && (e.ctrlKey || e.metaKey)) { e.preventDefault(); eng.zoomBy(Math.exp(-e.deltaY * 0.01)); live(); api.kick(); } }, { passive: false });
      // the line between WISP and DFT
      const dragWipe = (e) => { const r = stage.getBoundingClientRect(); st.split = st.wipeTo = Math.max(0.05, Math.min(0.95, (e.clientX - r.left) / r.width)); live(); api.kick(); };
      wipeEl.addEventListener('pointerdown', (e) => { e.preventDefault(); st.wipeHeld = true; try { wipeEl.setPointerCapture(e.pointerId); } catch (err) {} wipeEl.classList.add('on'); dragWipe(e); });
      wipeEl.addEventListener('pointermove', (e) => { if (wipeEl.classList.contains('on')) dragWipe(e); });
      const letGo = () => { wipeEl.classList.remove('on'); st.wipeHeld = false; };
      wipeEl.addEventListener('pointerup', letGo); wipeEl.addEventListener('pointercancel', letGo);
      wipeEl.addEventListener('keydown', (e) => {
        const d = e.key === 'ArrowLeft' ? -0.04 : e.key === 'ArrowRight' ? 0.04 : 0; if (!d) return;
        e.preventDefault(); st.split = st.wipeTo = Math.max(0.05, Math.min(0.95, st.split + d)); live(); api.kick();
      });
      return { layout: layout, draw: draw, live: live, sync: sync, enter: enter, tick: tick };
    }
  });
})();
