// PIN für den Elternbereich: Eingabefeld mit Zifferntasten, Prüfung mit Rechenaufgabe.
// Die PIN wird nur als Prüfsumme (Hash) gespeichert.

import { h, overlay } from '../ui.js';
import { state, saveGlobal } from '../store.js';

async function sha256(text) {
  if (crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Rückfall ohne crypto.subtle (nur bei http ohne localhost)
  let x = 5381;
  for (const c of text) x = ((x << 5) + x + c.charCodeAt(0)) >>> 0;
  return 'djb2-' + x.toString(16);
}

export async function setPin(pin) {
  const salt = Math.random().toString(36).slice(2, 10);
  state.global.pinSalt = salt;
  state.global.pinHash = await sha256(salt + pin);
  await saveGlobal();
}

async function checkPin(pin) {
  return (await sha256(state.global.pinSalt + pin)) === state.global.pinHash;
}

/** Zifferntasten mit Punkten. onDone(code) wird nach `length` Ziffern aufgerufen. */
export function keypad({ length = 4, onDone, masked = true }) {
  let code = '';
  const dots = h('div', { class: 'pin-dots', 'aria-live': 'polite' });
  const render = () => {
    if (masked) dots.replaceChildren(...Array.from({ length }, (_, i) => h('i', { class: i < code.length ? 'on' : '' })));
    else dots.replaceChildren(h('b', { style: { fontSize: '1.4em', minHeight: '1.5em' } }, code || ' '));
  };
  const press = (d) => {
    if (d === '⌫') code = code.slice(0, -1);
    else if (d === '✓') { if (code) { const c = code; code = ''; render(); onDone(c); } return; }
    else if (code.length < length) code += d;
    render();
    if (masked && code.length === length) { const c = code; setTimeout(() => { code = ''; render(); onDone(c); }, 120); }
  };
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', masked ? '' : '✓'];
  const pad = h('div', { class: 'keypad' }, keys.map((k) => k
    ? h('button', { type: 'button', 'aria-label': k === '⌫' ? 'Löschen' : k === '✓' ? 'Fertig' : k, onclick: () => press(k) }, k)
    : h('span')));
  render();
  const el = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } }, dots, pad);
  el.reset = () => { code = ''; render(); };
  return el;
}

/** PIN zweimal eingeben lassen. Löst mit der PIN auf. */
export function pinSetup(container, { title = 'PIN festlegen' } = {}) {
  return new Promise((resolve) => {
    const msg = h('p', { class: 'gate-msg' }, 'Bitte eine 4-stellige PIN eingeben.');
    let first = null;
    const pad = keypad({
      onDone: (code) => {
        if (!first) { first = code; msg.textContent = 'Bitte die PIN noch einmal eingeben.'; msg.className = 'gate-msg'; return; }
        if (code === first) resolve(code);
        else { first = null; msg.textContent = 'Die beiden PINs waren verschieden. Bitte neu eingeben.'; msg.className = 'gate-msg warn'; }
      },
    });
    container.append(h('h2', {}, title), msg, pad);
  });
}

function mathTask(hard = false) {
  if (hard) {
    const a = 12 + Math.floor(Math.random() * 13);
    const b = 6 + Math.floor(Math.random() * 4);
    return { q: `${a} × ${b} = ?`, a: a * b };
  }
  const a = 6 + Math.floor(Math.random() * 4);
  const b = 6 + Math.floor(Math.random() * 4);
  return { q: `${a} × ${b} = ?`, a: a * b };
}

/** Rechenaufgabe; löst mit true/false auf. */
function askMath(container, hard) {
  return new Promise((resolve) => {
    const t = mathTask(hard);
    const msg = h('p', { class: 'gate-msg' }, 'Rechenaufgabe für Erwachsene:');
    const q = h('p', { style: { textAlign: 'center', fontSize: '1.6em', fontWeight: 700, margin: 0 } }, t.q);
    const pad = keypad({ length: 4, masked: false, onDone: (v) => resolve(Number(v) === t.a) });
    container.replaceChildren(h('h2', {}, 'Elternbereich'), msg, q, pad);
  });
}

/**
 * Elternbereich-Sperre: PIN + Rechenaufgabe. Löst mit true auf, wenn geöffnet.
 */
export function parentGate() {
  return new Promise((resolve) => {
    const body = h('div', { class: 'parents', style: { display: 'flex', flexDirection: 'column', gap: '12px' } });
    const ov = overlay(body, { onClose: () => resolve(false) });
    const finish = (ok) => { ov.el.remove(); resolve(ok); };
    const cancel = h('button', { class: 'btn light', onclick: () => finish(false) }, 'Abbrechen');

    const askPin = (note = 'Bitte PIN eingeben.') => {
      const msg = h('p', { class: 'gate-msg' }, note);
      const pad = keypad({
        onDone: async (code) => {
          if (await checkPin(code)) {
            const ok = await askMath(body, false);
            if (ok) finish(true); else askPin('Die Rechenaufgabe stimmte nicht. Bitte noch einmal.');
          } else {
            msg.textContent = 'Die PIN stimmt nicht.';
            msg.className = 'gate-msg warn';
          }
        },
      });
      const forgot = h('button', { class: 'btn light', onclick: resetFlow }, 'PIN vergessen?');
      body.replaceChildren(h('h2', {}, 'Elternbereich'), msg, pad, h('div', { class: 'row' }, forgot, h('span', { class: 'spacer' }), cancel));
    };

    const resetFlow = async () => {
      const ok = await askMath(body, true);
      if (!ok) return askPin('Die Rechenaufgabe stimmte nicht.');
      body.replaceChildren();
      const pin = await pinSetup(body, { title: 'Neue PIN festlegen' });
      await setPin(pin);
      finish(true);
    };

    if (!state.global.pinHash) {
      // Noch keine PIN (sollte nach dem Einrichten nicht vorkommen)
      pinSetup(body).then(async (pin) => { await setPin(pin); finish(true); });
    } else askPin();
  });
}
