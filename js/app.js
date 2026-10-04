/* =====================================================================
   NITARAA ETHNIC WEAR — APP LOGIC
   You should not need to edit this file for day-to-day use.
   Edit js/data.js instead. See README.md for full instructions.
   ===================================================================== */

(function () {
  "use strict";

  const CATEGORIES = [
    { key: "fullset", label: "Full Set" },
    { key: "chaniya", label: "Chaniya" },
    { key: "blouse", label: "Blouse" },
    { key: "dupatta", label: "Dupatta" }
  ];

  const root = document.getElementById("app");
  let cart = loadCart();
  let currentCategory = "fullset";
  let lastCheckoutAmount = 0;
  let lastCheckoutSummary = "";

  // ---------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------
  function rupees(n) {
    return "\u20B9" + Math.round(n).toLocaleString("en-IN");
  }

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach((k) => {
        if (k === "class") node.className = attrs[k];
        else if (k === "html") node.innerHTML = attrs[k];
        else if (k.startsWith("on") && typeof attrs[k] === "function") {
          node.addEventListener(k.slice(2), attrs[k]);
        } else node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach((c) => {
      if (c) node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  function saveCart() {
    try {
      localStorage.setItem("nitaraa_cart_v1", JSON.stringify(cart));
    } catch (e) { /* storage full or blocked — cart still works for this session */ }
  }

  function loadCart() {
    try {
      const raw = localStorage.getItem("nitaraa_cart_v1");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function placeholderImage(label) {
    const box = el("div", { class: "img-placeholder" });
    box.textContent = label;
    return box;
  }

  function productImage(src, label) {
    const img = el("img", { src: src, alt: label, loading: "lazy" });
    img.addEventListener("error", function handler() {
      img.removeEventListener("error", handler);
      img.replaceWith(placeholderImage(label));
    });
    return img;
  }

  // ---------------------------------------------------------------
  // Catalog helpers: build Full Set listings automatically
  // ---------------------------------------------------------------
  function byCategory(cat) {
    return PRODUCTS.filter((p) => p.category === cat);
  }

  function computeFullSets() {
    const byDesign = {};
    PRODUCTS.forEach((p) => {
      byDesign[p.designId] = byDesign[p.designId] || {};
      byDesign[p.designId][p.category] = p;
    });
    const sets = [];
    Object.keys(byDesign).forEach((designId) => {
      const group = byDesign[designId];
      if (group.chaniya && group.blouse && group.dupatta) {
        const pieces = [group.chaniya, group.blouse, group.dupatta];
        const stock = Math.min(group.chaniya.stock, group.blouse.stock, group.dupatta.stock);
        if (stock <= 0) return; // any one piece sold out -> set hidden automatically
        const override = (typeof SET_OVERRIDES !== "undefined" && SET_OVERRIDES[designId]) || {};
        const colorSet = Array.from(new Set(pieces.flatMap((p) => p.colors || [])));
        sets.push({
          id: "set-" + designId,
          designId: designId,
          category: "fullset",
          name: override.name || group.chaniya.name.replace(/Chaniya$/i, "Full Set"),
          price: group.chaniya.price + group.blouse.price + group.dupatta.price,
          colors: colorSet,
          sizes: group.blouse.sizes,
          image: override.image || group.chaniya.image,
          stock: stock,
          pieces: pieces
        });
      }
    });
    return sets;
  }

  function findListing(id) {
    if (id.indexOf("set-") === 0) {
      return computeFullSets().find((s) => s.id === id);
    }
    return PRODUCTS.find((p) => p.id === id);
  }

  // ---------------------------------------------------------------
  // Discount + totals
  // ---------------------------------------------------------------
  function computeTotals() {
    const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
    const flat = subtotal * SHOP.discount.flatRate;
    const afterFlat = subtotal - flat;
    const qualifiesExtra = subtotal > SHOP.discount.extraThreshold;
    const extra = qualifiesExtra ? afterFlat * SHOP.discount.extraRate : 0;
    const grandTotal = afterFlat - extra;
    const freeShipping = subtotal >= SHOP.freeShippingThreshold;
    return { subtotal, flat, extra, qualifiesExtra, grandTotal, freeShipping };
  }

  function cartCount() {
    return cart.reduce((n, i) => n + i.qty, 0);
  }

  // ---------------------------------------------------------------
  // Cart operations
  // ---------------------------------------------------------------
  function addToCart(listing, color, size) {
    const lineId = listing.id + "|" + (color || "") + "|" + (size || "");
    const existing = cart.find((i) => i.lineId === lineId);
    const maxStock = listing.stock;
    if (existing) {
      if (existing.qty >= maxStock) {
        toast("Only " + maxStock + " in stock — that's all we have for now.");
        return;
      }
      existing.qty += 1;
    } else {
      cart.push({
        lineId: lineId,
        productId: listing.id,
        name: listing.name,
        unitPrice: listing.price,
        qty: 1,
        color: color || (listing.colors && listing.colors[0]) || "",
        size: size || "",
        maxStock: maxStock,
        image: listing.image
      });
    }
    saveCart();
    renderCartBadge();
    toast(listing.name + " added to cart");
  }

  function changeQty(lineId, delta) {
    const item = cart.find((i) => i.lineId === lineId);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter((i) => i.lineId !== lineId);
    } else if (item.qty > item.maxStock) {
      item.qty = item.maxStock;
      toast("Only " + item.maxStock + " in stock.");
    }
    saveCart();
    renderCartBadge();
    renderCartDrawer();
  }

  // ---------------------------------------------------------------
  // Toast (small inline feedback, not a dead-end alert box)
  // ---------------------------------------------------------------
  let toastTimer = null;
  function toast(msg) {
    let node = document.getElementById("toast");
    if (!node) {
      node = el("div", { id: "toast", class: "toast" });
      document.body.appendChild(node);
    }
    node.textContent = msg;
    node.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove("show"), 2200);
  }

  // ---------------------------------------------------------------
  // Rendering: header, nav, grid, cards
  // ---------------------------------------------------------------
  function renderShell() {
    root.innerHTML = "";

    const header = el("header", { class: "site-header" }, [
      el("div", { class: "brand" }, [
        el("h1", {}, [SHOP.name]),
        el("p", { class: "tagline" }, [SHOP.tagline])
      ]),
      el("a", {
        class: "whatsapp-link",
        href: "https://wa.me/" + SHOP.whatsappNumber + "?text=" + encodeURIComponent(SHOP.helpMessage),
        target: "_blank", rel: "noopener"
      }, ["Need help? WhatsApp us"])
    ]);

    const nav = el("nav", { class: "category-nav" },
      CATEGORIES.map((c) =>
        el("button", {
          class: "category-tab" + (c.key === currentCategory ? " active" : ""),
          "data-cat": c.key,
          onclick: () => { currentCategory = c.key; location.hash = "#/category/" + c.key; }
        }, [c.label])
      )
    );

    const main = el("main", { id: "view" });
    const cartBtn = el("button", { id: "cart-fab", class: "cart-fab", onclick: openCartDrawer }, [
      el("span", { class: "cart-icon" }, ["\uD83E\uDDFA"]),
      el("span", { id: "cart-count", class: "cart-count" }, [String(cartCount())])
    ]);

    root.appendChild(header);
    root.appendChild(nav);
    root.appendChild(main);
    root.appendChild(cartBtn);
    root.appendChild(el("div", { id: "overlay-root" }));
    renderCartBadge();
  }

  function renderCartBadge() {
    const badge = document.getElementById("cart-count");
    if (badge) badge.textContent = String(cartCount());
    const fab = document.getElementById("cart-fab");
    if (fab) fab.classList.toggle("has-items", cartCount() > 0);
  }

  function renderCategoryView(catKey) {
    currentCategory = catKey;
    document.querySelectorAll(".category-tab").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-cat") === catKey);
    });
    const view = document.getElementById("view");
    view.innerHTML = "";

    const listings = catKey === "fullset" ? computeFullSets() : byCategory(catKey);
    const inStock = listings.filter((l) => l.stock > 0);
    const soldOut = listings.filter((l) => l.stock <= 0);

    if (listings.length === 0) {
      view.appendChild(emptyState(
        catKey === "fullset"
          ? "No full sets are ready right now — every outfit needs all three pieces in stock. Browse Chaniya, Blouse or Dupatta instead."
          : "Nothing here yet. Check back soon or browse another category."
      ));
      return;
    }

    const grid = el("div", { class: "product-grid" });
    inStock.concat(soldOut).forEach((l) => grid.appendChild(productCard(l)));
    view.appendChild(grid);
  }

  function emptyState(message) {
    return el("div", { class: "empty-state" }, [
      el("p", {}, [message]),
      el("button", { class: "btn-secondary", onclick: () => { location.hash = "#/category/fullset"; } }, ["Browse Full Collection"])
    ]);
  }

  function productCard(listing) {
    const soldOut = listing.stock <= 0;
    const lowStock = !soldOut && listing.stock <= 3;
    const card = el("article", { class: "product-card" + (soldOut ? " sold-out" : "") });

    const imgWrap = el("div", { class: "product-img" }, [
      listing.image ? productImage(listing.image, listing.name) : placeholderImage(listing.name)
    ]);
    if (soldOut) imgWrap.appendChild(el("div", { class: "sold-out-tag" }, ["Sold Out"]));
    if (lowStock) imgWrap.appendChild(el("div", { class: "low-stock-tag" }, ["Only " + listing.stock + " left"]));
    card.appendChild(imgWrap);

    card.appendChild(el("h3", { class: "product-name", onclick: () => { location.hash = "#/item/" + listing.id; } }, [listing.name]));
    card.appendChild(el("p", { class: "product-price" }, [rupees(listing.price)]));
    if (listing.colors && listing.colors.length) {
      card.appendChild(el("p", { class: "product-colors" }, [listing.colors.join(" \u00B7 ")]));
    }

    card.appendChild(el("button", {
      class: "btn-primary",
      disabled: soldOut ? "disabled" : null,
      onclick: () => { location.hash = "#/item/" + listing.id; }
    }, [soldOut ? "Sold Out" : "View & Add to Cart"]));

    return card;
  }

  // ---------------------------------------------------------------
  // Item detail (deep-linkable)
  // ---------------------------------------------------------------
  function renderItemView(id) {
    const listing = findListing(id);
    const view = document.getElementById("view");
    view.innerHTML = "";

    if (!listing) {
      view.appendChild(emptyState("This item isn't available anymore — it may have sold out or been updated. Here's the full collection instead."));
      return;
    }

    let selectedColor = listing.colors && listing.colors[0];
    let selectedSize = listing.sizes && listing.sizes[0];
    const soldOut = listing.stock <= 0;

    const wrap = el("div", { class: "item-detail" });
    const imgWrap = el("div", { class: "product-img large" }, [
      listing.image ? productImage(listing.image, listing.name) : placeholderImage(listing.name)
    ]);
    wrap.appendChild(imgWrap);

    wrap.appendChild(el("h2", {}, [listing.name]));
    wrap.appendChild(el("p", { class: "product-price large" }, [rupees(listing.price)]));

    if (listing.pieces) {
      wrap.appendChild(el("p", { class: "set-note" }, [
        "This Full Set includes: " + listing.pieces.map((p) => p.category).join(", ") + " — exactly as shown in the photo."
      ]));
    }

    if (!soldOut && listing.stock <= 3) {
      wrap.appendChild(el("p", { class: "low-stock-text" }, ["Only " + listing.stock + " left — order soon."]));
    }
    if (soldOut) {
      wrap.appendChild(el("p", { class: "sold-out-text" }, ["This item is currently sold out."]));
    }

    if (listing.colors && listing.colors.length > 1) {
      const colorRow = el("div", { class: "option-row" }, [el("label", {}, ["Color"])]);
      const btnGroup = el("div", { class: "pill-group" });
      listing.colors.forEach((c, idx) => {
        const pill = el("button", {
          class: "pill" + (idx === 0 ? " active" : ""),
          onclick: (e) => {
            selectedColor = c;
            btnGroup.querySelectorAll(".pill").forEach((p) => p.classList.remove("active"));
            e.target.classList.add("active");
          }
        }, [c]);
        btnGroup.appendChild(pill);
      });
      colorRow.appendChild(btnGroup);
      wrap.appendChild(colorRow);
    }

    if (listing.sizes && listing.sizes.length) {
      const sizeRow = el("div", { class: "option-row" }, [el("label", {}, ["Blouse Size"])]);
      const btnGroup = el("div", { class: "pill-group" });
      listing.sizes.forEach((s, idx) => {
        const pill = el("button", {
          class: "pill" + (idx === 0 ? " active" : ""),
          onclick: (e) => {
            selectedSize = s;
            btnGroup.querySelectorAll(".pill").forEach((p) => p.classList.remove("active"));
            e.target.classList.add("active");
          }
        }, [s]);
        btnGroup.appendChild(pill);
      });
      sizeRow.appendChild(btnGroup);
      wrap.appendChild(sizeRow);
    } else if (!listing.pieces || listing.category !== "blouse") {
      wrap.appendChild(el("p", { class: "freesize-note" }, ["Free Size (bottom wear)"]));
    }

    wrap.appendChild(el("button", {
      class: "btn-primary large",
      disabled: soldOut ? "disabled" : null,
      onclick: () => addToCart(listing, selectedColor, selectedSize)
    }, [soldOut ? "Sold Out" : "Add to Cart"]));

    const shareUrl = location.href.split("#")[0] + "#/item/" + listing.id;
    wrap.appendChild(el("a", {
      class: "share-link",
      href: "https://wa.me/?text=" + encodeURIComponent("Check out this " + listing.name + " from " + SHOP.name + ": " + shareUrl),
      target: "_blank", rel: "noopener"
    }, ["Share this on WhatsApp"]));

    view.appendChild(wrap);
  }

  // ---------------------------------------------------------------
  // Cart drawer
  // ---------------------------------------------------------------
  function openCartDrawer() {
    renderCartDrawer();
  }

  function closeOverlay() {
    document.getElementById("overlay-root").innerHTML = "";
  }

  function renderCartDrawer() {
    const overlayRoot = document.getElementById("overlay-root");
    overlayRoot.innerHTML = "";

    const totals = computeTotals();
    const drawer = el("div", { class: "overlay" }, []);
    const panel = el("div", { class: "drawer" });

    panel.appendChild(el("div", { class: "drawer-header" }, [
      el("h2", {}, ["Your Cart"]),
      el("button", { class: "close-btn", onclick: closeOverlay }, ["\u2715"])
    ]));

    if (cart.length === 0) {
      panel.appendChild(emptyState("Your cart is empty. Add a chaniya, blouse, dupatta, or a full set to get started."));
    } else {
      const list = el("div", { class: "cart-list" });
      cart.forEach((item) => {
        const row = el("div", { class: "cart-row" }, [
          item.image ? productImage(item.image, item.name) : placeholderImage(item.name),
          el("div", { class: "cart-row-info" }, [
            el("p", { class: "cart-row-name" }, [item.name]),
            el("p", { class: "cart-row-meta" }, [[item.color, item.size].filter(Boolean).join(" \u00B7 ") || "Free Size"]),
            el("p", { class: "cart-row-price" }, [rupees(item.unitPrice)]),
            el("div", { class: "qty-stepper" }, [
              el("button", { onclick: () => changeQty(item.lineId, -1) }, ["\u2212"]),
              el("span", {}, [String(item.qty)]),
              el("button", { onclick: () => changeQty(item.lineId, 1) }, ["+"])
            ])
          ])
        ]);
        list.appendChild(row);
      });
      panel.appendChild(list);

      const summary = el("div", { class: "totals" }, [
        totalRow("Subtotal", totals.subtotal),
        totalRow("10% off", -totals.flat),
        totals.qualifiesExtra ? totalRow("Extra 5% off (orders over \u20B93,500)", -totals.extra) : null,
        totalRow("Total", totals.grandTotal, true),
        el("p", { class: "shipping-note" }, [
          totals.freeShipping
            ? "Shipping: FREE on this order."
            : "Shipping: not included above. Since it depends on your pincode, we'll confirm the exact shipping cost with you on WhatsApp right after payment — orders over \u20B97,000 always ship free."
        ])
      ].filter(Boolean));
      panel.appendChild(summary);

      panel.appendChild(el("button", {
        class: "btn-primary large",
        onclick: () => { closeOverlay(); renderCheckoutForm(); }
      }, ["Proceed to Details"]));
    }

    drawer.appendChild(panel);
    drawer.addEventListener("click", (e) => { if (e.target === drawer) closeOverlay(); });
    overlayRoot.appendChild(drawer);
  }

  function totalRow(label, amount, strong) {
    return el("div", { class: "total-row" + (strong ? " strong" : "") }, [
      el("span", {}, [label]),
      el("span", {}, [(amount < 0 ? "\u2212" : "") + rupees(Math.abs(amount))])
    ]);
  }

  // ---------------------------------------------------------------
  // Checkout form -> validation -> Razorpay -> WhatsApp handoff
  // ---------------------------------------------------------------
  function renderCheckoutForm() {
    const overlayRoot = document.getElementById("overlay-root");
    overlayRoot.innerHTML = "";
    const totals = computeTotals();

    const drawer = el("div", { class: "overlay" });
    const panel = el("div", { class: "drawer" });

    panel.appendChild(el("div", { class: "drawer-header" }, [
      el("h2", {}, ["Your Details"]),
      el("button", { class: "close-btn", onclick: closeOverlay }, ["\u2715"])
    ]));

    const form = el("form", { class: "checkout-form" });
    const nameField = formField("Full Name", "text", "name");
    const phoneField = formField("Phone Number (10 digits)", "tel", "phone");
    const addressField = formField("Delivery Address", "text", "address", true);
    const pinField = formField("Pincode (6 digits)", "text", "pincode");

    [nameField, phoneField, addressField, pinField].forEach((f) => form.appendChild(f.wrap));

    const payBtn = el("button", { type: "submit", class: "btn-primary large" }, [
      "Pay " + rupees(totals.grandTotal) + " Securely"
    ]);
    form.appendChild(payBtn);

    const statusBox = el("div", { class: "payment-status" });
    form.appendChild(statusBox);

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const values = {
        name: nameField.input.value.trim(),
        phone: phoneField.input.value.trim(),
        address: addressField.input.value.trim(),
        pincode: pinField.input.value.trim()
      };
      const errors = validateCheckout(values);
      [nameField, phoneField, addressField, pinField].forEach((f) => setFieldError(f, errors[f.key]));
      if (Object.keys(errors).length > 0) {
        statusBox.textContent = "Please fix the highlighted fields above.";
        statusBox.className = "payment-status error";
        return;
      }
      statusBox.textContent = "";
      statusBox.className = "payment-status";
      beginPayment(values, totals, statusBox);
    });

    panel.appendChild(form);
    drawer.appendChild(panel);
    drawer.addEventListener("click", (e) => { if (e.target === drawer) closeOverlay(); });
    overlayRoot.appendChild(drawer);
  }

  function formField(label, type, key, isTextarea) {
    const input = isTextarea
      ? el("textarea", { name: key, rows: "3" })
      : el("input", { type: type, name: key });
    const errorNode = el("p", { class: "field-error" }, []);
    const wrap = el("div", { class: "form-field" }, [
      el("label", {}, [label]),
      input,
      errorNode
    ]);
    return { wrap, input, errorNode, key };
  }

  function setFieldError(field, message) {
    field.errorNode.textContent = message || "";
    field.input.classList.toggle("invalid", Boolean(message));
  }

  function validateCheckout(values) {
    const errors = {};
    if (!values.name || values.name.length < 2) errors.name = "Enter the name for delivery.";
    if (!/^[0-9]{10}$/.test(values.phone)) errors.phone = "Enter a valid 10-digit phone number.";
    if (!values.address || values.address.length < 10) errors.address = "Enter your full delivery address.";
    if (!/^[0-9]{6}$/.test(values.pincode)) errors.pincode = "Enter a valid 6-digit pincode.";
    return errors;
  }

  function beginPayment(customer, totals, statusBox) {
    lastCheckoutAmount = totals.grandTotal;
    lastCheckoutSummary = buildOrderSummary(customer, totals);

    if (typeof Razorpay === "undefined") {
      statusBox.className = "payment-status error";
      statusBox.innerHTML = "";
      statusBox.appendChild(el("p", {}, ["We couldn't load the secure payment window — this usually means the internet connection dropped."]));
      statusBox.appendChild(retryButton(statusBox, customer, totals));
      return;
    }

    const options = {
      key: SHOP.razorpayKeyId,
      amount: Math.round(totals.grandTotal * 100),
      currency: "INR",
      name: SHOP.name,
      description: "Order payment",
      prefill: { name: customer.name, contact: customer.phone },
      notes: { address: customer.address, pincode: customer.pincode },
      theme: { color: "#8C1D40" },
      handler: function (response) {
        onPaymentSuccess(response, customer, totals);
      },
      modal: {
        ondismiss: function () {
          statusBox.className = "payment-status error";
          statusBox.innerHTML = "";
          statusBox.appendChild(el("p", {}, ["Payment wasn't completed. Your cart and details are still saved \u2014 tap below to try again."]));
          statusBox.appendChild(retryButton(statusBox, customer, totals));
        }
      }
    };

    try {
      const rzp = new Razorpay(options);
      rzp.on("payment.failed", function (response) {
        statusBox.className = "payment-status error";
        statusBox.innerHTML = "";
        statusBox.appendChild(el("p", {}, ["Payment failed: " + (response.error && response.error.description ? response.error.description : "please try again") + "."]));
        statusBox.appendChild(retryButton(statusBox, customer, totals));
      });
      rzp.open();
    } catch (err) {
      statusBox.className = "payment-status error";
      statusBox.textContent = "Something went wrong opening the payment window. Please try again.";
      statusBox.appendChild(retryButton(statusBox, customer, totals));
    }
  }

  function retryButton(statusBox, customer, totals) {
    return el("button", {
      type: "button",
      class: "btn-primary",
      onclick: () => beginPayment(customer, totals, statusBox)
    }, ["Retry Payment"]);
  }

  function buildOrderSummary(customer, totals) {
    const lines = cart.map((i) => "\u2022 " + i.name + (i.color ? " (" + i.color : "") + (i.size ? ", " + i.size + ")" : i.color ? ")" : "") + " x" + i.qty + " = " + rupees(i.unitPrice * i.qty));
    return [
      "New order on " + SHOP.name + ":",
      lines.join("\n"),
      "Subtotal: " + rupees(totals.subtotal),
      "Discount applied: " + rupees(totals.flat + totals.extra),
      "Total paid: " + rupees(totals.grandTotal),
      totals.freeShipping ? "Shipping: FREE" : "Shipping: to be confirmed based on pincode " + customer.pincode,
      "",
      "Customer: " + customer.name,
      "Phone: " + customer.phone,
      "Address: " + customer.address + " - " + customer.pincode
    ].join("\n");
  }

  function onPaymentSuccess(response, customer, totals) {
    const paymentLine = "Payment ID: " + response.razorpay_payment_id;
    const message = lastCheckoutSummary + "\n" + paymentLine;
    cart = [];
    saveCart();
    renderCartBadge();

    const overlayRoot = document.getElementById("overlay-root");
    overlayRoot.innerHTML = "";
    const drawer = el("div", { class: "overlay" });
    const panel = el("div", { class: "drawer" });
    panel.appendChild(el("div", { class: "confirmation" }, [
      el("h2", {}, ["Payment received!"]),
      el("p", {}, ["Thank you, " + customer.name + ". Tap below to send your order details to us on WhatsApp so we can confirm shipping and get it packed."]),
      el("a", {
        class: "btn-primary large",
        href: "https://wa.me/" + SHOP.whatsappNumber + "?text=" + encodeURIComponent(message),
        target: "_blank", rel: "noopener"
      }, ["Send Order on WhatsApp"]),
      el("button", { class: "btn-secondary", onclick: () => { closeOverlay(); location.hash = "#/category/fullset"; } }, ["Continue Shopping"])
    ]));
    drawer.appendChild(panel);
    overlayRoot.appendChild(drawer);
  }

  // ---------------------------------------------------------------
  // Router
  // ---------------------------------------------------------------
  function route() {
    const hash = location.hash || "#/category/fullset";
    const parts = hash.replace("#/", "").split("/");
    try {
      if (parts[0] === "category" && parts[1]) {
        renderCategoryView(parts[1]);
      } else if (parts[0] === "item" && parts[1]) {
        renderItemView(parts.slice(1).join("/"));
      } else if (parts[0] === "set" && parts[1]) {
        renderItemView("set-" + parts[1]);
      } else {
        renderCategoryView("fullset");
      }
    } catch (err) {
      renderFatalError();
    }
  }

  function renderFatalError() {
    const view = document.getElementById("view") || root;
    view.innerHTML = "";
    view.appendChild(el("div", { class: "empty-state" }, [
      el("p", {}, ["Something went wrong loading this page."]),
      el("button", { class: "btn-primary", onclick: () => { location.hash = "#/category/fullset"; route(); } }, ["Back to Shop"]),
      el("a", {
        class: "btn-secondary", href: "https://wa.me/" + SHOP.whatsappNumber + "?text=" + encodeURIComponent(SHOP.helpMessage),
        target: "_blank", rel: "noopener"
      }, ["Get Help on WhatsApp"])
    ]));
  }

  // ---------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------
  function init() {
    try {
      renderShell();
      route();
      window.addEventListener("hashchange", route);
    } catch (err) {
      renderFatalError();
    }
  }

  window.addEventListener("error", function () {
    // Last-resort safety net so the customer never sees a blank white page.
    if (!document.getElementById("view") || document.getElementById("view").innerHTML.trim() === "") {
      renderFatalError();
    }
  });

  document.addEventListener("DOMContentLoaded", init);
})();
