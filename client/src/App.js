import React from "react";
import { Routes, Route } from "react-router-dom"; // Remove BrowserRouter here

import "bootstrap/dist/css/bootstrap.min.css";

import LoginPage from "./components/auth/LoginPage";
import Dashboard from "./layouts/contents/Dashboard";
import ProtectedRoute from "./routes/ProtectedRoute";

export default function App() {
  const userRole = localStorage.getItem("userRole");

  return (
    <Routes>
      {/* Public Route */}
      <Route path="/" element={<LoginPage />} />

      {/* Protected Dashboard Route */}
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute allowedRoles={["admin", "user"]}>
            <Dashboard userRole={userRole} />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
