// Focus Tree hydrangea: a blue hydrangea bush in a hewn stone planter, drawn as SVG and grown by reading progress.
// Same shape as bonsai.js / lotus.js: hydrangeaSvg(seed, p, detail, cls, layer, anim)
// p = growth 0..1; layer 'all' | 'base' (step + planter + soil, stays still) | 'tree' (stems, leaves, flower heads)
// growth: sprout -> stems and leaves -> small green buds -> heads swell and turn blue -> full bloom with a snail on a leaf
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = x => 1 - Math.pow(1 - x, 2);
const f = n => n.toFixed(1);
const rnd = s => () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
const SY = 372; // soil level
// flower colours, from shade to light (blue, periwinkle, violet-blue)
const HUES = [
  ['#2f4f9e', '#3f63b8', '#5479cf', '#6f92de', '#9bb6ec', '#c9d8f6'],
  ['#3b4fa0', '#4d63bd', '#6679d3', '#8497e2', '#a9b8ee', '#d2dbf7'],
  ['#4a4398', '#5d56b4', '#766fcd', '#938cdd', '#b6aeea', '#dcd6f6'],
  ['#2d5f9c', '#3b78b8', '#5592cf', '#73aadf', '#9fc6ec', '#cfe3f7']
];
const BUD = ['#7e9a4a', '#93b05a', '#a8c46c', '#bcd47f', '#d0e39a', '#e3efbe'];
const mix = (a, b, t) => {
  const p = (h, i) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  return '#' + [0, 1, 2].map(i => Math.round(p(a, i) + (p(b, i) - p(a, i)) * t).toString(16).padStart(2, '0')).join('');
};

function build(seed) {
  const r = rnd((seed * 2654435761) % 4294967296 + 11), j = a => (r() - .5) * a;
  const hue = Math.floor(r() * HUES.length);
  // flower heads in a dome; x0 = where the stem leaves the soil; t = when the stem starts; o = when the head starts
  const heads = [
    { x0: 198, x: 200 + j(14), y: 122 + j(10), rad: 64, t: .04, o: .5 },
    { x0: 182, x: 126 + j(12), y: 168 + j(10), rad: 56, t: .08, o: .54 },
    { x0: 216, x: 280 + j(12), y: 162 + j(10), rad: 58, t: .1, o: .56 },
    { x0: 176, x: 74 + j(10), y: 240 + j(10), rad: 48, t: .16, o: .62 },
    { x0: 224, x: 328 + j(10), y: 236 + j(10), rad: 50, t: .18, o: .64 },
    { x0: 190, x: 160 + j(10), y: 248 + j(8), rad: 52, t: .22, o: .68 },
    { x0: 210, x: 248 + j(10), y: 254 + j(8), rad: 54, t: .26, o: .7 }
  ].map(h => ({ ...h, hue: (hue + (r() < .15 ? 1 : 0)) % HUES.length, bend: j(30), rot: j(.6), fl: [] }));
  // florets for each head: points on a sunflower spiral, the centre ones nearest the eye
  heads.forEach(h => {
    const n = 46;
    for (let i = 0; i < n; i++) {
      const d = Math.sqrt((i + .5) / n), a = i * 2.39996 + r() * .4;
      h.fl.push({ dx: Math.cos(a) * d, dy: Math.sin(a) * d * .9, d, rot: r() * 90, s: .9 + r() * .25 });
    }
    h.fl.sort((a, b) => b.d - a.d);
  });
  // leaves on each stem: pairs at points along the stem
  heads.forEach(h => {
    h.leaves = [.3, .52, .74, .93].map((at, i) => ({ at, side: i % 2 ? 1 : -1, len: 50 + r() * 16 - i * 3, tilt: j(.5) }));
  });
  // a skirt of big leaves around the base
  const skirt = [[-1, 120, 344, -2.2], [1, 280, 344, 2.2], [-1, 150, 356, -1.9], [1, 252, 358, 1.9], [-1, 92, 330, -2.5], [1, 312, 330, 2.5]].map(([sd, x, y, a], i) => ({ x: x + j(8), y, a: a + j(.2), len: 54 + r() * 12, t: .06 + i * .04 }));
  return { heads, skirt, snail: r() < .5 ? 0 : 1 };
}

// ---------- the still part: a stone step, a hewn granite planter, soil ----------
function drawBase(m, p) {
  let s = '<defs>' +
    '<linearGradient id="hpf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9b4a6"/><stop offset="1" stop-color="#8f8a7c"/></linearGradient>' +
    '<linearGradient id="hpt" x1="0" x2="1"><stop offset="0" stop-color="#cfcabd"/><stop offset=".5" stop-color="#ddd8cb"/><stop offset="1" stop-color="#c4bfb1"/></linearGradient>' +
    '<linearGradient id="hst" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6d1c4"/><stop offset="1" stop-color="#bdb7a8"/></linearGradient>' +
    '</defs>';
  // the stone step it stands on
  s += '<path d="M-10 474 L410 474 L420 496 L-20 496 Z" fill="url(#hst)"/><path d="M-20 496 L420 496 L420 506 L-20 506 Z" fill="#a49e8f"/>';
  s += '<path d="M40 484 h60 M150 488 h40 M260 483 h70" stroke="#a9a394" stroke-width="1.2"/>';
  s += '<ellipse cx="200" cy="476" rx="150" ry="6" fill="#8a8476" opacity=".35"/>';
  // planter: front face, top rim, inside
  s += '<path d="M78 384 L322 384 L314 472 L86 472 Z" fill="url(#hpf)"/>';
  s += '<path d="M66 368 L334 368 L326 386 L74 386 Z" fill="url(#hpt)"/>';
  s += '<path d="M84 370 L316 370 L312 380 L88 380 Z" fill="#4e3a2a"/>';
  // chisel marks and a crack
  let ch = '';
  for (let i = 0; i < 26; i++) { const x = 94 + i * 8.6, y = 396 + (i * 37 % 60); ch += 'M' + f(x) + ' ' + y + 'l3 6'; }
  s += '<path d="' + ch + '" stroke="#857f71" stroke-width="1" opacity=".6"/>';
  s += '<path d="M248 386 l-6 18 l5 10 l-4 16" stroke="#7d776a" stroke-width="1.2" fill="none"/>';
  // moss on the rim and down the corners
  s += '<path d="M66 368 q20 -5 40 0 q-6 6 -14 6 q-6 10 -14 4 q-8 4 -12 -10 Z" fill="#7e9a46"/>' +
    '<path d="M74 386 q6 22 2 40 q8 -16 10 -40 Z" fill="#6f8c3e"/>' +
    '<path d="M334 368 q-24 -4 -46 1 q8 6 18 5 q10 8 18 2 q8 2 10 -8 Z" fill="#7e9a46"/>' +
    '<path d="M322 386 q-4 18 -2 30 q-10 -12 -10 -30 Z" fill="#6f8c3e"/>' +
    '<path d="M140 472 q14 -8 30 0 Z M236 472 q10 -6 22 0 Z" fill="#7e9a46" opacity=".9"/>';
  // soil and a few pebbles
  s += '<path d="M88 374 q112 -10 224 0 L312 380 L88 380 Z" fill="#5b4532"/>';
  s += '<ellipse cx="128" cy="376" rx="6" ry="3" fill="#a59f92"/><ellipse cx="272" cy="377" rx="5" ry="2.5" fill="#b5afa1"/><ellipse cx="238" cy="375" rx="3.5" ry="2" fill="#968f81"/>';
  // fallen florets on the step once the bush is in bloom
  if (p > .9) {
    const c = HUES[m.heads[0].hue];
    [[40, 486, 0], [356, 489, 40], [372, 482, 20]].forEach(([x, y, a]) => { s += floret(x, y, 5, a, c[3], c[2]); });
  }
  return s;
}

