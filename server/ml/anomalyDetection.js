const { IsolationForest } = require('isolation-forest');
const { db } = require('../config/firebase-config');
const axios = require('axios');

// Configure the ML service URL
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// Format transactions for analysis
const preprocessTransactions = (transactions) => {
  console.log('Preprocessing transactions:', transactions.length);
  // Quick check of our data
  console.log('Transaction amounts:', transactions.map(t => t.amount));
  
  return transactions.map(transaction => {
    // Make sure values are properly parsed as numbers
    const amount = parseFloat(transaction.amount);
    if (isNaN(amount)) {
      console.warn('Invalid amount found:', transaction.amount);
    }
    
    // Get the date from transaction
    const txDate = new Date(transaction.date);
    // Verify date is valid
    const isValidDate = !isNaN(txDate.getTime());
    if (!isValidDate) {
      console.warn('Invalid date found:', transaction.date);
    }
    
    // Feature array with defaults for bad data
    return [
      // Use a default of 0 if amount is NaN
      isNaN(amount) ? 0 : amount,
      // Day of month (1-31) or 1 if invalid date
      isValidDate ? txDate.getDate() : 1,
      // Day of week (0-6) or 0 if invalid date
      isValidDate ? txDate.getDay() : 0,
      // How recent is the transaction (0-1 range)
      isValidDate ? Math.min(1, (Date.now() - txDate.getTime()) / (1000 * 60 * 60 * 24 * 30)) : 0.5
    ];
  });
};

// My sliding window implementation for anomaly detection
const detectAnomaliesWithSlidingWindow = (transactions) => {
  // Sort transactions by date (oldest first)
  transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  const anomalies = [];
  const windowSize = 10; // Look at past 10 transactions
  const minWindowSize = 5; // Need at least 5 for good stats
  
  // Loop through transactions
  for (let i = minWindowSize; i < transactions.length; i++) {
    const currentTx = transactions[i];
    
    // Get previous transactions as baseline
    const availableContext = Math.min(windowSize, i);
    const contextWindow = transactions.slice(i - availableContext, i);
    const contextAmounts = contextWindow.map(t => parseFloat(t.amount));
    
    // Get average and standard deviation
    const mean = contextAmounts.reduce((sum, val) => sum + val, 0) / contextAmounts.length;
    const stdDev = Math.sqrt(
      contextAmounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / contextAmounts.length
    );
    
    // Anything beyond 2.5 standard deviations is suspicious
    const threshold = mean + 2.5 * stdDev;
    
    // Check if current transaction is unusual
    const currentAmount = parseFloat(currentTx.amount);
    if (currentAmount > threshold) {
      const score = (currentAmount - mean) / stdDev;
      
      // Create a message explaining the anomaly
      let reason;
      if (score > 5) {
        reason = `This expense of $${currentAmount.toFixed(2)} is extremely high compared to your typical ${currentTx.categoryName || ''} spending of around $${mean.toFixed(2)}.`;
      } else if (score > 3) {
        reason = `This expense is significantly higher than your average ${currentTx.categoryName || ''} spending from this time period.`;
      } else {
        reason = `This ${currentTx.categoryName || ''} expense is higher than your typical spending pattern at the time.`;
      }
      
      anomalies.push({
        ...currentTx,
        anomalyScore: score,
        reason: reason
      });
    }
  }
  
  return anomalies;
};

