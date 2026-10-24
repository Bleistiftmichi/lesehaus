// Übung „Blitzlesen“: Ein Wort (später eine Wortgruppe oder ein Satz) blitzt kurz auf,
// danach wählt das Kind aus ähnlichen Wörtern.

import { h, icon, shuffle, wait } from '../ui.js';
import { elmaTexts } from '../content.js';
import { state, settings } from '../store.js';
import { wordsFor, phrasesFor } from '../content.js';
import { level, chooseItems } from '../levels.js';
import { speak } from '../speech.js';
import { play } from '../sounds.js';
import { runRound } from './runner.js';

const say = (k) => elmaTexts().anleitung[k];
const PHRASE_SHARE = { 1: 0, 2: 0, 3: 0.3, 4: 0.5, 5: 0.6, 6: 0.7 };

export function blitzScreen() {
  const stufe = level('blitz');
  const quelle = settings().wortquelle;
  const nPhrases = quelle.startsWith('liste:') ? 0 : Math.round(8 * (PHRASE_SHARE[stufe] || 0));
  const phrases = chooseItems(phrasesFor(stufe), nPhrases, 'blitz').map((p) => ({ ...p, phrase: true }));
  const words = chooseItems(wordsFor(stufe, quelle), 8 - phrases.length, 'blitz');
  const items = shuffle([...words, ...phrases]);
  const tasks = items.map((item, i) => ({ run: (ctx) => flashTask(ctx, item, i === 0) }));
  return runRound({ ex: 'blitz', tasks });
}

function showTime(item) {
  const base = state.progress.blitzMs || settings().blitzStartMs;
  if (item.phrase) return Math.round(base * (1 + 0.45 * (item.text.split(/\s+/).length - 1)));
  return Math.round(base * (1 + 0.06 * Math.max(0, item.text.length - 6)));
}

function flashTask(ctx, item, first) {
  return new Promise((resolve) => {
    const box = h('div', { class: 'flash-box' + (item.phrase ? ' phrase' : ''), 'aria-live': 'off' });
    const short = !item.phrase && [item.text, ...(item.ablenker || [])].every((t) => t.length <= 9);
    const optionsEl = h('div', { class: 'options' + (short ? ' two' : '') });
    const replay = h('button', { class: 'btn light', disabled: true, 'aria-label': 'Nochmal zeigen' }, icon('eye'));
    let replayed = false;
    ctx.stage.append(box, optionsEl, h('div', { class: 'row', style: { justifyContent: 'center' } }, replay));

    const flash = async () => {
      box.replaceChildren(h('div', { class: 'dot' }));
      await wait(700);
      if (!ctx.alive()) return;
      box.replaceChildren(item.text);
      await wait(showTime(item));
      box.replaceChildren(h('span', { class: 'mask' }, '? ? ?'));
    };

    replay.onclick = async () => {
      if (replayed) return;
      replayed = true;
      replay.disabled = true;
      await flash();
    };

    const nOpts = ctx.stufe <= 2 && !item.phrase ? 3 : 4;
    const opts = shuffle([item.text, ...shuffle(item.ablenker || []).slice(0, nOpts - 1)]);

    const showOptions = () => {
      optionsEl.replaceChildren(...opts.map((o) => {
        const b = h('button', { class: 'option' + (item.phrase ? '' : ' word-opt'), onclick: () => choose(o, b) }, o);
        return b;
      }));
    };

    const choose = async (o, btn) => {
      optionsEl.querySelectorAll('button').forEach((b) => { b.disabled = true; });
      replay.disabled = true;
      const ok = o === item.text;
      box.replaceChildren(item.text);
      if (ok) {
        btn.classList.add('right');
        ctx.react('lob', 'freut', { say: false });
        await speak(item.text);
      } else {
        btn.classList.add('try-again');
        optionsEl.querySelectorAll('button').forEach((b) => { if (b.textContent === item.text) b.classList.add('right'); else if (b !== btn) b.classList.add('dim'); });
        play('nochmal');
        ctx.react('Das war knapp! Es war:', 'ermutigt', { say: false });
        await speak('Das war knapp! Es war: ' + item.text);
      }
      await wait(700);
      resolve({ ok, id: item.id, wordId: item.phrase ? null : item.id });
    };

    (async () => {
      const k = item.phrase ? 'blitz-achtung-satz' : 'blitz-achtung';
      // Die Anweisung nur beim ersten Wort vorlesen, sonst wird es langatmig.
      await ctx.instruct(say(k), first ? {} : { speakIt: false });
      if (!ctx.alive()) return;
      await flash();
      if (!ctx.alive()) return;
      showOptions();
      replay.disabled = false;
      ctx.instruct(say(item.phrase ? 'blitz-waehlen-satz' : 'blitz-waehlen'), first ? {} : { speakIt: false });
    })();
  });
}
