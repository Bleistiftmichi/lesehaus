// Gemeinsamer Ablauf einer Übungsrunde: Fortschrittspunkte, Anweisung mit 🔊,
// Elmas Rückmeldung, Speichern nach jeder Aufgabe, Ergebnis am Ende.

import { h, iconButton, svg } from '../ui.js';
import { elmaMarkup, line } from '../elma.js';
import { state, saveProgress, trackActivity, resetActivityClock, settings, secondsToday } from '../store.js';
import { record, evaluateLevel, starsFor, addStars, checkBadges, level } from '../levels.js';
import { speak, stop } from '../speech.js';
import { play } from '../sounds.js';
import { go, current } from '../router.js';

/**
 * tasks: [{ run(ctx) → Promise<{ ok: true|false|null, id, wordId? }> }]
 * counter: welcher Zähler pro gewerteter Aufgabe erhöht wird (silben/blitz/…)
 */
export function runRound({ ex, tasks, counter = ex, onFinish }) {
  const screenName = current();
  const dots = h('div', { class: 'progress-dots', 'aria-hidden': 'true' }, tasks.map(() => h('span')));
  const instrText = h('div', { class: 'text' });
  let instrSpoken = '';
  const instr = h('div', { class: 'instruction' }, instrText);
  const stage = h('div', { class: 'stage' });
  const elmaFig = h('div', { class: 'elma small' });
  const fbText = h('div', { class: 'bubble-text' });
  const feedback = h('div', { class: 'elma-row hidden', style: { minHeight: '84px' } }, elmaFig, h('div', { class: 'bubble', style: { marginBottom: '20px' } }, fbText));

  const screen = h('div', { class: 'screen narrow' },
    h('div', { class: 'topbar' },
      iconButton('close', () => { stop(); go('home'); }, { label: 'Übung beenden' }),
      dots,
      iconButton('speaker', () => speak(instrSpoken), { label: 'Anweisung vorlesen' })),
    instr, stage, feedback);

  const alive = () => current() === screenName && screen.isConnected;

  const ctx = {
    stage,
    stufe: level(ex),
    /** Anweisung zeigen und (wenn eingestellt) vorlesen. Wartet aufs Vorlesen. */
    instruct(text, { speakIt = state.global.autoSpeak, shown = text } = {}) {
      instrText.textContent = shown;
      instrSpoken = text;
      return speakIt ? speak(text) : Promise.resolve();
    },
    /** Elma reagiert. kind: 'lob' | 'nochmal' | 'loesung' | freier Text */
    react(kind, mood = 'freut', { say = true, extra = '' } = {}) {
      const t = (['lob', 'nochmal', 'loesung'].includes(kind) ? line(kind) : kind) + (extra ? ' ' + extra : '');
      fbText.textContent = t;
      elmaFig.replaceChildren(svg(elmaMarkup(mood)));
      feedback.classList.remove('hidden');
      if (kind === 'lob') play('richtig');
      if (kind === 'nochmal') play('nochmal');
      return say ? speak(t) : Promise.resolve();
    },
    hideReaction() { feedback.classList.add('hidden'); },
    alive,
  };

  (async () => {
    await new Promise((r) => setTimeout(r, 0));   // warten, bis der Bildschirm eingehängt ist
    resetActivityClock();
    let correct = 0;
    let scored = 0;
    for (let i = 0; i < tasks.length; i++) {
      if (!alive()) return;
      [...dots.children].forEach((d, k) => { d.className = k < i ? 'done' : k === i ? 'now' : ''; });
      stage.replaceChildren();
      ctx.hideReaction();
      const res = await tasks[i].run(ctx);
      if (!alive()) return;
      record(ex, res.id, res.ok, res.wordId);
      trackActivity();
      if (res.ok !== null) {
        scored++;
        if (res.ok) correct++;
        state.progress.counters[counter] = (state.progress.counters[counter] || 0) + 1;
      }
      await saveProgress();
    }
    if (!alive()) return;
    // Rundenende
    const p = state.progress;
    const stars = starsFor(correct, scored);
    addStars(stars);
    p.counters.runden++;
    if (scored && correct === scored) p.counters.perfekt++;
    onFinish?.(p);
    const levelChange = evaluateLevel(ex);
    const badges = checkBadges();
    const goal = settings().dailyGoal * 60;
    const goalReached = goal > 0 && secondsToday() >= goal && !p.goalShown?.[today()] && markGoal(p);
    await saveProgress();
    go('result', { ex, stars, correct, total: scored, levelChange, stufe: p.levels[ex].stufe, badges, goalReached });
  })();

  return screen;
}

function today() { return new Date().toDateString(); }
function markGoal(p) { p.goalShown = { [today()]: true }; return true; }
