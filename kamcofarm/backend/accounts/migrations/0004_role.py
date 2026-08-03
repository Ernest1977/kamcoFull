from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_user_signature'),
    ]

    operations = [
        migrations.CreateModel(
            name='Role',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(max_length=20, unique=True)),
                ('nom', models.CharField(max_length=100)),
                ('description', models.TextField(blank=True, null=True)),
                ('couleur', models.CharField(default='#188701', max_length=20)),
                ('permissions', models.JSONField(blank=True, default=list)),
                ('est_actif', models.BooleanField(default=True)),
                ('ordre', models.PositiveIntegerField(default=0)),
                ('date_creation', models.DateTimeField(auto_now_add=True)),
                ('date_modification', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Rôle',
                'verbose_name_plural': 'Rôles',
                'ordering': ['ordre', 'nom'],
            },
        ),
    ]
