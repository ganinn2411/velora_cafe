"use strict";

/* ═══════════════════════════════════════════════════════
   AURA Coffee & Kitchen — app.js
   Tüm uygulama mantığı
═══════════════════════════════════════════════════════ */

/* ── STATE ─────────────────────────────────────────── */
let currentUser    = null;
let cart           = [];
let selectedTable  = null;
let paymentMethod  = "cash";
let appliedCoupon  = null;
let editingProductId = null;
let activeCat      = "Tümü";
let cpCurrentFilter = "all";
let currentMenuCat  = "";
let selectedUserId  = null;

/* ── BOOT ──────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  seedIfEmpty();
  updateClock();
  setInterval(updateClock, 1000);

  // Modal dışı tıkla kapat
  document.querySelectorAll(".modal-overlay").forEach(el => {
    el.addEventListener("click", e => {
      if (e.target === el) closeModal(el.id);
    });
  });

  // Önceki oturum
  const saved = SessionDB.getUser();
  if (saved) {
    loginUser(saved);
  } else {
    showLockScreen();
  }
});

/* ── CLOCK ─────────────────────────────────────────── */
function updateClock() {
  const now = new Date();
  const ts  = now.toLocaleTimeString("tr-TR", { hour:"2-digit", minute:"2-digit" });
  const ds  = now.toLocaleDateString("tr-TR", { weekday:"long", day:"numeric", month:"long" });
  document.querySelectorAll(".clock-time").forEach(el => el.textContent = ts);
  document.querySelectorAll(".clock-date").forEach(el => el.textContent = ds);
}

/* ══════════════════════════════════════════════════════
   LOCK / AUTH
══════════════════════════════════════════════════════ */
function showLockScreen() {
  document.getElementById("lockScreen").style.display = "flex";
  document.getElementById("pinScreen").style.display  = "none";
  document.getElementById("appShell").style.display   = "none";
  renderStaffButtons();
}

function renderStaffButtons() {
  const grid = document.getElementById("staffGrid");
  if (!grid) return;
  const users = UserDB.getAll().filter(u => u.active !== false);
  grid.innerHTML = users.map(u => `
    <button class="staff-btn" onclick="selectStaff('${u.id}')">
      <div class="staff-avatar" style="background:${u.color || "#C8A96E"}">${u.avatar}</div>
      <span class="staff-name">${u.name}</span>
      <span class="staff-role">${u.role === "admin" ? "Müdür" : "Barista"}</span>
    </button>
  `).join("");
}

function selectStaff(userId) {
  selectedUserId = userId;
  const u = UserDB.getById(userId);
  if (!u) return;
  // PIN ekranına geç
  document.getElementById("lockScreen").style.display = "none";
  document.getElementById("pinScreen").style.display  = "flex";
  document.getElementById("pinUserAvatar").textContent = u.avatar;
  document.getElementById("pinUserAvatar").style.background = u.color || "#C8A96E";
  document.getElementById("pinUserName").textContent  = u.name;
  document.getElementById("pinUserRole").textContent  = u.role === "admin" ? "Müdür" : "Barista";
  clearPin();
}

let pinValue = "";
function pressPin(val) {
  if (pinValue.length >= 4) return;
  pinValue += val;
  updatePinDots();
  if (pinValue.length === 4) {
    setTimeout(checkPin, 180);
  }
}
function deletePin() {
  pinValue = pinValue.slice(0, -1);
  updatePinDots();
}
function clearPin() {
  pinValue = "";
  updatePinDots();
  const err = document.getElementById("pinError");
  if (err) err.textContent = "";
}
function updatePinDots() {
  document.querySelectorAll(".pin-dot").forEach((dot, i) => {
    dot.classList.toggle("filled", i < pinValue.length);
  });
}
function checkPin() {
  const u = UserDB.authenticate(selectedUserId, pinValue);
  if (u) {
    loginUser(u);
  } else {
    const err = document.getElementById("pinError");
    if (err) err.textContent = "Hatalı PIN, tekrar deneyin.";
    const card = document.getElementById("pinCard");
    if (card) { card.style.animation = "shake .4s ease"; setTimeout(() => card.style.animation = "", 400); }
    setTimeout(clearPin, 600);
  }
}
function backToStaffSelect() {
  document.getElementById("pinScreen").style.display  = "none";
  document.getElementById("lockScreen").style.display = "flex";
  clearPin();
}

function loginUser(u) {
  currentUser = u;
  SessionDB.set(u);
  document.getElementById("lockScreen").style.display = "none";
  document.getElementById("pinScreen").style.display  = "none";
  document.getElementById("appShell").style.display   = "flex";

  // Sidebar profil
  document.getElementById("staffPillAvatar").textContent        = u.avatar;
  document.getElementById("staffPillAvatar").style.background   = u.color || "";
  document.getElementById("staffPillAvatar").style.color        = "#0a0a0a";
  document.getElementById("staffPillName").textContent          = u.name;
  document.getElementById("staffPillRole").textContent          = u.role === "admin" ? "Müdür" : "Barista";

  // Admin-only butonları göster/gizle
  ["nav-barista","nav-reports","nav-menu","nav-coupons","nav-settings"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = u.role === "admin" ? "flex" : "none";
  });

  switchView("pos");
}

function logout() {
  SessionDB.clear();
  currentUser = null;
  cart = [];
  selectedTable = null;
  appliedCoupon = null;
  showLockScreen();
}

