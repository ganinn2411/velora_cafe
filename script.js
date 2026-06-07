/* ═══════════════════════════════════════════════════════
   AURA Coffee & Kitchen — POS System Logic
   script.js — Ayarlar ve Personel Düzenleme Entegreli
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
};

window.addEventListener("DOMContentLoaded", () => {
  seedIfEmpty();
  updateClock();
  setInterval(updateClock, 1000);

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

/* ── GİRİŞ & KİLİT EKRANI ── */
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
    showToast("Hatalı PIN Kodu!");
    clearPin();
  }
}

function loginUser(user, saveSession) {
  state.currentUser = user;
  if (saveSession) SessionDB.setUser(user);

  // Sadece admin (Müdür) ise Ayarlar butonu gözüksün
  const navSettings = document.getElementById("nav-settings");
  if (user.role === "admin") {
    if (navSettings) navSettings.style.display = "flex";
  } else {
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

function logout() {
  renderLockScreen();
}

/* ── GÖRÜNÜM DEĞİŞTİRME ── */
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
  if (viewId === "settings") renderSettingsView();
}

/* ── POS GÖRÜNÜMÜ VE ADİSYON ── */
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
  if (!state.activeTable) {
    showToast("Lütfen önce bir masa seçin!");
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
    updateTotals(0);
    return;
  }

  document.getElementById("activeTableLabel").textContent = `Masa ${state.activeTable.num}`;
  document.getElementById("receiptTitle").textContent = `Masa ${state.activeTable.num}`;
  
  const items = Object.values(state.cart);
  if (items.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>Adisyon boş.</p></div>`;
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
        <span style="min-width:15px; text-align:center">${item.qty}</span>
        <button class="search-clear" style="width:24px; height:24px; border-radius:4px; border:1px solid #333; color:#fff; background:none; cursor:pointer;" onclick="changeCartQty(${item.product.id}, 1)">+</button>
      </div>
    `;
    container.appendChild(row);
  });

  updateTotals(subTotal);
}

function updateTotals(subTotal) {
  const discPercent = state.discountActive ? state.discount : 0;
  const discAmount = subTotal * (discPercent / 100);
  const grandTotal = subTotal - discAmount;

  document.getElementById("subTotal").textContent = `${subTotal.toFixed(2)} ₺`;
  document.getElementById("discountTotal").textContent = `${discAmount.toFixed(2)} ₺`;
  document.getElementById("grandTotal").textContent = `${grandTotal.toFixed(2)} ₺`;
}

function checkoutOrder() {
  if (!state.activeTable || Object.keys(state.cart).length === 0) return;
  const orderId = state.activeTable.activeOrderId;
  if (!orderId) return;

  OrderDB.update(orderId, { status: "completed", closedAt: new Date().toISOString(), total: parseFloat(document.getElementById("grandTotal").textContent) });
  TableDB.update(state.activeTable.id, { status: "free", activeOrderId: null });
  
  state.cart = {};
  state.activeTable = null;
  renderCart();
  showToast("Hesap başarıyla kapatıldı.");
}

function renderTablesView() {
  const container = document.getElementById("tablesGrid");
  if (!container) return;
  container.innerHTML = "";

  const tables = TableDB.getAll();
  tables.forEach(t => {
    const card = document.createElement("div");
    card.className = `product-card ${t.status === "occupied" ? "popular" : ""}`;
    card.innerHTML = `
      <div class="product-info">
        <h3>Masa ${t.num}</h3>
        <p>${t.status === "occupied" ? "Dolu (Adisyon Açık)" : "Boş"}</p>
      </div>
    `;
    card.onclick = () => {
      state.activeTable = t;
      state.cart = {};
      if (t.activeOrderId) {
        const order = OrderDB.getById(t.activeOrderId);
        if (order) {
          order.items.forEach(item => { state.cart[item.productId] = { product: { id: item.productId, name: item.name, price: item.price }, qty: item.qty }; });
        }
      }
      switchView("pos");
    };
    container.appendChild(card);
  });
}

/* ── ⚙️ AYARLAR VE PERSONEL YÖNETİM PANELİ ── */
function renderSettingsView() {
  const userTableBody = document.getElementById("settingsStaffTableBody");
  if (!userTableBody) return;
  userTableBody.innerHTML = "";

  const users = UserDB.getAll();
  users.forEach(u => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><div class="staff-avatar" style="width:32px; height:32px; font-size:12px; margin:0;">${u.avatar}</div></td>
      <td style="font-weight:600; color:#fff;">${u.name}</td>
      <td><span style="padding:4px 8px; border-radius:4px; font-size:11px; font-weight:600; background:${u.role==='admin'?'rgba(200,169,110,0.2)':'rgba(255,255,255,0.05)'}; color:${u.role==='admin'?'var(--accent)':'#ccc'}">${u.role === "admin" ? "Yönetici" : "Barista"}</span></td>
      <td style="font-family:monospace; color:var(--accent); font-weight:bold; letter-spacing:2px;">${u.pin}</td>
      <td>
        <button class="search-clear" style="padding:4px 8px; font-size:12px; border:1px solid #e05575; color:#e05575; background:none; border-radius:4px; cursor:pointer;" onclick="deleteStaff('${u.id}')">
          <i class="fa-solid fa-trash"></i> Sil
        </button>
      </td>
    `;
    userTableBody.appendChild(row);
  });
}

function saveNewStaff() {
  const nameInput = document.getElementById("staffNameInput");
  const roleSelect = document.getElementById("staffRoleSelect");
  const pinInput = document.getElementById("staffPinInput");

  if (!nameInput.value || !pinInput.value || pinInput.value.length !== 4) {
    showToast("Lütfen tüm alanları doğru ve 4 haneli PIN olacak şekilde doldurun!");
    return;
  }

  const newUser = {
    id: "u_" + Date.now(),
    name: nameInput.value.trim(),
    role: roleSelect.value,
    pin: pinInput.value.trim(),
    avatar: nameInput.value.trim().charAt(0).toUpperCase()
  };

  UserDB.add(newUser);
  nameInput.value = "";
  pinInput.value = "";
  
  renderSettingsView();
  showToast("Yeni personel başarıyla eklendi.");
}

function deleteStaff(id) {
  if (id === state.currentUser.id) {
    showToast("Şu an aktif olan kendi hesabınızı silemezsiniz!");
    return;
  }
  if (confirm("Bu personeli sistemden silmek istediğinize emin misiniz?")) {
    UserDB.delete(id);
    renderSettingsView();
    showToast("Personel sistemden kaldırıldı.");
  }
}

function resetEntireSystem() {
  if (confirm("DİKKAT: Sistemdeki tüm siparişler, masalar ve ayarlar fabrikasyon moduna sıfırlanacaktır. Emin misiniz?")) {
    localStorage.clear();
    showToast("Sistem temizlendi! Yeniden başlatılıyor...");
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
}

function filterProducts(val) { state.searchQuery = val; renderProductsGrid(); }

function showToast(msg) {
  const toast = document.getElementById("toast");
  const toastMsg = document.getElementById("toastMsg");
  if(toast && toastMsg) {
    toastMsg.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
  }
}
