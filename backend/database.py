from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# In production (Render), set DATABASE_URL env var to a Postgres URL.
# Falls back to local SQLite for development.
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./emotion_system.db"
)

# SQLite needs check_same_thread; Postgres does not
connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
