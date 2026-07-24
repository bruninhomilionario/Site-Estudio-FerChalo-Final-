/* ============================================
   Fran Chaló Tatuagem & Piercing — app.js
   ============================================ */
(function () {
  "use strict";

  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- Lenis smooth scroll + GSAP ---------- */
  gsap.registerPlugin(ScrollTrigger);
  // Mobile browsers resize the viewport when the address bar hides/shows on
  // scroll; without this, ScrollTrigger recalculates mid-scroll and the page jitters.
  ScrollTrigger.config({ ignoreMobileResize: true });

  // Web fonts swap in after first paint and can change section heights,
  // leaving ScrollTrigger's cached positions stale — refresh once fonts settle.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }

  /* ---------- Motion & device preferences ---------- */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isMobile = window.matchMedia("(max-width: 767px)").matches;
  var isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var lenis = new Lenis({
    duration: 1.2,
    easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
    smoothWheel: true
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
  gsap.ticker.lagSmoothing(0);

  /* ---------- Loader ---------- */
  (function initLoader() {
    var loader = document.getElementById("loader");
    var bar = document.getElementById("loader-bar");
    var percentEl = document.getElementById("loader-percent");
    // Only wait on above-the-fold (non-lazy) images. Lazy portfolio/service
    // images load later on scroll and must never block the loader.
    var images = Array.prototype.slice.call(document.images).filter(function (img) {
      return img.loading !== "lazy";
    });
    var total = images.length || 1;
    var loaded = images.length ? 0 : 1;
    var minTimeElapsed = false;
    var finished = false;

    function update(pct) {
      bar.style.width = pct + "%";
      percentEl.textContent = Math.round(pct) + "%";
    }

    function finish() {
      if (finished) return;
      finished = true;
      update(100);
      setTimeout(function () {
        loader.classList.add("hidden");
        document.body.style.overflow = "";
        ScrollTrigger.refresh();
      }, 250);
    }

    function tryFinish() {
      if (loaded >= total && minTimeElapsed) finish();
    }

    images.forEach(function (img) {
      if (img.complete) {
        loaded++;
      } else {
        img.addEventListener("load", function () { loaded++; update((loaded / total) * 100); tryFinish(); });
        img.addEventListener("error", function () { loaded++; update((loaded / total) * 100); tryFinish(); });
      }
    });

    update((loaded / total) * 100);
    setTimeout(function () { minTimeElapsed = true; tryFinish(); }, 900);
    setTimeout(finish, 4000); // hard safety fallback — never let the loader get stuck

    // Refresh ScrollTrigger as lazy images finish loading below the fold,
    // since they can shift section positions in the masonry/services grid.
    var refreshTimer;
    Array.prototype.slice.call(document.images).filter(function (img) {
      return img.loading === "lazy";
    }).forEach(function (img) {
      if (!img.complete) {
        img.addEventListener("load", function () {
          clearTimeout(refreshTimer);
          refreshTimer = setTimeout(function () { ScrollTrigger.refresh(); }, 150);
        });
      }
    });
  })();

  /* ---------- Header scroll state ---------- */
  var header = document.getElementById("site-header");
  ScrollTrigger.create({
    start: 40,
    end: 99999,
    onUpdate: function (self) {
      header.classList.toggle("scrolled", self.scroll() > 40);
    }
  });

  /* ---------- Mobile nav ---------- */
  var navToggle = document.getElementById("nav-toggle");
  var navMenu = document.getElementById("nav-menu");
  navToggle.addEventListener("click", function () {
    var isOpen = navMenu.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.style.overflow = isOpen ? "hidden" : "";
  });
  navMenu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      navMenu.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    });
  });

  /* ---------- "Falling into place" scroll reveals ---------- */
  // Distance/duration/blur all scale down on mobile so the motion stays quick
  // and cheap on low-power devices, per the mobile + performance requirements.
  var distScale = isMobile ? 0.55 : 1;
  var durScale = isMobile ? 0.75 : 1;
  var blurPx = isMobile ? 0 : 8;

  function clearAfter(targets) {
    return function () { gsap.set(targets, { clearProps: "transform,filter,opacity" }); };
  }

  // Reduced motion: never hide anything — content stays at its natural, fully
  // visible CSS state. (No gsap.set hiding call is made anywhere below either.)
  if (!reduceMotion) {
    document.querySelectorAll("[data-fade], .cta-banner").forEach(function (section) {
      var groups = [
        { els: section.querySelectorAll(".section-label"), from: { y: -22 * distScale }, duration: 0.6, ease: "power2.out" },
        { els: section.querySelectorAll(".section-heading, .cta-heading"), from: { y: -56 * distScale, rotation: -2 }, duration: 1 * durScale, ease: "back.out(1.25)" },
        { els: section.querySelectorAll(".section-body, .cta-text, .check-list, .tag-list, address, .contact-phone, .contact-rating, .business-hours, .hours-note, .google-rating-line"), from: { y: -30 * distScale }, duration: 0.8 * durScale, ease: "power2.out", stagger: 0.08 },
        { els: section.querySelectorAll(".portfolio-filters"), from: { y: -20 * distScale }, duration: 0.6 * durScale, ease: "power2.out" },
        { els: section.querySelectorAll(".split-media, .service-media, .reviews-marquee, .contact-map"), from: { y: -70 * distScale, scale: 0.96, rotation: -2, filter: "blur(" + blurPx + "px)" }, duration: 1.1 * durScale, ease: "back.out(1.15)" },
        { els: section.querySelectorAll(".service-card, .contact-info, .google-rating-bar"), from: { y: -46 * distScale, scale: 0.95 }, duration: 0.9 * durScale, ease: "back.out(1.25)", stagger: 0.12 },
        { els: section.querySelectorAll(".masonry-grid .portfolio-item"), from: { y: -60 * distScale, scale: 0.94, rotation: -2, filter: "blur(" + blurPx + "px)" }, duration: 0.9 * durScale, ease: "back.out(1.2)", stagger: 0.07 },
        { els: section.querySelectorAll(".btn"), from: { y: -18 * distScale }, duration: 0.55 * durScale, ease: "back.out(1.2)", stagger: 0.08 }
      ].filter(function (g) { return g.els.length; });

      if (!groups.length) return;

      groups.forEach(function (g) {
        gsap.set(g.els, Object.assign({ opacity: 0 }, g.from));
      });

      ScrollTrigger.create({
        trigger: section,
        start: "top 82%",
        once: true,
        onEnter: function () {
          var tl = gsap.timeline();
          groups.forEach(function (g, idx) {
            var toVars = {
              opacity: 1, y: 0, scale: 1, rotation: 0,
              duration: g.duration, ease: g.ease, stagger: g.stagger || 0,
              onComplete: clearAfter(g.els)
            };
            if (g.from.filter) toVars.filter = "blur(0px)";
            tl.to(g.els, toVars, idx === 0 ? 0 : "-=" + Math.min(g.duration * 0.5, 0.4));
          });
        }
      });
    });
  }

  /* ---------- Hero background video ---------- */
  (function initHeroVideo() {
    var heroVideo = document.getElementById("hero-video");
    if (!heroVideo) return;
    heroVideo.play().catch(function () {});
  })();

  /* ---------- Hero entrance sequence ---------- */
  (function initHeroEntrance() {
    var heroWords = document.querySelectorAll(".hero-heading span");
    var heroTargets = {
      decor: document.querySelector(".hero-decor"),
      label: document.querySelector("#hero .section-label"),
      tagline: document.querySelector(".hero-tagline"),
      badges: document.querySelectorAll(".trust-badges li"),
      ctas: document.querySelectorAll(".hero-ctas .btn")
    };
    var whatsapp = document.getElementById("whatsapp-float");

    if (reduceMotion) {
      if (whatsapp) gsap.set(whatsapp, { opacity: 1, clearProps: "transform" });
      return;
    }

    gsap.set(heroTargets.decor, { opacity: 0, scale: 0.92 });
    gsap.set(heroTargets.label, { opacity: 0, y: -22 });
    gsap.set(heroWords, { opacity: 0, y: -60 * distScale, rotation: -3 });
    gsap.set(heroTargets.tagline, { opacity: 0, y: -26 * distScale });
    gsap.set(heroTargets.badges, { opacity: 0, y: -14 });
    gsap.set(heroTargets.ctas, { opacity: 0, y: -18 });
    if (whatsapp) gsap.set(whatsapp, { opacity: 0, scale: 0.6, y: 20 });

    var tl = gsap.timeline({ delay: 0.15 });
    tl.to(heroTargets.decor, { opacity: 1, scale: 1, duration: 1.1 * durScale, ease: "power2.out" }, 0)
      .to(heroTargets.label, { opacity: 1, y: 0, duration: 0.6 * durScale, ease: "power2.out" }, 0.15)
      .to(heroWords, { opacity: 1, y: 0, rotation: 0, duration: 0.8 * durScale, ease: "back.out(1.3)", stagger: 0.07 }, 0.3)
      .to(heroTargets.tagline, { opacity: 1, y: 0, duration: 0.7 * durScale, ease: "power2.out" }, "-=0.35")
      .to(heroTargets.badges, { opacity: 1, y: 0, duration: 0.5 * durScale, ease: "power2.out", stagger: 0.06 }, "-=0.3")
      .to(heroTargets.ctas, { opacity: 1, y: 0, duration: 0.55 * durScale, ease: "back.out(1.2)", stagger: 0.08 }, "-=0.35")
      .eventCallback("onComplete", function () {
        gsap.set([heroTargets.decor, heroTargets.label, heroWords, heroTargets.tagline, heroTargets.badges, heroTargets.ctas], { clearProps: "transform,opacity" });
        if (whatsapp) {
          gsap.to(whatsapp, { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "back.out(1.4)", onComplete: clearAfter(whatsapp) });
        }
      });
  })();

  /* ---------- Subtle scroll parallax (selected decorative/foreground elements) ---------- */
  if (!reduceMotion) {
    var parallaxAmt = isMobile ? 18 : 45;
    var heroDecorEl = document.querySelector(".hero-decor");
    if (heroDecorEl) {
      gsap.to(heroDecorEl, {
        y: parallaxAmt,
        ease: "none",
        scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true }
      });
    }
    var portraitImg = document.querySelector(".portrait-placeholder img");
    if (portraitImg) {
      gsap.to(portraitImg, {
        y: -parallaxAmt * 0.6,
        ease: "none",
        scrollTrigger: { trigger: "#sobre", start: "top bottom", end: "bottom top", scrub: true }
      });
    }
  }

  /* ---------- Button interactions: hover scale, magnetic follow, press feedback ---------- */
  (function initButtonInteractions() {
    var magnetic = !reduceMotion && !isMobile && isFinePointer;
    if (!magnetic) return; // mobile/touch/reduced-motion rely on the plain CSS :hover/:active states

    document.querySelectorAll(".btn").forEach(function (btn) {
      btn.addEventListener("mouseenter", function () {
        gsap.to(btn, { scale: 1.04, duration: 0.3, ease: "power2.out" });
      });
      btn.addEventListener("mousemove", function (e) {
        var rect = btn.getBoundingClientRect();
        var relX = e.clientX - rect.left - rect.width / 2;
        var relY = e.clientY - rect.top - rect.height / 2;
        gsap.to(btn, { x: relX * 0.15, y: relY * 0.3, duration: 0.35, ease: "power2.out" });
      });
      btn.addEventListener("mouseleave", function () {
        gsap.to(btn, { x: 0, y: 0, scale: 1, duration: 0.45, ease: "power2.out" });
      });
      btn.addEventListener("mousedown", function () {
        gsap.to(btn, { scale: 0.96, duration: 0.15, ease: "power2.out" });
      });
      btn.addEventListener("mouseup", function () {
        gsap.to(btn, { scale: 1.04, duration: 0.2, ease: "power2.out" });
      });
    });
  })();

  /* ---------- Animated counters ---------- */
  var counters = document.querySelectorAll(".counter");
  var counterObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      counterObserver.unobserve(el);
      var target = parseFloat(el.dataset.target || "0");
      var decimals = parseInt(el.dataset.decimals || "0", 10);
      var suffix = el.dataset.suffix || "";
      var obj = { val: 0 };
      gsap.to(obj, {
        val: target,
        duration: 1.6,
        ease: "power2.out",
        onUpdate: function () {
          el.textContent = obj.val.toFixed(decimals) + suffix;
        }
      });
    });
  }, { threshold: 0.6 });
  counters.forEach(function (el) { counterObserver.observe(el); });

  /* ---------- Continuous horizontal marquees (reviews + service showcases) ---------- */
  function initMarquee(viewport, track, secondsPerItem) {
    if (!viewport || !track) return;
    var items = Array.prototype.slice.call(track.children);
    if (!items.length) return;

    // Duplicate the set once so xPercent -50 loops back seamlessly.
    items.forEach(function (item) { track.appendChild(item.cloneNode(true)); });

    var tween = gsap.to(track, {
      xPercent: -50,
      duration: items.length * secondsPerItem,
      ease: "none",
      repeat: -1
    });
    viewport.addEventListener("mouseenter", function () { tween.pause(); });
    viewport.addEventListener("mouseleave", function () { tween.play(); });
    viewport.addEventListener("focusin", function () { tween.pause(); });
    viewport.addEventListener("focusout", function () { tween.play(); });
  }

  // Reviews — slow, steady pace long enough per card for a visitor to read the text.
  initMarquee(document.getElementById("reviews-marquee"), document.getElementById("reviews-track"), 13);

  // Service showcases (Tatuagens / Piercings) — calm photo-reel pace.
  document.querySelectorAll(".service-media-marquee").forEach(function (viewport) {
    initMarquee(viewport, viewport.querySelector(".service-media-track"), 5.5);
  });

  /* ---------- Ripple effect ---------- */
  document.querySelectorAll(".ripple").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      var rect = btn.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height);
      var circle = document.createElement("span");
      circle.className = "ripple-circle";
      circle.style.width = circle.style.height = size + "px";
      circle.style.left = (e.clientX - rect.left - size / 2) + "px";
      circle.style.top = (e.clientY - rect.top - size / 2) + "px";
      btn.appendChild(circle);
      circle.addEventListener("animationend", function () { circle.remove(); });
    });
  });

  /* ---------- Portfolio filter + lightbox ---------- */
  var filterBtns = document.querySelectorAll(".filter-btn");
  var portfolioItems = document.querySelectorAll(".portfolio-item");
  var emptyMsg = document.querySelector(".portfolio-empty");

  function applyFilter(filter) {
    var visibleCount = 0;
    portfolioItems.forEach(function (item) {
      var match = filter === "all" || item.dataset.category.split(" ").indexOf(filter) !== -1;
      item.classList.toggle("is-hidden", !match);
      if (match) visibleCount++;
    });
    emptyMsg.hidden = visibleCount !== 0;
  }

  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterBtns.forEach(function (b) { b.classList.remove("is-active"); b.setAttribute("aria-selected", "false"); });
      btn.classList.add("is-active");
      btn.setAttribute("aria-selected", "true");
      applyFilter(btn.dataset.filter);
    });
  });

  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightbox-img");
  var lightboxClose = document.getElementById("lightbox-close");
  var lightboxPrev = document.getElementById("lightbox-prev");
  var lightboxNext = document.getElementById("lightbox-next");
  var currentIndex = 0;

  function visibleItems() {
    return Array.prototype.filter.call(portfolioItems, function (item) {
      return !item.classList.contains("is-hidden");
    });
  }

  function openLightbox(index) {
    var items = visibleItems();
    if (!items.length) return;
    currentIndex = (index + items.length) % items.length;
    var img = items[currentIndex].querySelector("img");
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.hidden = true;
    document.body.style.overflow = "";
  }

  portfolioItems.forEach(function (item, idx) {
    item.addEventListener("click", function () {
      var items = visibleItems();
      openLightbox(items.indexOf(item));
    });
  });

  lightboxClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", function (e) { if (e.target === lightbox) closeLightbox(); });
  lightboxPrev.addEventListener("click", function () { openLightbox(currentIndex - 1); });
  lightboxNext.addEventListener("click", function () { openLightbox(currentIndex + 1); });
  document.addEventListener("keydown", function (e) {
    if (lightbox.hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") openLightbox(currentIndex - 1);
    if (e.key === "ArrowRight") openLightbox(currentIndex + 1);
  });

  /* ---------- Back to top ---------- */
  var backToTop = document.getElementById("back-to-top");
  ScrollTrigger.create({
    start: 600,
    end: 99999,
    onUpdate: function (self) { backToTop.classList.toggle("visible", self.scroll() > 600); }
  });
  backToTop.addEventListener("click", function () { lenis.scrollTo(0, { duration: 1.2 }); });

  /* ---------- Cookie consent ---------- */
  (function initCookieConsent() {
    var consent = document.getElementById("cookie-consent");
    var acceptBtn = document.getElementById("cookie-accept");
    if (localStorage.getItem("fc_cookie_consent") === "accepted") return;
    consent.hidden = false;
    setTimeout(function () { consent.classList.add("shown"); }, 1600);
    acceptBtn.addEventListener("click", function () {
      localStorage.setItem("fc_cookie_consent", "accepted");
      consent.classList.remove("shown");
      setTimeout(function () { consent.hidden = true; }, 600);
    });
  })();

})();
