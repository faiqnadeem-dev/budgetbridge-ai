import requests
import json
import random

# URL for the ML service
ML_SERVICE_URL = "http://localhost:8000"

def generate_test_data():
    """Generate test data with clear anomalies for Isolation Forest"""
    # Create a cluster of normal transactions
    normal_transactions = []
    for i in range(20):
        # Normal transactions have amounts between 45-55 and similar dates
        normal_transactions.append({
            "id": f"tx{i+1}",
            "amount": random.uniform(45, 55),
            "date": f"2025-01-{(i % 28) + 1:02d}",
            "category": "test",
            "categoryName": "Test Category",
            "type": "expense"
        })
    
    # Create a few outliers that are very different
    outliers = [
        {
            "id": "outlier1",
            "amount": 500.0,  # Much higher amount
            "date": "2025-02-15",
            "category": "test",
            "categoryName": "Test Category",
            "type": "expense"
        },
        {
            "id": "outlier2",
            "amount": 1.0,  # Much lower amount
            "date": "2025-02-20",
            "category": "test",
            "categoryName": "Test Category",
            "type": "expense"
        },
        {
            "id": "outlier3",
            "amount": 300.0,  # Another high amount
            "date": "2025-03-05",
            "category": "test",
            "categoryName": "Test Category",
            "type": "expense"
        }
    ]
    
    # Combine and return all transactions
    all_transactions = normal_transactions + outliers
    return all_transactions

def test_isolation_forest():
    """Test the Isolation Forest algorithm with suitable test data"""
    print("\n=== Testing Isolation Forest Detection ===")
    
    # Generate test data
    test_transactions = generate_test_data()
    print(f"Generated {len(test_transactions)} test transactions")
    
    # Print some sample transactions
    print("\nSample transactions:")
    for i in range(min(3, len(test_transactions))):
        print(f"  {test_transactions[i]}")
    print("  ...")
    for i in range(max(0, len(test_transactions)-3), len(test_transactions)):
        print(f"  {test_transactions[i]}")
    
    # Create the request payload
    payload = {
        "transactions": test_transactions
    }
    
    # Set up headers with a dummy token
    headers = {
        "Authorization": "Bearer dummy-token",
        "Content-Type": "application/json"
    }
    
    try:
        # Make the request
        response = requests.post(
            f"{ML_SERVICE_URL}/detect-category-anomalies/test",
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
                
                print("\n✅ Test passed! Isolation Forest detected anomalies.")
            else:
                print("\n❌ Test failed! No anomalies were detected.")
                
                # Check server logs
                print("\nChecking server logs...")
                try:
                    log_response = requests.get(f"{ML_SERVICE_URL}/logs")
                    if log_response.status_code == 200:
                        logs = log_response.json()
                        print("\nRecent server logs:")
                        for log in logs[-10:]:  # Show last 10 log entries
                            print(f"  {log}")
                    else:
                        print(f"  Could not retrieve logs: {log_response.status_code}")
                except Exception as e:
                    print(f"  Error retrieving logs: {str(e)}")
        else:
            print(f"❌ Error: {response.text}")
    
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    print("=== Isolation Forest Test ===")
    test_isolation_forest()
