import React, { useState, useEffect, useCallback } from 'react';
import { Chart as ChartJS, BarElement, LineElement, PointElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Bar, Pie, Chart } from 'react-chartjs-2';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { db, auth } from '../../services/authservice';
import '../../styles/managerdashboard.css';

ChartJS.register(BarElement, LineElement, PointElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend);

const ManagerDashboard = () => {
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState(getTodayDate());
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [branchName, setBranchName] = useState('');
  const [userInfo, setUserInfo] = useState({ name: '', email: '', phone: '' });
  const [printerCount, setPrinterCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [barData, setBarData] = useState({
    labels: [],
    datasets: [],
  });
  const [pieData, setPieData] = useState({
    labels: [],
    datasets: [],
  });
  const [mixedChartData, setMixedChartData] = useState({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = doc(db, 'users', user.uid);
        const userSnapshot = await getDoc(userDoc);
        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          setBranchName(userData.branch);
          setUserInfo({
            name: userData.name || 'N/A',
            email: user.email,
            phone: userData.phone || 'N/A',
          });
        }
      }
    };

    const fetchPrinterData = async () => {
      if (branchName && date) {
        const q = query(
          collection(db, 'printerReadings'),
          where('branchName', '==', branchName),
          where('date', '==', date)
        );
        const snapshot = await getDocs(q);
        const printerData = snapshot.docs.map(doc => doc.data());

        const totalAmounts = [];
        const totalCopies = [];
        const labels = [];

        printerData.forEach(data => {
          Object.keys(data.readings).forEach(printerId => {
            labels.push(printerId);
            totalAmounts.push(data.totalAmount || 0);
            totalCopies.push(data.totalCopies || 0);
          });
        });

        setBarData({
          labels,
          datasets: [
            {
              label: 'Total Amount',
              data: totalAmounts,
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
            },
            {
              label: 'Total Copies',
              data: totalCopies,
              backgroundColor: 'rgba(153, 102, 255, 0.6)',
            },
          ],
        });

        const stockQ = query(
          collection(db, 'stockReadings'),
          where('branchName', '==', branchName),
          where('date', '==', date)
        );
        const stockSnapshot = await getDocs(stockQ);
        const stockData = stockSnapshot.docs.map(doc => doc.data());

        const itemLabels = [];
        const itemSold = [];
        if (stockData.length > 0 && stockData[0]?.stocks) {
          stockData[0].stocks.forEach(stock => {
            itemLabels.push(stock.itemName || 'Unknown Item');
            itemSold.push(stock.sold || 0);
          });
        }

        setPieData({
          labels: itemLabels,
          datasets: [
            {
              label: 'Items Sold',
              data: itemSold,
              backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)',
                'rgba(153, 102, 255, 0.6)',
                'rgba(255, 159, 64, 0.6)',
              ],
            },
          ],
        });

        const totalAmountQ = query(
          collection(db, 'totalAmountReadings'),
          where('branchName', '==', branchName),
          where('date', '==', date)
        );
        const totalAmountSnapshot = await getDocs(totalAmountQ);
        const totalAmountData = totalAmountSnapshot.docs.map(doc => doc.data());
        setTotalAmount(totalAmountData.reduce((sum, data) => sum + (data.totalAmount || 0), 0));
      }
    };

    const fetchPrinterCount = async () => {
      if (branchName) {
        const printersSnapshot = await getDocs(collection(db, 'printers'));
        const branchPrinterCount = printersSnapshot.docs.filter(doc => doc.data().branchName === branchName).length;
        setPrinterCount(branchPrinterCount);
      }
    };

    fetchUserData();
    fetchPrinterData();
    fetchPrinterCount();
  }, [branchName, date]);

  const fetchMixedChartData = useCallback(async () => {
    if (branchName && fromDate && toDate) {
      const q = query(
        collection(db, 'printerReadings'),
        where('branchName', '==', branchName),
        where('date', '>=', fromDate),
        where('date', '<=', toDate)
      );
      const snapshot = await getDocs(q);
      const printerData = snapshot.docs.map(doc => doc.data());

      const labels = [];
      const totalAmounts = {};
      const totalCopies = {};

      printerData.forEach(data => {
        const dateLabel = data.date;
        if (!labels.includes(dateLabel)) {
          labels.push(dateLabel);
        }

        Object.keys(data.readings).forEach(printerId => {
          if (!totalAmounts[printerId]) {
            totalAmounts[printerId] = [];
            totalCopies[printerId] = [];
          }

          totalAmounts[printerId].push(data.totalAmount || 0);
          totalCopies[printerId].push(data.totalCopies || 0);
        });
      });

      const barDatasets = Object.keys(totalAmounts).map(printerId => ({
        type: 'bar',
        label: `Total Amount - ${printerId}`,
        data: totalAmounts[printerId],
        backgroundColor: getRandomColor(),
      }));

      const lineDatasets = Object.keys(totalCopies).map(printerId => ({
        type: 'line',
        label: `Total Copies - ${printerId}`,
        data: totalCopies[printerId],
        borderColor: getRandomColor(),
        fill: false,
      }));

      setMixedChartData({
        labels,
        datasets: [...barDatasets, ...lineDatasets],
      });
    }
  }, [branchName, fromDate, toDate]);

  useEffect(() => {
    fetchMixedChartData();
  }, [fetchMixedChartData, fromDate, toDate]);

  return (
    <div className="manager-dashboard-unique">
      <div className="top-section-unique">
        <div className="user-info-unique">
          <div className="info-box-unique">
            <h2>User Info</h2>
            <p>{userInfo.name}</p>
            <p>{userInfo.email}</p>
            <p>{userInfo.phone}</p>
          </div>
        </div>
        <div className="stats-unique">
          <div className="stat-box-unique">
            <h3>No. of Printers</h3>
            <p>{printerCount}</p>
          </div>
          <div className="stat-box-unique">
            <h3>Total Revenue</h3>
            <p>₹{totalAmount}</p>
          </div>
        </div>
      </div>

      <div className="middle-section-unique">
        <div className="charts-side-by-side">
          <div className="chart-box-unique">
            <h3>Printer Revenue</h3>
            {barData.labels.length > 0 && barData.datasets.length > 0 ? (
              <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false }} />
            ) : (
              <p>No data available for the selected date.</p>
            )}
          </div>
          <div className="chart-box-unique">
            <h3>Stock Revenue</h3>
            {pieData.labels.length > 0 && pieData.datasets.length > 0 ? (
              <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false }} />
            ) : (
              <p>No data available for the selected date.</p>
            )}
          </div>
        </div>
        <div className="form-group-unique">
          <label>Select Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      <div className="middle-section-unique">
        <div className="chart-box-unique">
          <h3>Total Revenue for custom dates</h3>
          {mixedChartData.labels.length > 0 && mixedChartData.datasets.length > 0 ? (
            <Chart data={mixedChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          ) : (
            <p>No data available for the selected date range.</p>
          )}
        </div>
        <div className="form-group-unique">
          <label>From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <label>To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;

// Utility function to generate random colors for the charts
const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};
