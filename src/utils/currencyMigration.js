/**
 * Helper utilities for migrating from old currency implementation to the new CurrencyContext
 */
import { useCurrency } from "../contexts/CurrencyContext";

/**
 * Legacy-compatible currency hook that provides both old and new currency APIs
 * This helps with migration by allowing components to continue working while being updated
 *
 * @returns {Object} Combined API with both legacy and new currency methods
 */
export const useCurrencyCompat = () => {
  // Get the new currency context
  const currencyContext = useCurrency();

  // Return a combined API that includes both old and new methods
  return {
    // New context API
    ...currencyContext,

    // Legacy API compatibility
    formatCurrency: (amount) => currencyContext.formatAmount(amount),
    code: currencyContext.currencyCode,
    symbol: currencyContext.symbol,
    currencyObj: currencyContext.currencyObject,
  };
};

/**
 * Migration guide for developers:
 *
 * 1. First, replace imports from currencyUtils with imports from currencyMigration:
 *    - FROM: import { useCurrency } from '../utils/currencyUtils'
 *    - TO:   import { useCurrencyCompat as useCurrency } from '../utils/currencyMigration'
 *
 * 2. After all components have been updated to use the context, replace with direct imports:
 *    - FROM: import { useCurrencyCompat as useCurrency } from '../utils/currencyMigration'
 *    - TO:   import { useCurrency } from '../contexts/CurrencyContext'
 *
 * 3. Rename method calls:
 *    - FROM: format(amount) or formatCurrency(amount)
 *    - TO:   formatAmount(amount)
 */
