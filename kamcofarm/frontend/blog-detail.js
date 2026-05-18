const API_BASE = (window.location.origin.includes('127.0.0.1') || window.location.origin.includes('localhost')) ? 'http://127.0.0.1:8000' : window.location.origin;

function getArticleIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get('id'), 10);
}

function formatDate(dateString, lang = 'fr') {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function setupShareLinks(post) {
    const currentUrl = window.location.href;
    const text = encodeURIComponent(`${post.titre} - FOSS AGRO FARM`);
    const encodedUrl = encodeURIComponent(currentUrl);

    const whatsappLink = `https://wa.me/?text=${text}%20${encodedUrl}`;
    const facebookLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

    const whatsappBtn = document.getElementById('shareWhatsapp');
    const facebookBtn = document.getElementById('shareFacebook');

    if (whatsappBtn) whatsappBtn.href = whatsappLink;
    if (facebookBtn) facebookBtn.href = facebookLink;
}

function renderHero(post, lang) {
    const hero = document.getElementById('blogHero');
    const heroContent = document.getElementById('blogHeroContent');

    if (hero && (post.image_url || post.image)) {
        hero.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.55)), url('${post.image_url || post.image}')`;
    }

    if (heroContent) {
        heroContent.innerHTML = `
            <div class="blog-hero-meta">
                <span>📅 ${formatDate(post.date_publication, lang)}</span>
                <span>👤 ${post.auteur || 'Admin'}</span>
            </div>
            <h1>${post.titre}</h1>
            <p>${post.extrait || ''}</p>
        `;
    }
}

function renderArticle(post, lang) {
    const container = document.getElementById('blogDetailContainer');
    if (!container) return;

    container.innerHTML = `
        <div class="blog-article-card">
            <div class="blog-article-header">
                <span class="article-date">Publié le ${formatDate(post.date_publication, lang)}</span>
                <span class="article-author">Par ${post.auteur || 'Admin'}</span>
            </div>
            <div class="blog-article-body">
                ${(post.contenu || '').replace(/\n/g, '<br><br>')}
            </div>
            <div class="blog-article-footer">
                <a href="index.html#blog" class="back-btn">← Retour au blog</a>
            </div>
        </div>
    `;
}

function renderPrevNext(posts, currentId) {
    const container = document.getElementById('prevNextArticles');
    if (!container) return;

    const currentIndex = posts.findIndex(post => post.id === currentId);
    const prevPost = currentIndex > 0 ? posts[currentIndex - 1] : null;
    const nextPost = currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null;

    container.innerHTML = `
        <div class="prev-next-links">
            ${prevPost ? `
                <a href="blog-detail.html?id=${prevPost.id}" class="prev-article">
                    <small>← Article précédent</small>
                    <strong>${prevPost.titre}</strong>
                </a>
            ` : `<div class="prev-article disabled"><small>← Article précédent</small><strong>Aucun</strong></div>`}

            ${nextPost ? `
                <a href="blog-detail.html?id=${nextPost.id}" class="next-article">
                    <small>Article suivant →</small>
                    <strong>${nextPost.titre}</strong>
                </a>
            ` : `<div class="next-article disabled"><small>Article suivant →</small><strong>Aucun</strong></div>`}
        </div>
    `;
}

function renderRelated(posts, currentId, lang) {
    const container = document.getElementById('relatedArticles');
    if (!container) return;

    const related = posts.filter(post => post.id !== currentId).slice(0, 3);

    if (!related.length) {
        container.innerHTML = `<p style="text-align:center;">Aucun article similaire.</p>`;
        return;
    }

    container.innerHTML = '';

    related.forEach(post => {
        const card = document.createElement('article');
        card.className = 'related-card';

        card.innerHTML = `
            <div class="related-image">
                <img src="${post.image_url || post.image || ''}" alt="${post.titre}" loading="lazy"
                     onerror="this.style.display='none';">
            </div>
            <div class="related-content">
                <div class="related-meta">
                    <span>📅 ${formatDate(post.date_publication, lang)}</span>
                    <span>👤 ${post.auteur || 'Admin'}</span>
                </div>
                <h3>${post.titre}</h3>
                <p>${(post.extrait || '').substring(0, 120)}...</p>
                <a href="blog-detail.html?id=${post.id}" class="read-more">Lire la suite →</a>
            </div>
        `;

        container.appendChild(card);
    });
}

async function loadBlogDetailPage() {
    const articleId = getArticleIdFromUrl();
    const lang = localStorage.getItem('language') || 'fr';
    const detailContainer = document.getElementById('blogDetailContainer');

    if (!articleId) {
        if (detailContainer) {
            detailContainer.innerHTML = `<p style="color:red; text-align:center; padding:2rem;">Article introuvable.</p>`;
        }
        return;
    }

    try {
        const [detailResponse, listResponse] = await Promise.all([
            fetch(`${API_BASE}/api/blog/${articleId}/`, {
                headers: {
                    'Accept': 'application/json',
                    'Accept-Language': lang
                }
            }),
            fetch(`${API_BASE}/api/blog/`, {
                headers: {
                    'Accept': 'application/json',
                    'Accept-Language': lang
                }
            })
        ]);

        if (!detailResponse.ok) {
            throw new Error(`Erreur API ${detailResponse.status}`);
        }

        const post = await detailResponse.json();
        let posts = [];

        if (listResponse.ok) {
            const listData = await listResponse.json();
            posts = Array.isArray(listData) ? listData : (listData.results || []);
        }

        document.title = `${post.titre} - FOSS AGRO FARM`;

        renderHero(post, lang);
        renderArticle(post, lang);
        renderPrevNext(posts, articleId);
        renderRelated(posts, articleId, lang);
        setupShareLinks(post);

    } catch (error) {
        console.error('Erreur chargement page détail blog :', error);

        if (detailContainer) {
            detailContainer.innerHTML = `
                <div style="text-align:center; padding:3rem;">
                    <h2 style="color:var(--primary-green);">😔 Article indisponible</h2>
                    <p style="color:#757575; margin:1rem 0;">
                        Impossible de charger cet article. Vérifiez que le serveur backend est lancé.
                    </p>
                    <a href="index.html#blog" class="back-btn" style="display:inline-block; margin-top:1rem; background:#188701; color:white; padding:0.8rem 1.5rem; border-radius:25px; text-decoration:none;">
                        ← Retour au blog
                    </a>
                </div>
            `;
        }
    }
}

document.addEventListener('DOMContentLoaded', loadBlogDetailPage);