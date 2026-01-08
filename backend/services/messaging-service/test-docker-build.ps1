# Test script to verify Docker build works locally

Write-Host "Testing Docker build for messaging service..." -ForegroundColor Green

# Navigate to backend directory (build context)
Set-Location ../..

try {
    # Build the Docker image
    Write-Host "Building Docker image..." -ForegroundColor Yellow
    docker build -f services/messaging-service/Dockerfile -t messaging-service-test .
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker build successful!" -ForegroundColor Green
        
        Write-Host "Testing container startup..." -ForegroundColor Yellow
        
        # Test container startup
        docker run --rm -d --name messaging-test -p 8000:8000 messaging-service-test
        
        if ($LASTEXITCODE -eq 0) {
            # Wait a moment for startup
            Start-Sleep -Seconds 5
            
            # Test health endpoint
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 10
                if ($response.StatusCode -eq 200) {
                    Write-Host "✅ Container started successfully and health check passed!" -ForegroundColor Green
                } else {
                    Write-Host "❌ Health check failed with status: $($response.StatusCode)" -ForegroundColor Red
                }
            } catch {
                Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
            }
        } else {
            Write-Host "❌ Container startup failed" -ForegroundColor Red
        }
        
        # Cleanup
        Write-Host "Cleaning up..." -ForegroundColor Yellow
        docker stop messaging-test 2>$null
        docker rmi messaging-service-test 2>$null
        
    } else {
        Write-Host "❌ Docker build failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error during testing: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    # Return to original directory
    Set-Location services/messaging-service
}
