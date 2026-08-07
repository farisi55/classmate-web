import type { PackageTier } from '../lib/types';

/** Source: 2026 pricelist, with the "Activity Only" tier from the 2025
 * pricelist explicitly retained per developer decision (PRD §10 Q1 answer).
 * No tier is flagged `highlight` — deliberate, so clients discuss and there
 * is room to negotiate (knowledge.md §7 domain rule). */
export const packages: PackageTier[] = [
  {
    slug: 'aktivitas-saja',
    name: { id: 'Activity Only', en: 'Activity Only' },
    price: { id: 'Rp 100rb', en: 'IDR 100K' },
    priceNote: { id: 'per peserta · min. 10 peserta', en: 'per participant · min. 10 participants' },
    participants: { id: 'Min. 10 peserta', en: 'Min. 10 participants' },
    duration: { id: 'Menyesuaikan acara', en: 'Fits your schedule' },
    crews: { id: 'Crew menyesuaikan', en: 'Crew sized to fit' },
    includes: [
      { id: 'Singing & Dancing', en: 'Singing & Dancing' },
      { id: 'Story Telling', en: 'Story Telling' },
      { id: 'Fun Games', en: 'Fun Games' },
      { id: 'Coloring', en: 'Coloring' },
    ],
    notes: [
      { id: 'Cocok untuk mengisi acara tanpa paket art & craft penuh.', en: 'Fits an event that just needs activity fillers, not a full art & craft package.' },
      { id: 'Transport dikenakan biaya terpisah.', en: 'Transport is charged separately.' },
    ],
    freeTransport: false,
    ctaMessage: { id: 'Halo Classmate, saya tertarik dengan paket Activity Only (Rp100rb/peserta). Boleh info lebih lanjut?', en: 'Hi Classmate, I\'m interested in the Activity Only package (IDR 100K/participant). Could you share more details?' },
  },
  {
    slug: 'paket-25-peserta',
    name: { id: '25 Peserta', en: '25 Participants' },
    price: { id: 'Rp 3,5jt', en: 'IDR 3.5M' },
    priceNote: { id: 'per acara', en: 'per event' },
    participants: { id: '25 peserta', en: '25 participants' },
    duration: { id: '120 menit', en: '120 minutes' },
    crews: { id: '4 crew', en: '4 crew members' },
    includes: [
      { id: 'Pilihan Art & Craft', en: 'Choice of Art & Craft activity' },
      { id: 'Alat & bahan', en: 'Tools & materials' },
      { id: 'Merchandise + apron (dipinjamkan)', en: 'Merchandise + apron (on loan)' },
      { id: 'Free singing, dancing, story telling & fun games', en: 'Free singing, dancing, storytelling & fun games' },
    ],
    notes: [
      { id: 'Free transport untuk area Jabodetabek.', en: 'Free transport within the Jabodetabek area.' },
      { id: 'Harga di luar paket: Rp170rb/peserta.', en: 'Outside-package rate: IDR 170K/participant.' },
    ],
    freeTransport: true,
    ctaMessage: { id: 'Halo Classmate, saya tertarik dengan Paket 25 Peserta (Rp3,5jt). Boleh info lebih lanjut?', en: 'Hi Classmate, I\'m interested in the 25-Participant Package (IDR 3.5M). Could you share more details?' },
  },
  {
    slug: 'paket-50-peserta',
    name: { id: '50 Peserta', en: '50 Participants' },
    price: { id: 'Rp 6jt', en: 'IDR 6M' },
    priceNote: { id: 'per acara', en: 'per event' },
    participants: { id: '50 peserta', en: '50 participants' },
    duration: { id: '120 menit', en: '120 minutes' },
    crews: { id: '5 crew', en: '5 crew members' },
    includes: [
      { id: 'Pilihan Art & Craft', en: 'Choice of Art & Craft activity' },
      { id: 'Alat & bahan', en: 'Tools & materials' },
      { id: 'Merchandise + apron (dipinjamkan)', en: 'Merchandise + apron (on loan)' },
      { id: 'Free singing, dancing, story telling & fun games', en: 'Free singing, dancing, storytelling & fun games' },
    ],
    notes: [
      { id: 'Free transport untuk area Jabodetabek.', en: 'Free transport within the Jabodetabek area.' },
      { id: 'Harga di luar paket: Rp170rb/peserta.', en: 'Outside-package rate: IDR 170K/participant.' },
    ],
    freeTransport: true,
    ctaMessage: { id: 'Halo Classmate, saya tertarik dengan Paket 50 Peserta (Rp6jt). Boleh info lebih lanjut?', en: 'Hi Classmate, I\'m interested in the 50-Participant Package (IDR 6M). Could you share more details?' },
  },
  {
    slug: 'paket-100-full-day',
    name: { id: '100 Peserta · Full Day', en: '100 Participants · Full Day' },
    price: { id: 'Rp 17,5jt', en: 'IDR 17.5M' },
    priceNote: { id: 'per acara · maks. 8 jam', en: 'per event · max 8 hours' },
    participants: { id: '100 peserta', en: '100 participants' },
    duration: { id: 'Maks. 8 jam', en: 'Max 8 hours' },
    crews: { id: 'Crew menyesuaikan', en: 'Crew sized to fit' },
    includes: [
      { id: 'Lomba Mewarnai (Styrofoam 30x40cm / Kertas A3)', en: 'Coloring Competition (30×40cm styrofoam / A3 paper)' },
      { id: 'Dongeng Show', en: 'Storytelling Show' },
      { id: 'Fun Science Show', en: 'Fun Science Show' },
      { id: 'Art Class', en: 'Art Class' },
      { id: 'Family Games', en: 'Family Games' },
      { id: 'MC', en: 'MC / Host' },
      { id: 'Piala, hadiah pemenang & uang tunai', en: 'Trophy, winner prizes & cash prizes' },
      { id: 'Merchandise, hadiah quiz & games', en: 'Merchandise, quiz & game prizes' },
    ],
    notes: [
      { id: 'Cocok untuk family gathering atau grand event komunitas/brand.', en: 'A fit for family gatherings or larger community/brand events.' },
    ],
    freeTransport: true,
    ctaMessage: { id: 'Halo Classmate, saya tertarik dengan Paket 100 Peserta Full Day (Rp17,5jt). Boleh info lebih lanjut?', en: 'Hi Classmate, I\'m interested in the 100-Participant Full Day Package (IDR 17.5M). Could you share more details?' },
  },
];
