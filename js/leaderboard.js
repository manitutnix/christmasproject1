/* ============================================================
   Bonus-Leaderboard
   ------------------------------------------------------------
   Nutzt direkt die Supabase REST API (kein SDK, kein Build-Schritt).
   Solange js/supabase-config.js noch Platzhalter enthält oder kein
   Netzwerk erreichbar ist, wird lokal im localStorage gespeichert.
   ============================================================ */
(function () {
  'use strict';

  const LOCAL_SCORES_KEY = 'charlotte_bonus_scores';

  function config() {
    return window.SUPABASE_CONFIG || {};
  }

  function isConfigured() {
    const c = config();
    if (!c.enabled || !c.url || !c.anonKey) return false;
    const combined = String(c.url) + String(c.anonKey);
    return !/DEIN_|YOUR_|PASTE_|xxxx|example/i.test(combined);
  }

  function sanitizeName(name) {
    const value = String(name == null ? '' : name).trim().replace(/\s+/g, ' ').slice(0, 12);
    return value || 'Charlotte';
  }

  function sanitizeScore(score) {
    const value = Math.floor(Number(score));
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  function getLocalScores() {
    try {
      const parsed = JSON.parse(localStorage.getItem(LOCAL_SCORES_KEY) || '[]');
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map(row => ({
          name: sanitizeName(row && row.name),
          score: sanitizeScore(row && row.score),
          created_at: (row && row.created_at) || ''
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, config().limit || 5);
    } catch (e) {
      return [];
    }
  }

  function addLocalScore(name, score) {
    const rows = getLocalScores();
    rows.push({
      name: sanitizeName(name),
      score: sanitizeScore(score),
      created_at: new Date().toISOString()
    });
    rows.sort((a, b) => b.score - a.score);
    const top = rows.slice(0, config().limit || 5);
    try { localStorage.setItem(LOCAL_SCORES_KEY, JSON.stringify(top)); } catch (e) { /* ignore */ }
    return top;
  }

  function headers(write) {
    const c = config();
    const key = String(c.anonKey || '');
    const h = { apikey: key, Accept: 'application/json' };
    // Neue Supabase-Keys (sb_publishable_...) gehören nur in den apikey-Header.
    // Legacy-anon-Keys sind JWTs und werden zusätzlich als Bearer akzeptiert.
    if (!key.startsWith('sb_')) {
      h.Authorization = 'Bearer ' + key;
    }
    if (write) {
      h['Content-Type'] = 'application/json';
      h['Prefer'] = 'return=minimal';
    }
    return h;
  }

  function baseUrl() {
    return String(config().url || '').replace(/\/+$/, '') + '/rest/v1/' + encodeURIComponent(config().table || 'bonus_highscores');
  }

  async function fetchTop() {
    if (!isConfigured()) {
      return { ok: true, source: 'local', rows: getLocalScores() };
    }
    const limit = Math.min(20, Math.max(1, Number(config().limit) || 5));
    const url = baseUrl() + '?select=name,score,created_at&order=score.desc&limit=' + limit;
    try {
      const response = await fetch(url, { headers: headers(false), mode: 'cors' });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const rows = await response.json();
      return {
        ok: true,
        source: 'supabase',
        rows: (Array.isArray(rows) ? rows : []).map(row => ({
          name: sanitizeName(row.name),
          score: sanitizeScore(row.score),
          created_at: row.created_at || ''
        }))
      };
    } catch (error) {
      return {
        ok: false,
        source: 'local',
        error: String((error && error.message) || error),
        rows: getLocalScores()
      };
    }
  }

  async function submit(name, score) {
    const cleanName = sanitizeName(name);
    const cleanScore = sanitizeScore(score);
    if (!isConfigured()) {
      addLocalScore(cleanName, cleanScore);
      return { ok: true, source: 'local' };
    }
    try {
      const response = await fetch(baseUrl(), {
        method: 'POST',
        headers: headers(true),
        mode: 'cors',
        body: JSON.stringify({ name: cleanName, score: cleanScore })
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return { ok: true, source: 'supabase' };
    } catch (error) {
      // Online nicht erreichbar: lokal merken, damit der Eintrag nicht verloren geht.
      addLocalScore(cleanName, cleanScore);
      return {
        ok: false,
        source: 'local',
        error: String((error && error.message) || error)
      };
    }
  }

  window.BonusLeaderboard = {
    isConfigured: isConfigured,
    fetchTop: fetchTop,
    submit: submit,
    getLocalScores: getLocalScores,
    sanitizeName: sanitizeName
  };
})();
