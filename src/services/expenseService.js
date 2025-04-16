import { authenticatedFetch } from '../context/ClerkFirebaseBridge';
import { doc, collection, addDoc, updateDoc, deleteDoc, getDocs, where, query, orderBy, limit, startAfter, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const API_URL = 'http://localhost:3001/api';
const ML_API_URL = 'http://localhost:8000';

// Helper function to fetch all transactions for a given category
async function getTransactionsForCategory(userId, category) {
  try {
    const transactionsRef = collection(db, 'users', userId, 'transactions');
    const q = query(transactionsRef, where('category', '==', category), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    const transactions = [];
    snapshot.forEach(docSnap => {
      transactions.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });
    return transactions;
  } catch (error) {
    console.error('Error fetching transactions for category:', error);
    return [];
  }
}

export const expenseService = {
  // Add a new expense
  async addExpense(expenseData) {
    try {
      const userId = expenseData.userId;
      
      // Add expense to Firestore
      const expensesRef = collection(db, 'expenses');
      const docRef = await addDoc(expensesRef, expenseData);
      
      // Also add to the user's transactions collection for anomaly detection
      const transactionRef = collection(db, 'users', userId, 'transactions');
      await addDoc(transactionRef, {
        ...expenseData,
        id: docRef.id,
        type: 'expense'
      });
      
      // Check for anomaly detection
      try {
        const categoryId = expenseData.categoryId || expenseData.category;
        // Fetch all transactions for the category
        const allTransactions = await getTransactionsForCategory(userId, categoryId);
        
        // Prepare payload with the full list of transactions
        const requestBody = {
          transactions: allTransactions.map(tx => ({
            ...tx,
            amount: Number(tx.amount)
          }))
        };
        
        // Call the ML service with the aggregated transactions
        const response = await authenticatedFetch(`${ML_API_URL}/detect-category-anomalies/${categoryId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });
        
        // Process anomaly response if any anomalies are detected
        const isAnomaly = response?.anomalies?.length > 0;
        const anomalyReason = isAnomaly ? response.anomalies[0].reason : '';
        const anomalyScore = isAnomaly ? response.anomalies[0].anomalyScore : 0;
        
        return {
          ...expenseData,
          id: docRef.id,
          isAnomaly,
          anomalyReason,
          anomalyScore
        };
      } catch (anomalyError) {
        console.error('Error checking for anomaly:', anomalyError);
        // Return expense data even if the anomaly check fails
        return {
          ...expenseData,
          id: docRef.id
        };
      }
    } catch (error) {
      console.error('Error in addExpense service:', error);
      throw error;
    }
  },

  // Add a new transaction (expense or revenue)
  async addTransaction(transactionData, userId) {
    try {
      // Remove id if present to avoid undefined values
      const { id, ...cleanData } = transactionData;
      // Prepare data with timestamp and userId
      const data = {
        ...cleanData,
        timestamp: Timestamp.now(),
        userId
      };
      
      // Add transaction to Firestore
      const transactionsRef = collection(db, 'users', userId, 'transactions');
      const docRef = await addDoc(transactionsRef, data);
      
      // Check for anomaly detection (only for expenses)
      let anomalyResult = null;
      try {
        if (data.type === 'expense') {
          // Fetch all transactions for the category
          const allTransactions = await getTransactionsForCategory(userId, data.category);
          
          // Prepare payload with all transactions
          const requestBody = {
            transactions: allTransactions.map(tx => ({
              ...tx,
              amount: Number(tx.amount)
            }))
          };
          
          // Call the ML service
          const response = await authenticatedFetch(`${ML_API_URL}/detect-category-anomalies/${data.category}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          });
          
          if (response.anomalies && response.anomalies.length > 0) {
            anomalyResult = {
              isAnomaly: true,
              anomalyReason: response.anomalies[0].reason,
              anomalyScore: response.anomalies[0].anomalyScore
            };
          }
        }
      } catch (anomalyError) {
        console.error('Error checking for anomalies:', anomalyError);
        // Continue even if anomaly detection fails
      }
      
      return { 
        id: docRef.id, 
        ...data,
        ...anomalyResult // Merge anomaly details if present
      };
    } catch (error) {
      console.error('Error in addTransaction service:', error);
      throw error;
    }
  },

  // Update an existing transaction
  async updateTransaction(transactionData, userId) {
    try {
      if (!transactionData.id) {
        throw new Error('Transaction ID is required for updates');
      }
      
      const transactionRef = doc(db, 'users', userId, 'transactions', transactionData.id);
      const { id, ...updateData } = transactionData;
      updateData.updatedAt = Timestamp.now();
      await updateDoc(transactionRef, updateData);
      
      return { id, ...updateData };
    } catch (error) {
      console.error('Error in updateTransaction service:', error);
      throw error;
    }
  },

  // Delete a transaction
  async deleteTransaction(transactionId, userId) {
    try {
      const transactionRef = doc(db, 'users', userId, 'transactions', transactionId);
      await deleteDoc(transactionRef);
      return { success: true, id: transactionId };
    } catch (error) {
      console.error('Error in deleteTransaction service:', error);
      throw error;
    }
  },

  // Get transactions with pagination and filtering
  async getTransactions(userId, options = {}) {
    try {
      const { 
        type,          // 'expense', 'revenue', or null for all
        category,      // category ID or null for all
        startDate,     // Date object or ISO string
        endDate,       // Date object or ISO string
        pageSize = 20, // Items per page
        startAfterDoc  // Last document from previous page
      } = options;
      
      const transactionsRef = collection(db, 'users', userId, 'transactions');
      let q = query(transactionsRef);
      
      if (type) {
        q = query(q, where('type', '==', type));
      }
      
      if (category) {
        q = query(q, where('category', '==', category));
      }
      
      if (startDate) {
        const startTimestamp = startDate instanceof Date 
          ? Timestamp.fromDate(startDate) 
          : Timestamp.fromDate(new Date(startDate));
        q = query(q, where('date', '>=', startTimestamp));
      }
      
      if (endDate) {
        const endTimestamp = endDate instanceof Date 
          ? Timestamp.fromDate(endDate) 
          : Timestamp.fromDate(new Date(endDate));
        q = query(q, where('date', '<=', endTimestamp));
      }
      
      q = query(q, orderBy('date', 'desc'));
      
      if (startAfterDoc) {
        q = query(q, startAfter(startAfterDoc), limit(pageSize));
      } else {
        q = query(q, limit(pageSize));
      }
      
      const snapshot = await getDocs(q);
      const transactions = [];
      snapshot.forEach(docSnap => {
        transactions.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      
      return {
        transactions,
        lastDoc: snapshot.docs[snapshot.docs.length - 1],
        hasMore: snapshot.docs.length === pageSize
      };
    } catch (error) {
      console.error('Error in getTransactions service:', error);
      throw error;
    }
  },

  // Add a recurring transaction
  async addRecurringTransaction(recurringData, userId) {
    try {
      const { id, ...cleanData } = recurringData;
      const data = {
        ...cleanData,
        createdAt: Timestamp.now(),
        userId
      };
      const recurringRef = collection(db, 'users', userId, 'recurringTransactions');
      const docRef = await addDoc(recurringRef, data);
      return { id: docRef.id, ...data };
    } catch (error) {
      console.error('Error in addRecurringTransaction service:', error);
      throw error;
    }
  },

  // Update a recurring transaction
  async updateRecurringTransaction(recurringData, userId) {
    try {
      if (!recurringData.id) {
        throw new Error('Recurring transaction ID is required for updates');
      }
      const recurringRef = doc(db, 'users', userId, 'recurringTransactions', recurringData.id);
      const { id, ...updateData } = recurringData;
      updateData.updatedAt = Timestamp.now();
      await updateDoc(recurringRef, updateData);
      return { id, ...updateData };
    } catch (error) {
      console.error('Error in updateRecurringTransaction service:', error);
      throw error;
    }
  },

  // Delete a recurring transaction
  async deleteRecurringTransaction(recurringId, userId) {
    try {
      const recurringRef = doc(db, 'users', userId, 'recurringTransactions', recurringId);
      await deleteDoc(recurringRef);
      return { success: true, id: recurringId };
    } catch (error) {
      console.error('Error in deleteRecurringTransaction service:', error);
      throw error;
    }
  },

  // Get all recurring transactions
  async getRecurringTransactions(userId) {
    try {
      const recurringRef = collection(db, 'users', userId, 'recurringTransactions');
      const q = query(recurringRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const recurringTransactions = [];
      snapshot.forEach(docSnap => {
        recurringTransactions.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      return recurringTransactions;
    } catch (error) {
      console.error('Error in getRecurringTransactions service:', error);
      throw error;
    }
  }
};
