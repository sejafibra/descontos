// Formulário de manutenção
document.getElementById('maintenanceForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const neighborhood = document.getElementById('neighborhood').value.trim();
    const city = document.getElementById('city').value.trim();
    const problemType = document.getElementById('problemType').value;
    const responsible = document.getElementById('responsible').value.trim();
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!neighborhood || !city || !responsible || !startDate) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }
    
    // Gerar protocolo automático
    const protocol = 'MAN-' + Date.now();
    
    // Calcular duração se endDate estiver preenchido
    let duration = null;
    if (endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (end <= start) {
            alert('A data de fim deve ser posterior à data de início.');
            return;
        }
        
        duration = (end - start) / (1000 * 60); // Duração em minutos
    }
    
    // Mostrar modal de carregamento
    const loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
    loadingModal.show();
    
    // Adicionar ao Firestore
    db.collection('maintenances').add({
        neighborhood,
        city,
        protocol,
        problemType,
        responsible,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        duration,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdBy: auth.currentUser.email,
        status: endDate ? 'Concluído' : 'Em andamento'
    }).then(() => {
        alert('Manutenção registrada com sucesso!');
        document.getElementById('maintenanceForm').reset();
        loadMaintenances();
    }).catch((error) => {
        console.error('Erro ao registrar manutenção:', error);
        alert('Erro ao registrar manutenção: ' + error.message);
    }).finally(() => {
        loadingModal.hide();
    });
});

// Carrega as últimas manutenções
function loadMaintenances() {
    const maintenanceList = document.getElementById('maintenanceList');
    maintenanceList.innerHTML = '<tr><td colspan="5" class="text-center">Carregando...</td></tr>';
    
    db.collection('maintenances')
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get()
        .then((querySnapshot) => {
            maintenanceList.innerHTML = '';
            
            if (querySnapshot.empty) {
                maintenanceList.innerHTML = '<tr><td colspan="5" class="text-center">Nenhuma manutenção registrada.</td></tr>';
                return;
            }
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const startDate = data.startDate.toDate();
                const endDate = data.endDate ? data.endDate.toDate() : null;
                
                let durationText = 'Em andamento';
                if (data.duration) {
                    const hours = Math.floor(data.duration / 60);
                    const minutes = Math.floor(data.duration % 60);
                    durationText = `${hours}h ${minutes}m`;
                }
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${data.neighborhood}</td>
                    <td>${data.problemType}</td>
                    <td>${formatDateTime(startDate)}</td>
                    <td>${endDate ? formatDateTime(endDate) : '-'}</td>
                    <td>${durationText}</td>
                `;
                maintenanceList.appendChild(row);
            });
        })
        .catch((error) => {
            console.error('Erro ao carregar manutenções:', error);
            maintenanceList.innerHTML = '<tr><td colspan="5" class="text-center">Erro ao carregar manutenções.</td></tr>';
        });
}

// Formata data e hora
function formatDateTime(date) {
    const options = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleString('pt-BR', options);
}

// Carrega as manutenções quando a página é carregada
if (document.getElementById('maintenanceList')) {
    document.addEventListener('DOMContentLoaded', loadMaintenances);
}
