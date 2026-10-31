import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { projectRoot } from './project.mjs';

// Only an explicit creator page is accepted. Never guess the recipient of a payment.
export function supportUrl(config) {
  if (!config || typeof config.koFiUrl !== 'string') {
    throw new Error('support.json must contain a koFiUrl string.');
  }
  const value = config.koFiUrl.trim();
  if (!value) return '';
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('koFiUrl must be a complete HTTPS Ko-fi creator URL.');
  }
  if (
    url.protocol !== 'https:' ||
    url.hostname !== 'ko-fi.com' ||
    url.port ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !/^\/[a-z0-9_]+\/?$/i.test(url.pathname)
  ) {
    throw new Error('koFiUrl must look like https://ko-fi.com/your_creator_name.');
  }
  return url.href.replace(/\/$/, '');
}

export function supportMarkup(lang, url) {
  if (!url) return '';
  const en = lang === 'en';
  return `<aside class="support-callout" aria-labelledby="support-title">
    <div class="support-copy">
      <h2 id="support-title">${en ? 'Little moments, freely shared.' : 'Des petits moments, en toute liberté.'}</h2>
      <p>${en ? 'This website will remain free. If it helped your family share a lovely moment, you can support future activities.' : 'Ce site restera gratuit. S’il vous a aidé à partager un joli moment en famille, vous pouvez soutenir ses prochaines activités.'}</p>
    </div>
    <div class="support-action">
      <a class="support-link" href="${url}" target="_blank" rel="noopener noreferrer external" referrerpolicy="no-referrer" aria-describedby="support-note"><span aria-hidden="true">☕</span> ${en ? 'Buy me a coffee' : 'Offrir un café'} <span aria-hidden="true">↗</span></a>
      <small id="support-note">${en ? 'Optional support via Ko-fi · Opens a new tab' : 'Soutien facultatif via Ko-fi · Nouvel onglet'}</small>
    </div>
  </aside>`;
}

export function applySupportFooter(files, config) {
  const url = supportUrl(config);
  if (!url) return 0;
  let count = 0;
  for (const [output, bytes] of files) {
    if (!output.endsWith('.html')) continue;
    const html = bytes.toString();
    if (!html.includes('class="legal-footer"')) continue;
    if (html.includes('class="support-callout"')) {
      throw new Error(`Support footer already exists: ${output}`);
    }
    const lang = /<html\b[^>]*\blang="en"/.test(html) ? 'en' : 'fr';
    files.set(
      output,
      Buffer.from(
        html.replace(
          /(<footer\b[^>]*class="legal-footer"[^>]*>)/,
          `$1\n${supportMarkup(lang, url)}`,
        ),
      ),
    );
    count++;
  }
  return count;
}

export async function addSupportFooter(files) {
  const config = JSON.parse(
    await readFile(path.join(projectRoot, 'src/config/support.json'), 'utf8'),
  );
  return applySupportFooter(files, config);
}
