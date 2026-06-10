
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_alter_user_role'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='signature',
            field=models.ImageField(blank=True, help_text='Signature numérisée (fond transparent recommandé)', null=True, upload_to='signatures/'),
        ),
    ]
