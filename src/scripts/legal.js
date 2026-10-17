'use strict';
(function () {
  const config = window.SITE_LEGAL_CONFIG || {};
  const i18n = window.SITE_I18N,
    t = (key, variables) => i18n.t(key, variables);
  const validEmail =
    typeof config.contactEmail === 'string' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.contactEmail);
  const anonymous = config.anonymousPublisher === true && config.identityProvidedToHost === true;
  const isSites = location.hostname.endsWith('.chatgpt.site');
  document.querySelectorAll('[data-legal-field]').forEach((node) => {
    const key = node.dataset.legalField;
    let value = (i18n.lang === 'en' && config[key + 'En']) || config[key];
    if (anonymous && ['publisherName', 'publicationDirector'].includes(key))
      value = t('anonymousName');
    if (anonymous && ['publisherAddress', 'publisherPhone'].includes(key))
      value = t('anonymousDetails');
    if (key === 'contactEmail' && !validEmail) value = '';
    node.textContent = typeof value === 'string' && value.trim() ? value : t('missing');
    node.classList.toggle('legal-missing', !value);
    if (key === 'contactEmail' && validEmail) {
      const link = document.createElement('a');
      link.href = 'mailto:' + config.contactEmail;
      link.textContent = config.contactEmail;
      node.replaceChildren(link);
    }
  });
  const missing = [];
  if (!validEmail) missing.push(t('missingEmail'));
  if (!anonymous && !config.publisherAddress) missing.push(t('missingAddress'));
  if (!anonymous && !config.publisherPhone) missing.push(t('missingPhone'));
  if (!config.trafficLogsRetention) missing.push(t('missingLogs'));
  if (!config.illustrationCredit) missing.push(t('missingImage'));
  const note = document.getElementById('legal-completion-note');
  if (note) {
    note.hidden = !missing.length;
    const text = document.createElement('p');
    text.textContent = t('completionNote', { items: missing.join(', ') });
    note.append(text);
  }
  document.querySelectorAll('[data-anonymous-note]').forEach((node) => (node.hidden = !anonymous));
  document
    .querySelectorAll('[data-sites-hosting-note]')
    .forEach((node) => (node.hidden = !isSites));
  const eraseButton = document.getElementById('erase-local-preferences'),
    eraseStatus = document.getElementById('erase-local-status');
  let eraseArmed = false;
  if (eraseButton)
    eraseButton.addEventListener('click', () => {
      if (!eraseArmed) {
        eraseArmed = true;
        eraseButton.textContent = t('eraseConfirm');
        eraseStatus.textContent = t('eraseArmed');
        return;
      }
      try {
        localStorage.removeItem('les-petits-moments-favorites');
        localStorage.removeItem('les-petits-moments-completed');
        eraseStatus.textContent = t('eraseSuccess');
      } catch {
        eraseStatus.textContent = t('eraseBlocked');
      }
      eraseButton.textContent = t('eraseButton');
      eraseArmed = false;
    });
  if (!window.__DEV__ && 'serviceWorker' in navigator)
    window.addEventListener('load', () =>
      navigator.serviceWorker.register(i18n.workerUrl).catch(() => {}),
    );
})();
