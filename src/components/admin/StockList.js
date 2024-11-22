import React, { useState, useEffect } from 'react';
import { db } from '../../services/authservice';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { FaRegArrowAltCircleLeft, FaRegArrowAltCircleRight } from 'react-icons/fa';
import '../../styles/stocklist.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const StockList = () => {
  const [stocks, setStocks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [branches, setBranches] = useState([]);
  const [branchName, setBranchName] = useState('');
  const stocksPerPage = 10;

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const snapshot = await getDocs(usersCollection);
        const branchNames = [...new Set(snapshot.docs.map(doc => doc.data().branch))].filter(Boolean);
        setBranches(branchNames);
      } catch (error) {
        toast.error('Failed to fetch branch names: ' + error.message);
      }
    };

    fetchBranches();
  }, []);

  useEffect(() => {
    const fetchStocks = async () => {
      if (branchName) {
        const stockCollection = collection(db, 'stocks');
        const stockSnapshot = await getDocs(stockCollection);
        const stockList = stockSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(stock => stock.branchName === branchName);
        setStocks(stockList);
      }
    };

    fetchStocks();
  }, [branchName]);

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
    setStocks(updatedStocks);
  };

  const handleSave = async (id) => {
    const stockToUpdate = stocks.find(stock => stock.id === id);
    try {
      await updateDoc(doc(db, 'stocks', id), stockToUpdate);
      setEditing(null);
      toast.success('Stock details updated successfully');
    } catch (error) {
      toast.error('Failed to update details: ' + error.message);
    }
  };

 

  return (
    <div className="stock-list-container">
      <h2>Stock Price List</h2>
      <div className="form-group">
        <label>Branch Name</label>
        <select value={branchName} onChange={(e) => setBranchName(e.target.value)} required>
          <option value="">Select Branch</option>
          {branches.map((branch, index) => (
            <option key={index} value={branch}>{branch}</option>
          ))}
        </select>
      </div>

      {branchName && (
        <>
          <table className="stock-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Items</th>
                <th>Unit Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentStocks.map((stock, index) => (
                <tr key={stock.id}>
                  <td>{indexOfFirstStock + index + 1}</td>
                  <td>
                    {editing === stock.id ? (
                      <input 
                        type="text" 
                        value={stock.itemName} 
                        onChange={(e) => handleInputChange(stock.id, 'itemName', e.target.value)} 
                      />
                    ) : (
                      stock.itemName
                    )}
                  </td>
                  <td>
                    ₹
                    {editing === stock.id ? (
                      <input 
                        type="number" 
                        value={stock.amount} 
                        onChange={(e) => handleInputChange(stock.id, 'amount', e.target.value)} 
                      />
                    ) : (
                      stock.amount
                    )}
                  </td>
                  <td>
                    {editing === stock.id ? (
                      <button onClick={() => handleSave(stock.id)}>Save</button>
                    ) : (
                      <button onClick={() => setEditing(stock.id)}>Edit</button>
                    )}
                  </td>
                </tr>
              ))}
           
            </tbody>
          </table>

          <div className="pagination">
            <FaRegArrowAltCircleLeft onClick={previousPage} className={currentPage === 1 ? 'disabled' : ''} />
            <span>{currentPage}</span>
            <FaRegArrowAltCircleRight onClick={nextPage} className={currentPage === Math.ceil(stocks.length / stocksPerPage) ? 'disabled' : ''} />
          </div>
        </>
      )}
    </div>
  );
};

export default StockList;
