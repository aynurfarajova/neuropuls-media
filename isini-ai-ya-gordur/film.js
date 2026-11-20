// NeuroPuls: Gündəlik işini AI-a gördür. Isometric low-poly 3D (three.js) + 2D text layer. Pure function of time.
import * as M from './lib/motion.js';
import * as G from './lib/gl.js';
import TX from './lang.js';
const { THREE } = G;
const { W, H, FORMAT, E, prog, lerp, springU, SPRING, font, fill } = M;
const C = { ink: '#0F1516', blue: '#5FCBEF', orange: '#D97757', ivory: '#F7F2E8' };
const SC = [0, 3.8, 8.3, 13.8, 19.8, 25, 29];
const sm = (x) => x * x * (3 - 2 * x);
const P = (t, a, b) => sm(prog(t, a, b));
const c01 = (x) => Math.min(1, Math.max(0, x));
const BPM = 124, BEAT = 60 / BPM;

// ---------------------------------------------------------------- 2-D text
function parse(line) { return line.split('*').map((s, i) => [s, i % 2 ? C.orange : C.ink]).filter((s) => s[0]); }
function lineW(ctx, segs) { return segs.reduce((a, s) => a + ctx.measureText(s[0]).width, 0); }
function drawLines(ctx, lines, t, t0, t1, base, y0) {
  ctx.textBaseline = 'alphabetic';
  const s = FORMAT.safe;
  ctx.font = font(base, 800, 'Display');
  const maxw = Math.max(...lines.map((l) => lineW(ctx, parse(l))));
  const size = Math.min(base, base * s.w / maxw);
  ctx.font = font(size, 800, 'Display');
  const out = E.outQuint(prog(t, t1 - 0.3, t1));
  lines.forEach((l, k) => {
    const a = k * 0.09;
    const p = E.outBack(prog(t, t0 + a, t0 + a + 0.55), 1.3);
    if (p <= 0) return;
    const alpha = Math.min(1, p * 1.6) * (1 - out);
    const segs = parse(l);
    let x = W / 2 - lineW(ctx, segs) / 2;
    const y = y0 + size + k * size * 1.16 + (1 - p) * 60 - out * 30;
    ctx.globalAlpha = Math.max(0, alpha);
    for (const [str, col] of segs) { ctx.fillStyle = col; ctx.textAlign = 'left'; ctx.fillText(str, x, y); x += ctx.measureText(str).width; }
    ctx.globalAlpha = 1;
  });
}

// ---------------------------------------------------------------- 3-D set (isometric, flat-shaded low-poly)
const lp = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, flatShading: true });
const D = [Math.SQRT1_2, 0, -Math.SQRT1_2]; // chain axis: horizontal on screen
const at = (s) => [D[0] * s - 0.4, 0, D[2] * s - 0.4]; // chain sits toward the back of the platform
const CHAIN = [-1.7, 0, 1.7];
const SH = 1.15; // how far the scene sits below the view centre (world units)

