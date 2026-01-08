"""
Simple script to start local DynamoDB for testing.
"""

import subprocess
import time
import sys
from pathlib import Path

def main():
    """Start local DynamoDB."""
    print("Starting Local DynamoDB for Quest Performance Testing...")
    print("=" * 60)
    
    # Stop any existing container
    print("Stopping any existing container...")
    subprocess.run([
        "docker", "stop", "quest-test-dynamodb"
    ], capture_output=True)
    subprocess.run([
        "docker", "rm", "quest-test-dynamodb"
    ], capture_output=True)
    
    # Start new container
    print("Starting DynamoDB container...")
    cmd = [
        "docker", "run", "-d",
        "--name", "quest-test-dynamodb",
        "-p", "8000:8000",
        "amazon/dynamodb-local:latest",
        "-jar", "DynamoDBLocal.jar",
        "-sharedDb",
        "-inMemory"
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        print(f"Container started: {result.stdout.strip()}")
        
        # Wait for DynamoDB to be ready
        print("Waiting for DynamoDB to be ready...")
        time.sleep(5)
        
        # Test connection
        print("Testing DynamoDB connection...")
        test_script = Path(__file__).parent / "test_dynamodb_connection.py"
        
        if test_script.exists():
            result = subprocess.run([
                sys.executable, str(test_script)
            ], capture_output=True, text=True)
            
            if result.returncode == 0:
                print("✅ DynamoDB is ready and working!")
                print(f"Endpoint: http://localhost:8000")
                print(f"Table: gg_core_test_local")
                print("\nPress Ctrl+C to stop...")
                
                try:
                    while True:
                        time.sleep(1)
                except KeyboardInterrupt:
                    print("\nShutting down...")
                    subprocess.run([
                        "docker", "stop", "quest-test-dynamodb"
                    ], capture_output=True)
                    subprocess.run([
                        "docker", "rm", "quest-test-dynamodb"
                    ], capture_output=True)
                    print("DynamoDB stopped.")
            else:
                print("❌ DynamoDB connection test failed:")
                print(result.stdout)
                print(result.stderr)
        else:
            print("✅ DynamoDB container started!")
            print(f"Endpoint: http://localhost:8000")
            print("You can now run performance tests.")
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to start DynamoDB container: {e}")
        print(f"Error: {e.stderr}")
        return False
    
    return True

if __name__ == "__main__":
    main()
