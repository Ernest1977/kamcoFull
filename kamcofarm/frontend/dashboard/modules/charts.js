// ========================================
// MODULE GRAPHIQUES — CHART.JS
// ========================================

// Couleurs du thème
const CHART_COLORS = {
    primary: '#188701',
    primaryLight: '#66BB6A',
    accent: '#1de9b6',
    orange: '#FF6F00',
    red: '#F44336',
    blue: '#2196F3',
    purple: '#9C27B0',
    teal: '#009688',
    grey: '#757575',
    lightGrey: '#e0e0e0'
};

const CHART_PALETTE = [
    CHART_COLORS.primary, CHART_COLORS.blue, CHART_COLORS.orange,
    CHART_COLORS.purple, CHART_COLORS.teal, CHART_COLORS.red,
    CHART_COLORS.primaryLight, CHART_COLORS.accent
];

// Stocker les instances de graphiques pour les détruire proprement
const chartInstances = {};

function destroyChart(id) {
    if (chartInstances[id]) {
        chartInstances[id].destroy();
        delete chartInstances[id];
    }
}

function createChart(canvasId, config) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;
    chartInstances[canvasId] = new Chart(ctx, config);
    return chartInstances[canvasId];
}


// ========================================
// VUE D'ENSEMBLE ENRICHIE AVEC GRAPHIQUES
// ========================================
async function loadOverviewModule() {
    const area = document.getElementById('contentArea');

    try {
        const dashData = await apiGet('/api/administration/admin/').catch(() => null);
        const financeDash = await apiGet('/api/finance/admin/').catch(() => null);

        if (!dashData && !financeDash) {
            area.innerHTML = renderOverviewFallback();
            return;
        }

        area.innerHTML = `
            <!-- Alertes -->
            ${renderOverviewAlerts(dashData || {})}

            <!-- Stats principales -->
            <div class="stats-row">
                <div class="stat-card">
                    <div class="stat-card-icon green">💰</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${formatMoney(financeDash?.chiffre_affaires || 0)}</div>
                        <div class="stat-card-label">Chiffre d'affaires</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon teal">📥</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${formatMoney(financeDash?.montant_encaisse || 0)}</div>
                        <div class="stat-card-label">Encaissé</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon orange">📦</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${dashData?.supplychain?.commandes_en_cours || 0}</div>
                        <div class="stat-card-label">Commandes en cours</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon blue">👥</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${dashData?.rh?.total_employes || 0}</div>
                        <div class="stat-card-label">Employés</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon purple">📣</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${dashData?.marketing?.leads_nouveaux || 0}</div>
                        <div class="stat-card-label">Leads</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon red">🔔</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${dashData?.notifications_non_lues || 0}</div>
                        <div class="stat-card-label">Notifications</div>
                    </div>
                </div>
            </div>

            <!-- Graphiques ligne 1 -->
            <div class="grid-2">
                <div class="card">
                    <div class="card-header"><h3>📊 Évolution mensuelle</h3></div>
                    <div class="card-body" style="height:300px;">
                        <canvas id="chartEvolutionMensuelle"></canvas>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header"><h3>💰 Revenus vs Dépenses</h3></div>
                    <div class="card-body" style="height:300px;">
                        <canvas id="chartRevenusDepenses"></canvas>
                    </div>
                </div>
            </div>

            <!-- Graphiques ligne 2 -->
            <div class="grid-2" style="margin-top:1.5rem;">
                <div class="card">
                    <div class="card-header"><h3>📦 Commandes par statut</h3></div>
                    <div class="card-body" style="height:280px;">
                        <canvas id="chartCommandesStatut"></canvas>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header"><h3>📄 Factures par statut</h3></div>
                    <div class="card-body" style="height:280px;">
                        <canvas id="chartFacturesStatut"></canvas>
                    </div>
                </div>
            </div>

            <!-- Graphiques ligne 3 -->
            <div class="grid-2" style="margin-top:1.5rem;">
                <div class="card">
                    <div class="card-header"><h3>🚜 Utilisation de la flotte</h3></div>
                    <div class="card-body" style="height:280px;">
                        <canvas id="chartFlotte"></canvas>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header"><h3>🎯 Pipeline des leads</h3></div>
                    <div class="card-body" style="height:280px;">
                        <canvas id="chartLeadsPipeline"></canvas>
                    </div>
                </div>
            </div>

            <!-- Résumé modules -->
            <div class="grid-2" style="margin-top:1.5rem;">
                ${renderOverviewModuleCards(dashData)}
            </div>

            <!-- Logs récents -->
            ${dashData?.logs_recents && dashData.logs_recents.length > 0 ? `
            <div class="card" style="margin-top:1.5rem;">
                <div class="card-header"><h3>📝 Activité récente</h3></div>
                <div class="card-body">
                    <div class="table-container">
                        <table class="dash-table">
                            <thead><tr><th>Date</th><th>Utilisateur</th><th>Action</th><th>Module</th><th>Description</th></tr></thead>
                            <tbody>
                                ${dashData.logs_recents.slice(0, 8).map(log => `
                                    <tr>
                                        <td><small>${timeAgo(log.date_action)}</small></td>
                                        <td><small>${escapeHtml(log.utilisateur_nom || 'Système')}</small></td>
                                        <td><span class="badge ${getBadgeClass(log.action)}">${escapeHtml(log.action_display || log.action)}</span></td>
                                        <td><small>${escapeHtml(log.module_display || log.module)}</small></td>
                                        <td><small>${escapeHtml((log.description || '').substring(0, 60))}</small></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            ` : ''}
        `;

        // Charger les graphiques après le rendu
        setTimeout(() => {
            renderChartEvolutionMensuelle(financeDash);
            renderChartRevenusDepenses(financeDash);
            renderChartCommandesStatut(dashData);
            renderChartFacturesStatut(financeDash);
            renderChartFlotte(dashData);
            renderChartLeadsPipeline(dashData);
        }, 100);

    } catch (error) {
        showError(`Dashboard : ${error.message}`);
    }
}


// ========================================
// GRAPHIQUE : ÉVOLUTION MENSUELLE
// ========================================
function renderChartEvolutionMensuelle(financeDash) {
    if (!financeDash?.evolution_mensuelle) return;

    const moisLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const data = financeDash.evolution_mensuelle;

    createChart('chartEvolutionMensuelle', {
        type: 'line',
        data: {
            labels: data.map(d => moisLabels[d.mois - 1]),
            datasets: [
                {
                    label: 'Revenus',
                    data: data.map(d => d.revenus || 0),
                    borderColor: CHART_COLORS.primary,
                    backgroundColor: CHART_COLORS.primary + '20',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2
                },
                {
                    label: 'Dépenses',
                    data: data.map(d => d.depenses || 0),
                    borderColor: CHART_COLORS.red,
                    backgroundColor: CHART_COLORS.red + '20',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()} FCFA`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: (v) => v >= 1000000 ? (v/1000000).toFixed(1) + 'M' : v >= 1000 ? (v/1000).toFixed(0) + 'K' : v }
                }
            }
        }
    });
}


