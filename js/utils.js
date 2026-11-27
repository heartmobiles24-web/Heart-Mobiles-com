/**
 * utils.js - small shared helpers used across the site.
 * No dependencies. Safe to import from any module.
 */

const jsonCache = new Map();

/**
 * Fetch and cache a JSON file. Throws a readable error on failure.
 * @param {string} path
 * @returns {Promise<any>}
 */
export async function fetchJSON(path) {
  if (jsonCache.has(path)) return jsonCache.get(path);

  const request = (async () => {
    const response = await fetch(path, { cache: 'no-cache' });
    if (!response.ok) {
      throw new Error(`Could not load ${path} (HTTP ${response.status})`);
    }
    return response.json();
  })();

  jsonCache.set(path, request);

  try {
    return await request;
  } catch (error) {
    jsonCache.delete(path);
    throw error;
  }
}

/** Escape a value for safe insertion into HTML. */
export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Escape a value for use inside an HTML attribute. */
export function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

/** Only allow http(s), mailto, tel and relative URLs. */
export function safeUrl(value) {
  const url = String(value || '').trim();
  if (!url) return '';
  if (/^(https?:|mailto:|tel:)/i.test(url)) return url;
  if (/^[a-z0-9._\-/?#=&%]+$/i.test(url)) return url; // relative path
  return '';
}

/** Format a number as Indian Rupees, e.g. 19999 -> "₹19,999". */
export function formatPrice(amount, symbol = '₹') {
  const value = Number(amount);
  if (!Number.isFinite(value)) return '';
  return `${symbol}${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

export function debounce(fn, wait = 200) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

export function isReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Read a query string parameter from the current URL. */
export function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/** Remove duplicates from an array, preserving order. */
export function unique(values) {
  return Array.from(new Set(values));
}

/** Show a friendly error state inside a container. */
export function renderError(container, message) {
  if (!container) return;
  container.innerHTML = `
    <div class="card col-span-full px-5 py-8 text-center">
      <p class="text-sm font-semibold text-brand-900">Content could not be loaded</p>
      <p class="mt-1 text-sm text-muted">${escapeHtml(message || 'Please refresh the page and try again.')}</p>
    </div>`;
}

/** Re-run Lucide icon replacement when available (loaded from CDN). */
export function refreshIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    try {
      window.lucide.createIcons();
    } catch (error) {
      /* icons are decorative - ignore failures */
    }
  }
}

/** Replace every [data-site-field] element with the matching value from site.json. */
export function applySiteFields(site) {
  const developer = site.developer || {};
  const map = {
    name: site.name,
    tagline: site.tagline,
    proprietor: site.proprietor,
    manager: site.manager,
    'phone-display': site.phoneDisplay,
    address: site.address && site.address.full,
    'experience-years': String(site.experienceYears ?? ''),
    hours: (site.hours || []).map((slot) => `${slot.days}: ${slot.time}`).join(' | '),
    'hours-note': site.hoursNote || '',
    'established-note': site.establishedNote || '',
    'map-embed': site.mapsEmbedUrl || '',
    'maps-url': site.mapsUrl || '',
    'review-url': site.reviewUrl || '',
    'social-facebook': site.social && site.social.facebook || '',
    'social-instagram': site.social && site.social.instagram || '',
    'social-youtube': site.social && site.social.youtube || '',
    'developer-brand': developer.brand || '',
    'developer-tagline': developer.tagline || '',
    'developer-headline': developer.headline || '',
    'developer-message': developer.message || '',
    'developer-website': developer.website || '',
    'developer-phone-link': developer.phone ? `tel:${developer.phone}` : ''
  };

  qsa('[data-site-field]').forEach((el) => {
    const value = map[el.dataset.siteField];
    if (typeof value !== 'string' || !value) return;
    if (el.tagName === 'IFRAME') el.setAttribute('src', value);
    else if (el.tagName === 'A') el.setAttribute('href', value);
    else el.textContent = value;
  });
}

/** Set the current year in every [data-year] element. */
export function applyYear() {
  const year = String(new Date().getFullYear());
  qsa('[data-year]').forEach((el) => {
    el.textContent = year;
  });
}

/** Build initials from a full name, e.g. "S. Abdul Waheed" -> "SA". */
export function initials(name) {
  return String(name || '')
    .replace(/[^\p{L}\s.]/gu, '')
    .split(/\s+/)
    .filter((part) => part && !part.endsWith('.'))
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

/** Availability -> label + badge classes. */
export function availabilityMeta(value) {
  const map = {
    'in-stock': { label: 'In stock', classes: 'bg-emerald-50 text-emerald-700' },
    limited: { label: 'Limited stock', classes: 'bg-amber-50 text-amber-700' },
    'on-order': { label: 'On request', classes: 'bg-brand-100 text-brand-700' },
    'out-of-stock': { label: 'Currently unavailable', classes: 'bg-coolgrey text-muted' }
  };
  return map[value] || map['in-stock'];
}

/** True when an item is active and not past its expiry date. */
export function isLive(item) {
  if (!item || item.active === false) return false;
  if (item.expiresOn) {
    const expiry = new Date(`${item.expiresOn}T23:59:59`);
    if (!Number.isNaN(expiry.getTime()) && expiry.getTime() < Date.now()) return false;
  }
  return true;
}
