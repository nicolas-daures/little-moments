'use strict';
const I18N = window.SITE_I18N;
const t = (key, variables) => I18N.t(key, variables);
const activities = window.SITE_ACTIVITIES;
const palettes = {
  Créer: ['#edf0d9', '#627641'],
  Explorer: ['#e3efe4', '#377657'],
  Jouer: ['#fff0d4', '#a47120'],
  Cuisiner: ['#fce5d7', '#ac6240'],
  Découvrir: ['#e4edf5', '#4c7390'],
};
const iconPaths = {
  Créer: '<path d="m16 3 5 5-12 12H4v-5L16 3zM14 5l5 5M3 22h18"/>',
  Explorer:
    '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>',
  Jouer:
    '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8 8h.01M16 8h.01M12 12h.01M8 16h.01M16 16h.01"/>',
  Cuisiner: '<path d="M7 14a4 4 0 0 1-1-8 6 6 0 0 1 12 0 4 4 0 0 1-1 8v6H7v-6zM7 17h10"/>',
  Découvrir: '<path d="M9 3h6M10 3v6L4 19a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2L14 9V3M8 15h8"/>',
};
const seasonalIds = new Set([
  'carnet-saisons',
  'bingo-nature',
  'oiseaux',
  'carte-sonore',
  'pommes-four',
  'couleurs',
  'landart',
  'photo',
  'nuages',
  'empreintes-feuilles',
  'monstres-feuilles',
  'pommes-pin-meteo',
  'signes-automne',
  'crumble-pomme-poire',
]);
const state = {
  age: 'all',
  duration: '999',
  budget: '999',
  weather: 'all',
  place: 'all',
  category: 'all',
  favoritesOnly: false,
  completedOnly: false,
  seasonalOnly: false,
  query: '',
};
const FAVORITES_KEY = 'les-petits-moments-favorites';
const COMPLETED_KEY = 'les-petits-moments-completed';
let favorites = new Set();
let completed = new Set();
try {
  favorites = new Set(
    JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]').filter((id) =>
      activities.some((a) => a.id === id),
    ),
  );
} catch {
  favorites = new Set();
}
try {
  completed = new Set(
    JSON.parse(localStorage.getItem(COMPLETED_KEY) || '[]').filter((id) =>
      activities.some((a) => a.id === id),
    ),
  );
} catch {
  completed = new Set();
}
const $ = (id) => document.getElementById(id);
const costLabel = (a) =>
  a.cost === 0 ? t('noPurchase') : I18N.lang === 'en' ? `≈ €${a.cost}` : `≈ ${a.cost} €`;
