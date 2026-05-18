// ========================================
// MODULE LOCATION — VERSION PROFESSIONNELLE
// ========================================

async function loadLocationModule() {
    const area = document.getElementById('contentArea');

    try {
        const dashData = await apiGet('/api/location/admin/').catch(() => null);
        const resData = await apiGet('/api/location/reservations/').catch(() => []);
        const ctrData = await apiGet('/api/location/contrats/').catch(() => []);
        const cauData = await apiGet('/api/location/cautions/').catch(() => []);
        const edlData = await apiGet('/api/location/etats-des-lieux/').catch(() => []);
        const srvData = await apiGet('/api/location/services/').catch(() => []);
        const factData = await apiGet('/api/location/facturations/').catch(() => []);
        const payData = await apiGet('/api/location/paiements/').catch(() => []);

        const resList = Array.isArray(resData) ? resData : (resData.results || []);
        const ctrList = Array.isArray(ctrData) ? ctrData : (ctrData.results || []);
        const cauList = Array.isArray(cauData) ? cauData : (cauData.results || []);
        const edlList = Array.isArray(edlData) ? edlData : (edlData.results || []);
        const srvList = Array.isArray(srvData) ? srvData : (srvData.results || []);
        const factList = Array.isArray(factData) ? factData : (factData.results || []);
        const payList = Array.isArray(payData) ? payData : (payData.results || []);

        const contratsRetard = ctrList.filter(c => c.statut === 'ACTIF' && c.jours_retard > 0);
        const cautionsAttente = cauList.filter(c => c.statut === 'EN_ATTENTE');
        const facturesImpayees = factList.filter(f => ['ENVOYEE', 'PARTIELLEMENT_PAYEE', 'EN_RETARD'].includes(f.statut));

        area.innerHTML = `
            <!-- Stats -->
            <div class="stats-row">
                <div class="stat-card">
                    <div class="stat-card-icon orange">📋</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${resList.filter(r => r.statut === 'EN_ATTENTE').length}</div>
                        <div class="stat-card-label">Réservations en attente</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon blue">📝</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${ctrList.filter(c => c.statut === 'ACTIF').length}</div>
                        <div class="stat-card-label">Contrats actifs</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon red">⏰</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${contratsRetard.length}</div>
                        <div class="stat-card-label">En retard</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon green">💰</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${formatMoney(dashData?.financier?.ca_location_mois || 0)}</div>
                        <div class="stat-card-label">CA ce mois</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon purple">💳</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${cautionsAttente.length}</div>
                        <div class="stat-card-label">Cautions en attente</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon teal">📄</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${facturesImpayees.length}</div>
                        <div class="stat-card-label">Factures impayées</div>
                    </div>
                </div>
            </div>

            <!-- Alertes -->
            ${contratsRetard.length > 0 ? `<div class="alert alert-danger"><span>⏰</span><span><strong>${contratsRetard.length}</strong> contrat(s) en retard de restitution !</span></div>` : ''}
            ${cautionsAttente.length > 0 ? `<div class="alert alert-warning"><span>💳</span><span><strong>${cautionsAttente.length}</strong> caution(s) en attente de versement</span></div>` : ''}
            ${facturesImpayees.length > 0 ? `<div class="alert alert-info"><span>📄</span><span><strong>${facturesImpayees.length}</strong> facture(s) impayée(s) — ${formatMoney(facturesImpayees.reduce((sum, f) => sum + parseFloat(f.solde_restant || 0), 0))}</span></div>` : ''}

            <!-- Onglets -->
            <div class="card">
                <div class="card-header" style="overflow-x:auto;">
                    <div class="tab-nav" style="flex-wrap:wrap; min-width:unset;">
                        <button class="tab-btn active" onclick="switchTab('loc', 'reservations', this)">📋 Réservations (${resList.length})</button>
                        <button class="tab-btn" onclick="switchTab('loc', 'contrats', this)">📝 Contrats (${ctrList.length})</button>
                        <button class="tab-btn" onclick="switchTab('loc', 'cautions', this)">💳 Cautions (${cauList.length})</button>
                        <button class="tab-btn" onclick="switchTab('loc', 'edl', this)">📸 EDL (${edlList.length})</button>
                        <button class="tab-btn" onclick="switchTab('loc', 'services', this)">🔧 Services (${srvList.length})</button>
                        <button class="tab-btn" onclick="switchTab('loc', 'facturations', this)">📄 Factures (${factList.length})</button>
                        <button class="tab-btn" onclick="switchTab('loc', 'paiements', this)">💰 Paiements (${payList.length})</button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="tab-content active" id="loc_reservations" style="display:block;">${renderLocReservations(resList)}</div>
                    <div class="tab-content" id="loc_contrats" style="display:none;">${renderLocContrats(ctrList)}</div>
                    <div class="tab-content" id="loc_cautions" style="display:none;">${renderLocCautions(cauList)}</div>
                    <div class="tab-content" id="loc_edl" style="display:none;">${renderLocEDL(edlList)}</div>
                    <div class="tab-content" id="loc_services" style="display:none;">${renderLocServices(srvList, ctrList)}</div>
                    <div class="tab-content" id="loc_facturations" style="display:none;">${renderLocFacturations(factList, ctrList)}</div>
                    <div class="tab-content" id="loc_paiements" style="display:none;">${renderLocPaiements(payList)}</div>
                </div>
            </div>
        `;

    } catch (error) {
        showError(`Location : ${error.message}`);
    }
}


