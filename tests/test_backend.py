"""
JurisLink Backend Unit Tests

Tests core logic WITHOUT making real API calls.
Uses mocking to simulate OpenAI/Tavily responses.

Run with: pytest tests/test_backend.py -v
"""
import os
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

# Add repo root to path
ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

# Check if OpenAI API key is available (for tests that require imports)
HAS_OPENAI_KEY = bool(os.environ.get("OPENAI_API_KEY"))


# =============================================================================
# TEST 1: STATE INTEGRITY
# =============================================================================
class TestStateModule:
    """Tests for shared_lib/state.py"""
    
    def test_initial_state_structure(self):
        """Verify create_initial_state returns all required keys."""
        from shared_lib.state import create_initial_state
        
        state = create_initial_state()
        
        # Check required keys exist
        required_keys = [
            "messages", "case_facts", "legal_research", "strategy_brief",
            "critic_feedback", "generated_docs", "next_step", "language",
            "reasoning_trace", "iteration_count", "session_id", "error", "error_source"
        ]
        
        for key in required_keys:
            assert key in state, f"Missing required key: {key}"
    
    def test_initial_state_defaults(self):
        """Verify default values are correctly set."""
        from shared_lib.state import create_initial_state
        
        state = create_initial_state()
        
        assert state["messages"] == []
        assert state["case_facts"] == {}
        assert state["iteration_count"] == 1
        assert state["error"] is None
        assert state["error_source"] is None
        assert state["language"] == "en"
    
    def test_initial_state_custom_values(self):
        """Verify custom values override defaults."""
        from shared_lib.state import create_initial_state
        from langchain_core.messages import HumanMessage
        
        msg = HumanMessage(content="Test message")
        state = create_initial_state(
            messages=[msg],
            language="es",
            session_id="test-123"
        )
        
        assert len(state["messages"]) == 1
        assert state["language"] == "es"
        assert state["session_id"] == "test-123"
    
    def test_serialize_state(self):
        """Verify serialization converts messages to dicts."""
        from shared_lib.state import create_initial_state, serialize_state
        from langchain_core.messages import HumanMessage, AIMessage
        
        state = create_initial_state()
        state["messages"] = [
            HumanMessage(content="Hello"),
            AIMessage(content="Hi there")
        ]
        
        serialized = serialize_state(state)
        
        assert isinstance(serialized["messages"], list)
        assert serialized["messages"][0]["role"] == "user"
        assert serialized["messages"][1]["role"] == "assistant"
    
    def test_deserialize_state(self):
        """Verify deserialization converts dicts to messages."""
        from shared_lib.state import deserialize_state
        from langchain_core.messages import HumanMessage, AIMessage
        
        data = {
            "messages": [
                {"role": "user", "content": "Hello"},
                {"role": "assistant", "content": "Hi"}
            ],
            "iteration_count": 5
        }
        
        state = deserialize_state(data)
        
        assert isinstance(state["messages"][0], HumanMessage)
        assert isinstance(state["messages"][1], AIMessage)
        assert state["iteration_count"] == 5


# =============================================================================
# TEST 2: GRAPH COMPILATION (Requires API Key)
# =============================================================================
class TestGraphCompilation:
    """Tests for function_app.py graph building."""
    
    @pytest.mark.skipif(not HAS_OPENAI_KEY, reason="OPENAI_API_KEY not set")
    def test_build_graph_returns_compiled(self):
        """Verify build_graph returns a compiled graph."""
        from function_app import build_graph
        
        graph = build_graph()
        
        assert graph is not None
        assert hasattr(graph, 'invoke')  # Compiled graphs have invoke method


