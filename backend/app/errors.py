"""One error shape, `{ code, message, field }`, for every error the API returns."""

import logging
from http import HTTPStatus

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)


def error_body(code: str, message: str, field: str | None = None) -> dict:
    return {"code": code, "message": message, "field": field}


def api_error(status_code: int, code: str, message: str, field: str | None = None) -> HTTPException:
    """Build an HTTPException that the handler below renders in the shared shape."""
    return HTTPException(status_code, detail=error_body(code, message, field))


async def handle_validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
    # Report the first error only, and never its `input`: it can hold card data.
    first = exc.errors()[0]
    field = next((str(p) for p in reversed(first["loc"]) if isinstance(p, str)), None)
    if field == "body":
        field = None
    logger.warning("validation error on %s: %s (%s)", request.url.path, first["type"], field)
    return JSONResponse(error_body(first["type"], first["msg"], field), status_code=422)


async def handle_http_exception(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    detail = exc.detail
    if isinstance(detail, dict) and {"code", "message", "field"} <= detail.keys():
        body = error_body(detail["code"], detail["message"], detail["field"])
    else:
        phrase = HTTPStatus(exc.status_code).phrase
        body = error_body(phrase.lower().replace(" ", "_"), str(detail))
    logger.warning("http %s on %s: %s", exc.status_code, request.url.path, body["code"])
    return JSONResponse(body, status_code=exc.status_code, headers=exc.headers)


async def handle_unhandled(request: Request, exc: Exception) -> JSONResponse:
    logger.error("unhandled error on %s", request.url.path, exc_info=exc)
    return JSONResponse(
        error_body("internal_error", "Something went wrong. Please try again."), status_code=500
    )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(RequestValidationError, handle_validation_error)
    app.add_exception_handler(StarletteHTTPException, handle_http_exception)
    app.add_exception_handler(Exception, handle_unhandled)
