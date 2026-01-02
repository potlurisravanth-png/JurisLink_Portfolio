"""
Smoke Test - Import Validation for CI/CD Pipeline
Verifies all critical modules can be imported without syntax errors.
Note: Does not load LLMs (would require API keys).
"""
import sys
from pathlib import Path

# Ensure repo root is in path
ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))


def test_imports():
    """Test that all critical modules can be imported."""
    print("=" * 50)
    print("  JURISLINK SMOKE TEST - IMPORT VALIDATION")
    print("=" * 50)
    
    results = []
    
    # Test shared_lib
    try:
        from shared_lib.state import CaseState, create_initial_state, serialize_state
        state = create_initial_state()
        assert "messages" in state
        assert "case_facts" in state
        results.append(("shared_lib.state", "PASS", f"{len(state)} fields"))
    except Exception as e:
        results.append(("shared_lib.state", "FAIL", str(e)))
    
    # Test syntax of agent files (without importing LLM-dependent code)
    agent_files = [
        "agent_intake/intake.py",
        "agent_researcher/researcher.py",
        "agent_strategist/strategist.py",
        "agent_critic/critic.py",
        "agent_assistant/writer.py",
    ]
    
    import ast
    for agent_file in agent_files:
        try:
            file_path = ROOT / agent_file
            with open(file_path, "r", encoding="utf-8") as f:
                ast.parse(f.read())
            results.append((agent_file, "PASS", "Syntax OK"))
        except SyntaxError as e:
            results.append((agent_file, "FAIL", f"Syntax: {e}"))
        except FileNotFoundError:
            results.append((agent_file, "FAIL", "File not found"))
    
    # Test function_app.py syntax
    try:
        func_app = ROOT / "function_app.py"
        with open(func_app, "r", encoding="utf-8") as f:
            ast.parse(f.read())
        results.append(("function_app.py", "PASS", "Syntax OK"))
    except Exception as e:
        results.append(("function_app.py", "FAIL", str(e)))
    
    # Print results
    print("\n" + "-" * 50)
    all_passed = True
    for module, status, detail in results:
        icon = "✅" if status == "PASS" else "❌"
        print(f"{icon} {module}: {status} ({detail})")
        if status == "FAIL":
            all_passed = False
    
    print("-" * 50)
    
    if all_passed:
        print("\n🎉 ALL TESTS PASSED - System ready for deployment")
        return 0
    else:
        print("\n❌ SOME TESTS FAILED - Fix issues before deploying")
        return 1


if __name__ == "__main__":
    sys.exit(test_imports())
