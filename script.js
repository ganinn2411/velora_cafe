/* ═══════════════════════════════════════════════════════
   AURA Coffee & Kitchen — POS Engine & LocalDB Connection
═══════════════════════════════════════════════════════ */
"use strict";

// PERSONEL HESAPLARI VE ROL YETKİLERİ
const STAFF_ACCOUNTS = {
  "Barista Efe": { pin: "1111", role: "barista" },
  "Barista Ayşe": { pin: "2222", role: "barista" },
  "Kasiyer Selin": { pin: "3333", role: "barista" },
  "Müdür Kerem": { pin: "0000", role: "admin" }
};

// SİSTEM İLK AÇILIŞ VARSAYILAN MENÜSÜ
const INITIAL_MENU = {
  "Espresso Bazlı": [
    { id: 1, emoji: "☕", name: "Espresso", price: 65, desc: "Yoğun, saf espresso" },
    { id: 2, emoji: "🖤", name: "Americano", price: 75, desc: "Espresso + sıcak su" },
    { id: 3, emoji: "🤍", name: "Cappuccino", price: 95, desc: "Espresso + köpüklü süt" },
    { id: 4, emoji: "🥛", name: "Latte", price: 100, desc: "Espresso + buharlanmış süt" }
  ],
  "Soğuk Kahve": [
    { id: 10, emoji: "🧊", name: "Cold Brew", price: 115, desc: "18 saat soğuk demleme" },
    { id: 11, emoji: "🥤", name: "Iced Latte", price: 110, desc: "Espresso, soğuk süt ve buz" }
  ],
  "Özel Tatlar": [
    { id: 15, emoji: "🧡", name: "Caramel Macchiato", price: 120, desc: "Karamel soslu katmanlı lezzet" }
  ]
};

// SİSTEM İLK AÇILIŞ VARSAYILAN MASALARI
const INITIAL_TABLES = [
  { id: "M1", num: 1, zone: "Salon", status: "free", cart: {} },
  { id: "M2", num: 2, zone: "Salon", status: "free", cart: {} },
  { id: "M3", num: 3, zone: "Salon", status: "free", cart: {} },
  { id: "M4", num: 4, zone: "Salon", status: "free", cart: {} },
  { id: "M5", num: 5, zone: "Teras", status: "free", cart: {} },
  { id: "M6", num: 6, zone: "Teras", status: "free", cart: {} },
  { id: "M7", num: 7, zone: "Teras", status: "free", cart: {} },
  { id: "M8", num: 8, zone: "Lounge", status: "free", cart: {} }
];

// LOCAL STORAGE VERİTABANI BAĞLANTISI (LOCALDB)
const DB = {
  getMenu: () => JSON.parse(localStorage.getItem("aura_db_menu")) || INITIAL_MENU,
  setMenu: (menu) => localStorage.setItem("aura_db_menu", JSON.stringify(menu)),
  getTables: () => JSON.parse(localStorage.getItem("aura_db_tables")) || INITIAL_TABLES,
  setTables: (tables) => localStorage.setItem("aura_db_tables", JSON.stringify(tables)),
  getSales: () => JSON.parse(localStorage.getItem("aura_db_sales")) || [],
  setSales: (sales) => localStorage.setItem("aura_db_sales", JSON.stringify(sales))
};

// UYGULAMA DURUM YÖNETİCİSİ (STATE)
const state = {
  currentStaff: null,
  activeView: "pos",
  activeTableId: null,
  activeCat: "Espresso Bazlı",
  payMethod: "Kart",
  discount: 0,
  searchQuery: ""
};

// BAŞLANGIÇ AYARLARI
window.addEventListener("DOMContentLoaded", () => {
  updateClock();
  setInterval(updateClock, 1000);
});

function updateClock() {
  const now = new Date();
  if (document.getElementById("topbarTime")) document.getElementById("topbarTime").textContent = now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  if (document.getElementById("topbarMeta")) document.getElementById("topbarMeta").textContent = now.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });
}

