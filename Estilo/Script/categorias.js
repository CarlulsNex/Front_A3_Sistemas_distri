document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURAÇÕES GLOBAIS ---
    
    // ATENÇÃO: Atualize este link sempre que reiniciar o Ngrok
    const API_BASE_URL = 'https://beb44801ba22.ngrok-free.app/api';

    // Headers padrão para o Ngrok e JSON
    const headersPadrao = {
        "ngrok-skip-browser-warning": "true",
        "Content-Type": "application/json"
    };

    // Modais
    const modalAdicionar = document.getElementById('adicionar_categoria');
    const modalEditar = document.getElementById('editar_categoria');
    const modalAlterarStatus = document.getElementById('alterar_Status');

    // Formulários
    const formAdicionar = document.getElementById('Form-adiciona-categoria');
    const formEditar = document.getElementById('Form-editar-categoria');
    const formAlterarStatus = document.getElementById('Form-alterar_Status');

    // Botões
    const btnAdd = document.getElementById("add_categoria");
    const btnEditar = document.getElementById("editar_categoriaB");
    const btnInativar = document.getElementById("inativar_categoria");
    const btnsCancelar = document.querySelectorAll('.btn-cancelar');

    // Flags
    let isSubmittingAdicionar = false;
    let isSubmittingEditar = false;
    let isSubmittingAlterarStatus = false;

    const corpoTabela = document.getElementById('corpo-tabela-categorias');
    let selectedRow = null;

    // --- FUNÇÕES DA API ---

    async function carregarCategorias() {
        try {
            // Adicionado headers aqui
            const response = await fetch(`${API_BASE_URL}/categorias`, {
                method: 'GET',
                headers: headersPadrao
            });

            if (!response.ok) throw new Error('Erro ao buscar dados da API.');

            const categorias = await response.json();

            corpoTabela.innerHTML = '';
            document.querySelector('#no-results-message').style.display = 'none';

            if (categorias.length === 0) {
                document.querySelector('#no-results-message').style.display = 'block';
                return;
            }

            categorias.forEach(cat => {
                const tr = document.createElement('tr');
                tr.dataset.id = cat.categoriaid;
                tr.innerHTML = `
                    <td><p>${cat.categoriaid}</p></td>
                    <td><p>${cat.nome}</p></td>
                    <td><p>${cat.status}</p></td>
                    <td><p>${cat.embalagem || ''}</p></td>
                    <td><p>${cat.tamanho || ''}</p></td>
                `;
                corpoTabela.appendChild(tr);
            });
        } catch (error) {
            console.error('Falha ao carregar categorias:', error);
            mostrarMensagem('Falha ao carregar dados. Verifique o console.', 'erro');
        }
    }

    // --- LÓGICA DOS MODAIS ---

    const abrirModal = (modal) => modal.classList.add('ativo');
    const fecharModais = () => {
        document.querySelectorAll('.modal.ativo').forEach(modal => modal.classList.remove('ativo'));
    };

    btnAdd.onclick = () => abrirModal(modalAdicionar);

    btnEditar.onclick = () => {
        if (!selectedRow) {
            mostrarMensagem('Nenhuma categoria selecionada.', 'alerta');
            return;
        }
        document.getElementById('categoriaid').value = selectedRow.dataset.id;
        document.getElementById('editar-nome').value = selectedRow.cells[1].textContent;
        document.getElementById('editar-status').value = selectedRow.cells[2].textContent.trim().toUpperCase();
        document.getElementById('editar-tamanho').value = selectedRow.cells[4].textContent.trim().toUpperCase();
        document.getElementById('editar-embalagem').value = selectedRow.cells[3].textContent.trim().toUpperCase();
        abrirModal(modalEditar);
    };

    btnInativar.onclick = () => {
        if (!selectedRow) {
            mostrarMensagem('Nenhuma categoria selecionada.', 'alerta');
            return;
        }
        const statusAtual = selectedRow.cells[2].textContent.trim().toUpperCase();
        const status = statusAtual === 'ATIVO' ? 'INATIVO' : 'ATIVO';

        document.getElementById('categoriaid').value = selectedRow.dataset.id;
        document.getElementById('nomeCategoria').textContent = selectedRow.cells[1].textContent;
        document.getElementById('statusNovo').textContent = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
        document.getElementById('alterar_status_novo_status').value = status;

        abrirModal(modalAlterarStatus);
    }

    btnsCancelar.forEach(btn => btn.onclick = fecharModais);
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) fecharModais();
        });
    });
    
    // --- SUBMITS (POST) ---

    formAdicionar.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (isSubmittingAdicionar) return;
        isSubmittingAdicionar = true;
        
        const submitBtn = formAdicionar.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Processando...';
        
        const formData = new FormData(formAdicionar);
        formData.append('tamanho', document.getElementById('Modal_editar_tamanho').value);
        formData.append('embalagem', document.getElementById('Modal_editar_embalagem').value);
        const dados = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(`${API_BASE_URL}/categoria/criar`, {
                method: 'POST',
                headers: headersPadrao, // Atualizado
                body: JSON.stringify(dados)
            });

            if (!response.ok) {
                const erroData = await response.json();
                throw new Error(erroData.mensagem || 'Erro ao criar categoria.');
            }

            fecharModais();
            mostrarMensagem('Categoria adicionada com sucesso!', 'ok');
            carregarCategorias();
            formAdicionar.reset();
        } catch (error) {
            mostrarMensagem(error.message, 'erro');
        } finally {
            isSubmittingAdicionar = false;
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });

    formEditar.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (isSubmittingEditar) return;
        isSubmittingEditar = true;
        
        const submitBtn = formEditar.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Processando...';
        
        const dados = {
            nome: document.getElementById('editar-nome').value,
            editStatus: document.getElementById('editar-status').value,
            editCategoriaId: document.getElementById('categoriaid').value,
            tamanho: document.getElementById('editar-tamanho').value,
            embalagem: document.getElementById('editar-embalagem').value,
        }

        try {
            const response = await fetch(`${API_BASE_URL}/categoria/editar`, {
                method: 'POST',
                headers: headersPadrao, // Atualizado
                body: JSON.stringify(dados)
            });

            if (!response.ok) {
                 const erroData = await response.json();
                throw new Error(erroData.mensagem || 'Erro ao editar categoria.');
            }
            fecharModais();
            mostrarMensagem('Categoria atualizada com sucesso!', 'ok');
            carregarCategorias();
        } catch (error) {
            mostrarMensagem(error.message, 'erro');
        } finally {
            isSubmittingEditar = false;
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });

    formAlterarStatus.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (isSubmittingAlterarStatus) return;
        isSubmittingAlterarStatus = true;
        
        const submitBtn = formAlterarStatus.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Processando...';
        
        const dados = { 
            categoriaid: document.getElementById('categoriaid').value,
            status: document.getElementById('alterar_status_novo_status').value
        };

        try {
            const response = await fetch(`${API_BASE_URL}/categoria/alt_status`, {
                method: 'POST',
                headers: headersPadrao, // Atualizado
                body: JSON.stringify(dados)
            });

            if (!response.ok) {
                const erroData = await response.json();
                throw new Error(erroData.erro || 'Erro ao alterar status.');
            }
            const successoData = await response.json();
            fecharModais();
            mostrarMensagem(successoData.Mensagem, 'ok');
            carregarCategorias();
        } catch (error) {
             mostrarMensagem(error.message, 'erro');
        } finally {
            isSubmittingAlterarStatus = false;
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });

    // --- SELEÇÃO E FILTROS ---

    corpoTabela.addEventListener('click', (e) => {
        const targetRow = e.target.closest('tr');
        if (!targetRow || !targetRow.dataset.id) return;
        if (selectedRow) selectedRow.classList.remove('selected');
        selectedRow = targetRow;
        selectedRow.classList.add('selected');
    });

    function mostrarMensagem(mensagem, tipo = 'info') {
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

    const inputsFiltro = [
        document.querySelector('#pesquisaCategoriaID'),
        document.querySelector('#pesquisaNome'),
        document.querySelector('#pesquisaStatus'),
        document.querySelector('#pesquisaTamanho'),
        document.querySelector('#pesquisaEmbalagem')
    ];

    function filtrarTabela() {
        const filtros = inputsFiltro.map(input => input.value.toLowerCase());
        const noResultsMessage = document.querySelector('#no-results-message');
        let algumaLinhaVisivel = false;

        corpoTabela.querySelectorAll('tr').forEach(linha => {
            if (linha.cells.length < 5) return;
            
            const valores = [
                linha.cells[0].textContent.toLowerCase(),
                linha.cells[1].textContent.toLowerCase(),
                linha.cells[2].textContent.toLowerCase(),
                linha.cells[4].textContent.toLowerCase(),
                linha.cells[3].textContent.toLowerCase()
            ];

            const corresponde = valores.every((val, i) => val.includes(filtros[i]));
            linha.style.display = corresponde ? '' : 'none';
            if (corresponde) algumaLinhaVisivel = true;
        });

        noResultsMessage.style.display = algumaLinhaVisivel ? 'none' : 'block';
    }

    inputsFiltro.forEach(input => input.addEventListener('input', filtrarTabela));

    carregarCategorias();
});