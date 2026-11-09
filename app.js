import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, collection, collectionGroup, onSnapshot, setDoc, addDoc, updateDoc, writeBatch, serverTimestamp, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig, CLASS_ID, EDITORS } from "./firebase-config.js?v=2";
import { DEFAULT_ROSTER } from "./roster-default.js";
import { TREE_IMG } from "./trees.js?v=2";

const TM = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const TMF = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const TD = ['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'];
const TDF = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
const ICON = {
  check: '<path d="M20 6 9 17l-5-5"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15Z"/><path d="M6.5 17A2.5 2.5 0 0 0 4 19.5 2.5 2.5 0 0 0 6.5 22H20v-5"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>',
  sprout: '<path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>',
  play: '<path d="M7 4.5v15l12.5-7.5z"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  sound: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
  mute: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="m22 9-6 6M16 9l6 6"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>'
};
const ico = k => '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[k] + '</svg>';

// subs: { taskId: Set(เลขที่ที่ส่งแล้ว) }, claims: { เลขที่: uid }
const S = { className: 'ม.4/2', roster: [], tasks: [], subs: {}, claims: {}, loaded: { cls: false, tasks: false }, error: '' };
const ui = { auth: null, view: 'tasks', open: null, filter: 'all', editing: null, confirmDel: null, confirmRelease: null, claimPick: '', claimConfirm: false, month: null, sel: null, showPast: false, rosterEdit: false };
try { const sv = JSON.parse(sessionStorage.getItem('ct-ui') || 'null'); if (sv) { ui.view = sv.view || 'tasks'; ui.open = sv.open || null; } } catch (e) {}
let user = null, canEdit = false, myNo = null, busy = false, unsubMe = null;

const root = document.getElementById('root');
const configured = firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('YOUR_');

let auth, db, classRef, tasksRef;
const P = (...seg) => doc(db, 'classes', CLASS_ID, ...seg);
if (configured) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  classRef = doc(db, 'classes', CLASS_ID);
  tasksRef = collection(db, 'classes', CLASS_ID, 'tasks');

  onSnapshot(classRef, snap => {
    const d = snap.data() || {};
    S.className = d.className || 'ม.4/2';
    S.roster = Array.isArray(d.roster) ? d.roster : [];
    S.loaded.cls = true; render();
  }, err => { S.error = msgFor(err); render(); });

  onSnapshot(tasksRef, snap => {
    S.tasks = snap.docs.map(x => ({ id: x.id, ...x.data() }));
    S.loaded.tasks = true; render();
  }, err => { S.error = msgFor(err); render(); });

  onSnapshot(collectionGroup(db, 'subs'), snap => {
    const m = {};
    snap.docs.forEach(d => {
      const task = d.ref.parent.parent, cls = task && task.parent.parent;
      if (!cls || cls.id !== CLASS_ID) return;
      (m[task.id] = m[task.id] || new Set()).add(+d.id);
    });
    S.subs = m; render();
  }, err => { console.warn(err); });

  onSnapshot(collection(db, 'classes', CLASS_ID, 'claims'), snap => {
    const m = {}; snap.docs.forEach(d => { m[+d.id] = d.data().uid; });
    S.claims = m; render();
  }, err => { console.warn(err); });

  onAuthStateChanged(auth, u => {
    user = u; myNo = null;
    canEdit = !!(u && u.email && EDITORS.includes(u.email.toLowerCase()));
    if (unsubMe) { unsubMe(); unsubMe = null; }
    if (u) unsubMe = onSnapshot(P('users', u.uid), s => { myNo = s.exists() ? s.data().no : null; watchFocus(); render(); }, () => {});
    else watchFocus();
    render();
  });
}

/* ---------- helpers ---------- */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pd = s => { const p = String(s || '').split('-'); return new Date(+p[0], (+p[1] || 1) - 1, +p[2] || 1); };
const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const daysLeft = t => Math.round((pd(t.due) - today()) / 864e5);
const total = () => S.roster.length;
const doneSet = t => S.subs[t.id] || new Set();
const doneCount = t => S.roster.filter(s => doneSet(t).has(s.no)).length;
const isDone = t => total() > 0 && doneCount(t) >= total();
const iSent = t => myNo != null && doneSet(t).has(myNo);
const subjects = () => [...new Set(S.tasks.map(t => t.subject).filter(Boolean))].sort();
const sorted = () => S.tasks.slice().sort((a, b) => a.due < b.due ? -1 : a.due > b.due ? 1 : 0);
const stu = no => S.roster.find(s => s.no === no);
const remember = () => { try { sessionStorage.setItem('ct-ui', JSON.stringify({ view: ui.view, open: ui.open })); } catch (e) {} };
function msgFor(e) {
  const c = e && e.code || '';
  if (c.includes('permission-denied')) return 'ไม่มีสิทธิ์ทำรายการนี้';
  if (c.includes('unavailable')) return 'ต่อฐานข้อมูลไม่ได้ ตรวจอินเทอร์เน็ตแล้วลองใหม่';
  if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found')) return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
  if (c.includes('invalid-email')) return 'รูปแบบอีเมลไม่ถูกต้อง';
  if (c.includes('email-already-in-use')) return 'อีเมลนี้สมัครไว้แล้ว กดเข้าสู่ระบบแทน';
  if (c.includes('weak-password')) return 'รหัสผ่านต้องมีอย่างน้อย 6 ตัว';
  if (c.includes('too-many-requests')) return 'ลองหลายครั้งเกินไป รอสักครู่แล้วลองใหม่';
  if (c.includes('operation-not-allowed')) return 'ยังไม่ได้เปิด Email/Password ใน Firebase Authentication';
  return 'เกิดข้อผิดพลาด (' + (c || 'unknown') + ')';
}
function status(t) {
  if (isDone(t)) return { k: 'done', label: 'ส่งครบแล้ว' };
  const n = daysLeft(t);
  if (n < 0) return { k: 'late', label: 'เลยกำหนด' };
  if (n === 0) return { k: 'today', label: 'ใกล้กำหนด' };
  if (n <= 3) return { k: 'soon', label: 'ใกล้กำหนด' };
  return { k: 'wait', label: 'อีก ' + n + ' วัน' };
}
const evClass = t => { const k = status(t).k; return k === 'today' ? 'e-soon' : 'e-' + k; };

/* ---------- writes ---------- */
async function run(fn, okMsg) {
  if (busy) return; busy = true;
  try { await fn(); if (okMsg) toast(okMsg); }
  catch (e) { toast(msgFor(e)); }
  finally { busy = false; }
}
function setSub(taskId, no, on) {
  const ref = P('tasks', taskId, 'subs', String(no));
  const b = writeBatch(db);
  if (on) b.set(ref, { uid: user.uid, at: serverTimestamp() }); else b.delete(ref);
  return b.commit();
}
function parseRoster(txt) {
  const out = [], used = {}; let auto = 1;
  txt.split('\n').forEach(line => {
    line = line.trim(); if (!line) return;
    let no, rest;
    const m = line.match(/^(\d+)[\s.)\-:]+(.*)$/);
    if (m) { no = +m[1]; rest = m[2]; } else { while (used[auto]) auto++; no = auto; rest = line; }
    const nk = rest.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
    const name = (nk ? nk[1] : rest).replace(/^(นาย|นางสาว|ด\.ช\.|ด\.ญ\.)\s*/, '').trim();
    const nick = nk ? nk[2].trim() : '';
    if (used[no] || !name) return; used[no] = 1; out.push({ no, name, nick });
  });
  return out.sort((a, b) => a.no - b.no);
}
const rosterText = r => r.map(s => s.no + ' ' + s.name + (s.nick ? ' (' + s.nick + ')' : '')).join('\n');

