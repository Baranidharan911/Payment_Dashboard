import React, { useState, useEffect } from 'react';
import { db } from '../../services/authservice';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../../styles/totalAmountDisplay.css';

const TotalAmountList = () => {
  const [branches, setBranches] = useState([]);
  const [branchName, setBranchName] = useState('');
  const [date, setDate] = useState('');
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [currentReadings, setCurrentReadings] = useState([]);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const readingsCollection = collection(db, 'totalAmountReadings');
        const snapshot = await getDocs(readingsCollection);
        const branchNames = [...new Set(snapshot.docs.map(doc => doc.data().branchName))];
        setBranches(branchNames);
      } catch (error) {
        toast.error('Failed to fetch branch names: ' + error.message);
      }
    };

    fetchBranches();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const q = query(
        collection(db, 'totalAmountReadings'),
        where('branchName', '==', branchName),
        where('date', '==', date)
      );
      const querySnapshot = await getDocs(q);
      const readingsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReadings(readingsData);
      setCurrentReadings(readingsData);
      setLoading(false);
      if (readingsData.length === 0) {
        toast.info('No data found for the selected branch and date.');
      }
    } catch (error) {
      toast.error('Failed to fetch readings: ' + error.message);
      setLoading(false);
    }
  };

  const handleInputChange = (readingIndex, rowIndex, field, value) => {
    const updatedReadings = [...currentReadings];
    updatedReadings[readingIndex].rows[rowIndex][field] = Number(value);
    setCurrentReadings(updatedReadings);
  };

  const handleSave = async (readingIndex) => {
    try {
      const reading = currentReadings[readingIndex];
      await updateDoc(doc(db, 'totalAmountReadings', reading.id), {
        rows: reading.rows
      });
      toast.success('Total Amount details updated successfully');
      setEditing(false);
    } catch (error) {
      toast.error('Failed to update details: ' + error.message);
    }
  };

  const calculateTotalAmount = () => {
    return currentReadings.reduce((total, reading) => {
      return total + reading.rows.reduce((rowTotal, row) => {
        return rowTotal + row.amount;
      }, 0);
    }, 0);
  };

  return (
    <div className="total-amount-container">
      <ToastContainer />
      <form onSubmit={handleSearch}>
        <h2>Total Revenue List</h2>
        <div className="form-group">
          <label>Branch Name</label>
          <select value={branchName} onChange={(e) => setBranchName(e.target.value)} required>
            <option value="">Select Branch</option>
            {branches.map((branch, index) => (
              <option key={index} value={branch}>{branch}</option>
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
        <button type="submit" disabled={loading}>Search</button>
      </form>
      {readings.map((reading, readingIndex) => (
        <div key={reading.id} className="reading-section">
          <h3>Branch: {reading.branchName}, Date: {reading.date}</h3>
          <table>
            <thead>
              <tr>
                <th>Items</th>
                <th>Total Amount(₹)</th>
              </tr>
            </thead>
            <tbody>
              {reading.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td>{row.itemName}</td>
                  <td>
                    <input
                      type="number"
                      value={currentReadings[readingIndex].rows[rowIndex].amount}
                      onChange={(e) => handleInputChange(readingIndex, rowIndex, 'amount', e.target.value)}
                      disabled={!editing}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="total-amount">
            <strong>Grand Total: ₹{calculateTotalAmount()}</strong>
          </div>
          <button onClick={() => setEditing(!editing)}>{editing ? 'Cancel' : 'Edit'}</button>
          {editing && <button onClick={() => handleSave(readingIndex)}>Save</button>}
        </div>
      ))}
    </div>
  );
};

export default TotalAmountList;