/* ══════════════════════════════════════════════════════
   VIEW SWITCHING
══════════════════════════════════════════════════════ */
const VIEWS = ["pos","tables","barista","reports","menu","coupons","settings"];

function switchView(v) {
  if (currentUser && currentUser.role !== "admin" && !["pos","tables"].includes(v)) {
    showToast("Bu alana erişim yetkiniz yok.", "red");
    return;
  }
  VIEWS.forEach(name => {
    const el = document.getElementById("view-" + name);
    if (el) el.style.display = name === v ? "flex" : "none";
    const nb = document.getElementById("nav-" + name);
    if (nb) nb.classList.toggle("active", name === v);
  });

  if (v === "pos")      { renderPos(); }
  if (v === "tables")   { renderTables(); }
  if (v === "barista")  { renderBarista(); }
  if (v === "reports")  { renderReports(); }
  if (v === "menu")     { currentMenuCat = ""; renderMenuManage(); }
  if (v === "coupons")  { renderCoupons(); }
}

/* ══════════════════════════════════════════════════════
   POS VIEW
══════════════════════════════════════════════════════ */
function renderPos() {
  renderCatTabs();
  renderProductGrid();
  renderOrderPanel();
}

function renderCatTabs() {
  const cats = ["Tümü", ...MenuDB.getCategories()];
  const container = document.getElementById("catTabs");
  if (!container) return;
  container.innerHTML = cats.map(c => {
    const count = c === "Tümü" ? MenuDB.getAll().length : MenuDB.getByCategory(c).length;
    return `<button class="cat-tab ${c === activeCat ? "active" : ""}" onclick="setCat('${c}')">
      ${c} <span class="cat-count">${count}</span>
    </button>`;
  }).join("");
}

function setCat(cat) {
  activeCat = cat;
  renderCatTabs();
  renderProductGrid();
}

function filterProducts() {
  renderProductGrid();
}

