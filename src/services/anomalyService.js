import { authenticatedFetch, getAuthToken } from '../context/ClerkFirebaseBridge';

const API_URL = 'http://localhost:3001/api';

// ML service URL (hosted in separate Python service)
const ML_API_URL = 'http://localhost:8000';

export const anomalyService = {
    async getUserAnomalies() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            try {
                // Check if we have a token before making the request
                if (!getAuthToken()) {
                    throw new Error('No authentication token available. Please sign in again.');
                }
                
                const response = await authenticatedFetch(`${API_URL}/anomalies`, {
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                return response;
            } catch (error) {
                clearTimeout(timeoutId);
                
                // Handle specific error for token expiry
                if (error.message && (
                    error.message.includes('401') || 
                    error.message.includes('expired') ||
                    error.message.includes('token')
                )) {
                    throw new Error('Your authentication session has expired. Please refresh the page or sign in again.');
                }
                
                console.error('Error fetching anomalies:', error.message);
                throw error;
            }
        } catch (error) {
            console.error('Error in getUserAnomalies service:', error);
            throw error;
        }
    },

    async getCategoryAnomalies(categoryId) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            try {
                // Check if we have a token before making the request
                if (!getAuthToken()) {
                    throw new Error('No authentication token available. Please sign in again.');
                }
                
                const response = await authenticatedFetch(`${API_URL}/anomalies/category/${categoryId}`, {
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                return response;
            } catch (error) {
                clearTimeout(timeoutId);
                
                // Handle specific error for token expiry
                if (error.message && (
                    error.message.includes('401') || 
                    error.message.includes('expired') ||
                    error.message.includes('token')
                )) {
                    throw new Error('Your authentication session has expired. Please refresh the page or sign in again.');
                }
                
                console.error('Error fetching category anomalies:', error.message);
                throw error;
            }
        } catch (error) {
            console.error('Error in getCategoryAnomalies service:', error);
            throw error;
        }
    },
    
    async submitFeedback(feedback) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            try {
                // Get user ID from auth context
                if (!getAuthToken()) {
                    throw new Error('No authentication token available. Please sign in again.');
                }
                
                // Add user_id to feedback object
                const token = await getAuthToken();
                const tokenData = JSON.parse(atob(token.split('.')[1]));
                feedback.user_id = tokenData.sub || 'unknown';
                
                // Submit feedback to the ML service directly
                const response = await authenticatedFetch(`${ML_API_URL}/feedback`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(feedback),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                return response;
            } catch (error) {
                clearTimeout(timeoutId);
                
                // Handle specific error for token expiry
                if (error.message && (
                    error.message.includes('401') || 
                    error.message.includes('expired') ||
                    error.message.includes('token')
                )) {
                    throw new Error('Your authentication session has expired. Please refresh the page or sign in again.');
                }
                
                console.error('Error submitting feedback:', error.message);
                throw error;
            }
        } catch (error) {
            console.error('Error in submitFeedback service:', error);
            throw error;
        }
    },
    
    async getUserAlerts(userId) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            try {
                if (!getAuthToken()) {
                    throw new Error('No authentication token available. Please sign in again.');
                }
                
                // Get current user ID if not provided
                if (!userId) {
                    const token = await getAuthToken();
                    const tokenData = JSON.parse(atob(token.split('.')[1]));
                    userId = tokenData.sub || 'unknown';
                }
                
                const response = await authenticatedFetch(`${ML_API_URL}/alerts/${userId}`, {
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                return response;
            } catch (error) {
                clearTimeout(timeoutId);
                console.error('Error fetching user alerts:', error.message);
                throw error;
            }
        } catch (error) {
            console.error('Error in getUserAlerts service:', error);
            throw error;
        }
    }
};