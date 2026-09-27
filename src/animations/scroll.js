/* ==========================================================================
   Smooth scrolling (Lenis) + scroll-driven animations (GSAP ScrollTrigger)
   Everything here is skipped when the user prefers reduced motion.
   ========================================================================== */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const $$ = (s, root = document) => [...root.querySelectorAll(s)];

/** Lenis smooth scroll driven by GSAP's ticker so both stay in sync. */
export function initSmoothScroll() {
  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

/** Hero entrance — short and light (~1 s). Large text never starts at opacity 0 (keeps LCP early). */
export function buildHeroIntro() {
  return gsap.timeline({ paused: true, defaults: { ease: 'power3.out', duration: 0.7 } })
    .from('.hero__photo img', { xPercent: 3, scale: 1.04, duration: 1 }, 0)
    .from('.hero__logo', { y: -18 }, 0)
    .from('.hero__eyebrow', { y: 12, opacity: 0 }, 0.05)
    .from('.hero__hasan > span[aria-hidden]', { yPercent: 22, stagger: 0.03, duration: 0.6 }, 0.05)
    .from('.hero__raheem', { yPercent: 22, duration: 0.6 }, 0.12)
    .from(['.player', '.hero__meta', '.hero__cta'], { y: 14, opacity: 0, stagger: 0.06, duration: 0.6 }, 0.18)
    .from('.hero__scroll', { opacity: 0, duration: 0.5 }, 0.45);
}

export function initScrollAnimations() {
  // Single elements rise in
  $$('[data-reveal]').forEach((el) => {
    gsap.from(el, {
      y: 44, opacity: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });

  // Groups stagger their children in
  $$('[data-stagger]').forEach((group) => {
    gsap.from(group.children, {
      y: 60, opacity: 0, rotateX: -12, transformPerspective: 900,
      duration: 0.95, ease: 'power3.out', stagger: 0.11,
      scrollTrigger: { trigger: group, start: 'top 88%', once: true },
    });
  });

  // Flip cards pop in
  gsap.from('.flip__card', {
    scale: 0.8, rotateX: 40, opacity: 0, duration: 0.9, stagger: 0.09, ease: 'back.out(1.6)',
    scrollTrigger: { trigger: '.countdown', start: 'top 82%', once: true },
  });

  // Poster parallax inside its frame
  gsap.fromTo('.poster img', { yPercent: -8 }, {
    yPercent: 0, ease: 'none',
    scrollTrigger: { trigger: '.headliner', start: 'top bottom', end: 'bottom top', scrub: true },
  });

  // Hero photo drifts slower than the page (depth)
  gsap.to('.hero__photo img', {
    yPercent: 10, scale: 1.06, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });

  // Hero title drifts up and dims as you leave
  gsap.to('.hero__hasan', {
    yPercent: -22, opacity: 0.25, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
}

/** Gallery: vertical scroll drives the strip sideways (pinned section). */
export function initGallery() {
  const section = document.getElementById('gallery');
  const track = document.getElementById('galleryTrack');
  if (!section || !track) return;
  if (track.scrollWidth <= innerWidth) return; // everything already fits — no need to pin
  section.classList.add('is-pinned');
  const distance = () => Math.max(0, track.scrollWidth - innerWidth);
  gsap.to(track, {
    x: () => -distance(),
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => `+=${distance()}`,
      pin: true,
      scrub: 0.8,
      invalidateOnRefresh: true,
      anticipatePin: 1,
    },
  });
  $$('img', track).forEach((img) => img.addEventListener('load', () => ScrollTrigger.refresh(), { once: true }));
}

export const refreshScroll = () => ScrollTrigger.refresh();