// ========================================
// GRAPHIQUE : REVENUS VS DÉPENSES (BARRE)
// ========================================
function renderChartRevenusDepenses(financeDash) {
    if (!financeDash?.evolution_mensuelle) return;

    const moisLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const data = financeDash.evolution_mensuelle;

    createChart('chartRevenusDepenses', {
        type: 'bar',
        data: {
            labels: data.map(d => moisLabels[d.mois - 1]),
            datasets: [
                {
                    label: 'Revenus',
                    data: data.map(d => d.revenus || 0),
                    backgroundColor: CHART_COLORS.primary + 'CC',
                    borderRadius: 4
                },
                {
                    label: 'Dépenses',
                    data: data.map(d => d.depenses || 0),
                    backgroundColor: CHART_COLORS.red + 'CC',
                    borderRadius: 4
                },
                {
                    label: 'Solde',
                    data: data.map(d => d.solde || 0),
                    backgroundColor: data.map(d => (d.solde || 0) >= 0 ? CHART_COLORS.teal + 'CC' : CHART_COLORS.orange + 'CC'),
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: (v) => v >= 1000000 ? (v/1000000).toFixed(1) + 'M' : v >= 1000 ? (v/1000).toFixed(0) + 'K' : v }
                }
            }
        }
    });
}


