/* ═══════════════════════════════════════════════════════
   AURA Coffee & Kitchen — POS System Database & Logic
═══════════════════════════════════════════════════════ */
"use strict";

// GİRİŞ KULLANICILARI VE ŞIFRELERI
const STAFF_ACCOUNTS = {
  "Barista Efe": { pin: "1111", role: "barista" },
  "Barista Ayşe": { pin: "2222", role: "barista" },
  "Kasiyer Selin": { pin: "3333", role: "barista" },
  "Müdür Kerem": { pin: "0000", role: "admin" } // Tüm sekmeleri görme yetkisi
};

// VARSAYILAN MENÜ DATA (Veritabanı boşsa çalışır)
const INITIAL_MENU = {
  "Espresso Bazlı": [
    { id:1,  emoji:"☕", name:"Espresso",       price:65,  desc:"Yoğun, saf espresso" },
    { id:2,  emoji:"🖤", name:"Americano",      price:75,  desc:"Espresso + sıcak su" },
    { id:3,  emoji:"🤍", name:"Cappuccino",     price:95,  desc:"Espresso + köpüklü süt" },
    { id:4,  emoji:"🥛", name:"Latte",          price:100, desc:"Espresso + buharlanmış süt" }
  ],
  "Soğuk Kahve": [
    { id:10, emoji:"🧊", name:"Cold Brew",      price:115, desc:"18 saat demleme, yumuşak" },
    { id:11, emoji:"🥤", name:"Iced Latte",     price:110, desc:"Espresso + soğuk süt + buz" }
  ],
  "Özel Tatlar": [
    { id:17, emoji:"🧡", name:"Caramel Latte",  price:120, desc:"Tatlı karamel soslu latte" }
  ]
};

// VARSAYILAN MASA VERILERI
const INITIAL_TABLES = [
  { id:"M1", num:1, zone:"Salon", status:"free", cart: {} },
  { id:"M2", num:2, zone:"Salon", status:"free", cart: {} },
  { id:"M3", num:3, zone:"Salon", status:"free", cart: {} },
  { id:"M4", num:4, zone:"Salon", status:"free", cart: {} },
  { id:"M5", num:5, zone:"Teras", status:"free", cart: {} },
  { id:"M6", num:6, zone:"Teras", status:"free", cart: {} },
  { id:"M7", num:7, zone:"Teras", status:"free", cart: {} },
  { id:"M8", num:8, zone:"Lounge", status:"free", cart: {} }
];

// LOCAL DATABASE (LocalStorage wrapper)
const DB = {
  getMenu: () => JSON.parse(localStorage.getItem("aura_menu")) || INITIAL_MENU,
  setMenu: (menu) => localStorage.setItem("aura_menu", JSON.stringify(menu)),
  getTables: () => JSON.parse(localStorage.getItem("aura_tables")) || INITIAL_TABLES,
  setTables: (tables) => localStorage.setItem("aura_tables", JSON.stringify(tables)),
  getSales: () => JSON.parse(localStorage.getItem("aura_sales")) || [],
  setSales: (sales) => localStorage.setItem("aura_sales", JSON.stringify(sales))
};

// GLOBAL APP STATE
const state = {
  currentStaff: null,
  activeView: "pos",
  activeTableId: null,
  activeCat: "Espresso Bazlı",
  payMethod: "Kart",
  discount: 0,
  searchQuery: ""
};

// INITIALIZE APP
window.addEventListener("DOMContentLoaded", () => {
  updateClock();
  setInterval(updateClock, 1000);
});

function updateClock() {
  const now = new Date();
  if(document.getElementById("topbarTime")) document.getElementById("topbarTime").textContent = now.toLocaleTimeString("tr-TR", { hour:"2-digit", minute:"2-digit" });
  if(document.getElementById("topbarMeta")) document.getElementById("topbarMeta").textContent = now.toLocaleDateString("tr-TR", { weekday:"long", day:"numeric", month:"long" });
}

