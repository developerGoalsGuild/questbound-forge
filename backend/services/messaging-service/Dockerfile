# 1) Bring in the AWS Lambda Web Adapter binary
FROM public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1 AS lambda-adapter

# 2) Your runtime image
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app
ENV PYTHONPATH=/app

COPY services/messaging-service/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir pydantic-settings[aws-secrets-manager]

# Copy source
COPY services/messaging-service/ /app/

# 3) Register the adapter as a Lambda extension (container-image style)
COPY --from=lambda-adapter /lambda-adapter /opt/extensions/lambda-adapter

# 4) LWA/Server settings
ENV PORT=8080 \
    AWS_LWA_PORT=8080 \
    RUST_LOG=info \
    AWS_LWA_READINESS_CHECK_PATH=/health
    

EXPOSE 8080

# IMPORTANT: point to the real module path for your ASGI app
# If your app is in app/main.py and the variable is `app`, use app.main:app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
