// Focus screen backdrop for the hydrangea: a mossy stone stairway up to a dark wooden temple gate,
// lined with blue hydrangeas behind low wooden fences, under a sunlit green canopy (reference chosen by ไผ่).
// Light rays shimmer, the canopy sways, specks of light drift and a small white butterfly passes now and then.
// hydrangeaScene() returns markup; its styles come with it (classes start with hs-), so style.css doesn't change.
const f = n => n.toFixed(1);
const rnd = s => () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
// the picture is drawn in a 1000 x 1000 box and cropped to the screen around its centre
const V = 452;                         // y where the stairs meet the gate
const HW = y => 66 + (y - V) * .5;     // half width of the stairs at height y (narrow path, like the photo)
const SC = y => (y - V) / (1000 - V);  // 0 at the gate, 1 at the bottom (how near)

function canopy(r) {
  // layers of leaf clusters across the top and down both sides, pale where the sun comes through
  const cols = ['#e6efb8', '#d3e59a', '#bcd97f', '#9fc563', '#83ad4c', '#6a953c'];
  let s = '';
  for (let layer = 0; layer < 6; layer++) {
    // leaves are grouped into bunches (6 across the top, 3 down each side); each bunch hangs from its own
    // anchor point at the edge of the picture and sways on its own beat, so the canopy rustles instead of sliding as one
    const bunches = {};
    const n = 70 + layer * 10;
    for (let i = 0; i < n; i++) {
      // place along a U: across the top, then down the left and right edges
      const u = r(), side = u < .5 ? 0 : u < .75 ? -1 : 1;
      let x, y;
      if (side === 0) { x = r() * 1000; y = r() * (190 + layer * 18) - 20; }
      else { x = side < 0 ? r() * (150 + layer * 14) - 30 : 1030 - r() * (150 + layer * 14); y = r() * 560 + 60; }
      // keep the middle above the gate open so the gate shows
      if (side === 0 && Math.abs(x - 500) < 150 && y > 150 + layer * 6) y -= 90;
      const k = 10 + r() * 16, a = r() * Math.PI;
      const key = side === 0 ? 't' + Math.min(5, Math.max(0, Math.floor(x / 167))) : (side < 0 ? 'l' : 'r') + Math.min(2, Math.max(0, Math.floor((y - 60) / 187)));
      bunches[key] = (bunches[key] || '') + 'M' + f(x) + ' ' + f(y) + 'q' + f(Math.cos(a) * k) + ' ' + f(Math.sin(a) * k - k) + ' ' + f(Math.cos(a) * k * 2) + ' ' + f(Math.sin(a) * k * 2) + 'q' + f(-Math.cos(a) * k * .4) + ' ' + f(k) + ' ' + f(-Math.cos(a) * k * 2) + ' ' + f(-Math.sin(a) * k * 2) + 'z';
    }
    Object.keys(bunches).forEach((key, bi) => {
      const idx = +key.slice(1), ox = key[0] === 't' ? idx * 167 + 83 : key[0] === 'l' ? -40 : 1040, oy = key[0] === 't' ? -30 : 60 + idx * 187 + 93;
      const dur = 7 + ((layer * 3 + bi * 5) % 7) * .6, del = -((layer * 2.3 + bi * 1.7) % dur);
      s += '<g class="hs-cl' + (key[0] === 't' ? '' : ' hs-side') + '" style="transform-origin:' + ox + 'px ' + oy + 'px;animation-duration:' + dur.toFixed(1) + 's;animation-delay:' + del.toFixed(1) + 's">' +
        '<path d="' + bunches[key] + '" fill="' + cols[layer] + '" opacity="' + (.9 - layer * .05) + '"/></g>';
    });
  }
  // a few drooping willow strands from the top
  [[140, 0, 150], [260, 10, 110], [700, 0, 130], [840, 6, 170], [920, 20, 120]].forEach(([x, y, len], i) => {
    let l = '';
    for (let k = 1; k < 10; k++) { const yy = y + len * k / 10, xx = x + Math.sin(k * .6) * 4; l += 'M' + f(xx) + ' ' + f(yy) + 'q' + (k % 2 ? 9 : -9) + ' 4 ' + (k % 2 ? 3 : -3) + ' 12q' + (k % 2 ? -3 : 3) + ' -5 ' + (k % 2 ? -3 : 3) + ' -12z'; }
    s += '<g class="hs-strand" style="animation-delay:' + (-i * 1.7).toFixed(1) + 's;transform-origin:' + x + 'px ' + y + 'px"><path d="M' + x + ' ' + y + 'v' + len + '" stroke="#8ea455" stroke-width="1.4"/><path d="' + l + '" fill="#a8c56a"/></g>';
  });
  return s;
}
function backwood(r) {
  // soft, out-of-focus shrubs and trees behind the gate (irregular clumps, not a smooth hill)
  let s = '';
  [['#b6d27f', 300, 60, .9], ['#9cc066', 360, 44, .95], ['#86ad55', 410, 30, 1]].forEach(([c, top, sz, op]) => {
    let d = '';
    for (let i = 0; i < 46; i++) {
      const x = 180 + i * 14 + (r() - .5) * 10, dx = Math.abs(x - 500) / 320, y = top + dx * dx * 60 + (r() - .5) * 30, rr = sz * (.6 + r() * .6);
      d += 'M' + f(x - rr) + ' ' + f(y) + 'a' + f(rr) + ' ' + f(rr * .8) + ' 0 1 0 ' + f(2 * rr) + ' 0a' + f(rr) + ' ' + f(rr * .8) + ' 0 1 0 ' + f(-2 * rr) + ' 0';
    }
    s += '<path d="' + d + '" fill="' + c + '" opacity="' + op + '"/><path d="M160 ' + (top + 20) + ' H840 V520 H160Z" fill="' + c + '" opacity="' + op + '"/>';
  });
  return s;
}
function gate() {
  // a dark wooden gate with a hipped roof at the top of the stairs, a lighter garden glimpsed through it
  return '<g>' +
    '<rect x="420" y="348" width="160" height="108" fill="#2f2a22"/>' +
    '<rect x="446" y="372" width="108" height="84" fill="#6b7a4e"/><rect x="446" y="372" width="108" height="84" fill="url(#hsg)"/>' +
    '<path d="M446 456 L476 410 L526 410 L554 456Z" fill="#8e9a6c" opacity=".7"/>' +
    '<rect x="420" y="348" width="16" height="108" fill="#3d362b"/><rect x="564" y="348" width="16" height="108" fill="#3d362b"/>' +
    '<rect x="436" y="360" width="128" height="10" fill="#3a342a"/>' +
    '<path d="M360 340 L400 300 L600 300 L640 340 L626 346 L374 346Z" fill="#4a4a48"/>' +
    '<path d="M360 340 L640 340 L626 346 L374 346Z" fill="#2c2c2a"/>' +
    '<path d="M400 300 L600 300 L596 294 L404 294Z" fill="#5c5c58"/>' +
    '<path d="M388 312 h224 M376 326 h248" stroke="#3b3b38" stroke-width="1.2"/>' +
  '</g>';
}
function stairs(r) {
  // rough natural stone steps from the far gate down to the viewer: each step is a few uneven slabs,
  // a darker worn face (riser) under a lighter top (tread) with grit, moss creeping in from both sides
  let s = '';
  const N = 24, ys = [];
  for (let i = 0; i <= N; i++) ys.push(V + (1040 - V) * Math.pow(i / N, 1.5) + (i && i < N ? (r() - .5) * 4 : 0));
  // earth bed under the steps, seen in the gaps
  s += '<path d="M' + f(500 - HW(V) - 6) + ' ' + V + ' L' + f(500 + HW(V) + 6) + ' ' + V + ' L' + f(500 + HW(1040) + 30) + ' 1040 L' + f(500 - HW(1040) - 30) + ' 1040Z" fill="#6f6a58"/>';
  // jagged line across a step at height y, between half widths
  const edge = (y, w, amp, n) => { const pts = []; for (let k = 0; k <= n; k++) { const t = k / n; pts.push([500 - w + 2 * w * t, y + (k && k < n ? (r() - .5) * amp : 0)]); } return pts; };
  const line = pts => pts.map((p, k) => (k ? 'L' : 'M') + f(p[0]) + ' ' + f(p[1])).join('');
  const back = pts => pts.slice().reverse().map(p => 'L' + f(p[0]) + ' ' + f(p[1])).join('');
  for (let i = 0; i < N; i++) {
    const y1 = ys[i], y2 = ys[i + 1], h = y2 - y1, sc = SC(y1), mid = y1 + h * (.38 + (r() - .5) * .1);
    const w1 = HW(y1) + (r() - .5) * 8 * sc, wm = HW(mid) + (r() - .5) * 10 * sc, w2 = HW(y2);
    const amp = 1 + 5 * sc, n = 8 + Math.round(sc * 8);
    const top = edge(y1, w1, amp * .6, n), lip = edge(mid, wm, amp, n), bot = edge(y2, w2, amp * .4, n);
    // tread (lit top) and riser (shadowed face)
    s += '<path d="' + line(top) + back(lip) + 'Z" fill="' + (i % 3 ? '#bdb8aa' : '#c4bfb1') + '"/>';
    s += '<path d="' + line(lip) + back(bot) + 'Z" fill="' + (i % 2 ? '#8f8a7d' : '#989385') + '"/>';
    // worn lighter rim along the lip, darker shadow under it
    s += '<path d="' + line(lip) + '" stroke="#d9d5ca" stroke-width="' + f(.8 + 2.2 * sc) + '" fill="none" stroke-linejoin="round"/>';
    s += '<path d="' + line(lip.map(p => [p[0], p[1] + 1.5 + 3 * sc])) + '" stroke="#77725f" stroke-width="' + f(.6 + 1.8 * sc) + '" fill="none" opacity=".6"/>';
    // gaps between slabs on the riser and tread
    let jd = '';
    const nb = 2 + Math.floor(r() * 3);
    for (let b = 1; b < nb; b++) {
      const t = b / nb + (r() - .5) * .14, x = 500 - wm + 2 * wm * t;
      jd += 'M' + f(x + (r() - .5) * 6 * sc) + ' ' + f(y1 + 1) + 'L' + f(x) + ' ' + f(mid) + 'L' + f(x + (x - 500) * .03 + (r() - .5) * 5 * sc) + ' ' + f(y2 - 1);
    }
    s += '<path d="' + jd + '" stroke="#6a6556" stroke-width="' + f(.6 + 1.6 * sc) + '" fill="none"/>';
    // grit and pebbles on the tread, pits on the face
    if (sc > .12) {
      let g = '', pt = '';
      for (let q = 0; q < 6 + sc * 18; q++) { const x = 500 + (r() * 2 - 1) * wm * .9, y = y1 + r() * (mid - y1); g += 'M' + f(x) + ' ' + f(y) + 'h' + f(.6 + r() * 2 * sc); }
      for (let q = 0; q < 4 + sc * 10; q++) { const x = 500 + (r() * 2 - 1) * wm * .9, y = mid + 3 + r() * (y2 - mid - 5); pt += 'M' + f(x) + ' ' + f(y) + 'h' + f(1 + r() * 3 * sc); }
      s += '<path d="' + g + '" stroke="#8f8a7c" stroke-width="' + f(1 + sc * 1.5) + '" stroke-linecap="round" opacity=".7"/>';
      s += '<path d="' + pt + '" stroke="#77725f" stroke-width="' + f(1 + sc * 2) + '" stroke-linecap="round" opacity=".55"/>';
    }
    // moss: green-tinted ends of each step and soft cushions along the sides
    [-1, 1].forEach(sd => {
      const x0 = 500 + sd * w1, x1 = 500 + sd * wm, inner = (18 + r() * 40) * (.3 + sc);
      s += '<path d="M' + f(x0) + ' ' + f(y1) + 'L' + f(x0 - sd * inner) + ' ' + f(y1) + 'Q' + f(x1 - sd * inner * .6) + ' ' + f(mid) + ' ' + f(x1 - sd * inner * .3) + ' ' + f(mid + h * .3) + 'L' + f(500 + sd * w2) + ' ' + f(y2) + 'Z" fill="#6f8a3e" opacity=".55"/>';
      const n2 = 1 + Math.floor(r() * 3);
      for (let q = 0; q < n2; q++) {
        const mx = 500 + sd * (wm - (2 + r() * 30) * (.3 + sc)), my = mid + (r() - .4) * h * .5, rx = (5 + r() * 14) * (.3 + sc), ry = rx * (.35 + r() * .2);
        s += '<ellipse cx="' + f(mx) + '" cy="' + f(my) + '" rx="' + f(rx) + '" ry="' + f(ry) + '" fill="' + (q % 2 ? '#86a24e' : '#738f42') + '" opacity=".9"/>';
      }
      // a tuft of moss right in the middle of some steps
      if (r() < .25) { const mx = 500 + (r() - .5) * wm, rx = (4 + r() * 10) * (.3 + sc); s += '<ellipse cx="' + f(mx) + '" cy="' + f(mid - 1) + '" rx="' + f(rx) + '" ry="' + f(rx * .3) + '" fill="#7d9848" opacity=".8"/>'; }
    });
  }
  return s;
}
function bank(r, side) {
  // the green slope beside the stairs with a low post-and-rail fence and hydrangea bushes behind it, far to near
  let s = '';
  const edge = y => 500 + side * HW(y);
  // green slope
  s += '<path d="M' + f(edge(V)) + ' ' + V + ' L' + f(edge(1040)) + ' 1040 L' + (side < 0 ? -40 : 1040) + ' 1040 L' + (side < 0 ? -40 : 1040) + ' 330Z" fill="#5f8a3c"/>';
  s += '<path d="M' + f(edge(V)) + ' ' + V + ' L' + f(edge(1040)) + ' 1040 L' + f(edge(1040) + side * 120) + ' 1040Z" fill="#79a04a" opacity=".6"/>';
  const items = [];
  // bushes: a leafy mound with flower heads on it
  for (let i = 0; i < 44; i++) {
    const t = Math.pow(i / 43, 1.2), y = V - 30 + (1060 - V) * t, sc = .25 + SC(Math.max(V, y)) * 1.1;
    const x = edge(Math.max(V, y)) + side * (i % 2 ? 70 + r() * 90 : -6 + r() * 40) * sc;
    items.push([y, () => {
      let g = '<g transform="translate(' + f(x) + ' ' + f(y) + ') scale(' + f(sc) + ')">';
      g += '<ellipse cx="0" cy="-30" rx="82" ry="52" fill="#4c7a32"/><ellipse cx="' + (-side * 20) + '" cy="-46" rx="60" ry="38" fill="#5e8c3c"/>';
      // leaves along the bottom edge of the mound
      let lv = '';
      for (let k = 0; k < 7; k++) { const lx = -70 + k * 23, ly = -6 - (k % 2) * 8; lv += 'M' + lx + ' ' + ly + 'q10 -16 22 -2q-10 12 -22 2z'; }
      g += '<path d="' + lv + '" fill="#6e9a44"/>';
      // flower heads
      const nh = 3 + Math.floor(r() * 3);
      for (let k = 0; k < nh; k++) {
        const hx = -60 + r() * 120, hy = -60 - r() * 40, hr = 18 + r() * 12, c = ['#5e7fd4', '#7a95e0', '#6c86d8', '#8f9fe3', '#8a86d6'][Math.floor(r() * 5)];
        g += '<circle cx="' + f(hx) + '" cy="' + f(hy) + '" r="' + f(hr) + '" fill="' + c + '"/>';
        g += '<circle cx="' + f(hx - hr * .25) + '" cy="' + f(hy - hr * .25) + '" r="' + f(hr * .62) + '" fill="#b9c9f2" opacity=".55"/>';
        // speckles of florets on near bushes
        if (sc > .6) { let sp = ''; for (let q = 0; q < 10; q++) { const a = r() * 6.28, d = Math.sqrt(r()) * hr * .85; sp += 'M' + f(hx + Math.cos(a) * d) + ' ' + f(hy + Math.sin(a) * d) + 'h.01'; } g += '<path d="' + sp + '" stroke="#dfe7fb" stroke-width="4" stroke-linecap="round" opacity=".7"/>'; }
      }
      return g + '</g>';
    }]);
  }
  // fence posts along the step edge with a rail on top
  const posts = [];
  for (let i = 0; i < 14; i++) { const y = V + (1040 - V) * Math.pow(i / 13, 1.5); posts.push([edge(y) + side * 10 * (.3 + SC(y)), y, 10 + 60 * SC(y)]); }
  posts.forEach(([x, y, h], i) => {
    const w = 2 + 8 * SC(y);
    items.push([y + 60, () => '<rect x="' + f(x - w / 2) + '" y="' + f(y - h) + '" width="' + f(w) + '" height="' + f(h) + '" fill="#6b5236"/><rect x="' + f(x - w / 2) + '" y="' + f(y - h) + '" width="' + f(w * .35) + '" height="' + f(h) + '" fill="#8a6c48"/>']);
    if (i) {
      const [px, py, ph] = posts[i - 1];
      items.push([y + 59, () => '<path d="M' + f(px) + ' ' + f(py - ph * .92) + 'L' + f(x) + ' ' + f(y - h * .92) + 'M' + f(px) + ' ' + f(py - ph * .45) + 'L' + f(x) + ' ' + f(y - h * .45) + '" stroke="#6f5739" stroke-width="' + f(1.2 + 5 * SC(y)) + '" stroke-linecap="round"/>']);
    }
  });
  items.sort((a, b) => a[0] - b[0]).forEach(it => { s += it[1](); });
  return s;
}
const STYLE = '<style>' +
  '.hs{position:absolute;inset:0;pointer-events:none;overflow:hidden;background:#e9efcf}' +
  '.hs-art{position:absolute;inset:0;width:100%;height:100%}' +
  '.hs-sun{position:absolute;left:50%;top:6%;width:min(90vw,620px);aspect-ratio:1;translate:-50% 0;border-radius:50%;background:radial-gradient(circle,rgba(255,252,226,.95) 0%,rgba(250,244,196,.55) 38%,rgba(250,244,196,0) 70%)}' +
  '.hs-rays{position:absolute;inset:0;background:repeating-linear-gradient(112deg,rgba(255,250,215,0) 0 70px,rgba(255,250,215,.28) 70px 110px,rgba(255,250,215,0) 110px 200px);-webkit-mask-image:linear-gradient(180deg,#000 0%,rgba(0,0,0,.6) 45%,transparent 75%);mask-image:linear-gradient(180deg,#000 0%,rgba(0,0,0,.6) 45%,transparent 75%)}' +
  '.hs-veil{position:absolute;left:0;right:0;bottom:0;height:34%;background:linear-gradient(180deg,rgba(236,232,220,0),rgba(236,232,220,.22) 60%,rgba(236,232,220,.35))}' +
  '.hs-mote{position:absolute;width:5px;height:5px;border-radius:50%;background:#fffbe0;box-shadow:0 0 8px 2px rgba(255,250,210,.8);opacity:0}' +
  '.hs-mote.m1{left:22%;top:40%}.hs-mote.m2{left:70%;top:32%}.hs-mote.m3{left:44%;top:22%}.hs-mote.m4{left:84%;top:52%}.hs-mote.m5{left:12%;top:58%}' +
  '.hs-leaf{position:absolute;top:2%;width:14px;height:7px;border-radius:14px 0;background:#9fc563;opacity:0}' +
  '.hs-leaf.f1{left:18%}.hs-leaf.f2{left:62%;background:#bcd97f;width:11px;height:6px}.hs-leaf.f3{left:38%;background:#83ad4c}.hs-leaf.f4{left:80%;width:12px}' +
  '.hs-fly{position:absolute;left:-30px;top:44%;width:22px;height:auto;opacity:0}' +
  '.focus.withered .hs{filter:grayscale(.65) sepia(.25) brightness(.95)}' +
  '.focus-island .tree-stack.k-hydrangea .tl-tree{transform-origin:50% 72%}' +
  '.tree-stack.k-hydrangea .tree-leaf{width:9px;height:9px;border-radius:2px;rotate:45deg;background:#7f9ce6}' +
  '.tree-stack.k-hydrangea .tree-leaf.l1{background:#a9bdf0}.tree-stack.k-hydrangea .tree-leaf.l3{background:#8f87dc}' +
  '.tree-stack.k-hydrangea .tree-glow{background:radial-gradient(closest-side,rgba(226,234,255,.9),rgba(170,190,245,.35) 55%,rgba(170,190,245,0))}' +
  '@media (prefers-reduced-motion:no-preference){' +
    '.focus.k-hydrangea:not(.withered):not(.paused) .focus-island .tree-img.tl-tree{animation:hs-tree 6s ease-in-out infinite}' +
    '.hs-rays{animation:hs-rays 9s ease-in-out infinite alternate}' +
    '.hs-cl{transform-box:view-box;animation:hs-rustle 8s ease-in-out infinite}.hs-side{animation-name:hs-rustle-s}' +
    '.hs-strand{transform-box:view-box;animation:hs-strand 6s ease-in-out infinite}' +
    '.hs-leaf{animation:hs-fall 16s linear infinite}.hs-leaf.f2{animation-duration:19s;animation-delay:-6s}.hs-leaf.f3{animation-duration:22s;animation-delay:-12s}.hs-leaf.f4{animation-duration:18s;animation-delay:-15s}' +
    '.hs-mote{animation:hs-mote 12s ease-in-out infinite}.hs-mote.m2{animation-delay:-3s;animation-duration:14s}.hs-mote.m3{animation-delay:-6s}.hs-mote.m4{animation-delay:-8s;animation-duration:15s}.hs-mote.m5{animation-delay:-10s;animation-duration:13s}' +
    '.hs-fly{animation:hs-fly 40s linear infinite}.hs-fly .hs-w{transform-box:fill-box;transform-origin:50% 100%;animation:hs-flap .18s ease-in-out infinite alternate}' +
  '}' +
  '@keyframes hs-tree{0%,100%{transform:rotate(-.5deg)}50%{transform:rotate(.5deg)}}' +
  '@keyframes hs-rays{from{opacity:.55}to{opacity:1}}' +
  // a soft breeze with a stronger gust about two thirds of the way through each beat
  '@keyframes hs-rustle{0%,100%{transform:rotate(0deg)}18%{transform:rotate(1.4deg)}34%{transform:rotate(-.8deg)}48%{transform:rotate(.9deg)}60%{transform:rotate(3deg) translateX(6px)}70%{transform:rotate(-1.4deg)}82%{transform:rotate(.7deg)}}' +
  '@keyframes hs-rustle-s{0%,100%{transform:rotate(0deg)}20%{transform:rotate(1.6deg)}38%{transform:rotate(-1deg)}60%{transform:rotate(2.6deg) translateY(-4px)}72%{transform:rotate(-1.2deg)}86%{transform:rotate(.6deg)}}' +
  '@keyframes hs-strand{0%,100%{transform:rotate(-3deg)}30%{transform:rotate(4deg)}55%{transform:rotate(-2deg)}62%{transform:rotate(8deg)}78%{transform:rotate(-4deg)}}' +
  '@keyframes hs-fall{0%{opacity:0;translate:0 0;rotate:0deg}4%{opacity:.9}20%{translate:6vw 14vh;rotate:140deg}40%{translate:-2vw 28vh;rotate:260deg}58%{translate:8vw 42vh;rotate:420deg}66%{opacity:.85}72%,100%{opacity:0;translate:4vw 52vh;rotate:520deg}}' +
  '@keyframes hs-mote{0%{opacity:0;translate:0 0}25%{opacity:.9}50%{opacity:.6;translate:14px -30px}75%{opacity:.9}100%{opacity:0;translate:-6px -60px}}' +
  '@keyframes hs-fly{0%{opacity:0;translate:0 0}1%{opacity:.95}5%{translate:18vw -40px}9%{translate:34vw 10px}13%{translate:52vw -30px}17%{translate:72vw 20px}22%{translate:calc(100vw + 40px) -20px;opacity:.95}23%,100%{translate:calc(100vw + 40px) -20px;opacity:0}}' +
  '@keyframes hs-flap{from{scale:1 1}to{scale:1 .3}}' +
