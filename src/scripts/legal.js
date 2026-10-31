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
  const exportButton = document.getElementById('export-local-preferences'),
    importButton = document.getElementById('import-local-trigger'),
    importInput = document.getElementById('import-local-preferences'),
    backupStatus = document.getElementById('backup-local-status'),
    favoritesKey = 'les-petits-moments-favorites',
    completedKey = 'les-petits-moments-completed';

  function readStoredIds(key) {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    if (!Array.isArray(value)) throw new Error('Invalid stored preferences');
    return [...new Set(value.filter((id) => typeof id === 'string'))];
  }

  function validateBackup(data) {
    if (!data || data.app !== 'les-petits-moments' || data.version !== 1) return null;
    if (!Array.isArray(data.favorites) || !Array.isArray(data.completed)) return null;
    const validIds = (ids) =>
      ids.length <= 500 && ids.every((id) => typeof id === 'string' && /^[a-z0-9-]+$/.test(id));
    if (!validIds(data.favorites) || !validIds(data.completed)) return null;
    return {
      favorites: [...new Set(data.favorites)],
      completed: [...new Set(data.completed)],
    };
  }

  if (exportButton)
    exportButton.addEventListener('click', () => {
      try {
        const favorites = readStoredIds(favoritesKey),
          completed = readStoredIds(completedKey),
          backup = {
            app: 'les-petits-moments',
            version: 1,
            exportedAt: new Date().toISOString(),
            favorites,
            completed,
          },
          blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }),
          url = URL.createObjectURL(blob),
          link = document.createElement('a');
        link.href = url;
        link.download = `les-petits-moments-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 0);
        backupStatus.textContent = t('backupExported', {
          favorites: favorites.length,
          completed: completed.length,
        });
      } catch {
        backupStatus.textContent = t('backupBlocked');
      }
    });

  if (importInput)
    importInput.addEventListener('change', async () => {
      const file = importInput.files && importInput.files[0];
      if (!file) return;
      try {
        if (file.size > 128 * 1024) throw new Error('File too large');
        const backup = validateBackup(JSON.parse(await file.text()));
        if (!backup) {
          backupStatus.textContent = t('backupInvalid');
          return;
        }
        localStorage.setItem(favoritesKey, JSON.stringify(backup.favorites));
        localStorage.setItem(completedKey, JSON.stringify(backup.completed));
        backupStatus.textContent = t('backupImported', {
          favorites: backup.favorites.length,
          completed: backup.completed.length,
        });
      } catch (error) {
        backupStatus.textContent =
          error instanceof SyntaxError ? t('backupInvalid') : t('backupBlocked');
      } finally {
        importInput.value = '';
      }
    });
  if (importButton && importInput)
    importButton.addEventListener('click', () => importInput.click());

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
        localStorage.removeItem(favoritesKey);
        localStorage.removeItem(completedKey);
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
