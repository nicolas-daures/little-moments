import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { listFiles, projectRoot, sourceEntries } from './project.mjs';
import { generateSeoFiles } from './seo.mjs';
import { addSupportFooter } from './support.mjs';
import { checkSupportFeature } from './check-support.mjs';
import { checkHomeFlow } from './check-home.mjs';

const entries = await sourceEntries();
const built = new Map();
for (const { source, output } of entries) built.set(output, await readFile(source));
const seo = await generateSeoFiles(built);
checkSupportFeature(built);
await addSupportFooter(built);
const scripts = [
  ...(await listFiles(path.join(projectRoot, 'src'))),
  ...(await listFiles(path.join(projectRoot, 'scripts'))),
].filter((filename) => /\.(m?js)$/.test(filename));

for (const filename of scripts) {
  const result = spawnSync(process.execPath, ['--check', filename], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || `Invalid JavaScript: ${filename}`);
}

async function loadCatalog(language) {
  const context = { window: {} };
  vm.runInNewContext(
    await readFile(path.join(projectRoot, `src/data/activities.${language}.js`), 'utf8'),
    context,
  );
  return JSON.parse(JSON.stringify(context.window.SITE_ACTIVITIES));
}

const french = await loadCatalog('fr');
const english = await loadCatalog('en');
await checkHomeFlow(built, { fr: french, en: english });
assert.ok(french.length > 0, 'The activity catalog cannot be empty.');
assert.equal(new Set(french.map((activity) => activity.id)).size, french.length);
assert.equal(new Set(english.map((activity) => activity.id)).size, english.length);
assert.equal(french.length, english.length, 'Both languages need the same activities.');

const localValues = new Map();
const recentContext = {
  window: { SITE_I18N: { t: (key) => key } },
  document: { getElementById: () => null },
  localStorage: {
    getItem: (key) => localValues.get(key) ?? null,
    setItem: (key, value) => localValues.set(key, value),
    removeItem: (key) => localValues.delete(key),
  },
  URL,
  Blob,
  setTimeout,
};
vm.runInNewContext(
  await readFile(path.join(projectRoot, 'src/scripts/activity-actions.js'), 'utf8'),
  recentContext,
);
const recent = recentContext.window.SITE_ACTIVITY_ACTIONS.recent;
assert.deepEqual([...recent.read()], []);
for (const id of ['ville', 'bingo-nature', 'photo', 'oiseaux']) recent.record(id);
assert.deepEqual([...recent.read()], ['oiseaux', 'photo', 'bingo-nature']);
recent.record('photo');
assert.deepEqual([...recent.read()], ['photo', 'oiseaux', 'bingo-nature']);
recent.record('../invalid');
assert.deepEqual([...recent.read()], ['photo', 'oiseaux', 'bingo-nature']);
recent.clear();
assert.deepEqual([...recent.read()], []);

for (const original of french) {
  const translated = english.find((activity) => activity.id === original.id);
  assert.ok(translated, `Missing English activity: ${original.id}`);
  for (const key of ['category', 'age', 'time', 'cost', 'place']) {
    assert.deepEqual(translated[key], original[key], `${original.id}: ${key} differs.`);
  }
  for (const activity of [original, translated]) {
    assert.match(activity.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    for (const field of ['id', 'title', 'desc', 'tip']) {
      assert.ok(typeof activity[field] === 'string' && activity[field].trim(), original.id);
    }
    for (const field of ['materials', 'steps']) {
      assert.ok(Array.isArray(activity[field]) && activity[field].length, original.id);
      assert.ok(activity[field].every((value) => typeof value === 'string' && value.trim()));
      assert.equal(activity[field].length, original[field].length, `${original.id}: ${field}`);
    }
  }
}

function checkReference(from, reference) {
  if (!reference || /^(?:https?:|mailto:|data:|tel:|#)/.test(reference)) return;
  const [filename] = reference.split(/[?#]/);
  let target = path.posix.normalize(
    filename.startsWith('/')
      ? filename.slice(1)
      : path.posix.join(path.posix.dirname(from), filename),
  );
  if (filename.endsWith('/')) target = path.posix.join(target, 'index.html');
  assert.ok(built.has(target), `Broken local reference: ${from} -> ${reference}`);
}

const canonicals = new Set();
let htmlCount = 0;
for (const [output, bytes] of built) {
  if (output.endsWith('.html')) {
    const html = bytes.toString();
    htmlCount++;
    assert.match(html, /<html\b[^>]*\blang="(?:fr|en)"/);
    for (const match of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
      checkReference(output, match[1]);
    }
    if (output !== '404.html') {
      const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)[1];
      assert.ok(!canonicals.has(canonical), `Duplicate canonical: ${canonical}`);
      canonicals.add(canonical);
      for (const language of ['fr', 'en']) {
        const alternate = html.match(
          new RegExp(`<link rel="alternate" hreflang="${language}" href="([^"]+)"`),
        )[1];
        const target = new URL(alternate).pathname.slice(1);
        assert.ok(built.has(target.endsWith('/') || !target ? target + 'index.html' : target));
      }
      for (const match of html.matchAll(
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
      ))
        JSON.parse(match[1]);
    }
    if (/^(activites|en\/activities)\//.test(output)) {
      assert.equal((html.match(/<h1>/g) || []).length, 1);
      assert.match(html, /<ul class="materials"><li>/);
      assert.match(html, /<ol class="steps"><li>/);
    }
  }
  if (output.endsWith('.css')) {
    const css = bytes.toString();
    for (const match of css.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g)) {
      checkReference(output, match[1]);
    }
  }
  if (output.endsWith('.webmanifest')) {
    const manifest = JSON.parse(bytes.toString());
    manifest.icons.forEach((icon) => checkReference(output, icon.src));
    checkReference(output, manifest.start_url);
  }
}
const sitemap = built.get('sitemap.xml').toString();
const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
assert.equal(locations.length, seo.pages);
assert.equal(new Set(locations).size, locations.length);
for (const canonical of canonicals) assert.ok(locations.includes(canonical));
for (const language of ['fr', 'en']) {
  const html = built.get(language === 'fr' ? 'index.html' : 'en/index.html').toString();
  assert.equal((html.match(/class="card seo-card"/g) || []).length, french.length);
  assert.match(html, /id="recently-viewed"/);
  assert.match(html, /id="recent-list"/);
  assert.match(html, /recent\.css/);
}

console.log(
  `Checked ${scripts.length} JavaScript files, ${french.length} bilingual activities, ${htmlCount} HTML pages, SEO metadata, sitemap and local resource links.`,
);
