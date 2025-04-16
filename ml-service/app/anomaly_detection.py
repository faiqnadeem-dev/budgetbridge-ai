import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from typing import List, Dict, Any, Optional, Tuple
import logging
import traceback
from datetime import datetime, timedelta
import json
import os

# Configure logger for anomaly detection
logger = logging.getLogger('anomaly-detection')
if not logger.handlers:
    logger.setLevel(logging.INFO)
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)

def preprocess_transactions(transactions: List[Dict[str, Any]]) -> np.ndarray:
    """Extract and prepare features for machine learning."""
    if not transactions:
        return np.array([])
    
    features = []
    
    # Get current date for recency calculation
    now = datetime.now()
    
    for tx in transactions:
        try:
            # Extract amount
            amount = abs(float(tx.get('amount', 0)))
            
            # Extract date if available
            date_str = tx.get('date')
            try:
                date = pd.to_datetime(date_str)
                days_since = (now - date).days
            except:
                days_since = 30  # Default if no date
            
            # Extract category, default to Unknown
            category = tx.get('category', 'unknown')
            
            # Simple feature vector
            features.append([amount, days_since])
        except Exception as e:
            logger.warning(f"Error processing transaction: {str(e)}")
    
    if not features:
        return np.array([])
    
    return np.array(features)

def preprocess_transactions_for_isolation_forest(transactions: List[Dict[str, Any]]) -> np.ndarray:
    """Extract and prepare features for isolation forest."""
    if not transactions:
        return np.array([])
    
    features = []
    
    # Get current date for recency calculation (without timezone info)
    now = datetime.now()
    
    for tx in transactions:
        try:
            # Extract amount (make sure it's a float)
            amount = abs(float(tx.get('amount', 0)))
            
            # Extract date if available
            date_str = tx.get('date')
            if date_str:
                try:
                    # Make sure we create an offset-naive datetime for consistency
                    # Try different formats but ensure the result is offset-naive
                    if 'T' in date_str:
                        # Remove timezone info if present
                        date_str = date_str.split('T')[0]
                        tx_date = datetime.strptime(date_str, '%Y-%m-%d')
                    else:
                        # Simple date format
                        tx_date = datetime.strptime(date_str, '%Y-%m-%d')
                except ValueError:
                    # Final fallback - use pandas to parse the date and convert to naive datetime
                    tx_date = pd.to_datetime(date_str).replace(tzinfo=None).to_pydatetime()
                
                # Calculate days since the transaction
                days_since = (now - tx_date).days
                # Get day of the week (0-6)
                day_of_week = tx_date.weekday()
                # Get day of month (1-31)
                day_of_month = tx_date.day
            else:
                # Default to recent if no date
                days_since = 1
                day_of_week = 0
                day_of_month = 1
            
            # Calculate recency weight (more recent = higher weight)
            # Transactions from the last 30 days have higher weights
            recency_weight = max(0, 1 - (days_since / 60))
            
            # Create feature vector with more features for better detection
            feature_vector = [
                amount,              # Transaction amount
                days_since,          # How recent the transaction is
                recency_weight,      # Weight based on recency
                day_of_week,         # Day of week pattern
                day_of_month         # Day of month pattern
            ]
            features.append(feature_vector)
            
        except Exception as e:
            logger.error(f"Error processing transaction for ML: {str(e)}")
    
    if not features:
        return np.array([])
    
    return np.array(features)

def generate_anomaly_reason(anomaly: Dict[str, Any], all_transactions: List[Dict[str, Any]]) -> str:
    """Generate an explanation for why a transaction is anomalous"""
    try:
        amount = float(anomaly.get('amount', 0))
        category_name = anomaly.get('categoryName', 'this category')
        
        # Determine currency symbol
        currency_symbol = "¥"  # Default to yen
        if anomaly.get('currency') == 'USD':
            currency_symbol = "$"
        elif anomaly.get('currency') == 'EUR':
            currency_symbol = "€"
        elif anomaly.get('currency') == 'GBP':
            currency_symbol = "£"
        
        # Calculate average spending in this category
        category_amounts = [float(tx.get('amount', 0)) for tx in all_transactions 
                           if tx.get('category') == anomaly.get('category')]
        
        if not category_amounts:
            return f"This expense of {currency_symbol}{amount:.2f} is unusual for your spending patterns."
            
        mean = np.mean(category_amounts)
        std_dev = np.std(category_amounts)
        
        # Calculate z-score (how many standard deviations from mean)
        if std_dev > 0:
            z_score = (amount - mean) / std_dev
        else:
            z_score = 0 if amount == mean else 5  # Arbitrary high value if all amounts are the same
        
        # Generate appropriate message based on severity
        if z_score > 5:
            return f"This expense of {currency_symbol}{amount:.2f} is extremely high compared to your typical {category_name} spending of around {currency_symbol}{mean:.2f}."
        elif z_score > 3:
            return f"This expense is significantly higher than your average {category_name} spending from this time period."
        else:
            return f"This {category_name} expense is higher than your typical spending pattern."
            
    except Exception as e:
        logger.error(f"Error generating anomaly reason: {str(e)}")
        return "This transaction appears to be unusual based on your spending patterns."

