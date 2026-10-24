# Lesehaus veröffentlichen – Schritt für Schritt

Die App wird kostenlos über **GitHub Pages** veröffentlicht. GitHub speichert die Dateien und stellt sie als Webseite bereit.

> **Vorher wissen:** Das Repository ist öffentlich, jeder kann den Code sehen. Persönliches ist darin nicht enthalten: Namen, Fortschritt und eigene Wörter liegen nur auf dem iPhone.

## 1. GitHub-Konto anlegen (einmalig)

1. Öffne https://github.com/signup.
2. Gib E-Mail, Passwort und einen Benutzernamen ein. Der Benutzername erscheint später in der Adresse der App, z. B. `michi-liest`.
   - Tipp: Wähle keinen Benutzernamen, der den Namen deiner Tochter enthält.
3. Bestätige die E-Mail mit dem Code, den GitHub dir schickt.
4. Wähle den kostenlosen Tarif („Free“).

## 2. GitHub Desktop installieren (einmalig)

Damit lädst du Dateien hoch, ohne Befehle tippen zu müssen.

1. Lade das Programm von https://desktop.github.com herunter und installiere es.
2. Öffne GitHub Desktop und melde dich mit deinem neuen Konto an („Sign in to GitHub.com“).

## 3. Projekt hochladen (einmalig)

1. In GitHub Desktop: **File → Add Local Repository…**
2. Wähle den Ordner `Michis Programme/lesehaus`. Er ist schon als Git-Ordner vorbereitet.
3. Links stehen jetzt alle Dateien. Unten links bei „Summary“ trägst du `Erste Version` ein und klickst auf **Commit to main**.
4. Oben auf **Publish repository** klicken:
   - Name: `lesehaus`
   - **Haken bei „Keep this code private“ entfernen.** GitHub Pages ist im kostenlosen Tarif nur für öffentliche Repositorys verfügbar.
   - **Publish Repository** klicken.

## 4. GitHub Pages einschalten (einmalig)

1. Öffne im Browser `https://github.com/DEIN-BENUTZERNAME/lesehaus`.
2. Klicke oben auf **Settings**, dann links auf **Pages**.
3. Wähle bei „Build and deployment“ → „Source“ die Option **Deploy from a branch**.
4. Stelle „Branch“ auf **main** und den Ordner auf **/ (root)**, dann **Save**.
5. Nach 1–2 Minuten steht dort: „Your site is live at `https://DEIN-BENUTZERNAME.github.io/lesehaus/`“.

## 5. Auf dem iPhone installieren

1. Öffne die Adresse in **Safari**. Das muss Safari sein, nicht Chrome.
2. Tippe unten auf das **Teilen-Symbol** (Quadrat mit Pfeil nach oben).
3. Wähle **„Zum Home-Bildschirm“** (eventuell etwas nach unten scrollen) und dann **Hinzufügen**.
4. Starte die App über das neue Icon mit Elma. Sie läuft jetzt im Vollbild und ohne Internet.
5. Beim ersten Start richtest du die PIN und das erste Kind ein.

**Bessere Stimme:** Geh auf dem iPhone zu Einstellungen → Bedienungshilfen → Gesprochene Inhalte → Stimmen → Deutsch und lade z. B. „Anna (Erweitert)“. Danach die App einmal schließen und neu öffnen.

**Wichtig:** Die Daten liegen nur in der App auf dem iPhone. Exportiere deshalb ab und zu eine Sicherung (Elternbereich → Sicherung → In Dateien sichern). Löschst du die App vom Home-Bildschirm oder die Safari-Websitedaten, ist der Fortschritt weg.

## 6. Updates veröffentlichen

1. Ändere etwas, z. B. mit Claude Code.
2. Erhöhe die Version in `sw.js` und `js/version.js`, z. B. auf `1.0.1`.
3. In GitHub Desktop: Summary ausfüllen → **Commit to main** → oben **Push origin**.
4. Nach 1–2 Minuten ist die neue Version online.
5. **Auf dem iPhone:** App öffnen. Sie prüft beim Öffnen, ob es ein Update gibt. Dann erscheint unten **„Neue Version verfügbar – Neu laden“**. Antippen, fertig. Klappt das nicht sofort, die App ganz schließen (vom unteren Rand hochwischen) und neu öffnen.

Fortschritt und Einstellungen bleiben bei Updates erhalten.
