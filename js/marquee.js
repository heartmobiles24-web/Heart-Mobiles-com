/**
 * marquee.js - builds a seamless, infinite marquee.
 *
 * The track holds the same sequence twice and the CSS animation translates the
 * track by exactly -50%, so the loop is seamless at any width. The duplicate
 * group is hidden from assistive technology.
 *
 * The loop duration is derived from the measured width of one sequence and a
 * target speed in pixels per second, so the strip moves at the same visual
 * speed on phones, tablets and desktops even though the cells are sized
 * differently on each. A ResizeObserver re-syncs the loop after a resize, a
 * web-font swap or a logo image finishing its load.
 */

import { debounce } from './utils.js';

const observers = new WeakMap();

/**
 * @param {HTMLElement|null} track element with class "marquee-track" or "ticker-track"
 * @param {Array} items
 * @param {(item: any, index: number) => string} renderItem returns HTML for one item
 * @param {{minItems?: number, pxPerSecond?: number, secondsPerItem?: number, minSeconds?: number, easing?: string, sequenceClass?: string}} [options]
 */
export function buildMarquee(track, items, renderItem, options = {}) {
  if (!track) return;

  const holder = track.closest('.marquee, .ticker');
  const clip = track.parentElement || holder || track;

  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!list.length) {
    if (holder) holder.hidden = true;
    return;
  }

  const minItems = options.minItems || 8;
  const pxPerSecond = options.pxPerSecond || 60;
  const secondsPerItem = options.secondsPerItem || 3.4;
  const minSeconds = options.minSeconds || 26;
  const easing = options.easing || 'linear';
  const sequenceClass = options.sequenceClass || 'marquee-seq';

  let repeats = Math.max(1, Math.ceil(minItems / list.length));
  let count = 0;

  const paint = () => {
    const sequence = [];
    for (let i = 0; i < repeats; i += 1) sequence.push(...list);
    const html = sequence.map((item, index) => renderItem(item, index)).join('');
    track.innerHTML =
      `<div class="${sequenceClass}">${html}</div>
       <div class="${sequenceClass}" aria-hidden="true">${html}</div>`;
    count = sequence.length;
  };

  /* Grow the repeated sequence until one copy is at least as wide as the visible
     strip, so the loop can never reveal a gap on very wide screens. */
  const growToFit = () => {
    const seq = track.firstElementChild;
    const viewport = clip.clientWidth;
    if (!seq || !viewport) return;

    const unit = seq.scrollWidth / repeats;
    if (unit <= 0) return;

    const needed = Math.ceil(viewport / unit);
    if (needed > repeats) {
      repeats = needed;
      paint();
    }
  };

  /* One loop travels exactly one sequence width, so time = width / speed keeps
     the speed in px/s identical on every screen size. */
  const syncDuration = () => {
    const seq = track.firstElementChild;
    const width = seq ? seq.scrollWidth : 0;
    const seconds = width
      ? Math.min(240, Math.max(12, Math.round(width / pxPerSecond)))
      : Math.max(minSeconds, Math.round(count * secondsPerItem));
    track.style.setProperty('--marquee-duration', `${seconds}s`);
    track.style.setProperty('--marquee-easing', easing);
  };

  const sync = () => {
    growToFit();
    syncDuration();
  };

  paint();
  sync();

  if (holder) holder.hidden = false;

  if (typeof ResizeObserver === 'function') {
    observers.get(track)?.disconnect();

    let observer = null;

    const run = debounce(() => {
      sync();
      const seq = track.firstElementChild;
      if (seq && observer) observer.observe(seq);
    }, 150);

    observer = new ResizeObserver(run);
    observer.observe(clip);
    const seq = track.firstElementChild;
    if (seq) observer.observe(seq);
    observers.set(track, observer);
  }
}
