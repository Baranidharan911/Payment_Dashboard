import React, { useState, useEffect } from 'react';
import { db, auth } from '../../services/authservice'; 
import { collection, getDocs, query, where, getDoc, doc, updateDoc } from 'firebase/firestore';
import '../../styles/searchstock.css';
import { ToastContainer, toast } from 'react-toastify';

const SearchStockList = () => {
  const [date, setDate] = useState('');
  const [stocks, setStocks] = useState([]);
  const [branchName, setBranchName] = useState('');
  const [branches, setBranches] = useState([]);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = doc(db, 'users', user.uid);
        const userSnapshot = await getDoc(userDoc);
        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          if (userData.branch) {
            setBranches([userData.branch]);
            setBranchName(userData.branch);
          }
        }
      }
    };

    const fetchBranches = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const snapshot = await getDocs(usersCollection);
        const branchNames = [...new Set(snapshot.docs.map(doc => doc.data().branch).filter(branch => branch))];
        setBranches(branchNames);
      } catch (error) {
        toast.error('Failed to fetch branch names: ' + error.message);
      }
    };

    fetchUserData();
    fetchBranches();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      if (branchName && date) {
        const stockReadingsCollection = collection(db, 'stockReadings');
        const q = query(
          stockReadingsCollection, 
          where('date', '==', date),
          where('branchName', '==', branchName)
        );
        const stockSnapshot = await getDocs(q);
        const stockList = stockSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setStocks(stockList.length > 0 ? stockList[0].stocks : []);
        if (stockList.length === 0) {
          toast.info('No data found for the selected date.');
        }
      } else {
        toast.error('Please select a branch and a date.');
      }
    } catch (error) {
      toast.error('Failed to fetch stock data: ' + error.message);
    }
  };

  const handleInputChange = (index, field, value) => {
    const updatedStocks = stocks.map((stock, i) =>
      i === index ? { ...stock, [field]: field === 'amount' ? Number(value) : value } : stock
    );
    setStocks(updatedStocks);
  };

  const handleSave = async () => {
    if (!date || !branchName) {
      toast.error('Missing required fields to save stock details.');
      return;
    }

    try {
      const stockReadingData = {
        date,
        branchName,
        stocks,
      };
      const docRef = doc(db, 'stockReadings', `${branchName}_${date}`);
      await updateDoc(docRef, stockReadingData);
      setEditing(null);
      toast.success('Stock details updated successfully');
    } catch (error) {
      toast.error('Failed to update details: ' + error.message);
    }
  };

  const calculateTotalAmount = () => {
    return stocks.reduce((total, stock) => total + (stock.sold * stock.amount), 0);
  };

  return (
    <div className="search-stock-container">
      <ToastContainer />
      <h2>Stock Revenue List</h2>
      <form onSubmit={handleSearch}>
        <div className="form-group">
          <label>Branch Name</label>
          <select
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            required
          >
            <option value="" disabled hidden>Select Branch</option>
            {branches.map((branch, index) => (
              <option key={index} value={branch}>
                {branch}
              </option>
            ))}
          </select>
        </div>
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

      {branchName && date && (
        <table className="stock-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Items</th>
              <th>Opening Stock</th>
              <th>New Stock</th>
              <th>Closing Stock</th>
              <th>No of Sales</th>
              <th>Unit Price (₹)</th>
              <th>Total Amount(₹)</th>
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
                      placeholder="₹"
                    />
                  ) : (
                    `₹${stock.amount}`
                  )}
                </td>
                <td>
                  ₹{stock.sold * stock.amount}
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
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="7" style={{ textAlign: 'right', fontWeight: 'bold' }}>Grand Total:</td>
              <td colSpan="2" style={{ fontWeight: 'bold' }}>₹{calculateTotalAmount()}</td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
};

export default SearchStockList;
