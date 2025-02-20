import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import 'bootstrap/dist/css/bootstrap.min.css';

import LoginPage from "./components/auth/LoginPage";
import Dashboard from "./layouts/contents/Dashboard"; // Dashboard includes Navbar & Pages

export default function App() {
  return (
    <Router>
      
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}
