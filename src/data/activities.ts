import type { Activity } from '../lib/types';
import { activityImages } from '../lib/media';

/** Source: 2026 pricelist "Pilihan Kegiatan" (10, included in Art Party
 * packages) + "Kelas Lainnya" (28, booked separately, min. 20 peserta).
 * `images` is resolved below from src/assets/activities/ (see lib/media.ts)
 * once real documentation photos are curated from Google Drive and
 * committed — see ASSET_MANIFEST.md. Empty until then, same placeholder
 * behavior as before.
 * `driveFolderHint` tells an admin roughly where to look in the
 * Dokumentasi/[Tahun]/[Klien-Venue]/[Aktivitas] archive. */

type ActivityDraft = Omit<Activity, 'images'>;

const AKTIVITAS_INTI: ActivityDraft[] = [
  {
    slug: 'painting-pot-planting',
    category: 'inti',
    name: { id: 'Painting Pot & Planting', en: 'Painting Pot & Planting' },
    summary: {
      id: 'Melukis pot tanah liat sendiri, lalu menanam sukulen atau tanaman kecil di dalamnya untuk dibawa pulang.',
      en: 'Paint your own clay pot, then plant a succulent or small plant in it to take home.',
    },
    includes: [
      { id: 'Melukis pot', en: 'Pot painting' },
      { id: 'Menanam tanaman/sukulen', en: 'Planting a plant/succulent' },
    ],
    driveFolderHint: { id: 'Cari folder aktivitas "Painting Pot"', en: 'Look for the "Painting Pot" activity folder' },
  },
  {
    slug: 'slime-experience',
    category: 'inti',
    name: { id: 'Slime Experience', en: 'Slime Experience' },
    summary: {
      id: 'Membuat slime dari nol, lengkap dengan glitter dan topping favorit seperti pompom dan sprinkle.',
      en: 'Make slime from scratch, complete with glitter and favorite toppings like pompoms and sprinkles.',
    },
    includes: [
      { id: 'Membuat slime', en: 'Slime making' },
      { id: 'Glitter', en: 'Glitter' },
      { id: 'Topping (pompom, sprinkle, dll)', en: 'Toppings (pompoms, sprinkles, etc.)' },
    ],
    driveFolderHint: { id: 'Cari folder aktivitas "Slime Experience"', en: 'Look for the "Slime Experience" activity folder' },
  },
  {
    slug: 'food-decor-making',
    category: 'inti',
    name: { id: 'Food Decor / Making', en: 'Food Decor / Making' },
    summary: {
      id: 'Menghias cupcake, donat, cookies, tumpeng mini, atau energy ball sendiri — lengkap dengan topi chef untuk diwarnai.',
      en: 'Decorate your own cupcakes, donuts, cookies, mini tumpeng, or energy balls — complete with a chef hat to color.',
    },
    includes: [
      { id: 'Cupcake / Donat / Cookies / Tumpeng Mini / Energy Ball', en: 'Cupcake / Donut / Cookies / Mini Tumpeng / Energy Ball' },
      { id: 'Coloring chef hat', en: 'Chef hat coloring' },
    ],
    driveFolderHint: { id: 'Cari folder aktivitas "Food Decor"', en: 'Look for the "Food Decor" activity folder' },
  },
  {
    slug: 'painting-texture-art',
    category: 'inti',
    name: { id: 'Painting / Texture Art', en: 'Painting / Texture Art' },
    summary: {
      id: 'Melukis di kanvas, talenan, gypsum, topi, kayu, atau kaos, dilengkapi stiker dan topping tekstur.',
      en: 'Paint on canvas, cutting boards, gypsum, hats, wood, or t-shirts, finished with stickers and textured toppings.',
    },
    includes: [
      { id: 'Kanvas / Talenan / Gypsum / Hat / Kayu / Tshirt', en: 'Canvas / Cutting board / Gypsum / Hat / Wood / T-shirt' },
      { id: 'Stiker', en: 'Stickers' },
      { id: 'Topping (pompom, sprinkle, dll)', en: 'Toppings (pompoms, sprinkles, etc.)' },
    ],
    driveFolderHint: { id: 'Cari folder aktivitas "Painting / Texture Art"', en: 'Look for the "Painting / Texture Art" activity folder' },
  },
  {
    slug: 'clay-decoden',
    category: 'inti',
    name: { id: 'Clay / Decoden', en: 'Clay / Decoden' },
    summary: {
      id: 'Menghias kanvas, cermin, jepit rambut, kacamata, atau pencil case dengan clay warna-warni ala decoden.',
      en: 'Decorate a canvas, mirror, hairclip, sunglasses, or pencil case with colorful decoden-style clay.',
    },
    includes: [
      { id: 'Kanvas / Cermin / Hairclip / Sunglasses / Pencil Case', en: 'Canvas / Mirror / Hairclip / Sunglasses / Pencil case' },
    ],
    driveFolderHint: { id: 'Cari folder aktivitas "Clay / Decoden"', en: 'Look for the "Clay / Decoden" activity folder' },
  },
  {
    slug: 'tie-dye',
    category: 'inti',
    name: { id: 'Tie Dye', en: 'Tie Dye' },
    summary: {
      id: 'Mewarnai tote bag, bucket hat, masker, atau kaos dengan teknik tie dye — setiap hasil selalu unik.',
      en: 'Dye a tote bag, bucket hat, mask, or t-shirt using tie-dye technique — every result is unique.',
    },
    includes: [{ id: 'Tote Bag / Bucket Hat / Masker / Tshirt', en: 'Tote bag / Bucket hat / Mask / T-shirt' }],
    driveFolderHint: { id: 'Cari folder aktivitas "Tie Dye"', en: 'Look for the "Tie Dye" activity folder' },
  },
  {
    slug: 'pottery-sand-art',
    category: 'inti',
    name: { id: 'Pottery / Sand Art', en: 'Pottery / Sand Art' },
    summary: {
      id: 'Membentuk kerajinan dari tanah liat atau menyusun sand art berwarna-warni dalam botol.',
      en: 'Shape pottery from clay, or layer colorful sand art in a bottle.',
    },
    includes: [
      { id: 'Kerajinan tanah liat', en: 'Clay craft' },
      { id: 'Sand art colorful', en: 'Colorful sand art' },
    ],
    driveFolderHint: { id: 'Cari folder aktivitas "Pottery Class"', en: 'Look for the "Pottery Class" activity folder' },
  },
  {
    slug: 'sewing',
    category: 'inti',
    name: { id: 'Sewing', en: 'Sewing' },
    summary: {
      id: 'Belajar menjahit sederhana untuk membuat hand puppet atau tas kecil, lengkap stiker dan topping.',
      en: 'Learn simple sewing to make a hand puppet or a small bag, finished with stickers and toppings.',
    },
    includes: [
      { id: 'Hand Puppet / Bag', en: 'Hand puppet / Bag' },
      { id: 'Stiker & topping', en: 'Stickers & toppings' },
    ],
    driveFolderHint: { id: 'Cari folder aktivitas "Sewing"', en: 'Look for the "Sewing" activity folder' },
  },
  {
    slug: 'beads',
    category: 'inti',
    name: { id: 'Beads', en: 'Beads' },
    summary: {
      id: 'Merangkai manik-manik jadi gelang, kalung, tasbih, atau kalung khusus hewan peliharaan.',
      en: 'String beads into a bracelet, necklace, tasbih, or a special necklace for a pet.',
    },
    includes: [{ id: 'Gelang / Kalung / Tasbih / Kalung Hewan', en: 'Bracelet / Necklace / Tasbih / Pet necklace' }],
    driveFolderHint: { id: 'Cari folder aktivitas "Beads"', en: 'Look for the "Beads" activity folder' },
  },
  {
    slug: 'eco-print',
    category: 'inti',
    name: { id: 'Eco Print', en: 'Eco Print' },
    summary: {
      id: 'Mencetak motif daun asli ke topi, kaos, kain, atau tote bag lewat teknik eco print alami.',
      en: 'Print real leaf motifs onto a hat, t-shirt, fabric, or tote bag with a natural eco-print technique.',
    },
    includes: [{ id: 'Hat / Tshirt / Kain / Tote Bag', en: 'Hat / T-shirt / Fabric / Tote bag' }],
    driveFolderHint: { id: 'Cari folder aktivitas "Eco Print"', en: 'Look for the "Eco Print" activity folder' },
  },
];

