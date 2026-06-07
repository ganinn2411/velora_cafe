/* ═══════════════════════════════════════════════════════
   AURA Coffee & Kitchen — POS System Logic
   app.js — All application state, data & UI interactions
═══════════════════════════════════════════════════════ */

"use strict";

/* ── MENU DATA ────────────────────────────────────────── */
const MENU = {
  "Espresso Bazlı": [
    { id:1,  emoji:"☕", name:"Espresso",       price:65,  desc:"Yoğun, saf espresso",          popular:false },
    { id:2,  emoji:"🖤", name:"Americano",      price:75,  desc:"Espresso + sıcak su",           popular:true  },
    { id:3,  emoji:"🤍", name:"Cappuccino",     price:95,  desc:"Espresso + köpüklü süt",        popular:true  },
    { id:4,  emoji:"🥛", name:"Latte",          price:100, desc:"Espresso + buharlanmış süt",    popular:false },
    { id:5,  emoji:"⬜", name:"Flat White",     price:108, desc:"Yoğun espresso + microfoam",    popular:true  },
    { id:6,  emoji:"🟤", name:"Cortado",        price:85,  desc:"Espresso + az süt",             popular:false },
    { id:7,  emoji:"💛", name:"Macchiato",      price:90,  desc:"Espresso + süt köpüğü",         popular:false },
    { id:8,  emoji:"⚫", name:"Long Black",     price:80,  desc:"Çift espresso + sıcak su",      popular:false },
    { id:9,  emoji:"🫗", name:"Ristretto",      price:70,  desc:"Ultra yoğun kısa çekim",        popular:false },
  ],
  "Soğuk Kahve": [
    { id:10, emoji:"🧊", name:"Cold Brew",      price:115, desc:"18 saat demleme, yumuşak",     popular:true  },
    { id:11, emoji:"🥤", name:"Iced Latte",     price:110, desc:"Espresso + soğuk süt + buz",   popular:true  },
    { id:12, emoji:"🌊", name:"Nitro Cold Brew",price:135, desc:"Azotlu, kadifemsi doku",        popular:true  },
    { id:13, emoji:"❄️", name:"Iced Americano", price:85,  desc:"Çift espresso + buz + su",      popular:false },
    { id:14, emoji:"🍯", name:"Dalgona",        price:120, desc:"Çırpılmış kahve + soğuk süt",  popular:false },
    { id:15, emoji:"🍵", name:"Cold Matcha",    price:125, desc:"Matcha + oat milk + buz",       popular:true  },
    { id:16, emoji:"🫧", name:"Sparkling Brew", price:130, desc:"Cold brew + gazsız su köpük",  popular:false },
  ],
  "Özel Tatlar": [
    { id:17, emoji:"🧡", name:"Caramel Latte",  price:120, desc:"Tatlı karamel soslu latte",    popular:true  },
    { id:18, emoji:"🟫", name:"Hazelnut Mocha", price:125, desc:"Fındık + çikolata + espresso", popular:false },
    { id:19, emoji:"🤍", name:"Vanilla Sky",    price:115, desc:"Vanilya + buharlanmış süt",    popular:false },
    { id:20, emoji:"🤎", name:"Brown Sugar Oat",price:130, desc:"Kahverengi şeker + yulaf sütü",popular:true  },
    { id:21, emoji:"💜", name:"Lavender Latte", price:138, desc:"Lavanta şurubu + espresso",    popular:true  },
    { id:22, emoji:"💚", name:"Pistachio Cream",price:145, desc:"Fıstık kreması + espresso",    popular:false },
    { id:23, emoji:"🩷", name:"Rose Latte",     price:132, desc:"Gül suyu + süt + espresso",    popular:false },
  ],
  "Çay & Alternatif": [
    { id:24, emoji:"🍵", name:"Matcha Latte",   price:110, desc:"Seremoni matcha + süt",        popular:true  },
    { id:25, emoji:"🟠", name:"Chai Latte",     price:105, desc:"Baharatlı masala çayı",        popular:false },
    { id:26, emoji:"🌰", name:"Hojicha Latte",  price:115, desc:"Kavrulmuş yeşil çay",          popular:false },
    { id:27, emoji:"🫖", name:"Earl Grey",      price:85,  desc:"Bergamot aromatlı siyah çay",  popular:false },
    { id:28, emoji:"🦋", name:"Butterfly Pea",  price:125, desc:"Renk değiştiren büyülü çay",   popular:true  },
    { id:29, emoji:"🌿", name:"Fresh Mint Tea", price:75,  desc:"Taze nane demlemesi",           popular:false },
    { id:30, emoji:"🍋", name:"Lemon Ginger",   price:80,  desc:"Limon + zencefil demleme",     popular:false },
  ],
  "Atıştırmalık": [
    { id:31, emoji:"🥐", name:"Croissant",      price:90,  desc:"Tereyağlı, çıtır Fransız",     popular:true  },
    { id:32, emoji:"🥑", name:"Avokado Toast",  price:168, desc:"Ekşi maya + avokado + yumurta",popular:true  },
    { id:33, emoji:"🍌", name:"Banana Bread",   price:95,  desc:"Ev yapımı, nemli dilim",        popular:false },
    { id:34, emoji:"🥣", name:"Granola Bowl",   price:125, desc:"Yoğurt + granola + meyve",     popular:false },
    { id:35, emoji:"🍰", name:"Cheesecake",     price:148, desc:"New York tarzı dilim",          popular:true  },
    { id:36, emoji:"🍪", name:"Cookie",         price:55,  desc:"Çikolata parçacıklı",           popular:false },
    { id:37, emoji:"🧁", name:"Muffin",         price:75,  desc:"Yaban mersinli/çikolatalı",    popular:false },
    { id:38, emoji:"🥪", name:"Sandviç",        price:145, desc:"Prosciutto + mozzarella",       popular:false },
  ],
  "Serinletici": [
    { id:39, emoji:"🍋", name:"Limonata",       price:80,  desc:"Taze sıkım + nane",            popular:false },
    { id:40, emoji:"💧", name:"Sparkling Water", price:50, desc:"San Pellegrino 500ml",          popular:false },
    { id:41, emoji:"🫐", name:"Smoothie",       price:138, desc:"Karışık meyve + yoğurt",       popular:true  },
    { id:42, emoji:"🌺", name:"Hibiscus Cooler",price:108, desc:"Hibiskus + limon + buz",       popular:true  },
    { id:43, emoji:"🍓", name:"Berry Lemonade", price:115, desc:"Çilek + ahududu + limon",      popular:false },
    { id:44, emoji:"🥭", name:"Mango Lassi",    price:125, desc:"Mango + yoğurt + hindistan",   popular:false },
  ]
};