function buildSet() {
  const scene = new THREE.Scene();
  scene.environment = G.ENV;
  const cam = G.camera(18);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xf0e2cc, 0.85));
  const key = new THREE.DirectionalLight(0xfff1de, 2.2); key.position.set(-4, 8, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xbfe9f8, 1.0); rim.position.set(6, 3, -3); scene.add(rim);
  const root = new THREE.Group(); scene.add(root);
  const mk = (geo, mat, parent = root) => { const m = new THREE.Mesh(geo, mat); parent.add(m); return m; };
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const ico = (r, dt = 0) => new THREE.IcosahedronGeometry(r, dt);

  // ---- platform: base slab + 7 hex tiles
  const slab = mk(new THREE.CylinderGeometry(2.5, 2.65, 0.4, 6), lp('#8FC0D6')); slab.position.y = -0.2;
  const tiles = [[0, 0]];
  for (let k = 0; k < 6; k++) { const a = ((30 + 60 * k) * Math.PI) / 180; tiles.push([Math.sin(a) * 1.22, Math.cos(a) * 1.22]); }
  const tileM = tiles.map(() => lp('#DCEFF6'));
  const tileMesh = tiles.map(([x, z], i) => { const m = mk(new THREE.CylinderGeometry(0.67, 0.67, 0.12, 6), tileM[i]); m.position.set(x, 0.06, z); return m; });
  // ---- blocks (chain)
  const blockCols = [C.blue, C.orange, C.blue];
  const icons = [ico(0.17, 0), new THREE.ConeGeometry(0.2, 0.34, 4), new THREE.OctahedronGeometry(0.2), new THREE.TorusGeometry(0.15, 0.06, 5, 8)];
  const blocks = CHAIN.map((s, i) => {
    const g = new THREE.Group(); root.add(g);
    mk(new THREE.CylinderGeometry(0.55, 0.62, 0.62, 8), lp(blockCols[i]), g).position.y = 0.31;
    const ic = mk(icons[i], lp(i === 3 ? C.orange : C.ink), g); ic.position.y = 0.82; ic.userData.base = 0.82;
    const [x, , z] = at(s); g.position.set(x, 0.12, z); g.userData = { s, ic };
    return g;
  });
  const linkM = lp('#B8AD97');
  const links = [0, 1].map((i) => { const m = mk(box(1, 0.1, 0.16), linkM); const s = (CHAIN[i] + CHAIN[i + 1]) / 2; const [x, , z] = at(s); m.position.set(x, 0.3, z); m.rotation.y = Math.atan2(-D[2], D[0]) * 1 + 0; m.userData.len = CHAIN[i + 1] - CHAIN[i] - 1.05; return m; });
  // crates riding the chain
  const crates = [0, 1, 2, 3, 4].map((i) => mk(box(0.26, 0.26, 0.26), lp(i % 2 ? C.orange : C.blue)));
  // pulse spark for S3
  const spark = mk(ico(0.16, 0), lp(C.orange));

  // ---- person (flat boxes)
  const person = new THREE.Group(); root.add(person);
  const skin = lp('#F1C7A8'), shirt = lp(C.ink), pants = lp('#52606A');
  const torso = mk(box(0.5, 0.7, 0.32), shirt, person); torso.position.y = 0.9;
  const head = mk(ico(0.27, 1), skin, person); head.position.y = 1.5;
  const hair = mk(new THREE.SphereGeometry(0.28, 7, 4, 0, Math.PI * 2, 0, Math.PI * 0.5), lp('#3A2E27'), person); hair.position.y = 1.54;
  const mkLimb = (w, h, d, mat, px, py) => { const g = new THREE.Group(); g.position.set(px, py, 0); person.add(g); const m = mk(box(w, h, d), mat, g); m.position.y = -h / 2; return g; };
  const armL = mkLimb(0.16, 0.62, 0.16, skin, -0.34, 1.18), armR = mkLimb(0.16, 0.62, 0.16, skin, 0.34, 1.18);
  const legL = mkLimb(0.2, 0.6, 0.2, pants, -0.13, 0.58), legR = mkLimb(0.2, 0.6, 0.2, pants, 0.13, 0.58);
  const carry = mk(box(0.34, 0.34, 0.34), lp(C.orange), person);
  // chair + cup
  const chair = new THREE.Group(); root.add(chair);
  mk(box(0.8, 0.12, 0.8), lp(C.orange), chair).position.y = 0.42;
  const cb = mk(box(0.8, 0.8, 0.12), lp(C.orange), chair); cb.position.set(0, 0.82, -0.4);
  [[-0.34, -0.34], [0.34, -0.34], [-0.34, 0.34], [0.34, 0.34]].forEach(([x, z]) => { mk(box(0.08, 0.4, 0.08), lp('#8C5A47'), chair).position.set(x, 0.2, z); });
  // piles for S2
  const pileA = [0, 1, 2].map((i) => mk(box(0.34, 0.34, 0.34), lp(C.blue)));
  const pileB = mk(box(0.34, 0.34, 0.34), lp(C.orange));

  // ---- robot
  const robot = new THREE.Group(); root.add(robot);
  mk(ico(0.5, 1), lp(C.blue), robot).position.y = 0.62;
  const eyeM = lp(C.ink);
  const eL = mk(box(0.1, 0.16, 0.06), eyeM, robot), eR = mk(box(0.1, 0.16, 0.06), eyeM, robot);
  eL.position.set(-0.17, 0.72, 0.46); eR.position.set(0.17, 0.72, 0.46);
  const ant = mk(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 5), eyeM, robot); ant.position.y = 1.3;
  const antB = mk(ico(0.09, 0), lp(C.orange), robot); antB.position.y = 1.5;
  const rArmL = new THREE.Group(), rArmR = new THREE.Group(); robot.add(rArmL, rArmR);
  rArmL.position.set(-0.52, 0.62, 0); rArmR.position.set(0.52, 0.62, 0);
  mk(box(0.12, 0.45, 0.12), lp('#7ad3f0'), rArmL).position.y = -0.2; mk(box(0.12, 0.45, 0.12), lp('#7ad3f0'), rArmR).position.y = -0.2;

  // ---- tangled "code" knot (S5)
  const knot = mk(new THREE.TorusKnotGeometry(0.42, 0.11, 40, 6), lp('#8E9AA0'));
  // ---- sparkles
  const sparks = [0, 1, 2, 3, 4, 5].map((i) => mk(new THREE.OctahedronGeometry(0.1), lp(i % 2 ? C.blue : C.orange)));

  return {
    scene, camera: cam,
    update(t) {
      // camera: isometric, slow sway
      const az = Math.PI / 4 + Math.sin(t * 0.35) * 0.07, el = 0.62, dist = 31;
      const tx = 0, ty = 0.9 + SH * 0.62, tz = 0; // look-at pushed up => scene sits lower in frame
      cam.position.set(tx + Math.sin(az) * Math.cos(el) * dist, ty + Math.sin(el) * dist, tz + Math.cos(az) * Math.cos(el) * dist);
      cam.up.set(0, 1, 0); cam.lookAt(tx, ty, tz);
      cam.position.y += 0; // (kept pure)

      const rp = 1 - P(t, 24.6, 25.0);
      root.scale.setScalar(Math.max(rp, 1e-3));
      // platform pops in
      const pk = springU(t, 0.05, SPRING.bouncy);
      slab.scale.setScalar(Math.max(pk, 1e-3)); slab.position.y = -0.2 - (1 - pk) * 0.8;
      tiles.forEach((_, i) => {
        const k = springU(t, 0.15 + i * 0.07, SPRING.bouncy); tileMesh[i].scale.set(Math.max(k, 1e-3), Math.max(k, 1e-3), Math.max(k, 1e-3));
        const gl = P(t, 21.2 + i * 0.28, 21.8 + i * 0.28);
        tileM[i].color.set('#DCEFF6').lerp(new THREE.Color(C.blue), gl * 0.8);
        tileM[i].emissive.set(C.blue).multiplyScalar(0.45 * gl);
      });

      // ---- S1 hook: blocks drop on the tiles in sequence
      const blockHide1 = 1 - P(t, SC[1] - 0.25, SC[1]); // they leave when scene 2 starts
      const showChain = t >= SC[2] - 0.2 ? 1 : 0;
      blocks.forEach((g, i) => {
        let k;
        if (t < SC[2] - 0.2) { // S1 drop-in, then hide for S2
          const t0 = 0.45 + i * 0.5, dp = prog(t, t0, t0 + 0.55);
          const y = (1 - E.outQuint(dp)) * 5;
          k = dp > 0 ? 1 : 0;
          g.position.y = 0.12 + y; g.scale.setScalar(Math.max(k * blockHide1, 1e-3));
        } else { // S3+ pop in staggered
          const kk = springU(t, SC[2] + 0.15 + i * 0.28, SPRING.bouncy);
          g.position.y = 0.12; g.scale.setScalar(Math.max(kk, 1e-3));
        }
        const ic = g.userData.ic; ic.rotation.y = t * 1.4 + i; ic.position.y = ic.userData.base + 0.05 * Math.sin(t * 2.5 + i);
      });
      links.forEach((m, i) => {
        const k = springU(t, SC[2] + 0.55 + i * 0.28, SPRING.bouncy);
        m.scale.set(Math.max(m.userData.len * k, 1e-3), 1, 1);
        const a = Math.atan2(D[2], D[0]);
        m.rotation.y = -a;
      });
      // S3 spark runs along the chain; S4+ crates ride
      const loop = ((t - 9.4) / 2.6) % 1;
      const sS = lerp(CHAIN[0], CHAIN[2], loop);
      const sOn = t > 9.4 && t < SC[3] ? 1 : 0;
      { const [x, , z] = at(sS); spark.position.set(x, 0.75 + 0.08 * Math.sin(t * 10), z); spark.scale.setScalar(Math.max(sOn * 1, 1e-3)); spark.rotation.set(t * 3, t * 4, 0); }
      crates.forEach((c, i) => {
        const on = t > SC[3] + 0.3 && t < SC[5] ? 1 : 0;
        const ph = (((t - SC[3]) / 3.6) + i / 5) % 1;
        const [x, , z] = at(lerp(CHAIN[0], CHAIN[2], ph));
        const k = on * Math.min(1, ph * 8) * Math.min(1, (1 - ph) * 8);
        c.position.set(x, 0.55 + 0.04 * Math.sin(t * 3 + i), z); c.scale.setScalar(Math.max(k, 1e-3)); c.rotation.y = t * 0.8;
      });

      // ---- person: S2 walks/carries, S4 sits and relaxes, gone for S5
      const pIn = springU(t, 3.9, SPRING.bouncy);
      const sit = P(t, SC[3] + 0.2, SC[3] + 1.2);
      const pOut = 1 - P(t, SC[3] - 0.5, SC[3] - 0.1) * (1 - sit); // briefly leaves between S2 and S4
      const gone = 1 - P(t, SC[4] - 0.2, SC[4] + 0.3);
      let px, pz, face;
      const A = [-1.3, 1.3], B = [1.3, -1.3];
      let walkAmt = 0, carryOn = 0, bobY = 0;
      if (t < SC[2]) {
        const T = 1.55, ph = ((t - 3.95) / T) % 1, pp = ph < 0 ? 0 : ph;
        let f, dir;
        if (pp < 0.5) { f = P(pp, 0, 0.5); dir = 1; carryOn = 1; } else { f = 1 - P(pp, 0.5, 1); dir = -1; carryOn = 0; }
        px = lerp(A[0], B[0], f); pz = lerp(A[1], B[1], f) + 0.55;
        face = dir > 0 ? Math.atan2(B[0] - A[0], B[1] - A[1]) : Math.atan2(A[0] - B[0], A[1] - B[1]);
        walkAmt = 1; bobY = Math.abs(Math.sin(t * 7.5)) * 0.07;
      } else { px = -1.15; pz = 1.45; face = Math.PI * 0.25 + 0.2; }
      const vis = (t < SC[2] ? pIn : t > SC[3] ? springU(t, SC[3] + 0.1, SPRING.bouncy) : 0) * gone;
      person.scale.setScalar(Math.max(vis * (t < SC[2] ? 1 : 1), 1e-3));
      person.position.set(px, 0.12 + bobY - sit * 0.17, pz); person.rotation.y = face;
      const sw = Math.sin(t * 7.5) * 0.7 * walkAmt * (1 - sit);
      legL.rotation.x = sw * 1 - sit * 1.45; legR.rotation.x = -sw * 1 - sit * 1.45;
      armL.rotation.x = -sw * 0.8 * 1 - (carryOn ? 1.15 : 0) - sit * 2.6; armR.rotation.x = sw * 0.8 - (carryOn ? 1.15 : 0) - sit * 2.6;
      armL.rotation.z = sit * 0.5; armR.rotation.z = -sit * 0.5;
      torso.rotation.x = -sit * 0.22; head.position.y = 1.5 - sit * 0.05; head.rotation.x = -sit * 0.15; head.rotation.y = Math.sin(t * 1.2) * 0.2 * sit;
      hair.position.y = head.position.y + 0.04;
      carry.position.set(0, 1.05, 0.45); carry.scale.setScalar(Math.max(carryOn, 1e-3));
      // chair
      const ck = springU(t, SC[3] + 0.1, SPRING.bouncy) * gone;
      chair.position.set(px, 0.12, pz); chair.rotation.y = face; chair.scale.setScalar(Math.max(ck * (t >= SC[3] - 0.2 ? 1 : 0), 1e-3));
      chair.position.y = 0.12;
      // piles for S2
      const pa = t < SC[2] ? 1 : 0;
      pileA.forEach((m, i) => { m.position.set(A[0] - 0.55, 0.3 + i * 0.34, A[1] + 0.2 + 0.55); m.scale.setScalar(Math.max(pa * springU(t, 3.9 + i * 0.1, SPRING.bouncy), 1e-3)); });
      pileB.position.set(B[0] + 0.5, 0.3, B[1] + 0.55 + 0.2); pileB.scale.setScalar(Math.max(pa * pIn, 1e-3));

      // ---- robot: bobs along the chain from S4
      const rk = springU(t, SC[3] + 0.5, SPRING.bouncy) * (1 - P(t, SC[5] - 0.4, SC[5]));
      const rs = 1.2 * Math.sin(t * 0.8 + 1);
      const [rx, , rz] = at(rs);
      robot.position.set(rx + D[2] * -0.95, 0.12 + 0.12 * Math.sin(t * 3), rz + D[0] * 0.95 * -1 * -1 * 1);
      robot.rotation.y = Math.PI * 0.25 + Math.sin(t * 0.8) * 0.3;
      robot.scale.setScalar(Math.max(rk * (t >= SC[3] ? 1 : 0) * 1.05, 1e-3));
      rArmL.rotation.z = 0.5 + 0.5 * Math.sin(t * 4); rArmR.rotation.z = -0.5 - 0.5 * Math.sin(t * 4 + 1);
      const bl = (t % 2.7) < 0.12 ? 0.2 : 1; eL.scale.y = bl; eR.scale.y = bl; antB.position.y = 1.5 + 0.06 * Math.sin(t * 6);

      // ---- knot (code tangle) pops away in S5
      const kk = springU(t, SC[4] + 0.2, SPRING.bouncy) * (1 - P(t, 21.3, 21.9));
      knot.position.set(1.3, 0.7 + 0.1 * Math.sin(t * 2), 1.3); knot.rotation.set(t * 0.8, t * 1.1, 0); knot.scale.setScalar(Math.max(kk, 1e-3));
      // ---- sparkles rise after the knot is gone
      sparks.forEach((m, i) => {
        const ph = ((t - 21.7 - i * 0.18) / 2.2) % 1; const on = t > 21.7 && t < SC[5] ? Math.sin(Math.PI * Math.max(0, ph)) : 0;
        const a = (i / 6) * Math.PI * 2 + 0.6; m.position.set(Math.cos(a) * 1.5, 0.6 + ph * 2.2, Math.sin(a) * 1.5 * 0.8);
        m.scale.setScalar(Math.max(on * 2.2, 1e-3)); m.rotation.set(t * 2 + i, t * 2.4, 0);
      });
    },
  };
}

