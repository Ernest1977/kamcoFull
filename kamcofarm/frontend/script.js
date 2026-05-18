
// ========================================
// KAMCO FARM - Script principal unifié
// ========================================

const API_BASE = (window.location.origin.includes('127.0.0.1') || window.location.origin.includes('localhost')) ? 'http://127.0.0.1:8000' : window.location.origin;
let currentLanguage = localStorage.getItem('language') || 'fr';

// ========================================
// TRADUCTIONS
// ========================================
const translations = {
    fr: {
        "nav.home": "Accueil",
        "nav.products": "Produits",
        "nav.gallery": "Galerie",
        "nav.services": "Services",
        "nav.partners": "Partenaires",
        "nav.blog": "Blog",
        "nav.login": "Espace Employés",
        "nav.contact": "Contact",
        "nav.getQuote": "Demander un Devis",
        "about.title": "À Propos de KAMCO FARM",
        "about.content": "Fondé en 2021, kamco-scoop farm est une coopérative d’agriculteurs exerçant dans la culture et la commercialisation locale des produits vivriers frais.De par leur expérience en culture biologique de produits locaux acquise au fil du temps,  ces producteurs agricoles mettent en pratique leur savoir faire et connaissances pour la production des denrées de qualité dans un contexte climatique variable et imprévisible, et dans un climat social où l’agriculture est encore en pleine expansion et très peu industrialisée. Elle ambitionne d’une part de promouvoir et vulgariser la mécanisation agricole locale et d’autre part de concourir sur le marché international en se lançant dans l’exportation des produits alimentaires made in Cameroon suite à une forte demande dans certaines parties du monde où la culture de ces produits est quasiment inexistante à cause des conditions climatiques.",
        
        // Features
        "why.title": "Pourquoi nous Choisir ?",
        "why.durable_title": "Agriculture Durable",
        "why.durable": "Pratiques agricoles respectueuses de l'environnement garantissant des produits sains et de qualité supérieure.",
        "why.certified_title": "Qualité Certifiée",
        "why.certified": "Contrôle qualité rigoureux à chaque étape, de la plantation à la livraison de vos produits.",
        "why.fast_title": "Livraison Rapide",
        "why.fast": "Réseau logistique optimisé pour des livraisons fraîches et ponctuelles partout en Afrique et dans le monde.",


        // Hero
        "hero.title": "Bienvenue chez KAMCO FARM",
        "hero.subtitle": "Leader dans la Culture, la Vente et le Négoce de Fruits et Légumes Tropicaux de Qualité Premium",
        "hero.discoverBtn": "Découvrir nos Produits",
        "hero.quoteBtn": "Demander un Devis",

        // Produits
        "products.title": "Nos Produits Premium",

        //
        "gallery.title": "Notre Galerie",
        "gallery harvest_title": "Récolte en Cours",
        "gallery plantation_description": "Nos champs",

        //Statistics
        "stats.title": "Nos Statistiques Clés",
        "stats.hectares": "Hectares Cultivés",
        "stats.tonnes": "Tonnes/An",
        "stats.clients": "Clients Satisfaits",
        "stats.years": "Années d'Expérience",


        // Services
        "services.title": "Nos Services",
        "services.culture_title": "🌾 Culture et Production",
        "services.culture_description": "Exploitation agricole moderne avec techniques de pointe pour une production optimale et durable.",
        "services.trading_title": "💼 Négoce B2B",
        "services.trading_description": "Solutions commerciales adaptées aux besoins des grossistes, exportateurs et transformateurs.",
        "services.packaging_title": "📦 Conditionnement Sur Mesure",
        "services.packaging_description": "Emballage personnalisé selon vos exigences pour l'export ou la distribution locale.",
        "services.export_title": "🚢 Export & Logistique",
        "services.export_description": "Gestion complète de l'exportation avec documentation et logistique internationale.",
        "services.agricultural_advice_title": "📊 Conseil Agricole",
        "services.agricultural_advice_description": "Accompagnement technique et formation pour optimiser vos rendements agricoles.",
        "services.supply_contracts_title": "🤝 Contrats d'Approvisionnement",
        "services.supply_contracts_description": "Partenariats à long terme avec garantie de volume et qualité constante.",

        // Partenaires
        "partners.title": "Nos Partenaires",

        // Blog
        "blog.title": "Actualités & Blog",


        // Devis
        "quote.title": "Demander un Devis Personnalisé",
        "quote.subtitle": "Remplissez le formulaire pour recevoir votre devis sous 24h",
        "quote.form_title": "Remplissez le formulaire pour recevoir votre devis sous 24h",
        "quote.company_label": "Nom de l'Entreprise",
        "quote.contact_label": "Contact Téléphonique",
        "quote.phone_label": "Numéro de Téléphone",
        "quote.email_label": "Adresse Email",
        "quote.products_label": "Produits Souhaités",
        "quote.quantity_label": "Quantité Estimée (en tonnes)",
        "quote.frequency_label": "Fréquence de commande",
        "quote.frequency_unique": "Commande Unique",
        "quote.frequency_monthly": "Mensuelle",
        "quote.frequency_quarterly": "Trimestrielle",
        "quote.frequency_yearly": "Annuelle",
        "quote.destination_label": "Destination de Livraison",
        "quote.requirements_label": "Exigences spécifiques (optionnel)",
        "quote.btn": "Recevoir Mon Devis Gratuit",

        // Contact
        "contact.title": "Contactez-Nous",
        "contact.subtitle": "Prenons Contact",
        "contact.description": "Nous sommes à votre écoute pour répondre à tous vos besoins en produits agricoles tropicaux de qualité.",
        "contact.name_label": "Votre Nom",
        "contact.email_label": "Votre Email",
        "contact.message_label": "Message",
        "contact.phone_label": "Téléphone",
        "contact.submit.btn": "Envoyer le Message",

        // Footer
        "footer.about_header": "À Propos de KAMCO FARM",
        "footer.about_content": "Leader dans la production et la commercialisation de fruits tropicaux de qualité premium au Cameroun et dans la sous-région.",
        "footer.quick_links_header": "Liens Rapides",
        "footer.quick_links.products": "Nos Produits",
        "footer.quick_links.services": "Nos Services",
        "footer.quick_links.contact": "Contactez-Nous",
        "footer.hours_header": "Heures d'Ouverture",
        "footer.hours_content": "Lundi - Vendredi: 8h00 - 18h00<br>Samedi: 9h00 - 14h00<br>Dimanche: Fermé",
        "footer.top": "Retour en Haut ↑"
    },
    en: {
        "nav.home": "Home",
        "nav.products": "Products",
        "nav.gallery": "Gallery",
        "nav.services": "Services",
        "nav.partners": "Partners",
        "nav.blog": "Blog",
        "nav.login": "Employee Space",
        "nav.contact": "Contact",
        "nav.getQuote": "Get a Quote",
        "about.title": "About KAMCO FARM",
        "about.content": "Founded in 2021, kamco-scoop farm is a cooperative of farmers engaged in the cultivation and local marketing of fresh food products. With their experience in organic farming of local products acquired over time, these agricultural producers put into practice their know-how and knowledge for the production of quality goods in a variable and unpredictable climate context, and in a social climate where agriculture is still expanding and very little industrialized. It aims on the one hand to promote and popularize local agricultural mechanization and on the other hand to compete on the international market by launching into the export of food products made in Cameroon following a strong demand in certain parts of the world where the cultivation of these products is almost non-existent due to climatic conditions.",



        "hero.title": "Welcome to KAMCO FARM",
        "hero.subtitle": "Leader in the Cultivation, Sale and Trading of Premium Tropical Fruits and Vegetables",
        "hero.discoverBtn": "Discover our Products",
        "hero.quoteBtn": "Request a Quote",

        // Features
        "why.title": "Why Choose Us ?",
        "why.durable_title": "Sustainable Agriculture",
        "why.durable": "Environmentally friendly farming practices ensuring healthy, high-quality products.",
        "why.certified_title": "Certified Quality",
        "why.certified": "Rigorous quality control at every stage, from plantation to delivery of your products.",
        "why.fast_title": "Fast Delivery",
        "why.fast": "Optimized logistics network for fresh and punctual deliveries across Africa and the world.",


        // Products
        "products.title": "Our Premium Products",

        // Gallery
        "gallery.title": "Our Gallery",
        "gallery harvest_title": "Harvest in Progress",
        "gallery plantation_description": "Our fields",


        //Statistics
        "stats.title": "Our Key Statistics",
        "stats.hectares": "Hectares Cultivated",
        "stats.tonnes": "Tonnes/Year",
        "stats.clients": "Satisfied Clients",
        "stats.years": "Years of Experience",


        // Services
        "services.title": "Our Services",
        "services.culture_title": "🌾 Cultivation & Production",
        "services.culture_description": "Modern farming operation with cutting-edge techniques for optimal and sustainable production.",
        "services.trading_title": "💼 B2B Trading",
        "services.trading_description": "Expanding our reach with strategic partnerships and efficient supply chain management.",
        "services.packaging_title": "📦 Custom Packaging",
        "services.packaging_description": "Tailored packaging solutions to meet your specific requirements for export or local distribution.",
        "services.export_title": "🚢 Export & Logistics",
        "services.export_description": "Comprehensive export services and logistics solutions to facilitate seamless international trade.",
        "services.agricultural_advice_title": "📊 Agricultural Advice",
        "services.agricultural_advice_description": "Expert guidance and support for optimizing your agricultural practices.",
        "services.supply_contracts_title": "🤝 Supply Contracts",
        "services.supply_contracts_description": "Flexible supply contracts tailored to meet your specific needs and requirements.",
        
        // Partners
        "partners.title": "Our Partners",

        // Blog
        "blog.title": "Our Blog",
        "blog.subtitle": "Latest News and Updates",

        // Testimonials
        "testimonials.title": "What Our Clients Say",


        // Quotes
        "quote.title": "Request a Personalized Quote",
        "quote.subtitle": "Fill out the form to receive your quote within 24 hours",
        "quote.form_title": "Fill out the form to receive your quote within 24 hours",
        "quote.btn": "Get My Free Quote",
        "quote.company_label": "Company Name",
        "quote.contact_label": "Contact Name",
        "quote.phone_label": "Phone Number",
        "quote.email_label": "Email Address",
        "quote.products_label": "Desired Products",
        "quote.quantity_label": "Estimated Quantity (in tonnes)",
        "quote.frequency_label": "Order Frequency",
        "quote.frequency_unique": "One-Time Order",
        "quote.frequency_monthly": "Monthly",
        "quote.frequency_quarterly": "Quarterly",
        "quote.frequency_yearly": "Yearly",
        "quote.requirements_label": "Specific Requirements (optional)",
        "quote.destination_label": "Delivery Destination",
        "quote.btn": "Receive My Free Quote",

        // Contact
        "contact.title": "Contact Us",
        "contact.subtitle": "Get in Touch",
        "contact.description": "We are here to answer any questions you may have about our products or services.",
        "contact.name_label": "Your Name",
        "contact.email_label": "Your Email",
        "contact.message_label": "Message",
        "contact.phone_label": "Phone",
        "contact.submit.btn": "Send Message",


        // Footer
        "footer.about_header": "About KAMCO FARM",
        "footer.about_content": "Leader in the production and marketing of premium tropical fruits in Cameroon and the sub-region.",
        "footer.quick_links.products": "Our Products",
        "footer.quick_links.services": "Our Services",
        "footer.quick_links.contact": "Contact Us",
        "footer.hours_header": "Opening Hours",
        "footer.hours_content": "Monday - Friday: 8:00 AM - 6:00 PM<br>Saturday: 9:00 AM - 2:00 PM<br>Sunday: Closed",
        "footer.social_header": "Follow Us",
        "footer.top": "Back to Top ↑"
    }
};

