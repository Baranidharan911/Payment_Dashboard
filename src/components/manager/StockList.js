import React, { useState, useEffect } from 'react';
import { db, auth } from '../../services/authservice';
import { collection, getDocs, doc, getDoc, query, where, setDoc } from 'firebase/firestore';
import { FaRegArrowAltCircleLeft, FaRegArrowAltCircleRight } from 'react-icons/fa';
import '../../styles/stocklist.css';
import { toast, ToastContainer } from 'react-toastify';

const StockList = () => {
  const [stocks, setStocks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [date, setDate] = useState('');
  const [branchName, setBranchName] = useState('');
  const [userId, setUserId] = useState(null);
  const stocksPerPage = 10;

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

    const fetchStocks = async () => {
      if (branchName && userId) {
        const stockCollection = collection(db, 'stocks');
        const q = query(stockCollection, where('branchName', '==', branchName), where('userId', '==', userId));
        const stockSnapshot = await getDocs(q);
        const stockList = stockSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setStocks(stockList);
      }
    };

    fetchUserData().then(fetchStocks);
  }, [branchName, userId]);

  useEffect(() => {
    const fetchPreviousClosingStock = async () => {
      if (date && branchName) {
        const previousDate = new Date(date);
        previousDate.setDate(previousDate.getDate() - 1);
        const formattedPreviousDate = previousDate.toISOString().split('T')[0];

        const docRef = doc(db, 'stockReadings', `${branchName}_${formattedPreviousDate}_${userId}`);
        const docSnapshot = await getDoc(docRef);

        if (docSnapshot.exists()) {
          const previousData = docSnapshot.data();
          setStocks(prevStocks =>
            prevStocks.map(stock => {
              const previousStock = previousData.stocks.find(s => s.itemName === stock.itemName);
              return previousStock
                ? { ...stock, openingStock: previousStock.closingStock }
                : stock;
            })
          );
        }
      }
    };

    fetchPreviousClosingStock();
  }, [date, branchName, userId]);

  const indexOfLastStock = currentPage * stocksPerPage;
  const indexOfFirstStock = indexOfLastStock - stocksPerPage;
  const currentStocks = stocks.slice(indexOfFirstStock, indexOfLastStock);

  const nextPage = () => {
    if (currentPage < Math.ceil(stocks.length / stocksPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };

  const previousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleInputChange = (id, field, value) => {
    const updatedStocks = stocks.map(stock =>
      stock.id === id ? { ...stock, [field]: Number(value) } : stock
    );

    // Automatically calculate closing stock
    const updatedStocksWithClosing = updatedStocks.map(stock =>
      stock.id === id && (field === 'openingStock' || field === 'addedStock' || field === 'sold')
        ? { ...stock, closingStock: (Number(stock.openingStock) + Number(stock.addedStock)) - Number(stock.sold) }
        : stock
    );

    setStocks(updatedStocksWithClosing);
  };

  const calculateTotalAmount = () => {
    return stocks.reduce((total, stock) => total + ((Number(stock.sold) || 0) * (Number(stock.amount) || 0)), 0);
  };

  const handleSaveReading = async () => {
    if (!date) {
      toast.error('Please select a date.');
      return;
    }

    const docRef = doc(db, 'stockReadings', `${branchName}_${date}_${userId}`);
    const docSnapshot = await getDoc(docRef);

    if (docSnapshot.exists()) {
      toast.error('You already entered the data for this date. Please check the stock search page.');
      return;
    }

    const stockReadingData = {
      date,
      branchName,
      userId,
      stocks: stocks.map(stock => ({
        itemName: stock.itemName,
        openingStock: stock.openingStock,
        addedStock: stock.addedStock,
        closingStock: stock.closingStock,
        sold: stock.sold,
        amount: stock.amount,
        totalPrice: Number(stock.sold) * Number(stock.amount),  // Storing total price for each item
      })),
      totalAmount: calculateTotalAmount(), // Storing the total amount
    };

    try {
      // Save the current reading in the stockReadings collection
      await setDoc(docRef, stockReadingData);
      toast.success('Stock reading saved successfully');

      // Clear input fields
      setDate('');
      setStocks(stocks.map(stock => ({
        ...stock,
        openingStock: '',
        addedStock: '',
        closingStock: '',
        sold: '',
      })));
    } catch (error) {
      toast.error('Failed to save stock reading: ' + error.message);
    }
  };

  const totalAmount = calculateTotalAmount();

  return (
    <div className="stock-list-container">
      <ToastContainer />
      <h2>Add Stock Readings</h2>
      <div className="date-container">
        <label>Date:</label>
        <input 
          type="date" 
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>
      <table className="stock-table">
        <thead>
          <tr>
            <th>S.No</th>
            <th>Items</th>
            <th>Opening Stock</th>
            <th>New Stock</th>
            <th>Closing Stock</th>
            <th>No Of Sales</th>
            <th>Unit Price(₹)</th>
            <th>Total Amount(₹)</th>
          </tr>
        </thead>
        <tbody>
          {currentStocks.map((stock, index) => (
            <tr key={stock.id}>
              <td>{indexOfFirstStock + index + 1}</td>
              <td>
                <input 
                  type="text" 
                  value={stock.itemName} 
                  onChange={(e) => handleInputChange(stock.id, 'itemName', e.target.value)} 
                  disabled // Disable editing of item name to keep it constant across dates
                />
              </td>
              <td>
                <input 
                  type="number" 
                  value={stock.openingStock} 
                  onChange={(e) => handleInputChange(stock.id, 'openingStock', e.target.value)} 
                />
              </td>
              <td>
                <input 
                  type="number" 
                  value={stock.addedStock} 
                  onChange={(e) => handleInputChange(stock.id, 'addedStock', e.target.value)} 
                />
              </td>
              <td>
                <input 
                  type="number" 
                  value={stock.closingStock} 
                  onChange={(e) => handleInputChange(stock.id, 'closingStock', e.target.value)} 
                  disabled // Automatically calculated, so disable editing
                />
              </td>
              <td>
                <input 
                  type="number" 
                  value={stock.sold} 
                  onChange={(e) => handleInputChange(stock.id, 'sold', e.target.value)} 
                />
              </td>
              <td>
                ₹
                <input 
                  type="number" 
                  value={stock.amount} 
                  onChange={(e) => handleInputChange(stock.id, 'amount', e.target.value)} 
                  disabled // Disable editing of amount to keep it constant across dates
                />
              </td>
              <td>
                ₹{Number(stock.sold) * Number(stock.amount)}
              </td>
            </tr>
          ))}
          <tr>
            <td colSpan="7" style={{ textAlign: 'right', fontWeight: 'bold' }}>Grand Total:</td>
            <td style={{ fontWeight: 'bold' }}>₹{totalAmount}</td>
          </tr>
        </tbody>
      </table>
      <div className="pagination">
        <FaRegArrowAltCircleLeft onClick={previousPage} className={currentPage === 1 ? 'disabled' : ''} />
        <span>{currentPage}</span>
        <FaRegArrowAltCircleRight onClick={nextPage} className={currentPage === Math.ceil(stocks.length / stocksPerPage) ? 'disabled' : ''} />
      </div>
      <button onClick={handleSaveReading}>Save Reading</button>
    </div>
  );
};

export default StockList;
