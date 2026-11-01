/* ==========================================================================
   main.js — scrollytelling ของพอร์ตโฟลิโอ
   ทุกอย่างหลักทำงานได้แม้ GSAP โหลดไม่ขึ้น (GSAP ใช้เพิ่มลูกเล่นเท่านั้น)
   ========================================================================== */
(function () {
  'use strict';

  /* ───── ข้อมูลติดต่อ: ใส่แล้วจะโผล่ใน footer เอง (เว้นว่าง = ซ่อน) ───── */
  var CONTACT = {
    email: 'peerapat.punn@gmail.com',
    instagram: 'gyoza_pt'   // no @
  };

  var d = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var mqMobile = window.matchMedia('(max-width: 860px)');
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var isCalm = function () { return d.classList.contains('calm'); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* ───────────────────────── 1) Frame loop (ท่าเล่นเบส) ───────────────────────── */
  function FrameLoop(root) {
    this.frames = $$('.frame', root);
    this.i = 0; this.fps = 7; this.t = 0;
  }
  FrameLoop.prototype.tick = function () {
    var self = this;
    this.frames[this.i].classList.remove('is-on');
    this.i = (this.i + 1) % this.frames.length;
    this.frames[this.i].classList.add('is-on');
    this.t = setTimeout(function () { self.tick(); }, 1000 / this.fps);
  };
  FrameLoop.prototype.start = function () {
    if (this.t || this.frames.length < 2 || isCalm()) return;
    var self = this;
    this.t = setTimeout(function () { self.tick(); }, 1000 / this.fps);
  };
  FrameLoop.prototype.stop = function () { clearTimeout(this.t); this.t = 0; };
  FrameLoop.prototype.reset = function () {
    this.stop();
    this.frames.forEach(function (f, k) { f.classList.toggle('is-on', k === 0); });
    this.i = 0;
  };

  var narrator = $('#narrator');
  var narratorBody = $('#narratorBody');
  var deskLoop = new FrameLoop($('.pose--bass', narrator));
  var mobileLoopEl = $('.hero__char-mobile [data-loop]');
  var mobileLoop = mobileLoopEl ? new FrameLoop(mobileLoopEl) : null;

  // hover: เด้งขึ้นเล็กน้อย + เร่งจังหวะ
  narratorBody.addEventListener('mouseenter', function () {
    if (narrator.dataset.state !== 'hero') return;
    narrator.classList.add('is-hover');
    deskLoop.fps = 13;
  });
  narratorBody.addEventListener('mouseleave', function () {
    narrator.classList.remove('is-hover');
    deskLoop.fps = 7;
  });

  /* Click / tap the hero character → play the bass clip once (with sound), then fade back to the loop */
  function HeroClip(host, loop) {
    this.host = host;
    this.loop = loop;
    this.video = $('.hero-video', host);
    this.playing = false;
    var self = this;
    this.video.addEventListener('ended', function () { self.stop(); });
  }
  HeroClip.prototype.warm = function () {
    if (this.video.preload !== 'auto') { this.video.preload = 'auto'; this.video.load(); }
  };
  HeroClip.prototype.play = function () {
    if (this.playing) return;
    var v = this.video, self = this;
    this.playing = true;
    this.loop.stop();
    this.host.classList.add('is-playing');
    v.muted = false;
    try { v.currentTime = 0; } catch (e) {}
    var p = v.play();
    if (p && p.catch) {
      p.catch(function () {
        // sound blocked by the browser → still show the clip, muted
        v.muted = true;
        v.play().catch(function () { self.stop(); });
      });
    }
  };
  HeroClip.prototype.stop = function () {
    if (!this.playing) return;
    this.playing = false;
    this.video.pause();
    this.host.classList.remove('is-playing');
    this.loop.reset();
    syncLoops();
  };

  var deskClip = new HeroClip(narratorBody, deskLoop);
  var mobileHost = $('#mobileChar');
  var mobileClip = mobileHost && mobileLoop ? new HeroClip(mobileHost, mobileLoop) : null;

  narratorBody.addEventListener('mouseenter', function () { if (narrator.dataset.state === 'hero') deskClip.warm(); });
  narratorBody.addEventListener('click', function () {
    if (narrator.dataset.state === 'hero') deskClip.play();
  });
  if (mobileClip) {
    mobileHost.addEventListener('click', function () { mobileClip.play(); });
  }
  $('#playHero').addEventListener('click', function () {
    if (mqMobile.matches) { if (mobileClip) mobileClip.play(); } else deskClip.play();
  });

  /* ───────────────────────── 2) Narrator state + พื้นหลังกลางวัน→กลางคืน ───────────────────────── */
  var POSE = { hero: 'bass', center: 'present', 'left-present': 'present', 'left-point': 'point' };
  var DARK = { off: true };
  var poses = $$('.pose', narrator);
  var sections = $$('[data-narrator]');
  var layers = {
    eve: $('.sky__eve'), dusk: $('.sky__dusk'), night: $('.sky__night')
  };
  var refs = { timeline: $('#timeline'), stage: $('#stage'), dream: $('#dream') };
  var heroSection = $('#hero');
  var currentState = '';

  function setPose(name) {
    poses.forEach(function (p) { p.classList.toggle('is-on', p.dataset.pose === name); });
  }

  function setState(state) {
    if (state === currentState) return;
    currentState = state;
    narrator.dataset.state = state;
    if (POSE[state]) setPose(POSE[state]);
    if (state !== 'hero') deskClip.stop();
    d.dataset.tone = DARK[state] ? 'dark' : 'light';
    syncLoops();
  }

  function syncLoops() {
    var visible = !document.hidden && !isCalm();
    if (visible && !mqMobile.matches && currentState === 'hero' && !deskClip.playing) deskLoop.start(); else deskLoop.stop();
    if (mobileLoop) {
      var heroOn = heroSection.getBoundingClientRect().bottom > 0;
      if (!heroOn && mobileClip) mobileClip.stop();
      if (visible && mqMobile.matches && heroOn && !(mobileClip && mobileClip.playing)) mobileLoop.start(); else mobileLoop.stop();
    }
  }

  // ramp: 0 เมื่อขอบบนขององค์ประกอบอยู่ที่ a*vh, 1 เมื่ออยู่ที่ b*vh
  function ramp(el, a, b) {
    var top = el.getBoundingClientRect().top, vh = window.innerHeight;
    return clamp((a * vh - top) / ((a - b) * vh), 0, 1);
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }
  function update() {
    ticking = false;
    d.classList.toggle('scrolled', window.scrollY > 30);
    var mid = window.innerHeight * 0.5;
    // ส่วนไหนคร่อมกลางจอ → state ของตัวละคร
    var state = 'hero';
    for (var i = 0; i < sections.length; i++) {
      var r = sections[i].getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) { state = sections[i].dataset.narrator; break; }
      if (r.top > mid) break;
      state = sections[i].dataset.narrator;
    }
    setState(state);

    // ท้องฟ้า: พาสเทล → เย็น → ม่วง (คอนเสิร์ต) → กรมท่า (ความฝัน)
    layers.eve.style.opacity = ramp(refs.timeline, 1.0, 0.2).toFixed(3);
    layers.dusk.style.opacity = ramp(refs.stage, 1.0, 0.1).toFixed(3);
    layers.night.style.opacity = ramp(refs.dream, 1.0, 0.1).toFixed(3);

    if (mobileLoop) syncLoops();
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  document.addEventListener('visibilitychange', syncLoops);
  update();

  /* ───────────────────────── 3) Reveal เมื่อเลื่อนถึง ───────────────────────── */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ───────────────────────── 4) ของ 4 ชิ้น: กดแล้วซูมเข้าไปยังส่วนนั้น ───────────────────────── */
  var zoom = $('#zoom');
  var ZOOM_COLOR = { '#stage': '#3f2775', '#games': '#a99bcb', '#programs': '#9cb6da', '#timeline': '#8f84bb' };

  function jumpTo(el) {
    var prev = d.style.scrollBehavior;
    d.style.scrollBehavior = 'auto';
    el.scrollIntoView({ block: 'start' });
    d.style.scrollBehavior = prev;
    update();
  }

  function zoomTo(btn, sel) {
    var target = $(sel);
    if (!target) return;
    if (isCalm() || !zoom.animate) { jumpTo(target); return; }

    var r = btn.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var R = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy)) + 20;
    var ease = 'cubic-bezier(.7,0,.25,1)';

    zoom.style.setProperty('--zoom-bg', ZOOM_COLOR[sel] || '#fff');
    zoom.style.visibility = 'visible';
    var grow = btn.animate(
      [{ transform: 'scale(1.14)', opacity: 1 }, { transform: 'scale(3)', opacity: 0 }],
      { duration: 560, easing: ease, fill: 'forwards' }
    );
    var wipe = zoom.animate(
      [{ clipPath: 'circle(0px at ' + cx + 'px ' + cy + 'px)' }, { clipPath: 'circle(' + R + 'px at ' + cx + 'px ' + cy + 'px)' }],
      { duration: 620, easing: ease, fill: 'forwards' }
    );
    wipe.onfinish = function () {
      jumpTo(target);
      grow.cancel();
      var out = zoom.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 650, easing: 'ease-out', fill: 'forwards' });
      out.onfinish = function () {
        zoom.style.visibility = 'hidden';
        wipe.cancel(); out.cancel();
      };
    };
  }
  $$('.item').forEach(function (btn) {
    btn.addEventListener('click', function () { zoomTo(btn, btn.dataset.target); });
  });

  /* ───────────────────────── 5) Project galleries + lightbox ───────────────────────── */
  // Swap an <img> with a quick fade; the next image is preloaded first so there's no flash.
  function fadeSwap(img, src, alt) {
    if (img.getAttribute('src') === src) { img.alt = alt; return; }
    var pre = new Image();
    var done = false;
    var show = function () {
      if (done) return; done = true;
      img.src = src; img.alt = alt;
      requestAnimationFrame(function () { img.classList.remove('is-fading'); });
    };
    img.classList.add('is-fading');
    pre.onload = pre.onerror = function () { setTimeout(show, isCalm() ? 0 : 180); };
    pre.src = src;
    setTimeout(show, 1500); // safety net on slow networks
  }

  // Lightbox (full screen, ← → keys, Esc closes via <dialog>)
  var lightbox = $('#lightbox');
  var lb = { items: [], i: 0, name: '' };
  var lbImg = lightbox ? $('img', lightbox) : null;
  var lbCap = lightbox ? $('.lightbox__cap', lightbox) : null;
  function lbShow(i, instant) {
    var n = lb.items.length;
    lb.i = (i + n) % n;
    var it = lb.items[lb.i];
    if (instant) { lbImg.src = it.src; lbImg.alt = it.alt; } else fadeSwap(lbImg, it.src, it.alt);
    lbCap.innerHTML = '';
    var b = document.createElement('b'); b.textContent = (lb.i + 1) + ' / ' + n;
    lbCap.appendChild(b);
    lbCap.appendChild(document.createTextNode(it.alt));
    $$('.lightbox__nav', lightbox).forEach(function (x) { x.hidden = n < 2; });
  }
  function lbOpen(items, i) {
    if (!lightbox || !lightbox.showModal) { window.open(items[i].src, '_blank', 'noopener'); return; }
    lb.items = items;
    lbShow(i, true);
    lightbox.showModal();
  }
  if (lightbox) {
    $('.lightbox__close', lightbox).addEventListener('click', function () { lightbox.close(); });
    $('.lightbox__nav--prev', lightbox).addEventListener('click', function () { lbShow(lb.i - 1); });
    $('.lightbox__nav--next', lightbox).addEventListener('click', function () { lbShow(lb.i + 1); });
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox || e.target.classList.contains('lightbox__fig')) lightbox.close();
    });
    lightbox.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); lbShow(lb.i - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); lbShow(lb.i + 1); }
    });
    // swipe on touch screens
    var sx = null;
    lightbox.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lightbox.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 50) lbShow(lb.i + (dx < 0 ? 1 : -1));
    });
  }

  $$('.gc').forEach(function (gc) {
    var stage = $('.gc__stage', gc);
    var img = $('.gc__img', gc);
    var count = $('.gc__count', gc);
    var thumbs = $$('.gc__thumb', gc);
    var items = thumbs.map(function (t) { return { src: t.dataset.src, alt: t.dataset.alt }; });
    var current = 0;

    function stopVideo() {
      var f = $('iframe', stage);
      if (f) f.remove();
      gc.classList.remove('is-video');
    }
    function select(i) {
      stopVideo();
      current = i;
      thumbs.forEach(function (t, k) {
        t.classList.toggle('is-active', k === i);
        if (k === i) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
      });
      count.textContent = (i + 1) + ' / ' + items.length;
      fadeSwap(img, items[i].src, items[i].alt);
    }
    thumbs.forEach(function (t, k) { t.addEventListener('click', function () { select(k); }); });
    $('.gc__main', gc).addEventListener('click', function () { lbOpen(items, current); });

    // Optional YouTube video: "Watch" button loads the embed only when clicked
    if (gc.dataset.yt) {
      var play = document.createElement('button');
      play.type = 'button';
      play.className = 'gc__play';
      play.textContent = gc.dataset.ytLabel || 'Watch video';
      play.setAttribute('aria-label', (gc.dataset.ytLabel || 'Watch video') + ': ' + (gc.dataset.name || '') + ' on YouTube');
      stage.appendChild(play);
      play.addEventListener('click', function () {
        var f = document.createElement('iframe');
        f.src = 'https://www.youtube-nocookie.com/embed/' + gc.dataset.yt + '?autoplay=1&rel=0';
        f.title = (gc.dataset.name || '') + ' video';
        f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        f.allowFullscreen = true;
        stage.appendChild(f);
        gc.classList.add('is-video');
      });
    }
  });

  /* ───────────────────────── 6) แกลเลอรีเลื่อนแนวนอน ───────────────────────── */
  var track = $('#galleryTrack');
  if (track) {
    $$('.gbtn').forEach(function (b) {
      b.addEventListener('click', function () {
        track.scrollBy({ left: Number(b.dataset.dir) * track.clientWidth * 0.75, behavior: isCalm() ? 'auto' : 'smooth' });
      });
    });
    // ลากด้วยเมาส์
    var down = false, sx = 0, sl = 0, moved = 0;
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = 0; sx = e.clientX; sl = track.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx;
      moved = Math.max(moved, Math.abs(dx));
      if (moved > 4) track.classList.add('dragging');
      track.scrollLeft = sl - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return;
      down = false;
      track.classList.remove('dragging');
    });
    // เลื่อนล้อเมาส์แนวตั้ง → แนวนอน เมื่อชี้อยู่บนแกลเลอรี (ยกเว้นสุดขอบแล้ว)
    track.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      var max = track.scrollWidth - track.clientWidth;
      if ((e.deltaY > 0 && track.scrollLeft >= max - 2) || (e.deltaY < 0 && track.scrollLeft <= 2)) return;
      e.preventDefault();
      track.scrollLeft += e.deltaY;
    }, { passive: false });
  }

  /* ───────────────────────── 7) ดาว ───────────────────────── */
  var starCanvas = $('#stars');
  var stars = null;
  if (starCanvas && window.Starfield) {
    stars = new window.Starfield(starCanvas);
    stars.setCalm(isCalm());
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) stars.start(); else stars.stop(); });
      }, { rootMargin: '100px 0px' }).observe(starCanvas);
    } else {
      stars.start();
    }
  }

  /* ───────────────────────── 8) ข้อมูลติดต่อ ───────────────────────── */
  if (CONTACT.email) {
    var em = $('[data-contact="email"]');
    $('a', em).href = 'mailto:' + CONTACT.email;
    $('em', em).textContent = CONTACT.email + ' ↗';
    em.hidden = false;
  }
  if (CONTACT.instagram) {
    var ig = $('[data-contact="instagram"]');
    $('a', ig).href = 'https://www.instagram.com/' + CONTACT.instagram.replace(/^@/, '');
    $('em', ig).textContent = '@' + CONTACT.instagram.replace(/^@/, '') + ' ↗';
    ig.hidden = false;
  }

  /* ───────────────────────── 9) GSAP: ลูกเล่นเสริม ───────────────────────── */
  var ctx = null;

  function initMotion() {
    if (!window.gsap || !window.ScrollTrigger || isCalm()) return;
    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);
    var mobile = mqMobile.matches;

    ctx = gsap.context(function () {
      // Hero intro
      var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.from('.hero__title .line > span', { yPercent: 110, duration: 1.2, stagger: 0.09 })
        .from('.hero .eyebrow, .hero__lead, .hero__buttons', { y: 24, opacity: 0, duration: 1, stagger: 0.08 }, 0.25)
        .from('.narrator__glow', { opacity: 0, duration: 1.6, clearProps: 'opacity' }, 0)
        .from('#narratorBody, .hero__char-mobile', { opacity: 0, y: 40, duration: 1.2 }, 0.15);

      // ของ 4 ชิ้นเด้งเข้ามา
      gsap.fromTo('.item', { '--pop': 0, opacity: 0 }, {
        '--pop': 1, opacity: 1, duration: 0.9, stagger: 0.1, ease: 'back.out(1.8)',
        scrollTrigger: { trigger: '.work', start: mobile ? 'top 70%' : 'top 45%' }
      });

      // ตัวเลขนับขึ้น
      $$('.stat__n').forEach(function (el) {
        var end = Number(el.dataset.count), o = { v: 0 };
        if (el.getBoundingClientRect().top > window.innerHeight) el.textContent = '0';
        gsap.to(o, {
          v: end, duration: 1.6, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          onUpdate: function () { el.textContent = Math.round(o.v); }
        });
      });

      // เส้น timeline วิ่งตามการเลื่อน
      gsap.fromTo('.tl', { '--tl': 0 }, {
        '--tl': 1, ease: 'none',
        scrollTrigger: { trigger: '.tl', start: 'top 65%', end: 'bottom 65%', scrub: true }
      });

      if (!mobile) {
        // เลข 01 จางๆ เลื่อนช้ากว่า (parallax)
        gsap.to('.ghost-num', { yPercent: 40, ease: 'none', scrollTrigger: { trigger: '.work', start: 'top bottom', end: 'bottom top', scrub: true } });

        // ฉากเวที/ความฝัน: ซูมออกช้าๆ ตามการเลื่อน
        $$('.scene').forEach(function (sc) {
          gsap.fromTo($('.scene__img', sc), { scale: 1.16 }, {
            scale: 1, ease: 'none',
            scrollTrigger: { trigger: $('.scene__pin', sc), start: 'top bottom', end: 'bottom top', scrub: true }
          });
        });
      }

      // ข้อความฉากความฝัน
      gsap.from('.dream .scene__copy > *', {
        y: 40, opacity: 0, duration: 1.2, stagger: 0.14, ease: 'expo.out',
        scrollTrigger: { trigger: '.dream', start: mobile ? 'top 60%' : 'top 40%' }
      });
      gsap.from('.stage .scene__copy .display, .stage .scene__copy .eyebrow', {
        y: 40, opacity: 0, duration: 1.1, stagger: 0.1, ease: 'expo.out',
        scrollTrigger: { trigger: '.stage', start: 'top 55%' }
      });
    });

    window.addEventListener('load', function () { window.ScrollTrigger.refresh(); }, { once: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { window.ScrollTrigger.refresh(); });
  }

  function stopMotion() {
    if (ctx) { ctx.revert(); ctx = null; }
    $$('.stat__n').forEach(function (el) { el.textContent = el.dataset.count; });
  }

  /* ───────────────────────── 10) ปุ่ม "ข้าม animation" + prefers-reduced-motion ───────────────────────── */
  var skipBtn = $('#skipAnim');
  function applyCalm(on, fromUser) {
    d.classList.toggle('calm', on);
    skipBtn.setAttribute('aria-pressed', String(on));
    if (on) {
      stopMotion();
      deskLoop.reset();
      if (mobileLoop) mobileLoop.reset();
      if (stars) stars.setCalm(true);
    } else {
      if (stars) { stars.setCalm(false); stars.start(); }
      initMotion();
    }
    syncLoops();
    if (fromUser) {
      try { localStorage.setItem('skipAnim', on ? '1' : '0'); } catch (e) { /* ไม่เป็นไร */ }
      if (on && window.scrollY < window.innerHeight * 0.6) jumpTo($('#work'));
    }
  }
  skipBtn.setAttribute('aria-pressed', String(isCalm()));
  skipBtn.addEventListener('click', function () { applyCalm(!isCalm(), true); });

  var mqHandler = function () {
    var stored = null;
    try { stored = localStorage.getItem('skipAnim'); } catch (e) {}
    applyCalm(mqReduce.matches || stored === '1', false);
  };
  if (mqReduce.addEventListener) mqReduce.addEventListener('change', mqHandler);
  mqMobile.addEventListener && mqMobile.addEventListener('change', function () {
    deskClip.stop(); if (mobileClip) mobileClip.stop();
    stopMotion(); initMotion(); syncLoops(); update();
  });

  // GSAP มาจาก CDN แบบ defer จึงพร้อมแล้วตอนนี้ (ถ้าโหลดได้)
  initMotion();
  syncLoops();
})();
