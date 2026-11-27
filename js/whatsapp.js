/**
 * whatsapp.js - WhatsApp + call actions.
 *
 *  - Fills the href of every [data-whatsapp] element with a WhatsApp deep link.
 *  - Fills the href of every [data-call] element with a tel: link.
 *  - Injects the floating WhatsApp and call buttons on every page.
 */

import { getSite, whatsAppUrl, telUrl } from './config.js';
import { escapeAttr, refreshIcons } from './utils.js';

/**
 * Build the enquiry message for a specific product or accessory.
 * @param {object} site
 * @param {{brand?:string, model?:string, name?:string}} item
 */
export function productEnquiryMessage(site, item) {
  const title = [item.brand, item.model || item.name].filter(Boolean).join(' ');
  return `Assalamu Alaikum! I am interested in the ${title} shown on the Heart Mobiles website. Could you please share the current price, availability and offers?`;
}

/** Fill every [data-whatsapp] and [data-call] element with a working link. */
function bindActionLinks(site) {
  document.querySelectorAll('[data-whatsapp]').forEach((el) => {
    const message = el.dataset.whatsapp || site.whatsappMessage;
    const number = el.dataset.whatsappNumber || site.whatsapp;
    el.setAttribute('href', whatsAppUrl(number, message));
    el.setAttribute('target', '_blank');
    el.setAttribute('rel', 'noopener');
  });

  document.querySelectorAll('[data-call]').forEach((el) => {
    el.setAttribute('href', telUrl(site.phone));
    const label = el.dataset.callLabel || site.phoneDisplay;
    const slot = el.querySelector('[data-call-text]');
    if (slot) slot.textContent = label;
    else if (!el.textContent.trim()) el.textContent = label;
  });
}

export async function initWhatsApp() {
  const site = await getSite();
  bindActionLinks(site);
  injectFloatingActions(site);

  // Sections render after page load, so re-bind whenever new links appear.
  document.addEventListener('hm:whatsapp-links', () => bindActionLinks(site));
}

export { bindActionLinks };

function injectFloatingActions(site) {
  if (document.getElementById('floating-actions')) return;

  const wrapper = document.createElement('div');
  wrapper.id = 'floating-actions';
  wrapper.className = 'fixed right-4 bottom-4 z-[80] flex flex-col items-end gap-3 sm:right-6 sm:bottom-6';

  const waHref = whatsAppUrl(site.whatsapp, site.whatsappMessage);

  wrapper.innerHTML = `
    <a class="fab bg-wa" href="${escapeAttr(waHref)}" target="_blank" rel="noopener"
       aria-label="Chat with Heart Mobiles on WhatsApp" title="WhatsApp enquiry">
      <i data-lucide="message-circle" class="h-6 w-6" aria-hidden="true"></i>
    </a>
    <a class="fab bg-brand-800" href="${escapeAttr(telUrl(site.phone))}"
       aria-label="Call Heart Mobiles on ${escapeAttr(site.phoneDisplay)}" title="Call the shop">
      <i data-lucide="phone" class="h-5 w-5" aria-hidden="true"></i>
    </a>`;

  document.body.appendChild(wrapper);
  refreshIcons();
}
