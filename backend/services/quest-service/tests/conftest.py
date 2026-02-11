import sys
from pathlib import Path

# Add the quest-service directory to Python path so we can import app
quest_service_dir = Path(__file__).resolve().parents[1]
if str(quest_service_dir) not in sys.path:
    sys.path.insert(0, str(quest_service_dir))

# Add the services directory for common module
services_dir = Path(__file__).resolve().parents[2]
if str(services_dir) not in sys.path:
    sys.path.insert(0, str(services_dir))
