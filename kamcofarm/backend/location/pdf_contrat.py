from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from io import BytesIO
from datetime import date
import os
from django.conf import settings


def generer_contrat_pdf(contrat):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=1.5*cm, bottomMargin=2*cm)

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='Titre', fontSize=16, textColor=colors.HexColor('#188701'), fontName='Helvetica-Bold', alignment=TA_CENTER, spaceAfter=12))
    styles.add(ParagraphStyle(name='SousTitre', fontSize=11, textColor=colors.HexColor('#188701'), fontName='Helvetica-Bold', spaceAfter=6, spaceBefore=12))
    styles.add(ParagraphStyle(name='Normal2', fontSize=9, leading=13, fontName='Helvetica'))
    styles.add(ParagraphStyle(name='Bold2', fontSize=9, leading=13, fontName='Helvetica-Bold'))
    styles.add(ParagraphStyle(name='Footer2', fontSize=8, textColor=colors.HexColor('#999'), fontName='Helvetica', alignment=TA_CENTER))
    styles.add(ParagraphStyle(name='Article', fontSize=9, leading=13, fontName='Helvetica', leftIndent=20))

    elements = []

    # Logo
    logo_path = os.path.join(settings.BASE_DIR, 'static', 'images', 'kamcofarm.png')
    if os.path.exists(logo_path):
        try:
            from reportlab.platypus import Image
            logo = Image(logo_path, width=4*cm, height=2.8*cm)
            logo.hAlign = 'CENTER'
            elements.append(logo)
        except Exception:
            pass

    elements.append(Paragraph('CONTRAT DE LOCATION DE MATÉRIEL', styles['Titre']))
    elements.append(Paragraph(f'N° {contrat.reference}', styles['Titre']))
    elements.append(Spacer(1, 10))

    # Parties
    elements.append(Paragraph('ENTRE LES PARTIES', styles['SousTitre']))

    parties_data = [
        [
            [Paragraph('<b>LE BAILLEUR :</b>', styles['Bold2']),
             Paragraph('KAMCO FARM', styles['Bold2']),
             Paragraph('AWAE - Yaoundé, Cameroun', styles['Normal2']),
             Paragraph('Tél: +237 6 94 57 20 50', styles['Normal2']),
             Paragraph('Email: infoclients@kamcofarm.com', styles['Normal2'])],
            [Paragraph('<b>LE LOCATAIRE :</b>', styles['Bold2']),
             Paragraph(f'{contrat.client_nom}', styles['Bold2']),
             Paragraph(f'{contrat.client_entreprise or ""}', styles['Normal2']),
             Paragraph(f'Tél: {contrat.client_telephone or "N/A"}', styles['Normal2']),
             Paragraph(f'Email: {contrat.client_email or "N/A"}', styles['Normal2'])]
        ]
    ]
    t = Table(parties_data, colWidths=[8.5*cm, 8.5*cm])
    t.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP'), ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e0e0e0')), ('PADDING', (0,0), (-1,-1), 8)]))
    elements.append(t)
    elements.append(Spacer(1, 15))

    # Objet
    elements.append(Paragraph('ARTICLE 1 — OBJET DU CONTRAT', styles['SousTitre']))
    eq_nom = contrat.equipement.nom if contrat.equipement else 'N/A'
    eq_ref = contrat.equipement.reference if contrat.equipement else 'N/A'
    elements.append(Paragraph(f'Le Bailleur met à disposition du Locataire le matériel suivant :', styles['Normal2']))
    elements.append(Paragraph(f'<b>Équipement :</b> {eq_nom} (Réf: {eq_ref})', styles['Article']))
    elements.append(Spacer(1, 8))

    # Durée
    elements.append(Paragraph('ARTICLE 2 — DURÉE', styles['SousTitre']))
    elements.append(Paragraph(f'Date de début : <b>{contrat.date_debut.strftime("%d/%m/%Y")}</b>', styles['Article']))
    elements.append(Paragraph(f'Date de fin prévue : <b>{contrat.date_fin_prevue.strftime("%d/%m/%Y")}</b>', styles['Article']))
    elements.append(Paragraph(f'Durée : <b>{contrat.jours_location} jours</b>', styles['Article']))
    elements.append(Spacer(1, 8))

    # Tarifs
    elements.append(Paragraph('ARTICLE 3 — CONDITIONS FINANCIÈRES', styles['SousTitre']))
    elements.append(Paragraph(f'Tarif de base : <b>{contrat.tarif_base:,.0f} {contrat.devise}</b> ({contrat.get_mode_tarification_display()})', styles['Article']))
    elements.append(Paragraph(f'Montant location HT : <b>{contrat.montant_location_ht:,.0f} {contrat.devise}</b>', styles['Article']))
    elements.append(Paragraph(f'TVA ({contrat.taux_tva}%) : <b>{contrat.montant_tva:,.0f} {contrat.devise}</b>', styles['Article']))
    elements.append(Paragraph(f'<b>TOTAL TTC : {contrat.montant_total_ttc:,.0f} {contrat.devise}</b>', styles['Article']))
    if contrat.penalite_retard_par_jour > 0:
        elements.append(Paragraph(f'Pénalité de retard : {contrat.penalite_retard_par_jour:,.0f} {contrat.devise}/jour', styles['Article']))
    elements.append(Spacer(1, 8))

    # Caution
    elements.append(Paragraph('ARTICLE 4 — CAUTION', styles['SousTitre']))
    caution = contrat.cautions.first()
    if caution:
        elements.append(Paragraph(f'Montant de la caution : <b>{caution.montant_requis:,.0f} {caution.devise}</b>', styles['Article']))
        elements.append(Paragraph('La caution sera restituée au Locataire dans un délai de 15 jours après la restitution du matériel, déduction faite des éventuels dommages constatés.', styles['Article']))
    else:
        elements.append(Paragraph('Aucune caution requise.', styles['Article']))
    elements.append(Spacer(1, 8))

    # Option achat
    if contrat.option_achat_proposee:
        elements.append(Paragraph("ARTICLE 5 — OPTION D'ACHAT", styles['SousTitre']))
        elements.append(Paragraph(f"Le Locataire bénéficie d'une option d'achat au prix de <b>{contrat.prix_option_achat:,.0f} {contrat.devise}</b>.", styles['Article']))
        elements.append(Spacer(1, 8))

    # Conditions
    elements.append(Paragraph('CONDITIONS GÉNÉRALES', styles['SousTitre']))
    conditions = contrat.conditions_generales or "Le locataire s'engage à utiliser le matériel conformément à sa destination. Toute dégradation hors usure normale sera facturée."
    for ligne in conditions.split('.'):
        ligne = ligne.strip()
        if ligne:
            elements.append(Paragraph(f'• {ligne}.', styles['Article']))
    elements.append(Spacer(1, 25))

    # Signatures
    elements.append(Paragraph('SIGNATURES', styles['SousTitre']))
    sig_data = [
        ['Le Bailleur', 'Le Locataire'],
        ['KAMCO FARM', contrat.client_nom],
        ['', ''],
        ['', ''],
        ['', ''],
        ['Date : ___/___/______', 'Date : ___/___/______'],
        ['Signature :', 'Signature :'],
        ['', ''],
        ['', ''],
        ['', ''],
        ['', ''],
    ]
    sig_table = Table(sig_data, colWidths=[8.5*cm, 8.5*cm])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('BOX', (0,0), (0,-1), 0.5, colors.HexColor('#e0e0e0')),
        ('BOX', (1,0), (1,-1), 0.5, colors.HexColor('#e0e0e0')),
    ]))
    elements.append(sig_table)
    elements.append(Spacer(1, 20))

    # Footer
    elements.append(Paragraph(f'Contrat généré le {date.today().strftime("%d/%m/%Y")} — © 2026 KAMCO FARM. Tous droits réservés.', styles['Footer2']))

    doc.build(elements)
    buffer.seek(0)
    return buffer