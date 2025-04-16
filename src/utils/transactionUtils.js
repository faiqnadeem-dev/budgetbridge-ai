/**
 * Utility functions for transaction validation and processing
 */

/**
 * Checks if a transaction might be a duplicate based on similar properties
 * @param {Object} newTransaction - The transaction to check
 * @param {Array} existingTransactions - Existing transactions to compare against
 * @param {Number} timeWindowDays - How many days to look back for potential duplicates
 * @returns {Object|null} The potential duplicate transaction or null if none found
 */
export const checkForDuplicateTransaction = (
  newTransaction,
  existingTransactions,
  timeWindowDays = 3
) => {
  if (
    !newTransaction ||
    !existingTransactions ||
    existingTransactions.length === 0
  ) {
    return null;
  }

  // Calculate date range for checking (default 3 days)
  const transactionDate = new Date(newTransaction.date);
  const startDate = new Date(transactionDate);
  startDate.setDate(startDate.getDate() - timeWindowDays);

  const endDate = new Date(transactionDate);
  endDate.setDate(endDate.getDate() + timeWindowDays);

  // Filter transactions within date range and same category
  const possibleDuplicates = existingTransactions.filter((transaction) => {
    // Skip comparing with itself (when editing)
    if (transaction.id === newTransaction.id) {
      return false;
    }

    // Only look at transactions of the same type (expense/revenue)
    if (transaction.type !== newTransaction.type) {
      return false;
    }

    // Check date range
    const txDate = new Date(transaction.date);
    const isInDateRange = txDate >= startDate && txDate <= endDate;

    // Check same category
    const isSameCategory = transaction.category === newTransaction.category;

    return isInDateRange && isSameCategory;
  });

  // If no possible duplicates in date range, return null
  if (possibleDuplicates.length === 0) {
    return null;
  }

  // Look for transactions with similar amounts and descriptions
  const amountToCheck = Number(newTransaction.amount);

  const exactMatch = possibleDuplicates.find((transaction) => {
    const txAmount = Number(transaction.amount);

    // Check for exact same amount and similar description
    const isExactAmountMatch = Math.abs(txAmount - amountToCheck) < 0.01;

    // Check for similar description (if both have descriptions)
    let isSimilarDescription = false;
    if (transaction.description && newTransaction.description) {
      // Normalize descriptions for comparison
      const desc1 = transaction.description.toLowerCase().trim();
      const desc2 = newTransaction.description.toLowerCase().trim();

      // Exact description match
      if (desc1 === desc2) {
        isSimilarDescription = true;
      } else {
        // Or partial match for descriptions longer than 4 characters
        if (desc1.length > 4 && desc2.length > 4) {
          // Check if one contains the other
          isSimilarDescription = desc1.includes(desc2) || desc2.includes(desc1);
        }
      }
    }

    return isExactAmountMatch && isSimilarDescription;
  });

  // If we found an exact match, return it
  if (exactMatch) {
    return exactMatch;
  }

  // Look for close amount matches (within 5% or $1)
  const closeMatch = possibleDuplicates.find((transaction) => {
    const txAmount = Number(transaction.amount);

    // Allow for small amount differences (5% or $1, whichever is greater)
    const amountDifference = Math.abs(txAmount - amountToCheck);
    const percentageDifference = amountDifference / amountToCheck;

    // Also check for similar description
    let isSimilarDescription = false;
    if (transaction.description && newTransaction.description) {
      const desc1 = transaction.description.toLowerCase().trim();
      const desc2 = newTransaction.description.toLowerCase().trim();

      // Only check for partial match with similar amounts
      if (desc1.length > 3 && desc2.length > 3) {
        isSimilarDescription = desc1.includes(desc2) || desc2.includes(desc1);
      }
    }

    return (
      (percentageDifference < 0.05 || amountDifference < 1) &&
      isSimilarDescription
    );
  });

  return closeMatch || null; // Return close match or null if none found
};

