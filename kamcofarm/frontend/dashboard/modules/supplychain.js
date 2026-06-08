// ========================================
// MODULE SUPPLY CHAIN — CRUD COMPLET
// ========================================

// ========================================
// CHARGEMENT PRINCIPAL
// ========================================
async function loadSupplychainModule() {
    const area = document.getElementById('contentArea');

    try {
        const [dashboard, commandes, fournisseurs, livraisons, mouvements] = await Promise.all([
            apiGet('/api/supplychain/dashboard/').catch(() => null),
            apiGet('/api/supplychain/commandes-clients/').catch(() => []),
            apiGet('/api/supplychain/fournisseurs/').catch(() => []),
            apiGet('/api/supplychain/livraisons/').catch(() => []),
            apiGet('/api/supplychain/mouvements-stock/').catch(() => [])
        ]);

        const cmdList = Array.isArray(commandes) ? commandes : (commandes.results || []);
        const frnList = Array.isArray(fournisseurs) ? fournisseurs : (fournisseurs.results || []);
        const livList = Array.isArray(livraisons) ? livraisons : (livraisons.results || []);
        const mvtList = Array.isArray(mouvements) ? mouvements : (mouvements.results || []);

        area.innerHTML = `
            <!-- Stats -->
            <div class="stats-row">
                <div class="stat-card">
                    <div class="stat-card-icon blue">📦</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${dashboard?.commandes_en_cours || cmdList.filter(c => !['LIVREE','ANNULEE'].includes(c.statut)).length}</div>
                        <div class="stat-card-label">Commandes en cours</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon green">✅</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${dashboard?.commandes_livrees || cmdList.filter(c => c.statut === 'LIVREE').length}</div>
                        <div class="stat-card-label">Livrées</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon orange">🚚</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${dashboard?.livraisons_en_transit || livList.filter(l => l.statut === 'EN_TRANSIT').length}</div>
                        <div class="stat-card-label">En transit</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon purple">🏭</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${dashboard?.fournisseurs_actifs || frnList.filter(f => f.est_actif).length}</div>
                        <div class="stat-card-label">Fournisseurs actifs</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon teal">💰</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${formatMoney(dashboard?.chiffre_affaires_livrees || 0)}</div>
                        <div class="stat-card-label">CA Livraisons</div>
                    </div>
                </div>
            </div>

            <!-- Onglets -->
            <div class="card">
                <div class="card-header">
                    <div class="tab-nav">
                        <button class="tab-btn active" onclick="switchTab('sc', 'commandes', this)">📦 Commandes (${cmdList.length})</button>
                        <button class="tab-btn" onclick="switchTab('sc', 'fournisseurs', this)">🏭 Fournisseurs (${frnList.length})</button>
                        <button class="tab-btn" onclick="switchTab('sc', 'livraisons', this)">🚚 Livraisons (${livList.length})</button>
                        <button class="tab-btn" onclick="switchTab('sc', 'mouvements', this)">📊 Stock (${mvtList.length})</button>
                    </div>
                </div>
                <div class="card-body">
                    <!-- TAB COMMANDES -->
                    <div class="tab-content active" id="sc_commandes">
                        ${renderSCCommandes(cmdList)}
                    </div>
                    <!-- TAB FOURNISSEURS -->
                    <div class="tab-content" id="sc_fournisseurs">
                        ${renderSCFournisseurs(frnList)}
                    </div>
                    <!-- TAB LIVRAISONS -->
                    <div class="tab-content" id="sc_livraisons">
                        ${renderSCLivraisons(livList)}
                    </div>
                    <!-- TAB MOUVEMENTS STOCK -->
                    <div class="tab-content" id="sc_mouvements">
                        ${renderSCMouvements(mvtList)}
                    </div>
                </div>
            </div>
        `;

    } catch (error) {
        showError(`Supply Chain : ${error.message}`);
    }
}


