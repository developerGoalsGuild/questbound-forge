import sys
from pathlib import Path

# Add the services directory to Python path so we can import app.main
services_dir = Path(__file__).resolve().parents[2]
if str(services_dir) not in sys.path:
    sys.path.insert(0, str(services_dir))
