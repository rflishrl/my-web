import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  site: 'https://www.raflisahrul.my.id',
  trailingSlash: 'never',
  build: {
    inlineStylesheets: 'always',
  },
  markdown: {
    syntaxHighlight: false,
  },
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self'",
        "font-src 'self'",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'none'",
        "form-action 'self'",
      ],
      scriptDirective: {
        resources: ["'self'", "'inline-speculation-rules'"],
      },
      styleDirective: {
        resources: ["'self'"],
      },
    },
  },
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
    build: {
      assetsInlineLimit: 0,
    },
  },
});