/* ── TABLES DATA ──────────────────────────────────────── */
const TABLES_DATA = {
  inner: [
    { id:"I1",  num:1, cap:2, zone:"inner",   status:"free",     total:0, items:[] },
    { id:"I2",  num:2, cap:4, zone:"inner",   status:"occupied", total:285, items:["Iced Latte ×2","Croissant"] },
    { id:"I3",  num:3, cap:4, zone:"inner",   status:"free",     total:0, items:[] },
    { id:"I4",  num:4, cap:6, zone:"inner",   status:"waiting",  total:478, items:["Flat White","Cheesecake ×2","Smoothie"] },
    { id:"I5",  num:5, cap:2, zone:"inner",   status:"free",     total:0, items:[] },
    { id:"I6",  num:6, cap:4, zone:"inner",   status:"occupied", total:165, items:["Americano","Banana Bread"] },
    { id:"I7",  num:7, cap:4, zone:"inner",   status:"free",     total:0, items:[] },
    { id:"I8",  num:8, cap:2, zone:"inner",   status:"occupied", total:95, items:["Cappuccino"] },
  ],
  terrace: [
    { id:"T1",  num:"T1", cap:4, zone:"terrace", status:"free",     total:0,   items:[] },
    { id:"T2",  num:"T2", cap:4, zone:"terrace", status:"occupied", total:340, items:["Cold Brew ×2","Cookie ×2"] },
    { id:"T3",  num:"T3", cap:2, zone:"terrace", status:"free",     total:0,   items:[] },
    { id:"T4",  num:"T4", cap:6, zone:"terrace", status:"occupied", total:580, items:["Lavender Latte ×3","Avokado Toast"] },
    { id:"T5",  num:"T5", cap:4, zone:"terrace", status:"free",     total:0,   items:[] },
  ],
  lounge: [
    { id:"L1", num:"L1", cap:6, zone:"lounge", status:"free",    total:0,   items:[] },
    { id:"L2", num:"L2", cap:4, zone:"lounge", status:"waiting", total:620, items:["Nitro Cold Brew ×2","Cheesecake ×2","Muffin"] },
    { id:"L3", num:"L3", cap:8, zone:"lounge", status:"free",    total:0,   items:[] },
  ]
};

