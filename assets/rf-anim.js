/* What ReactionFlow does with a reactive molecular dynamics run, as a short looping animation. This is the animation of my
   SESAPS 2026 talk, computed here instead of played as a movie: a schematic model surface, and on it a Langevin trajectory,
   the bond watch that pauses it, the relaxation of both ends, a nudged elastic band with a climbing image, the two descents
   from the saddle that check it, and the stored barrier. Nothing in it is a ReactionFlow result. The surface and the
   computations are in the first part (the talk's model.mjs), the drawing in the second (its rf_animation.mjs); both are
   put together by tools/make_rf_anim.py, so edit them there. A step of a paper's figure shows it with image: { anim: 'rf', bg: the surface, ... }. */
(() => {
  'use strict';
  // ---------------------------------------------------------------- the model surface and the computations on it
  const M = (() => {
    // Schematic model surfaces and the small computations drawn on them.
    // Nothing here is a ReactionFlow result. The surfaces are analytic, and the
    // trajectory, minimum-energy path, saddle mode and searches are computed on
    // them so that every drawn element is geometrically consistent.

    // Forming C29...C94 distance over 2 r_C (ASE covalent radii, r_C = 0.76 A) in the
    // stored ANI-1xnr step B reactant, transition state and product (Fig. 2b).
    const RATIO = {R: 1.770, TS: 1.400, P: 1.002};
    const DIST = {R: 2.691, TS: 2.128, P: 1.523};
    const FORM = 1.15, BREAK = 1.30; // ReactionFlow default thresholds

    // ---------- seeded random numbers ----------
    function rng(seed) {
      let a = seed >>> 0;
      const uni = () => {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
      let spare = null;
      const gauss = () => {
        if (spare !== null) { const s = spare; spare = null; return s; }
        let u, v, s;
        do { u = 2 * uni() - 1; v = 2 * uni() - 1; s = u * u + v * v; } while (s === 0 || s >= 1);
        const m = Math.sqrt(-2 * Math.log(s) / s);
        spare = v * m;
        return u * m;
      };
      return {uni, gauss};
    }

    // ---------- the reaction surface of panel b ----------
    // V(x, y) = g(y) + k(y) (x - c(y))^2 / 2, with y the C-C ratio.
    // g has stationary points exactly at the three structure ratios, so the minima
    // and the saddle of V sit at those heights whatever c(y) and k(y) are.
    const yP = RATIO.P, yS = RATIO.TS, yR = RATIO.R;
    const E_S = 0.96, B_R = 0.16, B_P = 0.88; // schematic, proportioned like step B
    const xR = -0.62, xP = 0.30, kR = 4.5, kP = 14;

    function makeProfile() {
      const lo = 0.70, hi = 2.20, n = 15000, h = (hi - lo) / n;
      const p = (y) => (y - yP) * (y - yS) * (y - yR);
      const table = (beta, gamma) => {
        const f = (y) => p(y) * (Math.exp(-beta * (y - yS)) + gamma * Math.max(0, y - yR) ** 2);
        const G = new Float64Array(n + 1);
        for (let i = 1; i <= n; i++) {
          const a = lo + (i - 1) * h, b = lo + i * h;
          G[i] = G[i - 1] + (h / 6) * (f(a) + 4 * f((a + b) / 2) + f(b));
        }
        const at = (y) => {
          const t = Math.min(n - 1e-9, Math.max(0, (y - lo) / h)), i = Math.floor(t), w = t - i;
          return G[i] * (1 - w) + G[i + 1] * w;
        };
        const g0 = at(yS);
        return (y) => at(y) - g0;
      };
      const gamma = 30;
      let a = 0, b = 20, G;
      for (let it = 0; it < 80; it++) { // ratio of the two barriers fixes beta
        const m = (a + b) / 2;
        G = table(m, gamma);
        (G(yP) / G(yR) < B_P / B_R) ? (a = m) : (b = m);
      }
      const A = B_R / -G(yR);
      return (y) => E_S + A * G(y);
    }
    const g = makeProfile();
    const tOf = (y) => (y - yP) / (yR - yP);
    const c = (y) => { const t = Math.max(0, tOf(y)); return xP + (xR - xP) * t * t * t; };
    const k = (y) => kP + (kR - kP) * Math.min(1.25, Math.max(-0.2, tOf(y)));
    const V = (x, y) => g(y) + 0.5 * k(y) * (x - c(y)) ** 2;
    const STATIONARY = {R: [xR, yR], TS: [c(yS), yS], P: [xP, yP]};
    const ENERGY = {R: V(xR, yR), TS: V(c(yS), yS), P: V(xP, yP)};

    // Metric coordinates: X = sx x, Y = sy y in mm of the drawn panel, so that
    // steepest descent and the Hessian eigenvectors are perpendicular in the figure.
    function metric(sx, sy) {
      const U = (X, Y) => V(X / sx, Y / sy);
      const grad = (X, Y, e = 1e-4) => [
        (U(X + e, Y) - U(X - e, Y)) / (2 * e),
        (U(X, Y + e) - U(X, Y - e)) / (2 * e),
      ];
      const hess = (X, Y, e = 1e-3) => {
        const xx = (U(X + e, Y) - 2 * U(X, Y) + U(X - e, Y)) / (e * e);
        const yy = (U(X, Y + e) - 2 * U(X, Y) + U(X, Y - e)) / (e * e);
        const xy = (U(X + e, Y + e) - U(X + e, Y - e) - U(X - e, Y + e) + U(X - e, Y - e)) / (4 * e * e);
        return [xx, xy, yy];
      };
      return {U, grad, hess};
    }

    function eig2([a, b, d]) {
      const tr = a + d, det = a * d - b * b, disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
      const l1 = tr / 2 - disc, l2 = tr / 2 + disc;
      let v = Math.abs(b) > 1e-12 ? [l1 - d, b] : (a < d ? [1, 0] : [0, 1]);
      const n = Math.hypot(...v);
      v = [v[0] / n, v[1] / n];
      return {l1, l2, v1: v, v2: [-v[1], v[0]]};
    }

    // Steepest descent in metric coordinates, from p until the gradient vanishes.
    function descend(m, p, {step = 0.05, maxSteps = 40000, tol = 2e-6} = {}) {
      const path = [p.slice()];
      let q = p.slice();
      for (let i = 0; i < maxSteps; i++) {
        const gr = m.grad(q[0], q[1]);
        const gn = Math.hypot(gr[0], gr[1]);
        if (gn < tol) break;
        const s = Math.min(step, gn * 4);
        q = [q[0] - s * gr[0] / gn, q[1] - s * gr[1] / gn];
        path.push(q.slice());
      }
      return path;
    }

    function arcLength(path) {
      const s = [0];
      for (let i = 1; i < path.length; i++) s.push(s[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
      return s;
    }
    function atArc(path, s, target) {
      let i = 1;
      while (i < s.length - 1 && s[i] < target) i++;
      const w = (target - s[i - 1]) / ((s[i] - s[i - 1]) || 1);
      return [path[i - 1][0] + w * (path[i][0] - path[i - 1][0]), path[i - 1][1] + w * (path[i][1] - path[i - 1][1])];
    }

    // Langevin (BAOAB) trajectory in metric coordinates.
    function langevin(m, start, {steps, dt, kT, gamma, mass = 1, seed}) {
      const r = rng(seed);
      const c1 = Math.exp(-gamma * dt), c2 = Math.sqrt((1 - c1 * c1) * kT / mass);
      let [X, Y] = start;
      let vx = r.gauss() * Math.sqrt(kT / mass), vy = r.gauss() * Math.sqrt(kT / mass);
      let F = m.grad(X, Y).map((v) => -v);
      const out = [[X, Y]];
      for (let i = 0; i < steps; i++) {
        vx += 0.5 * dt * F[0] / mass; vy += 0.5 * dt * F[1] / mass;
        X += 0.5 * dt * vx; Y += 0.5 * dt * vy;
        vx = c1 * vx + c2 * r.gauss(); vy = c1 * vy + c2 * r.gauss();
        X += 0.5 * dt * vx; Y += 0.5 * dt * vy;
        F = m.grad(X, Y).map((v) => -v);
        vx += 0.5 * dt * F[0] / mass; vy += 0.5 * dt * F[1] / mass;
        out.push([X, Y]);
      }
      return out;
    }

    // Bond watching on the sampled ratio, as ReactionFlow documents it: a formation
    // counts after FORM is crossed on 3 consecutive observations, and the event is a
    // candidate after 3 stable observations. The reactant is the latest earlier
    // observation on the reactant side of the gap (ratio >= BREAK), within 10.
    function watch(ratios) {
      const state = [];
      let pers = 0, confirmed = -1, candidate = -1, stable = 0;
      ratios.forEach((r, i) => {
        if (confirmed < 0) {
          pers = r <= FORM ? pers + 1 : 0;
          if (pers === 3) { confirmed = i; stable = 1; state.push('bonded'); }
          else state.push(pers > 0 ? 'pending' : 'free');
        } else {
          state.push(r <= BREAK ? 'bonded' : 'free');
          if (candidate < 0 && ++stable === 3) candidate = i;
        }
      });
      const first = confirmed - 2;
      let reactant = first - 1;
      for (let j = first - 1; j >= Math.max(0, first - 11); j--) if (ratios[j] >= BREAK) { reactant = j; break; }
      return {state, first, confirmed, candidate, reactant, product: first};
    }

    // ---------- the small EON landscape of panel c ----------
    // Gaussian wells in a soft bowl, in mm of the drawn frame.
    function eonLandscape(wells, center, bowl) {
      const U = (x, y) => {
        let e = bowl * ((x - center[0]) ** 2 + (y - center[1]) ** 2);
        for (const w of wells) e -= w.A * Math.exp(-((x - w.x) ** 2 + (y - w.y) ** 2) / (2 * w.s * w.s));
        return e;
      };
      const grad = (X, Y, e = 1e-4) => [(U(X + e, Y) - U(X - e, Y)) / (2 * e), (U(X, Y + e) - U(X, Y - e)) / (2 * e)];
      const hess = (X, Y, e = 1e-3) => [
        (U(X + e, Y) - 2 * U(X, Y) + U(X - e, Y)) / (e * e),
        (U(X + e, Y + e) - U(X + e, Y - e) - U(X - e, Y + e) + U(X - e, Y - e)) / (4 * e * e),
        (U(X, Y + e) - 2 * U(X, Y) + U(X, Y - e)) / (e * e),
      ];
      return {U, grad, hess};
    }

    // Minimum-mode following (dimer-like) from a pushed point to a saddle.
    function climb(m, start, push, {step = 0.06, maxSteps = 6000, emax, bounds}) {
      let q = start.slice();
      let dir = push.slice();
      const path = [q.slice()];
      for (let i = 0; i < maxSteps; i++) {
        const {l1, v1} = eig2(m.hess(q[0], q[1]));
        let v = v1;
        if (v[0] * dir[0] + v[1] * dir[1] < 0) v = [-v[0], -v[1]];
        dir = v;
        const gr = m.grad(q[0], q[1]);
        const F = [-gr[0], -gr[1]];
        const fv = F[0] * v[0] + F[1] * v[1];
        const Fd = l1 < 0 ? [F[0] - 2 * fv * v[0], F[1] - 2 * fv * v[1]] : [-fv * v[0] + 0.0 * F[0], -fv * v[1]];
        const n = Math.hypot(...Fd);
        if (l1 < 0 && Math.hypot(...gr) < 1e-5) return {path, end: 'saddle', at: q};
        const s = Math.min(step, n * 6 + 1e-4);
        q = [q[0] + s * Fd[0] / (n || 1), q[1] + s * Fd[1] / (n || 1)];
        path.push(q.slice());
        if (m.U(q[0], q[1]) > emax || q[0] < bounds[0] || q[0] > bounds[1] || q[1] < bounds[2] || q[1] > bounds[3]) return {path, end: 'failed', at: q};
      }
      return {path, end: 'saddle', at: q};
    }

    return {RATIO, DIST, FORM, BREAK, rng, V, STATIONARY, ENERGY, metric, eig2, descend, arcLength, atArc, langevin, watch};
  })();
  // ---------------------------------------------------------------- the animation: everything it draws, as SVG, at time t
  const build = (BG, LS) => {
    const Wp = 1440, Hp = 800, FPS = 30;
    const COL = {ink: '#202020', blue: '#0072B2', orange: '#D55E00', teal: '#0B7A80', red: '#BE3E4A', band: '#6F7F84', muted: '#5B6B70', rule: '#C9D3D5', tint: '#E3F0EF'};
    const f = (v) => (Math.round(v * 10) / 10).toString();
    const ease = (u) => { const c = Math.min(1, Math.max(0, u)); return c * c * (3 - 2 * c); };
    const clamp = (u) => Math.min(1, Math.max(0, u));
    const LA = {x0: 6, x1: 91, y0: 21.5, y1: 60};
    const RLO = 0.86, RHI = 1.94;
    const SX = (LA.y1 - LA.y0) / 2, SY = (LA.x1 - LA.x0) / (RHI - RLO);
    const met = M.metric(SX, SY);
    const K = 16, MAP = {x: 40, y: 28, w: (LA.x1 - LA.x0) * 16, h: (LA.y1 - LA.y0) * 16, r: 20};
    const toPx = ([X, Y]) => [MAP.x + (RHI * SY - Y) * K, MAP.y + (X + SX) * K];
    const fromPx = (u, v) => [(v - MAP.y) / K - SX, RHI * SY - (u - MAP.x) / K];
    const dOf = (pts, close = false) => pts.map((p, i) => `${i ? 'L' : 'M'}${f(p[0])} ${f(p[1])}`).join('') + (close ? 'Z' : '');
    const stat = Object.fromEntries(Object.entries(M.STATIONARY).map(([k, [x, y]]) => [k, [x * SX, y * SY]]));
    const hS = M.eig2(met.hess(...stat.TS));
    const side = (sg) => M.descend(met, [stat.TS[0] + sg * 0.05 * hS.v1[0], stat.TS[1] + sg * 0.05 * hS.v1[1]]);
    let toR = side(1), toP = side(-1);
    if (toR[toR.length - 1][1] < toP[toP.length - 1][1]) [toR, toP] = [toP, toR];
    const mep = toR.slice().reverse().concat([stat.TS], toP);
    const hP = M.eig2(met.hess(...stat.P)), hR = M.eig2(met.hess(...stat.R));
    const omega = Math.sqrt(Math.max(hP.l2, hR.l2)), dt = 0.3 / omega;
    const STEPS = 1800;
    let traj, crossI, seed;
    for (seed = 1; seed < 20000; seed++) {
      const t = M.langevin(met, stat.R, {steps: STEPS, dt, kT: 0.06, gamma: 0.35 * omega, seed});
      const r = t.map((p) => p[1] / SY), i = r.findIndex((v) => v <= M.FORM);
      if (i < 0.5 * STEPS || i > 0.66 * STEPS) continue;
      if (r.slice(i).some((v) => v > M.BREAK)) continue;
      if (Math.max(...r.slice(0, i)) < 1.75) continue;
      traj = t; crossI = i; break;
    }
    // the bond watch: one observation every OBS steps; the run pauses when the new bond has persisted
    const OBS = 12;
    const watch = M.watch(traj.filter((_, i) => i % OBS === 0).map((p) => p[1] / SY));
    const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    // The frame taken before the event has to relax to the reactant. On this toy surface the saddle (ratio 1.40) lies outside
    // the bond gap (1.15 to 1.30), so the search starts at the watch's reactant observation and steps back until that holds.
    let obsR = watch.reactant;
    while (obsR > 0 && dist(M.descend(met, traj[obsR * OBS], {step: 0.05}).pop(), stat.R) > 0.05) obsR--;
    const S = {det: watch.candidate * OBS, r: obsR * OBS, p: watch.product * OBS};
    const relaxR = M.descend(met, traj[S.r], {step: 0.05}), relaxP = M.descend(met, traj[S.p], {step: 0.05});
    const endR = relaxR[relaxR.length - 1], endP = relaxP[relaxP.length - 1];
    if (dist(endR, stat.R) > 0.05 || dist(endP, stat.P) > 0.05) throw new Error('snapshots do not relax to R and P');
    const NIMG = 7;
    function neb() {
      const l2 = Math.max(hP.l2, hR.l2), alpha = 0.22 / l2, kSpring = 0.45 * l2;
      let imgs = Array.from({length: NIMG}, (_, i) => [endR[0] + (endP[0] - endR[0]) * i / (NIMG - 1), endR[1] + (endP[1] - endR[1]) * i / (NIMG - 1)]);
      const hist = [imgs.map((p) => p.slice())];
      const iterate = (n, climb) => {
        for (let it = 0; it < n; it++) {
          const E = imgs.map((p) => met.U(...p));
          let top = 1; for (let i = 2; i < NIMG - 1; i++) if (E[i] > E[top]) top = i;
          const next = imgs.map((p) => p.slice());
          let fmax = 0;
          for (let i = 1; i < NIMG - 1; i++) {
            const dp = [imgs[i + 1][0] - imgs[i][0], imgs[i + 1][1] - imgs[i][1]], dm = [imgs[i][0] - imgs[i - 1][0], imgs[i][1] - imgs[i - 1][1]];
            let tau;
            if (E[i + 1] > E[i] && E[i] > E[i - 1]) tau = dp;
            else if (E[i + 1] < E[i] && E[i] < E[i - 1]) tau = dm;
            else {
              const hi = Math.max(Math.abs(E[i + 1] - E[i]), Math.abs(E[i - 1] - E[i])), lo = Math.min(Math.abs(E[i + 1] - E[i]), Math.abs(E[i - 1] - E[i]));
              tau = E[i + 1] > E[i - 1] ? [dp[0] * hi + dm[0] * lo, dp[1] * hi + dm[1] * lo] : [dp[0] * lo + dm[0] * hi, dp[1] * lo + dm[1] * hi];
            }
            const tn = Math.hypot(...tau); tau = [tau[0] / tn, tau[1] / tn];
            const g = met.grad(...imgs[i]), gp = g[0] * tau[0] + g[1] * tau[1];
            let F;
            if (climb && i === top) F = [-g[0] + 2 * gp * tau[0], -g[1] + 2 * gp * tau[1]];
            else { const fs = kSpring * (Math.hypot(...dp) - Math.hypot(...dm)); F = [-(g[0] - gp * tau[0]) + fs * tau[0], -(g[1] - gp * tau[1]) + fs * tau[1]]; }
            fmax = Math.max(fmax, Math.hypot(...F));
            next[i] = [imgs[i][0] + alpha * F[0], imgs[i][1] + alpha * F[1]];
          }
          imgs = next; hist.push(imgs.map((p) => p.slice()));
          if (fmax < 2e-5) break;
        }
      };
      iterate(6000, false); const nPlain = hist.length;
      iterate(6000, true);
      const E = imgs.map((p) => met.U(...p)); let top = 1; for (let i = 2; i < NIMG - 1; i++) if (E[i] > E[top]) top = i;
      return {hist, nPlain, top, final: imgs};
    }
    const BAND = neb();
    if (dist(BAND.final[BAND.top], stat.TS) > 0.05) throw new Error(`climbing image ended ${dist(BAND.final[BAND.top], stat.TS).toFixed(3)} mm from the saddle`);
    // frames of the band optimisation spread evenly in how far the band still has to move
    function progress(hist, a, b) {
      const last = hist[b - 1], far = (h) => Math.max(...h.map((p, i) => dist(p, last[i]))), d0 = far(hist[a]) || 1;
      const idx = []; for (let k = a; k < b; k++) idx.push(1 - far(hist[k]) / d0);
      return (u) => { const target = ease(u); let k = 0; while (k < idx.length - 1 && idx[k] < target) k++; return hist[a + k]; };
    }
    const bandRelax = progress(BAND.hist, 0, BAND.nPlain), bandClimb = progress(BAND.hist, BAND.nPlain - 1, BAND.hist.length);
    const PARTS = false;
    const PHASES = PARTS
      ? [['hold0', 0.4], ['md', 3.7], ['detect', 1.2], ['holdA', 0.5], ['ends', 1.3], ['bandIn', 0.5], ['relax', 1.9], ['climb', 1.2], ['holdB', 0.5], ['check', 2.4], ['holdC', 0.5], ['record', 1.2], ['resume', 2.4], ['hold1', 0.8]]
      : [['hold0', 0.5], ['md', 3.7], ['detect', 1.0], ['ends', 1.0], ['bandIn', 0.4], ['relax', 1.4], ['climb', 0.8], ['check', 1.9], ['record', 1.1], ['resume', 2.0], ['hold1', 0.7], ['fade', 0.6]];
    const T0 = {}; let TOTAL = 0; for (const [k, d] of PHASES) { T0[k] = TOTAL; TOTAL += d; }
    const DUR = Object.fromEntries(PHASES);
    const prog = (t, k) => clamp((t - T0[k]) / DUR[k]);
    const after = (t, k) => t >= T0[k] + DUR[k];
    const NRES = 300;                                                   // MD steps shown after the run resumes
    // MD step shown at time t: fast through the reactant basin, slower for the crossing itself
    const mdStep = (() => {
      const w = (u) => (u < 0.50 ? 1 : u > 0.62 ? 0.2 : 1 - 0.8 * ease((u - 0.50) / 0.12));
      const n = 400, cum = [0]; for (let i = 1; i <= n; i++) cum.push(cum[i - 1] + w((i - 0.5) / n) / n);
      return (u) => { const x = clamp(u) * n, i = Math.min(n - 1, Math.floor(x)); return S.det * (cum[i] + (cum[i + 1] - cum[i]) * (x - i)) / cum[n]; };
    })();
    const trajAt = (s) => { const i = Math.min(traj.length - 2, Math.floor(s)), w = s - i; return [traj[i][0] + (traj[i + 1][0] - traj[i][0]) * w, traj[i][1] + (traj[i + 1][1] - traj[i][1]) * w]; };
    const along = (pts, u) => { const s = M.arcLength(pts); return M.atArc(pts, s, s[s.length - 1] * clamp(u)); };
    const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const mix = (a, b, t) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
    const fillFor = (e) => { const t = clamp(Math.log(1 + Math.max(0, e - 0.08) / 0.45) / Math.log(1 + 16 / 0.45)); return t < 0.5 ? mix('#FFFFFF', '#D3E6E8', t / 0.5) : mix('#D3E6E8', '#93B8BF', (t - 0.5) / 0.5); };
    const pR = toPx(stat.R), pT = toPx(stat.TS), pP = toPx(stat.P);
    const xForm = MAP.x + (RHI - M.FORM) * SY * K;
    const CHIPS = [['Run MD', ['hold0', 'md']], ['Detect', ['detect', 'holdA']], ['Refine', ['ends', 'bandIn', 'relax', 'climb', 'holdB']], ['Check', ['check', 'holdC']], ['Record', ['record']], ['Resume', ['resume', 'hold1', 'fade']]];
    const circle = (p, r, fill, stroke = '#FFFFFF', sw = 3, o = 1) => `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(r)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${o < 1 ? ` opacity="${f(o * 100) / 100}"` : ''}/>`;
    const triangle = (p, s) => `<path d="M${f(p[0])} ${f(p[1] - 1.5 * s)}L${f(p[0] + 1.35 * s)} ${f(p[1] + 0.9 * s)}L${f(p[0] - 1.35 * s)} ${f(p[1] + 0.9 * s)}Z" fill="${COL.red}" stroke="#FFFFFF" stroke-width="3" stroke-linejoin="round"/>`;
    const tick = (x, y, s, color = COL.teal, sw = 7) => `<path d="M${f(x)} ${f(y)}L${f(x + 0.36 * s)} ${f(y + 0.38 * s)}L${f(x + s)} ${f(y - 0.52 * s)}" fill="none" stroke="#FFFFFF" stroke-width="${sw + 5}" stroke-linecap="round" stroke-linejoin="round"/>`
      + `<path d="M${f(x)} ${f(y)}L${f(x + 0.36 * s)} ${f(y + 0.38 * s)}L${f(x + s)} ${f(y - 0.52 * s)}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
    function spline(pts) {                                              // Catmull-Rom through the band images
      let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
        d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
      }
      return d;
    }
    // the stored barrier: energy along the converged band from the reactant to just past the saddle
    const CARD = {x: MAP.x + MAP.w - 392, y: MAP.y + 22, w: 370, h: 226};
    const cardArt = (() => {
      const s = M.arcLength(mep), sTS = M.arcLength(toR)[toR.length - 1], sEnd = sTS * 1.62, eR = M.ENERGY.R, eT = M.ENERGY.TS;
      const px = {x0: CARD.x + 44, x1: CARD.x + CARD.w - 34, y0: CARD.y + 78, y1: CARD.y + CARD.h - 30};
      const X = (a) => px.x0 + (px.x1 - px.x0) * a / sEnd, Y = (e) => px.y1 - (px.y1 - px.y0) * (e - (eR - 0.07)) / ((eT + 0.045) - (eR - 0.07));
      const curve = []; for (let k = 0; k <= 160; k++) { const a = sEnd * k / 160, e = met.U(...M.atArc(mep, s, a)); if (e < eR - 0.062) break; curve.push([X(a), Y(e)]); }
      const xa = X(sTS) + 44, id = 'rf-card';
      return `<rect x="${CARD.x}" y="${CARD.y}" width="${CARD.w}" height="${CARD.h}" rx="16" fill="#FFFFFF" fill-opacity="0.96" stroke="${COL.rule}" stroke-width="2"/>`
        + tick(CARD.x + 26, CARD.y + 40, 26, COL.teal, 6) + `<text x="${CARD.x + 64}" y="${CARD.y + 50}" font-family="Arial" font-size="33" font-weight="bold" fill="${COL.ink}">Barrier stored</text>`
        + `<clipPath id="${id}"><rect x="${CARD.x + 8}" y="${CARD.y + 62}" width="${CARD.w - 16}" height="${CARD.h - 70}"/></clipPath>`
        + `<g clip-path="url(#${id})"><path d="${dOf(curve)}" fill="none" stroke="${COL.band}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>`
        + `<path d="M${f(X(0))} ${f(Y(eR))}L${f(xa + 12)} ${f(Y(eR))}" stroke="${COL.muted}" stroke-width="2" stroke-dasharray="6 6"/><path d="M${f(X(sTS))} ${f(Y(eT))}L${f(xa + 12)} ${f(Y(eT))}" stroke="${COL.muted}" stroke-width="2" stroke-dasharray="6 6"/>`
        + `<path d="M${f(xa)} ${f(Y(eR) - 9)}L${f(xa)} ${f(Y(eT) + 9)}" stroke="${COL.ink}" stroke-width="3"/>`
        + `<path d="M${f(xa)} ${f(Y(eT) + 1)}l-7 13h14Z" fill="${COL.ink}"/><path d="M${f(xa)} ${f(Y(eR) - 1)}l-7 -13h14Z" fill="${COL.ink}"/>`
        + `<text x="${f(xa + 16)}" y="${f((Y(eR) + Y(eT)) / 2 + 12)}" font-family="Arial" font-size="34" font-style="italic" fill="${COL.ink}">ΔH<tspan baseline-shift="super" font-size="24">‡</tspan></text>`
        + circle([X(0), Y(eR)], 10, COL.teal) + triangle([X(sTS), Y(eT) - 1], 10);
    })();
    function state(t) {
      const s = [];
      const phase = PHASES.find(([k]) => t < T0[k] + DUR[k])?.[0] ?? 'fade';
      // trajectory and its head
      const step = t < T0.md ? 0 : t < T0.detect ? mdStep(prog(t, 'md')) : t < T0.resume ? S.det : S.det + NRES * prog(t, 'resume');
      const dim = t >= T0.ends ? 0.30 + 0.60 * (1 - ease(prog(t, 'ends') * 3)) : 0.90;
      const pts = (a, b) => { const q = []; for (let i = Math.ceil(a); i <= Math.floor(b); i++) q.push(toPx(traj[i])); q.push(toPx(trajAt(b))); return q; };
      if (step > 0) s.push(`<path d="${dOf(pts(0, Math.min(step, S.det)))}" fill="none" stroke="${COL.blue}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" stroke-opacity="${f(dim * 100) / 100}"/>`);
      if (step > S.det) s.push(`<path d="${dOf(pts(S.det, step))}" fill="none" stroke="${COL.blue}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" stroke-opacity="0.9"/>`);
      const head = toPx(trajAt(step));
      // band between the relaxed endpoints
      if (t >= T0.bandIn) {
        const imgs = (t < T0.relax ? BAND.hist[0] : t < T0.climb ? bandRelax(prog(t, 'relax')) : bandClimb(prog(t, 'climb'))).map(toPx);
        const o = t < T0.relax ? ease(prog(t, 'bandIn')) : 1, found = after(t, 'climb');
        s.push(`<g opacity="${f(o * 100) / 100}"><path d="${spline(imgs)}" fill="none" stroke="#FFFFFF" stroke-width="11" stroke-linecap="round" stroke-opacity="0.85"/><path d="${spline(imgs)}" fill="none" stroke="${COL.band}" stroke-width="5.5" stroke-linecap="round"/>`
          + imgs.slice(1, -1).map((p, i) => (found && i + 1 === BAND.top ? '' : circle(p, 9.5, '#FFFFFF', COL.band, 4))).join('') + '</g>');
      }
      // the saddle check: the negative mode, then both sides run down to the minima
      if (t >= T0.check) {
        const u = prog(t, 'check'), v = [hS.v1[0], hS.v1[1]], a = toPx([stat.TS[0] - 4.4 * v[0], stat.TS[1] - 4.4 * v[1]]), b = toPx([stat.TS[0] + 4.4 * v[0], stat.TS[1] + 4.4 * v[1]]);
        const oMode = t < T0.record ? clamp(u / 0.10) * (1 - clamp((u - 0.80) / 0.15)) : 0;
        if (oMode > 0) {
          const n = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / n, uy = (b[1] - a[1]) / n;
          const headAt = (p, sg) => `<path d="M${f(p[0] + sg * ux * 4)} ${f(p[1] + sg * uy * 4)}L${f(p[0] - sg * ux * 16 - uy * 10)} ${f(p[1] - sg * uy * 16 + ux * 10)}L${f(p[0] - sg * ux * 16 + uy * 10)} ${f(p[1] - sg * uy * 16 - ux * 10)}Z" fill="${COL.red}"/>`;
          s.push(`<g opacity="${f(oMode * 100) / 100}"><path d="M${f(a[0] + ux * 14)} ${f(a[1] + uy * 14)}L${f(b[0] - ux * 14)} ${f(b[1] - uy * 14)}" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round"/><path d="M${f(a[0] + ux * 14)} ${f(a[1] + uy * 14)}L${f(b[0] - ux * 14)} ${f(b[1] - uy * 14)}" stroke="${COL.red}" stroke-width="6" stroke-linecap="round"/>${headAt(b, 1)}${headAt(a, -1)}</g>`);
        }
        const run = ease((u - 0.16) / 0.56);
        if (u > 0.16 && t < T0.record) for (const leg of [toR, toP]) {
          const sArc = M.arcLength(leg), q = []; for (let k = 0; k <= 40; k++) q.push(toPx(M.atArc(leg, sArc, sArc[sArc.length - 1] * run * k / 40)));
          s.push(`<path d="${dOf(q)}" fill="none" stroke="${COL.teal}" stroke-width="7" stroke-linecap="round" stroke-opacity="0.9"/>`);
          if (run < 1) s.push(circle(q[q.length - 1], 10, COL.teal));
        } else if (t >= T0.record) s.push(`<path d="${dOf(mep.filter((_, i) => i % 3 === 0).map(toPx))}" fill="none" stroke="${COL.teal}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.9"/>`);
      }
      // endpoints: two snapshots from the trajectory relax to the minima
      if (t >= T0.detect) {
        const u = prog(t, 'detect'), grow = ease((u - 0.40) / 0.25);
        if (t < T0.ends && grow > 0) for (const i of [S.r, S.p]) s.push(circle(toPx(traj[i]), 10 * grow, '#FFFFFF', COL.orange, 5));
        if (t >= T0.ends) {
          const v = ease(prog(t, 'ends')), done = v >= 1;
          for (const leg of [relaxR, relaxP]) s.push(done ? circle(toPx(leg[leg.length - 1]), 13, COL.teal) : circle(toPx(along(leg, v)), 10 + 3 * v, mix('#FFFFFF', COL.teal, v), mix(COL.orange, '#FFFFFF', v), 5 - 2 * v));
        }
      }
      if (after(t, 'climb')) s.push(triangle(toPx(BAND.final[BAND.top]), 14) + `<text x="${f(pT[0])}" y="${f(pT[1] - 22 - 12 * LS)}" font-family="Arial" font-size="${f(40 * LS)}" font-weight="bold" fill="${COL.red}" text-anchor="middle" stroke="#FFFFFF" stroke-width="${f(7 * LS)}" paint-order="stroke" stroke-linejoin="round">TS</text>`);
      if (t >= T0.check) { const o = ease((prog(t, 'check') - 0.74) / 0.14); if (o > 0) for (const p of [pR, pP]) s.push(`<g opacity="${f(o * 100) / 100}">${tick(p[0] - 14, p[1] - 44, 30)}</g>`); }
      if (t >= T0.record) s.push(`<g opacity="${f(ease(prog(t, 'record') / 0.35) * 100) / 100}">${cardArt}</g>`);
      // the MD head, and the pulse when the bond change is confirmed
      if (phase === 'detect') for (const lag of [0, 0.28]) { const u = clamp((prog(t, 'detect') - lag) / 0.62); if (u > 0 && u < 1) s.push(`<circle cx="${f(head[0])}" cy="${f(head[1])}" r="${f(14 + 62 * u)}" fill="none" stroke="${COL.orange}" stroke-width="${f(7 - 4 * u)}" opacity="${f((1 - u) * 100) / 100}"/>`); }
      if (phase === 'detect') s.push(`<path d="M${f(xForm)} ${MAP.y}L${f(xForm)} ${MAP.y + MAP.h}" stroke="${COL.orange}" stroke-width="4" stroke-dasharray="11 9" opacity="${f(Math.sin(Math.PI * prog(t, 'detect')) * 100) / 100}"/>`);
      s.push(t >= T0.ends && t < T0.resume ? circle(head, 9.5, '#FFFFFF', COL.blue, 4.5) : circle(head, 12, t >= T0.detect && t < T0.ends ? COL.orange : COL.blue));
      const note = phase === 'ends' ? 'Relax both ends' : phase === 'bandIn' || phase === 'relax' ? 'Nudged elastic band' : phase === 'climb' || phase === 'holdB' ? 'Climbing image'
        : phase === 'check' || phase === 'holdC' ? (prog(t, 'check') < 0.17 ? 'One negative mode' : 'Both sides relax to a minimum') : '';
      const overlay = `<g clip-path="url(#rf-map)">${s.join('')}</g>`;
      return {svg: overlay, phase: phase, note: note};
    }
    function frame(t) {
      if (t < T0.fade) return state(t);
      const u = ease(prog(t, 'fade'));
      return {svg: state(0).svg + `<g opacity="${f((1 - u) * 100) / 100}"><image href="${BG}" width="${Wp}" height="${Hp}"/>${state(T0.fade - 1e-6).svg}</g>`, phase: 'fade', note: ''};
    }
    return {W: Wp, H: Hp, MAP: MAP, TOTAL: TOTAL, CHIPS: CHIPS, frame: frame};
  };
  // ---------------------------------------------------------------- in the page
  // what is going on, said under the picture; the two parts of the check come from the drawing itself
  const NOTE = { hold0: 'Molecular dynamics on the surface', md: 'Molecular dynamics on the surface', detect: 'A new bond has persisted: the run pauses', record: 'Barrier stored', resume: 'The run resumes where it stopped', hold1: 'The run resumes where it stopped', fade: 'The run resumes where it stopped' };
  let R = null, live = null, chips = [], noteEl = null, t0 = 0, raf = 0, on = false, seen = true, lastDraw = 0, lastPhase = null, lastNote = null;
  const draw = (now) => {
    raf = 0;
    if (!on || !seen || !live) return;
    if (now - lastDraw >= 32) {   // about thirty pictures a second
      lastDraw = now;
      const s = R.frame(((now - t0) / 1000) % R.TOTAL), note = s.note || NOTE[s.phase] || '';
      live.innerHTML = s.svg;
      if (s.phase !== lastPhase) {
        lastPhase = s.phase;
        const k = R.CHIPS.findIndex((c) => c[1].indexOf(s.phase) >= 0);
        chips.forEach((e, i) => { e.className = i === k ? 'on' : i < k ? 'done' : ''; });
      }
      if (note !== lastNote) { lastNote = note; noteEl.textContent = note; }
    }
    raf = requestAnimationFrame(draw);
  };
  const kick = () => { if (on && seen && !raf) raf = requestAnimationFrame(draw); };
  const api = {
    // el: the box to draw in; pic: the step's image ({ bg: the surface, alt }); width: how wide the picture's frame is, in px
    mount(el, pic, width) {
      // the labels were made for a slide: where the picture is shown small they are drawn larger, to stay near 11 px
      const LS = Math.max(1, Math.min(1.9, 11.5 * 1380 / (44 * Math.max(120, (width || 600) - 44))));
      R = build(pic.bg, LS);
      const m = R.MAP, pad = 10, f = (v) => String(Math.round(v * 10) / 10);
      const text = (x, y, t, o) => '<text x="' + x + '" y="' + y + '" font-family="Arial" ' + o + '>' + t + '</text>';
      el.innerHTML = '<svg viewBox="' + (m.x - pad) + ' ' + (m.y - pad) + ' ' + (m.w + 2 * pad) + ' ' + (m.h + 2 * pad) + '" role="img" aria-label="' + (pic.alt || '').replace(/"/g, '&quot;') + '">' +
        '<defs><clipPath id="rf-map"><rect x="' + m.x + '" y="' + m.y + '" width="' + m.w + '" height="' + m.h + '" rx="' + m.r + '"/></clipPath></defs>' +
        '<image href="' + pic.bg + '" width="' + R.W + '" height="' + R.H + '"/>' +
        text(350.1, f(84 + 16 * LS), 'Reactant', 'font-size="' + f(44 * LS) + '" font-weight="bold" fill="#202020"') +
        text(1257.2, 610, 'Product', 'font-size="' + f(44 * LS) + '" font-weight="bold" text-anchor="middle" fill="#202020"') +
        text(984.8, 608, 'bond forms', 'font-size="' + f(33 * LS) + '" font-style="italic" text-anchor="end" fill="#5B6B70"') +
        '<path d="M992.8 598h22m-9 -8l9 8l-9 8" fill="none" stroke="#5B6B70" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<g class="rf-live"></g></svg>' +
        '<ol class="rf-chips" aria-hidden="true">' + R.CHIPS.map((c) => '<li>' + c[0] + '</li>').join('') + '</ol><p class="rf-note" aria-hidden="true"></p>';
      live = el.querySelector('.rf-live'); chips = Array.from(el.querySelectorAll('.rf-chips li')); noteEl = el.querySelector('.rf-note'); lastPhase = lastNote = null;
      live.innerHTML = R.frame(0).svg;
      if (typeof IntersectionObserver !== 'undefined') new IntersectionObserver((es) => { seen = es[es.length - 1].isIntersecting; kick(); }).observe(el);
    },
    start() { if (on) return; on = true; kick(); },
    stop() { on = false; },
    restart() { t0 = performance.now(); lastDraw = 0; kick(); }
  };
  window.LP_ANIMS = window.LP_ANIMS || {};
  window.LP_ANIMS.rf = api;
})();
