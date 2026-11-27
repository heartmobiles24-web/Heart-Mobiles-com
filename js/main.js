/**
 * main.js - entry point loaded by every page.
 *
 * Every module checks for its own mount element, so the same script can be
 * included on every page without side effects.
 */

import { getSite } from './config.js';
import { applySiteFields, applyYear, refreshIcons } from './utils.js';
import { initNavigation } from './navigation.js';
import { initAnimations, observeReveal } from './animations.js';
import { initWhatsApp } from './whatsapp.js';
import { initSeo } from './seo.js';
import { initOffers } from './offers.js';
import { initBrands } from './brands.js';
import { initProducts } from './products.js';
import { initAccessories } from './accessories.js';
import { initServices } from './services.js';
import { initTestimonials } from './testimonials.js';
import { initTeam } from './team.js';
import { initGallery } from './gallery.js';
import { initFaq } from './faq.js';
import { initContact } from './contact.js';

/** First-visit preloader: shown once per browsing session. */
function runPreloader() {
  const el = document.getElementById('preloader');
  if (!el) return;

  if (document.documentElement.classList.contains('hm-returning')) {
    el.hidden = true;
    return;
  }

  const startedAt = performance.now();
  const minimumVisible = 700;
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    el.dataset.done = 'true';
    window.setTimeout(() => {
      el.hidden = true;
    }, 520);
  };

  const afterLoad = () => {
    const elapsed = performance.now() - startedAt;
    window.setTimeout(finish, Math.max(0, minimumVisible - elapsed));
  };

  if (document.readyState === 'complete') afterLoad();
  else window.addEventListener('load', afterLoad, { once: true });

  // Safety net so the page can never stay covered.
  window.setTimeout(finish, 2800);
}

async function boot() {
  runPreloader();
  applyYear();
  initNavigation();
  initAnimations();

  const site = await getSite();
  applySiteFields(site);
  refreshIcons();

  initWhatsApp();
  initSeo();

  await Promise.allSettled([
    initOffers(),
    initBrands(),
    initProducts(),
    initAccessories(),
    initServices(),
    initTestimonials(),
    initTeam(),
    initGallery(),
    initFaq(),
    initContact()
  ]);

  refreshIcons();
  observeReveal();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
