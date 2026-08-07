/** Single source of truth for contact details and legal identity — never
 * hardcode these values again elsewhere (knowledge.md §7 domain rule /
 * §9 forbidden pattern: "tidak hardcode nomor WA di banyak tempat"). */

export const siteConfig = {
  brandName: 'Classmate',
  legalEntity: 'PT. Creativa Harmoni Nusantara',
  legalEntityFoundedISO: '2023-07-01',
  sector: {
    id: 'Wisata pendidikan (edutourism)',
    en: 'Educational tourism (edutourism)',
  },
  whatsapp: {
    /** wa.me expects digits only, country code first, no leading zero/plus. */
    e164: '628992400880',
    display: '0899 240 0880',
  },
  instagram: {
    handle: '@classmateid',
    url: 'https://instagram.com/classmateid',
  },
  serviceArea: {
    id: 'Bogor – Jabodetabek',
    en: 'Bogor – Greater Jakarta (Jabodetabek)',
  },
} as const;

/** Builds a wa.me deep link with a pre-filled, locale-appropriate message.
 * Every WhatsApp CTA in the site should go through this helper — see
 * knowledge.md §5 Feature: WhatsApp Conversion Funnel, AC #3. */
export function buildWhatsAppLink(message: string): string {
  const base = `https://wa.me/${siteConfig.whatsapp.e164}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