// ========================================
// OUTILS
// ========================================
function getAcceptLanguage() {
    return currentLanguage || 'fr';
}

function formatDate(dateString, lang = 'fr') {
    const date = new Date(dateString);
    return date.toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function escapeHtml(str = '') {
    return str
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

// ========================================
// MULTILINGUE
// ========================================
function changeLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);

    document.body.classList.add('translating');

    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[lang] && translations[lang][key]) {
            element.innerHTML = translations[lang][key];
        }
    });

    const currentFlag = document.getElementById('currentFlag');
    const currentLang = document.getElementById('currentLang');

    if (currentFlag && currentLang) {
        if (lang === 'en') {
            currentFlag.src = 'https://flagcdn.com/24x18/gb.png';
            currentLang.textContent = 'EN';
        } else {
            currentFlag.src = 'https://flagcdn.com/24x18/fr.png';
            currentLang.textContent = 'FR';
        }
    }

    document.querySelectorAll('.language-option').forEach(opt => {
        opt.classList.remove('active');
        if (opt.dataset.lang === lang) opt.classList.add('active');
    });

    setTimeout(() => {
        document.body.classList.remove('translating');
    }, 300);

    // Recharger les contenus dynamiques
    loadProducts();
    loadGallery();
    loadPartners();
    loadBlogPosts();
    loadTestimonials();
    loadStatistics();
}

