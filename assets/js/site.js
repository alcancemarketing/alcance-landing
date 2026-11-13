/* Alcance — interações. GSAP + ScrollTrigger + Lenis vêm por CDN (defer); sem eles, a página fica parada e inteira. */
(function () {
  var semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raiz = document.documentElement;

  /* ─── Rolagem e profundidade (Apple / Linear) ─── */
  if (!semMovimento && window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    // Lenis só no computador: no celular, a rolagem nativa é melhor
    var lenis = null;
    if (window.Lenis && matchMedia('(hover: hover) and (pointer: fine) and (min-width: 900px)').matches) {
      lenis = new Lenis({ lerp: 0.12 });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
      document.addEventListener('click', function (e) {
        var a = e.target.closest('a[href^="#"]');
        if (!a || a.getAttribute('href').length < 2) return;
        var alvo = document.querySelector(a.getAttribute('href'));
        if (!alvo) return;
        e.preventDefault();
        lenis.scrollTo(alvo, { offset: -64 });
      });
    }

    // Topo: a animação do palco (anim-cliente-pronto.js) toca sozinha quando aparece na tela,
    // então o topo não fica mais parado na rolagem.
    var mm = gsap.matchMedia();
    mm.add({ grande: '(min-width: 760px)', pequeno: '(max-width: 759px)' }, function (ctx) {
      var g = ctx.conditions.grande;
      if (!document.querySelector('.metodo-relatorio')) return; // só na página inicial

      // relatório: a tela inclinada endireita conforme entra na tela
      gsap.fromTo('[data-camada="relatorio"]',
        { rotationX: g ? 18 : 8, scale: g ? 0.94 : 0.97 },
        { rotationX: 0, scale: 1, ease: 'none',
          scrollTrigger: { trigger: '.metodo-relatorio', start: 'top 90%', end: 'top 30%', scrub: 1 } });

      // o título dos serviços entra pela esquerda e o texto pela direita
      gsap.fromTo('#servicos .lista-cab h2', { x: g ? -80 : -24, opacity: 0 }, {
        x: 0, opacity: 1, ease: 'none',
        scrollTrigger: { trigger: '#servicos', start: 'top 85%', end: 'top 35%', scrub: 0.8 }
      });
      gsap.fromTo('#servicos .lista-cab .lead', { x: g ? 80 : 24, opacity: 0 }, {
        x: 0, opacity: 1, ease: 'none',
        scrollTrigger: { trigger: '#servicos', start: 'top 80%', end: 'top 30%', scrub: 0.8 }
      });
      // as linhas da lista entram uma a uma, subindo pouco
      gsap.from('#servicos .lista-servicos > *', {
        y: 18, opacity: 0, duration: 0.5, ease: 'power3.out', stagger: 0.05,
        scrollTrigger: { trigger: '#servicos .lista-servicos', start: 'top 85%', once: true }
      });
    });

    // Método: a estrada se desenha com a rolagem e cada marco acende quando ela chega nele
    var metodo = document.querySelector('.metodo');
    if (metodo) {
      var etapas = [].slice.call(metodo.querySelectorAll('.passo'));
      var mmM = gsap.matchMedia();
      mmM.add('(min-width: 960px)', function () {
        metodo.classList.add('anima');
        var revela = metodo.querySelector('.estrada-revela');
        // o traço da máscara (pathLength=1) é atualizado direto: 1 = estrada escondida, 0 = inteira
        var ponto = { p: 0 };
        var aplica = function () {
          revela.style.strokeDasharray = '1 1';
          revela.style.strokeDashoffset = String(1 - ponto.p);
          etapas.forEach(function (li) { li.classList.toggle('acesa', ponto.p >= +li.dataset.t - 0.03); });
        };
        aplica();
        gsap.to(ponto, {
          p: 1, ease: 'none', onUpdate: aplica,
          scrollTrigger: {
            trigger: metodo.querySelector('.estrada'), start: 'center center', end: '+=170%',
            pin: true, scrub: 0.8
          }
        });
        return function () {
          metodo.classList.remove('anima'); revela.style.strokeDasharray = ''; revela.style.strokeDashoffset = '';
          etapas.forEach(function (li) { li.classList.remove('acesa'); });
        };
      });
      mmM.add('(max-width: 959px)', function () {
        metodo.classList.add('anima');
        var linhas = metodo.querySelectorAll('.alta-borda, .alta-pista');
        gsap.fromTo(linhas, { strokeDasharray: 1, strokeDashoffset: 1 }, {
          strokeDashoffset: 0, ease: 'none',
          scrollTrigger: { trigger: metodo.querySelector('.marcos'), start: 'top 75%', end: 'bottom 65%', scrub: 0.6 }
        });
        etapas.forEach(function (li) {
          ScrollTrigger.create({ trigger: li, start: 'top 72%', toggleClass: { targets: li, className: 'acesa' } });
        });
        return function () { metodo.classList.remove('anima'); };
      });
    }

    // Barra de desejo: fica ao lado do texto e avança uma etapa a cada trecho lido (do branco ao laranja quente)
    var jornada = document.querySelector(".jornada");
    if (jornada) {
      var nomes = [].map.call(jornada.querySelectorAll(".jornada-lista li"), function (li) { return li.lastChild.textContent.trim(); });
      var rotuloN = jornada.querySelector(".jornada-n"), rotuloT = jornada.querySelector(".jornada-t"), pct = jornada.querySelector(".desejo-pct");
      var atual = -1;
      var mostra = function (e) {
        e = Math.max(0, Math.min(nomes.length - 1, e));
        if (e === atual) return; atual = e;
        jornada.setAttribute("data-etapa", e);
        rotuloN.textContent = "Etapa " + (e + 1) + " de " + nomes.length;
        rotuloT.textContent = nomes[e];
        pct.textContent = Math.round((e + 1) / nomes.length * 100) + "%";
      };
      jornada.classList.add("anima");
      mostra(0);
      [].forEach.call(document.querySelectorAll("#problema [data-gatilho]"), function (el) {
        var e = +el.getAttribute("data-gatilho");
        ScrollTrigger.create({
          trigger: el, start: "top 62%",
          onEnter: function () { mostra(e); },
          onLeaveBack: function () { mostra(e - 1); }
        });
      });
    }

    // Quem somos: os números contam ao aparecer
    [].forEach.call(document.querySelectorAll('[data-conta]'), function (el) {
      var alvo = +el.getAttribute('data-conta');
      if (!alvo) return;
      var n = { v: 0 };
      el.textContent = '0';
      gsap.to(n, {
        v: alvo, duration: 1.2, ease: 'power2.out',
        onUpdate: function () { el.textContent = Math.round(n.v); },
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });

    // Fundo de Manaus: a foto anda mais devagar que a página e desce do céu até o Teatro Amazonas
    // (vale para as duas faixas: a do começo e a do final)
    [].forEach.call(document.querySelectorAll('.cidade-faixa'), function (faixa, n) {
      var cidade = faixa.querySelector('.cidade img');
      if (!cidade) return;
      raiz.classList.add('cidade-move');
      gsap.to(cidade, {
        y: function () { return -Math.max(0, cidade.offsetHeight - cidade.parentNode.offsetHeight); },
        ease: 'none',
        scrollTrigger: { trigger: faixa, start: n ? 'top bottom' : 'top top', end: n ? 'bottom top' : 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true }
      });
    });

    // no computador, a cena do celular acompanha o mouse de leve
    if (document.querySelector('[data-cena]') && matchMedia('(hover: hover) and (pointer: fine) and (min-width: 900px)').matches) {
      var giraY = gsap.quickTo('[data-cena]', 'rotationY', { duration: 0.8, ease: 'power3' });
      var giraX = gsap.quickTo('[data-cena]', 'rotationX', { duration: 0.8, ease: 'power3' });
      window.addEventListener('pointermove', function (e) {
        giraY((e.clientX / innerWidth - 0.5) * 10);
        giraX((e.clientY / innerHeight - 0.5) * -6);
      }, { passive: true });
    }
  } else {
    raiz.classList.remove('m-3d');
  }

  /* ─── Método no celular: a estrada vertical passa pelo centro de cada marco (curva em S entre eles) ─── */
  (function () {
    var palco = document.querySelector('.metodo .estrada-palco');
    var svg = palco && palco.querySelector('.estrada-alta');
    if (!svg) return;
    function desenha() {
      if (innerWidth >= 960) return;
      var base = palco.getBoundingClientRect();
      var cx = 32, b = 13;
      var ys = [].map.call(palco.querySelectorAll('.marco-disco'), function (d) {
        var r = d.getBoundingClientRect(); return r.top - base.top + r.height / 2;
      });
      if (!ys.length) return;
      var d = 'M' + cx + ' 0 L' + cx + ' ' + ys[0].toFixed(1);
      for (var i = 1; i < ys.length; i++) {
        var a = ys[i - 1], dy = ys[i] - a, lado = i % 2 ? 1 : -1;
        d += ' C' + (cx + b * lado) + ' ' + (a + dy / 3).toFixed(1) + ' ' + (cx - b * lado) + ' ' + (a + 2 * dy / 3).toFixed(1) + ' ' + cx + ' ' + ys[i].toFixed(1);
      }
      d += ' L' + cx + ' ' + (ys[ys.length - 1] + 48).toFixed(1);
      [].forEach.call(svg.querySelectorAll('path'), function (p) { p.setAttribute('d', d); });
      palco.parentNode.classList.add('desenhada');
    }
    desenha();
    var t; addEventListener('resize', function () { clearTimeout(t); t = setTimeout(desenha, 150); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(desenha);
  })();

  /* ─── Botão do Check-up fixo no celular: aparece depois do topo, some na faixa do Check-up e no fechamento ─── */
  (function () {
    var botao = document.querySelector('.fixo-checkup');
    if (!botao || !('IntersectionObserver' in window)) return;
    var vistos = new Set();
    var io = new IntersectionObserver(function (itens) {
      itens.forEach(function (it) { if (it.isIntersecting) vistos.add(it.target); else vistos.delete(it.target); });
      var mostra = vistos.size === 0;
      botao.classList.toggle('visivel', mostra);
      botao.setAttribute('aria-hidden', mostra ? 'false' : 'true');
      botao.tabIndex = mostra ? 0 : -1;
    });
    ['.topo', '.pagina-topo', '.tarja', '.fechamento', '.rodape'].forEach(function (s) { var el = document.querySelector(s); if (el) io.observe(el); });
  })();

  /* ─── Página /servicos: o link (#trafego, "ver detalhes" da inicial, índice) abre o serviço certo ─── */
  (function () {
    function abre() {
      var id = decodeURIComponent(location.hash.slice(1));
      var el = id && document.getElementById(id);
      if (el && el.tagName === 'DETAILS') { el.open = true; el.scrollIntoView({ block: 'start' }); }
    }
    if (!document.querySelector('details.produto')) return;
    abre();
    addEventListener('hashchange', abre);
    [].forEach.call(document.querySelectorAll('.indice a'), function (a) {
      a.addEventListener('click', function () { if (a.getAttribute('href') === location.hash) setTimeout(abre, 0); });
    });
  })();

  /* ─── Página /servicos: o índice marca o serviço que está na tela ─── */
  (function () {
    var links = [].slice.call(document.querySelectorAll('.indice a'));
    if (!links.length || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (itens) {
      itens.forEach(function (it) {
        if (!it.isIntersecting) return;
        links.forEach(function (a) {
          var ativo = a.getAttribute('href') === '#' + it.target.id;
          a.classList.toggle('atual', ativo);
          if (ativo) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    [].forEach.call(document.querySelectorAll('.produto[id]'), function (p) { io.observe(p); });
  })();

  /* (Eventos do GA4 e do Meta Pixel: ver assets/js/rastreio.js) */

  /* ─── Entrada do topo: tira a classe depois que termina ─── */
  if (!semMovimento) {
    setTimeout(function () { document.documentElement.classList.remove('m-enter'); }, 1600);
  }

})();
