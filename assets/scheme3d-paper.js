/* Step-by-step figures for the papers: the steps of the work, told in a 3D picture of the paper's own structures that
   can be turned. Each step shows one structure (a scene of the 3D figures), with or without its isosurface and colored
   cuts, and the picture moves from one step's structure to the next: atoms the two have in common stay, the rest shrink
   away or grow in. A step can also scatter the atoms and let them settle into place (a structure search, drawn
   schematically), put labels on points of the structure, or show a figure of the paper in place of the 3D picture.
   The steps of each paper are in assets/paper-steps.js. Without WebGL the steps show the paper's own figure instead. */
window.LP_paperScheme = (def) => {
  'use strict';
  const host = document.getElementById(def.id);
  if (!host || !window.LP_scheme) return null;
  const gl3d = typeof Stage3D !== 'undefined' && typeof WebGLRenderingContext !== 'undefined';
  host.dataset.view = gl3d ? '3d' : 'flat';
  const STEPS = def.steps;
  const cite = window.LP_CITE ? window.LP_CITE(def.cite) : '';
  const WHITE = [1, 1, 1], YELLOW = [0.98, 0.83, 0.22], LINE = [0.22, 0.22, 0.22];
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const sm = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const mix3 = (c, w, t) => [lerp(c[0], w[0], t), lerp(c[1], w[1], t), lerp(c[2], w[2], t)];
  const shotOf = (k) => (k >= 0 && k < STEPS.length ? STEPS[k].shot || {} : null);
  const scenes = {};                                                        // id -> the figures' own scene data
  const derive = def.derive || {};                                          // id -> a scene made from another one
  const want = Array.from(new Set(STEPS.map((s) => s.shot && s.shot.scene).filter(Boolean).map((id) => (derive[id] ? derive[id].from : id))));
  // A scene made from another: atoms added (each [x, y, z, element], bonded like the atoms of the same kinds in the
  // original) or taken away (by index), and with or without the original's field.
  const makeDerived = (id, base) => {
    const dv = derive[id], sp = base.species.slice(), atoms = base.atoms.filter((_, i) => !(dv.remove || []).includes(i)), keep = [];
    base.atoms.forEach((_, i) => { if (!(dv.remove || []).includes(i)) keep.push(i); });
    const newIndex = new Map(keep.map((oldI, newI) => [oldI, newI]));
    const bonds = (base.bonds || []).filter((b) => newIndex.has(b[0]) && newIndex.has(b[1])).map((b) => [newIndex.get(b[0]), newIndex.get(b[1])]);
    // the longest bond between each pair of elements in the original, to bond the added atoms the same way
    const longest = {};
    for (const b of base.bonds || []) {
      const p = base.atoms[b[0]], q = base.atoms[b[1]], key = [base.species[p[3]].el, base.species[q[3]].el].sort().join('-');
      longest[key] = Math.max(longest[key] || 0, Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]));
    }
    for (const a of dv.add || []) {
      let s = sp.findIndex((x) => x.el === a[3]);
      if (s < 0) { sp.push({ el: a[3], rgb: a[4] || [0.6, 0.6, 0.6], r: a[5] || 0.4 }); s = sp.length - 1; }
      const n = atoms.length; atoms.push([a[0], a[1], a[2], s]);
      atoms.forEach((q, j) => {
        if (j === n) return;
        const key = [a[3], sp[q[3]].el].sort().join('-'), L = longest[key];
        if (L && Math.hypot(q[0] - a[0], q[1] - a[1], q[2] - a[2]) < L + 0.05) bonds.push([j, n]);
      });
    }
    const d = Object.assign({}, base, { id: id, species: sp, atoms: atoms, bonds: bonds });
    if (dv.grid === false) { delete d.grid; d.faces = []; }
    return d;
  };

  // ---------- geometry ----------
  const cart = (sc, f) => { const L = sc.lattice; return [0, 1, 2].map((a) => f[0] * L[0][a] + f[1] * L[1][a] + f[2] * L[2][a]); };
  const turn = (M, ax, ay, ang) => {   // the engine's trackball turn: about the screen axis (ax, ay, 0)
    const l = Math.hypot(ax, ay); if (!l || !ang) return M;
    const x = ax / l, y = ay / l, c = Math.cos(ang), s = Math.sin(ang), C = 1 - c;
    const R = [[c + x * x * C, x * y * C, y * s], [x * y * C, c + y * y * C, -x * s], [-y * s, x * s, c]], out = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) out[i][j] = R[i][0] * M[0][j] + R[i][1] * M[1][j] + R[i][2] * M[2][j];
    return out;
  };
  // rotations as quaternions, so that the camera can glide from one view to the next
  const quatOf = (M) => {
    const t = M[0][0] + M[1][1] + M[2][2];
    let q;
    if (t > 0) { const s = Math.sqrt(t + 1) * 2; q = [0.25 * s, (M[2][1] - M[1][2]) / s, (M[0][2] - M[2][0]) / s, (M[1][0] - M[0][1]) / s]; }
    else if (M[0][0] > M[1][1] && M[0][0] > M[2][2]) { const s = Math.sqrt(1 + M[0][0] - M[1][1] - M[2][2]) * 2; q = [(M[2][1] - M[1][2]) / s, 0.25 * s, (M[0][1] + M[1][0]) / s, (M[0][2] + M[2][0]) / s]; }
    else if (M[1][1] > M[2][2]) { const s = Math.sqrt(1 + M[1][1] - M[0][0] - M[2][2]) * 2; q = [(M[0][2] - M[2][0]) / s, (M[0][1] + M[1][0]) / s, 0.25 * s, (M[1][2] + M[2][1]) / s]; }
    else { const s = Math.sqrt(1 + M[2][2] - M[0][0] - M[1][1]) * 2; q = [(M[1][0] - M[0][1]) / s, (M[0][2] + M[2][0]) / s, (M[1][2] + M[2][1]) / s, 0.25 * s]; }
    const l = Math.hypot(q[0], q[1], q[2], q[3]); return q.map((v) => v / l);
  };
  const matOf = (q) => {
    const [w, x, y, z] = q;
    return [[1 - 2 * (y * y + z * z), 2 * (x * y - w * z), 2 * (x * z + w * y)], [2 * (x * y + w * z), 1 - 2 * (x * x + z * z), 2 * (y * z - w * x)], [2 * (x * z - w * y), 2 * (y * z + w * x), 1 - 2 * (x * x + y * y)]];
  };
  const slerp = (a, b, t) => {
    let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
    if (d < 0) { b = b.map((v) => -v); d = -d; }
    if (d > 0.9995) { const q = a.map((v, i) => v + (b[i] - v) * t), l = Math.hypot(q[0], q[1], q[2], q[3]); return q.map((v) => v / l); }
    const th = Math.acos(d), s = Math.sin(th), wa = Math.sin((1 - t) * th) / s, wb = Math.sin(t * th) / s;
    return a.map((v, i) => wa * v + wb * b[i]);
  };
  // a shot's view: the scene's own, turned and moved closer as the step says
  const frameOf = (shot) => {
    const sc = scenes[shot.scene]; if (!sc) return null;
    const v = shot.view || {};
    let M = sc.view.map((r) => r.slice());
    (v.rot || []).forEach((r) => { M = turn(M, r[0], r[1], r[2] * Math.PI / 180); });
    return { center: v.center ? (v.center.length === 3 && v.frac ? cart(sc, v.center) : v.center) : sc.center.slice(), width: sc.width / (v.zoom || 1), radius: sc.radius, aspect: sc.aspect || 1.4, M: M };
  };

  // atoms two scenes have in common: same element, within 0.3 Å. For each atom of b, the index of its partner in a, or -1.
  const pairs = {};
  const match = (a, b) => {
    const key = a.id + '>' + b.id; if (pairs[key]) return pairs[key];
    const cell = 0.6, grid = new Map(), keyOf = (p) => Math.floor(p[0] / cell) + ',' + Math.floor(p[1] / cell) + ',' + Math.floor(p[2] / cell);
    a.atoms.forEach((p, i) => { const k = keyOf(p); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(i); });
    const used = new Set();
    const out = b.atoms.map((p) => {
      const el = b.species[p[3]].el, c = [0, 1, 2].map((x) => Math.floor(p[x] / cell));
      let best = -1, bd = 0.09;
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) {
        for (const ai of grid.get((c[0] + i) + ',' + (c[1] + j) + ',' + (c[2] + k)) || []) {
          const q = a.atoms[ai]; if (used.has(ai) || a.species[q[3]].el !== el) continue;
          const d2 = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2 + (q[2] - p[2]) ** 2;
          if (d2 < bd) { bd = d2; best = ai; }
        }
      }
      if (best >= 0) used.add(best);
      return best;
    });
    return (pairs[key] = out);
  };

  // how a shot shows one atom: s is its size (0 to 1), pale how far it has faded toward white
  const styleOf = (shot, sc, i) => {
    const el = sc.species[sc.atoms[i][3]].el;
    if (shot.only && shot.only.indexOf(el) < 0) return [0, 0];
    if (shot.hide && shot.hide.indexOf(i) >= 0) return [0, 0];
    if (shot.fade && (shot.fade.indexOf(el) >= 0 || shot.fade.indexOf(i) >= 0)) return [1, 0.72];
    if (shot.mark && shot.mark.length && shot.mark.indexOf(i) < 0 && shot.markFade) return [1, 0.72];
    return [1, 0];
  };
  // where a shot puts an atom: where the scene has it, or with `squeeze` the lattice drawn smaller about the scene's
  // center while each molecule (an atom and the one it is bonded to) keeps its shape
  const partners = {};
  const partnerOf = (sc) => {
    if (partners[sc.id]) return partners[sc.id];
    const q = new Int32Array(sc.atoms.length).fill(-1);
    for (const b of sc.bonds || []) { if (q[b[0]] < 0) q[b[0]] = b[1]; if (q[b[1]] < 0) q[b[1]] = b[0]; }
    return (partners[sc.id] = q);
  };
  const placeOf = (f, sc, i) => {   // f: how far the lattice is squeezed (1: not at all)
    const p = sc.atoms[i];
    if (!f || f === 1) return p;
    const s = f, c = sc.center, j = partnerOf(sc)[i], q = j >= 0 ? sc.atoms[j] : p;
    const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2];
    return [0, 1, 2].map((x) => c[x] + (m[x] - c[x]) * s + (p[x] - m[x]));
  };
  // a fixed random number for each atom and use, so a search looks the same every time
  const rnd = (i, k) => { let x = Math.imul(i * 7919 + k * 104729 + 12345, 2654435761) >>> 0; x ^= x >>> 15; x = Math.imul(x, 2246822519) >>> 0; x ^= x >>> 13; return (x >>> 0) / 4294967296; };

  // ---------- the page around the picture ----------
  const stageHTML = '<canvas class="gl" tabindex="0" role="img"></canvas><canvas class="ov" aria-hidden="true"></canvas>' +
    '<div class="pl-labels" aria-hidden="true"></div>' +
    '<figure class="pl-img" hidden><img alt="" decoding="async"><figcaption></figcaption></figure>';
  const api0 = window.LP_scheme(host, {
    label: def.label, steps: STEPS, hint: 'drag to turn', hintFrom: 0,
    title: def.title, cite: cite, stage: stageHTML, legend: def.legend, spec: def.spec,
    make: (api) => {
      const st = api.st, $ = api.$, stage = api.stage, reduced = api.reduced;
      let cv = $('canvas.gl'), saved = null, eng = null, from = -1, cur = -1, flat = !gl3d, cam = null;
      const ov = $('canvas.ov'), labelsEl = $('.pl-labels'), figEl = $('.pl-img'), figImg = $('img', figEl), figCap = $('figcaption', figEl);
      host.lpPaper = st;   // for checking the page from the console
      let labelEls = [];

      const loadAll = () => {
        if (!window.LP_loadScene) return;
        want.forEach((id) => {
          if (scenes[id]) return;
          window.LP_loadScene(id, (d) => {
            scenes[id] = d;
            for (const k in derive) if (derive[k].from === id && !scenes[k]) scenes[k] = makeDerived(k, d);
            const now = STEPS[st.step].shot.scene;
            if (!cam && eng && (now === id || (derive[now] && derive[now].from === id))) snap();
            api.kick();
          }, () => {});
        });
      };
      // put the camera straight on the current step's view
      const snap = () => {
        const f = frameOf(shotOf(st.step)); if (!f || !eng) return;
        Object.assign(eng.d, { center: f.center, width: f.width, radius: f.radius, aspect: f.aspect }); eng.M = f.M; eng.zoom = 1; eng.dirty = true;
      };
      const layout = () => {
        const W = stage.clientWidth, H = stage.clientHeight;
        if (W < 2 || H < 2) return false;
        stage.classList.toggle('narrow', W < 520);
        if (flat) { stage.classList.add('flat'); return true; }
        if (!eng) {
          const sc0 = scenes[STEPS[0].shot.scene];
          eng = new Stage3D(W, H, { center: sc0 ? sc0.center : [0, 0, 0], radius: sc0 ? sc0.radius : 6, width: sc0 ? sc0.width : 12, aspect: 1.4, view: sc0 ? sc0.view : [[1, 0, 0], [0, 1, 0], [0, 0, 1]], axes: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], triad: false });
          eng.attach(undefined, ov); eng.attach(cv);
          if (eng.status === 'nogl') { eng = null; flat = true; stage.classList.add('flat'); host.dataset.view = 'flat'; sync(st.step); return true; }
          eng.paint = paint;
          if (saved && saved.M) { Object.assign(eng.d, saved.d); eng.M = saved.M; eng.zoom = saved.zoom; } else snap();
          loadAll();
        } else eng.resize(W, H);
        return true;
      };

      // ---------- one frame ----------
      const isoMeshes = {};
      const meshAt = (g, sc, level) => {   // a scene's isosurface and cuts at a level of its own choosing
        const id = level == null || Math.abs(level - sc.iso) < 1e-6 ? sc.id : sc.id + '@' + level;
        if (id === sc.id) return g.meshOf(sc);
        if (!isoMeshes[id]) isoMeshes[id] = Object.assign({}, sc, { id: id, iso: level });
        return g.meshOf(isoMeshes[id]);
      };
      const fieldsOf = (g, shot, sc, a) => {
        if (!sc.grid || !(a > 0)) return;
        const level = typeof shot.iso === 'number' ? shot.iso : sc.iso, m = meshAt(g, sc, level);
        if (shot.sections) g.sections(m, level, a);
        if (shot.iso) g.isoSurface(m, sc.planes, sc.translations, YELLOW, 0.7 * a);
      };
      const atomsOf = (g, sc, list) => {   // list: [index, position, size 0..1, pale]
        g.solid();
        for (const [i, p, s, pale] of list) {
          if (s < 0.02) continue;
          const sp = sc.species[sc.atoms[i][3]];
          g.sphere(p, sp.r * (0.25 + 0.75 * s), mix3(sp.rgb, WHITE, pale));
        }
      };
      const bondsOf = (g, sc, pos, size, pale, k) => {
        if (!(k > 0.02) || !sc.bonds || !sc.bonds.length) return;
        for (const b of sc.bonds) {
          const s = Math.min(size[b[0]], size[b[1]]) * k; if (s < 0.05) continue;
          const A = pos[b[0]], B = pos[b[1]], m = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2], r = (sc.bondR || 0.1) * s;
          g.rod(A, m, r, mix3(sc.species[sc.atoms[b[0]][3]].rgb, WHITE, pale[b[0]])); g.rod(m, B, r, mix3(sc.species[sc.atoms[b[1]][3]].rgb, WHITE, pale[b[1]]));
        }
      };
      const linesOf = (g, sc, a, s) => {
        if (!(a > 0.02) || !sc.lines || !sc.lines.length) return;
        const c = sc.center, flat = [].concat(...sc.lines);
        if (s && s !== 1) for (let k = 0; k < flat.length; k++) flat[k] = c[k % 3] + (flat[k] - c[k % 3]) * s;
        g.lines(flat, LINE, a);
      };
      const sq = (shot) => (shot && shot.squeeze) || 1;
      // the squeeze of the step being entered: it eases in during the step (after the atoms have grown, if they grow)
      const squeezeNow = (A, B, same, t) => {
        const fA = sq(A), fB = sq(B);
        if (same) return lerp(fA, fB, sm((t - 0.3) / 0.6));
        return fB === 1 ? 1 : lerp(1, fB, sm((t - 0.4) / 0.55));
      };
      const boxes = {};
      const boxOf = (sc) => {   // the box the scene's atoms fill, a little larger
        if (boxes[sc.id]) return boxes[sc.id];
        const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
        for (const a of sc.atoms) for (let x = 0; x < 3; x++) { lo[x] = Math.min(lo[x], a[x]); hi[x] = Math.max(hi[x], a[x]); }
        return (boxes[sc.id] = [lo.map((v) => v - 0.6), hi.map((v) => v + 0.6)]);
      };
      const searchAt = (sc, i, t) => {   // where an atom is during a search: scattered over the picture, then hopping, then in place
        const [lo, hi] = boxOf(sc), at = (k) => [0, 1, 2].map((x) => lo[x] + (hi[x] - lo[x]) * rnd(i, k + x));
        const p0 = at(1), p1 = at(4), p2 = sc.atoms[i];
        const u = sm((t - 0.06 - 0.18 * rnd(i, 7)) / 0.62), a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u;
        return [0, 1, 2].map((x) => a * p0[x] + b * p1[x] + c * p2[x]);
      };

      const paint = (g) => {
        const k = st.step, t = st.started ? st.t : (reduced ? 1 : 0), A = shotOf(from), B = shotOf(k);
        const sb = scenes[B.scene], sa = A ? scenes[A.scene] : null;
        if (!sb) { if (sa) drawStill(g, A, sa); return; }
        const same = !!(A && sa && A.scene === B.scene);
        const eS = same ? sm(t / 0.7) : 0, e1 = sm(t / 0.45), e2 = sm((t - 0.35) / 0.5), eF = sm((t - 0.45) / 0.45);
        const n = sb.atoms.length, pos = new Array(n), size = new Float32Array(n), pale = new Float32Array(n);
        const m = !same && sa ? match(sa, sb) : null, searching = !!(B.search && !same), fA = sq(A), fB = squeezeNow(A, B, same, t);
        for (let i = 0; i < n; i++) {
          const yb = styleOf(B, sb, i);
          if (same) {
            const ya = styleOf(A, sb, i);
            pos[i] = placeOf(fB, sb, i);
            size[i] = lerp(ya[0], yb[0], eS); pale[i] = lerp(ya[1], yb[1], eS); continue;
          }
          const j = m ? m[i] : -1;
          if (j >= 0) { const ya = styleOf(A, sa, j), q = placeOf(fA, sa, j), p = placeOf(fB, sb, i); pos[i] = [lerp(q[0], p[0], e1), lerp(q[1], p[1], e1), lerp(q[2], p[2], e1)]; size[i] = lerp(ya[0], yb[0], e1); pale[i] = lerp(ya[1], yb[1], e1); continue; }
          if (searching) { pos[i] = searchAt(sb, i, t); size[i] = yb[0] * sm(t / 0.12); pale[i] = Math.max(yb[1], 0.35 * (1 - sm((t - 0.55) / 0.3))); continue; }
          pos[i] = placeOf(fB, sb, i); size[i] = yb[0] * sm((t - (sa ? 0.35 : 0.02) - 0.25 * rnd(i, 9)) / 0.4); pale[i] = yb[1];
        }
        // what leaves: the atoms of the last structure that the new one does not have
        if (sa && !same) {
          const keep = new Set(m.filter((j) => j >= 0)), out = [];
          sa.atoms.forEach((q, j) => { if (!keep.has(j)) { const ya = styleOf(A, sa, j); out.push([j, placeOf(fA, sa, j), ya[0] * (1 - e1), ya[1]]); } });
          atomsOf(g, sa, out);
          const ps = sa.atoms.map((_, j) => placeOf(fA, sa, j)), sz = new Float32Array(ps.length), pl = new Float32Array(ps.length);
          ps.forEach((q, j) => { const ya = styleOf(A, sa, j); sz[j] = ya[0]; pl[j] = ya[1]; });
          bondsOf(g, sa, ps, sz, pl, A.bonds === false ? 0 : 1 - e1);
          linesOf(g, sa, A.cell === false ? 0 : 1 - e1, fA);
        }
        atomsOf(g, sb, Array.from({ length: n }, (_, i) => [i, pos[i], size[i], pale[i]]));
        const bk = B.bonds === false ? 0 : 1, ak = A && A.bonds === false ? 0 : 1;
        bondsOf(g, sb, pos, size, pale, same ? lerp(ak, bk, eS) : bk * (searching ? sm((t - 0.7) / 0.25) : sa ? e2 : sm(t / 0.5)));
        linesOf(g, sb, same ? lerp(A.cell === false ? 0 : 1, B.cell === false ? 0 : 1, eS) : (B.cell === false ? 0 : sa ? e2 : sm(t / 0.4)), fB);
        // fields last: they are see-through
        if (same) {
          const lvA = typeof A.iso === 'number' ? A.iso : sb.iso, lvB = typeof B.iso === 'number' ? B.iso : sb.iso;
          if (Math.abs(lvA - lvB) < 1e-6 && !!A.iso === !!B.iso && !!A.sections === !!B.sections) fieldsOf(g, B, sb, 1);
          else { fieldsOf(g, A, sb, 1 - e1); fieldsOf(g, B, sb, eF); }
        } else {
          if (sa) fieldsOf(g, A, sa, 1 - e1);
          fieldsOf(g, B, sb, searching ? sm((t - 0.75) / 0.25) : eF);
        }
      };
      // a step whose structure has not arrived yet keeps showing the last one
      const drawStill = (g, A, sa) => {
        const n = sa.atoms.length, sz = new Float32Array(n), pl = new Float32Array(n);
        const ps = sa.atoms.map((_, i) => placeOf(sq(A), sa, i));
        const list = sa.atoms.map((q, i) => { const y = styleOf(A, sa, i); sz[i] = y[0]; pl[i] = y[1]; return [i, ps[i], y[0], y[1]]; });
        atomsOf(g, sa, list); bondsOf(g, sa, ps, sz, pl, A.bonds === false ? 0 : 1); linesOf(g, sa, A.cell === false ? 0 : 1, sq(A)); fieldsOf(g, A, sa, 1);
      };

      // ---------- labels and the paper's own figure, laid over the picture ----------
      const labelAt = (sc, L) => (L.atom != null ? sc.atoms[L.atom].slice(0, 3) : L.frac ? cart(sc, L.frac) : L.at);
      const placeLabels = () => {
        const B = shotOf(st.step), sc = B && scenes[B.scene], t = st.started ? st.t : (reduced ? 1 : 0);
        const L = (B && B.labels) || [];
        while (labelEls.length < L.length) { const e = document.createElement('span'); e.className = 'pl-label'; labelsEl.appendChild(e); labelEls.push(e); }
        labelEls.forEach((e, i) => {
          if (i >= L.length || !sc || !eng || !eng.M || flat) { e.style.opacity = '0'; return; }
          const p = eng.screen(labelAt(sc, L[i]));
          if (e.dataset.text !== L[i].text) { e.dataset.text = L[i].text; e.innerHTML = L[i].text; }
          // a label that would run off the picture goes to the other side of its point, or above it if neither side has room
          let side = L[i].side || 'right';
          const lw = e.offsetWidth, sw = stage.clientWidth;
          const fits = { right: p[0] + lw + 24 <= sw, left: p[0] - lw - 24 >= 0, top: p[0] - lw / 2 >= 4 && p[0] + lw / 2 <= sw - 4 };
          fits.bottom = fits.top;
          if (!fits[side]) side = side === 'right' && fits.left ? 'left' : side === 'left' && fits.right ? 'right' : fits.top ? 'top' : fits.right ? 'right' : fits.left ? 'left' : side;
          if (side === 'top' && p[1] - e.offsetHeight - 24 < 0) side = 'bottom';
          if (e.className !== 'pl-label ' + side) e.className = 'pl-label ' + side;
          e.style.left = p[0] + 'px'; e.style.top = p[1] + 'px';
          e.style.opacity = String(sm((t - 0.55) / 0.3));
        });
      };
      const placeFigure = () => {
        const B = shotOf(st.step), A = shotOf(from), t = st.started ? st.t : (reduced ? 1 : 0);
        const img = (B && B.image) || (flat ? def.fallback : null);
        let a = 0;
        if (img) a = flat ? 1 : (A && A.image === B.image ? 1 : sm((t - 0.1) / 0.35));
        else if (A && A.image) a = 1 - sm(t / 0.3);
        const show = img || (A && A.image);
        if (show && figImg.getAttribute('src') !== show.src) { figImg.src = show.src; figImg.alt = show.alt || ''; figCap.innerHTML = show.caption || ''; }
        figEl.hidden = !(a > 0.01); figEl.style.opacity = String(a);
        stage.classList.toggle('pl-covered', a > 0.5);   // nothing to turn while a figure of the paper covers the picture
      };

      const live = () => { placeLabels(); placeFigure(); };
      const sync = (k) => {
        cv.setAttribute('aria-label', (def.label || '') + ', step ' + (k + 1) + ' of ' + STEPS.length + ', ' + STEPS[k].name + '. ' + (STEPS[k].alt || ''));
        put(api.info, STEPS[k].note ? '<span>' + STEPS[k].note + '</span>' : '');
      };
      const put = api.put;
      const enter = (k) => {
        if (k === cur) { from = cur >= 0 && from !== k ? from : -1; }
        else { from = cur; cur = k; }
        if (!eng) return;
        const A = shotOf(from), B = shotOf(k), f = frameOf(B);
        if (!f) return;
        // the camera glides to the new step's view when the structure or the step's view changes; it stays where the visitor turned it otherwise
        if (!A || A.scene !== B.scene || B.view || (A.view && !B.view)) {
          if (from < 0 || reduced) { Object.assign(eng.d, { center: f.center, width: f.width, radius: f.radius, aspect: f.aspect }); eng.M = f.M; eng.zoom = 1; eng.dirty = true; cam = null; }
          else cam = { t0: performance.now(), dur: 900, c0: eng.d.center.slice(), w0: eng.d.width, r0: eng.d.radius, z0: eng.zoom, q0: quatOf(eng.M), to: f, q1: quatOf(f.M) };
        }
      };
      const tick = () => {
        let busy = false;
        if (cam && eng) {
          const u = sm((performance.now() - cam.t0) / cam.dur), f = cam.to;
          eng.d.center = [0, 1, 2].map((x) => lerp(cam.c0[x], f.center[x], u));
          eng.d.width = lerp(cam.w0, f.width, u); eng.d.radius = lerp(cam.r0, f.radius, u); eng.zoom = lerp(cam.z0, 1, u);
          eng.M = matOf(slerp(cam.q0, cam.q1, u)); eng.dirty = true;
          if (u >= 1) cam = null; else busy = true;
          live();
        }
        if (eng && eng.dirty && eng.ptr.size > 0) busy = true;
        return busy;
      };
      const draw = () => { if (eng) eng.draw(); live(); };
      const sleep = () => {
        if (!eng) return;
        saved = { M: eng.M ? eng.M.map((r) => r.slice()) : null, zoom: eng.zoom, d: { center: eng.d.center.slice(), width: eng.d.width, radius: eng.d.radius, aspect: eng.d.aspect } };
        cv = window.LP_freshCanvas ? window.LP_freshCanvas(cv, eng.gl) : cv;
        eng = null; cam = null;
        for (const k in isoMeshes) delete isoMeshes[k];
      };

      // ---------- controls: the picture turns when dragged, as the figures do ----------
      const onCv = (type, fn, opt) => stage.addEventListener(type, (e) => { if (e.target === cv && eng) fn(e); }, opt);
      onCv('pointerdown', (e) => { api.touched(); cam = null; eng.down(e); });
      onCv('pointermove', (e) => { if (!eng.ptr.size) return; eng.move(e); live(); api.kick(); });
      onCv('pointerup', (e) => eng.up(e));
      onCv('pointercancel', (e) => eng.up(e));
      onCv('dblclick', () => { snap(); live(); api.kick(); });
      onCv('keydown', (e) => { if (eng.key(e)) { e.preventDefault(); cam = null; live(); api.kick(); } });
      onCv('wheel', (e) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); eng.zoomBy(Math.exp(-e.deltaY * 0.01)); live(); api.kick(); } }, { passive: false });
      if (flat) stage.classList.add('flat');
      return { layout: layout, draw: draw, live: live, sync: sync, enter: enter, tick: tick, sleep: sleep };
    }
  });
  return api0;
};
