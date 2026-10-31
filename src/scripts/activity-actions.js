'use strict';
(function () {
  const t = (...args) => window.SITE_I18N.t(...args);
  const $ = (id) => document.getElementById(id);
  async function shareActivity(a, url) {
    const id = a.id;
    const data = {
      title: `${a.title} — Les petits moments`,
      text: t('shareText', { title: a.title }),
      url: url,
    };
    if (navigator.share) {
      try {
        await navigator.share(data);
        return { id, shared: true };
      } catch (error) {
        if (error?.name === 'AbortError') return { id, shared: false };
      }
    }
    try {
      await navigator.clipboard.writeText(data.url);
      const status = $('share-status');
      if (status) {
        status.textContent = t('copied');
        setTimeout(() => {
          status.textContent = '';
        }, 2200);
      }
      return { id, copied: true };
    } catch {
      window.prompt(t('copyPrompt'), data.url);
      return { id, copied: false };
    }
  }
  function localDateValue(date = new Date()) {
    const pad = (value) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
  function calendarDate(date) {
    const pad = (value) => String(value).padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
  }
  function escapeCalendarText(value) {
    return String(value)
      .replace(/\\/g, '\\\\')
      .replace(/\r?\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');
  }
  function addToCalendar(activity, activityLink) {
    const id = activity.id;
    const dateInput = $('plan-date');
    const timeInput = $('plan-time');
    const status = $('plan-status');
    if (!dateInput.value) {
      status.textContent = t('calendarDateRequired');
      dateInput.focus();
      return { id, created: false };
    }
    const [year, month, day] = dateInput.value.split('-').map(Number);
    const [hour, minute] = (timeInput.value || '14:00').split(':').map(Number);
    const start = new Date(year, month - 1, day, hour, minute);
    const end = new Date(start.getTime() + activity.time * 60 * 1000);
    const now = new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}Z$/, 'Z');
    const description = [
      activity.desc,
      `${t('materials')}: ${activity.materials.join(', ')}`,
      activityLink,
    ].join('\n');
    const content = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Les petits moments//Activity calendar//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${id}-${Date.now()}@les-petits-moments`,
      `DTSTAMP:${now}`,
      `DTSTART:${calendarDate(start)}`,
      `DTEND:${calendarDate(end)}`,
      `SUMMARY:${escapeCalendarText(activity.title)}`,
      `DESCRIPTION:${escapeCalendarText(description)}`,
      `URL:${activityLink}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activity.id}.ics`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = t('calendarReady');
    return { id, created: true, date: dateInput.value, time: timeInput.value || '14:00' };
  }

  window.SITE_ACTIVITY_ACTIONS = {
    share: shareActivity,
    calendar: addToCalendar,
    localDate: localDateValue,
  };
})();
