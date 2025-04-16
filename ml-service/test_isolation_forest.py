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

# Set up test data generation
def generate_test_transactions(num_normal=30, num_anomalies=5):
    """
    Generate test transaction data with clear patterns and anomalies
    """
    # Create categories with different normal spending patterns
    categories = {
        "groceries": {"name": "Groceries", "mean": 75, "std": 10},
        "dining": {"name": "Dining Out", "mean": 45, "std": 8},
        "utilities": {"name": "Utilities", "mean": 120, "std": 15},
        "entertainment": {"name": "Entertainment", "mean": 35, "std": 5}
    }
    
    # Generate base date (30 days ago)
    base_date = datetime.now() - timedelta(days=30)
    
    # Generate normal transactions - make them very consistent patterns
    transactions = []
    
    # For each category, create a tight cluster of normal transactions
    for category_key, category_info in categories.items():
        for i in range(int(num_normal / 4)):  # Divide evenly among categories
            # Generate amount with tighter distribution
            amount = max(5, np.random.normal(category_info["mean"], category_info["std"] * 0.5))
            
            # Generate date - spread evenly across month
            day_offset = int((i / (num_normal / 4)) * 28)  # Spread across ~28 days
            date = (base_date + timedelta(days=day_offset)).strftime("%Y-%m-%d")
            
            # Create transaction
            tx = {
                "id": f"normal-{category_key}-{i}",
                "amount": round(amount, 2),
                "date": date,
                "category": category_key,
                "categoryName": category_info["name"],
                "description": f"{category_info['name']} purchase #{i}",
                "type": "expense"
            }
            transactions.append(tx)
    
    # Generate anomalous transactions with much more extreme values
    for i in range(num_anomalies):
        # Create anomalies in different ways - make them more extreme
        if i == 0:
            # Anomaly 1: Very high amount in groceries (10x normal)
            category_key = "groceries"
            amount = categories[category_key]["mean"] * 10  # 10x normal
            description = "Huge grocery splurge"
        elif i == 1:
            # Anomaly 2: Very high dining expense (15x normal)
            category_key = "dining"
            amount = categories[category_key]["mean"] * 15  # 15x normal
            description = "Expensive restaurant"
        elif i == 2:
            # Anomaly 3: Very low utilities (1/20th normal)
            category_key = "utilities"
            amount = categories[category_key]["mean"] * 0.05  # 1/20th normal
            description = "Partial utility payment"
        elif i == 3:
            # Anomaly 4: Unusual day pattern - put transaction on day 0
            category_key = "entertainment"
            amount = categories[category_key]["mean"] * 8  # 8x normal
            description = "Multiple entertainment purchases same day"
            # Use a specific date pattern
            date = base_date.strftime("%Y-%m-%d")
        else:
            # Anomaly 5: Extreme entertainment expense
            category_key = "entertainment"
            amount = categories[category_key]["mean"] * 20  # 20x normal
            description = "Very expensive entertainment"
        
        # Generate date (unless overridden above)
        if 'date' not in locals() or i != 3:  # Skip if date already set for anomaly 4
            # Place anomalies in different part of the month than normal transactions
            days_ago = random.randint(0, 5)  # Very recent transactions (unusual pattern)
            date = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")
            
        # Create transaction
        tx = {
            "id": f"anomaly-{i}",
            "amount": round(amount, 2),
            "date": date,
            "category": category_key,
            "categoryName": categories[category_key]["name"],
            "description": description,
            "type": "expense"
        }
        transactions.append(tx)
    
    # Make anomalies more clearly distinct
    # Add a few more normal transactions to better establish patterns
    for i in range(10):
        category_key = random.choice(list(categories.keys()))
        category_info = categories[category_key]
        amount = max(5, np.random.normal(category_info["mean"], category_info["std"] * 0.5))
        day_offset = random.randint(6, 28)  # Normal range
        date = (base_date + timedelta(days=day_offset)).strftime("%Y-%m-%d")
        
        tx = {
            "id": f"normal-extra-{i}",
            "amount": round(amount, 2),
            "date": date,
            "category": category_key,
            "categoryName": category_info["name"],
            "description": f"{category_info['name']} regular purchase #{i}",
            "type": "expense"
        }
        transactions.append(tx)
    
    return transactions

