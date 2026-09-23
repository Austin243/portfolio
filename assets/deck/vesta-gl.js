const VestaGL = class {
  constructor(W, H) {
    this.W = W; this.H = H;
    this.cv = null; this.ov = null; this.gl = null;
    this.d = null; this.M = null; this.zoom = 1; this.dirty = true;
    this.ptr = new Map(); this.pinch = 0; this.meshes = {}; this.status = 'loading';
  }
  attach(cv, ov) {
    if (ov !== undefined) {
      this.ov = ov;
      if (ov) { const dpr = Math.min(2, window.devicePixelRatio || 1); ov.width = Math.round(this.W * dpr); ov.height = Math.round(this.H * dpr); }
    }
    if (cv === undefined || cv === this.cv) { this.dirty = true; return; }
    this.cv = cv; this.gl = null;
    if (!cv) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(this.W * dpr); cv.height = Math.round(this.H * dpr);
    let gl = null;
    try { gl = cv.getContext('webgl', { antialias: true, alpha: false }) || cv.getContext('experimental-webgl'); } catch (err) { gl = null; }
    if (!gl) { this.status = 'nogl'; this.dirty = true; return; }
    this.gl = gl; this.meshes = {};
    this._init();
    if (this.d) this._build();
    this.status = this.d ? 'ready' : 'loading';
    this.dirty = true;
  }
  // ---------- GL setup ----------
  _sh(type, src) {
    const gl = this.gl, s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  _prog(vs, fs) {
    const gl = this.gl, p = gl.createProgram();
    gl.attachShader(p, this._sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, this._sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const loc = {};
    for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_ATTRIBUTES); i < n; i++) { const a = gl.getActiveAttrib(p, i); loc[a.name] = gl.getAttribLocation(p, a.name); }
    for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) { const u = gl.getActiveUniform(p, i); loc[u.name.replace('[0]', '')] = gl.getUniformLocation(p, u.name); }
    return { p: p, loc: loc };
  }
  _init() {
    const gl = this.gl;
    const PREC = '#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n';
    const VH = 'uniform mat3 uM; uniform vec3 uC; uniform vec3 uS; uniform float uR; varying float vFog;\n' +
      'vec4 project(vec3 w){ vec3 q = uM * (w - uC); float t = clamp((uR - q.z) / (2.0 * uR), 0.0, 1.0);\n' +
      ' vFog = 0.42 * smoothstep(0.35, 1.0, t); return vec4(q.x * uS.x, q.y * uS.y, -q.z * uS.z, 1.0); }\n';
    const LIT = 'vec3 shade(vec3 n, vec3 col, float spec){ vec3 L = normalize(vec3(-0.35, 0.45, 0.82)); vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));\n' +
      ' float d = max(dot(n, L), 0.0); float s = pow(max(dot(n, H), 0.0), 42.0); return col * (0.30 + 0.70 * d) + vec3(spec * s); }\n';
    this.ballP = this._prog('attribute vec3 aPos; uniform vec3 uPos; uniform float uRad; varying vec3 vN;\n' + VH +
      'void main(){ vN = uM * aPos; gl_Position = project(uPos + aPos * uRad); }',
      PREC + 'varying vec3 vN; varying float vFog; uniform vec3 uColor;\n' + LIT +
      'void main(){ gl_FragColor = vec4(mix(shade(normalize(vN), uColor, 0.55), vec3(1.0), vFog), 1.0); }');
    this.stickP = this._prog('attribute vec3 aPos; uniform vec3 uA; uniform vec3 uB; uniform vec3 uU; uniform vec3 uV; varying vec3 vN;\n' + VH +
      'void main(){ vec3 r = uU * aPos.x + uV * aPos.y; vN = uM * normalize(r); gl_Position = project(uA + (uB - uA) * aPos.z + r); }',
      PREC + 'varying vec3 vN; varying float vFog; uniform vec3 uColor;\n' + LIT +
      'void main(){ gl_FragColor = vec4(mix(shade(normalize(vN), uColor, 0.45), vec3(1.0), vFog), 1.0); }');
    this.isoP = this._prog('attribute vec3 aPos; attribute vec3 aNrm; uniform vec3 uOff; varying vec3 vN; varying vec3 vW;\n' + VH +
      'void main(){ vec3 w = aPos + uOff; vW = w; vN = uM * aNrm; gl_Position = project(w); }',
      PREC + 'varying vec3 vN; varying vec3 vW; varying float vFog; uniform vec4 uPl[8]; uniform int uNp; uniform vec3 uColor; uniform float uAlpha;\n' + LIT +
      'void main(){ for (int i = 0; i < 8; i++) { if (i >= uNp) break; if (dot(uPl[i].xyz, vW) > uPl[i].w + 0.002) discard; }\n' +
      ' vec3 n = normalize(vN); if (n.z < 0.0) n = -n;\n' +
      ' gl_FragColor = vec4(mix(shade(n, uColor, 0.35), vec3(1.0), vFog), uAlpha); }');
    this.secP = this._prog('attribute vec3 aPos; attribute vec2 aUV; varying vec2 vUV;\n' + VH +
      'void main(){ vUV = aUV; gl_Position = project(aPos); }',
      PREC + 'varying vec2 vUV; varying float vFog; uniform sampler2D uTex; uniform float uIso;\n' +
      'vec3 cmap(float t){ t = clamp(t, 0.0, 1.0);\n' +
      ' if (t < 0.25) return mix(vec3(0.0, 0.0, 1.0), vec3(0.0, 1.0, 1.0), t / 0.25);\n' +
      ' if (t < 0.5) return mix(vec3(0.0, 1.0, 1.0), vec3(0.0, 1.0, 0.0), (t - 0.25) / 0.25);\n' +
      ' if (t < 0.75) return mix(vec3(0.0, 1.0, 0.0), vec3(1.0, 1.0, 0.0), (t - 0.5) / 0.25);\n' +
      ' return mix(vec3(1.0, 1.0, 0.0), vec3(1.0, 0.0, 0.0), (t - 0.75) / 0.25); }\n' +
      'void main(){ float v = texture2D(uTex, vUV).r; if (v < uIso) discard; gl_FragColor = vec4(mix(cmap(v), vec3(1.0), vFog), 1.0); }');
    this.lineP = this._prog('attribute vec3 aPos;\n' + VH + 'void main(){ vec4 p = project(aPos); p.z -= 0.003; gl_Position = p; }',
      PREC + 'varying float vFog; void main(){ gl_FragColor = vec4(mix(vec3(0.08), vec3(1.0), vFog), 1.0); }');
    // unit icosphere (level 3) and a 24-sided open cylinder
    const t = (1 + Math.sqrt(5)) / 2;
    let v = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]];
    let f = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    const nz = (p) => { const l = Math.hypot(p[0], p[1], p[2]); return [p[0] / l, p[1] / l, p[2] / l]; };
    v = v.map(nz);
    for (let k = 0; k < 3; k++) {
      const mid = {}, nf = [];
      const m = (a, b) => { const key = a < b ? a + '_' + b : b + '_' + a; if (mid[key] === undefined) { v.push(nz([(v[a][0] + v[b][0]) / 2, (v[a][1] + v[b][1]) / 2, (v[a][2] + v[b][2]) / 2])); mid[key] = v.length - 1; } return mid[key]; };
      for (const tr of f) { const a = m(tr[0], tr[1]), b = m(tr[1], tr[2]), c = m(tr[2], tr[0]); nf.push([tr[0], a, c], [tr[1], b, a], [tr[2], c, b], [a, b, c]); }
      f = nf;
    }
    this.ball = { buf: this._buf(new Float32Array([].concat(...v))), idx: this._ibuf(new Uint16Array([].concat(...f))), n: f.length * 3 };
    const cyl = [], seg = 24;
    for (let i = 0; i < seg; i++) {
      const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      cyl.push(c0, s0, 0, c1, s1, 0, c1, s1, 1, c0, s0, 0, c1, s1, 1, c0, s0, 1);
    }
    this.stick = { buf: this._buf(new Float32Array(cyl)), n: cyl.length / 3 };
    gl.enable(gl.DEPTH_TEST);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  }
  _buf(a) { const gl = this.gl, b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, a, gl.STATIC_DRAW); return b; }
  _ibuf(a) { const gl = this.gl, b = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, a, gl.STATIC_DRAW); return b; }
  // ---------- scene ----------
  setScene(d) {
    this.d = d;
    if (d.grid && !d.grid.vals) {
      const bin = atob(d.grid.data), u = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      d.grid.vals = u;
    }
    this.resetView();
    if (this.gl) this._build();
    if (this.gl) this.status = 'ready';
    this.dirty = true;
  }
  resetView() {
    if (!this.d) return;
    this.M = this.d.view.map((r) => r.slice());
    this.zoom = 1; this.dirty = true;
  }
  _inv(L) {
    const [a, b, c] = L;
    const det = a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0]);
    return [[(b[1] * c[2] - b[2] * c[1]) / det, (a[2] * c[1] - a[1] * c[2]) / det, (a[1] * b[2] - a[2] * b[1]) / det],
      [(b[2] * c[0] - b[0] * c[2]) / det, (a[0] * c[2] - a[2] * c[0]) / det, (a[2] * b[0] - a[0] * b[2]) / det],
      [(b[0] * c[1] - b[1] * c[0]) / det, (a[1] * c[0] - a[0] * c[1]) / det, (a[0] * b[1] - a[1] * b[0]) / det]];
  }
  _build() {
    const d = this.d, gl = this.gl;
    if (this.meshes[d.id]) { this.mesh = this.meshes[d.id]; return; }
    const mesh = { lines: null, iso: null, secs: [] };
    if (d.lines.length) mesh.lines = { buf: this._buf(new Float32Array([].concat(...d.lines))), n: d.lines.length * 2 };
    if (d.grid) {
      const g = d.grid, n = g.n, vals = g.vals, L = d.lattice, Li = this._inv(L);
      const at = (i, j, k) => {
        i = g.periodic[0] ? ((i % n[0]) + n[0]) % n[0] : Math.max(0, Math.min(n[0] - 1, i));
        j = g.periodic[1] ? ((j % n[1]) + n[1]) % n[1] : Math.max(0, Math.min(n[1] - 1, j));
        k = g.periodic[2] ? ((k % n[2]) + n[2]) % n[2] : Math.max(0, Math.min(n[2] - 1, k));
        return vals[(k * n[1] + j) * n[0] + i] / 255;
      };
      const cart = (f) => [f[0] * L[0][0] + f[1] * L[1][0] + f[2] * L[2][0], f[0] * L[0][1] + f[1] * L[1][1] + f[2] * L[2][1], f[0] * L[0][2] + f[1] * L[1][2] + f[2] * L[2][2]];
      // marching tetrahedra over one cell (or the cropped block), gradient normals
      const iso = d.iso, out = [];
      const cx = g.periodic[0] ? n[0] : n[0] - 1, cy = g.periodic[1] ? n[1] : n[1] - 1, cz = g.periodic[2] ? n[2] : n[2] - 1;
      const off = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
      const tets = [[0, 1, 3, 7], [0, 1, 5, 7], [0, 2, 3, 7], [0, 2, 6, 7], [0, 4, 5, 7], [0, 4, 6, 7]];
      const pv = new Float32Array(8), pp = new Array(8), pg = new Array(8);
      const pos = (i, j, k) => cart([g.origin[0] + i * g.step[0], g.origin[1] + j * g.step[1], g.origin[2] + k * g.step[2]]);
      const grad = (i, j, k) => {
        const gx = (at(i + 1, j, k) - at(i - 1, j, k)) / (2 * g.step[0]), gy = (at(i, j + 1, k) - at(i, j - 1, k)) / (2 * g.step[1]), gz = (at(i, j, k + 1) - at(i, j, k - 1)) / (2 * g.step[2]);
        return [-(Li[0][0] * gx + Li[0][1] * gy + Li[0][2] * gz), -(Li[1][0] * gx + Li[1][1] * gy + Li[1][2] * gz), -(Li[2][0] * gx + Li[2][1] * gy + Li[2][2] * gz)];
      };
      const edge = (a, b) => {
        const t = (iso - pv[a]) / (pv[b] - pv[a]), A = pp[a], B = pp[b], ga = pg[a], gb = pg[b];
        out.push(A[0] + t * (B[0] - A[0]), A[1] + t * (B[1] - A[1]), A[2] + t * (B[2] - A[2]),
          ga[0] + t * (gb[0] - ga[0]), ga[1] + t * (gb[1] - ga[1]), ga[2] + t * (gb[2] - ga[2]));
      };
      for (let k = 0; k < cz; k++) for (let j = 0; j < cy; j++) for (let i = 0; i < cx; i++) {
        let lo = 9, hi = -9;
        for (let c = 0; c < 8; c++) { const o = off[c], x = at(i + o[0], j + o[1], k + o[2]); pv[c] = x; if (x < lo) lo = x; if (x > hi) hi = x; }
        if (lo >= iso || hi < iso) continue;
        for (let c = 0; c < 8; c++) { const o = off[c]; pp[c] = pos(i + o[0], j + o[1], k + o[2]); pg[c] = grad(i + o[0], j + o[1], k + o[2]); }
        for (const tt of tets) {
          const ins = [], outs = [];
          for (const c of tt) (pv[c] >= iso ? ins : outs).push(c);
          if (ins.length === 0 || ins.length === 4) continue;
          if (ins.length === 1) { edge(ins[0], outs[0]); edge(ins[0], outs[1]); edge(ins[0], outs[2]); }
          else if (ins.length === 3) { edge(outs[0], ins[0]); edge(outs[0], ins[1]); edge(outs[0], ins[2]); }
          else { const a = ins[0], b = ins[1], c = outs[0], e = outs[1]; edge(a, c); edge(a, e); edge(b, e); edge(a, c); edge(b, e); edge(b, c); }
        }
      }
      mesh.iso = { buf: this._buf(new Float32Array(out)), n: out.length / 6 };
      // colored sections on every face of the drawing region (value >= iso), sampled from the field
      const sample = (p) => {
        const f = [Li[0][0] * p[0] + Li[1][0] * p[1] + Li[2][0] * p[2], Li[0][1] * p[0] + Li[1][1] * p[1] + Li[2][1] * p[2], Li[0][2] * p[0] + Li[1][2] * p[1] + Li[2][2] * p[2]];
        const x = [0, 1, 2].map((a) => (f[a] - g.origin[a]) / g.step[a]);
        const i0 = Math.floor(x[0]), j0 = Math.floor(x[1]), k0 = Math.floor(x[2]), u = x[0] - i0, v = x[1] - j0, w = x[2] - k0;
        return (1 - u) * (1 - v) * (1 - w) * at(i0, j0, k0) + u * (1 - v) * (1 - w) * at(i0 + 1, j0, k0) + (1 - u) * v * (1 - w) * at(i0, j0 + 1, k0) + u * v * (1 - w) * at(i0 + 1, j0 + 1, k0) +
          (1 - u) * (1 - v) * w * at(i0, j0, k0 + 1) + u * (1 - v) * w * at(i0 + 1, j0, k0 + 1) + (1 - u) * v * w * at(i0, j0 + 1, k0 + 1) + u * v * w * at(i0 + 1, j0 + 1, k0 + 1);
      };
      for (const poly of d.faces) {
        const o = poly[0], e1 = [poly[1][0] - o[0], poly[1][1] - o[1], poly[1][2] - o[2]], l1 = Math.hypot(e1[0], e1[1], e1[2]);
        const U = e1.map((x) => x / l1), e2 = [poly[2][0] - o[0], poly[2][1] - o[1], poly[2][2] - o[2]];
        let N = [U[1] * e2[2] - U[2] * e2[1], U[2] * e2[0] - U[0] * e2[2], U[0] * e2[1] - U[1] * e2[0]];
        const ln = Math.hypot(N[0], N[1], N[2]); N = N.map((x) => x / ln);
        const V = [N[1] * U[2] - N[2] * U[1], N[2] * U[0] - N[0] * U[2], N[0] * U[1] - N[1] * U[0]];
        const uv = poly.map((p) => { const q = [p[0] - o[0], p[1] - o[1], p[2] - o[2]]; return [q[0] * U[0] + q[1] * U[1] + q[2] * U[2], q[0] * V[0] + q[1] * V[1] + q[2] * V[2]]; });
        const u0 = Math.min(...uv.map((q) => q[0])), u1 = Math.max(...uv.map((q) => q[0])), v0 = Math.min(...uv.map((q) => q[1])), v1 = Math.max(...uv.map((q) => q[1]));
        const tw = Math.max(2, Math.min(512, Math.round((u1 - u0) / 0.045))), th = Math.max(2, Math.min(512, Math.round((v1 - v0) / 0.045)));
        const tex = new Uint8Array(tw * th);
        for (let b = 0; b < th; b++) for (let a = 0; a < tw; a++) {
          const su = u0 + (a + 0.5) / tw * (u1 - u0), sv = v0 + (b + 0.5) / th * (v1 - v0);
          tex[b * tw + a] = Math.round(255 * sample([o[0] + su * U[0] + sv * V[0], o[1] + su * U[1] + sv * V[1], o[2] + su * U[2] + sv * V[2]]));
        }
        const T = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, T);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, tw, th, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        const tri = [];
        for (let k = 1; k + 1 < poly.length; k++) for (const q of [0, k, k + 1]) {
          const p = poly[q];
          tri.push(p[0], p[1], p[2], (uv[q][0] - u0) / (u1 - u0), (uv[q][1] - v0) / (v1 - v0));
        }
        mesh.secs.push({ tex: T, buf: this._buf(new Float32Array(tri)), n: tri.length / 5 });
      }
    }
    this.meshes[d.id] = mesh;
    this.mesh = mesh;
  }
  // ---------- interaction: VESTA-style trackball ----------
  _rotate(ax, ay, ang) {
    const l = Math.hypot(ax, ay); if (!l || !ang) return;
    const x = ax / l, y = ay / l, c = Math.cos(ang), s = Math.sin(ang), C = 1 - c;
    const R = [[c + x * x * C, x * y * C, y * s], [x * y * C, c + y * y * C, -x * s], [-y * s, x * s, c]];
    const M = this.M, out = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) out[i][j] = R[i][0] * M[0][j] + R[i][1] * M[1][j] + R[i][2] * M[2][j];
    const nrm = (v) => { const l2 = Math.hypot(v[0], v[1], v[2]); return v.map((q) => q / l2); };
    const a = nrm(out[0]); let b = out[1]; const dt = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    b = nrm([b[0] - dt * a[0], b[1] - dt * a[1], b[2] - dt * a[2]]);
    this.M = [a, b, [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]];
    this.dirty = true;
  }
  _css(e) { const r = this.cv.getBoundingClientRect(); const k = (r.width / this.W) || 1; return [(e.clientX - r.left) / k, (e.clientY - r.top) / k]; }
  down(e) {
    if (!this.cv) return;
    this.ptr.set(e.pointerId, this._css(e));
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { }
    if (this.ptr.size === 2) { const [p, q] = [...this.ptr.values()]; this.pinch = Math.hypot(p[0] - q[0], p[1] - q[1]); }
  }
  move(e) {
    if (!this.ptr.has(e.pointerId) || !this.M) return;
    const now = this._css(e), was = this.ptr.get(e.pointerId);
    this.ptr.set(e.pointerId, now);
    if (this.ptr.size === 1) {
      const dx = now[0] - was[0], dy = now[1] - was[1];
      this._rotate(dy, dx, Math.hypot(dx, dy) * 0.0085);
    } else if (this.ptr.size === 2) {
      const [p, q] = [...this.ptr.values()], dist = Math.hypot(p[0] - q[0], p[1] - q[1]);
      if (this.pinch) this.zoomBy(dist / this.pinch);
      this.pinch = dist;
    }
  }
  up(e) { this.ptr.delete(e.pointerId); if (this.ptr.size < 2) this.pinch = 0; }
  resize(W, H) {
    if (W === this.W && H === this.H) return;
    this.W = W; this.H = H;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (this.cv) { this.cv.width = Math.round(W * dpr); this.cv.height = Math.round(H * dpr); }
    if (this.ov) { this.ov.width = Math.round(W * dpr); this.ov.height = Math.round(H * dpr); }
    this.dirty = true;
  }
  zoomBy(f) { this.zoom = Math.max(0.5, Math.min(4, this.zoom * f)); this.dirty = true; }
  key(e) {
    const step = 5 * Math.PI / 180;
    if (e.key === 'ArrowLeft') this._rotate(0, -1, step);
    else if (e.key === 'ArrowRight') this._rotate(0, 1, step);
    else if (e.key === 'ArrowUp') this._rotate(-1, 0, step);
    else if (e.key === 'ArrowDown') this._rotate(1, 0, step);
    else if (e.key === '+' || e.key === '=') this.zoomBy(1.15);
    else if (e.key === '-') this.zoomBy(1 / 1.15);
    else return false;
    return true;
  }
  // ---------- drawing ----------
  draw() {
    this.dirty = false;
    const gl = this.gl, d = this.d;
    if (!gl || !d || !this.mesh) { this._overlay(); return; }
    gl.viewport(0, 0, this.cv.width, this.cv.height);
    gl.clearColor(1, 1, 1, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const s = this.zoom * Math.min(this.W / d.width, this.H * d.aspect / d.width);
    const S = new Float32Array([2 * s / this.W, 2 * s / this.H, 1 / (d.radius * 1.25)]);
    const M = this.M, col = new Float32Array([M[0][0], M[1][0], M[2][0], M[0][1], M[1][1], M[2][1], M[0][2], M[1][2], M[2][2]]);
    const use = (P) => { gl.useProgram(P.p); gl.uniformMatrix3fv(P.loc.uM, false, col); gl.uniform3fv(P.loc.uC, d.center); gl.uniform3fv(P.loc.uS, S); gl.uniform1f(P.loc.uR, d.radius); return P; };
    // atoms
    let P = use(this.ballP);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.ball.buf); gl.enableVertexAttribArray(P.loc.aPos); gl.vertexAttribPointer(P.loc.aPos, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ball.idx);
    for (const a of d.atoms) {
      const sp = d.species[a[3]];
      gl.uniform3f(P.loc.uPos, a[0], a[1], a[2]); gl.uniform1f(P.loc.uRad, sp.r); gl.uniform3fv(P.loc.uColor, sp.rgb);
      gl.drawElements(gl.TRIANGLES, this.ball.n, gl.UNSIGNED_SHORT, 0);
    }
    // bonds: two halves in the atoms' colors
    if (d.bonds.length) {
      P = use(this.stickP);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.stick.buf); gl.enableVertexAttribArray(P.loc.aPos); gl.vertexAttribPointer(P.loc.aPos, 3, gl.FLOAT, false, 0, 0);
      for (const b of d.bonds) {
        const A = d.atoms[b[0]], B = d.atoms[b[1]], m = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2];
        const dv = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], l = Math.hypot(dv[0], dv[1], dv[2]), u0 = dv.map((x) => x / l);
        const ref = Math.abs(u0[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
        let u = [u0[1] * ref[2] - u0[2] * ref[1], u0[2] * ref[0] - u0[0] * ref[2], u0[0] * ref[1] - u0[1] * ref[0]];
        const lu = Math.hypot(u[0], u[1], u[2]); u = u.map((x) => x / lu * d.bondR);
        const w = [u0[1] * u[2] - u0[2] * u[1], u0[2] * u[0] - u0[0] * u[2], u0[0] * u[1] - u0[1] * u[0]];
        gl.uniform3fv(P.loc.uU, u); gl.uniform3fv(P.loc.uV, w);
        for (const h of [[A, 0], [B, 1]]) {
          gl.uniform3f(P.loc.uA, h[0][0], h[0][1], h[0][2]); gl.uniform3fv(P.loc.uB, m); gl.uniform3fv(P.loc.uColor, d.species[d.atoms[b[h[1]]][3]].rgb);
          gl.drawArrays(gl.TRIANGLES, 0, this.stick.n);
        }
      }
    }
    // colored sections on the region faces
    if (this.mesh.secs.length) {
      P = use(this.secP);
      gl.uniform1f(P.loc.uIso, d.iso); gl.uniform1i(P.loc.uTex, 0); gl.activeTexture(gl.TEXTURE0);
      gl.enableVertexAttribArray(P.loc.aPos); gl.enableVertexAttribArray(P.loc.aUV);
      for (const q of this.mesh.secs) {
        gl.bindTexture(gl.TEXTURE_2D, q.tex); gl.bindBuffer(gl.ARRAY_BUFFER, q.buf);
        gl.vertexAttribPointer(P.loc.aPos, 3, gl.FLOAT, false, 20, 0); gl.vertexAttribPointer(P.loc.aUV, 2, gl.FLOAT, false, 20, 12);
        gl.drawArrays(gl.TRIANGLES, 0, q.n);
      }
      gl.disableVertexAttribArray(P.loc.aUV);
    }
    // unit cell
    if (this.mesh.lines) {
      P = use(this.lineP);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.lines.buf); gl.enableVertexAttribArray(P.loc.aPos); gl.vertexAttribPointer(P.loc.aPos, 3, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.LINES, 0, this.mesh.lines.n);
    }
    // translucent yellow isosurface, tiled over the region and clipped to it
    if (this.mesh.iso && this.mesh.iso.n) {
      P = use(this.isoP);
      const pl = new Float32Array(32);
      d.planes.slice(0, 8).forEach((q, i) => pl.set(q, i * 4));
      gl.uniform4fv(P.loc.uPl, pl); gl.uniform1i(P.loc.uNp, Math.min(8, d.planes.length));
      gl.uniform3f(P.loc.uColor, 1.0, 1.0, 0.0); gl.uniform1f(P.loc.uAlpha, 0.55);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.iso.buf);
      gl.enableVertexAttribArray(P.loc.aPos); gl.vertexAttribPointer(P.loc.aPos, 3, gl.FLOAT, false, 24, 0);
      gl.enableVertexAttribArray(P.loc.aNrm); gl.vertexAttribPointer(P.loc.aNrm, 3, gl.FLOAT, false, 24, 12);
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
      for (const t of d.translations) { gl.uniform3fv(P.loc.uOff, t); gl.drawArrays(gl.TRIANGLES, 0, this.mesh.iso.n); }
      gl.depthMask(true); gl.disable(gl.BLEND);
      gl.disableVertexAttribArray(P.loc.aNrm);
    }
    this._overlay();
  }
  _project(p) {
    const d = this.d, M = this.M, C = d.center, q = [p[0] - C[0], p[1] - C[1], p[2] - C[2]];
    const s = this.zoom * Math.min(this.W / d.width, this.H * d.aspect / d.width);
    return [this.W / 2 + s * (M[0][0] * q[0] + M[0][1] * q[1] + M[0][2] * q[2]), this.H / 2 - s * (M[1][0] * q[0] + M[1][1] * q[1] + M[1][2] * q[2])];
  }
  _overlay() {
    const ov = this.ov; if (!ov) return;
    const ctx = ov.getContext('2d'), dpr = ov.width / this.W, W = this.W, H = this.H;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const mono = '"JetBrains Mono", ui-monospace, Menlo, monospace';
    if (this.status !== 'ready' || !this.d || !this.M) {
      ctx.fillStyle = '#6B665C'; ctx.font = '13px ' + mono; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(this.status === 'nogl' ? 'WebGL is not available in this browser' : this.status === 'error' ? 'could not load this file' : 'loading…', W / 2, H / 2);
      return;
    }
    const d = this.d, M = this.M;
    if (d.marker) {
      // dashed ring in the layer plane around the vacancy, and its label
      const c = d.axes[2], lc = Math.hypot(c[0], c[1], c[2]), n = c.map((x) => x / lc);
      let u = [n[1], -n[0], 0]; const lu = Math.hypot(u[0], u[1], u[2]) || 1; u = u.map((x) => x / lu);
      const v = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]], r = 1.3, P = d.marker.pos;
      ctx.save(); ctx.strokeStyle = 'rgba(20,19,17,0.85)'; ctx.lineWidth = 1.25; ctx.setLineDash([4, 3]); ctx.beginPath();
      let top = null;
      for (let k = 0; k <= 48; k++) {
        const a = k / 48 * Math.PI * 2, q = this._project([P[0] + r * (Math.cos(a) * u[0] + Math.sin(a) * v[0]), P[1] + r * (Math.cos(a) * u[1] + Math.sin(a) * v[1]), P[2] + r * (Math.cos(a) * u[2] + Math.sin(a) * v[2])]);
        if (k) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]);
        if (!top || q[1] - q[0] * 0.4 < top[1] - top[0] * 0.4) top = q;
      }
      ctx.stroke(); ctx.setLineDash([]);
      const tx = top[0] + 22, ty = top[1] - 20;
      ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.font = '600 12px ' + mono; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.92)'; ctx.strokeText(d.marker.label, tx + 4, ty);
      ctx.fillStyle = '#141311'; ctx.fillText(d.marker.label, tx + 4, ty);
      ctx.restore();
    }
    // a/b/c triad (VESTA colors), drawn back to front
    const O = [this.triX, H - this.triY], len = 24, cols = ['#D7261E', '#1E9E3A', '#2750D8'], labs = ['a', 'b', 'c'];
    const ax = d.axes.map((q, k) => {
      const l = Math.hypot(q[0], q[1], q[2]), e = q.map((x) => x / l);
      return { k: k, x: M[0][0] * e[0] + M[0][1] * e[1] + M[0][2] * e[2], y: -(M[1][0] * e[0] + M[1][1] * e[1] + M[1][2] * e[2]), z: M[2][0] * e[0] + M[2][1] * e[1] + M[2][2] * e[2] };
    }).sort((p, q) => p.z - q.z);
    ctx.save(); ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.font = 'italic 600 12px ' + mono; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const a of ax) {
      const ex = O[0] + len * a.x, ey = O[1] + len * a.y, l = Math.hypot(a.x, a.y);
      ctx.strokeStyle = cols[a.k]; ctx.fillStyle = cols[a.k];
      ctx.beginPath(); ctx.moveTo(O[0], O[1]); ctx.lineTo(ex, ey); ctx.stroke();
      if (l > 0.15) ctx.fillText(labs[a.k], O[0] + a.x / l * (len * l + 9), O[1] + a.y / l * (len * l + 9));
      else ctx.fillText(labs[a.k], O[0] + 9, O[1] - 9);
    }
    ctx.restore();
    ctx.fillStyle = '#6B665C'; ctx.font = '12px ' + mono; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(this.hint, W - 12, this.readY);
  }
};
