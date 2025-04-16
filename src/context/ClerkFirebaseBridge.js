import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Create a context for our authentication bridge
const ClerkFirebaseBridgeContext = createContext(null);

// Global authentication token
let _authToken = null;

// Function to get the current auth token
export function getAuthToken() {
  return _authToken;
}

// Update the stored token
export function updateAuthToken(token) {
  _authToken = token;
  console.log('Auth token updated, length:', token?.length);
}

// API request helper with authentication and token refresh
export async function authenticatedFetch(url, options = {}) {
  // Create default headers with authentication if we have a token
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (_authToken) {
    headers['Authorization'] = `Bearer ${_authToken}`;
  } else {
    console.warn('No auth token available for API request');
  }

  // Make the actual fetch request
  try {
    console.log(`Making authenticated fetch to ${url}`);
    const response = await fetch(url, {
      ...options,
      headers
    });

    // Handle token expiration
    if (response.status === 401) {
      console.log('Token expired, attempting to refresh...');
      // Try to get a new token from the global refreshToken function
      // We need to access the refresh function through the window object since this is outside the context
      if (window.clerkBridgeRefreshToken) {
        try {
          const newToken = await window.clerkBridgeRefreshToken(true);
          if (newToken) {
            console.log('Token refreshed, retrying request');
            // Update headers with new token
            headers['Authorization'] = `Bearer ${newToken}`;
            // Retry the request with new token
            const retryResponse = await fetch(url, {
              ...options,
              headers
            });
            
            if (!retryResponse.ok) {
              const errorText = await retryResponse.text();
              throw new Error(`HTTP Error ${retryResponse.status}: ${errorText}`);
            }
            
            return await retryResponse.json();
          }
        } catch (refreshError) {
          console.error('Error refreshing token:', refreshError);
          throw new Error('Authentication failed. Please log in again.');
        }
      } else {
        throw new Error('Authentication expired and refresh function not available');
      }
    }

    if (!response.ok) {
      // Handle HTTP errors
      const errorText = await response.text();
      throw new Error(`HTTP Error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in authenticatedFetch:', error);
    throw error;
  }
}

// Custom hook to use the firebase user
export function useFirebaseUser() {
  const context = useContext(ClerkFirebaseBridgeContext);
  if (context === null) {
    throw new Error('useFirebaseUser must be used within a ClerkFirebaseBridgeProvider');
  }
  return context;
}

// Simplify the bridge provider to focus on core authentication functionality
export function ClerkFirebaseBridgeProvider({ children }) {
  // Get Clerk auth state
  const { isLoaded: isClerkLoaded, userId, getToken } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  
  // State for Firebase user equivalent
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [firebaseToken, setFirebaseToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Used to prevent state updates after unmount
  const isMounted = useRef(true);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Simple token refresh function
  const refreshToken = useCallback(async (force = false) => {
    if (!userId || !isClerkLoaded) return null;
    
    try {
      console.log('Refreshing authentication token...');
      const token = await getToken({skipCache: force});
      
      if (!token) {
        console.error('Failed to get token during refresh');
        return null;
      }
      
      console.log('Token refreshed successfully, length:', token.length);
      
      if (isMounted.current) {
        setFirebaseToken(token);
      }
      
      updateAuthToken(token);
      return token;
    } catch (err) {
      console.error('Error refreshing token:', err);
      return null;
    }
  }, [userId, getToken, isClerkLoaded]);

  // Make refreshToken available globally
  useEffect(() => {
    // Expose refresh function globally so authenticatedFetch can access it
    window.clerkBridgeRefreshToken = refreshToken;
    
    return () => {
      // Clean up global reference on unmount
      delete window.clerkBridgeRefreshToken;
    };
  }, [refreshToken]);

  // Set up automatic token refresh every 20 minutes
  useEffect(() => {
    if (!userId || !isClerkLoaded) return;
    
    // Initial token refresh
    refreshToken();
    
    // Set up interval to refresh token every 20 minutes
    // (Clerk tokens typically have a 30 minute expiry)
    const tokenRefreshInterval = setInterval(() => {
      refreshToken();
    }, 1000 * 60 * 20); // 20 minutes
    
    return () => {
      clearInterval(tokenRefreshInterval);
    };
  }, [userId, isClerkLoaded, refreshToken]);

  // The key authentication effect
  useEffect(() => {
    const setupAuth = async () => {
      // Wait for Clerk to load
      if (!isClerkLoaded || !isUserLoaded) {
        console.log('Waiting for Clerk to load...');
        setLoading(true);
        return;
      }
      
      // Handle logout
      if (!userId || !user) {
        console.log('No Clerk user - clearing Firebase user state');
        setFirebaseUser(null);
        setFirebaseToken(null);
        updateAuthToken(null);
        setLoading(false);
        return;
      }
      
      // Handle login
      try {
        console.log('Setting up Firebase auth with Clerk user:', userId);
        
        // Get token from Clerk
        const token = await getToken();
        if (!token) {
          throw new Error('Failed to get authentication token');
        }
        
        console.log('Successfully got token from Clerk, length:', token.length);
        
        // Create Firebase user object from Clerk user
        const firebaseUserData = {
          uid: userId,
          email: user?.primaryEmailAddress?.emailAddress,
          displayName: user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
          photoURL: user?.imageUrl,
        };
        
        // Set state immediately - this is critical for solving the loading issue
        if (isMounted.current) {
          setFirebaseUser(firebaseUserData);
          setFirebaseToken(token);
          setLoading(false);
          setError(null);
        }
        
        // Update global token
        updateAuthToken(token);
        
        // Synchronize with Firestore (after authentication is established)
        try {
          // Check if user exists in Firestore
          const userDocRef = doc(db, 'users', userId);
          const userDoc = await getDoc(userDocRef);
          
          if (!userDoc.exists()) {
            console.log('Creating new Firestore user document');
            
            // Default categories for new users - updated to use "Savings"
            const defaultExpenseCategories = [
              { id: 'food', name: 'Food' },
              { id: 'transport', name: 'Transport' },
              { id: 'utilities', name: 'Utilities' },
              { id: 'entertainment', name: 'Entertainment' },
              { id: 'savings', name: 'Savings' },
              { id: 'other', name: 'Other' }
            ];
            
            const defaultRevenueCategories = [
              { id: 'salary', name: 'Salary' },
              { id: 'freelance', name: 'Freelance' },
              { id: 'investments', name: 'Investments' },
              { id: 'other-income', name: 'Other Income' }
            ];
            
            // Create user document
            await setDoc(userDocRef, {
              uid: userId,
              email: firebaseUserData.email,
              displayName: firebaseUserData.displayName,
              photoURL: firebaseUserData.photoURL,
              createdAt: new Date(),
              categories: defaultExpenseCategories,
              revenueCategories: defaultRevenueCategories,
              monthlyBudget: 0,
              lastLogin: new Date(),
              onboardingCompleted: false
            });
          } else {
            // Update last login time
            await setDoc(doc(db, 'users', userId), 
                        { lastLogin: new Date() }, 
                        { merge: true });
          }
        } catch (firestoreError) {
          // Log but don't fail auth
          console.error('Firestore operation failed:', firestoreError);
        }
        
        return () => clearInterval(refreshInterval);
      } catch (error) {
        console.error('Error in auth setup:', error);
        
        if (isMounted.current) {
          setError(error.message || 'Authentication failed');
          setLoading(false);
        }
      }
    };
    
    setupAuth();
  }, [isClerkLoaded, isUserLoaded, userId, user, getToken, refreshToken]);
  
  // The value to provide to consumers
  const value = {
    currentUser: firebaseUser,
    token: firebaseToken, 
    loading,
    error,
    isAuthenticated: !!firebaseUser,
    refreshToken,
    getAuthHeader: () => firebaseToken ? { Authorization: `Bearer ${firebaseToken}` } : {}
  };
  
  // For debugging - log the current state
  console.log('ClerkFirebaseBridge state:', { 
    hasUser: !!firebaseUser, 
    hasToken: !!firebaseToken,
    tokenLength: firebaseToken?.length || 0,
    loading, 
    error: error ? String(error) : null 
  });
  
  return (
    <ClerkFirebaseBridgeContext.Provider value={value}>
      {children}
    </ClerkFirebaseBridgeContext.Provider>
  );
}
