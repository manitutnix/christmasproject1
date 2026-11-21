# 🎄 Weihnachtszauber mit Charlotte – Projektplan & Dokumentation

> Point & Click Adventure im Retro-Adventure-Stil (à la *Simon the Sorcerer*),
> spielbar im Browser. Charlotte, ein kleines Mädchen mit rosa Kapuze,
> soll ihren kaputten Rodel reparieren.

---

## 1. Konzept

| Element | Details |
|---------|---------|
| **Titel** | Weihnachtszauber mit Charlotte |
| **Genre** | Point & Click Adventure (2D, Browser) |
| **Stil** | Pixel-Grafik alter Adventure-Games (Simon the Sorcerer, Monkey Island etc.) |
| **Hauptperson** | Charlotte, kleines Mädchen mit rosa/pinker Kapuze |
| **Ziel (v1.0)** | Den kaputten Rodel reparieren |

### Referenzbild
Die lokale Stil-Referenz `Gemini_Generated_a3.jpg` (nicht im Git-Repo) zeigt Charlotte in rosa Kapuze
vor einem Rodel in einer verschneiten Weihnachtslandschaft mit Tannen und
Hütten. Dieses Aussehen ist die Vorlage für die Pixel-Art-Grafiken.

---

## 2. Spielablauf (Version 1.0)

1. **Szene 1 – Winterlandschaft (draußen):** Charlotte steht vor dem kaputten Rodel.
   - Klick auf den Rodel → Dialog nennt die noch fehlenden Teile.
   - Klick auf den Weihnachtsbaum → eine Kugel fällt herunter und kann aufgehoben werden.
   - Der erste Vogel lässt den Stock fallen; er landet ganz links zwischen den ersten beiden Tannen und wird per Klick eingesammelt.
   - Klick auf das Zelt → Szenenwechsel nach drinnen.
2. **Szene 2 – Zelt (innen):**
   - Klick auf die Werkzeugkiste → Hammer kommt ins Inventar.
   - Klick auf den Ausgang (linker Bereich) → Rückkehr nach draußen.
3. **Reparatur & Rennen:** Mit Hammer, Kugel und Stock im Inventar auf den Rodel
   klicken → Reparatur-Animation → Rodelrennen → Zieleinfahrt →
   **Endbildschirm** mit Neustart-Button.

---

## 3. Tech Stack

| Schicht | Technologie | Bemerkung |
|---------|-------------|-----------|
| Struktur | HTML5 | Keine Frameworks, keine Build-Schritte |
| Gestaltung | CSS3 | `image-rendering: pixelated` für scharfe Pixel |
| Logik | Vanilla JavaScript (ES6) | Szenen-Manager, Inventar, Hotspots, Endbildschirm |
| Hintergründe | Inline-SVG | Landschaft & Zelt-Innenraum als SVG im JS |
| Sprites | **Echte Pixel-Art PNGs** | Erstellt mit dem `pixelart`-MCP-Tool |
| Grafik-Erstellung | pixelart MCP | Canvas, Raster, Konturen, Export (nearest-neighbor 2×) |
| Hosting | Statisch | Direkt im Browser öffnen, kein Server nötig |

---

## 4. Dateistruktur