// ========================================
// GRAPHIQUE : COMMANDES PAR STATUT (DONUT)
// ========================================
function renderChartCommandesStatut(dashData) {
    const statuts = dashData?.supplychain?.commandes_par_statut;
    if (!statuts || Object.keys(statuts).length === 0) {
        const canvas = document.getElementById('chartCommandesStatut');
        if (canvas) canvas.parentElement.innerHTML = '<div class="empty-state" style="padding:2rem;"><p>Aucune donnée</p></div>';
        return;
    }

    const labels = Object.keys(statuts);
    const values = Object.values(statuts);

    const statutColors = {
        'EN_ATTENTE': CHART_COLORS.orange,
        'CONFIRMEE': CHART_COLORS.blue,
        'EN_PREPARATION': CHART_COLORS.purple,
        'EXPEDIEE': CHART_COLORS.teal,
        'LIVREE': CHART_COLORS.primary,
        'ANNULEE': CHART_COLORS.red
    };

    createChart('chartCommandesStatut', {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: labels.map(l => statutColors[l] || CHART_COLORS.grey),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } }
            }
        }
    });
}


// ========================================
// GRAPHIQUE : FACTURES PAR STATUT (DONUT)
// ========================================
function renderChartFacturesStatut(financeDash) {
    const factures = financeDash?.factures;
    if (!factures) {
        const canvas = document.getElementById('chartFacturesStatut');
        if (canvas) canvas.parentElement.innerHTML = '<div class="empty-state" style="padding:2rem;"><p>Aucune donnée</p></div>';
        return;
    }

    const labels = ['Payées', 'En attente', 'En retard'];
    const values = [factures.payees || 0, factures.en_attente || 0, factures.en_retard || 0];

    createChart('chartFacturesStatut', {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [CHART_COLORS.primary, CHART_COLORS.orange, CHART_COLORS.red],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } }
            }
        }
    });
}


// ========================================
// GRAPHIQUE : UTILISATION FLOTTE (DONUT)
// ========================================
function renderChartFlotte(dashData) {
    const canvas = document.getElementById('chartFlotte');
    if (!canvas) return;

    let disponibles = 0, enLocation = 0, enMaintenance = 0, autres = 0;

    try {
        disponibles = dashData?.supplychain?.fournisseurs_actifs || 0;

        // Essayer de charger les données équipements
        apiGet('/api/equipements/admin/').then(eqDash => {
            if (eqDash?.flotte) {
                disponibles = eqDash.flotte.disponibles || 0;
                enLocation = eqDash.flotte.en_location || 0;
                enMaintenance = eqDash.flotte.en_maintenance || 0;
                autres = Math.max(0, (eqDash.flotte.total || 0) - disponibles - enLocation - enMaintenance);
            }

            createChart('chartFlotte', {
                type: 'doughnut',
                data: {
                    labels: ['Disponibles', 'En location', 'En maintenance', 'Autres'],
                    datasets: [{
                        data: [disponibles, enLocation, enMaintenance, autres],
                        backgroundColor: [CHART_COLORS.primary, CHART_COLORS.blue, CHART_COLORS.orange, CHART_COLORS.grey],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } }
                    }
                }
            });
        }).catch(() => {
            canvas.parentElement.innerHTML = '<div class="empty-state" style="padding:2rem;"><p>Données équipements non disponibles</p></div>';
        });
    } catch(e) {
        canvas.parentElement.innerHTML = '<div class="empty-state" style="padding:2rem;"><p>Données non disponibles</p></div>';
    }
}


// ========================================
// GRAPHIQUE : PIPELINE LEADS (BARRE HORIZONTALE)
// ========================================
function renderChartLeadsPipeline(dashData) {
    const canvas = document.getElementById('chartLeadsPipeline');
    if (!canvas) return;

    const leadsData = dashData?.marketing?.leads_nouveaux;

    // Charger les données leads
    apiGet('/api/marketing/admin/').then(mktDash => {
        const parStatut = mktDash?.leads?.par_statut || {};

        const labels = ['Nouveau', 'Contacté', 'Qualifié', 'Proposition', 'Négociation', 'Converti', 'Perdu'];
        const keys = ['NOUVEAU', 'CONTACTE', 'QUALIFIE', 'PROPOSITION', 'NEGOCIATION', 'CONVERTI', 'PERDU'];
        const values = keys.map(k => parStatut[k] || 0);
        const bgColors = [CHART_COLORS.purple, CHART_COLORS.blue, CHART_COLORS.teal, CHART_COLORS.orange, CHART_COLORS.accent, CHART_COLORS.primary, CHART_COLORS.red];

        createChart('chartLeadsPipeline', {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Leads',
                    data: values,
                    backgroundColor: bgColors.map(c => c + 'CC'),
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } }
            }
        });
    }).catch(() => {
        canvas.parentElement.innerHTML = '<div class="empty-state" style="padding:2rem;"><p>Données marketing non disponibles</p></div>';
    });
}