/* ── APP STATE ────────────────────────────────────────── */
const state = {
  currentStaff:    { name: "Barista Efe", role: "barista", avatar: "E" },
  activeView:      "pos",
  activeTable:     null,
  activeCat:       Object.keys(MENU)[0],
  cart:            {},
  payMethod:       "Kart",
  discount:        0,
  discountActive:  false,
  orderCounter:    41,
  orders:          [],
  baristaOrders:   [],
  unavailItems:    new Set(),
  searchQuery:     "",
};

/* ═══════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════ */
window.addEventListener("DOMContentLoaded", () => {
  updateClock();
  setInterval(updateClock, 1000);
  setInterval(updateTopbarMeta, 60000);

  // Seed some demo barista orders
  seedDemoOrders();
});

function updateClock() {
  const now = new Date();
  const timeEl = document.getElementById("topbarTime");
  if (timeEl) {
    timeEl.textContent = now.toLocaleTimeString("tr-TR", { hour:"2-digit", minute:"2-digit" });
  }
  const dateEl = document.getElementById("topbarMeta");
  if (dateEl) {
    dateEl.textContent = now.toLocaleDateString("tr-TR", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
  }
}

function updateTopbarMeta() {
  updateClock();
}

/* ═══════════════════════════════════════════════════════
   LOCK SCREEN
═══════════════════════════════════════════════════════ */
function selectStaff(name, role) {
  const avatarChar = name.split(" ").pop()[0].toUpperCase();
  state.currentStaff = { name, role, avatar: avatarChar };

  document.getElementById("staffName").textContent = name;
  document.getElementById("staffRole").textContent = role.charAt(0).toUpperCase() + role.slice(1);
  document.getElementById("staffAvatar").textContent = avatarChar;

  const lock = document.getElementById("lockScreen");
  const app  = document.getElementById("app");
  lock.style.opacity = "0";
  lock.style.transition = "opacity 0.3s";
  setTimeout(() => { lock.style.display = "none"; }, 300);
  app.style.display = "flex";

  // Init views
  buildCategoryTabs();
  renderProducts();
  renderTables();
  renderReports();
  renderMenuManage();
  renderBaristaBoard();
}

function lockApp() {
  const lock = document.getElementById("lockScreen");
  const app  = document.getElementById("app");
  lock.style.opacity = "0";
  lock.style.display = "flex";
  setTimeout(() => { lock.style.opacity = "1"; lock.style.transition = "opacity 0.3s"; }, 10);
  app.style.display = "none";
}

/* ═══════════════════════════════════════════════════════
   NAVIGATION
═══════════════════════════════════════════════════════ */
function switchView(viewId, btn) {
  // Hide all views
  document.querySelectorAll(".view").forEach(v => v.style.display = "none");
  // Deactivate all nav buttons
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));

  // Show target view
  const view = document.getElementById("view-" + viewId);
  if (view) view.style.display = "flex";
  if (btn) btn.classList.add("active");

  state.activeView = viewId;

  // Refresh views on switch
  if (viewId === "barista") renderBaristaBoard();
  if (viewId === "reports") renderReports();
  if (viewId === "tables")  renderTables();
  if (viewId === "menu-manage") renderMenuManage();
}

