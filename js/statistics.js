// Adiciona um problema avulso
let issueCount = 0;
document.getElementById('addIssueBtn')?.addEventListener('click', () => {
    if (issueCount >= 5) {
        alert('Máximo de 5 problemas avulsos atingido.');
        return;
    }
    
    issueCount++;
    const issueDiv = document.createElement('div');
    issueDiv.className = 'additional-issue mb-3 p-3 border rounded';
    issueDiv.innerHTML = `
        <h6>Problema Avulso ${issueCount}</h6>
        <div class="row">
            <div class="col-md-6">
                <label class="form-label">Tipo</label>
                <select class="form-select issue-type">
                    <option value="TV">TV</option>
                    <option value="Internet">Internet</option>
                    <option value="Geral">Geral</option>
                </select>
            </div>
            <div class="col-md-6">
                <label class="form-label">Data/Hora Abertura</label>
                <input type="datetime-local" class="form-control issue-start" required>
            </div>
            <div class="col-md-6 mt-2">
                <label class="form-label">Data/Hora Execução</label>
                <input type="datetime-local" class="form-control issue-end" required>
            </div>
            <div class="col-md-6 mt-2 d-flex align-items-end">
                <button type="button" class="btn btn-danger btn-sm remove-issue">Remover</button>
            </div>
        </div>
    `;
    
    // Adiciona evento para remover o problema
    issueDiv.querySelector('.remove-issue').addEventListener('click', () => {
        issueDiv.remove();
        issueCount--;
    });
    
    document.getElementById('additionalIssues').appendChild(issueDiv);
});

// Formulário de estatísticas e descontos
document.getElementById('statisticsForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
    loadingModal.show();
    
    try {
        // Obter filtros
        const neighborhood = document.getElementById('filterNeighborhood').value.trim();
        const problemType = document.getElementById('filterProblemType').value;
        const startDate = new Date(document.getElementById('startDateFilter').value);
        const endDate = new Date(document.getElementById('endDateFilter').value);
        endDate.setHours(23, 59, 59, 999); // Fim do dia
        
        if (startDate > endDate) {
            alert('A data inicial não pode ser maior que a data final.');
            loadingModal.hide();
            return;
        }
        
        const tvPlanValue = parseFloat(document.getElementById('tvPlanValue').value) || 0;
        const internetPlanValue = parseFloat(document.getElementById('internetPlanValue').value) || 0;
        
        // Obter problemas avulsos
        const additionalIssues = [];
        document.querySelectorAll('.additional-issue').forEach((issueDiv) => {
            const type = issueDiv.querySelector('.issue-type').value;
            const start = issueDiv.querySelector('.issue-start').value;
            const end = issueDiv.querySelector('.issue-end').value;
            
            if (start && end) {
                const startDate = new Date(start);
                const endDate = new Date(end);
                
                if (endDate <= startDate) {
                    alert(`A data de execução do problema avulso ${type} deve ser posterior à data de abertura.`);
                    throw new Error('Data inválida');
                }
                
                additionalIssues.push({
                    type,
                    start: startDate,
                    end: endDate
                });
            }
        });
        
        // Consultar manutenções no Firebase
        let query = db.collection('maintenances')
            .where('startDate', '>=', startDate)
            .where('startDate', '<=', endDate);
        
        if (neighborhood) {
            query = query.where('neighborhood', '==', neighborhood);
        }
        
        if (problemType !== 'Todos') {
            query = query.where('problemType', '==', problemType);
        }
        
        const snapshot = await query.get();
        
        // Processar resultados
        const results = {
            tv: { count: 0, totalMinutes: 0 },
            internet: { count: 0, totalMinutes: 0 },
            geral: { count: 0, totalMinutes: 0 }
        };
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            const duration = data.duration || 0;
            
            if (data.problemType === 'TV') {
                results.tv.count++;
                results.tv.totalMinutes += duration;
            } else if (data.problemType === 'Internet') {
                results.internet.count++;
                results.internet.totalMinutes += duration;
            } else if (data.problemType === 'Geral') {
                results.geral.count++;
                results.geral.totalMinutes += duration;
            }
        });
        
        // Processar problemas avulsos
        additionalIssues.forEach((issue) => {
            const duration = (issue.end - issue.start) / (1000 * 60); // minutos
            
            if (issue.type === 'TV') {
                results.tv.count++;
                results.tv.totalMinutes += duration;
            } else if (issue.type === 'Internet') {
                results.internet.count++;
                results.internet.totalMinutes += duration;
            } else if (issue.type === 'Geral') {
                results.geral.count++;
                results.geral.totalMinutes += duration;
            }
        });
        
        // Calcular descontos
        const tvHours = results.tv.totalMinutes / 60;
        const internetHours = results.internet.totalMinutes / 60;
        const geralHours = results.geral.totalMinutes / 60;
        
        // TV e Internet também são afetadas por problemas gerais
        const totalTvHours = tvHours + (geralHours * 0.5); // Assume que problema geral afeta 50% da TV
        const totalInternetHours = internetHours + (geralHours * 0.5); // Assume que problema geral afeta 50% da Internet
        
        // Calcular valor por hora
        const tvHourValue = tvPlanValue / (30 * 24); // Valor por hora do plano de TV
        const internetHourValue = internetPlanValue / (30 * 24); // Valor por hora do plano de Internet
        
        const tvDiscount = totalTvHours * tvHourValue;
        const internetDiscount = totalInternetHours * internetHourValue;
        const totalDiscount = tvDiscount + internetDiscount;
        
        // Exibir resultados
        displayResults(results, {
            tvDiscount,
            internetDiscount,
            totalDiscount,
            tvHourValue,
            internetHourValue,
            totalTvHours,
            totalInternetHours,
            geralHours
        });
        
    } catch (error) {
        console.error('Erro ao calcular estatísticas:', error);
        if (error.message !== 'Data inválida') {
            document.getElementById('maintenanceStats').innerHTML = '<p class="text-danger">Erro ao calcular estatísticas.</p>';
        }
    } finally {
        loadingModal.hide();
    }
});

