from app.config import to_asyncpg_url


def test_plain_postgres_url_is_converted():
    assert to_asyncpg_url("postgresql://u:p@h:5432/d") == "postgresql+asyncpg://u:p@h:5432/d"


def test_postgres_scheme_alias_is_converted():
    assert to_asyncpg_url("postgres://u:p@h/d") == "postgresql+asyncpg://u:p@h/d"


def test_asyncpg_url_is_unchanged():
    url = "postgresql+asyncpg://u:p@h/d"
    assert to_asyncpg_url(url) == url
