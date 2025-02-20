import React from "react";
import { Routes, Route } from "react-router-dom";
import '../../layouts/contents/dashboard.css';
import Navbar from "../navbar/Navbar";
import Leads from "../../pages/leads/Leads";
import Emails from "../../pages/email/Emails";
import HomePage from "../../pages/home/HomePage";
import Adminpage from "../../components/dashboard/adminpage/Adminpage";
import LOCustomer from "../../components/dashboard/adminpage/LOCustomer";
import LOEmployee from "../../components/dashboard/adminpage/LOEmployee";
import Workassign from "../../components/dashboard/adminpage/Workassign";
import ProtectedRoute from "../../routes/ProtectedRoute"; // Import ProtectedRoute

export default function Dashboard() {
  return (
    <div className="dashboard-container">
      <div className="navbar-container">
        <Navbar />
      </div>

      <div className="content">
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<HomePage />} />
          <Route path="/email" element={<Emails />} />
          <Route path="/leads" element={<Leads />} />

          {/* Admin Pages - Protected */}
          <Route path="/Admin" element={<ProtectedRoute element={<Adminpage />} />} />
          <Route path="/Admin/ListofCustomer" element={<ProtectedRoute element={<LOCustomer />} />} />
          <Route path="/Admin/ListofEmployee" element={<ProtectedRoute element={<LOEmployee />} />} />
          <Route path="/Admin/WorkAssign" element={<ProtectedRoute element={<Workassign />} />} />
        </Routes>
      </div>
    </div>
  );
}
