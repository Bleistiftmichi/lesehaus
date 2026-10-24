// Elternbereich › Eigene Inhalte: Wörter (z. B. Lernwörter aus der Schule) und Geschichten.

import { h, overlay, confirmBox, icon } from '../ui.js';
import { state, saveCustom } from '../store.js';
import { autoDistractors, allWords, stripMarks, parseMarkedText } from '../content.js';
import { suggestSyllables, suggestMarkedText } from '../syll.js';
import { field, select, section } from './form.js';

const uid = (prefix) => prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const STUFEN = [1, 2, 3, 4, 5, 6].map((n) => [n, 'Stufe ' + n]);
const forWhom = () => [['', 'Alle Kinder'], ...state.profiles.map((p) => [p.id, 'Nur ' + p.name])];
const whoName = (id) => (id ? state.profiles.find((p) => p.id === id)?.name || '?' : 'alle');

/** Prüft „Ba-na-ne“ gegen „Banane“. */
function checkSyllables(word, silben) {
  if (!word) return 'Bitte ein Wort eingeben.';
  if (/\s/.test(word)) return 'Bitte nur ein Wort ohne Leerzeichen.';
  if (silben.replace(/-/g, '') !== word) return `Die Silben ergeben nicht „${word}“. Bitte Bindestriche nur zwischen die Silben setzen.`;
  return '';
}

export function contentTab(ctx) {
  return h('div', {}, wordsSection(ctx), storiesSection(ctx));
}

// ---------------- Wörter ----------------

function wordsSection(ctx) {
  const words = state.custom.woerter;
  const groups = {};
  for (const w of words) (groups[w.liste || 'Ohne Liste'] ||= []).push(w);

  return section('Eigene Wörter',
    h('p', { class: 'muted small' }, 'Eigene Wörter kommen in „Silben“ und „Blitzlesen“ dran – passend zur Stufe, oder als eigene Liste (unter Einstellungen → „Wörter für Silben und Blitzlesen“).'),
    h('div', { class: 'row wrap' },
      h('button', { class: 'btn', onclick: () => wordForm(ctx) }, icon('plus'), 'Wort'),
      h('button', { class: 'btn light', onclick: () => bulkForm(ctx) }, 'Mehrere Wörter (Lernwörter)')),
    Object.entries(groups).map(([liste, list]) => h('div', {},
      h('h4', {}, `${liste} (${list.length})`),
      list.map((w) => h('div', { class: 'list-item' },
        h('div', { class: 'grow' }, h('b', {}, w.silben), ' ', h('span', { class: 'chip' }, 'Stufe ' + w.stufe), ' ', h('span', { class: 'muted small' }, whoName(w.profil))),
        h('button', { class: 'btn light round', 'aria-label': 'Bearbeiten', onclick: () => wordForm(ctx, w) }, icon('edit')),
        h('button', {
          class: 'btn light round', 'aria-label': 'Löschen',
          onclick: async () => {
            if (await confirmBox(`„${w.text}“ löschen?`, { yes: 'Löschen', danger: true })) {
              state.custom.woerter = state.custom.woerter.filter((x) => x !== w);
              await saveCustom(); ctx.rerender();
            }
          },
        }, icon('trash')))))),
    words.length ? null : h('p', { class: 'muted' }, 'Noch keine eigenen Wörter.'));
}

function listInput(value) {
  const lists = [...new Set(state.custom.woerter.map((w) => w.liste).filter(Boolean))];
  const id = 'lists-' + Math.random().toString(36).slice(2, 6);
  return [h('input', { type: 'text', value, list: id, placeholder: 'z. B. Lernwörter Schule' }), h('datalist', { id }, lists.map((l) => h('option', { value: l })))];
}

