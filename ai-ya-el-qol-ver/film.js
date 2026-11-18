// NeuroPuls: AI-a əl-qol ver. Soft clay 3D (three.js) + 2D text layer. Pure function of time (u == seconds).
import * as M from './lib/motion.js';
import * as G from './lib/gl.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import TX from './lang.js';
const { THREE } = G;
const { W, H, FORMAT, E, prog, lerp, springU, SPRING, font, fill } = M;
const C = { ink: '#0F1516', blue: '#5FCBEF', orange: '#D97757', ivory: '#F7F2E8' };
const SC = [0, 3.8, 8.3, 13.8, 19.8, 25, 29];
const sm = (x) => x * x * (3 - 2 * x);
const P = (t, a, b) => sm(prog(t, a, b));
const lerp3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

// ---------------------------------------------------------------- 2-D text
function parse(line) { // "*x*" -> orange segments
  return line.split('*').map((s, i) => [s, i % 2 ? C.orange : C.ink]).filter((s) => s[0]);
}
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

// ---------------------------------------------------------------- 3-D set
const clay = (color, rough = 0.85) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0, envMapIntensity: 0.55 });
const Yv = new THREE.Vector3(0, 1, 0), tv = new THREE.Vector3(), tq = new THREE.Quaternion();
function limb(m, a, b) {
  tv.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const L = tv.length();
  m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  tq.setFromUnitVectors(Yv, tv.normalize()); m.quaternion.copy(tq);
  m.scale.set(1, Math.max(L, 1e-3), 1);
}
function clamp01(x) { return Math.min(1, Math.max(0, x)); }

