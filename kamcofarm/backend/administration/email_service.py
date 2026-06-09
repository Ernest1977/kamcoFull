from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import logging

logger = logging.getLogger(__name__)


# ========================================
# TEMPLATE HTML DE BASE
# ========================================
def get_base_template(titre, contenu, footer_text=None):
    """
    Génère un template HTML d'email professionnel.
    """
    if not footer_text:
        footer_text = "KAMCO FARM - Awae (Yaoudé), Cameroun"

    return f"""
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{titre}</title>
    </head>
    <body style="margin:0; padding:0; background-color:#f4f4f4; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4; padding:20px 0;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">
                        
                        <!-- HEADER -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #188701, #66BB6A); padding:30px 40px; text-align:center;">
                                <h1 style="color:#ffffff; margin:0; font-size:28px; font-weight:700;">
                                    🌱 KAMCO FARM
                                </h1>
                                <p style="color:#e8f5e9; margin:8px 0 0; font-size:14px;">
                                    Ensemble, Cultivons l'Excellence
                                </p>
                            </td>
                        </tr>
                        
                        <!-- TITRE -->
                        <tr>
                            <td style="padding:30px 40px 10px;">
                                <h2 style="color:#188701; margin:0; font-size:22px; border-bottom:3px solid #66BB6A; padding-bottom:12px;">
                                    {titre}
                                </h2>
                            </td>
                        </tr>
                        
                        <!-- CONTENU -->
                        <tr>
                            <td style="padding:20px 40px 30px;">
                                {contenu}
                            </td>
                        </tr>
                        
                        <!-- FOOTER -->
                        <tr>
                            <td style="background-color:#f8f8f8; padding:25px 40px; border-top:1px solid #e0e0e0;">
                                <table width="100%">
                                    <tr>
                                        <td style="text-align:center;">
                                            <p style="color:#757575; font-size:13px; margin:0 0 8px;">
                                                {footer_text}
                                            </p>
                                            <p style="color:#757575; font-size:12px; margin:0 0 5px;">
                                                📞 +237 699 951 406 | ✉️ admin@kamco-scoop.com
                                            </p>
                                            <p style="color:#999; font-size:11px; margin:10px 0 0;">
                                                © 2026 KAMCO FARM. Tous droits réservés.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """


# ========================================
# ENVOI EMAIL GÉNÉRIQUE
# ========================================
def envoyer_email(destinataire, sujet, contenu_html, contenu_texte=None):
    """
    Envoie un email avec version HTML et texte.
    
    Args:
        destinataire: str ou list d'adresses email
        sujet: str
        contenu_html: str HTML
        contenu_texte: str (optionnel, généré automatiquement)
    
    Returns:
        bool: True si envoyé, False sinon
    """
    if isinstance(destinataire, str):
        destinataire = [destinataire]

    if not contenu_texte:
        contenu_texte = strip_tags(contenu_html)

    try:
        email = EmailMultiAlternatives(
            subject=sujet,
            body=contenu_texte,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=destinataire
        )
        email.attach_alternative(contenu_html, "text/html")
        email.send(fail_silently=False)

        logger.info(f"Email envoyé à {destinataire}: {sujet}")
        return True

    except Exception as e:
        logger.error(f"Erreur envoi email à {destinataire}: {e}")
        return False