// ========================================
// RENDU : COMMANDES CLIENTS
// ========================================
function renderSCCommandes(cmdList) {
    const searchValue = getSearchValue('supplychain');
    let filtered = cmdList;
    if (searchValue) {
        filtered = filterLocally(filtered, searchValue, ['reference', 'client_nom', 'client_entreprise', 'destination']);
    }
    const filterStatut = getFilterValue('supplychain', 'statut_cmd');
    if (filterStatut) {
        filtered = filtered.filter(c => c.statut === filterStatut);
    }

    return `
        ${renderSearchBar({
            placeholder: 'Rechercher une commande...',
            moduleRedirect: 'supplychain',
            filters: [{
                key: 'statut_cmd', label: 'Statut',
                options: [
                    {value:'EN_ATTENTE', label:'En attente'}, {value:'CONFIRMEE', label:'Confirmée'},
                    {value:'EN_PREPARATION', label:'En préparation'}, {value:'EXPEDIEE', label:'Expédiée'},
                    {value:'LIVREE', label:'Livrée'}, {value:'ANNULEE', label:'Annulée'}
                ]
            }]
        })}
        <div style="margin-bottom:1rem;">
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireSCCommande()">+ Nouvelle commande</button>
        </div>
        <div class="table-container">
            <table class="dash-table">
                <thead>
                    <tr>
                        <th>Référence</th>
                        <th>Client</th>
                        <th>Entreprise</th>
                        <th>Email</th>
                        <th>Téléphone</th>
                        <th>Destination</th>
                        <th>Montant</th>
                        <th>Statut</th>
                        <th>Date commande</th>
                        <th>Livraison prévue</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${filtered.length === 0 ? '<tr><td colspan="11" style="text-align:center; padding:2rem;">Aucune commande</td></tr>' :
                    filtered.map(cmd => `
                        <tr>
                            <td><strong>${escapeHtml(cmd.reference)}</strong></td>
                            <td>${escapeHtml(cmd.client_nom)}</td>
                            <td>${escapeHtml(cmd.client_entreprise || 'N/A')}</td>
                            <td>${cmd.client_email ? `<a href="mailto:${cmd.client_email}" style="color:var(--primary);">${escapeHtml(cmd.client_email)}</a>` : 'N/A'}</td>
                            <td>${escapeHtml(cmd.client_telephone || 'N/A')}</td>
                            <td>${escapeHtml(cmd.destination)}</td>
                            <td><strong>${formatMoney(cmd.montant_total, cmd.devise)}</strong></td>
                            <td><span class="badge ${getBadgeClass(cmd.statut)}">${escapeHtml(cmd.statut_display || cmd.statut)}</span></td>
                            <td>${formatDate(cmd.date_commande)}</td>
                            <td>${formatDate(cmd.date_livraison_prevue)}</td>
                            <td>
                                <div class="item-actions">
                                    <button class="btn btn-sm btn-outline" onclick="voirDetailCommandeSC(${cmd.id})" title="Détail">👁️</button>
                                    ${!['LIVREE','ANNULEE'].includes(cmd.statut) ? `
                                        <button class="btn btn-sm btn-success" onclick="changerStatutCommandeSC(${cmd.id})" title="Changer statut">📋</button>
                                        <button class="btn btn-sm btn-outline" onclick="editerCommandeSC(${cmd.id})" title="Modifier">✏️</button>
                                    ` : ''}
                                    <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/supplychain/commandes-clients/${cmd.id}/', 'supplychain')" title="Supprimer">🗑️</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}


// ========================================
// RENDU : FOURNISSEURS
// ========================================
function renderSCFournisseurs(frnList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">🏭 Fournisseurs</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireSCFournisseur()">+ Ajouter un fournisseur</button>
        </div>

        ${frnList.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">🏭</div><h3>Aucun fournisseur</h3></div>' : `
            <p class="scroll-hint">👆 Faites défiler horizontalement →</p>
            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Type</th>
                                <th>Contact</th>
                                <th>Localisation</th>
                                <th>Produits fournis</th>
                                <th>Actif</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${frnList.map(f => `
                                <tr>
                                    <td><strong>${escapeHtml(f.nom)}</strong></td>
                                    <td><span class="badge badge-info">${escapeHtml(f.type_display || f.type_fournisseur)}</span></td>
                                    <td>
                                        ${f.contact_nom ? `<strong>${escapeHtml(f.contact_nom)}</strong><br>` : ''}
                                        ${f.email ? `<a href="mailto:${f.email}" style="color:var(--primary); font-size:0.8rem;">${escapeHtml(f.email)}</a><br>` : ''}
                                        ${f.telephone ? `<small>📞 ${escapeHtml(f.telephone)}</small>` : ''}
                                    </td>
                                    <td><small>${escapeHtml(f.ville || '')}${f.ville && f.pays ? ', ' : ''}${escapeHtml(f.pays || 'N/A')}</small></td>
                                    <td><small>${escapeHtml((f.produits_fournis || '').substring(0, 50))}${(f.produits_fournis || '').length > 50 ? '...' : ''}</small></td>
                                    <td>${f.est_actif ? '<span class="badge badge-success">Oui</span>' : '<span class="badge badge-danger">Non</span>'}</td>
                                    <td>
                                        <div class="item-actions">
                                            <button class="btn btn-sm btn-outline" onclick="voirDetailFournisseur(${f.id})" title="Détail">👁️</button>
                                            <button class="btn btn-sm btn-outline" onclick="editerFournisseurSC(${f.id})" title="Modifier">✏️</button>
                                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/supplychain/fournisseurs/${f.id}/', 'supplychain')">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="responsive-mobile-view">
                ${frnList.map(f => `
                    <div class="responsive-card">
                        <div class="responsive-card-header">
                            <div><strong>${escapeHtml(f.nom)}</strong><br><small>${escapeHtml(f.type_display || f.type_fournisseur)}</small></div>
                            ${f.est_actif ? '<span class="badge badge-success">Actif</span>' : '<span class="badge badge-danger">Inactif</span>'}
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row"><span class="responsive-card-label">👤 Contact</span><span>${escapeHtml(f.contact_nom || 'N/A')}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📧 Email</span><span>${f.email ? `<a href="mailto:${f.email}">${escapeHtml(f.email)}</a>` : 'N/A'}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📞 Tél</span><span>${escapeHtml(f.telephone || 'N/A')}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📍 Lieu</span><span>${escapeHtml(f.ville || '')} ${escapeHtml(f.pays || '')}</span></div>
                        </div>
                        <div class="responsive-card-footer">
                            <button class="btn btn-sm btn-outline" onclick="voirDetailFournisseur(${f.id})">👁️ Détail</button>
                            <button class="btn btn-sm btn-outline" onclick="editerFournisseurSC(${f.id})">✏️</button>
                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/supplychain/fournisseurs/${f.id}/', 'supplychain')">🗑️</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}




async function voirDetailFournisseur(id) {
    try {
        const f = await apiGet(`/api/supplychain/fournisseurs/${id}/`);

        // Charger les commandes de ce fournisseur
        let commandesFrn = [];
        try {
            const r = await apiGet(`/api/supplychain/commandes-fournisseurs/?fournisseur=${f.nom}`);
            commandesFrn = Array.isArray(r) ? r : (r.results || []);
        } catch(e) {}

        const existant = document.getElementById('modalCreation');
        if (existant) existant.remove();

        // Parser les produits fournis en liste
        const produitsFournis = (f.produits_fournis || '').split(/[,;\n]/).filter(p => p.trim());

        const modal = document.createElement('div');
        modal.id = 'modalCreation';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
        modal.innerHTML = `
            <div style="background:white; border-radius:16px; width:100%; max-width:800px; max-height:90vh; overflow-y:auto;">
                <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="color:var(--primary);">🏭 ${escapeHtml(f.nom)}</h3>
                    <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.5rem; cursor:pointer;">✕</button>
                </div>
                <div style="padding:1.5rem;">
                    <!-- Infos générales -->
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">🏭 Informations fournisseur</div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.3rem;">
                            <div class="detail-row"><span class="detail-label">Nom</span><span class="detail-value"><strong>${escapeHtml(f.nom)}</strong></span></div>
                            <div class="detail-row"><span class="detail-label">Type</span><span class="detail-value"><span class="badge badge-info">${escapeHtml(f.type_display || f.type_fournisseur)}</span></span></div>
                            <div class="detail-row"><span class="detail-label">Statut</span><span class="detail-value">${f.est_actif ? '<span class="badge badge-success">✅ Actif</span>' : '<span class="badge badge-danger">❌ Inactif</span>'}</span></div>
                            <div class="detail-row"><span class="detail-label">Date création</span><span class="detail-value">${formatDate(f.date_creation)}</span></div>
                        </div>
                    </div>

                    <!-- Contact -->
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">👤 Contact</div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.3rem;">
                            <div class="detail-row"><span class="detail-label">Nom contact</span><span class="detail-value">${escapeHtml(f.contact_nom || 'N/A')}</span></div>
                            <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${f.email ? `<a href="mailto:${f.email}" style="color:var(--primary);">${escapeHtml(f.email)}</a>` : 'N/A'}</span></div>
                            <div class="detail-row"><span class="detail-label">Téléphone</span><span class="detail-value">${f.telephone ? `<a href="tel:${f.telephone}">${escapeHtml(f.telephone)}</a>` : 'N/A'}</span></div>
                        </div>
                    </div>

                    <!-- Localisation -->
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">📍 Localisation</div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.3rem;">
                            <div class="detail-row"><span class="detail-label">Ville</span><span class="detail-value">${escapeHtml(f.ville || 'N/A')}</span></div>
                            <div class="detail-row"><span class="detail-label">Pays</span><span class="detail-value">${escapeHtml(f.pays || 'N/A')}</span></div>
                        </div>
                        ${f.adresse ? `<div class="detail-row"><span class="detail-label">Adresse</span><span class="detail-value">${escapeHtml(f.adresse)}</span></div>` : ''}
                    </div>

                    <!-- Produits fournis -->
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">📦 Produits fournis</div>
                        ${produitsFournis.length > 0 ? `
                            <div style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-top:0.5rem;">
                                ${produitsFournis.map(p => `
                                    <span style="background:#e8f5e9; color:#2e7d32; padding:0.4rem 0.8rem; border-radius:20px; font-size:0.85rem; display:inline-flex; align-items:center; gap:0.3rem;">
                                        🌱 ${escapeHtml(p.trim())}
                                    </span>
                                `).join('')}
                            </div>
                        ` : `
                            <p style="color:var(--text-light); margin:0.5rem 0;">${escapeHtml(f.produits_fournis || 'Aucun produit spécifié')}</p>
                        `}
                    </div>

                    <!-- Historique commandes -->
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">📋 Historique des commandes (${commandesFrn.length})</div>
                        ${commandesFrn.length > 0 ? `
                            <div class="table-container">
                                <table class="dash-table">
                                    <thead><tr><th>Référence</th><th>Montant</th><th>Statut</th><th>Date</th></tr></thead>
                                    <tbody>
                                        ${commandesFrn.map(c => `
                                            <tr>
                                                <td><strong>${escapeHtml(c.reference)}</strong></td>
                                                <td>${formatMoney(c.montant_total, c.devise)}</td>
                                                <td><span class="badge ${getBadgeClass(c.statut)}">${escapeHtml(c.statut_display || c.statut)}</span></td>
                                                <td><small>${formatDate(c.date_commande)}</small></td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        ` : '<p style="color:var(--text-light); text-align:center; padding:1rem;">Aucune commande</p>'}
                    </div>

                    <!-- Actions -->
                    <div class="form-actions">
                        <button class="btn btn-outline" onclick="this.closest('#modalCreation').remove(); editerFournisseurSC(${f.id})">✏️ Modifier</button>
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
// RENDU : LIVRAISONS
// ========================================
function renderSCLivraisons(livList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">🚚 Livraisons</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireSCLivraison()">+ Nouvelle livraison</button>
        </div>

        ${livList.length === 0 ? `
            <div class="empty-state">
                <div class="empty-state-icon">🚚</div>
                <h3>Aucune livraison</h3>
            </div>
        ` : `
            <p class="scroll-hint">👆 Faites défiler horizontalement →</p>

            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Commande</th>
                                <th>Transporteur</th>
                                <th>Mode</th>
                                <th>Tracking</th>
                                <th>Départ → Arrivée</th>
                                <th>Poids</th>
                                <th>Coût</th>
                                <th>Statut</th>
                                <th>Expédition</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${livList.map(l => `
                                <tr>
                                    <td>#${l.id}</td>
                                    <td><strong>${escapeHtml(l.commande_reference || 'N/A')}</strong></td>
                                    <td>${escapeHtml(l.transporteur || 'N/A')}</td>
                                    <td><span class="badge badge-info">${escapeHtml(l.mode_display || l.mode_transport)}</span></td>
                                    <td><small>${escapeHtml(l.numero_tracking || 'N/A')}</small></td>
                                    <td><small>${escapeHtml(l.adresse_depart || '?')} → ${escapeHtml(l.adresse_arrivee || '?')}</small></td>
                                    <td>${l.poids_total_kg || 0} kg</td>
                                    <td>${formatMoney(l.cout_transport || 0)}</td>
                                    <td><span class="badge ${getBadgeClass(l.statut)}">${escapeHtml(l.statut_display || l.statut)}</span></td>
                                    <td><small>${formatDate(l.date_expedition)}</small></td>
                                    <td>
                                        <div class="item-actions">
                                            ${!['LIVREE','ANNULEE'].includes(l.statut) ? `<button class="btn btn-sm btn-success" onclick="changerStatutLivraisonSC(${l.id})">📋</button>` : ''}
                                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/supplychain/livraisons/${l.id}/', 'supplychain')">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="responsive-mobile-view">
                ${livList.map(l => `
                    <div class="responsive-card">
                        <div class="responsive-card-header">
                            <div>
                                <strong>Livraison #${l.id}</strong>
                                <br><small>Commande : ${escapeHtml(l.commande_reference || 'N/A')}</small>
                            </div>
                            <span class="badge ${getBadgeClass(l.statut)}">${escapeHtml(l.statut_display || l.statut)}</span>
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row"><span class="responsive-card-label">🚚 Transporteur</span><span>${escapeHtml(l.transporteur || 'N/A')}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📦 Mode</span><span class="badge badge-info">${escapeHtml(l.mode_display || l.mode_transport)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">🔗 Tracking</span><span>${escapeHtml(l.numero_tracking || 'N/A')}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📍 Départ</span><span><small>${escapeHtml(l.adresse_depart || 'N/A')}</small></span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📍 Arrivée</span><span><small>${escapeHtml(l.adresse_arrivee || 'N/A')}</small></span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">⚖️ Poids</span><span>${l.poids_total_kg || 0} kg</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">💰 Coût</span><span style="font-weight:700;">${formatMoney(l.cout_transport || 0)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📅 Expédition</span><span>${formatDate(l.date_expedition)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📅 Livraison est.</span><span>${formatDate(l.date_livraison_estimee)}</span></div>
                        </div>
                        <div class="responsive-card-footer">
                            ${!['LIVREE','ANNULEE'].includes(l.statut) ? `<button class="btn btn-sm btn-success" onclick="changerStatutLivraisonSC(${l.id})">📋 Statut</button>` : ''}
                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/supplychain/livraisons/${l.id}/', 'supplychain')">🗑️</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}


// ========================================
// RENDU : MOUVEMENTS STOCK
// ========================================
function renderSCMouvements(mvtList) {
    return `
        <div style="margin-bottom:1rem;">
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireSCMouvement()">+ Enregistrer un mouvement</button>
        </div>
        <div class="table-container">
            <table class="dash-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Produit</th>
                        <th>Type</th>
                        <th>Quantité (kg)</th>
                        <th>Motif</th>
                        <th>Effectué par</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${mvtList.length === 0 ? '<tr><td colspan="7" style="text-align:center; padding:2rem;">Aucun mouvement</td></tr>' :
                    mvtList.map(m => `
                        <tr>
                            <td>#${m.id}</td>
                            <td><strong>${escapeHtml(m.produit_nom || 'N/A')}</strong></td>
                            <td><span class="badge ${m.type_mouvement === 'ENTREE' ? 'badge-success' : m.type_mouvement === 'SORTIE' ? 'badge-danger' : 'badge-warning'}">${escapeHtml(m.type_display || m.type_mouvement)}</span></td>
                            <td style="font-weight:700; color:${m.type_mouvement === 'ENTREE' ? 'var(--success)' : 'var(--danger)'};">
                                ${m.type_mouvement === 'ENTREE' ? '+' : '-'}${m.quantite_kg}
                            </td>
                            <td><small>${escapeHtml(m.motif || 'N/A')}</small></td>
                            <td>${escapeHtml(m.effectue_par_nom || 'N/A')}</td>
                            <td>${formatDateTime(m.date_mouvement)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}


// ========================================
// DÉTAIL COMMANDE CLIENT
// ========================================
async function voirDetailCommandeSC(id) {
    try {
        const cmd = await apiGet(`/api/supplychain/commandes-clients/${id}/`);

        const statuts = ['EN_ATTENTE', 'CONFIRMEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE'];
        const currentIdx = statuts.indexOf(cmd.statut);

        const modal = document.createElement('div');
        modal.id = 'modalCreation';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';

        modal.innerHTML = `
            <div style="background:white; border-radius:16px; width:100%; max-width:800px; max-height:90vh; overflow-y:auto;">
                <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                    <h3 style="color:var(--primary);">📦 Commande ${escapeHtml(cmd.reference)}</h3>
                    <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
                </div>
                <div style="padding:1.5rem;">
                    <!-- Timeline statut -->
                    <div class="status-timeline">
                        ${statuts.map((s, i) => `
                            ${i > 0 ? '<span class="status-arrow">→</span>' : ''}
                            <span class="status-step ${i < currentIdx ? 'completed' : i === currentIdx ? 'active' : ''}">${s === 'ANNULEE' ? '❌' : ''} ${s.replace('_', ' ')}</span>
                        `).join('')}
                    </div>

                    <!-- Infos client -->
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">👤 Informations client</div>
                        <div class="form-grid">
                            <div class="detail-row"><span class="detail-label">Nom</span><span class="detail-value">${escapeHtml(cmd.client_nom)}</span></div>
                            <div class="detail-row"><span class="detail-label">Entreprise</span><span class="detail-value">${escapeHtml(cmd.client_entreprise || 'N/A')}</span></div>
                            <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${cmd.client_email ? `<a href="mailto:${cmd.client_email}">${escapeHtml(cmd.client_email)}</a>` : 'N/A'}</span></div>
                            <div class="detail-row"><span class="detail-label">Téléphone</span><span class="detail-value">${escapeHtml(cmd.client_telephone || 'N/A')}</span></div>
                        </div>
                    </div>

                    <!-- Infos commande -->
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">📦 Détails commande</div>
                        <div class="form-grid">
                            <div class="detail-row"><span class="detail-label">Référence</span><span class="detail-value"><strong>${escapeHtml(cmd.reference)}</strong></span></div>
                            <div class="detail-row"><span class="detail-label">Statut</span><span class="detail-value"><span class="badge ${getBadgeClass(cmd.statut)}">${escapeHtml(cmd.statut_display || cmd.statut)}</span></span></div>
                            <div class="detail-row"><span class="detail-label">Destination</span><span class="detail-value">${escapeHtml(cmd.destination)}</span></div>
                            <div class="detail-row"><span class="detail-label">Montant total</span><span class="detail-value" style="font-weight:800; color:var(--primary); font-size:1.1rem;">${formatMoney(cmd.montant_total, cmd.devise)}</span></div>
                            <div class="detail-row"><span class="detail-label">Date commande</span><span class="detail-value">${formatDateTime(cmd.date_commande)}</span></div>
                            <div class="detail-row"><span class="detail-label">Livraison prévue</span><span class="detail-value">${formatDate(cmd.date_livraison_prevue)}</span></div>
                            <div class="detail-row"><span class="detail-label">Livraison effective</span><span class="detail-value">${formatDate(cmd.date_livraison_effective) || 'N/A'}</span></div>
                            <div class="detail-row"><span class="detail-label">Créée par</span><span class="detail-value">${escapeHtml(cmd.creee_par_nom || 'N/A')}</span></div>
                        </div>
                        ${cmd.notes ? `<div class="detail-row" style="margin-top:0.5rem;"><span class="detail-label">Notes</span><span class="detail-value">${escapeHtml(cmd.notes)}</span></div>` : ''}
                    </div>

                    <!-- Lignes de commande -->
                    <div class="inline-section">
                        <div class="inline-header">
                            <h4>📋 Articles commandés (${(cmd.lignes || []).length})</h4>
                            ${!['LIVREE','ANNULEE'].includes(cmd.statut) ? `
                                <button class="btn btn-sm btn-primary" onclick="ajouterLigneCommande(${cmd.id})">+ Ajouter un article</button>
                            ` : ''}
                        </div>
                        ${(cmd.lignes || []).length > 0 ? `
                            <table class="dash-table">
                                <thead>
                                    <tr>
                                        <th>Catégorie</th>
                                        <th>Article</th>
                                        <th>Quantité</th>
                                        <th>Prix unit.</th>
                                        <th>Sous-total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${cmd.lignes.map(l => {
                                        const catIcons = {
                                            'PRODUIT_AGRICOLE': '🌱 Produit',
                                            'MATERIEL': '🚜 Matériel',
                                            'SERVICE': '🔧 Service',
                                            'AUTRE': '📄 Autre'
                                        };
                                        const catLabel = catIcons[l.categorie_ligne] || catIcons[l.categorie_display] || '📄 Article';
                                        
                                        let articleNom = l.description || 'N/A';
                                        if (l.produit_nom) articleNom = l.produit_nom;
                                        if (l.equipement_nom) articleNom = l.equipement_nom;

                                        return `
                                            <tr>
                                                <td><span class="badge badge-info" style="font-size:0.75rem;">${catLabel}</span></td>
                                                <td><strong>${escapeHtml(articleNom)}</strong></td>
                                                <td>${l.quantite_kg} kg</td>
                                                <td>${formatMoney(l.prix_unitaire)}</td>
                                                <td><strong>${formatMoney(l.sous_total)}</strong></td>
                                            </tr>
                                        `;
                                    }).join('')}
                                    <tr style="background:#f0f7f0;">
                                        <td colspan="4" style="text-align:right; font-weight:700;">TOTAL</td>
                                        <td style="font-weight:800; color:var(--primary); font-size:1.1rem;">${formatMoney(cmd.montant_total, cmd.devise)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        ` : `
                            <div style="text-align:center; padding:2rem; background:#f9f9f9; border-radius:10px;">
                                <p style="color:var(--text-light); margin-bottom:1rem;">Aucun article dans cette commande</p>
                                ${!['LIVREE','ANNULEE'].includes(cmd.statut) ? `
                                    <button class="btn btn-primary" onclick="ajouterLigneCommande(${cmd.id})">
                                        + Ajouter le premier article
                                    </button>
                                ` : ''}
                            </div>
                        `}
                    </div>
                    <div class="inline-section">
                        <div class="inline-header">
                            <h4>📋 Lignes de commande</h4>
                            ${!['LIVREE','ANNULEE'].includes(cmd.statut) ? `
                                <button class="btn btn-sm btn-primary" onclick="ajouterLigneCommande(${cmd.id})">+ Ajouter ligne</button>
                            ` : ''}
                        </div>
                        <p style="color:var(--text-light); text-align:center; padding:1rem;">Aucune ligne de commande</p>
                    </div>
                    

                    <!-- Actions -->
                    ${!['LIVREE','ANNULEE'].includes(cmd.statut) ? `
                        <div class="form-actions">
                            <button class="btn btn-success" onclick="this.closest('#modalCreation').remove(); changerStatutCommandeSC(${cmd.id})">📋 Changer statut</button>
                            <button class="btn btn-outline" onclick="this.closest('#modalCreation').remove(); editerCommandeSC(${cmd.id})">✏️ Modifier</button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    } catch (error) {
        alert(`Erreur : ${error.message}`);
    }
}


// ========================================
// FORMULAIRE CRÉATION COMMANDE CLIENT
// ========================================
async function ouvrirFormulaireSCCommande(editData = null) {
    const existant = document.getElementById('modalCreation');
    if (existant) existant.remove();

    const titre = editData ? `Modifier commande ${editData.reference}` : 'Nouvelle commande client';
    const endpoint = editData ? `/api/supplychain/commandes-clients/${editData.id}/` : '/api/supplychain/commandes-clients/';

    const modal = document.createElement('div');
    modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:700px; max-height:90vh; overflow-y:auto;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">${editData ? '✏️' : '➕'} ${titre}</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="scCmdForm" style="padding:1.5rem;">
                <div class="form-section">
                    <div class="form-section-title">👤 Informations client</div>
                    <div class="form-grid">
                        <div class="form-field"><label>Nom du client <span class="required">*</span></label><input type="text" id="cmdClientNom" value="${escapeHtml(editData?.client_nom || '')}" required></div>
                        <div class="form-field"><label>Entreprise</label><input type="text" id="cmdClientEntreprise" value="${escapeHtml(editData?.client_entreprise || '')}"></div>
                        <div class="form-field"><label>Email</label><input type="email" id="cmdClientEmail" value="${escapeHtml(editData?.client_email || '')}"></div>
                        <div class="form-field"><label>Téléphone</label><input type="text" id="cmdClientTel" value="${escapeHtml(editData?.client_telephone || '')}"></div>
                    </div>
                </div>

                <div class="form-section">
                    <div class="form-section-title">📦 Détails commande</div>
                    <div class="form-grid">
                        <div class="form-field full-width"><label>Destination <span class="required">*</span></label><input type="text" id="cmdDestination" value="${escapeHtml(editData?.destination || '')}" required placeholder="Ville, Pays"></div>
                        <div class="form-field"><label>Date livraison prévue</label><input type="date" id="cmdDateLivraison" value="${editData?.date_livraison_prevue || ''}"></div>
                        <div class="form-field"><label>Devise</label>
                            <select id="cmdDevise">
                                <option value="FCFA" ${editData?.devise === 'FCFA' ? 'selected' : ''}>FCFA</option>
                                <option value="EUR" ${editData?.devise === 'EUR' ? 'selected' : ''}>EUR</option>
                                <option value="USD" ${editData?.devise === 'USD' ? 'selected' : ''}>USD</option>
                            </select>
                        </div>
                        <div class="form-field full-width"><label>Notes</label><textarea id="cmdNotes" rows="2">${escapeHtml(editData?.notes || '')}</textarea></div>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 ${editData ? 'Enregistrer' : 'Créer et ajouter les articles'}</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="scCmdError" style="color:var(--danger); text-align:center; margin-top:0.5rem;"></p>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('scCmdForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const payload = {
                client_nom: document.getElementById('cmdClientNom').value,
                client_entreprise: document.getElementById('cmdClientEntreprise')?.value || '',
                client_email: document.getElementById('cmdClientEmail')?.value || '',
                client_telephone: document.getElementById('cmdClientTel')?.value || '',
                destination: document.getElementById('cmdDestination').value,
                date_livraison_prevue: document.getElementById('cmdDateLivraison')?.value || null,
                devise: document.getElementById('cmdDevise').value,
                notes: document.getElementById('cmdNotes')?.value || ''
            };

            if (!payload.date_livraison_prevue) delete payload.date_livraison_prevue;

            let result;
            if (editData) {
                result = await apiPatch(endpoint, payload);
                modal.remove();
                navigateTo('supplychain');
            } else {
                result = await apiPost(endpoint, payload);
                modal.remove();
                // Ouvrir directement le détail pour ajouter des lignes
                voirDetailCommandeSC(result.id);
            }
        } catch (error) {
            document.getElementById('scCmdError').textContent = error.message;
        }
    });
}

async function editerCommandeSC(id) {
    try {
        const cmd = await apiGet(`/api/supplychain/commandes-clients/${id}/`);
        ouvrirFormulaireSCCommande(cmd);
    } catch (error) {
        alert(`Erreur : ${error.message}`);
    }
}


// ========================================
// FORMULAIRE FOURNISSEUR
// ========================================
async function ouvrirFormulaireSCFournisseur(editData = null) {
    const existant = document.getElementById('modalCreation');
    if (existant) existant.remove();

    const titre = editData ? `Modifier : ${editData.nom}` : 'Nouveau fournisseur';
    const endpoint = editData ? `/api/supplychain/fournisseurs/${editData.id}/` : '/api/supplychain/fournisseurs/';

    const modal = document.createElement('div');
    modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';

    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:650px; max-height:90vh; overflow-y:auto;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">${editData ? '✏️' : '➕'} ${titre}</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="scFrnForm" style="padding:1.5rem;">
                <div class="form-section">
                    <div class="form-section-title">🏭 Informations fournisseur</div>
                    <div class="form-grid">
                        <div class="form-field">
                            <label>Nom <span class="required">*</span></label>
                            <input type="text" id="frnNom" value="${escapeHtml(editData?.nom || '')}" required>
                        </div>
                        <div class="form-field">
                            <label>Type</label>
                            <select id="frnType">
                                <option value="LOCAL" ${editData?.type_fournisseur === 'LOCAL' ? 'selected' : ''}>Fournisseur Local</option>
                                <option value="INTERNATIONAL" ${editData?.type_fournisseur === 'INTERNATIONAL' ? 'selected' : ''}>Fournisseur International</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <div class="form-section-title">👤 Contact</div>
                    <div class="form-grid">
                        <div class="form-field">
                            <label>Nom du contact</label>
                            <input type="text" id="frnContact" value="${escapeHtml(editData?.contact_nom || '')}">
                        </div>
                        <div class="form-field">
                            <label>Email</label>
                            <input type="email" id="frnEmail" value="${escapeHtml(editData?.email || '')}">
                        </div>
                        <div class="form-field">
                            <label>Téléphone</label>
                            <input type="text" id="frnTel" value="${escapeHtml(editData?.telephone || '')}">
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <div class="form-section-title">📍 Localisation</div>
                    <div class="form-grid">
                        <div class="form-field full-width">
                            <label>Adresse</label>
                            <textarea id="frnAdresse" rows="2">${escapeHtml(editData?.adresse || '')}</textarea>
                        </div>
                        <div class="form-field">
                            <label>Ville</label>
                            <input type="text" id="frnVille" value="${escapeHtml(editData?.ville || '')}">
                        </div>
                        <div class="form-field">
                            <label>Pays</label>
                            <input type="text" id="frnPays" value="${escapeHtml(editData?.pays || 'Cameroun')}">
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <div class="form-section-title">📦 Produits</div>
                    <div class="form-grid">
                        <div class="form-field full-width">
                            <label>Produits fournis</label>
                            <textarea id="frnProduits" rows="3" placeholder="Décrivez les produits fournis...">${escapeHtml(editData?.produits_fournis || '')}</textarea>
                        </div>
                    </div>
                </div>

                <div class="form-checkbox">
                    <input type="checkbox" id="frnActif" ${editData?.est_actif !== false ? 'checked' : ''}>
                    <label for="frnActif">Fournisseur actif</label>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 ${editData ? 'Enregistrer' : 'Créer'}</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="scFrnError" style="color:var(--danger); text-align:center; margin-top:0.5rem;"></p>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('scFrnForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = document.getElementById('scFrnError');
        errorEl.textContent = '';

        const payload = {
            nom: document.getElementById('frnNom').value,
            type_fournisseur: document.getElementById('frnType').value,
            contact_nom: document.getElementById('frnContact')?.value || '',
            email: document.getElementById('frnEmail')?.value || '',
            telephone: document.getElementById('frnTel')?.value || '',
            adresse: document.getElementById('frnAdresse')?.value || '',
            ville: document.getElementById('frnVille')?.value || '',
            pays: document.getElementById('frnPays')?.value || 'Cameroun',
            produits_fournis: document.getElementById('frnProduits')?.value || '',
            est_actif: document.getElementById('frnActif').checked
        };

        try {
            if (editData) {
                await apiPatch(endpoint, payload);
            } else {
                await apiPost(endpoint, payload);
            }
            modal.remove();
            navigateTo('supplychain');
        } catch (error) {
            errorEl.textContent = error.message;
        }
    });
}

async function editerFournisseurSC(id) {
    try {
        const frn = await apiGet(`/api/supplychain/fournisseurs/${id}/`);
        ouvrirFormulaireSCFournisseur(frn);
    } catch (error) {
        alert(`Erreur : ${error.message}`);
    }
}


// ========================================
// FORMULAIRE MOUVEMENT STOCK
// ========================================
async function ouvrirFormulaireSCMouvement() {
    const existant = document.getElementById('modalCreation');
    if (existant) existant.remove();

    // Charger la liste des produits
    let produits = [];
    try {
        const resp = await apiGet('/api/produits/');
        produits = Array.isArray(resp) ? resp : (resp.results || []);
    } catch (e) {
        console.warn('Produits indisponibles');
    }

    const modal = document.createElement('div');
    modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';

    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:550px; max-height:90vh; overflow-y:auto;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">➕ Mouvement de stock</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="scMvtForm" style="padding:1.5rem;">
                <div class="form-grid">
                    <div class="form-field">
                        <label>Produit <span class="required">*</span></label>
                        <select id="mvtProduit" required>
                            <option value="">Sélectionner...</option>
                            ${produits.map(p => `<option value="${p.id}">${escapeHtml(p.nom)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-field">
                        <label>Type <span class="required">*</span></label>
                        <select id="mvtType" required>
                            <option value="ENTREE">Entrée de stock</option>
                            <option value="SORTIE">Sortie de stock</option>
                            <option value="AJUSTEMENT">Ajustement</option>
                            <option value="PERTE">Perte / Déchet</option>
                        </select>
                    </div>
                    <div class="form-field">
                        <label>Quantité (kg) <span class="required">*</span></label>
                        <input type="number" id="mvtQuantite" step="0.01" required>
                    </div>
                    <div class="form-field full-width">
                        <label>Motif</label>
                        <textarea id="mvtMotif" rows="3" placeholder="Raison du mouvement..."></textarea>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 Enregistrer</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="scMvtError" style="color:var(--danger); text-align:center; margin-top:0.5rem;"></p>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('scMvtForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = document.getElementById('scMvtError');
        errorEl.textContent = '';

        try {
            await apiPost('/api/supplychain/mouvements-stock/', {
                produit: parseInt(document.getElementById('mvtProduit').value),
                type_mouvement: document.getElementById('mvtType').value,
                quantite_kg: parseFloat(document.getElementById('mvtQuantite').value),
                motif: document.getElementById('mvtMotif')?.value || ''
            });
            modal.remove();
            navigateTo('supplychain');
        } catch (error) {
            errorEl.textContent = error.message;
        }
    });
}


// ========================================
// AJOUTER LIGNE À COMMANDE
// ========================================
async function ajouterLigneCommande(cmdId) {
    const existant = document.getElementById('modalCreation');
    if (existant) existant.remove();

    let produits = [];
    let equipements = [];
    try {
        const rp = await apiGet('/api/produits/');
        produits = Array.isArray(rp) ? rp : (rp.results || []);
    } catch(e) {}
    try {
        const re = await apiGet('/api/equipements/equipements/');
        equipements = Array.isArray(re) ? re : (re.results || []);
    } catch(e) {}

    const modal = document.createElement('div');
    modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:600px; max-height:90vh; overflow-y:auto;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">➕ Ajouter une ligne</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="ligneForm" style="padding:1.5rem;">
                <div class="form-grid">
                    <div class="form-field full-width">
                        <label>Catégorie <span class="required">*</span></label>
                        <select id="ligneCat" required onchange="toggleLigneSource()">
                            <option value="PRODUIT_AGRICOLE">🌱 Produit agricole</option>
                            <option value="MATERIEL">🚜 Matériel / Équipement</option>
                            <option value="SERVICE">🔧 Service</option>
                            <option value="AUTRE">📄 Autre</option>
                        </select>
                    </div>
                    <div class="form-field full-width" id="divProduit">
                        <label>Produit agricole</label>
                        <select id="ligneProduit" onchange="preFillPrixProduit()">
                            <option value="">Sélectionner...</option>
                            ${produits.map(p => `<option value="${p.id}" data-prix="${p.prix_unitaire_fcfa}">${escapeHtml(p.nom)} (${escapeHtml(p.type_produit)}) — ${formatMoney(p.prix_unitaire_fcfa)}/kg</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-field full-width" id="divEquipement" style="display:none;">
                        <label>Équipement</label>
                        <select id="ligneEquipement">
                            <option value="">Sélectionner...</option>
                            ${equipements.map(e => `<option value="${e.id}">${escapeHtml(e.nom)} (${escapeHtml(e.reference)})</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-field full-width" id="divDescription" style="display:none;">
                        <label>Description</label>
                        <input type="text" id="ligneDesc" placeholder="Description du service ou autre">
                    </div>
                    <div class="form-field">
                        <label>Quantité <span class="required">*</span></label>
                        <input type="number" id="ligneQuantite" step="0.01" required>
                    </div>
                    <div class="form-field">
                        <label>Prix unitaire <span class="required">*</span></label>
                        <input type="number" id="lignePrix" step="0.01" required>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 Ajouter</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="ligneError" style="color:var(--danger); text-align:center;"></p>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('ligneForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const categorie = document.getElementById('ligneCat').value;
            const payload = {
                categorie_ligne: categorie,
                quantite_kg: parseFloat(document.getElementById('ligneQuantite').value),
                prix_unitaire: parseFloat(document.getElementById('lignePrix').value)
            };

            if (categorie === 'PRODUIT_AGRICOLE') {
                const produitId = document.getElementById('ligneProduit')?.value;
                if (produitId) payload.produit = parseInt(produitId);
            } else if (categorie === 'MATERIEL') {
                const eqId = document.getElementById('ligneEquipement')?.value;
                if (eqId) payload.equipement = parseInt(eqId);
            }

            const desc = document.getElementById('ligneDesc')?.value;
            if (desc) payload.description = desc;

            await apiPost(`/api/supplychain/commandes-clients/${cmdId}/ajouter_ligne/`, payload);
            modal.remove();
            voirDetailCommandeSC(cmdId);
        } catch (error) {
            document.getElementById('ligneError').textContent = error.message;
        }
    });
}

function toggleLigneSource() {
    const cat = document.getElementById('ligneCat').value;
    document.getElementById('divProduit').style.display = cat === 'PRODUIT_AGRICOLE' ? 'block' : 'none';
    document.getElementById('divEquipement').style.display = cat === 'MATERIEL' ? 'block' : 'none';
    document.getElementById('divDescription').style.display = ['SERVICE', 'AUTRE'].includes(cat) ? 'block' : 'none';
}

function preFillPrixProduit() {
    const select = document.getElementById('ligneProduit');
    const option = select.options[select.selectedIndex];
    const prix = option?.dataset?.prix;
    if (prix) {
        document.getElementById('lignePrix').value = prix;
    }
}


// ========================================
// CHANGEMENT DE STATUT
// ========================================
async function changerStatutCommandeSC(id) {
    const statuts = [
        { value: 'EN_ATTENTE', label: '⏳ En attente', color: '#FF9800' },
        { value: 'CONFIRMEE', label: '✅ Confirmée', color: '#4CAF50' },
        { value: 'EN_PREPARATION', label: '📦 En préparation', color: '#2196F3' },
        { value: 'EXPEDIEE', label: '🚚 Expédiée', color: '#9C27B0' },
        { value: 'LIVREE', label: '🏁 Livrée', color: '#4CAF50' },
        { value: 'ANNULEE', label: '❌ Annulée', color: '#F44336' }
    ];

    const existant = document.getElementById('modalCreation');
    if (existant) existant.remove();

    const modal = document.createElement('div');
    modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';

    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:400px;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">📋 Changer le statut</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <div style="padding:1.5rem; display:flex; flex-direction:column; gap:0.5rem;">
                ${statuts.map(s => `
                    <button class="btn btn-outline" style="justify-content:flex-start; border-color:${s.color}; color:${s.color};"
                            onclick="confirmerStatutCommande(${id}, '${s.value}')">
                        ${s.label}
                    </button>
                `).join('')}
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

async function confirmerStatutCommande(id, statut) {
    try {
        await apiPost(`/api/supplychain/commandes-clients/${id}/changer_statut/`, { statut });
        document.getElementById('modalCreation')?.remove();
        navigateTo('supplychain');
    } catch (error) {
        alert(`Erreur : ${error.message}`);
    }
}

async function changerStatutLivraisonSC(id) {
    const statuts = [
        { value: 'PLANIFIEE', label: '📋 Planifiée' },
        { value: 'EN_TRANSIT', label: '🚚 En transit' },
        { value: 'LIVREE', label: '✅ Livrée' },
        { value: 'RETOUR', label: '↩️ Retour' },
        { value: 'ANNULEE', label: '❌ Annulée' }
    ];

    const existant = document.getElementById('modalCreation');
    if (existant) existant.remove();

    const modal = document.createElement('div');
    modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';

    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:400px;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">📋 Statut livraison</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <div style="padding:1.5rem; display:flex; flex-direction:column; gap:0.5rem;">
                ${statuts.map(s => `
                    <button class="btn btn-outline" onclick="confirmerStatutLivraison(${id}, '${s.value}')">${s.label}</button>
                `).join('')}
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

async function confirmerStatutLivraison(id, statut) {
    try {
        await apiPost(`/api/supplychain/livraisons/${id}/changer_statut/`, { statut });
        document.getElementById('modalCreation')?.remove();
        navigateTo('supplychain');
    } catch (error) {
        alert(`Erreur : ${error.message}`);
    }
}







// ========================================
// MODULE SUPPLY CHAIN — CRUD COMPLET
// ========================================

async function loadSupplychainModule() {
    const area = document.getElementById('contentArea');

    try {
        const [dashboard, commandes, commandesFrn, fournisseurs, livraisons, mouvements] = await Promise.all([
            apiGet('/api/supplychain/dashboard/').catch(() => null),
            apiGet('/api/supplychain/commandes-clients/').catch(() => []),
            apiGet('/api/supplychain/commandes-fournisseurs/').catch(() => []),
            apiGet('/api/supplychain/fournisseurs/').catch(() => []),
            apiGet('/api/supplychain/livraisons/').catch(() => []),
            apiGet('/api/supplychain/mouvements-stock/').catch(() => [])
        ]);

        const cmdList = Array.isArray(commandes) ? commandes : (commandes.results || []);
        const cmdFrnList = Array.isArray(commandesFrn) ? commandesFrn : (commandesFrn.results || []);
        const frnList = Array.isArray(fournisseurs) ? fournisseurs : (fournisseurs.results || []);
        const livList = Array.isArray(livraisons) ? livraisons : (livraisons.results || []);
        const mvtList = Array.isArray(mouvements) ? mouvements : (mouvements.results || []);

        area.innerHTML = `
            <!-- Stats -->
            <div class="stats-row">
                <div class="stat-card">
                    <div class="stat-card-icon blue">📦</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${dashboard?.commandes_en_cours || cmdList.filter(c => !['LIVREE','ANNULEE'].includes(c.statut)).length}</div>
                        <div class="stat-card-label">Commandes en cours</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon green">✅</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${dashboard?.commandes_livrees || cmdList.filter(c => c.statut === 'LIVREE').length}</div>
                        <div class="stat-card-label">Livrées</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon orange">🚚</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${dashboard?.livraisons_en_transit || livList.filter(l => l.statut === 'EN_TRANSIT').length}</div>
                        <div class="stat-card-label">En transit</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon purple">🏭</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${dashboard?.fournisseurs_actifs || frnList.filter(f => f.est_actif).length}</div>
                        <div class="stat-card-label">Fournisseurs</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon teal">💰</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${formatMoney(dashboard?.chiffre_affaires_livrees || 0)}</div>
                        <div class="stat-card-label">CA Livraisons</div>
                    </div>
                </div>
            </div>

            <!-- Onglets -->
            <div class="card">
                <div class="card-header" style="overflow-x:auto;">
                    <div class="tab-nav" style="flex-wrap:nowrap; min-width:max-content;">
                        <button class="tab-btn active" onclick="switchTab('sc', 'commandes', this)">📦 Commandes (${cmdList.length})</button>
                        <button class="tab-btn" onclick="switchTab('sc', 'achats', this)">🛒 Achats (${cmdFrnList.length})</button>
                        <button class="tab-btn" onclick="switchTab('sc', 'fournisseurs', this)">🏭 Fournisseurs (${frnList.length})</button>
                        <button class="tab-btn" onclick="switchTab('sc', 'livraisons', this)">🚚 Livraisons (${livList.length})</button>
                        <button class="tab-btn" onclick="switchTab('sc', 'stock', this)">📊 Gestion de stocks (${mvtList.length})</button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="tab-content active" id="sc_commandes">
                        ${renderSCCommandes(cmdList)}
                    </div>
                    <div class="tab-content" id="sc_achats">
                        ${renderSCAchats(cmdFrnList)}
                    </div>
                    <div class="tab-content" id="sc_fournisseurs">
                        ${renderSCFournisseurs(frnList)}
                    </div>
                    <div class="tab-content" id="sc_livraisons">
                        ${renderSCLivraisons(livList)}
                    </div>
                    <div class="tab-content" id="sc_stock">
                        ${renderSCStock(mvtList)}
                    </div>
                </div>
            </div>
        `;

    } catch (error) {
        showError(`Supply Chain : ${error.message}`);
    }
}


// ========================================
// TAB : COMMANDES CLIENTS
// ========================================
function renderSCCommandes(cmdList) {
    const searchValue = getSearchValue('supplychain');
    let filtered = cmdList;
    if (searchValue) {
        filtered = filterLocally(filtered, searchValue, ['reference', 'client_nom', 'client_entreprise', 'destination']);
    }
    const filterStatut = getFilterValue('supplychain', 'statut_cmd');
    if (filterStatut) {
        filtered = filtered.filter(c => c.statut === filterStatut);
    }

    // Déterminer le type principal de chaque commande
    const getTypeCommande = (cmd) => {
        if (!cmd.lignes || cmd.lignes.length === 0) return { icon: '📦', label: 'Non défini' };
        const categories = cmd.lignes.map(l => l.categorie_ligne || 'AUTRE');
        if (categories.includes('PRODUIT_AGRICOLE') && categories.includes('MATERIEL')) return { icon: '📦', label: 'Mixte' };
        if (categories.every(c => c === 'PRODUIT_AGRICOLE')) return { icon: '🌱', label: 'Produits' };
        if (categories.every(c => c === 'MATERIEL')) return { icon: '🚜', label: 'Matériel' };
        if (categories.every(c => c === 'SERVICE')) return { icon: '🔧', label: 'Service' };
        return { icon: '📦', label: 'Mixte' };
    };

    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">📦 Commandes Clients</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireSCCommande()">+ Nouvelle commande</button>
            <button class="btn-export" onclick="exporterOngletActifExcel('Commandes_Clients')">📊 Excel</button>
        </div>
        ${renderSearchBar({
            placeholder: 'Rechercher une commande...',
            moduleRedirect: 'supplychain',
            filters: [{
                key: 'statut_cmd', label: 'Statut',
                options: [
                    {value:'EN_ATTENTE', label:'En attente'}, {value:'CONFIRMEE', label:'Confirmée'},
                    {value:'EN_PREPARATION', label:'En préparation'}, {value:'EXPEDIEE', label:'Expédiée'},
                    {value:'LIVREE', label:'Livrée'}, {value:'ANNULEE', label:'Annulée'}
                ]
            }]
        })}

        ${filtered.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📦</div><h3>Aucune commande</h3></div>' : `
            <p class="scroll-hint">👆 Faites défiler horizontalement →</p>
            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead>
                            <tr>
                                <th>Référence</th>
                                <th>Type</th>
                                <th>Client</th>
                                <th>Destination</th>
                                <th>Articles</th>
                                <th>Montant</th>
                                <th>Statut</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filtered.map(cmd => {
                                const type = getTypeCommande(cmd);
                                const nbArticles = (cmd.lignes || []).length;
                                return `
                                    <tr>
                                        <td><strong>${escapeHtml(cmd.reference)}</strong></td>
                                        <td><span class="badge badge-info" style="font-size:0.75rem;">${type.icon} ${type.label}</span></td>
                                        <td>${escapeHtml(cmd.client_nom)}<br><small style="color:var(--text-light);">${escapeHtml(cmd.client_entreprise || '')}</small></td>
                                        <td><small>${escapeHtml(cmd.destination)}</small></td>
                                        <td><span class="badge ${nbArticles > 0 ? 'badge-success' : 'badge-warning'}">${nbArticles} article(s)</span></td>
                                        <td><strong>${formatMoney(cmd.montant_total, cmd.devise)}</strong></td>
                                        <td><span class="badge ${getBadgeClass(cmd.statut)}">${escapeHtml(cmd.statut_display || cmd.statut)}</span></td>
                                        <td><small>${formatDate(cmd.date_commande)}</small></td>
                                        <td>
                                            <div class="item-actions">
                                                <button class="btn btn-sm btn-outline" onclick="voirDetailCommandeSC(${cmd.id})" title="Détail">👁️</button>
                                                ${!['LIVREE','ANNULEE'].includes(cmd.statut) ? `
                                                    <button class="btn btn-sm btn-success" onclick="changerStatutCommandeSC(${cmd.id})" title="Statut">📋</button>
                                                    <button class="btn btn-sm btn-outline" onclick="editerCommandeSC(${cmd.id})" title="Modifier">✏️</button>
                                                ` : ''}
                                                <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/supplychain/commandes-clients/${cmd.id}/', 'supplychain')">🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="responsive-mobile-view">
                ${filtered.map(cmd => {
                    const type = getTypeCommande(cmd);
                    const nbArticles = (cmd.lignes || []).length;
                    return `
                        <div class="responsive-card">
                            <div class="responsive-card-header">
                                <div>
                                    <strong>${escapeHtml(cmd.reference)}</strong>
                                    <br><small>${escapeHtml(cmd.client_nom)} ${cmd.client_entreprise ? '— ' + escapeHtml(cmd.client_entreprise) : ''}</small>
                                </div>
                                <span class="badge ${getBadgeClass(cmd.statut)}">${escapeHtml(cmd.statut_display || cmd.statut)}</span>
                            </div>
                            <div class="responsive-card-body">
                                <div class="responsive-card-row"><span class="responsive-card-label">📋 Type</span><span class="badge badge-info">${type.icon} ${type.label}</span></div>
                                <div class="responsive-card-row"><span class="responsive-card-label">📍 Destination</span><span>${escapeHtml(cmd.destination)}</span></div>
                                <div class="responsive-card-row"><span class="responsive-card-label">📦 Articles</span><span class="badge ${nbArticles > 0 ? 'badge-success' : 'badge-warning'}">${nbArticles} article(s)</span></div>
                                <div class="responsive-card-row"><span class="responsive-card-label">💰 Montant</span><span style="font-weight:700;">${formatMoney(cmd.montant_total, cmd.devise)}</span></div>
                                <div class="responsive-card-row"><span class="responsive-card-label">📅 Date</span><span>${formatDate(cmd.date_commande)}</span></div>
                            </div>
                            <div class="responsive-card-footer">
                                <button class="btn btn-sm btn-outline" onclick="voirDetailCommandeSC(${cmd.id})">👁️</button>
                                ${!['LIVREE','ANNULEE'].includes(cmd.statut) ? `
                                    <button class="btn btn-sm btn-success" onclick="changerStatutCommandeSC(${cmd.id})">📋</button>
                                    <button class="btn btn-sm btn-outline" onclick="editerCommandeSC(${cmd.id})">✏️</button>
                                ` : ''}
                                <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/supplychain/commandes-clients/${cmd.id}/', 'supplychain')">🗑️</button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `}
    `;
}


// ========================================
// TAB : ACHATS (COMMANDES FOURNISSEURS)
// ========================================
function renderSCAchats(cmdFrnList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">🛒 Achats (Commandes Fournisseurs)</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireSCAchat()">+ Nouvel achat</button>
        </div>
        <div class="table-container">
            <table class="dash-table">
                <thead>
                    <tr>
                        <th>Référence</th>
                        <th>Fournisseur</th>
                        <th>Montant</th>
                        <th>Statut</th>
                        <th>Date commande</th>
                        <th>Livraison prévue</th>
                        <th>Réception</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${cmdFrnList.length === 0 ? '<tr><td colspan="8" style="text-align:center; padding:2rem;">Aucun achat</td></tr>' :
                    cmdFrnList.map(a => `
                        <tr>
                            <td><strong>${escapeHtml(a.reference)}</strong></td>
                            <td>${escapeHtml(a.fournisseur_nom || 'N/A')}</td>
                            <td><strong>${formatMoney(a.montant_total, a.devise)}</strong></td>
                            <td><span class="badge ${getBadgeClass(a.statut)}">${escapeHtml(a.statut_display || a.statut)}</span></td>
                            <td>${formatDate(a.date_commande)}</td>
                            <td>${formatDate(a.date_livraison_prevue)}</td>
                            <td>${formatDate(a.date_reception)}</td>
                            <td>
                                <div class="item-actions">
                                    <button class="btn btn-sm btn-outline" onclick="voirDetailAchat(${a.id})" title="Détail">👁️</button>
                                    ${!['RECUE','ANNULEE'].includes(a.statut) ? `
                                        <button class="btn btn-sm btn-success" onclick="changerStatutAchat(${a.id})" title="Statut">📋</button>
                                        <button class="btn btn-sm btn-outline" onclick="editerAchat(${a.id})" title="Modifier">✏️</button>
                                    ` : ''}
                                    <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/supplychain/commandes-fournisseurs/${a.id}/', 'supplychain')" title="Supprimer">🗑️</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}


// ========================================
// TAB : FOURNISSEURS
// ========================================
function renderSCFournisseurs(frnList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">🏭 Fournisseurs</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireSCFournisseur()">+ Ajouter un fournisseur</button>
            <button class="btn-export" onclick="exporterOngletActifExcel('Fournisseurs')">📊 Excel</button>
        </div>
        <div class="table-container">
            <table class="dash-table">
                <thead>
                    <tr>
                        <th>Nom</th>
                        <th>Type</th>
                        <th>Contact</th>
                        <th>Email</th>
                        <th>Téléphone</th>
                        <th>Ville</th>
                        <th>Pays</th>
                        <th>Actif</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${frnList.length === 0 ? '<tr><td colspan="9" style="text-align:center; padding:2rem;">Aucun fournisseur</td></tr>' :
                    frnList.map(f => `
                        <tr>
                            <td><strong>${escapeHtml(f.nom)}</strong></td>
                            <td><span class="badge badge-info">${escapeHtml(f.type_display || f.type_fournisseur)}</span></td>
                            <td>${escapeHtml(f.contact_nom || 'N/A')}</td>
                            <td>${f.email ? `<a href="mailto:${f.email}" style="color:var(--primary);">${escapeHtml(f.email)}</a>` : 'N/A'}</td>
                            <td>${escapeHtml(f.telephone || 'N/A')}</td>
                            <td>${escapeHtml(f.ville || 'N/A')}</td>
                            <td>${escapeHtml(f.pays || 'N/A')}</td>
                            <td>${f.est_actif ? '<span class="badge badge-success">Oui</span>' : '<span class="badge badge-danger">Non</span>'}</td>
                            <td>
                                <div class="item-actions">
                                    <button class="btn btn-sm btn-outline" onclick="editerFournisseurSC(${f.id})" title="Modifier">✏️</button>
                                    <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/supplychain/fournisseurs/${f.id}/', 'supplychain')" title="Supprimer">🗑️</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}


// ========================================
// TAB : LIVRAISONS
// ========================================
function renderSCLivraisons(livList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">🚚 Livraisons</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireSCLivraison()">+ Nouvelle livraison</button>
            <button class="btn-export" onclick="exporterOngletActifExcel('Livraisons')">📊 Excel</button>
        </div>
        <div class="table-container">
            <table class="dash-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Commande</th>
                        <th>Transporteur</th>
                        <th>Mode</th>
                        <th>Tracking</th>
                        <th>Départ → Arrivée</th>
                        <th>Poids</th>
                        <th>Coût</th>
                        <th>Statut</th>
                        <th>Expédition</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${livList.length === 0 ? '<tr><td colspan="11" style="text-align:center; padding:2rem;">Aucune livraison</td></tr>' :
                    livList.map(l => `
                        <tr>
                            <td>#${l.id}</td>
                            <td><strong>${escapeHtml(l.commande_reference || 'N/A')}</strong></td>
                            <td>${escapeHtml(l.transporteur || 'N/A')}</td>
                            <td><span class="badge badge-info">${escapeHtml(l.mode_display || l.mode_transport)}</span></td>
                            <td><small>${escapeHtml(l.numero_tracking || 'N/A')}</small></td>
                            <td><small>${escapeHtml(l.adresse_depart || '?')} → ${escapeHtml(l.adresse_arrivee || '?')}</small></td>
                            <td>${l.poids_total_kg || 0} kg</td>
                            <td>${formatMoney(l.cout_transport || 0)}</td>
                            <td><span class="badge ${getBadgeClass(l.statut)}">${escapeHtml(l.statut_display || l.statut)}</span></td>
                            <td>${formatDate(l.date_expedition)}</td>
                            <td>
                                <div class="item-actions">
                                    ${!['LIVREE','ANNULEE'].includes(l.statut) ? `
                                        <button class="btn btn-sm btn-success" onclick="changerStatutLivraisonSC(${l.id})" title="Statut">📋</button>
                                    ` : ''}
                                    <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/supplychain/livraisons/${l.id}/', 'supplychain')" title="Supprimer">🗑️</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}


// ========================================
// TAB : GESTION DE STOCKS
// ========================================
function renderSCStock(mvtList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">📊 Gestion de Stocks</h4>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireSCMouvement()">+ Mouvement</button>
                <button class="btn btn-outline btn-sm" onclick="voirEtatStocks()">📦 État des stocks</button>
                <button class="btn-export" onclick="exporterOngletActifExcel('Mouvements_Stock')">📊 Excel</button>
            </div>
        </div>

        ${mvtList.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📊</div><h3>Aucun mouvement de stock</h3></div>' : `
            <p class="scroll-hint">👆 Faites défiler horizontalement →</p>
            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Produit</th>
                                <th>Type</th>
                                <th>Quantité (kg)</th>
                                <th>Fournisseur</th>
                                <th>Stock restant</th>
                                <th>Motif</th>
                                <th>Effectué par</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${mvtList.map(m => `
                                <tr>
                                    <td>#${m.id}</td>
                                    <td><strong>${escapeHtml(m.produit_nom || 'N/A')}</strong></td>
                                    <td><span class="badge ${m.type_mouvement === 'ENTREE' ? 'badge-success' : m.type_mouvement === 'SORTIE' ? 'badge-danger' : 'badge-warning'}">${escapeHtml(m.type_display || m.type_mouvement)}</span></td>
                                    <td style="font-weight:700; color:${m.type_mouvement === 'ENTREE' ? 'var(--success)' : 'var(--danger)'};">
                                        ${m.type_mouvement === 'ENTREE' ? '+' : '-'}${m.quantite_kg} kg
                                    </td>
                                    <td><small>${escapeHtml(m.fournisseur_nom || m.commande_fournisseur_ref || 'N/A')}</small></td>
                                    <td><strong>${m.stock_restant !== undefined ? m.stock_restant + ' kg' : 'N/A'}</strong></td>
                                    <td><small>${escapeHtml((m.motif || '').substring(0, 40))}</small></td>
                                    <td><small>${escapeHtml(m.effectue_par_nom || 'N/A')}</small></td>
                                    <td><small>${formatDateTime(m.date_mouvement)}</small></td>
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
                            <div>
                                <strong>${escapeHtml(m.produit_nom || 'N/A')}</strong>
                                <br><small>#${m.id} — ${formatDateTime(m.date_mouvement)}</small>
                            </div>
                            <span class="badge ${m.type_mouvement === 'ENTREE' ? 'badge-success' : 'badge-danger'}">${escapeHtml(m.type_display || m.type_mouvement)}</span>
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row"><span class="responsive-card-label">📊 Quantité</span><span style="font-weight:700; color:${m.type_mouvement === 'ENTREE' ? 'var(--success)' : 'var(--danger)'};">${m.type_mouvement === 'ENTREE' ? '+' : '-'}${m.quantite_kg} kg</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">🏭 Fournisseur</span><span>${escapeHtml(m.fournisseur_nom || 'N/A')}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📦 Stock restant</span><span><strong>${m.stock_restant !== undefined ? m.stock_restant + ' kg' : 'N/A'}</strong></span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📝 Motif</span><span><small>${escapeHtml(m.motif || 'N/A')}</small></span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">👤 Par</span><span>${escapeHtml(m.effectue_par_nom || 'N/A')}</span></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}


// État des stocks — Vue récapitulative
async function voirEtatStocks() {
    try {
        const produits = await apiGet('/api/produits/');
        const prodList = Array.isArray(produits) ? produits : (produits.results || []);

        const existant = document.getElementById('modalCreation');
        if (existant) existant.remove();

        const modal = document.createElement('div');
        modal.id = 'modalCreation';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
        modal.innerHTML = `
            <div style="background:white; border-radius:16px; width:100%; max-width:700px; max-height:90vh; overflow-y:auto;">
                <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                    <h3 style="color:var(--primary);">📦 État actuel des stocks</h3>
                    <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.5rem; cursor:pointer;">✕</button>
                </div>
                <div style="padding:1.5rem;">
                    ${prodList.length === 0 ? '<p style="text-align:center; color:var(--text-light);">Aucun produit</p>' : `
                        <div class="table-container">
                            <table class="dash-table">
                                <thead>
                                    <tr>
                                        <th>Produit</th>
                                        <th>Type</th>
                                        <th>Stock actuel (kg)</th>
                                        <th>Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${prodList.map(p => {
                                        const stock = p.stock_kg || 0;
                                        let statut = '';
                                        if (stock <= 0) statut = '<span class="badge badge-danger">❌ Rupture</span>';
                                        else if (stock < 100) statut = '<span class="badge badge-warning">⚠️ Faible</span>';
                                        else statut = '<span class="badge badge-success">✅ OK</span>';

                                        return `
                                            <tr ${stock <= 0 ? 'style="background:#fff0f0;"' : stock < 100 ? 'style="background:#fff8e1;"' : ''}>
                                                <td><strong>${escapeHtml(p.nom)}</strong></td>
                                                <td><span class="badge badge-info">${escapeHtml(p.type_produit || 'N/A')}</span></td>
                                                <td style="font-weight:700; font-size:1.1rem;">${stock} kg</td>
                                                <td>${statut}</td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    } catch (error) { alert(`Erreur : ${error.message}`); }
}


// ========================================
// FORMULAIRE ACHAT (COMMANDE FOURNISSEUR)
// ========================================
async function ouvrirFormulaireSCAchat(editData = null) {
    const existant = document.getElementById('modalCreation');
    if (existant) existant.remove();

    let fournisseurs = [];
    try {
        const resp = await apiGet('/api/supplychain/fournisseurs/');
        fournisseurs = Array.isArray(resp) ? resp : (resp.results || []);
    } catch (e) {}

    const titre = editData ? `Modifier achat ${editData.reference}` : 'Nouvel achat fournisseur';
    const endpoint = editData ? `/api/supplychain/commandes-fournisseurs/${editData.id}/` : '/api/supplychain/commandes-fournisseurs/';

    const modal = document.createElement('div');
    modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';

    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:650px; max-height:90vh; overflow-y:auto;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">${editData ? '✏️' : '➕'} ${titre}</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="scAchatForm" style="padding:1.5rem;">
                <div class="form-section">
                    <div class="form-section-title">🏭 Fournisseur</div>
                    <div class="form-grid">
                        <div class="form-field full-width">
                            <label>Fournisseur <span class="required">*</span></label>
                            <select id="achatFournisseur" required>
                                <option value="">Sélectionner...</option>
                                ${fournisseurs.map(f => `<option value="${f.id}" ${editData?.fournisseur === f.id ? 'selected' : ''}>${escapeHtml(f.nom)} (${escapeHtml(f.type_display || f.type_fournisseur)})</option>`).join('')}
                            </select>
                        </div>
                    </div>
                </div>
                <div class="form-section">
                    <div class="form-section-title">📦 Détails</div>
                    <div class="form-grid">
                        <div class="form-field">
                            <label>Montant total HT <span class="required">*</span></label>
                            <input type="number" id="achatMontant" step="0.01" value="${editData?.montant_total || 0}" required>
                        </div>
                        <div class="form-field">
                            <label>Date livraison prévue</label>
                            <input type="date" id="achatDateLivraison" value="${editData?.date_livraison_prevue || ''}">
                        </div>
                        <div class="form-field">
                            <label>Devise</label>
                            <select id="achatDevise">
                                <option value="FCFA" ${editData?.devise === 'FCFA' ? 'selected' : ''}>FCFA</option>
                                <option value="EUR" ${editData?.devise === 'EUR' ? 'selected' : ''}>EUR</option>
                                <option value="USD" ${editData?.devise === 'USD' ? 'selected' : ''}>USD</option>
                            </select>
                        </div>
                        <div class="form-field full-width">
                            <label>Notes</label>
                            <textarea id="achatNotes" rows="3">${escapeHtml(editData?.notes || '')}</textarea>
                        </div>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 ${editData ? 'Enregistrer' : 'Créer l\'achat'}</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="scAchatError" style="color:var(--danger); text-align:center; margin-top:0.5rem;"></p>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('scAchatForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const payload = {
                fournisseur: parseInt(document.getElementById('achatFournisseur').value),
                montant_total: parseFloat(document.getElementById('achatMontant').value) || 0,
                date_livraison_prevue: document.getElementById('achatDateLivraison')?.value || null,
                devise: document.getElementById('achatDevise').value,
                notes: document.getElementById('achatNotes')?.value || ''
            };
            if (editData) {
                await apiPatch(endpoint, payload);
            } else {
                await apiPost(endpoint, payload);
            }
            modal.remove();
            navigateTo('supplychain');
        } catch (error) {
            document.getElementById('scAchatError').textContent = error.message;
        }
    });
}

async function editerAchat(id) {
    try {
        const achat = await apiGet(`/api/supplychain/commandes-fournisseurs/${id}/`);
        ouvrirFormulaireSCAchat(achat);
    } catch (error) { alert(`Erreur : ${error.message}`); }
}

async function voirDetailAchat(id) {
    try {
        const a = await apiGet(`/api/supplychain/commandes-fournisseurs/${id}/`);
        const modal = document.createElement('div');
        modal.id = 'modalCreation';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
        modal.innerHTML = `
            <div style="background:white; border-radius:16px; width:100%; max-width:700px; max-height:90vh; overflow-y:auto;">
                <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                    <h3 style="color:var(--primary);">🛒 Achat ${escapeHtml(a.reference)}</h3>
                    <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
                </div>
                <div style="padding:1.5rem;">
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">📋 Informations</div>
                        <div class="detail-row"><span class="detail-label">Référence</span><span class="detail-value"><strong>${escapeHtml(a.reference)}</strong></span></div>
                        <div class="detail-row"><span class="detail-label">Fournisseur</span><span class="detail-value">${escapeHtml(a.fournisseur_nom || 'N/A')}</span></div>
                        <div class="detail-row"><span class="detail-label">Statut</span><span class="detail-value"><span class="badge ${getBadgeClass(a.statut)}">${escapeHtml(a.statut_display || a.statut)}</span></span></div>
                        <div class="detail-row"><span class="detail-label">Montant</span><span class="detail-value" style="font-weight:700; color:var(--primary);">${formatMoney(a.montant_total, a.devise)}</span></div>
                        <div class="detail-row"><span class="detail-label">Date commande</span><span class="detail-value">${formatDateTime(a.date_commande)}</span></div>
                        <div class="detail-row"><span class="detail-label">Livraison prévue</span><span class="detail-value">${formatDate(a.date_livraison_prevue)}</span></div>
                        <div class="detail-row"><span class="detail-label">Date réception</span><span class="detail-value">${formatDate(a.date_reception) || 'Non reçue'}</span></div>
                        ${a.notes ? `<div class="detail-row"><span class="detail-label">Notes</span><span class="detail-value">${escapeHtml(a.notes)}</span></div>` : ''}
                    </div>
                    ${a.lignes && a.lignes.length > 0 ? `
                        <div class="inline-section">
                            <div class="inline-header">
                                <h4>📋 Lignes d'achat (${a.lignes.length})</h4>
                                <button class="btn btn-sm btn-primary" onclick="ajouterLigneAchat(${a.id})">+ Ajouter</button>
                            </div>
                            <table class="dash-table">
                                <thead><tr><th>Produit</th><th>Quantité (kg)</th><th>Prix unitaire</th><th>Sous-total</th></tr></thead>
                                <tbody>
                                    ${a.lignes.map(l => `
                                        <tr>
                                            <td>${escapeHtml(l.produit_nom || 'N/A')}</td>
                                            <td>${l.quantite_kg} kg</td>
                                            <td>${formatMoney(l.prix_unitaire)}</td>
                                            <td><strong>${formatMoney(l.sous_total)}</strong></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : `
                        <div class="inline-section">
                            <div class="inline-header">
                                <h4>📋 Lignes d'achat</h4>
                                <button class="btn btn-sm btn-primary" onclick="ajouterLigneAchat(${a.id})">+ Ajouter</button>
                            </div>
                            <p style="text-align:center; color:var(--text-light); padding:1rem;">Aucune ligne</p>
                        </div>
                    `}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    } catch (error) { alert(`Erreur : ${error.message}`); }
}

async function changerStatutAchat(id) {
    const statuts = [
        { value: 'BROUILLON', label: '📝 Brouillon' },
        { value: 'ENVOYEE', label: '📤 Envoyée au fournisseur' },
        { value: 'CONFIRMEE', label: '✅ Confirmée' },
        { value: 'RECUE', label: '📦 Marchandise reçue' },
        { value: 'ANNULEE', label: '❌ Annulée' }
    ];

    const existant = document.getElementById('modalCreation');
    if (existant) existant.remove();

    const modal = document.createElement('div');
    modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:400px;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">📋 Statut achat</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <div style="padding:1.5rem; display:flex; flex-direction:column; gap:0.5rem;">
                ${statuts.map(s => `
                    <button class="btn btn-outline" onclick="confirmerStatutAchat(${id}, '${s.value}')">${s.label}</button>
                `).join('')}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

async function confirmerStatutAchat(id, statut) {
    // Note: l'endpoint changer_statut n'existe pas pour commandes-fournisseurs
    // On utilise PATCH directement
    try {
        await apiPatch(`/api/supplychain/commandes-fournisseurs/${id}/`, { statut });
        document.getElementById('modalCreation')?.remove();
        navigateTo('supplychain');
    } catch (error) { alert(`Erreur : ${error.message}`); }
}

async function ajouterLigneAchat(achatId) {
    const existant = document.getElementById('modalCreation');
    if (existant) existant.remove();

    let produits = [];
    try {
        const resp = await apiGet('/api/produits/');
        produits = Array.isArray(resp) ? resp : (resp.results || []);
    } catch (e) {}

    const modal = document.createElement('div');
    modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:500px;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">➕ Ajouter une ligne d'achat</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="ligneAchatForm" style="padding:1.5rem;">
                <div class="form-grid">
                    <div class="form-field full-width">
                        <label>Produit <span class="required">*</span></label>
                        <select id="ligneAchatProduit" required>
                            <option value="">Sélectionner...</option>
                            ${produits.map(p => `<option value="${p.id}">${escapeHtml(p.nom)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-field">
                        <label>Quantité (kg) <span class="required">*</span></label>
                        <input type="number" id="ligneAchatQte" step="0.01" required>
                    </div>
                    <div class="form-field">
                        <label>Prix unitaire <span class="required">*</span></label>
                        <input type="number" id="ligneAchatPrix" step="0.01" required>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 Ajouter</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="ligneAchatError" style="color:var(--danger); text-align:center; margin-top:0.5rem;"></p>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('ligneAchatForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await apiPost(`/api/supplychain/commandes-fournisseurs/${achatId}/ajouter_ligne/`, {
                produit: parseInt(document.getElementById('ligneAchatProduit').value),
                quantite_kg: parseFloat(document.getElementById('ligneAchatQte').value),
                prix_unitaire: parseFloat(document.getElementById('ligneAchatPrix').value)
            });
            modal.remove();
            voirDetailAchat(achatId);
        } catch (error) {
            document.getElementById('ligneAchatError').textContent = error.message;
        }
    });
}


// ========================================
// FORMULAIRE LIVRAISON
// ========================================
async function ouvrirFormulaireSCLivraison() {
    const existant = document.getElementById('modalCreation');
    if (existant) existant.remove();

    let commandes = [];
    try {
        const resp = await apiGet('/api/supplychain/commandes-clients/');
        commandes = Array.isArray(resp) ? resp : (resp.results || []);
        commandes = commandes.filter(c => !['LIVREE', 'ANNULEE'].includes(c.statut));
    } catch (e) {}

    const modal = document.createElement('div');
    modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';

    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:650px; max-height:90vh; overflow-y:auto;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">➕ Nouvelle livraison</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="scLivForm" style="padding:1.5rem;">
                <div class="form-section">
                    <div class="form-section-title">📦 Commande associée</div>
                    <div class="form-grid">
                        <div class="form-field full-width">
                            <label>Commande <span class="required">*</span></label>
                            <select id="livCommande" required>
                                <option value="">Sélectionner...</option>
                                ${commandes.map(c => `<option value="${c.id}">${escapeHtml(c.reference)} - ${escapeHtml(c.client_nom)} (${escapeHtml(c.destination)})</option>`).join('')}
                            </select>
                        </div>
                    </div>
                </div>
                <div class="form-section">
                    <div class="form-section-title">🚚 Transport</div>
                    <div class="form-grid">
                        <div class="form-field">
                            <label>Transporteur</label>
                            <input type="text" id="livTransporteur" placeholder="Nom du transporteur">
                        </div>
                        <div class="form-field">
                            <label>Mode de transport</label>
                            <select id="livMode">
                                <option value="ROUTIER">Routier</option>
                                <option value="MARITIME">Maritime</option>
                                <option value="AERIEN">Aérien</option>
                                <option value="FERROVIAIRE">Ferroviaire</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>N° Tracking</label>
                            <input type="text" id="livTracking" placeholder="Numéro de suivi">
                        </div>
                    </div>
                </div>
                <div class="form-section">
                    <div class="form-section-title">📍 Itinéraire</div>
                    <div class="form-grid">
                        <div class="form-field">
                            <label>Adresse départ</label>
                            <input type="text" id="livDepart" value="Douala, Cameroun">
                        </div>
                        <div class="form-field">
                            <label>Adresse arrivée</label>
                            <input type="text" id="livArrivee" placeholder="Destination">
                        </div>
                        <div class="form-field">
                            <label>Poids total (kg)</label>
                            <input type="number" id="livPoids" step="0.01" value="0">
                        </div>
                        <div class="form-field">
                            <label>Coût transport</label>
                            <input type="number" id="livCout" step="0.01" value="0">
                        </div>
                        <div class="form-field">
                            <label>Date expédition</label>
                            <input type="date" id="livDateExp">
                        </div>
                        <div class="form-field">
                            <label>Livraison estimée</label>
                            <input type="date" id="livDateEst">
                        </div>
                    </div>
                </div>
                <div class="form-grid">
                    <div class="form-field full-width">
                        <label>Notes</label>
                        <textarea id="livNotes" rows="2"></textarea>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 Créer la livraison</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="scLivError" style="color:var(--danger); text-align:center; margin-top:0.5rem;"></p>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('scLivForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await apiPost('/api/supplychain/livraisons/', {
                commande: parseInt(document.getElementById('livCommande').value),
                transporteur: document.getElementById('livTransporteur')?.value || '',
                mode_transport: document.getElementById('livMode').value,
                numero_tracking: document.getElementById('livTracking')?.value || '',
                adresse_depart: document.getElementById('livDepart')?.value || 'Douala, Cameroun',
                adresse_arrivee: document.getElementById('livArrivee')?.value || '',
                poids_total_kg: parseFloat(document.getElementById('livPoids').value) || 0,
                cout_transport: parseFloat(document.getElementById('livCout').value) || 0,
                date_expedition: document.getElementById('livDateExp')?.value || null,
                date_livraison_estimee: document.getElementById('livDateEst')?.value || null,
                notes: document.getElementById('livNotes')?.value || ''
            });
            modal.remove();
            navigateTo('supplychain');
        } catch (error) {
            document.getElementById('scLivError').textContent = error.message;
        }
    });
}