/* ---------- render ---------- */
function render() {
  if ((ui.editing || ui.rosterEdit || ui.auth) && document.querySelector('form.edit')) return;
  const focused = document.activeElement && document.activeElement.id;
  const td = new Date();
  let h = '<div class="wrap"><header><div class="top"><div class="today-h"><div class="big">' + TDF[td.getDay()] + ' ' + td.getDate() + '</div>' +
    '<div class="t-sub">' + TMF[td.getMonth()] + ' · ห้อง ' + esc(S.className) + '</div></div><div class="head-r">' + themeBtn() + authBtn() + '</div></div>' + authPanel() + '</header><main>';
  if (!configured) h += '<div class="setup"><b>ยังไม่ได้ใส่ค่า Firebase</b><p>เปิดไฟล์ <code>firebase-config.js</code> แล้ววางค่า config</p></div>';
  else if (S.error && !S.loaded.tasks) h += '<div class="empty">' + esc(S.error) + '</div>';
  else if (!S.loaded.tasks || !S.loaded.cls) h += '<p class="loading">กำลังโหลดข้อมูลห้อง…</p>';
  else {
    h += claimHtml();
    if (ui.view === 'cal') h += viewCal();
    else if (ui.view === 'roster') h += viewRoster();
    else if (ui.view === 'tree') h += viewTree();
    else h += viewTasks();
  }
  h += '</main></div>';
  h += focusOverlay();
  document.body.classList.toggle('focus-on', !!ft.session);
  root.innerHTML = h;
  pageAnim();
  updateDock();
  if (focused) { const el = document.getElementById(focused); if (el) el.focus(); }
}
let shownView = null;
const ORDER = ['tasks', 'cal', 'tree', 'roster'];
function pageAnim() {
  if (shownView === ui.view) return;
  const main = root.querySelector('main');
  if (main && shownView) {
    const dir = ORDER.indexOf(ui.view) > ORDER.indexOf(shownView) ? 'from-right' : 'from-left';
    main.classList.add('page-in', dir);
    window.scrollTo(0, 0);
  }
  shownView = ui.view;
}
/* dock lives outside #root so the sliding pill can animate between tabs */
let dockEl = null;
function updateDock() {
  if (!dockEl) {
    dockEl = document.createElement('nav'); dockEl.className = 'dock'; dockEl.setAttribute('aria-label', 'เมนูหลัก');
    document.body.appendChild(dockEl); bindDock();
  }
  const tabs = [['tasks', 'งาน', 'list'], ['cal', 'ปฏิทิน', 'cal'], ['tree', 'Focus Tree', 'sprout'], ['roster', 'รายชื่อ', 'users']];
  const key = tabs.map(t => t[0]).join() + (canEdit ? ',new' : '');
  if (dockEl.dataset.key !== key) {
    dockEl.innerHTML = '<span class="dock-ind" aria-hidden="true"></span>' +
      tabs.map(t => '<button class="tab" data-act="view" data-v="' + t[0] + '" aria-label="' + t[1] + '">' + ico(t[2]) + '</button>').join('') +
      (canEdit ? '<button class="tab add" data-act="new" aria-label="เพิ่มงาน">' + ico('plus') + '</button>' : '');
    dockEl.dataset.key = key;
  }
  dockEl.querySelectorAll('.tab[data-v]').forEach(b => b.setAttribute('aria-current', String(b.dataset.v === ui.view)));
  moveInd(dockEl.querySelector('.tab[aria-current="true"]'), false);
}
function moveInd(btn, pressed) {
  const ind = dockEl && dockEl.querySelector('.dock-ind'); if (!ind) return;
  if (!btn) { ind.style.opacity = '0'; return; }
  ind.style.opacity = '1';
  ind.style.width = btn.offsetWidth + 'px';
  ind.style.transform = 'translateX(' + btn.offsetLeft + 'px)' + (pressed ? ' scale(1.1)' : '');
}
function bindDock() {
  // Taps use the buttons' own click. A drag moves the pill with the finger and switches on release.
  let down = false, moved = false, startX = 0, lastX = 0, swallow = false;
  const tabs = () => [...dockEl.querySelectorAll('.tab')];
  const nearest = x => tabs().reduce((best, b) => { const r = b.getBoundingClientRect(), d = Math.abs(x - (r.left + r.width / 2)); return !best || d < best.d ? { b, d } : best; }, null).b;
  const follow = x => {
    const ind = dockEl.querySelector('.dock-ind'), r = dockEl.getBoundingClientRect(), w = tabs()[0].offsetWidth;
    const left = Math.max(6, Math.min(r.width - 6 - w, x - r.left - w / 2));
    ind.style.opacity = '1'; ind.style.width = w + 'px'; ind.style.transform = 'translateX(' + left + 'px) scale(1.1)';
  };
  const start = x => { down = true; moved = false; startX = lastX = x; dockEl.classList.add('press'); moveInd(nearest(x), true); };
  const move = x => { if (!down) return; lastX = x; if (Math.abs(x - startX) > 8) { moved = true; dockEl.classList.add('drag'); } if (moved) follow(x); };
  const finish = commit => {
    if (!down) return; down = false; dockEl.classList.remove('press', 'drag');
    if (moved && commit !== false) { swallow = true; setTimeout(() => { swallow = false; }, 400); nearest(lastX).click(); }
    else updateDock();
  };
  // touch events: reliable on iPhone/iPad and let us stop the page from scrolling while dragging the bar
  dockEl.addEventListener('touchstart', e => start(e.touches[0].clientX), { passive: true });
  dockEl.addEventListener('touchmove', e => { e.preventDefault(); move(e.touches[0].clientX); }, { passive: false });
  dockEl.addEventListener('touchend', () => finish(true));
  dockEl.addEventListener('touchcancel', () => finish(moved));
  // mouse (computer)
  dockEl.addEventListener('mousedown', e => { if (e.button === 0) start(e.clientX); });
  window.addEventListener('mousemove', e => move(e.clientX));
  window.addEventListener('mouseup', () => finish(true));
  // a drag already switched tabs; ignore the click the browser sends afterwards
  dockEl.addEventListener('click', e => { if (swallow && e.isTrusted) { e.stopPropagation(); e.preventDefault(); } }, true);
  window.addEventListener('resize', () => updateDock());
}
const isDark = () => document.documentElement.dataset.theme === 'dark';
function themeBtn() {
  const d = isDark();
  return '<button class="theme" data-act="theme" aria-label="' + (d ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด') + '" title="' + (d ? 'โหมดสว่าง' : 'โหมดมืด') + '">' + ico(d ? 'sun' : 'moon') + '</button>';
}
function setTheme(dark) {
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = dark ? '#151912' : '#ece4d4';
  try { localStorage.setItem('ct-theme', dark ? 'dark' : 'light'); } catch (e) {}
}
function authBtn() {
  if (!configured) return '';
  if (!user) return '<button class="btn small primary" data-act="login">เข้าสู่ระบบ</button>';
  return '<button class="avatar" data-act="menu" aria-expanded="' + !!ui.menu + '" aria-label="บัญชีของฉัน">' + (myNo != null ? myNo : ico('user')) + '</button>';
}
function authPanel() {
  if (!configured) return '';
  if (!user) {
    if (!ui.auth) return '';
    const su = ui.auth === 'signup';
    return '<form class="edit" data-id="auth">' +
      '<div class="full"><b>' + (su ? 'สมัครบัญชีใหม่' : 'เข้าสู่ระบบ') + '</b><div class="t-sub">เพื่อกดส่งงานของตัวเอง</div></div>' +
      '<label>อีเมล<input id="f-email" name="email" type="email" autocomplete="username" required></label>' +
      '<label>รหัสผ่าน' + (su ? ' (อย่างน้อย 6 ตัว)' : '') + '<input id="f-pass" name="pass" type="password" minlength="6" autocomplete="' + (su ? 'new-password' : 'current-password') + '" required></label>' +
      '<div class="row-actions full"><button class="btn primary" type="submit">' + (su ? 'สมัคร' : 'เข้าสู่ระบบ') + '</button>' +
      '<button class="btn" type="button" data-act="authswitch">' + (su ? 'มีบัญชีแล้ว' : 'ยังไม่มีบัญชี สมัครใหม่') + '</button>' +
      (su ? '' : '<button class="btn" type="button" data-act="forgot">ลืมรหัสผ่าน</button>') +
      '<button class="btn" type="button" data-act="authcancel">ยกเลิก</button></div></form>';
  }
  if (!ui.menu) return '';
  const me = myNo != null && stu(myNo);
  const who = me ? 'เลขที่ ' + myNo + ' ' + esc(me.nick || me.name) : esc(user.email);
  return '<div class="menu"><div><div class="t-title">' + who + '</div><div class="t-sub">' + (canEdit ? 'โหมดแก้ไข · ' : '') + esc(user.email || '') + '</div></div>' +
    '<button class="btn small" data-act="logout">ออกจากระบบ</button></div>';
}
function claimHtml() {
  if (!user || myNo != null || !S.roster.length) return '';
  const free = S.roster.filter(s => !S.claims[s.no]);
  if (canEdit && !ui.claimOpen) return '';
  let h = '<div class="setup"><b>เลือกเลขที่ของคุณ</b><p class="t-sub">ผูกบัญชีนี้กับเลขที่ของตัวเอง ทำได้ครั้งเดียว ถ้าเลือกผิดให้แจ้งไผ่</p>';
  if (!free.length) return h + '<p>ทุกเลขที่ถูกเลือกไปแล้ว แจ้งไผ่ให้ตรวจสอบ</p></div>';
  if (ui.claimConfirm && ui.claimPick) {
    const s = stu(+ui.claimPick);
    return h + '<div class="confirm" style="color:var(--fg)">ยืนยันว่าเป็น <b>เลขที่ ' + s.no + ' ' + esc(s.name) + (s.nick ? ' (' + esc(s.nick) + ')' : '') + '</b>?' +
      '<button class="btn small primary" data-act="claimgo">ยืนยัน</button><button class="btn small" data-act="claimback">เลือกใหม่</button></div></div>';
  }
  return h + '<div class="row-actions"><select id="f-claim" aria-label="เลขที่" style="max-width:320px"><option value="">— เลือกเลขที่ —</option>' +
    free.map(s => '<option value="' + s.no + '"' + (String(s.no) === ui.claimPick ? ' selected' : '') + '>' + s.no + ' ' + esc(s.nick ? s.nick + ' · ' + s.name : s.name) + '</option>').join('') +
    '</select><button class="btn primary" data-act="claimnext">ต่อไป</button></div></div>';
}

function heroHtml(pending) {
  const student = myNo != null;
  const next = pending.filter(t => daysLeft(t) >= 0 && (!student || !iSent(t)))[0];
  if (!next) return '<div class="hero calm"><div class="hero-k">งานถัดไป</div><p class="hero-title" style="cursor:default">' + (student ? 'ไม่มีงานที่คุณต้องส่ง' : 'ไม่มีงานค้างในช่วงนี้') + '</p></div>';
  const n = daysLeft(next), d = pd(next.due), st = status(next);
  let h = '<div class="hero"><div class="hero-top"><span class="hero-k">งานถัดไป</span>' + pillHtml(next) + '</div>' +
    '<button class="hero-title" data-act="open" data-id="' + next.id + '">' + esc(next.title) + '</button>' +
    '<div class="hero-meta"><div><div class="hero-sub">' + esc(next.subject) + '</div><div class="hero-date">' + TD[d.getDay()] + ' ' + d.getDate() + ' ' + TM[d.getMonth()] + '</div></div>' +
    '<div class="count">' + (n === 0 ? '<span class="n" style="font-size:30px">วันนี้</span>' : '<span class="n">' + n + '</span><span class="u">วัน</span>') + '</div></div>';
  if (student) h += '<button class="btn primary" data-act="mine" data-id="' + next.id + '">' + ico('check') + 'ฉันส่งงานนี้แล้ว</button>';
  return h + '</div>';
}
function viewTasks() {
  const all = sorted(), pending = all.filter(t => !isDone(t));
  let h = '';
  if (S.tasks.length) h += heroHtml(pending);
  if (myNo != null && !canEdit) {
    const mine = pending.filter(t => !iSent(t));
    const late = mine.filter(t => daysLeft(t) < 0).length;
    h += '<div class="summary"><div class="stat"><div class="n">' + mine.length + '</div><div class="l">ค้างส่ง</div></div>' +
      '<div class="stat soon"><div class="n">' + mine.filter(t => { const n = daysLeft(t); return n >= 0 && n <= 3; }).length + '</div><div class="l">ใกล้กำหนด</div></div>' +
      '<div class="stat late"><div class="n">' + late + '</div><div class="l">เลยกำหนด</div></div></div>';
  } else {
    const late = pending.filter(t => daysLeft(t) < 0).length;
    const week = pending.filter(t => { const n = daysLeft(t); return n >= 0 && n <= 3; }).length;
    h += '<div class="summary"><div class="stat"><div class="n">' + pending.length + '</div><div class="l">ค้างส่ง</div></div>' +
      '<div class="stat soon"><div class="n">' + week + '</div><div class="l">ใกล้กำหนด</div></div>' +
      '<div class="stat late"><div class="n">' + late + '</div><div class="l">เลยกำหนด</div></div></div>';
  }
  h += '<div class="sec-h"><h2>งานทั้งหมด</h2><span>' + S.tasks.length + ' งาน</span></div>';
  h += '<div class="toolbar"><div class="chips"><button class="chip" data-act="filter" data-v="all" aria-pressed="' + (ui.filter === 'all') + '">ทั้งหมด</button>';
  subjects().forEach(s => { h += '<button class="chip" data-act="filter" data-v="' + esc(s) + '" aria-pressed="' + (ui.filter === s) + '">' + esc(s) + '</button>'; });
  h += '</div>' + (canEdit ? '<button class="btn primary" data-act="new">เพิ่มงาน</button>' : '') + '</div>';
  if (ui.editing === 'new') h += formHtml(null);
  if (!S.tasks.length) return h + '<div class="empty">ยังไม่มีงาน' + (canEdit ? ' กด "เพิ่มงาน" เพื่อลงงานชิ้นแรก' : '') + '</div>';
  const list = all.filter(t => ui.filter === 'all' || t.subject === ui.filter);
  const up = list.filter(t => !isDone(t) && daysLeft(t) >= 0);
  const lt = list.filter(t => !isDone(t) && daysLeft(t) < 0);
  const dn = list.filter(isDone);
  const open = lt.concat(up);
  h += open.length ? '<div class="list">' + open.map(taskHtml).join('') + '</div>' : '<div class="empty">ไม่มีงานค้างในช่วงนี้</div>';
  if (dn.length) h += '<div class="group-h">ส่งครบแล้ว (' + dn.length + ')</div>' + (ui.showPast ? '<div class="list">' + dn.map(taskHtml).join('') + '</div>' : '<button class="btn small" data-act="past">แสดงงานที่ส่งครบแล้ว</button>');
  return h;
}
function pillHtml(t) {
  const st = status(t);
  if (myNo != null && !isDone(t) && iSent(t)) return '<span class="pill p-done">' + ico('check') + 'ส่งแล้ว</span>';
  const ic = st.k === 'done' ? ico('check') : (st.k === 'wait' ? '' : ico('clock'));
  const label = st.k === 'wait' && myNo != null ? 'ยังไม่ส่ง' : st.label;
  return '<span class="pill p-' + st.k + '">' + ic + label + '</span>';
}
function taskHtml(t) {
  if (ui.editing === t.id) return formHtml(t);
  const d = pd(t.due), n = total(), c = doneCount(t), open = ui.open === t.id, left = daysLeft(t);
  let h = '<div class="task"><button class="task-row" data-act="open" data-id="' + t.id + '" aria-expanded="' + open + '">' +
    '<div class="t-top"><span class="sj">' + ico('book') + esc(t.subject) + '</span>' + pillHtml(t) + '</div>' +
    '<div class="t-title">' + esc(t.title) + '</div>' +
    '<div class="t-due">' + ico('clock') + 'ส่ง ' + TD[d.getDay()] + ' ' + d.getDate() + ' ' + TM[d.getMonth()] + (left < 0 && !isDone(t) ? ' · เลยมา ' + (-left) + ' วัน' : '') + '</div>' +
    (n ? '<div class="t-prog"><div class="bar"><i style="width:' + Math.min(100, Math.round(c / n * 100)) + '%"></i></div><span>' + c + '/' + n + ' ส่งแล้ว</span></div>' : '') + '</button>';
  if (open) h += detailHtml(t);
  return h + '</div>';
}
function detailHtml(t) {
  const n = total(), done = doneSet(t), c = doneCount(t), d = pd(t.due);
  let h = '<div class="detail"><div class="t-sub">กำหนดส่ง ' + TD[d.getDay()] + ' ' + d.getDate() + ' ' + TMF[d.getMonth()] + ' ' + (d.getFullYear() + 543) + '</div>';
  if (t.note) h += '<p class="note">' + esc(t.note) + '</p>';
  if (myNo != null) {
    const on = done.has(myNo);
    h += '<div class="row-actions"><button class="btn ' + (on ? '' : 'primary') + '" data-act="mine" data-id="' + t.id + '">' + (on ? 'ยกเลิก "ส่งแล้ว"' : 'ฉันส่งงานนี้แล้ว') + '</button>' +
      (on ? '<span class="pill p-done" style="align-self:center">เลขที่ ' + myNo + ' ส่งแล้ว</span>' : '') + '</div>';
  } else if (!user) {
    h += '<div class="t-sub">เข้าสู่ระบบเพื่อกดส่งงานของตัวเอง</div>';
  }
  if (!n) h += '<div class="t-sub">ยังไม่มีรายชื่อนักเรียน</div>';
  else {
    h += '<div class="sub-head"><span>ส่งแล้ว <b>' + c + '/' + n + '</b> คน</span>' + (canEdit ? '<span class="row-actions"><button class="btn small" data-act="allon" data-id="' + t.id + '">ส่งครบทุกคน</button><button class="btn small" data-act="alloff" data-id="' + t.id + '">ล้างทั้งหมด</button></span>' : '') + '</div>';
    h += '<div class="roster-grid">' + S.roster.map(s => {
      const on = done.has(s.no), mine = s.no === myNo;
      const inner = '<span class="no">' + s.no + '</span><span class="nm">' + esc(s.nick || s.name) + (mine ? '<small>(ฉัน)</small>' : '') + '</span>';
      return canEdit
        ? '<button class="stu' + (on ? ' on' : '') + '" data-act="tick" data-id="' + t.id + '" data-no="' + s.no + '" aria-pressed="' + on + '">' + inner + '</button>'
        : '<div class="stu' + (on ? ' on' : '') + '">' + inner + '</div>';
    }).join('') + '</div>';
  }
  if (canEdit) {
    h += '<div class="row-actions"><button class="btn small" data-act="edit" data-id="' + t.id + '">แก้ไขงาน</button>';
    h += ui.confirmDel === t.id ? '<span class="confirm">ลบงานนี้?<button class="btn small danger" data-act="del" data-id="' + t.id + '">ลบ</button><button class="btn small" data-act="nodel">ยกเลิก</button></span>' : '<button class="btn small danger" data-act="askdel" data-id="' + t.id + '">ลบงาน</button>';
    h += '</div>';
  }
  return h + '</div>';
}
function formHtml(t) {
  const v = t || { subject: ui.filter !== 'all' ? ui.filter : '', title: '', due: ymd(new Date(today().getTime() + 7 * 864e5)), note: '' };
  return '<form class="edit" data-id="' + (t ? t.id : 'new') + '">' +
    '<label>วิชา<input id="f-subject" name="subject" list="subj-list" required value="' + esc(v.subject) + '" placeholder="เช่น เคมี"></label>' +
    '<datalist id="subj-list">' + subjects().map(s => '<option value="' + esc(s) + '">').join('') + '</datalist>' +
    '<label>วันส่ง<input id="f-due" name="due" type="date" required value="' + esc(v.due) + '"></label>' +
    '<label class="full">ชื่องาน<input id="f-title" name="title" required value="' + esc(v.title) + '" placeholder="เช่น แบบฝึกหัดบทที่ 3 ข้อ 1–10"></label>' +
    '<label class="full">รายละเอียด (ไม่บังคับ)<textarea id="f-note" name="note" placeholder="ส่งที่ไหน ส่งแบบไหน งานเดี่ยวหรือกลุ่ม">' + esc(v.note) + '</textarea></label>' +
    '<div class="row-actions full"><button class="btn primary" type="submit">' + (t ? 'บันทึกการแก้ไข' : 'เพิ่มงาน') + '</button><button class="btn" type="button" data-act="cancel">ยกเลิก</button></div></form>';
}
function viewCal() {
  const t0 = today(); if (!ui.month) ui.month = new Date(t0.getFullYear(), t0.getMonth(), 1);
  const m = ui.month, first = new Date(m.getFullYear(), m.getMonth(), 1), start = new Date(first); start.setDate(1 - first.getDay());
  const byDay = {}; S.tasks.forEach(t => { (byDay[t.due] = byDay[t.due] || []).push(t); });
  let h = '<div class="cal-head"><button class="btn small" data-act="mon" data-v="-1" aria-label="เดือนก่อน">‹</button><h2>' + TMF[m.getMonth()] + ' ' + (m.getFullYear() + 543) + '</h2><button class="btn small" data-act="mon" data-v="1" aria-label="เดือนถัดไป">›</button></div><div class="cal-wrap"><div class="cal">';
  TD.forEach(d => { h += '<div class="dow">' + d + '</div>'; });
  for (let i = 0; i < 42; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i); const k = ymd(d), ts = byDay[k] || [];
    if (i === 35 && d.getMonth() !== m.getMonth()) break;
    h += '<button class="day' + (d.getMonth() !== m.getMonth() ? ' out' : '') + (k === ymd(t0) ? ' today' : '') + (ui.sel === k ? ' sel' : '') + '" data-act="day" data-v="' + k + '"><span class="num">' + d.getDate() + '</span>' +
      ts.map(t => '<span class="ev ' + evClass(t) + '">' + esc(t.subject) + '</span>').join('') +
      (ts.length ? '<span class="dots">' + ts.map(t => '<span class="dot ' + evClass(t) + '"></span>').join('') + '</span>' : '') + '</button>';
  }
  h += '</div></div>';
  if (ui.sel) { const sd = pd(ui.sel), list = byDay[ui.sel] || []; h += '<div class="group-h">' + TD[sd.getDay()] + ' ' + sd.getDate() + ' ' + TMF[sd.getMonth()] + '</div>' + (list.length ? '<div class="list">' + list.map(taskHtml).join('') + '</div>' : '<div class="empty">ไม่มีงานส่งวันนี้</div>'); }
  else h += '<p class="t-sub" style="margin-top:12px">แตะวันที่เพื่อดูงานที่ต้องส่งวันนั้น</p>';
  return h;
}
function viewRoster() {
  const nClaimed = S.roster.filter(s => S.claims[s.no]).length;
  let h = '<div class="toolbar"><div class="chips"><span class="t-sub">' + (S.roster.length ? 'นักเรียน ' + S.roster.length + ' คน · ผูกบัญชีแล้ว ' + nClaimed + ' คน' : 'ยังไม่มีรายชื่อ') + '</span></div>' +
    (canEdit && !ui.rosterEdit ? '<button class="btn" data-act="redit">แก้รายชื่อ</button>' + (myNo == null && !ui.claimOpen ? '<button class="btn" data-act="claimopen">ผูกเลขที่ของฉัน</button>' : '') : '') + '</div>';
  if (canEdit && ui.rosterEdit) {
    const txt = S.roster.length ? rosterText(S.roster) : DEFAULT_ROSTER;
    return h + '<form class="edit" data-id="roster"><label class="full">ชื่อห้อง<input id="f-class" name="cls" value="' + esc(S.className) + '"></label>' +
      '<label class="full">รายชื่อ บรรทัดละ 1 คน รูปแบบ "เลขที่ ชื่อ นามสกุล (ชื่อเล่น)"<textarea id="f-roster" name="roster" rows="14">' + esc(txt) + '</textarea></label>' +
      '<div class="row-actions full"><button class="btn primary" type="submit">บันทึกรายชื่อ</button><button class="btn" type="button" data-act="rcancel">ยกเลิก</button></div></form>';
  }
  if (!S.roster.length) return h + '<div class="empty">ยังไม่มีรายชื่อนักเรียน</div>';
  const open = S.tasks.filter(t => !isDone(t));
  h += '<div class="tbl-wrap"><table><thead><tr><th>เลขที่</th><th>ชื่อ</th><th>ค้าง</th><th>เลยกำหนด</th><th>บัญชี</th></tr></thead><tbody>';
  S.roster.forEach(s => {
    const owe = open.filter(t => !doneSet(t).has(s.no));
    const late = owe.filter(t => daysLeft(t) < 0).length;
    const claimed = !!S.claims[s.no];
    let acc = claimed ? '<span class="pill p-done">ผูกแล้ว</span>' : '<span class="t-sub">ยังไม่ผูก</span>';
    if (canEdit && claimed) acc += ui.confirmRelease === s.no
      ? ' <span class="confirm">ปลด?<button class="btn small danger" data-act="release" data-no="' + s.no + '">ปลด</button><button class="btn small" data-act="norelease">ยกเลิก</button></span>'
      : ' <button class="btn small" data-act="askrelease" data-no="' + s.no + '">ปลดเลขที่</button>';
    h += '<tr><td class="no">' + s.no + '</td><td><span class="nick">' + esc(s.nick || s.name) + '</span>' + (s.nick ? '<div class="full-name">' + esc(s.name) + '</div>' : '') + '</td><td class="cnt">' + owe.length + '</td><td class="cnt' + (late ? ' bad' : '') + '">' + late + '</td><td>' + acc + '</td></tr>';
  });
  return h + '</tbody></table></div>';
}

