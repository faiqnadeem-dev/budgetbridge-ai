const { detectAnomaliesForUser, detectAnomaliesForCategory } = require('../ml/anomalyDetection');

const getUserAnomalies = async (req, res) => {
    try {
        console.log('Received request for getUserAnomalies');
        console.log('User ID from token:', req.user.uid);
        
        const userId = req.user.uid;
        const anomalies = await detectAnomaliesForUser(userId);
        
        console.log('Anomalies detected:', anomalies.length);
        
        res.status(200).json({
            anomalies,
            count: anomalies.length
        });
    } catch (error) {
        console.error('Error in getUserAnomalies:', error);
        res.status(500).json({ error: 'Failed to detect anomalies' });
    }
};

const getCategoryAnomalies = async (req, res) => {
    try {
        console.log('Received request for getCategoryAnomalies');
        console.log('User ID from token:', req.user.uid);
        console.log('Category ID from params:', req.params.categoryId);
        
        const userId = req.user.uid;
        const { categoryId } = req.params;
        
        const { anomalies } = await detectAnomaliesForCategory(userId, categoryId);
        
        console.log('Anomalies detected for category:', anomalies.length);
        
        res.status(200).json({
            anomalies,
            count: anomalies.length,
            categoryId
        });
    } catch (error) {
        console.error('Error in getCategoryAnomalies:', error);
        res.status(500).json({ error: 'Failed to detect anomalies for category' });
    }
};

module.exports = {
    getUserAnomalies,
    getCategoryAnomalies
};