// ---------------------------------------------------------------- film
let SET;
M.film({
  fonts: [font(100, 800, 'Display'), font(40, 500, 'UI')],
  images: { logo: 'assets/logo.png' },
  samples: 1,
  async init() { await G.initGL({}); SET = buildSet(); },
  draw(ctx, u, t, IMG) {
    fill(ctx, C.ivory);
    const bl = (x, y, r, col, a) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.globalAlpha = a; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; };
    bl(W * (0.2 + 0.05 * Math.sin(t * 0.3)), H * 0.8, 700, '#BDE8F7', 0.55);
    bl(W * (0.85 - 0.05 * Math.cos(t * 0.25)), H * 0.35, 600, '#F6D2C2', 0.45);
    if (t < 25.2) G.renderSet(ctx, SET, t, u);
    const s = FORMAT.safe;
    if (t < SC[1]) drawLines(ctx, TX.hook, t, 0.05, SC[1], 92, s.y + 20);
    else if (t < SC[2]) drawLines(ctx, TX.s2, t, SC[1], SC[2], 84, s.y + 80);
    else if (t < SC[3]) drawLines(ctx, TX.s3, t, SC[2], SC[3], 84, s.y + 80);
    else if (t < SC[4]) drawLines(ctx, TX.s4, t, SC[3], SC[4], 84, s.y + 80);
    else if (t < SC[5]) {
      drawLines(ctx, TX.s5, t, SC[4], SC[5], 84, s.y + 80);
      const a = E.outQuint(prog(t, 21.5, 22.2)) * (1 - prog(t, 24.7, 25));
      ctx.globalAlpha = a * 0.75; ctx.fillStyle = C.ink; ctx.font = font(30, 500, 'UI'); ctx.textAlign = 'center';
      TX.src.split('|').forEach((ln, i) => ctx.fillText(ln.trim(), W / 2, H - 470 + i * 40)); ctx.globalAlpha = 1;
    } else outro(ctx, t, IMG);
  },
});

