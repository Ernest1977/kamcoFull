from django.db import migrations


def reactiver_documents(apps, schema_editor):
    """
    Répare les documents qui avaient été créés avec est_actif=False à cause
    du bug d'upload multipart (BooleanField omis interprété comme False).
    On les réactive pour qu'ils redeviennent visibles dans le dashboard.
    """
    DocumentInterne = apps.get_model('content', 'DocumentInterne')
    DocumentInterne.objects.filter(est_actif=False).update(est_actif=True)


def noop(apps, schema_editor):
    # Migration inverse volontairement neutre : on ne veut pas re-désactiver.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('content', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(reactiver_documents, noop),
    ]
