/* ═══════════════════════════════════════════════════════
   AURA Coffee & Kitchen — POS System Logic
   Kusursuzlaştırılmış & db.js ile Entegre Edilmiş Sürüm
═══════════════════════════════════════════════════════ */

"use strict";

/* ── APP STATE ────────────────────────────────────────── */
const state = {
  currentUser:   null,
  activeView:    "pos",
  activeTable:   null, // Seçili olan tüm masa objesi
  activeCat:     null,
  cart:          {},   // { productId: { product, qty } }
  payMethod:     "Kart",
  discount:      0,
  discountActive:false,
  searchQuery:   "",
  pinInput:      "",   // Girilen PIN haneleri
  selectedUserId:null, // Seçilen personelin ID'si (u1, u2 vb.)
  editingProductId: null,
  reportMode:    "daily",
};

/* ═══════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════ */
window.addEventListener("DOMContentLoaded", () => {
  seedIfEmpty();
  updateClock();
  setInterval(updateClock, 1000);

  // Kalıcı oturum kontrolü
  const savedUser = SessionDB.getUser();
  if (savedUser) {
    loginUser(savedUser, false);
  } else {
    renderLockScreen();
  }
});

function updateClock() {
  const now = new Date();
  document.querySelectorAll(".js-clock").forEach(el => {
    el.textContent = now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  });
  document.querySelectorAll(".js-date").forEach(el => {
    el.textContent = now.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });
  });
}

/* ═══════════════════════════════════════════════════════
   LOCK SCREEN & PIN LOGIN SYSTEM
═══════════════════════════════════════════════════════ */
function renderLockScreen() {
  state.currentUser = null;
  state.pinInput = "";
  SessionDB.clear();

  document.getElementById("app").style.display = "none";
  document.getElementById("lockScreen").style.display = "flex";
  
  document.getElementById("lockStaffSection").style.display = "block";
  document.getElementById("lockPinSection").style.display = "none";

  const staffGrid = document.getElementById("lockStaffGrid");
  if (!staffGrid) return;
  staffGrid.innerHTML = "";

  const users = UserDB.getAll();
  users.forEach(u => {
    const card = document.createElement("div");
    card.className = "staff-card";
    card.innerHTML = `
      <div class="staff-avatar">${u.avatar}</div>
      <div class="staff-name">${u.name}</div>
      <div class="staff-role">${u.role === "admin" ? "Yönetici" : "Barista"}</div>
    `;
    card.onclick = () => selectStaffForPin(u.id);
    staffGrid.appendChild(card);
  });
}

function selectStaffForPin(userId) {
  const u = UserDB.getById(userId);
  if (!u) return;
  state.selectedUserId = userId;
  state.pinInput = "";

  document.getElementById("pinTargetName").textContent = u.name;
  document.getElementById("pinTargetRole").textContent = u.role === "admin" ? "Yönetici Girişi" : "Barista Girişi";
  
  document.getElementById("lockStaffSection").style.display = "none";
  document.getElementById("lockPinSection").style.display = "flex";
  updatePinDots();
}

function backToStaffSelect() {
  document.getElementById("lockStaffSection").style.display = "block";
  document.getElementById("lockPinSection").style.display = "none";
}

function pressPin(num) {
  if (state.pinInput.length < 4) {
    state.pinInput += num;
    updatePinDots();
  }
  if (state.pinInput.length === 4) {
    setTimeout(verifyPin, 150);
  }
}

function clearPin() {
  state.pinInput = "";
  updatePinDots();
}

function updatePinDots() {
  const dots = document.querySelectorAll(".pin-dot");
  dots.forEach((dot, idx) => {
    if (idx < state.pinInput.length) {
      dot.classList.add("active");
    } else {
      dot.classList.remove("active");
    }
  });
}

function verifyPin() {
  const u = UserDB.getById(state.selectedUserId);
  if (u && u.pin === state.pinInput) {
    loginUser(u, true);
  } else {
    showToast("Hatalı PIN Kodu! Lütfen tekrar deneyin.");
    clearPin();
  }
}

