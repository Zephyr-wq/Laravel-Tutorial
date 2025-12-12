// script.js
// Keeps cart in localStorage under key 'simple_cart_v1'

const STORAGE_KEY = "simple_cart_v1";

/* -------------------------------------------------------------------------- */
/* Utilities                                                                  */
/* -------------------------------------------------------------------------- */

function currencyFormat(n) {
  // formatting without relying on external libs
  return "₦" + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function loadCart() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("Invalid cart data; clearing.");
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  updateCartCountUI(cart);
}

/* -------------------------------------------------------------------------- */
/* Cart state                                                                  */
/* -------------------------------------------------------------------------- */

let cart = loadCart(); // array of { id, name, price, qty }

/* -------------------------------------------------------------------------- */
/* Cart operations                                                             */
/* -------------------------------------------------------------------------- */

function findCartIndexById(id) {
  return cart.findIndex(item => item.id === id);
}

function addToCart(item) {
  // item: { id, name, price }
  const idx = findCartIndexById(item.id);
  if (idx === -1) {
    cart.push({ ...item, qty: 1 });
  } else {
    cart[idx].qty += 1;
  }
  saveCart(cart);
  refreshAllViews();
}

function setQty(id, qty) {
  const idx = findCartIndexById(id);
  if (idx === -1) return;
  cart[idx].qty = Math.max(0, Math.floor(qty));
  if (cart[idx].qty === 0) cart.splice(idx, 1);
  saveCart(cart);
  refreshAllViews();
}

function removeFromCart(index) {
  // index is array index
  if (index < 0 || index >= cart.length) return;
  cart.splice(index, 1);
  saveCart(cart);
  refreshAllViews();
}

function clearCart() {
  cart = [];
  saveCart(cart);
  refreshAllViews();
}

/* -------------------------------------------------------------------------- */
/* Totals                                                                     */
/* -------------------------------------------------------------------------- */

function computeSubtotal() {
  // do arithmetic carefully
  let subtotal = 0;
  for (const item of cart) {
    // ensure numeric arithmetic
    subtotal += Number(item.price) * Number(item.qty);
  }
  return subtotal;
}

function computeGrandTotal(delivery = 0) {
  return computeSubtotal() + Number(delivery || 0);
}

/* -------------------------------------------------------------------------- */
/* UI helpers                                                                  */
/* -------------------------------------------------------------------------- */

function updateCartCountUI(cartLocal = cart) {
  const el = document.getElementById("cart-count");
  if (!el) return;
  el.textContent = cartLocal.reduce((s, it) => s + Number(it.qty), 0);
}

/* -------------------------------------------------------------------------- */
/* Renderers                                                                   */
/* -------------------------------------------------------------------------- */

function renderProductGrid() {
  // nothing required here - products are static in HTML
  // but attach event listeners
  document.querySelectorAll(".add-to-cart").forEach(btn => {
    btn.removeEventListener("click", onAddToCartClick);
    btn.addEventListener("click", onAddToCartClick);
  });
}

function onAddToCartClick(e) {
  const btn = e.currentTarget;
  const id = btn.dataset.id;
  const name = btn.dataset.name;
  const price = Number(btn.dataset.price);
  addToCart({ id, name, price });
  // show modal for feedback
  const modalEl = document.getElementById("cartModal");
  if (modalEl) {
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
  }
}

function refreshCartModalView() {
  const container = document.getElementById("cart-items-modal");
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = "<p class='text-muted'>Your cart is empty.</p>";
  } else {
    container.innerHTML = cart.map((item, idx) => `
      <div class="cart-item d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-3">
          <input class="form-check-input cart-checkbox" type="checkbox" data-index="${idx}">
          <div>
            <div class="fw-bold">${escapeHtml(item.name)}</div>
            <div class="text-muted small">Unit: ${currencyFormat(item.price)}</div>
          </div>
        </div>

        <div class="d-flex align-items-center gap-3 item-controls">
          <div class="qty-control">
            <button class="btn btn-outline-secondary btn-sm btn-decrease" data-index="${idx}">−</button>
            <input type="number" class="form-control form-control-sm qty-input" data-index="${idx}" value="${item.qty}" min="1" style="width:64px;">
            <button class="btn btn-outline-secondary btn-sm btn-increase" data-index="${idx}">+</button>
          </div>

          <div class="text-end">
            <div class="fw-bold">${currencyFormat(item.price * item.qty)}</div>
            <button class="btn btn-sm btn-link text-danger remove-single" data-index="${idx}">Remove</button>
          </div>
        </div>
      </div>
    `).join("");
  }

  // subtotal / totals
  const subtotal = computeSubtotal();
  document.getElementById("modal-subtotal").textContent = currencyFormat(subtotal);

  // delivery inputs (modal)
  const applyDelivery = document.getElementById("apply-delivery-modal");
  const deliveryFeeInput = document.getElementById("delivery-fee-modal");
  const delivery = (applyDelivery && applyDelivery.checked) ? Number(deliveryFeeInput.value || 0) : 0;

  document.getElementById("modal-grandtotal").textContent = currencyFormat(computeGrandTotal(delivery));

  // wire controls
  container.querySelectorAll(".btn-decrease").forEach(b => {
    b.removeEventListener("click", onDecrease);
    b.addEventListener("click", onDecrease);
  });
  container.querySelectorAll(".btn-increase").forEach(b => {
    b.removeEventListener("click", onIncrease);
    b.addEventListener("click", onIncrease);
  });
  container.querySelectorAll(".qty-input").forEach(inp => {
    inp.removeEventListener("change", onQtyInputChange);
    inp.addEventListener("change", onQtyInputChange);
  });
  container.querySelectorAll(".remove-single").forEach(b => {
    b.removeEventListener("click", onRemoveSingle);
    b.addEventListener("click", onRemoveSingle);
  });
}