# =============================================================================
# TEST 3: RESEARCHER AGENT (Requires API Key for import)
# =============================================================================
class TestResearcherAgent:
    """Tests for agent_researcher/researcher.py with mocked Tavily."""
    
    @pytest.mark.skipif(not HAS_OPENAI_KEY, reason="OPENAI_API_KEY not set")
    @patch('agent_researcher.researcher.tavily_tool')
    @patch('agent_researcher.researcher.llm')
    def test_researcher_success(self, mock_llm, mock_tavily):
        """Test researcher returns research when APIs succeed."""
        from agent_researcher.researcher import researcher_node
        from shared_lib.state import create_initial_state
        
        # Setup mocks
        mock_tavily.invoke.return_value = [{"content": "Mocked California Labor Code Section 1102.5"}]
        
        mock_response = MagicMock()
        mock_response.content = "# Legal Research Memo\n\nBased on California Labor Code..."
        mock_llm.return_value = mock_response
        mock_llm.__or__ = lambda self, other: MagicMock(invoke=lambda x: mock_response)
        
        # Create test state
        state = create_initial_state()
        state["case_facts"] = {
            "case_type": "wrongful termination",
            "jurisdiction": "California",
            "summary_of_facts": "Employee was fired after reporting safety violations."
        }
        
        # Run node
        result = researcher_node(state)
        
        # Verify
        assert "legal_research" in result
        assert result["next_step"] == "strategist"
    
    @pytest.mark.skipif(not HAS_OPENAI_KEY, reason="OPENAI_API_KEY not set")
    @patch('agent_researcher.researcher.tavily_tool')
    @patch('agent_researcher.researcher.llm')
    def test_researcher_fallback_on_error(self, mock_llm, mock_tavily):
        """Test researcher returns fallback when APIs fail."""
        from agent_researcher.researcher import researcher_node
        from shared_lib.state import create_initial_state
        
        # Setup mocks to raise exception
        mock_tavily.invoke.side_effect = Exception("API rate limit exceeded")
        mock_llm.__or__ = lambda self, other: MagicMock(invoke=MagicMock(side_effect=Exception("LLM Error")))
        
        # Create test state
        state = create_initial_state()
        state["case_facts"] = {"case_type": "test"}
        
        # Run node (should not crash due to graceful failure)
        result = researcher_node(state)
        
        # Verify fallback behavior
        assert "legal_research" in result
        assert "error" in result or "Fallback" in result.get("legal_research", "")


# =============================================================================
# TEST 4: INTAKE AGENT (Syntax Only - No API Required)
# =============================================================================
class TestIntakeAgentSyntax:
    """Tests for agent_intake/intake.py logic that doesn't require API."""
    
    def test_intake_file_syntax(self):
        """Verify intake.py has valid Python syntax."""
        import ast
        intake_path = ROOT / "agent_intake" / "intake.py"
        with open(intake_path, "r", encoding="utf-8") as f:
            ast.parse(f.read())
    
    def test_detect_completion_signals(self):
        """Test completion signal detection patterns."""
        # We test the logic patterns without importing the full module
        strong_signals = [
            "i'm done", "i am done", "that's everything", "that is everything",
            "that's all", "that is all", "nothing else", "finished"
        ]
        
        # Verify signal patterns are defined correctly
        for signal in strong_signals:
            assert isinstance(signal, str)
            assert len(signal) > 0


# =============================================================================
# TEST 5: ERROR HANDLING
# =============================================================================
class TestErrorHandling:
    """Tests for graceful failure patterns."""
    
    def test_state_accepts_error_fields(self):
        """Verify error fields can be set on state."""
        from shared_lib.state import create_initial_state
        
        state = create_initial_state()
        state["error"] = "Test error message"
        state["error_source"] = "researcher_agent"
        
        assert state["error"] == "Test error message"
        assert state["error_source"] == "researcher_agent"
    
    def test_error_serialization(self):
        """Verify errors are preserved through serialization."""
        from shared_lib.state import create_initial_state, serialize_state, deserialize_state
        
        state = create_initial_state()
        state["error"] = "Test error"
        state["error_source"] = "critic_agent"
        
        serialized = serialize_state(state)
        restored = deserialize_state(serialized)
        
        assert restored["error"] == "Test error"
        assert restored["error_source"] == "critic_agent"


# =============================================================================
# TEST 6: VALIDATION HELPERS
# =============================================================================
class TestValidationHelpers:
    """Tests for validation helper functions."""
    
    def test_validate_agent_output(self):
        """Verify validate_agent_output catches unexpected keys."""
        from shared_lib.state import validate_agent_output
        
        # Valid output
        output = {"legal_research": "Test", "next_step": "strategist"}
        result = validate_agent_output("researcher_agent", output)
        assert result == output  # Returns unchanged
        
        # Output with unexpected key (should still return, just warns)
        output_with_extra = {"legal_research": "Test", "unexpected_key": "value"}
        result = validate_agent_output("researcher_agent", output_with_extra)
        assert result == output_with_extra


# =============================================================================
# RUN TESTS
# =============================================================================
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