// GÜVENLİ GİRİŞ VE ROL KONTROLÜ
function loginWithPin() {
  const selectedName = document.getElementById("staffSelect").value;
  const enteredPin = document.getElementById("staffPin").value;
  const account = STAFF_ACCOUNTS[selectedName];

  if (account && account.pin === enteredPin) {
    state.currentStaff = { name: selectedName, role: account.role };

    // Kullanıcı bilgilerini sol karta yazdır
    document.getElementById("staffName").textContent = selectedName;
    document.getElementById("staffRole").textContent = account.role === "admin" ? "Müdür / Yönetici" : "Barista Personeli";
    document.getElementById("staffAvatar").textContent = selectedName.split(" ")[1] ? selectedName.split(" ")[1].charAt(0) : selectedName.charAt(0);

    // YETKİ KONTROLÜ (Baristalar menü düzenleme ve raporları göremez)
    if (account.role === "barista") {
      document.getElementById("nav-reports").style.display = "none";
      document.getElementById("nav-menu-manage").style.display = "none";
    } else {
      document.getElementById("nav-reports").style.display = "flex";
      document.getElementById("nav-menu-manage").style.display = "flex";
    }

    // Ekranı Aç
    document.getElementById("lockScreen").style.display = "none";
    document.getElementById("app").style.display = "flex";
    document.getElementById("staffPin").value = "";

    // Modülleri Yükle
    buildCategoryTabs();
    renderProducts();
    renderTables();
    showToast(`Giriş Başarılı: ${selectedName}`);
  } else {
    alert("Hatalı PIN Girdiniz! Lütfen tekrar deneyin.");
    document.getElementById("staffPin").value = "";
  }
}

function lockApp() {
  state.currentStaff = null;
  document.getElementById("lockScreen").style.display = "flex";
  document.getElementById("app").style.display = "none";
}

// SAYFA / SEKME DEĞİŞTİRME SİSTEMİ
function switchView(viewId, btnElement) {
  document.querySelectorAll(".view").forEach(v => v.style.display = "none");
  document.querySelectorAll(".sidebar-nav .nav-btn").forEach(b => b.classList.remove("active"));

  document.getElementById("view-" + viewId).style.display = "flex";
  if (btnElement) btnElement.classList.add("active");
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
    btn.className = "category-tab" + (state.activeCat === cat ? " active" : "");
    btn.innerText = cat;
    btn.onclick = () => {
      state.activeCat = cat;
      buildCategoryTabs();
      renderProducts();
    };
    container.appendChild(btn);
  });
}

// SİPARİŞ EKRANINDAKİ ÜRÜN KARTLARI
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
      <div class="product-emoji">${p.emoji}</div>
      <div class="product-info">
        <h3 class="product-name">${p.name}</h3>
        <p class="product-desc">${p.desc || ""}</p>
        <div class="product-price">${p.price} TL</div>
      </div>
    `;
    card.onclick = () => addProductToCart(p);
    grid.appendChild(card);
  });
}

function filterProducts(val) {
  state.searchQuery = val;
  renderProducts();
}

// MASALAR VE ALTLARINDAKİ SİPARİŞ DETAYLARI
function renderTables() {
  const grid = document.getElementById("tablesGrid");
  grid.innerHTML = "";
  const tables = DB.getTables();

  tables.forEach(t => {
    const card = document.createElement("div");
    
    // Masa sipariş özeti çıkarma hesabı
    let ordersListHTML = "";
    let totalAdisyon = 0;
    Object.values(t.cart).forEach(item => {
      ordersListHTML += `<div style="display:flex; justify-content:space-between; margin-bottom:2px;">
        <span>• ${item.name} (x${item.qty})</span>
        <span>${item.price * item.qty} TL</span>
      </div>`;
      totalAdisyon += item.price * item.qty;
    });

    const isOccupied = totalAdisyon > 0;
    card.className = "product-card" + (isOccupied ? " popular" : "");
    if(isOccupied) {
      card.style.borderColor = "var(--accent)";
    }

    card.innerHTML = `
      <div class="product-info" style="width:100%">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--bg4); padding-bottom:8px; margin-bottom:8px;">
          <h3 class="product-name" style="font-size:16px; color:var(--text)">Masa ${t.num} <span style="font-size:11px; color:var(--text3)">(${t.zone})</span></h3>
          <span style="font-size:12px; font-weight:700; color:${isOccupied ? 'var(--accent)' : 'var(--text3)'}">
            ${isOccupied ? totalAdisyon + ' TL' : 'BOŞ'}
          </span>
        </div>
        <div style="font-size:11px; color:var(--text2); min-height:45px; max-height:90px; overflow-y:auto; font-family:'DM Sans'; line-height:1.4;">
          ${ordersListHTML || '<span style="color:var(--text3); dotted">Sipariş Kaydı Bulunmuyor</span>'}
        </div>
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

