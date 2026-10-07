/**
 * src/ui/components/privacy-verify.ts
 *
 * "Verify it yourself" widget.
 * Walks the user through opening the browser Network tab and confirming
 * with their own eyes that no network requests are made during analysis.
 *
 * This is more powerful than any privacy statement because it gives users
 * the tools to check the claim themselves rather than asking them to trust us.
 */

export function renderPrivacyVerify(): HTMLElement {
  const el = document.createElement('div');
  el.className = 'privacy-verify card';
  el.id = 'privacy-verify';

  el.innerHTML = `
    <div class="privacy-verify__header">
      <div class="privacy-verify__icon" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="12" stroke="var(--color-accent)" stroke-width="1.8"/>
          <!-- Magnifying glass -->
          <circle cx="12" cy="12" r="5" stroke="var(--color-accent)" stroke-width="1.6"/>
          <path d="M16 16l4 4" stroke="var(--color-accent)" stroke-width="1.8" stroke-linecap="round"/>
          <!-- Check tick inside glass -->
          <path d="M10 12l1.5 1.5 2.5-2.5" stroke="var(--color-accent)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div>
        <h3 class="privacy-verify__title">Verify it yourself</h3>
        <p class="privacy-verify__subtitle text-muted text-sm">
          You do not need to trust our privacy claim. Here is how to check it in under one minute.
        </p>
      </div>
    </div>

    <div class="privacy-verify__steps" id="pv-steps">
      <button class="pv-step" id="pv-step-1" aria-expanded="false">
        <span class="pv-step__num" aria-hidden="true">1</span>
        <span class="pv-step__label">Open developer tools</span>
        <svg class="pv-step__chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
      <div class="pv-step__detail hidden" id="pv-detail-1">
        <p>Press <kbd>F12</kbd> on Windows or Linux, or <kbd>Cmd</kbd> + <kbd>Option</kbd> + <kbd>I</kbd> on a Mac.
        A panel will open at the bottom or side of the browser window.</p>
      </div>

      <button class="pv-step" id="pv-step-2" aria-expanded="false">
        <span class="pv-step__num" aria-hidden="true">2</span>
        <span class="pv-step__label">Go to the Network tab</span>
        <svg class="pv-step__chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
      <div class="pv-step__detail hidden" id="pv-detail-2">
        <p>Click the tab labelled <strong>Network</strong> inside the developer tools panel.
        You will see a list of all network requests the page has made.</p>
        <p>Click the clear button (a circle with a line through it, usually top-left of the Network panel)
        to clear any existing requests so the list is empty.</p>
      </div>

      <button class="pv-step" id="pv-step-3" aria-expanded="false">
        <span class="pv-step__num" aria-hidden="true">3</span>
        <span class="pv-step__label">Upload your chat file</span>
        <svg class="pv-step__chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
      <div class="pv-step__detail hidden" id="pv-detail-3">
        <p>Go back to the Chatalmanac tab and drop a chat file onto the page (or use the sample chat button).
        Watch the Network panel <em>while the analysis runs</em>.</p>
        <p>You will see one request for <code>fake_group_ios.txt</code> (or your file) loading into
        the page — that is the file being read. That request goes to <code>localhost</code>, not any
        external server.</p>
      </div>

      <button class="pv-step" id="pv-step-4" aria-expanded="false">
        <span class="pv-step__num" aria-hidden="true">4</span>
        <span class="pv-step__label">Check the results page</span>
        <svg class="pv-step__chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
      <div class="pv-step__detail hidden" id="pv-detail-4">
        <p>Once the results appear, look at the Network panel again.
        You will see <strong>no requests</strong> to any external domain —
        no analytics, no tracking pixels, no CDN calls.</p>
        <p>Every item in the list goes to <code>localhost</code> (in development) or your own domain
        (in production). Nothing goes to google.com, facebook.com, or anywhere else.</p>
        <p class="pv-success">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" style="display:inline;vertical-align:middle">
            <path d="M2 7l3.5 3.5 6.5-6.5" stroke="var(--color-accent)" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
          If you see only same-origin requests, the privacy promise is confirmed.
        </p>
      </div>
    </div>

    <div class="privacy-verify__footer">
      <p class="text-subtle text-xs">
        Still not convinced? The complete source code is on GitHub.
        Every function that touches your file is in <code>src/parser/</code> and <code>src/worker/</code>.
      </p>
    </div>
  `;

  // ── Accordion behavior ────────────────────────────────────────────────────

  const steps = el.querySelectorAll<HTMLButtonElement>('.pv-step');
  steps.forEach((btn, i) => {
    const detailId = `pv-detail-${i + 1}`;
    const detail = el.querySelector<HTMLElement>(`#${detailId}`);
    if (!detail) return;

    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      // Close all
      steps.forEach((b, j) => {
        b.setAttribute('aria-expanded', 'false');
        el.querySelector(`#pv-detail-${j + 1}`)?.classList.add('hidden');
      });
      // Toggle the clicked one
      if (!isOpen) {
        btn.setAttribute('aria-expanded', 'true');
        detail.classList.remove('hidden');
      }
    });
  });

  return el;
}