# ========================================
# EMAIL DE CONFIRMATION DE DEVIS
# ========================================
def envoyer_email_confirmation_devis(devis):
    """
    Envoie un email de confirmation au client après soumission d'un devis.
    """
    contenu = f"""
    <p style="color:#333; font-size:15px; line-height:1.8;">
        Cher(e) <strong>{devis.nom_contact}</strong>,
    </p>
    
    <p style="color:#333; font-size:15px; line-height:1.8;">
        Nous avons bien reçu votre demande de devis et nous vous en remercions.
        Notre équipe commerciale l'étudiera dans les plus brefs délais.
    </p>
    
    <table width="100%" style="background:#f9f9f9; border-radius:10px; padding:5px; margin:20px 0;">
        <tr>
            <td style="padding:15px 20px;">
                <h3 style="color:#188701; margin:0 0 15px;">📋 Récapitulatif de votre demande</h3>
                <table width="100%" style="font-size:14px; color:#555;">
                    <tr>
                        <td style="padding:5px 0;"><strong>Entreprise :</strong></td>
                        <td style="padding:5px 0;">{devis.nom_entreprise}</td>
                    </tr>
                    <tr>
                        <td style="padding:5px 0;"><strong>Contact :</strong></td>
                        <td style="padding:5px 0;">{devis.nom_contact}</td>
                    </tr>
                    <tr>
                        <td style="padding:5px 0;"><strong>Produits :</strong></td>
                        <td style="padding:5px 0;">{devis.produits}</td>
                    </tr>
                    <tr>
                        <td style="padding:5px 0;"><strong>Quantité :</strong></td>
                        <td style="padding:5px 0;">{devis.quantite_tonnes} tonnes</td>
                    </tr>
                    <tr>
                        <td style="padding:5px 0;"><strong>Fréquence :</strong></td>
                        <td style="padding:5px 0;">{devis.get_frequence_display()}</td>
                    </tr>
                    <tr>
                        <td style="padding:5px 0;"><strong>Destination :</strong></td>
                        <td style="padding:5px 0;">{devis.destination}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
    
    <p style="color:#333; font-size:15px; line-height:1.8;">
        Vous recevrez une réponse détaillée sous <strong>24 à 48 heures ouvrées</strong>.
    </p>
    
    <p style="color:#333; font-size:15px; line-height:1.8;">
        Pour toute question urgente, n'hésitez pas à nous contacter directement.
    </p>
    
    <p style="color:#333; font-size:15px; line-height:1.8;">
        Cordialement,<br>
        <strong style="color:#188701;">L'équipe commerciale FOSS AGRO FARM</strong>
    </p>
    """

    html = get_base_template("Confirmation de votre demande de devis", contenu)

    return envoyer_email(
        destinataire=devis.email,
        sujet="FOSS AGRO FARM - Confirmation de votre demande de devis",
        contenu_html=html
    )


# ========================================
# EMAIL DE NOTIFICATION INTERNE (NOUVEAU DEVIS)
# ========================================
def notifier_equipe_nouveau_devis(devis):
    """
    Notifie l'équipe commerciale d'un nouveau devis reçu.
    """
    contenu = f"""
    <p style="color:#333; font-size:15px; line-height:1.8;">
        Un nouveau devis a été soumis via le site web.
    </p>
    
    <table width="100%" style="background:#fff3e0; border-radius:10px; border-left:4px solid #FF6F00; margin:20px 0;">
        <tr>
            <td style="padding:15px 20px;">
                <h3 style="color:#E65100; margin:0 0 15px;">🔔 Nouveau Devis</h3>
                <table width="100%" style="font-size:14px; color:#555;">
                    <tr>
                        <td style="padding:5px 0;"><strong>Entreprise :</strong></td>
                        <td style="padding:5px 0;">{devis.nom_entreprise}</td>
                    </tr>
                    <tr>
                        <td style="padding:5px 0;"><strong>Contact :</strong></td>
                        <td style="padding:5px 0;">{devis.nom_contact}</td>
                    </tr>
                    <tr>
                        <td style="padding:5px 0;"><strong>Email :</strong></td>
                        <td style="padding:5px 0;">{devis.email}</td>
                    </tr>
                    <tr>
                        <td style="padding:5px 0;"><strong>Téléphone :</strong></td>
                        <td style="padding:5px 0;">{devis.telephone}</td>
                    </tr>
                    <tr>
                        <td style="padding:5px 0;"><strong>Produits :</strong></td>
                        <td style="padding:5px 0;">{devis.produits}</td>
                    </tr>
                    <tr>
                        <td style="padding:5px 0;"><strong>Quantité :</strong></td>
                        <td style="padding:5px 0;">{devis.quantite_tonnes} tonnes</td>
                    </tr>
                    <tr>
                        <td style="padding:5px 0;"><strong>Destination :</strong></td>
                        <td style="padding:5px 0;">{devis.destination}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
    
    <p style="text-align:center; margin:25px 0;">
        <a href="{settings.BACKEND_URL}/admin/finance/demandedevis/{devis.id}/change/"
           style="display:inline-block; background:#188701; color:#fff; padding:12px 30px; border-radius:25px; text-decoration:none; font-weight:600;">
            Voir dans l'Admin →
        </a>
    </p>
    """

    html = get_base_template("Nouveau devis reçu", contenu)

    return envoyer_email(
        destinataire=settings.CONTACT_EMAIL,
        sujet=f"[NOUVEAU DEVIS] {devis.nom_entreprise} - {devis.quantite_tonnes}T",
        contenu_html=html
    )