function initLanguageDropdown() {
    const languageToggle = document.getElementById('languageToggle');
    const languageMenu = document.getElementById('languageMenu');

    if (!languageToggle || !languageMenu) return;

    languageToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        languageMenu.classList.toggle('active');
    });

    document.addEventListener('click', () => {
        languageMenu.classList.remove('active');
    });

    document.querySelectorAll('.language-option').forEach(option => {
        option.addEventListener('click', function (e) {
            e.stopPropagation();
            const lang = this.dataset.lang;
            changeLanguage(lang);
            languageMenu.classList.remove('active');
        });
    });
}

// ========================================
// CAROUSEL GLOBAL
// ========================================
const carouselInstances = {};

function initCarousel(trackId) {
    const track = document.getElementById(trackId);
    if (!track) return;

    const section = track.closest('.carousel-section');
    if (!section) return;

    const prevBtn = section.querySelector('.carousel-nav.prev');
    const nextBtn = section.querySelector('.carousel-nav.next');

    if (!prevBtn || !nextBtn) return;

    // éviter doublons listeners
    if (carouselInstances[trackId]) {
        const old = carouselInstances[trackId];
        prevBtn.removeEventListener('click', old.prevHandler);
        nextBtn.removeEventListener('click', old.nextHandler);
        if (old.touchStartHandler) track.removeEventListener('touchstart', old.touchStartHandler);
        if (old.touchEndHandler) track.removeEventListener('touchend', old.touchEndHandler);
    }

    let currentIndex = 0;

    const getItems = () => track.querySelectorAll('.carousel-item');

    const getVisibleItems = () => {
        const viewport = section.querySelector('.carousel-viewport');
        const firstItem = track.querySelector('.carousel-item');
        if (!viewport || !firstItem) return 1;
        const itemWidth = firstItem.offsetWidth + 20;
        return Math.max(1, Math.floor(viewport.offsetWidth / itemWidth));
    };

    const getItemWidth = () => {
        const firstItem = track.querySelector('.carousel-item');
        return firstItem ? firstItem.offsetWidth + 20 : 320;
    };

    const updatePosition = () => {
        const items = getItems();
        const visibleItems = getVisibleItems();
        const maxIndex = Math.max(0, items.length - visibleItems);
        if (currentIndex > maxIndex) currentIndex = maxIndex;
        if (currentIndex < 0) currentIndex = 0;

        const translateX = -(currentIndex * getItemWidth());
        track.style.transform = `translateX(${translateX}px)`;
    };

    const move = (direction) => {
        const items = getItems();
        const visibleItems = getVisibleItems();
        const maxIndex = Math.max(0, items.length - visibleItems);

        currentIndex += direction;
        if (currentIndex < 0) currentIndex = 0;
        if (currentIndex > maxIndex) currentIndex = maxIndex;

        updatePosition();
    };

    const prevHandler = () => move(-1);
    const nextHandler = () => move(1);

    prevBtn.addEventListener('click', prevHandler);
    nextBtn.addEventListener('click', nextHandler);

    let touchStartX = 0;

    const touchStartHandler = (e) => {
        touchStartX = e.changedTouches[0].screenX;
    };

    const touchEndHandler = (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            diff > 0 ? move(1) : move(-1);
        }
    };

    track.addEventListener('touchstart', touchStartHandler, { passive: true });
    track.addEventListener('touchend', touchEndHandler, { passive: true });

    window.addEventListener('resize', updatePosition);

    carouselInstances[trackId] = {
        prevHandler,
        nextHandler,
        touchStartHandler,
        touchEndHandler
    };

    updatePosition();
}

