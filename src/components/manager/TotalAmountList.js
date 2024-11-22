import React, { useState, useEffect } from 'react';
import { db, auth } from '../../services/authservice'; // Ensure authservice exports both db and auth
import { collection, getDocs, query, where, updateDoc, doc, getDoc } from 'firebase/firestore';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../../styles/totalAmountDisplay.css';

const TotalAmountList = () => {
  const [date, setDate] = useState('');
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [currentReadings, setCurrentReadings] = useState([]);
  const [branchName, setBranchName] = useState('');
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        setUserId(user.uid); // Set the user ID
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
    setLoading(true);
    try {
      let q;
      const readingsCollection = collection(db, 'totalAmountReadings');

      if (branchName && userId && date) {
        q = query(
          readingsCollection,
          where('date', '==', date),
          where('branchName', '==', branchName)
        );
      } else if (userId && date) {
        q = query(readingsCollection, where('date', '==', date), where('userId', '==', userId));
      } else if (branchName && date) {
        q = query(readingsCollection, where('date', '==', date), where('branchName', '==', branchName));
      } else {
        toast.error('Please select a date.');
        setLoading(false);
        return;
      }

      const querySnapshot = await getDocs(q);
      const readingsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReadings(readingsData);
      setCurrentReadings(readingsData);
      setLoading(false);
      if (readingsData.length === 0) {
        toast.info('No data found for the selected date.');
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
