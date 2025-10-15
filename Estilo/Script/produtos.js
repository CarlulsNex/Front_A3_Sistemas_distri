document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURAÇÕES E SELETORES GLOBAIS ---
    const API_BASE_URL = 'http://127.0.0.1:5000/api';

    // Modais
    const modalAdicionar = document.getElementById('adicionar_produto');
    const modalEditar = document.getElementById('editar_produto');
    const modalMover = document.getElementById('mover_produto');
    const modalAlterarStatus = document.getElementById('alterar_Status');

    // Formulários
    const formAdicionar = document.getElementById('Form-adiciona-produto');
    const formEditar = document.getElementById('Form-editar-produto');
    const formMover = document.getElementById('Form-mover-produto');
    const formAlterarStatus = document.getElementById('Form-alterar_Status');

    // Botões
    const btnAdd = document.getElementById("btn-add-produto");
    const btnEditar = document.getElementById("btn-editar-produto");
    const btnMovimentar = document.getElementById("btn-movimentar-produto");
    const btnAlterarStatus = document.getElementById("btn-alterar-status");
    const btnsCancelar = document.querySelectorAll('.btn-cancelar');

    // Tabela e Filtros
    const corpoTabela = document.getElementById('corpo-tabela-produtos');
    const inputsFiltro = document.querySelectorAll('.pesquisa input');
    let selectedRow = null;

    // --- FUNÇÕES DA API ---

    /**
     * Busca todos os produtos da API e popula a tabela.
     */
    async function carregarProdutos() {
        try {
            const response = await fetch(`${API_BASE_URL}/produtos`);
            if (!response.ok) throw new Error('Erro ao buscar produtos da API.');

            const produtos = await response.json();
            corpoTabela.innerHTML = '';
            const noResultsMessage = document.getElementById('no-results-message');
            if (noResultsMessage) noResultsMessage.style.display = 'none';


            if (produtos.length === 0) {
                if (noResultsMessage) noResultsMessage.style.display = 'block';
                return;
            }

            produtos.forEach(p => {
                const tr = document.createElement('tr');
                tr.dataset.id = p.produtoid;
                // Adiciona todos os dados como data attributes para fácil acesso
                Object.keys(p).forEach(key => {
                    tr.dataset[key] = p[key];
                });

                const alertaEstoque = p.quantidade < p.quantidade_minima ? `<p id="alerta_hidden" style="display: block; color: red;">Estoque baixo!</p>` : '';

                tr.innerHTML = `
                    <td><p>${p.produtoid}</p></td>
                    <td>
                        <p>${p.nome}</p>
                        <p><i>Estoque disponível:</i> <b><i>${p.quantidade}</i></b></p>
                        ${alertaEstoque}
                    </td>
                    <td><p>${p.nome_categoria || 'N/A'}</p></td>
                    <td><p>${p.status}</p></td>
                    <td><p>${p.preco}</P></td>
                    <td class="hidden-td">${p.quantidade_minima}</td>
                `;
                corpoTabela.appendChild(tr);
            });
        } catch (error) {
            console.error('Falha ao carregar produtos:', error);
            mostrarMensagem('Falha ao carregar dados dos produtos.', 'erro');
        }
    }

    async function carregarOpcoesDeCategoria() {
        try {
            const response = await fetch(`${API_BASE_URL}/categorias`);
            if (!response.ok) throw new Error('Erro ao buscar categorias.');

            const categorias = await response.json();
            const selectsDeCategoria = document.querySelectorAll('select[name="categoria"], select[name="editar-categoria"]');

            selectsDeCategoria.forEach(select => {
                select.innerHTML = ''; // Limpa opções antigas

                // Adiciona uma opção padrão/placeholder
                const placeholder = new Option('Selecione uma categoria...', '');
                placeholder.disabled = true;
                placeholder.selected = true;
                select.add(placeholder);

                categorias.forEach(cat => {
                    if (cat.status.toUpperCase() === 'ATIVO') {
                        const option = new Option(cat.nome, cat.nome); // O valor enviado será o nome da categoria
                        select.add(option);
                    }
                });
            });
        } catch (error) {
            console.error('Falha ao carregar opções de categoria:', error);
            document.querySelectorAll('select[name="categoria"], select[name="editar-categoria"]').forEach(select => {
                select.innerHTML = '<option value="">Erro ao carregar categorias</option>';
            });
        }
    }

    // --- LÓGICA DOS MODAIS E FORMULÁRIOS ---

    const abrirModal = (modal) => modal.style.display = 'flex';
    const fecharModais = () => {
        document.querySelectorAll('.modal').forEach(modal => modal.style.display = 'none');
    };

    // Abrir Modais
    btnAdd.onclick = () => abrirModal(modalAdicionar);

    btnEditar.onclick = () => {
        if (!selectedRow) return mostrarMensagem('Nenhum produto selecionado.', 'alerta');

        const data = selectedRow.dataset;
        document.getElementById('editar-produtoid').value = data.produtoid;
        document.getElementById('editar-nome').value = data.nome;
        document.getElementById('editar-status').value = data.status;
        document.getElementById('editar-categoria').value = data.categoria_id;
        document.getElementById('editar-preco').value = data.preco;
        document.getElementById('editar-qnt_min').value = data.quantidade_minima;

        abrirModal(modalEditar);
    };

    btnMovimentar.onclick = () => {
        if (!selectedRow) return mostrarMensagem('Nenhum produto selecionado.', 'alerta');
        if (selectedRow.dataset.status.toUpperCase() === 'INATIVO') {
            return mostrarMensagem('Produto inativo não pode ser movimentado.', 'alerta');
        }
        document.getElementById('mover-produtoid').value = selectedRow.dataset.produtoid;
        abrirModal(modalMover);
    };

    btnAlterarStatus.onclick = () => {
        if (!selectedRow) return mostrarMensagem('Nenhum produto selecionado.', 'alerta');

        const data = selectedRow.dataset;
        const novoStatus = data.status.toUpperCase() === 'ATIVO' ? 'Inativo' : 'Ativo';

        document.getElementById('alterar_Status_selecionado').value = data.produtoid;
        document.getElementById('nomeProduto').textContent = data.nome;
        document.getElementById('statusNovo').textContent = novoStatus;

        abrirModal(modalAlterarStatus);
    };

    // Fechar Modais
    btnsCancelar.forEach(btn => btn.onclick = (e) => {
        e.preventDefault();
        fecharModais();
    });

    // Lógica de Submissão de Formulários
    async function handleFormSubmit(form, url, successMessage, getDados) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitter = e.submitter;
            if (submitter && submitter.classList.contains('btn-cancelar')) {
                fecharModais();
                return;
            }
            
            const dados = getDados(form);

            try {
                const response = await fetch(`${API_BASE_URL}${url}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dados)
                });

                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.Erro || 'Ocorreu um erro.');
                }
                
                fecharModais();
                mostrarMensagem(result.Mensagem || successMessage, 'ok');
                carregarProdutos();
                form.reset();

            } catch (error) {
                mostrarMensagem(error.message, 'erro');
            }
        });
    }

    // --- FUNÇÕES AUXILIARES E EVENTOS ---

    // Selecionar linha da tabela
    corpoTabela.addEventListener('click', (e) => {
        const targetRow = e.target.closest('tr');
        if (!targetRow || !targetRow.dataset.id) return;

        if (selectedRow) selectedRow.classList.remove('selected');
        selectedRow = targetRow;
        selectedRow.classList.add('selected');
    });

    // Função para mostrar mensagens de feedback
    function mostrarMensagem(mensagem, tipo = 'alerta') {
        const container = document.getElementById('mensagem_resultado');
        const conteudo = document.getElementById('mensagem_resultado_conteudo');
        
        let tipoClasse = '';
        switch(tipo) {
            case 'ok':
                tipoClasse = 'resultado_ok';
                break;
            case 'erro':
                tipoClasse = 'resultado_erro';
                break;
            case 'alerta':
                tipoClasse = 'campos_Npreenchidos';
                break;
        }

        conteudo.innerHTML = `<div class="mensagem" id="${tipoClasse}"><p>${mensagem}</p></div>`;
        container.style.display = 'flex';

        setTimeout(() => {
            container.style.display = 'none';
        }, 3000);
    }

    // Lógica de filtragem
    function filtrarTabela() {
        const filtros = Array.from(inputsFiltro).map(input => input.value.toLowerCase());
        let algumaLinhaVisivel = false;

        corpoTabela.querySelectorAll('tr').forEach(linha => {
            const id = linha.cells[0].textContent.toLowerCase();
            const nome = linha.cells[1].textContent.toLowerCase();
            const categoria = linha.cells[2].textContent.toLowerCase();
            const status = linha.cells[3].textContent.toLowerCase();

            const corresponde =
                id.includes(filtros[0]) &&
                nome.includes(filtros[1]) &&
                categoria.includes(filtros[2]) &&
                status.includes(filtros[3]);

            linha.style.display = corresponde ? '' : 'none';
            if (corresponde) algumaLinhaVisivel = true;
        });

        const noResultsMessage = document.getElementById('no-results-message');
        if (noResultsMessage) noResultsMessage.style.display = algumaLinhaVisivel ? 'none' : 'block';
    }

    inputsFiltro.forEach(input => input.addEventListener('input', filtrarTabela));

    // --- INICIALIZAÇÃO ---
    handleFormSubmit(formAdicionar, '/produto/criar', 'Produto adicionado com sucesso!', (form) => ({
        nome: form.nome.value,
        status: form.status.value,
        categoria: form.categoria.value,
        preco: form.preco.value,
        qnt_min: form.qnt_min.value
    }));

    handleFormSubmit(formEditar, '/produto/editar', 'Produto editado com sucesso!', (form) => ({
        produtoid: form['editar-produtoid'].value,
        nome: form['editar-nome'].value,
        status: form['editar-status'].value,
        categoria: form['editar-categoria'].value,
        preco: form['editar-preco'].value,
        qnt_min: form['editar-qnt_min'].value
    }));

    handleFormSubmit(formMover, '/produto/mover', 'Estoque atualizado com sucesso!', (form) => ({
       produtoid: form['mover-produtoid'].value,
       tipo: form['tipo-mover'].value,
       quantidade: form['quantidade-mover'].value
    }));
    
    handleFormSubmit(formAlterarStatus, '/produto/alterar_status', 'Status do produto alterado com sucesso!', (form) => ({
        produtoid: form['alterar_Status_selecionado'].value
    }));

    carregarOpcoesDeCategoria();
    carregarProdutos();

    
});