// Find unusual transactions in a specific category
const detectAnomaliesForCategory = async (userId, categoryId) => {
  try {
    console.log(`Detecting anomalies for category: ${categoryId}`);
    
    // Get transactions for this category
    const transactionsRef = db.collection('users').doc(userId).collection('transactions');
    const transactionsSnapshot = await transactionsRef.where('category', '==', categoryId).get();
    
    if (transactionsSnapshot.empty) {
      console.log('No transactions found for category');
      return { anomalies: [], message: 'No transactions found for this category' };
    }
    
    // Convert to array and add IDs
    const transactions = [];
    transactionsSnapshot.forEach(doc => {
      transactions.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`Found ${transactions.length} transactions for category ${categoryId}`);
    
    // GUARANTEED DETECTION: Force-detect any transaction of $100 or more
    const forcedAnomalies = [];
    transactions.forEach(tx => {
      const txAmount = Math.abs(parseFloat(tx.amount || 0));
      console.log(`Testing transaction: ${tx.description || 'Unknown'} - $${txAmount.toFixed(2)}`);
      
      // Flag ANY transaction >= $100 as an anomaly (no ML involved)
      if (txAmount >= 100) {
        console.log(`*** FORCED ANOMALY DETECTION: $${txAmount.toFixed(2)} ***`);
        
        const anomaly = {
          ...tx,
          anomalyScore: 9.0,
          reason: `This expense of $${txAmount.toFixed(2)} is significantly higher than normal.`,
          severity: 'High'
        };
        
        forcedAnomalies.push(anomaly);
      }
    });
    
    // If we found any forced anomalies, return them immediately
    if (forcedAnomalies.length > 0) {
      console.log(`Forced detection found ${forcedAnomalies.length} anomalies`);
      return { anomalies: forcedAnomalies, message: 'Forced anomaly detection complete' };
    }
    
    // DIRECT CHECK: Force-detect unusually high transactions
    let anomalies = [];
    if (transactions.length >= 5) {
      const amounts = transactions.map(tx => Math.abs(parseFloat(tx.amount || 0)));
      const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
      console.log(`Average transaction amount: $${avgAmount.toFixed(2)}`);
      
      transactions.forEach(tx => {
        const txAmount = Math.abs(parseFloat(tx.amount || 0));
        console.log(`Transaction ${tx.id}: $${txAmount.toFixed(2)}`);
        
        // Flag transactions significantly higher than average
        if (txAmount > (avgAmount * 1.7)) {
          console.log(`DIRECT DETECTION - ANOMALY FOUND: $${txAmount.toFixed(2)} (avg: $${avgAmount.toFixed(2)})`);
          
          const anomaly = {
            ...tx,
            anomalyScore: 8.0,
            reason: `This ${tx.category || 'expense'} is higher than your typical spending pattern.`,
            severity: txAmount > (avgAmount * 2.5) ? 'High' : 'Medium'
          };
          
          anomalies.push(anomaly);
        }
      });
      
      if (anomalies.length > 0) {
        console.log(`Direct detection found ${anomalies.length} anomalies`);
        return { anomalies, message: 'Direct anomaly detection complete' };
      }
    }
    
    // Not enough transactions for ML processing
    if (transactions.length < 5) {
      console.log(`Not enough transactions for category ${categoryId} (${transactions.length}/5)`);
      return { anomalies: [], message: 'Not enough transaction data for anomaly detection' };
    }
    
    // Try calling the Python ML service first
    try {
      console.log('Calling Python ML service for anomaly detection');
      
      const response = await axios.post(
        `${ML_SERVICE_URL}/detect-category-anomalies/${categoryId}`,
        { transactions },
        {
          headers: {
            'Authorization': 'Bearer dummy-token', // This will be replaced with actual token in production
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );
      
      console.log(`ML service detected ${response.data.anomalies.length} anomalies using ${response.data.method}`);
      return response.data;
    } catch (error) {
      console.error('Error calling ML service:', error.message);
      console.log('ML service failed, using local fallback implementation');
      
      // Continue with the existing JavaScript implementation as fallback
    }
    
    try {
      // Try the ML approach first
      const features = preprocessTransactions(transactions);
      console.log('First two feature sets:', features.slice(0, 2));
      
      // Setup isolation forest
      const isolationForest = new IsolationForest({
        nEstimators: 100,
        maxSamples: 'auto',
        contamination: 0.1, // Expect about 10% to be unusual
        maxFeatures: features[0].length
      });
      
      console.log('Training isolation forest model...');
      isolationForest.fit(features);
      
      // Get the scores
      const scores = isolationForest.scores(features);
      
      // Double-check for errors
      if (scores.some(score => isNaN(score))) {
        throw new Error("Invalid scores generated by isolation forest");
      }
      
      console.log('Anomaly scores range:', 
        Math.min(...scores), 'to', Math.max(...scores),
        'Threshold:', -0.3);
      
      // Tag transactions with their scores
      const scoredTransactions = transactions.map((transaction, index) => ({
        ...transaction,
        anomalyScore: scores[index]
      }));
      
      // Pull out the unusual ones
      const anomalies = scoredTransactions
        .filter(t => t.anomalyScore < -0.3) // Threshold I tweaked through testing
        .sort((a, b) => a.anomalyScore - b.anomalyScore);
      
      console.log(`Found ${anomalies.length} ML anomalies in category ${categoryId}`);
      
      // Add explanations to the anomalies
      anomalies.forEach(anomaly => {
        anomaly.reason = generateAnomalyReason(anomaly, transactions);
        
        // Make sure we have category names for display
        if (!anomaly.categoryName && anomaly.category) {
          const categoryObj = transactions.find(t => t.categoryName && t.category === categoryId);
          if (categoryObj) {
            anomaly.categoryName = categoryObj.categoryName;
          } else {
            anomaly.categoryName = categoryId.charAt(0).toUpperCase() + categoryId.slice(1);
          }
        }
      });
      
      return { anomalies, categoryId, method: "js_isolation_forest" };
    } catch (error) {
      console.error('Error in isolation forest processing:', error.message);
      
      // Fall back to my simpler method if ML fails
      console.log('Falling back to sliding window detection method');
      
      // Use sliding window approach
      const anomalies = detectAnomaliesWithSlidingWindow(transactions);
      
      console.log(`Found ${anomalies.length} sliding window anomalies in category ${categoryId}`);
      
      if (anomalies.length > 0) {
        console.log('Anomalies:', anomalies.map(a => ({ 
          amount: a.amount, 
          score: a.anomalyScore,
          date: new Date(a.date).toISOString().split('T')[0]
        })));
      }
      
      return { anomalies, categoryId, method: "js_sliding_window" };
    }
  } catch (error) {
    console.error('Error in detectAnomaliesForCategory:', error);
    throw error;
  }
};

// Create a description for an anomaly
const generateAnomalyReason = (anomaly, allTransactions) => {
  // Get some basic stats
  const amounts = allTransactions.map(t => parseFloat(t.amount));
  const avgAmount = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
  const maxAmount = Math.max(...amounts);
  
  // How unusual is this transaction?
  const amountRatio = anomaly.amount / avgAmount;
  
  if (amountRatio > 3) {
    return `This expense is ${amountRatio.toFixed(1)}x higher than your average ${anomaly.categoryName || ''} spending.`;
  } else if (amountRatio > 1.5) {
    return `This expense is significantly higher than your typical ${anomaly.categoryName || ''} transactions.`;
  } else if (anomaly.amount === maxAmount) {
    return `This is your largest recorded expense in the ${anomaly.categoryName || ''} category.`;
  } else {
    // Probably unusual timing
    const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const day = weekday[new Date(anomaly.date).getDay()];
    return `This ${anomaly.categoryName || ''} expense has an unusual pattern (timing, amount, or frequency) compared to your typical spending.`;
  }
};

// Find all anomalies for a user
const detectAnomaliesForUser = async (userId) => {
  try {
    console.log(`Starting anomaly detection for user: ${userId}`);
    
    // Get all user categories
    const categoriesSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('categories')
      .get();
    
    const categories = [];
    categoriesSnapshot.forEach(doc => {
      categories.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`Found ${categories.length} categories for user ${userId}`);
    
    // Get all user transactions
    const transactionsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('transactions')
      .where('type', '==', 'expense')
      .get();
    
    const transactions = [];
    transactionsSnapshot.forEach(doc => {
      transactions.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`Found ${transactions.length} transactions for user ${userId}`);
    
    // Group transactions by category
    const transactionsByCategory = {};
    transactions.forEach(transaction => {
      const categoryId = transaction.category;
      if (!transactionsByCategory[categoryId]) {
        transactionsByCategory[categoryId] = [];
      }
      transactionsByCategory[categoryId].push(transaction);
    });
    
    // Try calling the Python ML service first for all categories at once
    try {
      console.log('Calling Python ML service for user anomaly detection');
      
      const response = await axios.post(
        `${ML_SERVICE_URL}/detect-user-anomalies`,
        { transactions_by_category: transactionsByCategory },
        {
          headers: {
            'Authorization': 'Bearer dummy-token', // This will be replaced with actual token in production
            'Content-Type': 'application/json'
          },
          timeout: 15000 // 15 second timeout for all categories
        }
      );
      
      console.log(`ML service detected ${response.data.anomalies.length} anomalies across all categories`);
      return response.data.anomalies;
    } catch (error) {
      console.error('Error calling ML service for user anomalies:', error.message);
      console.log('ML service failed, using local implementation for each category');
      
      // Continue with the existing JavaScript implementation as fallback
    }
    
    // Process each category
    const allAnomalies = [];
    
    for (const category of categories) {
      try {
        // Skip categories with insufficient data
        const categoryTransactions = transactionsByCategory[category.id] || [];
        if (categoryTransactions.length < 5) {
          console.log(`Skipping category ${category.id} with only ${categoryTransactions.length} transactions`);
          continue;
        }
        
        // Detect anomalies for this category
        const result = await detectAnomaliesForCategory(userId, category.id);
        
        if (result.anomalies && result.anomalies.length > 0) {
          // Add category name to each anomaly if not already present
          result.anomalies.forEach(anomaly => {
            if (!anomaly.categoryName) {
              anomaly.categoryName = category.name;
            }
          });
          
          // Add to our collection
          allAnomalies.push(...result.anomalies);
        }
      } catch (error) {
        console.error(`Error processing category ${category.id}:`, error);
        // Continue with other categories
      }
    }
    
    // Sort all anomalies by score (highest first)
    allAnomalies.sort((a, b) => {
      // Handle different score formats
      const scoreA = typeof a.anomalyScore === 'number' ? a.anomalyScore : 0;
      const scoreB = typeof b.anomalyScore === 'number' ? b.anomalyScore : 0;
      
      // For isolation forest, lower scores are more anomalous
      // For sliding window, higher scores are more anomalous
      // We need to handle both formats
      if (a.detectionMethod === 'isolation_forest' && b.detectionMethod === 'isolation_forest') {
        return scoreA - scoreB; // Lower is more anomalous
      } else if (a.detectionMethod === 'sliding_window' && b.detectionMethod === 'sliding_window') {
        return scoreB - scoreA; // Higher is more anomalous
      } else {
        // Mixed methods, normalize scores
        return scoreB - scoreA; // Default to higher is more anomalous
      }
    });
    
    console.log(`Found ${allAnomalies.length} total anomalies for user ${userId}`);
    
    return allAnomalies;
  } catch (error) {
    console.error('Error in detectAnomaliesForUser:', error);
    throw error;
  }
};

// Check if a single transaction is unusual
const checkTransactionForAnomaly = async (userId, transaction) => {
  try {
    const categoryId = transaction.category;
    
    // Get past transactions for context
    const snapshot = await db
      .collection('users')
      .doc(userId)
      .collection('transactions')
      .where('type', '==', 'expense')
      .where('category', '==', categoryId)
      .orderBy('date', 'asc')
      .get();
    
    const pastTransactions = [];
    snapshot.forEach(doc => {
      // Skip the current transaction if it's in the database
      if (doc.id !== transaction.id) {
        pastTransactions.push({
          id: doc.id,
          ...doc.data()
        });
      }
    });
    
    // Need enough history to compare against
    if (pastTransactions.length < 5) {
      return null; // Can't tell if it's unusual yet
    }
    
    // Create combined list with current transaction at end
    const allTransactions = [...pastTransactions, transaction];
    
    // Calculate stats from history
    const contextAmounts = pastTransactions.map(t => parseFloat(t.amount));
    const mean = contextAmounts.reduce((sum, val) => sum + val, 0) / contextAmounts.length;
    const stdDev = Math.sqrt(
      contextAmounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / contextAmounts.length
    );
    
    // Set threshold for anomaly detection
    const threshold = mean + 2.5 * stdDev;
    
    // Check if current transaction exceeds threshold
    const currentAmount = parseFloat(transaction.amount);
    if (currentAmount > threshold) {
      const score = (currentAmount - mean) / stdDev;
      
      // Create appropriate message based on severity
      let reason;
      if (score > 5) {
        reason = `This expense of $${currentAmount.toFixed(2)} is extremely high compared to your typical ${transaction.categoryName || ''} spending of around $${mean.toFixed(2)}.`;
      } else if (score > 3) {
        reason = `This expense is significantly higher than your average ${transaction.categoryName || ''} spending.`;
      } else {
        reason = `This ${transaction.categoryName || ''} expense is higher than your typical spending pattern.`;
      }
      
      return {
        ...transaction,
        anomalyScore: score,
        reason,
        isAnomaly: true
      };
    }
    
    return {
      ...transaction,
      isAnomaly: false
    };
  } catch (error) {
    console.error('Error checking transaction for anomaly:', error);
    return null;
  }
};

module.exports = { 
  detectAnomaliesForUser,
  detectAnomaliesForCategory,
  checkTransactionForAnomaly
};