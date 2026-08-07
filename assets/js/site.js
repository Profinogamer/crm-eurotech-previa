/* CRM Eurotech — melhorias progressivas.
   Regra da casa: o hero e todo o conteúdo precisam ficar legíveis sem JavaScript.
   Nada aqui é obrigatório para a página funcionar. */
(function () {
  'use strict';

  /* recarregou? a página volta pro topo — a abertura toca do começo */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  window.addEventListener('load', function () { window.scrollTo(0, 0); });

  /* A classe .js só entra quando este arquivo realmente carregou — se o load
     falhar, nenhum conteúdo fica escondido esperando animação. E o que já está
     na tela (entrada por âncora, rede lenta) nasce revelado, sem piscar. */
  document.querySelectorAll('.revelar').forEach(function (el) {
    var r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('visivel');
  });
  document.documentElement.classList.add('js');

  /* Decisao do dono (2026-08-06): as animacoes rodam SEMPRE — o site nao
     obedece mais o "reduzir movimento" do sistema. */
  var reduzido = false;

  /* topo: fixo, cor constante — nenhuma logica de scroll, por decisao do dono */

  /* ------------------------------------------------------------ revelar blocos */
  var alvos = document.querySelectorAll('.revelar');
  if (!('IntersectionObserver' in window)) {
    alvos.forEach(function (el) { el.classList.add('visivel'); });
  } else {
    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('visivel');
          observador.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    alvos.forEach(function (el) { observador.observe(el); });
  }

  /* ------------------------------------------------- números que sobem uma vez */
  var numeros = document.querySelectorAll('.valor[data-num]');
  if (numeros.length && 'IntersectionObserver' in window) {
    var formata = function (n) { return n.toLocaleString('pt-BR'); };
    var obsNum = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        obsNum.unobserve(e.target);
        var el = e.target;
        var alvo = parseInt(el.dataset.num, 10);
        var texto = el.textContent;
        var prefixo = texto.indexOf('+') === 0 ? '+' : '';
        var inicio = null;
        var passo = function (t) {
          if (inicio === null) inicio = t;
          var p = Math.min(1, (t - inicio) / 1600);
          var suave = 1 - Math.pow(1 - p, 3);
          el.textContent = prefixo + formata(Math.round(alvo * suave));
          if (p < 1) requestAnimationFrame(passo);
          else el.textContent = texto;
        };
        requestAnimationFrame(passo);
      });
    }, { threshold: 0.6 });
    numeros.forEach(function (el) { obsNum.observe(el); });
  }

  /* --------------------------- progresso da página + parallax do hero */
  var progresso = document.querySelector('.progresso i');
  var heroWrap = document.querySelector('.hero .wrap');
  var pedidoRolagem = false;
  var aplicaRolagem = function () {
    pedidoRolagem = false;
    var y = window.scrollY;
    if (progresso) {
      var total = document.documentElement.scrollHeight - window.innerHeight;
      progresso.style.setProperty('--p', total > 0 ? (y / total).toFixed(4) : 0);
    }
    if (!reduzido && !document.documentElement.classList.contains('parado')
        && y < window.innerHeight * 1.2) {
      if (heroWrap) {
        heroWrap.style.transform = 'translate3d(0,' + (y * .28).toFixed(1) + 'px,0)';
        heroWrap.style.opacity = Math.max(0, 1 - y / (window.innerHeight * .85)).toFixed(3);
      }
    }
  };
  window.addEventListener('scroll', function () {
    if (!pedidoRolagem) { pedidoRolagem = true; requestAnimationFrame(aplicaRolagem); }
  }, { passive: true });
  aplicaRolagem();

  /* -------- titulos: cada palavra sobe de tras de uma mascara, em cascata.
     As palavras continuam sendo as de verdade — o texto nao reflui. */
  var fatiaEmPalavras = function (el) {
    var i = 0;
    var trata = function (no) {
      Array.prototype.slice.call(no.childNodes).forEach(function (filho) {
        if (filho.nodeType === 3) {
          var partes = filho.nodeValue.split(' ');
          var frag = document.createDocumentFragment();
          partes.forEach(function (palavra, k) {
            if (palavra !== '') {
              var fora = document.createElement('span');
              fora.className = 'p';
              var dentro = document.createElement('i');
              dentro.textContent = palavra;
              dentro.style.transitionDelay = (i * 55) + 'ms';
              i++;
              fora.appendChild(dentro);
              frag.appendChild(fora);
            }
            if (k < partes.length - 1) frag.appendChild(document.createTextNode(' '));
          });
          no.replaceChild(frag, filho);
        } else if (filho.nodeType === 1 && filho.tagName !== 'BR') {
          trata(filho);
        }
      });
    };
    trata(el);
  };
  var titulos = document.querySelectorAll('.titulo-secao');
  if (titulos.length && 'IntersectionObserver' in window) {
    var obsTitulo = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        obsTitulo.unobserve(e.target);
        e.target.classList.add('mostra');
      });
    }, { threshold: 0.25 });
    titulos.forEach(function (el) {
      fatiaEmPalavras(el);
      el.classList.add('titulo-anim');
      obsTitulo.observe(el);
    });
  }

  /* --------------------------------- holofote ciano segue o mouse no card */
  if (window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.card').forEach(function (card) {
      card.addEventListener('pointermove', function (ev) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (ev.clientX - r.left) + 'px');
        card.style.setProperty('--my', (ev.clientY - r.top) + 'px');
      });
    });
  }

  /* ---- intro: losangos montam a marca, o chao abre, ela cai pro site
     e um circulo explode ao redor da marca d'agua revelando a pagina */
  var intro = document.getElementById('intro');
  if (intro) {
    var lock = intro.querySelector('.intro__lock');
    var nome = intro.querySelector('.intro__nome');
    var temposIntro = [];
    var agenda = function (ms, fn) { temposIntro.push(setTimeout(fn, ms)); };
    var encerraIntro = function () {
      temposIntro.forEach(clearTimeout);
      intro.classList.add('some');
      document.documentElement.classList.remove('com-intro');
    };
    /* a logo comeca no centro da tela: desloca o lockup pela metade da
       largura do nome (que ja ocupa espaco, apenas recortado). Sem
       transicao aqui — o deslize so acontece quando o nome e puxado. */
    var centralizaLogo = function () {
      var gap = parseFloat(getComputedStyle(lock).columnGap) || 0;
      var desloc = (nome.offsetWidth + gap) / 2;
      lock.style.transition = 'none';
      lock.style.transform = 'translateX(' + desloc + 'px)';
      void lock.offsetWidth;
      lock.style.transition = '';
    };
    document.documentElement.classList.add('com-intro');
    intro.addEventListener('click', encerraIntro);
    intro.classList.add('ativa');
    centralizaLogo();
    /* a fonte da marca chega depois: remede pra logo nascer no centro exato */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        if (!intro.classList.contains('assina')) centralizaLogo();
      });
    }

    if (reduzido) {
      /* versao calma: tudo aparece em fade, sem voo nem deslize */
      intro.classList.add('calma');
      agenda(900, function () { intro.classList.add('assina'); });
      agenda(2300, function () { intro.classList.add('sai'); });
      agenda(2900, encerraIntro);
    } else {
      agenda(60, function () { intro.classList.add('monta'); });
      agenda(1150, function () { intro.classList.add('formada'); });
      /* a assinatura sai de dentro da logo, que desliza pra esquerda */
      agenda(1620, function () {
        intro.classList.add('assina');
        lock.style.transform = 'translateX(0)';
      });
      agenda(3000, function () { intro.classList.add('sai'); });
      agenda(3600, encerraIntro);
    }
  }

  /* -------- caixas do hero: acendem nas cores da marca sob o cursor */
  var caixas = document.getElementById('caixas');
  if (caixas) {
    /* exatamente as cores do logo oficial */
    var CORES_CAIXA = ['#8ED8F7', '#73CDF3', '#4AB7EC', '#32A8E7', '#ffffff'];
    var frag = document.createDocumentFragment();
    for (var ci = 0; ci < 32 * 22; ci++) frag.appendChild(document.createElement('i'));
    caixas.appendChild(frag);
    caixas.addEventListener('pointerover', function (ev) {
      var alvo = ev.target;
      if (alvo.tagName !== 'I') return;
      alvo.style.transition = 'none';
      alvo.style.backgroundColor = CORES_CAIXA[(Math.random() * CORES_CAIXA.length) | 0];
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          alvo.style.transition = 'background-color 1.6s ease';
          alvo.style.backgroundColor = 'transparent';
        });
      });
    });
  }

  /* ---- fundo de #seguranca: grade onde poucas celulas ficam liberadas */
  var gradePerm = document.getElementById('fundo-permissao');
  if (gradePerm) {
    var montaGrade = function () {
      var largura = gradePerm.offsetWidth || window.innerWidth;
      var altura = gradePerm.offsetHeight || 400;
      var total = Math.ceil(largura / 84) * Math.ceil(altura / 84);
      if (gradePerm.childElementCount === total) return;
      gradePerm.textContent = '';
      var frag = document.createDocumentFragment();
      for (var c = 0; c < total; c++) {
        var cel = document.createElement('i');
        if (Math.random() < 0.09) {
          cel.className = 'livre';
          cel.style.setProperty('--pd', (Math.random() * 4).toFixed(2) + 's');
        }
        frag.appendChild(cel);
      }
      gradePerm.appendChild(frag);
    };
    montaGrade();
    window.addEventListener('resize', montaGrade);
  }

  /* ---- linha de tendencia da faixa de numeros: desenha ao entrar na tela */
  var faixaProvas = document.querySelector('.faixa-provas');
  if (faixaProvas && 'IntersectionObserver' in window) {
    var obsProvas = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        obsProvas.unobserve(e.target);
        e.target.classList.add('rodando');
      });
    }, { threshold: 0.2 });
    obsProvas.observe(faixaProvas);
  } else if (faixaProvas) {
    faixaProvas.classList.add('rodando');
  }

  /* o fundo da demonstracao e so CSS: quem pausa fora da tela e a classe
     .rodando que o observador dos trilhos ja poe no #demo. */

  /* ------------- fluxograma: paginas das etapas trocam sozinhas (6s) */
  var fluxograma = document.getElementById('fluxograma');
  if (fluxograma) {
    var nosEtapa = fluxograma.querySelectorAll('.fluxograma__no');
    var paginas = fluxograma.querySelectorAll('.palco__pagina');
    var trilhoEtapas = fluxograma.querySelector('.fluxograma__trilho');
    var linhaFeita = fluxograma.querySelector('.fluxograma__linha');
    var luz = fluxograma.querySelector('.fluxograma__luz');
    var paginaAtual = 0;
    var timerPaginas = null;
    var timerViagem = null;
    var VIAGEM = 1150;

    /* leva a luz ate o centro da etapa e acende o caminho percorrido */
    var levaLuz = function (i, instantaneo) {
      if (!luz || !nosEtapa[i]) return;
      var no = nosEtapa[i];
      var x = no.offsetLeft + no.offsetWidth / 2;
      if (instantaneo) luz.style.transition = 'none';
      luz.style.transform = 'translateX(' + x + 'px)';
      /* so aparece durante a viagem: posicionamento seco fica invisivel */
      luz.classList.toggle('acesa', !instantaneo);
      if (linhaFeita) {
        var faixa = linhaFeita.offsetWidth || 1;
        var feito = Math.max(0, Math.min(1, (x - linhaFeita.offsetLeft) / faixa));
        if (instantaneo) linhaFeita.firstElementChild.style.transition = 'none';
        linhaFeita.style.setProperty('--feito', feito.toFixed(3));
      }
      if (instantaneo) {
        void luz.offsetWidth;
        luz.style.transition = '';
        if (linhaFeita) linhaFeita.firstElementChild.style.transition = '';
      }
    };

    /* o palco encolhe e cresce junto com a pagina ativa. Sem isso ele fica
       preso na altura da pagina mais alta e sobra vazio nas outras. */
    var palco = fluxograma.querySelector('.palco');
    var ajustaPalco = function () {
      if (!palco || !paginas[paginaAtual]) return;
      palco.style.height = paginas[paginaAtual].offsetHeight + 'px';
    };

    var ativaPagina = function (i) {
      paginaAtual = i;
      nosEtapa.forEach(function (n, j) {
        n.classList.toggle('ativa', j === i);
        n.classList.remove('chegada');
      });
      paginas.forEach(function (p, j) { p.classList.toggle('ativa', j === i); });
      ajustaPalco();
      /* o brilho de chegada */
      void nosEtapa[i].offsetWidth;
      nosEtapa[i].classList.add('chegada');
    };

    /* a luz parte agora e a etapa so acende quando ela chega — nesse
       instante a luz e absorvida pela pilula e some */
    var viajaPara = function (i) {
      if (timerViagem) clearTimeout(timerViagem);
      levaLuz(i);
      timerViagem = setTimeout(function () {
        luz.classList.remove('acesa');
        ativaPagina(i);
      }, VIAGEM);
    };

    var reiniciaTimer = function () {
      if (timerPaginas) clearInterval(timerPaginas);
      timerPaginas = null;
      timerPaginas = setInterval(function () {
        viajaPara((paginaAtual + 1) % paginas.length);
      }, 6000);
    };
    nosEtapa.forEach(function (n, i) {
      n.addEventListener('click', function () {
        if (timerViagem) clearTimeout(timerViagem);
        levaLuz(i, true);
        ativaPagina(i);
        reiniciaTimer();
      });
    });
    levaLuz(0, true);
    ajustaPalco();
    /* a altura muda com a largura: recalcula depois que o texto reflui */
    window.addEventListener('resize', function () {
      levaLuz(paginaAtual, true);
      ajustaPalco();
    });
    /* e de novo quando a fonte chega, senao mede com a fonte de sistema */
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(ajustaPalco); }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
          if (e.isIntersecting) reiniciaTimer();
          else if (timerPaginas) { clearInterval(timerPaginas); timerPaginas = null; }
        });
      }, { threshold: .25 }).observe(fluxograma);
    } else {
      reiniciaTimer();
    }
    /* pausar animações também tem que parar a troca de etapa: só travar o CSS
       faria as páginas pularem de uma pra outra sem transição */
    document.addEventListener('movimento', function (ev) {
      if (ev.detail.parado) {
        if (timerPaginas) { clearInterval(timerPaginas); timerPaginas = null; }
        if (timerViagem) { clearTimeout(timerViagem); timerViagem = null; }
      } else {
        reiniciaTimer();
      }
    });
  }

  /* ------------------------------------ marquees só rodam quando estão na tela */
  var trilhos = document.querySelectorAll('.banda, .hero, #crm, #ia, #troca, #segmentos, #demo, #como, #etapas, #conta, #diferenca');
  if (trilhos.length && 'IntersectionObserver' in window) {
    var obsTrilho = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        e.target.classList.toggle('rodando', e.isIntersecting);
      });
    });
    trilhos.forEach(function (el) { obsTrilho.observe(el); });
  } else {
    trilhos.forEach(function (el) { el.classList.add('rodando'); });
  }

  /* ---------------------------------------------- formulário abre no WhatsApp */
  var form = document.getElementById('form-contato');
  if (form) {
    var botaoEnviar = document.getElementById('form-enviar');
    if (botaoEnviar) botaoEnviar.textContent = 'Chamar no WhatsApp';

    var feito = document.getElementById('form-feito');
    var feitoTitulo = document.getElementById('form-feito-titulo');
    var feitoTexto = document.getElementById('form-feito-texto');
    var feitoAbrir = document.getElementById('form-feito-abrir');
    var feitoVoltar = document.getElementById('form-feito-voltar');
    var tituloPadrao = feitoTitulo ? feitoTitulo.textContent : '';
    var textoPadrao = feitoTexto ? feitoTexto.textContent : '';
    var campoTel = form.elements['telefone'];

    /* com JS as mensagens de erro sao nossas, em portugues e do lado do campo.
       Sem JS o navegador continua cuidando disso pelo required. */
    form.setAttribute('novalidate', '');

    /* ---- mascara: (62) 3612-0166 ou (62) 9 9179-3667 */
    var mascaraTel = function (bruto) {
      var d = bruto.replace(/\D/g, '').slice(0, 11);
      if (!d) { return ''; }
      if (d.length <= 2) { return '(' + d; }
      var r = '(' + d.slice(0, 2) + ') ';
      if (d.length <= 6) { return r + d.slice(2); }
      if (d.length <= 10) { return r + d.slice(2, 6) + '-' + d.slice(6); }
      return r + d.slice(2, 3) + ' ' + d.slice(3, 7) + '-' + d.slice(7);
    };
    if (campoTel) {
      campoTel.addEventListener('input', function () {
        var noFim = this.selectionStart === this.value.length;
        this.value = mascaraTel(this.value);
        if (noFim) { this.setSelectionRange(this.value.length, this.value.length); }
      });
    }

    /* ---- erro em linha, embaixo do campo */
    var poeErro = function (campo, msg) {
      var caixa = campo.parentNode;
      var p = caixa.querySelector('.campo__erro');
      if (!p) {
        p = document.createElement('p');
        p.className = 'campo__erro';
        p.id = campo.id + '-erro';
        caixa.appendChild(p);
      }
      p.textContent = msg;
      campo.setAttribute('aria-invalid', 'true');
      campo.setAttribute('aria-describedby', p.id);
      caixa.classList.add('campo--erro');
    };
    var tiraErro = function (campo) {
      var caixa = campo.parentNode;
      var p = caixa.querySelector('.campo__erro');
      if (p) { p.textContent = ''; }
      campo.removeAttribute('aria-invalid');
      campo.removeAttribute('aria-describedby');
      caixa.classList.remove('campo--erro');
    };
    var confere = function () {
      var falhas = [];
      var nome = form.elements['nome'];
      var msg = form.elements['mensagem'];
      if (nome.value.trim().length < 2) {
        poeErro(nome, 'Escreva seu nome, pra gente saber com quem fala.');
        falhas.push(nome);
      } else { tiraErro(nome); }
      if (!msg.value.trim()) {
        poeErro(msg, 'Conte numa linha o que hoje toma tempo da equipe.');
        falhas.push(msg);
      } else { tiraErro(msg); }
      if (campoTel && campoTel.value.trim()) {
        if (campoTel.value.replace(/\D/g, '').length < 10) {
          poeErro(campoTel, 'Faltam números: use DDD mais o número.');
          falhas.push(campoTel);
        } else { tiraErro(campoTel); }
      } else if (campoTel) { tiraErro(campoTel); }
      return falhas;
    };
    /* o aviso some assim que a pessoa comeca a corrigir */
    ['nome', 'mensagem', 'telefone'].forEach(function (n) {
      var c = form.elements[n];
      if (c) {
        c.addEventListener('input', function () {
          if (c.parentNode.classList.contains('campo--erro')) { tiraErro(c); }
        });
      }
    });

    if (feitoVoltar) {
      feitoVoltar.addEventListener('click', function () {
        feito.hidden = true;
        feito.classList.remove('form-feito--mostrando');
        form.hidden = false;
        feitoTitulo.textContent = tituloPadrao;
        feitoTexto.textContent = textoPadrao;
        form.elements['nome'].focus();
      });
    }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var falhas = confere();
      if (falhas.length) { falhas[0].focus(); return; }
      var v = function (nome) {
        var campo = form.elements[nome];
        return campo && campo.value ? campo.value.trim() : '';
      };
      var linhas = [
        'Olá, Eurotech. Quero ver o CRM rodando com o meu caso.',
        '',
        'Nome: ' + v('nome'),
        v('empresa') ? 'Empresa: ' + v('empresa') : '',
        v('telefone') ? 'WhatsApp: ' + v('telefone') : '',
        v('setor') ? 'Segmento: ' + v('setor') : '',
        '',
        v('mensagem')
      ].filter(function (l) { return l !== ''; });

      var url = 'https://wa.me/5562991793667?text=' + encodeURIComponent(linhas.join('\n'));
      var aba = window.open(url, '_blank', 'noopener');

      /* sem o painel de confirmacao nao ha pra onde ir: segue o comportamento antigo */
      if (!feito) {
        if (!aba) { window.location.href = url; }
        return;
      }
      feitoAbrir.href = url;
      if (!aba) {
        /* bloqueador de pop-up: em vez de sumir com a pagina, explica e da o botao */
        feitoTitulo.textContent = 'O navegador bloqueou a janela do WhatsApp';
        feitoTexto.textContent = 'Sua mensagem já está montada. Toque no botão abaixo para abrir a '
          + 'conversa, ou fale pelos contatos aqui embaixo.';
      }
      form.hidden = true;
      feito.hidden = false;
      void feito.offsetWidth;
      feito.classList.add('form-feito--mostrando');
      feito.focus();
    });
  }



  /* --------------------------------------------------------- a sua conta
     Todo numero vem da pessoa; aqui so se multiplica, e a formula fica a
     vista. Nenhuma promessa de economia sai daqui. */
  var contaPessoas = document.getElementById('c-pessoas');
  if (contaPessoas) {
    var SEMANAS = 4.33;
    var controles = {
      pessoas: contaPessoas,
      horas: document.getElementById('c-horas'),
      obras: document.getElementById('c-obras')
    };
    var saidas = {
      pessoas: document.getElementById('v-pessoas'),
      horas: document.getElementById('v-horas'),
      obras: document.getElementById('v-obras'),
      total: document.getElementById('v-total'),
      dias: document.getElementById('v-dias'),
      obra: document.getElementById('v-obra'),
      formula: document.getElementById('v-formula')
    };
    var ptBR = function (n) { return n.toLocaleString('pt-BR'); };
    var ultimoTotal = null;
    var recalcula = function () {
      var pessoas = +controles.pessoas.value;
      var horas = +controles.horas.value;
      var obras = +controles.obras.value;
      var total = Math.round(pessoas * horas * SEMANAS);

      saidas.pessoas.textContent = pessoas;
      saidas.horas.textContent = horas;
      saidas.obras.textContent = obras;
      saidas.total.textContent = ptBR(total);
      saidas.dias.textContent = ptBR(Math.round(total / 8));
      saidas.obra.textContent = ptBR(Math.round(total / obras));
      saidas.formula.textContent = pessoas + (pessoas === 1 ? ' pessoa' : ' pessoas')
        + ' × ' + horas + ' h por semana × 4,33 semanas no mês';

      if (ultimoTotal !== null && total !== ultimoTotal) {
        saidas.total.classList.remove('mudou');
        void saidas.total.offsetWidth;
        saidas.total.classList.add('mudou');
      }
      ultimoTotal = total;
    };
    Object.keys(controles).forEach(function (k) {
      controles[k].addEventListener('input', recalcula);
    });
    recalcula();
  }

  /* ------------------------------------------------------- CRM tocável
     A página inteira descreve o produto; aqui a pessoa usa. Três caminhos pro
     mesmo gesto — arrastar, tocar e teclado — porque um só deixa gente de fora. */
  var quadro = document.getElementById('quadro');
  if (quadro) {
    var colunas = Array.prototype.slice.call(quadro.querySelectorAll('.quadro__col'));
    var pilhas = colunas.map(function (c) { return c.querySelector('.quadro__pilha'); });
    var contas = colunas.map(function (c) { return c.querySelector('.quadro__conta'); });
    var efeito = document.querySelector('.efeito');
    var passos = Array.prototype.slice.call(document.querySelectorAll('.efeito__lista li'));
    var aviso = document.getElementById('toque-aviso');
    var reset = document.getElementById('toque-reset');
    var obras = Array.prototype.slice.call(quadro.querySelectorAll('.obra'));
    var NOMES = ['Lead', 'Proposta', 'Contrato'];
    var LIMIAR = 44;
    var inicial = obras.map(function (o) {
      return { el: o, col: +o.parentNode.parentNode.dataset.col };
    });
    var timers = [];
    var mexeu = false;

    var nomeDa = function (o) { return o.querySelector('b').textContent.trim(); };
    var descreve = function (o, col) {
      o.setAttribute('aria-label', nomeDa(o) + ', coluna ' + NOMES[col]
        + '. Setas para mover de coluna.');
    };
    var recontar = function () {
      pilhas.forEach(function (p, i) {
        contas[i].textContent = p.querySelectorAll('.obra').length;
      });
    };
    /* a corrente acende um módulo por vez: é o "num lugar só" acontecendo */
    var acendeCorrente = function () {
      timers.forEach(clearTimeout);
      timers = [];
      if (efeito) efeito.classList.add('acionada');
      passos.forEach(function (p) { p.classList.remove('acesa'); });
      passos.forEach(function (p, i) {
        timers.push(setTimeout(function () { p.classList.add('acesa'); }, 240 + i * 420));
      });
    };
    var assenta = function (o, col, anuncia) {
      pilhas[col].appendChild(o);
      o.dataset.col = col;
      o.querySelector('.obra__estado').textContent = o.dataset['e' + col];
      o.classList.toggle('fechada', col === 2);
      descreve(o, col);
      recontar();
      if (anuncia && aviso) aviso.textContent = nomeDa(o) + ' movida para ' + NOMES[col] + '.';
      if (anuncia && col === 2) acendeCorrente();
    };
    /* FLIP: mede antes e depois e devolve o cartão pro ponto de partida, pra
       transição levá-lo até o lugar novo em vez de ele pular de coluna */
    var move = function (o, dir) {
      var col = +o.dataset.col;
      var novo = Math.min(2, Math.max(0, col + dir));
      if (novo === col) return;
      if (!mexeu) { mexeu = true; obras.forEach(function (x) { x.classList.remove('dica'); }); }
      var antes = o.getBoundingClientRect();
      assenta(o, novo, true);
      var depois = o.getBoundingClientRect();
      var dx = antes.left - depois.left;
      var dy = antes.top - depois.top;
      if (dx || dy) {
        o.style.transition = 'none';
        o.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
        void o.offsetWidth;
        o.style.transition = '';
        o.style.transform = '';
      }
    };

    obras.forEach(function (o) {
      var x0 = 0, dx = 0, puxando = false;
      o.addEventListener('pointerdown', function (ev) {
        if (typeof ev.button === 'number' && ev.button !== 0) return;
        x0 = ev.clientX; dx = 0; puxando = true;
        try { o.setPointerCapture(ev.pointerId); } catch (e) {}
        o.classList.add('arrastando');
      });
      o.addEventListener('pointermove', function (ev) {
        if (!puxando) return;
        dx = ev.clientX - x0;
        o.style.transform = 'translateX(' + dx + 'px)';
        var col = +o.dataset.col;
        var alvo = dx > LIMIAR ? Math.min(2, col + 1)
                 : dx < -LIMIAR ? Math.max(0, col - 1) : col;
        colunas.forEach(function (c, k) { c.classList.toggle('mirando', k === alvo && alvo !== col); });
      });
      var solta = function () {
        if (!puxando) return;
        puxando = false;
        o.classList.remove('arrastando');
        o.style.transform = '';
        colunas.forEach(function (c) { c.classList.remove('mirando'); });
        if (Math.abs(dx) > LIMIAR) move(o, dx > 0 ? 1 : -1);
        else if (Math.abs(dx) < 6) move(o, 1); /* toque simples também avança */
        dx = 0;
      };
      o.addEventListener('pointerup', solta);
      o.addEventListener('pointercancel', solta);
      o.addEventListener('click', function (ev) { ev.preventDefault(); });
      o.addEventListener('keydown', function (ev) {
        if (ev.key === 'ArrowRight' || ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault(); move(o, 1);
        } else if (ev.key === 'ArrowLeft') {
          ev.preventDefault(); move(o, -1);
        }
      });
    });

    if (reset) {
      reset.addEventListener('click', function () {
        timers.forEach(clearTimeout);
        timers = [];
        passos.forEach(function (p) { p.classList.remove('acesa'); });
        if (efeito) efeito.classList.remove('acionada');
        inicial.forEach(function (r) { assenta(r.el, r.col, false); });
        if (aviso) aviso.textContent = 'Quadro recomeçado.';
      });
    }

    inicial.forEach(function (r) { r.el.dataset.col = r.col; descreve(r.el, r.col); });
    recontar();
    /* ninguém adivinha que é interativo: a primeira obra chama, e para na hora
       em que alguém mexe */
    if ('IntersectionObserver' in window && obras.length) {
      var obsDica = new IntersectionObserver(function (e) {
        if (!e[0].isIntersecting || mexeu) return;
        obras[0].classList.add('dica');
        obsDica.disconnect();
      }, { threshold: .4 });
      obsDica.observe(quadro);
    }
  }

  /* ---- barra de ação no celular: entra quando o hero sai e sai de cena na
     demonstração e no rodapé, onde o próprio formulário já é o caminho */
  var barra = document.getElementById('barra-acao');
  var zapFlutuante = document.querySelector('.zap');
  if (barra && 'IntersectionObserver' in window) {
    var passouHero = false;
    var noFim = 0;
    var atualizaBarra = function () {
      var mostra = passouHero && noFim === 0;
      barra.classList.toggle('aparece', mostra);
      /* com a barra na tela o botão flutuante vira repetição */
      if (zapFlutuante) zapFlutuante.classList.toggle('recolhido', mostra);
    };
    var hero = document.getElementById('inicio');
    if (hero) {
      new IntersectionObserver(function (e) {
        passouHero = !e[0].isIntersecting;
        atualizaBarra();
      }, { threshold: 0 }).observe(hero);
    }
    var obsFim = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) { noFim += e.isIntersecting ? 1 : -1; });
      if (noFim < 0) noFim = 0;
      atualizaBarra();
    }, { threshold: 0 });
    ['#demo', '.rodape'].forEach(function (sel) {
      var el = document.querySelector(sel);
      if (el) obsFim.observe(el);
    });
  }

  /* ---- no papel o FAQ tem que sair aberto. Só CSS não resolve: o conteúdo do
     <details> é escondido pelo próprio elemento, não por display nos filhos. */
  window.addEventListener('beforeprint', function () {
    document.querySelectorAll('details:not([open])').forEach(function (d) {
      d.dataset.fechado = '1';
      d.open = true;
    });
  });
  window.addEventListener('afterprint', function () {
    document.querySelectorAll('details[data-fechado]').forEach(function (d) {
      d.open = false;
      delete d.dataset.fechado;
    });
  });

  /* ---- saída pra quem passa mal com movimento. A página continua nascendo
     animada (decisão do dono); isto só oferece o botão de parar, e lembra. */
  var botaoMov = document.getElementById('pausar-movimento');
  if (botaoMov) {
    var svgs = document.querySelectorAll('svg');
    var avisa = function (parado) {
      document.dispatchEvent(new CustomEvent('movimento', { detail: { parado: parado } }));
    };
    var aplicaMovimento = function (parado) {
      document.documentElement.classList.toggle('parado', parado);
      botaoMov.setAttribute('aria-pressed', parado ? 'true' : 'false');
      botaoMov.textContent = parado ? 'Retomar animações' : 'Pausar animações';
      /* SMIL não obedece CSS: o relógio de cada SVG para na mão */
      svgs.forEach(function (svg) {
        if (!svg.pauseAnimations) return;
        if (parado) svg.pauseAnimations(); else svg.unpauseAnimations();
      });
      /* o parallax é movimento também: devolve o hero ao lugar */
      if (parado && heroWrap) { heroWrap.style.transform = ''; heroWrap.style.opacity = ''; }
      try { localStorage.setItem('eurotech-movimento', parado ? 'parado' : 'ativo'); } catch (e) {}
      avisa(parado);
    };
    var guardado = null;
    try { guardado = localStorage.getItem('eurotech-movimento'); } catch (e) {}
    if (guardado === 'parado') aplicaMovimento(true);
    botaoMov.addEventListener('click', function () {
      aplicaMovimento(!document.documentElement.classList.contains('parado'));
    });
  }
})();
