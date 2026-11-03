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
const halloweenIds = new Set([
  'lanternes-fantomes',
  'potion-couleurs',
  'chasse-fantomes',
  'escape-citrouille',
  'pommes-monstres',
]);
const state = {
  age: 'all',
  duration: '999',
  budget: '999',
  weather: 'all',
  place: 'all',
  category: 'all',
  seasonalOnly: false,
  halloweenOnly: false,
  query: '',
  sort: 'recommended',
  sharedSelection: null,
};
const SHAREABLE_DEFAULTS = {
  age: 'all',
  duration: '999',
  budget: '999',
  weather: 'all',
  place: 'all',
  category: 'all',
  query: '',
  sort: 'recommended',
  seasonalOnly: false,
  halloweenOnly: false,
};
const SHAREABLE_PARAMS = [
  'selection',
  'age',
  'time',
  'budget',
  'weather',
  'place',
  'category',
  'sort',
  'q',
  'autumn',
  'halloween',
];
const FAVORITES_KEY = 'les-petits-moments-favorites';
const COMPLETED_KEY = 'les-petits-moments-completed';
let favorites = new Set();
let completed = new Set();
let suggestedIds = null;
let momentsView = 'favorites';
const restoreSuggestions = location.hash === '#ideas';
const timerState = {
  activityId: null,
  duration: 0,
  remaining: 0,
  endAt: 0,
  running: false,
  interval: null,
  audioContext: null,
};
const guidedState = { activityId: null, step: 0 };
let guidedWakeLock = null;
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
try {
  const ids = new URL(location.href).searchParams
    .get('selection')
    ?.split(',')
    .filter((id) => activities.some((activity) => activity.id === id));
  if (ids?.length) state.sharedSelection = new Set(ids.slice(0, 100));
} catch {}
try {
  const params = new URL(location.href).searchParams;
  const allowed = {
    age: ['all', '3', '6', '9', '13'],
    duration: ['999', '20', '45', '60'],
    budget: ['999', '0', '5', '15'],
    weather: ['all', 'sun', 'rain'],
    place: ['all', 'inside', 'outside'],
    category: ['all', 'Créer', 'Explorer', 'Jouer', 'Cuisiner', 'Découvrir'],
    sort: ['recommended', 'untried', 'time', 'cost', 'age'],
  };
  const values = {
    age: params.get('age'),
    duration: params.get('time'),
    budget: params.get('budget'),
    weather: params.get('weather'),
    place: params.get('place'),
    category: params.get('category'),
    sort: params.get('sort'),
  };
  for (const [key, value] of Object.entries(values)) {
    if (allowed[key].includes(value)) state[key] = value;
  }
  state.query = (params.get('q') || '').trim().slice(0, 120);
  state.seasonalOnly = params.get('autumn') === '1';
  state.halloweenOnly = params.get('halloween') === '1';
} catch {}
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
  const list = activities.filter(
    (a) =>
      (state.age === 'all' || a.age <= Number(state.age)) &&
      a.time <= Number(state.duration) &&
      a.cost <= Number(state.budget) &&
      (state.weather !== 'rain' || a.place === 'inside') &&
      (state.place === 'all' || state.place === a.place) &&
      (state.category === 'all' || state.category === a.category) &&
      (!state.seasonalOnly || seasonalIds.has(a.id)) &&
      (!state.halloweenOnly || halloweenIds.has(a.id)) &&
      (!state.sharedSelection || state.sharedSelection.has(a.id)) &&
      matchesQuery(a),
  );
  if (state.sort === 'untried') {
    list.sort((a, b) => Number(completed.has(a.id)) - Number(completed.has(b.id)));
  } else if (state.sort === 'time') {
    list.sort((a, b) => a.time - b.time || a.cost - b.cost);
  } else if (state.sort === 'cost') {
    list.sort((a, b) => a.cost - b.cost || a.time - b.time);
  } else if (state.sort === 'age') {
    list.sort((a, b) => a.age - b.age || a.time - b.time);
  }
  return list;
}
function renderActivityCard(activity) {
  const [tint, tone] = palettes[activity.category];
  const badges = [];
  if (activity.ready) {
    badges.push(`<span class="ready-badge" aria-hidden="true">${t('readyBadge')}</span>`);
  }
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
    <a href="${activityUrl(activity.id)}"
      class="card"
      data-id="${activity.id}"
      style="--tint:${tint};--tone:${tone}"
      aria-label="${t(activity.ready ? 'viewReadyActivity' : 'viewActivity', { title: activity.title })}"
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
    </a>
  `;
}

function focusSection(id) {
  const target = $(id);
  target.focus({ preventScroll: true });
  target.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    block: 'start',
  });
}

function invalidateSuggestions() {
  suggestedIds = null;
  $('suggestions').hidden = true;
}

function renderSuggestions() {
  $('suggestions').hidden = suggestedIds === null;
  if (suggestedIds === null) return;
  const matches = filtered();
  const selection = suggestedIds
    .map((id) => matches.find((activity) => activity.id === id))
    .filter(Boolean);
  const count = selection.length;
  $('suggestions-title').textContent = t(
    count === 3
      ? 'suggestionsThree'
      : count === 2
        ? 'suggestionsTwo'
        : count === 1
          ? 'suggestionsOne'
          : 'suggestionsNone',
  );
  $('suggestions-summary').textContent = count
    ? t('suggestionsSummary')
    : t('suggestionsNoneSummary');
  $('suggestions-list').innerHTML = selection.map(renderActivityCard).join('');
  $('suggestions-empty').hidden = count > 0;
  $('suggestions-actions').hidden = count === 0;
  $('suggestions-refresh').hidden = matches.length <= 3;
  $('show-matches').hidden = matches.length <= 3;
  $('matching-count').textContent = `(${matches.length})`;
}

function suggestActivities(refresh = false) {
  // The main journey only uses the criteria actually shown in its form.
  Object.assign(state, {
    category: 'all',
    query: '',
    seasonalOnly: false,
    halloweenOnly: false,
    sharedSelection: null,
    sort: 'recommended',
  });
  $('search').value = '';
  $('sort').value = state.sort;
  suggestedIds = window.SITE_HOME_SELECTION.select(
    filtered(),
    refresh ? suggestedIds || [] : [],
  ).map((activity) => activity.id);
  $('catalogue').open = false;
  updateButtons();
  render();
  focusSection('suggestions-title');
}

function openCatalogue() {
  $('catalogue').open = true;
  render();
  focusSection('catalogue-title');
}

function renderMoments() {
  const list =
    momentsView === 'recent'
      ? recentActivities()
      : activities.filter((activity) =>
          (momentsView === 'favorites' ? favorites : completed).has(activity.id),
        );
  $('favorites-filter').setAttribute('aria-pressed', String(momentsView === 'favorites'));
  $('completed-filter').setAttribute('aria-pressed', String(momentsView === 'completed'));
  $('recent-filter').setAttribute('aria-pressed', String(momentsView === 'recent'));
  $('favorites-prep').hidden = momentsView !== 'favorites' || !favorites.size;
  $('moments-list').hidden = momentsView === 'recent';
  $('moments-list').innerHTML =
    momentsView === 'recent' ? '' : list.map(renderActivityCard).join('');
  $('moments-empty').hidden = list.length > 0;
  $('moments-empty').textContent = t(
    momentsView === 'recent'
      ? 'emptyRecent'
      : momentsView === 'favorites'
        ? 'emptyFavorites'
        : 'emptyCompleted',
  );
  renderRecentlyViewed();
}

function openMoments() {
  renderMoments();
  $('moments-dialog').showModal();
  document.body.style.overflow = 'hidden';
}

function syncDialogScroll() {
  document.body.style.overflow = document.querySelector('dialog[open]') ? 'hidden' : '';
}

function activeFilterItems() {
  const items = [];
  for (const key of ['age', 'duration', 'budget', 'weather']) {
    if (state[key] !== { age: 'all', duration: '999', budget: '999', weather: 'all' }[key]) {
      items.push({ key, label: $(key).selectedOptions[0].textContent.trim() });
    }
  }
  if (state.place !== 'all') {
    items.push({
      key: 'place',
      label: document.querySelector(`[data-place="${state.place}"]`).textContent.trim(),
    });
  }
  if (state.category !== 'all') {
    items.push({
      key: 'category',
      label: document.querySelector(`[data-category="${state.category}"]`).textContent.trim(),
    });
  }
  if (state.query) items.push({ key: 'query', label: t('queryFilter', { query: state.query }) });
  if (state.seasonalOnly) items.push({ key: 'seasonalOnly', label: t('activeAutumn') });
  if (state.halloweenOnly) items.push({ key: 'halloweenOnly', label: t('activeHalloween') });
  if (state.sharedSelection)
    items.push({
      key: 'sharedSelection',
      label: t('activeSharedSelection', { n: state.sharedSelection.size }),
    });
  return items;
}

function renderActiveFilters() {
  const items = activeFilterItems();
  $('active-filters').hidden = !items.length;
  $('active-filter-list').replaceChildren(
    ...items.map(({ key, label }) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.clearFilter = key;
      button.textContent = `${label} ×`;
      button.setAttribute('aria-label', t('removeFilter', { label }));
      return button;
    }),
  );
}

function formatSharedTime(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (I18N.lang === 'en') return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
  return remainder ? `${hours} h ${remainder}` : `${hours} h`;
}

function renderProgress() {
  const completedActivities = activities.filter((activity) => completed.has(activity.id));
  const minutes = completedActivities.reduce((total, activity) => total + activity.time, 0);
  const categories = new Set(completedActivities.map((activity) => activity.category));
  $('progress-activities').textContent = completedActivities.length;
  $('progress-time').textContent = formatSharedTime(minutes);
  $('progress-categories').textContent = categories.size;
  $('progress-message').textContent = t(
    completedActivities.length ? 'progressStarted' : 'progressEmpty',
  );
}

function recentActivities() {
  return window.SITE_ACTIVITY_ACTIONS.recent
    .read()
    .map((id) => activities.find((activity) => activity.id === id))
    .filter(Boolean);
}

function renderRecentlyViewed() {
  const recent = recentActivities();
  $('recently-viewed').hidden = momentsView !== 'recent' || !recent.length;
  $('recent-list').innerHTML = recent
    .map((activity) => {
      const [tint, tone] = palettes[activity.category];
      return `<a class="recent-card" data-recent-id="${activity.id}" href="${activityUrl(activity.id)}"
        style="--tint:${tint};--tone:${tone}"
        aria-label="${t('viewActivity', { title: activity.title })}">
        <span class="recent-card-icon">${icon(activity.category)}</span>
        <span class="recent-card-copy">
          <strong>${activity.title}</strong>
          <small>${t('minutes', { time: activity.time })} · ${costLabel(activity)}</small>
        </span>
      </a>`;
    })
    .join('');
}

function shareableSearchParams() {
  const params = new URLSearchParams();
  if (state.sharedSelection) params.set('selection', [...state.sharedSelection].join(','));
  if (state.age !== SHAREABLE_DEFAULTS.age) params.set('age', state.age);
  if (state.duration !== SHAREABLE_DEFAULTS.duration) params.set('time', state.duration);
  if (state.budget !== SHAREABLE_DEFAULTS.budget) params.set('budget', state.budget);
  if (state.weather !== SHAREABLE_DEFAULTS.weather) params.set('weather', state.weather);
  if (state.place !== SHAREABLE_DEFAULTS.place) params.set('place', state.place);
  if (state.category !== SHAREABLE_DEFAULTS.category) params.set('category', state.category);
  if (state.sort !== SHAREABLE_DEFAULTS.sort) params.set('sort', state.sort);
  if (state.query) params.set('q', state.query);
  if (state.seasonalOnly) params.set('autumn', '1');
  if (state.halloweenOnly) params.set('halloween', '1');
  return params;
}

function syncShareableUrl() {
  const params = shareableSearchParams();
  const current = new URL(location.href);
  for (const key of SHAREABLE_PARAMS) current.searchParams.delete(key);
  for (const [key, value] of params) current.searchParams.set(key, value);
  if (suggestedIds !== null && !$('catalogue').open) current.hash = 'ideas';
  else if (current.hash === '#ideas') current.hash = '';
  history.replaceState(null, '', current);
  document.querySelectorAll('[data-language]').forEach((link) => {
    const target = new URL(link.href);
    target.search = params.toString();
    target.hash = current.hash;
    link.href = target;
  });
}

function shareableSearchUrl() {
  const url = new URL(location.href);
  url.search = shareableSearchParams().toString();
  url.hash = '';
  return url.toString();
}

function hasShareableSearch() {
  return [...shareableSearchParams().keys()].length > 0;
}

async function shareCurrentSearch() {
  if (!hasShareableSearch()) return;
  const data = {
    title: t('sharedSearchTitle'),
    text: t('sharedSearchText', { n: filtered().length }),
    url: shareableSearchUrl(),
  };
  try {
    if (navigator.share) {
      await navigator.share(data);
      $('share-search-status').textContent = t('sharedSearchSent');
    } else {
      await copyText(data.url);
      $('share-search-status').textContent = t('sharedSearchCopied');
    }
  } catch (error) {
    if (error?.name !== 'AbortError')
      $('share-search-status').textContent = t('sharedSearchFailed');
  }
}

function render() {
  const list = filtered();
  syncShareableUrl();
  $('share-search-status').textContent = '';
  $('count').textContent = I18N.count(state.halloweenOnly ? 'halloween' : 'ideas', list.length);
  $('favorites-count').textContent = favorites.size;
  $('shopping-list-count').textContent = favorites.size;
  $('completed-count').textContent = completed.size;
  $('seasonal-count').textContent = seasonalIds.size;
  $('halloween-count').textContent = halloweenIds.size;
  $('results').innerHTML = list.map(renderActivityCard).join('');
  renderActiveFilters();
  renderProgress();
  renderMoments();
  renderSuggestions();
  $('empty').hidden = list.length > 0;
  $('empty-message').textContent = state.query
    ? t('emptyQuery', { query: state.query })
    : t('empty');
  $('share-search').disabled = !hasShareableSearch();
  $('share-search').title = t(hasShareableSearch() ? 'shareSearchHint' : 'shareSearchDisabled');
}

function clearFilter(key) {
  const defaults = {
    age: 'all',
    duration: '999',
    budget: '999',
    weather: 'all',
    place: 'all',
    category: 'all',
    query: '',
    seasonalOnly: false,
    halloweenOnly: false,
    sharedSelection: null,
  };
  if (!(key in defaults)) return;
  invalidateSuggestions();
  state[key] = defaults[key];
  if (key === 'sharedSelection') updateSharedSelectionLinks();
  if (['age', 'duration', 'budget', 'weather'].includes(key)) $(key).value = state[key];
  if (key === 'query') $('search').value = '';
  updateButtons();
  render();
}
function reset() {
  invalidateSuggestions();
  Object.assign(state, {
    age: 'all',
    duration: '999',
    budget: '999',
    weather: 'all',
    place: 'all',
    category: 'all',
    seasonalOnly: false,
    halloweenOnly: false,
    query: '',
    sort: 'recommended',
    sharedSelection: null,
  });
  updateSharedSelectionLinks();
  ['age', 'duration', 'budget', 'weather'].forEach((k) => ($(k).value = state[k]));
  $('search').value = '';
  $('sort').value = state.sort;
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
  $('seasonal-filter').setAttribute('aria-pressed', String(state.seasonalOnly));
  $('halloween-filter').setAttribute('aria-pressed', String(state.halloweenOnly));
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
  return I18N.activityUrl(id);
}
function shareActivity(id) {
  const activity = activities.find((item) => item.id === id);
  if (!activity) throw new Error(t('unknownActivity'));
  return window.SITE_ACTIVITY_ACTIONS.share(activity, activityUrl(id));
}
function favoriteActivities() {
  return activities.filter((activity) => favorites.has(activity.id));
}
function updateSharedSelectionLinks() {
  syncShareableUrl();
}
async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) throw new Error('Copy failed');
}
function shoppingListText() {
  return favoriteActivities()
    .map(
      (activity) =>
        `${activity.title}\n${activity.materials.map((material) => `- ${material}`).join('\n')}`,
    )
    .join('\n\n');
}
async function copyShoppingList() {
  const text = shoppingListText();
  try {
    await copyText(text);
    $('shopping-list-status').textContent = t('shoppingListCopied');
  } catch {
    $('shopping-list-status').textContent = t('shoppingListCopyFailed');
  }
}
async function shareFavoriteSelection() {
  const selected = favoriteActivities();
  if (!selected.length) return;
  const url = new URL(location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('selection', selected.map((activity) => activity.id).join(','));
  const data = {
    title: t('sharedSelectionTitle'),
    text: t('sharedSelectionText', { n: selected.length }),
    url: url.toString(),
  };
  try {
    if (navigator.share) {
      await navigator.share(data);
      $('shopping-list-status').textContent = t('sharedSelectionSent');
    } else {
      await copyText(data.url);
      $('shopping-list-status').textContent = t('sharedSelectionCopied');
    }
  } catch (error) {
    if (error?.name !== 'AbortError')
      $('shopping-list-status').textContent = t('sharedSelectionFailed');
  }
}
function openShoppingList() {
  const selected = favoriteActivities();
  if (!selected.length) return;
  $('shopping-list-content').innerHTML = `
    <div class="shopping-list-head">
      <span class="eyebrow">${t('materials')}</span>
      <h2 id="shopping-list-title">${t('shoppingListTitle')}</h2>
      <p>${t('shoppingListIntro', { n: selected.length })}</p>
      <div class="shopping-list-actions">
        <button class="primary" data-copy-shopping-list>${t('shoppingListCopy')}</button>
        <button class="shopping-list-share" data-share-shopping-list>${t('shoppingListShare')}</button>
        <span id="shopping-list-status" role="status" aria-live="polite"></span>
      </div>
    </div>
    <div class="shopping-list-groups">
      ${selected
        .map(
          (activity) => `
            <section>
              <h3>${activity.title}</h3>
              <ul>
                ${activity.materials
                  .map(
                    (material, index) => `
                      <li>
                        <label>
                          <input type="checkbox" />
                          <span>${material}</span>
                        </label>
                      </li>`,
                  )
                  .join('')}
              </ul>
            </section>`,
        )
        .join('')}
    </div>
  `;
  $('shopping-list-dialog').showModal();
  $('shopping-list-dialog').scrollTop = 0;
  document.body.style.overflow = 'hidden';
}
function localDateValue(date = new Date()) {
  return window.SITE_ACTIVITY_ACTIONS.localDate(date);
}
function addToCalendar(id) {
  const activity = activities.find((item) => item.id === id);
  if (!activity) throw new Error(t('unknownActivity'));
  return window.SITE_ACTIVITY_ACTIONS.calendar(activity, activityUrl(id));
}
function timerOptions(minutes) {
  return [...new Set([5, 10, 15, 20, 30, 45, 60, minutes])]
    .filter((value) => Number.isInteger(value) && value > 0)
    .sort((a, b) => a - b)
    .map(
      (value) =>
        `<option value="${value}" ${value === minutes ? 'selected' : ''}>${t('timerMinutes', { time: value })}</option>`,
    )
    .join('');
}
function formatTimer(seconds) {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  return `${String(minutes).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}
function prepareTimerSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    timerState.audioContext ||= new AudioContext();
    timerState.audioContext.resume();
  } catch {}
}
function playTimerSound() {
  try {
    const context = timerState.audioContext;
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(660, context.currentTime);
    oscillator.frequency.setValueAtTime(880, context.currentTime + 0.25);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.7);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.72);
  } catch {}
}
function stopTimerInterval() {
  if (timerState.interval) clearInterval(timerState.interval);
  timerState.interval = null;
}
function renderTimer() {
  const activity = activities.find((item) => item.id === timerState.activityId);
  const dock = $('activity-timer');
  dock.hidden = !activity;
  if (!activity) return;
  const done = timerState.remaining === 0;
  dock.classList.toggle('is-running', timerState.running);
  dock.classList.toggle('is-done', done);
  $('timer-activity-title').textContent = activity.title;
  $('timer-display').textContent = formatTimer(timerState.remaining);
  const inlineDisplay = $('timer-inline-display');
  const sameOpenActivity = $('detail-content').dataset.activityId === activity.id;
  if (inlineDisplay && sameOpenActivity)
    inlineDisplay.textContent = formatTimer(timerState.remaining);
  const inlineStatus = $('timer-panel-status');
  if (inlineStatus && sameOpenActivity)
    inlineStatus.textContent = done ? t('timerDone') : t('timerStarted');
  $('timer-toggle').textContent = t(
    done ? 'timerRestart' : timerState.running ? 'timerPause' : 'timerResume',
  );
  $('timer-toggle').setAttribute('aria-label', $('timer-toggle').textContent);
  $('timer-reset').textContent = t('timerReset');
  $('timer-status').textContent = done ? t('timerDone') : '';
}
function finishTimer() {
  timerState.remaining = 0;
  timerState.running = false;
  stopTimerInterval();
  playTimerSound();
  navigator.vibrate?.([180, 100, 180]);
  renderTimer();
}
function tickTimer() {
  if (!timerState.running) return;
  timerState.remaining = Math.max(0, Math.ceil((timerState.endAt - Date.now()) / 1000));
  if (!timerState.remaining) finishTimer();
  else renderTimer();
}
function runTimer() {
  timerState.running = true;
  timerState.endAt = Date.now() + timerState.remaining * 1000;
  stopTimerInterval();
  timerState.interval = setInterval(tickTimer, 250);
  renderTimer();
}
function startActivityTimer(id, minutes) {
  const activity = activities.find((item) => item.id === id);
  if (!activity || !Number.isInteger(minutes) || minutes < 1 || minutes > 180) return;
  prepareTimerSound();
  timerState.activityId = id;
  timerState.duration = minutes * 60;
  timerState.remaining = timerState.duration;
  runTimer();
}
function toggleTimer() {
  if (!timerState.activityId) return;
  if (timerState.running) {
    tickTimer();
    timerState.running = false;
    stopTimerInterval();
    renderTimer();
    return;
  }
  if (!timerState.remaining) timerState.remaining = timerState.duration;
  prepareTimerSound();
  runTimer();
}
function resetTimer() {
  if (!timerState.activityId) return;
  stopTimerInterval();
  timerState.running = false;
  timerState.remaining = timerState.duration;
  renderTimer();
}
function closeTimer() {
  stopTimerInterval();
  Object.assign(timerState, {
    activityId: null,
    duration: 0,
    remaining: 0,
    endAt: 0,
    running: false,
  });
  renderTimer();
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
const activityChecklists = new Map();

function updateActivityProgress() {
  const progress = $('activity-progress');
  if (!progress) return;
  const inputs = [...$('detail-content').querySelectorAll('[data-check-item="steps"]')],
    done = inputs.filter((input) => input.checked).length,
    total = inputs.length,
    complete = total > 0 && done === total;
  progress.setAttribute('aria-valuenow', String(done));
  progress.classList.toggle('is-complete', complete);
  const label = complete ? t('stepsComplete') : t('stepsProgress', { done, total });
  progress.setAttribute('aria-valuetext', label);
  $('activity-progress-label').textContent = label;
  $('activity-progress-bar').style.width = `${total ? (done / total) * 100 : 0}%`;
}

async function acquireGuidedWakeLock() {
  if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
  try {
    const lock = await navigator.wakeLock.request('screen');
    if (!$('guided-dialog').open) {
      await lock.release();
      return;
    }
    guidedWakeLock = lock;
    lock.addEventListener('release', () => {
      if (guidedWakeLock === lock) guidedWakeLock = null;
    });
  } catch {}
}

async function releaseGuidedWakeLock() {
  try {
    await guidedWakeLock?.release();
  } catch {}
  guidedWakeLock = null;
}

function guidedActivity() {
  return activities.find((activity) => activity.id === guidedState.activityId);
}

function renderGuided() {
  const activity = guidedActivity();
  if (!activity) return;
  const checklist = activityChecklists.get(activity.id);
  guidedState.step = Math.max(0, Math.min(guidedState.step, activity.steps.length - 1));
  const current = guidedState.step;
  const stepDone = checklist.steps.has(current);
  const doneCount = checklist.steps.size;
  const complete = doneCount === activity.steps.length;
  const [tint, tone] = palettes[activity.category];
  $('guided-content').innerHTML = `
    <div class="guided-shell" style="--tint:${tint};--tone:${tone}">
      <header class="guided-head">
        <p class="eyebrow">${t('guidedLabel')}</p>
        <h2 id="guided-title">${activity.title}</h2>
        <div class="guided-progress" role="progressbar" aria-valuemin="0"
          aria-valuemax="${activity.steps.length}" aria-valuenow="${doneCount}">
          <span>${t('stepsProgress', { done: doneCount, total: activity.steps.length })}</span>
          <span class="guided-progress-track" aria-hidden="true">
            <span style="width:${(doneCount / activity.steps.length) * 100}%"></span>
          </span>
        </div>
      </header>
      ${complete ? `<p class="guided-complete" role="status">${t('guidedComplete')}</p>` : ''}
      <section class="guided-step ${stepDone ? 'is-done' : ''}">
        <span class="guided-step-count">${t('guidedStep', { current: current + 1, total: activity.steps.length })}</span>
        <p>${activity.steps[current]}</p>
        <button aria-pressed="${stepDone}" data-guided-mark type="button">
          ${t(stepDone ? 'guidedMarked' : 'guidedMark')}
        </button>
      </section>
      <nav aria-label="${t('guidedLabel')}" class="guided-navigation">
        <button data-guided-previous type="button" ${current === 0 ? 'disabled' : ''}>
          ${t('guidedPrevious')}
        </button>
        <button data-guided-next type="button" ${current === activity.steps.length - 1 ? 'disabled' : ''}>
          ${t('guidedNext')}
        </button>
      </nav>
      <details class="guided-reference">
        <summary>${t('guidedMaterials')}</summary>
        <ul>${activity.materials.map((material) => `<li>${material}</li>`).join('')}</ul>
      </details>
      <details class="guided-reference">
        <summary>${t(activity.ready ? 'readyReference' : 'tip')}</summary>
        ${
          activity.ready
            ? window.SITE_READY.before(activity, I18N.lang) +
              window.SITE_READY.after(activity, I18N.lang)
            : `<p>${activity.tip}</p>`
        }
      </details>
    </div>
  `;
}

function openGuided(id) {
  const activity = activities.find((item) => item.id === id);
  if (!activity) return;
  const checklist = activityChecklists.get(id) || { materials: new Set(), steps: new Set() };
  activityChecklists.set(id, checklist);
  const firstUnchecked = activity.steps.findIndex((_, index) => !checklist.steps.has(index));
  guidedState.activityId = id;
  guidedState.step = firstUnchecked < 0 ? activity.steps.length - 1 : firstUnchecked;
  renderGuided();
  $('guided-dialog').showModal();
  $('guided-dialog').scrollTop = 0;
  acquireGuidedWakeLock();
}

function syncGuidedStepToDetail(activityId, index, checked) {
  if ($('detail-content').dataset.activityId !== activityId) return;
  const input = $('detail-content').querySelector(
    `[data-check-item="steps"][data-check-index="${index}"]`,
  );
  if (input) input.checked = checked;
  updateActivityProgress();
}

function openActivity(id) {
  const a = activities.find((a) => a.id === id);
  if (!a) throw new Error(t('unknownActivity'));
  const activeMinutes = a.time - (a.ready?.prepMinutes || 0);
  window.SITE_ACTIVITY_ACTIONS.recent.record(a.id);
  renderMoments();
  const [tint, tone] = palettes[a.category];
  const isFavorite = favorites.has(a.id),
    isCompleted = completed.has(a.id);
  const checklist = activityChecklists.get(a.id) || {
    materials: new Set(),
    steps: new Set(),
  };
  activityChecklists.set(a.id, checklist);
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
      ${a.ready ? `<span class="ready-badge">${t('readyBadge')}</span>` : ''}
      <h2 id="detail-title">${a.title}</h2>
      <a class="full-activity-link" href="${activityUrl(a.id)}">${t('fullActivityPage')} ↗</a>
      <p>${a.desc}</p>
      <div class="detail-meta">
        <span>${t('age', { age: a.age })}</span>
        <span>${t(a.ready ? 'totalMinutes' : 'minutes', { time: a.time })}</span>
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
        <button class="plan-activity" data-plan-toggle aria-expanded="false">${t('plan')}</button>
        <button class="timer-activity" data-timer-toggle aria-expanded="false">${t('timer')}</button>
        <button class="guided-activity" data-guided-id="${a.id}">${t('guided')}</button>
        <button class="print-activity" data-print-activity>${t('print')}</button>
        <span id="share-status" class="share-status" role="status" aria-live="polite"></span>
      </div>
      <div class="plan-panel" data-plan-panel hidden>
        <strong>${t('planTitle')}</strong>
        <label>${t('planDate')}<input id="plan-date" type="date" min="${localDateValue()}" required /></label>
        <label>${t('planTime')}<input id="plan-time" type="time" value="14:00" /></label>
        <button class="plan-save" data-plan-save="${a.id}">${t('addCalendar')}</button>
        <span id="plan-status" role="status" aria-live="polite"></span>
      </div>
      <div class="timer-panel" data-timer-panel hidden>
        <strong>${t('timerTitle')}</strong>
        <label>${t('timerDuration')}
          <select id="timer-duration">${timerOptions(activeMinutes)}</select>
        </label>
        <output id="timer-inline-display">${formatTimer(activeMinutes * 60)}</output>
        ${a.ready ? `<p>${t('readyTimerNote')}</p>` : ''}
        <button class="timer-start" data-timer-start="${a.id}">${t('timerStart')}</button>
        <span id="timer-panel-status" role="status" aria-live="polite"></span>
      </div>
    </div>
    <div class="detail-body">
      ${window.SITE_READY.before(a, I18N.lang)}
      <p class="checklist-hint">${t('checklistHint')}</p>
      <h3>${t('materials')}</h3>
      <ul class="materials checklist-materials">
        ${a.materials
          .map(
            (material, index) => `
              <li>
                <label>
                  <input type="checkbox" data-check-item="materials" data-check-index="${index}"
                    ${checklist.materials.has(index) ? 'checked' : ''} />
                  <span>${material}</span>
                </label>
              </li>`,
          )
          .join('')}
      </ul>
      <h3>${t('steps')}</h3>
      <div class="activity-progress" id="activity-progress" role="progressbar"
        aria-valuemin="0" aria-valuemax="${a.steps.length}" aria-valuenow="0">
        <span id="activity-progress-label"></span>
        <span class="activity-progress-track" aria-hidden="true">
          <span id="activity-progress-bar"></span>
        </span>
      </div>
      <ol class="steps checklist-steps">
        ${a.steps
          .map(
            (step, index) => `
              <li>
                <label>
                  <input type="checkbox" data-check-item="steps" data-check-index="${index}"
                    ${checklist.steps.has(index) ? 'checked' : ''} />
                  <span>${step}</span>
                </label>
              </li>`,
          )
          .join('')}
      </ol>
      ${
        a.ready
          ? window.SITE_READY.after(a, I18N.lang)
          : `<div class="extra">
        <strong>${t('tip')}</strong>
        <p>${a.tip}</p>
      </div>`
      }
      <p class="estimate">
        ${t('estimate')}
        <a class="safety-link" href="${I18N.url('terms')}#precautions">${t('safety')}</a>.
      </p>
    </div>
  `;
  $('detail-content').dataset.activityId = a.id;
  updateActivityProgress();
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
    invalidateSuggestions();
    updateButtons();
    render();
  }),
);
document.querySelectorAll('[data-place]').forEach((b) =>
  b.addEventListener('click', () => {
    state.place = b.dataset.place;
    invalidateSuggestions();
    updateButtons();
    render();
  }),
);
document.querySelectorAll('[data-category]').forEach((b) =>
  b.addEventListener('click', () => {
    state.category = b.dataset.category;
    invalidateSuggestions();
    updateButtons();
    render();
  }),
);
$('favorites-filter').addEventListener('click', () => {
  momentsView = 'favorites';
  renderMoments();
});
$('completed-filter').addEventListener('click', () => {
  momentsView = 'completed';
  renderMoments();
});
$('recent-filter').addEventListener('click', () => {
  momentsView = 'recent';
  renderMoments();
});
$('seasonal-filter').addEventListener('click', () => {
  state.seasonalOnly = !state.seasonalOnly;
  invalidateSuggestions();
  updateButtons();
  render();
});
$('halloween-filter').addEventListener('click', () => {
  state.halloweenOnly = !state.halloweenOnly;
  invalidateSuggestions();
  updateButtons();
  render();
});
$('search').addEventListener('input', (e) => {
  state.query = e.target.value.trim();
  invalidateSuggestions();
  updateButtons();
  render();
});
$('sort').addEventListener('change', (e) => {
  state.sort = e.target.value;
  updateButtons();
  render();
});
$('active-filter-list').addEventListener('click', (e) => {
  const button = e.target.closest('[data-clear-filter]');
  if (button) clearFilter(button.dataset.clearFilter);
});
$('clear-active-filters').addEventListener('click', reset);
$('moment-form').addEventListener('submit', (event) => {
  event.preventDefault();
  suggestActivities();
});
$('suggestions-refresh').addEventListener('click', () => suggestActivities(true));
$('show-matches').addEventListener('click', openCatalogue);
$('catalogue').addEventListener('toggle', syncShareableUrl);
$('edit-criteria').addEventListener('click', () => focusSection('moment-title'));
$('moments-open').addEventListener('click', openMoments);
$('moments-close').addEventListener('click', () => $('moments-dialog').close());
$('shopping-list-open').addEventListener('click', () => {
  $('moments-dialog').close();
  openShoppingList();
});
$('share-search').addEventListener('click', shareCurrentSearch);
$('recent-clear').addEventListener('click', () => {
  window.SITE_ACTIVITY_ACTIONS.recent.clear();
  renderMoments();
});
$('recent-list').addEventListener('click', (event) => {
  const card = event.target.closest('[data-recent-id]');
  if (
    card &&
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  ) {
    event.preventDefault();
    $('moments-dialog').close();
    openActivity(card.dataset.recentId);
  }
});
function openCard(e) {
  const card = e.target.closest('[data-id]');
  if (card && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
    e.preventDefault();
    if ($('moments-dialog').open) $('moments-dialog').close();
    openActivity(card.dataset.id);
  }
}
for (const id of ['results', 'suggestions-list', 'moments-list'])
  $(id).addEventListener('click', openCard);
$('detail-content').addEventListener('click', (e) => {
  const c = e.target.closest('[data-completed-id]');
  if (c) toggleCompleted(c.dataset.completedId);
  const f = e.target.closest('[data-favorite-id]');
  if (f) toggleFavorite(f.dataset.favoriteId);
  const s = e.target.closest('[data-share-id]');
  if (s) shareActivity(s.dataset.shareId);
  const planToggle = e.target.closest('[data-plan-toggle]');
  if (planToggle) {
    const panel = $('detail-content').querySelector('[data-plan-panel]');
    panel.hidden = !panel.hidden;
    planToggle.setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) $('plan-date').focus();
  }
  const planSave = e.target.closest('[data-plan-save]');
  if (planSave) addToCalendar(planSave.dataset.planSave);
  const timerToggle = e.target.closest('[data-timer-toggle]');
  if (timerToggle) {
    const panel = $('detail-content').querySelector('[data-timer-panel]');
    panel.hidden = !panel.hidden;
    timerToggle.setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) $('timer-duration').focus();
  }
  const timerStart = e.target.closest('[data-timer-start]');
  if (timerStart) {
    startActivityTimer(timerStart.dataset.timerStart, Number($('timer-duration').value));
    timerStart.textContent = t('timerRestart');
    $('timer-panel-status').textContent = t('timerStarted');
  }
  const guided = e.target.closest('[data-guided-id]');
  if (guided) openGuided(guided.dataset.guidedId);
  if (e.target.closest('[data-print-activity]')) window.print();
});
$('detail-content').addEventListener('change', (e) => {
  const input = e.target.closest('[data-check-item]');
  if (!input) return;
  const id = $('detail-content').dataset.activityId,
    checklist = activityChecklists.get(id),
    group = checklist && checklist[input.dataset.checkItem],
    index = Number(input.dataset.checkIndex);
  if (!group || !Number.isInteger(index)) return;
  if (input.checked) group.add(index);
  else group.delete(index);
  updateActivityProgress();
});
$('shopping-list-content').addEventListener('click', (e) => {
  if (e.target.closest('[data-copy-shopping-list]')) copyShoppingList();
  if (e.target.closest('[data-share-shopping-list]')) shareFavoriteSelection();
});
$('guided-content').addEventListener('click', (event) => {
  const activity = guidedActivity();
  if (!activity) return;
  if (event.target.closest('[data-guided-previous]')) {
    guidedState.step--;
    renderGuided();
    return;
  }
  if (event.target.closest('[data-guided-next]')) {
    guidedState.step++;
    renderGuided();
    return;
  }
  if (event.target.closest('[data-guided-mark]')) {
    const checklist = activityChecklists.get(activity.id);
    const checked = !checklist.steps.has(guidedState.step);
    if (checked) checklist.steps.add(guidedState.step);
    else checklist.steps.delete(guidedState.step);
    syncGuidedStepToDetail(activity.id, guidedState.step, checked);
    renderGuided();
  }
});
$('empty-reset').addEventListener('click', reset);
$('close-detail').addEventListener('click', () => $('detail').close());
$('shopping-list-close').addEventListener('click', () => $('shopping-list-dialog').close());
$('guided-close').addEventListener('click', () => $('guided-dialog').close());
$('timer-toggle').addEventListener('click', toggleTimer);
$('timer-reset').addEventListener('click', resetTimer);
$('timer-close').addEventListener('click', closeTimer);
$('detail').addEventListener('click', (e) => {
  if (e.target === $('detail')) {
    const r = $('detail').getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
      $('detail').close();
  }
});
$('detail').addEventListener('close', () => {
  syncDialogScroll();
});
$('shopping-list-dialog').addEventListener('click', (e) => {
  if (e.target === $('shopping-list-dialog')) {
    const rect = $('shopping-list-dialog').getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    )
      $('shopping-list-dialog').close();
  }
});
$('shopping-list-dialog').addEventListener('close', () => {
  syncDialogScroll();
});
$('moments-dialog').addEventListener('click', (event) => {
  if (event.target === $('moments-dialog')) {
    const rect = $('moments-dialog').getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      $('moments-dialog').close();
  }
});
$('moments-dialog').addEventListener('close', syncDialogScroll);
$('guided-dialog').addEventListener('close', () => {
  releaseGuidedWakeLock();
  syncDialogScroll();
});
$('guided-dialog').addEventListener('click', (event) => {
  if (event.target !== $('guided-dialog')) return;
  const rect = $('guided-dialog').getBoundingClientRect();
  if (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  )
    $('guided-dialog').close();
});
$('guided-dialog').addEventListener('keydown', (event) => {
  const activity = guidedActivity();
  if (!activity) return;
  if (event.key === 'ArrowLeft' && guidedState.step > 0) {
    guidedState.step--;
    renderGuided();
  }
  if (event.key === 'ArrowRight' && guidedState.step < activity.steps.length - 1) {
    guidedState.step++;
    renderGuided();
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && $('guided-dialog').open && !guidedWakeLock)
    acquireGuidedWakeLock();
});
['age', 'duration', 'budget', 'weather'].forEach((key) => ($(key).value = state[key]));
$('search').value = state.query;
$('sort').value = state.sort;
$('catalogue').open = hasShareableSearch();
$('moment-options').open = state.budget !== '999' || state.weather !== 'all';
if (state.category !== 'all' || state.seasonalOnly || state.halloweenOnly)
  document.querySelector('.catalogue-themes').open = true;
updateButtons();
updateSharedSelectionLinks();
render();
if (restoreSuggestions) suggestActivities();
openSharedActivity();
window.addEventListener('hashchange', openSharedActivity);
window.addEventListener('storage', (event) => {
  for (const [key, values] of [
    [FAVORITES_KEY, favorites],
    [COMPLETED_KEY, completed],
  ]) {
    if (event.key !== key && event.key !== null) continue;
    try {
      const stored = JSON.parse(localStorage.getItem(key) || '[]');
      values.clear();
      if (Array.isArray(stored))
        for (const id of stored) {
          if (activities.some((activity) => activity.id === id)) values.add(id);
        }
    } catch {}
  }
  if (
    [FAVORITES_KEY, COMPLETED_KEY, window.SITE_ACTIVITY_ACTIONS.recent.key, null].includes(
      event.key,
    )
  )
    render();
});
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
        sort: {
          type: 'string',
          enum: ['recommended', 'untried', 'time', 'cost', 'age'],
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
        sort: ['recommended', 'untried', 'time', 'cost', 'age'],
      };
      for (const [key, value] of Object.entries(input))
        if (!allowed[key]?.includes(value)) throw new Error(t('invalidFilter', { key }));
      Object.assign(state, input);
      invalidateSuggestions();
      $('catalogue').open = true;
      ['age', 'duration', 'budget', 'weather'].forEach((key) => ($(key).value = state[key]));
      $('sort').value = state.sort;
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
