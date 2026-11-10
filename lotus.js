// Focus Tree lotus: a pink lotus in a Chinese blue-and-white porcelain basin, drawn as SVG and grown by reading progress.
// Same shape as bonsai.js: lotusSvg(seed, p, detail, cls, layer)
// p = growth 0..1; layer 'all' | 'base' (stand + basin + water, stays still) | 'tree' (stems, leaves, flowers)
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = x => 1 - Math.pow(1 - x, 2);
const f = n => n.toFixed(1);
const rnd = s => () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
const WY = 352; // water level
const BLUE = '#2d4f8e', BLUE2 = '#4a6db0', PORC = '#f4f2ec';

// the plant: every stem rises from the water to a leaf or a flower; t = when it starts to grow
function build(seed) {
  const r = rnd((seed * 2654435761) % 4294967296 + 7), j = (a) => (r() - .5) * a;
  const leaves = [
    { x0: 150, x: 92 + j(10), y: 168 + j(10), rad: 62, k: .42, rot: -8, t: .05 },
    { x0: 232, x: 300 + j(10), y: 150 + j(10), rad: 66, k: .38, rot: 10, t: .12, under: true },
    { x0: 196, x: 168 + j(8), y: 236 + j(8), rad: 58, k: .5, rot: 4, t: .2 },
    { x0: 250, x: 262 + j(8), y: 262 + j(8), rad: 46, k: .55, rot: -6, t: .3 },
    { x0: 140, x: 82 + j(8), y: 270 + j(8), rad: 40, k: .5, rot: 12, t: .36 },
    { x0: 214, x: 228 + j(8), y: 108 + j(8), rad: 40, k: .32, rot: -14, t: .44, under: true }
  ];
  // flowers drawn after the leaves; main = open lotus, half = half-open, bud = closed bud with a dragonfly at the end
  const flowers = [
    { x0: 190, x: 176 + j(6), y: 76 + j(6), s: 74, t: .5, open: [.8, 1], tilt: -6 },
    { x0: 226, x: 272 + j(6), y: 200 + j(6), s: 40, t: .58, open: [.9, 1], max: .45, tilt: 12 },
    { x0: 168, x: 120 + j(6), y: 214 + j(6), s: 44, t: .66, open: [2, 2], tilt: -10, bud: true, fly: true },
    { x0: 244, x: 350 + j(6), y: 104 + j(6), s: 58, t: .54, open: [.74, .95], tilt: 14 },
    { x0: 150, x: 34 + j(6), y: 222 + j(6), s: 50, t: .62, open: [.84, 1], tilt: -16 },
    { x0: 236, x: 322 + j(6), y: 238 + j(6), s: 34, t: .72, open: [2, 2], tilt: 16, bud: true },
    { x0: 206, x: 214 + j(6), y: 186 + j(6), s: 30, t: .78, open: [2, 2], tilt: 4, bud: true }
  ];
  const pads = [{ x: 104, y: WY + 4, rx: 22, ry: 5 }, { x: 288, y: WY + 6, rx: 18, ry: 4 }, { x: 236, y: WY + 9, rx: 12, ry: 3 }];
  return { leaves, flowers, pads, bend: j(14) };
}

