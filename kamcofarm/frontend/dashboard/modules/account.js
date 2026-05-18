// ========================================
// MODULE ACCOUNTS — GESTION DES COMPTES
// ========================================

async function loadAccountsModule() {
    const area = document.getElementById('contentArea');

    try {
        const usersData = await apiGet('/api/accounts/users/');
        const userList = Array.isArray(usersData) ? usersData : (usersData.results || []);

        const actifs = userList.filter(u => u.is_active).length;
        const staff = userList.filter(u => u.is_staff).length;
        const admins = userList.filter(u => u.role === 'ADMIN' || u.is_superuser).length;

        // Compter par rôle
        const parRole = {};
        userList.forEach(u => {
            const role = u.role_display || u.role || 'N/A';
            parRole[role] = (parRole[role] || 0) + 1;
        });

        area.innerHTML = `
            <!-- Stats -->
            <div class="stats-row">
                <div class="stat-card">
                    <div class="stat-card-icon blue">👥</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${userList.length}</div>
                        <div class="stat-card-label">Total comptes</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon green">✅</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${actifs}</div>
                        <div class="stat-card-label">Actifs</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon purple">🔑</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${staff}</div>
                        <div class="stat-card-label">Staff</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon red">👑</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${admins}</div>
                        <div class="stat-card-label">Administrateurs</div>
                    </div>
                </div>
            </div>

            <!-- Répartition par rôle -->
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:1.5rem;">
                ${Object.entries(parRole).map(([role, nb]) => `
                    <div style="background:white; border-radius:8px; padding:0.5rem 1rem; box-shadow:var(--shadow); display:flex; align-items:center; gap:0.5rem;">
                        <span class="badge badge-info">${nb}</span>
                        <small>${escapeHtml(role)}</small>
                    </div>
                `).join('')}
            </div>

            <!-- Tableau -->
            <div class="card">
                <div class="card-header">
                    <h3>👥 Comptes Utilisateurs</h3>
                    <div class="card-header-actions">
                        <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireAccount()">+ Nouveau compte</button>
                        <button class="btn-export" onclick="exporterOngletActifExcel('Comptes_Utilisateurs')">📊 Excel</button>
                    </div>
                </div>
                <div class="card-body">
                    ${renderAccountsTable(userList)}
                </div>
            </div>
        `;

    } catch (error) {
        showError(`Comptes : ${error.message}`);
    }
}

