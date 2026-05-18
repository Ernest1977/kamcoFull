// ========================================
// FOSS AGRO FARM — Dashboard Admin
// Fichier principal : Auth, Navigation, Notifications
// ========================================

const API_BASE = (window.location.origin.includes('127.0.0.1') || window.location.origin.includes('localhost')) ? 'http://127.0.0.1:8000' : window.location.origin;

// ========================================
// ÉTAT GLOBAL
// ========================================
const AppState = {
    user: null,
    accessToken: null,
    refreshToken: null,
    currentModule: 'overview',
    notifications: [],
    notifCount: 0,
    searchValues: {},
    filterValues: {}
};

// ========================================
// UTILITAIRES
// ========================================
function getToken() {
    return AppState.accessToken || localStorage.getItem('accessToken');
}

function getRefreshToken() {
    return AppState.refreshToken || localStorage.getItem('refreshToken');
}

function saveTokens(access, refresh) {
    AppState.accessToken = access;
    AppState.refreshToken = refresh;
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
}

function clearTokens() {
    AppState.accessToken = null;
    AppState.refreshToken = null;
    AppState.user = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function formatDateTime(dateStr) {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatMoney(amount, devise = 'FCFA') {
    if (amount === null || amount === undefined) return '0 ' + devise;
    return Number(amount).toLocaleString('fr-FR') + ' ' + devise;
}

function formatPercent(value) {
    if (value === null || value === undefined) return '0%';
    return Number(value).toFixed(1) + '%';
}

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return "À l'instant";
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)}j`;
    return formatDate(dateStr);
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function showLoading() {
    const area = document.getElementById('contentArea');
    if (area) {
        area.innerHTML = `
            <div class="loading-screen">
                <div class="spinner"></div>
                <p>Chargement...</p>
            </div>
        `;
    }
}

function showError(message) {
    const area = document.getElementById('contentArea');
    if (area) {
        area.innerHTML = `
            <div class="alert alert-danger">
                <span>❌</span>
                <span>${escapeHtml(message)}</span>
            </div>
        `;
    }
}


function switchTab(prefix, tabName, btn) {
    // Masquer tous les contenus de ce groupe
    const allTabs = document.querySelectorAll(`[id^="${prefix}_"]`);
    allTabs.forEach(el => {
        el.classList.remove('active');
        el.style.display = 'none';
    });

    // Afficher le contenu sélectionné
    const target = document.getElementById(`${prefix}_${tabName}`);
    if (target) {
        target.classList.add('active');
        target.style.display = 'block';
    }

    // Mettre à jour les boutons
    if (btn && btn.parentElement) {
        btn.parentElement.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }
}

function getBadgeClass(statut) {
    const map = {
        'DISPONIBLE': 'badge-success',
        'ACTIF': 'badge-success',
        'CONFIRMEE': 'badge-success',
        'PAYEE': 'badge-success',
        'TERMINE': 'badge-success',
        'TERMINEE': 'badge-success',
        'APPROUVE': 'badge-success',
        'CONFIRME': 'badge-success',
        'VERSEE': 'badge-success',
        'RESTITUEE': 'badge-success',
        'PUBLIEE': 'badge-success',
        'VALIDE': 'badge-success',
        'EN_COURS': 'badge-info',
        'EN_LOCATION': 'badge-info',
        'EN_TRANSIT': 'badge-info',
        'SIGNE': 'badge-info',
        'ENVOYEE': 'badge-info',
        'EN_PREPARATION': 'badge-info',
        'PLANIFIEE': 'badge-info',
        'EN_ATTENTE': 'badge-warning',
        'EN_ATTENTE_SIGNATURE': 'badge-warning',
        'BROUILLON': 'badge-neutral',
        'NOUVEAU': 'badge-purple',
        'RESERVE': 'badge-purple',
        'PARTIELLEMENT_PAYEE': 'badge-warning',
        'EN_RETARD': 'badge-danger',
        'ANNULEE': 'badge-danger',
        'REFUSEE': 'badge-danger',
        'REFUSE': 'badge-danger',
        'RESILIE': 'badge-danger',
        'HORS_SERVICE': 'badge-danger',
        'EN_REPARATION': 'badge-danger',
        'EN_MAINTENANCE': 'badge-warning',
        'LITIGE': 'badge-danger',
        'EXPIRE': 'badge-danger',
        'RETENUE': 'badge-warning',
        'CRITIQUE': 'badge-danger',
        'URGENTE': 'badge-danger',
        'calendrier': 'Calendrier des Événements',
    };
    return map[statut] || 'badge-neutral';
}

// ========================================
// API — REQUÊTES AUTHENTIFIÉES
// ========================================
async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    if (!token) {
        showLoginScreen();
        throw new Error('Non authentifié');
    }

    const defaultHeaders = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
    };

    // Ne pas ajouter Content-Type si FormData
    if (!(options.body instanceof FormData)) {
        defaultHeaders['Content-Type'] = 'application/json';
    }

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...(options.headers || {})
        }
    };

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, config);

        // Token expiré : tenter un refresh
        if (response.status === 401) {
            const refreshed = await refreshAccessToken();
            if (refreshed) {
                config.headers['Authorization'] = `Bearer ${getToken()}`;
                const retryResponse = await fetch(`${API_BASE}${endpoint}`, config);
                if (!retryResponse.ok) {
                    throw new Error(`Erreur API ${retryResponse.status}`);
                }
                return await retryResponse.json();
            } else {
                showLoginScreen();
                throw new Error('Session expirée');
            }
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Erreur API détaillée:', errorData);
            // Construire un message d'erreur lisible
            if (typeof errorData === 'object' && Object.keys(errorData).length > 0) {
                if (errorData.detail) {
                    throw new Error(errorData.detail);
                }
                // Afficher chaque champ en erreur
                const messages = [];
                for (const [key, val] of Object.entries(errorData)) {
                    const msg = Array.isArray(val) ? val.join(', ') : String(val);
                    messages.push(`${key}: ${msg}`);
                }
                throw new Error(messages.join(' | '));
            }
            throw new Error(`Erreur ${response.status}`);
        }

        // Réponses vides (204)
        if (response.status === 204) return null;

        return await response.json();

    } catch (error) {
        if (error.message === 'Failed to fetch') {
            throw new Error('Impossible de contacter le serveur. Vérifiez que le backend est lancé.');
        }
        throw error;
    }
}

async function apiGet(endpoint) {
    return apiRequest(endpoint);
}

async function apiPost(endpoint, data = {}) {
    return apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

async function apiPut(endpoint, data = {}) {
    return apiRequest(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

async function apiPatch(endpoint, data = {}) {
    return apiRequest(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

async function apiDelete(endpoint) {
    return apiRequest(endpoint, { method: 'DELETE' });
}

// ========================================
// AUTHENTIFICATION
// ========================================
async function login(username, password) {
    try {
        const response = await fetch(`${API_BASE}/api/auth/token/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            throw new Error('Identifiants incorrects');
        }

        const data = await response.json();
        saveTokens(data.access, data.refresh);

        // Récupérer le profil
        const meResponse = await fetch(`${API_BASE}/api/accounts/me/`, {
            headers: {
                'Authorization': `Bearer ${data.access}`,
                'Accept': 'application/json'
            }
        });

        if (!meResponse.ok) {
            throw new Error('Impossible de récupérer le profil');
        }

        AppState.user = await meResponse.json();

        // Vérifier les rôles autorisés
        const rolesAutorises = ['ADMIN', 'DIR', 'RH', 'COMPTA', 'COMM', 'LOG'];
        if (!rolesAutorises.includes(AppState.user.role)) {
            clearTokens();
            throw new Error('Accès non autorisé pour ce rôle');
        }

        return true;

    } catch (error) {
        clearTokens();
        throw error;
    }
}

async function refreshAccessToken() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
        const response = await fetch(`${API_BASE}/api/auth/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken })
        });

        if (!response.ok) return false;

        const data = await response.json();
        AppState.accessToken = data.access;
        localStorage.setItem('accessToken', data.access);
        return true;

    } catch {
        return false;
    }
}

function logout() {
    clearTokens();
    showLoginScreen();
}

async function checkAuth() {
    const token = getToken();
    if (!token) return false;

    try {
        const response = await fetch(`${API_BASE}/api/accounts/me/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const refreshed = await refreshAccessToken();
            if (!refreshed) return false;

            const retryResponse = await fetch(`${API_BASE}/api/accounts/me/`, {
                headers: {
                    'Authorization': `Bearer ${getToken()}`,
                    'Accept': 'application/json'
                }
            });

            if (!retryResponse.ok) return false;
            AppState.user = await retryResponse.json();
        } else {
            AppState.user = await response.json();
        }

        return true;

    } catch {
        return false;
    }
}

// ========================================
// ÉCRANS LOGIN / DASHBOARD
// ========================================
function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('dashboardLayout').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboardLayout').style.display = 'flex';

    updateUserUI();
    updateDate();
    loadNotifications();
    navigateTo(AppState.currentModule);
    setTimeout(initGlobalSearch, 500);
}

function updateUserUI() {
    if (!AppState.user) return;

    const userName = document.getElementById('userName');
    const userRole = document.getElementById('userRole');
    const userAvatar = document.getElementById('userAvatar');

    const fullName = `${AppState.user.first_name || ''} ${AppState.user.last_name || ''}`.trim();
    const displayName = fullName || AppState.user.username;

    if (userName) userName.textContent = displayName;
    if (userRole) userRole.textContent = AppState.user.role_display || AppState.user.role;
    if (userAvatar) {
        const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        userAvatar.textContent = initials;
    }

    // Masquer les modules selon le rôle
    applyRolePermissions();
}

