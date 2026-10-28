importScripts('kakanon.js');

const DEFAULT_SETTINGS = {
  enabled: true,
  showBadge: true,
  showWarning: true,
  showSafeNotice: true,
  warnLevel: 'caution',
  trustedSites: [],
  blockedSites: []
};

const CACHE_TTL = 5 * 60 * 1000;
const IDENTITY_TTL = 60 * 1000;
const tabResults = {};
const cache = new Map();
let tuklasCache = { at: 0, value: null };
let hulingTala = { key: '', at: 0 };

async function kuhaonSettings() {
  const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  return { ...DEFAULT_SETTINGS, ...stored };
}

async function itagoSettings(patch) {
  const next = { ...(await kuhaonSettings()), ...patch };
  await chrome.storage.sync.set(next);
  return next;
}

const BADGE_COLORS = {
  safe: '#10b981',
  caution: '#f59e0b',
  danger: '#ef4444',
  unknown: '#64748b'
};

async function kuhaonTuklas() {
  if (tuklasCache.value && Date.now() - tuklasCache.at < IDENTITY_TTL) return tuklasCache.value;

  let email = '';
  try {
    const profile = await chrome.identity.getProfileUserInfo({ accountStatus: 'ANY' });
    if (profile && profile.email) email = String(profile.email).trim().toLowerCase();
  } catch (error) {
    email = '';
  }

  if (!email) {
    const saved = await chrome.storage.local.get({ gmailAccount: '' });
    const gmail = String(saved.gmailAccount || '').trim().toLowerCase();
    if (gmail) email = gmail;
  }

  let result;
  if (email && email.indexOf('@') > 0) {
    result = { mode: 'account', name: email };
  } else {
    const session = await chrome.storage.session.get({ guestName: '' });
    let guestName = session && session.guestName ? String(session.guestName) : '';
    if (!guestName) {
      const local = await chrome.storage.local.get({ guestNumber: 0 });
      const next = Math.max(1, Number(local.guestNumber || 0) + 1);
      guestName = `Guest ${next}`;
      await chrome.storage.local.set({ guestNumber: next });
      await chrome.storage.session.set({ guestName });
    }
    result = { mode: 'guest', name: guestName };
  }

  tuklasCache = { at: Date.now(), value: result };
  return result;
}

async function italaPagsusuri(url, payload) {
  if (!payload || !payload.verdict || payload.verdict === 'unknown') return;

  let host = '';
  try {
    host = new URL(String(url || '')).hostname;
  } catch (error) {
    host = '';
  }
  if (!host) return;

  const now = Date.now();
  const key = `${host}|${payload.verdict}`;
  if (hulingTala.key === key && now - hulingTala.at < 45000) return;
  hulingTala = { key, at: now };

  const who = await kuhaonTuklas();
  const stored = await chrome.storage.local.get({ scans: [] });
  const scans = Array.isArray(stored.scans) ? stored.scans : [];
  const reason = payload.reasons && payload.reasons.length ? String(payload.reasons[0].label || '') : '';

  scans.unshift({
    id: `LP-${now}`,
    url: String(url || ''),
    host,
    verdict: payload.verdict,
    score: Number(payload.score) || 0,
    user: who.name,
    mode: who.mode,
    reason,
    createdAt: new Date(now).toISOString()
  });

  await chrome.storage.local.set({ scans: scans.slice(0, 500) });
}

async function pintahanBadge(tabId, payload) {
  if (typeof tabId !== 'number' || tabId < 0) return;
  const settings = await kuhaonSettings();
  if (!settings.enabled || !settings.showBadge || !payload) {
    try {
      await chrome.action.setBadgeText({ tabId, text: '' });
    } catch (error) {
      return;
    }
    return;
  }
  try {
    await chrome.action.setBadgeText({ tabId, text: String(payload.score) });
    await chrome.action.setBadgeBackgroundColor({
      tabId,
      color: BADGE_COLORS[payload.verdict] || BADGE_COLORS.unknown
    });
  } catch (error) {
    return;
  }
}

async function siyasaton(url, signals, tabId) {
  const settings = await kuhaonSettings();

  if (!settings.enabled) {
    const payload = {
      score: 0,
      verdict: 'unknown',
      source: 'device',
      disabled: true,
      reasons: [],
      positives: [],
      guidance: [],
      explanation: 'LigtasPangan is turned off.',
      checkedAt: Date.now()
    };
    if (typeof tabId === 'number') tabResults[tabId] = payload;
    await pintahanBadge(tabId, payload);
    return payload;
  }

  const cached = cache.get(url);
  if (cached && Date.now() - cached.at < CACHE_TTL) {
    if (typeof tabId === 'number') tabResults[tabId] = cached.payload;
    await pintahanBadge(tabId, cached.payload);
    await italaPagsusuri(url, cached.payload);
    return cached.payload;
  }

  const base = LigtasPangan.timbangonRisgo(signals);
  let payload = LigtasPangan.iligtasVerdict(
    base,
    signals && signals.host,
    settings.trustedSites,
    settings.blockedSites
  );

  if (settings.warnLevel === 'danger' && payload.verdict === 'caution') {
    payload = { ...payload, softened: true };
  }

  payload.checkedAt = Date.now();
  cache.set(url, { at: Date.now(), payload });
  if (typeof tabId === 'number') tabResults[tabId] = payload;
  await pintahanBadge(tabId, payload);
  await italaPagsusuri(url, payload);
  return payload;
}

