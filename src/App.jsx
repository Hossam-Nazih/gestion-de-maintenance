import React, { useState, useEffect } from 'react';
import AuthInterface from './components/AuthInterface';
import InterfaceSelector from './components/InterfaceSelector';
import OperatorInterface from './components/OperatorInterface';
import MaintenanceInterface from './components/MaintenanceInterface';
import AnalyticsInterface from './components/AnalyticsInterface';
import NotificationsInterface from './components/NotificationsInterface';
import EquipmentStatusBar from './components/EquipmentStatusBar';
import { useQuery } from '@tanstack/react-query';
import { authApi, equipmentApi, technicienApi } from './api';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [selectedInterface, setSelectedInterface] = useState(null);
  const [activeTab, setActiveTab] = useState('operator');

  // Fetch equipment statuses from API
  const { data: equipmentStatuses = [], refetch: refetchEquipmentStatuses } = useQuery({
    queryKey: ['equipmentStatuses'],
    queryFn: async () => {
      const response = await equipmentApi.getEquipmentsStatus();
      return response.data.equipments.map(eq => ({
        id: eq.equipment_id,
        name: eq.equipment_name,
        location: eq.location,
        status: eq.current_status.toUpperCase(),
        estimatedRepairTime: null // Will be updated by maintenance interface
      }));
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('carriprefa_user');
    const savedInterface = localStorage.getItem('carriprefa_interface');
    
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        
        // Verify session is still valid
        authApi.getProfile()
          .catch(() => {
            // If session is invalid, logout
            handleLogout();
          });
      } catch (e) {
        localStorage.removeItem('carriprefa_user');
      }
    }
    
    if (savedInterface) {
      setSelectedInterface(savedInterface);
    }
  }, []);

  const handleLogin = async (userData) => {
    try {
      // Verify login with backend
      const response = await authApi.login({
        username: userData.email,
        password: userData.password
      });
      
      const user = {
        ...response.data.user,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role
      };
      
      setUser(user);
      localStorage.setItem('carriprefa_user', JSON.stringify(user));
      
      // For new registrations
      if (userData.isRegistration) {
        alert('Inscription réussie ! Vous êtes maintenant connecté.');
      }
    } catch (error) {
      alert(`Erreur de connexion: ${error.response?.data?.detail || error.message}`);
      throw error;
    }
  };

  const handleInterfaceSelect = (interfaceType) => {
    setSelectedInterface(interfaceType);
    localStorage.setItem('carriprefa_interface', interfaceType);
    
    // Set default tab based on interface
    switch (interfaceType) {
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
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('carriprefa_user');
      localStorage.removeItem('carriprefa_interface');
      setUser(null);
      setSelectedInterface(null);
      setActiveTab('operator');
    }
  };

  const handleBackToSelection = () => {
    localStorage.removeItem('carriprefa_interface');
    setSelectedInterface(null);
  };

  // If maintenance interface selected but no user logged in, show auth
  if (selectedInterface === 'maintenance' && !user) {
    return <AuthInterface onLogin={handleLogin} />;
  }

  // If no interface selected, show selector
  if (!selectedInterface) {
    return <InterfaceSelector onSelect={handleInterfaceSelect} user={user} />;
  }

  // Define tabs based on selected interface
  const getTabsForInterface = () => {
    const tabs = [];
    
    if (selectedInterface === 'demandeur' || selectedInterface === 'admin') {
      tabs.push({ 
        id: 'operator', 
        label: selectedInterface === 'admin' ? 'Interface Demandeur' : 'Nouvelle Demande', 
        icon: '📝',
      });
    }
    
    if (selectedInterface === 'maintenance' || selectedInterface === 'admin') {
      tabs.push({ 
        id: 'maintenance', 
        label: 'Équipe Maintenance', 
        icon: '🔧',
      });
    }
    
    if (selectedInterface === 'admin') {
      tabs.push({ 
        id: 'analytics', 
        label: 'Tableau de Bord', 
        icon: '📊',
      });
    }
    
    if (selectedInterface === 'demandeur' || selectedInterface === 'admin') {
      tabs.push({ 
        id: 'notifications', 
        label: 'Notifications', 
        icon: '🔔',
      });
    }
    
    return tabs;
  };

  const availableTabs = getTabsForInterface();

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
      {selectedInterface === 'demandeur' && (
        <EquipmentStatusBar equipmentStatuses={equipmentStatuses} />
      )}
      
      <nav className="navbar">
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
                onClick={() => setActiveTab(tab.id)}
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
                  <span className="user-name">{user.firstName} {user.lastName}</span>
                  <span className="user-role">
                    {user.role === 'OPERATOR' ? 'Opérateur' : 
                     user.role === 'MAINTENANCE' ? 'Maintenance' : 'Administrateur'}
                  </span>
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