// PIN BAŞARILI GİRİŞ SİSTEMİ VE YETKİLENDİRME
function loginWithPin() {
  const selectedName = document.getElementById("staffSelect").value;
  const enteredPin = document.getElementById("staffPin").value;
  const user = STAFF_ACCOUNTS[selectedName];

  if (user && user.pin === enteredPin) {
    state.currentStaff = { name: selectedName, role: user.role };
    
    // UI Güncelleme
    document.getElementById("staffName").textContent = selectedName;
    document.getElementById("staffRole").textContent = user.role === "admin" ? "Müdür / Admin" : "Barista";
    document.getElementById("staffAvatar").textContent = selectedName.charAt(8) || selectedName.charAt(0);
    
    // YETKİLENDİRME GÖRÜNÜRLÜĞÜ (Barista kısıtlama)
    if (user.role === "barista") {
      document.getElementById("nav-reports").style.display = "none";
      document.getElementById("nav-menu").style.display = "none";
    } else {
      document.getElementById("nav-reports").style.display = "flex";
      document.getElementById("nav-menu").style.display = "flex";
    }

    document.getElementById("lockScreen").style.display = "none";
    document.getElementById("app").style.display = "flex";
    document.getElementById("staffPin").value = "";

    // İlk görünümleri yükle
    buildCategoryTabs();
    renderProducts();
    renderTables();
    showToast(`Hoş geldiniz, ${selectedName}`);
  } else {
    alert("Hatalı PIN kodu girdiniz! Lütfen tekrar deneyin.");
    document.getElementById("staffPin").value = "";
  }
}

function lockApp() {
  state.currentStaff = null;
  document.getElementById("lockScreen").style.display = "flex";
  document.getElementById("app").style.display = "none";
}

// GÖRÜNÜM DEĞİŞTİRME
function switchView(viewId, btn) {
  document.querySelectorAll(".view").forEach(v => v.style.display = "none");
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  
  document.getElementById("view-" + viewId).style.display = "flex";
  if (btn) btn.classList.add("active");
  state.activeView = viewId;

  if (viewId === "tables") renderTables();
  if (viewId === "menu-manage") renderMenuManage();
  if (viewId === "reports") renderReports();
}

// KATEGORİ SEKMELERİNİ OLUŞTURMA
function buildCategoryTabs() {
  const menu = DB.getMenu();
  const container = document.getElementById("catTabs");
  container.innerHTML = "";
  
  Object.keys(menu).forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "cat-tab" + (state.activeCat === cat ? " active" : "");
    btn.innerText = cat;
    btn.onclick = () => {
      state.activeCat = cat;
      buildCategoryTabs();
      renderProducts();
    };
    container.appendChild(btn);
  });
}

// SİPARİŞ EKRANINDA ÜRÜNLERİ LİSTELEME
function renderProducts() {
  const grid = document.getElementById("productGrid");
  grid.innerHTML = "";
  const menu = DB.getMenu();
  let products = menu[state.activeCat] || [];

  if (state.searchQuery) {
    products = Object.values(menu).flat().filter(p => p.name.toLowerCase().includes(state.searchQuery.toLowerCase()));
  }

  products.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <div class="card-top-row"><span class="product-emoji">${p.emoji}</span></div>
      <div class="product-name">${p.name}</div>
      <div class="product-desc">${p.desc || ""}</div>
      <div class="card-footer"><span class="product-price">${p.price} TL</span></div>
    `;
    card.onclick = () => addProductToCart(p);
    grid.appendChild(card);
  });
}

function filterProducts(val) {
  state.searchQuery = val;
  renderProducts();
}

// MASALAR SEKMESİ VE MASALARIN ALTINDAKİ AKTİF SİPARİŞLER
function renderTables() {
  const grid = document.getElementById("tablesGrid");
  grid.innerHTML = "";
  const tables = DB.getTables();

  tables.forEach(t => {
    const card = document.createElement("div");
    card.className = "product-card";
    
    // Sipariş kalemlerinin metin haline getirilmesi
    let itemsSummary = "";
    let subTotal = 0;
    Object.values(t.cart).forEach(item => {
      itemsSummary += `<div>• ${item.name} x${item.qty}</div>`;
      subTotal += item.price * item.qty;
    });

    if(subTotal > 0) {
      card.style.borderColor = "var(--accent)";
      t.status = "occupied";
    } else {
      t.status = "free";
    }

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <strong style="font-size:16px; color:var(--text)">Masa ${t.num}</strong>
        <span style="font-size:11px; padding:2px 6px; border-radius:4px; background:${subTotal > 0 ? 'var(--accent-bg)':'#222'}; color:${subTotal > 0 ? 'var(--accent)':'#888'}">
          ${subTotal > 0 ? subTotal + ' TL' : 'Boş'}
        </span>
      </div>
      <div style="font-size:11px; color:var(--text2); min-height:40px; max-height:80px; overflow:hidden;">
        ${itemsSummary || '<span style="color:var(--text3)">Sipariş yok</span>'}
      </div>
    `;
    
    card.onclick = () => {
      state.activeTableId = t.id;
      switchView("pos", document.getElementById("nav-pos"));
      updateCartUI();
    };
    grid.appendChild(card);
  });
}

