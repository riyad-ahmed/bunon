/* ==========================================================================
   BUNON — Main script
   --------------------------------------------------------------------------
   Header, mobile menu, active nav link, product cards, contact details,
   contact form and scroll animations. Plain JavaScript; no build step.
   ========================================================================== */

(function () {
  "use strict";

  const config = window.SITE_CONFIG || {};
  const products = window.PRODUCTS || [];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Helpers ---------- */

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const escapeHTML = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[char]);

  const formatPrice = (amount) =>
    typeof amount === "number"
      ? (config.currencySymbol || "") + amount.toLocaleString("en-US")
      : "";


  /* ---------- Header: background appears after scrolling ---------- */

  function initHeader() {
    const header = $(".site-header");
    if (!header) return;

    const update = () => header.classList.toggle("is-scrolled", window.scrollY > 20);
    update();
    window.addEventListener("scroll", update, { passive: true });
  }


  /* ---------- Mobile menu ---------- */

  function initMobileNav() {
    const toggle = $(".nav-toggle");
    if (!toggle) return;

    const isOpen = () => toggle.getAttribute("aria-expanded") === "true";
    const setOpen = (open) => {
      document.body.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };

    toggle.addEventListener("click", () => setOpen(!isOpen()));

    // Close after choosing a link (including the logo)
    $$(".site-header a").forEach((link) => link.addEventListener("click", () => setOpen(false)));

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isOpen()) {
        setOpen(false);
        toggle.focus();
      }
    });

    // Close if the screen is resized to desktop width
    window.matchMedia("(min-width: 768px)").addEventListener("change", (event) => {
      if (event.matches) setOpen(false);
    });
  }


  /* ---------- Highlight the nav link of the section in view ---------- */

  function initActiveLink() {
    const links = $$(".nav-link");
    const sections = links.map((link) => $(link.getAttribute("href"))).filter(Boolean);
    if (!sections.length || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => {
          const active = link.getAttribute("href") === "#" + entry.target.id;
          link.classList.toggle("is-active", active);
          if (active) link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });

    sections.forEach((section) => observer.observe(section));
  }


  /* ---------- Products ---------- */

  function productCard(product, index) {
    const id = escapeHTML(product.id);
    const name = escapeHTML(product.name);

    // PAYMENTS (disabled) — to show a "Buy now" button on products that have a
    // paymentLink, delete the first line below and uncomment the next three.
    // See assets/js/payment.js for the full steps.
    const buyButton = "";
    // const buyButton = product.paymentLink
    //   ? `<button class="btn btn-primary btn-small" type="button" data-buy="${id}">Buy now</button>`
    //   : "";

    return `
      <article class="product reveal" style="--d:${index % 3}">
        <div class="product-media">
          <img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.alt || product.name)}"
               width="800" height="1000" loading="lazy" decoding="async">
        </div>
        <div class="product-body">
          <div class="product-row">
            <h3 class="product-name">${name}</h3>
            <p class="product-price">${formatPrice(product.price)}</p>
          </div>
          <p class="product-desc">${escapeHTML(product.description)}</p>
          <div class="product-actions">
            ${buyButton}
            <a class="link-arrow" href="#contact" data-enquire="${name}">Enquire <span aria-hidden="true">→</span></a>
          </div>
        </div>
      </article>`;
  }

  function renderProducts() {
    const grid = $("#product-grid");
    if (!grid) return;

    grid.innerHTML = products.map(productCard).join("");

    // "Enquire" pre-fills the contact form with the product name
    grid.addEventListener("click", (event) => {
      const link = event.target.closest("[data-enquire]");
      const message = $("#message");
      if (!link || !message) return;
      message.value = `Hi BUNON, I'd like to know more about the ${link.dataset.enquire}.`;
    });
  }


  /* ---------- Contact details from config.js ---------- */

  function bindContactDetails() {
    const fill = (key, apply) => {
      $$(`[data-bind="${key}"]`).forEach((el) => {
        const value = (config[key] || "").trim();
        const row = el.closest("[data-row]") || el;
        row.hidden = !value;
        if (value) apply(el, value);
      });
    };

    fill("email", (el, v) => { el.href = "mailto:" + v; el.textContent = v; });
    fill("phone", (el, v) => { el.href = "tel:" + v.replace(/[^\d+]/g, ""); el.textContent = v; });
    fill("location", (el, v) => { el.textContent = v; });
    fill("instagram", (el, v) => { el.href = v; });
    fill("facebook", (el, v) => { el.href = v; });

    // Hide a list entirely if every item in it is empty
    $$(".contact-list, .socials").forEach((list) => {
      list.hidden = !$$("[data-row]", list).some((row) => !row.hidden);
    });
  }


  /* ---------- Contact form ---------- */

  function initContactForm() {
    const form = $("#contact-form");
    const status = $("#form-status");
    if (!form || !status) return;

    const fields = $$("input[required], textarea[required]", form);
    const button = $("button[type=submit]", form);

    const showStatus = (text, type = "") => {
      status.textContent = text;
      status.dataset.type = type;
    };

    fields.forEach((field) =>
      field.addEventListener("input", () => field.closest(".field").classList.remove("is-invalid"))
    );

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      // Validate
      const invalid = fields.filter((field) => !field.value.trim() || !field.checkValidity());
      fields.forEach((field) => field.closest(".field").classList.toggle("is-invalid", invalid.includes(field)));
      if (invalid.length) {
        invalid[0].focus();
        showStatus("Please add your name, a valid email and a message.", "error");
        return;
      }

      // Bots fill the hidden field; quietly pretend it worked
      if (form.elements._gotcha.value) {
        form.reset();
        showStatus("Thank you — your message has been sent.", "success");
        return;
      }

      const name = form.elements.name.value.trim();
      const email = form.elements.email.value.trim();
      const message = form.elements.message.value.trim();

      // Option 2: send through Formspree (or a similar service)
      if (config.formEndpoint) {
        button.disabled = true;
        showStatus("Sending…");
        try {
          const response = await fetch(config.formEndpoint, {
            method: "POST",
            headers: { Accept: "application/json" },
            body: new FormData(form),
          });
          if (!response.ok) throw new Error("Request failed: " + response.status);
          form.reset();
          showStatus("Thank you — your message has been sent. We’ll be in touch soon.", "success");
        } catch (error) {
          showStatus(
            "Sorry, that didn’t go through." + (config.email ? " Please email us at " + config.email + "." : ""),
            "error"
          );
        } finally {
          button.disabled = false;
        }
        return;
      }

      // Option 1: open the visitor's email app
      if (!config.email) {
        showStatus("Sorry, the contact form isn’t available right now.", "error");
        return;
      }
      const subject = encodeURIComponent("Enquiry from " + name);
      const body = encodeURIComponent(`${message}\n\n— ${name}\n${email}`);
      window.location.href = `mailto:${config.email}?subject=${subject}&body=${body}`;
      showStatus("Opening your email app… If nothing happens, email us at " + config.email + ".", "success");
    });
  }


  /* ---------- Reveal elements as they scroll into view ---------- */

  function initReveal() {
    const items = $$(".reveal");

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    items.forEach((item) => observer.observe(item));
  }


  /* ---------- Start ---------- */

  bindContactDetails();
  renderProducts();
  initHeader();
  initMobileNav();
  initActiveLink();
  initContactForm();
  initReveal();

  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
})();
