from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from io import BytesIO
from datetime import date
import os
import qrcode
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def generer_devis_pdf(devis):
    """
    Génère un PDF professionnel pour un devis (Quotation).
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

    # Styles
    styles.add(ParagraphStyle(
        name='Entreprise',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#188701'),
        fontName='Helvetica-Bold',
        alignment=TA_LEFT
    ))

    styles.add(ParagraphStyle(
        name='DevisNumero',
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

    elements = []

    # Logo & Header
    logo_path = os.path.join(settings.BASE_DIR, 'static', 'images', 'kamcofarm.png')
    left_column = []
    if os.path.exists(logo_path):
        logo = Image(logo_path, width=4 * cm, height=2.5 * cm)
        logo.hAlign = 'LEFT'
        left_column.append(logo)
    else:
        left_column.append(Paragraph('KAMCO FARM', styles['Entreprise']))

    left_column.extend([
        Spacer(1, 4),
        Paragraph('AWAE- Yaoundé, Cameroun', styles['InfoText']),
        Paragraph('📞 +237 6 94 57 20 50', styles['InfoText']),
        Paragraph('✉️ sales@kamcofarm.com', styles['InfoText']),
    ])

    right_column = [
        Paragraph('QUOTATION / DEVIS', styles['DevisNumero']),
        Paragraph(f'Ref: {devis.reference}', styles['DevisNumero']),
        Spacer(1, 10),
        Paragraph(f'Date: {devis.date_emission.strftime("%d/%m/%Y")}', styles['InfoText']),
        Paragraph(f'Valid until: {devis.date_validite.strftime("%d/%m/%Y") if devis.date_validite else "N/A"}', styles['InfoText']),
        Paragraph(f'Currency: {devis.devise}', styles['InfoText']),
    ]

    header_table = Table([[left_column, right_column]], colWidths=[9 * cm, 8 * cm])
    header_table.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('ALIGN', (1, 0), (1, 0), 'RIGHT')]))
    elements.append(header_table)

    elements.append(Spacer(1, 15))

    # Client Info
    elements.append(Paragraph('BILL TO / CLIENT :', styles['SectionTitle']))
    client_info = [
        Paragraph(f'<b>{devis.client_nom}</b>', styles['InfoBold']),
        Paragraph(devis.client_entreprise or '', styles['InfoText']),
        Paragraph(devis.client_adresse or '', styles['InfoText']),
        Paragraph(f'Email: {devis.client_email or "N/A"}', styles['InfoText']),
        Paragraph(f'Tel: {devis.client_telephone or "N/A"}', styles['InfoText']),
    ]
    for info in client_info: elements.append(info)

    elements.append(Spacer(1, 15))

    # Table
    table_data = [['Description', 'Qty', 'Unit', 'Price', 'Amount']]
    for l in devis.lignes.all():
        table_data.append([
            Paragraph(l.description, styles['InfoText']),
            f'{l.quantite:,.2f}',
            l.unite,
            f'{l.prix_unitaire:,.2f}',
            f'{l.sous_total:,.2f}'
        ])

    table = Table(table_data, colWidths=[7 * cm, 2 * cm, 2 * cm, 3 * cm, 3 * cm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#188701')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(table)

    elements.append(Spacer(1, 10))

    # Totals — on calcule le sous-total des produits seuls (hors frais)
    # afin d'afficher chaque composante de manière distincte.
    sous_total_produits = sum(float(l.sous_total) for l in devis.lignes.all())
    frais_log = float(devis.frais_logistique or 0)
    frais_insp = float(devis.frais_inspection or 0)

    totals_rows = [
        ['', '', 'Subtotal (Products):', f'{sous_total_produits:,.2f} {devis.devise}'],
    ]
    if frais_log > 0:
        totals_rows.append(['', '', 'Logistics (Warehouse>Port):', f'{frais_log:,.2f} {devis.devise}'])
    if frais_insp > 0:
        totals_rows.append(['', '', 'Inspection (SGS/Phyto):', f'{frais_insp:,.2f} {devis.devise}'])

    totals_rows.append(['', '', 'Total HT:', f'{devis.montant_ht:,.2f} {devis.devise}'])
    totals_rows.append(['', '', f'VAT ({devis.tva_pourcentage}%):', f'{devis.montant_tva:,.2f} {devis.devise}'])
    totals_rows.append(['', '', 'TOTAL TTC:', f'{devis.montant_ttc:,.2f} {devis.devise}'])

    totals_table = Table(totals_rows, colWidths=[6 * cm, 3 * cm, 4.5 * cm, 3.5 * cm])
    last_row = len(totals_rows) - 1
    totals_table.setStyle(TableStyle([
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (2, last_row), (3, last_row), 'Helvetica-Bold'),
        ('TEXTCOLOR', (2, last_row), (3, last_row), colors.HexColor('#188701')),
        ('LINEABOVE', (2, last_row), (3, last_row), 0.7, colors.HexColor('#188701')),
        ('FONTSIZE', (2, 0), (-1, -1), 9),
    ]))
    elements.append(totals_table)

    elements.append(Spacer(1, 20))

    # Additional Info
    elements.append(Paragraph('TERMS & CONDITIONS', styles['SectionTitle']))
    
    incoterm_full = dict(devis.INCOTERM_CHOICES).get(devis.incoterm, devis.incoterm)
    elements.append(Paragraph(f'<b>Incoterm:</b> {incoterm_full}', styles['InfoText']))
    
    elements.append(Paragraph(f'<b>Payment Terms:</b> {devis.conditions_paiement or "As agreed"}', styles['InfoText']))
    elements.append(Paragraph(f'<b>Delivery Time:</b> {devis.delai_livraison or "To be specified"}', styles['InfoText']))
    elements.append(Paragraph(f'<b>Port of Loading:</b> {devis.port_chargement or "Douala, Cameroun"}', styles['InfoText']))
    
    if devis.certifications:
        elements.append(Paragraph(f'<b>Certifications:</b> {devis.certifications}', styles['InfoText']))
    if devis.conditions_emballage:
        elements.append(Paragraph(f'<b>Packaging:</b> {devis.conditions_emballage}', styles['InfoText']))

    # Note: les frais (logistique / inspection) sont déjà détaillés
    # dans le tableau des totaux ci-dessus, ligne par ligne.
    
    if devis.notes:
        elements.append(Spacer(1, 10))
        elements.append(Paragraph('NOTES', styles['SectionTitle']))
        elements.append(Paragraph(devis.notes, styles['InfoText']))

    # Footer
    elements.append(Spacer(1, 30))
    
    # QR Code & Verification Info
    verification_url = f"https://kamcofarm.com/verify/devis/{devis.reference}"
    qr = qrcode.QRCode(version=1, box_size=10, border=1)
    qr.add_data(verification_url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white")
    
    qr_buffer = BytesIO()
    qr_img.save(qr_buffer)
    qr_buffer.seek(0)
    
    qr_reportlab = Image(qr_buffer, width=2.5 * cm, height=2.5 * cm)
    
    footer_data = [
        [qr_reportlab, [
            Paragraph('<b>VERIFICATION SECURE</b>', styles['InfoBold']),
            Paragraph(f'Scan to verify the authenticity of this document.', styles['InfoText']),
            Paragraph(f'URL: {verification_url}', styles['Footer']),
        ]]
    ]
    footer_table = Table(footer_data, colWidths=[3 * cm, 14 * cm])
    footer_table.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'MIDDLE')]))
    elements.append(footer_table)

    elements.append(Spacer(1, 10))
    elements.append(Paragraph('KAMCO FARM — Cultivons l\'avenir ensemble', styles['Footer']))

    # ========================================
    # SIGNATURE SECTION
    # ========================================
    elements.append(Spacer(1, 20))
    
    # On récupère la signature de celui qui a créé le devis
    signature_element = None
    manager_name = "Commercial Manager"
    
    if devis.creee_par:
        manager_name = f"{devis.creee_par.first_name} {devis.creee_par.last_name}" or devis.creee_par.username
        if devis.creee_par.signature:
            try:
                sig_path = devis.creee_par.signature.path
                if os.path.exists(sig_path):
                    signature_element = Image(sig_path, width=4 * cm, height=2 * cm)
                    signature_element.hAlign = 'RIGHT'
            except Exception as e:
                logger.warning(f"Could not load user signature: {e}")

    sig_data = [
        ['', ''], # Espace
        ['', Paragraph('<b>Authorized Signature</b>', styles['InfoBold'])],
        ['', signature_element if signature_element else Spacer(1, 2 * cm)],
        ['', Paragraph(f'<b>{manager_name}</b>', styles['InfoText'])],
        ['', Paragraph('KAMCO FARM S.A.', styles['InfoText'])]
    ]
    
    sig_table = Table(sig_data, colWidths=[10 * cm, 7 * cm])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'BOTTOM'),
    ]))
    elements.append(sig_table)

    doc.build(elements)
    buffer.seek(0)
    return buffer

