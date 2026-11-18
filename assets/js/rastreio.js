/* Alcance — rastreamento de leads (origem de entrada, links do Check-up e do WhatsApp, eventos do GA4 e do Meta Pixel).
   O GA4 e o Pixel são carregados pelo /consent.js, só depois do aceite de cookies (ID do Pixel: 1788250782417350).
   Não depende de GSAP. Tudo protegido: sem localStorage, sem gtag ou sem Pixel, os links continuam com o href padrão do HTML. */
(function () {
  var CHAVE = 'alcance_origem', VALIDADE = 30 * 24 * 60 * 60 * 1000; // 30 dias
  var PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'];
  var CHECKUP = 'https://app.alcancemkt.com/checkup';
  var ZAP_PADRAO = 'Oi! Vim pelo site da Alcance';
  var ZAP_ANUNCIO = 'Oi! Vi o anúncio e vim pelo site da Alcance';
  var pagina = /^\/servicos(\/|$)/.test(location.pathname) ? 'servicos' : 'home';

  /* ─── 1. Origem de entrada (primeiro toque, válida por 30 dias) ─── */
  function classifica(ref) {
    if (!ref) return 'direto';
    var host;
    try { host = new URL(ref).hostname.replace(/^www\./, ''); } catch (e) { return 'outro'; }
    if (host === location.hostname.replace(/^www\./, '')) return 'direto';
    if (/(^|\.)google\./.test(host)) return 'google';
    if (/(^|\.)instagram\.com$/.test(host)) return 'instagram';
    if (/(^|\.)(facebook\.com|fb\.com|fb\.me)$/.test(host)) return 'facebook';
    return 'outro';
  }
  function le() {
    try {
      var o = JSON.parse(localStorage.getItem(CHAVE) || 'null');
      if (o && Date.now() - o.quando < VALIDADE) return o;
    } catch (e) {}
    return null;
  }
  function guarda(o) { try { localStorage.setItem(CHAVE, JSON.stringify(o)); } catch (e) {} }

  var url = new URLSearchParams(location.search);
  var agora = { quando: Date.now(), referrer: classifica(document.referrer) };
  PARAMS.forEach(function (p) { var v = url.get(p); if (v) agora[p] = v.slice(0, 200); });
  var origem = le();
  // Origem de anúncio (utm_source, fbclid ou gclid na URL) substitui a guardada e renova os 30 dias.
  // Sem nenhum dos três, a origem guardada continua valendo (e, sem nada guardado, grava a atual).
  var trazOrigem = !!(agora.utm_source || agora.fbclid || agora.gclid);
  if (trazOrigem || !origem) { origem = agora; guarda(origem); }

  var temUtm = !!origem.utm_source;
  var pago = !!(origem.fbclid || origem.gclid) || /^(pago|cpc|paid|ppc|cpm|paid_?social|ads?)$/i.test(origem.utm_medium || '');

  /* ─── 2. Parâmetros que vão para o Check-up ─── */
  function utms(posicao) {
    var q = new URLSearchParams();
    if (temUtm) {
      q.set('utm_source', origem.utm_source);
      if (origem.utm_medium) q.set('utm_medium', origem.utm_medium);
      if (origem.utm_campaign) q.set('utm_campaign', origem.utm_campaign);
    } else {
      var direto = origem.referrer === 'direto';
      q.set('utm_source', direto ? 'site' : origem.referrer);
      q.set('utm_medium', direto ? 'direto' : 'organico');
      q.set('utm_campaign', 'site');
    }
    // Origem de anúncio: repassa o anúncio (utm_content) e o público (utm_term) guardados.
    // Sem utm_content guardado (visita orgânica ou direta), vai a posição do botão, como antes.
    q.set('utm_content', origem.utm_content || posicao);
    if (origem.utm_term) q.set('utm_term', origem.utm_term);
    if (origem.fbclid) q.set('fbclid', origem.fbclid);
    if (origem.gclid) q.set('gclid', origem.gclid);
    return q;
  }
  function origemTexto() { var q = utms('x'); return q.get('utm_source') + ' / ' + q.get('utm_medium'); }

  function montaLinks() {
    [].forEach.call(document.querySelectorAll('a[href^="' + CHECKUP + '"]'), function (a) {
      var posicao = a.getAttribute('data-secao') || (pagina + '-desconhecida');
      a.href = CHECKUP + '?' + utms(posicao).toString();
    });
    // 4. WhatsApp da página inicial: quem veio de anúncio manda a mensagem do anúncio
    if (pagina === 'home' && pago) {
      [].forEach.call(document.querySelectorAll('a[href^="https://wa.me/"]'), function (a) {
        var u = new URL(a.href);
        if (u.searchParams.get('text') === ZAP_PADRAO) { u.searchParams.set('text', ZAP_ANUNCIO); a.href = u.toString(); }
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montaLinks); else montaLinks();

  /* ─── 5. Meta Pixel e GA4: quem carrega é o aviso de cookies (/consent.js), só depois do "Aceitar".
         Aqui só enviamos eventos se eles já estiverem ligados. ─── */
  // Só envia eventos nos endereços oficiais (mesma lista do consent.js); em testes e prévias não envia nada.
  var EM_ENDERECO_OFICIAL = ['alcancemkt.com', 'www.alcancemkt.com'].indexOf(location.hostname) !== -1;
  function ga(nome, dados) { if (EM_ENDERECO_OFICIAL && typeof window.gtag === 'function') window.gtag('event', nome, dados); }
  function px(nome, dados) { if (EM_ENDERECO_OFICIAL && typeof window.fbq === 'function') window.fbq('track', nome, dados); }

  function pxCustom(nome, dados) { if (EM_ENDERECO_OFICIAL && typeof window.fbq === 'function') window.fbq('trackCustom', nome, dados); }

  /* ─── 3. Cliques (GA4: pagina, secao, origem).
         WhatsApp: evento clique_whatsapp no GA4 e Contact no Pixel.
         Check-up: o clique NÃO é Lead. Vai como checkup_clique no GA4 e CheckupClique (evento próprio) no Pixel.
         O Lead fica só no envio final do Check-up (API de Conversões, no app.alcancemkt.com). ─── */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-evento]');
    if (!a) return;
    var evento = a.getAttribute('data-evento'), secao = a.getAttribute('data-secao') || (pagina + '-desconhecida');
    var dados = { pagina: pagina, secao: secao, origem: origemTexto(), link_url: a.href };
    if (evento === 'clique_checkup') {
      ga('checkup_clique', dados);
      pxCustom('CheckupClique', { content_name: secao });
      return;
    }
    ga(evento, dados);
    if (evento === 'clique_whatsapp') px('Contact', { content_name: secao });
  });

  // para conferência (prévia e testes): window.alcanceOrigem mostra o que foi guardado
  window.alcanceOrigem = { origem: origem, pago: pago, utms: function (p) { return utms(p).toString(); } };
})();