// ========================================
// CARTES MODULES RÉSUMÉ
// ========================================
function renderOverviewModuleCards(data) {
    if (!data) return '';
    return `
        <div class="card" onclick="navigateTo('supplychain')" style="cursor:pointer;">
            <div class="card-header"><h3>🚚 Supply Chain</h3><button class="btn btn-sm btn-outline">Voir →</button></div>
            <div class="card-body">
                <div class="stats-row" style="margin:0;">
                    <div class="stat-card" style="padding:0.8rem;"><div class="stat-card-info"><div class="stat-card-value" style="font-size:1.3rem;">${data.supplychain?.commandes_ce_mois || 0}</div><div class="stat-card-label">Ce mois</div></div></div>
                    <div class="stat-card" style="padding:0.8rem;"><div class="stat-card-info"><div class="stat-card-value" style="font-size:1.3rem;">${data.supplychain?.livraisons_en_transit || 0}</div><div class="stat-card-label">En transit</div></div></div>
                </div>
            </div>
        </div>
        <div class="card" onclick="navigateTo('rh')" style="cursor:pointer;">
            <div class="card-header"><h3>👥 RH</h3><button class="btn btn-sm btn-outline">Voir →</button></div>
            <div class="card-body">
                <div class="stats-row" style="margin:0;">
                    <div class="stat-card" style="padding:0.8rem;"><div class="stat-card-info"><div class="stat-card-value" style="font-size:1.3rem;">${data.rh?.presents_aujourdhui || 0}</div><div class="stat-card-label">Présents</div></div></div>
                    <div class="stat-card" style="padding:0.8rem;"><div class="stat-card-info"><div class="stat-card-value" style="font-size:1.3rem;">${data.rh?.conges_en_attente || 0}</div><div class="stat-card-label">Congés</div></div></div>
                </div>
            </div>
        </div>
    `;
}


// ========================================
// ALERTES VUE D'ENSEMBLE
// ========================================
function renderOverviewAlerts(data) {
    let alerts = '';

    if (data.taches?.en_retard > 0) {
        alerts += `<div class="alert alert-danger"><span>⚠️</span><span><strong>${data.taches.en_retard}</strong> tâche(s) en retard</span></div>`;
    }
    if (data.finance?.depenses_en_attente > 0) {
        alerts += `<div class="alert alert-warning"><span>💰</span><span><strong>${data.finance.depenses_en_attente}</strong> dépense(s) en attente</span></div>`;
    }
    if (data.rh?.conges_en_attente > 0) {
        alerts += `<div class="alert alert-info"><span>📅</span><span><strong>${data.rh.conges_en_attente}</strong> congé(s) en attente</span></div>`;
    }

    return alerts;
}

function renderOverviewFallback() {
    return `
        <div class="alert alert-warning"><span>⚠️</span><span>Dashboard global non disponible.</span></div>
        <div class="stats-row">
            <div class="stat-card" onclick="navigateTo('supplychain')" style="cursor:pointer;"><div class="stat-card-icon orange">🚚</div><div class="stat-card-info"><div class="stat-card-label">Supply Chain</div></div></div>
            <div class="stat-card" onclick="navigateTo('finance')" style="cursor:pointer;"><div class="stat-card-icon teal">💰</div><div class="stat-card-info"><div class="stat-card-label">Finance</div></div></div>
            <div class="stat-card" onclick="navigateTo('rh')" style="cursor:pointer;"><div class="stat-card-icon purple">👥</div><div class="stat-card-info"><div class="stat-card-label">RH</div></div></div>
            <div class="stat-card" onclick="navigateTo('marketing')" style="cursor:pointer;"><div class="stat-card-icon green">📣</div><div class="stat-card-info"><div class="stat-card-label">Marketing</div></div></div>
        </div>
    `;
}