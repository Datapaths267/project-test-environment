import React from 'react';
import './Button.css'; // Import the external CSS file

const Button = ({ type = "button", children, className, onClick }) => {
    return (
        <button type={type} className={`custom-button ${className}`} onClick={onClick}>
            {children}
        </button>
    );
};

export default Button;
