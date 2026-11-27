/**
 * config.js - global site configuration helpers.
 *
 * The shop's phone number, WhatsApp number and address live in data/site.json.
 * A small fallback is kept here so WhatsApp and call buttons keep working even
 * if the JSON request fails.
 */

import { fetchJSON } from './utils.js';

const FALLBACK_SITE = {
  name: 'Heart Mobiles',
  phone: '+919952005749',
  phoneDisplay: '+91 99520 05749',
  whatsapp: '919952005749',
  whatsappMessage:
    'Assalamu Alaikum! I visited the Heart Mobiles website. I would like to know more about your available mobile phones, accessories and current offers. Could you please share the details?',
  currencySymbol: '₹',
  address: {
    full: '272, Chowk Masjid Complex, New Pet, Krishnagiri - 635001, Tamil Nadu, India'
  },
  mapsUrl: 'https://www.google.com/maps/place/Heart+Mobiles/@12.5177498,78.2215699,17z/data=!3m1!4b1!4m6!3m5!1s0x3bac3576acfd443d:0x2257278c0c6b9011!8m2!3d12.5177498!4d78.2215699!16s%2Fg%2F11_0jsgjk9?entry=ttu&g_ep=EgoyMDI2MTEyMy4wIKXMDSoASAFQAw%3D%3D',
  reviewUrl: 'https://g.page/r/CRGQawyMJ1ciECE/review',
  social: {
    facebook: 'https://www.facebook.com/share/1Lx29KHhKk/',
    instagram: 'https://www.instagram.com/heart_mobiles?dmpr=aHdoNnM2cW9zbWV2',
    youtube: 'https://www.youtube.com/@HeartMobiles'
  },
  developer: {
    brand: 'CodeCraft by Syed',
    tagline: 'Create. Solve. Inspire.',
    website: 'https://codecraftbysyed-portfolio.vercel.app/',
    phone: '+918807595210'
  }
};

/** Replace this value with a form service endpoint to enable the contact form. */
export const FORM_ENDPOINT = '';

let sitePromise = null;

/** Load site.json once and reuse the promise for the rest of the session. */
export function getSite() {
  if (!sitePromise) {
    sitePromise = fetchJSON('data/site.json').catch(() => FALLBACK_SITE);
  }
  return sitePromise;
}

/** Build a WhatsApp deep link for a given message. */
export function whatsAppUrl(number, message) {
  const digits = String(number || '').replace(/\D/g, '');
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${digits}${text}`;
}

/** Build a tel: link. */
export function telUrl(number) {
  const clean = String(number || '').replace(/[^\d+]/g, '');
  return `tel:${clean}`;
}

/** Format a full price string using the configured currency symbol. */
export function priceWith(site, amount) {
  const symbol = (site && site.currencySymbol) || '₹';
  const value = Number(amount);
  if (!Number.isFinite(value)) return '';
  return `${symbol}${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}
