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
        { els: section.querySelectorAll(".tag-list, address, .contact-phone, .contact-rating, .business-hours, .hours-note, .google-rating-line"), from: { y: -30 * distScale }, duration: 0.8 * durScale, ease: "power2.out", stagger: 0.08 },
        { els: section.querySelectorAll(".split-media, .coverflow, .pf-carousel, .reviews-marquee, .contact-map"), from: { y: -70 * distScale, scale: 0.96, rotation: -2, filter: "blur(" + blurPx + "px)" }, duration: 1.1 * durScale, ease: "back.out(1.15)" },
        { els: section.querySelectorAll(".service-card, .contact-info, .google-rating-bar"), from: { y: -46 * distScale, scale: 0.95 }, duration: 0.9 * durScale, ease: "back.out(1.25)", stagger: 0.12 },
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

  /* ---------- Scroll "correnteza" text reveal ----------
     Splits headings/paragraphs into per-word spans and ties their opacity
     directly to scroll position (scrub) so the text lights up progressively
     as the page scrolls, instead of playing once on entry. Applies site-wide
     to every section except the Hero, which keeps its own load-in sequence. */
  function prepareRevealWords(el) {
    var frag = document.createDocumentFragment();
    var targets = [];
    Array.prototype.forEach.call(el.childNodes, function (node) {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (part === "") return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
            return;
          }
          var span = document.createElement("span");
          span.className = "reveal-word";
          span.textContent = part;
          frag.appendChild(span);
          targets.push(span);
        });
      } else {
        var clone = node.cloneNode(true);
        frag.appendChild(clone);
        if (node.nodeType === 1 && node.tagName !== "BR") targets.push(clone);
      }
    });
    el.innerHTML = "";
    el.appendChild(frag);
    return targets;
  }

  if (!reduceMotion) {
    // .greview-text is intentionally excluded: those cards get cloned by the
    // infinite marquee below, and cloning would bake in whatever mid-reveal
    // opacity the words had at that moment, leaving half the loop stuck dim.
    // Headings are excluded too — they get the fancier per-character converge
    // effect below instead of the plain word fade.
    var revealEls = document.querySelectorAll(
      "#sobre .section-body, #estudio .section-body, #estudio .check-list li, .cta-text"
    );
    revealEls.forEach(function (el) {
      var words = prepareRevealWords(el);
      if (!words.length) return;
      gsap.set(words, { opacity: 0.12 });
      gsap.to(words, {
        opacity: 1,
        ease: "none",
        stagger: 0.06,
        scrollTrigger: {
          trigger: el,
          start: "top 98%",
          end: "top 15%",
          scrub: 0.4
        }
      });
    });
  }

  /* ---------- Scroll "converge" heading effect ----------
     Splits each big section heading into per-character spans. Every
     character starts offset sideways and rotated in 3D based on its
     distance from the middle of the string, then converges to its natural
     position as the heading scrolls through view — characters further from
     the center travel further, so the whole line "assembles" as you scroll. */
  function prepareRevealChars(el) {
    var frag = document.createDocumentFragment();
    var targets = [];
    Array.prototype.forEach.call(el.childNodes, function (node) {
      if (node.nodeType === 3) {
        node.textContent.split("").forEach(function (ch) {
          if (ch === " ") {
            frag.appendChild(document.createTextNode(" "));
            return;
          }
          var span = document.createElement("span");
          span.className = "reveal-char";
          span.textContent = ch;
          frag.appendChild(span);
          targets.push(span);
        });
      } else {
        var clone = node.cloneNode(true);
        frag.appendChild(clone);
        if (node.nodeType === 1 && node.tagName !== "BR") targets.push(clone);
      }
    });
    el.innerHTML = "";
    el.appendChild(frag);
    return targets;
  }

  if (!reduceMotion) {
    var headingEls = document.querySelectorAll(
      "#sobre .section-heading, #servicos .section-heading, #portfolio .section-heading, #avaliacoes .section-heading, #estudio .section-heading, .cta-heading, #contato .section-heading"
    );
    headingEls.forEach(function (el) {
      var chars = prepareRevealChars(el);
      if (!chars.length) return;
      var center = (chars.length - 1) / 2;
      chars.forEach(function (ch, i) {
        var dist = i - center;
        gsap.set(ch, { x: dist * 16 * distScale, rotateX: dist * 8, opacity: 0.15 });
      });
      gsap.to(chars, {
        x: 0,
        rotateX: 0,
        opacity: 1,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top 98%",
          end: "top 20%",
          scrub: 0.4
        }
      });
    });
    ScrollTrigger.refresh();
  }

  /* ---------- Studio video: play/loop while scrolled into view ---------- */
  (function initStudioVideo() {
    var studioVideo = document.getElementById("studio-video");
    if (!studioVideo) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          studioVideo.play().catch(function () {});
        } else {
          studioVideo.pause();
        }
      });
    }, { threshold: 0.4 });
    observer.observe(studioVideo);
  })();

  /* ---------- Logo "letreiro" letter-drop ---------- */
  (function initLogoLetters() {
    var letters = document.querySelectorAll(".logo-letters span");
    if (!letters.length) return;
    if (reduceMotion) return;

    gsap.set(letters, { opacity: 0, y: -34, rotation: function () { return gsap.utils.random(-12, 12); } });
    gsap.to(letters, {
      opacity: 1,
      y: 0,
      rotation: 0,
      duration: 0.5,
      ease: "bounce.out",
      stagger: 0.045,
      delay: 0.2,
      onComplete: function () { gsap.set(letters, { clearProps: "transform" }); }
    });
  })();

  /* ---------- Hero entrance sequence ---------- */
  (function initHeroEntrance() {
    var heroWords = document.querySelectorAll(".hero-heading span");
    var heroTargets = {
      decor: document.querySelector(".hero-decor"),
      tagline: document.querySelector(".hero-tagline"),
      badges: document.querySelectorAll(".trust-badges li"),
      ctas: document.querySelectorAll(".hero-ctas .btn")
    };
    var socialFloats = [document.getElementById("facebook-float"), document.getElementById("instagram-float"), document.getElementById("whatsapp-float")].filter(Boolean);

    // Always plays, even with reduce-motion enabled at the OS level — this is
    // a one-shot entrance flourish (not a scroll-jacked/looping effect), and
    // OS-level "reduce animations" toggles have silently swallowed it before.
    gsap.set(heroTargets.decor, { opacity: 0, scale: 0.92 });
    gsap.set(heroWords, { opacity: 0, y: -60 * distScale, rotation: -3 });
    gsap.set(heroTargets.tagline, { opacity: 0, y: -26 * distScale });
    gsap.set(heroTargets.badges, { opacity: 0, y: -14 });
    gsap.set(heroTargets.ctas, { opacity: 0, y: -18 });
    if (socialFloats.length) gsap.set(socialFloats, { opacity: 0, scale: 0.6, y: 20 });

    var tl = gsap.timeline({ delay: 0.15 });
    tl.to(heroTargets.decor, { opacity: 1, scale: 1, duration: 1.1 * durScale, ease: "power2.out" }, 0)
      .to(heroWords, { opacity: 1, y: 0, rotation: 0, duration: 0.8 * durScale, ease: "back.out(1.3)", stagger: 0.07 }, 0.3)
      .to(heroTargets.tagline, { opacity: 1, y: 0, duration: 0.7 * durScale, ease: "power2.out" }, "-=0.35")
      .to(heroTargets.badges, { opacity: 1, y: 0, duration: 0.5 * durScale, ease: "power2.out", stagger: 0.06 }, "-=0.3")
      .to(heroTargets.ctas, { opacity: 1, y: 0, duration: 0.55 * durScale, ease: "back.out(1.2)", stagger: 0.08 }, "-=0.35")
      .eventCallback("onComplete", function () {
        gsap.set([heroTargets.decor, heroWords, heroTargets.tagline, heroTargets.badges, heroTargets.ctas], { clearProps: "transform,opacity" });
        if (socialFloats.length) {
          gsap.to(socialFloats, { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "back.out(1.4)", stagger: 0.08, onComplete: clearAfter(socialFloats) });
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

  /* ---------- Services coverflow (Tatuagens / Piercings) ---------- */
  document.querySelectorAll("[data-coverflow]").forEach(function (root) {
    var slides = Array.prototype.slice.call(root.querySelectorAll(".coverflow-slide"));
    if (!slides.length) return;
    var active = 0;
    var spacing = isMobile ? 96 : 150;

    function render(animate) {
      slides.forEach(function (slide, i) {
        var offset = i - active;
        var dist = Math.abs(offset);
        var vars = {
          x: offset * spacing,
          scale: dist === 0 ? 1 : Math.max(0.7, 1 - dist * 0.16),
          rotationY: Math.max(-30, Math.min(30, offset * -20)),
          opacity: dist > 2 ? 0 : 1,
          zIndex: 100 - dist,
          duration: animate ? 0.55 : 0,
          ease: "power3.out"
        };
        if (animate) { gsap.to(slide, vars); } else { gsap.set(slide, vars); }
      });
    }

    gsap.set(slides, { xPercent: 0 });
    render(false);

    root.querySelectorAll(".coverflow-arrow").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var dir = parseInt(btn.dataset.dir, 10);
        active = (active + dir + slides.length) % slides.length;
        render(true);
      });
    });

    slides.forEach(function (slide, i) {
      slide.addEventListener("click", function () {
        if (i === active) return;
        active = i;
        render(true);
      });

      var inner = slide.querySelector(".coverflow-slide-inner");
      if (reduceMotion) return;

      if (isFinePointer) {
        var quickRX = gsap.quickTo(inner, "rotationX", { duration: 0.4, ease: "power2.out" });
        var quickRY = gsap.quickTo(inner, "rotationY", { duration: 0.4, ease: "power2.out" });
        var quickScale = gsap.quickTo(inner, "scale", { duration: 0.4, ease: "power2.out" });
        slide.addEventListener("mousemove", function (e) {
          var rect = slide.getBoundingClientRect();
          var px = (e.clientX - rect.left) / rect.width - 0.5;
          var py = (e.clientY - rect.top) / rect.height - 0.5;
          quickRY(px * 18);
          quickRX(-py * 18);
          quickScale(1.06);
        });
        slide.addEventListener("mouseleave", function () {
          quickRX(0); quickRY(0); quickScale(1);
        });
      } else {
        slide.addEventListener("touchstart", function () {
          gsap.to(inner, { scale: 1.06, duration: 0.25, ease: "power2.out" });
        }, { passive: true });
        slide.addEventListener("touchend", function () {
          gsap.to(inner, { scale: 1, rotationX: 0, rotationY: 0, duration: 0.3, ease: "power2.out" });
        }, { passive: true });
      }
    });
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

  /* ---------- Portfolio lightbox (shared modal) ---------- */
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightbox-img");
  var lightboxClose = document.getElementById("lightbox-close");
  var lightboxPrev = document.getElementById("lightbox-prev");
  var lightboxNext = document.getElementById("lightbox-next");
  var lightboxItems = [];
  var lightboxIndex = 0;

  function openLightbox(items, index) {
    if (!items.length) return;
    lightboxItems = items;
    lightboxIndex = (index + items.length) % items.length;
    var img = lightboxItems[lightboxIndex];
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.hidden = true;
    document.body.style.overflow = "";
  }

  function stepLightbox(dir) {
    if (!lightboxItems.length) return;
    openLightbox(lightboxItems, lightboxIndex + dir);
  }

  lightboxClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", function (e) { if (e.target === lightbox) closeLightbox(); });
  lightboxPrev.addEventListener("click", function () { stepLightbox(-1); });
  lightboxNext.addEventListener("click", function () { stepLightbox(1); });
  document.addEventListener("keydown", function (e) {
    if (lightbox.hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") stepLightbox(-1);
    if (e.key === "ArrowRight") stepLightbox(1);
  });

  /* ---------- Portfolio coverflow carousel ---------- */
  (function initPortfolioCarousel() {
    var root = document.getElementById("pf-carousel");
    if (!root) return;
    var track = document.getElementById("pf-track");
    var cards = Array.prototype.slice.call(track.querySelectorAll(".pf-card"));
    if (!cards.length) return;
    var bgLayers = Array.prototype.slice.call(root.querySelectorAll(".pf-carousel-bg-layer"));
    var dotsWrap = document.getElementById("pf-dots");
    var statusEl = document.getElementById("pf-status");
    var prevBtn = root.querySelector(".pf-prev");
    var nextBtn = root.querySelector(".pf-next");
    var images = cards.map(function (card) { return card.querySelector("img"); });

    var active = 0;
    var bgActiveLayer = 0;
    var spacing = isMobile ? 128 : 210;
    var autoplayDelay = 5200;
    var autoplayTimer = null;
    var hovering = false;

    cards.forEach(function (card, i) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "pf-dot";
      dot.setAttribute("aria-label", "Ir para trabalho " + (i + 1) + " de " + cards.length);
      dot.addEventListener("click", function () { goTo(i); });
      dotsWrap.appendChild(dot);
    });
    var dots = Array.prototype.slice.call(dotsWrap.children);

    function updateBg(index) {
      var nextLayerIdx = 1 - bgActiveLayer;
      var nextLayer = bgLayers[nextLayerIdx];
      nextLayer.style.backgroundImage = "url('" + images[index].src + "')";
      bgLayers.forEach(function (l) { l.classList.remove("is-active"); });
      nextLayer.classList.add("is-active");
      bgActiveLayer = nextLayerIdx;
    }

    function render(animate) {
      cards.forEach(function (card, i) {
        var offset = i - active;
        var dist = Math.abs(offset);
        var vars = reduceMotion
          ? { x: 0, y: 0, scale: 1, rotationY: 0, opacity: dist === 0 ? 1 : 0, zIndex: 100 - dist, duration: animate ? 0.35 : 0, ease: "power1.out" }
          : {
              x: offset * spacing,
              y: dist === 0 ? 0 : 12,
              scale: dist === 0 ? 1 : (dist === 1 ? 0.85 : 0.7),
              rotationY: Math.max(-24, Math.min(24, offset * -14)),
              opacity: dist > 2 ? 0 : (dist === 0 ? 1 : (dist === 1 ? 0.82 : 0.55)),
              zIndex: 100 - dist,
              duration: animate ? 0.85 : 0,
              ease: "cubic-bezier(0.22, 1, 0.36, 1)"
            };
        card.classList.toggle("is-active", i === active);
        card.setAttribute("aria-hidden", dist > 2 ? "true" : "false");
        card.tabIndex = dist > 2 ? -1 : 0;
        if (animate) { gsap.to(card, vars); } else { gsap.set(card, vars); }
      });
      dots.forEach(function (dot, i) { dot.classList.toggle("is-active", i === active); });
      updateBg(active);
      if (statusEl) statusEl.textContent = "Imagem " + (active + 1) + " de " + cards.length;
    }

    function goTo(index, animate) {
      active = (index + cards.length) % cards.length;
      render(animate !== false);
      restartAutoplay();
    }
    function next() { goTo(active + 1); }
    function prev() { goTo(active - 1); }

    render(false);

    prevBtn.addEventListener("click", prev);
    nextBtn.addEventListener("click", next);

    cards.forEach(function (card, i) {
      card.addEventListener("click", function (e) {
        if (i !== active) {
          e.preventDefault();
          goTo(i);
        } else {
          openLightbox(images, i);
        }
      });
    });

    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      if (e.key === "ArrowRight") { e.preventDefault(); next(); }
    });

    function startAutoplay() {
      if (reduceMotion || hovering) return;
      stopAutoplay();
      autoplayTimer = setInterval(next, autoplayDelay);
    }
    function stopAutoplay() { if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; } }
    function restartAutoplay() { startAutoplay(); }

    root.addEventListener("mouseenter", function () { hovering = true; stopAutoplay(); });
    root.addEventListener("mouseleave", function () { hovering = false; startAutoplay(); });
    root.addEventListener("focusin", function () { hovering = true; stopAutoplay(); });
    root.addEventListener("focusout", function () { hovering = false; startAutoplay(); });
    startAutoplay();

    // Drag (mouse/trackpad) + touch swipe
    var dragStartX = 0;
    var dragging = false;
    track.addEventListener("pointerdown", function (e) {
      dragging = true;
      dragStartX = e.clientX;
      track.classList.add("is-dragging");
      stopAutoplay();
      if (track.setPointerCapture) track.setPointerCapture(e.pointerId);
    });
    track.addEventListener("pointerup", function (e) {
      if (!dragging) return;
      dragging = false;
      track.classList.remove("is-dragging");
      var delta = e.clientX - dragStartX;
      if (Math.abs(delta) > 40) { delta < 0 ? next() : prev(); }
      restartAutoplay();
    });
    track.addEventListener("pointercancel", function () {
      dragging = false;
      track.classList.remove("is-dragging");
      restartAutoplay();
    });

    // Wheel: only acts while the pointer is over the carousel, one slide per
    // gesture with a cooldown — never blocks normal page scroll.
    var wheelCooldown = false;
    root.addEventListener("wheel", function (e) {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      if (wheelCooldown) return;
      wheelCooldown = true;
      e.deltaX > 0 ? next() : prev();
      setTimeout(function () { wheelCooldown = false; }, 500);
    }, { passive: false });
  })();

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
