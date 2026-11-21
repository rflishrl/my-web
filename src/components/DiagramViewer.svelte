<script lang="ts">
  import { tick } from 'svelte';
  import type { ArchitectureDiagramData } from '../data/portfolio';

  interface Props {
    diagram: ArchitectureDiagramData;
    zoomMediaQuery: string;
  }

  const MIN_SCALE = 0.5;
  const MAX_SCALE = 3;
  const ZOOM_STEP = 0.25;

  const { diagram, zoomMediaQuery }: Props = $props();
  const uid = $props.id();

  let dialogEl = $state<HTMLDialogElement | null>(null);
  let viewportEl = $state<HTMLDivElement | null>(null);
  let canZoom = $state(false);
  let isOpen = $state(false);
  let scale = $state(1);
  let announcedZoom = $state('');

  const nodeById = $derived(new Map(diagram.nodes.map((node) => [node.id, node])));
  const outCountByFrom = $derived.by(() => {
    const counts: Record<string, number> = {};
    for (const edge of diagram.edges) {
      counts[edge.from] = (counts[edge.from] ?? 0) + 1;
    }
    return counts;
  });

  const diagramSummary = $derived.by(() => {
    const nodesText = diagram.nodes
      .map((n) => (n.sublabel ? `${n.label} (${n.sublabel})` : n.label))
      .join('; ');
    const edgesText = diagram.edges
      .map((e) => {
        const from = nodeById.get(e.from)?.label ?? e.from;
        const to = nodeById.get(e.to)?.label ?? e.to;
        return e.label ? `${from} to ${to} via ${e.label}` : `${from} to ${to}`;
      })
      .join('; ');
    return `Components: ${nodesText}. Data flow: ${edgesText}.`;
  });

  const inlineArrowId = `arrow-${uid}-inline`;
  const modalArrowId = `arrow-${uid}-modal`;
  const dialogTitleId = `diagram-title-${uid}`;
  const descId = `diagram-desc-${uid}`;

  const scaledWidth = $derived(Math.round(diagram.width * scale));
  const scaledHeight = $derived(Math.round(diagram.height * scale));
  const zoomPercent = $derived(Math.round(scale * 100));
  const atMinZoom = $derived(scale <= MIN_SCALE);
  const atMaxZoom = $derived(scale >= MAX_SCALE);

  let activePointers: Record<number, { x: number; y: number }> = {};
  let pinchStartDistance: number | null = null;
  let pinchStartScale = 1;
  let pressedOutside = false;
  let pinchRafId: number | null = null;
  let pendingPinch: { nextScale: number; midX: number; midY: number } | null = null;
  let announceTimer: ReturnType<typeof setTimeout> | undefined;

  function clampScale(next: number): number {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round(next * 100) / 100));
  }

  function scheduleZoomAnnouncement(percent: number): void {
    if (announceTimer !== undefined) {
      clearTimeout(announceTimer);
    }
    announceTimer = setTimeout(() => {
      if (isOpen) {
        announcedZoom = `Zoom ${percent}%`;
      }
    }, 250);
  }

  async function setScaleCentered(
    nextScale: number,
    anchorX?: number,
    anchorY?: number,
  ): Promise<void> {
    const clamped = clampScale(nextScale);
    if (clamped === scale || !viewportEl) {
      scale = clamped;
      return;
    }

    const prevScale = scale;
    const rect = viewportEl.getBoundingClientRect();
    const viewX = anchorX !== undefined ? anchorX - rect.left : viewportEl.clientWidth / 2;
    const viewY = anchorY !== undefined ? anchorY - rect.top : viewportEl.clientHeight / 2;
    const contentX = (viewportEl.scrollLeft + viewX) / prevScale;
    const contentY = (viewportEl.scrollTop + viewY) / prevScale;

    scale = clamped;
    scheduleZoomAnnouncement(Math.round(clamped * 100));
    await tick();

    viewportEl.scrollLeft = Math.max(0, contentX * clamped - viewX);
    viewportEl.scrollTop = Math.max(0, contentY * clamped - viewY);
  }

  async function openModal(): Promise<void> {
    if (!dialogEl) return;
    scale = 1;
    announcedZoom = '';
    isOpen = true;
    await tick();
    if (!dialogEl.open) {
      dialogEl.showModal();
    }
    if (viewportEl) {
      viewportEl.scrollLeft = 0;
      viewportEl.scrollTop = 0;
    }
  }

  function cancelPendingPinch(): void {
    if (pinchRafId !== null) {
      cancelAnimationFrame(pinchRafId);
      pinchRafId = null;
    }
    pendingPinch = null;
  }

  function handleDialogClose(): void {
    isOpen = false;
    announcedZoom = '';
    if (announceTimer !== undefined) {
      clearTimeout(announceTimer);
      announceTimer = undefined;
    }
    cancelPendingPinch();
    activePointers = {};
    pinchStartDistance = null;
  }

  function isOutsideDialog(event: PointerEvent): boolean {
    if (!dialogEl) return false;
    const r = dialogEl.getBoundingClientRect();
    return (
      event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom
    );
  }

  function handleDialogPointerDown(event: PointerEvent): void {
    if ('closedBy' in HTMLDialogElement.prototype) return;
    pressedOutside = isOutsideDialog(event);
  }

  function handleDialogPointerUp(event: PointerEvent): void {
    if ('closedBy' in HTMLDialogElement.prototype) return;
    if (pressedOutside && isOutsideDialog(event)) {
      dialogEl?.close();
    }
    pressedOutside = false;
  }

  function getPointerMetrics(): { distance: number; midX: number; midY: number } | null {
    const entries = Object.values(activePointers);
    if (entries.length < 2) return null;
    const [a, b] = entries;
    if (!a || !b) return null;
    return {
      distance: Math.hypot(b.x - a.x, b.y - a.y),
      midX: (a.x + b.x) / 2,
      midY: (a.y + b.y) / 2,
    };
  }

  function handleViewportPointerDown(event: PointerEvent): void {
    activePointers[event.pointerId] = { x: event.clientX, y: event.clientY };
    if (Object.keys(activePointers).length === 2) {
      pinchStartDistance = getPointerMetrics()?.distance ?? null;
      pinchStartScale = scale;
    }
  }

  function handleViewportPointerMove(event: PointerEvent): void {
    if (!(event.pointerId in activePointers)) return;
    activePointers[event.pointerId] = { x: event.clientX, y: event.clientY };

    if (Object.keys(activePointers).length === 2 && pinchStartDistance && pinchStartDistance > 0) {
      const metrics = getPointerMetrics();
      if (metrics) {
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
            void setScaleCentered(nextScale, midX, midY);
          });
        }
      }
    }
  }

  function handleViewportPointerUp(event: PointerEvent): void {
    delete activePointers[event.pointerId];
    if (Object.keys(activePointers).length < 2) {
      pinchStartDistance = null;
      cancelPendingPinch();
    }
  }

  function handleWheel(event: WheelEvent): void {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    const delta = event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
    void setScaleCentered(scale + delta, event.clientX, event.clientY);
  }

  function handleDoubleClick(event: MouseEvent): void {
    const next = scale < 1.5 ? 2 : 1;
    void setScaleCentered(next, event.clientX, event.clientY);
  }

  $effect(() => {
    const mq = window.matchMedia(zoomMediaQuery);
    const syncZoomMode = (): void => {
      canZoom = mq.matches;
      if (!mq.matches && dialogEl?.open) {
        dialogEl.close();
      }
    };
    syncZoomMode();
    mq.addEventListener('change', syncZoomMode);
    return () => {
      mq.removeEventListener('change', syncZoomMode);
      cancelPendingPinch();
      if (announceTimer !== undefined) {
        clearTimeout(announceTimer);
      }
    };
  });
