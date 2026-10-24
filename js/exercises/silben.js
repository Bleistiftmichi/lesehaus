// Übung „Silben & Wörter“: Lesen mit Silbenhilfe, Silben-Puzzle, Silben klatschen.

import { h, icon, shuffle, wait, pickOne } from '../ui.js';
import { elmaTexts } from '../content.js';
import { settings } from '../store.js';
import { wordsFor } from '../content.js';
import { level, chooseItems } from '../levels.js';
import { wordEl, helpClasses } from '../syll.js';
import { speak, speakSyllables } from '../speech.js';
import { play } from '../sounds.js';
import { runRound } from './runner.js';

const say = (k) => elmaTexts().anleitung[k];

export function silbenScreen() {
  const stufe = level('silben');
  const pool = wordsFor(stufe, settings().wortquelle).filter((w) => w.silbenListe.length >= 2);
  const words = chooseItems(pool, 8, 'silben');
  const kinds = ['lesen', 'lesen', ...shuffle(['puzzle', 'puzzle', 'puzzle', 'klatschen', 'klatschen', 'klatschen'])];
  const tasks = words.map((w, i) => ({ run: (ctx) => TASKS[kinds[i] || 'puzzle'](ctx, w, pool) }));
  return runRound({ ex: 'silben', tasks });
}

const TASKS = { lesen: readTask, puzzle: puzzleTask, klatschen: clapTask };

/** Wort mit Silbenhilfe lesen; Silben antippen zum Anhören. Wird nicht gewertet. */
function readTask(ctx, w) {
  return new Promise((resolve) => {
    const big = h('div', { class: 'big-word ' + helpClasses(true) },
      wordEl(w.silbenListe, {
        onSyllable: (i, el) => {
          big.querySelectorAll('.tapped').forEach((x) => x.classList.remove('tapped'));
          el.classList.add('tapped');
          speak(w.silbenListe[i].toLowerCase());
        },
      }));
    ctx.stage.append(
      h('div', { class: 'grow center' }, big),
      h('div', { class: 'row', style: { justifyContent: 'center' } },
        h('button', { class: 'btn big light', 'aria-label': 'Wort anhören', onclick: () => speakSyllables(w.silbenListe, (i) => mark(big, i)).then(() => speak(w.text)) }, icon('speaker')),
        h('button', { class: 'btn big', 'aria-label': 'Weiter', onclick: () => { play('klick'); resolve({ ok: null, id: w.id }); } }, icon('check'))),
    );
    ctx.instruct(say('silben-lesen'));
  });
}

function mark(container, i) {
  container.querySelectorAll('.syl').forEach((s, k) => s.classList.toggle('tapped', k === i));
}

