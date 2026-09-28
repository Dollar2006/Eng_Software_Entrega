import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL não encontrada no .env")

print(f"Tentando conectar...")

try:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

    with engine.connect() as conn:
        result = conn.execute(text("SELECT version();"))
        version = result.fetchone()[0]
        print("✅ Conexão bem-sucedida!")
        print(f"Postgres version: {version}")

        result = conn.execute(text("SELECT now();"))
        timestamp = result.fetchone()[0]
        print(f"Horário do servidor: {timestamp}")

except Exception as e:
    print("❌ Falha na conexão")
    print(f"Erro: {e}")