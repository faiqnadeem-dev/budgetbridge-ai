import OpenAI from "openai";

const API_KEY = process.env.REACT_APP_OPENAI_API_KEY || "";

let openaiInstance = null;

// Initialize OpenAI instance
const getOpenAIInstance = () => {
  if (!openaiInstance) {
    if (!API_KEY) {
      console.error("OpenAI API key is missing");
      return null;
    }

    openaiInstance = new OpenAI({
      apiKey: API_KEY,
      dangerouslyAllowBrowser: true, // Note: In production, you should use a backend proxy
    });
  }
  return openaiInstance;
};

export const openaiService = {
  async getBudgetRecommendations(userData) {
    try {
      const openai = getOpenAIInstance();
      if (!openai) {
        throw new Error("OpenAI client not initialized");
      }

      const {
        transactions,
        categories,
        monthlyIncome,
        userPreferences,
        currency = { code: "USD", symbol: "$" },
      } = userData;

      // Normalize currency format
      const currencyCode = currency.code || currency.currencyCode || "USD";
      const currencySymbol = currency.symbol || currency.currencySymbol || "$";
      const normalizedCurrency = { code: currencyCode, symbol: currencySymbol };

      // Format transaction data
      const formattedTransactions = transactions
        .slice(0, 20)
        .map(
          (t) =>
            `${t.type}: ${normalizedCurrency.symbol}${t.amount} in ${
              t.categoryName
            } on ${new Date(t.date).toLocaleDateString()}`
        )
        .join("\n");

      // Format category data
      const formattedCategories = categories.map((c) => c.name).join(", ");

      // Create the prompt
      let prompt = `I need personalized budget recommendations based on the following financial data:

Monthly Income: ${normalizedCurrency.symbol}${monthlyIncome}
Currency: ${normalizedCurrency.code}

Categories: ${formattedCategories}

Recent Transactions:
${formattedTransactions}

${userPreferences ? `User Preferences: ${userPreferences}` : ""}

Please provide:
1. A recommended monthly budget for each spending category
2. Specific saving suggestions
3. Areas where the user could reduce spending
4. Any other financial insights based on the transaction patterns

Format the response to be clear, concise, and actionable. Give specific dollar amounts for budget recommendations.
`;

      // Call the OpenAI API with an enhanced prompt
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo", // Using a more cost-effective model
        messages: [
          {
            role: "system",
            content:
              'You are an expert financial advisor for BudgetBridge, a personal finance application. Analyze spending patterns carefully and provide specific, actionable recommendations. Focus on practical advice that can be implemented immediately. DO NOT recommend external apps like Mint, YNAB, or other finance tools. DO NOT include an "Implementation" section in your response. DO NOT refer to "your current finance application" - instead, refer to BudgetBridge by name when necessary. Structure your recommendations with clear headings and bullet points.',
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.5, // Lower temperature for more consistent financial advice
        max_tokens: 1000, // Sufficient for good recommendations while controlling costs
      });

      return {
        recommendations: response.choices[0].message.content,
        status: "success",
      };
    } catch (error) {
      console.error("Error generating budget recommendations:", error);
      return {
        recommendations:
          "Unable to generate recommendations at this time. Please try again later.",
        status: "error",
        error: error.message,
      };
    }
  },

  async generateSmartBudgetAllocation(userData) {
    try {
      const openai = getOpenAIInstance();
      if (!openai) {
        throw new Error("OpenAI client not initialized");
      }

      const {
        transactions = [],
        categories = [],
        monthlyIncome = 0,
        existingBudgets = {},
        financialGoals = "Balance spending and saving",
        currency = { code: "USD", symbol: "$" },
      } = userData;

      // Normalize currency format
      const currencyCode = currency.code || currency.currencyCode || "USD";
      const currencySymbol = currency.symbol || currency.currencySymbol || "$";
      const normalizedCurrency = { code: currencyCode, symbol: currencySymbol };

      // Format spending history by category
      const categorySpending = {};
      transactions.forEach((t) => {
        if (t.type === "expense" && t.category) {
          if (!categorySpending[t.category]) {
            categorySpending[t.category] = 0;
          }
          categorySpending[t.category] += Number(t.amount);
        }
      });

      // Format the data for the prompt with category IDs clearly shown
      const formattedCategories = categories
        .map((c) => {
          const spending = categorySpending[c.id] || 0;
          const currentBudget = existingBudgets?.[c.id] || 0;
          return `"${c.name}" (ID: ${c.id}) - Monthly spending: ${normalizedCurrency.symbol}${spending}, Current budget: ${normalizedCurrency.symbol}${currentBudget}`;
        })
        .join("\n");

      // Create a more structured prompt with explicit category ID list
      const categoryIdList = categories.map((c) => `"${c.id}"`).join(", ");

      let prompt = `I need a smart budget allocation for a user with the following data:

Monthly Income: ${normalizedCurrency.symbol}${monthlyIncome}
Currency: ${normalizedCurrency.code}

Categories and Spending:
${formattedCategories}

Financial Goals: ${financialGoals}

RULES FOR BUDGET ALLOCATION:
1. Assign a specific dollar amount to each category
2. Ensure allocations are based on spending patterns and financial best practices
3. Allocate at least 10-20% for savings if a savings category exists
4. Total allocation MUST EXACTLY EQUAL the monthly income of ${normalizedCurrency.symbol}${monthlyIncome} (not a penny more or less)
5. Prioritize essential categories (housing, utilities, food, etc.)

IMPORTANT: Return ONLY a valid JSON object with the category IDs as keys and budget amounts as numeric values.
The exact category IDs you must use are: ${categoryIdList}

Example output format:
{
  "category-id-1": 500,
  "category-id-2": 300,
  ...
}

Do not include any explanation text, only the JSON object.
`;

      // Call the OpenAI API with explicit JSON response format
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a financial advisor specializing in budget allocation. Your ONLY task is to return a valid JSON object with budget allocations, following the exact category IDs provided by the user. The total allocation MUST EXACTLY EQUAL the user's monthly income - allocate the entire amount with no remainder. Do not include any explanations or markdown formatting in your response - ONLY return a parseable JSON object containing the category IDs and their allocated budget amounts as numbers.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2, // Even lower temperature for more consistent allocations
        max_tokens: 800,
        response_format: { type: "json_object" }, // Ensure response is valid JSON
      });

      const content = response.choices[0].message.content;
      console.log("OpenAI Raw Response:", content);

      // Parse the JSON response
      const budgetAllocation = JSON.parse(content);

      // Validate and normalize the budget allocation
      const validatedBudgets = {};
      let totalValidated = 0;

      // Ensure all category IDs from the input are in the output with valid numbers
      categories.forEach((category) => {
        const categoryId = category.id;
        let budgetAmount = budgetAllocation[categoryId];

        // Normalize to number and handle invalid values
        budgetAmount =
          typeof budgetAmount === "number"
            ? budgetAmount
            : Number(budgetAmount);

        // Ensure it's a valid positive number
        if (!isNaN(budgetAmount) && budgetAmount >= 0) {
          validatedBudgets[categoryId] = Math.round(budgetAmount); // Round to whole dollars
          totalValidated += validatedBudgets[categoryId];
        } else {
          validatedBudgets[categoryId] = 0; // Default to 0 if invalid
        }
      });

      // If total exceeds income, scale all budgets proportionally
      if (totalValidated > monthlyIncome) {
        const scaleFactor = monthlyIncome / totalValidated;
        Object.keys(validatedBudgets).forEach((id) => {
          validatedBudgets[id] = Math.floor(validatedBudgets[id] * scaleFactor);
        });

        // Recalculate total after scaling
        totalValidated = Object.values(validatedBudgets).reduce(
          (sum, amount) => sum + Number(amount),
          0
        );
      }

      // Distribute any remaining unallocated income to ensure total equals monthly income exactly
      if (totalValidated < monthlyIncome) {
        const remaining = monthlyIncome - totalValidated;

        // Find non-zero categories to distribute the remaining amount
        const nonZeroCategories = Object.keys(validatedBudgets).filter(
          (id) => validatedBudgets[id] > 0
        );

        if (nonZeroCategories.length > 0) {
          // First, distribute most of the remaining amount proportionally
          const baseDistribution = Math.floor(
            remaining / nonZeroCategories.length
          );
          let leftover =
            remaining - baseDistribution * nonZeroCategories.length;

          nonZeroCategories.forEach((id) => {
            validatedBudgets[id] += baseDistribution;
            // Distribute leftover one unit at a time until gone
            if (leftover > 0) {
              validatedBudgets[id] += 1;
              leftover -= 1;
            }
          });
        } else {
          // If all categories are zero, distribute evenly across all categories
          const baseDistribution = Math.floor(remaining / categories.length);
          let leftover = remaining - baseDistribution * categories.length;

          categories.forEach((category) => {
            const id = category.id;
            validatedBudgets[id] += baseDistribution;
            // Distribute leftover one unit at a time until gone
            if (leftover > 0) {
              validatedBudgets[id] += 1;
              leftover -= 1;
            }
          });
        }
      }

      console.log("Validated Budget Allocation:", validatedBudgets);

      return {
        categoryBudgets: validatedBudgets,
        totalAllocated: Object.values(validatedBudgets).reduce(
          (sum, amount) => sum + Number(amount),
          0
        ),
        status: "success",
      };
    } catch (error) {
      console.error("Error generating AI budget allocation:", error);
      return {
        categoryBudgets: {},
        status: "error",
        error: error.message,
      };
    }
  },

  async generateInsights(
    transactions,
    monthlyBudget = 0,
    currency = { code: "USD", symbol: "$" },
    additionalData = {}
  ) {
    try {
      // Handle both formats: {code, symbol} and {currencyCode, currencySymbol}
      const currencyCode = currency.code || currency.currencyCode || "USD";
      const currencySymbol = currency.symbol || currency.currencySymbol || "$";
      const normalizedCurrency = { code: currencyCode, symbol: currencySymbol };

      // Extract additional data with defaults
      const {
        monthlyIncome = 0,
        totalRevenue = 0,
        totalSavings = 0,
        categoryBudgets = {},
        remainingBudget = 0,
        categories = [],
      } = additionalData;

      const openai = getOpenAIInstance();
      if (!openai) {
        console.log(
          "OpenAI client not initialized, returning default insights"
        );
        return [
          {
            type: "trend",
            title: "Spending Analysis",
            description:
              "Your spending patterns have been analyzed. Check the visualizations below for details.",
          },
          {
            type: "opportunity",
            title: "Budget Planning",
            description:
              "Planning your monthly budget based on spending patterns can help you achieve better financial control.",
          },
          {
            type: "pattern",
            title: "Category Breakdown",
            description:
              "Your spending distribution across categories is visualized below to help you understand where your money goes.",
          },
        ];
      }

      console.log("Calling OpenAI API for insights generation");

      // Process transactions to create a summary for the prompt
      const expenseTransactions = transactions.filter(
        (t) => t.type === "expense"
      );
      const revenueTransactions = transactions.filter(
        (t) => t.type === "revenue"
      );
      const totalSpending = expenseTransactions.reduce(
        (sum, t) => sum + Number(t.amount),
        0
      );
      const actualRevenue = revenueTransactions.reduce(
        (sum, t) => sum + Number(t.amount),
        0
      );

      // Group transactions by category
      const categorySummary = {};
      expenseTransactions.forEach((t) => {
        const category = t.category || "Uncategorized";
        if (!categorySummary[category]) {
          categorySummary[category] = 0;
        }
        categorySummary[category] += Number(t.amount);
      });

      // Calculate category budget usage
      const categoryUsage = {};
      Object.entries(categorySummary).forEach(([categoryId, spent]) => {
        const budget = categoryBudgets[categoryId] || 0;
        if (budget > 0) {
          categoryUsage[categoryId] = {
            spent,
            budget,
            percentage: Math.round((spent / budget) * 100),
          };
        }
      });

      // Format category spending for the prompt
      const topCategories = Object.entries(categorySummary)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category, amount]) => {
          const budget = categoryBudgets[category] || 0;
          const percentage =
            budget > 0 ? Math.round((amount / budget) * 100) : 0;
          const categoryName =
            (Array.isArray(categories) &&
              categories.find((c) => c.id === category)?.name) ||
            category;

          return `${categoryName}: ${normalizedCurrency.symbol}${amount.toFixed(
            2
          )}${
            budget > 0
              ? ` / ${normalizedCurrency.symbol}${budget.toFixed(
                  2
                )} (${percentage}%)`
              : ""
          }`;
        })
        .join("\n");

      // Create a structured prompt with the transaction data - adding the word "json" to fix API issue
      const promptText = `
        Please analyze the following detailed financial data:
        
        Total Spending: ${normalizedCurrency.symbol}${totalSpending.toFixed(2)}
        Monthly Budget: ${normalizedCurrency.symbol}${monthlyBudget}
        Total Monthly Income: ${normalizedCurrency.symbol}${
        monthlyIncome || totalRevenue || monthlyBudget * 2
      }
        Remaining Unallocated Income: ${normalizedCurrency.symbol}${(
        monthlyIncome - monthlyBudget
      ).toFixed(2)}
        Savings Allocation: ${normalizedCurrency.symbol}${totalSavings.toFixed(
        2
      )}
        Currency: ${normalizedCurrency.code}
        
        Top Spending Categories (Spent/Budget):
        ${topCategories}
        
        Generate EXACTLY 3 financial insights based on this comprehensive data. Choose the most relevant types for the current financial situation from these possible types:
        - "pattern" insights about spending patterns or trends
        - "alert" insights about potential areas of concern (only if genuine issues exist)
        - "opportunity" insights about opportunities for saving or optimizing budget allocations
        - "achievement" insights about positive financial behaviors or milestones
        - "forecast" insights about projected financial outcomes based on current behavior
        - "education" insights with helpful financial management tips relevant to the data
        
        IMPORTANT: Generate insights that are actually relevant to the data. DO NOT force an "alert" insight if there are no genuine concerns. Choose the 3 most meaningful insight types from the options above based on the actual financial situation.
        
        CRITICAL REQUIREMENTS:
        - NEVER state that someone has exceeded or overspent a budget unless the spent amount is GREATER than the budget amount
        - Budget for entertainment is ${
          normalizedCurrency.symbol
        }300 and spent amount is ${
        normalizedCurrency.symbol
      }56, which is 18.67% of the budget - this is NOT overspending
        - For a ${normalizedCurrency.symbol}300 budget with ${
        normalizedCurrency.symbol
      }56 spent, there is ${normalizedCurrency.symbol}244 remaining, not ${
        normalizedCurrency.symbol
      }2944. Do not confuse overall income with category budgets.
        - "Remaining unallocated" means money not yet assigned to any budget category, not the remaining amount in a budget
        - When discussing percentages, clearly distinguish between:
          * Category budget as percentage of total budget (e.g., "Entertainment is 10% of your total budget")
          * Amount spent as percentage of category budget (e.g., "You've spent 18.67% of your entertainment budget")
          * Any savings or budget allocation as percentage of TOTAL INCOME (not just of budget)
        - CRITICAL: Monthly income is ${
          normalizedCurrency.symbol
        }${monthlyIncome}, allocated budget is ${
        normalizedCurrency.symbol
      }${monthlyBudget}, so ${normalizedCurrency.symbol}${(
        monthlyIncome - monthlyBudget
      ).toFixed(2)} remains unallocated from income
        - Savings should be discussed as a percentage of TOTAL INCOME (${
          normalizedCurrency.symbol
        }${monthlyIncome}), not just the allocated budget (${
        normalizedCurrency.symbol
      }${monthlyBudget})
        - Provide specific, accurate insights with precise amounts and percentages
        - Double-check ALL numbers and calculations before including them
        
        Each insight should be actionable, highly specific to the data provided, and offer clear next steps.
        Use the correct currency (${
          normalizedCurrency.code
        }) when mentioning monetary values in your insights.
        
        Return your response as a JSON object with an "insights" array containing 3 objects, each with "type", "title", and "description" fields.
        Each insight's "type" field should be one of: "pattern", "alert", "opportunity", "achievement", "forecast", "education".
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a financial analyst for BudgetBridge, a personal finance application. Your task is to generate EXACTLY 3 distinct financial insights based on spending data. Select the most relevant insight types based on the actual financial situation - don't force alerts if there are no issues. Possible types are 'pattern', 'alert', 'opportunity', 'achievement', 'forecast', and 'education'. Return insights as JSON format.\n\nCRITICAL ACCURACY REQUIREMENTS:\n1. NEVER claim a user has exceeded a budget unless the spent amount is GREATER THAN the budget amount\n2. Double-check all percentage calculations:\n   - Category budget as % of total budget = (category budget / total budget) * 100\n   - Spent as % of category budget = (amount spent in category / category budget) * 100\n3. When mentioning a category's portion of total budget, verify the math (e.g., £300/£3000 = 10%)\n4. DO NOT confuse 'amount spent as % of category budget' with 'category budget as % of total budget'\n5. If spending is £56 out of a £300 budget, that's 18.67% spent with 81.33% remaining, NOT overspending\n6. Be precise in your language - distinguish clearly between budget allocation vs. spending\n7. 'Remaining unallocated' refers to income not yet allocated to budget categories, NOT the difference between spent and budget in a category\n8. For a £300 budget with £56 spent, there is £244 remaining in that budget category, not £2944",
          },
          { role: "user", content: promptText },
        ],
        temperature: 0.2,
        max_tokens: 1000,
        response_format: { type: "json_object" },
      });

      // Extract the content from the response
      const content = response.choices[0].message.content || "{}";
      console.log("OpenAI Raw Response:", content);

      try {
        // Parse the JSON response
        const parsedResponse = JSON.parse(content);

        // Check if we have the insights array in the response
        if (
          parsedResponse.insights &&
          Array.isArray(parsedResponse.insights) &&
          parsedResponse.insights.length > 0
        ) {
          // Take only the first 3 insights
          const insights = parsedResponse.insights.slice(0, 3);

          // Return the insights without icons, which will be added in the component
          return insights.map((insight, index) => {
            // Normalize the type to make sure it's one of our expected values
            let type = insight.type?.toLowerCase() || "";

            // If the type isn't one of our supported types, assign one based on the index
            if (
              ![
                "pattern",
                "alert",
                "opportunity",
                "achievement",
                "forecast",
                "education",
              ].includes(type)
            ) {
              // Assign default types if not one of the expected ones
              const defaultTypes = [
                "pattern",
                "alert",
                "opportunity",
                "achievement",
                "forecast",
                "education",
              ];
              type = defaultTypes[index % defaultTypes.length];
            }

            return {
              ...insight,
              type: type,
            };
          });
        }

        // If there's no insights array but we have a direct array
        if (Array.isArray(parsedResponse) && parsedResponse.length > 0) {
          const insights = parsedResponse.slice(0, 3);

          return insights.map((insight, index) => {
            // Normalize the type to make sure it's one of our expected values
            let type = insight.type?.toLowerCase() || "";

            // If the type isn't one of our supported types, assign one based on the index
            if (
              ![
                "pattern",
                "alert",
                "opportunity",
                "achievement",
                "forecast",
                "education",
              ].includes(type)
            ) {
              // Assign default types if not one of the expected ones
              const defaultTypes = [
                "pattern",
                "alert",
                "opportunity",
                "achievement",
                "forecast",
                "education",
              ];
              type = defaultTypes[index % defaultTypes.length];
            }

            return {
              ...insight,
              type: type,
            };
          });
        }

        // Fallback if no valid insights structure found
        throw new Error("No valid insights structure found in the response");
      } catch (parseError) {
        console.error("Error parsing insights JSON:", parseError);
        return getDefaultInsights();
      }
    } catch (error) {
      console.error("Error generating insights:", error);
      return getDefaultInsights();
    }
  },
};

// Default insights to use when API calls fail - without Material UI icon references
const getDefaultInsights = () => [
  {
    type: "pattern",
    title: "Spending Patterns",
    description:
      "Your spending distribution is shown in the charts below. Review them to identify trends in your financial habits.",
  },
  {
    type: "education",
    title: "Budget Fundamentals",
    description:
      "Creating category-specific budgets helps track and control spending. Consider reviewing your budget allocations regularly to ensure they align with your financial goals.",
  },
  {
    type: "achievement",
    title: "Positive Financial Habits",
    description:
      "Setting aside money for savings is an excellent financial habit. Your current budget includes savings allocation, which is a key step toward long-term financial security.",
  },
];

export default openaiService;
