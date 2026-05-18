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


def generer_bulletin_classique(fiche):
    """
    Modèle 1 : Bulletin de paie classique camerounais (format CNPS)
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=1.5*cm, leftMargin=1.5*cm, topMargin=1.5*cm, bottomMargin=1.5*cm)

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='TitreBulletin', fontSize=14, textColor=colors.HexColor('#188701'), fontName='Helvetica-Bold', alignment=TA_CENTER, spaceAfter=6))
    styles.add(ParagraphStyle(name='SousTitre', fontSize=10, textColor=colors.HexColor('#333333'), fontName='Helvetica-Bold', alignment=TA_CENTER, spaceAfter=4))
    styles.add(ParagraphStyle(name='Section', fontSize=10, textColor=colors.HexColor('#188701'), fontName='Helvetica-Bold', spaceAfter=4, spaceBefore=8))
    styles.add(ParagraphStyle(name='Info', fontSize=8.5, leading=12, fontName='Helvetica'))
    styles.add(ParagraphStyle(name='InfoBold', fontSize=8.5, leading=12, fontName='Helvetica-Bold'))
    styles.add(ParagraphStyle(name='Footer', fontSize=7, textColor=colors.HexColor('#999'), fontName='Helvetica', alignment=TA_CENTER))
    styles.add(ParagraphStyle(name='Confidentiel', fontSize=7, textColor=colors.HexColor('#F44336'), fontName='Helvetica-Bold', alignment=TA_CENTER))

    elements = []

    employe = fiche.employe
    user = employe.user

    # ========================================
    # EN-TÊTE
    # ========================================
    logo_path = os.path.join(settings.BASE_DIR, 'static', 'images', 'logo_kamco.png')
    if os.path.exists(logo_path):
        try:
            logo = Image(logo_path, width=3.5*cm, height=2.5*cm)
            logo.hAlign = 'CENTER'
            elements.append(logo)
        except Exception:
            pass

    elements.append(Paragraph('BULLETIN DE PAIE', styles['TitreBulletin']))

    mois_noms = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
    periode = f'{mois_noms[fiche.mois]} {fiche.annee}'
    elements.append(Paragraph(f'Période : {periode}', styles['SousTitre']))
    elements.append(Paragraph(f'Référence : {fiche.reference}', styles['SousTitre']))
    elements.append(Spacer(1, 8))

    # Confidentiel
    elements.append(Paragraph('📋 DOCUMENT CONFIDENTIEL — USAGE STRICTEMENT PERSONNEL', styles['Confidentiel']))
    elements.append(Spacer(1, 10))

    # ========================================
    # EMPLOYEUR / EMPLOYÉ
    # ========================================
    info_data = [
        [
            [Paragraph('<b>EMPLOYEUR</b>', styles['InfoBold']),
             Paragraph('KAMCO TECH', styles['InfoBold']),
             Paragraph('AWAE - Yaoundé, Cameroun', styles['Info']),
             Paragraph('Tél: +237 6 97 54 20 50', styles['Info']),
             Paragraph('N° Contribuable: [À compléter]', styles['Info']),
             Paragraph('N° CNPS: [À compléter]', styles['Info'])],
            [Paragraph('<b>EMPLOYÉ</b>', styles['InfoBold']),
             Paragraph(f'{employe.nom_affiche}', styles['InfoBold']),
             Paragraph(f'Matricule: {employe.matricule}', styles['Info']),
             Paragraph(f'Poste: {employe.poste or "N/A"}', styles['Info']),
             Paragraph(f'Département: {employe.departement.nom if employe.departement else "N/A"}', styles['Info']),
             Paragraph(f'Contrat: {employe.get_type_contrat_display()}', styles['Info']),
             Paragraph(f'Date embauche: {employe.date_embauche.strftime("%d/%m/%Y") if employe.date_embauche else "N/A"}', styles['Info'])]
        ]
    ]
    info_table = Table(info_data, colWidths=[8.5*cm, 8.5*cm])
    info_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOX', (0,0), (0,0), 0.5, colors.HexColor('#e0e0e0')),
        ('BOX', (1,0), (1,0), 0.5, colors.HexColor('#e0e0e0')),
        ('PADDING', (0,0), (-1,-1), 8),
        ('BACKGROUND', (0,0), (0,0), colors.HexColor('#f8faf8')),
        ('BACKGROUND', (1,0), (1,0), colors.HexColor('#f8faf8')),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 12))

    # ========================================
    # TABLEAU RÉMUNÉRATION
    # ========================================
    elements.append(Paragraph('ÉLÉMENTS DE RÉMUNÉRATION', styles['Section']))

    # Calculs
    total_brut_primes = (
        fiche.salaire_brut + fiche.prime_transport + fiche.prime_logement +
        fiche.prime_risque + fiche.autres_primes + fiche.heures_supplementaires
    )
    total_deductions = fiche.cotisation_cnps + fiche.impot_irpp + fiche.autres_deductions

    remun_data = [
        ['DÉSIGNATION', 'BASE', 'TAUX/QTÉ', 'GAINS', 'RETENUES'],
    ]

    # Gains
    remun_data.append(['Salaire de base', '', '', f'{fiche.salaire_brut:,.0f}', ''])
    if fiche.prime_transport > 0:
        remun_data.append(['Prime de transport', '', '', f'{fiche.prime_transport:,.0f}', ''])
    if fiche.prime_logement > 0:
        remun_data.append(['Prime de logement', '', '', f'{fiche.prime_logement:,.0f}', ''])
    if fiche.prime_risque > 0:
        remun_data.append(['Prime de risque', '', '', f'{fiche.prime_risque:,.0f}', ''])
    if fiche.autres_primes > 0:
        remun_data.append(['Autres primes', '', '', f'{fiche.autres_primes:,.0f}', ''])
    if fiche.heures_supplementaires > 0:
        remun_data.append(['Heures supplémentaires', '', '', f'{fiche.heures_supplementaires:,.0f}', ''])

    # Ligne total brut
    remun_data.append(['TOTAL BRUT', '', '', f'{total_brut_primes:,.0f}', ''])

    # Retenues
    if fiche.cotisation_cnps > 0:
        taux_cnps = round(float(fiche.cotisation_cnps) / float(fiche.salaire_brut) * 100, 2) if fiche.salaire_brut > 0 else 0
        remun_data.append(['Cotisation CNPS', f'{fiche.salaire_brut:,.0f}', f'{taux_cnps}%', '', f'{fiche.cotisation_cnps:,.0f}'])
    if fiche.impot_irpp > 0:
        taux_irpp = round(float(fiche.impot_irpp) / float(fiche.salaire_brut) * 100, 2) if fiche.salaire_brut > 0 else 0
        remun_data.append(['Impôt IRPP', f'{fiche.salaire_brut:,.0f}', f'{taux_irpp}%', '', f'{fiche.impot_irpp:,.0f}'])
    if fiche.autres_deductions > 0:
        remun_data.append(['Autres déductions', '', '', '', f'{fiche.autres_deductions:,.0f}'])

    # Total retenues
    remun_data.append(['TOTAL RETENUES', '', '', '', f'{total_deductions:,.0f}'])

    col_widths = [5*cm, 3*cm, 2.5*cm, 3.5*cm, 3.5*cm]
    remun_table = Table(remun_data, colWidths=col_widths, repeatRows=1)
    remun_table.setStyle(TableStyle([
        # En-tête
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#188701')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 8),
        ('ALIGN', (0,0), (-1,0), 'CENTER'),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),

        # Corps
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,1), (-1,-1), 8.5),
        ('ALIGN', (1,1), (-1,-1), 'RIGHT'),
        ('BOTTOMPADDING', (0,1), (-1,-1), 4),
        ('TOPPADDING', (0,1), (-1,-1), 4),
        ('GRID', (0,0), (-1,-1), 0.3, colors.HexColor('#e0e0e0')),

        # Lignes totaux en gras
        *[('FONTNAME', (0,i), (-1,i), 'Helvetica-Bold')
          for i, row in enumerate(remun_data) if 'TOTAL' in str(row[0])],
        *[('BACKGROUND', (0,i), (-1,i), colors.HexColor('#f0f7f0'))
          for i, row in enumerate(remun_data) if 'TOTAL' in str(row[0])],
    ]))
    elements.append(remun_table)
    elements.append(Spacer(1, 15))

    # ========================================
    # NET À PAYER
    # ========================================
    net_data = [
        ['', '', '', 'NET À PAYER', f'{fiche.salaire_net:,.0f} FCFA']
    ]
    net_table = Table(net_data, colWidths=[3*cm, 3*cm, 3*cm, 4.5*cm, 4.5*cm])
    net_table.setStyle(TableStyle([
        ('FONTNAME', (3,0), (4,0), 'Helvetica-Bold'),
        ('FONTSIZE', (3,0), (4,0), 14),
        ('TEXTCOLOR', (3,0), (4,0), colors.HexColor('#188701')),
        ('ALIGN', (3,0), (3,0), 'RIGHT'),
        ('ALIGN', (4,0), (4,0), 'RIGHT'),
        ('LINEABOVE', (3,0), (4,0), 2, colors.HexColor('#188701')),
        ('BOTTOMPADDING', (3,0), (4,0), 10),
        ('TOPPADDING', (3,0), (4,0), 10),
    ]))
    elements.append(net_table)
    elements.append(Spacer(1, 15))

    # Mode de paiement
    statut_text = f'Statut : {fiche.get_statut_display()}'
    if fiche.payee_le:
        statut_text += f' — Payé le {fiche.payee_le.strftime("%d/%m/%Y")}'
    elements.append(Paragraph(statut_text, styles['Info']))
    elements.append(Spacer(1, 20))

    # ========================================
    # PIED DE PAGE
    # ========================================
    elements.append(Paragraph('Ce bulletin de paie doit être conservé sans limitation de durée (Article 143 du Code du Travail du Cameroun).', styles['Footer']))
    elements.append(Spacer(1, 5))
    elements.append(Paragraph(f'KAMCO TECH — AWAE, Yaoundé, Cameroun | Généré le {date.today().strftime("%d/%m/%Y")}', styles['Footer']))

    doc.build(elements)
    buffer.seek(0)
    return buffer


def generer_bulletin_moderne(fiche):
    """
    Modèle 2 : Bulletin de paie moderne international
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=1.5*cm, leftMargin=1.5*cm, topMargin=1.5*cm, bottomMargin=1.5*cm)

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='ModTitre', fontSize=16, textColor=colors.white, fontName='Helvetica-Bold', alignment=TA_CENTER))
    styles.add(ParagraphStyle(name='ModSousTitre', fontSize=10, textColor=colors.white, fontName='Helvetica', alignment=TA_CENTER))
    styles.add(ParagraphStyle(name='ModSection', fontSize=10, textColor=colors.HexColor('#188701'), fontName='Helvetica-Bold', spaceAfter=6, spaceBefore=10))
    styles.add(ParagraphStyle(name='ModInfo', fontSize=8.5, leading=12, fontName='Helvetica'))
    styles.add(ParagraphStyle(name='ModBold', fontSize=8.5, leading=12, fontName='Helvetica-Bold'))
    styles.add(ParagraphStyle(name='ModFooter', fontSize=7, textColor=colors.HexColor('#999'), fontName='Helvetica', alignment=TA_CENTER))

    elements = []
    employe = fiche.employe
    mois_noms = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']


    logo_path = os.path.join(settings.BASE_DIR, 'static', 'images', 'kamcofarm.png')
    if os.path.exists(logo_path):
        try:
            logo = Image(logo_path, width=3.5*cm, height=2.5*cm)
            logo.hAlign = 'CENTER'
            elements.append(logo)
        except Exception:
            pass


    # ========================================
    # BANNIÈRE VERTE
    # ========================================
    banner_data = [[
        Paragraph('BULLETIN DE PAIE', styles['ModTitre']),
    ], [
        Paragraph(f'{mois_noms[fiche.mois]} {fiche.annee} — Réf: {fiche.reference}', styles['ModSousTitre']),
    ]]
    banner = Table(banner_data, colWidths=[17*cm])
    banner.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#188701')),
        ('TOPPADDING', (0,0), (-1,0), 15),
        ('BOTTOMPADDING', (0,-1), (-1,-1), 15),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    elements.append(banner)
    elements.append(Spacer(1, 15))

    # ========================================
    # EMPLOYEUR + EMPLOYÉ (côte à côte)
    # ========================================
    left_info = [
        Paragraph('🏢 EMPLOYEUR', styles['ModBold']),
        Spacer(1, 4),
        Paragraph('<b>KAMCO FARM</b>', styles['ModBold']),
        Paragraph('AWAE - Yaoundé, Cameroun', styles['ModInfo']),
        Paragraph('+237 6 94 57 20 50', styles['ModInfo']),
    ]

    right_info = [
        Paragraph('👤 EMPLOYÉ', styles['ModBold']),
        Spacer(1, 4),
        Paragraph(f'<b>{employe.nom_affiche}</b>', styles['ModBold']),
        Paragraph(f'Matricule: {employe.matricule}', styles['ModInfo']),
        Paragraph(f'Poste: {employe.poste or "N/A"}', styles['ModInfo']),
        Paragraph(f'Contrat: {employe.get_type_contrat_display()}', styles['ModInfo']),
    ]

    info_table = Table([[left_info, right_info]], colWidths=[8.5*cm, 8.5*cm])
    info_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 10),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8f8f8')),
        ('ROUNDEDCORNERS', [8, 8, 8, 8]),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 15))

    # ========================================
    # GAINS
    # ========================================
    elements.append(Paragraph('📈 RÉMUNÉRATION', styles['ModSection']))

    gains_items = [
        ('Salaire de base', fiche.salaire_brut),
        ('Prime de transport', fiche.prime_transport),
        ('Prime de logement', fiche.prime_logement),
        ('Prime de risque', fiche.prime_risque),
        ('Autres primes', fiche.autres_primes),
        ('Heures supplémentaires', fiche.heures_supplementaires),
    ]

    total_brut = sum(v for _, v in gains_items)

    gains_data = [['Désignation', 'Montant (FCFA)']]
    for label, montant in gains_items:
        if montant > 0:
            gains_data.append([label, f'{montant:,.0f}'])
    gains_data.append(['TOTAL BRUT', f'{total_brut:,.0f}'])

    gains_table = Table(gains_data, colWidths=[12*cm, 5*cm])
    gains_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#E8F5E9')),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
        ('GRID', (0,0), (-1,-1), 0.3, colors.HexColor('#C8E6C9')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#C8E6C9')),
    ]))
    elements.append(gains_table)
    elements.append(Spacer(1, 10))

    # ========================================
    # RETENUES
    # ========================================
    elements.append(Paragraph('📉 RETENUES', styles['ModSection']))

    retenues_items = [
        ('Cotisation CNPS', fiche.cotisation_cnps),
        ('Impôt IRPP', fiche.impot_irpp),
        ('Autres déductions', fiche.autres_deductions),
    ]

    total_retenues = sum(v for _, v in retenues_items)

    ret_data = [['Désignation', 'Montant (FCFA)']]
    for label, montant in retenues_items:
        if montant > 0:
            ret_data.append([label, f'{montant:,.0f}'])
    ret_data.append(['TOTAL RETENUES', f'{total_retenues:,.0f}'])

    ret_table = Table(ret_data, colWidths=[12*cm, 5*cm])
    ret_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#FFEBEE')),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
        ('GRID', (0,0), (-1,-1), 0.3, colors.HexColor('#FFCDD2')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#FFCDD2')),
    ]))
    elements.append(ret_table)
    elements.append(Spacer(1, 15))

    # ========================================
    # NET À PAYER
    # ========================================
    net_data = [['', 'NET À PAYER', f'{fiche.salaire_net:,.0f} FCFA']]
    net_table = Table(net_data, colWidths=[5*cm, 6*cm, 6*cm])
    net_table.setStyle(TableStyle([
        ('BACKGROUND', (1,0), (-1,0), colors.HexColor('#188701')),
        ('TEXTCOLOR', (1,0), (-1,0), colors.white),
        ('FONTNAME', (1,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (1,0), (1,0), 14),
        ('FONTSIZE', (2,0), (2,0), 16),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
        ('ALIGN', (2,0), (2,0), 'RIGHT'),
        ('PADDING', (1,0), (-1,0), 12),
        ('ROUNDEDCORNERS', [0, 0, 8, 8]),
    ]))
    elements.append(net_table)
    elements.append(Spacer(1, 20))

    # Statut
    statut_text = f'Statut : {fiche.get_statut_display()}'
    if fiche.payee_le:
        statut_text += f' | Payé le {fiche.payee_le.strftime("%d/%m/%Y")}'
    elements.append(Paragraph(statut_text, styles['ModInfo']))
    elements.append(Spacer(1, 25))

    # ========================================
    # PIED DE PAGE
    # ========================================
    elements.append(Paragraph('Document confidentiel — À conserver sans limitation de durée', styles['ModFooter']))
    elements.append(Paragraph(f'KAMCO FARM — Yaoundé, Cameroun | Généré le {date.today().strftime("%d/%m/%Y")}', styles['ModFooter']))

    doc.build(elements)
    buffer.seek(0)
    return buffer