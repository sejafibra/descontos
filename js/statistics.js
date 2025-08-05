// Variável para controle de problemas avulsos
let issueCount = 0;

// Configuração inicial
document.addEventListener('DOMContentLoaded', () => {
    // Inicializa datas padrão
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    document.getElementById('startDateFilter').valueAsDate = firstDay;
    document.getElementById('endDateFilter').valueAsDate = today;

    // Configura botão para adicionar problemas avulsos
    document.getElementById('addIssueBtn').addEventListener('click', addAdditionalIssue);
});

// Adiciona novo problema avulso
function addAdditionalIssue() {
    if (issueCount >= 5) {
        alert('Máximo de 5 problemas avulsos atingido!');
        return;
    }

    issueCount++;
    const issueDiv = document.createElement('div');
    issueDiv.className = 'additional-issue mb-3 p-3 border rounded';
    issueDiv.innerHTML = `
        <h6>Problema Avulso ${issueCount}</h6>
        <div class="row g-2 align-items-end">
            <div class="col-md-3">
                <label class="form-label mb-1">Tipo</label>
                <select class="form-select issue-type">
                    <option value="TV">TV</option>
                    <option value="Internet">Internet</option>
                    <option value="Geral">Geral</option>
                </select>
            </div>
            <div class="col-md-4">
                <label class="form-label mb-1">Data/Hora Abertura</label>
                <input type="datetime-local" class="form-control issue-start" required>
            </div>
            <div class="col-md-4">
                <label class="form-label mb-1">Data/Hora Execução</label>
                <input type="datetime-local" class="form-control issue-end" required>
            </div>
            <div class="col-md-1">
                <button type="button" class="btn btn-danger btn-sm remove-issue">X</button>
            </div>
        </div>
    `;

    issueDiv.querySelector('.remove-issue').addEventListener('click', () => {
        issueDiv.remove();
        issueCount--;
    });

    document.getElementById('additionalIssues').appendChild(issueDiv);
}

// Calcula estatísticas e descontos
document.getElementById('statisticsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
    loadingModal.show();

    try {
        // Processa filtros
        const startDate = new Date(document.getElementById('startDateFilter').value);
        const endDate = new Date(document.getElementById('endDateFilter').value);
        endDate.setHours(23, 59, 59, 999);

        // Coleta problemas avulsos
        const additionalIssues = Array.from(document.querySelectorAll('.additional-issue')).map(issue => {
            return {
                type: issue.querySelector('.issue-type').value,
                start: new Date(issue.querySelector('.issue-start').value),
                end: new Date(issue.querySelector('.issue-end').value)
            };
        });

        // Consulta manutenções no Firebase
        let query = db.collection('maintenances')
            .where('startDate', '>=', firebase.firestore.Timestamp.fromDate(startDate))
            .where('startDate', '<=', firebase.firestore.Timestamp.fromDate(endDate));

        const neighborhood = document.getElementById('filterNeighborhood').value.trim();
        if (neighborhood) query = query.where('neighborhood', '==', neighborhood);

        const problemType = document.getElementById('filterProblemType').value;
        if (problemType !== 'Todos') query = query.where('problemType', '==', problemType);

        const snapshot = await query.get();

        // Processa resultados
        const results = { tv: 0, internet: 0, geral: 0 }; // em minutos

        snapshot.forEach(doc => {
            const data = doc.data();
            const duration = data.duration || 0;
            results[data.problemType.toLowerCase()] += duration;
        });

        // Adiciona problemas avulsos
        additionalIssues.forEach(issue => {
            const duration = (issue.end - issue.start) / (1000 * 60);
            results[issue.type.toLowerCase()] += duration;
        });

        // Calcula descontos
        const tvPlanValue = parseFloat(document.getElementById('tvPlanValue').value) || 0;
        const internetPlanValue = parseFloat(document.getElementById('internetPlanValue').value) || 0;

        const tvHours = (results.tv + results.geral) / 60;
        const internetHours = (results.internet + results.geral) / 60;

        const discounts = {
            tv: tvHours * (tvPlanValue / (30 * 24)),
            internet: internetHours * (internetPlanValue / (30 * 24)),
            total: 0
        };
        discounts.total = discounts.tv + discounts.internet;

        // Exibe resultados
        displayResults(results, discounts);
    } catch (error) {
        console.error("Erro ao calcular:", error);
        document.getElementById('maintenanceStats').innerHTML = `
            <div class="alert alert-danger">Erro ao processar: ${error.message}</div>
        `;
    } finally {
        loadingModal.hide();
    }
});

// Exibe os resultados na tela
function displayResults(results, discounts) {
    // Estatísticas
    document.getElementById('maintenanceStats').innerHTML = `
        <div class="row">
            <div class="col-md-4">
                <div class="card bg-light mb-3">
                    <div class="card-header">TV</div>
                    <div class="card-body">
                        <p class="card-text">Tempo total: ${formatHours((results.tv + results.geral) / 60)}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card bg-light mb-3">
                    <div class="card-header">Internet</div>
                    <div class="card-body">
                        <p class="card-text">Tempo total: ${formatHours((results.internet + results.geral) / 60)}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card bg-light mb-3">
                    <div class="card-header">Geral</div>
                    <div class="card-body">
                        <p class="card-text">Tempo total: ${formatHours(results.geral / 60)}</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Descontos
    document.getElementById('discountResults').innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Serviço</th>
                    <th>Tempo</th>
                    <th>Valor/Hora</th>
                    <th>Desconto</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>TV</td>
                    <td>${formatHours((results.tv + results.geral) / 60)}</td>
                    <td>R$ ${(discounts.tv / ((results.tv + results.geral) / 60)).toFixed(4)}</td>
                    <td>R$ ${discounts.tv.toFixed(2)}</td>
                </tr>
                <tr>
                    <td>Internet</td>
                    <td>${formatHours((results.internet + results.geral) / 60)}</td>
                    <td>R$ ${(discounts.internet / ((results.internet + results.geral) / 60)).toFixed(4)}</td>
                    <td>R$ ${discounts.internet.toFixed(2)}</td>
                </tr>
                <tr class="table-success fw-bold">
                    <td colspan="3">Total</td>
                    <td>R$ ${discounts.total.toFixed(2)}</td>
                </tr>
            </tbody>
        </table>
        <div class="alert alert-info mt-3">
            <strong>Observação:</strong> Problemas do tipo "Geral" afetam 100% do tempo tanto para TV quanto para Internet.
        </div>
    `;
}

// Formata horas (ex: 5h 30m)
function formatHours(hours) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
}
