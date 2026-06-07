/* ═══════════════════════════════════════════════════════
   AURA Coffee & Kitchen — LocalStorage Database Layer
   db.js — Tüm veri yönetimi ve kalıcı depolama
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

/* ── DATABASE HELPERS ─────────────────────────────────── */
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

/* ═══════════════════════════════════════════════════════
   INITIAL SEED DATA
═══════════════════════════════════════════════════════ */
function seedIfEmpty() {

  // ── USERS ──────────────────────────────────────────
  if (!DB.get(DB_KEYS.USERS)) {
    DB.set(DB_KEYS.USERS, [
      { id:"u1", name:"Müdür Kerem",   role:"admin",   pin:"1234", avatar:"K", color:"#4CAF7A", active:true },
      { id:"u2", name:"Barista Efe",   role:"barista", pin:"2222", avatar:"E", color:"#C8A96E", active:true },
      { id:"u3", name:"Kasiyer Selin", role:"barista", pin:"3333", avatar:"S", color:"#9B8FE0", active:true },
      { id:"u4", name:"Barista Ayşe",  role:"barista", pin:"4444", avatar:"A", color:"#E05575", active:true },
    ]);
  }

  // ── MENU ───────────────────────────────────────────
  if (!DB.get(DB_KEYS.MENU)) {
    DB.set(DB_KEYS.MENU, [
      { id:1,  cat:"Espresso Bazlı",  emoji:"☕", name:"Espresso",       price:65,  desc:"Yoğun, saf espresso",           popular:false, available:true },
      { id:2,  cat:"Espresso Bazlı",  emoji:"🖤", name:"Americano",      price:75,  desc:"Espresso + sıcak su",            popular:true,  available:true },
      { id:3,  cat:"Espresso Bazlı",  emoji:"🤍", name:"Cappuccino",     price:95,  desc:"Espresso + köpüklü süt",         popular:true,  available:true },
      { id:4,  cat:"Espresso Bazlı",  emoji:"🥛", name:"Latte",          price:100, desc:"Espresso + buharlanmış süt",     popular:false, available:true },
      { id:5,  cat:"Espresso Bazlı",  emoji:"⬜", name:"Flat White",     price:108, desc:"Yoğun espresso + microfoam",     popular:true,  available:true },
      { id:6,  cat:"Espresso Bazlı",  emoji:"🟤", name:"Cortado",        price:85,  desc:"Espresso + az süt",              popular:false, available:true },
      { id:7,  cat:"Espresso Bazlı",  emoji:"💛", name:"Macchiato",      price:90,  desc:"Espresso + süt köpüğü",          popular:false, available:true },
      { id:8,  cat:"Espresso Bazlı",  emoji:"⚫", name:"Long Black",     price:80,  desc:"Çift espresso + sıcak su",       popular:false, available:true },
      { id:9,  cat:"Espresso Bazlı",  emoji:"🫗", name:"Ristretto",      price:70,  desc:"Ultra yoğun kısa çekim",         popular:false, available:true },
      { id:10, cat:"Soğuk Kahve",     emoji:"🧊", name:"Cold Brew",      price:115, desc:"18 saat demleme, yumuşak",      popular:true,  available:true },
      { id:11, cat:"Soğuk Kahve",     emoji:"🥤", name:"Iced Latte",     price:110, desc:"Espresso + soğuk süt + buz",    popular:true,  available:true },
      { id:12, cat:"Soğuk Kahve",     emoji:"🌊", name:"Nitro Cold Brew",price:135, desc:"Azotlu, kadifemsi doku",         popular:true,  available:true },
      { id:13, cat:"Soğuk Kahve",     emoji:"❄️", name:"Iced Americano", price:85,  desc:"Çift espresso + buz + su",       popular:false, available:true },
      { id:14, cat:"Soğuk Kahve",     emoji:"🍯", name:"Dalgona",        price:120, desc:"Çırpılmış kahve + soğuk süt",   popular:false, available:true },
      { id:15, cat:"Soğuk Kahve",     emoji:"🍵", name:"Cold Matcha",    price:125, desc:"Matcha + oat milk + buz",        popular:true,  available:true },
      { id:16, cat:"Soğuk Kahve",     emoji:"🫧", name:"Sparkling Brew", price:130, desc:"Cold brew + gazsız su köpük",   popular:false, available:true },
      { id:17, cat:"Özel Tatlar",     emoji:"🧡", name:"Caramel Latte",  price:120, desc:"Tatlı karamel soslu latte",     popular:true,  available:true },
      { id:18, cat:"Özel Tatlar",     emoji:"🟫", name:"Hazelnut Mocha", price:125, desc:"Fındık + çikolata + espresso",  popular:false, available:true },
      { id:19, cat:"Özel Tatlar",     emoji:"🤍", name:"Vanilla Sky",    price:115, desc:"Vanilya + buharlanmış süt",     popular:false, available:true },
      { id:20, cat:"Özel Tatlar",     emoji:"🤎", name:"Brown Sugar Oat",price:130, desc:"Kahverengi şeker + yulaf sütü", popular:true,  available:true },
      { id:21, cat:"Özel Tatlar",     emoji:"💜", name:"Lavender Latte", price:138, desc:"Lavanta şurubu + espresso",     popular:true,  available:true },
      { id:22, cat:"Özel Tatlar",     emoji:"💚", name:"Pistachio Cream",price:145, desc:"Fıstık kreması + espresso",     popular:false, available:true },
      { id:23, cat:"Özel Tatlar",     emoji:"🩷", name:"Rose Latte",     price:132, desc:"Gül suyu + süt + espresso",     popular:false, available:true },
      { id:24, cat:"Çay & Alternatif",emoji:"🍵", name:"Matcha Latte",   price:110, desc:"Seremoni matcha + süt",         popular:true,  available:true },
      { id:25, cat:"Çay & Alternatif",emoji:"🟠", name:"Chai Latte",     price:105, desc:"Baharatlı masala çayı",         popular:false, available:true },
      { id:26, cat:"Çay & Alternatif",emoji:"🌰", name:"Hojicha Latte",  price:115, desc:"Kavrulmuş yeşil çay",           popular:false, available:true },
      { id:27, cat:"Çay & Alternatif",emoji:"🫖", name:"Earl Grey",      price:85,  desc:"Bergamot aromatlı siyah çay",   popular:false, available:true },
      { id:28, cat:"Çay & Alternatif",emoji:"🦋", name:"Butterfly Pea",  price:125, desc:"Renk değiştiren büyülü çay",    popular:true,  available:true },
      { id:29, cat:"Çay & Alternatif",emoji:"🌿", name:"Fresh Mint Tea", price:75,  desc:"Taze nane demlemesi",            popular:false, available:true },
      { id:30, cat:"Çay & Alternatif",emoji:"🍋", name:"Lemon Ginger",   price:80,  desc:"Limon + zencefil demleme",      popular:false, available:true },
      { id:31, cat:"Atıştırmalık",    emoji:"🥐", name:"Croissant",      price:90,  desc:"Tereyağlı, çıtır Fransız",      popular:true,  available:true },
      { id:32, cat:"Atıştırmalık",    emoji:"🥑", name:"Avokado Toast",  price:168, desc:"Ekşi maya + avokado + yumurta", popular:true,  available:true },
      { id:33, cat:"Atıştırmalık",    emoji:"🍌", name:"Banana Bread",   price:95,  desc:"Ev yapımı, nemli dilim",         popular:false, available:true },
      { id:34, cat:"Atıştırmalık",    emoji:"🥣", name:"Granola Bowl",   price:125, desc:"Yoğurt + granola + meyve",      popular:false, available:true },
      { id:35, cat:"Atıştırmalık",    emoji:"🍰", name:"Cheesecake",     price:148, desc:"New York tarzı dilim",           popular:true,  available:true },
      { id:36, cat:"Atıştırmalık",    emoji:"🍪", name:"Cookie",         price:55,  desc:"Çikolata parçacıklı",            popular:false, available:true },
      { id:37, cat:"Atıştırmalık",    emoji:"🧁", name:"Muffin",         price:75,  desc:"Yaban mersinli/çikolatalı",     popular:false, available:true },
      { id:38, cat:"Atıştırmalık",    emoji:"🥪", name:"Sandviç",        price:145, desc:"Prosciutto + mozzarella",        popular:false, available:true },
      { id:39, cat:"Serinletici",     emoji:"🍋", name:"Limonata",       price:80,  desc:"Taze sıkım + nane",             popular:false, available:true },
      { id:40, cat:"Serinletici",     emoji:"💧", name:"Sparkling Water", price:50, desc:"San Pellegrino 500ml",           popular:false, available:true },
      { id:41, cat:"Serinletici",     emoji:"🫐", name:"Smoothie",       price:138, desc:"Karışık meyve + yoğurt",        popular:true,  available:true },
      { id:42, cat:"Serinletici",     emoji:"🌺", name:"Hibiscus Cooler",price:108, desc:"Hibiskus + limon + buz",        popular:true,  available:true },
      { id:43, cat:"Serinletici",     emoji:"🍓", name:"Berry Lemonade", price:115, desc:"Çilek + ahududu + limon",       popular:false, available:true },
      { id:44, cat:"Serinletici",     emoji:"🥭", name:"Mango Lassi",    price:125, desc:"Mango + yoğurt + hindistan",    popular:false, available:true },
    ]);
  }

  // ── TABLES ─────────────────────────────────────────
  if (!DB.get(DB_KEYS.TABLES)) {
    const tables = [];
    // İç Alan
    for (let i = 1; i <= 8; i++) {
      tables.push({ id:`I${i}`, num:i, zone:"inner", zoneLabel:"İç Alan", cap: i%3===0?6:i%2===0?4:2, status:"free", orders:[], activeOrderId:null });
    }
    // Teras
    for (let i = 1; i <= 5; i++) {
      tables.push({ id:`T${i}`, num:`T${i}`, zone:"terrace", zoneLabel:"Teras", cap: i===4?6:4, status:"free", orders:[], activeOrderId:null });
    }
    // Lounge
    for (let i = 1; i <= 3; i++) {
      tables.push({ id:`L${i}`, num:`L${i}`, zone:"lounge", zoneLabel:"Lounge", cap: i===2?8:i===1?6:4, status:"free", orders:[], activeOrderId:null });
    }
    DB.set(DB_KEYS.TABLES, tables);
  }

  // ── ORDERS ─────────────────────────────────────────
  if (!DB.get(DB_KEYS.ORDERS)) {
    DB.set(DB_KEYS.ORDERS, []);
  }

  // ── SETTINGS ───────────────────────────────────────
  if (!DB.get(DB_KEYS.SETTINGS)) {
    DB.set(DB_KEYS.SETTINGS, { orderCounter: 40, taxRate: 8 });
  }
}

