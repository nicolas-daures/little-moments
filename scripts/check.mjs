import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { listFiles, projectRoot, sourceEntries } from './project.mjs';

const entries = await sourceEntries();
const byOutput = new Map(entries.map((entry) => [entry.output, entry]));
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
assert.ok(french.length > 0, 'The activity catalog cannot be empty.');
assert.equal(new Set(french.map((activity) => activity.id)).size, french.length);
assert.equal(new Set(english.map((activity) => activity.id)).size, english.length);
assert.equal(french.length, english.length, 'Both languages need the same activities.');

for (const original of french) {
  const translated = english.find((activity) => activity.id === original.id);
  assert.ok(translated, `Missing English activity: ${original.id}`);
  for (const key of ['category', 'age', 'time', 'cost', 'place']) {
    assert.deepEqual(translated[key], original[key], `${original.id}: ${key} differs.`);
  }
  for (const activity of [original, translated]) {
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
  let target = path.posix.normalize(path.posix.join(path.posix.dirname(from), filename));
  if (filename.endsWith('/')) target = path.posix.join(target, 'index.html');
  assert.ok(byOutput.has(target), `Broken local reference: ${from} -> ${reference}`);
}

for (const { source, output } of entries) {
  if (output.endsWith('.html')) {
    const html = await readFile(source, 'utf8');
    assert.match(html, /<html\b[^>]*\blang="(?:fr|en)"/);
    for (const match of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
      checkReference(output, match[1]);
    }
  }
  if (output.endsWith('.css')) {
    const css = await readFile(source, 'utf8');
    for (const match of css.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g)) {
      checkReference(output, match[1]);
    }
  }
  if (output.endsWith('.webmanifest')) {
    const manifest = JSON.parse(await readFile(source, 'utf8'));
    manifest.icons.forEach((icon) => checkReference(output, icon.src));
    checkReference(output, manifest.start_url);
  }
}

console.log(
  `Checked ${scripts.length} JavaScript files, ${french.length} bilingual activities and local resource links.`,
);
