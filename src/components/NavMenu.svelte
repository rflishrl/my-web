<script lang="ts">
  import type { NavLink } from '../data/nav';

  interface Props {
    links: readonly NavLink[];
    compactMediaQuery: string;
  }

  const { links, compactMediaQuery }: Props = $props();

  let detailsEl = $state<HTMLDetailsElement | null>(null);
  let summaryEl = $state<HTMLElement | null>(null);

  function close(): void {
    if (detailsEl) {
      detailsEl.open = false;
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && detailsEl?.open) {
      close();
      summaryEl?.focus();
    }
  }

  function handlePointerDown(event: PointerEvent): void {
    if (!detailsEl?.open || !(event.target instanceof Node)) return;
    const navEl = detailsEl.closest('.site-nav') ?? detailsEl;
    if (!navEl.contains(event.target)) {
      close();
    }
  }

  function handleFocusOut(event: FocusEvent): void {
    if (!detailsEl?.open) return;
    const nextFocus = event.relatedTarget;
    const navEl = detailsEl.closest('.site-nav') ?? detailsEl;
    if (nextFocus instanceof Node && !navEl.contains(nextFocus)) {
      close();
    }
  }

  $effect(() => {
    const mq = window.matchMedia(compactMediaQuery);
    const handleMediaChange = (event: MediaQueryListEvent): void => {
      if (!event.matches) {
        close();
      }
    };
    mq.addEventListener('change', handleMediaChange);
    return () => {
      mq.removeEventListener('change', handleMediaChange);
    };
  });
</script>

<svelte:window onkeydown={handleKeydown} onpointerdown={handlePointerDown} />

<details class="nav-menu" bind:this={detailsEl} onfocusout={handleFocusOut}>
  <summary bind:this={summaryEl}>Menu</summary>
  <ul class="nav-links">
    {#each links as item (item.href)}
      <li>
        <a href={item.href} aria-current={item.current ? 'page' : undefined} onclick={close}>
          {item.label}
        </a>
      </li>
    {/each}
  </ul>
</details>