// ========================================
// CHARGEMENT PRODUITS
// ========================================
async function loadProducts() {
    const track = document.getElementById('productsTrack');
    if (!track) return;

    try {
        const response = await fetch(`${API_BASE}/api/produits/`, {
            headers: {
                'Accept': 'application/json',
                'Accept-Language': getAcceptLanguage()
            }
        });

        if (!response.ok) throw new Error(`Erreur API ${response.status}`);

        const produits = await response.json();
        track.innerHTML = '';

        if (!produits.length) {
            track.innerHTML = `<p style="padding:2rem; text-align:center;">Aucun produit disponible.</p>`;
            return;
        }

        produits.forEach(produit => {
            const card = document.createElement('div');
            card.className = 'carousel-item product-card';

            card.innerHTML = `
                <div class="product-image">
                    <img src="${produit.image}" alt="${escapeHtml(produit.nom)}" loading="lazy"
                         onerror="this.onerror=null;this.src='images/placeholder.png';">
                </div>
                <div class="product-info">
                    <h3>${escapeHtml(produit.nom)}</h3>
                    <p>${escapeHtml(produit.description || '')}</p>
                </div>
            `;

            track.appendChild(card);
        });

        initCarousel('productsTrack');
    } catch (error) {
        console.error('Erreur produits:', error);
        track.innerHTML = `<p style="padding:2rem; text-align:center; color:red;">Erreur de chargement des produits.</p>`;
    }
}

// ========================================
// CHARGEMENT GALLERY
// ========================================
async function loadGallery() {
    const track = document.getElementById('galleryTrack');
    if (!track) return;

    try {
        const response = await fetch(`${API_BASE}/api/gallery/`, {
            headers: {
                'Accept': 'application/json',
                'Accept-Language': getAcceptLanguage()
            }
        });

        if (!response.ok) throw new Error(`Erreur API ${response.status}`);

        const items = await response.json();
        track.innerHTML = '';

        if (!items.length) {
            track.innerHTML = `<p style="padding:2rem; text-align:center;">Aucune image disponible.</p>`;
            return;
        }

        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'carousel-item gallery-item';

            card.innerHTML = `
                <div class="gallery-image">
                    <img src="${item.image}" alt="${escapeHtml(item.titre || 'Galerie')}" loading="lazy"
                         onerror="this.onerror=null;this.src='images/placeholder.png';">
                </div>
                <div class="gallery-overlay">
                    <h3>${escapeHtml(item.titre || 'Galerie')}</h3>
                    <p>${escapeHtml(item.description || '')}</p>
                </div>
            `;

            track.appendChild(card);
        });

        initCarousel('galleryTrack');
    } catch (error) {
        console.error('Erreur galerie:', error);
        track.innerHTML = `<p style="padding:2rem; text-align:center; color:red;">Erreur de chargement de la galerie.</p>`;
    }
}

