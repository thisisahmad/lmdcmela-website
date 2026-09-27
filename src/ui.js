/* ==========================================================================
   Interface pieces: loader, navbar, anchors, countdown, player, tilt, FAQ,
   custom cursor. Each is independent and safe to skip.
   ========================================================================== */
import { emberBurst } from './effects/ambient.js';

export const $ = (s, root = document) => root.querySelector(s);
export const $$ = (s, root = document) => [...root.querySelectorAll(s)];

/* ---------- 1. Loader: fade in → ignite + burst → slide away (≤ 2 s) ---------- */
export function runLoader({ skip, isMobile, onExit }) {
  const loader = $('#loader');
  const done = () => {
    document.body.classList.remove('is-loading');
    try { sessionStorage.setItem('lmdc-intro', '1'); } catch (e) { /* private mode */ }
    onExit();
  };
  if (!loader || skip) {
    loader?.remove();
    return done();
  }
  document.body.classList.add('is-loading');
  const start = performance.now();
  let loaded = document.readyState === 'complete';
  addEventListener('load', () => (loaded = true), { once: true });

  requestAnimationFrame(() => loader.classList.add('is-in'));
  setTimeout(() => {
    loader.classList.add('is-ignited');
    emberBurst($('#loaderBurst'), { isMobile });
  }, 350);

  // Leave after 0.9 s if the page has loaded, and never later than 1.2 s (+0.6 s slide < 2 s)
  const tryExit = () => {
    const t = performance.now() - start;
    if ((loaded && t > 900) || t > 1200) {
      loader.classList.add('is-out');
      done();
      setTimeout(() => loader.remove(), 700);
    } else setTimeout(tryExit, 50);
  };
  setTimeout(tryExit, 900);
}

/* ---------- Split HASAN into letters for the intro ---------- */
export function splitHeadline() {
  const el = $('[data-split]');
  if (!el) return;
  const text = el.textContent.trim();
  el.innerHTML = `<span class="sr-only">${text}</span>${[...text].map((ch) => `<span aria-hidden="true">${ch}</span>`).join('')}`;
  el.classList.add('is-split');
}

/* ---------- Pause decorative CSS loops in sections that are off-screen ---------- */
export function pauseOffscreen() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => en.target.classList.toggle('is-offscreen', !en.isIntersecting));
  }, { rootMargin: '100px 0px' });
  $$('main > section, footer').forEach((s) => io.observe(s));
}

/* ---------- Navbar: glass on scroll, active link, mobile menu ---------- */
export function initNav(lenisRef) {
  const nav = $('#nav');
  const burger = $('#burger');
  const menu = $('#mobileMenu');
  const update = () => nav.classList.toggle('is-scrolled', scrollY > 40);
  update();
  addEventListener('scroll', update, { passive: true });

  const links = $$('.nav__links a');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((l) => {
        const active = l.getAttribute('href') === `#${en.target.id}`;
        l.classList.toggle('is-active', active);
        if (active) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach((s) => io.observe(s));

  // The menu uses a clip-path reveal, so it stays in the DOM but is made inert when closed
  menu.hidden = false;
  menu.inert = true;
  const open = () => {
    document.body.classList.add('menu-open');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Close menu');
    menu.inert = false;
    lenisRef.current?.stop();
    $('a', menu)?.focus({ preventScroll: true });
  };
  const close = () => {
    if (!document.body.classList.contains('menu-open')) return;
    document.body.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    menu.inert = true;
    lenisRef.current?.start();
  };
  burger.addEventListener('click', () => (document.body.classList.contains('menu-open') ? close() : open()));
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { close(); burger.focus(); }
  });
  return { close };
}

/* ---------- Anchor links: smooth scroll with navbar offset ---------- */
export function initAnchors(lenisRef, closeMenu, reduced) {
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id === '#top' ? 0 : $(id);
      if (target == null) return;
      e.preventDefault();
      closeMenu();
      const offset = target === 0 ? 0 : -$('#nav').offsetHeight + 1;
      if (lenisRef.current) lenisRef.current.scrollTo(target, { offset, duration: 1.4 });
      else {
        const top = target === 0 ? 0 : target.getBoundingClientRect().top + scrollY + offset;
        scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
      }
      if (target !== 0 && id !== '#main') {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    });
  });
}

/* ---------- 3. Countdown with flip digits ---------- */
export function initCountdown({ startISO, reduced }) {
  const target = new Date(startISO).getTime();
  const grid = $('#countdownGrid');
  const live = $('#countdownLive');
  if (!grid) return;
  const units = Object.fromEntries($$('.flip', grid).map((el) => [el.dataset.unit, el]));

  const setFlip = (el, val) => {
    if (el.dataset.v === val) return;
    const old = el.dataset.v;
    el.dataset.v = val;
    const card = $('.flip__card', el);
    const [top, bottom, flapT, flapB] = card.children;
    if (reduced || old === undefined) {
      top.textContent = bottom.textContent = flapT.textContent = flapB.textContent = val;
      return;
    }
    top.textContent = val;    // new value waits behind the falling top flap
    bottom.textContent = old; // old bottom half stays until the lower flap lands
    flapT.textContent = old;
    flapB.textContent = val;
    card.classList.remove('is-flipping');
    void card.offsetWidth;    // restart the CSS animation
    card.classList.add('is-flipping');
    clearTimeout(el._t);
    el._t = setTimeout(() => {
      bottom.textContent = val;
      card.classList.remove('is-flipping');
    }, 620);
  };

  const pad = (n) => String(n).padStart(2, '0');
  const tick = () => {
    const diff = target - Date.now();
    if (diff <= 0) {
      grid.hidden = true;
      live.hidden = false;
      return;
    }
    const s = Math.floor(diff / 1000);
    setFlip(units.days, pad(Math.floor(s / 86400)));
    setFlip(units.hours, pad(Math.floor((s % 86400) / 3600)));
    setFlip(units.minutes, pad(Math.floor((s % 3600) / 60)));
    setFlip(units.seconds, pad(s % 60));
    setTimeout(tick, 1000 - (Date.now() % 1000) + 5); // align to the second
  };
  tick();
}

