import React, { useState, useEffect } from 'react';
import { db, auth } from '../../services/authservice'; // Ensure authservice exports both db and auth
import { addDoc, collection, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../../styles/totalAmountDisplay.css';

const TotalAmountDisplay = () => {
  const [rows, setRows] = useState([
    { itemName: 'Canon 8986', amount: '₹0' },
    { itemName: 'Toshiba 8518', amount: '₹0' },
    { itemName: ' Canon V700', amount: '₹0' },
    { itemName: 'Jumbo Xerox', amount: '₹0' },
    { itemName: 'Stocks', amount: '₹0' },
    { itemName: 'DNP Photo Printing', amount: '₹0' },
    { itemName: 'Digital Business', amount: '₹0' },
    { itemName: 'Gift Business', amount: '₹0' },
    { itemName: 'Mimaki Bsusiness', amount: '₹0' },
    { itemName: 'Total Business', amount: '₹0' },
    { itemName: 'Discount', amount: '₹0' },
    { itemName: 'Paytm QR & Card Mchine', amount: '₹0' },
    { itemName: 'Expense', amount: '₹0' },
    { itemName: 'Cash As Per Accounts', amount: '₹0' },
    { itemName: 'Cash In Hand', amount: '₹0' }
  ]);
  const [date, setDate] = useState('');
  const [branchName, setBranchName] = useState('');
  const [userId, setUserId] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);

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

  useEffect(() => {
    const calculateTotalAmount = () => {
      const total = rows.reduce((acc, row) => acc + Number(row.amount.replace('₹', '')), 0);
      setTotalAmount(total);
    };

    calculateTotalAmount();
  }, [rows]);

  const handleInputChange = (index, value) => {
    const updatedRows = [...rows];
    updatedRows[index].amount = `₹${value.replace(/₹/g, '')}`;
    setRows(updatedRows);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser; // Get the authenticated user
    if (!user) {
      toast.error('User is not authenticated.');
      return;
    }

    // Check if there is already data for the selected date
    const querySnapshot = await getDocs(
      query(
        collection(db, 'totalAmountReadings'),
        where('userId', '==', user.uid),
        where('branchName', '==', branchName),
        where('date', '==', date)
      )
    );

    if (!querySnapshot.empty) {
      toast.error(`Data for ${date} has already been entered.`);
      return;
    }

    try {
      await addDoc(collection(db, 'totalAmountReadings'), {
        userId,
        branchName,
        date,
        rows,
        totalAmount, // Include total amount in the document
        timestamp: new Date()
      });
      toast.success('Amounts saved successfully');
    } catch (error) {
      toast.error('Failed to save amounts: ' + error.message);
    }
  };

  return (
    <div className="total-amount-container">
      <ToastContainer />
      <form onSubmit={handleSubmit}>
        <h2>Add Total Amount Readings</h2>
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
              <th>Items</th>
              <th>Total Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td>{row.itemName}</td>
                <td>
                  <input
                    type="text"
                    value={row.amount}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="total-amount">
          <h3>Grand Total: ₹{totalAmount}</h3>
        </div>
        <button type="submit">Save Amounts</button>
      </form>
    </div>
  );
};

export default TotalAmountDisplay;
