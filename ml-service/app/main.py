from fastapi import FastAPI, HTTPException, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Optional, Any, Union
from jose import jwt, JWTError
import json
import logging
import traceback
from pydantic import BaseModel
import os
import pandas as pd
import numpy as np
import math

from .anomaly_detection import detect_anomalies_isolation_forest, detect_anomalies_sliding_window
from .models import AnomalyResponse, TransactionList, CategoryAnomalyRequest, AnomalyFeedback, AnomalyFeedbackResponse, CategoryAlert

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("ml-service")

# Create an in-memory log handler for retrieving logs via API
class MemoryLogHandler(logging.Handler):
    def __init__(self, capacity=1000):
        super().__init__()
        self.capacity = capacity
        self.logs = []
        
    def emit(self, record):
        log_entry = self.format(record)
        self.logs.append(log_entry)
        # Keep only the most recent logs
        if len(self.logs) > self.capacity:
            self.logs = self.logs[-self.capacity:]
            
    def get_logs(self):
        return self.logs

# Create and add the memory handler
memory_handler = MemoryLogHandler()
memory_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
logger.addHandler(memory_handler)

# Development mode flag - set to True for testing
DEV_MODE = True

# Ensure data directories exist
os.makedirs("data/user_feedback", exist_ok=True)
os.makedirs("data/alerts", exist_ok=True)

app = FastAPI(title="Anomaly Detection Service")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],  # Expose all headers
)

