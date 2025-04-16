import os
import sys
import json
import random
import shutil
from datetime import datetime, timedelta
import requests
from pprint import pprint

# Add app directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

# Import directly from app to test the logic
from app.anomaly_detection import detect_anomalies_isolation_forest

# Base URL for the service API when using real HTTP endpoints
API_URL = "http://localhost:8000"

def ensure_test_dirs():
    """Ensure test directories exist"""
    os.makedirs("data/user_feedback/test-user", exist_ok=True)
    os.makedirs("data/alerts/test-user", exist_ok=True)

def clear_test_data():
    """Clear any previous test data"""
    if os.path.exists("data/user_feedback/test-user"):
        shutil.rmtree("data/user_feedback/test-user")
    if os.path.exists("data/alerts/test-user"):
        shutil.rmtree("data/alerts/test-user")
    ensure_test_dirs()

def generate_transaction_data(normal_amount_range=(30, 50), anomaly_amount=120):
    """Generate transaction data for testing"""
    # Create a category
    category = "dining"
    category_name = "Dining Out"
    
    # Base date (30 days ago)
    base_date = datetime.now() - timedelta(days=30)
    
    # Generate 5 normal transactions
    transactions = []
    for i in range(5):
        # Normal transaction in specified range
        amount = random.uniform(normal_amount_range[0], normal_amount_range[1])
        
        # Create transaction with dates a few days apart
        date = (base_date + timedelta(days=i*5)).strftime("%Y-%m-%d")
        
        # Create transaction
        tx = {
            "id": f"normal-{i}",
            "amount": round(amount, 2),
            "date": date,
            "category": category,
            "categoryName": category_name,
            "description": f"Normal dinner #{i+1}",
            "type": "expense"
        }
        transactions.append(tx)
    
    # Add one high value transaction
    high_tx = {
        "id": "high-value",
        "amount": anomaly_amount,
        "date": datetime.now().strftime("%Y-%m-%d"),  # Today
        "category": category,
        "categoryName": category_name,
        "description": "Expensive dinner",
        "type": "expense"
    }
    transactions.append(high_tx)
    
    return transactions, category

def save_user_feedback(is_normal=True, category="dining", amount=120, alert_threshold=None):
    """
    Simulate saving user feedback
    - is_normal: whether user thinks this is normal spending
    - category: category of the transaction
    - amount: amount of the anomaly
    - alert_threshold: if not normal, the alert threshold to set
    """
    user_id = "test-user"
    
    if is_normal:
        # Save as normal spending pattern
        print("User says: 'This is normal spending for me'")
        
        # Get the range for this amount
        amount_range = get_range_for_amount(amount)
        
        # Create an accepted ranges file
        accepted_ranges = {}
        
        # Mark this range and all lower ranges as accepted
        ranges_order = ["low", "medium_low", "medium", "high", "very_high", "extreme"]
        range_index = ranges_order.index(amount_range)
        
        for i in range(range_index + 1):
            range_key = f"{category}_{ranges_order[i]}"
            accepted_ranges[range_key] = True
            print(f"Marking range {range_key} as normal based on user feedback")
            
        # Save to file
        file_path = f"data/user_feedback/{user_id}/accepted_ranges.json"
        with open(file_path, 'w') as f:
            json.dump(accepted_ranges, f)
            
        print(f"Saved user accepted ranges to {file_path}")
    
    elif alert_threshold:
        # Set an alert threshold
        print(f"User says: 'This is not normal, alert me if over ${alert_threshold}'")
        
        # Create alert data
        alerts = [
            {
                "category": category,
                "threshold": alert_threshold,
                "active": True
            }
        ]
        
        # Save to file
        file_path = f"data/alerts/{user_id}/category_alerts.json"
        with open(file_path, 'w') as f:
            json.dump(alerts, f)
            
        print(f"Saved user alert threshold to {file_path}")

def get_range_for_amount(amount):
    """Calculate spending range for an amount"""
    ranges = {
        "low": (0, 50),
        "medium_low": (50, 100),
        "medium": (100, 150),
        "high": (150, 200),
        "very_high": (200, 300),
        "extreme": (300, float('inf'))
    }
    
    for range_name, (min_val, max_val) in ranges.items():
        if min_val <= amount < max_val:
            return range_name
    
    return "extreme"

