import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import GuidedTour from './GuidedTour';
import GetStartedChecklist from './GetStartedChecklist';

// This component manages the onboarding state and coordinates between the
// existing multi-step onboarding flow and the new guided tour/checklist features
const OnboardingManager = ({ 
  userId, 
  categories,
  transactions,
  monthlyIncome,
  totalAllocated,
  setOpenIncomeModal,
  setOpenBudgetModal,
  setOpenAddExpense,
  setShowAddCategory
}) => {
  // Onboarding state
  const [showTour, setShowTour] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [onboardingState, setOnboardingState] = useState({
    onboardingCompleted: false,
    hasSetIncome: false,
    hasCreatedBudgets: false,
    hasAddedExpense: false,
    hasAddedCategory: false,
    guidedTourCompleted: false,
    checklistDismissed: false
  });

  // Fetch onboarding state from Firestore
  useEffect(() => {
    const fetchOnboardingState = async () => {
      if (!userId) return;
      
      try {
        console.log('OnboardingManager: Fetching onboarding state for user:', userId);
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('OnboardingManager: User data loaded:', { 
            onboardingCompleted: userData.onboardingCompleted,
            hasSetIncome: userData.monthlyIncome > 0,
            hasCategories: userData.categories?.length > 0
          });
          
          // Set onboarding state based on user data
          setOnboardingState(prevState => {
            const newState = {
              ...prevState,
              onboardingCompleted: userData.onboardingCompleted ?? false,
              guidedTourCompleted: userData.guidedTourCompleted ?? false,
              checklistDismissed: userData.checklistDismissed ?? false
            };
            console.log('OnboardingManager: Updated state:', newState);
            return newState;
          });
          
          // If onboardingCompleted is explicitly false, show the tour
          if (userData.onboardingCompleted === false && !userData.guidedTourCompleted) {
            console.log('OnboardingManager: Setting showTour to true for new user');
            setShowTour(true);
          }
        } else {
          console.warn('OnboardingManager: User document does not exist, even though user ID is provided');
        }
      } catch (error) {
        console.error('Error fetching onboarding state:', error);
      }
    };
    
    fetchOnboardingState();
  }, [userId]);

  // Update onboarding state based on app state
  useEffect(() => {
    setOnboardingState(prevState => ({
      ...prevState,
      hasSetIncome: monthlyIncome > 0,
      hasCreatedBudgets: totalAllocated > 0,
      hasAddedExpense: transactions.some(t => t.type === 'expense'),
      hasAddedCategory: categories.length > (categories.find(c => c.id === 'other') ? 5 : 4) // More than default categories
    }));
  }, [monthlyIncome, totalAllocated, transactions, categories]);

  // Show checklist when user hasn't completed all steps
  useEffect(() => {
    console.log('OnboardingManager: Checking if checklist should be shown:', {
      onboardingState,
      shouldShow: (!onboardingState.checklistDismissed &&
        (!onboardingState.hasSetIncome || 
         !onboardingState.hasCreatedBudgets || 
         !onboardingState.hasAddedExpense || 
         !onboardingState.hasAddedCategory))
    });
    
    // Show checklist regardless of onboardingCompleted status for new users
    // This ensures new users always see the checklist
    if (
      !onboardingState.checklistDismissed &&
      (!onboardingState.hasSetIncome || 
       !onboardingState.hasCreatedBudgets || 
       !onboardingState.hasAddedExpense || 
       !onboardingState.hasAddedCategory)
    ) {
      console.log('OnboardingManager: Showing checklist');
      setShowChecklist(true);
    } else {
      setShowChecklist(false);
    }
  }, [onboardingState]);

  // Save onboarding state to Firestore
  const updateOnboardingState = async (updates) => {
    if (!userId) return;
    
    try {
      await updateDoc(doc(db, 'users', userId), updates);
      setOnboardingState(prevState => ({
        ...prevState,
        ...updates
      }));
    } catch (error) {
      console.error('Error updating onboarding state:', error);
    }
  };

  const handleDismissChecklist = () => {
    updateOnboardingState({ checklistDismissed: true });
    setShowChecklist(false);
  };

  const handleCompleteTour = () => {
    updateOnboardingState({ guidedTourCompleted: true });
    setShowTour(false);
  };

  const handleStartTour = () => {
    setShowTour(true);
  };

  return (
    <>
      {/* Guided Tour */}
      <GuidedTour 
        open={showTour}
        onClose={() => setShowTour(false)}
        onComplete={handleCompleteTour}
      />
      
      {/* Getting Started Checklist */}
      {showChecklist && (
        <GetStartedChecklist
          onClose={handleDismissChecklist}
          hasSetIncome={onboardingState.hasSetIncome}
          hasCreatedBudgets={onboardingState.hasCreatedBudgets}
          hasAddedExpense={onboardingState.hasAddedExpense}
          hasAddedCategory={onboardingState.hasAddedCategory}
          onSetIncome={() => setOpenIncomeModal(true)}
          onCreateBudget={() => setOpenBudgetModal(true)}
          onAddExpense={() => setOpenAddExpense(true)}
          onManageCategories={() => setShowAddCategory(true)}
          onStartTour={handleStartTour}
        />
      )}
    </>
  );
};

export default OnboardingManager;
