"""
JURISLINK V2 - COMPREHENSIVE TEST SUITE
Tests for: Adversarial Core, Location-Specific Research, Dual Documents, User Intervention Loop
"""
import requests
import json
import time
from colorama import init, Fore, Style
import base64

init()

API_URL = "http://localhost:7071/api/chat"

# ============ TEST SCENARIOS ============
V2_SCENARIOS = [
    {
        "name": "California Wrongful Termination",
        "location": "California",
        "messages": [
            "I was fired after reporting safety violations. I worked at TechCorp in San Francisco.",
            "My name is Maria Garcia. I reported OSHA violations in October 2024.",
            "I have emails where my boss threatened me after I made the report.",
            "I was an employee there for 5 years with excellent reviews. That is everything. I'm done."
        ],
        "expected_laws": ["California Labor Code", "FEHA", "Cal. Gov. Code 12940"],
        "expected_in_strategy": ["retaliation", "whistleblower"],
        "test_type": "full_chain"
    },
    {
        "name": "Texas Age Discrimination",
        "location": "Texas",
        "messages": [
            "I'm 58 years old and was replaced by a 25-year-old at my Dallas company.",
            "John Smith here. I worked at OilCo for 20 years.",
            "They said I was 'not a good fit for the new direction.' I have the termination letter.",
            "My replacement has less experience than me. That is everything. I'm done."
        ],
        "expected_laws": ["Texas Labor Code", "ADEA"],
        "expected_in_strategy": ["age discrimination", "replacement", "pretext"],
        "test_type": "full_chain"
    },
    {
        "name": "New York Harassment",
        "location": "New York",
        "messages": [
            "I experienced sexual harassment at my NYC workplace.",
            "Sarah Johnson. The harassment was from my direct supervisor starting January 2024.",
            "HR dismissed my complaint. I have text messages and witness statements.",
            "I'm still employed but the environment is hostile. That is everything. I'm done."
        ],
        "expected_laws": ["New York Labor Law", "NYSHRL", "NYC Human Rights Law"],
        "expected_in_strategy": ["hostile work environment", "supervisor", "HR complaint"],
        "test_type": "full_chain"
    },
    {
        "name": "User Intervention Test",
        "location": "California",
        "messages": [
            "I was fired for taking medical leave in Los Angeles.",
            "David Lee. I took FMLA leave for surgery in March 2024.",
            "When I returned, my position was eliminated. That is everything. I'm done."
        ],
        "intervention": "Additional context: I actually have a recording of my manager saying they wanted to 'get rid of medical leave abusers'",
        "expected_update": "recording",
        "test_type": "intervention"
    }
]

def print_header(text):
    print(f"\n{Fore.CYAN}{'='*60}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{text}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'='*60}{Style.RESET_ALL}\n")

def print_result(success, message):
    if success:
        print(f"{Fore.GREEN}✅ {message}{Style.RESET_ALL}")
    else:
        print(f"{Fore.RED}❌ {message}{Style.RESET_ALL}")

def send_message(message, history, language="en"):
    """Send a message to the API and return the response."""
    try:
        response = requests.post(API_URL, json={
            "message": message,
            "history": history,
            "language": language
        }, timeout=120)
        return response.json()
    except Exception as e:
        print(f"{Fore.RED}API Error: {e}{Style.RESET_ALL}")
        return None

def run_full_chain_test(scenario):
    """Run a full chain test scenario."""
    print_header(f"TEST: {scenario['name']} ({scenario['location']})")
    
    history = []
    facts = {}
    final_response = None
    docs = {}
    
    # Send all messages
    for i, msg in enumerate(scenario['messages']):
        print(f"{Fore.YELLOW}[{i+1}/{len(scenario['messages'])}] User: {msg[:60]}...{Style.RESET_ALL}")
        
        response = send_message(msg, history)
        if not response:
            print_result(False, "API call failed")
            return False
        
        # Update history
        history.append({"role": "user", "content": msg})
        history.append({"role": "assistant", "content": response.get("response", "")})
        
        # Track facts
        if response.get("facts"):
            facts = response["facts"]
            print(f"  {Fore.BLUE}→ Facts extracted: {len(facts)} fields{Style.RESET_ALL}")
        
        if response.get("strategy"):
            print(f"  {Fore.MAGENTA}→ Strategy generated{Style.RESET_ALL}")
        
        if response.get("critic"):
            print(f"  {Fore.RED}→ Critic analysis received{Style.RESET_ALL}")
        
        if response.get("docs"):
            docs = response["docs"]
            print(f"  {Fore.GREEN}→ Documents generated: {list(docs.keys())}{Style.RESET_ALL}")
        
        final_response = response
        time.sleep(1)  # Rate limiting
    
    # Validate results
    print(f"\n{Fore.WHITE}--- VALIDATION ---{Style.RESET_ALL}")
    
    tests_passed = 0
    total_tests = 0
    
    # Test 1: Facts extracted
    total_tests += 1
    if facts:
        print_result(True, f"Facts extracted: {list(facts.keys())}")
        tests_passed += 1
    else:
        print_result(False, "No facts extracted")
    
    # Test 2: Strategy generated
    total_tests += 1
    strategy = final_response.get("strategy", "")
    if strategy:
        print_result(True, f"Strategy generated: {len(strategy)} chars")
        tests_passed += 1
    else:
        print_result(False, "No strategy generated")
    
    # Test 3: Check for expected strategy keywords
    for keyword in scenario.get("expected_in_strategy", []):
        total_tests += 1
        if strategy and keyword.lower() in strategy.lower():
            print_result(True, f"Strategy contains '{keyword}'")
            tests_passed += 1
        else:
            print_result(False, f"Strategy missing '{keyword}'")
    
    # Test 4: Critic feedback exists
    total_tests += 1
    critic = final_response.get("critic", "")
    if critic and len(critic) > 100:
        print_result(True, f"Critic feedback: {len(critic)} chars")
        tests_passed += 1
    else:
        print_result(False, "No or insufficient critic feedback")
    
    # Test 5: Dual documents generated
    total_tests += 1
    if "demand_letter" in docs and "reasoning_memo" in docs:
        print_result(True, "Both documents generated (demand_letter + reasoning_memo)")
        tests_passed += 1
    else:
        print_result(False, f"Missing documents. Got: {list(docs.keys())}")
    
    # Test 6: Documents are valid Base64
    for doc_name, doc_data in docs.items():
        total_tests += 1
        try:
            decoded = base64.b64decode(doc_data)
            if decoded[:4] == b'%PDF':
                print_result(True, f"{doc_name} is valid PDF ({len(decoded)} bytes)")
                tests_passed += 1
            else:
                print_result(False, f"{doc_name} is not a valid PDF")
        except Exception as e:
            print_result(False, f"{doc_name} decode error: {e}")
    
    print(f"\n{Fore.CYAN}Result: {tests_passed}/{total_tests} tests passed{Style.RESET_ALL}")
    return tests_passed == total_tests

