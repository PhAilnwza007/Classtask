import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, collection, collectionGroup, onSnapshot, setDoc, addDoc, updateDoc, writeBatch, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig, CLASS_ID, EDITORS } from "./firebase-config.js";
import { DEFAULT_ROSTER } from "./roster-default.js";

const TM = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const TMF = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const TD = ['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'];

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
    if (u) unsubMe = onSnapshot(P('users', u.uid), s => { myNo = s.exists() ? s.data().no : null; render(); }, () => {});
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
  if (n < 0) return { k: 'late', label: 'เลยกำหนด ' + (-n) + ' วัน' };
  if (n === 0) return { k: 'today', label: 'ส่งวันนี้' };
  if (n === 1) return { k: 'soon', label: 'ส่งพรุ่งนี้' };
  if (n <= 3) return { k: 'soon', label: 'อีก ' + n + ' วัน' };
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
  let h = '<div class="wrap"><header><div class="brand"><h1>Class<span>Task</span></h1>' +
    '<div class="cls">' + esc(S.className) + (S.roster.length ? ' · ' + S.roster.length + ' คน' : '') + '</div></div>' +
    '<div class="mode">' + authHtml() + '</div>' +
    '<nav>' + tab('tasks', 'งาน') + tab('cal', 'ปฏิทิน') + tab('roster', 'รายชื่อ') + '</nav></header><main>';
  if (!configured) h += '<div class="setup"><b>ยังไม่ได้ใส่ค่า Firebase</b><p>เปิดไฟล์ <code>firebase-config.js</code> แล้ววางค่า config</p></div>';
  else if (S.error && !S.loaded.tasks) h += '<div class="empty">' + esc(S.error) + '</div>';
  else if (!S.loaded.tasks || !S.loaded.cls) h += '<p class="loading">กำลังโหลดข้อมูลห้อง…</p>';
  else {
    h += claimHtml();
    if (ui.view === 'cal') h += viewCal();
    else if (ui.view === 'roster') h += viewRoster();
    else h += viewTasks();
  }
  h += '</main></div>';
  root.innerHTML = h;
  if (focused) { const el = document.getElementById(focused); if (el) el.focus(); }
}
const tab = (k, l) => '<button data-act="view" data-v="' + k + '" aria-current="' + (ui.view === k) + '">' + l + '</button>';
function authHtml() {
  if (!configured) return 'ยังไม่ได้เชื่อม Firebase';
  if (!user) {
    if (ui.auth) {
      const su = ui.auth === 'signup';
      return '<form class="edit" data-id="auth" style="margin-top:8px;width:100%">' +
        '<div class="full"><b>' + (su ? 'สมัครบัญชีใหม่' : 'เข้าสู่ระบบ') + '</b></div>' +
        '<label>อีเมล<input id="f-email" name="email" type="email" autocomplete="username" required></label>' +
        '<label>รหัสผ่าน' + (su ? ' (อย่างน้อย 6 ตัว)' : '') + '<input id="f-pass" name="pass" type="password" minlength="6" autocomplete="' + (su ? 'new-password' : 'current-password') + '" required></label>' +
        '<div class="row-actions full"><button class="btn primary" type="submit">' + (su ? 'สมัคร' : 'เข้าสู่ระบบ') + '</button>' +
        '<button class="btn" type="button" data-act="authswitch">' + (su ? 'มีบัญชีแล้ว' : 'ยังไม่มีบัญชี สมัครใหม่') + '</button>' +
        (su ? '' : '<button class="btn" type="button" data-act="forgot">ลืมรหัสผ่าน</button>') +
        '<button class="btn" type="button" data-act="authcancel">ยกเลิก</button></div></form>';
    }
    return '<span class="auth">เข้าสู่ระบบเพื่อกดส่งงานของตัวเอง <button class="btn small primary" data-act="login">เข้าสู่ระบบ</button><button class="btn small" data-act="signup">สมัคร</button></span>';
  }
  const me = myNo != null && stu(myNo);
  const who = me ? 'เลขที่ ' + myNo + ' ' + esc(me.nick || me.name) : esc(user.email);
  return '<span class="auth">' + (canEdit ? '<b>โหมดแก้ไข</b> ' : '') + who + ' <button class="btn small" data-act="logout">ออกจากระบบ</button></span>';
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

function viewTasks() {
  const all = sorted(), pending = all.filter(t => !isDone(t));
  let h;
  if (myNo != null && !canEdit) {
    const mine = pending.filter(t => !iSent(t));
    const late = mine.filter(t => daysLeft(t) < 0).length;
    h = '<div class="summary"><div class="stat"><div class="n">' + mine.length + '</div><div class="l">งานที่ฉันยังไม่ส่ง</div></div>' +
      '<div class="stat soon"><div class="n">' + mine.filter(t => { const n = daysLeft(t); return n >= 0 && n <= 7; }).length + '</div><div class="l">ต้องส่งภายใน 7 วัน</div></div>' +
      '<div class="stat late"><div class="n">' + late + '</div><div class="l">เลยกำหนด</div></div></div>';
  } else {
    const late = pending.filter(t => daysLeft(t) < 0).length;
    const week = pending.filter(t => { const n = daysLeft(t); return n >= 0 && n <= 7; }).length;
    h = '<div class="summary"><div class="stat"><div class="n">' + pending.length + '</div><div class="l">งานที่ยังไม่ปิด</div></div>' +
      '<div class="stat soon"><div class="n">' + week + '</div><div class="l">ต้องส่งภายใน 7 วัน</div></div>' +
      '<div class="stat late"><div class="n">' + late + '</div><div class="l">เลยกำหนด</div></div></div>';
  }
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
  const st = status(t), d = pd(t.due), n = total(), c = doneCount(t), open = ui.open === t.id;
  const mineSent = iSent(t);
  const pill = myNo != null && !isDone(t)
    ? (mineSent ? '<span class="pill p-done">ฉันส่งแล้ว</span>' : '<span class="pill p-' + st.k + '">' + st.label + '</span>')
    : '<span class="pill p-' + st.k + '">' + st.label + '</span>';
  let h = '<div class="task"><button class="task-row" data-act="open" data-id="' + t.id + '" aria-expanded="' + open + '">' +
    '<div class="date"><div class="d">' + d.getDate() + '</div><div class="m">' + TD[d.getDay()] + ' ' + TM[d.getMonth()] + '</div></div>' +
    '<div class="t-main"><div class="t-sub">' + esc(t.subject) + (n ? ' · ส่งแล้ว ' + c + '/' + n : '') + '</div><div class="t-title">' + esc(t.title) + '</div>' +
    (n ? '<div class="bar"><i style="width:' + Math.min(100, Math.round(c / n * 100)) + '%"></i></div>' : '') + '</div>' + pill + '</button>';
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
    case 'logout': signOut(auth); ui.claimOpen = false; return;
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
    case 'new': ui.editing = 'new'; break;
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
