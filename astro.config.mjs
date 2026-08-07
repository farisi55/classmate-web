import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// Static-first build (see knowledge.md §3 Architecture: Astro over Next.js,
// content-heavy site, JS minimal). Deployed to Cloudflare Pages. The two
// dynamic endpoints (/api/ticker, /api/admin/ticker) are Cloudflare Pages
// Functions living in /functions at the project root — a platform feature
// independent of Astro's build, so no SSR adapter is required here.
export default defineConfig({
  site: 'https://classmate-web.pages.dev',
  output: 'static',
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false, // we ship our own reset in src/styles/global.css
    }),
  ],
  i18n: {
    defaultLocale: 'id',
    locales: ['id', 'en'],
    routing: {
      prefixDefaultLocale: false, // id lives at "/", en lives at "/en/"
    },
  },
});