// ---------- the still part: carved wood stand, porcelain basin, water ----------
function fret(x1, x2, y, h) {
  // a running "hui" (回) key band
  let d = '', w = h * 1.4;
  for (let x = x1; x + w <= x2; x += w) d += 'M' + f(x) + ' ' + f(y + h) + 'v' + f(-h) + 'h' + f(w * .78) + 'v' + f(h * .7) + 'h' + f(-w * .45) + 'v' + f(-h * .35);
  return d;
}
function cloud(x, y, s) {
  // a ruyi cloud scroll
  return 'M' + f(x - 12 * s) + ' ' + f(y) + 'c0 ' + f(-8 * s) + ' ' + f(10 * s) + ' ' + f(-10 * s) + ' ' + f(12 * s) + ' ' + f(-2 * s) +
    'c' + f(2 * s) + ' ' + f(-8 * s) + ' ' + f(14 * s) + ' ' + f(-8 * s) + ' ' + f(14 * s) + ' 0' + 'c' + f(8 * s) + ' ' + f(-2 * s) + ' ' + f(12 * s) + ' ' + f(8 * s) + ' ' + f(2 * s) + ' ' + f(10 * s) +
    'M' + f(x - 4 * s) + ' ' + f(y - 3 * s) + 'c' + f(2 * s) + ' ' + f(-4 * s) + ' ' + f(8 * s) + ' ' + f(-3 * s) + ' ' + f(7 * s) + ' ' + f(1 * s);
}
function drawBase(m, p) {
  let s = '<defs>' +
    '<linearGradient id="lp" x1="0" x2="1"><stop offset="0" stop-color="#d9d6cc"/><stop offset=".3" stop-color="' + PORC + '"/><stop offset=".55" stop-color="#ffffff"/><stop offset="1" stop-color="#cfcbc0"/></linearGradient>' +
    '<radialGradient id="lw" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#5d7f6a"/><stop offset="1" stop-color="#2c4438"/></radialGradient>' +
    '<clipPath id="lb"><path d="M54 362 C56 404 82 446 126 460 L274 460 C318 446 344 404 346 362 Z"/></clipPath>' +
    '</defs>';
  // carved rosewood stand with curled feet
  s += '<path d="M70 466 L330 466 L336 478 L64 478 Z" fill="#5a2d1f"/><path d="M64 478 L336 478 L332 486 L68 486 Z" fill="#43211a"/>';
  s += '<path d="M80 486 q-4 10 -14 10 q-4 0 -2 -4 q6 -1 6 -6 Z M320 486 q4 10 14 10 q4 0 2 -4 q-6 -1 -6 -6 Z M190 486 h20 l-3 6 h-14 Z" fill="#43211a"/>';
  s += '<path d="M86 471 h228" stroke="#7a4430" stroke-width="1.5" stroke-dasharray="10 4 2 4"/>';
  // basin body
  s += '<ellipse cx="200" cy="462" rx="80" ry="7" fill="#b9b4a6"/>';
  s += '<path d="M54 362 C56 404 82 446 126 460 L274 460 C318 446 344 404 346 362 Z" fill="url(#lp)"/>';
  s += '<g clip-path="url(#lb)">' +
    '<path d="M50 370 h300 M50 388 h300 M50 444 h300" stroke="' + BLUE + '" stroke-width="2.2"/>' +
    '<path d="' + fret(58, 342, 373, 11) + '" stroke="' + BLUE + '" stroke-width="2" fill="none" stroke-linejoin="round"/>' +
    // a scroll of lotus and clouds painted in cobalt across the belly
    '<path d="M70 418 C100 398 124 434 156 414 C186 396 214 432 246 414 C276 398 300 430 330 412" stroke="' + BLUE + '" stroke-width="2.4" fill="none"/>' +
    '<path d="' + cloud(110, 420, 1) + cloud(200, 418, 1.15) + cloud(288, 420, 1) + '" stroke="' + BLUE2 + '" stroke-width="2" fill="none" stroke-linecap="round"/>' +
    '<path d="M150 408 q6 -12 12 0 q-6 6 -12 0 Z M244 408 q6 -12 12 0 q-6 6 -12 0 Z" fill="' + BLUE2 + '"/>' +
    '<path d="M90 452 l8 -8 l8 8 M130 452 l8 -8 l8 8 M170 452 l8 -8 l8 8 M210 452 l8 -8 l8 8 M250 452 l8 -8 l8 8 M290 452 l8 -8 l8 8" stroke="' + BLUE + '" stroke-width="1.6" fill="none"/>' +
    '<path d="M268 368 C290 392 292 430 276 456" stroke="#fff" stroke-width="6" opacity=".55" fill="none" stroke-linecap="round"/>' +
    '</g>';
  // rim and water
  s += '<ellipse cx="200" cy="358" rx="150" ry="18" fill="#e7e3d8"/><ellipse cx="200" cy="356" rx="150" ry="17" fill="' + PORC + '"/>';
  s += '<ellipse cx="200" cy="356" rx="150" ry="17" fill="none" stroke="' + BLUE + '" stroke-width="2.5"/>';
  s += '<ellipse cx="200" cy="356" rx="138" ry="13" fill="url(#lw)"/>';
  s += '<path d="M120 358 q30 -4 60 0 M220 360 q24 -3 48 0 M160 364 q20 -2 40 0" stroke="#9fc0ad" stroke-width="1.2" fill="none" opacity=".6"/>';
  // ripples spreading where the stems meet the water
  [[176, 359, 0], [232, 361, 1.6], [128, 358, 3.1]].forEach(([x, y, o]) => { s += '<ellipse class="rp" style="animation-delay:' + dl(4.5, o) + '" cx="' + x + '" cy="' + y + '" rx="16" ry="3.5" fill="none" stroke="#c9e0d2" stroke-width="1.2"/>'; });
  // small floating pads appear first
  m.pads.forEach((pd, i) => {
    const k = clamp((p - i * .05) / .2); if (k <= 0) return;
    const rx = pd.rx * (.4 + .6 * ease(k)), ry = pd.ry * (.4 + .6 * ease(k));
    s += '<path d="M' + f(pd.x) + ' ' + f(pd.y) + ' L' + f(pd.x + rx) + ' ' + f(pd.y - ry * .3) + ' A' + f(rx) + ' ' + f(ry) + ' 0 1 1 ' + f(pd.x + rx * .9) + ' ' + f(pd.y + ry * .5) + ' Z" fill="#5f8f45"/>';
  });
  return s;
}

