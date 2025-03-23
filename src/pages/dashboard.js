import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, auth } from '../config/firebase';
import { doc, getDoc, setDoc, collection, addDoc, query, orderBy, limit, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import dashboardStyles from '../styles/DashboardStyles';
import WelcomeModal from '../components/modals/WelcomeModal';
import SpendingInsights from '../components/SpendingInsights';
import AnomalyDashboard from '../components/anomaly/AnomalyDashboard';
import { useNavigate } from 'react-router-dom';
import {
    Box, Drawer, Typography, List, ListItem, ListItemIcon, ListItemText,
    IconButton, Modal, TextField, Button, Menu, MenuItem, Grid, Paper,
} from '@mui/material';
import {
    AccountBalanceWallet, ExitToApp, Settings, AddCircleOutline,
    TrendingUp, TrendingDown, Edit, Delete, InsightsOutlined, WarningAmber
} from '@mui/icons-material';

const Dashboard = ({ activeView: initialActiveView }) => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    
    const [userName, setUserName] = useState('');
    const [isFirstTime, setIsFirstTime] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const [showWelcomeModal, setShowWelcomeModal] = useState(true);
    const [openNameModal, setOpenNameModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [activeView, setActiveView] = useState(initialActiveView || 'overview');

    const [transactions, setTransactions] = useState([]);
    const [openAddExpense, setOpenAddExpense] = useState(false);
    const [openAddRevenue, setOpenAddRevenue] = useState(false);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [monthlyBudget, setMonthlyBudget] = useState(0);
    const [totalSpent, setTotalSpent] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);

    const [categories, setCategories] = useState([]);
    const [revenueCategories, setRevenueCategories] = useState([
        { id: 'salary', name: 'Salary' },
        { id: 'freelance', name: 'Freelance' },
        { id: 'investments', name: 'Investments' },
        { id: 'other-income', name: 'Other Income' }
    ]);
    const [newCategory, setNewCategory] = useState('');
    const [newRevenueCategory, setNewRevenueCategory] = useState('');
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [showAddRevenueCategory, setShowAddRevenueCategory] = useState(false);
    
    const [openBudgetModal, setOpenBudgetModal] = useState(false);
    const [openEditModal, setOpenEditModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [newBudget, setNewBudget] = useState('');

    const [openAddCategoryModal, setOpenAddCategoryModal] = useState(false);
    const [openAddRevenueCategoryModal, setOpenAddRevenueCategoryModal] = useState(false);
    useEffect(() => {
        const fetchUserData = async () => {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            
            const defaultExpenseCategories = [
                { id: 'food', name: 'Food' },
                { id: 'transport', name: 'Transport' },
                { id: 'utilities', name: 'Utilities' },
                { id: 'entertainment', name: 'Entertainment' },
                { id: 'other', name: 'Other' }
            ];
        
            const defaultRevenueCategories = [
                { id: 'salary', name: 'Salary' },
                { id: 'freelance', name: 'Freelance' },
                { id: 'investments', name: 'Investments' },
                { id: 'other-income', name: 'Other Income' }
            ];
            
            if (userDoc.exists()) {
                setUserName(userDoc.data().name);
                setNewName(userDoc.data().name);
                setMonthlyBudget(userDoc.data().monthlyBudget || 0);
                setCategories(userDoc.data().categories || defaultExpenseCategories);
                setRevenueCategories(userDoc.data().revenueCategories || defaultRevenueCategories);
                setShowWelcomeModal(false);
            } else {
                await setDoc(doc(db, 'users', currentUser.uid), {
                    categories: defaultExpenseCategories,
                    revenueCategories: defaultRevenueCategories
                });
                setCategories(defaultExpenseCategories);
                setRevenueCategories(defaultRevenueCategories);
                setShowWelcomeModal(true);
            }
            setIsLoading(false);
        };
        
        fetchUserData();
    }, [currentUser]);

    useEffect(() => {
        const fetchTransactions = async () => {
            if (currentUser) {
                const transactionsRef = collection(db, 'users', currentUser.uid, 'transactions');
                const q = query(transactionsRef, orderBy('date', 'desc'), limit(10));
                const querySnapshot = await getDocs(q);
                const transactionsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setTransactions(transactionsData);
            }
        };
        fetchTransactions();
    }, [currentUser]);

    useEffect(() => {
        const calculateTotals = () => {
            const expenses = transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
            
            const revenues = transactions
                .filter(t => t.type === 'revenue')
                .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
            
            setTotalSpent(expenses);
            setTotalRevenue(revenues);
        };
        calculateTotals();
    }, [transactions]);

    const handleNameChange = async () => {
        if (!newName.trim()) return;
        try {
            await setDoc(doc(db, 'users', currentUser.uid), {
                name: newName.trim()
            }, { merge: true });
            setUserName(newName.trim());
            setOpenNameModal(false);
        } catch (error) {
            console.error('Error updating name:', error);
        }
    };

    const handleAddRevenue = async () => {
        if (!description || !amount || !category) return;
        
        const selectedCategory = revenueCategories.find(cat => cat.id === category);
        const transactionRef = collection(db, 'users', currentUser.uid, 'transactions');
        const newTransaction = {
            description,
            amount: Number(amount),
            category,
            categoryName: selectedCategory?.name || category,
            date: new Date().toISOString(),
            type: 'revenue'
        };
        
        const docRef = await addDoc(transactionRef, newTransaction);
        setTransactions([{ id: docRef.id, ...newTransaction }, ...transactions]);
        
        setDescription('');
        setAmount('');
        setCategory('');
        setOpenAddRevenue(false);
    };

    const handleAddExpense = async () => {
        if (!description || !amount || !category) return;
        
        const selectedCategory = categories.find(cat => cat.id === category);
        const transactionRef = collection(db, 'users', currentUser.uid, 'transactions');
        const newTransaction = {
            description,
            amount: Number(amount),
            category,
            categoryName: selectedCategory?.name || category,
            date: new Date().toISOString(),
            type: 'expense'
        };
        
        const docRef = await addDoc(transactionRef, newTransaction);
        setTransactions([{ id: docRef.id, ...newTransaction }, ...transactions]);
        
        setDescription('');
        setAmount('');
        setCategory('');
        setOpenAddExpense(false);
    };

    const handleBudgetUpdate = async () => {
        if (!newBudget) return;
        
        try {
            await setDoc(doc(db, 'users', currentUser.uid), {
                monthlyBudget: Number(newBudget)
            }, { merge: true });
            
            setMonthlyBudget(Number(newBudget));
            setNewBudget('');
            setOpenBudgetModal(false);
        } catch (error) {
            console.error('Error updating budget:', error);
        }
    };

    const handleDeleteTransaction = async (transactionId) => {
        const transactionRef = doc(db, 'users', currentUser.uid, 'transactions', transactionId);
        await deleteDoc(transactionRef);
        setTransactions(transactions.filter(t => t.id !== transactionId));
    };

    const handleEditTransaction = async () => {
        if (!editingTransaction || !description || !amount || !category) return;
        
        const selectedCategory = editingTransaction.type === 'revenue' 
            ? revenueCategories.find(cat => cat.id === category)
            : categories.find(cat => cat.id === category);

        const transactionRef = doc(db, 'users', currentUser.uid, 'transactions', editingTransaction.id);
        await updateDoc(transactionRef, {
            description,
            amount: Number(amount),
            category,
            categoryName: selectedCategory?.name || category
        });

        setTransactions(transactions.map(t => 
            t.id === editingTransaction.id 
                ? { ...t, description, amount: Number(amount), category, categoryName: selectedCategory?.name || category }
                : t
        ));

        setOpenEditModal(false);
        setEditingTransaction(null);
        setDescription('');
        setAmount('');
        setCategory('');
    };

    const handleAddCategory = async (isRevenue = false) => {
        const categoryToAdd = isRevenue ? newRevenueCategory : newCategory;
        if (!categoryToAdd.trim()) return;
        
        try {
            const newCategoryObj = {
                id: categoryToAdd.toLowerCase().replace(/\s+/g, '-'),
                name: categoryToAdd.trim()
            };
            
            const updatedCategories = isRevenue 
                ? [...revenueCategories, newCategoryObj]
                : [...categories, newCategoryObj];

            await setDoc(doc(db, 'users', currentUser.uid), {
                [isRevenue ? 'revenueCategories' : 'categories']: updatedCategories
            }, { merge: true });
            
            if (isRevenue) {
                setRevenueCategories(updatedCategories);
                setNewRevenueCategory('');
                setShowAddRevenueCategory(false);
            } else {
                setCategories(updatedCategories);
                setNewCategory('');
                setShowAddCategory(false);
            }
        } catch (error) {
            console.error('Error adding category:', error);
        }
    };

    const handleViewChange = (view) => {
        setActiveView(view);
        if (view === 'overview') {
            navigate('/dashboard');
        } else if (view === 'anomalies') {
            navigate('/anomalies');
        }
    };

    const Sidebar = () => (
        <Drawer
            variant="permanent"
            sx={dashboardStyles.sidebar}
        >
            <Box sx={{ p: 3, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Finance App
                </Typography>
            </Box>
            
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
                <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                    {userName}'s Budget
                </Typography>
                <IconButton 
                    size="small" 
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    sx={{ color: 'white' }}
                >
                    <Settings fontSize="small" />
                </IconButton>
            </Box>

            <List sx={{ py: 2 }}>
                <ListItem 
                    button
                    selected={activeView === 'overview'}
                    onClick={() => handleViewChange('overview')}
                >
                    <ListItemIcon>
                        <AccountBalanceWallet sx={{ color: 'white' }} />
                    </ListItemIcon>
                    <ListItemText primary="Finance Overview" />
                </ListItem>

                <ListItem 
                    button
                    selected={activeView === 'insights'}
                    onClick={() => setActiveView('insights')}
                >
                    <ListItemIcon>
                        <InsightsOutlined sx={{ color: 'white' }} />
                    </ListItemIcon>
                    <ListItemText primary="Spending Insights" />
                </ListItem>

                <ListItem 
                    button
                    selected={activeView === 'anomalies'}
                    onClick={() => handleViewChange('anomalies')}
                >
                    <ListItemIcon>
                        <WarningAmber sx={{ color: 'white' }} />
                    </ListItemIcon>
                    <ListItemText primary="Anomaly Detection" />
                </ListItem>
            </List>

            <Box sx={{ mt: 'auto', p: 2, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                <ListItem onClick={() => signOut(auth)} sx={{ cursor: 'pointer' }}>
                    <ListItemIcon>
                        <ExitToApp sx={{ color: 'white' }} />
                    </ListItemIcon>
                    <ListItemText primary="Logout" />
                </ListItem>
            </Box>
        </Drawer>
    );

    if (isLoading) return null;

    return (
        <Box sx={dashboardStyles.mainContainer}>
            {!isFirstTime && <Sidebar />}
            <Box 
                sx={{
                    ...dashboardStyles.contentArea,
                    filter: showWelcomeModal ? 'blur(5px)' : 'none',
                    transition: 'filter 0.3s ease-in-out',
                    pointerEvents: showWelcomeModal ? 'none' : 'auto'
                }}
            >
                {!isFirstTime && (
                    <>
                        {activeView === 'overview' ? (
                            <>
                                {/* Monthly Overview */}
                                <Box sx={dashboardStyles.animatedElement}>
                                    <Typography variant="h4" gutterBottom>
                                        {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                                        <Button
                                            variant="outlined"
                                            onClick={() => setOpenBudgetModal(true)}
                                            sx={{ borderColor: '#1a237e', color: '#1a237e' }}
                                        >
                                            Set Budget
                                        </Button>
                                        <Button
                                            variant="contained"
                                            startIcon={<TrendingUp />}
                                            onClick={() => setOpenAddRevenue(true)}
                                            sx={{ ...dashboardStyles.actionButton, ...dashboardStyles.addRevenueButton }}
                                        >
                                            Add Revenue
                                        </Button>
                                        <Button
                                            variant="contained"
                                            startIcon={<TrendingDown />}
                                            onClick={() => setOpenAddExpense(true)}
                                            sx={{ 
                                                ...dashboardStyles.actionButton, 
                                                backgroundColor: '#f44336',
                                                '&:hover': {
                                                    backgroundColor: '#d32f2f'
                                                }
                                            }}
                                        >
                                            Add Expense
                                        </Button>
                                    </Box>
                                </Box>

                                {/* Overview Cards */}
                                <Grid container spacing={3} sx={{ ...dashboardStyles.animatedElement, mb: 8 }}>
                                    <Grid item xs={12} md={3}>
                                        <Paper sx={{ ...dashboardStyles.overviewCard, ...dashboardStyles.revenueCard }}>
                                            <Typography sx={dashboardStyles.cardTitle}>Total Revenue</Typography>
                                            <Typography sx={dashboardStyles.cardAmount}>+${totalRevenue}</Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <Paper sx={{ ...dashboardStyles.overviewCard, ...dashboardStyles.expenseCard }}>
                                            <Typography sx={dashboardStyles.cardTitle}>Total Expenses</Typography>
                                            <Typography sx={dashboardStyles.cardAmount}>-${totalSpent}</Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <Paper sx={{ ...dashboardStyles.overviewCard, ...dashboardStyles.balanceCard }}>
                                            <Typography sx={dashboardStyles.cardTitle}>Net Balance</Typography>
                                            <Typography sx={dashboardStyles.cardAmount}>${monthlyBudget + totalRevenue - totalSpent}</Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <Paper sx={{ ...dashboardStyles.overviewCard, ...dashboardStyles.budgetCard }}>
                                            <Typography sx={dashboardStyles.cardTitle}>Monthly Budget</Typography>
                                            <Typography sx={dashboardStyles.cardAmount}>${monthlyBudget}</Typography>
                                        </Paper>
                                    </Grid>
                                </Grid>

                                {/* Transaction List */}
                                <Box sx={{ 
                                    ...dashboardStyles.transactionList, 
                                    mt: 8,
                                    position: 'relative',
                                    zIndex: 1 
                                }}>
                                    <Typography variant="h6" gutterBottom>
                                        Recent Transactions
                                    </Typography>
                                    {transactions.map((transaction) => (
                                        <Box
                                            key={transaction.id}
                                            sx={dashboardStyles.transactionItem}
                                        >
                                            <Box>
                                                <Typography variant="subtitle1">{transaction.description}</Typography>
                                                <Typography variant="body2" color="textSecondary">
                                                    {transaction.categoryName} • {new Date(transaction.date).toLocaleDateString()}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Typography 
                                                    variant="subtitle1" 
                                                    sx={{ 
                                                        color: transaction.type === 'revenue' ? '#4caf50' : '#f44336',
                                                        fontWeight: 600
                                                    }}
                                                >
                                                    {transaction.type === 'revenue' ? '+' : '-'}${transaction.amount}
                                                </Typography>
                                                <IconButton 
                                                    size="small"
                                                    onClick={() => {
                                                        setEditingTransaction(transaction);
                                                        setDescription(transaction.description);
                                                        setAmount(transaction.amount);
                                                        setCategory(transaction.category);
                                                        setOpenEditModal(true);
                                                    }}
                                                >
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => handleDeleteTransaction(transaction.id)}
                                                >
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            </>
                        ) : activeView === 'insights' ? (
                            <Box sx={dashboardStyles.animatedElement}>
                                <Typography variant="h4" gutterBottom>
                                    Spending Insights
                                </Typography>
                                <SpendingInsights 
                                    transactions={transactions}
                                    monthlyBudget={monthlyBudget}
                                />
                            </Box>
                        ) : activeView === 'anomalies' ? (
                            <Box sx={dashboardStyles.animatedElement}>
                                <Typography variant="h4" gutterBottom>
                                    AI Anomaly Detection
                                </Typography>
                                <AnomalyDashboard categories={categories} />
                            </Box>
                        ) : null}
                    </>
                )}
            </Box>

            {/* Welcome Modal */}
            <WelcomeModal 
                open={showWelcomeModal}
                onClose={() => setShowWelcomeModal(false)}
                currentUser={currentUser}
                onNameSet={(name) => {
                    setUserName(name);
                    setShowWelcomeModal(false);
                }}
            />
            {/* Budget Modal */}
            <Modal
                open={openBudgetModal}
                onClose={() => setOpenBudgetModal(false)}
            >
                <Box sx={dashboardStyles.modalContent}>
                    <Typography variant="h6" gutterBottom>
                        Set Monthly Budget
                    </Typography>
                    <TextField
                        fullWidth
                        label="Budget Amount"
                        type="number"
                        value={newBudget}
                        onChange={(e) => setNewBudget(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={handleBudgetUpdate}
                        sx={{ backgroundColor: '#1a237e' }}
                    >
                        Update Budget
                    </Button>
                </Box>
            </Modal>

            {/* Add Expense Modal */}
            <Modal
                open={openAddExpense}
                onClose={() => setOpenAddExpense(false)}
            >
                <Box sx={dashboardStyles.modalContent}>
                    <Typography variant="h6" gutterBottom>
                        Add New Expense
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                    fullWidth
                                    select
                                    label="Category"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                >
                                    {categories.map((cat) => (
                                        <MenuItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <Button
                                    variant="outlined"
                                    onClick={() => setShowAddCategory(true)}
                                >
                                    <AddCircleOutline />
                                </Button>
                            </Box>
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={handleAddExpense}
                                sx={{ backgroundColor: '#f44336' }}
                            >
                                Add Expense
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </Modal>

            {/* Add Revenue Modal */}
            <Modal
                open={openAddRevenue}
                onClose={() => setOpenAddRevenue(false)}
            >
                <Box sx={dashboardStyles.modalContent}>
                    <Typography variant="h6" gutterBottom>
                        Add New Revenue
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                    fullWidth
                                    select
                                    label="Category"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                >
                                    {revenueCategories.map((cat) => (
                                        <MenuItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <Button
                                    variant="outlined"
                                    onClick={() => setShowAddRevenueCategory(true)}
                                >
                                    <AddCircleOutline />
                                </Button>
                            </Box>
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={handleAddRevenue}
                                sx={dashboardStyles.addRevenueButton}
                            >
                                Add Revenue
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </Modal>

            {/* Name Change Modal */}
            <Modal
                open={openNameModal}
                onClose={() => setOpenNameModal(false)}
            >
                <Box sx={dashboardStyles.modalContent}>
                    <Typography variant="h6" gutterBottom>
                        Change Name
                    </Typography>
                    <TextField
                        fullWidth
                        label="New Name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={handleNameChange}
                    >
                        Update Name
                    </Button>
                </Box>
            </Modal>

            {/* Edit Transaction Modal */}
            <Modal
                open={openEditModal}
                onClose={() => {
                    setOpenEditModal(false);
                    setEditingTransaction(null);
                    setDescription('');
                    setAmount('');
                    setCategory('');
                }}
            >
                <Box sx={dashboardStyles.modalContent}>
                    <Typography variant="h6" gutterBottom>
                        Edit Transaction
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                select
                                label="Category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                {editingTransaction?.type === 'revenue' 
                                    ? revenueCategories.map((cat) => (
                                        <MenuItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </MenuItem>
                                    ))
                                    : categories.map((cat) => (
                                        <MenuItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </MenuItem>
                                    ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={handleEditTransaction}
                            >
                                Update Transaction
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </Modal>

            {/* Settings Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
            >
                <MenuItem onClick={() => {
                    setOpenNameModal(true);
                    setAnchorEl(null);
                }}>
                    Change Name
                </MenuItem>
            </Menu>
            
            {/* Add Category Modal */}
            <Modal
                open={showAddCategory}
                onClose={() => setShowAddCategory(false)}
            >
                <Box sx={dashboardStyles.modalContent}>
                    <Typography variant="h6" gutterBottom>
                        Add New Expense Category
                    </Typography>
                    <TextField
                        fullWidth
                        label="Category Name"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={() => handleAddCategory(false)}
                        sx={{ backgroundColor: '#1a237e' }}
                    >
                        Add Category
                    </Button>
                </Box>
            </Modal>

            {/* Add Revenue Category Modal */}
            <Modal
                open={showAddRevenueCategory}
                onClose={() => setShowAddRevenueCategory(false)}
            >
                <Box sx={dashboardStyles.modalContent}>
                    <Typography variant="h6" gutterBottom>
                        Add New Revenue Category
                    </Typography>
                    <TextField
                        fullWidth
                        label="Category Name"
                        value={newRevenueCategory}
                        onChange={(e) => setNewRevenueCategory(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={() => handleAddCategory(true)}
                        sx={dashboardStyles.addRevenueButton}
                    >
                        Add Category
                    </Button>
                </Box>
            </Modal>
        </Box>
    );
};

export default Dashboard;
