document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURAÇÕES E SELETORES GLOBAIS ---
    const API_BASE_URL = 'http://3.12.148.73:8080/api';

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

    // Flags para evitar múltiplas submissões
    let isSubmittingAdicionar = false;
    let isSubmittingEditar = false;
    let isSubmittingAlterarStatus = false;

    // Tabela
    const corpoTabela = document.getElementById('corpo-tabela-categorias');
    let selectedRow = null;

    // --- FUNÇÕES DA API ---

    /**
     * Busca todas as categorias da API e popula a tabela.
     */
    async function carregarCategorias() {
        try {
            const response = await fetch(`${API_BASE_URL}/categorias`);
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

    // --- LÓGICA DOS MODAIS E FORMULÁRIOS ---

    const abrirModal = (modal) => modal.classList.add('ativo');
    const fecharModais = () => {
        document.querySelectorAll('.modal.ativo').forEach(modal => modal.classList.remove('ativo'));
    };

    // Abrir modal de Adicionar
    btnAdd.onclick = () => abrirModal(modalAdicionar);

    // Abrir modal de Editar
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

    // Abrir modal de Alterar Status
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

    // Configura eventos para fechar modais
    btnsCancelar.forEach(btn => btn.onclick = fecharModais);
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                fecharModais();
            }
        });
    });
    
    // Adicionar Categoria (SUBMIT)
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
                headers: { 'Content-Type': 'application/json' },
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

    // Editar Categoria (SUBMIT)
    formEditar.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        
        if (isSubmittingEditar) return;
        isSubmittingEditar = true;
        
        
        const submitBtn = formEditar.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Processando...';
        
        const editCategoriaId = document.getElementById('categoriaid').value;
        const nome= document.getElementById('editar-nome').value;
        const status= document.getElementById('editar-status').value;
        const tamanho= document.getElementById('editar-tamanho').value;
        const embalagem= document.getElementById('editar-embalagem').value;

                    const dados = {
                nome: nome,
                editStatus: status,
                editCategoriaId: editCategoriaId,
                tamanho: tamanho,
                embalagem: embalagem,
            }

        try {
            const response = await fetch(`${API_BASE_URL}/categoria/editar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });

            
            
            if (!response.ok) {
                 const erroData = await response.json();
                throw new Error(erroData.mensagem || 'Erro ao editar categoria.');
            }
            const successoData = await response.json();
            console.log('Resposta completa do servidor:', successoData); 

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

    // Alterar Status (SUBMIT)
    formAlterarStatus.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        
        if (isSubmittingAlterarStatus) return;
        isSubmittingAlterarStatus = true;
        
       
        const submitBtn = formAlterarStatus.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Processando...';
        
        const categoriaid = document.getElementById('categoriaid').value;
        const status = document.getElementById('alterar_status_novo_status').value;

        const dados = { 
            categoriaid: categoriaid,
            status: status
            };
        
        

        try {
            const response = await fetch(`${API_BASE_URL}/categoria/alt_status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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

    // --- FUNÇÕES AUXILIARES ---

    // Selecionar linha da tabela
    corpoTabela.addEventListener('click', (e) => {
        const targetRow = e.target.closest('tr');
        if (!targetRow || !targetRow.dataset.id) return;

        if (selectedRow) {
            selectedRow.classList.remove('selected');
        }
        selectedRow = targetRow;
        selectedRow.classList.add('selected');
    });

    //Mostrar mensagem 
    function mostrarMensagem(mensagem, tipo = 'info') { // tipo pode ser 'ok', 'erro', 'alerta'
    const containerMensagem = document.createElement('div');
    containerMensagem.className = `mensagem-popup ${tipo}`;
    containerMensagem.textContent = mensagem;

    document.body.appendChild(containerMensagem);

    
    setTimeout(() => {
        containerMensagem.classList.add('visivel');
    }, 10);

   
    setTimeout(() => {
        containerMensagem.classList.remove('visivel');
        setTimeout(() => {
            containerMensagem.remove();
        }, 500);
    }, 3000);
}

    // --- FILTRAGEM ---
    const inputsFiltro = [
        document.querySelector('#pesquisaCategoriaID'),
        document.querySelector('#pesquisaNome'),
        document.querySelector('#pesquisaStatus'),
        document.querySelector('#pesquisaTamanho'),
        document.querySelector('#pesquisaEmbalagem')
    ];

    function filtrarTabela() {
        const idFiltro = inputsFiltro[0].value.toLowerCase();
        const nomeFiltro = inputsFiltro[1].value.toLowerCase();
        const statusFiltro = inputsFiltro[2].value.toLowerCase();
        const tamanhoFiltro = inputsFiltro[3].value.toLowerCase();
        const embalagemFiltro = inputsFiltro[4].value.toLowerCase();
        const noResultsMessage = document.querySelector('#no-results-message');
        
        let algumaLinhaVisivel = false;

        corpoTabela.querySelectorAll('tr').forEach(linha => {
           
            if (!linha.cells[0] || !linha.cells[1] || !linha.cells[2] || !linha.cells[3] || !linha.cells[4]) return;

            const idLinha = linha.cells[0].textContent.toLowerCase();
            const nomeLinha = linha.cells[1].textContent.toLowerCase();
            const statusLinha = linha.cells[2].textContent.toLowerCase();
            const tamanhoLinha = linha.cells[4].textContent.toLowerCase();
            const embalagemLinha = linha.cells[3].textContent.toLowerCase();

            const corresponde = 
                idLinha.includes(idFiltro) &&
                nomeLinha.includes(nomeFiltro) &&
                statusLinha.includes(statusFiltro) &&
                tamanhoLinha.includes(tamanhoFiltro) &&
                embalagemLinha.includes(embalagemFiltro);

            linha.style.display = corresponde ? '' : 'none';
            if (corresponde) algumaLinhaVisivel = true;
        });

        noResultsMessage.style.display = algumaLinhaVisivel ? 'none' : 'block';
    }

    inputsFiltro.forEach(input => input.addEventListener('input', filtrarTabela));

    // --- INICIALIZAÇÃO ---
    carregarCategorias();
});