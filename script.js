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
/********************************************************/
const CouponDB = {
  getAll(){ try{ const r=localStorage.getItem("aura_coupons"); return r?JSON.parse(r):[]; }catch{return[];} },
  save(c){ localStorage.setItem("aura_coupons",JSON.stringify(c)); }
};

function addCoupon(){
  const code=document.getElementById("cpCode").value.trim().toUpperCase();
  const type=document.getElementById("cpType").value;
  const value=parseFloat(document.getElementById("cpValue").value);
  const min=parseFloat(document.getElementById("cpMin").value)||0;
  const limit=parseInt(document.getElementById("cpLimit").value)||null;
  const desc=document.getElementById("cpDesc").value.trim();
  const expiry=document.getElementById("cpExpiry").value;
  if(!code){ showToast("Kupon kodu zorunludur!"); return; }
  if(isNaN(value)||value<=0){ showToast("Geçerli bir indirim değeri girin!"); return; }
  const all=CouponDB.getAll();
  if(all.find(c=>c.code===code)){ showToast("Bu kupon kodu zaten mevcut!"); return; }
  all.push({id:"cp_"+Date.now(),code,type,value,min,limit,usedCount:0,desc,expiry,active:true,createdAt:new Date().toISOString()});
  CouponDB.save(all);
  ["cpCode","cpValue","cpMin","cpLimit","cpDesc","cpExpiry"].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=""; });
  renderCouponList(); updateCouponCountBadge(); showToast("Kupon eklendi!");
}

function toggleCoupon(id){
  const all=CouponDB.getAll();
  const idx=all.findIndex(c=>c.id===id);
  if(idx>=0){ all[idx].active=!all[idx].active; CouponDB.save(all); renderCouponList(); updateCouponCountBadge(); }
}

function deleteCoupon(id){
  if(!confirm("Bu kuponu silmek istediğinize emin misiniz?")) return;
  CouponDB.save(CouponDB.getAll().filter(c=>c.id!==id));
  renderCouponList(); updateCouponCountBadge(); showToast("Kupon silindi.");
}

function updateCouponCountBadge(){
  const el=document.getElementById("couponCount");
  if(el) el.textContent=CouponDB.getAll().filter(c=>c.active).length;
}

function renderCouponList(){
  const list=document.getElementById("couponList"); if(!list) return;
  const all=CouponDB.getAll();
  const badge=document.getElementById("couponCountBadge");
  if(badge) badge.textContent=all.length+" kupon";
  if(all.length===0){ list.innerHTML=`<div style="padding:24px;text-align:center;color:var(--text3);font-size:13px;">Henüz kupon eklenmedi.</div>`; return; }
  list.innerHTML=all.map(c=>{
    const typeBadge=c.type==="percent"
      ?`<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:6px;background:var(--purple-bg);color:var(--purple);border:1px solid rgba(155,143,224,.2)">%${c.value}</span>`
      :`<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:6px;background:var(--orange-bg);color:var(--orange);border:1px solid rgba(232,152,67,.2)">${c.value}₺</span>`;
    const statusBadge=c.active
      ?`<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:6px;background:var(--green-bg);color:var(--green);border:1px solid rgba(76,175,122,.2)">Aktif</span>`
      :`<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:6px;background:var(--bg4);color:var(--text3);border:var(--border2)">Pasif</span>`;
    const minNote=c.min>0?`<span style="font-size:11px;color:var(--text3)">Min. ${c.min}₺</span>`:"";
    const limitNote=c.limit?`<span style="font-size:11px;color:var(--text3)">Limit: ${c.usedCount||0}/${c.limit}</span>`:`<span style="font-size:11px;color:var(--text3)">Sınırsız</span>`;
    const expiryNote=c.expiry?`<span style="font-size:11px;color:var(--text3)"><i class="fa-regular fa-calendar"></i> ${c.expiry}</span>`:"";
    return `<div style="display:flex;align-items:center;gap:12px;padding:10px 8px;border-bottom:1px solid var(--bg3);border-radius:var(--r-sm);transition:.15s;" onmouseover="this.style.background='var(--bg3)'" onmouseout="this.style.background=''">
      <div style="font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:var(--accent);letter-spacing:1px;min-width:120px;">${c.code}</div>
      <div style="flex:1;display:flex;flex-direction:column;gap:4px;">
        <div style="font-size:12px;color:var(--text2);">${c.desc||""}</div>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">${typeBadge}${statusBadge}${minNote}${limitNote}${expiryNote}</div>
      </div>
      <label class="toggle-switch"><input type="checkbox" ${c.active?"checked":""} onchange="toggleCoupon('${c.id}')"><span class="toggle-slider"></span></label>
      <button class="action-btn del" onclick="deleteCoupon('${c.id}')" title="Sil" style="color:var(--text3)" onmouseover="this.style.color='var(--red)';this.style.background='var(--red-bg)'" onmouseout="this.style.color='var(--text3)';this.style.background='var(--bg3)'"><i class="fa-solid fa-trash" style="font-size:12px"></i></button>
    </div>`;
  }).join("");
}
