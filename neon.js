/*
 * VantageDB — data layer for Vantage accounts & profiles.
 *
 * Backed by the Neon Data API (PostgREST over HTTPS) when connected, with a
 * localStorage fallback so the prototype keeps working before the database
 * is hooked up. Nothing else in the app talks to storage directly.
 *
 * To connect Neon:
 *   1. Run schema.sql against your Neon database.
 *   2. Enable the Data API on the branch and copy its URL + key.
 *   3. In the browser console on any Vantage page:
 *        VantageDB.configure({ url: 'https://<your-endpoint>.neon.tech', apiKey: '<key>' })
 *      (persists in this browser), or edit NEON defaults below.
 *
 * NOTE: profiles are passwordless by design — the deployed site is meant to
 * sit behind Netlify password protection (or similar), which is the real
 * lock on the door. Profiles only keep each user's data separate.
 */
(function () {
  var NEON = {
    url: '',    // Neon Data API base URL, e.g. https://app-broken-frost-12345678.dpl.myneon.app
    apiKey: '', // Neon Data API key / JWT
  };

  function cfg() {
    var c = { url: NEON.url, apiKey: NEON.apiKey };
    try {
      var raw = localStorage.getItem('vantage-neon');
      if (raw) {
        var o = JSON.parse(raw);
        if (o && o.url) c.url = o.url;
        if (o && o.apiKey) c.apiKey = o.apiKey;
      }
    } catch (e) {}
    return c;
  }

  function isConnected() { return !!cfg().url; }

  function request(path, options) {
    var c = cfg();
    options = options || {};
    var headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (c.apiKey) {
      headers['Authorization'] = 'Bearer ' + c.apiKey;
      headers['apikey'] = c.apiKey;
    }
    if (options.prefer) headers['Prefer'] = options.prefer;
    return fetch(c.url.replace(/\/$/, '') + path, {
      method: options.method || 'GET',
      headers: headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    }).then(function (res) {
      if (res.status === 204) return { ok: true, status: 204, data: null };
      return res.json().catch(function () { return null; }).then(function (data) {
        return { ok: res.ok, status: res.status, data: data };
      });
    });
  }

  /* ---- localStorage fallback ---- */

  function localAccounts() {
    var reg = {};
    try { reg = JSON.parse(localStorage.getItem('pd-accounts') || '{}') || {}; } catch (e) {}
    // Purge demo accounts seeded by an earlier version of the Login page.
    var dirty = false;
    Object.keys(reg).forEach(function (k) {
      if ((reg[k] || {}).seed || k === 'griffin' || k === 'luca') { delete reg[k]; dirty = true; }
    });
    if (dirty) saveLocalAccounts(reg);
    return reg;
  }
  function saveLocalAccounts(reg) {
    try { localStorage.setItem('pd-accounts', JSON.stringify(reg)); } catch (e) {}
  }

  /* ---- public API ----
   * Every method returns a Promise and works in both modes.
   * Profiles are passwordless — the deployed site itself is locked (e.g.
   * Netlify password protection), accounts only keep each user's data apart.
   * Account shape: { username, name, account }
   * Profile: arbitrary settings object keyed by account number.
   */

  function listAccounts() {
    if (!isConnected()) {
      var reg = localAccounts();
      return Promise.resolve(Object.keys(reg).sort().map(function (k) {
        return { username: k, name: reg[k].name, account: reg[k].account };
      }));
    }
    return request('/accounts?select=username,name,account_no&order=created_at.asc').then(function (res) {
      if (!res.ok || !res.data) return [];
      return res.data.map(function (row) {
        return { username: row.username, name: row.name, account: row.account_no };
      });
    });
  }

  function getAccount(username) {
    username = String(username || '').trim().toLowerCase();
    if (!username) return Promise.resolve(null);
    if (!isConnected()) {
      return Promise.resolve(localAccounts()[username] || null);
    }
    return request('/accounts?username=eq.' + encodeURIComponent(username) + '&limit=1').then(function (res) {
      var row = res.ok && res.data && res.data[0];
      if (!row) return null;
      return { username: row.username, name: row.name, account: row.account_no };
    });
  }

  function createAccount(acct) {
    var username = String(acct.username || '').trim().toLowerCase();
    if (!isConnected()) {
      var reg = localAccounts();
      if (reg[username]) return Promise.resolve({ ok: false, error: 'taken' });
      reg[username] = { name: acct.name, account: acct.account };
      saveLocalAccounts(reg);
      return Promise.resolve({ ok: true });
    }
    return request('/accounts', {
      method: 'POST',
      body: { username: username, name: acct.name, account_no: acct.account },
    }).then(function (res) {
      if (res.ok) return { ok: true };
      if (res.status === 409) return { ok: false, error: 'taken' };
      return { ok: false, error: 'network' };
    });
  }

  function saveProfile(accountNo, settings) {
    // Always cache locally so the rest of the UI reads instantly.
    try { localStorage.setItem('pd-profile-settings-' + accountNo, JSON.stringify(settings)); } catch (e) {}
    if (!isConnected()) return Promise.resolve({ ok: true });
    return request('/profiles?on_conflict=account_no', {
      method: 'POST',
      prefer: 'resolution=merge-duplicates',
      body: { account_no: accountNo, settings: settings, updated_at: new Date().toISOString() },
    }).then(function (res) {
      return { ok: res.ok };
    });
  }

  function getProfile(accountNo) {
    if (!isConnected()) {
      try { return Promise.resolve(JSON.parse(localStorage.getItem('pd-profile-settings-' + accountNo) || 'null')); } catch (e) { return Promise.resolve(null); }
    }
    return request('/profiles?account_no=eq.' + encodeURIComponent(accountNo) + '&limit=1').then(function (res) {
      var row = res.ok && res.data && res.data[0];
      if (!row) return null;
      try { localStorage.setItem('pd-profile-settings-' + accountNo, JSON.stringify(row.settings)); } catch (e) {}
      return row.settings;
    });
  }

  /* ---- forum (Learn tab Q&A) ---- */

  function forumLocal() {
    try { return JSON.parse(localStorage.getItem('pd-forum') || '[]') || []; } catch (e) { return []; }
  }
  function forumSaveLocal(list) {
    try { localStorage.setItem('pd-forum', JSON.stringify(list)); } catch (e) {}
  }

  function forumList() {
    if (!isConnected()) return Promise.resolve(forumLocal());
    return request('/forum_threads?select=*,forum_replies(*)&order=created_at.desc').then(function (res) {
      if (!res.ok || !res.data) return [];
      return res.data.map(function (row) {
        return {
          id: row.id, title: row.title, body: row.body, author: row.author,
          votes: row.votes || 0, created_at: row.created_at,
          replies: (row.forum_replies || []).map(function (r) {
            return { author: r.author, body: r.body, created_at: r.created_at };
          }),
        };
      });
    });
  }

  function forumAsk(q) {
    var title = String(q.title || '').trim();
    if (!title) return Promise.resolve({ ok: false, error: 'empty' });
    if (!isConnected()) {
      var list = forumLocal();
      list.unshift({ id: 't' + Date.now(), title: title, body: String(q.body || '').trim(), author: q.author, votes: 0, created_at: new Date().toISOString(), replies: [] });
      forumSaveLocal(list);
      return Promise.resolve({ ok: true });
    }
    return request('/forum_threads', {
      method: 'POST',
      body: { title: title, body: String(q.body || '').trim(), author: q.author, account_no: q.account || null },
    }).then(function (res) { return { ok: res.ok }; });
  }

  function forumReply(r) {
    var body = String(r.body || '').trim();
    if (!body) return Promise.resolve({ ok: false, error: 'empty' });
    if (!isConnected()) {
      var list = forumLocal();
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === r.threadId) {
          list[i].replies = list[i].replies || [];
          list[i].replies.push({ author: r.author, body: body, created_at: new Date().toISOString() });
          break;
        }
      }
      forumSaveLocal(list);
      return Promise.resolve({ ok: true });
    }
    return request('/forum_replies', {
      method: 'POST',
      body: { thread_id: r.threadId, body: body, author: r.author, account_no: r.account || null },
    }).then(function (res) { return { ok: res.ok }; });
  }

  function forumVote(threadId, votes) {
    if (!isConnected()) {
      var list = forumLocal();
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === threadId) { list[i].votes = votes; break; }
      }
      forumSaveLocal(list);
      return Promise.resolve({ ok: true });
    }
    return request('/forum_threads?id=eq.' + encodeURIComponent(threadId), {
      method: 'PATCH',
      body: { votes: votes },
    }).then(function (res) { return { ok: res.ok }; });
  }

  function sendFeedback(fb) {
    var entry = {
      account_no: fb.account || null,
      category: fb.category || 'Other',
      message: String(fb.message || '').trim(),
      created_at: new Date().toISOString(),
    };
    if (!entry.message) return Promise.resolve({ ok: false, error: 'empty' });
    // Always keep a local copy so the Feedback page can show recent notes.
    try {
      var list = JSON.parse(localStorage.getItem('pd-feedback') || '[]') || [];
      list.unshift(entry);
      localStorage.setItem('pd-feedback', JSON.stringify(list.slice(0, 50)));
    } catch (e) {}
    if (!isConnected()) return Promise.resolve({ ok: true });
    return request('/feedback', { method: 'POST', body: entry }).then(function (res) {
      return { ok: res.ok };
    });
  }

  function configure(opts) {
    try { localStorage.setItem('vantage-neon', JSON.stringify({ url: opts.url || '', apiKey: opts.apiKey || '' })); } catch (e) {}
    return 'VantageDB: ' + (opts.url ? 'connected to ' + opts.url : 'disconnected, using local storage');
  }

  window.VantageDB = {
    configure: configure,
    isConnected: isConnected,
    listAccounts: listAccounts,
    getAccount: getAccount,
    createAccount: createAccount,
    saveProfile: saveProfile,
    getProfile: getProfile,
    sendFeedback: sendFeedback,
    forumList: forumList,
    forumAsk: forumAsk,
    forumReply: forumReply,
    forumVote: forumVote,
  };
})();
