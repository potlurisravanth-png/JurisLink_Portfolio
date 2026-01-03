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
        user_id: ID of the user (must be alphanumeric)
        case_id: ID of the case (must be alphanumeric)
        
    Returns:
        Path object to the secure directory.
        
    Raises:
        ValueError: If inputs are invalid, missing, or contain malicious characters.
    """
    if not user_id or not case_id:
        raise ValueError("Security Error: user_id and case_id are required.")

    # 1. STRICT VALIDATION (Reject don't sanitize)
    # Prevent Path Traversal: reject if containing path separators or parent reference
    prohibited_chars = ['/', '\\', '..']
    
    for prohibited in prohibited_chars:
        if prohibited in user_id or prohibited in case_id:
            raise ValueError(f"Security Warning: malicious characters detected in ID. Access denied.")
            
    # 2. ALPHANUMERIC CHECK (Allow hyphens/underscores)
    # This ensures "user-123" works but "../../etc" fails
    valid_pattern = lambda s: all(c.isalnum() or c in ('-', '_') for c in s)
    
    if not valid_pattern(user_id) or not valid_pattern(case_id):
        raise ValueError("Security Error: IDs must be alphanumeric (hyphens/underscores allowed).")
    
    # 3. CONSTRUCT PATH
    target_path = STATIC_DIR / USERS_DIR_NAME / user_id / "cases" / case_id
    
    # Ensure directory exists
    target_path.mkdir(parents=True, exist_ok=True)
    
    return target_path