// ---------- the growing part ----------
function floret(x, y, s, rot, fill, line) {
  // four rounded diamond petals around a tiny eye
  let d = '';
  for (let i = 0; i < 4; i++) {
    const a = (rot + i * 90) * Math.PI / 180, ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux;
    d += 'M' + f(x) + ' ' + f(y) + 'Q' + f(x + ux * s * .55 + nx * s * .55) + ' ' + f(y + uy * s * .55 + ny * s * .55) + ' ' + f(x + ux * s) + ' ' + f(y + uy * s) +
      'Q' + f(x + ux * s * .55 - nx * s * .55) + ' ' + f(y + uy * s * .55 - ny * s * .55) + ' ' + f(x) + ' ' + f(y) + 'Z';
  }
  return '<path d="' + d + '" fill="' + fill + '" stroke="' + line + '" stroke-width=".5"/>';
}
function head(h, k, bloom, detail) {
  // k = size growth 0..1, bloom 0 = tight green buds, 1 = full blue
  const R = h.rad * (.22 + .78 * ease(k)), cx = h._x, cy = h._y, C = HUES[h.hue];
  const col = i => bloom >= 1 ? C[i] : mix(BUD[i], C[i], bloom);
  // shadow body of the dome
  let s = '<ellipse cx="' + f(cx) + '" cy="' + f(cy + R * .06) + '" rx="' + f(R * 1.02) + '" ry="' + f(R * .92) + '" fill="' + col(0) + '"/>';
  s += '<ellipse cx="' + f(cx - R * .1) + '" cy="' + f(cy - R * .08) + '" rx="' + f(R * .86) + '" ry="' + f(R * .76) + '" fill="' + col(1) + '"/>';
  if (bloom < .25) {
    // tight buds: just dots
    let d = '';
    const n = Math.max(10, Math.round(h.fl.length * detail));
    h.fl.slice(-n).forEach(q => { const x = cx + q.dx * R * .92, y = cy + q.dy * R * .92, r = R * .09 * (1.1 - q.d * .4); d += 'M' + f(x - r) + ' ' + f(y) + 'a' + f(r) + ' ' + f(r) + ' 0 1 0 ' + f(2 * r) + ' 0a' + f(r) + ' ' + f(r) + ' 0 1 0 ' + f(-2 * r) + ' 0'; });
    return s + '<path d="' + d + '" fill="' + col(3) + '" stroke="' + col(1) + '" stroke-width=".6"/>';
  }
  // florets: light from upper left, so those up-left are paler; centre ones drawn last (closest)
  const n = Math.max(12, Math.round(h.fl.length * detail)), size = R * (.2 + .06 * bloom);
  const buckets = [[], [], [], []];
  h.fl.slice(-n).forEach(q => {
    const x = cx + q.dx * R * .9, y = cy + q.dy * R * .9;
    const lit = clamp(.55 - q.dx * .35 - q.dy * .45 + (1 - q.d) * .3);
    buckets[Math.min(3, Math.floor(lit * 4))].push([x, y, size * q.s * (1 - q.d * .3), q.rot + h.rot * 60]);
  });
  buckets.forEach((b, i) => {
    if (!b.length) return;
    let d = '';
    b.forEach(([x, y, z, rot]) => {
      for (let k2 = 0; k2 < 4; k2++) {
        const a = (rot + k2 * 90) * Math.PI / 180, ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux;
        d += 'M' + f(x) + ' ' + f(y) + 'Q' + f(x + ux * z * .55 + nx * z * .55) + ' ' + f(y + uy * z * .55 + ny * z * .55) + ' ' + f(x + ux * z) + ' ' + f(y + uy * z) +
          'Q' + f(x + ux * z * .55 - nx * z * .55) + ' ' + f(y + uy * z * .55 - ny * z * .55) + ' ' + f(x) + ' ' + f(y) + 'Z';
      }
    });
    s += '<path d="' + d + '" fill="' + col(i + 2) + '" stroke="' + col(i + 1) + '" stroke-width=".55"/>';
  });
  // tiny eyes in the middle of the near florets
  if (bloom > .6 && detail > .5) {
    let e = '';
    h.fl.slice(-14).forEach(q => { e += 'M' + f(cx + q.dx * R * .9) + ' ' + f(cy + q.dy * R * .9) + 'h.01'; });
    s += '<path d="' + e + '" stroke="' + col(0) + '" stroke-width="2" stroke-linecap="round" opacity=".7"/>';
  }
  return s;
}
function leaf(x, y, ang, len, k, dark) {
  // an oval hydrangea leaf with a pointed tip and saw-tooth edge; ang = direction it points (radians, 0 = right)
  const L = len * (.3 + .7 * ease(k)), W = L * .34, ux = Math.cos(ang), uy = Math.sin(ang), nx = -uy, ny = ux;
  const P = (t, w) => [x + ux * L * t + nx * w, y + uy * L * t + ny * w];
  const half = t => W * Math.pow(Math.sin(Math.PI * Math.pow(t, .85)), .9);
  let a = '', b = '';
  const N = 16;
  for (let i = 0; i <= N; i++) {
    const t = i / N, tooth = i % 2 && i < N ? 1.12 : 1;
    const [x1, y1] = P(t, half(t) * tooth), [x2, y2] = P(t, -half(t) * tooth);
    a += (i ? 'L' : 'M') + f(x1) + ' ' + f(y1); b = 'L' + f(x2) + ' ' + f(y2) + b;
  }
  const c1 = dark ? '#3f6a2e' : '#4f7d36', c2 = dark ? '#355b27' : '#416b2d';
  let s = '<path d="' + a + b + 'Z" fill="' + c1 + '"/>';
  // one half a little darker, as if folded along the midrib
  let hb = '';
  for (let i = 0; i <= N; i++) { const t = i / N, [x2, y2] = P(t, -half(t)); hb += (i ? 'L' : 'M') + f(x2) + ' ' + f(y2); }
  s += '<path d="' + hb + 'L' + f(x + ux * L) + ' ' + f(y + uy * L) + 'L' + f(x) + ' ' + f(y) + 'Z" fill="' + c2 + '"/>';
  // veins
  let v = 'M' + f(x) + ' ' + f(y) + 'L' + f(x + ux * L * .96) + ' ' + f(y + uy * L * .96);
  [.22, .4, .58, .74].forEach(t => {
    const [mx, my] = P(t, 0);
    [1, -1].forEach(sd => { const [ex, ey] = P(t + .16, sd * half(t + .1) * .85); v += 'M' + f(mx) + ' ' + f(my) + 'Q' + f(mx + nx * sd * W * .4 + ux * 2) + ' ' + f(my + ny * sd * W * .4 + uy * 2) + ' ' + f(ex) + ' ' + f(ey); });
  });
  s += '<path d="' + v + '" stroke="#86ad62" stroke-width=".9" fill="none" opacity=".75"/>';
  return s;
}
function snail(x, y, d) {
  // a small garden snail resting on a leaf; when animated it creeps a little and its eye stalks bob
  return '<g transform="translate(' + f(x) + ' ' + f(y) + ') scale(1.35)"><g class="sn" style="animation-delay:' + d + '">' +
    '<path d="M-14 4 C-10 -1 8 -1 16 2 C20 0 23 -4 24 -9 L26 -9 C26 -2 24 4 18 6 L-12 7 Z" fill="#d8ccb2"/>' +
    '<g class="sn-e" style="animation-delay:' + d + '"><path d="M21 -7 L19 -16 M24 -7 L26 -15" stroke="#cbbd9f" stroke-width="1.6" stroke-linecap="round"/><circle cx="19" cy="-16.5" r="1.4" fill="#5a4b3a"/><circle cx="26" cy="-15.5" r="1.4" fill="#5a4b3a"/></g>' +
    '<circle cx="0" cy="-6" r="10" fill="#b98a4e"/><path d="M0 -6 m-7 0 a7 7 0 1 1 7 7 a5 5 0 1 1 -5 -5 a3 3 0 1 1 3 3" stroke="#7e5a2e" stroke-width="1.6" fill="none"/>' +
    '<path d="M-6 -13 a9 9 0 0 1 10 -2" stroke="#e0c08e" stroke-width="1.6" fill="none" opacity=".8"/></g></g>';
}
function dew(x, y, r) {
  return '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + r + '" fill="#e8f4ff" opacity=".55"/><circle cx="' + f(x - r * .3) + '" cy="' + f(y - r * .3) + '" r="' + f(r * .35) + '" fill="#fff"/>';
}
// gentle life: heads nod, leaves rock, the snail creeps. Delays start from the current clock so a regrown picture keeps moving smoothly.
let T0 = 0;
const dl = (period, off) => (-((T0 + off) % period)).toFixed(2) + 's';
const MOTION = '<style>@media (prefers-reduced-motion:no-preference){' +
  '.hh{transform-box:fill-box;transform-origin:50% 100%;animation:hh 6s ease-in-out infinite}' +
  '.hl{transform-box:fill-box;transform-origin:0% 50%;animation:hl 5s ease-in-out infinite}' +
  '.sn{animation:sn 24s ease-in-out infinite}' +
  '.sn-e{transform-box:fill-box;transform-origin:30% 100%;animation:sne 3s ease-in-out infinite}' +
  '@keyframes hh{0%,100%{transform:rotate(-1.6deg)}50%{transform:rotate(1.6deg) translateY(-1px)}}' +
  '@keyframes hl{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}' +
  '@keyframes sn{0%,100%{transform:translateX(0)}45%,55%{transform:translateX(9px)}}' +
  '@keyframes sne{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.8)}}}</style>';
