// Übung „Geschichten“: Geschichte lesen (mit Vorlesen und Silbenhilfe), dann 3 Fragen.

import { h, icon, overlay, wait } from '../ui.js';
import { elmaTexts } from '../content.js';
import { state } from '../store.js';
import { storiesFor, parseMarkedText, stripMarks } from '../content.js';
import { level } from '../levels.js';
import { wordEl, helpOn, helpToggleable, helpClasses } from '../syll.js';
import { speak, speakSentences, stop } from '../speech.js';
import { play } from '../sounds.js';
import { runRound } from './runner.js';

const say = (k) => elmaTexts().anleitung[k];

function pickStory(stufe) {
  const list = storiesFor(stufe);
  const read = state.progress.storiesRead;
  const unread = list.filter((g) => !read[g.id]);
  if (unread.length) return unread[Math.floor(Math.random() * unread.length)];
  return [...list].sort((a, b) => read[a.id] - read[b.id])[0];
}

export function texteScreen() {
  const stufe = level('texte');
  const story = pickStory(stufe);
  let helpToggle = null;
  const tasks = [
    { run: (ctx) => readTask(ctx, story, stufe, (v) => { helpToggle = v; }) },
    ...story.fragen.map((f, i) => ({ run: (ctx) => questionTask(ctx, story, f, i, stufe, () => helpToggle) })),
  ];
  return runRound({
    ex: 'texte', tasks, counter: 'fragen',
    onFinish: (p) => {
      p.storiesRead[story.id] = Date.now();
      p.counters.geschichten++;
    },
  });
}

/** Geschichte als Element. Gibt { el, sentences, setHelp } zurück. */
export function storyView(story, stufe, helpState = null) {
  const sentences = [];       // [{ text, words: [{el, start, end}] , el }]
  let cur = null;
  const newSentence = () => { cur = { words: [], text: '' }; sentences.push(cur); };
  newSentence();

  const reading = h('div', { class: 'reading' });
  const title = h('div', { class: 'story-title' });
  const titleTokens = parseMarkedText(story.titel)[0] || [];
  titleTokens.forEach((t, i) => { if (i) title.append(' '); title.append(t.pre, wordEl(t.silben), t.post); });

  for (const para of parseMarkedText(story.text)) {
    const p = h('p');
    para.forEach((t, i) => {
      if (i) p.append(' ');
      if (cur.text) cur.text += ' ';
      const w = wordEl(t.silben);
      w.addEventListener('click', () => { play('klick'); speak(t.silben.join('')); });
      p.append(t.pre, w, t.post);
      const start = cur.text.length + t.pre.length;
      cur.text += t.plain;
      cur.words.push({ el: w, start, end: start + t.silben.join('').length });
      if (/[.!?…]/.test(t.post)) newSentence();
    });
    reading.append(p);
    if (cur.text) newSentence();
  }
  const list = sentences.filter((s) => s.text);

  const wrap = h('div', {}, title, reading);
  const setHelp = (on) => { wrap.className = helpClasses(on); };
  setHelp(helpOn(stufe, helpState));
  return { el: wrap, sentences: list, setHelp };
}

/** Vorlesen mit Markierung des aktuellen Satzes und – wenn möglich – Wortes. */
function readAloud(view, onDone) {
  const clear = (cls) => view.el.querySelectorAll('.' + cls).forEach((x) => x.classList.remove(cls));
  speakSentences(view.sentences.map((s) => s.text), {
    // Der ganze Satz wird immer markiert – das klappt auf jedem Gerät.
    onSentence: (i) => {
      clear('in-sentence'); clear('speaking');
      view.sentences[i].words.forEach((w) => w.el.classList.add('in-sentence'));
      view.sentences[i].words[0]?.el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    },
    // Zusätzlich das einzelne Wort, wenn die Stimme Wortgrenzen meldet.
    onWord: (i, charIndex) => {
      const w = view.sentences[i].words.find((x) => charIndex >= x.start && charIndex <= x.end);
      if (!w) return;
      clear('speaking');
      w.el.classList.add('speaking');
    },
    onEnd: () => { clear('in-sentence'); clear('speaking'); onDone?.(); },
  });
}

