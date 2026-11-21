import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { chromium, webkit, type Browser, type Page } from 'playwright';

const distDir = path.join(process.cwd(), 'dist');
const axeSource = fs.readFileSync(
  path.join(process.cwd(), 'node_modules', 'axe-core', 'axe.min.js'),
  'utf8',
);

const SAFE_AREA_OVERRIDE_CSS =
  ':root { --safe-top: 62px; --safe-right: 59px; --safe-bottom: 34px; --safe-left: 59px; }';

const WCAG_TEXT_SPACING_CSS = `
  * {
    line-height: 1.5 !important;
    letter-spacing: 0.12em !important;
    word-spacing: 0.16em !important;
  }
  p {
    margin-bottom: 2em !important;
  }
`;

const EXPECTED_NAV_LABELS = [
  'About',
  'Experience',
  'Education',
  'Stack',
  'Certs',
  'Projects',
  'Contact',
];
const EXPECTED_NAV_HREFS = [
  '#about',
  '#experience',
  '#education',
  '#stack',
  '#certifications',
  '#projects',
  '#contact',
];

const VIEWPORTS: Array<[number, number]> = [
  [320, 568],
  [359, 800],
  [360, 800],
  [382, 368],
  [382, 802],
  [393, 852],
  [402, 874],
  [430, 932],
  [639, 800],
  [640, 599],
  [640, 600],
  [744, 1133],
  [820, 1180],
  [852, 393],
  [932, 430],
  [951, 902],
  [1024, 768],
  [1024, 1366],
  [1180, 820],
  [1280, 599],
  [1280, 720],
  [1440, 900],
  [1920, 1080],
];

const COMPACT_STICKY_VIEWPORTS: Array<[number, number]> = [
  [402, 874],
  [393, 852],
  [430, 932],
  [382, 802],
  [360, 800],
  [639, 800],
];

const FULL_STICKY_VIEWPORTS: Array<[number, number]> = [
  [640, 600],
  [820, 1180],
  [1024, 768],
  [1180, 820],
  [1280, 720],
  [1440, 900],
  [1920, 1080],
];

const STATIC_VIEWPORTS: Array<[number, number]> = [
  [359, 800],
  [320, 568],
  [852, 393],
  [932, 430],
  [640, 599],
  [1280, 599],
];

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

async function waitForPageReady(page: Page, width: number, height: number, injectSafeArea = false) {
  await page.setViewportSize({ width, height });
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  if (injectSafeArea) {
    await page.addStyleTag({ content: SAFE_AREA_OVERRIDE_CSS });
  }
  await page.evaluate(() => document.fonts.ready);
}

