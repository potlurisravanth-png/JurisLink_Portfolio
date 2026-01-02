import logging
from langgraph.graph import StateGraph, END
from shared_lib.state import CaseState

# Agent Imports
from agent_intake.intake import intake_node
from agent_researcher.researcher import researcher_node
from agent_strategist.strategist import strategist_node
from agent_critic.critic import critic_node
from agent_assistant.writer import writer_node

def route_intake(state: CaseState):
    """Determine the next step after intake."""
    step = state.get("next_step")
    if step == "researcher":
        return "researcher_agent"
    return END

def build_graph():
    """
    Constructs the LangGraph workflow for the JurisLink V2 backend.
    Flow: Intake -> (if complete) -> Researcher -> Strategist -> Critic -> Writer -> END
    """
    workflow = StateGraph(CaseState)

    # A. Add Nodes
    workflow.add_node("intake_agent", intake_node)
    workflow.add_node("researcher_agent", researcher_node)
    workflow.add_node("strategist_agent", strategist_node)
    workflow.add_node("critic_agent", critic_node)
    workflow.add_node("assistant_agent", writer_node)

    # B. Define Edges
    workflow.set_entry_point("intake_agent")

    workflow.add_conditional_edges(
        "intake_agent",
        route_intake,
        {
            "researcher_agent": "researcher_agent", 
            END: END
        }
    )

    workflow.add_edge("researcher_agent", "strategist_agent")
    workflow.add_edge("strategist_agent", "critic_agent")
    workflow.add_edge("critic_agent", "assistant_agent")
    workflow.add_edge("assistant_agent", END)

    return workflow.compile()
