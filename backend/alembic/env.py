from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context

from app.config import settings
from app.db.database import Base
from app.models.auth_user import auth_users  # noqa: F401
from app.models.game import Game  # noqa: F401
from app.models.profile import Profile  # noqa: F401
from app.models.review import Review  # noqa: F401

config = context.config

config.set_main_option("sqlalchemy.url", settings.database_url.replace("%", "%%"))

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def include_object(object, name, type_, reflected, compare_to):
    """Mantem o Alembic longe das tabelas do Supabase.

    auth.users esta declarada em Base.metadata so para o SQLAlchemy resolver a FK
    do Profile. Sem este filtro o --autogenerate emitiria create_table para ela.
    include_schemas nao resolve o problema: o schema refletido vive no metadata de
    comparacao do Alembic, que e outro objeto, e ainda arrastaria storage, vault,
    realtime e extensions junto.
    """
    if type_ == "table" and getattr(object, "schema", None) == "auth":
        return False
    return True


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_object=include_object,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            include_object=include_object,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()