def run_test():
    """Run a test of the Isolation Forest anomaly detection"""
    print("\n===== ISOLATION FOREST ANOMALY DETECTION TEST =====\n")
    logger.info("Starting test")
    
    # 1. Generate test data
    print("Generating test transaction data...")
    transactions = generate_test_transactions()
    logger.info(f"Generated {len(transactions)} test transactions")
    print(f"Generated {len(transactions)} test transactions\n")
    
    # 2. Show sample of normal transactions
    print("Sample of normal transactions:")
    normal_samples = [tx for tx in transactions if "normal" in tx["id"]][:3]
    for tx in normal_samples:
        print(f"  • {tx['categoryName']}: ${tx['amount']:.2f} on {tx['date']} - {tx['description']}")
    
    # 3. Show all anomalous transactions we inserted
    print("\nAnomalous transactions we inserted (ground truth):")
    anomaly_samples = [tx for tx in transactions if "anomaly" in tx["id"]]
    for tx in anomaly_samples:
        print(f"  • {tx['categoryName']}: ${tx['amount']:.2f} on {tx['date']} - {tx['description']}")
    
    # 4. Run anomaly detection
    print("\nRunning Isolation Forest anomaly detection...")
    logger.info("Calling detect_anomalies_isolation_forest")
    try:
        # Pass None for user_accepted_ranges and user_alert_thresholds to focus on model-based detection
        detected_anomalies = detect_anomalies_isolation_forest(
            transactions, 
            user_id=None, 
            user_accepted_ranges=None, 
            user_alert_thresholds=None
        )
        logger.info(f"Detection complete. Found {len(detected_anomalies)} anomalies")
    except Exception as e:
        logger.error(f"Error in anomaly detection: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        print(f"ERROR: {str(e)}")
        return
    
    # 5. Show detected anomalies
    print(f"\nDetected {len(detected_anomalies)} anomalies:")
    for i, anomaly in enumerate(detected_anomalies):
        score = anomaly.get('anomalyScore', 0)
        amount = anomaly.get('amount', 0)
        category = anomaly.get('categoryName', 'Unknown')
        desc = anomaly.get('description', 'Unknown')
        reason = anomaly.get('reason', 'No reason provided')
        severity = anomaly.get('severity', 'Unknown')
        
        was_injected = 'Yes' if 'anomaly' in anomaly.get('id', '') else 'No'
        
        print(f"\nAnomaly #{i+1} (Was injected: {was_injected})")
        print(f"  • Transaction: {category}: ${float(amount):.2f} - {desc}")
        print(f"  • Anomaly Score: {score:.4f}")
        print(f"  • Severity: {severity}")
        print(f"  • Reason: {reason}")
        
        # Add more details if available
        if 'z_score' in anomaly:
            print(f"  • Statistical Z-Score: {anomaly['z_score']:.2f}")
        if 'category_ratio' in anomaly:
            print(f"  • Ratio to Category Average: {anomaly['category_ratio']:.2f}x")
    
    # 6. Evaluate detection quality
    injected_ids = set(tx["id"] for tx in transactions if "anomaly" in tx["id"])
    detected_ids = set(tx.get("id", "") for tx in detected_anomalies)
    true_positives = injected_ids.intersection(detected_ids)
    
    print(f"\nDetection Results:")
    print(f"  • True positives: {len(true_positives)}/{len(injected_ids)} injected anomalies detected")
    print(f"  • Additional anomalies found: {len(detected_ids) - len(true_positives)}")
    
    # Calculate detection rate
    detection_rate = len(true_positives) / len(injected_ids) if injected_ids else 0
    print(f"  • Detection rate: {detection_rate*100:.1f}%")
    
    # Print true positives
    print("\nInjected anomalies that were detected:")
    for i, anomaly_id in enumerate(true_positives):
        anomaly = next((tx for tx in transactions if tx["id"] == anomaly_id), None)
        if anomaly:
            print(f"  • {anomaly['categoryName']}: ${float(anomaly['amount']):.2f} - {anomaly['description']}")
    
    # Print missed anomalies
    missed = injected_ids - detected_ids
    if missed:
        print("\nInjected anomalies that were missed:")
        for i, anomaly_id in enumerate(missed):
            anomaly = next((tx for tx in transactions if tx["id"] == anomaly_id), None)
            if anomaly:
                print(f"  • {anomaly['categoryName']}: ${float(anomaly['amount']):.2f} - {anomaly['description']}")
    
    logger.info("Test completed successfully")
    print("\n===== TEST COMPLETE =====")

if __name__ == "__main__":
    logger.info("Script started")
    try:
        run_test()
    except Exception as e:
        logger.error(f"Unhandled exception: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        print(f"ERROR: {str(e)}")
    logger.info("Script finished") 