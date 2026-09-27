# LMDC Mela 2026 — lmdcmela.com

Official website for **LMDC Mela 2026** with Hasan Raheem — Sunday 18 October 2026,
Quaid-e-Azam Cricket Stadium, Khayaban-e-Amin, Lahore.

Built with Vite + vanilla JS, Three.js (hero embers), GSAP ScrollTrigger and Lenis.
Hosted on Vercel.

---

## ✏️ Editing content

**Almost everything lives in one file: [`src/config.js`](src/config.js).**

| What | Where in `src/config.js` |
|---|---|
| Gate time ("Timings announced soon") | `GATES_OPEN` at the top |
| Countdown target | `event.startISO` (Pakistan time, `+05:00`) |
| Ticket link / Instagram | `TICKET_URL`, `INSTAGRAM_URL` at the top |
| Ticket price tiers | `tiers` (leave `[]` for the single Ticketwala card) |
| Query contacts (call + WhatsApp) | `contacts` |
| FAQ questions & answers | `faq` |
| Headliner bio, tagline, hit songs | `headliner` |
| Attraction cards | `attractions` |
| Media partners | `partners` |
| Gallery photos | `gallery` |
| Footer marquee text | `marquee` |
| Hero music player songs | `playerTracks` (Spotify track URIs — see the comment there) |

The text is written into the HTML at build time, so the page loads fast, ranks well and
works even with JavaScript disabled. **You don't need to touch `index.html` to change content.**

### Images

| File | Purpose |
|---|---|
| `public/logo.png` | Phoenix logo (on black). Source for all favicons and logo WebPs |
| `public/hero-poster.jpg` | Hasan Raheem photo used in the Headliner section and mini-player |
| `public/og-image.jpg` | 1200×630 link-preview image for WhatsApp/Instagram — rebuild with `npm run og` |
| `public/images/gallery/*` | Gallery photos (portrait ~800×1000, JPG/WebP, < 250 KB each) |
| `public/images/partners/*` | Partner logos (transparent PNG/SVG, ~260×60) |

After replacing `logo.png` or `hero-poster.jpg`, run `npm run images` (and `npm run og` for the share image) (it also runs
automatically on every build). This regenerates the responsive WebP sizes in `public/img/`
and `favicon.ico`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`.

> Images under `/images/` and `/img/` are cached by browsers for a year. When you replace
> a gallery or partner image, **give it a new file name** and update `src/config.js`.

---

## 💻 Run locally

Requires Node.js 20+.

```bash
npm install
npm run dev        # http://localhost:5173 (auto-reloads when you edit config.js)
npm run build      # optimise images + production build into dist/
npm run preview    # serve the production build at http://localhost:4173
```

## 🚀 Deploy (Vercel)

The project is connected to Vercel through GitHub: **every `git push` to `main` deploys
to production automatically**, and every other branch/PR gets its own preview URL.

```bash
git add -A
git commit -m "Update gate time"
git push
```

Manual deploys from your machine (optional): `vercel` (preview) / `vercel --prod`.

Vercel settings (auto-detected, also pinned in `vercel.json`):
build command `npm run build`, output directory `dist`.

### Domains

- `lmdcmela.com` is the primary domain.
- **www → apex redirect:** in the Vercel dashboard → Project → Settings → Domains, set
  `www.lmdcmela.com` to *Redirect to* `lmdcmela.com` (308). This is not in `vercel.json`.

### Short links (from `vercel.json`)

| Link | Goes to |
|---|---|
| `lmdcmela.com/tickets` | Ticketwala event page — use in Instagram stories |
| `lmdcmela.com/insta` | Instagram @lmdcmela |

### Analytics

Vercel Web Analytics and Speed Insights are initialised in `src/main.js`. Enable them once in
the Vercel dashboard (Project → Analytics / Speed Insights → Enable).

---

## 🗂 Project structure

```
index.html              page template (content tokens filled from src/config.js)
404.html                custom 404 page
vite.config.js          multi-page build + config→HTML plugin
vercel.json             caching, security headers, redirects
scripts/
  optimize-images.js    WebP sizes + favicons (sharp)
  render-content.js     build-time HTML renderer
public/                 static files copied as-is (logo, poster, icons, robots, sitemap, images)
src/
  config.js             ✏️ all editable content
  main.js               entry: analytics, loader, interactions, lazy 3D
  ui.js                 loader, navbar, countdown, player, tilt, FAQ, cursor
  style.css             all styles
  three/embers.js       hero Three.js scene (lazy-loaded)
  animations/scroll.js  Lenis smooth scroll + GSAP ScrollTrigger
  effects/ambient.js    background embers + loader burst (2D canvas)
  generated/images.json written by optimize-images.js
```

## ⚡ Performance & accessibility notes

- Three.js is loaded with `import()` after the first interaction (or 4 s) and pauses when the
  hero is off-screen or the tab is hidden. Devices without GPU WebGL get a static glow.
- `prefers-reduced-motion`: no loader, no smooth scroll, no 3D, no scroll animations.
- Without JavaScript: all content, FAQ answers and links are visible; the loader never shows.
- Lighthouse (mobile, local build): Performance 93–94 · Accessibility 100 · Best Practices 96 · SEO 100.
