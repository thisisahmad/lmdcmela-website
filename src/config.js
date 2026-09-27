/* ==========================================================================
   ✏️  LMDC Mela 2026 — ALL EDITABLE CONTENT LIVES HERE
   --------------------------------------------------------------------------
   Change anything below, then commit & push — Vercel rebuilds automatically.
   This file is read twice:
     1. at build time (vite.config.js) to write the text into the HTML, so the
        page is fully readable even with JavaScript disabled;
     2. in the browser (main.js) for the countdown and the mini-player.
   Plain strings only — HTML is allowed in `bio`, FAQ answers and attraction text.
   ========================================================================== */

// Gate time. Leave as null to show "Timings announced soon" everywhere.
// Example: const GATES_OPEN = '4:00 PM onwards';
const GATES_OPEN = null;
const GATES_TEXT = GATES_OPEN ?? 'Timings announced soon';

const TICKET_URL = 'https://ticketwala.pk/event/lmdc-mela-7661';
const INSTAGRAM_URL = 'https://www.instagram.com/lmdcmela/';

const config = {
  site: {
    url: 'https://lmdcmela.com',
    name: 'LMDC Mela',
  },

  event: {
    name: 'LMDC Mela 2026',
    // Countdown target, Pakistan time (UTC+5). Once the gate time is known,
    // change 00:00 to the gate time (e.g. 16:00) so the countdown lands on it.
    startISO: '2026-10-18T00:00:00+05:00',
    endISO: '2026-10-19T00:00:00+05:00', // used for "Add to Calendar"
    dateLong: 'Sunday, 18 October 2026',
    dateShort: '18 Oct 2026',
    dateTicket: '18.10.2026',
    gatesOpen: GATES_TEXT,
    liveMessage: 'The Mela is LIVE 🔥',
  },

  venue: {
    name: 'Quaid-e-Azam Cricket Stadium',
    area: 'Khayaban-e-Amin',
    city: 'Lahore',
    full: 'Quaid-e-Azam Cricket Stadium, Khayaban-e-Amin, Lahore',
  },

  links: {
    tickets: TICKET_URL,
    instagram: INSTAGRAM_URL,
    instagramHandle: '@lmdcmela',
    spotifyArtist: 'https://open.spotify.com/artist/6gIqKYKRmltKfkTnxhMv8V', // Hasan Raheem
  },

  headliner: {
    first: 'Hasan',
    last: 'Raheem',
    tagline: 'Hasan Raheem takes the stage at LMDC Mela, bringing his signature energy and unforgettable sound.',
    bio: 'Pakistani singer-songwriter — and a certified doctor — Hasan Raheem has become one of the defining voices of the new wave of Pakistani music. Blending silky R&amp;B with laid-back hip-hop grooves, he\'s behind the hits the whole country sings along to.',
    hits: ['Joona', 'Aarzu', 'Peechay Hutt', 'Sun Le Na'],
  },

  // `icon` must be one of: stalls, gaming, market, food
  attractions: [
    { icon: 'stalls', title: 'Stalls', text: 'Brand activations, student societies and pop-culture stalls lined up across the grounds.' },
    { icon: 'gaming', title: 'Gaming Zone', text: 'Consoles, tournaments and bragging rights. Bring your squad and claim the leaderboard.' },
    { icon: 'market', title: 'Pop-Up Market', text: 'Local labels, thrift finds, handmade jewellery and art — shop the city\'s best small brands.' },
    { icon: 'food', title: 'Food Street', text: 'Sizzling BBQ, desi classics, loaded fries and sweet treats. Come hungry, leave happy.' },
  ],

  // Ticket tiers. Leave [] to show only the single "Book on Ticketwala" card.
  // Example:
  // tiers: [
  //   { name: 'General', price: 'PKR 2,500', perks: ['Entry to all zones'] },
  //   { name: 'VIP', price: 'PKR 6,000', perks: ['Front-stage access', 'Fast-track entry'], featured: true },
  // ],
  tiers: [],

  contacts: [
    { name: 'Abubakr', display: '+92 318 7272692', tel: '+923187272692', whatsapp: 'https://wa.me/923187272692' },
    { name: 'Talha Sarfraz', display: '+92 307 1323555', tel: '+923071323555', whatsapp: 'https://wa.me/923071323555' },
  ],

  // Placeholder answers — edit freely.
  faq: [
    {
      q: 'How do I buy tickets?',
      a: `Tickets are sold online through <a href="${TICKET_URL}" target="_blank" rel="noopener">Ticketwala</a>. Pick your ticket, pay online and your e-ticket arrives by email/SMS — just show it at the gate. Short link: <a href="/tickets">lmdcmela.com/tickets</a>.`,
    },
    {
      q: 'Is there an age limit?',
      a: 'The Mela is open to all ages. Attendees under 16 should be accompanied by an adult. A valid ID or student card may be requested at entry.',
    },
    {
      q: 'Is parking available?',
      a: 'Yes — parking is available near Quaid-e-Azam Cricket Stadium on a first-come, first-served basis. We recommend carpooling or ride-hailing as spaces fill up fast.',
    },
    {
      q: 'Can I get a refund?',
      a: 'Tickets are non-refundable unless the event is cancelled or rescheduled. For ticket issues, contact Ticketwala support or reach our team using the numbers below.',
    },
    {
      q: 'What time do gates open?',
      a: `${GATES_TEXT} — follow <a href="${INSTAGRAM_URL}" target="_blank" rel="noopener">@lmdcmela</a> on Instagram for the latest updates.`,
    },
  ],

  // Put logo files in /public/images/partners/. Set `logo: null` to show the name as styled text.
  partners: [
    { name: 'Howl Crew Media', logo: '/images/partners/howl-crew-media.svg' },
    { name: 'MediaSnifters', logo: '/images/partners/mediasnifters.svg' },
  ],

  // Put photos in /public/images/gallery/ (portrait ~800×1000, JPG/WebP, < 250 KB).
  // Tip: when replacing a photo, give it a NEW file name — images are cached for a year.
  gallery: [
    { src: '/images/gallery/hasan-raheem-live.webp', alt: 'Hasan Raheem singing live on stage', caption: 'Live on Stage' },
    { src: '/images/gallery/hasan-raheem-smile.webp', alt: 'Hasan Raheem smiling on stage, hand on his heart', caption: 'All Heart' },
    { src: '/images/gallery/hasan-raheem-red.webp', alt: 'Hasan Raheem seated on a wooden chair against a red backdrop', caption: 'Red Room' },
    { src: '/images/gallery/hasan-raheem-mono.webp', alt: 'Black and white photo of Hasan Raheem singing with both hands on the mic', caption: 'Lost in the Song' },
    { src: '/images/gallery/hasan-raheem-studio.webp', alt: 'Hasan Raheem in profile wearing a black and cream leather jacket', caption: 'The Headliner' },
    { src: '/images/gallery/hasan-raheem-stage.webp', alt: 'Hasan Raheem performing under teal and red stage lights', caption: 'Crowd Control' },
    { src: '/images/gallery/hasan-raheem-studio-2.webp', alt: 'Hasan Raheem seated on a block in a studio, silver sneakers', caption: 'Studio Session' },
  ],

  marquee: 'LMDC MELA • HASAN RAHEEM • 18 OCT 2026 • KHAYABAN-E-AMIN •',

  // Hero mini-player playlist — plays through the official Spotify embed.
  // `spotify`: the track's Spotify URI. To get it: open the song on Spotify →
  //   Share → Copy Song Link → take the ID after /track/ → 'spotify:track:<ID>'.
  // Visitors logged in to Spotify hear full songs; everyone else hears 30-second previews.
  // (Advanced: `src: '/audio/file.mp3'` plays a self-hosted file instead — only for
  //  songs you hold a licence for. Audio files are git-ignored so they never reach GitHub.)
  playerTracks: [
    { title: 'Joona', spotify: 'spotify:track:18twglRl0wFIIMtFOy2CHs' },
    { title: 'Aarzu', spotify: 'spotify:track:0VRTOe8RLdpE2Pl557PCno' },
    { title: 'Peechay Hutt', spotify: 'spotify:track:5eOGj0N367J6ORDBaQ5zlR' },
    { title: 'Sun Le Na', spotify: 'spotify:track:0tyK2eyMatZvNCVtbdNlmt' },
    { title: 'Rangeen', spotify: 'spotify:track:7cO7GWk6vUGNcAUXMJ2Bdj' },
  ],
};

export default config;
