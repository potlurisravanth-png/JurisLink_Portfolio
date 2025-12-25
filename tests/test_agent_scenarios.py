"""
JURISLINK TEST AGENT
Automated testing framework that generates legal scenarios and verifies system outputs.
Run with: python test_agent_scenarios.py
"""
import requests
import json
import time
from dataclasses import dataclass
from typing import List, Optional
from colorama import init, Fore, Style

# Initialize colorama for colored output
init()

API_URL = "http://localhost:7071/api/chat"

@dataclass
class TestScenario:
    """A test scenario with expected outcomes"""
    name: str
    description: str
    messages: List[str]  # Conversation messages to send
    expected_facts: List[str]  # Keys that should be in extracted facts
    expected_in_research: List[str]  # Keywords that should appear in research
    expected_in_strategy: List[str]  # Keywords that should appear in strategy
    expect_document: bool  # Whether a document should be generated


# Define Test Scenarios
SCENARIOS = [
    TestScenario(
        name="Wrongful Termination - Retaliation",
        description="Employee fired after reporting safety violations",
        messages=[
            "My name is Sarah Johnson. I worked at SafetyFirst Manufacturing in Chicago, Illinois.",
            "I was fired on January 15, 2025. I had been working there for 3 years as a Quality Inspector.",
            "I reported safety violations to OSHA about faulty equipment. Two weeks later, they fired me claiming 'poor performance' but I had perfect reviews.",
            "My supervisor was Mike Thompson. He told me I should have 'kept my mouth shut' about the safety issues.",
            "I have emails where my supervisor threatened me, and my performance reviews showing excellent work. I also have the OSHA complaint I filed.",
            "Yes, two coworkers witnessed the supervisor's threats - Jane Doe and Bob Wilson.",
            "That's all the information I have. COMPLETE."
        ],
        expected_facts=["client_name", "opposing_party", "location", "incident_summary"],
        expected_in_research=["retaliation", "OSHA", "wrongful termination"],
        expected_in_strategy=["retaliation", "evidence", "damages"],
        expect_document=True
    ),
    
    TestScenario(
        name="Discrimination - Age",
        description="Older employee passed over for promotion given to younger colleague",
        messages=[
            "I'm Robert Martinez, 58 years old. I work at TechGiant Inc in Austin, Texas.",
            "I've been passed over for promotion 3 times in the last year. Each time, the position went to someone in their 20s or 30s with less experience than me.",
            "I have 25 years of experience and consistently exceed my performance targets. The last promotion was given to someone with only 2 years experience.",
            "My manager, Lisa Chen, has made comments like 'we need fresh blood' and 'you might be more comfortable in a less demanding role'.",
            "I have documentation of all my performance reviews and the job postings. I also have an email where HR mentioned needing to 'modernize the team demographics'.",
            "I haven't filed any complaints yet because I was afraid of retaliation.",
            "That covers everything. DONE."
        ],
        expected_facts=["client_name", "opposing_party", "location"],
        expected_in_research=["age discrimination", "ADEA", "disparate treatment"],
        expected_in_strategy=["discrimination", "promotion", "damages"],
        expect_document=True
    ),
    
    TestScenario(
        name="Hostile Work Environment - Harassment",
        description="Employee experiencing ongoing harassment from coworkers",
        messages=[
            "My name is Emily Chen. I work at Metro Insurance in Denver, Colorado.",
            "I've been experiencing harassment from my coworkers for the past 6 months. They make inappropriate comments about my ethnicity and exclude me from meetings.",
            "The harassment started in July 2024. My supervisor, David Brown, witnessed several incidents but did nothing.",
            "I reported it to HR on September 1st, 2024 but they said they 'couldn't substantiate' my claims despite multiple witnesses.",
            "I have screenshots of offensive messages in our work Slack channel. I also have a copy of my HR complaint.",
            "Three coworkers have seen the harassment - Michael Lee, Sandra White, and Tom Garcia. Michael said he'd be willing to testify.",
            "I think you have all the relevant information. COMPLETE."
        ],
        expected_facts=["client_name", "opposing_party", "location", "incident_summary"],
        expected_in_research=["hostile work environment", "harassment", "Title VII"],
        expected_in_strategy=["harassment", "HR", "evidence"],
        expect_document=True
    ),
    
    TestScenario(
        name="Wage Theft - Unpaid Overtime",
        description="Employee not paid for required overtime work",
        messages=[
            "I'm Carlos Rodriguez. I worked at FastFood Chain restaurant in Miami, Florida.",
            "My manager required me to work off the clock. I would clock out at 10 PM but then had to clean for another 1-2 hours without pay.",
            "This happened every shift for about 8 months, from March 2024 to October 2024 when I quit.",
            "My manager, Jennifer Walsh, would tell us we had to finish cleaning before leaving but not to put it on our time cards.",
            "I kept a personal log of my actual hours worked. I also have text messages from my manager telling us to clock out before cleaning.",
            "Other employees experienced the same thing - Maria Santos and Kevin Johnson were on my shift.",
            "That's everything I know about the situation. DONE."
        ],
        expected_facts=["client_name", "opposing_party", "location"],
        expected_in_research=["FLSA", "overtime", "wage theft"],
        expected_in_strategy=["unpaid", "overtime", "damages"],
        expect_document=True
    )
]


def print_header(text: str):
    print(f"\n{Fore.CYAN}{'='*60}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{text:^60}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'='*60}{Style.RESET_ALL}")


