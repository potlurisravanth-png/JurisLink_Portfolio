"""
AGENT CONFIGURATION - JurisLink Multi-Model Factory
Centralized LLM configuration for role-based model selection.

Usage:
    from shared_lib.config import AgentConfig
    llm = AgentConfig.get_llm("researcher")
"""
import os


class AgentConfig:
    """
    Model assignments optimized for task complexity:
    - Fast models (gpt-4o-mini): High-throughput, simple routing/retrieval
    - Smart models (gpt-4o): Deep reasoning, analysis, professional writing
    """
    
    # The "Traffic Cop" - Routes users, simple intake (Fast)
    INTAKE_MODEL = "gpt-4o-mini"
    
    # The "Librarian" - Web search synthesis (Fast & High Throughput)
    RESEARCHER_MODEL = "gpt-4o-mini"
    
    # The "Senior Partner" - Deep legal analysis (Deep Reasoning)
    STRATEGIST_MODEL = "gpt-4o"
    
    # The "Devil's Advocate" - Adversarial critique (Deep Reasoning)
    CRITIC_MODEL = "gpt-4o"
    
    # The "Editor" - Professional document writing (Professional Tone)
    WRITER_MODEL = "gpt-4o"

    # Temperature settings per role
    TEMPERATURES = {
        "intake": 0.3,      # Consistent JSON output
        "researcher": 0.0,  # Factual accuracy
        "strategist": 0.5,  # Balanced creativity/accuracy
        "critic": 0.2,      # Precise legal analysis
        "writer": 0.5,      # Professional but engaging
    }

    @staticmethod
    def get_llm(role: str):
        """
        Factory to return the correct ChatOpenAI instance based on role.
        
        Args:
            role: One of 'intake', 'researcher', 'strategist', 'critic', 'writer'
            
        Returns:
            Configured ChatOpenAI instance
        """
        from langchain_openai import ChatOpenAI
        from dotenv import load_dotenv
        
        # Ensure env vars are loaded
        load_dotenv()
        
        models = {
            "intake": AgentConfig.INTAKE_MODEL,
            "researcher": AgentConfig.RESEARCHER_MODEL,
            "strategist": AgentConfig.STRATEGIST_MODEL,
            "critic": AgentConfig.CRITIC_MODEL,
            "writer": AgentConfig.WRITER_MODEL,
        }
        
        model_name = models.get(role, "gpt-4o-mini")
        temperature = AgentConfig.TEMPERATURES.get(role, 0.5)
        
        print(f"🔌 Initializing {role.upper()} with {model_name} (temp={temperature})")
        
        return ChatOpenAI(
            model=model_name,
            temperature=temperature,
            api_key=os.environ.get("OPENAI_API_KEY")
        )
