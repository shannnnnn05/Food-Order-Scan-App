(function () {
  'use strict';

  const SAGANG = { caution: 30, danger: 65 };
  const LOKAL_MGA_HOST = ['localhost', '127.0.0.1', '::1', '0.0.0.0'];

  const ESTADO = {
    safe: {
      short: 'Safe',
      label: 'Safe and good food ordering app',
      color: '#10b981',
      bg: '#d1fae5'
    },
    caution: {
      short: 'Caution',
      label: 'Use caution on this page',
      color: '#f59e0b',
      bg: '#fef3c7'
    },
    danger: {
      short: 'Unsafe',
      label: 'This page is not safe',
      color: '#ef4444',
      bg: '#fee2e2'
    },
    unknown: {
      short: 'Not checked',
      label: 'Not checked yet',
      color: '#64748b',
      bg: '#e2e8f0'
    }
  };

  const KILALA_MGA_TINDAHAN = [
    'foodpanda.ph', 'foodpanda.com', 'grabfood.com', 'grab.com', 'lalamove.com',
    'angkas.com', 'pickaroo.com', 'metromart.com', 'foodmarket.ph', 'deliveryhero.com',
    'jollibeedelivery.com', 'jollibee.com.ph', 'mcdonalds.com.ph', 'kfc.com.ph',
    'chowkingdelivery.com', 'manginasaldelivery.com', 'shakeyspizza.ph', 'greenwichdelivery.com',
    'dominos.com.ph', 'pizzahut.com.ph', 'burgerking.com.ph', 'redribbon.com.ph',
    'goldilocks.com.ph', 'armynavy.com.ph', 'bonchon.com.ph', 'pancakehouse.com.ph',
    'maxschicken.com', 'kennyrogersdelivery.com', 'food.grab.com'
  ];

  const PANGAN_MGA_TARAM = [
    'menu', 'order', 'ordering', 'delivery', 'deliver', 'food', 'restaurant', 'eatery',
    'canteen', 'cantina', 'meal', 'dish', 'cuisine', 'takeout', 'take-out', 'fastfood',
    'fast food', 'cafe', 'coffee', 'grill', 'kitchen', 'snack', 'milk tea', 'milktea',
    'beverage', 'add to cart', 'cart', 'checkout', 'place order', 'order now', 'pre-order',
    'delivery fee', 'rider', 'foodpanda', 'grabfood', 'lalamove', 'carinderia', 'ihaw',
    'inasal', 'silog', 'lutong bahay', 'paluto', 'binalot', 'merienda', 'baon', 'pancit',
    'lechon', 'bicol express', 'laing', 'pili', 'kakanon', 'bayad', 'gcash', 'maya',
    'reserve', 'student meal', 'campus canteen'
  ];

  const BAYAD_MGA_TARAM = [
    'service fee', 'delivery fee', 'handling fee', 'convenience fee', 'processing fee',
    'platform fee', 'packaging fee', 'hidden charge', 'additional fee', 'small order fee',
    'transaction fee', 'reservation fee'
  ];

  const MGA_SUSPEK_TLD = [
    'tk', 'ml', 'ga', 'cf', 'gq', 'xyz', 'top', 'work', 'click', 'link', 'zip',
    'country', 'stream', 'download', 'loan', 'review', 'kim', 'men', 'date', 'racing',
    'win', 'bid', 'support', 'live', 'shop', 'store'
  ];

  const GATEWAY_MGA_HOST = [
    'paypal.com', 'stripe.com', 'paymongo.com', 'dragonpay.ph', 'gcash.com', 'maya.ph',
    'paymaya.com', 'checkout.com', 'squareup.com', 'adyen.com', '2c2p.com', 'xendit.co',
    'paymongo.link', 'bdo.com.ph', 'bpi.com.ph', 'chinabank.ph', 'metrobank.com.ph'
  ];

  const PERMIT_MGA_TARAM = [
    'dti', 'sec registration', 'business permit', "mayor's permit", 'mayors permit',
    'registered business', 'business registration', 'permit number', 'permit no.',
    'bir registration', 'certificate of registration', 'business name'
  ];

  const ADDRESS_MGA_TARAM = [
    'barangay', 'brgy', 'street', ' st.', 'st.,', 'avenue', 'road', 'poblacion',
    'zip code', 'sorsogon', 'city', 'blk', 'lot ', 'bldg', 'building'
  ];

  const ABOUT_MGA_TARAM = ['about', 'contact', 'terms', 'privacy', 'faq'];

  const ADVANCE_RE = /(pay (?:now )?(?:in )?advance|full payment|advance payment|pay first|send (?:your )?payment|pay now to reserve|reserve your (?:meal|order)|limited slots)/i;

  function sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
  }

  function basahonTeksto(el, limit) {
    if (!el) return '';
    const raw = typeof el.innerText === 'string' ? el.innerText : el.textContent || '';
    return String(raw).toLowerCase().slice(0, limit || 40000);
  }

  function mgaNakitAn(text, list) {
    const hits = [];
    for (const item of list) {
      if (text.includes(item)) hits.push(item);
    }
    return hits;
  }

  function kuhaonPresyo(text) {
    const out = [];
    if (!text) return out;
    const re = /(?:₱|php|\$|p)\s?([0-9][0-9,]*(?:\.[0-9]{1,2})?)/gi;
    let match;
    while ((match = re.exec(text)) !== null) {
      const value = parseFloat(String(match[1]).replace(/,/g, ''));
      if (!Number.isNaN(value) && value > 0) out.push(value);
    }
    return out;
  }

  function tekstoSaRehiyon(selectors) {
    for (const selector of selectors) {
      let el = null;
      try {
        el = document.querySelector(selector);
      } catch (error) {
        el = null;
      }
      if (!el) continue;
      const text = basahonTeksto(el);
      if (text.trim().length > 0) return text;
    }
    return '';
  }

  function mayGateway(url, base) {
    try {
      const parsed = new URL(url, base);
      const host = parsed.hostname.toLowerCase();
      return GATEWAY_MGA_HOST.some((g) => host === g || host.endsWith('.' + g));
    } catch (error) {
      return false;
    }
  }

  function kuhaonSignals() {
    const loc = window.location;
    const host = String(loc.hostname || '').toLowerCase();
    const bodyText = basahonTeksto(document.body, 80000);
    const hostParts = host.split('.').filter(Boolean);
    const tld = hostParts.length ? hostParts[hostParts.length - 1] : '';
    const isHttps = loc.protocol === 'https:';
    const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
    const isPunycode = host.includes('xn--');
    const strippedHost = host.replace(/^www\./, '');
    const isLocal = LOKAL_MGA_HOST.includes(host) || host === '' || host.endsWith('.localhost');
    const hyphenCount = (host.match(/-/g) || []).length;
    const digitCount = (host.match(/\d/g) || []).length;
    const subdomainCount = Math.max(0, hostParts.length - 2);

    const foodHitList = mgaNakitAn(bodyText, PANGAN_MGA_TARAM);
    const knownFoodHost = KILALA_MGA_TINDAHAN.some((site) => strippedHost === site || strippedHost.endsWith('.' + site) || host === site || host.endsWith('.' + site));

    const menuSelectors = [
      '[data-menu]', '#menu', '.menu', '[class*="menu-list"]', '[class*="menuList"]',
      '[class*="product-list"]', '[class*="food-list"]'
    ];
    const checkoutSelectors = [
      '[data-checkout]', '#checkout', '.checkout', '#cart', '[class*="cart"]',
      '[class*="summary"]', '[class*="total"]', '[class*="order-summary"]'
    ];

    const menuText = tekstoSaRehiyon(menuSelectors);
    const checkoutText = tekstoSaRehiyon(checkoutSelectors);
    const hasMenuBlock = menuText.trim().length > 0;
    const hasCheckoutBlock = checkoutText.trim().length > 0;

    const buttons = Array.from(
      document.querySelectorAll('button, a[role="button"], input[type="submit"], input[type="button"], [class*="add-to-cart"], [class*="order-now"]')
    );
    let hasOrderButton = false;
    for (const el of buttons) {
      const label = String(
        el.innerText || el.value || el.getAttribute('aria-label') || el.getAttribute('title') || ''
      ).toLowerCase();
      if (/(add to cart|order now|place order|checkout|buy now|bayad|bakal|order)/.test(label)) {
        hasOrderButton = true;
        break;
      }
    }

    const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
    const describe = (el) =>
      `${el.getAttribute('name') || ''} ${el.getAttribute('id') || ''} ${el.getAttribute('placeholder') || ''} ${el.getAttribute('autocomplete') || ''} ${el.getAttribute('aria-label') || ''}`.toLowerCase();

    let hasPasswordField = false;
    let hasCardField = false;
    let hasCvvField = false;
    let hasExpiryField = false;
    let hasOtpField = false;
    let hasSearchField = false;

    inputs.forEach((el) => {
      const type = String(el.getAttribute('type') || '').toLowerCase();
      const descriptor = describe(el);
      const autocomplete = String(el.getAttribute('autocomplete') || '').toLowerCase();
      if (type === 'password') hasPasswordField = true;
      if (type === 'search' || descriptor.includes('search')) hasSearchField = true;
      if (autocomplete === 'cc-number' || autocomplete === 'cc-csc' || autocomplete === 'cc-exp') hasCardField = true;
      if (/\b(card|cc|credit|debit|pan)[-_ ]?(number|no|num)\b/.test(descriptor) && !/cardholder/.test(descriptor)) hasCardField = true;
      if (/\b(cvv|cvc|csc|security ?code)\b/.test(descriptor)) hasCvvField = true;
      if (/\b(exp|expiry|expiration|mm ?\/ ?yy|valid ?thru)\b/.test(descriptor)) hasExpiryField = true;
      if (/\b(otp|one[-_ ]?time|verification code|auth code|pin code|6[-_ ]?digit)\b/.test(descriptor)) hasOtpField = true;
      if (type === 'tel' && /pin/.test(descriptor)) hasOtpField = true;
    });

    const sensitiveFieldCount =
      Number(hasPasswordField) +
      Number(hasCardField) +
      Number(hasCvvField) +
      Number(hasExpiryField) +
      Number(hasOtpField);

    let insecureFormAction = false;
    let externalFormAction = false;
    Array.from(document.querySelectorAll('form')).forEach((form) => {
      const action = form.getAttribute('action') || '';
      if (!action) return;
      try {
        const resolved = new URL(action, loc.href);
        if (resolved.hostname && resolved.hostname !== host) {
          externalFormAction = true;
          if (resolved.protocol === 'http:') insecureFormAction = true;
        }
        if (resolved.protocol === 'http:' && isHttps) insecureFormAction = true;
      } catch (error) {
        if (/^http:\/\//i.test(action)) insecureFormAction = true;
      }
    });

    let mixedContentCount = 0;
    if (isHttps) {
      mixedContentCount = document.querySelectorAll(
        'script[src^="http:"], img[src^="http:"], iframe[src^="http:"], link[href^="http:"]'
      ).length;
    }

    const iframes = Array.from(document.querySelectorAll('iframe[src]'));
    const iframeHosts = [];
    let trustedGateway = false;
    iframes.forEach((frame) => {
      const src = frame.getAttribute('src') || '';
      try {
        const resolved = new URL(src, loc.href);
        iframeHosts.push(resolved.hostname.toLowerCase());
      } catch (error) {
        return;
      }
      if (mayGateway(src, loc.href)) trustedGateway = true;
    });

    if (!trustedGateway) {
      const refs = document.querySelectorAll('a[href], script[src], link[href], form[action]');
      for (const node of refs) {
        const raw = node.getAttribute('href') || node.getAttribute('src') || node.getAttribute('action');
        if (!raw) continue;
        if (mayGateway(raw, loc.href)) {
          trustedGateway = true;
          try {
            iframeHosts.push(new URL(raw, loc.href).hostname.toLowerCase());
          } catch (error) {
            continue;
          }
          break;
        }
      }
    }

    const dataMenuPrices = Array.from(document.querySelectorAll('[data-menu-price]'))
      .map((el) => parseFloat(el.getAttribute('data-menu-price')))
      .filter((n) => !Number.isNaN(n));
    const dataCheckoutPrices = Array.from(document.querySelectorAll('[data-checkout-price]'))
      .map((el) => parseFloat(el.getAttribute('data-checkout-price')))
      .filter((n) => !Number.isNaN(n));

    let menuPriceCount = dataMenuPrices.length;
    let checkoutPriceCount = dataCheckoutPrices.length;
    let priceMismatch = false;
    let priceGap = 0;

    if (dataMenuPrices.length && dataCheckoutPrices.length) {
      const menuSum = dataMenuPrices.reduce((a, b) => a + b, 0);
      const checkoutSum = dataCheckoutPrices.reduce((a, b) => a + b, 0);
      if (menuSum > 0) {
        priceGap = Math.round(((checkoutSum - menuSum) / menuSum) * 100);
        priceMismatch = checkoutSum > menuSum * 1.05;
      }
    } else {
      const menuPrices = kuhaonPresyo(menuText || bodyText);
      const checkoutPrices = kuhaonPresyo(checkoutText);
      menuPriceCount = menuPrices.length;
      checkoutPriceCount = checkoutPrices.length;
      if (menuPrices.length && checkoutPrices.length) {
        const menuMax = Math.max(...menuPrices);
        const checkoutMax = Math.max(...checkoutPrices);
        if (menuMax > 0) {
          priceGap = Math.round(((checkoutMax - menuMax) / menuMax) * 100);
          priceMismatch = checkoutMax > menuMax * 1.15;
        }
      }
    }

    const feeKeywords = mgaNakitAn(checkoutText, BAYAD_MGA_TARAM);
    const outsideCheckout = checkoutText ? bodyText.split(checkoutText).join(' ') : bodyText;
    const menuFeeKeywords = mgaNakitAn(outsideCheckout, BAYAD_MGA_TARAM);
    const hiddenFees = feeKeywords.length > 0 && menuFeeKeywords.length === 0;

    let reviewEls = Array.from(
      document.querySelectorAll('[data-review], .review-item, [class*="review-item"], [class*="reviewItem"], .testimonial')
    );
    if (reviewEls.length === 0) {
      reviewEls = Array.from(document.querySelectorAll('[data-review]'));
    }

    const reviewTexts = reviewEls
      .map((el) => basahonTeksto(el, 500).replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    const uniqueReviews = new Set(reviewTexts);
    const duplicateReviewRatio = reviewTexts.length ? 1 - uniqueReviews.size / reviewTexts.length : 0;

    const ratings = reviewEls
      .map((el) => {
        const attr = el.getAttribute('data-rating');
        if (attr) return parseFloat(attr);
        const match = String(el.innerText || '').match(/([0-5](?:\.[0-9])?)\s*(?:\/\s*5|stars?|★)/i);
        return match ? parseFloat(match[1]) : NaN;
      })
      .filter((n) => !Number.isNaN(n));

    const averageRating = ratings.length
      ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2))
      : 0;

    const reviewTimes = reviewEls
      .map((el) => el.getAttribute('data-review-time'))
      .filter(Boolean)
      .map((t) => new Date(t).getTime())
      .filter((n) => !Number.isNaN(n));

    let ratingBurst = false;
    if (reviewTimes.length >= 4) {
      const span = Math.max(...reviewTimes) - Math.min(...reviewTimes);
      ratingBurst = span <= 1000 * 60 * 60 * 36;
    } else {
      ratingBurst = reviewTexts.length >= 5 && averageRating >= 4.8;
    }

    const compactBody = bodyText.replace(/[\s.-]/g, '');
    const hasPhone = /(?:\+63|0)\d{9,10}/.test(compactBody);

    const addressText = bodyText
      .replace(/e-?mail\s+address/g, ' ')
      .replace(/ip\s+address/g, ' ')
      .replace(/\baddress\b/g, ' ');
    const hasAddress =
      mgaNakitAn(addressText, ADDRESS_MGA_TARAM).length > 0 ||
      /\b(?:blk|lot|unit|bldg|building)\s*\.?\s*\d+/.test(addressText);

    const hasPermitMention = mgaNakitAn(bodyText, PERMIT_MGA_TARAM).length > 0;
    const hasAboutLink = Array.from(document.querySelectorAll('a[href]')).some((a) => {
      const blob = `${String(a.innerText || '')} ${String(a.getAttribute('href') || '')}`.toLowerCase();
      return ABOUT_MGA_TARAM.some((k) => blob.includes(k));
    });

    const advancePayment = ADVANCE_RE.test(bodyText) && !trustedGateway;
    const projectPage = Boolean(document.querySelector('meta[name="ligtas-pangan-page"][content="project"]'));

    return {
      url: loc.href,
      host,
      strippedHost,
      protocol: loc.protocol,
      tld,
      isHttps,
      isIp,
      isPunycode,
      isLocal,
      suspiciousTld: MGA_SUSPEK_TLD.includes(tld),
      subdomainCount,
      hostLength: host.length,
      hyphenCount,
      digitCount,
      title: document.title || '',
      foodKeywordHits: foodHitList.length,
      foodKeywords: foodHitList.slice(0, 8),
      knownFoodHost,
      hasMenuBlock,
      hasCheckoutBlock,
      hasOrderButton,
      hasSearchField,
      hasPasswordField,
      hasCardField,
      hasCvvField,
      hasExpiryField,
      hasOtpField,
      sensitiveFieldCount,
      formCount: document.querySelectorAll('form').length,
      insecureFormAction,
      externalFormAction,
      mixedContentCount,
      hasIframe: iframes.length > 0,
      iframeHosts: iframeHosts.slice(0, 8),
      trustedGateway,
      menuPriceCount,
      checkoutPriceCount,
      priceMismatch,
      priceGap,
      hiddenFees,
      feeKeywords: feeKeywords.slice(0, 6),
      reviewCount: reviewTexts.length,
      duplicateReviewRatio: Number(duplicateReviewRatio.toFixed(2)),
      ratingBurst,
      averageRating,
      hasPhone,
      hasAddress,
      hasPermitMention,
      hasAboutLink,
      advancePayment,
      projectPage,
      extractedAt: new Date().toISOString()
    };
  }

  const MGA_SUBOK = [
    {
      code: 'not-https',
      label: 'The connection is not secure (no HTTPS)',
      weight: 2.2,
      test: (s) => !s.isHttps && !s.isLocal
    },
    {
      code: 'ip-host',
      label: 'The address is a raw IP number instead of a domain',
      weight: 2.0,
      test: (s) => s.isIp && !s.isLocal
    },
    {
      code: 'punycode',
      label: 'The domain may be imitating a real brand (punycode)',
      weight: 2.4,
      test: (s) => s.isPunycode
    },
    {
      code: 'suspicious-tld',
      label: 'The domain uses a high-abuse top-level domain',
      weight: 1.4,
      test: (s) => s.suspiciousTld && !s.isLocal
    },
    {
      code: 'many-hyphens',
      label: 'The domain name contains many hyphens',
      weight: 1.1,
      test: (s) => s.hyphenCount >= 3
    },
    {
      code: 'card-field',
      label: 'The page collects card details directly',
      weight: 1.6,
      test: (s) => s.hasCardField
    },
    {
      code: 'otp-field',
      label: 'The page asks for a one-time PIN',
      weight: 1.0,
      test: (s) => s.hasOtpField
    },
    {
      code: 'password-field',
      label: 'The page asks for your password outside a known login page',
      weight: 1.2,
      test: (s) => s.hasPasswordField && !s.hasAboutLink
    },
    {
      code: 'insecure-form',
      label: 'The payment form submits data over an insecure connection',
      weight: 3.0,
      test: (s) => s.insecureFormAction
    },
    {
      code: 'external-form',
      label: 'The form sends your payment details to a different site',
      weight: 1.2,
      test: (s) => s.externalFormAction
    },
    {
      code: 'mixed-content',
      label: 'The page loads insecure content',
      weight: 0.8,
      test: (s) => s.mixedContentCount > 0
    },
    {
      code: 'price-mismatch',
      label: 'The price changes between the menu and the checkout',
      weight: 1.4,
      test: (s) => s.priceMismatch
    },
    {
      code: 'hidden-fees',
      label: 'Undisclosed fees appear only at checkout',
      weight: 0.7,
      test: (s) => s.hiddenFees
    },
    {
      code: 'duplicate-reviews',
      label: 'Many reviews repeat exactly the same wording',
      weight: 1.2,
      test: (s) => s.duplicateReviewRatio > 0.5
    },
    {
      code: 'review-burst',
      label: 'A burst of perfect reviews was posted within a short time',
      weight: 0.6,
      test: (s) => s.ratingBurst
    },
    {
      code: 'advance-payment',
      label: 'The page demands full advance payment before verification',
      weight: 0.8,
      test: (s) => s.advancePayment
    },
    {
      code: 'no-phone',
      label: 'No contact number is published',
      weight: 0.5,
      test: (s) => !s.hasPhone
    },
    {
      code: 'no-address',
      label: 'No physical address is published',
      weight: 0.6,
      test: (s) => !s.hasAddress
    },
    {
      code: 'no-permit',
      label: 'No business registration or permit is shown',
      weight: 0.3,
      test: (s) => !s.hasPermitMention
    },
    {
      code: 'has-phone',
      label: 'A contact number is published',
      weight: -0.35,
      positive: true,
      test: (s) => s.hasPhone
    },
    {
      code: 'has-address',
      label: 'A physical address is published',
      weight: -0.4,
      positive: true,
      test: (s) => s.hasAddress
    },
    {
      code: 'has-permit',
      label: 'Business registration is stated',
      weight: -0.3,
      positive: true,
      test: (s) => s.hasPermitMention
    },
    {
      code: 'trusted-gateway',
      label: 'Payment is handled by a recognized gateway',
      weight: -0.35,
      positive: true,
      test: (s) => s.trustedGateway
    },
    {
      code: 'food-keywords',
      label: 'The page clearly presents itself as food ordering',
      weight: -0.3,
      positive: true,
      test: (s) => s.foodKeywordHits > 0
    },
    {
      code: 'consistent-prices',
      label: 'Menu and checkout prices match',
      weight: -0.3,
      positive: true,
      test: (s) => !s.priceMismatch && s.menuPriceCount > 0
    },
    {
      code: 'contact-details',
      label: 'Reachable contact details are easy to find',
      weight: -0.25,
      positive: true,
      test: (s) => s.hasAboutLink && (s.hasPhone || s.hasAddress)
    }
  ];

  function verdictGikanScore(score) {
    if (score >= SAGANG.danger) return 'danger';
    if (score >= SAGANG.caution) return 'caution';
    return 'safe';
  }

  function timbangonRisgo(signals) {
    const s = signals || {};
    let logit = -1.2;
    const reasons = [];
    const positives = [];

    for (const rule of MGA_SUBOK) {
      let fired = false;
      try {
        fired = Boolean(rule.test(s));
      } catch (error) {
        fired = false;
      }
      if (!fired) continue;
      logit += rule.weight;
      const entry = { code: rule.code, label: rule.label, weight: rule.weight };
      if (rule.weight >= 0) reasons.push(entry);
      else positives.push(entry);
    }

    let score = Math.max(0, Math.min(100, Math.round(100 * sigmoid(logit))));

    const malubhangSenyal =
      Boolean(s.insecureFormAction) ||
      Boolean(s.externalFormAction) ||
      Boolean(s.advancePayment) ||
      Boolean(s.priceMismatch && Number(s.priceGap) >= 0.2);

    if (s.knownFoodHost && !malubhangSenyal) {
      score = Math.min(score, 24);
      positives.push({ code: 'known-platform', label: 'Known food delivery platform', weight: -1 });
    }

    reasons.sort((a, b) => b.weight - a.weight);
    positives.sort((a, b) => a.weight - b.weight);

    return {
      score,
      verdict: verdictGikanScore(score),
      source: 'device',
      reasons: reasons.slice(0, 8),
      positives: positives.slice(0, 6),
      explanation:
        score >= SAGANG.danger
          ? 'Several fraud indicators were found on this page. Do not enter payment details or send money.'
          : score >= SAGANG.caution
            ? 'This page shows warning signs. Verify the seller before you pay anything.'
            : 'No significant fraud indicators were found. This page looks like a legitimate food ordering site.',
      guidance:
        score >= SAGANG.danger
          ? [
              'Do not enter your card number, one-time PIN, or password.',
              'Do not send advance payment to a personal account.',
              'Verify the seller through an official number or the school office.',
              'Report this page and close the tab.'
            ]
          : score >= SAGANG.caution
            ? [
                'Compare the checkout total with the advertised menu price.',
                'Look for a business permit, a physical address, and a contact number.',
                'Pay only through a recognized payment gateway.',
                'Ask for an official receipt before paying.'
              ]
            : [
                'Still review the total amount before you pay.',
                'Keep your receipt and order confirmation.',
                'Use only the payment method shown on this page.'
              ],
      checkedAt: Date.now()
    };
  }

  function dapatBantayan(signals) {
    if (!signals || signals.projectPage) return false;
    const mayBayad = signals.sensitiveFieldCount > 0;
    const mayEstruktura = signals.hasMenuBlock || signals.hasCheckoutBlock || signals.hasOrderButton;
    if (signals.knownFoodHost) return true;
    if (signals.foodKeywordHits >= 3) return true;
    if (signals.foodKeywordHits >= 2 && (mayEstruktura || mayBayad)) return true;
    if (mayEstruktura && signals.foodKeywordHits >= 1) return true;
    if (signals.foodKeywordHits >= 2 && signals.menuPriceCount > 0) return true;
    return false;
  }

  function hustoAngHost(host, list) {
    if (!host || !Array.isArray(list)) return false;
    const target = String(host).toLowerCase();
    return list.some((entry) => {
      const site = String(entry || '').trim().toLowerCase().replace(/^www\./, '');
      return site.length > 0 && (target === site || target.endsWith('.' + site));
    });
  }

  function iligtasVerdict(payload, host, trustedSites, blockedSites) {
    if (hustoAngHost(host, blockedSites)) {
      return {
        ...payload,
        score: 100,
        verdict: 'danger',
        blocked: true,
        reasons: [
          { code: 'blocked-host', label: 'This seller is on your blocked list', weight: 100 },
          ...(payload.reasons || [])
        ],
        positives: [],
        explanation: 'You blocked this seller, so LigtasPangan treats the page as unsafe.',
        guidance: [
          'Do not send money or enter payment details.',
          'Remove the seller from the blocked list only if you are certain it is legitimate.'
        ]
      };
    }

    if (hustoAngHost(host, trustedSites)) {
      return {
        ...payload,
        score: 0,
        verdict: 'safe',
        trusted: true,
        reasons: [],
        explanation: 'You marked this seller as trusted, so LigtasPangan did not raise a warning.',
        guidance: [
          'Still review the total amount before you pay.',
          'Remove the seller from the trusted list if anything looks wrong.'
        ]
      };
    }

    return payload;
  }

  globalThis.LigtasPangan = {
    SAGANG,
    ESTADO,
    PANGAN_MGA_TARAM,
    BAYAD_MGA_TARAM,
    GATEWAY_MGA_HOST,
    kuhaonSignals,
    timbangonRisgo,
    verdictGikanScore,
    dapatBantayan,
    hustoAngHost,
    iligtasVerdict
  };
})();
