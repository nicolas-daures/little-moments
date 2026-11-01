import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { projectRoot } from './project.mjs';

const script = async (name) => readFile(path.join(projectRoot, 'src/scripts', name), 'utf8');

// A minimal DOM fixture exercises the actual controller and events without a browser dependency.
function fixture(html, url, catalog, language, scripts) {
  const elements = new Map();
  const datasets = { place: [], category: [], language: [] };
  const windowEvents = new Map();
  const values = new Map();
  let focused = null;
  let context;
  class Element {
    constructor(attributes = '', text = '') {
      this.attributes = new Map();
      this.dataset = {};
      this.events = new Map();
      this.style = {};
      this.classList = { toggle() {} };
      this.children = [];
      this.textContent = text;
      this._innerHTML = '';
      for (const [, key, value] of attributes.matchAll(/([\w-]+)="([^"]*)"/g)) {
        this.attributes.set(key, value);
        if (key.startsWith('data-'))
          this.dataset[key.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] =
            value;
      }
      this.id = this.attributes.get('id');
      this.hidden = /\bhidden(?:\s|=|$)/.test(attributes);
      this.open = /\bopen(?:\s|=|$)/.test(attributes);
      this.checked = /\bchecked(?:\s|=|$)/.test(attributes);
      if (this.attributes.has('href')) this.href = new URL(this.attributes.get('href'), url).href;
    }
    addEventListener(name, callback) {
      if (!this.events.has(name)) this.events.set(name, []);
      this.events.get(name).push(callback);
    }
    set innerHTML(value) {
      this._innerHTML = value;
      this.children = [...value.matchAll(/<\w+\b([^>]*)>/g)].map(([, attributes]) => {
        const child = new Element(attributes);
        if (child.id) elements.set(child.id, child);
        return child;
      });
    }
    get innerHTML() { return this._innerHTML; }
    querySelectorAll(selector) {
      const match = selector.match(/^\[([\w-]+)(?:="([^"]*)")?\]$/);
      assert.ok(match, 'Unhandled child selector: ' + selector);
      return this.children.filter((child) =>
        child.attributes.has(match[1]) &&
        (match[2] === undefined || child.attributes.get(match[1]) === match[2]),
      );
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    fire(name, extra = {}) {
      const event = { target: this, preventDefault() {}, ...extra };
      for (const callback of this.events.get(name) || []) callback(event);
    }
    setAttribute(key, value) {
      this.attributes.set(key, value);
    }
    getAttribute(key) {
      return this.attributes.get(key);
    }
    replaceChildren(...children) {
      this.children = children;
    }
    focus() {
      focused = this.id;
    }
    scrollIntoView() {}
    showModal() {
      this.open = true;
    }
    close() {
      this.open = false;
      this.fire('close');
    }
  }
  for (const [, tag, attrs] of html.matchAll(/<(\w+)\b([^>]*)>/g)) {
    const element = new Element(attrs);
    if (element.id) {
      assert.ok(!elements.has(element.id), 'Duplicate ID: ' + element.id);
      elements.set(element.id, element);
    }
    for (const key of Object.keys(datasets)) {
      if (element.dataset[key] !== undefined) datasets[key].push(element);
    }
  }
  for (const [, attrs, content] of html.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/g)) {
    const id = attrs.match(/\bid="([^"]+)"/)[1];
    const element = elements.get(id);
    element.options = [...content.matchAll(/<option value="([^"]*)">([^<]*)<\/option>/g)].map(
      ([, value, textContent]) => ({ value, textContent }),
    );
    element.value = element.options[0].value;
    Object.defineProperty(element, 'selectedOptions', {
      get: () => element.options.filter((option) => option.value === element.value),
    });
  }
  const themes = new Element();
  const document = {
    documentElement: { lang: language, dataset: { page: 'home' } },
    currentScript: { src: new URL('/locale.js', url).href },
    body: { style: {} },
    addEventListener() {},
    createElement: () => new Element(),
    getElementById(id) {
      assert.ok(elements.has(id), 'Missing element accessed by controller: ' + id);
      return elements.get(id);
    },
    querySelectorAll(selector) {
      for (const key of Object.keys(datasets)) {
        if (selector === '[data-' + key + ']') return datasets[key];
      }
      throw new Error('Unhandled selector: ' + selector);
    },
    querySelector(selector) {
      if (selector === '.catalogue-themes') return themes;
      if (selector === 'dialog[open]')
        return (
          [...elements.values()].find(
            (element) => element.open && element.id?.endsWith('dialog'),
          ) || (elements.get('detail').open ? elements.get('detail') : null)
        );
      const match = selector.match(/^\[data-(place|category)="([^"]+)"\]$/);
      if (match)
        return datasets[match[1]].find((element) => element.dataset[match[1]] === match[2]);
      throw new Error('Unhandled selector: ' + selector);
    },
  };
  const sandbox = {
    window: {
      __DEV__: true,
      SITE_ACTIVITIES: catalog,
      SITE_ACTIVITY_ROUTES: Object.fromEntries(
        catalog.map((activity) => [
          activity.id,
          { fr: 'activites/' + activity.slug + '/', en: 'en/activities/' + activity.slug + '/' },
        ]),
      ),
      matchMedia: () => ({ matches: true }),
      addEventListener(name, callback) {
        windowEvents.set(name, callback);
      },
    },
    document,
    location: new URL(url),
    history: {
      replaceState(_, __, next) {
        sandbox.location = new URL(next);
      },
    },
    navigator: {},
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    },
    URL,
    URLSearchParams,
    Blob,
    setTimeout,
    clearTimeout,
  };
  context = vm.createContext(sandbox);
  for (const source of scripts) vm.runInContext(source, context);
  return {
    element: (id) => document.getElementById(id),
    run: (source) => vm.runInContext(source, context),
    set(id, value) {
      elements.get(id).value = value;
      elements.get(id).fire('change');
    },
    place(value) {
      datasets.place.find((element) => element.dataset.place === value).fire('click');
    },
    cards(id) {
      return [...elements.get(id).innerHTML.matchAll(/data-id="([^"]+)"/g)].map(
        ([, value]) => value,
      );
    },
    values,
    storage(key) {
      windowEvents.get('storage')({ key });
    },
    get overflow() { return document.body.style.overflow; },
    language(target) {
      const link = datasets.language.find((element) => element.dataset.language === target);
      link.fire('click');
      return new URL(link.href);
    },
    get focused() {
      return focused;
    },
  };
}

