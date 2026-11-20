FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VERSION=1.8.4 \
    POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_CREATE=false

WORKDIR /app

# Install Poetry
RUN pip install --no-cache-dir "poetry==$POETRY_VERSION"

# Copy dependency files for Docker layer caching
COPY pyproject.toml poetry.lock* ./
RUN poetry install --only main --no-root

# Copy source code
COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
