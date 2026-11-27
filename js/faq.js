/**
 * faq.js - accessible FAQ accordion.
 *
 * Content is rendered from data/faqs.json; each item is a real button with
 * aria-expanded / aria-controls, so keyboard and screen reader users get the
 * same experience as mouse users.
 */

import { fetchJSON, escapeHtml, escapeAttr, isLive, renderError, refreshIcons } from './utils.js';
import { observeReveal } from './animations.js';

function faqTemplate(item, index) {
  const panelId = `faq-panel-${escapeAttr(item.id || index)}`;
  const buttonId = `faq-button-${escapeAttr(item.id || index)}`;

  return `<div class="faq-item" data-open="false" data-category="${escapeAttr(item.category || '')}" data-reveal data-reveal-delay="${(index % 6) * 40}">
    <h3 class="m-0">
      <button type="button" id="${buttonId}" class="faq-trigger" aria-expanded="false" aria-controls="${panelId}">
        <span>${escapeHtml(item.q)}</span>
        <i data-lucide="chevron-down" class="faq-chevron h-5 w-5 text-brand-500" aria-hidden="true"></i>
      </button>
    </h3>
    <div class="faq-panel" id="${panelId}" role="region" aria-labelledby="${buttonId}">
      <div><p class="px-5 pt-0 pb-5 text-[14px] leading-relaxed text-muted">${escapeHtml(item.a)}</p></div>
    </div>
  </div>`;
}

export async function initFaq() {
  const list = document.getElementById('faq-list');
  if (!list) return;

  let data;
  try {
    data = await fetchJSON('data/faqs.json');
  } catch (error) {
    renderError(list, error.message);
    return;
  }

  const faqs = (data.faqs || []).filter(isLive);
  const categories = (data.categories || []).filter((category) => faqs.some((faq) => faq.category === category.id));
  const filters = document.getElementById('faq-filters');
  const state = { category: 'all' };

  if (filters) {
    filters.innerHTML = [
      `<button type="button" class="chip" data-value="all" aria-pressed="true">All questions</button>`,
      ...categories.map(
        (category) =>
          `<button type="button" class="chip" data-value="${escapeAttr(category.id)}" aria-pressed="false">${escapeHtml(category.name)}</button>`
      )
    ].join('');
  }

  const render = () => {
    const entries = faqs.filter((faq) => state.category === 'all' || faq.category === state.category);
    list.innerHTML = entries.length
      ? entries.map((faq, index) => faqTemplate(faq, index)).join('')
      : '<p class="text-center text-sm text-muted">No questions in this category yet. Please contact us directly.</p>';
    observeReveal(list);
    refreshIcons();
  };

  // Accordion behaviour (single item open at a time).
  list.addEventListener('click', (event) => {
    const trigger = event.target.closest('.faq-trigger');
    if (!trigger) return;

    const item = trigger.closest('.faq-item');
    const isOpen = item.dataset.open === 'true';

    list.querySelectorAll('.faq-item').forEach((entry) => {
      entry.dataset.open = 'false';
      const button = entry.querySelector('.faq-trigger');
      if (button) button.setAttribute('aria-expanded', 'false');
    });

    if (!isOpen) {
      item.dataset.open = 'true';
      trigger.setAttribute('aria-expanded', 'true');
    }
  });

  if (filters) {
    filters.addEventListener('click', (event) => {
      const chip = event.target.closest('.chip');
      if (!chip) return;
      state.category = chip.dataset.value;
      filters.querySelectorAll('.chip').forEach((el) => el.setAttribute('aria-pressed', String(el === chip)));
      render();
    });
  }

  render();

  // FAQPage structured data, generated from the same visible content.
  const visible = faqs.slice(0, 30);
  if (visible.length) {
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: visible.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: { '@type': 'Answer', text: faq.a }
      }))
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(ld);
    document.head.appendChild(script);
  }
}
