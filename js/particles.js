/* js/particles.js — Subtle ambient particles for premium dark UI */
(function () {
  var canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W, H, particles = [];

  /* Very muted palette — matches the minimal design */
  var COLORS = ['#6d56fa', '#00c896', '#a78bfa', '#38bdf8'];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function Particle() { this.reset(true); }

  Particle.prototype.reset = function (init) {
    this.x    = Math.random() * W;
    this.y    = init ? Math.random() * H : H + 6;
    this.r    = 0.8 + Math.random() * 1.4;
    this.vx   = (Math.random() - 0.5) * 0.15;
    this.vy   = -(0.06 + Math.random() * 0.14);
    this.life   = 0;
    this.maxLife = 300 + Math.random() * 400;
    this.color  = COLORS[Math.floor(Math.random() * COLORS.length)];
  };

  function init() {
    resize();
    for (var i = 0; i < 40; i++) { particles.push(new Particle()); }
    loop();
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.x += p.vx; p.y += p.vy; p.life++;
      var t = p.life / p.maxLife;
      var alpha = t < 0.2 ? t / 0.2 : t > 0.8 ? (1 - t) / 0.2 : 1;
      ctx.save();
      ctx.globalAlpha = alpha * 0.45;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 4;
      ctx.shadowColor = p.color;
      ctx.fill();
      ctx.restore();
      if (p.life >= p.maxLife || p.y < -6) p.reset(false);
    }
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', resize);
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
