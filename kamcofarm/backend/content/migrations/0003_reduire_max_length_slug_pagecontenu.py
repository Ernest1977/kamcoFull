from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('content', '0002_reactiver_documents_inactifs'),
    ]

    operations = [
        migrations.AlterField(
            model_name='pagecontenu',
            name='slug',
            field=models.SlugField(blank=True, max_length=255, unique=True),
        ),
    ]