def detect_anomalies_isolation_forest(transactions: List[Dict[str, Any]], user_id: str = None, 
                                     user_accepted_ranges: Dict[str, bool] = None, 
                                     user_alert_thresholds: Dict[str, float] = None) -> List[Dict[str, Any]]:
    """Detect anomalies using scikit-learn's Isolation Forest algorithm.
    
    Parameters:
    - transactions: List of transaction data
    - user_id: Optional user ID to retrieve user feedback
    - user_accepted_ranges: Optional dictionary of amount ranges the user has accepted as normal
    - user_alert_thresholds: Optional dictionary of alert thresholds by category
    """
    # Initialize empty dictionaries if None were provided
    if user_accepted_ranges is None:
        user_accepted_ranges = {}
    if user_alert_thresholds is None:
        user_alert_thresholds = {}
        
    if len(transactions) < 5:
        logger.warning("Not enough transactions for Isolation Forest")
        return []
    
    # Sort transactions by date (newest first)
    sorted_transactions = sorted(transactions, key=lambda x: x.get('date', ''), reverse=True)
    
    # Determine currency symbol from transactions
    currency_symbol = "¥"  # Default to yen
    for tx in sorted_transactions[:5]:
        if tx.get('currency') == 'USD':
            currency_symbol = "$"
            break
        elif tx.get('currency') == 'EUR':
            currency_symbol = "€"
            break
        elif tx.get('currency') == 'GBP':
            currency_symbol = "£"
            break
    
    # Log sample transactions
    for i in range(min(5, len(sorted_transactions))):
        tx = sorted_transactions[i]
        amount = abs(float(tx.get('amount', 0)))
        logger.info(f"Transaction {i}: {currency_symbol}{amount:.2f} - {tx.get('description', 'Unknown')} (ID: {tx.get('id', 'unknown')})")
    
    # Process transaction data for ML
    features = preprocess_transactions_for_isolation_forest(sorted_transactions)
    
    if len(features) == 0 or features.shape[0] < 5:
        logger.warning(f"Not enough valid features extracted for Isolation Forest: {len(features)}")
        return []
    
    logger.info(f"Extracted {features.shape[1]} features for {features.shape[0]} transactions")
    
    # Extract categories and amounts for statistics
    categories = []
    amounts = []
    for tx in sorted_transactions:
        cat = tx.get('category', tx.get('categoryName', 'Unknown'))
        amount = abs(float(tx.get('amount', 0)))
        categories.append(cat)
        amounts.append(amount)
    
    # Calculate category-specific statistics
    category_stats = {}
    for category in set(categories):
        cat_amounts = []
        for i, tx in enumerate(sorted_transactions):
            if categories[i] == category:
                try:
                    amount = abs(float(tx.get('amount', 0)))
                    cat_amounts.append(amount)
                except:
                    pass
        
        if cat_amounts:
            mean = np.mean(cat_amounts)
            std = np.std(cat_amounts) if len(cat_amounts) > 1 else mean * 0.2
            category_stats[category] = {
                'mean': mean,
                'std': std,
                'min': np.min(cat_amounts),
                'max': np.max(cat_amounts),
                'median': np.median(cat_amounts),
                # For simple outlier detection, calculate threshold as mean + 2*std
                'threshold': mean + 2 * std
            }
    
    try:
        # Configure and train Isolation Forest model
        # Using higher contamination to detect more potential anomalies
        contamination = min(0.2, max(0.05, 3 / len(features)))
        
        model = IsolationForest(
            n_estimators=100,       # Number of trees
            max_samples='auto',     # Subsample size
            contamination=contamination,  # Expected proportion of outliers
            random_state=42,        # For reproducibility
            n_jobs=-1               # Use all CPU cores
        )
        
        logger.info(f"Training Isolation Forest with contamination={contamination:.4f}")
        model.fit(features)
        
        # Get anomaly scores (-1 to 1, lower is more anomalous)
        # Convert to 0-1 range for easier interpretation (higher = more anomalous)
        raw_scores = model.decision_function(features)
        
        # Normalize scores to 0-1 range where 1 is most anomalous
        min_score = np.min(raw_scores)
        max_score = np.max(raw_scores)
        if min_score == max_score:
            normalized_scores = np.zeros_like(raw_scores)
        else:
            normalized_scores = 1 - ((raw_scores - min_score) / (max_score - min_score))
        
        logger.info(f"Score range: {np.min(normalized_scores):.4f} to {np.max(normalized_scores):.4f}")
        
        # Get binary predictions (-1 for anomalies, 1 for normal)
        predictions = model.predict(features)
        anomaly_indices = np.where(predictions == -1)[0]
        logger.info(f"Model identified {len(anomaly_indices)} transactions as anomalies")
        
        # Create a list to store all detected anomalies
        anomalies = []
        
        # First pass: Perform direct statistical detection
        logger.info("Performing direct statistical detection for high values")
        for i, tx in enumerate(sorted_transactions):
            category = categories[i]
            amount = amounts[i]
            tx_id = tx.get('id', '')
            
            # Skip processing if no stats for this category
            if category not in category_stats:
                continue
                
            # Get statistics for this category
            stats = category_stats[category]
            mean_amount = stats['mean']
            std_dev = stats['std']
            threshold = stats['threshold']
            
            # Calculate ratio and z-score
            ratio = amount / mean_amount if mean_amount > 0 else 1.0
            z_score = (amount - mean_amount) / std_dev if std_dev > 0 else 0
            
            # Get the spending range for this amount
            current_range = get_range_for_amount(amount)
            range_key = f"{category}_{current_range}"
            
            # Check if this amount-range combination has been accepted by user
            is_accepted_range = range_key in user_accepted_ranges and user_accepted_ranges[range_key]
            
            # Check if there's a user-defined threshold for this category
            threshold_key = f"{category}_threshold"
            has_user_threshold = threshold_key in user_alert_thresholds
            user_threshold = user_alert_thresholds.get(threshold_key, float('inf')) if has_user_threshold else float('inf')
            
            # Direct detection criteria:
            # 1. Amount exceeds statistical threshold (mean + 2*std) OR ratio >= 2.0, AND
            # 2. NOT in a range marked as normal by user, AND
            # 3. Either no user threshold OR exceeding user threshold
            is_statistical_anomaly = (amount > threshold or ratio >= 1.5)
            exceeds_user_threshold = has_user_threshold and amount > user_threshold
            
            # Apply user preferences
            if (is_statistical_anomaly and not is_accepted_range) or exceeds_user_threshold:
                # If there's a user threshold but we're below it, skip
                if has_user_threshold and not exceeds_user_threshold:
                    continue
                    
                logger.info(f"DIRECT DETECTION: {currency_symbol}{amount:.2f} in category '{category}' (threshold: {currency_symbol}{threshold:.2f}, ratio: {ratio:.2f}x)")
            
                # Create anomaly object
                anomaly = tx.copy()
                anomaly['detection_method'] = "statistical" if not exceeds_user_threshold else "threshold"
                anomaly['anomalyScore'] = min(0.9, 0.6 + (0.1 * (ratio - 1)))
                anomaly['category_avg'] = float(mean_amount)
                anomaly['category_ratio'] = float(ratio)
                anomaly['z_score'] = float(z_score)
                
                # Generate reason based on detection method
                if exceeds_user_threshold:
                    anomaly['reason'] = f"This expense exceeds your {currency_symbol}{user_threshold:.2f} alert threshold for {tx.get('categoryName', 'this category')}."
                elif ratio >= 3:
                    anomaly['reason'] = f"This expense is {ratio:.1f}x higher than your typical {category} spending."
                elif ratio >= 2:
                    anomaly['reason'] = f"This expense is significantly higher than your usual {category} spending."
                else:
                    anomaly['reason'] = f"This expense is higher than your usual {category} spending pattern."
            
                # Set severity
                if ratio >= 3 or z_score >= 3:
                    anomaly['severity'] = 'High'
                elif ratio >= 2 or z_score >= 2:
                    anomaly['severity'] = 'Medium'
                else:
                    anomaly['severity'] = 'Low'
            
                anomalies.append(anomaly)
        
        # Second pass: Add model-detected anomalies, but only if they're higher than normal
        for i, score in enumerate(normalized_scores):
            tx = sorted_transactions[i]
            category = categories[i]
            amount = amounts[i]
            tx_id = tx.get('id', '')
            
            # Skip if already detected by statistical method
            if any(a.get('id') == tx_id for a in anomalies):
                continue
                
            # Determine if it's an anomaly based on model prediction
            is_model_anomaly = predictions[i] == -1
            
            # Skip if not an anomaly according to model
            if not is_model_anomaly:
                continue
                
            # Get category statistics
            if category in category_stats:
                stats = category_stats[category]
                mean_amount = stats['mean']
                median_amount = stats['median']
                std_dev = stats['std']
            else:
                mean_amount = np.mean(amounts) if amounts else 50.0
                median_amount = np.median(amounts) if amounts else 50.0
                std_dev = np.std(amounts) if len(amounts) > 1 else 10.0
            
            # Calculate ratio and z-score
            ratio = amount / mean_amount if mean_amount > 0 else 1.0
            z_score = (amount - mean_amount) / std_dev if std_dev > 0 else 0
            
            # Only flag as anomaly if amount is HIGHER than typical
            is_higher_than_normal = amount > mean_amount
            
            # Get the spending range
            current_range = get_range_for_amount(amount)
            range_key = f"{category}_{current_range}"
            
            # Check if this amount-range has been accepted by user
            is_accepted_range = range_key in user_accepted_ranges and user_accepted_ranges[range_key]
            
            # Check if amount is below user's threshold
            threshold_key = f"{category}_threshold"
            has_user_threshold = threshold_key in user_alert_thresholds
            user_threshold = user_alert_thresholds.get(threshold_key, float('inf')) if has_user_threshold else float('inf')
            below_user_threshold = has_user_threshold and amount <= user_threshold
            
            # Skip if:
            # 1. User has marked this range as normal, OR
            # 2. User has a threshold and we're below it
            if is_accepted_range or (has_user_threshold and below_user_threshold):
                continue
            
            # Only include if higher than normal
            if is_model_anomaly and is_higher_than_normal:
                # Create anomaly object
                anomaly = tx.copy()
                
                # Set anomaly score - use model score
                anomaly['anomalyScore'] = float(score)
                
                # Add detection metadata
                anomaly['detection_method'] = "isolation_forest"
                anomaly['model_score'] = float(score)
                
                # Add statistical context
                anomaly['category_avg'] = float(mean_amount)
                anomaly['category_ratio'] = float(ratio)
                anomaly['z_score'] = float(z_score)
                
                # Generate appropriate reason
                if has_user_threshold and amount > user_threshold:
                    anomaly['reason'] = f"This expense exceeds your {currency_symbol}{user_threshold:.2f} alert threshold for {tx.get('categoryName', 'this category')}."
                else:
                    # Use the generate_anomaly_reason function
                    anomaly['reason'] = generate_anomaly_reason(tx, sorted_transactions)
                
                # Set severity based on score and amount
                if score > 0.8 or z_score > 3 or ratio > 3:
                    anomaly['severity'] = 'High'
                elif score > 0.6 or z_score > 2 or ratio > 2:
                    anomaly['severity'] = 'Medium'
                else:
                    anomaly['severity'] = 'Low'
                
                anomalies.append(anomaly)
    
                logger.info(f"MODEL DETECTION: {currency_symbol}{amount:.2f} in category '{category}', score: {score:.4f}, " + 
                           f"ratio: {ratio:.2f}x, z-score: {z_score:.2f}")
        
        # Sort anomalies by severity and score
        severity_order = {'High': 0, 'Medium': 1, 'Low': 2}
        sorted_anomalies = sorted(anomalies, 
                                 key=lambda x: (severity_order.get(x.get('severity'), 3), 
                                               -float(x.get('anomalyScore', 0))))
        
        logger.info(f"Isolation Forest found {len(sorted_anomalies)} anomalies")
        return sorted_anomalies
        
    except Exception as e:
        logger.error(f"Error in Isolation Forest detection: {str(e)}")
        logger.error(traceback.format_exc())
        return []

