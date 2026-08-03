// ========================================
// MODULE ROLES — GESTION DU CATALOGUE DES RÔLES (CRUD COMPLET)
// ========================================

// Capacités (permissions) proposées à la création/édition d'un rôle.
// Ces clés correspondent aux classes de permissions backend (permissions.py).
const ROLE_CAPACITES = [
    { key: 'admin', label: '👑 Administration (accès complet)' },
    { key: 'direction', label: '🧭 Direction générale' },
    { key: 'finance', label: '💰 Finance & Comptabilité' },
    { key: 'rh', label: '👥 Ressources Humaines' },
    { key: 'logistique', label: '🚚 Logistique & Supply Chain' },
    { key: 'commercial', label: '📣 Commercial' },
    { key: 'marketing', label: '📢 Marketing' },
];

async function loadRolesModule() {
    const area = document.getElementById('contentArea');

    try {
        const rolesData = await apiGet('/api/accounts/roles/');
        const roles = Array.isArray(rolesData) ? rolesData : (rolesData.results || []);

        const actifs = roles.filter(r => r.est_actif).length;
        const totalCapacites = roles.reduce((n, r) => n + (Array.isArray(r.permissions) ? r.permissions.length : 0), 0);

        area.innerHTML = `
            <!-- Stats -->
            <div class="stats-row">
                <div class="stat-card">
                    <div class="stat-card-icon blue">🔑</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${roles.length}</div>
                        <div class="stat-card-label">Total rôles</div>
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
                    <div class="stat-card-icon purple">🛡️</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${totalCapacites}</div>
                        <div class="stat-card-label">Capacités attribuées</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3>🔑 Rôles de l'ERP</h3>
                    <div class="card-header-actions">
                        <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireRole()">+ Nouveau rôle</button>
                        <button class="btn-export" onclick="exporterOngletActifExcel('Roles')">📊 Excel</button>
                    </div>
                </div>
                <div class="card-body">
                    ${renderRolesTable(roles)}
                </div>
            </div>
        `;

    } catch (error) {
        showError(`Rôles : ${error.message}`);
    }
}

