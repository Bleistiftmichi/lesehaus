// Elternbereich › Einstellungen (pro Kind und für alle)

import { h } from '../ui.js';
import { state, saveGlobal, saveProfiles, loadProgress, saveProgress, applyLook, EXERCISES, EXERCISE_NAMES, DEFAULT_GLOBAL } from '../store.js';
import { customLists } from '../content.js';
import { germanVoices, currentVoice, setRate, setVoice, speak } from '../speech.js';
import { wordEl, helpClasses } from '../syll.js';
import { field, toggle, select, range, stepper, section } from './form.js';

export async function settingsTab(ctx) {
  const p = ctx.profile;
  const g = state.global;
  const out = h('div', {});

  if (p) {
    const s = p.settings;
    const pr = await loadProgress(p.id);
    const saveP = async () => { await saveProfiles(); if (p.id === state.profile?.id) applyLook(); };
    const savePr = () => saveProgress(p.id, pr);

    out.append(section(`Stufen für ${p.name}`,
      h('p', { class: 'muted small' }, 'Stufe 1: kurze Wörter mit 2 Silben · 2: 3 Silben · 3: Konsonanten-Häufung, ei/au/eu/ie · 4: kurze Texte · 5: längere Texte, wörtliche Rede · 6: lange Texte, Nachdenk-Fragen.'),
      ...EXERCISES.map((ex) => {
        const L = pr.levels[ex];
        return h('div', { class: 'list-item' },
          h('div', { class: 'grow' }, h('b', {}, EXERCISE_NAMES[ex])),
          stepper({ min: 1, max: 6, value: L.stufe, onchange: (v) => { L.stufe = v; L.since = Date.now(); if (ex === 'blitz') pr.blitzMs = s.blitzStartMs; savePr(); } }),
          h('label', { class: 'row small', style: { gap: '6px' } },
            h('input', { type: 'checkbox', checked: L.fixiert, style: { width: '26px', height: '26px' }, onchange: (e) => { L.fixiert = e.target.checked; savePr(); } }),
            'fixieren'));
      }),
      h('p', { class: 'muted small' }, '„Fixieren“ schaltet die automatische Anpassung für diese Übung aus.')));

    const preview = h('div', { class: 'reading', style: { padding: 0, fontSize: `calc(28px * ${s.fontScale})` } });
    const paintPreview = () => {
      preview.style.fontSize = `calc(28px * ${s.fontScale})`;
      preview.className = 'reading ' + helpClasses(s.silbenhilfe !== 'nie');
      preview.replaceChildren(wordEl(['Pfer', 'de']), ' ', wordEl(['ga', 'lop', 'pie', 'ren']), ' ', wordEl(['ü', 'ber']), ' ', wordEl(['die']), ' ', wordEl(['Wie', 'se.']));
    };
    paintPreview();

    const lists = customLists();
    out.append(section('Lesen',
      field('Schriftgröße', range({ min: 0.8, max: 1.6, step: 0.1, value: s.fontScale, format: (v) => Math.round(v * 100) + ' %', onchange: (v) => { s.fontScale = v; paintPreview(); saveP(); } })),
      field('Silbenhilfe', select([['auto', 'Automatisch (Stufe 1–3 an, 4–5 wählbar, 6 aus)'], ['immer', 'Immer an'], ['nie', 'Immer aus']], s.silbenhilfe, (v) => { s.silbenhilfe = v; paintPreview(); saveP(); })),
      field('Darstellung', select([['farbe', 'Silben farbig'], ['boegen', 'Silbenbögen'], ['beides', 'Farbe und Bögen']], s.silbenStil, (v) => { s.silbenStil = v; paintPreview(); saveP(); })),
      preview,
      field('Wörter für Silben und Blitzlesen', select([['alle', 'Alle Wörter passend zur Stufe'], ...lists.map((l) => ['liste:' + l, 'Nur eigene Liste: ' + l])], s.wortquelle, (v) => { s.wortquelle = v; saveP(); }),
        'Eigene Listen legst du unter „Eigene Inhalte“ an (z. B. Lernwörter aus der Schule).'),
    ));

    out.append(section('Blitzlesen',
      field('Startzeit (Einblendung)', range({ min: 500, max: 3000, step: 100, value: s.blitzStartMs, format: (v) => v + ' ms', onchange: (v) => { s.blitzStartMs = v; if (s.blitzMinMs > v) s.blitzMinMs = v; pr.blitzMs = v; saveP(); savePr(); } })),
      field('Kürzeste Zeit', range({ min: 200, max: 2000, step: 50, value: s.blitzMinMs, format: (v) => v + ' ms', onchange: (v) => { s.blitzMinMs = Math.min(v, s.blitzStartMs); saveP(); } })),
      toggle('Zeit automatisch verkürzen', s.blitzAuto, (v) => { s.blitzAuto = v; saveP(); }, 'Wenn 4 von 5 Wörtern stimmen, wird die Zeit etwas kürzer; bei Fehlern wieder länger.'),
      h('p', { class: 'muted small' }, `Aktuelle Zeit: ${pr.blitzMs} ms`),
    ));

    out.append(section('Tagesziel und Pausen',
      field('Tagesziel (Minuten, 0 = aus)', h('input', { type: 'number', min: 0, max: 120, value: s.dailyGoal, onchange: (e) => { s.dailyGoal = Math.max(0, Number(e.target.value) || 0); saveP(); } })),
      field('Tageslimit (Minuten, 0 = aus)', h('input', { type: 'number', min: 0, max: 240, value: s.dailyLimit, onchange: (e) => { s.dailyLimit = Math.max(0, Number(e.target.value) || 0); saveP(); } }),
        'Ist das Limit erreicht, schlägt Elma eine Pause vor und die Übungen sind bis morgen gesperrt.'),
    ));
  }

  // ---- Für alle Kinder ----
  const voices = germanVoices();
  const cv = currentVoice();
  out.append(section('Vorlesestimme (für alle)',
    voices.length
      ? field('Stimme', select([['', 'Automatisch: beste deutsche Stimme'], ...voices.map((v) => [v.voiceURI, `${v.name}${v.localService ? '' : ' (online)'}`])], g.voiceURI || '', (v) => { g.voiceURI = v || null; setVoice(g.voiceURI); saveGlobal(); }),
        cv ? `Gerade aktiv: ${cv.name}` : '')
      : h('p', { class: 'note' }, 'Auf diesem Gerät wurde keine deutsche Stimme gefunden.'),
    field('Sprechtempo', range({ min: 0.5, max: 1.2, step: 0.05, value: g.speechRate, format: (v) => Math.round(v * 100) + ' %', onchange: (v) => { g.speechRate = v; setRate(v); saveGlobal(); } })),
    h('button', { class: 'btn light', onclick: () => speak('Hallo! Ich bin Elma. So klinge ich beim Vorlesen.') }, '🔊 Probe hören'),
    h('p', { class: 'note' }, 'Tipp fürs iPhone: Eine „erweiterte“ deutsche Stimme klingt viel natürlicher. Laden unter Einstellungen → Bedienungshilfen → Gesprochene Inhalte → Stimmen → Deutsch (z. B. „Anna (Erweitert)“). Danach die App einmal neu öffnen.'),
  ));

  const c0 = h('input', { type: 'color', value: g.colors[0], style: { width: '64px', height: '48px' }, onchange: (e) => { g.colors[0] = e.target.value; applyLook(); saveGlobal(); } });
  const c1 = h('input', { type: 'color', value: g.colors[1], style: { width: '64px', height: '48px' }, onchange: (e) => { g.colors[1] = e.target.value; applyLook(); saveGlobal(); } });
  out.append(section('Silbenfarben (für alle)',
    h('div', { class: 'row' }, c0, c1, h('span', { class: 'reading syl-color', style: { padding: 0, fontSize: '28px' } }, wordEl(['Ba', 'na', 'ne'])),
      h('span', { class: 'spacer' }),
      h('button', { class: 'btn light', onclick: () => { g.colors = [...DEFAULT_GLOBAL.colors]; applyLook(); saveGlobal(); ctx.rerender(); } }, 'Blau/Rot')),
  ));

  out.append(section('Bedienung (für alle)',
    toggle('Töne', g.sounds, (v) => { g.sounds = v; saveGlobal(); }),
    toggle('Anweisungen automatisch vorlesen', g.autoSpeak, (v) => { g.autoSpeak = v; saveGlobal(); }, 'Der 🔊-Knopf funktioniert immer.'),
    toggle('Fragen zu Geschichten vorlesbar', g.readQuestions, (v) => { g.readQuestions = v; saveGlobal(); }, 'Zeigt bei den Fragen einen 🔊-Knopf.'),
  ));

  const supported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  out.append(section('Experiment: Kind liest laut vor (Beta)',
    toggle('Spracherkennung verwenden', g.betaSpeech, (v) => { g.betaSpeech = v; saveGlobal(); }),
    h('p', { class: 'note' },
      supported ? 'Dieses Gerät bietet Spracherkennung an. ' : 'Dieses Gerät bietet keine Spracherkennung im Browser an – die Funktion bleibt ausgeblendet. ',
      'Die Übung dazu kommt in Etappe 3. Wichtig zum Datenschutz: Safari nutzt dafür die Diktierfunktion von Apple. Je nach Gerät kann die Sprache dabei an Apple-Server gesendet werden – Details unter „Info“.'),
  ));

  return out;
}
