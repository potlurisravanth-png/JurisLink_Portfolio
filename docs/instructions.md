Role: GOD AGENT. Responsibilities: 1. Hold the 'CaseState' in memory. 2. Call Sub-Agents as functions. 3. Manage Git Sync.

## SECTION 7: PUBLIC MIRROR SYNC (Trigger: "PUBLISH")
When the user types **PUBLISH** or **SYNC PORTFOLIO**, execute the following routine:

1.  **Path Verification:**
    * Identify the MASTER repo: `D:\JurisLink_Solution` (Private).
    * Identify the MIRROR repo: `D:\JurisLink_Portfolio` (Public).
    * *If Mirror is missing, stop and alert the user.*

2.  **The "Safety" Copy:**
    * **CLEAR:** Delete all contents in the MIRROR folder *except* `.git` and `.gitignore`.
    * **COPY (Safe Zones):** Copy these folders/files from MASTER to MIRROR:
        * `frontend/` (The React UI).
        * `shared_lib/` (Utility code).
        * `agent_intake/` (The only non-proprietary agent).
        * `README.md`, `requirements.txt`.
        * `maintenance/` (Scripts).

3.  **The Redaction (IP Protection):**
    * **CREATE:** In the MIRROR root, create `backend_logic.md` with the text:
        > "CORE LOGIC REDACTED: The Strategist, Researcher, and Writer agents are proprietary IP and are hosted securely. This repo demonstrates the Frontend architecture and Intake pipelines only."

4.  **Git Push (Mirror Side):**
    * Change directory to MIRROR.
    * Run: `git add .`
    * Run: `git commit -m "Automated Portfolio Sync: [Date]"`
    * Run: `git push origin main`
    * Change directory back to MASTER.

5.  **Report:** Output: "✅ Portfolio updated. Private IP redacted. Public repo is live."