</script>

{#snippet diagramContent(arrowId: string)}
  <defs>
    <marker
      id={arrowId}
      viewBox="0 0 10 10"
      refX="8"
      refY="5"
      markerWidth="6"
      markerHeight="6"
      orient="auto-start-reverse"
    >
      <path d="M 0 1 L 10 5 L 0 9 z" class="diagram-marker" />
    </marker>
  </defs>

  {#each diagram.edges as edge (`${arrowId}-${edge.from}-${edge.to}`)}
    {@const from = nodeById.get(edge.from)}
    {@const to = nodeById.get(edge.to)}
    {#if from && to}
      {@const x1 = from.x + from.w}
      {@const y1 = from.y + from.h / 2}
      {@const x2 = to.x}
      {@const y2 = to.y + to.h / 2}
      {@const isSingleStraight = (outCountByFrom[edge.from] ?? 0) === 1 && y1 === y2}
      {@const midX = isSingleStraight ? Math.round((x1 + x2) / 2) : x1 + 24}
      {@const labelX = isSingleStraight ? midX : Math.round((midX + x2 - 8) / 2)}
      {@const labelY = y2 - 8}
      <g>
        <path
          d={`M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`}
          class="diagram-edge"
          stroke-width="1.5"
          marker-end={`url(#${arrowId})`}
        />
        {#if edge.label}
          <text
            x={labelX}
            y={labelY}
            text-anchor="middle"
            class="diagram-sublabel"
            font-size="10.5"
            font-family="JetBrains Mono Variable, ui-monospace, monospace"
          >
            {edge.label}
          </text>
        {/if}
      </g>
    {/if}
  {/each}

  {#each diagram.nodes as node (`${arrowId}-${node.id}`)}
    <g>
      <rect
        x={node.x}
        y={node.y}
        width={node.w}
        height={node.h}
        rx="10"
        class="diagram-node-box"
        stroke-width="1.5"
      />
      <text
        x={node.x + node.w / 2}
        y={node.sublabel ? node.y + node.h / 2 - 4 : node.y + node.h / 2 + 5}
        text-anchor="middle"
        class="diagram-label"
        font-size="14"
        font-weight="700"
        font-family="Inter Variable, system-ui, sans-serif"
      >
        {node.label}
      </text>
      {#if node.sublabel}
        <text
          x={node.x + node.w / 2}
          y={node.y + node.h / 2 + 16}
          text-anchor="middle"
          class="diagram-sublabel"
          font-size="11.5"
          font-family="JetBrains Mono Variable, ui-monospace, monospace"
        >
          {node.sublabel}
        </text>
      {/if}
    </g>
  {/each}
{/snippet}

<figure class="mt-10 md:mt-14">
  {#if canZoom}
    <button
      type="button"
      onclick={openModal}
      aria-label={`Zoom diagram: ${diagram.title}`}
      aria-describedby={descId}
      class="group block w-full rounded-[24px] bg-surface p-5 text-left transition-colors duration-150 hover:bg-rule/45 active:opacity-85 sm:p-8 md:p-12"
    >
      <svg
        role="img"
        viewBox={`0 0 ${diagram.width} ${diagram.height}`}
        class="diagram-svg h-auto w-full"
        aria-label={diagram.title}
      >
        <title>{diagram.title}</title>
        {@render diagramContent(inlineArrowId)}
      </svg>

      <span
        class="mt-4 flex justify-end font-mono text-xs text-ink-secondary underline decoration-ink-secondary/60 underline-offset-4 group-hover:text-ink"
      >
        Zoom diagram
      </span>
    </button>
  {:else}
    <div class="rounded-[24px] bg-surface p-5 sm:p-8 md:p-12">
      <svg
        role="img"
        viewBox={`0 0 ${diagram.width} ${diagram.height}`}
        class="diagram-svg h-auto w-full"
        aria-label={diagram.title}
        aria-describedby={descId}
      >
        <title>{diagram.title}</title>
        {@render diagramContent(inlineArrowId)}
      </svg>
    </div>
  {/if}
  <figcaption id={descId} class="sr-only">{diagramSummary}</figcaption>
</figure>

<dialog
  bind:this={dialogEl}
  class="diagram-dialog"
  aria-labelledby={dialogTitleId}
  aria-describedby={descId}
  {...{ closedby: 'any' } as Record<string, string>}
  onclose={handleDialogClose}
  onpointerdown={handleDialogPointerDown}
  onpointerup={handleDialogPointerUp}
>
  {#if isOpen}
    <h2 id={dialogTitleId} class="sr-only">{diagram.title}</h2>
    <div class="diagram-dialog-header">
      <p class="font-mono text-xs text-ink-secondary" aria-hidden="true">
        {zoomPercent}%
      </p>
      <p class="sr-only" aria-live="polite">{announcedZoom}</p>

      <div class="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onclick={() => {
            if (!atMinZoom) void setScaleCentered(scale - ZOOM_STEP);
          }}
          aria-disabled={atMinZoom ? 'true' : undefined}
          aria-label="Zoom out"
          class={`btn-frame inline-flex min-h-[44px] min-w-[44px] items-center justify-center border border-ink-secondary px-3 font-mono text-sm text-ink transition-colors duration-150 active:opacity-75 ${
            atMinZoom ? 'opacity-40' : 'hover:border-ink hover:bg-ink hover:text-ink-inverse'
          }`}
        >
          -
        </button>
        <button
          type="button"
          onclick={() => setScaleCentered(1)}
          class="btn-frame inline-flex min-h-[44px] items-center justify-center border border-ink-secondary px-3 text-sm text-ink transition-colors duration-150 hover:border-ink hover:bg-ink hover:text-ink-inverse active:opacity-75"
        >
          Reset
        </button>
        <!-- svelte-ignore a11y_autofocus -->
        <button
          type="button"
          autofocus
          onclick={() => {
            if (!atMaxZoom) void setScaleCentered(scale + ZOOM_STEP);
          }}
          aria-disabled={atMaxZoom ? 'true' : undefined}
          aria-label="Zoom in"
          class={`btn-frame inline-flex min-h-[44px] min-w-[44px] items-center justify-center border border-ink-secondary px-3 font-mono text-sm text-ink transition-colors duration-150 active:opacity-75 ${
            atMaxZoom ? 'opacity-40' : 'hover:border-ink hover:bg-ink hover:text-ink-inverse'
          }`}
        >
          +
        </button>
        <form method="dialog">
          <button
            type="submit"
            class="btn-frame inline-flex min-h-[44px] items-center justify-center border border-ink bg-ink px-4 text-sm text-ink-inverse transition-opacity duration-150 hover:opacity-85 active:opacity-70"
          >
            Close
          </button>
        </form>
      </div>
    </div>

    <!-- Scrollable region needs tabindex="0" so keyboard users can pan zoomed diagrams with arrow keys. -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div
      bind:this={viewportEl}
      role="region"
      aria-label={diagram.title}
      tabindex="0"
      class="diagram-dialog-viewport"
      onpointerdown={handleViewportPointerDown}
      onpointermove={handleViewportPointerMove}
      onpointerup={handleViewportPointerUp}
      onpointercancel={handleViewportPointerUp}
      onwheel={handleWheel}
      ondblclick={handleDoubleClick}
    >
      <div class="diagram-dialog-canvas">
        <svg
          aria-hidden="true"
          viewBox={`0 0 ${diagram.width} ${diagram.height}`}
          width={scaledWidth}
          height={scaledHeight}
          class="diagram-svg block shrink-0"
        >
          {@render diagramContent(modalArrowId)}
        </svg>
      </div>
    </div>
  {/if}
</dialog>
