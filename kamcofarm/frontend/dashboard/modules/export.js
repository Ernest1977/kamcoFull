// ========================================
// EXPORT EXCEL — SYSTÈME UNIVERSEL
// ========================================

function exporterTableauExcel(tableId, nomFichier = 'export') {
    /**
     * Exporte un tableau HTML en fichier Excel (.xlsx)
     * Utilise le format CSV compatible Excel
     */
    const table = document.querySelector(`#${tableId} table`) ||
                  document.querySelector(`.${tableId} table`) ||
                  document.querySelector(`[data-export="${tableId}"] table`);

    if (!table) {
        // Si pas de table avec ID, chercher la table visible dans le tab actif
        const activeTab = document.querySelector('.tab-content.active') ||
                         document.querySelector('.tab-content[style*="display: block"]') ||
                         document.querySelector('.tab-content[style*="display:block"]');

        if (!activeTab) {
            alert('Aucun tableau trouvé à exporter.');
            return;
        }

        const visibleTable = activeTab.querySelector('.responsive-desktop-view table') ||
                            activeTab.querySelector('table.dash-table') ||
                            activeTab.querySelector('table');

        if (!visibleTable) {
            alert('Aucun tableau trouvé dans l\'onglet actif.');
            return;
        }

        exportTableToExcel(visibleTable, nomFichier);
        return;
    }

    exportTableToExcel(table, nomFichier);
}

function exporterOngletActifExcel(nomFichier = 'export') {
    /**
     * Exporte le tableau de l'onglet actuellement actif
     */
    // Chercher dans tous les conteneurs possibles
    const activeTab = document.querySelector('.tab-content.active') ||
                     document.querySelector('.tab-content[style*="display: block"]') ||
                     document.querySelector('.tab-content[style*="display:block"]');

    if (!activeTab) {
        // Chercher directement dans le content-area
        const contentArea = document.getElementById('contentArea');
        const table = contentArea?.querySelector('.responsive-desktop-view table') ||
                     contentArea?.querySelector('table.dash-table') ||
                     contentArea?.querySelector('table');

        if (!table) {
            alert('Aucun tableau trouvé à exporter.');
            return;
        }

        exportTableToExcel(table, nomFichier);
        return;
    }

    const table = activeTab.querySelector('.responsive-desktop-view table') ||
                 activeTab.querySelector('table.dash-table') ||
                 activeTab.querySelector('table');

    if (!table) {
        alert('Aucun tableau trouvé dans cet onglet.');
        return;
    }

    exportTableToExcel(table, nomFichier);
}

function exportTableToExcel(table, nomFichier) {
    /**
     * Convertit un tableau HTML en CSV et déclenche le téléchargement
     */
    const rows = table.querySelectorAll('tr');
    if (rows.length === 0) {
        alert('Le tableau est vide.');
        return;
    }

    let csv = '\uFEFF'; // BOM pour UTF-8 Excel

    rows.forEach((row, rowIndex) => {
        const cells = row.querySelectorAll('th, td');
        const rowData = [];

        cells.forEach((cell, cellIndex) => {
            // Ignorer la dernière colonne si c'est "Actions"
            const headerRow = table.querySelector('thead tr');
            if (headerRow) {
                const headerCells = headerRow.querySelectorAll('th');
                const lastHeader = headerCells[headerCells.length - 1];
                if (lastHeader && lastHeader.textContent.trim().toLowerCase() === 'actions' && cellIndex === cells.length - 1) {
                    return;
                }
            }

            // Récupérer le texte propre
            let text = cell.innerText || cell.textContent || '';

            // Nettoyer les emojis et caractères spéciaux pour Excel
            text = text.replace(/[\n\r]+/g, ' ').trim();

            // Échapper les guillemets
            text = text.replace(/"/g, '""');

            // Entourer de guillemets si contient des virgules ou des points-virgules
            if (text.includes(';') || text.includes(',') || text.includes('"') || text.includes('\n')) {
                text = `"${text}"`;
            }

            rowData.push(text);
        });

        csv += rowData.join(';') + '\n';
    });

    // Télécharger le fichier
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `${nomFichier}_${dateStr}.csv`;

    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    // Notification de succès
    showExportNotification(nomFichier);
}

function showExportNotification(nomFichier) {
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; z-index: 9999;
        background: var(--primary, #188701); color: white;
        padding: 1rem 1.5rem; border-radius: 12px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        display: flex; align-items: center; gap: 0.8rem;
        font-size: 0.9rem; font-weight: 500;
        animation: slideInRight 0.3s ease;
    `;
    notif.innerHTML = `
        <span style="font-size:1.3rem;">✅</span>
        <div>
            <strong>Export réussi !</strong><br>
            <small>${nomFichier} exporté en CSV/Excel</small>
        </div>
    `;
    document.body.appendChild(notif);

    setTimeout(() => {
        notif.style.opacity = '0';
        notif.style.transition = 'opacity 0.3s';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

function exporterDonneesJSON(data, nomFichier = 'export') {
    /**
     * Exporte des données JSON en CSV Excel
     */
    if (!data || !Array.isArray(data) || data.length === 0) {
        alert('Aucune donnée à exporter.');
        return;
    }

    let csv = '\uFEFF';

    // En-têtes
    const headers = Object.keys(data[0]);
    csv += headers.join(';') + '\n';

    // Données
    data.forEach(row => {
        const values = headers.map(h => {
            let val = row[h];
            if (val === null || val === undefined) val = '';
            val = String(val).replace(/"/g, '""').replace(/[\n\r]+/g, ' ');
            if (String(val).includes(';') || String(val).includes(',')) val = `"${val}"`;
            return val;
        });
        csv += values.join(';') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nomFichier}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    showExportNotification(nomFichier);
}