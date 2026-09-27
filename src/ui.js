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

/* ---------- Mini music player ----------
   Priority: self-hosted `src` files → official Spotify embed (`spotify` URIs) →
   decorative animation when neither is configured. */
export function initPlayer({ tracks: rawTracks, reduced }) {
  const player = $('#player');
  if (!player) return;
  const fill = $('#playerFill'), now = $('#playerNow'), dur = $('#playerDur'), title = $('#playerTrack');
  const bar = $('.player__bar', player), playBtn = $('#playerPlay');
  const fmt = (s) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00');
  const all = rawTracks.map((t) => (typeof t === 'string' ? { title: t } : t));
  const playable = all.filter((t) => t.src);
  const spotifyTracks = all.filter((t) => t.spotify);
  const setPlayingUI = (on) => {
    player.classList.toggle('is-paused', !on);
    playBtn.setAttribute('aria-label', `${on ? 'Pause' : 'Play'} ${title.textContent}`);
  };

  /* ----- Decorative mode (nothing to play) ----- */
  if (!playable.length && !spotifyTracks.length) {
    const durations = [225, 198, 172, 214];
    let i = 0, elapsed = 42, playing = !reduced;
    const length = () => durations[i % durations.length];
    const render = () => {
      fill.style.width = `${(elapsed / length()) * 100}%`;
      now.textContent = fmt(elapsed);
      dur.textContent = fmt(length());
      title.textContent = all[i].title;
    };
    const go = (step) => {
      i = (i + step + all.length) % all.length;
      elapsed = 0;
      fill.style.transition = 'none';
      render();
      void fill.offsetWidth;
      fill.style.transition = '';
    };
    render();
    setPlayingUI(playing);
    setInterval(() => {
      if (!playing || document.hidden) return;
      elapsed += 1;
      if (elapsed > length()) go(1); else render();
    }, 1000);
    playBtn.addEventListener('click', () => { playing = !playing; setPlayingUI(playing); });
    $('#playerPrev').addEventListener('click', () => go(-1));
    $('#playerNext').addEventListener('click', () => go(1));
    return;
  }

  /* ----- Spotify mode ----- */
  if (!playable.length) return initSpotifyPlayer({ player, tracks: spotifyTracks, fill, now, dur, title, bar, playBtn, fmt, setPlayingUI });

  /* ----- Audio mode ----- */
  const audio = new Audio();
  audio.preload = 'none'; // nothing downloads until the visitor presses play
  let i = 0;
  player.classList.add('is-audio');
  fill.style.transition = 'none';

  // Progress bar becomes a keyboard/touch-accessible seek slider
  bar.removeAttribute('aria-hidden');
  Object.entries({ role: 'slider', tabindex: '0', 'aria-label': 'Seek', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '0' })
    .forEach(([k, v]) => bar.setAttribute(k, v));

  const render = () => {
    const d = audio.duration;
    const pct = d ? (audio.currentTime / d) * 100 : 0;
    fill.style.width = `${pct}%`;
    now.textContent = fmt(audio.currentTime);
    dur.textContent = d ? fmt(d) : (playable[i].duration || '--:--');
    bar.setAttribute('aria-valuenow', String(Math.round(pct)));
    bar.setAttribute('aria-valuetext', `${fmt(audio.currentTime)} of ${fmt(d)}`);
  };
  const load = (idx, autoplay) => {
    i = (idx + playable.length) % playable.length;
    const t = playable[i];
    audio.src = t.src;
    title.textContent = t.title;
    render();
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: t.title,
        artist: 'Hasan Raheem',
        album: 'LMDC Mela 2026',
        artwork: [{ src: '/icon-512.png', sizes: '512x512', type: 'image/png' }],
      });
    }
    if (autoplay) audio.play().catch(() => setPlayingUI(false));
    else setPlayingUI(false);
  };
  const toggle = () => (audio.paused ? audio.play().catch(() => setPlayingUI(false)) : audio.pause());
  const prev = () => (audio.currentTime > 3 ? (audio.currentTime = 0) : load(i - 1, !audio.paused));
  const next = () => load(i + 1, !audio.paused || audio.ended);

  audio.addEventListener('play', () => setPlayingUI(true));
  audio.addEventListener('pause', () => setPlayingUI(false));
  audio.addEventListener('timeupdate', render);
  audio.addEventListener('loadedmetadata', render);
  audio.addEventListener('ended', () => load(i + 1, true)); // auto-advance through the playlist
  audio.addEventListener('error', () => { title.textContent = `${playable[i].title} (unavailable)`; setPlayingUI(false); });

  playBtn.addEventListener('click', toggle);
  $('#playerPrev').addEventListener('click', prev);
  $('#playerNext').addEventListener('click', next);

  const seekTo = (clientX) => {
    if (!audio.duration) return;
    const r = bar.getBoundingClientRect();
    audio.currentTime = Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * audio.duration;
  };
  bar.addEventListener('pointerdown', (e) => {
    seekTo(e.clientX);
    bar.setPointerCapture(e.pointerId);
    const move = (ev) => seekTo(ev.clientX);
    bar.addEventListener('pointermove', move);
    bar.addEventListener('pointerup', () => bar.removeEventListener('pointermove', move), { once: true });
  });
  bar.addEventListener('keydown', (e) => {
    if (!audio.duration) return;
    const step = { ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5 }[e.key];
    if (step) { e.preventDefault(); audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + step)); }
  });

  // Lock-screen / headphone controls on phones
  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', () => audio.play());
    navigator.mediaSession.setActionHandler('pause', () => audio.pause());
    navigator.mediaSession.setActionHandler('previoustrack', prev);
    navigator.mediaSession.setActionHandler('nexttrack', next);
  }

  load(0, false);
}

