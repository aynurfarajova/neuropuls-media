// NeuroPuls: AI proqramı anlayır. Flat 2D explainer. Pure function of time.
import * as M from './lib/motion.js';
import TX from './lang.js';
const { W, H, E, prog, lerp, springU, SPRING, font, fill } = M;
const C = { ink: '#0F1516', blue: '#5FCBEF', blue2: '#BDE8F7', orange: '#D97757', ivory: '#F7F2E8', skin: '#F2C9A5', card: '#FFFFFF', gray: '#CFC8B8' };
const SC = [0, 4.2, 9.0, 13.8, 19.2, 25, 29];
const SAFE = { x: 60, y: 220, w: 840 };
const CX = 500;
const BPM = 124, BEAT = 60 / BPM;
const c01 = (x) => Math.min(1, Math.max(0, x));
const sm = (x) => x * x * (3 - 2 * x);
const P = (t, a, b) => sm(prog(t, a, b));

function parse(line) { return line.split('*').map((s, i) => [s, i % 2 ? C.orange : C.ink]).filter((s) => s[0]); }
function lineW(ctx, segs) { return segs.reduce((a, s) => a + ctx.measureText(s[0]).width, 0); }
function drawLines(ctx, lines, t, t0, t1, base, y0) {
  ctx.textBaseline = 'alphabetic';
  ctx.font = font(base, 800, 'Display');
  const maxw = Math.max(...lines.map((l) => lineW(ctx, parse(l))));
  const size = Math.min(base, base * SAFE.w / maxw);
  ctx.font = font(size, 800, 'Display');
  const out = E.outQuint(prog(t, t1 - 0.3, t1));
  lines.forEach((l, k) => {
    const a = k * 0.09;
    const p = E.outBack(prog(t, t0 + a, t0 + a + 0.55), 1.3);
    if (p <= 0) return;
    const alpha = Math.min(1, p * 1.6) * (1 - out);
    const segs = parse(l);
    let x = CX - lineW(ctx, segs) / 2;
    const y = y0 + size + k * size * 1.16 + (1 - p) * 60 - out * 30;
    ctx.globalAlpha = Math.max(0, alpha);
    for (const [str, col] of segs) { ctx.fillStyle = col; ctx.textAlign = 'left'; ctx.fillText(str, x, y); x += ctx.measureText(str).width; }
    ctx.globalAlpha = 1;
  });
}

