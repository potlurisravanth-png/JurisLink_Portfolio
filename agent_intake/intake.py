"""
INTAKE AGENT - JurisLink
Role: Empathetic legal intake specialist that gathers comprehensive case details.
"""
import json
import re
from pathlib import Path
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import SystemMessage, AIMessage
from shared_lib.state import CaseState
from shared_lib.config import AgentConfig
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

# Lazy LLM initialization to avoid import-time API key errors
_llm = None

def get_llm():
    global _llm
    if _llm is None:
        _llm = AgentConfig.get_llm("intake")
    return _llm

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

def parse_system_context(messages) -> dict:
    """
    Parse GPS context from frontend 'System Context:' messages.
    
    Returns dict with jurisdiction info if found, empty dict otherwise.
    """
    context = {}
    
    for msg in messages:
        content = None
        # Handle different message formats
        if hasattr(msg, 'content'):
            content = msg.content
        elif isinstance(msg, dict) and 'content' in msg:
            content = msg['content']
        
        if content and content.startswith("System Context:"):
            print(f"--- GPS CONTEXT DETECTED ---")
            # Parse: "System Context: User is located in {region}, {country}. The legal issue is {issue}."
            try:
                import re
                
                # Extract location
                loc_match = re.search(r"located in ([^,]+),\s*([^.]+)", content)
                if loc_match:
                    context['state'] = loc_match.group(1).strip()
                    context['country'] = loc_match.group(2).strip()
                    context['jurisdiction'] = f"{context['state']}, {context['country']}"
                    print(f"    Location: {context['jurisdiction']}")
                
                # Extract issue
                issue_match = re.search(r"legal issue is ([^.]+)", content)
                if issue_match:
                    context['issue'] = issue_match.group(1).strip()
                    context['case_type'] = context['issue']
                    print(f"    Issue: {context['issue']}")
                    
            except Exception as e:
                print(f"    GPS parse error: {e}")
            
            break  # Only process first system context
    
    return context

def intake_node(state: CaseState) -> dict:
    # Trigger Lazy Cleanup (Best effort, non-blocking if possible, but here synchronous)
    try:
        run_cleanup()
    except Exception as e:
        print(f"Cleanup warning: {e}")

    print("--- [01] INTAKE AGENT ACTIVE ---")
    
    # Check for GPS context from frontend
    gps_context = parse_system_context(state["messages"])
    
    # Pre-populate facts with GPS context
    existing_facts = state.get("case_facts", {})
    if gps_context:
        existing_facts = {**existing_facts, **gps_context}
        print(f"--- Pre-filled {len(gps_context)} fields from GPS ---")
    
    system_prompt_text = load_instructions()
    messages = state["messages"]
    
    # Filter out system context messages before passing to LLM
    filtered_messages = [
        msg for msg in messages 
        if not (
            (hasattr(msg, 'content') and msg.content.startswith("System Context:")) or
            (isinstance(msg, dict) and msg.get('content', '').startswith("System Context:"))
        )
    ]
    
    # Check if user is signaling completion
    is_completing = detect_completion_signal(filtered_messages)
    
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
    
    chain = prompt | get_llm()
    response = chain.invoke({"messages": filtered_messages})
    content = response.content
    
    # Debug output
    print("\n" + "="*30)
    print("DEBUG: RAW AGENT RESPONSE")
    print("="*30)
    print(content[:500] + "..." if len(content) > 500 else content)
    print("="*30 + "\n")
    
    next_step = None
    # existing_facts already populated with GPS context above
    extracted_facts = {}

    # Regex JSON extraction (handles both partial and complete JSON)
    json_match = re.search(r"\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}", content, re.DOTALL)
    
    if json_match:
        try:
            json_str = json_match.group(0)
            extracted_facts = json.loads(json_str)
            print(f"--- SUCCESS: Extracted {len(extracted_facts)} Facts ---")
            
            # Merge with existing facts (preserve previously extracted data like short_title)
            merged_facts = {**existing_facts, **extracted_facts}
            extracted_facts = merged_facts
            
            # Check if we have minimum required facts
            if extracted_facts.get("status") == "COMPLETE" or is_completing:
                next_step = "researcher"
                extracted_facts["status"] = "COMPLETE"
                
                clean_msg = content.replace(json_str, "").strip()
                # Remove markdown code block remnants
                clean_msg = re.sub(r"```json\s*```", "", clean_msg).strip()
                clean_msg = re.sub(r"```\s*```", "", clean_msg).strip()
                if not clean_msg:
                    clean_msg = "Thank you for sharing your story. I have all the information I need. Let me now research the relevant laws for your case."
                response.content = clean_msg
                print("--- Transitioning to RESEARCHER ---")
            else:
                # For IN_PROGRESS, also clean JSON from visible response
                clean_msg = content.replace(json_str, "").strip()
                clean_msg = re.sub(r"```json\s*```", "", clean_msg).strip()
                clean_msg = re.sub(r"```\s*```", "", clean_msg).strip()
                if clean_msg:
                    response.content = clean_msg

        except json.JSONDecodeError as e:
            print(f"--- ERROR: JSON parse failed: {e} ---")
            # Preserve existing facts even if new extraction fails
            extracted_facts = existing_facts
    else:
        # No JSON found, preserve existing facts
        extracted_facts = existing_facts
    
    return {
        "messages": [response],
        "case_facts": extracted_facts,
        "next_step": next_step
    }

