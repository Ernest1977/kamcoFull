// ========================================
// MODULE CALENDRIER
// ========================================

let calendarInstance = null;

async function loadCalendrierModule() {
    const area = document.getElementById('contentArea');

    area.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color:var(--primary);">📅 Calendrier des Événements</h4>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                <button class="btn btn-sm btn-outline" onclick="filtrerCalendrier('tous')">📅 Tous</button>
                <button class="btn btn-sm btn-outline" onclick="filtrerCalendrier('conge')" style="border-color:#FF9800; color:#FF9800;">📅 Congés</button>
                <button class="btn btn-sm btn-outline" onclick="filtrerCalendrier('maintenance')" style="border-color:#2196F3; color:#2196F3;">🔧 Maintenance</button>
                <button class="btn btn-sm btn-outline" onclick="filtrerCalendrier('location')" style="border-color:#4CAF50; color:#4CAF50;">📋 Locations</button>
                <button class="btn btn-sm btn-outline" onclick="filtrerCalendrier('reservation')" style="border-color:#E91E63; color:#E91E63;">📌 Réservations</button>
                <button class="btn btn-sm btn-outline" onclick="filtrerCalendrier('tache')" style="border-color:#673AB7; color:#673AB7;">📋 Tâches</button>
            </div>
        </div>

        <!-- Légende -->
        <div style="display:flex; gap:1rem; flex-wrap:wrap; margin-bottom:1rem; font-size:0.8rem;">
            <span style="display:flex; align-items:center; gap:0.3rem;"><span style="width:12px; height:12px; border-radius:50%; background:#FF9800; display:inline-block;"></span> Congés en attente</span>
            <span style="display:flex; align-items:center; gap:0.3rem;"><span style="width:12px; height:12px; border-radius:50%; background:#4CAF50; display:inline-block;"></span> Congés approuvés / Locations actives</span>
            <span style="display:flex; align-items:center; gap:0.3rem;"><span style="width:12px; height:12px; border-radius:50%; background:#2196F3; display:inline-block;"></span> Maintenance</span>
            <span style="display:flex; align-items:center; gap:0.3rem;"><span style="width:12px; height:12px; border-radius:50%; background:#E91E63; display:inline-block;"></span> Réservations</span>
            <span style="display:flex; align-items:center; gap:0.3rem;"><span style="width:12px; height:12px; border-radius:50%; background:#673AB7; display:inline-block;"></span> Tâches</span>
            <span style="display:flex; align-items:center; gap:0.3rem;"><span style="width:12px; height:12px; border-radius:50%; background:#FF5722; display:inline-block;"></span> Certifications</span>
        </div>

        <div class="card">
            <div class="card-body" style="padding:1rem;">
                <div id="calendarContainer" style="min-height:600px;"></div>
            </div>
        </div>
    `;

    setTimeout(() => initCalendar(), 100);
}

let currentFilter = 'tous';
let allEvents = [];

function initCalendar() {
    const container = document.getElementById('calendarContainer');
    if (!container) return;

    if (calendarInstance) {
        calendarInstance.destroy();
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    calendarInstance = new FullCalendar.Calendar(container, {
        initialView: 'dayGridMonth',
        locale: 'fr',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listWeek'
        },
        buttonText: {
            today: "Aujourd'hui",
            month: 'Mois',
            week: 'Semaine',
            list: 'Liste'
        },
        height: 'auto',
        navLinks: true,
        editable: false,
        dayMaxEvents: 3,
        moreLinkText: 'plus',
        themeSystem: 'standard',

        events: function(fetchInfo, successCallback, failureCallback) {
            const token = getToken();
            const start = fetchInfo.startStr.split('T')[0];
            const end = fetchInfo.endStr.split('T')[0];

            fetch(`${API_BASE}/api/administration/calendrier/?start=${start}&end=${end}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            })
            .then(response => response.json())
            .then(events => {
                allEvents = events;

                if (currentFilter !== 'tous') {
                    events = events.filter(e => e.type === currentFilter);
                }

                successCallback(events);
            })
            .catch(error => {
                console.error('Erreur calendrier:', error);
                failureCallback(error);
            });
        },

        eventClick: function(info) {
            const event = info.event;
            const details = event.extendedProps.details || {};
            const type = event.extendedProps.type;
            const module = event.extendedProps.module;

            const typeLabels = {
                'conge': '📅 Congé',
                'maintenance': '🔧 Maintenance',
                'location': '📋 Location',
                'reservation': '📌 Réservation',
                'certification': '📋 Certification',
                'tache': '📋 Tâche'
            };

            const existant = document.getElementById('modalCreation');
            if (existant) existant.remove();

            const modal = document.createElement('div');
            modal.id = 'modalCreation';
            modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px;';

            let detailsHTML = '';
            for (const [key, value] of Object.entries(details)) {
                if (value !== null && value !== undefined && value !== '') {
                    const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
                    const displayValue = typeof value === 'number' ? formatMoney(value) : escapeHtml(String(value));
                    detailsHTML += `<div class="detail-row"><span class="detail-label">${label}</span><span class="detail-value">${displayValue}</span></div>`;
                }
            }

            modal.innerHTML = `
                <div style="background:white; border-radius:16px; width:100%; max-width:500px;">
                    <div style="padding:1.5rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
                        <h3 style="color:var(--primary);">${typeLabels[type] || '📅 Événement'}</h3>
                        <button onclick="this.closest('#modalCreation').remove()" style="background:none; border:none; font-size:1.5rem; cursor:pointer;">✕</button>
                    </div>
                    <div style="padding:1.5rem;">
                        <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:1rem;">
                            <div style="width:12px; height:12px; border-radius:50%; background:${event.backgroundColor};"></div>
                            <strong>${escapeHtml(event.title)}</strong>
                        </div>
                        <div class="detail-row"><span class="detail-label">Début</span><span class="detail-value">${formatDate(event.startStr)}</span></div>
                        ${event.endStr ? `<div class="detail-row"><span class="detail-label">Fin</span><span class="detail-value">${formatDate(event.endStr)}</span></div>` : ''}
                        ${detailsHTML}
                        <div class="form-actions" style="margin-top:1rem;">
                            <button class="btn btn-outline" onclick="this.closest('#modalCreation').remove(); navigateTo('${module}')">Aller au module →</button>
                            <button class="btn btn-outline" onclick="this.closest('#modalCreation').remove()">Fermer</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
        },

        eventDidMount: function(info) {
            info.el.style.cursor = 'pointer';
            info.el.style.fontSize = '0.8rem';
            info.el.style.borderRadius = '4px';
        }
    });

    calendarInstance.render();
}

function filtrerCalendrier(type) {
    currentFilter = type;

    // Mettre à jour les boutons
    document.querySelectorAll('[onclick^="filtrerCalendrier"]').forEach(btn => {
        btn.style.fontWeight = 'normal';
        btn.style.opacity = '0.7';
    });

    const activeBtn = document.querySelector(`[onclick="filtrerCalendrier('${type}')"]`);
    if (activeBtn) {
        activeBtn.style.fontWeight = 'bold';
        activeBtn.style.opacity = '1';
    }

    if (calendarInstance) {
        calendarInstance.refetchEvents();
    }
}