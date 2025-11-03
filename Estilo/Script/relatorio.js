document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURAÇÕES E SELETORES GLOBAIS ---
    const API_BASE_URL = 'http://127.0.0.1:5000/api/relatorio';

    // Seletores Principais
    const reportSelect = document.getElementById('report-select');
    const btnGerar = document.getElementById('btn-gerar-relatorio');
    const filtrosMovimentos = document.getElementById('filtros-movimentos');

    // Seletores da Tabela
    const tableHead = document.getElementById('cabecalho-tabela-relatorios');
    const tableBody = document.getElementById('corpo-tabela-relatorios');
    const noResultsMessage = document.getElementById('no-results-message');
    const totalContainer = document.getElementById('total-container'); 

    // Seletores dos Filtros de Movimentação
    const dataInicialInput = document.getElementById('data-inicial');
    const dataFinalInput = document.getElementById('data-final');
    const categoriaInput = document.getElementById('filtro-categoria');
    const produtoInput = document.getElementById('filtro-produto');
    const idInput = document.getElementById('filtro-id');
    const radioMaior = document.getElementById('maior');
    const radioMenor = document.getElementById('menor');

    // --- EVENT LISTENERS PRINCIPAIS ---

    /**
     * Altera a visibilidade dos filtros específicos ao trocar o tipo de relatório.
     */
    reportSelect.addEventListener('change', () => {
        const selected = reportSelect.value;
        // 'display: contents' faz o wrapper se comportar como se não existisse, mantendo o layout flex
        filtrosMovimentos.style.display = (selected === 'movimentos') ? 'contents' : 'none';
        
        // Limpa a tabela ao trocar de tipo
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
                case 'movimentos':
                    
                    data = await fetchData(`${API_BASE_URL}/relatorios`);
                    renderMovimentosTable(data);
                    break;
                case 'lista-precos':
                    data = await fetchData(`${API_BASE_URL}/produtos`); 
                    renderListaPrecosTable(data);
                    break;
                case 'balanco':
                    data = await fetchData(`${API_BASE_URL}/produtos`);
                    renderBalancoTable(data);
                    break;
                case 'estoque-baixo':
                    data = await fetchData(`${API_BASE_URL}/estoque-baixo`);
                    renderEstoqueBaixoTable(data);
                    break;
                case 'produtos-por-categoria':
                    data = await fetchData(`${API_BASE_URL}/produtos-por-categoria`);
                    renderCategoriaTable(data);
                    break;
                case 'top-movimentos':
                    data = await fetchData(`${API_BASE_URL}/top-movimentos`);
                    renderTopMovimentosTable(data);
                    break;
                default:
                    setTableMessage('Tipo de relatório inválido.');
            }
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            setTableError(`Erro ao buscar dados: ${error.message}`);
        }
    });

    // --- FUNÇÕES DA API ---

    /**
     * Função reutilizável para buscar dados da API.
     * @param {string} url - O endpoint completo da API para buscar.
     */
    async function fetchData(url) {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json().catch(() => null); // Tenta pegar erro do JSON
            const errorMsg = errorData?.erro || `Erro HTTP: ${response.status}`;
            throw new Error(errorMsg);
        }
        return await response.json();
    }

    // --- FUNÇÕES DE RENDERIZAÇÃO DE TABELA ---

    /**
     * Relatório 1: Lista de Preços
     * (Requer: nome, preco, nome_categoria)
     */
    function renderListaPrecosTable(data) {
        const headers = ['Produto', 'Categoria', 'Preço Unitário'];
        tableHead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;

        if (!data || data.length === 0) {
            setTableMessage('Nenhum produto encontrado.', true);
            return;
        }
        data.sort((a, b) => a.nome.localeCompare(b.nome)); 
        
        const rowsHtml = data.map(p => `
            <tr>
                <td>${p.nome || 'N/A'}</td>
                <td>${p.nome_categoria || 'N/A'}</td>
                <td>${formatCurrency(p.preco)}</td>
            </tr>
        `).join('');
        tableBody.innerHTML = rowsHtml;
    }

    /**
     * Relatório 2: Balanço Físico/Financeiro
     * (Requer: nome, quantidade, preco)
     */
    function renderBalancoTable(data) {
        const headers = ['Produto', 'Qtd. em Estoque', 'Valor Unitário', 'Valor Total'];
        tableHead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
        
        if (!data || data.length === 0) {
            setTableMessage('Nenhum produto encontrado.', true);
            return;
        }
        data.sort((a, b) => a.nome.localeCompare(b.nome)); 

        let grandTotal = 0;
        const rowsHtml = data.map(p => {
            const totalProduto = (p.quantidade || 0) * (p.preco || 0);
            grandTotal += totalProduto;
            return `
                <tr>
                    <td>${p.nome || 'N/A'}</td>
                    <td>${p.quantidade || 0}</td>
                    <td>${formatCurrency(p.preco)}</td>
                    <td>${formatCurrency(totalProduto)}</td>
                </tr>
            `;
        }).join('');
        
        tableBody.innerHTML = rowsHtml;
        totalContainer.innerHTML = `<h3>Valor Total do Estoque: ${formatCurrency(grandTotal)}</h3>`;
        totalContainer.style.display = 'block';
    }

    /**
     * Relatório 3: Produtos com Estoque Baixo
     * (Requer: nome, quantidade_minima, quantidade)
     */
    function renderEstoqueBaixoTable(data) {
        const headers = ['Produto', 'Qtd. Mínima', 'Qtd. em Estoque'];
        tableHead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
        
        if (!data || data.length === 0) {
            setTableMessage('Nenhum produto com estoque baixo.', true);
            return;
        }
        
        const rowsHtml = data.map(p => `
            <tr style="color: var(--vermelho-erro);">
                <td>${p.nome || 'N/A'}</td>
                <td>${p.quantidade_minima || 0}</td>
                <td>${p.quantidade || 0}</td>
            </tr>
        `).join('');
        tableBody.innerHTML = rowsHtml;
    }

    /**
     * Relatório 4: Quantidade de produtos por categoria
     * (Requer: nome_categoria, total_produtos)
     */
    function renderCategoriaTable(data) {
        const headers = ['Categoria', 'Quantidade de Produtos Distintos'];
        tableHead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
        
        if (!data || data.length === 0) {
            setTableMessage('Nenhuma categoria encontrada.', true);
            return;
        }

        const rowsHtml = data.map(cat => `
            <tr>
                <td>${cat.nome_categoria || 'N/A'}</td>
                <td>${cat.total_produtos || 0}</td>
            </tr>
        `).join('');
        tableBody.innerHTML = rowsHtml;
    }

    /**
     * Relatório 5: Produto que mais teve saída e mais teve entrada
     * (Requer: top_entrada: { nome_produto, total }, top_saida: { ... })
     */
    function renderTopMovimentosTable(data) {
        const headers = ['Tipo de Movimentação', 'Produto', 'Total Movimentado'];
        tableHead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
        
        if (!data || (!data.top_entrada && !data.top_saida)) {
            setTableMessage('Nenhum movimento encontrado.', true);
            return;
        }

        let rowsHtml = '';
        const entrada = data.top_entrada;
        if (entrada && entrada.total > 0) {
            rowsHtml += `
                <tr style="color: var(--verde);">
                    <td>Maior Entrada</td>
                    <td>${entrada.nome_produto || 'N/A'}</td>
                    <td>${entrada.total || 0}</td>
                </tr>`;
        } else {
             rowsHtml += `
                <tr>
                    <td>Maior Entrada</td>
                    <td colspan="2">${entrada?.nome_produto || 'Nenhuma entrada registrada.'}</td>
                </tr>`;
        }

        const saida = data.top_saida;
        if (saida && saida.total > 0) {
            rowsHtml += `
                <tr style="color: var(--vermelho-erro);">
                    <td>Maior Saída</td>
                    <td>${saida.nome_produto || 'N/A'}</td>
                    <td>${saida.total || 0}</td>
                </tr>`;
        } else {
             rowsHtml += `
                <tr>
                    <td>Maior Saída</td>
                    <td colspan="2">${saida?.nome_produto || 'Nenhuma saída registrada.'}</td>
                </tr>`;
        }
        tableBody.innerHTML = rowsHtml;
    }

    /**
     * Relatório Original: Movimentações (com filtro e ordenação no cliente)
     * (Requer: tipo, nome_produto, produto_id, nome_categoria, quantidade, data)
     */
    function renderMovimentosTable(data) {
        const headers = ['Tipo do Movimento', 'Produto (ID)', 'Categoria', 'Quantidade', 'Data'];
        tableHead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
        
        if (!data || data.length === 0) {
            setTableMessage('Nenhum movimento encontrado.', true);
            return;
        }

        // --- Filtragem (similar ao produtos.js) ---
        const dataInicial = dataInicialInput.value ? new Date(dataInicialInput.value + 'T00:00:00') : null;
        const dataFinal = dataFinalInput.value ? new Date(dataFinalInput.value + 'T23:59:59') : null;
        const categoria = categoriaInput.value.toLowerCase();
        const produto = produtoInput.value.toLowerCase();
        const id = idInput.value;

        const filteredData = data.filter(item => {
            const itemData = new Date(item.data); 
            const itemCategoria = (item.nome_categoria || '').toLowerCase();
            const itemProduto = (item.nome_produto || '').toLowerCase();
            const itemProdutoId = (item.produto_id || '').toString();

            let correspondeData = true;
            if (dataInicial && itemData < dataInicial) correspondeData = false;
            if (dataFinal && itemData > dataFinal) correspondeData = false;
            
            const correspondeCategoria = !categoria || itemCategoria.includes(categoria);
            const correspondeProduto = !produto || itemProduto.includes(produto);
            const correspondeId = !id || itemProdutoId.includes(id);

            return correspondeData && correspondeCategoria && correspondeProduto && correspondeId;
        });
        
        if (filteredData.length === 0) {
             setTableMessage('Nenhum resultado encontrado para os filtros aplicados!', true);
            return;
        }

        // --- Ordenação ---
        if (radioMaior.checked || radioMenor.checked) {
            filteredData.sort((a, b) => {
                const qtdA = a.quantidade || 0;
                const qtdB = b.quantidade || 0;
                return radioMaior.checked ? qtdB - qtdA : qtdA - qtdB;
            });
        }
        
        // --- Renderização ---
        const rowsHtml = filteredData.map(item => {
            const dataFormatada = new Date(item.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
            const tipoClasse = item.tipo === 'Entrada' ? 'var(--verde)' : 'var(--vermelho-erro)';
            return `
                <tr style="color: ${tipoClasse};">
                    <td>${item.tipo || 'N/A'}</td>
                    <td>${item.nome_produto || 'N/A'} (${item.produto_id || 'N/A'})</td>
                    <td>${item.nome_categoria || 'N/A'}</td>
                    <td>${item.quantidade || 0}</td>
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

    /** Exibe uma mensagem de status ou "nenhum resultado" na tabela. */
    function setTableMessage(message, showInNoResultsP = false) {
        clearTable();
        if (showInNoResultsP) {
            noResultsMessage.innerHTML = `<p>${message}</p>`;
            noResultsMessage.style.display = 'block';
        } else {
            tableBody.innerHTML = `<tr><td colspan="10" style="text-align: center;">${message}</td></tr>`;
        }
    }

    /** Exibe uma mensagem de erro na tabela. */
    function setTableError(message) {
        clearTable();
        tableBody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: var(--vermelho-erro);">${message}</td></tr>`;
    }

    /** Formata um número para BRL (Reais). */
    function formatCurrency(value) {
        if (typeof value !== 'number') {
            value = parseFloat(value) || 0;
        }
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    // --- INICIALIZAÇÃO ---

    /**
     * Define o estado inicial da UI ao carregar a página.
     */
    function initialize() {
        filtrosMovimentos.style.display = 'none';
        setTableMessage('Selecione um tipo de relatório e clique em "Gerar Relatório".');
    }

    initialize();
});