/* ═══════════════════════════════════════════════════════
   DATA ACCESS FUNCTIONS
═══════════════════════════════════════════════════════ */

// USERS
const UserDB = {
  getAll()           { return DB.get(DB_KEYS.USERS) || []; },
  save(users)        { DB.set(DB_KEYS.USERS, users); },
  getById(id)        { return this.getAll().find(u => u.id === id); },
  authenticate(id, pin) {
    const u = this.getById(id);
    return u && u.pin === pin && u.active ? u : null;
  },
};

// SESSION
const SessionDB = {
  get()     { return DB.get(DB_KEYS.SESSION); },
  set(user) { DB.set(DB_KEYS.SESSION, { userId: user.id, loginTime: Date.now() }); },
  clear()   { DB.remove(DB_KEYS.SESSION); },
  getUser() {
    const s = this.get();
    if (!s) return null;
    return UserDB.getById(s.userId);
  },
};

// MENU
const MenuDB = {
  getAll()        { return DB.get(DB_KEYS.MENU) || []; },
  save(items)     { DB.set(DB_KEYS.MENU, items); },
  getCategories() { return [...new Set(this.getAll().map(p => p.cat))]; },
  getByCategory(cat) { return this.getAll().filter(p => p.cat === cat); },
  getById(id)     { return this.getAll().find(p => p.id === id); },
  nextId()        { return Math.max(...this.getAll().map(p => p.id), 0) + 1; },
  add(item) {
    const all = this.getAll();
    all.push({ ...item, id: this.nextId() });
    this.save(all);
  },
  update(id, changes) {
    const all = this.getAll();
    const idx = all.findIndex(p => p.id === id);
    if (idx >= 0) { all[idx] = { ...all[idx], ...changes }; this.save(all); }
  },
  delete(id) {
    this.save(this.getAll().filter(p => p.id !== id));
  },
};

