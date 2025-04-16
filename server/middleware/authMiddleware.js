const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

// Initialize JWKS client for Clerk's JWT verification
const client = jwksClient({
  jwksUri: process.env.CLERK_JWKS_URL || 'https://capital-pup-32.clerk.accounts.dev/.well-known/jwks.json',
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5
});

// Function to get the signing key
function getKey(header, callback) {
  console.log('Getting signing key for kid:', header.kid);
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      console.error('Error getting signing key:', err);
      return callback(err);
    }
    const signingKey = key.publicKey || key.rsaPublicKey;
    console.log('Successfully retrieved signing key');
    callback(null, signingKey);
  });
}

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  
  console.log('Verifying token in middleware');
  console.log('Request path:', req.path);
  
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  try {
    // Log token details (safely)
    const tokenFirstChars = token.substring(0, 10);
    const tokenLastChars = token.substring(token.length - 5);
    console.log(`Token received: ${tokenFirstChars}...${tokenLastChars} (length: ${token.length})`);
    
    // Verify JWT using Clerk's public keys
    jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decoded) => {
      if (err) {
        console.error('Token verification error:', err.name, err.message);
        
        // Handle different types of token errors
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ 
            error: 'Your session has expired. Please log in again.',
            code: 'token_expired'
          });
        } else if (err.name === 'JsonWebTokenError') {
          return res.status(403).json({ 
            error: 'Invalid authentication token.',
            code: 'invalid_token'
          });
        } else {
          return res.status(403).json({ 
            error: 'Authentication failed.',
            code: 'auth_failed'
          });
        }
      }
      
      // Token is valid
      console.log('Token verified successfully for user:', decoded.sub);
      
      // Add user info to request object
      req.user = {
        uid: decoded.sub,
        email: decoded.email || '',
        // Add any other user properties from the token as needed
      };
      
      next();
    });
  } catch (error) {
    console.error('Invalid token error:', error);
    return res.status(403).json({ error: 'Invalid authentication token' });
  }
};

module.exports = { verifyToken };