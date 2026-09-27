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

/** Hero entrance — played when the loader leaves. Large elements never start at opacity 0 (keeps LCP early). */
export function buildHeroIntro() {
  return gsap.timeline({ paused: true, defaults: { ease: 'power4.out' } })
    .from('.hero__photo img', { scale: 1.12, xPercent: 4, duration: 1.8, ease: 'power3.out' }, 0)
    .from('.hero__logo', { y: -50, scale: 0.6, duration: 1.2 }, 0)
    .from('.hero__eyebrow', { y: 16, opacity: 0, duration: 0.7 }, '-=0.9')
    .from('.hero__hasan > span[aria-hidden]', {
      yPercent: 60, rotateX: -75, duration: 1.1, stagger: 0.06,
      transformOrigin: '50% 100%', transformPerspective: 600,
    }, '-=0.8')
    .from('.hero__raheem', { scaleX: 0.6, filter: 'blur(10px)', duration: 1.2, ease: 'expo.out', clearProps: 'filter' }, '-=0.9')
    .from('.player', { y: 30, opacity: 0, duration: 0.9 }, '-=1')
    .from('.hero__meta', { y: 16, opacity: 0, duration: 0.7 }, '-=0.7')
    .from('.hero__cta', { y: 16, scale: 0.92, opacity: 0, duration: 0.7 }, '-=0.55')
    .from('.hero__scroll', { opacity: 0, duration: 0.7 }, '-=0.4');
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
