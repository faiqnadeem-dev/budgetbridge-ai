const API_URL = 'http://localhost:5000/api';

export const expenseService = {
    async addExpense(expenseData, token) {
        try {
            const response = await fetch(`${API_URL}/expenses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(expenseData)
            });

            if (!response.ok) {
                throw new Error('Failed to add expense');
            }

            return response.json();
        } catch (error) {
            console.error('Error in addExpense service:', error);
            throw error;
        }
    },

    async getExpenses(token) {
        try {
            const response = await fetch(`${API_URL}/expenses`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch expenses');
            }

            return response.json();
        } catch (error) {
            console.error('Error in getExpenses service:', error);
            throw error;
        }
    }
};
