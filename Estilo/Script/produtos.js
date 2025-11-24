document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURAÇÕES GLOBAIS ---
    const API_BASE_URL = 'https://beb44801ba22.ngrok-free.app/api';

    const headersPadrao = {
        "ngrok-skip-browser-warning": "true",
        "Content-Type": "application/json"
    };

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

    const corpoTabela = document.getElementById('corpo-tabela-produtos');
    const inputsFiltro = document.querySelectorAll('.pesquisa input');
    let selectedRow = null;

    // --- FUNÇÕES DA API ---

    async function carregarProdutos() {
        try {
            // Adicionado headers
            const response = await fetch(`${API_BASE_URL}/produtos`, {
                method: 'GET',
                headers: headersPadrao
            });

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
                tr.dataset.id = p.produtoId;
                
                const nomeCategoria = p.categoria && p.categoria.nome ? p.categoria.nome : 'N/A';
                const quantidadeMinima = p.quantidadeMinima || 0;

                Object.keys(p).forEach(key => {
                    tr.dataset[key.toLowerCase()] = p[key]; 
                });

                tr.dataset.produtoId = p.produtoId;
                tr.dataset.quantidademinima = quantidadeMinima;
                const alertaEstoque = p.quantidade < quantidadeMinima ? `<p id="alerta_hidden" style="display: block; color: red;">Estoque baixo!</p>` : '';

                tr.innerHTML = `
                <td><p>${p.produtoId || 'N/A'}</p></td>
                <td>
                    <p>${p.nome || 'Produto Sem Nome'}</p>
                    <p><i>Estoque disponível:</i> <b><i>${p.quantidade || 0}</i></b></p>
                    ${alertaEstoque}
                </td>
                <td><p>${nomeCategoria}</p></td>
                <td><p>${p.status || 'N/A'}</p></td>
                <td><p>${p.preco || '0.00'}</P></td>
                <td class="hidden-td">${quantidadeMinima}</td>
            `;
                corpoTabela.appendChild(tr);
            });
        } catch (error) {
            console.error('Falha ao carregar produtos:', error);
            mostrarMensagemPopUp('Falha ao carregar dados dos produtos.', 'erro');
        }
    }

    async function carregarOpcoesDeCategoria() {
        try {
            // Adicionado headers
            const response = await fetch(`${API_BASE_URL}/categorias`, {
                method: 'GET',
                headers: headersPadrao
            });

            if (!response.ok) throw new Error('Erro ao buscar categorias.');

            const categorias = await response.json();
            const selectsDeCategoria = document.querySelectorAll('select[name="categoria"], select[name="editar-categoria"]');

            selectsDeCategoria.forEach(select => {
                select.innerHTML = '';
                const placeholder = new Option('Selecione uma categoria...', '');
                placeholder.disabled = true;
                placeholder.selected = true;
                select.add(placeholder);

                categorias.forEach(cat => {
                    if (cat.status.toUpperCase() === 'ATIVO') {
                        const option = new Option(cat.nome, cat.categoriaid);
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

    // --- MODAIS ---

    const abrirModal = (modal) => modal.style.display = 'flex';
    const fecharModais = () => {
        document.querySelectorAll('.modal').forEach(modal => modal.style.display = 'none');
    };

    btnAdd.onclick = () => abrirModal(modalAdicionar);

    btnEditar.onclick = () => {
        if (!selectedRow) return mostrarMensagem('Nenhum produto selecionado.', 'alerta');
        const data = selectedRow.dataset;
        document.getElementById('editar-produtoId').value = data.produtoId;
        document.getElementById('editar-nome').value = data.nome;
        document.getElementById('editar-status').value = data.status;
        document.getElementById('editar-categoria').value = data.categoriaId;
        document.getElementById('editar-preco').value = data.preco;
        document.getElementById('editar-quantidadeMinima').value = data.quantidadeMinima;
        abrirModal(modalEditar);
    };

    btnMovimentar.onclick = () => {
        if (!selectedRow) return mostrarMensagem('Nenhum produto selecionado.', 'alerta');
        const statusProduto = selectedRow.dataset.status ? selectedRow.dataset.status.toUpperCase() : '';
        if (statusProduto === 'INATIVO') return mostrarMensagem('Produto inativo não pode ser movimentado.', 'alerta');

        const inputId = document.getElementById('mover-produtoId');
        if (inputId) {
            inputId.value = selectedRow.dataset.produtoId;
            abrirModal(modalMover);
        }
    };

    btnAlterarStatus.onclick = () => {
        if (!selectedRow) return mostrarMensagem('Nenhum produto selecionado.', 'alerta');
        const data = selectedRow.dataset;
        const novoStatus = data.status.toUpperCase() === 'ATIVO' ? 'Inativo' : 'Ativo';
        document.getElementById('alterar_Status_selecionado').value = data.produtoId;
        document.getElementById('nomeProduto').textContent = data.nome;
        document.getElementById('statusNovo').textContent = novoStatus;
        abrirModal(modalAlterarStatus);
    };

    btnsCancelar.forEach(btn => btn.onclick = (e) => {
        e.preventDefault();
        fecharModais();
    });

    // --- SUBMISSÃO GENÉRICA ---

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
                // Adicionado headers
                const response = await fetch(`${API_BASE_URL}${url}`, {
                    method: 'POST',
                    headers: headersPadrao,
                    body: JSON.stringify(dados)
                });

                const result = await response.json();
                if (!response.ok) throw new Error(result.Erro || 'Ocorreu um erro.');

                fecharModais();
                mostrarMensagem(result.Mensagem || successMessage, 'ok');
                carregarProdutos();
                form.reset();

            } catch (error) {
                mostrarMensagem(error.message, 'erro');
            }
        });
    }

    // --- AUXILIARES ---

    corpoTabela.addEventListener('click', (e) => {
        const targetRow = e.target.closest('tr');
        if (!targetRow || !targetRow.dataset.id) return;
        if (selectedRow) selectedRow.classList.remove('selected');
        selectedRow = targetRow;
        selectedRow.classList.add('selected');
    });

    function mostrarMensagem(mensagem, tipo = 'alerta') {
        const container = document.getElementById('mensagem_resultado');
        const conteudo = document.getElementById('mensagem_resultado_conteudo');
        let tipoClasse = tipo === 'ok' ? 'resultado_ok' : (tipo === 'erro' ? 'resultado_erro' : 'campos_Npreenchidos');

        conteudo.innerHTML = `<div class="mensagem" id="${tipoClasse}"><p>${mensagem}</p></div>`;
        container.style.display = 'flex';
        setTimeout(() => container.style.display = 'none', 3000);
    }
    
    function mostrarMensagemPopUp(mensagem, tipo = 'info') {
        const containerMensagem = document.createElement('div');
        containerMensagem.className = `mensagem-popup ${tipo}`;
        containerMensagem.textContent = mensagem;
        document.body.appendChild(containerMensagem);
        setTimeout(() => containerMensagem.classList.add('visivel'), 10);
        setTimeout(() => {
            containerMensagem.classList.remove('visivel');
            setTimeout(() => containerMensagem.remove(), 500);
        }, 3000);
    }

    function filtrarTabela() {
        const filtros = Array.from(inputsFiltro).map(input => input.value.toLowerCase());
        let algumaLinhaVisivel = false;

        corpoTabela.querySelectorAll('tr').forEach(linha => {
            const corresponde = Array.from(linha.cells).slice(0, 4).every((cell, i) => 
                cell.textContent.toLowerCase().includes(filtros[i])
            );
            linha.style.display = corresponde ? '' : 'none';
            if (corresponde) algumaLinhaVisivel = true;
        });

        const noResultsMessage = document.getElementById('no-results-message');
        if (noResultsMessage) noResultsMessage.style.display = algumaLinhaVisivel ? 'none' : 'block';
    }

    inputsFiltro.forEach(input => input.addEventListener('input', filtrarTabela));

    // Configuração dos Forms
    handleFormSubmit(formAdicionar, '/produto/criar', 'Produto adicionado com sucesso!', (form) => ({
        nome: form.nome.value,
        status: form.status.value.toLowerCase(),
        categoriaId: parseInt(form.categoria.value, 10),
        preco: parseFloat(form.preco.value),
        quantidadeMinima: parseInt(form.quantidadeMinima.value, 10)
    }));

    handleFormSubmit(formEditar, '/produto/editar', 'Produto editado com sucesso!', (form) => ({
        produtoId: form['editar-produtoId'].value,
        nome: form['editar-nome'].value,
        status: form['editar-status'].value,
        categoriaId: form['editar-categoria'].value,
        preco: form['editar-preco'].value,
        quantidadeMinima: form['editar-quantidadeMinima'].value
    }));

    handleFormSubmit(formMover, '/produtos/movimentar-estoque', 'Estoque atualizado com sucesso!', (form) => ({
        produtoId: form['mover-produtoId'].value,
        tipo: form['tipo-mover'].value,
        quantidade: form['quantidade-mover'].value
    }));

    handleFormSubmit(formAlterarStatus, '/produto/alterar_status', 'Status alterado com sucesso!', (form) => ({
        produtoId: form['alterar_Status_selecionado'].value
    }));

    carregarOpcoesDeCategoria();
    carregarProdutos();
});