# Lesehaus

Eine Lese-Lern-App für Grundschulkinder (ab Klasse 2) mit Elma, dem kleinen mintgrünen Drachen.
Sie läuft im Browser und lässt sich auf dem iPhone wie eine echte App auf den Home-Bildschirm legen.
Nach dem ersten Öffnen funktioniert sie **komplett offline**.

## Was die App kann

- **Silben & Wörter:** Wörter mit farbigen Silben (Blau/Rot) oder Silbenbögen lesen, Silben-Puzzle (antippen oder ziehen), Silben klatschen.
- **Blitzlesen:** Ein Wort (später eine Wortgruppe oder ein Satz) blitzt kurz auf, danach wählt das Kind aus ähnlichen Wörtern. Die Einblendezeit beginnt bei 1,5 Sekunden und wird kürzer, je sicherer das Kind wird.
- **Geschichten:** 36 eigene Kurzgeschichten über Pferde, Tiere und Freundschaft, je mit 3 Fragen. Der Text lässt sich während der Fragen wieder aufrufen. Es gibt keinen Zeitdruck.
- **Vorlesen:** Antippen eines Wortes liest es vor. Geschichten werden Satz für Satz vorgelesen, der gerade gesprochene Satz ist markiert. Meldet die Stimme Wortgrenzen, wird zusätzlich das einzelne Wort markiert.
- **6 Stufen** je Übung: Liegen von den letzten 10 Aufgaben mindestens 85 % richtig, geht es eine Stufe hoch, unter 60 % eine Stufe runter. Im Elternbereich lässt sich die Stufe auch fest einstellen.
- **Belohnungen:** 1–3 Sterne pro Übung und 21 Abzeichen. Die Spielwelt, in der man Sterne ausgibt, kommt in Etappe 2.
- **Mehrere Kinderprofile**, jedes mit eigenem Fortschritt.
- **Elternbereich** mit PIN und Rechenaufgabe:
  - Fortschritt (Übungszeit, Trefferquote, schwierige Wörter)
  - Einstellungen
  - eigene Wörter und Geschichten
  - Sicherung (Export und Import)
- **Datenschutz:** keine Werbung, keine Tracker, keine Netzwerkanfragen. Alles Persönliche bleibt auf dem Gerät.

## Inhalte ergänzen

**Am einfachsten im Elternbereich → „Eigene Inhalte“.** Dort kannst du Lernwörter aus der Schule als Liste anlegen, mehrere auf einmal, eins pro Zeile. Unter „Einstellungen“ wählst du dann „Nur eigene Liste“. Diese Inhalte liegen nur auf dem Gerät und gehören deshalb in die Sicherung.

**Für alle (im Code)** liegen die Inhalte im Ordner `content/`:

| Datei | Inhalt |
|---|---|
| `content/words.json` | Wörter: `text`, `silben` (mit Bindestrich, z. B. `Ba-na-ne`), `stufe` 1–6, 3 `ablenker` fürs Blitzlesen, `themen` |
| `content/blitz-saetze.json` | Wortgruppen und Sätze fürs Blitzlesen (Stufe 3–6) |
| `content/stories/stufe-N.json` | Geschichten. In `titel` und `text` werden die Silben mit `\|` getrennt (`Lu\|po ist ein Po\|ny.`), Absätze mit einer Leerzeile (`\n\n`). Je Frage: `antworten`, `richtig` (Nummer der richtigen Antwort, ab 0), `art` (`fakt`, `warum`, `schluss`) |
| `content/elma-saetze.json` | Was Elma sagt (Lob, Tipps, Anleitungen) |
| `content/badges.json` | Abzeichen. Neue Abzeichen brauchen zusätzlich eine Regel in `js/levels.js` |

Nach Änderungen prüfen (dafür muss Node installiert sein):

```bash
npm run check
```

## Auf dem Mac ausprobieren

```bash
npm start
```

Dann im Browser http://localhost:8080 öffnen.

Tests, die mit Playwright ein iPhone nachstellen und die Screenshots nach `tests/screenshots/` schreiben:

```bash
npm test
```

## Änderungen veröffentlichen

1. Etwas ändern.
2. In `sw.js` **und** `js/version.js` die Versionsnummer erhöhen, z. B. `1.0.0` → `1.0.1`. Ohne diesen Schritt bekommt das iPhone die Änderung nicht.
3. Neue Dateien in `sw.js` unter `ASSETS` eintragen. `npm run check` meldet, wenn eine fehlt.
4. Hochladen, siehe `ANLEITUNG-GITHUB.md`.

Auf dem iPhone erscheint beim nächsten Öffnen der Hinweis **„Neue Version verfügbar – Neu laden“**.

## Technik in Kürze

- Reines HTML, CSS und JavaScript (ES-Module), kein Build-Schritt.
- `sw.js` (Service Worker) speichert alle Dateien fürs Offline-Arbeiten.
- Gespeichert wird lokal in IndexedDB (`js/db.js`). Die App bittet den Browser über `navigator.storage.persist()`, die Daten nicht zu löschen.
- Die Sprachausgabe nutzt die Web Speech API (`speechSynthesis`, de-DE) und wählt automatisch die beste deutsche Stimme.
- Schrift: Andika (SIL Open Font License, `assets/fonts/`).
- `package.json` und `node_modules` braucht nur die Testumgebung, nicht die App.
