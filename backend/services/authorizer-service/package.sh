#!/bin/bash
# Package the Lambda function with dependencies for deployment

set -e

# Clean previous build
rm -rf build
mkdir build

# Install dependencies to build folder
pip3 install -r requirements.txt -t build/

# Copy source code
cp authorizer.py build/

# Zip contents
cd build
zip -r ../authorizer.zip .
cd ..

echo "Packaged authorizer.zip ready for deployment."
