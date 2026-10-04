/* =====================================================================
   NITARAA ADMIN — quick stock updates without hand-editing code.

   IMPORTANT: this page only edits the copy of your products sitting in
   this browser tab. Nothing on your live site changes until you tap
   "Download Updated File" and re-upload it to GitHub in place of
   js/data.js. See README.md Section 6.
   ===================================================================== */

(function () {
  "use strict";

  const root = document.getElementById("admin-app");
  // Work on a deep copy so we never mutate the original PRODUCTS silently.
  let working = JSON.parse(JSON.stringify(PRODUCTS));
  const originalSnapshot = JSON.parse(JSON.stringify(PRODUCTS));
  let unlocked = sessionStorage.getItem("nitaraa_admin_unlocked") === "yes";

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach((k) => {
        if (k === "class") node.className = attrs[k];
        else if (k.startsWith("on") && typeof attrs[k] === "function") node.addEventListener(k.slice(2), attrs[k]);
        else node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach((c) => { if (c) node.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return node;
  }

  function renderLock() {
    root.innerHTML = "";
    const box = el("div", { class: "lock-screen" }, [
      el("h2", {}, ["Admin Access"]),
      el("p", {}, ["Enter the admin password to update stock."])
    ]);
    const input = el("input", { type: "password", placeholder: "Password" });
    const error = el("p", { style: "color:#B3401F;font-size:13px;min-height:16px;" }, []);
    const btn = el("button", {
      class: "btn-primary large",
      onclick: () => {
        if (input.value === SHOP.adminPassword) {
          unlocked = true;
          sessionStorage.setItem("nitaraa_admin_unlocked", "yes");
          renderAdmin();
        } else {
          error.textContent = "That password isn't right — try again.";
        }
      }
    }, ["Unlock"]);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") btn.click(); });
    box.appendChild(input);
    box.appendChild(error);
    box.appendChild(btn);
    root.appendChild(box);
  }

  function hasChanges() {
    return JSON.stringify(working) !== JSON.stringify(originalSnapshot);
  }

  function renderAdmin() {
    root.innerHTML = "";
    root.appendChild(el("div", { class: "admin-header" }, [
      el("h1", {}, ["Update Stock"]),
      el("p", {}, ["Adjust numbers below after confirming each sale on WhatsApp, then download the file at the bottom and re-upload it to GitHub."])
    ]));

    ["chaniya", "blouse", "dupatta"].forEach((cat) => {
      const items = working.filter((p) => p.category === cat);
      if (items.length === 0) return;
      root.appendChild(el("h2", { class: "category-heading" }, [capitalize(cat)]));
      items.forEach((item) => root.appendChild(adminRow(item)));
    });

    const bar = el("div", { class: "sticky-bar" }, [
      el("button", { class: "btn-secondary", onclick: copyAsText }, ["Copy as Text"]),
      el("button", { class: "btn-primary", onclick: downloadFile }, ["Download Updated File"])
    ]);
    root.appendChild(bar);
    root.appendChild(el("p", { class: "admin-note" }, [
      hasChanges()
        ? "You have unsaved changes — download the file and upload it to GitHub to make them live."
        : "No changes yet. Adjust a stock number above, then download the updated file."
    ]));
  }

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function adminRow(item) {
    const row = el("div", { class: "admin-row" + (item.stock <= 0 ? " zero-stock" : item.stock <= 3 ? " low-stock" : "") });

    const thumb = el("div", { class: "thumb" });
    const img = el("img", { src: item.image, alt: item.name });
    img.addEventListener("error", () => { thumb.textContent = item.name; });
    thumb.appendChild(img);
    row.appendChild(thumb);

    row.appendChild(el("div", { class: "admin-row-info" }, [
      el("p", { class: "name" }, [item.name]),
      el("p", { class: "meta" }, ["\u20B9" + item.price + " \u00B7 Design " + item.designId])
    ]));

    const stockInput = el("input", { type: "number", min: "0", value: String(item.stock) });
    stockInput.addEventListener("change", () => {
      const v = Math.max(0, parseInt(stockInput.value, 10) || 0);
      item.stock = v;
      stockInput.value = String(v);
      renderAdmin();
    });

    const controls = el("div", { class: "admin-stock-controls" }, [
      el("button", { onclick: () => { item.stock = Math.max(0, item.stock - 1); renderAdmin(); } }, ["\u2212"]),
      stockInput,
      el("button", { onclick: () => { item.stock = item.stock + 1; renderAdmin(); } }, ["+"])
    ]);
    row.appendChild(controls);

    row.appendChild(el("button", {
      class: "mark-sold-out",
      onclick: () => { item.stock = 0; renderAdmin(); }
    }, ["Sold Out"]));

    return row;
  }

  function buildFileContents() {
    const header = "/* Nitaraa Ethnic Wear — shop data. Generated by admin.html on "
      + new Date().toLocaleString("en-IN") + ".\n"
      + "   Full field explanations are in the original data.js from your project zip\n"
      + "   and in README.md — this regenerated copy keeps the same structure. */\n\n";
    return header
      + "const SHOP = " + JSON.stringify(SHOP, null, 2) + ";\n\n"
      + "const PRODUCTS = " + JSON.stringify(working, null, 2) + ";\n\n"
      + "const SET_OVERRIDES = " + JSON.stringify((typeof SET_OVERRIDES !== "undefined" ? SET_OVERRIDES : {}), null, 2) + ";\n";
  }

  function downloadFile() {
    const blob = new Blob([buildFileContents()], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = el("a", { href: url, download: "data.js" }, []);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function copyAsText() {
    const text = buildFileContents();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        () => alert("Copied! Paste it into js/data.js and save."),
        () => alert("Couldn't copy automatically — please use Download instead.")
      );
    } else {
      alert("Copy isn't supported on this browser — please use Download instead.");
    }
  }

  if (unlocked) renderAdmin(); else renderLock();
})();
