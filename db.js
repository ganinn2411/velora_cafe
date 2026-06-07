/* ═══════════════════════════════════════════════════════
   AURA Coffee & Kitchen — FIREBASE REALTIME DATABASE
   db.js — Gerçek Zamanlı Bulut Senkronizasyon Katmanı
═══════════════════════════════════════════════════════ */

"use strict";

const firebaseConfig = {
  apiKey: "AIzaSyD9mz3Ghi-T4__WRqElHjI3UTXpj229rEA",
  authDomain: "cafe-65746.firebaseapp.com",
  projectId: "cafe-65746",
  storageBucket: "cafe-65746.firebasestorage.app",
  messagingSenderId: "505297122748",
  appId: "1:505297122748:web:99cc53e46e2605fdc0a7b9",
  measurementId: "G-GJCZQ3SK10"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

const DB_KEYS = {
  USERS:    "aura_users",
  MENU:     "aura_menu",
  TABLES:   "aura_tables",
  ORDERS:   "aura_orders",
  SETTINGS: "aura_settings",
  SESSION:  "aura_session",
};

let isFirebaseLoaded = false;

const DB = {
  get(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      db.collection("aura_pos_data").doc(key).set({ data: JSON.stringify(value) }).catch(err=>console.error(err));
      return true;
    } catch { return false; }
  },
  remove(key) {
    localStorage.removeItem(key);
    db.collection("aura_pos_data").doc(key).delete();
  }
};

function startFirebaseSync(onSyncComplete) {
  db.collection("aura_pos_data").onSnapshot((snapshot) => {
    if (snapshot.empty && !isFirebaseLoaded) {
        seedIfEmpty();
        isFirebaseLoaded = true;
        if (onSyncComplete) onSyncComplete();
    } else {
        snapshot.forEach(doc => {
            localStorage.setItem(doc.id, doc.data().data);
        });
        
        if (!isFirebaseLoaded) {
            isFirebaseLoaded = true;
            if (onSyncComplete) onSyncComplete(); 
        } else {
            if (window.refreshUI) window.refreshUI();
        }
    }
  }, (error) => {
     console.error("Firebase Bağlantı Hatası:", error);
     if (!isFirebaseLoaded) {
         if (!localStorage.getItem(DB_KEYS.USERS)) seedIfEmpty();
         isFirebaseLoaded = true;
         if (onSyncComplete) onSyncComplete();
     }
  });
}

function seedIfEmpty() {
    DB.set(DB_KEYS.USERS, [
      { id:"u1", name:"Müdür Kerem",   role:"admin",   pin:"1234", avatar:"K" },
      { id:"u2", name:"Barista Efe",   role:"barista", pin:"1111", avatar:"E" },
      { id:"u3", name:"Barista Ayşe",  role:"barista", pin:"2222", avatar:"A" }
    ]);

    DB.set(DB_KEYS.TABLES, [
      { id:"t1", num:1, zone:"Salon", status:"free", activeOrderId:null },
      { id:"t2", num:2, zone:"Salon", status:"free", activeOrderId:null },
      { id:"t3", num:3, zone:"Salon", status:"free", activeOrderId:null },
      { id:"t4", num:4, zone:"Teras", status:"free", activeOrderId:null },
      { id:"t5", num:5, zone:"Teras", status:"free", activeOrderId:null },
      { id:"t6", num:6, zone:"Bahçe", status:"free", activeOrderId:null },
      { id:"t7", num:7, zone:"Bahçe", status:"free", activeOrderId:null },
      { id:"t8", num:8, zone:"Bahçe", status:"free", activeOrderId:null }
    ]);

    DB.set(DB_KEYS.MENU, [
      { id:1, emoji:"☕", name:"Espresso", price:65, category:"Espresso Bazlı", popular:false },
      { id:2, emoji:"🖤", name:"Americano", price:75, category:"Espresso Bazlı", popular:true },
      { id:4, emoji:"🥛", name:"Latte", price:100, category:"Espresso Bazlı", popular:false },
      { id:18, emoji:"🍰", name:"San Sebastian", price:145, category:"Atıştırmalık", popular:true }
    ]);

    DB.set(DB_KEYS.SETTINGS, { kdv: 20, service: 0, footerText: "Bizi tercih ettiğiniz için teşekkür ederiz." });
    DB.set(DB_KEYS.ORDERS, []);
}

const UserDB = {
  getAll() { return DB.get(DB_KEYS.USERS) || []; },
  save(users) { DB.set(DB_KEYS.USERS, users); },
  getById(id) { return this.getAll().find(u => u.id === id); },
  add(user) { const all = this.getAll(); all.push(user); this.save(all); },
  delete(id) { const all = this.getAll().filter(u => u.id !== id); this.save(all); }
};

const MenuDB = {
  getAll() { return DB.get(DB_KEYS.MENU) || []; },
  save(menu) { DB.set(DB_KEYS.MENU, menu); },
  getCategories() { return [...new Set(this.getAll().map(p => p.category))]; },
  getByCategory(c) { return this.getAll().filter(p => p.category === c); }
};

const TableDB = {
  getAll() { return DB.get(DB_KEYS.TABLES) || []; },
  save(tables) { DB.set(DB_KEYS.TABLES, tables); },
  getById(id) { return this.getAll().find(t => t.id === id); },
  update(id, changes) {
    const all = this.getAll();
    const idx = all.findIndex(t => t.id === id);
    if (idx >= 0) { all[idx] = { ...all[idx], ...changes }; this.save(all); }
  }
};

const OrderDB = {
  getAll() { return DB.get(DB_KEYS.ORDERS) || []; },
  save(orders) { DB.set(DB_KEYS.ORDERS, orders); },
  getById(id) { return this.getAll().find(o => o.id === id); },
  add(order) { const all = this.getAll(); all.push(order); this.save(all); },
  update(id, changes) {
    const all = this.getAll();
    const idx = all.findIndex(o => o.id === id);
    if (idx >= 0) { all[idx] = { ...all[idx], ...changes }; this.save(all); }
  }
};

const SettingsDB = {
  get() { return DB.get(DB_KEYS.SETTINGS) || { kdv: 0, service: 0, footerText: "" }; },
  save(settings) { DB.set(DB_KEYS.SETTINGS, settings); }
};

const SessionDB = {
  getUser() { return DB.get(DB_KEYS.SESSION); },
  setUser(u) { DB.set(DB_KEYS.SESSION, u); },
  clear() { DB.remove(DB_KEYS.SESSION); }
};
