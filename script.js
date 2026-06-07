/* ═══════════════════════════════════════════════════════
   AURA Coffee & Kitchen — SCRIPT.JS
   Firebase Senkronizasyonlu & Dinamik Hesaplamalı
═══════════════════════════════════════════════════════ */

"use strict";

const state = {
  currentUser:   null,
  activeView:    "pos",
  activeTable:   null,
  activeCat:     null,
  cart:          {},
  payMethod:     "Kart",
  discount:      0,
  discountActive:false,
  searchQuery:   "",
  pinInput:      "",
  selectedUserId:null,
  editingProductId: null,
  reportMode:    "daily",
};

window.addEventListener("DOMContentLoaded", () => {
  const lockStaffGrid = document.getElementById("lockStaffGrid");
  document.getElementById("lockStaffSection").style.display = "block";
  document.getElementById("lockPinSection").style.display = "none";
  if(lockStaffGrid) {
    lockStaffGrid.innerHTML = `<h3 style="color:var(--accent); text-align:center; padding:30px; width: 100%;">Sunucuya Bağlanılıyor...<br><span style="font-size:12px; color:var(--text3);">Veriler Eşitleniyor, Lütfen Bekleyin</span></h3>`;
  }

  if(typeof startFirebaseSync === "function") {
    startFirebaseSync(() => {
      updateClock();
      setInterval(updateClock, 1000);

      const savedUser = SessionDB.getUser();
      if (savedUser) {
        loginUser(savedUser, false);
      } else {
        renderLockScreen();
      }
    });
  }
});

window.refreshUI = function() {
  if (state.activeView === "pos") {
      if (state.activeTable) {
         const t = TableDB.getById(state.activeTable.id);
         if (t && t.activeOrderId) {
            const order = OrderDB.getById(t.activeOrderId);
            if (order) {
               state.cart = {};
               order.items.forEach(item => { 
                 state.cart[item.productId] = { product: { id: item.productId, name: item.name, price: item.price }, qty: item.qty }; 
               });
            } else { state.cart = {}; }
         } else { state.cart = {}; }
      }
      renderCart();
  }
  if (state.activeView === "tables") renderTablesView();
  if (state.activeView === "reports") renderReportsView();
  if (state.activeView === "settings") renderSettingsView();
  if (state.activeView === "menu") renderMenuManageView();
};

function updateClock() {
  const now = new Date();
  document.querySelectorAll(".js-clock").forEach(el => el.textContent = now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }));
  document.querySelectorAll(".js-date").forEach(el => el.textContent = now.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" }));
}

function renderLockScreen() {
  state.currentUser = null;
  state.pinInput = "";
  SessionDB.clear();

  document.getElementById("app").style.display = "none";
  document.getElementById("lockScreen").style.display = "flex";
  document.getElementById("lockStaffSection").style.display = "block";
  document.getElementById("lockPinSection").style.display = "none";

  const staffGrid = document.getElementById("lockStaffGrid");
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
    if (idx < state.pinInput.length) dot.classList.add("active");
    else dot.classList.remove("active");
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

  const navReports = document.getElementById("nav-reports");
  const navMenu = document.getElementById("nav-menu");
  const navSettings = document.getElementById("nav-settings");
  
  if (user.role === "admin") {
    if (navReports) navReports.style.display = "flex";
    if (navMenu) navMenu.style.display = "flex";
    if (navSettings) navSettings.style.display = "flex";
  } else {
    if (navReports) navReports.style.display = "none";
    if (navMenu) navMenu.style.display = "none";
    if (navSettings) navSettings.style.display = "none";
  }

  const avatarEl = document.querySelector(".staff-pill-avatar");
  const nameEl = document.querySelector(".staff-pill-name");
  if (avatarEl) avatarEl.textContent = user.avatar;
  if (nameEl) nameEl.textContent = user.name;

  document.getElementById("lockScreen").style.display = "none";
  document.getElementById("app").style.display = "flex";

  initPOSView();
  switchView("pos");
  showToast(`Hoş geldiniz, ${user.name}`);
}

