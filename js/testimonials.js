/**
 * testimonials.js - customer feedback.
 *
 * Reviews are never invented: the section only renders entries that exist in
 * data/testimonials.json. When the list is empty a friendly invitation is shown
 * instead of placeholder reviews.
 */

import { fetchJSON, escapeHtml, escapeAttr, isLive, renderError, refreshIcons } from './utils.js';
import { observeReveal } from './animations.js';

function stars(rating) {
  const value = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  if (!value) return '';
  return `<div class="flex items-center gap-1 text-amber-500" role="img" aria-label="Rated ${value} out of 5">
    <span aria-hidden="true" class="text-[15px] tracking-[2px]">${'★'.repeat(value)}${'☆'.repeat(5 - value)}</span>
  </div>`;
}

function reviewTemplate(item, index) {
  return `<article class="card flex flex-col gap-4 p-6" data-reveal data-reveal-delay="${index * 60}">
    ${stars(item.rating)}
    <blockquote class="text-[14.5px] leading-relaxed text-ink">"${escapeHtml(item.text)}"</blockquote>
    <footer class="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-coolgrey pt-4">
      <span class="font-display text-[15px] font-bold text-brand-950">${escapeHtml(item.name)}</span>
      ${item.source ? `<span class="text-[12px] text-muted">via ${escapeHtml(item.source)}</span>` : ''}
      ${item.verified ? '<span class="pill bg-emerald-50 text-emerald-700">Verified</span>' : ''}
    </footer>
  </article>`;
}

export async function initTestimonials() {
  const mount = document.getElementById('testimonials-wrap');
  if (!mount) return;

  let data;
  try {
    data = await fetchJSON('data/testimonials.json');
  } catch (error) {
    renderError(mount, error.message);
    return;
  }

  const reviews = (data.testimonials || []).filter(isLive);

  if (!reviews.length) {
    const message =
      data.emptyMessage ||
      'Customer reviews will appear here once they are collected. If you have bought from Heart Mobiles, we would love to hear about your experience.';
    mount.innerHTML = `<div class="card flex flex-col items-center gap-4 px-6 py-12 text-center" data-reveal>
        <span class="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          <i data-lucide="message-square-heart" class="h-6 w-6" aria-hidden="true"></i>
        </span>
        <p class="max-w-xl text-[15px] leading-relaxed text-muted">${escapeHtml(message)}</p>
        <a class="btn btn-wa" data-whatsapp="I would like to share my experience with Heart Mobiles." href="#">Share your experience</a>
      </div>`;
  } else {
    mount.innerHTML = reviews.map((item, index) => reviewTemplate(item, index)).join('');
  }

  observeReveal(mount);
  refreshIcons();
  document.dispatchEvent(new CustomEvent('hm:whatsapp-links'));
}
