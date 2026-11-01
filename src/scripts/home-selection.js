'use strict';
(function () {
  // Prefer a fresh, varied shortlist, without relaxing any of the visitor's criteria.
  function select(activities, previous = [], random = Math.random) {
    const unique = [...new Map(activities.map((activity) => [activity.id, activity])).values()];
    const oldIds = new Set(previous);
    const shuffle = (items) => {
      const result = [...items];
      for (let index = result.length - 1; index > 0; index--) {
        const target = Math.floor(random() * (index + 1));
        [result[index], result[target]] = [result[target], result[index]];
      }
      return result;
    };
    const fresh = shuffle(unique.filter((activity) => !oldIds.has(activity.id)));
    const recycled = shuffle(unique.filter((activity) => oldIds.has(activity.id)));
    const selection = [];
    for (const pool of [fresh, recycled]) {
      for (const activity of pool) {
        if (selection.length === 3) break;
        if (!selection.some((item) => item.category === activity.category))
          selection.push(activity);
      }
      for (const activity of pool) {
        if (selection.length === 3) break;
        if (!selection.includes(activity)) selection.push(activity);
      }
    }
    return selection;
  }
  window.SITE_HOME_SELECTION = { select };
})();
