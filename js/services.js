/**
 * services.js - the six business offerings, rendered from data/services.json
 * into every [data-services-grid] element on the page.
 */

import { fetchJSON, escapeHtml, escapeAttr, isLive, renderError, refreshIcons } from './utils.js';
import { observeReveal } from './animations.js';

function serviceTemplate(service, index) {
  const accent = service.accent === 'ink' ? 'bg-coolgrey text-brand-900' : 'bg-brand-50 text-brand-700';
  const cta = service.cta || {};

  const ctaHtml =
    cta.type === 'whatsapp'
      ? `<a class="btn btn-wa btn-sm" data-whatsapp="${escapeAttr(cta.message || '')}" href="#">${escapeHtml(cta.label || 'Enquire now')}</a>`
      : `<a class="btn btn-outline btn-sm" href="${escapeAttr(cta.href || 'contact.html')}">${escapeHtml(cta.label || 'Know more')}</a>`;

  return `<article id="${escapeAttr(service.id)}" class="card card-hover flex flex-col gap-4 p-6 sm:p-7" data-reveal data-reveal-delay="${index * 60}">
    <span class="flex h-12 w-12 items-center justify-center rounded-xl ${accent}">
      <i data-lucide="${escapeAttr(service.icon || 'circle-dot')}" class="h-6 w-6" aria-hidden="true"></i>
    </span>

    <div class="flex flex-col gap-2">
      <h3 class="font-display text-xl leading-snug font-bold">${escapeHtml(service.title)}</h3>
      <p class="text-[14px] leading-relaxed text-muted">${escapeHtml(service.summary)}</p>
    </div>

    ${
      (service.points || []).length
        ? `<ul class="space-y-2">${service.points
            .map(
              (point) => `<li class="flex gap-2.5 text-[13.5px] leading-relaxed text-ink">
                <i data-lucide="check" class="mt-0.5 h-4 w-4 shrink-0 text-brand-500" aria-hidden="true"></i>
                <span>${escapeHtml(point)}</span>
              </li>`
            )
            .join('')}</ul>`
        : ''
    }

    ${service.note ? `<p class="rounded-xl bg-offwhite px-3.5 py-3 text-[12px] leading-relaxed text-muted">${escapeHtml(service.note)}</p>` : ''}

    <div class="mt-auto pt-1">${ctaHtml}</div>
  </article>`;
}

export async function initServices() {
  const grids = document.querySelectorAll('[data-services-grid]');
  if (!grids.length) return;

  let data;
  try {
    data = await fetchJSON('data/services.json');
  } catch (error) {
    grids.forEach((grid) => renderError(grid, error.message));
    return;
  }

  const services = (data.services || []).filter(isLive);

  grids.forEach((grid) => {
    const limit = Number(grid.dataset.limit || services.length);
    grid.innerHTML = services
      .slice(0, limit)
      .map((service, index) => serviceTemplate(service, index))
      .join('');
    observeReveal(grid);
  });

  refreshIcons();
  document.dispatchEvent(new CustomEvent('hm:whatsapp-links'));
}
