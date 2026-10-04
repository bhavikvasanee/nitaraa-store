/* =====================================================================
   NITARAA ETHNIC WEAR — SHOP DATA
   =====================================================================
   This is the ONLY file you should need to edit day-to-day.
   Everything here is plain text — no coding knowledge needed.
   Full editing instructions are in README.md. Read that first.
   ===================================================================== */

const SHOP = {
  name: "Nitaraa Ethnic Wear",
  tagline: "Navratri Collection",

  // Your WhatsApp number, with country code, NO spaces, NO +, NO leading 0.
  // Example: for +91 98765 43210, write "919876543210"
  whatsappNumber: "918500666039",

  // A simple lock on the admin page (admin.html) so random visitors can't
  // poke at it. This is a basic deterrent only — view-source can reveal it,
  // so it stops casual browsing, not a determined snoop. Change it to
  // anything you like; just remember it.
  adminPassword: "nitaraa2026",

  // From your Razorpay Dashboard → Settings → API Keys.
  // Use the key that STARTS WITH "rzp_live_" once you're ready to go live.
  // Keep "rzp_test_..." while you're still testing — test payments cost nothing
  // and never actually charge a card.
  razorpayKeyId: "rzp_test_1234567890abcd",

  // Discount rules — matches what you told me:
  // 10% off every order, PLUS an extra 5% off (on the already-discounted
  // total) if the subtotal before discount is above extraDiscountThreshold.
  discount: {
    flatRate: 0.10,
    extraRate: 0.05,
    extraThreshold: 3500
  },

  // Orders at or above this amount ship free. Below it, shipping is
  // confirmed with the customer on WhatsApp after payment, since the
  // exact courier cost depends on their pincode and this site has no
  // way to look up live courier rates.
  freeShippingThreshold: 7000,

  // Shown in the footer and on the WhatsApp help button.
  helpMessage: "Hi! I need some help with my order on the Nitaraa website."
};

/* =====================================================================
   PRODUCTS
   =====================================================================
   Every physical piece (chaniya, blouse, or dupatta) is its own entry.
   Three pieces that belong to the same outfit share the same "designId"
   — that's how the site automatically builds the "Full Set" listing.
   You do NOT need to create the Full Set yourself. If a design's
   chaniya + blouse + dupatta all show stock > 0, the Full Set appears
   on its own automatically. If any one piece sells out, the Full Set
   disappears by itself until you restock it.

   FIELDS:
   id         - unique, never reuse even after an item sells out. Format
                suggestion: "category-designId", e.g. "chaniya-D05"
   designId   - groups pieces into one outfit. Leave it unique per piece
                (e.g. "D04-solo") if a piece has no matching set.
   category   - exactly one of: "chaniya", "blouse", "dupatta"
   name       - shown to customers
   price      - in rupees, number only, no commas, no ₹ symbol
   colors     - list of color names shown as text chips
   sizes      - ONLY for blouse. Omit this field entirely for chaniya/dupatta
                (they are Free Size, shown automatically).
   image      - path to your photo, e.g. "images/chaniya-D01.jpg"
                If the photo is missing, the site shows a neat placeholder
                instead of a broken image, so you can add photos later.
   stock      - how many you physically have left. YOU must lower this
                number yourself after confirming a sale on WhatsApp —
                it does NOT update automatically. See README.md.

   EASIER WAY TO UPDATE STOCK: open admin.html on your phone or laptop
   instead of editing this text file by hand. It shows every item with
   a quick -1 / Sold Out button, then gives you a ready-to-upload file —
   see README.md Section 6 for the full walkthrough.

   The four example designs below (D01-D04) are placeholders so you can
   see exactly how the format and the Full Set logic work. Replace them
   with your real 30 items, copying the pattern. Delete these examples
   once your real catalog is in.
   ===================================================================== */

const PRODUCTS = [
  // ---- Design D01: complete set, low blouse stock (demos "Only X left") ----
  { id: "chaniya-D01", designId: "D01", category: "chaniya", name: "Marigold Bandhani Chaniya",
    price: 1899, colors: ["Marigold Yellow"], image: "images/chaniya-D01.jpg", stock: 5 },
  { id: "blouse-D01", designId: "D01", category: "blouse", name: "Marigold Bandhani Blouse",
    price: 899, colors: ["Marigold Yellow"], sizes: ["S", "M", "L", "XL"], image: "images/blouse-D01.jpg", stock: 2 },
  { id: "dupatta-D01", designId: "D01", category: "dupatta", name: "Marigold Bandhani Dupatta",
    price: 699, colors: ["Marigold Yellow"], image: "images/dupatta-D01.jpg", stock: 6 },

  // ---- Design D02: dupatta sold out, so Full Set auto-hides, pieces remain sellable ----
  { id: "chaniya-D02", designId: "D02", category: "chaniya", name: "Peacock Mirror-Work Chaniya",
    price: 2199, colors: ["Peacock Blue"], image: "images/chaniya-D02.jpg", stock: 4 },
  { id: "blouse-D02", designId: "D02", category: "blouse", name: "Peacock Mirror-Work Blouse",
    price: 999, colors: ["Peacock Blue"], sizes: ["S", "M", "L"], image: "images/blouse-D02.jpg", stock: 4 },
  { id: "dupatta-D02", designId: "D02", category: "dupatta", name: "Peacock Mirror-Work Dupatta",
    price: 799, colors: ["Peacock Blue"], image: "images/dupatta-D02.jpg", stock: 0 },

  // ---- Design D03: complete set, priced above the ₹3,500 extra-discount line ----
  { id: "chaniya-D03", designId: "D03", category: "chaniya", name: "Rani Pink Zardozi Chaniya",
    price: 2499, colors: ["Rani Pink"], image: "images/chaniya-D03.jpg", stock: 7 },
  { id: "blouse-D03", designId: "D03", category: "blouse", name: "Rani Pink Zardozi Blouse",
    price: 1199, colors: ["Rani Pink"], sizes: ["S", "M", "L", "XL"], image: "images/blouse-D03.jpg", stock: 7 },
  { id: "dupatta-D03", designId: "D03", category: "dupatta", name: "Rani Pink Zardozi Dupatta",
    price: 899, colors: ["Rani Pink", "Gold"], image: "images/dupatta-D03.jpg", stock: 7 },

  // ---- Design D04: a standalone piece with no matching blouse/dupatta in stock ----
  // (shows that not every piece needs to belong to a set)
  { id: "chaniya-D04-solo", designId: "D04-solo", category: "chaniya", name: "Teal Gota Patti Chaniya",
    price: 1699, colors: ["Teal"], image: "images/chaniya-D04.jpg", stock: 3 }
];

/* Optional: give a design's auto-built Full Set its own name/photo.
   If you skip a designId here, the site builds a sensible default
   name and uses the chaniya's photo automatically. */
const SET_OVERRIDES = {
  // "D01": { name: "Marigold Bandhani Full Set", image: "images/set-D01.jpg" }
};
