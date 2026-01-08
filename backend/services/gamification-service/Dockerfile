# 1) Bring in the AWS Lambda Web Adapter binary
FROM public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1 AS lambda-adapter

# 2) Build stage - install dependencies
FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /build

# Install only production dependencies
COPY services/gamification-service/requirements.txt ./requirements.txt
# Create a minimal requirements file for production (exclude test dependencies)
RUN grep -v "^pytest" requirements.txt | grep -v "^moto" | grep -v "^httpx" > requirements-prod.txt && \
    pip install --no-cache-dir -r requirements-prod.txt && \
    pip install --no-cache-dir pydantic-settings[aws-secrets-manager]

# 3) Runtime image - minimal
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PORT=8080 \
    AWS_LWA_PORT=8080 \
    RUST_LOG=info \
    AWS_LWA_READINESS_CHECK_PATH=/health

WORKDIR /app

# Copy installed packages from builder (installed globally, so they're in /usr/local)
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy source code (only what's needed)
COPY services/gamification-service/app /app/app
COPY services/common /app/common

# Register the adapter as a Lambda extension
COPY --from=lambda-adapter /lambda-adapter /opt/extensions/lambda-adapter

# Ensure local packages are in PATH
ENV PATH=/root/.local/bin:$PATH

EXPOSE 8080

# Use uvicorn via python module to avoid permission issues
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1", "--log-level", "info"]

