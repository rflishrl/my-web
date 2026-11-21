<script lang="ts">
  interface Props {
    email: string;
    label?: string;
    inverse?: boolean;
  }

  type CopyState = 'idle' | 'copied' | 'failed';

  const { email, label = 'Copy email', inverse = false }: Props = $props();

  let copyState = $state<CopyState>('idle');
  let statusText = $state('');
  let resetTimer: ReturnType<typeof setTimeout> | undefined;
  let lastAnnouncement = '';

  function announce(message: string): void {
    // Append a non-breaking space when repeating so VoiceOver re-announces identical statuses.
    const nextMessage = message === lastAnnouncement ? `${message}\u00A0` : message;
    lastAnnouncement = message;
    statusText = '';
    requestAnimationFrame(() => {
      statusText = nextMessage;
    });
  }

  async function handleCopy(): Promise<void> {
    if (!email) return;

    try {
      if (!navigator.clipboard) {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.writeText(email);
      copyState = 'copied';
      announce('Copied');
    } catch {
      copyState = 'failed';
      announce('Copy failed');
    }

    if (resetTimer !== undefined) {
      clearTimeout(resetTimer);
    }
    resetTimer = setTimeout(() => {
      copyState = 'idle';
      statusText = '';
    }, 2000);
  }

  $effect(() => {
    return () => {
      if (resetTimer !== undefined) {
        clearTimeout(resetTimer);
      }
    };
  });
</script>

<span class="relative inline-flex items-center">
  <button
    type="button"
    data-copy-email={email}
    data-copied={copyState === 'copied' ? '' : undefined}
    data-failed={copyState === 'failed' ? '' : undefined}
    onclick={handleCopy}
    class={`btn-frame inline-flex min-h-[44px] items-center border px-3 text-sm transition-colors duration-150 active:opacity-75 ${
      inverse
        ? 'border-ink-inverse-muted text-ink-inverse hover:border-ink-inverse hover:bg-ink-inverse hover:text-inverse'
        : 'border-ink-secondary text-ink hover:border-ink hover:bg-ink hover:text-ink-inverse'
    }`}
  >
    {label}
  </button>
  <span
    role="status"
    data-copy-status
    class={`pointer-events-none absolute bottom-full left-0 mb-1.5 whitespace-nowrap border px-2 py-1 text-xs transition-opacity duration-150 ${
      statusText ? 'opacity-100' : 'opacity-0'
    } ${
      inverse
        ? 'border-ink-inverse bg-ink-inverse text-inverse'
        : 'border-ink bg-ink text-ink-inverse'
    }`}
  >
    {statusText}
  </span>
</span>
