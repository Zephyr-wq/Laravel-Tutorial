// checkout.js

const STORAGE_KEY = "simple_cart_v1";
const DELIVERY_FEE = 500;

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

  document.getElementById("checkout-subtotal").textContent = currencyFormat(subtotal);
  document.getElementById("checkout-delivery").textContent = currencyFormat(DELIVERY_FEE);
  document.getElementById("checkout-total").textContent = currencyFormat(total);
}

document.addEventListener("DOMContentLoaded", renderCheckout);

/* -------- PAYSTACK CHECKOUT + BACKEND VERIFICATION -------- */

document.getElementById("place-order-btn").addEventListener("click", payWithPaystack);

function payWithPaystack() {
  const cart = loadCart();
  if (!cart.length) return;

  const subtotal = computeSubtotal(cart);
  const total = subtotal + DELIVERY_FEE;

  const first = document.querySelector('input[name="first_name"]').value.trim();
  const last  = document.querySelector('input[name="last_name"]').value.trim();
  const email = document.querySelector('input[name="email"]').value.trim();
  const phone = document.querySelector('input[name="phone"]').value.trim();

  if (!email) {
    alert("Please enter your email before continuing.");
    return;
  }

  const ref = "ORDER-" + Date.now();

  const handler = PaystackPop.setup({
    key: "pk_test_xxxxxxxxxxxxxxxxxxxxxxxx", // <-- your PUBLIC key
    email: email,
    amount: Math.round(total * 100), // KOBO
    currency: "NGN",
    ref: ref,
    metadata: {
      cart,
      customer_name: `${first} ${last}`.trim(),
      phone
    },
    callback: function (response) {
      verifyPayment(response.reference);
    },
    onClose: function () {
      alert("Payment window closed.");
    }
  });

  handler.openIframe();
}

/* -------- BACKEND VERIFICATION CALL -------- */

function verifyPayment(reference) {
  fetch("verify-payment.php?reference=" + reference)
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {
        localStorage.removeItem(STORAGE_KEY);
        window.location.href = "thank-you.html";
      } else {
        alert("Payment could not be verified. Please contact support.");
      }
    })
    .catch(() => {
      alert("Network error verifying payment.");
    });
}
