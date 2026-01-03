
"""
VERIFICATION TEST - Refactor & Security
Tests function_app.py endpoints (mocked) and utils.py security without a live server.
"""
import sys
import json
import logging
from pathlib import Path
from unittest.mock import MagicMock, patch
import azure.functions as func
import pytest

# Add repo root to path
ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

# --- MOCK OPENAI & AGENTS BEFORE IMPORTS ---
# This prevents "API key not found" errors during module load for all agents
mock_obj = MagicMock()
sys.modules["langchain_openai"] = mock_obj
sys.modules["langchain_openai.chat_models"] = mock_obj
sys.modules["langchain_community.utilities.tavily_search"] = mock_obj

# Mock the agent modules themselves so function_app can import them without side effects
sys.modules["agent_intake.intake"] = MagicMock()
sys.modules["agent_researcher.researcher"] = MagicMock()
sys.modules["agent_strategist.strategist"] = MagicMock()
sys.modules["agent_critic.critic"] = MagicMock()
sys.modules["agent_assistant.writer"] = MagicMock()

from shared_lib.utils import get_secure_storage_path

# =============================================================================
# 1. SECURITY TESTS (utils.py)
# =============================================================================
def test_secure_path_valid():
    """Test valid alphanumeric IDs."""
    path = get_secure_storage_path("user123", "case456")
    assert "user123" in str(path)
    assert "case456" in str(path)

def test_secure_path_traversal_rejection():
    """Test strict rejection of path traversal attempts."""
    malicious_inputs = [
        ("../user", "case1"),
        ("user", "../case"),
        ("..", "case"),
        ("/etc/passwd", "case"),
        ("user", "C:\\Windows")
    ]
    
    for uid, cid in malicious_inputs:
        with pytest.raises(ValueError) as excinfo:
            get_secure_storage_path(uid, cid)
        assert "Security Warning" in str(excinfo.value) or "Security Error" in str(excinfo.value)

# =============================================================================
# 2. ENDPOINT TESTS (function_app.py)
# =============================================================================

@pytest.fixture
def mock_req():
    def _create_req(body):
        req = MagicMock(spec=func.HttpRequest)
        req.get_json.return_value = body
        req.method = "POST"
        return req
    return _create_req

def test_chat_invalid_json(mock_req):
    from function_app import chat_endpoint
    
    # Mock get_json to raise ValueError
    req = MagicMock(spec=func.HttpRequest)
    req.method = "POST"
    req.get_json.side_effect = ValueError("Invalid JSON")
    
    resp = chat_endpoint(req)
    assert resp.status_code == 400
    assert "Invalid JSON" in resp.get_body().decode()

def test_chat_missing_message(mock_req):
    from function_app import chat_endpoint
    
    req = mock_req({"language": "en"}) # No message
    resp = chat_endpoint(req)
    assert resp.status_code == 400
    assert "No message" in resp.get_body().decode()

@patch('function_app.build_graph')
def test_chat_graph_execution_error(mock_graph_builder, mock_req):
    """Test graceful failure (HTTP 500) when graph crashes."""
    from function_app import chat_endpoint
    
    # Mock graph to raise exception
    mock_app = MagicMock()
    mock_app.invoke.side_effect = Exception("OpenAI API Timeout")
    mock_graph_builder.return_value = mock_app
    
    req = mock_req({"message": "Hello"})
    
    resp = chat_endpoint(req)
    # Check for 500 as per refactor plan
    assert resp.status_code == 500
    body = json.loads(resp.get_body().decode())
    assert "response" in body
    assert "System Error" in body["response"]
    assert "error" in body
    assert "OpenAI API Timeout" in body["error"]

def test_download_security_violation(mock_req):
    """Test download endpoint rejects malicious paths (HTTP 400)."""
    from function_app import download_brief_endpoint
    
    req = mock_req({
        "user_id": "../hacker",
        "case_id": "case1",
        "facts": {},
    })
    
    # Needs to mock pdf_utils imports since they might fail in test env
    with patch('shared_lib.pdf_utils.get_existing_pdf_path') as mock_get_path:
        # Simulate logic in endpoint calling get_secure_storage_path indirectly
        # Actually endpoint calls get_existing_pdf_path which calls get_secure_storage_path
        # But we want to test the endpoint's handling of ValueError
        mock_get_path.side_effect = ValueError("Security Warning: malicious characters")
        
        resp = download_brief_endpoint(req)
        assert resp.status_code == 400
        assert "Security Violation" in resp.get_body().decode()

if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v"]))
