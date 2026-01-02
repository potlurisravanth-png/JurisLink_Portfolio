"""
CLEANUP POLICY - JurisLink
Deletes case files (PDFs) older than 24 hours to ensure privacy and save space.
Designed to be run as a "Lazy Cleanup" step during intake.
"""
import os
import time
import logging
from pathlib import Path

# Adjust based on known location relative to project root
# maintenance/cleanup_policy.py -> ../frontend_portal/public/users
CURRENT_DIR = Path(__file__).parent
PROJECT_ROOT = CURRENT_DIR.parent
USERS_DIR = PROJECT_ROOT / "frontend_portal" / "public" / "users"

# 24 hours in seconds
RETENTION_PERIOD_SECONDS = 24 * 60 * 60 

def run_cleanup():
    """
    Scans the users directory and deletes any .pdf files older than RETENTION_PERIOD_SECONDS.
    """
    if not USERS_DIR.exists():
        logging.info(f"Cleanup skipped: {USERS_DIR} does not exist.")
        return

    logging.info("--- Starting Privacy Cleanup ---")
    deleted_count = 0
    now = time.time()
    
    # Walk through all user directories
    for root, dirs, files in os.walk(USERS_DIR):
        for file in files:
            if file.lower().endswith(".pdf"):
                file_path = Path(root) / file
                try:
                    stat = file_path.stat()
                    file_age = now - stat.st_mtime
                    
                    if file_age > RETENTION_PERIOD_SECONDS:
                        file_path.unlink()
                        deleted_count += 1
                        logging.info(f"Deleted old file: {file_path.name} (Age: {file_age/3600:.1f}h)")
                except Exception as e:
                    logging.error(f"Error checking/deleting {file_path}: {e}")

    if deleted_count > 0:
        logging.info(f"--- Cleanup Complete: Removed {deleted_count} old files. ---")
    else:
        logging.info("--- Cleanup Complete: No old files found. ---")

if __name__ == "__main__":
    # Allow manual execution
    logging.basicConfig(level=logging.INFO)
    run_cleanup()
