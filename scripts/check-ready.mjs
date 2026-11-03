import assert from 'node:assert/strict';
import vm from 'node:vm';

export function checkReadyActivities(files, catalogs) {
  const context = { window: {} };
  vm.runInNewContext(files.get('activity-ready.js').toString(), context);
  const view = context.window.SITE_READY;
  const escape = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
    );
  const expectedIds = [
    'ville',
    'ombres',
    'bd',
    'portraits-pixels',
    'bingo-nature',
    'couleurs',
    'photo',
    'carte-sonore',
    'escape-citrouille',
    'plateau-sur-mesure',
    'mimes',
    'dessin-guide',
    'robot-debranche',
    'message-chiffre',
    'pont',
    'flotte',
    'cookies',
    'pizza',
    'verrines',
    'wraps',
  ].sort();
  for (const lang of ['fr', 'en']) {
    const enriched = catalogs[lang].filter((activity) => activity.ready);
    assert.deepEqual(enriched.map((activity) => activity.id).sort(), expectedIds);
    const categories = new Map();
    for (const activity of enriched) {
      const ready = activity.ready;
      categories.set(activity.category, (categories.get(activity.category) || 0) + 1);
      assert.ok(
        Number.isInteger(ready.prepMinutes) &&
          ready.prepMinutes > 0 &&
          ready.prepMinutes < activity.time,
        activity.id + ': preparation must be part of the total',
      );
      for (const key of ['group', 'exampleTitle', 'younger', 'older', 'substitute'])
        assert.ok(typeof ready[key] === 'string' && ready[key].trim(), activity.id + '/' + key);
      for (const key of ['setup', 'example']) {
        assert.ok(Array.isArray(ready[key]) && ready[key].length >= 2, activity.id);
        assert.ok(
          ready[key].every((item) => typeof item === 'string' && item.trim()),
          activity.id,
        );
      }
      for (const solution of ready.solutions || [])
        for (const key of ['label', 'hint', 'answer'])
          assert.ok(typeof solution[key] === 'string' && solution[key].trim(), activity.id);
      const counterpart = catalogs[lang === 'fr' ? 'en' : 'fr'].find(
        (item) => item.id === activity.id,
      );
      assert.equal(ready.prepMinutes, counterpart.ready.prepMinutes);
      assert.equal(ready.setup.length, counterpart.ready.setup.length);
      assert.equal(ready.example.length, counterpart.ready.example.length);
      assert.equal(ready.solutions?.length, counterpart.ready.solutions?.length);
      const output =
        (lang === 'fr' ? 'activites/' : 'en/activities/') + activity.slug + '/index.html';
      const html = files.get(output).toString();
      assert.ok(
        html.includes(view.before(activity, lang, 2)),
        output + ': same preparation as dialog',
      );
      assert.ok(html.includes(view.after(activity, lang, 2)), output + ': same examples as dialog');
      assert.match(html, /activity-ready\.css/);
      assert.match(html, /class="ready-badge"/);
      for (const instruction of [...ready.setup, ...ready.example])
        assert.ok(html.includes(escape(instruction)), output + ': readable without JavaScript');
      if (ready.solutions?.length) {
        assert.match(html, /<details class="ready-solutions">/);
        assert.doesNotMatch(html, /<details class="ready-solutions"[^>]*\bopen/);
      }
    }
    assert.equal(categories.size, 5);
    assert.ok([...categories.values()].every((count) => count === 4));
    const plain = catalogs[lang].find((activity) => !activity.ready);
    assert.equal(view.before(plain, lang), '');
    assert.equal(view.after(plain, lang), '');
    const cipher = enriched.find((activity) => activity.id === 'message-chiffre');
    const normal = cipher.ready.example[0].split(':').at(-1).trim();
    const encoded = cipher.ready.example[1].split(':').at(-1).trim();
    assert.equal(normal.length, 26);
    assert.equal(encoded.length, 26);
    const decode = (text) =>
      [...text]
        .map((letter) => (encoded.includes(letter) ? normal[encoded.indexOf(letter)] : letter))
        .join('');
    const first = decode(cipher.ready.example[2].split(':').at(-1).trim());
    const full = decode(cipher.ready.example[3].split(':').at(-1).trim());
    assert.equal(first, lang === 'fr' ? 'BONJOUR' : 'HELLO');
    assert.equal(
      full,
      lang === 'fr' ? 'LE TRESOR EST SOUS LE LIVRE' : 'THE TREASURE IS UNDER THE BOOK',
    );
    assert.ok(cipher.ready.solutions[0].answer.includes(first));
    assert.ok(cipher.ready.solutions[1].answer.includes(full));
    const pumpkin = enriched.find((activity) => activity.id === 'escape-citrouille');
    const observation = pumpkin.ready.example[0].match(/\[([^\]]+)\]/)[1];
    const firstDigit = observation
      .split('·')
      .filter((item) => item.trim() === (lang === 'fr' ? 'CITROUILLE' : 'PUMPKIN')).length;
    const next = 7 + 4;
    function permutations(values) {
      return values.length
        ? values.flatMap((value, index) =>
            permutations(values.filter((_, i) => i !== index)).map((rest) => [value, ...rest]),
          )
        : [[]];
    }
    const orders = permutations(['book', 'spoon', 'pencil', 'key']).filter(
      (order) =>
        order.indexOf('book') + 1 === order.indexOf('spoon') &&
        order.indexOf('pencil') + 1 === order.indexOf('key') &&
        order.indexOf('spoon') < order.indexOf('pencil'),
    );
    assert.equal(orders.length, 1, 'The ordering puzzle has one solution');
    const code = '' + firstDigit + (next % 10) + (orders[0].indexOf('key') + 1);
    assert.equal(code, '314');
    assert.ok(pumpkin.ready.solutions.at(-1).answer.includes(code));
    assert.doesNotMatch(
      view.before(pumpkin, lang) +
        view
          .after(pumpkin, lang)
          .replace(/<details class="ready-solutions">[\s\S]*?<\/details>/, ''),
      /314/,
    );
    const pixels = enriched.find((activity) => activity.id === 'portraits-pixels');
    assert.equal(pixels.ready.example.length, 8);
    for (const row of pixels.ready.example) assert.equal(row.split(':').at(-1).trim().length, 8);
  }
  const unsafe = {
    id: '<bad>',
    time: 20,
    ready: {
      prepMinutes: 2,
      group: '<img src=x>',
      setup: ['<script>x</script>'],
      exampleTitle: '<b>test</b>',
      example: ['<svg>'],
      younger: '&',
      older: '"',
      substitute: "'",
      solutions: [{ label: '<x>', hint: '<x>', answer: '<x>' }],
    },
  };
  const rendered = view.before(unsafe, 'fr') + view.after(unsafe, 'fr');
  assert.doesNotMatch(rendered, /<img|<script|<svg|<bad>|<x>/);
  assert.match(rendered, /&lt;img/);
  assert.match(
    files.get('activity-ready.css').toString(),
    /@media print[\s\S]*\.ready-solutions[\s\S]*display: none !important/,
  );
  console.log(
    'Checked 20 ready-to-use activities in FR/EN: time splits, translated kits, static/dialog parity, cipher answers, unique escape code, 8×8 grids and print spoiler protection.',
  );
}