// ---------- the growing part ----------
function stem(x0, x, y, k, bend, w) {
  const yy = WY - (WY - y) * k, xx = x0 + (x - x0) * k;
  return { d: 'M' + f(x0) + ' ' + (WY + 2) + ' Q' + f((x0 + xx) / 2 + bend) + ' ' + f((WY + yy) / 2) + ' ' + f(xx) + ' ' + f(yy), x: xx, y: yy, w };
}
function leaf(L, k) {
  // a lotus leaf seen at an angle: wavy round blade, cup-shaped, veins from the centre
  const rad = L.rad * (.35 + .65 * ease(k)), ky = L.k * (k < .5 ? .35 + k * 1.3 : 1), cx = L._x, cy = L._y, a = L.rot * Math.PI / 180;
  const pt = (t, rr) => { const x = Math.cos(t) * rr, y = Math.sin(t) * rr * ky; return [cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)]; };
  let edge = '';
  for (let i = 0; i <= 48; i++) { const t = i / 48 * Math.PI * 2, rr = rad * (1 + .045 * Math.sin(t * 9 + L.rad)); const [x, y] = pt(t, rr); edge += (i ? 'L' : 'M') + f(x) + ' ' + f(y); }
  edge += 'Z';
  const top = L.under ? '#9fbd72' : '#5c8c40', low = L.under ? '#7fa255' : '#3f6a2c';
  let s = '<path d="' + edge + '" fill="' + low + '" transform="translate(0 ' + f(rad * ky * .22) + ')"/>';
  s += '<path d="' + edge + '" fill="' + top + '"/>';
  // lighter inner bowl
  s += '<ellipse cx="' + f(cx) + '" cy="' + f(cy) + '" rx="' + f(rad * .55) + '" ry="' + f(rad * ky * .5) + '" transform="rotate(' + L.rot + ' ' + f(cx) + ' ' + f(cy) + ')" fill="' + (L.under ? '#b3cd8b' : '#6f9e4e') + '" opacity=".7"/>';
  let v = '';
  for (let i = 0; i < 13; i++) { const t = i / 13 * Math.PI * 2 + .2, [x, y] = pt(t, rad * .92); v += 'M' + f(cx) + ' ' + f(cy) + 'L' + f(x) + ' ' + f(y); }
  s += '<path d="' + v + '" stroke="' + (L.under ? '#c8dca4' : '#86b264') + '" stroke-width="1" opacity=".75"/>';
  s += '<circle cx="' + f(cx) + '" cy="' + f(cy) + '" r="' + f(2.5 + rad * .03) + '" fill="' + (L.under ? '#d9e6bf' : '#a7c87f') + '"/>';
  return s;
}
function petal(cx, cy, ang, len, wid, fill, tip) {
  // one pointed lotus petal growing out from (cx, cy) at angle ang (radians, 0 = straight up)
  const ux = Math.sin(ang), uy = -Math.cos(ang), nx = -uy, ny = ux;
  const tx = cx + ux * len, ty = cy + uy * len;
  const m1x = cx + ux * len * .45 + nx * wid, m1y = cy + uy * len * .45 + ny * wid, m2x = cx + ux * len * .45 - nx * wid, m2y = cy + uy * len * .45 - ny * wid;
  const d = 'M' + f(cx) + ' ' + f(cy) + 'Q' + f(m1x) + ' ' + f(m1y) + ' ' + f(tx) + ' ' + f(ty) + 'Q' + f(m2x) + ' ' + f(m2y) + ' ' + f(cx) + ' ' + f(cy) + 'Z';
  const t2 = 'M' + f(cx + ux * len * .55) + ' ' + f(cy + uy * len * .55) + 'Q' + f(cx + ux * len * .7 + nx * wid * .45) + ' ' + f(cy + uy * len * .7 + ny * wid * .45) + ' ' + f(tx) + ' ' + f(ty) + 'Q' + f(cx + ux * len * .7 - nx * wid * .45) + ' ' + f(cy + uy * len * .7 - ny * wid * .45) + ' ' + f(cx + ux * len * .55) + ' ' + f(cy + uy * len * .55) + 'Z';
  return '<path d="' + d + '" fill="' + fill + '" stroke="#e48aa6" stroke-width=".8"/><path d="' + t2 + '" fill="' + tip + '" opacity=".85"/>' +
    '<path d="M' + f(cx + ux * len * .12) + ' ' + f(cy + uy * len * .12) + 'L' + f(cx + ux * len * .8) + ' ' + f(cy + uy * len * .8) + '" stroke="#f3a3bb" stroke-width=".8" opacity=".7"/>';
}
function flower(F, k, open) {
  // open 0 = closed bud, 1 = fully open; k = how far it has grown (size)
  const s = F.s * (.35 + .65 * ease(k)), cx = F._x, cy = F._y, tl = F.tilt * Math.PI / 180;
  let h = '<path d="M' + f(cx - s * .16) + ' ' + f(cy + 2) + 'Q' + f(cx) + ' ' + f(cy + s * .14) + ' ' + f(cx + s * .16) + ' ' + f(cy + 2) + 'Z" fill="#6f9a4a"/>';
  const sp = .12 + open * .85; // how far the petals fan out
  // back petals
  [-1, -.5, 0, .5, 1].forEach(q => { h += petal(cx, cy, tl + q * sp * .75, s * (.9 + .1 * open), s * .3, '#f3b3c6', '#e47c9e'); });
  if (open > .15) {
    // seed pod and stamens
    const pr = s * .17 * clamp(open * 1.5);
    let st = '';
    for (let i = 0; i < 18; i++) { const a = -Math.PI + i / 17 * Math.PI, x = cx + Math.cos(a) * pr * 1.15, y = cy - s * .2 + Math.sin(a) * pr * .6; st += 'M' + f(cx + Math.cos(a) * pr * .7) + ' ' + f(cy - s * .2 + Math.sin(a) * pr * .3) + 'L' + f(x) + ' ' + f(y); }
    h += '<path d="' + st + '" stroke="#f0c63c" stroke-width="2" stroke-linecap="round"/>';
    h += '<ellipse cx="' + f(cx) + '" cy="' + f(cy - s * .21) + '" rx="' + f(pr) + '" ry="' + f(pr * .42) + '" fill="#e6d35a"/><ellipse cx="' + f(cx) + '" cy="' + f(cy - s * .22) + '" rx="' + f(pr * .8) + '" ry="' + f(pr * .3) + '" fill="#cdbf3e"/>';
  }
  // front petals: shorter, more open, so the centre shows between them
  if (open > .4) [-1.45, 1.45].forEach(q => { h += petal(cx, cy + 3, tl + q * sp, s * .7, s * .28, '#fbd5df', '#f19bb5'); });
  [-.62, -.2, .2, .62].forEach(q => { h += petal(cx, cy + 2, tl + q * sp * 1.05, s * (.78 + .08 * open), s * .3, '#f9cbd8', '#ee8eac'); });
  return h;
}
function dragonfly(x, y, d) {
  // seen from above; resting: four wings held flat and still. flying: a blurred set beats, fore and hind pairs out of step
  const W = (o) => '<ellipse cx="-10" cy="-4" rx="13" ry="4" fill="#ffffff" opacity="' + o + '" stroke="#9fb5c4" stroke-width=".6" transform="rotate(-14 -10 -4)"/>' +
    '<ellipse cx="10" cy="-4" rx="13" ry="4" fill="#ffffff" opacity="' + o + '" stroke="#9fb5c4" stroke-width=".6" transform="rotate(14 10 -4)"/>';
  const H = (o) => '<ellipse cx="-9" cy="2" rx="11" ry="3.4" fill="#ffffff" opacity="' + o + '" stroke="#9fb5c4" stroke-width=".6" transform="rotate(10 -9 2)"/>' +
    '<ellipse cx="9" cy="2" rx="11" ry="3.4" fill="#ffffff" opacity="' + o + '" stroke="#9fb5c4" stroke-width=".6" transform="rotate(-10 9 2)"/>';
  return '<g transform="translate(' + f(x) + ' ' + f(y) + ') rotate(-18)">' +
    '<g class="dw-rest" style="animation-delay:' + d + '">' + W(.55) + H(.45) + '</g>' +
    '<g class="dw-fly" opacity="0" style="animation-delay:' + d + '"><g class="wf">' + W(.5) + '</g><g class="wh">' + H(.42) + '</g></g>' +
    '<path d="M0 -6 L1.6 4 L1 26 L-1 26 L-1.6 4 Z" fill="#c4452f"/><circle cx="0" cy="-7" r="3.2" fill="#a83524"/></g>';
}
// gentle life inside the picture: leaves rock, flowers nod, the dragonfly perches, sallies out, hovers and darts, then returns to the same bud, ripples spread.
// delays start from the current clock so a regrown picture continues the motion instead of jumping back
let T0 = 0;
const dl = (period, off) => (-((T0 + off) % period)).toFixed(2) + 's';
const MOTION = '<style>@media (prefers-reduced-motion:no-preference){' +
  '.lf{transform-box:fill-box;transform-origin:50% 55%;animation:lf 6s ease-in-out infinite}' +
  '.fl{transform-box:fill-box;transform-origin:50% 100%;animation:fl 5s ease-in-out infinite}' +
  '.rp{transform-box:fill-box;transform-origin:50% 50%;animation:rp 4.5s ease-out infinite;opacity:0}' +
  '.df{transform-box:fill-box;transform-origin:50% 50%;animation:df 18s infinite}' +
  '@keyframes df{0%{transform:translate(0px,0px) rotate(0deg);animation-timing-function:linear}27%{transform:translate(0px,0px) rotate(0deg);animation-timing-function:cubic-bezier(.3,0,.2,1)}29%{transform:translate(-6px,-26px) rotate(-8deg);animation-timing-function:animation-timing-function:ease-in-out}33%{transform:translate(-3px,-30px) rotate(-6deg);animation-timing-function:animation-timing-function:cubic-bezier(.12,.9,.25,1)}36%{transform:translate(72px,-82px) rotate(28deg);animation-timing-function:animation-timing-function:ease-in-out}40%{transform:translate(76px,-86px) rotate(30deg);animation-timing-function:animation-timing-function:ease-in-out}43%{transform:translate(72px,-81px) rotate(28deg);animation-timing-function:animation-timing-function:cubic-bezier(.12,.9,.25,1)}45%{transform:translate(150px,-72px) rotate(28deg);animation-timing-function:animation-timing-function:ease-in-out}49%{transform:translate(153px,-76px) rotate(28deg);animation-timing-function:animation-timing-function:ease-in-out}51%{transform:translate(150px,-71px) rotate(28deg);animation-timing-function:cubic-bezier(.5,0,.5,1)}52%{transform:translate(150px,-71px) rotate(125deg);animation-timing-function:animation-timing-function:cubic-bezier(.12,.9,.25,1)}54%{transform:translate(192px,8px) rotate(125deg);animation-timing-function:animation-timing-function:ease-in-out}57%{transform:translate(188px,12px) rotate(125deg);animation-timing-function:animation-timing-function:ease-in-out}59%{transform:translate(188px,12px) rotate(125deg);animation-timing-function:animation-timing-function:cubic-bezier(.12,.9,.25,1)}61%{transform:translate(150px,-22px) rotate(125deg);animation-timing-function:animation-timing-function:ease-in-out}65%{transform:translate(146px,-26px) rotate(125deg);animation-timing-function:cubic-bezier(.5,0,.5,1)}66%{transform:translate(146px,-26px) rotate(262deg);animation-timing-function:animation-timing-function:cubic-bezier(.12,.9,.25,1)}69%{transform:translate(22px,-52px) rotate(262deg);animation-timing-function:animation-timing-function:ease-in-out}72%{transform:translate(14px,-46px) rotate(262deg);animation-timing-function:cubic-bezier(.4,0,.4,1)}75%{transform:translate(0px,-26px) rotate(360deg);animation-timing-function:animation-timing-function:ease-in-out}80%{transform:translate(0px,-12px) rotate(360deg);animation-timing-function:cubic-bezier(.4,0,.6,1)}83%{transform:translate(0px,0px) rotate(360deg);animation-timing-function:linear}100%{transform:translate(0px,0px) rotate(360deg);animation-timing-function:linear}}' +
  '.dw-rest{animation:dwr 18s infinite step-end}.dw-fly{animation:dwf 18s infinite step-end}' +
  '@keyframes dwr{0%{opacity:1}27.5%{opacity:0}82.5%{opacity:1}}@keyframes dwf{0%{opacity:0}27.5%{opacity:1}82.5%{opacity:0}}' +
  '.wf,.wh{transform-box:fill-box;transform-origin:50% 50%;animation:wb .07s linear infinite alternate}.wh{animation-delay:-.035s}' +
  '@keyframes wb{from{transform:scale(1,1)}to{transform:scale(.92,.45)}}' +
  '@keyframes lf{0%,100%{transform:rotate(-1.8deg)}50%{transform:rotate(1.8deg)}}' +
  '@keyframes fl{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2.4deg) translateY(-1px)}}' +
  '@keyframes rp{0%{transform:scale(.2);opacity:.8}100%{transform:scale(1.5);opacity:0}}}</style>';
