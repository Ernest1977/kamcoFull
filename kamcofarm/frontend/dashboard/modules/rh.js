// ========================================
// MODULE RH — CRUD COMPLET + RESPONSIVE
// ========================================

async function loadRHModule() {
    const area = document.getElementById('contentArea');

    try {
        const [dashboard, employes, departements, conges, presences, fichesPaie] = await Promise.all([
            apiGet('/api/rh/dashboard/').catch(() => null),
            apiGet('/api/rh/employes/').catch(() => []),
            apiGet('/api/rh/departements/').catch(() => []),
            apiGet('/api/rh/conges/').catch(() => []),
            apiGet('/api/rh/presences/').catch(() => []),
            apiGet('/api/rh/fiches-paie/').catch(() => [])
        ]);

        const empList = Array.isArray(employes) ? employes : (employes.results || []);
        const depList = Array.isArray(departements) ? departements : (departements.results || []);
        const conList = Array.isArray(conges) ? conges : (conges.results || []);
        const presList = Array.isArray(presences) ? presences : (presences.results || []);
        const paieList = Array.isArray(fichesPaie) ? fichesPaie : (fichesPaie.results || []);

        area.innerHTML = `
            <!-- Stats -->
            <div class="stats-row">
                <div class="stat-card">
                    <div class="stat-card-icon blue">👥</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${dashboard?.total_employes || empList.length}</div>
                        <div class="stat-card-label">Employés actifs</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon purple">🏢</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${dashboard?.total_departements || depList.length}</div>
                        <div class="stat-card-label">Départements</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon green">✅</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${dashboard?.presents_aujourdhui || 0}</div>
                        <div class="stat-card-label">Présents aujourd'hui</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon orange">📅</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${dashboard?.conges_en_attente || conList.filter(c => c.statut === 'EN_ATTENTE').length}</div>
                        <div class="stat-card-label">Congés en attente</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon teal">💰</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${formatMoney(dashboard?.masse_salariale_annee || 0)}</div>
                        <div class="stat-card-label">Masse salariale</div>
                    </div>
                </div>
            </div>

            <!-- Alertes -->
            ${(dashboard?.conges_en_attente || 0) > 0 ? `<div class="alert alert-warning"><span>📅</span><span><strong>${dashboard.conges_en_attente}</strong> demande(s) de congé en attente d'approbation</span></div>` : ''}
            ${(dashboard?.contrats_expirant_bientot || 0) > 0 ? `<div class="alert alert-danger"><span>📋</span><span><strong>${dashboard.contrats_expirant_bientot}</strong> contrat(s) expirant bientôt</span></div>` : ''}

            <!-- Onglets -->
            <div class="card">
                <div class="card-header" style="overflow-x:auto;">
                    <div class="tab-nav" style="flex-wrap:nowrap; min-width:max-content;">
                        <button class="tab-btn active" onclick="switchTab('rh', 'employes', this)">👥 Employés (${empList.length})</button>
                        <button class="tab-btn" onclick="switchTab('rh', 'departements', this)">🏢 Départements (${depList.length})</button>
                        <button class="tab-btn" onclick="switchTab('rh', 'conges', this)">📅 Congés (${conList.length})</button>
                        <button class="tab-btn" onclick="switchTab('rh', 'presences', this)">⏰ Présences (${presList.length})</button>
                        <button class="tab-btn" onclick="switchTab('rh', 'paie', this)">💰 Fiches de paie (${paieList.length})</button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="tab-content active" id="rh_employes" style="display:block;">
                        ${renderRHEmployes(empList)}
                    </div>
                    <div class="tab-content" id="rh_departements" style="display:none;">
                        ${renderRHDepartements(depList)}
                    </div>
                    <div class="tab-content" id="rh_conges" style="display:none;">
                        ${renderRHConges(conList)}
                    </div>
                    <div class="tab-content" id="rh_presences" style="display:none;">
                        ${renderRHPresences(presList)}
                    </div>
                    <div class="tab-content" id="rh_paie" style="display:none;">
                        ${renderRHPaie(paieList)}
                    </div>
                </div>
            </div>
        `;

    } catch (error) {
        showError(`RH : ${error.message}`);
    }
}


// ========================================
// TAB : EMPLOYÉS
// ========================================
function renderRHEmployes(empList) {
    const searchValue = getSearchValue('rh');
    let filtered = empList;
    if (searchValue) {
        filtered = filterLocally(filtered, searchValue, [
            'matricule', 'nom_complet_affiche', 'nom_complet', 'poste',
            'departement_nom', 'telephone_personnel', 'email_personnel'
        ]);
    }

    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">👥 Employés</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireRHEmploye()">+ Nouvel employé</button>
        </div>
        ${renderSearchBar({ placeholder: 'Rechercher un employé...', moduleRedirect: 'rh' })}

        ${filtered.length === 0 ? `
            <div class="empty-state"><div class="empty-state-icon">👥</div><h3>Aucun employé</h3></div>
        ` : `
            <p class="scroll-hint">👆 Faites défiler horizontalement →</p>
            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead>
                            <tr>
                                <th>Matricule</th>
                                <th>Nom complet</th>
                                <th>Poste</th>
                                <th>Département</th>
                                <th>Âge</th>
                                <th>Téléphone</th>
                                <th>Email</th>
                                <th>Actif</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filtered.map(emp => `
                                <tr>
                                    <td><strong>${escapeHtml(emp.matricule)}</strong></td>
                                    <td>${escapeHtml(emp.nom_complet_affiche || emp.nom_complet || 'N/A')}</td>
                                    <td>${escapeHtml(emp.poste || 'N/A')}</td>
                                    <td>${escapeHtml(emp.departement_nom || 'N/A')}</td>
                                    <td>${emp.age !== null && emp.age !== undefined ? `<span class="badge badge-info">${emp.age} ans</span>` : 'N/A'}</td>
                                    <td>${emp.telephone_personnel ? `<a href="tel:${emp.telephone_personnel}" style="color:var(--primary);">${escapeHtml(emp.telephone_personnel)}</a>` : 'N/A'}</td>
                                    <td>${emp.email_personnel ? `<a href="mailto:${emp.email_personnel}" style="color:var(--primary); font-size:0.8rem;">${escapeHtml(emp.email_personnel)}</a>` : 'N/A'}</td>
                                    <td>${emp.est_actif ? '<span class="badge badge-success">Oui</span>' : '<span class="badge badge-danger">Non</span>'}</td>
                                    <td>
                                        <div class="item-actions">
                                            <button class="btn btn-sm btn-outline" onclick="voirDetailRHEmploye(${emp.id})" title="Détail">👁️</button>
                                            <button class="btn btn-sm btn-outline" onclick="editerRHEmploye(${emp.id})" title="Modifier">✏️</button>
                                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/rh/employes/${emp.id}/', 'rh')" title="Supprimer">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="responsive-mobile-view">
                ${filtered.map(emp => `
                    <div class="responsive-card">
                        <div class="responsive-card-header">
                            <div>
                                <strong>${escapeHtml(emp.nom_complet_affiche || emp.nom_complet || 'N/A')}</strong>
                                <br><small style="color:var(--text-light);">${escapeHtml(emp.matricule)} | ${escapeHtml(emp.poste || 'N/A')}</small>
                            </div>
                            ${emp.est_actif ? '<span class="badge badge-success">Actif</span>' : '<span class="badge badge-danger">Inactif</span>'}
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row"><span class="responsive-card-label">🏢 Département</span><span>${escapeHtml(emp.departement_nom || 'N/A')}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">🎂 Âge</span><span>${emp.age !== null && emp.age !== undefined ? emp.age + ' ans' : 'N/A'}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📞 Téléphone</span><span>${emp.telephone_personnel ? `<a href="tel:${emp.telephone_personnel}" style="color:var(--primary);">${escapeHtml(emp.telephone_personnel)}</a>` : 'N/A'}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📧 Email</span><span>${emp.email_personnel ? `<a href="mailto:${emp.email_personnel}" style="color:var(--primary);">${escapeHtml(emp.email_personnel)}</a>` : 'N/A'}</span></div>
                        </div>
                        <div class="responsive-card-footer">
                            <button class="btn btn-sm btn-outline" onclick="voirDetailRHEmploye(${emp.id})">👁️ Détail</button>
                            <button class="btn btn-sm btn-outline" onclick="editerRHEmploye(${emp.id})">✏️ Modifier</button>
                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/rh/employes/${emp.id}/', 'rh')">🗑️</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}



// ========================================
// TAB :VOIR DETAILS EMPLOYÉS
// ========================================


async function voirDetailRHEmploye(id) {
    try {
        console.log('Chargement détail employé ID:', id);
        const emp = await apiGet(`/api/rh/employes/${id}/`);
        console.log('Données employé reçues:', emp);

        // Fermer tout modal existant
        const existant = document.getElementById('modalCreation');
        if (existant) existant.remove();

        const modal = document.createElement('div');
        modal.id = 'modalCreation';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
        modal.innerHTML = `
            <div style="background:white; border-radius:16px; width:100%; max-width:800px; max-height:90vh; overflow-y:auto;">
                <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="color:var(--primary); display:flex; align-items:center; gap:0.5rem;">
                        👤 ${escapeHtml(emp.nom_complet_affiche || emp.nom_complet || emp.username || 'Employé')}
                        ${emp.est_actif ? '<span class="badge badge-success" style="font-size:0.7rem;">Actif</span>' : '<span class="badge badge-danger" style="font-size:0.7rem;">Inactif</span>'}
                    </h3>
                    <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.5rem; cursor:pointer; color:var(--text-light);">✕</button>
                </div>
                <div style="padding:1.5rem;">

                    <!-- Identité -->
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">🪪 Identité</div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.3rem;">
                            <div class="detail-row"><span class="detail-label">Matricule</span><span class="detail-value"><strong>${escapeHtml(emp.matricule || 'N/A')}</strong></span></div>
                            <div class="detail-row"><span class="detail-label">Nom complet</span><span class="detail-value">${escapeHtml(emp.nom_complet_affiche || emp.nom_complet || emp.username || 'N/A')}</span></div>
                            <div class="detail-row"><span class="detail-label">Genre</span><span class="detail-value">${escapeHtml(emp.genre_display || emp.genre || 'N/A')}</span></div>
                            <div class="detail-row"><span class="detail-label">Date naissance</span><span class="detail-value">${emp.date_naissance ? formatDate(emp.date_naissance) : 'N/A'}</span></div>
                            <div class="detail-row"><span class="detail-label">Âge</span><span class="detail-value">${emp.age !== null && emp.age !== undefined ? '<span class="badge badge-info">' + emp.age + ' ans</span>' : 'N/A'}</span></div>
                            <div class="detail-row"><span class="detail-label">Lieu naissance</span><span class="detail-value">${escapeHtml(emp.lieu_naissance || 'N/A')}</span></div>
                            <div class="detail-row"><span class="detail-label">Nationalité</span><span class="detail-value">${escapeHtml(emp.nationalite || 'N/A')}</span></div>
                            <div class="detail-row"><span class="detail-label">Statut marital</span><span class="detail-value">${escapeHtml(emp.statut_marital_display || 'N/A')}</span></div>
                            <div class="detail-row"><span class="detail-label">Niveau d'étude</span><span class="detail-value">${escapeHtml(emp.niveau_etude_display || 'N/A')}</span></div>
                        </div>
                    </div>

                    <!-- Contact -->
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">📞 Contact</div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.3rem;">
                            <div class="detail-row"><span class="detail-label">Email personnel</span><span class="detail-value">${emp.email_personnel ? '<a href="mailto:' + emp.email_personnel + '" style="color:var(--primary);">' + escapeHtml(emp.email_personnel) + '</a>' : 'N/A'}</span></div>
                            <div class="detail-row"><span class="detail-label">Email professionnel</span><span class="detail-value">${emp.email_compte ? '<a href="mailto:' + emp.email_compte + '" style="color:var(--primary);">' + escapeHtml(emp.email_compte) + '</a>' : 'N/A'}</span></div>
                            <div class="detail-row"><span class="detail-label">Téléphone</span><span class="detail-value">${emp.telephone_personnel ? '<a href="tel:' + emp.telephone_personnel + '" style="color:var(--primary);">' + escapeHtml(emp.telephone_personnel) + '</a>' : 'N/A'}</span></div>
                            <div class="detail-row"><span class="detail-label">Ville</span><span class="detail-value">${escapeHtml(emp.ville || 'N/A')}</span></div>
                            <div class="detail-row"><span class="detail-label">Pays</span><span class="detail-value">${escapeHtml(emp.pays_residence || 'N/A')}</span></div>
                        </div>
                        <div class="detail-row"><span class="detail-label">Adresse</span><span class="detail-value">${escapeHtml(emp.adresse || 'N/A')}</span></div>
                    </div>

                    <!-- Professionnel -->
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">💼 Informations professionnelles</div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.3rem;">
                            <div class="detail-row"><span class="detail-label">Poste</span><span class="detail-value"><strong>${escapeHtml(emp.poste || 'N/A')}</strong></span></div>
                            <div class="detail-row"><span class="detail-label">Département</span><span class="detail-value">${escapeHtml(emp.departement_nom || 'N/A')}</span></div>
                            <div class="detail-row"><span class="detail-label">Rôle système</span><span class="detail-value"><span class="badge badge-info">${escapeHtml(emp.role_display || emp.role || 'N/A')}</span></span></div>
                            <div class="detail-row"><span class="detail-label">Type contrat</span><span class="detail-value"><span class="badge badge-info">${escapeHtml(emp.type_contrat_display || emp.type_contrat || 'N/A')}</span></span></div>
                            <div class="detail-row"><span class="detail-label">Date embauche</span><span class="detail-value">${emp.date_embauche ? formatDate(emp.date_embauche) : 'N/A'}</span></div>
                            <div class="detail-row"><span class="detail-label">Fin contrat</span><span class="detail-value">${emp.date_fin_contrat ? formatDate(emp.date_fin_contrat) : 'Indéterminé (CDI)'}</span></div>
                            <div class="detail-row"><span class="detail-label">Salaire base</span><span class="detail-value" style="font-weight:700; color:var(--primary); font-size:1.1rem;">${formatMoney(emp.salaire_base || 0)}</span></div>
                        </div>
                    </div>

                    <!-- Contact urgence -->
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">🚨 Contact d'urgence</div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.3rem;">
                            <div class="detail-row"><span class="detail-label">Nom</span><span class="detail-value">${escapeHtml(emp.contact_urgence_nom || 'N/A')}</span></div>
                            <div class="detail-row"><span class="detail-label">Téléphone</span><span class="detail-value">${emp.contact_urgence_telephone ? '<a href="tel:' + emp.contact_urgence_telephone + '" style="color:var(--primary);">' + escapeHtml(emp.contact_urgence_telephone) + '</a>' : 'N/A'}</span></div>
                        </div>
                    </div>

                    <!-- Documents -->
                    ${emp.cv || emp.photo_url ? `
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">📄 Documents</div>
                        <div style="display:flex; gap:1rem; flex-wrap:wrap;">
                            ${emp.photo_url ? `<div><strong>Photo :</strong><br><img src="${emp.photo_url}" style="max-width:120px; border-radius:10px; margin-top:0.5rem;"></div>` : ''}
                            ${emp.cv ? `<div><strong>CV :</strong><br><a href="${emp.cv}" target="_blank" class="btn btn-sm btn-outline" style="margin-top:0.5rem;">📄 Télécharger le CV</a></div>` : ''}
                        </div>
                    </div>
                    ` : ''}

                    <!-- Actions -->
                    <div class="form-actions" style="margin-top:1.5rem;">
                        <button class="btn btn-outline" onclick="this.closest('#modalCreation').remove(); editerRHEmploye(${emp.id})">✏️ Modifier</button>
                        <button class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Fermer</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    } catch (error) {
        console.error('Erreur détail employé:', error);
        alert(`Erreur lors du chargement du détail : ${error.message}`);
    }
}





// ========================================
// TAB : DÉPARTEMENTS
// ========================================
function renderRHDepartements(depList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">🏢 Départements</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireRHDepartement()">+ Nouveau département</button>
        </div>

        ${depList.length === 0 ? `
            <div class="empty-state"><div class="empty-state-icon">🏢</div><h3>Aucun département</h3></div>
        ` : `
            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Description</th>
                                <th>Responsable</th>
                                <th>Nb employés</th>
                                <th>Actif</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${depList.map(d => `
                                <tr>
                                    <td><strong>${escapeHtml(d.nom)}</strong></td>
                                    <td><small>${escapeHtml((d.description || '').substring(0, 60))}</small></td>
                                    <td>${escapeHtml(d.responsable_nom || 'N/A')}</td>
                                    <td><span class="badge badge-info">${d.nombre_employes || 0}</span></td>
                                    <td>${d.est_actif ? '<span class="badge badge-success">Oui</span>' : '<span class="badge badge-danger">Non</span>'}</td>
                                    <td>
                                        <div class="item-actions">
                                            <button class="btn btn-sm btn-outline" onclick="editerRHDepartement(${d.id})" title="Modifier">✏️</button>
                                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/rh/departements/${d.id}/', 'rh')" title="Supprimer">🗑️</button>
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
                            <div><strong>${escapeHtml(d.nom)}</strong></div>
                            ${d.est_actif ? '<span class="badge badge-success">Actif</span>' : '<span class="badge badge-danger">Inactif</span>'}
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row"><span class="responsive-card-label">📝 Description</span><span><small>${escapeHtml((d.description || 'N/A').substring(0, 80))}</small></span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">👤 Responsable</span><span>${escapeHtml(d.responsable_nom || 'N/A')}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">👥 Employés</span><span class="badge badge-info">${d.nombre_employes || 0}</span></div>
                        </div>
                        <div class="responsive-card-footer">
                            <button class="btn btn-sm btn-outline" onclick="editerRHDepartement(${d.id})">✏️ Modifier</button>
                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/rh/departements/${d.id}/', 'rh')">🗑️</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}


// ========================================
// TAB : CONGÉS
// ========================================
function renderRHConges(conList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">📅 Demandes de Congés</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireRHConge()">+ Nouvelle demande</button>
            <button class="btn-export" onclick="exporterOngletActifExcel('Conges')">📊 Excel</button>
        </div>

        ${conList.length === 0 ? `
            <div class="empty-state"><div class="empty-state-icon">📅</div><h3>Aucune demande de congé</h3></div>
        ` : `
            <p class="scroll-hint">👆 Faites défiler horizontalement →</p>
            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead>
                            <tr>
                                <th>Employé</th>
                                <th>Type</th>
                                <th>Du</th>
                                <th>Au</th>
                                <th>Jours</th>
                                <th>Motif</th>
                                <th>Statut</th>
                                <th>Approuvé par</th>
                                <th>Date demande</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${conList.map(c => `
                                <tr>
                                    <td><strong>${escapeHtml(c.employe_nom || 'N/A')}</strong></td>
                                    <td><span class="badge badge-info">${escapeHtml(c.type_display || c.type_conge)}</span></td>
                                    <td><small>${formatDate(c.date_debut)}</small></td>
                                    <td><small>${formatDate(c.date_fin)}</small></td>
                                    <td><strong>${c.nombre_jours}j</strong></td>
                                    <td><small>${escapeHtml((c.motif || '').substring(0, 40))}</small></td>
                                    <td><span class="badge ${getBadgeClass(c.statut)}">${escapeHtml(c.statut_display || c.statut)}</span></td>
                                    <td><small>${escapeHtml(c.approuve_par_nom || 'N/A')}</small></td>
                                    <td><small>${formatDate(c.date_demande)}</small></td>
                                    <td>
                                        <div class="item-actions">
                                            ${c.statut === 'EN_ATTENTE' ? `
                                                <button class="btn btn-sm btn-success" onclick="actionRHConge(${c.id}, 'approuver')" title="Approuver">✅</button>
                                                <button class="btn btn-sm btn-danger" onclick="actionRHConge(${c.id}, 'refuser')" title="Refuser">❌</button>
                                                <button class="btn btn-sm btn-outline" onclick="editerRHConge(${c.id})" title="Modifier">✏️</button>
                                            ` : ''}
                                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/rh/conges/${c.id}/', 'rh')" title="Supprimer">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="responsive-mobile-view">
                ${conList.map(c => `
                    <div class="responsive-card">
                        <div class="responsive-card-header">
                            <div>
                                <strong>${escapeHtml(c.employe_nom || 'N/A')}</strong>
                                <br><small>${escapeHtml(c.type_display || c.type_conge)}</small>
                            </div>
                            <span class="badge ${getBadgeClass(c.statut)}">${escapeHtml(c.statut_display || c.statut)}</span>
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row"><span class="responsive-card-label">📅 Du</span><span>${formatDate(c.date_debut)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📅 Au</span><span>${formatDate(c.date_fin)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">⏱️ Durée</span><span><strong>${c.nombre_jours} jour(s)</strong></span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📝 Motif</span><span><small>${escapeHtml((c.motif || 'N/A').substring(0, 80))}</small></span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">👤 Approuvé par</span><span>${escapeHtml(c.approuve_par_nom || 'N/A')}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📅 Demandé le</span><span>${formatDate(c.date_demande)}</span></div>
                            ${c.commentaire_decision ? `<div class="responsive-card-row"><span class="responsive-card-label">💬 Commentaire</span><span><small>${escapeHtml(c.commentaire_decision)}</small></span></div>` : ''}
                        </div>
                        <div class="responsive-card-footer">
                            <div class="responsive-card-footer">
                                ${c.statut === 'EN_ATTENTE' ? `
                                    <button class="btn btn-sm btn-success" onclick="actionRHConge(${c.id}, 'approuver')">✅ Approuver</button>
                                    <button class="btn btn-sm btn-danger" onclick="actionRHConge(${c.id}, 'refuser')">❌ Refuser</button>
                                    <button class="btn btn-sm btn-outline" onclick="editerRHConge(${c.id})">✏️ Modifier</button>
                                ` : ''}
                                <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/rh/conges/${c.id}/', 'rh')">🗑️</button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}


// ========================================
// TAB : PRÉSENCES
// ========================================
function renderRHPresences(presList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">⏰ Présences</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireRHPresence()">+ Enregistrer une présence</button>
            <button class="btn-export" onclick="exporterOngletActifExcel('Presences')">📊 Excel</button>
        </div>

        ${presList.length === 0 ? `
            <div class="empty-state"><div class="empty-state-icon">⏰</div><h3>Aucune présence enregistrée</h3></div>
        ` : `
            <p class="scroll-hint">👆 Faites défiler horizontalement →</p>
            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead>
                            <tr>
                                <th>Employé</th>
                                <th>Date</th>
                                <th>Arrivée</th>
                                <th>Départ</th>
                                <th>Statut</th>
                                <th>Commentaire</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${presList.map(p => `
                                <tr>
                                    <td><strong>${escapeHtml(p.employe_nom || 'N/A')}</strong></td>
                                    <td>${formatDate(p.date)}</td>
                                    <td>${escapeHtml(p.heure_arrivee || 'N/A')}</td>
                                    <td>${escapeHtml(p.heure_depart || 'N/A')}</td>
                                    <td><span class="badge ${getBadgeClass(p.statut)}">${escapeHtml(p.statut_display || p.statut)}</span></td>
                                    <td><small>${escapeHtml((p.commentaire || '').substring(0, 40))}</small></td>
                                    <td>
                                        <div class="item-actions">
                                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/rh/presences/${p.id}/', 'rh')">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="responsive-mobile-view">
                ${presList.map(p => `
                    <div class="responsive-card">
                        <div class="responsive-card-header">
                            <div>
                                <strong>${escapeHtml(p.employe_nom || 'N/A')}</strong>
                                <br><small>${formatDate(p.date)}</small>
                            </div>
                            <span class="badge ${getBadgeClass(p.statut)}">${escapeHtml(p.statut_display || p.statut)}</span>
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row"><span class="responsive-card-label">🕐 Arrivée</span><span>${escapeHtml(p.heure_arrivee || 'N/A')}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">🕕 Départ</span><span>${escapeHtml(p.heure_depart || 'N/A')}</span></div>
                            ${p.commentaire ? `<div class="responsive-card-row"><span class="responsive-card-label">💬 Note</span><span><small>${escapeHtml(p.commentaire)}</small></span></div>` : ''}
                        </div>
                        <div class="responsive-card-footer">
                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/rh/presences/${p.id}/', 'rh')">🗑️</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}


// ========================================
// TAB : FICHES DE PAIE
// ========================================
function renderRHPaie(paieList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">💰 Fiches de Paie</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireRHPaie()">+ Nouvelle fiche de paie</button>
            <button class="btn-export" onclick="exporterOngletActifExcel('Fiches_Paie')">📊 Excel</button>
        </div>

        ${paieList.length === 0 ? `
            <div class="empty-state"><div class="empty-state-icon">💰</div><h3>Aucune fiche de paie</h3></div>
        ` : `
            <p class="scroll-hint">👆 Faites défiler horizontalement →</p>
            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead>
                            <tr>
                                <th>Référence</th>
                                <th>Employé</th>
                                <th>Mois</th>
                                <th>Année</th>
                                <th>Salaire brut</th>
                                <th>Salaire net</th>
                                <th>Statut</th>
                                <th>Payée le</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${paieList.map(p => `
                                <tr>
                                    <td><strong>${escapeHtml(p.reference)}</strong></td>
                                    <td>${escapeHtml(p.employe_nom || 'N/A')}</td>
                                    <td>${escapeHtml(p.mois_display || p.mois)}</td>
                                    <td>${p.annee}</td>
                                    <td>${formatMoney(p.salaire_brut)}</td>
                                    <td style="font-weight:700; color:var(--primary);">${formatMoney(p.salaire_net)}</td>
                                    <td><span class="badge ${getBadgeClass(p.statut)}">${escapeHtml(p.statut_display || p.statut)}</span></td>
                                    <td><small>${formatDate(p.payee_le)}</small></td>
                                    <td>
                                        <div class="item-actions">
                                            <button class="btn btn-sm btn-outline" onclick="voirDetailRHPaie(${p.id})" title="Détail">👁️</button>
                                            ${p.statut === 'BROUILLON' ? `<button class="btn btn-sm btn-success" onclick="validerRHPaie(${p.id})" title="Valider">✅</button>` : ''}
                                            ${p.statut === 'VALIDEE' ? `<button class="btn btn-sm btn-primary" onclick="payerRHPaie(${p.id})" title="Payer">💳</button>` : ''}
                                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/rh/fiches-paie/${p.id}/', 'rh')">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="responsive-mobile-view">
                ${paieList.map(p => `
                    <div class="responsive-card">
                        <div class="responsive-card-header">
                            <div>
                                <strong>${escapeHtml(p.reference)}</strong>
                                <br><small>${escapeHtml(p.employe_nom || 'N/A')}</small>
                            </div>
                            <span class="badge ${getBadgeClass(p.statut)}">${escapeHtml(p.statut_display || p.statut)}</span>
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row"><span class="responsive-card-label">📅 Période</span><span>${escapeHtml(p.mois_display || p.mois)} ${p.annee}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">💰 Brut</span><span>${formatMoney(p.salaire_brut)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">💵 Net</span><span style="font-weight:700; color:var(--primary);">${formatMoney(p.salaire_net)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📅 Payée le</span><span>${formatDate(p.payee_le) || 'Non payée'}</span></div>
                        </div>
                        <div class="responsive-card-footer">
                            <button class="btn btn-sm btn-outline" onclick="voirDetailRHPaie(${p.id})">👁️ Détail</button>
                            ${p.statut === 'BROUILLON' ? `<button class="btn btn-sm btn-success" onclick="validerRHPaie(${p.id})">✅ Valider</button>` : ''}
                            ${p.statut === 'VALIDEE' ? `<button class="btn btn-sm btn-primary" onclick="payerRHPaie(${p.id})">💳 Payer</button>` : ''}
                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/rh/fiches-paie/${p.id}/', 'rh')">🗑️</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}


// ========================================
// DÉTAIL EMPLOYÉ
// ========================================
function renderRHEmployes(empList) {
    const searchValue = getSearchValue('rh');
    let filtered = empList;
    if (searchValue) {
        filtered = filterLocally(filtered, searchValue, [
            'matricule', 'nom_complet_affiche', 'nom_complet', 'poste',
            'departement_nom', 'telephone_personnel', 'email_personnel'
        ]);
    }

    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">👥 Employés</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireRHEmploye()">+ Nouvel employé</button>
            <button class="btn-export" onclick="exporterOngletActifExcel('Employes')">📊 Excel</button>
        </div>
        ${renderSearchBar({ placeholder: 'Rechercher un employé...', moduleRedirect: 'rh' })}

        ${filtered.length === 0 ? `
            <div class="empty-state"><div class="empty-state-icon">👥</div><h3>Aucun employé</h3></div>
        ` : `
            <p class="scroll-hint">👆 Faites défiler horizontalement →</p>
            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead>
                            <tr>
                                <th>Matricule</th>
                                <th>Nom complet</th>
                                <th>Poste</th>
                                <th>Département</th>
                                <th>Âge</th>
                                <th>Téléphone</th>
                                <th>Email</th>
                                <th>Actif</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filtered.map(emp => `
                                <tr>
                                    <td><strong>${escapeHtml(emp.matricule)}</strong></td>
                                    <td>${escapeHtml(emp.nom_complet_affiche || emp.nom_complet || 'N/A')}</td>
                                    <td>${escapeHtml(emp.poste || 'N/A')}</td>
                                    <td>${escapeHtml(emp.departement_nom || 'N/A')}</td>
                                    <td>${emp.age !== null && emp.age !== undefined ? `<span class="badge badge-info">${emp.age} ans</span>` : 'N/A'}</td>
                                    <td>${emp.telephone_personnel ? `<a href="tel:${emp.telephone_personnel}" style="color:var(--primary);">${escapeHtml(emp.telephone_personnel)}</a>` : 'N/A'}</td>
                                    <td>${emp.email_personnel ? `<a href="mailto:${emp.email_personnel}" style="color:var(--primary); font-size:0.8rem;">${escapeHtml(emp.email_personnel)}</a>` : 'N/A'}</td>
                                    <td>${emp.est_actif ? '<span class="badge badge-success">Oui</span>' : '<span class="badge badge-danger">Non</span>'}</td>
                                    <td>
                                        <div class="item-actions">
                                            <button class="btn btn-sm btn-outline" onclick="voirDetailRHEmploye(${emp.id})" title="Détail">👁️</button>
                                            <button class="btn btn-sm btn-outline" onclick="editerRHEmploye(${emp.id})" title="Modifier">✏️</button>
                                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/rh/employes/${emp.id}/', 'rh')" title="Supprimer">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="responsive-mobile-view">
                ${filtered.map(emp => `
                    <div class="responsive-card">
                        <div class="responsive-card-header">
                            <div>
                                <strong>${escapeHtml(emp.nom_complet_affiche || emp.nom_complet || 'N/A')}</strong>
                                <br><small style="color:var(--text-light);">${escapeHtml(emp.matricule)} | ${escapeHtml(emp.poste || 'N/A')}</small>
                            </div>
                            ${emp.est_actif ? '<span class="badge badge-success">Actif</span>' : '<span class="badge badge-danger">Inactif</span>'}
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row"><span class="responsive-card-label">🏢 Département</span><span>${escapeHtml(emp.departement_nom || 'N/A')}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">🎂 Âge</span><span>${emp.age !== null && emp.age !== undefined ? emp.age + ' ans' : 'N/A'}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📞 Téléphone</span><span>${emp.telephone_personnel ? `<a href="tel:${emp.telephone_personnel}" style="color:var(--primary);">${escapeHtml(emp.telephone_personnel)}</a>` : 'N/A'}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📧 Email</span><span>${emp.email_personnel ? `<a href="mailto:${emp.email_personnel}" style="color:var(--primary);">${escapeHtml(emp.email_personnel)}</a>` : 'N/A'}</span></div>
                        </div>
                        <div class="responsive-card-footer">
                            <button class="btn btn-sm btn-outline" onclick="voirDetailRHEmploye(${emp.id})">👁️ Détail</button>
                            <button class="btn btn-sm btn-outline" onclick="editerRHEmploye(${emp.id})">✏️ Modifier</button>
                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/rh/employes/${emp.id}/', 'rh')">🗑️</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}


// ========================================
// DÉTAIL FICHE DE PAIE
// ========================================
async function voirDetailRHPaie(id) {
    try {
        const p = await apiGet(`/api/rh/fiches-paie/${id}/`);
        const modal = document.createElement('div');
        modal.id = 'modalCreation';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
        modal.innerHTML = `
            <div style="background:white; border-radius:16px; width:100%; max-width:650px; max-height:90vh; overflow-y:auto;">
                <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                    <h3 style="color:var(--primary);">💰 Fiche de paie ${escapeHtml(p.reference)}</h3>
                    <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
                    <button class="btn btn-primary" onclick="this.closest('#modalCreation').remove(); choisirModeleBulletin(${p.id})">📄 Télécharger PDF</button>
                </div>
                <div style="padding:1.5rem;">
                    <div class="detail-row"><span class="detail-label">Employé</span><span class="detail-value"><strong>${escapeHtml(p.employe_nom || 'N/A')}</strong></span></div>
                    <div class="detail-row"><span class="detail-label">Période</span><span class="detail-value">${escapeHtml(p.mois_display || p.mois)} ${p.annee}</span></div>
                    <div class="detail-row"><span class="detail-label">Statut</span><span class="detail-value"><span class="badge ${getBadgeClass(p.statut)}">${escapeHtml(p.statut_display || p.statut)}</span></span></div>
                    <div class="detail-fieldset" style="margin-top:1rem;">
                        <div class="detail-fieldset-title">📈 Rémunération</div>
                        <div class="detail-row"><span class="detail-label">Salaire brut</span><span class="detail-value">${formatMoney(p.salaire_brut)}</span></div>
                        <div class="detail-row"><span class="detail-label">Prime transport</span><span class="detail-value">${formatMoney(p.prime_transport)}</span></div>
                        <div class="detail-row"><span class="detail-label">Prime logement</span><span class="detail-value">${formatMoney(p.prime_logement)}</span></div>
                        <div class="detail-row"><span class="detail-label">Prime risque</span><span class="detail-value">${formatMoney(p.prime_risque)}</span></div>
                        <div class="detail-row"><span class="detail-label">Autres primes</span><span class="detail-value">${formatMoney(p.autres_primes)}</span></div>
                        <div class="detail-row"><span class="detail-label">Heures sup.</span><span class="detail-value">${formatMoney(p.heures_supplementaires)}</span></div>
                    </div>
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">📉 Déductions</div>
                        <div class="detail-row"><span class="detail-label">CNPS</span><span class="detail-value" style="color:var(--danger);">- ${formatMoney(p.cotisation_cnps)}</span></div>
                        <div class="detail-row"><span class="detail-label">IRPP</span><span class="detail-value" style="color:var(--danger);">- ${formatMoney(p.impot_irpp)}</span></div>
                        <div class="detail-row"><span class="detail-label">Autres déductions</span><span class="detail-value" style="color:var(--danger);">- ${formatMoney(p.autres_deductions)}</span></div>
                    </div>
                    <div class="detail-row" style="border-top:3px solid var(--primary); padding-top:1rem; margin-top:1rem;">
                        <span class="detail-label" style="font-size:1.1rem; font-weight:800;">💵 SALAIRE NET</span>
                        <span class="detail-value" style="font-size:1.3rem; font-weight:800; color:var(--primary);">${formatMoney(p.salaire_net)}</span>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    } catch (error) { alert(`Erreur : ${error.message}`); }
}


// ========================================
// FORMULAIRE DÉPARTEMENT
// ========================================
async function ouvrirFormulaireRHDepartement(editData = null) {
    const existant = document.getElementById('modalCreation');
    if (existant) existant.remove();

    const titre = editData ? `Modifier : ${editData.nom}` : 'Nouveau département';
    const endpoint = editData ? `/api/rh/departements/${editData.id}/` : '/api/rh/departements/';

    const modal = document.createElement('div');
    modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:500px;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">${editData ? '✏️' : '➕'} ${titre}</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="rhDepForm" style="padding:1.5rem;">
                <div class="form-grid">
                    <div class="form-field full-width"><label>Nom <span class="required">*</span></label><input type="text" id="depNom" value="${escapeHtml(editData?.nom || '')}" required></div>
                    <div class="form-field full-width"><label>Description</label><textarea id="depDesc" rows="3">${escapeHtml(editData?.description || '')}</textarea></div>
                </div>
                <div class="form-checkbox">
                    <input type="checkbox" id="depActif" ${editData?.est_actif !== false ? 'checked' : ''}>
                    <label for="depActif">Département actif</label>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 ${editData ? 'Enregistrer' : 'Créer'}</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="rhDepError" style="color:var(--danger); text-align:center; margin-top:0.5rem;"></p>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('rhDepForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const payload = {
                nom: document.getElementById('depNom').value,
                description: document.getElementById('depDesc')?.value || '',
                est_actif: document.getElementById('depActif').checked
            };
            if (editData) { await apiPatch(endpoint, payload); } else { await apiPost(endpoint, payload); }
            modal.remove();
            navigateTo('rh');
        } catch (error) { document.getElementById('rhDepError').textContent = error.message; }
    });
}

async function editerRHDepartement(id) {
    try { const d = await apiGet(`/api/rh/departements/${id}/`); ouvrirFormulaireRHDepartement(d); }
    catch (error) { alert(`Erreur : ${error.message}`); }
}


// ========================================
// FORMULAIRE PRÉSENCE
// ========================================
async function ouvrirFormulaireRHPresence() {
    const existant = document.getElementById('modalCreation');
    if (existant) existant.remove();

    let employes = [];
    try {
        const resp = await apiGet('/api/rh/employes/');
        employes = Array.isArray(resp) ? resp : (resp.results || []);
    } catch (e) {}

    const modal = document.createElement('div');
    modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:550px;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">➕ Enregistrer une présence</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="rhPresForm" style="padding:1.5rem;">
                <div class="form-grid">
                    <div class="form-field full-width"><label>Employé <span class="required">*</span></label>
                        <select id="presEmploye" required>
                            <option value="">Sélectionner...</option>
                            ${employes.map(e => `<option value="${e.id}">${escapeHtml(e.nom_complet || e.matricule)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-field"><label>Date <span class="required">*</span></label><input type="date" id="presDate" value="${new Date().toISOString().split('T')[0]}" required></div>
                    <div class="form-field"><label>Statut <span class="required">*</span></label>
                        <select id="presStatut" required>
                            <option value="PRESENT">Présent</option>
                            <option value="ABSENT">Absent</option>
                            <option value="RETARD">Retard</option>
                            <option value="CONGE">En congé</option>
                            <option value="MISSION">En mission</option>
                            <option value="MALADIE">Maladie</option>
                        </select>
                    </div>
                    <div class="form-field"><label>Heure arrivée</label><input type="time" id="presArrivee" value="08:00"></div>
                    <div class="form-field"><label>Heure départ</label><input type="time" id="presDepart" value="18:00"></div>
                    <div class="form-field full-width"><label>Commentaire</label><textarea id="presCommentaire" rows="2"></textarea></div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 Enregistrer</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="rhPresError" style="color:var(--danger); text-align:center; margin-top:0.5rem;"></p>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('rhPresForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await apiPost('/api/rh/presences/', {
                employe: parseInt(document.getElementById('presEmploye').value),
                date: document.getElementById('presDate').value,
                statut: document.getElementById('presStatut').value,
                heure_arrivee: document.getElementById('presArrivee')?.value || null,
                heure_depart: document.getElementById('presDepart')?.value || null,
                commentaire: document.getElementById('presCommentaire')?.value || ''
            });
            modal.remove();
            navigateTo('rh');
        } catch (error) { document.getElementById('rhPresError').textContent = error.message; }
    });
}


// ========================================
// FORMULAIRE FICHE DE PAIE
// ========================================
async function ouvrirFormulaireRHPaie() {
    const existant = document.getElementById('modalCreation');
    if (existant) existant.remove();

    let employes = [];
    try {
        const resp = await apiGet('/api/rh/employes/');
        employes = Array.isArray(resp) ? resp : (resp.results || []);
    } catch (e) {}

    const moisOptions = [
        {v:1,l:'Janvier'},{v:2,l:'Février'},{v:3,l:'Mars'},{v:4,l:'Avril'},
        {v:5,l:'Mai'},{v:6,l:'Juin'},{v:7,l:'Juillet'},{v:8,l:'Août'},
        {v:9,l:'Septembre'},{v:10,l:'Octobre'},{v:11,l:'Novembre'},{v:12,l:'Décembre'}
    ];

    const modal = document.createElement('div');
    modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:700px; max-height:90vh; overflow-y:auto;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">➕ Nouvelle fiche de paie</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="rhPaieForm" style="padding:1.5rem;">
                <div class="form-section">
                    <div class="form-section-title">👤 Employé & Période</div>
                    <div class="form-grid">
                        <div class="form-field"><label>Employé <span class="required">*</span></label>
                            <select id="paieEmploye" required>
                                <option value="">Sélectionner...</option>
                                ${employes.map(e => `<option value="${e.id}">${escapeHtml(e.nom_complet || e.matricule)}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-field"><label>Mois <span class="required">*</span></label>
                            <select id="paieMois" required>
                                ${moisOptions.map(m => `<option value="${m.v}" ${m.v === new Date().getMonth() + 1 ? 'selected' : ''}>${m.l}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-field"><label>Année <span class="required">*</span></label><input type="number" id="paieAnnee" value="${new Date().getFullYear()}" required></div>
                    </div>
                </div>
                <div class="form-section">
                    <div class="form-section-title">📈 Rémunération</div>
                    <div class="form-grid">
                        <div class="form-field"><label>Salaire brut <span class="required">*</span></label><input type="number" id="paieBrut" step="0.01" required></div>
                        <div class="form-field"><label>Prime transport</label><input type="number" id="paieTransport" step="0.01" value="0"></div>
                        <div class="form-field"><label>Prime logement</label><input type="number" id="paieLogement" step="0.01" value="0"></div>
                        <div class="form-field"><label>Prime risque</label><input type="number" id="paieRisque" step="0.01" value="0"></div>
                        <div class="form-field"><label>Autres primes</label><input type="number" id="paieAutresPrimes" step="0.01" value="0"></div>
                        <div class="form-field"><label>Heures sup.</label><input type="number" id="paieHeuresSup" step="0.01" value="0"></div>
                    </div>
                </div>
                <div class="form-section">
                    <div class="form-section-title">📉 Déductions</div>
                    <div class="form-grid">
                        <div class="form-field"><label>Cotisation CNPS</label><input type="number" id="paieCNPS" step="0.01" value="0"></div>
                        <div class="form-field"><label>Impôt IRPP</label><input type="number" id="paieIRPP" step="0.01" value="0"></div>
                        <div class="form-field"><label>Autres déductions</label><input type="number" id="paieAutresDed" step="0.01" value="0"></div>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 Créer la fiche</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="rhPaieError" style="color:var(--danger); text-align:center; margin-top:0.5rem;"></p>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('rhPaieForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await apiPost('/api/rh/fiches-paie/', {
                employe: parseInt(document.getElementById('paieEmploye').value),
                mois: parseInt(document.getElementById('paieMois').value),
                annee: parseInt(document.getElementById('paieAnnee').value),
                salaire_brut: parseFloat(document.getElementById('paieBrut').value),
                prime_transport: parseFloat(document.getElementById('paieTransport').value) || 0,
                prime_logement: parseFloat(document.getElementById('paieLogement').value) || 0,
                prime_risque: parseFloat(document.getElementById('paieRisque').value) || 0,
                autres_primes: parseFloat(document.getElementById('paieAutresPrimes').value) || 0,
                heures_supplementaires: parseFloat(document.getElementById('paieHeuresSup').value) || 0,
                cotisation_cnps: parseFloat(document.getElementById('paieCNPS').value) || 0,
                impot_irpp: parseFloat(document.getElementById('paieIRPP').value) || 0,
                autres_deductions: parseFloat(document.getElementById('paieAutresDed').value) || 0
            });
            modal.remove();
            navigateTo('rh');
        } catch (error) { document.getElementById('rhPaieError').textContent = error.message; }
    });
}


// ========================================
// ACTIONS
// ========================================
async function actionRHConge(id, action) {
    const commentaire = prompt(`${action === 'approuver' ? 'Commentaire (optionnel)' : 'Motif du refus'} :`);
    if (commentaire === null) return;
    try {
        await apiPost(`/api/rh/conges/${id}/${action}/`, { commentaire });
        navigateTo('rh');
    } catch (error) { alert(`Erreur : ${error.message}`); }
}

async function validerRHPaie(id) {
    if (!confirm('Valider cette fiche de paie ?')) return;
    try {
        await apiPost(`/api/rh/fiches-paie/${id}/valider/`);
        navigateTo('rh');
    } catch (error) { alert(`Erreur : ${error.message}`); }
}

async function payerRHPaie(id) {
    if (!confirm('Marquer cette fiche comme payée ?')) return;
    try {
        await apiPost(`/api/rh/fiches-paie/${id}/marquer_payee/`);
        navigateTo('rh');
    } catch (error) { alert(`Erreur : ${error.message}`); }
}


// ========================================
// FORMULAIRE EMPLOYÉ (Création / Édition)
// ========================================
async function ouvrirFormulaireRHEmploye(editData = null) {
    const existant = document.getElementById('modalCreation');
    if (existant) existant.remove();

        let departements = [];
    let utilisateursDisponibles = [];
    try {
        const respDep = await apiGet('/api/rh/departements/');
        departements = Array.isArray(respDep) ? respDep : (respDep.results || []);
    } catch (e) {}

    if (!editData) {
        try {
            const respUsers = await apiGet('/api/accounts/utilisateurs-disponibles/');
            utilisateursDisponibles = Array.isArray(respUsers) ? respUsers : (respUsers.results || []);
        } catch (e) {
            console.warn('Impossible de charger les utilisateurs disponibles');
        }
    }

    const titre = editData ? `Modifier : ${editData.nom_complet_affiche || editData.nom_complet || editData.matricule}` : 'Nouvel employé';
    const endpoint = editData ? `/api/rh/employes/${editData.id}/` : '/api/rh/employes/';

    const modal = document.createElement('div');
    modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';

    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:800px; max-height:90vh; overflow-y:auto;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">${editData ? '✏️' : '➕'} ${titre}</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="rhEmpForm" style="padding:1.5rem;">
                ${!editData ? `
                <div class="form-section">
                    <div class="form-section-title">🔐 Compte utilisateur</div>
                    <div class="form-grid">
                        <div class="form-field full-width">
                            <label>Compte utilisateur <span class="required">*</span></label>
                            <select id="empUserId" required>
                                <option value="">Sélectionner un utilisateur...</option>
                                ${utilisateursDisponibles.map(u => `
                                    <option value="${u.id}">
                                        ${escapeHtml(u.username)} - ${escapeHtml(u.first_name || '')} ${escapeHtml(u.last_name || '')} (${escapeHtml(u.role_display || u.role || 'N/A')})
                                    </option>
                                `).join('')}
                            </select>
                            <span class="field-help">Seuls les utilisateurs sans profil employé sont affichés. <a href="${API_BASE}/admin/accounts/user/add/" target="_blank" style="color:var(--primary);">Créer un nouveau compte →</a></span>
                        </div>
                    </div>
                </div>
                ` : ''}

                <div class="form-section">
                    <div class="form-section-title">🪪 Identité</div>
                    <div class="form-grid">
                        <div class="form-field">
                            <label>Nom complet</label>
                            <input type="text" id="empNomComplet" value="${escapeHtml(editData?.nom_complet || '')}" placeholder="Nom et prénoms complets">
                            <span class="field-help">Si vide, le nom du compte utilisateur sera utilisé</span>
                        </div>
                        <div class="form-field">
                            <label>Genre <span class="required">*</span></label>
                            <select id="empGenre" required>
                                <option value="M" ${editData?.genre === 'M' ? 'selected' : ''}>Masculin</option>
                                <option value="F" ${editData?.genre === 'F' ? 'selected' : ''}>Féminin</option>
                                <option value="A" ${editData?.genre === 'A' ? 'selected' : ''}>Autre</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Date de naissance</label>
                            <input type="date" id="empDateNaissance" value="${editData?.date_naissance || ''}">
                        </div>
                        <div class="form-field">
                            <label>Lieu de naissance</label>
                            <input type="text" id="empLieuNaissance" value="${escapeHtml(editData?.lieu_naissance || '')}">
                        </div>
                        <div class="form-field">
                            <label>Nationalité</label>
                            <input type="text" id="empNationalite" value="${escapeHtml(editData?.nationalite || 'Camerounaise')}">
                        </div>
                        <div class="form-field">
                            <label>Statut marital</label>
                            <select id="empStatutMarital">
                                <option value="">Non renseigné</option>
                                <option value="CELIBATAIRE" ${editData?.statut_marital === 'CELIBATAIRE' ? 'selected' : ''}>Célibataire</option>
                                <option value="MARIE" ${editData?.statut_marital === 'MARIE' ? 'selected' : ''}>Marié(e)</option>
                                <option value="DIVORCE" ${editData?.statut_marital === 'DIVORCE' ? 'selected' : ''}>Divorcé(e)</option>
                                <option value="VEUF" ${editData?.statut_marital === 'VEUF' ? 'selected' : ''}>Veuf/Veuve</option>
                                <option value="UNION_LIBRE" ${editData?.statut_marital === 'UNION_LIBRE' ? 'selected' : ''}>Union libre</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Niveau d'étude</label>
                            <select id="empNiveauEtude">
                                <option value="">Non renseigné</option>
                                <option value="SANS_DIPLOME" ${editData?.niveau_etude === 'SANS_DIPLOME' ? 'selected' : ''}>Sans diplôme</option>
                                <option value="CEP" ${editData?.niveau_etude === 'CEP' ? 'selected' : ''}>CEP / FSLC</option>
                                <option value="BEPC" ${editData?.niveau_etude === 'BEPC' ? 'selected' : ''}>BEPC / GCE O-Level</option>
                                <option value="PROBATOIRE" ${editData?.niveau_etude === 'PROBATOIRE' ? 'selected' : ''}>Probatoire</option>
                                <option value="BAC" ${editData?.niveau_etude === 'BAC' ? 'selected' : ''}>Baccalauréat / GCE A-Level</option>
                                <option value="BTS" ${editData?.niveau_etude === 'BTS' ? 'selected' : ''}>BTS / HND</option>
                                <option value="LICENCE" ${editData?.niveau_etude === 'LICENCE' ? 'selected' : ''}>Licence / Bachelor</option>
                                <option value="MASTER" ${editData?.niveau_etude === 'MASTER' ? 'selected' : ''}>Master</option>
                                <option value="DOCTORAT" ${editData?.niveau_etude === 'DOCTORAT' ? 'selected' : ''}>Doctorat / PhD</option>
                                <option value="AUTRE" ${editData?.niveau_etude === 'AUTRE' ? 'selected' : ''}>Autre</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <div class="form-section-title">💼 Professionnel</div>
                    <div class="form-grid">
                        <div class="form-field">
                            <label>Poste <span class="required">*</span></label>
                            <input type="text" id="empPoste" value="${escapeHtml(editData?.poste || '')}" required>
                        </div>
                        <div class="form-field">
                            <label>Département</label>
                            <select id="empDepartement">
                                <option value="">Sans département</option>
                                ${departements.map(d => `<option value="${d.id}" ${editData?.departement === d.id ? 'selected' : ''}>${escapeHtml(d.nom)}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Type contrat <span class="required">*</span></label>
                            <select id="empTypeContrat" required>
                                <option value="CDI" ${editData?.type_contrat === 'CDI' ? 'selected' : ''}>CDI</option>
                                <option value="CDD" ${editData?.type_contrat === 'CDD' ? 'selected' : ''}>CDD</option>
                                <option value="STAGE" ${editData?.type_contrat === 'STAGE' ? 'selected' : ''}>Stage</option>
                                <option value="FREELANCE" ${editData?.type_contrat === 'FREELANCE' ? 'selected' : ''}>Freelance</option>
                                <option value="INTERIM" ${editData?.type_contrat === 'INTERIM' ? 'selected' : ''}>Intérimaire</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Date embauche <span class="required">*</span></label>
                            <input type="date" id="empDateEmbauche" value="${editData?.date_embauche || new Date().toISOString().split('T')[0]}" required>
                        </div>
                        <div class="form-field">
                            <label>Date fin contrat</label>
                            <input type="date" id="empDateFinContrat" value="${editData?.date_fin_contrat || ''}">
                        </div>
                        <div class="form-field">
                            <label>Salaire base (FCFA) <span class="required">*</span></label>
                            <input type="number" id="empSalaire" step="0.01" value="${editData?.salaire_base || 0}" required>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <div class="form-section-title">📞 Contact</div>
                    <div class="form-grid">
                        <div class="form-field">
                            <label>Email personnel</label>
                            <input type="email" id="empEmailPerso" value="${escapeHtml(editData?.email_personnel || '')}">
                        </div>
                        <div class="form-field">
                            <label>Téléphone</label>
                            <input type="text" id="empTelephone" value="${escapeHtml(editData?.telephone_personnel || '')}">
                        </div>
                        <div class="form-field">
                            <label>Ville</label>
                            <input type="text" id="empVille" value="${escapeHtml(editData?.ville || '')}">
                        </div>
                        <div class="form-field">
                            <label>Pays</label>
                            <input type="text" id="empPaysResidence" value="${escapeHtml(editData?.pays_residence || 'Cameroun')}">
                        </div>
                        <div class="form-field full-width">
                            <label>Adresse</label>
                            <textarea id="empAdresse" rows="2">${escapeHtml(editData?.adresse || '')}</textarea>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <div class="form-section-title">🚨 Contact d'urgence</div>
                    <div class="form-grid">
                        <div class="form-field">
                            <label>Nom</label>
                            <input type="text" id="empUrgenceNom" value="${escapeHtml(editData?.contact_urgence_nom || '')}">
                        </div>
                        <div class="form-field">
                            <label>Téléphone</label>
                            <input type="text" id="empUrgenceTel" value="${escapeHtml(editData?.contact_urgence_telephone || '')}">
                        </div>
                    </div>
                </div>

                <div class="form-checkbox">
                    <input type="checkbox" id="empActif" ${editData?.est_actif !== false ? 'checked' : ''}>
                    <label for="empActif">Employé actif</label>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 ${editData ? 'Enregistrer' : 'Créer l\'employé'}</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="rhEmpError" style="color:var(--danger); text-align:center; margin-top:0.5rem;"></p>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

        document.getElementById('rhEmpForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = document.getElementById('rhEmpError');
        errorEl.textContent = '';
        errorEl.style.whiteSpace = 'pre-wrap';

        try {
            const payload = {};

            // User ID seulement à la création
            if (!editData) {
                const userId = document.getElementById('empUserId')?.value;
                if (!userId) {
                    errorEl.textContent = 'L\'ID utilisateur est requis.';
                    return;
                }
                payload.user = parseInt(userId);
            }

            // Champs obligatoires
            payload.poste = document.getElementById('empPoste').value;
            payload.type_contrat = document.getElementById('empTypeContrat').value;
            payload.date_embauche = document.getElementById('empDateEmbauche').value;
            payload.genre = document.getElementById('empGenre').value;
            payload.salaire_base = parseFloat(document.getElementById('empSalaire').value) || 0;
            payload.est_actif = document.getElementById('empActif').checked;

            // Champs optionnels texte (envoyer seulement si rempli)
            const optionalText = {
                nom_complet: 'empNomComplet',
                lieu_naissance: 'empLieuNaissance',
                nationalite: 'empNationalite',
                telephone_personnel: 'empTelephone',
                ville: 'empVille',
                pays_residence: 'empPaysResidence',
                adresse: 'empAdresse',
                contact_urgence_nom: 'empUrgenceNom',
                contact_urgence_telephone: 'empUrgenceTel'
            };

            for (const [field, inputId] of Object.entries(optionalText)) {
                const val = document.getElementById(inputId)?.value?.trim();
                if (val) {
                    payload[field] = val;
                }
            }

            // Champs optionnels select (envoyer seulement si sélectionné)
            const statutMarital = document.getElementById('empStatutMarital')?.value;
            if (statutMarital) {
                payload.statut_marital = statutMarital;
            }

            const niveauEtude = document.getElementById('empNiveauEtude')?.value;
            if (niveauEtude) {
                payload.niveau_etude = niveauEtude;
            }

            // Département (FK, envoyer null si vide)
            const depId = document.getElementById('empDepartement')?.value;
            if (depId) {
                payload.departement = parseInt(depId);
            }

            // Dates optionnelles (envoyer seulement si rempli)
            const dateNaissance = document.getElementById('empDateNaissance')?.value;
            if (dateNaissance) {
                payload.date_naissance = dateNaissance;
            }

            const dateFinContrat = document.getElementById('empDateFinContrat')?.value;
            if (dateFinContrat) {
                payload.date_fin_contrat = dateFinContrat;
            }

            // Email personnel (EmailField — ne pas envoyer si vide)
            const emailPerso = document.getElementById('empEmailPerso')?.value?.trim();
            if (emailPerso) {
                payload.email_personnel = emailPerso;
            }

            console.log('Payload employé:', JSON.stringify(payload, null, 2));

            if (editData) {
                await apiPatch(endpoint, payload);
            } else {
                await apiPost(endpoint, payload);
            }

            modal.remove();
            navigateTo('rh');

        } catch (error) {
            console.error('Erreur employé:', error);

            let errorMsg = error.message;
            try {
                const parsed = JSON.parse(errorMsg);
                const messages = [];
                for (const [key, val] of Object.entries(parsed)) {
                    const fieldName = key === 'user' ? 'Utilisateur' :
                                     key === 'non_field_errors' ? 'Erreur' :
                                     key;
                    const msg = Array.isArray(val) ? val.join(', ') : val;
                    messages.push(`${fieldName}: ${msg}`);
                }
                errorMsg = messages.join('\n');
            } catch(e) {}

            errorEl.textContent = errorMsg;
        }
    });
}

async function editerRHEmploye(id) {
    try {
        const emp = await apiGet(`/api/rh/employes/${id}/`);
        ouvrirFormulaireRHEmploye(emp);
    } catch (error) {
        alert(`Erreur : ${error.message}`);
    }
}


// ========================================
// FORMULAIRE CONGÉ (Création / Édition)
// ========================================
async function ouvrirFormulaireRHConge(editData = null) {
    const existant = document.getElementById('modalCreation');
    if (existant) existant.remove();

    let employes = [];
    try {
        const resp = await apiGet('/api/rh/employes/');
        employes = Array.isArray(resp) ? resp : (resp.results || []);
    } catch (e) {}

    const titre = editData ? 'Modifier la demande de congé' : 'Nouvelle demande de congé';
    const endpoint = editData ? `/api/rh/conges/${editData.id}/` : '/api/rh/conges/';

    const modal = document.createElement('div');
    modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';

    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:650px; max-height:90vh; overflow-y:auto;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">${editData ? '✏️' : '➕'} ${titre}</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="rhCongeForm" style="padding:1.5rem;">
                <div class="form-section">
                    <div class="form-section-title">👤 Employé</div>
                    <div class="form-grid">
                        <div class="form-field full-width">
                            <label>Employé <span class="required">*</span></label>
                            <select id="congeEmploye" required ${editData ? 'disabled' : ''}>
                                <option value="">Sélectionner un employé...</option>
                                ${employes.map(e => `<option value="${e.id}" ${editData?.employe === e.id ? 'selected' : ''}>${escapeHtml(e.nom_complet || e.matricule)} - ${escapeHtml(e.poste || '')}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <div class="form-section-title">📅 Détails du congé</div>
                    <div class="form-grid">
                        <div class="form-field">
                            <label>Type de congé <span class="required">*</span></label>
                            <select id="congeType" required>
                                <option value="ANNUEL" ${editData?.type_conge === 'ANNUEL' ? 'selected' : ''}>Congé annuel</option>
                                <option value="MALADIE" ${editData?.type_conge === 'MALADIE' ? 'selected' : ''}>Congé maladie</option>
                                <option value="MATERNITE" ${editData?.type_conge === 'MATERNITE' ? 'selected' : ''}>Congé maternité</option>
                                <option value="PATERNITE" ${editData?.type_conge === 'PATERNITE' ? 'selected' : ''}>Congé paternité</option>
                                <option value="SANS_SOLDE" ${editData?.type_conge === 'SANS_SOLDE' ? 'selected' : ''}>Congé sans solde</option>
                                <option value="EXCEPTIONNEL" ${editData?.type_conge === 'EXCEPTIONNEL' ? 'selected' : ''}>Congé exceptionnel</option>
                                <option value="FORMATION" ${editData?.type_conge === 'FORMATION' ? 'selected' : ''}>Congé de formation</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Nombre de jours <span class="required">*</span></label>
                            <input type="number" id="congeNbJours" min="1" value="${editData?.nombre_jours || 1}" required>
                        </div>
                        <div class="form-field">
                            <label>Date début <span class="required">*</span></label>
                            <input type="date" id="congeDateDebut" value="${editData?.date_debut || ''}" required onchange="calculerDateFinConge()">
                        </div>
                        <div class="form-field">
                            <label>Date fin <span class="required">*</span></label>
                            <input type="date" id="congeDateFin" value="${editData?.date_fin || ''}" required>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <div class="form-section-title">📝 Justification</div>
                    <div class="form-grid">
                        <div class="form-field full-width">
                            <label>Motif <span class="required">*</span></label>
                            <textarea id="congeMotif" rows="3" required placeholder="Décrivez la raison de votre demande de congé...">${escapeHtml(editData?.motif || '')}</textarea>
                        </div>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 ${editData ? 'Enregistrer' : 'Soumettre la demande'}</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="rhCongeError" style="color:var(--danger); text-align:center; margin-top:0.5rem;"></p>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    // Calcul automatique date fin
    document.getElementById('congeNbJours').addEventListener('change', calculerDateFinConge);

    document.getElementById('rhCongeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = document.getElementById('rhCongeError');
        errorEl.textContent = '';

        try {
            const payload = {
                employe: parseInt(document.getElementById('congeEmploye').value),
                type_conge: document.getElementById('congeType').value,
                date_debut: document.getElementById('congeDateDebut').value,
                date_fin: document.getElementById('congeDateFin').value,
                nombre_jours: parseInt(document.getElementById('congeNbJours').value),
                motif: document.getElementById('congeMotif').value
            };

            if (editData) {
                await apiPatch(endpoint, payload);
            } else {
                await apiPost(endpoint, payload);
            }

            modal.remove();
            navigateTo('rh');
        } catch (error) {
            errorEl.textContent = `Erreur : ${error.message}`;
        }
    });
}

function calculerDateFinConge() {
    const dateDebut = document.getElementById('congeDateDebut')?.value;
    const nbJours = parseInt(document.getElementById('congeNbJours')?.value) || 0;

    if (dateDebut && nbJours > 0) {
        const debut = new Date(dateDebut);
        debut.setDate(debut.getDate() + nbJours);
        document.getElementById('congeDateFin').value = debut.toISOString().split('T')[0];
    }
}

async function editerRHConge(id) {
    try {
        const conge = await apiGet(`/api/rh/conges/${id}/`);
        ouvrirFormulaireRHConge(conge);
    } catch (error) {
        alert(`Erreur : ${error.message}`);
    }
}


function telechargerBulletinPDF(id, modele = 'classique') {
    const token = getToken();
    fetch(`${API_BASE}/api/rh/fiches-paie/${id}/pdf/${modele}/`, {
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
        a.download = `Bulletin_${id}_${modele}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    })
    .catch(error => alert(`Erreur : ${error.message}`));
}

function choisirModeleBulletin(id) {
    const existant = document.getElementById('modalCreation');
    if (existant) existant.remove();

    const modal = document.createElement('div');
    modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:400px;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border);">
                <h3 style="color:var(--primary);">📄 Choisir le modèle de bulletin</h3>
            </div>
            <div style="padding:1.5rem; display:flex; flex-direction:column; gap:0.8rem;">
                <button class="btn btn-primary" onclick="telechargerBulletinPDF(${id}, 'classique'); this.closest('#modalCreation').remove();" style="padding:1rem; justify-content:center;">
                    📋 Modèle Classique (CNPS)
                    <br><small style="opacity:0.8;">Format standard camerounais</small>
                </button>
                <button class="btn btn-outline" onclick="telechargerBulletinPDF(${id}, 'moderne'); this.closest('#modalCreation').remove();" style="padding:1rem; justify-content:center; flex-direction:column;">
                    🎨 Modèle Moderne
                    <br><small>Format international avec design</small>
                </button>
                <button class="btn btn-outline" onclick="this.closest('#modalCreation').remove()" style="justify-content:center;">Annuler</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}