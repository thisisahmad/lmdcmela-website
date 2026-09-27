/* ==========================================================================
   Build-time HTML renderer (used by vite.config.js)
   --------------------------------------------------------------------------
   Fills index.html / 404.html from src/config.js so every word is in the
   static HTML (fast first paint, SEO, works with JavaScript disabled).

   Template syntax:
     {{event.dateLong}}                 → escaped text from config
     {{{headliner.bio}}}                → raw HTML from config
     <!--render:faq-->                  → a generated block (see BLOCKS below)
     <!--picture:logo {"class":"x"}-->  → responsive <picture> from images.json
   ========================================================================== */

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
const attr = (s) => esc(s).replace(/&amp;(\w+|#\d+);/g, '&$1;'); // keep entities already in config

/* ---------- Icons ---------- */
const ICONS = {
  stalls: '<path d="M6 18 10 8h28l4 10"/><path d="M6 18q4.5 5 9 0t9 0 9 0 9 0"/><path d="M9 21v19M39 21v19M5 40h38"/><path d="M16 40v-9h16v9"/>',
  gaming: '<path d="M14 16h20a8 8 0 0 1 7.8 6.2l2 9A5 5 0 0 1 35 35l-4-4H17l-4 4a5 5 0 0 1-8.8-3.8l2-9A8 8 0 0 1 14 16z"/><path d="M15 21v7M11.5 24.5h7"/><circle cx="31" cy="22.5" r="1.4"/><circle cx="35" cy="26.5" r="1.4"/>',
  market: '<path d="M10 16h28l-2 25H12z"/><path d="M18 20v-7a6 6 0 0 1 12 0v7"/><path d="M24 26v8M20 30h8"/>',
  food: '<path d="M6 24h36a18 15 0 0 1-36 0z"/><path d="M18 40h12"/><path d="M17 18c-2-3 2-5 0-8M24 18c-2-3 2-5 0-8M31 18c-2-3 2-5 0-8"/>',
};
const PHONE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>';
const WHATSAPP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/></svg>';

/* ---------- Derived URLs ---------- */
function calendarUrl(c) {
  const fmt = (iso) => new Date(iso).toISOString().replace(/[-:]|\.\d{3}/g, '');
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${c.event.name} — ${c.headliner.first} ${c.headliner.last}`,
    dates: `${fmt(c.event.startISO)}/${fmt(c.event.endISO)}`,
    location: c.venue.full,
    details: `${c.headliner.tagline} Tickets: ${c.links.tickets}`,
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}
const directionsUrl = (c) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(c.venue.full)}`;
const mapEmbedUrl = (c) => `https://www.google.com/maps?q=${encodeURIComponent(c.venue.full)}&output=embed`;

/* ---------- Blocks ---------- */
const BLOCKS = {
  hits: (c) => c.headliner.hits.map((h) => `<li>${esc(h)}</li>`).join(''),

  attractions: (c) => c.attractions.map((a, i) => `
        <article class="card" data-tilt-host>
          <div class="card__inner" data-tilt="12">
            <span class="card__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
            <svg class="card__icon" viewBox="0 0 48 48" aria-hidden="true">${ICONS[a.icon] || ICONS.stalls}</svg>
            <h3>${esc(a.title)}</h3>
            <p>${a.text}</p>
          </div>
        </article>`).join(''),

  tiers: (c) => !c.tiers.length ? '' : `<div class="tiers" data-stagger>${c.tiers.map((t) => `
        <div class="tier${t.featured ? ' tier--featured' : ''}">
          <h3 class="tier__name">${esc(t.name)}</h3>
          <p class="tier__price">${esc(t.price)}</p>
          <ul class="tier__perks">${(t.perks || []).map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
          <a class="btn-fire btn-fire--sm" href="${attr(c.links.tickets)}" target="_blank" rel="noopener">Book ${esc(t.name)}</a>
        </div>`).join('')}</div>`,

  contacts: (c) => c.contacts.map((p) => `
        <div class="contact-card">
          <h3>${esc(p.name)}</h3>
          <p class="contact-card__role">Queries</p>
          <a class="contact-card__num" href="tel:${attr(p.tel)}">${esc(p.display)}</a>
          <div class="contact-card__btns">
            <a class="btn-fire" href="tel:${attr(p.tel)}" aria-label="Call ${esc(p.name)}">${PHONE} Call</a>
            <a class="btn-ghost" href="${attr(p.whatsapp)}" target="_blank" rel="noopener" aria-label="WhatsApp ${esc(p.name)}">${WHATSAPP} WhatsApp</a>
          </div>
        </div>`).join(''),

  faq: (c) => c.faq.map((f, i) => `
        <div class="faq__item">
          <h3 class="faq__h">
            <button class="faq__q" id="faq-q-${i}" aria-expanded="false" aria-controls="faq-a-${i}">${esc(f.q)}<i aria-hidden="true"></i></button>
          </h3>
          <div class="faq__a" id="faq-a-${i}" role="region" aria-labelledby="faq-q-${i}"><div><p>${f.a}</p></div></div>
        </div>`).join(''),

  partners: (c) => c.partners.map((p, i) => `${i ? '<span class="partners__dot" aria-hidden="true"></span>' : ''}
          <div class="partner">${p.logo
            ? `<img src="${attr(p.logo)}" alt="${esc(p.name)}" loading="lazy" decoding="async" width="260" height="60" />`
            : `<span class="partner__name">${esc(p.name)}</span>`}</div>`).join(''),

  gallery: (c) => c.gallery.map((g) => `
          <figure class="gallery__item"><img src="${attr(g.src)}" alt="${esc(g.alt)}" loading="lazy" decoding="async" width="800" height="1000" /><figcaption>${esc(g.caption)}</figcaption></figure>`).join(''),

  marquee: (c) => Array.from({ length: 4 }, () => `<span>${esc(c.marquee)}&nbsp;</span>`).join(''),

  calendarUrl: (c) => attr(calendarUrl(c)),
  directionsUrl: (c) => attr(directionsUrl(c)),
  mapEmbedUrl: (c) => attr(mapEmbedUrl(c)),

  jsonld: (c) => `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'MusicEvent',
    name: c.event.name,
    description: c.headliner.tagline,
    startDate: c.event.startISO,
    endDate: c.event.endISO,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    image: [`${c.site.url}/og-image.jpg`, `${c.site.url}/hero-poster.jpg`],
    url: c.site.url,
    location: {
      '@type': 'Place',
      name: c.venue.name,
      address: { '@type': 'PostalAddress', streetAddress: c.venue.area, addressLocality: c.venue.city, addressRegion: 'Punjab', addressCountry: 'PK' },
    },
    performer: { '@type': 'Person', name: `${c.headliner.first} ${c.headliner.last}` },
    organizer: { '@type': 'Organization', name: c.site.name, url: c.site.url },
    offers: { '@type': 'Offer', url: c.links.tickets, availability: 'https://schema.org/InStock' },
  })}</script>`,
};

/* ---------- Responsive <picture> ---------- */
function picture(key, opts, images) {
  const img = images?.[key];
  const fallback = opts.src || img?.fallback || `/${key}.png`;
  const w = opts.width || img?.width || '';
  const h = opts.height || (img && opts.width ? Math.round((img.height / img.width) * opts.width) : img?.height) || '';
  const a = [
    `src="${fallback}"`,
    `alt="${esc(opts.alt || '')}"`,
    opts.class ? `class="${opts.class}"` : '',
    w ? `width="${w}"` : '', h ? `height="${h}"` : '',
    `loading="${opts.eager ? 'eager' : 'lazy'}"`,
    'decoding="async"',
    opts.priority ? 'fetchpriority="high"' : '',
  ].filter(Boolean).join(' ');
  if (!img?.variants?.length) return `<img ${a} />`;
  const srcset = img.variants.map((v) => `${v.file} ${v.w}w`).join(', ');
  return `<picture><source type="image/webp" srcset="${srcset}" sizes="${opts.sizes || '100vw'}" /><img ${a} /></picture>`;
}

/* ---------- Main ---------- */
export function renderHtml(html, config, images) {
  return html
    .replace(/<!--picture:(\w+)\s*(\{.*?\})?\s*-->/g, (_, key, json) => picture(key, json ? JSON.parse(json) : {}, images))
    .replace(/<!--render:(\w+)-->/g, (m, name) => (BLOCKS[name] ? BLOCKS[name](config) : m))
    .replace(/\{\{\{\s*([\w.]+)\s*\}\}\}/g, (_, p) => String(get(config, p) ?? ''))
    .replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, p) => attr(get(config, p)));
}