// ========================================
// CHARGEMENT PARTNERS
// ========================================
async function loadPartners() {
    const track = document.getElementById('partnersTrack');
    if (!track) return;

    try {
        const response = await fetch(`${API_BASE}/api/partners/`, {
            headers: {
                'Accept': 'application/json',
                'Accept-Language': getAcceptLanguage()
            }
        });

        if (!response.ok) throw new Error(`Erreur API ${response.status}`);

        const partners = await response.json();
        track.innerHTML = '';

        if (!partners.length) {
            track.innerHTML = `<p style="padding:2rem; text-align:center;">Aucun partenaire disponible.</p>`;
            return;
        }

        partners.forEach(partner => {
            const card = document.createElement('div');
            card.className = 'carousel-item partner-logo';

            const website = partner.site_web ? `onclick="window.open('${partner.site_web}', '_blank')"` : '';

            card.innerHTML = `
                <span ${website}>
                    <img src="${partner.logo}" alt="${escapeHtml(partner.nom)}" loading="lazy"
                         onerror="this.onerror=null;this.src='images/placeholder.png';">
                </span>
                <p>${escapeHtml(partner.nom)}</p>
            `;

            track.appendChild(card);
        });

        initCarousel('partnersTrack');
    } catch (error) {
        console.error('Erreur partenaires:', error);
        track.innerHTML = `<p style="padding:2rem; text-align:center; color:red;">Erreur de chargement des partenaires.</p>`;
    }
}

// ========================================
// CHARGEMENT BLOG
// ========================================
async function loadBlogPosts() {
    const track = document.getElementById('blogTrack');
    if (!track) return;

    try {
        const response = await fetch(`${API_BASE}/api/blog/`, {
            headers: {
                'Accept': 'application/json',
                'Accept-Language': getAcceptLanguage()
            }
        });

        if (!response.ok) throw new Error(`Erreur API ${response.status}`);

        const posts = await response.json();
        track.innerHTML = '';

        if (!posts.length) {
            track.innerHTML = `<p style="padding:2rem; text-align:center;">Aucun article disponible.</p>`;
            return;
        }

        posts.forEach(post => {
            const article = document.createElement('article');
            article.className = 'carousel-item blog-card';

            article.innerHTML = `
                <div class="blog-image">
                    <img src="${post.image}" alt="${escapeHtml(post.titre)}" loading="lazy"
                         onerror="this.onerror=null;this.src='images/placeholder.png';">
                </div>
                <div class="blog-content">
                    <div class="blog-meta">
                        <span>📅 ${formatDate(post.date_publication, currentLanguage)}</span>
                        <span>👤 ${escapeHtml(post.auteur)}</span>
                    </div>
                    <h3 class="blog-title">${escapeHtml(post.titre)}</h3>
                    <p class="blog-excerpt">${escapeHtml(post.extrait)}</p>
                    <a href="blog-detail.html?id=${post.id}" class="read-more">
                        ${currentLanguage === 'en' ? 'Read more →' : 'Lire la suite →'}
                    </a>
                </div>
            `;

            track.appendChild(article);
        });

        initCarousel('blogTrack');
    } catch (error) {
        console.error('Erreur blog:', error);
        track.innerHTML = `<p style="padding:2rem; text-align:center; color:red;">Erreur de chargement du blog.</p>`;
    }
}

// ========================================
// CHARGEMENT TESTIMONIALS
// ========================================
async function loadTestimonials() {
    const track = document.getElementById('testimonialsTrack');
    if (!track) return;

    try {
        const response = await fetch(`${API_BASE}/api/testimonials/`, {
            headers: {
                'Accept': 'application/json',
                'Accept-Language': getAcceptLanguage()
            }
        });

        if (!response.ok) throw new Error(`Erreur API ${response.status}`);

        const testimonials = await response.json();
        track.innerHTML = '';

        if (!testimonials.length) {
            track.innerHTML = `<p style="padding:2rem; text-align:center; color:white;">Aucun témoignage disponible.</p>`;
            return;
        }

        testimonials.forEach(item => {
            const card = document.createElement('div');
            card.className = 'carousel-item testimonial-card';

            const avatarContent = item.photo
                ? `<img src="${item.photo}" alt="${escapeHtml(item.nom_client)}" class="testimonial-photo">`
                : `${escapeHtml(item.avatar_initiales || item.nom_client.slice(0, 2).toUpperCase())}`;

            card.innerHTML = `
                <div class="stars">${item.stars}</div>
                <p class="testimonial-text">"${escapeHtml(item.contenu)}"</p>
                <div class="testimonial-author">
                    <div class="author-avatar ${item.photo ? 'has-photo' : ''}">
                        ${avatarContent}
                    </div>
                    <div class="author-info">
                        <h4>${escapeHtml(item.nom_client)}</h4>
                        <p>${escapeHtml(item.fonction_client)}${item.entreprise ? ' - ' + escapeHtml(item.entreprise) : ''}</p>
                    </div>
                </div>
            `;

            track.appendChild(card);
        });

        initCarousel('testimonialsTrack');
    } catch (error) {
        console.error('Erreur témoignages:', error);
        track.innerHTML = `<p style="padding:2rem; text-align:center; color:white;">Erreur de chargement des témoignages.</p>`;
    }
}