/* ================= Focus Tree =================
   Reading time grows a tree. The server (Firestore rules) checks every number:
   - one session per student (one doc per class number, state running/idle)
   - credited seconds can't exceed server-measured time, nor the last heartbeat + 150 s
     (so time while the page was closed or the phone was locked is not counted)
   - day / week / month buckets use Bangkok dates computed by the server, 6 h cap per day
   - every session is written to an append-only log */
const FT_CAP = 6 * 3600, FT_TREE = 300, BEAT_MS = 60000;
const FT_STAGES = [[0, 'เริ่มปลูก'], [25, 'เมล็ดเริ่มงอก'], [50, 'ต้นกล้า'], [100, 'ต้นไม้เติบโต'], [150, 'ต้นไม้แผ่กิ่ง'], [200, 'ต้นไม้สมบูรณ์']];
const FT_KINDS = [{ name: 'ต้นไม้', img: 's5' }];
const ft = { me: null, mine: false, list: [], loaded: false, range: 'day', log: {}, logOpen: null, busy: false, unsub: null, watchedNo: null, beatT: null, tickT: null, listT: null };
function bkkKeys(ms) {
  const t = new Date((ms || Date.now()) + 7 * 3600e3);
  const k = d => d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
  const dow = (t.getUTCDay() + 6) % 7; // Monday = 0
  return { day: k(t), week: k(new Date(t.getTime() - dow * 864e5)), month: t.getUTCFullYear() * 100 + t.getUTCMonth() + 1 };
}
const fmtMin = sec => { const m = Math.floor(sec / 60), h = Math.floor(m / 60); return h ? h + ' ชม. ' + (m % 60) + ' น.' : m + ' นาที'; };
const fmtClock = sec => { sec = Math.max(0, Math.floor(sec)); const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), x = sec % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
const fRef = no => P('focus', String(no));
const running = () => ft.me && ft.me.state === 'running';
const runSec = () => running() && ft.me.clientStart ? (Date.now() - ft.me.clientStart) / 1000 : 0;
function bucket(d, range, k) {
  if (!d) return 0;
  if (range === 'day') return d.dayKey === k.day ? d.daySec || 0 : 0;
  if (range === 'week') return d.weekKey === k.week ? d.weekSec || 0 : 0;
  if (range === 'month') return d.monthKey === k.month ? d.monthSec || 0 : 0;
  return d.totalSec || 0;
}
function watchFocus() {
  if (!configured) return;
  const no = user && myNo != null ? myNo : null;
  if (ft.watchedNo === no) return;
  if (ft.unsub) { ft.unsub(); ft.unsub = null; }
  ft.watchedNo = no; ft.me = null; ft.mine = false;
  if (no == null) return;
  let first = true;
  ft.unsub = onSnapshot(fRef(no), snap => {
    ft.me = snap.exists() ? snap.data() : null;
    // a session left running by a closed page or another device: close it (the server only credits up to its last heartbeat)
    if (first && running() && !ft.mine) focusStop();
    first = false;
    if (ui.view === 'tree') render();
  }, () => {});
}
// one server "segment" = the time between start and stop/pause; a focus session can hold several segments
async function focusStart() {
  if (ft.busy || myNo == null) return false;
  const k = bkkKeys();
  if (ft.me && ft.me.dayKey === k.day && (ft.me.daySec || 0) >= FT_CAP) { toast('วันนี้อ่านครบ 6 ชั่วโมงแล้ว พักบ้างนะ'); return false; }
  ft.busy = true;
  try {
    const now = serverTimestamp(), base = { state: 'running', startedAt: now, beat: now, clientStart: Date.now(), uid: user.uid };
    if (ft.me) await updateDoc(fRef(myNo), base);
    else await setDoc(fRef(myNo), { ...base, no: myNo, totalSec: 0, daySec: 0, dayKey: 0, weekSec: 0, weekKey: 0, monthSec: 0, monthKey: 0, lastSec: 0, lastLog: '' });
    ft.mine = true; startTimers(); return true;
  } catch (e) { toast(msgFor(e)); return false; }
  finally { ft.busy = false; }
}
async function focusStop(extraCut) {
  if (!running() || myNo == null) return 0;
  if (ft.busy && !extraCut) return 0;
  ft.busy = true; stopTimers();
  const f = ft.me, started = f.startedAt && f.startedAt.toMillis ? f.startedAt.toMillis() : Date.now();
  const beat = f.beat && f.beat.toMillis ? f.beat.toMillis() : started;
  let sec = Math.floor((Date.now() - (f.clientStart || started)) / 1000) - 3;
  sec = Math.min(sec, Math.floor((beat - started) / 1000) + 140) - (extraCut || 0);
  const k = bkkKeys(), day = f.dayKey === k.day ? f.daySec || 0 : 0;
  sec = Math.max(0, Math.min(sec, FT_CAP - day));
  const logRef = doc(collection(db, 'classes', CLASS_ID, 'focus', String(myNo), 'log'));
  const b = writeBatch(db);
  b.update(fRef(myNo), {
    state: 'idle', lastSec: sec, lastLog: logRef.id, dayKey: k.day, weekKey: k.week, monthKey: k.month,
    totalSec: (f.totalSec || 0) + sec, daySec: day + sec,
    weekSec: (f.weekKey === k.week ? f.weekSec || 0 : 0) + sec, monthSec: (f.monthKey === k.month ? f.monthSec || 0 : 0) + sec
  });
  b.set(logRef, { uid: user.uid, start: f.startedAt, end: serverTimestamp(), sec, dayKey: k.day, subject: String((ft.session && ft.session.subject) || 'อ่านทั่วไป').slice(0, 40) });
  try {
    await b.commit();
    ft.mine = false; ft.busy = false;
    loadRanking(); delete ft.log[myNo];
    return sec;
  } catch (e) {
    // clocks between devices can differ; retry with a smaller claim, then with zero
    if (!extraCut) return focusStop(120);
    if (extraCut < 1e9) return focusStop(1e9);
    ft.busy = false; toast(msgFor(e)); return 0;
  }
}