# ========================================
# EMAIL DE NOTIFICATION UTILISATEUR
# ========================================
def envoyer_email_notification(notification):
    """
    Envoie un email pour une notification importante.
    """
    type_icons = {
        'INFO': 'ℹ️',
        'SUCCESS': '✅',
        'WARNING': '⚠️',
        'ERROR': '❌',
        'TACHE': '📋',
    }

    type_colors = {
        'INFO': '#2196F3',
        'SUCCESS': '#4CAF50',
        'WARNING': '#FF9800',
        'ERROR': '#F44336',
        'TACHE': '#9C27B0',
    }

    icon = type_icons.get(notification.type_notification, 'ℹ️')
    color = type_colors.get(notification.type_notification, '#2196F3')

    lien_html = ""
    if notification.lien_url:
        lien_html = f"""
        <p style="text-align:center; margin:25px 0;">
            <a href="{notification.lien_url}"
               style="display:inline-block; background:{color}; color:#fff; padding:12px 30px; border-radius:25px; text-decoration:none; font-weight:600;">
                Voir les détails →
            </a>
        </p>
        """

    contenu = f"""
    <table width="100%" style="background:#f9f9f9; border-radius:10px; border-left:4px solid {color}; margin:20px 0;">
        <tr>
            <td style="padding:20px;">
                <p style="font-size:16px; margin:0 0 10px;">
                    {icon} <strong>{notification.titre}</strong>
                </p>
                <p style="color:#555; font-size:14px; line-height:1.8; margin:0;">
                    {notification.message}
                </p>
            </td>
        </tr>
    </table>
    
    {lien_html}
    
    <p style="color:#999; font-size:12px; margin-top:20px;">
        Priorité : {notification.get_priorite_display()}
    </p>
    """

    html = get_base_template(f"Notification : {notification.titre}", contenu)

    return envoyer_email(
        destinataire=notification.destinataire.email,
        sujet=f"[FOSS AGRO FARM] {notification.titre}",
        contenu_html=html
    )


