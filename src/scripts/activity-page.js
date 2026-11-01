'use strict';
(function () {
  const activity = JSON.parse(document.getElementById('activity-data').textContent);
  const i18n = window.SITE_I18N;
  const actions = window.SITE_ACTIVITY_ACTIONS;
  actions.recent.record(activity.id);
  const t = (key) => i18n.t(key);
  const favorite = document.querySelector('[data-favorite-id]');
  const completed = document.querySelector('[data-completed-id]');
  const keys = {
    favorite: 'les-petits-moments-favorites',
    completed: 'les-petits-moments-completed',
  };
  function read(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return new Set(Array.isArray(value) ? value.filter((id) => typeof id === 'string') : []);
    } catch {
      return new Set();
    }
  }
  function refresh() {
    for (const [button, kind, yes, no] of [
      [favorite, 'favorite', 'favoriteOn', 'favoriteOff'],
      [completed, 'completed', 'completedOn', 'completedOff'],
    ]) {
      const active = read(keys[kind]).has(activity.id);
      button.setAttribute('aria-pressed', String(active));
      button.textContent = t(active ? yes : no);
    }
  }
  function toggle(kind) {
    const values = read(keys[kind]);
    if (values.has(activity.id)) values.delete(activity.id);
    else values.add(activity.id);
    try {
      localStorage.setItem(keys[kind], JSON.stringify([...values]));
    } catch {
      document.getElementById('share-status').textContent = t('eraseBlocked');
    }
    refresh();
  }
  favorite.addEventListener('click', () => toggle('favorite'));
  completed.addEventListener('click', () => toggle('completed'));
  document
    .querySelector('[data-share-id]')
    .addEventListener('click', () => actions.share(activity, i18n.activityUrl(activity.id)));
  document.querySelector('[data-print-activity]').addEventListener('click', () => window.print());
  const planToggle = document.querySelector('[data-plan-toggle]');
  const panel = document.querySelector('[data-plan-panel]');
  document.getElementById('plan-date').min = actions.localDate();
  planToggle.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    planToggle.setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) document.getElementById('plan-date').focus();
  });
  document
    .querySelector('[data-plan-save]')
    .addEventListener('click', () => actions.calendar(activity, i18n.activityUrl(activity.id)));
  window.addEventListener('storage', refresh);
  refresh();
  document.querySelector('.page-actions').hidden = false;
  if (!window.__DEV__ && 'serviceWorker' in navigator)
    window.addEventListener('load', () =>
      navigator.serviceWorker.register(i18n.workerUrl).catch(() => {}),
    );
})();