function loginUser(user, saveSession) {
  state.currentUser = user;
  if (saveSession) SessionDB.setUser(user);

  // Rol Yetkilendirmesi (Görünüm Filtreleme)
  const navReports = document.getElementById("nav-reports");
  const navMenu = document.getElementById("nav-menu");
  
  if (user.role === "admin") {
    if (navReports) navReports.style.display = "flex";
    if (navMenu) navMenu.style.display = "flex";
  } else {
    if (navReports) navReports.style.display = "none";
    if (navMenu) navMenu.style.display = "none";
  }

  // Profil Kartını Güncelle
  const avatarEl = document.querySelector(".staff-pill-avatar");
  const nameEl = document.querySelector(".staff-pill-name");
  const roleEl = document.querySelector(".staff-pill-role");
  
  if (avatarEl) avatarEl.textContent = user.avatar;
  if (nameEl) nameEl.textContent = user.name;
  if (roleEl) roleEl.textContent = user.role === "admin" ? "Müdür" : "Barista";

  document.getElementById("lockScreen").style.display = "none";
  document.getElementById("app").style.display = "flex";

  // İlk Görünümü Yükle
  initPOSView();
  switchView("pos");
  showToast(`Hoş geldiniz, ${user.name}`);
}

function logout() {
  renderLockScreen();
}

/* ═══════════════════════════════════════════════════════
   VIEW MANAGEMENT (SEKME DEĞİŞTİRME)
═══════════════════════════════════════════════════════ */
function switchView(viewId) {
  state.activeView = viewId;
  document.querySelectorAll(".view").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(el => el.classList.remove("active"));

  const targetView = document.getElementById(`view-${viewId}`);
  const targetBtn = document.getElementById(`nav-${viewId}`);
  
  if (targetView) targetView.classList.add("active");
  if (targetBtn) targetBtn.classList.add("active");

  if (viewId === "pos") initPOSView();
  if (viewId === "tables") renderTablesView();
  if (viewId === "reports") renderReportsView();
  if (viewId === "menu") renderMenuManageView();
}

/* ═══════════════════════════════════════════════════════
   POS VIEW (SİPARİŞ ALMA SİSTEMİ)
═══════════════════════════════════════════════════════ */
function initPOSView() {
  const categories = MenuDB.getCategories();
  if (!state.activeCat && categories.length > 0) {
    state.activeCat = categories[0];
  }
  renderCategoryTabs();
  renderProductsGrid();
  renderCart();
}

function renderCategoryTabs() {
  const container = document.getElementById("categoryTabs");
  if (!container) return;
  container.innerHTML = "";

  const categories = MenuDB.getCategories();
  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = `category-tab ${state.activeCat === cat ? "active" : ""}`;
    btn.textContent = cat;
    btn.onclick = () => {
      state.activeCat = cat;
      renderCategoryTabs();
      renderProductsGrid();
    };
    container.appendChild(btn);
  });
}

function renderProductsGrid() {
  const grid = document.getElementById("productsGrid");
  if (!grid) return;
  grid.innerHTML = "";

  let items = MenuDB.getByCategory(state.activeCat);
  if (state.searchQuery) {
    items = MenuDB.getAll().filter(p => p.name.toLowerCase().includes(state.searchQuery.toLowerCase()));
  }

  if (items.length === 0) {
    grid.innerHTML = `<div class="empty-state"><p>Bu kategoride ürün bulunamadı.</p></div>`;
    return;
  }

  items.forEach(p => {
    const card = document.createElement("div");
    card.className = `product-card ${p.popular ? "popular" : ""}`;
    card.innerHTML = `
      ${p.popular ? '<div class="product-badge">Popüler</div>' : ''}
      <div class="product-emoji">${p.emoji || "☕"}</div>
      <div class="product-info">
        <h3 class="product-name">${p.name}</h3>
        <p class="product-desc">${p.desc || ""}</p>
        <div class="card-footer">
          <span class="product-price">${p.price} ₺</span>
        </div>
      </div>
    `;
    card.onclick = () => handleProductClick(p);
    grid.appendChild(card);
  });
}

