import React, { useState, useEffect } from 'react';
import { db, auth } from '../../services/authservice'; // Ensure authservice exports both db and auth
import { addDoc, collection, doc, getDoc } from 'firebase/firestore';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../../styles/jumboXerox.css';

const JumboXerox = () => {
  const [rows, setRows] = useState([
    { type: 'COLOUR', size: 'A0', qty: 0, unitPrice: 0, amount: 0 },
    { type: 'COLOUR', size: 'A1', qty: 0, unitPrice: 0, amount: 0 },
    { type: 'COLOUR', size: 'A2', qty: 0, unitPrice: 0, amount: 0 },
    { type: 'B/W', size: 'A0', qty: 0, unitPrice: 0, amount: 0 },
    { type: 'B/W', size: 'A1', qty: 0, unitPrice: 0, amount: 0 },
    { type: 'B/W', size: 'A2', qty: 0, unitPrice: 0, amount: 0 },
    { type: 'SCAN', size: 'A0', qty: 0, unitPrice: 0, amount: 0 },
    { type: 'SCAN', size: 'A1', qty: 0, unitPrice: 0, amount: 0 },
    { type: 'SCAN', size: 'A2', qty: 0, unitPrice: 0, amount: 0 },
  ]);
  const [date, setDate] = useState('');
  const [jumboCounter, setJumboCounter] = useState({ start: 0, end: 0, sftPrinted: 0 });
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

  const handleInputChange = (index, field, value) => {
    const updatedRows = [...rows];
    updatedRows[index][field] = Number(value);
    if (field === 'qty' || field === 'unitPrice') {
      updatedRows[index].amount = updatedRows[index].qty * updatedRows[index].unitPrice;
    }
    setRows(updatedRows);
  };

  const handleJumboCounterChange = (field, value) => {
    const updatedCounter = { ...jumboCounter, [field]: parseFloat(value) };
    if (field === 'start' || field === 'end') {
      updatedCounter.sftPrinted = updatedCounter.end - updatedCounter.start;
    }
    setJumboCounter(updatedCounter);
  };

  const calculateTotals = () => {
    const totals = rows.reduce(
      (acc, row) => {
        acc.qty += row.qty;
        acc.amount += row.amount;
        return acc;
      },
      { qty: 0, amount: 0 }
    );
    return totals;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      toast.error('User is not authenticated.');
      return;
    }
    const totals = calculateTotals();
    try {
      await addDoc(collection(db, 'jumboXeroxReadings'), {
        userId,
        branchName,
        date,
        rows,
        totalQty: totals.qty,
        totalAmount: totals.amount,
        jumboCounter,
        timestamp: new Date()
      });
      toast.success('Jumbo Xerox details saved successfully');
    } catch (error) {
      toast.error('Failed to save details: ' + error.message);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="jumbo-xerox-container">
      <ToastContainer />
      <form onSubmit={handleSubmit}>
        <h2>Add Jumbo Xerox Readings</h2>
        <div className="form-group">
          <label>Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Size</th>
              <th>Quantity</th>
              <th>Unit Price (₹)</th>
              <th>Total Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td>{row.type}</td>
                <td>{row.size}</td>
                <td>
                  <input
                    type="number"
                    value={row.qty}
                    onChange={(e) => handleInputChange(index, 'qty', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={row.unitPrice}
                    onChange={(e) => handleInputChange(index, 'unitPrice', e.target.value)}
                  />
                </td>
                <td>
                  {`₹${row.amount}`}
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan="4">Grand Total</td> {/* Updated colSpan to cover the entire row */}
              <td>{`₹${totals.amount}`}</td>
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
                  value={jumboCounter.start}
                  onChange={(e) => handleJumboCounterChange('start', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="number"
                  step="0.01"
                  value={jumboCounter.end}
                  onChange={(e) => handleJumboCounterChange('end', e.target.value)}
                />
              </td>
              <td>{jumboCounter.sftPrinted}</td>
            </tr>
          </tbody>
        </table>
        <button type="submit">Save Details</button>
      </form>
    </div>
  );
};

export default JumboXerox;