// ========================================
// RÉSERVATIONS — AVEC DÉTAIL
// ========================================
function renderLocReservations(resList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">📋 Réservations</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireLocReservation()">+ Nouvelle réservation</button>
            <button class="btn-export" onclick="exporterOngletActifExcel('Reservations')">📊 Excel</button>
        </div>
        ${resList.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📋</div><h3>Aucune réservation</h3></div>' : `
            <p class="scroll-hint">👆 Faites défiler horizontalement →</p>
            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead><tr><th>Réf</th><th>Équipement</th><th>Client</th><th>Période</th><th>Montant</th><th>Caution</th><th>Statut</th><th>Actions</th></tr></thead>
                        <tbody>
                            ${resList.map(r => `
                                <tr>
                                    <td><strong>${escapeHtml(r.reference)}</strong></td>
                                    <td>${escapeHtml(r.equipement_nom || 'N/A')}</td>
                                    <td>${escapeHtml(r.client_nom)}<br><small>${escapeHtml(r.client_entreprise || '')}</small></td>
                                    <td><small>${formatDate(r.date_debut_prevue)} → ${formatDate(r.date_fin_prevue)}</small><br><small>${r.nombre_jours}j</small></td>
                                    <td><strong>${formatMoney(r.montant_estime, r.devise)}</strong></td>
                                    <td>${formatMoney(r.caution_requise, r.devise)}</td>
                                    <td><span class="badge ${getBadgeClass(r.statut)}">${escapeHtml(r.statut_display || r.statut)}</span></td>
                                    <td>
                                        <div class="item-actions">
                                            <button class="btn btn-sm btn-outline" onclick="voirDetailLocReservation(${r.id})" title="Détail">👁️</button>
                                            ${r.statut === 'EN_ATTENTE' ? `
                                                <button class="btn btn-sm btn-success" onclick="actionLocReservation(${r.id}, 'confirmer')">✅</button>
                                                <button class="btn btn-sm btn-danger" onclick="actionLocReservation(${r.id}, 'annuler')">❌</button>
                                            ` : ''}
                                            ${r.statut === 'CONFIRMEE' ? `<button class="btn btn-sm btn-primary" onclick="actionLocReservation(${r.id}, 'creer_contrat')">📝</button>` : ''}
                                            <button class="btn btn-sm btn-outline" onclick="editerLocReservation(${r.id})">✏️</button>
                                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/location/reservations/${r.id}/', 'location')">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="responsive-mobile-view">
                ${resList.map(r => `
                    <div class="responsive-card">
                        <div class="responsive-card-header">
                            <div><strong>${escapeHtml(r.reference)}</strong><br><small>${escapeHtml(r.equipement_nom || '')} — ${escapeHtml(r.client_nom)}</small></div>
                            <span class="badge ${getBadgeClass(r.statut)}">${escapeHtml(r.statut_display || r.statut)}</span>
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row"><span class="responsive-card-label">📅 Période</span><span>${formatDate(r.date_debut_prevue)} → ${formatDate(r.date_fin_prevue)} (${r.nombre_jours}j)</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">💰 Montant</span><span style="font-weight:700;">${formatMoney(r.montant_estime, r.devise)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">💳 Caution</span><span>${formatMoney(r.caution_requise, r.devise)}</span></div>
                        </div>
                        <div class="responsive-card-footer">
                            <button class="btn btn-sm btn-outline" onclick="voirDetailLocReservation(${r.id})">👁️</button>
                            ${r.statut === 'EN_ATTENTE' ? `<button class="btn btn-sm btn-success" onclick="actionLocReservation(${r.id}, 'confirmer')">✅</button>` : ''}
                            ${r.statut === 'CONFIRMEE' ? `<button class="btn btn-sm btn-primary" onclick="actionLocReservation(${r.id}, 'creer_contrat')">📝</button>` : ''}
                            <button class="btn btn-sm btn-outline" onclick="editerLocReservation(${r.id})">✏️</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}


// DÉTAIL RÉSERVATION
async function voirDetailLocReservation(id) {
    try {
        const r = await apiGet(`/api/location/reservations/${id}/`);
        const existant = document.getElementById('modalCreation');
        if (existant) existant.remove();

        const etapes = ['EN_ATTENTE', 'CONFIRMEE', 'EN_COURS', 'TERMINEE'];
        const currentIdx = etapes.indexOf(r.statut);

        const modal = document.createElement('div');
        modal.id = 'modalCreation';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
        modal.innerHTML = `
            <div style="background:white; border-radius:16px; width:100%; max-width:750px; max-height:90vh; overflow-y:auto;">
                <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                    <h3 style="color:var(--primary);">📋 Réservation ${escapeHtml(r.reference)}</h3>
                    <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.5rem; cursor:pointer;">✕</button>
                </div>
                <div style="padding:1.5rem;">
                    <!-- Timeline -->
                    <div class="status-timeline" style="margin-bottom:1.5rem;">
                        ${etapes.map((s, i) => `
                            ${i > 0 ? '<span class="status-arrow">→</span>' : ''}
                            <span class="status-step ${i < currentIdx ? 'completed' : i === currentIdx ? 'active' : ''}">${s.replace('_', ' ')}</span>
                        `).join('')}
                        ${r.statut === 'ANNULEE' ? '<span class="status-arrow">→</span><span class="status-step active" style="background:var(--danger);">❌ ANNULÉE</span>' : ''}
                    </div>

                    <div class="grid-2">
                        <div class="detail-fieldset">
                            <div class="detail-fieldset-title">🚜 Équipement</div>
                            <div class="detail-row"><span class="detail-label">Équipement</span><span class="detail-value"><strong>${escapeHtml(r.equipement_nom || 'N/A')}</strong></span></div>
                            <div class="detail-row"><span class="detail-label">Mode tarif</span><span class="detail-value">${escapeHtml(r.mode_tarification_display || r.mode_tarification)}</span></div>
                            <div class="detail-row"><span class="detail-label">Tarif appliqué</span><span class="detail-value">${formatMoney(r.tarif_applique, r.devise)}</span></div>
                            <div class="detail-row"><span class="detail-label">Lieu utilisation</span><span class="detail-value">${escapeHtml(r.lieu_utilisation || 'N/A')}</span></div>
                        </div>

                        <div class="detail-fieldset">
                            <div class="detail-fieldset-title">👤 Client</div>
                            <div class="detail-row"><span class="detail-label">Nom</span><span class="detail-value"><strong>${escapeHtml(r.client_nom)}</strong></span></div>
                            <div class="detail-row"><span class="detail-label">Entreprise</span><span class="detail-value">${escapeHtml(r.client_entreprise || 'N/A')}</span></div>
                            <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${r.client_email ? `<a href="mailto:${r.client_email}">${escapeHtml(r.client_email)}</a>` : 'N/A'}</span></div>
                            <div class="detail-row"><span class="detail-label">Téléphone</span><span class="detail-value">${r.client_telephone ? `<a href="tel:${r.client_telephone}">${escapeHtml(r.client_telephone)}</a>` : 'N/A'}</span></div>
                        </div>
                    </div>

                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">📅 Période & Montants</div>
                        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:0.3rem;">
                            <div class="detail-row"><span class="detail-label">Début</span><span class="detail-value">${formatDate(r.date_debut_prevue)}</span></div>
                            <div class="detail-row"><span class="detail-label">Fin</span><span class="detail-value">${formatDate(r.date_fin_prevue)}</span></div>
                            <div class="detail-row"><span class="detail-label">Durée</span><span class="detail-value"><strong>${r.nombre_jours} jours</strong></span></div>
                        </div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.3rem; margin-top:0.5rem;">
                            <div class="detail-row"><span class="detail-label">Montant estimé</span><span class="detail-value" style="font-weight:700; color:var(--primary); font-size:1.1rem;">${formatMoney(r.montant_estime, r.devise)}</span></div>
                            <div class="detail-row"><span class="detail-label">Caution requise</span><span class="detail-value" style="font-weight:700;">${formatMoney(r.caution_requise, r.devise)}</span></div>
                        </div>
                    </div>

                    ${r.a_contrat ? '<div class="alert alert-success" style="margin:1rem 0;"><span>📝</span><span>Un contrat a été créé pour cette réservation</span></div>' : ''}
                    ${r.notes ? `<div class="detail-fieldset"><div class="detail-fieldset-title">📝 Notes</div><p>${escapeHtml(r.notes)}</p></div>` : ''}
                    ${r.motif_annulation ? `<div class="alert alert-danger"><span>❌</span><span>Motif annulation : ${escapeHtml(r.motif_annulation)}</span></div>` : ''}

                    <div class="form-actions">
                        ${r.statut === 'EN_ATTENTE' ? `
                            <button class="btn btn-success" onclick="this.closest('#modalCreation').remove(); actionLocReservation(${r.id}, 'confirmer')">✅ Confirmer</button>
                            <button class="btn btn-danger" onclick="this.closest('#modalCreation').remove(); actionLocReservation(${r.id}, 'annuler')">❌ Annuler</button>
                        ` : ''}
                        ${r.statut === 'CONFIRMEE' && !r.a_contrat ? `
                            <button class="btn btn-primary" onclick="this.closest('#modalCreation').remove(); actionLocReservation(${r.id}, 'creer_contrat')">📝 Créer le contrat</button>
                        ` : ''}
                        <button class="btn btn-outline" onclick="this.closest('#modalCreation').remove(); editerLocReservation(${r.id})">✏️ Modifier</button>
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
// CONTRATS — AMÉLIORÉ
// ========================================
function renderLocContrats(ctrList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">📝 Contrats de Location</h4>
            <button class="btn-export" onclick="exporterOngletActifExcel('Contrats_Location')">📊 Excel</button>
        </div>
        ${ctrList.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📝</div><h3>Aucun contrat</h3><p>Les contrats sont créés depuis les réservations confirmées.</p></div>' : `
            <p class="scroll-hint">👆 Faites défiler horizontalement →</p>
            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead><tr><th>Réf</th><th>Équipement</th><th>Client</th><th>Période</th><th>TTC</th><th>Statut</th><th>Retard</th><th>Option</th><th>Actions</th></tr></thead>
                        <tbody>
                            ${ctrList.map(c => `
                                <tr ${c.jours_retard > 0 ? 'style="background:#fff0f0;"' : ''}>
                                    <td><strong>${escapeHtml(c.reference)}</strong></td>
                                    <td>${escapeHtml(c.equipement_nom || 'N/A')}</td>
                                    <td>${escapeHtml(c.client_nom)}<br><small>${escapeHtml(c.client_entreprise || '')}</small></td>
                                    <td><small>${formatDate(c.date_debut)} → ${formatDate(c.date_fin_prevue)}</small></td>
                                    <td><strong>${formatMoney(c.montant_total_ttc, c.devise)}</strong></td>
                                    <td><span class="badge ${getBadgeClass(c.statut)}">${escapeHtml(c.statut_display || c.statut)}</span></td>
                                    <td>${(c.jours_retard || 0) > 0 ? `<span class="badge badge-danger">${c.jours_retard}j</span>` : '—'}</td>
                                    <td>${c.option_achat_proposee ? (c.option_achat_exercee ? '<span class="badge badge-success">Exercée</span>' : '<span class="badge badge-info">Proposée</span>') : '—'}</td>
                                    <td>
                                        <div class="item-actions">
                                            <button class="btn btn-sm btn-outline" onclick="voirDetailLocContrat(${c.id})" title="Détail">👁️</button>
                                            <button class="btn btn-sm btn-outline" onclick="telechargerContratPDF(${c.id})" title="PDF">📄</button>
                                            ${c.statut === 'BROUILLON' || c.statut === 'EN_ATTENTE_SIGNATURE' ? `<button class="btn btn-sm btn-outline" onclick="actionLocContrat(${c.id}, 'signer')">✍️</button>` : ''}
                                            ${c.statut === 'SIGNE' ? `<button class="btn btn-sm btn-success" onclick="actionLocContrat(${c.id}, 'activer')">▶️</button>` : ''}
                                            ${c.statut === 'ACTIF' ? `
                                                <button class="btn btn-sm btn-primary" onclick="actionLocContrat(${c.id}, 'terminer')">🏁</button>
                                                <button class="btn btn-sm btn-outline" onclick="actionLocContrat(${c.id}, 'generer_facture')">📄</button>
                                                <button class="btn btn-sm btn-outline" onclick="actionLocContrat(${c.id}, 'ajouter_service')" title="Service">🔧</button>
                                            ` : ''}
                                            ${c.option_achat_proposee && !c.option_achat_exercee && c.statut === 'ACTIF' ? `<button class="btn btn-sm btn-outline" onclick="actionLocContrat(${c.id}, 'exercer_option_achat')">🏷️</button>` : ''}
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="responsive-mobile-view">
                ${ctrList.map(c => `
                    <div class="responsive-card" ${c.jours_retard > 0 ? 'style="border-left:4px solid var(--danger);"' : ''}>
                        <div class="responsive-card-header">
                            <div><strong>${escapeHtml(c.reference)}</strong><br><small>${escapeHtml(c.equipement_nom || '')} — ${escapeHtml(c.client_nom)}</small></div>
                            <span class="badge ${getBadgeClass(c.statut)}">${escapeHtml(c.statut_display || c.statut)}</span>
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row"><span class="responsive-card-label">📅 Période</span><span>${formatDate(c.date_debut)} → ${formatDate(c.date_fin_prevue)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">💰 TTC</span><span style="font-weight:700;">${formatMoney(c.montant_total_ttc, c.devise)}</span></div>
                            ${c.jours_retard > 0 ? `<div class="responsive-card-row"><span class="responsive-card-label">⏰ Retard</span><span class="badge badge-danger">${c.jours_retard} jours</span></div>` : ''}
                        </div>
                        <div class="responsive-card-footer">
                            <button class="btn btn-sm btn-outline" onclick="voirDetailLocContrat(${c.id})">👁️</button>
                            <button class="btn btn-sm btn-outline" onclick="telechargerContratPDF(${c.id})" title="PDF">📄</button>
                            ${c.statut === 'ACTIF' ? `
                                <button class="btn btn-sm btn-primary" onclick="actionLocContrat(${c.id}, 'terminer')">🏁</button>
                                <button class="btn btn-sm btn-outline" onclick="actionLocContrat(${c.id}, 'generer_facture')">📄</button>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}


// ========================================
// CAUTIONS — AVEC DÉTAIL
// ========================================
function renderLocCautions(cauList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">💳 Cautions</h4>
            <button class="btn-export" onclick="exporterOngletActifExcel('Cautions')">📊 Excel</button>
        </div>
        ${cauList.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">💳</div><h3>Aucune caution</h3><p>Les cautions sont créées automatiquement avec les contrats.</p></div>' : `
            <p class="scroll-hint">👆 Faites défiler horizontalement →</p>
            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead><tr><th>Réf</th><th>Contrat</th><th>Requis</th><th>Versé</th><th>Retenu</th><th>Restitué</th><th>Solde</th><th>Mode</th><th>Statut</th><th>Actions</th></tr></thead>
                        <tbody>
                            ${cauList.map(c => `
                                <tr>
                                    <td><strong>${escapeHtml(c.reference)}</strong></td>
                                    <td><small>${escapeHtml(c.contrat_reference || 'N/A')}</small></td>
                                    <td>${formatMoney(c.montant_requis, c.devise)}</td>
                                    <td style="color:var(--success);">${formatMoney(c.montant_verse, c.devise)}</td>
                                    <td style="color:var(--danger);">${formatMoney(c.montant_retenu, c.devise)}</td>
                                    <td>${formatMoney(c.montant_restitue, c.devise)}</td>
                                    <td style="font-weight:700;">${formatMoney(c.solde_a_restituer || 0, c.devise)}</td>
                                    <td><small>${escapeHtml(c.mode_paiement_display || c.mode_paiement || 'N/A')}</small></td>
                                    <td><span class="badge ${getBadgeClass(c.statut)}">${escapeHtml(c.statut_display || c.statut)}</span></td>
                                    <td>
                                        <div class="item-actions">
                                            <button class="btn btn-sm btn-outline" onclick="voirDetailLocCaution(${c.id})" title="Détail">👁️</button>
                                            ${c.statut === 'EN_ATTENTE' ? `<button class="btn btn-sm btn-success" onclick="actionLocCaution(${c.id}, 'enregistrer_versement')">💰</button>` : ''}
                                            ${c.statut === 'VERSEE' ? `<button class="btn btn-sm btn-primary" onclick="actionLocCaution(${c.id}, 'restituer')">↩️</button>` : ''}
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="responsive-mobile-view">
                ${cauList.map(c => `
                    <div class="responsive-card">
                        <div class="responsive-card-header">
                            <div><strong>${escapeHtml(c.reference)}</strong><br><small>Contrat: ${escapeHtml(c.contrat_reference || 'N/A')}</small></div>
                            <span class="badge ${getBadgeClass(c.statut)}">${escapeHtml(c.statut_display || c.statut)}</span>
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row"><span class="responsive-card-label">💰 Requis</span><span>${formatMoney(c.montant_requis, c.devise)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">✅ Versé</span><span style="color:var(--success);">${formatMoney(c.montant_verse, c.devise)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">⛔ Retenu</span><span style="color:var(--danger);">${formatMoney(c.montant_retenu, c.devise)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">↩️ Restitué</span><span>${formatMoney(c.montant_restitue, c.devise)}</span></div>
                        </div>
                        <div class="responsive-card-footer">
                            <button class="btn btn-sm btn-outline" onclick="voirDetailLocCaution(${c.id})">👁️</button>
                            ${c.statut === 'EN_ATTENTE' ? `<button class="btn btn-sm btn-success" onclick="actionLocCaution(${c.id}, 'enregistrer_versement')">💰 Verser</button>` : ''}
                            ${c.statut === 'VERSEE' ? `<button class="btn btn-sm btn-primary" onclick="actionLocCaution(${c.id}, 'restituer')">↩️ Restituer</button>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}

// DÉTAIL CAUTION
async function voirDetailLocCaution(id) {
    try {
        const c = await apiGet(`/api/location/cautions/${id}/`);
        const existant = document.getElementById('modalCreation'); if (existant) existant.remove();

        const modal = document.createElement('div'); modal.id = 'modalCreation';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
        modal.innerHTML = `
            <div style="background:white; border-radius:16px; width:100%; max-width:650px; max-height:90vh; overflow-y:auto;">
                <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                    <h3 style="color:var(--primary);">💳 Caution ${escapeHtml(c.reference)}</h3>
                    <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.5rem; cursor:pointer;">✕</button>
                </div>
                <div style="padding:1.5rem;">
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">📋 Informations</div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.3rem;">
                            <div class="detail-row"><span class="detail-label">Référence</span><span class="detail-value"><strong>${escapeHtml(c.reference)}</strong></span></div>
                            <div class="detail-row"><span class="detail-label">Contrat</span><span class="detail-value">${escapeHtml(c.contrat_reference || 'N/A')}</span></div>
                            <div class="detail-row"><span class="detail-label">Statut</span><span class="detail-value"><span class="badge ${getBadgeClass(c.statut)}">${escapeHtml(c.statut_display || c.statut)}</span></span></div>
                            <div class="detail-row"><span class="detail-label">Mode paiement</span><span class="detail-value">${escapeHtml(c.mode_paiement_display || c.mode_paiement || 'N/A')}</span></div>
                        </div>
                    </div>
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">💰 Montants</div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.3rem;">
                            <div class="detail-row"><span class="detail-label">Requis</span><span class="detail-value" style="font-weight:700;">${formatMoney(c.montant_requis, c.devise)}</span></div>
                            <div class="detail-row"><span class="detail-label">Versé</span><span class="detail-value" style="color:var(--success); font-weight:700;">${formatMoney(c.montant_verse, c.devise)}</span></div>
                            <div class="detail-row"><span class="detail-label">Retenu</span><span class="detail-value" style="color:var(--danger); font-weight:700;">${formatMoney(c.montant_retenu, c.devise)}</span></div>
                            <div class="detail-row"><span class="detail-label">Restitué</span><span class="detail-value">${formatMoney(c.montant_restitue, c.devise)}</span></div>
                            <div class="detail-row" style="border-top:2px solid var(--primary); padding-top:0.5rem;"><span class="detail-label" style="font-weight:800;">Solde à restituer</span><span class="detail-value" style="font-weight:800; color:var(--primary); font-size:1.2rem;">${formatMoney(c.solde_a_restituer || 0, c.devise)}</span></div>
                        </div>
                    </div>
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">📅 Dates</div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.3rem;">
                            <div class="detail-row"><span class="detail-label">Versement</span><span class="detail-value">${formatDate(c.date_versement) || 'Non versé'}</span></div>
                            <div class="detail-row"><span class="detail-label">Restitution</span><span class="detail-value">${formatDate(c.date_restitution) || 'Non restitué'}</span></div>
                            ${c.reference_paiement ? `<div class="detail-row"><span class="detail-label">Réf. paiement</span><span class="detail-value">${escapeHtml(c.reference_paiement)}</span></div>` : ''}
                        </div>
                    </div>
                    ${c.motif_retenue ? `<div class="detail-fieldset"><div class="detail-fieldset-title">⚠️ Motif retenue</div><p>${escapeHtml(c.motif_retenue)}</p></div>` : ''}
                    ${c.notes ? `<div class="detail-fieldset"><div class="detail-fieldset-title">📝 Notes</div><p>${escapeHtml(c.notes)}</p></div>` : ''}

                    <div class="form-actions">
                        ${c.statut === 'EN_ATTENTE' ? `<button class="btn btn-success" onclick="this.closest('#modalCreation').remove(); actionLocCaution(${c.id}, 'enregistrer_versement')">💰 Enregistrer versement</button>` : ''}
                        ${c.statut === 'VERSEE' ? `<button class="btn btn-primary" onclick="this.closest('#modalCreation').remove(); actionLocCaution(${c.id}, 'restituer')">↩️ Restituer</button>` : ''}
                        <button class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Fermer</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal); modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    } catch (error) { alert(`Erreur : ${error.message}`); }
}


// ========================================
// SERVICES — AVEC BOUTON AJOUTER
// ========================================
function renderLocServices(srvList, ctrList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">🔧 Services Annexes</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireLocService()">+ Nouveau service</button>
        </div>
        ${srvList.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">🔧</div><h3>Aucun service annexe</h3></div>' : `
            <p class="scroll-hint">👆 Faites défiler horizontalement →</p>
            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead><tr><th>Contrat</th><th>Type</th><th>Description</th><th>Qté</th><th>Prix unit.</th><th>Total</th><th>TVA</th><th>Facturé</th><th>Actions</th></tr></thead>
                        <tbody>
                            ${srvList.map(s => `
                                <tr>
                                    <td><small>${escapeHtml(s.contrat_reference || 'N/A')}</small></td>
                                    <td><span class="badge badge-info">${escapeHtml(s.type_display || s.type_service)}</span></td>
                                    <td><small>${escapeHtml((s.description || '').substring(0, 50))}</small></td>
                                    <td>${s.quantite} ${escapeHtml(s.unite || '')}</td>
                                    <td>${formatMoney(s.prix_unitaire)}</td>
                                    <td><strong>${formatMoney(s.montant_total)}</strong></td>
                                    <td><small>${s.taux_tva_service}%</small></td>
                                    <td>${s.est_facture ? '<span class="badge badge-success">✅</span>' : '<span class="badge badge-warning">⏳</span>'}</td>
                                    <td><button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/location/services/${s.id}/', 'location')">🗑️</button></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="responsive-mobile-view">
                ${srvList.map(s => `
                    <div class="responsive-card">
                        <div class="responsive-card-header">
                            <div><strong>${escapeHtml(s.type_display || s.type_service)}</strong><br><small>Contrat: ${escapeHtml(s.contrat_reference || 'N/A')}</small></div>
                            ${s.est_facture ? '<span class="badge badge-success">Facturé</span>' : '<span class="badge badge-warning">Non facturé</span>'}
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row"><span class="responsive-card-label">📝</span><span><small>${escapeHtml(s.description || 'N/A')}</small></span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📊 Qté</span><span>${s.quantite} ${escapeHtml(s.unite || '')}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">💰 Total</span><span style="font-weight:700;">${formatMoney(s.montant_total)}</span></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}


// ========================================
// FACTURATIONS — AVEC SYNCHRO ET ENVOI
// ========================================
function renderLocFacturations(factList, ctrList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">📄 Facturations Location</h4>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                <button class="btn btn-primary btn-sm" onclick="synchroniserFacturesLocation()">🔄 Synchroniser</button>
                <button class="btn-export" onclick="exporterOngletActifExcel('Factures_Location')">📊 Excel</button>
            </div>
        </div>
        ${factList.length === 0 ? `
            <div class="empty-state">
                <div class="empty-state-icon">📄</div>
                <h3>Aucune facturation</h3>
                <p>Cliquez "Synchroniser" pour générer les factures depuis les contrats terminés, ou utilisez le bouton "📄" sur un contrat actif.</p>
                <button class="btn btn-primary" onclick="synchroniserFacturesLocation()" style="margin-top:1rem;">🔄 Synchroniser</button>
            </div>
        ` : `
            <p class="scroll-hint">👆 Faites défiler horizontalement →</p>
            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead><tr><th>Réf</th><th>Contrat</th><th>Client</th><th>TTC</th><th>Payé</th><th>Solde</th><th>Statut</th><th>Émission</th><th>Échéance</th><th>Actions</th></tr></thead>
                        <tbody>
                            ${factList.map(f => `
                                <tr ${f.statut === 'EN_RETARD' ? 'style="background:#fff0f0;"' : ''}>
                                    <td><strong>${escapeHtml(f.reference)}</strong></td>
                                    <td><small>${escapeHtml(f.contrat_reference || 'N/A')}</small></td>
                                    <td>${escapeHtml(f.client_nom)}<br><small>${escapeHtml(f.client_entreprise || '')}</small></td>
                                    <td><strong>${formatMoney(f.montant_ttc, f.devise)}</strong></td>
                                    <td style="color:var(--success);">${formatMoney(f.montant_paye, f.devise)}</td>
                                    <td style="color:${(f.solde_restant || 0) > 0 ? 'var(--danger)' : 'var(--success)'}; font-weight:700;">${formatMoney(f.solde_restant, f.devise)}</td>
                                    <td><span class="badge ${getBadgeClass(f.statut)}">${escapeHtml(f.statut_display || f.statut)}</span></td>
                                    <td><small>${formatDate(f.date_emission)}</small></td>
                                    <td><small>${formatDate(f.date_echeance)}</small></td>
                                    <td>
                                        <div class="item-actions">
                                            ${['EMISE','BROUILLON'].includes(f.statut) ? `<button class="btn btn-sm btn-success" onclick="actionLocFacture(${f.id}, 'envoyer')" title="Envoyer">📤</button>` : ''}
                                            ${!['PAYEE','ANNULEE'].includes(f.statut) ? `<button class="btn btn-sm btn-outline" onclick="ouvrirFormulaireLocPaiement(${f.id})" title="Paiement">💰</button>` : ''}
                                            <button class="btn btn-sm btn-outline" onclick="telechargerFactureLocationPDF(${f.id})" title="PDF">📄</button>
                                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/location/facturations/${f.id}/', 'location')">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="responsive-mobile-view">
                ${factList.map(f => `
                    <div class="responsive-card" ${f.statut === 'EN_RETARD' ? 'style="border-left:4px solid var(--danger);"' : ''}>
                        <div class="responsive-card-header">
                            <div><strong>${escapeHtml(f.reference)}</strong><br><small>${escapeHtml(f.client_nom)}</small></div>
                            <span class="badge ${getBadgeClass(f.statut)}">${escapeHtml(f.statut_display || f.statut)}</span>
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row"><span class="responsive-card-label">💰 TTC</span><span style="font-weight:700;">${formatMoney(f.montant_ttc, f.devise)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">✅ Payé</span><span style="color:var(--success);">${formatMoney(f.montant_paye, f.devise)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">⏳ Solde</span><span style="color:var(--danger); font-weight:700;">${formatMoney(f.solde_restant, f.devise)}</span></div>
                        </div>
                        <div class="responsive-card-footer">
                            <button class="btn btn-sm btn-outline" onclick="telechargerFactureLocationPDF(${f.id})" title="PDF">📄</button>
                            ${!['PAYEE','ANNULEE'].includes(f.statut) ? `<button class="btn btn-sm btn-outline" onclick="ouvrirFormulaireLocPaiement(${f.id})">💰 Payer</button>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}


// ========================================
// PAIEMENTS — AVEC BOUTON AJOUTER
// ========================================
function renderLocPaiements(payList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">💰 Paiements Location</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireLocPaiement()">+ Nouveau paiement</button>
            <button class="btn-export" onclick="exporterOngletActifExcel('Paiements_Location')">📊 Excel</button>
        </div>
        ${payList.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">💰</div><h3>Aucun paiement</h3></div>' : `
            <p class="scroll-hint">👆 Faites défiler horizontalement →</p>
            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead><tr><th>Réf</th><th>Facture</th><th>Montant</th><th>Mode</th><th>Statut</th><th>Réf. ext.</th><th>Date</th><th>Confirmé</th><th>Actions</th></tr></thead>
                        <tbody>
                            ${payList.map(p => `
                                <tr>
                                    <td><strong>${escapeHtml(p.reference)}</strong></td>
                                    <td><small>${escapeHtml(p.facturation_reference || 'N/A')}</small></td>
                                    <td><strong>${formatMoney(p.montant)}</strong></td>
                                    <td><span class="badge badge-info">${escapeHtml(p.mode_display || p.mode_paiement)}</span></td>
                                    <td><span class="badge ${getBadgeClass(p.statut)}">${escapeHtml(p.statut_display || p.statut)}</span></td>
                                    <td><small>${escapeHtml(p.reference_externe || 'N/A')}</small></td>
                                    <td><small>${formatDate(p.date_paiement)}</small></td>
                                    <td><small>${escapeHtml(p.confirme_par_nom || 'N/A')}</small></td>
                                    <td>
                                        ${p.statut === 'EN_ATTENTE' ? `<button class="btn btn-sm btn-success" onclick="actionLocPaiement(${p.id}, 'confirmer')">✅</button>` : ''}
                                        <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/location/paiements/${p.id}/', 'location')">🗑️</button>
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
                            <div><strong>${escapeHtml(p.reference)}</strong><br><small>Facture: ${escapeHtml(p.facturation_reference || 'N/A')}</small></div>
                            <span class="badge ${getBadgeClass(p.statut)}">${escapeHtml(p.statut_display || p.statut)}</span>
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row"><span class="responsive-card-label">💰 Montant</span><span style="font-weight:700;">${formatMoney(p.montant)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">💳 Mode</span><span>${escapeHtml(p.mode_display || p.mode_paiement)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📅 Date</span><span>${formatDate(p.date_paiement)}</span></div>
                        </div>
                        <div class="responsive-card-footer">
                            ${p.statut === 'EN_ATTENTE' ? `<button class="btn btn-sm btn-success" onclick="actionLocPaiement(${p.id}, 'confirmer')">✅ Confirmer</button>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}


// ========================================
// SYNCHRO FACTURES LOCATION
// ========================================
async function synchroniserFacturesLocation() {
    if (!confirm('Synchroniser les factures de location ?\n\nCela va générer les factures pour les contrats actifs/terminés qui n\'en ont pas encore.')) return;
    try {
        const result = await apiPost('/api/location/synchroniser-factures/');
        alert(`✅ Synchronisation terminée !\n\n${result.resultats.factures_creees} facture(s) créée(s)\n${result.resultats.erreurs} erreur(s)`);
        navigateTo('location');
    } catch (error) { alert(`Erreur : ${error.message}`); }
}


// ========================================
// ACTIONS
// ========================================
async function actionLocReservation(id, action) {
    try {
        if (action === 'annuler') {
            const motif = prompt('Motif d\'annulation :');
            if (motif === null) return;
            await apiPost(`/api/location/reservations/${id}/annuler/`, { motif });
        } else if (action === 'creer_contrat') {
            if (!confirm('Créer un contrat depuis cette réservation ?')) return;
            await apiPost(`/api/location/reservations/${id}/creer_contrat/`, {});
        } else {
            await apiPost(`/api/location/reservations/${id}/${action}/`);
        }
        navigateTo('location');
    } catch (error) { alert(`Erreur : ${error.message}`); }
}

async function actionLocContrat(id, action) {
    try {
        if (action === 'terminer') {
            const heures = prompt('Heures moteur au retour :');
            const km = prompt('Kilomètres au retour :');
            await apiPost(`/api/location/contrats/${id}/terminer/`, {
                heures_moteur_retour: heures ? parseFloat(heures) : null,
                km_retour: km ? parseFloat(km) : null
            });
        } else if (action === 'generer_facture') {
            const dateEmission = prompt('Date émission (AAAA-MM-JJ) :', new Date().toISOString().split('T')[0]);
            if (!dateEmission) return;
            const dateEcheance = prompt('Date échéance (AAAA-MM-JJ) :');
            if (!dateEcheance) return;
            await apiPost(`/api/location/contrats/${id}/generer_facture/`, {
                date_emission: dateEmission,
                date_echeance: dateEcheance,
                inclure_services: true,
                inclure_penalites: true
            });
        } else if (action === 'exercer_option_achat') {
            if (!confirm('Le client exerce son option d\'achat ?')) return;
            await apiPost(`/api/location/contrats/${id}/exercer_option_achat/`);
        } else if (action === 'ajouter_service') {
            ouvrirFormulaireLocServiceContrat(id);
            return;
        } else {
            await apiPost(`/api/location/contrats/${id}/${action}/`);
        }
        navigateTo('location');
    } catch (error) { alert(`Erreur : ${error.message}`); }
}

async function actionLocCaution(id, action) {
    try {
        if (action === 'enregistrer_versement') {
            const montant = prompt('Montant versé :');
            if (!montant) return;
            const mode = prompt('Mode (ESPECES, VIREMENT, MOBILE_MONEY, CHEQUE, CARTE) :', 'ESPECES');
            const reference = prompt('Référence paiement (optionnel) :');
            await apiPost(`/api/location/cautions/${id}/enregistrer_versement/`, {
                montant: parseFloat(montant),
                mode_paiement: mode || 'ESPECES',
                reference_paiement: reference || ''
            });
        } else if (action === 'restituer') {
            const retenu = prompt('Montant retenu pour dommages (0 si aucun) :', '0');
            const motif = retenu && parseFloat(retenu) > 0 ? prompt('Motif de la retenue :') : '';
            await apiPost(`/api/location/cautions/${id}/restituer/`, {
                montant_retenu: parseFloat(retenu || 0),
                motif_retenue: motif || ''
            });
        }
        navigateTo('location');
    } catch (error) { alert(`Erreur : ${error.message}`); }
}

async function actionLocFacture(id, action) {
    try {
        await apiPost(`/api/location/facturations/${id}/${action}/`);
        navigateTo('location');
    } catch (error) { alert(`Erreur : ${error.message}`); }
}

async function actionLocPaiement(id, action) {
    try {
        await apiPost(`/api/location/paiements/${id}/${action}/`);
        navigateTo('location');
    } catch (error) { alert(`Erreur : ${error.message}`); }
}


// ========================================
// FORMULAIRE SERVICE POUR CONTRAT SPÉCIFIQUE
// ========================================
async function ouvrirFormulaireLocServiceContrat(contratId) {
    const existant = document.getElementById('modalCreation'); if (existant) existant.remove();

    const modal = document.createElement('div'); modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:600px; max-height:90vh; overflow-y:auto;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border);"><h3 style="color:var(--primary);">🔧 Ajouter un service au contrat</h3></div>
            <form id="locSrvContratForm" style="padding:1.5rem;">
                <div class="form-grid">
                    <div class="form-field"><label>Type <span class="required">*</span></label>
                        <select id="srvContratType" required>
                            <option value="LIVRAISON">Livraison</option><option value="RECUPERATION">Récupération</option>
                            <option value="NETTOYAGE">Nettoyage</option><option value="CARBURANT">Carburant</option>
                            <option value="MAIN_OEUVRE">Main d'oeuvre</option><option value="ASSURANCE">Assurance</option>
                            <option value="FORMATION">Formation</option><option value="INSTALLATION">Installation</option>
                            <option value="ENTRETIEN">Entretien</option><option value="AUTRE">Autre</option>
                        </select>
                    </div>
                    <div class="form-field full-width"><label>Description <span class="required">*</span></label><textarea id="srvContratDesc" rows="2" required></textarea></div>
                    <div class="form-field"><label>Quantité</label><input type="number" id="srvContratQte" step="0.01" value="1"></div>
                    <div class="form-field"><label>Unité</label>
                        <select id="srvContratUnite"><option value="forfait">Forfait</option><option value="jour">Jour</option><option value="heure">Heure</option><option value="km">Km</option></select>
                    </div>
                    <div class="form-field"><label>Prix unitaire <span class="required">*</span></label><input type="number" id="srvContratPrix" step="0.01" required></div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 Ajouter</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="srvContratError" style="color:var(--danger); text-align:center;"></p>
            </form>
        </div>`;
    document.body.appendChild(modal);

    document.getElementById('locSrvContratForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await apiPost(`/api/location/contrats/${contratId}/ajouter_service/`, {
                type_service: document.getElementById('srvContratType').value,
                description: document.getElementById('srvContratDesc').value,
                quantite: parseFloat(document.getElementById('srvContratQte').value),
                unite: document.getElementById('srvContratUnite').value,
                prix_unitaire: parseFloat(document.getElementById('srvContratPrix').value)
            });
            modal.remove(); navigateTo('location');
        } catch (error) { document.getElementById('srvContratError').textContent = error.message; }
    });
}



// ========================================
// TAB : ÉTATS DES LIEUX
// ========================================
function renderLocEDL(edlList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">📸 États des Lieux</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireLocEDL()">+ Nouvel état des lieux</button>
        </div>
        ${edlList.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📸</div><h3>Aucun état des lieux</h3></div>' : `
            <p class="scroll-hint">👆 Faites défiler horizontalement →</p>
            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead><tr><th>ID</th><th>Contrat</th><th>Type</th><th>État</th><th>Heures</th><th>Km</th><th>Carburant</th><th>Date</th><th>Actions</th></tr></thead>
                        <tbody>
                            ${edlList.map(e => `
                                <tr ${['ENDOMMAGE','HORS_SERVICE'].includes(e.etat_general) ? 'style="background:#fff0f0;"' : ''}>
                                    <td>#${e.id}</td>
                                    <td><small>${escapeHtml(e.contrat_reference || 'N/A')}</small></td>
                                    <td><span class="badge ${e.type_etat === 'SORTIE' ? 'badge-info' : 'badge-warning'}">${escapeHtml(e.type_display || e.type_etat)}</span></td>
                                    <td><span class="badge ${['BON','EXCELLENT','NEUF'].includes(e.etat_general) ? 'badge-success' : ['ENDOMMAGE','HORS_SERVICE'].includes(e.etat_general) ? 'badge-danger' : 'badge-warning'}">${escapeHtml(e.etat_general_display || e.etat_general)}</span></td>
                                    <td>${e.heures_moteur || 0}h</td>
                                    <td>${e.kilometres || 0} km</td>
                                    <td>${e.niveau_carburant_pourcentage || 0}%</td>
                                    <td><small>${formatDateTime(e.date_realisation)}</small></td>
                                    <td>
                                        <div class="item-actions">
                                            <button class="btn btn-sm btn-outline" onclick="voirDetailLocEDL(${e.id})">👁️</button>
                                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/location/etats-des-lieux/${e.id}/', 'location')">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="responsive-mobile-view">
                ${edlList.map(e => `
                    <div class="responsive-card" ${['ENDOMMAGE','HORS_SERVICE'].includes(e.etat_general) ? 'style="border-left:4px solid var(--danger);"' : ''}>
                        <div class="responsive-card-header">
                            <div><strong>EDL #${e.id}</strong><br><small>Contrat: ${escapeHtml(e.contrat_reference || 'N/A')}</small></div>
                            <span class="badge ${e.type_etat === 'SORTIE' ? 'badge-info' : 'badge-warning'}">${escapeHtml(e.type_display || e.type_etat)}</span>
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row"><span class="responsive-card-label">📊 État</span><span class="badge ${['BON','EXCELLENT'].includes(e.etat_general) ? 'badge-success' : 'badge-warning'}">${escapeHtml(e.etat_general_display || e.etat_general)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">⏱️ Heures</span><span>${e.heures_moteur || 0}h</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">🛣️ Km</span><span>${e.kilometres || 0}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">⛽ Carburant</span><span>${e.niveau_carburant_pourcentage || 0}%</span></div>
                        </div>
                        <div class="responsive-card-footer">
                            <button class="btn btn-sm btn-outline" onclick="voirDetailLocEDL(${e.id})">👁️</button>
                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/location/etats-des-lieux/${e.id}/', 'location')">🗑️</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}


// ========================================
// FORMULAIRE RÉSERVATION
// ========================================
async function ouvrirFormulaireLocReservation(editData = null) {
    const existant = document.getElementById('modalCreation'); if (existant) existant.remove();
    let equipements = [];
    try { const r = await apiGet('/api/equipements/equipements/?disponible=true'); equipements = Array.isArray(r) ? r : (r.results || []); } catch(e) {}

    // Si édition, ajouter aussi l'équipement actuel même s'il n'est plus disponible
    if (editData && editData.equipement) {
        const eqExiste = equipements.find(e => e.id === editData.equipement);
        if (!eqExiste) {
            try {
                const eqActuel = await apiGet(`/api/equipements/equipements/${editData.equipement}/`);
                equipements.unshift(eqActuel);
            } catch(e) {}
        }
    }

    const titre = editData ? `Modifier réservation ${editData.reference || ''}` : 'Nouvelle réservation';
    const endpoint = editData ? `/api/location/reservations/${editData.id}/` : '/api/location/reservations/';

    const modal = document.createElement('div'); modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:700px; max-height:90vh; overflow-y:auto;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">${editData ? '✏️' : '➕'} ${titre}</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="locResForm" style="padding:1.5rem;">
                <div class="form-section"><div class="form-section-title">🚜 Équipement</div>
                    <div class="form-grid">
                        <div class="form-field full-width">
                            <label>Équipement <span class="required">*</span></label>
                            <select id="resEquipement" required onchange="preFillCautionReservation()">
                                <option value="">Sélectionner un équipement...</option>
                                ${equipements.map(e => `
                                    <option value="${e.id}" 
                                        data-caution="${e.caution_requise || 0}" 
                                        data-tarif-jour="${e.tarif_journalier || 0}"
                                        data-tarif-sem="${e.tarif_hebdomadaire || 0}"
                                        data-tarif-mois="${e.tarif_mensuel || 0}"
                                        ${editData?.equipement === e.id ? 'selected' : ''}>
                                        ${escapeHtml(e.nom)} (${escapeHtml(e.reference)}) — ${formatMoney(e.tarif_journalier || 0)}/jour | Caution: ${formatMoney(e.caution_requise || 0)}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                </div>

                <div class="form-section"><div class="form-section-title">👤 Client</div>
                    <div class="form-grid">
                        <div class="form-field"><label>Nom <span class="required">*</span></label><input type="text" id="resClientNom" value="${escapeHtml(editData?.client_nom || '')}" required></div>
                        <div class="form-field"><label>Entreprise</label><input type="text" id="resClientEntreprise" value="${escapeHtml(editData?.client_entreprise || '')}"></div>
                        <div class="form-field"><label>Email <span class="required">*</span></label><input type="email" id="resClientEmail" value="${escapeHtml(editData?.client_email || '')}" required></div>
                        <div class="form-field"><label>Téléphone <span class="required">*</span></label><input type="text" id="resClientTel" value="${escapeHtml(editData?.client_telephone || '')}" required></div>
                        <div class="form-field full-width"><label>Adresse</label><textarea id="resClientAdresse" rows="2">${escapeHtml(editData?.client_adresse || '')}</textarea></div>
                        <div class="form-field"><label>Pièce d'identité</label><input type="text" id="resClientPiece" value="${escapeHtml(editData?.client_piece_identite || '')}" placeholder="N° CNI ou Passeport"></div>
                    </div>
                </div>

                <div class="form-section"><div class="form-section-title">📅 Période & Tarification</div>
                    <div class="form-grid">
                        <div class="form-field"><label>Date début <span class="required">*</span></label><input type="date" id="resDateDebut" value="${editData?.date_debut_prevue || ''}" required></div>
                        <div class="form-field"><label>Date fin <span class="required">*</span></label><input type="date" id="resDateFin" value="${editData?.date_fin_prevue || ''}" required></div>
                        <div class="form-field"><label>Mode tarification</label>
                            <select id="resMode" onchange="updateTarifReservation()">
                                <option value="JOURNALIER" ${editData?.mode_tarification === 'JOURNALIER' ? 'selected' : ''}>Journalier</option>
                                <option value="HEBDOMADAIRE" ${editData?.mode_tarification === 'HEBDOMADAIRE' ? 'selected' : ''}>Hebdomadaire</option>
                                <option value="MENSUEL" ${editData?.mode_tarification === 'MENSUEL' ? 'selected' : ''}>Mensuel</option>
                                <option value="FORFAIT" ${editData?.mode_tarification === 'FORFAIT' ? 'selected' : ''}>Forfait</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Tarif appliqué</label>
                            <input type="number" id="resTarif" step="0.01" value="${editData?.tarif_applique || 0}">
                            <span class="field-help">Pré-rempli selon l'équipement</span>
                        </div>
                    </div>
                </div>

                <div class="form-section"><div class="form-section-title">💳 Caution & Lieu</div>
                    <div class="form-grid">
                        <div class="form-field">
                            <label>Caution requise (${editData?.devise || 'FCFA'}) <span class="required">*</span></label>
                            <input type="number" id="resCaution" step="0.01" value="${editData?.caution_requise || 0}" required>
                            <span class="field-help">Montant pré-rempli depuis l'équipement</span>
                        </div>
                        <div class="form-field"><label>Devise</label>
                            <select id="resDevise">
                                <option value="FCFA" ${editData?.devise === 'FCFA' ? 'selected' : ''}>FCFA</option>
                                <option value="EUR" ${editData?.devise === 'EUR' ? 'selected' : ''}>EUR</option>
                                <option value="USD" ${editData?.devise === 'USD' ? 'selected' : ''}>USD</option>
                            </select>
                        </div>
                        <div class="form-field"><label>Lieu d'utilisation</label><input type="text" id="resLieu" value="${escapeHtml(editData?.lieu_utilisation || '')}" placeholder="Ex: Chantier Kribi"></div>
                        <div class="form-field"><label>Lieu de livraison</label><input type="text" id="resLieuLiv" value="${escapeHtml(editData?.lieu_livraison || '')}" placeholder="Si différent du lieu d'utilisation"></div>
                    </div>
                </div>

                <div class="form-grid">
                    <div class="form-field full-width"><label>Notes</label><textarea id="resNotes" rows="2">${escapeHtml(editData?.notes || '')}</textarea></div>
                    <div class="form-field full-width"><label>Conditions spéciales</label><textarea id="resConditions" rows="2">${escapeHtml(editData?.conditions_speciales || '')}</textarea></div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 ${editData ? 'Enregistrer' : 'Créer la réservation'}</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="locResError" style="color:var(--danger); text-align:center; white-space:pre-wrap;"></p>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    // Pré-remplir si équipement déjà sélectionné
    if (!editData) {
        preFillCautionReservation();
    }

    document.getElementById('locResForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const payload = {
                equipement: parseInt(document.getElementById('resEquipement').value),
                client_nom: document.getElementById('resClientNom').value,
                client_entreprise: document.getElementById('resClientEntreprise')?.value || '',
                client_email: document.getElementById('resClientEmail').value,
                client_telephone: document.getElementById('resClientTel').value,
                client_adresse: document.getElementById('resClientAdresse')?.value || '',
                client_piece_identite: document.getElementById('resClientPiece')?.value || '',
                date_debut_prevue: document.getElementById('resDateDebut').value,
                date_fin_prevue: document.getElementById('resDateFin').value,
                mode_tarification: document.getElementById('resMode').value,
                tarif_applique: parseFloat(document.getElementById('resTarif').value) || 0,
                caution_requise: parseFloat(document.getElementById('resCaution').value) || 0,
                devise: document.getElementById('resDevise').value,
                lieu_utilisation: document.getElementById('resLieu')?.value || '',
                lieu_livraison: document.getElementById('resLieuLiv')?.value || '',
                notes: document.getElementById('resNotes')?.value || '',
                conditions_speciales: document.getElementById('resConditions')?.value || ''
            };
            if (editData) { await apiPatch(endpoint, payload); } else { await apiPost(endpoint, payload); }
            modal.remove(); navigateTo('location');
        } catch (error) { document.getElementById('locResError').textContent = error.message; }
    });
}

function preFillCautionReservation() {
    const select = document.getElementById('resEquipement');
    if (!select) return;
    const option = select.options[select.selectedIndex];
    if (!option || !option.value) return;

    const caution = option.dataset.caution || 0;
    const cautionField = document.getElementById('resCaution');
    if (cautionField && parseFloat(cautionField.value) === 0) {
        cautionField.value = caution;
    }

    updateTarifReservation();
}

function updateTarifReservation() {
    const select = document.getElementById('resEquipement');
    const mode = document.getElementById('resMode');
    const tarifField = document.getElementById('resTarif');
    if (!select || !mode || !tarifField) return;

    const option = select.options[select.selectedIndex];
    if (!option || !option.value) return;

    let tarif = 0;
    switch (mode.value) {
        case 'JOURNALIER': tarif = option.dataset.tarifJour || 0; break;
        case 'HEBDOMADAIRE': tarif = option.dataset.tarifSem || 0; break;
        case 'MENSUEL': tarif = option.dataset.tarifMois || 0; break;
        default: tarif = option.dataset.tarifJour || 0;
    }

    if (parseFloat(tarifField.value) === 0 || !tarifField.value) {
        tarifField.value = tarif;
    }
}

async function editerLocReservation(id) {
    try { const r = await apiGet(`/api/location/reservations/${id}/`); ouvrirFormulaireLocReservation(r); } catch(e) { alert(e.message); }
}


// ========================================
// DÉTAIL CONTRAT
// ========================================
async function voirDetailLocContrat(id) {
    try {
        const c = await apiGet(`/api/location/contrats/${id}/`);
        const existant = document.getElementById('modalCreation'); if (existant) existant.remove();
        const modal = document.createElement('div'); modal.id = 'modalCreation';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
        modal.innerHTML = `
            <div style="background:white; border-radius:16px; width:100%; max-width:800px; max-height:90vh; overflow-y:auto;">
                <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                    <h3 style="color:var(--primary);">📝 Contrat ${escapeHtml(c.reference)}</h3>
                    <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.5rem; cursor:pointer;">✕</button>
                </div>
                <div style="padding:1.5rem;">
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">📋 Informations</div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.3rem;">
                            <div class="detail-row"><span class="detail-label">Référence</span><span class="detail-value"><strong>${escapeHtml(c.reference)}</strong></span></div>
                            <div class="detail-row"><span class="detail-label">Statut</span><span class="detail-value"><span class="badge ${getBadgeClass(c.statut)}">${escapeHtml(c.statut_display || c.statut)}</span></span></div>
                            <div class="detail-row"><span class="detail-label">Équipement</span><span class="detail-value">${escapeHtml(c.equipement_nom || 'N/A')}</span></div>
                            <div class="detail-row"><span class="detail-label">Client</span><span class="detail-value">${escapeHtml(c.client_nom)} ${c.client_entreprise ? '(' + escapeHtml(c.client_entreprise) + ')' : ''}</span></div>
                            <div class="detail-row"><span class="detail-label">Période</span><span class="detail-value">${formatDate(c.date_debut)} → ${formatDate(c.date_fin_prevue)}</span></div>
                            <div class="detail-row"><span class="detail-label">Jours</span><span class="detail-value">${c.jours_location || 0} jours</span></div>
                            ${c.jours_retard > 0 ? `<div class="detail-row"><span class="detail-label">Retard</span><span class="detail-value"><span class="badge badge-danger">${c.jours_retard} jours</span></span></div>` : ''}
                        </div>
                    </div>
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">💰 Montants</div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.3rem;">
                            <div class="detail-row"><span class="detail-label">Location HT</span><span class="detail-value">${formatMoney(c.montant_location_ht, c.devise)}</span></div>
                            <div class="detail-row"><span class="detail-label">Services HT</span><span class="detail-value">${formatMoney(c.montant_services_ht, c.devise)}</span></div>
                            <div class="detail-row"><span class="detail-label">Pénalités</span><span class="detail-value" style="color:var(--danger);">${formatMoney(c.montant_penalites, c.devise)}</span></div>
                            <div class="detail-row"><span class="detail-label">TVA</span><span class="detail-value">${formatMoney(c.montant_tva, c.devise)}</span></div>
                            <div class="detail-row" style="border-top:2px solid var(--primary);"><span class="detail-label" style="font-weight:800;">Total TTC</span><span class="detail-value" style="font-weight:800; color:var(--primary); font-size:1.2rem;">${formatMoney(c.montant_total_ttc, c.devise)}</span></div>
                        </div>
                    </div>
                    ${c.option_achat_proposee ? `
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">🏷️ Option d'achat</div>
                        <div class="detail-row"><span class="detail-label">Prix</span><span class="detail-value">${formatMoney(c.prix_option_achat, c.devise)}</span></div>
                        <div class="detail-row"><span class="detail-label">Exercée</span><span class="detail-value">${c.option_achat_exercee ? '✅ Oui' : '❌ Non'}</span></div>
                    </div>` : ''}
                    <div class="form-actions">
                        ${c.statut === 'ACTIF' ? `
                            <button class="btn btn-primary" onclick="this.closest('#modalCreation').remove(); actionLocContrat(${c.id}, 'terminer')">🏁 Terminer</button>
                            <button class="btn btn-outline" onclick="this.closest('#modalCreation').remove(); actionLocContrat(${c.id}, 'generer_facture')">📄 Facturer</button>
                            <button class="btn btn-outline" onclick="this.closest('#modalCreation').remove(); telechargerContratPDF(${c.id})">📄 PDF Contrat</button>
                            <button class="btn btn-outline" onclick="this.closest('#modalCreation').remove(); actionLocContrat(${c.id}, 'ajouter_service')">🔧 Service</button>
                        ` : ''}
                        <button class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Fermer</button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(modal); modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    } catch (error) { alert(`Erreur : ${error.message}`); }
}


// ========================================
// FORMULAIRE EDL AVEC PHOTOS
// ========================================
async function ouvrirFormulaireLocEDL() {
    const existant = document.getElementById('modalCreation'); if (existant) existant.remove();
    let contrats = [];
    try { const r = await apiGet('/api/location/contrats/?statut=ACTIF'); contrats = Array.isArray(r) ? r : (r.results || []); } catch(e) {}

    const modal = document.createElement('div'); modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:750px; max-height:90vh; overflow-y:auto;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border);"><h3 style="color:var(--primary);">➕ Nouvel état des lieux</h3></div>
            <form id="locEdlForm" style="padding:1.5rem;" enctype="multipart/form-data">
                <div class="form-grid">
                    <div class="form-field full-width"><label>Contrat <span class="required">*</span></label>
                        <select id="edlContrat" required><option value="">Sélectionner...</option>${contrats.map(c => `<option value="${c.id}">${escapeHtml(c.reference)} — ${escapeHtml(c.equipement_nom || '')} (${escapeHtml(c.client_nom)})</option>`).join('')}</select>
                    </div>
                    <div class="form-field"><label>Type <span class="required">*</span></label>
                        <select id="edlType" required><option value="SORTIE">📤 Sortie</option><option value="RETOUR">📥 Retour</option></select>
                    </div>
                    <div class="form-field"><label>État général <span class="required">*</span></label>
                        <select id="edlEtat" required><option value="NEUF">Neuf</option><option value="EXCELLENT">Excellent</option><option value="BON" selected>Bon</option><option value="ACCEPTABLE">Acceptable</option><option value="ENDOMMAGE">Endommagé</option><option value="HORS_SERVICE">Hors service</option></select>
                    </div>
                    <div class="form-field"><label>Heures moteur</label><input type="number" id="edlHeures" step="0.1" value="0"></div>
                    <div class="form-field"><label>Kilomètres</label><input type="number" id="edlKm" step="0.1" value="0"></div>
                    <div class="form-field"><label>Carburant (%)</label><input type="number" id="edlCarburant" min="0" max="100" value="100"></div>
                    <div class="form-field"><label>Date <span class="required">*</span></label><input type="datetime-local" id="edlDate" value="${new Date().toISOString().slice(0,16)}" required></div>
                    <div class="form-field full-width"><label>📸 Photo avant</label><input type="file" id="edlPhotoAvant" accept="image/*" style="padding:0.4rem; border:2px dashed var(--border); border-radius:8px; width:100%;"></div>
                    <div class="form-field full-width"><label>📸 Photo arrière</label><input type="file" id="edlPhotoArriere" accept="image/*" style="padding:0.4rem; border:2px dashed var(--border); border-radius:8px; width:100%;"></div>
                    <div class="form-field full-width"><label>📸 Photo droite</label><input type="file" id="edlPhotoDroite" accept="image/*" style="padding:0.4rem; border:2px dashed var(--border); border-radius:8px; width:100%;"></div>
                    <div class="form-field full-width"><label>📸 Photo gauche</label><input type="file" id="edlPhotoGauche" accept="image/*" style="padding:0.4rem; border:2px dashed var(--border); border-radius:8px; width:100%;"></div>
                    <div class="form-field full-width"><label>Dommages constatés</label><textarea id="edlDommages" rows="2"></textarea></div>
                    <div class="form-field full-width"><label>Observations</label><textarea id="edlObs" rows="2"></textarea></div>
                </div>
                <div class="form-checkbox"><input type="checkbox" id="edlHorsLigne"><label>📴 Réalisé hors ligne</label></div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 Enregistrer</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="locEdlError" style="color:var(--danger); text-align:center;"></p>
            </form>
        </div>`;
    document.body.appendChild(modal); modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('locEdlForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('contrat', document.getElementById('edlContrat').value);
            formData.append('type_etat', document.getElementById('edlType').value);
            formData.append('etat_general', document.getElementById('edlEtat').value);
            formData.append('heures_moteur', document.getElementById('edlHeures').value || 0);
            formData.append('kilometres', document.getElementById('edlKm').value || 0);
            formData.append('niveau_carburant_pourcentage', document.getElementById('edlCarburant').value || 100);
            formData.append('date_realisation', document.getElementById('edlDate').value);
            formData.append('dommages_constates', document.getElementById('edlDommages')?.value || '');
            formData.append('observations', document.getElementById('edlObs')?.value || '');
            formData.append('realise_hors_ligne', document.getElementById('edlHorsLigne').checked);

            const photoAvant = document.getElementById('edlPhotoAvant').files[0];
            const photoArriere = document.getElementById('edlPhotoArriere').files[0];
            if (photoAvant) formData.append('photo_avant', photoAvant);
            if (photoArriere) formData.append('photo_arriere', photoArriere);

            await uploadImage('/api/location/etats-des-lieux/', formData);
            modal.remove(); navigateTo('location');
        } catch (error) { document.getElementById('locEdlError').textContent = error.message; }
    });
}


// ========================================
// DÉTAIL EDL AVEC PHOTOS
// ========================================
async function voirDetailLocEDL(id) {
    try {
        const e = await apiGet(`/api/location/etats-des-lieux/${id}/`);
        const existant = document.getElementById('modalCreation'); if (existant) existant.remove();
        const photos = [
            {label:'Avant', url: e.photo_avant_url || e.photo_avant},
            {label:'Arrière', url: e.photo_arriere_url || e.photo_arriere},
            {label:'Gauche', url: e.photo_gauche_url || e.photo_gauche},
            {label:'Droite', url: e.photo_droite_url || e.photo_droite}
        ].filter(p => p.url);

        const modal = document.createElement('div'); modal.id = 'modalCreation';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
        modal.innerHTML = `
            <div style="background:white; border-radius:16px; width:100%; max-width:750px; max-height:90vh; overflow-y:auto;">
                <div style="padding:1.5rem; border-bottom:1px solid var(--border);"><h3 style="color:var(--primary);">📸 EDL #${e.id}</h3></div>
                <div style="padding:1.5rem;">
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">📋 Général</div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.3rem;">
                            <div class="detail-row"><span class="detail-label">Contrat</span><span class="detail-value">${escapeHtml(e.contrat_reference || 'N/A')}</span></div>
                            <div class="detail-row"><span class="detail-label">Type</span><span class="detail-value"><span class="badge ${e.type_etat === 'SORTIE' ? 'badge-info' : 'badge-warning'}">${escapeHtml(e.type_display || e.type_etat)}</span></span></div>
                            <div class="detail-row"><span class="detail-label">État</span><span class="detail-value">${escapeHtml(e.etat_general_display || e.etat_general)}</span></div>
                            <div class="detail-row"><span class="detail-label">Heures</span><span class="detail-value">${e.heures_moteur || 0}h</span></div>
                            <div class="detail-row"><span class="detail-label">Km</span><span class="detail-value">${e.kilometres || 0}</span></div>
                            <div class="detail-row"><span class="detail-label">Carburant</span><span class="detail-value">${e.niveau_carburant_pourcentage || 0}%</span></div>
                        </div>
                    </div>
                    ${photos.length > 0 ? `
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">📸 Photos (${photos.length})</div>
                        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(160px, 1fr)); gap:0.8rem;">
                            ${photos.map(p => `
                                <div style="border-radius:10px; overflow:hidden; box-shadow:var(--shadow); cursor:pointer;" onclick="window.open('${p.url}', '_blank')">
                                    <img src="${p.url}" style="width:100%; height:120px; object-fit:cover;">
                                    <div style="padding:0.3rem; text-align:center; background:#f9f9f9;"><small>${p.label}</small></div>
                                </div>
                            `).join('')}
                        </div>
                    </div>` : ''}
                    ${e.dommages_constates ? `<div class="detail-fieldset"><div class="detail-fieldset-title">⚠️ Dommages</div><p>${escapeHtml(e.dommages_constates)}</p></div>` : ''}
                    ${e.observations ? `<div class="detail-fieldset"><div class="detail-fieldset-title">📝 Observations</div><p>${escapeHtml(e.observations)}</p></div>` : ''}
                </div>
            </div>`;
        document.body.appendChild(modal); modal.addEventListener('click', (ev) => { if (ev.target === modal) modal.remove(); });
    } catch (error) { alert(`Erreur : ${error.message}`); }
}


// ========================================
// FORMULAIRE SERVICE ANNEXE GLOBAL
// ========================================
async function ouvrirFormulaireLocService() {
    const existant = document.getElementById('modalCreation'); if (existant) existant.remove();
    let contrats = [];
    try { const r = await apiGet('/api/location/contrats/?statut=ACTIF'); contrats = Array.isArray(r) ? r : (r.results || []); } catch(e) {}

    const modal = document.createElement('div'); modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:600px;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border);"><h3 style="color:var(--primary);">➕ Nouveau service annexe</h3></div>
            <form id="locSrvForm" style="padding:1.5rem;">
                <div class="form-grid">
                    <div class="form-field full-width"><label>Contrat <span class="required">*</span></label>
                        <select id="srvContrat" required><option value="">Sélectionner...</option>${contrats.map(c => `<option value="${c.id}">${escapeHtml(c.reference)} — ${escapeHtml(c.client_nom)}</option>`).join('')}</select>
                    </div>
                    <div class="form-field"><label>Type <span class="required">*</span></label>
                        <select id="srvType" required><option value="LIVRAISON">Livraison</option><option value="RECUPERATION">Récupération</option><option value="NETTOYAGE">Nettoyage</option><option value="CARBURANT">Carburant</option><option value="MAIN_OEUVRE">Main d'oeuvre</option><option value="ASSURANCE">Assurance</option><option value="AUTRE">Autre</option></select>
                    </div>
                    <div class="form-field full-width"><label>Description <span class="required">*</span></label><textarea id="srvDesc" rows="2" required></textarea></div>
                    <div class="form-field"><label>Quantité</label><input type="number" id="srvQte" step="0.01" value="1"></div>
                    <div class="form-field"><label>Unité</label><select id="srvUnite"><option value="forfait">Forfait</option><option value="jour">Jour</option><option value="heure">Heure</option><option value="km">Km</option></select></div>
                    <div class="form-field"><label>Prix unitaire <span class="required">*</span></label><input type="number" id="srvPrix" step="0.01" required></div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 Ajouter</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="locSrvError" style="color:var(--danger); text-align:center;"></p>
            </form>
        </div>`;
    document.body.appendChild(modal);
    document.getElementById('locSrvForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await apiPost('/api/location/services/', {
                contrat: parseInt(document.getElementById('srvContrat').value),
                type_service: document.getElementById('srvType').value,
                description: document.getElementById('srvDesc').value,
                quantite: parseFloat(document.getElementById('srvQte').value),
                unite: document.getElementById('srvUnite').value,
                prix_unitaire: parseFloat(document.getElementById('srvPrix').value)
            });
            modal.remove(); navigateTo('location');
        } catch (error) { document.getElementById('locSrvError').textContent = error.message; }
    });
}


// ========================================
// FORMULAIRE PAIEMENT LOCATION
// ========================================
async function ouvrirFormulaireLocPaiement(factureId = null) {
    const existant = document.getElementById('modalCreation'); if (existant) existant.remove();
    let facturations = [];
    try { const r = await apiGet('/api/location/facturations/'); facturations = (Array.isArray(r) ? r : (r.results || [])).filter(f => !['PAYEE','ANNULEE'].includes(f.statut)); } catch(e) {}

    const modal = document.createElement('div'); modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:550px;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border);"><h3 style="color:var(--primary);">➕ Paiement location</h3></div>
            <form id="locPayForm" style="padding:1.5rem;">
                <div class="form-grid">
                    <div class="form-field full-width"><label>Facture <span class="required">*</span></label>
                        <select id="payLocFacture" required><option value="">Sélectionner...</option>${facturations.map(f => `<option value="${f.id}" ${factureId === f.id ? 'selected' : ''}>${escapeHtml(f.reference)} — ${escapeHtml(f.client_nom)} (Solde: ${formatMoney(f.solde_restant)})</option>`).join('')}</select>
                    </div>
                    <div class="form-field"><label>Montant <span class="required">*</span></label><input type="number" id="payLocMontant" step="0.01" required></div>
                    <div class="form-field"><label>Mode</label>
                        <select id="payLocMode"><option value="VIREMENT">Virement</option><option value="ESPECES">Espèces</option><option value="MOBILE_MONEY">Mobile Money</option><option value="CHEQUE">Chèque</option><option value="CARTE">Carte</option></select>
                    </div>
                    <div class="form-field"><label>Date <span class="required">*</span></label><input type="date" id="payLocDate" value="${new Date().toISOString().split('T')[0]}" required></div>
                    <div class="form-field full-width"><label>Réf. externe</label><input type="text" id="payLocRef"></div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 Enregistrer</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="locPayError" style="color:var(--danger); text-align:center;"></p>
            </form>
        </div>`;
    document.body.appendChild(modal);
    document.getElementById('locPayForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await apiPost('/api/location/paiements/', {
                facturation: parseInt(document.getElementById('payLocFacture').value),
                montant: parseFloat(document.getElementById('payLocMontant').value),
                mode_paiement: document.getElementById('payLocMode').value,
                date_paiement: document.getElementById('payLocDate').value,
                reference_externe: document.getElementById('payLocRef')?.value || ''
            });
            modal.remove(); navigateTo('location');
        } catch (error) { document.getElementById('locPayError').textContent = error.message; }
    });
}


// ========================================
// TÉLÉCHARGER CONTRAT PDF
// ========================================
function telechargerContratPDF(id) {
    const token = getToken();
    fetch(`${API_BASE}/api/location/contrats/${id}/pdf/`, {
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
        a.download = `Contrat_${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    })
    .catch(error => alert(`Erreur : ${error.message}`));
}



function telechargerFactureLocationPDF(id) {
    const token = getToken();
    fetch(`${API_BASE}/api/location/facturations/${id}/pdf/`, {
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
        a.download = `Facture_Location_${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    })
    .catch(error => alert(`Erreur : ${error.message}`));
}