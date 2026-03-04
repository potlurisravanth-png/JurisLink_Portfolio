"""
Tests for the AgenticSimLaw Adversarial Debate Protocol.

Validates the 7-turn debate protocol, KS convergence detection,
risk score extraction, and debate result construction.

Run with: pytest tests/test_adversarial_debate.py -v
"""
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from shared_lib.debate import (
    DebateRound,
    check_convergence,
    compute_ks_statistic,
    extract_risk_score,
    create_debate_result,
    MAX_DEBATE_TURNS,
    MIN_TURNS_BEFORE_KS,
    KS_THRESHOLD,
)


# =============================================================================
# TEST 1: CONVERGENCE DETECTION
# =============================================================================

class TestConvergenceDetection:
    """Tests for check_convergence KS stability check."""

    def test_not_enough_turns(self):
        """No convergence before MIN_TURNS_BEFORE_KS rounds."""
        history = [
            {"turn_number": 1, "risk_score": 0.7},
            {"turn_number": 2, "risk_score": 0.65},
        ]
        assert check_convergence(history) is False

    def test_converged_after_three_turns(self):
        """Convergence detected when last two scores are close."""
        history = [
            {"turn_number": 1, "risk_score": 0.7},
            {"turn_number": 2, "risk_score": 0.55},
            {"turn_number": 3, "risk_score": 0.50},  # drift = 0.05 < 0.15
        ]
        assert check_convergence(history) is True

    def test_not_converged_large_drift(self):
        """No convergence when drift exceeds threshold."""
        history = [
            {"turn_number": 1, "risk_score": 0.3},
            {"turn_number": 2, "risk_score": 0.5},
            {"turn_number": 3, "risk_score": 0.8},  # drift = 0.3 > 0.15
        ]
        assert check_convergence(history) is False

    def test_empty_history(self):
        """No convergence with empty history."""
        assert check_convergence([]) is False

    def test_exact_match_converges(self):
        """Identical scores always converge (after min turns)."""
        history = [
            {"turn_number": 1, "risk_score": 0.6},
            {"turn_number": 2, "risk_score": 0.6},
            {"turn_number": 3, "risk_score": 0.6},
        ]
        assert check_convergence(history) is True

    def test_convergence_at_boundary(self):
        """Drift exactly at threshold does NOT converge (strict less-than)."""
        history = [
            {"turn_number": 1, "risk_score": 0.5},
            {"turn_number": 2, "risk_score": 0.5},
            {"turn_number": 3, "risk_score": 0.5 + KS_THRESHOLD},
        ]
        assert check_convergence(history) is False


# =============================================================================
# TEST 2: KS STATISTIC COMPUTATION
# =============================================================================

class TestKSStatistic:
    """Tests for compute_ks_statistic."""

    def test_perfectly_stable(self):
        """All identical scores give KS = 0."""
        ks = compute_ks_statistic([0.5, 0.5, 0.5, 0.5])
        assert ks == 0.0

    def test_single_score(self):
        """Single score returns max instability."""
        ks = compute_ks_statistic([0.7])
        assert ks == 1.0

    def test_moderate_variation(self):
        """Moderate variation gives a moderate KS stat."""
        ks = compute_ks_statistic([0.4, 0.5, 0.6])
        assert 0.0 < ks < 1.0

    def test_extreme_variation(self):
        """Max variation gives high KS stat."""
        ks = compute_ks_statistic([0.0, 1.0])
        assert ks == 0.5  # Mean is 0.5, max deviation is 0.5


# =============================================================================
# TEST 3: RISK SCORE EXTRACTION
# =============================================================================

class TestRiskScoreExtraction:
    """Tests for extract_risk_score from critic text."""

    def test_decimal_format(self):
        """Extracts 'Risk: 0.7' format."""
        assert extract_risk_score("Risk: 0.7") == 0.7

    def test_percentage_format(self):
        """Extracts 'Risk Score: 65%' format (converted to 0.65)."""
        assert extract_risk_score("Risk Score: 65") == 0.65

    def test_out_of_ten_format(self):
        """Extracts '7/10' format."""
        assert extract_risk_score("Overall assessment: 7/10") == 0.7

    def test_no_score_found(self):
        """Returns 0.5 default when no score pattern found."""
        assert extract_risk_score("The case has some weaknesses.") == 0.5

    def test_score_in_context(self):
        """Extracts score embedded in longer text."""
        text = """
        ## Adversarial Analysis
        After reviewing the evidence, the plaintiff's case has moderate strength.
        Risk Score: 0.45
        The primary weakness is...
        """
        assert extract_risk_score(text) == 0.45

    def test_clamped_to_valid_range(self):
        """Scores above 1.0 are clamped (after percentage conversion)."""
        assert extract_risk_score("Risk: 150") <= 1.0


# =============================================================================
# TEST 4: DEBATE RESULT CONSTRUCTION
# =============================================================================

class TestDebateResult:
    """Tests for create_debate_result."""

    def test_converged_result(self):
        """Converged debate includes convergence turn."""
        history = [
            {"turn_number": 1, "strategist_argument": "A1", "critic_rebuttal": "R1", "risk_score": 0.6},
            {"turn_number": 2, "strategist_argument": "A2", "critic_rebuttal": "R2", "risk_score": 0.55},
            {"turn_number": 3, "strategist_argument": "A3", "critic_rebuttal": "R3", "risk_score": 0.52},
        ]
        result = create_debate_result(history, converged=True)
        assert result["converged"] is True
        assert result["convergence_turn"] == 3
        assert result["final_risk_score"] == 0.52
        assert result["final_strategy"] == "A3"
        assert result["final_critique"] == "R3"

    def test_non_converged_result(self):
        """Non-converged debate has no convergence turn."""
        history = [
            {"turn_number": i, "risk_score": 0.5}
            for i in range(1, MAX_DEBATE_TURNS + 1)
        ]
        result = create_debate_result(history, converged=False)
        assert result["converged"] is False
        assert result["convergence_turn"] is None
        assert len(result["rounds"]) == MAX_DEBATE_TURNS

    def test_empty_debate(self):
        """Empty debate produces safe defaults."""
        result = create_debate_result([], converged=False)
        assert result["final_risk_score"] == 0.5
        assert result["rounds"] == []


# =============================================================================
# TEST 5: CONSTANTS
# =============================================================================

class TestConstants:
    """Tests for protocol constants."""

    def test_max_turns(self):
        """Max debate turns is 7."""
        assert MAX_DEBATE_TURNS == 7

    def test_min_turns_before_ks(self):
        """KS check only after 3 rounds."""
        assert MIN_TURNS_BEFORE_KS == 3

    def test_ks_threshold(self):
        """KS threshold is 0.15."""
        assert KS_THRESHOLD == 0.15
