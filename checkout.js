// checkout.js
// Uses the same cart data as laravel.js

const STORAGE_KEY = "simple_cart_v1";
const DELIVERY_FEE = 500;

/* ---------------- Utilities ---------------- */

function currencyFormat(n) {
  return "₦" + Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function computeSubtotal(cart) {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

/* ---------------- Render ---------------- */

function renderCheckout() {
  const cart = loadCart();
  const container = document.getElementById("checkout-items");
  const placeOrderBtn = document.getElementById("place-order-btn");

  if (cart.length === 0) {
    container.innerHTML = "<p class='text-muted'>Your cart is empty.</p>";
    placeOrderBtn.disabled = true;
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="d-flex justify-content-between mb-2">
      <div>
        <div class="fw-bold">${item.name}</div>
        <div class="text-muted small">Qty: ${item.qty}</div>
      </div>
      <div class="fw-bold">
        ${currencyFormat(item.price * item.qty)}
      </div>
    </div>
  `).join("");

  const subtotal = computeSubtotal(cart);
  const total = subtotal + DELIVERY_FEE;

  document.getElementById("checkout-subtotal").textContent =
    currencyFormat(subtotal);

  document.getElementById("checkout-delivery").textContent =
    currencyFormat(DELIVERY_FEE);

  document.getElementById("checkout-total").textContent =
    currencyFormat(total);
}

/* ---------------- Place order (demo) ---------------- */

document.getElementById("place-order-btn").addEventListener("click", () => {
  alert("Order placed successfully (demo).");
  localStorage.removeItem(STORAGE_KEY);
  window.location.href = "index.html";
});

document.addEventListener("DOMContentLoaded", renderCheckout);