function drawTree(m, p) {
  let s = '';
  if (p < .08) s += '<path d="M150 ' + (WY + 1) + ' q-2 -10 2 -16 q4 4 2 16 Z" fill="#7fa04a"/>'; // a rolled new leaf poking out
  const stems = [], items = [];
  m.leaves.forEach((L, i) => { const k = clamp((p - L.t) / .25); if (k <= 0) return; const st = stem(L.x0, L.x, L.y, ease(k), m.bend * .5, 2.6); stems.push(st); L._x = st.x; L._y = st.y; items.push([L._y, () => '<g class="lf" style="animation-delay:' + dl(6, i * 1.7) + '">' + leaf(L, k) + '</g>']); });
  m.flowers.forEach(F => {
    const k = clamp((p - F.t) / .22); if (k <= 0) return;
    const st = stem(F.x0, F.x, F.y, ease(k), m.bend * .3, 2.4); stems.push(st); F._x = st.x; F._y = st.y;
    const open = clamp((p - F.open[0]) / (F.open[1] - F.open[0])) * (F.max || 1);
    items.push([F._y + 1000, () => '<g class="fl" style="animation-delay:' + dl(5, F.t * 23) + '">' + flower(F, k, open) + '</g>']); // flowers always in front
    // the dragonfly lands on the bud once the plant is full grown; while animated it flies loops and comes back to land
    if (F.fly && p >= .97) items.push([1e5, () => '<g class="df" style="animation-delay:' + dl(18, 0) + '">' + dragonfly(F._x + 2, F._y - F.s * .95, dl(18, 0)) + '</g>']);
  });
  s += '<path d="' + stems.map(x => x.d).join('') + '" stroke="#5f8a3f" stroke-width="2.8" fill="none" stroke-linecap="round"/>';
  s += '<path d="' + stems.map(x => x.d).join('') + '" stroke="#8cb565" stroke-width=".9" fill="none" opacity=".7" transform="translate(-.8 0)"/>';
  // far (higher) leaves first so near ones overlap them
  items.sort((a, b) => a[0] - b[0]).forEach(it => { s += it[1](); });
  return s;
}

const cache = new Map();
function model(seed) { if (!cache.has(seed)) { if (cache.size > 40) cache.clear(); cache.set(seed, build(seed)); } return cache.get(seed); }
// anim = true adds the moving details (used on the focus screen while reading; small tiles stay still)
export function lotusInner(seed, p, detail = 1, layer = 'all', anim = false) {
  const m = model(seed); p = clamp(p); T0 = Date.now() / 1000;
  const s = layer === 'base' ? drawBase(m, p) : layer === 'tree' ? drawTree(m, p) : drawBase(m, p) + drawTree(m, p);
  return anim ? MOTION + s : s;
}
export function lotusSvg(seed, p, detail = 1, cls = 'lotus', layer = 'all', anim = false) {
  return '<svg class="' + cls + '" viewBox="-50 -30 500 530" width="500" height="530" preserveAspectRatio="xMidYMax meet" aria-hidden="true">' + lotusInner(seed, p, detail, layer, anim) + '</svg>';
}
