"""
Employment Law Precedent Database
Landmark cases for case matching and citation in legal strategy.
"""

# Landmark Employment Law Cases
PRECEDENTS = [
    {
        "name": "McDonnell Douglas Corp. v. Green",
        "citation": "411 U.S. 792 (1973)",
        "year": 1973,
        "category": "discrimination",
        "summary": "Established the burden-shifting framework for employment discrimination cases. Plaintiff must show prima facie case, then employer must state legitimate reason, then plaintiff can show pretext.",
        "keywords": ["discrimination", "burden shifting", "prima facie", "pretext", "title vii"]
    },
    {
        "name": "Burlington Industries v. Ellerth",
        "citation": "524 U.S. 742 (1998)",
        "year": 1998,
        "category": "harassment",
        "summary": "Employer vicariously liable for supervisor harassment. Affirmative defense available if employer took reasonable care to prevent/correct harassment and employee unreasonably failed to use complaint procedures.",
        "keywords": ["harassment", "hostile work environment", "supervisor", "vicarious liability", "title vii"]
    },
    {
        "name": "Faragher v. City of Boca Raton",
        "citation": "524 U.S. 775 (1998)",
        "year": 1998,
        "category": "harassment",
        "summary": "Companion case to Ellerth. Established employer liability standards for supervisor harassment creating hostile work environment.",
        "keywords": ["harassment", "hostile work environment", "employer liability", "title vii"]
    },
    {
        "name": "Meritor Savings Bank v. Vinson",
        "citation": "477 U.S. 57 (1986)",
        "year": 1986,
        "category": "harassment",
        "summary": "Sexual harassment creating hostile work environment is a form of sex discrimination under Title VII, even without economic harm.",
        "keywords": ["sexual harassment", "hostile work environment", "title vii", "sex discrimination"]
    },
    {
        "name": "Price Waterhouse v. Hopkins",
        "citation": "490 U.S. 228 (1989)",
        "year": 1989,
        "category": "discrimination",
        "summary": "Sex stereotyping constitutes sex discrimination. Established mixed-motive analysis for discrimination cases.",
        "keywords": ["sex discrimination", "stereotyping", "mixed motive", "title vii", "gender"]
    },
    {
        "name": "Griggs v. Duke Power Co.",
        "citation": "401 U.S. 424 (1971)",
        "year": 1971,
        "category": "discrimination",
        "summary": "Employment practices with disparate impact on protected groups violate Title VII unless justified by business necessity.",
        "keywords": ["disparate impact", "title vii", "race discrimination", "business necessity"]
    },
    {
        "name": "O'Connor v. Consolidated Coin Caterers Corp.",
        "citation": "517 U.S. 308 (1996)",
        "year": 1996,
        "category": "age_discrimination",
        "summary": "Age discrimination claim does not require replacement by someone under 40. Key is whether age was the determining factor.",
        "keywords": ["age discrimination", "adea", "replacement", "over 40"]
    },
    {
        "name": "Gross v. FBL Financial Services",
        "citation": "557 U.S. 167 (2009)",
        "year": 2009,
        "category": "age_discrimination",
        "summary": "ADEA requires plaintiff to prove age was 'but-for' cause of adverse action. No mixed-motive claims under ADEA.",
        "keywords": ["age discrimination", "adea", "but for", "causation"]
    },
    {
        "name": "Hazen Paper Co. v. Biggins",
        "citation": "507 U.S. 604 (1993)",
        "year": 1993,
        "category": "age_discrimination",
        "summary": "Firing employee to prevent pension vesting is not automatically age discrimination unless age was actual motivating factor.",
        "keywords": ["age discrimination", "adea", "pension", "vesting", "motivation"]
    },
    {
        "name": "Oncale v. Sundowner Offshore Services",
        "citation": "523 U.S. 75 (1998)",
        "year": 1998,
        "category": "harassment",
        "summary": "Same-sex harassment is actionable under Title VII. Focus is on whether conduct was because of sex.",
        "keywords": ["sexual harassment", "same sex", "title vii", "hostile work environment"]
    },
    {
        "name": "Ledbetter v. Goodyear Tire & Rubber Co.",
        "citation": "550 U.S. 618 (2007)",
        "year": 2007,
        "category": "wage_discrimination",
        "summary": "Each discriminatory paycheck is not a separate violation (overruled by Lilly Ledbetter Fair Pay Act 2009).",
        "keywords": ["pay discrimination", "statute of limitations", "title vii", "equal pay"]
    },
    {
        "name": "Thompson v. North American Stainless",
        "citation": "562 U.S. 170 (2011)",
        "year": 2011,
        "category": "retaliation",
        "summary": "Third-party retaliation claims are actionable. Firing employee's fiancé after she filed EEOC charge is unlawful retaliation.",
        "keywords": ["retaliation", "third party", "title vii", "eeoc", "wrongful termination"]
    },
    {
        "name": "Burlington Northern v. White",
        "citation": "548 U.S. 53 (2006)",
        "year": 2006,
        "category": "retaliation",
        "summary": "Retaliation standard is broader than discrimination standard. Covers any action that might dissuade reasonable worker from making complaint.",
        "keywords": ["retaliation", "title vii", "adverse action", "materially adverse"]
    },
    {
        "name": "Staub v. Proctor Hospital",
        "citation": "562 U.S. 411 (2011)",
        "year": 2011,
        "category": "discrimination",
        "summary": "Cat's paw liability: Employer liable when supervisor's discriminatory animus is proximate cause of adverse action, even if decision-maker unaware.",
        "keywords": ["discrimination", "userra", "cat's paw", "supervisor bias", "proximate cause"]
    },
    {
        "name": "Bostock v. Clayton County",
        "citation": "590 U.S. ___ (2020)",
        "year": 2020,
        "category": "discrimination",
        "summary": "Title VII prohibits discrimination based on sexual orientation and gender identity as forms of sex discrimination.",
        "keywords": ["lgbtq", "sexual orientation", "gender identity", "title vii", "sex discrimination"]
    }
]


def find_relevant_precedents(case_facts: dict, max_results: int = 3) -> list:
    """
    Find relevant precedents based on case facts.
    Uses keyword matching (can be upgraded to embeddings later).
    """
    if not case_facts:
        return []
    
    # Extract keywords from case facts
    facts_text = " ".join([
        str(v).lower() for v in case_facts.values() if v
    ])
    
    # Score each precedent
    scored = []
    for p in PRECEDENTS:
        score = 0
        for kw in p["keywords"]:
            if kw in facts_text:
                score += 1
        if score > 0:
            scored.append((score, p))
    
    # Sort by score and return top matches
    scored.sort(key=lambda x: x[0], reverse=True)
    return [p for _, p in scored[:max_results]]


def format_precedents_for_strategy(precedents: list) -> str:
    """Format precedents for inclusion in strategy output."""
    if not precedents:
        return ""
    
    lines = ["\n## Relevant Legal Precedents\n"]
    for p in precedents:
        lines.append(f"### {p['name']}")
        lines.append(f"**{p['citation']}**\n")
        lines.append(f"{p['summary']}\n")
    
    return "\n".join(lines)
