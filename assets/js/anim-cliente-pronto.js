/* Animação "O cliente chega pronto." (Topo do site)
   - Usa o window.gsap que o site já carrega (3.12.5). Sem build, sem dependências.
   - Cada etapa (anúncio, vídeo, pesquisa) aparece na tela do celular, sai dela e fica flutuando em volta;
     na tela fica a compra: conversa, "Venda fechada" e 5 estrelas.
   - Toca uma vez; depois os cartões flutuam devagar. Com "reduzir movimento", mostra o quadro final parado.
   - Para quando o Topo sai da tela ou a aba fica escondida. Só transform e opacity.
   API: window.alcanceAnim.iniciar(raiz, { rolagem: true }) e window.alcanceAnim.progresso(0–1). */
(function () {
  'use strict';

  var D = 4.5;          // duração da entrada (s)
  var P = 6;            // período da flutuação (s); o ciclo fecha sem emenda
  var R = 285;          // raio do carrossel em volta do celular (px do palco virtual)
  var CS = 0.7;         // escala dos cartões quando flutuam
  var POSE = { z: 10, y: -14, x: 14 };   // pose final do celular, igual à do site
  var TAU = Math.PI * 2;

  var TENIS =
    '<path d="M22 106 C20 80 34 62 66 60 C98 58 118 42 148 35 C168 30 182 44 196 56 C214 70 250 74 272 84 C286 90 292 98 292 106 Z" fill="#45454f"/>' +
    '<path d="M22 104 C18 76 26 52 42 46 L60 50 C48 62 44 82 46 104 Z" fill="#33333b"/>' +
    '<path d="M200 60 C222 74 254 78 274 86 C286 92 292 98 292 106 L236 106 C232 90 218 74 200 60 Z" fill="#3a3a44"/>' +
    '<path d="M86 94 C128 84 182 82 246 93" fill="none" stroke="#d6d6db" stroke-width="3" stroke-linecap="round" opacity="0.55"/>' +
    '<path d="M100 100 C140 92 186 91 236 99" fill="none" stroke="#d6d6db" stroke-width="2" stroke-linecap="round" opacity="0.3"/>' +
    '<g stroke="#e9e9ee" stroke-width="3.2" stroke-linecap="round"><path d="M150 44l14 10"/><path d="M160 38l14 10"/><path d="M170 34l14 11"/><path d="M180 34l12 12"/></g>' +
    '<path d="M16 100 L262 104 C280 104 292 98 298 90 C302 98 300 112 290 120 C280 128 264 132 244 132 L44 134 C26 134 14 124 14 112 Z" fill="#ececf0"/>' +
    '<path d="M16 118 C80 120 200 120 290 116" fill="none" stroke="#c8c8cf" stroke-width="2"/>' +
    '<path d="M40 134 L250 132" stroke="#8a8a94" stroke-width="3.5" stroke-linecap="round"/>';

  function estrela(acesa) {
    var c = acesa ? '#f0a64a' : '#4a4a55';
    return '<svg viewBox="0 0 24 24"' + (acesa ? ' class="anim-cp-on"' : '') + '><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z" fill="' +
      (acesa ? c : 'none') + '" stroke="' + c + '" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  }

  var clamp = function (v) { return Math.max(0, Math.min(1, v)); };
  var suave = function (v) { return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2; };

  function iniciar(raiz, opcoes) {
    opcoes = opcoes || {};
    if (!raiz || raiz.__animCp) return raiz && raiz.__animCp;
    var q = function (s) { return raiz.querySelector(s); };
    var qa = function (s) { return Array.prototype.slice.call(raiz.querySelectorAll(s)); };

    qa('.anim-cp-tenis').forEach(function (s) { s.innerHTML = TENIS; });
    var est = q('.anim-cp-estrelas');
    est.innerHTML = [0, 1, 2, 3, 4].map(function () { return '<div class="anim-cp-est">' + estrela(false) + estrela(true) + '</div>'; }).join('');

    // escala o palco virtual (1000 x 1460) para caber inteiro no .palco, sem cortar
    var palco = q('.anim-cp-palco');
    function medir() {
      var r = raiz.getBoundingClientRect();
      if (r.width && r.height) palco.style.setProperty('--anim-cp-k', Math.min(r.width / 1000, r.height / 1460).toFixed(4));
    }
    medir();
    if (window.ResizeObserver) new ResizeObserver(medir).observe(raiz);
    else window.addEventListener('resize', medir);

    var cel = q('.anim-cp-cel');
    var cards = [
      { el: q('.anim-cp-ad'),  w: 420, app: 0.25, lift: 0.75, c: -82, A: 6, ph: 0.0, y: -330 },
      { el: q('.anim-cp-vid'), w: 440, app: 0.95, lift: 1.4,  c: 78,  A: 5, ph: 2.1, y: -480 },
      { el: q('.anim-cp-bus'), w: 430, app: 1.6,  lift: 2.05, c: 98,  A: 6, ph: 3.6, y: 430 }
    ];

    // Posição de tudo no instante t (s). t > D = flutuação contínua.
    function posicionar(t) {
      var pe = suave(clamp(t / 0.7));
      var rz = 4 + (POSE.z - 4) * pe, ry = -38 + (POSE.y + 38) * pe, rx = 4 + (POSE.x - 4) * pe;
      var py = 30 * (1 - pe) + 4 * Math.sin(TAU * t / 3) * pe;
      cel.style.transform = 'translate3d(0,' + py.toFixed(2) + 'px,0) rotate(' + rz.toFixed(3) + 'deg) rotateY(' + ry.toFixed(3) + 'deg) rotateX(' + rx.toFixed(3) + 'deg)';
      cards.forEach(function (c) {
        var a = clamp((t - c.app) / 0.22);
        var e = suave(clamp((t - c.lift) / 0.6));
        var k = 1 - e;
        var th = (c.c + c.A * Math.sin(TAU * t / P + c.ph)) * e * Math.PI / 180;
        var x = R * e * Math.sin(th);
        var z = R * e * Math.cos(th) * 0.9 + 70 * Math.sin(Math.PI * e);
        var y = c.y * e + py * k;
        var s = (340 / c.w) * k + CS * e;
        c.el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,' + z.toFixed(2) + 'px) rotate(' + (rz * k).toFixed(3) + 'deg) rotateY(' +
          (ry * k - Math.sin(th) * 18 * e).toFixed(3) + 'deg) rotateX(' + (rx * k).toFixed(3) + 'deg) translateZ(' + (14 * k).toFixed(2) + 'px) scale(' + (s * (0.94 + 0.06 * a)).toFixed(4) + ')';
        c.el.style.opacity = a;
      });
    }

    var gsap = window.gsap;
    var reduzir = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var api = { timeline: null, progresso: function () {}, parar: function () {}, retomar: function () {} };
    raiz.__animCp = api;

    // Sem GSAP ou com "reduzir movimento": quadro final, parado
    function quadroFinal() {
      posicionar(D);
      qa('.anim-cp-bal-cli, .anim-cp-bal-loja, .anim-cp-venda, .anim-cp-aval, .anim-cp-on').forEach(function (n) { n.style.opacity = 1; });
      q('.anim-cp-digitando').style.opacity = 0;
      raiz.classList.add('anim-cp-pronto');
    }
    if (!gsap || reduzir) { quadroFinal(); return api; }

    var relogio = { t: 0 };
    var tl = gsap.timeline({ paused: true, defaults: { overwrite: 'auto' } });
    tl.to(relogio, { t: D, duration: D, ease: 'none', onUpdate: function () { posicionar(relogio.t); } }, 0);
    tl.fromTo(q('.anim-cp-prog'), { scaleX: 0.25 }, { scaleX: 0.62, duration: 3.4, ease: 'none' }, 1.0);
    // a tela mostra as etapas; o app de mensagens entra depois da 3ª
    tl.fromTo(qa('.anim-cp-chat-topo, .anim-cp-campo, .anim-cp-enviar'), { opacity: 0 }, { opacity: 1, duration: 0.25 }, 2.15);
    tl.set(qa('.anim-cp-bal-cli, .anim-cp-digitando, .anim-cp-bal-loja, .anim-cp-venda, .anim-cp-aval'), { opacity: 0 }, 0);
    tl.fromTo(q('.anim-cp-bal-cli'), { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(1.8)' }, 2.3);
    tl.fromTo(q('.anim-cp-digitando'), { opacity: 0 }, { opacity: 1, duration: 0.1 }, 2.55);
    tl.to(qa('.anim-cp-digitando i'), { y: -4, duration: 0.1, stagger: 0.05, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 2.56);
    tl.set(q('.anim-cp-digitando'), { opacity: 0 }, 2.75);
    tl.fromTo(q('.anim-cp-bal-loja'), { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(1.8)' }, 2.75);
    tl.fromTo(q('.anim-cp-venda'), { opacity: 0, scale: 0.85, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 0.36, ease: 'back.out(1.6)' }, 3.0);
    tl.fromTo(q('.anim-cp-ok svg'), { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.28, ease: 'back.out(2)' }, 3.18);
    tl.fromTo(q('.anim-cp-aval'), { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.36, ease: 'power3.out' }, 3.3);
    qa('.anim-cp-est').forEach(function (s, i) {
      var t = 3.5 + i * 0.12;
      tl.fromTo(s.querySelector('.anim-cp-on'), { opacity: 0 }, { opacity: 1, duration: 0.1 }, t);
      tl.fromTo(s, { scale: 1 }, { scale: 1.22, duration: 0.08, yoyo: true, repeat: 1, ease: 'power2.out' }, t);
    });
    api.timeline = tl;

    // Flutuação depois da entrada: devagar, pouco deslocamento
    var flutuando = false, visivel = true, t0 = 0;
    function passo() { posicionar(D + ((gsap.ticker.time - t0) % P)); }
    function ligarFlutuacao() {
      if (flutuando || !visivel || tl.progress() < 1) return;
      flutuando = true; t0 = gsap.ticker.time; gsap.ticker.add(passo);
    }
    function desligarFlutuacao() { if (flutuando) { flutuando = false; gsap.ticker.remove(passo); } }
    tl.eventCallback('onComplete', ligarFlutuacao);

    var porRolagem = !!opcoes.rolagem;
    api.progresso = function (p) {
      porRolagem = true;
      desligarFlutuacao();
      tl.pause().progress(clamp(p));
      if (p >= 1) ligarFlutuacao();
    };
    // posiciona tudo num instante exato (s), inclusive na flutuação; usado para gerar vídeo e imagem
    api.instante = function (t) {
      porRolagem = true;
      tl.pause().progress(clamp(t / D), true);
      desligarFlutuacao();
      posicionar(t);   // com eventos suprimidos o onUpdate não roda; posiciona direto
    };
    api.parar = function () { visivel = false; tl.pause(); desligarFlutuacao(); };
    api.retomar = function () {
      visivel = true;
      if (tl.progress() >= 1) ligarFlutuacao();
      else if (!porRolagem) tl.play();
    };

    // Pausa fora da tela e com a aba escondida
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (es) {
        es[0].isIntersecting && !document.hidden ? api.retomar() : api.parar();
      }, { threshold: 0.05 }).observe(raiz);
    }
    document.addEventListener('visibilitychange', function () { document.hidden ? api.parar() : api.retomar(); });

    posicionar(0);
    raiz.classList.add('anim-cp-pronto');
    if (!porRolagem) tl.play();
    return api;
  }

  var ultima = null;
  window.alcanceAnim = {
    iniciar: function (raiz, opcoes) {
      if (raiz && !raiz.matches('[data-anim-cp]')) raiz = raiz.querySelector('[data-anim-cp]');
      ultima = iniciar(raiz, opcoes);
      return ultima;
    },
    progresso: function (p) { if (ultima) ultima.progresso(p); }
  };

  // Inicia sozinho, a menos que o HTML peça modo manual: <div class="anim-cp" data-anim-cp="manual">
  function auto() {
    var r = document.querySelector('[data-anim-cp]');
    if (!r || r.getAttribute('data-anim-cp') === 'manual') return;
    // se o GSAP ainda não chegou, espera a página carregar antes de desistir para o quadro parado
    if (!window.gsap && document.readyState !== 'complete') window.addEventListener('load', function () { window.alcanceAnim.iniciar(r); });
    else window.alcanceAnim.iniciar(r);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto);
  else auto();
})();
