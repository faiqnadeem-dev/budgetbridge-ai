const { db } = require('../config/firebase-config');
const { checkTransactionForAnomaly } = require('../ml/anomalyDetection');

const addExpense = async (req, res) => {
    try {
        const { amount, categoryId, categoryName, description, date, userId } = req.body;
        
        const expenseData = {
            amount: Number(amount),
            categoryId,
            categoryName,
            description,
            date,
            userId,
            createdAt: new Date(),
            type: 'expense',
            category: categoryId // Make sure category is set (needed for anomaly detection)
        };

        // Add to the expenses collection
        const docRef = await db.collection('expenses').add(expenseData);
        
        // Also add it to the transactions collection for anomaly detection
        const transactionRef = db.collection('users').doc(userId).collection('transactions');
        await transactionRef.doc(docRef.id).set({
            ...expenseData,
            id: docRef.id
        });
        
        // Check if this transaction is an anomaly
        const anomalyCheck = await checkTransactionForAnomaly(userId, {
            ...expenseData,
            id: docRef.id
        });
        
        const response = {
            id: docRef.id,
            ...expenseData,
            message: 'Expense added successfully'
        };
        
        // If it's an anomaly, include that in the response
        if (anomalyCheck && anomalyCheck.isAnomaly) {
            response.isAnomaly = true;
            response.anomalyReason = anomalyCheck.reason;
            response.anomalyScore = anomalyCheck.anomalyScore;
        }
        
        res.status(201).json(response);
    } catch (error) {
        console.error('Error in addExpense:', error);
        res.status(500).json({ error: 'Failed to add expense' });
    }
};

const getExpenses = async (req, res) => {
    try {
        const userId = req.query.userId;
        const expensesSnapshot = await db.collection('expenses')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();

        const expenses = [];
        expensesSnapshot.forEach(doc => {
            expenses.push({
                id: doc.id,
                ...doc.data()
            });
        });

        res.status(200).json(expenses);
    } catch (error) {
        console.error('Error in getExpenses:', error);
        res.status(500).json({ error: 'Failed to fetch expenses' });
    }
};

module.exports = {
    addExpense,
    getExpenses
};