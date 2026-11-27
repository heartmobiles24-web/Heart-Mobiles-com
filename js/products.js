/**
 * products.js - mobile phone catalogue.
 *
 * Renders three independent mount points when they exist:
 *   #featured-products   - a small featured selection (home page)
 *   #product-grid        - the full catalogue with search, filters and sorting
 *   #product-detail      - single product view (reads ?id= from the URL)
 *
 * All content comes from data/products.json.
 */

import { getSite, whatsAppUrl, priceWith } from './config.js';
import {
  fetchJSON,
  escapeHtml,
  escapeAttr,
  safeUrl,
  availabilityMeta,
  isLive,
  renderError,
  refreshIcons,
  debounce,
  getParam,
  unique
} from './utils.js';
import { observeReveal } from './animations.js';
import { productEnquiryMessage } from './whatsapp.js';

let productsPromise = null;

/** Load the catalogue once and keep only active, valid entries. */
function loadProducts() {
  if (!productsPromise) {
    productsPromise = fetchJSON('data/products.json').then((data) =>
      (data.products || []).filter((item) => isLive(item) && item.model && Number.isFinite(Number(item.price)))
    );
  }
  return productsPromise;
}

/* -------------------------------------------------------------------------- */
/* Templates                                                                   */
/* -------------------------------------------------------------------------- */

function priceBlock(site, product) {
  const numericPrice = Number(product.price);
  const price = numericPrice > 0 ? priceWith(site, product.price) : 'Price on request';
  const original = Number(product.originalPrice) > Number(product.price) ? priceWith(site, product.originalPrice) : '';
  const off =
    original && Number(product.originalPrice) > 0
      ? Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)
      : 0;

  return `
    <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span class="font-display text-lg font-extrabold text-brand-950">${escapeHtml(price)}</span>
      ${original ? `<del class="text-[13px] font-medium text-muted">${escapeHtml(original)}</del>` : ''}
      ${off > 0 ? `<span class="text-[12px] font-bold text-emerald-600">${off}% off</span>` : ''}
    </div>`;
}

function cardTemplate(site, product, index = 0) {
  const availability = availabilityMeta(product.availability);
  const detailHref = `product-details.html?id=${encodeURIComponent(product.id)}`;
  const enquiry = whatsAppUrl(site.whatsapp, productEnquiryMessage(site, product));
  const image = safeUrl(product.image);
  const alt = `${product.brand || ''} ${product.model} smartphone`.trim();
  const specs = (product.specs || []).slice(0, 3);

  return `<article class="card card-hover group flex flex-col overflow-hidden" data-reveal data-reveal-delay="${(index % 4) * 60}">
    <a class="block" href="${escapeAttr(detailHref)}" aria-label="View details of ${escapeAttr(alt)}">
      <div class="aspect-square w-full overflow-hidden bg-offwhite">
        ${
          image
            ? `<img src="${escapeAttr(image)}" alt="${escapeAttr(alt)}" loading="lazy" decoding="async" width="600" height="600" class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]">`
            : ''
        }
      </div>
    </a>
    <div class="flex flex-1 flex-col gap-3 p-4">
      <div class="flex items-center justify-between gap-2">
        <span class="text-[11px] font-bold tracking-wider text-brand-500 uppercase">${escapeHtml(product.brand || '')}</span>
        <span class="pill ${availability.classes}">${escapeHtml(availability.label)}</span>
      </div>

      <h3 class="text-[17px] leading-snug font-bold">
        <a class="transition hover:text-brand-700" href="${escapeAttr(detailHref)}">${escapeHtml(product.model)}</a>
      </h3>

      ${
        specs.length
          ? `<ul class="space-y-1 text-[13px] leading-relaxed text-muted">${specs
              .map((spec) => `<li class="flex gap-2"><span class="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-brand-300"></span><span>${escapeHtml(spec)}</span></li>`)
              .join('')}</ul>`
          : ''
      }

      ${product.featured ? '<span class="pill w-fit bg-amber-50 text-amber-700">Featured</span>' : ''}

      <div class="mt-auto pt-2">${priceBlock(site, product)}</div>

      <div class="grid grid-cols-2 gap-2">
        <a class="btn btn-outline btn-sm" href="${escapeAttr(detailHref)}">Details</a>
        <a class="btn btn-wa btn-sm" href="${escapeAttr(enquiry)}" target="_blank" rel="noopener"
           aria-label="Enquire about ${escapeAttr(alt)} on WhatsApp">Enquire</a>
      </div>
    </div>
  </article>`;
}

/* -------------------------------------------------------------------------- */
/* Catalogue with search, filters and sorting                                  */
/* -------------------------------------------------------------------------- */

function applyFilters(products, filters) {
  const term = filters.search.trim().toLowerCase();

  let list = products.filter((product) => {
    if (filters.brand !== 'all' && product.brand !== filters.brand) return false;
    if (filters.tag !== 'all' && !(product.tags || []).includes(filters.tag)) return false;
    if (!term) return true;
    const haystack = [product.brand, product.model, (product.specs || []).join(' '), (product.tags || []).join(' ')]
      .join(' ')
      .toLowerCase();
    return haystack.includes(term);
  });

  const sorters = {
    featured: (a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || Number(a.price) - Number(b.price),
    'price-asc': (a, b) => Number(a.price) - Number(b.price),
    'price-desc': (a, b) => Number(b.price) - Number(a.price),
    'name-asc': (a, b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`)
  };

  list = list.slice().sort(sorters[filters.sort] || sorters.featured);
  return list;
}