/* ---- focus session (full screen) ---- */
const PAUSE_MAX = 10 * 60;
function sessionSec() { const S2 = ft.session; return S2 ? S2.credited + (S2.phase === 'focus' && running() && ft.mine ? runSec() : 0) : 0; }
async function sessionStart() {
  if (ft.session && ft.session.phase === 'focus') return;
  const subject = ft.subject || 'อ่านทั่วไป';
  ft.session = { subject, credited: 0, phase: 'starting', pauseUntil: 0 };
  render();
  if (!(await focusStart())) { ft.session = null; render(); return; }
  ft.session.phase = 'focus'; wake(true); resumeSound(); render();
}
async function sessionPause() {
  const S2 = ft.session; if (!S2 || S2.phase !== 'focus') return;
  S2.phase = 'saving'; render();
  S2.credited += await focusStop();
  S2.phase = 'paused'; S2.pauseUntil = Date.now() + PAUSE_MAX * 1000; pauseSound(); wake(false); startPauseTick(); render();
}
async function sessionResume() {
  const S2 = ft.session; if (!S2 || S2.phase !== 'paused') return;
  S2.phase = 'starting'; render();
  if (await focusStart()) { S2.phase = 'focus'; wake(true); resumeSound(); }
  else S2.phase = 'paused';
  render();
}
async function sessionEnd(kind) {
  const S2 = ft.session; if (!S2 || S2.phase === 'done' || S2.phase === 'withered') return;
  const was = S2.phase; S2.phase = 'saving';
  if (was === 'focus' || was === 'starting') S2.credited += await focusStop();
  S2.phase = kind; stopSound(); wake(false); clearInterval(ft.pauseT);
  if (dayTotalLive() >= FT_CAP) toast('ครบ 6 ชั่วโมงของวันนี้แล้ว');
  render();
}
function startPauseTick() {
  clearInterval(ft.pauseT);
  ft.pauseT = setInterval(() => {
    const S2 = ft.session; if (!S2 || S2.phase !== 'paused') return clearInterval(ft.pauseT);
    const left = (S2.pauseUntil - Date.now()) / 1000, el = document.getElementById('ft-pause');
    if (el) el.textContent = fmtClock(Math.max(0, left));
    if (left <= 0) { toast('พักเกิน 10 นาที จบเซสชันให้แล้ว'); sessionEnd('done'); }
  }, 1000);
}
// keep the screen awake while focusing (iOS 16.4+ and most Android browsers)
async function wake(on) {
  try {
    if (on && 'wakeLock' in navigator && !ft.wl) { ft.wl = await navigator.wakeLock.request('screen'); ft.wl.addEventListener('release', () => { ft.wl = null; }); }
    if (!on && ft.wl) { await ft.wl.release(); ft.wl = null; }
  } catch (e) { ft.wl = null; }
}

