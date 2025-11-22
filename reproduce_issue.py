import requests
import requests
from jose import jwt
import datetime
import os

# Configuration matching docker-compose.yml
JWT_SECRET = "your-secret-key-change-in-production"
JWT_ALGORITHM = "HS256"
BASE_URL = "http://conversation-service:8002"  # Conversation Service

def create_test_token():
    payload = {
        "sub": "1",  # User ID as string, matching user-service
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token

def test_fetch_cases():
    token = create_test_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"Testing with token: {token[:20]}...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/cases", headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 403:
            print("FAILURE: Received 403 Forbidden")
        elif response.status_code == 200:
            print("SUCCESS: Received 200 OK")
        else:
            print(f"Unexpected status: {response.status_code}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_fetch_cases()
