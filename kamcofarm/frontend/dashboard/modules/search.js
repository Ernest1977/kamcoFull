// ========================================
// RECHERCHE GLOBALE
// ========================================

let searchTimeout = null;
let searchAbortController = null;

function initGlobalSearch() {
    const input = document.getElementById('globalSearchInput');
    const results = document.getElementById('globalSearchResults');

    if (!input || !results) return;

    // Recherche en temps réel
    input.addEventListener('input', function() {
        const query = this.value.trim();

        if (searchTimeout) clearTimeout(searchTimeout);

        if (query.length < 2) {
            results.style.display = 'none';
            return;
        }

        results.style.display = 'block';
        results.innerHTML = '<div class="search-loading"><div class="spinner" style="width:24px; height:24px; margin:0 auto;"></div><p style="margin-top:0.5rem;">Recherche en cours...</p></div>';

        searchTimeout = setTimeout(() => {
            executeSearch(query);
        }, 300);
    });

    // Fermer avec Escape
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            results.style.display = 'none';
            this.blur();
        }
    });

    // Fermer en cliquant ailleurs
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.global-search-wrapper')) {
            results.style.display = 'none';
        }
    });

    // Raccourci Ctrl+K
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            input.focus();
            input.select();
        }
    });
}

async function executeSearch(query) {
    const results = document.getElementById('globalSearchResults');

    if (searchAbortController) {
        searchAbortController.abort();
    }
    searchAbortController = new AbortController();

    try {
        const data = await apiGet(`/api/administration/recherche/?q=${encodeURIComponent(query)}`);
        renderSearchResults(data, query);
    } catch (error) {
        if (error.name === 'AbortError') return;
        results.innerHTML = `<div class="search-no-results"><p>Erreur de recherche</p><small>${error.message}</small></div>`;
    }
}

function renderSearchResults(data, query) {
    const results = document.getElementById('globalSearchResults');
    if (!results) return;

    if (!data.categories || data.categories.length === 0) {
        results.innerHTML = `
            <div class="search-no-results">
                <span style="font-size:2rem;">🔍</span>
                <p style="margin:0.5rem 0;">Aucun résultat pour "<strong>${escapeHtml(query)}</strong>"</p>
                <small>Essayez avec d'autres termes</small>
            </div>
        `;
        return;
    }

    let html = `
        <div class="search-results-header">
            <strong>🔍 ${data.total} résultat(s)</strong>
            <small style="color:var(--text-light);">pour "${escapeHtml(query)}"</small>
        </div>
    `;

    data.categories.forEach(cat => {
        html += `
            <div class="search-category">
                <div class="search-category-title">
                    <span>${cat.icone}</span>
                    <span>${escapeHtml(cat.nom)} (${cat.items.length})</span>
                </div>
                ${cat.items.map(item => `
                    <div class="search-result-item" onclick="navigateToSearchResult('${cat.module}', '${item.type}', ${item.id})">
                        <div class="search-result-icon">${cat.icone}</div>
                        <div class="search-result-info">
                            <div class="search-result-title">${highlightQuery(escapeHtml(item.titre), query)}</div>
                            <div class="search-result-subtitle">${highlightQuery(escapeHtml(item.sous_titre), query)}</div>
                        </div>
                        <span class="search-result-arrow">→</span>
                    </div>
                `).join('')}
            </div>
        `;
    });

    results.innerHTML = html;
}

function highlightQuery(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark style="background:#fff59d; padding:0 2px; border-radius:2px;">$1</mark>');
}

function navigateToSearchResult(module, type, id) {
    const results = document.getElementById('globalSearchResults');
    const input = document.getElementById('globalSearchInput');
    if (results) results.style.display = 'none';
    if (input) input.value = '';

    // Naviguer vers le module
    navigateTo(module);

    // Après un délai, essayer d'ouvrir le détail
    setTimeout(() => {
        try {
            switch(type) {
                case 'produit': break;
                case 'commande': voirDetailCommandeSC(id); break;
                case 'fournisseur': voirDetailFournisseur(id); break;
                case 'facture': voirDetailFinFacture(id); break;
                case 'employe': voirDetailRHEmploye(id); break;
                case 'lead': voirDetailMktLead(id); break;
                case 'equipement': voirDetailEqEquipement(id); break;
                case 'contrat_location': voirDetailLocContrat(id); break;
                case 'utilisateur': voirDetailAccount(id); break;
            }
        } catch(e) {
            console.warn('Détail non disponible:', e);
        }
    }, 500);
}

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initGlobalSearch, 500);
});