function chipTemplate(value, label, group, pressed) {
  return `<button type="button" class="chip" data-group="${escapeAttr(group)}" data-value="${escapeAttr(value)}" aria-pressed="${pressed ? 'true' : 'false'}">${escapeHtml(label)}</button>`;
}

async function initCatalogue() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  const site = await getSite();
  let products = [];

  try {
    products = await loadProducts();
  } catch (error) {
    renderError(grid, error.message);
    return;
  }

  const searchInput = document.getElementById('product-search');
  const sortSelect = document.getElementById('sort-select');
  const brandFilters = document.getElementById('brand-filters');
  const categoryFilters = document.getElementById('category-filters');
  const countLabel = document.getElementById('product-count');
  const clearButton = document.getElementById('clear-filters');
  const loadMoreButton = document.getElementById('load-more');

  const state = { search: '', brand: 'all', tag: 'all', sort: 'featured', visible: Number(grid.dataset.pageSize || 12) };

  const brands = unique(products.map((product) => product.brand).filter(Boolean)).sort((a, b) => a.localeCompare(b));
  const tags = unique(products.flatMap((product) => product.tags || [])).sort((a, b) => a.localeCompare(b));

  if (brandFilters) {
    brandFilters.innerHTML = [
      chipTemplate('all', 'All brands', 'brand', true),
      ...brands.map((brand) => chipTemplate(brand, brand, 'brand', false))
    ].join('');
  }

  if (categoryFilters) {
    categoryFilters.innerHTML = [
      chipTemplate('all', 'All types', 'tag', true),
      ...tags.map((tag) => chipTemplate(tag, tag, 'tag', false))
    ].join('');
  }

  const render = () => {
    const filtered = applyFilters(products, state);
    const slice = filtered.slice(0, state.visible);

    grid.innerHTML = slice.length
      ? slice.map((product, index) => cardTemplate(site, product, index)).join('')
      : `<div class="card col-span-full px-6 py-12 text-center">
           <p class="font-display text-lg font-bold text-brand-950">No mobiles match your search</p>
           <p class="mt-1 text-sm text-muted">Try a different brand or clear the filters. We may still be able to arrange a model on request.</p>
           <a class="btn btn-wa mt-5" data-whatsapp="I am looking for a specific mobile model. Could you please check if it is available?" href="#">Ask on WhatsApp</a>
         </div>`;

    observeReveal(grid);
    refreshIcons();

    if (countLabel) {
      countLabel.textContent = filtered.length
        ? `Showing ${slice.length} of ${filtered.length} mobiles`
        : 'No mobiles found for the selected filters';
    }

    if (loadMoreButton) {
      const hasMore = filtered.length > slice.length;
      loadMoreButton.hidden = !hasMore;
      loadMoreButton.classList.toggle('hidden', !hasMore);
    }

    document.dispatchEvent(new CustomEvent('hm:whatsapp-links'));
  };

  const syncChips = (group, value) => {
    const scope = group === 'brand' ? brandFilters : categoryFilters;
    if (!scope) return;
    scope.querySelectorAll('.chip').forEach((chip) => {
      chip.setAttribute('aria-pressed', String(chip.dataset.value === value));
    });
  };

  const onChipClick = (event) => {
    const chip = event.target.closest('.chip');
    if (!chip) return;
    const { group, value } = chip.dataset;
    if (group === 'brand') state.brand = value;
    if (group === 'tag') state.tag = value;
    syncChips(group, value);
    state.visible = Number(grid.dataset.pageSize || 12);
    render();
  };

  if (brandFilters) brandFilters.addEventListener('click', onChipClick);
  if (categoryFilters) categoryFilters.addEventListener('click', onChipClick);

  if (searchInput) {
    searchInput.addEventListener(
      'input',
      debounce(() => {
        state.search = searchInput.value || '';
        state.visible = Number(grid.dataset.pageSize || 12);
        render();
      }, 180)
    );
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      state.sort = sortSelect.value;
      render();
    });
  }

  if (clearButton) {
    clearButton.addEventListener('click', () => {
      state.search = '';
      state.brand = 'all';
      state.tag = 'all';
      state.sort = 'featured';
      state.visible = Number(grid.dataset.pageSize || 12);
      if (searchInput) searchInput.value = '';
      if (sortSelect) sortSelect.value = 'featured';
      syncChips('brand', 'all');
      syncChips('tag', 'all');
      render();
    });
  }

  if (loadMoreButton) {
    loadMoreButton.addEventListener('click', () => {
      state.visible += Number(grid.dataset.pageSize || 12);
      render();
    });
  }

  render();
}

