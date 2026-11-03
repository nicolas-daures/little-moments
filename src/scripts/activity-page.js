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

  const checklistKey = `les-petits-moments-checklist-${activity.id}`;
  const checklist = { material: new Set(), step: new Set() };
  try {
    const saved = JSON.parse(sessionStorage.getItem(checklistKey) || '{}');
    for (const kind of ['material', 'step']) {
      if (Array.isArray(saved[kind]))
        saved[kind]
          .filter((index) => Number.isInteger(index) && index >= 0)
          .forEach((index) => checklist[kind].add(index));
    }
  } catch {}
  const checklistInputs = [...document.querySelectorAll('[data-page-check]')];
  function saveChecklist() {
    try {
      sessionStorage.setItem(
        checklistKey,
        JSON.stringify({ material: [...checklist.material], step: [...checklist.step] }),
      );
    } catch {}
  }
  function refreshProgress() {
    const steps = checklistInputs.filter((input) => input.dataset.pageCheck === 'step');
    const done = steps.filter((input) => input.checked).length;
    const total = steps.length;
    const complete = total > 0 && done === total;
    const progress = document.getElementById('page-activity-progress');
    const label = t(complete ? 'stepsComplete' : 'stepsProgress', { done, total });
    progress.setAttribute('aria-valuenow', String(done));
    progress.setAttribute('aria-valuetext', label);
    progress.classList.toggle('is-complete', complete);
    document.getElementById('page-activity-progress-label').textContent = label;
    document.getElementById('page-activity-progress-bar').style.width =
      `${total ? (done / total) * 100 : 0}%`;
  }
  checklistInputs.forEach((input) => {
    const kind = input.dataset.pageCheck;
    const index = Number(input.dataset.pageCheckIndex);
    input.checked = checklist[kind].has(index);
    input.addEventListener('change', () => {
      if (input.checked) checklist[kind].add(index);
      else checklist[kind].delete(index);
      saveChecklist();
      refreshProgress();
    });
  });

  const timerToggle = document.querySelector('[data-page-timer-toggle]');
  const timerPanel = document.querySelector('[data-page-timer-panel]');
  const timerSelect = document.getElementById('page-timer-duration');
  const timerDisplay = document.getElementById('page-timer-display');
  const timerStart = document.querySelector('[data-page-timer-start]');
  const timerReset = document.querySelector('[data-page-timer-reset]');
  const timerStatus = document.getElementById('page-timer-status');
  let timerDuration = Number(timerSelect.value) * 60;
  let timerRemaining = timerDuration;
  let timerEnd = 0;
  let timerInterval = null;
  let timerRunning = false;
  let timerAudio = null;
  const formatTimer = (seconds) =>
    `${String(Math.floor(Math.max(0, seconds) / 60)).padStart(2, '0')}:${String(Math.max(0, seconds) % 60).padStart(2, '0')}`;
  function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
  }
  function prepareTimerSound() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      timerAudio ||= new AudioContext();
      timerAudio.resume();
    } catch {}
  }
  function playTimerSound() {
    try {
      if (!timerAudio) return;
      const oscillator = timerAudio.createOscillator();
      const gain = timerAudio.createGain();
      oscillator.frequency.setValueAtTime(660, timerAudio.currentTime);
      oscillator.frequency.setValueAtTime(880, timerAudio.currentTime + 0.25);
      gain.gain.setValueAtTime(0.0001, timerAudio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, timerAudio.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, timerAudio.currentTime + 0.7);
      oscillator.connect(gain).connect(timerAudio.destination);
      oscillator.start();
      oscillator.stop(timerAudio.currentTime + 0.72);
    } catch {}
  }
  function renderTimer() {
    const done = timerRemaining === 0;
    timerDisplay.textContent = formatTimer(timerRemaining);
    timerStart.textContent = t(
      done
        ? 'timerRestart'
        : timerRunning
          ? 'timerPause'
          : timerRemaining < timerDuration
            ? 'timerResume'
            : 'timerStart',
    );
    timerStatus.textContent = done ? t('timerDone') : timerRunning ? t('pageTimerRunning') : '';
    timerPanel.classList.toggle('is-done', done);
  }
  function tickTimer() {
    if (!timerRunning) return;
    timerRemaining = Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000));
    if (!timerRemaining) {
      timerRunning = false;
      stopTimer();
      playTimerSound();
      navigator.vibrate?.([180, 100, 180]);
    }
    renderTimer();
  }
  function runTimer() {
    timerRunning = true;
    timerEnd = Date.now() + timerRemaining * 1000;
    stopTimer();
    timerInterval = setInterval(tickTimer, 250);
    renderTimer();
  }
  timerToggle.addEventListener('click', () => {
    timerPanel.hidden = !timerPanel.hidden;
    timerToggle.setAttribute('aria-expanded', String(!timerPanel.hidden));
    if (!timerPanel.hidden) timerSelect.focus();
  });
  timerSelect.addEventListener('change', () => {
    stopTimer();
    timerRunning = false;
    timerDuration = Number(timerSelect.value) * 60;
    timerRemaining = timerDuration;
    renderTimer();
  });
  timerStart.addEventListener('click', () => {
    if (timerRunning) {
      tickTimer();
      timerRunning = false;
      stopTimer();
      renderTimer();
      return;
    }
    if (!timerRemaining) timerRemaining = timerDuration;
    prepareTimerSound();
    runTimer();
  });
  timerReset.addEventListener('click', () => {
    stopTimer();
    timerRunning = false;
    timerRemaining = timerDuration;
    renderTimer();
  });
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
  refreshProgress();
  renderTimer();
  document.querySelector('.page-actions').hidden = false;
  if (!window.__DEV__ && 'serviceWorker' in navigator)
    window.addEventListener('load', () =>
      navigator.serviceWorker.register(i18n.workerUrl).catch(() => {}),
    );
})();
