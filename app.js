import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, collection, onSnapshot, setDoc, addDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig, CLASS_ID, EDITORS } from "./firebase-config.js";
import { DEFAULT_ROSTER } from "./roster-default.js";

const TM = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const TMF = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const TD = ['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'];

const S = { className: 'ม.4/2', roster: [], tasks: [], loaded: { cls: false, tasks: false }, error: '' };
const ui = { loginOpen: false, view: 'tasks', open: null, filter: 'all', editing: null, confirmDel: null, month: null, sel: null, showPast: false, rosterEdit: false };
try { const sv = JSON.parse(sessionStorage.getItem('ct-ui') || 'null'); if (sv) { ui.view = sv.view || 'tasks'; ui.open = sv.open || null; } } catch (e) {}
let user = null, canEdit = false, busy = false;

const root = document.getElementById('root');
const configured = firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('YOUR_');

let auth, db, classRef, tasksRef;
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
    S.tasks = snap.docs.map(x => ({ id: x.id, done: [], ...x.data() }));
    S.loaded.tasks = true; render();
  }, err => { S.error = msgFor(err); render(); });

  onAuthStateChanged(auth, u => {
    user = u;
    canEdit = !!(u && u.email && EDITORS.includes(u.email.toLowerCase()));
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
const isDone = t => total() > 0 && (t.done || []).filter(n => S.roster.some(s => s.no === n)).length >= total();
const subjects = () => [...new Set(S.tasks.map(t => t.subject).filter(Boolean))].sort();
const sorted = () => S.tasks.slice().sort((a, b) => a.due < b.due ? -1 : a.due > b.due ? 1 : 0);
const remember = () => { try { sessionStorage.setItem('ct-ui', JSON.stringify({ view: ui.view, open: ui.open })); } catch (e) {} };
function msgFor(e) {
  const c = e && e.code || '';
  if (c.includes('permission-denied')) return 'บัญชีนี้ไม่มีสิทธิ์แก้ไข ต้องเข้าสู่ระบบด้วยอีเมลที่ตั้งเป็นผู้แก้ไขไว้';
  if (c.includes('unavailable')) return 'ต่อฐานข้อมูลไม่ได้ ตรวจอินเทอร์เน็ตแล้วลองใหม่';
  if (c.includes('popup-closed') || c.includes('cancelled-popup')) return 'ปิดหน้าต่างเข้าสู่ระบบก่อนเสร็จ ลองกดเข้าสู่ระบบอีกครั้ง';
  if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found') || c.includes('invalid-email')) return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
  if (c.includes('too-many-requests')) return 'ลองผิดหลายครั้งเกินไป รอสักครู่แล้วลองใหม่';
  if (c.includes('operation-not-allowed')) return 'ยังไม่ได้เปิด Email/Password ใน Firebase Authentication';
  if (c.includes('unauthorized-domain')) return 'โดเมนนี้ยังไม่ได้เพิ่มใน Firebase Authentication > Settings > Authorized domains';
  return 'เกิดข้อผิดพลาด (' + (c || 'unknown') + ')';
}
function status(t) {
  if (isDone(t)) return { k: 'done', label: 'ส่งครบแล้ว' };
  const n = daysLeft(t);
  if (n < 0) return { k: 'late', label: 'เลยกำหนด ' + (-n) + ' วัน' };
  if (n === 0) return { k: 'today', label: 'ส่งวันนี้' };
  if (n === 1) return { k: 'soon', label: 'ส่งพรุ่งนี้' };
  if (n <= 3) return { k: 'soon', label: 'อีก ' + n + ' วัน' };
  return { k: 'wait', label: 'อีก ' + n + ' วัน' };
}
const evClass = t => { const k = status(t).k; return k === 'today' ? 'e-soon' : 'e-' + k; };
const who = s => '<span class="nick">' + esc(s.nick || s.name) + '</span>';

/* ---------- writes ---------- */
async function run(fn, okMsg) {
  if (busy) return; busy = true;
  try { await fn(); if (okMsg) toast(okMsg); }
  catch (e) { toast(msgFor(e)); }
  finally { busy = false; }
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
  const focused = document.activeElement && document.activeElement.id;
  if (ui.editing || ui.rosterEdit || ui.loginOpen) { if (document.querySelector('form.edit')) return; }
  let h = '<div class="wrap"><header><div class="brand"><h1>Class<span>Task</span></h1>' +
    '<div class="cls">' + esc(S.className) + (S.roster.length ? ' · ' + S.roster.length + ' คน' : '') + '</div></div>' +
    '<div class="mode">' + authHtml() + '</div>' +
    '<nav>' + tab('tasks', 'งาน') + tab('cal', 'ปฏิทิน') + tab('roster', 'รายชื่อ') + '</nav></header><main>';
  if (!configured) h += setupHtml();
  else if (S.error && !S.loaded.tasks) h += '<div class="empty">' + esc(S.error) + '</div>';
  else if (!S.loaded.tasks || !S.loaded.cls) h += '<p class="loading">กำลังโหลดข้อมูลห้อง…</p>';
  else if (ui.view === 'cal') h += viewCal();
  else if (ui.view === 'roster') h += viewRoster();
  else h += viewTasks();
  h += '</main></div>';
  root.innerHTML = h;
  if (focused) { const el = document.getElementById(focused); if (el) el.focus(); }
}
const tab = (k, l) => '<button data-act="view" data-v="' + k + '" aria-current="' + (ui.view === k) + '">' + l + '</button>';
function authHtml() {
  if (!configured) return 'ยังไม่ได้เชื่อม Firebase';
  if (!user) return ui.loginOpen
    ? '<form class="edit" data-id="login" style="margin-top:8px;width:100%"><label>อีเมล<input id="f-email" name="email" type="email" autocomplete="username" required></label><label>รหัสผ่าน<input id="f-pass" name="pass" type="password" autocomplete="current-password" required></label><div class="row-actions full"><button class="btn primary" type="submit">เข้าสู่ระบบ</button><button class="btn" type="button" data-act="logincancel">ยกเลิก</button></div></form>'
    : '<span class="auth">ดูอย่างเดียว <button class="btn small" data-act="login">เข้าสู่ระบบเพื่อแก้ไข</button></span>';
  if (!canEdit) return '<span class="auth">' + esc(user.email) + ' ไม่มีสิทธิ์แก้ไข <button class="btn small" data-act="logout">ออกจากระบบ</button></span>';
  return '<span class="auth"><b>โหมดแก้ไข</b> แก้แล้วบันทึกทันที <button class="btn small" data-act="logout">ออกจากระบบ</button></span>';
}
function setupHtml() {
  return '<div class="setup"><b>ยังไม่ได้ใส่ค่า Firebase</b><p>เปิดไฟล์ <code>firebase-config.js</code> แล้ววางค่า config จาก Firebase Console จากนั้นรีเฟรชหน้านี้</p></div>';
}

function viewTasks() {
  const all = sorted(), pending = all.filter(t => !isDone(t));
  const late = pending.filter(t => daysLeft(t) < 0).length;
  const week = pending.filter(t => { const n = daysLeft(t); return n >= 0 && n <= 7; }).length;
  let h = '<div class="summary"><div class="stat"><div class="n">' + pending.length + '</div><div class="l">งานที่ยังไม่ปิด</div></div>' +
    '<div class="stat soon"><div class="n">' + week + '</div><div class="l">ต้องส่งภายใน 7 วัน</div></div>' +
    '<div class="stat late"><div class="n">' + late + '</div><div class="l">เลยกำหนด</div></div></div>';
  h += '<div class="toolbar"><div class="chips"><button class="chip" data-act="filter" data-v="all" aria-pressed="' + (ui.filter === 'all') + '">ทุกวิชา</button>';
  subjects().forEach(s => { h += '<button class="chip" data-act="filter" data-v="' + esc(s) + '" aria-pressed="' + (ui.filter === s) + '">' + esc(s) + '</button>'; });
  h += '</div>' + (canEdit ? '<button class="btn primary" data-act="new">เพิ่มงาน</button>' : '') + '</div>';
  if (ui.editing === 'new') h += formHtml(null);
  if (!S.tasks.length) return h + '<div class="empty">ยังไม่มีงาน' + (canEdit ? ' กด "เพิ่มงาน" เพื่อลงงานชิ้นแรก' : '') + '</div>';
  const list = all.filter(t => ui.filter === 'all' || t.subject === ui.filter);
  const up = list.filter(t => !isDone(t) && daysLeft(t) >= 0);
  const lt = list.filter(t => !isDone(t) && daysLeft(t) < 0);
  const dn = list.filter(isDone);
  if (lt.length) h += '<div class="group-h">เลยกำหนด</div><div class="list">' + lt.map(taskHtml).join('') + '</div>';
  h += '<div class="group-h">กำลังจะถึง</div>' + (up.length ? '<div class="list">' + up.map(taskHtml).join('') + '</div>' : '<div class="empty">ไม่มีงานค้างในช่วงนี้</div>');
  if (dn.length) h += '<div class="group-h">ส่งครบแล้ว (' + dn.length + ')</div>' + (ui.showPast ? '<div class="list">' + dn.map(taskHtml).join('') + '</div>' : '<button class="btn small" data-act="past">แสดงงานที่ส่งครบแล้ว</button>');
  return h;
}
function taskHtml(t) {
  if (ui.editing === t.id) return formHtml(t);
  const st = status(t), d = pd(t.due), n = total(), c = (t.done || []).length, open = ui.open === t.id;
  let h = '<div class="task"><button class="task-row" data-act="open" data-id="' + t.id + '" aria-expanded="' + open + '">' +
    '<div class="date"><div class="d">' + d.getDate() + '</div><div class="m">' + TD[d.getDay()] + ' ' + TM[d.getMonth()] + '</div></div>' +
    '<div class="t-main"><div class="t-sub">' + esc(t.subject) + '</div><div class="t-title">' + esc(t.title) + '</div>' +
    (n ? '<div class="bar" title="ส่งแล้ว ' + c + '/' + n + '"><i style="width:' + Math.min(100, Math.round(c / n * 100)) + '%"></i></div>' : '') + '</div>' +
    '<span class="pill p-' + st.k + '">' + st.label + '</span></button>';
  if (open) h += detailHtml(t);
  return h + '</div>';
}
function detailHtml(t) {
  const n = total(), done = t.done || [], c = done.length, d = pd(t.due);
  let h = '<div class="detail"><div class="t-sub">กำหนดส่ง ' + TD[d.getDay()] + ' ' + d.getDate() + ' ' + TMF[d.getMonth()] + ' ' + (d.getFullYear() + 543) + '</div>';
  if (t.note) h += '<p class="note">' + esc(t.note) + '</p>';
  if (!n) h += '<div class="t-sub">ยังไม่มีรายชื่อนักเรียน' + (canEdit ? ' ไปที่แท็บ "รายชื่อ" เพื่อเพิ่ม' : '') + '</div>';
  else {
    h += '<div class="sub-head"><span>ส่งแล้ว <b>' + c + '/' + n + '</b> คน</span>' + (canEdit ? '<span class="row-actions"><button class="btn small" data-act="allon" data-id="' + t.id + '">ส่งครบทุกคน</button><button class="btn small" data-act="alloff" data-id="' + t.id + '">ล้างทั้งหมด</button></span>' : '') + '</div>';
    if (canEdit) {
      h += '<div class="roster-grid">' + S.roster.map(s => { const on = done.includes(s.no); return '<button class="stu' + (on ? ' on' : '') + '" data-act="tick" data-id="' + t.id + '" data-no="' + s.no + '" aria-pressed="' + on + '"><span class="no">' + s.no + '</span><span class="nm">' + esc(s.nick || s.name) + '</span></button>'; }).join('') + '</div>';
    } else {
      const miss = S.roster.filter(s => !done.includes(s.no));
      h += miss.length ? '<div class="missing"><div class="t-sub">ยังไม่ส่ง ' + miss.length + ' คน</div>' + miss.map(s => '<span>' + s.no + ' ' + esc(s.nick || s.name) + '</span>').join('') + '</div>' : '<div class="t-sub">ทุกคนส่งแล้ว</div>';
    }
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
  let h = '<div class="cal-head"><button class="btn small" data-act="mon" data-v="-1" aria-label="เดือนก่อน">‹</button><h2>' + TMF[m.getMonth()] + ' ' + (m.getFullYear() + 543) + '</h2><button class="btn small" data-act="mon" data-v="1" aria-label="เดือนถัดไป">›</button></div><div class="cal">';
  TD.forEach(d => { h += '<div class="dow">' + d + '</div>'; });
  for (let i = 0; i < 42; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i); const k = ymd(d), ts = byDay[k] || [];
    if (i === 35 && d.getMonth() !== m.getMonth()) break;
    h += '<button class="day' + (d.getMonth() !== m.getMonth() ? ' out' : '') + (k === ymd(t0) ? ' today' : '') + (ui.sel === k ? ' sel' : '') + '" data-act="day" data-v="' + k + '"><span class="num">' + d.getDate() + '</span>' +
      ts.map(t => '<span class="ev ' + evClass(t) + '">' + esc(t.subject) + '</span>').join('') +
      (ts.length ? '<span class="dots">' + ts.map(t => '<span class="dot ' + evClass(t) + '"></span>').join('') + '</span>' : '') + '</button>';
  }
  h += '</div>';
  if (ui.sel) { const sd = pd(ui.sel), list = byDay[ui.sel] || []; h += '<div class="group-h">' + TD[sd.getDay()] + ' ' + sd.getDate() + ' ' + TMF[sd.getMonth()] + '</div>' + (list.length ? '<div class="list">' + list.map(taskHtml).join('') + '</div>' : '<div class="empty">ไม่มีงานส่งวันนี้</div>'); }
  else h += '<p class="t-sub" style="margin-top:12px">แตะวันที่เพื่อดูงานที่ต้องส่งวันนั้น</p>';
  return h;
}
function viewRoster() {
  let h = '<div class="toolbar"><div class="chips"><span class="t-sub">' + (S.roster.length ? 'นักเรียน ' + S.roster.length + ' คน · จำนวนงานที่ยังค้างของแต่ละคน' : 'ยังไม่มีรายชื่อ') + '</span></div>' + (canEdit && !ui.rosterEdit ? '<button class="btn" data-act="redit">แก้รายชื่อ</button>' : '') + '</div>';
  if (canEdit && ui.rosterEdit) {
    const txt = S.roster.length ? rosterText(S.roster) : DEFAULT_ROSTER;
    return h + '<form class="edit" data-id="roster"><label class="full">ชื่อห้อง<input id="f-class" name="cls" value="' + esc(S.className) + '"></label>' +
      '<label class="full">รายชื่อ บรรทัดละ 1 คน รูปแบบ "เลขที่ ชื่อ นามสกุล (ชื่อเล่น)"<textarea id="f-roster" name="roster" rows="14">' + esc(txt) + '</textarea></label>' +
      '<div class="row-actions full"><button class="btn primary" type="submit">บันทึกรายชื่อ</button><button class="btn" type="button" data-act="rcancel">ยกเลิก</button></div></form>';
  }
  if (!S.roster.length) return h + '<div class="empty">ยังไม่มีรายชื่อนักเรียน' + (canEdit ? ' กด "แก้รายชื่อ" ระบบเตรียมรายชื่อ ม.4/2 ทั้ง 36 คนไว้ให้แล้ว ตรวจแล้วกดบันทึก' : '') + '</div>';
  const open = S.tasks.filter(t => !isDone(t));
  h += '<div class="tbl-wrap"><table><thead><tr><th>เลขที่</th><th>ชื่อ</th><th>ค้าง</th><th>เลยกำหนด</th></tr></thead><tbody>';
  S.roster.forEach(s => {
    const owe = open.filter(t => !(t.done || []).includes(s.no));
    const late = owe.filter(t => daysLeft(t) < 0).length;
    h += '<tr><td class="no">' + s.no + '</td><td>' + who(s) + (s.nick ? '<div class="full-name">' + esc(s.name) + '</div>' : '') + '</td><td class="cnt">' + owe.length + '</td><td class="cnt' + (late ? ' bad' : '') + '">' + late + '</td></tr>';
  });
  return h + '</tbody></table></div>';
}

let toastT;
function toast(msg) {
  let el = document.querySelector('.toast');
  if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.textContent = msg; clearTimeout(toastT); toastT = setTimeout(() => el.remove(), 3500);
}

/* ---------- events ---------- */
document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act, id = b.dataset.id, v = b.dataset.v;
  const t = id ? S.tasks.find(x => x.id === id) : null;
  const tRef = id ? doc(db, 'classes', CLASS_ID, 'tasks', id) : null;
  switch (a) {
    case 'login': ui.loginOpen = true; break;
    case 'logincancel': ui.loginOpen = false; break;
    case 'logout': signOut(auth); return;
    case 'view': ui.view = v; ui.editing = null; ui.rosterEdit = false; remember(); break;
    case 'filter': ui.filter = v; break;
    case 'open': ui.open = ui.open === id ? null : id; ui.confirmDel = null; remember(); break;
    case 'past': ui.showPast = true; break;
    case 'new': ui.editing = 'new'; break;
    case 'edit': ui.editing = id; break;
    case 'cancel': ui.editing = null; break;
    case 'askdel': ui.confirmDel = id; break;
    case 'nodel': ui.confirmDel = null; break;
    case 'del': ui.confirmDel = null; ui.open = null; run(() => deleteDoc(tRef), 'ลบงานแล้ว'); break;
    case 'tick': if (t) { const no = +b.dataset.no; const on = (t.done || []).includes(no); run(() => updateDoc(tRef, { done: on ? arrayRemove(no) : arrayUnion(no) })); } break;
    case 'allon': if (t) run(() => updateDoc(tRef, { done: S.roster.map(s => s.no) }), 'ติ๊กส่งครบทุกคนแล้ว'); break;
    case 'alloff': if (t) run(() => updateDoc(tRef, { done: [] })); break;
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
  if (id === 'login') {
    const email = f.elements.email.value.trim(), pass = f.elements.pass.value;
    signInWithEmailAndPassword(auth, email, pass).then(() => { ui.loginOpen = false; forceRender(); toast('เข้าสู่ระบบแล้ว'); }, e => toast(msgFor(e)));
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
  if (id === 'new') run(async () => { const r = await addDoc(tasksRef, { ...data, done: [], createdAt: serverTimestamp() }); ui.open = r.id; forceRender(); }, 'เพิ่มงานแล้ว');
  else run(() => updateDoc(doc(db, 'classes', CLASS_ID, 'tasks', id), { ...data, updatedAt: serverTimestamp() }), 'บันทึกแล้ว');
});

render();
