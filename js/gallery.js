/**
 * gallery.js - shop photo gallery with category filters and a lightbox.
 * Photos come from data/gallery.json. Replace the illustrative image paths with
 * real photographs of the shop.
 */

import { fetchJSON, escapeHtml, escapeAttr, safeUrl, isLive, renderError, refreshIcons } from './utils.js';
import { observeReveal } from './animations.js';

function openLightbox(item) {
  const src = safeUrl(item.src);
  if (!src) return;

  if (window.Swal) {
    window.Swal.fire({
      imageUrl: src,
      imageAlt: item.alt || item.caption || 'Heart Mobiles photograph',
      title: item.caption || '',
      text: item.alt || '',
      confirmButtonText: 'Close',
      confirmButtonColor: '#153b63',
      width: 720,
      padding: '1.25rem'
    });
  } else {
    window.open(src, '_blank', 'noopener');
  }
}

export async function initGallery() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;

  let data;
  try {
    data = await fetchJSON('data/gallery.json');
  } catch (error) {
    renderError(grid, error.message);
    return;
  }

  const items = (data.items || []).filter((item) => isLive(item) && safeUrl(item.src));
  const categories = (data.categories || []).filter((category) => items.some((item) => item.category === category.id));
  const filters = document.getElementById('gallery-filters');
  const state = { category: 'all' };

  if (filters) {
    filters.innerHTML = [
      `<button type="button" class="chip" data-value="all" aria-pressed="true">All photos</button>`,
      ...categories.map(
        (category) =>
          `<button type="button" class="chip" data-value="${escapeAttr(category.id)}" aria-pressed="false">${escapeHtml(category.name)}</button>`
      )
    ].join('');
  }

  const render = () => {
    const list = items.filter((item) => state.category === 'all' || item.category === state.category);

    grid.innerHTML = list.length
      ? list
          .map(
            (item, index) => `<figure class="group relative overflow-hidden rounded-2xl border border-coolgrey bg-white shadow-soft" data-reveal data-reveal-delay="${(index % 3) * 70}">
              <button type="button" class="block w-full cursor-zoom-in" data-lightbox="${escapeAttr(item.id || '')}"
                      aria-label="Open larger photo: ${escapeAttr(item.caption || item.alt || 'shop photograph')}">
                <img src="${escapeAttr(safeUrl(item.src))}" alt="${escapeAttr(item.alt || item.caption || '')}"
                     loading="lazy" decoding="async" width="${Number(item.width) || 800}" height="${Number(item.height) || 600}"
                     class="aspect-4/3 w-full object-cover transition duration-500 group-hover:scale-[1.05]">
              </button>
              ${
                item.caption
                  ? `<figcaption class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-950/85 to-transparent px-4 pt-10 pb-3 text-[13px] font-semibold text-white">${escapeHtml(item.caption)}</figcaption>`
                  : ''
              }
            </figure>`
          )
          .join('')
      : '<p class="col-span-full text-center text-sm text-muted">Photos will be added shortly.</p>';

    observeReveal(grid);
  };

  if (filters) {
    filters.addEventListener('click', (event) => {
      const chip = event.target.closest('.chip');
      if (!chip) return;
      state.category = chip.dataset.value;
      filters.querySelectorAll('.chip').forEach((el) => el.setAttribute('aria-pressed', String(el === chip)));
      render();
    });
  }

  grid.addEventListener('click', (event) => {
    const button = event.target.closest('[data-lightbox]');
    if (!button) return;
    const item = items.find((entry) => entry.id === button.dataset.lightbox);
    if (item) openLightbox(item);
  });

  render();
}
