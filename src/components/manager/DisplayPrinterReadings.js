import React, { useState, useEffect } from 'react';
import { db, auth } from '../../services/authservice'; // Ensure authservice exports both db and auth
import { collection, getDocs, query, where, updateDoc, doc, getDoc } from 'firebase/firestore';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../../styles/printerreadings.css';

const DisplayPrinterReadingsManager = () => {
  const [date, setDate] = useState('');
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedValues, setEditedValues] = useState({});
  const [branchName, setBranchName] = useState('');
  const [userId, setUserId] = useState(null);
  const [printers, setPrinters] = useState([]);

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
    const fetchPrinters = async () => {
      if (branchName || userId) {
        let printerCollection = collection(db, 'printers');
        let q;
        if (branchName) {
          q = query(printerCollection, where('branchName', '==', branchName));
        } else {
          q = query(printerCollection, where('userId', '==', userId));
        }
        const printerSnapshot = await getDocs(q);
        const printerList = printerSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPrinters(printerList);
      }
    };

    fetchPrinters();
  }, [branchName, userId]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let q;
      const readingsCollection = collection(db, 'printerReadings');

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
      setLoading(false);
      if (readingsData.length === 0) {
        toast.info('No data found for the selected date.');
      }
    } catch (error) {
      toast.error('Failed to fetch readings: ' + error.message);
      setLoading(false);
    }
  };

  const handleEditChange = (readingId, printerId, size, field, value) => {
    setEditedValues(prevValues => {
      const updatedValues = { ...prevValues };
      if (!updatedValues[readingId]) {
        updatedValues[readingId] = {};
      }
      if (!updatedValues[readingId][printerId]) {
        updatedValues[readingId][printerId] = {};
      }
      if (!updatedValues[readingId][printerId][size]) {
        updatedValues[readingId][printerId][size] = {};
      }
      updatedValues[readingId][printerId][size][field] = Number(value);

      const finalReading = updatedValues[readingId][printerId][size].finalReading || 0;
      const starting = updatedValues[readingId][printerId][size].starting || 0;
      const noOfCopies = finalReading - starting;
      const price = getPrice(printerId, size);
      const total = noOfCopies * price;

      updatedValues[readingId][printerId][size].noOfCopies = noOfCopies;
      updatedValues[readingId][printerId][size].total = total;

      return updatedValues;
    });
  };

  const applyEdits = (reading) => {
    const updatedReadings = { ...reading.readings };
    for (const printerId in editedValues[reading.id]) {
      for (const size in editedValues[reading.id][printerId]) {
        if (editedValues[reading.id][printerId][size].finalReading !== undefined) {
          updatedReadings[printerId][size].finalReading = editedValues[reading.id][printerId][size].finalReading;
        }
        if (editedValues[reading.id][printerId][size].starting !== undefined) {
          updatedReadings[printerId][size].starting = editedValues[reading.id][printerId][size].starting;
        }
        const finalReading = updatedReadings[printerId][size].finalReading || 0;
        const starting = updatedReadings[printerId][size].starting || 0;
        updatedReadings[printerId][size].noOfCopies = finalReading - starting;
        updatedReadings[printerId][size].total = updatedReadings[printerId][size].noOfCopies * getPrice(printerId, size);
      }
    }
    return updatedReadings;
  };

  const saveChanges = async () => {
    try {
      const updatedReadings = readings.map(reading => ({
        ...reading,
        readings: applyEdits(reading),
      }));
      for (const reading of updatedReadings) {
        const docRef = doc(db, 'printerReadings', reading.id);
        await updateDoc(docRef, { readings: reading.readings });
      }
      setReadings(updatedReadings);
      toast.success('Changes saved successfully.');
      setEditing(false);
      setEditedValues({});
    } catch (error) {
      toast.error('Failed to save changes: ' + error.message);
    }
  };

  const getPrice = (printerId, size) => {
    const printer = printers.find(printer => printer.printerId === printerId);
    const priceObj = printer?.prices.find(price => price.size === size);
    return priceObj ? priceObj.price : 0;
  };

  const calculatePrinterTotal = (printerReadings) => {
    if (!printerReadings) return { totalCopies: 0, totalAmount: 0 };

    return Object.values(printerReadings).reduce(
      (acc, curr) => {
        acc.totalCopies += curr.noOfCopies || 0;
        acc.totalAmount += curr.total || 0;
        return acc;
      },
      { totalCopies: 0, totalAmount: 0 }
    );
  };

  return (
    <div className="printer-readings-container">
      <ToastContainer />
      <form onSubmit={handleSearch}>
        <h2>Printer Revenue List</h2>
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
      {readings.map((reading, index) => (
        <div key={index} className="printer-section">
          <h3>Branch: {reading.branchName}, Date: {reading.date}</h3>
          <table>
            <thead>
              <tr>
                <th>Printer ID</th>
                {Object.keys(reading.readings).map(printerId =>
                  ["Total Small", "Total Large", "B/W Scan", "Colour Scan", "Long Sheet"].map(size =>
                    reading.readings[printerId][size] !== undefined && (
                      <th key={`${printerId}-${size}`}>{size}</th>
                    )
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {['finalReading', 'starting', 'noOfCopies', 'total'].map(metric => (
                <tr key={metric}>
                  <td>{metric.charAt(0).toUpperCase() + metric.slice(1).replace(/([A-Z])/g, ' $1')}</td>
                  {Object.keys(reading.readings).map(printerId =>
                    ["Total Small", "Total Large", "B/W Scan", "Colour Scan", "Long Sheet"].map(size =>
                      reading.readings[printerId][size] !== undefined && (
                        <td key={`${printerId}-${size}-${metric}`}>
                          {editing && (metric === 'final' || metric === 'starting') ? (
                            <input
                              type="number"
                              value={
                                editedValues[reading.id]?.[printerId]?.[size]?.[metric] !== undefined
                                  ? editedValues[reading.id][printerId][size][metric]
                                  : reading.readings[printerId][size][metric]
                              }
                              onChange={(e) => handleEditChange(reading.id, printerId, size, metric, Number(e.target.value))}
                            />
                          ) : metric === 'noOfCopies' || metric === 'total' ? (
                            editedValues[reading.id]?.[printerId]?.[size]?.[metric] !== undefined
                              ? editedValues[reading.id][printerId][size][metric]
                              : reading.readings[printerId][size][metric] || 0
                          ) : (
                            reading.readings[printerId][size][metric] || 0
                          )}
                        </td>
                      )
                    )
                  )}
                </tr>
              ))}
              {Object.keys(reading.readings).map(printerId => (
                <tr key={`total-${printerId}`}>
                  <td colSpan={Object.keys(reading.readings[printerId]).length + 1} style={{ textAlign: 'center', fontWeight: 'bold' }}>
                    Total for {printerId}: ₹{calculatePrinterTotal(reading.readings[printerId]).totalAmount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {readings.length > 0 && (
        <div className="edit-buttons">
          {editing ? (
            <button onClick={saveChanges}>Save All Changes</button>
          ) : (
            <button onClick={() => setEditing(true)}>Edit All</button>
          )}
        </div>
      )}
    </div>
  );
};

export default DisplayPrinterReadingsManager;
