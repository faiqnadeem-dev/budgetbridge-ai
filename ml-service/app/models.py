from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Union, Literal

class Transaction(BaseModel):
    """Model for a single transaction"""
    id: Optional[str] = None
    amount: float
    date: str
    category: Optional[str] = None
    categoryName: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    
    class Config:
        extra = "allow"  # Allow additional fields

class CategoryAnomalyRequest(BaseModel):
    """Request model for category anomaly detection"""
    transactions: List[Dict[str, Any]]

class TransactionList(BaseModel):
    """Request model for user anomaly detection"""
    transactions_by_category: Dict[str, List[Dict[str, Any]]]

class AnomalyResponse(BaseModel):
    """Response model for anomaly detection"""
    anomalies: List[Dict[str, Any]]
    count: int
    category_results: Optional[Dict[str, Any]] = None

class AnomalyFeedback(BaseModel):
    """Model for user feedback on anomaly detection"""
    transaction_id: str
    user_id: str
    is_normal: bool  # True if user confirms this is part of normal spending pattern
    anomaly_amount: float
    category: str
    set_alert: Optional[bool] = False
    alert_threshold: Optional[float] = None

class CategoryAlert(BaseModel):
    """Model for category-based spending alerts"""
    category: str
    threshold: float
    user_id: str
    active: bool = True

class AnomalyFeedbackResponse(BaseModel):
    """Response model for anomaly feedback processing"""
    success: bool
    message: str
    updated_model: bool = False
    alert_set: bool = False