/* ---- ambient sounds, made in the browser (no audio files) ---- */
const SOUNDS = [['off', 'ปิดเสียง'], ['rain', 'ฝนตก'], ['stream', 'ลำธาร'], ['wind', 'ลมในป่า'], ['soft', 'เสียงนุ่มสำหรับอ่าน']];
const SND = { ctx: null, nodes: [], kind: 'off', open: false };
try { SND.kind = localStorage.getItem('ct-sound') || 'off'; } catch (e) {}
function noiseBuf(ctx, type) {
  const len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (type === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
    else if (type === 'pink') { b0 = 0.99765 * b0 + w * 0.099; b1 = 0.963 * b1 + w * 0.2965; b2 = 0.57 * b2 + w * 1.0526; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.25; }
    else d[i] = w * 0.5;
  }
  return buf;
}
function playSound(kind) {
  stopSound(); SND.kind = kind; try { localStorage.setItem('ct-sound', kind); } catch (e) {}
  if (kind === 'off') return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const ctx = SND.ctx || (SND.ctx = new AC()); ctx.resume();
    const src = ctx.createBufferSource(); src.buffer = noiseBuf(ctx, kind === 'rain' ? 'white' : kind === 'soft' ? 'pink' : 'brown'); src.loop = true;
    const f = ctx.createBiquadFilter(), g = ctx.createGain(); g.gain.value = 0;
    const lfo = ctx.createOscillator(), lg = ctx.createGain();
    if (kind === 'rain') { f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 0.4; lfo.frequency.value = 0.3; lg.gain.value = 300; lg.connect(f.frequency); }
    if (kind === 'stream') { f.type = 'bandpass'; f.frequency.value = 700; f.Q.value = 0.8; lfo.frequency.value = 0.15; lg.gain.value = 0.08; lg.connect(g.gain); }
    if (kind === 'wind') { f.type = 'lowpass'; f.frequency.value = 500; lfo.frequency.value = 0.07; lg.gain.value = 280; lg.connect(f.frequency); }
    if (kind === 'soft') { f.type = 'lowpass'; f.frequency.value = 1800; lfo.frequency.value = 0.05; lg.gain.value = 0.03; lg.connect(g.gain); }
    lfo.connect(lg); src.connect(f); f.connect(g); g.connect(ctx.destination);
    const vol = kind === 'rain' ? 0.16 : kind === 'soft' ? 0.22 : 0.3;
    g.gain.linearRampToValueAtTime(vol, ctx.currentTime + 1.5);
    src.start(); lfo.start(); SND.nodes = [src, lfo, g];
  } catch (e) {}
}
function stopSound() { SND.nodes.forEach(n => { try { n.stop ? n.stop() : n.disconnect(); } catch (e) {} }); SND.nodes = []; }
function pauseSound() { stopSound(); }
function resumeSound() { if (SND.kind !== 'off' && !SND.nodes.length) playSound(SND.kind); }

