/* ═══════════════════════════════════════════════════════
   AURA Coffee & Kitchen — LocalStorage Database Layer
   db.js — Otomatik Hafıza Onarımlı Sürüm
═══════════════════════════════════════════════════════ */

"use strict";

const DB_KEYS = {
  USERS:    "aura_users",
  MENU:     "aura_menu",
  TABLES:   "aura_tables",
  ORDERS:   "aura_orders",
  SETTINGS: "aura_settings",
  SESSION:  "aura_session",
};

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
      return true;
    } catch { return false; }
  },
  remove(key) { localStorage.removeItem(key); }
};

function seedIfEmpty() {
  // EKRANIN BOŞ KALMASINI ENGELLEYEN GÜVENLİK VANASI:
  // Eğer hafıza bozuksa veya kullanıcılar dizisi boş kalmışsa her şeyi zorla sıfırla
  if (!localStorage.getItem("aura_users") || localStorage.getItem("aura_users") === "[]") {
    localStorage.clear();
    
    // Kullanıcılar (Giriş Şifreleri)
    localStorage.setItem("aura_users", JSON.stringify([
      { id:"u1", name:"Müdür Kerem",   role:"admin",   pin:"1234", avatar:"K" },
      { id:"u2", name:"Barista Efe",   role:"barista", pin:"1111", avatar:"E" },
      { id:"u3", name:"Barista Ayşe",  role:"barista", pin:"2222", avatar:"A" }
    ]));

    // Masalar
    localStorage.setItem("aura_tables", JSON.stringify([
      { id:"t1", num:1, zone:"Salon", status:"free", activeOrderId:null },
      { id:"t2", num:2, zone:"Salon", status:"free", activeOrderId:null },
      { id:"t3", num:3, zone:"Salon", status:"free", activeOrderId:null },
      { id:"t4", num:4, zone:"Teras", status:"free", activeOrderId:null },
      { id:"t5", num:5, zone:"Teras", status:"free", activeOrderId:null },
      { id:"t6", num:6, zone:"Bahçe", status:"free", activeOrderId:null },
      { id:"t7", num:7, zone:"Bahçe", status:"free", activeOrderId:null },
      { id:"t8", num:8, zone:"Bahçe", status:"free", activeOrderId:null }
    ]));

    // Menü
    localStorage.setItem("aura_menu", JSON.stringify([
      { id:1,  emoji:"☕", name:"Espresso",       price:65,  category:"Espresso Bazlı", desc:"Yoğun, saf espresso",          popular:false },
      { id:2,  emoji:"🖤", name:"Americano",      price:75,  category:"Espresso Bazlı", desc:"Espresso + sıcak su",           popular:true  },
      { id:3,  emoji:"🤍", name:"Cappuccino",     price:95,  category:"Espresso Bazlı", desc:"Espresso + köpüklü süt",        popular:true  },
      { id:4,  emoji:"🥛", name:"Latte",          price:100, category:"Espresso Bazlı", desc:"Espresso + buharlanmış süt",    popular:false },
      { id:5,  emoji:"⬜", name:"Flat White",     price:108, category:"Espresso Bazlı", desc:"Yoğun espresso + microfoam",    popular:true  },
      { id:12, emoji:"🧊", name:"Iced Latte",     price:110, category:"Soğuk Kahve",     desc:"Buzlu espresso ve soğuk süt", popular:true  },
      { id:18, emoji:"🍰", name:"San Sebastian",  price:145, category:"Atıştırmalık",    desc:"Akışkan kıvamlı efsane lezzet",popular:true  }
    ]));

    localStorage.setItem("aura_orders", JSON.stringify([]));
    console.log("AURA POS: Sistem hafızası başarıyla sıfırlandı.");
  }
}

// USER DB INTERFACE
const UserDB = {
  getAll()    { return DB.get(DB_KEYS.USERS) || []; },
  save(users) { DB.set(DB_KEYS.USERS, users); },
  getById(id) { return this.getAll().find(u => u.id === id); }
};

// MENU DB INTERFACE
const MenuDB = {
  getAll()        { return DB.get(DB_KEYS.MENU) || []; },
  save(menu)      { DB.set(DB_KEYS.MENU, menu); },
  getCategories() { return [...new Set(this.getAll().map(p => p.category))]; },
  getByCategory(c){ return this.getAll().filter(p => p.category === c); }
};

// TABLES DB INTERFACE
const TableDB = {
  getAll()     { return DB.get(DB_KEYS.TABLES) || []; },
  save(tables) { DB.set(DB_KEYS.TABLES, tables); },
  getById(id)  { return this.getAll().find(t => t.id === id); },
  update(id, changes) {
    const all = this.getAll();
    const idx = all.findIndex(t => t.id === id);
    if (idx >= 0) { all[idx] = { ...all[idx], ...changes }; this.save(all); }
  }
};

// ORDERS DB INTERFACE
const OrderDB = {
  getAll()    { return DB.get(DB_KEYS.ORDERS) || []; },
  save(orders){ DB.set(DB_KEYS.ORDERS, orders); },
  getById(id) { return this.getAll().find(o => o.id === id); },
  add(order) {
    const all = this.getAll();
    all.push(order);
    this.save(all);
  },
  update(id, changes) {
    const all = this.getAll();
    const idx = all.findIndex(o => o.id === id);
    if (idx >= 0) { all[idx] = { ...all[idx], ...changes }; this.save(all); }
  }
};

function toggleForgotHelp() {
  const el = document.getElementById("forgotHelp");
  el.style.display = el.style.display === "none" ? "block" : "none";
}

// SESSION DB INTERFACE
const SessionDB = {
  getUser()   { return DB.get(DB_KEYS.SESSION); },
  setUser(u)  { DB.set(DB_KEYS.SESSION, u); },
  clear()     { DB.remove(DB_KEYS.SESSION); }
};
