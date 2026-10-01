import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
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
  const [authView, setAuthView] = useState('LANDING'); // 'LANDING', 'LOGIN', 'REGISTER'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showPoliceOption, setShowPoliceOption] = useState(false);

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

  // Sync state from current URL pathname
  const syncRouteWithState = () => {
    const rawPath = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
    const params = new URLSearchParams(window.location.search);
    const policeLogParam = params.get('police-log') || '';

    if (policeLogParam === 'true' || rawPath === '/police-log' || rawPath === '/police') {
      setShowPoliceOption(true);
    }

    const user = authService.getCurrentUser();

    if (rawPath === '/login') {
      setAuthView('LOGIN');
      setCurrentUser(null);
      return;
    }
    if (rawPath === '/register') {
      setAuthView('REGISTER');
      setCurrentUser(null);
      return;
    }
    if (rawPath === '/police') {
      if (user && user.role === 'POLICE') {
        setCurrentUser(user);
        setActiveTab('police-portal');
        refreshData();
      } else {
        setAuthView('LOGIN');
        setCurrentUser(null);
      }
      return;
    }
    if (rawPath === '/admin') {
      if (user && user.role === 'ADMIN') {
        setCurrentUser(user);
        setActiveTab('admin-approvals');
        refreshData();
      } else {
        setAuthView('LOGIN');
        setCurrentUser(null);
      }
      return;
    }

    const routeToTabMap = {
      '/dashboard': 'dashboard',
      '/express-checkin': 'express-checkin',
      '/new-checkin': 'new-checkin',
      '/database': 'database',
      '/ledger': 'ledger',
      '/police-log': 'police-log',
      '/billing': 'billing',
      '/room-mgmt': 'room-mgmt',
      '/admin-approvals': 'admin-approvals',
      '/police-portal': 'police-portal',
    };

    if (routeToTabMap[rawPath]) {
      if (user) {
        setCurrentUser(user);
        setActiveTab(routeToTabMap[rawPath]);
        refreshData();
      } else {
        setAuthView('LOGIN');
        setCurrentUser(null);
      }
      return;
    }

    // Default root `/` or `/landing`
    if (user) {
      setCurrentUser(user);
      setActiveTab('dashboard');
      refreshData();
    } else {
      setAuthView('LANDING');
      setCurrentUser(null);
    }
  };

  // Sync route on mount and listen to browser popstate (back/forward)
  useEffect(() => {
    syncRouteWithState();

    const handlePopState = () => {
      syncRouteWithState();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Navigation Handlers with URL state pushing
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const tabToPathMap = {
      'dashboard': '/dashboard',
      'express-checkin': '/express-checkin',
      'new-checkin': '/new-checkin',
      'database': '/database',
      'ledger': '/ledger',
      'police-log': '/police-log',
      'billing': '/billing',
      'room-mgmt': '/room-mgmt',
      'admin-approvals': '/admin',
      'police-portal': '/police',
    };
    const targetPath = tabToPathMap[tab] || '/dashboard';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  const handleAuthViewChange = (view) => {
    setAuthView(view);
    const targetPath = view === 'REGISTER' ? '/register' : view === 'LOGIN' ? '/login' : '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  const handleUserSessionInit = (user) => {
    setCurrentUser(user);
    let targetTab = 'dashboard';
    let targetPath = '/dashboard';

    if (user.role === 'ADMIN') {
      targetTab = 'admin-approvals';
      targetPath = '/admin';
    } else if (user.role === 'POLICE') {
      targetTab = 'police-portal';
      targetPath = '/police';
    }

    setActiveTab(targetTab);
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    refreshData();
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setAuthView('LANDING');
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
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

  const handleAddRoom = (roomData) => {
    const result = hotelService.addRoom(roomData);
    if (result.success) {
      refreshData();
    }
    return result;
  };

  const handleDeleteRoom = (roomId) => {
    const result = hotelService.deleteRoom(roomId);
    if (result.success) {
      refreshData();
    }
    return result;
  };

  // Render Landing Page or Auth Page if unauthenticated
  if (!currentUser) {
    if (authView === 'LANDING') {
      return (
        <LandingPage 
          onOpenLogin={(mode = 'HOTEL_LOGIN') => handleAuthViewChange('LOGIN')}
          onOpenRegister={() => handleAuthViewChange('REGISTER')}
        />
      );
    }

    return (
      <AuthPage 
        onLoginSuccess={handleUserSessionInit}
        onBackToLanding={() => handleAuthViewChange('LANDING')}
        initialMode={authView === 'REGISTER' ? 'HOTEL_REGISTER' : 'HOTEL_LOGIN'}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex">
      {/* Left Sidebar Navigation */}
      <Sidebar 
        user={currentUser}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        openExpressModal={() => handleOpenExpressModal()}
        openNewCheckInModal={handleOpenNewCheckInModal}
        openPoliceModal={handleOpenPoliceModal}
        occupiedCount={occupiedCount}
        totalRooms={rooms.length || 15}
        showPoliceOption={showPoliceOption}
      />

      {/* Main Right Layout */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        <Header 
          user={currentUser}
          onLogout={handleLogout}
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          openExpressModal={() => handleOpenExpressModal()}
          openNewCheckInModal={handleOpenNewCheckInModal}
          openPoliceModal={handleOpenPoliceModal}
          showPoliceOption={showPoliceOption}
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
              switchToNewGuest={() => handleTabChange('new-checkin')}
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
              onAddRoom={handleAddRoom}
              onDeleteRoom={handleDeleteRoom}
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

