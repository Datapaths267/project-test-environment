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


// import React from "react";
// import { Navigate } from "react-router-dom";

// const ProtectedRoute = ({ children, allowedRoles }) => {
//   const userRole = localStorage.getItem("userRole");
//   const token = localStorage.getItem("token"); // Ensure token is present

//   if (!userRole || !token) {
//     return <Navigate to="/" replace />; // Redirect to login if not authenticated
//   }

//   if (!allowedRoles.includes(userRole.toLowerCase())) {
//     return <Navigate to="/dashboard" replace />; // Redirect unauthorized users
//   }

//   return children;
// };

// export default ProtectedRoute;




















{/*import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, requiredRole }) => {
  const userRole = localStorage.getItem("userRole");

  if (!userRole) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && userRole.toLowerCase() !== requiredRole.toLowerCase()) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;*/}
