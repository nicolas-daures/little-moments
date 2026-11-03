'use strict';
(function () {
  // Shared by the home dialog and static page generation: one rendering of each kit.
  const words = {
    fr: {
      prep: 'Préparation',
      together: 'À vivre ensemble',
      group: 'Pour qui ?',
      timing:
        'Le temps total annoncé inclut la préparation et l’activité. Les durées restent indicatives.',
      setup: 'Avant de commencer',
      adapt: 'À votre rythme',
      younger: 'Plus simple',
      older: 'Pour aller plus loin',
      substitute: 'Avec ce que vous avez',
      solutions: 'Indices et solutions — pour l’adulte',
      hint: 'Un indice',
      answer: 'Solution',
      printNote: 'Les indices et solutions pour l’adulte ne sont pas inclus dans l’impression.',
    },
    en: {
      prep: 'Preparation',
      together: 'Time together',
      group: 'Who is it for?',
      timing: 'The advertised total includes preparation and the activity. Times are estimates.',
      setup: 'Before you start',
      adapt: 'At your own pace',
      younger: 'Make it simpler',
      older: 'Take it further',
      substitute: 'Use what you have',
      solutions: 'Hints and solutions — for the adult',
      hint: 'A hint',
      answer: 'Solution',
      printNote: 'Adult hints and solutions are not included in the printed activity.',
    },
  };
  const escape = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (character) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character],
    );
  const list = (items) => items.map((item) => '<li>' + escape(item) + '</li>').join('');
  const heading = (level) => (level === 2 ? 'h2' : 'h3');
  function before(activity, language, level = 3) {
    const ready = activity.ready;
    if (!ready) return '';
    const w = words[language] || words.fr;
    const h = heading(level);
    return `<section class="ready-start" data-ready-id="${escape(activity.id)}">
      <dl class="ready-facts">
        <div><dt>${w.prep}</dt><dd>${ready.prepMinutes} min</dd></div>
        <div><dt>${w.together}</dt><dd>${activity.time - ready.prepMinutes} min</dd></div>
        <div><dt>${w.group}</dt><dd>${escape(ready.group)}</dd></div>
      </dl>
      <p class="ready-timing">${w.timing}</p>
      <${h}>${w.setup}</${h}><ul class="ready-setup">${list(ready.setup)}</ul>
    </section>`;
  }
  function after(activity, language, level = 3) {
    const ready = activity.ready;
    if (!ready) return '';
    const w = words[language] || words.fr;
    const h = heading(level);
    const solutions = ready.solutions?.length
      ? `<details class="ready-solutions">
      <summary>${w.solutions}</summary>
      <p class="ready-print-note">${w.printNote}</p>
      <ol>${ready.solutions
        .map(
          (item) => `<li>
        <strong>${escape(item.label)}</strong>
        <p><b>${w.hint} :</b> ${escape(item.hint)}</p>
        <p><b>${w.answer} :</b> ${escape(item.answer)}</p>
      </li>`,
        )
        .join('')}</ol>
    </details>`
      : '';
    return `<section class="ready-example" data-ready-example="${escape(activity.id)}">
      <${h}>${escape(ready.exampleTitle)}</${h}>
      <ul class="ready-prompts">${list(ready.example)}</ul>
    </section>${solutions}
    <section class="ready-variants">
      <${h}>${w.adapt}</${h}>
      <dl><div><dt>${w.younger}</dt><dd>${escape(ready.younger)}</dd></div>
      <div><dt>${w.older}</dt><dd>${escape(ready.older)}</dd></div>
      <div><dt>${w.substitute}</dt><dd>${escape(ready.substitute)}</dd></div></dl>
    </section>`;
  }
  window.SITE_READY = { before, after };
})();
