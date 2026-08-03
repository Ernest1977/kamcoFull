from django.db import migrations


def seed_roles(apps, schema_editor):
    """
    Amorce le catalogue avec les 8 rôles déjà existants dans l'ERP
    (ceux définis dans User.ROLE_CHOICES). Aucune donnée existante n'est
    détruite : on utilise get_or_create sur le code.
    """
    Role = apps.get_model('accounts', 'Role')
    roles = [
        {'code': 'ADMIN', 'nom': 'Administrateur', 'description': 'Accès complet à tout le système.',
         'couleur': '#dc3545', 'permissions': ['admin', 'direction', 'finance', 'rh', 'logistique', 'commercial', 'marketing'], 'ordre': 1},
        {'code': 'DIR', 'nom': 'Directeur Général', 'description': "Direction générale de l'entreprise.",
         'couleur': '#6f42c1', 'permissions': ['admin', 'direction', 'finance', 'rh', 'logistique', 'commercial', 'marketing'], 'ordre': 2},
        {'code': 'RH', 'nom': 'Ressources Humaines', 'description': 'Gestion des employés, congés et paie.',
         'couleur': '#fd7e14', 'permissions': ['rh'], 'ordre': 3},
        {'code': 'COMPTA', 'nom': 'Comptable', 'description': 'Gestion financière et comptable.',
         'couleur': '#198754', 'permissions': ['finance'], 'ordre': 4},
        {'code': 'COMM', 'nom': 'Commercial', 'description': 'Vente, commercial et marketing.',
         'couleur': '#0d6efd', 'permissions': ['commercial', 'marketing'], 'ordre': 5},
        {'code': 'LOG', 'nom': 'Logistique', 'description': 'Supply chain, équipements et location.',
         'couleur': '#0dcaf0', 'permissions': ['logistique'], 'ordre': 6},
        {'code': 'AGRI', 'nom': 'Agent terrain', 'description': 'Agent terrain / Agriculteur.',
         'couleur': '#20c997', 'permissions': [], 'ordre': 7},
        {'code': 'VISITOR', 'nom': 'Visiteur', 'description': 'Accès en lecture seule.',
         'couleur': '#6c757d', 'permissions': [], 'ordre': 8},
    ]
    for r in roles:
        Role.objects.get_or_create(code=r['code'], defaults=r)


def remove_roles(apps, schema_editor):
    Role = apps.get_model('accounts', 'Role')
    Role.objects.filter(
        code__in=['ADMIN', 'DIR', 'RH', 'COMPTA', 'COMM', 'LOG', 'AGRI', 'VISITOR']
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_role'),
    ]

    operations = [
        migrations.RunPython(seed_roles, remove_roles),
    ]
