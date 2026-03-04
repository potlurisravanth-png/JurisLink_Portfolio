"""
Tests for the CA-MCP Shared Context Store.

Validates scoped read/write access, agent isolation, and unauthorized
key rejection.

Run with: pytest tests/test_context_store.py -v
"""
import json
import sys
import logging
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from shared_lib.context_store import (
    ContextStore,
    ScopedContextView,
    AGENT_WRITE_KEYS,
    AGENT_READ_KEYS,
)
from shared_lib.state import create_initial_state, to_context_store, from_context_store


# =============================================================================
# TEST 1: CONTEXT STORE CREATION
# =============================================================================

class TestContextStoreCreation:
    """Tests for ContextStore initialization and factory methods."""

    def test_create_empty_store(self):
        """Empty store initializes with empty dict."""
        store = ContextStore()
        assert store.data == {}

    def test_create_from_dict(self):
        """Store initializes with provided data."""
        data = {"messages": [], "case_facts": {"name": "Test"}}
        store = ContextStore(initial_state=data)
        assert store.data["case_facts"]["name"] == "Test"

    def test_from_case_state(self):
        """from_case_state class method creates store correctly."""
        state = create_initial_state()
        store = ContextStore.from_case_state(state)
        assert store.data["language"] == "en"
        assert store.data["iteration_count"] == 1

    def test_to_case_state(self):
        """to_case_state exports a plain dict."""
        store = ContextStore({"a": 1, "b": 2})
        result = store.to_case_state()
        assert isinstance(result, dict)
        assert result["a"] == 1


# =============================================================================
# TEST 2: SCOPED READ ACCESS
# =============================================================================

class TestScopedReadAccess:
    """Tests for agent-scoped read access."""

    def test_intake_reads_shared_keys(self):
        """Intake can read messages and case_facts."""
        state = create_initial_state()
        store = ContextStore.from_case_state(state)
        scope = store.agent_scope("intake_agent")
        assert scope.get("messages") == []
        assert scope.get("language") == "en"

    def test_researcher_reads_case_facts(self):
        """Researcher can read case_facts from upstream."""
        store = ContextStore({"case_facts": {"name": "John"}, "messages": []})
        scope = store.agent_scope("researcher_agent")
        assert scope.get("case_facts") == {"name": "John"}

    def test_strategist_reads_research(self):
        """Strategist can read legal_research from upstream."""
        store = ContextStore({
            "case_facts": {},
            "legal_research": "Some research",
            "messages": [],
        })
        scope = store.agent_scope("strategist_agent")
        assert scope.get("legal_research") == "Some research"

    def test_critic_reads_strategy(self):
        """Critic can read strategy_brief from upstream."""
        store = ContextStore({
            "case_facts": {},
            "legal_research": "Research",
            "strategy_brief": "Strategy",
            "messages": [],
        })
        scope = store.agent_scope("critic_agent")
        assert scope.get("strategy_brief") == "Strategy"

    def test_assistant_reads_all_upstream(self):
        """Assistant can read all upstream outputs."""
        store = ContextStore({
            "case_facts": {},
            "legal_research": "Research",
            "strategy_brief": "Strategy",
            "critic_feedback": "Feedback",
            "messages": [],
        })
        scope = store.agent_scope("assistant_agent")
        assert scope.get("legal_research") == "Research"
        assert scope.get("strategy_brief") == "Strategy"
        assert scope.get("critic_feedback") == "Feedback"


# =============================================================================
# TEST 3: SCOPED WRITE ACCESS
# =============================================================================

class TestScopedWriteAccess:
    """Tests for agent-scoped write access."""

    def test_intake_writes_case_facts(self):
        """Intake can write to case_facts."""
        store = ContextStore({"case_facts": {}})
        scope = store.agent_scope("intake_agent")
        scope.set("case_facts", {"name": "Written by intake"})
        assert store.data["case_facts"]["name"] == "Written by intake"

    def test_researcher_writes_research(self):
        """Researcher can write to legal_research."""
        store = ContextStore({"legal_research": None})
        scope = store.agent_scope("researcher_agent")
        scope.set("legal_research", "New research")
        assert store.data["legal_research"] == "New research"

    def test_batch_update(self):
        """Batch update writes only authorized keys."""
        store = ContextStore({"next_step": None, "strategy_brief": None})
        scope = store.agent_scope("strategist_agent")
        written = scope.update({
            "strategy_brief": "My strategy",
            "next_step": "critic",
            "legal_research": "SHOULD NOT WRITE",  # Not authorized
        })
        assert "strategy_brief" in written
        assert "next_step" in written
        assert "legal_research" not in written
        assert store.data.get("legal_research") is None


# =============================================================================
# TEST 4: UNAUTHORIZED ACCESS REJECTION
# =============================================================================

class TestUnauthorizedAccess:
    """Tests for unauthorized access logging and rejection."""

    def test_intake_cannot_read_strategy(self, caplog):
        """Intake is blocked from reading strategy_brief."""
        store = ContextStore({"strategy_brief": "Secret strategy"})
        scope = store.agent_scope("intake_agent")
        with caplog.at_level(logging.WARNING):
            result = scope.get("strategy_brief")
        assert result is None  # Returns default
        assert "unauthorized READ" in caplog.text

    def test_researcher_cannot_write_case_facts(self, caplog):
        """Researcher is blocked from writing to case_facts."""
        store = ContextStore({"case_facts": {"original": True}})
        scope = store.agent_scope("researcher_agent")
        with caplog.at_level(logging.WARNING):
            scope.set("case_facts", {"hacked": True})
        assert store.data["case_facts"]["original"] is True  # Unchanged
        assert "unauthorized WRITE" in caplog.text

    def test_critic_cannot_write_research(self, caplog):
        """Critic is blocked from writing to legal_research."""
        store = ContextStore({"legal_research": "Original"})
        scope = store.agent_scope("critic_agent")
        with caplog.at_level(logging.WARNING):
            scope.set("legal_research", "Tampered")
        assert store.data["legal_research"] == "Original"


# =============================================================================
# TEST 5: BRIDGE METHODS
# =============================================================================

class TestBridgeMethods:
    """Tests for to_context_store / from_context_store in state.py."""

    def test_roundtrip(self):
        """State -> ContextStore -> State preserves data."""
        state = create_initial_state(language="es")
        store = to_context_store(state)
        assert isinstance(store, ContextStore)
        result = from_context_store(store)
        assert result["language"] == "es"
        assert result["iteration_count"] == 1

    def test_to_dict_exports_readable_keys_only(self):
        """to_dict on a scoped view only returns readable keys."""
        store = ContextStore({
            "messages": [],
            "case_facts": {},
            "legal_research": "Research",
            "strategy_brief": "Strategy",
            "critic_feedback": "Critic",
            "generated_docs": {"demand_letter": "PDF"},
            "next_step": None,
            "language": "en",
        })
        # Researcher should NOT see strategy_brief or critic_feedback
        scope = store.agent_scope("researcher_agent")
        view = scope.to_dict()
        assert "case_facts" in view
        assert "messages" in view
        assert "strategy_brief" not in view
        assert "critic_feedback" not in view
