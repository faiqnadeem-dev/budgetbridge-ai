import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Divider,
} from "@mui/material";
import AnomalyDashboard from "../components/anomaly/AnomalyDashboard";
import { useFirebaseUser } from "../context/ClerkFirebaseBridge";
import { db } from "../config/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { useAuth, useUser } from "@clerk/clerk-react";

const AnomalyPage = () => {
  // Get authentication state from ClerkFirebaseBridge
  const { currentUser, loading: authLoading, token } = useFirebaseUser();
  const { isLoaded: isClerkLoaded, userId } = useAuth();
  const { isLoaded: isUserLoaded } = useUser();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get categories when user is loaded
  useEffect(() => {
    const fetchCategories = async () => {
      if (!currentUser && !userId) {
        return;
      }

      try {
        setLoading(true);
        let fetchedCategories = [];

        const userRef = doc(db, "users", currentUser?.uid || userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          fetchedCategories = userData.categories || [];
        }

        setCategories(fetchedCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [currentUser, userId]);

  // Show loading if both auth and categories are loading
  if (authLoading && loading) {
    return (
      <Container>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mt: 5,
          }}
        >
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Loading anomaly detection...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Anomaly Detection
        </Typography>
        <Typography variant="body1" paragraph>
          This page shows potential anomalies detected in your spending habits.
          Our machine learning algorithm analyzes your transactions to identify
          unusual patterns.
        </Typography>
        <Divider sx={{ mb: 4 }} />

        <AnomalyDashboard categories={categories} />
      </Box>
    </Container>
  );
};

export default AnomalyPage;