# ========================================
# EMAIL DE BIENVENUE NEWSLETTER
# ========================================
def envoyer_email_bienvenue_newsletter(abonne):
    """
    Email de bienvenue après inscription à la newsletter.
    """
    lien_desinscription = f"{settings.FRONTEND_URL}/newsletter-unsubscribe.html?token={abonne.token_desinscription}"

    contenu = f"""
    <p style="color:#333; font-size:15px; line-height:1.8;">
        Cher(e) <strong>{abonne.nom or 'abonné(e)'}</strong>,
    </p>
    
    <p style="color:#333; font-size:15px; line-height:1.8;">
        Merci de vous être inscrit(e) à la newsletter de <strong>FOSS AGRO FARM</strong> ! 🎉
    </p>
    
    <p style="color:#333; font-size:15px; line-height:1.8;">
        Vous recevrez régulièrement :
    </p>
    
    <table width="100%" style="margin:15px 0;">
        <tr>
            <td style="padding:8px 15px; font-size:14px; color:#333;">🌱 Nos dernières actualités agricoles</td>
        </tr>
        <tr>
            <td style="padding:8px 15px; font-size:14px; color:#333;">🍍 Les nouveaux produits disponibles</td>
        </tr>
        <tr>
            <td style="padding:8px 15px; font-size:14px; color:#333;">💰 Les offres et promotions exclusives</td>
        </tr>
        <tr>
            <td style="padding:8px 15px; font-size:14px; color:#333;">📊 Les tendances du marché agricole</td>
        </tr>
    </table>
    
    <p style="text-align:center; margin:30px 0;">
        <a href="{settings.FRONTEND_URL}"
           style="display:inline-block; background:#188701; color:#fff; padding:14px 35px; border-radius:25px; text-decoration:none; font-weight:600; font-size:15px;">
            Visiter notre site →
        </a>
    </p>
    
    <p style="color:#999; font-size:12px; margin-top:30px; text-align:center;">
        <a href="{lien_desinscription}" style="color:#999;">Se désinscrire de la newsletter</a>
    </p>
    """

    html = get_base_template("Bienvenue dans la newsletter FOSS AGRO FARM !", contenu)

    return envoyer_email(
        destinataire=abonne.email,
        sujet="Bienvenue dans la newsletter FOSS AGRO FARM ! 🌱",
        contenu_html=html
    )


# ========================================
# EMAIL DE NEWSLETTER (ENVOI EN MASSE)
# ========================================
def envoyer_newsletter(sujet, contenu_editorial, abonnes_queryset=None):
    """
    Envoie une newsletter à tous les abonnés actifs.
    
    Args:
        sujet: str
        contenu_editorial: str HTML du contenu éditorial
        abonnes_queryset: QuerySet (optionnel, sinon tous les actifs)
    
    Returns:
        dict avec statistiques d'envoi
    """
    from marketing.models import AbonneNewsletter

    if abonnes_queryset is None:
        abonnes_queryset = AbonneNewsletter.objects.filter(est_actif=True)

    total = abonnes_queryset.count()
    envoyes = 0
    erreurs = 0

    for abonne in abonnes_queryset:
        lien_desinscription = f"{settings.FRONTEND_URL}/newsletter-unsubscribe.html?token={abonne.token_desinscription}"

        contenu_personnalise = f"""
        <p style="color:#333; font-size:15px; line-height:1.8;">
            Bonjour <strong>{abonne.nom or 'cher(e) abonné(e)'}</strong>,
        </p>
        
        {contenu_editorial}
        
        <hr style="border:none; border-top:1px solid #eee; margin:30px 0;">
        
        <p style="text-align:center; margin:20px 0;">
            <a href="{settings.FRONTEND_URL}"
               style="display:inline-block; background:#188701; color:#fff; padding:12px 30px; border-radius:25px; text-decoration:none; font-weight:600;">
                Visiter notre site →
            </a>
        </p>
        
        <p style="color:#999; font-size:11px; margin-top:25px; text-align:center;">
            Vous recevez cet email car vous êtes inscrit(e) à la newsletter FOSS AGRO FARM.<br>
            <a href="{lien_desinscription}" style="color:#999;">Se désinscrire</a>
        </p>
        """

        html = get_base_template(sujet, contenu_personnalise)

        success = envoyer_email(
            destinataire=abonne.email,
            sujet=f"[Newsletter] {sujet}",
            contenu_html=html
        )

        if success:
            envoyes += 1
        else:
            erreurs += 1

    return {
        'total': total,
        'envoyes': envoyes,
        'erreurs': erreurs
    }


