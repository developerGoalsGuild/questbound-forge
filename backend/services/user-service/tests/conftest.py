import os
import sys
from pathlib import Path

# Ensure the service root (containing the 'app' package) is on sys.path
service_dir = Path(__file__).resolve().parents[1]
if str(service_dir) not in sys.path:
    sys.path.insert(0, str(service_dir))

# Add the services directory for common module
services_dir = Path(__file__).resolve().parents[2]
if str(services_dir) not in sys.path:
    sys.path.insert(0, str(services_dir))

