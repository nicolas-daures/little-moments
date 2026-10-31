'use strict';
if (!window.__DEV__ && 'serviceWorker' in navigator)
  window.addEventListener('load', () =>
    navigator.serviceWorker.register(window.SITE_I18N.workerUrl).catch(() => {}),
  );
