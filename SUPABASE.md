# Bonus-Bestliste mit Supabase

Die Bestliste läuft komplett ohne Framework und ohne Build-Schritt über die
Supabase REST API. Solange die Konfiguration noch Platzhalter enthält oder das
Netzwerk nicht erreichbar ist, speichert das Spiel die Einträge lokal im
`localStorage` – das Spiel bleibt also immer spielbar.

## 1. Tabelle in Supabase anlegen

Im Supabase-Dashboard **SQL Editor** öffnen und Folgendes ausführen:

```sql
create table if not exists public.bonus_highscores (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 12),
  score integer not null check (score >= 0),
  created_at timestamptz not null default now()
);

create index if not exists bonus_highscores_score_idx
  on public.bonus_highscores (score desc);

alter table public.bonus_highscores enable row level security;

-- Jeder darf die Bestliste lesen …
create policy "Bonus: Bestliste lesen"
  on public.bonus_highscores for select
  to anon using (true);

-- … und einen eigenen Eintrag hinzufügen.
create policy "Bonus: Eintrag hinzufügen"
  on public.bonus_highscores for insert
  to anon with check (true);
```

Falls die Policies schon existieren, kann man sie vorher mit `drop policy
if exists "…" on public.bonus_highscores;` entfernen.

> **Wichtig:** Der `service_role`-Key darf niemals in den Browser oder in ein
> GitHub-Repository. Der `anon`/`public`-Key ist genau für diesen Zweck da;
> der Schutz entsteht durch die RLS-Policies.

## 2. Zugangsdaten eintragen

Datei `js/supabase-config.js` öffnen:

```js
window.SUPABASE_CONFIG = {
  enabled: true,
  url: 'https://DEIN_PROJEKT.supabase.co',
  anonKey: 'DEIN_ANON_KEY',
  table: 'bonus_highscores',
  limit: 5
};
```

- **Project URL** und **anon key** stehen in Supabase unter
  *Project Settings → API*.
- `enabled` auf `true` setzen.
- `limit` bestimmt, wie viele Plätze die kleine Bestliste zeigt.

Danach neu laden. Im Bonus-Ergebnis erscheint bei der Bestliste **„Online“**
statt **„Lokal“**.

## 3. Benefit im Spiel

Nach jeder Bonus-Runde:

1. Ergebnisse und Highscore erscheinen wie bisher.
2. Name eingeben (maximal 12 Zeichen, Vorgabe „Charlotte“) und auf
   **Speichern** klicken.
3. Der Eintrag wird an Supabase gesendet und die Bestliste sofort aktualisiert.
4. Der eigene Eintrag ist gelb markiert.

## 4. Auf GitHub Pages

Nach dem Commit wird alles automatisch mit ausgeliefert. Da die Project URL auf
HTTPS läuft, gibt es keine Mixed-Content-Probleme. Supabase erlaubt CORS für
Browser-Anfragen mit dem anon-Key, daher sind keine zusätzlichen Headers oder
Weiterleitungen nötig.

Falls GitHub Pages gerade noch die alte Version ausliefert: kurz warten oder
im Browser hard-reload (`Strg/Cmd + F5`).
