export type Locale = 'id' | 'en';

/** A string that must be authored in both languages side by side, per
 * knowledge.md §3 decision #4 — one file per entity, not one file per
 * language, to prevent id/en drift. */
export interface Localized {
  id: string;
  en: string;
}

export interface PackageTier {
  slug: string;
  price: Localized; // display string, e.g. "Rp 3,5jt" / "IDR 3.5M"
  priceNote: Localized; // e.g. "per peserta, min. 10 peserta"
  name: Localized;
  participants: Localized;
  duration: Localized;
  crews: Localized;
  includes: Localized[];
  notes: Localized[];
  freeTransport: boolean;
  ctaMessage: Localized; // pre-filled WhatsApp text for this tier
  highlight?: boolean;
}

export type ActivityCategory = 'inti' | 'kelas-lainnya';

export interface Activity {
  slug: string;
  category: ActivityCategory;
  name: Localized;
  summary: Localized;
  includes: Localized[];
  minParticipants?: number;
  /** Filled in once real documentation photos are curated to R2 — see
   * ASSET_MANIFEST.md. Left empty renders the placeholder state. */
  images: string[];
  driveFolderHint: Localized;
}

export interface Testimonial {
  id: string;
  placeholder: true; // Fase 1: structure only — see knowledge.md §7 domain rule
  rating: number;
  quote: Localized;
  name: string;
  eventType: Localized;
  location: string;
  year: number;
}

export interface LogoEntry {
  name: string;
  /** Path under /public/img once the real vector/PNG logo is supplied —
   * left null renders a clean text wordmark placeholder instead. */
  logoSrc: string | null;
}

export interface TickerMessage {
  id: string;
  text_id: string;
  text_en: string;
  active: boolean;
  priority: number;
  updated_at?: string;
}
