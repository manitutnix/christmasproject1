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

-- Der Browser-Key läuft unter der Postgres-Rolle anon – Rechte explizit geben.
grant select, insert on public.bonus_highscores to anon;

alter table public.bonus_highscores enable row level security;

-- Bei erneutem Ausführen zuerst vorhandene Policies entfernen:
drop policy if exists "Bonus: Bestliste lesen" on public.bonus_highscores;
drop policy if exists "Bonus: Eintrag hinzufügen" on public.bonus_highscores;

-- Jeder darf die Bestliste lesen …
create policy "Bonus: Bestliste lesen"
  on public.bonus_highscores for select
  to anon using (true);

-- … und einen eigenen Eintrag hinzufügen.
create policy "Bonus: Eintrag hinzufügen"
  on public.bonus_highscores for insert
  to anon with check (true);
```

> **Wichtig:** Der `secret`-Key (`sb_secret_…`, früher `service_role`) darf
> niemals in den Browser, in ein GitHub-Repository oder in einen Chat. Der
> `publishable`-Key (`sb_publishable_…`, früher `anon`) ist genau für diesen
> Zweck da; der Schutz entsteht durch die RLS-Policies.

## 2. Zugangsdaten eintragen

Datei `js/supabase-config.js` öffnen:

```js
window.SUPABASE_CONFIG = {
  enabled: true,
  url: 'https://DEIN_PROJEKT.supabase.co',
  anonKey: 'DEIN_PUBLISHABLE_KEY',
  table: 'bonus_highscores',
  limit: 5
};
```

- **Project URL** und **publishable key** stehen in Supabase unter
  *Project Settings → API Keys*. Der Name `anonKey` in der Config ist nur
  historisch – eingetragen wird der publishable key (`sb_publishable_…`).
  Bei älteren Projekten funktioniert auch der legacy anon-Key (`eyJ…`).
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

## 5. Fehlersuche

- **`404 PGRST205 – Could not find the table …`**: Das SQL aus Schritt 1 wurde
  noch nicht ausgeführt, oder die Tabelle heißt anders. Der Publishable-Key
  ist in diesem Fall bereits korrekt – nur die Tabelle fehlt.
- **`401 Unauthorized`**: Falscher Key. Der Browser braucht den publishable
  key (`sb_publishable_…`), nicht den secret key (`sb_secret_…`).
- **`401 / 42501 permission denied for table`**: Dem `anon`-Role fehlt das
  `SELECT`/`INSERT`-Grant. Die `grant … to anon;`-Zeile aus Schritt 1 erneut
  ausführen.
- **`403 / row-level security`**: RLS ist aktiv, aber die Policies aus Schritt 1
  fehlen.
- Badge **„Offline“**: Netzwerk/CORS problematisch oder Tabelle nicht da.
  Einträge werden dann lokal gespeichert und sind nicht verloren.
- **`400 / neue Row verletzt eine CHECK-Bedingung`**: Name oder Punktzahl
  passen nicht mehr zu den verschärften Regeln aus Schritt 6.

## 6. Spam-Schutz (SQLOnly, empfohlen)

Der Publishable-Key ist öffentlich. Alles, was im Browser geprüft wird, kann
man umgehen. Die folgenden Maßnahmen liegen **komplett in der Datenbank**:

- Name nur mit Buchstaben (inkl. Umlaute), Zahlen, Leerzeichen, `-` und `_`
- Punktzahl auf einen plausiblen Bereich begrenzt
- Der Browser darf nur `name` und `score` schreiben – `created_at` und `id`
  vergibt die Datenbank
- RLS prüft zusätzlich Namen, Punkte und Zeitstempel
- Ein Trigger begrenzt die Anzahl Einträge pro Zeitfenster

Im **SQL Editor** ausführen (mehrfach ausführbar):

```sql
-- 1) Saubere Namen
alter table public.bonus_highscores
  drop constraint if exists bonus_highscores_name_format;
alter table public.bonus_highscores
  add constraint bonus_highscores_name_format
  check (name ~ '^[[:alnum:]äöüÄÖÜß _-]+$');

-- 2) Plausible Punktzahl (30 s Spielzeit, maximal 2500 Punkte)
alter table public.bonus_highscores
  drop constraint if exists bonus_highscores_score_max;
alter table public.bonus_highscores
  add constraint bonus_highscores_score_max
  check (score between 0 and 2500);

-- 3) Nur name und score dürfen vom Browser geschrieben werden
revoke insert on public.bonus_highscores from anon;
grant insert (name, score) on public.bonus_highscores to anon;

-- 4) Insert-Policy verschärfen
drop policy if exists "Bonus: Eintrag hinzufügen" on public.bonus_highscores;
create policy "Bonus: Eintrag hinzufügen"
  on public.bonus_highscores for insert
  to anon
  with check (
    char_length(name) between 1 and 12
    and name ~ '^[[:alnum:]äöüÄÖÜß _-]+$'
    and score between 0 and 2500
    and created_at between now() - interval '5 minutes'
                       and now() + interval '1 minute'
  );

-- 5) Einfaches Rate-Limit in der Datenbank
create or replace function public.bonus_highscores_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.bonus_highscores
      where created_at > now() - interval '1 minute') >= 60 then
    raise exception 'Zu viele Einträge – bitte später erneut versuchen';
  end if;

  if (select count(*) from public.bonus_highscores
      where name = new.name and created_at > now() - interval '1 minute') >= 3 then
    raise exception 'Dieser Name wurde zu oft gespeichert';
  end if;

  return new;
end;
$$;

drop trigger if exists bonus_highscores_rate_limit on public.bonus_highscores;
create trigger bonus_highscores_rate_limit
  before insert on public.bonus_highscores
  for each row execute function public.bonus_highscores_rate_limit();
```

> **Grenze:** Das stoppt Gelegenheitsspam und einfache Skripte. Wer entschlossen
> ist, kann weiterhin mit dem öffentlichen Key direkt POSTs schicken und dabei
> Namen variieren. Ein echter Schutz wäre eine Edge Function mit Rate-Limit pro
> IP plus CAPTCHA – dann müsste der Secret-Key serverseitig liegen.

Nach dem Ausführen hier Bescheid geben – dann teste ich, ob das Speichern im
Spiel weiterhin funktioniert und ein Treffer eine saubere Fehlermeldung ergibt.