// ========================================
// CHARGEMENT STATISTICS
// ========================================
async function loadStatistiq() {
    const statsGrid = document.getElementById('statsGrid');
    if (!statsGrid) return;

    try {
        const response = await fetch(`${API_BASE}/api/statistiq/`, {
            headers: {
                'Accept': 'application/json',
                'Accept-Language': getAcceptLanguage()
            }
        });

        if (!response.ok) throw new Error(`Erreur API ${response.status}`);

        const stats = await response.json();
        statsGrid.innerHTML = '';

        if (!stats.length) {
            statsGrid.innerHTML = `<p style="text-align:center; width:100%; color:white;">Aucune statistique disponible.</p>`;
            return;
        }

        stats.forEach(stat => {
            const item = document.createElement('div');
            item.className = 'stat-item';

            item.innerHTML = `
                <h3 data-value="${stat.valeur}" data-suffix="${stat.suffixe || '+'}">0${stat.suffixe || '+'}</h3>
                <p>${escapeHtml(stat.label)}</p>
            `;

            statsGrid.appendChild(item);
        });

        animateStatsOnView();
    } catch (error) {
        console.error('Erreur statistiques:', error);
        statsGrid.innerHTML = `<p style="text-align:center; width:100%; color:red;">Erreur de chargement des statistiques.</p>`;
    }
}

let statsAnimated = false;
function animateStatsOnView() {
    const statsSection = document.querySelector('.stats');
    if (!statsSection || statsAnimated) return;

    const statNumbers = statsSection.querySelectorAll('.stat-item h3');

    const runAnimation = () => {
        if (statsAnimated) return;
        statsAnimated = true;

        statNumbers.forEach((el) => {
            const finalValue = parseInt(el.dataset.value || '0', 10);
            const suffix = el.dataset.suffix || '+';
            let start = 0;

            const duration = 1500;
            const increment = Math.max(1, Math.ceil(finalValue / (duration / 30)));

            const timer = setInterval(() => {
                start += increment;
                if (start >= finalValue) {
                    start = finalValue;
                    clearInterval(timer);
                }
                el.textContent = `${start}${suffix}`;
            }, 30);
        });
    };

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                runAnimation();
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.4 });

    observer.observe(statsSection);
}

// ========================================
// MENU & NAVIGATION
// ========================================
function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');

    if (!menuToggle || !navLinks) return;

    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (!href || href === '#') return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function initHeaderEffects() {
    let lastScrollTop = 0;

    window.addEventListener('scroll', function () {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const header = document.querySelector('header');
        if (!header) return;

        header.style.boxShadow = scrollTop > 100
            ? '0 5px 20px rgba(0,0,0,0.1)'
            : '0 2px 10px rgba(0,0,0,0.1)';

        if (scrollTop > lastScrollTop && scrollTop > 100 && window.innerWidth <= 768) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }

        lastScrollTop = scrollTop;
    });
}

