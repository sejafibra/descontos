// Configuração segura do Firebase
if (typeof firebase === 'undefined') {
    console.error('Firebase não foi carregado!');
} else if (!firebase.apps.length) {
    const firebaseConfig = {
        apiKey: "AIzaSyC95aDwbm43uv7UPB7YDT5VjCe5USz2mZ8",
        authDomain: "descontos-4ab4b.firebaseapp.com",
        projectId: "descontos-4ab4b",
        storageBucket: "descontos-4ab4b.appspot.com",
        messagingSenderId: "907559767912",
        appId: "1:907559767912:web:d9974a77e46a5ef08ed0dd"
    };
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();

// Dados locais de cidades e bairros
const CIDADES_E_BAIRROS = {
    "Caraguá": ["Centro", "Caputera", "Olaria", "Sumaré", "Massaguaçú"],
    "Ubatuba": ["Centro", "Perequê-Açú", "Itaguá", "Ipiranguinha"]
};

// Função principal
const initializeMaintenanceForm = () => {
    const citySelect = document.getElementById('city');
    const neighborhoodSelect = document.getElementById('neighborhood');
    const form = document.getElementById('maintenanceForm');

    if (!citySelect || !neighborhoodSelect || !form) {
        console.error('Elementos do formulário não encontrados!');
        return;
    }

    // Popular cidades
    citySelect.innerHTML = '<option value="" selected disabled>Selecione uma cidade</option>';
    Object.keys(CIDADES_E_BAIRROS).forEach(cidade => {
        citySelect.add(new Option(cidade, cidade));
    });

    // Evento de mudança de cidade
    citySelect.addEventListener('change', () => {
        neighborhoodSelect.innerHTML = '<option value="" selected disabled>Selecione um bairro</option>';
        neighborhoodSelect.disabled = !citySelect.value;

        if (citySelect.value && CIDADES_E_BAIRROS[citySelect.value]) {
            CIDADES_E_BAIRROS[citySelect.value].forEach(bairro => {
                neighborhoodSelect.add(new Option(bairro, bairro));
            });
        }
    });

    // Evento de submit do formulário
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        
        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Salvando...';

            const maintenanceData = {
                city: citySelect.value,
                neighborhood: neighborhoodSelect.value,
                problemType: form.problemType.value,
                responsible: form.responsible.value,
                startDate: firebase.firestore.Timestamp.fromDate(new Date(form.startDate.value)),
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: auth.currentUser.email,
                status: form.endDate.value ? 'Concluído' : 'Pendente'
            };

            if (form.endDate.value) {
                maintenanceData.endDate = firebase.firestore.Timestamp.fromDate(new Date(form.endDate.value));
                maintenanceData.duration = Math.round(
                    (new Date(form.endDate.value) - new Date(form.startDate.value)) / (1000 * 60)
                );
            }

            if (form.docId.value) {
                await db.collection('maintenances').doc(form.docId.value).update(maintenanceData);
                alert('Manutenção atualizada com sucesso!');
            } else {
                await db.collection('maintenances').add(maintenanceData);
                alert('Manutenção cadastrada com sucesso!');
            }

            form.reset();
            form.docId.value = '';
            submitBtn.textContent = 'Registrar';
            await loadMaintenances();

        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert(`Erro: ${error.message}`);
        } finally {
            submitBtn.disabled = false;
        }
    });
};

// Carregar manutenções
const loadMaintenances = async () => {
    try {
        const snapshot = await db.collection('maintenances')
            .orderBy('startDate', 'desc')
            .limit(20)
            .get();

        const tbody = document.getElementById('maintenanceList');
        tbody.innerHTML = '';

        snapshot.forEach(doc => {
            const data = doc.data();
            tbody.innerHTML += `
                <tr>
                    <td>${data.neighborhood}</td>
                    <td>${data.problemType}</td>
                    <td>${data.startDate.toDate().toLocaleString('pt-BR')}</td>
                    <td>${data.endDate ? data.endDate.toDate().toLocaleString('pt-BR') : '-'}</td>
                    <td>${data.duration ? `${Math.floor(data.duration/60)}h ${data.duration%60}m` : 'Em andamento'}</td>
                    <td><button class="btn btn-sm btn-outline-primary edit-btn" data-id="${doc.id}">Editar</button></td>
                </tr>
            `;
        });

        // Configurar botões de edição
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const doc = await db.collection('maintenances').doc(btn.dataset.id).get();
                const data = doc.data();

                document.getElementById('city').value = data.city;
                document.getElementById('neighborhood').innerHTML = `<option value="${data.neighborhood}" selected>${data.neighborhood}</option>`;
                document.getElementById('problemType').value = data.problemType;
                document.getElementById('responsible').value = data.responsible;
                document.getElementById('startDate').value = data.startDate.toDate().toISOString().slice(0,16);
                document.getElementById('endDate').value = data.endDate?.toDate().toISOString().slice(0,16) || '';
                document.maintenanceForm.docId.value = doc.id;
                document.querySelector('#maintenanceForm button[type="submit"]').textContent = 'Atualizar';
            });
        });

    } catch (error) {
        console.error('Erro ao carregar:', error);
        document.getElementById('maintenanceList').innerHTML = `
            <tr><td colspan="6" class="text-center text-danger">Erro ao carregar manutenções</td></tr>
        `;
    }
};

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    initializeMaintenanceForm();
    console.log('Sistema de manutenções inicializado');
});
