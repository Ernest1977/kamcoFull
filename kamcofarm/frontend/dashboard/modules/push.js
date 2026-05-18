// ========================================
// NOTIFICATIONS PUSH NAVIGATEUR
// ========================================

let pushPermission = 'default';
let serviceWorkerRegistration = null;

async function initPushNotifications() {
    // Vérifier le support
    if (!('Notification' in window)) {
        console.warn('Les notifications ne sont pas supportées par ce navigateur');
        return;
    }

    if (!('serviceWorker' in navigator)) {
        console.warn('Service Worker non supporté');
        return;
    }

    pushPermission = Notification.permission;

    // Enregistrer le Service Worker
    try {
        serviceWorkerRegistration = await navigator.serviceWorker.register('/admin/sw.js');
        console.log('✅ Service Worker enregistré');
    } catch (error) {
        console.warn('Service Worker non enregistré:', error);
    }

    // Demander la permission si pas encore fait
    if (pushPermission === 'default') {
        setTimeout(demanderPermissionPush, 3000);
    }

    // Démarrer le polling des notifications
    if (pushPermission === 'granted') {
        demarrerPollingNotifications();
    }
}

function demanderPermissionPush() {
    if (pushPermission !== 'default') return;

    // Afficher une bannière élégante
    const banner = document.createElement('div');
    banner.id = 'pushBanner';
    banner.style.cssText = `
        position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
        z-index: 9999; background: white; border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.15); padding: 1.2rem 1.5rem;
        display: flex; align-items: center; gap: 1rem; max-width: 500px; width: 90%;
        animation: slideUp 0.5s ease;
    `;
    banner.innerHTML = `
        <span style="font-size: 2rem;">🔔</span>
        <div style="flex:1;">
            <strong style="font-size: 0.95rem;">Activer les notifications ?</strong>
            <p style="margin: 0.3rem 0 0; font-size: 0.85rem; color: #666;">
                Recevez les alertes importantes même quand le dashboard est fermé
            </p>
        </div>
        <div style="display:flex; gap: 0.5rem;">
            <button onclick="accepterPush()" style="background:#188701; color:white; border:none; padding:0.5rem 1rem; border-radius:8px; cursor:pointer; font-weight:600;">Activer</button>
            <button onclick="refuserPush()" style="background:none; border:1px solid #ddd; padding:0.5rem 1rem; border-radius:8px; cursor:pointer; color:#666;">Plus tard</button>
        </div>
    `;
    document.body.appendChild(banner);
}

async function accepterPush() {
    const banner = document.getElementById('pushBanner');
    if (banner) banner.remove();

    try {
        const permission = await Notification.requestPermission();
        pushPermission = permission;

        if (permission === 'granted') {
            envoyerNotificationLocale('🔔 Notifications activées', {
                body: 'Vous recevrez les alertes importantes de KAMCO FARM',
                icon: '/static/images/logo_kamco.png'
            });
            demarrerPollingNotifications();
        }
    } catch (error) {
        console.error('Erreur permission push:', error);
    }
}

function refuserPush() {
    const banner = document.getElementById('pushBanner');
    if (banner) banner.remove();
    localStorage.setItem('push_refused_until', Date.now() + 86400000); // Redemander dans 24h
}


// ========================================
// ENVOI DE NOTIFICATIONS NAVIGATEUR
// ========================================

function envoyerNotificationLocale(titre, options = {}) {
    if (pushPermission !== 'granted') return;

    const defaultOptions = {
        icon: '/static/images/logo_kamco.png',
        badge: '/static/images/logo_kamco.png',
        vibrate: [200, 100, 200],
        tag: options.tag || 'kamco-' + Date.now(),
        requireInteraction: false,
        silent: false,
        ...options
    };

    try {
        if (serviceWorkerRegistration) {
            serviceWorkerRegistration.showNotification(titre, defaultOptions);
        } else {
            new Notification(titre, defaultOptions);
        }
    } catch (error) {
        console.warn('Erreur notification:', error);
        try {
            new Notification(titre, defaultOptions);
        } catch(e) {}
    }
}


