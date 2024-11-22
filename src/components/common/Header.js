import React from 'react';
import { useAuth } from '../../services/authservice';
import { useNavigate } from 'react-router-dom';
import shivanLogo from '../../assets/shivan.png'; // Ensure you have this file in the specified path
import { FaUserCircle } from 'react-icons/fa';
import '../../styles/header.css';

const Header = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout', error);
    }
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  return (
    <header className="header">
      <div className="logo">
        <img src={shivanLogo} alt="Shivan Logo" />
      </div>
      <div className="title">Printz Shop</div>
      <div className="header-right">
        <FaUserCircle size={30} className="profile-icon" onClick={handleProfile} />
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </div>
    </header>
  );
};

export default Header;