function wordForm(ctx, w = null) {
  let silbenTouched = !!w;
  const text = h('input', { type: 'text', value: w?.text || '', autocapitalize: 'off', autocomplete: 'off', placeholder: 'z. B. Banane' });
  const silben = h('input', { type: 'text', value: w?.silben || '', autocapitalize: 'off', autocomplete: 'off', placeholder: 'Ba-na-ne', oninput: () => { silbenTouched = true; } });
  text.addEventListener('input', () => { if (!silbenTouched) silben.value = suggestSyllables(text.value); });
  let stufe = w?.stufe || 2;
  let profil = w?.profil || '';
  const [liste, datalist] = listInput(w?.liste || 'Meine Wörter');
  const abl = h('input', { type: 'text', value: (w?.ablenker || []).join(', '), placeholder: 'leer lassen = automatisch' });
  const msg = h('p', { class: 'gate-msg warn' });

  const ov = overlay(h('div', { class: 'scroll parents' },
    h('h2', {}, w ? 'Wort bearbeiten' : 'Wort hinzufügen'),
    field('Wort', text),
    field('Silben mit Bindestrich', silben, 'Der Vorschlag ist nur geraten – bitte prüfen! Beispiel: Zu-cker, Kat-ze, Fens-ter, Pfer-de-stall.'),
    field('Stufe', select(STUFEN, stufe, (v) => { stufe = Number(v); })),
    field('Liste', h('div', {}, liste, datalist)),
    field('Für', select(forWhom(), profil, (v) => { profil = v; })),
    field('Ähnliche Wörter fürs Blitzlesen (3, mit Komma)', h('div', { class: 'row' }, abl,
      h('button', { class: 'btn light', type: 'button', onclick: () => { abl.value = autoDistractors(text.value.trim(), allWords()).join(', '); } }, 'Vorschlag'))),
    msg,
    h('div', { class: 'row', style: { justifyContent: 'flex-end' } },
      h('button', { class: 'btn light', onclick: () => ov.close() }, 'Abbrechen'),
      h('button', {
        class: 'btn',
        onclick: async () => {
          const t = text.value.trim();
          const s = silben.value.trim().replace(/\s+/g, '');
          const err = checkSyllables(t, s);
          if (err) { msg.textContent = err; return; }
          const ablenker = abl.value.split(',').map((x) => x.trim()).filter((x) => x && x !== t).slice(0, 3);
          const data = { text: t, silben: s, stufe, liste: liste.value.trim() || 'Meine Wörter', profil: profil || null, ablenker: ablenker.length === 3 ? ablenker : null };
          if (w) Object.assign(w, data);
          else state.custom.woerter.push({ id: uid('cw-'), ...data });
          await saveCustom();
          ov.close(); ctx.rerender();
        },
      }, 'Speichern')),
  ), { full: true });
  text.focus();
}

function bulkForm(ctx) {
  const area = h('textarea', { placeholder: 'Ein Wort pro Zeile, z. B.\nFahrrad\nSchule\nFreundin', autocapitalize: 'off' });
  let stufe = 3;
  let profil = '';
  const [liste, datalist] = listInput('Lernwörter Schule');
  const rows = h('div', {});
  const msg = h('p', { class: 'gate-msg warn' });
  let entries = [];

  const prepare = () => {
    const lines = [...new Set(area.value.split(/\n/).map((l) => l.trim()).filter(Boolean))];
    entries = lines.map((line) => {
      const [t, s] = line.split('=').map((x) => x?.trim());
      const word = (s ? s.replace(/-/g, '') : t).replace(/\s+/g, '');
      return { text: word, input: h('input', { type: 'text', value: s || suggestSyllables(word) }) };
    });
    rows.replaceChildren(h('p', { class: 'note' }, 'Bitte die Silbentrennung jedes Wortes prüfen und bei Bedarf korrigieren (Bindestrich zwischen den Silben).'),
      ...entries.map((e) => h('div', { class: 'list-item' }, h('div', { style: { width: '40%' } }, h('b', {}, e.text)), h('div', { class: 'grow' }, e.input))));
    saveBtn.disabled = !entries.length;
  };

  const saveBtn = h('button', {
    class: 'btn', disabled: true,
    onclick: async () => {
      for (const e of entries) {
        const err = checkSyllables(e.text, e.input.value.trim());
        if (err) { msg.textContent = `${e.text}: ${err}`; e.input.focus(); return; }
      }
      const name = liste.value.trim() || 'Lernwörter';
      for (const e of entries) {
        state.custom.woerter.push({ id: uid('cw-'), text: e.text, silben: e.input.value.trim(), stufe, liste: name, profil: profil || null, ablenker: null });
      }
      await saveCustom();
      ov.close(); ctx.rerender();
    },
  }, 'Alle speichern');

  const ov = overlay(h('div', { class: 'scroll parents' },
    h('h2', {}, 'Mehrere Wörter hinzufügen'),
    field('Wörter', area, 'Ein Wort pro Zeile. Wer möchte, kann die Trennung gleich mitschreiben: Fahrrad = Fahr-rad'),
    h('button', { class: 'btn light', onclick: prepare }, 'Silben vorschlagen ↓'),
    rows,
    field('Liste', h('div', {}, liste, datalist)),
    field('Stufe', select(STUFEN, stufe, (v) => { stufe = Number(v); })),
    field('Für', select(forWhom(), profil, (v) => { profil = v; })),
    msg,
    h('div', { class: 'row', style: { justifyContent: 'flex-end' } },
      h('button', { class: 'btn light', onclick: () => ov.close() }, 'Abbrechen'), saveBtn),
  ), { full: true });
}

// ---------------- Geschichten ----------------

function storiesSection(ctx) {
  const list = state.custom.geschichten;
  return section('Eigene Geschichten',
    h('p', { class: 'muted small' }, 'Eigene Geschichten erscheinen in „Geschichten“ auf der gewählten Stufe – zuerst die noch nicht gelesenen.'),
    h('button', { class: 'btn', onclick: () => storyForm(ctx) }, icon('plus'), 'Geschichte'),
    list.map((g) => h('div', { class: 'list-item' },
      h('div', { class: 'grow' }, h('b', {}, stripMarks(g.titel)), ' ', h('span', { class: 'chip' }, 'Stufe ' + g.stufe), ' ', h('span', { class: 'muted small' }, whoName(g.profil))),
      h('button', { class: 'btn light round', 'aria-label': 'Bearbeiten', onclick: () => storyForm(ctx, g) }, icon('edit')),
      h('button', {
        class: 'btn light round', 'aria-label': 'Löschen',
        onclick: async () => {
          if (await confirmBox(`Geschichte „${stripMarks(g.titel)}“ löschen?`, { yes: 'Löschen', danger: true })) {
            state.custom.geschichten = state.custom.geschichten.filter((x) => x !== g);
            await saveCustom(); ctx.rerender();
          }
        },
      }, icon('trash')))),
    list.length ? null : h('p', { class: 'muted' }, 'Noch keine eigenen Geschichten.'));
}

