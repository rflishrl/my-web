<script lang="ts">
  import type { NavLink } from '../data/nav';

  interface Props {
    links: readonly NavLink[];
    compactMediaQuery: string;
  }

  const { links, compactMediaQuery }: Props = $props();
  const uid = $props.id();
  const menuId = `nav-links-${uid}`;

  let containerEl = $state<HTMLDivElement | null>(null);
  let popoverEl = $state<HTMLUListElement | null>(null);
  let isOpen = $state(false);

  function close(): void {
    if (popoverEl && isOpen) {
      popoverEl.hidePopover();
    }
  }

  function handleToggle(event: ToggleEvent): void {
    isOpen = event.newState === 'open';
  }

  function handleFocusOut(event: FocusEvent): void {
    if (!isOpen || !containerEl) return;
    const nextFocus = event.relatedTarget;
    if (nextFocus instanceof Node && !containerEl.contains(nextFocus)) {
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

<div class="nav-menu" bind:this={containerEl} onfocusout={handleFocusOut}>
  <button
    type="button"
    class="nav-menu-button"
    popovertarget={menuId}
    popovertargetaction="toggle"
    aria-controls={menuId}
    aria-expanded={isOpen ? 'true' : 'false'}
  >
    Menu
  </button>
  <ul id={menuId} bind:this={popoverEl} class="nav-links" popover="auto" ontoggle={handleToggle}>
    {#each links as item (item.href)}
      <li>
        <a href={item.href} aria-current={item.current ? 'page' : undefined} onclick={close}>
          {item.label}
        </a>
      </li>
    {/each}
  </ul>
</div>
