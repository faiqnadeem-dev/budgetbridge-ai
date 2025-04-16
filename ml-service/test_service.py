import requests
import json

# URL for the ML service
ML_SERVICE_URL = "http://localhost:8000"

# Sample transaction data for testing
sample_transactions = [
    {
        "id": "tx1",
        "amount": 50.0,
        "date": "2025-03-01",
        "category": "groceries",
        "categoryName": "Groceries",
        "description": "Weekly shopping",
        "type": "expense"
    },
    {
        "id": "tx2",
        "amount": 45.0,
        "date": "2025-03-08",
        "category": "groceries",
        "categoryName": "Groceries",
        "description": "Weekly shopping",
        "type": "expense"
    },
    {
        "id": "tx3",
        "amount": 55.0,
        "date": "2025-03-15",
        "category": "groceries",
        "categoryName": "Groceries",
        "description": "Weekly shopping",
        "type": "expense"
    },
    {
        "id": "tx4",
        "amount": 48.0,
        "date": "2025-03-22",
        "category": "groceries",
        "categoryName": "Groceries",
        "description": "Weekly shopping",
        "type": "expense"
    },
    {
        "id": "tx5",
        "amount": 500.0,  # This is an anomaly - much higher than usual
        "date": "2025-03-29",
        "category": "groceries",
        "categoryName": "Groceries",
        "description": "Big party shopping",
        "type": "expense"
    }
]

def test_health_check():
    """Test the health check endpoint"""
    print("\n=== Testing Health Check ===")
    response = requests.get(f"{ML_SERVICE_URL}/")
    print(f"Status code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 200:
        print("✅ Health check passed!")
    else:
        print("❌ Health check failed!")

def test_category_anomaly_detection():
    """Test the category anomaly detection endpoint"""
    print("\n=== Testing Category Anomaly Detection ===")
    category_id = "groceries"
    
    # Create the request payload
    payload = {
        "transactions": sample_transactions
    }
    
    # Set up headers with a dummy token (for development only)
    headers = {
        "Authorization": "Bearer dummy-token",
        "Content-Type": "application/json"
    }
    
    try:
        # Make the request
        response = requests.post(
            f"{ML_SERVICE_URL}/detect-category-anomalies/{category_id}",
            json=payload,
            headers=headers
        )
        
        print(f"Status code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Detection method used: {result.get('method', 'unknown')}")
            print(f"Number of anomalies found: {result.get('count', 0)}")
            
            # Print details of anomalies
            anomalies = result.get('anomalies', [])
            if anomalies:
                print("\nAnomalies found:")
                for i, anomaly in enumerate(anomalies, 1):
                    print(f"\nAnomaly #{i}:")
                    print(f"  Amount: ${anomaly.get('amount')}")
                    print(f"  Date: {anomaly.get('date')}")
                    print(f"  Score: {anomaly.get('anomalyScore')}")
                    print(f"  Reason: {anomaly.get('reason')}")
            
            print("\n✅ Category anomaly detection test passed!")
        else:
            print(f"❌ Error: {response.text}")
    
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def test_user_anomaly_detection():
    """Test the user anomaly detection endpoint"""
    print("\n=== Testing User Anomaly Detection ===")
    
    # Create the request payload with transactions by category
    payload = {
        "transactions_by_category": {
            "groceries": sample_transactions,
            "dining": [
                {
                    "id": "tx6",
                    "amount": 30.0,
                    "date": "2025-03-05",
                    "category": "dining",
                    "categoryName": "Dining",
                    "description": "Lunch",
                    "type": "expense"
                },
                {
                    "id": "tx7",
                    "amount": 35.0,
                    "date": "2025-03-12",
                    "category": "dining",
                    "categoryName": "Dining",
                    "description": "Dinner",
                    "type": "expense"
                },
                {
                    "id": "tx8",
                    "amount": 28.0,
                    "date": "2025-03-19",
                    "category": "dining",
                    "categoryName": "Dining",
                    "description": "Lunch",
                    "type": "expense"
                },
                {
                    "id": "tx9",
                    "amount": 32.0,
                    "date": "2025-03-26",
                    "category": "dining",
                    "categoryName": "Dining",
                    "description": "Dinner",
                    "type": "expense"
                },
                {
                    "id": "tx10",
                    "amount": 500.0,  # This is an anomaly
                    "date": "2025-03-30",
                    "category": "dining",
                    "categoryName": "Dining",
                    "description": "Fancy restaurant",
                    "type": "expense"
                }
            ]
        }
    }
    
    # Set up headers with a dummy token
    headers = {
        "Authorization": "Bearer dummy-token",
        "Content-Type": "application/json"
    }
    
    try:
        # Make the request
        response = requests.post(
            f"{ML_SERVICE_URL}/detect-user-anomalies",
            json=payload,
            headers=headers
        )
        
        print(f"Status code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Total number of anomalies found: {result.get('count', 0)}")
            
            # Print category results
            category_results = result.get('category_results', {})
            if category_results:
                print("\nResults by category:")
                for category, cat_result in category_results.items():
                    print(f"\n{category}:")
                    print(f"  Method: {cat_result.get('method', 'unknown')}")
                    print(f"  Anomalies: {cat_result.get('count', 0)}")
            
            # Print details of anomalies
            anomalies = result.get('anomalies', [])
            if anomalies:
                print("\nTop anomalies found:")
                for i, anomaly in enumerate(anomalies[:3], 1):  # Show top 3
                    print(f"\nAnomaly #{i}:")
                    print(f"  Category: {anomaly.get('categoryName')}")
                    print(f"  Amount: ${anomaly.get('amount')}")
                    print(f"  Date: {anomaly.get('date')}")
                    print(f"  Score: {anomaly.get('anomalyScore')}")
                    print(f"  Reason: {anomaly.get('reason')}")
            
            print("\n✅ User anomaly detection test passed!")
        else:
            print(f"❌ Error: {response.text}")
    
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    print("=== ML Service Test Script ===")
    print(f"Testing service at: {ML_SERVICE_URL}")
    
    # Run the tests
    test_health_check()
    test_category_anomaly_detection()
    test_user_anomaly_detection()
    
    print("\n=== Testing Complete ===")