'</style>';
const FLY = '<svg class="hs-fly" viewBox="0 0 24 20"><path class="hs-w" d="M12 10 C6 0 0 2 2 8 C3 11 8 11 12 10Z M12 10 C18 0 24 2 22 8 C21 11 16 11 12 10Z" fill="#fbf8ee" stroke="#d9d3bd" stroke-width=".6"/><path d="M12 6 v10" stroke="#5a5040" stroke-width="1.4" stroke-linecap="round"/></svg>';
let cached = '';
export function hydrangeaScene() {
  if (!cached) {
    const r = rnd(20261124);
    cached = '<div class="zen hs" aria-hidden="true">' + STYLE +
      '<div class="hs-sun"></div>' +
      '<svg class="hs-art" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">' +
        '<defs><linearGradient id="hsg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe0a6" stop-opacity=".9"/><stop offset="1" stop-color="#cfe0a6" stop-opacity="0"/></linearGradient></defs>' +
        // soft green backdrop behind the gate
        '<path d="M0 0 H1000 V520 H0Z" fill="#cfe1a0"/><ellipse cx="500" cy="300" rx="380" ry="220" fill="#e9f0c4"/>' +
        backwood(r) +
        gate() + stairs(r) + bank(r, -1) + bank(r, 1) + canopy(r) +
      '</svg>' +
      '<div class="hs-rays"></div><div class="hs-veil"></div>' +
      '<i class="hs-mote m1"></i><i class="hs-mote m2"></i><i class="hs-mote m3"></i><i class="hs-mote m4"></i><i class="hs-mote m5"></i>' +
      '<i class="hs-leaf f1"></i><i class="hs-leaf f2"></i><i class="hs-leaf f3"></i><i class="hs-leaf f4"></i>' +
      FLY +
    '</div>';
  }
  return cached;
}