# ========================================
# EMAIL CONGÉ APPROUVÉ / REFUSÉ
# ========================================
def envoyer_email_decision_conge(conge):
    """
    Envoie un email à l'employé pour l'informer de la décision sur son congé.
    """
    statut_colors = {
        'APPROUVE': '#4CAF50',
        'REFUSE': '#F44336',
    }

    statut_icons = {
        'APPROUVE': '✅',
        'REFUSE': '❌',
    }

    color = statut_colors.get(conge.statut, '#2196F3')
    icon = statut_icons.get(conge.statut, 'ℹ️')

    commentaire_html = ""
    if conge.commentaire_decision:
        commentaire_html = f"""
        <table width="100%" style="background:#f9f9f9; border-radius:8px; margin:15px 0;">
            <tr>
                <td style="padding:15px;">
                    <p style="color:#555; font-size:14px; margin:0;">
                        <strong>Commentaire :</strong> {conge.commentaire_decision}
                    </p>
                </td>
            </tr>
        </table>
        """

    contenu = f"""
    <p style="color:#333; font-size:15px; line-height:1.8;">
        Cher(e) <strong>{conge.employe.user.get_full_name() or conge.employe.user.username}</strong>,
    </p>
    
    <table width="100%" style="border-radius:10px; border-left:4px solid {color}; background:#f9f9f9; margin:20px 0;">
        <tr>
            <td style="padding:20px;">
                <p style="font-size:16px; margin:0 0 15px;">
                    {icon} Votre demande de congé a été <strong style="color:{color};">{conge.get_statut_display()}</strong>
                </p>
                <table width="100%" style="font-size:14px; color:#555;">
                    <tr>
                        <td style="padding:5px 0;"><strong>Type :</strong></td>
                        <td style="padding:5px 0;">{conge.get_type_conge_display()}</td>
                    </tr>
                    <tr>
                        <td style="padding:5px 0;"><strong>Période :</strong></td>
                        <td style="padding:5px 0;">Du {conge.date_debut.strftime('%d/%m/%Y')} au {conge.date_fin.strftime('%d/%m/%Y')}</td>
                    </tr>
                    <tr>
                        <td style="padding:5px 0;"><strong>Durée :</strong></td>
                        <td style="padding:5px 0;">{conge.nombre_jours} jour(s)</td>
                    </tr>
                    <tr>
                        <td style="padding:5px 0;"><strong>Décision par :</strong></td>
                        <td style="padding:5px 0;">{conge.approuve_par.get_full_name() if conge.approuve_par else 'N/A'}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
    
    {commentaire_html}
    
    <p style="color:#333; font-size:15px; line-height:1.8;">
        Cordialement,<br>
        <strong style="color:#188701;">Service des Ressources Humaines</strong>
    </p>
    """

    html = get_base_template(f"Demande de congé {conge.get_statut_display()}", contenu)

    return envoyer_email(
        destinataire=conge.employe.user.email,
        sujet=f"[FOSS AGRO FARM] Congé {conge.get_statut_display()} - {conge.get_type_conge_display()}",
        contenu_html=html
    )


