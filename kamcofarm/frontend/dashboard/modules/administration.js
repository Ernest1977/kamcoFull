// ========================================
// MODULE ADMINISTRATION — CRUD COMPLET
// ========================================

async function loadAdminModule() {
    const area = document.getElementById('contentArea');

    try {
        const logsData = await apiGet('/api/administration/logs/').catch(() => []);
        const notifsData = await apiGet('/api/administration/notifications/').catch(() => []);
        const annoncesData = await apiGet('/api/administration/annonces/').catch(() => []);
        const paramsData = await apiGet('/api/administration/parametres/').catch(() => []);
        const tachesData = await apiGet('/api/administration/taches/').catch(() => []);
        const suiviData = await apiGet('/api/administration/suivi/').catch(() => null);

        const logsList = Array.isArray(logsData) ? logsData : (logsData.results || []);
        const notifsList = Array.isArray(notifsData) ? notifsData : (notifsData.results || []);
        const annoncesList = Array.isArray(annoncesData) ? annoncesData : (annoncesData.results || []);
        const paramsList = Array.isArray(paramsData) ? paramsData : (paramsData.results || []);
        const tachesList = Array.isArray(tachesData) ? tachesData : (tachesData.results || []);

        const notifsNonLues = notifsList.filter(n => !n.est_lue).length;
        const tachesEnCours = tachesList.filter(t => ['A_FAIRE', 'EN_COURS'].includes(t.statut)).length;


        area.innerHTML = `
            <!-- Stats -->
            <div class="stats-row">
                <div class="stat-card">
                    <div class="stat-card-icon blue">📝</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${logsList.length}</div>
                        <div class="stat-card-label">Logs récents</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon orange">🔔</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${notifsNonLues}</div>
                        <div class="stat-card-label">Notifs non lues</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon green">📢</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${annoncesList.length}</div>
                        <div class="stat-card-label">Annonces</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon purple">⚙️</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${paramsList.length}</div>
                        <div class="stat-card-label">Paramètres</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon red">📋</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${tachesEnCours}</div>
                        <div class="stat-card-label">Tâches en cours</div>
                    </div>
                </div>
            </div>

            ${notifsNonLues > 0 ? `<div class="alert alert-warning"><span>🔔</span><span><strong>${notifsNonLues}</strong> notification(s) non lue(s)</span></div>` : ''}

            <!-- Onglets -->
            <div class="card">
                <div class="card-header" style="overflow-x:auto;">
                    <div class="tab-nav" style="flex-wrap:wrap; min-width:unset;">
                        <button class="tab-btn active" onclick="switchTab('adm', 'taches', this)">📋 Tâches (${tachesList.length})</button>
                        <button class="tab-btn" onclick="switchTab('adm', 'notifications', this)">🔔 Notifications (${notifsList.length})</button>
                        <button class="tab-btn" onclick="switchTab('adm', 'annonces', this)">📢 Annonces (${annoncesList.length})</button>
                        <button class="tab-btn" onclick="switchTab('adm', 'logs', this)">📝 Logs (${logsList.length})</button>
                        <button class="tab-btn" onclick="switchTab('adm', 'parametres', this)">⚙️ Paramètres (${paramsList.length})</button>
                        <button class="tab-btn" onclick="switchTab('adm', 'suivi', this)">📊 Suivi & Audit</button>
                        <button class="tab-btn" onclick="switchTab('adm', 'historique', this)">📜 Historique</button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="tab-content active" id="adm_taches" style="display:block;">${renderAdmTaches(tachesList)}</div>
                    <div class="tab-content" id="adm_notifications" style="display:none;">${renderAdmNotifications(notifsList)}</div>
                    <div class="tab-content" id="adm_annonces" style="display:none;">${renderAdmAnnonces(annoncesList)}</div>
                    <div class="tab-content" id="adm_logs" style="display:none;">${renderAdmLogs(logsList)}</div>
                    <div class="tab-content" id="adm_parametres" style="display:none;">${renderAdmParametres(paramsList)}</div>
                    <div class="tab-content" id="adm_suivi" style="display:none;">${renderAdmSuivi(suiviData)}</div>
                    <div class="tab-content" id="adm_historique" style="display:none;">${renderAdmHistorique()}</div>
                </div>
            </div>
        `;

    } catch (error) {
        showError(`Administration : ${error.message}`);
    }
}