// ========================================
// ANIMATIONS AU SCROLL
// ========================================
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll(
        '.feature-card, .product-card, .service-card, .blog-card, .testimonial-card, .gallery-item, .partner-logo, .stat-item'
    );

    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });

    const animateOnScroll = () => {
        document.querySelectorAll(
            '.feature-card, .product-card, .service-card, .blog-card, .testimonial-card, .gallery-item, .partner-logo, .stat-item'
        ).forEach(element => {
            const rect = element.getBoundingClientRect();
            if (rect.top < window.innerHeight - 50) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    };

    animateOnScroll();
    window.addEventListener('scroll', animateOnScroll);
}

// ========================================
// FORMULAIRE DEVIS
// ========================================
function initQuoteForm() {
    const quoteForm = document.getElementById('quoteForm');
    if (!quoteForm) return;

    quoteForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const selectedProducts = [];
        document.querySelectorAll('input[name="products"]:checked').forEach(checkbox => {
            selectedProducts.push(checkbox.value);
        });

        if (!selectedProducts.length) {
            alert(currentLanguage === 'en'
                ? 'Please select at least one product.'
                : 'Veuillez sélectionner au moins un produit.');
            return;
        }

        const payload = {
            nom_entreprise: document.getElementById('company')?.value || '',
            nom_contact: document.getElementById('contactName')?.value || '',
            email: document.getElementById('quoteEmail')?.value || '',
            telephone: document.getElementById('quotePhone')?.value || '',
            produits: JSON.stringify(selectedProducts),
            quantite_tonnes: document.getElementById('quantity')?.value || '',
            frequence: document.getElementById('frequency')?.value || '',
            destination: document.getElementById('destination')?.value || '',
            exigences: document.getElementById('requirements')?.value || '',
        };

        try {
            const resp = await fetch(`${API_BASE}/api/finance/creer-demande-devis/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                console.error('Erreur devis:', err);
                alert(currentLanguage === 'en'
                    ? 'An error occurred while sending your request.'
                    : "Une erreur est survenue lors de l'envoi du devis.");
                return;
            }

            alert(currentLanguage === 'en'
                ? 'Your quote request has been sent successfully!'
                : 'Votre demande de devis a été envoyée avec succès !');

            quoteForm.reset();
        } catch (err) {
            console.error('Erreur réseau devis:', err);
            alert(currentLanguage === 'en'
                ? 'Network error while sending your request.'
                : "Erreur réseau lors de l'envoi de votre demande.");
        }
    });
}

// ========================================
// LOGIN EMPLOYÉ
// ========================================
function initLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('loginUsername')?.value.trim();
        const password = document.getElementById('loginPassword')?.value;
        const errorP = document.getElementById('loginError');
        const infoP = document.getElementById('loginInfo');

        if (errorP) {
            errorP.style.display = 'none';
            errorP.textContent = '';
        }
        if (infoP) {
            infoP.style.display = 'none';
            infoP.textContent = '';
        }

        if (!username || !password) {
            if (errorP) {
                errorP.textContent = currentLanguage === 'en'
                    ? 'Please enter your credentials.'
                    : 'Veuillez renseigner vos identifiants.';
                errorP.style.display = 'block';
            }
            return;
        }

        try {
            const resp = await fetch(`${API_BASE}/api/auth/token/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!resp.ok) {
                if (errorP) {
                    errorP.textContent = currentLanguage === 'en'
                        ? 'Incorrect credentials or inactive account.'
                        : 'Identifiants incorrects ou compte inactif.';
                    errorP.style.display = 'block';
                }
                return;
            }

            const data = await resp.json();
            localStorage.setItem('accessToken', data.access);
            localStorage.setItem('refreshToken', data.refresh);

            if (infoP) {
                infoP.textContent = currentLanguage === 'en'
                    ? 'Login successful, loading profile...'
                    : 'Connexion réussie, récupération du profil...';
                infoP.style.display = 'block';
            }

            const meResp = await fetch(`${API_BASE}/api/accounts/me/`, {
                headers: {
                    'Authorization': `Bearer ${data.access}`,
                    'Accept': 'application/json',
                }
            });

            if (!meResp.ok) {
                if (infoP) {
                    infoP.textContent = currentLanguage === 'en'
                        ? 'Connected, but unable to retrieve profile.'
                        : 'Connecté, mais impossible de récupérer le profil.';
                }
                return;
            }

            const me = await meResp.json();

            if (infoP) {
                infoP.textContent = `${currentLanguage === 'en' ? 'Connected as' : 'Connecté en tant que'} ${me.username} (${me.role_display})`;
                infoP.style.display = 'block';
            }

            testerAccesFinance(data.access, me);

        } catch (err) {
            console.error('Erreur réseau login:', err);
            if (errorP) {
                errorP.textContent = currentLanguage === 'en'
                    ? 'Network error during login.'
                    : 'Erreur réseau lors de la connexion.';
                errorP.style.display = 'block';
            }
        }
    });
}

