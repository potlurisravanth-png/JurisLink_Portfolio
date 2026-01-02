import requests
import json

URL = "http://localhost:7071/api/chat"
payload = {
    "message": "ping",
    "history": []
}

try:
    print(f"Testing connection to {URL}...")
    response = requests.post(URL, json=payload, timeout=10)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("SUCCESS: Backend is reachable and responding.")
    else:
        print("FAILURE: Backend reachable but returned error.")
        
except Exception as e:
    print(f"ERROR: Could not connect to backend. {e}")
