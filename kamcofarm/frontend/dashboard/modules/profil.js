// ========================================
// MODULE PROFIL PERSONNEL
// ========================================

async function loadProfilModule() {
    const area = document.getElementById('contentArea');

    try {
        const data = await apiGet('/api/accounts/mon-profil/');
        const user = data.user || {};
        const employe = data.profil_employe;
        const conges = data.conges || [];
        const fichesPaie = data.fiches_paie || [];
        const presences = data.presences || [];
        const notifications = data.notifications || [];
        const taches = data.taches || [];
        const stats = data.stats || {};

        const typeIcons = { 'INFO': 'ℹ️', 'SUCCESS': '✅', 'WARNING': '⚠️', 'ERROR': '❌', 'TACHE': '📋' };

        area.innerHTML = `
            <!-- En-tête profil -->
            <div style="background:linear-gradient(135deg, var(--primary), var(--primary-light)); border-radius:16px; padding:2rem; color:white; margin-bottom:1.5rem; display:flex; align-items:center; gap:1.5rem; flex-wrap:wrap;">
                <div style="width:80px; height:80px; border-radius:50%; background:rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center; font-size:2rem; font-weight:bold;">
                    ${(user.first_name || user.username || 'U').charAt(0).toUpperCase()}${(user.last_name || '').charAt(0).toUpperCase()}
                </div>
                <div style="flex:1;">
                    <h2 style="margin:0; font-size:1.5rem;">${escapeHtml(user.nom_complet || user.username)}</h2>
                    <p style="margin:0.3rem 0; opacity:0.9;">@${escapeHtml(user.username)} — ${escapeHtml(user.role_display || user.role)}</p>
                    ${employe ? `<p style="margin:0; opacity:0.8; font-size:0.9rem;">${escapeHtml(employe.poste || '')} ${employe.departement_nom ? '— ' + escapeHtml(employe.departement_nom) : ''}</p>` : ''}
                </div>
                <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                    <button class="btn btn-sm" style="background:rgba(255,255,255,0.2); color:white; border:1px solid rgba(255,255,255,0.3);" onclick="ouvrirModifierProfil()">✏️ Modifier</button>
                    <button class="btn btn-sm" style="background:rgba(255,255,255,0.2); color:white; border:1px solid rgba(255,255,255,0.3);" onclick="ouvrirChangerMDP()">🔐 Mot de passe</button>
                </div>
            </div>

            <!-- Stats rapides -->
            <div class="stats-row">
                <div class="stat-card"><div class="stat-card-icon orange">📅</div><div class="stat-card-info"><div class="stat-card-value">${stats.conges_en_attente || 0}</div><div class="stat-card-label">Congés en attente</div></div></div>
                <div class="stat-card"><div class="stat-card-icon blue">💰</div><div class="stat-card-info"><div class="stat-card-value">${stats.fiches_paie || 0}</div><div class="stat-card-label">Bulletins</div></div></div>
                <div class="stat-card"><div class="stat-card-icon green">✅</div><div class="stat-card-info"><div class="stat-card-value">${stats.presences_ce_mois || 0}</div><div class="stat-card-label">Présences (mois)</div></div></div>
                <div class="stat-card"><div class="stat-card-icon red">🔔</div><div class="stat-card-info"><div class="stat-card-value">${stats.notifications_non_lues || 0}</div><div class="stat-card-label">Notifs non lues</div></div></div>
                <div class="stat-card"><div class="stat-card-icon purple">📋</div><div class="stat-card-info"><div class="stat-card-value">${stats.taches_en_cours || 0}</div><div class="stat-card-label">Tâches</div></div></div>
            </div>

            <!-- Onglets -->
            <div class="card">
                <div class="card-header" style="overflow-x:auto;">
                    <div class="tab-nav" style="flex-wrap:wrap; min-width:unset;">
                        <button class="tab-btn active" onclick="switchTab('profil', 'infos', this)">👤 Mes infos</button>
                        <button class="tab-btn" onclick="switchTab('profil', 'conges', this)">📅 Congés (${conges.length})</button>
                        <button class="tab-btn" onclick="switchTab('profil', 'paie', this)">💰 Bulletins (${fichesPaie.length})</button>
                        <button class="tab-btn" onclick="switchTab('profil', 'presences', this)">⏰ Présences (${presences.length})</button>
                        <button class="tab-btn" onclick="switchTab('profil', 'notifs', this)">🔔 Notifications (${notifications.length})</button>
                        <button class="tab-btn" onclick="switchTab('profil', 'taches', this)">📋 Tâches (${taches.length})</button>
                    </div>
                </div>
                <div class="card-body">
                    <!-- Infos -->
                    <div class="tab-content active" id="profil_infos" style="display:block;">
                        <div class="grid-2">
                            <div class="detail-fieldset">
                                <div class="detail-fieldset-title">🪪 Compte</div>
                                <div class="detail-row"><span class="detail-label">Username</span><span class="detail-value">@${escapeHtml(user.username)}</span></div>
                                <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${user.email ? `<a href="mailto:${user.email}">${escapeHtml(user.email)}</a>` : 'N/A'}</span></div>
                                <div class="detail-row"><span class="detail-label">Téléphone</span><span class="detail-value">${escapeHtml(user.phone || 'N/A')}</span></div>
                                <div class="detail-row"><span class="detail-label">Rôle</span><span class="detail-value"><span class="badge badge-info">${escapeHtml(user.role_display || user.role)}</span></span></div>
                                <div class="detail-row"><span class="detail-label">Département</span><span class="detail-value">${escapeHtml(user.department || 'N/A')}</span></div>
                                <div class="detail-row"><span class="detail-label">Inscription</span><span class="detail-value">${formatDate(user.date_joined)}</span></div>
                                <div class="detail-row"><span class="detail-label">Dernière connexion</span><span class="detail-value">${user.last_login ? formatDateTime(user.last_login) : 'N/A'}</span></div>
                            </div>
                            ${employe ? `
                            <div class="detail-fieldset">
                                <div class="detail-fieldset-title">💼 Profil Employé</div>
                                <div class="detail-row"><span class="detail-label">Matricule</span><span class="detail-value"><strong>${escapeHtml(employe.matricule)}</strong></span></div>
                                <div class="detail-row"><span class="detail-label">Poste</span><span class="detail-value">${escapeHtml(employe.poste || 'N/A')}</span></div>
                                <div class="detail-row"><span class="detail-label">Type contrat</span><span class="detail-value"><span class="badge badge-info">${escapeHtml(employe.type_contrat_display || employe.type_contrat || 'N/A')}</span></span></div>
                                <div class="detail-row"><span class="detail-label">Date embauche</span><span class="detail-value">${formatDate(employe.date_embauche)}</span></div>
                                <div class="detail-row"><span class="detail-label">Salaire base</span><span class="detail-value" style="font-weight:700; color:var(--primary);">${formatMoney(employe.salaire_base)}</span></div>
                                ${employe.age !== null ? `<div class="detail-row"><span class="detail-label">Âge</span><span class="detail-value">${employe.age} ans</span></div>` : ''}
                            </div>
                            ` : '<div class="alert alert-info"><span>ℹ️</span><span>Aucun profil employé associé à votre compte.</span></div>'}
                        </div>
                    </div>

                    <!-- Congés -->
                    <div class="tab-content" id="profil_conges" style="display:none;">
                        ${conges.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📅</div><h3>Aucun congé</h3></div>' : `
                            ${conges.map(c => `
                                <div class="responsive-card" style="margin-bottom:0.8rem; ${c.statut === 'APPROUVE' ? 'border-left:4px solid var(--success);' : c.statut === 'REFUSE' ? 'border-left:4px solid var(--danger);' : 'border-left:4px solid var(--warning);'}">
                                    <div class="responsive-card-header">
                                        <div><strong>${escapeHtml(c.type_display || c.type_conge)}</strong><br><small>${formatDate(c.date_debut)} → ${formatDate(c.date_fin)} (${c.nombre_jours}j)</small></div>
                                        <span class="badge ${getBadgeClass(c.statut)}">${escapeHtml(c.statut_display || c.statut)}</span>
                                    </div>
                                    <div class="responsive-card-body">
                                        <div class="responsive-card-row"><span class="responsive-card-label">📝 Motif</span><span><small>${escapeHtml((c.motif || '').substring(0, 100))}</small></span></div>
                                        ${c.commentaire_decision ? `<div class="responsive-card-row"><span class="responsive-card-label">💬 Décision</span><span><small>${escapeHtml(c.commentaire_decision)}</small></span></div>` : ''}
                                        ${c.approuve_par_nom ? `<div class="responsive-card-row"><span class="responsive-card-label">👤 Par</span><span>${escapeHtml(c.approuve_par_nom)}</span></div>` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        `}
                    </div>

                    <!-- Bulletins de paie -->
                    <div class="tab-content" id="profil_paie" style="display:none;">
                        ${fichesPaie.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">💰</div><h3>Aucun bulletin</h3></div>' : `
                            ${fichesPaie.map(f => `
                                <div class="responsive-card" style="margin-bottom:0.8rem;">
                                    <div class="responsive-card-header">
                                        <div><strong>${escapeHtml(f.mois_display || f.mois)} ${f.annee}</strong><br><small>${escapeHtml(f.reference)}</small></div>
                                        <span class="badge ${getBadgeClass(f.statut)}">${escapeHtml(f.statut_display || f.statut)}</span>
                                    </div>
                                    <div class="responsive-card-body">
                                        <div class="responsive-card-row"><span class="responsive-card-label">💰 Brut</span><span>${formatMoney(f.salaire_brut)}</span></div>
                                        <div class="responsive-card-row" style="border-top:2px solid var(--primary); padding-top:0.3rem;"><span class="responsive-card-label" style="font-weight:700;">💵 Net</span><span style="font-weight:800; color:var(--primary); font-size:1.1rem;">${formatMoney(f.salaire_net)}</span></div>
                                        ${f.payee_le ? `<div class="responsive-card-row"><span class="responsive-card-label">📅 Payé le</span><span>${formatDate(f.payee_le)}</span></div>` : ''}
                                    </div>
                                    <!-- <div class="responsive-card-footer" style="padding:0.5rem 1rem;">
                                        <button class="btn btn-sm btn-outline" onclick="choisirModeleBulletin(${f.id})" style="width:100%; justify-content:center;">📄 Télécharger le bulletin</button>
                                    </div> -->
                                </div>
                            `).join('')}
                        `}
                    </div>

                    <!-- Présences -->
                    <div class="tab-content" id="profil_presences" style="display:none;">
                        ${presences.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">⏰</div><h3>Aucune présence</h3></div>' : `
                            <div class="table-container">
                                <table class="dash-table">
                                    <thead><tr><th>Date</th><th>Arrivée</th><th>Départ</th><th>Statut</th><th>Note</th></tr></thead>
                                    <tbody>
                                        ${presences.map(p => `
                                            <tr>
                                                <td>${formatDate(p.date)}</td>
                                                <td>${escapeHtml(p.heure_arrivee || 'N/A')}</td>
                                                <td>${escapeHtml(p.heure_depart || 'N/A')}</td>
                                                <td><span class="badge ${getBadgeClass(p.statut)}">${escapeHtml(p.statut_display || p.statut)}</span></td>
                                                <td><small>${escapeHtml(p.commentaire || '')}</small></td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        `}
                    </div>

                    <!-- Notifications -->
                    <div class="tab-content" id="profil_notifs" style="display:none;">
                        ${notifications.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">🔔</div><h3>Aucune notification</h3></div>' : `
                            ${notifications.map(n => `
                                <div class="responsive-card" style="margin-bottom:0.5rem; ${!n.est_lue ? 'border-left:4px solid var(--info);' : ''}">
                                    <div class="responsive-card-header">
                                        <div><strong>${typeIcons[n.type_notification] || ''} ${escapeHtml(n.titre)}</strong><br><small>${timeAgo(n.date_creation)}</small></div>
                                        ${!n.est_lue ? '<span class="badge badge-info" style="font-size:0.65rem;">Nouveau</span>' : ''}
                                    </div>
                                    <div style="padding:0.5rem 1rem;"><small style="color:var(--text);">${escapeHtml((n.message || '').substring(0, 150))}</small></div>
                                </div>
                            `).join('')}
                        `}
                    </div>

                    <!-- Tâches -->
                    <div class="tab-content" id="profil_taches" style="display:none;">
                        ${taches.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📋</div><h3>Aucune tâche</h3></div>' : `
                            ${taches.map(t => `
                                <div class="responsive-card" style="margin-bottom:0.5rem; ${t.est_en_retard ? 'border-left:4px solid var(--danger);' : ''}">
                                    <div class="responsive-card-header">
                                        <div><strong>${escapeHtml(t.titre)}</strong></div>
                                        <span class="badge ${getBadgeClass(t.statut)}">${escapeHtml(t.statut_display || t.statut)}</span>
                                    </div>
                                    <div class="responsive-card-body">
                                        <div class="responsive-card-row"><span class="responsive-card-label">⚡ Priorité</span><span class="badge ${getBadgeClass(t.priorite)}">${escapeHtml(t.priorite_display || t.priorite)}</span></div>
                                        <div class="responsive-card-row"><span class="responsive-card-label">📅 Échéance</span><span>${formatDate(t.date_echeance) || 'N/A'} ${t.est_en_retard ? '⚠️' : ''}</span></div>
                                    </div>
                                </div>
                            `).join('')}
                        `}
                    </div>
                </div>
            </div>
        `;

    } catch (error) {
        showError(`Profil : ${error.message}`);
    }
}


// ========================================
// MODIFIER MON PROFIL
// ========================================
async function ouvrirModifierProfil() {
    const existant = document.getElementById('modalCreation'); if (existant) existant.remove();

    const user = AppState.user;

    const modal = document.createElement('div'); modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:500px;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border);"><h3 style="color:var(--primary);">✏️ Modifier mes informations</h3></div>
            <form id="profilForm" style="padding:1.5rem;">
                <div class="form-grid">
                    <div class="form-field"><label>Prénom</label><input type="text" id="profilPrenom" value="${escapeHtml(user?.first_name || '')}"></div>
                    <div class="form-field"><label>Nom</label><input type="text" id="profilNom" value="${escapeHtml(user?.last_name || '')}"></div>
                    <div class="form-field"><label>Email</label><input type="email" id="profilEmail" value="${escapeHtml(user?.email || '')}"></div>
                    <div class="form-field"><label>Téléphone</label><input type="text" id="profilPhone" value="${escapeHtml(user?.phone || '')}"></div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 Enregistrer</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                    <button class="btn btn-outline" onclick="telechargerMesDonnees()">📥 Télécharger mes données (RGPD)</button>
                    <button class="btn btn-outline" onclick="ouvrirFormulaireDroitsRGPD()">📋 Exercer mes droits</button>
                </div>
                <p id="profilError" style="color:var(--danger); text-align:center;"></p>
            </form>
        </div>`;
    document.body.appendChild(modal); modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('profilForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const payload = {
                first_name: document.getElementById('profilPrenom')?.value || '',
                last_name: document.getElementById('profilNom')?.value || '',
                phone: document.getElementById('profilPhone')?.value || ''
            };
            const email = document.getElementById('profilEmail')?.value?.trim();
            if (email) payload.email = email;

            const result = await apiPatch('/api/accounts/modifier-profil/', payload);
            AppState.user = result;
            updateUserUI();
            modal.remove();
            navigateTo('profil');
        } catch (error) { document.getElementById('profilError').textContent = error.message; }
    });
}


// ========================================
// CHANGER MON MOT DE PASSE
// ========================================
async function ouvrirChangerMDP() {
    const existant = document.getElementById('modalCreation'); if (existant) existant.remove();

    const modal = document.createElement('div'); modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:450px;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border);"><h3 style="color:var(--primary);">🔐 Changer mon mot de passe</h3></div>
            <form id="mdpForm" style="padding:1.5rem;">
                <div class="form-grid">
                    <div class="form-field full-width"><label>Ancien mot de passe <span class="required">*</span></label><input type="password" id="mdpAncien" required></div>
                    <div class="form-field full-width"><label>Nouveau mot de passe <span class="required">*</span></label><input type="password" id="mdpNouveau" required minlength="8"><span class="field-help">Minimum 8 caractères</span></div>
                    <div class="form-field full-width"><label>Confirmer <span class="required">*</span></label><input type="password" id="mdpConfirm" required></div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">🔐 Changer</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="mdpError" style="color:var(--danger); text-align:center;"></p>
                <p id="mdpSuccess" style="color:var(--success); text-align:center;"></p>
            </form>
        </div>`;
    document.body.appendChild(modal); modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('mdpForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = document.getElementById('mdpError');
        const successEl = document.getElementById('mdpSuccess');
        errorEl.textContent = ''; successEl.textContent = '';

        const nouveau = document.getElementById('mdpNouveau').value;
        const confirm = document.getElementById('mdpConfirm').value;

        if (nouveau !== confirm) { errorEl.textContent = 'Les mots de passe ne correspondent pas.'; return; }

        try {
            const result = await apiPost('/api/accounts/changer-mot-de-passe/', {
                ancien_mot_de_passe: document.getElementById('mdpAncien').value,
                nouveau_mot_de_passe: nouveau,
                confirmation: confirm
            });
            successEl.textContent = '✅ ' + result.message;
            setTimeout(() => { modal.remove(); }, 2000);
        } catch (error) { errorEl.textContent = error.message; }
    });
}



async function telechargerMesDonnees() {
    try {
        const data = await apiGet('/api/administration/rgpd/mes-donnees/');
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mes-donnees-kamco-farm.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        alert('✅ Vos données ont été téléchargées au format JSON.');
    } catch (error) {
        alert('Erreur : ' + error.message);
    }
}
