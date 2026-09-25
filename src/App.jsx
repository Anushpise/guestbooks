import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import GuestLedger from './components/GuestLedger';
import PoliceReportView from './components/PoliceReportView';
import BillingArchiveView from './components/BillingArchiveView';
import RoomManagementView from './components/RoomManagementView';
import ExpressCheckInView from './components/ExpressCheckInView';
import NewCheckInView from './components/NewCheckInView';
import AdminDashboard from './components/AdminDashboard';
import PolicePortalView from './components/PolicePortalView';
import GuestDatabaseView from './components/GuestDatabaseView';
import AuthPage from './components/AuthPage';

import ExpressCheckInModal from './components/ExpressCheckInModal';
import NewCheckInForm from './components/NewCheckInForm';
import PoliceReportModal from './components/PoliceReportModal';
import GuestReceiptModal from './components/GuestReceiptModal';
import { hotelService } from './services/hotelService';
import { authService } from './services/authService';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Core Data States
  const [rooms, setRooms] = useState([]);
  const [activeStays, setActiveStays] = useState([]);

  // Modal States
  const [isExpressModalOpen, setIsExpressModalOpen] = useState(false);
  const [isNewCheckInModalOpen, setIsNewCheckInModalOpen] = useState(false);
  const [isPoliceModalOpen, setIsPoliceModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  
  const [preSelectedRoom, setPreSelectedRoom] = useState(null);
  const [selectedStayForReceipt, setSelectedStayForReceipt] = useState(null);

  // Load session on mount
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      handleUserSessionInit(user);
    }
    refreshData();
  }, []);

  const handleUserSessionInit = (user) => {
    setCurrentUser(user);
    if (user.role === 'ADMIN') {
      setActiveTab('admin-approvals');
    } else if (user.role === 'POLICE') {
      setActiveTab('police-portal');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  const refreshData = () => {
    setRooms(hotelService.getRooms());
    setActiveStays(hotelService.getActiveStays());
  };

  const vacantRooms = rooms.filter(r => r.status === 'VACANT');
  const occupiedCount = rooms.filter(r => r.status === 'OCCUPIED').length;

  // Open Modals
  const handleOpenExpressModal = (roomNo = null) => {
    setPreSelectedRoom(roomNo);
    setIsExpressModalOpen(true);
  };

  const handleOpenNewCheckInModal = () => {
    setIsNewCheckInModalOpen(true);
  };

  const handleOpenPoliceModal = () => {
    setIsPoliceModalOpen(true);
  };

  const handleViewReceipt = (stayRecord) => {
    setSelectedStayForReceipt(stayRecord);
    setIsReceiptModalOpen(true);
  };

  // Business Actions
  const handleCheckInComplete = (stayData) => {
    hotelService.checkInGuest(stayData);
    refreshData();
  };

  const handleCheckOut = (stayId) => {
    const checkedOut = hotelService.checkOutGuest(stayId);
    refreshData();
    if (checkedOut) {
      handleViewReceipt(checkedOut);
    }
  };

  const handleRoomStatusChange = (roomId, newStatus) => {
    hotelService.updateRoomStatus(roomId, newStatus);
    refreshData();
  };

  const handleRoomTariffChange = (roomId, newRate) => {
    hotelService.updateRoomTariff(roomId, newRate);
    refreshData();
  };

  // Render Login/Registration screen if user is unauthenticated
  if (!currentUser) {
    return <AuthPage onLoginSuccess={handleUserSessionInit} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex">
      {/* Left Sidebar Navigation */}
      <Sidebar 
        user={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openExpressModal={() => handleOpenExpressModal()}
        openNewCheckInModal={handleOpenNewCheckInModal}
        openPoliceModal={handleOpenPoliceModal}
        occupiedCount={occupiedCount}
        totalRooms={rooms.length || 15}
      />

      {/* Main Right Layout */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        <Header 
          user={currentUser}
          onLogout={handleLogout}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          openExpressModal={() => handleOpenExpressModal()}
          openNewCheckInModal={handleOpenNewCheckInModal}
          openPoliceModal={handleOpenPoliceModal}
        />

        <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
          {/* SUPER ADMIN VIEW */}
          {activeTab === 'admin-approvals' && (
            <AdminDashboard />
          )}

          {/* POLICE INSPECTOR VIEW */}
          {activeTab === 'police-portal' && (
            <PolicePortalView user={currentUser} />
          )}

          {/* HOTEL MANAGER VIEWS */}
          {activeTab === 'dashboard' && (
            <Dashboard 
              rooms={rooms}
              activeStays={activeStays}
              onCheckOut={handleCheckOut}
              openExpressModal={handleOpenExpressModal}
              openNewCheckInModal={handleOpenNewCheckInModal}
              openPoliceModal={handleOpenPoliceModal}
              onRoomStatusChange={handleRoomStatusChange}
              onViewReceipt={handleViewReceipt}
            />
          )}

          {activeTab === 'express-checkin' && (
            <ExpressCheckInView
              vacantRooms={vacantRooms}
              onCheckInComplete={handleCheckInComplete}
              switchToNewGuest={() => setActiveTab('new-checkin')}
            />
          )}

          {activeTab === 'new-checkin' && (
            <NewCheckInView
              vacantRooms={vacantRooms}
              onCheckInComplete={handleCheckInComplete}
            />
          )}

          {activeTab === 'database' && (
            <GuestDatabaseView />
          )}

          {activeTab === 'ledger' && (
            <GuestLedger 
              openExpressModal={(roomNo, phone) => handleOpenExpressModal(roomNo)}
            />
          )}

          {activeTab === 'police-log' && (
            <PoliceReportView />
          )}

          {activeTab === 'billing' && (
            <BillingArchiveView 
              onViewReceipt={handleViewReceipt}
            />
          )}

          {activeTab === 'room-mgmt' && (
            <RoomManagementView 
              rooms={rooms}
              onRoomStatusChange={handleRoomStatusChange}
              onRoomTariffChange={handleRoomTariffChange}
              refreshData={refreshData}
            />
          )}
        </main>
      </div>

      {/* Modal Dialogs for fast shortcuts anywhere */}
      <ExpressCheckInModal 
        isOpen={isExpressModalOpen}
        onClose={() => setIsExpressModalOpen(false)}
        preSelectedRoom={preSelectedRoom}
        vacantRooms={vacantRooms}
        onCheckInComplete={handleCheckInComplete}
        switchToNewGuest={() => setIsNewCheckInModalOpen(true)}
      />

      <NewCheckInForm 
        isOpen={isNewCheckInModalOpen}
        onClose={() => setIsNewCheckInModalOpen(false)}
        vacantRooms={vacantRooms}
        onCheckInComplete={handleCheckInComplete}
      />

      <PoliceReportModal 
        isOpen={isPoliceModalOpen}
        onClose={() => setIsPoliceModalOpen(false)}
      />

      <GuestReceiptModal 
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        stayRecord={selectedStayForReceipt}
      />
    </div>
  );
}
