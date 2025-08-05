// Configuração do Firebase
const auth = firebase.auth();
const db = firebase.firestore();

// Dados de cidades e bairros (nome da constante corrigido para tudo minúsculo)
const cidades_e_bairros = {
    "Caraguá": ["Centro", "Caputera", "Olaria", "Sumaré", "Massaguaçú"],
    "Ubatuba": ["Centro", "Perequê-Açú", "Itaguá", "Ipiranguinha"]
};

// Inicialização do formulário
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM carregado - Iniciando configuração...");
    
    try {
        const citySelect = document.getElementById('city');
        const neighborhoodSelect = document.getElementById('neighborhood');

        if (!citySelect || !neighborhoodSelect) {
            throw new Error("Elementos do formulário não encontrados!");
        }

        // Limpa e popula as cidades
        citySelect.innerHTML = '';
        let option = document.createElement('option');
        option.value = '';
        option.textContent = 'Selecione uma cidade';
        citySelect.appendChild(option);

        Object.keys(cidades_e_bairros).forEach(function(cidade) {
            let option = document.createElement('option');
            option.value = cidade;
            option.textContent = cidade;
            citySelect.appendChild(option);
        });

        // Configura autocomplete de bairros
        citySelect.addEventListener('change', function() {
            console.log("Cidade alterada para:", this.value);
            
            neighborhoodSelect.innerHTML = '';
            let defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Selecione um bairro';
            neighborhoodSelect.appendChild(defaultOption);

            if (this.value && cidades_e_bairros[this.value]) {
                console.log("Carregando bairros para:", this.value);
                neighborhoodSelect.disabled = false;
                
                cidades_e_bairros[this.value].forEach(function(bairro) {
                    let option = document.createElement('option');
                    option.value = bairro;
                    option.textContent = bairro;
                    neighborhoodSelect.appendChild(option);
                });
            } else {
                console.log("Nenhuma cidade válida selecionada");
                neighborhoodSelect.disabled = true;
            }
        });

        // Carrega manutenções ao abrir a página
        loadMaintenances();
        
    } catch (error) {
        console.error("Erro na inicialização:", error);
        alert("Erro ao carregar o formulário: " + error.message);
    }
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
