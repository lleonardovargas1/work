let casas = ["", "", "", "", "", "", "", "", ""];
let jogoAtivo = true;
let humano = "X";
let ia = "O";
let vezDoHumano = false;

let vitoriasHumano = 0;
let vitoriasIa = 0;
let numeroRodada = 1;
let nomeJogador = "Jogador";
let historicoRodadas = [];
let nivelIA = 1;
const NIVEL_MAXIMO_IA = 5;

function iniciarJogoComNome() {
    const input = document.getElementById("input-nome");
    if (input.value.trim() === "") {
        alert("Por favor, insira seu nome para jogar!");
        return;
    }

    nomeJogador = input.value.trim();
    document.getElementById("titulo-jogador").innerText = `💻 Experimento de: ${nomeJogador}`;
    document.getElementById("nome-placar-humano").innerText = nomeJogador;

    historicoRodadas = JSON.parse(localStorage.getItem("historicoRodadas")) || [];
    carregarHistoricoDoBanco();

    document.getElementById("tela-login").style.display = "none";
    document.getElementById("conteudo-jogo").style.display = "block";

    atualizarNivelIA();
    sortearInicio();
}

function sortearInicio() {
    casas = ["", "", "", "", "", "", "", "", ""];
    jogoAtivo = true;
    vezDoHumano = false;

    document.getElementById("btn-reset").style.display = "none";
    document.getElementById("btn-reset").innerText = "Próxima Rodada";

    const celulas = document.getElementsByClassName("celula");
    Array.from(celulas).forEach((c) => {
        c.innerText = "";
        c.classList.remove("vencedora", "ocupada");
        c.style.color = "#333";
    });

    document.getElementById("status").className = "";
    document.getElementById("status").innerText = "Sorteando quem começa...";
    atualizarNivelIA();

    setTimeout(() => {
        if (Math.random() < 0.5) {
            vezDoHumano = true;
            document.getElementById("status").innerText = `Sua vez, ${nomeJogador}!`;
        } else {
            vezDoHumano = false;
            document.getElementById("status").innerText = "IA começa!";
            setTimeout(jogadaDaIA, 600);
        }
    }, 300);
}

function jogar(indice) {
    if (casas[indice] !== "" || !jogoAtivo || !vezDoHumano) return;

    efetuarJogada(indice, humano);
    if (jogoAtivo) {
        vezDoHumano = false;
        document.getElementById("status").innerText = "IA calculando...";
        setTimeout(jogadaDaIA, 600);
    }
}

function jogadaDaIA() {
    if (!jogoAtivo) return;

    const movimento = escolherMelhorMovimento();
    efetuarJogada(movimento, ia);
    if (jogoAtivo) {
        vezDoHumano = true;
        document.getElementById("status").innerText = "Sua vez!";
    }
}

function escolherMelhorMovimento() {
    const jogadasDisponiveis = casas.map((valor, indice) => (valor === "" ? indice : null)).filter((indice) => indice !== null);

    const jogadaVitoria = jogadasDisponiveis.find((indice) => {
        const copia = [...casas];
        copia[indice] = ia;
        return verificarGanhadorSilencioso(copia) === ia;
    });
    if (jogadaVitoria !== undefined) return jogadaVitoria;

    const bloqueio = jogadasDisponiveis.find((indice) => {
        const copia = [...casas];
        copia[indice] = humano;
        return verificarGanhadorSilencioso(copia) === humano;
    });
    if (bloqueio !== undefined) return bloqueio;

    if (nivelIA >= 3 && casas[4] === "") return 4;

    const chanceErro = 0.85 - (nivelIA - 1) * 0.15;
    if (Math.random() < chanceErro) {
        return jogadasDisponiveis[Math.floor(Math.random() * jogadasDisponiveis.length)];
    }

    let melhorMovimento = jogadasDisponiveis[0];
    let melhorPontuacao = -Infinity;

    jogadasDisponiveis.forEach((indice) => {
        const copia = [...casas];
        copia[indice] = ia;
        const pontuacao = minimax(copia, 0, false);
        if (pontuacao > melhorPontuacao) {
            melhorPontuacao = pontuacao;
            melhorMovimento = indice;
        }
    });

    return melhorMovimento;
}

function minimax(tabuleiro, profundidade, ehMaximizando) {
    const resultado = verificarGanhadorSilencioso(tabuleiro);
    if (resultado === ia) return 10 - profundidade;
    if (resultado === humano) return profundidade - 10;
    if (resultado === "Empate") return 0;

    if (ehMaximizando) {
        let melhorPontuacao = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (tabuleiro[i] === "") {
                tabuleiro[i] = ia;
                const pontuacao = minimax(tabuleiro, profundidade + 1, false);
                tabuleiro[i] = "";
                melhorPontuacao = Math.max(pontuacao, melhorPontuacao);
            }
        }
        return melhorPontuacao;
    }

    let melhorPontuacao = Infinity;
    for (let i = 0; i < 9; i++) {
        if (tabuleiro[i] === "") {
            tabuleiro[i] = humano;
            const pontuacao = minimax(tabuleiro, profundidade + 1, true);
            tabuleiro[i] = "";
            melhorPontuacao = Math.min(pontuacao, melhorPontuacao);
        }
    }
    return melhorPontuacao;
}