export async function checkHomeFlow(files, catalogs) {
  const selection = await script('home-selection.js');
  const scripts = [
    await script('locale.js'),
    await script('activity-actions.js'),
    selection,
    await script('app.js'),
  ];
  const selectionContext = { window: {} };
  vm.runInNewContext(selection, selectionContext);
  const pick = selectionContext.window.SITE_HOME_SELECTION.select;
  const sample = Array.from({ length: 7 }, (_, id) => ({
    id: String(id),
    category: String(id % 3),
  }));
  for (let count = 0; count <= 7; count++) {
    const first = pick(sample.slice(0, count), [], () => 0.4);
    assert.equal(first.length, Math.min(count, 3));
    assert.equal(new Set(first.map((activity) => activity.id)).size, first.length);
    const second = pick(
      sample.slice(0, count),
      first.map((activity) => activity.id),
      () => 0.4,
    );
    if (count > 3) assert.ok(second.some((activity) => !first.includes(activity)));
    if (count >= 6) assert.ok(second.every((activity) => !first.includes(activity)));
  }
  assert.equal(pick([sample[0], sample[0], sample[1]]).length, 2);
  for (const lang of ['fr', 'en']) {
    const name = lang === 'fr' ? 'index.html' : 'en/index.html';
    const html = files.get(name).toString();
    assert.equal((html.match(/type="submit"/g) || []).length, 1, 'Exactly one main action');
    assert.doesNotMatch(
      html,
      /id="(?:spotlight|family-pick-open|featured-open)"|data-preset=|header-surprise/,
    );
    assert.match(html, /<details\b[^>]*id="catalogue"[^>]*open/);
    assert.match(html, /<dialog\b[^>]*id="moments-dialog"/);
    assert.match(html, /home\.css/);
    const catalogueStart = html.indexOf('id="catalogue"');
    const footerStart = html.indexOf('<footer');
    assert.ok(catalogueStart < html.indexOf('class="seo-selections"'));
    assert.ok(html.indexOf('class="seo-selections"') < footerStart);

    const catalog = catalogs[lang];
    const app = fixture(
      html,
      'https://example.test/' + (lang === 'en' ? 'en/' : ''),
      catalog,
      lang,
      scripts,
    );
    assert.equal(app.element('catalogue').open, false);
    assert.equal(app.element('suggestions').hidden, true);
    app.element('moment-form').fire('submit');
    assert.equal(app.cards('suggestions-list').length, 3);
    assert.equal(app.element('catalogue').open, false);
    assert.equal(app.focused, 'suggestions-title');
    const initial = app.cards('suggestions-list');
    app.element('suggestions-refresh').fire('click');
    assert.ok(app.cards('suggestions-list').every((id) => !initial.includes(id)));
    const chosenId = app.cards('suggestions-list')[0];
    app.element('suggestions-list').fire('click', {
      button: 0,
      target: { closest: () => ({ dataset: { id: chosenId } }) },
    });
    assert.equal(app.element('detail').open, true);
    assert.match(app.element('detail-content').innerHTML, /data-guided-id/);
    assert.ok(app.values.get('les-petits-moments-recent').includes(chosenId));
    app.element('close-detail').fire('click');
    assert.equal(app.element('detail').open, false);
    assert.equal(app.overflow, '');
    const stable = app.cards('suggestions-list');
    app.run('toggleFavorite(' + JSON.stringify(chosenId) + ')');
    assert.deepEqual(app.cards('suggestions-list'), stable, 'Saving a favourite must not reroll the shortlist');

    app.set('age', '3');
    assert.equal(
      app.element('suggestions').hidden,
      true,
      'Changing criteria hides stale suggestions',
    );
    app.set('duration', '20');
    app.set('budget', '0');
    app.place('inside');
    app.element('moment-form').fire('submit');
    for (const id of app.cards('suggestions-list')) {
      const activity = catalog.find((item) => item.id === id);
      assert.ok(
        activity.age <= 3 &&
          activity.time <= 20 &&
          activity.cost === 0 &&
          activity.place === 'inside',
      );
    }
    const translated = app.language(lang === 'fr' ? 'en' : 'fr');
    assert.equal(translated.searchParams.get('age'), '3');
    assert.equal(translated.searchParams.get('time'), '20');
    assert.equal(translated.hash, '#ideas');
    const resumed = fixture(html, translated.href, catalog, lang, scripts);
    assert.equal(resumed.element('catalogue').open, false);
    assert.equal(resumed.cards('suggestions-list').length, 3);
    app.element('show-matches').fire('click');
    assert.equal(app.element('catalogue').open, true);
    assert.equal(app.focused, 'catalogue-title');

    app.set('weather', 'rain');
    app.place('outside');
    app.element('moment-form').fire('submit');
    assert.equal(app.cards('suggestions-list').length, 0);
    assert.equal(app.element('suggestions-empty').hidden, false);
    assert.equal(app.element('suggestions-actions').hidden, true);
    app.element('edit-criteria').fire('click');
    assert.equal(app.focused, 'moment-title');

    // Personal collections do not inherit the active discovery filters.
    const saved = catalog.find((activity) => activity.place === 'inside');
    app.values.set('les-petits-moments-favorites', JSON.stringify([saved.id]));
    app.storage('les-petits-moments-favorites');
    app.element('moments-open').fire('click');
    assert.equal(app.element('moments-dialog').open, true);
    assert.deepEqual(app.cards('moments-list'), [saved.id]);
    app.element('completed-filter').fire('click');
    assert.equal(app.element('moments-empty').hidden, false);
    app.element('recent-filter').fire('click');
    app.run('window.SITE_ACTIVITY_ACTIONS.recent.record(' + JSON.stringify(saved.id) + ')');
    app.storage('les-petits-moments-recent');
    assert.equal(app.element('recently-viewed').hidden, false);
    app.element('recent-clear').fire('click');
    assert.equal(app.element('recently-viewed').hidden, true);
    app.element('moments-close').fire('click');
    assert.equal(app.element('moments-dialog').open, false);

    const shared = fixture(
      html,
      'https://example.test/?age=6&time=20&budget=0&weather=rain&category=Jouer',
      catalog,
      lang,
      scripts,
    );
    assert.equal(shared.element('catalogue').open, true);
    assert.equal(shared.element('moment-options').open, true);
    assert.ok(shared.cards('results').length > 0);
    for (const id of shared.cards('results')) {
      const activity = catalog.find((item) => item.id === id);
      assert.ok(
        activity.age <= 6 &&
          activity.time <= 20 &&
          activity.cost === 0 &&
          activity.place === 'inside' &&
          activity.category === 'Jouer',
      );
    }
    const legacy = fixture(
      html,
      'https://example.test/?selection=' + saved.id,
      catalog,
      lang,
      scripts,
    );
    assert.deepEqual(legacy.cards('results'), [saved.id]);
    assert.equal(legacy.element('catalogue').open, true);
    const small = fixture(html, 'https://example.test/', catalog.slice(0, 2), lang, scripts);
    small.element('moment-form').fire('submit');
    assert.equal(small.cards('suggestions-list').length, 2);
    assert.equal(small.element('suggestions-refresh').hidden, true);
    assert.equal(small.element('show-matches').hidden, true);
    assert.ok(!small.element('suggestions-title').textContent.includes('Three'));
    const single = fixture(html, 'https://example.test/', catalog.slice(0, 1), lang, scripts);
    single.element('moment-form').fire('submit');
    assert.equal(single.cards('suggestions-list').length, 1);
    assert.equal(single.element('suggestions-title').textContent, lang === 'fr' ? 'Une idée pour votre moment' : 'One idea for your moment');
    const oldHash = fixture(html, 'https://example.test/#activity=' + saved.id, catalog, lang, scripts);
    assert.equal(oldHash.element('detail').open, true, 'Legacy activity links remain usable');
  }
  console.log(
    'Checked simplified home in FR/EN: single entry, 0–3 suggestions, refresh, strict criteria, saved collections, storage events and shared searches.',
  );
}