def print_pass(text: str):
    print(f"  {Fore.GREEN}✓ PASS:{Style.RESET_ALL} {text}")


def print_fail(text: str):
    print(f"  {Fore.RED}✗ FAIL:{Style.RESET_ALL} {text}")


def print_info(text: str):
    print(f"  {Fore.YELLOW}ℹ{Style.RESET_ALL} {text}")


def run_scenario(scenario: TestScenario) -> dict:
    """Run a single test scenario and return results"""
    print_header(f"SCENARIO: {scenario.name}")
    print_info(scenario.description)
    
    results = {
        "name": scenario.name,
        "passed": True,
        "facts_check": False,
        "research_check": False,
        "strategy_check": False,
        "document_check": False,
        "errors": []
    }
    
    history = []
    final_response = None
    
    # Send each message in the conversation
    for i, message in enumerate(scenario.messages):
        print(f"\n  [{i+1}/{len(scenario.messages)}] Sending: {message[:50]}...")
        
        try:
            response = requests.post(API_URL, json={
                "message": message,
                "history": history
            }, timeout=180)
            
            if response.status_code != 200:
                results["errors"].append(f"HTTP {response.status_code}: {response.text}")
                results["passed"] = False
                return results
            
            data = response.json()
            final_response = data
            
            # Update history
            history.append({"role": "user", "content": message})
            history.append({"role": "assistant", "content": data.get("response", "")})
            
            # Small delay between messages
            time.sleep(1)
            
        except Exception as e:
            results["errors"].append(str(e))
            results["passed"] = False
            return results
    
    print(f"\n  {Fore.MAGENTA}--- VERIFICATION ---{Style.RESET_ALL}")
    
    # Verify Facts
    facts = final_response.get("facts", {})
    facts_found = [key for key in scenario.expected_facts if key in facts]
    if len(facts_found) == len(scenario.expected_facts):
        print_pass(f"Facts extracted: {len(facts)} fields")
        results["facts_check"] = True
    else:
        missing = set(scenario.expected_facts) - set(facts_found)
        print_fail(f"Missing facts: {missing}")
        results["passed"] = False
    
    # Verify Research
    research = final_response.get("research", "") or ""
    research_lower = research.lower()
    research_found = [kw for kw in scenario.expected_in_research if kw.lower() in research_lower]
    if len(research_found) >= len(scenario.expected_in_research) // 2:  # At least half
        print_pass(f"Research contains: {research_found}")
        results["research_check"] = True
    else:
        print_fail(f"Research missing keywords from: {scenario.expected_in_research}")
        results["passed"] = False
    
    # Verify Strategy
    strategy = final_response.get("strategy", "") or ""
    strategy_lower = strategy.lower()
    strategy_found = [kw for kw in scenario.expected_in_strategy if kw.lower() in strategy_lower]
    if len(strategy_found) >= len(scenario.expected_in_strategy) // 2:
        print_pass(f"Strategy contains: {strategy_found}")
        results["strategy_check"] = True
    else:
        print_fail(f"Strategy missing keywords from: {scenario.expected_in_strategy}")
        results["passed"] = False
    
    # Verify Document
    docs = final_response.get("docs", {})
    has_doc = bool(docs and docs.get("demand_letter"))
    if scenario.expect_document:
        if has_doc:
            print_pass("Document generated successfully")
            results["document_check"] = True
        else:
            print_fail("Expected document but none generated")
            results["passed"] = False
    else:
        print_info("Document not expected for this scenario")
        results["document_check"] = True
    
    return results


def run_all_tests():
    """Run all test scenarios and print summary"""
    print(f"\n{Fore.YELLOW}{'='*60}{Style.RESET_ALL}")
    print(f"{Fore.YELLOW}{'JURISLINK AUTOMATED TEST SUITE':^60}{Style.RESET_ALL}")
    print(f"{Fore.YELLOW}{'='*60}{Style.RESET_ALL}")
    print(f"\nFound {len(SCENARIOS)} scenarios to test.")
    print("Each scenario simulates a complete client interview.\n")
    
    all_results = []
    
    for scenario in SCENARIOS:
        result = run_scenario(scenario)
        all_results.append(result)
        print(f"\n  {Fore.YELLOW}Result: {'PASSED' if result['passed'] else 'FAILED'}{Style.RESET_ALL}")
    
    # Print Summary
    print_header("TEST SUMMARY")
    
    passed = sum(1 for r in all_results if r["passed"])
    total = len(all_results)
    
    print(f"\n  Scenarios Passed: {passed}/{total}")
    print()
    
    for result in all_results:
        status = f"{Fore.GREEN}PASS{Style.RESET_ALL}" if result["passed"] else f"{Fore.RED}FAIL{Style.RESET_ALL}"
        print(f"  [{status}] {result['name']}")
        if result["errors"]:
            for error in result["errors"]:
                print(f"       Error: {error}")
    
    print(f"\n{'='*60}")
    
    if passed == total:
        print(f"{Fore.GREEN}ALL TESTS PASSED!{Style.RESET_ALL}")
    else:
        print(f"{Fore.RED}{total - passed} TESTS FAILED{Style.RESET_ALL}")
    
    return passed == total


if __name__ == "__main__":
    try:
        # Check if colorama is installed
        import colorama
    except ImportError:
        print("Installing colorama for colored output...")
        import subprocess
        subprocess.run(["pip", "install", "colorama"])
        from colorama import init, Fore, Style
        init()
    
    success = run_all_tests()
    exit(0 if success else 1)