function refreshCartPageView() {
  const container = document.getElementById("cart-items-page");
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = "<p class='text-muted'>Your cart is empty. Go back to <a href='index.html'>shopping</a>.</p>";
  } else {
    container.innerHTML = cart.map((item, idx) => `
      <div class="cart-item d-flex justify-content-between align-items-center">
        <div class="d-flex gap-3 align-items-center">
          <input class="form-check-input cart-checkbox-page" type="checkbox" data-index="${idx}">
          <img src="https://via.placeholder.com/80x60?text=Img" alt="" style="width:80px;height:60px;object-fit:cover;border-radius:6px;">
          <div>
            <div class="fw-bold">${escapeHtml(item.name)}</div>
            <div class="text-muted small">Unit: ${currencyFormat(item.price)}</div>
          </div>
        </div>

        <div class="d-flex align-items-center gap-3 item-controls">
          <div class="qty-control">
            <button class="btn btn-outline-secondary btn-decrease-page btn-sm" data-index="${idx}">−</button>
            <input type="number" class="form-control form-control-sm qty-input-page" data-index="${idx}" value="${item.qty}" min="1" style="width:72px;">
            <button class="btn btn-outline-secondary btn-increase-page btn-sm" data-index="${idx}">+</button>
          </div>

          <div class="text-end">
            <div class="fw-bold">${currencyFormat(item.price * item.qty)}</div>
            <button class="btn btn-sm btn-link text-danger remove-single-page" data-index="${idx}">Remove</button>
          </div>
        </div>
      </div>
    `).join("");
  }

  document.getElementById("page-subtotal").textContent = currencyFormat(computeSubtotal());

  // delivery inputs (page)
  const applyDelivery = document.getElementById("apply-delivery-page");
  const deliveryFeeInput = document.getElementById("delivery-fee-page");
  const delivery = (applyDelivery && applyDelivery.checked) ? Number(deliveryFeeInput.value || 0) : 0;
  document.getElementById("page-grandtotal").textContent = currencyFormat(computeGrandTotal(delivery));

  // wire page controls
  container.querySelectorAll(".btn-decrease-page").forEach(b => {
    b.removeEventListener("click", onDecreasePage);
    b.addEventListener("click", onDecreasePage);
  });
  container.querySelectorAll(".btn-increase-page").forEach(b => {
    b.removeEventListener("click", onIncreasePage);
    b.addEventListener("click", onIncreasePage);
  });
  container.querySelectorAll(".qty-input-page").forEach(inp => {
    inp.removeEventListener("change", onQtyInputChangePage);
    inp.addEventListener("change", onQtyInputChangePage);
  });
  container.querySelectorAll(".remove-single-page").forEach(b => {
    b.removeEventListener("click", onRemoveSinglePage);
    b.addEventListener("click", onRemoveSinglePage);
  });
}

/* -------------------------------------------------------------------------- */
/* Event handlers - modal                                                     */
/* -------------------------------------------------------------------------- */

function onDecrease(e) {
  const idx = Number(e.currentTarget.dataset.index);
  if (cart[idx]) {
    setQty(cart[idx].id, Math.max(1, cart[idx].qty - 1));
  }
}

function onIncrease(e) {
  const idx = Number(e.currentTarget.dataset.index);
  if (cart[idx]) {
    setQty(cart[idx].id, cart[idx].qty + 1);
  }
}

function onQtyInputChange(e) {
  const idx = Number(e.currentTarget.dataset.index);
  const val = Number(e.currentTarget.value || 1);
  if (cart[idx]) setQty(cart[idx].id, val);
}

function onRemoveSingle(e) {
  const idx = Number(e.currentTarget.dataset.index);
  removeFromCart(idx);
}

/* -------------------------------------------------------------------------- */
/* Event handlers - page                                                      */
/* -------------------------------------------------------------------------- */

function onDecreasePage(e) {
  const idx = Number(e.currentTarget.dataset.index);
  if (cart[idx]) setQty(cart[idx].id, Math.max(1, cart[idx].qty - 1));
}

function onIncreasePage(e) {
  const idx = Number(e.currentTarget.dataset.index);
  if (cart[idx]) setQty(cart[idx].id, cart[idx].qty + 1);
}

