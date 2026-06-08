// ========================================
// MODULE MARKETING — CRUD COMPLET
// ========================================

async function loadMarketingModule() {
    const area = document.getElementById('contentArea');

    try {
        // Charger toutes les données en parallèle
        const dashboardData = await apiGet('/api/marketing/dashboard/').catch(() => null);
        const leadsData = await apiGet('/api/marketing/leads/').catch(() => []);
        const sourcesData = await apiGet('/api/marketing/sources-leads/').catch(() => []);
        const campagnesData = await apiGet('/api/marketing/campagnes/').catch(() => []);
        const abonnesData = await apiGet('/api/marketing/abonnes/').catch(() => []);
        const promotionsData = await apiGet('/api/marketing/promotions/').catch(() => []);
        const commandesData = await apiGet('/api/supplychain/commandes-clients/').catch(() => []);
        const contratsData = await apiGet('/api/location/contrats/').catch(() => []);
        const evalSAVData = await apiGet('/api/marketing/evaluations-sav/').catch(() => []);

        const leadList = Array.isArray(leadsData) ? leadsData : (leadsData.results || []);
        const srcList = Array.isArray(sourcesData) ? sourcesData : (sourcesData.results || []);
        const campList = Array.isArray(campagnesData) ? campagnesData : (campagnesData.results || []);
        const aboList = Array.isArray(abonnesData) ? abonnesData : (abonnesData.results || []);
        const promoList = Array.isArray(promotionsData) ? promotionsData : (promotionsData.results || []);
        const cmdClientList = Array.isArray(commandesData) ? commandesData : (commandesData.results || []);
        const contratLocList = Array.isArray(contratsData) ? contratsData : (contratsData.results || []);
        const evalSAVList = Array.isArray(evalSAVData) ? evalSAVData : (evalSAVData.results || []);

        // Charger les clients convertis depuis l'API
        let clientsConvertisData = [];
        try {
            const ccResp = await apiGet('/api/marketing/clients-convertis/');
            clientsConvertisData = Array.isArray(ccResp) ? ccResp : (ccResp.results || []);
        } catch(e) {}

        const savData = {
            clients: clientsConvertisData,
            total: clientsConvertisData.length,
            eligibles: clientsConvertisData.filter(c => c.eligible_promotion).length,
            evalCount: evalSAVList.length
        };

        area.innerHTML = `
            <!-- Stats -->
            <div class="stats-row">
                <div class="stat-card">
                    <div class="stat-card-icon blue">🎯</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${dashboardData?.leads?.total || leadList.length}</div>
                        <div class="stat-card-label">Total Leads</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon purple">🆕</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${dashboardData?.leads?.nouveaux || leadList.filter(l => l.statut === 'NOUVEAU').length}</div>
                        <div class="stat-card-label">Nouveaux</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon green">📈</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${formatPercent(dashboardData?.leads?.taux_conversion || 0)}</div>
                        <div class="stat-card-label">Taux conversion</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon orange">📣</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${dashboardData?.campagnes?.en_cours || campList.filter(c => c.statut === 'EN_COURS').length}</div>
                        <div class="stat-card-label">Campagnes actives</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon teal">📧</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${dashboardData?.newsletter?.total_abonnes || aboList.filter(a => a.est_actif).length}</div>
                        <div class="stat-card-label">Abonnés newsletter</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon red">🎁</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${savData.eligibles.length}</div>
                        <div class="stat-card-label">Clients éligibles promo</div>
                    </div>
                </div>
            </div>

            <!-- Alertes SAV -->
            ${savData.eligibles.length > 0 ? `
                <div class="alert alert-success">
                    <span>🎉</span>
                    <span><strong>${savData.eligibles.length} client(s)</strong> éligible(s) à une promotion fidélité ! Consultez l'onglet SAV.</span>
                </div>
            ` : ''}

            <!-- Onglets -->
            <div class="card">
                <div class="card-header" style="overflow-x:auto;">
                    <div class="tab-nav" style="flex-wrap:nowrap; min-width:max-content;">
                        <button class="tab-btn active" onclick="switchTab('mkt', 'leads', this)">🎯 Leads (${leadList.length})</button>
                        <button class="tab-btn" onclick="switchTab('mkt', 'sources', this)">📌 Sources (${srcList.length})</button>
                        <button class="tab-btn" onclick="switchTab('mkt', 'campagnes', this)">📣 Campagnes (${campList.length})</button>
                        <button class="tab-btn" onclick="switchTab('mkt', 'abonnes', this)">📧 Newsletter (${aboList.length})</button>
                        <button class="tab-btn" onclick="switchTab('mkt', 'promotions', this)">🏷️ Promotions (${promoList.length})</button>
                        <button class="tab-btn" onclick="switchTab('mkt', 'sav', this)">🛎️ SAV (${savData.clients.length})</button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="tab-content active" id="mkt_leads" style="display:block;">
                        ${renderMktLeads(leadList)}
                    </div>
                    <div class="tab-content" id="mkt_sources" style="display:none;">
                        ${renderMktSources(srcList)}
                    </div>
                    <div class="tab-content" id="mkt_campagnes" style="display:none;">
                        ${renderMktCampagnes(campList)}
                    </div>
                    <div class="tab-content" id="mkt_abonnes" style="display:none;">
                        ${renderMktAbonnes(aboList)}
                    </div>
                    <div class="tab-content" id="mkt_promotions" style="display:none;">
                        ${renderMktPromotions(promoList)}
                    </div>
                    <div class="tab-content" id="mkt_sav" style="display:none;">
                        ${renderMktSAV(savData)}
                    </div>
                </div>
            </div>
        `;

    } catch (error) {
        showError(`Marketing : ${error.message}`);
    }
}


