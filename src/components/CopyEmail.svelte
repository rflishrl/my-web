<script lang="ts">
  interface Props {
    email: string;
    label?: string;
    inverse?: boolean;
  }

  type CopyState = 'idle' | 'copied' | 'failed';

  const { email, label = 'Copy email', inverse = false }: Props = $props();

  let mounted = $state(false);
  let copyState = $state<CopyState>('idle');
  let resetTimer: ReturnType<typeof setTimeout> | undefined;
  let lastAnnouncement = '';

  const buttonLabel = $derived(
    copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed' : label,
  );

  function announce(message: string): void {
    const statusEl = document.getElementById('copy-status');
    if (!statusEl) return;
    // Append a non-breaking space when repeating so VoiceOver re-announces identical statuses.
    const nextMessage = message === lastAnnouncement ? `${message}\u00A0` : message;
    lastAnnouncement = message;
    statusEl.textContent = nextMessage;
  }

  async function handleCopy(): Promise<void> {
    if (!email) return;

    try {
      if (!navigator.clipboard) {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.writeText(email);
      copyState = 'copied';
      announce('Email address copied to clipboard.');
    } catch {
      copyState = 'failed';
      announce('Could not copy. Select the address manually.');
    }

    if (resetTimer !== undefined) {
      clearTimeout(resetTimer);
    }
    resetTimer = setTimeout(() => {
      copyState = 'idle';
    }, 2000);
  }

  $effect(() => {
    mounted = true;
    return () => {
      if (resetTimer !== undefined) {
        clearTimeout(resetTimer);
      }
    };
  });
</script>

<button
  type="button"
  hidden={!mounted}
  data-copy-email={email}
  data-copied={copyState === 'copied' ? '' : undefined}
  data-failed={copyState === 'failed' ? '' : undefined}
  onclick={handleCopy}
  class={`inline-flex min-h-[44px] items-center border px-3 text-sm transition-colors duration-150 active:opacity-75 ${
    inverse
      ? 'border-ink-inverse-muted text-ink-inverse hover:border-ink-inverse hover:bg-ink-inverse hover:text-inverse'
      : 'border-ink-secondary text-ink hover:border-ink hover:bg-ink hover:text-ink-inverse'
  }`}
>
  {buttonLabel}
</button>