function logout() { renderLockScreen(); }

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
  if (viewId === "settings") renderSettingsView();
}

function initPOSView() {
  const categories = MenuDB.getCategories();
  if (!state.activeCat && categories.length > 0) state.activeCat = categories[0];
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
    btn.onclick = () => { state.activeCat = cat; renderCategoryTabs(); renderProductsGrid(); };
    container.appendChild(btn);
  });
}

function renderProductsGrid() {
  const grid = document.getElementById("productsGrid");
  if (!grid) return;
  grid.innerHTML = "";

  let items = MenuDB.getByCategory(state.activeCat);
  if (state.searchQuery) items = MenuDB.getAll().filter(p => p.name.toLowerCase().includes(state.searchQuery.toLowerCase()));

  items.forEach(p => {
    const card = document.createElement("div");
    card.className = `product-card ${p.popular ? "popular" : ""}`;
    card.innerHTML = `
      <div class="product-emoji">${p.emoji || "☕"}</div>
      <div class="product-info">
        <h3 class="product-name">${p.name}</h3>
        <span class="product-price">${p.price} ₺</span>
      </div>
    `;
    card.onclick = () => handleProductClick(p);
    grid.appendChild(card);
  });
}

function handleProductClick(product) {
  if (!state.activeTable) { showToast("Lütfen önce bir masa seçin!"); switchView("tables"); return; }
  addToCart(product);
}

function addToCart(product) {
  if (state.cart[product.id]) state.cart[product.id].qty += 1;
  else state.cart[product.id] = { product, qty: 1 };
  saveCurrentCartToOrder();
  renderCart();
}

function changeCartQty(productId, delta) {
  if (state.cart[productId]) {
    state.cart[productId].qty += delta;
    if (state.cart[productId].qty <= 0) delete state.cart[productId];
    saveCurrentCartToOrder();
    renderCart();
  }
}

