/* ==========================================================================
   Image optimizer — run with `npm run images` (also runs before every build)
   --------------------------------------------------------------------------
   Reads  public/logo.png, public/hero-poster.jpg and public/hero-artist.jpg, and writes:
     public/img/logo-*.webp, public/img/hero-poster-*.webp   (responsive sizes)
     public/favicon.ico (16/32/48), public/apple-touch-icon.png (180),
     public/icon-192.png, public/icon-512.png
     src/generated/images.json   (sizes used to build <picture> srcsets)
   Output names carry a content fingerprint (e.g. hero-artist-800.3f9a1c2e.webp):
   /img/* is cached for a year, so a changed photo must get a new URL, or
   visitors keep seeing the old one. Stale variants are deleted automatically.
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const OUT = path.join(PUBLIC, 'img');
const MANIFEST = path.join(ROOT, 'src', 'generated', 'images.json');

const SOURCES = {
  // `trim`: crop the empty black border so the phoenix fills its box (the file itself is untouched)
  logo: { file: 'logo.png', widths: [128, 256, 512], quality: 82, trim: true },
  poster: { file: 'hero-poster.jpg', widths: [480, 768, 1080, 1440], quality: 78 },
  hero: { file: 'hero-artist.jpg', widths: [480, 800, 1200], quality: 76 }, // hero photo (right side)
};

const force = process.argv.includes('--force');
const mtime = (f) => (fs.existsSync(f) ? fs.statSync(f).mtimeMs : 0);
/** 8-char fingerprint of the source file + its settings. */
const fingerprint = (file, cfg) => crypto.createHash('sha1').update(fs.readFileSync(file)).update(JSON.stringify(cfg)).digest('hex').slice(0, 8);
/** Delete generated files for `base` whose names are not in `keep`. */
function removeStale(base, keep) {
  const re = new RegExp(String.raw`^${base}(-\d+)?(\.[0-9a-f]{8})?\.(webp|png)$`);
  for (const f of fs.readdirSync(OUT)) {
    if (re.test(f) && !keep.has(f)) { fs.unlinkSync(path.join(OUT, f)); console.log(`✗  img/${f} (stale)`); }
  }
}

/** Build a .ico that embeds PNG images (supported by every modern browser). */
function buildIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  const dir = Buffer.alloc(16 * pngs.length);
  let offset = 6 + dir.length;
  pngs.forEach(({ size, buf }, i) => {
    const o = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, o);
    dir.writeUInt8(size >= 256 ? 0 : size, o + 1);
    dir.writeUInt8(0, o + 2);
    dir.writeUInt8(0, o + 3);
    dir.writeUInt16LE(1, o + 4);
    dir.writeUInt16LE(32, o + 6);
    dir.writeUInt32LE(buf.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += buf.length;
  });
  return Buffer.concat([header, dir, ...pngs.map((p) => p.buf)]);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
  const manifest = {};

  for (const [key, cfg] of Object.entries(SOURCES)) {
    const src = path.join(PUBLIC, cfg.file);
    if (!fs.existsSync(src)) {
      console.warn(`⚠  ${cfg.file} not found in /public — skipping (plain <img> fallback will be used).`);
      continue;
    }
    const base = path.basename(cfg.file, path.extname(cfg.file));
    const hash = fingerprint(src, cfg);
    const keep = new Set();
    // Work from a normalised copy: trimmed (logo) and always a real PNG, whatever the source format
    let input = src;
    let fallback = `/${cfg.file}`;
    if (cfg.trim) {
      const { data } = await sharp(src).trim({ threshold: 20 }).png().toBuffer({ resolveWithObject: true });
      const t = await sharp(data).metadata();
      const pad = Math.round(Math.max(t.width, t.height) * 0.04);
      input = await sharp(data).extend({ top: pad, bottom: pad, left: pad, right: pad, background: '#000' }).png().toBuffer();
      const fbName = `${base}.${hash}.png`;
      const fbOut = path.join(OUT, fbName);
      keep.add(fbName);
      if (force || !fs.existsSync(fbOut)) {
        await sharp(input).resize({ width: Math.max(...cfg.widths), withoutEnlargement: true }).png({ compressionLevel: 9 }).toFile(fbOut);
        console.log(`✓  img/${fbName} (trimmed fallback)`);
      }
      fallback = `/img/${fbName}`;
    }
    const meta = await sharp(input).metadata();
    const widths = cfg.widths.filter((w) => w <= meta.width).concat(meta.width < Math.max(...cfg.widths) ? [meta.width] : []);
    const variants = [];
    for (const w of [...new Set(widths)]) {
      const name = `${base}-${w}.${hash}.webp`;
      const out = path.join(OUT, name);
      keep.add(name);
      if (force || !fs.existsSync(out)) {
        await sharp(input).resize({ width: w }).webp({ quality: cfg.quality, effort: 5 }).toFile(out);
        console.log(`✓  img/${name}`);
      }
      variants.push({ w, file: `/img/${name}` });
    }
    removeStale(base, keep);
    manifest[key] = { width: meta.width, height: meta.height, fallback, variants };
  }

  // Favicons from the logo — trimmed so the phoenix fills the icon, on black.
  const logo = path.join(PUBLIC, 'logo.png');
  if (fs.existsSync(logo)) {
    const icoOut = path.join(PUBLIC, 'favicon.ico');
    if (force || mtime(icoOut) < mtime(logo)) {
      const trimmed = await sharp(logo).trim({ threshold: 20 }).toBuffer();
      const square = (size, pad = 0.06) => sharp(trimmed)
        .resize(Math.round(size * (1 - pad * 2)), Math.round(size * (1 - pad * 2)), { fit: 'contain', background: '#000' })
        .extend({ top: Math.round(size * pad), bottom: size - Math.round(size * (1 - pad * 2)) - Math.round(size * pad), left: Math.round(size * pad), right: size - Math.round(size * (1 - pad * 2)) - Math.round(size * pad), background: '#000' })
        .flatten({ background: '#000' })
        .png();
      await square(180, 0.1).toFile(path.join(PUBLIC, 'apple-touch-icon.png'));
      await square(192, 0.1).toFile(path.join(PUBLIC, 'icon-192.png'));
      await square(512, 0.1).toFile(path.join(PUBLIC, 'icon-512.png'));
      const pngs = [];
      for (const size of [16, 32, 48]) pngs.push({ size, buf: await square(size, 0.02).toBuffer() });
      fs.writeFileSync(icoOut, buildIco(pngs));
      console.log('✓  favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png');
    }
  }

  fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log('✓  src/generated/images.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
