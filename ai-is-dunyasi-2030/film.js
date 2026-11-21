// NeuroPuls: AI və iş dünyası. Marker eskiz/doodle 2D. Pure function of time (seeded jitter only).
import * as M from './lib/motion.js';
import TX from './lang.js';
const { W, H, FORMAT, E, prog, lerp, springU, SPRING, font, fill, hash01 } = M;
const C = { ink: '#0F1516', blue: '#5FCBEF', orange: '#D97757', ivory: '#F7F2E8', gray: '#C9C2B2' };
const SC = [0, 4.4, 9.0, 13.8, 19.4, 25.6, 29.6];
const BEAT = 60 / 124;
const P = (t, a, b) => E.inOutCubic(prog(t, a, b));
const q = (t, a, b) => E.outQuint(prog(t, a, b));

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
function small(ctx, str, x, y, size, col, a = 1, align = 'center', weight = 600) {
  ctx.globalAlpha = a; ctx.fillStyle = col; ctx.font = font(size, weight, 'UI'); ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y); ctx.globalAlpha = 1;
}
function big(ctx, str, x, y, size, col, a = 1) {
  ctx.globalAlpha = a; ctx.fillStyle = col; ctx.font = font(size, 800, 'Display'); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y); ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------- marker doodle primitives
const jit = (i, s) => (hash01(i, s) - 0.5);
function seg(ctx, x1, y1, x2, y2, p, seed, col, w) { // wobbly marker line, drawn up to progress p
  if (p <= 0) return;
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let pass = 0; pass < 2; pass++) {
    ctx.lineWidth = w * (pass ? 0.55 : 1); ctx.globalAlpha = pass ? 0.55 : 0.95;
    ctx.beginPath();
    const n = 12;
    for (let i = 0; i <= n; i++) {
      const f = Math.min(p, i / n), j = jit(i + pass * 31, seed) * 3.6;
      const px = x1 + dx * f + nx * j, py = y1 + dy * f + ny * j;
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
function box(ctx, x, y, w, h, p, seed, col, lw, fillCol, fillA = 0.35) {
  if (p <= 0) return;
  if (fillCol) { ctx.globalAlpha = fillA * Math.min(1, p * 1.5); ctx.fillStyle = fillCol; ctx.beginPath(); ctx.roundRect(x, y, w, h, 8); ctx.fill(); ctx.globalAlpha = 1; }
  const pp = p * 4, s = (k) => Math.min(1, Math.max(0, pp - k));
  seg(ctx, x, y, x + w, y, s(0), seed, col, lw);
  seg(ctx, x + w, y, x + w, y + h, s(1), seed + 1, col, lw);
  seg(ctx, x + w, y + h, x, y + h, s(2), seed + 2, col, lw);
  seg(ctx, x, y + h, x, y, s(3), seed + 3, col, lw);
}
function arc(ctx, cx, cy, r, a0, a1, p, seed, col, lw) { // wobbly circle arc
  if (p <= 0) return;
  ctx.strokeStyle = col; ctx.lineCap = 'round';
  for (let pass = 0; pass < 2; pass++) {
    ctx.lineWidth = lw * (pass ? 0.55 : 1); ctx.globalAlpha = pass ? 0.55 : 0.95;
    ctx.beginPath();
    const n = 48;
    for (let i = 0; i <= n; i++) {
      const a = a0 + (a1 - a0) * Math.min(p, i / n), rr = r + jit(i + pass * 17, seed) * 4;
      const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------- scenes
const CW = 110, CH = 72, GX = 10, GY = 10, BOTTOM = 1380;
const cardXY = (x0, i) => [x0 + (i % 3) * (CW + GX), BOTTOM - (Math.floor(i / 3) + 1) * CH - Math.floor(i / 3) * GY];
const LX = 95, RX = 585;

function piles(ctx, t) {
  const gA = 1 - P(t, SC[2] - 0.35, SC[2]);
  if (gA <= 0) return;
  const cancel = P(t, 5.6, 6.8); // matched cards fade
  const hi = P(t, 6.4, 7.4);
  // blue pile: 17 cards (each = 10M)
  for (let i = 0; i < 17; i++) {
    const p = q(t, 1.0 + i * 0.1, 1.5 + i * 0.1);
    const [x, y] = cardXY(LX, i);
    const matched = i < 9;
    const a = gA * (matched ? 1 - 0.7 * cancel : 1);
    ctx.globalAlpha = a;
    box(ctx, x, y + (1 - p) * -40, CW, CH, p, 100 + i, C.ink, 4, C.blue, matched ? 0.5 : 0.6 + 0.2 * hi);
    ctx.globalAlpha = 1;
  }
  // orange pile: 9 cards (each = 10M)
  for (let i = 0; i < 9; i++) {
    const p = q(t, 1.3 + i * 0.12, 1.8 + i * 0.12);
    const [x, y] = cardXY(RX, i);
    ctx.globalAlpha = gA * (1 - 0.7 * cancel);
    box(ctx, x, y + (1 - p) * -40, CW, CH, p, 200 + i, C.ink, 4, C.orange, 0.55);
    ctx.globalAlpha = 1;
  }
  // numbers
  const n1 = Math.round(lerp(0, 170, E.outQuint(prog(t, 0.9, 2.8))));
  const n2 = Math.round(lerp(0, 92, E.outQuint(prog(t, 1.2, 3.0))));
  const showPlus = P(t, 6.6, 7.2);
  big(ctx, TX.n1.replace('170', String(n1)), LX + 175, 815, 80, C.ink, gA * (1 - showPlus));
  big(ctx, TX.n2.replace('92', String(n2)), RX + 175, 815, 80, C.ink, gA * (1 - 0.6 * showPlus));
  small(ctx, TX.l1, LX + 175, 865, 42, C.ink, gA * (1 - showPlus) * prog(t, 2.6, 3.2));
  small(ctx, TX.l2, RX + 175, 865, 42, C.ink, gA * prog(t, 2.8, 3.4));
  // highlight the 8 extra blue cards (+78)
  if (hi > 0) {
    const [x9, y9] = cardXY(LX, 9), [x17, y17] = cardXY(LX, 16);
    const top = y17 - 14, left = LX - 14, w = 3 * CW + 2 * GX + 28;
    const bottomY = y9 + CH + 14; // bottom of row index 3
    arc(ctx, 0, 0, 0, 0, 0, 0, 0, C.orange, 1); // no-op keeps style stable
    box(ctx, left, top, w, bottomY - top - (CH * 0 ), hi, 300, C.orange, 7, null);
    big(ctx, TX.plus, LX + 175, 815, 92, C.orange, showPlus);
  }
  small(ctx, TX.srcA, W / 2, 1450, 32, C.ink, 0.75 * gA);
}

function skills(ctx, t) {
  const a = P(t, SC[2] + 0.1, SC[2] + 0.5) * (1 - P(t, SC[3] - 0.3, SC[3]));
  if (a <= 0) return;
  ctx.globalAlpha = a;
  const cx = W / 2, cy = 1090, r = 210;
  const k = q(t, SC[2] + 0.3, SC[2] + 1.4);
  arc(ctx, cx, cy, r, 0, Math.PI * 2, k, 7, C.gray, 20);
  const fillP = E.outCubic(prog(t, SC[2] + 1.2, SC[2] + 2.8));
  arc(ctx, cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * 0.4, fillP, 9, C.orange, 32);
  big(ctx, '~40%', cx, cy + 34, 110, C.ink, prog(t, SC[2] + 1.6, SC[2] + 2.2));
  // 10 skill cards, 4 flip to orange
  for (let i = 0; i < 10; i++) {
    const x = 90 + i * 90, y = 1370;
    const p = q(t, SC[2] + 1.5 + i * 0.07, SC[2] + 2.0 + i * 0.07);
    const flip = i < 4 ? P(t, SC[2] + 2.8 + i * 0.25, SC[2] + 3.3 + i * 0.25) : 0;
    box(ctx, x, y + (1 - p) * 30, 76, 76, p, 400 + i, C.ink, 3, flip > 0.5 ? C.orange : C.blue, 0.55);
  }
  small(ctx, TX.srcA, W / 2, 1480, 30, C.ink, 0.75);
  ctx.globalAlpha = 1;
}

function person(ctx, x, y, p, seed, col, wave = 0) {
  arc(ctx, x, y - 120, 34, 0, Math.PI * 2, p, seed, col, 6);
  seg(ctx, x, y - 86, x, y + 30, p, seed + 1, col, 6);
  seg(ctx, x, y + 30, x - 36, y + 120, p, seed + 2, col, 6);
  seg(ctx, x, y + 30, x + 36, y + 120, p, seed + 3, col, 6);
  seg(ctx, x, y - 56, x + 110, y - 40 + wave, p, seed + 4, col, 6);
}
function robot(ctx, x, y, p, seed, col, wave = 0) {
  box(ctx, x - 40, y - 150, 80, 66, p, seed, col, 6, C.blue, 0.5);
  seg(ctx, x, y - 150, x, y - 182, p, seed + 5, col, 6);
  arc(ctx, x, y - 190, 8, 0, Math.PI * 2, p, seed + 6, C.orange, 6);
  box(ctx, x - 36, y - 78, 72, 100, p, seed + 7, col, 6, C.blue, 0.35);
  seg(ctx, x - 20, y + 22, x - 24, y + 110, p, seed + 8, col, 6);
  seg(ctx, x + 20, y + 22, x + 24, y + 110, p, seed + 9, col, 6);
  seg(ctx, x, y - 56, x - 110, y - 40 + wave, p, seed + 10, col, 6);
  arc(ctx, x - 14, y - 118, 5, 0, Math.PI * 2, p, seed + 11, col, 5);
  arc(ctx, x + 14, y - 118, 5, 0, Math.PI * 2, p, seed + 12, col, 5);
}
function together(ctx, t) {
  const a = P(t, SC[3] + 0.1, SC[3] + 0.5) * (1 - P(t, SC[4] - 0.3, SC[4]));
  if (a <= 0) return;
  ctx.globalAlpha = a;
  const pr = q(t, SC[3] + 0.3, SC[3] + 1.6), w = Math.sin(t * 3) * 6;
  ctx.save(); ctx.translate(W / 2, 1160); ctx.scale(1.35, 1.35); ctx.translate(-W / 2, -1160);
  person(ctx, 330, 1130, pr, 500, C.ink, w);
  robot(ctx, 750, 1130, pr, 600, C.ink, -w);
  // shared pencil
  const pp = q(t, SC[3] + 1.4, SC[3] + 2.2);
  seg(ctx, 440, 1090 + w, 640, 1090 - w, pp, 700, C.orange, 14);
  seg(ctx, 440, 1090 + w, 420, 1096 + w, pp, 701, C.ink, 6);
  ctx.restore();
  // split bar 52 / 45 / 3
  const bx = 110, bw = 820, by = 1350, bh = 72;
  const g = q(t, SC[3] + 2.2, SC[3] + 3.4);
  ctx.fillStyle = C.blue; ctx.fillRect(bx, by, bw * 0.52 * g, bh);
  ctx.fillStyle = C.orange; ctx.fillRect(bx + bw * 0.52 * g, by, bw * 0.45 * g, bh);
  ctx.fillStyle = C.gray; ctx.fillRect(bx + bw * 0.97 * g, by, bw * 0.03 * g, bh);
  box(ctx, bx, by, bw, bh, g, 800, C.ink, 4, null);
  small(ctx, TX.together + ' 52%', bx + bw * 0.26, by - 18, 44, C.ink, g);
  small(ctx, TX.delegated + ' 45%', bx + bw * 0.52 + bw * 0.225, by - 18, 44, C.ink, g);
  small(ctx, TX.srcB, W / 2, 1480, 30, C.ink, 0.75);
  ctx.globalAlpha = 1;
}

function employers(ctx, t) {
  const a = P(t, SC[4] + 0.1, SC[4] + 0.5) * (1 - P(t, SC[5] - 0.3, SC[5]));
  if (a <= 0) return;
  ctx.globalAlpha = a;
  const bx = 100, bw = 720, bh = 92;
  const g1 = q(t, SC[4] + 1.0, SC[4] + 2.4), g2 = q(t, SC[4] + 2.6, SC[4] + 4.0);
  small(ctx, TX.bar1, bx, 990, 46, C.ink, g1, 'left');
  ctx.fillStyle = C.blue; ctx.globalAlpha = a * 0.6; ctx.fillRect(bx, 1010, bw * 0.77 * g1, bh); ctx.globalAlpha = a;
  box(ctx, bx, 1010, bw * 0.77 * g1 + 0.01, bh, g1, 900, C.ink, 5, null);
  big(ctx, '77%', bx + bw * 0.77 * g1 + 95, 1010 + 68, 72, C.ink, g1);
  small(ctx, TX.bar2, bx, 1220, 40, C.ink, g2, 'left');
  ctx.fillStyle = C.orange; ctx.globalAlpha = a * 0.6; ctx.fillRect(bx, 1245, bw * 0.41 * g2, bh); ctx.globalAlpha = a;
  box(ctx, bx, 1245, bw * 0.41 * g2 + 0.01, bh, g2, 910, C.ink, 5, null);
  big(ctx, '41%', bx + bw * 0.41 * g2 + 95, 1245 + 68, 72, C.ink, g2);
  small(ctx, TX.srcA, W / 2, 1480, 30, C.ink, 0.75);
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------- film
M.film({
  fonts: [font(100, 800, 'Display'), font(40, 500, 'UI')],
  images: { logo: 'assets/logo.png' },
  samples: 1,
  async init() {},
  draw(ctx, u, t, IMG) {
    fill(ctx, C.ivory);
    const bl = (x, y, r, col, a) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.globalAlpha = a; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; };
    bl(W * (0.2 + 0.05 * Math.sin(t * 0.3)), H * 0.8, 700, '#BDE8F7', 0.5);
    bl(W * (0.85 - 0.05 * Math.cos(t * 0.25)), H * 0.35, 600, '#F6D2C2', 0.4);
    if (t >= SC[5]) { outro(ctx, t, IMG); return; }
    const s = FORMAT.safe;
    piles(ctx, t); skills(ctx, t); together(ctx, t); employers(ctx, t);
    if (t < SC[1]) drawLines(ctx, TX.hook, t, 0.05, SC[1], 92, s.y + 20);
    else if (t < SC[2]) drawLines(ctx, TX.s2, t, SC[1], SC[2], 84, s.y + 40);
    else if (t < SC[3]) drawLines(ctx, TX.s3, t, SC[2], SC[3], 84, s.y + 40);
    else if (t < SC[4]) drawLines(ctx, TX.s4, t, SC[3], SC[4], 80, s.y + 40);
    else drawLines(ctx, TX.s5, t, SC[4], SC[5], 80, s.y + 40);
  },
});

function outro(ctx, t, IMG) {
  fill(ctx, C.ivory);
  const k = springU(t, SC[5] + 0.05, SPRING.bouncy);
  const pulse = 1 + 0.025 * Math.max(0, Math.cos(((t - SC[5]) % BEAT) / BEAT * Math.PI * 2)) ** 3;
  const lw = 640 * k * pulse, lh = lw * (356 / 1200);
  if (IMG.logo && k > 0) ctx.drawImage(IMG.logo, W / 2 - lw / 2, 640 - lh / 2, lw, lh);
  const tp = E.outQuint(prog(t, SC[5] + 0.5, SC[5] + 1.1)), tp2 = E.outQuint(prog(t, SC[5] + 0.8, SC[5] + 1.4)), tp3 = E.outQuint(prog(t, SC[5] + 1.2, SC[5] + 1.8));
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.globalAlpha = tp; ctx.fillStyle = C.ink; ctx.font = font(58, 800, 'Display'); ctx.fillText('NeuroPuls AI Agency', W / 2, 860 + (1 - tp) * 40);
  ctx.globalAlpha = tp2; ctx.fillStyle = C.orange; ctx.font = font(36, 500, 'UI'); ctx.fillText('Beyond automation, into transformation.', W / 2, 930 + (1 - tp2) * 40);
  ctx.globalAlpha = tp3; ctx.fillStyle = C.ink; ctx.font = font(34, 500, 'UI'); ctx.fillText('@neuropuls.agency', W / 2, 1010 + (1 - tp3) * 30);
  ctx.globalAlpha = tp3 * 0.7; ctx.font = font(30, 500, 'UI'); ctx.fillText(TX.soft, W / 2, 1075 + (1 - tp3) * 30);
  ctx.globalAlpha = 1;
}
