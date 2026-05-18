// =============================================
// FOSS AGRO FARM — CHATBOX WHATSAPP
// modules/whatsapp-chat.js
// Widget de chat WhatsApp interactif
// =============================================


// =============================================
// 1. CONFIGURATION
// =============================================

const WHATSAPP_CONFIG = {
    numero: '+237694572050',
    nomEntreprise: 'KAMCO FARM',
    photoUrl: null,
    horaireOuverture: '08:00',
    horaireFermeture: '18:00',
    joursOuverture: [1, 2, 3, 4, 5, 6], // Lundi à Samedi
    messageAccueil: 'Bonjour ! 👋 Comment pouvons-nous vous aider ?',
    messageHorsFermeture: 'Nous sommes actuellement fermés. Laissez-nous un message et nous vous répondrons dès que possible.',
    delaiReponse: '< 5 min',
    agents: [
        { nom: 'Service Client', role: 'Support', disponible: true },
        { nom: 'Commercial', role: 'Ventes & Devis', disponible: true },
        { nom: 'Technique', role: 'Équipements & Location', disponible: true },
    ],
    messagesRapides: [
        { icon: '📦', texte: 'Je souhaite commander des produits' },
        { icon: '💰', texte: 'Je voudrais un devis personnalisé' },
        { icon: '🚜', texte: 'Je suis intéressé par la location de matériel' },
        { icon: '📋', texte: 'Je voudrais des informations sur vos services' },
        { icon: '🔧', texte: 'J\'ai besoin d\'assistance technique' },
        { icon: '📞', texte: 'Je souhaite être rappelé' },
    ],
};


// =============================================
// 2. VÉRIFICATION HORAIRES
// =============================================

function estOuvert() {
    const now = new Date();
    const jour = now.getDay();
    const heure = now.getHours();
    const minute = now.getMinutes();
    const heureActuelle = heure * 100 + minute;

    const [hOuv, mOuv] = WHATSAPP_CONFIG.horaireOuverture.split(':').map(Number);
    const [hFerm, mFerm] = WHATSAPP_CONFIG.horaireFermeture.split(':').map(Number);
    const heureOuverture = hOuv * 100 + mOuv;
    const heureFermeture = hFerm * 100 + mFerm;

    const jourOuvert = WHATSAPP_CONFIG.joursOuverture.includes(jour);
    const dansHoraires = heureActuelle >= heureOuverture && heureActuelle < heureFermeture;

    return jourOuvert && dansHoraires;
}

function getStatutTexte() {
    if (estOuvert()) {
        return `<span style="color:#4CAF50;">🟢 En ligne — Répond en ${WHATSAPP_CONFIG.delaiReponse}</span>`;
    } else {
        return `<span style="color:#FF9800;">🟡 Hors ligne — Laissez un message</span>`;
    }
}


// =============================================
// 3. CRÉATION DU WIDGET
// =============================================