// ========================================
// TAB : TÂCHES INTERNES
// ========================================
function renderAdmTaches(tachesList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">📋 Tâches Internes</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireAdmTache()">+ Nouvelle tâche</button>
            <button class="btn-export" onclick="exporterOngletActifExcel('Taches_Internes')">📊 Excel</button>
        </div>
        ${tachesList.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📋</div><h3>Aucune tâche</h3></div>' : `
            <p class="scroll-hint">👆 Faites défiler horizontalement →</p>
            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead><tr><th>Titre</th><th>Statut</th><th>Priorité</th><th>Assigné à</th><th>Échéance</th><th>Retard</th><th>Actions</th></tr></thead>
                        <tbody>
                            ${tachesList.map(t => `
                                <tr ${t.est_en_retard ? 'style="background:#fff0f0;"' : ''}>
                                    <td><strong>${escapeHtml(t.titre)}</strong></td>
                                    <td><span class="badge ${getBadgeClass(t.statut)}">${escapeHtml(t.statut_display || t.statut)}</span></td>
                                    <td><span class="badge ${getBadgeClass(t.priorite)}">${escapeHtml(t.priorite_display || t.priorite)}</span></td>
                                    <td><small>${escapeHtml(t.assignee_a_nom || 'Non assigné')}</small></td>
                                    <td><small>${formatDate(t.date_echeance)}</small></td>
                                    <td>${t.est_en_retard ? '<span class="badge badge-danger">⚠️ Retard</span>' : ''}</td>
                                    <td>
                                        <div class="item-actions">
                                            <button class="btn btn-sm btn-outline" onclick="voirDetailAdmTache(${t.id})" title="Détail">👁️</button>
                                            <button class="btn btn-sm btn-outline" onclick="editerAdmTache(${t.id})" title="Modifier">✏️</button>
                                            ${!['TERMINEE','ANNULEE'].includes(t.statut) ? `<button class="btn btn-sm btn-success" onclick="changerStatutAdmTache(${t.id})" title="Statut">📋</button>` : ''}
                                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/administration/taches/${t.id}/', 'admin')">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="responsive-mobile-view">
                ${tachesList.map(t => `
                    <div class="responsive-card" ${t.est_en_retard ? 'style="border-left:4px solid var(--danger);"' : ''}>
                        <div class="responsive-card-header">
                            <div><strong>${escapeHtml(t.titre)}</strong><br><small>${escapeHtml(t.assignee_a_nom || 'Non assigné')}</small></div>
                            <span class="badge ${getBadgeClass(t.statut)}">${escapeHtml(t.statut_display || t.statut)}</span>
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row"><span class="responsive-card-label">⚡ Priorité</span><span class="badge ${getBadgeClass(t.priorite)}">${escapeHtml(t.priorite_display || t.priorite)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📅 Échéance</span><span>${formatDate(t.date_echeance) || 'N/A'}</span></div>
                            ${t.est_en_retard ? `<div class="responsive-card-row"><span class="responsive-card-label">⚠️</span><span class="badge badge-danger">En retard</span></div>` : ''}
                        </div>
                        <div class="responsive-card-footer">
                            <button class="btn btn-sm btn-outline" onclick="voirDetailAdmTache(${t.id})">👁️</button>
                            <button class="btn btn-sm btn-outline" onclick="editerAdmTache(${t.id})">✏️</button>
                            ${!['TERMINEE','ANNULEE'].includes(t.statut) ? `<button class="btn btn-sm btn-success" onclick="changerStatutAdmTache(${t.id})">📋</button>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}


// ========================================
// TAB : NOTIFICATIONS
// ========================================
function renderAdmNotifications(notifsList) {
    const typeIcons = { 'INFO': 'ℹ️', 'SUCCESS': '✅', 'WARNING': '⚠️', 'ERROR': '❌', 'TACHE': '📋' };
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">🔔 Notifications</h4>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireAdmNotification()">+ Envoyer</button>
                <button class="btn btn-outline btn-sm" onclick="marquerToutesLuesAdm()">✅ Tout marquer lu</button>
            </div>
        </div>
        ${notifsList.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">🔔</div><h3>Aucune notification</h3></div>' : `
            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead><tr><th></th><th>Titre</th><th>Type</th><th>Priorité</th><th>De</th><th>Date</th><th>Lu</th><th>Actions</th></tr></thead>
                        <tbody>
                            ${notifsList.map(n => `
                                <tr ${!n.est_lue ? 'style="background:#f0f7ff; font-weight:500;"' : ''}>
                                    <td>${typeIcons[n.type_notification] || 'ℹ️'}</td>
                                    <td><strong>${escapeHtml(n.titre)}</strong><br><small style="color:var(--text-light);">${escapeHtml((n.message || '').substring(0, 60))}</small></td>
                                    <td><span class="badge badge-info">${escapeHtml(n.type_display || n.type_notification)}</span></td>
                                    <td><span class="badge ${getBadgeClass(n.priorite)}">${escapeHtml(n.priorite_display || n.priorite)}</span></td>
                                    <td><small>${escapeHtml(n.expediteur_nom || 'Système')}</small></td>
                                    <td><small>${timeAgo(n.date_creation)}</small></td>
                                    <td>${n.est_lue ? '✅' : '🔵'}</td>
                                    <td>
                                        <div class="item-actions">
                                            ${!n.est_lue ? `<button class="btn btn-sm btn-success" onclick="marquerNotifLueAdm(${n.id})">✅</button>` : ''}
                                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/administration/notifications/${n.id}/', 'admin')">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="responsive-mobile-view">
                ${notifsList.map(n => `
                    <div class="responsive-card" ${!n.est_lue ? 'style="border-left:4px solid var(--info);"' : ''}>
                        <div class="responsive-card-header">
                            <div><strong>${typeIcons[n.type_notification] || ''} ${escapeHtml(n.titre)}</strong><br><small>${timeAgo(n.date_creation)}</small></div>
                            ${!n.est_lue ? '<span class="badge badge-info">Nouveau</span>' : ''}
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row"><span class="responsive-card-label">📝 Message</span><span><small>${escapeHtml((n.message || '').substring(0, 100))}</small></span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">⚡ Priorité</span><span class="badge ${getBadgeClass(n.priorite)}">${escapeHtml(n.priorite_display || n.priorite)}</span></div>
                        </div>
                        <div class="responsive-card-footer">
                            ${!n.est_lue ? `<button class="btn btn-sm btn-success" onclick="marquerNotifLueAdm(${n.id})">✅ Lu</button>` : ''}
                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/administration/notifications/${n.id}/', 'admin')">🗑️</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}


// ========================================
// TAB : ANNONCES INTERNES
// ========================================
function renderAdmAnnonces(annoncesList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">📢 Annonces Internes</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireAdmAnnonce()">+ Nouvelle annonce</button>
        </div>
        ${annoncesList.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📢</div><h3>Aucune annonce</h3></div>' : `
            ${annoncesList.map(a => `
                <div style="background:white; border-radius:12px; padding:1.2rem; margin-bottom:1rem; box-shadow:var(--shadow); border-left:4px solid ${a.priorite === 'URGENTE' ? 'var(--danger)' : a.priorite === 'IMPORTANTE' ? 'var(--warning)' : 'var(--primary)'};">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem;">
                        <div>
                            <strong style="font-size:1.05rem;">${a.est_epinglee ? '📌 ' : ''}${escapeHtml(a.titre)}</strong>
                            <br><small style="color:var(--text-light);">${escapeHtml(a.publiee_par_nom || 'Admin')} — ${timeAgo(a.date_publication)} — Pour : ${escapeHtml(a.destinataires_display || a.destinataires)}</small>
                        </div>
                        <div style="display:flex; gap:0.3rem;">
                            <span class="badge ${a.priorite === 'URGENTE' ? 'badge-danger' : a.priorite === 'IMPORTANTE' ? 'badge-warning' : 'badge-info'}">${escapeHtml(a.priorite_display || a.priorite)}</span>
                            <button class="btn btn-sm btn-outline" onclick="editerAdmAnnonce(${a.id})">✏️</button>
                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/administration/annonces/${a.id}/', 'admin')">🗑️</button>
                        </div>
                    </div>
                    <p style="margin:0; color:var(--text); line-height:1.6;">${escapeHtml(a.contenu)}</p>
                </div>
            `).join('')}
        `}
    `;
}


// ========================================
// TAB : LOGS D'ACTIVITÉ
// ========================================
function renderAdmLogs(logsList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h4 style="color:var(--primary);">📝 Logs d'Activité</h4>
            <button class="btn-export" onclick="exporterOngletActifExcel('Logs_Activite')">📊 Excel</button>
        </div>
        ${logsList.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📝</div><h3>Aucun log</h3></div>' : `
            <p class="scroll-hint">👆 Faites défiler horizontalement →</p>
            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead><tr><th>Date</th><th>Utilisateur</th><th>Action</th><th>Module</th><th>Sévérité</th><th>Description</th><th>IP</th></tr></thead>
                        <tbody>
                            ${logsList.slice(0, 50).map(l => `
                                <tr ${l.severite === 'ERROR' || l.severite === 'CRITICAL' ? 'style="background:#fff0f0;"' : ''}>
                                    <td><small>${timeAgo(l.date_action)}</small></td>
                                    <td><small>${escapeHtml(l.utilisateur_nom || 'Système')}</small></td>
                                    <td><span class="badge ${getBadgeClass(l.action)}">${escapeHtml(l.action_display || l.action)}</span></td>
                                    <td><small>${escapeHtml(l.module_display || l.module)}</small></td>
                                    <td><span class="badge ${l.severite === 'ERROR' ? 'badge-danger' : l.severite === 'WARNING' ? 'badge-warning' : 'badge-info'}">${escapeHtml(l.severite_display || l.severite)}</span></td>
                                    <td><small>${escapeHtml((l.description || '').substring(0, 80))}</small></td>
                                    <td><small>${escapeHtml(l.ip_address || 'N/A')}</small></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="responsive-mobile-view">
                ${logsList.slice(0, 30).map(l => `
                    <div class="responsive-card" ${l.severite === 'ERROR' ? 'style="border-left:4px solid var(--danger);"' : ''}>
                        <div class="responsive-card-header">
                            <div><small>${escapeHtml(l.utilisateur_nom || 'Système')} — ${timeAgo(l.date_action)}</small></div>
                            <span class="badge ${getBadgeClass(l.action)}">${escapeHtml(l.action_display || l.action)}</span>
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row"><span class="responsive-card-label">📦 Module</span><span>${escapeHtml(l.module_display || l.module)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📝</span><span><small>${escapeHtml((l.description || '').substring(0, 100))}</small></span></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}


// ========================================
// TAB : PARAMÈTRES GLOBAUX
// ========================================
function renderAdmParametres(paramsList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">⚙️ Paramètres Globaux</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireAdmParametre()">+ Nouveau paramètre</button>
        </div>
        ${paramsList.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">⚙️</div><h3>Aucun paramètre</h3></div>' : `
            <div class="table-container">
                <table class="dash-table">
                    <thead><tr><th>Clé</th><th>Label</th><th>Valeur</th><th>Type</th><th>Catégorie</th><th>Modifiable</th><th>Actions</th></tr></thead>
                    <tbody>
                        ${paramsList.map(p => `
                            <tr>
                                <td><code style="background:#f0f0f0; padding:2px 6px; border-radius:4px;">${escapeHtml(p.cle)}</code></td>
                                <td><strong>${escapeHtml(p.label)}</strong><br><small style="color:var(--text-light);">${escapeHtml((p.description || '').substring(0, 50))}</small></td>
                                <td><strong>${escapeHtml((p.valeur || '').substring(0, 40))}</strong></td>
                                <td><span class="badge badge-info">${escapeHtml(p.type_display || p.type_valeur)}</span></td>
                                <td><small>${escapeHtml(p.categorie_display || p.categorie)}</small></td>
                                <td>${p.est_modifiable ? '✅' : '🔒'}</td>
                                <td>
                                    ${p.est_modifiable ? `<button class="btn btn-sm btn-outline" onclick="editerAdmParametre('${escapeHtml(p.cle)}')">✏️</button>` : ''}
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
// FORMULAIRES CRUD
// ========================================

// TÂCHE
async function ouvrirFormulaireAdmTache(editData = null) {
    const existant = document.getElementById('modalCreation'); if (existant) existant.remove();
    let users = [];
    try { const r = await apiGet('/api/accounts/utilisateurs-disponibles/'); users = Array.isArray(r) ? r : (r.results || []); } catch(e) {}

    const titre = editData ? 'Modifier tâche' : 'Nouvelle tâche';
    const endpoint = editData ? `/api/administration/taches/${editData.id}/` : '/api/administration/taches/';

    const modal = document.createElement('div'); modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:600px; max-height:90vh; overflow-y:auto;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">${editData ? '✏️' : '➕'} ${titre}</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="admTacheForm" style="padding:1.5rem;">
                <div class="form-grid">
                    <div class="form-field full-width"><label>Titre <span class="required">*</span></label><input type="text" id="tacheTitle" value="${escapeHtml(editData?.titre || '')}" required></div>
                    <div class="form-field full-width"><label>Description</label><textarea id="tacheDesc" rows="3">${escapeHtml(editData?.description || '')}</textarea></div>
                    <div class="form-field"><label>Priorité</label>
                        <select id="tachePriorite">
                            <option value="BASSE" ${editData?.priorite === 'BASSE' ? 'selected' : ''}>Basse</option>
                            <option value="NORMALE" ${editData?.priorite === 'NORMALE' || !editData ? 'selected' : ''}>Normale</option>
                            <option value="HAUTE" ${editData?.priorite === 'HAUTE' ? 'selected' : ''}>Haute</option>
                            <option value="URGENTE" ${editData?.priorite === 'URGENTE' ? 'selected' : ''}>Urgente</option>
                        </select>
                    </div>
                    <div class="form-field"><label>Assigné à</label>
                        <select id="tacheAssigne">
                            <option value="">Non assigné</option>
                            ${users.map(u => `<option value="${u.id}" ${editData?.assignee_a === u.id ? 'selected' : ''}>${escapeHtml(u.first_name || '')} ${escapeHtml(u.last_name || '')} (${escapeHtml(u.username)})</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-field"><label>Échéance</label><input type="date" id="tacheEcheance" value="${editData?.date_echeance || ''}"></div>
                    <div class="form-field"><label>Module lié</label><input type="text" id="tacheModule" value="${escapeHtml(editData?.module_lie || '')}" placeholder="Ex: Finance, RH..."></div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 ${editData ? 'Enregistrer' : 'Créer'}</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="admTacheError" style="color:var(--danger); text-align:center;"></p>
            </form>
        </div>`;
    document.body.appendChild(modal); modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('admTacheForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const payload = { titre: document.getElementById('tacheTitle').value, description: document.getElementById('tacheDesc')?.value || '', priorite: document.getElementById('tachePriorite').value, module_lie: document.getElementById('tacheModule')?.value || '' };
            const assigneId = document.getElementById('tacheAssigne')?.value;
            if (assigneId) payload.assignee_a = parseInt(assigneId);
            const echeance = document.getElementById('tacheEcheance')?.value;
            if (echeance) payload.date_echeance = echeance;
            if (editData) { await apiPatch(endpoint, payload); } else { await apiPost(endpoint, payload); }
            modal.remove(); navigateTo('admin');
        } catch (error) { document.getElementById('admTacheError').textContent = error.message; }
    });
}

async function editerAdmTache(id) { try { const t = await apiGet(`/api/administration/taches/${id}/`); ouvrirFormulaireAdmTache(t); } catch(e) { alert(e.message); } }

async function voirDetailAdmTache(id) {
    try {
        const t = await apiGet(`/api/administration/taches/${id}/`);
        const existant = document.getElementById('modalCreation'); if (existant) existant.remove();
        const modal = document.createElement('div'); modal.id = 'modalCreation';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
        modal.innerHTML = `
            <div style="background:white; border-radius:16px; width:100%; max-width:600px; max-height:90vh; overflow-y:auto;">
                <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                    <h3 style="color:var(--primary);">📋 ${escapeHtml(t.titre)}</h3>
                    <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.5rem; cursor:pointer;">✕</button>
                </div>
                <div style="padding:1.5rem;">
                    <div class="detail-row"><span class="detail-label">Statut</span><span class="detail-value"><span class="badge ${getBadgeClass(t.statut)}">${escapeHtml(t.statut_display || t.statut)}</span></span></div>
                    <div class="detail-row"><span class="detail-label">Priorité</span><span class="detail-value"><span class="badge ${getBadgeClass(t.priorite)}">${escapeHtml(t.priorite_display || t.priorite)}</span></span></div>
                    <div class="detail-row"><span class="detail-label">Assigné à</span><span class="detail-value">${escapeHtml(t.assignee_a_nom || 'Non assigné')}</span></div>
                    <div class="detail-row"><span class="detail-label">Créé par</span><span class="detail-value">${escapeHtml(t.creee_par_nom || 'N/A')}</span></div>
                    <div class="detail-row"><span class="detail-label">Échéance</span><span class="detail-value">${formatDate(t.date_echeance) || 'N/A'}</span></div>
                    ${t.est_en_retard ? '<div class="alert alert-danger" style="margin:0.5rem 0;"><span>⚠️</span><span>Cette tâche est en retard !</span></div>' : ''}
                    ${t.description ? `<div class="detail-row"><span class="detail-label">Description</span><span class="detail-value">${escapeHtml(t.description)}</span></div>` : ''}
                    ${t.commentaire ? `<div class="detail-row"><span class="detail-label">Commentaire</span><span class="detail-value">${escapeHtml(t.commentaire)}</span></div>` : ''}
                    <div class="form-actions">
                        ${!['TERMINEE','ANNULEE'].includes(t.statut) ? `<button class="btn btn-success" onclick="this.closest('#modalCreation').remove(); changerStatutAdmTache(${t.id})">📋 Statut</button>` : ''}
                        <button class="btn btn-outline" onclick="this.closest('#modalCreation').remove(); editerAdmTache(${t.id})">✏️ Modifier</button>
                        <button class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Fermer</button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(modal); modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    } catch(e) { alert(e.message); }
}

async function changerStatutAdmTache(id) {
    const statuts = [{value:'A_FAIRE',label:'📋 À faire'},{value:'EN_COURS',label:'▶️ En cours'},{value:'EN_ATTENTE',label:'⏳ En attente'},{value:'TERMINEE',label:'✅ Terminée'},{value:'ANNULEE',label:'❌ Annulée'}];
    const existant = document.getElementById('modalCreation'); if (existant) existant.remove();
    const modal = document.createElement('div'); modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `<div style="background:white; border-radius:16px; width:100%; max-width:400px;"><div style="padding:1.5rem; border-bottom:1px solid var(--border);"><h3 style="color:var(--primary);">📋 Statut tâche</h3></div><div style="padding:1.5rem; display:flex; flex-direction:column; gap:0.5rem;">${statuts.map(s => `<button class="btn btn-outline" onclick="confirmerStatutAdmTache(${id}, '${s.value}')">${s.label}</button>`).join('')}<button class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button></div></div>`;
    document.body.appendChild(modal); modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}
async function confirmerStatutAdmTache(id, statut) {
    try { await apiPost(`/api/administration/taches/${id}/changer_statut/`, { statut }); document.getElementById('modalCreation')?.remove(); navigateTo('admin'); } catch(e) { alert(e.message); }
}

// NOTIFICATION
async function ouvrirFormulaireAdmNotification() {
    const existant = document.getElementById('modalCreation'); if (existant) existant.remove();
    let users = [];
    try { const r = await apiGet('/api/accounts/utilisateurs-disponibles/'); users = Array.isArray(r) ? r : (r.results || []); } catch(e) {}

    const modal = document.createElement('div'); modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:550px;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border);"><h3 style="color:var(--primary);">➕ Envoyer une notification</h3></div>
            <form id="admNotifForm" style="padding:1.5rem;">
                <div class="form-grid">
                    <div class="form-field full-width"><label>Destinataire <span class="required">*</span></label>
                        <select id="notifDest" required><option value="">Sélectionner...</option>${users.map(u => `<option value="${u.id}">${escapeHtml(u.first_name || '')} ${escapeHtml(u.last_name || '')} (${escapeHtml(u.username)})</option>`).join('')}</select>
                    </div>
                    <div class="form-field full-width"><label>Titre <span class="required">*</span></label><input type="text" id="notifTitre" required></div>
                    <div class="form-field full-width"><label>Message <span class="required">*</span></label><textarea id="notifMessage" rows="3" required></textarea></div>
                    <div class="form-field"><label>Type</label>
                        <select id="notifType"><option value="INFO">Information</option><option value="SUCCESS">Succès</option><option value="WARNING">Avertissement</option><option value="ERROR">Erreur</option><option value="TACHE">Tâche</option></select>
                    </div>
                    <div class="form-field"><label>Priorité</label>
                        <select id="notifPriorite"><option value="BASSE">Basse</option><option value="NORMALE" selected>Normale</option><option value="HAUTE">Haute</option><option value="URGENTE">Urgente</option></select>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">📤 Envoyer</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="admNotifError" style="color:var(--danger); text-align:center;"></p>
            </form>
        </div>`;
    document.body.appendChild(modal); modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('admNotifForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await apiPost('/api/administration/notifications/', {
                destinataire: parseInt(document.getElementById('notifDest').value),
                titre: document.getElementById('notifTitre').value,
                message: document.getElementById('notifMessage').value,
                type_notification: document.getElementById('notifType').value,
                priorite: document.getElementById('notifPriorite').value
            });
            modal.remove(); navigateTo('admin');
        } catch (error) { document.getElementById('admNotifError').textContent = error.message; }
    });
}

async function marquerNotifLueAdm(id) {
    try { await apiPost(`/api/administration/notifications/${id}/marquer_lue/`); navigateTo('admin'); } catch(e) { alert(e.message); }
}

async function marquerToutesLuesAdm() {
    try { await apiPost('/api/administration/notifications/marquer_toutes_lues/'); navigateTo('admin'); } catch(e) { alert(e.message); }
}

// ANNONCE
async function ouvrirFormulaireAdmAnnonce(editData = null) {
    const existant = document.getElementById('modalCreation'); if (existant) existant.remove();
    const endpoint = editData ? `/api/administration/annonces/${editData.id}/` : '/api/administration/annonces/';

    const modal = document.createElement('div'); modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:600px; max-height:90vh; overflow-y:auto;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border);"><h3 style="color:var(--primary);">${editData ? '✏️' : '➕'} Annonce interne</h3></div>
            <form id="admAnnonceForm" style="padding:1.5rem;">
                <div class="form-grid">
                    <div class="form-field full-width"><label>Titre <span class="required">*</span></label><input type="text" id="annonceTitre" value="${escapeHtml(editData?.titre || '')}" required></div>
                    <div class="form-field full-width"><label>Contenu <span class="required">*</span></label><textarea id="annonceContenu" rows="5" required>${escapeHtml(editData?.contenu || '')}</textarea></div>
                    <div class="form-field"><label>Priorité</label>
                        <select id="annoncePriorite">
                            <option value="NORMALE" ${editData?.priorite === 'NORMALE' ? 'selected' : ''}>Normale</option>
                            <option value="IMPORTANTE" ${editData?.priorite === 'IMPORTANTE' ? 'selected' : ''}>Importante</option>
                            <option value="URGENTE" ${editData?.priorite === 'URGENTE' ? 'selected' : ''}>Urgente</option>
                        </select>
                    </div>
                    <div class="form-field"><label>Destinataires</label>
                        <select id="annonceDest">
                            <option value="TOUS" ${editData?.destinataires === 'TOUS' ? 'selected' : ''}>Tous les employés</option>
                            <option value="ADMIN" ${editData?.destinataires === 'ADMIN' ? 'selected' : ''}>Administrateurs</option>
                            <option value="DIR" ${editData?.destinataires === 'DIR' ? 'selected' : ''}>Direction</option>
                            <option value="RH" ${editData?.destinataires === 'RH' ? 'selected' : ''}>RH</option>
                            <option value="COMPTA" ${editData?.destinataires === 'COMPTA' ? 'selected' : ''}>Comptabilité</option>
                            <option value="COMM" ${editData?.destinataires === 'COMM' ? 'selected' : ''}>Commerciaux</option>
                            <option value="LOG" ${editData?.destinataires === 'LOG' ? 'selected' : ''}>Logistique</option>
                        </select>
                    </div>
                    <div class="form-field"><label>Expiration</label><input type="datetime-local" id="annonceExpiration" value="${editData?.date_expiration ? editData.date_expiration.slice(0,16) : ''}"></div>
                </div>
                <div class="form-checkbox"><input type="checkbox" id="annonceEpinglee" ${editData?.est_epinglee ? 'checked' : ''}><label for="annonceEpinglee">📌 Épingler cette annonce</label></div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 ${editData ? 'Enregistrer' : 'Publier'}</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="admAnnonceError" style="color:var(--danger); text-align:center;"></p>
            </form>
        </div>`;
    document.body.appendChild(modal); modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('admAnnonceForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const payload = {
                titre: document.getElementById('annonceTitre').value,
                contenu: document.getElementById('annonceContenu').value,
                priorite: document.getElementById('annoncePriorite').value,
                destinataires: document.getElementById('annonceDest').value,
                est_epinglee: document.getElementById('annonceEpinglee').checked,
                est_active: true
            };
            const expiration = document.getElementById('annonceExpiration')?.value;
            if (expiration) payload.date_expiration = expiration;
            if (editData) { await apiPatch(endpoint, payload); } else { await apiPost(endpoint, payload); }
            modal.remove(); navigateTo('admin');
        } catch (error) { document.getElementById('admAnnonceError').textContent = error.message; }
    });
}
async function editerAdmAnnonce(id) { try { const a = await apiGet(`/api/administration/annonces/${id}/`); ouvrirFormulaireAdmAnnonce(a); } catch(e) { alert(e.message); } }

// PARAMÈTRE
async function ouvrirFormulaireAdmParametre(editData = null) {
    const existant = document.getElementById('modalCreation'); if (existant) existant.remove();
    const isEdit = editData && typeof editData === 'object';
    const endpoint = isEdit ? `/api/administration/parametres/${editData.cle}/` : '/api/administration/parametres/';

    const modal = document.createElement('div'); modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:550px;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border);"><h3 style="color:var(--primary);">${isEdit ? '✏️ Modifier' : '➕ Nouveau'} paramètre</h3></div>
            <form id="admParamForm" style="padding:1.5rem;">
                <div class="form-grid">
                    <div class="form-field"><label>Clé <span class="required">*</span></label><input type="text" id="paramCle" value="${escapeHtml(isEdit ? editData.cle : '')}" required ${isEdit ? 'readonly' : ''}></div>
                    <div class="form-field"><label>Label <span class="required">*</span></label><input type="text" id="paramLabel" value="${escapeHtml(isEdit ? editData.label : '')}" required></div>
                    <div class="form-field full-width"><label>Valeur <span class="required">*</span></label><textarea id="paramValeur" rows="2" required>${escapeHtml(isEdit ? editData.valeur : '')}</textarea></div>
                    <div class="form-field"><label>Type</label>
                        <select id="paramType">
                            <option value="TEXTE" ${isEdit && editData.type_valeur === 'TEXTE' ? 'selected' : ''}>Texte</option>
                            <option value="NOMBRE" ${isEdit && editData.type_valeur === 'NOMBRE' ? 'selected' : ''}>Nombre</option>
                            <option value="BOOLEEN" ${isEdit && editData.type_valeur === 'BOOLEEN' ? 'selected' : ''}>Booléen</option>
                            <option value="EMAIL" ${isEdit && editData.type_valeur === 'EMAIL' ? 'selected' : ''}>Email</option>
                            <option value="URL" ${isEdit && editData.type_valeur === 'URL' ? 'selected' : ''}>URL</option>
                            <option value="JSON" ${isEdit && editData.type_valeur === 'JSON' ? 'selected' : ''}>JSON</option>
                        </select>
                    </div>
                    <div class="form-field"><label>Catégorie</label>
                        <select id="paramCategorie">
                            <option value="GENERAL" ${isEdit && editData.categorie === 'GENERAL' ? 'selected' : ''}>Général</option>
                            <option value="ENTREPRISE" ${isEdit && editData.categorie === 'ENTREPRISE' ? 'selected' : ''}>Entreprise</option>
                            <option value="FINANCE" ${isEdit && editData.categorie === 'FINANCE' ? 'selected' : ''}>Finance</option>
                            <option value="RH" ${isEdit && editData.categorie === 'RH' ? 'selected' : ''}>RH</option>
                            <option value="MARKETING" ${isEdit && editData.categorie === 'MARKETING' ? 'selected' : ''}>Marketing</option>
                            <option value="NOTIFICATIONS" ${isEdit && editData.categorie === 'NOTIFICATIONS' ? 'selected' : ''}>Notifications</option>
                            <option value="SECURITE" ${isEdit && editData.categorie === 'SECURITE' ? 'selected' : ''}>Sécurité</option>
                            <option value="SYSTEME" ${isEdit && editData.categorie === 'SYSTEME' ? 'selected' : ''}>Système</option>
                        </select>
                    </div>
                    <div class="form-field full-width"><label>Description</label><textarea id="paramDesc" rows="2">${escapeHtml(isEdit ? (editData.description || '') : '')}</textarea></div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 ${isEdit ? 'Enregistrer' : 'Créer'}</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="admParamError" style="color:var(--danger); text-align:center;"></p>
            </form>
        </div>`;
    document.body.appendChild(modal); modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('admParamForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const payload = {
                cle: document.getElementById('paramCle').value,
                label: document.getElementById('paramLabel').value,
                valeur: document.getElementById('paramValeur').value,
                type_valeur: document.getElementById('paramType').value,
                categorie: document.getElementById('paramCategorie').value,
                description: document.getElementById('paramDesc')?.value || '',
                est_modifiable: true, est_visible: true
            };
            if (isEdit) { await apiPatch(endpoint, payload); } else { await apiPost(endpoint, payload); }
            modal.remove(); navigateTo('admin');
        } catch (error) { document.getElementById('admParamError').textContent = error.message; }
    });
}

async function editerAdmParametre(cle) {
    try { const p = await apiGet(`/api/administration/parametres/${cle}/`); ouvrirFormulaireAdmParametre(p); } catch(e) { alert(e.message); }
}


// ========================================
// TAB : SUIVI & AUDIT
// ========================================
function renderAdmSuivi(suiviData) {
    if (!suiviData) return '<div class="empty-state"><div class="empty-state-icon">📊</div><h3>Données de suivi indisponibles</h3></div>';

    const stats = suiviData.statistiques || {};
    const notifs = suiviData.notifications || [];
    const taches = suiviData.taches || [];
    const annonces = suiviData.annonces || [];

    const typeIcons = { 'INFO': 'ℹ️', 'SUCCESS': '✅', 'WARNING': '⚠️', 'ERROR': '❌', 'TACHE': '📋' };

    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">📊 Suivi & Audit des Communications</h4>
            <button class="btn btn-outline btn-sm" onclick="navigateTo('admin')">🔄 Actualiser</button>
        </div>

        <!-- Stats de suivi -->
        <div class="stats-row" style="margin-bottom:1.5rem;">
            <div class="stat-card">
                <div class="stat-card-icon blue">📨</div>
                <div class="stat-card-info">
                    <div class="stat-card-value">${stats.total_notifications || 0}</div>
                    <div class="stat-card-label">Total notifications</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-card-icon green">👁️</div>
                <div class="stat-card-info">
                    <div class="stat-card-value">${stats.notifications_lues || 0}</div>
                    <div class="stat-card-label">Lues</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-card-icon orange">🔵</div>
                <div class="stat-card-info">
                    <div class="stat-card-value">${stats.notifications_non_lues || 0}</div>
                    <div class="stat-card-label">Non lues</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-card-icon teal">📈</div>
                <div class="stat-card-info">
                    <div class="stat-card-value">${stats.taux_lecture || 0}%</div>
                    <div class="stat-card-label">Taux de lecture</div>
                </div>
            </div>
        </div>

        <!-- Barre de progression lecture -->
        <div style="background:white; border-radius:12px; padding:1rem; box-shadow:var(--shadow); margin-bottom:1.5rem;">
            <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                <strong>Taux de lecture des notifications</strong>
                <span>${stats.taux_lecture || 0}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill ${(stats.taux_lecture || 0) >= 80 ? 'green' : (stats.taux_lecture || 0) >= 50 ? 'orange' : 'red'}" style="width:${stats.taux_lecture || 0}%;"></div>
            </div>
        </div>

        <!-- Sous-onglets -->
        <div class="card" style="margin-bottom:1rem;">
            <div class="card-header">
                <div class="tab-nav" style="flex-wrap:wrap;">
                    <button class="tab-btn active" onclick="switchTab('suivi', 'notifs', this)">📨 Notifications (${notifs.length})</button>
                    <button class="tab-btn" onclick="switchTab('suivi', 'taches', this)">📋 Tâches (${taches.length})</button>
                    <button class="tab-btn" onclick="switchTab('suivi', 'annonces', this)">📢 Annonces (${annonces.length})</button>
                </div>
            </div>
            <div class="card-body">
                <!-- Notifications -->
                <div class="tab-content active" id="suivi_notifs" style="display:block;">
                    <p class="scroll-hint">👆 Faites défiler horizontalement →</p>
                    <div class="responsive-desktop-view">
                        <div class="table-container">
                            <table class="dash-table">
                                <thead><tr>
                                    <th></th><th>Titre</th><th>Type</th><th>Priorité</th>
                                    <th>Expéditeur</th><th>Destinataire</th>
                                    <th>Statut lecture</th><th>Date lecture</th><th>Envoyée le</th>
                                </tr></thead>
                                <tbody>
                                    ${notifs.length === 0 ? '<tr><td colspan="9" style="text-align:center; padding:2rem;">Aucune notification</td></tr>' :
                                    notifs.map(n => `
                                        <tr ${!n.est_lue ? 'style="background:#f0f7ff;"' : ''}>
                                            <td>${typeIcons[n.type] || 'ℹ️'}</td>
                                            <td><strong>${escapeHtml(n.titre)}</strong><br><small style="color:var(--text-light);">${escapeHtml((n.message || '').substring(0, 50))}</small></td>
                                            <td><span class="badge badge-info">${escapeHtml(n.type)}</span></td>
                                            <td><span class="badge ${getBadgeClass(n.priorite)}">${escapeHtml(n.priorite)}</span></td>
                                            <td><small>📤 ${escapeHtml(n.expediteur)}</small></td>
                                            <td><strong>📥 ${escapeHtml(n.destinataire_nom)}</strong><br><small>(${escapeHtml(n.destinataire)})</small></td>
                                            <td>${n.est_lue ?
                                                '<span class="badge badge-success">✅ Lu</span>' :
                                                '<span class="badge badge-warning">🔵 Non lu</span>'
                                            }</td>
                                            <td>${n.date_lecture ? `<small>${formatDateTime(n.date_lecture)}</small>` : '<small style="color:var(--text-light);">—</small>'}</td>
                                            <td><small>${formatDateTime(n.date_creation)}</small></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="responsive-mobile-view">
                        ${notifs.map(n => `
                            <div class="responsive-card" ${!n.est_lue ? 'style="border-left:4px solid var(--info);"' : ''}>
                                <div class="responsive-card-header">
                                    <div><strong>${typeIcons[n.type] || ''} ${escapeHtml(n.titre)}</strong></div>
                                    ${n.est_lue ? '<span class="badge badge-success">✅ Lu</span>' : '<span class="badge badge-warning">🔵 Non lu</span>'}
                                </div>
                                <div class="responsive-card-body">
                                    <div class="responsive-card-row"><span class="responsive-card-label">📤 De</span><span>${escapeHtml(n.expediteur)}</span></div>
                                    <div class="responsive-card-row"><span class="responsive-card-label">📥 À</span><span><strong>${escapeHtml(n.destinataire_nom)}</strong></span></div>
                                    <div class="responsive-card-row"><span class="responsive-card-label">⚡ Priorité</span><span class="badge ${getBadgeClass(n.priorite)}">${escapeHtml(n.priorite)}</span></div>
                                    <div class="responsive-card-row"><span class="responsive-card-label">📅 Envoyée</span><span>${formatDateTime(n.date_creation)}</span></div>
                                    ${n.date_lecture ? `<div class="responsive-card-row"><span class="responsive-card-label">👁️ Lue le</span><span>${formatDateTime(n.date_lecture)}</span></div>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Tâches -->
                <div class="tab-content" id="suivi_taches" style="display:none;">
                    <div class="responsive-desktop-view">
                        <div class="table-container">
                            <table class="dash-table">
                                <thead><tr>
                                    <th>Titre</th><th>Statut</th><th>Priorité</th>
                                    <th>Créée par</th><th>Assignée à</th>
                                    <th>Consultée</th><th>Échéance</th><th>Début</th><th>Fin</th><th>Créée le</th>
                                </tr></thead>
                                <tbody>
                                    ${taches.length === 0 ? '<tr><td colspan="10" style="text-align:center; padding:2rem;">Aucune tâche</td></tr>' :
                                    taches.map(t => `
                                        <tr ${t.est_en_retard ? 'style="background:#fff0f0;"' : ''}>
                                            <td><strong>${escapeHtml(t.titre)}</strong></td>
                                            <td><span class="badge ${getBadgeClass(t.statut)}">${escapeHtml(t.statut)}</span></td>
                                            <td><span class="badge ${getBadgeClass(t.priorite)}">${escapeHtml(t.priorite)}</span></td>
                                            <td><small>📤 ${escapeHtml(t.creee_par)}</small></td>
                                            <td><strong>📥 ${escapeHtml(t.assignee_a_nom)}</strong></td>
                                            <td>${t.consultee ?
                                                '<span class="badge badge-success">✅ Oui</span>' :
                                                '<span class="badge badge-warning">🔵 Non</span>'
                                            }</td>
                                            <td>${t.date_echeance ? `<small>${formatDate(t.date_echeance)}</small>` : '—'}${t.est_en_retard ? ' <span class="badge badge-danger">⚠️</span>' : ''}</td>
                                            <td>${t.date_debut ? `<small>${formatDate(t.date_debut)}</small>` : '—'}</td>
                                            <td>${t.date_fin ? `<small>${formatDate(t.date_fin)}</small>` : '—'}</td>
                                            <td><small>${formatDateTime(t.date_creation)}</small></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="responsive-mobile-view">
                        ${taches.map(t => `
                            <div class="responsive-card" ${t.est_en_retard ? 'style="border-left:4px solid var(--danger);"' : ''}>
                                <div class="responsive-card-header">
                                    <div><strong>${escapeHtml(t.titre)}</strong></div>
                                    <span class="badge ${getBadgeClass(t.statut)}">${escapeHtml(t.statut)}</span>
                                </div>
                                <div class="responsive-card-body">
                                    <div class="responsive-card-row"><span class="responsive-card-label">📤 Créée par</span><span>${escapeHtml(t.creee_par)}</span></div>
                                    <div class="responsive-card-row"><span class="responsive-card-label">📥 Assignée à</span><span><strong>${escapeHtml(t.assignee_a_nom)}</strong></span></div>
                                    <div class="responsive-card-row"><span class="responsive-card-label">👁️ Consultée</span><span>${t.consultee ? '✅ Oui' : '🔵 Non'}</span></div>
                                    <div class="responsive-card-row"><span class="responsive-card-label">📅 Échéance</span><span>${formatDate(t.date_echeance) || 'N/A'} ${t.est_en_retard ? '⚠️' : ''}</span></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Annonces -->
                <div class="tab-content" id="suivi_annonces" style="display:none;">
                    <div class="responsive-desktop-view">
                        <div class="table-container">
                            <table class="dash-table">
                                <thead><tr>
                                    <th>Titre</th><th>Priorité</th><th>Destinataires</th>
                                    <th>Publiée par</th><th>Épinglée</th><th>Active</th>
                                    <th>Publication</th><th>Expiration</th>
                                </tr></thead>
                                <tbody>
                                    ${annonces.length === 0 ? '<tr><td colspan="8" style="text-align:center; padding:2rem;">Aucune annonce</td></tr>' :
                                    annonces.map(a => `
                                        <tr>
                                            <td><strong>${a.est_epinglee ? '📌 ' : ''}${escapeHtml(a.titre)}</strong></td>
                                            <td><span class="badge ${a.priorite === 'URGENTE' ? 'badge-danger' : a.priorite === 'IMPORTANTE' ? 'badge-warning' : 'badge-info'}">${escapeHtml(a.priorite)}</span></td>
                                            <td><span class="badge badge-info">${escapeHtml(a.destinataires)}</span></td>
                                            <td><small>📤 ${escapeHtml(a.publiee_par)}</small></td>
                                            <td>${a.est_epinglee ? '📌' : '—'}</td>
                                            <td>${a.est_active ? '<span class="badge badge-success">✅</span>' : '<span class="badge badge-danger">❌</span>'}</td>
                                            <td><small>${formatDateTime(a.date_publication)}</small></td>
                                            <td><small>${a.date_expiration ? formatDateTime(a.date_expiration) : 'Sans expiration'}</small></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="responsive-mobile-view">
                        ${annonces.map(a => `
                            <div class="responsive-card">
                                <div class="responsive-card-header">
                                    <div><strong>${a.est_epinglee ? '📌 ' : ''}${escapeHtml(a.titre)}</strong></div>
                                    <span class="badge ${a.priorite === 'URGENTE' ? 'badge-danger' : 'badge-info'}">${escapeHtml(a.priorite)}</span>
                                </div>
                                <div class="responsive-card-body">
                                    <div class="responsive-card-row"><span class="responsive-card-label">📤 Par</span><span>${escapeHtml(a.publiee_par)}</span></div>
                                    <div class="responsive-card-row"><span class="responsive-card-label">📥 Pour</span><span>${escapeHtml(a.destinataires)}</span></div>
                                    <div class="responsive-card-row"><span class="responsive-card-label">📅 Publiée</span><span>${formatDateTime(a.date_publication)}</span></div>
                                    <div class="responsive-card-row"><span class="responsive-card-label">✅ Active</span><span>${a.est_active ? 'Oui' : 'Non'}</span></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}



function renderAdmHistorique() {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">📜 Historique des Modifications</h4>
            <button class="btn btn-outline btn-sm" onclick="chargerHistorique()">🔄 Charger</button>
        </div>
        <div id="historiqueContenu">
            <div style="text-align:center; padding:2rem; color:var(--text-light);">
                <p>Cliquez sur "Charger" pour afficher l'historique des modifications</p>
            </div>
        </div>
    `;
}

async function chargerHistorique() {
    const container = document.getElementById('historiqueContenu');
    if (!container) return;

    container.innerHTML = '<div class="loading-screen" style="min-height:200px;"><div class="spinner"></div><p>Chargement...</p></div>';

    try {
        const data = await apiGet('/api/administration/historique/');
        const items = Array.isArray(data) ? data : (data.results || []);

        if (items.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📜</div><h3>Aucune modification enregistrée</h3></div>';
            return;
        }

        const actionIcons = { 'CREATION': '➕', 'MODIFICATION': '✏️', 'SUPPRESSION': '🗑️' };
        const actionColors = { 'CREATION': 'var(--success)', 'MODIFICATION': 'var(--info)', 'SUPPRESSION': 'var(--danger)' };

        container.innerHTML = `
            <p class="scroll-hint">👆 Faites défiler horizontalement →</p>
            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead><tr><th></th><th>Date</th><th>Utilisateur</th><th>Action</th><th>Module</th><th>Objet</th><th>Détails</th></tr></thead>
                        <tbody>
                            ${items.map(h => `
                                <tr>
                                    <td>${actionIcons[h.action] || '📝'}</td>
                                    <td><small>${timeAgo(h.date_modification)}</small></td>
                                    <td><strong>${escapeHtml(h.utilisateur_nom || 'Système')}</strong></td>
                                    <td><span class="badge" style="background:${actionColors[h.action] || 'var(--info)'}20; color:${actionColors[h.action] || 'var(--info)'};">${escapeHtml(h.action_display || h.action)}</span></td>
                                    <td><small>${escapeHtml(h.module)}/${escapeHtml(h.objet_type)}</small></td>
                                    <td><small>${escapeHtml((h.objet_representation || '').substring(0, 50))}</small></td>
                                    <td>
                                        ${h.champs_modifies && h.champs_modifies.length > 0 ?
                                            `<button class="btn btn-sm btn-outline" onclick="voirDetailsModification(${h.id})" title="Voir détails">👁️</button>` :
                                            `<small>${escapeHtml((h.resume || '').substring(0, 60))}</small>`
                                        }
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="responsive-mobile-view">
                ${items.map(h => `
                    <div class="responsive-card" style="border-left:3px solid ${actionColors[h.action] || 'var(--info)'};">
                        <div class="responsive-card-header">
                            <div>
                                <strong>${actionIcons[h.action] || '📝'} ${escapeHtml(h.action_display || h.action)}</strong>
                                <br><small>${escapeHtml(h.utilisateur_nom || 'Système')} — ${timeAgo(h.date_modification)}</small>
                            </div>
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row"><span class="responsive-card-label">📦 Module</span><span>${escapeHtml(h.module)}/${escapeHtml(h.objet_type)}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📝 Résumé</span><span><small>${escapeHtml((h.resume || '').substring(0, 100))}</small></span></div>
                        </div>
                        ${h.champs_modifies && h.champs_modifies.length > 0 ?
                            `<div class="responsive-card-footer"><button class="btn btn-sm btn-outline" onclick="voirDetailsModification(${h.id})">👁️ Détails</button></div>` : ''
                        }
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        container.innerHTML = `<div class="alert alert-danger"><span>❌</span><span>${error.message}</span></div>`;
    }
}

async function voirDetailsModification(id) {
    try {
        const h = await apiGet(`/api/administration/historique/${id}/`);
        const existant = document.getElementById('modalCreation'); if (existant) existant.remove();

        const actionIcons = { 'CREATION': '➕', 'MODIFICATION': '✏️', 'SUPPRESSION': '🗑️' };

        const modal = document.createElement('div'); modal.id = 'modalCreation';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
        modal.innerHTML = `
            <div style="background:white; border-radius:16px; width:100%; max-width:700px; max-height:90vh; overflow-y:auto;">
                <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                    <h3 style="color:var(--primary);">${actionIcons[h.action] || '📝'} Détail de la modification</h3>
                    <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.5rem; cursor:pointer;">✕</button>
                </div>
                <div style="padding:1.5rem;">
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">📋 Informations</div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.3rem;">
                            <div class="detail-row"><span class="detail-label">Action</span><span class="detail-value"><span class="badge badge-info">${escapeHtml(h.action_display || h.action)}</span></span></div>
                            <div class="detail-row"><span class="detail-label">Par</span><span class="detail-value"><strong>${escapeHtml(h.utilisateur_nom || 'Système')}</strong></span></div>
                            <div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">${formatDateTime(h.date_modification)}</span></div>
                            <div class="detail-row"><span class="detail-label">IP</span><span class="detail-value">${escapeHtml(h.ip_address || 'N/A')}</span></div>
                            <div class="detail-row"><span class="detail-label">Module</span><span class="detail-value">${escapeHtml(h.module)} / ${escapeHtml(h.objet_type)}</span></div>
                            <div class="detail-row"><span class="detail-label">Objet</span><span class="detail-value">${escapeHtml(h.objet_representation || 'N/A')}</span></div>
                        </div>
                    </div>

                    ${h.champs_modifies && h.champs_modifies.length > 0 ? `
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">🔄 Champs modifiés (${h.champs_modifies.length})</div>
                        <div class="table-container">
                            <table class="dash-table">
                                <thead><tr><th>Champ</th><th>Ancienne valeur</th><th>→</th><th>Nouvelle valeur</th></tr></thead>
                                <tbody>
                                    ${h.champs_modifies.map(mod => `
                                        <tr>
                                            <td><strong>${escapeHtml(mod.champ)}</strong></td>
                                            <td style="background:#ffebee; color:var(--danger);"><small>${escapeHtml(mod.ancien || '(vide)')}</small></td>
                                            <td style="text-align:center;">→</td>
                                            <td style="background:#e8f5e9; color:var(--success);"><small>${escapeHtml(mod.nouveau || '(vide)')}</small></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    ` : ''}

                    ${h.resume ? `
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">📝 Résumé</div>
                        <p style="margin:0;">${escapeHtml(h.resume)}</p>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
        document.body.appendChild(modal); modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    } catch(e) { alert(e.message); }
}