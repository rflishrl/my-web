import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { chromium, webkit, type Browser } from 'playwright';

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

    // Exercise primary section navigation anchor links (8 items inside always-on pill)
    const navLinks = page.locator('nav[aria-label="Primary"] [data-nav-section]');
    expect(await navLinks.count()).toBe(8);
    await page.locator('nav[aria-label="Primary"] [data-nav-section="about"]').click();
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

  test('floating navbar desktop always-on reveal, bidirectional scroll-spy, sliding indicator, and responsive modes', async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(baseUrl, { waitUntil: 'networkidle' });

    const nav = page.locator('#floating-nav');
    const indicator = page.locator('.floating-nav-indicator');

    // Desktop initial hero state: floating nav always visible and clearing Hero eyebrow
    expect(await nav.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
    expect(await nav.evaluate((el) => (el as HTMLElement).inert)).toBe(false);
    expect(await page.locator('[data-nav-section="hero"]').getAttribute('aria-current')).toBe('true');
    const desktopHeroMetrics = await page.evaluate(() => ({
      navBottom: document.getElementById('floating-nav')?.getBoundingClientRect().bottom ?? 999,
      eyebrowTop: document.querySelector('#hero span')?.getBoundingClientRect().top ?? 0,
    }));
    expect(desktopHeroMetrics.eyebrowTop).toBeGreaterThan(desktopHeroMetrics.navBottom);

    // Scroll down to #education then up into #experience: active indicator updates bidirectionally
    await page.evaluate(() => {
      document.getElementById('education')?.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await page.waitForTimeout(200);
    expect(await page.locator('[data-nav-section="education"]').getAttribute('aria-current')).toBe('true');

    await page.evaluate(() => {
      document.getElementById('experience')?.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await page.waitForTimeout(250);
    expect(await page.locator('[data-nav-section="experience"]').getAttribute('aria-current')).toBe('true');

    const expIndX = await indicator.evaluate((el) => parseFloat(getComputedStyle(el).getPropertyValue('--ind-x')));
    expect(Number.isFinite(expIndX)).toBe(true);

    // Pointer hover glides sliding indicator to hovered item, then returns on leave
    const projectsLink = page.locator('[data-nav-section="projects"]');
    await projectsLink.hover();
    await page.waitForTimeout(150);
    const projIndX = await indicator.evaluate((el) => parseFloat(getComputedStyle(el).getPropertyValue('--ind-x')));
    expect(projIndX).toBeGreaterThan(expIndX);

    await page.mouse.move(10, 10);
    await page.waitForTimeout(150);
    const restoredIndX = await indicator.evaluate((el) => parseFloat(getComputedStyle(el).getPropertyValue('--ind-x')));
    expect(Math.abs(restoredIndX - expIndX)).toBeLessThan(2);

    // Tablet (768px) & Foldable (640px) top floating pill fits cleanly with zero horizontal overflow
    for (const width of [768, 640]) {
      await page.setViewportSize({ width, height: 860 });
      await page.waitForTimeout(150);
      const metrics = await page.evaluate(() => {
        const navEl = document.getElementById('floating-nav');
        const navRect = navEl?.getBoundingClientRect();
        const links = Array.from(document.querySelectorAll('.floating-nav-link'));
        const wrapped = links.some((el) => el.getBoundingClientRect().height > 56);
        return {
          docOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          navWidth: navRect?.width ?? 0,
          navTop: navRect?.top ?? 999,
          viewportWidth: window.innerWidth,
          wrapped,
        };
      });
      expect(metrics.docOverflow).toBe(false);
      expect(metrics.wrapped).toBe(false);
      expect(metrics.navWidth).toBeLessThanOrEqual(metrics.viewportWidth - 16);
      expect(metrics.navTop).toBeLessThan(40);
    }

    // Mobile (375px) top pill & downward popover open below trigger, then navigation closes it
    await page.setViewportSize({ width: 375, height: 812 });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(150);

    const trigger = page.locator('#floating-nav-trigger');
    await trigger.click();
    await page.waitForTimeout(150);
    expect(await trigger.getAttribute('aria-expanded')).toBe('true');

    const mobilePos = await page.evaluate(() => {
      const navEl = document.getElementById('floating-nav');
      const panelEl = document.getElementById('floating-nav-panel');
      return {
        navTop: navEl?.getBoundingClientRect().top ?? 999,
        navBottom: navEl?.getBoundingClientRect().bottom ?? 0,
        panelTop: panelEl?.getBoundingClientRect().top ?? 0,
      };
    });
    expect(mobilePos.navTop).toBeLessThan(40);
    expect(mobilePos.panelTop).toBeGreaterThanOrEqual(mobilePos.navBottom);

    await projectsLink.click();
    await page.waitForTimeout(250);
    expect(await trigger.getAttribute('aria-expanded')).toBe('false');

    // Simulated notched phone portrait (393x852, safe-area-inset-top: 59px) & landscape (852x393, left/right: 59px)
    const cdp = await context.newCDPSession(page);
    await page.setViewportSize({ width: 393, height: 852 });
    await cdp.send('Emulation.setSafeAreaInsetsOverride', {
      insets: { top: 59, bottom: 34, left: 0, right: 0 },
    });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(150);

    const notchPortrait = await page.evaluate(() => {
      const navEl = document.getElementById('floating-nav');
      const heroEyebrow = document.querySelector('#hero span');
      const navRect = navEl?.getBoundingClientRect();
      return {
        navTop: navRect?.top ?? 0,
        navBottom: navRect?.bottom ?? 999,
        eyebrowTop: heroEyebrow?.getBoundingClientRect().top ?? 0,
      };
    });
    expect(notchPortrait.navTop).toBeGreaterThanOrEqual(59);
    expect(notchPortrait.eyebrowTop).toBeGreaterThan(notchPortrait.navBottom);

    await page.setViewportSize({ width: 852, height: 393 });
    await cdp.send('Emulation.setSafeAreaInsetsOverride', {
      insets: { top: 0, bottom: 21, left: 59, right: 59 },
    });
    await page.waitForTimeout(150);
    const notchLandscape = await page.evaluate(() => {
      const navRect = document.getElementById('floating-nav')?.getBoundingClientRect();
      const eyebrowTop = document.querySelector('#hero span')?.getBoundingClientRect().top ?? 0;
      return {
        navLeft: navRect?.left ?? 0,
        navRight: navRect?.right ?? 999,
        navBottom: navRect?.bottom ?? 999,
        eyebrowTop,
        docOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });
    expect(notchLandscape.navLeft).toBeGreaterThanOrEqual(59);
    expect(notchLandscape.navRight).toBeLessThanOrEqual(852 - 59);
    expect(notchLandscape.eyebrowTop).toBeGreaterThan(notchLandscape.navBottom);
    expect(notchLandscape.docOverflow).toBe(false);

    await context.close();
  }, 15000);

  test('webkit: desktop always-on navbar, sliding pill, tablet/foldable fit, and mobile touch popover', async () => {
    expect(fs.existsSync(webkit.executablePath())).toBe(true);
    const wkBrowser = await webkit.launch({ headless: true });

    try {
      // Desktop 1440x900
      const dCtx = await wkBrowser.newContext({ viewport: { width: 1440, height: 900 } });
      const dPage = await dCtx.newPage();
      await dPage.goto(baseUrl, { waitUntil: 'networkidle' });

      const nav = dPage.locator('#floating-nav');
      const indicator = dPage.locator('.floating-nav-indicator');
      expect(await nav.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
      expect(await dPage.locator('[data-nav-section="hero"]').getAttribute('aria-current')).toBe('true');

      await dPage.evaluate(() => {
        document.getElementById('experience')?.scrollIntoView({ behavior: 'instant', block: 'start' });
      });
      await dPage.waitForTimeout(350);

      expect(await dPage.locator('[data-nav-section="experience"]').getAttribute('aria-current')).toBe('true');

      const expIndX = await indicator.evaluate((el) => parseFloat(getComputedStyle(el).getPropertyValue('--ind-x')));
      await dPage.locator('[data-nav-section="projects"]').hover();
      await dPage.waitForTimeout(200);
      const projIndX = await indicator.evaluate((el) => parseFloat(getComputedStyle(el).getPropertyValue('--ind-x')));
      expect(projIndX).toBeGreaterThan(expIndX);

      // Tablet (768px) & Foldable (640px) top floating pill fit cleanly
      for (const width of [768, 640]) {
        await dPage.setViewportSize({ width, height: 860 });
        await dPage.waitForTimeout(200);
        const wkMetrics = await dPage.evaluate(() => {
          const navRect = document.getElementById('floating-nav')?.getBoundingClientRect();
          const wrapped = Array.from(document.querySelectorAll('.floating-nav-link')).some(
            (el) => el.getBoundingClientRect().height > 56,
          );
          return {
            docOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
            navTop: navRect?.top ?? 999,
            navWidth: navRect?.width ?? 0,
            vw: window.innerWidth,
            wrapped,
          };
        });
        expect(wkMetrics.docOverflow).toBe(false);
        expect(wkMetrics.wrapped).toBe(false);
        expect(wkMetrics.navTop).toBeLessThan(40);
        expect(wkMetrics.navWidth).toBeLessThanOrEqual(wkMetrics.vw - 16);
      }
      await dCtx.close();

      // Mobile touch WebKit (390x844, hasTouch: true)
      const mCtx = await wkBrowser.newContext({
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
      });
      const mPage = await mCtx.newPage();
      await mPage.goto(baseUrl, { waitUntil: 'networkidle' });
      await mPage.waitForTimeout(200);

      const heroCheck = await mPage.evaluate(() => {
        const navRect = document.getElementById('floating-nav')?.getBoundingClientRect();
        const eyebrowRect = document.querySelector('#hero span')?.getBoundingClientRect();
        return {
          docOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          navTop: navRect?.top ?? 999,
          navBottom: navRect?.bottom ?? 999,
          eyebrowTop: eyebrowRect?.top ?? 0,
        };
      });
      expect(heroCheck.docOverflow).toBe(false);
      expect(heroCheck.navTop).toBeLessThan(40);
      expect(heroCheck.eyebrowTop).toBeGreaterThan(heroCheck.navBottom);

      const trigger = mPage.locator('#floating-nav-trigger');
      await trigger.tap();
      await mPage.waitForTimeout(250);
      expect(await trigger.getAttribute('aria-expanded')).toBe('true');

      const openRects = await mPage.evaluate(() => ({
        navBottom: document.getElementById('floating-nav')?.getBoundingClientRect().bottom ?? 999,
        panelTop: document.getElementById('floating-nav-panel')?.getBoundingClientRect().top ?? 0,
      }));
      expect(openRects.panelTop).toBeGreaterThanOrEqual(openRects.navBottom);

      await mPage.locator('[data-nav-section="projects"]').tap();
      await mPage.waitForTimeout(800);
      expect(await trigger.getAttribute('aria-expanded')).toBe('false');
      expect(await mPage.evaluate(() => window.scrollY)).toBeGreaterThan(400);

      await mCtx.close();
    } finally {
      await wkBrowser.close();
    }
  }, 20000);
});