// ========================================
// POLLING DES NOTIFICATIONS
// ========================================

let lastNotifCheck = Date.now();
let pollingInterval = null;
let lastNotifIds = new Set();

function demarrerPollingNotifications() {
    if (pollingInterval) clearInterval(pollingInterval);

    // Vérifier toutes les 30 secondes
    pollingInterval = setInterval(() => {
        if (getToken() && AppState.user) {
            verifierNouvellesNotifications();
        }
    }, 30000);

    // Première vérification
    setTimeout(verifierNouvellesNotifications, 5000);
}

async function verifierNouvellesNotifications() {
    if (pushPermission !== 'granted') return;
    if (!getToken()) return;

    try {
        const data = await apiGet('/api/administration/notifications/non_lues/');

        if (!data || !data.notifications) return;

        const nouvelles = data.notifications.filter(n => !lastNotifIds.has(n.id));

        if (nouvelles.length > 0 && lastNotifIds.size > 0) {
            // Nouvelles notifications détectées
            nouvelles.forEach(notif => {
                const typeIcons = {
                    'INFO': 'ℹ️',
                    'SUCCESS': '✅',
                    'WARNING': '⚠️',
                    'ERROR': '❌',
                    'TACHE': '📋'
                };

                const icon = typeIcons[notif.type_notification] || '🔔';

                envoyerNotificationLocale(`${icon} ${notif.titre}`, {
                    body: notif.message ? notif.message.substring(0, 120) : '',
                    tag: `notif-${notif.id}`,
                    data: { url: '/admin/index.html', notifId: notif.id },
                    requireInteraction: notif.priorite === 'URGENTE' || notif.priorite === 'HAUTE'
                });
            });
        }

        // Mettre à jour les IDs connus
        lastNotifIds = new Set(data.notifications.map(n => n.id));

        // Mettre à jour le compteur in-app aussi
        updateNotifUI();

    } catch (error) {
        // Silencieux en cas d'erreur réseau
    }
}


// ========================================
// ALERTES SPÉCIALES
// ========================================

async function verifierAlertesUrgentes() {
    if (pushPermission !== 'granted') return;

    try {
        // Vérifier les alertes IoT
        const alertes = await apiGet('/api/equipements/alertes-iot/?active=true').catch(() => []);
        const alertesList = Array.isArray(alertes) ? alertes : (alertes.results || []);
        const critiques = alertesList.filter(a => a.severite === 'CRITIQUE');

        if (critiques.length > 0) {
            envoyerNotificationLocale('🚨 ALERTE CRITIQUE IoT', {
                body: `${critiques.length} alerte(s) critique(s) détectée(s) sur vos équipements !`,
                tag: 'alerte-iot-critique',
                requireInteraction: true
            });
        }

        // Vérifier les contrats en retard
        const contrats = await apiGet('/api/location/contrats/?en_retard=true').catch(() => []);
        const contratsList = Array.isArray(contrats) ? contrats : (contrats.results || []);

        if (contratsList.length > 0) {
            envoyerNotificationLocale('⏰ Contrats en retard', {
                body: `${contratsList.length} contrat(s) de location en retard de restitution`,
                tag: 'contrats-retard'
            });
        }

    } catch(e) {}
}

// Vérifier les alertes urgentes toutes les 5 minutes
setInterval(verifierAlertesUrgentes, 300000);


// ========================================
// INITIALISATION
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initPushNotifications, 2000);
});




function togglePushNotifications() {
    if (pushPermission === 'granted') {
        // Déjà activé — proposer de désactiver
        if (confirm('Les notifications push sont activées.\n\nVoulez-vous les désactiver ?')) {
            alert('Pour désactiver les notifications, allez dans les paramètres de votre navigateur.\n\nChrome: Paramètres > Confidentialité > Notifications\nFirefox: Paramètres > Vie privée > Notifications');
        }
    } else if (pushPermission === 'denied') {
        alert('Les notifications sont bloquées par votre navigateur.\n\nPour les réactiver :\n1. Cliquez sur le cadenas 🔒 dans la barre d\'adresse\n2. Activez les notifications');
    } else {
        accepterPush();
    }
}

