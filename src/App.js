import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/navbar';
import Home from './pages/home';
import Login from './pages/login';
import Register from './pages/register';
import Dashboard from './pages/dashboard';
import PrivateRoute from './components/PrivateRoute';
import ExpensePage from './pages/expensePage';
import AnomalyPage from './pages/anomalyPage';

function App() {
  const { currentUser } = useAuth();
  const location = useLocation();
  
  // Updated condition - don't show navbar on dashboard or anomalies page
  const showNavbar = !currentUser || (location.pathname !== '/dashboard' && location.pathname !== '/anomalies');

  console.log('Auth State:', { currentUser, location: location.pathname });

  return (
    <>
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/expenses" element={<ExpensePage />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/anomalies"
          element={
            <PrivateRoute>
              <Dashboard activeView="anomalies" />
            </PrivateRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;