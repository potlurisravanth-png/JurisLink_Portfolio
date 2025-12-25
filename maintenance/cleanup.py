"""
INTELLIGENT CLEANUP AGENT - JurisLink Maintenance Protocol
Run with: python maintenance/cleanup.py
"""
import os
import shutil
import subprocess
from datetime import datetime
from pathlib import Path

# === CONFIGURATION ===
ROOT = Path(__file__).parent.parent
JOURNAL_PATH = ROOT / "MEMORY" / "journal.md"
TEMP_DIR = ROOT / "TEMP"

# Files/folders to delete
JUNK_FOLDERS = ["__pycache__", ".pytest_cache", "node_modules/.cache"]
JUNK_EXTENSIONS_IN_TEMP = [".zip", ".tmp"]
JUNK_EXTENSIONS_IN_ROOT = [".log"]

# Files to NEVER delete
PROTECTED_PATTERNS = ["test_", ".py", ".jsx", ".js", ".ts", ".md", ".json", ".html", ".css"]


def print_header(text):
    print(f"\n{'='*50}")
    print(f"  {text}")
    print(f"{'='*50}")


def step1_journaling():
    """Ask for session summary and append to journal."""
    print_header("STEP 1: JOURNALING")
    
    summary = input("📝 Enter your session summary (or press Enter to skip): ").strip()
    
    if not summary:
        print("   Skipped journaling.")
        return False
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    entry = f"\n## [{timestamp}]\n{summary}\n"
    
    # Ensure MEMORY folder exists
    JOURNAL_PATH.parent.mkdir(exist_ok=True)
    
    # Create journal if it doesn't exist
    if not JOURNAL_PATH.exists():
        JOURNAL_PATH.write_text("# JurisLink Development Journal\n")
    
    # Append entry
    with open(JOURNAL_PATH, "a", encoding="utf-8") as f:
        f.write(entry)
    
    print(f"   ✓ Added journal entry at {timestamp}")
    return True


def step2_temp_audit():
    """The Purge: Delete junk files while protecting source code."""
    print_header("STEP 2: TEMP AUDIT (The Purge)")
    
    deleted_count = 0
    
    # Walk through entire project
    for root, dirs, files in os.walk(ROOT, topdown=True):
        root_path = Path(root)
        
        # Skip node_modules entirely (except cache)
        if "node_modules" in str(root_path) and ".cache" not in str(root_path):
            continue
        
        # Delete junk folders
        for dir_name in list(dirs):
            if dir_name in ["__pycache__", ".pytest_cache"]:
                target = root_path / dir_name
                try:
                    shutil.rmtree(target)
                    print(f"   🗑️  Deleted folder: {target.relative_to(ROOT)}")
                    deleted_count += 1
                    dirs.remove(dir_name)  # Don't recurse into deleted folder
                except Exception as e:
                    print(f"   ⚠️  Could not delete {dir_name}: {e}")
        
        # Delete junk files in TEMP folder
        if TEMP_DIR in root_path.parents or root_path == TEMP_DIR:
            for file_name in files:
                file_path = root_path / file_name
                if any(file_name.endswith(ext) for ext in JUNK_EXTENSIONS_IN_TEMP):
                    try:
                        file_path.unlink()
                        print(f"   🗑️  Deleted temp file: {file_path.relative_to(ROOT)}")
                        deleted_count += 1
                    except Exception as e:
                        print(f"   ⚠️  Could not delete {file_name}: {e}")
        
        # Delete .log files in root only
        if root_path == ROOT:
            for file_name in files:
                if file_name.endswith(".log"):
                    file_path = root_path / file_name
                    try:
                        file_path.unlink()
                        print(f"   🗑️  Deleted log file: {file_name}")
                        deleted_count += 1
                    except Exception as e:
                        print(f"   ⚠️  Could not delete {file_name}: {e}")
    
    if deleted_count == 0:
        print("   ✓ No junk files found. Project is clean!")
    else:
        print(f"   ✓ Deleted {deleted_count} junk items.")
    
    return deleted_count


def step3_git_status():
    """Check git status and remind about uncommitted changes."""
    print_header("STEP 3: GIT STATUS CHECK")
    
    try:
        result = subprocess.run(
            ["git", "status", "--porcelain"],
            cwd=ROOT,
            capture_output=True,
            text=True
        )
        
        output = result.stdout.strip()
        
        if output:
            print("   ⚠️  REMINDER: You have uncommitted changes:")
            for line in output.split('\n')[:5]:  # Show first 5 files
                print(f"      {line}")
            if output.count('\n') > 5:
                print(f"      ... and {output.count(chr(10)) - 5} more files")
        else:
            print("   ✓ Working tree is clean. All changes committed.")
            
    except FileNotFoundError:
        print("   ⚠️  Git not found. Skipping status check.")
    except Exception as e:
        print(f"   ⚠️  Error checking git status: {e}")


def step4_final_report():
    """Print final summary."""
    print_header("CLEANUP COMPLETE")
    print("""
   ✅ Journal updated (if entry provided)
   ✅ Junk files purged
   ✅ Repo status checked
   
   Your JurisLink workspace is now clean!
    """)


def main():
    print("""
    ╔══════════════════════════════════════════════════╗
    ║     JURISLINK INTELLIGENT CLEANUP AGENT          ║
    ║     Maintaining hygiene and memory               ║
    ╚══════════════════════════════════════════════════╝
    """)
    
    step1_journaling()
    step2_temp_audit()
    step3_git_status()
    step4_final_report()


if __name__ == "__main__":
    main()