async function testerAccesFinance(accessToken, me) {
    const zoneFinance = document.getElementById('zone-finance');
    const financeMessage = document.getElementById('financeMessage');
    if (!zoneFinance || !financeMessage) return;

    try {
        const resp = await fetch(`${API_BASE}/api/finance/test/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            }
        });

        if (resp.status === 403) {
            zoneFinance.style.display = 'none';
            return;
        }

        if (!resp.ok) {
            zoneFinance.style.display = 'none';
            return;
        }

        const data = await resp.json();
        zoneFinance.style.display = 'block';
        financeMessage.textContent = `${data.message} — Utilisateur : ${data.user} (${data.role})`;

    } catch (e) {
        console.error('Erreur finance/test:', e);
        zoneFinance.style.display = 'none';
    }
}




function ouvrirFormulaireDroitsRGPD() {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:10001; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:600px; max-height:90vh; overflow-y:auto; padding:2rem;">
            <div style="display:flex; justify-content:space-between; margin-bottom:1.5rem;">
                <h2 style="color:#188701; margin:0;">📋 Exercer vos droits RGPD</h2>
                <button onclick="this.closest('div[style]').remove()" style="background:none; border:none; font-size:1.5rem; cursor:pointer;">✕</button>
            </div>
            <form onsubmit="envoyerDemandeRGPD(event)">
                <div style="margin-bottom:1rem;">
                    <label style="display:block; margin-bottom:0.3rem; font-weight:600;">Nom complet *</label>
                    <input type="text" id="rgpdNom" required style="width:100%; padding:0.7rem; border:1px solid #ddd; border-radius:8px;">
                </div>
                <div style="margin-bottom:1rem;">
                    <label style="display:block; margin-bottom:0.3rem; font-weight:600;">Email *</label>
                    <input type="email" id="rgpdEmail" required style="width:100%; padding:0.7rem; border:1px solid #ddd; border-radius:8px;">
                </div>
                <div style="margin-bottom:1rem;">
                    <label style="display:block; margin-bottom:0.3rem; font-weight:600;">Type de demande *</label>
                    <select id="rgpdType" required style="width:100%; padding:0.7rem; border:1px solid #ddd; border-radius:8px;">
                        <option value="">Sélectionner...</option>
                        <option value="ACCES">Droit d'accès — Obtenir une copie de mes données</option>
                        <option value="RECTIFICATION">Droit de rectification — Corriger mes données</option>
                        <option value="SUPPRESSION">Droit à l'effacement — Supprimer mes données</option>
                        <option value="PORTABILITE">Droit à la portabilité — Recevoir mes données</option>
                        <option value="OPPOSITION">Droit d'opposition — M'opposer au traitement</option>
                        <option value="LIMITATION">Droit à la limitation — Limiter le traitement</option>
                    </select>
                </div>
                <div style="margin-bottom:1rem;">
                    <label style="display:block; margin-bottom:0.3rem; font-weight:600;">Description</label>
                    <textarea id="rgpdDesc" rows="3" style="width:100%; padding:0.7rem; border:1px solid #ddd; border-radius:8px;" placeholder="Décrivez votre demande..."></textarea>
                </div>
                <button type="submit" style="background:#188701; color:white; border:none; padding:0.7rem 2rem; border-radius:25px; font-weight:bold; cursor:pointer; width:100%;">📤 Envoyer ma demande</button>
                <p id="rgpdMessage" style="text-align:center; margin-top:0.5rem;"></p>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

async function envoyerDemandeRGPD(e) {
    e.preventDefault();
    const msg = document.getElementById('rgpdMessage');
    try {
        const resp = await fetch(`${API_BASE}/api/administration/rgpd/demande/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nom: document.getElementById('rgpdNom').value,
                email: document.getElementById('rgpdEmail').value,
                type_demande: document.getElementById('rgpdType').value,
                description: document.getElementById('rgpdDesc').value
            })
        });
        const data = await resp.json();
        msg.style.color = '#188701';
        msg.textContent = '✅ ' + data.message;
    } catch(err) {
        msg.style.color = 'red';
        msg.textContent = 'Erreur : ' + err.message;
    }
}

function ouvrirMentionsLegales() {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:10001; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; width:100%; max-width:700px; max-height:90vh; overflow-y:auto; padding:2rem;">
            <div style="display:flex; justify-content:space-between; margin-bottom:1.5rem;">
                <h2 style="color:#188701; margin:0;">📜 Mentions Légales</h2>
                <button onclick="this.closest('div[style]').remove()" style="background:none; border:none; font-size:1.5rem; cursor:pointer;">✕</button>
            </div>
            <h3 style="color:#188701;">Éditeur du site</h3>
            <p><strong>KAMCO FARM / KAMCO FARM</strong><br>AWAE - Yaoundé, Cameroun<br>Téléphone : +237 6 94 57 20 50<br>Email : infoclients@kamcofarm.com</p>
            <h3 style="color:#188701;">Directeur de la publication</h3>
            <p>[Nom du directeur]</p>
            <h3 style="color:#188701;">Hébergement</h3>
            <p>[Nom de l'hébergeur]<br>[Adresse de l'hébergeur]</p>
            <h3 style="color:#188701;">Propriété intellectuelle</h3>
            <p>L'ensemble du contenu de ce site est protégé par le droit d'auteur. Toute reproduction est interdite sans autorisation.</p>
            <h3 style="color:#188701;">Responsabilité</h3>
            <p>KAMCO FARM s'efforce d'assurer l'exactitude des informations diffusées mais ne peut garantir leur exhaustivité.</p>
            <button onclick="this.closest('div[style]').remove()" style="background:#188701; color:white; border:none; padding:0.7rem 2rem; border-radius:25px; font-weight:bold; cursor:pointer; margin-top:1rem;">Fermer</button>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}






// ========================================
// INITIALISATION GLOBALE
// ========================================
document.addEventListener('DOMContentLoaded', function () {
    initLanguageDropdown();
    initMobileMenu();
    initSmoothScroll();
    initHeaderEffects();
    initQuoteForm();
    initLoginForm();

    changeLanguage(currentLanguage);

    // contenus dynamiques
    loadProducts();
    loadGallery();
    loadPartners();
    loadBlogPosts();
    loadTestimonials();
    loadStatistiq();

    setTimeout(() => {
        initScrollAnimations();
    }, 500);

    console.log('%c🌟 Bienvenue sur KAMCO FARM! 🌟', 'font-size: 18px; color: #188701; font-weight: bold;');
});