function updatePushStatusUI() {
    const icon = document.getElementById('pushStatusIcon');
    if (!icon) return;

    if (pushPermission === 'granted') {
        icon.textContent = '🔔';
        icon.title = 'Notifications push activées';
    } else if (pushPermission === 'denied') {
        icon.textContent = '🔕';
        icon.title = 'Notifications push bloquées';
    } else {
        icon.textContent = '🔕';
        icon.title = 'Notifications push désactivées';
    }
}

// Mettre à jour l'UI après changement
async function accepterPush() {
    const banner = document.getElementById('pushBanner');
    if (banner) banner.remove();

    try {
        const permission = await Notification.requestPermission();
        pushPermission = permission;

        if (permission === 'granted') {
            envoyerNotificationLocale('🔔 Notifications activées', {
                body: 'Vous recevrez les alertes importantes de KAMCO FARM'
            });
            demarrerPollingNotifications();
        }

        updatePushStatusUI();
    } catch (error) {
        console.error('Erreur permission push:', error);
    }
}

// Mettre à jour au chargement
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(updatePushStatusUI, 3000);
});



// ========================================
// INSTALLATION PWA
// ========================================

let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;

    // Afficher le bouton d'installation après 5 secondes
    setTimeout(afficherBoutonInstallation, 5000);
});

function afficherBoutonInstallation() {
    if (!deferredInstallPrompt) return;

    // Vérifier si déjà installé
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // Vérifier si déjà refusé récemment
    const refused = localStorage.getItem('pwa_install_refused');
    if (refused && Date.now() - parseInt(refused) < 86400000) return; // 24h

    const banner = document.createElement('div');
    banner.id = 'installBanner';
    banner.style.cssText = `
        position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
        z-index: 9999; background: linear-gradient(135deg, #188701, #66BB6A);
        border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        padding: 1.2rem 1.5rem; display: flex; align-items: center; gap: 1rem;
        max-width: 550px; width: 90%; color: white;
        animation: slideUp 0.5s ease;
    `;
    banner.innerHTML = `
        <span style="font-size: 2.5rem;">📱</span>
        <div style="flex:1;">
            <strong style="font-size: 1rem;">Installer KAMCO Dashboard</strong>
            <p style="margin: 0.3rem 0 0; font-size: 0.85rem; opacity: 0.9;">
                Accédez au dashboard directement depuis votre bureau ou écran d'accueil
            </p>
        </div>
        <div style="display:flex; flex-direction:column; gap: 0.4rem;">
            <button onclick="installerPWA()" style="background:white; color:#188701; border:none; padding:0.5rem 1.2rem; border-radius:8px; cursor:pointer; font-weight:700; font-size:0.85rem;">
                📥 Installer
            </button>
            <button onclick="refuserInstallation()" style="background:none; border:1px solid rgba(255,255,255,0.5); color:white; padding:0.3rem 0.8rem; border-radius:8px; cursor:pointer; font-size:0.75rem;">
                Plus tard
            </button>
        </div>
    `;
    document.body.appendChild(banner);
}

async function installerPWA() {
    const banner = document.getElementById('installBanner');
    if (banner) banner.remove();

    if (!deferredInstallPrompt) return;

    deferredInstallPrompt.prompt();
    const result = await deferredInstallPrompt.userChoice;

    if (result.outcome === 'accepted') {
        console.log('✅ PWA installée');
        envoyerNotificationLocale('✅ KAMCO Dashboard installé !', {
            body: 'Accédez au dashboard depuis votre bureau ou écran d\'accueil'
        });
    }

    deferredInstallPrompt = null;
}

function refuserInstallation() {
    const banner = document.getElementById('installBanner');
    if (banner) banner.remove();
    localStorage.setItem('pwa_install_refused', Date.now().toString());
}

// Détecter si l'app est installée
window.addEventListener('appinstalled', () => {
    console.log('✅ PWA installée avec succès');
    deferredInstallPrompt = null;
});

// Détecter le mode standalone
if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('📱 Mode PWA standalone actif');
}