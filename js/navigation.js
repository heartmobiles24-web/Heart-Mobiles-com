/**
 * navigation.js - sticky header behaviour, mobile menu and active link state.
 */

import { qs, qsa } from './utils.js';

export function initNavigation() {
  markActiveLink();
  stickyHeader();
  mobileMenu();
}

/** Highlight the navigation item for the page currently open. */
function markActiveLink() {
  const current = window.location.pathname.split('/').pop() || 'index.html';

  qsa('[data-nav] a[href]').forEach((link) => {
    const href = link.getAttribute('href');
    if (href.includes('#')) return; // in-page links never mark a page
    const target = href.split('/').pop();
    if (!target) return;
    if (target === current) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

/** Add a subtle shadow to the header once the page is scrolled. */
function stickyHeader() {
  const header = qs('#site-header');
  if (!header) return;

  const update = () => header.classList.toggle('shadow-nav', window.scrollY > 8);
  update();
  window.addEventListener('scroll', update, { passive: true });
}

/** Accessible hamburger menu for small screens. */
function mobileMenu() {
  const toggle = qs('#nav-toggle');
  const menu = qs('#mobile-menu');
  const header = qs('#site-header');
  if (!toggle || !menu) return;

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    menu.classList.toggle('hidden', !open);
    document.body.classList.toggle('overflow-hidden', open);
    const label = toggle.querySelector('[data-menu-label]');
    if (label) label.textContent = open ? 'Close menu' : 'Open menu';
    const icon = toggle.querySelector('[data-menu-icon]');
    if (icon) icon.setAttribute('data-lucide', open ? 'x' : 'menu');
    if (window.lucide) window.lucide.createIcons();
  };

  setOpen(false);

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  // Close after choosing a destination.
  qsa('a', menu).forEach((link) => link.addEventListener('click', () => setOpen(false)));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024 && toggle.getAttribute('aria-expanded') === 'true') setOpen(false);
  });

  if (header) header.classList.add('is-ready');
}
