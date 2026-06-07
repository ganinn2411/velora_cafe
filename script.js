/* ═══════════════════════════════════════════════════════
   AURA Coffee & Kitchen — POS System Logic
   app.js — Uygulama state, UI ve etkileşimler
═══════════════════════════════════════════════════════ */

"use strict";

/* ── APP STATE ────────────────────────────────────────── */
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
  baristaOrders: [],       // çalışma zamanı barista listesi
  editingProductId: null,
  reportMode:    "daily",  // "daily" | "weekly"
};

/* ═══════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════ */
window.addEventListener("DOMContentLoaded", () => {
  seedIfEmpty();
  updateClock();
  setInterval(updateClock, 1000);

  // Oturumu kontrol et
  const savedUser = SessionDB.getUser();
  if (savedUser) {
    loginUser(savedUser, false);
  } else {
    renderLockScreen();
  }

  // Seed barista demo orders
  seedBaristaOrders();
});

function updateClock() {
  const now = new Date();
  document.querySelectorAll(".js-clock").forEach(el => {
    el.textContent = now.toLocaleTimeString("tr-TR", { hour:"2-digit", minute:"2-digit" });
  });
  document.querySelectorAll(".js-date").forEach(el => {
    el.textContent = now.toLocaleDateString("tr-TR", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
  });
}

/* ═══════════════════════════════════════════════════════
   LOCK SCREEN / AUTH
═══════════════════════════════════════════════════════ */
function renderLockScreen() {
  const users = UserDB.getAll().filter(u => u.active);
  const grid  = document.getElementById("lockStaffGrid");
  grid.innerHTML = "";

  state.selectedUserId = null;
  state.pinInput = "";
  document.getElementById("pinDisplay").textContent = "";
  document.getElementById("pinError").style.display = "none";
  document.getElementById("lockPinSection").style.display = "none";
  document.getElementById("lockStaffSection").style.display = "block";
  document.getElementById("lockSelectedName").textContent = "";

  users.forEach(u => {
    const btn = document.createElement("button");
    btn.className = "staff-btn";
    btn.innerHTML = `
      <span class="staff-avatar" style="background:${u.color}22;color:${u.color}">${u.avatar}</span>
      <span>${u.name}</span>
      <small style="color:var(--text3);font-size:10px">${u.role === "admin" ? "👑 Admin" : "☕ Barista"}</small>
    `;
    btn.onclick = () => selectUserForPin(u.id);
    grid.appendChild(btn);
  });
}

function selectUserForPin(userId) {
  const user = UserDB.getById(userId);
  if (!user) return;
  state.selectedUserId = userId;
  state.pinInput = "";

  document.getElementById("lockStaffSection").style.display = "none";
  document.getElementById("lockPinSection").style.display = "block";
  document.getElementById("lockSelectedName").textContent = user.name;
  document.getElementById("lockSelectedAvatar").textContent = user.avatar;
  document.getElementById("lockSelectedAvatar").style.color = user.color;
  document.getElementById("lockSelectedAvatar").style.background = user.color + "22";
  updatePinDisplay();
}

function pinPress(digit) {
  if (state.pinInput.length >= 6) return;
  state.pinInput += digit;
  updatePinDisplay();
  document.getElementById("pinError").style.display = "none";

  // 4+ karakter girilince otomatik kontrol
  if (state.pinInput.length >= 4) {
    setTimeout(checkPin, 150);
  }
}

function pinBackspace() {
  state.pinInput = state.pinInput.slice(0, -1);
  updatePinDisplay();
}

function updatePinDisplay() {
  const len = state.pinInput.length;
  const dots = document.querySelectorAll(".pin-dot");
  dots.forEach((dot, i) => {
    dot.classList.toggle("filled", i < len);
  });
}

function checkPin() {
  const user = UserDB.authenticate(state.selectedUserId, state.pinInput);
  if (user) {
    SessionDB.set(user);
    loginUser(user, true);
  } else if (state.pinInput.length >= 4) {
    document.getElementById("pinError").style.display = "block";
    document.getElementById("pinError").textContent = "Yanlış PIN, tekrar deneyin";
    // Shake animation
    const card = document.querySelector(".pin-card");
    card.style.animation = "none";
    card.offsetHeight;
    card.style.animation = "shake 0.4s ease";
    state.pinInput = "";
    updatePinDisplay();
  }
}

function backToStaffSelect() {
  state.selectedUserId = null;
  state.pinInput = "";
  document.getElementById("lockPinSection").style.display = "none";
  document.getElementById("lockStaffSection").style.display = "block";
}

function loginUser(user, animate) {
  state.currentUser = user;

  const lock = document.getElementById("lockScreen");
  const app  = document.getElementById("app");

  if (animate) {
    lock.style.opacity = "0";
    lock.style.transition = "opacity 0.35s";
    setTimeout(() => { lock.style.display = "none"; }, 350);
  } else {
    lock.style.display = "none";
  }
  app.style.display = "flex";

  // Sidebar güncellemeleri
  document.getElementById("staffAvatar").textContent = user.avatar;
  document.getElementById("staffAvatar").style.color = user.color;
  document.getElementById("staffAvatar").style.background = user.color + "22";
  document.getElementById("staffName").textContent = user.name;
  document.getElementById("staffRole").textContent = user.role === "admin" ? "👑 Admin" : "☕ Barista";

  // Rol bazlı sidebar görünürlüğü
  const adminOnlyBtns = document.querySelectorAll(".nav-btn[data-admin]");
  adminOnlyBtns.forEach(btn => {
    btn.style.display = user.role === "admin" ? "flex" : "none";
  });

  // Init
  state.activeCat = MenuDB.getCategories()[0] || "";
  buildCategoryTabs();
  renderProducts();
  renderTables();
  renderBaristaBoard();
  if (user.role === "admin") { renderReports(); renderMenuManage(); }

  // Admin ise pos başlangıçta göster, yoksa direkt sipariş
  const firstView = "pos";
  switchView(firstView, document.querySelector(`[data-view="${firstView}"]`));
}

function lockApp() {
  SessionDB.clear();
  state.currentUser = null;
  state.cart = {};
  state.activeTable = null;

  const lock = document.getElementById("lockScreen");
  const app  = document.getElementById("app");
  lock.style.opacity = "0";
  lock.style.display = "flex";
  app.style.display = "none";
  setTimeout(() => {
    lock.style.opacity = "1";
    lock.style.transition = "opacity 0.3s";
    renderLockScreen();
  }, 20);
}

/* ═══════════════════════════════════════════════════════
   NAVIGATION
═══════════════════════════════════════════════════════ */
function switchView(viewId, btn) {
  document.querySelectorAll(".view").forEach(v => v.style.display = "none");
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));

  const view = document.getElementById("view-" + viewId);
  if (view) view.style.display = "flex";
  if (btn)  btn.classList.add("active");

  state.activeView = viewId;

  if (viewId === "barista")     renderBaristaBoard();
  if (viewId === "reports")     renderReports();
  if (viewId === "tables")      renderTables();
  if (viewId === "menu-manage") renderMenuManage();
}

