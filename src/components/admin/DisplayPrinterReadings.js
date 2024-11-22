import React, { useState, useEffect } from 'react';
import { db } from '../../services/authservice';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../../styles/printerreadings.css';

const DisplayPrinterReadingsManager = () => {
  const [branches, setBranches] = useState([]);
  const [branchName, setBranchName] = useState('');
  const [date, setDate] = useState('');
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedValues, setEditedValues] = useState({});

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const printerReadingsCollection = collection(db, 'printerReadings');
        const snapshot = await getDocs(printerReadingsCollection);
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
      const q = query(collection(db, 'printerReadings'), where('branchName', '==', branchName), where('date', '==', date));
      const querySnapshot = await getDocs(q);
      const readingsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReadings(readingsData);
      setLoading(false);
      if (readingsData.length === 0) {
        toast.info('No data found for the selected branch and date.');
      }
    } catch (error) {
      toast.error('Failed to fetch readings: ' + error.message);
      setLoading(false);
    }
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

  const handleEditChange = (readingId, printerId, size, field, value) => {
    const newEditedValues = {
      ...editedValues,
      [readingId]: {
        ...editedValues[readingId],
        [printerId]: {
          ...editedValues[readingId]?.[printerId],
          [size]: {
            ...editedValues[readingId]?.[printerId]?.[size],
            [field]: value,
          },
        },
      },
    };

    // Update noOfCopies and total based on new finalReading and starting values
    if (field === 'finalReading' || field === 'starting') {
      const finalReading = newEditedValues[readingId][printerId][size].finalReading || 0;
      const starting = newEditedValues[readingId][printerId][size].starting || 0;
      const noOfCopies = finalReading - starting;
      const total = noOfCopies * 0.1; // Assuming price per copy is 0.1
      newEditedValues[readingId][printerId][size].noOfCopies = noOfCopies;
      newEditedValues[readingId][printerId][size].total = total;
    }

    setEditedValues(newEditedValues);
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
        updatedReadings[printerId][size].noOfCopies = updatedReadings[printerId][size].finalReading - updatedReadings[printerId][size].starting;
        updatedReadings[printerId][size].total = updatedReadings[printerId][size].noOfCopies * 0.1; // Assuming price per copy is 0.1
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

  return (
    <div className="printer-readings-container">
      <ToastContainer />
      <form onSubmit={handleSearch}>
        <h2>Printer Revenue List</h2>
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
      {readings.map((reading, index) => (
        <div key={index} className="printer-section">
          <h3>Branch: {reading.branchName}, Date: {reading.date}</h3>
          <table>
            <thead>
              <tr>
                <th>Items</th>
                {Object.keys(reading.readings).map(printerId => (
                  <th key={printerId} colSpan={Object.keys(reading.readings[printerId]).length}>
                    {printerId}
                  </th>
                ))}
              </tr>
              <tr>
                <th></th>
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
                          {editing && (metric === 'finalReading' || metric === 'starting') ? (
                            <input
                              type="number"
                              value={
                                editedValues[reading.id]?.[printerId]?.[size]?.[metric] !== undefined
                                  ? editedValues[reading.id][printerId][size][metric]
                                  : reading.readings[printerId][size][metric]
                              }
                              onChange={(e) => handleEditChange(reading.id, printerId, size, metric, Number(e.target.value))}
                            />
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
