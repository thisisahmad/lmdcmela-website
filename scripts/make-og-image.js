/* ==========================================================================
   Social share image — run manually with `npm run og` after changing the poster.
   --------------------------------------------------------------------------
   Builds public/og-image.jpg (1200×630, the size WhatsApp / Instagram /
   Facebook / X previews expect) from public/hero-poster.jpg + the trimmed logo.
   Not part of `npm run build` on purpose: text is rendered with this machine's
   fonts, so the committed image stays identical on every deploy.
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const W = 1200, H = 630;
const PHOTO_W = 520; // photo panel on the right

const poster = path.join(PUBLIC, 'hero-poster.jpg');
const logo = path.join(PUBLIC, 'img', 'logo.png'); // trimmed logo from optimize-images.js
if (!fs.existsSync(poster)) throw new Error('public/hero-poster.jpg not found');

const photo = await sharp(poster).resize(PHOTO_W, H, { fit: 'cover', position: 'attention' }).toBuffer();
const logoBuf = fs.existsSync(logo) ? await sharp(logo).resize({ width: 150 }).toBuffer() : null;

const overlay = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="fade" x1="0" x2="1">
      <stop offset="0" stop-color="#0A0A0A"/>
      <stop offset="0.5" stop-color="#0A0A0A" stop-opacity="0.85"/>
      <stop offset="1" stop-color="#0A0A0A" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.25" cy="1.05" r="0.75">
      <stop offset="0" stop-color="#E63A12" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#E63A12" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="fire" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFE7B0"/>
      <stop offset="0.3" stop-color="#FFC857"/>
      <stop offset="0.65" stop-color="#FF6B1A"/>
      <stop offset="1" stop-color="#E63A12"/>
    </linearGradient>
  </defs>
  <rect x="${W - PHOTO_W - 1}" y="0" width="260" height="${H}" fill="url(#fade)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <text x="72" y="215" font-family="Georgia, serif" font-size="22" letter-spacing="9" fill="#FFA630">LMDC MELA 2026 PRESENTS</text>
  <text x="66" y="345" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="136" fill="url(#fire)">HASAN</text>
  <text x="74" y="405" font-family="Georgia, serif" font-size="44" letter-spacing="30" fill="#FF6B1A">RAHEEM</text>
  <rect x="72" y="448" width="64" height="3" fill="#FF6B1A"/>
  <text x="72" y="495" font-family="Arial, sans-serif" font-weight="700" font-size="26" letter-spacing="3" fill="#FFC857">SUN · 18 OCT 2026</text>
  <text x="72" y="532" font-family="Arial, sans-serif" font-weight="700" font-size="21" letter-spacing="2" fill="#F5F0E8">QUAID-E-AZAM CRICKET STADIUM, LAHORE</text>
  <text x="72" y="580" font-family="Arial, sans-serif" font-size="20" letter-spacing="1" fill="#F5F0E8" fill-opacity="0.7">Tickets → lmdcmela.com/tickets</text>
</svg>`);

const layers = [
  { input: photo, left: W - PHOTO_W, top: 0 },
  { input: overlay, left: 0, top: 0 },
];
if (logoBuf) layers.push({ input: logoBuf, left: 66, top: 52, blend: 'screen' });

await sharp({ create: { width: W, height: H, channels: 3, background: '#0A0A0A' } })
  .composite(layers)
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile(path.join(PUBLIC, 'og-image.jpg'));

console.log(`✓  public/og-image.jpg (${Math.round(fs.statSync(path.join(PUBLIC, 'og-image.jpg')).size / 1024)} KB)`);
