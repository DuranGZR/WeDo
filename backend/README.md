# WeDo Backend

FastAPI tabanlı, modüler monolith backend.

## Local geliştirme

```powershell
uv sync --dev
Copy-Item .env.example .env
uv run pytest
uv run uvicorn app.main:app --reload
```

Health endpoint: `GET /health`
