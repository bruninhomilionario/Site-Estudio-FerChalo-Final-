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
        { els: section.querySelectorAll(".split-media, .coverflow, .pf-fan, .reviews-marquee, .contact-map"), from: { y: -70 * distScale, scale: 0.96, rotation: -2, filter: "blur(" + blurPx + "px)" }, duration: 1.1 * durScale, ease: "back.out(1.15)" },
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
      "#sobre .section-body, #estudio .section-body, .cta-text"
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
      "#sobre .section-heading, #portfolio .section-heading, #avaliacoes .section-heading, #estudio .section-heading, .cta-heading, #contato .section-heading"
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

  /* ---------- Studio video: pause when scrolled out of view ----------
     No longer auto-plays on scroll-in — browsers block autoplay-with-sound
     unless it's triggered by a real user gesture, and a silent autoplay
     defeats the point of having audio. Playback now only starts when the
     visitor presses the native play button, which counts as that gesture,
     so the sound plays normally every time. Auto-pausing on scroll-out is
     kept so it doesn't keep playing audio off-screen once started. */
  (function initStudioVideo() {
    var studioVideo = document.getElementById("studio-video");
    if (!studioVideo) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) studioVideo.pause();
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
    var heroTargets = {
      subheading: document.querySelector(".hero-subheading"),
      services: document.querySelector(".services-grid"),
      ctas: document.querySelectorAll(".hero-ctas .btn")
    };
    var socialFloats = [document.getElementById("facebook-float"), document.getElementById("instagram-float"), document.getElementById("whatsapp-float")].filter(Boolean);

    // Always plays, even with reduce-motion enabled at the OS level — this is
    // a one-shot entrance flourish (not a scroll-jacked/looping effect), and
    // OS-level "reduce animations" toggles have silently swallowed it before.
    gsap.set(heroTargets.subheading, { opacity: 0, y: -20 * distScale });
    gsap.set(heroTargets.services, { opacity: 0, y: -22 * distScale });
    gsap.set(heroTargets.ctas, { opacity: 0, y: -18 });
    if (socialFloats.length) gsap.set(socialFloats, { opacity: 0, scale: 0.6, y: 20 });

    var tl = gsap.timeline({ delay: 0.15 });
    tl.to(heroTargets.subheading, { opacity: 1, y: 0, duration: 0.7 * durScale, ease: "power2.out" }, 0.3)
      .to(heroTargets.services, { opacity: 1, y: 0, duration: 0.7 * durScale, ease: "power2.out" }, "-=0.35")
      .to(heroTargets.ctas, { opacity: 1, y: 0, duration: 0.55 * durScale, ease: "back.out(1.2)", stagger: 0.08 }, "-=0.35")
      .eventCallback("onComplete", function () {
        gsap.set([heroTargets.subheading, heroTargets.services, heroTargets.ctas], { clearProps: "transform,opacity" });
        if (socialFloats.length) {
          gsap.to(socialFloats, { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "back.out(1.4)", stagger: 0.08, onComplete: clearAfter(socialFloats) });
        }
      });
  })();

  /* ---------- Subtle scroll parallax (selected decorative/foreground elements) ---------- */
  if (!reduceMotion) {
    var parallaxAmt = isMobile ? 18 : 45;
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

  /* ---------- Services coverflow (Tatuagens & Piercings) ---------- */
  document.querySelectorAll("[data-coverflow]").forEach(function (root) {
    var slides = Array.prototype.slice.call(root.querySelectorAll(".coverflow-slide"));
    if (!slides.length) return;
    var isLarge = root.classList.contains("coverflow-lg");
    var active = 0;
    var spacing = isMobile ? (isLarge ? 118 : 96) : (isLarge ? 210 : 150);

    function render(animate) {
      slides.forEach(function (slide, i) {
        var offset = i - active;
        var dist = Math.abs(offset);
        var vars = {
          x: offset * spacing,
          y: dist === 0 ? 0 : Math.min(dist, 3) * 10,
          scale: dist === 0 ? 1 : Math.max(0.62, 1 - dist * 0.17),
          rotationY: Math.max(-42, Math.min(42, offset * -24)),
          opacity: dist > 3 ? 0 : (dist === 0 ? 1 : Math.max(0.35, 1 - dist * 0.28)),
          zIndex: 100 - dist,
          duration: animate ? 0.7 : 0,
          ease: "cubic-bezier(0.22, 1, 0.36, 1)"
        };
        if (animate) { gsap.to(slide, vars); } else { gsap.set(slide, vars); }
      });
    }

    gsap.set(slides, { xPercent: 0 });
    render(false);

    function goTo(index, animate) {
      active = (index + slides.length) % slides.length;
      render(animate !== false);
      restartAutoplay();
    }

    root.querySelectorAll(".coverflow-arrow").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var dir = parseInt(btn.dataset.dir, 10);
        goTo(active + dir);
      });
    });

    var autoplayDelay = parseInt(root.dataset.autoplay, 10) || 0;
    var autoplayTimer = null;

    function startAutoplay() {
      // Ignores reduceMotion on purpose: OS-level "reduce motion" has
      // silently killed autoplay/entrance animations before in this project,
      // and this carousel's auto-advance is an explicit user requirement.
      // Also never pauses on hover/touch/focus — advances continuously.
      if (!autoplayDelay) return;
      stopAutoplay();
      autoplayTimer = setInterval(function () { goTo(active + 1); }, autoplayDelay);
    }
    function stopAutoplay() { if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; } }
    function restartAutoplay() { startAutoplay(); }

    if (autoplayDelay) startAutoplay();

    slides.forEach(function (slide, i) {
      slide.addEventListener("click", function () {
        if (i === active) return;
        goTo(i);
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

  /* ---------- Portfolio fan carousel ----------
     A stack of cards fanned out around a center card, GSAP-animated: only
     a window of 7 (of the full set) is ever visible/positioned at once,
     rotating circularly as the visitor pages through. Hovering a card (fine
     pointers only) pushes its neighbors apart, similar to spreading a hand
     of playing cards. */
  (function initPortfolioFan() {
    var root = document.getElementById("pf-fan");
    if (!root) return;
    var track = document.getElementById("pf-fan-track");
    var cardEls = Array.prototype.slice.call(track.querySelectorAll(".pf-fan-card"));
    if (!cardEls.length) return;
    var images = cardEls.map(function (card) { return card.querySelector("img"); });
    var dotsWrap = document.getElementById("pf-fan-dots");
    var statusEl = document.getElementById("pf-fan-status");
    var prevBtn = root.querySelector(".pf-fan-prev");
    var nextBtn = root.querySelector(".pf-fan-next");

    var total = cardEls.length;
    var MAX_VISIBLE = 7;
    var HALF = 3;
    var FAN_POSITIONS = [
      { rot: -21, scale: 0.7756, x: -30, y: 7.3, z: 1 },
      { rot: -14, scale: 0.8498, x: -22, y: 4.0, z: 2 },
      { rot: -7, scale: 0.9346, x: -11, y: 1.3, z: 3 },
      { rot: 0, scale: 1.0, x: 0, y: 0.0, z: 10 },
      { rot: 7, scale: 0.9346, x: 11, y: 1.3, z: 3 },
      { rot: 14, scale: 0.8498, x: 22, y: 4.0, z: 2 },
      { rot: 21, scale: 0.7756, x: 30, y: 7.3, z: 1 }
    ];
    var needsPagination = total > MAX_VISIBLE;
    var centerIndex = needsPagination ? HALF : (total >> 1);
    var animating = false;
    var hasEntered = false;
    var direction = null;
    var prevVisible = {};
    var hoverCleanup = null;
    var autoplayTimer = null;
    var hovering = false;

    function respMult(w) {
      if (w < 480) return 0.55;
      if (w < 640) return 0.62;
      if (w < 768) return 0.72;
      if (w < 1024) return 0.85;
      return 1.0;
    }
    function slotConfig(slotCount, slot) {
      if (slotCount >= MAX_VISIBLE) return FAN_POSITIONS[slot];
      var center = slotCount >> 1;
      var distance = slotCount > 1 ? (slot - center) / center : 0;
      var abs = Math.abs(distance);
      return { rot: distance * 21, scale: 1 - 0.2244 * abs * abs, x: distance * 30, y: abs * abs * 7.3, z: 10 - Math.abs(slot - center) };
    }
    function getVisibleMap(center) {
      var map = {};
      if (!needsPagination) {
        cardEls.forEach(function (_, i) { map[i] = i; });
        return map;
      }
      for (var slot = 0; slot < MAX_VISIBLE; slot++) {
        var idx = ((center + slot - HALF) % total + total) % total;
        map[idx] = slot;
      }
      return map;
    }
    function extend(a, b) {
      var out = {};
      for (var k in a) out[k] = a[k];
      for (var k2 in b) out[k2] = b[k2];
      return out;
    }

    cardEls.forEach(function (card, i) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "pf-fan-dot";
      dot.setAttribute("aria-label", "Ir para trabalho " + (i + 1) + " de " + total);
      dot.addEventListener("click", function () { goTo(i); });
      dotsWrap.appendChild(dot);
    });
    var dots = Array.prototype.slice.call(dotsWrap.children);

    function updateDots() { dots.forEach(function (dot, i) { dot.classList.toggle("is-active", i === centerIndex); }); }
    function updateStatus() { if (statusEl) statusEl.textContent = "Imagem " + (centerIndex + 1) + " de " + total; }

    function render() {
      var visibleMap = getVisibleMap(centerIndex);
      var isFirst = !hasEntered;
      var animate = !reduceMotion;
      var mult = respMult(window.innerWidth);
      var slotCount = needsPagination ? MAX_VISIBLE : total;
      var remaining = Object.keys(visibleMap).length;

      if (animate && isFirst) animating = true;
      function done() {
        remaining--;
        if (remaining <= 0) {
          animating = false;
          if (isFirst) hasEntered = true;
        }
      }

      cardEls.forEach(function (card, i) {
        var slot = visibleMap[i];
        var wasVisible = Object.prototype.hasOwnProperty.call(prevVisible, i);
        card.setAttribute("aria-hidden", slot === undefined ? "true" : "false");
        card.tabIndex = slot === undefined ? -1 : 0;

        if (slot !== undefined) {
          var c = slotConfig(slotCount, slot);
          var target = { x: (c.x * mult) + "rem", y: (c.y * mult) + "rem", rotation: c.rot, scale: c.scale, opacity: 1, zIndex: c.z };
          if (!animate) {
            gsap.set(card, target);
            done();
          } else if (isFirst) {
            gsap.set(card, { x: 0, y: "9rem", rotation: 0, scale: 0.5, opacity: 0 });
            gsap.to(card, extend(target, { duration: 1.1, ease: "elastic.out(1.05,0.78)", delay: 0.15 + slot * 0.05, onComplete: done }));
          } else if (!wasVisible) {
            var enterX = direction === "right" ? 36 : -36;
            gsap.set(card, { x: enterX + "rem", y: (c.y * mult) + "rem", rotation: direction === "right" ? 28 : -28, scale: 0.5, opacity: 0 });
            gsap.to(card, extend(target, { duration: 0.55, ease: "power2.out", onComplete: done }));
          } else {
            gsap.to(card, extend(target, { duration: 0.5, ease: "power2.out", onComplete: done }));
          }
        } else if (wasVisible) {
          if (!animate) { gsap.set(card, { opacity: 0, scale: 0.5, zIndex: 0 }); }
          else {
            var exitX = direction === "right" ? -36 : 36;
            gsap.to(card, { x: exitX + "rem", opacity: 0, scale: 0.5, rotation: direction === "right" ? -28 : 28, duration: 0.35, ease: "power2.in", zIndex: 0 });
          }
        } else if (isFirst) {
          gsap.set(card, { opacity: 0, scale: 0.3, x: 0, y: 0, zIndex: 0 });
        }
      });

      prevVisible = visibleMap;
      updateDots();
      updateStatus();
      setupHover(visibleMap, slotCount, mult);
    }

    function setupHover(visibleMap, slotCount, mult) {
      if (hoverCleanup) { hoverCleanup(); hoverCleanup = null; }
      if (reduceMotion || !isFinePointer) return;

      var entries = [];
      cardEls.forEach(function (el, i) {
        var slot = visibleMap[i];
        if (slot !== undefined) entries.push({ el: el, slot: slot });
      });
      entries.sort(function (a, b) { return a.slot - b.slot; });

      var activeSlot = null;
      var leaveTimer = null;
      var centerSlot = entries.length >> 1;

      function updateHoverLayout(hoveredSlot) {
        entries.forEach(function (entry) {
          var base = slotConfig(slotCount, entry.slot);
          var targetX = base.x * mult;
          var targetY = base.y * mult;
          var targetRot = base.rot;
          var targetScale = base.scale;
          var delay = 0;

          if (hoveredSlot !== null) {
            var distance = Math.abs(entry.slot - hoveredSlot);
            delay = distance * 0.02;
            if (entry.slot === hoveredSlot) {
              targetY -= 1.8 * mult;
              targetScale *= 1.1;
            } else {
              var normalized = centerSlot > 0 ? (entry.slot - centerSlot) / centerSlot : 0;
              var pushStrength = 7 * (1 - Math.abs(normalized)) * (1 + 0.2 * Math.max(0, 3 - distance));
              if (entry.slot < hoveredSlot) { targetX -= pushStrength * mult; targetRot -= 3 / (distance + 1); }
              else { targetX += pushStrength * mult; targetRot += 3 / (distance + 1); }
            }
          } else {
            delay = Math.abs(entry.slot - centerSlot) * 0.02;
          }

          gsap.to(entry.el, { x: targetX + "rem", y: targetY + "rem", rotation: targetRot, scale: targetScale, duration: 0.45, delay: delay, ease: "elastic.out(1,0.75)", overwrite: "auto" });
          gsap.set(entry.el, { zIndex: base.z });
        });
      }

      var handlers = entries.map(function (entry) {
        var handler = function () {
          if (animating) return;
          if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
          if (activeSlot !== entry.slot) { activeSlot = entry.slot; updateHoverLayout(entry.slot); }
        };
        entry.el.addEventListener("mouseenter", handler);
        return { el: entry.el, handler: handler };
      });

      function onLeave() {
        if (animating) return;
        if (leaveTimer) clearTimeout(leaveTimer);
        leaveTimer = setTimeout(function () { activeSlot = null; updateHoverLayout(null); }, 50);
      }
      root.addEventListener("mouseleave", onLeave);

      hoverCleanup = function () {
        handlers.forEach(function (h) { h.el.removeEventListener("mouseenter", h.handler); });
        root.removeEventListener("mouseleave", onLeave);
        if (leaveTimer) clearTimeout(leaveTimer);
      };
    }

    function cycle(dir) {
      if (animating || !needsPagination) return;
      direction = dir;
      centerIndex = dir === "right" ? (centerIndex + 1) % total : (centerIndex - 1 + total) % total;
      render();
      restartAutoplay();
    }

    function goTo(index) {
      if (index === centerIndex) { openLightbox(images, index); return; }
      if (animating) return;
      var diffForward = (index - centerIndex + total) % total;
      var diffBackward = (centerIndex - index + total) % total;
      direction = diffForward <= diffBackward ? "right" : "left";
      centerIndex = index;
      render();
      restartAutoplay();
    }

    render();

    prevBtn.addEventListener("click", function () { cycle("left"); });
    nextBtn.addEventListener("click", function () { cycle("right"); });

    cardEls.forEach(function (card, i) {
      card.addEventListener("click", function () { goTo(i); });
    });

    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); cycle("left"); }
      if (e.key === "ArrowRight") { e.preventDefault(); cycle("right"); }
    });

    var autoplayDelay = 4500;
    function startAutoplay() {
      if (reduceMotion || hovering || !needsPagination) return;
      stopAutoplay();
      autoplayTimer = setInterval(function () { cycle("right"); }, autoplayDelay);
    }
    function stopAutoplay() { if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; } }
    function restartAutoplay() { startAutoplay(); }

    root.addEventListener("mouseenter", function () { hovering = true; stopAutoplay(); });
    root.addEventListener("mouseleave", function () { hovering = false; startAutoplay(); });
    root.addEventListener("focusin", function () { hovering = true; stopAutoplay(); });
    root.addEventListener("focusout", function () { hovering = false; startAutoplay(); });
    startAutoplay();

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { if (!animating) render(); }, 200);
    });
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
