#!/bin/bash

# Script to create .env.test file from template
# This file will be git-ignored and contain your test credentials

ENV_TEST_FILE=".env.test"
ENV_TEST_EXAMPLE=".env.test.example"

# Check if .env.test already exists
if [ -f "$ENV_TEST_FILE" ]; then
    echo "⚠️  .env.test already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted. Keeping existing .env.test file."
        exit 0
    fi
fi

# Create .env.test from example if it exists, otherwise create from scratch
if [ -f "$ENV_TEST_EXAMPLE" ]; then
    echo "📋 Creating .env.test from $ENV_TEST_EXAMPLE..."
    cp "$ENV_TEST_EXAMPLE" "$ENV_TEST_FILE"
else
    echo "📋 Creating .env.test from template..."
    cat > "$ENV_TEST_FILE" << 'EOF'
# Test User Credentials
# This file is git-ignored and will not be committed to source control
# Fill in your test user credentials below

# Test User Email
TEST_USER_EMAIL=test@example.com

# Test User Password
TEST_USER_PASSWORD=your-test-password-here

# Optional: API Gateway Configuration (if different from default)
# VITE_API_GATEWAY_URL=https://3xlvsffmxc.execute-api.us-east-2.amazonaws.com
# VITE_API_GATEWAY_KEY=your-api-key-here

# Optional: App URL (if different from default)
# VITE_APP_URL=http://localhost:8080
EOF
fi

# Make file readable/writable only by owner
chmod 600 "$ENV_TEST_FILE"

echo "✅ Created $ENV_TEST_FILE"
echo ""
echo "📝 Next steps:"
echo "   1. Edit $ENV_TEST_FILE with your test user credentials"
echo "   2. Replace 'test@example.com' with your test user email"
echo "   3. Replace 'your-test-password-here' with your test user password"
echo "   4. (Optional) Uncomment and set API Gateway URL/Key if needed"
echo ""
echo "🔒 Security: This file is git-ignored and will not be committed to source control"
