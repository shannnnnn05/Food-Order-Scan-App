(function () {
  'use strict';

  const el = (id) => document.getElementById(id);
  const DEFAULTS = {
    enabled: true,
    showBadge: true,
    showWarning: true,
    showSafeNotice: true,
    warnLevel: 'caution',
    trustedSites: [],
    blockedSites: []
  };

  let settings = { ...DEFAULTS };

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

  function likayanHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function linasonHost(value) {
    let raw = String(value || '').trim().toLowerCase();
    if (!raw) return '';
    raw = raw.replace(/^https?:\/\//, '').replace(/^www\./, '');
    raw = raw.split('/')[0].split('?')[0].split('#')[0].split(':')[0];
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(raw)) return '';
    return raw;
  }

  function pahayagonSaved(text) {
    el('lp-saved').textContent = text || 'Saved';
    clearTimeout(pahayagonSaved.timer);
    pahayagonSaved.timer = setTimeout(() => {
      el('lp-saved').textContent = '';
    }, 2400);
  }

  function ipahilingSellers() {
    const trusted = Array.isArray(settings.trustedSites) ? settings.trustedSites : [];
    const blocked = Array.isArray(settings.blockedSites) ? settings.blockedSites : [];

    el('lp-trust-list').innerHTML = trusted.length
      ? trusted
          .map(
            (site) =>
              `<span class="lp-chip">${likayanHtml(site)}<button type="button" data-remove="trusted" data-site="${likayanHtml(site)}" aria-label="Remove">×</button></span>`
          )
          .join('')
      : '<span class="lp-note">No trusted sellers yet.</span>';

    el('lp-block-list').innerHTML = blocked.length
      ? blocked
          .map(
            (site) =>
              `<span class="lp-chip">${likayanHtml(site)}<button type="button" data-remove="blocked" data-site="${likayanHtml(site)}" aria-label="Remove">×</button></span>`
          )
          .join('')
      : '<span class="lp-note">No blocked sellers yet.</span>';
  }

  function ipahilingSettings() {
    el('lp-enabled').checked = Boolean(settings.enabled);
    el('lp-show-badge').checked = Boolean(settings.showBadge);
    el('lp-show-warning').checked = Boolean(settings.showWarning);
    el('lp-show-safe').checked = Boolean(settings.showSafeNotice);
    el('lp-warn-level').value = settings.warnLevel === 'danger' ? 'danger' : 'caution';
    ipahilingSellers();
  }

  function itago(patch) {
    return ipadara({ type: 'LP_ITAGO_SETTINGS', patch }).then((response) => {
      if (!response || !response.ok) return;
      settings = response.settings;
      ipahilingSettings();
      pahayagonSaved('Saved');
    });
  }

  function ipahilingRecords(records) {
    const reports = records && Array.isArray(records.reports) ? records.reports : [];
    const scans = records && Array.isArray(records.scans) ? records.scans : [];
    const totals = (records && records.totals) || {};
    el('lp-total-reports').textContent = String(totals.communityReports || 0);
    el('lp-total-reviews').textContent = String(totals.reviews || 0);
    el('lp-total-sellers').textContent = String(totals.verifiedSellers || 0);

    el('lp-check-safe').textContent = String(totals.safeChecks || 0);
    el('lp-check-caution').textContent = String(totals.cautionChecks || 0);
    el('lp-check-danger').textContent = String(totals.unsafeChecks || 0);
    el('lp-check-total').textContent = String(totals.totalChecks || 0);

    if (!scans.length) {
      el('lp-scan-empty').hidden = false;
      el('lp-scan-table').hidden = true;
    } else {
      el('lp-scan-empty').hidden = true;
      el('lp-scan-table').hidden = false;
      el('lp-scan-body').innerHTML = scans.map(siyasatRow).join('');
    }

    if (!reports.length) {
      el('lp-records-empty').hidden = false;
      el('lp-records-table').hidden = true;
      return;
    }

    el('lp-records-empty').hidden = true;
    el('lp-records-table').hidden = false;
    el('lp-records-body').innerHTML = reports.map(iulatRow).join('');
  }

  function verdictBadge(verdict) {
    if (verdict === 'danger') return '<span class="lp-badge lp-badge--danger">Unsafe</span>';
    if (verdict === 'caution') return '<span class="lp-badge lp-badge--caution">Caution</span>';
    if (verdict === 'safe') return '<span class="lp-badge lp-badge--safe">Safe</span>';
    return '<span class="lp-badge">Unknown</span>';
  }

  function petsa(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString();
  }

  function siyasatRow(scan) {
    return `<tr>
      <td>${likayanHtml(scan.host || scan.url || '')}</td>
      <td>${likayanHtml(scan.user || 'Guest')}</td>
      <td>${verdictBadge(scan.verdict)}</td>
      <td>${Number(scan.score) || 0}</td>
      <td>${likayanHtml(petsa(scan.createdAt))}</td>
    </tr>`;
  }

  function iulatRow(record) {
    return `<tr>
      <td>${likayanHtml(record.host || record.url || '')}</td>
      <td>${likayanHtml(record.user || 'Guest')}</td>
      <td>${verdictBadge(record.verdict)}</td>
      <td>${Number(record.score) || 0}</td>
      <td>${likayanHtml(record.note || (record.reasons && record.reasons[0]) || 'No note')}</td>
      <td>${likayanHtml(petsa(record.createdAt))}</td>
    </tr>`;
  }

  function ipahilingTuklas(who) {
    if (!who) return;
    el('lp-admin-user').textContent = who.name;
    const badge = el('lp-admin-mode');
    badge.textContent = who.mode === 'account' ? 'Gmail account' : 'Guest mode';
    badge.className = who.mode === 'account' ? 'lp-badge lp-badge--safe' : 'lp-badge lp-badge--violet';
  }

  function kargahonTuklas() {
    ipadara({ type: 'LP_KUHAON_TUKLAS' }).then((response) => {
      if (!response || !response.ok) return;
      ipahilingTuklas(response.who);
    });
  }

  function kargahonRecords() {
    ipadara({ type: 'LP_KUHAON_RECORDS' }).then((records) => {
      ipahilingRecords(records);
    });
  }

  function ikabitTabs() {
    document.querySelectorAll('.lp-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.lp-tab').forEach((item) => item.classList.remove('active'));
        document.querySelectorAll('.lp-tabpanel').forEach((panel) => panel.classList.remove('active'));
        tab.classList.add('active');
        el(`tab-${tab.dataset.tab}`).classList.add('active');
        if (tab.dataset.tab === 'records') {
          kargahonRecords();
          kargahonTuklas();
        }
      });
    });
  }

  function ikabitSettings() {
    el('lp-enabled').addEventListener('change', (event) => itago({ enabled: event.target.checked }));
    el('lp-show-badge').addEventListener('change', (event) => itago({ showBadge: event.target.checked }));
    el('lp-show-warning').addEventListener('change', (event) => itago({ showWarning: event.target.checked }));
    el('lp-show-safe').addEventListener('change', (event) => itago({ showSafeNotice: event.target.checked }));
    el('lp-warn-level').addEventListener('change', (event) => itago({ warnLevel: event.target.value }));

    el('lp-reset').addEventListener('click', () => {
      itago({ ...DEFAULTS });
    });
  }

  function ikabitSellers() {
    el('lp-trust-add').addEventListener('click', () => {
      const host = linasonHost(el('lp-trust-input').value);
      if (!host) {
        pahayagonSaved('Enter a valid domain');
        return;
      }
      if (settings.trustedSites.includes(host)) return;
      el('lp-trust-input').value = '';
      itago({
        trustedSites: settings.trustedSites.filter((site) => site !== host).concat(host),
        blockedSites: settings.blockedSites.filter((site) => site !== host)
      });
    });

    el('lp-block-add').addEventListener('click', () => {
      const host = linasonHost(el('lp-block-input').value);
      if (!host) {
        pahayagonSaved('Enter a valid domain');
        return;
      }
      if (settings.blockedSites.includes(host)) return;
      el('lp-block-input').value = '';
      itago({
        blockedSites: settings.blockedSites.filter((site) => site !== host).concat(host),
        trustedSites: settings.trustedSites.filter((site) => site !== host)
      });
    });

    el('lp-trust-list').addEventListener('click', (event) => {
      const button = event.target.closest('[data-remove]');
      if (!button) return;
      const site = button.dataset.site;
      itago({ trustedSites: settings.trustedSites.filter((item) => item !== site) });
    });

    el('lp-block-list').addEventListener('click', (event) => {
      const button = event.target.closest('[data-remove]');
      if (!button) return;
      const site = button.dataset.site;
      itago({ blockedSites: settings.blockedSites.filter((item) => item !== site) });
    });
  }

  function ikabitActions() {
    el('lp-open-guide').addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('pahina/giya.html') });
    });

    el('lp-open-tests').addEventListener('click', () => {
      chrome.tabs.create({ url: 'http://127.0.0.1:4173/pagsubok/' });
    });

    el('lp-clear-records').addEventListener('click', () => {
      chrome.storage.local.set({ reports: [] }, () => {
        kargahonRecords();
        pahayagonSaved('Records cleared');
      });
    });

    el('lp-clear-scans').addEventListener('click', () => {
      chrome.storage.local.set({ scans: [] }, () => {
        kargahonRecords();
        pahayagonSaved('Log cleared');
      });
    });

    el('lp-new-guest').addEventListener('click', () => {
      ipadara({ type: 'LP_BAGONG_GUEST' }).then((response) => {
        if (!response || !response.ok) return;
        ipahilingTuklas(response.who);
        el('lp-guest-note').textContent =
          response.who.mode === 'account' ? 'A Gmail account is used first' : 'New guest session started';
        kargahonRecords();
      });
    });
  }

  function pamukawon() {
    ikabitTabs();
    ikabitSettings();
    ikabitSellers();
    ikabitActions();

    ipadara({ type: 'LP_KUHAON_SETTINGS' }).then((response) => {
      if (response && response.ok) {
        settings = { ...DEFAULTS, ...response.settings };
      }
      ipahilingSettings();
    });

    kargahonRecords();
    kargahonTuklas();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', pamukawon, { once: true });
  } else {
    pamukawon();
  }
})();
