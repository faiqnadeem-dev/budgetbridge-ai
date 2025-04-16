import React, { useState, useEffect, useCallback } from 'react';
import { 
    MenuItem, 
    Box, 
    Paper, 
    Typography,
    Alert,
    AlertTitle,
    Snackbar
} from '@mui/material';
import { Link } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import WarningIcon from '@mui/icons-material/Warning';
import { expenseService } from '../../services/expenseService';
import { useFirebaseUser } from '../../context/ClerkFirebaseBridge';
import { db } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import CategoryManager from './CategoryManager';
import { 
    AccessibleTextField, 
    AccessibleButton, 
    AccessibleIconButton 
} from '../../utils/accessibilityHelpers';

const ExpenseForm = () => {
    const { currentUser } = useFirebaseUser();
    const [categories, setCategories] = useState([]);
    const [openCategoryManager, setOpenCategoryManager] = useState(false);
    const [error, setError] = useState('');
    const [expense, setExpense] = useState({
        amount: '',
        categoryId: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });
    
    // Anomaly detection states
    const [showAnomalyAlert, setShowAnomalyAlert] = useState(false);
    const [anomalyReason, setAnomalyReason] = useState('');
    const [anomalySnackbar, setAnomalySnackbar] = useState(false);

    const fetchCategories = useCallback(async () => {
        if (!currentUser) return;
        
        try {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists() && userDoc.data().categories) {
                setCategories(userDoc.data().categories);
            }
        } catch (error) {
            setError('Failed to fetch categories');
            console.error('Error fetching categories:', error);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const selectedCategory = categories.find(cat => cat.id === expense.categoryId);
            const expenseData = {
                ...expense,
                categoryName: selectedCategory?.name,
                userId: currentUser.uid
            };
            
            const response = await expenseService.addExpense(expenseData);
            
            // Check if the expense was flagged as an anomaly
            if (response.isAnomaly) {
                // Show alert and snackbar to the user
                setShowAnomalyAlert(true);
                setAnomalyReason(response.anomalyReason);
                setAnomalySnackbar(true);
            }
            
            setExpense({
                amount: '',
                categoryId: '',
                description: '',
                date: new Date().toISOString().split('T')[0]
            });
        } catch (error) {
            setError('Failed to add expense');
            console.error('Error adding expense:', error);
        }
    };

    const handleCategoryManagerClose = () => {
        setOpenCategoryManager(false);
        fetchCategories(); 
    };

    const handleCloseAnomalySnackbar = () => {
        setAnomalySnackbar(false);
    };

    return (
        <Paper elevation={3} sx={{ p: 3, maxWidth: 500, mx: 'auto', mt: 4 }}>
            <Typography variant="h6" sx={{ mb: 3, color: '#1a237e' }}>
                Add New Expense
            </Typography>
            
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            )}
            
            {/* Anomaly Alert */}
            {showAnomalyAlert && (
                <Alert 
                    severity="warning" 
                    onClose={() => setShowAnomalyAlert(false)}
                    sx={{ mb: 3, borderLeft: '4px solid #ff9800' }}
                    icon={<WarningIcon fontSize="inherit" />}
                >
                    <AlertTitle>Unusual Transaction Detected</AlertTitle>
                    {anomalyReason}
                    <AccessibleButton 
                        color="warning" 
                        size="small" 
                        component={Link} 
                        to="/anomalies"
                        sx={{ mt: 1 }}
                        id="view-anomaly-details"
                        label="View anomaly details"
                    >
                        View Details
                    </AccessibleButton>
                </Alert>
            )}
            
            <form onSubmit={handleSubmit} id="expense-form" name="expense-form">
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <AccessibleTextField
                        id="expense-amount"
                        label="Amount"
                        type="number"
                        value={expense.amount}
                        onChange={(e) => setExpense({ ...expense, amount: e.target.value })}
                        required
                        fullWidth
                    />
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessibleTextField
                            id="expense-category"
                            select
                            label="Category"
                            value={expense.categoryId}
                            onChange={(e) => setExpense({ ...expense, categoryId: e.target.value })}
                            required
                            sx={{ flexGrow: 1 }}
                        >
                            {categories.map((category) => (
                                <MenuItem key={category.id} value={category.id}>
                                    {category.name}
                                    {category.budget > 0 && ` (Budget: $${category.budget})`}
                                </MenuItem>
                            ))}
                        </AccessibleTextField>
                        
                        <AccessibleIconButton
                            aria-label="manage categories"
                            onClick={() => setOpenCategoryManager(true)}
                            sx={{ 
                                bgcolor: '#1a237e',
                                color: 'white',
                                width: 40,
                                height: 40,
                                '&:hover': {
                                    bgcolor: '#283593'
                                }
                            }}
                            id="manage-categories-button"
                            label="Manage Categories"
                        >
                            <SettingsIcon />
                        </AccessibleIconButton>
                    </Box>
                    
                    <AccessibleTextField
                        id="expense-description"
                        label="Description"
                        value={expense.description}
                        onChange={(e) => setExpense({ ...expense, description: e.target.value })}
                        multiline
                        rows={2}
                        fullWidth
                    />
                    
                    <AccessibleTextField
                        id="expense-date"
                        label="Date"
                        type="date"
                        value={expense.date}
                        onChange={(e) => setExpense({ ...expense, date: e.target.value })}
                        required
                        fullWidth
                        InputLabelProps={{
                            shrink: true
                        }}
                    />
                    
                    <AccessibleButton 
                        type="submit" 
                        variant="contained"
                        startIcon={<AddIcon />}
                        sx={{ 
                            bgcolor: '#1a237e',
                            '&:hover': { bgcolor: '#283593' }
                        }}
                        id="add-expense-button"
                        label="Add Expense"
                    >
                        Add Expense
                    </AccessibleButton>
                </Box>
            </form>

            <CategoryManager 
                open={openCategoryManager}
                onClose={handleCategoryManagerClose}
                userId={currentUser?.uid}
            />
            
            {/* Toast notification for anomaly */}
            <Snackbar
                open={anomalySnackbar}
                autoHideDuration={6000}
                onClose={handleCloseAnomalySnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    onClose={handleCloseAnomalySnackbar} 
                    severity="warning" 
                    sx={{ width: '100%' }}
                >
                    Unusual spending pattern detected!
                </Alert>
            </Snackbar>
        </Paper>
    );
};

export default ExpenseForm;