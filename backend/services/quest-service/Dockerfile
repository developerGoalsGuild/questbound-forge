# Bring in the AWS Lambda Web Adapter
FROM public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1 AS lambda-adapter


FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install pydantic-settings[aws-secrets-manager]
COPY ./ ./




# Copy the adapter binary into the Lambda extensions dir (per official docs)
COPY --from=lambda-adapter /lambda-adapter /opt/extensions/lambda-adapter

# Enable LWA and expose the HTTP server
ENV AWS_LAMBDA_EXEC_WRAPPER=/opt/bootstrap \
    AWS_LWA_PORT=8080 \
    PORT=8080 \
    RUST_LOG=info

EXPOSE 8080
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080"]