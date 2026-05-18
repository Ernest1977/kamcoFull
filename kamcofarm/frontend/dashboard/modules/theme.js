// ========================================
// SYSTÈME DE THÈMES
// ========================================

function initThemeSwitcher() {
    const themeBtn = document.getElementById('themeBtn');
    const themeMenu = document.getElementById('themeMenu');

    if (!themeBtn || !themeMenu) return;

    themeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        themeMenu.classList.toggle('show');
    });

    document.addEventListener('click', function() {
        themeMenu.classList.remove('show');
    });

    // Charger le thème sauvegardé
    const savedTheme = localStorage.getItem('dashboard_theme') || 'light';
    setTheme(savedTheme, false);
}

function setTheme(theme, animate = true) {
    // Appliquer le thème
    document.documentElement.setAttribute('data-theme', theme);

    // Sauvegarder
    localStorage.setItem('dashboard_theme', theme);

    // Mettre à jour l'icône
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        const icons = { 'light': '☀️', 'dark': '🌙', 'turquoise': '💎' };
        themeIcon.textContent = icons[theme] || '☀️';
    }

    // Mettre à jour le bouton actif
    document.querySelectorAll('.theme-option').forEach(opt => {
        opt.classList.remove('active');
        if (opt.dataset.theme === theme) {
            opt.classList.add('active');
        }
    });

    // Fermer le menu
    const themeMenu = document.getElementById('themeMenu');
    if (themeMenu) themeMenu.classList.remove('show');

    // Mettre à jour les couleurs Chart.js si des graphiques existent
    if (animate) {
        updateChartsTheme(theme);
    }
}

function updateChartsTheme(theme) {
    // Mettre à jour les couleurs par défaut de Chart.js
    if (typeof Chart !== 'undefined') {
        const textColor = theme === 'dark' ? '#e6edf3' : '#1a202c';
        const gridColor = theme === 'dark' ? '#30363d' : '#e2e8f0';

        Chart.defaults.color = textColor;
        Chart.defaults.borderColor = gridColor;

        // Redessiner les graphiques existants
        Object.values(chartInstances || {}).forEach(chart => {
            if (chart && chart.options) {
                if (chart.options.scales) {
                    Object.values(chart.options.scales).forEach(scale => {
                        if (scale.ticks) scale.ticks.color = textColor;
                        if (scale.grid) scale.grid.color = gridColor;
                    });
                }
                if (chart.options.plugins && chart.options.plugins.legend) {
                    chart.options.plugins.legend.labels = chart.options.plugins.legend.labels || {};
                    chart.options.plugins.legend.labels.color = textColor;
                }
                chart.update();
            }
        });
    }
}

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initThemeSwitcher, 300);
});