/* A 3D stage for the step-by-step figures. It keeps the camera, the trackball and the lighting of the figure engine
   (VestaGL) and draws things that move anew on every frame: spheres, rods and cones, lines, boxes, a map on a plane,
   points, a field as a grid of points in one cell or all through a crystal, and see-through shells. A figure sets `paint` and calls these from it.
   Lengths are in Å, colors are [r, g, b] from 0 to 1. */
const Stage3D = class extends VestaGL {
  // frame: { center, radius, width, aspect, view (three rows: screen right, screen up, toward the viewer), axes, triad }
  constructor(W, H, frame) {
    super(W, H);
    this.d = { id: 'stage', lattice: frame.axes, axes: frame.axes, species: [], atoms: [], bonds: [], lines: [], faces: [], planes: [], translations: [[0, 0, 0]],
      center: frame.center.slice(), radius: frame.radius, width: frame.width, aspect: frame.aspect, view: frame.view, triad: frame.triad };
    this.paint = null; this.tex = {}; this.bufs = {};
    this.resetView();
  }
  _init() {
    super._init();
    const gl = this.gl;
    const PREC = '#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n';
    // the same projection and lighting as the engine's own programs
    const VH = 'uniform mat3 uM; uniform vec3 uC; uniform vec3 uS; uniform float uR; varying float vFog;\n' +
      'vec4 project(vec3 w){ vec3 q = uM * (w - uC); float t = clamp((uR - q.z) / (2.0 * uR), 0.0, 1.0);\n' +
      ' vFog = 0.14 * smoothstep(0.4, 1.0, t); return vec4(q.x * uS.x, q.y * uS.y, -q.z * uS.z, 1.0); }\n';
    const LIT = 'vec3 shade(vec3 n, vec3 col, float spec){ vec3 L = normalize(vec3(-0.22, 0.30, 0.93)); vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));\n' +
      ' float d = max(dot(n, L), 0.0); float s = pow(max(dot(n, H), 0.0), 26.0); float rim = smoothstep(0.0, 0.55, n.z);\n' +
      ' return col * (0.36 + 0.64 * d) * (0.72 + 0.28 * rim) + vec3(spec * s); }\n';
    // a cone on the cylinder's vertices: the radius runs out toward the far end
    this.coneP = this._prog('attribute vec3 aPos; uniform vec3 uA; uniform vec3 uB; uniform vec3 uU; uniform vec3 uV; varying vec3 vN;\n' + VH +
      'void main(){ vec3 r = uU * aPos.x + uV * aPos.y; vN = uM * normalize(r + 0.45 * length(uU) * normalize(uB - uA)); gl_Position = project(uA + (uB - uA) * aPos.z + r * (1.0 - aPos.z)); }',
      PREC + 'varying vec3 vN; varying float vFog; uniform vec3 uColor;\n' + LIT +
      'void main(){ gl_FragColor = vec4(mix(shade(normalize(vN), uColor, 0.10), vec3(1.0), vFog), 1.0); }');
    // one flat color: lines, and the faces of boxes
    this.flatP = this._prog('attribute vec3 aPos;\n' + VH + 'uniform float uLift; void main(){ vec4 p = project(aPos); p.z -= uLift; gl_Position = p; }',
      PREC + 'varying float vFog; uniform vec4 uColor; void main(){ gl_FragColor = vec4(mix(uColor.rgb, vec3(1.0), vFog), uColor.a); }');
    // a sphere seen through: faint in the middle, stronger toward its outline
    this.shellP = this._prog('attribute vec3 aPos; uniform vec3 uPos; uniform float uRad; varying vec3 vN;\n' + VH +
      'void main(){ vN = uM * aPos; gl_Position = project(uPos + aPos * uRad); }',
      PREC + 'varying vec3 vN; varying float vFog; uniform vec4 uColor; uniform vec2 uRim;\n' +
      'void main(){ float e = 1.0 - abs(normalize(vN).z); gl_FragColor = vec4(uColor.rgb, uColor.a * (uRim.x + (1.0 - uRim.x) * pow(e, uRim.y))); }');
    // a map on a plane: two textures mixed, a grid over them, fading with distance from a point, fainter outside a rectangle
    this.mapP = this._prog('attribute vec3 aPos; attribute vec2 aUV; varying vec2 vUV; varying vec3 vW;\n' + VH +
      'void main(){ vUV = aUV; vW = aPos; gl_Position = project(aPos); }',
      PREC + 'varying vec2 vUV; varying vec3 vW; varying float vFog; uniform sampler2D uA; uniform sampler2D uB; uniform sampler2D uG;\n' +
      'uniform float uMix; uniform float uAlpha; uniform float uGA; uniform vec3 uFadeC; uniform vec2 uFade; uniform vec4 uIn; uniform float uOut;\n' +
      'void main(){ vec4 c = mix(texture2D(uA, vUV), texture2D(uB, vUV), uMix);\n' +
      ' if (uGA > 0.0) { vec4 g = texture2D(uG, vUV); c.rgb = mix(c.rgb, g.rgb, g.a * uGA); }\n' +
      ' float a = uAlpha; if (uFade.y > 0.0) a *= 1.0 - smoothstep(uFade.x, uFade.y, distance(vW, uFadeC));\n' +
      ' if (vUV.x < uIn.x || vUV.x > uIn.z || vUV.y < uIn.y || vUV.y > uIn.w) a *= uOut;\n' +
      ' if (a < 0.004) discard; gl_FragColor = vec4(mix(c.rgb, vec3(1.0), vFog), a); }');
    // points, each with its own color
    this.dotP = this._prog('attribute vec3 aPos; attribute vec3 aCol; uniform float uSize; varying vec3 vCol;\n' + VH +
      'void main(){ vCol = aCol; vec4 p = project(aPos); p.z -= 0.004; gl_Position = p; gl_PointSize = uSize; }',
      PREC + 'varying vec3 vCol; varying float vFog; uniform float uAlpha;\n' +
      'void main(){ vec2 q = gl_PointCoord - 0.5; if (dot(q, q) > 0.25) discard; gl_FragColor = vec4(vCol, uAlpha); }');
    // A field on a grid, one point per grid point: larger, darker and more solid where its value (0 to 1) is high. The
    // highest values come in first as uShow goes from 0 to 1. Points inside a box (given in grid points, and wrapping
    // around the cell as the crystal does) take another color.
    const ROUND = 'float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;';
    const quiet = (vs, fs) => { try { return this._prog(vs, fs); } catch (err) { return null; } };   // a device that refuses one of these still gets the rest of the picture
    this.gridP = quiet('attribute vec3 aPos; attribute float aVal;\n' + VH +
      'uniform float uSize; uniform float uShow; uniform float uAlpha; uniform vec4 uBox; uniform vec2 uBoxA; uniform vec2 uGrid; uniform vec3 uLow; uniform vec3 uHigh; uniform vec3 uBoxCol; varying vec4 vCol;\n' +
      'void main(){ float t = aVal; float vis = clamp((uShow * 1.2 - (1.0 - t)) / 0.2, 0.0, 1.0);\n' +
      ' vec3 dd = abs(mod(aPos / uGrid.x - uBox.xyz + 0.5 * uGrid.y, uGrid.y) - 0.5 * uGrid.y);\n' +
      ' float inb = uBox.w < 0.0 ? 0.0 : uBoxA.x * step(max(dd.x, max(dd.y, dd.z)), uBox.w + 0.25);\n' +
      ' float base = 0.02 + 0.98 * pow(t, 2.6); float a = uAlpha * vis * mix(base, max(uBoxA.y, base), inb);\n' +
      ' vCol = vec4(mix(mix(uLow, uHigh, t), uBoxCol, inb), a); vec4 p = project(aPos); p.z -= 0.002;\n' +
      ' gl_Position = a > 0.004 ? p : vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = uSize * mix(0.34 + 0.66 * t, max(0.34 + 0.4 * uBoxA.y, 0.34 + 0.66 * t), inb); }',
      PREC + 'varying vec4 vCol;\nvoid main(){ ' + ROUND + ' gl_FragColor = vec4(vCol.rgb, vCol.a * smoothstep(0.5, 0.34, d)); }');
    // A field at points all through a crystal. Each point carries four values, two fields (uSrc picks one) in two
    // states each (uFlip mixes them), and shows where that value is high (uGate): larger, more solid, and in the color
    // of the value. The points repeat with the period uL and are shown around uQ, fading out with distance from it;
    // uShow lets them come in a few at a time.
    this.cloudP = quiet('attribute vec3 aPos; attribute vec4 aVal; attribute float aRnd;\n' + VH +
      'uniform vec3 uQ; uniform float uL; uniform vec2 uFade; uniform float uFlip; uniform float uSrc; uniform float uShow; uniform float uSize; uniform float uAlpha; uniform vec2 uGate; varying vec4 vCol;\n' +
      'vec3 ramp(float t){ t = clamp(t, 0.0, 1.0); vec3 c = t < 0.25 ? vec3(0.0, t / 0.25, 1.0) : t < 0.5 ? vec3(0.0, 1.0, 1.0 - (t - 0.25) / 0.25) : t < 0.75 ? vec3((t - 0.5) / 0.25, 1.0, 0.0) : vec3(1.0, 1.0 - (t - 0.75) / 0.25, 0.0); return (c + (1.0 - c) * 0.14) * vec3(0.97, 0.93, 0.97); }\n' +
      'void main(){ vec3 w = uQ + mod(aPos - uQ + 0.5 * uL, uL) - 0.5 * uL;\n' +
      ' float v = mix(mix(aVal.x, aVal.y, uFlip), mix(aVal.z, aVal.w, uFlip), uSrc); float t = smoothstep(uGate.x, uGate.y, v);\n' +
      ' float a = uAlpha * (1.0 - smoothstep(uFade.x, uFade.y, distance(w, uQ))) * (0.04 + 0.62 * pow(t, 1.3)) * step(aRnd, uShow) * step(0.001, t);\n' +
      ' vec4 p = project(w); p.z -= 0.002; vCol = vec4(mix(ramp(v), vec3(1.0), 3.0 * vFog), a);\n' +
      ' gl_Position = a > 0.004 ? p : vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = uSize * (0.32 + 0.52 * t); }',
      PREC + 'varying vec4 vCol;\nvoid main(){ ' + ROUND + ' vec3 c = mix(vCol.rgb, vCol.rgb * 0.8, smoothstep(0.22, 0.47, d)); gl_FragColor = vec4(c, vCol.a * smoothstep(0.5, 0.4, d)); }');
    this.quad = gl.createBuffer(); this.scratch = gl.createBuffer();
  }
  // ---------- one frame ----------
  draw() {
    this.dirty = false;
    const gl = this.gl, d = this.d;
    if (!gl || !d || !this.M) { this._overlay(); return; }
    gl.viewport(0, 0, this.cv.width, this.cv.height);
    gl.disable(gl.SCISSOR_TEST); gl.disable(gl.BLEND); gl.depthMask(true);
    gl.clearColor(1, 1, 1, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const s = this.scale(), M = this.M;
    this._S = new Float32Array([2 * s / this.W, 2 * s / this.H, 1 / (d.radius * 1.25)]);
    this._col = new Float32Array([M[0][0], M[1][0], M[2][0], M[0][1], M[1][1], M[2][1], M[0][2], M[1][2], M[2][2]]);
    this._cur = null;
    if (this.paint) this.paint(this);
    gl.disable(gl.SCISSOR_TEST); gl.disable(gl.BLEND); gl.depthMask(true);
    this._overlay();
  }
  scale() { const d = this.d; return this.zoom * Math.min(this.W / d.width, this.H * d.aspect / d.width); }   // pixels per Å
  _use(P) {
    const gl = this.gl;
    if (this._cur !== P) {
      gl.useProgram(P.p); gl.uniformMatrix3fv(P.loc.uM, false, this._col); gl.uniform3fv(P.loc.uC, this.d.center); gl.uniform3fv(P.loc.uS, this._S); gl.uniform1f(P.loc.uR, this.d.radius);
      this._cur = P;
    }
    return P;
  }
  // how the next things are laid over what is there: solid, or see-through by a (for the programs with no alpha of their own)
  solid() { const gl = this.gl; gl.disable(gl.BLEND); gl.depthMask(true); }
  thin(a) { const gl = this.gl; gl.enable(gl.BLEND); gl.blendColor(0, 0, 0, a); gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA); gl.depthMask(false); }
  blend(depth) { const gl = this.gl; gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(!!depth); }
  // only the part of the picture between two fractions of its width is drawn (for a line wiped across it)
  between(x0, x1) { const gl = this.gl, w = this.cv.width; gl.enable(gl.SCISSOR_TEST); gl.scissor(Math.round(w * x0), 0, Math.max(0, Math.round(w * x1) - Math.round(w * x0)), this.cv.height); }
  everywhere() { this.gl.disable(this.gl.SCISSOR_TEST); }

  // ---------- things to draw ----------
  sphere(p, r, rgb) {
    const gl = this.gl, P = this._use(this.ballP);
    this.solid();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.ball.buf); gl.enableVertexAttribArray(P.loc.aPos); gl.vertexAttribPointer(P.loc.aPos, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ball.idx);
    gl.uniform3f(P.loc.uPos, p[0], p[1], p[2]); gl.uniform1f(P.loc.uRad, r); gl.uniform3fv(P.loc.uColor, rgb);
    gl.drawElements(gl.TRIANGLES, this.ball.n, gl.UNSIGNED_SHORT, 0);
  }
  shell(p, r, rgb, a, rim, power) {
    const gl = this.gl, P = this._use(this.shellP);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.ball.buf); gl.enableVertexAttribArray(P.loc.aPos); gl.vertexAttribPointer(P.loc.aPos, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ball.idx);
    gl.uniform3f(P.loc.uPos, p[0], p[1], p[2]); gl.uniform1f(P.loc.uRad, r); gl.uniform4f(P.loc.uColor, rgb[0], rgb[1], rgb[2], a); gl.uniform2f(P.loc.uRim, rim == null ? 0.16 : rim, power || 1.7);
    this.blend(false); gl.drawElements(gl.TRIANGLES, this.ball.n, gl.UNSIGNED_SHORT, 0);
  }
  _between(P, a, b, r) {
    const gl = this.gl, dv = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l = Math.hypot(dv[0], dv[1], dv[2]) || 1e-9, u0 = dv.map((x) => x / l);
    const ref = Math.abs(u0[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
    let u = [u0[1] * ref[2] - u0[2] * ref[1], u0[2] * ref[0] - u0[0] * ref[2], u0[0] * ref[1] - u0[1] * ref[0]];
    const lu = Math.hypot(u[0], u[1], u[2]); u = u.map((x) => x / lu * r);
    const w = [u0[1] * u[2] - u0[2] * u[1], u0[2] * u[0] - u0[0] * u[2], u0[0] * u[1] - u0[1] * u[0]];
    gl.bindBuffer(gl.ARRAY_BUFFER, this.stick.buf); gl.enableVertexAttribArray(P.loc.aPos); gl.vertexAttribPointer(P.loc.aPos, 3, gl.FLOAT, false, 0, 0);
    gl.uniform3fv(P.loc.uU, u); gl.uniform3fv(P.loc.uV, w); gl.uniform3f(P.loc.uA, a[0], a[1], a[2]); gl.uniform3f(P.loc.uB, b[0], b[1], b[2]);
  }
  rod(a, b, r, rgb) { const gl = this.gl, P = this._use(this.stickP); this.solid(); this._between(P, a, b, r); gl.uniform3fv(P.loc.uColor, rgb); gl.drawArrays(gl.TRIANGLES, 0, this.stick.n); }
  cone(a, b, r, rgb) { const gl = this.gl, P = this._use(this.coneP); this.solid(); this._between(P, a, b, r); gl.uniform3fv(P.loc.uColor, rgb); gl.drawArrays(gl.TRIANGLES, 0, this.stick.n); }
  // an arrow through c along the unit vector dir, len long
  arrow(c, dir, len, r, rgb) {
    const head = Math.min(len * 0.42, r * 5.5), h = len / 2;
    const tail = [c[0] - dir[0] * h, c[1] - dir[1] * h, c[2] - dir[2] * h], neck = [c[0] + dir[0] * (h - head), c[1] + dir[1] * (h - head), c[2] + dir[2] * (h - head)], tip = [c[0] + dir[0] * h, c[1] + dir[1] * h, c[2] + dir[2] * h];
    this.rod(tail, neck, r, rgb); this.cone(neck, tip, r * 2.5, rgb);
  }
  _flat(pos, mode, rgb, a, lift) {
    const gl = this.gl, P = this._use(this.flatP);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.scratch); gl.bufferData(gl.ARRAY_BUFFER, pos instanceof Float32Array ? pos : new Float32Array(pos), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(P.loc.aPos); gl.vertexAttribPointer(P.loc.aPos, 3, gl.FLOAT, false, 0, 0);
    gl.uniform4f(P.loc.uColor, rgb[0], rgb[1], rgb[2], a); gl.uniform1f(P.loc.uLift, lift || 0);
    if (a < 0.999) this.blend(false); else this.solid();
    gl.drawArrays(mode, 0, pos.length / 3);
  }
  lines(pos, rgb, a) { this._flat(pos, this.gl.LINES, rgb, a == null ? 1 : a, 0.002); }
  path(pos, rgb, a) { this._flat(pos, this.gl.LINE_STRIP, rgb, a == null ? 1 : a, 0.002); }
  // a box between two corners: see-through faces and its twelve edges
  box(lo, hi, rgb, face, edge) {
    const [x0, y0, z0] = lo, [x1, y1, z1] = hi, c = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]];
    if (face > 0) { const t = []; for (const q of [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [3, 2, 6, 7], [0, 3, 7, 4], [1, 2, 6, 5]]) for (const k of [0, 1, 2, 0, 2, 3]) t.push(...c[q[k]]); this._flat(t, this.gl.TRIANGLES, rgb, face, 0); }
    if (edge > 0) { const e = []; for (const q of [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]) e.push(...c[q[0]], ...c[q[1]]); this.lines(e, rgb, edge); }
  }
  // a texture from a canvas; `again` uploads it afresh (the canvas was redrawn)
  texture(key, canvas, repeat, again) {
    const gl = this.gl;
    let t = this.tex[key];
    if (t && !again) return t;
    if (!t) t = this.tex[key] = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const wrap = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;   // repeating needs a canvas whose sides are powers of two
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    return t;
  }
  // a map on the parallelogram o, o + eu, o + ev (and their sum); uv runs from uv0 to uv1 across it
  map(o, eu, ev, uv0, uv1, opt) {
    const gl = this.gl, P = this._use(this.mapP), c = [o, [o[0] + eu[0], o[1] + eu[1], o[2] + eu[2]], [o[0] + eu[0] + ev[0], o[1] + eu[1] + ev[1], o[2] + eu[2] + ev[2]], [o[0] + ev[0], o[1] + ev[1], o[2] + ev[2]]];
    const uv = [[uv0[0], uv0[1]], [uv1[0], uv0[1]], [uv1[0], uv1[1]], [uv0[0], uv1[1]]], v = [];
    for (const k of [0, 1, 2, 0, 2, 3]) v.push(c[k][0], c[k][1], c[k][2], uv[k][0], uv[k][1]);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(P.loc.aPos); gl.vertexAttribPointer(P.loc.aPos, 3, gl.FLOAT, false, 20, 0);
    gl.enableVertexAttribArray(P.loc.aUV); gl.vertexAttribPointer(P.loc.aUV, 2, gl.FLOAT, false, 20, 12);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, opt.a); gl.uniform1i(P.loc.uA, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, opt.b || opt.a); gl.uniform1i(P.loc.uB, 1);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, opt.grid || opt.a); gl.uniform1i(P.loc.uG, 2);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1f(P.loc.uMix, opt.mix || 0); gl.uniform1f(P.loc.uAlpha, opt.alpha == null ? 1 : opt.alpha); gl.uniform1f(P.loc.uGA, opt.grid ? (opt.gridAlpha == null ? 1 : opt.gridAlpha) : 0);
    const fc = opt.fadeCenter || [0, 0, 0], fd = opt.fade || [0, 0], inside = opt.inside || [-1e6, -1e6, 1e6, 1e6];
    gl.uniform3f(P.loc.uFadeC, fc[0], fc[1], fc[2]); gl.uniform2f(P.loc.uFade, fd[0], fd[1]); gl.uniform4f(P.loc.uIn, inside[0], inside[1], inside[2], inside[3]); gl.uniform1f(P.loc.uOut, opt.outside == null ? 1 : opt.outside);
    this.blend(!!opt.depth);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.disableVertexAttribArray(P.loc.aUV);
  }
  // points: `data` holds x, y, z, r, g, b for each; the first n are drawn, `size` pixels across
  dots(key, data, n, size, a) {
    const gl = this.gl, P = this._use(this.dotP);
    let b = this.bufs[key];
    if (!b) { b = this.bufs[key] = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); } else gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.enableVertexAttribArray(P.loc.aPos); gl.vertexAttribPointer(P.loc.aPos, 3, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(P.loc.aCol); gl.vertexAttribPointer(P.loc.aCol, 3, gl.FLOAT, false, 24, 12);
    gl.uniform1f(P.loc.uSize, size * Math.min(2, window.devicePixelRatio || 1)); gl.uniform1f(P.loc.uAlpha, a == null ? 1 : a);
    this.blend(false); gl.drawArrays(gl.POINTS, 0, n);
    gl.disableVertexAttribArray(P.loc.aCol);
  }
  _kept(key, data) {
    const gl = this.gl;
    let b = this.bufs[key];
    if (!b) { b = this.bufs[key] = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); } else gl.bindBuffer(gl.ARRAY_BUFFER, b);
    return b;
  }
  // a field on a grid as points: `data` holds x, y, z and a value from 0 to 1 for each of the n points.
  // o: size (px of the largest point), show, alpha, step (Å between points), period (points per cell edge),
  //    low and high (colors), box ([i, j, k, half-width in points], half-width below 0 for none), boxColor,
  //    boxAlpha (how far the points in the box take its color), boxMin (how solid the faintest of them is)
  grid(key, data, n, o) {
    if (!this.gridP) return;
    const gl = this.gl, P = this._use(this.gridP), box = o.box || [0, 0, 0, -1], bc = o.boxColor || [1, 0.5, 0];
    this._kept(key, data);
    gl.enableVertexAttribArray(P.loc.aPos); gl.vertexAttribPointer(P.loc.aPos, 3, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(P.loc.aVal); gl.vertexAttribPointer(P.loc.aVal, 1, gl.FLOAT, false, 16, 12);
    gl.uniform1f(P.loc.uSize, o.size * Math.min(2, window.devicePixelRatio || 1)); gl.uniform1f(P.loc.uShow, o.show == null ? 1 : o.show); gl.uniform1f(P.loc.uAlpha, o.alpha == null ? 1 : o.alpha);
    gl.uniform2f(P.loc.uGrid, o.step, o.period); gl.uniform3fv(P.loc.uLow, o.low); gl.uniform3fv(P.loc.uHigh, o.high);
    gl.uniform4f(P.loc.uBox, box[0], box[1], box[2], box[3]); gl.uniform2f(P.loc.uBoxA, o.boxAlpha == null ? 1 : o.boxAlpha, o.boxMin == null ? 0.6 : o.boxMin); gl.uniform3fv(P.loc.uBoxCol, bc);
    this.blend(false); gl.drawArrays(gl.POINTS, 0, n);
    gl.disableVertexAttribArray(P.loc.aVal);
  }
  // a field at points through a crystal: `data` holds x, y, z, four values from 0 to 1 and a random number from 0 to 1 for each.
  // o: at (the point they are shown around), period (Å), fade ([from, to] distances from it), flip, src, show,
  //    size (px of the largest point), alpha, gate ([from, to]: the values between which a point comes up)
  cloud(key, data, n, o) {
    if (!this.cloudP) return;
    const gl = this.gl, P = this._use(this.cloudP);
    this._kept(key, data);
    gl.enableVertexAttribArray(P.loc.aPos); gl.vertexAttribPointer(P.loc.aPos, 3, gl.FLOAT, false, 32, 0);
    gl.enableVertexAttribArray(P.loc.aVal); gl.vertexAttribPointer(P.loc.aVal, 4, gl.FLOAT, false, 32, 12);
    gl.enableVertexAttribArray(P.loc.aRnd); gl.vertexAttribPointer(P.loc.aRnd, 1, gl.FLOAT, false, 32, 28);
    gl.uniform3fv(P.loc.uQ, o.at); gl.uniform1f(P.loc.uL, o.period); gl.uniform2f(P.loc.uFade, o.fade[0], o.fade[1]);
    gl.uniform1f(P.loc.uFlip, o.flip || 0); gl.uniform1f(P.loc.uSrc, o.src || 0); gl.uniform1f(P.loc.uShow, o.show == null ? 1 : o.show);
    gl.uniform1f(P.loc.uSize, o.size * Math.min(2, window.devicePixelRatio || 1)); gl.uniform1f(P.loc.uAlpha, o.alpha == null ? 1 : o.alpha); gl.uniform2f(P.loc.uGate, o.gate[0], o.gate[1]);
    this.blend(false); gl.drawArrays(gl.POINTS, 0, n);
    gl.disableVertexAttribArray(P.loc.aVal); gl.disableVertexAttribArray(P.loc.aRnd);
  }
  // The isosurface (and its level control) of a scene in the figures' own format, built by the engine and kept.
  meshOf(scene) {
    if (scene.grid && !scene.grid.vals) { const bin = atob(scene.grid.data), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); scene.grid.vals = u; }
    const keep = this.d, km = this.mesh;
    this.d = scene; this._build();
    const m = this.mesh;
    this.d = keep; this.mesh = km;
    return m;
  }
  surface(mesh, planes, rgb, a, offset) {
    if (!mesh || !mesh.iso || !mesh.iso.n) return;
    const gl = this.gl, P = this._use(this.isoP), pl = new Float32Array(32);
    (planes || []).slice(0, 8).forEach((q, i) => pl.set(q, i * 4));
    gl.uniform4fv(P.loc.uPl, pl); gl.uniform1i(P.loc.uNp, Math.min(8, (planes || []).length));
    gl.uniform3fv(P.loc.uColor, rgb); gl.uniform1f(P.loc.uAlpha, a); gl.uniform3fv(P.loc.uOff, offset || [0, 0, 0]);
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.iso.buf);
    gl.enableVertexAttribArray(P.loc.aPos); gl.vertexAttribPointer(P.loc.aPos, 3, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(P.loc.aNrm); gl.vertexAttribPointer(P.loc.aNrm, 3, gl.FLOAT, false, 24, 12);
    // nearest layer only: depth first, then color where the depth matches
    gl.disable(gl.BLEND); gl.depthMask(true); gl.colorMask(false, false, false, false); gl.drawArrays(gl.TRIANGLES, 0, mesh.iso.n); gl.colorMask(true, true, true, true);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); gl.depthFunc(gl.LEQUAL);
    gl.drawArrays(gl.TRIANGLES, 0, mesh.iso.n);
    gl.depthFunc(gl.LESS); gl.depthMask(true); gl.disable(gl.BLEND); gl.disableVertexAttribArray(P.loc.aNrm);
  }

  // ---------- from the screen into the scene ----------
  // where the line of sight through a pointer event meets the plane through p0 with normal n; null when the plane is seen edge-on
  onPlane(e, p0, n) {
    const r = this.cv.getBoundingClientRect(), k = (r.width / this.W) || 1, s = this.scale(), M = this.M, C = this.d.center;
    const a = ((e.clientX - r.left) / k - this.W / 2) / s, b = -((e.clientY - r.top) / k - this.H / 2) / s;
    const o = [C[0] + a * M[0][0] + b * M[1][0], C[1] + a * M[0][1] + b * M[1][1], C[2] + a * M[0][2] + b * M[1][2]], z = M[2];
    const den = n[0] * z[0] + n[1] * z[1] + n[2] * z[2];
    if (Math.abs(den) < 0.12) return null;
    const t = (n[0] * (p0[0] - o[0]) + n[1] * (p0[1] - o[1]) + n[2] * (p0[2] - o[2])) / den;
    return [o[0] + t * z[0], o[1] + t * z[1], o[2] + t * z[2]];
  }
  screen(p) { return this._project(p); }   // a point of the scene in CSS pixels of the stage
};
