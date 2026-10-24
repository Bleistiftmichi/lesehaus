// Elternbereich › Fortschritt

import { h } from '../ui.js';
import { loadProgress, EXERCISES, EXERCISE_NAMES, today } from '../store.js';
import { hardWords } from '../levels.js';
import { findWord, badgeList } from '../content.js';
import { section } from './form.js';

const pct = (a, b) => (b ? Math.round(a / b * 100) + ' %' : '–');
const mins = (s) => Math.round((s || 0) / 60);

export async function progressTab(ctx) {
  const p = ctx.profile;
  if (!p) return h('p', {}, 'Noch kein Kind angelegt.');
  const pr = await loadProgress(p.id);

  // Übungszeit der letzten 7 Tage
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({ label: d.toLocaleDateString('de-DE', { weekday: 'short' }), min: mins(pr.days[today(d)]) });
  }
  const week = days.reduce((s, d) => s + d.min, 0);
  const maxMin = Math.max(10, ...days.map((d) => d.min));

  const rows = EXERCISES.map((ex) => {
    const scored = pr.log.filter((e) => e.ex === ex && e.ok !== null);
    const last = scored.slice(-50);
    const L = pr.levels[ex];
    return h('tr', {},
      h('td', {}, EXERCISE_NAMES[ex]),
      h('td', {}, `${L.stufe}${L.fixiert ? ' 🔒' : ''}`),
      h('td', {}, pct(last.filter((e) => e.ok).length, last.length)),
      h('td', {}, pct(scored.filter((e) => e.ok).length, scored.length), h('div', { class: 'muted small' }, `${scored.length} Aufg.`)));
  });

  const hard = hardWords(pr);
  const badgeCount = Object.keys(pr.badges).length;

  return h('div', {},
    section('Übungszeit',
      h('p', {}, `Heute: ${mins(pr.days[today()])} Min. · Letzte 7 Tage: ${week} Min.`),
      h('div', { class: 'bars', 'aria-label': 'Minuten pro Tag' }, days.map((d) => h('div', {},
        h('span', {}, d.min || ''),
        h('b', { style: { height: (d.min / maxMin * 85) + '%' } }),
        h('span', {}, d.label))))),
    section('Stufen und Trefferquote',
      h('table', {},
        h('tr', {}, h('th', {}, 'Übung'), h('th', {}, 'Stufe'), h('th', {}, 'Letzte 50'), h('th', {}, 'Gesamt')),
        rows),
      h('p', { class: 'muted small' }, 'Die Stufe steigt automatisch, wenn von den letzten 10 Aufgaben mindestens 85 % stimmen, und sinkt unter 60 %. 🔒 = im Elternbereich festgelegt.')),
    section('Sammlung',
      h('p', {}, `⭐ ${pr.stars} Sterne (insgesamt ${pr.counters.sterneGesamt || 0}) · 🏅 ${badgeCount} von ${badgeList().length} Abzeichen · 📖 ${pr.counters.geschichten} Geschichten gelesen`)),
    section('Schwierige Wörter',
      hard.length
        ? h('table', {}, h('tr', {}, h('th', {}, 'Wort'), h('th', {}, 'falsch'), h('th', {}, 'gesehen')),
          hard.map((w) => h('tr', {}, h('td', {}, findWord(w.id)?.silben || w.id), h('td', {}, w.wrong), h('td', {}, w.seen))))
        : h('p', { class: 'muted' }, 'Noch keine – oder alles richtig gelesen!'),
      h('p', { class: 'muted small' }, 'Schwierige Wörter kommen in den Übungen automatisch öfter dran.')),
  );
}
