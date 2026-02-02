"""
GHOST PROTOCOL - JurisLink Privacy Enforcement
Auto-deletion of user data after retention period (60 minutes by default).

Usage:
    from shared_lib.ghost_protocol import enforce_privacy
    enforce_privacy()  # Call before each request
"""
import os
import time
import shutil
from pathlib import Path
from datetime import datetime

# Configuration
RETENTION_SECONDS = 3600  # 60 minutes (1 hour)
STORAGE_PATHS = [
    Path(__file__).parent.parent / "TEMP",           # Temp files (PDFs, etc.)
    Path(__file__).parent.parent / "frontend_portal" / "public" / "users",  # User files
]


def enforce_privacy(verbose: bool = False) -> dict:
    """
    Scans user folders and incinerates data older than retention period.
    
    This function is designed to be called on every API request to ensure
    continuous privacy enforcement ("self-cleaning" server).
    
    Args:
        verbose: If True, print detailed logs
        
    Returns:
        dict with stats: {'scanned': N, 'deleted': N, 'errors': []}
    """
    stats = {
        'scanned': 0,
        'deleted': 0,
        'bytes_freed': 0,
        'errors': [],
        'timestamp': datetime.now().isoformat()
    }
    
    now = time.time()
    cutoff_time = now - RETENTION_SECONDS
    
    for storage_path in STORAGE_PATHS:
        if not storage_path.exists():
            continue
            
        try:
            for item in storage_path.iterdir():
                stats['scanned'] += 1
                
                try:
                    # Get modification time (most recent activity)
                    mtime = item.stat().st_mtime
                    
                    if mtime < cutoff_time:
                        # Calculate size before deletion
                        if item.is_dir():
                            size = sum(f.stat().st_size for f in item.rglob('*') if f.is_file())
                        else:
                            size = item.stat().st_size
                        
                        # Incinerate expired data
                        if item.is_dir():
                            shutil.rmtree(item)
                        else:
                            item.unlink()
                        
                        stats['deleted'] += 1
                        stats['bytes_freed'] += size
                        
                        if verbose:
                            age_minutes = int((now - mtime) / 60)
                            print(f"👻 GHOST PROTOCOL: Incinerated {item.name} (age: {age_minutes}min)")
                            
                except PermissionError as e:
                    stats['errors'].append(f"Permission denied: {item}")
                except Exception as e:
                    stats['errors'].append(f"Error processing {item}: {str(e)}")
                    
        except Exception as e:
            stats['errors'].append(f"Error scanning {storage_path}: {str(e)}")
    
    if verbose and stats['deleted'] > 0:
        mb_freed = stats['bytes_freed'] / (1024 * 1024)
        print(f"👻 GHOST PROTOCOL: Freed {mb_freed:.2f}MB from {stats['deleted']} items")
    
    return stats


def get_retention_info() -> dict:
    """
    Returns information about current retention policy and storage status.
    """
    info = {
        'retention_seconds': RETENTION_SECONDS,
        'retention_minutes': RETENTION_SECONDS // 60,
        'storage_paths': [str(p) for p in STORAGE_PATHS],
        'items_at_risk': 0,
        'total_size_bytes': 0
    }
    
    now = time.time()
    cutoff_time = now - RETENTION_SECONDS
    
    for storage_path in STORAGE_PATHS:
        if not storage_path.exists():
            continue
            
        for item in storage_path.iterdir():
            try:
                mtime = item.stat().st_mtime
                if mtime < cutoff_time:
                    info['items_at_risk'] += 1
                    
                if item.is_dir():
                    info['total_size_bytes'] += sum(f.stat().st_size for f in item.rglob('*') if f.is_file())
                else:
                    info['total_size_bytes'] += item.stat().st_size
            except:
                pass
    
    return info


# For testing / manual cleanup
if __name__ == "__main__":
    print("🔍 Ghost Protocol Status Check")
    print("-" * 40)
    
    info = get_retention_info()
    print(f"Retention Period: {info['retention_minutes']} minutes")
    print(f"Storage Paths: {len(info['storage_paths'])}")
    print(f"Items at risk: {info['items_at_risk']}")
    print(f"Total size: {info['total_size_bytes'] / 1024:.1f}KB")
    
    print("\n🧹 Running cleanup...")
    stats = enforce_privacy(verbose=True)
    
    print(f"\n✅ Complete: Scanned {stats['scanned']}, Deleted {stats['deleted']}")
    if stats['errors']:
        print(f"⚠️ Errors: {len(stats['errors'])}")
