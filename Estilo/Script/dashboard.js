// Este evento garante que o script só será executado após o carregamento completo do HTML.
document.addEventListener('DOMContentLoaded', function() {
    
    // Define a URL base da sua API. Altere se o seu backend estiver em outro endereço.
    const API_BASE_URL = 'http://127.0.0.1:5000/api'; // Exemplo para desenvolvimento local

    /**
     * Função para buscar e atualizar os cards de resumo.
     */
    async function carregarDadosDosCards() {
        try {
            // Busca os dados em um endpoint de 'summary' ou 'stats' da sua API
            const response = await fetch(`${API_BASE_URL}/dashboard/summary`);

            if (!response.ok) {
                throw new Error('Falha ao buscar dados do dashboard');
            }

            const dados = await response.json();

            // Atualiza os elementos HTML com os dados recebidos da API
            document.getElementById('total-produtos').textContent = dados.total_produtos;
            document.getElementById('estoque-baixo').textContent = dados.produtos_estoque_baixo;
            document.getElementById('total-categorias').textContent = dados.categorias_ativas;

        } catch (error) {
            console.error("Erro ao carregar cards:", error);
            // Em caso de erro, exibe uma mensagem nos cards
            document.getElementById('total-produtos').textContent = 'Erro';
            document.getElementById('estoque-baixo').textContent = 'Erro';
            document.getElementById('total-categorias').textContent = 'Erro';
        }
    }

    /**
     * Função para buscar e exibir as movimentações recentes na tabela.
     */
    async function carregarMovimentacoesRecentes() {
        try {
            // Busca os 5 movimentos mais recentes de um endpoint específico
            const response = await fetch(`${API_BASE_URL}/movimentacoes/recentes`);
            
            if (!response.ok) {
                throw new Error('Falha ao buscar movimentações recentes');
            }

            const movimentacoes = await response.json();
            const corpoTabela = document.getElementById('corpo-tabela-recentes');

            // Limpa a mensagem de "Carregando..."
            corpoTabela.innerHTML = ''; 

            if (movimentacoes.length === 0) {
                corpoTabela.innerHTML = '<tr><td colspan="4">Nenhuma movimentação recente encontrada.</td></tr>';
                return;
            }

            // Cria uma linha na tabela para cada movimentação
            movimentacoes.forEach(mov => {
                const linha = document.createElement('tr');
                
                // Formata a data para o padrão brasileiro (DD/MM/AAAA)
                const data = new Date(mov.data).toLocaleDateString('pt-BR');

                linha.innerHTML = `
                    <td>${mov.tipo}</td>
                    <td>${mov.nome_produto}</td>
                    <td>${mov.quantidade}</td>
                    <td>${data}</td>
                `;
                corpoTabela.appendChild(linha);
            });

        } catch (error) {
            console.error("Erro ao carregar movimentações:", error);
            const corpoTabela = document.getElementById('corpo-tabela-recentes');
            corpoTabela.innerHTML = '<tr><td colspan="4">Erro ao carregar as movimentações.</td></tr>';
        }
    }

    // Chama as funções para carregar os dados assim que a página estiver pronta.
    carregarDadosDosCards();
    carregarMovimentacoesRecentes();
});