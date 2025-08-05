// Configuração do Firebase
const auth = firebase.auth();
const db = firebase.firestore();

// Dados atualizados de cidades e bairros
const CIDADES_E_BAIRROS = {
    "Caraguá": ["Centro", "Caputera", "Olaria", "Sumaré", "Massaguaçú"],
    "Ubatuba": ["Centro", "Perequê-Açú", "Itaguá", "Ipiranguinha"]
};

// Inicialização do formulário
document.addEventListener('DOMContentLoaded', () => {
    const citySelect = document.getElementById('city');
    const neighborhoodSelect = document.getElementById('neighborhood');

    // Limpa e popula as cidades
    citySelect.innerHTML = '<option value="">Selecione uma cidade</option>';
    Object.keys(CIDADES_E_BAIRROS).forEach(cidade => {
        const option = document.createElement('option');
        option.value = cidade;
        option.textContent = cidade;
        citySelect.appendChild(option);
    });

    // Configura autocomplete de bairros
    citySelect.addEventListener('change', function() {
        neighborhoodSelect.innerHTML = '<option value="">Selecione um bairro</option>';
        
        if (this.value && CIDADES_E_BAIRROS[this.value]) {
            neighborhoodSelect.disabled = false;
            CIDADES_E_BAIRROS[this.value].forEach(bairro => {
                const option = document.createElement('option');
                option.value = bairro;
                option.textContent = bairro;
                neighborhoodSelect.appendChild(option);
            });
        } else {
            neighborhoodSelect.disabled = true;
        }
    });

    // Carrega manutenções ao abrir a página
    loadMaintenances();
});
// Função para cadastrar/editar manutenções
document.getElementById('maintenanceForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const btn = this.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Processando...';

    try {
        const docData = {
            city: this.city.value,
            neighborhood: this.neighborhood.value,
            problemType: this.problemType.value,
            responsible: this.responsible.value,
            startDate: firebase.firestore.Timestamp.fromDate(new Date(this.startDate.value)),
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: auth.currentUser.email,
            status: 'Pendente'
        };

        if (this.endDate.value) {
            docData.endDate = firebase.firestore.Timestamp.fromDate(new Date(this.endDate.value));
            docData.duration = Math.round((new Date(this.endDate.value) - new Date(this.startDate.value)) / (1000 * 60));
            docData.status = 'Concluído';
        }

        if (this.docId.value) {
            await db.collection('maintenances').doc(this.docId.value).update(docData);
            alert('Atualizado com sucesso!');
        } else {
            await db.collection('maintenances').add(docData);
            alert('Cadastrado com sucesso!');
        }

        this.reset();
        this.docId.value = '';
        btn.textContent = 'Registrar';
        loadMaintenances();
        
    } catch (error) {
        console.error("Erro:", error);
        alert('Erro: ' + error.message);
    } finally {
        btn.disabled = false;
    }
});

// Carrega a lista de manutenções
async function loadMaintenances() {
    try {
        const querySnapshot = await db.collection('maintenances')
            .orderBy('startDate', 'desc')
            .limit(20)
            .get();

        const tbody = document.getElementById('maintenanceList');
        tbody.innerHTML = '';

        querySnapshot.forEach(doc => {
            const data = doc.data();
            const startDate = data.startDate.toDate();
            const endDate = data.endDate?.toDate();

            tbody.innerHTML += `
                <tr>
                    <td>${data.neighborhood}</td>
                    <td>${data.problemType}</td>
                    <td>${startDate.toLocaleString('pt-BR')}</td>
                    <td>${endDate ? endDate.toLocaleString('pt-BR') : '-'}</td>
                    <td>${data.duration ? `${Math.floor(data.duration/60)}h ${data.duration%60}m` : 'Em andamento'}</td>
                    <td><button class="btn btn-sm btn-outline-primary edit-btn" data-id="${doc.id}">Editar</button></td>
                </tr>
            `;
        });

        // Configura botões de edição
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const doc = await db.collection('maintenances').doc(btn.dataset.id).get();
                const data = doc.data();

                document.getElementById('city').value = data.city;
                document.getElementById('neighborhood').innerHTML = `<option value="${data.neighborhood}">${data.neighborhood}</option>`;
                document.getElementById('problemType').value = data.problemType;
                document.getElementById('responsible').value = data.responsible;
                document.getElementById('startDate').value = data.startDate.toDate().toISOString().slice(0,16);
                document.getElementById('endDate').value = data.endDate?.toDate().toISOString().slice(0,16) || '';
                document.maintenanceForm.docId.value = doc.id;
                document.querySelector('#maintenanceForm button[type="submit"]').textContent = 'Atualizar';
            });
        });

    } catch (error) {
        console.error("Erro ao carregar:", error);
        document.getElementById('maintenanceList').innerHTML = `
            <tr><td colspan="6" class="text-center text-danger">Erro ao carregar dados</td></tr>
        `;
    }
}
