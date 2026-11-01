/* ดาวกระพริบ + ดาวตก บน canvas (ส่วน 04 Dream)
   ใช้: const sf = new Starfield(canvas); sf.start(); sf.stop(); sf.setCalm(true) */
(function () {
  'use strict';

  function rand(a, b) { return a + Math.random() * (b - a); }

  function Starfield(canvas) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.stars = [];
    this.shoots = [];
    this.running = false;
    this.calm = false;
    this.nextShoot = 0;
    this.raf = 0;
    this.w = 0; this.h = 0;
    this._loop = this.loop.bind(this);

    var self = this;
    if ('ResizeObserver' in window) {
      new ResizeObserver(function () { self.resize(); }).observe(canvas);
    } else {
      window.addEventListener('resize', function () { self.resize(); });
    }
    this.resize();
  }

  Starfield.prototype.resize = function () {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = this.c.clientWidth, h = this.c.clientHeight;
    if (!w || !h) return;
    if (w === this.w && h === this.h) return;
    this.w = w; this.h = h;
    this.c.width = Math.round(w * dpr);
    this.c.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var mobile = w < 700;
    var count = Math.min(mobile ? 90 : 240, Math.round((w * h) / (mobile ? 2600 : 5200)));
    this.stars = [];
    for (var i = 0; i < count; i++) {
      var big = Math.random() < 0.08;
      this.stars.push({
        x: Math.random() * w,
        y: Math.pow(Math.random(), 1.5) * h * 0.72, // หนาแน่นด้านบน
        r: big ? rand(1.2, 1.9) : rand(0.4, 1.1),
        a: big ? rand(0.75, 1) : rand(0.35, 0.85),
        sp: rand(0.6, 2.4),
        ph: rand(0, Math.PI * 2),
        big: big
      });
    }
    if (!this.running) this.draw(performance.now(), true);
  };

  Starfield.prototype.spawnShoot = function () {
    var w = this.w, h = this.h;
    var speed = rand(0.9, 1.4) * Math.max(w, 600) / 1000; // px/ms
    var ang = rand(0.32, 0.55); // ลงซ้าย
    this.shoots.push({
      x: rand(w * 0.35, w * 1.05),
      y: rand(-20, h * 0.25),
      vx: -Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      len: rand(110, 220),
      life: 0,
      ttl: rand(700, 1100)
    });
  };

  Starfield.prototype.draw = function (t, still) {
    var ctx = this.ctx, w = this.w, h = this.h;
    ctx.clearRect(0, 0, w, h);
    var tt = t / 1000;

    for (var i = 0; i < this.stars.length; i++) {
      var s = this.stars[i];
      var a = still ? s.a * 0.85 : s.a * (0.5 + 0.5 * Math.sin(tt * s.sp + s.ph));
      if (a < 0.03) continue;
      ctx.globalAlpha = a;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      if (s.big) {
        // ประกายรูปกากบาท
        ctx.globalAlpha = a * 0.55;
        ctx.fillRect(s.x - s.r * 4, s.y - 0.4, s.r * 8, 0.8);
        ctx.fillRect(s.x - 0.4, s.y - s.r * 4, 0.8, s.r * 8);
      }
    }
    ctx.globalAlpha = 1;
  };

  Starfield.prototype.drawShoots = function (dt) {
    var ctx = this.ctx;
    for (var i = this.shoots.length - 1; i >= 0; i--) {
      var s = this.shoots[i];
      s.life += dt;
      s.x += s.vx * dt; s.y += s.vy * dt;
      var p = s.life / s.ttl;
      if (p >= 1) { this.shoots.splice(i, 1); continue; }
      var fade = p < 0.15 ? p / 0.15 : 1 - (p - 0.15) / 0.85;
      var mag = Math.hypot(s.vx, s.vy);
      var tx = s.x - (s.vx / mag) * s.len, ty = s.y - (s.vy / mag) * s.len;
      var g = ctx.createLinearGradient(s.x, s.y, tx, ty);
      g.addColorStop(0, 'rgba(255,255,255,' + (0.95 * fade) + ')');
      g.addColorStop(0.25, 'rgba(200,215,255,' + (0.45 * fade) + ')');
      g.addColorStop(1, 'rgba(200,215,255,0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.globalAlpha = fade;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  };

  Starfield.prototype.loop = function (t) {
    if (!this.running) return;
    var dt = this.last ? Math.min(t - this.last, 50) : 16;
    this.last = t;
    this.draw(t, false);
    if (t > this.nextShoot) {
      this.spawnShoot();
      if (Math.random() < 0.25) this.spawnShoot(); // บางทีมาคู่
      this.nextShoot = t + rand(1800, 4800);
    }
    this.drawShoots(dt);
    this.raf = requestAnimationFrame(this._loop);
  };

  Starfield.prototype.start = function () {
    this.resize();
    if (this.calm) { this.draw(0, true); return; }
    if (this.running) return;
    this.running = true;
    this.last = 0;
    this.nextShoot = performance.now() + 900;
    this.raf = requestAnimationFrame(this._loop);
  };

  Starfield.prototype.stop = function () {
    this.running = false;
    cancelAnimationFrame(this.raf);
  };

  Starfield.prototype.setCalm = function (calm) {
    this.calm = calm;
    if (calm) { this.stop(); this.shoots = []; this.draw(0, true); }
  };

  window.Starfield = Starfield;
})();