// ---------------------------------------------------------------- flat drawing helpers
const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
const circ = (ctx, x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.closePath(); };
function shadow(ctx, x, y, w) { ctx.fillStyle = 'rgba(15,21,22,0.10)'; ctx.beginPath(); ctx.ellipse(x, y + 6, w, w * 0.16, 0, 0, Math.PI * 2); ctx.fill(); }
// human: feet at (x,y); s = scale; run = 0..1 speed of leg swing; ph = phase; cheer = arms up
function human(ctx, x, y, s, t, run = 0, cheer = 0, face = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * face, s);
  const sw = Math.sin(t * 12) * run;
  const bob = Math.abs(Math.sin(t * 12)) * 8 * run;
  shadow(ctx, 0, 0, 52);
  ctx.translate(0, -bob);
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#52606A'; ctx.lineWidth = 20;
  ctx.beginPath(); ctx.moveTo(-14, -60); ctx.lineTo(-14 + sw * 26, -6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(14, -60); ctx.lineTo(14 - sw * 26, -6); ctx.stroke();
  ctx.fillStyle = C.ink; rr(ctx, -34, -150, 68, 96, 24); ctx.fill();
  ctx.strokeStyle = C.skin; ctx.lineWidth = 16;
  const aL = cheer ? -2.2 : -sw * 1.0 + 0.25, aR = cheer ? -0.95 : sw * 1.0 + 0.25;
  const arm = (a, side) => { ctx.beginPath(); ctx.moveTo(side * 30, -130); ctx.lineTo(side * 30 + Math.sin(a) * 52 * (cheer ? -side * -1 : 1) * (cheer ? 0.6 : 1) + (cheer ? side * 14 : 0), -130 + (cheer ? -58 : Math.cos(a) * 52)); ctx.stroke(); };
  arm(aL, -1); arm(aR, 1);
  ctx.fillStyle = C.skin; circ(ctx, 0, -186, 36); ctx.fill();
  ctx.fillStyle = '#3A2E27'; ctx.beginPath(); ctx.arc(0, -192, 37, Math.PI * 1.05, Math.PI * 1.95); ctx.closePath(); ctx.fill();
  ctx.fillStyle = C.ink; circ(ctx, 12, -184, 4.5); ctx.fill();
  ctx.restore();
}
function robot(ctx, x, y, s, t, run = 0, cheer = 0, face = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * face, s);
  const sw = Math.sin(t * 12) * run;
  const bob = Math.abs(Math.sin(t * 12)) * 8 * run + Math.sin(t * 3) * 3;
  shadow(ctx, 0, 0, 52);
  ctx.translate(0, -bob);
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#2C8FB5'; ctx.lineWidth = 20;
  ctx.beginPath(); ctx.moveTo(-14, -60); ctx.lineTo(-14 + sw * 26, -6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(14, -60); ctx.lineTo(14 - sw * 26, -6); ctx.stroke();
  ctx.fillStyle = C.blue; rr(ctx, -38, -150, 76, 96, 22); ctx.fill();
  ctx.fillStyle = C.orange; circ(ctx, 0, -102, 12); ctx.fill();
  ctx.strokeStyle = '#2C8FB5'; ctx.lineWidth = 15;
  const arm = (side, a) => { ctx.beginPath(); ctx.moveTo(side * 36, -132); ctx.lineTo(side * 36 + (cheer ? side * 18 : Math.sin(a) * 50), cheer ? -196 : -132 + Math.cos(a) * 50); ctx.stroke(); };
  arm(-1, -sw * 1.0 + 0.2); arm(1, sw * 1.0 + 0.2);
  ctx.fillStyle = C.blue; rr(ctx, -50, -236, 100, 84, 30); ctx.fill();
  ctx.fillStyle = '#EAF8FD'; rr(ctx, -36, -220, 72, 46, 20); ctx.fill();
  const blink = (t % 3) < 0.1 ? 0.2 : 1;
  ctx.fillStyle = C.ink; ctx.save(); ctx.translate(-16, -197); ctx.scale(1, blink); circ(ctx, 0, 0, 7.5); ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(16, -197); ctx.scale(1, blink); circ(ctx, 0, 0, 7.5); ctx.fill(); ctx.restore();
  ctx.strokeStyle = '#2C8FB5'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, -236); ctx.lineTo(0, -262); ctx.stroke();
  ctx.fillStyle = C.orange; circ(ctx, 0, -268, 11 + Math.sin(t * 6) * 1.5); ctx.fill();
  ctx.restore();
}
function clock(ctx, x, y, r, t, speed, a = 1) {
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y);
  ctx.fillStyle = '#fff'; circ(ctx, 0, 0, r); ctx.fill(); ctx.lineWidth = r * 0.12; ctx.strokeStyle = C.ink; ctx.stroke();
  ctx.lineCap = 'round'; ctx.lineWidth = r * 0.1;
  ctx.strokeStyle = C.ink; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -r * 0.7); ctx.save(); ctx.rotate(t * speed); ctx.stroke(); ctx.restore();
  ctx.strokeStyle = C.orange; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -r * 0.5); ctx.save(); ctx.rotate(t * speed / 12); ctx.stroke(); ctx.restore();
  ctx.restore();
}
function programCard(ctx, x, y, w, h, tangle = 1, t = 0) {
  ctx.save(); ctx.translate(x - w / 2, y - h / 2);
  ctx.fillStyle = 'rgba(15,21,22,0.10)'; rr(ctx, 8, 14, w, h, 28); ctx.fill();
  ctx.fillStyle = '#fff'; rr(ctx, 0, 0, w, h, 28); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.ink; ctx.stroke();
  ctx.fillStyle = C.blue2; ctx.save(); rr(ctx, 0, 0, w, 56, 28); ctx.clip(); ctx.fillRect(0, 0, w, 56); ctx.restore();
  [C.orange, C.blue, C.ink].forEach((c, i) => { ctx.fillStyle = c; circ(ctx, 34 + i * 30, 28, 9); ctx.fill(); });
  // tangled lines
  ctx.save(); ctx.beginPath(); ctx.rect(16, 66, w - 32, h - 82); ctx.clip();
  ctx.lineWidth = 6; ctx.lineCap = 'round';
  const N = 7;
  for (let k = 0; k < N; k++) {
    const kp = c01(tangle * N - k);
    if (kp <= 0) continue;
    ctx.strokeStyle = k % 3 === 0 ? C.orange : k % 3 === 1 ? C.blue : C.ink; ctx.globalAlpha = 0.9;
    ctx.beginPath();
    const steps = Math.floor(40 * kp);
    for (let i = 0; i <= steps; i++) {
      const u = i / 40, px = 24 + u * (w - 48), py = 66 + (h - 82) * (0.5 + 0.36 * Math.sin(u * 9 + k * 1.7) * Math.cos(u * 4 + k));
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore(); ctx.restore();
}
function magnifier(ctx, x, y, s, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(rot);
  ctx.lineCap = 'round'; ctx.strokeStyle = C.ink; ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(40, 40); ctx.lineTo(100, 100); ctx.stroke();
  ctx.fillStyle = 'rgba(189,232,247,0.55)'; circ(ctx, 0, 0, 58); ctx.fill(); ctx.lineWidth = 14; ctx.strokeStyle = C.orange; ctx.stroke();
  ctx.restore();
}
function flag(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.strokeStyle = C.ink; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -130); ctx.stroke();
  ctx.fillStyle = C.orange; ctx.beginPath(); ctx.moveTo(4, -130); ctx.quadraticCurveTo(40, -140 + Math.sin(t * 5) * 6, 74, -120); ctx.quadraticCurveTo(40, -100 + Math.sin(t * 5 + 1) * 6, 4, -92); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function star(ctx, x, y, r, rot, col) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = col; ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2, rad = i % 2 ? r * 0.45 : r; ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); }
  ctx.closePath(); ctx.fill(); ctx.restore();
}

