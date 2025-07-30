import React, { useState } from "react";
import "./Navbar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserCircle,
  faSearch,
  faChevronDown,
  faChevronUp,
  faBars,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";

// Reusable Submenu Component
const SubmenuToggle = ({ title, isOpen, toggleFunction, children }) => (
  <>
    <div onClick={toggleFunction} className="menu-item" style={{ cursor: "pointer" }}>
      {title} <FontAwesomeIcon icon={isOpen ? faChevronUp : faChevronDown} />
    </div>
    {isOpen && <div className="submenu">{children}</div>}
  </>
);

export default function Navbar() {
  const [cfgSubmenu, setCfgSubmenu] = useState(false);
  const [salarySubmenu, setSalarySubmenu] = useState(false);
  const [reportSubmenu, setReportSubmenu] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const designation = localStorage.getItem("designation");
  const token = localStorage.getItem("authToken");

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("designation");
    window.location.href = "/";
  };

  return (
    <div className={`Nav-container ${menuOpen ? "menu-open" : ""}`}>
      {/* Hamburger Icon */}
      <div className="topbar">
        <button className="hamburger-button" onClick={toggleMenu}>
          <FontAwesomeIcon icon={menuOpen ? faTimes : faBars} />
        </button>
      </div>


      {/* Sidebar */}
      <div className="containernav">
        <div className="sidebar">
          <div className="sidebar-content">

            {/* Profile Icon */}
            <div className="userlogo">
              <Link to="/dashboard/profile">
                <FontAwesomeIcon icon={faUserCircle} className="big-icon" style={{ color: 'white' }} />
              </Link>
            </div>

            {/* Search Input */}
            <div className="search-container">
              <div className="search-icon">
                <FontAwesomeIcon icon={faSearch} className="search-icon" />
                <input type="text" placeholder="Search" />
              </div>
            </div>

            {/* Menus */}
            <div className="Navbar-menus">
              {/* Config Menu (Director only) */}
              {(designation === "Senior Director" || designation === "Director") && token && (
                <SubmenuToggle
                  title="Config"
                  isOpen={cfgSubmenu}
                  toggleFunction={() => setCfgSubmenu(!cfgSubmenu)}
                >
                  <Link to="/dashboard/Admin">
                    <div className="submenu-item">About Us</div>
                  </Link>
                  <Link to="/dashboard/Admin/ListofEmployee">
                    <div className="submenu-item">Employees</div>
                  </Link>
                  <Link to="/dashboard/Admin/ListofCustomer">
                    <div className="submenu-item">Customers</div>
                  </Link>
                  <Link to="/dashboard/Admin/WorkAssign">
                    <div className="submenu-item">C - Map</div>
                  </Link>
                </SubmenuToggle>
              )}

              {/* Salary Menu */}
              <SubmenuToggle
                title="Salary"
                isOpen={salarySubmenu}
                toggleFunction={() => setSalarySubmenu(!salarySubmenu)}
              >
                <Link to="/dashboard/salary-details">
                  <div className="submenu-item">Salary Component</div>
                </Link>
                <Link to="/dashboard/salary-generation">
                  <div className="submenu-item">Salary Generation</div>
                </Link>
                <Link to="/dashboard/salary-history">
                  <div className="submenu-item">Salary History</div>
                </Link>
                <Link to="/dashboard/salary-leaves">
                  <div className="submenu-item">Leave Component</div>
                </Link>
              </SubmenuToggle>

              {/* Static Links */}
              {/* <Link to="/dashboard/profile">
                <div className="menu-item">Profile</div>
              </Link> */}
              <Link to="/dashboard/home">
                <div className="menu-item">Productivity Report</div>
              </Link>
              <Link to="/dashboard/contacts">
                <div className="menu-item">Contacts</div>
              </Link>
              <Link to="/dashboard/requirements">
                <div className="menu-item">Requirements</div>
              </Link>
              <Link to="/dashboard/candidateTracker">
                <div className="menu-item">Candidate Trackers</div>
              </Link>
              <Link to="/dashboard/InterviewTracker">
                <div className="menu-item">Interview Trackers</div>
              </Link>
              <Link to="/dashboard/OnboardedCandidates">
                <div className="menu-item">Onboarded Candidates</div>
              </Link>
              <Link to="/dashboard/ConFig">
                <div className="menu-item">ConFig</div>
              </Link>

              {/* Reports */}
              <SubmenuToggle
                title="Reports"
                isOpen={reportSubmenu}
                toggleFunction={() => setReportSubmenu(!reportSubmenu)}
              >
                <Link to="/dashboard/AM-focus">
                  <div className="submenu-item">AM Focus On</div>
                </Link>
                <Link to="/dashboard/reports/recruiter">
                  <div className="submenu-item">Recruiter Report</div>
                </Link>
                <Link to="/dashboard/reports/candidate">
                  <div className="submenu-item">Candidate Report</div>
                </Link>
                <Link to="/dashboard/reports/performance">
                  <div className="submenu-item">Performance Report</div>
                </Link>
              </SubmenuToggle>

              {/* Auth Menu */}
              {!token ? (
                <Link to="/login">
                  <div className="menu-item">Login</div>
                </Link>
              ) : (
                <div onClick={handleLogout} className="menu-item" style={{ cursor: "pointer" }}>
                  Logout
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
