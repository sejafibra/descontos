// Layout modificado para problemas avulsos
document.getElementById('addIssueBtn').addEventListener('click', () => {
    const issueDiv = document.createElement('div');
    issueDiv.className = 'additional-issue mb-3 p-3 border rounded';
    issueDiv.innerHTML = `
        <div class="row g-2">
            <div class="col-md-3">
                <label class="form-label">Tipo</label>
                <select class="form-select issue-type">...</select>
            </div>
            <div class="col-md-4">
                <label class="form-label">Data/Hora Abertura</label>
                <input type="datetime-local" class="form-control issue-start">
            </div>
            <div class="col-md-4">
                <label class="form-label">Data/Hora Execução</label>
                <input type="datetime-local" class="form-control issue-end">
            </div>
            <div class="col-md-1">
                <button class="btn btn-danger btn-sm remove-issue">X</button>
            </div>
        </div>
    `;
    document.getElementById('additionalIssues').appendChild(issueDiv);
});

// Cálculo corrigido (100% para problemas gerais)
function calculateDiscounts(results) {
    const totalTvHours = results.tv.totalMinutes/60 + results.geral.totalMinutes/60;
    const totalInternetHours = results.internet.totalMinutes/60 + results.geral.totalMinutes/60;
    
    return {
        tvDiscount: totalTvHours * (tvPlanValue / (30 * 24)),
        internetDiscount: totalInternetHours * (internetPlanValue / (30 * 24))
    };
}
