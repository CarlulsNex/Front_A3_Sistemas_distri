document.addEventListener('DOMContentLoaded', function() {

    // 1. Defina a URL do Ngrok (Certifique-se que este link está atualizado!)
    const API_BASE_URL = 'https://beb44801ba22.ngrok-free.app/api';

    // 2. Crie um objeto com os Headers para reutilizar
    const requestOptions = {
        method: 'GET',
        headers: {
            "ngrok-skip-browser-warning": "true", // Pula o aviso do Ngrok
            "Content-Type": "application/json"
        }
    };

    async function carregarDadosDosCards() {
        try {
            // 3. O header DEVE ser passado aqui como segundo parâmetro
            const response = await fetch(`${API_BASE_URL}/resumo`, requestOptions);

            if (!response.ok) {
                // Se der erro 404 ou 500, cai aqui
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const dados = await response.json();
            
            // Atualiza a tela
            const cardTotal = document.getElementById('total-produtos'); 
            if (cardTotal) cardTotal.textContent = dados.totalProdutos;

            const cardEstoque = document.getElementById('estoque-baixo'); 
            if (cardEstoque) cardEstoque.textContent = dados.produtosEstoqueBaixo;
            
        } catch (error) {
            console.error("Erro ao carregar cards:", error);
            
            // CORREÇÃO: Usar os mesmos IDs do HTML (com hífen, se for o caso)
            const cardTotal = document.getElementById('total-produtos');
            if (cardTotal) cardTotal.textContent = '-';

            const cardEstoque = document.getElementById('estoque-baixo');
            if (cardEstoque) cardEstoque.textContent = '-';
        }
    }


    async function carregarMovimentacoesRecentes() {
        try {
            // 4. O header também DEVE ser passado aqui
            const response = await fetch(`${API_BASE_URL}/resumo/movimentacoes`, requestOptions);
            
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const movimentacoes = await response.json();
            const corpoTabela = document.getElementById('corpo-tabela-recentes');
            
            if(corpoTabela) {
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
                    
                    // Verifica se o tipo vem como 'ENTRADA' ou outro valor para formatar
                    let tipoTexto = (mov.tipo === 'ENTRADA') ? 'Entrada' : 'Saída';

                    linha.innerHTML = `
                        <td>${tipoTexto}</td>
                        <td>${mov.nomeProduto}</td>
                        <td>${mov.quantidade}</td>
                        <td>${dataFormatada}</td>
                    `;
                    corpoTabela.appendChild(linha);
                });
            }

        } catch (error) {
            console.error("Erro ao carregar movimentações:", error);
            const corpoTabela = document.getElementById('corpo-tabela-recentes');
            if (corpoTabela) {
                corpoTabela.innerHTML = '<tr><td colspan="4">Erro ao carregar as movimentações.</td></tr>';
            }
        }
    }

    // Chama as funções
    carregarDadosDosCards();
    carregarMovimentacoesRecentes();
});