/** "Kelas Lainnya" — booked separately from Art Party packages, min. 20
 * peserta, harga & durasi berbeda per kelas (knowledge.md §7 domain rule). */
const KELAS_LAINNYA: ActivityDraft[] = [
  { slug: 'sport', category: 'kelas-lainnya', name: { id: 'Sport (Yoga, Zumba, Pound Fit, dll)', en: 'Sport (Yoga, Zumba, Pound Fit, etc.)' }, summary: { id: 'Sesi olahraga ringan dan seru untuk komunitas atau kantor.', en: 'A light, fun group workout session for communities or offices.' }, includes: [], minParticipants: 20, driveFolderHint: { id: 'Cari folder "Sport"', en: 'Look for the "Sport" folder' } },
  { slug: 'soap', category: 'kelas-lainnya', name: { id: 'Soap Making', en: 'Soap Making' }, summary: { id: 'Membuat sabun sendiri dari bahan dasar hingga jadi produk siap pakai.', en: 'Make your own soap from base ingredients into a finished product.' }, includes: [], minParticipants: 20, driveFolderHint: { id: 'Cari folder "Soap"', en: 'Look for the "Soap" folder' } },
  { slug: 'parfum', category: 'kelas-lainnya', name: { id: 'Parfum Making', en: 'Perfume Making' }, summary: { id: 'Meracik parfum sendiri sesuai karakter aroma favorit.', en: 'Blend your own perfume based on your favorite scent profile.' }, includes: [], minParticipants: 20, driveFolderHint: { id: 'Cari folder "Parfum"', en: 'Look for the "Parfum" folder' } },
  { slug: 'tufting', category: 'kelas-lainnya', name: { id: 'Tufting', en: 'Tufting' }, summary: { id: 'Membuat karpet mini bertekstur dengan teknik tufting gun.', en: 'Make a small textured rug using a tufting gun technique.' }, includes: [], minParticipants: 20, driveFolderHint: { id: 'Cari folder "Tufting"', en: 'Look for the "Tufting" folder' } },
  { slug: 'embroidery', category: 'kelas-lainnya', name: { id: 'Embroidery', en: 'Embroidery' }, summary: { id: 'Belajar sulam dasar untuk membuat hiasan kain bermotif.', en: 'Learn basic embroidery to create a patterned fabric piece.' }, includes: [], minParticipants: 20, driveFolderHint: { id: 'Cari folder "Embroidery"', en: 'Look for the "Embroidery" folder' } },
  { slug: 'bouquet', category: 'kelas-lainnya', name: { id: 'Bouquet Making', en: 'Bouquet Making' }, summary: { id: 'Merangkai buket bunga atau snack sendiri dengan gaya personal.', en: 'Arrange your own flower or snack bouquet in a personal style.' }, includes: [], minParticipants: 20, driveFolderHint: { id: 'Cari folder "Bouquet"', en: 'Look for the "Bouquet" folder' } },
  { slug: 'baloon', category: 'kelas-lainnya', name: { id: 'Balloon Decoration', en: 'Balloon Decoration' }, summary: { id: 'Belajar teknik dasar menyusun dekorasi balon untuk acara.', en: 'Learn basic balloon-decorating techniques for an event.' }, includes: [], minParticipants: 20, driveFolderHint: { id: 'Cari folder "Baloon"', en: 'Look for the "Baloon" folder' } },
  { slug: 'batik', category: 'kelas-lainnya', name: { id: 'Batik', en: 'Batik' }, summary: { id: 'Mencoba teknik membatik di atas kain sebagai media pribadi.', en: 'Try batik-making technique on fabric as a personal craft piece.' }, includes: [], minParticipants: 20, driveFolderHint: { id: 'Cari folder "Batik"', en: 'Look for the "Batik" folder' } },
  { slug: 'hampers', category: 'kelas-lainnya', name: { id: 'Hampers', en: 'Hampers' }, summary: { id: 'Menyusun dan mengemas hampers untuk hadiah atau parsel.', en: 'Arrange and pack a hamper for gifting.' }, includes: [], minParticipants: 20, driveFolderHint: { id: 'Cari folder "Hampers"', en: 'Look for the "Hampers" folder' } },
  { slug: 'crochet', category: 'kelas-lainnya', name: { id: 'Crochet', en: 'Crochet' }, summary: { id: 'Belajar merajut dasar dengan hook crochet untuk pemula.', en: 'Learn beginner-friendly crochet with a hook.' }, includes: [], minParticipants: 20, driveFolderHint: { id: 'Cari folder "Crochet"', en: 'Look for the "Crochet" folder' } },
  { slug: 'chunky-bag', category: 'kelas-lainnya', name: { id: 'Chunky Bag', en: 'Chunky Bag' }, summary: { id: 'Merajut tas chunky bertekstur tebal yang sedang tren.', en: 'Knit a trendy, thick-textured chunky bag.' }, includes: [], minParticipants: 20, driveFolderHint: { id: 'Cari folder "Chunky Bag"', en: 'Look for the "Chunky Bag" folder' } },
  { slug: 'macrame', category: 'kelas-lainnya', name: { id: 'Macrame', en: 'Macrame' }, summary: { id: 'Menyimpul tali macrame jadi hiasan dinding atau gantungan pot.', en: 'Knot macrame cord into wall hangings or plant holders.' }, includes: [], minParticipants: 20, driveFolderHint: { id: 'Cari folder "Macrame"', en: 'Look for the "Macrame" folder' } },
  { slug: 'resin', category: 'kelas-lainnya', name: { id: 'Resin Art', en: 'Resin Art' }, summary: { id: 'Membuat aksesori atau hiasan dari resin cor berwarna.', en: 'Cast colorful resin into accessories or decorative pieces.' }, includes: [], minParticipants: 20, driveFolderHint: { id: 'Cari folder "Resin"', en: 'Look for the "Resin" folder' } },
  { slug: 'leather', category: 'kelas-lainnya', name: { id: 'Leather Craft', en: 'Leather Craft' }, summary: { id: 'Mengolah kulit sintetis/asli jadi produk kerajinan sederhana.', en: 'Work synthetic or genuine leather into a simple crafted item.' }, includes: [], minParticipants: 20, driveFolderHint: { id: 'Cari folder "Leather"', en: 'Look for the "Leather" folder' } },
  { slug: 'art-therapy', category: 'kelas-lainnya', name: { id: 'Art Therapy', en: 'Art Therapy' }, summary: { id: 'Sesi seni ekspresif yang menenangkan, dipandu untuk relaksasi.', en: 'A calming, guided expressive-art session for relaxation.' }, includes: [], minParticipants: 20, driveFolderHint: { id: 'Cari folder "Art Therapy"', en: 'Look for the "Art Therapy" folder' } },
  { slug: 'baking-cooking', category: 'kelas-lainnya', name: { id: 'Baking / Cooking', en: 'Baking / Cooking' }, summary: { id: 'Kelas memanggang atau memasak resep sederhana bersama-sama.', en: 'A group baking or cooking class with a simple recipe.' }, includes: [], minParticipants: 20, driveFolderHint: { id: 'Cari folder "Baking Cooking"', en: 'Look for the "Baking Cooking" folder' } },
  { slug: 'artificial-flower', category: 'kelas-lainnya', name: { id: 'Artificial Flower', en: 'Artificial Flower' }, summary: { id: 'Merangkai bunga artifisial jadi dekorasi tahan lama.', en: 'Arrange artificial flowers into a long-lasting decoration.' }, includes: [], minParticipants: 20, driveFolderHint: { id: 'Cari folder "Artificial Flower"', en: 'Look for the "Artificial Flower" folder' } },
  { slug: 'natural-remedies', category: 'kelas-lainnya', name: { id: 'Natural Remedies', en: 'Natural Remedies' }, summary: { id: 'Meracik ramuan/jamu alami sederhana dari bahan rumahan.', en: 'Prepare a simple natural herbal remedy from household ingredients.' }, includes: [], minParticipants: 20, driveFolderHint: { id: 'Cari folder "Natural Remedies"', en: 'Look for the "Natural Remedies" folder' } },
  { slug: 'cake-decoration', category: 'kelas-lainnya', name: { id: 'Cake Decoration', en: 'Cake Decoration' }, summary: { id: 'Belajar teknik dasar menghias kue ulang tahun atau cupcake.', en: 'Learn basic techniques for decorating a birthday cake or cupcakes.' }, includes: [], minParticipants: 20, driveFolderHint: { id: 'Cari folder "Cake Decoration"', en: 'Look for the "Cake Decoration" folder' } },
  { slug: 'scented-candle', category: 'kelas-lainnya', name: { id: 'Scented Candle', en: 'Scented Candle' }, summary: { id: 'Menuang lilin aromaterapi sendiri dengan wangi pilihan.', en: 'Pour your own scented candle with a fragrance of choice.' }, includes: [], minParticipants: 20, driveFolderHint: { id: 'Cari folder "Scented Candle"', en: 'Look for the "Scented Candle" folder' } },
  { slug: 'yarn-bag', category: 'kelas-lainnya', name: { id: 'Yarn Bag', en: 'Yarn Bag' }, summary: { id: 'Merajut tas dari benang yarn dengan pola sederhana.', en: 'Knit a yarn bag using a simple pattern.' }, includes: [], minParticipants: 20, driveFolderHint: { id: 'Cari folder "Yarn Bag"', en: 'Look for the "Yarn Bag" folder' } },
  { slug: 'punch-needle', category: 'kelas-lainnya', name: { id: 'Punch Needle', en: 'Punch Needle' }, summary: { id: 'Menyulam bertekstur dengan jarum punch untuk pemula.', en: 'Beginner-friendly textured embroidery with a punch needle.' }, includes: [], minParticipants: 20, driveFolderHint: { id: 'Cari folder "Punch Needle"', en: 'Look for the "Punch Needle" folder' } },
  { slug: 'decoden-class', category: 'kelas-lainnya', name: { id: 'Decoden', en: 'Decoden' }, summary: { id: 'Menghias barang sehari-hari dengan clay decoden bertema.', en: 'Decorate everyday items with themed decoden clay.' }, includes: [], minParticipants: 20, driveFolderHint: { id: 'Cari folder "Decoden"', en: 'Look for the "Decoden" folder' } },
  { slug: 'decoupage', category: 'kelas-lainnya', name: { id: 'Decoupage', en: 'Decoupage' }, summary: { id: 'Menempel & melapisi motif kertas pada permukaan benda.', en: 'Layer and seal paper motifs onto an object\'s surface.' }, includes: [], minParticipants: 20, driveFolderHint: { id: 'Cari folder "Decoupage"', en: 'Look for the "Decoupage" folder' } },
  { slug: 'jesmonite', category: 'kelas-lainnya', name: { id: 'Jesmonite', en: 'Jesmonite' }, summary: { id: 'Mencetak jesmonite jadi vas, nampan, atau hiasan meja.', en: 'Cast jesmonite into a vase, tray, or tabletop decor piece.' }, includes: [], minParticipants: 20, driveFolderHint: { id: 'Cari folder "Jesmonite"', en: 'Look for the "Jesmonite" folder' } },
  { slug: 'terrarium', category: 'kelas-lainnya', name: { id: 'Terrarium', en: 'Terrarium' }, summary: { id: 'Menyusun mini-ekosistem tanaman dalam wadah kaca.', en: 'Build a mini plant ecosystem inside a glass container.' }, includes: [], minParticipants: 20, driveFolderHint: { id: 'Cari folder "Terrarium"', en: 'Look for the "Terrarium" folder' } },
  { slug: 'kimekomi', category: 'kelas-lainnya', name: { id: 'Kimekomi', en: 'Kimekomi' }, summary: { id: 'Teknik menyisip kain khas Jepang di atas pola kayu/busa.', en: 'A Japanese fabric-tucking technique applied over a wood/foam pattern.' }, includes: [], minParticipants: 20, driveFolderHint: { id: 'Cari folder "Kimekomi"', en: 'Look for the "Kimekomi" folder' } },
  { slug: 'amigurumi', category: 'kelas-lainnya', name: { id: 'Amigurumi', en: 'Amigurumi' }, summary: { id: 'Merajut boneka kecil bergaya amigurumi yang menggemaskan.', en: 'Crochet a small, cute amigurumi-style doll.' }, includes: [], minParticipants: 20, driveFolderHint: { id: 'Cari folder "Amigurumi"', en: 'Look for the "Amigurumi" folder' } },
];

async function withImages(drafts: ActivityDraft[]): Promise<Activity[]> {
  return Promise.all(drafts.map(async (a) => ({ ...a, images: await activityImages(a.slug) })));
}

// Top-level await: fine here because output is "static" (knowledge.md §2) —
// this module only ever runs at build time (Node), never in a browser or
// the Workers runtime.
export const aktivitasInti = await withImages(AKTIVITAS_INTI);
export const kelasLainnya = await withImages(KELAS_LAINNYA);
export const activities: Activity[] = [...aktivitasInti, ...kelasLainnya];
