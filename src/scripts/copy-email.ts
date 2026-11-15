export {};

const statusEl = document.getElementById('copy-status');
const buttons = document.querySelectorAll<HTMLButtonElement>('[data-copy-email]');

buttons.forEach((button) => {
  button.hidden = false;
  let resetTimer: number | undefined;

  button.addEventListener('click', async () => {
    const email = button.dataset.copyEmail;
    if (!email) return;

    const defaultLabel = button.dataset.defaultLabel ?? 'Copy email';

    try {
      if (!navigator.clipboard) {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.writeText(email);
      button.textContent = 'Copied';
      if (statusEl) {
        statusEl.textContent = 'Email address copied to clipboard.';
      }
      if (resetTimer) {
        window.clearTimeout(resetTimer);
      }
      resetTimer = window.setTimeout(() => {
        button.textContent = defaultLabel;
      }, 2000);
    } catch {
      if (statusEl) {
        statusEl.textContent = 'Could not copy. Select the address manually.';
      }
    }
  });
});
