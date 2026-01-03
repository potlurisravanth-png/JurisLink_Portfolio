"""
Database Module for JurisLink - Azure Cosmos DB
Handles user session persistence with complete isolation between users.
"""
import os
import json
import logging
from datetime import datetime, timezone
from typing import List, Dict, Optional, Any
from azure.cosmos import CosmosClient, PartitionKey, exceptions

# Configuration
COSMOS_CONNECTION = os.environ.get("COSMOS_DB_CONNECTION_STRING")
DATABASE_NAME = "jurislink"
CONTAINER_NAME = "sessions"

# Cached client
_client = None
_container = None


def get_container():
    """Get or create the Cosmos DB container."""
    global _client, _container
    
    if _container is not None:
        return _container
    
    if not COSMOS_CONNECTION:
        logging.warning("COSMOS_CONNECTION_STRING not set. Using in-memory fallback.")
        return None
    
    try:
        _client = CosmosClient.from_connection_string(COSMOS_CONNECTION)
        database = _client.create_database_if_not_exists(DATABASE_NAME)
        _container = database.create_container_if_not_exists(
            id=CONTAINER_NAME,
            partition_key=PartitionKey(path="/user_id"),
            offer_throughput=400  # Minimum RU/s
        )
        logging.info(f"Connected to Cosmos DB: {DATABASE_NAME}/{CONTAINER_NAME}")
        return _container
    except Exception as e:
        logging.error(f"Cosmos DB connection failed: {e}")
        return None


# In-memory fallback for development
_memory_store: Dict[str, Dict[str, Any]] = {}


def _get_memory_key(user_id: str, session_id: str) -> str:
    return f"{user_id}:{session_id}"


def get_user_sessions(user_id: str) -> List[Dict]:
    """
    Get all session summaries for a user.
    Returns list of {id, title, date, timestamp} objects.
    """
    container = get_container()
    
    if container is None:
        # In-memory fallback
        sessions = []
        for key, data in _memory_store.items():
            if key.startswith(f"{user_id}:"):
                sessions.append({
                    "id": data.get("session_id"),
                    "title": data.get("title", "New Consultation"),
                    "date": data.get("date"),
                    "timestamp": data.get("timestamp"),
                    "isRenamed": data.get("isRenamed", False)
                })
        return sorted(sessions, key=lambda x: x.get("timestamp", 0), reverse=True)
    
    try:
        query = "SELECT c.session_id, c.title, c.date, c.timestamp, c.isRenamed FROM c WHERE c.user_id = @user_id"
        items = list(container.query_items(
            query=query,
            parameters=[{"name": "@user_id", "value": user_id}],
            enable_cross_partition_query=False
        ))
        
        # Transform to expected format
        sessions = [{
            "id": item["session_id"],
            "title": item.get("title", "New Consultation"),
            "date": item.get("date"),
            "timestamp": item.get("timestamp"),
            "isRenamed": item.get("isRenamed", False)
        } for item in items]
        
        return sorted(sessions, key=lambda x: x.get("timestamp", 0), reverse=True)
    except Exception as e:
        logging.error(f"Failed to get sessions for user {user_id}: {e}")
        return []


def get_session(user_id: str, session_id: str) -> Optional[Dict]:
    """Get full session data for a specific session."""
    container = get_container()
    
    if container is None:
        key = _get_memory_key(user_id, session_id)
        return _memory_store.get(key)
    
    try:
        item = container.read_item(item=session_id, partition_key=user_id)
        return item
    except exceptions.CosmosResourceNotFoundError:
        return None
    except Exception as e:
        logging.error(f"Failed to get session {session_id}: {e}")
        return None


def save_session(user_id: str, session_id: str, data: Dict) -> bool:
    """Save or update a session."""
    container = get_container()
    
    # Prepare document
    doc = {
        "id": session_id,
        "session_id": session_id,
        "user_id": user_id,
        "title": data.get("title", "New Consultation"),
        "date": data.get("date", datetime.now(timezone.utc).strftime("%m/%d/%Y")),
        "timestamp": data.get("timestamp", int(datetime.now(timezone.utc).timestamp() * 1000)),
        "isRenamed": data.get("isRenamed", False),
        "messages": data.get("messages", []),
        "facts": data.get("facts", {}),
        "strategy": data.get("strategy"),
        "backendState": data.get("backendState"),
        "updatedAt": datetime.now(timezone.utc).isoformat()
    }
    
    if container is None:
        key = _get_memory_key(user_id, session_id)
        _memory_store[key] = doc
        return True
    
    try:
        container.upsert_item(doc)
        return True
    except Exception as e:
        logging.error(f"Failed to save session {session_id}: {e}")
        return False


def delete_session(user_id: str, session_id: str) -> bool:
    """Delete a session."""
    container = get_container()
    
    if container is None:
        key = _get_memory_key(user_id, session_id)
        if key in _memory_store:
            del _memory_store[key]
        return True
    
    try:
        container.delete_item(item=session_id, partition_key=user_id)
        return True
    except exceptions.CosmosResourceNotFoundError:
        return True  # Already deleted
    except Exception as e:
        logging.error(f"Failed to delete session {session_id}: {e}")
        return False


def rename_session(user_id: str, session_id: str, new_title: str) -> bool:
    """Rename a session."""
    session = get_session(user_id, session_id)
    if session:
        session["title"] = new_title
        session["isRenamed"] = True
        return save_session(user_id, session_id, session)
    return False