function handleProductClick(product) {
  if (!state.activeTable) {
    showToast("Lütfen önce Masalar sekmesinden bir masa seçin!");
    switchView("tables");
    return;
  }
  addToCart(product);
}

function addToCart(product) {
  if (state.cart[product.id]) {
    state.cart[product.id].qty += 1;
  } else {
    state.cart[product.id] = { product, qty: 1 };
  }
  saveCurrentCartToOrder();
  renderCart();
}

function changeCartQty(productId, delta) {
  if (state.cart[productId]) {
    state.cart[productId].qty += delta;
    if (state.cart[productId].qty <= 0) {
      delete state.cart[productId];
    }
    saveCurrentCartToOrder();
    renderCart();
  }
}

function saveCurrentCartToOrder() {
  if (!state.activeTable) return;
  const itemsArray = Object.values(state.cart).map(item => ({
    productId: item.product.id,
    name: item.product.name,
    price: item.product.price,
    qty: item.qty
  }));

  if (itemsArray.length === 0) {
    // Sepet boşaldıysa siparişi iptal et/sil masayı boşalt
    if (state.activeTable.activeOrderId) {
      const allOrders = OrderDB.getAll().filter(o => o.id !== state.activeTable.activeOrderId);
      OrderDB.save(allOrders);
      TableDB.update(state.activeTable.id, { status: "free", activeOrderId: null });
      state.activeTable.activeOrderId = null;
      state.activeTable.status = "free";
    }
    return;
  }

  if (state.activeTable.activeOrderId) {
    // Var olan adisyonu güncelle
    OrderDB.update(state.activeTable.activeOrderId, { items: itemsArray });
  } else {
    // Yeni adisyon aç
    const newOrderId = "o_" + Date.now();
    const newOrder = {
      id: newOrderId,
      tableId: state.activeTable.id,
      tableName: `Masa ${state.activeTable.num}`,
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      items: itemsArray,
      status: "pending",
      discount: 0,
      total: 0,
      createdAt: new Date().toISOString()
    };
    OrderDB.add(newOrder);
    TableDB.update(state.activeTable.id, { status: "occupied", activeOrderId: newOrderId });
    state.activeTable.activeOrderId = newOrderId;
    state.activeTable.status = "occupied";
  }
}

function renderCart() {
  const container = document.getElementById("receiptItems");
  if (!container) return;
  container.innerHTML = "";

  if (!state.activeTable) {
    document.getElementById("activeTableLabel").textContent = "Masa Seçilmedi";
    document.getElementById("receiptTitle").textContent = "Masa Seçilmedi";
    document.getElementById("receiptSubtitle").textContent = "Adisyon açmak için masa seçin";
    container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-chair" style="font-size:24px;color:var(--text3)"></i><p>Aktif masa seçimi bulunmuyor.</p></div>`;
    updateTotals(0);
    return;
  }

  document.getElementById("activeTableLabel").textContent = `Masa ${state.activeTable.num}`;
  document.getElementById("receiptTitle").textContent = `Masa ${state.activeTable.num}`;
  
  const items = Object.values(state.cart);
  if (items.length === 0) {
    document.getElementById("receiptSubtitle").textContent = "Adisyon boş";
    container.innerHTML = `<div class="empty-state"><p>Sipariş almak için sol taraftan ürünlere dokunun.</p></div>`;
    updateTotals(0);
    return;
  }

  let totalQty = 0;
  let subTotal = 0;

  items.forEach(item => {
    totalQty += item.qty;
    subTotal += item.product.price * item.qty;

    const row = document.createElement("div");
    row.className = "receipt-item";
    row.innerHTML = `
      <div class="item-meta">
        <span class="item-name">${item.product.name}</span>
        <span class="item-price">${(item.product.price * item.qty)} ₺</span>
      </div>
      <div style="display:flex; align-items:center; gap:10px;">
        <button class="search-clear" style="padding:4px 8px;" onclick="changeCartQty(${item.product.id}, -1)"><i class="fa-solid fa-minus" style="font-size:10px"></i></button>
        <span style="font-weight:600; min-width:16px; text-align:center">${item.qty}</span>
        <button class="search-clear" style="padding:4px 8px;" onclick="changeCartQty(${item.product.id}, 1)"><i class="fa-solid fa-plus" style="font-size:10px bag:"></i></button>
      </div>
    `;
    container.appendChild(row);
  });

  document.getElementById("receiptSubtitle").textContent = `${totalQty} Ürün adisyonda`;
  updateTotals(subTotal);
}

