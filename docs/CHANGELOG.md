# Changelog

All notable changes to JurisLink will be documented in this file.

## [V2.1.0] - 2025-12-27 - Production Release

### Added
- **Adversarial Core:** Implemented Critic/Strategist loop for refined legal analysis
- **UI Overhaul:** Gemini-style streaming, auto-expanding inputs, mobile responsiveness
- **Cloud Infrastructure:** Azure Functions (Backend) + Static Web Apps (Frontend)
- **CI/CD Pipeline:** GitHub Actions for auto-deployment and portfolio sync
- **Security:** Private/Public repo separation with automated redaction
- **Error Handling:** Graceful failure with ErrorCard UI component
- **Type Safety:** Strict TypedDict contracts with validation helpers
- **Build Optimization:** Vite chunk splitting (largest chunk: 187kB)

### Infrastructure
- **Backend URL:** `https://jurislink-api.azurewebsites.net`
- **Frontend URL:** `https://ambitious-sand-078aabe0f.4.azurestaticapps.net`
- **Cost:** Free tier (Storage ~$0.02/month only)

### Files Added
- `.github/workflows/deploy_and_sync.yml` - CI/CD pipeline
- `maintenance/deploy_infrastructure.py` - Azure provisioning
- `maintenance/deploy_frontend.py` - SWA deployment
- `maintenance/test_imports.py` - Smoke tests
- `tests/test_backend.py` - Unit tests (10 tests)
- `frontend_portal/staticwebapp.config.json` - SPA routing
- `.env.example` - Environment template

---

## [V2.0.0] - 2025-12-21 - Multi-Agent System

### Added
- **Multi-Agent Architecture:** Intake, Researcher, Strategist, Critic, Writer agents
- **Tavily Integration:** Real-time legal research via web search
- **PDF Generation:** Demand letters and reasoning memos
- **React Frontend:** ChatGPT-style dark theme interface
- **State Management:** LangGraph with CaseState TypedDict

---

## [V1.0.0] - 2025-12-15 - Initial Release

### Added
- Basic legal assistant with single GPT-4 agent
- Simple chat interface
- Azure Functions backend
