// Layout modificado para problemas avulsos
document.getElementById('addIssueBtn').addEventListener('click', () => {
    const issueDiv = document.createElement('div');
    issueDiv.className = 'additional-issue mb-3 p-3 border rounded';
    issueDiv.innerHTML = `
        <div class="row g-2">
            <div class="col-md-3">
                <select class="form-select issue-type">
                    <option value="TV">TV</option>
                    <option value="Internet">Internet</option>
                    <option value="Geral">Geral</option>
                </select>
            </div>
            <div class="col-md-4">
                <input type="datetime-local" class="form-control issue-start" required>
            </div>
            <div class="col-md-4">
                <input type="datetime-local" class="form-control issue-end" required>
            </div>
            <div class="col-md-1">
                <button type="button" class="btn btn-danger btn-sm remove-issue">X</button>
            </div>
        </div>
    `;
    
    issueDiv.querySelector('.remove-issue').addEventListener('click', () => {
        issueDiv.remove();
    });
    
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
