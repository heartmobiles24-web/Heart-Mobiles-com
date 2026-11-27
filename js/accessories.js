/**
 * accessories.js - accessories catalogue.
 * Mount points: #accessory-grid, #accessory-filters, #accessory-search.
 * Content comes from data/accessories.json.
 */

import { getSite, whatsAppUrl } from './config.js';
import {
  fetchJSON,
  escapeHtml,
  escapeAttr,
  safeUrl,
  isLive,
  renderError,
  refreshIcons,
  debounce,
  unique
} from './utils.js';
import { observeReveal } from './animations.js';

function itemTemplate(site, item, index = 0) {
  const image = safeUrl(item.image);
  const title = item.name;
  const message = `Assalamu Alaikum! I would like to know the availability of the ${title} shown on the Heart Mobiles website.`;
  const alt = `${title} available at Heart Mobiles`;

  return `<article class="card card-hover group flex flex-col overflow-hidden" data-reveal data-reveal-delay="${(index % 4) * 60}">
    <div class="aspect-square w-full overflow-hidden bg-offwhite">
      ${
        image
          ? `<img src="${escapeAttr(image)}" alt="${escapeAttr(alt)}" loading="lazy" decoding="async" width="600" height="600" class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]">`
          : ''
      }
    </div>
    <div class="flex flex-1 flex-col gap-3 p-4">
      <h3 class="text-[16px] leading-snug font-bold">${escapeHtml(title)}</h3>
      ${item.description ? `<p class="text-[13px] leading-relaxed text-muted">${escapeHtml(item.description)}</p>` : ''}
      ${
        (item.tags || []).length
          ? `<div class="flex flex-wrap gap-1.5">${item.tags
              .map((tag) => `<span class="pill bg-offwhite text-brand-700">${escapeHtml(tag)}</span>`)
              .join('')}</div>`
          : ''
      }
      <div class="mt-auto pt-1"></div>
      <a class="btn btn-wa btn-sm w-full" href="${escapeAttr(whatsAppUrl(site.whatsapp, message))}" target="_blank" rel="noopener"
         aria-label="Enquire about ${escapeAttr(title)} on WhatsApp">Enquire</a>
    </div>
  </article>`;
}

export async function initAccessories() {
  const grid = document.getElementById('accessory-grid');
  if (!grid) return;

  const site = await getSite();
  let data;

  try {
    data = await fetchJSON('data/accessories.json');
  } catch (error) {
    renderError(grid, error.message);
    return;
  }

  const items = (data.items || []).filter((item) => isLive(item) && item.name);
  const categories = (data.categories || []).filter((category) => items.some((item) => item.category === category.id));

  const filters = document.getElementById('accessory-filters');
  const search = document.getElementById('accessory-search');
  const count = document.getElementById('accessory-count');

  const state = { category: 'all', search: '' };
  const pageSize = Number(grid.dataset.pageSize || 12);
  let visible = pageSize;

  if (filters) {
    filters.innerHTML = [
      `<button type="button" class="chip" data-value="all" aria-pressed="true">All accessories</button>`,
      ...categories.map(
        (category) =>
          `<button type="button" class="chip" data-value="${escapeAttr(category.id)}" aria-pressed="false">${escapeHtml(category.name)}</button>`
      )
    ].join('');
  }

  const render = () => {
    const term = state.search.trim().toLowerCase();
    const filtered = items.filter((item) => {
      if (state.category !== 'all' && item.category !== state.category) return false;
      if (!term) return true;
      return [item.name, item.description, (item.tags || []).join(' ')].join(' ').toLowerCase().includes(term);
    });

    const slice = filtered.slice(0, visible);

    grid.innerHTML = slice.length
      ? slice.map((item, index) => itemTemplate(site, item, index)).join('')
      : `<div class="card col-span-full px-6 py-12 text-center">
           <p class="font-display text-lg font-bold text-brand-950">No accessories match your search</p>
           <p class="mt-1 text-sm text-muted">We keep a wide range of accessories in the shop, so it is worth asking us directly.</p>
           <a class="btn btn-wa mt-5" data-whatsapp="I would like to know about the mobile accessories available at Heart Mobiles." href="#">Ask on WhatsApp</a>
         </div>`;

    observeReveal(grid);
    refreshIcons();

    if (count) {
      count.textContent = filtered.length ? `Showing ${slice.length} of ${filtered.length} accessories` : 'No accessories found';
    }

    const more = document.getElementById('accessory-load-more');
    if (more) {
      const hasMore = filtered.length > slice.length;
      more.hidden = !hasMore;
      more.classList.toggle('hidden', !hasMore);
    }

    document.dispatchEvent(new CustomEvent('hm:whatsapp-links'));
  };

  if (filters) {
    filters.addEventListener('click', (event) => {
      const chip = event.target.closest('.chip');
      if (!chip) return;
      state.category = chip.dataset.value;
      filters.querySelectorAll('.chip').forEach((el) => el.setAttribute('aria-pressed', String(el === chip)));
      visible = pageSize;
      render();
    });
  }

  if (search) {
    search.addEventListener(
      'input',
      debounce(() => {
        state.search = search.value || '';
        visible = pageSize;
        render();
      }, 180)
    );
  }

  const more = document.getElementById('accessory-load-more');
  if (more) {
    more.addEventListener('click', () => {
      visible += pageSize;
      render();
    });
  }

  render();
}