function readTask(ctx, story, stufe, rememberHelp) {
  return new Promise((resolve) => {
    let helpState = null;
    const view = storyView(story, stufe);
    let playing = false;
    const playBtn = h('button', { class: 'btn big light', 'aria-label': 'Geschichte vorlesen' }, icon('speaker'));
    const setPlaying = (v) => { playing = v; playBtn.replaceChildren(icon(v ? 'stop' : 'speaker')); };
    playBtn.onclick = () => {
      if (playing) { stop(); setPlaying(false); view.el.querySelectorAll('.speaking').forEach((x) => x.classList.remove('speaking')); return; }
      setPlaying(true);
      readAloud(view, () => setPlaying(false));
    };
    const buttons = [playBtn];
    if (helpToggleable(stufe)) {
      helpState = helpOn(stufe);
      const helpBtn = h('button', {
        class: 'btn big light', 'aria-label': 'Silbenhilfe an oder aus',
        onclick: () => { helpState = !helpState; view.setHelp(helpState); rememberHelp(helpState); paint(); },
      });
      const paint = () => helpBtn.replaceChildren(h('span', { class: helpState ? 'syl-color' : '', style: { fontWeight: 700 } }, wordEl(['Sil', 'be'])));
      paint();
      buttons.push(helpBtn);
    }
    buttons.push(h('button', { class: 'btn big', 'aria-label': 'Fertig gelesen', onclick: () => { stop(); play('klick'); resolve({ ok: null, id: story.id }); } }, icon('check')));

    ctx.stage.append(
      h('div', { class: 'scroll', style: { background: 'var(--card)', borderRadius: '24px', padding: '8px 14px' } }, view.el),
      h('div', { class: 'row', style: { justifyContent: 'center' } }, buttons),
    );
    ctx.instruct(say('texte-lesen'), { shown: '📖 ' + say('texte-lesen') });
  });
}

function questionTask(ctx, story, f, index, stufe, getHelp) {
  return new Promise((resolve) => {
    let attempts = 0;
    const readable = state.global.readQuestions;
    const sayAll = () => speak(f.frage + ' ' + f.antworten.join('? ') + '?');

    const showText = () => {
      const view = storyView(story, stufe, getHelp());
      const ov = overlay(h('div', { style: { display: 'contents' } },
        h('div', { class: 'scroll' }, view.el),
        h('div', { class: 'row', style: { justifyContent: 'center' } },
          h('button', { class: 'btn big', 'aria-label': 'Zurück zur Frage', onclick: () => { stop(); ov.close(); } }, icon('back')))), { full: true });
    };

    const opts = h('div', { class: 'options' }, f.antworten.map((a, i) => {
      const b = h('button', { class: 'option', onclick: () => choose(i, b) }, a);
      return b;
    }));

    const choose = async (i, btn) => {
      if (btn.classList.contains('try-again')) return;
      attempts++;
      if (i === f.richtig) {
        opts.querySelectorAll('button').forEach((b) => { b.disabled = true; });
        btn.classList.add('right');
        await ctx.react('lob', 'freut');
        await wait(500);
        resolve({ ok: attempts === 1, id: `${story.id}#${index}` });
        return;
      }
      btn.classList.add('try-again');
      if (attempts === 1) {
        ctx.react(elmaTexts().nochmal[0] + ' Du kannst auch im Buch nachschauen.', 'ermutigt');
      } else {
        opts.querySelectorAll('button').forEach((b, k) => { b.disabled = true; if (k === f.richtig) b.classList.add('right'); });
        play('nochmal');
        await ctx.react('Die richtige Antwort ist: ' + f.antworten[f.richtig], 'ermutigt');
        await wait(600);
        resolve({ ok: false, id: `${story.id}#${index}` });
      }
    };

    ctx.stage.append(
      h('div', { class: 'scroll', style: { display: 'flex', flexDirection: 'column', gap: '14px' } },
        h('div', { class: 'question' },
          h('div', { class: 'text' }, f.frage),
          readable ? h('button', { class: 'btn round light', 'aria-label': 'Frage vorlesen', onclick: sayAll }, icon('speaker')) : null),
        opts),
      h('div', { class: 'row', style: { justifyContent: 'center' } },
        h('button', { class: 'btn big light', 'aria-label': 'Geschichte ansehen', onclick: showText }, icon('book'))),
    );
    if (index === 0) ctx.instruct(say('texte-fragen'), { shown: '❓ ' + stripMarks(story.titel) });
    else ctx.instruct('', { speakIt: false, shown: '❓ ' + stripMarks(story.titel) });
  });
}
