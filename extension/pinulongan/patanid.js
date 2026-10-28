(function () {
  'use strict';

  if (window.__ligtasPanganLoaded) return;
  window.__ligtasPanganLoaded = true;

  const ESTADO = {
    safe: { short: 'Safe', color: '#10b981', glow: 'rgba(16,185,129,0.35)' },
    caution: { short: 'Caution', color: '#f59e0b', glow: 'rgba(245,158,11,0.35)' },
    danger: { short: 'Unsafe', color: '#ef4444', glow: 'rgba(239,68,68,0.35)' },
    unknown: { short: 'Not checked', color: '#64748b', glow: 'rgba(100,116,139,0.3)' }
  };

  const BADGE_TEXT = {
    safe: 'This is a safe and good food ordering app',
    unsafe: 'This Page is not safe, see it for yourself. Just click the OK to proceed'
  };

  const state = {
    payload: null,
    settings: null,
    expanded: false,
    overlayOpen: false,
    preShown: false,
    safeShown: false,
    dismissed: false,
    running: false,
    lastHref: location.href,
    reported: false,
    tries: 0,
    bodySize: 0
  };

  const PINAKADAMO_SAKOP = 14;

  let hostEl;
  let shadow;
  let badgeEl;
  let panelEl;
  let preBarEl;
  let safeBarEl;
  let overlayEl;
  let toastEl;
  let safeTimer = null;

  const styleText = `
    :host, * { box-sizing: border-box; }
    [hidden] { display: none !important; }
    .lp-root, .lp-root * { font-family: "Segoe UI", Roboto, -apple-system, BlinkMacSystemFont, Arial, sans-serif; }
    .lp-badge {
      position: fixed; right: 20px; bottom: 20px; z-index: 2147483645;
      display: inline-flex; align-items: center; gap: 9px;
      padding: 9px 14px 9px 11px; border-radius: 999px; border: 1px solid rgba(148, 163, 184, 0.28);
      background: linear-gradient(135deg, rgba(8, 24, 38, 0.96), rgba(19, 16, 48, 0.96));
      color: #e2e8f0; cursor: pointer; pointer-events: auto;
      box-shadow: 0 14px 34px rgba(2, 8, 23, 0.5), 0 0 0 1px rgba(34, 211, 238, 0.12) inset;
      backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
      transition: transform 0.18s ease, box-shadow 0.18s ease;
      font-size: 12px;
    }
    .lp-badge:hover { transform: translateY(-2px); box-shadow: 0 18px 40px rgba(2, 8, 23, 0.6), 0 0 18px var(--lp-glow); }
    .lp-badge__text { display: flex; flex-direction: column; line-height: 1.15; text-align: left; }
    .lp-badge__text b { font-size: 12px; font-weight: 700; color: #f8fafc; letter-spacing: 0.2px; }
    .lp-badge__text i { font-style: normal; font-size: 10px; color: #94a3b8; letter-spacing: 0.4px; text-transform: uppercase; }
    .lp-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--lp-color); box-shadow: 0 0 10px var(--lp-color); }
    .lp-panel {
      position: fixed; right: 20px; bottom: 78px; z-index: 2147483647; width: 340px; max-width: calc(100vw - 32px);
      border-radius: 18px; border: 1px solid rgba(34, 211, 238, 0.18);
      background: linear-gradient(160deg, rgba(6, 22, 36, 0.98), rgba(15, 12, 40, 0.98));
      color: #cbd5e1; box-shadow: 0 24px 60px rgba(2, 8, 23, 0.6);
      padding: 16px; display: none; pointer-events: auto; backdrop-filter: blur(18px);
    }
    .lp-panel.open { display: block; animation: lp-rise 0.2s ease both; }
    .lp-panel h3 { margin: 0 0 4px; font-size: 14px; color: #f8fafc; }
    .lp-panel .lp-host { font-size: 11px; color: #22d3ee; word-break: break-all; margin-bottom: 10px; }
    .lp-panel p { margin: 0 0 10px; font-size: 12px; line-height: 1.55; color: #b6c2d2; }
    .lp-list { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 7px; }
    .lp-list li { display: flex; gap: 8px; font-size: 11.5px; line-height: 1.45; color: #cbd5e1; }
    .lp-list li::before { content: ""; flex: 0 0 auto; width: 5px; height: 5px; margin-top: 6px; border-radius: 50%; background: var(--lp-color); }
    .lp-list.pos li::before { background: #10b981; }
    .lp-panel .lp-actions { display: flex; gap: 8px; margin-top: 13px; }
    .lp-btn {
      border: 1px solid rgba(148, 163, 184, 0.24); background: rgba(15, 32, 52, 0.8); color: #e2e8f0;
      border-radius: 10px; padding: 8px 11px; font-size: 11.5px; font-weight: 600; cursor: pointer;
      transition: background 0.15s ease, border-color 0.15s ease; pointer-events: auto;
    }
    .lp-btn:hover { background: rgba(34, 211, 238, 0.14); border-color: rgba(34, 211, 238, 0.5); }
    .lp-btn--primary { background: linear-gradient(135deg, #06b6d4, #7c3aed); border-color: transparent; color: #fff; }
    .lp-btn--primary:hover { filter: brightness(1.08); }
    .lp-btn--danger { background: linear-gradient(135deg, #ef4444, #b91c1c); border-color: transparent; color: #fff; }
    .lp-btn--ghost { background: transparent; }
    .lp-prebar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 2147483647;
      display: none; align-items: center; gap: 14px; padding: 13px 20px;
      background: linear-gradient(90deg, #7f1d1d 0%, #b91c1c 45%, #7c2d12 100%);
      color: #fff; box-shadow: 0 10px 34px rgba(127, 29, 29, 0.45);
      pointer-events: auto; border-bottom: 1px solid rgba(248, 113, 113, 0.4);
      font-size: 13px;
    }
    .lp-prebar.show { display: flex; animation: lp-drop 0.25s ease both; }
    .lp-prebar__icon { flex: 0 0 auto; width: 34px; height: 34px; border-radius: 10px; background: rgba(0,0,0,0.25); display: grid; place-items: center; }
    .lp-prebar__text { flex: 1 1 auto; line-height: 1.4; font-weight: 600; letter-spacing: 0.1px; }
    .lp-prebar__text span { display: block; font-weight: 400; font-size: 11.5px; opacity: 0.82; margin-top: 2px; }
    .lp-pill {
      border: 0; border-radius: 999px; padding: 9px 20px; font-size: 12.5px; font-weight: 800;
      letter-spacing: 0.6px; text-transform: uppercase; cursor: pointer; background: #fff; color: #991b1b;
      box-shadow: 0 6px 18px rgba(0,0,0,0.25); flex: 0 0 auto;
    }
    .lp-pill:hover { background: #fee2e2; }
    .lp-close {
      background: transparent; border: 0; color: inherit; opacity: 0.75; font-size: 20px; cursor: pointer;
      line-height: 1; padding: 2px 4px; flex: 0 0 auto;
    }
    .lp-close:hover { opacity: 1; }
    .lp-safebar {
      position: fixed; top: 18px; left: 50%; transform: translate(-50%, -12px); z-index: 2147483647;
      display: none; align-items: center; gap: 12px; padding: 11px 14px 11px 13px; border-radius: 14px;
      background: linear-gradient(135deg, rgba(6, 78, 59, 0.97), rgba(6, 47, 66, 0.97));
      border: 1px solid rgba(52, 211, 153, 0.45); color: #ecfdf5;
      box-shadow: 0 18px 44px rgba(2, 44, 34, 0.45); pointer-events: auto; max-width: calc(100vw - 28px);
      font-size: 12.5px;
    }
    .lp-safebar.show { display: flex; animation: lp-safe 0.28s ease both; }
    .lp-safebar__dot { width: 30px; height: 30px; border-radius: 9px; background: rgba(16, 185, 129, 0.16); display: grid; place-items: center; flex: 0 0 auto; }
    .lp-safebar b { display: block; font-size: 13px; letter-spacing: 0.1px; }
    .lp-safebar span { display: block; font-size: 10.5px; color: #a7f3d0; margin-top: 2px; }
    .lp-pahayagon {
      position: fixed; left: 50%; bottom: 24px; transform: translate(-50%, 16px); opacity: 0;
      z-index: 2147483647; padding: 10px 16px; border-radius: 10px; font-size: 12px;
      background: rgba(8, 24, 38, 0.96); color: #e2e8f0; border: 1px solid rgba(34, 211, 238, 0.3);
      pointer-events: none; transition: opacity 0.2s ease, transform 0.2s ease; max-width: 90vw; text-align: center;
    }
    .lp-pahayagon.show { opacity: 1; transform: translate(-50%, 0); }
    .lp-overlay {
      position: fixed; inset: 0; z-index: 2147483646; display: none; overflow-y: auto;
      background:
        radial-gradient(circle at 12% 8%, rgba(34, 211, 238, 0.16), transparent 42%),
        radial-gradient(circle at 88% 12%, rgba(124, 58, 237, 0.2), transparent 45%),
        radial-gradient(circle at 50% 100%, rgba(14, 116, 144, 0.18), transparent 55%),
        linear-gradient(150deg, #020b13 0%, #051c2c 45%, #140b30 100%);
      color: #e2e8f0; pointer-events: auto; padding: 34px 18px 60px;
      backdrop-filter: blur(6px);
    }
    .lp-overlay.show { display: block; animation: lp-fade 0.2s ease both; }
    .lp-sheet {
      width: 100%; max-width: 720px; margin: 0 auto; border-radius: 22px;
      border: 1px solid rgba(148, 163, 184, 0.18);
      background: linear-gradient(160deg, rgba(7, 22, 34, 0.95), rgba(17, 13, 42, 0.95));
      box-shadow: 0 40px 90px rgba(0, 0, 0, 0.55), 0 0 60px rgba(34, 211, 238, 0.06) inset;
      overflow: hidden;
    }
    .lp-sheet__top { padding: 22px 26px 0; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .lp-brand { display: inline-flex; align-items: center; gap: 9px; font-size: 11px; letter-spacing: 1.4px; text-transform: uppercase; color: #22d3ee; font-weight: 700; }
    .lp-brand em { font-style: normal; color: #8b5cf6; }
    .lp-sheet__body { padding: 16px 26px 28px; }
    .lp-kicker { display: inline-flex; align-items: center; gap: 7px; padding: 5px 10px; border-radius: 999px; font-size: 10px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; background: rgba(239, 68, 68, 0.12); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.28); }
    .lp-kicker.caution { background: rgba(245, 158, 11, 0.12); color: #fcd34d; border-color: rgba(245, 158, 11, 0.3); }
    .lp-title { margin: 14px 0 6px; font-size: clamp(24px, 4vw, 34px); line-height: 1.1; letter-spacing: -0.8px; color: #f8fafc; }
    .lp-sub { margin: 0 0 18px; font-size: 13px; line-height: 1.6; color: #aebacb; max-width: 580px; }
    .lp-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
    .lp-chip { display: inline-flex; align-items: center; gap: 7px; padding: 7px 11px; border-radius: 9px; background: rgba(15, 35, 55, 0.7); border: 1px solid rgba(148, 163, 184, 0.16); font-size: 11px; color: #cbd5e1; max-width: 100%; }
    .lp-chip code { color: #67e8f9; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; word-break: break-all; }
    .lp-score { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 14px; background: rgba(239, 68, 68, 0.06); border: 1px solid rgba(239, 68, 68, 0.18); margin-bottom: 22px; }
    .lp-score.caution { background: rgba(245, 158, 11, 0.06); border-color: rgba(245, 158, 11, 0.18); }
    .lp-score__num { font-size: 30px; font-weight: 800; color: #ef4444; line-height: 1; letter-spacing: -1px; }
    .lp-score.caution .lp-score__num { color: #f59e0b; }
    .lp-score__label { font-size: 11.5px; line-height: 1.45; color: #aebacb; }
    .lp-score__label b { display: block; font-size: 12px; color: #e2e8f0; margin-bottom: 2px; }
    .lp-section-title { font-size: 11px; letter-spacing: 1.3px; text-transform: uppercase; color: #7dd3fc; font-weight: 700; margin: 0 0 10px; }
    .lp-reasons { display: grid; gap: 8px; margin: 0 0 22px; padding: 0; list-style: none; counter-reset: lp; }
    .lp-reasons li { display: flex; gap: 11px; padding: 11px 13px; border-radius: 11px; background: rgba(127, 29, 29, 0.14); border: 1px solid rgba(248, 113, 113, 0.14); font-size: 12px; line-height: 1.5; color: #dbe4ef; }
    .lp-reasons li::before { counter-increment: lp; content: counter(lp, decimal-leading-zero); font-family: ui-monospace, monospace; font-size: 10px; color: #fca5a5; padding-top: 2px; }
    .lp-tips { margin: 0 0 24px; padding: 0; list-style: none; display: grid; gap: 7px; }
    .lp-tips li { position: relative; padding-left: 18px; font-size: 12px; line-height: 1.55; color: #cbd5e1; }
    .lp-tips li::before { content: "→"; position: absolute; left: 0; color: #22d3ee; }
    .lp-sheet__actions { display: flex; flex-wrap: wrap; gap: 9px; }
    .lp-large { padding: 11px 16px; font-size: 12.5px; }
    .lp-note { margin: 16px 0 0; font-size: 10.5px; line-height: 1.5; color: #7d8ea3; }
    .lp-report { display: none; margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(148, 163, 184, 0.14); }
    .lp-report.open { display: block; }
    .lp-report textarea { width: 100%; min-height: 76px; resize: vertical; border-radius: 10px; padding: 10px 12px; background: rgba(3, 14, 24, 0.8); border: 1px solid rgba(148, 163, 184, 0.22); color: #e2e8f0; font-size: 12px; outline: none; }
    .lp-report textarea:focus { border-color: rgba(34, 211, 238, 0.55); }
    .lp-report .lp-actions { display: flex; gap: 8px; margin-top: 9px; align-items: center; }
    .lp-report small { font-size: 10.5px; color: #7d8ea3; }
    @keyframes lp-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes lp-drop { from { opacity: 0; transform: translateY(-100%); } to { opacity: 1; transform: translateY(0); } }
    @keyframes lp-safe { from { opacity: 0; transform: translate(-50%, -12px); } to { opacity: 1; transform: translate(-50%, 0); } }
    @keyframes lp-fade { from { opacity: 0; } to { opacity: 1; } }
    @media (max-width: 640px) {
      .lp-prebar { flex-wrap: wrap; padding: 12px 14px; }
      .lp-prebar__text { flex-basis: calc(100% - 50px); }
      .lp-prebar .lp-pill { margin-left: 48px; }
      .lp-badge { right: 12px; bottom: 12px; }
      .lp-panel { right: 12px; bottom: 70px; }
      .lp-sheet__top, .lp-sheet__body { padding-left: 18px; padding-right: 18px; }
      .lp-overlay { padding: 12px 10px 40px; }
    }
  `;

  const shieldSvg = (color, mark) =>
    `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 2.5 4.5 5.6v6.1c0 4.6 3.1 8.6 7.5 9.8 4.4-1.2 7.5-5.2 7.5-9.8V5.6L12 2.5Z" fill="${color}" opacity="0.14"/><path d="M12 2.5 4.5 5.6v6.1c0 4.6 3.1 8.6 7.5 9.8 4.4-1.2 7.5-5.2 7.5-9.8V5.6L12 2.5Z" fill="none" stroke="${color}" stroke-width="1.7" stroke-linejoin="round"/><path d="${mark}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  function ikono(verdict) {
    const meta = ESTADO[verdict] || ESTADO.unknown;
    if (verdict === 'safe') return shieldSvg(meta.color, 'm8.9 12.1 2.1 2.1 4.2-4.4');
    if (verdict === 'caution') return shieldSvg(meta.color, 'M12 8v4.6M12 15.9h.01');
    return shieldSvg(meta.color, 'M12 7.8v5.1M12 16.2h.01');
  }

  function likayanHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function himoon() {
    hostEl = document.createElement('div');
    hostEl.id = 'ligtas-pangan-host';
    hostEl.setAttribute('data-ligtas-pangan', 'root');
    shadow = hostEl.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = styleText;

    const wrap = document.createElement('div');
    wrap.className = 'lp-root';
    wrap.innerHTML = `
      <div class="lp-prebar" role="alert" aria-live="assertive"></div>
      <div class="lp-safebar" role="status" aria-live="polite"></div>
      <div class="lp-panel" role="dialog" aria-label="LigtasPangan result"></div>
      <div class="lp-overlay" role="dialog" aria-modal="true" aria-label="Unsafe page alert"></div>
      <button type="button" class="lp-badge" aria-label="LigtasPangan protection status" hidden></button>
      <div class="lp-pahayagon" role="status"></div>
    `;

    shadow.appendChild(style);
    shadow.appendChild(wrap);

    badgeEl = wrap.querySelector('.lp-badge');
    panelEl = wrap.querySelector('.lp-panel');
    preBarEl = wrap.querySelector('.lp-prebar');
    safeBarEl = wrap.querySelector('.lp-safebar');
    overlayEl = wrap.querySelector('.lp-overlay');
    toastEl = wrap.querySelector('.lp-pahayagon');

    badgeEl.addEventListener('click', () => {
      if (!state.payload) return;
      if (state.payload.verdict === 'safe') {
        state.expanded = !state.expanded;
        ipahilingPanel();
        return;
      }
      abrihonAlert();
    });

    document.documentElement.appendChild(hostEl);
  }

  function pahayagon(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastEl.__timer);
    toastEl.__timer = setTimeout(() => toastEl.classList.remove('show'), 3800);
  }

  function isaraPanel() {
    state.expanded = false;
    panelEl.classList.remove('open');
  }

  function ipahilingBadge() {
    const payload = state.payload;
    if (!payload || !state.settings || !state.settings.showBadge || payload.disabled) {
      badgeEl.hidden = true;
      badgeEl.classList.remove('show');
      return;
    }
    const meta = ESTADO[payload.verdict] || ESTADO.unknown;
    badgeEl.hidden = false;
    badgeEl.style.setProperty('--lp-color', meta.color);
    badgeEl.style.setProperty('--lp-glow', meta.glow);
    badgeEl.innerHTML = `${ikono(payload.verdict)}<span class="lp-badge__text"><b>${likayanHtml(meta.short)}</b><i>${payload.score}/100</i></span>`;
  }

  function listahanRason(items, positive) {
    if (!items || items.length === 0) return '';
    return `<ul class="lp-list ${positive ? 'pos' : ''}">${items
      .map((item) => `<li>${likayanHtml(item.label)}</li>`)
      .join('')}</ul>`;
  }

  function ipahilingPanel() {
    const payload = state.payload;
    if (!payload) return;
    const meta = ESTADO[payload.verdict] || ESTADO.unknown;
    panelEl.classList.toggle('open', state.expanded);
    if (!state.expanded) return;
    panelEl.innerHTML = `
      <h3>${likayanHtml(payload.trusted ? 'Trusted seller' : meta.short)}</h3>
      <div class="lp-host">${likayanHtml(location.hostname)}</div>
      <p>${likayanHtml(payload.explanation || '')}</p>
      ${listahanRason(payload.reasons, false)}
      ${listahanRason(payload.positives, true)}
      <div class="lp-actions">
        <button type="button" class="lp-btn lp-btn--primary" data-lp="details">Full details</button>
        <button type="button" class="lp-btn" data-lp="report">Report page</button>
      </div>
    `;
    panelEl.querySelector('[data-lp="details"]').addEventListener('click', () => abrihonAlert());
    panelEl.querySelector('[data-lp="report"]').addEventListener('click', () => {
      isaraPanel();
      abrihonAlert(true);
    });
  }

  function ipahilingPreBar() {
    const payload = state.payload;
    if (!payload || !state.settings) return;
    const meta = ESTADO[payload.verdict] || ESTADO.unknown;
    preBarEl.style.setProperty('--lp-color', meta.color);
    const visible =
      state.settings.showWarning &&
      !state.dismissed &&
      payload.verdict !== 'safe' &&
      payload.verdict !== 'unknown' &&
      !payload.disabled &&
      (payload.verdict === 'danger' || state.settings.warnLevel !== 'danger');

    preBarEl.classList.toggle('show', visible);
    if (!visible) return;
    preBarEl.innerHTML = `
      <div class="lp-prebar__icon">${ikono(payload.verdict)}</div>
      <div class="lp-prebar__text">${BADGE_TEXT.unsafe}<span>Risk score ${payload.score}/100 · ${likayanHtml(meta.short)} · ${likayanHtml(location.hostname)}</span></div>
      <button type="button" class="lp-pill" data-lp="ok">OK</button>
      <button type="button" class="lp-close" data-lp="hide" aria-label="Hide warning">×</button>
    `;
    preBarEl.querySelector('[data-lp="ok"]').addEventListener('click', () => {
      preBarEl.classList.remove('show');
      abrihonAlert();
    });
    preBarEl.querySelector('[data-lp="hide"]').addEventListener('click', () => {
      state.dismissed = true;
      preBarEl.classList.remove('show');
    });
  }

  function ipahilingSafeBar() {
    const payload = state.payload;
    if (!payload || !state.settings) return;
    const visible =
      state.settings.showSafeNotice &&
      payload.verdict === 'safe' &&
      payload.score < 30 &&
      !payload.disabled;

    if (!visible) {
      safeBarEl.classList.remove('show');
      return;
    }

    safeBarEl.classList.add('show');
    safeBarEl.innerHTML = `
      <div class="lp-safebar__dot">${ikono('safe')}</div>
      <div><b>${BADGE_TEXT.safe}</b><span>${likayanHtml(location.hostname)} · Risk score ${payload.score}/100</span></div>
      <button type="button" class="lp-close" data-lp="close-safe" aria-label="Close message">×</button>
    `;
    safeBarEl.querySelector('[data-lp="close-safe"]').addEventListener('click', () => {
      safeBarEl.classList.remove('show');
    });
    clearTimeout(safeTimer);
    safeTimer = setTimeout(() => safeBarEl.classList.remove('show'), 9000);
  }

  function himoonSheet(payload, focusReport) {
    const meta = ESTADO[payload.verdict] || ESTADO.unknown;
    const unsafe = payload.verdict !== 'safe';
    const title = unsafe
      ? payload.verdict === 'danger'
        ? 'This page is not safe'
        : 'This page shows warning signs'
      : 'This page passed the safety check';
    return `
      <div class="lp-sheet">
        <div class="lp-sheet__top">
          <div class="lp-brand">Ligtas<em>Pangan</em> · page safety scanner</div>
          <button type="button" class="lp-close" data-lp="close" aria-label="Close">×</button>
        </div>
        <div class="lp-sheet__body">
          <div class="lp-kicker ${payload.verdict === 'caution' ? 'caution' : ''}">${unsafe ? 'Security alert' : 'Verified check'}</div>
          <h1 class="lp-title">${likayanHtml(title)}</h1>
          <p class="lp-sub">${likayanHtml(payload.explanation || '')}</p>
          <div class="lp-meta">
            <span class="lp-chip">Site <code>${likayanHtml(location.hostname)}</code></span>
            <span class="lp-chip">${likayanHtml(meta.short)}</span>
            ${payload.trusted ? '<span class="lp-chip">On your trusted list</span>' : ''}
            ${payload.blocked ? '<span class="lp-chip">On your blocked list</span>' : ''}
          </div>
          <div class="lp-score ${payload.verdict === 'caution' ? 'caution' : ''}">
            <div class="lp-score__num">${payload.score}</div>
            <div class="lp-score__label"><b>Risk score out of 100</b>${unsafe ? 'Higher means more fraud indicators were detected on this page.' : 'No fraud indicators were found in the page content and payment form.'}</div>
          </div>
          ${
            unsafe && payload.reasons.length
              ? `<h2 class="lp-section-title">Why this page is ${payload.verdict === 'danger' ? 'unsafe' : 'risky'}</h2><ol class="lp-reasons">${payload.reasons
                  .map((reason) => `<li>${likayanHtml(reason.label)}</li>`)
                  .join('')}</ol>`
              : ''
          }
          ${
            payload.positives.length
              ? `<h2 class="lp-section-title">Good signs found</h2><ul class="lp-tips">${payload.positives
                  .map((item) => `<li>${likayanHtml(item.label)}</li>`)
                  .join('')}</ul>`
              : ''
          }
          <h2 class="lp-section-title">What you should do</h2>
          <ul class="lp-tips">${(payload.guidance || []).map((tip) => `<li>${likayanHtml(tip)}</li>`).join('')}</ul>
          <div class="lp-sheet__actions">
            ${unsafe ? '<button type="button" class="lp-btn lp-btn--primary lp-large" data-lp="back">Go back to safety</button>' : ''}
            <button type="button" class="lp-btn lp-large" data-lp="report">Report this page</button>
            <button type="button" class="lp-btn lp-btn--ghost lp-large" data-lp="continue">${unsafe ? 'Continue to the site anyway' : 'Close'}</button>
          </div>
          <p class="lp-note">LigtasPangan only inspects public page content and warns you. It never processes payments and never stores card numbers, passwords, or one-time PINs.</p>
          <div class="lp-report ${focusReport ? 'open' : ''}">
            <textarea placeholder="Optional: describe what looks wrong on this page" maxlength="400"></textarea>
            <div class="lp-actions">
              <button type="button" class="lp-btn lp-btn--primary" data-lp="send-report">Submit report</button>
              <small>Reports are stored only in your browser.</small>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function abrihonAlert(focusReport) {
    if (!state.payload) return;
    isaraPanel();
    overlayEl.innerHTML = himoonSheet(state.payload, focusReport);
    overlayEl.classList.add('show');
    state.overlayOpen = true;
    document.documentElement.style.setProperty('overflow', 'hidden');

    const close = () => {
      overlayEl.classList.remove('show');
      state.overlayOpen = false;
      document.documentElement.style.removeProperty('overflow');
    };

    overlayEl.querySelector('[data-lp="close"]')?.addEventListener('click', close);
    overlayEl.querySelector('[data-lp="continue"]')?.addEventListener('click', () => {
      state.dismissed = true;
      close();
    });
    overlayEl.querySelector('[data-lp="back"]')?.addEventListener('click', () => {
      if (window.history.length > 1) window.history.back();
      else close();
    });
    overlayEl.querySelector('[data-lp="report"]')?.addEventListener('click', () => {
      overlayEl.querySelector('.lp-report')?.classList.add('open');
      overlayEl.querySelector('.lp-report textarea')?.focus();
    });
    overlayEl.querySelector('[data-lp="send-report"]')?.addEventListener('click', () => {
      const note = overlayEl.querySelector('.lp-report textarea')?.value || '';
      ipadaraReport(note);
    });
  }

  function ipadaraReport(note) {
    if (!state.payload) return;
    chrome.runtime.sendMessage(
      {
        type: 'LP_IULAT',
        payload: {
          url: location.href,
          host: location.hostname,
          verdict: state.payload.verdict,
          score: state.payload.score,
          reasons: state.payload.reasons,
          note
        }
      },
      (response) => {
        if (chrome.runtime.lastError || !response || !response.ok) {
          pahayagon('The report could not be saved. Try again.');
          return;
        }
        state.reported = true;
        pahayagon('Report saved in this browser. Thank you.');
      }
    );
  }

  function ipahiling() {
    ipahilingBadge();
    ipahilingPreBar();
    ipahilingSafeBar();
    ipahilingPanel();
    if (!state.payload) {
      safeBarEl.classList.remove('show');
    }
  }

  function siyasatonPahina() {
    if (state.running) return;
    state.running = true;

    let signals;
    try {
      signals = LigtasPangan.kuhaonSignals();
    } catch (error) {
      state.running = false;
      return;
    }

    if (!LigtasPangan.dapatBantayan(signals)) {
      state.running = false;
      if (badgeEl) badgeEl.hidden = true;
      state.tries = 0;
      return;
    }

    chrome.runtime.sendMessage({ type: 'LP_SIYASAT', url: location.href, signals }, (response) => {
      state.running = false;
      if (chrome.runtime.lastError) return;
      if (!response || !response.ok || !response.payload) return;
      state.payload = response.payload;
      state.dismissed = false;
      state.preShown = true;
      state.tries = 0;
      ipahiling();
    });
  }

  function pamukawon() {
    himoon();

    chrome.runtime.sendMessage({ type: 'LP_KUHAON_SETTINGS' }, (response) => {
      if (chrome.runtime.lastError) return;
      state.settings = response && response.settings ? response.settings : {};
      siyasatonPahina();
    });
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message && message.type === 'LP_KUHAON_PAYLOAD') {
      sendResponse({ ok: true, payload: state.payload });
      return false;
    }
    if (message && message.type === 'LP_UTRO') {
      state.payload = null;
      state.dismissed = false;
      state.expanded = false;
      siyasatonPahina();
      sendResponse({ ok: true });
      return false;
    }
    return false;
  });

  setInterval(() => {
    if (!state.payload && !state.running && state.settings && state.tries < PINAKADAMO_SAKOP) {
      const size = document.body ? document.body.innerText.length : 0;
      if (size > state.bodySize) {
        state.bodySize = size;
        state.tries += 1;
        siyasatonPahina();
      }
    }

    if (location.href !== state.lastHref) {
      state.lastHref = location.href;
      state.tries = 0;
      state.bodySize = 0;
      state.payload = null;
      state.dismissed = false;
      state.expanded = false;
      panelEl?.classList.remove('open');
      preBarEl?.classList.remove('show');
      safeBarEl?.classList.remove('show');
      overlayEl?.classList.remove('show');
      document.documentElement.style.removeProperty('overflow');
      if (state.settings) siyasatonPahina();
    }
  }, 1500);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', pamukawon, { once: true });
  } else {
    pamukawon();
  }
})();
