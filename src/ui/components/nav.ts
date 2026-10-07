/**
 * src/ui/components/nav.ts
 *
 * Site header navigation.
 * Shows logo, nav links (How to export, Privacy, Saved results), language selector.
 */

import { renderLogo } from './logo.ts';
import { t, setLocale, currentLocale, SUPPORTED_LOCALES } from '../../locales/index.ts';
import type { LocaleCode } from '../../locales/index.ts';
import { navigateTo, resetToLanding, navigateToResultTab, getState, subscribe } from '../app.ts';
import { getTheme, toggleTheme } from '../theme.ts';

export function renderNav(): HTMLElement {
  const header = document.createElement('header');
  header.className = 'site-nav';
  header.setAttribute('role', 'banner');

  function updateActiveLink(): void {
    const currentView = getState().view;
    header.querySelectorAll<HTMLAnchorElement>('.nav-link[data-view]').forEach((link) => {
      const view = link.dataset['view'];
      if (view === currentView) {
        link.classList.add('nav-link--active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('nav-link--active');
        link.removeAttribute('aria-current');
      }
    });
  }

  function build(): void {
    const locale = t();
    const currentTheme = getTheme();

    header.innerHTML = `
      <div class="container">
        <nav class="nav-inner" role="navigation" aria-label="Main navigation">
          <a href="#" class="nav-logo" aria-label="Chatalmanac — go to home" id="nav-logo-link">
          </a>

          <ul class="nav-links" role="list">
            <li class="nav-item--dropdown" id="nav-item-tools">
              <a href="#" class="nav-link nav-link--dropdown" data-view="tools" id="nav-tools" aria-haspopup="true" aria-expanded="false">
                ${locale.nav.tools}
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true" class="nav-chevron">
                  <path d="M2.5 4.5l3.5 3.5 3.5-3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </a>
              <div class="nav-dropdown" role="menu" aria-label="${locale.nav.tools}">
                <a href="#" class="nav-dropdown__item" data-tool="activity" role="menuitem">
                  <div class="nav-dropdown__icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </div>
                  <div>
                    <div class="nav-dropdown__title">${locale.toolsPage.inactivity.title}</div>
                    <div class="nav-dropdown__desc text-muted">${locale.toolsPage.inactivity.badge}</div>
                  </div>
                </a>
                <a href="#" class="nav-dropdown__item" data-tool="words" role="menuitem">
                  <div class="nav-dropdown__icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
                    </svg>
                  </div>
                  <div>
                    <div class="nav-dropdown__title">${locale.toolsPage.counter.title}</div>
                    <div class="nav-dropdown__desc text-muted">${locale.toolsPage.counter.badge}</div>
                  </div>
                </a>
                <a href="#" class="nav-dropdown__item" data-tool="timeline" role="menuitem">
                  <div class="nav-dropdown__icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                    </svg>
                  </div>
                  <div>
                    <div class="nav-dropdown__title">${locale.toolsPage.heatmap.title}</div>
                    <div class="nav-dropdown__desc text-muted">${locale.toolsPage.heatmap.badge}</div>
                  </div>
                </a>
                <a href="#" class="nav-dropdown__item" data-tool="compare" role="menuitem">
                  <div class="nav-dropdown__icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    </svg>
                  </div>
                  <div>
                    <div class="nav-dropdown__title">${locale.toolsPage.compare.title}</div>
                    <div class="nav-dropdown__desc text-muted">${locale.toolsPage.compare.badge}</div>
                  </div>
                </a>
                <a href="#" class="nav-dropdown__item" data-tool="evidence" role="menuitem">
                  <div class="nav-dropdown__icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <div>
                    <div class="nav-dropdown__title">${locale.toolsPage.evidence.title}</div>
                    <div class="nav-dropdown__desc text-muted">${locale.toolsPage.evidence.badge}</div>
                  </div>
                </a>
                <div class="nav-dropdown__divider"></div>
                <a href="#" class="nav-dropdown__item nav-dropdown__item--all" data-view="tools" role="menuitem">
                  <span class="text-xs font-medium">All Tools Overview →</span>
                </a>
              </div>
            </li>
            <li>
              <a href="#" class="nav-link" data-view="how-to-export" id="nav-how-to-export">
                ${locale.nav.howToExport}
              </a>
            </li>
            <li>
              <a href="#" class="nav-link" data-view="privacy" id="nav-privacy">
                ${locale.nav.privacy}
              </a>
            </li>
            <li>
              <a href="#" class="nav-link" data-view="saved" id="nav-saved">
                ${locale.nav.savedResults}
              </a>
            </li>
          </ul>

          <div class="nav-controls">
            <!-- Theme Toggle -->
            <button class="theme-toggle" id="theme-toggle" type="button" aria-label="${currentTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}" title="${currentTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}">
              ${renderThemeIcon(currentTheme)}
            </button>

            <!-- Language Picker -->
            <div class="locale-picker" id="locale-picker">
              <button class="locale-trigger" type="button" id="locale-trigger" aria-haspopup="listbox" aria-expanded="false" aria-label="Select language">
                <svg class="locale-globe-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                <span class="locale-current-name">${localeName(currentLocale())}</span>
                <svg class="locale-chevron-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              <div class="locale-dropdown" role="listbox" id="locale-dropdown">
                ${SUPPORTED_LOCALES.map((code) => `
                  <button class="locale-option ${code === currentLocale() ? 'locale-option--active' : ''}" type="button" role="option" data-locale="${code}" aria-selected="${code === currentLocale()}">
                    <span>${localeName(code)}</span>
                    ${code === currentLocale() ? `
                      <svg class="locale-check-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ` : ''}
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Hamburger Button for Mobile -->
            <button class="nav-hamburger" id="nav-hamburger" type="button" aria-label="Toggle mobile menu" aria-expanded="false" aria-controls="mobile-nav-drawer">
              <span class="hamburger-bar"></span>
              <span class="hamburger-bar"></span>
              <span class="hamburger-bar"></span>
            </button>
          </div>
        </nav>
      </div>

      <!-- Mobile Navigation Drawer -->
      <div class="mobile-nav-drawer" id="mobile-nav-drawer" inert>
        <div class="mobile-nav-backdrop" id="mobile-nav-backdrop"></div>
        <div class="mobile-nav-content" role="dialog" aria-modal="true" aria-label="Mobile navigation">
          <div class="mobile-nav-header">
            <span class="nav-logo-text"><span class="logo-chat">chat</span><span class="logo-almanac">almanac</span></span>
            <button class="mobile-nav-close" id="mobile-nav-close" type="button" aria-label="Close navigation menu">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="mobile-nav-body">
            <div class="mobile-nav-section-title">${locale.nav.tools}</div>
            <div class="mobile-nav-tools-list">
              <a href="#" class="mobile-nav-tool-item" data-tool="activity">
                <span class="mobile-nav-tool-icon">⏱️</span>
                <div>
                  <div class="font-medium">${locale.toolsPage.inactivity.title}</div>
                  <div class="text-xs text-muted">${locale.toolsPage.inactivity.badge}</div>
                </div>
              </a>
              <a href="#" class="mobile-nav-tool-item" data-tool="words">
                <span class="mobile-nav-tool-icon">📊</span>
                <div>
                  <div class="font-medium">${locale.toolsPage.counter.title}</div>
                  <div class="text-xs text-muted">${locale.toolsPage.counter.badge}</div>
                </div>
              </a>
              <a href="#" class="mobile-nav-tool-item" data-tool="timeline">
                <span class="mobile-nav-tool-icon">📅</span>
                <div>
                  <div class="font-medium">${locale.toolsPage.heatmap.title}</div>
                  <div class="text-xs text-muted">${locale.toolsPage.heatmap.badge}</div>
                </div>
              </a>
              <a href="#" class="mobile-nav-tool-item" data-tool="compare">
                <span class="mobile-nav-tool-icon">👥</span>
                <div>
                  <div class="font-medium">${locale.toolsPage.compare.title}</div>
                  <div class="text-xs text-muted">${locale.toolsPage.compare.badge}</div>
                </div>
              </a>
              <a href="#" class="mobile-nav-tool-item" data-tool="evidence">
                <span class="mobile-nav-tool-icon">📑</span>
                <div>
                  <div class="font-medium">${locale.toolsPage.evidence.title}</div>
                  <div class="text-xs text-muted">${locale.toolsPage.evidence.badge}</div>
                </div>
              </a>
            </div>

            <div class="mobile-nav-divider"></div>

            <div class="mobile-nav-section-title">Pages</div>
            <div class="mobile-nav-links-list">
              <a href="#" class="mobile-nav-link" data-view="tools">🛠️ ${locale.nav.tools} (Overview)</a>
              <a href="#" class="mobile-nav-link" data-view="how-to-export">📥 ${locale.nav.howToExport}</a>
              <a href="#" class="mobile-nav-link" data-view="privacy">🔒 ${locale.nav.privacy}</a>
              <a href="#" class="mobile-nav-link" data-view="saved">💾 ${locale.nav.savedResults}</a>
            </div>
          </div>
        </div>
      </div>
    `;

    // Inject logo (SVG element)
    const logoLink = header.querySelector('#nav-logo-link') as HTMLAnchorElement;
    logoLink.appendChild(renderLogo(32));
    const wordmark = document.createElement('span');
    wordmark.className = 'nav-logo-text';
    wordmark.innerHTML = '<span class="logo-chat">chat</span><span class="logo-almanac">almanac</span>';
    logoLink.appendChild(wordmark);

    const dropdownItem = header.querySelector<HTMLElement>('.nav-item--dropdown');
    const toolsTrigger = header.querySelector<HTMLAnchorElement>('#nav-tools');
    let leaveTimer: number | null = null;

    const closeDropdown = (): void => {
      if (leaveTimer) {
        clearTimeout(leaveTimer);
        leaveTimer = null;
      }
      dropdownItem?.classList.remove('is-open');
      dropdownItem?.classList.add('nav-item--closed');
      toolsTrigger?.setAttribute('aria-expanded', 'false');
    };

    const openDropdown = (): void => {
      if (leaveTimer) {
        clearTimeout(leaveTimer);
        leaveTimer = null;
      }
      dropdownItem?.classList.remove('nav-item--closed');
      dropdownItem?.classList.add('is-open');
      toolsTrigger?.setAttribute('aria-expanded', 'true');
    };

    if (dropdownItem && toolsTrigger) {
      // Hover behavior: enter opens immediately
      dropdownItem.addEventListener('mouseenter', () => {
        openDropdown();
      });

      // Hover behavior: leave waits 220ms so cursor can safely travel without sudden disappearance
      dropdownItem.addEventListener('mouseleave', () => {
        leaveTimer = window.setTimeout(() => {
          dropdownItem.classList.remove('is-open');
          toolsTrigger.setAttribute('aria-expanded', 'false');
        }, 220);
      });

      // Click behavior: user can click "Tools" to lock open/toggle the dropdown menu
      toolsTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (dropdownItem.classList.contains('is-open')) {
          closeDropdown();
        } else {
          openDropdown();
        }
      });

      dropdownItem.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeDropdown();
          toolsTrigger.focus();
        }
      });
    }

    // Mobile nav drawer control
    const hamburgerBtn = header.querySelector<HTMLButtonElement>('#nav-hamburger');
    const mobileDrawer = header.querySelector<HTMLElement>('#mobile-nav-drawer');
    const mobileClose = header.querySelector<HTMLButtonElement>('#mobile-nav-close');
    const mobileBackdrop = header.querySelector<HTMLElement>('#mobile-nav-backdrop');

    const openMobileNav = (): void => {
      if (mobileDrawer) {
        mobileDrawer.classList.add('is-open');
        mobileDrawer.removeAttribute('inert');
        hamburgerBtn?.setAttribute('aria-expanded', 'true');
        hamburgerBtn?.classList.add('is-active');
        document.body.style.overflow = 'hidden';
        // Move focus into the drawer for keyboard/AT users
        (mobileDrawer.querySelector<HTMLElement>('#mobile-nav-close'))?.focus();
      }
    };

    const closeMobileNav = (): void => {
      if (mobileDrawer) {
        mobileDrawer.classList.remove('is-open');
        mobileDrawer.setAttribute('inert', '');
        hamburgerBtn?.setAttribute('aria-expanded', 'false');
        hamburgerBtn?.classList.remove('is-active');
        document.body.style.overflow = '';
        // Return focus to the hamburger button
        hamburgerBtn?.focus();
      }
    };

    hamburgerBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = mobileDrawer?.classList.contains('is-open');
      if (isOpen) closeMobileNav();
      else openMobileNav();
    });

    mobileClose?.addEventListener('click', closeMobileNav);
    mobileBackdrop?.addEventListener('click', closeMobileNav);

    // Logo click → home
    logoLink.addEventListener('click', (e) => {
      e.preventDefault();
      closeDropdown();
      closeMobileNav();
      resetToLanding();
    });

    // Nav link clicks (pages)
    header.querySelectorAll<HTMLAnchorElement>('[data-view]').forEach((link) => {
      // Don't override nav-tools trigger click
      if (link.id === 'nav-tools') return;
      link.addEventListener('click', (e) => {
        e.preventDefault();
        closeDropdown();
        closeMobileNav();
        const view = link.dataset['view'];
        if (view === 'tools') navigateTo('tools');
        else if (view === 'how-to-export') navigateTo('how-to-export');
        else if (view === 'privacy') navigateTo('privacy');
        else if (view === 'saved') navigateTo('saved');
      });
    });

    // Tool item clicks (desktop dropdown & mobile drawer)
    header.querySelectorAll<HTMLAnchorElement>('[data-tool]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        closeDropdown();
        closeMobileNav();
        const tool = link.dataset['tool'];
        if (tool === 'activity') {
          navigateToResultTab('activity');
        } else if (tool === 'words') {
          navigateToResultTab('words');
        } else if (tool === 'timeline') {
          navigateToResultTab('timeline');
        } else if (tool === 'compare') {
          navigateToResultTab('compare');
        } else if (tool === 'evidence') {
          navigateToResultTab('overview', { scrollTo: '#export-panel' });
        } else {
          navigateToResultTab('overview');
        }
      });
    });

    // Theme toggle click
    const themeBtn = header.querySelector<HTMLButtonElement>('#theme-toggle');
    themeBtn?.addEventListener('click', () => {
      toggleTheme();
    });

    // Locale dropdown picker
    const localePicker = header.querySelector<HTMLElement>('#locale-picker');
    const localeTrigger = header.querySelector<HTMLButtonElement>('#locale-trigger');
    localeTrigger?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeDropdown();
      const isOpen = localePicker?.classList.contains('is-open');
      if (isOpen) {
        localePicker?.classList.remove('is-open');
        localeTrigger.setAttribute('aria-expanded', 'false');
      } else {
        localePicker?.classList.add('is-open');
        localeTrigger.setAttribute('aria-expanded', 'true');
      }
    });

    header.querySelectorAll<HTMLButtonElement>('.locale-option[data-locale]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        localePicker?.classList.remove('is-open');
        localeTrigger?.setAttribute('aria-expanded', 'false');
        const code = btn.dataset['locale'] as LocaleCode;
        if (code && code !== currentLocale()) {
          await setLocale(code);
        }
      });
    });

    updateActiveLink();
  }

  build();

  // Rebuild on locale change
  document.addEventListener('localechange', () => build());

  // Update theme button on theme change
  document.addEventListener('themechange', () => {
    const themeBtn = header.querySelector<HTMLButtonElement>('#theme-toggle');
    if (themeBtn) {
      const theme = getTheme();
      const isDark = theme === 'dark';
      themeBtn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
      themeBtn.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
      themeBtn.innerHTML = renderThemeIcon(theme);
    }
  });

  // Update active highlighting on state change
  subscribe(() => updateActiveLink());

  // Close dropdowns on click outside
  document.addEventListener('click', (e) => {
    const target = e.target as Node;
    const dropdown = header.querySelector<HTMLElement>('.nav-item--dropdown');
    if (dropdown && !dropdown.contains(target)) {
      dropdown.classList.remove('is-open');
      dropdown.classList.add('nav-item--closed');
      header.querySelector('#nav-tools')?.setAttribute('aria-expanded', 'false');
    }
    const localePicker = header.querySelector<HTMLElement>('#locale-picker');
    if (localePicker && !localePicker.contains(target)) {
      localePicker.classList.remove('is-open');
      header.querySelector('#locale-trigger')?.setAttribute('aria-expanded', 'false');
    }
  });

  return header;
}

function localeName(code: LocaleCode): string {
  const names: Record<LocaleCode, string> = {
    en: 'English',
    ur: 'اردو',
    ar: 'العربية',
    fr: 'Français',
  };
  return names[code];
}

function renderThemeIcon(theme: 'dark' | 'light'): string {
  if (theme === 'dark') {
    return `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
    `;
  }
  return `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  `;
}
