/**
 * src/ui/app.ts
 *
 * Application state machine.
 * The app has views: landing → loading → results → (saved / how-to-export / privacy).
 * State is managed here; each view is a function that returns an HTMLElement.
 */

import type { SerializedStats } from '../worker/analyzer.worker.ts';
import type { ParseOptions } from '../parser/types.ts';

// ─── State ────────────────────────────────────────────────────────────────────

export type AppView = 'landing' | 'loading' | 'results' | 'how-to-export' | 'privacy' | 'saved' | 'tools';

export type TabId = 'overview' | 'per-person' | 'compare' | 'timeline' | 'activity' | 'words';

export interface AppState {
  view: AppView;
  /** Active analytics results tab when in results view */
  activeResultTab: TabId;
  /** Progress 0–100 */
  progress: number;
  progressStage: string;
  /** Results after analysis */
  stats: SerializedStats | null;
  /** Error message if analysis failed */
  error: string | null;
  errorCode: string | null;
  /** Whether we are waiting for a manual format retry */
  needsFormatSelection: boolean;
  /** The raw text of the file (held only while analyzing) */
  pendingText: string | null;
  /** The filename (for display only — never stored) */
  filename: string | null;
}

type Listener = (state: AppState) => void;

const initialHash = typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : '';
const initialView: AppView = (['how-to-export', 'privacy', 'saved', 'tools'] as AppView[]).includes(initialHash as AppView)
  ? (initialHash as AppView)
  : 'landing';

let _state: AppState = {
  view: initialView,
  activeResultTab: 'overview',
  progress: 0,
  progressStage: '',
  stats: null,
  error: null,
  errorCode: null,
  needsFormatSelection: false,
  pendingText: null,
  filename: null,
};

const _listeners: Set<Listener> = new Set();

export function getState(): AppState {
  return _state;
}

export function setState(patch: Partial<AppState>): void {
  _state = { ..._state, ...patch };
  for (const fn of _listeners) {
    fn(_state);
  }
}

export function subscribe(fn: Listener): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

// ─── Worker management ────────────────────────────────────────────────────────

let _worker: Worker | null = null;

function getWorker(): Worker {
  if (!_worker) {
    _worker = new Worker(
      new URL('../worker/analyzer.worker.ts', import.meta.url),
      { type: 'module' },
    );
  }
  return _worker;
}

function terminateWorker(): void {
  if (_worker) {
    _worker.terminate();
    _worker = null;
  }
}

// ─── Analysis action ──────────────────────────────────────────────────────────

export function analyzeText(text: string, filename: string, options?: ParseOptions): void {
  // Clear any previous error and raw text from memory when not needed
  setState({
    view: 'loading',
    progress: 0,
    progressStage: 'reading',
    error: null,
    errorCode: null,
    needsFormatSelection: false,
    stats: null,
    pendingText: text,
    filename,
  });

  const worker = getWorker();

  worker.onmessage = (e: MessageEvent) => {
    const msg = e.data as { type: string; payload: unknown };

    if (msg.type === 'progress') {
      const p = msg.payload as { stage: string; percent: number };
      setState({ progress: p.percent, progressStage: p.stage });
    } else if (msg.type === 'result') {
      // Clear raw text from memory
      setState({
        view: 'results',
        stats: msg.payload as SerializedStats,
        pendingText: null,
        progress: 100,
      });
    } else if (msg.type === 'error') {
      const err = msg.payload as { code: string; message: string };
      const needsFormatSelection =
        err.code === 'no_messages_found' || err.code === 'unsupported_format';
      setState({
        view: 'loading',
        error: err.message,
        errorCode: err.code,
        needsFormatSelection,
        pendingText: needsFormatSelection ? text : null,
      });
    }
  };

  worker.onerror = (e) => {
    setState({
      error: 'An unexpected error occurred. Please try again.',
      errorCode: 'worker_error',
      pendingText: null,
    });
    console.error('Worker error:', e);
  };

  worker.postMessage({ type: 'analyze', payload: { text, options } });
}

export function retryWithOptions(options: ParseOptions): void {
  const { pendingText, filename } = getState();
  if (!pendingText) return;
  analyzeText(pendingText, filename ?? 'chat', options);
}

export function resetToLanding(): void {
  terminateWorker();
  if (typeof window !== 'undefined' && window.location.hash) {
    history.pushState(null, '', window.location.pathname);
  }
  setState({
    view: 'landing',
    activeResultTab: 'overview',
    progress: 0,
    progressStage: '',
    stats: null,
    error: null,
    errorCode: null,
    needsFormatSelection: false,
    pendingText: null,
    filename: null,
  });
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
}

export function navigateTo(view: AppView): void {
  setState({ view });
  if (typeof window !== 'undefined') {
    const hash = view === 'landing' ? '' : `#${view}`;
    if (window.location.hash !== hash) {
      history.pushState(null, '', hash || window.location.pathname);
    }
  }
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
}

export function navigateToResultTab(tab: TabId, options?: { scrollTo?: string }): void {
  const state = getState();
  if (state.stats) {
    if (state.view !== 'results') {
      setState({ view: 'results', activeResultTab: tab });
    } else {
      setState({ activeResultTab: tab });
      window.dispatchEvent(
        new CustomEvent('switch-result-tab', { detail: { tab, scrollTo: options?.scrollTo } })
      );
    }
  } else {
    // If no stats yet, load the demo chat and immediately open this target tab
    setState({ activeResultTab: tab });
    loadSampleChat(tab, options?.scrollTo);
  }
}

// ─── Browser History & Popstate ───────────────────────────────────────────────

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    const hash = window.location.hash.replace(/^#/, '');
    const validViews: AppView[] = ['landing', 'how-to-export', 'privacy', 'saved', 'tools'];
    if (validViews.includes(hash as AppView)) {
      setState({ view: hash as AppView });
    } else if (!hash) {
      const s = getState();
      if (s.view !== 'results' && s.view !== 'loading') {
        setState({ view: 'landing' });
      }
    }
  });
}

export async function loadSampleChat(targetTab?: TabId, scrollTo?: string): Promise<void> {
  if (targetTab) {
    _state.activeResultTab = targetTab;
  }
  try {
    const response = await fetch('/samples/fake_group_ios.txt');
    if (!response.ok) throw new Error('Sample not found');
    const text = await response.text();
    analyzeText(text, 'sample_group_chat.txt');
    if (scrollTo) {
      setTimeout(() => {
        document.querySelector(scrollTo)?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  } catch {
    const fallback = [
      '[01/01/2024, 10:00:00] Hassan: Happy new year!',
      '[01/01/2024, 10:01:00] Ahmad: Happy new year to you too!',
      '[01/01/2024, 10:02:00] Sara: What are your plans for this year?',
      '[01/01/2024, 10:05:00] Ahmad: Working on a new project. Very excited about it.',
      '[02/01/2024, 09:00:00] Hassan: Good morning. Did you start the project?',
      '[02/01/2024, 09:02:00] Ahmad: Yes! Made great progress yesterday.',
      '[03/01/2024, 11:00:00] Sara: <Media omitted>',
      '[03/01/2024, 11:01:00] Hassan: That looks amazing. Well done.',
    ].join('\n');
    analyzeText(fallback, 'demo_chat.txt');
    if (scrollTo) {
      setTimeout(() => {
        document.querySelector(scrollTo)?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }
}
