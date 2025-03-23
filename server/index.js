const express = require('express');
const cors = require('cors');
const expenseRoutes = require('./routes/expenseRoutes');
const anomalyRoutes = require('./routes/anomalyRoutes');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/expenses', expenseRoutes);
app.use('/api/anomalies', anomalyRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