function efetuarJogada(indice, simbolo) {
    casas[indice] = simbolo;
    const celulas = document.getElementsByClassName("celula");
    const celula = celulas[indice];
    celula.innerText = simbolo;
    celula.style.color = simbolo === "O" ? "#ff4444" : "#00ff88";
    celula.classList.add("ocupada");

    const vencedor = verificarGanhadorSilencioso(casas);
    if (vencedor) {
        jogoAtivo = false;
        destacarVencedor(vencedor);
        salvarRodadaNoBanco(vencedor);
        return;
    }

    if (!casas.includes("")) {
        jogoAtivo = false;
        salvarRodadaNoBanco("Empate");
    }
}

function destacarVencedor(vencedor) {
    const caminhos = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    const celulas = document.getElementsByClassName("celula");

    for (const caminho of caminhos) {
        if (casas[caminho[0]] === vencedor && casas[caminho[1]] === vencedor && casas[caminho[2]] === vencedor) {
            caminho.forEach((indice) => celulas[indice].classList.add("vencedora"));
            break;
        }
    }
}

function salvarRodadaNoBanco(vencedor) {
    let resultadoTexto = "";
    if (vencedor === ia) {
        vitoriasIa++;
        resultadoTexto = "IA Venceu";
    } else if (vencedor === humano) {
        vitoriasHumano++;
        resultadoTexto = "Você Venceu";
    } else {
        resultadoTexto = "Empate";
    }

    document.getElementById("ponto-humano").innerText = vitoriasHumano;
    document.getElementById("ponto-ia").innerText = vitoriasIa;

    const novaRodada = {
        numero: numeroRodada,
        jogador: nomeJogador,
        resultado: resultadoTexto,
        placar: `${vitoriasHumano} x ${vitoriasIa}`
    };

    historicoRodadas.push(novaRodada);
    localStorage.setItem("historicoRodadas", JSON.stringify(historicoRodadas));

    adicionarLinhaNaTabela(novaRodada);
    numeroRodada++;

    nivelIA = Math.min(NIVEL_MAXIMO_IA, nivelIA + 1);
    atualizarNivelIA();

    const statusEl = document.getElementById("status");
    if (vitoriasHumano === 2) {
        statusEl.innerText = "🏆 SÉRIE FINALIZADA: VOCÊ VENCEU!";
        statusEl.className = "vitoria";
        resetarBancoTotal();
    } else if (vitoriasIa === 2) {
        statusEl.innerText = "🤖 SÉRIE FINALIZADA: A IA VENCEU!";
        statusEl.className = "derrota";
        resetarBancoTotal();
    } else {
        statusEl.innerText = `${resultadoTexto}! Nível da IA: ${nivelIA}`;
        statusEl.className = vencedor === ia ? "derrota" : vencedor === humano ? "vitoria" : "empate";
        document.getElementById("btn-reset").style.display = "inline-block";
    }
}

function carregarHistoricoDoBanco() {
    document.getElementById("corpo-tabela").innerHTML = "";
    historicoRodadas.forEach((rodada) => {
        adicionarLinhaNaTabela(rodada);
    });
}

function adicionarLinhaNaTabela(rodada) {
    const tabela = document.getElementById("corpo-tabela");
    const linha = document.createElement("tr");
    linha.innerHTML = `<td>${rodada.numero}</td><td>${rodada.jogador}</td><td>${rodada.resultado}</td><td>${rodada.placar}</td>`;
    tabela.appendChild(linha);
}

function resetarBancoTotal() {
    vitoriasHumano = 0;
    vitoriasIa = 0;
    numeroRodada = 1;
    document.getElementById("btn-reset").innerText = "Próximo Jogador";
    document.getElementById("btn-reset").style.display = "inline-block";
}

function atualizarNivelIA() {
    const elementoNivel = document.getElementById("nivel-ia");
    if (elementoNivel) {
        elementoNivel.innerText = `Nível da IA: ${nivelIA}`;
    }
}

function reiniciarTreinamento() {
    nivelIA = 1;
    vitoriasHumano = 0;
    vitoriasIa = 0;
    numeroRodada = 1;
    historicoRodadas = [];
    localStorage.removeItem("historicoRodadas");

    document.getElementById("ponto-humano").innerText = "0";
    document.getElementById("ponto-ia").innerText = "0";
    document.getElementById("corpo-tabela").innerHTML = "";
    atualizarNivelIA();
    sortearInicio();
}

function reiniciarRodada() {
    if (document.getElementById("btn-reset").innerText === "Próximo Jogador") {
        location.reload();
        return;
    }
    sortearInicio();
}

function verificarGanhadorSilencioso(tabuleiro = casas) {
    const caminhos = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    for (const caminho of caminhos) {
        if (tabuleiro[caminho[0]] !== "" && tabuleiro[caminho[0]] === tabuleiro[caminho[1]] && tabuleiro[caminho[1]] === tabuleiro[caminho[2]]) {
            return tabuleiro[caminho[0]];
        }
    }
    if (!tabuleiro.includes("")) return "Empate";
    return null;
}

function limparHistoricoDoBanco() {
    if (confirm("Tem certeza que deseja apagar TODO o histórico de jogadores do banco de dados?")) {
        localStorage.removeItem("historicoRodadas");
        historicoRodadas = [];
        document.getElementById("corpo-tabela").innerHTML = "";
    }
}