// ÜRÜNE TIKLAYINCA SEPETE / MASAYA EKLEME YAPMA
function addProductToCart(product) {
  if (!state.activeTableId) {
    alert("Lütfen önce Masalar sekmesinden veya üst menüden bir masa seçiniz!");
    switchView("tables", document.getElementById("nav-tables"));
    return;
  }

  const tables = DB.getTables();
  const table = tables.find(t => t.id === state.activeTableId);

  if (!table.cart[product.id]) {
    table.cart[product.id] = { id: product.id, name: product.name, price: product.price, qty: 1 };
  } else {
    table.cart[product.id].qty += 1;
  }

  table.status = "occupied";
  DB.setTables(tables);
  updateCartUI();
  showToast(`${product.name} Masaya Eklendi`);
}

// ADİSYON PANELİNİ (Masa Sepetini) YENİLEME
function updateCartUI() {
  const container = document.getElementById("cartItems");
  if (!state.activeTableId) {
    document.getElementById("cartTitle").innerText = "Masa Seçilmedi";
    container.innerHTML = '<div class="empty-cart-state">İşlem yapmak için masa seçin.</div>';
    return;
  }

  const tables = DB.getTables();
  const table = tables.find(t => t.id === state.activeTableId);
  document.getElementById("cartTitle").innerText = `Masa ${table.num} Adisyonu`;
  document.getElementById("activeTableLabel").innerText = `Masa ${table.num}`;

  container.innerHTML = "";
  let subTotal = 0;
  let count = 0;

  Object.values(table.cart).forEach(item => {
    count += item.qty;
    subTotal += item.price * item.qty;

    const row = document.createElement("div");
    row.style = "display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #1e1e1e;";
    row.innerHTML = `
      <div>
        <div style="font-weight:500;">${item.name}</div>
        <div style="font-size:11px; color:var(--text3);">${item.price} TL</div>
      </div>
      <div style="display:flex; align-items:center; gap:10px;">
        <button class="search-clear" onclick="changeQty(${item.id}, -1)"><i class="fa-solid fa-minus"></i></button>
        <strong>${item.qty}</strong>
        <button class="search-clear" onclick="changeQty(${item.id}, 1)"><i class="fa-solid fa-plus"></i></button>
      </div>
    `;
    container.appendChild(row);
  });

  if (count === 0) {
    container.innerHTML = '<div class="empty-cart-state">Adisyon boş. Ürün ekleyin.</div>';
  }

  const discountAmount = subTotal * (state.discount / 100);
  const grandTotal = subTotal - discountAmount;

  document.getElementById("cartCount").innerText = `${count} Ürün`;
  document.getElementById("subTotal").innerText = `${subTotal.toFixed(2)} TL`;
  document.getElementById("discountTotal").innerText = `${discountAmount.toFixed(2)} TL (%${state.discount})`;
  document.getElementById("grandTotal").innerText = `${grandTotal.toFixed(2)} TL`;

  // Aktif Ödeme Metodu Stil Güncellemesi
  document.getElementById("pay-Kart").style.borderColor = state.payMethod === "Kart" ? "var(--accent)" : "transparent";
  document.getElementById("pay-Nakit").style.borderColor = state.payMethod === "Nakit" ? "var(--accent)" : "transparent";
}