function icon(category) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[category]}</svg>`;
}
const normalize = (text) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .toLocaleLowerCase(I18N.lang);
function matchesQuery(a) {
  if (!state.query) return true;
  return normalize([a.title, a.desc, I18N.category(a.category), ...a.materials].join(' ')).includes(
    normalize(state.query),
  );
}
function filtered() {
  return activities.filter(
    (a) =>
      (state.age === 'all' || a.age <= Number(state.age)) &&
      a.time <= Number(state.duration) &&
      a.cost <= Number(state.budget) &&
      (state.weather !== 'rain' || a.place === 'inside') &&
      (state.place === 'all' || state.place === a.place) &&
      (state.category === 'all' || state.category === a.category) &&
      (!state.favoritesOnly || favorites.has(a.id)) &&
      (!state.completedOnly || completed.has(a.id)) &&
      (!state.seasonalOnly || seasonalIds.has(a.id)) &&
      matchesQuery(a),
  );
}
function renderActivityCard(activity) {
  const [tint, tone] = palettes[activity.category];
  const badges = [];
  if (favorites.has(activity.id)) {
    badges.push(`
      <span class="favorite-badge" aria-label="${t('favoriteLabel')}">
        ${t('favoriteBadge')}
      </span>
    `);
  }
  if (completed.has(activity.id)) {
    badges.push(`
      <span class="completed-badge" aria-label="${t('completedLabel')}">
        ${t('completedBadge')}
      </span>
    `);
  }

  return `
    <button
      class="card"
      data-id="${activity.id}"
      style="--tint:${tint};--tone:${tone}"
      aria-label="${t('viewActivity', { title: activity.title })}"
    >
      <div class="card-top">
        <span class="card-icon">${icon(activity.category)}</span>
        <span class="card-category">${I18N.category(activity.category)}</span>
      </div>
      ${badges.length ? `<span class="card-badges">${badges.join('')}</span>` : ''}
      <span class="card-age">
        ${t('age', { age: activity.age })} · ${t(activity.place === 'inside' ? 'home' : 'outside')}
      </span>
      <h3>${activity.title}</h3>
      <p>${activity.desc}</p>
      <div class="card-bottom">
        <span>◷ ${activity.time} min</span>
        <span class="cost">${costLabel(activity)}</span>
      </div>
    </button>
  `;
}

function render() {
  const list = filtered();
  $('count').textContent = I18N.count(
    state.completedOnly ? 'completed' : state.favoritesOnly ? 'favorites' : 'ideas',
    list.length,
  );
  $('favorites-count').textContent = favorites.size;
  $('completed-count').textContent = completed.size;
  $('seasonal-count').textContent = seasonalIds.size;
  $('results').innerHTML = list.map(renderActivityCard).join('');
  $('empty').hidden = list.length > 0;
  $('empty-message').textContent = state.query
    ? t('emptyQuery', { query: state.query })
    : state.completedOnly && !completed.size
      ? t('emptyCompleted')
      : state.favoritesOnly && !favorites.size
        ? t('emptyFavorites')
        : t('empty');
  $('spotlight').hidden =
    Boolean(state.query) ||
    state.favoritesOnly ||
    state.completedOnly ||
    state.seasonalOnly ||
    !list.some((a) => a.id === 'ville');
  document.querySelectorAll('.surprise').forEach((b) => {
    b.disabled = !list.length;
    b.title = t(list.length ? 'surpriseHint' : 'surpriseDisabled');
  });
}
function reset() {
  Object.assign(state, {
    age: 'all',
    duration: '999',
    budget: '999',
    weather: 'all',
    place: 'all',
    category: 'all',
    favoritesOnly: false,
    completedOnly: false,
    seasonalOnly: false,
    query: '',
  });
  ['age', 'duration', 'budget', 'weather'].forEach((k) => ($(k).value = state[k]));
  $('search').value = '';
  updateButtons();
  render();
}
function updateButtons() {
  document
    .querySelectorAll('[data-place]')
    .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.place === state.place)));
  document
    .querySelectorAll('[data-category]')
    .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.category === state.category)));
  $('favorites-filter').setAttribute('aria-pressed', String(state.favoritesOnly));
  $('completed-filter').setAttribute('aria-pressed', String(state.completedOnly));
  $('seasonal-filter').setAttribute('aria-pressed', String(state.seasonalOnly));
}
function toggleFavorite(id) {
  if (favorites.has(id)) favorites.delete(id);
  else favorites.add(id);
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
  } catch {}
  render();
  if ($('detail').open) openActivity(id);
  return { id, favorite: favorites.has(id) };
}
function toggleCompleted(id) {
  if (completed.has(id)) completed.delete(id);
  else completed.add(id);
  try {
    localStorage.setItem(COMPLETED_KEY, JSON.stringify([...completed]));
  } catch {}
  render();
  if ($('detail').open) openActivity(id);
  return { id, completed: completed.has(id) };
}
function activityUrl(id) {
  const url = new URL(location.href);
  url.hash = `activity=${encodeURIComponent(id)}`;
  return url.href;
}
async function shareActivity(id) {
  const a = activities.find((activity) => activity.id === id);
  if (!a) throw new Error(t('unknownActivity'));
  const data = {
    title: `${a.title} — Les petits moments`,
    text: t('shareText', { title: a.title }),
    url: activityUrl(id),
  };
  if (navigator.share) {
    try {
      await navigator.share(data);
      return { id, shared: true };
    } catch (error) {
      if (error?.name === 'AbortError') return { id, shared: false };
    }
  }
  try {
    await navigator.clipboard.writeText(data.url);
    const status = $('share-status');
    if (status) {
      status.textContent = t('copied');
      setTimeout(() => {
        status.textContent = '';
      }, 2200);
    }
    return { id, copied: true };
  } catch {
    window.prompt(t('copyPrompt'), data.url);
    return { id, copied: false };
  }
}
function openSharedActivity() {
  const match = location.hash.match(/^#activity=([^&]+)$/);
  if (!match) return;
  let id;
  try {
    id = decodeURIComponent(match[1]);
  } catch {
    return;
  }
  if (activities.some((a) => a.id === id)) openActivity(id);
}
let previousId = null;
function openActivity(id) {
  const a = activities.find((a) => a.id === id);
  if (!a) throw new Error(t('unknownActivity'));
  previousId = id;
  const [tint, tone] = palettes[a.category];
  const isFavorite = favorites.has(a.id),
    isCompleted = completed.has(a.id);
  $('detail-content').innerHTML = `
    <div class="detail-head" style="--tint:${tint};--tone:${tone}">
      <div class="print-brand">
        <span aria-hidden="true">✳</span>
        <strong>les petits moments.</strong>
        <small>${t('printTagline')}</small>
      </div>
      <span class="card-category">
        ${I18N.category(a.category)} · ${t(a.place === 'inside' ? 'home' : 'outside')}
      </span>
      <h2 id="detail-title">${a.title}</h2>
      <p>${a.desc}</p>
      <div class="detail-meta">
        <span>${t('age', { age: a.age })}</span>
        <span>${t('minutes', { time: a.time })}</span>
        <span>${t('familyCost', { cost: costLabel(a) })}</span>
      </div>
      <div class="detail-actions">
        <button class="completed-toggle" data-completed-id="${a.id}" aria-pressed="${isCompleted}">
          ${t(isCompleted ? 'completedOn' : 'completedOff')}
        </button>
        <button class="favorite-toggle" data-favorite-id="${a.id}" aria-pressed="${isFavorite}">
          ${t(isFavorite ? 'favoriteOn' : 'favoriteOff')}
        </button>
        <button class="share-activity" data-share-id="${a.id}">${t('share')}</button>
        <button class="print-activity" data-print-activity>${t('print')}</button>
        <span id="share-status" class="share-status" role="status" aria-live="polite"></span>
      </div>
    </div>
    <div class="detail-body">
      <h3>${t('materials')}</h3>
      <ul class="materials">${a.materials.map((material) => `<li>${material}</li>`).join('')}</ul>
      <h3>${t('steps')}</h3>
      <ol class="steps">${a.steps.map((step) => `<li>${step}</li>`).join('')}</ol>
      <div class="extra">
        <strong>${t('tip')}</strong>
        <p>${a.tip}</p>
      </div>
      <p class="estimate">
        ${t('estimate')}
        <a class="safety-link" href="${I18N.url('terms')}#precautions">${t('safety')}</a>.
      </p>
    </div>
  `;
  if (!$('detail').open) $('detail').showModal();
  $('detail').scrollTop = 0;
  document.body.style.overflow = 'hidden';
  return {
    id: a.id,
    title: a.title,
    favorite: isFavorite,
    completed: isCompleted,
    url: activityUrl(a.id),
  };
}
['age', 'duration', 'budget', 'weather'].forEach((k) =>
  $(k).addEventListener('change', (e) => {
    state[k] = e.target.value;
    render();
  }),
);
document.querySelectorAll('[data-place]').forEach((b) =>
  b.addEventListener('click', () => {
    state.place = b.dataset.place;
    updateButtons();
    render();
  }),
);
document.querySelectorAll('[data-category]').forEach((b) =>
  b.addEventListener('click', () => {
    state.category = b.dataset.category;
    updateButtons();
    render();
  }),
);
$('favorites-filter').addEventListener('click', () => {
  state.favoritesOnly = !state.favoritesOnly;
  updateButtons();
  render();
});
$('completed-filter').addEventListener('click', () => {
  state.completedOnly = !state.completedOnly;
  updateButtons();
  render();
});
$('seasonal-filter').addEventListener('click', () => {
  state.seasonalOnly = !state.seasonalOnly;
  updateButtons();
  render();
});
$('search').addEventListener('input', (e) => {
  state.query = e.target.value.trim();
  render();
});
$('results').addEventListener('click', (e) => {
  const card = e.target.closest('[data-id]');
  if (card) openActivity(card.dataset.id);
});
$('detail-content').addEventListener('click', (e) => {
  const c = e.target.closest('[data-completed-id]');
  if (c) toggleCompleted(c.dataset.completedId);
  const f = e.target.closest('[data-favorite-id]');
  if (f) toggleFavorite(f.dataset.favoriteId);
  const s = e.target.closest('[data-share-id]');
  if (s) shareActivity(s.dataset.shareId);
  if (e.target.closest('[data-print-activity]')) window.print();
});
$('reset').addEventListener('click', reset);
$('empty-reset').addEventListener('click', reset);
$('featured-open').addEventListener('click', () => openActivity('ville'));
document.querySelectorAll('.surprise').forEach((b) =>
  b.addEventListener('click', () => {
    let list = filtered();
    if (list.length > 1) list = list.filter((a) => a.id !== previousId);
    if (list.length) openActivity(list[Math.floor(Math.random() * list.length)].id);
  }),
);
$('close-detail').addEventListener('click', () => $('detail').close());
$('detail').addEventListener('click', (e) => {
  if (e.target === $('detail')) {
    const r = $('detail').getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
      $('detail').close();
  }
});
$('detail').addEventListener('close', () => {
  document.body.style.overflow = '';
});
render();
openSharedActivity();
window.addEventListener('hashchange', openSharedActivity);
if (!window.__DEV__ && 'serviceWorker' in navigator)
  window.addEventListener('load', () =>
    navigator.serviceWorker.register(I18N.workerUrl).catch(() => {}),
  );
let installPrompt = null;
const installButton = $('install-app');
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installPrompt = event;
  installButton.hidden = false;
});
installButton.addEventListener('click', async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  installButton.hidden = true;
});
window.addEventListener('appinstalled', () => {
  installPrompt = null;
  installButton.hidden = true;
});
if (document.modelContext?.registerTool) {
  const lifecycle = new AbortController(),
    options = { signal: lifecycle.signal };
  const register = (tool) => {
    try {
      Promise.resolve(document.modelContext.registerTool(tool, options)).catch(() => {});
    } catch {}
  };
  register({
    name: 'filter_family_activities',
    title: t('filterTool'),
    description: t('filterDescription'),
    inputSchema: {
      type: 'object',
      properties: {
        age: { type: 'string', enum: ['all', '3', '6', '9', '13'] },
        duration: { type: 'string', enum: ['999', '20', '45', '60'] },
        budget: { type: 'string', enum: ['999', '0', '5', '15'] },
        weather: { type: 'string', enum: ['all', 'sun', 'rain'] },
        place: { type: 'string', enum: ['all', 'inside', 'outside'] },
        category: {
          type: 'string',
          enum: ['all', 'Créer', 'Explorer', 'Jouer', 'Cuisiner', 'Découvrir'],
        },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) {
      if (!input || typeof input !== 'object' || Array.isArray(input))
        throw new Error(t('invalidFilters'));
      const allowed = {
        age: ['all', '3', '6', '9', '13'],
        duration: ['999', '20', '45', '60'],
        budget: ['999', '0', '5', '15'],
        weather: ['all', 'sun', 'rain'],
        place: ['all', 'inside', 'outside'],
        category: ['all', 'Créer', 'Explorer', 'Jouer', 'Cuisiner', 'Découvrir'],
      };
      for (const [key, value] of Object.entries(input))
        if (!allowed[key]?.includes(value)) throw new Error(t('invalidFilter', { key }));
      Object.assign(state, input);
      ['age', 'duration', 'budget', 'weather'].forEach((key) => ($(key).value = state[key]));
      updateButtons();
      render();
      return filtered().map((a) => ({ id: a.id, title: a.title, minutes: a.time, budget: a.cost }));
    },
  });
  register({
    name: 'open_activity_details',
    title: t('openTool'),
    description: t('openDescription'),
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) {
      if (!input || typeof input.id !== 'string' || Object.keys(input).some((key) => key !== 'id'))
        throw new Error(t('invalidId'));
      return openActivity(input.id);
    },
  });
  window.addEventListener('pagehide', () => lifecycle.abort(), { once: true });
}
