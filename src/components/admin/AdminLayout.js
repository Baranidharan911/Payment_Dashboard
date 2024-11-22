import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaCaretDown, FaCaretRight } from 'react-icons/fa';
import '../../styles/sidebar.css';

const AdminLayout = ({ children }) => {
  const [isPricingDataOpen, setIsPricingDataOpen] = useState(false);
  const [isRevenueDataOpen, setIsRevenueDataOpen] = useState(false);

  const togglePricingData = () => {
    setIsPricingDataOpen(!isPricingDataOpen);
  };

  const toggleRevenueData = () => {
    setIsRevenueDataOpen(!isRevenueDataOpen);
  };

  return (
    <div className="layout">
      <div className="sidebar">
        <h2>Admin Panel</h2>
        <ul>
          <li><Link to="/admin-dashboard">Dashboard</Link></li>
          <li><Link to="/total-amount-list-admin">Total Revenue List</Link></li>
          <li><Link to="/add-manager">Add Branch</Link></li>
          
          <li className="dropdown-container">
            <button onClick={togglePricingData} className="dropdown-btn">
              Pricing Data {isPricingDataOpen ? <FaCaretDown /> : <FaCaretRight />}
            </button>
            {isPricingDataOpen && (
              <ul className="dropdown">
                <li><Link to="/printer-list">Printing Price List</Link></li>
                <li><Link to="/stock-list">Stock Price List</Link></li>
                <li><Link to="/jumbo-xerox-list-admin">Jumbo Xerox List</Link></li>
              </ul>
            )}
          </li>

          <li className="dropdown-container">
            <button onClick={toggleRevenueData} className="dropdown-btn">
              Revenue Data {isRevenueDataOpen ? <FaCaretDown /> : <FaCaretRight />}
            </button>
            {isRevenueDataOpen && (
              <ul className="dropdown">
                <li><Link to="/display-printer-readings-admin">Printer Revenue List</Link></li>
                <li><Link to="/search-stock-list-admin">Stock Revenue List</Link></li>
              </ul>
            )}
          </li>
        </ul>
      </div>
      <div className="content">
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