```
Project1/
├── index.html              # Spiel-Fenster, Dialog, Inventar, Endbildschirm
├── css/
│   └── style.css           # Pixel-Art Styling, Layout, Endbildschirm
├── js/
│   └── game.js             # Spiel-Logik, Szenen-Manager, Asset-Pfade
├── assets/
│   ├── retro-noise.svg     # Grau-Noise-Overlay auf #game (Retro-Glasaf)
│   ├── game/               # Laufzeit-Assets (scharf, nearest-neighbor)
│   │   ├── charlotte.png   # 72×120
│   │   ├── sled.png        # 112×64
│   │   ├── tree_pine.png   # 64×96
│   │   ├── christmas_tree.png # 96×128
│   │   ├── tent.png        # 112×80
│   │   ├── toolbox.png     # 64×48
│   │   ├── toolbox_big.png # 96×80
│   │   ├── toolbox_empty.png # 96×80
│   │   ├── hammer.png      # 84×78
│   │   ├── sled_fixed.png  # 128×80
│   │   ├── rider_sled.png  # 160×120 (aus charlotte.png + sled_fixed.png)
│   │   ├── bird_sit.png    # 32×24
│   │   ├── bird_fly1.png   # 32×24
│   │   ├── bird_fly2.png   # 32×24
│   │   ├── ornament.png    # 20×24
│   │   ├── stick.png       # 56×18
│   │   ├── obstacle_drift.png # 40×24
│   │   └── obstacle_rock.png  # 32×24
│   └── source/             # 1x-Master-Canvas (nur für spätere Sprite-Arbeit)
│       ├── charlotte.png   # Charlotte (36×60, transparent)
│       ├── sled.png        # Rodel (56×32)
│       ├── tree_pine.png   # Tanne (32×48)
│       ├── christmas_tree.png # Weihnachtsbaum (48×64)
│       ├── tent.png        # Zelt (56×40)
│       ├── toolbox.png     # kleine Werkzeugkiste (32×24)
│       ├── toolbox_big.png # große Kiste mit Hammer (48×40)
│       ├── toolbox_empty.png # große Kiste ohne Hammer (48×40)
│       ├── hammer.png      # Hammer (28×26)
│       ├── sled_fixed.png  # reparierter Rodel (mit goldener Klammer)
│       ├── bird_sit.png    # Vogel sitzend (16×12)
│       ├── bird_fly1.png   # Vogel Flügel hoch (16×12)
│       ├── bird_fly2.png   # Vogel Flügel runter (16×12)
│       ├── ornament.png    # Weihnachtskugel (10×12)
│       ├── stick.png       # liegender Stock (56×18)
│       ├── obstacle_drift.png # Schneewehen (20×12)
│       └── obstacle_rock.png  # Stein (16×12)
├── README.md               # Kurzüberblick und lokaler Start
├── DEPLOYMENT.md           # GitHub-Pages-Anleitung
├── LICENSE                 # MIT-Lizenz
├── .gitignore              # OS-/Editor-/Temp-Dateien ausschließen
└── PROJEKT_PLAN.md         # Diese Datei
```

---

## 5. Fortschritt (Stand heute)

### Erledigt ✅
- [x] Grundgerüst mit zwei Szenen (draußen / drinnen)
- [x] Charlotte als Pixel-Art-Sprite (rosa Kapuze, weißes Gesicht, karierte Hose, Schuhe)
- [x] Kaputter Rodel als Pixel-Art-Sprite (mit roter Beschädigung)
- [x] Schneebedeckte Tanne als Pixel-Art-Sprite
- [x] Geschmückter Weihnachtsbaum als Pixel-Art-Sprite (Lichter, Stern)
- [x] Zelt & Werkzeugkiste als Pixel-Art-Sprites
- [x] Alle Sprites mit dunklen Konturen (Retro-Look)
- [x] **Grafiken überarbeitet:** symmetrische Formen mit präzisen Zeichen-Tools
- [x] **Zelt-Innenraum neu gestaltet:** Tür mit „RAUS"-Schild, Holz Boden, Teppich, Laterne, Regal
- [x] Große Werkzeugkiste mit deutlich sichtbarem Hammer (eigenes Sprite)
- [x] **Hammer-Klick korrigiert:** Hammer liegt vollständig im Hotspots
- [x] Klickbare Hotspots (Rodel, Zelt, Werkzeugkiste, Ausgang, Kugel, Stock)
- [x] **Außenbereich detailreicher gestaltet:** Wintersonne, Hütten mit Rauch, Schneemann, Schneewehen, Fußspuren, fallender Schnee
- [x] **Beleuchtungseffekte:** Lichtpools, Vignette, Laternen
- [x] **Szenen-Geometrie vereinheitlicht:** 4px-Rahmen als box-shadow, pixelgenaues Szenen-Setup
- [x] **Mobile-Passgenauigkeit:** Die komplette 800×450-Szene wird per CSS-Transform
      auf kleine Displays skaliert (`fitToViewport`, inkl. `visualViewport` und
      Orientation-Change). Die interne Pixel-Geometrie bleibt unverändert, damit
      Hotspots, Inventar und Dialog exakt sitzen. Auf kleinen Portrait-Geräten
      erscheint ein dezenter Hinweis auf das Querformat.
- [x] **Kleine Displays:** UI-Schrift, Inventar und Touch-Flächen werden mit
      skaliert; der Rodel-Hinweis zeigt auf Touch-Geräten nur noch „Tippe, um zu
      springen!“. Effekte rechnen ihre Koordinaten über `sceneCoords()` zurück in
      Szenenpixel – nichts schwebt mehr durch CSS-Scale. Die Baumkugel liegt
      weiter links und hat eine deutlich größere Trefferfläche.
