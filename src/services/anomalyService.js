const API_URL = 'http://localhost:5000/api';

export const anomalyService = {
    async getUserAnomalies(token) {
        try {
            const response = await fetch(`${API_URL}/anomalies`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch anomalies');
            }

            return response.json();
        } catch (error) {
            console.error('Error in getUserAnomalies service:', error);
            throw error;
        }
    },

    async getCategoryAnomalies(categoryId, token) {
        try {
            const response = await fetch(`${API_URL}/anomalies/category/${categoryId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch category anomalies');
            }

            return response.json();
        } catch (error) {
            console.error('Error in getCategoryAnomalies service:', error);
            throw error;
        }
    }
};