// ÜRÜNE TIKLANINCA ADİSYONA EKLEME
function addProductToCart(product) {
  if (!state.activeTableId) {
    alert("Lütfen önce Masalar sekmesinden bir masa seçimi yapın!");
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
  showToast(`${product.name} adisyona eklendi.`);
}

// SAĞ TARAF SEPET / ADİSYON GÖRÜNÜMÜNÜ GÜNCELLEME
function updateCartUI() {
  const container = document.getElementById("cartItems");
  if (!state.activeTableId) {
    document.getElementById("cartTitle").innerText = "Masa Seçilmedi";
    document.getElementById("activeTableLabel").innerText = "Masa Seçilmedi";
    container.innerHTML = '<div class="empty-state"><p>İşlem yapmak için masa seçin.</p></div>';
    return;
  }

  const tables = DB.getTables();
  const table = tables.find(t => t.id === state.activeTableId);
  document.getElementById("cartTitle").innerText = `Masa ${table.num} Adisyonu`;
  document.getElementById("activeTableLabel").innerText = `Masa ${table.num}`;

  container.innerHTML = "";
  let subTotal = 0;
  let totalItemsCount = 0;

  Object.values(table.cart).forEach(item => {
    totalItemsCount += item.qty;
    subTotal += item.price * item.qty;

    const div = document.createElement("div");
    div.className = "receipt-item";
    div.innerHTML = `
      <div class="item-meta">
        <span class="item-name">${item.name}</span>
        <span class="item-price">${(item.price * item.qty).toFixed(2)} TL</span>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        <button class="search-clear" style="padding:2px 6px;" onclick="changeQty(${item.id}, -1)"><i class="fa-solid fa-minus" style="font-size:10px;"></i></button>
        <span style="font-weight:600; font-size:14px; min-width:15px; text-align:center;">${item.qty}</span>
        <button class="search-clear" style="padding:2px 6px;" onclick="changeQty(${item.id}, 1)"><i class="fa-solid fa-plus" style="font-size:10px;"></i></button>
      </div>
    `;
    container.appendChild(div);
  });

  if (totalItemsCount === 0) {
    container.innerHTML = '<div class="empty-state"><p>Masa adisyonu şu an boş.</p></div>';
  }

  const discountAmount = subTotal * (state.discount / 100);
  const grandTotal = subTotal - discountAmount;

  document.getElementById("cartCount").innerText = `${totalItemsCount} adet ürün listeleniyor`;
  document.getElementById("subTotal").innerText = `${subTotal.toFixed(2)} TL`;
  document.getElementById("discountTotal").innerText = `${discountAmount.toFixed(2)} TL (%${state.discount})`;
  document.getElementById("grandTotal").innerText = `${grandTotal.toFixed(2)} TL`;

  // Buton aktiflik çerçeveleri
  document.getElementById("pay-Kart").style.borderColor = state.payMethod === "Kart" ? "var(--accent)" : "var(--border2)";
  document.getElementById("pay-Nakit").style.borderColor = state.payMethod === "Nakit" ? "var(--accent)" : "var(--border2)";
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

function clearActiveCart() {
  if (!state.activeTableId) return;
  if (confirm("Bu masanın tüm siparişlerini silmek istediğinize emin misiniz?")) {
    const tables = DB.getTables();
    const table = tables.find(t => t.id === state.activeTableId);
    table.cart = {};
    table.status = "free";
    DB.setTables(tables);
    updateCartUI();
    showToast("Masa adisyonu temizlendi.");
  }
}

function setPaymentMethod(method) {
  state.payMethod = method;
  updateCartUI();
}

function applyDiscountPrompt() {
  const rate = prompt("Uygulanacak indirim yüzdesini girin (Sadece sayı, Örn: 15):", state.discount);
  if (rate !== null) {
    state.discount = parseFloat(rate) || 0;
    updateCartUI();
  }
}

// MÜŞTERİDEN HESAP ALMA / CİROYA KAYDETME
function checkoutOrder() {
  if (!state.activeTableId) return;
  const tables = DB.getTables();
  const table = tables.find(t => t.id === state.activeTableId);

  let subTotal = 0;
  Object.values(table.cart).forEach(i => subTotal += i.price * i.qty);

  if (subTotal === 0) {
    alert("İçerisinde ürün bulunmayan adisyon tahsil edilemez.");
    return;
  }

  const discountAmount = subTotal * (state.discount / 100);
  const finalTotal = subTotal - discountAmount;

  // Satış Detayını Veritabanına Yazma
  const sales = DB.getSales();
  sales.push({
    id: Date.now(),
    tableNum: table.num,
    total: finalTotal,
    date: new Date().toISOString(),
    staff: state.currentStaff.name,
    method: state.payMethod,
    items: Object.values(table.cart).map(i => `${i.name} (x${i.qty})`)
  });
  DB.setSales(sales);

  // Masayı Tamamen Boşalt
  table.cart = {};
  table.status = "free";
  DB.setTables(tables);

  state.discount = 0;
  updateCartUI();
  showToast(`Masa ${table.num} hesabı alındı. Adisyon kapatıldı.`);
}

// MENÜ YÖNETİM PANELİ (LİSTELEME VE SİLME)
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
        <div class="product-emoji">${p.emoji}</div>
        <div class="product-info" style="width:100%;">
          <span style="font-size:10px; text-transform:uppercase; color:var(--accent); letter-spacing:1px;">${cat}</span>
          <h3 class="product-name" style="margin:4px 0;">${p.name}</h3>
          <div class="product-price" style="margin-bottom:12px;">${p.price} TL</div>
          <div style="display:flex; gap:6px;">
            <button class="modal-btn secondary" style="padding:4px 10px; font-size:11px; flex:1; justify-content:center;" onclick="editProductBtn('${cat}', ${p.id})">Düzenle</button>
            <button class="modal-btn secondary" style="padding:4px 10px; font-size:11px; flex:1; justify-content:center; color:var(--red); border-color:#3a1a22" onclick="deleteProduct('${cat}', ${p.id})">Kaldır</button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  });
}

