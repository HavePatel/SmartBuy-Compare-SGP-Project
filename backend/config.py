import os


class Config:
    # Flask sessions need a secret key; in production set this via env var
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-me")

    GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")

    # SQLite (current step) / PostgreSQL (later)
    # - For now we default to the same `smartbuy.db` your existing code uses.
    # - Later, set DATABASE_URL to switch to PostgreSQL without changing code.
    REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    SQLITE_DB_PATH = os.environ.get("SQLITE_DB_PATH", os.path.join(REPO_ROOT, "smartbuy.db"))

    # Example PostgreSQL URL (SQLAlchemy format):
    # postgresql+psycopg2://user:pass@127.0.0.1:5432/smartbuy_compare
    SQLALCHEMY_DATABASE_URI = (
        os.environ.get("DATABASE_URL")
        or os.environ.get("SQLALCHEMY_DATABASE_URI")
        or f"sqlite:///{SQLITE_DB_PATH}"
    )

    # Avoid overhead / warning
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # SQLite needs this in many Flask deployments, but PostgreSQL rejects it
    if SQLALCHEMY_DATABASE_URI.startswith("sqlite"):
        SQLALCHEMY_ENGINE_OPTIONS = {"connect_args": {"check_same_thread": False}}
    else:
        SQLALCHEMY_ENGINE_OPTIONS = {}


def validate_config(cfg: type[Config]) -> None:
    if not cfg.SQLALCHEMY_DATABASE_URI:
        raise RuntimeError(
            "Missing DATABASE_URL. Set it in your environment "
            "(see backend/env.example)."
        )
