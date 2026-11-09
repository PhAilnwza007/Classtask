// วางค่าจาก Firebase Console > Project settings > Your apps > Web app (SDK setup and configuration)
export const firebaseConfig = {
  apiKey: "AIzaSyCwGkjlhX8EYNn-WZBiaBgZwievAvEh-H0",
  authDomain: "class-taskm42.firebaseapp.com",
  projectId: "class-taskm42",
  storageBucket: "class-taskm42.firebasestorage.app",
  messagingSenderId: "124476253077",
  appId: "1:124476253077:web:3c0b475784868a9b718c9c"
};

// รหัสห้องในฐานข้อมูล (ไม่ต้องแก้ ถ้าใช้ห้องเดียว)
export const CLASS_ID = "m4-2";

// อีเมลที่แก้ไขงานได้ ต้องตรงกับใน firestore.rules ด้วย
export const EDITORS = ["krtn762@gmail.com"];
