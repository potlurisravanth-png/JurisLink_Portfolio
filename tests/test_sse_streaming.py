"""
Tests for the AG-UI SSE Protocol.

Validates SSE event formatting, JSON Patch delta computation,
and the streaming endpoint's event sequence.

Run with: pytest tests/test_sse_streaming.py -v
"""
import json
import sys
import os
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from shared_lib.sse import format_sse_event, compute_state_delta, build_sse_stream


# =============================================================================
# TEST 1: SSE EVENT FORMATTING
# =============================================================================

class TestSSEFormatting:
    """Tests for format_sse_event helper."""

    def test_basic_event_format(self):
        """Verify SSE event has correct format with event and data lines."""
        result = format_sse_event("StateSnapshot", {"node": "intake_agent"})
        assert result.startswith("event: StateSnapshot\n")
        assert "data: " in result
        assert result.endswith("\n\n")

    def test_event_data_is_valid_json(self):
        """Verify the data line contains valid JSON."""
        result = format_sse_event("StateDelta", {"patch": [{"op": "replace"}]})
        data_line = result.split("\n")[1]
        json_str = data_line.replace("data: ", "")
        parsed = json.loads(json_str)
        assert parsed["patch"] == [{"op": "replace"}]

    def test_done_event(self):
        """Verify done event includes response and status."""
        result = format_sse_event("done", {
            "response": "Test response",
            "status": "success"
        })
        assert "event: done" in result
        data_line = result.split("\n")[1]
        parsed = json.loads(data_line.replace("data: ", ""))
        assert parsed["status"] == "success"
        assert parsed["response"] == "Test response"

    def test_error_event(self):
        """Verify error event format."""
        result = format_sse_event("error", {
            "node": "researcher_agent",
            "error": "API timeout"
        })
        assert "event: error" in result
        data_line = result.split("\n")[1]
        parsed = json.loads(data_line.replace("data: ", ""))
        assert parsed["node"] == "researcher_agent"
        assert parsed["error"] == "API timeout"


# =============================================================================
# TEST 2: STATE DELTA COMPUTATION
# =============================================================================

class TestStateDelta:
    """Tests for compute_state_delta (JSON Patch generation)."""

    def test_no_changes(self):
        """No patch ops when states are identical."""
        state = {"key": "value", "num": 42}
        delta = compute_state_delta(state, state)
        assert delta == []

    def test_value_replaced(self):
        """Replace op emitted when a value changes."""
        prev = {"status": "pending", "count": 1}
        curr = {"status": "complete", "count": 1}
        delta = compute_state_delta(prev, curr)
        assert len(delta) == 1
        assert delta[0]["op"] == "replace"
        assert delta[0]["path"] == "/status"
        assert delta[0]["value"] == "complete"

    def test_key_added(self):
        """Add op emitted when a new key appears."""
        prev = {"existing": "value"}
        curr = {"existing": "value", "new_key": "new_value"}
        delta = compute_state_delta(prev, curr)
        assert len(delta) == 1
        assert delta[0]["op"] == "add"
        assert delta[0]["path"] == "/new_key"

    def test_key_removed(self):
        """Remove op emitted when a key disappears."""
        prev = {"keep": "yes", "remove_me": "bye"}
        curr = {"keep": "yes"}
        delta = compute_state_delta(prev, curr)
        assert len(delta) == 1
        assert delta[0]["op"] == "remove"
        assert delta[0]["path"] == "/remove_me"

    def test_multiple_changes(self):
        """Multiple ops emitted for multiple changes."""
        prev = {"a": 1, "b": 2, "c": 3}
        curr = {"a": 1, "b": 99, "d": 4}
        delta = compute_state_delta(prev, curr)
        ops = {d["op"] for d in delta}
        paths = {d["path"] for d in delta}
        assert "replace" in ops  # b changed
        assert "add" in ops      # d added
        assert "remove" in ops   # c removed
        assert "/b" in paths
        assert "/c" in paths
        assert "/d" in paths

    def test_none_to_value(self):
        """Replace op when None becomes a value."""
        prev = {"research": None}
        curr = {"research": "Legal analysis..."}
        delta = compute_state_delta(prev, curr)
        assert len(delta) == 1
        assert delta[0]["op"] == "replace"
        assert delta[0]["value"] == "Legal analysis..."


# =============================================================================
# TEST 3: SSE STREAM BUILDER
# =============================================================================

class TestSSEStreamBuilder:
    """Tests for build_sse_stream helper."""

    def test_empty_events(self):
        """Empty event list produces empty string."""
        result = build_sse_stream([])
        assert result == ""

    def test_multiple_events(self):
        """Multiple events are concatenated correctly."""
        events = [
            ("StateSnapshot", {"node": "init"}),
            ("StateDelta", {"patch": []}),
            ("done", {"status": "success"}),
        ]
        result = build_sse_stream(events)
        assert result.count("event: ") == 3
        assert "event: StateSnapshot" in result
        assert "event: StateDelta" in result
        assert "event: done" in result

    def test_event_order_preserved(self):
        """Events appear in the order they were added."""
        events = [
            ("first", {"n": 1}),
            ("second", {"n": 2}),
            ("third", {"n": 3}),
        ]
        result = build_sse_stream(events)
        first_pos = result.index("event: first")
        second_pos = result.index("event: second")
        third_pos = result.index("event: third")
        assert first_pos < second_pos < third_pos
