"""
SHARED UTILITIES - JurisLink
Centralized utility functions for security and path management.
"""
import os
from pathlib import Path

# Static files directory - served by the frontend
# Assumes structure: d:\JurisLink_Solution\frontend_portal\public
# Adjust relative path if necessary based on __file__ location
CURRENT_DIR = Path(__file__).parent
PROJECT_ROOT = CURRENT_DIR.parent
STATIC_DIR = PROJECT_ROOT / "frontend_portal" / "public"
USERS_DIR_NAME = "users"

def get_secure_storage_path(user_id: str, case_id: str) -> Path:
    """
    Generates a secure, nested storage path:
    frontend_portal/public/users/{user_id}/cases/{case_id}/
    
    Args:
        user_id: ID of the user (sanitized)
        case_id: ID of the case (sanitized)
        
    Returns:
        Path object to the secure directory.
        
    Raises:
        ValueError: If inputs are invalid or missing.
    """
    if not user_id or not case_id:
        raise ValueError("Security Error: user_id and case_id are required.")

    # Strict Sanitization to prevent directory traversal
    # Allow alphanumeric, hyphens, and underscores only
    safe_user = "".join(c for c in user_id if c.isalnum() or c in ('-', '_'))
    safe_case = "".join(c for c in case_id if c.isalnum() or c in ('-', '_'))
    
    if not safe_user or not safe_case:
        raise ValueError("Security Error: Invalid ID format. Must contain alphanumeric characters.")
    
    # Nested Structure
    target_path = STATIC_DIR / USERS_DIR_NAME / safe_user / "cases" / safe_case
    
    # Ensure directory exists
    target_path.mkdir(parents=True, exist_ok=True)
    
    return target_path
