const express = require('express');
const router = express.Router();
const { getUserAnomalies, getCategoryAnomalies } = require('../controllers/anomalyController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getUserAnomalies);
router.get('/category/:categoryId', verifyToken, getCategoryAnomalies);

module.exports = router;