import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';

const distDir = path.join(process.cwd(), 'dist');
const indexPath = path.join(distDir, 'index.html');

const EXPECTED_NAV_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Experience', href: '#experience' },
  { label: 'Education', href: '#education' },
  { label: 'Stack', href: '#stack' },
  { label: 'Certs', href: '#certifications' },
  { label: 'Projects', href: '#projects' },
  { label: 'Contact', href: '#contact' },
];

function walkFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

function findEnclosingAtRule(css: string, index: number): string[] {
  const stack: Array<{ header: string; isAtRule: boolean }> = [];
  let tokenStart = 0;
  let inString: string | null = null;
  let inComment = false;

  for (let i = 0; i < index; i += 1) {
    const ch = css[i]!;
    const next = css[i + 1];

    if (inComment) {
      if (ch === '*' && next === '/') {
        inComment = false;
        i += 1;
        tokenStart = i + 1;
      }
      continue;
    }

    if (inString) {
      if (ch === '\\') {
        i += 1;
      } else if (ch === inString) {
        inString = null;
      }
      continue;
    }

    if (ch === '/' && next === '*') {
      inComment = true;
      i += 1;
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = ch;
      continue;
    }

    if (ch === '{') {
      const header = css.slice(tokenStart, i).trim();
      stack.push({ header, isAtRule: header.startsWith('@') });
      tokenStart = i + 1;
    } else if (ch === '}') {
      stack.pop();
      tokenStart = i + 1;
    } else if (ch === ';') {
      tokenStart = i + 1;
    }
  }

  return stack.map((entry) => entry.header);
}

