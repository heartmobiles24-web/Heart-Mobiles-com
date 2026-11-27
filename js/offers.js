/**
 * offers.js - flash news ticker and the offers / new arrivals grid.
 * Content comes from data/offers.json. Expired or inactive items are skipped.
 */

import { fetchJSON, isLive, escapeHtml, escapeAttr, safeUrl, renderError, refreshIcons } from './utils.js';
import { buildMarquee } from './marquee.js';
import { observeReveal } from './animations.js';

function flashTemplate(item) {
  const label = escapeHtml(item.text);
  const link = safeUrl(item.link);
  const icon = `<i data-lucide="sparkles" class="h-3.5 w-3.5 shrink-0 text-brand-300" aria-hidden="true"></i>`;
  const dot = `<span class="ml-6 h-1 w-1 shrink-0 rounded-full bg-white/30" aria-hidden="true"></span>`;

  if (link) {
    return `<a class="inline-flex shrink-0 items-center gap-2.5 text-[13px] font-semibold text-white/90 no-underline transition hover:text-white" href="${escapeAttr(link)}">
      ${icon}<span>${label}</span>${dot}
    </a>`;
  }

  return `<span class="inline-flex shrink-0 items-center gap-2.5 text-[13px] font-semibold text-white/90">
    ${icon}<span>${label}</span>${dot}
  </span>`;
}

function offerTemplate(item, index) {
  const badge = escapeHtml(item.badge || (item.type === 'new-arrival' ? 'New arrival' : 'Offer'));
  const title = escapeHtml(item.title);
  const description = escapeHtml(item.description);
  const image = safeUrl(item.image);
  const cta = item.cta || {};
  const ctaLabel = escapeHtml(cta.label || 'Know more');

  let ctaHtml = '';
  if (cta.type === 'whatsapp') {
    ctaHtml = `<a class="btn btn-wa btn-sm" data-whatsapp="${escapeAttr(cta.message || '')}" href="#">${ctaLabel}</a>`;
  } else {
    const href = safeUrl(cta.href) || 'products.html';
    ctaHtml = `<a class="btn btn-outline btn-sm" href="${escapeAttr(href)}">${ctaLabel}</a>`;
  }

  return `<article class="card card-hover flex flex-col overflow-hidden" data-reveal data-reveal-delay="${index * 60}">
    <div class="aspect-16/9 w-full overflow-hidden bg-brand-50">
      ${
        image
          ? `<img src="${escapeAttr(image)}" alt="${title}" loading="lazy" decoding="async" width="800" height="450" class="h-full w-full object-cover">`
          : ''
      }
    </div>
    <div class="flex flex-1 flex-col gap-3 p-5">
      <span class="pill w-fit bg-brand-100 text-brand-700">${badge}</span>
      <h3 class="text-lg leading-snug font-bold">${title}</h3>
      <p class="text-[14px] leading-relaxed text-muted">${description}</p>
      <div class="mt-auto pt-2">${ctaHtml}</div>
    </div>
  </article>`;
}

export async function initOffers() {
  const flashTrack = document.getElementById('flash-track');
  const offersGrid = document.getElementById('offers-grid');
  if (!flashTrack && !offersGrid) return;

  let data;
  try {
    data = await fetchJSON('data/offers.json');
  } catch (error) {
    renderError(offersGrid || flashTrack, error.message);
    return;
  }

  const flash = (data.flash || []).filter(isLive);
  const offers = (data.offers || []).filter(isLive);

  if (flashTrack)
    buildMarquee(flashTrack, flash, flashTemplate, {
      minItems: 6,
      pxPerSecond: 60,
      secondsPerItem: 6,
      minSeconds: 40,
      easing: 'linear',
      sequenceClass: 'ticker-seq'
    });

  if (offersGrid) {
    const limit = Number(offersGrid.dataset.limit || offers.length);
    const list = offers.slice(0, limit);
    offersGrid.innerHTML = list.length ? list.map(offerTemplate).join('') : '<p class="col-span-full text-center text-sm text-muted">No offers are running at the moment. Please check back soon.</p>';
    observeReveal(offersGrid);
  }

  refreshIcons();
  document.dispatchEvent(new CustomEvent('hm:whatsapp-links'));
}
