"""
JURISLINK V2 - STATE PERSISTENCE TEST
Tests memory hydration and state echo functionality.
"""
import requests
import json
from colorama import init, Fore, Style

init()

API_URL = "http://localhost:7071/api/chat"

def print_header(text):
    print(f"\n{Fore.CYAN}{'='*60}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{text}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'='*60}{Style.RESET_ALL}\n")

def print_result(success, message):
    if success:
        print(f"{Fore.GREEN}✅ {message}{Style.RESET_ALL}")
    else:
        print(f"{Fore.RED}❌ {message}{Style.RESET_ALL}")

def test_state_persistence():
    """Test that state is properly hydrated across turns."""
    print_header("STATE PERSISTENCE TEST")
    
    tests_passed = 0
    total_tests = 0
    
    # === TURN 1: Initial message (no previous_state) ===
    print(f"{Fore.YELLOW}[Turn 1] Sending initial message...{Style.RESET_ALL}")
    
    response1 = requests.post(API_URL, json={
        "message": "I was wrongfully terminated from my job in California.",
        "history": [],
        "language": "en"
    }, timeout=60).json()
    
    # Test: Response received
    total_tests += 1
    if response1.get("response"):
        print_result(True, "Turn 1: Response received")
        tests_passed += 1
    else:
        print_result(False, "Turn 1: No response")
        return False
    
    # Test: final_state returned
    total_tests += 1
    final_state_1 = response1.get("final_state")
    if final_state_1:
        print_result(True, f"Turn 1: final_state returned (keys: {list(final_state_1.keys())[:5]}...)")
        tests_passed += 1
    else:
        print_result(False, "Turn 1: No final_state returned")
        return False
    
    # Test: iteration count is 1
    total_tests += 1
    if response1.get("iteration") == 1:
        print_result(True, "Turn 1: iteration_count = 1")
        tests_passed += 1
    else:
        print_result(False, f"Turn 1: iteration_count = {response1.get('iteration')}, expected 1")
    
    # === TURN 2: Continue with previous_state ===
    print(f"\n{Fore.YELLOW}[Turn 2] Sending with previous_state...{Style.RESET_ALL}")
    
    response2 = requests.post(API_URL, json={
        "message": "My name is John Doe. I worked there for 5 years.",
        "history": [
            {"role": "user", "content": "I was wrongfully terminated from my job in California."},
            {"role": "assistant", "content": response1["response"]}
        ],
        "language": "en",
        "previous_state": final_state_1  # HYDRATE
    }, timeout=60).json()
    
    # Test: Response received
    total_tests += 1
    if response2.get("response"):
        print_result(True, "Turn 2: Response received with hydrated state")
        tests_passed += 1
    else:
        print_result(False, "Turn 2: No response")
        return False
    
    # Test: iteration count incremented
    total_tests += 1
    if response2.get("iteration") == 2:
        print_result(True, "Turn 2: iteration_count = 2 (incremented)")
        tests_passed += 1
    else:
        print_result(False, f"Turn 2: iteration_count = {response2.get('iteration')}, expected 2")
    
    # Test: final_state contains messages
    total_tests += 1
    final_state_2 = response2.get("final_state", {})
    messages_count = len(final_state_2.get("messages", []))
    if messages_count >= 4:  # At least 4 messages (2 turns * 2)
        print_result(True, f"Turn 2: Message history preserved ({messages_count} messages)")
        tests_passed += 1
    else:
        print_result(False, f"Turn 2: Only {messages_count} messages, expected >= 4")
    
    # === TURN 3: Trigger completion ===
    print(f"\n{Fore.YELLOW}[Turn 3] Triggering full chain with completion signal...{Style.RESET_ALL}")
    
    response3 = requests.post(API_URL, json={
        "message": "To summarize: I'm John Doe, I worked at TechCorp in California for 5 years. I was terminated after complaining about safety violations. I have documentation of my complaints and my termination letter. That is everything. I'm done.",
        "history": [
            {"role": "user", "content": "I was wrongfully terminated from my job in California."},
            {"role": "assistant", "content": response1["response"]},
            {"role": "user", "content": "My name is John Doe. I worked there for 5 years."},
            {"role": "assistant", "content": response2["response"]}
        ],
        "language": "en",
        "previous_state": final_state_2
    }, timeout=120).json()
    
    # Test: iteration count = 3
    total_tests += 1
    if response3.get("iteration") == 3:
        print_result(True, "Turn 3: iteration_count = 3")
        tests_passed += 1
    else:
        print_result(False, f"Turn 3: iteration_count = {response3.get('iteration')}, expected 3")
    
    # Test: Facts extracted
    total_tests += 1
    facts = response3.get("facts", {})
    if facts and facts.get("status") == "COMPLETE":
        print_result(True, f"Turn 3: Facts extracted (status=COMPLETE)")
        tests_passed += 1
    else:
        print_result(False, f"Turn 3: Facts not complete (status={facts.get('status')})")
    
    # Test: Strategy generated
    total_tests += 1
    if response3.get("strategy"):
        print_result(True, f"Turn 3: Strategy generated ({len(response3.get('strategy', ''))} chars)")
        tests_passed += 1
    else:
        print_result(False, "Turn 3: No strategy generated")
    
    # Test: Critic feedback
    total_tests += 1
    if response3.get("critic"):
        print_result(True, f"Turn 3: Critic feedback received")
        tests_passed += 1
    else:
        print_result(False, "Turn 3: No critic feedback")
    
    # Test: Documents generated
    total_tests += 1
    docs = response3.get("docs", {})
    if "demand_letter" in docs and "reasoning_memo" in docs:
        print_result(True, "Turn 3: Both documents generated")
        tests_passed += 1
    else:
        print_result(False, f"Turn 3: Missing documents, got: {list(docs.keys())}")
    
    # Summary
    print_header("TEST SUMMARY")
    print(f"Passed: {tests_passed}/{total_tests}")
    
    if tests_passed == total_tests:
        print(f"\n{Fore.GREEN}🎉 ALL TESTS PASSED! State persistence working correctly.{Style.RESET_ALL}")
        return True
    else:
        print(f"\n{Fore.YELLOW}⚠️ {total_tests - tests_passed} tests failed.{Style.RESET_ALL}")
        return False

if __name__ == "__main__":
    try:
        test_state_persistence()
    except Exception as e:
        print(f"{Fore.RED}Error: {e}{Style.RESET_ALL}")
