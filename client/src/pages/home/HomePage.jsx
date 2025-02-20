import React from 'react';
import './HomePage.css';

export default function HomePage() {
  const role = localStorage.getItem('role');
  return (
    <div className="home-container">
      <h2>{role === 'admin' ? 'Welcome Admin!' : 'Welcome User!'}</h2>
    </div>
  );
}
