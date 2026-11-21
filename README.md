# Weihnachtszauber mit Charlotte

Ein kleines, browserbasiertes Retro-Pixel-Adventure auf Deutsch: Charlotte sammelt
**Hammer**, **Weihnachtskugel** und **Stock**, repariert den Rodel und fährt ein
kurzes Rennen bis ins Ziel.

## Live-Demo

Spielbar auf GitHub Pages:
**[https://manitutnix.github.io/christmasproject1/](https://manitutnix.github.io/christmasproject1/)**

- Reine Web-Technik: HTML5, CSS3, Vanilla JavaScript
- Kein Framework, kein Build-Schritt, kein Server nötig
- Punkt-und-Klick-Szenen, Inventar, Animationen und WebAudio-Sounds
- Vollständig relative Pfade – ideal für GitHub Pages
- Automatische Passgenau-Skalierung auf kleine Displays (16:9, Querformat empfohlen)
- Vergrößerte UI-Schrift und Touch-Flächen auf kleinen Geräten; kein Leertasten-Hinweis im Spiel
- Dauerhaft sichtbares Titelbanner „Charlottes Weihnachtszauber“ sowie Vollbild- und Reset-Schalter oben rechts
- Bonus-Level ab dem Glückwunschbildschirm: 30 Sekunden Weihnachtskugeln fangen, vier Farben und vier Größen mit unterschiedlichen Punkten, Highscore-Anzeige ganz oben und dauerhaft gespeicherter Highscore
- Kleine Online-Bestliste für das Bonus-Level über Supabase (mit lokalem Fallback) – Einrichtung siehe [SUPABASE.md](SUPABASE.md)

## Lokal starten

Einfach `index.html` in einem modernen Browser öffnen. Alternativ im Projektordner
ein kleiner statischer Server, falls gewünscht:

```powershell
python -m http.server 8000
```

Danach `http://localhost:8000` aufrufen.

## Spielablauf

1. Im Zelt die Werkzeugkiste öffnen und den Hammer nehmen.
2. Den Weihnachtsbaum anklicken – eine Kugel fällt herunter und wird aufgehoben.
3. Der erste Vogel lässt den Stock ganz links zwischen den Tannen fallen.
4. Mit allen drei Teilen auf den Rodel klicken und das Rennen gewinnen.
5. Charlotte gibt auf wiederholte Klicks immer genauere Tipps.
6. Nach dem Sieg im Glückwunschbildschirm auf **🎁 Bonus-Level** klicken: Mit Zeiger/Touch oder `←`/`→` bzw. `A`/`D` Kugeln fangen. Rote Kugeln geben 10, grüne 15, blaue 20 und violette 25 Punkte. Der Highscore bleibt erhalten.

## Struktur

- `index.html` – Spielgerüst, Dialog, Inventar, Endbildschirm
- `css/style.css` – Retro-Layout und Animationen
- `js/game.js` – Spiellogik, Szenen und Asset-Pfade
- `js/leaderboard.js`, `js/supabase-config.js` – Bonus-Bestliste
- `assets/game/` – Laufzeit-Sprites
- `assets/source/` – 1x-Master-Canvas für spätere Sprite-Arbeit
- `assets/retro-noise.svg` – Retro-Overlay
- `docs/Gemini_Generated_a3.jpg` – lokale Stil-Referenz (nicht im Git-Repo)
- `PROJEKT_PLAN.md` – ausführliche deutsche Projektdokumentation
- `DEPLOYMENT.md` – Anleitung für GitHub Pages
- `SUPABASE.md` – Einrichtung der Online-Bestliste
- `LICENSE` – MIT-Lizenz

## KI-Hinweis

Code und Pixel-Art dieses Projekts wurden mit KI-Unterstützung erstellt.
Die Sprites wurden mit einem KI-gestützten Pixel-Art-Werkzeug angefertigt;
die lokale Stilreferenz `docs/Gemini_Generated_a3.jpg` stammt aus einer
Gemini-Bildgenerierung und ist bewusst nicht Teil des Repositories.

## Lizenz

Dieses Projekt steht unter der [MIT-Lizenz](LICENSE).

## Deployment

Siehe [DEPLOYMENT.md](DEPLOYMENT.md).
