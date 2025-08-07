import React, { useState, useEffect } from 'react';
import AuthInterface from './components/AuthInterface';
import InterfaceSelector from './components/InterfaceSelector';
import OperatorInterface from './components/OperatorInterface';
import MaintenanceInterface from './components/MaintenanceInterface';
import AnalyticsInterface from './components/AnalyticsInterface';
import NotificationsInterface from './components/NotificationsInterface';
import EquipmentStatusBar from './components/EquipmentStatusBar';
import { useQuery } from '@tanstack/react-query';
import { authApi, equipmentApi } from './api';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [selectedInterface, setSelectedInterface] = useState(null);
  const [activeTab, setActiveTab] = useState('operator');
  const [showAuth, setShowAuth] = useState(false);
  const [isNavbarHidden, setIsNavbarHidden] = useState(false);

  // Detect scroll direction to hide/show navbar
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY && currentScrollY > 100;

      setIsNavbarHidden(isScrollingDown);
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { data: equipmentStatuses = [], refetch: refetchEquipmentStatuses } = useQuery({
    queryKey: ['equipmentStatuses'],
    queryFn: async () => {
      try {
        const response = await equipmentApi.getEquipmentsStatus();
        return response.data.equipments?.map(eq => ({
          id: eq.equipment_id,
          name: eq.equipment_name,
          location: eq.location,
          status: eq.current_status?.toUpperCase(),
          estimatedRepairTime: null
        })) || [];
      } catch (error) {
        console.error('Error fetching equipment statuses:', error);
        return [];
      }
    },
    refetchInterval: 30000,
    retry: 1,
    enabled: selectedInterface !== null
  });

  // UPDATED: Restore user, interface, and active tab from localStorage on component mount
  useEffect(() => {
    const savedUser = localStorage.getItem('carriprefa_user');
    const savedInterface = localStorage.getItem('carriprefa_interface');
    const savedActiveTab = localStorage.getItem('carriprefa_active_tab'); // NEW: Get saved tab
    
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);

        if (parsedUser.token) {
          authApi.getProfile()
            .catch(() => handleLogout());
        }
      } catch (e) {
        console.error('Error parsing saved user:', e);
        localStorage.removeItem('carriprefa_user');
      }
    }

    if (savedInterface) {
      setSelectedInterface(savedInterface);
      
      // NEW: Restore the active tab if it was saved
      if (savedActiveTab) {
        setActiveTab(savedActiveTab);
      } else {
        // Fallback to default tab based on interface type
        switch (savedInterface) {
          case 'demandeur':
            setActiveTab('operator');
            break;
          case 'maintenance':
            setActiveTab('maintenance');
            break;
          case 'admin':
            setActiveTab('analytics');
            break;
          default:
            setActiveTab('operator');
        }
      }
    }
  }, []);

  // Get available tabs for current interface
  const getTabsForInterface = () => {
    const tabs = [];

    if (selectedInterface === 'demandeur' || selectedInterface === 'admin') {
      tabs.push({ id: 'operator', label: selectedInterface === 'admin' ? 'Interface Demandeur' : 'Nouvelle Demande', icon: '📝' });
    }

    if (selectedInterface === 'maintenance' || selectedInterface === 'admin') {
      tabs.push({ id: 'maintenance', label: 'Équipe Maintenance', icon: '🔧' });
    }

    if (selectedInterface === 'admin') {
      tabs.push({ id: 'analytics', label: 'Tableau de Bord', icon: '📊' });
    }

    if (selectedInterface === 'demandeur' || selectedInterface === 'admin') {
      tabs.push({ id: 'notifications', label: 'Notifications', icon: '🔔' });
    }

    return tabs;
  };

  const availableTabs = getTabsForInterface();

  // FIXED: Always call this useEffect (not conditionally) to validate tabs
  useEffect(() => {
    // Only validate if we have both interface and available tabs
    if (selectedInterface && availableTabs.length > 0) {
      const isTabAvailable = availableTabs.some(tab => tab.id === activeTab);
      if (!isTabAvailable) {
        const firstAvailableTab = availableTabs[0].id;
        setActiveTab(firstAvailableTab);
        localStorage.setItem('carriprefa_active_tab', firstAvailableTab);
      }
    }
  }, [selectedInterface, availableTabs.length, activeTab]); // Depend on length instead of full array

  const handleLogin = async (userData) => {
    try {
      setUser(userData);
      localStorage.setItem('carriprefa_user', JSON.stringify(userData));
      setShowAuth(false);

      if (selectedInterface === 'maintenance') {
        setActiveTab('maintenance');
        localStorage.setItem('carriprefa_active_tab', 'maintenance'); // NEW: Save tab
      }
    } catch (error) {
      console.error('Login error:', error);
      alert(`Erreur de connexion: ${error.response?.data?.detail || error.message}`);
      throw error;
    }
  };

  const handleInterfaceSelect = (interfaceType) => {
    if (interfaceType === 'maintenance' && !user) {
      setSelectedInterface(interfaceType);
      setShowAuth(true);
      localStorage.setItem('carriprefa_interface', interfaceType);
      return;
    }

    setSelectedInterface(interfaceType);
    setShowAuth(false);
    localStorage.setItem('carriprefa_interface', interfaceType);

    // NEW: Set and save the appropriate default tab for the interface
    let defaultTab;
    switch (interfaceType) {
      case 'demandeur':
        defaultTab = 'operator';
        break;
      case 'maintenance':
        defaultTab = 'maintenance';
        break;
      case 'admin':
        defaultTab = 'analytics';
        break;
      default:
        defaultTab = 'operator';
    }
    
    setActiveTab(defaultTab);
    localStorage.setItem('carriprefa_active_tab', defaultTab); // NEW: Save tab
  };

  const handleLogout = async () => {
    try {
      if (user?.token) {
        await authApi.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('carriprefa_user');
      localStorage.removeItem('carriprefa_interface');
      localStorage.removeItem('carriprefa_active_tab'); // NEW: Clear saved tab
      setUser(null);
      setSelectedInterface(null);
      setActiveTab('operator');
      setShowAuth(false);
    }
  };

  const handleBackToSelection = () => {
    localStorage.removeItem('carriprefa_interface');
    localStorage.removeItem('carriprefa_active_tab'); // NEW: Clear saved tab
    setSelectedInterface(null);
    setShowAuth(false);
  };

  const handleBackFromAuth = () => {
    setShowAuth(false);
    if (selectedInterface === 'maintenance') {
      setSelectedInterface(null);
      localStorage.removeItem('carriprefa_interface');
      localStorage.removeItem('carriprefa_active_tab'); // NEW: Clear saved tab
    }
  };

  // NEW: Enhanced tab change handler that saves the active tab
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    localStorage.setItem('carriprefa_active_tab', tabId); // NEW: Save tab on change
  };

  // Helper function to get user display name
  const getUserDisplayName = (user) => {
    if (!user) return '';
    
    // Extract name from email if it follows a pattern like firstname.lastname@domain.com
    if (user.email && user.email.includes('@')) {
      const emailPart = user.email.split('@')[0];
      if (emailPart.includes('.')) {
        const parts = emailPart.split('.');
        return parts.map(part => 
          part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        ).join(' ');
      }
    }
    
    // Fallback to username
    return user.username || user.email;
  };

  // Helper function to get user role display
  const getUserRoleDisplay = (user) => {
    if (!user || !user.role) return '';
    
    switch (user.role.toLowerCase()) {
      case 'technicien':
        return 'Technicien';
      case 'admin':
        return 'Administrateur';
      case 'operator':
        return 'Opérateur';
      default:
        return user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase();
    }
  };

  if (showAuth) {
    return <AuthInterface onLogin={handleLogin} onBack={handleBackFromAuth} />;
  }

  if (!selectedInterface) {
    return <InterfaceSelector onSelect={handleInterfaceSelect} user={user} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'operator':
        return (
          <OperatorInterface 
            user={user} 
            equipmentStatuses={equipmentStatuses} 
            onStatusUpdate={refetchEquipmentStatuses}
          />
        );
      case 'maintenance':
        return (
          <MaintenanceInterface 
            user={user} 
            onStatusUpdate={refetchEquipmentStatuses}
          />
        );
      case 'analytics':
        return <AnalyticsInterface user={user} />;
      case 'notifications':
        return <NotificationsInterface user={user} />;
      default:
        return (
          <OperatorInterface 
            user={user} 
            equipmentStatuses={equipmentStatuses}
            onStatusUpdate={refetchEquipmentStatuses}
          />
        );
    }
  };

  const getInterfaceTitle = () => {
    switch (selectedInterface) {
      case 'demandeur': return 'Interface Demandeur';
      case 'maintenance': return 'Interface Maintenance';
      case 'admin': return 'Interface Administrateur';
      default: return 'GMAO';
    }
  };

  const showUserActions = selectedInterface === 'maintenance' || selectedInterface === 'admin';

  return (
    <div className="app">
      {/* Only show the fixed EquipmentStatusBar for non-demandeur interfaces */}
      {selectedInterface !== 'demandeur' && (
        <EquipmentStatusBar equipmentStatuses={equipmentStatuses} showAsNotification={false} />
      )}
      
      <nav className={`navbar ${isNavbarHidden ? 'hide-navbar' : ''}`}>
        <div className="nav-brand">
          <div className="company-header">
            <div className="company-logo">🏗️</div>
            <div className="company-info">
              <h1>CARRIPREFA</h1>
              <p>SOCIÉTÉ D'EXPLOITATION DE CARRIÈRES ET PRÉFABRIQUÉS</p>
            </div>
          </div>
        </div>
        
        <div className="nav-content">
          <div className="interface-info">
            <h3>{getInterfaceTitle()}</h3>
          </div>
          
          <div className="nav-tabs">
            {availableTabs.map((tab) => (
              <button
                key={tab.id}
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.id)} // UPDATED: Use new handler
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>
          
          <div className="user-actions">
            {showUserActions && user && (
              <div className="user-info">
                <div className="user-details">
                  <span className="user-name">{getUserDisplayName(user)}</span>
                  <span className="user-role">{getUserRoleDisplay(user)}</span>
                </div>
              </div>
            )}
            <button className="change-interface-button" onClick={handleBackToSelection}>
              🔄 Changer Interface
            </button>
            {showUserActions && user && (
              <button className="logout-button" onClick={handleLogout}>
                🚪 Déconnexion
              </button>
            )}
          </div>
        </div>
      </nav>
      
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;