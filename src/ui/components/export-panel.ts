/**
 * src/ui/components/export-panel.ts
 *
 * The export / save panel that appears at the bottom of the results view.
 * Contains: Save to device, Export JSON, Export CSV, Share card (PNG).
 */

import type { SerializedStats } from '../../worker/analyzer.worker.ts';
import { saveResult } from '../../storage/db.ts';
import { exportJSON, exportCSV, exportShareCard } from '../../storage/exports.ts';
import { getState } from '../app.ts';

export function renderExportPanel(stats: SerializedStats): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'container export-panel-wrapper';

  const panel = document.createElement('div');
  panel.className = 'export-panel card';
  panel.id = 'export-panel';
  wrapper.appendChild(panel);

  function build(savedId: string | null = null): void {
    panel.innerHTML = `
      <div class="export-panel__header">
        <div>
          <h2 class="export-panel__title">Save and export</h2>
          <p class="export-panel__subtitle text-muted text-sm">
            Everything stays on your device. No data is sent anywhere.
          </p>
        </div>
        <span class="badge badge--teal export-panel__badge">
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M6 1L1 3.5v3C1 9.1 3.3 11.2 6 12c2.7-.8 5-2.9 5-5.5v-3L6 1z" fill="var(--color-accent)" opacity="0.8"/>
          </svg>
          local only
        </span>
      </div>

      <div class="export-panel__actions">

        <!-- Save to device (IndexedDB) -->
        <div class="export-action">
          <div class="export-action__info">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M4 2h9l3 3v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke="var(--color-accent)" stroke-width="1.3" fill="none"/>
              <path d="M6 2v5h8V2" stroke="var(--color-accent)" stroke-width="1.3"/>
              <path d="M6 11h8M6 14h5" stroke="var(--color-accent)" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
            <div>
              <p class="font-medium text-sm">Save to this browser</p>
              <p class="text-subtle text-xs">Stored in your browser's local database. Open Chatalmanac later to view it again.</p>
            </div>
          </div>
          ${savedId
            ? `<span class="badge badge--teal" id="saved-badge">Saved</span>`
            : `<button class="btn btn--primary btn--sm" id="save-btn" type="button">Save</button>`
          }
        </div>

        <div class="export-panel__divider"></div>

        <!-- JSON -->
        <div class="export-action">
          <div class="export-action__info">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <rect x="3" y="2" width="14" height="16" rx="2" stroke="var(--color-indigo)" stroke-width="1.3"/>
              <path d="M7 7h6M7 10h6M7 13h4" stroke="var(--color-indigo)" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
            <div>
              <p class="font-medium text-sm">Export as JSON</p>
              <p class="text-subtle text-xs">Full statistics file. Can be re-loaded into Chatalmanac in the future.</p>
            </div>
          </div>
          <button class="btn btn--secondary btn--sm" id="export-json-btn" type="button">Download</button>
        </div>

        <!-- CSV -->
        <div class="export-action">
          <div class="export-action__info">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <rect x="3" y="2" width="14" height="16" rx="2" stroke="var(--color-indigo)" stroke-width="1.3"/>
              <path d="M7 7h6M7 10h6M7 13h6" stroke="var(--color-indigo)" stroke-width="1.3" stroke-linecap="round"/>
              <path d="M3 7h14" stroke="var(--color-indigo)" stroke-width="1" opacity="0.4"/>
            </svg>
            <div>
              <p class="font-medium text-sm">Export as CSV</p>
              <p class="text-subtle text-xs">Per-person statistics table. Opens in Excel, Google Sheets, or any spreadsheet app.</p>
            </div>
          </div>
          <button class="btn btn--secondary btn--sm" id="export-csv-btn" type="button">Download</button>
        </div>

        <!-- Share card PNG -->
        <div class="export-action">
          <div class="export-action__info">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <rect x="2" y="4" width="16" height="12" rx="2" stroke="var(--color-indigo)" stroke-width="1.3"/>
              <circle cx="7" cy="9" r="2" stroke="var(--color-indigo)" stroke-width="1.2"/>
              <path d="M2 14l4-3 3 2 4-4 5 5" stroke="var(--color-indigo)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <div>
              <p class="font-medium text-sm">Share card</p>
              <p class="text-subtle text-xs">Download a visual summary card as a PNG image — ready to share in messages or stories.</p>
            </div>
          </div>
          <button class="btn btn--secondary btn--sm" id="export-card-btn" type="button">Download</button>
        </div>

        <div class="export-panel__divider"></div>

        <!-- Print / Save as PDF -->
        <div class="export-action">
          <div class="export-action__info">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <rect x="4" y="2" width="12" height="9" rx="1" stroke="var(--color-indigo)" stroke-width="1.3"/>
              <path d="M4 9h12v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9z" stroke="var(--color-indigo)" stroke-width="1.3"/>
              <path d="M7 13h6M7 16h4" stroke="var(--color-indigo)" stroke-width="1.3" stroke-linecap="round"/>
              <circle cx="15" cy="6" r="1" fill="var(--color-indigo)"/>
            </svg>
            <div>
              <p class="font-medium text-sm">Print / Save as PDF</p>
              <p class="text-subtle text-xs">Open your browser's print dialog — choose "Save as PDF" to get a PDF copy. Stays on your device.</p>
            </div>
          </div>
          <button class="btn btn--secondary btn--sm" id="export-print-btn" type="button">Print</button>
        </div>
      </div>
    `;

    // Wire buttons
    const saveBtn = panel.querySelector<HTMLButtonElement>('#save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        saveBtn.textContent = 'Saving…';
        saveBtn.disabled = true;
        try {
          const filename = getState().filename ?? 'chat';
          const id = await saveResult(stats, filename);
          build(id);
          showToast('Analysis saved to this browser.');
        } catch {
          saveBtn.textContent = 'Save';
          saveBtn.disabled = false;
          showToast('Could not save — your browser may have storage disabled.', true);
        }
      });
    }

    panel.querySelector('#export-json-btn')?.addEventListener('click', () => {
      exportJSON(stats);
    });

    panel.querySelector('#export-csv-btn')?.addEventListener('click', () => {
      exportCSV(stats);
    });

    panel.querySelector('#export-card-btn')?.addEventListener('click', async () => {
      const btn = panel.querySelector<HTMLButtonElement>('#export-card-btn')!;
      btn.textContent = 'Generating…';
      btn.disabled = true;
      try {
        await exportShareCard(stats);
      } finally {
        btn.textContent = 'Download';
        btn.disabled = false;
      }
    });

    panel.querySelector('#export-print-btn')?.addEventListener('click', () => {
      window.print();
    });
  }

  build();
  return wrapper;
}

// ─── Toast notification ───────────────────────────────────────────────────────

let activeToastTimer: ReturnType<typeof setTimeout> | null = null;

function showToast(message: string, isError = false): void {
  // Clear existing timer and toast element
  if (activeToastTimer !== null) {
    clearTimeout(activeToastTimer);
    activeToastTimer = null;
  }
  document.querySelector('.app-toast')?.remove();

  const toast = document.createElement('div');
  toast.className = `app-toast ${isError ? 'app-toast--error' : ''}`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.innerHTML = `
    <span>${message}</span>
    <button class="app-toast__close" aria-label="Dismiss" type="button">×</button>
  `;

  document.body.appendChild(toast);

  // Auto-dismiss after 4 seconds
  activeToastTimer = setTimeout(() => {
    toast.remove();
    activeToastTimer = null;
  }, 4000);

  toast.querySelector('.app-toast__close')!.addEventListener('click', () => {
    if (activeToastTimer !== null) {
      clearTimeout(activeToastTimer);
      activeToastTimer = null;
    }
    toast.remove();
  });

  // Animate in
  requestAnimationFrame(() => toast.classList.add('app-toast--visible'));
}