function renderProductGrid() {
  const search = (document.getElementById("posSearch")?.value || "").toLowerCase();
  let items = activeCat === "Tümü" ? MenuDB.getAll() : MenuDB.getByCategory(activeCat);
  if (search) items = items.filter(p => p.name.toLowerCase().includes(search) || p.desc.toLowerCase().includes(search));
  const grid = document.getElementById("productGrid");
  if (!grid) return;
  if (items.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text3);font-size:13px;">
      <div style="font-size:32px;margin-bottom:8px;">🔍</div>Ürün bulunamadı</div>`;
    return;
  }
  grid.innerHTML = items.map(p => `
    <div class="product-card ${p.available === false ? "unavailable" : ""}" onclick="addToCart(${p.id})">
      <div class="card-top-row">
        <span class="product-emoji">${p.emoji}</span>
        ${p.popular ? '<span class="popular-badge">⭐ Popüler</span>' : ""}
      </div>
      <div class="product-name">${p.name}</div>
      <div class="product-desc">${p.desc}</div>
      <div class="card-footer">
        <span class="product-price">${p.price} ₺</span>
        <button class="add-btn" onclick="event.stopPropagation();addToCart(${p.id})">+</button>
      </div>
    </div>
  `).join("");
}

function addToCart(productId) {
  const p = MenuDB.getById(productId);
  if (!p) return;
  const existing = cart.find(i => i.id === productId);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id: p.id, name: p.name, emoji: p.emoji, price: p.price, qty: 1 });
  }
  renderOrderPanel();
  showToast(`${p.emoji} ${p.name} eklendi`);
}

function changeQty(productId, delta) {
  const idx = cart.findIndex(i => i.id === productId);
  if (idx < 0) return;
  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  renderOrderPanel();
}

function clearOrder() {
  cart = [];
  appliedCoupon = null;
  renderOrderPanel();
}

function selectTable() {
  switchView("tables");
}

function renderOrderPanel() {
  // Sipariş no
  const settings = DB.get(DB_KEYS.SETTINGS) || { orderCounter:40 };
  document.getElementById("orderBadge").textContent = "#" + (settings.orderCounter + 1);

  // Seçili masa
  const tableLabel = document.getElementById("selectedTableLabel");
  if (tableLabel) {
    tableLabel.textContent = selectedTable
      ? `Masa ${selectedTable.num} — ${selectedTable.zone}`
      : "Masa Seçilmedi";
  }

  // Liste
  const list = document.getElementById("orderList");
  if (!list) return;
  if (cart.length === 0) {
    list.innerHTML = `<div class="order-empty"><div class="order-empty-icon">🛒</div><p>Sepet boş</p></div>`;
  } else {
    list.innerHTML = cart.map(item => `
      <div class="order-item">
        <span class="oi-emoji">${item.emoji}</span>
        <div class="oi-info">
          <div class="oi-name">${item.name}</div>
          <div class="oi-price">${(item.price * item.qty).toFixed(2)} ₺</div>
        </div>
        <div class="oi-qty">
          <button class="qty-btn minus" onclick="changeQty(${item.id},-1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty(${item.id},1)">+</button>
        </div>
      </div>
    `).join("");
  }

  // Toplamlar
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === "percent") {
      discount = subtotal * appliedCoupon.value / 100;
    } else {
      discount = Math.min(appliedCoupon.value, subtotal);
    }
  }
  const total = Math.max(0, subtotal - discount);

  document.getElementById("subtotalDisplay").textContent = subtotal.toFixed(2) + " ₺";
  document.getElementById("totalDisplay").textContent    = total.toFixed(2) + " ₺";
  document.getElementById("confirmTotal").textContent    = total.toFixed(2) + " ₺";

  const discountRow = document.getElementById("discountRow");
  if (discountRow) {
    discountRow.style.display = discount > 0 ? "flex" : "none";
    document.getElementById("discountDisplay").textContent = "- " + discount.toFixed(2) + " ₺";
  }

  document.getElementById("confirmBtn").disabled = cart.length === 0;
}

/* ── Ödeme yöntemi ─────────────────────────────────── */
function selectPayment(method) {
  paymentMethod = method;
  ["cash","card","split"].forEach(m => {
    document.getElementById("pm-" + m)?.classList.toggle("active", m === method);
  });
}

/* ── İndirim / Kupon ───────────────────────────────── */
function toggleDiscount() {
  const box = document.getElementById("discountBox");
  if (box) box.style.display = box.style.display === "none" ? "block" : "none";
}

function applyCoupon() {
  const code = document.getElementById("couponInput")?.value.trim().toUpperCase();
  const msg  = document.getElementById("couponMsg");
  if (!code) return;

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const c = CouponDB.getByCode(code);

  if (!c) {
    if (msg) { msg.textContent = "❌ Geçersiz veya pasif kupon."; msg.style.color = "var(--red)"; }
    return;
  }
  if (c.min && subtotal < c.min) {
    if (msg) { msg.textContent = `⚠️ Min. ${c.min} ₺ sepet gerekli.`; msg.style.color = "var(--orange)"; }
    return;
  }
  if (c.limit && c.usedCount >= c.limit) {
    if (msg) { msg.textContent = "❌ Kupon kullanım limitine ulaşıldı."; msg.style.color = "var(--red)"; }
    return;
  }

  appliedCoupon = c;
  if (msg) {
    const disc = c.type === "percent" ? `%${c.value} indirim` : `${c.value} ₺ indirim`;
    msg.textContent = `✅ ${disc} uygulandı!`;
    msg.style.color = "var(--green)";
  }
  const removeBtn = document.getElementById("removeDiscount");
  if (removeBtn) removeBtn.style.display = "inline-block";
  renderOrderPanel();
}

function removeDiscount() {
  appliedCoupon = null;
  const inp = document.getElementById("couponInput");
  const msg = document.getElementById("couponMsg");
  const btn = document.getElementById("removeDiscount");
  if (inp) inp.value = "";
  if (msg) msg.textContent = "";
  if (btn) btn.style.display = "none";
  renderOrderPanel();
}

/* ── Siparişi Onayla ──────────────────────────────── */
function confirmOrder() {
  if (cart.length === 0) return;

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  let discount = 0;
  if (appliedCoupon) {
    discount = appliedCoupon.type === "percent"
      ? subtotal * appliedCoupon.value / 100
      : Math.min(appliedCoupon.value, subtotal);
  }
  const total = Math.max(0, subtotal - discount);
  const orderNum = OrderDB.nextCounter();
  const note = document.getElementById("orderNote")?.value || "";

  const order = {
    id: "ord_" + Date.now(),
    num: orderNum,
    tableId: selectedTable?.id || null,
    tableLabel: selectedTable ? `Masa ${selectedTable.num}` : "Paket",
    items: cart.map(i => ({ ...i })),
    subtotal,
    discount,
    total,
    paymentMethod,
    couponCode: appliedCoupon?.code || null,
    note,
    status: "pending",
    createdAt: new Date().toISOString(),
    userId: currentUser?.id || null,
  };

  OrderDB.add(order);

  // Masa durumunu güncelle
  if (selectedTable) {
    TableDB.update(selectedTable.id, { status:"occupied", activeOrderId: order.id });
  }

  // Kupon kullanım sayısını artır
  if (appliedCoupon) CouponDB.use(appliedCoupon.code);

  // Başarı modalı
  document.getElementById("successOrderNum").textContent = "#" + orderNum;
  document.getElementById("successDetails").innerHTML =
    `${order.tableLabel} &nbsp;|&nbsp; ${cart.reduce((s,i)=>s+i.qty,0)} ürün<br>
     <strong style="color:var(--accent);font-family:'Syne',sans-serif;font-size:18px">${total.toFixed(2)} ₺</strong>
     &nbsp;(${paymentMethod === "cash" ? "Nakit" : paymentMethod === "card" ? "Kart" : "Bölüşüm"})`;
  openModal("successModal");

  // Sepeti temizle
  cart = [];
  appliedCoupon = null;
  selectedTable = null;
  if (document.getElementById("orderNote")) document.getElementById("orderNote").value = "";
  renderOrderPanel();
  updateCouponNavBadge();
}

/* ══════════════════════════════════════════════════════
   TABLES VIEW
══════════════════════════════════════════════════════ */
function renderTables() {
  const body = document.getElementById("tablesBody");
  if (!body) return;
  const tables = TableDB.getAll();
  const zones  = [...new Set(tables.map(t => t.zone))];

  body.innerHTML = zones.map(zone => {
    const zoneTables = tables.filter(t => t.zone === zone);
    return `
      <div class="zone-section">
        <div class="zone-title"><i class="fa-solid fa-location-dot"></i> ${zone}</div>
        <div class="tables-grid">
          ${zoneTables.map(t => tableCardHTML(t)).join("")}
        </div>
      </div>
    `;
  }).join("");
}

function tableCardHTML(t) {
  let statusLabel = "Boş";
  let statusClass = "free";
  let totalText   = "";

  if (t.status === "occupied") {
    statusLabel = "Dolu"; statusClass = "occupied";
    const order = t.activeOrderId ? OrderDB.getById(t.activeOrderId) : null;
    if (order) totalText = `<div class="table-total">${order.total.toFixed(2)} ₺</div>`;
  } else if (t.status === "waiting") {
    statusLabel = "Bekliyor"; statusClass = "waiting";
  }

  return `
    <div class="table-card ${statusClass}" onclick="onTableClick('${t.id}')">
      <div class="table-capacity"><i class="fa-solid fa-user"></i>${t.cap}</div>
      <div class="table-num">${t.num}</div>
      <div class="table-status ${statusClass}">${statusLabel}</div>
      ${totalText}
    </div>
  `;
}

function onTableClick(tableId) {
  const t = TableDB.getById(tableId);
  if (!t) return;

  // POS'tan masa seçme modunda mı?
  const fromPOS = window._selectingTable;
  if (fromPOS) {
    selectedTable = t;
    window._selectingTable = false;
    switchView("pos");
    renderOrderPanel();
    showToast(`Masa ${t.num} seçildi (${t.zone})`);
    return;
  }

  // Dolu masaya tıklandığında sipariş detayı göster
  if (t.status === "occupied" && t.activeOrderId) {
    showTableDetail(t);
  } else {
    // Boş masayı POS'ta seç
    selectedTable = t;
    switchView("pos");
    renderOrderPanel();
    showToast(`Masa ${t.num} seçildi`);
  }
}

function showTableDetail(t) {
  const order = OrderDB.getById(t.activeOrderId);
  if (!order) return;

  const body = document.getElementById("tableDetailBody");
  const titleEl = document.getElementById("tableDetailTitle");
  if (titleEl) titleEl.textContent = `Masa ${t.num} — ${t.zone}`;

  if (body) {
    body.innerHTML = `
      <div style="padding:20px 24px;border-bottom:var(--border);display:flex;align-items:center;gap:10px;">
        <span style="font-family:'Syne',sans-serif;font-size:15px;font-weight:700;color:var(--accent);">#${order.num}</span>
        <span style="font-size:12px;color:var(--text3);">${new Date(order.createdAt).toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"})}</span>
        <span style="font-size:11px;background:var(--orange-bg);color:var(--orange);padding:2px 8px;border-radius:6px;font-weight:600;">Dolu</span>
      </div>
      <div style="padding:12px 24px;flex:1;overflow-y:auto;">
        ${order.items.map(i => `
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--bg3);font-size:13px;color:var(--text2);">
            <span>${i.emoji} ${i.name} <span style="color:var(--text3)">×${i.qty}</span></span>
            <span style="color:var(--text)">${(i.price * i.qty).toFixed(2)} ₺</span>
          </div>
        `).join("")}
        ${order.note ? `<div style="background:var(--orange-bg);color:var(--orange);font-size:12px;padding:8px 12px;border-radius:8px;margin-top:10px;font-style:italic;">📝 ${order.note}</div>` : ""}
      </div>
      <div style="padding:12px 24px;border-top:var(--border);">
        <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--text2);margin-bottom:4px;">
          <span>Ara Toplam</span><span>${order.subtotal.toFixed(2)} ₺</span>
        </div>
        ${order.discount > 0 ? `<div style="display:flex;justify-content:space-between;font-size:13px;color:var(--green);margin-bottom:4px;"><span>İndirim</span><span>- ${order.discount.toFixed(2)} ₺</span></div>` : ""}
        <div style="display:flex;justify-content:space-between;font-family:'Syne',sans-serif;font-size:16px;font-weight:700;color:var(--text);padding-top:8px;border-top:1px solid var(--bg5);">
          <span>Toplam</span><span style="color:var(--accent)">${order.total.toFixed(2)} ₺</span>
        </div>
      </div>
      <div style="padding:12px 24px 20px;border-top:var(--border);display:flex;gap:10px;">
        <button class="modal-btn secondary" style="flex:1" onclick="closeModal('tableDetailModal')">Kapat</button>
        <button class="modal-btn accent" style="flex:1" onclick="closeTableAndClear('${t.id}','${order.id}')">
          <i class="fa-solid fa-check"></i> Masayı Kapat
        </button>
      </div>
    `;
  }
  openModal("tableDetailModal");
}

function closeTableAndClear(tableId, orderId) {
  TableDB.update(tableId, { status:"free", activeOrderId:null });
  OrderDB.update(orderId, { status:"delivered", closedAt: new Date().toISOString() });
  closeModal("tableDetailModal");
  renderTables();
  showToast("Masa kapatıldı ✓");
}

/* ══════════════════════════════════════════════════════
   BARISTA VIEW (Kanban)
══════════════════════════════════════════════════════ */
function renderBarista() {
  const statuses = ["pending","preparing","ready","delivered"];
  const labels   = { pending:"Bekliyor", preparing:"Hazırlanıyor", ready:"Hazır", delivered:"Teslim Edildi" };
  const icons    = { pending:"fa-clock", preparing:"fa-fire", ready:"fa-check-circle", delivered:"fa-circle-check" };

  // Bugünün siparişleri
  const orders = OrderDB.getToday();

  statuses.forEach(status => {
    const col     = document.getElementById("queue-" + status);
    const countEl = document.getElementById("count-" + status);
    if (!col) return;

    const filtered = orders.filter(o => o.status === status);
    if (countEl) countEl.textContent = filtered.length;

    if (filtered.length === 0) {
      col.innerHTML = `<div class="barista-empty">Sipariş yok</div>`;
      return;
    }

    col.innerHTML = filtered.map(o => {
      const time = new Date(o.createdAt).toLocaleTimeString("tr-TR", {hour:"2-digit",minute:"2-digit"});
      const itemsHTML = o.items.map(i =>
        `<div class="ticket-item"><span>${i.emoji} ${i.name}</span><span>×${i.qty}</span></div>`
      ).join("");
      const actions = baristaActions(o);
      return `
        <div class="barista-ticket">
          <div class="ticket-top">
            <span class="ticket-order">#${o.num}</span>
            <span class="ticket-table">${o.tableLabel}</span>
          </div>
          <div class="ticket-time"><i class="fa-regular fa-clock"></i>${time}</div>
          ${itemsHTML}
          ${o.note ? `<div class="ticket-note">📝 ${o.note}</div>` : ""}
          <div class="ticket-action">${actions}</div>
        </div>
      `;
    }).join("");
  });
}

function baristaActions(o) {
  switch (o.status) {
    case "pending":
      return `<button class="ticket-btn primary" onclick="updateOrderStatus('${o.id}','preparing');renderBarista()">Hazırlamaya Başla</button>`;
    case "preparing":
      return `<button class="ticket-btn primary" onclick="updateOrderStatus('${o.id}','ready');renderBarista()">Hazır İşaretle</button>`;
    case "ready":
      return `<button class="ticket-btn primary" onclick="updateOrderStatus('${o.id}','delivered');renderBarista()">Teslim Edildi</button>`;
    default:
      return "";
  }
}

function updateOrderStatus(orderId, status) {
  OrderDB.update(orderId, { status });
  if (status === "delivered") {
    const order = OrderDB.getById(orderId);
    if (order?.tableId) {
      TableDB.update(order.tableId, { status:"free", activeOrderId:null });
    }
  }
}

/* ══════════════════════════════════════════════════════
   REPORTS VIEW
══════════════════════════════════════════════════════ */
function renderReports() {
  const orders = OrderDB.getToday().filter(o => o.status !== "cancelled");
  const total  = orders.reduce((s, o) => s + (o.total || 0), 0);
  const count  = orders.length;
  const avg    = count ? total / count : 0;
  const items  = orders.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.qty, 0), 0);

  // Stat kartları
  const statCards = document.getElementById("reportStats");
  if (statCards) {
    statCards.innerHTML = `
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--accent-bg);color:var(--accent)"><i class="fa-solid fa-turkish-lira-sign"></i></div>
        <div class="stat-info"><div class="stat-label">Günlük Ciro</div><div class="stat-val">${total.toLocaleString("tr-TR",{minimumFractionDigits:2})} ₺</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--blue-bg);color:var(--blue)"><i class="fa-solid fa-receipt"></i></div>
        <div class="stat-info"><div class="stat-label">Sipariş Sayısı</div><div class="stat-val">${count}</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--green-bg);color:var(--green)"><i class="fa-solid fa-chart-bar"></i></div>
        <div class="stat-info"><div class="stat-label">Ort. Sepet</div><div class="stat-val">${avg.toFixed(2)} ₺</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--purple-bg);color:var(--purple)"><i class="fa-solid fa-box"></i></div>
        <div class="stat-info"><div class="stat-label">Satılan Ürün</div><div class="stat-val">${items}</div></div>
      </div>
    `;
  }

  // Saatlik bar chart (demo verisi + gerçek verisi karışık)
  renderBarChart(orders);

  // Kategori donut
  renderDonut(orders);

  // Son siparişler
  renderOrderHistory(orders);
}

function renderBarChart(orders) {
  const container = document.getElementById("barChart");
  if (!container) return;
  const hours = Array.from({length:12}, (_,i) => i + 8); // 08-19
  const data = hours.map(h => {
    return orders.filter(o => new Date(o.createdAt).getHours() === h)
      .reduce((s, o) => s + o.total, 0);
  });
  const max = Math.max(...data, 1);
  container.innerHTML = hours.map((h, i) => {
    const pct = (data[i] / max * 100).toFixed(1);
    const isPeak = data[i] === Math.max(...data) && data[i] > 0;
    return `
      <div class="bar-col">
        <div class="bar-val">${data[i] > 0 ? data[i].toFixed(0) : ""}</div>
        <div class="bar-fill ${isPeak ? "peak" : ""}" style="height:${pct}%"></div>
        <div class="bar-label">${h}:00</div>
      </div>
    `;
  }).join("");
}

function renderDonut(orders) {
  const container = document.getElementById("donutWrap");
  if (!container) return;

  // Kategoriye göre gelir
  const catRevenue = {};
  orders.forEach(o => {
    o.items.forEach(item => {
      const product = MenuDB.getById(item.id);
      const cat = product?.cat || "Diğer";
      catRevenue[cat] = (catRevenue[cat] || 0) + item.price * item.qty;
    });
  });

  const total   = Object.values(catRevenue).reduce((s, v) => s + v, 0) || 1;
  const sorted  = Object.entries(catRevenue).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const colors  = ["#C8A96E","#4CAF7A","#9B8FE0","#E89843","#5B9CF6"];

  if (sorted.length === 0) {
    container.innerHTML = `<div style="color:var(--text3);font-size:13px;text-align:center;padding:20px;">Henüz veri yok</div>`;
    return;
  }

  // SVG donut
  let offset = 0;
  const circumference = 2 * Math.PI * 40;
  const segments = sorted.map(([ cat, rev ], i) => {
    const pct   = rev / total;
    const dash  = pct * circumference;
    const gap   = circumference - dash;
    const seg   = `<circle cx="50" cy="50" r="40" fill="none" stroke="${colors[i]}" stroke-width="14"
      stroke-dasharray="${dash.toFixed(2)} ${gap.toFixed(2)}"
      stroke-dashoffset="${(-offset * circumference).toFixed(2)}"
      transform="rotate(-90 50 50)" opacity="0.85"/>`;
    offset += pct;
    return seg;
  });

  const svg = `<svg viewBox="0 0 100 100" style="width:120px;height:120px;flex-shrink:0">
    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--bg4)" stroke-width="14"/>
    ${segments.join("")}
  </svg>`;

  const legend = `<div class="donut-legend">
    ${sorted.map(([cat, rev], i) => `
      <div class="legend-item">
        <span class="legend-color" style="background:${colors[i]}"></span>
        <span class="legend-name">${cat}</span>
        <span class="legend-pct">${(rev/total*100).toFixed(0)}%</span>
      </div>
    `).join("")}
  </div>`;

  container.innerHTML = svg + legend;
}

function renderOrderHistory(orders) {
  const container = document.getElementById("orderHistory");
  if (!container) return;
  const recent = [...orders].reverse().slice(0, 8);
  if (recent.length === 0) {
    container.innerHTML = `<div style="text-align:center;color:var(--text3);font-size:13px;padding:24px;">Bugün sipariş yok</div>`;
    return;
  }
  container.innerHTML = recent.map(o => `
    <div class="history-item">
      <span class="history-num">#${o.num}</span>
      <div class="history-info">
        <div class="history-table">${o.tableLabel}</div>
        <div class="history-items">${o.items.map(i => `${i.emoji}×${i.qty}`).join(" ")}</div>
      </div>
      <div class="history-right">
        <div class="history-total">${o.total.toFixed(2)} ₺</div>
        <div class="history-method">${o.paymentMethod === "cash" ? "Nakit" : o.paymentMethod === "card" ? "Kart" : "Bölüşüm"}</div>
      </div>
    </div>
  `).join("");
}

/* ══════════════════════════════════════════════════════
   MENU MANAGE VIEW
══════════════════════════════════════════════════════ */
function renderMenuManage() {
  const cats   = MenuDB.getCategories();
  const catList = document.getElementById("mmCatList");
  if (catList) {
    catList.innerHTML = cats.map(c => `
      <button class="mm-cat-btn ${currentMenuCat === c ? "active" : ""}" onclick="setMenuCat('${c}')">
        ${c}
        <span class="mm-cat-count">${MenuDB.getByCategory(c).length}</span>
      </button>
    `).join("");
  }

  const items = currentMenuCat ? MenuDB.getByCategory(currentMenuCat) : MenuDB.getAll();
  const list  = document.getElementById("mmProductList");
  if (!list) return;
  list.innerHTML = items.map(p => `
    <div class="mm-product-row">
      <span class="mm-emoji">${p.emoji}</span>
      <div class="mm-info">
        <div class="mm-name">${p.name} ${p.popular ? "⭐" : ""}</div>
        <div class="mm-desc">${p.desc} — <em>${p.cat}</em></div>
      </div>
      <span class="mm-price">${p.price} ₺</span>
      <div class="mm-actions">
        <label class="toggle-switch" title="${p.available !== false ? "Aktif" : "Pasif"}">
          <input type="checkbox" ${p.available !== false ? "checked" : ""} onchange="toggleProductAvail(${p.id},this.checked)">
          <span class="toggle-slider"></span>
        </label>
        <button class="mm-edit-btn" onclick="openEditProduct(${p.id})" title="Düzenle"><i class="fa-solid fa-pen"></i></button>
        <button class="mm-edit-btn mm-del-btn" onclick="deleteProduct(${p.id})" title="Sil"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
  `).join("");
}

function setMenuCat(cat) {
  currentMenuCat = cat;
  renderMenuManage();
}

function toggleProductAvail(id, val) {
  MenuDB.update(id, { available: val });
  showToast(val ? "Ürün aktif edildi ✓" : "Ürün pasife alındı");
}

function deleteProduct(id) {
  const p = MenuDB.getById(id);
  if (!p) return;
  if (!confirm(`"${p.name}" silinsin mi?`)) return;
  MenuDB.delete(id);
  renderMenuManage();
  showToast("Ürün silindi");
}

function openAddProduct() {
  editingProductId = null;
  document.getElementById("productModalTitle").textContent = "Yeni Ürün Ekle";
  document.getElementById("editEmoji").value   = "";
  document.getElementById("editName").value    = "";
  document.getElementById("editDesc").value    = "";
  document.getElementById("editPrice").value   = "";
  document.getElementById("editPopular").checked = false;
  populateEditCatSelect();
  openModal("addProductModal");
}

function openEditProduct(id) {
  const p = MenuDB.getById(id);
  if (!p) return;
  editingProductId = id;
  document.getElementById("productModalTitle").textContent = "Ürünü Düzenle";
  document.getElementById("editEmoji").value    = p.emoji;
  document.getElementById("editName").value     = p.name;
  document.getElementById("editDesc").value     = p.desc;
  document.getElementById("editPrice").value    = p.price;
  document.getElementById("editPopular").checked = p.popular;
  populateEditCatSelect(p.cat);
  openModal("addProductModal");
}

function populateEditCatSelect(selectedCat = "") {
  const sel = document.getElementById("editCat");
  if (!sel) return;
  const cats = MenuDB.getCategories();
  sel.innerHTML = cats.map(c =>
    `<option value="${c}" ${c === selectedCat ? "selected" : ""}>${c}</option>`
  ).join("") + `<option value="__new__">+ Yeni Kategori...</option>`;
}

function saveProduct() {
  const emoji   = document.getElementById("editEmoji").value.trim() || "☕";
  const name    = document.getElementById("editName").value.trim();
  const desc    = document.getElementById("editDesc").value.trim();
  const price   = parseFloat(document.getElementById("editPrice").value);
  const popular = document.getElementById("editPopular").checked;
  let   cat     = document.getElementById("editCat").value;

  if (!name || isNaN(price)) { showToast("Ad ve fiyat zorunludur!", "red"); return; }

  if (cat === "__new__") {
    cat = prompt("Yeni kategori adı:");
    if (!cat) return;
  }

  if (editingProductId) {
    MenuDB.update(editingProductId, { emoji, name, desc, price, popular, cat, available:true });
    showToast("Ürün güncellendi ✓");
  } else {
    MenuDB.add({ emoji, name, desc, price, popular, cat, available:true });
    showToast("Ürün eklendi ✓");
  }
  closeModal("addProductModal");
  renderMenuManage();
}

/* ══════════════════════════════════════════════════════
   COUPON VIEW
══════════════════════════════════════════════════════ */
function renderCoupons() {
  renderCouponStats();
  renderCouponList();
}

function renderCouponStats() {
  const all    = CouponDB.getAll();
  const active = all.filter(c => c.active).length;
  const total  = all.length;
  const used   = all.reduce((s, c) => s + (c.usedCount || 0), 0);

  const container = document.getElementById("cpStats");
  if (!container) return;
  container.innerHTML = `
    <div class="cp-stat">
      <div class="cp-stat-icon" style="background:var(--accent-bg);color:var(--accent)"><i class="fa-solid fa-ticket"></i></div>
      <div><div class="cp-stat-val">${total}</div><div class="cp-stat-label">Toplam Kupon</div></div>
    </div>
    <div class="cp-stat">
      <div class="cp-stat-icon" style="background:var(--green-bg);color:var(--green)"><i class="fa-solid fa-check-circle"></i></div>
      <div><div class="cp-stat-val">${active}</div><div class="cp-stat-label">Aktif</div></div>
    </div>
    <div class="cp-stat">
      <div class="cp-stat-icon" style="background:var(--orange-bg);color:var(--orange)"><i class="fa-solid fa-ban"></i></div>
      <div><div class="cp-stat-val">${total - active}</div><div class="cp-stat-label">Pasif</div></div>
    </div>
    <div class="cp-stat">
      <div class="cp-stat-icon" style="background:var(--blue-bg);color:var(--blue)"><i class="fa-solid fa-fire"></i></div>
      <div><div class="cp-stat-val">${used}</div><div class="cp-stat-label">Toplam Kullanım</div></div>
    </div>
  `;
}

function setCpType(type) {
  document.getElementById("cpType").value = type;
  document.getElementById("cpTypePct").classList.toggle("active", type === "percent");
  document.getElementById("cpTypeFixed").classList.toggle("active", type === "fixed");
  updateCpPreview();
}

function updateCpPreview() {
  const code  = document.getElementById("cpCode")?.value || "";
  const type  = document.getElementById("cpType")?.value || "percent";
  const value = parseFloat(document.getElementById("cpValue")?.value) || 0;
  const badge = document.getElementById("cpPreviewBadge");
  const info  = document.getElementById("cpPreviewInfo");
  if (!badge || !info) return;

  if (code && value > 0) {
    badge.textContent = type === "percent" ? `%${value}` : `${value}₺`;
    info.innerHTML = `<b style="color:var(--text2)">${code}</b> kodu ile <b style="color:var(--text2)">${type === "percent" ? `%${value} indirim` : `${value} ₺ indirim`}</b>`;
  } else {
    badge.textContent = "—";
    info.textContent  = "Kod ve değer girerek önizleme görün.";
  }
}

function addCoupon() {
  const code   = document.getElementById("cpCode")?.value.trim().toUpperCase();
  const type   = document.getElementById("cpType")?.value || "percent";
  const value  = parseFloat(document.getElementById("cpValue")?.value);
  const min    = parseFloat(document.getElementById("cpMin")?.value) || 0;
  const limit  = parseInt(document.getElementById("cpLimit")?.value) || null;
  const desc   = document.getElementById("cpDesc")?.value.trim();
  const expiry = document.getElementById("cpExpiry")?.value;

  if (!code)              { showToast("Kupon kodu zorunludur!", "red"); return; }
  if (!value || value<=0) { showToast("Geçerli bir indirim değeri girin!", "red"); return; }
  if (CouponDB.getAll().find(c => c.code === code)) { showToast("Bu kod zaten mevcut!", "red"); return; }

  CouponDB.add({ code, type, value, min, limit, desc, expiry });
  ["cpCode","cpValue","cpMin","cpLimit","cpDesc","cpExpiry"].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = "";
  });
  updateCpPreview();
  renderCoupons();
  updateCouponNavBadge();
  showToast("Kupon eklendi ✓");
}

function setCpFilter(f) {
  cpCurrentFilter = f;
  ["all","active","inactive"].forEach(id => {
    document.getElementById("filter-" + id)?.classList.toggle("active", id === f);
  });
  renderCouponList();
}

function renderCouponList() {
  const list = document.getElementById("couponListBody");
  if (!list) return;

  let all = CouponDB.getAll();
  if (cpCurrentFilter === "active")   all = all.filter(c => c.active);
  if (cpCurrentFilter === "inactive") all = all.filter(c => !c.active);

  const badge = document.getElementById("cpCountBadge");
  if (badge) badge.textContent = CouponDB.getAll().length + " kupon";

  if (all.length === 0) {
    list.innerHTML = `<div class="cp-empty"><div class="cp-empty-icon">🎟️</div><p>Kupon bulunamadı</p></div>`;
    return;
  }

  const today = new Date().toISOString().slice(0,10);
  list.innerHTML = all.map(c => {
    const isExpired = c.expiry && c.expiry < today;
    const typeClass = c.type === "percent" ? "pct" : "fixed";
    const valLabel  = c.type === "percent" ? `%${c.value}` : `${c.value}₺`;
    const statusText = !c.active ? "Pasif" : isExpired ? "Süresi Dolmuş" : "Aktif";
    const statusClass = !c.active ? "status-inactive" : isExpired ? "status-expired" : "status-active";

    return `
      <div class="cp-card ${!c.active ? "inactive" : ""}">
        <div class="cp-card-main">
          <div class="cp-card-band ${c.active ? typeClass : "inactive"}"></div>
          <div class="cp-card-code">
            <div class="cp-card-code-text">${c.code}</div>
            <div class="cp-card-code-sub">${c.type === "percent" ? "Yüzde" : "Sabit"}</div>
          </div>
          <div class="cp-card-details">
            <div class="cp-card-row1">
              <span class="cp-badge type-${typeClass}">${c.type === "percent" ? "%" : "₺"} indirim</span>
              <span class="cp-badge ${statusClass}">${statusText}</span>
            </div>
            <div class="cp-card-desc">${c.desc || "Açıklama yok"}</div>
            <div class="cp-card-meta">
              ${c.min > 0 ? `<span><i class="fa-solid fa-cart-shopping"></i>Min. ${c.min}₺</span>` : ""}
              <span><i class="fa-solid fa-fire"></i>${c.usedCount || 0}${c.limit ? "/" + c.limit : ""} kullanım</span>
              ${c.expiry ? `<span><i class="fa-regular fa-calendar"></i>${c.expiry}</span>` : ""}
            </div>
          </div>
          <div class="cp-card-value">
            <div class="cp-card-value-num ${typeClass}">${valLabel}</div>
            <div class="cp-card-value-label">indirim</div>
          </div>
          <div class="cp-card-actions">
            <button class="cp-action-btn ${c.active ? "toggle-on" : "toggle-off"}" onclick="toggleCoupon('${c.id}')" title="${c.active ? "Pasife Al" : "Aktif Et"}">
              <i class="fa-solid ${c.active ? "fa-eye" : "fa-eye-slash"}"></i>
            </button>
            <button class="cp-action-btn delete" onclick="deleteCoupon('${c.id}')" title="Sil">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function toggleCoupon(id) {
  CouponDB.toggle(id);
  renderCoupons();
  updateCouponNavBadge();
}
function deleteCoupon(id) {
  if (!confirm("Bu kuponu silmek istediğinize emin misiniz?")) return;
  CouponDB.delete(id);
  renderCoupons();
  updateCouponNavBadge();
  showToast("Kupon silindi");
}

function updateCouponNavBadge() {
  const badge = document.getElementById("couponNavBadge");
  if (!badge) return;
  const count = CouponDB.getAll().filter(c => c.active).length;
  badge.textContent = count;
  badge.style.display = count > 0 ? "flex" : "none";
}

/* ══════════════════════════════════════════════════════
   MODAL HELPERS
══════════════════════════════════════════════════════ */
function openModal(id)  { document.getElementById(id)?.classList.add("open"); }
function closeModal(id) { document.getElementById(id)?.classList.remove("open"); }

/* ══════════════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════════════ */
let _toastTimer = null;
function showToast(msg, color = "green") {
  const toast = document.getElementById("toast");
  const dot   = document.getElementById("toastDot");
  const span  = document.getElementById("toastMsg");
  if (!toast) return;
  if (span) span.textContent = msg;
  if (dot)  dot.style.background = color === "red" ? "var(--red)" : color === "orange" ? "var(--orange)" : "var(--green)";
  toast.classList.add("show");
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toast.classList.remove("show"), 2500);
}

/* ══════════════════════════════════════════════════════
   RECEIPT
══════════════════════════════════════════════════════ */
function printReceipt() {
  closeModal("successModal");
  showToast("Fiş yazdırılıyor... 🖨️");
}