function startTimers() {
  stopTimers();
  ft.tickT = setInterval(() => { const el = document.getElementById('ft-clock'); if (el) el.textContent = fmtClock(sessionSec()); if (running() && dayTotalLive() >= FT_CAP) sessionEnd('done'); }, 1000);
  ft.beatT = setInterval(() => { if (running() && ft.mine && !document.hidden) updateDoc(fRef(myNo), { beat: serverTimestamp() }).catch(() => { ft.mine = false; stopTimers(); render(); }); }, BEAT_MS);
}
function stopTimers() { clearInterval(ft.tickT); clearInterval(ft.beatT); ft.tickT = ft.beatT = null; }
function dayTotalLive() { const k = bkkKeys(); return (ft.me && ft.me.dayKey === k.day ? ft.me.daySec || 0 : 0) + runSec(); }
// leaving the page while focusing: the tree withers, but the time already read still counts
const leave = () => { if (ft.session && ft.session.phase === 'focus') sessionEnd('withered'); };
document.addEventListener('visibilitychange', () => { if (document.hidden) leave(); else if (ft.session && ft.session.phase === 'focus') wake(true); });
window.addEventListener('pagehide', leave);
async function loadRanking() {
  if (!configured) return;
  try { const snap = await getDocs(collection(db, 'classes', CLASS_ID, 'focus')); ft.list = snap.docs.map(d => d.data()); ft.loaded = true; }
  catch (e) { ft.loaded = true; }
  if (ui.view === 'tree') render();
}
async function loadLog(no) {
  try {
    const snap = await getDocs(query(collection(db, 'classes', CLASS_ID, 'focus', String(no), 'log'), orderBy('end', 'desc'), limit(15)));
    ft.log[no] = snap.docs.map(d => d.data());
  } catch (e) { ft.log[no] = 'err'; }
  if (ui.view === 'tree') render();
}
// growth stages 0–3 share one look; the mature tree (stage 4) shows this tree's kind
function treeSvg(totalSec, size, forceStage) {
  const min = totalSec / 60, kind = FT_KINDS[Math.floor(min / FT_TREE) % FT_KINDS.length], m = min % FT_TREE;
  const st = forceStage != null ? forceStage : FT_STAGES.filter(x => m >= x[0]).length - 1;
  const src = TREE_IMG['s' + st];
  return '<img class="tree-img" src="' + src + '" width="' + size + '" height="' + size + '" alt="' + FT_STAGES[st][1] + '' + '" decoding="async">';
}
function viewTree() {
  if (!ft.loaded) { ft.loaded = 'loading'; loadRanking(); }
  clearInterval(ft.listT); ft.listT = setInterval(() => { if (ui.view === 'tree' && !document.hidden) loadRanking(); else clearInterval(ft.listT); }, 60000);
  const k = bkkKeys();
  const total = (ft.me ? ft.me.totalSec || 0 : 0) + runSec();
  const min = total / 60, inTree = min % FT_TREE, trees = Math.floor(min / FT_TREE), kind = FT_KINDS[trees % FT_KINDS.length];
  const stIdx = FT_STAGES.filter(x => inTree >= x[0]).length - 1, next = FT_STAGES[stIdx + 1];
  const nextTxt = next ? 'อีก ' + Math.ceil(next[0] - inTree) + ' นาที → ' + next[1] : 'อีก ' + Math.ceil(FT_TREE - inTree) + ' นาที ปลดล็อกต้นไม้ต้นใหม่';
  const today = dayTotalLive();
  let h = '<div class="sec-h" style="margin-top:14px"><h2>Focus Tree</h2><span>อ่านแล้วต้นไม้โต</span></div>';
  h += '<div class="hero ft-card">';
  if (!user) h += '<p class="hero-title" style="cursor:default">เข้าสู่ระบบเพื่อเริ่มจับเวลาอ่านหนังสือ</p><button class="btn primary" data-act="login">เข้าสู่ระบบ</button>';
  else if (myNo == null) h += '<p class="hero-title" style="cursor:default">ผูกเลขที่ของคุณก่อน แล้วค่อยเริ่มจับเวลา</p><p class="t-sub">ดูที่ด้านบนของหน้างาน หรือแท็บรายชื่อ</p>';
  else {
    h += '<div class="ft-top"><div class="ft-tree">' + treeSvg(total, 150) + '</div><div class="ft-info"><div class="hero-k">' + 'ต้นที่ ' + (trees + 1) + '</div>' +
      '<div class="ft-stage">' + FT_STAGES[stIdx][1] + '</div><div class="t-sub">' + nextTxt + '</div>' +
      '<div class="ft-bar"><i style="width:' + Math.min(100, inTree / FT_TREE * 100) + '%"></i></div></div></div>';
    const subs = [...new Set(subjects().concat(['อ่านทั่วไป']))];
    if (!ft.subject || !subs.includes(ft.subject)) ft.subject = subs[0];
    h += '<div><div class="hero-k" style="margin-bottom:8px">วันนี้จะอ่านวิชาอะไร</div><div class="chips ft-subj">' +
      subs.map(x => '<button class="chip" data-act="ft-subj" data-v="' + esc(x) + '" aria-pressed="' + (ft.subject === x) + '">' + esc(x) + '</button>').join('') + '</div></div>';
    h += '<button class="btn primary ft-btn" data-act="ft-start"' + (today >= FT_CAP ? ' disabled' : '') + '>' + ico('play') + (today >= FT_CAP ? 'ครบ 6 ชั่วโมงของวันนี้แล้ว' : 'เริ่มโฟกัส') + '</button>' +
      '<p class="t-sub ft-note">ระหว่างโฟกัสห้ามสลับแอปหรือปิดหน้าเว็บ ไม่อย่างนั้นต้นไม้จะเหี่ยว</p>';
    h += '<div class="ft-today"><span>วันนี้ ' + fmtMin(today) + '</span><span>สูงสุด 6 ชม.</span></div><div class="ft-bar thin"><i style="width:' + Math.min(100, today / FT_CAP * 100) + '%"></i></div>';
  }
  h += '</div>';
  if (user && myNo != null && trees > 0) {
    h += '<div class="group-h">ป่าของฉัน · ' + trees + ' ต้น</div><div class="forest">';
    for (let i = 0; i < Math.min(trees, 24); i++) h += '<span class="forest-t">' + treeSvg((i * FT_TREE + 250) * 60, 56, 5) + '</span>';
    h += (trees > 24 ? '<span class="t-sub">+' + (trees - 24) + '</span>' : '') + '</div>';
  }
  // ranking
  const ranges = [['day', 'วันนี้'], ['week', 'สัปดาห์นี้'], ['month', 'เดือนนี้']];
  h += '<div class="sec-h"><h2>อันดับห้อง</h2><span>' + (ft.loaded === true ? 'อัปเดตทุก 1 นาที' : 'กำลังโหลด…') + '</span></div>';
  h += '<div class="seg" role="tablist">' + ranges.map(r => '<button role="tab" data-act="ft-range" data-v="' + r[0] + '" aria-selected="' + (ft.range === r[0]) + '">' + r[1] + '</button>').join('') + '</div>';
  const rows = ft.list.map(d => {
    const live = myNo != null && d.no === myNo && ft.me ? { ...ft.me, no: myNo } : d;
    const sec = bucket(live, ft.range, k) + (live.no === myNo ? runSec() : 0);
    return { no: d.no, sec, trees: Math.floor(((live.totalSec || 0) + (live.no === myNo ? runSec() : 0)) / 60 / FT_TREE), reading: live.state === 'running' };
  }).filter(r => r.sec >= 60).sort((a, b) => b.sec - a.sec);
  if (!rows.length) h += '<div class="empty">ยังไม่มีใครอ่าน' + (ft.range === 'day' ? 'วันนี้' : ft.range === 'week' ? 'สัปดาห์นี้' : 'เดือนนี้') + ' เริ่มเป็นคนแรกเลย</div>';
  else {
    h += '<div class="rank">';
    rows.forEach((r, i) => {
      const s = stu(r.no), me = r.no === myNo;
      h += '<div class="rank-row' + (me ? ' me' : '') + '"><span class="rk' + (i < 3 ? ' top' : '') + '">' + (i + 1) + '</span><span class="avatar sm">' + r.no + '</span>' +
        '<span class="rk-name">' + esc(s ? s.nick || s.name : 'เลขที่ ' + r.no) + (me ? ' <small>(ฉัน)</small>' : '') + (r.reading ? ' <span class="live">กำลังอ่าน</span>' : '') + '</span>' +
        '<span class="rk-trees" title="ต้นไม้ที่ปลูกได้">' + ico('sprout') + r.trees + '</span><span class="rk-time">' + fmtMin(r.sec) + '</span>' +
        (canEdit || me ? '<button class="btn small" data-act="ft-log" data-no="' + r.no + '" aria-expanded="' + (ft.logOpen === r.no) + '">ประวัติ</button>' : '') + '</div>';
      if (ft.logOpen === r.no) h += logHtml(r.no);
    });
    h += '</div>';
  }
  if (myNo != null && !rows.some(r => r.no === myNo)) h += '<p class="t-sub" style="margin-top:10px"><button class="btn small" data-act="ft-log" data-no="' + myNo + '">ประวัติการอ่านของฉัน</button></p>' + (ft.logOpen === myNo ? logHtml(myNo) : '');
  return h;
}
// soft forest behind the tree: two rows of round tree shapes and floating light motes (fixed positions so it doesn't jump on re-render)
function forestBg() {
  const row = (y, r, n, cls) => { let g = ''; for (let i = 0; i <= n; i++) { const x = i * (400 / n) + (i % 2 ? 14 : -10), rr = r * (0.8 + ((i * 37) % 10) / 25); g += '<circle cx="' + x.toFixed(0) + '" cy="' + (y - rr * 0.6).toFixed(0) + '" r="' + rr.toFixed(0) + '"/><rect x="' + (x - 3).toFixed(0) + '" y="' + (y - rr * 0.3).toFixed(0) + '" width="6" height="' + (rr * 1.4).toFixed(0) + '"/>'; } return '<g class="' + cls + '">' + g + '<rect x="-20" y="' + y + '" width="440" height="400"/></g>'; };
  const svg = '<svg class="focus-forest" viewBox="0 0 400 700" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' + row(430, 46, 7, 'far') + row(520, 58, 6, 'near') + '</svg>';
  let motes = '';
  for (let i = 0; i < 16; i++) motes += '<i style="left:' + ((i * 61) % 96 + 2) + '%;top:' + ((i * 37) % 70 + 12) + '%;animation-delay:-' + ((i * 1.7) % 9).toFixed(1) + 's;animation-duration:' + (7 + (i % 5) * 1.6).toFixed(1) + 's"></i>';
  return svg + '<div class="focus-motes" aria-hidden="true">' + motes + '</div>';
}
function focusOverlay() {
  const S2 = ft.session; if (!S2) return '';
  const total = (ft.me ? ft.me.totalSec || 0 : 0) + (S2.phase === 'focus' && running() && ft.mine ? runSec() : 0);
  const img = treeSvg(total, 320), ph = S2.phase;
  const done = ph === 'done' || ph === 'withered';
  let h = '<div class="focus' + (ph === 'withered' ? ' withered' : '') + (ph === 'paused' ? ' paused' : '') + '" role="dialog" aria-modal="true" aria-label="โหมดโฟกัส">' +
    '<div class="focus-rays" aria-hidden="true"></div>' + forestBg() +
    '<div class="focus-top"><div class="focus-subj"><i></i>' + esc(S2.subject) + '</div><div class="t-sub">' + (done ? 'เซสชันนี้' : 'ตอนนี้ฉันกำลังโฟกัสกับ…') + '</div></div>' +
    (done ? '' : '<button class="focus-sound" data-act="ft-sound" aria-label="เสียงบรรยากาศ" aria-expanded="' + SND.open + '">' + ico(SND.kind === 'off' ? 'mute' : 'sound') + '</button>') +
    '<div class="focus-island">' + img + '</div>';
  if (done) {
    h += '<div class="focus-msg">' + (ph === 'withered' ? 'ออกจากหน้าเว็บระหว่างโฟกัส ต้นไม้เลยเหี่ยว<br>ไม่เป็นไร ครั้งหน้าจะดีขึ้น' : (S2.credited >= 60 ? 'เยี่ยมมาก ต้นไม้ของคุณโตขึ้นแล้ว' : 'สั้นไปนิด ยังไม่ถึง 1 นาที')) + '</div>' +
      '<div class="focus-got">' + ico('clock') + fmtClock(S2.credited) + (ph === 'withered' && S2.credited >= 60 ? ' <small>ยังนับเวลาให้</small>' : '') + '</div>' +
      '<button class="focus-home" data-act="ft-close">กลับสู่หน้าหลัก</button>';
  } else {
    h += '<div class="focus-clock" id="ft-clock">' + fmtClock(sessionSec()) + '</div>';
    if (ph === 'paused') h += '<div class="focus-msg">พักอยู่ · เหลือเวลาพัก <b id="ft-pause">' + fmtClock((S2.pauseUntil - Date.now()) / 1000) + '</b></div>';
    else h += '<div class="focus-msg dim">' + (ph === 'focus' ? 'อย่าสลับแอปหรือปิดหน้าเว็บ' : 'กำลังบันทึก…') + '</div>';
    h += '<div class="focus-btns"><button class="fb" data-act="ft-end" aria-label="จบการอ่าน"' + (ph === 'saving' || ph === 'starting' ? ' disabled' : '') + '>' + ico('stop') + '</button>' +
      (ph === 'paused'
        ? '<button class="fb main" data-act="ft-resume" aria-label="อ่านต่อ">' + ico('play') + '</button>'
        : '<button class="fb main" data-act="ft-pause" aria-label="หยุดพัก"' + (ph !== 'focus' ? ' disabled' : '') + '>' + ico('pause') + '</button>') + '</div>';
  }
  if (SND.open && !done) h += '<div class="focus-sheet" role="menu">' + SOUNDS.map(([k, l]) => '<button role="menuitemradio" aria-checked="' + (SND.kind === k) + '" data-act="ft-snd" data-v="' + k + '"><i></i>' + l + '</button>').join('') + '<p>เสียงสร้างจากเว็บ ไม่ต้องโหลดไฟล์</p></div>';
  return h + '</div>';
}
function logHtml(no) {
  const L = ft.log[no];
  if (!L) return '<div class="log t-sub">กำลังโหลดประวัติ…</div>';
  if (L === 'err') return '<div class="log t-sub">โหลดประวัติไม่ได้ (ต้องเข้าสู่ระบบ)</div>';
  if (!L.length) return '<div class="log t-sub">ยังไม่มีประวัติ</div>';
  return '<div class="log">' + L.map(x => {
    const a = x.start && x.start.toDate ? x.start.toDate() : null, e = x.end && x.end.toDate ? x.end.toDate() : null;
    const t = d => d ? String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') : '–';
    return '<div class="log-row"><span>' + (e ? TD[e.getDay()] + ' ' + e.getDate() + ' ' + TM[e.getMonth()] : '') + '</span><span>' + t(a) + '–' + t(e) + '</span><span class="log-subj">' + esc(x.subject || '') + '</span><b>' + fmtMin(x.sec || 0) + '</b></div>';
  }).join('') + '</div>';
}

