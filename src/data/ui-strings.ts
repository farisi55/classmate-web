import type { Locale } from '../lib/types';

export const uiStrings = {
  nav: {
    home: { id: 'Beranda', en: 'Home' },
    layanan: { id: 'Layanan', en: 'Services' },
    aktivitas: { id: 'Aktivitas', en: 'Activities' },
    klienVenue: { id: 'Klien & Venue', en: 'Clients & Venues' },
    syaratKetentuan: { id: 'Syarat & Ketentuan', en: 'Terms & Policies' },
    tentang: { id: 'Tentang Kami', en: 'About Us' },
    kontak: { id: 'Kontak', en: 'Contact' },
  },
  cta: {
    whatsapp: { id: 'Chat via WhatsApp', en: 'Chat on WhatsApp' },
    lihatPaket: { id: 'Lihat Paket & Harga', en: 'See Packages & Pricing' },
    lihatAktivitas: { id: 'Lihat Semua Aktivitas', en: 'See All Activities' },
    lihatDokumentasi: { id: 'Lihat dokumentasi lengkap', en: 'View full documentation' },
    pilihPaketIni: { id: 'Tanya Paket Ini', en: 'Ask About This Package' },
  },
  common: {
    minPeserta: { id: 'Min. peserta', en: 'Min. participants' },
    perPeserta: { id: 'per peserta', en: 'per participant' },
    populer: { id: 'Populer', en: 'Popular' },
    semua: { id: 'Semua', en: 'All' },
    aktivitasInti: { id: 'Aktivitas Inti', en: 'Core Activities' },
    kelasLainnya: { id: 'Kelas Lainnya', en: 'Other Classes' },
    tutup: { id: 'Tutup', en: 'Close' },
    placeholderBadge: { id: 'Contoh — belum kutipan asli', en: 'Sample — not a real quote yet' },
    dokumentasiSegera: {
      id: 'Foto dokumentasi menyusul — lihat arsip lengkap di Google Drive.',
      en: 'Documentation photos coming soon — see the full archive on Google Drive.',
    },
  },
  footer: {
    tagline: {
      id: 'A Celebration of Love and Togetherness',
      en: 'A Celebration of Love and Togetherness',
    },
    hakCipta: { id: 'Seluruh hak cipta dilindungi.', en: 'All rights reserved.' },
    dibawahNaungan: { id: 'beroperasi di bawah naungan', en: 'operates under' },
  },
  languageSwitcher: {
    id: 'ID',
    en: 'EN',
  },
} as const;

export function t<T extends { id: string; en: string }>(entry: T, lang: Locale): string {
  return entry[lang];
}