function changeQty(productId, amount) {
  const tables = DB.getTables();
  const table = tables.find(t => t.id === state.activeTableId);
  
  if (table.cart[productId]) {
    table.cart[productId].qty += amount;
    if (table.cart[productId].qty <= 0) {
      delete table.cart[productId];
    }
  }
  DB.setTables(tables);
  updateCartUI();
}

function setPaymentMethod(method) {
  state.payMethod = method;
  updateCartUI();
}

function applyDiscountPrompt() {
  const rate = prompt("İndirim yüzdesi giriniz (Örn: 10):", state.discount);
  if (rate !== null) {
    state.discount = parseFloat(rate) || 0;
    updateCartUI();
  }
}

// HESAP ALMA / HESABI KAPATMA SİSTEMİ
function checkoutOrder() {
  if (!state.activeTableId) return;
  const tables = DB.getTables();
  const table = tables.find(t => t.id === state.activeTableId);

  let subTotal = 0;
  Object.values(table.cart).forEach(i => subTotal += i.price * i.qty);

  if (subTotal === 0) {
    alert("Boş adisyon kapatılamaz!");
    return;
  }

  const discountAmount = subTotal * (state.discount / 100);
  const finalTotal = subTotal - discountAmount;

  // Satış Kaydı (Raporlar için veritabanına ekleme)
  const sales = DB.getSales();
  sales.push({
    id: Date.now(),
    tableNum: table.num,
    total: finalTotal,
    date: new Date().toISOString(),
    staff: state.currentStaff.name,
    method: state.payMethod,
    items: Object.values(table.cart).map(i => `${i.name} x${i.qty}`)
  });
  DB.setSales(sales);

  // Masayı boşalt ve sıfırla
  table.cart = {};
  table.status = "free";
  DB.setTables(tables);

  state.discount = 0;
  updateCartUI();
  showToast("Hesap başarıyla tahsil edildi ve kapatıldı!");
}