/* -------------------------------------------------------------------------- */
/* Featured strip (home page)                                                  */
/* -------------------------------------------------------------------------- */

async function initFeatured() {
  const mount = document.getElementById('featured-products');
  if (!mount) return;

  const site = await getSite();
  let products = [];

  try {
    products = await loadProducts();
  } catch (error) {
    renderError(mount, error.message);
    return;
  }

  const limit = Number(mount.dataset.limit || 8);
  const featured = products.filter((product) => product.featured).slice(0, limit);
  const list = featured.length ? featured : products.slice(0, limit);

  mount.innerHTML = list.map((product, index) => cardTemplate(site, product, index)).join('');
  observeReveal(mount);
  refreshIcons();
  document.dispatchEvent(new CustomEvent('hm:whatsapp-links'));
}

/* -------------------------------------------------------------------------- */
/* Product detail page                                                         */
/* -------------------------------------------------------------------------- */

function specRow(spec) {
  return `<li class="flex gap-3 border-b border-coolgrey py-2.5 last:border-0">
    <i data-lucide="check" class="mt-0.5 h-4 w-4 shrink-0 text-brand-500" aria-hidden="true"></i>
    <span class="text-[14px] text-ink">${escapeHtml(spec)}</span>
  </li>`;
}

async function initProductDetail() {
  const mount = document.getElementById('product-detail');
  if (!mount) return;

  const site = await getSite();
  let products = [];

  try {
    products = await loadProducts();
  } catch (error) {
    renderError(mount, error.message);
    return;
  }

  const id = getParam('id');
  const product = products.find((item) => item.id === id);

  if (!product) {
    mount.innerHTML = `<div class="card px-6 py-14 text-center lg:col-span-2">
        <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          <i data-lucide="search-x" class="h-6 w-6" aria-hidden="true"></i>
        </span>
        <h1 class="mt-5 font-display text-2xl font-extrabold">This mobile is not listed</h1>
        <p class="mx-auto mt-2 max-w-md text-sm text-muted">The model may have been sold or removed from the catalogue. Browse the current range, or message us and we will check availability for you.</p>
        <div class="mt-6 flex flex-wrap justify-center gap-3">
          <a class="btn btn-primary" href="products.html">Browse all mobiles</a>
          <a class="btn btn-wa" data-whatsapp="I am looking for a specific mobile model. Could you please check if it is available?" href="#">Ask on WhatsApp</a>
        </div>
      </div>`;
    refreshIcons();
    document.dispatchEvent(new CustomEvent('hm:whatsapp-links'));
    return;
  }

  // Page specific SEO
  const title = `${product.brand} ${product.model}`;
  document.title = `${title} - Price & Availability | Heart Mobiles`;
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute(
      'content',
      `${title} available at Heart Mobiles, Krishnagiri. Check specifications, indicative price and availability, then enquire on WhatsApp.`
    );
  }

  const availability = availabilityMeta(product.availability);
  const image = safeUrl(product.image);
  const alt = `${title} smartphone`;
  const enquiry = whatsAppUrl(site.whatsapp, productEnquiryMessage(site, product));
  const original = Number(product.originalPrice) > Number(product.price) ? priceWith(site, product.originalPrice) : '';

  mount.innerHTML = `
    <div class="card overflow-hidden p-3 sm:p-4">
      <div class="aspect-square w-full overflow-hidden rounded-xl bg-offwhite">
        ${
          image
            ? `<img src="${escapeAttr(image)}" alt="${escapeAttr(alt)}" loading="eager" decoding="async" width="800" height="800" class="h-full w-full object-cover">`
            : ''
        }
      </div>
    </div>

    <div class="flex flex-col gap-5">
      <nav aria-label="Breadcrumb" class="text-[12px] font-semibold text-muted">
        <a class="hover:text-brand-700" href="index.html">Home</a>
        <span aria-hidden="true">/</span>
        <a class="hover:text-brand-700" href="products.html">Mobiles</a>
        <span aria-hidden="true">/</span>
        <span class="text-brand-800">${escapeHtml(product.model)}</span>
      </nav>

      <div class="flex flex-wrap items-center gap-3">
        <span class="pill bg-brand-100 text-brand-700">${escapeHtml(product.brand || '')}</span>
        <span class="pill ${availability.classes}">${escapeHtml(availability.label)}</span>
        ${product.featured ? '<span class="pill bg-amber-50 text-amber-700">Featured</span>' : ''}
      </div>

      <h1 class="font-display text-3xl leading-tight font-extrabold sm:text-4xl">${escapeHtml(product.model)}</h1>

      <div class="flex flex-wrap items-baseline gap-3">
        <span class="font-display text-3xl font-extrabold text-brand-950">${escapeHtml(Number(product.price) > 0 ? priceWith(site, product.price) : 'Price on request')}</span>
        ${original ? `<del class="text-base font-medium text-muted">${escapeHtml(original)}</del>` : ''}
      </div>

      ${product.description ? `<p class="lead">${escapeHtml(product.description)}</p>` : ''}

      ${
        (product.specs || []).length
          ? `<div>
              <h2 class="font-display text-base font-bold text-brand-950">Key specifications</h2>
              <ul class="mt-2">${product.specs.map(specRow).join('')}</ul>
            </div>`
          : ''
      }

      ${
        (product.tags || []).length
          ? `<div class="flex flex-wrap gap-2">${product.tags
              .map((tag) => `<span class="pill bg-offwhite text-brand-700">${escapeHtml(tag)}</span>`)
              .join('')}</div>`
          : ''
      }

      <div class="flex flex-col gap-3 sm:flex-row">
        <a class="btn btn-wa flex-1" href="${escapeAttr(enquiry)}" target="_blank" rel="noopener">
          <i data-lucide="message-circle" class="h-4 w-4" aria-hidden="true"></i> Enquire on WhatsApp
        </a>
        <a class="btn btn-outline flex-1" data-call data-call-label="Call the shop">
          <i data-lucide="phone" class="h-4 w-4" aria-hidden="true"></i> Call the shop
        </a>
      </div>

      <p class="rounded-xl bg-offwhite px-4 py-3 text-[12px] leading-relaxed text-muted">${escapeHtml(site.priceDisclaimer || '')}</p>
    </div>`;

  refreshIcons();
  document.dispatchEvent(new CustomEvent('hm:whatsapp-links'));

  // Product structured data - mirrors the visible information only.
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${product.brand} ${product.model}`,
    description: product.description || `${product.model} available at Heart Mobiles, Krishnagiri.`,
    brand: { '@type': 'Brand', name: product.brand },
    sku: product.id,
    offers: {
      '@type': 'Offer',
      price: Number(product.price),
      priceCurrency: site.currency || 'INR',
      availability:
        product.availability === 'on-order' || product.availability === 'out-of-stock'
          ? 'https://schema.org/PreOrder'
          : 'https://schema.org/InStock',
      seller: { '@type': 'ElectronicsStore', name: site.name }
    }
  };
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(ld);
  document.head.appendChild(script);

  // Related mobiles from the same brand.
  const relatedMount = document.getElementById('related-products');
  if (relatedMount) {
    const related = products.filter((item) => item.brand === product.brand && item.id !== product.id).slice(0, 4);
    const fallback = products.filter((item) => item.id !== product.id && !related.includes(item)).slice(0, 4);
    const list = related.length ? related : fallback;
    relatedMount.innerHTML = list.map((item, index) => cardTemplate(site, item, index)).join('');
    observeReveal(relatedMount);
  }

  refreshIcons();
  document.dispatchEvent(new CustomEvent('hm:whatsapp-links'));
}

/* -------------------------------------------------------------------------- */

export async function initProducts() {
  await Promise.allSettled([initFeatured(), initCatalogue(), initProductDetail()]);
}
