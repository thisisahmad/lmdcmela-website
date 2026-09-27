/* ==========================================================================
   LMDC Mela 2026 — entry point
   Content comes from ./config.js (already written into the HTML at build
   time); this file only adds motion and interactivity on top.
   ========================================================================== */
import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';
import config from './config.js';
import {
  $, runLoader, splitHeadline, initNav, initAnchors, initCountdown,
  initPlayer, initTilt, initFaq, initCursor, pauseOffscreen,
} from './ui.js';
import {
  initSmoothScroll, buildHeroIntro, initScrollAnimations, initGallery, refreshScroll,
} from './animations/scroll.js';
import { createAmbient } from './effects/ambient.js';

/* ---------- Vercel Analytics + Speed Insights (no-ops locally) ---------- */
inject();
injectSpeedInsights();

/* ---------- Environment ---------- */
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = matchMedia('(max-width: 768px), (pointer: coarse)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const skipLoader = document.documentElement.classList.contains('skip-loader');
const lenisRef = { current: null };

/* ---------- Hero visibility drives both particle systems ---------- */
const hero = $('#hero');
const scenes = { hero: null, ambient: null };
let heroVisible = true;
const syncScenes = () => {
  const active = !document.hidden;
  scenes.hero?.setActive(active && heroVisible);
  scenes.ambient?.setActive(active && !heroVisible);
};
new IntersectionObserver(([en]) => { heroVisible = en.isIntersecting; syncScenes(); }).observe(hero);
document.addEventListener('visibilitychange', syncScenes);

/** True only for GPU-backed WebGL — software renderers (SwiftShader, llvmpipe) get the static fallback. */
function hasHardwareWebGL() {
  try {
    const gl = document.createElement('canvas').getContext('webgl');
    if (!gl) return false;
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : '';
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return !/swiftshader|llvmpipe|software|basic render/i.test(renderer);
  } catch (e) {
    return false;
  }
}

/** Three.js is ~130 KB gzipped, so it loads after first paint and only when useful. */
async function loadHeroScene() {
  const canvas = $('#heroCanvas');
  if (reduced || !hasHardwareWebGL()) return hero.classList.add('hero--static');
  try {
    const { createEmbers } = await import('./three/embers.js');
    scenes.hero = createEmbers({ canvas, hero, isMobile });
    syncScenes();
  } catch (err) {
    console.warn('Hero 3D scene unavailable:', err);
    hero.classList.add('hero--static');
  }
}

/* ---------- Boot ---------- */
splitHeadline();
const { close: closeMenu } = initNav(lenisRef);
initAnchors(lenisRef, closeMenu, reduced);
initCountdown({ startISO: config.event.startISO, reduced });
initPlayer({ tracks: config.playerTracks, reduced });
initFaq(refreshScroll);
pauseOffscreen();

let intro = null;
if (!reduced) {
  lenisRef.current = initSmoothScroll();
  initTilt();
  initGallery();
  initScrollAnimations();
  intro = buildHeroIntro();
  scenes.ambient = createAmbient($('#ambient'), { isMobile });
  if (finePointer) initCursor();
} else {
  hero.classList.add('hero--static');
}

if (!skipLoader) lenisRef.current?.stop();
runLoader({
  skip: skipLoader,
  isMobile,
  onExit() {
    lenisRef.current?.start();
    intro?.play();
    refreshScroll();
  },
});

// Start the 3D scene on the first interaction (or after 4 s) so it never competes
// with first paint — the CSS ember glow covers the hero until then.
let heroSceneQueued = false;
const startHeroScene = () => {
  if (heroSceneQueued) return;
  heroSceneQueued = true;
  INTERACTIONS.forEach((ev) => removeEventListener(ev, startHeroScene));
  loadHeroScene();
};
const INTERACTIONS = ['pointermove', 'pointerdown', 'touchstart', 'wheel', 'keydown', 'scroll'];
INTERACTIONS.forEach((ev) => addEventListener(ev, startHeroScene, { passive: true, once: true }));
setTimeout(startHeroScene, 4000);
syncScenes();