// YENİ ÜRÜN VE DÜZENLEME İŞLEMLERİ
function openAddProductModal() {
  document.getElementById("modalTitle").innerText = "Yeni Menü Ürünü Ekle";
  document.getElementById("editProductId").value = "";
  document.getElementById("prodEmoji").value = "☕";
  document.getElementById("prodName").value = "";
  document.getElementById("prodPrice").value = "";
  document.getElementById("prodDesc").value = "";
  openModal("addProductModal");
}

function editProductBtn(cat, id) {
  document.getElementById("modalTitle").innerText = "Ürün Bilgilerini Düzenle";
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
    alert("Geçerli bir ürün ismi ve satış fiyatı belirtmelisiniz!");
    return;
  }

  const menu = DB.getMenu();

  if (editIdVal) {
    const [oldCat, oldId] = editIdVal.split("||");
    menu[oldCat] = menu[oldCat].filter(p => p.id != oldId);
    if (!menu[cat]) menu[cat] = [];
    menu[cat].push({ id: parseInt(oldId), emoji, name, price, desc });
  } else {
    if (!menu[cat]) menu[cat] = [];
    menu[cat].push({ id: Date.now(), emoji, name, price, desc });
  }

  DB.setMenu(menu);
  closeModal("addProductModal");
  renderMenuManage();
  buildCategoryTabs();
  renderProducts();
  showToast("Menü veritabanı başarıyla güncellendi.");
}

function deleteProduct(cat, id) {
  if (confirm("Bu ürünü menüden kalıcı olarak kaldırmak istediğinize emin misiniz?")) {
    const menu = DB.getMenu();
    menu[cat] = menu[cat].filter(p => p.id !== id);
    DB.setMenu(menu);
    renderMenuManage();
    buildCategoryTabs();
    renderProducts();
    showToast("Ürün menüden kaldırıldı.");
  }
}

// CİRO VE YÖNETİCİ RAPORLARI MODÜLÜ
function renderReports() {
  const sales = DB.getSales();
  let dailyTotal = 0;
  let weeklyTotal = 0;
  
  const birGunMs = 24 * 60 * 60 * 1000
