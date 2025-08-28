FROM public.ecr.aws/lambda/python:3.11

# Install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY app.py ./

# Command to run the FastAPI app with AWS Lambda Runtime Interface Emulator
CMD ["app.handler"]