// MENÜ YÖNETİMİ (Ürün Listeleme, Silme)
function renderMenuManage() {
  const grid = document.getElementById("menuManageGrid");
  grid.innerHTML = "";
  const menu = DB.getMenu();

  Object.keys(menu).forEach(cat => {
    menu[cat].forEach(p => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.style.cursor = "default";
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between;">
          <span class="product-emoji">${p.emoji}</span>
          <span class="topbar-meta">${cat}</span>
        </div>
        <div class="product-name" style="margin-top:8px;">${p.name}</div>
        <div class="product-price">${p.price} TL</div>
        <div style="display:flex; gap:8px; margin-top:10px;">
          <button class="modal-btn secondary" style="padding:4px 8px; font-size:11px;" onclick="editProductBtn('${cat}', ${p.id})">Düzenle</button>
          <button class="modal-btn secondary" style="padding:4px 8px; font-size:11px; background:#e0557522; color:var(--red);" onclick="deleteProduct('${cat}', ${p.id})">Sil</button>
        </div>
      `;
      grid.appendChild(card);
    });
  });
}

// ÜRÜN EKLEME / DÜZENLEME MODAL İŞLEMLERİ
function openAddProductModal() {
  document.getElementById("modalTitle").innerText = "Yeni Ürün Ekle";
  document.getElementById("editProductId").value = "";
  document.getElementById("prodEmoji").value = "☕";
  document.getElementById("prodName").value = "";
  document.getElementById("prodPrice").value = "";
  document.getElementById("prodDesc").value = "";
  openModal("addProductModal");
}

function editProductBtn(cat, id) {
  document.getElementById("modalTitle").innerText = "Ürünü Düzenle";
  const menu = DB.getMenu();
  const prod = menu[cat].find(p => p.id === id);
  
  document.getElementById("editProductId").value = `${cat}||${id}`;
  document.getElementById("prodEmoji").value = prod.emoji;
  document.getElementById("prodName").value = prod.name;
  document.getElementById("prodPrice").value = prod.price;
  document.getElementById("prodCategory").value = cat;
  document.getElementById("prodDesc").value = prod.desc || "";
  openModal("addProductModal");
}

function saveProduct() {
  const editIdVal = document.getElementById("editProductId").value;
  const emoji = document.getElementById("prodEmoji").value;
  const name = document.getElementById("prodName").value;
  const price = parseFloat(document.getElementById("prodPrice").value) || 0;
  const cat = document.getElementById("prodCategory").value;
  const desc = document.getElementById("prodDesc").value;

  if (!name || price <= 0) {
    alert("Lütfen geçerli isim ve fiyat giriniz!");
    return;
  }

  const menu = DB.getMenu();

  if (editIdVal) {
    // Düzenleme İşlemi
    const [oldCat, oldId] = editIdVal.split("||");
    // Eski kategoriden çıkar
    menu[oldCat] = menu[oldCat].filter(p => p.id != oldId);
    // Yenisine veya eskiye ekle
    if (!menu[cat]) menu[cat] = [];
    menu[cat].push({ id: parseInt(oldId), emoji, name, price, desc });
  } else {
    // Yeni Ürün Ekleme İşlemi
    if (!menu[cat]) menu[cat] = [];
    const newId = Date.now();
    menu[cat].push({ id: newId, emoji, name, price, desc });
  }

  DB.setMenu(menu);
  closeModal("addProductModal");
  renderMenuManage();
  buildCategoryTabs();
  renderProducts();
  showToast("Ürün Başarıyla Kaydedildi");
}

function deleteProduct(cat, id) {
  if (confirm("Bu ürünü silmek istediğinize emin misiniz?")) {
    const menu = DB.getMenu();
    menu[cat] = menu[cat].filter(p => p.id !== id);
    DB.setMenu(menu);
    renderMenuManage();
    buildCategoryTabs();
    renderProducts();
    showToast("Ürün silindi");
  }
}

// ADMIN GÜNLÜK - HAFTALIK RAPORLARI HESAPLAMA
function renderReports() {
  const sales = DB.getSales();
  let dailyTotal = 0;
  let weeklyTotal = 0;
  
  const oneDay = 24 * 60 * 60 * 1000;
  const now = new Date();

  sales.forEach(s => {
    const saleDate = new Date(s.date);
    const diffTime = Math.abs(now - saleDate);
    
    if (diffTime <= oneDay) dailyTotal += s.total;
    if (diffTime <= (oneDay * 7)) weeklyTotal += s.total;
  });

  document.getElementById("reportDailyRevenue").innerText = `${dailyTotal.toFixed(2)} TL`;
  document.getElementById("reportWeeklyRevenue").innerText = `${weeklyTotal.toFixed(2)} TL`;
  document.getElementById("reportTotalOrders").innerText = sales.length;

  // Geçmiş listesi
  const historyContainer = document.getElementById("reportOrderHistory");
  historyContainer.innerHTML = "";
  
  sales.slice(-5).reverse().forEach(s => {
    const d = new Date(s.date).toLocaleTimeString("tr-TR", {hour: '2-digit', minute:'2-digit'});
    const div = document.createElement("div");
    div.style = "background:var(--bg3); padding:10px; border-radius:8px; display:flex; justify-content:between; align-items:center;";
    div.innerHTML = `
      <div style="flex:1;">
        <strong>Masa ${s.tableNum}</strong> - <span style="color:var(--text3)">${d} (${s.staff})</span>
        <div style="font-size:11px; color:var(--text2)">${s.items.join(", ")}</div>
      </div>
      <strong style="color:var(--accent); text-align:right;">${s.total.toFixed(2)} TL [${s.method}]</strong>
    `;
    historyContainer.appendChild(div);
  });
}

// MODAL YARDIMCILARI
function openModal(id) {
  document.getElementById(id).style.display = "flex";
  setTimeout(() => {
    document.getElementById(id).querySelector(".modal-card").style.transform = "translateY(0)";
  }, 50);
}
function closeModal(id) {
  document.getElementById(id).querySelector(".modal-card").style.transform = "translateY(100px)";
  setTimeout(() => {
    document.getElementById(id).style.display = "none";
  }, 200);
}

// TOAST MESAJ SİSTEMİ
function showToast(msg) {
  const toast = document.getElementById("toast");
  document.getElementById("toastMsg").innerText = msg;
  toast.style.display = "block";
  toast.style.transform = "translateX(-50%) translateY(0)";
  setTimeout(() => {
    toast.style.transform = "translateX(-50%) translateY(100px)";
    setTimeout(() => { toast.style.display = "none"; }, 300);
  }, 2000);
}
