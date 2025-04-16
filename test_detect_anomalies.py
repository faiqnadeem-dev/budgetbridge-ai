import pytest
import numpy as np
import pandas as pd
import json
from unittest.mock import patch
from datetime import datetime, timedelta

# Import the function being tested - adjust the import path as needed
from anomaly_detection import detect_category_anomalies

def test_isolation_forest_anomaly_detection():
    """Test that isolation forest correctly identifies anomalous transactions."""
    
    # Create mock transaction data with a clear anomaly
    mock_transactions = [
        {"id": "tx1", "amount": 52.50, "category": "grocery", "date": "2023-10-01", "userId": "user123"},
        {"id": "tx2", "amount": 48.75, "category": "grocery", "date": "2023-10-08", "userId": "user123"},
        {"id": "tx3", "amount": 51.20, "category": "grocery", "date": "2023-10-15", "userId": "user123"},
        {"id": "tx4", "amount": 55.30, "category": "grocery", "date": "2023-10-22", "userId": "user123"},
        {"id": "tx5", "amount": 250.00, "category": "grocery", "date": "2023-10-29", "userId": "user123"}, # Anomalous transaction
    ]
    
    # Call the anomaly detection function
    result = detect_category_anomalies("grocery", mock_transactions)
    
    # Verify the result structure
    assert isinstance(result, dict)
    assert "anomalies" in result
    assert "count" in result
    assert "categoryId" in result
    assert "method" in result
    
    # Verify the method
    assert result["method"] == "isolation_forest"
    assert result["categoryId"] == "grocery"
    
    # Check that exactly one anomaly was found
    assert result["count"] == 1
    assert len(result["anomalies"]) == 1
    
    # Verify the detected anomaly
    anomaly = result["anomalies"][0]
    assert anomaly["id"] == "tx5"
    assert anomaly["amount"] == 250.00
    assert "anomalyScore" in anomaly
    assert anomaly["anomalyScore"] > 0.7  # Threshold should be exceeded
    assert "reason" in anomaly
    assert "severity" in anomaly
    
    # Check statistical information
    assert "category_avg" in anomaly
    assert 90 < anomaly["category_avg"] < 100  # Should be around 91.55
    assert "category_ratio" in anomaly
    assert anomaly["category_ratio"] > 2.5  # 250 is > 2.5x the average

def test_normal_transactions():
    """Test that normal transactions are not flagged as anomalous."""
    
    # Create mock transaction data with no anomalies
    mock_transactions = [
        {"id": "tx1", "amount": 52.50, "category": "grocery", "date": "2023-10-01", "userId": "user123"},
        {"id": "tx2", "amount": 48.75, "category": "grocery", "date": "2023-10-08", "userId": "user123"},
        {"id": "tx3", "amount": 51.20, "category": "grocery", "date": "2023-10-15", "userId": "user123"},
        {"id": "tx4", "amount": 55.30, "category": "grocery", "date": "2023-10-22", "userId": "user123"},
        {"id": "tx5", "amount": 57.80, "category": "grocery", "date": "2023-10-29", "userId": "user123"},
    ]
    
    # Call the anomaly detection function
    result = detect_category_anomalies("grocery", mock_transactions)
    
    # Verify no anomalies were found
    assert result["count"] == 0
    assert len(result["anomalies"]) == 0

def test_insufficient_data():
    """Test behavior when there are too few transactions to detect anomalies."""
    
    # Create mock transaction data with insufficient history
    mock_transactions = [
        {"id": "tx1", "amount": 52.50, "category": "grocery", "date": "2023-10-01", "userId": "user123"},
        {"id": "tx2", "amount": 250.00, "category": "grocery", "date": "2023-10-08", "userId": "user123"},
    ]
    
    # Call the anomaly detection function
    result = detect_category_anomalies("grocery", mock_transactions)
    
    # Check the result - might fall back to statistical if isolation forest needs more data
    assert "method" in result
    # If statistical fallback is implemented:
    if result["method"] == "statistical" and result["count"] > 0:
        assert result["anomalies"][0]["id"] == "tx2"
        assert "detection_method" in result["anomalies"][0]
        assert result["anomalies"][0]["detection_method"] == "statistical"
    # If minimum data threshold enforced:
    elif result["method"] == "isolation_forest":
        # May not detect anomalies with too few samples
        assert "warning" in result
        assert "insufficient_data" in result["warning"]

def test_multiple_anomalies():
    """Test detection of multiple anomalies in a dataset."""
    
    # Create mock transaction data with multiple anomalies
    mock_transactions = [
        {"id": "tx1", "amount": 52.50, "category": "grocery", "date": "2023-10-01", "userId": "user123"},
        {"id": "tx2", "amount": 48.75, "category": "grocery", "date": "2023-10-08", "userId": "user123"},
        {"id": "tx3", "amount": 51.20, "category": "grocery", "date": "2023-10-15", "userId": "user123"},
        {"id": "tx4", "amount": 55.30, "category": "grocery", "date": "2023-10-22", "userId": "user123"},
        {"id": "tx5", "amount": 250.00, "category": "grocery", "date": "2023-10-29", "userId": "user123"}, # Anomalous transaction
        {"id": "tx6", "amount": 5.20, "category": "grocery", "date": "2023-11-05", "userId": "user123"}, # Abnormally low
        {"id": "tx7", "amount": 300.00, "category": "grocery", "date": "2023-11-12", "userId": "user123"}, # Anomalous transaction
    ]
    
    # Call the anomaly detection function
    result = detect_category_anomalies("grocery", mock_transactions)
    
    # Verify multiple anomalies were found
    assert result["count"] >= 2
    assert len(result["anomalies"]) >= 2
    
    # Check that high and low anomalies are both detected
    anomaly_ids = [a["id"] for a in result["anomalies"]]
    assert "tx5" in anomaly_ids
    assert "tx7" in anomaly_ids
    
    # Optional: Check if the extremely low value was detected
    if len(result["anomalies"]) > 2:
        assert "tx6" in anomaly_ids

@patch('anomaly_detection.isolation_forest_detect')
def test_model_integration(mock_isolation_forest):
    """Test integration with the isolation forest model using mocks."""
    
    # Mock the isolation forest function to return predictable scores
    mock_isolation_forest.return_value = {
        "tx1": 0.3,
        "tx2": 0.2,
        "tx3": 0.4,
        "tx4": 0.3,
        "tx5": 0.8  # Anomalous
    }
    
    # Create mock transaction data
    mock_transactions = [
        {"id": "tx1", "amount": 52.50, "category": "grocery", "date": "2023-10-01", "userId": "user123"},
        {"id": "tx2", "amount": 48.75, "category": "grocery", "date": "2023-10-08", "userId": "user123"},
        {"id": "tx3", "amount": 51.20, "category": "grocery", "date": "2023-10-15", "userId": "user123"},
        {"id": "tx4", "amount": 55.30, "category": "grocery", "date": "2023-10-22", "userId": "user123"},
        {"id": "tx5", "amount": 250.00, "category": "grocery", "date": "2023-10-29", "userId": "user123"},
    ]
    
    # Call the anomaly detection function
    result = detect_category_anomalies("grocery", mock_transactions)
    
    # Verify the mock was called correctly
    mock_isolation_forest.assert_called_once()
    
    # Verify results
    assert result["count"] == 1
    assert result["anomalies"][0]["id"] == "tx5"
    assert result["anomalies"][0]["anomalyScore"] == 0.8 