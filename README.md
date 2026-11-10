# Player

Player de música em JavaScript: um componente que se monta sozinho dentro de um elemento da página.

```html
<div id="player1"></div>

<script type="module">
  import { Player } from './index.js';

  const player1 = new Player(document.querySelector('#player1'), 'musicas/Fetty_Wap_-_My_Way.mp3');
</script>
```

Nenhum HTML para copiar, nenhum CSS para incluir, nenhuma dependência, nenhuma etapa de build. Um clique no botão toca e pausa, um duplo clique para e volta ao início, um clique na faixa leva a música até aquele ponto.

**[Relatório interativo](https://jonathansantos.github.io/Player-v2/)** · **[Demonstração](https://jonathansantos.github.io/Player-v2/demo/)**

## De onde vem este projeto

Este repositório é a versão refeita de um projeto meu de 2016: **[JonathanSantos-zz/Player](https://github.com/JonathanSantos-zz/Player)**, publicado em 14 de setembro de 2016 na minha conta antiga do GitHub. Eram 152 linhas de JavaScript dentro de um `index.html`, e o README terminava com uma tarefa:

> To Do: Converter o código para EcmaScript6

Dez anos depois, a tarefa está cumprida. É o segundo projeto antigo que revisito com a mesma dinâmica (o primeiro foi o [curl-in-js](https://github.com/JonathanSantos/curl-in-js-v2)): em vez de reescrever do zero, pedi a uma IA (o Claude, pelo Claude Code) para ler o código **como apreciadora** antes de mexer em qualquer coisa.

1. **Datar.** O que cada linha conta sobre a época em que foi escrita.
2. **Admirar.** O que o código já fazia bem e quais técnicas usava.
3. **Medir.** Abrir o original num navegador de hoje e anotar o que acontece, com evidência em vez de opinião.
4. **Refazer sem trocar a essência.** A mesma ideia, a mesma assinatura, o mesmo desenho, com o que 2026 oferece.

| Onde | O quê |
|---|---|
| [`original/`](original/) | O código de 2016, intacto. Os cinco commits originais estão preservados no histórico do Git. |
| [`src/`](src/), [`index.js`](index.js), [`test/`](test/) | A versão 2.0.0. |
| [`demo/`](demo/) | A página de exemplo de 2016, com os mesmos quatro players, tocando uma melodia sintetizada em JavaScript. |
| [`index.html`](index.html) | O relatório interativo, publicado em **[jonathansantos.github.io/Player-v2](https://jonathansantos.github.io/Player-v2/)**: linha do tempo, o que admiro no original e os dois players rodando lado a lado. O resumo dele está [no fim deste README](#relatório). |

Todo código no relatório é exibido com o **[Jonacode](https://github.com/JonathanSantos/jonacode)**, o editor de código que escrevi dez anos depois do Player.

## Uso

Copie a pasta `src/` e o `index.js` para o seu projeto, ou instale direto do GitHub (o pacote não está no npm):

```bash
npm install github:JonathanSantos/Player-v2
```

```js
import { Player } from 'player';

const player = new Player(document.querySelector('#player1'), 'musicas/My_Way.mp3', {
  title: 'My Way',                 // sem isso, o nome sai do endereço do arquivo
  preload: 'none',                 // 'metadata' (padrão), 'auto' ou 'none'
  colors: { accent: '#0a7a5c' },   // background, accent e text
});

player.addEventListener('statechange', (event) => {
  console.log(event.detail);       // { status: 'playing', currentTime: 2.4, duration: 24 }
});

player.play();
player.pause();
player.toggle();
player.stop();        // para e volta ao início
player.seek(50);      // leva ao meio da música
player.destroy();     // remove da página e solta o áudio
```

### Opções

| Opção | Padrão | O que faz |
|---|---|---|
| `title` | tirado do endereço | Nome exibido. `Fetty_Wap_-_My_Way.mp3` vira "Fetty Wap - My Way". |
| `preload` | `'metadata'` | Com `'none'`, nada é baixado antes do primeiro toque. |
| `colors` | cinza `#646464`, roxo `#682268`, texto branco | `{ background, accent, text }`, aplicados só àquele player. |
| `labels` | em português | Textos lidos por leitores de tela e mostrados em erros: `play`, `pause`, `position`, `untitled`, `error`. |
| `createAudio` | `new Audio(endereço)` | Fábrica do elemento de áudio, para testes ou para entregar um áudio já configurado. |

### Propriedades e métodos

`father`, `music` e `audio` existem desde 2016. A versão nova acrescenta `title`, `state`, `element`, os métodos `play()`, `pause()`, `toggle()`, `stop()`, `seek(percent)` e `destroy()`, e o evento `statechange`.

As cores também podem ser trocadas por CSS, para todos os players de uma vez:

```css
.player { --player-accent: #0a7a5c; --player-background: #2b2b2b; }
```

### Teclado

O botão recebe foco e responde a Enter e Espaço. A faixa é um `slider`: setas andam cinco segundos, Home e End vão às pontas.

## O código original e o código novo

<details>
<summary><b>2016</b> · o componente inteiro, como está em <code>original/index.html</code> (152 linhas)</summary>

```js
var Player = function (father, music) {
	this.father = father;
	this.music = music;
	this.audio;

	this.components = [

		{
			element : document.createElement('div'),
			style : {
				width : '100%',
				height : '80px',
				'background-color' : '#646464'
			}
		},

		{
			element : document.createElement('div'),
			style : {
				width : '20%',
				height : '80px',
				display : 'inline-block',
				'background-color' : '#682268'
			}
		},

		{
			element : document.createElement('div'),
			style : {
				width : '80%',
				height : '80px',
				display : 'inline-block'
			}
		},

		{
			element : document.createElement('div'),
			style : {
				width : '0%',
				height : '20px',
				opacity : '0.5',
				'background-color' : '#682268'
			}
		}
	];

	this._init();
};

Player.fn = Player.prototype = {

	_init : function () {
		if (this.father instanceof Element) {
			this.father.appendChild(this._component());
		}
	},

	_component : function () {
		for (var i = 0; i < this.components.length; i++) {
			this._applyStyle(this.components[i]);
		}

		var box = this.components[0].element;
		var playPause = this.components[1].element;
		var nomeMusica = this.components[2].element;
		var progressBar = this.components[3].element;

		box.appendChild(playPause);
		box.appendChild(nomeMusica);
		nomeMusica.appendChild(progressBar);

		this._applyActionMusic(playPause);
		this._applyActionAudio(this._getInstanceAudio(), progressBar);
		this._applyProgressBarAction(nomeMusica);

		return box;
	},

	_applyStyle : function (obj) {
		var element = obj.element;
		var options = obj.style;

		if (options) {
			for (x in options) {
				element.style[x] = options[x];
			}
		}
	},

	_applyActionMusic : function (component) {
		var me = this;

		component.addEventListener('click', function(){
			var audio = me._getInstanceAudio();

			if (audio.paused) {
				audio.play();
			}else{
				audio.pause();
			}

		});

		component.addEventListener('dblclick', function(){
			var audio = me._getInstanceAudio();
			audio.pause();
			audio.currentTime = 0;
		});

	},

	_getInstanceAudio : function () {
		if (!this.audio) {
			this.audio = new Audio(this.music);
		}

		return this.audio;
	},

	_applyActionAudio : function (audio, div) {
		audio.addEventListener('timeupdate', function(){
			var currentTime = audio.currentTime;
			var duration = audio.duration;
			var porcentagem = (currentTime * 100) / duration;
			div.style.width = porcentagem + '%';
		});

		audio.addEventListener('ended', function(){
			audio.currentTime = 0;
		});

	},

	_applyProgressBarAction : function (div) {
		var me = this;
		div.addEventListener('click', function (e) {
			var rolamentoX = document.body.scrollLeft;
			var boxElemento = this.getBoundingClientRect();
			var posX = e.clientX - boxElemento.left + rolamentoX;
			var width = this.clientWidth;
			var porcentagem = (posX * 100) / width;
			me._changeAudioByPercent(porcentagem);
		});
	},

	_changeAudioByPercent : function (percent) {
		var audio = this._getInstanceAudio();
		var duration = audio.duration;
		audio.currentTime = (duration * percent) / 100;
	}

};
```

</details>

<details open>
<summary><b>2026</b> · a versão nova, arquivo por arquivo</summary>

| Arquivo | Linhas | Papel |
|---|---:|---|
| [`src/player.js`](src/player.js) | 220 | A classe `Player`: a única parte que fala com o DOM e com o áudio |
| [`src/core.js`](src/core.js) | 75 | As contas (percentual, tempo, teclado, nome tirado do endereço), como funções puras |
| [`src/state.js`](src/state.js) | 39 | O estado e a tabela de transições para cada evento do áudio |
| [`src/view.js`](src/view.js) | 114 | O componente descrito como dado, `describe(estado)` e `render` |
| [`src/styles.js`](src/styles.js) | 101 | A folha de estilo, com as medidas e as cores de 2016 |
| [`index.js`](index.js) | 3 | O ponto de entrada |

O coração da versão nova (trechos de `src/player.js`), para comparar com o de 2016:

```js
export class Player extends EventTarget {
  #audio = null;
  #state = INITIAL_STATE;
  #listeners = new AbortController();

  get audio() {
    if (this.#audio) return this.#audio;

    const audio = this.#createAudio(this.#music);
    audio.preload = this.#preload;
    this.#audio = audio;
    this.#listenToAudio(audio);
    return audio;
  }

  toggle() {
    return this.audio.paused ? this.play() : this.pause();
  }

  seek(percent) {
    const time = timeFromPercent(percent, this.audio.duration);

    if (time === null) {
      this.#pendingPercent = percent;
      return;
    }

    this.audio.currentTime = time;
    this.#dispatch({ type: 'timeupdate', currentTime: time });
  }

  #dispatch(event) {
    const next = reduce(this.#state, event);
    if (next === this.#state) return;

    this.#state = next;
    this.#render();
    this.dispatchEvent(new CustomEvent('statechange', { detail: next }));
  }
}
```

</details>

## Desenvolvimento

```bash
npm install
```

```bash
npm test
```

```bash
npm run report
```

`npm test` roda 29 testes com `node:test`: as contas, a máquina de estados e o fluxo principal num DOM simulado (happy-dom, única dependência de desenvolvimento), com um áudio de mentira. `npm run report` regenera o `index.html` a partir de [`report/template.html`](report/template.html), embutindo os arquivos reais do repositório.

Para ver a demonstração localmente, sirva a pasta por HTTP (módulos ES não carregam de `file://`):

```bash
python3 -m http.server 8000
```

---

# Relatório

> A versão completa e interativa está em **[jonathansantos.github.io/Player-v2](https://jonathansantos.github.io/Player-v2/)** (o [`index.html`](index.html) deste repositório), com os trechos no Jonacode e os dois players, o de 2016 e o de 2026, tocando lado a lado.

## Player, dez anos depois

| | |
|---|---|
| Nascimento | 14 de setembro de 2016, 17:58 (horário de Brasília), uma quarta-feira |
| Idade em 10 nov 2026 | 10 anos, 1 mês e 27 dias |
| Commits | 5: um da criação do repositório e quatro feitos pelo site do GitHub |
| Do primeiro ao último | 11 minutos e 58 segundos |
| Tamanho | 152 linhas de JavaScript em um `index.html`, nenhuma dependência |

### Linha do tempo

| Quando | Commit |
|---|---|
| 14 set 2016, 17:58:35 | Initial commit: o repositório nasce só com a licença MIT |
| +1 min | "Pagina index": o `index.html` inteiro, de uma vez |
| +3 min | Create README.md, com o *To Do: Converter o código para EcmaScript6* |
| +8 min | Update index.html: quatro `var player` com o mesmo nome viram `player1` a `player4` |
| +12 min | Update index.html: `var self = this` vira `var me = this` |
| *3.709 dias sem commits* | |
| 10 nov 2026 | Releitura, medição e a versão 2.0.0, em ES2022 |

Os dois últimos commits são de alguém relendo o próprio código logo depois de publicar: um corrige quatro variáveis que se sobrescreviam, o outro troca `self`, que já é um nome global do navegador, por `me`.

### O que o código conta sobre setembro de 2016

| Vestígio | O que ele registra |
|---|---|
| *To Do: Converter o código para EcmaScript6* | O ES2015 tinha pouco mais de um ano. Quem precisava do Internet Explorer 11 ainda escrevia ES5 ou montava um Babel. |
| `Player.fn = Player.prototype = {` | A assinatura do jQuery (`jQuery.fn = jQuery.prototype`), de quem aprendeu JavaScript lendo plugins. |
| `var me = this` | Antes das *arrow functions*, a saída era guardar o `this` de fora numa variável. `me` era o nome preferido de quem vinha do ExtJS. |
| `type="text/javascript"` | Atributo que o HTML5 já tinha tornado opcional, mantido pelo hábito do HTML4. |
| `new Audio(…)` e `html5.justhearit.com` | Tocar música sem Flash ainda era novidade suficiente para um site colocar "html5" no endereço. |
| `Fetty_Wap_-_My_Way.mp3` | A trilha sonora: um sucesso de 2015. O endereço não responde mais. |
| `document.body.scrollLeft` | No Chrome da época, a rolagem da página era lida em `body`. Desde 2017 essa expressão vale sempre zero. |
| Tabulações e `CRLF` | O arquivo foi escrito no Windows. |
| `nomeMusica`, `porcentagem`, `rolamentoX` | Português e inglês no mesmo arquivo: o problema pensado na própria língua, a API na dela. |

### O que admiro no original

**1. O componente descrito como dado.** O construtor declara uma lista em que cada item tem um elemento e o estilo dele; um laço só aplica tudo. Separar a descrição do mecanismo é a ideia central de toda biblioteca de interface que veio depois, e o estilo já morava no JavaScript, junto do componente.

```js
this.components = [
	{
		element : document.createElement('div'),
		style : { width : '100%', height : '80px', 'background-color' : '#646464' }
	},
	// ...
];
```

**2. Um detalhe de layout que só funciona porque o DOM é criado por código.** O botão ocupa 20% e a faixa 80%, como `inline-block`. Em HTML escrito à mão, o espaço em branco entre as tags empurraria a faixa para a linha de baixo. Criados por `createElement`, os dois fecham 100% exatos.

**3. O áudio criado sob demanda.** `_getInstanceAudio` é *lazy initialization*: um ponto de acesso único que cria o recurso na primeira vez e o reaproveita depois.

**4. Dois gestos no mesmo botão.** Um clique toca ou pausa, dois cliques param. Não há botão de "stop", e a combinação funciona por causa da ordem em que o navegador entrega os eventos: clique, clique, duplo clique.

**5. A conta de ida e a conta de volta.** O tempo vira largura da barra com uma regra de três; o clique vira tempo com a regra inversa. A segunda ganhou um método próprio, `_changeAudioByPercent`, a semente do `seek(percent)` de hoje.

**6. A intenção guardada nos nomes.** A área ao lado do botão se chama `nomeMusica`, embora nunca mostre nome nenhum. E `this.audio;`, uma linha que não faz nada, é a declaração de um campo, escrita por quem pensava em classes. As duas intenções estão cumpridas na versão nova.

### O que o tempo revelou

O `index.html` original foi aberto, sem alterações, num Chrome de 2026 e exercitado por script. Para os casos que precisam de som, usei a melodia sintetizada deste repositório no lugar do MP3 que saiu do ar.

| Situação | Em 2016 (medido hoje) | Causa | Em 2026 |
|---|---|---|---|
| A música do exemplo | Nada na tela. No console, mais tarde: `NotSupportedError: Failed to load because no supported source was found` | O endereço morreu e não há estado de erro | O player mostra a falha |
| Clicar na faixa antes de o áudio carregar | `TypeError: Failed to set the 'currentTime' property … non-finite` | Sem a duração, a regra de três resulta em `NaN` | O pedido fica guardado |
| Tocar e pausar em seguida | `Uncaught (in promise) AbortError: The play() request was interrupted by a call to pause()` | `play()` devolve uma promessa desde o Chrome 50; o código não espera por ela | A interrupção é ignorada |
| Depois de criar um Player | `window.x === "background-color"` | `for (x in options)` sem `var` | Nenhuma variável global |
| O mesmo código em modo estrito ou num módulo | `ReferenceError: x is not defined` | A mesma linha: a conversão para ES6 quebraria exatamente aqui | É um módulo ES |
| Teclado ou leitor de tela | 0 elementos focáveis, nenhum papel, nenhum texto | O componente é feito só de `div` | `button` e `slider` com rótulos |
| `player1.constructor` | `Object` | Trocar o `prototype` por um literal apaga o construtor | `Player` |

Com um arquivo de áudio válido, o original continua fazendo tudo o que promete: toca, pausa, para no duplo clique e leva a música ao ponto clicado. Dez anos de navegadores não quebraram o caminho principal.

### O que foi refeito

```
gestos (clique, duplo clique, teclado) → toggle · stop · seek → <audio>
                                                                   │
render(elementos, descrição) ← describe(estado) ← reduce(estado, evento)
```

- **O nome da música aparece**, com o tempo decorrido e a duração ao lado.
- **Teclado e leitor de tela**: `button`, `slider`, rótulos, setas, Home e End.
- **Falhas visíveis**: música que não carrega vira mensagem no próprio player.
- **Uma folha de estilo para todos**, com as cores em variáveis CSS, no lugar de estilo inline em quatro elementos por player.
- **Privado de verdade**: `#audio` e `#render` no lugar de `_init` e `_component`.
- **Uma API para quem usa**: `play`, `pause`, `toggle`, `stop`, `seek`, `destroy`, `state` e `statechange`.
- **29 testes** com `node:test`.
- **Uma música que não some**: a demonstração toca uma melodia de 24 segundos sintetizada em [`demo/tune.js`](demo/tune.js).

| | 2016 | 2026 |
|---|---|---|
| Linguagem | ES5, script solto na página | ES2022, módulos, sem build |
| Código | 152 linhas em 1 arquivo | 552 linhas em 6 arquivos, com JSDoc |
| Testes | nenhum | 29 |
| Dependências | 0 | 0 (happy-dom só nos testes) |
| Variáveis globais | `Player`, `player1`…`4` e `x` | nenhuma |
| Elementos focáveis | 0 | 2 por player |
| Estilo | inline, em 4 elementos por player | 1 folha por página, variáveis CSS |
| Estados | tocando ou não | `idle`, `loading`, `playing`, `paused`, `error` |

### Padrões aplicados

| Padrão | Onde | O que resolve |
|---|---|---|
| **Functional core, imperative shell** | `core.js`, `state.js` e `describe` são puros; `player.js` e `render` tocam o navegador | As regras de três de 2016 viraram funções testáveis sem DOM. |
| **Reducer com tabela de transições** (State) | `TRANSITIONS` em `state.js` | Cada evento do áudio tem uma linha dizendo o que muda. |
| **Fluxo unidirecional** | evento → `reduce` → `describe` → `render` | A tela é sempre função do estado. |
| **Template declarativo** | `TEMPLATE` em `view.js` | O `this.components` de 2016 com nomes: `refs.bar` em vez de `components[3]`. |
| **Lazy initialization** | `get audio()` | O `_getInstanceAudio` original, agora preguiçoso de fato com `preload: 'none'`. |
| **Observer** | `Player extends EventTarget` | A página reage ao player sem mexer no áudio por dentro. |
| **Facade** | Os métodos públicos | Seis verbos escondem o `HTMLAudioElement`, suas promessas e seus eventos. |
| **Injeção de dependência** | Opção `createAudio` | Os testes entregam um áudio de mentira. |
| **Encapsulamento** | Campos e métodos `#privados` | A convenção do sublinhado virou garantia da linguagem. |
| **Descarte com AbortController** | `destroy()` | Um `abort()` remove todos os ouvintes de uma vez. |
| **Guard clauses** | Em todo o código novo | O `if` silencioso do `_init` virou um erro que diz o que faltou. |

### O que ficou igual, de propósito

- A assinatura `new Player(elementoPai, enderecoDaMusica)`.
- O componente se monta sozinho, sem HTML, CSS ou dependência.
- O desenho: 80 pixels de altura, 20% para o botão, a barra de 20 pixels com metade da opacidade, o cinza `#646464` e o roxo `#682268`.
- Os gestos: clique, duplo clique, clique na faixa. Ao terminar, a música volta ao início.
- As propriedades `father`, `music` e `audio`.
- A página de exemplo com quatro players em 100%, 80%, 60% e 40%.
- O código de 2016, intacto, em [`original/`](original/).

### O que ainda não faz

Não há controle de volume, lista de músicas nem arrastar na faixa. A conferência no navegador foi feita no Chrome; Firefox, Safari e leitores de tela reais não foram testados. A música original não acompanha o projeto, porque o arquivo saiu do ar e não é meu para distribuir.

---

Original: [JonathanSantos-zz/Player](https://github.com/JonathanSantos-zz/Player) (2016) · Código do relatório exibido com [Jonacode](https://github.com/JonathanSantos/jonacode) · Licença MIT
