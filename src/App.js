import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './services/authservice';
import LoginPage from './components/common/login';
import ForgotPasswordPage from './components/common/forgotpassword';
import AdminDashboardPage from './components/admin/admindashboard';
import ManagerDashboardPage from './components/manager/managerdashboard';
import AddManagerPage from './components/admin/AddManager';
import AddPrinterManagerPage from './components/manager/AddPrinterManager';
import PrinterListPage from './components/admin/PrinterList';
import PrinterListManagerPage from './components/manager/PrinterList';
import StockListPage from './components/admin/StockList';
import AddStockManagerPage from './components/manager/AddStock';
import StockListManagerPage from './components/manager/StockList';
import PrinterReadingsManagerPage from './components/manager/PrinterReadings';
import DisplayPrinterReadingsAdminPage from './components/admin/DisplayPrinterReadings';
import DisplayPrinterReadingsManagerPage from './components/manager/DisplayPrinterReadings';
import JumboXeroxPage from './components/manager/JumboXerox';
import TotalAmountDisplayPage from './components/manager/TotalAmountDisplay';
import JumboXeroxListAdminPage from './components/admin/JumboXeroxList';
import JumboXeroxListManagerPage from './components/manager/JumboXeroxList';
import TotalAmountListAdminPage from './components/admin/TotalAmountList';
import TotalAmountListManagerPage from './components/manager/TotalAmountList';
import ProfilePage from './components/common/Profile';
import PrivateRoute from './components/common/PrivateRoute';
import Header from './components/common/Header';
import AdminLayout from './components/admin/AdminLayout';
import ManagerLayout from './components/manager/ManagerLayout';
import SearchStockListAdmin from './components/admin/SearchStockList';
import SearchStockListManager from './components/manager/SearchStockList';
import StockItemListPage from './components/manager/StockItemList'; // Import the StockItemList component
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  const { role } = useAuth() || {};
  const location = useLocation();

  const renderHeader = location.pathname !== '/login' && location.pathname !== '/forgot-password';

  return (
    <>
      {renderHeader && <Header />}
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/forgot-password' element={<ForgotPasswordPage />} />
        <Route path='/admin-dashboard' element={<PrivateRoute roles={['admin']} component={() => <AdminLayout><AdminDashboardPage /></AdminLayout>} />} />
        <Route path='/add-manager' element={<PrivateRoute roles={['admin']} component={() => <AdminLayout><AddManagerPage /></AdminLayout>} />} />
        <Route path='/printer-list' element={<PrivateRoute roles={['admin']} component={() => <AdminLayout><PrinterListPage /></AdminLayout>} />} />
        <Route path='/stock-list' element={<PrivateRoute roles={['admin']} component={() => <AdminLayout><StockListPage /></AdminLayout>} />} />
        <Route path='/manager-dashboard' element={<PrivateRoute roles={['manager']} component={() => <ManagerLayout><ManagerDashboardPage /></ManagerLayout>} />} />
        <Route path='/add-printer-manager' element={<PrivateRoute roles={['manager']} component={() => <ManagerLayout><AddPrinterManagerPage /></ManagerLayout>} />} />
        <Route path='/add-stock-manager' element={<PrivateRoute roles={['manager']} component={() => <ManagerLayout><AddStockManagerPage /></ManagerLayout>} />} />
        <Route path='/stock-list-manager' element={<PrivateRoute roles={['manager']} component={() => <ManagerLayout><StockListManagerPage /></ManagerLayout>} />} />
        <Route path='/printer-readings-manager' element={<PrivateRoute roles={['manager']} component={() => <ManagerLayout><PrinterReadingsManagerPage /></ManagerLayout>} />} />
        <Route path='/printer-list-manager' element={<PrivateRoute roles={['manager']} component={() => <ManagerLayout><PrinterListManagerPage /></ManagerLayout>} />} />
        <Route path='/jumbo-xerox' element={<PrivateRoute roles={['manager']} component={() => <ManagerLayout><JumboXeroxPage /></ManagerLayout>} />} />
        <Route path='/display-printer-readings-admin' element={<PrivateRoute roles={['admin']} component={() => <AdminLayout><DisplayPrinterReadingsAdminPage /></AdminLayout>} />} />
        <Route path='/display-printer-readings-manager' element={<PrivateRoute roles={['manager']} component={() => <ManagerLayout><DisplayPrinterReadingsManagerPage /></ManagerLayout>} />} />
        <Route path='/total-amount-display' element={<PrivateRoute roles={['manager']} component={() => <ManagerLayout><TotalAmountDisplayPage /></ManagerLayout>} />} />
        <Route path='/jumbo-xerox-list-admin' element={<PrivateRoute roles={['admin']} component={() => <AdminLayout><JumboXeroxListAdminPage /></AdminLayout>} />} />
        <Route path='/jumbo-xerox-list-manager' element={<PrivateRoute roles={['manager']} component={() => <ManagerLayout><JumboXeroxListManagerPage /></ManagerLayout>} />} />
        <Route path='/total-amount-list-admin' element={<PrivateRoute roles={['admin']} component={() => <AdminLayout><TotalAmountListAdminPage /></AdminLayout>} />} />
        <Route path='/total-amount-list-manager' element={<PrivateRoute roles={['manager']} component={() => <ManagerLayout><TotalAmountListManagerPage /></ManagerLayout>} />} />
        <Route path='/profile' element={<PrivateRoute component={ProfilePage} />} />
        <Route path='/search-stock-list-admin' element={<PrivateRoute roles={['admin']} component={() => <AdminLayout><SearchStockListAdmin /></AdminLayout>} />} />
        <Route path='/search-stock-list-manager' element={<PrivateRoute roles={['manager']} component={() => <ManagerLayout><SearchStockListManager /></ManagerLayout>} />} />
        <Route
          path='/dashboard'
          element={role === 'admin' ? <AdminLayout><AdminDashboardPage /></AdminLayout> : <ManagerLayout><ManagerDashboardPage /></ManagerLayout>}
        />
        <Route path='/stock-item-list-manager' element={<PrivateRoute roles={['manager']} component={() => <ManagerLayout><StockItemListPage /></ManagerLayout>} />} />
      </Routes>
    </>
  );
};

const AppWrapper = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;
