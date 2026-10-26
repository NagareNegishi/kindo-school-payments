"""Sends application logs at INFO and above to stdout."""

import logging
import sys


def configure_logging() -> None:
    """Attach a stdout handler to the root logger; a no-op if one is already set."""
    logging.basicConfig(
        level=logging.INFO,
        stream=sys.stdout,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
