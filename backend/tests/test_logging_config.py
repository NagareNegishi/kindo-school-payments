import logging

from app.logging_config import configure_logging


def bare_root(monkeypatch) -> logging.Logger:
    """Root logger with no handlers, as under uvicorn; pytest's own are put back after."""
    root = logging.getLogger()
    monkeypatch.setattr(root, "handlers", [])
    monkeypatch.setattr(root, "level", logging.WARNING)
    return root


def test_info_lines_go_to_stdout(monkeypatch, capsys):
    bare_root(monkeypatch)
    configure_logging()
    logging.getLogger("app.services.payment").info("payment attempt 1: success")

    assert "payment attempt 1: success" in capsys.readouterr().out


def test_info_is_enabled_when_the_server_already_set_a_handler(monkeypatch):
    root = bare_root(monkeypatch)
    root.addHandler(logging.NullHandler())

    configure_logging()

    assert root.level == logging.INFO


def test_calling_twice_adds_one_handler(monkeypatch):
    root = bare_root(monkeypatch)
    configure_logging()
    configure_logging()

    assert len(root.handlers) == 1