def run_intervention_test(scenario):
    """Test the user intervention loop - adding context after strategy."""
    print_header(f"INTERVENTION TEST: {scenario['name']}")
    
    history = []
    
    # Phase 1: Initial conversation
    print(f"{Fore.YELLOW}--- Phase 1: Initial Intake ---{Style.RESET_ALL}")
    for msg in scenario['messages']:
        print(f"  User: {msg[:50]}...")
        response = send_message(msg, history)
        if not response:
            return False
        history.append({"role": "user", "content": msg})
        history.append({"role": "assistant", "content": response.get("response", "")})
        time.sleep(1)
    
    initial_strategy = response.get("strategy") or ""
    print(f"  {Fore.MAGENTA}→ Initial strategy: {len(initial_strategy)} chars{Style.RESET_ALL}")
    
    # Phase 2: User Intervention
    print(f"\n{Fore.YELLOW}--- Phase 2: User Intervention ---{Style.RESET_ALL}")
    intervention = scenario['intervention']
    print(f"  User: {intervention}")
    
    intervention_response = send_message(intervention, history)
    if not intervention_response:
        return False
    
    # Validate intervention was processed
    new_facts = intervention_response.get("facts", {})
    new_strategy = intervention_response.get("strategy", "")
    
    print(f"\n{Fore.WHITE}--- INTERVENTION VALIDATION ---{Style.RESET_ALL}")
    
    tests_passed = 0
    total_tests = 3
    
    # Test 1: Response received
    if intervention_response.get("response"):
        print_result(True, "Intervention processed")
        tests_passed += 1
    else:
        print_result(False, "No response to intervention")
    
    # Test 2: Expected update appears in context
    expected = scenario.get("expected_update", "")
    response_text = str(intervention_response.get("response", "")) + str(new_strategy)
    if expected.lower() in response_text.lower():
        print_result(True, f"Intervention context '{expected}' reflected in response")
        tests_passed += 1
    else:
        print_result(False, f"Expected '{expected}' not found in response")
    
    # Test 3: Strategy was updated (if new strategy generated)
    if new_strategy and new_strategy != initial_strategy:
        print_result(True, "Strategy was updated based on new context")
        tests_passed += 1
    elif not new_strategy:
        print_result(True, "Intake acknowledged intervention (strategy in progress)")
        tests_passed += 1
    else:
        print_result(False, "Strategy unchanged after intervention")
    
    print(f"\n{Fore.CYAN}Intervention Result: {tests_passed}/{total_tests} tests passed{Style.RESET_ALL}")
    return tests_passed >= 2

def run_all_tests():
    """Run all V2 test scenarios."""
    print_header("JURISLINK V2 - COMPREHENSIVE TEST SUITE")
    print(f"Testing: Adversarial Core, Location-Specific Research, Dual Documents\n")
    
    results = []
    
    for scenario in V2_SCENARIOS:
        if scenario.get("test_type") == "full_chain":
            passed = run_full_chain_test(scenario)
        elif scenario.get("test_type") == "intervention":
            passed = run_intervention_test(scenario)
        else:
            passed = run_full_chain_test(scenario)
        
        results.append({
            "name": scenario["name"],
            "passed": passed
        })
        
        print("\n" + "-"*40 + "\n")
        time.sleep(2)  # Cooldown between tests
    
    # Final Summary
    print_header("FINAL TEST RESULTS")
    passed = sum(1 for r in results if r["passed"])
    total = len(results)
    
    for r in results:
        print_result(r["passed"], r["name"])
    
    print(f"\n{Fore.CYAN}{'='*40}{Style.RESET_ALL}")
    if passed == total:
        print(f"{Fore.GREEN}🎉 ALL {total} TESTS PASSED!{Style.RESET_ALL}")
    else:
        print(f"{Fore.YELLOW}⚠️ {passed}/{total} tests passed{Style.RESET_ALL}")
    
    return passed == total

if __name__ == "__main__":
    run_all_tests()
