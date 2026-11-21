/* ============================================================
   Supabase-Konfiguration für die Bonus-Bestliste
   ------------------------------------------------------------
   1. In Supabase → Project Settings → API Keys die Project URL und den
      publishable key (sb_publishable_...) kopieren. Bei älteren Projekten
      genügt der legacy anon key (langer JWT, beginnt mit eyJ...).
   2. Die Werte unten eintragen und enabled auf true setzen.
   3. Die Tabelle bonus_highscores wie in SUPABASE.md anlegen.

   Der publishable/anon key ist bewusst öffentlich – der Schutz läuft über
   Row Level Security (RLS). Einen secret/service_role-Key (sb_secret_...)
   NIEMALS hier, im Browser oder in einem Chat eintragen!
   ============================================================ */
window.SUPABASE_CONFIG = {
  enabled: true,
  url: 'https://mcnmplqipvpdhvhlffek.supabase.co',
  anonKey: 'sb_publishable_h4Bp6hlG0uzyTN40sZyaSQ_5U6Zx0eP',
  table: 'bonus_highscores',
  limit: 5
};
