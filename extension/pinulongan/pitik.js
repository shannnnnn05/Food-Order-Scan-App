(function () {
  'use strict';

  const ESTADO = {
    safe: { title: 'Safe food ordering page', color: '#10b981', text: '#34d399' },
    caution: { title: 'Use caution', color: '#f59e0b', text: '#fbbf24' },
    danger: { title: 'This page is not safe', color: '#ef4444', text: '#f87171' },
    unknown: { title: 'Not checked yet', color: '#64748b', text: '#94a3b8' }
  };

  const el = (id) => document.getElementById(id);
  let activeTab = null;
  let currentPayload = null;

  function likayanHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

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

  function itakdaGauge(score, color) {
    const circle = el('lp-gauge');
    const circumference = 219.9;
    const clamped = Math.max(0, Math.min(100, Number(score) || 0));
    circle.style.stroke = color;
    circle.style.strokeDashoffset = String(circumference - (circumference * clamped) / 100);
    el('lp-score').textContent = String(clamped);
    el('lp-score').style.color = color;
  }

  function kuhaonHost() {
    if (!activeTab || !activeTab.url) return '--';
    try {
      return new URL(activeTab.url).hostname || '--';
    } catch (error) {
      return '--';
    }
  }

  function ipahiling(payload) {
    currentPayload = payload;
    el('lp-host').textContent = kuhaonHost();

    if (!payload) {
      el('lp-title').textContent = 'No scan result yet';
      el('lp-text').textContent = 'Open a food ordering page, then press Re-scan page.';
      el('lp-score').textContent = '--';
      el('lp-why-card').hidden = true;
      el('lp-tips-card').hidden = true;
      return;
    }

    const meta = ESTADO[payload.verdict] || ESTADO.unknown;
    el('lp-title').textContent = payload.disabled ? 'Protection is off' : meta.title;
    el('lp-title').style.color = meta.text;
    el('lp-text').textContent = payload.explanation || '';
    itakdaGauge(payload.score, meta.color);

    if (payload.reasons && payload.reasons.length) {
      el('lp-why-card').hidden = false;
      el('lp-why-title').textContent = payload.verdict === 'safe' ? 'Good signs found' : 'Why this page is flagged';
      el('lp-reasons').innerHTML = payload.reasons
        .map((reason) => `<li>${likayanHtml(reason.label)}</li>`)
        .join('');
    } else if (payload.positives && payload.positives.length) {
      el('lp-why-card').hidden = false;
      el('lp-why-title').textContent = 'Good signs found';
      el('lp-reasons').innerHTML = payload.positives
        .map((item) => `<li class="pos">${likayanHtml(item.label)}</li>`)
        .join('');
    } else {
      el('lp-why-card').hidden = true;
    }

    if (payload.guidance && payload.guidance.length) {
      el('lp-tips-card').hidden = false;
      el('lp-tips').innerHTML = payload.guidance.map((tip) => `<li>${likayanHtml(tip)}</li>`).join('');
    } else {
      el('lp-tips-card').hidden = true;
    }
  }

  function kargahonRecords() {
    ipadara({ type: 'LP_KUHAON_RECORDS' }).then((response) => {
      if (!response || !response.ok) return;
      el('lp-report-count').textContent = String(response.totals.communityReports);
    });
  }

  function kuhaonResulta(attempt) {
    if (!activeTab) {
      ipahiling(null);
      return;
    }
    if (activeTab.url && !/^https?:/i.test(activeTab.url)) {
      ipahiling(null);
      return;
    }

    chrome.tabs.sendMessage(activeTab.id, { type: 'LP_KUHAON_PAYLOAD' }, (response) => {
      if (!chrome.runtime.lastError && response && response.ok && response.payload) {
        ipahiling(response.payload);
        return;
      }
      ipadara({ type: 'LP_KUHAON_RESULT', tabId: activeTab.id }).then((result) => {
        if (result && result.ok && result.payload) {
          ipahiling(result.payload);
          return;
        }
        if (!attempt) {
          el('lp-title').textContent = 'Scanning this page';
          el('lp-text').textContent = 'Reading the page content and payment form.';
          ipadara({ type: 'LP_SIYASAT_UTRO', tabId: activeTab.id }).then(() => {
            setTimeout(() => kuhaonResulta(1), 1200);
          });
          return;
        }
        ipahiling(null);
      });
    });
  }

  function pamukawon() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      activeTab = tabs && tabs[0] ? tabs[0] : null;
      if (!activeTab) {
        ipahiling(null);
        return;
      }
      el('lp-host').textContent = kuhaonHost();
      kuhaonResulta(0);
    });

    ipadara({ type: 'LP_KUHAON_SETTINGS' }).then((response) => {
      if (!response || !response.ok) return;
      const settings = response.settings || {};
      const status = el('lp-status');
      if (!settings.enabled) {
        status.textContent = 'Off';
        status.className = 'lp-badge';
      } else {
        status.textContent = 'On';
        status.className = 'lp-badge lp-badge--safe';
      }
    });

    ipadara({ type: 'LP_KUHAON_TUKLAS' }).then((response) => {
      if (!response || !response.ok || !response.who) return;
      const who = response.who;
      el('lp-who').textContent = who.mode === 'account' ? who.name : `${who.name} (no account)`;
    });

    kargahonRecords();

    el('lp-rescan').addEventListener('click', () => {
      if (!activeTab) return;
      el('lp-title').textContent = 'Scanning again';
      el('lp-text').textContent = 'Reading the page content and payment form.';
      ipadara({ type: 'LP_SIYASAT_UTRO', tabId: activeTab.id }).then(() => {
        setTimeout(() => kuhaonResulta(1), 1100);
      });
    });

    el('lp-report').addEventListener('click', () => {
      el('lp-report-box').hidden = false;
      el('lp-report-note').focus();
    });

    el('lp-report-cancel').addEventListener('click', () => {
      el('lp-report-box').hidden = true;
    });

    el('lp-report-send').addEventListener('click', () => {
      const note = el('lp-report-note').value || '';
      ipadara({
        type: 'LP_IULAT',
        payload: {
          url: activeTab ? activeTab.url : '',
          host: kuhaonHost() === '--' ? '' : kuhaonHost(),
          verdict: currentPayload ? currentPayload.verdict : 'unknown',
          score: currentPayload ? currentPayload.score : 0,
          reasons: currentPayload ? currentPayload.reasons : [],
          note
        }
      }).then((response) => {
        if (!response || !response.ok) return;
        el('lp-report-box').hidden = true;
        el('lp-report-note').value = '';
        el('lp-report').textContent = 'Report saved';
        el('lp-report').disabled = true;
        kargahonRecords();
      });
    });

    el('lp-settings').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });

    el('lp-home').addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('pahina/giya.html') });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', pamukawon, { once: true });
  } else {
    pamukawon();
  }
})();
