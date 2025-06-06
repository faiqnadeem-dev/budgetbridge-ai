# BudgetBridge AI

A smart budgeting and financial management application that leverages AI to help users track expenses, detect spending anomalies, and manage their finances more effectively.

## Features

- Expense tracking and categorization with advanced analytics
- AI-powered anomaly detection for unusual spending patterns
- Multi-currency support with automatic conversions
- Interactive dashboard with comprehensive spending insights
- Secure user authentication via Clerk with Firebase integration
- Beautiful and responsive Material UI interface

## Tech Stack

- **Frontend**: React.js with Material UI components
- **Database**: Firebase Firestore
- **Authentication**: Clerk with Firebase Bridge
- **State Management**: React Context API
- **Styling**: Tailwind CSS and custom styling
- **AI Integration**: OpenAI for intelligent spending analysis
- **Visualization**: Nivo charts library for data visualization

## Installation

1. Clone the repository

   ```
   git clone https://github.com/faiqnadeem-dev/budgetbridge-ai.git
   cd budgetbridge-ai
   ```

2. Install dependencies

   ```
   npm install
   ```

3. Create a `.env` file in the root directory with your API keys:

   ```
   REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
   REACT_APP_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
   REACT_APP_OPENAI_API_KEY=your_openai_api_key
   REACT_APP_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   ```

4. Start the development server
   ```
   npm start
   ```

## Project Structure

### Frontend

- `src/components` - Reusable UI components
- `src/pages` - Main application pages
- `src/contexts` & `src/context` - React Context providers
- `src/utils` - Utility functions and helpers
- `src/services` - External API integration services
- `src/config` - Application configuration
- `src/assets` - Static assets

### Backend Server

- `server/routes` - API route definitions
- `server/controllers` - Request handlers and business logic
- `server/middleware` - Custom middleware functions
- `server/config` - Server configuration
- `server/ml` - Simple ML integration module for anomaly detection
- `server/index.js` - Main server entry point

### ML Service

- `ml-service/app` - Core ML service application
  - `main.py` - FastAPI entry point and API endpoints
  - `anomaly_detection.py` - Anomaly detection algorithms
  - `models.py` - Data models and schemas
- `ml-service/data` - Training and test data
- `ml-service/test_*.py` - Test scripts for ML models
- `ml-service/requirements.txt` - Python dependencies
- `ml-service/Dockerfile` - Container configuration for ML service

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