function renderAccountsTable(userList) {
    const searchValue = getSearchValue('accounts');
    let filtered = userList;
    if (searchValue) {
        filtered = filterLocally(filtered, searchValue, ['username', 'first_name', 'last_name', 'email', 'role_display']);
    }
    const filterRole = getFilterValue('accounts', 'role_acc');
    if (filterRole) {
        filtered = filtered.filter(u => u.role === filterRole);
    }
    
    return `
        ${renderSearchBar({
            placeholder: 'Rechercher un compte...',
            moduleRedirect: 'accounts',
            filters: [{
                key: 'role_acc', label: 'Rôle',
                options: [
                    {value:'ADMIN', label:'Administrateur'}, {value:'DIR', label:'Directeur'},
                    {value:'RH', label:'RH'}, {value:'COMPTA', label:'Comptable'},
                    {value:'COMM', label:'Commercial'}, {value:'LOG', label:'Logistique'},
                    {value:'AGRI', label:'Agent terrain'}, {value:'VISITOR', label:'Visiteur'}
                ]
            }]
        })}

        ${filtered.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">👥</div><h3>Aucun compte</h3></div>' : `
            <p class="scroll-hint">👆 Faites défiler horizontalement →</p>
            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead><tr>
                            <th>Utilisateur</th>
                            <th>Contact</th>
                            <th>Rôle</th>
                            <th>Département</th>
                            <th>Statut</th>
                            <th>Activité</th>
                            <th>Actions</th>
                        </tr></thead>
                        <tbody>
                            ${filtered.map(u => `
                                <tr ${!u.is_active ? 'style="opacity:0.5;"' : ''}>
                                    <td>
                                        <strong>${escapeHtml(u.username)}</strong>
                                        <br><small style="color:var(--text-light);">${escapeHtml(u.nom_complet || u.first_name + ' ' + u.last_name || '')}</small>
                                    </td>
                                    <td>
                                        ${u.email ? `<a href="mailto:${u.email}" style="color:var(--primary); font-size:0.8rem;">📧 ${escapeHtml(u.email)}</a><br>` : ''}
                                        ${u.phone ? `<small>📞 ${escapeHtml(u.phone)}</small>` : ''}
                                        ${!u.email && !u.phone ? '<small style="color:var(--text-light);">N/A</small>' : ''}
                                    </td>
                                    <td>
                                        <span class="badge ${u.role === 'ADMIN' ? 'badge-danger' : u.role === 'DIR' ? 'badge-purple' : 'badge-info'}">${escapeHtml(u.role_display || u.role)}</span>
                                    </td>
                                    <td><small>${escapeHtml(u.department || 'N/A')}</small></td>
                                    <td>
                                        <div style="display:flex; gap:0.3rem; flex-wrap:wrap;">
                                            ${u.is_active ? '<span class="badge badge-success" title="Actif" style="font-size:0.65rem;">✅ Actif</span>' : '<span class="badge badge-danger" title="Inactif" style="font-size:0.65rem;">❌ Inactif</span>'}
                                            ${u.is_staff ? '<span class="badge badge-purple" title="Staff" style="font-size:0.65rem;">🔑 Staff</span>' : ''}
                                            ${u.a_profil_employe ? '<span class="badge badge-info" title="Profil RH" style="font-size:0.65rem;">👤 RH</span>' : ''}
                                            ${u.is_superuser ? '<span class="badge badge-danger" title="Superuser" style="font-size:0.65rem;">👑</span>' : ''}
                                        </div>
                                    </td>
                                    <td>
                                        <small>${u.last_login ? '🟢 ' + timeAgo(u.last_login) : '🔴 Jamais'}</small>
                                        <br><small style="color:var(--text-light);">Inscrit ${formatDate(u.date_joined)}</small>
                                    </td>
                                    <td>
                                        <div class="item-actions">
                                            <button class="btn btn-sm btn-outline" onclick="voirDetailAccount(${u.id})" title="Détail">👁️</button>
                                            <button class="btn btn-sm btn-outline" onclick="editerAccount(${u.id})" title="Modifier">✏️</button>
                                            <button class="btn btn-sm btn-success" onclick="changerRoleAccount(${u.id})" title="Rôle">🔑</button>
                                            ${!u.is_superuser ? `<button class="btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-success'}" onclick="toggleActivationAccount(${u.id})" title="${u.is_active ? 'Désactiver' : 'Activer'}">${u.is_active ? '🔒' : '🔓'}</button>` : ''}
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="responsive-mobile-view">
                ${filtered.map(u => `
                    <div class="responsive-card" ${!u.is_active ? 'style="opacity:0.5;"' : ''}>
                        <div class="responsive-card-header">
                            <div>
                                <strong>${escapeHtml(u.nom_complet || u.username)}</strong>
                                <br><small>@${escapeHtml(u.username)}</small>
                            </div>
                            <span class="badge ${u.role === 'ADMIN' ? 'badge-danger' : u.role === 'DIR' ? 'badge-purple' : 'badge-info'}">${escapeHtml(u.role_display || u.role)}</span>
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row">
                                <span class="responsive-card-label">📬 Contact</span>
                                <span>
                                    ${u.email ? `<a href="mailto:${u.email}" style="color:var(--primary); font-size:0.85rem;">${escapeHtml(u.email)}</a>` : ''}
                                    ${u.email && u.phone ? '<br>' : ''}
                                    ${u.phone ? `📞 ${escapeHtml(u.phone)}` : ''}
                                    ${!u.email && !u.phone ? 'N/A' : ''}
                                </span>
                            </div>
                            <div class="responsive-card-row"><span class="responsive-card-label">🏢 Département</span><span>${escapeHtml(u.department || 'N/A')}</span></div>
                            <div class="responsive-card-row">
                                <span class="responsive-card-label">📊 Statut</span>
                                <span style="display:flex; gap:0.2rem; flex-wrap:wrap;">
                                    ${u.is_active ? '<span class="badge badge-success" style="font-size:0.65rem;">✅ Actif</span>' : '<span class="badge badge-danger" style="font-size:0.65rem;">❌ Inactif</span>'}
                                    ${u.is_staff ? '<span class="badge badge-purple" style="font-size:0.65rem;">🔑 Staff</span>' : ''}
                                    ${u.a_profil_employe ? '<span class="badge badge-info" style="font-size:0.65rem;">👤 RH</span>' : ''}
                                </span>
                            </div>
                            <div class="responsive-card-row"><span class="responsive-card-label">🕐 Connexion</span><span>${u.last_login ? '🟢 ' + timeAgo(u.last_login) : '🔴 Jamais'}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📅 Inscription</span><span>${formatDate(u.date_joined)}</span></div>
                        </div>
                        <div class="responsive-card-footer">
                            <button class="btn btn-sm btn-outline" onclick="voirDetailAccount(${u.id})">👁️</button>
                            <button class="btn btn-sm btn-outline" onclick="editerAccount(${u.id})">✏️</button>
                            <button class="btn btn-sm btn-success" onclick="changerRoleAccount(${u.id})">🔑</button>
                            ${!u.is_superuser ? `<button class="btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-success'}" onclick="toggleActivationAccount(${u.id})">${u.is_active ? '🔒' : '🔓'}</button>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}

// DÉTAIL
async function voirDetailAccount(id) {
    try {
        const u = await apiGet(`/api/accounts/users/${id}/`);
        const existant = document.getElementById('modalCreation'); if (existant) existant.remove();

        const modal = document.createElement('div'); modal.id = 'modalCreation';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
        modal.innerHTML = `
            <div style="background:white; border-radius:16px; width:100%; max-width:650px; max-height:90vh; overflow-y:auto;">
                <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                    <h3 style="color:var(--primary);">👤 ${escapeHtml(u.nom_complet || u.username)}</h3>
                    <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.5rem; cursor:pointer;">✕</button>
                </div>
                <div style="padding:1.5rem;">
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">🪪 Identité</div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.3rem;">
                            <div class="detail-row"><span class="detail-label">Username</span><span class="detail-value"><strong>@${escapeHtml(u.username)}</strong></span></div>
                            <div class="detail-row"><span class="detail-label">Nom complet</span><span class="detail-value">${escapeHtml(u.nom_complet || 'N/A')}</span></div>
                            <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${u.email ? `<a href="mailto:${u.email}">${escapeHtml(u.email)}</a>` : 'N/A'}</span></div>
                            <div class="detail-row"><span class="detail-label">Téléphone</span><span class="detail-value">${escapeHtml(u.phone || 'N/A')}</span></div>
                        </div>
                    </div>
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">🔑 Rôle & Permissions</div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.3rem;">
                            <div class="detail-row"><span class="detail-label">Rôle</span><span class="detail-value"><span class="badge ${u.role === 'ADMIN' ? 'badge-danger' : 'badge-info'}">${escapeHtml(u.role_display || u.role)}</span></span></div>
                            <div class="detail-row"><span class="detail-label">Département</span><span class="detail-value">${escapeHtml(u.department || 'N/A')}</span></div>
                            <div class="detail-row"><span class="detail-label">Staff</span><span class="detail-value">${u.is_staff ? '✅ Oui' : '❌ Non'}</span></div>
                            <div class="detail-row"><span class="detail-label">Superuser</span><span class="detail-value">${u.is_superuser ? '👑 Oui' : '❌ Non'}</span></div>
                            <div class="detail-row"><span class="detail-label">Actif</span><span class="detail-value">${u.is_active ? '✅ Oui' : '❌ Non'}</span></div>
                            <div class="detail-row"><span class="detail-label">Profil employé</span><span class="detail-value">${u.a_profil_employe ? '👤 Oui' : '❌ Non'}</span></div>
                        </div>
                    </div>
                    <div class="detail-fieldset">
                        <div class="detail-fieldset-title">📅 Activité</div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.3rem;">
                            <div class="detail-row"><span class="detail-label">Inscription</span><span class="detail-value">${formatDateTime(u.date_joined)}</span></div>
                            <div class="detail-row"><span class="detail-label">Dernière connexion</span><span class="detail-value">${u.last_login ? formatDateTime(u.last_login) : 'Jamais connecté'}</span></div>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button class="btn btn-outline" onclick="this.closest('#modalCreation').remove(); editerAccount(${u.id})">✏️ Modifier</button>
                        <button class="btn btn-success" onclick="this.closest('#modalCreation').remove(); changerRoleAccount(${u.id})">🔑 Rôle</button>
                        <button class="btn btn-outline" onclick="this.closest('#modalCreation').remove(); resetPasswordAccount(${u.id})">🔄 Reset MDP</button>
                        <button class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Fermer</button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(modal); modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    } catch(e) { alert(e.message); }
}

// FORMULAIRE CRÉATION/ÉDITION
async function ouvrirFormulaireAccount(editData = null) {
    const existant = document.getElementById('modalCreation'); if (existant) existant.remove();
    const titre = editData ? `Modifier @${editData.username}` : 'Nouveau compte';
    const endpoint = editData ? `/api/accounts/users/${editData.id}/` : '/api/accounts/users/';

    const modal = document.createElement('div'); modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:650px; max-height:90vh; overflow-y:auto;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">${editData ? '✏️' : '➕'} ${titre}</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="accForm" style="padding:1.5rem;">
                <div class="form-section"><div class="form-section-title">🪪 Identité</div>
                    <div class="form-grid">
                        <div class="form-field"><label>Username <span class="required">*</span></label><input type="text" id="accUsername" value="${escapeHtml(editData?.username || '')}" required ${editData ? 'readonly' : ''}></div>
                        <div class="form-field"><label>Email</label><input type="email" id="accEmail" value="${escapeHtml(editData?.email || '')}"></div>
                        <div class="form-field"><label>Prénom</label><input type="text" id="accPrenom" value="${escapeHtml(editData?.first_name || '')}"></div>
                        <div class="form-field"><label>Nom</label><input type="text" id="accNom" value="${escapeHtml(editData?.last_name || '')}"></div>
                        <div class="form-field"><label>Téléphone</label><input type="text" id="accPhone" value="${escapeHtml(editData?.phone || '')}"></div>
                        <div class="form-field"><label>Département</label><input type="text" id="accDept" value="${escapeHtml(editData?.department || '')}"></div>
                    </div>
                </div>
                ${!editData ? `
                <div class="form-section"><div class="form-section-title">🔐 Mot de passe</div>
                    <div class="form-grid">
                        <div class="form-field full-width"><label>Mot de passe <span class="required">*</span></label><input type="password" id="accPassword" required minlength="8"><span class="field-help">Minimum 8 caractères</span></div>
                    </div>
                </div>
                ` : ''}
                <div class="form-section"><div class="form-section-title">🔑 Rôle & Permissions</div>
                    <div class="form-grid">
                        <div class="form-field"><label>Rôle <span class="required">*</span></label>
                            <select id="accRole" required>
                                <option value="VISITOR" ${editData?.role === 'VISITOR' ? 'selected' : ''}>Visiteur</option>
                                <option value="AGRI" ${editData?.role === 'AGRI' ? 'selected' : ''}>Agent terrain</option>
                                <option value="LOG" ${editData?.role === 'LOG' ? 'selected' : ''}>Logistique</option>
                                <option value="COMM" ${editData?.role === 'COMM' ? 'selected' : ''}>Commercial</option>
                                <option value="COMPTA" ${editData?.role === 'COMPTA' ? 'selected' : ''}>Comptable</option>
                                <option value="RH" ${editData?.role === 'RH' ? 'selected' : ''}>Ressources Humaines</option>
                                <option value="DIR" ${editData?.role === 'DIR' ? 'selected' : ''}>Directeur Général</option>
                                <option value="ADMIN" ${editData?.role === 'ADMIN' ? 'selected' : ''}>Administrateur</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-checkbox"><input type="checkbox" id="accStaff" ${editData?.is_staff ? 'checked' : ''}><label for="accStaff">🔑 Accès staff (administration)</label></div>
                    <div class="form-checkbox"><input type="checkbox" id="accActif" ${editData?.is_active !== false ? 'checked' : ''}><label for="accActif">✅ Compte actif</label></div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 ${editData ? 'Enregistrer' : 'Créer le compte'}</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="accError" style="color:var(--danger); text-align:center; white-space:pre-wrap;"></p>
            </form>
        </div>`;
    document.body.appendChild(modal); modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('accForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const payload = {
                first_name: document.getElementById('accPrenom')?.value || '',
                last_name: document.getElementById('accNom')?.value || '',
                role: document.getElementById('accRole').value,
                is_staff: document.getElementById('accStaff').checked,
                is_active: document.getElementById('accActif').checked,
                phone: document.getElementById('accPhone')?.value || '',
                department: document.getElementById('accDept')?.value || ''
            };
            const email = document.getElementById('accEmail')?.value?.trim();
            if (email) payload.email = email;

            if (!editData) {
                payload.username = document.getElementById('accUsername').value;
                payload.password = document.getElementById('accPassword').value;
            }

            if (editData) { await apiPatch(endpoint, payload); } else { await apiPost(endpoint, payload); }
            modal.remove(); navigateTo('accounts');
        } catch (error) { document.getElementById('accError').textContent = error.message; }
    });
}

async function editerAccount(id) {
    try { const u = await apiGet(`/api/accounts/users/${id}/`); ouvrirFormulaireAccount(u); } catch(e) { alert(e.message); }
}

// CHANGER RÔLE
async function changerRoleAccount(id) {
    const roles = [
        {value:'VISITOR', label:'👤 Visiteur'}, {value:'AGRI', label:'🌱 Agent terrain'},
        {value:'LOG', label:'🚚 Logistique'}, {value:'COMM', label:'📣 Commercial'},
        {value:'COMPTA', label:'💰 Comptable'}, {value:'RH', label:'👥 RH'},
        {value:'DIR', label:'👔 Directeur Général'}, {value:'ADMIN', label:'👑 Administrateur'}
    ];
    const existant = document.getElementById('modalCreation'); if (existant) existant.remove();
    const modal = document.createElement('div'); modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:400px;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border);"><h3 style="color:var(--primary);">🔑 Changer le rôle</h3></div>
            <div style="padding:1.5rem; display:flex; flex-direction:column; gap:0.5rem;">
                ${roles.map(r => `<button class="btn btn-outline" onclick="confirmerRoleAccount(${id}, '${r.value}')">${r.label}</button>`).join('')}
                <button class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
            </div>
        </div>`;
    document.body.appendChild(modal); modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

async function confirmerRoleAccount(id, role) {
    try { await apiPost(`/api/accounts/users/${id}/changer_role/`, { role }); document.getElementById('modalCreation')?.remove(); navigateTo('accounts'); } catch(e) { alert(e.message); }
}

async function toggleActivationAccount(id) {
    if (!confirm('Activer/Désactiver ce compte ?')) return;
    try { await apiPost(`/api/accounts/users/${id}/activer_desactiver/`); navigateTo('accounts'); } catch(e) { alert(e.message); }
}

async function resetPasswordAccount(id) {
    const newPassword = prompt('Nouveau mot de passe :', 'FossAgro2026!');
    if (!newPassword) return;
    try {
        const result = await apiPost(`/api/accounts/users/${id}/reset_password/`, { password: newPassword });
        alert(`✅ ${result.message}\nNouveau mot de passe : ${result.nouveau_mot_de_passe}`);
    } catch(e) { alert(e.message); }
}