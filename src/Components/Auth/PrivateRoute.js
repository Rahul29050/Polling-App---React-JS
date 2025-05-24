// src/components/Auth/PrivateRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));

  return user && user._id ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