/* ═══════════════════════════════════════════════════════
   POS — CATEGORY TABS
═══════════════════════════════════════════════════════ */
function buildCategoryTabs() {
  const cats = MenuDB.getCategories();
  const container = document.getElementById("catTabs");
  container.innerHTML = "";

  cats.forEach((cat, i) => {
    const count = MenuDB.getByCategory(cat).length;
    const btn   = document.createElement("button");
    btn.className = "cat-tab" + (cat === state.activeCat ? " active" : "");
    btn.innerHTML = `${cat} <span class="cat-count">${count}</span>`;
    btn.onclick = () => {
      document.querySelectorAll(".cat-tab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.activeCat   = cat;
      state.searchQuery = "";
      document.getElementById("searchInput").value = "";
      document.getElementById("searchClear").style.display = "none";
      renderProducts();
    };
    container.appendChild(btn);
  });
}

/* ═══════════════════════════════════════════════════════
   POS — PRODUCT GRID
═══════════════════════════════════════════════════════ */
function renderProducts(filterQuery = "") {
  const grid = document.getElementById("productGrid");
  grid.innerHTML = "";

  let products = [];
  if (filterQuery) {
    const q = filterQuery.toLowerCase();
    products = MenuDB.getAll().filter(p =>
      p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
    );
  } else {
    products = MenuDB.getByCategory(state.activeCat);
  }

  if (!products.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--text3)">
      <div style="font-size:32px;margin-bottom:10px">🔍</div><p>Ürün bulunamadı</p>
    </div>`;
    return;
  }

  products.forEach(p => {
    const isUnavail = !p.available;
    const card = document.createElement("div");
    card.className = "product-card" + (isUnavail ? " unavailable" : "");
    card.innerHTML = `
      <div class="card-top-row">
        <span class="product-emoji">${p.emoji}</span>
        ${p.popular ? '<span class="popular-badge">Popüler</span>' : ""}
        ${isUnavail ? '<span class="unavail-badge">Tükendi</span>' : ""}
      </div>
      <div class="product-name">${p.name}</div>
      <div class="product-desc">${p.desc}</div>
      <div class="card-footer">
        <span class="product-price">₺${p.price}</span>
        <button class="add-btn" onclick="addToCart(${p.id}, event)">+</button>
      </div>
    `;
    // Kartın kendisine tıklanınca da ekle (add-btn hariç)
    card.onclick = (e) => {
      if (!e.target.classList.contains("add-btn")) addToCart(p.id, e);
    };
    grid.appendChild(card);
  });
}

function filterProducts(q) {
  state.searchQuery = q;
  document.getElementById("searchClear").style.display = q ? "flex" : "none";
  if (q) {
    document.querySelectorAll(".cat-tab").forEach(b => b.classList.remove("active"));
    renderProducts(q);
  } else {
    buildCategoryTabs();
    renderProducts();
  }
}

function clearSearch() {
  const input = document.getElementById("searchInput");
  input.value = "";
  filterProducts("");
  input.focus();
}

/* ═══════════════════════════════════════════════════════
   CART
═══════════════════════════════════════════════════════ */
function addToCart(productId, event) {
  if (event) event.stopPropagation();
  const product = MenuDB.getById(productId);
  if (!product || !product.available) return;

  if (state.cart[productId]) {
    state.cart[productId].qty++;
  } else {
    state.cart[productId] = { ...product, qty: 1 };
  }
  updateOrderPanel();
  showToast(`${product.emoji} ${product.name} eklendi`);
}

function changeQty(id, delta) {
  const numId = parseInt(id);
  if (!state.cart[numId]) return;
  state.cart[numId].qty += delta;
  if (state.cart[numId].qty <= 0) delete state.cart[numId];
  updateOrderPanel();
}

function clearCart() {
  state.cart = {};
  state.discount = 0;
  state.discountActive = false;
  document.getElementById("discountRow").style.display = "none";
  document.getElementById("discountBox").style.display = "none";
  updateOrderPanel();
}

function updateOrderPanel() {
  const items    = Object.values(state.cart);
  const count    = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const taxRate  = SettingsDB.getTaxRate();
  const tax      = Math.round(subtotal * (taxRate / 100));
  const afterDiscount = Math.max(0, subtotal - state.discount);
  const grand    = afterDiscount + tax;

  document.getElementById("orderBadge").textContent = `${count} ürün`;
  const clearBtn = document.getElementById("clearCartBtn");
  if (clearBtn) clearBtn.style.display = items.length ? "flex" : "none";

  document.getElementById("subtotalVal").textContent = `₺${subtotal}`;
  document.getElementById("taxVal").textContent = `₺${tax}`;
  document.getElementById("grandTotalVal").textContent = `₺${grand}`;
  document.getElementById("confirmTotal").textContent = `₺${grand}`;
  document.getElementById("confirmBtn").disabled = items.length === 0;

  const discRow = document.getElementById("discountRow");
  if (state.discountActive && state.discount > 0 && discRow) {
    discRow.style.display = "flex";
    document.getElementById("discountVal").textContent = `-₺${state.discount}`;
  }

  const listEl = document.getElementById("orderList");
  if (!items.length) {
    listEl.innerHTML = `<div class="order-empty">
      <div class="order-empty-icon">☕</div>
      <p>Sipariş boş</p>
      <span>Menüden ürün ekleyin</span>
    </div>`;
    return;
  }

  listEl.innerHTML = "";
  items.forEach(item => {
    const el = document.createElement("div");
    el.className = "order-item";
    el.innerHTML = `
      <span class="oi-emoji">${item.emoji}</span>
      <div class="oi-info">
        <div class="oi-name">${item.name}</div>
        <div class="oi-price">₺${item.price} × ${item.qty} = <strong>₺${item.price * item.qty}</strong></div>
      </div>
      <div class="oi-qty">
        <button class="qty-btn minus" onclick="changeQty(${item.id}, -1)">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
      </div>
    `;
    listEl.appendChild(el);
  });
}

/* ── DISCOUNT ─────────────────────────────────────────── */
function toggleDiscount() {
  const box = document.getElementById("discountBox");
  box.style.display = box.style.display === "none" ? "flex" : "none";
}

function applyDiscount() {
  const val      = parseFloat(document.getElementById("discountAmt").value);
  if (!val || val <= 0) return;
  const items    = Object.values(state.cart);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  state.discount = val <= 100 ? Math.round(subtotal * (val / 100)) : Math.min(val, subtotal);
  state.discountActive = true;
  document.getElementById("discountRow").style.display = "flex";
  document.getElementById("discountBox").style.display = "none";
  updateOrderPanel();
  showToast("✅ İndirim uygulandı");
}

function removeDiscount() {
  state.discount = 0;
  state.discountActive = false;
  document.getElementById("discountRow").style.display = "none";
  document.getElementById("discountBox").style.display = "none";
  document.getElementById("discountAmt").value = "";
  updateOrderPanel();
}

function selectPayMethod(btn) {
  document.querySelectorAll(".pay-method").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  state.payMethod = btn.dataset.method;
}

/* ═══════════════════════════════════════════════════════
   SUBMIT ORDER
═══════════════════════════════════════════════════════ */
function submitOrder() {
  const items = Object.values(state.cart);
  if (!items.length) return;

  const orderNum = OrderDB.nextCounter();
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const taxRate  = SettingsDB.getTaxRate();
  const tax      = Math.round(subtotal * (taxRate / 100));
  const afterDiscount = Math.max(0, subtotal - state.discount);
  const grand    = afterDiscount + tax;
  const note     = document.getElementById("orderNote").value;
  const tableLabel = state.activeTable ? `Masa ${state.activeTable.num}` : "Paket";

  const order = {
    id:         `ORD-${orderNum}`,
    num:        orderNum,
    items:      items.map(i => ({ id:i.id, name:i.name, emoji:i.emoji, price:i.price, qty:i.qty })),
    note,
    subtotal,
    discount:   state.discount,
    tax,
    total:      grand,
    method:     state.payMethod,
    table:      tableLabel,
    tableId:    state.activeTable ? state.activeTable.id : null,
    staffId:    state.currentUser.id,
    staffName:  state.currentUser.name,
    createdAt:  new Date().toISOString(),
    status:     "open",           // open | paid | cancelled
    baristaStatus: "pending",     // pending | preparing | ready | delivered
  };

  OrderDB.add(order);

  // Masa güncelle
  if (state.activeTable) {
    TableDB.update(state.activeTable.id, {
      status: "occupied",
      activeOrderId: order.id,
    });
  }

  // Barista board'a ekle
  state.baristaOrders.push(order);

  // Success modal
  document.getElementById("successOrderNum").textContent = `#${orderNum}`;
  document.getElementById("successDetails").innerHTML = `
    ${tableLabel}<br>
    ${items.length} ürün — <strong style="color:var(--accent)">₺${grand}</strong><br>
    Ödeme: ${state.payMethod}
    ${note ? `<br><em style="color:var(--text3)">"${note}"</em>` : ""}
  `;
  openModal("successModal");

  // Reset
  state.cart = {};
  state.discount = 0;
  state.discountActive = false;
  document.getElementById("orderNote").value = "";
  document.getElementById("discountRow").style.display = "none";
  document.getElementById("discountBox").style.display = "none";
  document.getElementById("discountAmt").value = "";
  updateOrderPanel();
  renderTables();
  renderBaristaBoard();
}

/* ═══════════════════════════════════════════════════════
   TABLES VIEW
═══════════════════════════════════════════════════════ */
function renderTables() {
  const zones = { inner:"tablesInner", terrace:"tablesTerrace", lounge:"tablesLounge" };
  const all   = TableDB.getAll();

  Object.entries(zones).forEach(([zone, containerId]) => {
    const el = document.getElementById(containerId);
    if (!el) return;
    const tables = all.filter(t => t.zone === zone);
    el.innerHTML = "";
    tables.forEach(t => renderTableCard(t, el));
  });

  updateTableStats();
}

function renderTableCard(t, container) {
  const isActive = state.activeTable && state.activeTable.id === t.id;
  const order    = t.activeOrderId ? OrderDB.getById(t.activeOrderId) : null;
  const total    = order ? order.total : 0;

  const card = document.createElement("div");
  card.className = `table-card ${t.status} ${isActive ? "active-table" : ""}`;
  card.innerHTML = `
    <div class="table-capacity"><i class="fa-solid fa-user" style="font-size:8px"></i> ${t.cap}</div>
    <div class="table-num">${t.num}</div>
    <span class="table-status ${t.status}">${tableStatusLabel(t.status)}</span>
    ${total > 0 ? `<div class="table-total">₺${total}</div>` : ""}
  `;
  card.onclick = () => openTableDetail(t.id);
  container.appendChild(card);
}

function tableStatusLabel(s) {
  return { free:"Boş", occupied:"Dolu", waiting:"Hesap" }[s] || s;
}

function updateTableStats() {
  const all      = TableDB.getAll();
  const occupied = all.filter(t => t.status !== "free").length;
  const waiting  = all.filter(t => t.status === "waiting").length;
  const el = document.getElementById("tableStatsSummary");
  if (el) el.textContent = `${occupied} dolu · ${waiting} hesap bekliyor · ${all.length - occupied} boş`;
}

/* ── MASA DETAY MODALİ ────────────────────────────────── */
function openTableDetail(tableId) {
  const table = TableDB.getById(tableId);
  if (!table) return;

  const order = table.activeOrderId ? OrderDB.getById(table.activeOrderId) : null;

  document.getElementById("tableDetailTitle").textContent = `Masa ${table.num}`;
  document.getElementById("tableDetailZone").textContent  = table.zoneLabel;
  document.getElementById("tableDetailCap").textContent   = `${table.cap} kişilik`;
  document.getElementById("tableDetailStatus").textContent = tableStatusLabel(table.status);
  document.getElementById("tableDetailStatus").className  = `badge-status ${table.status}`;

  const itemsEl   = document.getElementById("tableDetailItems");
  const actionsEl = document.getElementById("tableDetailActions");
  const totalEl   = document.getElementById("tableDetailTotal");

  if (!order) {
    itemsEl.innerHTML = `<p style="color:var(--text3);text-align:center;padding:16px">Bu masada aktif sipariş yok.</p>`;
    totalEl.style.display = "none";
    actionsEl.innerHTML = `
      <button class="modal-btn accent" onclick="selectTableAndGoToPos('${table.id}')">
        <i class="fa-solid fa-plus"></i> Sipariş Al
      </button>
    `;
  } else {
    itemsEl.innerHTML = order.items.map(i => `
      <div class="order-detail-row">
        <span>${i.emoji} ${i.name}</span>
        <span>×${i.qty}</span>
        <span style="color:var(--accent);font-family:'Syne',sans-serif;font-weight:700">₺${i.price * i.qty}</span>
      </div>
    `).join("") + (order.note ? `<div class="order-note-badge">📝 ${order.note}</div>` : "");

    totalEl.style.display = "flex";
    const taxRate = SettingsDB.getTaxRate();
    document.getElementById("tableDetailSubtotal").textContent = `₺${order.subtotal}`;
    document.getElementById("tableDetailTax").textContent      = `₺${order.tax}`;
    if (order.discount > 0) {
      document.getElementById("tableDetailDiscountRow").style.display = "flex";
      document.getElementById("tableDetailDiscount").textContent = `-₺${order.discount}`;
    } else {
      document.getElementById("tableDetailDiscountRow").style.display = "none";
    }
    document.getElementById("tableDetailGrand").textContent = `₺${order.total}`;

    actionsEl.innerHTML = `
      <button class="modal-btn secondary" onclick="selectTableAndGoToPos('${table.id}')">
        <i class="fa-solid fa-plus"></i> Ürün Ekle
      </button>
      <button class="modal-btn accent" onclick="requestBill('${table.id}')">
        <i class="fa-solid fa-receipt"></i> Hesap Al
      </button>
    `;
  }

  openModal("tableDetailModal");
}

function selectTableAndGoToPos(tableId) {
  const table = TableDB.getById(tableId);
  if (!table) return;
  state.activeTable = table;
  document.getElementById("activeTableLabel").textContent = `Masa ${table.num}`;
  closeModal("tableDetailModal");
  switchView("pos", document.querySelector('[data-view="pos"]'));
  showToast(`🪑 Masa ${table.num} seçildi`);
  renderTables();
}

function selectTable(tableId) {
  selectTableAndGoToPos(tableId);
}

function requestBill(tableId) {
  const table = TableDB.getById(tableId);
  if (!table || !table.activeOrderId) return;

  const order = OrderDB.getById(table.activeOrderId);
  if (!order) return;

  // Ödeme yöntemi seçimi için modal aç
  document.getElementById("billOrderNum").textContent   = `#${order.num}`;
  document.getElementById("billTableName").textContent  = `Masa ${table.num}`;
  document.getElementById("billTotalAmt").textContent   = `₺${order.total}`;
  document.getElementById("billTableId").value          = tableId;
  document.getElementById("billOrderId").value          = order.id;

  // Ödeme yöntemini sıfırla
  document.querySelectorAll(".bill-pay-btn").forEach(b => b.classList.remove("active"));
  document.querySelector(".bill-pay-btn[data-method='Kart']").classList.add("active");

  closeModal("tableDetailModal");
  openModal("billModal");
}

function selectBillPayMethod(btn) {
  document.querySelectorAll(".bill-pay-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

function confirmBill() {
  const tableId = document.getElementById("billTableId").value;
  const orderId = document.getElementById("billOrderId").value;
  const method  = document.querySelector(".bill-pay-btn.active")?.dataset.method || "Kart";

  OrderDB.update(orderId, { status:"paid", method, paidAt: new Date().toISOString() });
  TableDB.update(tableId, { status:"free", activeOrderId: null });

  closeModal("billModal");
  renderTables();
  showToast("✅ Hesap ödendi, masa serbest bırakıldı");

  const order = OrderDB.getById(orderId);
  if (order) {
    document.getElementById("receiptOrderNum").textContent   = `#${order.num}`;
    document.getElementById("receiptTable").textContent      = order.table;
    document.getElementById("receiptItems").innerHTML = order.items.map(i =>
      `<div class="receipt-row"><span>${i.emoji} ${i.name} ×${i.qty}</span><span>₺${i.price * i.qty}</span></div>`
    ).join("");
    document.getElementById("receiptSubtotal").textContent = `₺${order.subtotal}`;
    document.getElementById("receiptTax").textContent      = `₺${order.tax}`;
    document.getElementById("receiptTotal").textContent    = `₺${order.total}`;
    document.getElementById("receiptMethod").textContent   = method;
    document.getElementById("receiptTime").textContent     = new Date().toLocaleString("tr-TR");
    openModal("receiptModal");
  }
}

/* ═══════════════════════════════════════════════════════
   BARISTA VIEW
═══════════════════════════════════════════════════════ */
function seedBaristaOrders() {
  const existingNums = state.baristaOrders.map(o => o.num);
  const demos = [
    {
      id:"ORD-DEMO-38", num:38, baristaStatus:"pending", table:"Masa 4", note:"Oat milk lütfen", method:"Kart", total:354,
      items:[{name:"Flat White",emoji:"⬜",qty:1,price:108},{name:"Lavender Latte",emoji:"💜",qty:2,price:138}],
      createdAt: new Date(Date.now() - 3*60000).toISOString(), staffName:"Barista Efe",
    },
    {
      id:"ORD-DEMO-39", num:39, baristaStatus:"preparing", table:"Masa 2", note:"", method:"Nakit", total:310,
      items:[{name:"Iced Latte",emoji:"🥤",qty:2,price:110},{name:"Croissant",emoji:"🥐",qty:1,price:90}],
      createdAt: new Date(Date.now() - 7*60000).toISOString(), staffName:"Kasiyer Selin",
    },
    {
      id:"ORD-DEMO-40", num:40, baristaStatus:"ready", table:"Masa T2", note:"Az buz", method:"QR", total:248,
      items:[{name:"Cold Brew",emoji:"🧊",qty:2,price:115}],
      createdAt: new Date(Date.now() - 12*60000).toISOString(), staffName:"Barista Efe",
    },
  ];
  demos.forEach(d => {
    if (!existingNums.includes(d.num)) state.baristaOrders.push(d);
  });
}

function renderBaristaBoard() {
  const cols = { pending:[], preparing:[], ready:[], delivered:[] };
  state.baristaOrders.forEach(o => {
    const status = o.baristaStatus || "pending";
    if (cols[status]) cols[status].push(o);
  });

  const waiting = cols.pending.length + cols.preparing.length;
  document.getElementById("baristaQueueMeta").textContent = `${waiting} bekleyen sipariş`;

  renderBaristaCol("barista-pending",   cols.pending,   "pending");
  renderBaristaCol("barista-preparing", cols.preparing, "preparing");
  renderBaristaCol("barista-ready",     cols.ready,     "ready");
  renderBaristaCol("barista-delivered", cols.delivered, "delivered");
}

function renderBaristaCol(containerId, orders, status) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = "";

  if (!orders.length) {
    el.innerHTML = `<div class="barista-empty"><i class="fa-solid fa-check" style="font-size:20px;opacity:.2;margin-bottom:6px"></i><br>Boş</div>`;
    return;
  }

  orders.forEach(o => {
    const elapsed  = Math.round((Date.now() - new Date(o.createdAt).getTime()) / 60000);
    const ticket   = document.createElement("div");
    ticket.className = "barista-ticket";
    ticket.innerHTML = `
      <div class="ticket-top">
        <span class="ticket-order">#${o.num}</span>
        <span class="ticket-table">${o.table || "Paket"}</span>
      </div>
      <div class="ticket-time"><i class="fa-regular fa-clock"></i> ${elapsed} dk önce</div>
      ${o.items.map(i => `<div class="ticket-item"><span>${i.emoji} ${i.name}</span><span>×${i.qty}</span></div>`).join("")}
      ${o.note ? `<div class="ticket-note">📝 ${o.note}</div>` : ""}
      <div class="ticket-action">${getTicketButtons(o, status)}</div>
    `;
    el.appendChild(ticket);
  });
}

function getTicketButtons(order, status) {
  const id = order.id;
  const map = {
    pending:   `<button class="ticket-btn primary" onclick="advanceOrder('${id}')">⚡ Hazırla</button>
                <button class="ticket-btn" onclick="cancelBaristaOrder('${id}')">İptal</button>`,
    preparing: `<button class="ticket-btn primary" onclick="advanceOrder('${id}')">🔔 Hazır</button>`,
    ready:     `<button class="ticket-btn primary" onclick="advanceOrder('${id}')">✓ Teslim Et</button>`,
    delivered: `<button class="ticket-btn" style="opacity:.5" disabled>Teslim Edildi</button>`,
  };
  return map[status] || "";
}

function advanceOrder(id) {
  const map = { pending:"preparing", preparing:"ready", ready:"delivered" };
  const order = state.baristaOrders.find(o => o.id === id);
  if (!order) return;
  order.baristaStatus = map[order.baristaStatus] || order.baristaStatus;
  if (order.id.startsWith("ORD-") && !order.id.startsWith("ORD-DEMO")) {
    OrderDB.update(order.id, { baristaStatus: order.baristaStatus });
  }
  renderBaristaBoard();
  const labels = { preparing:"🔥 Hazırlanıyor", ready:"🔔 Hazır!", delivered:"✅ Teslim edildi" };
  showToast(labels[order.baristaStatus] || "Güncellendi");
}

function cancelBaristaOrder(id) {
  state.baristaOrders = state.baristaOrders.filter(o => o.id !== id);
  renderBaristaBoard();
  showToast("❌ Sipariş iptal edildi");
}

/* ═══════════════════════════════════════════════════════
   REPORTS VIEW (ADMIN ONLY)
═══════════════════════════════════════════════════════ */
function renderReports() {
  const mode   = state.reportMode || "daily";
  const orders = mode === "weekly" ? OrderDB.getThisWeek() : OrderDB.getToday();
  const paidOrders = orders.filter(o => o.status === "paid" || o.status === "open");

  // Toggle buttons
  document.querySelectorAll(".report-mode-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });

  document.getElementById("reportDateLabel").textContent = mode === "weekly"
    ? "Bu Hafta"
    : new Date().toLocaleDateString("tr-TR", { weekday:"long", day:"numeric", month:"long" });

  const total  = paidOrders.reduce((s, o) => s + o.total, 0);
  const avg    = paidOrders.length ? Math.round(total / paidOrders.length) : 0;
  const itemCount = {};
  paidOrders.forEach(o => o.items.forEach(i => {
    itemCount[i.name] = (itemCount[i.name] || 0) + i.qty;
  }));
  const topEntry = Object.entries(itemCount).sort((a,b) => b[1]-a[1])[0];

  document.getElementById("stat-revenue").textContent = `₺${total}`;
  document.getElementById("stat-orders").textContent  = paidOrders.length;
  document.getElementById("stat-avg").textContent     = `₺${avg}`;
  document.getElementById("stat-top").textContent     = topEntry ? topEntry[0] : "—";

  renderHourlyChart(paidOrders, mode);
  renderDonutChart(paidOrders);
  renderTopItems(paidOrders);
  renderOrderHistory(paidOrders);
}

function setReportMode(mode) {
  state.reportMode = mode;
  renderReports();
}

function renderHourlyChart(orders, mode) {
  const hours  = Array.from({ length: 14 }, (_, i) => i + 7);
  const data   = hours.map(h => {
    const base = mode === "weekly" ? 0 : [2,8,22,40,60,75,88,102,85,70,52,35,18,6][h-7] || 0;
    const real = orders.filter(o => new Date(o.createdAt).getHours() === h)
                        .reduce((s, o) => s + o.total, 0);
    return base + real;
  });
  const max = Math.max(...data, 1);
  const chart = document.getElementById("hourlyChart");
  if (!chart) return;
  chart.innerHTML = "";
  const currentHour = new Date().getHours();

  data.forEach((val, i) => {
    const h   = hours[i];
    const pct = Math.round((val / max) * 130);
    const isPeak = val === Math.max(...data);
    const col = document.createElement("div");
    col.className = "bar-col";
    col.innerHTML = `
      <div class="bar-val">${val > 0 ? "₺"+val : ""}</div>
      <div class="bar-fill${isPeak ? " peak" : ""}" style="height:${pct}px" title="${h}:00 — ₺${val}"></div>
      <div class="bar-label" style="${h === currentHour ? "color:var(--accent);font-weight:700" : ""}">${h}</div>
    `;
    chart.appendChild(col);
  });
}

function renderDonutChart(orders) {
  const methods = { "Kart":0, "Nakit":0, "QR":0 };
  orders.forEach(o => { methods[o.method] = (methods[o.method]||0) + o.total; });
  if (!orders.length) { methods["Kart"]=7850; methods["Nakit"]=3200; methods["QR"]=1950; }

  const total  = Object.values(methods).reduce((s,v) => s+v, 0);
  const colors = { "Kart":"#C8A96E", "Nakit":"#4CAF7A", "QR":"#9B8FE0" };
  const wrap   = document.getElementById("donutChart");
  if (!wrap) return;
  wrap.innerHTML = "";

  const entries    = Object.entries(methods).filter(([,v]) => v > 0);
  const radius     = 52;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox","0 0 130 130");
  svg.setAttribute("width","130"); svg.setAttribute("height","130");

  const bg = document.createElementNS("http://www.w3.org/2000/svg","circle");
  bg.setAttribute("cx","65"); bg.setAttribute("cy","65"); bg.setAttribute("r", String(radius));
  bg.setAttribute("fill","none"); bg.setAttribute("stroke","#1e1e1e"); bg.setAttribute("stroke-width","16");
  svg.appendChild(bg);

  entries.forEach(([method, val]) => {
    const pct    = val/total;
    const dash   = pct * circumference;
    const circle = document.createElementNS("http://www.w3.org/2000/svg","circle");
    circle.setAttribute("cx","65"); circle.setAttribute("cy","65"); circle.setAttribute("r", String(radius));
    circle.setAttribute("fill","none"); circle.setAttribute("stroke", colors[method]||"#555");
    circle.setAttribute("stroke-width","16");
    circle.setAttribute("stroke-dasharray", `${dash} ${circumference-dash}`);
    circle.setAttribute("stroke-dashoffset", String(-offset + circumference*0.25));
    circle.setAttribute("transform","rotate(-90 65 65)");
    svg.appendChild(circle);
    offset += dash;
  });

  const textEl = document.createElementNS("http://www.w3.org/2000/svg","text");
  textEl.setAttribute("x","65"); textEl.setAttribute("y","62"); textEl.setAttribute("text-anchor","middle");
  textEl.setAttribute("fill","#F2EDE4"); textEl.setAttribute("font-family","Syne,sans-serif");
  textEl.setAttribute("font-size","13"); textEl.setAttribute("font-weight","700");
  textEl.textContent = "₺" + (total >= 1000 ? (total/1000).toFixed(1)+"k" : total);
  const subEl = document.createElementNS("http://www.w3.org/2000/svg","text");
  subEl.setAttribute("x","65"); subEl.setAttribute("y","76"); subEl.setAttribute("text-anchor","middle");
  subEl.setAttribute("fill","#5A4E46"); subEl.setAttribute("font-family","DM Sans,sans-serif"); subEl.setAttribute("font-size","10");
  subEl.textContent = "Toplam";
  svg.appendChild(textEl); svg.appendChild(subEl);
  wrap.appendChild(svg);

  const legend = document.createElement("div");
  legend.className = "donut-legend";
  entries.forEach(([method, val]) => {
    const pct = Math.round((val/total)*100);
    const item = document.createElement("div");
    item.className = "legend-item";
    item.innerHTML = `<span class="legend-name"><span class="legend-color" style="background:${colors[method]}"></span>${method}</span><span class="legend-pct">${pct}%</span>`;
    legend.appendChild(item);
  });
  wrap.appendChild(legend);
}

function renderTopItems(orders) {
  const itemData = {};
  orders.forEach(o => o.items.forEach(i => {
    if (!itemData[i.name]) itemData[i.name] = { name:i.name, emoji:i.emoji, qty:0, revenue:0 };
    itemData[i.name].qty     += i.qty;
    itemData[i.name].revenue += i.price * i.qty;
  }));
  if (!orders.length) {
    [["Cold Brew","🧊",47,5405],["Flat White","⬜",38,4104],["Iced Latte","🥤",35,3850],
     ["Cappuccino","🤍",32,3040],["Lavender Latte","💜",28,3864],["Avokado Toast","🥑",22,3696]]
    .forEach(([name,emoji,qty,revenue]) => { itemData[name] = {name,emoji,qty,revenue}; });
  }

  const sorted = Object.values(itemData).sort((a,b) => b.qty-a.qty).slice(0,8);
  const maxQty = sorted[0]?.qty || 1;
  const totalRev = sorted.reduce((s,i) => s+i.revenue, 0);
  const tbody = document.getElementById("topItemsBody");
  if (!tbody) return;
  tbody.innerHTML = "";
  sorted.forEach((item, idx) => {
    const barW  = Math.round((item.qty/maxQty)*80);
    const share = Math.round((item.revenue/totalRev)*100);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${idx+1}</td>
      <td>${item.emoji} ${item.name}</td>
      <td><div class="rank-bar"><div class="rank-bar-fill" style="width:${barW}px"></div><span>${item.qty}</span></div></td>
      <td style="color:var(--accent);font-family:'Syne',sans-serif;font-weight:700">₺${item.revenue}</td>
      <td><span style="color:var(--text3)">${share}%</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderOrderHistory(orders) {
  const container = document.getElementById("orderHistory");
  if (!container) return;
  document.getElementById("historyCount").textContent = `${orders.length} sipariş`;

  if (!orders.length) {
    container.innerHTML = `<p style="color:var(--text3);font-size:14px;padding:20px 0">Henüz sipariş yok.</p>`;
    return;
  }
  container.innerHTML = "";
  [...orders].reverse().forEach(o => {
    const el = document.createElement("div");
    el.className = "history-item";
    const timeStr = new Date(o.createdAt).toLocaleTimeString("tr-TR", {hour:"2-digit",minute:"2-digit"});
    const itemStr = o.items.map(i => `${i.name} ×${i.qty}`).join(", ");
    el.innerHTML = `
      <span class="history-num">#${o.num}</span>
      <div class="history-info">
        <div class="history-table">${o.table}</div>
        <div class="history-items">${itemStr.length>45 ? itemStr.slice(0,45)+"…" : itemStr}</div>
      </div>
      <div class="history-right">
        <div class="history-total">₺${o.total}</div>
        <div class="history-method">${o.method}</div>
        <div class="history-time">${timeStr}</div>
      </div>
    `;
    container.appendChild(el);
  });
}

function exportReport() {
  showToast("📊 Rapor dışa aktarılıyor…");
  setTimeout(() => showToast("✅ Rapor hazır: aura_rapor.csv"), 1500);
}

/* ═══════════════════════════════════════════════════════
   MENU MANAGE (ADMIN ONLY)
═══════════════════════════════════════════════════════ */
let mmActiveCat = null;

function renderMenuManage() {
  const cats = MenuDB.getCategories();
  if (!mmActiveCat || !cats.includes(mmActiveCat)) mmActiveCat = cats[0];

  const catList = document.getElementById("mmCatList");
  if (!catList) return;
  catList.innerHTML = "";

  cats.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "mm-cat-btn" + (cat === mmActiveCat ? " active" : "");
    btn.innerHTML = `${cat} <span class="mm-cat-count">${MenuDB.getByCategory(cat).length}</span>`;
    btn.onclick = () => { mmActiveCat = cat; renderMenuManage(); };
    catList.appendChild(btn);
  });

  renderMMProducts();
}

function renderMMProducts() {
  const list = document.getElementById("mmProductList");
  if (!list) return;
  list.innerHTML = "";

  MenuDB.getByCategory(mmActiveCat).forEach(p => {
    const row = document.createElement("div");
    row.className = "mm-product-row";
    row.innerHTML = `
      <span class="mm-emoji">${p.emoji}</span>
      <div class="mm-info">
        <div class="mm-name">${p.name} ${p.popular ? '<span style="font-size:10px;color:var(--accent);margin-left:6px">★ Popüler</span>' : ""}</div>
        <div class="mm-desc">${p.desc}</div>
      </div>
      <span class="mm-price">₺${p.price}</span>
      <div class="mm-actions">
        <label class="toggle-switch" title="${p.available ? "Mevcut" : "Tükendi"}">
          <input type="checkbox" ${p.available ? "checked" : ""} onchange="toggleProductAvailability(${p.id}, this)" />
          <span class="toggle-slider"></span>
        </label>
        <button class="mm-edit-btn" onclick="openEditProduct(${p.id})" title="Düzenle"><i class="fa-solid fa-pen"></i></button>
        <button class="mm-edit-btn" onclick="deleteProduct(${p.id})" title="Sil" style="color:var(--red)"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
    list.appendChild(row);
  });
}

function toggleProductAvailability(id, checkbox) {
  MenuDB.update(id, { available: checkbox.checked });
  renderProducts();
  showToast(checkbox.checked ? "✅ Ürün aktif" : "⚠️ Ürün tükendi işaretlendi");
}

/* ── ADD / EDIT PRODUCT ───────────────────────────────── */
function openAddProduct() {
  state.editingProductId = null;
  document.getElementById("productModalTitle").textContent = "Yeni Ürün Ekle";
  document.getElementById("saveProductBtn").textContent    = "Ürün Ekle";
  ["newName","newEmoji","newPrice","newDesc"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  document.getElementById("newPopular").checked = false;
  populateCategorySelect();
  openModal("addProductModal");
}

function openEditProduct(id) {
  const p = MenuDB.getById(id);
  if (!p) return;
  state.editingProductId = id;

  document.getElementById("productModalTitle").textContent = "Ürün Düzenle";
  document.getElementById("saveProductBtn").textContent    = "Kaydet";
  document.getElementById("newName").value    = p.name;
  document.getElementById("newEmoji").value   = p.emoji;
  document.getElementById("newPrice").value   = p.price;
  document.getElementById("newDesc").value    = p.desc;
  document.getElementById("newPopular").checked = p.popular;

  populateCategorySelect(p.cat);
  openModal("addProductModal");
}

function populateCategorySelect(selected) {
  const sel = document.getElementById("newCategory");
  if (!sel) return;
  const cats = MenuDB.getCategories();
  sel.innerHTML = cats.map(c =>
    `<option value="${c}" ${c === selected ? "selected" : ""}>${c}</option>`
  ).join("");
  // Yeni kategori seçeneği
  sel.innerHTML += `<option value="__new__">+ Yeni Kategori...</option>`;
}

function saveProduct() {
  const name    = document.getElementById("newName").value.trim();
  const emoji   = document.getElementById("newEmoji").value.trim() || "☕";
  const price   = parseInt(document.getElementById("newPrice").value) || 0;
  const catVal  = document.getElementById("newCategory").value;
  const desc    = document.getElementById("newDesc").value.trim();
  const popular = document.getElementById("newPopular").checked;

  if (!name || !price) { showToast("⚠️ Ad ve fiyat zorunlu"); return; }

  let cat = catVal;
  if (catVal === "__new__") {
    const newCat = prompt("Yeni kategori adı:");
    if (!newCat) return;
    cat = newCat.trim();
  }

  if (state.editingProductId) {
    MenuDB.update(state.editingProductId, { name, emoji, price, cat, desc, popular });
    showToast(`✅ "${name}" güncellendi`);
  } else {
    MenuDB.add({ name, emoji, price, cat, desc, popular, available: true });
    showToast(`✅ "${name}" eklendi`);
  }

  closeModal("addProductModal");
  buildCategoryTabs();
  renderProducts();
  renderMenuManage();
}

function deleteProduct(id) {
  const p = MenuDB.getById(id);
  if (!p) return;
  if (!confirm(`"${p.name}" ürününü silmek istediğinizden emin misiniz?`)) return;
  MenuDB.delete(id);
  buildCategoryTabs();
  renderProducts();
  renderMenuManage();
  showToast(`🗑️ "${p.name}" silindi`);
}

/* ═══════════════════════════════════════════════════════
   MODALS
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
   TOAST
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

/* ═══════════════════════════════════════════════════════
   KEYBOARD SHORTCUTS
═══════════════════════════════════════════════════════ */
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal-overlay.open").forEach(m => m.classList.remove("open"));
  }
  if ((e.ctrlKey || e.metaKey) && e.key === "f") {
    e.preventDefault();
    const s = document.getElementById("searchInput");
    if (s) { s.focus(); s.select(); }
  }
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    const btn = document.getElementById("confirmBtn");
    if (btn && !btn.disabled) submitOrder();
  }
});