// TABLES
const TableDB = {
  getAll()        { return DB.get(DB_KEYS.TABLES) || []; },
  save(tables)    { DB.set(DB_KEYS.TABLES, tables); },
  getById(id)     { return this.getAll().find(t => t.id === id); },
  update(id, changes) {
    const all = this.getAll();
    const idx = all.findIndex(t => t.id === id);
    if (idx >= 0) { all[idx] = { ...all[idx], ...changes }; this.save(all); }
  },
  getActiveOrder(tableId) {
    const t = this.getById(tableId);
    if (!t || !t.activeOrderId) return null;
    return OrderDB.getById(t.activeOrderId);
  },
};

// ORDERS
const OrderDB = {
  getAll()    { return DB.get(DB_KEYS.ORDERS) || []; },
  save(orders){ DB.set(DB_KEYS.ORDERS, orders); },
  getById(id) { return this.getAll().find(o => o.id === id); },
  getByTable(tableId) { return this.getAll().filter(o => o.tableId === tableId); },
  getToday() {
    const today = new Date();
    today.setHours(0,0,0,0);
    return this.getAll().filter(o => new Date(o.createdAt) >= today);
  },
  getThisWeek() {
    const monday = new Date();
    monday.setDate(monday.getDate() - monday.getDay() + (monday.getDay()===0?-6:1));
    monday.setHours(0,0,0,0);
    return this.getAll().filter(o => new Date(o.createdAt) >= monday);
  },
  add(order) {
    const all = this.getAll();
    all.push(order);
    this.save(all);
  },
  update(id, changes) {
    const all = this.getAll();
    const idx = all.findIndex(o => o.id === id);
    if (idx >= 0) { all[idx] = { ...all[idx], ...changes }; this.save(all); }
  },
  nextCounter() {
    const s = DB.get(DB_KEYS.SETTINGS) || { orderCounter: 40 };
    s.orderCounter++;
    DB.set(DB_KEYS.SETTINGS, s);
    return s.orderCounter;
  },
};

// SETTINGS
const SettingsDB = {
  get()       { return DB.get(DB_KEYS.SETTINGS) || { orderCounter:40, taxRate:8 }; },
  save(s)     { DB.set(DB_KEYS.SETTINGS, s); },
  getTaxRate(){ return this.get().taxRate || 8; },
};
// SETTINGS DB INTERFACE
const SettingsDB = {
  get() {
    // Eğer daha önce kaydedilmiş ayar yoksa varsayılan değerleri getirir
    return DB.get(DB_KEYS.SETTINGS) || {
      kdv: 20,
      service: 0,
      footerText: "Bizi tercih ettiğiniz için teşekkür ederiz."
    };
  },
  save(settings) {
    DB.set(DB_KEYS.SETTINGS, settings);
  }
};
