# Currency Implementation

This document explains the global currency implementation in the application.

## Overview

The currency functionality is now implemented using React Context, which ensures consistent currency display across the entire application. The currency selected during onboarding will be propagated throughout the app until the user changes it in settings.

## How It Works

1. **CurrencyContext**: The core of the implementation is the `CurrencyContext` which provides currency-related functionality to all components:

   - Currency code (USD, EUR, etc.)
   - Currency formatting
   - Currency symbol
   - Methods to update the currency

2. **Data Flow**:

   - Currency selection in onboarding updates Firestore and localStorage
   - Currency changes in settings also update both locations
   - The context reads from localStorage for immediate access
   - Components subscribe to the context to automatically update when currency changes

3. **Storage**:
   - Primary source: Firestore (`users/{userId}/settings/preferredCurrency`)
   - Local cache: localStorage (`userData.settings.preferredCurrency`)

## Usage in Components

Use the currency hook to access formatting functions and currency info:

```javascript
import { useCurrency } from "../contexts/CurrencyContext";

function MyComponent() {
  const { formatAmount, symbol, currencyCode } = useCurrency();

  return (
    <div>
      <p>Amount: {formatAmount(100)}</p>
      <p>Currency: {currencyCode}</p>
      <p>Symbol: {symbol}</p>
    </div>
  );
}
```

## Updating the Currency

To update the currency (typically in settings or onboarding):

```javascript
import { useCurrency } from "../contexts/CurrencyContext";

function CurrencySelector() {
  const { updateCurrency, currencyCode } = useCurrency();

  const handleCurrencyChange = async (event) => {
    const newCurrency = event.target.value;

    // First update Firestore
    await updateDoc(doc(db, "users", userId), {
      "settings.preferredCurrency": newCurrency,
    });

    // Then update the global context
    updateCurrency(newCurrency);
  };

  return (
    <select value={currencyCode} onChange={handleCurrencyChange}>
      <option value="USD">US Dollar ($)</option>
      <option value="EUR">Euro (€)</option>
      {/* other currencies */}
    </select>
  );
}
```

## Migration from Previous Implementation

If you're updating existing components, use the compatibility helper:

1. Replace imports:

```javascript
// FROM:
import { formatCurrency } from "../utils/currencyUtils";
// TO:
import { useCurrencyCompat as useCurrency } from "../utils/currencyMigration";
```

2. Update component to use the hook:

```javascript
// FROM:
const formattedAmount = formatCurrency(amount);
// TO:
const { formatCurrency } = useCurrency();
const formattedAmount = formatCurrency(amount);
```

3. Once all components have been migrated, switch to using the context directly:

```javascript
import { useCurrency } from "../contexts/CurrencyContext";
const { formatAmount } = useCurrency();
const formattedAmount = formatAmount(amount);
```

## File Structure

- `src/contexts/CurrencyContext.js`: Main context implementation
- `src/utils/currencyUtils.js`: Original currency utilities (maintained for backward compatibility)
- `src/utils/currencyMigration.js`: Helpers for migrating components to the new system

## Testing Currency Changes

When testing, note that currency changes will now be immediately reflected across the entire application without requiring a page refresh.
