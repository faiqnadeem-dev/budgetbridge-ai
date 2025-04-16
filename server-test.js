// Simple script to test if the anomaly server is running
const fetch = require('node-fetch');

async function testServer() {
  try {
    console.log('Testing connection to anomaly server...');
    
    // First, test if the server is running at all
    try {
      const baseResponse = await fetch('http://localhost:3001');
      console.log('✅ Server is running! Base response status:', baseResponse.status);
    } catch (error) {
      console.error('❌ Server connection failed completely:', error.message);
      console.log('This likely means your anomaly server is not running at port 3001');
      return;
    }
    
    // Now test the actual anomalies endpoint
    try {
      console.log('\nTesting anomalies endpoint (without auth)...');
      const anomalyResponse = await fetch('http://localhost:3001/api/anomalies');
      console.log('Anomaly endpoint status:', anomalyResponse.status);
      
      if (anomalyResponse.status === 401) {
        console.log('✅ Endpoint exists but requires authentication (expected)');
      } else if (anomalyResponse.status === 404) {
        console.log('❌ Endpoint not found - check if the route is implemented correctly');
      } else {
        console.log('Unexpected response from anomaly endpoint');
        const text = await anomalyResponse.text();
        console.log('Response:', text);
      }
    } catch (error) {
      console.error('❌ Error accessing anomaly endpoint:', error.message);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testServer();