- [x] **Titelbanner & Vollbild:** „Charlottes Weihnachtszauber“ bleibt als
      festes Banner oben links sichtbar. Ein Schalter oben rechts startet den
      Vollbildmodus (`Fullscreen API`, inkl. `webkit`-Fallback, CSS-Pseudo-Vollbild
      für iOS Safari und best-effort Landscape-Lock auf Mobilgeräten). Direkt
      daneben liegt ein Reset-Schalter (↻), der jederzeit zum Anfang zurücksetzt.
      Die 800×450-Szene wird dabei weiterhin nur skaliert, nie gestaucht.
- [x] Inventarsystem (Hammer, Weihnachtskugel und Stock aufsammeln)
- [x] **Drei Sammelobjekte:** Der Hammer kommt aus dem Zelt, die Kugel fällt beim
      Baumklick herunter und wird per Hotspot aufgehoben. Der erste Vogel trägt den
      Stock im Schnabel und lässt ihn über den ersten Tannen in die Lücke bei x≈99
      fallen – erst danach ist er per Hotspot aufhebbar. Der erste Vogel erscheint
      erst 2 Sekunden nach der ersten Interaktion; die drei kleineren Tannen sind
      ebenfalls anklickbar, haben aber sonst keine Wirkung.
 - [x] **Bugfix Vogel-Timer:** Ein Szenen-Re-Render (z. B. Kugel aufheben) löscht
       den Vogel-Timer. Der Zeitpunkt des ersten Besuchs wird jetzt als `firstBirdAt`
       gespeichert und mit der Restzeit neu geplant – der Vogel kommt auch dann
       nach 2 Sekunden, wenn zuerst die Kugel vom Baum genommen wird. Das gilt
       ebenfalls für einen zwischenzeitlichen Zeltbesuch.
- [x] **Inventar verschönert:** pixeliger Werkzeuggürtel unten rechts, drei Slots,
      goldener Rahmen, Icons aus den Original-Sprites, Statuszeile und
      Pop-Animation beim Einsammeln. Dialogbox und Inventar sind unten bündig und
      exakt gleich hoch (90 px); die Textbox endet direkt vor dem Inventar.
- [x] **Charlotte-Tipps werden präziser:** Jeder Klick erhöht die Stufe – vage
      Ahnung → drei Fundorte → Objekte und Aktionen → direkter nächster Schritt
      (passend zum aktuellen Inventar). Nach der letzten Stufe bleibt der konkrete
      Tipp stehen, statt wieder von vorne zu beginnen.
- [x] **Animationen:** Rauch, Sterne (Twinkle), Kerze (Flackern), Vogel (Landen/Fliegen/Erschrecken, erster Flug mit fallendem Stock), Charlotte (fragend), Baum (Pseudo-Drehung + Kugel), Rodel (Reparatur)
- [x] Szenenwechsel zwischen Winterlandschaft und Zelt
- [x] **Rodel-Reparatur braucht jetzt alle drei Teile:** Erst mit Hammer, Kugel
      und Stock im Inventar schlägt Charlotte die Kugel und den Stock am Rodel fest
      (Hammer-Animation + Funken). Fehlende Teile werden namentlich im Dialog gemeldet.
- [x] **Rodelrennen v1.0:** Charlotte fährt mit dem Rodel, Hindernisse scrollen von rechts, Tippen/Leertaste/Pfeil hoch zum Springen
- [x] **Sprung-Fix:** `raceJumpDuration` jetzt in ms (500) – vorher Sekunden, deshalb
      endete der Sprung sofort (`t >= 1`). Jetzt läuft der Sprung über die volle Zeit.
- [x] **Klick-Sprung repariert:** Der Klick-Handler rief eine nicht mehr vorhandene
      Methode `raceJump()` auf. Die Methode ist zurück und löst zuverlässig einen
      Sprung aus; ein zweiter Klick in der Luft gibt einen kleinen Boost (gedeckelt).
- [x] **Hold/TAP-Mechanik:** lange halten = hoher Sprung (Charge über 0,4 s),
      kurzes Drücken = sicherer Hopfen (Mindesthöhe 36 px). Doppelsprung in der Luft
      erhöht die Sprunghöhe (Boost).