function applyRolePermissions() {
    const role = AppState.user?.role;
    if (!role) return;

    const permissions = {
        'ADMIN': [
            'overview', 'supplychain', 'finance', 'rh', 'marketing',
            'equipements', 'location', 'admin', 'content',
            'produits', 'gallery', 'partners', 'blogadmin', 'testimonials', 'statistics', 'accounts', 'profil', 'calendrier'
        ],
        'DIR': [
            'overview', 'supplychain', 'finance', 'rh', 'marketing',
            'equipements', 'location', 'admin', 'content',
            'produits', 'gallery', 'partners', 'blogadmin', 'testimonials', 'statistics', 'accounts', 'profil', 'calendrier'
        ],
        'COMPTA': ['overview', 'finance', 'profil', 'calendrier'],
        'RH': ['overview', 'rh', 'profil', 'calendrier'],
        'COMM': ['overview', 'supplychain', 'marketing', 'location', 'profil', 'calendrier'],
        'LOG': ['overview', 'supplychain', 'equipements', 'location', 'profil', 'calendrier'],
    };

    const modulesPermis = permissions[role] || ['overview'];

    document.querySelectorAll('.nav-item[data-module]').forEach(item => {
        const module = item.dataset.module;
        if (modulesPermis.includes(module)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

function updateDate() {
    const dateEl = document.getElementById('topbarDate');
    if (dateEl) {
        dateEl.textContent = new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }
}

// ========================================
// NOTIFICATIONS
// ========================================
async function loadNotifications() {
    try {

        if (!getToken()) return;

        const data = await apiGet('/api/administration/notifications/non_lues/');

        AppState.notifCount = data.count || 0;
        AppState.notifications = data.notifications || [];

        updateNotifUI();

    } catch (error) {
        console.warn('Notifications indisponibles:', error.message);
    }
}

function updateNotifUI() {
    const countEl = document.getElementById('notifCount');
    const listEl = document.getElementById('notifList');

    if (countEl) {
        if (AppState.notifCount > 0) {
            countEl.textContent = AppState.notifCount > 99 ? '99+' : AppState.notifCount;
            countEl.style.display = 'inline-block';
        } else {
            countEl.style.display = 'none';
        }
    }

    if (listEl) {
        if (AppState.notifications.length === 0) {
            listEl.innerHTML = '<p class="notif-empty">Aucune notification</p>';
            return;
        }

        listEl.innerHTML = AppState.notifications.map(notif => {
            const typeIcons = {
                'INFO': 'ℹ️',
                'SUCCESS': '✅',
                'WARNING': '⚠️',
                'ERROR': '❌',
                'TACHE': '📋'
            };

            const icon = typeIcons[notif.type_notification] || 'ℹ️';

            return `
                <div class="notif-item ${notif.est_lue ? '' : 'unread'}" 
                     onclick="marquerNotifLue(${notif.id})">
                    <div class="notif-item-icon">${icon}</div>
                    <div class="notif-item-content">
                        <div class="notif-item-title">${escapeHtml(notif.titre)}</div>
                        <div class="notif-item-text">${escapeHtml(notif.message).substring(0, 100)}...</div>
                        <div class="notif-item-time">${timeAgo(notif.date_creation)}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

async function marquerNotifLue(id) {
    try {
        await apiPost(`/api/administration/notifications/${id}/marquer_lue/`);
        await loadNotifications();
    } catch (error) {
        console.error('Erreur marquer notification:', error);
    }
}

async function marquerToutesLues() {
    try {
        await apiPost('/api/administration/notifications/marquer_toutes_lues/');
        await loadNotifications();
    } catch (error) {
        console.error('Erreur marquer toutes lues:', error);
    }
}

// ========================================
// NAVIGATION MODULES
// ========================================
async function navigateTo(moduleName) {
    AppState.currentModule = moduleName;

    // Mettre à jour la sidebar
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.module === moduleName) {
            item.classList.add('active');
        }
    });

    // Mettre à jour le titre
        const titles = {
        'overview': 'Vue d\'ensemble',
        'supplychain': 'Supply Chain',
        'finance': 'Finance',
        'rh': 'Ressources Humaines',
        'marketing': 'Marketing',
        'equipements': 'Équipements & Flotte',
        'location': 'Location',
        'admin': 'Administration',
        'content': 'Gestion du Contenu',
        'produits': 'Gestion des Produits',
        'gallery': 'Gestion de la Galerie',
        'partners': 'Gestion des Partenaires',
        'blogadmin': 'Gestion du Blog',
        'testimonials': 'Gestion des Témoignages',
        'statistics': 'Gestion des Statistiques',
        'accounts': 'Gestion des Comptes',
        'profil': 'Mon Profil',
        'calendrier': 'Calendrier des Événements'
    };

    const titleEl = document.getElementById('pageTitle');
    if (titleEl) {
        titleEl.textContent = titles[moduleName] || moduleName;
    }

    // Fermer le sidebar en mobile
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('show');

    // Charger le module
    showLoading();

    try {
        switch (moduleName) {
            case 'overview':
                await loadOverviewModule();
                break;
            case 'supplychain':
                await loadSupplychainModule();
                break;
            case 'finance':
                await loadFinanceModule();
                break;
            case 'rh':
                await loadRHModule();
                break;
            case 'marketing':
                await loadMarketingModule();
                break;
            case 'equipements':
                await loadEquipementsModule();
                break;
            case 'location':
                await loadLocationModule();
                break;
            case 'admin':
                await loadAdminModule();
                break;
            case 'profil':
                await loadProfilModule();
                break;
            case 'content':
                await loadContentModule();
                break;
            case 'produits':
                await loadProduitsModule();
                break;
            case 'gallery':
                await loadGalleryModule();
                break;
            case 'partners':
                await loadPartnersModule();
                break;
            case 'blogadmin':
                await loadBlogAdminModule();
                break;
            case 'testimonials':
                await loadTestimonialsModule();
                break;
            case 'statistics':
                await loadStatisticsModule();
                break;
            case 'accounts':
                await loadAccountsModule();
                break;
            case 'calendrier':
                await loadCalendrierModule();
                break;
            default:
                showError('Module inconnu');
            
        }
    } catch (error) {
        console.error(`Erreur module ${moduleName}:`, error);
        showError(`Erreur lors du chargement du module : ${error.message}`);
    }
}

// ========================================
// MODULE : VUE D'ENSEMBLE
// ========================================




// ========================================
// MODULES PLACEHOLDER (à charger dynamiquement)
// ========================================
// ========================================
// MODULE ENRICHI : SUPPLY CHAIN
// ========================================



// ========================================
// MODULE ENRICHI : FINANCE
// ========================================



// ========================================
// MODULE ENRICHI : RH
// ========================================
async function loadRHModule() {
    const area = document.getElementById('contentArea');

    try {
        const [dashboard, employes, conges] = await Promise.all([
            apiGet('/api/rh/admin/').catch(() => null),
            apiGet('/api/rh/employes/').catch(() => []),
            apiGet('/api/rh/conges/?statut=EN_ATTENTE').catch(() => [])
        ]);

        const empList = Array.isArray(employes) ? employes : (employes.results || []);
        const congesList = Array.isArray(conges) ? conges : (conges.results || []);

        area.innerHTML = `
            <div class="stats-row">
                <div class="stat-card">
                    <div class="stat-card-icon blue">👥</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${dashboard?.total_employes || empList.length}</div>
                        <div class="stat-card-label">Employés actifs</div>
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
                        <div class="stat-card-value">${dashboard?.conges_en_attente || congesList.length}</div>
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

            ${congesList.length > 0 ? `
                <div class="alert alert-warning"><span>📅</span><span><strong>${congesList.length}</strong> demande(s) de congé en attente d'approbation</span></div>
            ` : ''}

            <div class="card">
                <div class="card-header">
                    <div class="tab-nav">
                        <button class="tab-btn active" onclick="switchTab('rh', 'employes', this)">👥 Employés (${empList.length})</button>
                        <button class="tab-btn" onclick="switchTab('rh', 'conges', this)">📅 Congés en attente (${congesList.length})</button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="tab-content active" id="rh_employes">
                        ${renderSearchBar({ placeholder: 'Rechercher un employé...', moduleRedirect: 'rh' })}
                        <div class="table-container">
                            <table class="dash-table">
                                <thead>
                                    <tr><th>Matricule</th><th>Nom</th><th>Poste</th><th>Département</th><th>Actif</th></tr>
                                </thead>
                                <tbody>
                                    ${empList.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding:2rem;">Aucun employé</td></tr>' :
                                    empList.map(emp => `
                                        <tr>
                                            <td><strong>${escapeHtml(emp.matricule)}</strong></td>
                                            <td>${escapeHtml(emp.nom_complet || emp.username || 'N/A')}</td>
                                            <td>${escapeHtml(emp.poste || 'N/A')}</td>
                                            <td>${escapeHtml(emp.departement_nom || 'N/A')}</td>
                                            <td>${emp.est_actif ? '<span class="badge badge-success">Oui</span>' : '<span class="badge badge-danger">Non</span>'}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="tab-content" id="rh_conges">
                        <div class="table-container">
                            <table class="dash-table">
                                <thead>
                                    <tr><th>Employé</th><th>Type</th><th>Du</th><th>Au</th><th>Jours</th><th>Motif</th><th>Actions</th></tr>
                                </thead>
                                <tbody>
                                    ${congesList.length === 0 ? '<tr><td colspan="7" style="text-align:center; padding:2rem;">Aucun congé en attente</td></tr>' :
                                    congesList.map(c => `
                                        <tr>
                                            <td><strong>${escapeHtml(c.employe_nom || 'N/A')}</strong></td>
                                            <td><span class="badge badge-info">${escapeHtml(c.type_display || c.type_conge)}</span></td>
                                            <td>${formatDate(c.date_debut)}</td>
                                            <td>${formatDate(c.date_fin)}</td>
                                            <td>${c.nombre_jours}j</td>
                                            <td><small>${escapeHtml((c.motif || '').substring(0, 50))}</small></td>
                                            <td>
                                                <div class="item-actions">
                                                    <button class="btn btn-sm btn-success" onclick="actionConge(${c.id}, 'approuver')">✅ Approuver</button>
                                                    <button class="btn btn-sm btn-danger" onclick="actionConge(${c.id}, 'refuser')">❌ Refuser</button>
                                                </div>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;

    } catch (error) {
        showError(`RH : ${error.message}`);
    }
}

async function actionConge(id, action) {
    const commentaire = prompt(`${action === 'approuver' ? 'Commentaire (optionnel)' : 'Motif du refus'} :`);
    if (commentaire === null) return;
    try {
        await apiPost(`/api/rh/conges/${id}/${action}/`, { commentaire });
        navigateTo('rh');
    } catch (error) { alert(`Erreur : ${error.message}`); }
}




// ========================================
// MODULE ENRICHI : MARKETING
// ========================================





// ========================================
// MODULE ENRICHI : ÉQUIPEMENTS
// ========================================




// ========================================
// MODULE ENRICHI : LOCATION
// ========================================




// ========================================
// RENDU GÉNÉRIQUE MODULE DASHBOARD
// ========================================
function renderModuleDashboard(titre, icon, stats) {
    return `
        <div class="stats-row">
            ${stats.map(stat => `
                <div class="stat-card">
                    <div class="stat-card-icon ${stat.icon || 'blue'}">${icon}</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${stat.value}</div>
                        <div class="stat-card-label">${stat.label}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}




// ========================================
// MODULE ENRICHI : PRODUITS
// ========================================
async function loadProduitsModule() {
    const area = document.getElementById('contentArea');

    try {
        let produits = await apiGet('/api/produits/');
        produits = Array.isArray(produits) ? produits : (produits.results || []);

        const searchValue = getSearchValue('produits');
        if (searchValue) {
            produits = filterLocally(produits, searchValue, ['nom', 'type_produit', 'description']);
        }

        const filterType = getFilterValue('produits', 'type');
        if (filterType) {
            produits = produits.filter(p => p.type_produit === filterType);
        }

        area.innerHTML = `
            ${renderSearchBar({
                placeholder: 'Rechercher un produit...',
                moduleRedirect: 'produits',
                filters: [
                    {
                        key: 'type',
                        label: 'Type de produit',
                        options: [
                            { value: 'ANANAS', label: 'Ananas' },
                            { value: 'FRUITS', label: 'Fruits' },
                            { value: 'LEGUME', label: 'Légume' },
                            { value: 'TUBERCULE', label: 'Tubercule' },
                            { value: 'EPICES', label: 'Épices' },
                            { value: 'DESHYDRATE', label: 'Déshydraté' },
                            { value: 'AUTRE', label: 'Autre' }
                        ]
                    }
                ]
            })}

            <div class="stats-row">
                <div class="stat-card">
                    <div class="stat-card-icon green">🍍</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${produits.length}</div>
                        <div class="stat-card-label">Total produits</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon purple">⭐</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${produits.filter(p => p.est_premium).length}</div>
                        <div class="stat-card-label">Produits premium</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3>🍍 Liste des produits</h3>
                    <div class="card-header-actions">
                        <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireCreation('produit')">
                            + Ajouter
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    ${produits.length === 0 ? `
                        <div class="empty-state">
                            <div class="empty-state-icon">🍍</div>
                            <h3>Aucun produit</h3>
                        </div>
                    ` : `
                        <div class="table-container">
                            <table class="dash-table">
                                <thead>
                                    <tr>
                                        <th>Image</th>
                                        <th>Nom</th>
                                        <th>Type</th>
                                        <th>Description</th>
                                        <th>Prix</th>
                                        <th>Premium</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${produits.map(p => `
                                        <tr>
                                            <td>
                                                ${p.image ? `<img src="${p.image}" style="width:50px; height:50px; object-fit:cover; border-radius:8px;">` : '<div style="width:50px;height:50px;background:#f0f0f0;border-radius:8px;display:flex;align-items:center;justify-content:center;">📷</div>'}
                                            </td>
                                            <td><strong>${escapeHtml(p.nom)}</strong></td>
                                            <td><span class="badge badge-info">${escapeHtml(p.type_produit || 'N/A')}</span></td>
                                            <td><small>${escapeHtml((p.description || '').substring(0, 60))}...</small></td>
                                            <td>${formatMoney(p.prix_unitaire_fcfa)}</td>
                                            <td>${p.est_premium ? '<span class="badge badge-success">⭐ Oui</span>' : '<span class="badge badge-neutral">Non</span>'}</td>
                                            <td>
                                                <div class="item-actions">
                                                    <button class="btn btn-sm btn-outline" onclick='ouvrirModalEdition("produit", ${JSON.stringify(p).replace(/'/g, "\\u0027")}, "/api/produits/${p.id}/", "produits")' title="Modifier">✏️</button>
                                                    <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/produits/${p.id}/', 'produits')" title="Supprimer">🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>
            </div>
        `;

    } catch (error) {
        showError(`Produits : ${error.message}`);
    }
}


// ========================================
// MODULE ENRICHI : GALERIE
// ========================================
async function loadGalleryModule() {
    const area = document.getElementById('contentArea');

    try {
        let items = await apiGet('/api/gallery/');
        items = Array.isArray(items) ? items : (items.results || []);

        const searchValue = getSearchValue('gallery');
        if (searchValue) {
            items = filterLocally(items, searchValue, ['titre', 'description', 'categorie']);
        }

        const filterCat = getFilterValue('gallery', 'categorie');
        if (filterCat) {
            items = items.filter(i => i.categorie === filterCat);
        }

        area.innerHTML = `
            ${renderSearchBar({
                placeholder: 'Rechercher dans la galerie...',
                moduleRedirect: 'gallery',
                filters: [
                    {
                        key: 'categorie',
                        label: 'Catégorie',
                        options: [
                            { value: 'PLANTATION', label: 'Plantation' },
                            { value: 'RECOLTE', label: 'Récolte' },
                            { value: 'PRODUCTION', label: 'Production' },
                            { value: 'EQUIPE', label: 'Équipe' },
                            { value: 'AUTRE', label: 'Autre' }
                        ]
                    }
                ]
            })}

            <div class="card">
                <div class="card-header">
                    <h3>🖼️ Galerie (${items.length} images)</h3>
                    <div class="card-header-actions">
                        <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireCreation('gallery')">
                            + Ajouter
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    ${items.length === 0 ? `
                        <div class="empty-state">
                            <div class="empty-state-icon">🖼️</div>
                            <h3>Galerie vide</h3>
                        </div>
                    ` : `
                        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:1rem;">
                            ${items.map(item => `
                                <div style="background:white; border-radius:12px; overflow:hidden; box-shadow:var(--shadow); transition:transform 0.2s;" onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform='none'">
                                    ${item.image ? `<img src="${item.image}" style="width:100%; height:160px; object-fit:cover;">` : '<div style="height:160px; background:linear-gradient(135deg,#188701,#66BB6A); display:flex; align-items:center; justify-content:center; font-size:3rem;">🖼️</div>'}
                                    <div style="padding:0.8rem;">
                                        <strong style="font-size:0.9rem;">${escapeHtml(item.titre || 'Sans titre')}</strong>
                                        <p style="font-size:0.8rem; color:var(--text-light); margin:0.3rem 0;">${escapeHtml(item.description || '')}</p>
                                        <div style="display:flex; align-items:center; gap:0.3rem; margin-top:0.5rem;">
                                            <span class="badge badge-info">${escapeHtml(item.categorie || 'N/A')}</span>
                                            <span style="margin-left:auto; display:flex; gap:0.3rem;">
                                                <button class="btn btn-sm btn-outline" onclick='ouvrirModalEdition("gallery", ${JSON.stringify(item).replace(/'/g, "\\u0027")}, "/api/gallery/${item.id}/", "gallery")'>✏️</button>
                                                <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/gallery/${item.id}/', 'gallery')">🗑️</button>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;

    } catch (error) {
        showError(`Galerie : ${error.message}`);
    }
}


// ========================================
// MODULE ENRICHI : PARTENAIRES
// ========================================
async function loadPartnersModule() {
    const area = document.getElementById('contentArea');

    try {
        let partners = await apiGet('/api/partners/');
        partners = Array.isArray(partners) ? partners : (partners.results || []);

        const searchValue = getSearchValue('partners');
        if (searchValue) {
            partners = filterLocally(partners, searchValue, ['nom', 'description', 'contact_nom', 'ville', 'pays']);
        }

        // Appliquer le filtre par type
        const filterType = getFilterValue('partners', 'type');
        if (filterType) {
            partners = partners.filter(p => p.type_partenaire === filterType);
        }
        
        area.innerHTML = `
            ${renderSearchBar({
                placeholder: 'Rechercher un partenaire...',
                moduleRedirect: 'partners',
                filters: [
                    {
                        key: 'type', label: 'Type',
                        options: [
                            {value:'FOURNISSEUR', label:'Fournisseur'},
                            {value:'CLIENT_B2B', label:'Client B2B'},
                            {value:'DISTRIBUTEUR', label:'Distributeur'},
                            {value:'INVESTISSEUR', label:'Investisseur'},
                            {value:'INSTITUTION', label:'Institution'},
                            {value:'ONG', label:'ONG / Association'},
                            {value:'AUTRE', label:'Autre'}
                        ]
                    }
                ]
            })}

            <div class="stats-row">
                <div class="stat-card">
                    <div class="stat-card-icon blue">🤝</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${partners.length}</div>
                        <div class="stat-card-label">Total partenaires</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon purple">⭐</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${partners.filter(p => p.est_featured).length}</div>
                        <div class="stat-card-label">Mis en avant</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon green">✅</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${partners.filter(p => p.est_visible).length}</div>
                        <div class="stat-card-label">Visibles sur le site</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3>🤝 Partenaires</h3>
                    <div class="card-header-actions">
                        <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireCreation('partner')">
                            + Ajouter
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    ${partners.length === 0 ? `
                        <div class="empty-state">
                            <div class="empty-state-icon">🤝</div>
                            <h3>Aucun partenaire</h3>
                        </div>
                    ` : `
                        <div class="table-container">
                            <table class="dash-table">
                                <thead>
                                    <tr>
                                        <th>Logo</th>
                                        <th>Nom</th>
                                        <th>Type</th>
                                        <th>Contact</th>
                                        <th>Localisation</th>
                                        <th>Site web</th>
                                        <th>Visible</th>
                                        <th>Featured</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${partners.map(p => `
                                        <tr>
                                            <td>${(p.logo_url || p.logo) ? `<img src="${p.logo_url || p.logo}" style="width:50px; height:50px; object-fit:contain; border-radius:8px; background:#f9f9f9; padding:4px;">` : '🏢'}</td>
                                            <td><strong>${escapeHtml(p.nom)}</strong></td>
                                            <td><span class="badge badge-info">${escapeHtml(p.type_display || p.type_partenaire || 'N/A')}</span></td>
                                            <td>
                                                ${p.contact_nom ? `<strong>${escapeHtml(p.contact_nom)}</strong><br>` : ''}
                                                ${p.contact_telephone ? `📞 ${escapeHtml(p.contact_telephone)}<br>` : ''}
                                                ${p.contact_email ? `✉️ <a href="mailto:${p.contact_email}" style="color:var(--primary);">${escapeHtml(p.contact_email)}</a>` : ''}
                                                ${!p.contact_nom && !p.contact_telephone && !p.contact_email ? 'N/A' : ''}
                                            </td>
                                            <td>
                                                ${p.localisation || ((p.ville || '') + (p.ville && p.pays ? ', ' : '') + (p.pays || '')) || 'N/A'}
                                            </td>
                                            <td>${p.site_web ? `<a href="${p.site_web}" target="_blank" style="color:var(--primary);">↗ Visiter</a>` : 'N/A'}</td>
                                            <td>${p.est_visible ? '<span class="badge badge-success">Oui</span>' : '<span class="badge badge-danger">Non</span>'}</td>
                                            <td>${p.est_featured ? '<span class="badge badge-purple">⭐</span>' : '<span class="badge badge-neutral">Non</span>'}</td>
                                            <td>
                                                <div class="item-actions">
                                                    <button class="btn btn-sm btn-outline" onclick='ouvrirModalEdition("partner", ${JSON.stringify(p).replace(/'/g, "\\u0027")}, "/api/partners/${p.id}/", "partners")'>✏️</button>
                                                    <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/partners/${p.id}/', 'partners')">🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>
            </div>
        `;

    } catch (error) {
        showError(`Partenaires : ${error.message}`);
    }
}


// ========================================
// MODULE ENRICHI : BLOG
// ========================================
async function loadBlogAdminModule() {
    const area = document.getElementById('contentArea');

    try {
        let posts = await apiGet('/api/blog/');
        posts = Array.isArray(posts) ? posts : (posts.results || []);

        const searchValue = getSearchValue('blogadmin');
        if (searchValue) {
            posts = filterLocally(posts, searchValue, ['titre', 'extrait', 'auteur']);
        }

        area.innerHTML = `
            ${renderSearchBar({
                placeholder: 'Rechercher un article...',
                moduleRedirect: 'blogadmin'
            })}

            <div class="stats-row">
                <div class="stat-card">
                    <div class="stat-card-icon blue">📰</div>
                    <div class="stat-card-info">
                        <div class="stat-card-value">${posts.length}</div>
                        <div class="stat-card-label">Articles</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3>📰 Articles de blog</h3>
                    <div class="card-header-actions">
                        <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireCreation('blog')">
                            + Nouvel article
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    ${posts.length === 0 ? `
                        <div class="empty-state">
                            <div class="empty-state-icon">📰</div>
                            <h3>Aucun article</h3>
                        </div>
                    ` : `
                        <div class="table-container">
                            <table class="dash-table">
                                <thead>
                                    <tr>
                                        <th>Image</th>
                                        <th>Titre</th>
                                        <th>Auteur</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${posts.map(post => `
                                        <tr>
                                            <td>${post.image ? `<img src="${post.image}" style="width:80px; height:50px; object-fit:cover; border-radius:6px;">` : '📷'}</td>
                                            <td>
                                                <strong>${escapeHtml(post.titre)}</strong>
                                                <br><small style="color:var(--text-light);">${escapeHtml((post.extrait || '').substring(0, 80))}...</small>
                                            </td>
                                            <td>${escapeHtml(post.auteur || 'N/A')}</td>
                                            <td>${formatDate(post.date_publication)}</td>
                                            <td>
                                                <div class="item-actions">
                                                    <a href="../blog-detail.html?id=${post.id}" target="_blank" class="btn btn-sm btn-outline" title="Voir">👁️</a>
                                                    <button class="btn btn-sm btn-outline" onclick='ouvrirModalEdition("blog", ${JSON.stringify(post).replace(/'/g, "\\u0027")}, "/api/blog/${post.id}/", "blogadmin")' title="Modifier">✏️</button>
                                                    <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/blog/${post.id}/', 'blogadmin')" title="Supprimer">🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>
            </div>
        `;

    } catch (error) {
        showError(`Blog : ${error.message}`);
    }
}


// ========================================
// MODULE ENRICHI : TÉMOIGNAGES
// ========================================
async function loadTestimonialsModule() {
    const area = document.getElementById('contentArea');

    try {
        let testimonials = await apiGet('/api/testimonials/');
        testimonials = Array.isArray(testimonials) ? testimonials : (testimonials.results || []);

        const searchValue = getSearchValue('testimonials');
        if (searchValue) {
            testimonials = filterLocally(testimonials, searchValue, ['nom_client', 'entreprise', 'contenu']);
        }

        area.innerHTML = `
            ${renderSearchBar({
                placeholder: 'Rechercher un témoignage...',
                moduleRedirect: 'testimonials'
            })}

            <div class="card">
                <div class="card-header">
                    <h3>💬 Témoignages (${testimonials.length})</h3>
                    <div class="card-header-actions">
                        <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireCreation('testimonial')">
                            + Ajouter
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    ${testimonials.length === 0 ? `
                        <div class="empty-state">
                            <div class="empty-state-icon">💬</div>
                            <h3>Aucun témoignage</h3>
                        </div>
                    ` : `
                        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(340px, 1fr)); gap:1rem;">
                            ${testimonials.map(t => `
                                <div style="background:white; border-radius:12px; padding:1.5rem; box-shadow:var(--shadow); border-left:4px solid var(--primary); position:relative;">
                                    <div style="position:absolute; top:0.8rem; right:0.8rem; display:flex; gap:0.3rem;">
                                        <button class="btn btn-sm btn-outline" onclick='ouvrirModalEdition("testimonial", ${JSON.stringify(t).replace(/'/g, "\\u0027")}, "/api/testimonials/${t.id}/", "testimonials")'>✏️</button>
                                        <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/testimonials/${t.id}/', 'testimonials')">🗑️</button>
                                    </div>
                                    <div style="color:#FFD700; margin-bottom:0.5rem;">${t.stars || '⭐⭐⭐⭐⭐'}</div>
                                    <p style="font-style:italic; color:var(--text); margin-bottom:1rem; line-height:1.6; padding-right:3rem;">
                                        "${escapeHtml((t.contenu || '').substring(0, 200))}..."
                                    </p>
                                    <div style="display:flex; align-items:center; gap:0.8rem;">
                                        <div style="width:45px; height:45px; border-radius:50%; overflow:hidden; flex-shrink:0; ${t.photo ? '' : 'background:var(--primary); color:white; display:flex; align-items:center; justify-content:center; font-weight:bold;'}">
                                            ${t.photo ? `<img src="${t.photo}" style="width:100%; height:100%; object-fit:cover;">` : escapeHtml(t.avatar_initiales || t.nom_client?.substring(0, 2).toUpperCase() || 'NA')}
                                        </div>
                                        <div>
                                            <strong style="font-size:0.9rem;">${escapeHtml(t.nom_client)}</strong>
                                            <br><small style="color:var(--text-light);">${escapeHtml(t.fonction_client || '')}${t.entreprise ? ' - ' + escapeHtml(t.entreprise) : ''}</small>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;

    } catch (error) {
        showError(`Témoignages : ${error.message}`);
    }
}


// ========================================
// MODULE ENRICHI : STATISTIQUES
// ========================================
async function loadStatisticsModule() {
    const area = document.getElementById('contentArea');

    try {
        let stats = [];

        try {
            const response = await apiGet('/api/statistiq/');
            stats = Array.isArray(response) ? response : (response.results || []);
        } catch (apiError) {
            const publicResponse = await fetch(`${API_BASE}/api/statistiq/`, {
                headers: { 'Accept': 'application/json' }
            });
            if (publicResponse.ok) {
                const publicData = await publicResponse.json();
                stats = Array.isArray(publicData) ? publicData : (publicData.results || []);
            }
        }

        area.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3>📈 Statistiques du site (${stats.length})</h3>
                    <div class="card-header-actions">
                        <button class="btn btn-primary btn-sm" onclick="ouvrirFormulaireCreation('statistic')">
                            + Ajouter
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    ${stats.length === 0 ? `
                        <div class="empty-state">
                            <div class="empty-state-icon">📈</div>
                            <h3>Aucune statistique</h3>
                        </div>
                    ` : `
                        <div class="stats-row" style="margin-bottom:2rem;">
                            ${stats.map(s => `
                                <div class="stat-card" style="position:relative;">
                                    <div style="position:absolute; top:0.5rem; right:0.5rem; display:flex; gap:0.2rem;">
                                        <button class="btn btn-sm btn-outline" onclick='ouvrirModalEdition("statistic", ${JSON.stringify(s).replace(/'/g, "\\u0027")}, "/api/statistiq/${s.id}/", "statistics")' style="padding:2px 6px;">✏️</button>
                                        <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/statistiq/${s.id}/', 'statistics')" style="padding:2px 6px;">🗑️</button>
                                    </div>
                                    <div class="stat-card-info" style="text-align:center; width:100%;">
                                        <div class="stat-card-value" style="color:var(--primary);">${s.valeur}${escapeHtml(s.suffixe || '+')}</div>
                                        <div class="stat-card-label">${escapeHtml(s.label)}</div>
                                        <div style="font-size:0.7rem; color:var(--text-light); margin-top:0.3rem;">Ordre: ${s.ordre || 0}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                        <div class="table-container">
                            <table class="dash-table">
                                <thead>
                                    <tr>
                                        <th>Ordre</th>
                                        <th>Label</th>
                                        <th>Valeur</th>
                                        <th>Suffixe</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${stats.map(s => `
                                        <tr>
                                            <td>${s.ordre || 0}</td>
                                            <td><strong>${escapeHtml(s.label)}</strong></td>
                                            <td style="font-size:1.2rem; font-weight:700; color:var(--primary);">${s.valeur}</td>
                                            <td>${escapeHtml(s.suffixe || '+')}</td>
                                            <td>
                                                <div class="item-actions">
                                                    <button class="btn btn-sm btn-outline" onclick='ouvrirModalEdition("statistic", ${JSON.stringify(s).replace(/'/g, "\\u0027")}, "/api/statistiq/${s.id}/", "statistics")'>✏️</button>
                                                    <button class="btn btn-sm btn-danger" onclick="supprimerItem('/api/statistiq/${s.id}/', 'statistics')">🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>
            </div>
        `;

    } catch (error) {
        showError(`Statistiques : ${error.message}`);
    }
}



// ========================================
// ACTIONS COMMUNES : SUPPRESSION
// ========================================
async function supprimerItem(endpoint, moduleRedirect) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.')) {
        return;
    }

    try {
        await apiDelete(endpoint);
        navigateTo(moduleRedirect);
    } catch (error) {
        alert(`Erreur lors de la suppression : ${error.message}`);
    }
}


// ========================================
// FORMULAIRE DE CRÉATION (MODAL)
// ========================================
function ouvrirFormulaireCreation(type) {
    const existant = document.getElementById('modalCreation');
    if (existant) existant.remove();

    let titre = '';
    let champsHTML = '';
    let endpoint = '';
    let moduleRedirect = '';
    let useFormData = false;

    switch (type) {
        case 'produit':
            titre = 'Ajouter un produit';
            endpoint = '/api/produits/';
            moduleRedirect = 'produits';
            useFormData = true;
            champsHTML = `
                <div class="login-field"><label>Nom *</label><input type="text" id="modalNom" required></div>
                <div class="login-field"><label>Type *</label>
                    <select id="modalType" required>
                        <option value="ANANAS">Ananas</option><option value="FRUITS">Fruits</option>
                        <option value="LEGUME">Légume</option><option value="TUBERCULE">Tubercule</option>
                        <option value="EPICES">Épices</option><option value="DESHYDRATE">Déshydraté</option>
                        <option value="AUTRE">Autre</option>
                    </select>
                </div>
                <div class="login-field"><label>Description (FR) *</label><textarea id="modalDescFr" rows="3" required></textarea></div>
                <div class="login-field"><label>Description (EN)</label><textarea id="modalDescEn" rows="3"></textarea></div>
                <div class="login-field"><label>Prix unitaire (FCFA) *</label><input type="number" id="modalPrix" step="0.01" required></div>
                <div class="login-field"><label>Stock (kg)</label><input type="number" id="modalStock" value="0"></div>
                <div class="login-field"><label><input type="checkbox" id="modalPremium"> Produit premium</label></div>
                ${renderImageUploadField('modalImage', 'Image du produit')}
            `;
            break;

        case 'gallery':
            titre = 'Ajouter une image';
            endpoint = '/api/gallery/';
            moduleRedirect = 'gallery';
            useFormData = true;
            champsHTML = `
                <div class="login-field"><label>Titre (FR) *</label><input type="text" id="modalTitreFr" required></div>
                <div class="login-field"><label>Titre (EN)</label><input type="text" id="modalTitreEn"></div>
                <div class="login-field"><label>Description (FR)</label><textarea id="modalDescFr" rows="2"></textarea></div>
                <div class="login-field"><label>Catégorie</label>
                    <select id="modalCategorie">
                        <option value="PLANTATION">Plantation</option><option value="RECOLTE">Récolte</option>
                        <option value="PRODUCTION">Production</option><option value="EQUIPE">Équipe</option>
                        <option value="AUTRE">Autre</option>
                    </select>
                </div>
                <div class="login-field"><label>Ordre</label><input type="number" id="modalOrdre" value="0"></div>
                ${renderImageUploadField('modalImage', 'Image *', null, true)}
            `;
            break;

        case 'partner':
            titre = 'Ajouter un partenaire';
            endpoint = '/api/partners/';
            moduleRedirect = 'partners';
            useFormData = true;
            champsHTML = `
                <div class="login-field"><label>Nom *</label><input type="text" id="modalNom" required></div>
                <div class="login-field"><label>Type de partenaire *</label>
                    <select id="modalType" required>
                        <option value="FOURNISSEUR">Fournisseur</option>
                        <option value="CLIENT_B2B">Client B2B</option>
                        <option value="DISTRIBUTEUR">Distributeur</option>
                        <option value="INVESTISSEUR">Investisseur</option>
                        <option value="INSTITUTION">Institution</option>
                        <option value="ONG">ONG / Association</option>
                        <option value="AUTRE">Autre</option>
                    </select>
                </div>
                <div class="login-field"><label>Description (FR)</label><textarea id="modalDescFr" rows="2"></textarea></div>
                <div class="login-field"><label>Nom du contact</label><input type="text" id="modalContactNom" placeholder="Ex: Jean Dupont"></div>
                <div class="login-field"><label>Email du contact</label><input type="email" id="modalContactEmail" placeholder="contact@exemple.com"></div>
                <div class="login-field"><label>Téléphone du contact</label><input type="text" id="modalContactTel" placeholder="+237 6XX XXX XXX"></div>
                <div class="login-field"><label>Site web</label><input type="url" id="modalSiteWeb" placeholder="https://..."></div>
                <div class="login-field"><label>Ville</label><input type="text" id="modalVille" placeholder="Douala"></div>
                <div class="login-field"><label>Pays</label><input type="text" id="modalPays" value="Cameroun"></div>
                <div class="login-field"><label>Date début partenariat</label><input type="date" id="modalDateDebut"></div>
                <div class="login-field"><label>Ordre</label><input type="number" id="modalOrdre" value="0"></div>
                <div class="login-field"><label><input type="checkbox" id="modalFeatured"> Mis en avant</label></div>
                ${renderImageUploadField('modalImage', 'Logo du partenaire')}
            `;
            break;

        case 'blog':
            titre = 'Nouvel article';
            endpoint = '/api/blog/';
            moduleRedirect = 'blogadmin';
            useFormData = true;
            champsHTML = `
                <div class="login-field"><label>Titre (FR) *</label><input type="text" id="modalTitreFr" required></div>
                <div class="login-field"><label>Titre (EN)</label><input type="text" id="modalTitreEn"></div>
                <div class="login-field"><label>Extrait (FR) *</label><textarea id="modalExtraitFr" rows="2" required></textarea></div>
                <div class="login-field"><label>Contenu (FR) *</label><textarea id="modalContenuFr" rows="6" required></textarea></div>
                <div class="login-field"><label>Auteur *</label><input type="text" id="modalAuteur" value="Admin" required></div>
                <div class="login-field"><label>Date *</label><input type="date" id="modalDatePub" value="${new Date().toISOString().split('T')[0]}" required></div>
                ${renderImageUploadField('modalImage', 'Image article')}
            `;
            break;

        case 'testimonial':
            titre = 'Ajouter un témoignage';
            endpoint = '/api/testimonials/';
            moduleRedirect = 'testimonials';
            useFormData = true;
            champsHTML = `
                <div class="login-field"><label>Nom du client *</label><input type="text" id="modalNomClient" required></div>
                <div class="login-field"><label>Fonction (FR) *</label><input type="text" id="modalFonctionFr" required></div>
                <div class="login-field"><label>Entreprise</label><input type="text" id="modalEntreprise"></div>
                <div class="login-field"><label>Témoignage (FR) *</label><textarea id="modalContenuFr" rows="4" required></textarea></div>
                <div class="login-field"><label>Note (1-5) *</label><input type="number" id="modalNote" min="1" max="5" value="5" required></div>
                <div class="login-field"><label>Initiales</label><input type="text" id="modalInitiales" maxlength="3"></div>
                ${renderImageUploadField('modalImage', 'Photo client')}
            `;
            break;

        case 'statistic':
            titre = 'Ajouter une statistique';
            endpoint = '/api/statistiq/';
            moduleRedirect = 'statistiq';
            champsHTML = `
                <div class="login-field"><label>Label (FR) *</label><input type="text" id="modalLabelFr" required></div>
                <div class="login-field"><label>Label (EN)</label><input type="text" id="modalLabelEn"></div>
                <div class="login-field"><label>Valeur *</label><input type="number" id="modalValeur" required></div>
                <div class="login-field"><label>Suffixe</label><input type="text" id="modalSuffixe" value="+"></div>
                <div class="login-field"><label>Ordre</label><input type="number" id="modalOrdre" value="0"></div>
            `;
            break;

        default:
            return;
    }

    const modal = document.createElement('div');
    modal.id = 'modalCreation';
    modal.style.cssText = `position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;`;

    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:550px; max-height:90vh; overflow-y:auto; box-shadow:var(--shadow-lg);">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
                <h3 style="color:var(--primary);">➕ ${titre}</h3>
                <button onclick="document.getElementById('modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="modalForm" style="padding:1.5rem; display:flex; flex-direction:column; gap:1rem;" enctype="multipart/form-data">
                ${champsHTML}
                <button type="submit" class="btn btn-primary" style="width:100%; padding:0.8rem; margin-top:0.5rem;">Enregistrer</button>
                <p id="modalError" style="color:var(--danger); font-size:0.9rem; text-align:center;"></p>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('modalForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = document.getElementById('modalError');
        errorEl.textContent = '';

        try {
            const fileInput = document.getElementById('modalImage');
            const hasFile = fileInput && fileInput.files.length > 0;

            if (useFormData || hasFile) {
                const formData = new FormData();

                switch (type) {
                    case 'produit':
                        formData.append('nom', document.getElementById('modalNom').value);
                        formData.append('type_produit', document.getElementById('modalType').value);
                        formData.append('description_fr', document.getElementById('modalDescFr').value);
                        formData.append('description_en', document.getElementById('modalDescEn')?.value || '');
                        formData.append('prix_unitaire_fcfa', document.getElementById('modalPrix').value);
                        formData.append('stock_kg', document.getElementById('modalStock').value || 0);
                        formData.append('est_premium', document.getElementById('modalPremium').checked);
                        break;
                    case 'gallery':
                        formData.append('titre_fr', document.getElementById('modalTitreFr').value);
                        formData.append('titre_en', document.getElementById('modalTitreEn')?.value || '');
                        formData.append('description_fr', document.getElementById('modalDescFr')?.value || '');
                        formData.append('categorie', document.getElementById('modalCategorie').value);
                        formData.append('ordre', document.getElementById('modalOrdre').value || 0);
                        formData.append('est_visible', true);
                        break;
                    case 'partner':
                        formData.append('nom', document.getElementById('modalNom').value);
                        formData.append('type_partenaire', document.getElementById('modalType').value);
                        formData.append('description_fr', document.getElementById('modalDescFr')?.value || '');
                        formData.append('contact_nom', document.getElementById('modalContactNom')?.value || '');
                        formData.append('contact_email', document.getElementById('modalContactEmail')?.value || '');
                        formData.append('contact_telephone', document.getElementById('modalContactTel')?.value || '');
                        formData.append('site_web', document.getElementById('modalSiteWeb')?.value || '');
                        formData.append('ville', document.getElementById('modalVille')?.value || '');
                        formData.append('pays', document.getElementById('modalPays')?.value || 'Cameroun');
                        formData.append('date_debut_partenariat', document.getElementById('modalDateDebut')?.value || '');
                        formData.append('ordre', document.getElementById('modalOrdre').value || 0);
                        formData.append('est_visible', true);
                        formData.append('est_featured', document.getElementById('modalFeatured')?.checked || false);
                        break;
                    case 'blog':
                        formData.append('titre_fr', document.getElementById('modalTitreFr').value);
                        formData.append('titre_en', document.getElementById('modalTitreEn')?.value || '');
                        formData.append('extrait_fr', document.getElementById('modalExtraitFr').value);
                        formData.append('contenu_fr', document.getElementById('modalContenuFr').value);
                        formData.append('auteur', document.getElementById('modalAuteur').value);
                        formData.append('date_publication', document.getElementById('modalDatePub').value);
                        formData.append('est_publie', true);
                        break;
                    case 'testimonial':
                        formData.append('nom_client', document.getElementById('modalNomClient').value);
                        formData.append('fonction_client_fr', document.getElementById('modalFonctionFr').value);
                        formData.append('entreprise', document.getElementById('modalEntreprise')?.value || '');
                        formData.append('contenu_fr', document.getElementById('modalContenuFr').value);
                        formData.append('note', document.getElementById('modalNote').value);
                        formData.append('avatar_initiales', document.getElementById('modalInitiales')?.value || '');
                        formData.append('est_visible', true);
                        break;
                }

                if (hasFile) {
                    formData.append('image', fileInput.files[0]);
                }

                await uploadImage(endpoint, formData);

            } else {
                let payload = {};
                switch (type) {
                    case 'statistic':
                        payload = {
                            label_fr: document.getElementById('modalLabelFr').value,
                            label_en: document.getElementById('modalLabelEn')?.value || '',
                            valeur: parseInt(document.getElementById('modalValeur').value),
                            suffixe: document.getElementById('modalSuffixe')?.value || '+',
                            ordre: parseInt(document.getElementById('modalOrdre').value) || 0,
                            est_visible: true
                        };
                        break;
                }
                await apiPost(endpoint, payload);
            }

            modal.remove();
            navigateTo(moduleRedirect);

        } catch (error) {
            errorEl.textContent = `Erreur : ${error.message}`;
        }
    });
}




// ========================================
// COMPOSANT : BARRE DE RECHERCHE & FILTRES
// ========================================
function renderSearchBar(options = {}) {
    const {
        placeholder = 'Rechercher...',
        moduleRedirect = '',
        filters = []
    } = options;

    const savedSearch = AppState.searchValues[moduleRedirect] || '';

    const filtersHTML = filters.map(f => {
        const savedValue = getFilterValue(moduleRedirect, f.key);
        return `
            <select class="filter-select" data-filter="${f.key}" onchange="handleFilterChange('${moduleRedirect}')">
                <option value="">${f.label}</option>
                ${f.options.map(opt =>
                    `<option value="${opt.value}" ${savedValue === opt.value ? 'selected' : ''}>${opt.label}</option>`
                ).join('')}
            </select>
        `;
    }).join('');

    return `
        <div class="search-filter-bar">
            <div class="search-input-wrapper">
                <span class="search-icon">🔍</span>
                <input type="text"
                    class="search-input"
                    id="searchInput_${moduleRedirect}"
                    placeholder="${placeholder}"
                    value="${escapeHtml(savedSearch)}"
                    onkeyup="handleSearchKeyup(event, '${moduleRedirect}')">
            </div>
            <div class="filter-group">
                ${filtersHTML}
            </div>
            <button class="btn btn-sm btn-outline" onclick="resetFilters('${moduleRedirect}')">
                🔄 Réinitialiser
            </button>
        </div>
    `;
}

function handleSearchKeyup(event, moduleRedirect) {
    // Sauvegarder la valeur avant de recharger
    const input = document.getElementById(`searchInput_${moduleRedirect}`);
    if (input) {
        AppState.searchValues[moduleRedirect] = input.value;
    }
    if (event.key === 'Enter') {
        navigateTo(moduleRedirect);
    }
}

function handleFilterChange(moduleRedirect) {
    // Sauvegarder toutes les valeurs de filtres
    document.querySelectorAll('.filter-select').forEach(sel => {
        if (!AppState.filterValues[moduleRedirect]) {
            AppState.filterValues[moduleRedirect] = {};
        }
        AppState.filterValues[moduleRedirect][sel.dataset.filter] = sel.value;
    });

    // Sauvegarder aussi la recherche
    const input = document.getElementById(`searchInput_${moduleRedirect}`);
    if (input) {
        AppState.searchValues[moduleRedirect] = input.value;
    }

    navigateTo(moduleRedirect);
}

function resetFilters(moduleRedirect) {
    AppState.searchValues[moduleRedirect] = '';
    AppState.filterValues[moduleRedirect] = {};
    navigateTo(moduleRedirect);
}

function getSearchValue(moduleRedirect) {
    return AppState.searchValues[moduleRedirect] || '';
}

function getFilterValue(moduleRedirect, filterKey) {
    if (AppState.filterValues[moduleRedirect]) {
        return AppState.filterValues[moduleRedirect][filterKey] || '';
    }
    return '';
}



function filterLocally(items, searchValue, searchFields = []) {
    if (!searchValue) return items;
    const query = searchValue.toLowerCase();
    return items.filter(item => {
        return searchFields.some(field => {
            const val = item[field];
            return val && String(val).toLowerCase().includes(query);
        });
    });
}


// ========================================
// COMPOSANT : UPLOAD D'IMAGES
// ========================================
async function uploadImage(endpoint, formData) {
    const token = getToken();
    if (!token) {
        throw new Error('Non authentifié');
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (response.status === 401) {
            const refreshed = await refreshAccessToken();
            if (refreshed) {
                const retryResponse = await fetch(`${API_BASE}${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${getToken()}`
                    },
                    body: formData
                });

                if (!retryResponse.ok) {
                    const err = await retryResponse.json().catch(() => ({}));
                    throw new Error(JSON.stringify(err));
                }
                return await retryResponse.json();
            }
            throw new Error('Session expirée');
        }

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(JSON.stringify(err));
        }

        return await response.json();

    } catch (error) {
        throw error;
    }
}

