/**
 * Utility functions for multi-currency handling
 */
import React from "react";

// Common currency codes with symbols and formatting info
export const currencies = {
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    decimals: 2,
    position: "before",
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    decimals: 2,
    position: "after",
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    decimals: 2,
    position: "before",
  },
  JPY: {
    code: "JPY",
    symbol: "¥",
    name: "Japanese Yen",
    decimals: 0,
    position: "before",
  },
  CAD: {
    code: "CAD",
    symbol: "C$",
    name: "Canadian Dollar",
    decimals: 2,
    position: "before",
  },
  AUD: {
    code: "AUD",
    symbol: "A$",
    name: "Australian Dollar",
    decimals: 2,
    position: "before",
  },
  CNY: {
    code: "CNY",
    symbol: "¥",
    name: "Chinese Yuan",
    decimals: 2,
    position: "before",
  },
  INR: {
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
    decimals: 2,
    position: "before",
  },
  MXN: {
    code: "MXN",
    symbol: "MX$",
    name: "Mexican Peso",
    decimals: 2,
    position: "before",
  },
  BRL: {
    code: "BRL",
    symbol: "R$",
    name: "Brazilian Real",
    decimals: 2,
    position: "before",
  },
};

/**
 * Formats an amount with the given currency
 * @param {Number} amount - The amount to format
 * @param {String} currencyCode - The currency code (e.g., 'USD')
 * @returns {String} The formatted amount with currency symbol
 */
export const formatCurrency = (amount, currencyCode = "USD") => {
  const currency = currencies[currencyCode] || currencies.USD;

  // Format the number with appropriate decimal places
  const formattedNumber = Number(amount).toFixed(currency.decimals);

  // Add the currency symbol in the correct position
  return currency.position === "before"
    ? `${currency.symbol}${formattedNumber}`
    : `${formattedNumber} ${currency.symbol}`;
};

/**
 * Converts an amount from one currency to another using the latest rates
 * Note: In a real app, this would call an exchange rate API
 *
 * @param {Number} amount - The amount to convert
 * @param {String} fromCurrency - The source currency code
 * @param {String} toCurrency - The target currency code
 * @returns {Promise<Number>} The converted amount
 */
export const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  // For demonstration purposes, using static conversion rates
  // In a real app, this would fetch current rates from an API like Open Exchange Rates

  if (fromCurrency === toCurrency) {
    return amount;
  }

  try {
    // Example static rates relative to USD
    const staticRates = {
      USD: 1,
      EUR: 0.92,
      GBP: 0.78,
      JPY: 149.5,
      CAD: 1.36,
      AUD: 1.52,
      CNY: 7.21,
      INR: 83.1,
      MXN: 18.6,
      BRL: 5.43,
    };

    // Convert from source currency to USD as the base
    const amountInUSD =
      fromCurrency === "USD" ? amount : amount / staticRates[fromCurrency];

    // Convert from USD to target currency
    const convertedAmount =
      toCurrency === "USD"
        ? amountInUSD
        : amountInUSD * staticRates[toCurrency];

    return convertedAmount;
  } catch (error) {
    console.error("Currency conversion error:", error);
    // If conversion fails, return the original amount
    return amount;
  }
};

/**
 * Gets the user's preferred currency from settings
 * @param {Object} user - The user object
 * @returns {String} The user's preferred currency code or 'USD' as default
 */
export const getUserCurrency = (user) => {
  // In a real app, this would come from user settings
  return user?.settings?.preferredCurrency || "USD";
};

/**
 * React hook that provides currency utils based on user preferences
 * For consistent currency access across components
 *
 * @param {Object} user - The user object
 * @returns {Object} Currency utilities
 */
export const useCurrency = (user) => {
  // Track the current currency state
  const [currency, setCurrency] = React.useState(() => {
    try {
      const savedUserData = JSON.parse(
        localStorage.getItem("userData") || "{}"
      );
      return (
        savedUserData?.settings?.preferredCurrency ||
        getUserCurrency(user) ||
        "USD"
      );
    } catch (err) {
      return getUserCurrency(user) || "USD";
    }
  });

  // Listen for currency changes
  React.useEffect(() => {
    const handleCurrencyChange = () => {
      try {
        const savedUserData = JSON.parse(
          localStorage.getItem("userData") || "{}"
        );
        setCurrency(
          savedUserData?.settings?.preferredCurrency ||
            getUserCurrency(user) ||
            "USD"
        );
      } catch (err) {
        setCurrency(getUserCurrency(user) || "USD");
      }
    };

    // Listen for currency update events
    window.addEventListener("currencyUpdated", handleCurrencyChange);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener("currencyUpdated", handleCurrencyChange);
    };
  }, [user]);

  // Get the current currency code
  const getCurrencyCode = () => currency;

  // Get the current currency symbol
  const getCurrencySymbol = () => {
    return (currencies[currency] || currencies.USD).symbol;
  };

  // Format a value with the current currency
  const format = (amount) => {
    return formatCurrency(amount, currency);
  };

  return {
    code: currency,
    symbol: getCurrencySymbol(),
    format,
    currencyObj: currencies[currency] || currencies.USD,
  };
};

/**
 * Syncs the user's currency preference across the application
 * This function should be called after updating the user's currency preference
 * @param {string} currencyCode - The currency code to set
 * @param {Object} userData - Optional full user data object to save
 */
export const syncUserCurrency = (currencyCode, userData = null) => {
  try {
    // If we have the full userData, store it
    if (userData) {
      localStorage.setItem("userData", JSON.stringify(userData));
      console.log(
        "Full user data saved to localStorage with currency:",
        currencyCode
      );
      return;
    }

    // Otherwise, just update the currency preference in existing userData
    const existingData = JSON.parse(localStorage.getItem("userData") || "{}");
    existingData.settings = existingData.settings || {};
    existingData.settings.preferredCurrency = currencyCode;
    localStorage.setItem("userData", JSON.stringify(existingData));
    console.log("Currency preference updated in localStorage:", currencyCode);
  } catch (err) {
    console.error("Error syncing currency to localStorage:", err);
  }
};
