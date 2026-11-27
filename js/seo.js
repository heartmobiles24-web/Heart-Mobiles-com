/**
 * seo.js - injects structured data (JSON-LD) for the business.
 * Page level JSON-LD (FAQ, Product) is injected by the modules that render
 * that content, so the markup always matches what the visitor can actually see.
 */

import { getSite } from './config.js';

const SITE_URL = 'https://heartmobiles.com';

function inject(id, data) {
  let node = document.getElementById(id);
  if (!node) {
    node = document.createElement('script');
    node.type = 'application/ld+json';
    node.id = id;
    document.head.appendChild(node);
  }
  node.textContent = JSON.stringify(data);
}

function postalAddress(site) {
  const a = site.address || {};
  return {
    '@type': 'PostalAddress',
    streetAddress: [a.line1, a.line2].filter(Boolean).join(', '),
    addressLocality: a.city || 'Krishnagiri',
    addressRegion: a.state || 'Tamil Nadu',
    postalCode: a.pincode || '635001',
    addressCountry: 'IN'
  };
}

export async function initSeo() {
  const site = await getSite();

  const store = {
    '@context': 'https://schema.org',
    '@type': 'ElectronicsStore',
    '@id': `${SITE_URL}/#store`,
    name: site.name,
    description: site.shortDescription,
    url: `${SITE_URL}/`,
    telephone: site.phone,
    address: postalAddress(site),
    hasMap: site.mapsUrl,
    sameAs: Object.values(site.social || {}).filter(Boolean),
    currenciesAccepted: 'INR',
    paymentAccepted: 'Cash, UPI, Credit Card, Debit Card, EMI',
    areaServed: { '@type': 'City', name: 'Krishnagiri' },
    founder: [{ '@type': 'Person', name: site.proprietor }, { '@type': 'Person', name: site.manager }].filter(
      (person) => person.name
    ),
    knowsAbout: ['Mobile phones', 'Mobile accessories', 'Mobile service', 'Mobile exchange', 'EMI on smartphones']
  };

  // Opening hours are published only once confirmed by the shop.
  if (site.hoursConfirmed && Array.isArray(site.hours) && site.hours.length) {
    store.openingHours = site.hours.map((slot) => `${slot.days} ${slot.time}`);
  }

  inject('ld-store', store);

  inject('ld-website', {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.name,
    url: `${SITE_URL}/`,
    inLanguage: 'en-IN',
    publisher: { '@id': `${SITE_URL}/#store` }
  });
}

export { SITE_URL };
