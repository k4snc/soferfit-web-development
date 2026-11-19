from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0001_initial'),
    ]
    operations = [
        migrations.RunSQL(
            sql="""
                CREATE UNIQUE INDEX IF NOT EXISTS accounts_user_email_unique ON auth_user (LOWER(email));
            """,
            reverse_sql="""
                DROP INDEX IF EXISTS accounts_user_email_unique;
            """,
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='user',
            field=models.OneToOneField(on_delete=models.deletion.CASCADE, related_name='profile', to='auth.User'),
        ),
    ]