describe('Static verification of dist/', () => {
  test('dist/index.html exists and no reference or source PDFs leaked', () => {
    expect(fs.existsSync(indexPath)).toBe(true);
    const allFiles = walkFiles(distDir).map((f) => path.relative(distDir, f).replaceAll('\\', '/'));

    const forbiddenFiles = [
      '01-hero.png',
      '02-about.png',
      '03-stack.png',
      '04-case-study-title.png',
      '05-case-study-mockup.png',
      '06-case-study-longread.png',
      '07-contact.png',
      'resume.pdf',
      'portfolio.pdf',
    ];
    for (const name of forbiddenFiles) {
      expect(allFiles.some((f) => f.endsWith(name))).toBe(false);
    }
  });

  test('HTML structure, headings, images, anchors, viewport, and nav markup', async () => {
    const html = fs.readFileSync(indexPath, 'utf8');

    // Privacy, placeholder, and orientation-lock scan across all text assets in dist/
    const allFiles = walkFiles(distDir).filter((f) => /\.(html|js|css|svg|txt|xml)$/i.test(f));
    const forbiddenContent = /\blorem\b|TODO|__SET_ME__|851-?1755-?5453|C:\\/i;
    const orientationLockPattern = /orientation\.lock\s*\(/i;
    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(forbiddenContent.test(content)).toBe(false);
      expect(orientationLockPattern.test(content)).toBe(false);
    }

    let htmlLang = '';
    let viewportContent = '';
    let themeColorContent = '';
    let cspContent = '';
    let h1Count = 0;
    let detailsCount = 0;
    let bodyDepth = 0;
    let topHeaderIsDirectBodyChild = false;
    let topHeaderId = '';
    let headerButtons = 0;
    let headerSvgs = 0;
    let headerAriaAttrs = 0;
    let brandLinkCount = 0;
    let compactDetailsCount = 0;
    const astroIslands: Array<{ componentUrl: string; client: string }> = [];
    const navFullLinks: Array<{ href: string; text: string; ariaLabel: string | null }> = [];
    const navCompactLinks: Array<{ href: string; text: string; ariaLabel: string | null }> = [];
    const runningHeaders: Array<{ sectionNames: number; backToTopLinks: Array<{ href: string; text: string }> }> = [];
    let currentRunningHeader: { sectionNames: number; backToTopLinks: Array<{ href: string; text: string }> } | null =
      null;
    let captureTarget: { type: 'nav-full' | 'nav-links' | 'back-to-top'; index: number } | null = null;

    const headings: number[] = [];
    const ids = new Set<string>();
    const internalAnchors: string[] = [];
    const imgsMissingAlt: string[] = [];
    const thirdPartyResourceUrls: string[] = [];
    const inlineExecutableScripts: string[] = [];
    let capturingInlineScript = false;
    let currentInlineScript = '';

    const voidElements = new Set([
      'area',
      'base',
      'br',
      'col',
      'embed',
      'hr',
      'img',
      'input',
      'link',
      'meta',
      'source',
      'track',
      'wbr',
    ]);

    const rewriter = new HTMLRewriter()
      .on('html', {
        element(el) {
          htmlLang = el.getAttribute('lang') ?? '';
        },
      })
      .on('meta[name="viewport"]', {
        element(el) {
          viewportContent = el.getAttribute('content') ?? '';
        },
      })
      .on('meta[name="theme-color"]', {
        element(el) {
          themeColorContent = el.getAttribute('content') ?? '';
        },
      })
      .on('meta[http-equiv="content-security-policy"]', {
        element(el) {
          cspContent = el.getAttribute('content') ?? '';
        },
      })
      .on('astro-island', {
        element(el) {
          astroIslands.push({
            componentUrl: el.getAttribute('component-url') ?? '',
            client: el.getAttribute('client') ?? '',
          });
        },
      })
      .on('body *', {
        element(el) {
          const currentDepth = bodyDepth;
          if (!voidElements.has(el.tagName)) {
            bodyDepth += 1;
            el.onEndTag(() => {
              bodyDepth -= 1;
            });
          }
          if (el.tagName === 'header' && el.getAttribute('id') === 'top') {
            topHeaderId = el.getAttribute('id') ?? '';
            topHeaderIsDirectBodyChild = currentDepth === 0;
          }
        },
      })
      .on('details', {
        element() {
          detailsCount += 1;
        },
      })
      .on('header#top button', {
        element() {
          headerButtons += 1;
        },
      })
      .on('header#top svg', {
        element() {
          headerSvgs += 1;
        },
      })
      .on('header#top [aria-expanded], header#top [aria-haspopup], header#top [aria-controls]', {
        element() {
          headerAriaAttrs += 1;
        },
      })
      .on('.nav-full a', {
        element(el) {
          const idx =
            navFullLinks.push({
              href: el.getAttribute('href') ?? '',
              text: '',
              ariaLabel: el.getAttribute('aria-label'),
            }) - 1;
          captureTarget = { type: 'nav-full', index: idx };
          el.onEndTag(() => {
            captureTarget = null;
          });
        },
        text(chunk) {
          if (captureTarget?.type === 'nav-full') {
            navFullLinks[captureTarget.index]!.text += chunk.text;
          }
        },
      })
      .on('.nav-compact .nav-brand', {
        element() {
          brandLinkCount += 1;
        },
      })
      .on('.nav-compact details', {
        element() {
          compactDetailsCount += 1;
        },
      })
      .on('.nav-links a', {
        element(el) {
          const idx =
            navCompactLinks.push({
              href: el.getAttribute('href') ?? '',
              text: '',
              ariaLabel: el.getAttribute('aria-label'),
            }) - 1;
          captureTarget = { type: 'nav-links', index: idx };
          el.onEndTag(() => {
            captureTarget = null;
          });
        },
        text(chunk) {
          if (captureTarget?.type === 'nav-links') {
            navCompactLinks[captureTarget.index]!.text += chunk.text;
          }
        },
      })
      .on('.running-header', {
        element(el) {
          currentRunningHeader = { sectionNames: 0, backToTopLinks: [] };
          runningHeaders.push(currentRunningHeader);
          el.onEndTag(() => {
            currentRunningHeader = null;
          });
        },
      })
      .on('.running-header .section-name', {
        element() {
          if (currentRunningHeader) currentRunningHeader.sectionNames += 1;
        },
      })
      .on('.running-header .back-to-top a', {
        element(el) {
          if (!currentRunningHeader) return;
          const idx =
            currentRunningHeader.backToTopLinks.push({
              href: el.getAttribute('href') ?? '',
              text: '',
            }) - 1;
          captureTarget = { type: 'back-to-top', index: idx };
          el.onEndTag(() => {
            captureTarget = null;
          });
        },
        text(chunk) {
          if (captureTarget?.type === 'back-to-top' && currentRunningHeader) {
            currentRunningHeader.backToTopLinks[captureTarget.index]!.text += chunk.text;
          }
        },
      })
      .on('[id]', {
        element(el) {
          const id = el.getAttribute('id');
          if (id) ids.add(id);
        },
      })
      .on('h1, h2, h3, h4, h5, h6', {
        element(el) {
          const level = Number(el.tagName.slice(1));
          headings.push(level);
          if (level === 1) h1Count += 1;
        },
      })
      .on('img', {
        element(el) {
          const alt = el.getAttribute('alt');
          if (alt === null || alt.trim().length === 0) {
            imgsMissingAlt.push(el.getAttribute('src') ?? 'unknown');
          }
          const src = el.getAttribute('src');
          if (src && /^https?:\/\//i.test(src)) {
            thirdPartyResourceUrls.push(src);
          }
        },
      })
      .on('a[href]', {
        element(el) {
          const href = el.getAttribute('href') ?? '';
          if (href.startsWith('#') && href.length > 1) {
            internalAnchors.push(href.slice(1));
          }
        },
      })
      .on('link[href]', {
        element(el) {
          const rel = el.getAttribute('rel') ?? '';
          const href = el.getAttribute('href') ?? '';
          if (rel !== 'canonical' && /^https?:\/\//i.test(href)) {
            thirdPartyResourceUrls.push(href);
          }
        },
      })
      .on('script', {
        element(el) {
          const src = el.getAttribute('src');
          const type = el.getAttribute('type') ?? '';
          if (src && /^https?:\/\//i.test(src)) {
            thirdPartyResourceUrls.push(src);
          }
          if (!src && type !== 'application/ld+json') {
            capturingInlineScript = true;
            currentInlineScript = '';
            el.onEndTag(() => {
              inlineExecutableScripts.push(currentInlineScript);
              capturingInlineScript = false;
            });
          }
        },
        text(chunk) {
          if (capturingInlineScript) {
            currentInlineScript += chunk.text;
          }
        },
      });

    await rewriter.transform(new Response(html)).text();

    // Document metadata & safe-area viewport checks
    expect(htmlLang).toBe('en');
    expect(viewportContent).toContain('viewport-fit=cover');
    expect(viewportContent).not.toMatch(/user-scalable/i);
    expect(viewportContent).not.toMatch(/maximum-scale/i);
    expect(themeColorContent).toBe('#FFFFFF');

    // Header & primary navigation structure
    expect(topHeaderId).toBe('top');
    expect(topHeaderIsDirectBodyChild).toBe(true);
    expect(detailsCount).toBe(1);
    expect(compactDetailsCount).toBe(1);
    expect(brandLinkCount).toBe(0);
    expect(headerButtons).toBe(0);
    expect(headerSvgs).toBe(0);
    expect(headerAriaAttrs).toBe(0);

    expect(navFullLinks.map((l) => ({ label: l.text.trim(), href: l.href }))).toEqual(EXPECTED_NAV_LINKS);
    expect(navCompactLinks.map((l) => ({ label: l.text.trim(), href: l.href }))).toEqual(EXPECTED_NAV_LINKS);
    for (const link of [...navFullLinks, ...navCompactLinks]) {
      expect(link.ariaLabel).toBeNull();
    }

    // RunningHeader structure
    expect(runningHeaders.length).toBeGreaterThanOrEqual(7);
    for (const rh of runningHeaders) {
      expect(rh.sectionNames).toBe(1);
      expect(rh.backToTopLinks).toHaveLength(1);
      expect(rh.backToTopLinks[0]!.href).toBe('#top');
      expect(rh.backToTopLinks[0]!.text.trim()).toBe('Back to top');
    }

    // Headings, images, anchors, scripts
    expect(h1Count).toBe(1);
    expect(headings.length).toBeGreaterThan(1);
    for (let i = 1; i < headings.length; i += 1) {
      const prev = headings[i - 1]!;
      const curr = headings[i]!;
      expect(curr - prev).toBeLessThanOrEqual(1);
    }

    expect(imgsMissingAlt).toEqual([]);
    for (const target of internalAnchors) {
      expect(ids.has(target)).toBe(true);
    }
    expect(thirdPartyResourceUrls).toEqual([]);

    // Strict SHA-256 CSP covers every inline Astro island hydration script (no unsafe-inline)
    expect(cspContent).not.toContain("'unsafe-inline'");
    expect(cspContent).toContain("script-src 'self'");
    for (const scriptBody of inlineExecutableScripts) {
      const digest = new Bun.CryptoHasher('sha256').update(scriptBody).digest('base64');
      expect(cspContent).toContain(`'sha256-${digest}'`);
    }

    // Astro Islands: NavMenu (client:media) + 2 CopyEmail (client:idle) + 2 DiagramViewer (client:media)
    expect(astroIslands.some((i) => i.componentUrl.includes('NavMenu') && i.client === 'media')).toBe(true);
    expect(astroIslands.filter((i) => i.componentUrl.includes('CopyEmail') && i.client === 'idle')).toHaveLength(2);
    expect(astroIslands.filter((i) => i.componentUrl.includes('DiagramViewer') && i.client === 'media')).toHaveLength(2);
    expect(html).not.toContain('Architecture diagram');

    // Built JS checks: modular Svelte islands (no IntersectionObserver, no scroll listener, bounded gzip size)
    const jsFiles = walkFiles(distDir).filter((f) => f.endsWith('.js'));
    let totalGzipBytes = 0;
    let navMenuBundle: { path: string; code: string; gzipBytes: number } | null = null;
    let copyEmailBundle: { path: string; code: string; gzipBytes: number } | null = null;
    let diagramViewerBundle: { path: string; code: string; gzipBytes: number } | null = null;
    for (const jsFile of jsFiles) {
      const raw = fs.readFileSync(jsFile);
      const gzipped = Bun.gzipSync(raw);
      totalGzipBytes += gzipped.byteLength;
      const code = raw.toString('utf8');
      if (path.basename(jsFile).startsWith('NavMenu.')) {
        navMenuBundle = { path: jsFile, code, gzipBytes: gzipped.byteLength };
      }
      if (path.basename(jsFile).startsWith('CopyEmail.')) {
        copyEmailBundle = { path: jsFile, code, gzipBytes: gzipped.byteLength };
      }
      if (path.basename(jsFile).startsWith('DiagramViewer.')) {
        diagramViewerBundle = { path: jsFile, code, gzipBytes: gzipped.byteLength };
      }
    }
    expect(navMenuBundle).not.toBeNull();
    expect(copyEmailBundle).not.toBeNull();
    expect(diagramViewerBundle).not.toBeNull();
    expect(navMenuBundle!.gzipBytes).toBeLessThanOrEqual(2048);
    expect(copyEmailBundle!.gzipBytes).toBeLessThanOrEqual(2048);
    expect(diagramViewerBundle!.gzipBytes).toBeLessThanOrEqual(4096);
    expect(navMenuBundle!.code).not.toContain('IntersectionObserver');
    expect(navMenuBundle!.code).not.toMatch(/addEventListener\(\s*["']scroll["']|\.onscroll\b/);
    expect(totalGzipBytes).toBeLessThanOrEqual(25600);

    // Inline CSS active & Open Graph present
    expect(html).not.toMatch(/<link[^>]+rel=["']stylesheet["']/i);
    expect(html).toContain('property="og:image" content="https://www.raflisahrul.my.id/og-image.png"');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');

    // Featured projects on /: BrandMuse, muatmuat Plus, RT Online + link to /projects
    expect(html).toContain('BrandMuse');
    expect(html).toContain('muatmuat Plus');
    expect(html).toContain('RT Online');
    expect(html).not.toContain('id="project-04"');
    expect(html).not.toContain('id="project-05"');
    expect(html).toContain('href="/projects"');

    // /projects archive page exists with all 5 projects and non-skipping heading hierarchy
    const projectsPath = path.join(distDir, 'projects', 'index.html');
    expect(fs.existsSync(projectsPath)).toBe(true);
    const projectsHtml = fs.readFileSync(projectsPath, 'utf8');
    let projectsH1Count = 0;
    const projectsHeadings: number[] = [];
    let projectsCurrentLinks = 0;
    await new HTMLRewriter()
      .on('h1, h2, h3, h4, h5, h6', {
        element(el) {
          const level = Number(el.tagName.slice(1));
          projectsHeadings.push(level);
          if (level === 1) projectsH1Count += 1;
        },
      })
      .on('a[aria-current="page"]', {
        element() {
          projectsCurrentLinks += 1;
        },
      })
      .transform(new Response(projectsHtml))
      .text();

    expect(projectsH1Count).toBe(1);
    for (let i = 1; i < projectsHeadings.length; i += 1) {
      expect(projectsHeadings[i]! - projectsHeadings[i - 1]!).toBeLessThanOrEqual(1);
    }
    expect(projectsCurrentLinks).toBe(2);
    expect(projectsHtml).toContain('href="/"');
    expect(projectsHtml).toContain('Back to home');
    expect(projectsHtml).toContain('id="project-01"');
    expect(projectsHtml).toContain('id="project-05"');
    expect(projectsHtml).toContain('Desa Pendil');
    expect(projectsHtml).toContain('Sinar Berkah');
  });

  test('Built CSS enforces positioning, opacity, typography, and foldable env() rules', () => {
    const html = fs.readFileSync(indexPath, 'utf8');
    const styleMatches = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
    expect(styleMatches.length).toBeGreaterThan(0);
    const css = styleMatches.map((m) => m[1]!).join('\n');

    // No position: fixed and no backdrop-filter declaration
    expect(css).not.toMatch(/position\s*:\s*fixed/i);
    expect(css).not.toMatch(/backdrop-filter\s*:/i);

    // Opaque header and overlay panel
    expect(css).toMatch(/\.site-header\{[^}]*background-color:var\(--color-canvas\)/);
    expect(css).toMatch(/\.nav-links\{[^}]*background(?:-color)?:var\(--color-canvas\)/);

    // position: sticky only inside the two sticky media queries and only for .site-header
    const stickyMatches = [...css.matchAll(/position\s*:\s*sticky/gi)];
    expect(stickyMatches.length).toBe(2);
    for (const m of stickyMatches) {
      const ctx = findEnclosingAtRule(css, m.index!);
      expect(ctx.length).toBe(2);
      expect(ctx[1]).toBe('.site-header');
      expect(ctx[0]).toMatch(/@media\s*\((?:width|min-width).*(?:height|min-height).*37\.5em\)/);
    }

    // Every env(viewport-segment-*) call has a fallback and sits inside a viewport-segments media query
    const segmentEnvMatches = [...css.matchAll(/env\(\s*viewport-segment-[^)]*\)/gi)];
    expect(segmentEnvMatches.length).toBeGreaterThan(0);
    for (const m of segmentEnvMatches) {
      expect(m[0]).toContain(',');
      const ctx = findEnclosingAtRule(css, m.index!);
      expect(ctx.some((rule) => /horizontal-viewport-segments\s*:\s*2/i.test(rule))).toBe(true);
    }

    // No text-transform: uppercase on role or organization elements
    expect(css).not.toMatch(/text-transform\s*:\s*uppercase/i);
    expect(html).not.toMatch(/class="[^"]*\buppercase\b[^"]*"/i);
  });
});