function outro(ctx, t, IMG) {
  fill(ctx, C.ivory);
  const k = springU(t, SC[5] + 0.05, SPRING.bouncy);
  const pulse = 1 + 0.025 * Math.max(0, Math.cos(((t - 25) % BEAT) / BEAT * Math.PI * 2)) ** 3;
  const lw = 640 * k * pulse, lh = lw * (356 / 1200);
  if (IMG.logo && k > 0) ctx.drawImage(IMG.logo, W / 2 - lw / 2, 640 - lh / 2, lw, lh);
  const tp = E.outQuint(prog(t, 25.5, 26.1)), tp2 = E.outQuint(prog(t, 25.8, 26.4)), tp3 = E.outQuint(prog(t, 26.2, 26.8));
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.globalAlpha = tp; ctx.fillStyle = C.ink; ctx.font = font(58, 800, 'Display'); ctx.fillText('NeuroPuls AI Agency', W / 2, 860 + (1 - tp) * 40);
  ctx.globalAlpha = tp2; ctx.fillStyle = C.orange; ctx.font = font(36, 500, 'UI'); ctx.fillText('Beyond automation, into transformation.', W / 2, 930 + (1 - tp2) * 40);
  ctx.globalAlpha = tp3; ctx.fillStyle = C.ink; ctx.font = font(34, 500, 'UI'); ctx.fillText('@neuropuls.agency', W / 2, 1010 + (1 - tp3) * 30);
  ctx.globalAlpha = tp3 * 0.7; ctx.font = font(30, 500, 'UI'); ctx.fillText(TX.soft, W / 2, 1075 + (1 - tp3) * 30);
  ctx.globalAlpha = 1;
}