function initialiserWhatsAppChat() {
    if (document.getElementById('wa-widget')) return;

    const widget = document.createElement('div');
    widget.id = 'wa-widget';
    widget.innerHTML = `
        <!-- Bouton flottant -->
        <div id="wa-bouton" onclick="toggleWhatsAppChat()">
            <div class="wa-bouton-inner">
                <svg viewBox="0 0 32 32" width="28" height="28" fill="white">
                    <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.13 6.742 3.046 9.378L1.054 31.29l6.156-1.962C9.77 30.858 12.79 32 16.004 32 24.826 32 32 24.822 32 16S24.826 0 16.004 0zm9.306 22.614c-.39 1.092-1.924 1.998-3.15 2.264-0.838.178-1.932.32-5.618-1.208-4.714-1.954-7.746-6.748-7.984-7.06-.228-.312-1.868-2.49-1.868-4.748 0-2.258 1.182-3.37 1.602-3.828.39-.426 1.036-.612 1.654-.612.2 0 .38.01.54.018.462.02.694.046 1 .764.382.894 1.312 3.07 1.428 3.294.118.228.236.534.07.846-.156.318-.276.516-.544.792-.268.276-.562.616-.804.826-.268.232-.548.484-.236.95.312.462 1.388 2.282 2.978 3.698 2.048 1.824 3.77 2.39 4.304 2.654.39.196.856.158 1.148-.158.37-.402.828-.94 1.294-1.47.332-.378.75-.426 1.178-.262.434.158 2.752 1.298 3.224 1.534.472.236.786.354.902.55.118.196.118 1.128-.272 2.22z"/>
                </svg>
            </div>
            <div id="wa-badge" class="wa-badge" style="display:none;">1</div>
            <div class="wa-pulse"></div>
        </div>

        <!-- Fenêtre de chat -->
        <div id="wa-chat" class="wa-chat">
            <!-- Header -->
            <div class="wa-chat-header">
                <div class="wa-chat-header-info">
                    <!--<div class="wa-avatar">
                        <span style="font-size:1.5rem;">🌿</span>
                    </div> -->
                    <div>
                        <strong>${WHATSAPP_CONFIG.nomEntreprise}</strong>
                        <div class="wa-statut">${getStatutTexte()}</div>
                    </div>
                </div>
                <button class="wa-close" onclick="toggleWhatsAppChat()">✕</button>
            </div>

            <!-- Corps -->
            <div class="wa-chat-body" id="wa-chat-body">
                <!-- Message d'accueil -->
                <div class="wa-message wa-message-recu">
                    <div class="wa-message-bulle">
                        <strong>${WHATSAPP_CONFIG.nomEntreprise}</strong>
                        <p>${estOuvert() ? WHATSAPP_CONFIG.messageAccueil : WHATSAPP_CONFIG.messageHorsFermeture}</p>
                        <span class="wa-message-heure">${new Date().toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}</span>
                    </div>
                </div>

                <!-- Agents disponibles -->
                <div class="wa-agents">
                    <p style="font-size:0.75rem; color:#999; margin:0 0 8px;">Nos équipes :</p>
                    ${WHATSAPP_CONFIG.agents.map(agent => `
                        <div class="wa-agent" onclick="contacterAgent('${agent.nom}', '${agent.role}')">
                            <div class="wa-agent-avatar">${agent.nom[0]}</div>
                            <div class="wa-agent-info">
                                <strong>${agent.nom}</strong>
                                <small>${agent.role}</small>
                            </div>
                            <span class="wa-agent-statut ${agent.disponible ? 'online' : 'offline'}"></span>
                        </div>
                    `).join('')}
                </div>

                <!-- Messages rapides -->
                <div class="wa-rapides">
                    <p style="font-size:0.75rem; color:#999; margin:0 0 8px;">Messages rapides :</p>
                    ${WHATSAPP_CONFIG.messagesRapides.map(msg => `
                        <button class="wa-rapide-btn" onclick="envoyerMessageRapide('${msg.texte}')">
                            ${msg.icon} ${msg.texte}
                        </button>
                    `).join('')}
                </div>
            </div>

            <!-- Footer avec input -->
            <div class="wa-chat-footer">
                <div class="wa-input-wrapper">
                    <input type="text" id="wa-input"
                           placeholder="Tapez votre message..."
                           onkeypress="if(event.key==='Enter') envoyerMessageWhatsApp()">
                    <button onclick="envoyerMessageWhatsApp()" class="wa-send-btn">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                    </button>
                </div>
                <div class="wa-powered">
                    🔒 Conversation sécurisée via WhatsApp
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(widget);

    // Afficher le badge après 5 secondes
    setTimeout(() => {
        const badge = document.getElementById('wa-badge');
        if (badge) badge.style.display = 'flex';
    }, 5000);
}


// =============================================
// 4. INTERACTIONS
// =============================================

let waChatOuvert = false;

function toggleWhatsAppChat() {
    const chat = document.getElementById('wa-chat');
    if (!chat) return;

    waChatOuvert = !waChatOuvert;
    chat.classList.toggle('show', waChatOuvert);

    // Masquer le badge
    if (waChatOuvert) {
        const badge = document.getElementById('wa-badge');
        if (badge) badge.style.display = 'none';
    }
}

function envoyerMessageWhatsApp() {
    const input = document.getElementById('wa-input');
    if (!input) return;

    const message = input.value.trim();
    if (!message) return;

    // Afficher le message dans le chat
    ajouterMessageChat(message, 'envoye');
    input.value = '';

    // Simuler une réponse
    setTimeout(() => {
        ajouterMessageChat(
            'Merci pour votre message ! Nous allons vous rediriger vers WhatsApp pour continuer la conversation. 📱',
            'recu'
        );

        // Rediriger vers WhatsApp après 2 secondes
        setTimeout(() => {
            const url = `https://wa.me/${WHATSAPP_CONFIG.numero}?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
        }, 2000);
    }, 1000);
}

function envoyerMessageRapide(message) {
    ajouterMessageChat(message, 'envoye');

    setTimeout(() => {
        ajouterMessageChat(
            'Merci ! Un de nos agents va vous répondre sur WhatsApp. Vous allez être redirigé... 📱',
            'recu'
        );

        setTimeout(() => {
            const url = `https://wa.me/${WHATSAPP_CONFIG.numero}?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
        }, 2000);
    }, 800);
}

function contacterAgent(nom, role) {
    const message = `Bonjour, je souhaite contacter le service ${role} de ${WHATSAPP_CONFIG.nomEntreprise}.`;
    ajouterMessageChat(`Contacter : ${nom} (${role})`, 'envoye');

    setTimeout(() => {
        ajouterMessageChat(
            `${nom} va vous répondre. Redirection vers WhatsApp... 📱`,
            'recu'
        );

        setTimeout(() => {
            const url = `https://wa.me/${WHATSAPP_CONFIG.numero}?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
        }, 1500);
    }, 800);
}

function ajouterMessageChat(texte, type) {
    const body = document.getElementById('wa-chat-body');
    if (!body) return;

    const heure = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const msg = document.createElement('div');
    msg.className = `wa-message wa-message-${type}`;
    msg.innerHTML = `
        <div class="wa-message-bulle">
            <p>${texte}</p>
            <span class="wa-message-heure">${heure} ${type === 'envoye' ? '✓✓' : ''}</span>
        </div>
    `;
    body.appendChild(msg);
    body.scrollTop = body.scrollHeight;
}


// =============================================
// 5. INITIALISATION
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initialiserWhatsAppChat();
    }, 2000);
});

window.toggleWhatsAppChat = toggleWhatsAppChat;
window.envoyerMessageWhatsApp = envoyerMessageWhatsApp;
window.envoyerMessageRapide = envoyerMessageRapide;
window.contacterAgent = contacterAgent;