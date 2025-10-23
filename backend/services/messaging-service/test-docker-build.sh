#!/bin/bash
# Test script to verify Docker build works locally

echo "Testing Docker build for messaging service..."

# Navigate to backend directory (build context)
cd ../..

# Build the Docker image
echo "Building Docker image..."
docker build -f services/messaging-service/Dockerfile -t messaging-service-test .

if [ $? -eq 0 ]; then
    echo "✅ Docker build successful!"
    echo "Testing container startup..."
    
    # Test container startup
    docker run --rm -d --name messaging-test -p 8000:8000 messaging-service-test
    
    # Wait a moment for startup
    sleep 5
    
    # Test health endpoint
    curl -f http://localhost:8000/health
    
    if [ $? -eq 0 ]; then
        echo "✅ Container started successfully and health check passed!"
    else
        echo "❌ Health check failed"
    fi
    
    # Cleanup
    docker stop messaging-test
    docker rmi messaging-service-test
    
else
    echo "❌ Docker build failed"
    exit 1
fi
