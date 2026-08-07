# Asset Manifest

Format: `nama_file | format_file | dimensi_gambar (px) | path | description`

## Sudah tersedia (delivered, in this zip)

```
classmate-logo-fullcolor.png | png | 800x581 | /public/img/logo | Logo utama, background transparan
classmate-logo-white.png     | png | 800x581 | /public/img/logo | Varian putih/reverse untuk latar gelap/berwarna
classmate-logo-black.png     | png | 800x581 | /public/img/logo | Varian hitam untuk konteks single-color
classmate-icon-512.png       | png | 512x512  | /public/img/logo | Versi persegi (padded) untuk favicon/apple-touch-icon/OG fallback
```

## Masih dibutuhkan — foto & dokumen

### Font
```
HumanSans-Regular.woff2  | woff2 | - | /public/fonts/human-sans | Body text, weight 400
HumanSans-Medium.woff2   | woff2 | - | /public/fonts/human-sans | weight 500
HumanSans-SemiBold.woff2 | woff2 | - | /public/fonts/human-sans | weight 600
HumanSans-Bold.woff2     | woff2 | - | /public/fonts/human-sans | weight 700
```
Sumber: github.com/tradville/humansans (OFL — aman dipakai komersial). Sampai file ini
ditaruh, `src/styles/global.css` fallback otomatis ke `system-ui` (aman, tidak patah).

### Hero (Beranda)
```
hero-collage.webp | webp | 1200x1200 | /public/img/hero | Kolase/foto anak-anak sedang art & craft, mengisi kotak dekoratif di hero — lihat src/components/sections/HomeContent.astro
```

### Dokumentasi Aktivitas (38 folder, per `slug` di src/data/activities.ts)
Ikuti konvensi: `activity-{slug}-1.webp`, `activity-{slug}-2.webp`, dst — maks. 300KB,
lebar maks. 1600px. Setelah upload ke R2 & taruh path-nya di array `images` pada entri
terkait di `src/data/activities.ts`, kartu di halaman Aktivitas otomatis menampilkan
foto asli (menggantikan state placeholder "dokumentasi menyusul").

Contoh 3 aktivitas pertama untuk memulai:
```
activity-painting-pot-planting-1.webp | webp | 1600x1200 | /public/img/activities | Dokumentasi Painting Pot & Planting — sumber: Drive/Dokumentasi/[Tahun]/[Klien]/Painting Pot
activity-slime-experience-1.webp      | webp | 1600x1200 | /public/img/activities | Dokumentasi Slime Experience
activity-pottery-sand-art-1.webp      | webp | 1600x1200 | /public/img/activities | Dokumentasi Pottery Class — sumber: Drive/Dokumentasi/2026/Ayodhya by Alam Sutera/Pottery Class
```
(35 aktivitas sisanya mengikuti pola yang sama.)

### Logo Klien & Venue (29 total — lihat src/data/testimonials-clients.ts)
Tiap entri saat ini `logoSrc: null` dan tampil sebagai wordmark teks. Kirim logo asli
(idealnya PNG transparan atau SVG) untuk klien/venue yang ingin ditampilkan dengan
logo asli, lalu isi `logoSrc` dengan path-nya, contoh:
```
client-paramount-land.png | png | 400x200 | /public/img/logos/clients | Logo Paramount Land
venue-novotel-tangerang.png | png | 400x200 | /public/img/logos/venues | Logo Novotel Tangerang
```

## Konten teks yang masih dibutuhkan (bukan gambar)
- Testimoni asli (3 minimum) untuk menggantikan placeholder di `src/data/testimonials-clients.ts` — perlu consent form terlebih dahulu (lihat knowledge.md §7)
- Angka DP/pelunasan dan batas waktu perubahan peserta di `src/components/sections/SyaratKetentuanContent.astro` (ditandai `[PLACEHOLDER]` di kode)
