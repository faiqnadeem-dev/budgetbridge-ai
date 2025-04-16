import sys
import os
import json
import random
from datetime import datetime, timedelta
import numpy as np
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("test-script")

# Add the app directory to the path so we can import modules
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))
logger.info(f"Added app directory to path: {os.path.join(os.path.dirname(__file__), 'app')}")

try:
    # Import the anomaly detection function
    from anomaly_detection import detect_anomalies_isolation_forest
    logger.info("Successfully imported anomaly_detection module")
except Exception as e:
    logger.error(f"Error importing anomaly_detection: {str(e)}")
    raise

def test_scenario():
    """Test the exact scenario described - normal range 30-50, anomaly at 120"""
    print("\n===== SIMPLE ANOMALY DETECTION TEST =====\n")
    
    # Create a category with normal spending in 30-50 range
    category = "dining"
    category_name = "Dining Out"
    
    # Base date (for transactions over last 30 days)
    base_date = datetime.now() - timedelta(days=30)
    
    # Generate 5 normal transactions in 30-50 range
    transactions = []
    for i in range(5):
        # Normal transaction in 30-50 range
        amount = random.uniform(30, 50)
        
        # Create transaction a few days apart
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
    
    # Add one high value transaction (120)
    high_tx = {
        "id": "high-value",
        "amount": 120.00,
        "date": datetime.now().strftime("%Y-%m-%d"),  # Today
        "category": category,
        "categoryName": category_name,
        "description": "Expensive dinner",
        "type": "expense"
    }
    transactions.append(high_tx)
    
    # Add one low value transaction ($15)
    low_tx = {
        "id": "low-value",
        "amount": 15.00,
        "date": datetime.now().strftime("%Y-%m-%d"),  # Today
        "category": category,
        "categoryName": category_name,
        "description": "Cheap lunch",
        "type": "expense"
    }
    transactions.append(low_tx)
    
    # Print all transactions
    print("Test Transactions:")
    for tx in transactions:
        print(f"  • {tx['amount']:.2f} - {tx['description']}")
    
    # Run anomaly detection
    print("\nRunning anomaly detection...")
    detected_anomalies = detect_anomalies_isolation_forest(transactions)
    
    # Show detected anomalies
    print(f"\nDetected {len(detected_anomalies)} anomalies:")
    for anomaly in detected_anomalies:
        amount = anomaly.get('amount', 0)
        desc = anomaly.get('description', 'Unknown')
        score = anomaly.get('anomalyScore', 0)
        id_type = "High" if anomaly.get('id') == "high-value" else (
                  "Low" if anomaly.get('id') == "low-value" else "Normal")
        
        print(f"  • {amount:.2f} - {desc} (Score: {score:.4f}, Type: {id_type})")
    
    # Check if only the high value was detected
    high_detected = any(a.get('id') == "high-value" for a in detected_anomalies)
    low_detected = any(a.get('id') == "low-value" for a in detected_anomalies)
    
    print("\nTest Results:")
    print(f"  • High value detected: {high_detected}")
    print(f"  • Low value detected: {low_detected}")
    
    if high_detected and not low_detected:
        print("\n✅ SUCCESS: System correctly identified only the high value anomaly")
    elif high_detected and low_detected:
        print("\n❌ ISSUE: System detected both high and low values as anomalies")
    elif not high_detected:
        print("\n❌ ISSUE: System failed to detect the high value anomaly")
    
    print("\n===== TEST COMPLETE =====")

if __name__ == "__main__":
    test_scenario() 