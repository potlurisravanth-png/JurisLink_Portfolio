"""
INTAKE AGENT - JurisLink
Role: Empathetic legal intake specialist that gathers comprehensive case details.
"""
import os
import json
import re
from pathlib import Path
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import SystemMessage, AIMessage
from shared_lib.state import CaseState
# Lazy Cleanup Integration
from maintenance.cleanup_policy import run_cleanup

CURRENT_DIR = Path(__file__).parent
INSTRUCTIONS_PATH = CURRENT_DIR / "instructions.md"

def load_instructions():
    try:
        with open(INSTRUCTIONS_PATH, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return "You are the Intake Agent."

# Lower temperature for more consistent JSON output
llm = ChatOpenAI(model="gpt-4o", temperature=0.3)

def detect_completion_signal(messages) -> bool:
    """Check if the user has signaled completion in their last message."""
    if not messages:
        return False
    
    last_user_msg = None
    msg_count = 0
    for msg in reversed(messages):
        if hasattr(msg, 'type') and msg.type == 'human':
            last_user_msg = msg.content.lower()
            msg_count += 1
            break
        elif hasattr(msg, 'content') and isinstance(msg, dict) and msg.get('role') == 'user':
            last_user_msg = msg['content'].lower()
            msg_count += 1
            break
    
    if not last_user_msg:
        return False
    
    # Strong completion signals (explicit)
    strong_signals = [
        "i'm done", "i am done", "that's everything", "that is everything",
        "that's all", "that is all", "nothing else", "no more information",
        "finished", "complete", "that covers it", "that covers everything"
    ]
    
    # Check for strong signals first
    if any(signal in last_user_msg for signal in strong_signals):
        print(f"--- STRONG completion signal detected ---")
        return True
    
    # Moderate signals (may need context)
    moderate_signals = ['done', 'finish', 'all the facts', 'everything i know', 'all i have']
    has_moderate = any(signal in last_user_msg for signal in moderate_signals)
    
    # Count user messages in conversation (heuristic: after 3+ exchanges, moderate signals trigger)
    user_msg_count = sum(1 for m in messages if hasattr(m, 'type') and m.type == 'human')
    
    if has_moderate and user_msg_count >= 3:
        print(f"--- MODERATE completion signal + sufficient context ({user_msg_count} msgs) ---")
        return True
    
    return False

def intake_node(state: CaseState) -> dict:
    # Trigger Lazy Cleanup (Best effort, non-blocking if possible, but here synchronous)
    try:
        run_cleanup()
    except Exception as e:
        print(f"Cleanup warning: {e}")

    print("--- [01] INTAKE AGENT ACTIVE ---")
    
    system_prompt_text = load_instructions()
    messages = state["messages"]
    
    # Check if user is signaling completion
    is_completing = detect_completion_signal(messages)
    
    if is_completing:
        # Force the agent to output JSON by adding a strong system instruction
        system_prompt_text += """

CRITICAL OVERRIDE: The user has indicated they are DONE providing information. 
You MUST now output the JSON summary immediately. Do NOT ask any more questions.
Output the JSON block with all information you have gathered so far.
"""
        print("--- COMPLETION SIGNAL DETECTED - Forcing JSON output ---")
    
    prompt = ChatPromptTemplate.from_messages([
        SystemMessage(content=system_prompt_text), 
        MessagesPlaceholder(variable_name="messages"),
    ])
    
    chain = prompt | llm
    response = chain.invoke({"messages": messages})
    content = response.content
    
    # Debug output
    print("\n" + "="*30)
    print("DEBUG: RAW AGENT RESPONSE")
    print("="*30)
    print(content[:500] + "..." if len(content) > 500 else content)
    print("="*30 + "\n")
    
    next_step = None
    extracted_facts = {}

    # Regex JSON extraction
    json_match = re.search(r"\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}", content, re.DOTALL)
    
    if json_match:
        try:
            json_str = json_match.group(0)
            extracted_facts = json.loads(json_str)
            print(f"--- SUCCESS: Extracted {len(extracted_facts)} Facts ---")
            
            # Check if we have minimum required facts
            if extracted_facts.get("status") == "COMPLETE" or is_completing:
                next_step = "researcher"
                extracted_facts["status"] = "COMPLETE"
                
                clean_msg = content.replace(json_str, "").strip()
                if not clean_msg:
                    clean_msg = "Thank you for sharing your story. I have all the information I need. Let me now research the relevant laws for your case."
                response.content = clean_msg
                print("--- Transitioning to RESEARCHER ---")

        except json.JSONDecodeError as e:
            print(f"--- ERROR: JSON parse failed: {e} ---")
    
    return {
        "messages": [response],
        "case_facts": extracted_facts,
        "next_step": next_step
    }
