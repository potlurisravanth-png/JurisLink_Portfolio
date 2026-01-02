"""
LOCAL ORCHESTRATOR - JurisLink One-Click Start
Launches the entire local development environment with a single command.

Usage:
    python maintenance/start_local.py

What it does:
    1. Verifies .env is configured for local development
    2. Starts Azure Functions backend (new terminal)
    3. Starts Vite frontend dev server (new terminal)
    4. Opens browser to http://localhost:5173
"""
import subprocess
import os
import sys
import time
import webbrowser
from pathlib import Path

# =============================================================================
# CONFIGURATION
# =============================================================================
ROOT = Path(__file__).parent.parent
FRONTEND_DIR = ROOT / "frontend_portal"
BACKEND_URL_LOCAL = "http://localhost:7071/api/chat"
FRONTEND_URL = "http://localhost:5173"

# Windows flag to open new console window
CREATE_NEW_CONSOLE = subprocess.CREATE_NEW_CONSOLE if sys.platform == 'win32' else 0


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================
def check_env_config():
    """Ensure frontend is configured for local development."""
    env_file = FRONTEND_DIR / ".env"
    env_local = FRONTEND_DIR / ".env.local"
    
    # Check if .env.local exists (takes precedence)
    if env_local.exists():
        print("  📄 Found .env.local - using local overrides")
        return True
    
    # Check api.js for hardcoded Azure URL
    api_js = FRONTEND_DIR / "src" / "api.js"
    if api_js.exists():
        content = api_js.read_text()
        if "azurewebsites.net" in content and "localhost" not in content:
            print("  ⚠️ WARNING: api.js points to Azure, not localhost!")
            print(f"     Creating .env.local to override...")
            
            # Create .env.local to override
            env_local.write_text(f"VITE_API_URL={BACKEND_URL_LOCAL}\n")
            print(f"     ✅ Created .env.local with VITE_API_URL={BACKEND_URL_LOCAL}")
            return True
    
    # Check .env file
    if env_file.exists():
        content = env_file.read_text()
        if "VITE_API_URL" in content:
            if "localhost" in content or "127.0.0.1" in content:
                print("  ✅ .env is configured for local development")
                return True
            else:
                print("  ⚠️ .env points to remote URL. Creating .env.local override...")
                env_local.write_text(f"VITE_API_URL={BACKEND_URL_LOCAL}\n")
                print(f"     ✅ Created .env.local")
                return True
    
    # No .env - create .env.local
    print("  📝 No .env found. Creating .env.local for local dev...")
    env_local.write_text(f"VITE_API_URL={BACKEND_URL_LOCAL}\n")
    print(f"     ✅ Created .env.local")
    return True


def start_backend():
    """Launch Azure Functions backend in new terminal."""
    print("  🔌 Starting Backend (Azure Functions)...")
    
    if sys.platform == 'win32':
        # Windows: Open in new console window
        subprocess.Popen(
            'func start',
            cwd=str(ROOT),
            creationflags=CREATE_NEW_CONSOLE,
            shell=True
        )
    else:
        # macOS/Linux: Use gnome-terminal or xterm
        subprocess.Popen(
            ['gnome-terminal', '--', 'func', 'start'],
            cwd=str(ROOT)
        )
    
    print("     ✅ Backend starting on http://localhost:7071")


def start_frontend():
    """Launch Vite dev server in new terminal."""
    print("  🎨 Starting Frontend (Vite)...")
    
    if sys.platform == 'win32':
        subprocess.Popen(
            'npm run dev',
            cwd=str(FRONTEND_DIR),
            creationflags=CREATE_NEW_CONSOLE,
            shell=True
        )
    else:
        subprocess.Popen(
            ['gnome-terminal', '--', 'npm', 'run', 'dev'],
            cwd=str(FRONTEND_DIR)
        )
    
    print(f"     ✅ Frontend starting on {FRONTEND_URL}")


def open_browser():
    """Open browser after servers start."""
    print("  🌍 Opening browser in 5 seconds...")
    time.sleep(5)
    webbrowser.open(FRONTEND_URL)
    print(f"     ✅ Opened {FRONTEND_URL}")


# =============================================================================
# MAIN
# =============================================================================
def main():
    print("=" * 60)
    print("  🚀 JURISLINK - LOCAL DEVELOPMENT ORCHESTRATOR")
    print("=" * 60)
    
    # 1. Check environment configuration
    print("\n📋 Checking configuration...")
    check_env_config()
    
    # 2. Start backend
    print("\n🔧 Launching services...")
    start_backend()
    
    # Give backend a moment to start
    time.sleep(2)
    
    # 3. Start frontend
    start_frontend()
    
    # 4. Open browser
    print("\n🌐 Launching browser...")
    open_browser()
    
    # 5. Summary
    print("\n" + "=" * 60)
    print("  ✅ LOCAL ENVIRONMENT ONLINE")
    print("=" * 60)
    print(f"""
  📍 Frontend: {FRONTEND_URL}
  📍 Backend:  http://localhost:7071/api/chat
  
  📝 Two new terminal windows should have opened:
     - "func start" (Backend logs)
     - "npm run dev" (Frontend logs)
  
  🛑 To stop: Close both terminal windows or press Ctrl+C in each.
""")


if __name__ == "__main__":
    main()
