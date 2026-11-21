/* ============================================================
   Supabase-Konfiguration für die Bonus-Bestliste
   ------------------------------------------------------------
   1. In Supabase → Project Settings → API die Project URL und den
      anon/public key kopieren.
   2. Die Werte unten eintragen und enabled auf true setzen.
   3. Die Tabelle bonus_highscores wie in SUPABASE.md anlegen.

   Der anon key ist bewusst öffentlich – der Schutz läuft über
   Row Level Security (RLS). Einen service_role-Key NIEMALS hier
   oder anders im Browser eintragen!
   ============================================================ */
window.SUPABASE_CONFIG = {
  enabled: false,
  url: 'https://mcnmplqipvpdhvhlffek.supabase.co',
  anonKey: 'DEIN_ANON_KEY',
  table: 'bonus_highscores',
  limit: 5
};
