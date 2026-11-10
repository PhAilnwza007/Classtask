// Focus Tree bonsai: a bonsai on a mossy rock, drawn as SVG and grown by reading progress.
// bonsaiSvg(seed, p, detail): seed picks the branch layout (each student/tree gets its own),
// p = growth 0..1, detail = leaf density (1 for the big tree, lower for small thumbnails).
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = x => 1 - Math.pow(1 - x, 2);
const cache = new Map();
  const rnd = s => () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
// trunks: points from base upward [x, y], base width
const TRUNKS = [
  { pts: [[150, 268], [141, 226], [150, 186], [164, 148], [182, 112], [204, 86]], w: 22, side: 0.3, t: 0 },
  { pts: [[168, 270], [174, 230], [190, 196], [214, 164], [236, 140]], w: 15, side: 0.8, t: 0.05 },
  { pts: [[128, 272], [126, 238], [114, 206], [100, 184], [84, 168]], w: 12, side: -1, t: 0.1 },
  { pts: [[212, 338], [228, 302], [252, 272], [282, 248], [312, 234], [336, 226]], w: 15, side: 1, t: 0.12 },
  { pts: [[222, 354], [252, 328], [286, 312], [322, 304], [352, 302]], w: 11, side: 1, t: 0.18 }
];
const LEAF = ['#4f6d2f', '#62813a', '#7a9a48', '#93b45d', '#a9c873'];
function build(seed, detail) {
  const r = rnd((seed * 2654435761) % 4294967296 + 1);
  const branches = [], pads = [];
  const addPad = (x, y, w, t) => {
    const n = Math.max(3, Math.round(w * 1.15 * detail)), dots = [];
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r());
      const dx = Math.cos(a) * d * w / 2, dy = Math.sin(a) * d * w * 0.2 - Math.abs(Math.cos(a)) * d * w * 0.04;
      // light on top of the pad, dark underneath
      const rel = (dy + w * .24) / (w * .48), idx = Math.max(0, Math.min(4, Math.floor((1 - rel) * 4.2 + (r() - .5) * 1.4)));
      dots.push([dx, dy + (dy > 0 ? dy * 0.6 : 0), (r() - .5) * 60, LEAF[idx]]);
    }
    dots.sort((a, b) => b[1] - a[1]);
    pads.push({ x, y, w, t, dots });
  };
  const twig = (x, y, ang, len, w, depth, t) => {
    const bend = (r() - .5) * .5;
    const mx = x + Math.cos(ang) * len * .5, my = y + Math.sin(ang) * len * .5 + len * .08;
    const x2 = x + Math.cos(ang + bend) * len, y2 = y + Math.sin(ang + bend) * len;
    branches.push({ x, y, mx, my, x2, y2, w, t });
    if (depth >= 3 || len < 9) { addPad(x2, y2 - 3, 14 + len * .55 + r() * 10, t + .1); return; }
    // split into 2–3 smaller twigs, fanning up and out
    const n = 2 + (r() < .3 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const spread = n === 2 ? (i ? .38 : -.38) : (i - 1) * .45;
      twig(x2, y2, ang + spread + (r() - .5) * .35 - .12, len * (.58 + r() * .2), w * .62, depth + 1, t + .06);
    }
    if (depth >= 2 && r() < .35) addPad(x2, y2 - 4, 12 + r() * 10, t + .12);
  };
  TRUNKS.forEach(T => {
    const pts = T.pts;
    // branch points on every trunk node and halfway between nodes
    const nodes = [];
    for (let i = 1; i < pts.length; i++) { nodes.push([(pts[i - 1][0] + pts[i][0]) / 2, (pts[i - 1][1] + pts[i][1]) / 2, (i - .5) / (pts.length - 1)]); nodes.push([pts[i][0], pts[i][1], i / (pts.length - 1)]); }
    for (let j = 1; j < nodes.length; j++) {
      const [x, y, frac] = nodes[j], i = j === nodes.length - 1 ? pts.length - 1 : 2;
      const dirs = T.side === -1 ? [-1, 1] : T.side === 1 ? [1, r() < .4 ? -1 : 1] : [r() < .5 ? -1 : 1, r() < .5 ? -1 : 1];
      if (frac < .3) continue;
      dirs.slice(0, i === pts.length - 1 ? 2 : 1).forEach(sd => {
        const ang = sd > 0 ? -0.25 - r() * .35 : Math.PI + 0.25 + r() * .35;
        twig(x, y, ang, 22 + r() * 20 + (1 - frac) * 16, T.w * .4 * (1.2 - frac), 0, T.t + .22 + frac * .3);
      });
    }
    const top = pts[pts.length - 1]; addPad(top[0], top[1] - 6, 40 + r() * 16, T.t + .55);
  });
  // balance: fill two dome-shaped crowns evenly, so no side looks bare.
  // every empty spot in the crown gets a short twig from the nearest branch and a leaf pad
  const tips = branches.map(b => [b.x2, b.y2, b.t]);
  TRUNKS.forEach(T => T.pts.slice(2).forEach(q => tips.push([q[0], q[1], T.t + .3])));
  const crowns = [{ cx: 196, cy: 150, rx: 150, ry: 82 }, { cx: 300, cy: 262, rx: 74, ry: 40 }];
  crowns.forEach(C => {
    for (let gy = -1; gy <= .45; gy += .2) for (let gx = -1; gx <= 1; gx += .13) {
      if (gx * gx + gy * gy > 1) continue;
      const x = C.cx + gx * C.rx + (r() - .5) * 10, y = C.cy + gy * C.ry + (r() - .5) * 8;
      if (pads.some(pd => Math.hypot(pd.x - x, (pd.y - y) * 1.8) < 24)) continue;
      let best = null, bd = 1e9;
      tips.forEach(t => { const d = Math.hypot(t[0] - x, t[1] - y); if (d < bd && t[1] > y - 10) { bd = d; best = t; } });
      if (!best || bd > 90) continue;
      branches.push({ x: best[0], y: best[1], mx: (best[0] + x) / 2, my: (best[1] + y) / 2 + 4, x2: x, y2: y, w: 1.2, t: best[2] + .05 });
      addPad(x, y, 22 + r() * 12, best[2] + .12);
    }
  });
  // moss dots on the rock top
  const moss = [];
  for (let i = 0; i < 520 * detail; i++) { const x = 84 + r() * 170, y = 268 + Math.abs(x - 165) * .12 + r() * 30 + (x > 220 ? (x - 220) * 1.4 : 0); moss.push([x, y, 1.2 + r() * 2.2, LEAF[Math.floor(r() * 4)]]); }
  for (let i = 0; i < 60; i++) { const x = 200 + r() * 90, y = 380 + r() * 40; moss.push([x, y, 1.2 + r() * 2.2, LEAF[Math.floor(r() * 4)]]); }
  return { branches, pads, moss };
}
function trunkPath(pts, w, k) {
  // cut the polyline at fraction k of its length, then outline it with a taper
  const seg = []; let L = 0;
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
  let left = L * k; const P2 = [pts[0]];
  for (let i = 1; i < pts.length && left > 0; i++) { const d = seg[i - 1], f = Math.min(1, left / d); P2.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f]); left -= d; }
  if (P2.length < 2) return '';
  const A = [], B = [];
  P2.forEach((p, i) => {
    const q = P2[Math.min(P2.length - 1, i + 1)], o = P2[Math.max(0, i - 1)];
    let nx = -(q[1] - o[1]), ny = q[0] - o[0]; const n = Math.hypot(nx, ny) || 1; nx /= n; ny /= n;
    const ww = w * (1 - .78 * i / (pts.length - 1)) * (.35 + .65 * k) / 2;
    A.push([p[0] + nx * ww, p[1] + ny * ww]); B.push([p[0] - nx * ww, p[1] - ny * ww]);
  });
  const line = arr => arr.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  return line(A) + ' ' + B.reverse().map(p => 'L' + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ') + 'Z';
}
function draw(model, p) {
  let s = '';
  // stand and pot
  s += '<path d="M40 452 L362 446 L368 470 L348 470 L344 492 L64 494 L60 472 L36 472 Z" fill="#4b2a1c"/><path d="M40 452 L362 446 L364 454 L42 460 Z" fill="#6b3d28"/>';
  s += '<ellipse cx="226" cy="436" rx="104" ry="13" fill="#5c3424"/><path d="M122 436 Q124 452 150 454 L302 454 Q328 452 330 436 Z" fill="#6e3f2b"/>';
  s += '<ellipse cx="226" cy="433" rx="98" ry="9" fill="#6b7d3d"/>';
  // rock
  s += '<path d="M80 302 C78 276 112 262 158 262 C204 262 236 272 240 300 C246 330 236 352 252 378 C266 400 300 410 312 428 L148 434 C126 430 108 418 104 400 C82 396 64 378 70 356 C58 344 62 318 80 302 Z" fill="#8a8172"/>';
  s += '<path d="M86 330 C110 338 130 326 156 334 C182 342 200 330 226 338 M96 372 C124 368 150 380 178 372 M118 404 C146 398 176 410 214 402" stroke="#6f6658" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>';
  // moss carpet on the rock top, then fine moss texture on it
  s += '<path d="M82 300 C90 272 122 262 160 262 C200 262 230 270 238 296 C244 316 240 334 246 352 C232 340 226 318 214 306 C190 292 160 300 136 292 C114 286 96 300 82 300 Z" fill="#5f7a34"/><path d="M196 388 C214 372 244 368 268 384 C290 398 304 412 310 426 L214 428 C204 414 192 402 196 388 Z" fill="#5f7a34"/>';
  const mossShow = .35 + .65 * clamp(p * 3);
  const mossC = {};
  model.moss.forEach(([x, y, r, c], i) => { if (i / model.moss.length < mossShow) mossC[c] = (mossC[c] || '') + 'M' + (x - r).toFixed(1) + ' ' + y.toFixed(1) + 'a' + r.toFixed(1) + ' ' + r.toFixed(1) + ' 0 1 0 ' + (2 * r).toFixed(1) + ' 0a' + r.toFixed(1) + ' ' + r.toFixed(1) + ' 0 1 0 ' + (-2 * r).toFixed(1) + ' 0Z'; });
  Object.keys(mossC).forEach(c => { s += '<path d="' + mossC[c] + '" fill="' + c + '"/>'; });
  // trunks
  TRUNKS.forEach(T => {
    const k = clamp((p - T.t) / .5); if (k <= 0) { if (p < .15) s += '<path d="M' + T.pts[0][0] + ' ' + T.pts[0][1] + ' q-3 -8 0 -12 q6 2 4 8" fill="#7fa04a"/>'; return; }
    const d = trunkPath(T.pts, T.w, ease(k));
    s += '<path d="' + d + '" fill="#5b4a3c"/><path d="' + d + '" fill="none" stroke="#857262" stroke-width="1.2" stroke-dasharray="6 9" opacity=".7"/>';
  });
  // branches
  // twigs: one path per thickness so thousands of twigs stay a handful of elements
  const byW = {};
  model.branches.forEach(b => {
    const k = clamp((p - b.t) / .2); if (k <= 0) return;
    const x2 = b.x + (b.x2 - b.x) * k, y2 = b.y + (b.y2 - b.y) * k, mx = b.x + (b.mx - b.x) * k, my = b.y + (b.my - b.y) * k;
    const w = Math.max(.7, Math.round(b.w * 2) / 2);
    byW[w] = (byW[w] || '') + 'M' + b.x.toFixed(1) + ' ' + b.y.toFixed(1) + 'Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1);
  });
  Object.keys(byW).forEach(w => { s += '<path d="' + byW[w] + '" stroke="#5f4d3e" stroke-width="' + w + '" fill="none" stroke-linecap="round"/>'; });
  // foliage pads, back to front
  const byC = {};
  model.pads.forEach(pd => {
    const k = clamp((p - pd.t) / .3); if (k <= 0) return;
    const sc = .45 + .55 * ease(k), n = Math.ceil(pd.dots.length * ease(k));
    for (let i = 0; i < n; i++) {
      const [dx, dy, rot, c] = pd.dots[i], cx = pd.x + dx * sc, cy = pd.y + dy * sc, a = rot * Math.PI / 180, ex = Math.cos(a) * 3.2, ey = Math.sin(a) * 3.2;
      byC[c] = (byC[c] || '') + 'M' + (cx - ex).toFixed(1) + ' ' + (cy - ey).toFixed(1) + 'a3.2 1.6 ' + rot.toFixed(0) + ' 1 0 ' + (2 * ex).toFixed(1) + ' ' + (2 * ey).toFixed(1) + 'a3.2 1.6 ' + rot.toFixed(0) + ' 1 0 ' + (-2 * ex).toFixed(1) + ' ' + (-2 * ey).toFixed(1) + 'Z';
    }
  });
  // a soft shadow under every pad gives the layered bonsai look
  let shade = '';
  model.pads.forEach(pd => { const k = clamp((p - pd.t) / .3); if (k <= 0) return; const sc = .45 + .55 * ease(k), rx = pd.w * .46 * sc, ry = pd.w * .1 * sc, cy = pd.y + pd.w * .1 * sc; shade += 'M' + (pd.x - rx).toFixed(1) + ' ' + cy.toFixed(1) + 'a' + rx.toFixed(1) + ' ' + ry.toFixed(1) + ' 0 1 0 ' + (2 * rx).toFixed(1) + ' 0a' + rx.toFixed(1) + ' ' + ry.toFixed(1) + ' 0 1 0 ' + (-2 * rx).toFixed(1) + ' 0Z'; });
  if (shade) s += '<path d="' + shade + '" fill="#3d5524" opacity=".55"/>';
  LEAF.forEach(c => { if (byC[c]) s += '<path d="' + byC[c] + '" fill="' + c + '"/>'; });
  return s;
}

export function bonsaiModel(seed, detail = 1) {
  const key = seed + ':' + detail;
  if (!cache.has(key)) { if (cache.size > 40) cache.clear(); cache.set(key, build(seed, detail)); }
  return cache.get(key);
}
export function bonsaiInner(seed, p, detail = 1) { return draw(bonsaiModel(seed, detail), clamp(p)); }
export function bonsaiSvg(seed, p, detail = 1, cls = 'bonsai') {
  return '<svg class="' + cls + '" viewBox="-50 -30 500 530" width="500" height="530" preserveAspectRatio="xMidYMax meet" aria-hidden="true">' + bonsaiInner(seed, p, detail) + '</svg>';
}
