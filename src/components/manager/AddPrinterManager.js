import React, { useState, useEffect } from 'react';
import { db, auth } from '../../services/authservice'; // Ensure authservice exports both db and auth
import { addDoc, collection, doc, getDoc } from 'firebase/firestore';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../../styles/addprinter.css';

const AddPrinterManager = () => {
  const [branchName, setBranchName] = useState('');
  const [printerId, setPrinterId] = useState('');
  const [printerName, setPrinterName] = useState('');
  const [sizes, setSizes] = useState([]);
  const [totalLargePrice, setTotalLargePrice] = useState('');
  const [totalSmallPrice, setTotalSmallPrice] = useState('');
  const [bwScanPrice, setBwScanPrice] = useState('');
  const [colourScanPrice, setColourScanPrice] = useState('');
  const [longSheetPrice, setLongSheetPrice] = useState('');
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

  const handleSizeChange = (e) => {
    const { value, checked } = e.target;
    setSizes((prevSizes) => {
      if (checked) {
        return [...prevSizes, value];
      } else {
        return prevSizes.filter((size) => size !== value);
      }
    });
  };

  const handlePriceChange = (e, size) => {
    const newPrice = e.target.value;
    switch (size) {
      case 'Total Large':
        setTotalLargePrice(newPrice);
        break;
      case 'Total Small':
        setTotalSmallPrice(newPrice);
        break;
      case 'B/W Scan':
        setBwScanPrice(newPrice);
        break;
      case 'Colour Scan':
        setColourScanPrice(newPrice);
        break;
      case 'Long Sheet':
        setLongSheetPrice(newPrice);
        break;
      default:
        break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const prices = [];
      if (totalLargePrice) {
        prices.push({ size: 'Total Large', price: Number(totalLargePrice) });
      }
      if (totalSmallPrice) {
        prices.push({ size: 'Total Small', price: Number(totalSmallPrice) });
      }
      if (bwScanPrice) {
        prices.push({ size: 'B/W Scan', price: Number(bwScanPrice) });
      }
      if (colourScanPrice) {
        prices.push({ size: 'Colour Scan', price: Number(colourScanPrice) });
      }
      if (longSheetPrice) {
        prices.push({ size: 'Long Sheet', price: Number(longSheetPrice) });
      }

      await addDoc(collection(db, 'printers'), {
        userId,
        branchName,
        printerId,
        printerName,
        prices,
      });
      toast.success('Printer added successfully');
      setPrinterId('');
      setPrinterName('');
      setSizes([]);
      setTotalLargePrice('');
      setTotalSmallPrice('');
      setBwScanPrice('');
      setColourScanPrice('');
      setLongSheetPrice('');
    } catch (error) {
      toast.error('Failed to add printer: ' + error.message);
      console.error('Error adding printer: ', error);
    }
  };

  const renderPriceInputs = () => {
    return (
      <>
        {sizes.includes('Total Large') && (
          <div className="form-group">
            <label>Total Large Price</label>
            <input
              type="number"
              value={totalLargePrice}
              onChange={(e) => handlePriceChange(e, 'Total Large')}
              required
            />
          </div>
        )}
        {sizes.includes('Total Small') && (
          <div className="form-group">
            <label>Total Small Price</label>
            <input
              type="number"
              value={totalSmallPrice}
              onChange={(e) => handlePriceChange(e, 'Total Small')}
              required
            />
          </div>
        )}
        {sizes.includes('B/W Scan') && (
          <div className="form-group">
            <label>B/W Scan Price</label>
            <input
              type="number"
              value={bwScanPrice}
              onChange={(e) => handlePriceChange(e, 'B/W Scan')}
              required
            />
          </div>
        )}
        {sizes.includes('Colour Scan') && (
          <div className="form-group">
            <label>Colour Scan Price</label>
            <input
              type="number"
              value={colourScanPrice}
              onChange={(e) => handlePriceChange(e, 'Colour Scan')}
              required
            />
          </div>
        )}
        {sizes.includes('Long Sheet') && (
          <div className="form-group">
            <label>Long Sheet Price</label>
            <input
              type="number"
              value={longSheetPrice}
              onChange={(e) => handlePriceChange(e, 'Long Sheet')}
              required
            />
          </div>
        )}
      </>
    );
  };

  return (
    <div className="add-printer-container">
      <ToastContainer />
      <form onSubmit={handleSubmit}>
        <h2>Add Printer</h2>
        <div className="form-group">
          <label>Printer ID</label>
          <input
            type="text"
            value={printerId}
            onChange={(e) => setPrinterId(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Printer Name</label>
          <input
            type="text"
            value={printerName}
            onChange={(e) => setPrinterName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Sizes</label>
          <div className="size-checkboxes">
            <div>
              <input
                type="checkbox"
                value="Total Large"
                onChange={handleSizeChange}
                checked={sizes.includes('Total Large')}
              />
              <label>Total Large</label>
            </div>
            <div>
              <input
                type="checkbox"
                value="Total Small"
                onChange={handleSizeChange}
                checked={sizes.includes('Total Small')}
              />
              <label>Total Small</label>
            </div>
            <div>
              <input
                type="checkbox"
                value="B/W Scan"
                onChange={handleSizeChange}
                checked={sizes.includes('B/W Scan')}
              />
              <label>B/W Scan</label>
            </div>
            <div>
              <input
                type="checkbox"
                value="Colour Scan"
                onChange={handleSizeChange}
                checked={sizes.includes('Colour Scan')}
              />
              <label>Colour Scan</label>
            </div>
            <div>
              <input
                type="checkbox"
                value="Long Sheet"
                onChange={handleSizeChange}
                checked={sizes.includes('Long Sheet')}
              />
              <label>Long Sheet</label>
            </div>
          </div>
        </div>
        {renderPriceInputs()}
        <button type="submit">Add Printer</button>
      </form>
    </div>
  );
};

export default AddPrinterManager;
