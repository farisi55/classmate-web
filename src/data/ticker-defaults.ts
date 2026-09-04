import type { TickerMessage } from '../lib/types';

/** Fase 1 default content — rendered directly, no KV call needed yet.
 * Once the Fase 2 admin panel + /api/ticker are live, RunningTicker.astro
 * fetches this same shape from the API client-side and swaps it in; if
 * that fetch fails for any reason, this array is what visitors keep
 * seeing, so the site never shows a broken/empty ticker. */
export const defaultTickerMessages: TickerMessage[] = [
  {
    id: 'promo-default',
    text_id: 'Tanya paket Art Party untuk acara kamu — respon cepat via WhatsApp.',
    text_en: 'Ask about an Art Party package for your event — quick response on WhatsApp.',
    active: true,
    priority: 1,
  },
  {
    id: 'aktivitas-default',
    text_id: 'Aktivitas favorit bulan ini: Slime Experience & Tie Dye.',
    text_en: "This month's favorite activities: Slime Experience & Tie Dye.",
    active: true,
    priority: 2,
  },
  {
    id: 'bestseller-default',
    text_id: 'Best seller: Paket Art Party 25 Peserta — pas untuk ulang tahun & gathering kecil.',
    text_en:
      'Best seller: 25-Participant Art Party Package — a fit for birthdays & small gatherings.',
    active: true,
    priority: 3,
  },
];
