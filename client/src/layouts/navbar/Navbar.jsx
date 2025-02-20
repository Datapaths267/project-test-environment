import React, { useState } from 'react';
import './Navbar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faSearch, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { Link } from "react-router-dom";

export default function Navbar() {
  const [cfgsubmenu, setCfgsubmenu] = useState(false);
  const userRole = localStorage.getItem("userRole"); // Get role from localStorage

  return (
    <div className="Nav-container">
      <div className="containernav">
        <div className="sidebar">
          <div className="userlogo">
            <FontAwesomeIcon icon={faUserCircle} className="big-icon" />
          </div>
          <div className="search-container">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input type="text" placeholder="Search" />
          </div>

          <div className="Navbar-menus">
            {/* Show Admin Menu Only for Admins */}
            {userRole === "admin" && (
              <>
                <Link to="/dashboard/Admin">
                  <div onClick={() => setCfgsubmenu(!cfgsubmenu)}>
                    Config {cfgsubmenu ? <FontAwesomeIcon icon={faChevronUp} /> : <FontAwesomeIcon icon={faChevronDown} />}
                  </div>
                </Link>
                {cfgsubmenu && (
                  <div className="submenu">
                    <Link to="/dashboard/Admin/ListofEmployee"><div>Employees</div></Link>
                    <Link to="/dashboard/Admin/ListofCustomer"><div>Customers</div></Link>
                    <Link to="/dashboard/Admin/WorkAssign"><div>C - Map</div></Link>
                  </div>
                )}
              </>
            )}

            <Link to="/dashboard/"><div>Home</div></Link>
            <Link to="/dashboard/email"><div>Emails</div></Link>
            <Link to="/dashboard/leads"><div>Leads</div></Link>
            <Link to="/dashboard/feeds"><div>Feeds</div></Link>
            <Link to="/dashboard/accounts"><div>Accounts</div></Link>
            <Link to="/dashboard/contacts"><div>Contacts</div></Link>
            <Link to="/dashboard/campaigns"><div>Campaigns</div></Link>
            <Link to="/dashboard/reports"><div>Reports</div></Link>
            <Link to="/login"><div>Login</div></Link>
            <Link to="/"><div>Logout</div></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
