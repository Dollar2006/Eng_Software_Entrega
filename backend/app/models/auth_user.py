from sqlalchemy import Column, Table
from sqlalchemy.dialects.postgresql import UUID

from app.db.database import Base

# Nao e tabela nossa: existe so para o SQLAlchemy resolver o
# ForeignKey("auth.users.id") do Profile, que mora no schema auth e nao esta no
# Base.metadata. Sem esta declaracao o alembic --autogenerate quebra com
# NoReferencedTableError.
#
# O include_object em alembic/env.py devolve False para tudo em auth, entao o
# Alembic nunca gera create_table nem drop_table para esta tabela.
auth_users = Table(
    "users",
    Base.metadata,
    Column("id", UUID(as_uuid=True), primary_key=True),
    schema="auth",
)