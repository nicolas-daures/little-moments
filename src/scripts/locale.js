'use strict';
(function () {
  const lang = document.documentElement.lang === 'en' ? 'en' : 'fr';
  const base = new URL('./', document.currentScript.src);
  const LANGUAGE_KEY = 'les-petits-moments-language';
  const pages = {
    fr: {
      home: 'index.html',
      legal: 'mentions-legales.html',
      privacy: 'confidentialite.html',
      terms: 'conditions-utilisation.html',
    },
    en: {
      home: 'en/index.html',
      legal: 'en/legal-notice.html',
      privacy: 'en/privacy.html',
      terms: 'en/terms-of-use.html',
    },
  };
  const strings = {
    fr: {
      noPurchase: 'Sans achat',
      home: 'À la maison',
      outside: 'Au grand air',
      age: 'Dès {age} ans',
      viewActivity: 'Voir l’activité : {title}',
      favoriteBadge: '♥ Favori',
      favoriteLabel: 'Dans vos favoris',
      completedBadge: '✓ Vécue',
      completedLabel: 'Activité déjà vécue',
      ideas: '{n} idée{s} à partager',
      favorites: '{n} favori{s}',
      completed: '{n} activité{s} vécue{s}',
      emptyQuery: 'Aucune idée ne correspond à « {query} » avec ces critères.',
      emptyCompleted:
        'Vous n’avez pas encore marqué d’activité comme vécue. Ouvrez une fiche après l’avoir réalisée ensemble.',
      emptyFavorites:
        'Vous n’avez pas encore de favori. Ouvrez une activité et ajoutez-la à votre sélection.',
      empty:
        'Aucune activité ne correspond à tous ces critères. Essayez un autre lieu, plus de temps ou une autre envie.',
      surpriseHint: 'Une idée au hasard parmi vos résultats',
      surpriseDisabled: 'Modifiez vos critères pour retrouver des idées',
      unknownActivity: 'Activité inconnue',
      shareText: 'Une idée à faire ensemble : {title}',
      copied: 'Lien copié !',
      copyPrompt: 'Copiez ce lien pour partager l’activité :',
      printTagline: 'Une idée à vivre ensemble',
      minutes: '{time} minutes',
      familyCost: '{cost} pour la famille',
      completedOn: '✓ Activité vécue',
      completedOff: '○ Nous l’avons faite',
      favoriteOn: '♥ Dans mes favoris',
      favoriteOff: '♡ Ajouter à mes favoris',
      share: '↗ Partager',
      print: '▤ Imprimer',
      materials: 'Ce qu’il vous faut',
      steps: 'À vous de jouer',
      tip: 'Le petit truc en plus',
      estimate:
        'Durée et budget indicatifs. « Sans achat » suppose que vous avez déjà le matériel courant. À faire ensemble, avec un adulte.',
      safety: 'Précautions avant de commencer',
      filterTool: 'Trouver des activités en famille',
      filterDescription:
        'Applique les critères visibles et retourne les activités correspondantes.',
      invalidFilters: 'Critères invalides',
      invalidFilter: 'Critère invalide : {key}',
      openTool: 'Ouvrir une fiche activité',
      openDescription: 'Ouvre la fiche avec le matériel et les étapes.',
      invalidId: 'Identifiant invalide',
      missing: 'À compléter par l’éditeur avant publication.',
      anonymousName: 'Éditeur particulier non professionnel ayant choisi de préserver son anonymat',
      anonymousDetails:
        'Identité et coordonnées communiquées à l’hébergeur conformément à l’article 1-1 II de la LCEN.',
      missingEmail: 'l’adresse e-mail de contact',
      missingAddress: 'l’adresse de l’éditeur',
      missingPhone: 'le téléphone de l’éditeur',
      missingLogs: 'la durée des journaux techniques de l’hébergeur',
      missingImage: 'la provenance de l’illustration',
      completionNote:
        'Informations restant à renseigner : {items}. Cette notice doit être finalisée avant une mise à disposition publique.',
      eraseConfirm: 'Confirmer l’effacement des favoris et activités vécues',
      eraseArmed:
        'Cette action efface vos deux listes sur ce navigateur. Cliquez à nouveau pour confirmer.',
      eraseSuccess:
        'Vos favoris et activités vécues ont été effacés de ce navigateur. Rechargez les éventuels autres onglets du site.',
      eraseBlocked:
        'Le navigateur empêche l’accès au stockage. Utilisez ses réglages pour supprimer les données de ce site.',
      eraseButton: 'Effacer mes favoris et activités vécues',
    },
    en: {
      noPurchase: 'No purchases',
      home: 'At home',
      outside: 'Outdoors',
      age: 'Ages {age}+',
      viewActivity: 'View activity: {title}',
      favoriteBadge: '♥ Favourite',
      favoriteLabel: 'In your favourites',
      completedBadge: '✓ Done',
      completedLabel: 'Activity already completed',
      ideas: '{n} idea{s} to share',
      favorites: '{n} favourite{s}',
      completed: '{n} completed activit{ies}',
      emptyQuery: 'No ideas match “{query}” with these filters.',
      emptyCompleted:
        'You have not marked any activities as completed yet. Open a card after trying it together.',
      emptyFavorites: 'You have no favourites yet. Open an activity and add it to your collection.',
      empty:
        'No activities match all these filters. Try another location, more time or a different category.',
      surpriseHint: 'A random idea from your results',
      surpriseDisabled: 'Change your filters to find more ideas',
      unknownActivity: 'Unknown activity',
      shareText: 'An idea to try together: {title}',
      copied: 'Link copied!',
      copyPrompt: 'Copy this link to share the activity:',
      printTagline: 'An idea to enjoy together',
      minutes: '{time} minutes',
      familyCost: '{cost} for the family',
      completedOn: '✓ Activity completed',
      completedOff: '○ We have done this',
      favoriteOn: '♥ In my favourites',
      favoriteOff: '♡ Add to my favourites',
      share: '↗ Share',
      print: '▤ Print',
      materials: 'What you will need',
      steps: 'Let’s get started',
      tip: 'A little extra idea',
      estimate:
        'Times and budgets are estimates. “No purchases” assumes you already have the usual materials. Try activities together with an adult.',
      safety: 'Precautions before you begin',
      filterTool: 'Find family activities',
      filterDescription: 'Applies the visible filters and returns matching activities.',
      invalidFilters: 'Invalid filters',
      invalidFilter: 'Invalid filter: {key}',
      openTool: 'Open an activity card',
      openDescription: 'Opens the materials and step-by-step instructions.',
      invalidId: 'Invalid identifier',
      missing: 'To be completed by the publisher before publication.',
      anonymousName: 'Private, non-professional publisher who has chosen to remain anonymous',
      anonymousDetails:
        'Identity and contact details provided to the hosting provider under Article 1-1 II of the French LCEN.',
      missingEmail: 'the contact email address',
      missingAddress: 'the publisher’s postal address',
      missingPhone: 'the publisher’s telephone number',
      missingLogs: 'the hosting provider’s technical-log retention period',
      missingImage: 'the illustration’s provenance',
      completionNote:
        'Information still to be completed: {items}. This notice must be finalised before the site is made publicly available.',
      eraseConfirm: 'Confirm deletion of favourites and completed activities',
      eraseArmed: 'This will delete both lists in this browser. Click again to confirm.',
      eraseSuccess:
        'Your favourites and completed activities have been deleted from this browser. Reload any other open tabs of the site.',
      eraseBlocked:
        'Your browser is blocking storage access. Use its settings to delete this site’s data.',
      eraseButton: 'Delete my favourites and completed activities',
    },
  };
  const categoryNames = {
    fr: {
      Créer: 'Créer',
      Explorer: 'Explorer',
      Jouer: 'Jouer',
      Cuisiner: 'Cuisiner',
      Découvrir: 'Découvrir',
    },
    en: {
      Créer: 'Create',
      Explorer: 'Explore',
      Jouer: 'Play',
      Cuisiner: 'Cook',
      Découvrir: 'Discover',
    },
  };
  const api = {
    lang,
    base,
    languageKey: LANGUAGE_KEY,
    t(key, variables = {}) {
      if (!(key in strings[lang])) throw new Error('Missing translation: ' + lang + '/' + key);
      return strings[lang][key].replace(/\{(\w+)\}/g, (_, name) => String(variables[name] ?? ''));
    },
    category(key) {
      return categoryNames[lang][key] || key;
    },
    url(page, target = lang) {
      return new URL(pages[target][page], base).href;
    },
    count(key, n) {
      return this.t(key, {
        n,
        s: lang === 'en' ? (n === 1 ? '' : 's') : n > 1 ? 's' : '',
        ies: n === 1 ? 'y' : 'ies',
      });
    },
    workerUrl: new URL('sw.js', base).href,
  };
  window.SITE_I18N = api;
  const page = document.documentElement.dataset.page || 'home';
  document.querySelectorAll('[data-language]').forEach((link) => {
    const target = link.dataset.language;
    link.href = api.url(page, target) + location.hash;
    link.setAttribute('aria-current', String(target === lang));
    link.addEventListener('click', () => {
      try {
        localStorage.setItem(LANGUAGE_KEY, target);
      } catch {}
      let hash = location.hash;
      const detail = document.getElementById('detail');
      const activity = detail?.open
        ? detail.querySelector('[data-favorite-id]')?.dataset.favoriteId
        : null;
      if (activity) hash = '#activity=' + encodeURIComponent(activity);
      link.href = api.url(page, target) + hash;
    });
  });
  // Only a visit to the bare French homepage follows a saved English choice.
  // Explicit page URLs remain usable in either language.
  if (
    page === 'home' &&
    lang === 'fr' &&
    location.protocol !== 'file:' &&
    location.pathname === base.pathname
  ) {
    try {
      if (localStorage.getItem(LANGUAGE_KEY) === 'en')
        location.replace(api.url('home', 'en') + location.search + location.hash);
    } catch {}
  }
})();
