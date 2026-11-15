# Rafli Sahrul — Portfolio (`www.raflisahrul.my.id`)

Editorial personal portfolio for **Rafli Sahrul** (Software & AI Engineer), built with Astro, Tailwind CSS v4, TypeScript, and Bun.

## Local Development (Bun only)

```sh
bun install
bun run dev
bun run check
bun run build
bun run preview
bun run test
```

- Runtime and package manager: **Bun** (pinned in `.bun-version` at `1.4.4`; `bunfig.toml` enforces `[run] bun = true` so framework CLIs run on Bun rather than Node).
- No `node`, `npm`, `npx`, `pnpm`, or `yarn` is required or invoked.

## Resolved Dependency Versions

| Package | Version |
|---|---|
| `astro` | `7.4.12` |
| `@astrojs/sitemap` | `3.7.5` |
| `@astrojs/check` | `0.9.12` |
| `typescript` | `6.0.3` (`@astrojs/check` requires TS 6; TS 7.0 is not yet supported by `astro check`) |
| `tailwindcss` | `4.3.5` |
| `@tailwindcss/vite` | `4.3.5` |
| `sharp` | `0.35.5` |
| `@fontsource-variable/inter` | `5.3.0` |
| `@fontsource-variable/jetbrains-mono` | `5.3.0` |
| `playwright` (dev) | `1.65.1` |
| `axe-core` (dev) | `4.14.0` |
| `@types/bun` (dev) | `1.4.4` |

## Cloudflare Pages Deployment

### Build Settings
- **Framework preset:** Astro (or None)
- **Build command:** `bun run build`
- **Build output directory:** `dist`
- **Environment variables:** set `BUN_VERSION` to `1.4.4` (do **not** set `NODE_VERSION`)

### Custom Domain & Apex Redirect (`raflisahrul.my.id` -> `www.raflisahrul.my.id`)
1. Ensure the DNS zone for `raflisahrul.my.id` uses Cloudflare nameservers (required for proxied Redirect Rules).
2. In Cloudflare Dashboard under **Workers & Pages** -> your Pages project -> **Custom domains**, add `www.raflisahrul.my.id` (creates a proxied `CNAME` to `<project>.pages.dev`).
3. In DNS, add a proxied placeholder record for the apex `@` (`A` `192.0.2.1` or `AAAA` `100::`, proxied) if no origin record exists.
4. Create a **Single Redirect** rule (Rules -> Redirect Rules) matching `http.host eq "raflisahrul.my.id"` to `https://www.raflisahrul.my.id${http.request.uri.path}` with status `301` (Preserve query string enabled).
5. Optionally add a **Bulk Redirect** from `<project>.pages.dev/*` to `https://www.raflisahrul.my.id/$1` (301) in addition to the `X-Robots-Tag: noindex` header in `public/_headers`.

## Optional Assets (Omitted When Absent)

- `public/resume.pdf` — not present (the `Resume (PDF)` link is omitted; never copy `C:\Projects\assets\resume.pdf` directly as it contains private phone data).
- `public/og-image.png` (1200x630) — not present (`og:image` / `twitter:image` are omitted and `twitter:card` falls back to `summary`).
- `src/assets/projects/` — no project screenshots added yet; architecture-heavy projects (`BrandMuse`, `RT Online`) render monochrome inline-SVG diagrams.

## Known Limitations Under Bun

- `bunx --bun playwright install chromium` failed on Windows because Playwright's `oopBrowserDownload.js` passes `@<absolute-path>` arguments that Bun's CLI interprets as a git package specifier (`error: "git clone" for "@C:/..." failed`). `tests/browser.test.ts` resolves this cleanly under Bun by falling back to system Chrome/Edge (`executablePath`).

## Manual Verification Checklist

- [ ] Inspect responsive layout and wordmark proportion at `320px`, `375px`, `768px`, `1280px`, `1440px`, and `1920px`.
- [ ] Verify keyboard-only navigation (`Tab`, `Shift+Tab`, `Enter`, `Space`) from the skip link through `#contact`, confirming focus rings are visible and unobstructed on both `#FFFFFF` and `#000000` backgrounds.
- [ ] Verify 200% browser text zoom without clipping or horizontal overflow.
- [ ] Verify screen reader announcements (NVDA / VoiceOver / Narrator) for landmarks, heading hierarchy, external link cues, and the `Copy email` status live region.
- [ ] Verify `prefers-reduced-motion: reduce` disables entrance and hover transitions while keeping all content visible.
