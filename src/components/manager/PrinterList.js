import React, { useState, useEffect } from 'react';
import { db, auth } from '../../services/authservice'; // Ensure authservice exports both db and auth
import { collection, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { FaRegArrowAltCircleLeft, FaRegArrowAltCircleRight } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../../styles/printerlist.css';

const PrinterList = () => {
  const [printers, setPrinters] = useState([]);
  const [branchName, setBranchName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [editedData, setEditedData] = useState({});
  const printersPerPage = 10;

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
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

    const fetchPrinters = async () => {
      const printerCollection = collection(db, 'printers');
      const printerSnapshot = await getDocs(printerCollection);
      const printerList = printerSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPrinters(printerList);
    };

    fetchUserData().then(fetchPrinters);
  }, []);

  const handleEditClick = (printer) => {
    setEditingId(printer.id);
    setEditedData(printer);
  };

  const handleCancelClick = () => {
    setEditingId(null);
    setEditedData({});
  };

  const handleInputChange = (e, field, priceIndex) => {
    const { name, value } = e.target;
    setEditedData((prev) => {
      if (priceIndex !== undefined) {
        const updatedPrices = prev.prices.map((price, index) =>
          index === priceIndex ? { ...price, [name]: value } : price
        );
        return { ...prev, prices: updatedPrices };
      } else {
        return { ...prev, [name]: value };
      }
    });
  };

  const handleSaveClick = async () => {
    try {
      await updateDoc(doc(db, 'printers', editedData.id), editedData);
      toast.success('Printer details updated successfully');
      setPrinters((prevPrinters) =>
        prevPrinters.map((printer) =>
          printer.id === editedData.id ? editedData : printer
        )
      );
      setEditingId(null);
      setEditedData({});
    } catch (error) {
      toast.error('Failed to update printer details: ' + error.message);
    }
  };

  const filteredPrinters = printers.filter(printer => printer.branchName === branchName);

  const indexOfLastPrinter = currentPage * printersPerPage;
  const indexOfFirstPrinter = indexOfLastPrinter - printersPerPage;
  const currentPrinters = filteredPrinters.slice(indexOfFirstPrinter, indexOfLastPrinter);

  const nextPage = () => {
    if (currentPage < Math.ceil(filteredPrinters.length / printersPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };

  const previousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="printer-list-container">
      <ToastContainer />
      <h2>Printing Price List</h2>
      {branchName && (
        <>
          <table>
            <thead>
              <tr>
                <th>Printer ID</th>
                <th>Printer Name</th>
                <th>Price(₹)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentPrinters.map((printer, index) => (
                <tr key={printer.id}>
                  <td>
                    {editingId === printer.id ? (
                      <input
                        type="text"
                        name="printerId"
                        value={editedData.printerId}
                        onChange={(e) => handleInputChange(e, 'printerId')}
                      />
                    ) : (
                      printer.printerId
                    )}
                  </td>
                  <td>
                    {editingId === printer.id ? (
                      <input
                        type="text"
                        name="printerName"
                        value={editedData.printerName}
                        onChange={(e) => handleInputChange(e, 'printerName')}
                      />
                    ) : (
                      printer.printerName
                    )}
                  </td>
                  <td>
                    {printer.prices.map((priceObj, priceIndex) => (
                      <div key={priceIndex}>
                        {editingId === printer.id ? (
                          <>
                            <input
                              type="text"
                              name="size"
                              value={editedData.prices[priceIndex].size}
                              onChange={(e) => handleInputChange(e, 'size', priceIndex)}
                            />
                            : ₹ 
                            <input
                              type="number"
                              name="price"
                              value={editedData.prices[priceIndex].price}
                              onChange={(e) => handleInputChange(e, 'price', priceIndex)}
                            />
                          </>
                        ) : (
                          <>
                            {priceObj.size}: ₹{priceObj.price}
                          </>
                        )}
                      </div>
                    ))}
                  </td>
                  <td>
                    {editingId === printer.id ? (
                      <>
                        <button onClick={handleSaveClick}>Save</button>
                        <button onClick={handleCancelClick}>Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => handleEditClick(printer)}>Edit</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <FaRegArrowAltCircleLeft onClick={previousPage} className={currentPage === 1 ? 'disabled' : ''} />
            <span>{currentPage}</span>
            <FaRegArrowAltCircleRight onClick={nextPage} className={currentPage === Math.ceil(filteredPrinters.length / printersPerPage) ? 'disabled' : ''} />
          </div>
        </>
      )}
    </div>
  );
};

export default PrinterList;
