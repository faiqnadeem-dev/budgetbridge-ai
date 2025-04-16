import React, { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import confetti from "canvas-confetti";
import { currencies } from "../../utils/currencyUtils";
import { useCurrency } from "../../contexts/CurrencyContext";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/clerk-react";

// Icons
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  XMarkIcon,
  WalletIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  CreditCardIcon,
  SparklesIcon,
  ChartBarIcon,
  LightBulbIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const steps = [
  {
    title: "Welcome to Your Financial Journey",
    description:
      "Manage your finances, track expenses, and achieve your financial goals all in one place.",
    icon: WalletIcon,
  },
  {
    title: "Select Your Currency",
    description:
      "Choose the primary currency you'll use for your transactions.",
    icon: GlobeAltIcon,
  },
  {
    title: "Set Your Monthly Income",
    description:
      "Let's start by setting your monthly income - the foundation of your financial planning.",
    icon: CurrencyDollarIcon,
  },
  {
    title: "Create Your Budget",
    description:
      "Now, let's allocate your income to different spending categories.",
    icon: CreditCardIcon,
  },
  {
    title: "Ready to Go!",
    description:
      "Your financial dashboard is ready. You can now start tracking your expenses and managing your finances.",
    icon: SparklesIcon,
  },
];

// Transition variants for animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const OnboardingFlow = ({
  open,
  onClose,
  userId,
  categories = [],
  onUpdateIncome,
  onUpdateBudgets,
  generateAIBudgets,
  onUpdateCurrency,
  onComplete,
}) => {
  // State management
  const [activeStep, setActiveStep] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [incomeError, setIncomeError] = useState("");
  const [categoryBudgets, setCategoryBudgets] = useState({});
  const [remainingBudget, setRemainingBudget] = useState(0);
  const [isAILoading, setIsAILoading] = useState(false);
  const [animationDirection, setAnimationDirection] = useState("forward");
  const [preferredCurrency, setPreferredCurrency] = useState("USD");
  const [showSuccessPulse, setShowSuccessPulse] = useState(false);

  // Use our new currency context
  const { updateCurrency, formatAmount, symbol } = useCurrency();

  // Get user data from Clerk
  const { user, isLoaded: isUserLoaded } = useUser();
  // Get username (could be username, firstName, or full name depending on what's available)
  const username =
    user?.username || user?.firstName || user?.fullName || "there";

  // Log userId received as prop for debugging
  useEffect(() => {
    console.log("OnboardingFlow received userId:", userId);
    console.log("OnboardingFlow Clerk user:", user?.id);
  }, [userId, user]);

  // If userId is not provided, fall back to Clerk user ID
  const effectiveUserId = userId || user?.id;

  // Calculate remaining budget
  useEffect(() => {
    const income = Number(monthlyIncome) || 0;
    const total = Object.values(categoryBudgets).reduce(
      (sum, amount) => sum + (amount === "" ? 0 : Number(amount || 0)),
      0
    );
    setRemainingBudget(income - total);
  }, [monthlyIncome, categoryBudgets]);

  // Initialize category budgets
  useEffect(() => {
    const initialBudgets = {};
    categories.forEach((cat) => {
      initialBudgets[cat.id] = 0;
    });
    setCategoryBudgets(initialBudgets);
  }, [categories]);

  // Handle next step
  const handleNext = async () => {
    // Validate current step
    if (activeStep === 1) {
      // For currency step (now step 1), save currency preference
      try {
        // Update Firestore using the effective user ID
        if (effectiveUserId) {
          await updateDoc(doc(db, "users", effectiveUserId), {
            "settings.preferredCurrency": preferredCurrency,
          });
        } else {
          console.error(
            "No userId available for updating currency preferences"
          );
        }

        // Use our context to update currency across the app
        updateCurrency(preferredCurrency);

        // Call the parent's handler if available
        if (onUpdateCurrency) {
          await onUpdateCurrency(preferredCurrency, false); // false because we already updated the app
        }

        // Show success animation
        setShowSuccessPulse(true);
        setTimeout(() => setShowSuccessPulse(false), 700);
      } catch (error) {
        console.error("Error saving currency preference:", error);
      }
    }

    if (activeStep === 2) {
      // For income step (now step 2), validate income
      const income = Number(monthlyIncome);
      if (!income || income <= 0) {
        setIncomeError("Please enter a valid income amount");
        return;
      }
      // Income is valid, save it
      onUpdateIncome(Number(monthlyIncome));

      // Show success animation
      setShowSuccessPulse(true);
      setTimeout(() => setShowSuccessPulse(false), 700);
    }

    if (activeStep === 3) {
      // Convert any empty strings to zeros before saving budget allocations
      const sanitizedBudgets = {};
      Object.entries(categoryBudgets).forEach(([key, value]) => {
        sanitizedBudgets[key] = value === "" ? 0 : Number(value);
      });

      // Save budget allocations
      onUpdateBudgets(sanitizedBudgets);

      // Show success animation
      setShowSuccessPulse(true);
      setTimeout(() => setShowSuccessPulse(false), 700);
    }

    if (activeStep === steps.length - 1) {
      // Complete onboarding
      try {
        console.log("Completing onboarding process...");

        // Get username from Clerk user data
        const displayName =
          user?.username || user?.firstName || user?.fullName || "";

        // Make sure we have a valid userId
        if (!effectiveUserId) {
          console.error("No user ID available for completing onboarding");
          alert("User ID not found. Please try again or refresh the page.");
          return;
        }

        console.log("Updating Firestore document for user:", effectiveUserId);

        // Add a try-catch specifically for the Firestore update
        try {
          // Update user document with onboarding completion and display name
          await updateDoc(doc(db, "users", effectiveUserId), {
            onboardingCompleted: true,
            lastLogin: new Date(),
            displayName: displayName,
          });
          console.log("Firestore document updated successfully");
        } catch (firestoreError) {
          console.error("Error updating Firestore:", firestoreError);
          console.error("Error details:", JSON.stringify(firestoreError));
          // Continue anyway to ensure the user can proceed
        }

        // Launch confetti
        console.log("Launching confetti celebration");
        launchConfetti();

        // Close after a brief delay for confetti
        console.log("Setting timeout to complete onboarding");
        setTimeout(() => {
          console.log("Timeout triggered, completing onboarding flow");
          if (onComplete) {
            console.log("Calling onComplete callback");
            onComplete();
          }
          console.log("Closing onboarding flow");
          onClose();

          // Refresh the page to ensure all data is properly reloaded
          console.log("Reloading page");
          window.location.reload();
        }, 2500);

        // Return early to prevent further execution
        return;
      } catch (error) {
        console.error("Error in complete step:", error);
        console.error("Error details:", JSON.stringify(error));

        // Even if there's an error, try to close the onboarding
        alert(
          "There was an issue completing setup, but we'll continue anyway."
        );

        if (onComplete) onComplete();
        onClose();

        // Try to reload the page
        window.location.reload();
        return;
      }
    }

    setAnimationDirection("forward");
    setActiveStep((prevStep) => prevStep + 1);

    // If we just completed the currency step, ensure the whole app knows about it
    if (activeStep === 2) {
      // Force update components that might be using the currency
      window.dispatchEvent(new Event("currencyUpdated"));
    }
  };

  // Handle back step
  const handleBack = () => {
    setAnimationDirection("back");
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Handle income change
  const handleIncomeChange = (event) => {
    const value = event.target.value;
    setMonthlyIncome(value);
    if (Number(value) > 0) {
      setIncomeError("");
    }
  };

  // Handle category budget change
  const handleCategoryBudgetChange = (categoryId, value) => {
    const newBudgets = { ...categoryBudgets };
    // Allow empty string as a valid value in the input
    newBudgets[categoryId] = value === "" ? "" : Number(value);
    setCategoryBudgets(newBudgets);
  };

  // Use AI to generate budgets
  const handleAIBudget = async () => {
    if (Number(monthlyIncome) <= 0) {
      setIncomeError("Please set your monthly income first");
      return;
    }

    setIsAILoading(true);
    try {
      const aiGeneratedBudgets = await generateAIBudgets(
        Number(monthlyIncome),
        categories
      );
      setCategoryBudgets(aiGeneratedBudgets);
    } catch (error) {
      console.error("Error generating AI budgets:", error);
    } finally {
      setIsAILoading(false);
    }
  };

  // Launch confetti effect
  const launchConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ["#4f46e5", "#10b981", "#f59e0b", "#ef4444"],
      });

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ["#4f46e5", "#10b981", "#f59e0b", "#ef4444"],
      });
    }, 250);
  };

  // Currency selection step
  const renderCurrencyStep = () => (
    <motion.div
      className="space-y-6 w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h3
        className="text-xl font-semibold text-gray-800"
        variants={itemVariants}
      >
        Choose Your Currency
      </motion.h3>
      <motion.div className="w-full" variants={itemVariants}>
        <label
          htmlFor="currency-select"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Preferred Currency
        </label>
        <select
          id="currency-select"
          value={preferredCurrency}
          onChange={(e) => setPreferredCurrency(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-200"
        >
          {Object.values(currencies).map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.code} - {currency.name} ({currency.symbol})
            </option>
          ))}
        </select>
      </motion.div>
      <motion.div
        className="p-4 bg-indigo-50 rounded-lg border border-indigo-100"
        variants={itemVariants}
      >
        <div className="flex items-start">
          <LightBulbIcon className="w-5 h-5 text-indigo-500 mt-0.5 mr-2 flex-shrink-0" />
          <p className="text-sm text-indigo-800">
            You can change your preferred currency at any time from the settings
            page.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );

  // Income step
  const renderIncomeStep = () => (
    <motion.div
      className="space-y-6 w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h3
        className="text-xl font-semibold text-gray-800"
        variants={itemVariants}
      >
        Set Your Monthly Income
      </motion.h3>
      <motion.div variants={itemVariants}>
        <label
          htmlFor="income-input"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Monthly Income
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">
              {currencies[preferredCurrency]?.symbol || "$"}
            </span>
          </div>
          <input
            id="income-input"
            type="number"
            value={monthlyIncome}
            onChange={handleIncomeChange}
            placeholder="Enter amount"
            className={`w-full pl-8 pr-4 py-2 border ${
              incomeError ? "border-red-500" : "border-gray-300"
            } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-200`}
          />
        </div>
        {incomeError && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-sm text-red-600 flex items-center"
          >
            <XMarkIcon className="w-4 h-4 mr-1" />
            {incomeError}
          </motion.p>
        )}
      </motion.div>
      <motion.div
        className="p-4 bg-indigo-50 rounded-lg border border-indigo-100"
        variants={itemVariants}
      >
        <div className="flex items-start">
          <LightBulbIcon className="w-5 h-5 text-indigo-500 mt-0.5 mr-2 flex-shrink-0" />
          <p className="text-sm text-indigo-800">
            This amount will be used to create your initial budget allocations.
            You can update it later from your profile settings.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );

  // Budget step
  const renderBudgetStep = () => (
    <motion.div
      className="space-y-6 w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        className="flex items-center justify-between"
        variants={itemVariants}
      >
        <h3 className="text-xl font-semibold text-gray-800">
          Create Your Budget
        </h3>
        <button
          onClick={handleAIBudget}
          disabled={isAILoading}
          className="px-4 py-2 flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {isAILoading ? (
            <>
              <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
              <span>Generating...</span>
            </>
          ) : (
            <>
              <SparklesIcon className="w-5 h-5 group-hover:animate-pulse" />
              <span>AI Budget</span>
            </>
          )}
        </button>
      </motion.div>

      <motion.div
        className="p-4 bg-indigo-50 rounded-lg border border-indigo-100"
        variants={itemVariants}
      >
        <div className="flex flex-col space-y-2">
          <div className="flex items-start">
            <ChartBarIcon className="w-5 h-5 text-indigo-500 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-sm text-indigo-800">
              Allocate your monthly income across different spending categories.
            </p>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-indigo-100 mt-1">
            <span className="text-sm text-indigo-800">Total Income:</span>
            <span className="font-medium text-indigo-900">
              {formatAmount(Number(monthlyIncome))}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-indigo-800">Allocated:</span>
            <span className="font-medium text-indigo-900">
              {formatAmount(Number(monthlyIncome) - remainingBudget)}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-indigo-100">
            <span className="text-sm text-indigo-800">Remaining:</span>
            <span
              className={`font-semibold ${
                remainingBudget < 0 ? "text-red-600" : "text-green-600"
              }`}
            >
              {formatAmount(remainingBudget)}
            </span>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="rounded-xl border border-gray-200 overflow-hidden shadow-sm"
        variants={itemVariants}
      >
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h4 className="font-medium text-gray-700">Your Categories</h4>
        </div>
        <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
          {categories
            .filter((cat) => !cat.isRevenue)
            .map((category, index) => (
              <motion.div
                key={category.id}
                className="p-4 bg-white hover:bg-gray-50 transition-colors duration-150"
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { delay: index * 0.05 },
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: category.color || "#9ca3af" }}
                    ></div>
                    <span className="font-medium text-gray-800">
                      {category.name}
                    </span>
                  </div>
                  <div className="w-1/3">
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">{symbol}</span>
                      <input
                        type="number"
                        value={
                          categoryBudgets[category.id] === ""
                            ? ""
                            : categoryBudgets[category.id] || 0
                        }
                        onChange={(e) =>
                          handleCategoryBudgetChange(
                            category.id,
                            e.target.value
                          )
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${
                        Number(monthlyIncome) > 0
                          ? (Number(categoryBudgets[category.id] || 0) /
                              Number(monthlyIncome)) *
                            100
                          : 0
                      }%`,
                    }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                  ></motion.div>
                </div>
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-gray-500">
                    {Number(monthlyIncome) > 0
                      ? (
                          (Number(categoryBudgets[category.id] || 0) /
                            Number(monthlyIncome)) *
                          100
                        ).toFixed(0)
                      : 0}
                    %
                  </span>
                </div>
              </motion.div>
            ))}
        </div>
      </motion.div>
    </motion.div>
  );

  // Welcome step
  const renderWelcomeStep = () => {
    return (
      <motion.div
        className="text-center space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="relative inline-flex" variants={itemVariants}>
          <div className="absolute inset-0 bg-indigo-300 rounded-full blur-xl opacity-70 animate-pulse"></div>
          <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 p-5 rounded-full shadow-lg">
            <WalletIcon className="w-12 h-12 text-white" />
          </div>
        </motion.div>

        <motion.h2
          className="text-2xl font-bold text-gray-800"
          variants={itemVariants}
        >
          Welcome, {username}!
        </motion.h2>

        <motion.p
          className="text-gray-600 max-w-md mx-auto"
          variants={itemVariants}
        >
          Manage your finances, track expenses, and achieve your financial goals
          all in one place.
        </motion.p>

        <motion.div
          className="flex flex-wrap justify-center gap-4 pt-4"
          variants={itemVariants}
        >
          <div className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full">
            <CurrencyDollarIcon className="w-5 h-5" />
            <span className="text-sm">Track Expenses</span>
          </div>
          <div className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-700 rounded-full">
            <ChartBarIcon className="w-5 h-5" />
            <span className="text-sm">Visualize Spending</span>
          </div>
          <div className="flex items-center space-x-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-full">
            <ShieldCheckIcon className="w-5 h-5" />
            <span className="text-sm">Secure & Private</span>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // Complete step
  const renderCompleteStep = () => {
    return (
      <motion.div
        className="text-center space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="relative inline-flex" variants={itemVariants}>
          <div className="absolute inset-0 bg-green-300 rounded-full blur-xl opacity-70 animate-pulse"></div>
          <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 p-5 rounded-full shadow-lg">
            <CheckIcon className="w-12 h-12 text-white" />
          </div>
        </motion.div>

        <motion.h2
          className="text-2xl font-bold text-gray-800"
          variants={itemVariants}
        >
          You're All Set, {username}!
        </motion.h2>

        <motion.p
          className="text-gray-600 max-w-md mx-auto"
          variants={itemVariants}
        >
          Your financial dashboard is ready. You can now start tracking your
          expenses and managing your finances with ease.
        </motion.p>
      </motion.div>
    );
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderWelcomeStep();
      case 1:
        return renderCurrencyStep();
      case 2:
        return renderIncomeStep();
      case 3:
        return renderBudgetStep();
      case 4:
        return renderCompleteStep();
      default:
        return null;
    }
  };

  if (!open) return null;

  // Calculate the percentage of completion
  const completionPercentage = (activeStep / (steps.length - 1)) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto p-4">
      <div className="relative w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-xl overflow-hidden"
        >
          {/* Close button */}
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
              aria-label="Close onboarding"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Overall progress bar */}
          <div className="h-1.5 bg-gray-200">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600"
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 0.3 }}
            ></motion.div>
          </div>

          <div className="px-8 pt-8 pb-6">
            {/* Step title */}
            <div className="mb-6">
              <motion.h2
                className="text-2xl font-bold text-indigo-900"
                key={`title-${activeStep}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {steps[activeStep].title}
              </motion.h2>
            </div>

            {/* Progress indicators */}
            <div className="flex items-center justify-between mb-8 relative">
              {/* Connector line background - spans entire width */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-300 z-0"></div>

              {/* Completed connector line overlay */}
              <div
                className="absolute top-5 left-0 h-0.5 bg-indigo-600 z-0 transition-all duration-300 ease-in-out"
                style={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
              ></div>

              {steps.map((step, index) => (
                <div key={index} className="flex flex-col items-center z-10">
                  <motion.div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 relative bg-white ${
                      index < activeStep
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : index === activeStep
                        ? "border-indigo-600 text-indigo-600"
                        : "border-gray-300 text-gray-400"
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {index < activeStep ? (
                      <CheckIcon className="w-5 h-5" />
                    ) : (
                      <span>{index + 1}</span>
                    )}

                    {/* Success animation */}
                    {showSuccessPulse && index === activeStep - 1 && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-green-500 z-0"
                        initial={{ opacity: 0.8, scale: 0.8 }}
                        animate={{ opacity: 0, scale: 1.5 }}
                        transition={{ duration: 0.7 }}
                      />
                    )}
                  </motion.div>

                  {/* Step name on hover */}
                  <div className="absolute -bottom-6 opacity-0 hover:opacity-100 transition-opacity text-xs whitespace-nowrap">
                    {step.title}
                  </div>
                </div>
              ))}
            </div>

            {/* Step content - Fixed height with scrolling */}
            <div className="h-[350px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{
                    x: animationDirection === "forward" ? 100 : -100,
                    opacity: 0,
                  }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{
                    x: animationDirection === "forward" ? -100 : 100,
                    opacity: 0,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                  className="w-full max-h-[350px] overflow-y-auto py-4 px-2"
                >
                  {renderStepContent()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8">
              <motion.button
                onClick={handleBack}
                disabled={activeStep === 0}
                className={`px-4 py-2 flex items-center space-x-2 border rounded-lg transition-colors ${
                  activeStep === 0
                    ? "border-gray-200 text-gray-300 cursor-not-allowed"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
                whileHover={activeStep !== 0 ? { scale: 1.02 } : {}}
                whileTap={activeStep !== 0 ? { scale: 0.98 } : {}}
              >
                <ArrowLeftIcon className="w-5 h-5" />
                <span>Back</span>
              </motion.button>

              {activeStep < steps.length - 1 ? (
                <motion.button
                  onClick={handleNext}
                  className="px-4 py-2 flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>Next</span>
                  <ArrowRightIcon className="w-5 h-5" />
                </motion.button>
              ) : (
                <motion.button
                  onClick={() => {
                    console.log("Complete button clicked");
                    handleNext();
                  }}
                  className="px-6 py-2 flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>Complete</span>
                  <CheckIcon className="w-5 h-5" />
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