function onQtyInputChangePage(e) {
  const idx = Number(e.currentTarget.dataset.index);
  const val = Number(e.currentTarget.value || 1);
  if (cart[idx]) setQty(cart[idx].id, val);
}

function onRemoveSinglePage(e) {
  const idx = Number(e.currentTarget.dataset.index);
  removeFromCart(idx);
}

/* -------------------------------------------------------------------------- */
/* Cross-view controls (select all, remove selected, clear)                   */
/* -------------------------------------------------------------------------- */

function wireGlobalControls() {
  // modal selectors
  const selectAll = document.getElementById("select-all");
  if (selectAll) {
    selectAll.addEventListener("change", () => {
      document.querySelectorAll(".cart-checkbox").forEach(cb => cb.checked = selectAll.checked);
    });
  }

  const removeSelected = document.getElementById("remove-selected");
  if (removeSelected) {
    removeSelected.addEventListener("click", () => {
      const selected = Array.from(document.querySelectorAll(".cart-checkbox"))
        .filter(cb => cb.checked)
        .map(cb => Number(cb.dataset.index))
        .sort((a,b)=>b-a);
      if (selected.length === 0) return;
      selected.forEach(i => cart.splice(i,1));
      saveCart(cart);
      refreshAllViews();
      if (selectAll) selectAll.checked = false;
    });
  }

  const clearCartBtn = document.getElementById("clear-cart");
  if (clearCartBtn) {
    clearCartBtn.addEventListener("click", () => {
      if (!confirm("Clear the entire cart?")) return;
      clearCart();
    });
  }

  // delivery modal inputs
  const applyDeliveryModal = document.getElementById("apply-delivery-modal");
  const deliveryFeeModal = document.getElementById("delivery-fee-modal");
  if (applyDeliveryModal && deliveryFeeModal) {
    [applyDeliveryModal, deliveryFeeModal].forEach(el => el.addEventListener("input", () => {
      const delivery = applyDeliveryModal.checked ? Number(deliveryFeeModal.value || 0) : 0;
      document.getElementById("modal-grandtotal").textContent = currencyFormat(computeGrandTotal(delivery));
    }));
  }

  // page selectors
  const selectAllPage = document.getElementById("select-all-page");
  if (selectAllPage) {
    selectAllPage.addEventListener("change", () => {
      document.querySelectorAll(".cart-checkbox-page").forEach(cb => cb.checked = selectAllPage.checked);
    });
  }

  const removeSelectedPage = document.getElementById("remove-selected-page");
  if (removeSelectedPage) {
    removeSelectedPage.addEventListener("click", () => {
      const selected = Array.from(document.querySelectorAll(".cart-checkbox-page"))
        .filter(cb => cb.checked)
        .map(cb => Number(cb.dataset.index))
        .sort((a,b)=>b-a);
      if (selected.length === 0) return;
      selected.forEach(i => cart.splice(i,1));
      saveCart(cart);
      refreshAllViews();
      if (selectAllPage) selectAllPage.checked = false;
    });
  }

  const clearCartPage = document.getElementById("clear-cart-page");
  if (clearCartPage) {
    clearCartPage.addEventListener("click", () => {
      if (!confirm("Clear the entire cart?")) return;
      clearCart();
    });
  }

  // delivery inputs (page)
  const applyDeliveryPage = document.getElementById("apply-delivery-page");
  const deliveryFeePage = document.getElementById("delivery-fee-page");
  if (applyDeliveryPage && deliveryFeePage) {
    [applyDeliveryPage, deliveryFeePage].forEach(el => el.addEventListener("input", () => {
      const delivery = applyDeliveryPage.checked ? Number(deliveryFeePage.value || 0) : 0;
      document.getElementById("page-grandtotal").textContent = currencyFormat(computeGrandTotal(delivery));
    }));
  }

  // checkout button (page)
  const checkoutBtn = document.getElementById("checkout-btn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      alert("Proceeding to checkout (demo). Implement your checkout flow here.");
    });
  }
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* -------------------------------------------------------------------------- */
/* Master refresh                                                              */
/* -------------------------------------------------------------------------- */

function refreshAllViews() {
  updateCartCountUI();
  refreshCartModalView();
  refreshCartPageView();
}

/* -------------------------------------------------------------------------- */
/* Initialization                                                              */
/* -------------------------------------------------------------------------- */

function init() {
  renderProductGrid(); // attach product buttons

  // open cart modal button
  const cartBtn = document.getElementById("cartBtn");
  const cartModalEl = document.getElementById("cartModal");
  if (cartBtn && cartModalEl) {
    cartBtn.addEventListener("click", () => {
      const bsModal = new bootstrap.Modal(cartModalEl);
      bsModal.show();
      // refresh display each time modal opened
      refreshCartModalView();
    });
  }

  // wire global controls & initial render
  wireGlobalControls();
  refreshAllViews();
}

document.addEventListener("DOMContentLoaded", init);
