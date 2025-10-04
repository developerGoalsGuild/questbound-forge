#!/usr/bin/env python3
"""
Quest Test Runner.

This script runs all Quest tests with comprehensive reporting and coverage analysis.
"""

import sys
import os
import subprocess
import time
import requests
import json
from pathlib import Path
from typing import List, Dict, Any, Optional

# Add the quest-service directory to Python path
quest_service_dir = Path(__file__).resolve().parents[2]
if str(quest_service_dir) not in sys.path:
    sys.path.insert(0, str(quest_service_dir))

from test_data_manager import test_data_manager


class QuestTestRunner:
    """Test runner for Quest functionality."""
    
    def __init__(self):
        self.test_dir = Path(__file__).parent
        self.quest_service_dir = quest_service_dir
        self.results = {}
        self.start_time = None
        self.end_time = None
        self.auth_token = None
        self.api_url = None
        self.api_key = None
    
    def setup_authentication(self) -> bool:
        """Set up authentication for tests."""
        print("Setting up authentication...")
        
        # Get environment variables
        self.api_url = os.getenv("VITE_API_GATEWAY_URL")
        self.api_key = os.getenv("VITE_API_GATEWAY_KEY")
        username = os.getenv("GOALSGUILD_USER")
        password = os.getenv("GOALSGUILD_PASSWORD")
        
        if not all([self.api_url, self.api_key, username, password]):
            print("Missing required environment variables:")
            print(f"   VITE_API_GATEWAY_URL: {'OK' if self.api_url else 'MISSING'}")
            print(f"   VITE_API_GATEWAY_KEY: {'OK' if self.api_key else 'MISSING'}")
            print(f"   GOALSGUILD_USER: {'OK' if username else 'MISSING'}")
            print(f"   GOALSGUILD_PASSWORD: {'OK' if password else 'MISSING'}")
            return False
        
        # Login to get token
        login_url = f"{self.api_url}/v1/users/login"
        login_data = {
            "email": username,
            "password": password
        }
        
        headers = {
            "Content-Type": "application/json",
            "x-api-key": self.api_key
        }
        
        try:
            response = requests.post(login_url, json=login_data, headers=headers, timeout=30)
            response.raise_for_status()
            
            login_result = response.json()
            self.auth_token = login_result.get("access_token")
            
            if not self.auth_token:
                print("No access token received from login")
                return False
            
            print("Authentication successful")
            return True
            
        except requests.exceptions.RequestException as e:
            print(f"Authentication failed: {e}")
            return False
        except Exception as e:
            print(f"Authentication error: {e}")
            return False
    
    def run_all_tests(self, verbose: bool = True, coverage: bool = True) -> Dict[str, Any]:
        """Run all Quest tests."""
        print("Starting Quest Test Suite")
        print("=" * 50)
        
        self.start_time = time.time()
        
        # Set up authentication
        if not self.setup_authentication():
            print("Failed to set up authentication. Exiting.")
            return {"error": "Authentication failed"}
        
        # Clean up any existing test data
        print("Cleaning up existing test data...")
        test_data_manager.cleanup_all_test_data()
        
        # Set up environment variables for tests
        os.environ["TEST_AUTH_TOKEN"] = self.auth_token or ""
        os.environ["TEST_API_URL"] = self.api_url or ""
        os.environ["TEST_API_KEY"] = self.api_key or ""
        os.environ["TEST_AWS_REGION"] = "us-east-2"
        
        # Run different test categories
        test_categories = [
            ("API Tests", "test_quest_api.py"),
            ("Security Tests", "test_quest_security.py"),
            ("Integration Tests", "test_quest_integration.py"),
            ("Integration Auth Tests", "test_quest_integration_auth.py"),
            ("Performance Tests", "test_quest_performance.py"),
            ("Error Scenario Tests", "test_quest_error_scenarios.py"),
            ("Authentication Tests", "test_quest_auth.py"),
            ("Coverage Tests", "test_quest_coverage.py"),
        ]
        
        for category_name, test_file in test_categories:
            print(f"\nRunning {category_name}...")
            result = self.run_test_file(test_file, verbose, coverage)
            self.results[category_name] = result
        
        self.end_time = time.time()
        
        # Generate final report
        self.generate_report()
        
        return self.results
    
    def run_test_file(self, test_file: str, verbose: bool = True, coverage: bool = True) -> Dict[str, Any]:
        """Run a specific test file."""
        test_path = self.test_dir / test_file
        
        if not test_path.exists():
            print(f"Test file not found: {test_file}")
            return {"status": "error", "message": "Test file not found"}
        
        # Build pytest command
        cmd = ["python", "-m", "pytest", str(test_path)]
        
        if verbose:
            cmd.append("-v")
        
        if coverage:
            cmd.extend(["--cov=app", "--cov-report=term-missing"])
        
        # Add test markers for better organization
        cmd.extend(["-m", "not slow"])  # Skip slow tests by default
        
        print(f"Running: {' '.join(cmd)}")
        
        try:
            # Prepare environment with test variables
            env = os.environ.copy()
            env.update({
                "TEST_AUTH_TOKEN": self.auth_token or "",
                "TEST_API_URL": self.api_url or "",
                "TEST_API_KEY": self.api_key or "",
                "TEST_AWS_REGION": "us-east-2"
            })
            
            result = subprocess.run(
                cmd,
                cwd=self.test_dir,  # Run from test directory instead of quest-service directory
                capture_output=True,
                text=True,
                timeout=300,  # 5 minute timeout
                env=env
            )
            
            return {
                "status": "success" if result.returncode == 0 else "failed",
                "returncode": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "duration": time.time() - time.time()
            }
            
        except subprocess.TimeoutExpired:
            return {
                "status": "timeout",
                "message": "Test execution timed out"
            }
        except Exception as e:
            return {
                "status": "error",
                "message": str(e)
            }
    
    def run_specific_tests(self, test_pattern: str, verbose: bool = True) -> Dict[str, Any]:
        """Run tests matching a specific pattern."""
        print(f"Running tests matching pattern: {test_pattern}")
        
        cmd = ["python", "-m", "pytest", f"{self.test_dir}/{test_pattern}"]
        
        if verbose:
            cmd.append("-v")
        
        try:
            # Prepare environment with test variables
            env = os.environ.copy()
            env.update({
                "TEST_AUTH_TOKEN": self.auth_token or "",
                "TEST_API_URL": self.api_url or "",
                "TEST_API_KEY": self.api_key or "",
                "TEST_AWS_REGION": "us-east-2"
            })
            
            result = subprocess.run(
                cmd,
                cwd=self.test_dir,  # Run from test directory instead of quest-service directory
                capture_output=True,
                text=True,
                timeout=300,
                env=env
            )
            
            return {
                "status": "success" if result.returncode == 0 else "failed",
                "returncode": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": str(e)
            }
    
    def run_performance_tests(self) -> Dict[str, Any]:
        """Run performance tests specifically."""
        print("Running Performance Tests...")
        
        cmd = [
            "python", "-m", "pytest",
            f"{self.test_dir}/test_quest_performance.py",
            "-v",
            "-m", "performance"
        ]
        
        try:
            # Prepare environment with test variables
            env = os.environ.copy()
            env.update({
                "TEST_AUTH_TOKEN": self.auth_token or "",
                "TEST_API_URL": self.api_url or "",
                "TEST_API_KEY": self.api_key or "",
                "TEST_AWS_REGION": "us-east-2"
            })
            
            result = subprocess.run(
                cmd,
                cwd=self.test_dir,  # Run from test directory instead of quest-service directory
                capture_output=True,
                text=True,
                timeout=600,  # 10 minute timeout for performance tests
                env=env
            )
            
            return {
                "status": "success" if result.returncode == 0 else "failed",
                "returncode": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": str(e)
            }
    
    def run_security_tests(self) -> Dict[str, Any]:
        """Run security tests specifically."""
        print("Running Security Tests...")
        
        cmd = [
            "python", "-m", "pytest",
            f"{self.test_dir}/test_quest_security.py",
            "-v",
            "-m", "security"
        ]
        
        try:
            # Prepare environment with test variables
            env = os.environ.copy()
            env.update({
                "TEST_AUTH_TOKEN": self.auth_token or "",
                "TEST_API_URL": self.api_url or "",
                "TEST_API_KEY": self.api_key or "",
                "TEST_AWS_REGION": "us-east-2"
            })
            
            result = subprocess.run(
                cmd,
                cwd=self.test_dir,  # Run from test directory instead of quest-service directory
                capture_output=True,
                text=True,
                timeout=300,
                env=env
            )
            
            return {
                "status": "success" if result.returncode == 0 else "failed",
                "returncode": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": str(e)
            }
    
    def generate_report(self):
        """Generate a comprehensive test report."""
        print("\n" + "=" * 50)
        print("QUEST TEST SUITE REPORT")
        print("=" * 50)
        
        total_duration = self.end_time - self.start_time if self.start_time and self.end_time else 0
        
        print(f"Total Duration: {total_duration:.2f} seconds")
        print(f"Completed at: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Test category results
        print("\nTest Category Results:")
        print("-" * 30)
        
        passed = 0
        failed = 0
        errors = 0
        
        for category, result in self.results.items():
            status = result.get("status", "unknown")
            
            if status == "success":
                print(f"PASSED {category}")
                passed += 1
            elif status == "failed":
                print(f"FAILED {category}")
                failed += 1
            else:
                print(f"{status.upper()} {category}")
                errors += 1
        
        # Summary
        print(f"\nSummary:")
        print(f"   Passed: {passed}")
        print(f"   Failed: {failed}")
        print(f"   Errors: {errors}")
        print(f"   Total: {passed + failed + errors}")
        
        # Coverage information
        print(f"\nCoverage Information:")
        print("   Run with --coverage flag for detailed coverage report")
        
        # Cleanup status
        print(f"\nCleanup Status:")
        if test_data_manager.verify_cleanup():
            print("   All test data cleaned up successfully")
        else:
            print("   Some test data may remain in database")
        
        # Recommendations
        print(f"\nRecommendations:")
        if failed > 0:
            print("   - Review failed tests and fix issues")
        if errors > 0:
            print("   - Check error logs for configuration issues")
        if total_duration > 300:  # 5 minutes
            print("   - Consider optimizing slow tests")
        
        print("\n" + "=" * 50)
    
    def cleanup_test_data(self):
        """Clean up all test data."""
        print("Cleaning up test data...")
        test_data_manager.cleanup_all_test_data()
        
        if test_data_manager.verify_cleanup():
            print("Test data cleanup completed successfully")
        else:
            print("Some test data may still remain")


def main():
    """Main entry point for the test runner."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Quest Test Runner")
    parser.add_argument("--pattern", "-p", help="Run tests matching pattern")
    parser.add_argument("--performance", action="store_true", help="Run performance tests only")
    parser.add_argument("--security", action="store_true", help="Run security tests only")
    parser.add_argument("--no-coverage", action="store_true", help="Skip coverage analysis")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    parser.add_argument("--cleanup", action="store_true", help="Clean up test data and exit")
    
    args = parser.parse_args()
    
    runner = QuestTestRunner()
    
    if args.cleanup:
        runner.cleanup_test_data()
        return
    
    if args.pattern:
        # Set up authentication for specific tests
        if not runner.setup_authentication():
            print("Failed to set up authentication. Exiting.")
            sys.exit(1)
        
        result = runner.run_specific_tests(args.pattern, args.verbose)
        print(f"Test result: {result['status']}")
        if result['status'] != 'success':
            print(f"Error: {result.get('message', 'Unknown error')}")
            if 'stdout' in result and result['stdout']:
                print(f"STDOUT: {result['stdout']}")
            if 'stderr' in result and result['stderr']:
                print(f"STDERR: {result['stderr']}")
            sys.exit(1)
    elif args.performance:
        result = runner.run_performance_tests()
        print(f"Performance test result: {result['status']}")
        if result['status'] != 'success':
            print(f"Error: {result.get('message', 'Unknown error')}")
            sys.exit(1)
    elif args.security:
        result = runner.run_security_tests()
        print(f"Security test result: {result['status']}")
        if result['status'] != 'success':
            print(f"Error: {result.get('message', 'Unknown error')}")
            sys.exit(1)
    else:
        results = runner.run_all_tests(args.verbose, not args.no_coverage)
        
        # Check if any tests failed
        failed_categories = [
            category for category, result in results.items()
            if isinstance(result, dict) and result.get("status") == "failed"
        ]
        
        if failed_categories:
            print(f"\nFailed categories: {', '.join(failed_categories)}")
            sys.exit(1)
        else:
            print("\nAll tests passed successfully!")


if __name__ == "__main__":
    main()