/** Silben in die richtige Reihenfolge bringen (Antippen oder Ziehen). */
function puzzleTask(ctx, w, pool) {
  return new Promise((resolve) => {
    const target = w.silbenListe;
    let tiles = target.map((s, i) => ({ s, key: 't' + i }));
    if (ctx.stufe >= 3) {
      const other = pickOne(pool.filter((x) => x.id !== w.id));
      const extra = other && pickOne(other.silbenListe.filter((s) => !target.some((t) => t.toLowerCase() === s.toLowerCase())));
      if (extra) tiles.push({ s: extra.toLowerCase(), key: 'x' });
    }
    // Mischen, aber nicht in der richtigen Reihenfolge lassen
    let order = shuffle(tiles);
    for (let k = 0; k < 5 && order.slice(0, target.length).map((t) => t.s).join('') === target.join(''); k++) order = shuffle(tiles);

    const slots = h('div', { class: 'slots', 'aria-label': 'Hier das Wort bauen' });
    const poolEl = h('div', { class: 'pool' });
    const filled = new Array(target.length).fill(null);
    let attempts = 0;
    let locked = false;

    const renderSlots = () => {
      slots.replaceChildren(...filled.map((t, i) => h('div', {
        class: 'slot' + (t ? ' filled' : ''),
        onclick: () => { if (!locked && t) { filled[i] = null; render(); play('klick'); } },
      }, t ? h('span', { class: 'tilebtn', style: { border: 'none', boxShadow: 'none' } }, t.s) : '')));
    };
    const renderPool = () => {
      poolEl.replaceChildren(...order.map((t) => {
        const used = filled.includes(t);
        const b = h('button', { class: 'tilebtn' + (used ? ' used' : ''), 'aria-label': 'Silbe ' + t.s }, t.s);
        enableDrag(b, t);
        return b;
      }));
    };
    const render = () => { renderSlots(); renderPool(); };

    const place = (t, slotIndex = null) => {
      if (locked || filled.includes(t)) return;
      let i = slotIndex !== null && !filled[slotIndex] ? slotIndex : filled.indexOf(null);
      if (i < 0) return;
      filled[i] = t;
      play('klick');
      render();
      if (!filled.includes(null)) check();
    };

    const check = async () => {
      locked = true;
      attempts++;
      const ok = filled.map((t) => t.s).join('').toLowerCase() === target.join('').toLowerCase();
      if (ok) {
        slots.classList.add('good');
        slots.replaceChildren(h('div', { class: 'big-word ' + helpClasses(true), style: { fontSize: 'calc(48px * var(--font-scale))' } }, wordEl(target)));
        await ctx.react('lob', 'freut', { say: false });
        await speak(w.text);
        await wait(500);
        resolve({ ok: attempts === 1, id: w.id, wordId: w.id });
        return;
      }
      slots.classList.add('wiggle');
      if (attempts === 1) {
        ctx.react('nochmal', 'ermutigt', { say: false });
        await speak(line2(w.text));
        slots.classList.remove('wiggle');
        filled.fill(null);
        locked = false;
        render();
      } else {
        await wait(400);
        slots.classList.remove('wiggle');
        slots.replaceChildren(h('div', { class: 'big-word ' + helpClasses(true), style: { fontSize: 'calc(48px * var(--font-scale))' } }, wordEl(target)));
        await ctx.react('loesung', 'ermutigt');
        await speakSyllables(target);
        await speak(w.text);
        await wait(400);
        resolve({ ok: false, id: w.id, wordId: w.id });
      }
    };

    function enableDrag(btn, t) {
      let start = null, ghost = null;
      btn.addEventListener('pointerdown', (e) => {
        if (locked || filled.includes(t)) return;
        start = { x: e.clientX, y: e.clientY };
        btn.setPointerCapture(e.pointerId);
      });
      btn.addEventListener('pointermove', (e) => {
        if (!start) return;
        if (!ghost && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 10) {
          const r = btn.getBoundingClientRect();
          ghost = btn.cloneNode(true);
          ghost.classList.add('dragging');
          ghost.style.width = r.width + 'px';
          document.body.append(ghost);
          btn.style.visibility = 'hidden';
        }
        if (ghost) {
          ghost.style.left = e.clientX - ghost.offsetWidth / 2 + 'px';
          ghost.style.top = e.clientY - ghost.offsetHeight / 2 + 'px';
        }
      });
      const end = (e) => {
        if (!start) return;
        const wasDrag = !!ghost;
        start = null;
        if (ghost) { ghost.remove(); ghost = null; btn.style.visibility = ''; }
        if (!wasDrag) { place(t); return; }
        const r = slots.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top - 20 && e.clientY <= r.bottom + 20) {
          const slotEls = [...slots.children];
          const idx = slotEls.findIndex((s) => { const b = s.getBoundingClientRect(); return e.clientX >= b.left && e.clientX <= b.right; });
          place(t, idx >= 0 ? idx : null);
        }
      };
      btn.addEventListener('pointerup', end);
      btn.addEventListener('pointercancel', () => { start = null; if (ghost) { ghost.remove(); ghost = null; btn.style.visibility = ''; } });
    }

    render();
    ctx.stage.append(
      h('div', { class: 'grow center', style: { gap: '18px' } }, slots, poolEl),
      h('div', { class: 'row', style: { justifyContent: 'center' } },
        h('button', { class: 'btn big light', 'aria-label': 'Wort anhören', onclick: () => speak(w.text) }, icon('speaker'), '👂')),
    );
    ctx.instruct(say('silben-puzzle')).then(() => { if (ctx.alive()) speak(w.text); });
    if (!ctx.alive()) return;
  });
}

const line2 = (word) => 'Hör noch mal: ' + word;

/** Für jede Silbe einmal klatschen. */
function clapTask(ctx, w) {
  return new Promise((resolve) => {
    let count = 0;
    let attempts = 0;
    const dots = h('div', { class: 'clap-dots', 'aria-live': 'polite' });
    const big = h('div', { class: 'big-word' }, w.text);
    const done = h('button', { class: 'btn big', disabled: true, 'aria-label': 'Fertig', onclick: () => check() }, icon('check'));
    const renderDots = () => { dots.replaceChildren(...Array.from({ length: count }, () => h('i'))); done.disabled = count === 0; };
    const clap = h('button', {
      class: 'clap-btn', 'aria-label': 'Klatschen',
      onclick: () => { if (count < 8) { count++; play('klatsch'); renderDots(); } },
    }, '👏');

    const showSyllables = async () => {
      big.replaceChildren(wordEl(w.silbenListe));
      big.className = 'big-word ' + helpClasses(true);
      await speakSyllables(w.silbenListe, (i) => mark(big, i));
    };

    const check = async () => {
      attempts++;
      const ok = count === w.silbenListe.length;
      clap.disabled = true; done.disabled = true;
      if (ok) {
        ctx.react('lob', 'freut', { say: false });
        await speak(`${w.silbenListe.length} Silben!`);
        await showSyllables();
        await wait(400);
        resolve({ ok: attempts === 1, id: w.id, wordId: w.id });
      } else if (attempts === 1) {
        await ctx.react('nochmal', 'ermutigt');
        count = 0; renderDots();
        clap.disabled = false;
      } else {
        ctx.react(`Das Wort hat ${w.silbenListe.length} Silben. Hör mal:`, 'ermutigt', { say: false });
        await speak(`Das Wort hat ${w.silbenListe.length} Silben. Hör mal:`);
        await showSyllables();
        await wait(400);
        resolve({ ok: false, id: w.id, wordId: w.id });
      }
    };

    ctx.stage.append(
      h('div', { class: 'grow center', style: { gap: '14px' } },
        big,
        h('div', { class: 'clap-area' }, clap, dots)),
      h('div', { class: 'row', style: { justifyContent: 'center' } },
        h('button', { class: 'btn big light', 'aria-label': 'Wort anhören', onclick: () => speak(w.text) }, icon('speaker')),
        h('button', { class: 'btn big light', 'aria-label': 'Nochmal zählen', onclick: () => { count = 0; renderDots(); } }, icon('again')),
        done),
    );
    ctx.instruct(say('silben-klatschen'));
  });
}
