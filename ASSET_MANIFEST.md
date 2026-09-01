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
hero-collage.webp | webp | 1200x1200 | /src/assets/hero | Kolase/foto anak-anak sedang art & craft, mengisi kotak dekoratif di hero — lihat src/components/sections/HomeContent.astro
```
Taruh 1 file apa saja (jpg/png/webp) di `src/assets/hero/` — nama file bebas, yang
penting cuma satu file di folder itu. `lib/media.ts` otomatis mengambilnya, `astro:assets`
otomatis resize + convert ke WebP saat build. Sampai file ini ada, beranda tetap
menampilkan placeholder logo (tidak pernah rusak).

### Dokumentasi Aktivitas (38 folder, per `slug` di src/data/activities.ts)
Ikuti konvensi: `activity-{slug}-1.webp`, `activity-{slug}-2.webp`, dst — taruh di
`src/assets/activities/`. Tidak perlu kompres manual ke bawah 300KB dulu — `astro:assets`
otomatis resize ke lebar maks. 1600px dan convert ke WebP saat build (lihat
`src/lib/media.ts`); cukup hindari commit foto mentah kamera (6–7MB) langsung, turunkan
dulu ke ukuran wajar (≤2500px sisi terpanjang) supaya repo tidak membengkak. Tidak ada
langkah edit kode — begitu file dengan nama yang cocok muncul di folder ini, kartu di
halaman Aktivitas otomatis menampilkan foto asli (menggantikan state placeholder
"dokumentasi menyusul").

Contoh 3 aktivitas pertama untuk memulai:
```
activity-painting-pot-planting-1.webp | webp | 1600x1200 | /src/assets/activities | Dokumentasi Painting Pot & Planting — sumber: Drive/Dokumentasi/[Tahun]/[Klien]/Painting Pot
activity-slime-experience-1.webp      | webp | 1600x1200 | /src/assets/activities | Dokumentasi Slime Experience
activity-pottery-sand-art-1.webp      | webp | 1600x1200 | /src/assets/activities | Dokumentasi Pottery Class — sumber: Drive/Dokumentasi/2026/Ayodhya by Alam Sutera/Pottery Class
```
(35 aktivitas sisanya mengikuti pola yang sama.)

### Logo Klien & Venue (29 total — lihat src/data/testimonials-clients.ts)
Tiap entri saat ini tampil sebagai wordmark teks (belum ada file logo). Kirim logo asli
dalam **PNG transparan** (bukan SVG — lihat catatan di `src/lib/media.ts`) untuk
klien/venue yang ingin ditampilkan dengan logo asli, beri nama file sesuai nama
klien/venue yang sudah di-slug-kan, taruh di `src/assets/logos/clients/` atau
`src/assets/logos/venues/`. Tidak perlu edit `testimonials-clients.ts` — pencocokan nama
file → entri terjadi otomatis. Contoh:
```
client-paramount-land.png | png | 400x200 | /src/assets/logos/clients | Logo Paramount Land
venue-novotel-tangerang.png | png | 400x200 | /src/assets/logos/venues | Logo Novotel Tangerang
```

## Konten teks yang masih dibutuhkan (bukan gambar)
- Testimoni asli (3 minimum) untuk menggantikan placeholder di `src/data/testimonials-clients.ts` — perlu consent form terlebih dahulu (lihat knowledge.md §7)
- Angka DP/pelunasan dan batas waktu perubahan peserta di `src/components/sections/SyaratKetentuanContent.astro` (ditandai `[PLACEHOLDER]` di kode)
