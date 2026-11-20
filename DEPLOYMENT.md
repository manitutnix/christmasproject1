# Deployment auf GitHub Pages

Das Projekt ist eine reine statische Seite. Es braucht **keinen Build** und
**keinen Server**. GitHub Pages ist kostenlos, zeigt keine Werbung und stellt
automatisch HTTPS bereit.

## 1. Repository anlegen

1. Bei [GitHub](https://github.com) anmelden.
2. **New repository** klicken.
3. Name z. B. `weihnachtszauber-charlotte`.
4. Für den kostenlosen Plan ein **public** Repository wählen.
5. Repository ohne README/Gitignore/Lizenz anlegen – die Dateien liegen ja schon
   lokal bereit.

## 2. Lokal committen und pushen

Im Ordner `M:\OpenCodeTestSpace\Project1`:

```powershell
git init
git add .
git commit -m "Initial commit: Weihnachtszauber mit Charlotte"
git branch -M main
git remote add origin https://github.com/<DEIN-NAME>/<REPO-NAME>.git
git push -u origin main
```

`<DEIN-NAME>` und `<REPO-NAME>` durch die echten Werte ersetzen.

> Falls der Ordner schon ein Git-Repo ist, die Zeilen `git init` und
> `git branch -M main` einfach weglassen.

## 3. GitHub Pages aktivieren

1. Im Repository auf **Settings** gehen.
2. Links im Menü **Pages** auswählen.
3. Bei **Build and deployment**:
   - **Source:** `Deploy from a branch`
   - **Branch:** `main`
   - **Folder:** `/ (root)`
4. **Save** klicken.

Nach ein bis zwei Minuten ist das Spiel erreichbar unter:

```text
https://<DEIN-NAME>.github.io/<REPO-NAME>/
```

## 4. Wichtige Hinweise

- `index.html` muss im **Wurzelverzeichnis** bleiben.
- Alle Pfade sind relativ (`assets/game/...`, `css/style.css`, `js/game.js`).
  Bitte kein `<base>`-Tag oder absolute `M:\...`-Pfade ergänzen.
- GitHub Pages läuft auf Linux: **Dateinamen sind case-sensitive**. Die vorhandenen
  Asset-Namen sind alle kleingeschrieben und passen zum Code.
- Nach Änderungen einfach erneut pushen:

```powershell
git add .
git commit -m "Update: ..."
git push
```

GitHub Pages baut die Seite dann automatisch neu.

## 5. Eigene Domain (optional)

Im Repository eine Datei `CNAME` mit der gewünschten Domain anlegen, z. B.:

```text
weihnachten.example.com
```

Anschließend bei DNS einen `CNAME`-Record auf `<DEIN-NAME>.github.io` setzen und
in den Pages-Einstellungen die Domain eintragen.

## 6. Kurz testen nach dem Deploy

- Startbild und Inventar erscheinen.
- Vogel lässt den Stock fallen; Stock ist anklickbar.
- Baumklick lässt die Kugel fallen; Hammer aus dem Zelt.
- Reparatur mit allen drei Teilen startet das Rennen.
- Zielbanner erscheint erst kurz vor Schluss.
- Neustart funktioniert.
- Browser-Konsole enthält keine Fehler.
