import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { chromium, type Browser } from 'playwright';

const distDir = path.join(process.cwd(), 'dist');
const axeSource = fs.readFileSync(
  path.join(process.cwd(), 'node_modules', 'axe-core', 'axe.min.js'),
  'utf8',
);

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

let server: ReturnType<typeof Bun.serve>;
let baseUrl: string;
let browser: Browser;

function findSystemBrowser(): string | undefined {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  return candidates.find((p) => fs.existsSync(p));
}

beforeAll(async () => {
  server = Bun.serve({
    port: 0,
    fetch(req) {
      const reqPath = new URL(req.url).pathname;
      const safePath = reqPath === '/' ? 'index.html' : reqPath.replace(/^\/+/, '');
      let filePath = path.join(distDir, safePath);
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(distDir, '404.html');
        return new Response(Bun.file(filePath), {
          status: 404,
          headers: { 'content-type': 'text/html; charset=utf-8' },
        });
      }
      const ext = path.extname(filePath).toLowerCase();
      return new Response(Bun.file(filePath), {
        headers: { 'content-type': MIME_TYPES[ext] ?? 'application/octet-stream' },
      });
    },
  });
  baseUrl = `http://127.0.0.1:${server.port}`;

  try {
    browser = await chromium.launch({ headless: true });
  } catch {
    const executablePath = findSystemBrowser();
    if (!executablePath) {
      throw new Error('No Chromium executable available for Playwright.');
    }
    browser = await chromium.launch({ executablePath, headless: true });
  }
});

afterAll(async () => {
  await browser?.close();
  server?.stop(true);
});

describe('Browser verification against built dist/', () => {
  test('zero horizontal overflow across viewports and calibrated wordmark width', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    const thirdPartyRequests: string[] = [];
    const pageErrors: string[] = [];
    page.on('request', (req) => {
      const reqUrl = new URL(req.url());
      if (reqUrl.origin !== baseUrl) {
        thirdPartyRequests.push(req.url());
      }
    });
    page.on('pageerror', (err) => pageErrors.push(err.message));

    const widths = [320, 375, 768, 1280, 1440, 1920];
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(baseUrl, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);

      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth);

      if (width >= 1280) {
        const ratio = await page.evaluate(() => {
          const h1 = document.querySelector('h1.hero-wordmark');
          const container = h1?.parentElement;
          if (!h1 || !container) return 0;

          const styles = getComputedStyle(container);
          const containerInnerWidth =
            container.getBoundingClientRect().width -
            parseFloat(styles.paddingLeft) -
            parseFloat(styles.paddingRight);

          const range = document.createRange();
          range.selectNodeContents(h1);
          const textWidth = range.getBoundingClientRect().width;
          return (textWidth / containerInnerWidth) * 100;
        });

        expect(ratio).toBeGreaterThanOrEqual(97);
        expect(ratio).toBeLessThanOrEqual(100);
      }
    }

    expect(thirdPartyRequests).toEqual([]);
    expect(pageErrors).toEqual([]);
    await context.close();
  });

  test('axe-core WCAG 2.2 AA audit, skip link, and interactive controls', async () => {
    const context = await browser.newContext({
      permissions: ['clipboard-read', 'clipboard-write'],
    });
    const page = await context.newPage();
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);

    // First Tab stop must be the skip link
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() => ({
      className: document.activeElement?.className ?? '',
      href: document.activeElement?.getAttribute('href') ?? '',
    }));
    expect(firstFocused.className).toContain('skip-link');
    expect(firstFocused.href).toBe('#main-content');

    // Run axe-core WCAG 2.0/2.1/2.2 AA
    await page.addScriptTag({ content: axeSource });
    const results = await page.evaluate(async () => {
      // @ts-expect-error injected via addScriptTag
      return await window.axe.run(document, {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'],
        },
      });
    });

    expect(results.violations).toEqual([]);

    // Exercise navigation anchor links
    const navLinks = page.locator('nav[aria-label="Primary"] a');
    expect(await navLinks.count()).toBe(7);
    await navLinks.first().click();
    expect(page.url()).toContain('#about');

    // Copy email buttons become visible under JS and announce on click
    const copyBtns = page.locator('[data-copy-email]');
    expect(await copyBtns.count()).toBe(2);
    expect(await copyBtns.first().isVisible()).toBe(true);
    await copyBtns.first().click();
    await copyBtns.nth(1).click();
    await page.waitForFunction(() =>
      Array.from(document.querySelectorAll('[data-copy-email]')).every(
        (el) => el.textContent?.trim() === 'Copied',
      ),
    );
    const statusText = await page.locator('#copy-status').textContent();
    expect(statusText?.length).toBeGreaterThan(0);

    // Portrait image decodes cleanly inside the About squircle
    const portrait = page.locator('#about img');
    await portrait.scrollIntoViewIfNeeded();
    const portraitMetrics = await portrait.evaluate(async (img: HTMLImageElement) => {
      await img.decode();
      const r = img.getBoundingClientRect();
      return { complete: img.complete, naturalWidth: img.naturalWidth, width: r.width, height: r.height };
    });
    expect(portraitMetrics.complete).toBe(true);
    expect(portraitMetrics.naturalWidth).toBeGreaterThan(0);
    expect(portraitMetrics.width).toBeGreaterThanOrEqual(200);
    expect(portraitMetrics.height).toBeGreaterThanOrEqual(200);

    // Every architecture SVG keeps all text labels non-overlapping and inside bounds
    const diagramOverlaps = await page.evaluate(() => {
      const issues: string[] = [];
      for (const svg of document.querySelectorAll('svg[role="img"]')) {
        const svgRect = svg.getBoundingClientRect();
        const texts = Array.from(svg.querySelectorAll('text')).map((el) => ({
          text: el.textContent?.trim() ?? '',
          rect: el.getBoundingClientRect(),
        }));
        for (let i = 0; i < texts.length; i++) {
          const a = texts[i]!;
          if (a.rect.left < svgRect.left || a.rect.right > svgRect.right) {
            issues.push(`Out of bounds: "${a.text}"`);
          }
          for (let j = i + 1; j < texts.length; j++) {
            const b = texts[j]!;
            const overlap =
              a.rect.left < b.rect.right &&
              a.rect.right > b.rect.left &&
              a.rect.top < b.rect.bottom &&
              a.rect.bottom > b.rect.top;
            if (overlap) issues.push(`Overlap: "${a.text}" vs "${b.text}"`);
          }
        }
      }
      return issues;
    });
    expect(diagramOverlaps).toEqual([]);

    expect(consoleErrors).toEqual([]);
    await context.close();
  }, 15000);
});
