import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Track authentication state
  const [showNotification, setShowNotification] = useState(false); // Track notification state
  const menuRef = useRef(null);

  // Function to handle logout
  const handleLogout = () => {
    setIsLoggedIn(false); // Update authentication state
  };

  // Function to show notification
  const showLoginNotification = () => {
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000); // Hide the notification after 3 seconds
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="navbar">
      <div className="menu-toggle" onClick={toggleMenu}>
        <div className={`hamburger ${isOpen ? 'open' : ''}`}></div>
        <div className={`hamburger ${isOpen ? 'open' : ''}`}></div>
        <div className={`hamburger ${isOpen ? 'open' : ''}`}></div>
      </div>
      {isOpen && (
        <ul className="menu-items" ref={menuRef}>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/profile">Profile</Link></li>
          <li><Link to="/blog">Forum</Link></li>
          {isLoggedIn && (
            <li><button onClick={handleLogout}>Logout</button></li>
          )}
        </ul>
      )}
      {showNotification && (
        <div className="notification">
          <p>User is not logged in!</p>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
