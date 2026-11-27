/**
 * brands.js - brand marquee and the featured brands grid.
 * Content comes from data/brands.json. Only active brands are rendered.
 */

import { fetchJSON, escapeHtml, escapeAttr, safeUrl, refreshIcons } from './utils.js';
import { buildMarquee } from './marquee.js';
import { observeReveal } from './animations.js';

/** Built-in list, used only if data/brands.json cannot be loaded, so the
 *  infinite logo marquee never disappears from the showroom section. */
const FALLBACK_BRANDS = [
  { id: 'samsung', name: 'Samsung' },
  { id: 'apple', name: 'Apple' },
  { id: 'redmi', name: 'Redmi' },
  { id: 'realme', name: 'realme' },
  { id: 'vivo', name: 'vivo' },
  { id: 'oppo', name: 'OPPO' },
  { id: 'oneplus', name: 'OnePlus' },
  { id: 'poco', name: 'POCO' }
];

function logoOrWordmark(brand, size) {
  const logo = safeUrl(brand.logo);
  const name = escapeHtml(brand.name);

  if (logo) {
    return `<img src="${escapeAttr(logo)}" alt="${name} logo" loading="lazy" decoding="async" width="${size.width}" height="${size.height}" class="max-h-8 w-auto object-contain">`;
  }

  return `<span class="font-display text-[17px] font-extrabold tracking-tight text-brand-800">${name}</span>`;
}

/** A single logo cell for the infinite logo marquee. */
function marqueeLogo(brand) {
  const logo = safeUrl(brand.logo);
  const name = escapeHtml(brand.name);

  if (logo) {
    return `<img src="${escapeAttr(logo)}" alt="${name} logo" loading="lazy" decoding="async" width="140" height="36" class="max-h-9 w-auto object-contain">`;
  }

  return `<span class="logo-wordmark">${name}</span>`;
}

function marqueeSkeleton(count = 8) {
  return `<div class="marquee-seq" aria-hidden="true">${Array.from({ length: count })
    .map(() => '<span class="brand-skeleton-chip"></span>')
    .join('')}</div>`;
}

export async function initBrands() {
  const marqueeTrack = document.getElementById('brand-marquee-track');
  const grid = document.getElementById('brand-grid');
  if (!marqueeTrack && !grid) return;

  const marquee = marqueeTrack ? marqueeTrack.closest('.marquee') : null;

  // Show a shimmering "loading" placeholder until the brand list arrives.
  if (marqueeTrack) {
    marqueeTrack.classList.add('is-loading');
    marqueeTrack.innerHTML = marqueeSkeleton();
  }

  let brands = FALLBACK_BRANDS;
  try {
    const data = await fetchJSON('data/brands.json');
    const list = (data.brands || []).filter((brand) => brand.active !== false && brand.name);
    if (list.length) brands = list;
  } catch (error) {
    // Keep the built-in list so the infinite logo marquee still renders.
  }

  if (marqueeTrack) {
    buildMarquee(
      marqueeTrack,
      brands,
      (brand) => `<div class="logo-item" title="${escapeAttr(brand.name)}">${marqueeLogo(brand)}</div>`,
      { minItems: 12, pxPerSecond: 60, secondsPerItem: 3.6, minSeconds: 34 }
    );

    // Swap the shimmer for the real chips and fade the strip in.
    marqueeTrack.classList.remove('is-loading');
    if (marquee) marquee.classList.add('is-ready');
  }

  if (grid) {
    grid.innerHTML = brands.length
      ? brands
          .map(
            (brand, index) => `<article class="card card-hover flex flex-col items-start gap-3 p-5" data-reveal data-reveal-delay="${index * 40}" id="brand-${escapeAttr(brand.id || '')}">
              <div class="flex h-12 items-center">${logoOrWordmark(brand, { width: 120, height: 32 })}</div>
              <h3 class="text-[17px] font-bold">${escapeHtml(brand.name)}</h3>
              ${brand.description ? `<p class="text-[13px] leading-relaxed text-muted">${escapeHtml(brand.description)}</p>` : ''}
              <a class="btn btn-ghost btn-sm mt-auto px-0" data-whatsapp="I would like to know about ${escapeAttr(brand.name)} mobiles available at Heart Mobiles." href="#">Check availability</a>
            </article>`
          )
          .join('')
      : '<p class="col-span-full text-center text-sm text-muted">Brand information will be updated shortly.</p>';

    observeReveal(grid);
  }

  refreshIcons();
  document.dispatchEvent(new CustomEvent('hm:whatsapp-links'));
}
