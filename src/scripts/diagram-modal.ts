const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const ZOOM_STEP = 0.25;

const HOVER_CLASSES = ['hover:border-ink', 'hover:bg-ink', 'hover:text-ink-inverse'] as const;

interface ModalState {
  dialog: HTMLDialogElement;
  open: () => void;
}

const modalStates = new WeakMap<HTMLElement, ModalState>();

function clampScale(next: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round(next * 100) / 100));
}

function setDisabledState(btn: HTMLButtonElement, isDisabled: boolean): void {
  if (isDisabled) {
    btn.setAttribute('aria-disabled', 'true');
    btn.classList.add('opacity-40');
    btn.classList.remove(...HOVER_CLASSES);
  } else {
    btn.removeAttribute('aria-disabled');
    btn.classList.remove('opacity-40');
    btn.classList.add(...HOVER_CLASSES);
  }
}

function createModal(figure: HTMLElement): ModalState | null {
  const sourceSvg = figure.querySelector<SVGSVGElement>('svg.diagram-svg');
  const title = figure.dataset.diagramTitle ?? '';
  const descId = figure.dataset.diagramDesc ?? '';
  const baseWidth = Number(figure.dataset.diagramWidth ?? '0');
  const baseHeight = Number(figure.dataset.diagramHeight ?? '0');
  const slug = figure.dataset.diagramSlug ?? 'diagram';
  if (!sourceSvg || !baseWidth || !baseHeight) return null;

  let scale = 1;
  let activePointers: Record<number, { x: number; y: number }> = {};
  let pinchStartDistance: number | null = null;
  let pinchStartScale = 1;
  let pressedOutside = false;
  let pinchRafId: number | null = null;
  let pendingPinch: { nextScale: number; midX: number; midY: number } | null = null;
  let announceTimer: number | undefined;

  const titleId = `diagram-title-${slug}`;
  const dialog = document.createElement('dialog');
  dialog.className = 'diagram-dialog';
  dialog.setAttribute('aria-labelledby', titleId);
  if (descId) dialog.setAttribute('aria-describedby', descId);
  dialog.setAttribute('closedby', 'any');

  const heading = document.createElement('h2');
  heading.id = titleId;
  heading.className = 'sr-only';
  heading.textContent = title;

  const header = document.createElement('div');
  header.className = 'diagram-dialog-header';

  const percentEl = document.createElement('p');
  percentEl.className = 'font-mono text-xs text-ink-secondary';
  percentEl.setAttribute('aria-hidden', 'true');
  percentEl.textContent = '100%';

  const liveEl = document.createElement('p');
  liveEl.className = 'sr-only';
  liveEl.setAttribute('aria-live', 'polite');

  const controls = document.createElement('div');
  controls.className = 'flex shrink-0 items-center gap-2';

  const zoomOutBtn = document.createElement('button');
  zoomOutBtn.type = 'button';
  zoomOutBtn.setAttribute('aria-label', 'Zoom out');
  zoomOutBtn.textContent = '-';
  zoomOutBtn.className =
    'btn-frame inline-flex min-h-[44px] min-w-[44px] items-center justify-center border border-ink-secondary px-3 font-mono text-sm text-ink transition-colors duration-150 active:opacity-75';

  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.textContent = 'Reset';
  resetBtn.className =
    'btn-frame inline-flex min-h-[44px] items-center justify-center border border-ink-secondary px-3 text-sm text-ink transition-colors duration-150 hover:border-ink hover:bg-ink hover:text-ink-inverse active:opacity-75';

  const zoomInBtn = document.createElement('button');
  zoomInBtn.type = 'button';
  zoomInBtn.autofocus = true;
  zoomInBtn.setAttribute('aria-label', 'Zoom in');
  zoomInBtn.textContent = '+';
  zoomInBtn.className =
    'btn-frame inline-flex min-h-[44px] min-w-[44px] items-center justify-center border border-ink-secondary px-3 font-mono text-sm text-ink transition-colors duration-150 active:opacity-75';

  const closeForm = document.createElement('form');
  closeForm.method = 'dialog';
  const closeBtn = document.createElement('button');
  closeBtn.type = 'submit';
  closeBtn.textContent = 'Close';
  closeBtn.className =
    'btn-frame inline-flex min-h-[44px] items-center justify-center border border-ink bg-ink px-4 text-sm text-ink-inverse transition-opacity duration-150 hover:opacity-85 active:opacity-70';
  closeForm.append(closeBtn);

  controls.append(zoomOutBtn, resetBtn, zoomInBtn, closeForm);
  header.append(percentEl, liveEl, controls);

  // Scrollable region needs tabindex="0" so keyboard users can pan zoomed diagrams with arrow keys.
  const viewport = document.createElement('div');
  viewport.className = 'diagram-dialog-viewport';
  viewport.setAttribute('role', 'region');
  viewport.setAttribute('aria-label', title);
  viewport.tabIndex = 0;

  const canvas = document.createElement('div');
  canvas.className = 'diagram-dialog-canvas';

  const modalSvg = sourceSvg.cloneNode(true) as SVGSVGElement;
  modalSvg.removeAttribute('role');
  modalSvg.removeAttribute('aria-label');
  modalSvg.removeAttribute('aria-describedby');
  modalSvg.setAttribute('aria-hidden', 'true');
  modalSvg.setAttribute('class', 'diagram-svg block shrink-0');
  modalSvg.querySelector('title')?.remove();

  const inlineArrowId = figure.dataset.arrowId;
  if (inlineArrowId) {
    const modalArrowId = `arrow-${slug}-modal`;
    const marker = modalSvg.querySelector(`#${CSS.escape(inlineArrowId)}`);
    if (marker) marker.id = modalArrowId;
    for (const path of modalSvg.querySelectorAll<SVGPathElement>('[marker-end]')) {
      path.setAttribute('marker-end', `url(#${modalArrowId})`);
    }
  }

  canvas.append(modalSvg);
  viewport.append(canvas);
  dialog.append(heading, header, viewport);
  figure.append(dialog);

  const syncScaleUi = (): void => {
    const percent = Math.round(scale * 100);
    percentEl.textContent = `${percent}%`;
    modalSvg.setAttribute('width', String(Math.round(baseWidth * scale)));
    modalSvg.setAttribute('height', String(Math.round(baseHeight * scale)));
    setDisabledState(zoomOutBtn, scale <= MIN_SCALE);
    setDisabledState(zoomInBtn, scale >= MAX_SCALE);
  };

  const scheduleZoomAnnouncement = (percent: number): void => {
    if (announceTimer !== undefined) clearTimeout(announceTimer);
    announceTimer = window.setTimeout(() => {
      if (dialog.open) {
        liveEl.textContent = `Zoom ${percent}%`;
      }
    }, 250);
  };

  const setScaleCentered = (nextScale: number, anchorX?: number, anchorY?: number): void => {
    const clamped = clampScale(nextScale);
    if (clamped === scale) return;

    const prevScale = scale;
    const rect = viewport.getBoundingClientRect();
    const viewX = anchorX !== undefined ? anchorX - rect.left : viewport.clientWidth / 2;
    const viewY = anchorY !== undefined ? anchorY - rect.top : viewport.clientHeight / 2;
    const contentX = (viewport.scrollLeft + viewX) / prevScale;
    const contentY = (viewport.scrollTop + viewY) / prevScale;

    scale = clamped;
    syncScaleUi();
    scheduleZoomAnnouncement(Math.round(clamped * 100));

    viewport.scrollLeft = Math.max(0, contentX * clamped - viewX);
    viewport.scrollTop = Math.max(0, contentY * clamped - viewY);
  };

  const cancelPendingPinch = (): void => {
    if (pinchRafId !== null) {
      cancelAnimationFrame(pinchRafId);
      pinchRafId = null;
    }
    pendingPinch = null;
  };

  const getPointerMetrics = (): { distance: number; midX: number; midY: number } | null => {
    const entries = Object.values(activePointers);
    if (entries.length < 2) return null;
    const [a, b] = entries;
    if (!a || !b) return null;
    return {
      distance: Math.hypot(b.x - a.x, b.y - a.y),
      midX: (a.x + b.x) / 2,
      midY: (a.y + b.y) / 2,
    };
  };

  const isOutsideDialog = (event: PointerEvent): boolean => {
    const r = dialog.getBoundingClientRect();
    return (
      event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom
    );
  };

  zoomOutBtn.addEventListener('click', () => {
    if (scale > MIN_SCALE) setScaleCentered(scale - ZOOM_STEP);
  });

  resetBtn.addEventListener('click', () => {
    setScaleCentered(1);
  });

  zoomInBtn.addEventListener('click', () => {
    if (scale < MAX_SCALE) setScaleCentered(scale + ZOOM_STEP);
  });

  dialog.addEventListener('close', () => {
    liveEl.textContent = '';
    if (announceTimer !== undefined) {
      clearTimeout(announceTimer);
      announceTimer = undefined;
    }
    cancelPendingPinch();
    activePointers = {};
    pinchStartDistance = null;
  });

  dialog.addEventListener('pointerdown', (event) => {
    if ('closedBy' in HTMLDialogElement.prototype) return;
    pressedOutside = isOutsideDialog(event);
  });

  dialog.addEventListener('pointerup', (event) => {
    if ('closedBy' in HTMLDialogElement.prototype) return;
    if (pressedOutside && isOutsideDialog(event)) dialog.close();
    pressedOutside = false;
  });

  viewport.addEventListener('pointerdown', (event) => {
    activePointers[event.pointerId] = { x: event.clientX, y: event.clientY };
    if (Object.keys(activePointers).length === 2) {
      pinchStartDistance = getPointerMetrics()?.distance ?? null;
      pinchStartScale = scale;
    }
  });

  viewport.addEventListener('pointermove', (event) => {
    if (!(event.pointerId in activePointers)) return;
    activePointers[event.pointerId] = { x: event.clientX, y: event.clientY };

    if (Object.keys(activePointers).length === 2 && pinchStartDistance && pinchStartDistance > 0) {
      const metrics = getPointerMetrics();
      if (!metrics) return;
      pendingPinch = {
        nextScale: pinchStartScale * (metrics.distance / pinchStartDistance),
        midX: metrics.midX,
        midY: metrics.midY,
      };
      if (pinchRafId === null) {
        pinchRafId = requestAnimationFrame(() => {
          pinchRafId = null;
          if (!pendingPinch) return;
          const { nextScale, midX, midY } = pendingPinch;
          pendingPinch = null;
          setScaleCentered(nextScale, midX, midY);
        });
      }
    }
  });

  const handlePointerEnd = (event: PointerEvent): void => {
    delete activePointers[event.pointerId];
    if (Object.keys(activePointers).length < 2) {
      pinchStartDistance = null;
      cancelPendingPinch();
    }
  };
  viewport.addEventListener('pointerup', handlePointerEnd);
  viewport.addEventListener('pointercancel', handlePointerEnd);

  viewport.addEventListener(
    'wheel',
    (event) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const delta = event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      setScaleCentered(scale + delta, event.clientX, event.clientY);
    },
    { passive: false },
  );

  viewport.addEventListener('dblclick', (event) => {
    const next = scale < 1.5 ? 2 : 1;
    setScaleCentered(next, event.clientX, event.clientY);
  });

  const open = (): void => {
    scale = 1;
    liveEl.textContent = '';
    syncScaleUi();
    if (!dialog.open) dialog.showModal();
    if (document.activeElement !== zoomInBtn) zoomInBtn.focus();
    viewport.scrollLeft = 0;
    viewport.scrollTop = 0;
  };

  return { dialog, open };
}

/**
 * Opens the interactive pan/zoom modal for a rendered architecture diagram figure.
 */
export function openDiagramModal(figure: HTMLElement): void {
  let state = modalStates.get(figure);
  if (!state) {
    const created = createModal(figure);
    if (!created) return;
    modalStates.set(figure, created);
    state = created;
  }
  state.open();
}