function renderRolesTable(roles) {
    const searchValue = getSearchValue('roles');
    let filtered = roles;
    if (searchValue) {
        filtered = filterLocally(filtered, searchValue, ['nom', 'code', 'description']);
    }
    const filtreActif = getFilterValue('roles', 'actif');
    if (filtreActif) {
        filtered = filtered.filter(r => filtreActif === 'actif' ? r.est_actif : !r.est_actif);
    }

    return `
        ${renderSearchBar({
            placeholder: 'Rechercher un rôle...',
            moduleRedirect: 'roles',
            filters: [{
                key: 'actif', label: 'Statut',
                options: [
                    { value: 'actif', label: 'Actifs' },
                    { value: 'inactif', label: 'Inactifs' }
                ]
            }]
        })}

        ${filtered.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">🔑</div><h3>Aucun rôle</h3></div>' : `
            <p class="scroll-hint">👆 Faites défiler horizontalement →</p>
            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead><tr>
                            <th>Nom</th>
                            <th>Code</th>
                            <th>Description</th>
                            <th>Capacités</th>
                            <th>Couleur</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr></thead>
                        <tbody>
                            ${filtered.map(r => `
                                <tr>
                                    <td><strong>${escapeHtml(r.nom)}</strong></td>
                                    <td><code>${escapeHtml(r.code)}</code></td>
                                    <td><small>${escapeHtml(r.description || '—')}</small></td>
                                    <td>
                                        <div style="display:flex; gap:0.25rem; flex-wrap:wrap;">
                                            ${(Array.isArray(r.permissions) && r.permissions.length) ? r.permissions.map(p => `<span class="badge badge-info">${escapeHtml(p)}</span>`).join('') : '<small style="color:var(--text-light);">Aucune</small>'}
                                        </div>
                                    </td>
                                    <td><span style="display:inline-block; width:18px; height:18px; border-radius:4px; background:${escapeHtml(r.couleur || '#188701')}; border:1px solid var(--border);"></span></td>
                                    <td>${r.est_actif ? '<span class="badge badge-success">✅ Actif</span>' : '<span class="badge badge-danger">❌ Inactif</span>'}</td>
                                    <td>
                                        <div class="item-actions">
                                            <button class="btn btn-sm btn-outline" onclick="editerRole(${r.id})" title="Modifier">✏️</button>
                                            <button class="btn btn-sm btn-danger" onclick="supprimerRole(${r.id})" title="Supprimer">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="responsive-mobile-view">
                ${filtered.map(r => `
                    <div class="responsive-card">
                        <div class="responsive-card-header">
                            <div><strong>${escapeHtml(r.nom)}</strong><br><small>@${escapeHtml(r.code)}</small></div>
                            ${r.est_actif ? '<span class="badge badge-success">✅</span>' : '<span class="badge badge-danger">❌</span>'}
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row"><span class="responsive-card-label">📝 Description</span><span>${escapeHtml(r.description || '—')}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">🛡️ Capacités</span><span>${(Array.isArray(r.permissions) && r.permissions.length) ? r.permissions.map(p => `<span class="badge badge-info">${escapeHtml(p)}</span>`).join(' ') : 'Aucune'}</span></div>
                        </div>
                        <div class="responsive-card-footer">
                            <button class="btn btn-sm btn-outline" onclick="editerRole(${r.id})">✏️</button>
                            <button class="btn btn-sm btn-danger" onclick="supprimerRole(${r.id})">🗑️</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}

// FORMULAIRE CRÉATION / ÉDITION
async function ouvrirFormulaireRole(editData = null) {
    const existant = document.getElementById('modalCreation'); if (existant) existant.remove();
    const titre = editData ? `Modifier le rôle « ${editData.nom} »` : 'Nouveau rôle';
    const endpoint = editData ? `/api/accounts/roles/${editData.id}/` : '/api/accounts/roles/';
    const perms = (editData && Array.isArray(editData.permissions)) ? editData.permissions : [];

    const modal = document.createElement('div'); modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:600px; max-height:90vh; overflow-y:auto;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">${editData ? '✏️' : '➕'} ${titre}</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="roleForm" style="padding:1.5rem;">
                <div class="form-section"><div class="form-section-title">🪪 Identité du rôle</div>
                    <div class="form-grid">
                        <div class="form-field"><label>Nom <span class="required">*</span></label><input type="text" id="roleNom" value="${escapeHtml(editData?.nom || '')}" required placeholder="Ex: Responsable Qualité"></div>
                        <div class="form-field"><label>Code <span class="required">*</span></label><input type="text" id="roleCode" value="${escapeHtml(editData?.code || '')}" required ${editData ? 'readonly' : ''} placeholder="Ex: QUALITE" style="text-transform:uppercase;"><span class="field-help">Doit correspondre au code utilisé pour les comptes (max 10 car.).</span></div>
                        <div class="form-field"><label>Couleur du badge</label><input type="color" id="roleCouleur" value="${escapeHtml(editData?.couleur || '#188701')}"></div>
                        <div class="form-field"><label>Ordre</label><input type="number" id="roleOrdre" value="${editData?.ordre || 0}" min="0"></div>
                    </div>
                </div>
                <div class="form-section"><div class="form-section-title">📝 Description</div>
                    <div class="form-grid">
                        <div class="form-field full-width"><textarea id="roleDesc" placeholder="Description du rôle...">${escapeHtml(editData?.description || '')}</textarea></div>
                    </div>
                </div>
                <div class="form-section"><div class="form-section-title">🛡️ Capacités (permissions)</div>
                    <div class="form-grid">
                        ${ROLE_CAPACITES.map(c => `
                            <div class="form-checkbox">
                                <input type="checkbox" id="cap_${c.key}" ${perms.includes(c.key) ? 'checked' : ''}>
                                <label for="cap_${c.key}">${c.label}</label>
                            </div>
                        `).join('')}
                    </div>
                    <span class="field-help">Ces capacités déterminent les accès du rôle (en complément des rôles standards).</span>
                </div>
                <div class="form-section">
                    <div class="form-checkbox"><input type="checkbox" id="roleActif" ${editData?.est_actif !== false ? 'checked' : ''}><label for="roleActif">✅ Rôle actif (disponible dans le formulaire de création d'utilisateur)</label></div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 ${editData ? 'Enregistrer' : 'Créer le rôle'}</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="roleError" style="color:var(--danger); text-align:center; white-space:pre-wrap;"></p>
            </form>
        </div>`;
    document.body.appendChild(modal); modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('roleForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const permissions = ROLE_CAPACITES.filter(c => document.getElementById('cap_' + c.key).checked).map(c => c.key);
            const payload = {
                nom: document.getElementById('roleNom').value,
                code: document.getElementById('roleCode').value.trim().toUpperCase(),
                description: document.getElementById('roleDesc').value || '',
                couleur: document.getElementById('roleCouleur').value,
                permissions: permissions,
                est_actif: document.getElementById('roleActif').checked,
                ordre: parseInt(document.getElementById('roleOrdre').value) || 0
            };
            if (!payload.code) throw new Error('Le code est requis.');
            if (editData) { await apiPatch(endpoint, payload); } else { await apiPost(endpoint, payload); }
            modal.remove(); navigateTo('roles');
        } catch (error) { document.getElementById('roleError').textContent = error.message; }
    });
}

async function editerRole(id) {
    try { const r = await apiGet(`/api/accounts/roles/${id}/`); ouvrirFormulaireRole(r); } catch (e) { alert(e.message); }
}

async function supprimerRole(id) {
    if (!confirm('Supprimer ce rôle ? Cette action est irréversible.')) return;
    try {
        await apiDelete(`/api/accounts/roles/${id}/`);
        navigateTo('roles');
    } catch (e) { alert(`Erreur : ${e.message}`); }
}