async function kuhaonRecords() {
  const stored = await chrome.storage.local.get({ reports: [], scans: [] });
  const reports = Array.isArray(stored.reports) ? stored.reports : [];
  const scans = Array.isArray(stored.scans) ? stored.scans : [];
  const safeChecks = scans.filter((item) => item.verdict === 'safe').length;
  const cautionChecks = scans.filter((item) => item.verdict === 'caution').length;
  const unsafeChecks = scans.filter((item) => item.verdict === 'danger').length;
  return {
    reports,
    scans,
    totals: {
      communityReports: reports.length,
      ratings: 0,
      reviews: 0,
      verifiedSellers: 0,
      publishedAlerts: 0,
      safeChecks,
      cautionChecks,
      unsafeChecks,
      totalChecks: scans.length
    }
  };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender && sender.tab ? sender.tab.id : undefined;
  const type = message && message.type;

  if (type === 'LP_KUHAON_SETTINGS') {
    kuhaonSettings().then((settings) => sendResponse({ ok: true, settings }));
    return true;
  }

  if (type === 'LP_KUHAON_TUKLAS') {
    kuhaonTuklas()
      .then((who) => sendResponse({ ok: true, who }))
      .catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }

  if (type === 'LP_TUKLAS_GMAIL') {
    const email = message.email ? String(message.email).trim().toLowerCase() : '';
    chrome.storage.local.set({ gmailAccount: email }).then(() => {
      tuklasCache = { at: 0, value: null };
      sendResponse({ ok: true });
    });
    return true;
  }

  if (type === 'LP_BAGONG_GUEST') {
    chrome.storage.session.set({ guestName: '' }).then(async () => {
      tuklasCache = { at: 0, value: null };
      const who = await kuhaonTuklas();
      sendResponse({ ok: true, who });
    });
    return true;
  }

  if (type === 'LP_SIYASAT') {
    siyasaton(message.url, message.signals, tabId)
      .then((payload) => sendResponse({ ok: true, payload }))
      .catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }

  if (type === 'LP_KUHAON_RESULT') {
    const target = typeof message.tabId === 'number' ? message.tabId : tabId;
    sendResponse({ ok: true, payload: tabResults[target] || null });
    return false;
  }

  if (type === 'LP_SIYASAT_UTRO') {
    const target = typeof message.tabId === 'number' ? message.tabId : tabId;
    cache.clear();
    chrome.tabs.sendMessage(target, { type: 'LP_UTRO' }).catch(() => {});
    sendResponse({ ok: true });
    return false;
  }

  if (type === 'LP_ITAGO_SETTINGS') {
    itagoSettings(message.patch || {}).then((settings) => {
      cache.clear();
      sendResponse({ ok: true, settings });
    });
    return true;
  }

  if (type === 'LP_IULAT') {
    (async () => {
      try {
        const stored = await chrome.storage.local.get({ reports: [] });
        const reports = Array.isArray(stored.reports) ? stored.reports : [];
        const data = message.payload || {};
        const who = await kuhaonTuklas();
        const record = {
          id: `LP-${Date.now()}`,
          url: String(data.url || ''),
          host: String(data.host || ''),
          verdict: String(data.verdict || 'unknown'),
          score: Number(data.score || 0),
          reasons: Array.isArray(data.reasons) ? data.reasons.slice(0, 6).map((r) => r.label) : [],
          note: String(data.note || '').slice(0, 400),
          user: who.name,
          mode: who.mode,
          createdAt: new Date().toISOString()
        };
        reports.unshift(record);
        await chrome.storage.local.set({ reports: reports.slice(0, 50) });
        sendResponse({ ok: true, record });
      } catch (error) {
        sendResponse({ ok: false, error: String(error) });
      }
    })();
    return true;
  }

  if (type === 'LP_KUHAON_RECORDS') {
    kuhaonRecords()
      .then((records) => sendResponse({ ok: true, ...records }))
      .catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }

  return false;
});

chrome.runtime.onInstalled.addListener(async (details) => {
  const current = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  await chrome.storage.sync.set({ ...DEFAULT_SETTINGS, ...current });
  const local = await chrome.storage.local.get({ reports: [], scans: [] });
  if (!Array.isArray(local.reports)) {
    await chrome.storage.local.set({ reports: [] });
  }
  if (!Array.isArray(local.scans)) {
    await chrome.storage.local.set({ scans: [] });
  }
  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('pahina/giya.html') }).catch(() => {});
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  delete tabResults[tabId];
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    delete tabResults[tabId];
    chrome.action.setBadgeText({ tabId, text: '' }).catch(() => {});
  }
});

chrome.tabs.onActivated.addListener(async (info) => {
  const payload = tabResults[info.tabId];
  if (payload) await pintahanBadge(info.tabId, payload);
});
