import React, { createContext, useContext, useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { currencies, formatCurrency } from "../utils/currencyUtils";

// Create the context
const CurrencyContext = createContext();

/**
 * CurrencyProvider component - wraps the app to provide currency functionality
 */
export const CurrencyProvider = ({ children }) => {
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [isLoading, setIsLoading] = useState(true);

  // Initialize currency from localStorage or default
  useEffect(() => {
    const loadCurrency = async () => {
      try {
        // First try to get from localStorage
        const savedUserData = JSON.parse(
          localStorage.getItem("userData") || "{}"
        );
        const storedCurrency = savedUserData?.settings?.preferredCurrency;

        if (storedCurrency && currencies[storedCurrency]) {
          setCurrencyCode(storedCurrency);
        } else {
          // Default to USD if no valid currency found
          setCurrencyCode("USD");
        }
      } catch (err) {
        console.error("Error loading currency from localStorage:", err);
        setCurrencyCode("USD");
      } finally {
        setIsLoading(false);
      }
    };

    loadCurrency();
  }, []);

  // Method to update the currency throughout the app
  const updateCurrency = (newCurrencyCode, userId = null) => {
    if (!currencies[newCurrencyCode]) {
      console.error(`Invalid currency code: ${newCurrencyCode}`);
      return;
    }

    // Update state
    setCurrencyCode(newCurrencyCode);

    // Update localStorage for immediate access across the app
    try {
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      userData.settings = userData.settings || {};
      userData.settings.preferredCurrency = newCurrencyCode;
      localStorage.setItem("userData", JSON.stringify(userData));
    } catch (err) {
      console.error("Error saving currency to localStorage:", err);
    }

    // Trigger event to notify components
    window.dispatchEvent(
      new CustomEvent("currencyUpdated", {
        detail: { currencyCode: newCurrencyCode },
      })
    );
  };

  // Format amount with current currency
  const formatAmount = (amount) => {
    return formatCurrency(amount, currencyCode);
  };

  // Get current currency symbol
  const getCurrencySymbol = () => {
    return (currencies[currencyCode] || currencies.USD).symbol;
  };

  // Get the full currency object
  const getCurrencyObject = () => {
    return currencies[currencyCode] || currencies.USD;
  };

  // The context value object
  const value = {
    currencyCode,
    updateCurrency,
    formatAmount,
    symbol: getCurrencySymbol(),
    currencyObject: getCurrencyObject(),
    isLoading,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

// Custom hook for using the currency context
export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};

export default CurrencyContext;