/* ═══════════════════════════════════════════════════════
   POS — CATEGORY TABS
═══════════════════════════════════════════════════════ */
function buildCategoryTabs() {
  const cats = Object.keys(MENU);
  const container = document.getElementById("catTabs");
  container.innerHTML = "";

  cats.forEach((cat, i) => {
    const count = MENU[cat].length;
    const btn = document.createElement("button");
    btn.className = "cat-tab" + (i === 0 ? " active" : "");
    btn.innerHTML = `${cat} <span class="cat-count">${count}</span>`;
    btn.onclick = () => {
      document.querySelectorAll(".cat-tab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.activeCat = cat;
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
    Object.values(MENU).flat().forEach(p => {
      if (p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)) {
        products.push(p);
      }
    });
  } else {
    products = MENU[state.activeCat] || [];
  }

  if (!products.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--text3)">
      <div style="font-size:32px;margin-bottom:10px">🔍</div>
      <p>Ürün bulunamadı</p>
    </div>`;
    return;
  }

  products.forEach(p => {
    const isUnavail = state.unavailItems.has(p.id);
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
    const firstTab = document.querySelector(".cat-tab");
    if (firstTab) { firstTab.classList.add("active"); state.activeCat = Object.keys(MENU)[0]; }
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

  // Find product
  let product = null;
  for (const cat of Object.values(MENU)) {
    const found = cat.find(p => p.id === productId);
    if (found) { product = found; break; }
  }
  if (!product) return;

  if (state.cart[productId]) {
    state.cart[productId].qty++;
  } else {
    state.cart[productId] = { ...product, qty: 1 };
  }

  updateOrderPanel();
  showToast(`${product.emoji} ${product.name} eklendi`);
}

function changeQty(id, delta) {
  if (!state.cart[id]) return;
  state.cart[id].qty += delta;
  if (state.cart[id].qty <= 0) delete state.cart[id];
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
  const items  = Object.values(state.cart);
  const count  = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const tax    = Math.round(subtotal * 0.08);
  const afterDiscount = Math.max(0, subtotal - state.discount);
  const grand  = afterDiscount + tax;

  // Badge
  document.getElementById("orderBadge").textContent = count > 0 ? `${count} ürün` : "0 ürün";
  document.getElementById("clearCartBtn").style.display = items.length ? "flex" : "none";

  // Totals
  document.getElementById("subtotalVal").textContent = `₺${subtotal}`;
  document.getElementById("taxVal").textContent = `₺${tax}`;
  document.getElementById("grandTotalVal").textContent = `₺${grand}`;
  document.getElementById("confirmTotal").textContent = `₺${grand}`;
  document.getElementById("confirmBtn").disabled = items.length === 0;

  if (state.discountActive && state.discount > 0) {
    document.getElementById("discountRow").style.display = "flex";
    document.getElementById("discountVal").textContent = `-₺${state.discount}`;
  }

  // Order list
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
  const val = parseFloat(document.getElementById("discountAmt").value);
  if (!val || val <= 0) return;

  const items = Object.values(state.cart);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

  // If > 100 treat as fixed ₺ amount, else treat as percent
  if (val <= 100) {
    state.discount = Math.round(subtotal * (val / 100));
  } else {
    state.discount = Math.min(val, subtotal);
  }

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

/* ── PAYMENT METHOD ───────────────────────────────────── */
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

  state.orderCounter++;
  const orderNum = state.orderCounter;

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const tax      = Math.round(subtotal * 0.08);
  const afterDiscount = Math.max(0, subtotal - state.discount);
  const grand    = afterDiscount + tax;
  const note     = document.getElementById("orderNote").value;
  const tableLabel = state.activeTable ? `Masa ${state.activeTable.num}` : "Paket";

  const order = {
    num:     orderNum,
    items:   [...items],
    note,
    total:   grand,
    method:  state.payMethod,
    table:   tableLabel,
    tableId: state.activeTable ? state.activeTable.id : null,
    time:    new Date(),
    status:  "pending",
  };

  state.orders.push(order);

  // Add to barista board
  state.baristaOrders.push({
    ...order,
    baristaStatus: "pending",
    startTime: new Date(),
  });

  // Update table if selected
  if (state.activeTable) {
    const tableData = findTableById(state.activeTable.id);
    if (tableData) {
      tableData.status = "occupied";
      tableData.total  = grand;
      tableData.items  = items.map(i => `${i.name} ×${i.qty}`);
    }
  }

  // Show success modal
  const successEl = document.getElementById("successOrderNum");
  const detailsEl = document.getElementById("successDetails");
  successEl.textContent = `#${orderNum}`;
  detailsEl.innerHTML = `
    ${tableLabel}<br>
    ${items.length} ürün — <strong style="color:var(--accent)">₺${grand}</strong><br>
    Ödeme: ${state.payMethod}
    ${note ? `<br><em style="color:var(--text3)">"${note}"</em>` : ""}
  `;
  openModal("successModal");

  // Reset cart
  state.cart         = {};
  state.discount     = 0;
  state.discountActive = false;
  document.getElementById("orderNote").value = "";
  document.getElementById("discountRow").style.display    = "none";
  document.getElementById("discountBox").style.display    = "none";
  document.getElementById("discountAmt").value = "";
  updateOrderPanel();
  renderReports();
  renderBaristaBoard();
}

/* ═══════════════════════════════════════════════════════
   TABLES VIEW
═══════════════════════════════════════════════════════ */
function renderTables() {
  renderTableZone("tablesInner",   TABLES_DATA.inner);
  renderTableZone("tablesTerrace", TABLES_DATA.terrace);
  renderTableZone("tablesLounge",  TABLES_DATA.lounge);
}

function renderTableZone(containerId, tables) {
  const el = document.getElementById(containerId);
  el.innerHTML = "";
  tables.forEach(t => {
    const isActive = state.activeTable && state.activeTable.id === t.id;
    const card = document.createElement("div");
    card.className = `table-card ${t.status} ${isActive ? "active-table" : ""}`;
    card.innerHTML = `
      <div class="table-capacity"><i class="fa-solid fa-user" style="font-size:8px"></i> ${t.cap}</div>
      <div class="table-num">${t.num}</div>
      <span class="table-status ${t.status}">${tableStatusLabel(t.status)}</span>
      ${t.total > 0 ? `<div class="table-total">₺${t.total}</div>` : ""}
    `;
    card.onclick = () => selectTable(t);
    el.appendChild(card);
  });
}

function tableStatusLabel(s) {
  return { free:"Boş", occupied:"Dolu", waiting:"Hesap" }[s] || s;
}

function selectTable(tableData) {
  state.activeTable = tableData;
  document.getElementById("activeTableLabel").textContent = `Masa ${tableData.num}`;
  renderTables();
  showToast(`🪑 Masa ${tableData.num} seçildi`);
  // Switch to POS view
  switchView("pos", document.querySelector('[data-view="pos"]'));
}

function findTableById(id) {
  for (const zone of Object.values(TABLES_DATA)) {
    const t = zone.find(t => t.id === id);
    if (t) return t;
  }
  return null;
}

/* ═══════════════════════════════════════════════════════
   BARISTA VIEW
═══════════════════════════════════════════════════════ */
function seedDemoOrders() {
  const demoOrders = [
    {
      num: 38, baristaStatus: "pending",
      table: "Masa 4", note: "Oat milk lütfen",
      items: [
        { name:"Flat White", emoji:"⬜", qty:1, price:108 },
        { name:"Lavender Latte", emoji:"💜", qty:2, price:138 },
      ],
      time: new Date(Date.now() - 3 * 60000), startTime: new Date(Date.now() - 3 * 60000),
    },
    {
      num: 39, baristaStatus: "preparing",
      table: "Masa 2", note: "",
      items: [
        { name:"Iced Latte", emoji:"🥤", qty:2, price:110 },
        { name:"Croissant", emoji:"🥐", qty:1, price:90 },
      ],
      time: new Date(Date.now() - 7 * 60000), startTime: new Date(Date.now() - 5 * 60000),
    },
    {
      num: 40, baristaStatus: "ready",
      table: "Masa T2", note: "Az buz",
      items: [
        { name:"Cold Brew", emoji:"🧊", qty:2, price:115 },
      ],
      time: new Date(Date.now() - 12 * 60000), startTime: new Date(Date.now() - 10 * 60000),
    },
  ];
  state.baristaOrders = demoOrders;
}

function renderBaristaBoard() {
  const cols = { pending: [], preparing: [], ready: [], delivered: [] };
  state.baristaOrders.forEach(o => {
    if (cols[o.baristaStatus]) cols[o.baristaStatus].push(o);
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
  el.innerHTML = "";

  if (!orders.length) {
    el.innerHTML = `<div class="barista-empty"><i class="fa-solid fa-check" style="font-size:20px;opacity:.2;margin-bottom:6px"></i><br>Boş</div>`;
    return;
  }

  orders.forEach(o => {
    const elapsed = Math.round((Date.now() - o.startTime) / 60000);
    const ticket  = document.createElement("div");
    ticket.className = "barista-ticket";
    ticket.innerHTML = `
      <div class="ticket-top">
        <span class="ticket-order">#${o.num}</span>
        <span class="ticket-table">${o.table}</span>
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
  const actions = {
    pending:   `<button class="ticket-btn primary" onclick="advanceOrder(${order.num})">⚡ Hazırla</button>
                <button class="ticket-btn" onclick="cancelOrder(${order.num})">İptal</button>`,
    preparing: `<button class="ticket-btn primary" onclick="advanceOrder(${order.num})">🔔 Hazır</button>`,
    ready:     `<button class="ticket-btn primary" onclick="advanceOrder(${order.num})">✓ Teslim Et</button>`,
    delivered: `<button class="ticket-btn" style="opacity:.5" disabled>Teslim Edildi</button>`,
  };
  return actions[status] || "";
}

function advanceOrder(num) {
  const map = { pending:"preparing", preparing:"ready", ready:"delivered" };
  const order = state.baristaOrders.find(o => o.num === num);
  if (!order) return;
  order.baristaStatus = map[order.baristaStatus] || order.baristaStatus;
  renderBaristaBoard();
  const labels = { preparing:"🔥 Hazırlanıyor", ready:"🔔 Hazır!", delivered:"✅ Teslim edildi" };
  showToast(labels[order.baristaStatus] || "Güncellendi");
}

function cancelOrder(num) {
  state.baristaOrders = state.baristaOrders.filter(o => o.num !== num);
  renderBaristaBoard();
  showToast("❌ Sipariş iptal edildi");
}

/* ═══════════════════════════════════════════════════════
   REPORTS VIEW
═══════════════════════════════════════════════════════ */
function renderReports() {
  const now = new Date();
  document.getElementById("reportDate").textContent =
    now.toLocaleDateString("tr-TR", { weekday:"long", day:"numeric", month:"long", year:"numeric" });

  const orders = state.orders;
  const total  = orders.reduce((s, o) => s + o.total, 0);
  const avg    = orders.length ? Math.round(total / orders.length) : 0;

  // Top item
  const itemCount = {};
  orders.forEach(o => o.items.forEach(i => {
    itemCount[i.name] = (itemCount[i.name] || 0) + i.qty;
  }));
  const topItem = Object.entries(itemCount).sort((a,b) => b[1]-a[1])[0];

  document.getElementById("stat-revenue").textContent = `₺${total}`;
  document.getElementById("stat-orders").textContent  = orders.length;
  document.getElementById("stat-avg").textContent     = `₺${avg}`;
  document.getElementById("stat-top").textContent     = topItem ? topItem[0] : "—";

  renderHourlyChart();
  renderDonutChart();
  renderTopItems();
  renderOrderHistory();
}

function renderHourlyChart() {
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 08–20
  const data  = hours.map(h => {
    // Simulate + real orders
    const base = [5,12,28,45,62,78,90,105,88,72,55,38,18][h-8] || 0;
    const real = state.orders
      .filter(o => o.time.getHours() === h)
      .reduce((s, o) => s + o.total, 0);
    return base + real;
  });
  const max = Math.max(...data, 1);

  const chart = document.getElementById("hourlyChart");
  chart.innerHTML = "";
  const currentHour = new Date().getHours();

  data.forEach((val, i) => {
    const h   = hours[i];
    const pct = Math.round((val / max) * 130);
    const isPeak = val === Math.max(...data);
    const isCurrent = h === currentHour;

    const col = document.createElement("div");
    col.className = "bar-col";
    col.innerHTML = `
      <div class="bar-val">${val > 0 ? "₺" + val : ""}</div>
      <div class="bar-fill${isPeak ? " peak" : ""}" style="height:${pct}px" title="${h}:00 — ₺${val}"></div>
      <div class="bar-label" style="${isCurrent ? "color:var(--accent);font-weight:700" : ""}">${h}</div>
    `;
    chart.appendChild(col);
  });
}

function renderDonutChart() {
  const methods = { "Kart": 0, "Nakit": 0, "QR": 0 };
  state.orders.forEach(o => { methods[o.method] = (methods[o.method] || 0) + o.total; });

  // Demo data if no orders
  if (state.orders.length === 0) {
    methods["Kart"]  = 7850;
    methods["Nakit"] = 3200;
    methods["QR"]    = 1950;
  }

  const total  = Object.values(methods).reduce((s, v) => s + v, 0);
  const colors = { "Kart":"#C8A96E", "Nakit":"#4CAF7A", "QR":"#9B8FE0" };

  const wrap = document.getElementById("donutChart");
  wrap.innerHTML = "";

  // Simple CSS donut
  const entries = Object.entries(methods).filter(([,v]) => v > 0);
  const radius  = 52;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 130 130");
  svg.setAttribute("width", "130");
  svg.setAttribute("height", "130");
  svg.className = "donut-svg";

  // BG circle
  const bg = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  bg.setAttribute("cx","65"); bg.setAttribute("cy","65"); bg.setAttribute("r", String(radius));
  bg.setAttribute("fill","none"); bg.setAttribute("stroke","#1e1e1e"); bg.setAttribute("stroke-width","16");
  svg.appendChild(bg);

  entries.forEach(([method, val]) => {
    const pct  = val / total;
    const dash = pct * circumference;
    const gap  = circumference - dash;
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx","65"); circle.setAttribute("cy","65");
    circle.setAttribute("r", String(radius));
    circle.setAttribute("fill","none");
    circle.setAttribute("stroke", colors[method] || "#555");
    circle.setAttribute("stroke-width","16");
    circle.setAttribute("stroke-dasharray", `${dash} ${gap}`);
    circle.setAttribute("stroke-dashoffset", String(-offset + circumference * 0.25));
    circle.setAttribute("transform","rotate(-90 65 65)");
    circle.style.transition = "stroke-dasharray 0.8s ease";
    svg.appendChild(circle);
    offset += dash;
  });

  // Center text
  const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
  textEl.setAttribute("x","65"); textEl.setAttribute("y","62");
  textEl.setAttribute("text-anchor","middle"); textEl.setAttribute("fill","#F2EDE4");
  textEl.setAttribute("font-family","Syne,sans-serif"); textEl.setAttribute("font-size","13");
  textEl.setAttribute("font-weight","700");
  textEl.textContent = "₺" + (total >= 1000 ? (total/1000).toFixed(1)+"k" : total);

  const subEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
  subEl.setAttribute("x","65"); subEl.setAttribute("y","76");
  subEl.setAttribute("text-anchor","middle"); subEl.setAttribute("fill","#5A4E46");
  subEl.setAttribute("font-family","DM Sans,sans-serif"); subEl.setAttribute("font-size","10");
  subEl.textContent = "Toplam";

  svg.appendChild(textEl); svg.appendChild(subEl);
  wrap.appendChild(svg);

  // Legend
  const legend = document.createElement("div");
  legend.className = "donut-legend";
  entries.forEach(([method, val]) => {
    const pct = Math.round((val / total) * 100);
    const item = document.createElement("div");
    item.className = "legend-item";
    item.innerHTML = `
      <span class="legend-name">
        <span class="legend-color" style="background:${colors[method]}"></span>${method}
      </span>
      <span class="legend-pct">${pct}%</span>
    `;
    legend.appendChild(item);
  });
  wrap.appendChild(legend);
}

function renderTopItems() {
  const itemData = {};
  state.orders.forEach(o => {
    o.items.forEach(i => {
      if (!itemData[i.name]) itemData[i.name] = { name: i.name, emoji: i.emoji, qty: 0, revenue: 0 };
      itemData[i.name].qty     += i.qty;
      itemData[i.name].revenue += i.price * i.qty;
    });
  });

  // Demo data if empty
  if (state.orders.length === 0) {
    const demo = [
      { name:"Cold Brew",      emoji:"🧊", qty:47, revenue:5405 },
      { name:"Flat White",     emoji:"⬜", qty:38, revenue:4104 },
      { name:"Iced Latte",     emoji:"🥤", qty:35, revenue:3850 },
      { name:"Cappuccino",     emoji:"🤍", qty:32, revenue:3040 },
      { name:"Lavender Latte", emoji:"💜", qty:28, revenue:3864 },
      { name:"Avokado Toast",  emoji:"🥑", qty:22, revenue:3696 },
    ];
    demo.forEach(d => itemData[d.name] = d);
  }

  const sorted = Object.values(itemData).sort((a,b) => b.qty - a.qty).slice(0, 8);
  const maxQty = sorted[0]?.qty || 1;
  const totalRev = sorted.reduce((s,i) => s + i.revenue, 0);

  const tbody = document.getElementById("topItemsBody");
  tbody.innerHTML = "";
  sorted.forEach((item, idx) => {
    const barW = Math.round((item.qty / maxQty) * 80);
    const share = Math.round((item.revenue / totalRev) * 100);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${item.emoji} ${item.name}</td>
      <td>
        <div class="rank-bar">
          <div class="rank-bar-fill" style="width:${barW}px"></div>
          <span>${item.qty}</span>
        </div>
      </td>
      <td style="color:var(--accent);font-family:'Syne',sans-serif;font-weight:700">₺${item.revenue}</td>
      <td><span style="color:var(--text3)">${share}%</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderOrderHistory() {
  const container = document.getElementById("orderHistory");
  document.getElementById("historyCount").textContent = `${state.orders.length} sipariş`;

  if (!state.orders.length) {
    container.innerHTML = `<p style="color:var(--text3);font-size:14px;padding:20px 0">Henüz sipariş yok.</p>`;
    return;
  }

  container.innerHTML = "";
  const reversed = [...state.orders].reverse();
  reversed.forEach(o => {
    const el = document.createElement("div");
    el.className = "history-item";
    const timeStr = o.time.toLocaleTimeString("tr-TR", { hour:"2-digit", minute:"2-digit" });
    const itemStr = o.items.map(i => `${i.name} ×${i.qty}`).join(", ");
    el.innerHTML = `
      <span class="history-num">#${o.num}</span>
      <div class="history-info">
        <div class="history-table">${o.table}</div>
        <div class="history-items">${itemStr.length > 45 ? itemStr.slice(0,45) + "…" : itemStr}</div>
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
   MENU MANAGE VIEW
═══════════════════════════════════════════════════════ */
let mmActiveCat = Object.keys(MENU)[0];

function renderMenuManage() {
  const cats = Object.keys(MENU);
  const catList = document.getElementById("mmCatList");
  catList.innerHTML = "";

  cats.forEach((cat, i) => {
    const btn = document.createElement("button");
    btn.className = "mm-cat-btn" + (cat === mmActiveCat ? " active" : "");
    btn.innerHTML = `${cat} <span class="mm-cat-count">${MENU[cat].length}</span>`;
    btn.onclick = () => {
      mmActiveCat = cat;
      renderMenuManage();
    };
    catList.appendChild(btn);
  });

  renderMMProducts();
}

function renderMMProducts() {
  const list = document.getElementById("mmProductList");
  list.innerHTML = "";

  MENU[mmActiveCat].forEach(p => {
    const isUnavail = state.unavailItems.has(p.id);
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
        <label class="toggle-switch mm-toggle" title="${isUnavail ? "Stokta var" : "Tükenmiş işaretle"}">
          <input type="checkbox" ${isUnavail ? "" : "checked"} onchange="toggleAvailability(${p.id}, this)" />
          <span class="toggle-slider"></span>
        </label>
        <button class="mm-edit-btn" title="Düzenle"><i class="fa-solid fa-pen"></i></button>
      </div>
    `;
    list.appendChild(row);
  });
}

function toggleAvailability(id, checkbox) {
  if (checkbox.checked) {
    state.unavailItems.delete(id);
    showToast("✅ Ürün tekrar aktif");
  } else {
    state.unavailItems.add(id);
    showToast("⚠️ Ürün tükenmiş olarak işaretlendi");
  }
  renderProducts();
}

/* ── ADD PRODUCT MODAL ────────────────────────────────── */
function openAddProduct() {
  openModal("addProductModal");
}

function saveNewProduct() {
  const name = document.getElementById("newName").value.trim();
  const emoji= document.getElementById("newEmoji").value.trim() || "☕";
  const price= parseInt(document.getElementById("newPrice").value) || 0;
  const cat  = document.getElementById("newCategory").value;
  const desc = document.getElementById("newDesc").value.trim();
  const pop  = document.getElementById("newPopular").checked;

  if (!name || !price) {
    showToast("⚠️ Ad ve fiyat zorunlu");
    return;
  }

  const maxId = Math.max(...Object.values(MENU).flat().map(p => p.id), 0);
  MENU[cat].push({ id: maxId + 1, emoji, name, price, desc, popular: pop });

  closeModal("addProductModal");
  // Reset form
  ["newName","newEmoji","newPrice","newDesc"].forEach(id => document.getElementById(id).value = "");
  document.getElementById("newPopular").checked = false;

  renderProducts();
  renderMenuManage();
  showToast(`✅ "${name}" eklendi`);
}

/* ═══════════════════════════════════════════════════════
   MODALS
═══════════════════════════════════════════════════════ */
function openModal(id) {
  document.getElementById(id).classList.add("open");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("open");
}

// Close on overlay click
document.querySelectorAll(".modal-overlay").forEach(overlay => {
  overlay.addEventListener("click", e => {
    if (e.target === overlay) overlay.classList.remove("open");
  });
});

/* ═══════════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════════ */
let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById("toast");
  document.getElementById("toastMsg").textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

/* ═══════════════════════════════════════════════════════
   KEYBOARD SHORTCUTS
═══════════════════════════════════════════════════════ */
document.addEventListener("keydown", e => {
  // Escape: close modals
  if (e.key === "Escape") {
    document.querySelectorAll(".modal-overlay.open").forEach(m => m.classList.remove("open"));
  }
  // Ctrl+F: focus search
  if ((e.ctrlKey || e.metaKey) && e.key === "f") {
    e.preventDefault();
    const s = document.getElementById("searchInput");
    if (s) { s.focus(); s.select(); }
  }
  // Ctrl+Enter: submit order
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    if (!document.getElementById("confirmBtn").disabled) submitOrder();
  }
});