def get_range_for_amount(amount: float) -> str:
    """Get the spending range for a given amount"""
    # Default ranges (for USD)
    usd_ranges = {
        "low": (0, 50),
        "medium_low": (50, 100),
        "medium": (100, 150),
        "high": (150, 200),
        "very_high": (200, 300),
        "extreme": (300, float('inf'))
    }
    
    # JPY ranges (roughly 100x USD values)
    jpy_ranges = {
        "low": (0, 5000),
        "medium_low": (5000, 10000),
        "medium": (10000, 15000),
        "high": (15000, 20000),
        "very_high": (20000, 30000),
        "extreme": (30000, float('inf'))
    }
    
    # EUR ranges (similar to USD)
    eur_ranges = {
        "low": (0, 45),
        "medium_low": (45, 90),
        "medium": (90, 140),
        "high": (140, 180),
        "very_high": (180, 270),
        "extreme": (270, float('inf'))
    }
    
    # Determine which range set to use based on amount
    # Simple heuristic: if amount > 1000, assume JPY
    if amount > 1000:
        ranges = jpy_ranges
    else:
        ranges = usd_ranges  # Default to USD ranges
    
    for range_name, (min_val, max_val) in ranges.items():
        if min_val <= amount < max_val:
            return range_name
    
    return "extreme"  # Default if no range matches