function storyForm(ctx, g = null) {
  const titel = h('input', { type: 'text', value: g ? stripMarks(g.titel) : '', placeholder: 'Titel' });
  const plain = h('textarea', { placeholder: 'Text der Geschichte. Leerzeile = neuer Absatz.' }, g ? stripMarks(g.text) : '');
  const marked = h('textarea', { placeholder: 'Hier erscheint der Text mit Silbenstrichen, z. B. Lu|po ist ein Po|ny.' }, g?.text || '');
  let stufe = g?.stufe || 3;
  let profil = g?.profil || '';
  const msg = h('p', { class: 'gate-msg warn' });

  const qs = [0, 1, 2].map((i) => {
    const f = g?.fragen[i];
    let richtig = f?.richtig ?? 0;
    const frage = h('input', { type: 'text', value: f?.frage || '', placeholder: `Frage ${i + 1}` });
    const name = 'r' + i + Math.random().toString(36).slice(2, 5);
    const answers = [0, 1, 2].map((k) => h('input', { type: 'text', value: f?.antworten[k] || '', placeholder: k === 0 ? 'Antwort' : 'Andere Antwort' }));
    const radios = answers.map((a, k) => h('label', { class: 'row', style: { gap: '8px', margin: '4px 0' } },
      h('input', { type: 'radio', name, checked: k === richtig, style: { width: '26px', height: '26px' }, onchange: () => { richtig = k; } }),
      h('div', { class: 'grow' }, a)));
    return { el: h('div', { class: 'card' }, h('b', {}, `Frage ${i + 1}`), frage, h('div', { class: 'muted small' }, 'Antworten – richtige anklicken:'), radios),
      get: () => ({ frage: frage.value.trim(), antworten: answers.map((a) => a.value.trim()), richtig, art: 'fakt' }) };
  });

  const ov = overlay(h('div', { class: 'scroll parents' },
    h('h2', {}, g ? 'Geschichte bearbeiten' : 'Geschichte hinzufügen'),
    field('Titel', titel),
    field('Stufe', select(STUFEN, stufe, (v) => { stufe = Number(v); })),
    field('Für', select(forWhom(), profil, (v) => { profil = v; })),
    field('Text', plain),
    h('button', { class: 'btn light', onclick: () => { marked.value = suggestMarkedText(plain.value); } }, 'Silbenstriche vorschlagen ↓'),
    field('Text mit Silbenstrichen', marked, 'Für die farbige Silbenhilfe. Der Vorschlag ist nur geraten – bitte prüfen und mit | korrigieren (Pfer|de|stall).'),
    qs.map((q) => q.el),
    msg,
    h('div', { class: 'row', style: { justifyContent: 'flex-end' } },
      h('button', { class: 'btn light', onclick: () => ov.close() }, 'Abbrechen'),
      h('button', {
        class: 'btn',
        onclick: async () => {
          const t = titel.value.trim();
          if (!t) { msg.textContent = 'Bitte einen Titel eingeben.'; return; }
          if (!plain.value.trim() && !marked.value.trim()) { msg.textContent = 'Bitte einen Text eingeben.'; return; }
          if (!marked.value.trim()) { marked.value = suggestMarkedText(plain.value); msg.textContent = 'Silbenstriche wurden vorgeschlagen – bitte prüfen und dann noch einmal speichern.'; return; }
          const norm = (x) => x.replace(/\s+/g, ' ').trim();
          if (plain.value.trim() && norm(stripMarks(marked.value)) !== norm(plain.value)) {
            msg.textContent = 'Text und Text mit Silbenstrichen passen nicht zusammen. Tipp: „Silbenstriche vorschlagen“ noch einmal drücken.'; return;
          }
          const fragen = qs.map((q) => q.get()).filter((f) => f.frage);
          if (fragen.length < 1 || fragen.some((f) => f.antworten.some((a) => !a))) { msg.textContent = 'Bitte mindestens eine Frage mit drei Antworten ausfüllen.'; return; }
          const data = { titel: suggestMarkedText(t), text: marked.value.trim(), stufe, profil: profil || null, fragen };
          if (!parseMarkedText(data.text).length) { msg.textContent = 'Der Text ist leer.'; return; }
          if (g) Object.assign(g, data);
          else state.custom.geschichten.push({ id: uid('cg-'), ...data });
          await saveCustom();
          ov.close(); ctx.rerender();
        },
      }, 'Speichern')),
  ), { full: true });
}
