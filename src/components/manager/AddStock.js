import React, { useState, useEffect } from 'react';
import { db, auth } from '../../services/authservice'; // Ensure authservice exports both db and auth
import { addDoc, collection, doc, getDoc } from 'firebase/firestore';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../../styles/addstock.css';

const AddStock = () => {
  const [branchName, setBranchName] = useState('');
  const [itemName, setItemName] = useState('');
  const [amount, setAmount] = useState('₹');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'stocks'), {
        userId,
        branchName,
        itemName,
        amount: Number(amount.replace('₹', '')), // Remove the ₹ symbol before saving
      });
      toast.success('Stock added successfully');
      setItemName('');
      setAmount('₹');
    } catch (error) {
      toast.error('Failed to add stock: ' + error.message);
    }
  };

  return (
    <div className="add-stock-container">
      <ToastContainer />
      <form onSubmit={handleSubmit}>
        <h2>Add Stock</h2>
        <div className="form-group">
          <label>Item Name</label>
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Amount</label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount('₹' + e.target.value.replace('₹', ''))}
            required
          />
        </div>
        <button type="submit">Add Stock</button>
      </form>
    </div>
  );
};

export default AddStock;
