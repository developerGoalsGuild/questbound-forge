#!/usr/bin/env bash
set -euo pipefail

rm -rf build authorizer.zip
mkdir build

pip3 install -r requirements.txt -t build/

# include all modules the handler imports
cp authorizer.py cognito.py security.py ssm.py build/

cd build
zip -r ../authorizer.zip .
cd ..
echo "Packaged authorizer.zip ready for deployment."