function updateTotals(subTotal) {
  const discPercent = state.discountActive ? state.discount : 0;
  const discAmount = subTotal * (discPercent / 100);
  const grandTotal = subTotal - discAmount;

  document.getElementById("subTotal").textContent = `${subTotal.toFixed(2)} ₺`;
  document.getElementById("discountTotal").textContent = `${discAmount.toFixed(2)} ₺ (%${discPercent})`;
  document.getElementById("grandTotal").textContent = `${grandTotal.toFixed(2)} ₺`;

  // Ödeme buton tasarımları kontrolü
  document.getElementById("payKart")?.classList.toggle("accent", state.payMethod === "Kart");
  document.getElementById("payKart")?.classList.toggle("secondary", state.payMethod !== "Kart");
  document.getElementById("payNakit")?.classList.toggle("accent", state.payMethod === "Nakit");
  document.getElementById("payNakit")?.classList.toggle("secondary", state.payMethod !== "Nakit");
}

function setPayMethod(method) {
  state.payMethod = method;
  renderCart();
}

function toggleDiscount() {
  if (state.discountActive) {
    state.discountActive = false;
    state.discount = 0;
    renderCart();
  } else {
    const val = prompt("İndirim yüzdesini giriniz (Örn: 10, 20):", "10");
    const num = parseInt(val);
    if (!isNaN(num) && num > 0 && num <= 100) {
      state.discount = num;
      state.discountActive = true;
      renderCart();
    }
  }
}

function clearCart() {
  if (!state.activeTable || Object.keys(state.cart).length === 0) return;
  if (confirm("Bu adisyondaki tüm ürünleri silmek istediğinize emin misiniz?")) {
    state.cart = {};
    saveCurrentCartToOrder();
    renderCart();
    showToast("Adisyon temizlendi.");
  }
}

// MÜŞTERİDEN HESAP ALMA (HESAP KAPATMA)
function checkoutOrder() {
  if (!state.activeTable || Object.keys(state.cart).length === 0) {
    showToast("Kapatılacak aktif bir adisyon bulunmuyor.");
    return;
  }

  const orderId = state.activeTable.activeOrderId;
  if (!orderId) return;

  const order = OrderDB.getById(orderId);
  let subTotal = 0;
  order.items.forEach(i => subTotal += (i.price * i.qty));
  
  const discPercent = state.discountActive ? state.discount : 0;
  const discAmount = subTotal * (discPercent / 100);
  const finalTotal = subTotal - discAmount;

  // Adisyonu tamamlandı olarak kapat
  OrderDB.update(orderId, {
    status: "completed",
    discount: discPercent,
    total: finalTotal,
    payMethod: state.payMethod,
    closedAt: new Date().toISOString()
  });

  // Masayı boşa çıkart
  TableDB.update(state.activeTable.id, { status: "free", activeOrderId: null });
  
  state.cart = {};
  state.activeTable = null;
  state.discount = 0;
  state.discountActive = false;
  
  renderCart();
  showToast("Hesap tahsil edildi, masa kapatıldı.");
}

