// ========================================
// MODULE FINANCE — CRUD COMPLET
// ========================================

async function loadFinanceModule() {
    const area = document.getElementById('contentArea');

    try {
        const [dashboard, factures, devis, paiements, depenses, budgets, categories] = await Promise.all([
            apiGet('/api/finance/dashboard/').catch(() => null),
            apiGet('/api/finance/factures/').catch(() => []),
            apiGet('/api/finance/devis/').catch(() => []),
            apiGet('/api/finance/paiements/').catch(() => []),
            apiGet('/api/finance/depenses/').catch(() => []),
            apiGet('/api/finance/budgets/').catch(() => []),
            apiGet('/api/finance/categories-depenses/').catch(() => [])
        ]);

        const factList = Array.isArray(factures) ? factures : (factures.results || []);
        const devisList = Array.isArray(devis) ? devis : (devis.results || []);
        const payList = Array.isArray(paiements) ? paiements : (paiements.results || []);
        const depList = Array.isArray(depenses) ? depenses : (depenses.results || []);
        const budList = Array.isArray(budgets) ? budgets : (budgets.results || []);
        const catList = Array.isArray(categories) ? categories : (categories.results || []);

        area.innerHTML = `
            <!-- Stats -->
            <div class="stats-row">
                <div class="stat-card">
                    <div class="stat-card-icon green">💰</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${formatMoney(dashboard?.chiffre_affaires || 0)}</div>
                        <div class="stat-card-label">Chiffre d'affaires</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon teal">📥</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${formatMoney(dashboard?.montant_encaisse || 0)}</div>
                        <div class="stat-card-label">Encaissé</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon orange">📊</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${formatMoney(dashboard?.creances_clients || 0)}</div>
                        <div class="stat-card-label">Créances</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon red">💸</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${formatMoney(dashboard?.depenses_total || 0)}</div>
                        <div class="stat-card-label">Dépenses</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon ${(dashboard?.resultat_net || 0) >= 0 ? 'green' : 'red'}">📈</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${formatMoney(dashboard?.resultat_net || 0)}</div>
                        <div class="stat-card-label">Résultat net</div>
                    </div>
                </div>
            </div>

            <!-- Alertes -->
            ${(dashboard?.factures?.en_retard || 0) > 0 ? `<div class="alert alert-danger"><span>🔴</span><span><strong>${dashboard.factures.en_retard}</strong> facture(s) en retard</span></div>` : ''}
            ${(dashboard?.devis?.non_traites || 0) > 0 ? `<div class="alert alert-warning"><span>📋</span><span><strong>${dashboard.devis.non_traites}</strong> devis non traité(s)</span></div>` : ''}
            ${(dashboard?.depenses_en_attente || 0) > 0 ? `<div class="alert alert-info"><span>💸</span><span><strong>${dashboard.depenses_en_attente}</strong> dépense(s) en attente d'approbation</span></div>` : ''}

            <!-- Onglets -->
            <div class="card">
                <div class="card-header" style="overflow-x:auto;">
                    <div class="tab-nav" style="flex-wrap:nowrap; min-width:max-content;">
                        <button class="tab-btn active" onclick="switchTab('fin', 'factures', this)">📄 Factures (${factList.length})</button>
                        <button class="tab-btn" onclick="switchTab('fin', 'devis', this)">📋 Devis (${devisList.length})</button>
                        <button class="tab-btn" onclick="switchTab('fin', 'paiements', this)">💳 Paiements (${payList.length})</button>
                        <button class="tab-btn" onclick="switchTab('fin', 'depenses', this)">💸 Dépenses (${depList.length})</button>
                        <button class="tab-btn" onclick="switchTab('fin', 'budgets', this)">📊 Budgets (${budList.length})</button>
                        <button class="tab-btn" onclick="switchTab('fin', 'categories', this)">🏷️ Catégories (${catList.length})</button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="tab-content active" id="fin_factures" style="display:block;">
                        ${renderFinFactures(factList)}
                    </div>
                    <div class="tab-content" id="fin_devis" style="display:none;">
                        ${renderFinDevis(devisList)}
                    </div>
                    <div class="tab-content" id="fin_paiements" style="display:none;">
                        ${renderFinPaiements(payList)}
                    </div>
                    <div class="tab-content" id="fin_depenses" style="display:none;">
                        ${renderFinDepenses(depList)}
                    </div>
                    <div class="tab-content" id="fin_budgets" style="display:none;">
                        ${renderFinBudgets(budList)}
                    </div>
                    <div class="tab-content" id="fin_categories" style="display:none;">
                        ${renderFinCategories(catList)}
                    </div>
                </div>
            </div>
        `;

    } catch (error) {
        showError(`Finance : ${error.message}`);
    }
}


// ========================================
// TAB : FACTURES
// ========================================
function renderFinFactures(factList) {
    const searchValue = getSearchValue('finance');
    let filtered = factList;
    if (searchValue) {
        filtered = filterLocally(filtered, searchValue, ['numero', 'client_nom', 'client_entreprise']);
    }
    const filterStatut = getFilterValue('finance', 'statut_fact');
    if (filterStatut) {
        filtered = filtered.filter(f => f.statut === filterStatut);
    }

    const typeIcons = {
        'ACHAT': '🛒',
        'LOCATION': '📋',
        'SERVICE': '🔧',
        'AUTRE': '📄'
    };

    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">📄 Factures</h4>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                <button class="btn btn-primary btn-sm" onclick="synchroniserFactures()">🔄 Synchroniser</button>
                <button class="btn btn-outline btn-sm" onclick="ouvrirFormulaireFinFacture()">+ Nouvelle facture</button>
                <button class="btn-export" onclick="exporterOngletActifExcel('Factures')">📊 Excel</button>
            </div>
        </div>
        ${renderSearchBar({
            placeholder: 'Rechercher une facture...',
            moduleRedirect: 'finance',
            filters: [{
                key: 'statut_fact', label: 'Statut',
                options: [
                    {value:'BROUILLON', label:'Brouillon'}, {value:'ENVOYEE', label:'Envoyée'},
                    {value:'PAYEE', label:'Payée'}, {value:'PARTIELLEMENT_PAYEE', label:'Part. payée'},
                    {value:'EN_RETARD', label:'En retard'}, {value:'ANNULEE', label:'Annulée'}
                ]
            }]
        })}

        ${filtered.length === 0 ? `
            <div class="empty-state">
                <div class="empty-state-icon">📄</div>
                <h3>Aucune facture</h3>
                <p>Cliquez sur "Synchroniser" pour générer automatiquement les factures depuis les commandes et locations.</p>
                <button class="btn btn-primary" onclick="synchroniserFactures()" style="margin-top:1rem;">🔄 Synchroniser</button>
            </div>
        ` : `
            <p class="scroll-hint">👆 Faites défiler horizontalement →</p>
            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead>
                            <tr>
                                <th>N° Facture</th>
                                <th>Type</th>
                                <th>Client</th>
                                <th>Montant TTC</th>
                                <th>Payé</th>
                                <th>Solde</th>
                                <th>Statut</th>
                                <th>Émission</th>
                                <th>Échéance</th>
                                <th>Auto</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filtered.map(f => `
                                <tr>
                                    <td><strong>${escapeHtml(f.numero)}</strong></td>
                                    <td><span class="badge badge-info">${typeIcons[f.type_operation] || '📄'} ${escapeHtml(f.type_operation || 'N/A')}</span></td>
                                    <td>${escapeHtml(f.client_nom)}<br><small style="color:var(--text-light);">${escapeHtml(f.client_entreprise || '')}</small></td>
                                    <td><strong>${formatMoney(f.montant_ttc, f.devise)}</strong></td>
                                    <td style="color:var(--success);">${formatMoney(f.montant_paye, f.devise)}</td>
                                    <td style="color:${(f.solde_restant || 0) > 0 ? 'var(--danger)' : 'var(--success)'};">${formatMoney(f.solde_restant, f.devise)}</td>
                                    <td><span class="badge ${getBadgeClass(f.statut)}">${escapeHtml(f.statut_display || f.statut)}</span></td>
                                    <td><small>${formatDate(f.date_emission)}</small></td>
                                    <td><small>${formatDate(f.date_echeance)}</small></td>
                                    <td>${f.est_auto_generee ? '<span class="badge badge-purple">🤖</span>' : ''}</td>
                                    <td>
                                        <div class="item-actions">
                                            <button class="btn btn-sm btn-outline" onclick="voirDetailFinFacture(${f.id})" title="Détail">👁️</button>
                                            <button class="btn btn-sm btn-outline" onclick="telechargerFacturePDF(${f.id})" title="PDF">📄</button>
                                            <button class="btn btn-sm btn-outline" onclick="editerFinFacture(${f.id})" title="Modifier">✏️</button>
                                            ${!['PAYEE','ANNULEE'].includes(f.statut) ? `<button class="btn btn-sm btn-success" onclick="changerStatutFinFacture(${f.id})" title="Statut">📋</button>` : ''}
                                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/finance/factures/${f.id}/', 'finance')" title="Supprimer">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="responsive-mobile-view">
                ${filtered.map(f => `
                    <div class="responsive-card">
                        <div class="responsive-card-header">
                            <div>
                                <strong>${escapeHtml(f.numero)}</strong> ${f.est_auto_generee ? '🤖' : ''}
                                <br><small>${escapeHtml(f.client_nom)} ${f.client_entreprise ? '— ' + escapeHtml(f.client_entreprise) : ''}</small>
                            </div>
                            <span class="badge ${getBadgeClass(f.statut)}">${escapeHtml(f.statut_display || f.statut)}</span>
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row"><span class="responsive-card-label">📋 Type</span><span class="badge badge-info">${typeIcons[f.type_operation] || '📄'} ${escapeHtml(f.type_operation || 'N/A')}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">💰 TTC</span><span style="font-weight:700; color:var(--primary);">${formatMoney(f.montant_ttc, f.devise)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">✅ Payé</span><span style="color:var(--success);">${formatMoney(f.montant_paye, f.devise)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">⏳ Solde</span><span style="color:${(f.solde_restant || 0) > 0 ? 'var(--danger)' : 'var(--success)'};">${formatMoney(f.solde_restant, f.devise)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📅 Émission</span><span>${formatDate(f.date_emission)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">⏰ Échéance</span><span>${formatDate(f.date_echeance)}</span></div>
                        </div>
                        <div class="responsive-card-footer">
                            <button class="btn btn-sm btn-outline" onclick="voirDetailFinFacture(${f.id})">👁️</button>
                            <button class="btn btn-sm btn-outline" onclick="telechargerFacturePDF(${f.id})">📄 PDF</button>
                            <button class="btn btn-sm btn-outline" onclick="editerFinFacture(${f.id})">✏️</button>
                            ${!['PAYEE','ANNULEE'].includes(f.statut) ? `<button class="btn btn-sm btn-success" onclick="changerStatutFinFacture(${f.id})">📋</button>` : ''}
                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/finance/factures/${f.id}/', 'finance')">🗑️</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}


async function synchroniserFactures() {
    if (!confirm('Synchroniser les factures ?\n\nCela va générer automatiquement les factures pour :\n• Commandes clients confirmées/livrées\n• Contrats de location actifs/terminés\n\nLes factures existantes ne seront pas dupliquées.')) return;
    try {
        const result = await apiPost('/api/finance/synchroniser-factures/');
        alert(`✅ Synchronisation terminée !\n\n${result.resultats.factures_achats} facture(s) d'achat créée(s)\n${result.resultats.factures_locations} facture(s) de location créée(s)\n${result.resultats.erreurs} erreur(s)`);
        navigateTo('finance');
    } catch (error) {
        alert(`Erreur synchronisation : ${error.message}`);
    }
}




// ========================================
// TAB : DEVIS
// ========================================
function renderFinDevis(devisList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">📋 Demandes de Devis (${devisList.length})</h4>
            <button class="btn-export" onclick="exporterOngletActifExcel('Devis')">📊 Excel</button>
        </div>

        ${devisList.length === 0 ? `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <h3>Aucun devis</h3>
                <p>Les demandes de devis soumises via le site apparaîtront ici.</p>
            </div>
        ` : `
            <p class="scroll-hint">👆 Faites défiler horizontalement pour voir toutes les colonnes →</p>

            <!-- Vue Desktop : Tableau complet -->
            <div class="devis-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead>
                            <tr>
                                <th>Entreprise</th>
                                <th>Contact</th>
                                <th>Email / Tél</th>
                                <th>Produits</th>
                                <th>Qté (T)</th>
                                <th>Destination</th>
                                <th>Traité</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${devisList.map(d => `
                                <tr>
                                    <td><strong>${escapeHtml(d.nom_entreprise)}</strong></td>
                                    <td>${escapeHtml(d.nom_contact)}</td>
                                    <td>
                                        ${d.email ? `<a href="mailto:${d.email}" style="color:var(--primary); font-size:0.8rem;">${escapeHtml(d.email)}</a><br>` : ''}
                                        ${d.telephone ? `<small>📞 ${escapeHtml(d.telephone)}</small>` : ''}
                                    </td>
                                    <td><small>${escapeHtml((d.produits || '').substring(0, 30))}...</small></td>
                                    <td><strong>${d.quantite_tonnes}T</strong></td>
                                    <td><small>${escapeHtml(d.destination)}</small></td>
                                    <td>${d.traite ? '<span class="badge badge-success">✅</span>' : '<span class="badge badge-warning">⏳</span>'}</td>
                                    <td><small>${formatDate(d.date_demande)}</small></td>
                                    <td>
                                        <div class="item-actions">
                                            <button class="btn btn-sm btn-outline" onclick="voirDetailFinDevis(${d.id})" title="Détail">👁️</button>
                                            ${!d.traite ? `<button class="btn btn-sm btn-success" onclick="marquerFinDevisTraite(${d.id})" title="Traiter">✅</button>` : ''}
                                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/finance/devis/${d.id}/', 'finance')" title="Supprimer">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Vue Mobile : Cartes -->
            <div class="devis-mobile-view">
                ${devisList.map(d => `
                    <div class="devis-card">
                        <div class="devis-card-header">
                            <div>
                                <strong style="font-size:1rem;">${escapeHtml(d.nom_entreprise)}</strong>
                                <br><small style="color:var(--text-light);">${escapeHtml(d.nom_contact)}</small>
                            </div>
                            <div>
                                ${d.traite ? '<span class="badge badge-success">✅ Traité</span>' : '<span class="badge badge-warning">⏳ Non traité</span>'}
                            </div>
                        </div>
                        <div class="devis-card-body">
                            <div class="devis-card-row">
                                <span class="devis-card-label">📧 Email</span>
                                <span>${d.email ? `<a href="mailto:${d.email}" style="color:var(--primary);">${escapeHtml(d.email)}</a>` : 'N/A'}</span>
                            </div>
                            <div class="devis-card-row">
                                <span class="devis-card-label">📞 Téléphone</span>
                                <span>${escapeHtml(d.telephone || 'N/A')}</span>
                            </div>
                            <div class="devis-card-row">
                                <span class="devis-card-label">📦 Produits</span>
                                <span><small>${escapeHtml((d.produits || '').substring(0, 50))}</small></span>
                            </div>
                            <div class="devis-card-row">
                                <span class="devis-card-label">⚖️ Quantité</span>
                                <span><strong>${d.quantite_tonnes} tonnes</strong></span>
                            </div>
                            <div class="devis-card-row">
                                <span class="devis-card-label">🔄 Fréquence</span>
                                <span>${escapeHtml(d.frequence || 'N/A')}</span>
                            </div>
                            <div class="devis-card-row">
                                <span class="devis-card-label">📍 Destination</span>
                                <span>${escapeHtml(d.destination)}</span>
                            </div>
                            <div class="devis-card-row">
                                <span class="devis-card-label">📅 Date</span>
                                <span>${formatDate(d.date_demande)}</span>
                            </div>
                        </div>
                        <div class="devis-card-footer">
                            <button class="btn btn-sm btn-outline" onclick="voirDetailFinDevis(${d.id})">👁️ Détail</button>
                            ${!d.traite ? `<button class="btn btn-sm btn-success" onclick="marquerFinDevisTraite(${d.id})">✅ Traiter</button>` : ''}
                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/finance/devis/${d.id}/', 'finance')">🗑️</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}


// ========================================
// TAB : PAIEMENTS
// ========================================
function renderFinPaiements(payList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">💳 Paiements</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireFinPaiement()">+ Enregistrer un paiement</button>
            <button class="btn-export" onclick="exporterOngletActifExcel('Paiements')">📊 Excel</button>
        </div>

        ${payList.length === 0 ? `
            <div class="empty-state">
                <div class="empty-state-icon">💳</div>
                <h3>Aucun paiement</h3>
            </div>
        ` : `
            <p class="scroll-hint">👆 Faites défiler horizontalement →</p>

            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead>
                            <tr>
                                <th>Référence</th>
                                <th>Facture</th>
                                <th>Montant</th>
                                <th>Mode</th>
                                <th>Statut</th>
                                <th>Réf. externe</th>
                                <th>Date</th>
                                <th>Confirmé par</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${payList.map(p => `
                                <tr>
                                    <td><strong>${escapeHtml(p.reference)}</strong></td>
                                    <td>${escapeHtml(p.facture_numero || 'N/A')}</td>
                                    <td><strong>${formatMoney(p.montant)}</strong></td>
                                    <td><span class="badge badge-info">${escapeHtml(p.mode_display || p.mode_paiement)}</span></td>
                                    <td><span class="badge ${getBadgeClass(p.statut)}">${escapeHtml(p.statut_display || p.statut)}</span></td>
                                    <td><small>${escapeHtml(p.reference_externe || 'N/A')}</small></td>
                                    <td><small>${formatDate(p.date_paiement)}</small></td>
                                    <td>${escapeHtml(p.confirme_par_nom || 'N/A')}</td>
                                    <td>
                                        <div class="item-actions">
                                            ${p.statut === 'EN_ATTENTE' ? `<button class="btn btn-sm btn-success" onclick="confirmerFinPaiement(${p.id})">✅</button>` : ''}
                                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/finance/paiements/${p.id}/', 'finance')">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="responsive-mobile-view">
                ${payList.map(p => `
                    <div class="responsive-card">
                        <div class="responsive-card-header">
                            <div>
                                <strong>${escapeHtml(p.reference)}</strong>
                                <br><small>Facture : ${escapeHtml(p.facture_numero || 'N/A')}</small>
                            </div>
                            <span class="badge ${getBadgeClass(p.statut)}">${escapeHtml(p.statut_display || p.statut)}</span>
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row"><span class="responsive-card-label">💰 Montant</span><span style="font-weight:700; color:var(--primary);">${formatMoney(p.montant)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">💳 Mode</span><span class="badge badge-info">${escapeHtml(p.mode_display || p.mode_paiement)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">🔗 Réf. externe</span><span>${escapeHtml(p.reference_externe || 'N/A')}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📅 Date</span><span>${formatDate(p.date_paiement)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">👤 Confirmé par</span><span>${escapeHtml(p.confirme_par_nom || 'N/A')}</span></div>
                        </div>
                        <div class="responsive-card-footer">
                            ${p.statut === 'EN_ATTENTE' ? `<button class="btn btn-sm btn-success" onclick="confirmerFinPaiement(${p.id})">✅ Confirmer</button>` : ''}
                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/finance/paiements/${p.id}/', 'finance')">🗑️</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}


// ========================================
// TAB : DÉPENSES OPÉRATIONNELLES
// ========================================
function renderFinDepenses(depList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">💸 Dépenses Opérationnelles</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireFinDepense()">+ Nouvelle dépense</button>
            <button class="btn-export" onclick="exporterOngletActifExcel('Depenses')">📊 Excel</button>
        </div>

        ${depList.length === 0 ? `
            <div class="empty-state">
                <div class="empty-state-icon">💸</div>
                <h3>Aucune dépense</h3>
            </div>
        ` : `
            <p class="scroll-hint">👆 Faites défiler horizontalement →</p>

            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead>
                            <tr>
                                <th>Référence</th>
                                <th>Catégorie</th>
                                <th>Description</th>
                                <th>Montant</th>
                                <th>Statut</th>
                                <th>Soumis par</th>
                                <th>Approuvé par</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${depList.map(d => `
                                <tr>
                                    <td><strong>${escapeHtml(d.reference)}</strong></td>
                                    <td>${escapeHtml(d.categorie_nom || 'N/A')}</td>
                                    <td><small>${escapeHtml((d.description || '').substring(0, 50))}</small></td>
                                    <td><strong>${formatMoney(d.montant, d.devise)}</strong></td>
                                    <td><span class="badge ${getBadgeClass(d.statut)}">${escapeHtml(d.statut_display || d.statut)}</span></td>
                                    <td><small>${escapeHtml(d.soumis_par_nom || 'N/A')}</small></td>
                                    <td><small>${escapeHtml(d.approuve_par_nom || 'N/A')}</small></td>
                                    <td><small>${formatDate(d.date_depense)}</small></td>
                                    <td>
                                        <div class="item-actions">
                                            ${d.statut === 'EN_ATTENTE' ? `
                                                <button class="btn btn-sm btn-success" onclick="approuverFinDepense(${d.id})">✅</button>
                                                <button class="btn btn-sm btn-danger" onclick="rejeterFinDepense(${d.id})">❌</button>
                                            ` : ''}
                                            <button class="btn btn-sm btn-outline" onclick="editerFinDepense(${d.id})">✏️</button>
                                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/finance/depenses/${d.id}/', 'finance')">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="responsive-mobile-view">
                ${depList.map(d => `
                    <div class="responsive-card">
                        <div class="responsive-card-header">
                            <div>
                                <strong>${escapeHtml(d.reference)}</strong>
                                <br><small>${escapeHtml(d.categorie_nom || 'Sans catégorie')}</small>
                            </div>
                            <span class="badge ${getBadgeClass(d.statut)}">${escapeHtml(d.statut_display || d.statut)}</span>
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row"><span class="responsive-card-label">📝 Description</span><span><small>${escapeHtml((d.description || '').substring(0, 80))}</small></span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">💰 Montant</span><span style="font-weight:700; color:var(--danger);">${formatMoney(d.montant, d.devise)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">👤 Soumis par</span><span>${escapeHtml(d.soumis_par_nom || 'N/A')}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">✅ Approuvé par</span><span>${escapeHtml(d.approuve_par_nom || 'N/A')}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📅 Date</span><span>${formatDate(d.date_depense)}</span></div>
                        </div>
                        <div class="responsive-card-footer">
                            ${d.statut === 'EN_ATTENTE' ? `
                                <button class="btn btn-sm btn-success" onclick="approuverFinDepense(${d.id})">✅ Approuver</button>
                                <button class="btn btn-sm btn-danger" onclick="rejeterFinDepense(${d.id})">❌ Rejeter</button>
                            ` : ''}
                            <button class="btn btn-sm btn-outline" onclick="editerFinDepense(${d.id})">✏️</button>
                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/finance/depenses/${d.id}/', 'finance')">🗑️</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}


// ========================================
// TAB : BUDGETS MENSUELS
// ========================================
function renderFinBudgets(budList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">📊 Budgets Mensuels</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireFinBudget()">+ Nouveau budget</button>
            <button class="btn-export" onclick="exporterOngletActifExcel('Budgets')">📊 Excel</button>
        </div>

        ${budList.length === 0 ? `
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <h3>Aucun budget</h3>
            </div>
        ` : `
            <p class="scroll-hint">👆 Faites défiler horizontalement →</p>

            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead>
                            <tr>
                                <th>Mois</th>
                                <th>Année</th>
                                <th>Revenus prévus</th>
                                <th>Revenus réels</th>
                                <th>Dépenses prévues</th>
                                <th>Dépenses réelles</th>
                                <th>Solde net</th>
                                <th>Clôturé</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${budList.map(b => `
                                <tr>
                                    <td><strong>${escapeHtml(b.mois_display || b.mois)}</strong></td>
                                    <td>${b.annee}</td>
                                    <td>${formatMoney(b.budget_prevu_revenus)}</td>
                                    <td style="color:${(b.revenus_reels || 0) >= (b.budget_prevu_revenus || 0) ? 'var(--success)' : 'var(--danger)'};">${formatMoney(b.revenus_reels)}</td>
                                    <td>${formatMoney(b.budget_prevu_depenses)}</td>
                                    <td style="color:${(b.depenses_reelles || 0) <= (b.budget_prevu_depenses || 0) ? 'var(--success)' : 'var(--danger)'};">${formatMoney(b.depenses_reelles)}</td>
                                    <td style="font-weight:700; color:${(b.solde_net || 0) >= 0 ? 'var(--success)' : 'var(--danger)'};">${formatMoney(b.solde_net)}</td>
                                    <td>${b.est_cloture ? '<span class="badge badge-success">✅</span>' : '<span class="badge badge-warning">⏳</span>'}</td>
                                    <td>
                                        <div class="item-actions">
                                            <button class="btn btn-sm btn-outline" onclick="editerFinBudget(${b.id})">✏️</button>
                                            ${!b.est_cloture ? `<button class="btn btn-sm btn-success" onclick="cloturerFinBudget(${b.id})">🔒</button>` : ''}
                                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/finance/budgets/${b.id}/', 'finance')">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="responsive-mobile-view">
                ${budList.map(b => `
                    <div class="responsive-card">
                        <div class="responsive-card-header">
                            <div>
                                <strong>${escapeHtml(b.mois_display || b.mois)} ${b.annee}</strong>
                            </div>
                            <div>
                                ${b.est_cloture ? '<span class="badge badge-success">✅ Clôturé</span>' : '<span class="badge badge-warning">⏳ Ouvert</span>'}
                            </div>
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row"><span class="responsive-card-label">📈 Rev. prévus</span><span>${formatMoney(b.budget_prevu_revenus)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📈 Rev. réels</span><span style="color:${(b.revenus_reels || 0) >= (b.budget_prevu_revenus || 0) ? 'var(--success)' : 'var(--danger)'};">${formatMoney(b.revenus_reels)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📉 Dép. prévues</span><span>${formatMoney(b.budget_prevu_depenses)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📉 Dép. réelles</span><span style="color:${(b.depenses_reelles || 0) <= (b.budget_prevu_depenses || 0) ? 'var(--success)' : 'var(--danger)'};">${formatMoney(b.depenses_reelles)}</span></div>
                            <div class="responsive-card-row" style="border-top:2px solid var(--border); padding-top:0.5rem; margin-top:0.3rem;">
                                <span class="responsive-card-label" style="font-weight:700;">💰 Solde net</span>
                                <span style="font-weight:800; font-size:1.1rem; color:${(b.solde_net || 0) >= 0 ? 'var(--success)' : 'var(--danger)'};">${formatMoney(b.solde_net)}</span>
                            </div>
                        </div>
                        <div class="responsive-card-footer">
                            <button class="btn btn-sm btn-outline" onclick="editerFinBudget(${b.id})">✏️ Modifier</button>
                            ${!b.est_cloture ? `<button class="btn btn-sm btn-success" onclick="cloturerFinBudget(${b.id})">🔒 Clôturer</button>` : ''}
                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/finance/budgets/${b.id}/', 'finance')">🗑️</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}


// ========================================
// TAB : CATÉGORIES DE DÉPENSES
// ========================================
function renderFinCategories(catList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">🏷️ Catégories de Dépenses</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireFinCategorie()">+ Nouvelle catégorie</button>
        </div>
        <div class="table-container">
            <table class="dash-table">
                <thead>
                    <tr>
                        <th>Nom</th>
                        <th>Description</th>
                        <th>Nb dépenses</th>
                        <th>Active</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${catList.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding:2rem;">Aucune catégorie</td></tr>' :
                    catList.map(c => `
                        <tr>
                            <td><strong>${escapeHtml(c.nom)}</strong></td>
                            <td><small>${escapeHtml(c.description || 'N/A')}</small></td>
                            <td>${c.nombre_depenses || 0}</td>
                            <td>${c.est_active ? '<span class="badge badge-success">Oui</span>' : '<span class="badge badge-danger">Non</span>'}</td>
                            <td>
                                <div class="item-actions">
                                    <button class="btn btn-sm btn-outline" onclick="editerFinCategorie(${c.id})" title="Modifier">✏️</button>
                                    <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/finance/categories-depenses/${c.id}/', 'finance')" title="Supprimer">🗑️</button>
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
// DÉTAIL FACTURE
// ========================================
async function voirDetailFinFacture(id) {
    try {
        const f = await apiGet(`/api/finance/factures/${id}/`);
        const modal = document.createElement('div');
        modal.id = 'modalCreation';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';

        modal.innerHTML = `
            <div style="background:white; border-radius:16px; width:100%; max-width:800px; max-height:90vh; overflow-y:auto;">
                <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                    <h3 style="color:var(--primary);">📄 Facture ${escapeHtml(f.numero)}</h3>
                    <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
                </div>
                <div style="padding:1.5rem;">
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">👤 Client</div>
                        <div class="detail-row"><span class="detail-label">Nom</span><span class="detail-value">${escapeHtml(f.client_nom)}</span></div>
                        <div class="detail-row"><span class="detail-label">Entreprise</span><span class="detail-value">${escapeHtml(f.client_entreprise || 'N/A')}</span></div>
                        <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${f.client_email ? `<a href="mailto:${f.client_email}">${escapeHtml(f.client_email)}</a>` : 'N/A'}</span></div>
                    </div>
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">💰 Montants</div>
                        <div class="detail-row"><span class="detail-label">Montant HT</span><span class="detail-value">${formatMoney(f.montant_ht, f.devise)}</span></div>
                        <div class="detail-row"><span class="detail-label">TVA (${f.tva_pourcentage}%)</span><span class="detail-value">${formatMoney(f.montant_tva, f.devise)}</span></div>
                        <div class="detail-row"><span class="detail-label">Montant TTC</span><span class="detail-value" style="font-weight:800; color:var(--primary); font-size:1.2rem;">${formatMoney(f.montant_ttc, f.devise)}</span></div>
                        <div class="detail-row"><span class="detail-label">Payé</span><span class="detail-value" style="color:var(--success);">${formatMoney(f.montant_paye, f.devise)}</span></div>
                        <div class="detail-row"><span class="detail-label">Solde restant</span><span class="detail-value" style="color:${(f.solde_restant || 0) > 0 ? 'var(--danger)' : 'var(--success)'}; font-weight:700;">${formatMoney(f.solde_restant, f.devise)}</span></div>
                        <div class="detail-row"><span class="detail-label">Statut</span><span class="detail-value"><span class="badge ${getBadgeClass(f.statut)}">${escapeHtml(f.statut_display || f.statut)}</span></span></div>
                    </div>
                    <!-- Lignes -->
                    <div class="inline-section">
                        <div class="inline-header">
                            <h4>📋 Lignes de facture</h4>
                            <button class="btn btn-sm btn-primary" onclick="ajouterLigneFinFacture(${f.id})">+ Ajouter</button>
                        </div>
                        ${f.lignes && f.lignes.length > 0 ? `
                            <table class="dash-table">
                                <thead><tr><th>Description</th><th>Qté</th><th>Unité</th><th>Prix unit.</th><th>Sous-total</th></tr></thead>
                                <tbody>
                                    ${f.lignes.map(l => `
                                        <tr>
                                            <td>${escapeHtml(l.description)}</td>
                                            <td>${l.quantite}</td>
                                            <td>${escapeHtml(l.unite || '')}</td>
                                            <td>${formatMoney(l.prix_unitaire)}</td>
                                            <td><strong>${formatMoney(l.sous_total)}</strong></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        ` : '<p style="text-align:center; color:var(--text-light); padding:1rem;">Aucune ligne</p>'}
                    </div>
                    <!-- Paiements -->
                    <div class="inline-section">
                        <div class="inline-header"><h4>💳 Paiements associés</h4></div>
                        ${f.paiements && f.paiements.length > 0 ? `
                            <table class="dash-table">
                                <thead><tr><th>Réf</th><th>Montant</th><th>Mode</th><th>Statut</th><th>Date</th></tr></thead>
                                <tbody>
                                    ${f.paiements.map(p => `
                                        <tr>
                                            <td>${escapeHtml(p.reference)}</td>
                                            <td>${formatMoney(p.montant)}</td>
                                            <td>${escapeHtml(p.mode_display || p.mode_paiement)}</td>
                                            <td><span class="badge ${getBadgeClass(p.statut)}">${escapeHtml(p.statut_display || p.statut)}</span></td>
                                            <td>${formatDate(p.date_paiement)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        ` : '<p style="text-align:center; color:var(--text-light); padding:1rem;">Aucun paiement</p>'}
                    </div>
                    <!-- Actions -->
                    <div class="form-actions">
                        ${!['PAYEE','ANNULEE'].includes(f.statut) ? `
                            <button class="btn btn-success" onclick="this.closest('#modalCreation').remove(); changerStatutFinFacture(${f.id})">📋 Statut</button>
                            <button class="btn btn-primary" onclick="this.closest('#modalCreation').remove(); ouvrirFormulaireFinPaiement(${f.id})">💳 Paiement</button>
                        ` : ''}
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
// DÉTAIL DEVIS
// ========================================
async function voirDetailFinDevis(id) {
    try {
        const d = await apiGet(`/api/finance/devis/${id}/`);
        const modal = document.createElement('div');
        modal.id = 'modalCreation';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
        modal.innerHTML = `
            <div style="background:white; border-radius:16px; width:100%; max-width:650px; max-height:90vh; overflow-y:auto;">
                <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                    <h3 style="color:var(--primary);">📋 Devis de ${escapeHtml(d.nom_entreprise)}</h3>
                    <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
                </div>
                <div style="padding:1.5rem;">
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">👤 Demandeur</div>
                        <div class="detail-row"><span class="detail-label">Entreprise</span><span class="detail-value"><strong>${escapeHtml(d.nom_entreprise)}</strong></span></div>
                        <div class="detail-row"><span class="detail-label">Contact</span><span class="detail-value">${escapeHtml(d.nom_contact)}</span></div>
                        <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value"><a href="mailto:${d.email}">${escapeHtml(d.email)}</a></span></div>
                        <div class="detail-row"><span class="detail-label">Téléphone</span><span class="detail-value">${escapeHtml(d.telephone)}</span></div>
                    </div>
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">📦 Demande</div>
                        <div class="detail-row"><span class="detail-label">Produits</span><span class="detail-value">${escapeHtml(d.produits)}</span></div>
                        <div class="detail-row"><span class="detail-label">Quantité</span><span class="detail-value"><strong>${d.quantite_tonnes} tonnes</strong></span></div>
                        <div class="detail-row"><span class="detail-label">Fréquence</span><span class="detail-value">${escapeHtml(d.frequence)}</span></div>
                        <div class="detail-row"><span class="detail-label">Destination</span><span class="detail-value">${escapeHtml(d.destination)}</span></div>
                        ${d.exigences ? `<div class="detail-row"><span class="detail-label">Exigences</span><span class="detail-value">${escapeHtml(d.exigences)}</span></div>` : ''}
                    </div>
                    <div class="detail-row"><span class="detail-label">Statut</span><span class="detail-value">${d.traite ? '<span class="badge badge-success">✅ Traité</span>' : '<span class="badge badge-warning">⏳ Non traité</span>'}</span></div>
                    <div class="detail-row"><span class="detail-label">Date demande</span><span class="detail-value">${formatDateTime(d.date_demande)}</span></div>
                    ${!d.traite ? `
                        <div class="form-actions">
                            <button class="btn btn-success" onclick="marquerFinDevisTraite(${d.id}); this.closest('#modalCreation').remove();">✅ Marquer traité</button>
                            <button class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Fermer</button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    } catch (error) { alert(`Erreur : ${error.message}`); }
}


// ========================================
// FORMULAIRE FACTURE
// ========================================
async function ouvrirFormulaireFinFacture(editData = null) {
    const existant = document.getElementById('modalCreation');
    if (existant) existant.remove();

    const titre = editData ? `Modifier facture ${editData.numero}` : 'Nouvelle facture';
    const endpoint = editData ? `/api/finance/factures/${editData.id}/` : '/api/finance/factures/';

    const modal = document.createElement('div');
    modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:700px; max-height:90vh; overflow-y:auto;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">${editData ? '✏️' : '➕'} ${titre}</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="finFactForm" style="padding:1.5rem;">
                <div class="form-section">
                    <div class="form-section-title">👤 Client</div>
                    <div class="form-grid">
                        <div class="form-field"><label>Nom <span class="required">*</span></label><input type="text" id="factClientNom" value="${escapeHtml(editData?.client_nom || '')}" required></div>
                        <div class="form-field"><label>Entreprise</label><input type="text" id="factClientEntreprise" value="${escapeHtml(editData?.client_entreprise || '')}"></div>
                        <div class="form-field"><label>Email</label><input type="email" id="factClientEmail" value="${escapeHtml(editData?.client_email || '')}"></div>
                        <div class="form-field"><label>Téléphone</label><input type="text" id="factClientTel" value="${escapeHtml(editData?.client_telephone || '')}"></div>
                        <div class="form-field full-width"><label>Adresse</label><textarea id="factClientAdresse" rows="2">${escapeHtml(editData?.client_adresse || '')}</textarea></div>
                    </div>
                </div>
                <div class="form-section">
                    <div class="form-section-title">📋 Type d'opération</div>
                    <div class="form-grid">
                        <div class="form-field">
                            <label>Type <span class="required">*</span></label>
                            <select id="factType" required>
                                <option value="ACHAT" ${editData?.type_operation === 'ACHAT' ? 'selected' : ''}>🛒 Vente de produits (Achat client)</option>
                                <option value="LOCATION" ${editData?.type_operation === 'LOCATION' ? 'selected' : ''}>📋 Location de matériel</option>
                                <option value="SERVICE" ${editData?.type_operation === 'SERVICE' ? 'selected' : ''}>🔧 Prestation de service</option>
                                <option value="AUTRE" ${editData?.type_operation === 'AUTRE' ? 'selected' : ''}>📄 Autre</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="form-section">
                    <div class="form-section-title">💰 Montants</div>
                    <div class="form-grid">
                        <div class="form-field"><label>Montant HT <span class="required">*</span></label><input type="number" id="factMontantHT" step="0.01" value="${editData?.montant_ht || 0}" required></div>
                        <div class="form-field"><label>Taux TVA (%)</label><input type="number" id="factTVA" step="0.01" value="${editData?.taux_pourcentage || 19.25}"></div>
                        <div class="form-field"><label>Devise</label>
                            <select id="factDevise">
                                ${['FCFA','EUR','USD','CNY', 'NGN'].map(d => `<option value="${d}" ${editData?.devise === d ? 'selected' : ''}>${d}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                </div>
                <div class="form-section">
                    <div class="form-section-title">📅 Dates</div>
                    <div class="form-grid">
                        <div class="form-field"><label>Date émission <span class="required">*</span></label><input type="date" id="factDateEmission" value="${editData?.date_emission || new Date().toISOString().split('T')[0]}" required></div>
                        <div class="form-field"><label>Date échéance <span class="required">*</span></label><input type="date" id="factDateEcheance" value="${editData?.date_echeance || ''}" required></div>
                    </div>
                </div>
                <div class="form-grid">
                    <div class="form-field full-width"><label>Conditions de paiement</label><textarea id="factConditions" rows="2">${escapeHtml(editData?.conditions_paiement || 'Paiement à réception de facture.')}</textarea></div>
                    <div class="form-field full-width"><label>Notes</label><textarea id="factNotes" rows="2">${escapeHtml(editData?.notes || '')}</textarea></div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 ${editData ? 'Enregistrer' : 'Créer'}</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="finFactError" style="color:var(--danger); text-align:center; margin-top:0.5rem;"></p>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

        document.getElementById('finFactForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = document.getElementById('finFactError');
        errorEl.textContent = '';

        try {
            const payload = {
                client_nom: document.getElementById('factClientNom').value,
                client_entreprise: document.getElementById('factClientEntreprise')?.value || '',
                client_email: document.getElementById('factClientEmail')?.value || null,
                client_telephone: document.getElementById('factClientTel')?.value || '',
                client_adresse: document.getElementById('factClientAdresse')?.value || '',
                montant_ht: parseFloat(document.getElementById('factMontantHT').value) || 0,
                tva_pourcentage: parseFloat(document.getElementById('factTVA').value) || 19.25,
                devise: document.getElementById('factDevise').value || 'FCFA',
                date_emission: document.getElementById('factDateEmission').value,
                date_echeance: document.getElementById('factDateEcheance').value,
                conditions_paiement: document.getElementById('factConditions')?.value || '',
                notes: document.getElementById('factNotes')?.value || '',
                type_operation: document.getElementById('factType').value,
            };

            // Supprimer les champs vides/null pour éviter les erreurs
            if (!payload.client_email) delete payload.client_email;

            console.log('Payload facture:', payload);

            if (editData) {
                await apiPatch(endpoint, payload);
            } else {
                await apiPost(endpoint, payload);
            }
            modal.remove();
            navigateTo('finance');
        } catch (error) {
            console.error('Erreur création facture:', error);
            errorEl.textContent = `Erreur : ${error.message}`;
        }
    });
}

async function editerFinFacture(id) {
    try { const f = await apiGet(`/api/finance/factures/${id}/`); ouvrirFormulaireFinFacture(f); }
    catch (error) { alert(`Erreur : ${error.message}`); }
}


// ========================================
// FORMULAIRE PAIEMENT
// ========================================
async function ouvrirFormulaireFinPaiement(factureId = null) {
    const existant = document.getElementById('modalCreation');
    if (existant) existant.remove();

    let factures = [];
    try {
        const resp = await apiGet('/api/finance/factures/');
        factures = Array.isArray(resp) ? resp : (resp.results || []);
        factures = factures.filter(f => !['PAYEE', 'ANNULEE'].includes(f.statut));
    } catch (e) {}

    const modal = document.createElement('div');
    modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:550px; max-height:90vh; overflow-y:auto;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">➕ Enregistrer un paiement</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="finPayForm" style="padding:1.5rem;">
                <div class="form-grid">
                    <div class="form-field full-width">
                        <label>Facture <span class="required">*</span></label>
                        <select id="payFacture" required>
                            <option value="">Sélectionner...</option>
                            ${factures.map(f => `<option value="${f.id}" ${factureId === f.id ? 'selected' : ''}>${escapeHtml(f.numero)} - ${escapeHtml(f.client_nom)} (${formatMoney(f.solde_restant, f.devise)})</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-field"><label>Montant <span class="required">*</span></label><input type="number" id="payMontant" step="0.01" required></div>
                    <div class="form-field"><label>Mode de paiement</label>
                        <select id="payMode">
                            <option value="VIREMENT">Virement</option><option value="ESPECES">Espèces</option>
                            <option value="MOBILE_MONEY">Mobile Money</option><option value="CHEQUE">Chèque</option>
                            <option value="CARTE">Carte</option><option value="PAYPAL">PayPal</option>
                        </select>
                    </div>
                    <div class="form-field"><label>Date paiement <span class="required">*</span></label><input type="date" id="payDate" value="${new Date().toISOString().split('T')[0]}" required></div>
                    <div class="form-field full-width"><label>Référence externe</label><input type="text" id="payRefExt" placeholder="N° transaction, référence bancaire..."></div>
                    <div class="form-field full-width"><label>Notes</label><textarea id="payNotes" rows="2"></textarea></div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 Enregistrer</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="finPayError" style="color:var(--danger); text-align:center; margin-top:0.5rem;"></p>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('finPayForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await apiPost('/api/finance/paiements/', {
                facture: parseInt(document.getElementById('payFacture').value),
                montant: parseFloat(document.getElementById('payMontant').value),
                mode_paiement: document.getElementById('payMode').value,
                date_paiement: document.getElementById('payDate').value,
                reference_externe: document.getElementById('payRefExt')?.value || '',
                notes: document.getElementById('payNotes')?.value || ''
            });
            modal.remove();
            navigateTo('finance');
        } catch (error) { document.getElementById('finPayError').textContent = error.message; }
    });
}


// ========================================
// FORMULAIRE DÉPENSE
// ========================================
async function ouvrirFormulaireFinDepense(editData = null) {
    const existant = document.getElementById('modalCreation');
    if (existant) existant.remove();

    let categories = [];
    try {
        const resp = await apiGet('/api/finance/categories-depenses/');
        categories = Array.isArray(resp) ? resp : (resp.results || []);
    } catch (e) {}

    const titre = editData ? 'Modifier dépense' : 'Nouvelle dépense';
    const endpoint = editData ? `/api/finance/depenses/${editData.id}/` : '/api/finance/depenses/';

    const modal = document.createElement('div');
    modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:600px; max-height:90vh; overflow-y:auto;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">${editData ? '✏️' : '➕'} ${titre}</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="finDepForm" style="padding:1.5rem;">
                <div class="form-grid">
                    <div class="form-field"><label>Catégorie</label>
                        <select id="depCategorie">
                            <option value="">Sans catégorie</option>
                            ${categories.map(c => `<option value="${c.id}" ${editData?.categorie === c.id ? 'selected' : ''}>${escapeHtml(c.nom)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-field"><label>Montant <span class="required">*</span></label><input type="number" id="depMontant" step="0.01" value="${editData?.montant || ''}" required></div>
                    <div class="form-field"><label>Devise</label>
                        <select id="depDevise">
                            ${['FCFA','EUR','USD', 'CNY', 'NGN'].map(d => `<option value="${d}" ${editData?.devise === d ? 'selected' : ''}>${d}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-field"><label>Date dépense <span class="required">*</span></label><input type="date" id="depDate" value="${editData?.date_depense || new Date().toISOString().split('T')[0]}" required></div>
                    <div class="form-field full-width"><label>Description <span class="required">*</span></label><textarea id="depDescription" rows="3" required>${escapeHtml(editData?.description || '')}</textarea></div>
                    <div class="form-field full-width"><label>Notes</label><textarea id="depNotes" rows="2">${escapeHtml(editData?.notes || '')}</textarea></div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 ${editData ? 'Enregistrer' : 'Soumettre'}</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="finDepError" style="color:var(--danger); text-align:center; margin-top:0.5rem;"></p>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('finDepForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const payload = {
                categorie: document.getElementById('depCategorie').value ? parseInt(document.getElementById('depCategorie').value) : null,
                montant: parseFloat(document.getElementById('depMontant').value),
                devise: document.getElementById('depDevise').value,
                date_depense: document.getElementById('depDate').value,
                description: document.getElementById('depDescription').value,
                notes: document.getElementById('depNotes')?.value || ''
            };
            if (editData) { await apiPatch(endpoint, payload); } else { await apiPost(endpoint, payload); }
            modal.remove();
            navigateTo('finance');
        } catch (error) { document.getElementById('finDepError').textContent = error.message; }
    });
}

async function editerFinDepense(id) {
    try { const d = await apiGet(`/api/finance/depenses/${id}/`); ouvrirFormulaireFinDepense(d); }
    catch (error) { alert(`Erreur : ${error.message}`); }
}


// ========================================
// FORMULAIRE BUDGET MENSUEL
// ========================================
async function ouvrirFormulaireFinBudget(editData = null) {
    const existant = document.getElementById('modalCreation');
    if (existant) existant.remove();

    const titre = editData ? `Modifier budget ${editData.mois_display} ${editData.annee}` : 'Nouveau budget mensuel';
    const endpoint = editData ? `/api/finance/budgets/${editData.id}/` : '/api/finance/budgets/';

    const moisOptions = [
        {v:1,l:'Janvier'},{v:2,l:'Février'},{v:3,l:'Mars'},{v:4,l:'Avril'},
        {v:5,l:'Mai'},{v:6,l:'Juin'},{v:7,l:'Juillet'},{v:8,l:'Août'},
        {v:9,l:'Septembre'},{v:10,l:'Octobre'},{v:11,l:'Novembre'},{v:12,l:'Décembre'}
    ];

    const modal = document.createElement('div');
    modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:600px; max-height:90vh; overflow-y:auto;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">${editData ? '✏️' : '➕'} ${titre}</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="finBudForm" style="padding:1.5rem;">
                <div class="form-section">
                    <div class="form-section-title">📅 Période</div>
                    <div class="form-grid">
                        <div class="form-field"><label>Mois <span class="required">*</span></label>
                            <select id="budMois" required>
                                ${moisOptions.map(m => `<option value="${m.v}" ${editData?.mois === m.v ? 'selected' : ''}>${m.l}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-field"><label>Année <span class="required">*</span></label><input type="number" id="budAnnee" value="${editData?.annee || new Date().getFullYear()}" required></div>
                    </div>
                </div>
                <div class="form-section">
                    <div class="form-section-title">📈 Revenus</div>
                    <div class="form-grid">
                        <div class="form-field"><label>Revenus prévus</label><input type="number" id="budRevenusPrevus" step="0.01" value="${editData?.budget_prevu_revenus || 0}"></div>
                        <div class="form-field"><label>Revenus réels</label><input type="number" id="budRevenusReels" step="0.01" value="${editData?.revenus_reels || 0}"></div>
                    </div>
                </div>
                <div class="form-section">
                    <div class="form-section-title">📉 Dépenses</div>
                    <div class="form-grid">
                        <div class="form-field"><label>Dépenses prévues</label><input type="number" id="budDepensesPrevues" step="0.01" value="${editData?.budget_prevu_depenses || 0}"></div>
                        <div class="form-field"><label>Dépenses réelles</label><input type="number" id="budDepensesReelles" step="0.01" value="${editData?.depenses_reelles || 0}"></div>
                    </div>
                </div>
                <div class="form-grid">
                    <div class="form-field full-width"><label>Commentaire</label><textarea id="budCommentaire" rows="2">${escapeHtml(editData?.commentaire || '')}</textarea></div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 ${editData ? 'Enregistrer' : 'Créer'}</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="finBudError" style="color:var(--danger); text-align:center; margin-top:0.5rem;"></p>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('finBudForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const payload = {
                mois: parseInt(document.getElementById('budMois').value),
                annee: parseInt(document.getElementById('budAnnee').value),
                budget_prevu_revenus: parseFloat(document.getElementById('budRevenusPrevus').value) || 0,
                revenus_reels: parseFloat(document.getElementById('budRevenusReels').value) || 0,
                budget_prevu_depenses: parseFloat(document.getElementById('budDepensesPrevues').value) || 0,
                depenses_reelles: parseFloat(document.getElementById('budDepensesReelles').value) || 0,
                commentaire: document.getElementById('budCommentaire')?.value || ''
            };
            if (editData) { await apiPatch(endpoint, payload); } else { await apiPost(endpoint, payload); }
            modal.remove();
            navigateTo('finance');
        } catch (error) { document.getElementById('finBudError').textContent = error.message; }
    });
}

async function editerFinBudget(id) {
    try { const b = await apiGet(`/api/finance/budgets/${id}/`); ouvrirFormulaireFinBudget(b); }
    catch (error) { alert(`Erreur : ${error.message}`); }
}


// ========================================
// FORMULAIRE CATÉGORIE DE DÉPENSE
// ========================================
async function ouvrirFormulaireFinCategorie(editData = null) {
    const existant = document.getElementById('modalCreation');
    if (existant) existant.remove();

    const titre = editData ? `Modifier : ${editData.nom}` : 'Nouvelle catégorie';
    const endpoint = editData ? `/api/finance/categories-depenses/${editData.id}/` : '/api/finance/categories-depenses/';

    const modal = document.createElement('div');
    modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:450px;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">${editData ? '✏️' : '➕'} ${titre}</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="finCatForm" style="padding:1.5rem;">
                <div class="form-grid">
                    <div class="form-field full-width"><label>Nom <span class="required">*</span></label><input type="text" id="catNom" value="${escapeHtml(editData?.nom || '')}" required></div>
                    <div class="form-field full-width"><label>Description</label><textarea id="catDescription" rows="2">${escapeHtml(editData?.description || '')}</textarea></div>
                </div>
                <div class="form-checkbox">
                    <input type="checkbox" id="catActive" ${editData?.est_active !== false ? 'checked' : ''}>
                    <label for="catActive">Catégorie active</label>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 ${editData ? 'Enregistrer' : 'Créer'}</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="finCatError" style="color:var(--danger); text-align:center; margin-top:0.5rem;"></p>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('finCatForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const payload = {
                nom: document.getElementById('catNom').value,
                description: document.getElementById('catDescription')?.value || '',
                est_active: document.getElementById('catActive').checked
            };
            if (editData) { await apiPatch(endpoint, payload); } else { await apiPost(endpoint, payload); }
            modal.remove();
            navigateTo('finance');
        } catch (error) { document.getElementById('finCatError').textContent = error.message; }
    });
}

async function editerFinCategorie(id) {
    try { const c = await apiGet(`/api/finance/categories-depenses/${id}/`); ouvrirFormulaireFinCategorie(c); }
    catch (error) { alert(`Erreur : ${error.message}`); }
}


// ========================================
// AJOUTER LIGNE FACTURE
// ========================================
async function ajouterLigneFinFacture(factureId) {
    const existant = document.getElementById('modalCreation');
    if (existant) existant.remove();

    const modal = document.createElement('div');
    modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:500px;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">➕ Ajouter une ligne</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="ligneFactForm" style="padding:1.5rem;">
                <div class="form-grid">
                    <div class="form-field full-width"><label>Description <span class="required">*</span></label><input type="text" id="ligneDesc" required placeholder="Ex: Location tracteur 5 jours"></div>
                    <div class="form-field"><label>Quantité <span class="required">*</span></label><input type="number" id="ligneQte" step="0.01" value="1" required></div>
                    <div class="form-field"><label>Unité</label><input type="text" id="ligneUnite" value="unité"></div>
                    <div class="form-field"><label>Prix unitaire <span class="required">*</span></label><input type="number" id="lignePrix" step="0.01" required></div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 Ajouter</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="ligneFactError" style="color:var(--danger); text-align:center; margin-top:0.5rem;"></p>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('ligneFactForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await apiPost(`/api/finance/factures/${factureId}/ajouter_ligne/`, {
                description: document.getElementById('ligneDesc').value,
                quantite: parseFloat(document.getElementById('ligneQte').value),
                unite: document.getElementById('ligneUnite')?.value || 'unité',
                prix_unitaire: parseFloat(document.getElementById('lignePrix').value)
            });
            modal.remove();
            voirDetailFinFacture(factureId);
        } catch (error) { document.getElementById('ligneFactError').textContent = error.message; }
    });
}


// ========================================
// ACTIONS RAPIDES
// ========================================
async function changerStatutFinFacture(id) {
    const statuts = [
        { value: 'BROUILLON', label: '📝 Brouillon' },
        { value: 'ENVOYEE', label: '📤 Envoyée' },
        { value: 'PAYEE', label: '✅ Payée' },
        { value: 'PARTIELLEMENT_PAYEE', label: '💳 Part. payée' },
        { value: 'EN_RETARD', label: '🔴 En retard' },
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
                <h3 style="color:var(--primary);">📋 Statut facture</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <div style="padding:1.5rem; display:flex; flex-direction:column; gap:0.5rem;">
                ${statuts.map(s => `<button class="btn btn-outline" onclick="confirmerStatutFinFacture(${id}, '${s.value}')">${s.label}</button>`).join('')}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

async function confirmerStatutFinFacture(id, statut) {
    try {
        await apiPost(`/api/finance/factures/${id}/changer_statut/`, { statut });
        document.getElementById('modalCreation')?.remove();
        navigateTo('finance');
    } catch (error) { alert(`Erreur : ${error.message}`); }
}

async function marquerFinDevisTraite(id) {
    if (!confirm('Marquer ce devis comme traité ?')) return;
    try {
        await apiPost(`/api/finance/devis/${id}/marquer_traite/`);
        navigateTo('finance');
    } catch (error) { alert(`Erreur : ${error.message}`); }
}

async function confirmerFinPaiement(id) {
    if (!confirm('Confirmer ce paiement ?')) return;
    try {
        await apiPost(`/api/finance/paiements/${id}/confirmer/`);
        navigateTo('finance');
    } catch (error) { alert(`Erreur : ${error.message}`); }
}

async function approuverFinDepense(id) {
    if (!confirm('Approuver cette dépense ?')) return;
    try {
        await apiPost(`/api/finance/depenses/${id}/approuver/`);
        navigateTo('finance');
    } catch (error) { alert(`Erreur : ${error.message}`); }
}

async function rejeterFinDepense(id) {
    const motif = prompt('Motif du rejet :');
    if (motif === null) return;
    try {
        await apiPost(`/api/finance/depenses/${id}/rejeter/`, { motif });
        navigateTo('finance');
    } catch (error) { alert(`Erreur : ${error.message}`); }
}

async function cloturerFinBudget(id) {
    if (!confirm('Clôturer ce budget ? Cette action est irréversible.')) return;
    try {
        await apiPost(`/api/finance/budgets/${id}/cloturer/`);
        navigateTo('finance');
    } catch (error) { alert(`Erreur : ${error.message}`); }
}


function telechargerFacturePDF(id) {
    const token = getToken();
    const url = `${API_BASE}/api/finance/factures/${id}/pdf/`;
    
    fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
        if (!response.ok) throw new Error('Erreur génération PDF');
        return response.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Facture_${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    })
    .catch(error => alert(`Erreur : ${error.message}`));
}

function apercuFacturePDF(id) {
    const token = getToken();
    const url = `${API_BASE}/api/finance/factures/${id}/pdf/apercu/`;
    
    fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
        if (!response.ok) throw new Error('Erreur génération PDF');
        return response.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
    })
    .catch(error => alert(`Erreur : ${error.message}`));
}