/* Aviso de cookies e carregamento condicional de Meta Pixel e Google Analytics 4 (LGPD).
   Veio do servidor (commit 994ab18) e foi ajustado ao visual do site novo; eventos em /assets/js/rastreio.js. */
(function () {
  var PIXEL = '1788250782417350';
  var GA = 'G-QRW158WZFK';
  var KEY = 'alcance_cookie_consent';
  var VERSION = 1;
  var MAX_AGE = 365 * 24 * 60 * 60 * 1000;
  var loaded = false;

  // A escolha fica no localStorage (por endereço) e também num cookie do domínio .alcancemkt.com,
  // para o site e o Check-up (app.alcancemkt.com) compartilharem o mesmo aceite ou recusa.
  function valida(raw) {
    try {
      var o = JSON.parse(raw);
      if (o && o.v === VERSION && typeof o.analytics === 'boolean' && (Date.now() - o.ts) < MAX_AGE) return o;
    } catch (e) {}
    return null;
  }

  function noDominioAlcance() { return /(^|\.)alcancemkt\.com$/.test(location.hostname); }

  function lerCookie() {
    var partes = document.cookie ? document.cookie.split(';') : [];
    for (var i = 0; i < partes.length; i++) {
      var p = partes[i].replace(/^\s+/, '');
      if (p.indexOf(KEY + '=') !== 0) continue;
      try { var v = valida(decodeURIComponent(p.slice(KEY.length + 1))); if (v) return v; } catch (e) {}
    }
    return null;
  }

  function gravarCookie(o) {
    if (!noDominioAlcance()) return;
    try {
      document.cookie = KEY + '=' + encodeURIComponent(JSON.stringify(o)) +
        '; domain=.alcancemkt.com; path=/; max-age=31536000; SameSite=Lax; Secure';
    } catch (e) {}
  }

  function read() {
    var c = lerCookie();
    if (c) return c;
    var o = null;
    try { o = valida(localStorage.getItem(KEY)); } catch (e) {}
    if (o) gravarCookie(o); // só existia no localStorage: copia para o cookie
    return o;
  }

  function write(analytics) {
    var o = { v: VERSION, analytics: analytics, ts: Date.now() };
    try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {}
    gravarCookie(o);
  }

  // GA4 e Pixel só carregam e enviam eventos nos endereços oficiais (lista de permitidos).
  // Em localhost, IP, *.local, *.test, prévias etc. o aviso de cookies aparece, mas nada é carregado.
  var HOSTS_OFICIAIS = ['alcancemkt.com', 'www.alcancemkt.com'];
  function emEnderecoOficial() { return HOSTS_OFICIAIS.indexOf(location.hostname) !== -1; }

  // Modo de Consentimento do Google v2: os quatro sinais sempre mudam juntos.
  function estadoConsentimento(v) {
    return { ad_storage: v, analytics_storage: v, ad_user_data: v, ad_personalization: v };
  }
  function atualizaConsentimento(concedido) {
    if (typeof window.gtag === 'function') window.gtag('consent', 'update', estadoConsentimento(concedido ? 'granted' : 'denied'));
  }

  function loadTracking() {
    if (loaded) return;
    if (!emEnderecoOficial()) return;
    loaded = true;

    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', PIXEL);
    fbq('track', 'PageView');

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    // Modo de Consentimento do Google v2 (básico): primeiro o padrão negado, antes de qualquer outro comando.
    window.gtag('consent', 'default', estadoConsentimento('denied'));
    // O GA4 só carrega depois do aceite, então o consentimento é concedido assim que o rastreamento carrega
    // (vale também para quem já tinha aceitado antes e não vê o aviso de novo).
    atualizaConsentimento(true);
    var g = document.createElement('script');
    g.async = true;
    g.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA;
    document.head.appendChild(g);
    gtag('js', new Date());
    gtag('config', GA);
  }

  function clearCookies() {
    var host = location.hostname;
    var parts = host.split('.');
    var domains = [host, '.' + host];
    if (parts.length > 2) domains.push('.' + parts.slice(-2).join('.'));
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (/^(_ga|_gid|_gat|_fbp|_fbc)/.test(name)) {
        var base = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
        document.cookie = base;
        domains.forEach(function (d) { document.cookie = base + '; domain=' + d; });
      }
    });
  }

  // Eventos (Contact, CheckupClique, GA4) ficam em /assets/js/rastreio.js.
  // trackLead não faz mais nada: o Lead agora só acontece no envio final do Check-up (app.alcancemkt.com).
  window.trackLead = function () {};

  var css = '' +
    '.ac-cookie,.ac-cookie *{box-sizing:border-box}' +
    '.ac-cookie{position:fixed;left:16px;bottom:16px;z-index:2147483000;max-width:420px;width:calc(100% - 32px);' +
    'background:rgba(27,27,32,.97);color:#D6D6DB;border:1px solid #33333B;border-radius:12px;padding:20px;' +
    'font:400 14px/1.55 "Outfit",system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 16px 40px rgba(0,0,0,.5)}' +
    '.ac-cookie[hidden]{display:none!important}' +
    '.ac-cookie h2{font:600 16px/1.25 "Outfit",system-ui,sans-serif;letter-spacing:-.01em;margin:0 0 8px;color:#fff;border:0;padding:0}' +
    '.ac-cookie p{margin:0 0 16px;color:#A8A8B0}' +
    '.ac-cookie a{color:#fff;text-decoration:underline;text-underline-offset:3px}' +
    '.ac-cookie .ac-actions{display:flex;gap:10px}' +
    '.ac-cookie button{flex:1 1 0;min-height:44px;padding:10px 14px;border-radius:8px;cursor:pointer;' +
    'font:600 14px/1 "Outfit",system-ui,sans-serif;border:1px solid #33333B;transition:background-color .12s}' +
    '.ac-cookie .ac-refuse{background:transparent;color:#fff}' +
    '.ac-cookie .ac-refuse:hover{background:#26262E}' +
    '.ac-cookie .ac-accept{background:#fff;color:#0D0D0F;border-color:#fff}' +
    '.ac-cookie .ac-accept:hover{background:#E4E4E8}' +
    '.ac-cookie button:focus-visible{outline:2px solid #fff;outline-offset:2px}' +
    /* a escolha é reaberta pelo link "Preferências de cookies" do rodapé; o botão flutuante não aparece
       (no celular ele brigaria com o botão fixo do Check-up) */
    '.ac-pill{display:none!important}' +
    '@media(max-width:480px){.ac-cookie{left:8px;right:8px;bottom:8px;width:auto;max-width:none;padding:16px}}';

  var box, pill;

  function showBanner() { pill.hidden = true; box.hidden = false; var b = box.querySelector('.ac-accept'); if (b) b.focus(); }
  function hideBanner() { box.hidden = true; pill.hidden = false; }

  function decide(analytics) {
    var wasLoaded = loaded;
    write(analytics);
    hideBanner();
    if (analytics) {
      loadTracking();
    } else {
      atualizaConsentimento(false); // só tem efeito se o GA4 já estava carregado
      clearCookies();
      if (wasLoaded) location.reload();
    }
  }

  function init() {
    var st = document.createElement('style');
    st.appendChild(document.createTextNode(css));
    document.head.appendChild(st);

    box = document.createElement('div');
    box.className = 'ac-cookie';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Aviso de cookies');
    box.hidden = true;
    box.innerHTML =
      '<h2>Sua privacidade</h2>' +
      '<p>Usamos o Google Analytics e o Pixel da Meta para medir o desempenho do site e de nossos anúncios. ' +
      'Eles só são ativados se você aceitar, e você pode mudar de ideia quando quiser. ' +
      'Saiba mais na <a href="/privacidade.html">Política de Privacidade</a>.</p>' +
      '<div class="ac-actions">' +
      '<button type="button" class="ac-refuse">Recusar</button>' +
      '<button type="button" class="ac-accept">Aceitar</button>' +
      '</div>';
    document.body.appendChild(box);

    pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'ac-pill';
    pill.textContent = 'Preferências de cookies';
    pill.hidden = true;
    document.body.appendChild(pill);

    box.querySelector('.ac-accept').addEventListener('click', function () { decide(true); });
    box.querySelector('.ac-refuse').addEventListener('click', function () { decide(false); });
    pill.addEventListener('click', showBanner);
    window.acOpenConsent = showBanner;

    var c = read();
    if (c) {
      if (c.analytics) loadTracking();
      pill.hidden = false;
    } else {
      box.hidden = false;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
