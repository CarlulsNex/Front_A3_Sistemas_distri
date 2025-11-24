document.addEventListener('DOMContentLoaded', function() {

    // Define as URLs base da sua API.
    const API_BASE_URL = 'http://127.0.0.1:8080/api';


    async function carregarDadosDosCards() {
        try {
            
            const response = await fetch(`${API_BASE_URL}/resumo`);

            if (!response.ok) {
                throw new Error('Falha ao buscar dados dos cards');
            }

            const dados = await response.json();
            
        const cardTotal = document.getElementById('total-produtos');
        if (cardTotal) cardTotal.textContent = dados.totalProdutos;

        const cardEstoque = document.getElementById('estoque-baixo'); 
        if (cardEstoque) cardEstoque.textContent = dados.produtosEstoqueBaixo;
        
        } catch (error) {
            console.error("Erro ao carregar cards:", error);
            document.getElementById('totalProdutos').textContent = 'Erro';
            document.getElementById('produtosEstoqueBaixo').textContent = 'Erro';
        }
    }


    async function carregarMovimentacoesRecentes() {
        try {
            // Retorna a lista (ARRAY) de todas as movimentações.
            const response = await fetch(`${API_BASE_URL}/resumo/movimentacoes`);
            
            if (!response.ok) {
                throw new Error('Falha ao buscar movimentações recentes');
            }

            const movimentacoes = await response.json();
            const corpoTabela = document.getElementById('corpo-tabela-recentes');
            corpoTabela.innerHTML = ''; 

            if (!movimentacoes || movimentacoes.length === 0) {
                corpoTabela.innerHTML = '<tr><td colspan="4">Nenhuma movimentação recente encontrada.</td></tr>';
                return;
            }
            
       
            const recentes = movimentacoes.slice(0, 10);

            recentes.forEach(mov => {
                const linha = document.createElement('tr');
                const dataObj = new Date(mov.data);
                const dataFormatada = isNaN(dataObj) ? 'Data Inválida' : dataObj.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                let tipoTexto = mov.tipo=== 'ENTRADA' ? 'Entrada' : 'Saída';

                linha.innerHTML = `
                    <td>${tipoTexto}</td>
                    <td>${mov.nomeProduto}</td>
                    <td>${mov.quantidade}</td>
                    <td>${dataFormatada}</td>
                `;
                corpoTabela.appendChild(linha);
            });

        } catch (error) {
            console.error("Erro ao carregar movimentações:", error);
            const corpoTabela = document.getElementById('corpo-tabela-recentes');
            corpoTabela.innerHTML = '<tr><td colspan="4">Erro ao carregar as movimentações.</td></tr>';
        }
    }

    carregarDadosDosCards();
    carregarMovimentacoesRecentes();
});