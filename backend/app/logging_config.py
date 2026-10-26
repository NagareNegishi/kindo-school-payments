"""Sends application logs at INFO and above to stdout."""

import logging
import sys


def configure_logging() -> None:
    """Log at INFO and above; add a stdout handler unless the root logger already has one."""
    logging.basicConfig(
        stream=sys.stdout,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    # basicConfig does nothing when a server such as `fastapi dev` set a handler first,
    # so the level is set on its own.
    logging.getLogger().setLevel(logging.INFO)
