import type { Testimonial, LogoEntry } from '../lib/types';
import { clientLogo, venueLogo } from '../lib/media';

/** Fase 1: structure only, per PRD §5 Feature "Testimoni" AC — placeholder
 * content must be clearly marked as a sample, never presented as if real,
 * to avoid a credibility risk if noticed. Replace `quote`/`name`/`location`
 * with real, consented quotes in Fase 2 (see knowledge.md §7: real
 * testimonials require a signed consent form before publishing name+city). */
export const testimonials: Testimonial[] = [
  {
    id: 'placeholder-1',
    placeholder: true,
    rating: 5,
    quote: {
      id: 'Contoh kutipan: "Anak-anak senang sekali, dari persiapan sampai selesai crew-nya sangat membantu."',
      en: 'Sample quote: "The kids had a wonderful time — the crew was helpful from setup through cleanup."',
    },
    name: 'Nama Orang Tua (contoh)',
    eventType: { id: 'Ulang tahun anak', en: 'Kids birthday' },
    location: 'Bogor',
    year: 2026,
  },
  {
    id: 'placeholder-2',
    placeholder: true,
    rating: 5,
    quote: {
      id: 'Contoh kutipan: "Aktivitasnya cocok untuk acara keluarga besar, semua usia bisa ikut."',
      en: 'Sample quote: "The activities worked well for a big family gathering — every age group could join in."',
    },
    name: 'Nama Klien (contoh)',
    eventType: { id: 'Family gathering', en: 'Family gathering' },
    location: 'Tangerang',
    year: 2026,
  },
  {
    id: 'placeholder-3',
    placeholder: true,
    rating: 5,
    quote: {
      id: 'Contoh kutipan: "Tim Classmate profesional, koordinasinya rapi untuk acara brand kami."',
      en: 'Sample quote: "The Classmate team was professional — coordination for our brand event was smooth."',
    },
    name: 'Nama PIC Brand (contoh)',
    eventType: { id: 'Aktivasi brand', en: 'Brand activation' },
    location: 'Jakarta',
    year: 2025,
  },
];

/** Source: 2026 pricelist "Our Client" / "Venue Collaboration". `logoSrc`
 * is resolved below from src/assets/logos/{clients,venues}/ (see
 * lib/media.ts) once a real vector/PNG logo file is supplied per client —
 * see ASSET_MANIFEST.md. Renders as a clean text wordmark placeholder
 * until then, same as before. */
const CLIENT_NAMES = [
  'Mooi Heartmade',
  'sekolah.mu',
  'Paramount Land',
  'Antasari Place',
  'Ciputra',
  'NaturaCity Developments',
  'Triniti Land',
  'AstraLand Indonesia',
  'Asy-Syukriyyah Islamic School',
  'Gardens at Candi Sawangan',
  'GBP Green Rentals Park',
  'Uniqlo Fitfest 2025',
  'Telaga Kahuripan',
  'PutaNutu Resort Residence',
  'Asthara Skyfront City',
];

const VENUE_NAMES = [
  'The Bucketlist Kitchen',
  'Wuffy Space Raya',
  'Novotel Tangerang',
  'Mercure Hotels Serpong Alam Sutera',
  'Main Sama Pelant',
  'Sumbaga Bistro',
  'Mo.joke Community',
  'Swiss-Belhotel Serpong South Tangerang',
  'Atria Gading Serpong',
  "Bigland Bogor Hotel Int'l & Convention Hall",
  'The Bigboundib',
  'South78',
  'Bogor Creative Center',
  'Ramada by Wyndham Serpong',
];

export const clientLogos: LogoEntry[] = CLIENT_NAMES.map((name) => ({
  name,
  logoSrc: clientLogo(name),
}));
export const venueLogos: LogoEntry[] = VENUE_NAMES.map((name) => ({
  name,
  logoSrc: venueLogo(name),
}));
