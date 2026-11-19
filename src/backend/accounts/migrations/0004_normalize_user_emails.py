from django.conf import settings
from django.db import migrations


EMAIL_CONSTRAINT_NAME = "auth_user_email_ci_unique"


def normalize_emails_and_add_constraint(apps, schema_editor):
    app_label, model_name = settings.AUTH_USER_MODEL.split(".")
    User = apps.get_model(app_label, model_name)
    database = schema_editor.connection.alias

    normalized_emails = {}
    user_emails = list(
        User.objects.using(database)
        .exclude(email="")
        .values_list("pk", "email")
    )
    for user_id, email in user_emails:
        normalized_email = email.strip().lower()
        if normalized_email:
            normalized_emails.setdefault(normalized_email, []).append(user_id)

    duplicates = {
        email: user_ids
        for email, user_ids in normalized_emails.items()
        if len(user_ids) > 1
    }
    if duplicates:
        duplicate_user_ids = sorted(
            user_id for user_ids in duplicates.values() for user_id in user_ids
        )
        raise RuntimeError(
            "Cannot add case-insensitive unique email protection while duplicate "
            f"addresses exist. Resolve accounts with IDs: {duplicate_user_ids}"
        )

    for user_id, email in user_emails:
        normalized_email = email.strip().lower()
        if normalized_email != email:
            User.objects.using(database).filter(pk=user_id).update(
                email=normalized_email
            )

    table_name = schema_editor.quote_name(User._meta.db_table)
    email_column = schema_editor.quote_name(User._meta.get_field("email").column)
    constraint_name = schema_editor.quote_name(EMAIL_CONSTRAINT_NAME)
    schema_editor.execute(
        f"CREATE UNIQUE INDEX {constraint_name} "
        f"ON {table_name} (LOWER({email_column})) "
        f"WHERE {email_column} <> ''"
    )


def remove_email_constraint(apps, schema_editor):
    app_label, model_name = settings.AUTH_USER_MODEL.split(".")
    User = apps.get_model(app_label, model_name)
    constraint_name = schema_editor.quote_name(EMAIL_CONSTRAINT_NAME)
    schema_editor.execute(f"DROP INDEX {constraint_name}")


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0003_fitnessprofile_activity_level_and_more"),
        ("auth", "0012_alter_user_first_name_max_length"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RunPython(
            normalize_emails_and_add_constraint,
            remove_email_constraint,
        ),
    ]