def detect_anomalies_sliding_window(transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Fallback method using sliding window approach"""
    logger.info(f"Starting sliding window detection on {len(transactions)} transactions")
    
    if len(transactions) < 5:
        logger.info("Not enough transactions for sliding window (minimum 5 required)")
        return []
    
    # Determine currency symbol
    currency_symbol = "¥"  # Default to yen
    for tx in transactions[:5]:
        if tx.get('currency') == 'USD':
            currency_symbol = "$"
            break
        elif tx.get('currency') == 'EUR':
            currency_symbol = "€"
            break
        elif tx.get('currency') == 'GBP':
            currency_symbol = "£"
            break
        
    try:
        # Convert dates to datetime objects for sorting
        tx_with_dates = []
        for tx in transactions:
            try:
                date_str = tx.get('date')
                date = pd.to_datetime(date_str)
                if not pd.isna(date):
                    tx_with_dates.append((date, tx))
            except Exception as e:
                logger.warning(f"Error parsing date {date_str}: {str(e)}")
        
        # Sort by date
        tx_with_dates.sort(key=lambda x: x[0])
        sorted_tx = [tx for _, tx in tx_with_dates]
        
        logger.info(f"Analyzing {len(sorted_tx)} transactions with valid dates")
        
        anomalies = []
        window_size = 10  # Look at past 10 transactions
        min_window = 5    # Need at least 5 for good stats
        
        for i in range(min_window, len(sorted_tx)):
            current_tx = sorted_tx[i]
            
            # Get window of previous transactions
            available_context = min(window_size, i)
            window = sorted_tx[i-available_context:i]
            
            # Extract amounts, handling potential errors
            amounts = []
            for tx in window:
                try:
                    amount = float(tx.get('amount', 0))
                    if not np.isnan(amount):
                        amounts.append(amount)
                except (ValueError, TypeError):
                    logger.warning(f"Invalid amount in window: {tx.get('amount')}")
            
            if not amounts:
                continue  # Skip if no valid amounts in window
                
            # Calculate statistics
            mean = np.mean(amounts)
            std_dev = np.std(amounts)
            
            # Skip if standard deviation is zero (all amounts identical)
            if std_dev == 0:
                continue
                
            # Check if current transaction is anomalous
            try:
                current_amount = float(current_tx.get('amount', 0))
                if np.isnan(current_amount):
                    continue
                    
                threshold = mean + 2.5 * std_dev
                
                if current_amount > threshold:
                    # Calculate z-score
                    score = (current_amount - mean) / std_dev
                    
                    # Create explanation
                    category_name = current_tx.get("categoryName", "")
                    
                    if score > 5:
                        reason = f"This expense of {currency_symbol}{current_amount:.2f} is extremely high compared to your typical {category_name} spending of around {currency_symbol}{mean:.2f}."
                    elif score > 3:
                        reason = f"This expense is significantly higher than your average {category_name} spending from this time period."
                    else:
                        reason = f"This {category_name} expense is higher than your typical spending pattern at the time."
                    
                    # Create a copy of the transaction with anomaly data
                    anomaly_tx = current_tx.copy()
                    anomaly_tx['anomalyScore'] = score
                    anomaly_tx['reason'] = reason
                    anomaly_tx['detectionMethod'] = 'sliding_window'
                    
                    anomalies.append(anomaly_tx)
            except Exception as e:
                logger.warning(f"Error processing transaction: {str(e)}")
        
        logger.info(f"Sliding window found {len(anomalies)} anomalies")
        return sorted(anomalies, key=lambda x: x.get('anomalyScore', 0), reverse=True)
        
    except Exception as e:
        logger.error(f"Error in sliding window detection: {str(e)}")
        logger.error(traceback.format_exc())
        raise