async function uploadImageUpdate(endpoint, formData) {
    const token = getToken();
    if (!token) throw new Error('Non authentifié');

    const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(JSON.stringify(err));
    }

    return await response.json();
}

function renderImageUploadField(fieldId, label, currentUrl = null, required = false) {
    return `
        <div class="login-field">
            <label>${label} ${required ? '*' : ''}</label>
            ${currentUrl ? `
                <div style="margin-bottom:0.5rem;">
                    <img src="${currentUrl}" style="max-width:150px; max-height:100px; object-fit:cover; border-radius:8px; border:1px solid var(--border);">
                    <small style="display:block; color:var(--text-light); margin-top:0.3rem;">Image actuelle</small>
                </div>
            ` : ''}
            <input type="file" id="${fieldId}" accept="image/*" ${required && !currentUrl ? 'required' : ''} 
                style="padding:0.5rem; border:2px dashed var(--border); border-radius:8px; width:100%; cursor:pointer;">
            <small style="color:var(--text-light);">Formats: JPG, PNG, WebP (max 5Mo)</small>
        </div>
    `;
}


// ========================================
// COMPOSANT : MODAL D'ÉDITION UNIVERSEL
// ========================================
function ouvrirModalEdition(type, data, endpoint, moduleRedirect) {
    const existant = document.getElementById('modalCreation');
    if (existant) existant.remove();

    let titre = '';
    let champsHTML = '';
    let useFormData = false;

    switch (type) {
        case 'produit':
            titre = `Modifier : ${data.nom}`;
            useFormData = true;
            champsHTML = `
                <div class="login-field">
                    <label>Nom *</label>
                    <input type="text" id="editNom" value="${escapeHtml(data.nom || '')}" required>
                </div>
                <div class="login-field">
                    <label>Type de produit *</label>
                    <select id="editType" required>
                        ${['ANANAS','FRUITS','LEGUME','TUBERCULE','EPICES','DESHYDRATE','AUTRE'].map(t =>
                            `<option value="${t}" ${data.type_produit === t ? 'selected' : ''}>${t}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="login-field">
                    <label>Description (FR) *</label>
                    <textarea id="editDescFr" rows="3" required>${escapeHtml(data.description || data.description_fr || '')}</textarea>
                </div>
                <div class="login-field">
                    <label>Prix unitaire (FCFA) *</label>
                    <input type="number" id="editPrix" step="0.01" value="${data.prix_unitaire_fcfa || 0}" required>
                </div>
                <div class="login-field">
                    <label>Stock (kg)</label>
                    <input type="number" id="editStock" value="${data.stock_kg || 0}">
                </div>
                <div class="login-field">
                    <label><input type="checkbox" id="editPremium" ${data.est_premium ? 'checked' : ''}> Produit premium</label>
                </div>
                ${renderImageUploadField('editImage', 'Image du produit', data.image)}
            `;
            break;

        case 'gallery':
            titre = `Modifier : ${data.titre || 'Image galerie'}`;
            useFormData = true;
            champsHTML = `
                <div class="login-field">
                    <label>Titre (FR) *</label>
                    <input type="text" id="editTitreFr" value="${escapeHtml(data.titre || data.titre_fr || '')}" required>
                </div>
                <div class="login-field">
                    <label>Description (FR)</label>
                    <textarea id="editDescFr" rows="2">${escapeHtml(data.description || data.description_fr || '')}</textarea>
                </div>
                <div class="login-field">
                    <label>Catégorie</label>
                    <select id="editCategorie">
                        ${['PLANTATION','RECOLTE','PRODUCTION','EQUIPE','AUTRE'].map(c =>
                            `<option value="${c}" ${data.categorie === c ? 'selected' : ''}>${c}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="login-field">
                    <label>Ordre</label>
                    <input type="number" id="editOrdre" value="${data.ordre || 0}">
                </div>
                <div class="login-field">
                    <label><input type="checkbox" id="editVisible" ${data.est_visible !== false ? 'checked' : ''}> Visible sur le site</label>
                </div>
                ${renderImageUploadField('editImage', 'Image', data.image)}
            `;
            break;

        case 'partner':
            titre = `Modifier : ${data.nom}`;
            useFormData = true;
            champsHTML = `
                <div class="login-field"><label>Nom *</label><input type="text" id="editNom" value="${escapeHtml(data.nom || '')}" required></div>
                <div class="login-field"><label>Type de partenaire *</label>
                    <select id="editType">
                        ${['FOURNISSEUR','CLIENT_B2B','DISTRIBUTEUR','INVESTISSEUR','INSTITUTION','ONG','AUTRE'].map(t =>
                            `<option value="${t}" ${data.type_partenaire === t ? 'selected' : ''}>${t}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="login-field"><label>Description (FR)</label><textarea id="editDescFr" rows="2">${escapeHtml(data.description || data.description_fr || '')}</textarea></div>
                <div class="login-field"><label>Nom du contact</label><input type="text" id="editContactNom" value="${escapeHtml(data.contact_nom || '')}"></div>
                <div class="login-field"><label>Email du contact</label><input type="email" id="editContactEmail" value="${escapeHtml(data.contact_email || '')}"></div>
                <div class="login-field"><label>Téléphone du contact</label><input type="text" id="editContactTel" value="${escapeHtml(data.contact_telephone || '')}"></div>
                <div class="login-field"><label>Site web</label><input type="url" id="editSiteWeb" value="${escapeHtml(data.site_web || '')}"></div>
                <div class="login-field"><label>Ville</label><input type="text" id="editVille" value="${escapeHtml(data.ville || '')}"></div>
                <div class="login-field"><label>Pays</label><input type="text" id="editPays" value="${escapeHtml(data.pays || 'Cameroun')}"></div>
                <div class="login-field"><label>Date début partenariat</label><input type="date" id="editDateDebut" value="${data.date_debut_partenariat || ''}"></div>
                <div class="login-field"><label>Ordre</label><input type="number" id="editOrdre" value="${data.ordre || 0}"></div>
                <div class="login-field"><label><input type="checkbox" id="editVisible" ${data.est_visible !== false ? 'checked' : ''}> Visible sur le site</label></div>
                <div class="login-field"><label><input type="checkbox" id="editFeatured" ${data.est_featured ? 'checked' : ''}> Mis en avant</label></div>
                ${renderImageUploadField('editImage', 'Logo', data.logo_url || data.logo)}
            `;
            break;

        case 'blog':
            titre = `Modifier : ${data.titre || data.titre_fr}`;
            useFormData = true;
            champsHTML = `
                <div class="login-field">
                    <label>Titre (FR) *</label>
                    <input type="text" id="editTitreFr" value="${escapeHtml(data.titre || data.titre_fr || '')}" required>
                </div>
                <div class="login-field">
                    <label>Titre (EN)</label>
                    <input type="text" id="editTitreEn" value="${escapeHtml(data.titre_en || '')}">
                </div>
                <div class="login-field">
                    <label>Extrait (FR) *</label>
                    <textarea id="editExtraitFr" rows="2" required>${escapeHtml(data.extrait || data.extrait_fr || '')}</textarea>
                </div>
                <div class="login-field">
                    <label>Contenu (FR) *</label>
                    <textarea id="editContenuFr" rows="8" required>${escapeHtml(data.contenu || data.contenu_fr || '')}</textarea>
                </div>
                <div class="login-field">
                    <label>Auteur *</label>
                    <input type="text" id="editAuteur" value="${escapeHtml(data.auteur || 'Admin')}" required>
                </div>
                <div class="login-field">
                    <label>Date de publication *</label>
                    <input type="date" id="editDatePub" value="${data.date_publication || ''}" required>
                </div>
                <div class="login-field">
                    <label><input type="checkbox" id="editPublie" ${data.est_publie !== false ? 'checked' : ''}> Publié</label>
                </div>
                ${renderImageUploadField('editImage', 'Image article', data.image)}
            `;
            break;

        case 'testimonial':
            titre = `Modifier : ${data.nom_client}`;
            useFormData = true;
            champsHTML = `
                <div class="login-field">
                    <label>Nom du client *</label>
                    <input type="text" id="editNomClient" value="${escapeHtml(data.nom_client || '')}" required>
                </div>
                <div class="login-field">
                    <label>Fonction (FR) *</label>
                    <input type="text" id="editFonctionFr" value="${escapeHtml(data.fonction_client || data.fonction_client_fr || '')}" required>
                </div>
                <div class="login-field">
                    <label>Entreprise</label>
                    <input type="text" id="editEntreprise" value="${escapeHtml(data.entreprise || '')}">
                </div>
                <div class="login-field">
                    <label>Témoignage (FR) *</label>
                    <textarea id="editContenuFr" rows="4" required>${escapeHtml(data.contenu || data.contenu_fr || '')}</textarea>
                </div>
                <div class="login-field">
                    <label>Note (1-5) *</label>
                    <input type="number" id="editNote" min="1" max="5" value="${data.note || 5}" required>
                </div>
                <div class="login-field">
                    <label>Initiales avatar</label>
                    <input type="text" id="editInitiales" maxlength="3" value="${escapeHtml(data.avatar_initiales || '')}">
                </div>
                <div class="login-field">
                    <label><input type="checkbox" id="editVisible" ${data.est_visible !== false ? 'checked' : ''}> Visible</label>
                </div>
                ${renderImageUploadField('editImage', 'Photo client', data.photo)}
            `;
            break;

        case 'statistic':
            titre = `Modifier : ${data.label || data.label_fr}`;
            champsHTML = `
                <div class="login-field">
                    <label>Label (FR) *</label>
                    <input type="text" id="editLabelFr" value="${escapeHtml(data.label || data.label_fr || '')}" required>
                </div>
                <div class="login-field">
                    <label>Label (EN)</label>
                    <input type="text" id="editLabelEn" value="${escapeHtml(data.label_en || '')}">
                </div>
                <div class="login-field">
                    <label>Valeur *</label>
                    <input type="number" id="editValeur" value="${data.valeur || 0}" required>
                </div>
                <div class="login-field">
                    <label>Suffixe</label>
                    <input type="text" id="editSuffixe" value="${escapeHtml(data.suffixe || '+')}">
                </div>
                <div class="login-field">
                    <label>Ordre</label>
                    <input type="number" id="editOrdre" value="${data.ordre || 0}">
                </div>
                <div class="login-field">
                    <label><input type="checkbox" id="editVisible" ${data.est_visible !== false ? 'checked' : ''}> Visible</label>
                </div>
            `;
            break;

        default:
            return;
    }

    const modal = document.createElement('div');
    modal.id = 'modalCreation';
    modal.style.cssText = `
        position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000;
        display:flex; align-items:center; justify-content:center; padding:20px;
    `;

    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:600px; max-height:90vh; overflow-y:auto; box-shadow:var(--shadow-lg);">
            <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
                <h3 style="color:var(--primary);">✏️ ${titre}</h3>
                <button onclick="document.getElementById('modalCreation').remove()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">✕</button>
            </div>
            <form id="editForm" style="padding:1.5rem; display:flex; flex-direction:column; gap:1rem;" ${useFormData ? 'enctype="multipart/form-data"' : ''}>
                ${champsHTML}
                <div style="display:flex; gap:0.5rem; margin-top:0.5rem;">
                    <button type="submit" class="btn btn-primary" style="flex:1; padding:0.8rem;">
                        💾 Enregistrer les modifications
                    </button>
                    <button type="button" class="btn btn-outline" onclick="document.getElementById('modalCreation').remove()" style="padding:0.8rem;">
                        Annuler
                    </button>
                </div>
                <p id="editError" style="color:var(--danger); font-size:0.9rem; text-align:center;"></p>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    document.getElementById('editForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = document.getElementById('editError');
        errorEl.textContent = '';

        try {
            let hasFile = false;
            const fileInput = document.getElementById('editImage');
            if (fileInput && fileInput.files.length > 0) {
                hasFile = true;
            }

            if (hasFile || useFormData) {
                const formData = new FormData();

                switch (type) {
                    case 'produit':
                        formData.append('nom', document.getElementById('editNom').value);
                        formData.append('type_produit', document.getElementById('editType').value);
                        formData.append('description_fr', document.getElementById('editDescFr').value);
                        formData.append('prix_unitaire_fcfa', document.getElementById('editPrix').value);
                        formData.append('stock_kg', document.getElementById('editStock').value || 0);
                        formData.append('est_premium', document.getElementById('editPremium').checked);
                        break;

                    case 'gallery':
                        formData.append('titre_fr', document.getElementById('editTitreFr').value);
                        formData.append('description_fr', document.getElementById('editDescFr')?.value || '');
                        formData.append('categorie', document.getElementById('editCategorie').value);
                        formData.append('ordre', document.getElementById('editOrdre').value || 0);
                        formData.append('est_visible', document.getElementById('editVisible').checked);
                        break;

                    case 'partner':
                        formData.append('nom', document.getElementById('editNom').value);
                        formData.append('type_partenaire', document.getElementById('editType').value);
                        formData.append('description_fr', document.getElementById('editDescFr')?.value || '');
                        formData.append('contact_nom', document.getElementById('editContactNom')?.value || '');
                        formData.append('contact_email', document.getElementById('editContactEmail')?.value || '');
                        formData.append('contact_telephone', document.getElementById('editContactTel')?.value || '');
                        formData.append('site_web', document.getElementById('editSiteWeb')?.value || '');
                        formData.append('ville', document.getElementById('editVille')?.value || '');
                        formData.append('pays', document.getElementById('editPays')?.value || '');
                        formData.append('date_debut_partenariat', document.getElementById('editDateDebut')?.value || '');
                        formData.append('ordre', document.getElementById('editOrdre').value || 0);
                        formData.append('est_visible', document.getElementById('editVisible').checked);
                        formData.append('est_featured', document.getElementById('editFeatured').checked);
                        break;

                    case 'blog':
                        formData.append('titre_fr', document.getElementById('editTitreFr').value);
                        formData.append('titre_en', document.getElementById('editTitreEn')?.value || '');
                        formData.append('extrait_fr', document.getElementById('editExtraitFr').value);
                        formData.append('contenu_fr', document.getElementById('editContenuFr').value);
                        formData.append('auteur', document.getElementById('editAuteur').value);
                        formData.append('date_publication', document.getElementById('editDatePub').value);
                        formData.append('est_publie', document.getElementById('editPublie').checked);
                        break;

                    case 'testimonial':
                        formData.append('nom_client', document.getElementById('editNomClient').value);
                        formData.append('fonction_client_fr', document.getElementById('editFonctionFr').value);
                        formData.append('entreprise', document.getElementById('editEntreprise')?.value || '');
                        formData.append('contenu_fr', document.getElementById('editContenuFr').value);
                        formData.append('note', document.getElementById('editNote').value);
                        formData.append('avatar_initiales', document.getElementById('editInitiales')?.value || '');
                        formData.append('est_visible', document.getElementById('editVisible').checked);
                        break;
                }

                if (fileInput && fileInput.files.length > 0) {
                    formData.append('image', fileInput.files[0]);
                }

                await uploadImageUpdate(endpoint, formData);

            } else {
                let payload = {};

                switch (type) {
                    case 'statistic':
                        payload = {
                            label_fr: document.getElementById('editLabelFr').value,
                            label_en: document.getElementById('editLabelEn')?.value || '',
                            valeur: parseInt(document.getElementById('editValeur').value),
                            suffixe: document.getElementById('editSuffixe')?.value || '+',
                            ordre: parseInt(document.getElementById('editOrdre').value) || 0,
                            est_visible: document.getElementById('editVisible').checked
                        };
                        break;
                }

                await apiPatch(endpoint, payload);
            }

            modal.remove();
            navigateTo(moduleRedirect);

        } catch (error) {
            errorEl.textContent = `Erreur : ${error.message}`;
        }
    });
}



// ========================================
// INITIALISATION
// ========================================
document.addEventListener('DOMContentLoaded', async function () {

    // ---- LOGIN FORM ----
    const loginForm = document.getElementById('dashLoginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('dashUsername').value.trim();
            const password = document.getElementById('dashPassword').value;
            const errorMsg = document.getElementById('loginErrorMsg');
            const loginBtn = document.getElementById('loginBtn');

            errorMsg.textContent = '';
            loginBtn.disabled = true;
            loginBtn.textContent = 'Connexion...';

            try {
                await login(username, password);
                showDashboard();
            } catch (error) {
                errorMsg.textContent = error.message;
            } finally {
                loginBtn.disabled = false;
                loginBtn.textContent = 'Se connecter';
            }
        });
    }

    // ---- SIDEBAR NAVIGATION ----
    document.querySelectorAll('.nav-item[data-module]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(item.dataset.module);
        });
    });

    // ---- HAMBURGER MENU ----
    const hamburger = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('sidebar');
    const sidebarClose = document.getElementById('sidebarClose');

    // Créer overlay
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.id = 'sidebarOverlay';
    document.body.appendChild(overlay);

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            sidebar.classList.add('open');
            overlay.classList.add('show');
        });
    }

    if (sidebarClose) {
        sidebarClose.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('show');
        });
    }

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
    });

    // ---- NOTIFICATIONS ----
    const notifBtn = document.getElementById('notifBtn');
    const notifDropdown = document.getElementById('notifDropdown');

    if (notifBtn) {
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = notifDropdown.style.display === 'block';
            notifDropdown.style.display = isVisible ? 'none' : 'block';
        });
    }

    document.addEventListener('click', () => {
        if (notifDropdown) notifDropdown.style.display = 'none';
    });

    const markAllBtn = document.getElementById('markAllReadBtn');
    if (markAllBtn) {
        markAllBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            marquerToutesLues();
        });
    }

    // ---- REFRESH ----
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            navigateTo(AppState.currentModule);
            loadNotifications();
        });
    }

    // ---- LOGOUT ----
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
                logout();
            }
        });
    }

    // ---- AUTO-REFRESH NOTIFICATIONS (toutes les 60s) ----
    setInterval(() => {
        if (AppState.user && getToken()) {
            loadNotifications();
        }
    }, 60000);

    // ---- VÉRIFIER AUTH AU CHARGEMENT ----
    const isAuthenticated = await checkAuth();
    if (isAuthenticated) {
        showDashboard();
    } else {
        showLoginScreen();
    }

    console.log('%c🌱 KAMCO FARM Dashboard', 'font-size: 16px; color: #188701; font-weight: bold;');
});



function renderExportButton(nomFichier) {
    return `<button class="btn-export" onclick="exporterOngletActifExcel('${nomFichier}')" title="Exporter en Excel">📊 Excel</button>`;
}