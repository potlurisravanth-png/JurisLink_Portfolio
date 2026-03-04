"""
AgenticSimLaw QA: Adversarial Debate Protocol.

Implements a formal 7-turn debate between the Strategist and Critic agents,
with Kolmogorov-Smirnov stability termination for early convergence.

A "debate round" consists of:
  1. Strategist presents/refines their argument
  2. Critic rebuts and assigns a risk score (0.0 - 1.0)

The debate terminates when:
  - 7 rounds are completed (hard cap), OR
  - KS stability is detected (risk scores have converged after turn 3)
"""
import logging
import math
from typing import List, Optional, TypedDict


# =============================================================================
# TYPE DEFINITIONS
# =============================================================================

class DebateRound(TypedDict, total=False):
    """A single round of the adversarial debate."""
    turn_number: int
    strategist_argument: str
    critic_rebuttal: str
    risk_score: float  # 0.0 (no risk) to 1.0 (case will fail)


class DebateResult(TypedDict):
    """Final result of the adversarial debate."""
    rounds: List[DebateRound]
    converged: bool
    convergence_turn: Optional[int]
    final_risk_score: float
    final_strategy: str
    final_critique: str


# =============================================================================
# KOLMOGOROV-SMIRNOV STABILITY CHECK
# =============================================================================

MAX_DEBATE_TURNS = 7
MIN_TURNS_BEFORE_KS = 3
KS_THRESHOLD = 0.15  # Max allowed drift between consecutive risk scores


def check_convergence(debate_history: List[DebateRound]) -> bool:
    """
    Check if the adversarial debate has converged using a simplified
    Kolmogorov-Smirnov stability criterion.

    The debate is considered converged when the absolute difference
    between the last two risk scores falls below KS_THRESHOLD,
    AND at least MIN_TURNS_BEFORE_KS rounds have been completed.

    This is a simplified version of the full KS test that works well
    for the small sample sizes in our debate protocol (3-7 rounds).

    Args:
        debate_history: List of completed DebateRound entries.

    Returns:
        True if the debate has converged and can be terminated early.
    """
    if len(debate_history) < MIN_TURNS_BEFORE_KS:
        return False

    risk_scores = [r.get("risk_score", 0.5) for r in debate_history]

    # Check if the last two scores are within the threshold
    if len(risk_scores) >= 2:
        drift = abs(risk_scores[-1] - risk_scores[-2])
        if drift < KS_THRESHOLD:
            logging.info(
                f"[Debate] KS convergence detected at turn {len(debate_history)}: "
                f"drift={drift:.4f} < threshold={KS_THRESHOLD}"
            )
            return True

    return False


def compute_ks_statistic(scores: List[float]) -> float:
    """
    Compute the Kolmogorov-Smirnov statistic for a list of risk scores.

    Measures the maximum deviation from the mean, normalized.
    A low KS stat indicates stable, converged scoring.

    Args:
        scores: List of risk scores from debate rounds.

    Returns:
        KS statistic (0.0 = perfectly stable, 1.0 = maximum instability).
    """
    if len(scores) < 2:
        return 1.0  # Not enough data to determine stability

    mean = sum(scores) / len(scores)
    max_deviation = max(abs(s - mean) for s in scores)

    # Normalize to 0-1 range
    return min(max_deviation, 1.0)


def extract_risk_score(critic_output: str) -> float:
    """
    Extract a risk score from the critic's textual output.

    Looks for patterns like "Risk: 0.7" or "Risk Score: 65%"
    in the critic's response. Falls back to 0.5 if not found.

    Args:
        critic_output: The critic agent's text response.

    Returns:
        Extracted risk score between 0.0 and 1.0.
    """
    import re

    # Try "Risk: X.X" or "Risk Score: X.X"
    match = re.search(r"[Rr]isk\s*(?:[Ss]core)?[\s:]*(\d+\.?\d*)", critic_output)
    if match:
        value = float(match.group(1))
        # Handle percentage format (e.g., "65%")
        if value > 1.0:
            value = value / 100.0
        return max(0.0, min(1.0, value))

    # Try "X/10" format
    match = re.search(r"(\d+\.?\d*)\s*/\s*10", critic_output)
    if match:
        return max(0.0, min(1.0, float(match.group(1)) / 10.0))

    return 0.5  # Default if no score found


def create_debate_result(
    debate_history: List[DebateRound],
    converged: bool
) -> DebateResult:
    """
    Create a structured DebateResult from the debate history.

    Args:
        debate_history: List of completed debate rounds.
        converged: Whether the debate terminated via KS convergence.

    Returns:
        A DebateResult with final scores and arguments.
    """
    final_round = debate_history[-1] if debate_history else {}

    return {
        "rounds": debate_history,
        "converged": converged,
        "convergence_turn": len(debate_history) if converged else None,
        "final_risk_score": final_round.get("risk_score", 0.5),
        "final_strategy": final_round.get("strategist_argument", ""),
        "final_critique": final_round.get("critic_rebuttal", ""),
    }
