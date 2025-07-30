import React from "react";
import { Routes, Route } from "react-router-dom";
import '../../layouts/contents/dashboard.css';
import Navbar from "../navbar/Navbar";
import Leads from "../../pages/ConFig/ConFig";
import Emails from "../../pages/email/Emails";
import HomePage from "../../pages/home/HomePage";
import Adminpage from "../../components/dashboard/adminpage/Adminpage";
import LOCustomer from "../../components/dashboard/adminpage/LOCustomer";
import LOEmployee from "../../components/dashboard/adminpage/LOEmployee";
import Workassign from "../../components/dashboard/adminpage/Workassign";
import ProtectedRoute from "../../routes/ProtectedRoute"; // Import ProtectedRoute
import Contacts from "../../pages/contacts/Contacts";
import RequirementTracker from "../../pages/requirements/RequirementTracker";
import CandidateTracker from "../../pages/candidates/CandidateTracker";
import InterviewTracker from "../../pages/interview/InterviewTracker";
import EmployeeSalary from "../../components/salary/EmployeeSalary";
import OnboardCandidates from "../../pages/onboarded_candidates/OnboardCandidates";
import ConFig from "../../pages/ConFig/ConFig";
import SalaryPaidForm from "../../components/forms/SalaryPaidForm";
import AmFocusOn from "../../pages/reports/AmFocusOn";
import SalaryHistory from "../../components/salary/SalaryHistory";
import SalaryLeave from "../../components/salary/SalaryLeave";
import RecruiterReport from "../../pages/reports/RecruiterReport";
import PerformanceReport from "../../pages/reports/PerformanceReport";
import CandidateReport from "../../pages/reports/CandidateReport";
import ProfilePage from "../../pages/ProfilePage/ProfilePage";

export default function Dashboard({ userRole }) {
  return (
    <div className="dashboard-container">
      <div className="navbar-container">
        <Navbar userRole={userRole} /> {/* Pass userRole to Navbar */}
      </div>

      <div className="content">
        <Routes>
          {/* Public Pages */}
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/requirements" element={<RequirementTracker />} />
          <Route path="/candidateTracker" element={<CandidateTracker />} />
          <Route path="/InterviewTracker" element={<InterviewTracker />} />
          <Route path="/OnboardedCandidates" element={<OnboardCandidates />} />
          <Route path="/ConFig" element={<ConFig />} />
          <Route path="/AM-focus" element={<AmFocusOn />} />
          <Route path="/reports/recruiter" element={<RecruiterReport />} />
          <Route path="/reports/performance" element={<PerformanceReport />} />
          <Route path="/reports/candidate" element={<CandidateReport />} />

          {/* Admin Pages - Protected */}
          {userRole === "admin" && (
            <>
              <Route path="/Admin" element={<Adminpage />} />
              <Route path="/Admin/ListofCustomer" element={<LOCustomer />} />
              <Route path="/Admin/ListofEmployee" element={<LOEmployee />} />
              <Route path="/Admin/WorkAssign" element={<Workassign />} />
              <Route path="/salary-details" element={<EmployeeSalary />} />
              <Route path="/salary-generation" element={<SalaryPaidForm />} />
              <Route path="/salary-history" element={<SalaryHistory />} />
              <Route path="/salary-history" element={<SalaryHistory />} />
              <Route path="/salary-leaves" element={<SalaryLeave />} />

            </>
          )}
        </Routes>
      </div>
    </div>

  );
}
