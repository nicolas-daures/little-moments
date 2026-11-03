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
      totalMinutes: '{time} minutes au total',
      readyReference: 'Le kit, les exemples et les variantes',
      readyTimerNote: 'Durée proposée pour l’activité, hors préparation. Vous pouvez l’ajuster.',
      suggestionsThree: 'Trois idées pour votre moment',
      suggestionsTwo: 'Deux idées pour votre moment',
      suggestionsOne: 'Une idée pour votre moment',
      suggestionsNone: 'Ajustons votre petit programme',
      suggestionsSummary:
        'Ces idées respectent vos critères. Choisissez celle qui vous donne envie.',
      suggestionsNoneSummary:
        'Nous n’avons pas trouvé d’activité qui corresponde à tous vos critères.',
      emptyRecent:
        'Aucune fiche consultée pour le moment. Vos trois dernières idées ouvertes apparaîtront ici.',
      home: 'À la maison',
      outside: 'Au grand air',
      age: 'Dès {age} ans',
      viewActivity: 'Voir l’activité : {title}',
      viewReadyActivity: 'Voir l’activité prête à utiliser : {title}',
      fullActivityPage: 'Ouvrir la page de l’activité',
      readyBadge: '✦ Kit prêt',
      favoriteBadge: '♥ Favori',
      favoriteLabel: 'Dans vos favoris',
      completedBadge: '✓ Vécue',
      completedLabel: 'Activité déjà vécue',
      ideas: '{n} idée{s} à partager',
      favorites: '{n} favori{s}',
      completed: '{n} activité{s} vécue{s}',
      halloween: '{n} idée{s} d’Halloween',
      emptyQuery: 'Aucune idée ne correspond à « {query} » avec ces critères.',
      emptyCompleted:
        'Vous n’avez pas encore marqué d’activité comme vécue. Ouvrez une fiche après l’avoir réalisée ensemble.',
      emptyFavorites:
        'Vous n’avez pas encore de favori. Ouvrez une activité et ajoutez-la à votre sélection.',
      empty:
        'Aucune activité ne correspond à tous ces critères. Essayez un autre lieu, plus de temps ou une autre envie.',
      surpriseHint: 'Une idée au hasard parmi vos résultats',
      surpriseDisabled: 'Modifiez vos critères pour retrouver des idées',
      familyPickTitle: 'À vous de choisir',
      familyPickIntro:
        'Ces trois idées respectent vos critères. Chacun défend sa préférée, puis lancez-vous !',
      familyPickRefresh: '↻ Trois autres idées',
      familyPickDisabled: 'Modifiez vos critères pour retrouver des idées',
      removeFilter: 'Retirer le filtre {label}',
      queryFilter: 'Recherche : « {query} »',
      activeFavorites: 'Mes favoris',
      activeCompleted: 'Déjà vécues',
      activeAutumn: 'Spécial automne',
      activeHalloween: 'Spécial Halloween',
      activeSharedSelection: 'Sélection partagée ({n})',
      progressEmpty: 'Vos activités vécues composeront ici un joli carnet de souvenirs.',
      progressStarted: 'Votre collection de souvenirs prend forme.',
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
      plan: '▣ Planifier',
      planTitle: 'Planifier cette activité',
      planDate: 'Date',
      planTime: 'Heure',
      addCalendar: 'Ajouter au calendrier',
      calendarReady: 'Événement téléchargé — ouvrez-le pour l’ajouter à votre calendrier.',
      calendarDateRequired: 'Choisissez une date.',
      print: '▤ Imprimer',
      timer: '◷ Minuteur',
      timerTitle: 'Minuteur de l’activité',
      timerDuration: 'Durée',
      timerMinutes: '{time} min',
      timerStart: 'Démarrer',
      timerPause: 'Pause',
      timerResume: 'Reprendre',
      timerRestart: 'Relancer',
      timerReset: 'Recommencer',
      timerDone: 'C’est terminé !',
      timerStarted: 'Le minuteur continue même si vous fermez la fiche.',
      pageTimerRunning: 'Le minuteur est en cours.',
      guided: '▶ Mode pas à pas',
      guidedLabel: 'MODE PAS À PAS',
      guidedStep: 'Étape {current} sur {total}',
      guidedPrevious: '← Précédente',
      guidedNext: 'Suivante →',
      guidedMark: 'Marquer comme faite',
      guidedMarked: '✓ Étape terminée',
      guidedComplete: 'Bravo, toutes les étapes sont terminées !',
      guidedMaterials: 'Revoir le matériel',
      materials: 'Ce qu’il vous faut',
      steps: 'À vous de jouer',
      checklistHint: 'Préparez le matériel, puis cochez chaque étape au fur et à mesure.',
      stepsProgress: '{done}/{total} étapes cochées',
      stepsComplete: 'Toutes les étapes sont cochées !',
      shoppingListTitle: 'La liste de préparation',
      shoppingListIntro:
        'Le matériel de {n} activité(s) favorite(s), regroupé pour ne rien oublier.',
      shoppingListCopy: 'Copier toute la liste',
      shoppingListShare: 'Partager la sélection',
      shoppingListCopied: 'Liste copiée !',
      shoppingListCopyFailed: 'Impossible de copier automatiquement cette liste.',
      sharedSelectionTitle: 'Une sélection des Petits moments',
      sharedSelectionText: '{n} idées d’activités à découvrir ensemble.',
      sharedSelectionSent: 'Sélection partagée !',
      sharedSelectionCopied: 'Lien de la sélection copié !',
      sharedSelectionFailed: 'Impossible de partager cette sélection automatiquement.',
      shareSearchHint: 'Partager ces critères et les résultats correspondants',
      shareSearchDisabled: 'Choisissez au moins un critère à partager',
      sharedSearchTitle: 'Des idées pour notre prochain petit moment',
      sharedSearchText: '{n} activités correspondent à cette recherche.',
      sharedSearchSent: 'Recherche partagée !',
      sharedSearchCopied: 'Lien de la recherche copié !',
      sharedSearchFailed: 'Impossible de partager cette recherche automatiquement.',
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
      eraseConfirm:
        'Confirmer l’effacement des favoris, activités vécues et consultations récentes',
      eraseArmed:
        'Cette action efface vos favoris, activités vécues et consultations récentes sur ce navigateur. Cliquez à nouveau pour confirmer.',
      eraseSuccess:
        'Vos favoris, activités vécues et consultations récentes ont été effacés de ce navigateur. Rechargez les éventuels autres onglets du site.',
      eraseBlocked:
        'Le navigateur empêche l’accès au stockage. Utilisez ses réglages pour supprimer les données de ce site.',
      eraseButton: 'Effacer mes favoris, activités vécues et consultations récentes',
      backupExported:
        'Sauvegarde téléchargée : {favorites} favori(s), {completed} activité(s) vécue(s) et {recent} consultation(s) récente(s).',
      backupImported:
        'Sauvegarde restaurée : {favorites} favori(s), {completed} activité(s) vécue(s) et {recent} consultation(s) récente(s).',
      backupInvalid: 'Ce fichier ne correspond pas à une sauvegarde valide des Petits moments.',
      backupBlocked:
        'Le navigateur empêche l’accès au stockage ou au fichier. Vérifiez ses autorisations.',
    },
    en: {
      noPurchase: 'No purchases',
      totalMinutes: '{time} minutes in total',
      readyReference: 'The kit, examples and variations',
      readyTimerNote: 'Suggested activity time, excluding preparation. Adjust it as needed.',
      suggestionsThree: 'Three ideas for your moment',
      suggestionsTwo: 'Two ideas for your moment',
      suggestionsOne: 'One idea for your moment',
      suggestionsNone: 'Let’s adjust your plans',
      suggestionsSummary:
        'These ideas match your preferences. Choose the one you feel like trying.',
      suggestionsNoneSummary: 'We couldn’t find an activity matching all your preferences.',
      emptyRecent: 'No activities viewed yet. Your last three opened ideas will appear here.',
      home: 'At home',
      outside: 'Outdoors',
      age: 'Ages {age}+',
      viewActivity: 'View activity: {title}',
      viewReadyActivity: 'View ready-to-use activity: {title}',
      fullActivityPage: 'Open the activity page',
      readyBadge: '✦ Ready kit',
      favoriteBadge: '♥ Favourite',
      favoriteLabel: 'In your favourites',
      completedBadge: '✓ Done',
      completedLabel: 'Activity already completed',
      ideas: '{n} idea{s} to share',
      favorites: '{n} favourite{s}',
      completed: '{n} completed activit{ies}',
      halloween: '{n} Halloween idea{s}',
      emptyQuery: 'No ideas match “{query}” with these filters.',
      emptyCompleted:
        'You have not marked any activities as completed yet. Open a card after trying it together.',
      emptyFavorites: 'You have no favourites yet. Open an activity and add it to your collection.',
      empty:
        'No activities match all these filters. Try another location, more time or a different category.',
      surpriseHint: 'A random idea from your results',
      surpriseDisabled: 'Change your filters to find more ideas',
      familyPickTitle: 'Your family’s choice',
      familyPickIntro:
        'These three ideas match your filters. Each person picks a favourite, then get started!',
      familyPickRefresh: '↻ Three more ideas',
      familyPickDisabled: 'Change your filters to find more ideas',
      removeFilter: 'Remove the {label} filter',
      queryFilter: 'Search: “{query}”',
      activeFavorites: 'My favourites',
      activeCompleted: 'Already tried',
      activeAutumn: 'Autumn special',
      activeHalloween: 'Halloween special',
      activeSharedSelection: 'Shared selection ({n})',
      progressEmpty: 'Completed activities will build a lovely memory book here.',
      progressStarted: 'Your collection of memories is taking shape.',
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
      plan: '▣ Plan',
      planTitle: 'Plan this activity',
      planDate: 'Date',
      planTime: 'Time',
      addCalendar: 'Add to calendar',
      calendarReady: 'Event downloaded — open it to add it to your calendar.',
      calendarDateRequired: 'Choose a date.',
      print: '▤ Print',
      timer: '◷ Timer',
      timerTitle: 'Activity timer',
      timerDuration: 'Duration',
      timerMinutes: '{time} min',
      timerStart: 'Start',
      timerPause: 'Pause',
      timerResume: 'Resume',
      timerRestart: 'Restart',
      timerReset: 'Reset',
      timerDone: 'Time is up!',
      timerStarted: 'The timer keeps running if you close this card.',
      pageTimerRunning: 'The timer is running.',
      guided: '▶ Step-by-step mode',
      guidedLabel: 'STEP-BY-STEP MODE',
      guidedStep: 'Step {current} of {total}',
      guidedPrevious: '← Previous',
      guidedNext: 'Next →',
      guidedMark: 'Mark as done',
      guidedMarked: '✓ Step completed',
      guidedComplete: 'Well done, every step is complete!',
      guidedMaterials: 'Review the materials',
      materials: 'What you will need',
      steps: 'Let’s get started',
      checklistHint: 'Gather the materials, then tick off each step as you go.',
      stepsProgress: '{done}/{total} steps checked',
      stepsComplete: 'All the steps are checked!',
      shoppingListTitle: 'Your preparation list',
      shoppingListIntro: 'Materials for {n} favourite activity/activities, gathered in one place.',
      shoppingListCopy: 'Copy the whole list',
      shoppingListShare: 'Share this selection',
      shoppingListCopied: 'List copied!',
      shoppingListCopyFailed: 'This list could not be copied automatically.',
      sharedSelectionTitle: 'A Les petits moments selection',
      sharedSelectionText: '{n} activity ideas to discover together.',
      sharedSelectionSent: 'Selection shared!',
      sharedSelectionCopied: 'Selection link copied!',
      sharedSelectionFailed: 'This selection could not be shared automatically.',
      shareSearchHint: 'Share these filters and their matching results',
      shareSearchDisabled: 'Choose at least one filter to share',
      sharedSearchTitle: 'Ideas for our next little moment',
      sharedSearchText: '{n} activities match this search.',
      sharedSearchSent: 'Search shared!',
      sharedSearchCopied: 'Search link copied!',
      sharedSearchFailed: 'This search could not be shared automatically.',
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
      eraseConfirm: 'Confirm deletion of favourites, completed activities and recent views',
      eraseArmed:
        'This will delete your favourites, completed activities and recent views in this browser. Click again to confirm.',
      eraseSuccess:
        'Your favourites, completed activities and recent views have been deleted from this browser. Reload any other open tabs of the site.',
      eraseBlocked:
        'Your browser is blocking storage access. Use its settings to delete this site’s data.',
      eraseButton: 'Delete my favourites, completed activities and recent views',
      backupExported:
        'Backup downloaded: {favorites} favourite(s), {completed} completed activity/activities and {recent} recent view(s).',
      backupImported:
        'Backup restored: {favorites} favourite(s), {completed} completed activity/activities and {recent} recent view(s).',
      backupInvalid: 'This file is not a valid Les petits moments backup.',
      backupBlocked: 'The browser blocked storage or file access. Check its permissions.',
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
      return new URL(pages[target][page] || pages[target].home, base).href;
    },
    activityUrl(id, target = lang) {
      const route = window.SITE_ACTIVITY_ROUTES?.[id]?.[target];
      return route
        ? new URL(route, base).href
        : this.url('home', target) + '#activity=' + encodeURIComponent(id);
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
  const languageUrl = (target) => {
    if (page === 'activity')
      return api.activityUrl(document.documentElement.dataset.activityId, target);
    if (page === 'selection')
      return new URL(
        document.documentElement.dataset[target === 'fr' ? 'alternateFr' : 'alternateEn'],
        base,
      ).href;
    return api.url(page, target);
  };
  document.querySelectorAll('[data-language]').forEach((link) => {
    const target = link.dataset.language;
    link.href = languageUrl(target) + location.hash;
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
      link.href = activity
        ? api.activityUrl(activity, target)
        : languageUrl(target) + location.search + hash;
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