// Exibe os resultados
function displayResults(results, discounts) {
    // Estatísticas de manutenção
    let statsHTML = `
        <div class="row">
            <div class="col-md-4">
                <div class="card bg-light mb-3">
                    <div class="card-header">TV</div>
                    <div class="card-body">
                        <p class="card-text">Ocorrências: ${results.tv.count}</p>
                        <p class="card-text">Tempo total: ${formatHours(results.tv.totalMinutes / 60)}</p>
                        <p class="card-text">Afetado por Geral: ${formatHours((discounts.geralHours * 0.5))}</p>
                        <p class="card-text">Total: ${formatHours(discounts.totalTvHours)}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card bg-light mb-3">
                    <div class="card-header">Internet</div>
                    <div class="card-body">
                        <p class="card-text">Ocorrências: ${results.internet.count}</p>
                        <p class="card-text">Tempo total: ${formatHours(results.internet.totalMinutes / 60)}</p>
                        <p class="card-text">Afetado por Geral: ${formatHours((discounts.geralHours * 0.5))}</p>
                        <p class="card-text">Total: ${formatHours(discounts.totalInternetHours)}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card bg-light mb-3">
                    <div class="card-header">Geral</div>
                    <div class="card-body">
                        <p class="card-text">Ocorrências: ${results.geral.count}</p>
                        <p class="card-text">Tempo total: ${formatHours(results.geral.totalMinutes / 60)}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('maintenanceStats').innerHTML = statsHTML;
    
    // Cálculo de descontos
    let discountHTML = `
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
                    <td>${formatHours(discounts.totalTvHours)}</td>
                    <td>R$ ${discounts.tvHourValue.toFixed(4)}</td>
                    <td>R$ ${discounts.tvDiscount.toFixed(2)}</td>
                </tr>
                <tr>
                    <td>Internet</td>
                    <td>${formatHours(discounts.totalInternetHours)}</td>
                    <td>R$ ${discounts.internetHourValue.toFixed(4)}</td>
                    <td>R$ ${discounts.internetDiscount.toFixed(2)}</td>
                </tr>
                <tr class="table-success fw-bold">
                    <td colspan="3">Total</td>
                    <td>R$ ${discounts.totalDiscount.toFixed(2)}</td>
                </tr>
            </tbody>
        </table>
        <div class="alert alert-info">
            <strong>Observação:</strong> Problemas do tipo "Geral" afetam 50% do tempo tanto para TV quanto para Internet no cálculo de descontos.
        </div>
    `;
    
    document.getElementById('discountResults').innerHTML = discountHTML;
}

// Formata horas para exibição
function formatHours(hours) {
    const fullHours = Math.floor(hours);
    const minutes = Math.round((hours - fullHours) * 60);
    return `${fullHours}h ${minutes}m`;
}

// Inicializa a data atual nos filtros
if (document.getElementById('startDateFilter')) {
    document.addEventListener('DOMContentLoaded', () => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        
        document.getElementById('startDateFilter').valueAsDate = firstDay;
        document.getElementById('endDateFilter').valueAsDate = today;
    });
}
