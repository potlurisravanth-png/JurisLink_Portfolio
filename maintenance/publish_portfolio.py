"""
PUBLIC PORTFOLIO SYNC - JurisLink
Copies non-proprietary code from the private solution to the public portfolio folder.

Usage:
1. Ensure 'JurisLink_Portfolio' is cloned at D:\\JurisLink_Portfolio
2. Run: python maintenance/publish_portfolio.py
"""
import os
import shutil
from pathlib import Path

# === CONFIGURATION ===
SOURCE_DIR = Path(r"D:\JurisLink_Solution")
DEST_DIR = Path(r"D:\JurisLink_Portfolio")

# Items to Copy (Safe for Public)
SAFE_ITEMS = [
    "frontend_portal",
    "shared_lib",
    "agent_intake",
    "maintenance",
    "assets",
    "docs",
    "tests",
    "README.md",
    "requirements.txt",
    "LICENSE"
]

# Items to Exclude during copy (e.g., node_modules inside frontend)
EXCLUDE_PATTERNS = [
    "node_modules",
    "__pycache__",
    ".git",
    ".venv", 
    ".ds_store"
]

# === SENSITIVE FILES TO DELETE FROM PUBLIC MIRROR ===
# These files are visible in the Private Repo (so the God Agent can read them)
# but MUST be deleted before pushing to the Public Portfolio.
SENSITIVE_FILES = [
    "docs/instructions.md",      # God Agent instructions
    "MEMORY",                    # Development journal/memory
    "agent_strategist",          # Proprietary strategy logic
    "agent_critic",              # Proprietary critic logic
    "agent_researcher",          # Proprietary research logic
    "agent_assistant",           # Proprietary assistant logic
    "maintenance/cleanup.py",    # Internal maintenance scripts
]

def print_header(text):
    print(f"\n{'='*50}")
    print(f"  {text}")
    print(f"{'='*50}")

def safe_copy(src, dst):
    """Recursively copy src to dst, skipping excluded patterns."""
    if not src.exists():
        print(f"   ⚠️  Source not found: {src.name}")
        return

    # If it's a file, simple copy
    if src.is_file():
        shutil.copy2(src, dst)
        print(f"   ✓ Copied file: {src.name}")
        return

    # If it's a directory, walk and copy
    if not dst.exists():
        dst.mkdir(parents=True)
    
    for item in src.iterdir():
        if any(bad in item.name.lower() for bad in EXCLUDE_PATTERNS):
            continue
            
        dst_item = dst / item.name
        if item.is_dir():
            # Recursive call? No, shutil.copytree is easier but we need granular exclude.
            # Let's use shutil.copytree with ignore_patterns for simplicity if possible.
            try:
                # Custom copytree logic is safer for merging
                shutil.copytree(
                    item, 
                    dst_item, 
                    dirs_exist_ok=True, 
                    ignore=shutil.ignore_patterns(*EXCLUDE_PATTERNS)
                )
                print(f"   ✓ Copied folder: {item.name}")
            except Exception as e:
                print(f"   ❌ Error copying {item.name}: {e}")
        else:
            shutil.copy2(item, dst_item)

def generate_placeholder(dest_root):
    """Create the proprietary logic placeholder file."""
    placeholder_path = dest_root / "backend_logic.md"
    content = """# ⚠️ PROPRIETARY BACKEND LOGIC

The core AI logic (Strategist Agent, Researcher Agent, Litigation Writer) has been redacted from this public portfolio repository to protect Intellectual Property.

This project demonstrates the **System Architecture**, **Frontend UX**, and **Integration Patterns** while keeping the proprietary legal decision engines closed-source.

## What's Included:
- ✅ **Frontend Portal** (React/Vite)
- ✅ **Intake Agent** (Example of conversational state machine)
- ✅ **Shared Library** (Type definitions and schema)
- ✅ **Infrastructure Code** (Azure Functions setup)

## What's Redacted:
- 🔒 **Strategist Agent** (Litigation strategy engine)
- 🔒 **Researcher Agent** (Tavily integration)
- 🔒 **Writer Agent** (Legal document generation)
"""
    placeholder_path.write_text(content, encoding="utf-8")
    print("   ✓ Created placeholder: backend_logic.md")

def remove_sensitive_files(dest_root):
    """🔒 KILL SWITCH: Delete sensitive files from public mirror before push."""
    print("\n🔒 Removing sensitive files from public mirror...")
    for item in SENSITIVE_FILES:
        target = dest_root / item
        if target.exists():
            if target.is_dir():
                shutil.rmtree(target)
                print(f"   🗑️  Deleted folder: {item}")
            else:
                target.unlink()
                print(f"   🗑️  Deleted file: {item}")
        else:
            print(f"   ⏭️  Already absent: {item}")

def main():
    print_header("JURISLINK PORTFOLIO SYNC")
    print(f"Source: {SOURCE_DIR}")
    print(f"Dest:   {DEST_DIR}")
    
    if not DEST_DIR.exists():
        print(f"\n❌ Error: Destination folder not found: {DEST_DIR}")
        print("Please clone your public repo there first:")
        print("git clone https://github.com/[YourUser]/JurisLink_Portfolio.git D:\\JurisLink_Portfolio")
        return

    print("\nStarting Sync...")
    
    # 1. Copy Safe Items
    for item_name in SAFE_ITEMS:
        src = SOURCE_DIR / item_name
        dst = DEST_DIR / item_name
        safe_copy(src, dst)

    # 2. Generate Placeholder
    generate_placeholder(DEST_DIR)

    # 3. 🔒 KILL SWITCH: Remove sensitive files from public mirror
    remove_sensitive_files(DEST_DIR)

    print_header("SYNC COMPLETE")
    print("Now go to D:\\JurisLink_Portfolio and run:")
    print("  git add .")
    print("  git commit -m 'Update portfolio demo'")
    print("  git push")

if __name__ == "__main__":
    main()
