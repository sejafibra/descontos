// Configuração de cidades e bairros
const CIDADES_E_BAIRROS = {
    "Caraguá": ["Centro", "Caputera", "Olaria", "Sumaré", "Massaguaçú"],
    "Ubatuba": ["Centro", "Perequê-Açú", "Itaguá", "Ipiranguinha"],
    };

// Ativa o autocomplete de bairros quando seleciona cidade
document.getElementById('city').addEventListener('change', function() {
    const bairroSelect = document.getElementById('neighborhood');
    bairroSelect.innerHTML = '<option value="">Selecione um bairro</option>';
    bairroSelect.disabled = !this.value;
    
    if (this.value && CIDADES_E_BAIRROS[this.value]) {
        CIDADES_E_BAIRROS[this.value].forEach(bairro => {
            const option = document.createElement('option');
            option.value = bairro;
            option.textContent = bairro;
            bairroSelect.appendChild(option);
        });
    }
});

// Função para formatar data para o Firebase
function formatFirebaseDate(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString);
    return firebase.firestore.Timestamp.fromDate(date);
}

// Submit do formulário corrigido
document.getElementById('maintenanceForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const btn = this.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Processando...';
    btn.disabled = true;

    try {
        // Coleta os dados do formulário
        const formData = {
            city: this.city.value,
            neighborhood: this.neighborhood.value,
            problemType: this.problemType.value,
            responsible: this.responsible.value,
            startDate: formatFirebaseDate(this.startDate.value),
            endDate: formatFirebaseDate(this.endDate.value),
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: auth.currentUser.email,
            status: this.endDate.value ? 'Concluído' : 'Pendente'
        };

        // Calcula a duração se tiver data final
        if (this.endDate.value) {
            const start = new Date(this.startDate.value);
            const end = new Date(this.endDate.value);
            formData.duration = Math.round((end - start) / (1000 * 60)); // em minutos
        }

        // Verifica se é edição ou novo registro
        if (this.docId.value) {
            await db.collection('maintenances').doc(this.docId.value).update(formData);
            alert('Manutenção atualizada com sucesso!');
        } else {
            await db.collection('maintenances').add(formData);
            alert('Manutenção registrada com sucesso!');
        }

        // Limpa o formulário e recarrega a lista
        this.reset();
        this.docId.value = '';
        loadMaintenances();
        
    } catch (error) {
        console.error("Erro ao salvar manutenção:", error);
        alert('Erro ao salvar: ' + error.message);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
});

// Carrega as manutenções com opção de edição
async function loadMaintenances() {
    try {
        const snapshot = await db.collection('maintenances')
            .orderBy('startDate', 'desc')
            .limit(20)
            .get();

        const maintenanceList = document.getElementById('maintenanceList');
        maintenanceList.innerHTML = '';

        snapshot.forEach(doc => {
            const data = doc.data();
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${data.neighborhood}</td>
                <td>${data.problemType}</td>
                <td>${data.startDate.toDate().toLocaleString('pt-BR')}</td>
                <td>${data.endDate ? data.endDate.toDate().toLocaleString('pt-BR') : '-'}</td>
                <td>${data.duration ? `${Math.floor(data.duration/60)}h ${data.duration%60}m` : 'Em andamento'}</td>
                <td><button class="btn btn-sm btn-outline-primary edit-btn" data-id="${doc.id}">Editar</button></td>
            `;
            
            maintenanceList.appendChild(row);
        });

        // Configura os botões de edição
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const docId = this.dataset.id;
                const doc = await db.collection('maintenances').doc(docId).get();
                const data = doc.data();

                // Preenche o formulário
                document.getElementById('city').value = data.city;
                document.getElementById('neighborhood').innerHTML = `<option value="${data.neighborhood}">${data.neighborhood}</option>`;
                document.getElementById('problemType').value = data.problemType;
                document.getElementById('responsible').value = data.responsible;
                document.getElementById('startDate').value = data.startDate.toDate().toISOString().slice(0, 16);
                document.getElementById('endDate').value = data.endDate ? data.endDate.toDate().toISOString().slice(0, 16) : '';
                document.maintenanceForm.docId.value = docId;
                document.querySelector('#maintenanceForm button[type="submit"]').textContent = 'Atualizar';
            });
        });

    } catch (error) {
        console.error("Erro ao carregar manutenções:", error);
        document.getElementById('maintenanceList').innerHTML = 
            '<tr><td colspan="6" class="text-center text-danger">Erro ao carregar dados</td></tr>';
    }
}

// Carrega as manutenções quando a página é aberta
if (document.getElementById('maintenanceList')) {
    document.addEventListener('DOMContentLoaded', loadMaintenances);
}
