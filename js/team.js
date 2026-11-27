/**
 * team.js - the people behind Heart Mobiles.
 * Photos are used only when a real photo path is supplied in data/team.json,
 * otherwise a clean initials avatar is shown.
 */

import { fetchJSON, escapeHtml, escapeAttr, safeUrl, isLive, renderError, refreshIcons, initials } from './utils.js';
import { observeReveal } from './animations.js';

function memberTemplate(member, index) {
  const photo = safeUrl(member.photo);

  const avatar = photo
    ? `<img src="${escapeAttr(photo)}" alt="Portrait of ${escapeAttr(member.name)}" loading="lazy" decoding="async" width="160" height="160" class="h-20 w-20 rounded-2xl object-cover">`
    : `<span class="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-800 font-display text-2xl font-extrabold text-white" aria-hidden="true">${escapeHtml(initials(member.name))}</span>`;

  return `<article class="card card-hover flex flex-col items-start gap-4 p-6" data-reveal data-reveal-delay="${index * 80}">
    ${avatar}
    <div>
      <h3 class="font-display text-lg font-bold">${escapeHtml(member.name)}</h3>
      <p class="text-[13px] font-semibold tracking-wide text-brand-500 uppercase">${escapeHtml(member.role || '')}</p>
    </div>
    ${member.bio ? `<p class="text-[14px] leading-relaxed text-muted">${escapeHtml(member.bio)}</p>` : ''}
    ${
      (member.tags || []).length
        ? `<div class="flex flex-wrap gap-2">${member.tags
            .map((tag) => `<span class="pill bg-offwhite text-brand-700">${escapeHtml(tag)}</span>`)
            .join('')}</div>`
        : ''
    }
  </article>`;
}

export async function initTeam() {
  const mount = document.getElementById('team-grid');
  if (!mount) return;

  let data;
  try {
    data = await fetchJSON('data/team.json');
  } catch (error) {
    renderError(mount, error.message);
    return;
  }

  const members = (data.members || []).filter((member) => isLive(member) && member.name);

  mount.innerHTML = members.length
    ? members.map((member, index) => memberTemplate(member, index)).join('')
    : '<p class="col-span-full text-center text-sm text-muted">Team information will be updated shortly.</p>';

  observeReveal(mount);
  refreshIcons();
}
