(function () {
  'use strict';

  const el = (id) => document.getElementById(id);

  function ipadara(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          resolve(null);
          return;
        }
        resolve(response || null);
      });
    });
  }

  function abrihonTests() {
    chrome.tabs.create({ url: 'http://127.0.0.1:4173/pagsubok/' });
  }

  function pamukawon() {
    el('lp-open-tests')?.addEventListener('click', abrihonTests);
    el('lp-open-tests-2')?.addEventListener('click', abrihonTests);
    el('lp-open-settings')?.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('pahina/pilian.html') });
    });

    ipadara({ type: 'LP_KUHAON_RECORDS' }).then((records) => {
      if (!records || !records.ok) return;
      const total = records.totals ? records.totals.communityReports : 0;
      if (el('lp-home-reports')) el('lp-home-reports').textContent = String(total);
    });

    ipadara({ type: 'LP_KUHAON_SETTINGS' }).then((response) => {
      const badge = el('lp-install-state');
      if (!badge || !response || !response.ok) return;
      if (response.settings && response.settings.enabled === false) {
        badge.textContent = 'Paused';
        badge.className = 'lp-badge lp-badge--caution';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', pamukawon, { once: true });
  } else {
    pamukawon();
  }
})();
