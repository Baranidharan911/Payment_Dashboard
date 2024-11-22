import React, { useState, useEffect } from 'react';
import { db } from '../../services/authservice';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../../styles/jumboXerox.css';

const JumboXeroxList = () => {
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
        const usersCollection = collection(db, 'users');
        const snapshot = await getDocs(usersCollection);
        const branchNames = [...new Set(snapshot.docs.map(doc => doc.data().branch).filter(branch => branch && branch.trim() !== ''))];
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
        collection(db, 'jumboXeroxReadings'),
        where('branchName', '==', branchName),
        where('date', '==', date)
      );
      const querySnapshot = await getDocs(q);
      const readingsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        data.rows = data.rows.map(row => ({
          ...row,
          unitPrice: row.unitPrice || 0,
          amount: row.qty * (row.unitPrice || 0),
        }));
        return { id: doc.id, ...data };
      });
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
    if (field === 'qty' || field === 'unitPrice') {
      updatedReadings[readingIndex].rows[rowIndex].amount =
        updatedReadings[readingIndex].rows[rowIndex].qty *
        updatedReadings[readingIndex].rows[rowIndex].unitPrice;
    }
    setCurrentReadings(updatedReadings);
  };

  const handleJumboCounterChange = (readingIndex, field, value) => {
    const updatedReadings = [...currentReadings];
    updatedReadings[readingIndex].jumboCounter[field] = parseFloat(value);
    if (field === 'start' || field === 'end') {
      updatedReadings[readingIndex].jumboCounter.sftPrinted =
        updatedReadings[readingIndex].jumboCounter.end - updatedReadings[readingIndex].jumboCounter.start;
    }
    setCurrentReadings(updatedReadings);
  };

  const calculateTotals = (rows) => {
    return rows.reduce(
      (acc, row) => {
        acc.qty += row.qty;
        acc.amount += row.amount;
        return acc;
      },
      { qty: 0, amount: 0 }
    );
  };

  const handleSave = async (readingIndex) => {
    try {
      const reading = currentReadings[readingIndex];
      const totals = calculateTotals(reading.rows);
      await updateDoc(doc(db, 'jumboXeroxReadings', reading.id), {
        rows: reading.rows,
        totalQty: totals.qty,
        totalAmount: totals.amount,
        jumboCounter: reading.jumboCounter
      });
      toast.success('Jumbo Xerox details updated successfully');
      setEditing(false);
    } catch (error) {
      toast.error('Failed to update details: ' + error.message);
    }
  };

  return (
    <div className="jumbo-xerox-container">
      <ToastContainer />
      <form onSubmit={handleSearch}>
        <h2>Jumbo Xerox List</h2>
        <div className="form-group">
          <label>Branch Name</label>
          <select value={branchName} onChange={(e) => setBranchName(e.target.value)} required>
            <option value="" disabled>Select Branch</option>
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
                <th>Type</th>
                <th>Size</th>
                <th>QTY</th>
                <th>Unit Price (₹)</th>
                <th>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {reading.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td>{row.type}</td>
                  <td>{row.size}</td>
                  <td>
                    <input
                      type="number"
                      value={currentReadings[readingIndex].rows[rowIndex].qty}
                      onChange={(e) => handleInputChange(readingIndex, rowIndex, 'qty', e.target.value)}
                      disabled={!editing}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={currentReadings[readingIndex].rows[rowIndex].unitPrice}
                      onChange={(e) => handleInputChange(readingIndex, rowIndex, 'unitPrice', e.target.value)}
                      disabled={!editing}
                      placeholder="₹"
                    />
                  </td>
                  <td>
                    ₹{currentReadings[readingIndex].rows[rowIndex].amount}
                  </td>
                </tr>
              ))}
              <tr className="total-row">
                <td colSpan="4">Total</td> {/* Change colSpan to 4 to cover all previous columns */}
                <td>₹{calculateTotals(reading.rows).amount}</td>
              </tr>
            </tbody>
          </table>
          <h2>Jumbo Counter</h2>
          <table>
            <thead>
              <tr>
                <th>START</th>
                <th>END</th>
                <th>SFT PRINTED</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    value={currentReadings[readingIndex].jumboCounter.start}
                    onChange={(e) => handleJumboCounterChange(readingIndex, 'start', e.target.value)}
                    disabled={!editing}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    value={currentReadings[readingIndex].jumboCounter.end}
                    onChange={(e) => handleJumboCounterChange(readingIndex, 'end', e.target.value)}
                    disabled={!editing}
                  />
                </td>
                <td>{currentReadings[readingIndex].jumboCounter.sftPrinted}</td>
              </tr>
            </tbody>
          </table>
          <button onClick={() => setEditing(!editing)}>{editing ? 'Cancel' : 'Edit'}</button>
          {editing && <button onClick={() => handleSave(readingIndex)}>Save</button>}
        </div>
      ))}
    </div>
  );
};

export default JumboXeroxList;
