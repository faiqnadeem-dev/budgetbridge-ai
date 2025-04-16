import { expenseService } from "../src/services/expenseService";
import { authenticatedFetch } from "../src/context/ClerkFirebaseBridge";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";

// Mock Firebase and authenticatedFetch
jest.mock("firebase/firestore");
jest.mock("../src/context/ClerkFirebaseBridge");
jest.mock("../src/config/firebase", () => ({
  db: {},
}));

describe("expenseService.addExpense", () => {
  // Setup test data
  const mockUserId = "user_2vcrc9cQeh6HkSGfT4NiZZJzLga";
  const mockExpenseData = {
    amount: 50.0,
    categoryId: "grocery",
    categoryName: "Groceries",
    description: "Weekly shopping",
    date: "2023-11-10",
    userId: mockUserId,
    type: "expense",
    category: "grocery",
  };

  const mockDocRef = { id: "7EDEcgEUuIFxn6nTWwHr" };
  const mockTransactions = [
    {
      id: "transaction1",
      amount: 45.0,
      category: "grocery",
      date: "2023-10-15",
    },
    {
      id: "transaction2",
      amount: 65.0,
      category: "grocery",
      date: "2023-10-01",
    },
  ];

  // Mock implementation for Firestore queries
  const mockSnapshot = {
    forEach: (callback) => {
      mockTransactions.forEach((tx) => {
        callback({
          id: tx.id,
          data: () => tx,
        });
      });
    },
    docs: mockTransactions.map((tx) => ({ id: tx.id, data: () => tx })),
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock implementations
    addDoc.mockResolvedValue(mockDocRef);
    query.mockReturnValue("mocked-query");
    where.mockReturnValue("mocked-where");
    orderBy.mockReturnValue("mocked-orderBy");
    collection.mockReturnValue("mocked-collection");
    getDocs.mockResolvedValue(mockSnapshot);

    // Mock the ML service response
    authenticatedFetch.mockResolvedValue({
      anomalies: [
        {
          reason: "Amount significantly higher than usual",
          anomalyScore: 0.85,
        },
      ],
    });
  });

  it("should add expense to Firestore and detect anomalies", async () => {
    // Execute the function
    const result = await expenseService.addExpense(mockExpenseData);

    // Verify expense was added to main expenses collection
    expect(collection).toHaveBeenCalledWith(expect.anything(), "expenses");
    expect(addDoc).toHaveBeenCalledWith("mocked-collection", mockExpenseData);

    // Verify expense was added to user's transactions collection
    expect(collection).toHaveBeenCalledWith(
      expect.anything(),
      "users",
      mockUserId,
      "transactions"
    );
    expect(addDoc).toHaveBeenCalledWith(
      "mocked-collection",
      expect.objectContaining({
        ...mockExpenseData,
        id: mockDocRef.id,
        type: "expense",
      })
    );

    // Verify transactions were fetched for anomaly detection
    expect(collection).toHaveBeenCalledWith(
      expect.anything(),
      "users",
      mockUserId,
      "transactions"
    );
    expect(where).toHaveBeenCalledWith("category", "==", "grocery");
    expect(orderBy).toHaveBeenCalledWith("date", "desc");
    expect(getDocs).toHaveBeenCalledWith("mocked-query");

    // Verify ML service was called with the right data
    expect(authenticatedFetch).toHaveBeenCalledWith(
      expect.stringContaining("/detect-category-anomalies/grocery"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.any(String),
      })
    );

    // Verify returned data includes expense details and anomaly information
    expect(result).toEqual({
      ...mockExpenseData,
      id: mockDocRef.id,
      isAnomaly: true,
      anomalyReason: "Amount significantly higher than usual",
      anomalyScore: 0.85,
    });
  });

  it("should handle errors during anomaly detection", async () => {
    // Mock anomaly detection to fail
    authenticatedFetch.mockRejectedValueOnce(new Error("Network error"));

    // Execute the function
    const result = await expenseService.addExpense(mockExpenseData);

    // Verify expense was still added to collections
    expect(addDoc).toHaveBeenCalledTimes(2);

    // Verify result contains expense data without anomaly information
    expect(result).toEqual({
      ...mockExpenseData,
      id: mockDocRef.id,
    });
    expect(result.isAnomaly).toBeUndefined();
    expect(result.anomalyReason).toBeUndefined();
    expect(result.anomalyScore).toBeUndefined();
  });

  it("should throw an error if adding expense fails", async () => {
    // Mock addDoc to fail
    addDoc.mockRejectedValueOnce(new Error("Database error"));

    // Execute and expect error
    await expect(expenseService.addExpense(mockExpenseData)).rejects.toThrow(
      "Database error"
    );

    // Verify no anomaly detection was attempted
    expect(authenticatedFetch).not.toHaveBeenCalled();
  });
});
