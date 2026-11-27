/**
 * animations.js - lightweight scroll reveals built on IntersectionObserver.
 *
 * Elements opt in with  data-reveal  and may add  data-reveal-delay="120"
 * (milliseconds). Without JavaScript the content stays fully visible, because
 * the .reveal class is only applied here.
 */

import { qsa, isReducedMotion } from './utils.js';

let observer = null;

function supportsObserver() {
  return typeof window.IntersectionObserver === 'function';
}

function ensureObserver() {
  if (observer || !supportsObserver()) return observer;
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -6% 0px', threshold: 0.06 }
  );
  return observer;
}

/** Observe reveals inside a container (defaults to the whole document). */
export function observeReveal(scope = document) {
  const targets = qsa('[data-reveal]', scope);
  if (!targets.length) return;

  if (isReducedMotion() || !supportsObserver()) {
    targets.forEach((el) => el.classList.add('reveal', 'is-visible'));
    return;
  }

  const io = ensureObserver();
  targets.forEach((el) => {
    if (el.classList.contains('reveal')) return;
    el.classList.add('reveal');
    const delay = Number(el.dataset.revealDelay || 0);
    if (delay > 0) el.style.transitionDelay = `${Math.min(delay, 600)}ms`;
    io.observe(el);
  });
}

export function initAnimations() {
  observeReveal();
}
