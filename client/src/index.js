import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap/dist/css/bootstrap.min.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BrowserRouter } from "react-router-dom"; // Import BrowserRouter
import { ThemeProvider } from "./ThemeContext"; // Import ThemeProvider

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <ThemeProvider> {/* Wrap entire app in ThemeProvider */}
    <BrowserRouter>
      <ToastContainer position="top-center" autoClose={3000} />
      <App />
    </BrowserRouter>
  </ThemeProvider>
);

reportWebVitals();
