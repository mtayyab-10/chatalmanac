/**
 * src/ui/components/import-zone.ts
 *
 * The file import drop zone — the hero element of the landing page.
 * Handles drag-and-drop, click-to-browse, and zip file reading.
 */

import { analyzeText, setState } from '../app.ts';
import { parseJSONBackup } from '../../storage/exports.ts';
import { t } from '../../locales/index.ts';

/** Max file size in bytes (50 MB) */
const MAX_BYTES = 50 * 1024 * 1024;

/** 30 MB threshold for mobile warning */
const WARN_BYTES = 30 * 1024 * 1024;

export function renderImportZone(onSampleRequested: () => void): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'import-zone-wrapper';

  function build(): void {
    const locale = t();
    wrapper.innerHTML = `
      <div class="import-zone" id="import-zone" role="button" tabindex="0"
           aria-label="${locale.landing.dropzoneLabel}">
        <input type="file" id="file-input" class="sr-only"
               accept=".txt,.zip,.json"
               aria-label="${locale.landing.dropzoneLabel}">

        <div class="import-zone__icon" aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect x="4" y="4" width="40" height="40" rx="10" fill="var(--color-accent-dim)" stroke="var(--color-accent)" stroke-width="1.5"/>
            <path d="M24 14v16M17 21l7-7 7 7" stroke="var(--color-accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <rect x="12" y="32" width="24" height="3" rx="1.5" fill="var(--color-accent)" opacity="0.4"/>
          </svg>
        </div>

        <div class="import-zone__content">
          <p class="import-zone__label">${locale.landing.dropzoneLabel}</p>
          <p class="import-zone__hint">${locale.landing.dropzoneHint}</p>
          <p class="import-zone__formats text-subtle text-xs">${locale.landing.dropzoneFormats}</p>
        </div>

        <div class="import-zone__footer">
          <span class="import-zone__specs text-subtle text-xs">
            ${locale.landing.privacyNote}
          </span>
        </div>
      </div>

      <div class="import-zone__error hidden" id="import-error" role="alert" aria-live="polite"></div>

      <div class="import-zone__actions">
        <p class="text-muted text-sm">${locale.landing.orTryDemo}</p>
        <button class="btn btn--secondary btn--sm" id="try-sample-btn" type="button">
          ${locale.landing.tryDemoBtn || 'Try demo chat'}
        </button>
      </div>
    `;

    const zone = wrapper.querySelector('#import-zone') as HTMLElement;
    const fileInput = wrapper.querySelector('#file-input') as HTMLInputElement;
    const errorEl = wrapper.querySelector('#import-error') as HTMLElement;
    const sampleBtn = wrapper.querySelector('#try-sample-btn') as HTMLButtonElement;

    function showError(msg: string): void {
      errorEl.textContent = msg;
      errorEl.classList.remove('hidden');
      zone.classList.remove('drag-over');
    }

    function clearError(): void {
      errorEl.classList.add('hidden');
      errorEl.textContent = '';
    }

    async function handleFile(file: File): Promise<void> {
      clearError();

      if (file.size > MAX_BYTES) {
        showError(locale.errors.file_too_large);
        return;
      }

      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile && file.size > WARN_BYTES) {
        showError(locale.landing.sizeWarning);
        // Proceed anyway after warning
      }

      try {
        if (file.name.endsWith('.json')) {
          const raw = await file.text();
          const { stats } = parseJSONBackup(raw);
          const baseName = file.name.replace(/_chatalmanac\.json$/i, '').replace(/\.json$/i, '');
          setState({ view: 'results', stats, filename: baseName });
          return;
        }

        let text: string;

        if (file.name.endsWith('.zip')) {
          // Read zip file
          const { default: JSZip } = await import('jszip');
          const zip = await JSZip.loadAsync(file);
          // Find the first .txt file in the zip
          const txtEntry = Object.values(zip.files).find(
            (f) => !f.dir && f.name.endsWith('.txt'),
          );
          if (!txtEntry) {
            showError(locale.errors.zip_read_error);
            return;
          }
          text = await txtEntry.async('string');
        } else {
          text = await file.text();
        }

        analyzeText(text, file.name);
      } catch (err) {
        showError(err instanceof Error ? err.message : locale.errors.zip_read_error);
      }
    }

    // Click to browse
    zone.addEventListener('click', () => fileInput.click());
    zone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput.click();
      }
    });

    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (file) handleFile(file);
      fileInput.value = ''; // reset so same file can be selected again
    });

    // Drag and drop
    zone.addEventListener('dragenter', (e) => {
      e.preventDefault();
      zone.classList.add('drag-over');
    });
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('drag-over');
    });
    zone.addEventListener('dragleave', (e) => {
      if (!zone.contains(e.relatedTarget as Node)) {
        zone.classList.remove('drag-over');
      }
    });
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      const file = e.dataTransfer?.files?.[0];
      if (file) handleFile(file);
    });

    // Page-wide drop handler scoped to element lifecycle
    const onDocDragOver = (e: DragEvent): void => e.preventDefault();
    const onDocDrop = (e: DragEvent): void => {
      e.preventDefault();
      if (!wrapper.isConnected) {
        document.removeEventListener('dragover', onDocDragOver);
        document.removeEventListener('drop', onDocDrop);
        return;
      }
      const file = e.dataTransfer?.files?.[0];
      if (file && !zone.contains(e.target as Node)) {
        handleFile(file);
      }
    };

    document.addEventListener('dragover', onDocDragOver);
    document.addEventListener('drop', onDocDrop);

    // Sample chat button
    sampleBtn.addEventListener('click', onSampleRequested);
  }

  build();
  return wrapper;
}
