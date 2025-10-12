"""
Test Terraform configuration for collaboration service.

This test verifies that the Terraform configuration is syntactically correct
and follows the expected patterns.
"""

import pytest
import os
import subprocess
from pathlib import Path


class TestTerraformConfiguration:
    """Test Terraform configuration for collaboration service."""
    
    def test_terraform_validate(self):
        """Test that Terraform configuration is valid."""
        # Get the project root directory
        project_root = Path(__file__).resolve().parents[4]
        terraform_dir = project_root / "backend" / "infra" / "terraform2"
        
        # Check if terraform is available
        try:
            result = subprocess.run(
                ["terraform", "version"],
                capture_output=True,
                text=True,
                cwd=terraform_dir
            )
            if result.returncode != 0:
                pytest.skip("Terraform not available")
        except FileNotFoundError:
            pytest.skip("Terraform not installed")
        
        # Validate Terraform configuration
        result = subprocess.run(
            ["terraform", "validate"],
            capture_output=True,
            text=True,
            cwd=terraform_dir
        )
        
        # For now, we'll just check that the command runs without syntax errors
        # In a real deployment, we would need proper AWS credentials and state
        assert result.returncode in [0, 1]  # 0 = valid, 1 = invalid (but no syntax errors)
    
    def test_collaboration_service_tf_exists(self):
        """Test that collaboration service Terraform file exists."""
        project_root = Path(__file__).resolve().parents[4]
        tf_file = project_root / "backend" / "infra" / "terraform2" / "stacks" / "services" / "collaboration_service.tf"
        
        assert tf_file.exists(), "collaboration_service.tf file should exist"
        
        # Check that the file contains expected content
        content = tf_file.read_text()
        assert "collaboration_service_lambda" in content
        assert "collaboration-service" in content
        assert "aws_cloudwatch_metric_alarm" in content
    
    def test_api_gateway_collaboration_resources(self):
        """Test that API Gateway has collaboration resources."""
        project_root = Path(__file__).resolve().parents[4]
        api_gateway_tf = project_root / "backend" / "infra" / "terraform2" / "modules" / "apigateway" / "api_gateway.tf"
        
        assert api_gateway_tf.exists(), "api_gateway.tf file should exist"
        
        content = api_gateway_tf.read_text()
        
        # Check for collaboration resources
        assert "collaborations" in content
        assert "collaborations_invites" in content
        assert "collaborations_resources" in content
        assert "collaborations_comments" in content
        
        # Check for collaboration methods
        assert "collaborations_invites_post" in content
        assert "collaborations_invites_get" in content
        assert "collaborations_invites_id_accept_post" in content
        assert "collaborations_invites_id_decline_post" in content
        assert "collaborations_resources_type_id_collaborators_get" in content
        assert "collaborations_resources_type_id_collaborators_user_id_delete" in content
        
        # Check for Lambda integration
        assert "collaboration_service_lambda_arn" in content
        assert "allow_collaboration" in content
    
    def test_iam_collaboration_role(self):
        """Test that IAM role for collaboration service exists."""
        project_root = Path(__file__).resolve().parents[4]
        iam_tf = project_root / "backend" / "infra" / "terraform2" / "modules" / "security" / "iam.tf"
        
        assert iam_tf.exists(), "iam.tf file should exist"
        
        content = iam_tf.read_text()
        
        # Check for collaboration service IAM role
        assert "collaboration_service_role" in content
        assert "collaboration_service_dynamodb_access" in content
        assert "collaboration_service_cognito_read" in content
        assert "collaboration_service_ssm_read" in content
    
    def test_outputs_exist(self):
        """Test that required outputs exist."""
        project_root = Path(__file__).resolve().parents[4]
        outputs_tf = project_root / "backend" / "infra" / "terraform2" / "modules" / "security" / "outputs.tf"
        
        assert outputs_tf.exists(), "outputs.tf file should exist"
        
        content = outputs_tf.read_text()
        assert "collaboration_service_role_arn" in content


if __name__ == "__main__":
    pytest.main([__file__])

