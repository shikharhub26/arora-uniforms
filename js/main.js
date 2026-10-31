/* Arora Uniforms, Kalkaji — mock-up behaviour
   Everything here runs without a build step. Sections are independent, so
   removing one block does not break the others. */
(function () {
  'use strict';

  /* ----------------------------------------------------------------------
     Helpers
     ---------------------------------------------------------------------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  const fmt = (n) => inr.format(n);
  const store = {
    get(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable: ignore */ } }
  };
  const istNow = () => {
    // Shop time is Indian Standard Time regardless of where the viewer is.
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: 'numeric', month: 'numeric', hour12: false }).formatToParts(new Date());
    const get = (t) => Number(parts.find((p) => p.type === t).value);
    return { hour: get('hour') % 24, minute: get('minute'), month: get('month') - 1 };
  };

  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-on'), 2600);
  }

  /* ----------------------------------------------------------------------
     Theme toggle
     ---------------------------------------------------------------------- */
  (function theme() {
    const root = document.documentElement;
    const saved = store.get('au-theme', null);
    if (saved === 'dark' || saved === 'light') root.setAttribute('data-theme', saved);
    const btn = $('#theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const explicit = root.getAttribute('data-theme');
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = explicit ? explicit === 'dark' : systemDark;
      const next = isDark ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      store.set('au-theme', next);
    });
  })();

  /* ----------------------------------------------------------------------
     Header: shadow on scroll, active section in the nav
     ---------------------------------------------------------------------- */
  (function header() {
    const header = $('.site-header');
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const links = $$('.nav a[href^="#"]');
    const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    if ('IntersectionObserver' in window && map.size) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          links.forEach((a) => a.classList.remove('is-active'));
          const a = map.get(en.target.id);
          if (a) a.classList.add('is-active');
        });
      }, { rootMargin: '-40% 0px -55% 0px' });
      map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
    }
  })();

  /* ----------------------------------------------------------------------
     Mobile menu
     ---------------------------------------------------------------------- */
  (function menu() {
    const drawer = $('#menu');
    const openBtn = $('#menu-open');
    if (!drawer || !openBtn) return;
    const setOpen = (open) => {
      drawer.classList.toggle('is-open', open);
      drawer.setAttribute('aria-hidden', String(!open));
      openBtn.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) { const first = $('a, button', drawer); first && first.focus(); } else { openBtn.focus(); }
    };
    openBtn.addEventListener('click', () => setOpen(!drawer.classList.contains('is-open')));
    $$('[data-close-menu]', drawer).forEach((el) => el.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('is-open')) setOpen(false); });
  })();

  /* ----------------------------------------------------------------------
     Hero carousel
     ---------------------------------------------------------------------- */
  (function hero() {
    const hero = $('#hero');
    if (!hero) return;
    const slides = $$('.hero-slide', hero);
    const tabs = $$('.hero-progress button', hero);
    const indexEl = $('#slide-index');
    const MS = 6500;
    hero.style.setProperty('--slide-ms', MS + 'ms');
    let i = 0, timer = null, paused = false;

    function show(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle('is-active', k === i));
      tabs.forEach((t, k) => {
        t.classList.remove('is-active', 'is-done');
        t.setAttribute('aria-selected', String(k === i));
        if (k < i) t.classList.add('is-done');
        if (k === i) { void t.offsetWidth; t.classList.add('is-active'); }
      });
      if (indexEl) indexEl.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
      restart();
    }
    function restart() {
      clearTimeout(timer);
      if (reduceMotion || paused) return;
      timer = setTimeout(() => show(i + 1), MS);
    }
    tabs.forEach((t) => t.addEventListener('click', () => show(Number(t.dataset.go))));
    $('#hero-prev').addEventListener('click', () => show(i - 1));
    $('#hero-next').addEventListener('click', () => show(i + 1));
    const pause = (p) => { paused = p; hero.classList.toggle('is-paused', p); restart(); };
    hero.addEventListener('mouseenter', () => pause(true));
    hero.addEventListener('mouseleave', () => pause(false));
    hero.addEventListener('focusin', () => pause(true));
    hero.addEventListener('focusout', () => pause(false));
    document.addEventListener('visibilitychange', () => pause(document.hidden));
    hero.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') show(i + 1); if (e.key === 'ArrowLeft') show(i - 1); });

    // Swipe
    let x0 = null;
    hero.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') x0 = e.clientX; }, { passive: true });
    hero.addEventListener('pointerup', (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) show(dx < 0 ? i + 1 : i - 1);
    }, { passive: true });

    if (reduceMotion) { tabs.forEach((t) => t.classList.remove('is-active')); tabs[0].classList.add('is-done'); }
    restart();
  })();

  /* ----------------------------------------------------------------------
     Reveal on scroll. Only elements below the first screen are hidden, so
     the page is complete at rest and in thumbnails.
     ---------------------------------------------------------------------- */
  (function reveal() {
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    const vh = window.innerHeight;
    const els = $$('[data-reveal]').filter((el) => el.getBoundingClientRect().top > vh * 0.92);
    els.forEach((el) => el.classList.add('reveal'));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    els.forEach((el) => io.observe(el));
  })();

  /* ----------------------------------------------------------------------
     Animated counters
     ---------------------------------------------------------------------- */
  (function counters() {
    const nums = $$('[data-count]');
    if (!nums.length) return;
    const run = (el) => {
      const target = Number(el.dataset.count), suffix = el.dataset.suffix || '';
      if (reduceMotion) { el.textContent = target.toLocaleString('en-IN') + suffix; return; }
      const t0 = performance.now(), dur = 1500;
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * e).toLocaleString('en-IN') + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if (!('IntersectionObserver' in window)) { nums.forEach(run); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.4 });
    nums.forEach((el) => io.observe(el));
  })();

  /* ----------------------------------------------------------------------
     Promo marquee: duplicate the set once so the loop is seamless
     ---------------------------------------------------------------------- */
  (function promo() {
    const track = $('#promo-track');
    if (!track || reduceMotion) return;
    const cards = Array.from(track.children);
    cards.forEach((c) => { const clone = c.cloneNode(true); clone.setAttribute('aria-hidden', 'true'); track.appendChild(clone); });
  })();

  /* ----------------------------------------------------------------------
     Cart (shared by the school finder and the shop)
     ---------------------------------------------------------------------- */
  const cart = {
    items: store.get('au-cart', []),
    view: 'cart',
    order: null,
    add(item) {
      const key = item.id + '|' + item.size;
      const found = this.items.find((x) => x.key === key);
      if (found) found.qty += item.qty || 1; else this.items.push({ key, qty: 1, ...item });
      this.persist(); this.render(); bumpCount();
    },
    setQty(key, qty) {
      const it = this.items.find((x) => x.key === key);
      if (!it) return;
      it.qty = qty; if (it.qty <= 0) this.items = this.items.filter((x) => x.key !== key);
      this.persist(); this.render();
    },
    clear() { this.items = []; this.persist(); this.render(); },
    count() { return this.items.reduce((n, x) => n + x.qty, 0); },
    subtotal() { return this.items.reduce((n, x) => n + x.qty * x.price, 0); },
    delivery() { return this.subtotal() >= 999 || this.subtotal() === 0 ? 0 : 49; },
    persist() { store.set('au-cart', this.items); },
    render() { renderCart(); updateCount(); }
  };

  const FREE_AT = 999;
  function updateCount() {
    const n = cart.count();
    const badge = $('#cart-count');
    if (badge) { badge.textContent = n; badge.classList.toggle('is-on', n > 0); }
    const m = $('#mobile-count');
    if (m) m.textContent = n ? '(' + n + ')' : '';
    const label = $('#cart-items-label');
    if (label) label.textContent = n + (n === 1 ? ' item' : ' items');
  }
  function bumpCount() {
    const badge = $('#cart-count');
    if (!badge) return;
    badge.classList.remove('bump'); void badge.offsetWidth; badge.classList.add('bump');
  }

  const cartEl = $('#cart');
  function openCart(open) {
    if (!cartEl) return;
    cartEl.classList.toggle('is-open', open);
    cartEl.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) { cart.view = cart.view === 'done' ? 'cart' : cart.view; cart.render(); const t = $('#toast'); t && t.classList.remove('is-on'); clearTimeout(toastTimer); const c = $('[data-close-cart].icon-btn', cartEl); c && c.focus(); }
  }
  $('#cart-open') && $('#cart-open').addEventListener('click', () => openCart(true));
  $$('[data-close-cart]').forEach((el) => el.addEventListener('click', () => openCart(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && cartEl && cartEl.classList.contains('is-open')) openCart(false); });
  $('#mobile-order') && $('#mobile-order').addEventListener('click', () => {
    if (cart.count()) openCart(true); else { const s = $('#schools'); s && s.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }); }
  });

  function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  function renderCart() {
    const body = $('#cart-body'), foot = $('#cart-foot');
    if (!body || !foot) return;
    const n = cart.count(), sub = cart.subtotal(), del = cart.delivery();

    if (cart.view === 'done' && cart.order) {
      body.innerHTML = `
        <div class="order-done">
          <span class="mark"><svg><use href="#i-check"/></svg></span>
          <b>Order placed</b>
          <code>${esc(cart.order.id)}</code>
          <p>${cart.order.mode === 'pickup' ? 'Ready for pickup at H-10B, Kalkaji Main Road in 2 working days.' : 'Delivery to ' + esc(cart.order.area || 'your address') + ' within 3 working days.'} We will confirm on ${esc(cart.order.phone || 'your phone')}.</p>
          <p class="hint" style="font-size:12.5px">Demo order. Nothing was charged and nothing was sent.</p>
        </div>`;
      foot.innerHTML = `<button class="btn btn-ghost btn-block" type="button" data-new-order>Start another order</button>`;
      $('[data-new-order]', foot).addEventListener('click', () => { cart.view = 'cart'; cart.order = null; cart.render(); });
      return;
    }

    if (!n) {
      body.innerHTML = `<div class="cart-empty"><svg><use href="#i-cart"/></svg><b>Your order is empty</b><p>Find your school or add items from the shop. Your order is saved on this device.</p></div>`;
      foot.innerHTML = `<a class="btn btn-primary btn-block" href="#schools" data-close-cart>Find your school</a>`;
      $('[data-close-cart]', foot).addEventListener('click', () => openCart(false));
      return;
    }

    if (cart.view === 'cart') {
      body.innerHTML = cart.items.map((it) => `
        <div class="cart-item" data-key="${esc(it.key)}">
          <img src="${esc(it.img)}" alt="" width="64" height="80" loading="lazy">
          <div>
            <h4>${esc(it.name)}</h4>
            <small>Size ${esc(it.size)} · ${fmt(it.price)} each</small>
            <div class="qty"><button type="button" data-dec aria-label="Decrease quantity">−</button><span class="num">${it.qty}</span><button type="button" data-inc aria-label="Increase quantity">+</button></div>
          </div>
          <div><div class="line-price">${fmt(it.qty * it.price)}</div><button class="remove" type="button" data-remove>Remove</button></div>
        </div>`).join('');
      $$('.cart-item', body).forEach((row) => {
        const key = row.dataset.key, it = cart.items.find((x) => x.key === key);
        $('[data-inc]', row).addEventListener('click', () => cart.setQty(key, it.qty + 1));
        $('[data-dec]', row).addEventListener('click', () => cart.setQty(key, it.qty - 1));
        $('[data-remove]', row).addEventListener('click', () => cart.setQty(key, 0));
      });
      const left = Math.max(0, FREE_AT - sub);
      foot.innerHTML = `
        <div class="free-ship">${left > 0 ? 'Add ' + fmt(left) + ' more for free delivery in Delhi NCR' : 'Free delivery unlocked'}</div>
        <div class="free-bar"><i style="width:${Math.min(100, (sub / FREE_AT) * 100)}%"></i></div>
        <div class="cart-row"><span>Subtotal</span><span class="num">${fmt(sub)}</span></div>
        <div class="cart-row"><span>Delivery</span><span class="num">${del ? fmt(del) : 'Free'}</span></div>
        <div class="cart-row total"><span>Total</span><span class="num">${fmt(sub + del)}</span></div>
        <button class="btn btn-primary btn-block" type="button" data-checkout>Proceed to checkout <svg><use href="#i-arrow"/></svg></button>
        <button class="btn btn-ghost btn-block btn-sm" type="button" data-clear>Clear order</button>`;
      $('[data-checkout]', foot).addEventListener('click', () => { cart.view = 'details'; cart.render(); });
      $('[data-clear]', foot).addEventListener('click', () => { cart.clear(); toast('Order cleared'); });
      return;
    }

    if (cart.view === 'details') {
      body.innerHTML = `
        <form class="checkout" id="co-form" novalidate>
          <div class="steps-ind"><span class="is-on"></span><span></span><span></span></div>
          <h3 style="font-size:18px">Contact and collection</h3>
          <div class="field"><label for="co-name">Name</label><input id="co-name" type="text" placeholder="Parent or staff name" required></div>
          <div class="field"><label for="co-phone">Phone</label><input id="co-phone" type="tel" inputmode="tel" placeholder="+91" required></div>
          <div class="field"><label for="co-tag">Name tag to stitch (optional)</label><input id="co-tag" type="text" placeholder="Child's name and class, e.g. Aarav, IV-B"></div>
          <div class="pay-opts" role="radiogroup" aria-label="Collection">
            <label class="pay-opt"><input type="radio" name="mode" value="pickup" checked><span><b>Pick up at the shop</b><small>H-10B, Kalkaji Main Road · ready in 2 working days</small></span></label>
            <label class="pay-opt"><input type="radio" name="mode" value="delivery"><span><b>Home delivery</b><small>Delhi NCR · ${del ? fmt(del) : 'free'} on this order</small></span></label>
          </div>
          <div class="field" id="co-addr-wrap" hidden><label for="co-addr">Delivery address</label><textarea id="co-addr" rows="2" placeholder="House, street, area, pincode"></textarea></div>
        </form>`;
      const wrap = $('#co-addr-wrap', body);
      $$('input[name="mode"]', body).forEach((r) => r.addEventListener('change', () => { wrap.hidden = r.value !== 'delivery' || !r.checked; if (r.value === 'delivery' && r.checked) wrap.hidden = false; }));
      foot.innerHTML = `
        <div class="cart-row total"><span>Total</span><span class="num">${fmt(sub + del)}</span></div>
        <button class="btn btn-primary btn-block" type="button" data-next>Continue to payment <svg><use href="#i-arrow"/></svg></button>
        <button class="btn btn-ghost btn-block btn-sm" type="button" data-back>Back to order</button>`;
      $('[data-back]', foot).addEventListener('click', () => { cart.view = 'cart'; cart.render(); });
      $('[data-next]', foot).addEventListener('click', () => {
        const name = $('#co-name', body).value.trim(), phone = $('#co-phone', body).value.trim();
        if (!name || !phone) { toast('Please add a name and phone number'); ($('#co-name', body).value ? $('#co-phone', body) : $('#co-name', body)).focus(); return; }
        const mode = $('input[name="mode"]:checked', body).value;
        cart.order = { name, phone, mode, tag: $('#co-tag', body).value.trim(), area: ($('#co-addr', body).value || '').trim() };
        cart.view = 'payment'; cart.render();
      });
      return;
    }

    if (cart.view === 'payment') {
      body.innerHTML = `
        <div class="checkout">
          <div class="steps-ind"><span class="is-on"></span><span class="is-on"></span><span></span></div>
          <h3 style="font-size:18px">Payment</h3>
          <div class="pay-opts" role="radiogroup" aria-label="Payment method">
            <label class="pay-opt"><input type="radio" name="pay" value="upi" checked><span><b>UPI</b><small>Google Pay, PhonePe, Paytm or any UPI app</small></span></label>
            <label class="pay-opt"><input type="radio" name="pay" value="card"><span><b>Debit or credit card</b><small>Visa, Mastercard, RuPay</small></span></label>
            <label class="pay-opt"><input type="radio" name="pay" value="later"><span><b>Pay at ${cart.order && cart.order.mode === 'delivery' ? 'delivery' : 'pickup'}</b><small>Cash, card or UPI when you receive it</small></span></label>
          </div>
          <div class="size-result">
            <div class="cart-row"><span>${n} ${n === 1 ? 'item' : 'items'}</span><span class="num">${fmt(sub)}</span></div>
            <div class="cart-row"><span>Delivery</span><span class="num">${del ? fmt(del) : 'Free'}</span></div>
            ${cart.order && cart.order.tag ? `<div class="cart-row"><span>Name tags</span><span>Free · ${esc(cart.order.tag)}</span></div>` : ''}
          </div>
          <p class="hint" style="font-size:12.5px;color:var(--muted)">This is a mock-up. No payment gateway is connected and no money moves.</p>
        </div>`;
      foot.innerHTML = `
        <div class="cart-row total"><span>Pay now</span><span class="num">${fmt(sub + del)}</span></div>
        <button class="btn btn-primary btn-block" type="button" data-place>Place order <svg><use href="#i-check"/></svg></button>
        <button class="btn btn-ghost btn-block btn-sm" type="button" data-back>Back</button>`;
      $('[data-back]', foot).addEventListener('click', () => { cart.view = 'details'; cart.render(); });
      $('[data-place]', foot).addEventListener('click', () => {
        cart.order.id = 'AU-' + new Date().getFullYear() + '-' + String(Math.floor(1000 + Math.random() * 9000));
        cart.order.pay = $('input[name="pay"]:checked', body).value;
        cart.items = []; cart.persist(); cart.view = 'done'; cart.render(); toast('Demo order placed');
      });
    }
  }

  /* ----------------------------------------------------------------------
     Shop: filters, size chips, add to order
     ---------------------------------------------------------------------- */
  (function shop() {
    const grid = $('#products');
    if (!grid) return;
    const chips = $$('#filters .chip');
    const countEl = $('#product-count');
    function applyFilter(f) {
      chips.forEach((c) => { const on = c.dataset.filter === f; c.classList.toggle('is-active', on); c.setAttribute('aria-selected', String(on)); });
      let shown = 0;
      $$('.product', grid).forEach((p) => { const hide = f !== 'all' && p.dataset.cat !== f; p.classList.toggle('is-hidden', hide); if (!hide) shown++; });
      if (countEl) countEl.textContent = shown;
    }
    chips.forEach((c) => c.addEventListener('click', () => applyFilter(c.dataset.filter)));
    $$('[data-filter-link]').forEach((a) => a.addEventListener('click', () => applyFilter(a.dataset.filterLink)));

    grid.addEventListener('click', (e) => {
      const size = e.target.closest('.size');
      if (size) {
        $$('.size', size.parentElement).forEach((s) => s.classList.remove('is-active'));
        size.classList.add('is-active');
        return;
      }
      const add = e.target.closest('[data-add]');
      if (add) {
        const card = add.closest('.product');
        const sz = $('.size.is-active', card);
        cart.add({ id: card.dataset.id, name: card.dataset.name, price: Number(card.dataset.price), img: card.dataset.img, size: sz ? sz.dataset.size : 'Standard' });
        add.classList.add('is-added');
        add.innerHTML = '<svg><use href="#i-check"/></svg>Added';
        setTimeout(() => { add.classList.remove('is-added'); add.innerHTML = '<svg><use href="#i-plus"/></svg>Add to order'; }, 1400);
        toast(card.dataset.name + ' added to your order');
      }
    });
  })();

  /* ----------------------------------------------------------------------
     School finder (sample data for the mock-up)
     ---------------------------------------------------------------------- */
  const SCHOOLS = [
    { id: 'greenfield', name: 'Greenfield Public School', area: 'Kalkaji', colors: ['#0E1B33', '#FFFFFF', '#7A1F2B'],
      summer: [['White half-sleeve shirt', 'shirt', 349, 'assets/img/prod-shirt.webp', 'Two recommended'], ['Grey trousers or pinafore', 'trouser', 499, 'assets/img/prod-trouser.webp', ''], ['School tie, belt and socks set', 'tie-set', 299, 'assets/img/prod-accessories.webp', 'Junior or senior']],
      winter: [['Navy V-neck sweater', 'sweater', 799, 'assets/img/prod-sweater.webp', 'Maroon and gold stripe'], ['Navy crested blazer', 'blazer', 1899, 'assets/img/cat-school.webp', 'Classes VI and above'], ['Grey woollen scarf', 'scarf', 249, 'assets/img/cat-winter.webp', '']] },
    { id: 'stannes', name: "St. Anne's Convent", area: 'Alaknanda', colors: ['#8EC5E8', '#4B5563', '#FFFFFF'],
      summer: [['Sky-blue shirt', 'shirt', 369, 'assets/img/prod-shirt.webp', ''], ['Grey pleated pinafore', 'pinafore', 649, 'assets/img/prod-pinafore.webp', 'Classes I to V'], ['Grey trousers', 'trouser', 499, 'assets/img/prod-trouser.webp', 'Classes VI and above'], ['Belt and socks', 'tie-set', 199, 'assets/img/prod-accessories.webp', '']],
      winter: [['Grey V-neck sweater', 'sweater', 799, 'assets/img/prod-sweater.webp', ''], ['Grey blazer with crest', 'blazer', 1899, 'assets/img/cat-school.webp', '']] },
    { id: 'modernera', name: 'Modern Era School', area: 'Govindpuri', colors: ['#FFFFFF', '#0E1B33', '#C8A24A'],
      summer: [['White checked shirt', 'shirt', 379, 'assets/img/prod-shirt.webp', ''], ['Navy trousers', 'trouser', 499, 'assets/img/prod-trouser.webp', ''], ['House tee for sports day', 'house-tee', 249, 'assets/img/cat-sports.webp', 'Fridays']],
      winter: [['Navy sweater with gold stripe', 'sweater', 799, 'assets/img/prod-sweater.webp', ''], ['Navy sports shorts', 'shorts', 299, 'assets/img/cat-sports.webp', 'PT days']] },
    { id: 'sunrise', name: 'Sunrise International', area: 'Nehru Place', colors: ['#D9C3A5', '#5B3A29', '#FFFFFF'],
      summer: [['Beige shirt', 'shirt', 369, 'assets/img/prod-shirt.webp', ''], ['Brown trousers or skirt', 'trouser', 519, 'assets/img/prod-trouser.webp', ''], ['Tie, belt and socks', 'tie-set', 299, 'assets/img/prod-accessories.webp', '']],
      winter: [['Brown V-neck sweater', 'sweater', 829, 'assets/img/prod-sweater.webp', ''], ['Brown blazer', 'blazer', 1949, 'assets/img/cat-school.webp', '']] },
    { id: 'deshbandhu', name: 'Deshbandhu Senior Secondary', area: 'Kalkaji', colors: ['#FFFFFF', '#6B7280', '#7A1F2B'],
      summer: [['White shirt', 'shirt', 349, 'assets/img/prod-shirt.webp', ''], ['Grey trousers', 'trouser', 499, 'assets/img/prod-trouser.webp', ''], ['Maroon tie and belt', 'tie-set', 299, 'assets/img/prod-accessories.webp', '']],
      winter: [['Maroon sweater', 'sweater', 799, 'assets/img/prod-sweater.webp', ''], ['Grey blazer', 'blazer', 1899, 'assets/img/cat-school.webp', '']] },
    { id: 'lotus', name: 'Lotus Valley Day School', area: 'C.R. Park', colors: ['#1F7A4D', '#FFFFFF', '#C8A24A'],
      summer: [['White shirt', 'shirt', 349, 'assets/img/prod-shirt.webp', ''], ['Bottle-green pinafore', 'pinafore', 669, 'assets/img/prod-pinafore.webp', ''], ['Green tie and belt', 'tie-set', 299, 'assets/img/prod-accessories.webp', '']],
      winter: [['Bottle-green sweater', 'sweater', 799, 'assets/img/prod-sweater.webp', ''], ['Green scarf', 'scarf', 249, 'assets/img/cat-winter.webp', '']] },
    { id: 'kalkajimodel', name: 'Kalkaji Model School', area: 'Kalkaji', colors: ['#FFFFFF', '#1D4ED8', '#0E1B33'],
      summer: [['White shirt', 'shirt', 349, 'assets/img/prod-shirt.webp', ''], ['Royal-blue trousers', 'trouser', 499, 'assets/img/prod-trouser.webp', ''], ['Belt and socks', 'tie-set', 199, 'assets/img/prod-accessories.webp', '']],
      winter: [['Navy sweater', 'sweater', 799, 'assets/img/prod-sweater.webp', ''], ['Navy sports shorts', 'shorts', 299, 'assets/img/cat-sports.webp', '']] },
    { id: 'alaknanda', name: 'Alaknanda Public School', area: 'Alaknanda', colors: ['#F3F4F6', '#7A1F2B', '#0E1B33'],
      summer: [['White half-sleeve shirt', 'shirt', 349, 'assets/img/prod-shirt.webp', ''], ['Maroon pinafore or trousers', 'trouser', 519, 'assets/img/prod-trouser.webp', ''], ['Tie, belt and socks set', 'tie-set', 299, 'assets/img/prod-accessories.webp', '']],
      winter: [['Maroon V-neck sweater', 'sweater', 799, 'assets/img/prod-sweater.webp', ''], ['Navy blazer', 'blazer', 1899, 'assets/img/cat-school.webp', '']] }
  ];
  const CLASS_SIZE = { 'Nursery': '22', 'KG': '22', 'I': '24', 'II': '24', 'III': '26', 'IV': '26', 'V': '28', 'VI': '28', 'VII': '30', 'VIII': '30', 'IX': '32', 'X': '34', 'XI': '36', 'XII': '38' };

  (function finder() {
    const input = $('#school-input'), suggest = $('#school-suggest'), chips = $('#school-chips'), kit = $('#kit'), go = $('#school-go');
    if (!input || !kit) return;
    let current = null, season = [9, 10, 11, 0].includes(istNow().month) ? 'winter' : 'summer', klass = 'IV';

    ['Greenfield Public School', "St. Anne's Convent", 'Modern Era School', 'Lotus Valley Day School'].forEach((n) => {
      const s = SCHOOLS.find((x) => x.name === n);
      const b = document.createElement('button'); b.className = 'chip'; b.type = 'button'; b.textContent = s.name; b.dataset.id = s.id;
      b.addEventListener('click', () => select(s));
      chips.appendChild(b);
    });

    function matches(q) {
      q = q.trim().toLowerCase();
      if (!q) return SCHOOLS.slice(0, 5);
      return SCHOOLS.filter((s) => (s.name + ' ' + s.area).toLowerCase().includes(q)).slice(0, 6);
    }
    function showSuggest(list) {
      if (!list.length) { suggest.innerHTML = '<button type="button" disabled>No match yet. Send a photo on WhatsApp and we will add it.</button>'; }
      else suggest.innerHTML = list.map((s) => `<button type="button" role="option" data-id="${s.id}"><span class="swatch" style="background:linear-gradient(135deg,${s.colors[0]} 0 34%,${s.colors[1]} 34% 67%,${s.colors[2]} 67%)"></span><span><b>${esc(s.name)}</b><small>${esc(s.area)} · ${s.summer.length + s.winter.length} items on file</small></span></button>`).join('');
      suggest.hidden = false; input.setAttribute('aria-expanded', 'true');
    }
    function hideSuggest() { suggest.hidden = true; input.setAttribute('aria-expanded', 'false'); }
    input.addEventListener('input', () => showSuggest(matches(input.value)));
    input.addEventListener('focus', () => showSuggest(matches(input.value)));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); const m = matches(input.value); if (m.length) select(m[0]); }
      if (e.key === 'Escape') hideSuggest();
      if (e.key === 'ArrowDown') { const f = $('button:not([disabled])', suggest); f && f.focus(); e.preventDefault(); }
    });
    suggest.addEventListener('click', (e) => { const b = e.target.closest('button[data-id]'); if (b) select(SCHOOLS.find((s) => s.id === b.dataset.id)); });
    go.addEventListener('click', () => { const m = matches(input.value); if (m.length) select(m[0]); else { showSuggest([]); } });
    document.addEventListener('click', (e) => { if (!e.target.closest('.search')) hideSuggest(); });

    function select(s) {
      current = s; input.value = s.name; hideSuggest();
      $$('.chip', chips).forEach((c) => c.classList.toggle('is-active', c.dataset.id === s.id));
      renderKit();
      if (window.innerWidth < 960) kit.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }
    function renderKit() {
      const s = current, items = s[season];
      const size = CLASS_SIZE[klass];
      const total = items.reduce((n, it) => n + it[2], 0);
      kit.innerHTML = `
        <div class="kit-head">
          <div><h3>${esc(s.name)}</h3><p>${esc(s.area)} · colours on file</p></div>
          <div class="kit-colors" aria-label="School colours">${s.colors.map((c) => `<span style="background:${c}"></span>`).join('')}</div>
        </div>
        <div class="kit-season" role="tablist" aria-label="Season">
          <button type="button" role="tab" aria-selected="${season === 'summer'}" class="${season === 'summer' ? 'is-active' : ''}" data-season="summer">Summer set</button>
          <button type="button" role="tab" aria-selected="${season === 'winter'}" class="${season === 'winter' ? 'is-active' : ''}" data-season="winter">Winter set</button>
          <label style="margin-left:auto;display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:600">Class
            <select id="kit-class" style="border:1px solid var(--line);background:var(--surface);border-radius:8px;padding:6px 8px;font-size:13px">
              ${Object.keys(CLASS_SIZE).map((k) => `<option ${k === klass ? 'selected' : ''}>${k}</option>`).join('')}
            </select>
          </label>
        </div>
        <ul class="kit-list">
          ${items.map((it, idx) => `<li><div>${esc(it[0])}<small>${it[4] ? esc(it[4]) + ' · ' : ''}Size ${size} for class ${klass}</small></div><span class="price">${fmt(it[2])}</span><button class="kit-add" type="button" data-idx="${idx}" aria-label="Add ${esc(it[0])}"><svg><use href="#i-plus"/></svg></button></li>`).join('')}
        </ul>
        <div class="kit-foot">
          <span class="kit-total">${season === 'summer' ? 'Summer' : 'Winter'} set · <b>${fmt(total)}</b></span>
          <button class="btn btn-primary btn-sm" type="button" data-add-all>Add full ${season} set <svg><use href="#i-arrow"/></svg></button>
        </div>`;
      $$('[data-season]', kit).forEach((b) => b.addEventListener('click', () => { season = b.dataset.season; renderKit(); }));
      $('#kit-class', kit).addEventListener('change', (e) => { klass = e.target.value; renderKit(); });
      $$('.kit-add', kit).forEach((b) => b.addEventListener('click', () => { const it = items[Number(b.dataset.idx)]; cart.add({ id: it[1], name: it[0], price: it[2], img: it[3], size: size }); toast(it[0] + ' added'); }));
      $('[data-add-all]', kit).addEventListener('click', () => { items.forEach((it) => cart.add({ id: it[1], name: it[0], price: it[2], img: it[3], size: size })); toast('Full ' + season + ' set added to your order'); openCart(true); });
    }
  })();

  /* ----------------------------------------------------------------------
     Winter pre-order countdown
     ---------------------------------------------------------------------- */
  (function countdown() {
    const box = $('#countdown');
    if (!box) return;
    const target = new Date('2026-11-15T23:59:59+05:30').getTime();
    const d = $('#cd-d'), h = $('#cd-h'), m = $('#cd-m'), s = $('#cd-s'), title = $('#banner-title');
    const pad = (n) => String(n).padStart(2, '0');
    function tick() {
      const diff = target - Date.now();
      if (diff <= 0) { box.hidden = true; if (title) title.textContent = 'Winter woollens are in stock'; return; }
      const sec = Math.floor(diff / 1000);
      d.textContent = pad(Math.floor(sec / 86400));
      h.textContent = pad(Math.floor((sec % 86400) / 3600));
      m.textContent = pad(Math.floor((sec % 3600) / 60));
      s.textContent = pad(sec % 60);
      setTimeout(tick, 1000 - (Date.now() % 1000));
    }
    tick();
  })();

  /* ----------------------------------------------------------------------
     Order calendar: mark the current month (IST)
     ---------------------------------------------------------------------- */
  (function calendar() {
    const cal = $('#cal');
    if (!cal) return;
    const month = istNow().month;
    const months = $$('.cal-month', cal);
    if (months[month]) months[month].classList.add('is-now');
    const rows = $$('.cal-label', cal).length;
    const now = document.createElement('div');
    now.className = 'cal-now'; now.style.gridColumn = String(month + 2); now.style.gridRow = '1 / span ' + rows;
    cal.appendChild(now);
  })();

  /* ----------------------------------------------------------------------
     Size guide tables + size suggester
     ---------------------------------------------------------------------- */
  const SIZE_TABLES = {
    shirts: { cols: ['Size', 'Age', 'Height (cm)', 'Chest (in)', 'Length (in)'], rows: [
      ['22', '3–4', '95–105', '22', '16'], ['24', '5–6', '105–115', '24', '17.5'], ['26', '7–8', '115–125', '26', '19'], ['28', '9–10', '125–135', '28', '20.5'],
      ['30', '11–12', '135–145', '30', '22'], ['32', '13–14', '145–155', '32', '23.5'], ['34', '15–16', '155–165', '34', '25'], ['36', '16–17', '165–172', '36', '26.5'], ['38', '17+', '170–178', '38', '28'], ['40', 'Adult', '175+', '40', '29']] },
    trousers: { cols: ['Size', 'Age', 'Height (cm)', 'Waist (in)', 'Length (in)'], rows: [
      ['22', '3–4', '95–105', '20', '22'], ['24', '5–6', '105–115', '21', '25'], ['26', '7–8', '115–125', '22', '28'], ['28', '9–10', '125–135', '23.5', '31'],
      ['30', '11–12', '135–145', '25', '34'], ['32', '13–14', '145–155', '27', '37'], ['34', '15–16', '155–165', '29', '39'], ['36', '16–17', '165–172', '31', '40'], ['38', '17+', '170–178', '33', '41'], ['40', 'Adult', '175+', '35', '42']] },
    pinafores: { cols: ['Size', 'Age', 'Height (cm)', 'Chest (in)', 'Length (in)'], rows: [
      ['22', '3–4', '95–105', '22', '20'], ['24', '5–6', '105–115', '24', '23'], ['26', '7–8', '115–125', '26', '26'], ['28', '9–10', '125–135', '28', '29'],
      ['30', '11–12', '135–145', '30', '32'], ['32', '13–14', '145–155', '32', '35'], ['34', '15–16', '155–165', '34', '37']] },
    blazers: { cols: ['Size', 'Age', 'Height (cm)', 'Chest (in)', 'Length (in)'], rows: [
      ['24', '5–6', '105–115', '26', '18'], ['26', '7–8', '115–125', '28', '19.5'], ['28', '9–10', '125–135', '30', '21'], ['30', '11–12', '135–145', '32', '22.5'],
      ['32', '13–14', '145–155', '34', '24'], ['34', '15–16', '155–165', '36', '25.5'], ['36', '16–17', '165–172', '38', '27'], ['38', '17+', '170–178', '40', '28'], ['40', 'Adult', '175+', '42', '29']] }
  };
  const HEIGHT_TO_SIZE = [[105, '22'], [115, '24'], [125, '26'], [135, '28'], [145, '30'], [155, '32'], [165, '34'], [172, '36'], [178, '38'], [999, '40']];
  const AGE_TO_SIZE = [[4, '22'], [6, '24'], [8, '26'], [10, '28'], [12, '30'], [14, '32'], [16, '34'], [17, '36'], [99, '38']];

  (function sizes() {
    const table = $('#size-table');
    if (!table) return;
    const tabs = $$('#size-tabs .tab');
    let currentKey = 'shirts', hit = '26';
    function render() {
      const t = SIZE_TABLES[currentKey];
      $('thead', table).innerHTML = '<tr>' + t.cols.map((c) => `<th>${c}</th>`).join('') + '</tr>';
      $('tbody', table).innerHTML = t.rows.map((r) => `<tr class="${r[0] === hit ? 'is-hit' : ''}">${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('');
    }
    tabs.forEach((b) => b.addEventListener('click', () => {
      tabs.forEach((x) => { x.classList.remove('is-active'); x.setAttribute('aria-selected', 'false'); });
      b.classList.add('is-active'); b.setAttribute('aria-selected', 'true');
      currentKey = b.dataset.table; render();
    }));
    const hIn = $('#h-cm'), aIn = $('#age-y'), out = $('#size-result');
    function suggest() {
      const h = Number(hIn.value), a = Number(aIn.value);
      let size = null, basis = '';
      if (h >= 80) { size = HEIGHT_TO_SIZE.find((p) => h <= p[0])[1]; basis = 'height ' + h + ' cm'; }
      else if (a >= 2) { size = AGE_TO_SIZE.find((p) => a <= p[0])[1]; basis = 'age ' + a; }
      if (!size) { out.innerHTML = '<b>Enter a height</b>We suggest a size from height first, then age.'; return; }
      hit = size; render();
      const tallNote = (h && a) ? (h > (HEIGHT_TO_SIZE.find((p) => AGE_TO_SIZE.find((q) => a <= q[0])[1] === p[1]) || [0])[0] ? ' Tall for the age, so the suggestion already leans larger.' : '') : '';
      out.innerHTML = `<b>Size ${size}</b>Based on ${basis}. Choose one size up for winter wear or if the child is tall for their age.${tallNote}`;
    }
    hIn.addEventListener('input', suggest); aIn.addEventListener('input', suggest);
    render();
  })();

  /* ----------------------------------------------------------------------
     Testimonials
     ---------------------------------------------------------------------- */
  (function quotes() {
    const stage = $('#quotes');
    if (!stage) return;
    const items = $$('.quote', stage), dots = $$('#quote-dots button');
    let i = 0, timer;
    const show = (n) => {
      i = (n + items.length) % items.length;
      items.forEach((q, k) => q.classList.toggle('is-active', k === i));
      dots.forEach((d, k) => { d.classList.toggle('is-active', k === i); d.setAttribute('aria-selected', String(k === i)); });
      clearInterval(timer);
      if (!reduceMotion) timer = setInterval(() => show(i + 1), 7000);
    };
    dots.forEach((d, k) => d.addEventListener('click', () => show(k)));
    show(0);
  })();

  /* ----------------------------------------------------------------------
     Corporate quote form (demo: nothing is sent)
     ---------------------------------------------------------------------- */
  (function quoteForm() {
    const form = $('#quote-form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const required = $$('[required]', form);
      const missing = required.find((f) => !f.value.trim());
      if (missing) { missing.focus(); toast('Please fill in ' + ($('label[for="' + missing.id + '"]', form) || {}).textContent.toLowerCase()); return; }
      const org = $('#q-org', form).value.trim();
      form.innerHTML = `<div class="form-ok"><svg><use href="#i-check"/></svg><b>Request noted for ${esc(org)}</b><p>On the live site this reaches the shop's WhatsApp and email. You would hear back within 24 hours on a working day.</p><p style="font-size:12.5px">Mock-up: nothing was actually sent.</p></div>`;
      toast('Quote request noted (demo)');
    });
  })();

  /* ----------------------------------------------------------------------
     Copy phone number
     ---------------------------------------------------------------------- */
  $$('[data-copy]').forEach((btn) => btn.addEventListener('click', async () => {
    const text = btn.dataset.copy;
    try { await navigator.clipboard.writeText(text); toast('Phone number copied'); }
    catch (e) {
      const span = $('#phone-text');
      if (span && window.getSelection) { const r = document.createRange(); r.selectNodeContents(span); const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r); }
      toast('Select and copy the number');
    }
  }));

  /* ----------------------------------------------------------------------
     Open-now pill (shop hours 10:00–20:00 IST, daily)
     ---------------------------------------------------------------------- */
  (function openPill() {
    const pill = $('#open-pill');
    if (!pill) return;
    const { hour, minute } = istNow();
    const mins = hour * 60 + minute;
    const open = mins >= 600 && mins < 1200;
    pill.innerHTML = open ? '<i></i>Open now · closes 20:00' : '<i></i>Closed now · opens 10:00';
    if (!open) { pill.style.background = 'color-mix(in srgb, var(--maroon) 12%, transparent)'; pill.style.color = 'var(--maroon-ink)'; }
  })();

  // Initial paint of cart state
  cart.render();
})();