// ---------------------------------------------------------------- scenes (illustration zone y 700..1360, x 60..940)
function sceneIdle(ctx, t) {
  const k = springU(t, 0.3, SPRING.bouncy), k2 = springU(t, 0.5, SPRING.bouncy);
  human(ctx, 270, 1290, 1.5 * Math.max(k, 0.001), t, 0);
  robot(ctx, 730, 1290, 1.5 * Math.max(k2, 0.001), t, 0);
}
function lock(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.strokeStyle = C.ink; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(0, -14, 20, Math.PI, 0); ctx.stroke();
  ctx.fillStyle = C.orange; rr(ctx, -30, -14, 60, 46, 10); ctx.fill(); ctx.fillStyle = C.ink; circ(ctx, 0, 6, 6); ctx.fill();
  ctx.restore();
}
function bubble(ctx, x, y, w, h, col, tail) {
  ctx.fillStyle = col; rr(ctx, x, y, w, h, 16); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + (tail > 0 ? w - 26 : 26), y + h - 2); ctx.lineTo(x + (tail > 0 ? w - 10 : 10), y + h + 16); ctx.lineTo(x + (tail > 0 ? w - 46 : 46), y + h - 2); ctx.fill();
}
function folder(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = C.blue; rr(ctx, -44, -34, 88, 70, 10); ctx.fill(); ctx.fillStyle = '#8FDDF5'; rr(ctx, -44, -46, 40, 20, 8); ctx.fill();
  ctx.fillStyle = '#fff'; rr(ctx, -30, -24, 60, 8, 4); ctx.fill(); rr(ctx, -30, -10, 44, 8, 4); ctx.fill();
  ctx.restore();
}
function card2(ctx, cx, cy, w, h, label, kind, tt, a) {
  ctx.save(); ctx.globalAlpha = a; ctx.translate(cx - w / 2, cy - h / 2);
  ctx.fillStyle = 'rgba(15,21,22,0.10)'; rr(ctx, 8, 12, w, h, 26); ctx.fill();
  ctx.fillStyle = '#fff'; rr(ctx, 0, 0, w, h, 26); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.ink; ctx.stroke();
  ctx.fillStyle = C.blue2; ctx.save(); rr(ctx, 0, 0, w, 44, 26); ctx.clip(); ctx.fillRect(0, 0, w, 44); ctx.restore();
  [C.orange, C.blue, C.ink].forEach((c, i) => { ctx.fillStyle = c; circ(ctx, 28 + i * 26, 22, 7); ctx.fill(); });
  // icon
  if (kind === 0) { bubble(ctx, 40, 78, 130, 52, C.blue, -1); bubble(ctx, 100, 140, 120, 48, C.orange, 1); lock(ctx, 245, 150, 0.8); }
  else { folder(ctx, 100, 120, 1.1); folder(ctx, 190, 140, 0.9); lock(ctx, 250, 150, 0.8); }
  ctx.fillStyle = C.ink; ctx.textAlign = 'left'; ctx.font = font(34, 800, 'Display');
  const words = label.split('|'); words.forEach((ln, i) => ctx.fillText(ln, 300, 118 + i * 44));
  ctx.restore();
}
function scene2(ctx, t) {
  const t0 = SC[1], out = P(t, SC[2] - 0.35, SC[2]);
  ctx.save(); ctx.globalAlpha = 1 - out; ctx.translate(0, out * 30);
  const k1 = springU(t, t0 + 0.2, SPRING.bouncy), k2 = springU(t, t0 + 0.9, SPRING.bouncy);
  card2(ctx, CX, 900, 760, 260, TX.c1, 0, t, Math.min(1, k1 * 1.5));
  card2(ctx, CX, 1200, 760, 260, TX.c2, 1, t, Math.min(1, k2 * 1.5));
  const my = lerp(900, 1200, 0.5 + 0.5 * Math.sin(t * 0.9)), mx = 560 + Math.sin(t * 1.7) * 140;
  ctx.globalAlpha = (1 - out) * Math.min(1, k2); magnifier(ctx, mx, my, 1.0, 0);
  ctx.restore();
}
function mini(ctx, x, y, s, t, kind, p) { // kind 0 robot, 1 human; p=pop 0..1
  if (p <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(s * p, s * p);
  if (kind) { ctx.fillStyle = C.ink; rr(ctx, -16, -52, 32, 52, 12); ctx.fill(); ctx.fillStyle = C.skin; circ(ctx, 0, -66, 15); ctx.fill(); }
  else { ctx.fillStyle = C.blue; rr(ctx, -20, -84, 40, 36, 12); ctx.fill(); ctx.fillStyle = '#EAF8FD'; rr(ctx, -14, -76, 28, 18, 8); ctx.fill(); ctx.fillStyle = C.ink; circ(ctx, -6, -67, 3.5); ctx.fill(); circ(ctx, 6, -67, 3.5); ctx.fill(); ctx.fillStyle = C.blue; rr(ctx, -16, -46, 32, 46, 10); ctx.fill(); ctx.fillStyle = C.orange; circ(ctx, 0, -92, 5); ctx.fill(); }
  ctx.restore();
}
function scene3(ctx, t) {
  const t0 = SC[2], out = P(t, SC[3] - 0.35, SC[3]);
  ctx.save(); ctx.globalAlpha = 1 - out; ctx.translate(0, out * 30);
  // 9 robots (3x3) left
  for (let i = 0; i < 9; i++) { const r = Math.floor(i / 3), c = i % 3; mini(ctx, 150 + c * 90, 930 + r * 125, 1.25, t, 0, E.outBack(prog(t, t0 + 0.2 + i * 0.1, t0 + 0.7 + i * 0.1), 1.5)); }
  // 48 humans (6x8 grid) right: show 8 cols x 6 rows
  for (let i = 0; i < 48; i++) { const r = Math.floor(i / 8), c = i % 8; mini(ctx, 520 + c * 52, 860 + r * 70, 0.7, t, 1, E.outBack(prog(t, t0 + 1.0 + i * 0.03, t0 + 1.4 + i * 0.03), 1.4)); }
  const a1 = E.outQuint(prog(t, t0 + 0.6, t0 + 1.1)), a2 = E.outQuint(prog(t, t0 + 1.9, t0 + 2.4));
  ctx.textAlign = 'center'; ctx.font = font(52, 800, 'Display');
  ctx.globalAlpha = (1 - out) * a1; ctx.fillStyle = C.blue; ctx.fillText(TX.g1, 240, 1320);
  ctx.globalAlpha = (1 - out) * a2; ctx.fillStyle = C.orange; ctx.fillText(TX.g2, 700, 1320);
  ctx.restore();
}
function scene4(ctx, t) {
  const t0 = SC[3], out = P(t, SC[4] - 0.35, SC[4]);
  ctx.save(); ctx.globalAlpha = 1 - out;
  const X = 100, WID = 740, mx = X + WID * 0.80;
  const rows = [[0.84, C.blue, 0.5, 'GPT-5.5 Pro'], [0.82, C.blue, 0.9, 'Claude Opus 4.8'], [0.81, C.blue, 1.3, 'Kimi K3'], [0.36, C.gray, 1.7, TX.others]];
  const mk = E.outQuint(prog(t, t0 + 0.3, t0 + 1.0));
  rows.forEach(([f, col, d, nm], i) => {
    const y = 820 + i * 120, p = E.outQuint(prog(t, t0 + d, t0 + d + 1.2));
    ctx.fillStyle = 'rgba(15,21,22,0.08)'; rr(ctx, X, y, WID, 70, 35); ctx.fill();
    const w = f * WID * p; if (w > 4) { ctx.fillStyle = col; rr(ctx, X, y, Math.max(w, 70), 70, 35); ctx.fill(); }
    if (p > 0.55) { ctx.globalAlpha = (1 - out) * Math.min(1, (p - 0.55) * 3); ctx.textAlign = 'left'; ctx.fillStyle = C.ink; ctx.font = font(32, 800, 'Display'); ctx.fillText(nm, X + 28, y + 46); ctx.globalAlpha = 1 - out; }
  });
  ctx.setLineDash([14, 12]); ctx.lineWidth = 6; ctx.strokeStyle = C.orange; ctx.beginPath(); ctx.moveTo(mx, 790); ctx.lineTo(mx, 820 + 3 * 120 + 90); ctx.stroke(); ctx.setLineDash([]);
  ctx.globalAlpha = (1 - out) * mk; ctx.textAlign = 'center'; ctx.fillStyle = C.orange; ctx.font = font(34, 800, 'Display'); ctx.fillText(TX.lvl, mx - 40, 760);
  const st = P(t, t0 + 3.0, t0 + 3.4); ctx.globalAlpha = 1 - out;
  if (st > 0) for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + t, r = 50 + 30 * st; star(ctx, mx + 80 + Math.cos(a) * r * 0.5, 1050 + Math.sin(a) * r, 12 * st * (1 + 0.3 * Math.sin(t * 6 + i)), t * 2 + i, i % 2 ? C.orange : C.blue); }
  ctx.restore();
}
function scene5(ctx, t) {
  const t0 = SC[4], a = E.outQuint(prog(t, t0 + 0.2, t0 + 0.8)) * (1 - prog(t, 24.7, 25));
  if (a <= 0) return;
  const X = 110, WID = 700, MAX = 75;
  const blocks = [[TX.t1, [[10.5, 'AI', C.blue, '10,5'], [75, TX.hum, C.orange, '75']]], [TX.t2, [[11.1, 'AI', C.blue, '11,1'], [46.6, TX.hum, C.orange, '46,6']]]];
  blocks.forEach(([title, bars], b) => {
    const y0 = 720 + b * 330;
    ctx.globalAlpha = a; ctx.textAlign = 'left'; ctx.fillStyle = C.ink; ctx.font = font(40, 800, 'Display'); ctx.fillText(title, X, y0);
    bars.forEach(([v, lb, col, txt], k) => {
      const y = y0 + 24 + k * 114, d = t0 + 0.8 + b * 0.5 + k * 0.4;
      const p = k === 0 ? E.outQuint(prog(t, d, d + 0.9)) : prog(t, d + 0.3, d + 0.3 + 2.6 * v / MAX);
      const w = Math.max(76, v / MAX * WID * p);
      ctx.fillStyle = 'rgba(15,21,22,0.08)'; rr(ctx, X, y, WID, 76, 38); ctx.fill();
      ctx.fillStyle = col; rr(ctx, X, y, w, 76, 38); ctx.fill();
      ctx.fillStyle = k === 0 ? C.ink : '#fff'; ctx.font = font(32, 800, 'Display'); ctx.textAlign = 'left'; ctx.fillText(lb, X + 28, y + 49);
      if (p >= 0.98) { ctx.fillStyle = C.ink; ctx.font = font(40, 800, 'Display'); ctx.textAlign = 'left'; ctx.fillText((TX.mn === 'min' ? txt.replace(',', '.') : txt) + ' ' + TX.mn, Math.min(X + w + 14, X + WID - 130 + (k ? -250 : 0)), y + 52); }
    });
    ctx.globalAlpha = 1;
  });
}
function src(ctx, t, a, b) {
  const al = E.outQuint(prog(t, a, a + 0.6)) * (1 - prog(t, b - 0.3, b));
  ctx.globalAlpha = al * 0.75; ctx.fillStyle = C.ink; ctx.font = font(30, 500, 'UI'); ctx.textAlign = 'center'; ctx.fillText(TX.src, CX, 1385); ctx.globalAlpha = 1;
}

