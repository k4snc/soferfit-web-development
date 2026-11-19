from django.db import migrations


class Migration(migrations.Migration):
    """Merge the older email-index branch with the normalized-email branch."""

    dependencies = [
        ("accounts", "0002_unique_email_constraint"),
        ("accounts", "0004_normalize_user_emails"),
    ]

    operations = [
        migrations.RunSQL(
            sql="DROP INDEX IF EXISTS accounts_user_email_unique;",
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
