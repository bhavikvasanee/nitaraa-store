# Nitaraa Ethnic Wear — Store Website

A mobile-first catalog site for Navratri chaniya choli sets. Customers
browse, pick a Full Set / Chaniya / Blouse / Dupatta, pay securely on-site
via Razorpay (cards, UPI, netbanking, wallets — with automatic retry on
failure), and the confirmed order is handed to you on WhatsApp.

No app install needed, no monthly software cost, no backend server —
just this website plus your own domain.

---

## 1. What this is NOT (read this first)

This is a **static website** — it has no server and no live database.
That was the right trade-off for your 10-15 day timeline and zero/low
budget, but it means two things you must know:

1. **Stock numbers don't update automatically.** When someone buys
   something, you must manually lower the `stock` number for that item
   in `js/data.js` after you confirm the sale on WhatsApp. If you forget,
   two customers could both believe the same last piece is available.
   Check WhatsApp and update stock *before* re-sharing a popular item.

2. **Payment confirmation is not independently double-checked by a
   server.** Razorpay's own checkout window is fully secure (your
   customers' card/UPI details never touch your site at all — they go
   straight to Razorpay). But because there's no backend to verify the
   payment signature, always do a quick final check: before packing any
   order, open your **Razorpay Dashboard → Payments** and confirm the
   payment actually shows as captured, using the Payment ID from the
   WhatsApp message. This takes 10 seconds per order and fully closes
   the gap.

Everything else below is genuinely automatic and safe.

---

## 2. One-time setup

### 2a. Get your Razorpay key
1. Sign up free at https://razorpay.com (no setup fee; ~2% fee only on
   successful payments, nothing charged on failed/abandoned ones).
2. Go to **Settings → API Keys** and generate a key.
3. Open `js/data.js` and paste it into `razorpayKeyId`.
   - Use the `rzp_test_...` key first and run a full test order (see
     Section 4) before going live.
   - Switch to the `rzp_live_...` key only once you've completed KYC
     in Razorpay and tested successfully.

### 2b. Set your WhatsApp number
In `js/data.js`, set `whatsappNumber` to your number with country code,
no spaces, no `+`. Example: `919876543210`.

### 2c. Add your products
Open `js/data.js` and follow the comments at the top of the `PRODUCTS`
list. Four sample designs are included so you can see the exact format
— delete them once your real 30 items are in. Remember:
- Chaniya and Dupatta: no `sizes` field (Free Size, shown automatically).
- Blouse: always include `sizes`.
- Three pieces sharing the same `designId` automatically become a
  "Full Set" listing — you never build that yourself.

### 2d. Add your photos
See `images/README-images.txt`. Missing photos show a neat placeholder
instead of breaking the page, so you can launch before every photo is in.

---

## 3. Deploying for free on GitHub Pages

1. Create a free GitHub account at https://github.com if you don't have
   one (you already use `asktoscrummaster`, so you can reuse that).
2. Create a new repository, e.g. `nitaraa-store`.
3. Upload every file and folder from this project (keep the same folder
   structure: `index.html`, `css/`, `js/`, `images/`) using GitHub's
   "Add file → Upload files" button in the browser — no command line
   needed.
4. Go to the repository's **Settings → Pages**, set the source branch to
   `main` (or `master`) and folder to `/ (root)`, then save.
5. GitHub gives you a free link like
   `https://asktoscrummaster.github.io/nitaraa-store/` within a minute or two.

## 4. Pointing your custom domain at it

1. Buy your domain (e.g. from GoDaddy, Namecheap, or Hostinger — the
   ~₹700-900/yr you budgeted for).
2. In your domain's DNS settings, add these two records (standard
   GitHub Pages setup):
   - `A` record for `@` → `185.199.108.153` (and optionally the three
     other GitHub Pages IPs: `.109.153`, `.110.153`, `.111.153`, for
     reliability)
   - `CNAME` record for `www` → `asktoscrummaster.github.io`
3. Back in your repo's **Settings → Pages**, enter your custom domain
   in the "Custom domain" box and save. Check "Enforce HTTPS" once it's
   available (may take up to 24 hours after DNS updates).

## 5. Testing checklist before you share the link anywhere

