"""Vercel Python 함수 진입점 — /api/* 요청을 모두 이 FastAPI 앱이 받는다(vercel.json rewrites).

실제 코드는 backend/accio_api 에 있다. api/ 아래 .py 파일은 하나하나가 함수가 되므로 진입점 하나만 둔다.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from accio_api.main import app  # noqa: E402

__all__ = ["app"]
