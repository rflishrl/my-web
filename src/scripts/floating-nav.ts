export {};

const nav = document.getElementById('floating-nav');
const panel = document.getElementById('floating-nav-panel');
const trigger = document.getElementById('floating-nav-trigger') as HTMLButtonElement | null;
const currentLabelEl = document.getElementById('floating-nav-current');
const foldLabelEl = nav?.querySelector<HTMLElement>('[data-fold-current]') ?? null;
const indicator = panel?.querySelector<HTMLElement>('.floating-nav-indicator') ?? null;
const links = Array.from(panel?.querySelectorAll<HTMLAnchorElement>('[data-nav-section]') ?? []);

if (nav && panel && links.length > 0) {
  const linkById = new Map<string, HTMLAnchorElement>();
  const sections: HTMLElement[] = [];

  for (const link of links) {
    const id = link.dataset.navSection;
    if (!id) continue;
    linkById.set(id, link);
    const section = document.getElementById(id);
    if (section) sections.push(section);
  }

  const inlineMq = window.matchMedia('(min-width: 40rem)');
  const supportsPopover = Object.hasOwn(HTMLElement.prototype, 'popover');

  let activeId = links[0]?.dataset.navSection ?? 'hero';
  let previewId: string | null = null;
  let scrollLockUntil = 0;
  let scrollTicking = false;

  const moveIndicatorTo = (targetId: string, animate = true) => {
    if (!indicator || !inlineMq.matches) return;
    const link = linkById.get(targetId);
    if (!link) return;

    const panelRect = panel.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    if (linkRect.width === 0 || panelRect.width === 0) return;

    if (!animate) indicator.style.transition = 'none';
    indicator.style.setProperty('--ind-x', `${(linkRect.left - panelRect.left).toFixed(2)}px`);
    indicator.style.setProperty('--ind-y', `${(linkRect.top - panelRect.top).toFixed(2)}px`);
    indicator.style.setProperty('--ind-w', `${linkRect.width.toFixed(2)}px`);
    indicator.style.setProperty('--ind-h', `${linkRect.height.toFixed(2)}px`);
    indicator.classList.add('is-ready');

    if (!animate) {
      void indicator.offsetWidth;
      indicator.style.transition = '';
    }
  };

  const setActive = (nextId: string) => {
    if (!linkById.has(nextId)) return;
    activeId = nextId;

    for (const [id, link] of linkById) {
      if (id === nextId) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    }

    const activeLabel = linkById.get(nextId)?.getAttribute('aria-label') ?? '';
    if (currentLabelEl && activeLabel) currentLabelEl.textContent = activeLabel;
    if (foldLabelEl && activeLabel) foldLabelEl.textContent = activeLabel;

    if (!previewId) moveIndicatorTo(nextId);
  };

  // Compute active section against viewport reading line so scrolling up through tall sections never goes stale
  const updateSpy = () => {
    scrollTicking = false;
    if (performance.now() < scrollLockUntil) return;

    const y = window.scrollY;
    if (y < 40) {
      setActive('hero');
      return;
    }
    if (y + window.innerHeight >= document.documentElement.scrollHeight - 24) {
      setActive('contact');
      return;
    }

    const anchorY = window.innerHeight * 0.35;
    let current = sections[0]?.id ?? 'hero';
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= anchorY) {
        current = section.id;
      } else {
        break;
      }
    }
    setActive(current);
  };

  const scheduleSpy = () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(updateSpy);
  };

  const syncLayoutMode = () => {
    const isInline = inlineMq.matches;
    if (supportsPopover) {
      if (isInline) {
        if (panel.matches(':popover-open')) {
          (panel as HTMLElement & { hidePopover?: () => void }).hidePopover?.();
        }
        panel.removeAttribute('popover');
      } else {
        panel.setAttribute('popover', 'auto');
      }
    } else if (isInline) {
      panel.classList.remove('is-open-fallback');
    }
    if (isInline && trigger) trigger.setAttribute('aria-expanded', 'false');
    requestAnimationFrame(() => moveIndicatorTo(previewId ?? activeId, false));
  };

  document.addEventListener('scroll', scheduleSpy, { passive: true });
  window.addEventListener('resize', scheduleSpy, { passive: true });

  // Slide background pill cleanly across hovered or keyboard-focused items
  for (const link of links) {
    const id = link.dataset.navSection;
    if (!id) continue;

    link.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'touch') return;
      previewId = id;
      moveIndicatorTo(id);
    });

    link.addEventListener('focusin', () => {
      previewId = id;
      moveIndicatorTo(id);
    });

    link.addEventListener('click', () => {
      scrollLockUntil = performance.now() + 700;
      previewId = null;
      setActive(id);
      if (!inlineMq.matches) {
        requestAnimationFrame(() => {
          if (supportsPopover && panel.matches(':popover-open')) {
            (panel as HTMLElement & { hidePopover?: () => void }).hidePopover?.();
          } else {
            panel.classList.remove('is-open-fallback');
            trigger?.setAttribute('aria-expanded', 'false');
          }
        });
      }
    });
  }

  panel.addEventListener('pointerleave', () => {
    previewId = null;
    moveIndicatorTo(activeId);
  });

  panel.addEventListener('focusout', (e) => {
    const nextFocus = e.relatedTarget as Node | null;
    if (!nextFocus || !panel.contains(nextFocus)) {
      previewId = null;
      moveIndicatorTo(activeId);
    }
  });

  if (supportsPopover) {
    panel.addEventListener('toggle', (e) => {
      const open = (e as ToggleEvent).newState === 'open';
      trigger?.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  } else if (trigger) {
    trigger.addEventListener('click', () => {
      const open = panel.classList.toggle('is-open-fallback');
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  inlineMq.addEventListener('change', syncLayoutMode);
  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(() => moveIndicatorTo(previewId ?? activeId, false));
    resizeObserver.observe(panel);
  }

  syncLayoutMode();
  updateSpy();
}