M.film({
  fonts: [font(100, 800, 'Display'), font(40, 500, 'UI')],
  images: { logo: 'assets/logo.png' },
  samples: 1,
  draw(ctx, u, t, IMG) {
    fill(ctx, C.ivory);
    const bl = (x, y, r, col, a) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.globalAlpha = a; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; };
    bl(W * (0.2 + 0.05 * Math.sin(t * 0.3)), H * 0.8, 700, '#BDE8F7', 0.55);
    bl(W * (0.85 - 0.05 * Math.cos(t * 0.25)), H * 0.35, 600, '#F6D2C2', 0.45);
    const Y0 = SAFE.y + 20;
    if (t < SC[1]) { drawLines(ctx, TX.hook, t, 0.05, SC[1], 92, Y0); const o = 1 - P(t, SC[1] - 0.3, SC[1]); ctx.save(); ctx.globalAlpha = o; sceneIdle(ctx, t); ctx.restore(); }
    else if (t < SC[2]) { drawLines(ctx, TX.s2, t, SC[1], SC[2], 84, Y0); scene2(ctx, t); }
    else if (t < SC[3]) { drawLines(ctx, TX.s3, t, SC[2], SC[3], 84, Y0); scene3(ctx, t); src(ctx, t, SC[2] + 0.6, SC[3]); }
    else if (t < SC[4]) { drawLines(ctx, TX.s4, t, SC[3], SC[4], 84, Y0); scene4(ctx, t); src(ctx, t, SC[3], SC[4]); }
    else if (t < SC[5]) { drawLines(ctx, TX.s5, t, SC[4], SC[5], 84, Y0); scene5(ctx, t); src(ctx, t, SC[4], 24.7); }
    else outro(ctx, t, IMG);
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