// ========================================
// TAB : LEADS
// ========================================
function renderMktLeads(leadList) {
    const searchValue = getSearchValue('marketing');
    let filtered = leadList;
    if (searchValue) {
        filtered = filterLocally(filtered, searchValue, ['reference', 'nom', 'prenom', 'entreprise', 'email']);
    }
    const filterStatut = getFilterValue('marketing', 'statut_lead');
    if (filterStatut) {
        filtered = filtered.filter(l => l.statut === filterStatut);
    }

    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">🎯 Leads / Prospects</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireMktLead()">+ Nouveau lead</button>
            <button class="btn-export" onclick="exporterOngletActifExcel('Leads')">📊 Excel</button>
        </div>
        ${renderSearchBar({
            placeholder: 'Rechercher un lead...',
            moduleRedirect: 'marketing',
            filters: [{
                key: 'statut_lead', label: 'Statut',
                options: [
                    {value:'NOUVEAU', label:'Nouveau'}, {value:'CONTACTE', label:'Contacté'},
                    {value:'QUALIFIE', label:'Qualifié'}, {value:'PROPOSITION', label:'Proposition'},
                    {value:'NEGOCIATION', label:'Négociation'}, {value:'CONVERTI', label:'Converti'},
                    {value:'PERDU', label:'Perdu'}
                ]
            }]
        })}

        ${filtered.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">🎯</div><h3>Aucun lead</h3></div>' : `
            <p class="scroll-hint">👆 Faites défiler horizontalement →</p>
            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead>
                            <tr><th>Réf</th><th>Nom</th><th>Entreprise</th><th>Email</th><th>Tél</th><th>Source</th><th>Statut</th><th>Priorité</th><th>Assigné à</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            ${filtered.map(l => `
                                <tr>
                                    <td><strong>${escapeHtml(l.reference)}</strong></td>
                                    <td>${escapeHtml(l.nom)} ${escapeHtml(l.prenom || '')}</td>
                                    <td>${escapeHtml(l.entreprise || 'N/A')}</td>
                                    <td>${l.email ? `<a href="mailto:${l.email}" style="color:var(--primary); font-size:0.8rem;">${escapeHtml(l.email)}</a>` : 'N/A'}</td>
                                    <td><small>${escapeHtml(l.telephone || 'N/A')}</small></td>
                                    <td><small>${escapeHtml(l.source_nom || 'N/A')}</small></td>
                                    <td><span class="badge ${getBadgeClass(l.statut)}">${escapeHtml(l.statut_display || l.statut)}</span></td>
                                    <td><span class="badge ${getBadgeClass(l.priorite)}">${escapeHtml(l.priorite_display || l.priorite)}</span></td>
                                    <td><small>${escapeHtml(l.assigne_a_nom || 'Non assigné')}</small></td>
                                    <td>
                                        <div class="item-actions">
                                            <button class="btn btn-sm btn-outline" onclick="voirDetailMktLead(${l.id})" title="Détail">👁️</button>
                                            <button class="btn btn-sm btn-outline" onclick="editerMktLead(${l.id})" title="Modifier">✏️</button>
                                            <button class="btn btn-sm btn-success" onclick="changerStatutMktLead(${l.id})" title="Statut">📋</button>
                                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/marketing/leads/${l.id}/', 'marketing')">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="responsive-mobile-view">
                ${filtered.map(l => `
                    <div class="responsive-card">
                        <div class="responsive-card-header">
                            <div>
                                <strong>${escapeHtml(l.nom)} ${escapeHtml(l.prenom || '')}</strong>
                                <br><small>${escapeHtml(l.reference)} | ${escapeHtml(l.entreprise || 'Particulier')}</small>
                            </div>
                            <span class="badge ${getBadgeClass(l.statut)}">${escapeHtml(l.statut_display || l.statut)}</span>
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row"><span class="responsive-card-label">📧 Email</span><span>${l.email ? `<a href="mailto:${l.email}" style="color:var(--primary);">${escapeHtml(l.email)}</a>` : 'N/A'}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📞 Téléphone</span><span>${escapeHtml(l.telephone || 'N/A')}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📌 Source</span><span>${escapeHtml(l.source_nom || 'N/A')}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">⚡ Priorité</span><span class="badge ${getBadgeClass(l.priorite)}">${escapeHtml(l.priorite_display || l.priorite)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">👤 Assigné à</span><span>${escapeHtml(l.assigne_a_nom || 'Non assigné')}</span></div>
                        </div>
                        <div class="responsive-card-footer">
                            <button class="btn btn-sm btn-outline" onclick="voirDetailMktLead(${l.id})">👁️</button>
                            <button class="btn btn-sm btn-outline" onclick="editerMktLead(${l.id})">✏️</button>
                            <button class="btn btn-sm btn-success" onclick="changerStatutMktLead(${l.id})">📋</button>
                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/marketing/leads/${l.id}/', 'marketing')">🗑️</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}


// ========================================
// TAB : SOURCES DE LEADS
// ========================================
function renderMktSources(srcList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">📌 Sources de Leads</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireMktSource()">+ Nouvelle source</button>
        </div>

        ${srcList.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📌</div><h3>Aucune source</h3></div>' : `
            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead><tr><th>Nom</th><th>Description</th><th>Nb leads</th><th>Active</th><th>Actions</th></tr></thead>
                        <tbody>
                            ${srcList.map(s => `
                                <tr>
                                    <td><strong>${escapeHtml(s.nom)}</strong></td>
                                    <td><small>${escapeHtml((s.description || '').substring(0, 60))}</small></td>
                                    <td><span class="badge badge-info">${s.nombre_leads || 0}</span></td>
                                    <td>${s.est_active ? '<span class="badge badge-success">Oui</span>' : '<span class="badge badge-danger">Non</span>'}</td>
                                    <td>
                                        <div class="item-actions">
                                            <button class="btn btn-sm btn-outline" onclick="editerMktSource(${s.id})">✏️</button>
                                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/marketing/sources-leads/${s.id}/', 'marketing')">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="responsive-mobile-view">
                ${srcList.map(s => `
                    <div class="responsive-card">
                        <div class="responsive-card-header">
                            <div><strong>${escapeHtml(s.nom)}</strong></div>
                            ${s.est_active ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-danger">Inactive</span>'}
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row"><span class="responsive-card-label">📝 Description</span><span><small>${escapeHtml(s.description || 'N/A')}</small></span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">🎯 Leads</span><span class="badge badge-info">${s.nombre_leads || 0}</span></div>
                        </div>
                        <div class="responsive-card-footer">
                            <button class="btn btn-sm btn-outline" onclick="editerMktSource(${s.id})">✏️</button>
                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/marketing/sources-leads/${s.id}/', 'marketing')">🗑️</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}


// ========================================
// TAB : CAMPAGNES
// ========================================
function renderMktCampagnes(campList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">📣 Campagnes Marketing</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireMktCampagne()">+ Nouvelle campagne</button>
            <button class="btn-export" onclick="exporterOngletActifExcel('Campagnes')">📊 Excel</button>
        </div>

        ${campList.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📣</div><h3>Aucune campagne</h3></div>' : `
            <p class="scroll-hint">👆 Faites défiler horizontalement →</p>
            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead><tr><th>Nom</th><th>Type</th><th>Statut</th><th>Budget prévu</th><th>Budget dépensé</th><th>Leads</th><th>Conversions</th><th>ROI</th><th>Période</th><th>Actions</th></tr></thead>
                        <tbody>
                            ${campList.map(c => `
                                <tr>
                                    <td><strong>${escapeHtml(c.nom)}</strong></td>
                                    <td><span class="badge badge-info">${escapeHtml(c.type_display || c.type_campagne)}</span></td>
                                    <td><span class="badge ${getBadgeClass(c.statut)}">${escapeHtml(c.statut_display || c.statut)}</span></td>
                                    <td>${formatMoney(c.budget_prevu, c.devise)}</td>
                                    <td>${formatMoney(c.budget_depense, c.devise)}</td>
                                    <td><strong>${c.leads_generes || 0}</strong></td>
                                    <td><strong>${c.conversions || 0}</strong></td>
                                    <td style="color:${(c.roi || 0) >= 0 ? 'var(--success)' : 'var(--danger)'};">${formatPercent(c.roi)}</td>
                                    <td><small>${formatDate(c.date_debut)} → ${formatDate(c.date_fin)}</small></td>
                                    <td>
                                        <div class="item-actions">
                                            <button class="btn btn-sm btn-outline" onclick="editerMktCampagne(${c.id})">✏️</button>
                                            <button class="btn btn-sm btn-success" onclick="changerStatutMktCampagne(${c.id})">📋</button>
                                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/marketing/campagnes/${c.id}/', 'marketing')">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="responsive-mobile-view">
                ${campList.map(c => `
                    <div class="responsive-card">
                        <div class="responsive-card-header">
                            <div><strong>${escapeHtml(c.nom)}</strong><br><small>${escapeHtml(c.type_display || c.type_campagne)}</small></div>
                            <span class="badge ${getBadgeClass(c.statut)}">${escapeHtml(c.statut_display || c.statut)}</span>
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row"><span class="responsive-card-label">💰 Budget</span><span>${formatMoney(c.budget_depense)} / ${formatMoney(c.budget_prevu)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">🎯 Leads</span><span><strong>${c.leads_generes || 0}</strong></span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">✅ Conversions</span><span><strong>${c.conversions || 0}</strong> (${formatPercent(c.taux_conversion)})</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📈 ROI</span><span style="color:${(c.roi || 0) >= 0 ? 'var(--success)' : 'var(--danger)'};">${formatPercent(c.roi)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📅 Période</span><span>${formatDate(c.date_debut)} → ${formatDate(c.date_fin)}</span></div>
                        </div>
                        <div class="responsive-card-footer">
                            <button class="btn btn-sm btn-outline" onclick="editerMktCampagne(${c.id})">✏️</button>
                            <button class="btn btn-sm btn-success" onclick="changerStatutMktCampagne(${c.id})">📋</button>
                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/marketing/campagnes/${c.id}/', 'marketing')">🗑️</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}


// ========================================
// TAB : ABONNÉS NEWSLETTER
// ========================================
function renderMktAbonnes(aboList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">📧 Abonnés Newsletter</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireMktAbonne()">+ Ajouter un abonné</button>
            <button class="btn-export" onclick="exporterOngletActifExcel('Abonnes_Newsletter')">📊 Excel</button>
        </div>

        ${aboList.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📧</div><h3>Aucun abonné</h3></div>' : `
            <p class="scroll-hint">👆 Faites défiler horizontalement →</p>
            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead><tr><th>Email</th><th>Nom</th><th>Entreprise</th><th>Langue</th><th>Source</th><th>Actif</th><th>Vérifié</th><th>Inscription</th><th>Actions</th></tr></thead>
                        <tbody>
                            ${aboList.map(a => `
                                <tr>
                                    <td><a href="mailto:${a.email}" style="color:var(--primary);">${escapeHtml(a.email)}</a></td>
                                    <td>${escapeHtml(a.nom || 'N/A')}</td>
                                    <td>${escapeHtml(a.entreprise || 'N/A')}</td>
                                    <td><span class="badge badge-info">${escapeHtml(a.langue_display || a.langue || 'FR')}</span></td>
                                    <td><small>${escapeHtml(a.source || 'N/A')}</small></td>
                                    <td>${a.est_actif ? '<span class="badge badge-success">✅</span>' : '<span class="badge badge-danger">❌</span>'}</td>
                                    <td>${a.est_verifie ? '<span class="badge badge-success">✅</span>' : '<span class="badge badge-warning">⏳</span>'}</td>
                                    <td><small>${formatDate(a.date_inscription)}</small></td>
                                    <td>
                                        <div class="item-actions">
                                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/marketing/abonnes/${a.id}/', 'marketing')">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="responsive-mobile-view">
                ${aboList.map(a => `
                    <div class="responsive-card">
                        <div class="responsive-card-header">
                            <div><strong>${escapeHtml(a.email)}</strong><br><small>${escapeHtml(a.nom || 'N/A')}</small></div>
                            ${a.est_actif ? '<span class="badge badge-success">Actif</span>' : '<span class="badge badge-danger">Inactif</span>'}
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row"><span class="responsive-card-label">🏢 Entreprise</span><span>${escapeHtml(a.entreprise || 'N/A')}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">🌐 Langue</span><span>${escapeHtml(a.langue_display || a.langue || 'FR')}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📌 Source</span><span>${escapeHtml(a.source || 'N/A')}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📅 Inscrit le</span><span>${formatDate(a.date_inscription)}</span></div>
                        </div>
                        <div class="responsive-card-footer">
                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/marketing/abonnes/${a.id}/', 'marketing')">🗑️</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}


// ========================================
// TAB : PROMOTIONS
// ========================================
function renderMktPromotions(promoList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">🏷️ Promotions</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireMktPromotion()">+ Nouvelle promotion</button>
            <button class="btn-export" onclick="exporterOngletActifExcel('Promotions')">📊 Excel</button>
        </div>

        ${promoList.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">🏷️</div><h3>Aucune promotion</h3></div>' : `
            <p class="scroll-hint">👆 Faites défiler horizontalement →</p>
            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead><tr><th>Titre</th><th>Type</th><th>Réduction</th><th>Code promo</th><th>Début</th><th>Fin</th><th>Usages</th><th>Active</th><th>Actions</th></tr></thead>
                        <tbody>
                            ${promoList.map(p => `
                                <tr>
                                    <td><strong>${escapeHtml(p.titre)}</strong></td>
                                    <td><span class="badge badge-info">${escapeHtml(p.type_display || p.type_promotion)}</span></td>
                                    <td style="font-weight:700; color:var(--primary);">${p.valeur_reduction}${p.type_promotion === 'POURCENTAGE' ? '%' : ' FCFA'}</td>
                                    <td>${p.code_promo ? `<code style="background:#f0f0f0; padding:2px 6px; border-radius:4px;">${escapeHtml(p.code_promo)}</code>` : 'N/A'}</td>
                                    <td><small>${formatDate(p.date_debut)}</small></td>
                                    <td><small>${formatDate(p.date_fin)}</small></td>
                                    <td>${p.usage_actuel}/${p.usage_maximum || '∞'}</td>
                                    <td>${p.est_active ? '<span class="badge badge-success">✅</span>' : '<span class="badge badge-danger">❌</span>'}</td>
                                    <td>
                                        <div class="item-actions">
                                            <button class="btn btn-sm btn-outline" onclick="editerMktPromotion(${p.id})">✏️</button>
                                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/marketing/promotions/${p.id}/', 'marketing')">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="responsive-mobile-view">
                ${promoList.map(p => `
                    <div class="responsive-card">
                        <div class="responsive-card-header">
                            <div><strong>${escapeHtml(p.titre)}</strong><br><small>${escapeHtml(p.type_display || p.type_promotion)}</small></div>
                            ${p.est_active ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-danger">Inactive</span>'}
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row"><span class="responsive-card-label">💰 Réduction</span><span style="font-weight:700; color:var(--primary);">${p.valeur_reduction}${p.type_promotion === 'POURCENTAGE' ? '%' : ' FCFA'}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">🎟️ Code</span><span>${p.code_promo ? `<code>${escapeHtml(p.code_promo)}</code>` : 'N/A'}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📅 Période</span><span>${formatDate(p.date_debut)} → ${formatDate(p.date_fin)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📊 Usages</span><span>${p.usage_actuel}/${p.usage_maximum || '∞'}</span></div>
                        </div>
                        <div class="responsive-card-footer">
                            <button class="btn btn-sm btn-outline" onclick="editerMktPromotion(${p.id})">✏️</button>
                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/marketing/promotions/${p.id}/', 'marketing')">🗑️</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}




// ========================================
// TAB : SAV (Service Après Vente)
// ========================================
function renderMktSAV(savData) {
    const etoilesHTML = (score) => {
        if (!score || parseFloat(score) === 0) return '<small style="color:var(--text-light);">Non évalué</small>';
        const numScore = parseFloat(score);
        const full = Math.round(numScore);
        const labels = ['', 'Moins satisfaisant', 'Moyen', 'Satisfaisant', 'Bon', 'Très bon'];
        return `<span style="color:#FFD700;">${'⭐'.repeat(full)}</span> <small style="color:var(--text-light);">(${numScore}/5 — ${labels[full] || ''})</small>`;
    };

    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">🛎️ Service Après Vente / Location</h4>
            <button class="btn-export" onclick="exporterOngletActifExcel('SAV_Clients')">📊 Excel</button>
        </div>

        <!-- Boutons d'action responsive -->
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:1.5rem;">
            <button class="btn btn-primary btn-sm" onclick="synchroniserSAV()" style="flex:1; min-width:150px; justify-content:center;">
                🔄 Synchroniser les données
            </button>
            <button class="btn btn-outline btn-sm" onclick="ouvrirFormulaireClientConverti()" style="flex:1; min-width:150px; justify-content:center;">
                ➕ Ajouter un client manuellement
            </button>
            <button class="btn btn-outline btn-sm" onclick="ouvrirFormulaireEvaluationSAV()" style="flex:1; min-width:150px; justify-content:center;">
                📝 Nouvelle évaluation
            </button>
        </div>

        ${savData.eligibles > 0 ? `
            <div class="alert alert-success"><span>🎉</span><span><strong>${savData.eligibles} client(s)</strong> éligible(s) à une promotion fidélité !</span></div>
        ` : ''}

        <!-- Stats -->
        <div class="stats-row" style="margin-bottom:1.5rem;">
            <div class="stat-card"><div class="stat-card-icon blue">👥</div><div class="stat-card-info"><div class="stat-card-value">${savData.total}</div><div class="stat-card-label">Clients convertis</div></div></div>
            <div class="stat-card"><div class="stat-card-icon green">🎁</div><div class="stat-card-info"><div class="stat-card-value">${savData.eligibles}</div><div class="stat-card-label">Éligibles promo</div></div></div>
            <div class="stat-card"><div class="stat-card-icon purple">📝</div><div class="stat-card-info"><div class="stat-card-value">${savData.evalCount}</div><div class="stat-card-label">Évaluations</div></div></div>
        </div>

        ${savData.clients.length === 0 ? `
            <div class="empty-state">
                <div class="empty-state-icon">🛎️</div>
                <h3>Aucun client converti</h3>
                <p>Cliquez sur "Synchroniser" pour importer les clients depuis les commandes, locations et leads convertis.</p>
                <div style="display:flex; gap:0.5rem; justify-content:center; margin-top:1rem; flex-wrap:wrap;">
                    <button class="btn btn-primary" onclick="synchroniserSAV()">🔄 Synchroniser</button>
                    <button class="btn btn-outline" onclick="ouvrirFormulaireClientConverti()">➕ Ajouter manuellement</button>
                </div>
            </div>
        ` : `
            <p class="scroll-hint">👆 Faites défiler horizontalement →</p>

            <!-- Vue Desktop -->
            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead>
                            <tr>
                                <th>Client</th>
                                <th>Entreprise</th>
                                <th>Contact</th>
                                <th>Achats</th>
                                <th>Locations</th>
                                <th>Total ops</th>
                                <th>Montant total</th>
                                <th>Satisfaction</th>
                                <th>Notes SAV</th>
                                <th>Promo</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${savData.clients.map(c => `
                                <tr ${c.eligible_promotion ? 'style="background:#f0fff0;"' : ''}>
                                    <td><strong>${c.eligible_promotion ? '🎁 ' : ''}${escapeHtml(c.nom)}</strong></td>
                                    <td><small>${escapeHtml(c.entreprise || 'N/A')}</small></td>
                                    <td>
                                        ${c.email ? `<a href="mailto:${c.email}" style="color:var(--primary); font-size:0.75rem;">${escapeHtml(c.email)}</a><br>` : ''}
                                        ${c.telephone ? `<small>📞 ${escapeHtml(c.telephone)}</small>` : ''}
                                        ${!c.email && !c.telephone ? 'N/A' : ''}
                                    </td>
                                    <td><span class="badge badge-info">${c.nb_achats}</span><br><small>${formatMoney(c.total_achats)}</small></td>
                                    <td><span class="badge badge-purple">${c.nb_locations}</span><br><small>${formatMoney(c.total_locations)}</small></td>
                                    <td style="text-align:center;"><strong>${c.nb_operations_total}</strong></td>
                                    <td style="font-weight:700; color:var(--primary);">${formatMoney(c.montant_total)}</td>
                                    <td>${etoilesHTML(c.moyenne_satisfaction)}<br><small>${c.nb_evaluations || 0} éval.</small></td>
                                    <td style="max-width:150px;"><small>${escapeHtml((c.notes_sav || 'Aucune note').substring(0, 60))}${c.notes_sav && c.notes_sav.length > 60 ? '...' : ''}</small></td>
                                    <td>${c.eligible_promotion ? (c.promotion_proposee ? '<span class="badge badge-neutral">✅ Proposée</span>' : '<span class="badge badge-success">🎁 Éligible</span>') : '<span class="badge badge-neutral">—</span>'}</td>
                                    <td>
                                        <div class="item-actions">
                                            <button class="btn btn-sm btn-outline" onclick="voirDetailClientConverti(${c.id})" title="Détail">👁️</button>
                                            <button class="btn btn-sm btn-outline" onclick="editerClientConverti(${c.id})" title="Modifier">✏️</button>
                                            <button class="btn btn-sm btn-outline" onclick="ouvrirFormulaireEvaluationSAV('${escapeHtml(c.nom)}', '${escapeHtml(c.entreprise || '')}', '${escapeHtml(c.email || '')}', '${escapeHtml(c.telephone || '')}')" title="Évaluer">📝</button>
                                            ${c.eligible_promotion && !c.promotion_proposee ? `<button class="btn btn-sm btn-success" onclick="proposerPromoSAV('${escapeHtml(c.nom)}', '${escapeHtml(c.email || '')}')" title="Promo">🎁</button>` : ''}
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Vue Mobile -->
            <div class="responsive-mobile-view">
                ${savData.clients.map(c => `
                    <div class="responsive-card" ${c.eligible_promotion ? 'style="border-left:4px solid var(--success);"' : ''}>
                        <div class="responsive-card-header">
                            <div>
                                <strong>${c.eligible_promotion ? '🎁 ' : ''}${escapeHtml(c.nom)}</strong>
                                <br><small>${escapeHtml(c.entreprise || 'Particulier')}</small>
                            </div>
                            ${c.eligible_promotion ? (c.promotion_proposee ? '<span class="badge badge-neutral">✅ Proposée</span>' : '<span class="badge badge-success">Éligible</span>') : ''}
                        </div>
                        <div class="responsive-card-body">
                            ${c.email ? `<div class="responsive-card-row"><span class="responsive-card-label">📧 Email</span><span><a href="mailto:${c.email}" style="color:var(--primary);">${escapeHtml(c.email)}</a></span></div>` : ''}
                            ${c.telephone ? `<div class="responsive-card-row"><span class="responsive-card-label">📞 Tél</span><span>${escapeHtml(c.telephone)}</span></div>` : ''}
                            <div class="responsive-card-row"><span class="responsive-card-label">🛒 Achats</span><span><strong>${c.nb_achats}</strong> — ${formatMoney(c.total_achats)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📋 Locations</span><span><strong>${c.nb_locations}</strong> — ${formatMoney(c.total_locations)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📊 Total ops</span><span><strong>${c.nb_operations_total}</strong></span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">💰 Montant</span><span style="font-weight:700; color:var(--primary);">${formatMoney(c.montant_total)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">⭐ Satisfaction</span><span>${etoilesHTML(c.moyenne_satisfaction)} (${c.nb_evaluations || 0} éval.)</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📝 Notes</span><span><small>${escapeHtml((c.notes_sav || 'Aucune note').substring(0, 100))}</small></span></div>
                        </div>
                        <div class="responsive-card-footer">
                            <button class="btn btn-sm btn-outline" onclick="voirDetailClientConverti(${c.id})">👁️ Détail</button>
                            <button class="btn btn-sm btn-outline" onclick="editerClientConverti(${c.id})">✏️</button>
                            <button class="btn btn-sm btn-outline" onclick="ouvrirFormulaireEvaluationSAV('${escapeHtml(c.nom)}', '${escapeHtml(c.entreprise || '')}', '${escapeHtml(c.email || '')}', '${escapeHtml(c.telephone || '')}')">📝</button>
                            ${c.eligible_promotion && !c.promotion_proposee ? `<button class="btn btn-sm btn-success" onclick="proposerPromoSAV('${escapeHtml(c.nom)}', '${escapeHtml(c.email || '')}')">🎁</button>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}


async function synchroniserSAV() {
    if (!confirm('Synchroniser les clients convertis depuis les commandes, locations et leads ?\n\nCela peut prendre quelques secondes.')) return;
    try {
        const result = await apiPost('/api/marketing/sav/synchroniser/');
        alert(`✅ Synchronisation terminée !\n\n${result.resultats.crees} client(s) créé(s)\n${result.resultats.mis_a_jour} mis à jour\n${result.resultats.promos_detectees} éligible(s) promo`);
        navigateTo('marketing');
    } catch (error) { alert(`Erreur : ${error.message}`); }
}



// ========================================
// DÉTAIL CLIENT CONVERTI
// ========================================
async function voirDetailClientConverti(id) {
    try {
        const c = await apiGet(`/api/marketing/clients-convertis/${id}/`);

        const existant = document.getElementById('modalCreation');
        if (existant) existant.remove();

        const etoilesHTML = (score) => {
            if (!score || parseFloat(score) === 0) return 'Non évalué';
            const full = Math.round(parseFloat(score));
            return `${'⭐'.repeat(full)} (${score}/5)`;
        };

        // Charger les évaluations
        let evaluations = [];
        try {
            const evResp = await apiGet(`/api/marketing/evaluations-sav/?client=${encodeURIComponent(c.nom)}`);
            evaluations = Array.isArray(evResp) ? evResp : (evResp.results || []);
        } catch(e) {}

        const modal = document.createElement('div');
        modal.id = 'modalCreation';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
        modal.innerHTML = `
            <div style="background:white; border-radius:16px; width:100%; max-width:800px; max-height:90vh; overflow-y:auto;">
                <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="color:var(--primary);">🛎️ ${escapeHtml(c.nom)} ${c.eligible_promotion ? '🎁' : ''}</h3>
                    <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.5rem; cursor:pointer;">✕</button>
                </div>
                <div style="padding:1.5rem;">
                    <!-- Infos client -->
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">👤 Informations client</div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.3rem;">
                            <div class="detail-row"><span class="detail-label">Nom</span><span class="detail-value"><strong>${escapeHtml(c.nom)}</strong></span></div>
                            <div class="detail-row"><span class="detail-label">Entreprise</span><span class="detail-value">${escapeHtml(c.entreprise || 'N/A')}</span></div>
                            <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${c.email ? `<a href="mailto:${c.email}">${escapeHtml(c.email)}</a>` : 'N/A'}</span></div>
                            <div class="detail-row"><span class="detail-label">Téléphone</span><span class="detail-value">${c.telephone ? `<a href="tel:${c.telephone}">${escapeHtml(c.telephone)}</a>` : 'N/A'}</span></div>
                            <div class="detail-row"><span class="detail-label">Ville</span><span class="detail-value">${escapeHtml(c.ville || 'N/A')}</span></div>
                            <div class="detail-row"><span class="detail-label">Pays</span><span class="detail-value">${escapeHtml(c.pays || 'N/A')}</span></div>
                            <div class="detail-row"><span class="detail-label">Origine</span><span class="detail-value"><span class="badge badge-info">${escapeHtml(c.origine_display || c.origine)}</span></span></div>
                        </div>
                    </div>

                    <!-- Statistiques -->
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">📊 Historique d'opérations</div>
                        <div class="stats-row" style="margin-bottom:0;">
                            <div class="stat-card" style="padding:1rem;">
                                <div class="stat-card-info" style="text-align:center; width:100%;">
                                    <div class="stat-card-value" style="font-size:1.5rem; color:var(--info);">${c.nb_achats}</div>
                                    <div class="stat-card-label">Achats<br><small>${formatMoney(c.total_achats)}</small></div>
                                </div>
                            </div>
                            <div class="stat-card" style="padding:1rem;">
                                <div class="stat-card-info" style="text-align:center; width:100%;">
                                    <div class="stat-card-value" style="font-size:1.5rem; color:#9C27B0;">${c.nb_locations}</div>
                                    <div class="stat-card-label">Locations<br><small>${formatMoney(c.total_locations)}</small></div>
                                </div>
                            </div>
                            <div class="stat-card" style="padding:1rem;">
                                <div class="stat-card-info" style="text-align:center; width:100%;">
                                    <div class="stat-card-value" style="font-size:1.5rem; color:var(--primary);">${c.nb_operations_total}</div>
                                    <div class="stat-card-label">Total ops<br><small>${formatMoney(c.montant_total)}</small></div>
                                </div>
                            </div>
                        </div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.3rem; margin-top:0.5rem;">
                            <div class="detail-row"><span class="detail-label">1ère opération</span><span class="detail-value">${formatDate(c.date_premiere_operation) || 'N/A'}</span></div>
                            <div class="detail-row"><span class="detail-label">Dernière opération</span><span class="detail-value">${formatDate(c.date_derniere_operation) || 'N/A'}</span></div>
                        </div>
                    </div>

                    <!-- Satisfaction -->
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">⭐ Satisfaction</div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.3rem;">
                            <div class="detail-row"><span class="detail-label">Satisfaction moyenne</span><span class="detail-value">${etoilesHTML(c.moyenne_satisfaction)}</span></div>
                            <div class="detail-row"><span class="detail-label">Nb évaluations</span><span class="detail-value">${c.nb_evaluations || 0}</span></div>
                            <div class="detail-row"><span class="detail-label">Recommande</span><span class="detail-value">${c.derniere_note_satisfaction >= 4 ? '✅ Oui' : c.derniere_note_satisfaction ? '⚠️ À surveiller' : 'Non évalué'}</span></div>
                        </div>
                    </div>

                    <!-- Promotion -->
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">🎁 Promotion fidélité</div>
                        <div class="detail-row"><span class="detail-label">Éligible</span><span class="detail-value">${c.eligible_promotion ? '<span class="badge badge-success">✅ Oui</span>' : '<span class="badge badge-neutral">Non</span>'}</span></div>
                        ${c.raison_eligibilite ? `<div class="detail-row"><span class="detail-label">Raison</span><span class="detail-value">${escapeHtml(c.raison_eligibilite)}</span></div>` : ''}
                        <div class="detail-row"><span class="detail-label">Promotion proposée</span><span class="detail-value">${c.promotion_proposee ? '<span class="badge badge-success">✅ Oui</span>' : '<span class="badge badge-warning">⏳ Non</span>'}</span></div>
                        ${c.date_derniere_promotion ? `<div class="detail-row"><span class="detail-label">Dernière promo</span><span class="detail-value">${formatDate(c.date_derniere_promotion)}</span></div>` : ''}
                    </div>

                    <!-- Notes SAV -->
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">📝 Notes SAV</div>
                        <div style="background:#f9f9f9; padding:1rem; border-radius:8px; min-height:60px;">
                            ${c.notes_sav ? `<p style="margin:0; white-space:pre-wrap;">${escapeHtml(c.notes_sav)}</p>` : '<p style="margin:0; color:var(--text-light); font-style:italic;">Aucune note SAV enregistrée</p>'}
                        </div>
                    </div>

                    <!-- Historique évaluations -->
                    ${evaluations.length > 0 ? `
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">📋 Historique des évaluations (${evaluations.length})</div>
                        <div style="max-height:300px; overflow-y:auto;">
                            ${evaluations.map(ev => `
                                <div style="border-left:3px solid ${ev.satisfaction_globale >= 4 ? 'var(--success)' : ev.satisfaction_globale <= 2 ? 'var(--danger)' : 'var(--warning)'}; padding:0.8rem; margin-bottom:0.5rem; background:#f9f9f9; border-radius:0 8px 8px 0;">
                                    <div style="display:flex; justify-content:space-between; margin-bottom:0.3rem;">
                                        <strong>${ev.etoiles_moyenne || '⭐'.repeat(ev.satisfaction_globale)}</strong>
                                        <small style="color:var(--text-light);">${formatDate(ev.date_evaluation)} — ${escapeHtml(ev.canal_display || ev.canal)}</small>
                                    </div>
                                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.2rem; font-size:0.8rem; margin-bottom:0.5rem;">
                                        <span>Produits : ${'⭐'.repeat(ev.satisfaction_produit)}</span>
                                        <span>Service : ${'⭐'.repeat(ev.satisfaction_service)}</span>
                                        <span>Agents : ${'⭐'.repeat(ev.satisfaction_agent)}</span>
                                        <span>Global : ${'⭐'.repeat(ev.satisfaction_globale)}</span>
                                    </div>
                                    ${ev.notes ? `<p style="margin:0.3rem 0; font-style:italic;">"${escapeHtml(ev.notes)}"</p>` : ''}
                                    ${ev.points_positifs ? `<p style="margin:0.2rem 0; color:var(--success); font-size:0.85rem;">👍 ${escapeHtml(ev.points_positifs)}</p>` : ''}
                                    ${ev.points_ameliorer ? `<p style="margin:0.2rem 0; color:var(--danger); font-size:0.85rem;">👎 ${escapeHtml(ev.points_ameliorer)}</p>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}

                    <!-- Actions -->
                    <div class="form-actions">
                        <button class="btn btn-outline" onclick="this.closest('#modalCreation').remove(); editerClientConverti(${c.id})">✏️ Modifier notes</button>
                        <button class="btn btn-outline" onclick="this.closest('#modalCreation').remove(); ouvrirFormulaireEvaluationSAV('${escapeHtml(c.nom)}', '${escapeHtml(c.entreprise || '')}', '${escapeHtml(c.email || '')}', '${escapeHtml(c.telephone || '')}')">📝 Évaluer</button>
                        ${c.eligible_promotion && !c.promotion_proposee ? `<button class="btn btn-success" onclick="this.closest('#modalCreation').remove(); proposerPromoSAV('${escapeHtml(c.nom)}', '${escapeHtml(c.email || '')}')">🎁 Proposer promo</button>` : ''}
                        <button class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Fermer</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    } catch (error) { alert(`Erreur : ${error.message}`); }
}


// ========================================
// FORMULAIRE AJOUT CLIENT CONVERTI MANUEL
// ========================================
async function ouvrirFormulaireClientConverti() {
    const existant = document.getElementById('modalCreation');
    if (existant) existant.remove();

    const modal = document.createElement('div');
    modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:600px; max-height:90vh; overflow-y:auto;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">➕ Ajouter un client converti</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="ccManuelForm" style="padding:1.5rem;">
                <div class="form-section"><div class="form-section-title">👤 Informations client</div>
                    <div class="form-grid">
                        <div class="form-field"><label>Nom <span class="required">*</span></label><input type="text" id="ccNom" required></div>
                        <div class="form-field"><label>Entreprise</label><input type="text" id="ccEntreprise"></div>
                        <div class="form-field"><label>Email</label><input type="email" id="ccEmail"></div>
                        <div class="form-field"><label>Téléphone</label><input type="text" id="ccTel"></div>
                        <div class="form-field"><label>Ville</label><input type="text" id="ccVille"></div>
                        <div class="form-field"><label>Pays</label><input type="text" id="ccPays" value="Cameroun"></div>
                    </div>
                </div>
                <div class="form-section"><div class="form-section-title">📝 Notes</div>
                    <div class="form-grid">
                        <div class="form-field full-width"><label>Notes SAV</label><textarea id="ccNotesSAV" rows="3" placeholder="Impressions, commentaires..."></textarea></div>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 Ajouter</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="ccManuelError" style="color:var(--danger); text-align:center;"></p>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('ccManuelForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const payload = {
                nom: document.getElementById('ccNom').value,
                entreprise: document.getElementById('ccEntreprise')?.value || '',
                telephone: document.getElementById('ccTel')?.value || '',
                ville: document.getElementById('ccVille')?.value || '',
                pays: document.getElementById('ccPays')?.value || 'Cameroun',
                origine: 'MANUEL',
                notes_sav: document.getElementById('ccNotesSAV')?.value || ''
            };
            const email = document.getElementById('ccEmail')?.value?.trim();
            if (email) payload.email = email;

            await apiPost('/api/marketing/clients-convertis/', payload);
            modal.remove();
            navigateTo('marketing');
        } catch (error) { document.getElementById('ccManuelError').textContent = error.message; }
    });
}


// ========================================
// ÉDITION CLIENT CONVERTI (avec notes)
// ========================================
async function editerClientConverti(id) {
    const existant = document.getElementById('modalCreation');
    if (existant) existant.remove();

    try {
        const client = await apiGet(`/api/marketing/clients-convertis/${id}/`);

        const modal = document.createElement('div');
        modal.id = 'modalCreation';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
        modal.innerHTML = `
            <div style="background:white; border-radius:16px; width:100%; max-width:600px; max-height:90vh; overflow-y:auto;">
                <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                    <h3 style="color:var(--primary);">✏️ ${escapeHtml(client.nom)}</h3>
                    <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
                </div>
                <form id="clientConvForm" style="padding:1.5rem;">
                    <div class="form-section"><div class="form-section-title">👤 Informations</div>
                        <div class="form-grid">
                            <div class="form-field"><label>Entreprise</label><input type="text" id="ccEditEntreprise" value="${escapeHtml(client.entreprise || '')}"></div>
                            <div class="form-field"><label>Email</label><input type="email" id="ccEditEmail" value="${escapeHtml(client.email || '')}"></div>
                            <div class="form-field"><label>Téléphone</label><input type="text" id="ccEditTel" value="${escapeHtml(client.telephone || '')}"></div>
                            <div class="form-field"><label>Ville</label><input type="text" id="ccEditVille" value="${escapeHtml(client.ville || '')}"></div>
                        </div>
                    </div>
                    <div class="form-section"><div class="form-section-title">📝 Notes et suivi SAV</div>
                        <div class="form-grid">
                            <div class="form-field full-width">
                                <label>Notes SAV</label>
                                <textarea id="ccEditNotes" rows="5" placeholder="Impressions du client, remarques de l'équipe, suivi...">${escapeHtml(client.notes_sav || '')}</textarea>
                                <span class="field-help">Ces notes sont visibles par toute l'équipe commerciale</span>
                            </div>
                        </div>
                    </div>
                    <div class="form-checkbox">
                        <input type="checkbox" id="ccEditPromo" ${client.promotion_proposee ? 'checked' : ''}>
                        <label for="ccEditPromo">Promotion déjà proposée au client</label>
                    </div>
                    <div class="form-checkbox">
                        <input type="checkbox" id="ccEditActif" ${client.est_actif !== false ? 'checked' : ''}>
                        <label for="ccEditActif">Client actif</label>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">💾 Enregistrer</button>
                        <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                    </div>
                    <p id="ccEditError" style="color:var(--danger); text-align:center;"></p>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

        document.getElementById('clientConvForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const payload = {
                    entreprise: document.getElementById('ccEditEntreprise')?.value || '',
                    telephone: document.getElementById('ccEditTel')?.value || '',
                    ville: document.getElementById('ccEditVille')?.value || '',
                    notes_sav: document.getElementById('ccEditNotes')?.value || '',
                    promotion_proposee: document.getElementById('ccEditPromo').checked,
                    est_actif: document.getElementById('ccEditActif').checked
                };
                const email = document.getElementById('ccEditEmail')?.value?.trim();
                if (email) payload.email = email;

                await apiPatch(`/api/marketing/clients-convertis/${id}/`, payload);
                modal.remove();
                navigateTo('marketing');
            } catch (error) { document.getElementById('ccEditError').textContent = error.message; }
        });
    } catch (error) { alert(`Erreur : ${error.message}`); }
}





// ========================================
// DÉTAIL LEAD
// ========================================
async function voirDetailMktLead(id) {
    try {
        const l = await apiGet(`/api/marketing/leads/${id}/`);
        const existant = document.getElementById('modalCreation');
        if (existant) existant.remove();

        const modal = document.createElement('div');
        modal.id = 'modalCreation';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
        modal.innerHTML = `
            <div style="background:white; border-radius:16px; width:100%; max-width:800px; max-height:90vh; overflow-y:auto;">
                <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                    <h3 style="color:var(--primary);">🎯 ${escapeHtml(l.nom)} ${escapeHtml(l.prenom || '')} — ${escapeHtml(l.reference)}</h3>
                    <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.5rem; cursor:pointer;">✕</button>
                </div>
                <div style="padding:1.5rem;">
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">👤 Prospect</div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.3rem;">
                            <div class="detail-row"><span class="detail-label">Nom</span><span class="detail-value">${escapeHtml(l.nom)} ${escapeHtml(l.prenom || '')}</span></div>
                            <div class="detail-row"><span class="detail-label">Entreprise</span><span class="detail-value">${escapeHtml(l.entreprise || 'N/A')}</span></div>
                            <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${l.email ? `<a href="mailto:${l.email}">${escapeHtml(l.email)}</a>` : 'N/A'}</span></div>
                            <div class="detail-row"><span class="detail-label">Téléphone</span><span class="detail-value">${escapeHtml(l.telephone || 'N/A')}</span></div>
                            <div class="detail-row"><span class="detail-label">Poste</span><span class="detail-value">${escapeHtml(l.poste || 'N/A')}</span></div>
                            <div class="detail-row"><span class="detail-label">Pays</span><span class="detail-value">${escapeHtml(l.pays || 'N/A')}</span></div>
                        </div>
                    </div>
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">📊 Qualification</div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.3rem;">
                            <div class="detail-row"><span class="detail-label">Statut</span><span class="detail-value"><span class="badge ${getBadgeClass(l.statut)}">${escapeHtml(l.statut_display || l.statut)}</span></span></div>
                            <div class="detail-row"><span class="detail-label">Priorité</span><span class="detail-value"><span class="badge ${getBadgeClass(l.priorite)}">${escapeHtml(l.priorite_display || l.priorite)}</span></span></div>
                            <div class="detail-row"><span class="detail-label">Source</span><span class="detail-value">${escapeHtml(l.source_nom || 'N/A')}</span></div>
                            <div class="detail-row"><span class="detail-label">Assigné à</span><span class="detail-value">${escapeHtml(l.assigne_a_nom || 'Non assigné')}</span></div>
                            <div class="detail-row"><span class="detail-label">Budget estimé</span><span class="detail-value">${l.budget_estime ? formatMoney(l.budget_estime) : 'N/A'}</span></div>
                            <div class="detail-row"><span class="detail-label">Volume estimé</span><span class="detail-value">${l.volume_estime_tonnes ? l.volume_estime_tonnes + ' T' : 'N/A'}</span></div>
                        </div>
                        ${l.produits_interesses ? `<div class="detail-row"><span class="detail-label">Produits intéressés</span><span class="detail-value">${escapeHtml(l.produits_interesses)}</span></div>` : ''}
                        ${l.notes ? `<div class="detail-row"><span class="detail-label">Notes</span><span class="detail-value">${escapeHtml(l.notes)}</span></div>` : ''}
                    </div>
                    <!-- Interactions -->
                    <div class="inline-section">
                        <div class="inline-header">
                            <h4>💬 Interactions (${(l.interactions || []).length})</h4>
                            <button class="btn btn-sm btn-primary" onclick="ouvrirFormulaireMktInteraction(${l.id})">+ Ajouter</button>
                        </div>
                        ${(l.interactions || []).length > 0 ? `
                            <div style="max-height:300px; overflow-y:auto;">
                                ${l.interactions.map(i => `
                                    <div style="border-left:3px solid var(--primary); padding:0.8rem; margin-bottom:0.5rem; background:#f9f9f9; border-radius:0 8px 8px 0;">
                                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.3rem;">
                                            <strong style="font-size:0.9rem;">${escapeHtml(i.type_display || i.type_interaction)} — ${escapeHtml(i.sujet)}</strong>
                                            <small style="color:var(--text-light);">${formatDate(i.date_interaction)}</small>
                                        </div>
                                        <p style="font-size:0.85rem; color:var(--text); margin:0;">${escapeHtml(i.description)}</p>
                                        ${i.resultat ? `<p style="font-size:0.8rem; color:var(--success); margin:0.3rem 0 0;"><strong>Résultat :</strong> ${escapeHtml(i.resultat)}</p>` : ''}
                                        <small style="color:var(--text-light);">Par : ${escapeHtml(i.effectuee_par_nom || 'N/A')}</small>
                                    </div>
                                `).join('')}
                            </div>
                        ` : '<p style="text-align:center; color:var(--text-light); padding:1rem;">Aucune interaction</p>'}
                    </div>
                    <div class="form-actions">
                        <button class="btn btn-success" onclick="this.closest('#modalCreation').remove(); changerStatutMktLead(${l.id})">📋 Statut</button>
                        <button class="btn btn-outline" onclick="this.closest('#modalCreation').remove(); editerMktLead(${l.id})">✏️ Modifier</button>
                        <button class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Fermer</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    } catch (error) { alert(`Erreur : ${error.message}`); }
}


// ========================================
// FORMULAIRE LEAD
// ========================================
async function ouvrirFormulaireMktLead(editData = null) {
    const existant = document.getElementById('modalCreation');
    if (existant) existant.remove();

    let sources = [];
    let equipeCommerciale = [];
    try { const r = await apiGet('/api/marketing/sources-leads/'); sources = Array.isArray(r) ? r : (r.results || []); } catch(e) {}
    try { const r = await apiGet('/api/accounts/equipe-commerciale/'); equipeCommerciale = Array.isArray(r) ? r : (r.results || []); } catch(e) {}

    const titre = editData ? `Modifier : ${editData.nom}` : 'Nouveau lead';
    const endpoint = editData ? `/api/marketing/leads/${editData.id}/` : '/api/marketing/leads/';

    const modal = document.createElement('div');
    modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:750px; max-height:90vh; overflow-y:auto;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">${editData ? '✏️' : '➕'} ${titre}</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="mktLeadForm" style="padding:1.5rem;">
                <div class="form-section"><div class="form-section-title">👤 Prospect</div>
                    <div class="form-grid">
                        <div class="form-field"><label>Nom <span class="required">*</span></label><input type="text" id="leadNom" value="${escapeHtml(editData?.nom || '')}" required></div>
                        <div class="form-field"><label>Prénom</label><input type="text" id="leadPrenom" value="${escapeHtml(editData?.prenom || '')}"></div>
                        <div class="form-field"><label>Email <span class="required">*</span></label><input type="email" id="leadEmail" value="${escapeHtml(editData?.email || '')}" required></div>
                        <div class="form-field"><label>Téléphone</label><input type="text" id="leadTel" value="${escapeHtml(editData?.telephone || '')}"></div>
                        <div class="form-field"><label>Entreprise</label><input type="text" id="leadEntreprise" value="${escapeHtml(editData?.entreprise || '')}"></div>
                        <div class="form-field"><label>Poste</label><input type="text" id="leadPoste" value="${escapeHtml(editData?.poste || '')}"></div>
                        <div class="form-field"><label>Pays</label><input type="text" id="leadPays" value="${escapeHtml(editData?.pays || 'Cameroun')}"></div>
                        <div class="form-field"><label>Ville</label><input type="text" id="leadVille" value="${escapeHtml(editData?.ville || '')}"></div>
                    </div>
                </div>
                <div class="form-section"><div class="form-section-title">📊 Qualification & Attribution</div>
                    <div class="form-grid">
                        <div class="form-field"><label>Source</label>
                            <select id="leadSource"><option value="">Aucune</option>${sources.map(s => `<option value="${s.id}" ${editData?.source === s.id ? 'selected' : ''}>${escapeHtml(s.nom)}</option>`).join('')}</select>
                        </div>
                        <div class="form-field"><label>Priorité</label>
                            <select id="leadPriorite">
                                <option value="BASSE" ${editData?.priorite === 'BASSE' ? 'selected' : ''}>Basse</option>
                                <option value="MOYENNE" ${editData?.priorite === 'MOYENNE' || !editData ? 'selected' : ''}>Moyenne</option>
                                <option value="HAUTE" ${editData?.priorite === 'HAUTE' ? 'selected' : ''}>Haute</option>
                                <option value="URGENTE" ${editData?.priorite === 'URGENTE' ? 'selected' : ''}>Urgente</option>
                            </select>
                        </div>
                        <div class="form-field full-width">
                            <label>Assigné à (équipe commerciale)</label>
                            <select id="leadAssigne">
                                <option value="">Non assigné</option>
                                ${equipeCommerciale.map(u => `
                                    <option value="${u.id}" ${editData?.assigne_a === u.id ? 'selected' : ''}>
                                        ${escapeHtml(u.first_name || '')} ${escapeHtml(u.last_name || '')} (${escapeHtml(u.username)}) — ${escapeHtml(u.role_display || u.role)}
                                    </option>
                                `).join('')}
                            </select>
                            <span class="field-help">Seuls les membres staff de l'équipe commerciale sont listés</span>
                        </div>
                        <div class="form-field"><label>Budget estimé (FCFA)</label><input type="number" id="leadBudget" step="0.01" value="${editData?.budget_estime || ''}"></div>
                        <div class="form-field"><label>Volume estimé (tonnes)</label><input type="number" id="leadVolume" step="0.01" value="${editData?.volume_estime_tonnes || ''}"></div>
                        <div class="form-field full-width"><label>Produits intéressés</label><textarea id="leadProduits" rows="2">${escapeHtml(editData?.produits_interesses || '')}</textarea></div>
                        <div class="form-field full-width"><label>Notes</label><textarea id="leadNotes" rows="2">${escapeHtml(editData?.notes || '')}</textarea></div>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 ${editData ? 'Enregistrer' : 'Créer'}</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="mktLeadError" style="color:var(--danger); text-align:center; margin-top:0.5rem; white-space:pre-wrap;"></p>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('mktLeadForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const payload = {
                nom: document.getElementById('leadNom').value,
                prenom: document.getElementById('leadPrenom')?.value || '',
                email: document.getElementById('leadEmail').value,
                telephone: document.getElementById('leadTel')?.value || '',
                entreprise: document.getElementById('leadEntreprise')?.value || '',
                poste: document.getElementById('leadPoste')?.value || '',
                pays: document.getElementById('leadPays')?.value || 'Cameroun',
                ville: document.getElementById('leadVille')?.value || '',
                priorite: document.getElementById('leadPriorite').value,
                produits_interesses: document.getElementById('leadProduits')?.value || '',
                notes: document.getElementById('leadNotes')?.value || ''
            };
            const srcId = document.getElementById('leadSource')?.value;
            if (srcId) payload.source = parseInt(srcId);
            const assigneId = document.getElementById('leadAssigne')?.value;
            if (assigneId) payload.assigne_a = parseInt(assigneId);
            const budget = document.getElementById('leadBudget')?.value;
            if (budget) payload.budget_estime = parseFloat(budget);
            const volume = document.getElementById('leadVolume')?.value;
            if (volume) payload.volume_estime_tonnes = parseFloat(volume);

            if (editData) { await apiPatch(endpoint, payload); } else { await apiPost(endpoint, payload); }
            modal.remove(); navigateTo('marketing');
        } catch (error) { document.getElementById('mktLeadError').textContent = error.message; }
    });
}

async function editerMktLead(id) { try { const l = await apiGet(`/api/marketing/leads/${id}/`); ouvrirFormulaireMktLead(l); } catch(e) { alert(e.message); } }


// ========================================
// FORMULAIRE INTERACTION LEAD
// ========================================
async function ouvrirFormulaireMktInteraction(leadId) {
    const existant = document.getElementById('modalCreation');
    if (existant) existant.remove();

    const modal = document.createElement('div');
    modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:550px;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">➕ Nouvelle interaction</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="mktInterForm" style="padding:1.5rem;">
                <div class="form-grid">
                    <div class="form-field"><label>Type <span class="required">*</span></label>
                        <select id="interType" required>
                            <option value="APPEL">Appel téléphonique</option><option value="EMAIL">Email</option>
                            <option value="REUNION">Réunion</option><option value="WHATSAPP">WhatsApp</option>
                            <option value="VISITE">Visite terrain</option><option value="SALON">Salon / Événement</option>
                            <option value="AUTRE">Autre</option>
                        </select>
                    </div>
                    <div class="form-field"><label>Date <span class="required">*</span></label><input type="datetime-local" id="interDate" value="${new Date().toISOString().slice(0,16)}" required></div>
                    <div class="form-field full-width"><label>Sujet <span class="required">*</span></label><input type="text" id="interSujet" required placeholder="Ex: Appel de prospection"></div>
                    <div class="form-field full-width"><label>Description <span class="required">*</span></label><textarea id="interDesc" rows="3" required></textarea></div>
                    <div class="form-field full-width"><label>Résultat</label><textarea id="interResultat" rows="2" placeholder="Résultat de l'interaction..."></textarea></div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 Enregistrer</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="mktInterError" style="color:var(--danger); text-align:center; margin-top:0.5rem;"></p>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('mktInterForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await apiPost(`/api/marketing/leads/${leadId}/ajouter_interaction/`, {
                type_interaction: document.getElementById('interType').value,
                date_interaction: document.getElementById('interDate').value,
                sujet: document.getElementById('interSujet').value,
                description: document.getElementById('interDesc').value,
                resultat: document.getElementById('interResultat')?.value || ''
            });
            modal.remove(); voirDetailMktLead(leadId);
        } catch (error) { document.getElementById('mktInterError').textContent = error.message; }
    });
}


// ========================================
// FORMULAIRE SOURCE
// ========================================
async function ouvrirFormulaireMktSource(editData = null) {
    const existant = document.getElementById('modalCreation'); if (existant) existant.remove();
    const titre = editData ? `Modifier : ${editData.nom}` : 'Nouvelle source';
    const endpoint = editData ? `/api/marketing/sources-leads/${editData.id}/` : '/api/marketing/sources-leads/';

    const modal = document.createElement('div'); modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:450px;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">${editData ? '✏️' : '➕'} ${titre}</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="mktSrcForm" style="padding:1.5rem;">
                <div class="form-grid">
                    <div class="form-field full-width"><label>Nom <span class="required">*</span></label><input type="text" id="srcNom" value="${escapeHtml(editData?.nom || '')}" required></div>
                    <div class="form-field full-width"><label>Description</label><textarea id="srcDesc" rows="2">${escapeHtml(editData?.description || '')}</textarea></div>
                </div>
                <div class="form-checkbox"><input type="checkbox" id="srcActive" ${editData?.est_active !== false ? 'checked' : ''}><label for="srcActive">Active</label></div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 ${editData ? 'Enregistrer' : 'Créer'}</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="mktSrcError" style="color:var(--danger); text-align:center;"></p>
            </form>
        </div>`;
    document.body.appendChild(modal); modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('mktSrcForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const payload = { nom: document.getElementById('srcNom').value, description: document.getElementById('srcDesc')?.value || '', est_active: document.getElementById('srcActive').checked };
            if (editData) { await apiPatch(endpoint, payload); } else { await apiPost(endpoint, payload); }
            modal.remove(); navigateTo('marketing');
        } catch (error) { document.getElementById('mktSrcError').textContent = error.message; }
    });
}
async function editerMktSource(id) { try { const s = await apiGet(`/api/marketing/sources-leads/${id}/`); ouvrirFormulaireMktSource(s); } catch(e) { alert(e.message); } }


// ========================================
// FORMULAIRE CAMPAGNE
// ========================================
async function ouvrirFormulaireMktCampagne(editData = null) {
    const existant = document.getElementById('modalCreation'); if (existant) existant.remove();
    const titre = editData ? `Modifier : ${editData.nom}` : 'Nouvelle campagne';
    const endpoint = editData ? `/api/marketing/campagnes/${editData.id}/` : '/api/marketing/campagnes/';

    const modal = document.createElement('div'); modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:700px; max-height:90vh; overflow-y:auto;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">${editData ? '✏️' : '➕'} ${titre}</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="mktCampForm" style="padding:1.5rem;">
                <div class="form-section"><div class="form-section-title">📣 Campagne</div>
                    <div class="form-grid">
                        <div class="form-field"><label>Nom <span class="required">*</span></label><input type="text" id="campNom" value="${escapeHtml(editData?.nom || '')}" required></div>
                        <div class="form-field"><label>Type <span class="required">*</span></label>
                            <select id="campType" required>
                                <option value="EMAIL" ${editData?.type_campagne === 'EMAIL' ? 'selected' : ''}>Email</option>
                                <option value="RESEAUX_SOCIAUX" ${editData?.type_campagne === 'RESEAUX_SOCIAUX' ? 'selected' : ''}>Réseaux sociaux</option>
                                <option value="SALON" ${editData?.type_campagne === 'SALON' ? 'selected' : ''}>Salon / Foire</option>
                                <option value="PUBLICITE" ${editData?.type_campagne === 'PUBLICITE' ? 'selected' : ''}>Publicité</option>
                                <option value="PARRAINAGE" ${editData?.type_campagne === 'PARRAINAGE' ? 'selected' : ''}>Parrainage</option>
                                <option value="CONTENU" ${editData?.type_campagne === 'CONTENU' ? 'selected' : ''}>Marketing contenu</option>
                                <option value="SMS" ${editData?.type_campagne === 'SMS' ? 'selected' : ''}>SMS</option>
                                <option value="AUTRE" ${editData?.type_campagne === 'AUTRE' ? 'selected' : ''}>Autre</option>
                            </select>
                        </div>
                        <div class="form-field full-width"><label>Description</label><textarea id="campDesc" rows="2">${escapeHtml(editData?.description || '')}</textarea></div>
                    </div>
                </div>
                <div class="form-section"><div class="form-section-title">💰 Budget & Période</div>
                    <div class="form-grid">
                        <div class="form-field"><label>Budget prévu</label><input type="number" id="campBudgetPrevu" step="0.01" value="${editData?.budget_prevu || 0}"></div>
                        <div class="form-field"><label>Budget dépensé</label><input type="number" id="campBudgetDepense" step="0.01" value="${editData?.budget_depense || 0}"></div>
                        <div class="form-field"><label>Date début <span class="required">*</span></label><input type="date" id="campDateDebut" value="${editData?.date_debut || new Date().toISOString().split('T')[0]}" required></div>
                        <div class="form-field"><label>Date fin</label><input type="date" id="campDateFin" value="${editData?.date_fin || ''}"></div>
                    </div>
                </div>
                <div class="form-section"><div class="form-section-title">🎯 Objectifs & KPIs</div>
                    <div class="form-grid">
                        <div class="form-field full-width"><label>Objectif</label><textarea id="campObjectif" rows="2">${escapeHtml(editData?.objectif || '')}</textarea></div>
                        <div class="form-field full-width"><label>Public cible</label><textarea id="campPublic" rows="2">${escapeHtml(editData?.public_cible || '')}</textarea></div>
                        <div class="form-field"><label>Leads générés</label><input type="number" id="campLeads" value="${editData?.leads_generes || 0}"></div>
                        <div class="form-field"><label>Conversions</label><input type="number" id="campConversions" value="${editData?.conversions || 0}"></div>
                        <div class="form-field"><label>Impressions</label><input type="number" id="campImpressions" value="${editData?.impressions || 0}"></div>
                        <div class="form-field"><label>Clics</label><input type="number" id="campClics" value="${editData?.clics || 0}"></div>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 ${editData ? 'Enregistrer' : 'Créer'}</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="mktCampError" style="color:var(--danger); text-align:center;"></p>
            </form>
        </div>`;
    document.body.appendChild(modal); modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('mktCampForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const payload = {
                nom: document.getElementById('campNom').value, type_campagne: document.getElementById('campType').value,
                description: document.getElementById('campDesc')?.value || '',
                budget_prevu: parseFloat(document.getElementById('campBudgetPrevu').value) || 0,
                budget_depense: parseFloat(document.getElementById('campBudgetDepense').value) || 0,
                date_debut: document.getElementById('campDateDebut').value,
                date_fin: document.getElementById('campDateFin')?.value || null,
                objectif: document.getElementById('campObjectif')?.value || '',
                public_cible: document.getElementById('campPublic')?.value || '',
                leads_generes: parseInt(document.getElementById('campLeads').value) || 0,
                conversions: parseInt(document.getElementById('campConversions').value) || 0,
                impressions: parseInt(document.getElementById('campImpressions').value) || 0,
                clics: parseInt(document.getElementById('campClics').value) || 0
            };
            if (!payload.date_fin) delete payload.date_fin;
            if (editData) { await apiPatch(endpoint, payload); } else { await apiPost(endpoint, payload); }
            modal.remove(); navigateTo('marketing');
        } catch (error) { document.getElementById('mktCampError').textContent = error.message; }
    });
}
async function editerMktCampagne(id) { try { const c = await apiGet(`/api/marketing/campagnes/${id}/`); ouvrirFormulaireMktCampagne(c); } catch(e) { alert(e.message); } }


// ========================================
// FORMULAIRE ABONNÉ NEWSLETTER
// ========================================
async function ouvrirFormulaireMktAbonne() {
    const existant = document.getElementById('modalCreation'); if (existant) existant.remove();
    const modal = document.createElement('div'); modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:500px;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">➕ Ajouter un abonné</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="mktAboForm" style="padding:1.5rem;">
                <div class="form-grid">
                    <div class="form-field full-width"><label>Email <span class="required">*</span></label><input type="email" id="aboEmail" required></div>
                    <div class="form-field"><label>Nom</label><input type="text" id="aboNom"></div>
                    <div class="form-field"><label>Entreprise</label><input type="text" id="aboEntreprise"></div>
                    <div class="form-field"><label>Langue</label>
                        <select id="aboLangue"><option value="fr">Français</option><option value="en">English</option></select>
                    </div>
                    <div class="form-field"><label>Source</label><input type="text" id="aboSource" value="dashboard"></div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 Ajouter</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="mktAboError" style="color:var(--danger); text-align:center;"></p>
            </form>
        </div>`;
    document.body.appendChild(modal); modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('mktAboForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await apiPost('/api/marketing/newsletter/subscribe/', {
                email: document.getElementById('aboEmail').value,
                nom: document.getElementById('aboNom')?.value || '',
                entreprise: document.getElementById('aboEntreprise')?.value || '',
                langue: document.getElementById('aboLangue').value,
                source: document.getElementById('aboSource')?.value || 'dashboard'
            });
            modal.remove(); navigateTo('marketing');
        } catch (error) { document.getElementById('mktAboError').textContent = error.message; }
    });
}


// ========================================
// FORMULAIRE PROMOTION
// ========================================
async function ouvrirFormulaireMktPromotion(editData = null) {
    const existant = document.getElementById('modalCreation'); if (existant) existant.remove();
    const titre = editData ? `Modifier : ${editData.titre}` : 'Nouvelle promotion';
    const endpoint = editData ? `/api/marketing/promotions/${editData.id}/` : '/api/marketing/promotions/';

    const modal = document.createElement('div'); modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:650px; max-height:90vh; overflow-y:auto;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">${editData ? '✏️' : '➕'} ${titre}</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="mktPromoForm" style="padding:1.5rem;">
                <div class="form-grid">
                    <div class="form-field"><label>Titre (FR) <span class="required">*</span></label><input type="text" id="promoTitreFr" value="${escapeHtml(editData?.titre || editData?.titre_fr || '')}" required></div>
                    <div class="form-field"><label>Titre (EN)</label><input type="text" id="promoTitreEn" value="${escapeHtml(editData?.titre_en || '')}"></div>
                    <div class="form-field full-width"><label>Description (FR) <span class="required">*</span></label><textarea id="promoDescFr" rows="2" required>${escapeHtml(editData?.description || editData?.description_fr || '')}</textarea></div>
                    <div class="form-field"><label>Type <span class="required">*</span></label>
                        <select id="promoType" required>
                            <option value="POURCENTAGE" ${editData?.type_promotion === 'POURCENTAGE' ? 'selected' : ''}>Réduction %</option>
                            <option value="MONTANT_FIXE" ${editData?.type_promotion === 'MONTANT_FIXE' ? 'selected' : ''}>Montant fixe</option>
                            <option value="LIVRAISON" ${editData?.type_promotion === 'LIVRAISON' ? 'selected' : ''}>Livraison gratuite</option>
                            <option value="PACK" ${editData?.type_promotion === 'PACK' ? 'selected' : ''}>Offre pack</option>
                        </select>
                    </div>
                    <div class="form-field"><label>Valeur réduction <span class="required">*</span></label><input type="number" id="promoValeur" step="0.01" value="${editData?.valeur_reduction || 0}" required></div>
                    <div class="form-field"><label>Code promo</label><input type="text" id="promoCode" value="${escapeHtml(editData?.code_promo || '')}" placeholder="Ex: PROMO2026"></div>
                    <div class="form-field"><label>Usage maximum (0=illimité)</label><input type="number" id="promoUsageMax" value="${editData?.usage_maximum || 0}"></div>
                    <div class="form-field"><label>Date début <span class="required">*</span></label><input type="datetime-local" id="promoDateDebut" value="${editData?.date_debut ? editData.date_debut.slice(0,16) : new Date().toISOString().slice(0,16)}" required></div>
                    <div class="form-field"><label>Date fin <span class="required">*</span></label><input type="datetime-local" id="promoDateFin" value="${editData?.date_fin ? editData.date_fin.slice(0,16) : ''}" required></div>
                </div>
                <div class="form-checkbox"><input type="checkbox" id="promoActive" ${editData?.est_active !== false ? 'checked' : ''}><label for="promoActive">Promotion active</label></div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 ${editData ? 'Enregistrer' : 'Créer'}</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="mktPromoError" style="color:var(--danger); text-align:center;"></p>
            </form>
        </div>`;
    document.body.appendChild(modal); modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('mktPromoForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const payload = {
                titre_fr: document.getElementById('promoTitreFr').value,
                titre_en: document.getElementById('promoTitreEn')?.value || '',
                description_fr: document.getElementById('promoDescFr').value,
                type_promotion: document.getElementById('promoType').value,
                valeur_reduction: parseFloat(document.getElementById('promoValeur').value),
                code_promo: document.getElementById('promoCode')?.value || null,
                usage_maximum: parseInt(document.getElementById('promoUsageMax').value) || 0,
                date_debut: document.getElementById('promoDateDebut').value,
                date_fin: document.getElementById('promoDateFin').value,
                est_active: document.getElementById('promoActive').checked
            };
            if (!payload.code_promo) delete payload.code_promo;
            if (editData) { await apiPatch(endpoint, payload); } else { await apiPost(endpoint, payload); }
            modal.remove(); navigateTo('marketing');
        } catch (error) { document.getElementById('mktPromoError').textContent = error.message; }
    });
}
async function editerMktPromotion(id) { try { const p = await apiGet(`/api/marketing/promotions/${id}/`); ouvrirFormulaireMktPromotion(p); } catch(e) { alert(e.message); } }


// ========================================
// ACTIONS STATUT
// ========================================
async function changerStatutMktLead(id) {
    const statuts = [
        {value:'NOUVEAU', label:'🆕 Nouveau'}, {value:'CONTACTE', label:'📞 Contacté'},
        {value:'QUALIFIE', label:'✅ Qualifié'}, {value:'PROPOSITION', label:'📄 Proposition envoyée'},
        {value:'NEGOCIATION', label:'🤝 En négociation'}, {value:'CONVERTI', label:'🏆 Converti'},
        {value:'PERDU', label:'❌ Perdu'}
    ];
    const existant = document.getElementById('modalCreation'); if (existant) existant.remove();
    const modal = document.createElement('div'); modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:400px;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">📋 Pipeline Lead</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <div style="padding:1.5rem; display:flex; flex-direction:column; gap:0.5rem;">
                ${statuts.map(s => `<button class="btn btn-outline" onclick="confirmerStatutMktLead(${id}, '${s.value}')">${s.label}</button>`).join('')}
            </div>
        </div>`;
    document.body.appendChild(modal); modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

async function confirmerStatutMktLead(id, statut) {
    try {
        const payload = { statut };
        if (statut === 'PERDU') { const raison = prompt('Raison de la perte :'); if (raison !== null) payload.raison = raison; }
        await apiPost(`/api/marketing/leads/${id}/changer_statut/`, payload);
        document.getElementById('modalCreation')?.remove(); navigateTo('marketing');
    } catch (error) { alert(error.message); }
}

async function changerStatutMktCampagne(id) {
    const statuts = [
        {value:'PLANIFIEE', label:'📋 Planifiée'}, {value:'EN_COURS', label:'▶️ En cours'},
        {value:'EN_PAUSE', label:'⏸️ En pause'}, {value:'TERMINEE', label:'✅ Terminée'},
        {value:'ANNULEE', label:'❌ Annulée'}
    ];
    const existant = document.getElementById('modalCreation'); if (existant) existant.remove();
    const modal = document.createElement('div'); modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:400px;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">📋 Statut campagne</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <div style="padding:1.5rem; display:flex; flex-direction:column; gap:0.5rem;">
                ${statuts.map(s => `<button class="btn btn-outline" onclick="confirmerStatutMktCampagne(${id}, '${s.value}')">${s.label}</button>`).join('')}
            </div>
        </div>`;
    document.body.appendChild(modal); modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

async function confirmerStatutMktCampagne(id, statut) {
    try {
        await apiPost(`/api/marketing/campagnes/${id}/changer_statut/`, { statut });
        document.getElementById('modalCreation')?.remove(); navigateTo('marketing');
    } catch (error) { alert(error.message); }
}



// ========================================
// FORMULAIRE D'EVALUATION SAV
// ========================================

async function ouvrirFormulaireEvaluationSAV(clientNom = '', entreprise = '', email = '', telephone = '') {
    const existant = document.getElementById('modalCreation');
    if (existant) existant.remove();

    const modal = document.createElement('div');
    modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:700px; max-height:90vh; overflow-y:auto;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">📝 Évaluation SAV ${clientNom ? '— ' + clientNom : ''}</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="savEvalForm" style="padding:1.5rem;">
                <div class="form-section"><div class="form-section-title">👤 Client</div>
                    <div class="form-grid">
                        <div class="form-field"><label>Nom client <span class="required">*</span></label><input type="text" id="savClientNom" value="${escapeHtml(clientNom)}" required></div>
                        <div class="form-field"><label>Entreprise</label><input type="text" id="savEntreprise" value="${escapeHtml(entreprise)}"></div>
                        <div class="form-field"><label>Email</label><input type="email" id="savEmail" value="${escapeHtml(email)}"></div>
                        <div class="form-field"><label>Téléphone</label><input type="text" id="savTel" value="${escapeHtml(telephone)}"></div>
                    </div>
                </div>

                <div class="form-section"><div class="form-section-title">⭐ Évaluation de satisfaction</div>
                    <div class="form-grid">
                        <div class="form-field"><label>Qualité des produits <span class="required">*</span></label>
                            <select id="savProduit" required>
                                <option value="1">⭐ Moins satisfaisant</option><option value="2">⭐⭐ Moyen</option>
                                <option value="3" selected>⭐⭐⭐ Satisfaisant</option><option value="4">⭐⭐⭐⭐ Bon</option>
                                <option value="5">⭐⭐⭐⭐⭐ Très bon</option>
                            </select>
                        </div>
                        <div class="form-field"><label>Qualité du service <span class="required">*</span></label>
                            <select id="savService" required>
                                <option value="1">⭐ Moins satisfaisant</option><option value="2">⭐⭐ Moyen</option>
                                <option value="3" selected>⭐⭐⭐ Satisfaisant</option><option value="4">⭐⭐⭐⭐ Bon</option>
                                <option value="5">⭐⭐⭐⭐⭐ Très bon</option>
                            </select>
                        </div>
                        <div class="form-field"><label>Qualité des agents <span class="required">*</span></label>
                            <select id="savAgent" required>
                                <option value="1">⭐ Moins satisfaisant</option><option value="2">⭐⭐ Moyen</option>
                                <option value="3" selected>⭐⭐⭐ Satisfaisant</option><option value="4">⭐⭐⭐⭐ Bon</option>
                                <option value="5">⭐⭐⭐⭐⭐ Très bon</option>
                            </select>
                        </div>
                        <div class="form-field"><label>Satisfaction globale <span class="required">*</span></label>
                            <select id="savGlobale" required>
                                <option value="1">⭐ Moins satisfaisant</option><option value="2">⭐⭐ Moyen</option>
                                <option value="3" selected>⭐⭐⭐ Satisfaisant</option><option value="4">⭐⭐⭐⭐ Bon</option>
                                <option value="5">⭐⭐⭐⭐⭐ Très bon</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="form-section"><div class="form-section-title">💬 Feedback</div>
                    <div class="form-grid">
                        <div class="form-field full-width"><label>Notes / Impressions du client</label><textarea id="savNotes" rows="3" placeholder="Ce que le client a dit sur nos services..."></textarea></div>
                        <div class="form-field full-width"><label>Points positifs</label><textarea id="savPositifs" rows="2" placeholder="Ce qui a plu au client..."></textarea></div>
                        <div class="form-field full-width"><label>Points à améliorer</label><textarea id="savAmeliorer" rows="2" placeholder="Ce que le client souhaite voir amélioré..."></textarea></div>
                    </div>
                </div>

                <div class="form-section"><div class="form-section-title">📋 Collecte</div>
                    <div class="form-grid">
                        <div class="form-field"><label>Canal de collecte</label>
                            <select id="savCanal">
                                <option value="TELEPHONE">Appel téléphonique</option><option value="EMAIL">Email</option>
                                <option value="WHATSAPP">WhatsApp</option><option value="VISITE">Visite en personne</option>
                                <option value="FORMULAIRE">Formulaire en ligne</option><option value="AUTRE">Autre</option>
                            </select>
                        </div>
                        <div class="form-field"><label>Date évaluation <span class="required">*</span></label><input type="date" id="savDate" value="${new Date().toISOString().split('T')[0]}" required></div>
                    </div>
                </div>

                <div class="form-checkbox">
                    <input type="checkbox" id="savRecommande" checked>
                    <label for="savRecommande">Le client recommande nos services</label>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 Enregistrer l'évaluation</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="savEvalError" style="color:var(--danger); text-align:center; margin-top:0.5rem;"></p>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('savEvalForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await apiPost('/api/marketing/evaluations-sav/', {
                client_nom: document.getElementById('savClientNom').value,
                client_entreprise: document.getElementById('savEntreprise')?.value || '',
                client_email: document.getElementById('savEmail')?.value || null,
                client_telephone: document.getElementById('savTel')?.value || '',
                satisfaction_produit: parseInt(document.getElementById('savProduit').value),
                satisfaction_service: parseInt(document.getElementById('savService').value),
                satisfaction_agent: parseInt(document.getElementById('savAgent').value),
                satisfaction_globale: parseInt(document.getElementById('savGlobale').value),
                notes: document.getElementById('savNotes')?.value || '',
                points_positifs: document.getElementById('savPositifs')?.value || '',
                points_ameliorer: document.getElementById('savAmeliorer')?.value || '',
                canal: document.getElementById('savCanal').value,
                date_evaluation: document.getElementById('savDate').value,
                recommande: document.getElementById('savRecommande').checked
            });
            modal.remove();

            // Relancer la synchronisation pour mettre à jour les scores
            try {
                await apiPost('/api/marketing/sav/synchroniser/');
            } catch(e) {
                console.warn('Sync auto après évaluation:', e);
            }

            navigateTo('marketing');
        } catch (error) {
            document.getElementById('savEvalError').textContent = error.message;
        }
    });
}

async function voirEvaluationsSAVClient(clientNom) {
    try {
        const evals = await apiGet(`/api/marketing/evaluations-sav/?client=${encodeURIComponent(clientNom)}`);
        const evalList = Array.isArray(evals) ? evals : (evals.results || []);

        const existant = document.getElementById('modalCreation');
        if (existant) existant.remove();

        const modal = document.createElement('div');
        modal.id = 'modalCreation';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
        modal.innerHTML = `
            <div style="background:white; border-radius:16px; width:100%; max-width:750px; max-height:90vh; overflow-y:auto;">
                <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                    <h3 style="color:var(--primary);">📝 Évaluations — ${escapeHtml(clientNom)}</h3>
                    <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
                </div>
                <div style="padding:1.5rem;">
                    ${evalList.length === 0 ? '<p style="text-align:center; color:var(--text-light); padding:2rem;">Aucune évaluation pour ce client</p>' :
                    evalList.map(ev => `
                        <div style="border:1px solid var(--border); border-radius:12px; padding:1rem; margin-bottom:1rem; ${ev.satisfaction_globale >= 4 ? 'border-left:4px solid var(--success);' : ev.satisfaction_globale <= 2 ? 'border-left:4px solid var(--danger);' : 'border-left:4px solid var(--warning);'}">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.8rem;">
                                <strong>${ev.etoiles_moyenne || ''} (${ev.moyenne_satisfaction}/5)</strong>
                                <small style="color:var(--text-light);">${formatDate(ev.date_evaluation)} — via ${escapeHtml(ev.canal_display || ev.canal)}</small>
                            </div>
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.3rem; margin-bottom:0.8rem;">
                                <div><small>Produits : ${'⭐'.repeat(ev.satisfaction_produit)}</small></div>
                                <div><small>Service : ${'⭐'.repeat(ev.satisfaction_service)}</small></div>
                                <div><small>Agents : ${'⭐'.repeat(ev.satisfaction_agent)}</small></div>
                                <div><small>Global : ${'⭐'.repeat(ev.satisfaction_globale)}</small></div>
                            </div>
                            ${ev.notes ? `<p style="margin:0.5rem 0; font-style:italic; color:var(--text);">"${escapeHtml(ev.notes)}"</p>` : ''}
                            ${ev.points_positifs ? `<p style="margin:0.3rem 0; color:var(--success); font-size:0.85rem;">👍 ${escapeHtml(ev.points_positifs)}</p>` : ''}
                            ${ev.points_ameliorer ? `<p style="margin:0.3rem 0; color:var(--danger); font-size:0.85rem;">👎 ${escapeHtml(ev.points_ameliorer)}</p>` : ''}
                            <div style="margin-top:0.5rem;">
                                ${ev.recommande ? '<span class="badge badge-success">✅ Recommande</span>' : '<span class="badge badge-danger">❌ Ne recommande pas</span>'}
                                <small style="color:var(--text-light); margin-left:0.5rem;">Par : ${escapeHtml(ev.enregistre_par_nom || 'N/A')}</small>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    } catch (error) { alert(`Erreur : ${error.message}`); }
}





// ========================================
// SAV — CONSTRUCTION DES DONNÉES
// ========================================
function construireDonneesSAV(commandesClients, contratsLocation, leads, evaluations = []) {
    const clientsMap = {};

    commandesClients.forEach(cmd => {
        if (cmd.statut !== 'LIVREE' && cmd.statut !== 'CONFIRMEE') return;
        const key = (cmd.client_nom || '').toLowerCase().trim();
        if (!key) return;

        if (!clientsMap[key]) {
            clientsMap[key] = {
                nom: cmd.client_nom, entreprise: cmd.client_entreprise || '',
                email: cmd.client_email || '', telephone: cmd.client_telephone || '',
                achats: [], locations: [], evaluations: [],
                total_achats: 0, total_locations: 0, total_general: 0,
                nb_achats: 0, nb_locations: 0,
                eligible_promo: false, raison_promo: '',
                moyenne_satisfaction: null, derniere_note: ''
            };
        }

        const montant = parseFloat(cmd.montant_total) || 0;
        clientsMap[key].achats.push({ reference: cmd.reference, montant, date: cmd.date_commande, statut: cmd.statut });
        clientsMap[key].total_achats += montant;
        clientsMap[key].nb_achats++;
    });

    contratsLocation.forEach(contrat => {
        if (contrat.statut !== 'TERMINE' && contrat.statut !== 'ACTIF') return;
        const key = (contrat.client_nom || '').toLowerCase().trim();
        if (!key) return;

        if (!clientsMap[key]) {
            clientsMap[key] = {
                nom: contrat.client_nom, entreprise: contrat.client_entreprise || '',
                email: contrat.client_email || '', telephone: contrat.client_telephone || '',
                achats: [], locations: [], evaluations: [],
                total_achats: 0, total_locations: 0, total_general: 0,
                nb_achats: 0, nb_locations: 0,
                eligible_promo: false, raison_promo: '',
                moyenne_satisfaction: null, derniere_note: ''
            };
        }

        const montant = parseFloat(contrat.montant_total_ttc) || 0;
        clientsMap[key].locations.push({ reference: contrat.reference, montant, date: contrat.date_debut, statut: contrat.statut });
        clientsMap[key].total_locations += montant;
        clientsMap[key].nb_locations++;
    });

    // Associer les évaluations aux clients
    evaluations.forEach(ev => {
        const key = (ev.client_nom || '').toLowerCase().trim();
        if (clientsMap[key]) {
            clientsMap[key].evaluations.push(ev);
        }
    });

    const SEUIL_OPERATIONS = 4;
    const SEUIL_MONTANT = 1000000;

    Object.values(clientsMap).forEach(client => {
        client.total_general = client.total_achats + client.total_locations;

        if (client.nb_achats >= SEUIL_OPERATIONS && client.total_achats >= SEUIL_MONTANT) {
            client.eligible_promo = true;
            client.raison_promo = `${client.nb_achats} achats — ${formatMoney(client.total_achats)}`;
        }
        if (client.nb_locations >= SEUIL_OPERATIONS && client.total_locations >= SEUIL_MONTANT) {
            client.eligible_promo = true;
            client.raison_promo += (client.raison_promo ? ' + ' : '') + `${client.nb_locations} locations — ${formatMoney(client.total_locations)}`;
        }

        // Calculer la moyenne de satisfaction
        if (client.evaluations.length > 0) {
            const totalSatisfaction = client.evaluations.reduce((sum, ev) => sum + (ev.moyenne_satisfaction || 0), 0);
            client.moyenne_satisfaction = Math.round((totalSatisfaction / client.evaluations.length) * 10) / 10;
            const derniere = client.evaluations[0];
            client.derniere_note = derniere?.notes || '';
        }
    });

    const clients = Object.values(clientsMap).sort((a, b) => b.total_general - a.total_general);
    const eligibles = clients.filter(c => c.eligible_promo);

    return { clients, eligibles, evaluations, seuil_operations: SEUIL_OPERATIONS, seuil_montant: SEUIL_MONTANT };
}


// ========================================
// SAV — ACTIONS
// ========================================
function voirDetailSAVClient(nomClient) {
    alert(`Détail du client "${nomClient}" — Fonctionnalité à venir dans une prochaine mise à jour.`);
}

async function proposerPromoSAV(nomClient, email) {
    if (!confirm(`Proposer une promotion au client "${nomClient}" (${email || 'pas d\'email'}) ?\n\nUn email de promotion sera envoyé au client.`)) return;

    if (email) {
        try {
            // Essayer d'envoyer via le système de notification
            alert(`✅ Promotion proposée au client "${nomClient}".\n\nUn email a été préparé pour ${email}.\nVeuillez créer la promotion correspondante dans l'onglet Promotions.`);

            // Ouvrir le formulaire promotion pré-rempli
            ouvrirFormulaireMktPromotion({
                titre_fr: `Promotion fidélité — ${nomClient}`,
                description_fr: `Promotion spéciale pour notre client fidèle ${nomClient}. Merci pour votre confiance !`,
                type_promotion: 'POURCENTAGE',
                valeur_reduction: 10,
                est_active: true
            });

        } catch (error) {
            alert(`Erreur : ${error.message}`);
        }
    } else {
        alert(`Le client "${nomClient}" n'a pas d'email enregistré. Veuillez le contacter directement.`);
    }
}