function filterProducts(query) {
  state.searchQuery = query;
  renderProductsGrid();
}

/* ═══════════════════════════════════════════════════════
   TABLES VIEW (MASALAR VE ANLIK SİPARİŞ ÖZETLERİ)
═══════════════════════════════════════════════════════ */
function renderTablesView() {
  const container = document.getElementById("tablesGrid");
  if (!container) return;
  container.innerHTML = "";

  const tables = TableDB.getAll();
  tables.forEach(t => {
    const card = document.createElement("div");
    
    // Masa doluluk durumu rengi ve sipariş özeti derleme
    let itemsSummaryHTML = "";
    let orderTotal = 0;

    if (t.activeOrderId) {
      const order = OrderDB.getById(t.activeOrderId);
      if (order && order.items) {
        order.items.forEach(item => {
          itemsSummaryHTML += `<div style="display:flex;justify-content:space-between;color:var(--text2);font-size:12px;margin-bottom:2px;">
            <span>• ${item.name} x${item.qty}</span>
            <span>${item.price * item.qty} ₺</span>
          </div>`;
          orderTotal += item.price * item.qty;
        });
      }
    }

    const isOccupied = t.status === "occupied";
    card.className = `product-card ${isOccupied ? "popular" : ""}`;
    if (isOccupied) card.style.borderColor = "var(--accent)";

    card.innerHTML = `
      <div class="product-info" style="width:100%">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--bg4);padding-bottom:6px;margin-bottom:8px;">
          <h3 class="product-name" style="font-size:16px;">Masa ${t.num} <span style="font-size:11px;color:var(--text3)">(${t.zone})</span></h3>
          <span style="font-size:12px;font-weight:700;color:${isOccupied ? 'var(--accent)' : 'var(--text3)'}">
            ${isOccupied ? orderTotal + ' ₺' : 'BOŞ'}
          </span>
        </div>
        <div style="min-height:50px;max-height:90px;overflow-y:auto;line-height:1.4;">
          ${itemsSummaryHTML || '<span style="color:var(--text3);font-size:12px;font-style:italic">Masa boş, adisyon yok.</span>'}
        </div>
      </div>
    `;

    card.onclick = () => {
      state.activeTable = t;
      state.cart = {};
      
      // Eğer masada önceden sipariş varsa sepet hafızasına yükle
      if (t.activeOrderId) {
        const order = OrderDB.getById(t.activeOrderId);
        if (order && order.items) {
          order.items.forEach(item => {
            const rawProd = MenuDB.getAll().find(p => p.id === item.productId) || { id: item.productId, name: item.name, price: item.price };
            state.cart[item.productId] = { product: rawProd, qty: item.qty };
          });
        }
      }
      switchView("pos");
    };

    container.appendChild(card);
  });
}

/* ═══════════════════════════════════════════════════════
   MENU MANAGEMENT VIEW (ÜRÜN EKLEME / DÜZENLEME)
═══════════════════════════════════════════════════════ */
function renderMenuManageView() {
  const grid = document.getElementById("menuManageGrid");
  if (!grid) return;
  grid.innerHTML = "";

  const items = MenuDB.getAll();
  items.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.style.cursor = "default";
    card.innerHTML = `
      <div class="product-emoji">${p.emoji || "☕"}</div>
      <div class="product-info" style="width:100%">
        <span style="font-size:10px;color:var(--accent);text-transform:uppercase;">${p.category}</span>
        <h3 class="product-name" style="margin:2px 0 6px 0;">${p.name}</h3>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span class="product-price">${p.price} ₺</span>
          <div style="display:flex;gap:6px;">
            <button class="modal-btn secondary" style="padding:4px 10px;font-size:11px;" onclick="openEditProductModal(${p.id})">Düzenle</button>
            <button class="modal-btn secondary" style="padding:4px 10px;font-size:11px;color:var(--red);border-color:rgba(224,85,117,0.2)" onclick="deleteProduct(${p.id})">Sil</button>
          </div>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function openAddProductModal() {
  state.editingProductId = null;
  document.getElementById("modalTitle").textContent = "Yeni Ürün Ekle";
  document.getElementById("saveProductBtn").innerHTML = '<i class="fa-solid fa-plus"></i> Ürün Ekle';

  document.getElementById("newEmoji").value = "☕";
  document.getElementById("newName").value = "";
  document.getElementById("newPrice").value = "";
  document.getElementById("newDesc").value = "";
  document.getElementById("newPopular").checked = false;

  // Kategorileri yükle
  const select = document.getElementById("newCategory");
  select.innerHTML = "";
  ["Espresso Bazlı", "Soğuk Kahve", "Özel Tatlar", "Çay & Alternatif", "Atıştırmalık", "Serinletici"].forEach(c => {
    select.innerHTML += `<option>${c}</option>`;
  });

  openModal("addProductModal");
}

function openEditProductModal(productId) {
  const p = MenuDB.getAll().find(item => item.id === productId);
  if (!p) return;

  state.editingProductId = productId;
  document.getElementById("modalTitle").textContent = "Ürünü Düzenle";
  document.getElementById("saveProductBtn").innerHTML = '<i class="fa-solid fa-check"></i> Güncelle';

  document.getElementById("newEmoji").value = p.emoji || "☕";
  document.getElementById("newName").value = p.name;
  document.getElementById("newPrice").value = p.price;
  document.getElementById("newDesc").value = p.desc || "";
  document.getElementById("newPopular").checked = !!p.popular;

  const select = document.getElementById("newCategory");
  select.innerHTML = "";
  ["Espresso Bazlı", "Soğuk Kahve", "Özel Tatlar", "Çay & Alternatif", "Atıştırmalık", "Serinletici"].forEach(c => {
    const selected = p.category === c ? "selected" : "";
    select.innerHTML += `<option ${selected}>${c}</option>`;
  });

  openModal("addProductModal");
}

function saveProduct() {
  const emoji = document.getElementById("newEmoji").value || "☕";
  const name = document.getElementById("newName").value.trim();
  const price = parseFloat(document.getElementById("newPrice").value);
  const category = document.getElementById("newCategory").value;
  const desc = document.getElementById("newDesc").value.trim();
  const popular = document.getElementById("newPopular").checked;

  if (!name || isNaN(price) || price < 0) {
    alert("Lütfen ürün ismi ve geçerli bir fiyat giriniz!");
    return;
  }

  const allMenu = MenuDB.getAll();

  if (state.editingProductId) {
    // Düzenleme güncellemesi
    const idx = allMenu.findIndex(m => m.id === state.editingProductId);
    if (idx >= 0) {
      allMenu[idx] = { id: state.editingProductId, emoji, name, price, category, desc, popular };
      showToast("Ürün başarıyla güncellendi.");
    }
  } else {
    // Sıfırdan yeni ürün ekleme
    const newProd = { id: Date.now(), emoji, name, price, category, desc, popular };
    allMenu.push(newProd);
    showToast("Yeni ürün menüye eklendi.");
  }

  MenuDB.save(allMenu);
  closeModal("addProductModal");
  renderMenuManageView();
  initPOSView();
}

function deleteProduct(productId) {
  if (confirm("Bu ürünü menüden tamamen silmek istediğinize emin misiniz?")) {
    const filtered = MenuDB.getAll().filter(p => p.id !== productId);
    MenuDB.save(filtered);
    renderMenuManageView();
    initPOSView();
    showToast("Ürün menüden kaldırıldı.");
  }
}

/* ═══════════════════════════════════════════════════════
   REPORTS VIEW (ADMIN GÜNLÜK VE HAFTALIK HASILAT)
═══════════════════════════════════════════════════════ */
function setReportMode(mode) {
  state.reportMode = mode;
  renderReportsView();
}

function renderReportsView() {
  document.getElementById("btnReportDaily")?.classList.toggle("accent", state.reportMode === "daily");
  document.getElementById("btnReportDaily")?.classList.toggle("secondary", state.reportMode !== "daily");
  document.getElementById("btnReportWeekly")?.classList.toggle("accent", state.reportMode === "weekly");
  document.getElementById("btnReportWeekly")?.classList.toggle("secondary", state.reportMode !== "weekly");

  const completedOrders = OrderDB.getAll().filter(o => o.status === "completed");
  let filteredOrders = [];

  const now = new Date();
  if (state.reportMode === "daily") {
    // Son 24 Saat
    const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    filteredOrders = completedOrders.filter(o => new Date(o.closedAt) >= oneDayAgo);
    document.getElementById("reportTitleLabel").textContent = "Bugünkü Toplam Ciro";
  } else {
    // Son 7 Gün
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    filteredOrders = completedOrders.filter(o => new Date(o.closedAt) >= sevenDaysAgo);
    document.getElementById("reportTitleLabel").textContent = "Bu Haftaki Toplam Ciro";
  }

  let totalRevenue = 0;
  let totalItemsSold = 0;

  filteredOrders.forEach(o => {
    totalRevenue += o.total;
    o.items.forEach(i => totalItemsSold += i.qty);
  });

  document.getElementById("statRevenue").textContent = `${totalRevenue.toFixed(2)} ₺`;
  document.getElementById("statOrderCount").textContent = filteredOrders.length;
  document.getElementById("statItemCount").textContent = totalItemsSold;

  // Satış Geçmiş Listesi
  const list = document.getElementById("reportOrderList");
  if (!list) return;
  list.innerHTML = "";

  if (filteredOrders.length === 0) {
    list.innerHTML = `<div class="empty-state" style="padding:20px 0;"><p>Seçilen periyotta tamamlanmış satış bulunmuyor.</p></div>`;
    return;
  }

  filteredOrders.slice(-10).reverse().forEach(o => {
    const timeStr = new Date(o.closedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    const itemsStr = o.items.map(i => `${i.name} (x${i.qty})`).join(", ");

    const row = document.createElement("div");
    row.style = "background:var(--bg2); border:1px solid var(--bg4); padding:12px; border-radius:var(--r); display:flex; justify-content:space-between; align-items:center; font-family:'DM Sans'; margin-bottom:8px;";
    row.innerHTML = `
      <div>
        <span style="font-weight:700;color:var(--text);">${o.tableName}</span>
        <span style="font-size:12px;color:var(--text3);margin-left:8px;">${timeStr} — Kasa: ${o.userName}</span>
        <div style="font-size:12px;color:var(--text2);margin-top:2px;">${itemsStr}</div>
      </div>
      <div style="text-align:right;">
        <strong style="color:var(--accent);">${o.total.toFixed(2)} ₺</strong>
        <div style="font-size:10px;color:var(--text3); text-transform:uppercase;">${o.payMethod}</div>
      </div>
    `;
    list.appendChild(row);
  });
}

/* ═══════════════════════════════════════════════════════
   MODAL ENGINE & WINDOW CONTROLS
═══════════════════════════════════════════════════════ */
function openModal(id) {
  document.getElementById(id)?.classList.add("open");
}
function closeModal(id) {
  document.getElementById(id)?.classList.remove("open");
}

document.addEventListener("click", e => {
  if (e.target.classList.contains("modal-overlay")) {
    e.target.classList.remove("open");
  }
});

/* ═══════════════════════════════════════════════════════
   TOAST NOTIFICATION SYSTEM
═══════════════════════════════════════════════════════ */
let toastTimer = null;
function showToast(msg) {
  const toast  = document.getElementById("toast");
  const toastMsg = document.getElementById("toastMsg");
  if (!toast || !toastMsg) return;
  toastMsg.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal-overlay.open").forEach(m => m.classList.remove("open"));
  }
});
