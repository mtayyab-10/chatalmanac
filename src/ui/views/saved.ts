/**
 * src/ui/views/saved.ts
 *
 * Saved results list view.
 * Shows all analyses the user has saved to their browser's IndexedDB.
 * Lets them reload a result, export/import backups, or delete saved analyses.
 */

import { loadAllResults, deleteResult, clearAllResults, saveResult } from '../../storage/db.ts';
import type { SavedResult } from '../../storage/db.ts';
import { parseJSONBackup } from '../../storage/exports.ts';
import { navigateTo, setState } from '../app.ts';
import { escapeHtml } from '../../utils/sanitize.ts';

export async function renderSaved(): Promise<HTMLElement> {
  const page = document.createElement('div');
  page.className = 'saved-page animate-fade-in';

  let results: SavedResult[] = [];
  try {
    results = await loadAllResults();
  } catch {
    // IndexedDB unavailable (private browsing, storage quota exceeded, etc.)
  }

  function renderContent(): void {
    page.innerHTML = `
      <div class="container">
        <div class="saved-page__header">
          <div>
            <h1 class="section-heading">Saved analyses</h1>
            <p class="text-muted text-sm">
              ${results.length === 0
                ? 'Nothing saved yet. After analyzing a chat, click "Save" at the bottom of the results page.'
                : `${results.length} saved ${results.length === 1 ? 'analysis' : 'analyses'} — stored only in this browser.`
              }
            </p>
          </div>
          <div class="saved-page__header-actions">
            <input type="file" id="import-backup-input" class="sr-only" accept=".json" aria-label="Import JSON backup file">
            <button class="btn btn--secondary btn--sm" id="import-backup-btn" type="button">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 2v8M4 6l4-4 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 12v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              Import backup
            </button>
            ${results.length > 0 ? `
              <button class="btn btn--ghost btn--sm text-danger" id="clear-all-btn" type="button">
                Clear all
              </button>
            ` : ''}
          </div>
        </div>

        <div class="saved-list" id="saved-list">
          ${results.length === 0
            ? `<div class="saved-empty">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                  <rect x="8" y="6" width="32" height="36" rx="4" stroke="var(--color-text-subtle)" stroke-width="1.5"/>
                  <path d="M16 18h16M16 24h16M16 30h10" stroke="var(--color-text-subtle)" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <p class="text-muted">No saved analyses yet.</p>
                <div class="saved-empty__actions">
                  <button class="btn btn--primary btn--sm" id="go-home-btn" type="button">Analyze a chat</button>
                </div>
              </div>`
            : results.map((r) => savedCard(r)).join('')
          }
        </div>
      </div>
    `;

    bindEvents();
  }

  function bindEvents(): void {
    // Go home / analyze
    page.querySelector('#go-home-btn')?.addEventListener('click', () => {
      navigateTo('landing');
    });

    // Import backup file trigger
    const backupInput = page.querySelector<HTMLInputElement>('#import-backup-input');
    const backupBtn = page.querySelector<HTMLButtonElement>('#import-backup-btn');

    backupBtn?.addEventListener('click', () => {
      backupInput?.click();
    });

    backupInput?.addEventListener('change', async () => {
      const file = backupInput.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const { stats } = parseJSONBackup(text);
        const name = file.name.replace(/_chatalmanac\.json$/i, '').replace(/\.json$/i, '');
        await saveResult(stats, name);
        results = await loadAllResults();
        renderContent();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Invalid backup file.');
      } finally {
        backupInput.value = '';
      }
    });

    // Clear all
    page.querySelector('#clear-all-btn')?.addEventListener('click', async () => {
      if (!confirm('Delete all saved analyses? This cannot be undone.')) return;
      await clearAllResults();
      results = [];
      renderContent();
    });

    // View result buttons
    page.querySelectorAll<HTMLButtonElement>('[data-load]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset['load']!;
        const record = results.find((r) => r.id === id);
        if (!record) return;
        setState({ view: 'results', stats: record.stats, filename: record.filename });
      });
    });

    // Delete single result buttons
    page.querySelectorAll<HTMLButtonElement>('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset['delete']!;
        if (!confirm('Delete this saved analysis? This cannot be undone.')) return;
        await deleteResult(id);
        results = results.filter((r) => r.id !== id);
        renderContent();
      });
    });
  }

  renderContent();
  return page;
}

// ─── Card template ────────────────────────────────────────────────────────────

function savedCard(r: SavedResult): string {
  const dateRange = `${fmt(r.firstMessageTs)} – ${fmt(r.lastMessageTs)}`;
  const savedDate = fmt(r.savedAt);
  const names = r.participants.slice(0, 3).join(', ');

  return `
    <div class="saved-card card" data-card-id="${r.id}">
      <div class="saved-card__body">
        <div class="saved-card__avatars" aria-hidden="true">
          ${r.participants.slice(0, 3).map((name, i) => `
            <div class="saved-card__avatar" style="background:var(--chart-${(i % 6) + 1})20;color:var(--chart-${(i % 6) + 1})">
              ${escapeHtml(name.slice(0, 1).toUpperCase())}
            </div>
          `).join('')}
        </div>
        <div class="saved-card__info">
          <h3 class="saved-card__names">${escapeHtml(names)}${r.participants.length > 3 ? ` + ${r.participants.length - 3} more` : ''}</h3>
          <p class="text-muted text-sm">${dateRange}</p>
          <p class="text-subtle text-xs">${r.totalMessages.toLocaleString()} messages · saved ${savedDate}</p>
        </div>
      </div>
      <div class="saved-card__actions">
        <button class="btn btn--primary btn--sm" data-load="${r.id}" type="button">
          View results
        </button>
        <button class="btn btn--ghost btn--sm saved-card__delete" data-delete="${r.id}" type="button"
                aria-label="Delete analysis">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 5h10M7 5V3h2v2M6 5v7h4V5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Delete
        </button>
      </div>
    </div>
  `;
}

function fmt(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  });
}
