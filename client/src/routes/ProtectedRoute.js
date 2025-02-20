import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ element }) => {
  const userRole = localStorage.getItem("userRole"); // Fetch role from localStorage

  if (userRole !== "admin") {
    return <Navigate to="/dashboard" replace />; // Redirect non-admin users
  }

  return element;
};

export default ProtectedRoute;
