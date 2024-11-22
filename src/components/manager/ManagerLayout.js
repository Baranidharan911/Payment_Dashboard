import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaCaretDown, FaCaretRight } from 'react-icons/fa';
import '../../styles/sidebar.css';

const ManagerLayout = ({ children }) => {
  const [isEnterDataOpen, setIsEnterDataOpen] = useState(false);
  const [isPricingDataOpen, setIsPricingDataOpen] = useState(false);
  const [isRevenueDataOpen, setIsRevenueDataOpen] = useState(false);

  const toggleEnterData = () => {
    setIsEnterDataOpen(!isEnterDataOpen);
    setIsPricingDataOpen(false); // Close other dropdowns
    setIsRevenueDataOpen(false);
  };

  const togglePricingData = () => {
    setIsPricingDataOpen(!isPricingDataOpen);
    setIsEnterDataOpen(false); // Close other dropdowns
    setIsRevenueDataOpen(false);
  };

  const toggleRevenueData = () => {
    setIsRevenueDataOpen(!isRevenueDataOpen);
    setIsEnterDataOpen(false); // Close other dropdowns
    setIsPricingDataOpen(false);
  };

  return (
    <div className="layout">
      <div className="sidebar">
        <h2>Manager Dashboard</h2>
        <ul>
          <li><Link to="/manager-dashboard">Dashboard</Link></li>
          
          <li className="dropdown-container">
            <button onClick={toggleEnterData} className="dropdown-btn">
              Enter Data {isEnterDataOpen ? <FaCaretDown /> : <FaCaretRight />}
            </button>
            {isEnterDataOpen && (
              <ul className="dropdown">
                <li><Link to="/add-printer-manager">Add Printer</Link></li>
                <li><Link to="/printer-readings-manager">Add Printer Readings</Link></li>
                <li><Link to="/jumbo-xerox">Add Jumbo Xerox Readings</Link></li>
                <li><Link to="/add-stock-manager">Add Stock</Link></li>
                <li><Link to="/stock-list-manager">Add Stock Readings</Link></li>
                <li><Link to="/total-amount-display">Add Total Amount Readings</Link></li>
              </ul>
            )}
          </li>

          <li className="dropdown-container">
            <button onClick={togglePricingData} className="dropdown-btn">
              Pricing Data {isPricingDataOpen ? <FaCaretDown /> : <FaCaretRight />}
            </button>
            {isPricingDataOpen && (
              <ul className="dropdown">
                <li><Link to="/printer-list-manager">Printing Price List</Link></li>
                <li><Link to="/stock-item-list-manager">Stock Price List</Link></li>
                <li><Link to="/jumbo-xerox-list-manager">Jumbo Xerox List</Link></li>
              </ul>
            )}
          </li>

          <li className="dropdown-container">
            <button onClick={toggleRevenueData} className="dropdown-btn">
              Revenue Data {isRevenueDataOpen ? <FaCaretDown /> : <FaCaretRight />}
            </button>
            {isRevenueDataOpen && (
              <ul className="dropdown">
                <li><Link to="/display-printer-readings-manager">Printer Revenue List</Link></li>
                <li><Link to="/search-stock-list-manager">Stock Revenue List</Link></li>
                <li><Link to="/total-amount-list-manager">Total Revenue List</Link></li>
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

export default ManagerLayout;