function drawTree(m, p, detail) {
  let s = '';
  if (p < .06) {
    // a pair of new leaves pushing up from the soil
    const k = .4 + p * 10;
    s += '<path d="M200 ' + SY + ' q-1 -10 0 -16" stroke="#6b8a3c" stroke-width="2.4" fill="none"/>';
    s += leaf(200, SY - 15, -2.6, 22, k, false) + leaf(200, SY - 15, -.5, 22, k, false);
    return s;
  }
  // skirt leaves first: they sit low behind the stems' front
  m.skirt.forEach((L, i) => { const k = clamp((p - L.t) / .2); if (k > 0) s += '<g class="hl" style="animation-delay:' + dl(5, i * 1.3) + '">' + leaf(L.x, L.y, L.a, L.len, k, true) + '</g>'; });
  const groups = [];
  let snailAt = null;
  m.heads.forEach((h, hi) => {
    const k = clamp((p - h.t) / .4); if (k <= 0) return;
    const e = ease(k), ex = h.x0 + (h.x - h.x0) * e, ey = SY - (SY - (h.y + h.rad * .7)) * e;
    const cx = (h.x0 + ex) / 2 + h.bend * e, cy = (SY + ey) / 2;
    const d = 'M' + h.x0 + ' ' + SY + 'Q' + f(cx) + ' ' + f(cy) + ' ' + f(ex) + ' ' + f(ey);
    const at = t => { const a = 1 - t; return [a * a * h.x0 + 2 * a * t * cx + t * t * ex, a * a * SY + 2 * a * t * cy + t * t * ey]; };
    let g = '<path d="' + d + '" stroke="#6d6a3e" stroke-width="' + f(2 + e * 2.2) + '" fill="none" stroke-linecap="round"/>' +
      '<path d="' + d + '" stroke="#9aa265" stroke-width="1" fill="none" opacity=".6" transform="translate(-.8 0)"/>';
    let lv = '';
    h.leaves.forEach((L, li) => {
      const lk = clamp((k - L.at * .55) / .3); if (lk <= 0) return;
      const [lx, ly] = at(L.at), [ax, ay] = at(L.at + .02), sa = Math.atan2(ay - ly, ax - lx);
      [L.side, -L.side].forEach((sd, q) => {
        const ang = sa + sd * (1.25 + L.tilt * .3) + (sd > 0 ? .15 : -.15);
        lv += '<g class="hl" style="animation-delay:' + dl(5, hi * 2.1 + li + q) + '">' + leaf(lx, ly, ang, L.len * (q ? .9 : 1), lk, q === 1) + '</g>';
      });
      if (hi === 5 + m.snail && li === 1) snailAt = [lx, ly, sa];
    });
    g += lv;
    // the flower head on top
    const hk = clamp((p - h.o) / .3);
    if (hk > 0) {
      h._x = ex; h._y = ey - h.rad * .55 * (.22 + .78 * ease(hk));
      const bloom = clamp((p - h.o - .1) / .18);
      g += '<g class="hh" style="animation-delay:' + dl(6, hi * 1.7) + '">' + head(h, hk, bloom, detail) + '</g>';
    }
    groups.push([h.y, g]);
  });
  // far (higher) heads first so the near ones overlap them
  groups.sort((a, b) => a[0] - b[0]).forEach(g => { s += g[1]; });
  // full bloom: dew on a few leaves and a snail
  if (p >= .97) {
    s += dew(120, 352, 2.6) + dew(292, 346, 2.2) + dew(86, 300, 2);
    if (snailAt) s += snail(snailAt[0] + (m.snail ? 22 : -40), snailAt[1] + 16, dl(24, 0));
  }
  return s;
}

const cache = new Map();
function model(seed) { if (!cache.has(seed)) { if (cache.size > 40) cache.clear(); cache.set(seed, build(seed)); } return cache.get(seed); }
// anim = true adds the moving details (used on the focus screen while reading; small tiles stay still)
export function hydrangeaInner(seed, p, detail = 1, layer = 'all', anim = false) {
  const m = model(seed); p = clamp(p); T0 = Date.now() / 1000;
  const dt = clamp(detail, .25, 1);
  const s = layer === 'base' ? drawBase(m, p) : layer === 'tree' ? drawTree(m, p, dt) : drawBase(m, p) + drawTree(m, p, dt);
  return anim ? MOTION + s : s;
}
export function hydrangeaSvg(seed, p, detail = 1, cls = 'hydrangea', layer = 'all', anim = false) {
  return '<svg class="' + cls + '" viewBox="-50 -30 500 530" width="500" height="530" preserveAspectRatio="xMidYMax meet" aria-hidden="true">' + hydrangeaInner(seed, p, detail, layer, anim) + '</svg>';
}
