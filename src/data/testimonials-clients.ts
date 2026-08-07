import type { Testimonial } from '../lib/types';

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
 * is null until a real vector/PNG logo file is supplied per client — see
 * ASSET_MANIFEST.md. Rendered as a clean text wordmark placeholder until then. */
export const clientLogos: { name: string; logoSrc: string | null }[] = [
  { name: 'Mooi Heartmade', logoSrc: null },
  { name: 'sekolah.mu', logoSrc: null },
  { name: 'Paramount Land', logoSrc: null },
  { name: 'Antasari Place', logoSrc: null },
  { name: 'Ciputra', logoSrc: null },
  { name: 'NaturaCity Developments', logoSrc: null },
  { name: 'Triniti Land', logoSrc: null },
  { name: 'AstraLand Indonesia', logoSrc: null },
  { name: 'Asy-Syukriyyah Islamic School', logoSrc: null },
  { name: 'Gardens at Candi Sawangan', logoSrc: null },
  { name: 'GBP Green Rentals Park', logoSrc: null },
  { name: 'Uniqlo Fitfest 2025', logoSrc: null },
  { name: 'Telaga Kahuripan', logoSrc: null },
  { name: 'PutaNutu Resort Residence', logoSrc: null },
  { name: 'Asthara Skyfront City', logoSrc: null },
];

export const venueLogos: { name: string; logoSrc: string | null }[] = [
  { name: 'The Bucketlist Kitchen', logoSrc: null },
  { name: 'Wuffy Space Raya', logoSrc: null },
  { name: 'Novotel Tangerang', logoSrc: null },
  { name: 'Mercure Hotels Serpong Alam Sutera', logoSrc: null },
  { name: 'Main Sama Pelant', logoSrc: null },
  { name: 'Sumbaga Bistro', logoSrc: null },
  { name: 'Mo.joke Community', logoSrc: null },
  { name: 'Swiss-Belhotel Serpong South Tangerang', logoSrc: null },
  { name: 'Atria Gading Serpong', logoSrc: null },
  { name: "Bigland Bogor Hotel Int'l & Convention Hall", logoSrc: null },
  { name: 'The Bigboundib', logoSrc: null },
  { name: 'South78', logoSrc: null },
  { name: 'Bogor Creative Center', logoSrc: null },
  { name: 'Ramada by Wyndham Serpong', logoSrc: null },
];