/* ---------- Mini music player (decorative) ---------- */
export function initPlayer({ tracks, reduced }) {
  const player = $('#player');
  if (!player) return;
  const fill = $('#playerFill'), now = $('#playerNow'), dur = $('#playerDur'), title = $('#playerTrack');
  const durations = [225, 198, 172, 214];
  let i = 0, elapsed = 42, playing = !reduced;
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const length = () => durations[i % durations.length];
  const render = () => {
    fill.style.width = `${(elapsed / length()) * 100}%`;
    now.textContent = fmt(elapsed);
    dur.textContent = fmt(length());
    title.textContent = tracks[i];
  };
  const go = (step) => {
    i = (i + step + tracks.length) % tracks.length;
    elapsed = 0;
    fill.style.transition = 'none';
    render();
    void fill.offsetWidth;
    fill.style.transition = '';
  };
  player.classList.toggle('is-paused', !playing);
  $('#playerPlay').setAttribute('aria-label', playing ? 'Pause' : 'Play');
  render();
  setInterval(() => {
    if (!playing || document.hidden) return;
    elapsed += 1;
    if (elapsed > length()) go(1); else render();
  }, 1000);
  $('#playerPlay').addEventListener('click', (e) => {
    playing = !playing;
    player.classList.toggle('is-paused', !playing);
    e.currentTarget.setAttribute('aria-label', playing ? 'Pause' : 'Play');
  });
  $('#playerPrev').addEventListener('click', () => go(-1));
  $('#playerNext').addEventListener('click', () => go(1));
}

/* ---------- 3D tilt (poster + cards), mouse and touch ---------- */
export function initTilt() {
  $$('[data-tilt-host]').forEach((host) => {
    const el = $('[data-tilt]', host);
    if (!el) return;
    const max = parseFloat(el.dataset.tilt) || 10;
    const move = (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.classList.add('is-tilting');
      el.style.setProperty('--rx', `${((0.5 - py) * max).toFixed(2)}deg`);
      el.style.setProperty('--ry', `${((px - 0.5) * max).toFixed(2)}deg`);
      el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
      el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
    };
    const reset = () => {
      el.classList.remove('is-tilting');
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    };
    host.addEventListener('pointermove', move);
    host.addEventListener('pointerdown', move);
    host.addEventListener('pointerleave', reset);
    host.addEventListener('pointercancel', reset);
    host.addEventListener('pointerup', (e) => e.pointerType !== 'mouse' && reset());
  });
}

/* ---------- 9. FAQ accordion (one open at a time) ---------- */
export function initFaq(onToggle) {
  const items = $$('.faq__item');
  items.forEach((item) => {
    const btn = $('.faq__q', item);
    btn.addEventListener('click', () => {
      const open = !item.classList.contains('is-open');
      items.forEach((other) => {
        other.classList.remove('is-open');
        $('.faq__q', other).setAttribute('aria-expanded', 'false');
      });
      item.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      setTimeout(onToggle, 550);
    });
  });
}

/* ---------- Ember cursor (desktop with a fine pointer only) ---------- */
export function initCursor() {
  const dot = document.createElement('div');
  const ring = document.createElement('div');
  dot.className = 'cursor-dot';
  ring.className = 'cursor-ring';
  dot.setAttribute('aria-hidden', 'true');
  ring.setAttribute('aria-hidden', 'true');
  document.body.append(ring, dot);
  document.body.classList.add('has-cursor');

  const m = { x: innerWidth / 2, y: innerHeight / 2 };
  const r = { ...m };
  addEventListener('pointermove', (e) => { m.x = e.clientX; m.y = e.clientY; }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { dot.style.opacity = ring.style.opacity = '0'; });
  document.documentElement.addEventListener('pointerenter', () => { dot.style.opacity = ring.style.opacity = '1'; });
  (function follow() {
    r.x += (m.x - r.x) * 0.18;
    r.y += (m.y - r.y) * 0.18;
    dot.style.transform = `translate3d(${m.x}px, ${m.y}px, 0)`;
    ring.style.transform = `translate3d(${r.x}px, ${r.y}px, 0)`;
    requestAnimationFrame(follow);
  })();

  const hoverables = 'a, button, [data-tilt], .gallery__item';
  document.addEventListener('pointerover', (e) => e.target.closest?.(hoverables) && ring.classList.add('is-hover'));
  document.addEventListener('pointerout', (e) => e.target.closest?.(hoverables) && ring.classList.remove('is-hover'));
}