function buildSet() {
  const scene = new THREE.Scene();
  scene.environment = G.ENV;
  const cam = G.camera(35);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xf0e2cc, 0.9));
  const key = new THREE.DirectionalLight(0xfff1de, 2.0); key.position.set(-3, 5, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xbfe9f8, 0.9); rim.position.set(4, 2, -4); scene.add(rim);
  const root = new THREE.Group(); root.position.y = -0.45; scene.add(root);
  const add = (geo, mat, parent = root) => { const m = new THREE.Mesh(geo, mat); parent.add(m); return m; };
  const sph = new THREE.SphereGeometry(1, 32, 20);

  // soft contact shadow texture
  const sh = G.canvasTexture(128, 128);
  sh.draw((c, w, h) => { const g = c.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(90,70,40,0.35)'); g.addColorStop(1, 'rgba(90,70,40,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
  const shMat = new THREE.MeshBasicMaterial({ map: sh, transparent: true, depthWrite: false });
  const shadow = (r) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), shMat); m.rotation.x = -Math.PI / 2; m.position.y = -1.25; m.userData.r = r; root.add(m); return m; };

  // head
  const head = new THREE.Group(); root.add(head);
  const hb = add(sph, clay(C.blue), head); hb.scale.set(0.78, 0.7, 0.72);
  const eyeM = clay(C.ink, 0.4);
  const eL = add(sph, eyeM, head), eR = add(sph, eyeM, head);
  const mouth = add(sph, clay('#243033', 0.5), head);
  const chL = add(sph, clay(C.orange), head), chR = add(sph, clay(C.orange), head);
  chL.scale.set(0.1, 0.07, 0.04); chR.scale.set(0.1, 0.07, 0.04);
  chL.position.set(-0.45, -0.12, 0.62); chR.position.set(0.45, -0.12, 0.62);
  const ant = add(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 10), clay(C.ink), head); ant.position.set(0, 0.83, 0);
  const antB = add(sph, clay(C.orange), head); antB.scale.setScalar(0.1); antB.position.set(0, 1.0, 0);
  const hShadow = shadow(0.9);

  // arms + hands
  const armMat = clay('#7ad3f0'), handMat = clay(C.orange);
  const cyl = new THREE.CylinderGeometry(0.085, 0.085, 1, 14);
  const arms = [0, 1].map(() => add(cyl, armMat));
  const hands = [0, 1].map(() => { const g = new THREE.Group(); root.add(g);
    add(sph, handMat, g).scale.setScalar(0.2);
    [[-0.12, 0.17], [0, 0.2], [0.12, 0.17]].forEach(([x, y]) => { const f = add(sph, handMat, g); f.scale.setScalar(0.075); f.position.set(x, y, 0.06); });
    return g; });

  // folder + pages
  const folder = new THREE.Group(); root.add(folder);
  add(new RoundedBoxGeometry(1.3, 0.95, 0.14, 3, 0.05), clay('#EAD9B5'), folder);
  const tab = add(new RoundedBoxGeometry(0.5, 0.14, 0.12, 3, 0.04), clay('#EAD9B5'), folder); tab.position.set(-0.35, 0.52, 0);
  const band = add(new RoundedBoxGeometry(1.32, 0.22, 0.16, 3, 0.05), clay(C.blue), folder); band.position.y = -0.3;
  const pageM = clay('#FFFFFF', 0.9);
  const pages = [0, 1, 2].map(() => { const p = add(new RoundedBoxGeometry(0.95, 0.68, 0.03, 2, 0.01), pageM, folder); return p; });

  // globe + memory box
  const globe = new THREE.Group(); root.add(globe);
  add(sph, clay('#9FDDF3'), globe).scale.setScalar(0.55);
  const ring = add(new THREE.TorusGeometry(0.62, 0.05, 12, 40), clay(C.orange), globe); ring.rotation.set(1.2, 0.3, 0);
  const ring2 = add(new THREE.TorusGeometry(0.58, 0.04, 12, 40), clay(C.blue), globe); ring2.rotation.set(0.2, 1.1, 0);
  const gShadow = shadow(0.6);
  const mem = new THREE.Group(); root.add(mem);
  add(new RoundedBoxGeometry(0.95, 0.7, 0.7, 3, 0.08), clay('#F0D4C0'), mem);
  const lid = add(new RoundedBoxGeometry(1.0, 0.14, 0.78, 3, 0.06), clay(C.orange), mem);
  const mShadow = shadow(0.7);
  // travelling card
  const card = add(new RoundedBoxGeometry(0.42, 0.3, 0.04, 2, 0.01), clay('#FFFFFF'));
  // speech bubbles (scene 2)
  const bub = [0, 1, 2].map(() => add(sph, clay('#FFFFFF', 0.7)));
  // seven cubes
  const cubeG = new RoundedBoxGeometry(0.6, 0.6, 0.6, 3, 0.12);
  const cubes = [[-1.11, -0.1], [-0.37, -0.1], [0.37, -0.1], [1.11, -0.1], [-0.74, -0.8], [0, -0.8], [0.74, -0.8]].map(([x, y], i) => {
    const m = add(cubeG, clay(i < 3 ? C.blue : '#DDD3C0')); m.userData = { x, y, lit: i < 3, i }; return m; });
  const cShadow = shadow(1);

  const rest = { L: [-0.75, -0.3, 1.0], R: [0.75, -0.3, 1.0] };
  const shoulder = { L: [-0.55, 0.0, 0.25], R: [0.55, 0.0, 0.25] };

  return {
    scene, camera: cam,
    update(t) {
      // camera
      const sway = Math.sin(t * 0.45) * 0.55, dz = 10.2;
      G.lookFrom(cam, [sway, 0.25 + 0.15 * Math.sin(t * 0.33), dz], [0, -0.2, 0]);

      // ---- head
      const hk = springU(t, 0.05, SPRING.bouncy);
      const hideHead = P(t, 19.8, 20.4);
      const hs = hk * (1 - hideHead);
      const bob = Math.sin(t * 1.9) * 0.07;
      head.position.set(0, 0.0 + bob + 0.15 * (1 - hk) - 0.32 * (1 - P(t, 3.8, 4.6)), 0); head.scale.setScalar(Math.max(hs, 1e-3));
      head.rotation.y = Math.sin(t * 0.7) * 0.25; head.rotation.z = Math.sin(t * 0.9) * 0.05;
      const blink = (t % 3.1) < 0.12 ? 0.15 : 1;
      eL.scale.set(0.09, 0.13 * blink, 0.06); eR.scale.copy(eL.scale);
      eL.position.set(-0.27, 0.1, 0.64); eR.position.set(0.27, 0.1, 0.64);
      const talk = t > 3.8 && t < 8.3 ? Math.abs(Math.sin(t * 8)) : 0;
      mouth.scale.set(0.12 + 0.03 * talk, 0.025 + 0.08 * talk, 0.05); mouth.position.set(0, -0.2, 0.66);
      const win = 1 + 0.12 * (hs > 0.5 ? 1 : 0);
      hShadow.position.set(0, -1.25 - 0.0, 0); hShadow.scale.setScalar((0.85 - bob) * 1.1 * hs + 1e-3);

      // ---- bubbles (scene 2)
      bub.forEach((b, i) => {
        const ph = ((t * 0.55 + i / 3) % 1), on = t > 3.9 && t < 8.1 ? Math.sin(Math.PI * ph) : 0;
        b.position.set(0.85 + 0.25 * i, 0.4 + ph * 1.2, 0.2); b.scale.setScalar(on > 0 ? 0.06 + 0.09 * on * (0.7 + 0.3 * i) : 1e-3);
      });

      // ---- arms
      const ak = springU(t, 8.2, SPRING.bouncy) * (1 - hideHead);
      // folder
      const fk = springU(t, 8.4, SPRING.bouncy) * (1 - P(t, 13.8, 14.3));
      folder.position.set(0, -0.55 + (1 - fk) * -1.2, 0.95); folder.scale.setScalar(Math.max(fk, 1e-3));
      folder.rotation.y = Math.sin(t * 1.1) * 0.12;
      pages.forEach((p, i) => { const k = springU(t, 9.6 + i * 0.7, SPRING.wobbly); p.position.set((i - 1) * 0.06, 0.3 + k * (0.45 + 0.12 * i), 0.09 + i * 0.015); p.rotation.z = (i - 1) * 0.1 * k; p.scale.setScalar(Math.max(k, 1e-3)); });
      // globe + memory box
      const gk = springU(t, 14.1, SPRING.bouncy) * (1 - P(t, 19.5, 20.0));
      const mk = springU(t, 14.3, SPRING.bouncy) * (1 - P(t, 19.5, 20.0));
      globe.position.set(-1.0, -0.55, 0.8); globe.scale.setScalar(Math.max(gk, 1e-3)); globe.rotation.y = t * 0.9;
      mem.position.set(1.0, -0.6, 0.8); mem.scale.setScalar(Math.max(mk, 1e-3));
      gShadow.position.set(-1.0, -1.25, 0.8); gShadow.scale.setScalar(0.75 * gk + 1e-3);
      mShadow.position.set(1.0, -1.25, 0.8); mShadow.scale.setScalar(0.85 * mk + 1e-3);
      // card cycle
      const ph = ((t - 14.8) / 2.4) % 1, cOn = t > 14.8 && t < 19.5 ? 1 : 0;
      const pg = [-0.8, -0.35, 0.8], ph0 = [-0.45, 0.35, 1.05], ph1 = [0.0, 0.5, 1.15], ph2 = [1.0, -0.3, 0.95], ph3 = [1.0, -0.5, 0.8];
      let cp;
      if (ph < 0.25) cp = lerp3(pg, ph0, P(ph, 0, 0.25));
      else if (ph < 0.5) cp = lerp3(ph0, ph1, P(ph, 0.25, 0.5));
      else if (ph < 0.8) cp = lerp3(ph1, ph2, P(ph, 0.5, 0.8));
      else cp = lerp3(ph2, ph3, P(ph, 0.8, 1));
      const cs = cOn * (ph > 0.9 ? 1 - P(ph, 0.9, 1) : 1) * (ph < 0.06 ? P(ph, 0, 0.06) : 1);
      card.position.set(...cp); card.rotation.z = Math.sin(t * 3) * 0.15; card.scale.setScalar(Math.max(cs, 1e-3));
      lid.position.set(0, 0.4 + 0.12 * Math.max(0, Math.sin(Math.PI * clamp01((ph - 0.75) / 0.25))) * cOn, 0);

      // hand targets
      const tgt = { L: rest.L, R: rest.R };
      if (t < 13.8) { tgt.L = lerp3(rest.L, [-0.8, -0.55, 1.0], P(t, 8.4, 9)); tgt.R = lerp3(rest.R, [0.8, -0.55, 1.0], P(t, 8.4, 9)); }
      else if (cOn) {
        tgt.L = lerp3(rest.L, cp, 1 - P(ph, 0.35, 0.55)); tgt.R = lerp3(rest.R, cp, P(ph, 0.45, 0.65) * (1 - P(ph, 0.92, 1)));
        tgt.L = lerp3(tgt.L, [-0.8, -0.55, 1.0], 1 - P(t, 13.8, 14.4));
        tgt.R = lerp3(tgt.R, [0.8, -0.55, 1.0], 1 - P(t, 13.8, 14.4));
      }
      ['L', 'R'].forEach((s, i) => {
        const a = shoulder[s], b = lerp3(a, tgt[s], ak);
        const wob = [Math.sin(t * 2.2 + i) * 0.03, Math.cos(t * 1.7 + i) * 0.03, 0];
        const hp = [b[0] + wob[0], b[1] + wob[1], b[2]];
        limb(arms[i], a, hp); arms[i].scale.x = arms[i].scale.z = Math.max(ak, 1e-3);
        hands[i].position.set(...hp); hands[i].scale.setScalar(Math.max(ak, 1e-3));
        hands[i].rotation.z = (i ? -1 : 1) * 0.3;
      });

      // ---- seven cubes
      const cg = 1 - P(t, 24.6, 25.0);
      cubes.forEach((m) => {
        const { x, y, lit, i } = m.userData;
        const k = springU(t, 20.3 + i * 0.12, SPRING.bouncy) * cg;
        const lk = lit ? springU(t, 21.8 + i * 0.55, SPRING.wobbly) : 0;
        const pop = lit ? 0.06 * lk : 0;
        m.position.set(x, y + 0.2 * pop - (1 - Math.min(k, 1)) * 0.6, 0.2 + pop);
        m.scale.setScalar(Math.max(k * (1 + 0.05 * lk), 1e-3));
        m.rotation.set(0.1 * Math.sin(t + i), 0.35 * (lit ? lk : 0) + 0.12 * Math.sin(t * 0.8 + i), 0);
        const base = lit ? new THREE.Color(C.blue) : new THREE.Color('#DDD3C0');
        const dim = new THREE.Color('#DDD3C0');
        m.material.color.copy(lit ? dim.clone().lerp(base, Math.min(1, lk * 1.5)) : base);
      });
      const cv = P(t, 20.5, 21.2) * cg; cShadow.position.set(0, -1.25, 0.2); cShadow.scale.set(1.6 * cv + 1e-3, 1, 1.0 * cv + 1e-3); cShadow.position.y = -1.0;
      shadow; // (kept simple)
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
    // ivory background with two slow soft colour blooms
    fill(ctx, C.ivory);
    const bl = (x, y, r, col, a) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.globalAlpha = a; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; };
    bl(W * (0.2 + 0.05 * Math.sin(t * 0.3)), H * 0.75, 700, '#BDE8F7', 0.55);
    bl(W * (0.85 - 0.05 * Math.cos(t * 0.25)), H * 0.3, 600, '#F6D2C2', 0.45);
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
  const beat = 60 / 104, pulse = 1 + 0.025 * Math.max(0, Math.cos(((t - 25) % beat) / beat * Math.PI * 2)) ** 3;
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
