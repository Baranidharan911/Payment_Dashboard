import React, { useState, useEffect } from 'react';
import { db, auth } from '../../services/authservice'; 
import { collection, getDocs, query, where, getDoc, doc, updateDoc } from 'firebase/firestore';
import '../../styles/searchstock.css';
import { ToastContainer, toast } from 'react-toastify';

const SearchStockList = () => {
  const [date, setDate] = useState('');
  const [stocks, setStocks] = useState([]);
  const [branchName, setBranchName] = useState('');
  const [userId, setUserId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        setUserId(user.uid);
        const userDoc = doc(db, 'users', user.uid);
        const userSnapshot = await getDoc(userDoc);
        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          setBranchName(userData.branch);
        } else {
          toast.error('User document does not exist.');
        }
      } else {
        toast.error('No user is currently logged in.');
      }
    };

    fetchUserData();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      if ((branchName || userId) && date) {
        const stockReadingsCollection = collection(db, 'stockReadings');
        const q = query(
          stockReadingsCollection, 
          where('date', '==', date),
          branchName ? where('branchName', '==', branchName) : where('userId', '==', userId)
        );
        const stockSnapshot = await getDocs(q);
        const stockList = stockSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        const stocksData = stockList.length > 0 ? stockList[0].stocks : [];
        setStocks(stocksData);
        calculateTotalAmount(stocksData);
        if (stockList.length === 0) {
          toast.info('No data found for the selected date.');
        }
      } else {
        toast.error('Please select a date.');
      }
    } catch (error) {
      toast.error('Failed to fetch stock data: ' + error.message);
    }
  };

  const handleInputChange = (index, field, value) => {
    const updatedStocks = stocks.map((stock, i) =>
      i === index ? { ...stock, [field]: field === 'amount' || field === 'price' ? Number(value) : value } : stock
    );
    setStocks(updatedStocks);
    calculateTotalAmount(updatedStocks);
  };

  const calculateTotalAmount = (stocksData) => {
    const total = stocksData.reduce((acc, stock) => {
      return acc + (stock.sold * stock.amount);
    }, 0);
    setTotalAmount(total);
  };

  const handleSave = async () => {
    if (!date || !branchName || !userId) {
      toast.error('Missing required fields to save stock details.');
      return;
    }

    try {
      const stockReadingData = {
        date,
        branchName,
        userId,
        stocks,
      };
      const docRef = doc(db, 'stockReadings', `${branchName}_${date}_${userId}`);
      await updateDoc(docRef, stockReadingData);
      setEditing(null);
      toast.success('Stock details updated successfully');
    } catch (error) {
      toast.error('Failed to update details: ' + error.message);
    }
  };

  return (
    <div className="search-stock-container">
      <ToastContainer />
      <h2>Stock Revenue List</h2>
      <form onSubmit={handleSearch}>
        <div className="form-group">
          <label>Date</label>
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <button type="submit">Search</button>
      </form>
      <table className="stock-table">
        <thead>
          <tr>
            <th>S.No</th>
            <th>Items</th>
            <th>Opening Stock</th>
            <th>New Stock</th>
            <th>Closing Stock</th>
            <th>No Of Sales</th>
            <th>Unit Price (₹)</th>
            <th>Total Amount (₹)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>
                {editing === index ? (
                  <input 
                    type="text" 
                    value={stock.itemName} 
                    onChange={(e) => handleInputChange(index, 'itemName', e.target.value)} 
                  />
                ) : (
                  stock.itemName
                )}
              </td>
              <td>
                {editing === index ? (
                  <input 
                    type="number" 
                    value={stock.openingStock} 
                    onChange={(e) => handleInputChange(index, 'openingStock', e.target.value)} 
                  />
                ) : (
                  stock.openingStock
                )}
              </td>
              <td>
                {editing === index ? (
                  <input 
                    type="number" 
                    value={stock.addedStock} 
                    onChange={(e) => handleInputChange(index, 'addedStock', e.target.value)} 
                  />
                ) : (
                  stock.addedStock
                )}
              </td>
              <td>
                {editing === index ? (
                  <input 
                    type="number" 
                    value={stock.closingStock} 
                    onChange={(e) => handleInputChange(index, 'closingStock', e.target.value)} 
                  />
                ) : (
                  stock.closingStock
                )}
              </td>
              <td>
                {editing === index ? (
                  <input 
                    type="number" 
                    value={stock.sold} 
                    onChange={(e) => handleInputChange(index, 'sold', e.target.value)} 
                  />
                ) : (
                  stock.sold
                )}
              </td>
              
              <td>
                {editing === index ? (
                  <input 
                    type="number" 
                    value={stock.amount} 
                    onChange={(e) => handleInputChange(index, 'amount', e.target.value)} 
                  />
                ) : (
                  `₹${stock.amount}`
                )}
              </td>
              <td>
                {`₹${stock.sold * stock.amount}`}
              </td>
              <td>
                {editing === index ? (
                  <button onClick={handleSave}>Save</button>
                ) : (
                  <button onClick={() => setEditing(index)}>Edit</button>
                )}
              </td>
            </tr>
          ))}
          <tr>
            <td colSpan="7" style={{ textAlign: 'right', fontWeight: 'bold' }}>Grand Total:</td>
            <td colSpan="2" style={{ fontWeight: 'bold' }}>₹{totalAmount}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default SearchStockList;