# Authentication middleware
async def verify_token(authorization: str = Header(...)):
    """Verify JWT token from Clerk"""
    try:
        # Skip authentication in development mode
        if DEV_MODE:
            logger.info("DEV MODE: Authentication bypassed")
            return {"sub": "test-user", "dev_mode": True}
            
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid authorization header format")
        
        token = authorization.replace("Bearer ", "")
        
        # For Clerk tokens, we would normally verify with Clerk's JWKS
        # For now, we'll just decode without verification for development
        # In production, use the proper verification with Clerk's public keys
        try:
            payload = jwt.decode(
                token, 
                options={"verify_signature": False}
            )
            return payload
        except JWTError as e:
            logger.error(f"JWT decode error: {str(e)}")
            raise HTTPException(status_code=401, detail="Invalid token format")
            
    except Exception as e:
        logger.error(f"Auth error: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=401, detail="Authentication failed")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "service": "anomaly-detection"}

@app.get("/logs")
async def get_logs():
    """Get recent logs for debugging"""
    return memory_handler.get_logs()

@app.post("/detect-category-anomalies/{category_id}")
async def detect_category_anomalies(
    category_id: str, 
    request: CategoryAnomalyRequest,
    user: Dict = Depends(verify_token)
):
    """Detect anomalies for a specific category"""
    try:
        logger.info(f"Processing anomaly detection for category: {category_id}")
        logger.info(f"Number of transactions: {len(request.transactions)}")
        
        # Enhanced debugging: Log all transactions
        for i, tx in enumerate(request.transactions):
            tx_amount = abs(float(tx.get('amount', 0)))
            logger.info(f"Input Transaction #{i}: amount=${tx_amount:.2f}, desc={tx.get('description', 'N/A')}")
        
        # Get user ID from token for user-specific preferences
        user_id = user.get('sub', 'unknown')
        
        # Load user's accepted ranges if available
        user_accepted_ranges = {}
        user_ranges_file = f"data/user_feedback/{user_id}/accepted_ranges.json"
        if os.path.exists(user_ranges_file):
            try:
                with open(user_ranges_file, 'r') as f:
                    user_accepted_ranges = json.load(f)
                logger.info(f"Loaded {len(user_accepted_ranges)} accepted ranges for user {user_id}")
            except Exception as e:
                logger.error(f"Error loading user accepted ranges: {str(e)}")
        
        # Load user's category alerts
        category_alerts = {}
        alerts_file = f"data/alerts/{user_id}/category_alerts.json"
        if os.path.exists(alerts_file):
            try:
                with open(alerts_file, 'r') as f:
                    alerts_list = json.load(f)
                    for alert in alerts_list:
                        if alert.get('active', True):
                            category_alerts[alert.get('category')] = alert.get('threshold')
                logger.info(f"Loaded user alert thresholds: {category_alerts}")
            except Exception as e:
                logger.error(f"Error loading user alerts: {str(e)}")
        
        # Also use any alert thresholds provided in the request
        request_alerts = request.alert_thresholds if hasattr(request, 'alert_thresholds') else {}
        if request_alerts:
            # Merge with category_alerts, request takes precedence
            category_alerts.update(request_alerts)
            logger.info(f"Using merged alert thresholds: {category_alerts}")
        
        # Prepare threshold for isolation forest
        formatted_thresholds = {}
        if category_id in category_alerts:
            threshold = category_alerts[category_id]
            formatted_thresholds[f"{category_id}_threshold"] = threshold
            logger.info(f"Using threshold for {category_id}: ${threshold}")
        
        # Force detect high transactions for fallback detection
        debug_anomalies = []
        if len(request.transactions) >= 5:
            # Calculate average
            amounts = [abs(float(tx.get('amount', 0))) for tx in request.transactions]
            avg_amount = sum(amounts) / len(amounts)
            std_dev = np.std(amounts) if len(amounts) > 1 else avg_amount * 0.2  # Estimate std dev if only one transaction
            logger.info(f"Average amount: ${avg_amount:.2f}, StdDev: ${std_dev:.2f}")
            
            # Check if there's an alert threshold for this category
            has_threshold = category_id in category_alerts
            alert_threshold = category_alerts.get(category_id, float('inf'))
            
            # Find any transaction > 1.8x average or > avg + 1.5*std_dev, whichever is higher
            # This ensures we only detect significantly higher values
            for i, tx in enumerate(request.transactions):
                tx_amount = abs(float(tx.get('amount', 0)))
                threshold = max(avg_amount * 1.8, avg_amount + 1.5 * std_dev)
                
                # Only flag if either:
                # 1. There's a threshold and the amount exceeds it, OR
                # 2. There's no threshold and the amount exceeds the statistical threshold
                if (has_threshold and tx_amount > alert_threshold) or (not has_threshold and tx_amount > threshold):
                    # Calculate appropriate message and score
                    if has_threshold and tx_amount > alert_threshold:
                        reason = f"This expense exceeds your ${alert_threshold:.2f} alert threshold for {tx.get('categoryName', 'this category')}."
                        threshold_used = alert_threshold
                    else:
                        ratio = tx_amount / avg_amount
                        reason = f"This {tx.get('categoryName', 'expense')} is {ratio:.1f}x higher than your typical spending pattern."
                        threshold_used = threshold
                    
                    logger.info(f"DIRECT DETECTION: Anomaly found: ${tx_amount:.2f} (threshold: ${threshold_used:.2f}, avg: ${avg_amount:.2f})")
                    
                    anomaly = tx.copy()
                    anomaly["anomalyScore"] = min(0.95, 0.6 + (0.1 * (tx_amount / avg_amount - 1)))
                    anomaly["reason"] = reason
                    anomaly["severity"] = "High" if tx_amount > avg_amount * 3 else "Medium"
                    debug_anomalies.append(anomaly)
        
        if len(request.transactions) < 5:
            logger.info(f"Not enough transactions for category {category_id} ({len(request.transactions)}/5)")
            return {
                "anomalies": [],
                "count": 0,
                "categoryId": category_id,
                "message": "Not enough transaction data for anomaly detection"
            }
        
        # Try isolation forest first with user preferences
        try:
            logger.info("Attempting isolation forest detection with user preferences")
            anomalies = detect_anomalies_isolation_forest(
                request.transactions,
                user_id=user_id, 
                user_accepted_ranges=user_accepted_ranges,
                user_alert_thresholds=formatted_thresholds
            )
            method = "isolation_forest"
            logger.info(f"Isolation forest found {len(anomalies)} anomalies")
            
            # Log any anomalies found
            if anomalies:
                for i, anomaly in enumerate(anomalies):
                    logger.info(f"Anomaly #{i+1}: amount={anomaly.get('amount')}, score={anomaly.get('anomalyScore')}")
            else:
                logger.warning("No anomalies found by Isolation Forest despite having sufficient data")
                
            # If isolation forest found nothing but direct detection did, use direct detection results
            if not anomalies and debug_anomalies:
                logger.info(f"Using {len(debug_anomalies)} directly detected anomalies as fallback")
                anomalies = debug_anomalies
                method = "direct_detection"
        except Exception as e:
            logger.error(f"Isolation forest failed: {str(e)}")
            logger.error(traceback.format_exc())
            # Fall back to sliding window
            logger.info("Falling back to sliding window detection")
            anomalies = detect_anomalies_sliding_window(request.transactions)
            method = "sliding_window"
            logger.info(f"Sliding window found {len(anomalies)} anomalies")
            
        return {
            "anomalies": anomalies,
            "count": len(anomalies),
            "categoryId": category_id,
            "method": method
        }
    except Exception as e:
        logger.error(f"Error in detect_category_anomalies: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/detect-user-anomalies")
async def detect_user_anomalies(
    request: TransactionList,
    user: Dict = Depends(verify_token)
):
    """Detect anomalies across all categories for a user"""
    try:
        logger.info(f"Processing user anomaly detection")
        logger.info(f"Number of categories: {len(request.transactions_by_category)}")
        
        # Get user ID from token
        user_id = user.get('sub', 'unknown')
        
        # Load user's accepted ranges if available
        user_accepted_ranges = {}
        user_ranges_file = f"data/user_feedback/{user_id}/accepted_ranges.json"
        if os.path.exists(user_ranges_file):
            try:
                with open(user_ranges_file, 'r') as f:
                    user_accepted_ranges = json.load(f)
                logger.info(f"Loaded {len(user_accepted_ranges)} accepted ranges for user {user_id}")
            except Exception as e:
                logger.error(f"Error loading user accepted ranges: {str(e)}")
        
        # Load user's category alerts
        category_alerts = {}
        alerts_file = f"data/alerts/{user_id}/category_alerts.json"
        if os.path.exists(alerts_file):
            try:
                with open(alerts_file, 'r') as f:
                    alerts_list = json.load(f)
                    for alert in alerts_list:
                        if alert.get('active', True):
                            category_alerts[alert.get('category')] = alert.get('threshold')
                logger.info(f"Loaded {len(category_alerts)} active alerts for user {user_id}: {category_alerts}")
            except Exception as e:
                logger.error(f"Error loading user alerts: {str(e)}")
        else:
            logger.info(f"No alert thresholds defined for user {user_id}")
        
        all_anomalies = []
        category_results = {}
        
        for category_id, transactions in request.transactions_by_category.items():
            try:
                logger.info(f"Processing category {category_id} with {len(transactions)} transactions")
                
                if len(transactions) < 5:
                    logger.info(f"Not enough transactions for category {category_id}")
                    category_results[category_id] = {
                        "anomalies": [],
                        "count": 0,
                        "method": "skipped",
                        "message": "Not enough data"
                    }
                    continue
                
                # Try isolation forest with user feedback incorporated
                try:
                    # Convert category alerts to the expected format (category_threshold)
                    formatted_thresholds = {}
                    if category_id in category_alerts:
                        threshold = category_alerts[category_id]
                        formatted_thresholds[f"{category_id}_threshold"] = threshold
                        logger.info(f"Using user-defined alert threshold for {category_id}: ${threshold}")
                    else:
                        logger.info(f"No user-defined alert threshold for category {category_id}")
                        
                    # Run anomaly detection with our improved Isolation Forest implementation 
                    # that respects user preferences
                    anomalies = detect_anomalies_isolation_forest(
                        transactions, 
                        user_id=user_id, 
                        user_accepted_ranges=user_accepted_ranges,
                        user_alert_thresholds=formatted_thresholds
                    )
                    method = "isolation_forest"
                    logger.info(f"Isolation Forest found {len(anomalies)} anomalies for category {category_id}")
                except Exception as e:
                    logger.error(f"Isolation forest failed for category {category_id}: {str(e)}")
                    logger.error(traceback.format_exc())
                    # Fall back to sliding window
                    anomalies = detect_anomalies_sliding_window(transactions)
                    method = "sliding_window"
                    logger.info(f"Sliding window found {len(anomalies)} anomalies")
                
                # We only need to add explicit alerts if we don't have an isolation forest or sliding window alert
                # First, check if we already have anomalies for transactions that exceed thresholds
                found_threshold_anomalies = set()
                if category_id in category_alerts:
                    for anomaly in anomalies:
                        if 'exceeds your' in anomaly.get('reason', ''):
                            found_threshold_anomalies.add(anomaly.get('id', ''))
                
                # Check for spending alerts that weren't caught by anomaly detection
                if category_id in category_alerts:
                    threshold = category_alerts[category_id]
                    for tx in transactions:
                        tx_id = tx.get('id', '')
                        # Skip if we already found this as an anomaly
                        if tx_id in found_threshold_anomalies:
                            continue
                            
                        amount = abs(float(tx.get('amount', 0)))
                        
                        # Only create alert if amount exceeds threshold
                        if amount > threshold:
                            # Create an alert anomaly
                            alert_anomaly = tx.copy()
                            alert_anomaly['anomalyScore'] = 0.7  # Medium-high score
                            alert_anomaly['reason'] = f"This expense exceeds your ${threshold} alert threshold for this category."
                            
                            # Determine severity based on price
                            if amount >= 200:
                                alert_anomaly['severity'] = 'High'
                            elif amount >= 100:
                                alert_anomaly['severity'] = 'Medium'
                            else:
                                alert_anomaly['severity'] = 'Low'
                                
                            alert_anomaly['detection_method'] = "threshold_alert"  # Mark as alert-based anomaly
                            anomalies.append(alert_anomaly)
                            logger.info(f"Added explicit alert for transaction {tx_id}: ${amount:.2f} > ${threshold:.2f}")
                    
                logger.info(f"Found {len(anomalies)} anomalies in category {category_id} using {method}")
                
                all_anomalies.extend(anomalies)
                category_results[category_id] = {
                    "anomalies": anomalies,
                    "count": len(anomalies),
                    "method": method
                }
            except Exception as e:
                logger.error(f"Error processing category {category_id}: {str(e)}")
                logger.error(traceback.format_exc())
                category_results[category_id] = {
                    "error": str(e),
                    "count": 0,
                    "method": "error"
                }
        
        # Sort by severity first, then anomaly score
        severity_order = {'High': 0, 'Medium': 1, 'Low': 2}
        all_anomalies.sort(key=lambda x: (
            severity_order.get(x.get('severity', 'Low'), 3),
            -float(x.get('anomalyScore', 0))
        ))
        
        return AnomalyResponse(
            anomalies=all_anomalies,
            count=len(all_anomalies),
            category_results=category_results
        )
    except Exception as e:
        logger.error(f"Error in detect_user_anomalies: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

# User feedback management
@app.post("/feedback")
async def process_feedback(feedback: AnomalyFeedback, user: Dict = Depends(verify_token)):
    """Process user feedback on anomaly detection"""
    try:
        logger.info(f"Processing user feedback for transaction {feedback.transaction_id}")
        logger.info(f"Feedback: is_normal={feedback.is_normal}, set_alert={feedback.set_alert}")
        
        # Get user ID from token
        user_id = user.get('sub', 'unknown')
        
        # Store user-accepted spending patterns
        if feedback.is_normal:
            # Store this range as accepted for this user and category
            try:
                # Create user feedback directory if it doesn't exist
                user_dir = f"data/user_feedback/{user_id}"
                os.makedirs(user_dir, exist_ok=True)
                
                # Load existing accepted ranges or create new
                accepted_ranges_file = f"{user_dir}/accepted_ranges.json"
                accepted_ranges = {}
                
                if os.path.exists(accepted_ranges_file):
                    with open(accepted_ranges_file, 'r') as f:
                        accepted_ranges = json.load(f)
                
                # Get the current range
                current_range = get_range_for_amount(feedback.anomaly_amount)
                
                # Determine all ranges that should be accepted (all ranges up to and including current range)
                ranges_order = ["low", "medium_low", "medium", "high", "very_high", "extreme"]
                range_index = ranges_order.index(current_range)
                
                # Mark this range and all lower ranges as accepted
                # This means if a user marks a $200 transaction as normal, we'll also accept $180, etc.
                for i in range(range_index + 1):
                    range_key = f"{feedback.category}_{ranges_order[i]}"
                    accepted_ranges[range_key] = True
                    logger.info(f"Marking range {range_key} as normal based on user feedback")
                    
                # Save updated accepted ranges
                with open(accepted_ranges_file, 'w') as f:
                    json.dump(accepted_ranges, f)
                    
                logger.info(f"Updated accepted ranges for user {user_id}: {range_key}")
                updated_model = True
                
                # Check if we need to update alert thresholds
                # If user marks a transaction as normal, and that transaction would exceed their current threshold,
                # we should increase the threshold to avoid future false positives
                try:
                    alerts_dir = f"data/alerts/{user_id}"
                    alerts_file = f"{alerts_dir}/category_alerts.json"
                    
                    if os.path.exists(alerts_file):
                        with open(alerts_file, 'r') as f:
                            alerts = json.load(f)
                        
                        # Find the alert for this category if it exists
                        alert_modified = False
                        for alert in alerts:
                            if alert.get('category') == feedback.category:
                                current_threshold = alert.get('threshold', 0)
                                # If this "normal" transaction exceeds the threshold, raise the threshold
                                if feedback.anomaly_amount > current_threshold:
                                    # Round up to nearest $5 for a better user experience
                                    new_threshold = math.ceil(feedback.anomaly_amount / 5) * 5
                                    alert['threshold'] = new_threshold
                                    logger.info(f"Automatically increased threshold for {feedback.category} from ${current_threshold} to ${new_threshold} based on user feedback")
                                    alert_modified = True
                        
                        # Save if modified
                        if alert_modified:
                            with open(alerts_file, 'w') as f:
                                json.dump(alerts, f)
                except Exception as e:
                    logger.error(f"Error updating alert threshold from feedback: {str(e)}")
            except Exception as e:
                logger.error(f"Error saving user feedback: {str(e)}")
                updated_model = False
        else:
            # User confirmed this is not normal
            updated_model = False
        
        # Set spending alert if requested
        alert_set = False
        if feedback.set_alert and feedback.alert_threshold:
            try:
                # Create alerts directory if it doesn't exist
                alerts_dir = f"data/alerts/{user_id}"
                os.makedirs(alerts_dir, exist_ok=True)
                
                # Load existing alerts or create new
                alerts_file = f"{alerts_dir}/category_alerts.json"
                category_alerts = []
                
                if os.path.exists(alerts_file):
                    with open(alerts_file, 'r') as f:
                        category_alerts = json.load(f)
                
                # Add or update alert for this category
                alert_exists = False
                for alert in category_alerts:
                    if alert.get('category') == feedback.category:
                        alert['threshold'] = feedback.alert_threshold
                        alert['active'] = True
                        alert_exists = True
                        break
                
                if not alert_exists:
                    category_alerts.append({
                        "category": feedback.category,
                        "threshold": feedback.alert_threshold,
                        "active": True
                    })
                
                # Save updated alerts
                with open(alerts_file, 'w') as f:
                    json.dump(category_alerts, f)
                    
                # Log more detailed information about the alert threshold
                logger.info(f"Set spending alert for user {user_id}, category {feedback.category}: ${feedback.alert_threshold}")
                logger.info(f"Transactions below ${feedback.alert_threshold} in {feedback.category} will NOT be flagged as anomalies")
                alert_set = True
            except Exception as e:
                logger.error(f"Error setting spending alert: {str(e)}")
                alert_set = False
        
        return AnomalyFeedbackResponse(
            success=True,
            message="Feedback processed successfully",
            updated_model=updated_model,
            alert_set=alert_set
        )
    except Exception as e:
        logger.error(f"Error processing feedback: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/alerts/{user_id}")
async def get_user_alerts(user_id: str, user: Dict = Depends(verify_token)):
    """Get all spending alerts for a user"""
    try:
        # Verify the requesting user matches the user_id parameter
        token_user_id = user.get('sub', 'unknown')
        if token_user_id != user_id and not user.get('dev_mode', False):
            raise HTTPException(status_code=403, detail="Not authorized to access this user's alerts")
        
        alerts_file = f"data/alerts/{user_id}/category_alerts.json"
        if not os.path.exists(alerts_file):
            return {"alerts": []}
            
        with open(alerts_file, 'r') as f:
            alerts = json.load(f)
            
        return {"alerts": alerts}
    except Exception as e:
        logger.error(f"Error getting user alerts: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

def get_range_for_amount(amount: float) -> str:
    """Get the spending range for a given amount"""
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
    
    return "extreme"  # Default if no range matches

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)