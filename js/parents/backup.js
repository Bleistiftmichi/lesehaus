// Elternbereich › Sicherung (Export/Import) und Info (Datenschutz, Technik).

import { h, confirmBox, toast } from '../ui.js';
import { state, exportAll, importAll, applyLook } from '../store.js';
import { isPersisted, requestPersist, isMemoryOnly } from '../db.js';
import { setRate, setVoice } from '../speech.js';
import { APP_VERSION } from '../version.js';
import { section } from './form.js';

function fileName() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `lesehaus-sicherung-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.json`;
}

export async function exportBackup() {
  const data = await exportAll();
  const text = JSON.stringify(data, null, 1);
  const name = fileName();
  const file = new File([text], name, { type: 'application/json' });
  // iPhone/iPad: Teilen-Menü (→ „In Dateien sichern“, AirDrop, Mail …)
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Lesehaus-Sicherung' });
      return 'geteilt';
    } catch (e) {
      if (e.name === 'AbortError') return 'abgebrochen';
    }
  }
  const url = URL.createObjectURL(file);
  const a = h('a', { href: url, download: name, style: { display: 'none' } });
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 2000);
  return 'geladen';
}

export function backupTab(ctx) {
  const msg = h('p', { class: 'gate-msg' });
  const input = h('input', {
    type: 'file', accept: 'application/json,.json', style: { display: 'none' },
    onchange: async (e) => {
      const f = e.target.files[0];
      e.target.value = '';
      if (!f) return;
      try {
        const obj = JSON.parse(await f.text());
        if (obj?.app !== 'lesehaus') throw new Error('Das ist keine Lesehaus-Sicherung.');
        const when = obj.exportiert ? new Date(obj.exportiert).toLocaleString('de-DE') : 'unbekannt';
        if (!(await confirmBox(`Sicherung vom ${when} wiederherstellen? Alles, was jetzt auf diesem Gerät gespeichert ist, wird dabei ersetzt.`, { yes: 'Wiederherstellen', danger: true }))) return;
        await importAll(obj);
        setRate(state.global.speechRate);
        setVoice(state.global.voiceURI);
        applyLook();
        toast('Sicherung wiederhergestellt ✓');
        ctx.rerender();
      } catch (err) {
        msg.textContent = 'Das hat nicht geklappt: ' + (err.message || err);
        msg.className = 'gate-msg warn';
      }
    },
  });

  return h('div', {},
    section('Sicherung erstellen',
      h('p', {}, 'Speichert alles in eine Datei: Kinder, Fortschritt, Sterne, Abzeichen, Spielwelt, eigene Inhalte und Einstellungen.'),
      h('button', {
        class: 'btn', onclick: async () => {
          const r = await exportBackup();
          if (r !== 'abgebrochen') { msg.textContent = 'Sicherung erstellt ✓'; msg.className = 'gate-msg'; }
        },
      }, '💾 Sicherung exportieren'),
      h('p', { class: 'muted small' }, 'Auf dem iPhone öffnet sich das Teilen-Menü: „In Dateien sichern“ wählen (z. B. iCloud Drive) oder per AirDrop/Mail verschicken.')),
    section('Sicherung wiederherstellen',
      h('button', { class: 'btn light', onclick: () => input.click() }, '📂 Sicherungsdatei wählen'),
      input, msg),
    section('Wichtig zu wissen',
      h('p', { class: 'note' }, 'Die Daten liegen nur in Safari auf diesem Gerät. Sie gehen verloren, wenn „Verlauf und Websitedaten löschen“ gewählt, die App vom Home-Bildschirm gelöscht oder Safari-Speicher bereinigt wird. Deshalb ab und zu eine Sicherung exportieren – und vor einem Gerätewechsel unbedingt.')),
  );
}

export async function infoTab() {
  const persisted = await isPersisted();
  const sr = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  return h('div', {},
    section('Lesehaus',
      h('p', {}, `Version ${APP_VERSION}`),
      h('p', { class: 'muted small' }, 'Eine Lese-Lern-App mit Elma, dem kleinen Drachen. Alle Texte, Wörter und Bilder sind eigens für diese App gemacht.')),
    section('Datenschutz',
      h('ul', {},
        h('li', {}, 'Keine Werbung, keine Tracker, keine Analyse.'),
        h('li', {}, 'Die App schickt keine Daten ins Internet. Nach dem ersten Laden läuft sie komplett offline.'),
        h('li', {}, 'Namen, Fortschritt und eigene Inhalte bleiben nur auf diesem Gerät.'),
        h('li', {}, 'Die Vorlesestimme ist die Sprachausgabe des Geräts. Sie läuft auf dem Gerät, außer eine Stimme ist im Auswahlfeld als „(online)“ markiert.'))),
    section('Speicher',
      h('p', {}, isMemoryOnly()
        ? '⚠️ Dieser Browser erlaubt kein dauerhaftes Speichern (z. B. privates Fenster). Fortschritt geht beim Schließen verloren.'
        : persisted ? '✓ Der Browser hat zugesagt, die Daten nicht automatisch zu löschen.'
          : 'Der Browser hat (noch) nicht zugesagt, die Daten dauerhaft zu behalten. Auf dem iPhone hilft es, die App zum Home-Bildschirm hinzuzufügen und regelmäßig zu benutzen.'),
      persisted ? null : h('button', { class: 'btn light', onclick: async () => { const r = await requestPersist(); toast(r ? 'Zugesagt ✓' : 'Nicht zugesagt'); } }, 'Erneut anfragen')),
    section('Spracherkennung (Experiment, Etappe 3)',
      h('p', {}, sr ? 'Dieser Browser bietet Spracherkennung an.' : 'Dieser Browser bietet keine Spracherkennung an.'),
      h('p', { class: 'note' }, 'Safari auf iPhone und iPad erkennt Sprache mit der Diktierfunktion von Apple. Ob das auf dem Gerät oder auf Apple-Servern passiert, kann eine Web-App nicht feststellen und nicht steuern. Wir gehen deshalb davon aus, dass gesprochene Audiodaten an Apple gesendet werden können. Darum ist die Funktion standardmäßig aus.')),
    section('Schrift und Lizenzen',
      h('p', { class: 'small' }, 'Schrift „Andika“ von SIL International, SIL Open Font License 1.1 (assets/fonts/Andika-OFL.txt).')),
  );
}
