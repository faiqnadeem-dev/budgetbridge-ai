import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

/**
 * Private route component that redirects to sign-in if user is not authenticated
 */
const ClerkPrivateRoute = ({ children }) => {
  const { isLoaded, isSignedIn } = useAuth();
  
  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <div>Loading...</div>
      </div>
    );
  }
  
  // Redirect to sign-in page if not authenticated
  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }
  
  // Render children if authenticated
  return children;
};

export default ClerkPrivateRoute;