beforeAll(async () => {
  server = Bun.serve({
    port: 0,
    fetch(req) {
      const reqPath = new URL(req.url).pathname;
      const safePath = reqPath === '/' ? 'index.html' : reqPath.replace(/^\/+/, '');
      let filePath = path.join(distDir, safePath);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }
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
  test('zero horizontal overflow, no clipped content across all viewports, and calibrated wordmark width', async () => {
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

    for (const [width, height] of VIEWPORTS) {
      await waitForPageReady(page, width, height);

      const layout = await page.evaluate(() => {
        const vw = window.innerWidth;
        const overflow = document.documentElement.scrollWidth > vw;
        const clipped: string[] = [];
        for (const el of document.querySelectorAll<HTMLElement>(
          'h1, h2, h3, h4, p, li, a, button, summary, dt, dd',
        )) {
          if (
            el.closest('.sr-only') ||
            el.classList.contains('sr-only') ||
            el.classList.contains('skip-link')
          ) {
            continue;
          }
          const style = getComputedStyle(el);
          if (style.display === 'none' || el.offsetParent === null) continue;
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;
          if (rect.left < -0.5 || rect.right > vw + 0.5) {
            clipped.push(
              `${el.tagName}:${el.textContent?.trim().slice(0, 30)} (${rect.left.toFixed(1)}..${rect.right.toFixed(1)} vs ${vw})`,
            );
          }
          if (
            (style.overflowX === 'hidden' || style.overflowX === 'clip') &&
            el.scrollWidth > el.clientWidth + 1
          ) {
            clipped.push(`clipped-x:${el.tagName}:${el.textContent?.trim().slice(0, 30)}`);
          }
        }
        return { overflow, clipped };
      });
      expect(layout.overflow).toBe(false);
      expect(layout.clipped).toEqual([]);

      if (width >= 640) {
        const wordmarkLineCount = await page.evaluate(() => {
          const lines = Array.from(document.querySelectorAll('h1.hero-wordmark .wm-line'));
          return new Set(lines.map((el) => Math.round(el.getBoundingClientRect().top))).size;
        });
        expect(wordmarkLineCount).toBe(1);
      }

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
  }, 30000);

  test('navigation mode matrix (compact sticky, full sticky, static)', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(baseUrl, { waitUntil: 'networkidle' });

    const getModeState = () =>
      page.evaluate(() => {
        const header = document.querySelector('.site-header')!;
        const navFull = document.querySelector('.nav-full')!;
        const navCompact = document.querySelector('.nav-compact')!;
        const sectionName = document.querySelector('.section-name')!;
        const backToTop = document.querySelector('.back-to-top')!;
        return {
          headerPos: getComputedStyle(header).position,
          navFullDisplay: getComputedStyle(navFull).display,
          navCompactDisplay: getComputedStyle(navCompact).display,
          sectionNameDisplay: getComputedStyle(sectionName).display,
          backToTopDisplay: getComputedStyle(backToTop).display,
        };
      });

    for (const [w, h] of COMPACT_STICKY_VIEWPORTS) {
      await page.setViewportSize({ width: w, height: h });
      const state = await getModeState();
      expect(state.headerPos).toBe('sticky');
      expect(state.navFullDisplay).toBe('none');
      expect(state.navCompactDisplay).toBe('flex');
      expect(state.sectionNameDisplay).not.toBe('none');
      expect(state.backToTopDisplay).toBe('none');
    }

    for (const [w, h] of FULL_STICKY_VIEWPORTS) {
      await page.setViewportSize({ width: w, height: h });
      const state = await getModeState();
      expect(state.headerPos).toBe('sticky');
      expect(state.navFullDisplay).toBe('flex');
      expect(state.navCompactDisplay).toBe('none');
      expect(state.sectionNameDisplay).not.toBe('none');
      expect(state.backToTopDisplay).toBe('none');
    }

    for (const [w, h] of STATIC_VIEWPORTS) {
      await page.setViewportSize({ width: w, height: h });
      const state = await getModeState();
      expect(state.headerPos).toBe('static');
      expect(state.navFullDisplay).toBe('flex');
      expect(state.navCompactDisplay).toBe('none');
      expect(state.sectionNameDisplay).toBe('none');
      expect(state.backToTopDisplay).not.toBe('none');
    }

    await context.close();
  });

  test('compact sticky mode behavior, safe-area height, keyboard/tap dismiss, scroll opacity, and first-viewport hero', async () => {
    const context = await browser.newContext({ bypassCSP: true });
    const page = await context.newPage();

    // First-viewport hero check at 393x852 and 402x874 with safe-area override
    for (const [w, h] of [
      [393, 852],
      [402, 874],
    ] as const) {
      await waitForPageReady(page, w, h, true);
      const metrics = await page.evaluate(() => {
        const header = document.querySelector<HTMLElement>('.site-header')!;
        const headerRect = header.getBoundingClientRect();
        const h1 = document.querySelector<HTMLElement>('h1.hero-wordmark')!;
        const h1Rect = h1.getBoundingClientRect();
        const menuBtn = document.querySelector<HTMLElement>('.nav-menu-button')!;
        const panelLinks = Array.from(document.querySelectorAll<HTMLElement>('.nav-links a'));
        return {
          headerClientHeight: header.clientHeight,
          headerHeight: headerRect.height,
          hasBrand: document.querySelector('.nav-brand') !== null,
          menuBtnVisible: menuBtn.offsetParent !== null,
          anyPanelLinkVisible: panelLinks.some((a) => a.offsetParent !== null),
          h1Top: h1Rect.top,
          h1Bottom: h1Rect.bottom,
          headerBottom: headerRect.bottom,
          vh: window.innerHeight,
        };
      });

      expect(metrics.hasBrand).toBe(false);
      expect(metrics.menuBtnVisible).toBe(true);
      expect(metrics.anyPanelLinkVisible).toBe(false);
      expect(metrics.headerClientHeight).toBe(44 + 62);
      expect(metrics.headerHeight).toBeLessThanOrEqual(44 + 62 + 1);
      if (w === 402) {
        expect(metrics.headerHeight / metrics.vh).toBeLessThanOrEqual(0.135);
      }
      expect(metrics.h1Top).toBeGreaterThanOrEqual(metrics.headerBottom);
      expect(metrics.h1Bottom).toBeLessThanOrEqual(metrics.vh);
    }

    // Open via click, Enter, and Space; check panel opacity, link order, height >= 44px, and close triggers
    const menuBtn = page.locator('.nav-menu-button');
    const navPanel = page.locator('ul.nav-links');
    const isPanelOpen = () => navPanel.evaluate((el) => el.matches(':popover-open'));

    await menuBtn.click();
    expect(await isPanelOpen()).toBe(true);
    expect(await menuBtn.getAttribute('aria-expanded')).toBe('true');

    const panelMetrics = await page.evaluate(() => {
      const panel = document.querySelector<HTMLElement>('.nav-links')!;
      const panelStyle = getComputedStyle(panel);
      const panelRect = panel.getBoundingClientRect();
      const links = Array.from(panel.querySelectorAll<HTMLAnchorElement>('a'));
      return {
        bg: panelStyle.backgroundColor,
        backdrop: panelStyle.backdropFilter,
        panelLeft: panelRect.left,
        panelRight: panelRect.right,
        panelBottom: panelRect.bottom,
        vw: window.innerWidth,
        vh: window.innerHeight,
        labels: links.map((a) => a.textContent?.trim()),
        heights: links.map((a) => a.getBoundingClientRect().height),
      };
    });
    expect(panelMetrics.bg).toBe('rgb(255, 255, 255)');
    expect(panelMetrics.backdrop).toBe('none');
    expect(panelMetrics.panelLeft).toBeGreaterThanOrEqual(0);
    expect(panelMetrics.panelRight).toBeLessThanOrEqual(panelMetrics.vw);
    expect(panelMetrics.panelBottom).toBeLessThanOrEqual(panelMetrics.vh);
    expect(panelMetrics.labels).toEqual(EXPECTED_NAV_LABELS);
    for (const h of panelMetrics.heights) {
      expect(h).toBeGreaterThanOrEqual(44);
    }

    // Escape closes and returns focus to Menu button
    await page.keyboard.press('Escape');
    expect(await isPanelOpen()).toBe(false);
    expect(await menuBtn.getAttribute('aria-expanded')).toBe('false');
    expect(await page.evaluate(() => document.activeElement?.className ?? '')).toContain(
      'nav-menu-button',
    );

    // Space opens, tap outside closes
    await page.keyboard.press('Space');
    expect(await isPanelOpen()).toBe(true);
    await page.mouse.click(200, 500);
    expect(await isPanelOpen()).toBe(false);

    // Enter opens, focus leaving nav closes
    await menuBtn.focus();
    await page.keyboard.press('Enter');
    expect(await isPanelOpen()).toBe(true);
    await page.locator('#hero a').first().focus();
    expect(await isPanelOpen()).toBe(false);

    // Link activation closes panel and target section heading clears sticky header
    await menuBtn.click();
    expect(await isPanelOpen()).toBe(true);
    await page.locator('.nav-links a[href="#experience"]').click();
    await page.waitForTimeout(300);
    expect(await isPanelOpen()).toBe(false);
    const expCheck = await page.evaluate(() => ({
      headerBottom: document.querySelector('.site-header')!.getBoundingClientRect().bottom,
      headingTop: document.getElementById('experience-heading')!.getBoundingClientRect().top,
    }));
    expect(expCheck.headingTop).toBeGreaterThanOrEqual(expCheck.headerBottom);

    // Scroll 1500px: sticky header remains at top, opaque, no backdrop-filter
    await page.evaluate(() => window.scrollTo({ top: 1500, behavior: 'instant' }));
    const scrolledHeader = await page.evaluate(() => {
      const header = document.querySelector('.site-header')!;
      const style = getComputedStyle(header);
      return {
        top: header.getBoundingClientRect().top,
        bg: style.backgroundColor,
        backdrop: style.backdropFilter,
      };
    });
    expect(scrolledHeader.top).toBe(0);
    expect(scrolledHeader.bg).toBe('rgb(255, 255, 255)');
    expect(scrolledHeader.backdrop).toBe('none');

    await context.close();
  }, 20000);

  test('full sticky mode: scroll behavior, 25% height cap, hidden back-to-top, focus clearance, anchor targets, and 1280x720 hero', async () => {
    const context = await browser.newContext({ bypassCSP: true });
    const page = await context.newPage();

    // 1280x720 whole h1 in first viewport
    await waitForPageReady(page, 1280, 720, true);
    const hero1280 = await page.evaluate(() => ({
      headerBottom: document.querySelector('.site-header')!.getBoundingClientRect().bottom,
      h1Top: document.querySelector('h1.hero-wordmark')!.getBoundingClientRect().top,
      h1Bottom: document.querySelector('h1.hero-wordmark')!.getBoundingClientRect().bottom,
      vh: window.innerHeight,
    }));
    expect(hero1280.h1Top).toBeGreaterThanOrEqual(hero1280.headerBottom);
    expect(hero1280.h1Bottom).toBeLessThanOrEqual(hero1280.vh);

    // Scroll 1500px check
    await page.evaluate(() => window.scrollTo({ top: 1500, behavior: 'instant' }));
    const stickyCheck = await page.evaluate(() => {
      const header = document.querySelector('.site-header')!;
      const style = getComputedStyle(header);
      const rect = header.getBoundingClientRect();
      return {
        top: rect.top,
        height: rect.height,
        vh: window.innerHeight,
        bg: style.backgroundColor,
        backdrop: style.backdropFilter,
      };
    });
    expect(stickyCheck.top).toBe(0);
    expect(stickyCheck.bg).toBe('rgb(255, 255, 255)');
    expect(stickyCheck.backdrop).toBe('none');
    expect(stickyCheck.height).toBeLessThanOrEqual(stickyCheck.vh * 0.25);

    // .back-to-top not displayed and not in accessibility tree
    expect(await page.getByRole('link', { name: 'Back to top' }).count()).toBe(0);

    // Click each nav link and check first heading clears header bottom
    for (const href of EXPECTED_NAV_HREFS) {
      await page.locator(`.nav-full a[href="${href}"]`).click();
      await page.waitForTimeout(250);
      const sectionId = href.slice(1);
      const clear = await page.evaluate((id) => {
        const headerBottom = document.querySelector('.site-header')!.getBoundingClientRect().bottom;
        const section = document.getElementById(id)!;
        const heading = section.querySelector('h2, h3')!;
        return {
          headerBottom,
          headingTop: heading.getBoundingClientRect().top,
        };
      }, sectionId);
      expect(clear.headingTop).toBeGreaterThanOrEqual(clear.headerBottom);
    }

    // Tab through every focusable element: elements inside main/footer must clear sticky header minus 5px focus ring
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    const focusCount = await page.evaluate(() => {
      return document.querySelectorAll('a[href], button:not([hidden]), summary').length;
    });
    for (let i = 0; i < focusCount + 2; i += 1) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        if (el.closest('.site-header') || el.classList.contains('skip-link')) return { skip: true };
        const headerBottom = document.querySelector('.site-header')!.getBoundingClientRect().bottom;
        const rect = el.getBoundingClientRect();
        return {
          skip: false,
          tag: el.tagName,
          text: el.textContent?.trim().slice(0, 30),
          ringTop: rect.top - 5,
          headerBottom,
        };
      });
      if (focused && !focused.skip && focused.headerBottom !== undefined) {
        expect(focused.ringTop).toBeGreaterThanOrEqual(focused.headerBottom - 0.5);
      }
    }

    await context.close();
  }, 25000);

  test('static mode: Back to top visibility, coarse-pointer 44x44 target, and return to top with safe-top clearance', async () => {
    const context = await browser.newContext({
      viewport: { width: 852, height: 393 },
      hasTouch: true,
      isMobile: true,
      bypassCSP: true,
    });
    const page = await context.newPage();
    await waitForPageReady(page, 852, 393, true);

    await page.evaluate(() => {
      window.scrollTo({ top: document.documentElement.scrollHeight / 2, behavior: 'instant' });
    });

    const visibleBackLink = page.locator('#stack .back-to-top a');
    expect(await visibleBackLink.isVisible()).toBe(true);
    const box = await visibleBackLink.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);

    await visibleBackLink.click();
    await page.waitForFunction(() => window.scrollY === 0);

    const topCheck = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll<HTMLElement>('.nav-full a'));
      return {
        scrollY: window.scrollY,
        allVisible: links.every((a) => a.offsetParent !== null),
        firstLinkTop: links[0]?.getBoundingClientRect().top ?? 0,
      };
    });
    expect(topCheck.scrollY).toBeLessThanOrEqual(2);
    expect(topCheck.allVisible).toBe(true);
    expect(topCheck.firstLinkTop).toBeGreaterThanOrEqual(62);

    await context.close();
  }, 15000);

  test('safe-area insets at 852x393 and 393x852, full-bleed Contact background, and bottom clearance', async () => {
    const context = await browser.newContext({ bypassCSP: true });
    const page = await context.newPage();

    for (const [w, h] of [
      [852, 393],
      [393, 852],
    ] as const) {
      await waitForPageReady(page, w, h, true);

      const safeCheck = await page.evaluate(() => {
        const vw = window.innerWidth;
        const violations: string[] = [];
        for (const el of document.querySelectorAll<HTMLElement>(
          '.site-nav a, .site-nav button, #hero h1, #hero p, #hero a, #hero button, #about p, #about dt, #about dd, #experience h3, #experience p, #experience li, #education h3, #education p, #certifications h3, #projects h3, #projects p, #projects a, #contact h2, #contact a, #contact button',
        )) {
          if (el.offsetParent === null || el.closest('.sr-only')) continue;
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;
          if (rect.left < 58.5 || rect.right > vw - 58.5) {
            violations.push(
              `${el.tagName}:${el.textContent?.trim().slice(0, 24)} (${rect.left.toFixed(1)}..${rect.right.toFixed(1)} in ${vw})`,
            );
          }
        }
        return violations;
      });
      expect(safeCheck).toEqual([]);

      await page.evaluate(() => {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
      });

      const contactMetrics = await page.evaluate(() => {
        const footer = document.getElementById('contact')!;
        const footerRect = footer.getBoundingClientRect();
        const bottomRow = footer.querySelector<HTMLElement>('.contact-bottom')!;
        const bottomRect = bottomRow.getBoundingClientRect();
        const linkBottoms = Array.from(bottomRow.querySelectorAll<HTMLElement>('a, button')).map(
          (el) => el.getBoundingClientRect().bottom,
        );
        return {
          footerLeft: footerRect.left,
          footerRight: footerRect.right,
          footerBg: getComputedStyle(footer).backgroundColor,
          bodyRight: document.body.getBoundingClientRect().right,
          vh: window.innerHeight,
          bottomRowBottom: bottomRect.bottom,
          maxLinkBottom: Math.max(...linkBottoms),
        };
      });

      expect(contactMetrics.footerLeft).toBe(0);
      expect(contactMetrics.footerRight).toBe(contactMetrics.bodyRight);
      expect(contactMetrics.footerBg).toBe('rgb(0, 0, 0)');
      expect(contactMetrics.bottomRowBottom).toBeLessThanOrEqual(contactMetrics.vh - 34);
      expect(contactMetrics.maxLinkBottom).toBeLessThanOrEqual(contactMetrics.vh - 34);
    }

    await context.close();
  }, 15000);

  test('coarse pointer touch targets >= 44x44 CSS px', async () => {
    const context = await browser.newContext({
      viewport: { width: 393, height: 852 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    await waitForPageReady(page, 393, 852);

    // Compact mode: Menu button, open panel links, Hero links & Copy button
    await page.locator('#hero [data-copy-email]').waitFor({ state: 'visible' });
    await page.locator('.nav-menu-button').click();
    const compactTargets = await page.evaluate(() => {
      const items = [
        ...document.querySelectorAll<HTMLElement>(
          '.nav-compact a, .nav-compact button, #hero a, #hero button:not([hidden])',
        ),
      ];
      return items.map((el) => {
        const r = el.getBoundingClientRect();
        return { label: el.textContent?.trim(), w: r.width, h: r.height };
      });
    });
    for (const t of compactTargets) {
      expect(t.w).toBeGreaterThanOrEqual(44);
      expect(t.h).toBeGreaterThanOrEqual(44);
    }

    // Full mode with coarse pointer (tablet touch e.g. 820x1180)
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await page.locator('#contact [data-copy-email]').waitFor({ state: 'visible' });
    const fullTargets = await page.evaluate(() => {
      const items = [
        ...document.querySelectorAll<HTMLElement>(
          '.nav-full a, #contact .contact-bottom a, #contact .contact-bottom button:not([hidden])',
        ),
      ];
      return items.map((el) => {
        const r = el.getBoundingClientRect();
        return { label: el.textContent?.trim(), w: r.width, h: r.height };
      });
    });
    for (const t of fullTargets) {
      expect(t.w).toBeGreaterThanOrEqual(44);
      expect(t.h).toBeGreaterThanOrEqual(44);
    }

    await context.close();
  });

  test('WCAG 1.4.12 text-spacing overrides: no horizontal overflow, no overlapping nav links, and anchor clearance', async () => {
    const context = await browser.newContext({ bypassCSP: true });
    const page = await context.newPage();

    for (const [w, h] of [
      [320, 568],
      [393, 852],
      [820, 1180],
      [1440, 900],
    ] as const) {
      await waitForPageReady(page, w, h, w >= 640);
      await page.addStyleTag({ content: WCAG_TEXT_SPACING_CSS });

      const spacingCheck = await page.evaluate(() => {
        const overflow = document.documentElement.scrollWidth > window.innerWidth;
        const navLinks = Array.from(document.querySelectorAll<HTMLElement>('.nav-full a')).filter(
          (el) => el.offsetParent !== null,
        );
        const overlaps: string[] = [];
        for (let i = 0; i < navLinks.length; i += 1) {
          const a = navLinks[i]!.getBoundingClientRect();
          for (let j = i + 1; j < navLinks.length; j += 1) {
            const b = navLinks[j]!.getBoundingClientRect();
            if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) {
              overlaps.push(`${navLinks[i]!.textContent} vs ${navLinks[j]!.textContent}`);
            }
          }
        }
        return { overflow, overlaps };
      });
      expect(spacingCheck.overflow).toBe(false);
      expect(spacingCheck.overlaps).toEqual([]);

      if (w >= 640) {
        await page.locator('.nav-full a[href="#education"]').click();
        await page.waitForTimeout(250);
        const anchorClear = await page.evaluate(() => ({
          headerBottom: document.querySelector('.site-header')!.getBoundingClientRect().bottom,
          headingTop: document.getElementById('education-heading')!.getBoundingClientRect().top,
        }));
        expect(anchorClear.headingTop).toBeGreaterThanOrEqual(anchorClear.headerBottom);
      }
    }

    await context.close();
  });

  test('axe-core WCAG 2.2 AA audit (393 closed/open, 820, 1440), skip link, and interactive controls', async () => {
    const context = await browser.newContext({
      permissions: ['clipboard-read', 'clipboard-write'],
      bypassCSP: true,
    });
    const page = await context.newPage();
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // 393x852 closed & open
    await waitForPageReady(page, 393, 852);
    await page.addScriptTag({ content: axeSource });
    const axe393Closed = await page.evaluate(async () => {
      // @ts-expect-error injected via addScriptTag
      return await window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
      });
    });
    expect(axe393Closed.violations).toEqual([]);

    await page.locator('.nav-menu-button').click();
    const axe393Open = await page.evaluate(async () => {
      // @ts-expect-error injected via addScriptTag
      return await window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
      });
    });
    expect(axe393Open.violations).toEqual([]);

    // 820x1180
    await waitForPageReady(page, 820, 1180);
    await page.addScriptTag({ content: axeSource });
    const axe820 = await page.evaluate(async () => {
      // @ts-expect-error injected via addScriptTag
      return await window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
      });
    });
    expect(axe820.violations).toEqual([]);

    // 1440x900: axe-core at rest, then verify first Tab stop is skip link, Copy email, Portrait, Architecture SVGs
    await waitForPageReady(page, 1440, 900);
    await page.addScriptTag({ content: axeSource });
    const axe1440 = await page.evaluate(async () => {
      // @ts-expect-error injected via addScriptTag
      return await window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
      });
    });
    expect(axe1440.violations).toEqual([]);

    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() => ({
      className: document.activeElement?.className ?? '',
      href: document.activeElement?.getAttribute('href') ?? '',
    }));
    expect(firstFocused.className).toContain('skip-link');
    expect(firstFocused.href).toBe('#main-content');

    // Copy email buttons hydrate cleanly (client:idle) and announce in adjacent role="status"
    const copyBtns = page.locator('[data-copy-email]');
    expect(await copyBtns.count()).toBe(2);
    await copyBtns.first().waitFor({ state: 'visible' });
    await copyBtns.first().click();
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await copyBtns.nth(1).waitFor({ state: 'visible' });
    await copyBtns.nth(1).click();
    await page.waitForFunction(() =>
      Array.from(document.querySelectorAll('[data-copy-status]')).every(
        (el) => el.textContent?.trim() === 'Copied',
      ),
    );
    const buttonLabels = await copyBtns.allTextContents();
    expect(buttonLabels.map((s) => s.trim())).toEqual(['Copy email', 'Copy email']);

    // Portrait image decodes cleanly
    const portrait = page.locator('#about img');
    await portrait.scrollIntoViewIfNeeded();
    const portraitMetrics = await portrait.evaluate(async (img: HTMLImageElement) => {
      await img.decode();
      const r = img.getBoundingClientRect();
      return {
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        width: r.width,
        height: r.height,
      };
    });
    expect(portraitMetrics.complete).toBe(true);
    expect(portraitMetrics.naturalWidth).toBeGreaterThan(0);
    expect(portraitMetrics.width).toBeGreaterThanOrEqual(200);
    expect(portraitMetrics.height).toBeGreaterThanOrEqual(200);

    // Architecture SVG labels non-overlapping and inside bounds
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
  }, 20000);

  test('webkit: full sticky desktop and compact sticky mobile touch menu', async () => {
    expect(fs.existsSync(webkit.executablePath())).toBe(true);
    const wkBrowser = await webkit.launch({ headless: true });

    try {
      const dCtx = await wkBrowser.newContext({ viewport: { width: 1440, height: 900 } });
      const dPage = await dCtx.newPage();
      await waitForPageReady(dPage, 1440, 900);

      await dPage.evaluate(() => window.scrollTo({ top: 1500, behavior: 'instant' }));
      expect(
        await dPage.locator('.site-header').evaluate((el) => el.getBoundingClientRect().top),
      ).toBe(0);
      await dPage.locator('.nav-full a[href="#projects"]').click();
      await dPage.waitForTimeout(300);
      expect(await dPage.evaluate(() => window.scrollY)).toBeGreaterThan(400);
      await dCtx.close();

      const mCtx = await wkBrowser.newContext({
        viewport: { width: 393, height: 852 },
        hasTouch: true,
        isMobile: true,
        bypassCSP: true,
      });
      const mPage = await mCtx.newPage();
      await waitForPageReady(mPage, 393, 852, true);

      const menuBtn = mPage.locator('.nav-menu-button');
      const navPanel = mPage.locator('ul.nav-links');
      await menuBtn.tap();
      expect(await navPanel.evaluate((el) => el.matches(':popover-open'))).toBe(true);

      await mPage.locator('.nav-links a[href="#projects"]').tap();
      await mPage.waitForTimeout(400);
      expect(await navPanel.evaluate((el) => el.matches(':popover-open'))).toBe(false);
      expect(await mPage.evaluate(() => window.scrollY)).toBeGreaterThan(400);
      await mCtx.close();
    } finally {
      await wkBrowser.close();
    }
  }, 20000);

  test('featured projects on / and full project list on /projects', async () => {
    const context = await browser.newContext({ bypassCSP: true });
    const page = await context.newPage();

    await waitForPageReady(page, 1440, 900);
    expect(await page.locator('#projects article').count()).toBe(3);

    const viewAllBtn = page.locator('#projects a[href="/projects"]');
    expect(await viewAllBtn.isVisible()).toBe(true);
    const btnBox = await viewAllBtn.boundingBox();
    expect(btnBox!.height).toBeGreaterThanOrEqual(44);

    await viewAllBtn.click();
    await page.waitForURL(`${baseUrl}/projects`);
    await page.evaluate(() => document.fonts.ready);

    expect(await page.locator('#projects article').count()).toBe(5);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);

    await page.addScriptTag({ content: axeSource });
    const axeProjects = await page.evaluate(async () => {
      // @ts-expect-error injected via addScriptTag
      return await window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
      });
    });
    expect(axeProjects.violations).toEqual([]);

    await page.setViewportSize({ width: 393, height: 852 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);

    await page.locator('a[href="/"]').first().click();
    await page.waitForURL(`${baseUrl}/`);
    expect(await page.locator('#projects article').count()).toBe(3);

    await context.close();
  }, 15000);

  test('strict CSP permits Svelte islands hydration (CopyEmail and NavMenu) with zero console errors', async () => {
    const context = await browser.newContext({
      viewport: { width: 393, height: 852 },
      permissions: ['clipboard-read', 'clipboard-write'],
    });
    const page = await context.newPage();
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await waitForPageReady(page, 393, 852);

    const copyBtn = page.locator('[data-copy-email]').first();
    await copyBtn.waitFor({ state: 'visible' });
    await copyBtn.click();
    await page.waitForFunction(
      () => document.querySelector('[data-copy-status]')?.textContent?.trim() === 'Copied',
    );

    const menuBtn = page.locator('.nav-menu-button');
    const navPanel = page.locator('ul.nav-links');
    await menuBtn.click();
    expect(await navPanel.evaluate((el) => el.matches(':popover-open'))).toBe(true);
    await page.keyboard.press('Escape');
    expect(await navPanel.evaluate((el) => el.matches(':popover-open'))).toBe(false);

    const diagramTrigger = page.locator('button[aria-label^="Zoom diagram:"]').first();
    await diagramTrigger.scrollIntoViewIfNeeded();
    await diagramTrigger.click();
    await page
      .locator('dialog.diagram-dialog[open]')
      .getByRole('button', { name: 'Zoom in' })
      .click();
    await page
      .locator('dialog.diagram-dialog[open]')
      .getByRole('button', { name: 'Close' })
      .click();

    expect(consoleErrors).toEqual([]);
    await context.close();

    // Desktop (1440x900, fine pointer) renders static diagram without a Zoom diagram button
    const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const desktopPage = await desktopContext.newPage();
    await waitForPageReady(desktopPage, 1440, 900);
    expect(await desktopPage.locator('button[aria-label^="Zoom diagram:"]').count()).toBe(0);
    await desktopContext.close();
  }, 15000);

  test('architecture diagram opens zoom modal on tap without changing outer page layout', async () => {
    const context = await browser.newContext({
      viewport: { width: 393, height: 852 },
      hasTouch: true,
      isMobile: true,
      bypassCSP: true,
    });
    const page = await context.newPage();
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await waitForPageReady(page, 393, 852);
    const trigger = page.locator('button[aria-label^="Zoom diagram:"]').first();
    await trigger.scrollIntoViewIfNeeded();
    await trigger.waitFor({ state: 'visible' });
    const beforeScrollY = await page.evaluate(() => window.scrollY);
    const beforeBodyWidth = await page.evaluate(() => document.body.getBoundingClientRect().width);

    await trigger.tap();
    const dialog = page.locator('dialog.diagram-dialog[open]');
    await dialog.waitFor({ state: 'visible' });
    expect(await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))).toBe(
      'Zoom in',
    );

    const modalSvg = dialog.locator('svg');
    const initialWidth = Number(await modalSvg.getAttribute('width'));
    expect(initialWidth).toBe(950);

    // Zoom in and out inside the dialog without changing outer webpage dimensions
    const zoomInBtn = dialog.getByRole('button', { name: 'Zoom in' });
    await zoomInBtn.click();
    expect(Number(await modalSvg.getAttribute('width'))).toBe(Math.round(950 * 1.25));
    expect(await dialog.getByText('125%').isVisible()).toBe(true);

    const duringZoom = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      bodyWidth: document.body.getBoundingClientRect().width,
      scrollY: window.scrollY,
    }));
    expect(duringZoom.scrollWidth).toBeLessThanOrEqual(duringZoom.innerWidth);
    expect(duringZoom.bodyWidth).toBe(beforeBodyWidth);
    expect(duringZoom.scrollY).toBe(beforeScrollY);

    await dialog.getByRole('button', { name: 'Zoom out' }).click();
    await dialog.getByRole('button', { name: 'Zoom out' }).click();
    expect(Number(await modalSvg.getAttribute('width'))).toBe(Math.round(950 * 0.75));
    await dialog.getByRole('button', { name: 'Reset' }).click();
    expect(Number(await modalSvg.getAttribute('width'))).toBe(950);

    // Reaching max/min zoom preserves keyboard focus via aria-disabled (no disabled focus loss)
    await zoomInBtn.focus();
    for (let i = 0; i < 8; i += 1) {
      await page.keyboard.press('Enter');
    }
    expect(await zoomInBtn.getAttribute('aria-disabled')).toBe('true');
    expect(await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))).toBe(
      'Zoom in',
    );
    await dialog.getByRole('button', { name: 'Reset' }).click();

    // axe-core WCAG 2.2 AA while modal is open
    await page.addScriptTag({ content: axeSource });
    const axeModal = await page.evaluate(async () => {
      // @ts-expect-error injected via addScriptTag
      return await window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
      });
    });
    expect(axeModal.violations).toEqual([]);

    // Escape closes modal and restores focus to trigger button
    await page.keyboard.press('Escape');
    expect(await page.locator('dialog.diagram-dialog[open]').count()).toBe(0);
    expect(
      await page.evaluate(() =>
        document.activeElement?.getAttribute('aria-label')?.startsWith('Zoom diagram:'),
      ),
    ).toBe(true);

    expect(consoleErrors).toEqual([]);
    await context.close();

    // Desktop (1440x900, fine pointer) renders static diagram without a Zoom diagram button
    const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const desktopPage = await desktopContext.newPage();
    await waitForPageReady(desktopPage, 1440, 900);
    expect(await desktopPage.locator('button[aria-label^="Zoom diagram:"]').count()).toBe(0);
    await desktopContext.close();
  }, 15000);

  test('live year and month/year update automatically without Updated prefix', async () => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    await page.clock.install({ time: new Date('2027-02-15T10:00:00+07:00') });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });

    const heroYear = await page.locator('[data-live-year]').textContent();
    const monthYearTexts = await page.locator('[data-live-month-year]').allTextContents();
    const isoMonths = await page
      .locator('[data-live-month-year]')
      .evaluateAll((els) => els.map((el) => el.getAttribute('datetime')));

    expect(heroYear?.trim()).toBe('2027');
    expect(monthYearTexts.map((t) => t.trim())).toEqual(['February 2027', 'February 2027']);
    expect(isoMonths).toEqual(['2027-02', '2027-02']);

    await context.close();
  });
});