- [x] **Reiter-Sprite aus den Originalen:** `rider_sled.png` (160×120) wurde aus
      `charlotte.png` und `sled_fixed.png` komponiert – Kopf, Mantel und Rodel sind
      exakt die Originalpixel. Nur die Sitzpose (Beine, Arme, Zügel) wurde in den
      identischen Palettenfarben ergänzt. Das Sprite fährt in Fahrtrichtung rechts.
- [x] **Ziel erst zum Schluss:** Das ZIEL-Banner ist während der ganzen Fahrt unsichtbar
      und wird erst 1,4 s vor dem Finish eingeblendet (`raceGateReveal`). Danach rast
      der Rodel mit `raceFinishRun` sichtbar hindurch, bevor der Sieg-Endbildschirm kommt.
- [x] **Straßenstreifen:** Sechs kontrastreiche Streifen scrollen mit unterschiedlichem
      Tempo und Versatz nach links (`speedStreak`), dazu ein leichter Hintergrund-Schwung
      (`raceBgSway`) für den 2D-Look.
- [x] **Gefühl im Rodelrennen:** Wippen des Reiters, Squash bei der Landung,
      Stolpern bei Treffern, Trail-Dots und Sparkle hinter dem Rodel,
      Schneewehen auf der Strecke, Tempo-Steigerung nach 3 s.
- [x] **HUD-Fix:** `raceHearts` wird in `raceUpdateHud` auf [0,2] begrenzt, damit
      `repeat()` nie mit einem negativen Wert aufgerufen wird.
- [x] **Endbildschirm:** Titel „RASERIG AUF DIE ZIELE — WEIHNACHTEN!" (Gewinn),
      Statistik (Geschwindigkeit), Funken über dem Titel, Schneewehen und ein
      gut sichtbarer Neustart-Button („▶  Neu starten").
- [x] **Bonus-Level:** Vom Glückwunschbildschirm aus wählbar. 30 Sekunden lang
      fallen Weihnachtskugeln in vier Farben (Rot 10, Grün 15, Blau 20,
      Violett 25 Punkte) und vier deutlich verschiedenen Größen
      (14/22/34/50 px – größere Kugeln sind seltener und leichter zu fangen).
      Charlotte läuft per Zeiger/Touch oder `←`/`→`, `A`/`D`. Im Bonus-Level
      werden Titelbanner und Schalter zu einer schmalen Leiste am oberen Rand
      verkleinert; Punkte/Zeit/Rekord kleben direkt daneben ebenfalls bei top:0,
      die Legende folgt darunter. Dadurch bleibt möglichst viel Spielfläche frei.
      Ergebnis-Overlay zeigt Punkte, gefangene/verpasste Kugeln und den Highscore,
      der per `localStorage` dauerhaft gespeichert wird. Zusätzlich gibt es eine
      kleine Bestliste: Mit Supabase-Config läuft sie online über die REST API,
      sonst lokal. Einrichtung und SQL-Policies stehen in `SUPABASE.md`.
- [x] **Sound:** SFX-System (WebAudio) — Start, Whoosh, Hindernis, Sprung, Stolpern, Sieg, Münz-Piep im Bonus-Level.
- [x] **Retro-Look:** Rausch-Overlay `retro-noise.svg` auf `#game`.
- [x] **Endbildschirm v1.0:** „Frohe Weihnachten! 🎄" + Neu-Start-Button

### Offen / bekannt 🔧
- [x] Der Rodel wurde neu gezeichnet (ohne rotes X). Reparierter Zustand
      verwendet `sled_fixed.png` mit goldener Klammer + Funkeln.
- [x] Rodelrennen implementiert und getestet (Gewinnen/Verlieren/Retry).
- [x] Kompletter Spielablauf im Browser getestet (keine Konsolenfehler).
- [x] Zusätzliche Interaktionen: Charlotte (fragendes Hände-Schütteln),
      Baum (Pseudo-Drehung + Kugel), Vogel (Landen/Fliegen).

---

## 6. Ausblick & nächste Schritte

### Mittelfristig (v1.2)
- Automatische Rodel-Tempo-Optimierung mit dynamischem Rodel-Vali
- Better Breakpoints: Rodel-Schnecken

### Langfristig (v2.0)
- Neue Biome (Fels, Wald) und mehr scenic variations
- Mehr Inventargegenstände und Rätsel
- Sprite-Dialog-System mit mehr Optionen
- Sprachversionen (English/French), erweiterte Touch-Steuerung

**Docs:** [Zum Spiel](index.html)
