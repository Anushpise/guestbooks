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
import CheckOutModal from './components/CheckOutModal';
import CounterQRModal from './components/CounterQRModal';
import GuestUploadPortal from './components/GuestUploadPortal';
import { hotelService } from './services/hotelService';
import { authService } from './services/authService';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());
  const [authView, setAuthView] = useState('LANDING'); // 'LANDING', 'LOGIN', 'REGISTER', 'GUEST_UPLOAD'
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
  const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);
  const [isCounterQRModalOpen, setIsCounterQRModalOpen] = useState(false);
  
  const [preSelectedRoom, setPreSelectedRoom] = useState(null);
  const [selectedStayForReceipt, setSelectedStayForReceipt] = useState(null);
  const [stayToCheckout, setStayToCheckout] = useState(null);

  const refreshData = (targetUser = null) => {
    const userToUse = targetUser || currentUser || authService.getCurrentUser();
    const hId = userToUse?.hotelId || 'HTL-101';
    setRooms(hotelService.getRooms(hId));
    setActiveStays(hotelService.getActiveStays(hId));
  };

  // Sync state from current URL pathname
  const syncRouteWithState = () => {
    const rawPath = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
    const params = new URLSearchParams(window.location.search);
    const policeLogParam = params.get('police-log') || '';
    const viewParam = params.get('view') || '';

    if (rawPath === '/guest-upload' || viewParam === 'guest-upload') {
      setAuthView('GUEST_UPLOAD');
      return;
    }

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
    if (rawPath === '/police' || rawPath === '/police-portal') {
      if (user && user.role === 'POLICE') {
        setCurrentUser(user);
        setActiveTab('police-portal');
        refreshData(user);
      } else {
        setAuthView('POLICE_LOGIN');
        setCurrentUser(null);
      }
      return;
    }
    if (rawPath === '/admin' || rawPath === '/admin-approvals') {
      if (user && user.role === 'ADMIN') {
        setCurrentUser(user);
        setActiveTab('admin-approvals');
        refreshData(user);
      } else {
        setAuthView('ADMIN_LOGIN');
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
        refreshData(user);
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
      refreshData(user);
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
    const targetPath =
      view === 'REGISTER' ? '/register' :
      view === 'ADMIN_LOGIN' ? '/admin' :
      view === 'POLICE_LOGIN' ? '/police' :
      view === 'LOGIN' ? '/login' : '/';
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
    refreshData(user);
  };

  const currentHotel = currentUser
    ? (authService.getAllHotels().find(h =>
        (currentUser.hotelId && h.id === currentUser.hotelId) ||
        (currentUser.email && h.email && h.email.toLowerCase() === currentUser.email.toLowerCase())
      ) || {
        id: currentUser.hotelId || 'HTL-101',
        name: currentUser.name || 'pease of palace',
        ownerName: currentUser.ownerName || currentUser.name || 'dilip',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        totalRooms: 15,
        occupiedRooms: 0,
      })
    : null;

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setAuthView('LANDING');
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshData(currentUser);
    }
  }, [currentUser]);

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
    const dataWithHotel = {
      ...stayData,
      hotelId: currentUser?.hotelId || 'HTL-101',
    };
    hotelService.checkInGuest(dataWithHotel);
    refreshData(currentUser);
  };

  const handleCheckOut = (stayIdOrStay) => {
    let stayObj = null;
    if (typeof stayIdOrStay === 'object' && stayIdOrStay !== null) {
      stayObj = stayIdOrStay;
    } else {
      stayObj = activeStays.find(s => s.id === stayIdOrStay || String(s.roomNumber) === String(stayIdOrStay));
      if (!stayObj) {
        const raw = hotelService.getActiveStays(currentUser?.hotelId);
        stayObj = raw.find(s => s.id === stayIdOrStay || String(s.roomNumber) === String(stayIdOrStay));
      }
    }

    if (stayObj) {
      setStayToCheckout(stayObj);
      setIsCheckOutModalOpen(true);
    } else {
      // Fallback direct checkout if stay record not found
      const checkedOut = hotelService.checkOutGuest(stayIdOrStay, currentUser?.hotelId);
      refreshData(currentUser);
      if (checkedOut) {
        handleViewReceipt(checkedOut);
      }
    }
  };

  const handleConfirmCheckOut = (stayIdOrRoom, checkOutData) => {
    const checkedOut = hotelService.checkOutGuest(stayIdOrRoom, currentUser?.hotelId, checkOutData);
    refreshData(currentUser);
    setIsCheckOutModalOpen(false);
    setStayToCheckout(null);
    if (checkedOut) {
      handleViewReceipt(checkedOut);
    }
  };


  const handleRoomStatusChange = (roomId, newStatus) => {
    hotelService.updateRoomStatus(roomId, newStatus, false, currentUser?.hotelId);
    refreshData(currentUser);
  };

  const handleRoomTariffChange = (roomId, newRate) => {
    hotelService.updateRoomTariff(roomId, newRate, currentUser?.hotelId);
    refreshData(currentUser);
  };

  const handleAddRoom = (roomData) => {
    const result = hotelService.addRoom(roomData, currentUser?.hotelId);
    if (result.success) {
      refreshData(currentUser);
    }
    return result;
  };

  const handleDeleteRoom = (roomId) => {
    const result = hotelService.deleteRoom(roomId, currentUser?.hotelId);
    if (result.success) {
      refreshData(currentUser);
    }
    return result;
  };

  // Public Guest Mobile Upload Screen (Accessible via QR scan without staff login)
  if (authView === 'GUEST_UPLOAD') {
    return <GuestUploadPortal />;
  }

  // Render Landing Page or Auth Page if unauthenticated
  if (!currentUser) {
    if (authView === 'LANDING') {
      return (
        <LandingPage 
          onOpenLogin={(mode = 'HOTEL_LOGIN') => handleAuthViewChange(mode === 'ADMIN_LOGIN' ? 'ADMIN_LOGIN' : mode === 'POLICE_LOGIN' ? 'POLICE_LOGIN' : 'LOGIN')}
          onOpenRegister={() => handleAuthViewChange('REGISTER')}
        />
      );
    }

    return (
      <AuthPage 
        onLoginSuccess={handleUserSessionInit}
        onBackToLanding={() => handleAuthViewChange('LANDING')}
        initialMode={authView === 'REGISTER' ? 'HOTEL_REGISTER' : authView === 'ADMIN_LOGIN' ? 'ADMIN_LOGIN' : authView === 'POLICE_LOGIN' ? 'POLICE_LOGIN' : 'HOTEL_LOGIN'}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex">
      {/* Left Sidebar Navigation */}
      <Sidebar 
        user={currentUser}
        hotel={currentHotel}
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
          hotel={currentHotel}
          onLogout={handleLogout}
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          openExpressModal={() => handleOpenExpressModal()}
          openNewCheckInModal={handleOpenNewCheckInModal}
          openPoliceModal={handleOpenPoliceModal}
          openCounterQRModal={() => setIsCounterQRModalOpen(true)}
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
              user={currentUser}
              hotel={currentHotel}
            />
          )}

          {activeTab === 'express-checkin' && (
            <ExpressCheckInView
              vacantRooms={vacantRooms}
              onCheckInComplete={handleCheckInComplete}
              switchToNewGuest={() => handleTabChange('new-checkin')}
              hotel={currentHotel}
            />
          )}

          {activeTab === 'new-checkin' && (
            <NewCheckInView
              vacantRooms={vacantRooms}
              onCheckInComplete={handleCheckInComplete}
              hotel={currentHotel}
            />
          )}

          {activeTab === 'database' && (
            <GuestDatabaseView hotelId={currentHotel?.id || currentUser?.hotelId} />
          )}

          {activeTab === 'ledger' && (
            <GuestLedger 
              openExpressModal={(roomNo, phone) => handleOpenExpressModal(roomNo)}
              hotelId={currentHotel?.id || currentUser?.hotelId}
            />
          )}

          {activeTab === 'police-log' && (
            <PoliceReportView 
              hotelId={currentHotel?.id || currentUser?.hotelId} 
              hotel={currentHotel} 
            />
          )}

          {activeTab === 'billing' && (
            <BillingArchiveView 
              onViewReceipt={handleViewReceipt}
              hotelId={currentHotel?.id || currentUser?.hotelId}
              hotel={currentHotel}
            />
          )}

          {activeTab === 'room-mgmt' && (
            <RoomManagementView 
              rooms={rooms}
              hotel={currentHotel}
              onRoomStatusChange={handleRoomStatusChange}
              onRoomTariffChange={handleRoomTariffChange}
              onAddRoom={handleAddRoom}
              onDeleteRoom={handleDeleteRoom}
              refreshData={() => refreshData(currentUser)}
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
        hotel={currentHotel}
      />

      <NewCheckInForm 
        isOpen={isNewCheckInModalOpen}
        onClose={() => setIsNewCheckInModalOpen(false)}
        vacantRooms={vacantRooms}
        onCheckInComplete={handleCheckInComplete}
        hotel={currentHotel}
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

      <CheckOutModal
        isOpen={isCheckOutModalOpen}
        onClose={() => {
          setIsCheckOutModalOpen(false);
          setStayToCheckout(null);
        }}
        stay={stayToCheckout}
        onConfirmCheckOut={handleConfirmCheckOut}
      />

      <CounterQRModal
        isOpen={isCounterQRModalOpen}
        onClose={() => setIsCounterQRModalOpen(false)}
        hotel={currentHotel}
      />
    </div>
  );
}

