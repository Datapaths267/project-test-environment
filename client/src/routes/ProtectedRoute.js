import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const userRole = localStorage.getItem("userRole");
  const token = localStorage.getItem("authToken");  // FIXED KEY

  console.log("Checking access:", userRole, token); // Debugging log

  if (!userRole || !token) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(userRole.toLowerCase())) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;