# ========================================
# EMAIL FACTURE
# ========================================
def envoyer_email_facture(facture):
    """
    Envoie la facture par email au client.
    """
    lignes_html = ""
    for ligne in facture.lignes.all():
        lignes_html += f"""
        <tr>
            <td style="padding:8px 10px; border-bottom:1px solid #eee; font-size:13px;">{ligne.description}</td>
            <td style="padding:8px 10px; border-bottom:1px solid #eee; font-size:13px; text-align:center;">{ligne.quantite} {ligne.unite}</td>
            <td style="padding:8px 10px; border-bottom:1px solid #eee; font-size:13px; text-align:right;">{ligne.prix_unitaire:,.0f}</td>
            <td style="padding:8px 10px; border-bottom:1px solid #eee; font-size:13px; text-align:right;">{ligne.sous_total:,.0f}</td>
        </tr>
        """

    contenu = f"""
    <p style="color:#333; font-size:15px; line-height:1.8;">
        Cher(e) <strong>{facture.client_nom}</strong>,
    </p>
    
    <p style="color:#333; font-size:15px; line-height:1.8;">
        Veuillez trouver ci-dessous les détails de votre facture.
    </p>
    
    <table width="100%" style="background:#f0f7f0; border-radius:10px; margin:20px 0;">
        <tr>
            <td style="padding:20px;">
                <table width="100%" style="font-size:14px;">
                    <tr>
                        <td><strong>Facture N° :</strong></td>
                        <td style="text-align:right; color:#188701; font-weight:bold; font-size:16px;">{facture.numero}</td>
                    </tr>
                    <tr>
                        <td><strong>Date d'émission :</strong></td>
                        <td style="text-align:right;">{facture.date_emission.strftime('%d/%m/%Y')}</td>
                    </tr>
                    <tr>
                        <td><strong>Date d'échéance :</strong></td>
                        <td style="text-align:right; color:#E65100;">{facture.date_echeance.strftime('%d/%m/%Y')}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
    
    <table width="100%" style="border-collapse:collapse; margin:20px 0;">
        <thead>
            <tr style="background:#188701; color:white;">
                <th style="padding:10px; text-align:left; font-size:13px;">Description</th>
                <th style="padding:10px; text-align:center; font-size:13px;">Quantité</th>
                <th style="padding:10px; text-align:right; font-size:13px;">Prix unit.</th>
                <th style="padding:10px; text-align:right; font-size:13px;">Sous-total</th>
            </tr>
        </thead>
        <tbody>
            {lignes_html}
        </tbody>
    </table>
    
    <table width="100%" style="margin:20px 0;">
        <tr>
            <td style="text-align:right; padding:5px 10px; font-size:14px;">
                <strong>Montant HT :</strong> {facture.montant_ht:,.0f} {facture.devise}
            </td>
        </tr>
        <tr>
            <td style="text-align:right; padding:5px 10px; font-size:14px;">
                <strong>TVA ({facture.tva_pourcentage}%) :</strong> {facture.montant_tva:,.0f} {facture.devise}
            </td>
        </tr>
        <tr>
            <td style="text-align:right; padding:8px 10px; font-size:18px; color:#188701; border-top:2px solid #188701;">
                <strong>Total TTC : {facture.montant_ttc:,.0f} {facture.devise}</strong>
            </td>
        </tr>
    </table>
    
    <p style="color:#333; font-size:14px; line-height:1.8; margin-top:25px;">
        <strong>Conditions de paiement :</strong><br>
        {facture.conditions_paiement or 'Paiement à réception de facture.'}
    </p>
    
    <p style="color:#333; font-size:15px; line-height:1.8; margin-top:20px;">
        Cordialement,<br>
        <strong style="color:#188701;">Service Comptabilité - FOSS AGRO FARM</strong>
    </p>
    """

    html = get_base_template(f"Facture {facture.numero}", contenu)

    return envoyer_email(
        destinataire=facture.client_email,
        sujet=f"[FOSS AGRO FARM] Facture {facture.numero} - {facture.montant_ttc:,.0f} {facture.devise}",
        contenu_html=html
    )


