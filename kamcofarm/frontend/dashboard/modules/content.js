// ========================================
// MODULE CONTENU — CRUD COMPLET
// ========================================

async function loadContentModule() {
    const area = document.getElementById('contentArea');

    try {
        const dashData = await apiGet('/api/content/dashboard/').catch(() => null);
        const categoriesData = await apiGet('/api/content/categories/').catch(() => []);
        const pagesData = await apiGet('/api/content/pages/').catch(() => []);
        const documentsData = await apiGet('/api/content/documents/').catch(() => []);
        const mediasData = await apiGet('/api/content/medias/').catch(() => []);
        const faqsData = await apiGet('/api/content/faqs/').catch(() => []);

        const catList = Array.isArray(categoriesData) ? categoriesData : (categoriesData.results || []);
        const pageList = Array.isArray(pagesData) ? pagesData : (pagesData.results || []);
        const docList = Array.isArray(documentsData) ? documentsData : (documentsData.results || []);
        const mediaList = Array.isArray(mediasData) ? mediasData : (mediasData.results || []);
        const faqList = Array.isArray(faqsData) ? faqsData : (faqsData.results || []);

        area.innerHTML = `
            <!-- Stats -->
            <div class="stats-row">
                <div class="stat-card">
                    <div class="stat-card-icon green">📄</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${dashData?.pages?.publiees || pageList.length}</div>
                        <div class="stat-card-label">Pages publiées</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon blue">📁</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${dashData?.documents_internes || docList.length}</div>
                        <div class="stat-card-label">Documents</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon purple">🖼️</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${dashData?.medias || mediaList.length}</div>
                        <div class="stat-card-label">Médias</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon orange">❓</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${dashData?.faqs || faqList.length}</div>
                        <div class="stat-card-label">FAQs</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon teal">💾</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${dashData?.espace_disque_mo || 0} Mo</div>
                        <div class="stat-card-label">Espace disque</div>
                    </div>
                </div>
            </div>

            <!-- Onglets -->
            <div class="card">
                <div class="card-header" style="overflow-x:auto;">
                    <div class="tab-nav" style="flex-wrap:wrap; min-width:unset;">
                        <button class="tab-btn active" onclick="switchTab('cnt', 'pages', this)">📄 Pages (${pageList.length})</button>
                        <button class="tab-btn" onclick="switchTab('cnt', 'categories', this)">📂 Catégories (${catList.length})</button>
                        <button class="tab-btn" onclick="switchTab('cnt', 'documents', this)">📁 Documents (${docList.length})</button>
                        <button class="tab-btn" onclick="switchTab('cnt', 'medias', this)">🖼️ Médias (${mediaList.length})</button>
                        <button class="tab-btn" onclick="switchTab('cnt', 'faqs', this)">❓ FAQs (${faqList.length})</button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="tab-content active" id="cnt_pages" style="display:block;">${renderCntPages(pageList)}</div>
                    <div class="tab-content" id="cnt_categories" style="display:none;">${renderCntCategories(catList)}</div>
                    <div class="tab-content" id="cnt_documents" style="display:none;">${renderCntDocuments(docList)}</div>
                    <div class="tab-content" id="cnt_medias" style="display:none;">${renderCntMedias(mediaList)}</div>
                    <div class="tab-content" id="cnt_faqs" style="display:none;">${renderCntFaqs(faqList)}</div>
                </div>
            </div>
        `;

    } catch (error) {
        showError(`Contenu : ${error.message}`);
    }
}


