"""
Context-Aware MCP (Model Context Protocol) Shared Context Store.

Replaces direct dict access to CaseState with scoped, per-agent views
that enforce read/write isolation. Each agent only sees the keys it is
authorized to read and can only write to its own output keys.

This prevents inter-agent context bloat and enforces clean contracts.
"""
import logging
from typing import Any, Dict, Optional, Set

# =============================================================================
# AGENT ACCESS CONTROL MATRIX
# =============================================================================

# Keys each agent is allowed to WRITE
AGENT_WRITE_KEYS: Dict[str, Set[str]] = {
    "intake_agent": {"messages", "case_facts", "next_step"},
    "researcher_agent": {"legal_research", "next_step", "error", "error_source"},
    "strategist_agent": {"strategy_brief", "next_step"},
    "critic_agent": {"critic_feedback", "next_step"},
    "assistant_agent": {"generated_docs", "next_step"},
}

# Keys each agent is allowed to READ (in addition to its own write keys)
# All agents can read messages, case_facts, and metadata
SHARED_READ_KEYS: Set[str] = {
    "messages", "case_facts", "language", "reasoning_trace",
    "iteration_count", "session_id", "next_step",
}

# Downstream agents can read upstream outputs
AGENT_READ_KEYS: Dict[str, Set[str]] = {
    "intake_agent": SHARED_READ_KEYS,
    "researcher_agent": SHARED_READ_KEYS | {"case_facts"},
    "strategist_agent": SHARED_READ_KEYS | {"case_facts", "legal_research"},
    "critic_agent": SHARED_READ_KEYS | {"case_facts", "legal_research", "strategy_brief"},
    "assistant_agent": SHARED_READ_KEYS | {"case_facts", "legal_research", "strategy_brief", "critic_feedback"},
}


# =============================================================================
# SCOPED CONTEXT VIEW
# =============================================================================

class ScopedContextView:
    """
    A scoped view into the shared context store for a specific agent.

    Provides read access to authorized keys and write access only to
    the agent's own output keys. Unauthorized access is logged and blocked.
    """

    def __init__(self, agent_name: str, store: "ContextStore"):
        self._agent_name = agent_name
        self._store = store
        self._read_keys = AGENT_READ_KEYS.get(agent_name, SHARED_READ_KEYS)
        self._write_keys = AGENT_WRITE_KEYS.get(agent_name, set())

    def get(self, key: str, default: Any = None) -> Any:
        """Read a value from the context store (read-access enforced)."""
        if key not in self._read_keys and key not in self._write_keys:
            logging.warning(
                f"[ContextStore] {self._agent_name} attempted unauthorized READ of '{key}'"
            )
            return default
        return self._store._data.get(key, default)

    def set(self, key: str, value: Any) -> None:
        """Write a value to the context store (write-access enforced)."""
        if key not in self._write_keys:
            logging.warning(
                f"[ContextStore] {self._agent_name} attempted unauthorized WRITE to '{key}'"
            )
            return
        self._store._data[key] = value

    def to_dict(self) -> dict:
        """Export only the readable keys as a plain dictionary."""
        readable = self._read_keys | self._write_keys
        return {k: v for k, v in self._store._data.items() if k in readable}

    def update(self, data: dict) -> dict:
        """
        Write multiple keys at once (write-access enforced per key).
        Returns only the keys that were successfully written.
        """
        written = {}
        for key, value in data.items():
            if key in self._write_keys:
                self._store._data[key] = value
                written[key] = value
            else:
                logging.warning(
                    f"[ContextStore] {self._agent_name} attempted unauthorized WRITE to '{key}'"
                )
        return written

    @property
    def agent_name(self) -> str:
        return self._agent_name


# =============================================================================
# CONTEXT STORE
# =============================================================================

class ContextStore:
    """
    Central context store wrapping the CaseState dictionary.

    Provides scoped views for each agent via agent_scope().
    Direct access to _data is still available for serialization
    and graph-level operations.
    """

    def __init__(self, initial_state: dict = None):
        self._data: dict = dict(initial_state) if initial_state else {}

    def agent_scope(self, agent_name: str) -> ScopedContextView:
        """
        Return a scoped view for the given agent.

        Args:
            agent_name: One of the agent names defined in AGENT_WRITE_KEYS.

        Returns:
            A ScopedContextView with enforced read/write access.
        """
        if agent_name not in AGENT_WRITE_KEYS:
            logging.warning(f"[ContextStore] Unknown agent: {agent_name}")
        return ScopedContextView(agent_name, self)

    @property
    def data(self) -> dict:
        """Direct access to the underlying state dict (for serialization)."""
        return self._data

    @data.setter
    def data(self, value: dict):
        self._data = value

    def to_case_state(self) -> dict:
        """Export the full state as a CaseState-compatible dict."""
        return dict(self._data)

    @classmethod
    def from_case_state(cls, state: dict) -> "ContextStore":
        """Create a ContextStore from an existing CaseState dict."""
        return cls(initial_state=state)
