import requests
import json
import sys

# The URL of your local Azure Function
API_URL = "http://localhost:7071/api/chat"

def chat_loop():
    print("--- JURISLINK LOCAL TEST CONSOLE ---")
    print("Type 'quit' to exit.")
    print("-" * 30)

    # Initialize empty history
    history = []

    while True:
        user_input = input("\nYOU: ")
        if user_input.lower() in ['quit', 'exit']:
            break

        # Payload matching the Frontend/Backend contract
        payload = {
            "message": user_input,
            "history": history
        }

        try:
            print("... Agent is thinking ...")
            response = requests.post(API_URL, json=payload)
            
            if response.status_code == 200:
                data = response.json()
                bot_msg = data.get("response", "No response field")
                facts = data.get("facts", {})
                
                print(f"AGENT: {bot_msg}")
                if facts:
                    print(f"\n[DEBUG] Facts Extracted: {facts}")
                
                # Update history for next turn (simulating frontend state)
                history.append({"role": "user", "content": user_input})
                history.append({"role": "assistant", "content": bot_msg})
                
            else:
                print(f"ERROR {response.status_code}: {response.text}")

        except requests.exceptions.ConnectionError:
            print("ERROR: Could not connect to localhost:7071. Is 'func start' running?")
            break

if __name__ == "__main__":
    chat_loop()
