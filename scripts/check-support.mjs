import assert from 'node:assert/strict';
import { applySupportFooter, supportUrl } from './support.mjs';

export function checkSupportFeature(files) {
  const empty = new Map(files);
  assert.equal(applySupportFooter(empty, { koFiUrl: '' }), 0);
  for (const [name, bytes] of files) assert.equal(empty.get(name), bytes);
  assert.equal(supportUrl({ koFiUrl: '   ' }), '');
  assert.equal(
    supportUrl({ koFiUrl: ' https://ko-fi.com/example_creator/ ' }),
    'https://ko-fi.com/example_creator',
  );
  for (const koFiUrl of [
    'javascript:alert(1)',
    'http://ko-fi.com/example',
    'https://ko-fi.com.evil.test/example',
    'https://ko-fi.com@evil.test/example',
    'https://user:password@ko-fi.com/example',
    'https://ko-fi.com:8443/example',
    'https://ko-fi.com/',
    'https://ko-fi.com/example/shop',
    'https://ko-fi.com/example?ref=tracking',
    'https://ko-fi.com/example#donation',
    'not a URL',
  ])
    assert.throws(() => supportUrl({ koFiUrl }));
  for (const config of [null, {}, { koFiUrl: true }]) assert.throws(() => supportUrl(config));

  // Isolated fixtures only: this example is never configured as the recipient or written to dist/.
  const enabled = new Map(files);
  const expected = [...files].filter(
    ([name, bytes]) => name.endsWith('.html') && bytes.toString().includes('class="legal-footer"'),
  );
  assert.ok(expected.length > 0);
  assert.equal(
    applySupportFooter(enabled, { koFiUrl: 'https://ko-fi.com/example_creator' }),
    expected.length,
  );
  for (const [name] of expected) {
    const html = enabled.get(name).toString();
    const en = /<html\b[^>]*\blang="en"/.test(html);
    assert.equal((html.match(/class="support-callout"/g) || []).length, 1, name);
    assert.match(html, /<footer\b[^>]*class="legal-footer"[^>]*>\s*<aside class="support-callout"/);
    assert.match(
      html,
      /href="https:\/\/ko-fi.com\/example_creator" target="_blank" rel="noopener noreferrer external" referrerpolicy="no-referrer"/,
    );
    assert.ok(html.includes(en ? 'Buy me a coffee' : 'Offrir un café'), name);
    assert.ok(
      html.includes(en ? 'Optional support via Ko-fi' : 'Soutien facultatif via Ko-fi'),
      name,
    );
    assert.ok(!/<(?:script|iframe|img|link)\b[^>]*(?:src|href)="https:\/\/[^\"]*ko-fi/.test(html));
  }
  assert.throws(() =>
    applySupportFooter(enabled, { koFiUrl: 'https://ko-fi.com/example_creator' }),
  );
  console.log(
    `Checked optional support: hidden without a recipient, bilingual on ${expected.length} pages, safe external links and rejected invalid URLs.`,
  );
}
