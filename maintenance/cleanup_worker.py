"""
CLEANUP WORKER - JurisLink Data Retention Policy
Run this script periodically (e.g., via cron or Azure Timer Trigger)
to enforce the 24-hour retention policy for sensitive user files.
"""
import os
import time
import shutil
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Constants
RETENTION_HOURS = 24
RETENTION_SECONDS = RETENTION_HOURS * 3600

# Path to user data directory (Adjust relative to project root)
PROJECT_ROOT = Path(__file__).parent.parent
USERS_DIR = PROJECT_ROOT / "frontend_portal" / "public" / "case_files" / "users"

def cleanup_files():
    """Scan user directories and delete files older than retention period."""
    if not USERS_DIR.exists():
        logging.info(f"Directory {USERS_DIR} does not exist. No cleanup needed.")
        return

    logging.info(f"Starting cleanup of {USERS_DIR} (Retention: {RETENTION_HOURS}h)")
    now = time.time()
    deleted_count = 0
    error_count = 0

    # Walk through all user directories
    for user_dir in USERS_DIR.iterdir():
        if user_dir.is_dir():
            # Check files in user directory
            for file_path in user_dir.iterdir():
                try:
                    if file_path.is_file():
                        file_age = now - file_path.stat().st_mtime
                        if file_age > RETENTION_SECONDS:
                            file_path.unlink()
                            deleted_count += 1
                            logging.info(f"Deleted expired file: {file_path.name} (Age: {file_age/3600:.1f}h)")
                except Exception as e:
                    logging.error(f"Error checking/deleting {file_path}: {e}")
                    error_count += 1
            
            # Optional: Remove empty user directories
            try:
                if not any(user_dir.iterdir()):
                    user_dir.rmdir()
                    logging.info(f"Removed empty directory: {user_dir.name}")
            except Exception as e:
                logging.error(f"Error removing directory {user_dir}: {e}")

    logging.info(f"Cleanup complete. Deleted {deleted_count} files. Errors: {error_count}")

if __name__ == "__main__":
    cleanup_files()
