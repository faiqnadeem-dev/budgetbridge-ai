const { auth } = require('../config/firebase-config');

const verifyToken = async (req, res, next) => {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    console.log('Verifying token in middleware');
    
    if (!token) {
        console.log('No token provided');
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decodedToken = await auth.verifyIdToken(token);
        console.log('Token verified successfully for user:', decodedToken.uid);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Invalid token error:', error);
        return res.status(403).json({ error: 'Invalid token' });
    }
};

module.exports = { verifyToken };