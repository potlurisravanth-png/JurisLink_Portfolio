"""
Shared State Definition for JurisLink Multi-Agent System.
This is the "CaseState" that gets passed between all agents.
"""
from typing import TypedDict, List, Optional, Any
from langchain_core.messages import BaseMessage


class CaseState(TypedDict, total=False):
    """
    The central state object that flows through the LangGraph.
    Each agent can read from and write to this state.
    """
    # ---------------------------------------------------------
    # CORE CONVERSATION STATE
    # ---------------------------------------------------------
    messages: List[BaseMessage]  # The chat history (LangChain message objects)
    
    # ---------------------------------------------------------
    # INTAKE AGENT OUTPUT
    # ---------------------------------------------------------
    case_facts: dict  # The extracted facts JSON from Intake
    # Expected keys after completion:
    # - status: "COMPLETE" | "IN_PROGRESS"
    # - client_name: str
    # - opposing_party: str
    # - incident_date: str
    # - jurisdiction: str
    # - summary_of_facts: str
    
    # ---------------------------------------------------------
    # RESEARCHER AGENT OUTPUT
    # ---------------------------------------------------------
    legal_research: Optional[str]  # Markdown memo from Researcher
    
    # ---------------------------------------------------------
    # STRATEGIST AGENT OUTPUT
    # ---------------------------------------------------------
    strategy_brief: Optional[str]  # Strategy_Brief.md content
    
    # ---------------------------------------------------------
    # LITIGATION ASSISTANT OUTPUT
    # ---------------------------------------------------------
    document_bytes: Optional[bytes]  # The generated .docx file
    document_name: Optional[str]  # e.g., "Civil_Complaint.docx"
    generated_docs: Optional[dict]  # Dict with base64-encoded docs {"demand_letter": "base64..."}
    
    # ---------------------------------------------------------
    # ROUTING CONTROL
    # ---------------------------------------------------------
    next_step: Optional[str]  # Which agent to call next ("researcher", "strategist", "writer", "end")
    
    # ---------------------------------------------------------
    # LANGUAGE SETTINGS (Phase 6)
    # ---------------------------------------------------------
    language: Optional[str]  # User's preferred language: "en", "es", "fr", "zh", "hi"
    
    # ---------------------------------------------------------
    # CRITIC AGENT OUTPUT (Phase 7)
    # ---------------------------------------------------------
    critic_feedback: Optional[str]  # Counter-analysis from adversarial critic


