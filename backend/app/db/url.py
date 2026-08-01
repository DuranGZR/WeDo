def sqlalchemy_database_url(database_url: str) -> str:
    """Use the installed Psycopg driver for standard PostgreSQL URLs."""
    for scheme in ("postgres://", "postgresql://"):
        if database_url.startswith(scheme):
            return f"postgresql+psycopg://{database_url.removeprefix(scheme)}"
    return database_url
