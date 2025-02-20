import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';  // This will include both JS and Popper.js
import 'bootstrap/dist/css/bootstrap.min.css';       // This includes the CSS styles for Bootstrap
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';



const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <>
    <ToastContainer position="top-center" autoClose={3000} />
    <App />
    </>

);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