def test_scenario_1():
    """Test scenario: User marks high value as normal"""
    print("\n=== TEST SCENARIO 1: User marks high value as normal ===\n")
    
    # Clear previous test data
    clear_test_data()
    
    # Generate test data
    transactions, category = generate_transaction_data()
    print(f"Generated {len(transactions)} transactions with 1 high value ($120)")
    
    # Run anomaly detection - should detect the high value
    print("\nRunning anomaly detection (before user feedback)...")
    anomalies = detect_anomalies_isolation_forest(transactions)
    
    print(f"\nDetected {len(anomalies)} anomalies:")
    for anomaly in anomalies:
        print(f"  • ${anomaly.get('amount'):.2f} - {anomaly.get('description')}")
    
    # User marks this as normal spending
    save_user_feedback(is_normal=True, category=category, amount=120)
    
    # Run anomaly detection again - should NOT detect the high value
    print("\nRunning anomaly detection (after user feedback)...")
    user_accepted_ranges = {}
    with open(f"data/user_feedback/test-user/accepted_ranges.json", 'r') as f:
        user_accepted_ranges = json.load(f)
    
    anomalies = detect_anomalies_isolation_forest(
        transactions,
        user_id="test-user",
        user_accepted_ranges=user_accepted_ranges
    )
    
    print(f"\nDetected {len(anomalies)} anomalies after feedback:")
    for anomaly in anomalies:
        print(f"  • ${anomaly.get('amount'):.2f} - {anomaly.get('description')}")
    
    # Test result
    if any(a.get('id') == 'high-value' for a in anomalies):
        print("\n❌ Test failed: High value transaction still detected after user marked it as normal")
    else:
        print("\n✅ Test passed: High value transaction no longer detected after user marked it as normal")

def test_scenario_2():
    """Test scenario: User sets alert threshold"""
    print("\n=== TEST SCENARIO 2: User sets alert threshold ===\n")
    
    # Clear previous test data
    clear_test_data()
    
    # Generate test data with higher anomaly
    transactions, category = generate_transaction_data(anomaly_amount=180)
    print(f"Generated {len(transactions)} transactions with 1 high value ($180)")
    
    # Run anomaly detection - should detect the high value
    print("\nRunning anomaly detection (before user feedback)...")
    anomalies = detect_anomalies_isolation_forest(transactions)
    
    print(f"\nDetected {len(anomalies)} anomalies:")
    for anomaly in anomalies:
        print(f"  • ${anomaly.get('amount'):.2f} - {anomaly.get('description')}")
    
    # User sets alert threshold of $200
    save_user_feedback(is_normal=False, category=category, amount=180, alert_threshold=200)
    
    # Run anomaly detection again with higher amount transaction
    print("\nRunning anomaly detection with new transaction above threshold...")
    
    # Add new transaction above threshold
    new_tx = {
        "id": "above-threshold",
        "amount": 220.00,
        "date": datetime.now().strftime("%Y-%m-%d"),
        "category": category,
        "categoryName": "Dining Out",
        "description": "Very expensive dinner",
        "type": "expense"
    }
    transactions.append(new_tx)
    
    # Load user alert threshold
    with open(f"data/alerts/test-user/category_alerts.json", 'r') as f:
        alerts = json.load(f)
    
    user_alert_thresholds = {}
    for alert in alerts:
        if alert.get('active', True):
            user_alert_thresholds[f"{alert['category']}_threshold"] = alert['threshold']
    
    # Run detection
    anomalies = detect_anomalies_isolation_forest(
        transactions,
        user_id="test-user",
        user_alert_thresholds=user_alert_thresholds
    )
    
    print(f"\nDetected {len(anomalies)} anomalies after setting threshold:")
    for anomaly in anomalies:
        print(f"  • ${anomaly.get('amount'):.2f} - {anomaly.get('description')}")
    
    # Test results
    high_value_detected = any(a.get('id') == 'high-value' for a in anomalies)
    above_threshold_detected = any(a.get('id') == 'above-threshold' for a in anomalies)
    
    print("\nTest results:")
    print(f"  • High value transaction ($180) detected: {high_value_detected}")
    print(f"  • Above threshold transaction ($220) detected: {above_threshold_detected}")
    
    if not high_value_detected and above_threshold_detected:
        print("\n✅ Test passed: System correctly respects the user's alert threshold")
    else:
        print("\n❌ Test failed: System is not correctly applying the alert threshold")

def run_all_tests():
    """Run all test scenarios"""
    print("\n===== TESTING ISOLATION FOREST WITH USER FEEDBACK =====\n")
    
    test_scenario_1()
    test_scenario_2()
    
    print("\n===== ALL TESTS COMPLETED =====")

if __name__ == "__main__":
    run_all_tests() 