Run through this once with the **test** Razorpay key:
- [ ] Browse all 4 categories — Full Set, Chaniya, Blouse, Dupatta
- [ ] Confirm the Full Set for a complete design shows the right combined price
- [ ] Mark a piece's stock to 0 in `data.js` and confirm its Full Set disappears automatically
- [ ] Add items to cart, close the browser tab, reopen the link — cart should still be there
- [ ] Add enough items to cross ₹3,500 — confirm the extra 5% applies correctly
- [ ] Try checkout with an invalid phone/pincode — confirm you see a clear inline error, not a crash
- [ ] Complete a test payment — confirm the WhatsApp message opens with the correct order details and a Payment ID
- [ ] In Razorpay's test mode, trigger a failed payment — confirm you see a clear "Retry Payment" option and your cart isn't lost
- [ ] Tap the floating WhatsApp help button from a few different pages
- [ ] Open a product link directly (e.g. share it to yourself) — confirm it opens straight to that item
- [ ] Visit a broken/old link — confirm it shows a friendly message and a way back, not a blank page
- [ ] Open `admin.html`, unlock it, change a stock number, download the file, and confirm it loads correctly when it replaces `js/data.js`

Once everything above passes, switch to your `rzp_live_...` key and you're live.

---

## 6. Day-to-day use — the easy way (admin.html)

There's a simple admin page at `yourdomain.com/admin.html` built just
for quick stock updates — no code editing, no risk of a typo breaking
the site.

1. Open `admin.html` on your phone or laptop and enter the password
   (set in `js/data.js` → `adminPassword`; the sample is `nitaraa2026` —
   change it to anything you like before you go live).
2. Every chaniya, blouse, and dupatta is listed with **−** / **+**
   buttons, a typeable number, and a one-tap **Sold Out** button.
3. After confirming a sale on WhatsApp, adjust that item's number here.
4. When you're done, tap **Download Updated File** — this saves a new
   `data.js` to your phone/computer's Downloads folder.
5. On GitHub, open the repo, click into the `js` folder, click
   **Add file → Upload files**, drop in the downloaded `data.js`
   (same name), and commit. The live site updates within a minute.

This is a basic password lock, not bank-grade security (anyone who
guesses or views the password in the page's code could open it) — but
it's enough to stop random visitors from poking around. Don't store
anything more sensitive than stock numbers through it.

One side effect: once you download a file from the admin page, the
friendly explanatory comments in the original `data.js` are replaced
with your live data (the file still works perfectly — it just won't
have the long how-to notes anymore). Keep your original project zip
somewhere safe if you ever want to re-read those full instructions.

### Day-to-day use — the manual way (optional)

You can still hand-edit `js/data.js` directly if you prefer:
- **New sale** → lower that item's `stock` number, re-upload the file
  on GitHub (click the file → pencil/edit icon → Commit changes).
- **New item to add** → copy one existing product block, give it a
  new unique `designId`/`id`, fill in the details, add its photo.
- **Price change** → edit the `price` number for that item.
- **Pause the whole shop** → set every item's `stock` to `0`.

---

## 7. Definition of Done — final checklist

- [x] Loads fast, phone-friendly, no app install
- [x] Homepage with 4 categories: Full Set, Chaniya, Blouse, Dupatta
- [x] Each piece: image (with safe placeholder), price, color, size (blouse only), live stock count
- [x] Full Set auto-computed from matching design IDs — disappears automatically if any one piece sells out
- [x] 10% flat discount always; +5% extra above ₹3,500 subtotal
- [x] Sold-out pieces blocked from cart; "Only X left" badge at ≤3 stock
- [x] Cart persists through reload, crash, or closed tab
- [x] No Cash on Delivery anywhere
- [x] Razorpay checkout embedded on-site with native payment-failure retry
- [x] Order only confirmed after successful payment
- [x] Shipping note shown (free above ₹7,000, otherwise confirmed on WhatsApp)
- [x] WhatsApp message auto-prepared after successful payment, including Payment ID
- [x] "Back to Shop"/help access on every page; broken links show a friendly message, not a dead error
- [x] Every item and every full set has its own shareable link
- [x] Stock updates have an easy point-and-tap path (admin.html) as well as a plain-text edit to one file
- [x] "Nitaraa Ethnic Wear" branding, festive look, English
- [x] Deployable on free GitHub Pages, mappable to a custom domain

If anything above doesn't match what you see once it's live, that's a
bug to flag — everything on this list was built to work exactly as
written.
