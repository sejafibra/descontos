// Configuração de cidades e bairros
const CIDADES_E_BAIRROS = {
    "Caraguá": ["Centro", "Caputera", "Olaria", "Sumaré", "Massaguaçú"],
    "Ubatuba": ["Centro", "Perequê-Açú", "Itaguá", "Ipiranguinha"],
    };

// Autocomplete para bairros
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

// Submit do formulário (com feedback visual)
document.getElementById('maintenanceForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Processando...';
    btn.disabled = true;

    try {
        const docId = e.target.docId?.value;
        const data = {
            // ... (coleta de dados do formulário)
            status: document.getElementById('endDate').value ? 'Concluído' : 'Pendente'
        };

        if (docId) {
            await db.collection('maintenances').doc(docId).update(data);
        } else {
            await db.collection('maintenances').add(data);
        }
        
        loadMaintenances();
        e.target.reset();
    } finally {
        btn.textContent = docId ? 'Atualizar' : 'Registrar';
        btn.disabled = false;
    }
});

// Carregar manutenções com botão de edição
async function loadMaintenances() {
    const query = await db.collection('maintenances')
        .orderBy('startDate', 'desc')
        .limit(20)
        .get();

    document.getElementById('maintenanceList').innerHTML = query.docs.map(doc => `
        <tr>
            <td>${doc.data().neighborhood}</td>
            <td>${doc.data().problemType}</td>
            <td>${doc.data().startDate.toDate().toLocaleString()}</td>
            <td>${doc.data().endDate?.toDate().toLocaleString() || '-'}</td>
            <td>${doc.data().duration ? `${Math.floor(doc.data().duration/60)}h ${doc.data().duration%60}m` : 'Em andamento'}</td>
            <td><button class="btn btn-sm btn-outline-primary edit-btn" data-id="${doc.id}">Editar</button></td>
        </tr>
    `).join('');

    // Configura eventos de edição
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const docId = btn.dataset.id;
            // ... (preencher formulário com dados existentes)
        });
    });
}
