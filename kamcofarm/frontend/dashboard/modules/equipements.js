// ========================================
// MODULE ÉQUIPEMENTS — CRUD COMPLET + IoT
// ========================================

async function loadEquipementsModule() {
    const area = document.getElementById('contentArea');

    try {
        const dashData = await apiGet('/api/equipements/dashboard/').catch(() => null);
        const eqData = await apiGet('/api/equipements/equipements/').catch(() => []);
        const catData = await apiGet('/api/equipements/categories/').catch(() => []);
        const certData = await apiGet('/api/equipements/certifications/').catch(() => []);
        const planData = await apiGet('/api/equipements/plans-maintenance/').catch(() => []);
        const intData = await apiGet('/api/equipements/interventions/').catch(() => []);
        const carbData = await apiGet('/api/equipements/carburant/').catch(() => []);
        const mvtData = await apiGet('/api/equipements/mouvements/').catch(() => []);
        const cycleData = await apiGet('/api/equipements/cycle-vie/').catch(() => []);
        const captData = await apiGet('/api/equipements/capteurs/').catch(() => []);
        const alertData = await apiGet('/api/equipements/alertes-iot/').catch(() => []);

        const eqList = Array.isArray(eqData) ? eqData : (eqData.results || []);
        const catList = Array.isArray(catData) ? catData : (catData.results || []);
        const certList = Array.isArray(certData) ? certData : (certData.results || []);
        const planList = Array.isArray(planData) ? planData : (planData.results || []);
        const intList = Array.isArray(intData) ? intData : (intData.results || []);
        const carbList = Array.isArray(carbData) ? carbData : (carbData.results || []);
        const mvtList = Array.isArray(mvtData) ? mvtData : (mvtData.results || []);
        const cycleList = Array.isArray(cycleData) ? cycleData : (cycleData.results || []);
        const captList = Array.isArray(captData) ? captData : (captData.results || []);
        const alertList = Array.isArray(alertData) ? alertData : (alertData.results || []);

        const alertesActives = alertList.filter(a => a.statut === 'ACTIVE');

        area.innerHTML = `
            <!-- Stats -->
            <div class="stats-row">
                <div class="stat-card">
                    <div class="stat-card-icon blue">🚜</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${dashData?.flotte?.total || eqList.length}</div>
                        <div class="stat-card-label">Équipements</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon green">✅</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${dashData?.flotte?.disponibles || eqList.filter(e => e.statut === 'DISPONIBLE').length}</div>
                        <div class="stat-card-label">Disponibles</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon orange">🔧</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${dashData?.maintenance?.interventions_en_cours || intList.filter(i => ['PLANIFIEE','EN_COURS'].includes(i.statut)).length}</div>
                        <div class="stat-card-label">Interventions</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon teal">📊</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${formatPercent(dashData?.flotte?.taux_utilisation || 0)}</div>
                        <div class="stat-card-label">Taux utilisation</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon purple">📡</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${captList.filter(c => c.statut === 'ACTIF').length}/${captList.length}</div>
                        <div class="stat-card-label">Capteurs actifs</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon red">🚨</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${alertesActives.length}</div>
                        <div class="stat-card-label">Alertes IoT</div>
                    </div>
                </div>
            </div>

            <!-- Alertes -->
            ${alertesActives.length > 0 ? `<div class="alert alert-danger"><span>🚨</span><span><strong>${alertesActives.length} alerte(s) IoT active(s)</strong> — Consultez l'onglet Alertes IoT</span></div>` : ''}
            ${(dashData?.maintenance?.urgences_actives || 0) > 0 ? `<div class="alert alert-warning"><span>🔧</span><span><strong>${dashData.maintenance.urgences_actives}</strong> intervention(s) urgente(s)</span></div>` : ''}
            ${(dashData?.certifications?.expirees || 0) > 0 ? `<div class="alert alert-danger"><span>📋</span><span><strong>${dashData.certifications.expirees}</strong> certification(s) expirée(s)</span></div>` : ''}

            <!-- Onglets -->
            <div class="card">
                <div class="card-header" style="overflow-x:auto;">
                    <div class="tab-nav" style="flex-wrap:nowrap; min-width:max-content;">
                        <button class="tab-btn active" onclick="switchTab('eq', 'equipements', this)">🚜 Équipements (${eqList.length})</button>
                        <button class="tab-btn" onclick="switchTab('eq', 'categories', this)">📂 Catégories (${catList.length})</button>
                        <button class="tab-btn" onclick="switchTab('eq', 'interventions', this)">🔧 Interventions (${intList.length})</button>
                        <button class="tab-btn" onclick="switchTab('eq', 'certifications', this)">📋 Certifications (${certList.length})</button>
                        <button class="tab-btn" onclick="switchTab('eq', 'carburant', this)">⛽ Carburant (${carbList.length})</button>
                        <button class="tab-btn" onclick="switchTab('eq', 'mouvements', this)">📍 Mouvements (${mvtList.length})</button>
                        <button class="tab-btn" onclick="switchTab('eq', 'capteurs', this)">📡 Capteurs IoT (${captList.length})</button>
                        <button class="tab-btn" onclick="switchTab('eq', 'alertes', this)">🚨 Alertes IoT (${alertesActives.length})</button>
                        <button class="tab-btn" onclick="switchTab('eq', 'cycle', this)">📊 Cycle vie (${cycleList.length})</button>
                        <button class="tab-btn" onclick="switchTab('eq', 'maintenance', this)">📅 Plans maint. (${planList.length})</button>
                        <button class="tab-btn" onclick="switchTab('eq', 'carte', this)">🗺️ Carte GPS</button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="tab-content active" id="eq_equipements" style="display:block;">${renderEqEquipements(eqList)}</div>
                    <div class="tab-content" id="eq_categories" style="display:none;">${renderEqCategories(catList)}</div>
                    <div class="tab-content" id="eq_interventions" style="display:none;">${renderEqInterventions(intList)}</div>
                    <div class="tab-content" id="eq_certifications" style="display:none;">${renderEqCertifications(certList)}</div>
                    <div class="tab-content" id="eq_carburant" style="display:none;">${renderEqCarburant(carbList)}</div>
                    <div class="tab-content" id="eq_mouvements" style="display:none;">${renderEqMouvements(mvtList)}</div>
                    <div class="tab-content" id="eq_capteurs" style="display:none;">${renderEqCapteurs(captList)}</div>
                    <div class="tab-content" id="eq_alertes" style="display:none;">${renderEqAlertes(alertList)}</div>
                    <div class="tab-content" id="eq_cycle" style="display:none;">${renderEqCycleVie(cycleList)}</div>
                    <div class="tab-content" id="eq_maintenance" style="display:none;">${renderEqPlansMaintenance(planList)}</div>
                    <div class="tab-content" id="eq_carte" style="display:none;">${renderEqCarteGPS(eqList)}</div>
                </div>
            </div>
        `;

    } catch (error) {
        showError(`Équipements : ${error.message}`);
    }
}


// ========================================
// TAB : ÉQUIPEMENTS
// ========================================
function renderEqEquipements(eqList) {
    const searchValue = getSearchValue('equipements');
    let filtered = eqList;
    if (searchValue) {
        filtered = filterLocally(filtered, searchValue, ['reference', 'nom', 'marque', 'modele', 'categorie_nom']);
    }
    const filterStatut = getFilterValue('equipements', 'statut_eq');
    if (filterStatut) {
        filtered = filtered.filter(e => e.statut === filterStatut);
    }

    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">🚜 Flotte d'Équipements</h4>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireEqEquipement()">+ Ajouter</button>
                <button class="btn btn-outline btn-sm" onclick="lancerVerificationsEq()">🔄 Vérifications</button>
                <button class="btn-export" onclick="exporterOngletActifExcel('Equipements')">📊 Excel</button>
            </div>
        </div>
        ${renderSearchBar({
            placeholder: 'Rechercher un équipement...',
            moduleRedirect: 'equipements',
            filters: [{
                key: 'statut_eq', label: 'Statut',
                options: [
                    {value:'DISPONIBLE', label:'Disponible'}, {value:'EN_LOCATION', label:'En location'},
                    {value:'EN_MAINTENANCE', label:'En maintenance'}, {value:'EN_REPARATION', label:'En réparation'},
                    {value:'HORS_SERVICE', label:'Hors service'}, {value:'RESERVE', label:'Réservé'}
                ]
            }]
        })}
        ${filtered.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">🚜</div><h3>Aucun équipement</h3></div>' : `
            <p class="scroll-hint">👆 Faites défiler horizontalement →</p>
            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead><tr><th>Photo</th><th>Réf</th><th>Nom</th><th>Catégorie</th><th>Marque</th><th>Statut</th><th>Heures</th><th>Km</th><th>Localisation</th><th>Maint.</th><th>Actions</th></tr></thead>
                        <tbody>
                            ${filtered.map(eq => `
                                <tr ${eq.maintenance_requise ? 'style="background:#fff8e1;"' : ''}>
                                    <td>${eq.photo_url ? `<img src="${eq.photo_url}" style="width:45px;height:45px;object-fit:cover;border-radius:8px;">` : '🚜'}</td>
                                    <td><strong>${escapeHtml(eq.reference)}</strong></td>
                                    <td>${escapeHtml(eq.nom)}</td>
                                    <td><small>${escapeHtml(eq.categorie_nom || 'N/A')}</small></td>
                                    <td><small>${escapeHtml(eq.marque || '')} ${escapeHtml(eq.modele || '')}</small></td>
                                    <td><span class="badge ${getBadgeClass(eq.statut)}">${escapeHtml(eq.statut_display || eq.statut)}</span></td>
                                    <td>${eq.heures_moteur || 0}h</td>
                                    <td>${eq.kilometres || 0}</td>
                                    <td><small>${escapeHtml(eq.localisation_actuelle || 'N/A')}</small></td>
                                    <td>${eq.maintenance_requise ? '<span class="badge badge-danger">⚠️</span>' : '<span class="badge badge-success">✅</span>'}</td>
                                    <td>
                                        <div class="item-actions">
                                            <button class="btn btn-sm btn-outline" onclick="voirDetailEqEquipement(${eq.id})" title="Détail">👁️</button>
                                            <button class="btn btn-sm btn-outline" onclick="editerEqEquipement(${eq.id})" title="Modifier">✏️</button>
                                            ${eq.statut === 'DISPONIBLE' ? `<button class="btn btn-sm btn-danger" onclick="signalerPanneEq(${eq.id})" title="Panne">🚨</button>` : ''}
                                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/equipements/equipements/${eq.id}/', 'equipements')">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="responsive-mobile-view">
                ${filtered.map(eq => `
                    <div class="responsive-card" ${eq.maintenance_requise ? 'style="border-left:4px solid var(--warning);"' : ''}>
                        <div class="responsive-card-header">
                            <div>
                                <strong>${escapeHtml(eq.nom)}</strong>
                                <br><small>${escapeHtml(eq.reference)} | ${escapeHtml(eq.marque || '')} ${escapeHtml(eq.modele || '')}</small>
                            </div>
                            <span class="badge ${getBadgeClass(eq.statut)}">${escapeHtml(eq.statut_display || eq.statut)}</span>
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row"><span class="responsive-card-label">📂 Catégorie</span><span>${escapeHtml(eq.categorie_nom || 'N/A')}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">⏱️ Heures</span><span>${eq.heures_moteur || 0}h</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">🛣️ Km</span><span>${eq.kilometres || 0}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📍 Position</span><span>${escapeHtml(eq.localisation_actuelle || 'N/A')}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">🔧 Maintenance</span><span>${eq.maintenance_requise ? '<span class="badge badge-danger">⚠️ Requise</span>' : '<span class="badge badge-success">✅ OK</span>'}</span></div>
                        </div>
                        <div class="responsive-card-footer">
                            <button class="btn btn-sm btn-outline" onclick="voirDetailEqEquipement(${eq.id})">👁️</button>
                            <button class="btn btn-sm btn-outline" onclick="editerEqEquipement(${eq.id})">✏️</button>
                            ${eq.statut === 'DISPONIBLE' ? `<button class="btn btn-sm btn-danger" onclick="signalerPanneEq(${eq.id})">🚨</button>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}


// ========================================
// TAB : CATÉGORIES
// ========================================
function renderEqCategories(catList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">📂 Catégories d'Équipements</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireEqCategorie()">+ Nouvelle catégorie</button>
        </div>
        ${catList.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📂</div><h3>Aucune catégorie</h3></div>' : `
            <div class="table-container">
                <table class="dash-table">
                    <thead><tr><th>Nom</th><th>Icône</th><th>Nb équipements</th><th>Active</th><th>Actions</th></tr></thead>
                    <tbody>
                        ${catList.map(c => `
                            <tr>
                                <td><strong>${escapeHtml(c.nom)}</strong></td>
                                <td>${escapeHtml(c.icone || '📦')}</td>
                                <td><span class="badge badge-info">${c.nombre_equipements || 0}</span></td>
                                <td>${c.est_active ? '<span class="badge badge-success">Oui</span>' : '<span class="badge badge-danger">Non</span>'}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline" onclick="editerEqCategorie(${c.id})">✏️</button>
                                    <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/equipements/categories/${c.id}/', 'equipements')">🗑️</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `}
    `;
}


// ========================================
// TAB : INTERVENTIONS
// ========================================
function renderEqInterventions(intList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">🔧 Interventions Maintenance</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireEqIntervention()">+ Nouvelle intervention</button>
            <button class="btn-export" onclick="exporterOngletActifExcel('Interventions')">📊 Excel</button>
        </div>
        ${intList.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">🔧</div><h3>Aucune intervention</h3></div>' : `
            <p class="scroll-hint">👆 Faites défiler horizontalement →</p>
            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead><tr><th>Réf</th><th>Équipement</th><th>Type</th><th>Priorité</th><th>Statut</th><th>Coût</th><th>IoT</th><th>Date</th><th>Actions</th></tr></thead>
                        <tbody>
                            ${intList.map(i => `
                                <tr ${i.priorite === 'URGENTE' || i.priorite === 'CRITIQUE' ? 'style="background:#fff0f0;"' : ''}>
                                    <td><strong>${escapeHtml(i.reference)}</strong></td>
                                    <td>${escapeHtml(i.equipement_nom || 'N/A')}</td>
                                    <td><span class="badge badge-info">${escapeHtml(i.type_display || i.type_intervention)}</span></td>
                                    <td><span class="badge ${getBadgeClass(i.priorite)}">${escapeHtml(i.priorite_display || i.priorite)}</span></td>
                                    <td><span class="badge ${getBadgeClass(i.statut)}">${escapeHtml(i.statut_display || i.statut)}</span></td>
                                    <td>${formatMoney(i.cout_total || 0)}</td>
                                    <td>${i.declenchee_par_iot ? '<span class="badge badge-purple">📡</span>' : ''}</td>
                                    <td><small>${formatDate(i.date_planifiee || i.date_creation)}</small></td>
                                    <td>
                                        <button class="btn btn-sm btn-outline" onclick="editerEqIntervention(${i.id})" title="Modifier">✏️</button>
                                        ${!['TERMINEE','ANNULEE'].includes(i.statut) ? `<button class="btn btn-sm btn-success" onclick="changerStatutEqIntervention(${i.id})">📋</button>` : ''}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="responsive-mobile-view">
                ${intList.map(i => `
                    <div class="responsive-card" ${i.priorite === 'URGENTE' || i.priorite === 'CRITIQUE' ? 'style="border-left:4px solid var(--danger);"' : ''}>
                        <div class="responsive-card-header">
                            <div><strong>${escapeHtml(i.reference)}</strong><br><small>${escapeHtml(i.equipement_nom || '')}</small></div>
                            <span class="badge ${getBadgeClass(i.statut)}">${escapeHtml(i.statut_display || i.statut)}</span>
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row"><span class="responsive-card-label">🔧 Type</span><span>${escapeHtml(i.type_display || i.type_intervention)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">⚡ Priorité</span><span class="badge ${getBadgeClass(i.priorite)}">${escapeHtml(i.priorite_display || i.priorite)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">💰 Coût</span><span>${formatMoney(i.cout_total || 0)}</span></div>
                            ${i.declenchee_par_iot ? `<div class="responsive-card-row"><span class="responsive-card-label">📡 IoT</span><span class="badge badge-purple">Détecté par capteur</span></div>` : ''}
                        </div>
                        <div class="responsive-card-footer">
                            ${!['TERMINEE','ANNULEE'].includes(i.statut) ? `<button class="btn btn-sm btn-success" onclick="changerStatutEqIntervention(${i.id})">📋 Statut</button>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}


// ========================================
// TAB : CERTIFICATIONS
// ========================================
function renderEqCertifications(certList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">📋 Certifications & Contrôles</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireEqCertification()">+ Nouvelle certification</button>
        </div>
        ${certList.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📋</div><h3>Aucune certification</h3></div>' : `
            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead><tr><th>Nom</th><th>Équipement</th><th>Type</th><th>Expiration</th><th>Jours restants</th><th>Statut</th></tr></thead>
                        <tbody>
                            ${certList.map(c => `
                                <tr ${c.est_expire ? 'style="background:#fff0f0;"' : c.alerte_active ? 'style="background:#fff8e1;"' : ''}>
                                    <td><strong>${escapeHtml(c.nom)}</strong></td>
                                    <td>${escapeHtml(c.equipement_nom || 'N/A')}</td>
                                    <td><span class="badge badge-info">${escapeHtml(c.type_display || c.type_certification)}</span></td>
                                    <td>${formatDate(c.date_expiration)}</td>
                                    <td>${c.est_expire ? '<span class="badge badge-danger">Expiré</span>' : c.alerte_active ? `<span class="badge badge-warning">${c.jours_restants}j</span>` : `<span class="badge badge-success">${c.jours_restants}j</span>`}</td>
                                    <td><span class="badge ${getBadgeClass(c.statut)}">${escapeHtml(c.statut_display || c.statut)}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="responsive-mobile-view">
                ${certList.map(c => `
                    <div class="responsive-card" ${c.est_expire ? 'style="border-left:4px solid var(--danger);"' : ''}>
                        <div class="responsive-card-header">
                            <div><strong>${escapeHtml(c.nom)}</strong><br><small>${escapeHtml(c.equipement_nom || '')}</small></div>
                            <span class="badge ${getBadgeClass(c.statut)}">${escapeHtml(c.statut_display || c.statut)}</span>
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row"><span class="responsive-card-label">📅 Expiration</span><span>${formatDate(c.date_expiration)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">⏳ Restant</span><span>${c.est_expire ? '<span class="badge badge-danger">Expiré</span>' : `${c.jours_restants} jours`}</span></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}


// ========================================
// TAB : CARBURANT
// ========================================
function renderEqCarburant(carbList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">⛽ Consommation Carburant</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireEqCarburant()">+ Nouveau plein</button>
        </div>
        ${carbList.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">⛽</div><h3>Aucun plein enregistré</h3></div>' : `
            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead><tr><th>Équipement</th><th>Date</th><th>Litres</th><th>Coût</th><th>Prix/L</th><th>Station</th><th>Par</th></tr></thead>
                        <tbody>
                            ${carbList.map(c => `
                                <tr>
                                    <td><strong>${escapeHtml(c.equipement_nom || 'N/A')}</strong></td>
                                    <td><small>${formatDateTime(c.date_plein)}</small></td>
                                    <td>${c.quantite_litres}L</td>
                                    <td><strong>${formatMoney(c.cout_total)}</strong></td>
                                    <td>${formatMoney(c.prix_litre)}/L</td>
                                    <td><small>${escapeHtml(c.station || 'N/A')}</small></td>
                                    <td><small>${escapeHtml(c.enregistre_par_nom || 'N/A')}</small></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="responsive-mobile-view">
                ${carbList.map(c => `
                    <div class="responsive-card">
                        <div class="responsive-card-header">
                            <div><strong>${escapeHtml(c.equipement_nom || 'N/A')}</strong><br><small>${formatDateTime(c.date_plein)}</small></div>
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row"><span class="responsive-card-label">⛽ Litres</span><span>${c.quantite_litres}L</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">💰 Coût</span><span style="font-weight:700;">${formatMoney(c.cout_total)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📍 Station</span><span>${escapeHtml(c.station || 'N/A')}</span></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}


// ========================================
// TAB : MOUVEMENTS
// ========================================
function renderEqMouvements(mvtList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">📍 Mouvements & Tracking</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireEqMouvement()">+ Nouveau mouvement</button>
        </div>
        ${mvtList.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📍</div><h3>Aucun mouvement</h3></div>' : `
            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead><tr><th>Équipement</th><th>Type</th><th>Départ</th><th>Arrivée</th><th>Distance</th><th>Date</th><th>Par</th></tr></thead>
                        <tbody>
                            ${mvtList.map(m => `
                                <tr>
                                    <td><strong>${escapeHtml(m.equipement_nom || 'N/A')}</strong></td>
                                    <td><span class="badge badge-info">${escapeHtml(m.type_display || m.type_mouvement)}</span></td>
                                    <td><small>${escapeHtml(m.lieu_depart)}</small></td>
                                    <td><small>${escapeHtml(m.lieu_arrivee)}</small></td>
                                    <td>${m.distance_km || 0} km</td>
                                    <td><small>${formatDateTime(m.date_mouvement)}</small></td>
                                    <td><small>${escapeHtml(m.effectue_par_nom || 'N/A')}</small></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="responsive-mobile-view">
                ${mvtList.map(m => `
                    <div class="responsive-card">
                        <div class="responsive-card-header">
                            <div><strong>${escapeHtml(m.equipement_nom || 'N/A')}</strong></div>
                            <span class="badge badge-info">${escapeHtml(m.type_display || m.type_mouvement)}</span>
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row"><span class="responsive-card-label">📍 Départ</span><span>${escapeHtml(m.lieu_depart)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📍 Arrivée</span><span>${escapeHtml(m.lieu_arrivee)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">🛣️ Distance</span><span>${m.distance_km || 0} km</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📅 Date</span><span>${formatDateTime(m.date_mouvement)}</span></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}


// ========================================
// TAB : CAPTEURS IoT
// ========================================
function renderEqCapteurs(captList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">📡 Capteurs IoT</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireEqCapteur()">+ Nouveau capteur</button>
            <button class="btn-export" onclick="exporterOngletActifExcel('Capteurs_IoT')">📊 Excel</button>
        </div>
        ${captList.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📡</div><h3>Aucun capteur</h3></div>' : `
            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead><tr><th>ID Capteur</th><th>Nom</th><th>Équipement</th><th>Type</th><th>Dernière valeur</th><th>Dernière lecture</th><th>Statut</th><th>Alerte</th></tr></thead>
                        <tbody>
                            ${captList.map(c => `
                                <tr ${c.statut === 'DECONNECTE' ? 'style="background:#fff0f0;"' : ''}>
                                    <td><strong><code>${escapeHtml(c.identifiant)}</code></strong></td>
                                    <td>${escapeHtml(c.nom)}</td>
                                    <td>${escapeHtml(c.equipement_nom || 'N/A')}</td>
                                    <td><span class="badge badge-info">${escapeHtml(c.type_display || c.type_capteur)}</span></td>
                                    <td>${c.derniere_valeur !== null ? `<strong>${c.derniere_valeur}</strong> ${escapeHtml(c.unite_mesure || '')}` : 'N/A'}</td>
                                    <td><small>${c.derniere_lecture ? formatDateTime(c.derniere_lecture) : 'Jamais'}</small></td>
                                    <td><span class="badge ${c.statut === 'ACTIF' ? 'badge-success' : c.statut === 'DECONNECTE' ? 'badge-danger' : 'badge-warning'}">${escapeHtml(c.statut_display || c.statut)}</span></td>
                                    <td>${c.est_en_alerte ? '<span class="badge badge-danger">🚨</span>' : ''}</td>
                                    <button class="btn btn-sm btn-outline" onclick="editerEqCapteur(${c.id})" title="Modifier">✏️</button>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="responsive-mobile-view">
                ${captList.map(c => `
                    <div class="responsive-card" ${c.statut === 'DECONNECTE' ? 'style="border-left:4px solid var(--danger);"' : ''}>
                        <div class="responsive-card-header">
                            <div><strong>${escapeHtml(c.nom)}</strong><br><small><code>${escapeHtml(c.identifiant)}</code> | ${escapeHtml(c.equipement_nom || '')}</small></div>
                            <span class="badge ${c.statut === 'ACTIF' ? 'badge-success' : 'badge-danger'}">${escapeHtml(c.statut_display || c.statut)}</span>
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row"><span class="responsive-card-label">📊 Type</span><span>${escapeHtml(c.type_display || c.type_capteur)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📈 Valeur</span><span>${c.derniere_valeur !== null ? `<strong>${c.derniere_valeur}</strong> ${escapeHtml(c.unite_mesure || '')}` : 'N/A'}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">🕐 Lecture</span><span>${c.derniere_lecture ? formatDateTime(c.derniere_lecture) : 'Jamais'}</span></div>
                            ${c.est_en_alerte ? `<div class="responsive-card-row"><span class="responsive-card-label">🚨 Alerte</span><span class="badge badge-danger">En alerte</span></div>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}


// ========================================
// TAB : ALERTES IoT
// ========================================
function renderEqAlertes(alertList) {
    const actives = alertList.filter(a => a.statut === 'ACTIVE');
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">🚨 Alertes IoT (${actives.length} actives)</h4>
            <button class="btn-export" onclick="exporterOngletActifExcel('Alertes_IoT')">📊 Excel</button>
        </div>
        ${alertList.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">🚨</div><h3>Aucune alerte</h3></div>' : `
            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead><tr><th>Équipement</th><th>Capteur</th><th>Sévérité</th><th>Titre</th><th>Valeur</th><th>Statut</th><th>Date</th><th>Actions</th></tr></thead>
                        <tbody>
                            ${alertList.map(a => `
                                <tr ${a.severite === 'CRITIQUE' ? 'style="background:#fff0f0;"' : a.severite === 'DANGER' ? 'style="background:#fff3e0;"' : ''}>
                                    <td><strong>${escapeHtml(a.equipement_nom || 'N/A')}</strong></td>
                                    <td><small>${escapeHtml(a.capteur_identifiant || 'N/A')}</small></td>
                                    <td><span class="badge ${a.severite === 'CRITIQUE' ? 'badge-danger' : a.severite === 'DANGER' ? 'badge-warning' : 'badge-info'}">${escapeHtml(a.severite_display || a.severite)}</span></td>
                                    <td><small>${escapeHtml((a.titre || '').substring(0, 50))}</small></td>
                                    <td><strong>${a.valeur_declenchement}</strong></td>
                                    <td><span class="badge ${getBadgeClass(a.statut)}">${escapeHtml(a.statut_display || a.statut)}</span></td>
                                    <td><small>${formatDateTime(a.date_alerte)}</small></td>
                                    <td>
                                        ${a.statut === 'ACTIVE' ? `
                                            <button class="btn btn-sm btn-success" onclick="actionEqAlerte(${a.id}, 'acquitter')">✅</button>
                                            <button class="btn btn-sm btn-primary" onclick="actionEqAlerte(${a.id}, 'resoudre')">🔧</button>
                                        ` : ''}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="responsive-mobile-view">
                ${alertList.map(a => `
                    <div class="responsive-card" style="border-left:4px solid ${a.severite === 'CRITIQUE' ? 'var(--danger)' : a.severite === 'DANGER' ? 'var(--warning)' : 'var(--info)'};">
                        <div class="responsive-card-header">
                            <div><strong>${escapeHtml(a.equipement_nom || 'N/A')}</strong><br><small>${escapeHtml(a.titre || '')}</small></div>
                            <span class="badge ${a.severite === 'CRITIQUE' ? 'badge-danger' : 'badge-warning'}">${escapeHtml(a.severite_display || a.severite)}</span>
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row"><span class="responsive-card-label">📡 Capteur</span><span>${escapeHtml(a.capteur_identifiant || 'N/A')}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📊 Valeur</span><span><strong>${a.valeur_declenchement}</strong></span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📅 Date</span><span>${formatDateTime(a.date_alerte)}</span></div>
                        </div>
                        <div class="responsive-card-footer">
                            ${a.statut === 'ACTIVE' ? `
                                <button class="btn btn-sm btn-success" onclick="actionEqAlerte(${a.id}, 'acquitter')">✅ Acquitter</button>
                                <button class="btn btn-sm btn-primary" onclick="actionEqAlerte(${a.id}, 'resoudre')">🔧 Résoudre</button>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}


// ========================================
// TAB : CYCLE DE VIE
// ========================================
function renderEqCycleVie(cycleList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">📊 Cycle de Vie</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireEqCycleVie()">+ Nouvel événement</button>
        </div>
        ${cycleList.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📊</div><h3>Aucun événement</h3></div>' : `
            <div class="table-container">
                <table class="dash-table">
                    <thead><tr><th>Équipement</th><th>Événement</th><th>Date</th><th>Montant</th><th>Description</th></tr></thead>
                    <tbody>
                        ${cycleList.map(c => `
                            <tr>
                                <td><strong>${escapeHtml(c.equipement_nom || 'N/A')}</strong></td>
                                <td><span class="badge badge-info">${escapeHtml(c.evenement_display || c.evenement)}</span></td>
                                <td>${formatDate(c.date_evenement)}</td>
                                <td>${formatMoney(c.montant || 0)}</td>
                                <td><small>${escapeHtml((c.description || '').substring(0, 60))}</small></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `}
    `;
}


// ========================================
// TAB : PLANS MAINTENANCE
// ========================================
function renderEqPlansMaintenance(planList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">📅 Plans de Maintenance Préventive</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireEqPlanMaintenance()">+ Nouveau plan</button>
        </div>
        ${planList.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📅</div><h3>Aucun plan</h3></div>' : `
            <div class="table-container">
                <table class="dash-table">
                    <thead><tr><th>Nom</th><th>Équipement</th><th>Fréquence</th><th>Seuil</th><th>Coût estimé</th><th>Dernière</th><th>Prochaine</th><th>Actif</th></tr></thead>
                    <tbody>
                        ${planList.map(p => `
                            <tr>
                                <td><strong>${escapeHtml(p.nom)}</strong></td>
                                <td>${escapeHtml(p.equipement_nom || 'N/A')}</td>
                                <td><span class="badge badge-info">${escapeHtml(p.type_frequence_display || p.type_frequence)}</span></td>
                                <td>${p.seuil_heures || 0}h / ${p.seuil_km || 0}km</td>
                                <td>${formatMoney(p.cout_estime || 0)}</td>
                                <td><small>${formatDate(p.derniere_execution)}</small></td>
                                <td><small>${formatDate(p.prochaine_execution)}</small></td>
                                <td>${p.est_actif ? '<span class="badge badge-success">✅</span>' : '<span class="badge badge-danger">❌</span>'}</td>
                                <button class="btn btn-sm btn-outline" onclick="editerEqPlanMaintenance(${p.id})" title="Modifier">✏️</button>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `}
    `;
}


// ========================================
// TAB : CARTE GPS (Géolocalisation)
// ========================================
function renderEqCarteGPS(eqList) {
    const eqAvecGPS = eqList.filter(e => e.latitude && e.longitude);

    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">🗺️ Géolocalisation en Temps Réel</h4>
            <button class="btn btn-outline btn-sm" onclick="navigateTo('equipements')">🔄 Actualiser</button>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:1rem; margin-bottom:1rem;">
            ${eqList.map(eq => `
                <div style="background:white; border-radius:12px; padding:1rem; box-shadow:var(--shadow); border-left:4px solid ${eq.statut === 'DISPONIBLE' ? 'var(--success)' : eq.statut === 'EN_LOCATION' ? 'var(--info)' : 'var(--warning)'};">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                        <strong>${escapeHtml(eq.nom)}</strong>
                        <span class="badge ${getBadgeClass(eq.statut)}" style="font-size:0.7rem;">${escapeHtml(eq.statut_display || eq.statut)}</span>
                    </div>
                    <div style="font-size:0.85rem; color:var(--text-light);">
                        <div>📍 ${escapeHtml(eq.localisation_actuelle || 'Position inconnue')}</div>
                        ${eq.latitude && eq.longitude ? `
                            <div style="margin-top:0.3rem;">
                                <small>GPS: ${eq.latitude}, ${eq.longitude}</small>
                                <a href="https://www.google.com/maps?q=${eq.latitude},${eq.longitude}" target="_blank" style="color:var(--primary); margin-left:0.5rem;">📍 Voir sur carte</a>
                            </div>
                        ` : '<div style="margin-top:0.3rem;"><small>📡 Pas de données GPS</small></div>'}
                        <div style="margin-top:0.3rem;">⏱️ ${eq.heures_moteur || 0}h | 🛣️ ${eq.kilometres || 0}km</div>
                    </div>
                </div>
            `).join('')}
        </div>

        ${eqAvecGPS.length > 0 ? `
            <div style="background:#f0f7f0; border-radius:12px; padding:1.5rem; text-align:center;">
                <h4 style="color:var(--primary); margin-bottom:1rem;">🌍 ${eqAvecGPS.length} équipement(s) avec données GPS</h4>
                <div style="display:flex; gap:0.5rem; justify-content:center; flex-wrap:wrap;">
                    ${eqAvecGPS.map(eq => `
                        <a href="https://www.google.com/maps?q=${eq.latitude},${eq.longitude}" target="_blank" class="btn btn-sm btn-outline">
                            📍 ${escapeHtml(eq.nom)}
                        </a>
                    `).join('')}
                </div>
            </div>
        ` : `
            <div class="alert alert-info"><span>📡</span><span>Aucun équipement n'a de données GPS. Les coordonnées seront mises à jour par les capteurs IoT.</span></div>
        `}
    `;
}


// ========================================
// ACTIONS & FORMULAIRES
// ========================================
async function voirDetailEqEquipement(id) {
    try {
        const eq = await apiGet(`/api/equipements/equipements/${id}/historique_complet/`).catch(() => null);
        const data = eq?.equipement || await apiGet(`/api/equipements/equipements/${id}/`);

        const existant = document.getElementById('modalCreation');
        if (existant) existant.remove();

        const modal = document.createElement('div');
        modal.id = 'modalCreation';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
        modal.innerHTML = `
            <div style="background:white; border-radius:16px; width:100%; max-width:800px; max-height:90vh; overflow-y:auto;">
                <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                    <h3 style="color:var(--primary);">🚜 ${escapeHtml(data.nom)} (${escapeHtml(data.reference)})</h3>
                    <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.5rem; cursor:pointer;">✕</button>
                </div>
                <div style="padding:1.5rem;">
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">📋 Général</div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.3rem;">
                            <div class="detail-row"><span class="detail-label">Statut</span><span class="detail-value"><span class="badge ${getBadgeClass(data.statut)}">${escapeHtml(data.statut_display || data.statut)}</span></span></div>
                            <div class="detail-row"><span class="detail-label">Catégorie</span><span class="detail-value">${escapeHtml(data.categorie_nom || 'N/A')}</span></div>
                            <div class="detail-row"><span class="detail-label">Marque/Modèle</span><span class="detail-value">${escapeHtml(data.marque || '')} ${escapeHtml(data.modele || '')}</span></div>
                            <div class="detail-row"><span class="detail-label">N° Série</span><span class="detail-value">${escapeHtml(data.numero_serie || 'N/A')}</span></div>
                            <div class="detail-row"><span class="detail-label">Heures moteur</span><span class="detail-value">${data.heures_moteur || 0}h</span></div>
                            <div class="detail-row"><span class="detail-label">Kilomètres</span><span class="detail-value">${data.kilometres || 0} km</span></div>
                            <div class="detail-row"><span class="detail-label">Localisation</span><span class="detail-value">${escapeHtml(data.localisation_actuelle || 'N/A')} ${data.latitude ? `<a href="https://www.google.com/maps?q=${data.latitude},${data.longitude}" target="_blank">📍</a>` : ''}</span></div>
                            <div class="detail-row"><span class="detail-label">Maintenance</span><span class="detail-value">${data.maintenance_requise ? '<span class="badge badge-danger">⚠️ Requise</span>' : '<span class="badge badge-success">✅ OK</span>'}</span></div>
                        </div>
                    </div>
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">💰 Valeur & Tarifs</div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.3rem;">
                            <div class="detail-row"><span class="detail-label">Prix acquisition</span><span class="detail-value">${formatMoney(data.prix_acquisition)}</span></div>
                            <div class="detail-row"><span class="detail-label">Valeur actuelle</span><span class="detail-value">${formatMoney(data.valeur_actuelle_estimee)}</span></div>
                            <div class="detail-row"><span class="detail-label">Tarif/jour</span><span class="detail-value">${formatMoney(data.tarif_journalier)}</span></div>
                            <div class="detail-row"><span class="detail-label">Caution</span><span class="detail-value">${formatMoney(data.caution_requise)}</span></div>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button class="btn btn-outline" onclick="this.closest('#modalCreation').remove(); editerEqEquipement(${data.id})">✏️ Modifier</button>
                        <button class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Fermer</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    } catch (error) { alert(`Erreur : ${error.message}`); }
}

async function signalerPanneEq(id) {
    const description = prompt('Décrivez la panne :');
    if (!description) return;
    try {
        await apiPost(`/api/equipements/equipements/${id}/signaler_panne/`, { description, priorite: 'URGENTE' });
        navigateTo('equipements');
    } catch (error) { alert(`Erreur : ${error.message}`); }
}

async function changerStatutEqIntervention(id) {
    const statuts = [{value:'PLANIFIEE',label:'📋 Planifiée'},{value:'EN_COURS',label:'▶️ En cours'},{value:'EN_ATTENTE_PIECES',label:'⏳ Attente pièces'},{value:'TERMINEE',label:'✅ Terminée'},{value:'ANNULEE',label:'❌ Annulée'}];
    const existant = document.getElementById('modalCreation'); if (existant) existant.remove();
    const modal = document.createElement('div'); modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `<div style="background:white; border-radius:16px; width:100%; max-width:400px;"><div style="padding:1.5rem; border-bottom:1px solid var(--border);"><h3 style="color:var(--primary);">📋 Statut intervention</h3></div><div style="padding:1.5rem; display:flex; flex-direction:column; gap:0.5rem;">${statuts.map(s => `<button class="btn btn-outline" onclick="confirmerStatutEqInt(${id}, '${s.value}')">${s.label}</button>`).join('')}<button class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button></div></div>`;
    document.body.appendChild(modal); modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}
async function confirmerStatutEqInt(id, statut) {
    try { await apiPost(`/api/equipements/interventions/${id}/changer_statut/`, { statut }); document.getElementById('modalCreation')?.remove(); navigateTo('equipements'); } catch(e) { alert(e.message); }
}

async function actionEqAlerte(id, action) {
    const commentaire = prompt('Commentaire :') || '';
    try { await apiPost(`/api/equipements/alertes-iot/${id}/${action}/`, { commentaire }); navigateTo('equipements'); } catch(e) { alert(e.message); }
}

async function lancerVerificationsEq() {
    if (!confirm('Lancer les vérifications automatiques ?\n(Certifications, maintenance préventive, garanties)')) return;
    try { const r = await apiPost('/api/equipements/verifications/'); alert(`✅ Vérifications terminées !\n${JSON.stringify(r.resultats, null, 2)}`); navigateTo('equipements'); } catch(e) { alert(e.message); }
}

async function ouvrirFormulaireEqCategorie(editData = null) {
    const existant = document.getElementById('modalCreation'); if (existant) existant.remove();
    const endpoint = editData ? `/api/equipements/categories/${editData.id}/` : '/api/equipements/categories/';
    const modal = document.createElement('div'); modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `<div style="background:white; border-radius:16px; width:100%; max-width:450px;"><div style="padding:1.5rem; border-bottom:1px solid var(--border);"><h3 style="color:var(--primary);">${editData ? '✏️' : '➕'} Catégorie</h3></div><form id="eqCatForm" style="padding:1.5rem;"><div class="form-grid"><div class="form-field full-width"><label>Nom *</label><input type="text" id="catNomEq" value="${escapeHtml(editData?.nom || '')}" required></div><div class="form-field"><label>Icône</label><input type="text" id="catIcone" value="${escapeHtml(editData?.icone || '📦')}" placeholder="Emoji"></div></div><div class="form-checkbox"><input type="checkbox" id="catActiveEq" ${editData?.est_active !== false ? 'checked' : ''}><label>Active</label></div><div class="form-actions"><button type="submit" class="btn btn-primary">💾</button><button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button></div><p id="eqCatError" style="color:var(--danger);text-align:center;"></p></form></div>`;
    document.body.appendChild(modal);
    document.getElementById('eqCatForm').addEventListener('submit', async (e) => { e.preventDefault(); try { const p = { nom: document.getElementById('catNomEq').value, icone: document.getElementById('catIcone')?.value || '', est_active: document.getElementById('catActiveEq').checked }; if (editData) await apiPatch(endpoint, p); else await apiPost(endpoint, p); modal.remove(); navigateTo('equipements'); } catch(err) { document.getElementById('eqCatError').textContent = err.message; } });
}
async function editerEqCategorie(id) { try { const c = await apiGet(`/api/equipements/categories/${id}/`); ouvrirFormulaireEqCategorie(c); } catch(e) { alert(e.message); } }

async function ouvrirFormulaireEqCarburant() {
    const existant = document.getElementById('modalCreation'); if (existant) existant.remove();
    let equipements = []; try { const r = await apiGet('/api/equipements/equipements/'); equipements = Array.isArray(r) ? r : (r.results || []); } catch(e) {}
    const modal = document.createElement('div'); modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `<div style="background:white; border-radius:16px; width:100%; max-width:550px;"><div style="padding:1.5rem; border-bottom:1px solid var(--border);"><h3 style="color:var(--primary);">➕ Enregistrer un plein</h3></div><form id="eqCarbForm" style="padding:1.5rem;"><div class="form-grid"><div class="form-field full-width"><label>Équipement *</label><select id="carbEq" required><option value="">Sélectionner...</option>${equipements.map(e => `<option value="${e.id}">${escapeHtml(e.nom)} (${escapeHtml(e.reference)})</option>`).join('')}</select></div><div class="form-field"><label>Litres *</label><input type="number" id="carbLitres" step="0.01" required></div><div class="form-field"><label>Coût total *</label><input type="number" id="carbCout" step="0.01" required></div><div class="form-field"><label>Heures moteur</label><input type="number" id="carbHeures" step="0.1" value="0"></div><div class="form-field"><label>Km</label><input type="number" id="carbKm" step="0.1" value="0"></div><div class="form-field"><label>Station</label><input type="text" id="carbStation"></div><div class="form-field"><label>Date *</label><input type="datetime-local" id="carbDate" value="${new Date().toISOString().slice(0,16)}" required></div></div><div class="form-actions"><button type="submit" class="btn btn-primary">💾</button><button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button></div><p id="eqCarbError" style="color:var(--danger);text-align:center;"></p></form></div>`;
    document.body.appendChild(modal);
    document.getElementById('eqCarbForm').addEventListener('submit', async (e) => { e.preventDefault(); try { await apiPost('/api/equipements/carburant/', { equipement: parseInt(document.getElementById('carbEq').value), quantite_litres: parseFloat(document.getElementById('carbLitres').value), cout_total: parseFloat(document.getElementById('carbCout').value), heures_moteur_au_plein: parseFloat(document.getElementById('carbHeures').value) || 0, km_au_plein: parseFloat(document.getElementById('carbKm').value) || 0, station: document.getElementById('carbStation')?.value || '', date_plein: document.getElementById('carbDate').value }); modal.remove(); navigateTo('equipements'); } catch(err) { document.getElementById('eqCarbError').textContent = err.message; } });
}

async function ouvrirFormulaireEqEquipement(editData = null) {
    const existant = document.getElementById('modalCreation');
    if (existant) existant.remove();

    let categories = [];
    try {
        const r = await apiGet('/api/equipements/categories/');
        categories = Array.isArray(r) ? r : (r.results || []);
    } catch(e) {}

    const titre = editData ? `Modifier ${editData.nom}` : 'Nouvel équipement';
    const endpoint = editData ? `/api/equipements/equipements/${editData.id}/` : '/api/equipements/equipements/';

    const modal = document.createElement('div');
    modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:800px; max-height:90vh; overflow-y:auto;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">${editData ? '✏️' : '➕'} ${titre}</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="eqForm" style="padding:1.5rem;">
                <div class="form-section"><div class="form-section-title">🚜 Identification</div>
                    <div class="form-grid">
                        <div class="form-field"><label>Nom <span class="required">*</span></label><input type="text" id="eqNom" value="${escapeHtml(editData?.nom || '')}" required></div>
                        <div class="form-field"><label>Catégorie</label>
                            <select id="eqCat"><option value="">Aucune</option>${categories.map(c => `<option value="${c.id}" ${editData?.categorie === c.id ? 'selected' : ''}>${escapeHtml(c.nom)}</option>`).join('')}</select>
                        </div>
                        <div class="form-field"><label>Marque</label><input type="text" id="eqMarque" value="${escapeHtml(editData?.marque || '')}"></div>
                        <div class="form-field"><label>Modèle</label><input type="text" id="eqModele" value="${escapeHtml(editData?.modele || '')}"></div>
                        <div class="form-field"><label>N° Série</label><input type="text" id="eqSerie" value="${escapeHtml(editData?.numero_serie || '')}"></div>
                        <div class="form-field"><label>Immatriculation</label><input type="text" id="eqImmat" value="${escapeHtml(editData?.immatriculation || '')}"></div>
                        <div class="form-field"><label>Année fabrication</label><input type="number" id="eqAnnee" value="${editData?.annee_fabrication || ''}"></div>
                        <div class="form-field"><label>Type énergie</label>
                            <select id="eqEnergie">
                                <option value="DIESEL" ${editData?.type_energie === 'DIESEL' ? 'selected' : ''}>Diesel</option>
                                <option value="ESSENCE" ${editData?.type_energie === 'ESSENCE' ? 'selected' : ''}>Essence</option>
                                <option value="ELECTRIQUE" ${editData?.type_energie === 'ELECTRIQUE' ? 'selected' : ''}>Électrique</option>
                                <option value="HYBRIDE" ${editData?.type_energie === 'HYBRIDE' ? 'selected' : ''}>Hybride</option>
                                <option value="MANUEL" ${editData?.type_energie === 'MANUEL' ? 'selected' : ''}>Manuel</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="form-section"><div class="form-section-title">⚙️ Caractéristiques techniques</div>
                    <div class="form-grid">
                        <div class="form-field"><label>Puissance (CV)</label><input type="number" id="eqPuissance" step="0.01" value="${editData?.puissance_cv || ''}"></div>
                        <div class="form-field"><label>Capacité charge (kg)</label><input type="number" id="eqCapacite" step="0.01" value="${editData?.capacite_charge_kg || ''}"></div>
                        <div class="form-field"><label>Consommation moy. (L/h)</label><input type="number" id="eqConso" step="0.01" value="${editData?.consommation_moyenne || ''}"></div>
                        <div class="form-field"><label>Réservoir (L)</label><input type="number" id="eqReservoir" step="0.01" value="${editData?.reservoir_litres || ''}"></div>
                    </div>
                </div>

                <div class="form-section"><div class="form-section-title">💰 Acquisition</div>
                    <div class="form-grid">
                        <div class="form-field"><label>Type acquisition</label>
                            <select id="eqTypeAcq">
                                <option value="ACHAT" ${editData?.type_acquisition === 'ACHAT' ? 'selected' : ''}>Achat</option>
                                <option value="LEASING" ${editData?.type_acquisition === 'LEASING' ? 'selected' : ''}>Leasing</option>
                                <option value="LOCATION_LONGUE" ${editData?.type_acquisition === 'LOCATION_LONGUE' ? 'selected' : ''}>Location longue durée</option>
                                <option value="DON" ${editData?.type_acquisition === 'DON' ? 'selected' : ''}>Don</option>
                            </select>
                        </div>
                        <div class="form-field"><label>Date acquisition <span class="required">*</span></label><input type="date" id="eqDateAcq" value="${editData?.date_acquisition || new Date().toISOString().split('T')[0]}" required></div>
                        <div class="form-field"><label>Prix acquisition</label><input type="number" id="eqPrixAcq" step="0.01" value="${editData?.prix_acquisition || 0}"></div>
                        <div class="form-field"><label>Valeur résiduelle</label><input type="number" id="eqValeurRes" step="0.01" value="${editData?.valeur_residuelle || 0}"></div>
                        <div class="form-field"><label>Amortissement (mois)</label><input type="number" id="eqAmort" value="${editData?.duree_amortissement_mois || 60}"></div>
                        <div class="form-field"><label>Fin garantie</label><input type="date" id="eqGarantie" value="${editData?.date_fin_garantie || ''}"></div>
                    </div>
                </div>

                <div class="form-section"><div class="form-section-title">💲 Tarifs de location</div>
                    <div class="form-grid">
                        <div class="form-field"><label>Tarif horaire</label><input type="number" id="eqTarifH" step="0.01" value="${editData?.tarif_horaire || 0}"></div>
                        <div class="form-field"><label>Tarif journalier</label><input type="number" id="eqTarifJ" step="0.01" value="${editData?.tarif_journalier || 0}"></div>
                        <div class="form-field"><label>Tarif hebdomadaire</label><input type="number" id="eqTarifS" step="0.01" value="${editData?.tarif_hebdomadaire || 0}"></div>
                        <div class="form-field"><label>Tarif mensuel</label><input type="number" id="eqTarifM" step="0.01" value="${editData?.tarif_mensuel || 0}"></div>
                        <div class="form-field"><label>Caution requise</label><input type="number" id="eqCaution" step="0.01" value="${editData?.caution_requise || 0}"></div>
                        <div class="form-field"><label>Devise</label>
                            <select id="eqDevise">
                                <option value="FCFA" ${editData?.devise === 'FCFA' ? 'selected' : ''}>FCFA</option>
                                <option value="EUR" ${editData?.devise === 'EUR' ? 'selected' : ''}>EUR</option>
                                <option value="USD" ${editData?.devise === 'USD' ? 'selected' : ''}>USD</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="form-section"><div class="form-section-title">🏷️ Option d'achat</div>
                    <div class="form-grid">
                        <div class="form-field">
                            <div class="form-checkbox"><input type="checkbox" id="eqOptionAchat" ${editData?.option_achat_disponible ? 'checked' : ''}><label for="eqOptionAchat">Option d'achat disponible</label></div>
                        </div>
                        <div class="form-field"><label>Prix option achat</label><input type="number" id="eqPrixOption" step="0.01" value="${editData?.prix_option_achat || 0}"></div>
                    </div>
                </div>

                <div class="form-section"><div class="form-section-title">🔧 Maintenance</div>
                    <div class="form-grid">
                        <div class="form-field"><label>Seuil maintenance (h)</label><input type="number" id="eqSeuilMaint" step="0.1" value="${editData?.seuil_maintenance_heures || 250}"></div>
                        <div class="form-field"><label>Heures moteur actuelles</label><input type="number" id="eqHeures" step="0.1" value="${editData?.heures_moteur || 0}"></div>
                        <div class="form-field"><label>Kilomètres actuels</label><input type="number" id="eqKm" step="0.1" value="${editData?.kilometres || 0}"></div>
                    </div>
                </div>

                <div class="form-section"><div class="form-section-title">📍 Localisation</div>
                    <div class="form-grid">
                        <div class="form-field"><label>Localisation</label><input type="text" id="eqLocalisation" value="${escapeHtml(editData?.localisation_actuelle || 'Base Douala')}"></div>
                        <div class="form-field"><label>État général</label>
                            <select id="eqEtat">
                                <option value="NEUF" ${editData?.etat_general === 'NEUF' ? 'selected' : ''}>Neuf</option>
                                <option value="EXCELLENT" ${editData?.etat_general === 'EXCELLENT' ? 'selected' : ''}>Excellent</option>
                                <option value="BON" ${editData?.etat_general === 'BON' || !editData ? 'selected' : ''}>Bon</option>
                                <option value="MOYEN" ${editData?.etat_general === 'MOYEN' ? 'selected' : ''}>Moyen</option>
                                <option value="MAUVAIS" ${editData?.etat_general === 'MAUVAIS' ? 'selected' : ''}>Mauvais</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="form-grid">
                    <div class="form-field full-width"><label>Notes</label><textarea id="eqNotes" rows="2">${escapeHtml(editData?.notes || '')}</textarea></div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 ${editData ? 'Enregistrer' : 'Créer'}</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="eqFormError" style="color:var(--danger); text-align:center; white-space:pre-wrap;"></p>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('eqForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const payload = {
                nom: document.getElementById('eqNom').value,
                marque: document.getElementById('eqMarque')?.value || '',
                modele: document.getElementById('eqModele')?.value || '',
                numero_serie: document.getElementById('eqSerie')?.value || '',
                immatriculation: document.getElementById('eqImmat')?.value || '',
                type_energie: document.getElementById('eqEnergie').value,
                type_acquisition: document.getElementById('eqTypeAcq').value,
                date_acquisition: document.getElementById('eqDateAcq').value,
                prix_acquisition: parseFloat(document.getElementById('eqPrixAcq').value) || 0,
                valeur_residuelle: parseFloat(document.getElementById('eqValeurRes').value) || 0,
                duree_amortissement_mois: parseInt(document.getElementById('eqAmort').value) || 60,
                tarif_horaire: parseFloat(document.getElementById('eqTarifH').value) || 0,
                tarif_journalier: parseFloat(document.getElementById('eqTarifJ').value) || 0,
                tarif_hebdomadaire: parseFloat(document.getElementById('eqTarifS').value) || 0,
                tarif_mensuel: parseFloat(document.getElementById('eqTarifM').value) || 0,
                caution_requise: parseFloat(document.getElementById('eqCaution').value) || 0,
                devise: document.getElementById('eqDevise').value,
                option_achat_disponible: document.getElementById('eqOptionAchat').checked,
                prix_option_achat: parseFloat(document.getElementById('eqPrixOption').value) || 0,
                seuil_maintenance_heures: parseFloat(document.getElementById('eqSeuilMaint').value) || 250,
                heures_moteur: parseFloat(document.getElementById('eqHeures').value) || 0,
                kilometres: parseFloat(document.getElementById('eqKm').value) || 0,
                localisation_actuelle: document.getElementById('eqLocalisation')?.value || 'Base Douala',
                etat_general: document.getElementById('eqEtat').value,
                notes: document.getElementById('eqNotes')?.value || ''
            };

            // Champs optionnels numériques
            const annee = document.getElementById('eqAnnee')?.value;
            if (annee) payload.annee_fabrication = parseInt(annee);

            const puissance = document.getElementById('eqPuissance')?.value;
            if (puissance) payload.puissance_cv = parseFloat(puissance);

            const capacite = document.getElementById('eqCapacite')?.value;
            if (capacite) payload.capacite_charge_kg = parseFloat(capacite);

            const conso = document.getElementById('eqConso')?.value;
            if (conso) payload.consommation_moyenne = parseFloat(conso);

            const reservoir = document.getElementById('eqReservoir')?.value;
            if (reservoir) payload.reservoir_litres = parseFloat(reservoir);

            const garantie = document.getElementById('eqGarantie')?.value;
            if (garantie) payload.date_fin_garantie = garantie;

            const catId = document.getElementById('eqCat')?.value;
            if (catId) payload.categorie = parseInt(catId);

            if (editData) {
                await apiPatch(endpoint, payload);
            } else {
                await apiPost(endpoint, payload);
            }
            modal.remove();
            navigateTo('equipements');
        } catch(err) {
            document.getElementById('eqFormError').textContent = err.message;
        }
    });
}
async function editerEqEquipement(id) { try { const e = await apiGet(`/api/equipements/equipements/${id}/`); ouvrirFormulaireEqEquipement(e); } catch(e) { alert(e.message); } }




// ========================================
// CRUD : INTERVENTIONS
// ========================================
async function ouvrirFormulaireEqIntervention(editData = null) {
    const existant = document.getElementById('modalCreation');
    if (existant) existant.remove();

    let equipements = [];
    try {
        const r = await apiGet('/api/equipements/equipements/');
        equipements = Array.isArray(r) ? r : (r.results || []);
    } catch(e) {}

    let plans = [];
    try {
        const r = await apiGet('/api/equipements/plans-maintenance/');
        plans = Array.isArray(r) ? r : (r.results || []);
    } catch(e) {}

    const titre = editData ? `Modifier intervention ${editData.reference}` : 'Nouvelle intervention';
    const endpoint = editData ? `/api/equipements/interventions/${editData.id}/` : '/api/equipements/interventions/';

    const modal = document.createElement('div');
    modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:700px; max-height:90vh; overflow-y:auto;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">${editData ? '✏️' : '➕'} ${titre}</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="eqIntForm" style="padding:1.5rem;">
                <div class="form-section"><div class="form-section-title">🔧 Intervention</div>
                    <div class="form-grid">
                        <div class="form-field full-width">
                            <label>Équipement <span class="required">*</span></label>
                            <select id="intEquipement" required ${editData ? 'disabled' : ''}>
                                <option value="">Sélectionner...</option>
                                ${equipements.map(e => `<option value="${e.id}" ${editData?.equipement === e.id ? 'selected' : ''}>${escapeHtml(e.nom)} (${escapeHtml(e.reference)})</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Type <span class="required">*</span></label>
                            <select id="intType" required>
                                <option value="PREVENTIVE" ${editData?.type_intervention === 'PREVENTIVE' ? 'selected' : ''}>Préventive</option>
                                <option value="CORRECTIVE" ${editData?.type_intervention === 'CORRECTIVE' ? 'selected' : ''}>Corrective</option>
                                <option value="URGENCE" ${editData?.type_intervention === 'URGENCE' ? 'selected' : ''}>Urgence</option>
                                <option value="AMELIORATION" ${editData?.type_intervention === 'AMELIORATION' ? 'selected' : ''}>Amélioration</option>
                                <option value="INSPECTION" ${editData?.type_intervention === 'INSPECTION' ? 'selected' : ''}>Inspection</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Priorité <span class="required">*</span></label>
                            <select id="intPriorite" required>
                                <option value="BASSE" ${editData?.priorite === 'BASSE' ? 'selected' : ''}>Basse</option>
                                <option value="NORMALE" ${editData?.priorite === 'NORMALE' || !editData ? 'selected' : ''}>Normale</option>
                                <option value="HAUTE" ${editData?.priorite === 'HAUTE' ? 'selected' : ''}>Haute</option>
                                <option value="URGENTE" ${editData?.priorite === 'URGENTE' ? 'selected' : ''}>Urgente</option>
                                <option value="CRITIQUE" ${editData?.priorite === 'CRITIQUE' ? 'selected' : ''}>Critique</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Plan maintenance</label>
                            <select id="intPlan">
                                <option value="">Aucun</option>
                                ${plans.map(p => `<option value="${p.id}" ${editData?.plan_maintenance === p.id ? 'selected' : ''}>${escapeHtml(p.nom)} — ${escapeHtml(p.equipement_nom || '')}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Date planifiée</label>
                            <input type="date" id="intDatePlanifiee" value="${editData?.date_planifiee || ''}">
                        </div>
                    </div>
                </div>
                <div class="form-section"><div class="form-section-title">📝 Description</div>
                    <div class="form-grid">
                        <div class="form-field full-width">
                            <label>Description du problème <span class="required">*</span></label>
                            <textarea id="intDescription" rows="3" required>${escapeHtml(editData?.description_probleme || '')}</textarea>
                        </div>
                        <div class="form-field full-width">
                            <label>Diagnostic</label>
                            <textarea id="intDiagnostic" rows="2">${escapeHtml(editData?.diagnostic || '')}</textarea>
                        </div>
                        <div class="form-field full-width">
                            <label>Travaux réalisés</label>
                            <textarea id="intTravaux" rows="2">${escapeHtml(editData?.travaux_realises || '')}</textarea>
                        </div>
                    </div>
                </div>
                <div class="form-section"><div class="form-section-title">💰 Coûts</div>
                    <div class="form-grid">
                        <div class="form-field">
                            <label>Coût pièces</label>
                            <input type="number" id="intCoutPieces" step="0.01" value="${editData?.cout_pieces || 0}">
                        </div>
                        <div class="form-field">
                            <label>Coût main d'oeuvre</label>
                            <input type="number" id="intCoutMO" step="0.01" value="${editData?.cout_main_oeuvre || 0}">
                        </div>
                        <div class="form-field">
                            <label>Prestataire externe</label>
                            <input type="text" id="intPrestataire" value="${escapeHtml(editData?.prestataire_externe || '')}">
                        </div>
                        <div class="form-field">
                            <label>Durée réelle (heures)</label>
                            <input type="number" id="intDuree" step="0.1" value="${editData?.duree_reelle_heures || 0}">
                        </div>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 ${editData ? 'Enregistrer' : 'Créer'}</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="eqIntError" style="color:var(--danger); text-align:center;"></p>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('eqIntForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const payload = {
                type_intervention: document.getElementById('intType').value,
                priorite: document.getElementById('intPriorite').value,
                description_probleme: document.getElementById('intDescription').value,
                diagnostic: document.getElementById('intDiagnostic')?.value || '',
                travaux_realises: document.getElementById('intTravaux')?.value || '',
                cout_pieces: parseFloat(document.getElementById('intCoutPieces').value) || 0,
                cout_main_oeuvre: parseFloat(document.getElementById('intCoutMO').value) || 0,
                prestataire_externe: document.getElementById('intPrestataire')?.value || '',
                duree_reelle_heures: parseFloat(document.getElementById('intDuree').value) || 0,
                date_planifiee: document.getElementById('intDatePlanifiee')?.value || null
            };
            if (!editData) {
                payload.equipement = parseInt(document.getElementById('intEquipement').value);
            }
            const planId = document.getElementById('intPlan')?.value;
            if (planId) payload.plan_maintenance = parseInt(planId);
            if (!payload.date_planifiee) delete payload.date_planifiee;

            if (editData) { await apiPatch(endpoint, payload); } else { await apiPost(endpoint, payload); }
            modal.remove(); navigateTo('equipements');
        } catch (error) { document.getElementById('eqIntError').textContent = error.message; }
    });
}

async function editerEqIntervention(id) {
    try { const i = await apiGet(`/api/equipements/interventions/${id}/`); ouvrirFormulaireEqIntervention(i); }
    catch(e) { alert(e.message); }
}


// ========================================
// CRUD : CERTIFICATIONS
// ========================================
async function ouvrirFormulaireEqCertification(editData = null) {
    const existant = document.getElementById('modalCreation');
    if (existant) existant.remove();

    let equipements = [];
    try {
        const r = await apiGet('/api/equipements/equipements/');
        equipements = Array.isArray(r) ? r : (r.results || []);
    } catch(e) {}

    const titre = editData ? `Modifier certification` : 'Nouvelle certification';
    const endpoint = editData ? `/api/equipements/certifications/${editData.id}/` : '/api/equipements/certifications/';

    const modal = document.createElement('div');
    modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:600px; max-height:90vh; overflow-y:auto;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">${editData ? '✏️' : '➕'} ${titre}</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="eqCertForm" style="padding:1.5rem;">
                <div class="form-grid">
                    <div class="form-field full-width">
                        <label>Équipement <span class="required">*</span></label>
                        <select id="certEquipement" required>
                            <option value="">Sélectionner...</option>
                            ${equipements.map(e => `<option value="${e.id}" ${editData?.equipement === e.id ? 'selected' : ''}>${escapeHtml(e.nom)} (${escapeHtml(e.reference)})</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-field">
                        <label>Type <span class="required">*</span></label>
                        <select id="certType" required>
                            <option value="CONTROLE_TECHNIQUE" ${editData?.type_certification === 'CONTROLE_TECHNIQUE' ? 'selected' : ''}>Contrôle technique</option>
                            <option value="ASSURANCE" ${editData?.type_certification === 'ASSURANCE' ? 'selected' : ''}>Assurance</option>
                            <option value="NORME_SECURITE" ${editData?.type_certification === 'NORME_SECURITE' ? 'selected' : ''}>Norme sécurité</option>
                            <option value="HOMOLOGATION" ${editData?.type_certification === 'HOMOLOGATION' ? 'selected' : ''}>Homologation</option>
                            <option value="CALIBRATION" ${editData?.type_certification === 'CALIBRATION' ? 'selected' : ''}>Calibration</option>
                            <option value="ENVIRONNEMENT" ${editData?.type_certification === 'ENVIRONNEMENT' ? 'selected' : ''}>Environnement</option>
                            <option value="AUTRE" ${editData?.type_certification === 'AUTRE' ? 'selected' : ''}>Autre</option>
                        </select>
                    </div>
                    <div class="form-field">
                        <label>Nom <span class="required">*</span></label>
                        <input type="text" id="certNom" value="${escapeHtml(editData?.nom || '')}" required>
                    </div>
                    <div class="form-field">
                        <label>Organisme</label>
                        <input type="text" id="certOrganisme" value="${escapeHtml(editData?.organisme || '')}">
                    </div>
                    <div class="form-field">
                        <label>N° Certificat</label>
                        <input type="text" id="certNumero" value="${escapeHtml(editData?.numero_certificat || '')}">
                    </div>
                    <div class="form-field">
                        <label>Date obtention <span class="required">*</span></label>
                        <input type="date" id="certDateObtention" value="${editData?.date_obtention || new Date().toISOString().split('T')[0]}" required>
                    </div>
                    <div class="form-field">
                        <label>Date expiration <span class="required">*</span></label>
                        <input type="date" id="certDateExpiration" value="${editData?.date_expiration || ''}" required>
                    </div>
                    <div class="form-field">
                        <label>Coût</label>
                        <input type="number" id="certCout" step="0.01" value="${editData?.cout || 0}">
                    </div>
                    <div class="form-field">
                        <label>Alerte (jours avant)</label>
                        <input type="number" id="certAlerte" value="${editData?.alerte_jours_avant || 30}">
                    </div>
                    <div class="form-field full-width">
                        <label>Notes</label>
                        <textarea id="certNotes" rows="2">${escapeHtml(editData?.notes || '')}</textarea>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 ${editData ? 'Enregistrer' : 'Créer'}</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="eqCertError" style="color:var(--danger); text-align:center;"></p>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('eqCertForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const payload = {
                equipement: parseInt(document.getElementById('certEquipement').value),
                type_certification: document.getElementById('certType').value,
                nom: document.getElementById('certNom').value,
                organisme: document.getElementById('certOrganisme')?.value || '',
                numero_certificat: document.getElementById('certNumero')?.value || '',
                date_obtention: document.getElementById('certDateObtention').value,
                date_expiration: document.getElementById('certDateExpiration').value,
                cout: parseFloat(document.getElementById('certCout').value) || 0,
                alerte_jours_avant: parseInt(document.getElementById('certAlerte').value) || 30,
                notes: document.getElementById('certNotes')?.value || ''
            };
            if (editData) { await apiPatch(endpoint, payload); } else { await apiPost(endpoint, payload); }
            modal.remove(); navigateTo('equipements');
        } catch (error) { document.getElementById('eqCertError').textContent = error.message; }
    });
}

async function editerEqCertification(id) {
    try { const c = await apiGet(`/api/equipements/certifications/${id}/`); ouvrirFormulaireEqCertification(c); }
    catch(e) { alert(e.message); }
}


// ========================================
// CRUD : MOUVEMENTS
// ========================================
async function ouvrirFormulaireEqMouvement() {
    const existant = document.getElementById('modalCreation');
    if (existant) existant.remove();

    let equipements = [];
    try {
        const r = await apiGet('/api/equipements/equipements/');
        equipements = Array.isArray(r) ? r : (r.results || []);
    } catch(e) {}

    const modal = document.createElement('div');
    modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:600px; max-height:90vh; overflow-y:auto;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">➕ Nouveau mouvement</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="eqMvtForm" style="padding:1.5rem;">
                <div class="form-grid">
                    <div class="form-field full-width">
                        <label>Équipement <span class="required">*</span></label>
                        <select id="mvtEquipement" required>
                            <option value="">Sélectionner...</option>
                            ${equipements.map(e => `<option value="${e.id}">${escapeHtml(e.nom)} (${escapeHtml(e.reference)}) — 📍 ${escapeHtml(e.localisation_actuelle || 'N/A')}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-field">
                        <label>Type <span class="required">*</span></label>
                        <select id="mvtType" required>
                            <option value="DEPLACEMENT">Déplacement</option>
                            <option value="SORTIE_BASE">Sortie de base</option>
                            <option value="RETOUR_BASE">Retour à la base</option>
                            <option value="TRANSFERT">Transfert entre sites</option>
                            <option value="LIVRAISON_CLIENT">Livraison chez client</option>
                            <option value="RECUPERATION">Récupération chez client</option>
                        </select>
                    </div>
                    <div class="form-field">
                        <label>Lieu départ <span class="required">*</span></label>
                        <input type="text" id="mvtDepart" required placeholder="Ex: Base Douala">
                    </div>
                    <div class="form-field">
                        <label>Lieu arrivée <span class="required">*</span></label>
                        <input type="text" id="mvtArrivee" required placeholder="Ex: Chantier Kribi">
                    </div>
                    <div class="form-field">
                        <label>Distance (km)</label>
                        <input type="number" id="mvtDistance" step="0.01" value="0">
                    </div>
                    <div class="form-field">
                        <label>Date mouvement <span class="required">*</span></label>
                        <input type="datetime-local" id="mvtDate" value="${new Date().toISOString().slice(0,16)}" required>
                    </div>
                    <div class="form-field full-width">
                        <label>Notes</label>
                        <textarea id="mvtNotes" rows="2"></textarea>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 Enregistrer</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="eqMvtError" style="color:var(--danger); text-align:center;"></p>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('eqMvtForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await apiPost('/api/equipements/mouvements/', {
                equipement: parseInt(document.getElementById('mvtEquipement').value),
                type_mouvement: document.getElementById('mvtType').value,
                lieu_depart: document.getElementById('mvtDepart').value,
                lieu_arrivee: document.getElementById('mvtArrivee').value,
                distance_km: parseFloat(document.getElementById('mvtDistance').value) || 0,
                date_mouvement: document.getElementById('mvtDate').value,
                notes: document.getElementById('mvtNotes')?.value || ''
            });
            modal.remove(); navigateTo('equipements');
        } catch (error) { document.getElementById('eqMvtError').textContent = error.message; }
    });
}


// ========================================
// CRUD : CAPTEURS IoT
// ========================================
async function ouvrirFormulaireEqCapteur(editData = null) {
    const existant = document.getElementById('modalCreation');
    if (existant) existant.remove();

    let equipements = [];
    try {
        const r = await apiGet('/api/equipements/equipements/');
        equipements = Array.isArray(r) ? r : (r.results || []);
    } catch(e) {}

    const titre = editData ? `Modifier capteur ${editData.identifiant}` : 'Nouveau capteur IoT';
    const endpoint = editData ? `/api/equipements/capteurs/${editData.id}/` : '/api/equipements/capteurs/';

    const modal = document.createElement('div');
    modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:650px; max-height:90vh; overflow-y:auto;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">${editData ? '✏️' : '➕'} ${titre}</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="eqCaptForm" style="padding:1.5rem;">
                <div class="form-section"><div class="form-section-title">📡 Capteur</div>
                    <div class="form-grid">
                        <div class="form-field">
                            <label>Identifiant unique <span class="required">*</span></label>
                            <input type="text" id="captId" value="${escapeHtml(editData?.identifiant || '')}" required placeholder="Ex: CAPT-GPS-001">
                        </div>
                        <div class="form-field">
                            <label>Nom <span class="required">*</span></label>
                            <input type="text" id="captNom" value="${escapeHtml(editData?.nom || '')}" required placeholder="Ex: GPS Tracteur 1">
                        </div>
                        <div class="form-field full-width">
                            <label>Équipement <span class="required">*</span></label>
                            <select id="captEquipement" required>
                                <option value="">Sélectionner...</option>
                                ${equipements.map(e => `<option value="${e.id}" ${editData?.equipement === e.id ? 'selected' : ''}>${escapeHtml(e.nom)} (${escapeHtml(e.reference)})</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Type <span class="required">*</span></label>
                            <select id="captType" required>
                                <option value="GPS" ${editData?.type_capteur === 'GPS' ? 'selected' : ''}>Géolocalisation GPS</option>
                                <option value="TEMPERATURE" ${editData?.type_capteur === 'TEMPERATURE' ? 'selected' : ''}>Température</option>
                                <option value="PRESSION" ${editData?.type_capteur === 'PRESSION' ? 'selected' : ''}>Pression</option>
                                <option value="VIBRATION" ${editData?.type_capteur === 'VIBRATION' ? 'selected' : ''}>Vibration</option>
                                <option value="HEURES_MOTEUR" ${editData?.type_capteur === 'HEURES_MOTEUR' ? 'selected' : ''}>Heures moteur</option>
                                <option value="CARBURANT" ${editData?.type_capteur === 'CARBURANT' ? 'selected' : ''}>Niveau carburant</option>
                                <option value="VITESSE" ${editData?.type_capteur === 'VITESSE' ? 'selected' : ''}>Vitesse</option>
                                <option value="REGIME_MOTEUR" ${editData?.type_capteur === 'REGIME_MOTEUR' ? 'selected' : ''}>Régime moteur</option>
                                <option value="BATTERIE" ${editData?.type_capteur === 'BATTERIE' ? 'selected' : ''}>Batterie</option>
                                <option value="DIAGNOSTIC" ${editData?.type_capteur === 'DIAGNOSTIC' ? 'selected' : ''}>Diagnostic OBD</option>
                                <option value="AUTRE" ${editData?.type_capteur === 'AUTRE' ? 'selected' : ''}>Autre</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Unité de mesure</label>
                            <input type="text" id="captUnite" value="${escapeHtml(editData?.unite_mesure || '')}" placeholder="Ex: °C, bar, km/h">
                        </div>
                    </div>
                </div>
                <div class="form-section"><div class="form-section-title">⚠️ Seuils d'alerte</div>
                    <div class="form-grid">
                        <div class="form-field"><label>Seuil min</label><input type="number" id="captSeuilMin" step="0.01" value="${editData?.seuil_min || ''}"></div>
                        <div class="form-field"><label>Seuil max</label><input type="number" id="captSeuilMax" step="0.01" value="${editData?.seuil_max || ''}"></div>
                        <div class="form-field"><label>Seuil critique min</label><input type="number" id="captCritMin" step="0.01" value="${editData?.seuil_critique_min || ''}"></div>
                        <div class="form-field"><label>Seuil critique max</label><input type="number" id="captCritMax" step="0.01" value="${editData?.seuil_critique_max || ''}"></div>
                        <div class="form-field"><label>Fréquence lecture (sec)</label><input type="number" id="captFrequence" value="${editData?.frequence_lecture_secondes || 300}"></div>
                        <div class="form-field"><label>Date installation</label><input type="date" id="captDateInstall" value="${editData?.date_installation || ''}"></div>
                    </div>
                </div>
                <div class="form-checkbox">
                    <input type="checkbox" id="captActif" ${editData?.est_actif !== false ? 'checked' : ''}>
                    <label for="captActif">Capteur actif</label>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 ${editData ? 'Enregistrer' : 'Créer'}</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="eqCaptError" style="color:var(--danger); text-align:center;"></p>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('eqCaptForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const payload = {
                identifiant: document.getElementById('captId').value,
                nom: document.getElementById('captNom').value,
                equipement: parseInt(document.getElementById('captEquipement').value),
                type_capteur: document.getElementById('captType').value,
                unite_mesure: document.getElementById('captUnite')?.value || '',
                frequence_lecture_secondes: parseInt(document.getElementById('captFrequence').value) || 300,
                est_actif: document.getElementById('captActif').checked
            };
            const fields = {seuil_min:'captSeuilMin', seuil_max:'captSeuilMax', seuil_critique_min:'captCritMin', seuil_critique_max:'captCritMax'};
            for (const [key, id] of Object.entries(fields)) {
                const val = document.getElementById(id)?.value;
                if (val !== '' && val !== undefined) payload[key] = parseFloat(val);
            }
            const dateInstall = document.getElementById('captDateInstall')?.value;
            if (dateInstall) payload.date_installation = dateInstall;

            if (editData) { await apiPatch(endpoint, payload); } else { await apiPost(endpoint, payload); }
            modal.remove(); navigateTo('equipements');
        } catch (error) { document.getElementById('eqCaptError').textContent = error.message; }
    });
}

async function editerEqCapteur(id) {
    try { const c = await apiGet(`/api/equipements/capteurs/${id}/`); ouvrirFormulaireEqCapteur(c); }
    catch(e) { alert(e.message); }
}


// ========================================
// CRUD : PLANS MAINTENANCE
// ========================================
async function ouvrirFormulaireEqPlanMaintenance(editData = null) {
    const existant = document.getElementById('modalCreation');
    if (existant) existant.remove();

    let equipements = [];
    try {
        const r = await apiGet('/api/equipements/equipements/');
        equipements = Array.isArray(r) ? r : (r.results || []);
    } catch(e) {}

    const titre = editData ? `Modifier plan` : 'Nouveau plan de maintenance';
    const endpoint = editData ? `/api/equipements/plans-maintenance/${editData.id}/` : '/api/equipements/plans-maintenance/';

    const modal = document.createElement('div');
    modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:600px; max-height:90vh; overflow-y:auto;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">${editData ? '✏️' : '➕'} ${titre}</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="eqPlanForm" style="padding:1.5rem;">
                <div class="form-grid">
                    <div class="form-field full-width">
                        <label>Équipement <span class="required">*</span></label>
                        <select id="planEquipement" required>
                            <option value="">Sélectionner...</option>
                            ${equipements.map(e => `<option value="${e.id}" ${editData?.equipement === e.id ? 'selected' : ''}>${escapeHtml(e.nom)} (${escapeHtml(e.reference)})</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-field full-width">
                        <label>Nom du plan <span class="required">*</span></label>
                        <input type="text" id="planNom" value="${escapeHtml(editData?.nom || '')}" required placeholder="Ex: Vidange moteur">
                    </div>
                    <div class="form-field full-width">
                        <label>Description</label>
                        <textarea id="planDesc" rows="2">${escapeHtml(editData?.description || '')}</textarea>
                    </div>
                    <div class="form-field">
                        <label>Type fréquence</label>
                        <select id="planFrequence">
                            <option value="HEURES" ${editData?.type_frequence === 'HEURES' ? 'selected' : ''}>Heures moteur</option>
                            <option value="KILOMETRES" ${editData?.type_frequence === 'KILOMETRES' ? 'selected' : ''}>Kilomètres</option>
                            <option value="CALENDAIRE" ${editData?.type_frequence === 'CALENDAIRE' ? 'selected' : ''}>Calendaire</option>
                        </select>
                    </div>
                    <div class="form-field">
                        <label>Seuil heures</label>
                        <input type="number" id="planSeuilH" step="0.1" value="${editData?.seuil_heures || 250}">
                    </div>
                    <div class="form-field">
                        <label>Seuil km</label>
                        <input type="number" id="planSeuilKm" step="0.1" value="${editData?.seuil_km || 0}">
                    </div>
                    <div class="form-field">
                        <label>Périodicité</label>
                        <select id="planPeriodicite">
                            <option value="">Aucune</option>
                            <option value="HEBDOMADAIRE" ${editData?.periodicite === 'HEBDOMADAIRE' ? 'selected' : ''}>Hebdomadaire</option>
                            <option value="MENSUEL" ${editData?.periodicite === 'MENSUEL' ? 'selected' : ''}>Mensuel</option>
                            <option value="TRIMESTRIEL" ${editData?.periodicite === 'TRIMESTRIEL' ? 'selected' : ''}>Trimestriel</option>
                            <option value="SEMESTRIEL" ${editData?.periodicite === 'SEMESTRIEL' ? 'selected' : ''}>Semestriel</option>
                            <option value="ANNUEL" ${editData?.periodicite === 'ANNUEL' ? 'selected' : ''}>Annuel</option>
                        </select>
                    </div>
                    <div class="form-field">
                        <label>Coût estimé</label>
                        <input type="number" id="planCout" step="0.01" value="${editData?.cout_estime || 0}">
                    </div>
                    <div class="form-field full-width">
                        <label>Pièces nécessaires</label>
                        <textarea id="planPieces" rows="2">${escapeHtml(editData?.pieces_necessaires || '')}</textarea>
                    </div>
                </div>
                <div class="form-checkbox">
                    <input type="checkbox" id="planActif" ${editData?.est_actif !== false ? 'checked' : ''}>
                    <label for="planActif">Plan actif</label>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 ${editData ? 'Enregistrer' : 'Créer'}</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="eqPlanError" style="color:var(--danger); text-align:center;"></p>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('eqPlanForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const payload = {
                equipement: parseInt(document.getElementById('planEquipement').value),
                nom: document.getElementById('planNom').value,
                description: document.getElementById('planDesc')?.value || '',
                type_frequence: document.getElementById('planFrequence').value,
                seuil_heures: parseFloat(document.getElementById('planSeuilH').value) || 250,
                seuil_km: parseFloat(document.getElementById('planSeuilKm').value) || 0,
                cout_estime: parseFloat(document.getElementById('planCout').value) || 0,
                pieces_necessaires: document.getElementById('planPieces')?.value || '',
                est_actif: document.getElementById('planActif').checked
            };
            const periodicite = document.getElementById('planPeriodicite')?.value;
            if (periodicite) payload.periodicite = periodicite;

            if (editData) { await apiPatch(endpoint, payload); } else { await apiPost(endpoint, payload); }
            modal.remove(); navigateTo('equipements');
        } catch (error) { document.getElementById('eqPlanError').textContent = error.message; }
    });
}

async function editerEqPlanMaintenance(id) {
    try { const p = await apiGet(`/api/equipements/plans-maintenance/${id}/`); ouvrirFormulaireEqPlanMaintenance(p); }
    catch(e) { alert(e.message); }
}


// ========================================
// CRUD : CYCLE DE VIE
// ========================================
async function ouvrirFormulaireEqCycleVie() {
    const existant = document.getElementById('modalCreation');
    if (existant) existant.remove();

    let equipements = [];
    try {
        const r = await apiGet('/api/equipements/equipements/');
        equipements = Array.isArray(r) ? r : (r.results || []);
    } catch(e) {}

    const modal = document.createElement('div');
    modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:550px; max-height:90vh; overflow-y:auto;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">➕ Événement cycle de vie</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="eqCycleForm" style="padding:1.5rem;">
                <div class="form-grid">
                    <div class="form-field full-width">
                        <label>Équipement <span class="required">*</span></label>
                        <select id="cycleEquipement" required>
                            <option value="">Sélectionner...</option>
                            ${equipements.map(e => `<option value="${e.id}">${escapeHtml(e.nom)} (${escapeHtml(e.reference)})</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-field">
                        <label>Événement <span class="required">*</span></label>
                        <select id="cycleEvenement" required>
                            <option value="ACQUISITION">Acquisition</option>
                            <option value="MISE_EN_SERVICE">Mise en service</option>
                            <option value="RENOVATION">Rénovation majeure</option>
                            <option value="RECLASSEMENT">Reclassement</option>
                            <option value="MISE_AU_REBUT">Mise au rebut</option>
                            <option value="VENTE">Vente / Cession</option>
                            <option value="OPTION_ACHAT">Option d'achat exercée</option>
                            <option value="RETOUR_LEASING">Retour de leasing</option>
                        </select>
                    </div>
                    <div class="form-field">
                        <label>Date <span class="required">*</span></label>
                        <input type="date" id="cycleDate" value="${new Date().toISOString().split('T')[0]}" required>
                    </div>
                    <div class="form-field">
                        <label>Montant</label>
                        <input type="number" id="cycleMontant" step="0.01" value="0">
                    </div>
                    <div class="form-field">
                        <label>Acquéreur</label>
                        <input type="text" id="cycleAcquereur" placeholder="En cas de vente/cession">
                    </div>
                    <div class="form-field full-width">
                        <label>Description <span class="required">*</span></label>
                        <textarea id="cycleDesc" rows="3" required></textarea>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 Enregistrer</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="eqCycleError" style="color:var(--danger); text-align:center;"></p>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('eqCycleForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const payload = {
                equipement: parseInt(document.getElementById('cycleEquipement').value),
                evenement: document.getElementById('cycleEvenement').value,
                date_evenement: document.getElementById('cycleDate').value,
                montant: parseFloat(document.getElementById('cycleMontant').value) || 0,
                description: document.getElementById('cycleDesc').value
            };
            const acquereur = document.getElementById('cycleAcquereur')?.value;
            if (acquereur) payload.acquereur = acquereur;

            await apiPost('/api/equipements/cycle-vie/', payload);
            modal.remove(); navigateTo('equipements');
        } catch (error) { document.getElementById('eqCycleError').textContent = error.message; }
    });
}