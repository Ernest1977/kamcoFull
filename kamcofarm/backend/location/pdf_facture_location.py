from decimal import Decimal
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


def generer_facture_location_pdf(facture):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=1.5*cm, bottomMargin=2*cm)

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='Entreprise', fontSize=18, leading=22, textColor=colors.HexColor('#188701'), fontName='Helvetica-Bold', alignment=TA_LEFT))
    styles.add(ParagraphStyle(name='Slogan', fontSize=9, textColor=colors.HexColor('#757575'), fontName='Helvetica', alignment=TA_LEFT))
    styles.add(ParagraphStyle(name='FactureNumero', fontSize=14, textColor=colors.HexColor('#188701'), fontName='Helvetica-Bold', alignment=TA_RIGHT))
    styles.add(ParagraphStyle(name='SectionTitle', fontSize=11, textColor=colors.HexColor('#188701'), fontName='Helvetica-Bold', spaceAfter=6, spaceBefore=12))
    styles.add(ParagraphStyle(name='InfoText', fontSize=9, leading=13, fontName='Helvetica'))
    styles.add(ParagraphStyle(name='InfoBold', fontSize=9, leading=13, fontName='Helvetica-Bold'))
    styles.add(ParagraphStyle(name='Footer', fontSize=8, textColor=colors.HexColor('#999999'), fontName='Helvetica', alignment=TA_CENTER))

    elements = []

    # ========================================
    # EN-TÊTE AVEC LOGO
    # ========================================
    logo_path = os.path.join(settings.BASE_DIR, 'static', 'images', 'logo_kamco.png')
    left_column = []

    if os.path.exists(logo_path):
        try:
            logo_element = Image(logo_path, width=4.5*cm, height=3*cm)
            logo_element.hAlign = 'LEFT'
            left_column.append(logo_element)
        except Exception:
            left_column.append(Paragraph('KAMCO FARM', styles['Entreprise']))
    else:
        left_column.append(Paragraph('KAMCO FARM', styles['Entreprise']))
        left_column.append(Paragraph('Cultivons l\'avenir ensemble', styles['Slogan']))

    left_column.extend([
        Spacer(1, 4),
        Paragraph('Logpom - Douala, Cameroun', styles['InfoText']),
        Paragraph('📞 +237 699 951 406', styles['InfoText']),
        Paragraph('✉️ infoclients@fossagrofarm.com', styles['InfoText']),
    ])

    right_column = [
        Paragraph('FACTURE DE LOCATION', styles['FactureNumero']),
        Paragraph(f'N° {facture.reference}', styles['FactureNumero']),
        Spacer(1, 10),
        Paragraph(f'Date : {facture.date_emission.strftime("%d/%m/%Y")}', styles['InfoText']),
        Paragraph(f'Échéance : {facture.date_echeance.strftime("%d/%m/%Y")}', styles['InfoText']),
        Paragraph(f'Devise : {facture.devise}', styles['InfoText']),
    ]

    header_table = Table([[left_column, right_column]], colWidths=[9*cm, 8*cm])
    header_table.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP'), ('ALIGN', (1,0), (1,0), 'RIGHT')]))
    elements.append(header_table)

    # Séparation
    elements.append(Spacer(1, 8))
    sep = Table([['', '']], colWidths=[17*cm, 0])
    sep.setStyle(TableStyle([('LINEABOVE', (0,0), (0,0), 2, colors.HexColor('#188701'))]))
    elements.append(sep)
    elements.append(Spacer(1, 12))

    # Type
    elements.append(Paragraph('📋 FACTURE DE LOCATION DE MATÉRIEL', styles['InfoBold']))
    elements.append(Spacer(1, 8))

    # ========================================
    # INFOS CONTRAT
    # ========================================
    contrat = facture.contrat
    if contrat:
        elements.append(Paragraph('RÉFÉRENCE CONTRAT', styles['SectionTitle']))
        contrat_data = [
            ['Contrat N°', contrat.reference, 'Équipement', contrat.equipement.nom if contrat.equipement else 'N/A'],
            ['Début', contrat.date_debut.strftime('%d/%m/%Y'), 'Fin prévue', contrat.date_fin_prevue.strftime('%d/%m/%Y')],
        ]
        if contrat.date_fin_effective:
            contrat_data.append(['Fin effective', contrat.date_fin_effective.strftime('%d/%m/%Y'), 'Durée', f'{contrat.jours_location} jours'])
        if contrat.jours_retard and contrat.jours_retard > 0:
            contrat_data.append(['Retard', f'{contrat.jours_retard} jours', 'Pénalités', f'{contrat.montant_penalites:,.0f} {contrat.devise}'])

        ct = Table(contrat_data, colWidths=[3.5*cm, 5*cm, 3.5*cm, 5*cm])
        ct.setStyle(TableStyle([
            ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
            ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 9),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('GRID', (0,0), (-1,-1), 0.3, colors.HexColor('#e0e0e0')),
            ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#f0f7f0')),
            ('BACKGROUND', (2,0), (2,-1), colors.HexColor('#f0f7f0')),
        ]))
        elements.append(ct)
        elements.append(Spacer(1, 12))

    # ========================================
    # CLIENT
    # ========================================
    elements.append(Paragraph('FACTURER À', styles['SectionTitle']))
    elements.append(Paragraph(f'<b>{facture.client_nom}</b>', styles['InfoBold']))
    if facture.client_entreprise:
        elements.append(Paragraph(facture.client_entreprise, styles['InfoText']))
    if facture.client_email:
        elements.append(Paragraph(f'Email : {facture.client_email}', styles['InfoText']))
    if facture.client_adresse:
        elements.append(Paragraph(f'Adresse : {facture.client_adresse}', styles['InfoText']))
    elements.append(Spacer(1, 12))

    # ========================================
    # LIGNES
    # ========================================
    elements.append(Paragraph('DÉTAIL DE LA FACTURE', styles['SectionTitle']))

    table_data = [['Type', 'Description', 'Qté', 'Unité', 'Prix unit.', 'Total']]

    lignes = facture.lignes.all()
    if lignes.exists():
        for ligne in lignes:
            type_labels = {
                'LOCATION': '📋 Location',
                'SERVICE': '🔧 Service',
                'PENALITE': '⚠️ Pénalité',
                'DOMMAGE': '🔨 Dommage',
                'CARBURANT': '⛽ Carburant',
                'REMISE': '💰 Remise',
                'AUTRE': '📄 Autre'
            }
            type_label = type_labels.get(ligne.type_ligne, '📄 Autre')

            table_data.append([
                type_label,
                Paragraph(str(ligne.description), styles['InfoText']),
                f'{ligne.quantite:,.2f}',
                str(ligne.unite or ''),
                f'{ligne.prix_unitaire:,.0f}',
                f'{ligne.montant_total:,.0f}'
            ])
    else:
        table_data.append([
            '📋 Location',
            Paragraph('Location selon contrat', styles['InfoText']),
            '1', 'forfait',
            f'{facture.montant_ht:,.0f}',
            f'{facture.montant_ht:,.0f}'
        ])

    col_widths = [2.5*cm, 5.5*cm, 1.5*cm, 1.5*cm, 2.5*cm, 3*cm]
    table = Table(table_data, colWidths=col_widths, repeatRows=1)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#188701')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 9),
        ('ALIGN', (0,0), (-1,0), 'CENTER'),
        ('BOTTOMPADDING', (0,0), (-1,0), 8),
        ('TOPPADDING', (0,0), (-1,0), 8),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,1), (-1,-1), 9),
        ('ALIGN', (2,1), (-1,-1), 'CENTER'),
        ('ALIGN', (4,1), (-1,-1), 'RIGHT'),
        ('ALIGN', (5,1), (-1,-1), 'RIGHT'),
        ('BOTTOMPADDING', (0,1), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e0e0e0')),
        *[('BACKGROUND', (0,i), (-1,i), colors.HexColor('#f9f9f9')) for i in range(2, len(table_data), 2)],
    ]))
    elements.append(table)
    elements.append(Spacer(1, 15))

    # ========================================
    # TOTAUX
    # ========================================
    tva_pourcent = facture.taux_tva or Decimal('19.25')

    totaux_data = [
        ['', '', '', '', 'Sous-total HT :', f'{facture.montant_ht:,.0f} {facture.devise}'],
        ['', '', '', '', f'TVA ({tva_pourcent}%) :', f'{facture.montant_tva:,.0f} {facture.devise}'],
        ['', '', '', '', 'TOTAL TTC :', f'{facture.montant_ttc:,.0f} {facture.devise}'],
    ]

    if facture.montant_paye > 0:
        totaux_data.append(['', '', '', '', 'Payé :', f'{facture.montant_paye:,.0f} {facture.devise}'])
        totaux_data.append(['', '', '', '', 'Solde restant :', f'{facture.solde_restant:,.0f} {facture.devise}'])

    totaux_table = Table(totaux_data, colWidths=[2*cm, 2*cm, 2*cm, 3*cm, 4*cm, 4*cm])
    totaux_styles = [
        ('ALIGN', (4,0), (4,-1), 'RIGHT'),
        ('ALIGN', (5,0), (5,-1), 'RIGHT'),
        ('FONTNAME', (4,0), (5,-1), 'Helvetica'),
        ('FONTSIZE', (4,0), (5,-1), 10),
        ('FONTNAME', (4,2), (5,2), 'Helvetica-Bold'),
        ('FONTSIZE', (4,2), (5,2), 12),
        ('TEXTCOLOR', (4,2), (5,2), colors.HexColor('#188701')),
        ('LINEABOVE', (4,2), (5,2), 1.5, colors.HexColor('#188701')),
        ('BOTTOMPADDING', (4,2), (5,2), 8),
        ('TOPPADDING', (4,2), (5,2), 8),
    ]

    if facture.solde_restant and facture.solde_restant > 0:
        totaux_styles.extend([
            ('TEXTCOLOR', (4,-1), (5,-1), colors.HexColor('#F44336')),
            ('FONTNAME', (4,-1), (5,-1), 'Helvetica-Bold'),
        ])

    totaux_table.setStyle(TableStyle(totaux_styles))
    elements.append(totaux_table)
    elements.append(Spacer(1, 20))

    # Notes
    if facture.notes:
        elements.append(Paragraph('NOTES', styles['SectionTitle']))
        elements.append(Paragraph(facture.notes, styles['InfoText']))
        elements.append(Spacer(1, 10))

    # ========================================
    # PIED DE PAGE
    # ========================================
    elements.append(Spacer(1, 15))
    sep2 = Table([['', '']], colWidths=[17*cm, 0])
    sep2.setStyle(TableStyle([('LINEABOVE', (0,0), (0,0), 1, colors.HexColor('#e0e0e0'))]))
    elements.append(sep2)
    elements.append(Spacer(1, 8))
    elements.append(Paragraph('KAMCO FARM / FOSS AGRO FARM — Logpom, Douala, Cameroun | +237 699 951 406', styles['Footer']))
    elements.append(Paragraph(f'Facture générée le {date.today().strftime("%d/%m/%Y")} — © 2025 KAMCO FARM. Tous droits réservés.', styles['Footer']))

    doc.build(elements)
    buffer.seek(0)
    return buffer