function saveCurrentCartToOrder() {
  if (!state.activeTable) return;
  const itemsArray = Object.values(state.cart).map(item => ({
    productId: item.product.id, name: item.product.name, price: item.product.price, qty: item.qty
  }));

  if (itemsArray.length === 0) {
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
    OrderDB.update(state.activeTable.activeOrderId, { items: itemsArray });
  } else {
    const newOrderId = "o_" + Date.now();
    const newOrder = {
      id: newOrderId, tableId: state.activeTable.id, tableName: `Masa ${state.activeTable.num}`,
      userId: state.currentUser.id, userName: state.currentUser.name, items: itemsArray,
      status: "pending", discount: 0, total: 0, createdAt: new Date().toISOString()
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
    updateTotals(0);
    return;
  }

  document.getElementById("activeTableLabel").textContent = `Masa ${state.activeTable.num}`;
  document.getElementById("receiptTitle").textContent = `Masa ${state.activeTable.num}`;
  
  const items = Object.values(state.cart);
  if (items.length === 0) {
    container.innerHTML = `<div class="empty-state" style="padding:40px 20px; text-align:center; color:var(--text3);"><i class="fa-solid fa-basket-shopping" style="font-size:32px; margin-bottom:12px;"></i><p>Adisyon boş.</p></div>`;
    updateTotals(0);
    return;
  }

  let subTotal = 0;
  items.forEach(item => {
    subTotal += item.product.price * item.qty;
    const row = document.createElement("div");
    row.className = "receipt-item";
    row.innerHTML = `
      <div class="item-meta">
        <span class="item-name">${item.product.name}</span>
        <span class="item-price">${item.product.price * item.qty} ₺</span>
      </div>
      <div style="display:flex; gap:8px; align-items:center;">
        <button class="search-clear" style="width:24px; height:24px; border-radius:4px; border:1px solid #333; color:#fff; background:none; cursor:pointer;" onclick="changeCartQty(${item.product.id}, -1)">-</button>
        <span style="min-width:15px; text-align:center; font-weight:600;">${item.qty}</span>
        <button class="search-clear" style="width:24px; height:24px; border-radius:4px; border:1px solid #333; color:#fff; background:none; cursor:pointer;" onclick="changeCartQty(${item.product.id}, 1)">+</button>
      </div>
    `;
    container.appendChild(row);
  });

  updateTotals(subTotal);
}

function updateTotals(subTotal) {
  const sysSettings = typeof SettingsDB !== "undefined" ? SettingsDB.get() : { kdv: 0, service: 0 };
  const discPercent = state.discountActive ? state.discount : 0;
  const discAmount = subTotal * (discPercent / 100);
  const totalAfterDiscount = subTotal - discAmount;

  // Ayarlardan gelen KDV ve Servis Ücretinin dinamik hesaplanması
  const kdvAmount = totalAfterDiscount * (sysSettings.kdv / 100);
  const serviceAmount = totalAfterDiscount * (sysSettings.service / 100);
  const grandTotal = totalAfterDiscount + kdvAmount + serviceAmount;

  if (document.getElementById("subTotal")) document.getElementById("subTotal").textContent = `${subTotal.toFixed(2)} ₺`;
  if (document.getElementById("discountTotal")) document.getElementById("discountTotal").textContent = `${discAmount.toFixed(2)} ₺`;
  if (document.getElementById("grandTotal")) document.getElementById("grandTotal").textContent = `${grandTotal.toFixed(2)} ₺`;

  document.getElementById("payKart")?.classList.toggle("accent", state.payMethod === "Kart");
  document.getElementById("payKart")?.classList.toggle("secondary", state.payMethod !== "Kart");
  document.getElementById("payNakit")?.classList.toggle("accent", state.payMethod === "Nakit");
  document.getElementById("payNakit")?.classList.toggle("secondary", state.payMethod !== "Nakit");
}

function setPayMethod(method) { state.payMethod = method; renderCart(); }

function toggleDiscount() {
  if (state.discountActive) {
    state.discountActive = false;
    state.discount = 0;
    renderCart();
  } else {
    const val = prompt("İndirim yüzdesini giriniz (Örn: 10):", "10");
    const num = parseInt(val);
    if (!isNaN(num) && num > 0 && num <= 100) {
      state.discount = num;
      state.discountActive = true;
      renderCart();
    }
  }
}

function checkoutOrder() {
  if (!state.activeTable || Object.keys(state.cart).length === 0) return;
  const orderId = state.activeTable.activeOrderId;
  if (!orderId) return;

  const grandTotalText = document.getElementById("grandTotal").textContent.replace(" ₺", "");
  const finalTotal = parseFloat(grandTotalText) || 0;

  OrderDB.update(orderId, { 
    status: "completed", closedAt: new Date().toISOString(), total: finalTotal,
    payMethod: state.payMethod, discount: state.discountActive ? state.discount : 0
  });
  
  TableDB.update(state.activeTable.id, { status: "free", activeOrderId: null });
  state.cart = {}; state.activeTable = null; state.discount = 0; state.discountActive = false;
  
  renderCart(); renderTablesView(); showToast("Hesap tahsil edildi.");
}

function renderTablesView() {
  const container = document.getElementById("tablesGrid");
  if (!container) return;
  container.innerHTML = "";

  TableDB.getAll().forEach(t => {
    const card = document.createElement("div");
    let itemsSummaryHTML = "";
    let orderTotal = 0;

    if (t.activeOrderId) {
      const order = OrderDB.getById(t.activeOrderId);
      if (order && order.items) {
        order.items.forEach(item => {
          itemsSummaryHTML += `<div style="display:flex;justify-content:space-between;color:var(--text2);font-size:12px;margin-bottom:2px;"><span>• ${item.name} x${item.qty}</span></div>`;
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
          <span style="font-size:12px;font-weight:700;color:${isOccupied ? 'var(--accent)' : 'var(--text3)'}">${isOccupied ? "DOLU" : 'BOŞ'}</span>
        </div>
        <div style="min-height:50px;max-height:90px;overflow-y:auto;line-height:1.4;">${itemsSummaryHTML || '<span style="color:var(--text3);font-size:12px;font-style:italic">Masa boş.</span>'}</div>
      </div>
    `;

    card.onclick = () => {
      state.activeTable = t;
      state.cart = {};
      if (t.activeOrderId) {
        const order = OrderDB.getById(t.activeOrderId);
        if (order) order.items.forEach(item => { state.cart[item.productId] = { product: { id: item.productId, name: item.name, price: item.price }, qty: item.qty }; });
      }
      switchView("pos");
    };
    container.appendChild(card);
  });
}

function renderMenuManageView() {
  const grid = document.getElementById("menuManageGrid");
  if (!grid) return;
  grid.innerHTML = "";

  MenuDB.getAll().forEach(p => {
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
  const btn = document.getElementById("saveProductBtn");
  if(btn) btn.innerHTML = '<i class="fa-solid fa-plus"></i> Ürün Ekle';

  document.getElementById("newEmoji").value = "☕";
  document.getElementById("prodName").value = "";
  document.getElementById("prodPrice").value = "";
  document.getElementById("prodDesc").value = "";

  const select = document.getElementById("prodCategory");
  if(select){
    select.innerHTML = "";
    ["Espresso Bazlı", "Soğuk Kahve", "Özel Tatlar", "Çay & Alternatif", "Atıştırmalık", "Serinletici"].forEach(c => { select.innerHTML += `<option>${c}</option>`; });
  }
  openModal("addProductModal");
}

function openEditProductModal(productId) {
  const p = MenuDB.getAll().find(item => item.id === productId);
  if (!p) return;

  state.editingProductId = productId;
  document.getElementById("modalTitle").textContent = "Ürünü Düzenle";
  const btn = document.getElementById("saveProductBtn");
  if(btn) btn.innerHTML = '<i class="fa-solid fa-check"></i> Güncelle';

  document.getElementById("newEmoji").value = p.emoji || "☕";
  document.getElementById("prodName").value = p.name;
  document.getElementById("prodPrice").value = p.price;
  document.getElementById("prodDesc").value = p.desc || "";

  const select = document.getElementById("prodCategory");
  if(select){
    select.innerHTML = "";
    ["Espresso Bazlı", "Soğuk Kahve", "Özel Tatlar", "Çay & Alternatif", "Atıştırmalık", "Serinletici"].forEach(c => {
      const selected = p.category === c ? "selected" : "";
      select.innerHTML += `<option ${selected}>${c}</option>`;
    });
  }
  openModal("addProductModal");
}

function saveProduct() {
  const emoji = document.getElementById("newEmoji").value || "☕";
  const name = document.getElementById("prodName").value.trim();
  const price = parseFloat(document.getElementById("prodPrice").value);
  const category = document.getElementById("prodCategory").value;
  const desc = document.getElementById("prodDesc").value.trim();

  if (!name || isNaN(price) || price < 0) {
    alert("Lütfen ürün ismi ve geçerli bir fiyat giriniz!");
    return;
  }

  const allMenu = MenuDB.getAll();

  if (state.editingProductId) {
    const idx = allMenu.findIndex(m => m.id === state.editingProductId);
    if (idx >= 0) {
      allMenu[idx] = { id: state.editingProductId, emoji, name, price, category, desc, popular: allMenu[idx].popular };
      showToast("Ürün güncellendi.");
    }
  } else {
    const newProd = { id: Date.now(), emoji, name, price, category, desc, popular: false };
    allMenu.push(newProd);
    showToast("Yeni ürün eklendi.");
  }

  MenuDB.save(allMenu);
  closeModal("addProductModal");
  renderMenuManageView();
  initPOSView();
}

function deleteProduct(productId) {
  if (confirm("Bu ürünü silmek istediğinize emin misiniz?")) {
    const filtered = MenuDB.getAll().filter(p => p.id !== productId);
    MenuDB.save(filtered);
    renderMenuManageView();
    initPOSView();
    showToast("Ürün silindi.");
  }
}

function setReportMode(mode) { state.reportMode = mode; renderReportsView(); }

function renderReportsView() {
  const btnDaily = document.getElementById("btnReportDaily");
  const btnWeekly = document.getElementById("btnReportWeekly");
  if(btnDaily) { btnDaily.classList.toggle("accent", state.reportMode === "daily"); btnDaily.classList.toggle("secondary", state.reportMode !== "daily"); }
  if(btnWeekly) { btnWeekly.classList.toggle("accent", state.reportMode === "weekly"); btnWeekly.classList.toggle("secondary", state.reportMode !== "weekly"); }

  const completedOrders = OrderDB.getAll().filter(o => o.status === "completed");
  let filteredOrders = [];
  const now = new Date();
  if (state.reportMode === "daily") {
    filteredOrders = completedOrders.filter(o => new Date(o.closedAt) >= new Date(now.getTime() - (24 * 60 * 60 * 1000)));
    if(document.getElementById("reportTitleLabel")) document.getElementById("reportTitleLabel").textContent = "Günlük Ciro";
  } else {
    filteredOrders = completedOrders.filter(o => new Date(o.closedAt) >= new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)));
    if(document.getElementById("reportTitleLabel")) document.getElementById("reportTitleLabel").textContent = "Haftalık Ciro";
  }

  let totalRevenue = 0; let totalItemsSold = 0;
  filteredOrders.forEach(o => { totalRevenue += o.total; o.items.forEach(i => totalItemsSold += i.qty); });

  if(document.getElementById("statRevenue")) document.getElementById("statRevenue").textContent = `${totalRevenue.toFixed(2)} ₺`;
  if(document.getElementById("statOrderCount")) document.getElementById("statOrderCount").textContent = filteredOrders.length;
  if(document.getElementById("statItemCount")) document.getElementById("statItemCount").textContent = totalItemsSold;

  const list = document.getElementById("reportOrderList");
  if (!list) return;
  list.innerHTML = "";

  if (filteredOrders.length === 0) { list.innerHTML = `<div class="empty-state" style="padding:20px 0;"><p>Kayıt bulunmuyor.</p></div>`; return; }

  filteredOrders.slice(-10).reverse().forEach(o => {
    const timeStr = new Date(o.closedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    const itemsStr = o.items.map(i => `${i.name} (x${i.qty})`).join(", ");
    const row = document.createElement("div");
    row.style = "background:var(--bg2); border:1px solid var(--bg4); padding:12px; border-radius:var(--r); display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;";
    row.innerHTML = `
      <div><span style="font-weight:700;color:var(--text);">${o.tableName}</span><span style="font-size:12px;color:var(--text3);margin-left:8px;">${timeStr} — Kasa: ${o.userName}</span><div style="font-size:12px;color:var(--text2);margin-top:2px;">${itemsStr}</div></div>
      <div style="text-align:right;"><strong style="color:var(--accent);">${o.total.toFixed(2)} ₺</strong><div style="font-size:10px;color:var(--text3); text-transform:uppercase;">${o.payMethod}</div></div>
    `;
    list.appendChild(row);
  });
}

function renderSettingsView() {
  loadSystemSettings();

  const userTableBody = document.getElementById("settingsStaffTableBody");
  if (!userTableBody) return;
  userTableBody.innerHTML = "";

  UserDB.getAll().forEach(u => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><div class="staff-avatar" style="width:32px; height:32px; font-size:12px; margin:0;">${u.avatar}</div></td>
      <td style="font-weight:600; color:#fff;">${u.name}</td>
      <td><span style="padding:4px 8px; border-radius:4px; font-size:11px; font-weight:600; background:${u.role==='admin'?'rgba(200,169,110,0.2)':'rgba(255,255,255,0.05)'}; color:${u.role==='admin'?'var(--accent)':'#ccc'}">${u.role === "admin" ? "Yönetici" : "Barista"}</span></td>
      <td style="font-family:monospace; color:var(--accent); font-weight:bold; letter-spacing:2px;">${u.pin}</td>
      <td><button class="search-clear" style="padding:4px 8px; font-size:12px; border:1px solid #e05575; color:#e05575; background:none; border-radius:4px; cursor:pointer;" onclick="deleteStaff('${u.id}')"><i class="fa-solid fa-trash"></i> Sil</button></td>
    `;
    userTableBody.appendChild(row);
  });
}

function loadSystemSettings() {
  const settings = typeof SettingsDB !== "undefined" ? SettingsDB.get() : { kdv: 0, service: 0, footerText: "" };
  const kdvInput = document.getElementById("settingKdv");
  const serviceInput = document.getElementById("settingService");
  const footerInput = document.getElementById("settingFooter");
  
  if(kdvInput) kdvInput.value = settings.kdv || 0;
  if(serviceInput) serviceInput.value = settings.service || 0;
  if(footerInput) footerInput.value = settings.footerText || "";
}

function saveSystemSettings() {
  const kdvInput = document.getElementById("settingKdv");
  const serviceInput = document.getElementById("settingService");
  const footerInput = document.getElementById("settingFooter");

  if (!kdvInput || !serviceInput || !footerInput) return;

  const newSettings = {
    kdv: parseFloat(kdvInput.value) || 0,
    service: parseFloat(serviceInput.value) || 0,
    footerText: footerInput.value.trim()
  };

  if(typeof SettingsDB !== "undefined") {
    SettingsDB.save(newSettings);
    showToast("Sistem ayarları başarıyla güncellendi!");
    if (state.activeTable) renderCart();
  }
}

function saveNewStaff() {
  const nameInput = document.getElementById("staffNameInput");
  const roleSelect = document.getElementById("staffRoleSelect");
  const pinInput = document.getElementById("staffPinInput");

  if (!nameInput.value || !pinInput.value || pinInput.value.length !== 4) { showToast("Lütfen tüm alanları doldurun!"); return; }

  UserDB.add({ id: "u_" + Date.now(), name: nameInput.value.trim(), role: roleSelect.value, pin: pinInput.value.trim(), avatar: nameInput.value.trim().charAt(0).toUpperCase() });
  nameInput.value = ""; pinInput.value = "";
  renderSettingsView(); showToast("Yeni personel eklendi.");
}

function deleteStaff(id) {
  if (id === state.currentUser.id) { showToast("Kendi hesabınızı silemezsiniz!"); return; }
  if (confirm("Personeli silmek istediğinize emin misiniz?")) { UserDB.delete(id); renderSettingsView(); showToast("Personel silindi."); }
}

function resetEntireSystem() {
  if (confirm("DİKKAT: Sistemdeki tüm veriler silinecektir. Emin misiniz?")) {
    localStorage.clear();
    showToast("Sistem temizlendi! Yeniden başlatılıyor...");
    setTimeout(() => { window.location.reload(); }, 1000);
  }
}

function filterProducts(val) { state.searchQuery = val; renderProductsGrid(); }
function openModal(id) { document.getElementById(id)?.classList.add("open"); }
function closeModal(id) { document.getElementById(id)?.classList.remove("open"); }
function showToast(msg) {
  const toast = document.getElementById("toast"); const toastMsg = document.getElementById("toastMsg");
  if(toast && toastMsg) { toastMsg.textContent = msg; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 2500); }
}

document.addEventListener("click", e => { if (e.target.classList.contains("modal-overlay")) e.target.classList.remove("open"); });
document.addEventListener("keydown", e => { if (e.key === "Escape") document.querySelectorAll(".modal-overlay.open").forEach(m => m.classList.remove("open")); });
