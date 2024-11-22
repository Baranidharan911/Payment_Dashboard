import React, { useState } from 'react';
import { db } from '../../services/authservice';
import { addDoc, collection } from 'firebase/firestore';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../../styles/addstock.css';

const AddStock = () => {
  const [itemName, setItemName] = useState('');
  const [openingStock, setOpeningStock] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'stocks'), {
        itemName,
        openingStock: Number(openingStock),
        amount: Number(amount),
      });
      toast.success('Stock added successfully');
      setItemName('');
      setOpeningStock('');
      setAmount('');
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
          <label>Opening Stock</label>
          <input
            type="number"
            value={openingStock}
            onChange={(e) => setOpeningStock(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <button type="submit">Add Stock</button>
      </form>
    </div>
  );
};

export default AddStock;