let toastT;
function toast(msg) {
  let el = document.querySelector('.toast');
  if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.textContent = msg; clearTimeout(toastT); toastT = setTimeout(() => el.remove(), 3500);
}

/* ---------- events ---------- */
document.addEventListener('change', ev => { if (ev.target.id === 'f-claim') ui.claimPick = ev.target.value; });
document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act, id = b.dataset.id, v = b.dataset.v;
  const t = id ? S.tasks.find(x => x.id === id) : null;
  switch (a) {
    case 'login': ui.auth = 'login'; break;
    case 'signup': ui.auth = 'signup'; break;
    case 'authswitch': ui.auth = ui.auth === 'signup' ? 'login' : 'signup'; break;
    case 'authcancel': ui.auth = null; break;
    case 'forgot': {
      const f = b.closest('form'), email = f && f.elements.email.value.trim();
      if (!email) { toast('พิมพ์อีเมลก่อน แล้วกดลืมรหัสผ่าน'); return; }
      sendPasswordResetEmail(auth, email).then(() => toast('ส่งลิงก์ตั้งรหัสใหม่ไปที่อีเมลแล้ว'), e => toast(msgFor(e)));
      return;
    }
    case 'menu': ui.menu = !ui.menu; break;
    case 'theme': setTheme(!isDark()); break;
    case 'ft-start': sessionStart(); return;
    case 'ft-pause': sessionPause(); return;
    case 'ft-resume': sessionResume(); return;
    case 'ft-end': sessionEnd('done'); return;
    case 'ft-close': ft.session = null; SND.open = false; break;
    case 'ft-subj': ft.subject = v; break;
    case 'ft-sound': SND.open = !SND.open; break;
    case 'ft-snd': SND.open = false; playSound(v); if (!ft.session || ft.session.phase !== 'focus') stopSound(); break;
    case 'ft-range': ft.range = v; break;
    case 'ft-log': ft.logOpen = ft.logOpen === +b.dataset.no ? null : +b.dataset.no; if (ft.logOpen != null) loadLog(ft.logOpen); break;
    case 'logout': ui.menu = false; signOut(auth); ui.claimOpen = false; return;
    case 'claimopen': ui.claimOpen = true; break;
    case 'claimnext': if (!ui.claimPick) { toast('เลือกเลขที่ก่อน'); return; } ui.claimConfirm = true; break;
    case 'claimback': ui.claimConfirm = false; break;
    case 'claimgo': {
      const no = +ui.claimPick;
      const b2 = writeBatch(db);
      b2.set(P('claims', String(no)), { uid: user.uid, at: serverTimestamp() });
      b2.set(P('users', user.uid), { no, email: user.email || '' });
      ui.claimConfirm = false; ui.claimOpen = false; ui.claimPick = '';
      run(() => b2.commit(), 'ผูกบัญชีกับเลขที่ ' + no + ' แล้ว');
      break;
    }
    case 'askrelease': ui.confirmRelease = +b.dataset.no; break;
    case 'norelease': ui.confirmRelease = null; break;
    case 'release': {
      const no = +b.dataset.no, uid = S.claims[no], b2 = writeBatch(db);
      b2.delete(P('claims', String(no))); if (uid) b2.delete(P('users', uid));
      ui.confirmRelease = null; run(() => b2.commit(), 'ปลดเลขที่ ' + no + ' แล้ว ให้เจ้าของเลือกใหม่ได้');
      break;
    }
    case 'view': ui.view = v; ui.editing = null; ui.rosterEdit = false; remember(); break;
    case 'filter': ui.filter = v; break;
    case 'open': ui.open = ui.open === id ? null : id; ui.confirmDel = null; remember(); break;
    case 'past': ui.showPast = true; break;
    case 'new': ui.view = 'tasks'; ui.editing = 'new'; remember(); forceRender(); { const f = document.querySelector('form.edit'); if (f) f.scrollIntoView({ block: 'center' }); } return;
    case 'edit': ui.editing = id; break;
    case 'cancel': ui.editing = null; break;
    case 'askdel': ui.confirmDel = id; break;
    case 'nodel': ui.confirmDel = null; break;
    case 'del': {
      ui.confirmDel = null; ui.open = null;
      const b2 = writeBatch(db);
      doneSet({ id }).forEach(no => b2.delete(P('tasks', id, 'subs', String(no))));
      b2.delete(P('tasks', id));
      run(() => b2.commit(), 'ลบงานแล้ว');
      break;
    }
    case 'mine': if (t && myNo != null) { const on = iSent(t); run(() => setSub(t.id, myNo, !on), on ? 'ยกเลิกแล้ว' : 'บันทึกว่าส่งแล้ว'); } break;
    case 'tick': if (t) { const no = +b.dataset.no; run(() => setSub(t.id, no, !doneSet(t).has(no))); } break;
    case 'allon': if (t) { const b2 = writeBatch(db); S.roster.forEach(s => { if (!doneSet(t).has(s.no)) b2.set(P('tasks', t.id, 'subs', String(s.no)), { uid: user.uid, at: serverTimestamp() }); }); run(() => b2.commit(), 'ติ๊กส่งครบทุกคนแล้ว'); } break;
    case 'alloff': if (t) { const b2 = writeBatch(db); doneSet(t).forEach(no => b2.delete(P('tasks', t.id, 'subs', String(no)))); run(() => b2.commit()); } break;
    case 'mon': ui.month = new Date(ui.month.getFullYear(), ui.month.getMonth() + (+v), 1); ui.sel = null; break;
    case 'day': ui.sel = ui.sel === v ? null : v; break;
    case 'redit': ui.rosterEdit = true; break;
    case 'rcancel': ui.rosterEdit = false; break;
    default: return;
  }
  forceRender();
});
function forceRender() { const f = document.querySelector('form.edit'); if (f) f.remove(); render(); }
document.addEventListener('submit', ev => {
  ev.preventDefault();
  const f = ev.target, id = f.dataset.id;
  if (id === 'auth') {
    const email = f.elements.email.value.trim(), pass = f.elements.pass.value;
    const go = ui.auth === 'signup' ? createUserWithEmailAndPassword(auth, email, pass) : signInWithEmailAndPassword(auth, email, pass);
    go.then(() => { ui.auth = null; forceRender(); toast('เข้าสู่ระบบแล้ว'); }, e => toast(msgFor(e)));
    return;
  }
  if (id === 'roster') {
    const roster = parseRoster(f.elements.roster.value), cls = f.elements.cls.value.trim() || 'ม.4/2';
    ui.rosterEdit = false; forceRender();
    run(() => setDoc(classRef, { className: cls, roster, updatedAt: serverTimestamp() }, { merge: true }), 'บันทึกรายชื่อ ' + roster.length + ' คนแล้ว');
    return;
  }
  const data = { subject: f.elements.subject.value.trim(), title: f.elements.title.value.trim(), due: f.elements.due.value, note: f.elements.note.value.trim() };
  if (!data.subject || !data.title || !data.due) return;
  ui.editing = null; forceRender();
  if (id === 'new') run(async () => { const r = await addDoc(tasksRef, { ...data, createdAt: serverTimestamp() }); ui.open = r.id; forceRender(); }, 'เพิ่มงานแล้ว');
  else run(() => updateDoc(P('tasks', id), { ...data, updatedAt: serverTimestamp() }), 'บันทึกแล้ว');
});

render();
