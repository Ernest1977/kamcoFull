from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from io import BytesIO
from datetime import date
import os
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def generer_facture_pdf(facture):
    """
    Génère un PDF professionnel pour une facture.
    Retourne un BytesIO contenant le PDF.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=1.5 * cm,
        bottomMargin=2 * cm
    )

    styles = getSampleStyleSheet()

    # Styles personnalisés
    styles.add(ParagraphStyle(
        name='Entreprise',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#188701'),
        fontName='Helvetica-Bold',
        alignment=TA_LEFT
    ))

    styles.add(ParagraphStyle(
        name='Slogan',
        fontSize=9,
        textColor=colors.HexColor('#757575'),
        fontName='Helvetica',
        alignment=TA_LEFT
    ))

    styles.add(ParagraphStyle(
        name='FactureNumero',
        fontSize=14,
        textColor=colors.HexColor('#188701'),
        fontName='Helvetica-Bold',
        alignment=TA_RIGHT
    ))

    styles.add(ParagraphStyle(
        name='SectionTitle',
        fontSize=11,
        textColor=colors.HexColor('#188701'),
        fontName='Helvetica-Bold',
        spaceAfter=6,
        spaceBefore=12
    ))

    styles.add(ParagraphStyle(
        name='InfoText',
        fontSize=9,
        leading=13,
        fontName='Helvetica'
    ))

    styles.add(ParagraphStyle(
        name='InfoBold',
        fontSize=9,
        leading=13,
        fontName='Helvetica-Bold'
    ))

    styles.add(ParagraphStyle(
        name='Footer',
        fontSize=8,
        textColor=colors.HexColor('#999999'),
        fontName='Helvetica',
        alignment=TA_CENTER
    ))

    styles.add(ParagraphStyle(
        name='Conditions',
        fontSize=8,
        textColor=colors.HexColor('#666666'),
        fontName='Helvetica',
        leading=11
    ))

    elements = []

    # ========================================
    # EN-TÊTE
    # ========================================

    # Charger le logo
    logo_path = os.path.join(settings.BASE_DIR, 'static', 'images', 'kamcofarm.png')
    logo_element = None

    if os.path.exists(logo_path):
        try:
            logo_element = Image(logo_path, width=4.5 * cm, height=3 * cm)
            logo_element.hAlign = 'LEFT'
        except Exception as e:
            logger.warning(f"Impossible de charger le logo: {e}")
            logo_element = None

    # Construire la colonne gauche (logo + nom)
    left_column = []
    if logo_element:
        left_column.append(logo_element)
    else:
        left_column.append(Paragraph('KAMCO FARM', styles['Entreprise']))
        left_column.append(Paragraph('Cultivons l\'avenir ensemble', styles['Slogan']))

    left_column.extend([
        Spacer(1, 4),
        Paragraph('AWAE- Yaoundé, Cameroun', styles['InfoText']),
        Paragraph('📞 +237 6 94 57 20 50', styles['InfoText']),
        Paragraph('✉️ infoclients@kamcofarm.com', styles['InfoText']),
    ])

    # Colonne droite (infos facture)
    right_column = [
        Paragraph('FACTURE', styles['FactureNumero']),
        Paragraph(f'N° {facture.numero}', styles['FactureNumero']),
        Spacer(1, 10),
        Paragraph(f'Date : {facture.date_emission.strftime("%d/%m/%Y")}', styles['InfoText']),
        Paragraph(f'Échéance : {facture.date_echeance.strftime("%d/%m/%Y")}', styles['InfoText']),
        Paragraph(f'Devise : {facture.devise}', styles['InfoText']),
    ]

    header_data = [[left_column, right_column]]

    header_table = Table(header_data, colWidths=[9 * cm, 8 * cm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
    ]))
    elements.append(header_table)

    # Ligne de séparation
    elements.append(Spacer(1, 8))
    sep_data = [['', '']]
    sep_table = Table(sep_data, colWidths=[17 * cm, 0])
    sep_table.setStyle(TableStyle([
        ('LINEABOVE', (0, 0), (0, 0), 2, colors.HexColor('#188701')),
    ]))
    elements.append(sep_table)
    elements.append(Spacer(1, 12))

    # ========================================
    # TYPE D'OPÉRATION
    # ========================================
    type_labels = {
        'ACHAT': '🛒 Vente de produits',
        'LOCATION': '📋 Location de matériel',
        'SERVICE': '🔧 Prestation de service',
        'AUTRE': '📄 Autre'
    }
    type_op = getattr(facture, 'type_operation', 'ACHAT')
    elements.append(Paragraph(f'Type : {type_labels.get(type_op, type_op)}', styles['InfoBold']))
    elements.append(Spacer(1, 8))

    # ========================================
    # INFORMATIONS CLIENT
    # ========================================
    elements.append(Paragraph('FACTURER À :', styles['SectionTitle']))

    client_info = []
    client_info.append(Paragraph(f'<b>{facture.client_nom}</b>', styles['InfoBold']))
    if facture.client_entreprise:
        client_info.append(Paragraph(facture.client_entreprise, styles['InfoText']))
    if facture.client_adresse:
        client_info.append(Paragraph(facture.client_adresse, styles['InfoText']))
    if facture.client_email:
        client_info.append(Paragraph(f'Email : {facture.client_email}', styles['InfoText']))
    if facture.client_telephone:
        client_info.append(Paragraph(f'Tél : {facture.client_telephone}', styles['InfoText']))

    for info in client_info:
        elements.append(info)

    elements.append(Spacer(1, 15))

    # ========================================
    # TABLEAU DES LIGNES
    # ========================================
    elements.append(Paragraph('DÉTAIL DE LA FACTURE', styles['SectionTitle']))

    # En-tête du tableau
        # En-tête du tableau
    table_data = [['Catégorie', 'Description', 'Qté', 'Unité', 'Prix unit.', 'Sous-total']]

    # Lignes
    lignes = facture.lignes.all()
    if lignes.exists():
        for ligne in lignes:
            cat_labels = {
                'PRODUIT_AGRICOLE': '🌱 Produit',
                'MATERIEL': '🚜 Matériel',
                'LOCATION': '📋 Location',
                'SERVICE': '🔧 Service',
                'TRANSPORT': '🚚 Transport',
                'PENALITE': '⚠️ Pénalité',
                'AUTRE': '📄 Autre'
            }
            cat = cat_labels.get(ligne.categorie_ligne, '📄 Autre')

            detail = str(ligne.description)
            if ligne.produit:
                detail = f"{ligne.produit.nom} ({ligne.produit.get_type_produit_display()})"
            elif ligne.equipement:
                detail = f"{ligne.equipement.nom} ({ligne.equipement.reference})"

            table_data.append([
                cat,
                Paragraph(detail, styles['InfoText']),
                f'{ligne.quantite:,.2f}',
                str(ligne.unite or ''),
                f'{ligne.prix_unitaire:,.0f}',
                f'{ligne.sous_total:,.0f}'
            ])
    else:
        table_data.append([
            '📄 Autre',
            Paragraph('Prestation selon accord', styles['InfoText']),
            '1',
            'forfait',
            f'{facture.montant_ht:,.0f}',
            f'{facture.montant_ht:,.0f}'
        ])

    col_widths = [2.5 * cm, 5.5 * cm, 1.8 * cm, 1.8 * cm, 2.5 * cm, 3 * cm]
    table = Table(table_data, colWidths=col_widths, repeatRows=1)
    table.setStyle(TableStyle([
        # En-tête
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#188701')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),

        # Corps
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
        ('ALIGN', (3, 1), (-1, -1), 'RIGHT'),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('TOPPADDING', (0, 1), (-1, -1), 6),

        # Grille
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e0e0e0')),
        ('LINEBELOW', (0, 0), (-1, 0), 1.5, colors.HexColor('#188701')),

        # Alternance couleurs
        *[('BACKGROUND', (0, i), (-1, i), colors.HexColor('#f9f9f9'))
          for i in range(2, len(table_data), 2)],
    ]))
    elements.append(table)
    elements.append(Spacer(1, 15))

    # ========================================
    # TOTAUX
    # ========================================
    tva_pourcent = getattr(facture, 'tva_pourcentage', 19.25)

    totaux_data = [
        ['', '', '', 'Sous-total HT :', f'{facture.montant_ht:,.0f} {facture.devise}'],
        ['', '', '', f'TVA ({tva_pourcent}%) :', f'{facture.montant_tva:,.0f} {facture.devise}'],
        ['', '', '', 'TOTAL TTC :', f'{facture.montant_ttc:,.0f} {facture.devise}'],
    ]

    if facture.montant_paye > 0:
        totaux_data.append(['', '', '', 'Montant payé :', f'{facture.montant_paye:,.0f} {facture.devise}'])
        totaux_data.append(['', '', '', 'Solde restant :', f'{facture.solde_restant:,.0f} {facture.devise}'])

    totaux_table = Table(totaux_data, colWidths=[3 * cm, 3 * cm, 3 * cm, 4 * cm, 4 * cm])
    totaux_table.setStyle(TableStyle([
        ('ALIGN', (3, 0), (3, -1), 'RIGHT'),
        ('ALIGN', (4, 0), (4, -1), 'RIGHT'),
        ('FONTNAME', (3, 0), (4, -1), 'Helvetica'),
        ('FONTSIZE', (3, 0), (4, -1), 10),

        # Total TTC en gras et vert
        ('FONTNAME', (3, 2), (4, 2), 'Helvetica-Bold'),
        ('FONTSIZE', (3, 2), (4, 2), 12),
        ('TEXTCOLOR', (3, 2), (4, 2), colors.HexColor('#188701')),
        ('LINEABOVE', (3, 2), (4, 2), 1.5, colors.HexColor('#188701')),
        ('BOTTOMPADDING', (3, 2), (4, 2), 8),
        ('TOPPADDING', (3, 2), (4, 2), 8),

        # Solde en rouge si > 0
        *([('TEXTCOLOR', (3, -1), (4, -1), colors.HexColor('#F44336')),
           ('FONTNAME', (3, -1), (4, -1), 'Helvetica-Bold')]
          if facture.solde_restant and facture.solde_restant > 0 else []),
    ]))
    elements.append(totaux_table)
    elements.append(Spacer(1, 20))

    # ========================================
    # CONDITIONS DE PAIEMENT
    # ========================================
    if facture.conditions_paiement:
        elements.append(Paragraph('CONDITIONS DE PAIEMENT', styles['SectionTitle']))
        elements.append(Paragraph(facture.conditions_paiement, styles['Conditions']))
        elements.append(Spacer(1, 10))

    # Notes
    if facture.notes:
        elements.append(Paragraph('NOTES', styles['SectionTitle']))
        elements.append(Paragraph(facture.notes, styles['Conditions']))
        elements.append(Spacer(1, 10))

    # ========================================
    # PIED DE PAGE
    # ========================================
    elements.append(Spacer(1, 20))
    sep_data2 = [['', '']]
    sep_table2 = Table(sep_data2, colWidths=[17 * cm, 0])
    sep_table2.setStyle(TableStyle([
        ('LINEABOVE', (0, 0), (0, 0), 1, colors.HexColor('#e0e0e0')),
    ]))
    elements.append(sep_table2)
    elements.append(Spacer(1, 8))

    elements.append(Paragraph(
        'KAMCO FARM — AWAE, Yaoundé, Cameroun | +237 6 94 57 20 50 | infoclients@kamcofarm.com',
        styles['Footer']
    ))
    elements.append(Paragraph(
        f'Facture générée le {date.today().strftime("%d/%m/%Y")} — © 2026 KAMCO FARM. Tous droits réservés.',
        styles['Footer']
    ))

    # Construire le PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer