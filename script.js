const CART_KEY = "cara-cart";

function readCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const count = readCart().reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll("[data-cart-count]").forEach((badge) => {
    badge.textContent = count;
    badge.setAttribute("aria-label", `${count} items in cart`);
  });
}

function showToast(message) {
  document.querySelector(".toast")?.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  toast.textContent = message;
  document.body.appendChild(toast);
  window.setTimeout(() => toast.remove(), 2600);
}

function addToCart(product, quantity = 1) {
  const cart = readCart();
  const existing = cart.find((item) => item.id === product.id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ ...product, quantity });
  }
  saveCart(cart);
  showToast(`${product.name} added to your cart.`);
}

function setupNavigation() {
  const toggle = document.getElementById("menu-toggle");
  const navbar = document.getElementById("navbar");
  if (!toggle || !navbar) return;

  toggle.addEventListener("click", () => {
    const isOpen = navbar.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.textContent = isOpen ? "×" : "☰";
  });

  navbar.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      navbar.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "☰";
    }
  });
}

function setupProductGallery() {
  const mainImage = document.getElementById("main-product-image");
  const thumbnails = document.querySelectorAll("[data-thumbnail]");
  if (!mainImage || !thumbnails.length) return;

  thumbnails.forEach((button) => {
    button.addEventListener("click", () => {
      mainImage.src = button.dataset.thumbnail;
      mainImage.alt = button.querySelector("img")?.alt || "Selected product image";
      thumbnails.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
    });
  });
}

function setupAddToCartButtons() {
  document.querySelectorAll("[data-add-to-cart]").forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest("[data-product]") || button;
      const quantityInput = card.querySelector("[data-quantity]");
      const quantity = Math.max(1, Number.parseInt(quantityInput?.value || "1", 10));
      addToCart({
        id: card.dataset.id,
        name: card.dataset.name,
        price: Number(card.dataset.price),
        image: card.dataset.image
      }, quantity);
    });
  });
}

function money(value) {
  return `$${value.toFixed(2)}`;
}

function renderCart() {
  const tableBody = document.getElementById("cart-items");
  if (!tableBody) return;

  const cart = readCart();
  if (!cart.length) {
    tableBody.innerHTML = '<tr><td colspan="6" class="empty-cart">Your cart is empty. <a class="text-link" href="shop.html">Browse the shop</a>.</td></tr>';
  } else {
    tableBody.innerHTML = cart.map((item) => `
      <tr>
        <td><button class="remove-item" type="button" data-remove="${item.id}" aria-label="Remove ${item.name}">Remove</button></td>
        <td><img src="${item.image}" alt="${item.name}"></td>
        <td>${item.name}</td>
        <td>${money(item.price)}</td>
        <td><input type="number" min="1" value="${item.quantity}" data-cart-quantity="${item.id}" aria-label="Quantity for ${item.name}"></td>
        <td>${money(item.price * item.quantity)}</td>
      </tr>`).join("");
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = sessionStorage.getItem("cara-coupon") === "SAVE10" ? subtotal * 0.1 : 0;
  document.querySelector("[data-subtotal]")?.replaceChildren(document.createTextNode(money(subtotal)));
  document.querySelector("[data-discount]")?.replaceChildren(document.createTextNode(`-${money(discount)}`));
  document.querySelector("[data-total]")?.replaceChildren(document.createTextNode(money(subtotal - discount)));

  tableBody.querySelectorAll("[data-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      saveCart(readCart().filter((item) => item.id !== button.dataset.remove));
      renderCart();
    });
  });

  tableBody.querySelectorAll("[data-cart-quantity]").forEach((input) => {
    input.addEventListener("change", () => {
      const nextCart = readCart();
      const item = nextCart.find((entry) => entry.id === input.dataset.cartQuantity);
      if (item) item.quantity = Math.max(1, Number.parseInt(input.value || "1", 10));
      saveCart(nextCart);
      renderCart();
    });
  });
}

function setupCoupon() {
  const form = document.getElementById("coupon-form");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const code = new FormData(form).get("coupon")?.toString().trim().toUpperCase();
    if (code === "SAVE10") {
      sessionStorage.setItem("cara-coupon", "SAVE10");
      showToast("Coupon applied: 10% off.");
    } else {
      sessionStorage.removeItem("cara-coupon");
      showToast("That coupon is not valid. Try SAVE10.");
    }
    renderCart();
  });
}

function setupForms() {
  document.querySelectorAll(".newsletter-form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const message = form.parentElement.querySelector(".form-message");
      if (message) message.textContent = "Thanks — you are on the newsletter list!";
      form.reset();
    });
  });

  const contactForm = document.getElementById("contact-form");
  contactForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = contactForm.querySelector(".form-message");
    if (message) message.textContent = "Thanks! Your message has been received.";
    contactForm.reset();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  setupProductGallery();
  setupAddToCartButtons();
  setupCoupon();
  setupForms();
  updateCartCount();
  renderCart();
});
