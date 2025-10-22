// Este evento garante que o script só será executado após o carregamento completo do HTML.
document.addEventListener('DOMContentLoaded', function() {

    // Define as URLs base da sua API.
    const API_BASE_URL = 'http://127.0.0.1:5000/api';

    /**
     * Função para buscar e atualizar os CARDS de resumo.
     * Ela chama o novo endpoint que já retorna os dados prontos.
     */
    async function carregarDadosDosCards() {
        try {
            // Chama o endpoint de resumo que retorna um OBJETO com os totais.
            const response = await fetch(`${API_BASE_URL}/relatorio/resumo`);

            if (!response.ok) {
                throw new Error('Falha ao buscar dados dos cards');
            }

            const dados = await response.json();

            // Atualiza os elementos HTML diretamente com os dados recebidos.
            // Não precisamos mais calcular nada no JavaScript!
            document.getElementById('total-produtos').textContent = dados.total_produtos;
            document.getElementById('estoque-baixo').textContent = dados.produtos_estoque_baixo;
            document.getElementById('total-categorias').textContent = dados.categorias_ativas;

        } catch (error) {
            console.error("Erro ao carregar cards:", error);
            // Em caso de erro, exibe uma mensagem nos cards.
            document.getElementById('total-produtos').textContent = 'Erro';
            document.getElementById('estoque-baixo').textContent = 'Erro';
            document.getElementById('total-categorias').textContent = 'Erro';
        }
    }

    /**
     * Função para buscar e exibir as movimentações recentes na TABELA.
     * Ela chama o endpoint antigo que retorna um ARRAY de movimentações.
     */
    async function carregarMovimentacoesRecentes() {
        try {
            // Chama o endpoint que retorna a lista (ARRAY) de todas as movimentações.
            const response = await fetch(`${API_BASE_URL}/relatorios`);
            
            if (!response.ok) {
                throw new Error('Falha ao buscar movimentações recentes');
            }

            const movimentacoes = await response.json();
            const corpoTabela = document.getElementById('corpo-tabela-recentes');

            // Limpa a mensagem de "Carregando..."
            corpoTabela.innerHTML = ''; 

            if (!movimentacoes || movimentacoes.length === 0) {
                corpoTabela.innerHTML = '<tr><td colspan="4">Nenhuma movimentação recente encontrada.</td></tr>';
                return;
            }
            
            // Ordena as movimentações da mais recente para a mais antiga
            movimentacoes.sort((a, b) => new Date(b.data_entrada || b.data_saida) - new Date(a.data_entrada || a.data_saida));

            // Pega apenas as 5 movimentações mais recentes
            const recentes = movimentacoes.slice(0, 5);

            // Cria uma linha na tabela para cada movimentação
            recentes.forEach(mov => {
                const linha = document.createElement('tr');
                
                // O ideal é a API retornar um campo 'tipo'. Por enquanto, podemos deduzir.
                const tipo = mov.entradaid ? 'Entrada' : 'Saída'; 
                const dataFormatada = new Date(mov.data_entrada || mov.data_saida).toLocaleDateString('pt-BR');

                linha.innerHTML = `
                    <td>${tipo}</td>
                    <td>${mov.nome_produto}</td>
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

    // Chama as duas funções para carregar os dados do dashboard assim que a página estiver pronta.
    carregarDadosDosCards();
    carregarMovimentacoesRecentes();
});