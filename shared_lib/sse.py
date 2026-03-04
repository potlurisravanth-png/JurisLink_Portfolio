"""
SSE (Server-Sent Events) helper utilities for the AG-UI Protocol.

Provides formatting for SSE event streams and JSON Patch (RFC 6902) delta
computation between consecutive agent state snapshots.
"""
import json
import logging
from typing import Any


def format_sse_event(event_type: str, data: dict) -> str:
    """
    Format a dictionary as an SSE event string.

    Args:
        event_type: The SSE event name (e.g., "StateSnapshot", "StateDelta", "done").
        data: The payload dictionary to serialize as JSON.

    Returns:
        A properly formatted SSE event string ending with double newline.
    """
    json_data = json.dumps(data, default=str)
    return f"event: {event_type}\ndata: {json_data}\n\n"


def compute_state_delta(prev_state: dict, curr_state: dict) -> list:
    """
    Compute a JSON Patch (RFC 6902) diff between two serialized state dicts.

    Uses a lightweight inline implementation to avoid the `jsonpatch` dependency.
    Only computes top-level key diffs (add, replace, remove) which is sufficient
    for the flat CaseState structure.

    Args:
        prev_state: The previous serialized state dictionary.
        curr_state: The current serialized state dictionary.

    Returns:
        A list of JSON Patch operations (RFC 6902 format).
    """
    ops = []
    all_keys = set(list(prev_state.keys()) + list(curr_state.keys()))

    for key in all_keys:
        prev_val = prev_state.get(key)
        curr_val = curr_state.get(key)

        if key not in prev_state:
            ops.append({"op": "add", "path": f"/{key}", "value": curr_val})
        elif key not in curr_state:
            ops.append({"op": "remove", "path": f"/{key}"})
        elif prev_val != curr_val:
            ops.append({"op": "replace", "path": f"/{key}", "value": curr_val})

    return ops


def build_sse_stream(events: list) -> str:
    """
    Concatenate a list of (event_type, data) tuples into a single SSE stream.

    Args:
        events: List of (event_type, data_dict) tuples.

    Returns:
        Full SSE stream string.
    """
    return "".join(format_sse_event(etype, data) for etype, data in events)


def format_heartbeat() -> str:
    """
    Generate an SSE heartbeat event to prevent proxy timeouts.

    Per realtime-streaming skill R6: heartbeat every 15 seconds
    prevents proxy/CDN connection drops and detects stale clients.

    Returns:
        A formatted SSE heartbeat event string.
    """
    from datetime import datetime, timezone
    return format_sse_event("heartbeat", {
        "timestamp": datetime.now(timezone.utc).isoformat()
    })


# Heartbeat interval in seconds (per realtime-streaming skill R6)
HEARTBEAT_INTERVAL_SECONDS = 15