// ========================================
// TAB : PAGES
// ========================================
function renderCntPages(pageList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">📄 Pages de Contenu</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireCntPage()">+ Nouvelle page</button>
        </div>
        ${pageList.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📄</div><h3>Aucune page</h3></div>' : `
            <p class="scroll-hint">👆 Faites défiler horizontalement →</p>
            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead><tr><th>Titre</th><th>Slug</th><th>Catégorie</th><th>Statut</th><th>Mise en avant</th><th>Auteur</th><th>Publication</th><th>Actions</th></tr></thead>
                        <tbody>
                            ${pageList.map(p => `
                                <tr>
                                    <td><strong>${escapeHtml(p.titre)}</strong></td>
                                    <td><code style="font-size:0.75rem;">${escapeHtml(p.slug)}</code></td>
                                    <td><small>${escapeHtml(p.categorie_nom || 'N/A')}</small></td>
                                    <td><span class="badge ${getBadgeClass(p.statut)}">${escapeHtml(p.statut_display || p.statut)}</span></td>
                                    <td>${p.est_mise_en_avant ? '⭐' : ''}</td>
                                    <td><small>${escapeHtml(p.auteur_nom || 'N/A')}</small></td>
                                    <td><small>${formatDate(p.date_publication)}</small></td>
                                    <td>
                                        <div class="item-actions">
                                            <button class="btn btn-sm btn-outline" onclick="editerCntPage('${escapeHtml(p.slug)}')" title="Modifier">✏️</button>
                                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/content/pages/${escapeHtml(p.slug)}/', 'content')" title="Supprimer">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="responsive-mobile-view">
                ${pageList.map(p => `
                    <div class="responsive-card">
                        <div class="responsive-card-header">
                            <div><strong>${escapeHtml(p.titre)}</strong><br><small>${escapeHtml(p.slug)}</small></div>
                            <span class="badge ${getBadgeClass(p.statut)}">${escapeHtml(p.statut_display || p.statut)}</span>
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row"><span class="responsive-card-label">📂 Catégorie</span><span>${escapeHtml(p.categorie_nom || 'N/A')}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">👤 Auteur</span><span>${escapeHtml(p.auteur_nom || 'N/A')}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📅 Publication</span><span>${formatDate(p.date_publication)}</span></div>
                        </div>
                        <div class="responsive-card-footer">
                            <button class="btn btn-sm btn-outline" onclick="editerCntPage('${escapeHtml(p.slug)}')">✏️</button>
                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/content/pages/${escapeHtml(p.slug)}/', 'content')">🗑️</button>
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
function renderCntCategories(catList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">📂 Catégories de Contenu</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireCntCategorie()">+ Nouvelle catégorie</button>
        </div>
        ${catList.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📂</div><h3>Aucune catégorie</h3></div>' : `
            <div class="table-container">
                <table class="dash-table">
                    <thead><tr><th>Nom</th><th>Slug</th><th>Icône</th><th>Nb pages</th><th>Active</th><th>Actions</th></tr></thead>
                    <tbody>
                        ${catList.map(c => `
                            <tr>
                                <td><strong>${escapeHtml(c.nom)}</strong></td>
                                <td><code>${escapeHtml(c.slug)}</code></td>
                                <td>${escapeHtml(c.icone || '📁')}</td>
                                <td><span class="badge badge-info">${c.nombre_pages || 0}</span></td>
                                <td>${c.est_active ? '<span class="badge badge-success">Oui</span>' : '<span class="badge badge-danger">Non</span>'}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline" onclick="editerCntCategorie(${c.id})">✏️</button>
                                    <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/content/categories/${c.id}/', 'content')">🗑️</button>
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
// TAB : DOCUMENTS
// ========================================
function renderCntDocuments(docList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">📁 Documents Internes</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireCntDocument()">+ Nouveau document</button>
        </div>
        ${docList.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📁</div><h3>Aucun document</h3></div>' : `
            <p class="scroll-hint">👆 Faites défiler horizontalement →</p>
            <div class="responsive-desktop-view">
                <div class="table-container">
                    <table class="dash-table">
                        <thead><tr><th>Titre</th><th>Type</th><th>Visibilité</th><th>Version</th><th>Taille</th><th>Ext.</th><th>Par</th><th>Date</th><th>Actions</th></tr></thead>
                        <tbody>
                            ${docList.map(d => `
                                <tr>
                                    <td><strong>${escapeHtml(d.titre)}</strong></td>
                                    <td><span class="badge badge-info">${escapeHtml(d.type_display || d.type_document)}</span></td>
                                    <td><span class="badge badge-purple">${escapeHtml(d.visibilite_display || d.visibilite)}</span></td>
                                    <td>v${escapeHtml(d.version || '1.0')}</td>
                                    <td><small>${escapeHtml(d.taille_formatee || 'N/A')}</small></td>
                                    <td><code>${escapeHtml(d.extension || '?')}</code></td>
                                    <td><small>${escapeHtml(d.uploade_par_nom || 'N/A')}</small></td>
                                    <td><small>${formatDate(d.date_upload)}</small></td>
                                    <td>
                                        <div class="item-actions">
                                            ${d.fichier_url ? `<a href="${d.fichier_url}" target="_blank" class="btn btn-sm btn-outline" title="Télécharger">📥</a>` : ''}
                                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/content/documents/${d.id}/', 'content')">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="responsive-mobile-view">
                ${docList.map(d => `
                    <div class="responsive-card">
                        <div class="responsive-card-header">
                            <div><strong>${escapeHtml(d.titre)}</strong><br><small>${escapeHtml(d.type_display || d.type_document)}</small></div>
                            <span class="badge badge-purple">${escapeHtml(d.visibilite_display || d.visibilite)}</span>
                        </div>
                        <div class="responsive-card-body">
                            <div class="responsive-card-row"><span class="responsive-card-label">📊 Taille</span><span>${escapeHtml(d.taille_formatee || 'N/A')}</span></div>
                            <div class="responsive-card-row"><span class="responsive-card-label">📅 Date</span><span>${formatDate(d.date_upload)}</span></div>
                        </div>
                        <div class="responsive-card-footer">
                            ${d.fichier_url ? `<a href="${d.fichier_url}" target="_blank" class="btn btn-sm btn-outline">📥 Télécharger</a>` : ''}
                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/content/documents/${d.id}/', 'content')">🗑️</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}


// ========================================
// TAB : MÉDIAS
// ========================================
function renderCntMedias(mediaList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">🖼️ Fichiers Médias</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireCntMedia()">+ Nouveau média</button>
        </div>
        ${mediaList.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">🖼️</div><h3>Aucun média</h3></div>' : `
            <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:1rem;">
                ${mediaList.map(m => `
                    <div style="background:white; border-radius:12px; overflow:hidden; box-shadow:var(--shadow);">
                        ${m.type_media === 'IMAGE' && m.fichier_url ?
                            `<img src="${m.fichier_url}" style="width:100%; height:140px; object-fit:cover;">` :
                            `<div style="width:100%; height:140px; background:var(--bg); display:flex; align-items:center; justify-content:center; font-size:2.5rem;">${m.type_media === 'VIDEO' ? '🎬' : m.type_media === 'AUDIO' ? '🎵' : '📄'}</div>`
                        }
                        <div style="padding:0.8rem;">
                            <strong style="font-size:0.85rem;">${escapeHtml(m.nom)}</strong>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.5rem;">
                                <span class="badge badge-info" style="font-size:0.7rem;">${escapeHtml(m.type_display || m.type_media)}</span>
                                <small>${escapeHtml(m.taille_formatee || '')}</small>
                            </div>
                            <div style="display:flex; gap:0.3rem; margin-top:0.5rem;">
                                ${m.fichier_url ? `<a href="${m.fichier_url}" target="_blank" class="btn btn-sm btn-outline" style="flex:1; justify-content:center;">📥</a>` : ''}
                                <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/content/medias/${m.id}/', 'content')" style="flex:1; justify-content:center;">🗑️</button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}


// ========================================
// TAB : FAQs
// ========================================
function renderCntFaqs(faqList) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">❓ Questions Fréquentes (FAQ)</h4>
            <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireCntFaq()">+ Nouvelle FAQ</button>
        </div>
        ${faqList.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">❓</div><h3>Aucune FAQ</h3></div>' : `
            ${faqList.map(f => `
                <div style="background:white; border-radius:12px; padding:1rem; margin-bottom:0.8rem; box-shadow:var(--shadow); border-left:4px solid var(--primary);">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div style="flex:1;">
                            <strong style="color:var(--primary);">❓ ${escapeHtml(f.question)}</strong>
                            <p style="margin:0.5rem 0 0; color:var(--text); line-height:1.6;">${escapeHtml(f.reponse)}</p>
                            <small style="color:var(--text-light);">Catégorie : ${escapeHtml(f.categorie_nom || 'N/A')} | Ordre : ${f.ordre}</small>
                        </div>
                        <div style="display:flex; gap:0.3rem; margin-left:0.5rem;">
                            <button class="btn btn-sm btn-outline" onclick="editerCntFaq(${f.id})">✏️</button>
                            <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/content/faqs/${f.id}/', 'content')">🗑️</button>
                        </div>
                    </div>
                </div>
            `).join('')}
        `}
    `;
}


// ========================================
// FORMULAIRES CRUD
// ========================================

// PAGE
async function ouvrirFormulaireCntPage(editData = null) {
    const existant = document.getElementById('modalCreation'); if (existant) existant.remove();
    let categories = [];
    try { const r = await apiGet('/api/content/categories/'); categories = Array.isArray(r) ? r : (r.results || []); } catch(e) {}

    const titre = editData ? 'Modifier page' : 'Nouvelle page';
    const endpoint = editData ? `/api/content/pages/${editData.slug}/` : '/api/content/pages/';

    const modal = document.createElement('div'); modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:750px; max-height:90vh; overflow-y:auto;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <h3 style="color:var(--primary);">${editData ? '✏️' : '➕'} ${titre}</h3>
                <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="cntPageForm" style="padding:1.5rem;">
                <div class="form-section"><div class="form-section-title">🇫🇷 Contenu Français</div>
                    <div class="form-grid">
                        <div class="form-field full-width"><label>Titre (FR) <span class="required">*</span></label><input type="text" id="pageTitreFr" value="${escapeHtml(editData?.titre || editData?.titre_fr || '')}" required></div>
                        <div class="form-field full-width"><label>Extrait (FR)</label><textarea id="pageExtraitFr" rows="2">${escapeHtml(editData?.extrait || editData?.extrait_fr || '')}</textarea></div>
                        <div class="form-field full-width"><label>Contenu (FR) <span class="required">*</span></label><textarea id="pageContenuFr" rows="8" required>${escapeHtml(editData?.contenu || editData?.contenu_fr || '')}</textarea></div>
                    </div>
                </div>
                <div class="form-section"><div class="form-section-title">🇬🇧 Contenu English</div>
                    <div class="form-grid">
                        <div class="form-field full-width"><label>Titre (EN)</label><input type="text" id="pageTitreEn" value="${escapeHtml(editData?.titre_en || '')}"></div>
                        <div class="form-field full-width"><label>Extrait (EN)</label><textarea id="pageExtraitEn" rows="2">${escapeHtml(editData?.extrait_en || '')}</textarea></div>
                        <div class="form-field full-width"><label>Contenu (EN)</label><textarea id="pageContenuEn" rows="6">${escapeHtml(editData?.contenu_en || '')}</textarea></div>
                    </div>
                </div>
                <div class="form-section"><div class="form-section-title">⚙️ Configuration</div>
                    <div class="form-grid">
                        <div class="form-field"><label>Catégorie</label>
                            <select id="pageCategorie"><option value="">Aucune</option>${categories.map(c => `<option value="${c.id}" ${editData?.categorie === c.id ? 'selected' : ''}>${escapeHtml(c.nom)}</option>`).join('')}</select>
                        </div>
                        <div class="form-field"><label>Statut</label>
                            <select id="pageStatut">
                                <option value="BROUILLON" ${editData?.statut === 'BROUILLON' ? 'selected' : ''}>Brouillon</option>
                                <option value="PUBLIEE" ${editData?.statut === 'PUBLIEE' ? 'selected' : ''}>Publiée</option>
                                <option value="ARCHIVEE" ${editData?.statut === 'ARCHIVEE' ? 'selected' : ''}>Archivée</option>
                            </select>
                        </div>
                        <div class="form-field"><label>Ordre</label><input type="number" id="pageOrdre" value="${editData?.ordre || 0}"></div>
                        <div class="form-field"><label>Date publication</label><input type="datetime-local" id="pageDatePub" value="${editData?.date_publication ? editData.date_publication.slice(0,16) : new Date().toISOString().slice(0,16)}"></div>
                    </div>
                    <div class="form-checkbox"><input type="checkbox" id="pageMiseEnAvant" ${editData?.est_mise_en_avant ? 'checked' : ''}><label for="pageMiseEnAvant">⭐ Mise en avant</label></div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 ${editData ? 'Enregistrer' : 'Créer'}</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="cntPageError" style="color:var(--danger); text-align:center;"></p>
            </form>
        </div>`;
    document.body.appendChild(modal); modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('cntPageForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const payload = {
                titre_fr: document.getElementById('pageTitreFr').value,
                titre_en: document.getElementById('pageTitreEn')?.value || '',
                extrait_fr: document.getElementById('pageExtraitFr')?.value || '',
                extrait_en: document.getElementById('pageExtraitEn')?.value || '',
                contenu_fr: document.getElementById('pageContenuFr').value,
                contenu_en: document.getElementById('pageContenuEn')?.value || '',
                statut: document.getElementById('pageStatut').value,
                ordre: parseInt(document.getElementById('pageOrdre').value) || 0,
                est_mise_en_avant: document.getElementById('pageMiseEnAvant').checked,
                date_publication: document.getElementById('pageDatePub')?.value || null
            };
            const catId = document.getElementById('pageCategorie')?.value;
            if (catId) payload.categorie = parseInt(catId);
            if (!payload.date_publication) delete payload.date_publication;

            if (editData) { await apiPatch(endpoint, payload); } else { await apiPost(endpoint, payload); }
            modal.remove(); navigateTo('content');
        } catch (error) { document.getElementById('cntPageError').textContent = error.message; }
    });
}

async function editerCntPage(slug) {
    try { const p = await apiGet(`/api/content/pages/${slug}/`); ouvrirFormulaireCntPage(p); } catch(e) { alert(e.message); }
}

// CATÉGORIE
async function ouvrirFormulaireCntCategorie(editData = null) {
    const existant = document.getElementById('modalCreation'); if (existant) existant.remove();
    const endpoint = editData ? `/api/content/categories/${editData.id}/` : '/api/content/categories/';

    const modal = document.createElement('div'); modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:500px;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border);"><h3 style="color:var(--primary);">${editData ? '✏️' : '➕'} Catégorie</h3></div>
            <form id="cntCatForm" style="padding:1.5rem;">
                <div class="form-grid">
                    <div class="form-field full-width"><label>Nom <span class="required">*</span></label><input type="text" id="cntCatNom" value="${escapeHtml(editData?.nom || '')}" required></div>
                    <div class="form-field full-width"><label>Description</label><textarea id="cntCatDesc" rows="2">${escapeHtml(editData?.description || '')}</textarea></div>
                    <div class="form-field"><label>Icône</label><input type="text" id="cntCatIcone" value="${escapeHtml(editData?.icone || '📁')}" placeholder="Emoji"></div>
                    <div class="form-field"><label>Ordre</label><input type="number" id="cntCatOrdre" value="${editData?.ordre || 0}"></div>
                </div>
                <div class="form-checkbox"><input type="checkbox" id="cntCatActive" ${editData?.est_active !== false ? 'checked' : ''}><label>Active</label></div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="cntCatError" style="color:var(--danger); text-align:center;"></p>
            </form>
        </div>`;
    document.body.appendChild(modal); modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('cntCatForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const payload = { nom: document.getElementById('cntCatNom').value, description: document.getElementById('cntCatDesc')?.value || '', icone: document.getElementById('cntCatIcone')?.value || '', ordre: parseInt(document.getElementById('cntCatOrdre').value) || 0, est_active: document.getElementById('cntCatActive').checked };
            if (editData) { await apiPatch(endpoint, payload); } else { await apiPost(endpoint, payload); }
            modal.remove(); navigateTo('content');
        } catch (error) { document.getElementById('cntCatError').textContent = error.message; }
    });
}

async function editerCntCategorie(id) {
    try { const c = await apiGet(`/api/content/categories/${id}/`); ouvrirFormulaireCntCategorie(c); } catch(e) { alert(e.message); }
}

// DOCUMENT
async function ouvrirFormulaireCntDocument() {
    const existant = document.getElementById('modalCreation'); if (existant) existant.remove();

    const modal = document.createElement('div'); modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:600px; max-height:90vh; overflow-y:auto;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border);"><h3 style="color:var(--primary);">➕ Nouveau document</h3></div>
            <form id="cntDocForm" style="padding:1.5rem;" enctype="multipart/form-data">
                <div class="form-grid">
                    <div class="form-field full-width"><label>Titre <span class="required">*</span></label><input type="text" id="docTitre" required></div>
                    <div class="form-field full-width"><label>Description</label><textarea id="docDesc" rows="2"></textarea></div>
                    <div class="form-field"><label>Type</label>
                        <select id="docType">
                            <option value="PROCEDURE">Procédure</option><option value="FORMULAIRE">Formulaire</option>
                            <option value="RAPPORT">Rapport</option><option value="CONTRAT_TYPE">Contrat type</option>
                            <option value="POLITIQUE">Politique</option><option value="FORMATION">Formation</option>
                            <option value="COMMUNICATION">Communication</option><option value="AUTRE">Autre</option>
                        </select>
                    </div>
                    <div class="form-field"><label>Visibilité</label>
                        <select id="docVisibilite">
                            <option value="TOUS">Tous les employés</option><option value="ADMIN_DIR">Admin & Direction</option>
                            <option value="RH">RH</option><option value="FINANCE">Finance</option>
                            <option value="LOGISTIQUE">Logistique</option><option value="COMMERCIAL">Commerciaux</option>
                        </select>
                    </div>
                    <div class="form-field"><label>Version</label><input type="text" id="docVersion" value="1.0"></div>
                    <div class="form-field full-width">
                        <label>Fichier <span class="required">*</span></label>
                        <input type="file" id="docFichier" required style="padding:0.5rem; border:2px dashed var(--border); border-radius:8px; width:100%;">
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 Uploader</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="cntDocError" style="color:var(--danger); text-align:center;"></p>
            </form>
        </div>`;
    document.body.appendChild(modal); modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('cntDocForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('titre', document.getElementById('docTitre').value);
            formData.append('description', document.getElementById('docDesc')?.value || '');
            formData.append('type_document', document.getElementById('docType').value);
            formData.append('visibilite', document.getElementById('docVisibilite').value);
            formData.append('version', document.getElementById('docVersion')?.value || '1.0');
            const fichier = document.getElementById('docFichier').files[0];
            if (fichier) formData.append('fichier', fichier);

            await uploadImage('/api/content/documents/', formData);
            modal.remove(); navigateTo('content');
        } catch (error) { document.getElementById('cntDocError').textContent = error.message; }
    });
}

// MÉDIA
async function ouvrirFormulaireCntMedia() {
    const existant = document.getElementById('modalCreation'); if (existant) existant.remove();

    const modal = document.createElement('div'); modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:550px;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border);"><h3 style="color:var(--primary);">➕ Nouveau média</h3></div>
            <form id="cntMediaForm" style="padding:1.5rem;" enctype="multipart/form-data">
                <div class="form-grid">
                    <div class="form-field full-width"><label>Nom <span class="required">*</span></label><input type="text" id="mediaNom" required></div>
                    <div class="form-field full-width"><label>Description</label><textarea id="mediaDesc" rows="2"></textarea></div>
                    <div class="form-field"><label>Tags</label><input type="text" id="mediaTags" placeholder="Ex: ananas, récolte, 2026"></div>
                    <div class="form-field full-width">
                        <label>Fichier <span class="required">*</span></label>
                        <input type="file" id="mediaFichier" required accept="image/*,video/*,audio/*,.pdf,.doc,.docx" style="padding:0.5rem; border:2px dashed var(--border); border-radius:8px; width:100%;">
                        <small style="color:var(--text-light);">Images, vidéos, audio, documents</small>
                    </div>
                </div>
                <div class="form-checkbox"><input type="checkbox" id="mediaPublic" checked><label>Visible publiquement</label></div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 Uploader</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="cntMediaError" style="color:var(--danger); text-align:center;"></p>
            </form>
        </div>`;
    document.body.appendChild(modal); modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('cntMediaForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('nom', document.getElementById('mediaNom').value);
            formData.append('description', document.getElementById('mediaDesc')?.value || '');
            formData.append('tags', document.getElementById('mediaTags')?.value || '');
            formData.append('est_public', document.getElementById('mediaPublic').checked);
            const fichier = document.getElementById('mediaFichier').files[0];
            if (fichier) formData.append('fichier', fichier);

            await uploadImage('/api/content/medias/', formData);
            modal.remove(); navigateTo('content');
        } catch (error) { document.getElementById('cntMediaError').textContent = error.message; }
    });
}

// FAQ
async function ouvrirFormulaireCntFaq(editData = null) {
    const existant = document.getElementById('modalCreation'); if (existant) existant.remove();
    let categories = [];
    try { const r = await apiGet('/api/content/categories/'); categories = Array.isArray(r) ? r : (r.results || []); } catch(e) {}

    const endpoint = editData ? `/api/content/faqs/${editData.id}/` : '/api/content/faqs/';

    const modal = document.createElement('div'); modal.id = 'modalCreation';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:650px; max-height:90vh; overflow-y:auto;">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border);"><h3 style="color:var(--primary);">${editData ? '✏️' : '➕'} FAQ</h3></div>
            <form id="cntFaqForm" style="padding:1.5rem;">
                <div class="form-section"><div class="form-section-title">🇫🇷 Français</div>
                    <div class="form-grid">
                        <div class="form-field full-width"><label>Question (FR) <span class="required">*</span></label><input type="text" id="faqQuestionFr" value="${escapeHtml(editData?.question || editData?.question_fr || '')}" required></div>
                        <div class="form-field full-width"><label>Réponse (FR) <span class="required">*</span></label><textarea id="faqReponseFr" rows="4" required>${escapeHtml(editData?.reponse || editData?.reponse_fr || '')}</textarea></div>
                    </div>
                </div>
                <div class="form-section"><div class="form-section-title">🇬🇧 English</div>
                    <div class="form-grid">
                        <div class="form-field full-width"><label>Question (EN)</label><input type="text" id="faqQuestionEn" value="${escapeHtml(editData?.question_en || '')}"></div>
                        <div class="form-field full-width"><label>Réponse (EN)</label><textarea id="faqReponseEn" rows="3">${escapeHtml(editData?.reponse_en || '')}</textarea></div>
                    </div>
                </div>
                <div class="form-grid">
                    <div class="form-field"><label>Catégorie</label>
                        <select id="faqCategorie"><option value="">Aucune</option>${categories.map(c => `<option value="${c.id}" ${editData?.categorie === c.id ? 'selected' : ''}>${escapeHtml(c.nom)}</option>`).join('')}</select>
                    </div>
                    <div class="form-field"><label>Ordre</label><input type="number" id="faqOrdre" value="${editData?.ordre || 0}"></div>
                </div>
                <div class="form-checkbox"><input type="checkbox" id="faqVisible" ${editData?.est_visible !== false ? 'checked' : ''}><label>Visible</label></div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 ${editData ? 'Enregistrer' : 'Créer'}</button>
                    <button type="button" class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Annuler</button>
                </div>
                <p id="cntFaqError" style="color:var(--danger); text-align:center;"></p>
            </form>
        </div>`;
    document.body.appendChild(modal); modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('cntFaqForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const payload = {
                question_fr: document.getElementById('faqQuestionFr').value,
                question_en: document.getElementById('faqQuestionEn')?.value || '',
                reponse_fr: document.getElementById('faqReponseFr').value,
                reponse_en: document.getElementById('faqReponseEn')?.value || '',
                ordre: parseInt(document.getElementById('faqOrdre').value) || 0,
                est_visible: document.getElementById('faqVisible').checked
            };
            const catId = document.getElementById('faqCategorie')?.value;
            if (catId) payload.categorie = parseInt(catId);

            if (editData) { await apiPatch(endpoint, payload); } else { await apiPost(endpoint, payload); }
            modal.remove(); navigateTo('content');
        } catch (error) { document.getElementById('cntFaqError').textContent = error.message; }
    });
}

async function editerCntFaq(id) {
    try { const f = await apiGet(`/api/content/faqs/${id}/`); ouvrirFormulaireCntFaq(f); } catch(e) { alert(e.message); }
}