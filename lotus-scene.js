// Focus screen backdrop for the lotus: a Chinese water garden at dawn.
// ink-wash karst mountains + a far pavilion, drifting mist, willow strands from the top corner,
// a pond with lily pads, ripples and slow koi, swallows passing now and then, and a stone terrace in front.
// lotusScene() returns markup; all colours and motion live in style.css under .ls (classes start with ls-).
const f = n => n.toFixed(1);
function karst(base, peaks, h) {
  // a ridge of rounded limestone peaks: peaks = [[x, height, width], ...]
  let d = 'M0 ' + base;
  peaks.forEach(([x, ph, w]) => {
    d += ' L' + (x - w) + ' ' + base + ' C' + (x - w * .8) + ' ' + (base - ph * .55) + ' ' + (x - w * .45) + ' ' + (base - ph) + ' ' + x + ' ' + (base - ph) +
      ' C' + (x + w * .45) + ' ' + (base - ph) + ' ' + (x + w * .8) + ' ' + (base - ph * .55) + ' ' + (x + w) + ' ' + base;
  });
  return d + ' L1200 ' + base + ' L1200 ' + h + ' L0 ' + h + 'Z';
}
function willow() {
  // strands hang from a branch that enters from the top-left corner
  let s = '<path d="M-20 8 C80 20 170 10 260 34 C300 44 330 40 360 30" stroke="#5b5a44" stroke-width="5" fill="none" stroke-linecap="round"/>';
  const xs = [30, 62, 96, 128, 160, 196, 228, 262, 300, 334];
  xs.forEach((x, i) => {
    const top = 12 + Math.sin(i * 1.7) * 6 + (x > 200 ? (x - 200) * .12 : 0), len = 150 + (i * 47 % 110), bend = (i % 2 ? 1 : -1) * (8 + i * 3 % 10);
    let leaves = '';
    for (let k = 1; k < 12; k++) {
      const t = k / 12, y = top + len * t, x2 = x + bend * t * t;
      leaves += 'M' + f(x2) + ' ' + f(y) + 'q' + (k % 2 ? 11 : -11) + ' 5 ' + (k % 2 ? 4 : -4) + ' 15q' + (k % 2 ? -4 : 4) + ' -7 ' + (k % 2 ? -4 : 4) + ' -15z';
    }
    s += '<g class="ls-strand" style="animation-delay:' + (-i * 1.3).toFixed(1) + 's;transform-origin:' + x + 'px ' + f(top) + 'px">' +
      '<path d="M' + x + ' ' + f(top) + ' Q' + f(x + bend * .3) + ' ' + f(top + len * .5) + ' ' + f(x + bend) + ' ' + f(top + len) + '" stroke="#7d8a4c" stroke-width="1.8" fill="none"/>' +
      '<path d="' + leaves + '" fill="' + (i % 3 ? '#93a85a' : '#a9bb6c') + '" opacity=".9"/></g>';
  });
  return s;
}
function pads() {
  let s = '';
  [[90, 40, 34], [240, 70, 26], [930, 34, 30], [1080, 74, 38], [1150, 26, 20], [640, 22, 16]].forEach(([x, y, r]) => {
    s += '<path d="M' + x + ' ' + y + ' L' + (x + r) + ' ' + f(y - r * .08) + ' A' + r + ' ' + f(r * .26) + ' 0 1 1 ' + f(x + r * .92) + ' ' + f(y + r * .1) + 'Z" fill="#7aa063" opacity=".85"/>';
  });
  // two far lotuses on the pond
  [[180, 50, 1], [1010, 52, .8]].forEach(([x, y, k]) => {
    s += '<g transform="translate(' + x + ' ' + y + ') scale(' + k + ')"><path d="M0 0 C-10 -6 -12 -18 -6 -26 C-4 -16 -2 -10 0 -8 C2 -10 4 -16 6 -26 C12 -18 10 -6 0 0Z" fill="#f2b3c5"/><path d="M0 -4 C-4 -12 -2 -24 0 -30 C2 -24 4 -12 0 -4Z" fill="#f7cdd8"/><path d="M0 0 v30" stroke="#6f9a4a" stroke-width="2"/></g>';
  });
  return s;
}
const KOI = '<svg class="ls-koi" viewBox="0 0 60 24"><path d="M6 12 C14 2 34 2 44 10 L58 3 L54 12 L58 21 L44 14 C34 22 14 22 6 12Z" fill="#f08a3c"/><path d="M18 7 C22 10 22 14 18 17 C26 15 28 9 18 7Z" fill="#fff4ea"/><circle cx="11" cy="11" r="1.4" fill="#3a2a20"/></svg>';
const SWALLOW = '<svg class="ls-bird" viewBox="0 0 40 16"><path d="M0 4 C8 6 14 9 20 12 C26 9 32 6 40 2 C32 8 26 12 20 15 C14 12 8 8 0 4Z" fill="#3f4652"/></svg>';
export function lotusScene() {
  return '<div class="zen ls" aria-hidden="true">' +
    '<div class="ls-sun"></div>' +
    '<svg class="ls-hills" viewBox="0 0 1200 500" preserveAspectRatio="xMidYMax slice">' +
      '<defs>' +
        '<linearGradient id="lsh1" x1="0" y1="0" x2="0" y2="1"><stop offset=".1" stop-color="#c3ced3"/><stop offset=".75" stop-color="#c3ced3" stop-opacity="0"/></linearGradient>' +
        '<linearGradient id="lsh2" x1="0" y1="0" x2="0" y2="1"><stop offset=".2" stop-color="#a2b4b6"/><stop offset=".85" stop-color="#a2b4b6" stop-opacity="0"/></linearGradient>' +
        '<linearGradient id="lsh3" x1="0" y1="0" x2="0" y2="1"><stop offset=".3" stop-color="#7f9693"/><stop offset="1" stop-color="#7f9693" stop-opacity=".1"/></linearGradient>' +
      '</defs>' +
      '<path d="' + karst(330, [[90, 170, 70], [230, 250, 80], [380, 190, 70], [700, 230, 90], [860, 280, 80], [1010, 200, 80], [1150, 240, 70]], 500) + '" fill="url(#lsh1)"/>' +
      '<path d="' + karst(400, [[40, 150, 70], [300, 210, 90], [520, 150, 80], [780, 170, 90], [980, 230, 90], [1180, 160, 70]], 500) + '" fill="url(#lsh2)"/>' +
      // a small pavilion on the right-hand ridge
      '<g transform="translate(948 196)" fill="#6c807f"><path d="M-30 0 C-18 -4 -8 -14 0 -22 C8 -14 18 -4 30 0 C20 -2 -20 -2 -30 0Z"/><rect x="-18" y="0" width="3" height="16"/><rect x="15" y="0" width="3" height="16"/><rect x="-22" y="14" width="44" height="3"/></g>' +
      '<path d="' + karst(470, [[160, 120, 110], [470, 90, 120], [880, 130, 120], [1120, 100, 90]], 500) + '" fill="url(#lsh3)"/>' +
    '</svg>' +
    '<div class="zen-mist m1"></div><div class="zen-mist m2"></div>' +
    '<div class="ls-pond">' +
      '<svg class="ls-pads" viewBox="0 0 1200 100" preserveAspectRatio="xMidYMid slice">' + pads() +
        '<ellipse class="ls-rip" cx="330" cy="60" rx="40" ry="5"/><ellipse class="ls-rip r2" cx="820" cy="44" rx="34" ry="4"/><ellipse class="ls-rip r3" cx="560" cy="78" rx="46" ry="6"/>' +
      '</svg>' + KOI + KOI.replace('ls-koi', 'ls-koi k2').replace('#f08a3c', '#f4f0e8').replace('#fff4ea', '#e2553a') +
    '</div>' +
    '<div class="ls-terrace"></div>' +
    '<svg class="ls-willow" viewBox="0 0 380 340" preserveAspectRatio="xMinYMin meet">' + willow() + '</svg>' +
    SWALLOW + SWALLOW.replace('ls-bird', 'ls-bird b2') +
  '</div>';
}
