/**
 * src/ui/components/footer.ts
 *
 * Full-width site footer with:
 * - Call-to-action banner ("Ready to inspect your own conversations?")
 * - Brand column: logo, description, contact email, "Made by Tayyab", social profiles (GitHub, LinkedIn)
 * - Tools column: links to specialized analysis tools
 * - Guides column: how to export, privacy verification, saved analyses
 * - Bottom bar: non-affiliation disclaimer, privacy policy, and copyright "© 2026 Chatalmanac"
 */

import { t } from '../../locales/index.ts';
import { navigateTo, resetToLanding, loadSampleChat, getState } from '../app.ts';
import { renderLogo } from './logo.ts';

export function renderFooter(): HTMLElement {
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.setAttribute('role', 'contentinfo');

  function build(): void {
    const locale = t();
    const isRtl = locale.dir === 'rtl';

    // Normalize any question mark in contactPrompt for RTL
    const contactPrompt = isRtl
      ? locale.footer.contactPrompt.replace(/\?/g, '؟')
      : locale.footer.contactPrompt;

    footer.innerHTML = `
      <!-- ── CTA Banner ── -->
      <div class="footer__cta-wrap">
        <div class="container">
          <div class="footer__cta card">
            <div class="footer__cta-copy">
              <h2 class="footer__cta-title">${locale.footer.ctaHeading}</h2>
              <p class="footer__cta-subtitle text-muted text-sm">${locale.footer.ctaSubheading}</p>
            </div>
            <div class="footer__cta-actions">
              <button class="btn btn--primary btn--md" id="footer-cta-analyze" type="button">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M2 8a6 6 0 1 1 12 0A6 6 0 0 1 2 8z" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M8 5v6M5 8h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                ${locale.footer.ctaButton}
              </button>
              <button class="btn btn--secondary btn--md" id="footer-cta-sample" type="button">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <polygon points="5,3 13,8 5,13" fill="currentColor"/>
                </svg>
                ${locale.footer.ctaSampleButton}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Dark Bottom Lines (Footer Columns & Bottom Bar) ── -->
      <div class="footer__dark-bottom">
        <div class="container">
          <div class="footer__grid">
            <!-- Column 1: Brand & Creator -->
            <div class="footer__col footer__col--brand">
              <div class="footer__brand-header" id="footer-logo-mount">
              <span class="nav-logo-text footer__logo-text">
                <span class="logo-chat">chat</span><span class="logo-almanac">almanac</span>
              </span>
            </div>
            <p class="footer__tagline text-muted text-sm">
              ${locale.lang === 'ur'
                ? 'واٹس ایپ گفتگو کے نمونوں اور ٹائم لائنز کا نجی اور محفوظ براؤزر پر مبنی تجزیہ۔'
                : locale.lang === 'ar'
                ? 'تحليل خاص وآمن داخل المتصفح لأنماط المحادثات والجداول الزمنية.'
                : locale.lang === 'fr'
                ? 'Analyse comportementale et chronologique de discussions, 100% dans votre navigateur.'
                : 'Private, browser-based chat analytics and conversation timeline forensics.'}
            </p>

            <div class="footer__contact-box">
              <div class="footer__contact-prompt">${contactPrompt}</div>
              <div class="footer__contact-email-row">
                <a href="mailto:${locale.footer.contactEmail}" class="footer__contact-email" dir="ltr">${locale.footer.contactEmail}</a>
              </div>

              <div class="footer__credit-row">
                <span class="footer__credit">
                  ${locale.footer.madeWith}
                  <svg class="footer__heart-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  ${locale.footer.by ? locale.footer.by + ' ' : ''}<a href="https://mtayyab-10.vercel.app" class="footer__author-link" target="_blank" rel="noopener noreferrer">${locale.footer.author}</a>
                </span>
              </div>

              <div class="footer__socials-row">
                <div class="footer__socials" aria-label="Creator profiles">
                  <a href="https://github.com/mtayyab-10"
                     class="footer__social-link"
                     target="_blank"
                     rel="noopener noreferrer"
                     aria-label="Tayyab's GitHub"
                     title="GitHub">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                    </svg>
                  </a>
                  <a href="https://www.linkedin.com/in/muhammad-tayyab10/"
                     class="footer__social-link"
                     target="_blank"
                     rel="noopener noreferrer"
                     aria-label="Tayyab's LinkedIn"
                     title="LinkedIn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- Column 2: Tools -->
          <div class="footer__col">
            <h3 class="footer__heading">${locale.footer.toolsTitle}</h3>
            <ul class="footer__nav-list" role="list">
              <li><a href="#" class="footer__link" data-tool="activity">${locale.footer.tools.inactivity}</a></li>
              <li><a href="#" class="footer__link" data-tool="words">${locale.footer.tools.counter}</a></li>
              <li><a href="#" class="footer__link" data-tool="activity">${locale.footer.tools.heatmap}</a></li>
              <li><a href="#" class="footer__link" data-tool="compare">${locale.footer.tools.compare}</a></li>
              <li><a href="#" class="footer__link" data-tool="evidence">${locale.footer.tools.evidence}</a></li>
            </ul>
          </div>

          <!-- Column 3: Guides & Privacy -->
          <div class="footer__col">
            <h3 class="footer__heading">${locale.footer.guidesTitle}</h3>
            <ul class="footer__nav-list" role="list">
              <li><a href="#" class="footer__link" data-view="how-to-export">${locale.footer.guides.exportGuide}</a></li>
              <li><a href="#" class="footer__link" data-view="how-to-export">${locale.footer.guides.withoutMedia}</a></li>
              <li><a href="#" class="footer__link" data-view="privacy">${locale.footer.guides.privacyVerify}</a></li>
              <li><a href="#" class="footer__link" data-view="saved">${locale.footer.guides.savedData}</a></li>
            </ul>
          </div>
        </div>

        <hr class="footer__divider" aria-hidden="true" />

        <!-- ── Bottom Bar ── -->
        <div class="footer__bottom-row">
          <p class="footer__notice text-subtle text-xs">${locale.footer.nonAffiliation}</p>
          <div class="footer__meta-links">
            <a href="#" class="footer__link" data-view="privacy">${locale.footer.privacyPolicy}</a>
            <span class="footer__sep" aria-hidden="true">·</span>
            <span class="footer__copyright text-subtle text-xs">${locale.footer.copyright}</span>
        </div>
      </div>
    </div>
    `;

    // Inject logo SVG into brand column
    const logoMount = footer.querySelector('#footer-logo-mount');
    if (logoMount) {
      const svg = renderLogo(28);
      logoMount.prepend(svg);
    }

    // CTA button handlers
    const analyzeBtn = footer.querySelector('#footer-cta-analyze');
    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', () => {
        resetToLanding();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    const sampleBtn = footer.querySelector('#footer-cta-sample');
    if (sampleBtn) {
      sampleBtn.addEventListener('click', () => {
        loadSampleChat();
      });
    }

    // View links
    footer.querySelectorAll<HTMLAnchorElement>('[data-view]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const view = link.dataset['view'];
        if (view === 'how-to-export') navigateTo('how-to-export');
        else if (view === 'privacy') navigateTo('privacy');
        else if (view === 'saved') navigateTo('saved');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    // Tool links
    footer.querySelectorAll<HTMLAnchorElement>('[data-tool]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const state = getState();
        if (state.stats) {
          navigateTo('results');
        } else {
          navigateTo('tools');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  build();
  return footer;
}
