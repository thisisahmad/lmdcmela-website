/* ==========================================================================
   Ambient embers — a very light 2D canvas that drifts behind every section.
   Runs only while the hero (with its 3D scene) is off-screen.
   ========================================================================== */
const PALETTE = ['#FF6B1A', '#FFA630', '#FFC857', '#E63A12', '#FF8A3D'];

/** One pre-rendered glow sprite per colour (far cheaper than shadowBlur). */
function makeSprites() {
  return PALETTE.map((col) => {
    const s = document.createElement('canvas');
    s.width = s.height = 64;
    const g = s.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, '#fff6e0');
    grad.addColorStop(0.15, col);
    grad.addColorStop(0.45, `${col}55`);
    grad.addColorStop(1, `${col}00`);
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return s;
  });
}

export function createAmbient(canvas, { isMobile }) {
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const N = isMobile ? 24 : 48;
  let w = 0, h = 0;

  const sprites = makeSprites();

  const spawn = (p, anywhere) => Object.assign(p, {
    x: Math.random() * w,
    y: anywhere ? Math.random() * h : h + 20 * dpr,
    r: (4 + Math.random() * 10) * dpr,
    vy: (0.25 + Math.random() * 0.6) * dpr,
    ph: Math.random() * Math.PI * 2,
    a: 0.25 + Math.random() * 0.5,
    s: sprites[(Math.random() * sprites.length) | 0],
  });
  const resize = () => {
    w = canvas.width = innerWidth * dpr;
    h = canvas.height = innerHeight * dpr;
  };
  resize();
  addEventListener('resize', resize);
  const parts = Array.from({ length: N }, () => spawn({}, true));

  let rafId = 0, t = 0, running = false;
  const frame = () => {
    rafId = requestAnimationFrame(frame);
    t += 0.016;
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    for (const p of parts) {
      p.y -= p.vy;
      p.x += Math.sin(t * 0.8 + p.ph) * 0.35 * dpr;
      if (p.y < -30) spawn(p, false);
      const fade = Math.min(1, p.y / (h * 0.25)); // fade out near the top
      ctx.globalAlpha = p.a * fade * (0.7 + 0.3 * Math.sin(t * 3 + p.ph));
      ctx.drawImage(p.s, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }
  };

  return {
    setActive(on) {
      canvas.classList.toggle('is-on', on);
      if (on === running) return;
      running = on;
      if (on) frame(); else cancelAnimationFrame(rafId);
    },
  };
}

/** One-shot burst of embers flying out from the centre (used by the loader). */
export function emberBurst(canvas, { isMobile }) {
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = (canvas.width = innerWidth * dpr);
  const h = (canvas.height = innerHeight * dpr);
  const sprites = makeSprites();
  const parts = Array.from({ length: isMobile ? 60 : 110 }, () => {
    const a = Math.random() * Math.PI * 2;
    const s = (2 + Math.random() * 9) * dpr;
    return {
      x: w / 2, y: h / 2,
      vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1.5 * dpr,
      r: (0.8 + Math.random() * 2.4) * dpr,
      life: 1, decay: 0.012 + Math.random() * 0.02,
      s: sprites[(Math.random() * sprites.length) | 0],
    };
  });
  (function frame() {
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    let alive = 0;
    for (const p of parts) {
      if (p.life <= 0) continue;
      alive++;
      p.x += p.vx; p.y += p.vy;
      p.vx *= 0.965; p.vy = p.vy * 0.965 - 0.04 * dpr;
      p.life -= p.decay;
      ctx.globalAlpha = Math.max(p.life, 0);
      const d = p.r * 6;
      ctx.drawImage(p.s, p.x - d / 2, p.y - d / 2, d, d);
    }
    if (alive) requestAnimationFrame(frame);
  })();
}
