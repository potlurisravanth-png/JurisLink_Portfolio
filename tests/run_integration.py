import subprocess
import time
import requests
import sys
import os
import signal
from colorama import init, Fore, Style

init()

# CONFIGURATION
PORT = 7071
HEALTH_URL = f"http://localhost:{PORT}"
MAX_RETRIES = 30
RETRY_DELAY = 1.0  # seconds

def log_info(msg):
    print(f"{Fore.CYAN}[ORCHESTRATOR]{Style.RESET_ALL} {msg}")

def log_success(msg):
    print(f"{Fore.GREEN}[ORCHESTRATOR] ✅ {msg}{Style.RESET_ALL}")

def log_error(msg):
    print(f"{Fore.RED}[ORCHESTRATOR] ❌ {msg}{Style.RESET_ALL}")

def wait_for_service(url, max_retries, delay):
    log_info(f"Polling {url} for health check...")
    for i in range(max_retries):
        try:
            response = requests.get(url, timeout=2)
            # The base function app URL returns 200 when alive.
            if response.status_code == 200:
                log_success(f"Service is healthy at {url}")
                return True
        except requests.exceptions.ConnectionError:
            pass
        except requests.exceptions.Timeout:
            pass
        
        time.sleep(delay)
        if i % 5 == 0 and i > 0:
            log_info(f"Still waiting for service... ({i}/{max_retries})")
            
    return False

def main():
    backend_process = None
    
    # 1. Start the Backend Service
    log_info(f"Starting Azure Functions backend on port {PORT}...")
    try:
        # Start in background. We use creationflags to create a new process group on Windows
        # so we can kill the entire tree cleanly if needed, or simply terminate it.
        backend_process = subprocess.Popen(
            ["func.cmd" if sys.platform == "win32" else "func", "start"],
            cwd=os.path.abspath(os.path.join(os.path.dirname(__file__), '..')),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if sys.platform == 'win32' else 0
        )
        
        # 2. Wait for health check
        if not wait_for_service(HEALTH_URL, MAX_RETRIES, RETRY_DELAY):
            log_error("Failed to reach backend service within the timeout. Aborting test run.")
            sys.exit(1)
            
        # 3. Run the live tests
        log_info("Running pytest integration tests against the live endpoint...")
        pytest_process = subprocess.run(
            [sys.executable, "-m", "pytest", "tests/test_state_persistence.py", "-v"],
            cwd=os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        )
        
        # Yield test exit code
        if pytest_process.returncode == 0:
            log_success("Integration tests PASSED.")
        else:
            log_error(f"Integration tests FAILED with code {pytest_process.returncode}.")
            
        sys.exit(pytest_process.returncode)

    except Exception as e:
        log_error(f"Orchestration error: {e}")
        sys.exit(1)
        
    finally:
        # 4. Graceful Teardown
        if backend_process:
            log_info(f"Terminating background Azure Functions process (PID: {backend_process.pid})...")
            if sys.platform == 'win32':
                # Windows requires sending CTRL_BREAK_EVENT to the process group to cleanly kill func start
                backend_process.send_signal(signal.CTRL_BREAK_EVENT)
            else:
                backend_process.terminate()
            
            try:
                backend_process.wait(timeout=5)
                log_success("Backend terminated cleanly.")
            except subprocess.TimeoutExpired:
                log_error("Backend did not terminate in time. Forcing kill...")
                backend_process.kill()

if __name__ == "__main__":
    main()
