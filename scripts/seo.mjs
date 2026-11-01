import { readFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { projectRoot } from './project.mjs';

export const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character],
  );
const json = (value) => JSON.stringify(value).replace(/</g, '\\u003c');
const cleanPath = (output) => output.replace(/index\.html$/, '');
const home = (lang) => (lang === 'fr' ? '' : 'en/');
const activityPath = (activity, lang) =>
  `${lang === 'fr' ? 'activites' : 'en/activities'}/${activity.slug}/`;
const categories = {
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
const words = {
  fr: {
    home: 'Toutes les activités',
    language: 'Langue du site',
    materials: 'Le matériel',
    steps: 'À vous de jouer',
    tip: 'Le petit truc en plus',
    related: 'Pour prolonger ce moment',
    selection: 'Des idées pour votre journée',
    age: (age) => `Dès ${age} ans`,
    time: (time) => `${time} min`,
    cost: (cost) => (cost === 0 ? 'Sans achat' : `Environ ${cost} €`),
    inside: 'À la maison',
    outside: 'Au grand air',
    estimate:
      'Durées et budgets indicatifs pour la famille. À adapter à l’âge et aux besoins des enfants. À vivre avec un adulte.',
    safety: 'Conseils et précautions',
    favorite: '♡ Garder en favori',
    completed: '✓ On l’a vécue',
    share: 'Partager',
    print: 'Imprimer la fiche',
    plan: 'Planifier',
    planTitle: 'Un petit rendez-vous en famille',
    date: 'Date',
    hour: 'Heure',
    calendar: 'Ajouter à mon calendrier',
    legal: 'Mentions légales',
    privacy: 'Confidentialité et stockage',
    terms: 'Conditions d’utilisation',
    tagline: 'Le plus important, c’est d’être ensemble.',
    breadcrumb: 'Fil d’Ariane',
    activity: 'Une activité à partager',
    selections: 'D’autres envies ?',
  },
  en: {
    home: 'All activities',
    language: 'Website language',
    materials: 'What you need',
    steps: 'Let’s get started',
    tip: 'One little extra',
    related: 'Keep the moment going',
    selection: 'Ideas for your day',
    age: (age) => `Ages ${age}+`,
    time: (time) => `${time} min`,
    cost: (cost) => (cost === 0 ? 'No purchase needed' : `Around €${cost}`),
    inside: 'At home',
    outside: 'Outdoors',
    estimate:
      'Times and budgets are estimates for the family. Adapt each activity to the children’s ages and needs. Enjoy together with an adult.',
    safety: 'Advice and precautions',
    favorite: '♡ Save as a favourite',
    completed: '✓ We’ve done it',
    share: 'Share',
    print: 'Print activity',
    plan: 'Plan ahead',
    planTitle: 'A little family date',
    date: 'Date',
    hour: 'Time',
    calendar: 'Add to my calendar',
    legal: 'Legal notice',
    privacy: 'Privacy & local storage',
    terms: 'Terms of use',
    tagline: 'What matters most is being together.',
    breadcrumb: 'Breadcrumb',
    activity: 'An activity to enjoy together',
    selections: 'More ideas?',
  },
};

// Each selection has its own introduction and a clearly defined, useful subset.
export const selections = [
  {
    id: 'rain',
    slugs: { fr: 'activites-enfants-jour-de-pluie', en: 'rainy-day-activities-for-kids' },
    titles: {
      fr: 'Des activités avec les enfants quand il pleut',
      en: 'Things to do with kids on a rainy day',
    },
    descriptions: {
      fr: 'Jeux, créations et découvertes à faire à la maison avec les enfants quand la pluie invite à rester à l’abri.',
      en: 'Games, crafts and discoveries to enjoy at home with kids when rain keeps the family indoors.',
    },
    intros: {
      fr: 'Une journée de pluie peut devenir l’occasion de fabriquer, cuisiner ou jouer ensemble. Cette sélection rassemble les activités prévues pour l’intérieur : choisissez selon le matériel disponible et le temps devant vous.',
      en: 'A rainy day can be a chance to make, cook or play together. These activities are designed for indoors: choose one to suit the supplies you have and the time available.',
    },
    advice: {
      fr: 'Préparez une surface facile à nettoyer et sortez le matériel avant de commencer. Pour les plus jeunes, découpez les étapes en petits moments et gardez la possibilité de faire une pause.',
      en: 'Prepare an easy-to-clean surface and gather supplies before starting. With younger children, break the activity into small steps and leave room for a break.',
    },
    matches: (activity) => activity.place === 'inside',
  },
  {
    id: 'free',
    slugs: { fr: 'activites-enfants-sans-achat', en: 'no-purchase-family-activities' },
    titles: {
      fr: 'Des activités en famille sans achat',
      en: 'Family activities with no purchase needed',
    },
    descriptions: {
      fr: 'Des activités parents-enfants avec un budget indicatif de 0 €, à choisir selon le matériel déjà disponible à la maison.',
      en: 'Parent-child activities with an estimated €0 budget, using supplies you may already have at home.',
    },
    intros: {
      fr: 'Du papier, quelques objets du quotidien ou un coin de nature peuvent suffire pour passer un moment ensemble. Ces fiches ont un budget indicatif de 0 € : vérifiez leur liste de matériel pour choisir une activité adaptée à ce que vous possédez déjà.',
      en: 'Paper, a few everyday objects or a patch of nature can be enough for a shared moment. These activities have an estimated €0 budget: check the supply list to choose something that uses what you already own.',
    },
    advice: {
      fr: 'Avant de jeter un emballage propre, imaginez comment le transformer. Un objet peut souvent en remplacer un autre : proposez aux enfants de chercher une solution avec les ressources disponibles.',
      en: 'Before throwing away clean packaging, imagine how to transform it. One object can often stand in for another: invite children to find a solution with the resources available.',
    },
    matches: (activity) => activity.cost === 0,
  },
  {
    id: 'short',
    slugs: { fr: 'activites-enfants-20-minutes', en: '20-minute-activities-with-kids' },
    titles: {
      fr: 'Des activités avec les enfants en 20 minutes maximum',
      en: 'Activities with kids in 20 minutes or less',
    },
    descriptions: {
      fr: 'Des idées courtes pour jouer, créer ou explorer ensemble, avec une durée indicative de 20 minutes maximum.',
      en: 'Short ideas for playing, making or exploring together, with estimated durations of 20 minutes or less.',
    },
    intros: {
      fr: 'Un petit créneau suffit parfois pour lancer un jeu ou faire une découverte. Ces activités durent environ 20 minutes ou moins. La préparation et le rangement peuvent demander un peu de temps supplémentaire selon le matériel et l’âge des enfants.',
      en: 'A small gap in the day can be enough to start a game or make a discovery. These activities take around 20 minutes or less. Preparation and tidying may need extra time depending on the supplies and the children’s ages.',
    },
    advice: {
      fr: 'Choisissez une seule idée et annoncez un objectif simple. Si le temps manque, gardez la création ou les règles pour reprendre plus tard : l’activité peut rester un rendez-vous à poursuivre.',
      en: 'Choose one idea and set a simple goal. If time runs out, save the creation or the game rules for later: the activity can become a moment to return to.',
    },
    matches: (activity) => activity.time <= 20,
  },
  {
    id: 'cardboard',
    slugs: { fr: 'bricolages-carton-enfants', en: 'cardboard-crafts-with-kids' },
    titles: {
      fr: 'Des bricolages en carton à faire avec les enfants',
      en: 'Cardboard crafts to make with kids',
    },
    descriptions: {
      fr: 'Transformez des cartons avec les enfants : matériel, étapes et astuces pour créer ensemble à partir d’emballages propres.',
      en: 'Turn cardboard into something new with kids: supplies, steps and tips for making things from clean packaging.',
    },
    intros: {
      fr: 'Boîtes, rouleaux et morceaux de carton deviennent des décors ou des objets inventés. Cette sélection réunit les créations dont le matériel comprend du carton. Chaque fiche indique ce qu’il faut préparer et comment démarrer.',
      en: 'Boxes, tubes and pieces of cardboard can become imaginary settings or invented objects. These crafts include cardboard in their supply lists. Each activity explains what to prepare and how to get started.',
    },
    advice: {
      fr: 'Utilisez des emballages propres, retirez les agrafes et confiez les découpes difficiles à un adulte. Laissez les enfants dessiner leur idée avant d’assembler : un plan très simple aide déjà à se mettre d’accord.',
      en: 'Use clean packaging, remove staples and leave difficult cutting to an adult. Let children sketch their idea before assembling it: even a simple plan helps everyone agree.',
    },
    matches: (activity) =>
      activity.category === 'Créer' && /carton/i.test(activity.materials.join(' ')),
  },
];
const selectionPath = (selection, lang) =>
  `${lang === 'fr' ? 'selections' : 'en/collections'}/${selection.slugs[lang]}/`;

export async function loadCatalog(lang) {
  const context = { window: {} };
  vm.runInNewContext(
    await readFile(path.join(projectRoot, `src/data/activities.${lang}.js`), 'utf8'),
    context,
  );
  return JSON.parse(JSON.stringify(context.window.SITE_ACTIVITIES));
}

export async function generateSeoFiles(files) {
  const config = JSON.parse(await readFile(path.join(projectRoot, 'src/config/seo.json'), 'utf8'));
  // A deployment-specific CF_PAGES_URL is intentionally not used as a canonical origin.
  if (process.env.CF_PAGES && !process.env.SITE_URL && config.siteUrl.includes('.chatgpt.site')) {
    throw new Error(
      'Set SITE_URL to your final public Cloudflare URL before building on Pages (see docs/SEO.md).',
    );
  }
  const origin = new URL(process.env.SITE_URL || config.siteUrl);
  if (
    !['https:', 'http:'].includes(origin.protocol) ||
    origin.username ||
    origin.password ||
    origin.pathname !== '/' ||
    origin.search ||
    origin.hash
  ) {
    throw new Error(
      'SITE_URL must be a complete http(s) origin without credentials, path, query or fragment.',
    );
  }
  const siteUrl = origin.origin + '/';
  const absolute = (route) => new URL(route, siteUrl).href;
  const noindex = process.env.SITE_NOINDEX === '1';
  const catalogs = { fr: await loadCatalog('fr'), en: await loadCatalog('en') };
  const routes = {};
  for (const lang of ['fr', 'en']) {
    const slugs = new Set();
    for (const activity of catalogs[lang]) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(activity.slug) || slugs.has(activity.slug)) {
        throw new Error(`Invalid or duplicate ${lang} activity slug: ${activity.id}`);
      }
      slugs.add(activity.slug);
      (routes[activity.id] ||= {})[lang] = activityPath(activity, lang);
    }
  }
  if (
    catalogs.fr.length !== catalogs.en.length ||
    Object.values(routes).some((route) => !route.fr || !route.en)
  ) {
    throw new Error('Every activity needs matching French and English versions.');
  }
  const template = await readFile(
    path.join(projectRoot, 'src/templates/content-page.html'),
    'utf8',
  );
  const sitemap = [];
  const legalPaths = {
    fr: ['mentions-legales.html', 'confidentialite.html', 'conditions-utilisation.html'],
    en: ['en/legal-notice.html', 'en/privacy.html', 'en/terms-of-use.html'],
  };
  const put = (output, text) => {
    if (files.has(output)) throw new Error(`Generated file collides with a source: ${output}`);
    files.set(output, Buffer.from(text));
  };
  const href = (from, route) => {
    let value = path.posix.relative(path.posix.dirname(from), route || '.') || './';
    if ((!route || route.endsWith('/')) && !value.endsWith('/')) value += '/';
    return value;
  };
  function metadata(route, variants, title, description, lang, graph = []) {
    const canonical = absolute(route);
    return `
      <link rel="canonical" href="${escapeHtml(canonical)}" />
      ${['fr', 'en'].map((language) => `<link rel="alternate" hreflang="${language}" href="${escapeHtml(absolute(variants[language]))}" />`).join('\n')}
      <link rel="alternate" hreflang="x-default" href="${escapeHtml(absolute(variants.fr))}" />
      ${noindex ? '<meta name="robots" content="noindex, follow" />' : ''}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="${escapeHtml(config.siteName)}" />
      <meta property="og:title" content="${escapeHtml(title)}" />
      <meta property="og:description" content="${escapeHtml(description)}" />
      <meta property="og:url" content="${escapeHtml(canonical)}" />
      <meta property="og:locale" content="${lang === 'fr' ? 'fr_FR' : 'en_GB'}" />
      <meta property="og:image" content="${escapeHtml(absolute('app-icon-512.png'))}" />
      <meta name="twitter:card" content="summary" />
      <script type="application/ld+json">${json({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebPage',
            '@id': canonical,
            url: canonical,
            name: title,
            description,
            inLanguage: lang,
            isPartOf: { '@id': absolute('') + '#website' },
          },
          {
            '@type': 'WebSite',
            '@id': absolute('') + '#website',
            name: config.siteName,
            url: absolute(''),
            inLanguage: ['fr', 'en'],
          },
          ...graph,
        ],
      })}</script>`;
  }
  function breadcrumb(route, title, lang) {
    return {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: words[lang].home, item: absolute(home(lang)) },
        { '@type': 'ListItem', position: 2, name: title, item: absolute(route) },
      ],
    };
  }
  function card(activity, lang, output) {
    const w = words[lang];
    return `<a class="card seo-card" data-id="${escapeHtml(activity.id)}" href="${escapeHtml(href(output, activityPath(activity, lang)))}">
      <span class="card-category">${categories[lang][activity.category]}</span>
      <h3>${escapeHtml(activity.title)}</h3><p>${escapeHtml(activity.desc)}</p>
      <div class="card-bottom"><span>${w.age(activity.age)} · ${w.time(activity.time)}</span><span>${w.cost(activity.cost)}</span></div>
    </a>`;
  }
  function selectionLinks(lang, output, current) {
    return `<section class="seo-selections"><h2>${words[lang].selections}</h2><div class="selection-links">${selections
      .filter((selection) => selection.id !== current)
      .map(
        (selection) =>
          `<a href="${href(output, selectionPath(selection, lang))}">${escapeHtml(selection.titles[lang])}<span aria-hidden="true">↗</span></a>`,
      )
      .join('')}</div></section>`;
  }
  function shell({
    lang,
    page,
    route,
    title,
    description,
    variants,
    main,
    attributes = '',
    scripts = '',
    graph = [],
  }) {
    const output = route + 'index.html';
    const w = words[lang];
    const values = {
      lang,
      page,
      title: escapeHtml(title),
      description: escapeHtml(description),
      attributes,
      assets: '../'.repeat(output.split('/').length - 1),
      scripts,
      metadata: metadata(route, variants, title, description, lang, [
        breadcrumb(route, title, lang),
        ...graph,
      ]),
      header: `<header><a class="brand" href="${href(output, home(lang))}"><span class="brandmark">✳</span><span>les petits<br /><b>moments.</b></span></a><a class="content-back" href="${href(output, home(lang))}">${w.home}</a><nav aria-label="${w.language}" class="language-switch">${['fr', 'en'].map((language) => `<a data-language="${language}" lang="${language}" hreflang="${language}" aria-current="${language === lang}" href="${href(output, variants[language])}">${language.toUpperCase()}</a>`).join('')}</nav></header>`,
      main: `<nav class="breadcrumbs" aria-label="${w.breadcrumb}"><a href="${href(output, home(lang))}">${w.home}</a><span aria-hidden="true">/</span><span aria-current="page">${escapeHtml(title.replace(` — ${config.siteName}`, ''))}</span></nav>${main}`,
      footer: `<footer class="legal-footer"><a class="footer-brand" href="${href(output, home(lang))}">les petits moments.</a><p>${w.tagline}</p><nav aria-label="${w.legal}">${legalPaths[lang].map((route, index) => `<a href="${href(output, route)}">${[w.legal, w.privacy, w.terms][index]}</a>`).join('')}</nav></footer>`,
    };
    put(
      output,
      template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        if (!(key in values)) throw new Error(`Unknown HTML placeholder: ${key}`);
        return values[key];
      }),
    );
    sitemap.push({ route, variants });
  }
  for (const lang of ['fr', 'en']) {
    const w = words[lang];
    for (const activity of catalogs[lang]) {
      const route = routes[activity.id][lang],
        output = route + 'index.html';
      const related = catalogs[lang]
        .filter(
          (candidate) => candidate.id !== activity.id && candidate.category === activity.category,
        )
        .sort((a, b) => Math.abs(a.age - activity.age) - Math.abs(b.age - activity.age))
        .slice(0, 3);
      const prefix = '../'.repeat(output.split('/').length - 1);
      const main = `<article class="activity-page" data-activity-id="${escapeHtml(activity.id)}">
        <div class="activity-page-head"><p class="eyebrow">${w.activity} · ${categories[lang][activity.category]}</p>
        <h1>${escapeHtml(activity.title)}</h1><p class="activity-description">${escapeHtml(activity.desc)}</p>
        <div class="detail-meta"><span>${w.age(activity.age)}</span><span>${w.time(activity.time)}</span><span>${w.cost(activity.cost)}</span><span>${w[activity.place]}</span></div>
        <div class="detail-actions page-actions" hidden><button class="favorite-toggle" data-favorite-id="${escapeHtml(activity.id)}" aria-pressed="false">${w.favorite}</button><button class="completed-toggle" data-completed-id="${escapeHtml(activity.id)}" aria-pressed="false">${w.completed}</button><button class="share-activity" data-share-id="${escapeHtml(activity.id)}">${w.share}</button><button class="plan-activity" data-plan-toggle aria-expanded="false">${w.plan}</button><button class="print-activity" data-print-activity>${w.print}</button><span id="share-status" role="status" aria-live="polite"></span></div>
        <div class="plan-panel" data-plan-panel hidden><strong>${w.planTitle}</strong><label>${w.date}<input id="plan-date" type="date" required /></label><label>${w.hour}<input id="plan-time" type="time" value="14:00" /></label><button class="plan-save" data-plan-save>${w.calendar}</button><span id="plan-status" role="status" aria-live="polite"></span></div></div>
        <div class="activity-page-body"><section><h2>${w.materials}</h2><ul class="materials">${activity.materials.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section>
        <section><h2>${w.steps}</h2><ol class="steps">${activity.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol></section>
        <aside class="extra"><strong>${w.tip}</strong><p>${escapeHtml(activity.tip)}</p></aside>
        <p class="estimate">${w.estimate} <a href="${href(output, legalPaths[lang][2])}#precautions">${w.safety}</a>.</p></div>
      </article><section class="related-activities"><h2>${w.related}</h2><div class="seo-card-grid">${related.map((item) => card(item, lang, output)).join('')}</div></section>${selectionLinks(lang, output)}
      <script id="activity-data" type="application/json">${json(activity)}</script>`;
      shell({
        lang,
        page: 'activity',
        route,
        title: `${activity.title} — ${config.siteName}`,
        description: `${activity.desc} ${w.age(activity.age)} · ${w.time(activity.time)} · ${w.cost(activity.cost)}.`,
        variants: routes[activity.id],
        main,
        attributes: `data-activity-id="${escapeHtml(activity.id)}"`,
        scripts: `<script defer src="${prefix}activity-actions.js"></script><script defer src="${prefix}activity-page.js"></script>`,
      });
    }
    for (const selection of selections) {
      // Membership is based on the original shared metadata and French materials, then translated.
      const ids = new Set(catalogs.fr.filter(selection.matches).map((activity) => activity.id));
      const list = catalogs[lang].filter((activity) => ids.has(activity.id));
      if (!list.length) throw new Error(`Empty selection: ${selection.id}`);
      const route = selectionPath(selection, lang),
        output = route + 'index.html';
      const variants = Object.fromEntries(
        ['fr', 'en'].map((language) => [language, selectionPath(selection, language)]),
      );
      const main = `<section class="selection-intro"><p class="eyebrow">${w.selection}</p><h1>${escapeHtml(selection.titles[lang])}</h1><p>${escapeHtml(selection.intros[lang])}</p><aside class="extra"><p>${escapeHtml(selection.advice[lang])}</p></aside></section><div class="seo-card-grid">${list.map((activity) => card(activity, lang, output)).join('')}</div>${selectionLinks(lang, output, selection.id)}`;
      shell({
        lang,
        page: 'selection',
        route,
        title: `${selection.titles[lang]} — ${config.siteName}`,
        description: selection.descriptions[lang],
        variants,
        main,
        attributes: `data-alternate-fr="${variants.fr}" data-alternate-en="${variants.en}"`,
        scripts: `<script defer src="${'../'.repeat(output.split('/').length - 1)}content-page.js"></script>`,
        graph: [
          {
            '@type': 'ItemList',
            itemListElement: list.map((activity, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              url: absolute(activityPath(activity, lang)),
              name: activity.title,
            })),
          },
        ],
      });
    }
  }
  const existingPairs = [
    ['index.html', 'en/index.html'],
    ['mentions-legales.html', 'en/legal-notice.html'],
    ['confidentialite.html', 'en/privacy.html'],
    ['conditions-utilisation.html', 'en/terms-of-use.html'],
  ];
  for (const pair of existingPairs) {
    const variants = { fr: cleanPath(pair[0]), en: cleanPath(pair[1]) };
    for (const [index, output] of pair.entries()) {
      const lang = index === 0 ? 'fr' : 'en';
      let html = files.get(output).toString();
      if (output === 'index.html' || output === 'en/index.html') {
        const title =
          lang === 'fr'
            ? 'Activités à faire avec les enfants — Les petits moments'
            : 'Activities to do with kids — Les petits moments';
        html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
        html = html.replace(
          /(<div\b[^>]*\bid="results"[^>]*>)[\s\S]*?(<\/div>)/,
          `$1${catalogs[lang].map((activity) => card(activity, lang, output)).join('')}$2`,
        );
        html = html.replace('<!-- catalogue-selections -->', selectionLinks(lang, output));
      }
      const title = html.match(/<title>(.*?)<\/title>/s)[1].replace(/&amp;/g, '&');
      const meta =
        html.match(/<meta\b[^>]*name="description"[^>]*>/s)?.[0] ||
        html.match(/<meta\b[^>]*content="[^"]*"[^>]*name="description"[^>]*>/s)?.[0];
      const description = meta.match(/content="([^"]*)"/)[1].replace(/&amp;/g, '&');
      html = html.replace(
        '</head>',
        `${metadata(cleanPath(output), variants, title, description, lang)}\n</head>`,
      );
      files.set(output, Buffer.from(html));
      sitemap.push({ route: cleanPath(output), variants });
    }
  }
  put('activity-routes.js', `'use strict';\nwindow.SITE_ACTIVITY_ROUTES = ${json(routes)};\n`);
  put('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${absolute('sitemap.xml')}\n`);
  put(
    'sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${sitemap.map(({ route, variants }) => `<url><loc>${escapeHtml(absolute(route))}</loc>${['fr', 'en'].map((lang) => `<xhtml:link rel="alternate" hreflang="${lang}" href="${escapeHtml(absolute(variants[lang]))}" />`).join('')}</url>`).join('\n')}</urlset>\n`,
  );
  return { activities: catalogs.fr.length, pages: sitemap.length, siteUrl };
}