/* Spotify iFrame API — https://developer.spotify.com/documentation/embeds/references/iframe-api
   Our buttons drive the official embed, which opens (visible, as Spotify requires)
   under the controls on first play. The API script only loads when play is pressed. */
function initSpotifyPlayer({ player, tracks, fill, now, dur, title, bar, playBtn, fmt, setPlayingUI }) {
  let i = 0;
  let controller = null;
  let loading = false;
  let wantPlaying = false; // what the visitor asked for
  let state = { position: 0, duration: 0, isPaused: true };
  let retryTimer = 0;
  let pausedAt = 0; // when the visitor last pressed pause
  let endedUri = ''; // guards against advancing twice for the same song

  player.classList.add('is-spotify');
  const embed = document.createElement('div');
  embed.className = 'player__embed';
  const mount = document.createElement('div');
  embed.append(mount);
  const note = document.createElement('p');
  note.className = 'player__note';
  note.hidden = true;
  note.innerHTML = 'Full songs when logged in to <a href="https://open.spotify.com" target="_blank" rel="noopener">Spotify</a> · 30-sec previews otherwise';
  player.append(embed, note);

  bar.removeAttribute('aria-hidden');
  Object.entries({ role: 'slider', tabindex: '0', 'aria-label': 'Seek', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '0' })
    .forEach(([k, v]) => bar.setAttribute(k, v));

  const uri = () => tracks[i].spotify;
  const setBuffering = (on) => player.classList.toggle('is-buffering', on);

  // Warm up the connection to Spotify as soon as the visitor shows interest
  const warm = () => {
    ['https://open.spotify.com', 'https://embed-cdn.spotifycdn.com', 'https://p.scdn.co'].forEach((href) => {
      const l = document.createElement('link');
      l.rel = 'preconnect'; l.href = href; l.crossOrigin = '';
      document.head.append(l);
    });
  };
  ['pointerenter', 'touchstart', 'focusin'].forEach((ev) => player.addEventListener(ev, warm, { once: true, passive: true }));
  const render = () => {
    const pct = state.duration ? (state.position / state.duration) * 100 : 0;
    fill.style.width = `${Math.min(100, pct)}%`;
    now.textContent = fmt(state.position / 1000);
    dur.textContent = state.duration ? fmt(state.duration / 1000) : '--:--';
    bar.setAttribute('aria-valuenow', String(Math.round(pct)));
  };
  const show = (idx) => {
    i = (idx + tracks.length) % tracks.length;
    title.textContent = tracks[i].title;
    state = { position: 0, duration: 0, isPaused: true };
    render();
  };

  /* The embed can ignore commands sent while it is still starting up, so keep
     asking (resume() is safe to repeat) until Spotify reports playback, max ~30 s
     (slow mobile connections can take a while to load the embed). */
  const play = () => {
    wantPlaying = true;
    setPlayingUI(true);
    if (state.isPaused) setBuffering(true);
    clearInterval(retryTimer);
    if (!controller) return;
    let tries = 0;
    const attempt = () => {
      if (!wantPlaying || !state.isPaused) return clearInterval(retryTimer);
      if (++tries > 42) { clearInterval(retryTimer); wantPlaying = false; setPlayingUI(false); setBuffering(false); return; }
      controller.resume();
    };
    attempt();
    retryTimer = setInterval(attempt, 700);
  };
  const pause = () => {
    wantPlaying = false;
    setBuffering(false);
    pausedAt = Date.now();
    clearInterval(retryTimer);
    controller?.pause();
    setPlayingUI(false);
  };

  const onUpdate = ({ data }) => {
    if (data.playingURI && data.playingURI !== uri()) return; // stale update from the previous song
    const prev = state;
    state = { position: data.position, duration: data.duration, isPaused: data.isPaused };
    render();
    if (!data.isPaused) { clearInterval(retryTimer); setBuffering(false); }
    // Song finished (full track or 30-s preview): it reached the end, or stopped right at the end
    const atEnd = data.duration && data.position >= data.duration - 500;
    const stoppedAtEnd = data.isPaused && !prev.isPaused && prev.duration && prev.position >= prev.duration - 2500;
    const ended = atEnd || stoppedAtEnd;
    if (ended && wantPlaying && endedUri !== uri()) { endedUri = uri(); return go(1, true); }
    // Paused from Spotify's own button (or the OS media controls) — follow it
    if (data.isPaused && !prev.isPaused && !ended) { wantPlaying = false; clearInterval(retryTimer); }
    if (!data.isPaused && !wantPlaying) {
      // A retry that was already in flight started playback right after the visitor paused → undo it.
      // Otherwise playback was started from Spotify's own button → follow it.
      if (Date.now() - pausedAt < 4000) controller.pause(); else wantPlaying = true;
    }
    setPlayingUI(!data.isPaused || wantPlaying);
  };

  const createController = (IFrameAPI) => {
    IFrameAPI.createController(mount, { uri: uri(), width: '100%', height: 80 }, (ctrl) => {
      controller = ctrl;
      loading = false;
      ctrl.addListener('playback_update', onUpdate);
      ctrl.addListener('ready', () => { if (wantPlaying && state.isPaused) play(); });
      if (wantPlaying) setTimeout(play, 300); // 'ready' may already have fired
    });
  };

  const open = () => {
    if (controller || loading) return;
    loading = true;
    player.classList.add('is-embed-open');
    note.hidden = false;
    if (window.SpotifyIframeApi) return createController(window.SpotifyIframeApi);
    window.onSpotifyIframeApiReady = (IFrameAPI) => { window.SpotifyIframeApi = IFrameAPI; createController(IFrameAPI); };
    const script = document.createElement('script');
    script.src = 'https://open.spotify.com/embed/iframe-api/v1';
    script.async = true;
    script.onerror = () => { loading = false; wantPlaying = false; setPlayingUI(false); setBuffering(false); note.textContent = 'Spotify could not load — check your connection.'; };
    document.head.append(script);
  };

  const go = (step, autoplay) => {
    clearInterval(retryTimer);
    show(i + step);
    if (!controller) return;
    endedUri = '';
    controller.loadUri(uri());
    if (autoplay) setTimeout(play, 400);
    else { wantPlaying = false; setPlayingUI(false); }
  };

  playBtn.addEventListener('click', () => {
    if (!controller) { wantPlaying = true; setPlayingUI(true); setBuffering(true); open(); return; }
    if (wantPlaying) pause(); else play();
  });
  $('#playerPrev').addEventListener('click', () => {
    if (controller && state.position > 3000) return controller.seek(0);
    go(-1, wantPlaying);
  });
  $('#playerNext').addEventListener('click', () => go(1, wantPlaying));

  const seekTo = (clientX) => {
    if (!controller || !state.duration) return;
    const r = bar.getBoundingClientRect();
    controller.seek((Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * state.duration) / 1000);
  };
  bar.addEventListener('click', (e) => seekTo(e.clientX));
  bar.addEventListener('keydown', (e) => {
    if (!controller || !state.duration) return;
    const step = { ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5 }[e.key];
    if (step) { e.preventDefault(); controller.seek(Math.max(0, state.position / 1000 + step)); }
  });

  show(0);
  setPlayingUI(false);
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
