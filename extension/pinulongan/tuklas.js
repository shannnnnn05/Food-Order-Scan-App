(function () {
  'use strict';

  const ADDRESS = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
  let huling = null;

  function hanaponEmail() {
    const nodes = document.querySelectorAll('a[aria-label], span[aria-label], div[aria-label]');
    for (const node of nodes) {
      const label = node.getAttribute('aria-label') || '';
      if (!/google account|account/i.test(label)) continue;
      const match = label.match(ADDRESS);
      if (match) return match[0];
    }
    return '';
  }

  function tignanNakaSignIn() {
    const links = document.querySelectorAll('a[href*="ServiceLogin"], a[href*="signin"]');
    return links.length > 0;
  }

  function ipasa(email) {
    if (huling === email) return;
    huling = email;
    chrome.runtime.sendMessage({ type: 'LP_TUKLAS_GMAIL', email }, () => {
      if (chrome.runtime.lastError) return;
    });
  }

  function siyasaton() {
    const email = hanaponEmail();
    if (email) {
      ipasa(email);
      return;
    }
    if (tignanNakaSignIn()) ipasa('');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', siyasaton, { once: true });
  } else {
    siyasaton();
  }

  setInterval(siyasaton, 4000);
})();
