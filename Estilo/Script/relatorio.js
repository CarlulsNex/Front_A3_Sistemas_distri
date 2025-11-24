document.addEventListener('DOMContentLoaded', () => {

    const API_BASE_URL = 'http://127.0.0.1:8080/api/relatorios';

    const reportSelect = document.getElementById('report-select');
    const btnGerar = document.getElementById('btn-gerar-relatorio');
    const filtrosMovimentos = document.getElementById('filtros-movimentos');

    const tableHead = document.getElementById('cabecalho-tabela-relatorios');
    const tableBody = document.getElementById('corpo-tabela-relatorios');
    const noResultsMessage = document.getElementById('no-results-message');
    const totalContainer = document.getElementById('total-container');

    /**
     * Altera a visibilidade dos filtros específicos ao trocar o tipo de relatório.
     */
    reportSelect.addEventListener('change', () => {
        const selected = reportSelect.value;
        filtrosMovimentos.style.display = (selected === 'movimentos') ? 'contents' : 'none';

        // Limpa a tabela
        clearTable();
        totalContainer.style.display = 'none';
        setTableMessage('Selecione um tipo de relatório e clique em "Gerar Relatório".');
    });

    /**
     * Ponto de entrada principal para buscar e renderizar o relatório selecionado.
     */
    btnGerar.addEventListener('click', async () => {
        const reportType = reportSelect.value;
        if (!reportType) {
            setTableMessage('Por favor, selecione um tipo de relatório.');
            return;
        }

        clearTable();
        totalContainer.style.display = 'none';
        setTableMessage('Carregando dados...', false);
        noResultsMessage.style.display = 'none';

        try {
            let data;
            switch (reportType) {
                case 'lista-precos':
                    data = await fetchData(`${API_BASE_URL}/listaPrecos`);
                    renderListaPrecosTable(data);
                    break;
                case 'balanco':
                    data = await fetchData(`${API_BASE_URL}/balanco`);
                    renderBalancoTable(data);
                    break;
                case 'estoque-baixo':
                    data = await fetchData(`${API_BASE_URL}/estoqueMinimo`);
                    renderEstoqueBaixoTable(data);
                    break;
                case 'produtos-por-categoria':
                    data = await fetchData(`${API_BASE_URL}/quantidadeCategoria`);
                    renderCategoriaTable(data);
                    break;
                case 'top-movimentos':
                    data = await fetchData(`${API_BASE_URL}/produtoMaisMovimentado`);
                    renderTopMovimentosTable(data);
                    break;
                case 'movimentos-recentes':
                    data = await fetchData(`http://127.0.0.1:8080/api/resumo/movimentacoes`);
                    renderTabelarecentes(data);
                    break;
                default:
                    setTableMessage('Tipo de relatório inválido.');
            }
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            setTableError(`Erro ao buscar dados: ${error.message}`);
        }
    });

    /**
     * Função reutilizável para buscar dados da API.
     * @param {string} url - O endpoint completo da API para buscar.
     */
    async function fetchData(url) {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            const errorMsg = errorData?.erro || `Erro HTTP: ${response.status}`;
            throw new Error(errorMsg);
        }
        return await response.json();
    }

    /**
     * Relatório 1: Lista de Preços */
    function renderListaPrecosTable(data) {
        const headers = ['Produto', 'categoria', 'Preço Unitário'];
        tableHead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;

        if (!data || data.length === 0) {
            setTableMessage('Nenhum produto encontrado.', true);
            return;
        }
        data.sort((a, b) => a.nome.localeCompare(b.nome));

        const rowsHtml = data.map(p => `
            <tr>
                <td>${p.nome || 'N/A'}</td>
                <td>${p.categoria || 'N/A'}</td>
                <td>${formatCurrency(p.preco)}</td>
            </tr>
        `).join('');
        tableBody.innerHTML = rowsHtml;
    }

    /**
     * Relatório 2: Balanço Físico/Financeiro */
    function renderBalancoTable(data) {

        const produtos = data.itens || [];

        const headers = ['Produto', 'Qtd. em Estoque', 'Valor Unitário', 'Valor Total'];
        tableHead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;

        if (!produtos || produtos.length === 0) {
            setTableMessage('Nenhum produto encontrado.', true);
            return;
        }

        produtos.sort((a, b) => a.nome.localeCompare(b.nome));

        let grandTotal = 0;
        const rowsHtml = produtos.map(p => {
            const totalProduto = (p.quantidade || 0) * (p.precoUnitario || 0);
            grandTotal += totalProduto;

            return `
            <tr>
                <td>${p.nome || 'N/A'}</td>
                <td>${p.quantidade || 0}</td>
                <td>${formatCurrency(p.precoUnitario)}</td>
                <td>${formatCurrency(totalProduto)}</td>
            </tr>
        `;
        }).join('');

        tableBody.innerHTML = rowsHtml;

        totalContainer.innerHTML =
            `<h3>Valor Total do Estoque: ${formatCurrency(grandTotal)}</h3>`;
        totalContainer.style.display = 'block';
    }

    /**
     * Relatório 3: Produtos com Estoque Baixo */
    function renderEstoqueBaixoTable(data) {
        const headers = ['Produto', 'Qtd. Mínima', 'Qtd. em Estoque'];
        tableHead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;

        if (!data || data.length === 0) {
            setTableMessage('Nenhum produto com estoque baixo.', true);
            return;
        }

        const rowsHtml = data.map(p => `
            <tr">
                <td>${p.nome || 'N/A'}</td>
                <td>${p.quantidade_minima || 0}</td>
                <td>${p.quantidade || 0}</td>
            </tr>
        `).join('');
        tableBody.innerHTML = rowsHtml;
    }

    /**
     * Relatório 4: Quantidade de produtos por categoria */
    function renderCategoriaTable(data) {
        const headers = ['Categoria', 'Quantidade de Produtos Distintos'];
        tableHead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;

        if (!data || data.length === 0) {
            setTableMessage('Nenhuma categoria encontrada.', true);
            return;
        }

        const rowsHtml = data.map(cat => `
            <tr>
                <td>${cat.categoria || 'N/A'}</td>
                <td>${cat.quantidadeProdutosDistintos || 0}</td>
            </tr>
        `).join('');
        tableBody.innerHTML = rowsHtml;
    }

    /**
     * Relatório 5: Produto que mais teve saída e mais teve entrada */
    function renderTopMovimentosTable(data) {
    const headers = ['Tipo de Movimentação', 'Produto', 'Total Movimentado'];
    tableHead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;

    if (!data) {
        setTableMessage('Nenhum movimento encontrado.', true);
        return;
    }

    let rowsHtml = '';

    // PRODUTO COM MAIOR ENTRADA
    const entrada = data.produtoMaisEntrada;
    if (entrada && entrada.totalEntradas > 0) {
        rowsHtml += `
            <tr style="color: var(--verde);">
                <td>Maior Entrada</td>
                <td>${entrada.nome || 'N/A'}</td>
                <td>${entrada.totalEntradas}</td>
            </tr>`;
    } else {
        rowsHtml += `
            <tr>
                <td>Maior Entrada</td>
                <td colspan="2">${entrada?.nome || 'Nenhuma entrada registrada.'}</td>
            </tr>`;
    }

    // PRODUTO COM MAIOR SAÍDA
    const saida = data.produtoMaisSaida;
    if (saida && saida.totalSaidas > 0) {
        rowsHtml += `
            <tr style="color: var(--vermelho-erro);">
                <td>Maior Saída</td>
                <td>${saida.nome || 'N/A'}</td>
                <td>${saida.totalSaidas}</td>
            </tr>`;
    } else {
        rowsHtml += `
            <tr>
                <td>Maior Saída</td>
                <td colspan="2">${saida?.nome || 'Nenhuma saída registrada.'}</td>
            </tr>`;
    }

    tableBody.innerHTML = rowsHtml;
}

    function renderTabelarecentes(data) {
        
    const headers = ['Produto', 'Categoria', 'Tipo', 'Quantidade', 'Data'];
    tableHead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
    
    // 1. Verifica se há dados
    if (!data || data.length === 0) {
        setTableMessage('Nenhuma movimentação recente encontrada.', true);
        return;
    }

    // 2. Cria as linhas da tabela
    const rowsHtml = data.map(p => {
        // Formatação da Data
        const dataObj = new Date(p.data);
        const dataFormatada = isNaN(dataObj) ? 'Data Inválida' : dataObj.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Estilo e Texto do Tipo
        const isEntrada = p.tipo === 'ENTRADA';
        const tipoTexto = isEntrada ? 'Entrada' : 'Saída';
        

        return `
            <tr>
                <td>${p.nomeProduto || "---"}</td>
                <td>${p.nomeCategoria || "---"}</td>
                <td>${tipoTexto}</td>
                <td>${p.quantidade || "---"}</td>
                <td>${dataFormatada}</td>
            </tr>
        `;
    }).join('');

   
    tableBody.innerHTML = rowsHtml;
    }

    // --- FUNÇÕES AUXILIARES ---

    /** Limpa o cabeçalho e corpo da tabela e esconde mensagens. */
    function clearTable() {
        tableHead.innerHTML = '';
        tableBody.innerHTML = '';
        noResultsMessage.style.display = 'none';
        totalContainer.style.display = 'none';
    }
    function setTableMessage(message, showInNoResultsP = false) {
        clearTable();
        if (showInNoResultsP) {
            noResultsMessage.innerHTML = `<p>${message}</p>`;
            noResultsMessage.style.display = 'block';
        } else {
            tableBody.innerHTML = `<tr><td colspan="10" style="text-align: center;">${message}</td></tr>`;
        }
    }
    function setTableError(message) {
        clearTable();
        tableBody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: var(--vermelho-erro);">${message}</td></tr>`;
    }
    function formatCurrency(value) {
        if (typeof value !== 'number') {
            value = parseFloat(value) || 0;
        }
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    // --- INICIALIZAÇÃO ---
    function initialize() {
        filtrosMovimentos.style.display = 'none';
        setTableMessage('Selecione um tipo de relatório e clique em "Gerar Relatório".');
    }

    initialize();
});