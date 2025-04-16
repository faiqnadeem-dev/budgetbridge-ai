# Anomaly Detection ML Service

This Python-based microservice provides advanced anomaly detection capabilities using machine learning algorithms. It's designed to work with the Finance Assistant application to identify unusual spending patterns.

## Features

- **Isolation Forest Algorithm**: Primary anomaly detection method using scikit-learn's robust implementation
- **Sliding Window Detection**: Fallback method when Isolation Forest doesn't produce reliable results
- **REST API**: Simple HTTP endpoints for integration with the main application
- **Authentication**: Support for Clerk JWT token verification
- **Detailed Logging**: Comprehensive logging for debugging and monitoring

## Setup

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. Create a virtual environment (recommended):
   ```
   python -m venv venv
   ```

2. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

### Running the Service

Start the service locally:

```
uvicorn app.main:app --reload --port 8000
```

The API will be available at http://localhost:8000

## API Endpoints

### Health Check
```
GET /
```

### Detect Anomalies for a Category
```
POST /detect-category-anomalies/{category_id}
```

### Detect Anomalies for a User (All Categories)
```
POST /detect-user-anomalies
```

## Docker Deployment

Build the Docker image:
```
docker build -t anomaly-detection-service .
```

Run the container:
```
docker run -p 8000:8000 anomaly-detection-service
```

## Integration with Node.js Backend

The Node.js backend should call this service's API endpoints to perform anomaly detection. See the updated `anomalyDetection.js` file in the main application for implementation details.