# ========================================
# EMAIL TÂCHE ASSIGNÉE
# ========================================
def envoyer_email_tache_assignee(tache, expediteur=None):
    """
    Notifie un employé qu'une tâche lui a été assignée.
    """
    priorite_colors = {
        'BASSE': '#4CAF50',
        'NORMALE': '#2196F3',
        'HAUTE': '#FF9800',
        'URGENTE': '#F44336',
    }

    color = priorite_colors.get(tache.priorite, '#2196F3')

    echeance_html = ""
    if tache.date_echeance:
        echeance_html = f"""
        <tr>
            <td style="padding:5px 0;"><strong>Échéance :</strong></td>
            <td style="padding:5px 0; color:#E65100;">{tache.date_echeance.strftime('%d/%m/%Y')}</td>
        </tr>
        """

    contenu = f"""
    <p style="color:#333; font-size:15px; line-height:1.8;">
        Bonjour <strong>{tache.assignee_a.get_full_name() or tache.assignee_a.username}</strong>,
    </p>
    
    <p style="color:#333; font-size:15px; line-height:1.8;">
        Une nouvelle tâche vous a été assignée{' par ' + expediteur.username if expediteur else ''}.
    </p>
    
    <table width="100%" style="border-radius:10px; border-left:4px solid {color}; background:#f9f9f9; margin:20px 0;">
        <tr>
            <td style="padding:20px;">
                <h3 style="color:{color}; margin:0 0 15px;">📋 {tache.titre}</h3>
                <table width="100%" style="font-size:14px; color:#555;">
                    <tr>
                        <td style="padding:5px 0;"><strong>Priorité :</strong></td>
                        <td style="padding:5px 0;">
                            <span style="background:{color}; color:white; padding:3px 10px; border-radius:12px; font-size:12px;">
                                {tache.get_priorite_display()}
                            </span>
                        </td>
                    </tr>
                    {echeance_html}
                </table>
                <p style="color:#555; margin:15px 0 0; font-size:14px; line-height:1.6;">
                    {tache.description or 'Pas de description détaillée.'}
                </p>
            </td>
        </tr>
    </table>
    """

    html = get_base_template(f"Nouvelle tâche : {tache.titre}", contenu)

    if tache.assignee_a and tache.assignee_a.email:
        return envoyer_email(
            destinataire=tache.assignee_a.email,
            sujet=f"[TÂCHE] {tache.titre} - Priorité {tache.get_priorite_display()}",
            contenu_html=html
        )
    return False
# ========================================
# NOTIFICATION ACCEPTATION DEVIS
# ========================================
def notifier_acceptation_devis(devis, reference_commande):
    """
    Notifie l'équipe de la validation en ligne d'un devis par un client.
    """
    contenu = f"""
    <p style="color:#333; font-size:15px; line-height:1.8;">
        Bonne nouvelle ! Un client vient d'accepter une proposition commerciale en ligne.
    </p>
    
    <table width="100%" style="background:#e8f5e9; border-radius:10px; border-left:4px solid #2e7d32; margin:20px 0;">
        <tr>
            <td style="padding:20px;">
                <h3 style="color:#2e7d32; margin:0 0 15px;">✅ Devis Accepté</h3>
                <table width="100%" style="font-size:14px; color:#555;">
                    <tr>
                        <td style="padding:5px 0;"><strong>Client :</strong></td>
                        <td style="padding:5px 0;">{devis.client_nom}</td>
                    </tr>
                    <tr>
                        <td style="padding:5px 0;"><strong>Entreprise :</strong></td>
                        <td style="padding:5px 0;">{devis.client_entreprise or 'N/A'}</td>
                    </tr>
                    <tr>
                        <td style="padding:5px 0;"><strong>Réf. Devis :</strong></td>
                        <td style="padding:5px 0;">{devis.reference}</td>
                    </tr>
                    <tr>
                        <td style="padding:5px 0;"><strong>Réf. Commande :</strong></td>
                        <td style="padding:5px 0; color:#188701; font-weight:bold;">{reference_commande}</td>
                    </tr>
                    <tr>
                        <td style="padding:5px 0;"><strong>Montant :</strong></td>
                        <td style="padding:5px 0;">{devis.montant_ttc:,.0f} {devis.devise}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
    
    <p style="color:#333; font-size:15px; line-height:1.8;">
        La commande a été générée automatiquement dans le système. Veuillez vérifier les détails logistiques pour lancer la préparation.
    </p>
    """

    html = get_base_template("Acceptation de Devis en Ligne", contenu)

    return envoyer_email(
        destinataire="infoclients@kamcofarm.com",
        sujet=f"[ACTION REQUISE] Devis {devis.reference} accepté par {devis.client_nom}",
        contenu_html=html
    )
