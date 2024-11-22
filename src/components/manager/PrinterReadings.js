import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../../services/authservice'; 
import { collection, getDocs, doc, getDoc, setDoc, query, where } from 'firebase/firestore';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../../styles/printerreadings.css';

const PrinterReadings = () => {
  const [branchName, setBranchName] = useState('');
  const [date, setDate] = useState('');
  const [printers, setPrinters] = useState([]);
  const [readings, setReadings] = useState({});
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        setUserId(user.uid);
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
        const q = query(printerCollection, where('branchName', '==', branchName));
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

  const getPrice = useCallback((printerId, size) => {
    const printer = printers.find(printer => printer.printerId === printerId);
    const priceObj = printer?.prices.find(price => price.size === size);
    return priceObj?.price || 0;
  }, [printers]);

  useEffect(() => {
    const fetchPreviousDayReadings = async () => {
      if (date && branchName) {
        const previousDate = new Date(date);
        previousDate.setDate(previousDate.getDate() - 1);
        const formattedPreviousDate = previousDate.toISOString().split('T')[0];

        const q = query(
          collection(db, 'printerReadings'),
          where('date', '==', formattedPreviousDate),
          where('branchName', '==', branchName)
        );
        const querySnapshot = await getDocs(q);

        const updatedReadings = {};

        if (!querySnapshot.empty) {
          querySnapshot.docs.forEach(doc => {
            const previousDayReadings = doc.data().readings;
            Object.keys(previousDayReadings).forEach(printerId => {
              if (!updatedReadings[printerId]) {
                updatedReadings[printerId] = {};
              }
              Object.keys(previousDayReadings[printerId]).forEach(size => {
                updatedReadings[printerId][size] = {
                  starting: previousDayReadings[printerId][size].finalReading,
                  price: getPrice(printerId, size),
                  finalReading: '',
                  noOfCopies: 0,
                  total: 0,
                };
              });
            });
          });
          setReadings(updatedReadings);
          toast.info('Previous day readings loaded successfully.');
        } else {
          toast.info('No previous day readings found. Please enter data manually.');
        }
      }
    };

    fetchPreviousDayReadings();
  }, [date, branchName, printers, getPrice]);

  const handleInputChange = (e, printerId, size, field) => {
    const { value } = e.target;
    setReadings(prevReadings => {
      const updatedReadings = { ...prevReadings };
      if (!updatedReadings[printerId]) {
        updatedReadings[printerId] = {};
      }
      if (!updatedReadings[printerId][size]) {
        updatedReadings[printerId][size] = { price: getPrice(printerId, size) };
      }
      updatedReadings[printerId][size][field] = Number(value);
      if (field === 'finalReading' || field === 'starting') {
        const finalReading = updatedReadings[printerId][size].finalReading || 0;
        const starting = updatedReadings[printerId][size].starting || 0;
        updatedReadings[printerId][size].noOfCopies = finalReading - starting;
        updatedReadings[printerId][size].total = updatedReadings[printerId][size].noOfCopies * updatedReadings[printerId][size].price;
      }
      return updatedReadings;
    });
  };

  const calculatePrinterTotal = (printerId) => {
    const printerReadings = readings[printerId];
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

  const handleSave = async (printerId) => {
    const printerTotal = calculatePrinterTotal(printerId);
    const docId = `${branchName}_${date}_${printerId}`;

    const q = query(
      collection(db, 'printerReadings'),
      where('date', '==', date),
      where('branchName', '==', branchName)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      if (querySnapshot.docs.some(doc => doc.id === docId)) {
        toast.error('You already entered the data for this day. Please go to the printer reading list to view the data.');
        return;
      }

      for (let docSnapshot of querySnapshot.docs) {
        if (docSnapshot.data().readings[printerId]) {
          toast.error('The printer already exists. Please check your entries.');
          return;
        }
      }
    }

    try {
      const printerDoc = doc(db, 'printerReadings', docId);
      await setDoc(printerDoc, {
        userId,
        branchName,
        date,
        readings: { [printerId]: readings[printerId] },
        totalCopies: printerTotal.totalCopies,
        totalAmount: printerTotal.totalAmount,
      });
      toast.success('Readings saved successfully');
    } catch (error) {
      toast.error('Failed to save readings: ' + error.message);
    }
  };

  return (
    <div className="printer-readings-container">
      <ToastContainer />
      <form>
        <h2>Add Printer Readings</h2>
        <div className="form-group">
          <label>Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        {printers.map(printer => (
          <div key={printer.printerId} className="printer-section">
            <table>
              <thead>
                <tr>
                  <th>{printer.printerName} ({printer.printerId})</th>
                  {printer.prices.map(price => (
                    <th key={price.size}>{price.size}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {['finalReading', 'starting', 'noOfCopies', 'total'].map(metric => (
                  <tr key={metric}>
                    <td>{metric.charAt(0).toUpperCase() + metric.slice(1).replace(/([A-Z])/g, ' $1')}</td>
                    {printer.prices.map(price => (
                      <td key={`${printer.printerId}-${price.size}-${metric}`}>
                        {metric === 'noOfCopies' || metric === 'total' ? (
                          readings[printer.printerId]?.[price.size]?.[metric] || 0
                        ) : (
                          <input
                            type="number"
                            value={readings[printer.printerId]?.[price.size]?.[metric] || ''}
                            onChange={(e) => handleInputChange(e, printer.printerId, price.size, metric)}
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td colSpan={printer.prices.length + 1} style={{ textAlign: 'center', fontWeight: 'bold' }}>
                    Total for {printer.printerId}: ₹{calculatePrinterTotal(printer.printerId).totalAmount}
                  </td>
                </tr>
                <tr>
                  <td colSpan={printer.prices.length + 1} style={{ textAlign: 'center' }}>
                    <button type="button" onClick={() => handleSave(printer.printerId)}>Save {printer.printerName} Readings</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </form>
    </div>
  );
};

export default PrinterReadings;
