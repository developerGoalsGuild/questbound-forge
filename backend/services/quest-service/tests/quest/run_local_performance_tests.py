"""
Run Local Performance Tests for Quest Database.

This script starts local DynamoDB and runs comprehensive performance tests.
"""

import subprocess
import time
import sys
from pathlib import Path

def start_local_dynamodb():
    """Start local DynamoDB container."""
    print("Starting local DynamoDB...")
    
    # Start DynamoDB setup
    setup_script = Path(__file__).parent / "local_dynamodb_setup.py"
    
    try:
        # Run setup in background
        process = subprocess.Popen([
            sys.executable, str(setup_script)
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Wait a bit for DynamoDB to start
        print("Waiting for DynamoDB to be ready...")
        time.sleep(10)
        
        return process
        
    except Exception as e:
        print(f"Failed to start DynamoDB: {e}")
        return None

def run_performance_tests():
    """Run the performance tests."""
    print("Running performance tests...")
    
    test_script = Path(__file__).parent / "test_local_performance.py"
    
    try:
        result = subprocess.run([
            sys.executable, str(test_script)
        ], capture_output=True, text=True)
        
        print("STDOUT:")
        print(result.stdout)
        
        if result.stderr:
            print("STDERR:")
            print(result.stderr)
        
        return result.returncode == 0
        
    except Exception as e:
        print(f"Failed to run performance tests: {e}")
        return False

def main():
    """Main function."""
    print("Quest Database Local Performance Testing")
    print("=" * 50)
    
    # Start DynamoDB
    dynamodb_process = start_local_dynamodb()
    
    if not dynamodb_process:
        print("Failed to start DynamoDB. Exiting.")
        return False
    
    try:
        # Run performance tests
        success = run_performance_tests()
        
        if success:
            print("\nPerformance tests completed successfully!")
        else:
            print("\nPerformance tests failed!")
        
        return success
        
    finally:
        # Clean up DynamoDB
        print("\nCleaning up DynamoDB...")
        if dynamodb_process:
            dynamodb_process.terminate()
            dynamodb_process.wait()
        
        # Also try to stop container directly
        try:
            subprocess.run([
                "docker", "stop", "quest-test-dynamodb"
            ], capture_output=True)
            subprocess.run([
                "docker", "rm", "quest-test-dynamodb"
            ], capture_output=True)
        except:
            pass

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
