import React, { useState, useEffect } from 'react';
import AuthInterface from './components/AuthInterface';
import InterfaceSelector from './components/InterfaceSelector';
import OperatorInterface from './components/OperatorInterface';
import MaintenanceInterface from './components/MaintenanceInterface';
import AnalyticsInterface from './components/AnalyticsInterface';
import NotificationsInterface from './components/NotificationsInterface';
import EquipmentStatusBar from './components/EquipmentStatusBar';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [selectedInterface, setSelectedInterface] = useState(null);
  const [activeTab, setActiveTab] = useState('operator');
  const [equipmentStatuses, setEquipmentStatuses] = useState([]);

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté (pour maintenance)
    const savedUser = localStorage.getItem('carriprefa_user');
    const savedInterface = localStorage.getItem('carriprefa_interface');
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    
    if (savedInterface) {
      setSelectedInterface(savedInterface);
    }

    // Simuler les mises à jour d'état des équipements
    const interval = setInterval(() => {
      setEquipmentStatuses(prev => {
        const updated = [...prev];
        // Simuler des changements d'état aléatoires
        const randomIndex = Math.floor(Math.random() * updated.length);
        const statuses = ['OPERATIONNEL', 'EN_ARRET', 'MAINTENANCE', 'REPARE_RECENT'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        if (updated[randomIndex]) {
          updated[randomIndex] = {
            ...updated[randomIndex],
            status: randomStatus,
            estimatedRepairTime: randomStatus === 'OPERATIONNEL' ? null : '1h 30min'
          };
        }
        
        return updated;
      });
    }, 30000); // Mise à jour toutes les 30 secondes

    return () => clearInterval(interval);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleInterfaceSelect = (interfaceType) => {
    // Always set the selected interface first
    setSelectedInterface(interfaceType);
    
    // If it's maintenance interface and user is authenticated, save to localStorage
    if (interfaceType === 'maintenance' && user) {
      localStorage.setItem('carriprefa_interface', interfaceType);
    }
    
    // If it's demandeur interface, save to localStorage
    if (interfaceType === 'demandeur') {
      localStorage.setItem('carriprefa_interface', interfaceType);
    }
    
    // Définir l'onglet par défaut selon l'interface
    if (interfaceType === 'demandeur') {
      setActiveTab('operator');
    } else if (interfaceType === 'maintenance') {
      setActiveTab('maintenance');
    } else if (interfaceType === 'admin') {
      setActiveTab('analytics');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('carriprefa_user');
    localStorage.removeItem('carriprefa_interface');
    setUser(null);
    setSelectedInterface(null);
    setActiveTab('operator');
  };

  const handleBackToSelection = () => {
    localStorage.removeItem('carriprefa_interface');
    setSelectedInterface(null);
  };

  // Si interface maintenance sélectionnée mais pas d'utilisateur connecté, afficher l'authentification
  if (selectedInterface === 'maintenance' && !user) {
    return <AuthInterface onLogin={handleLogin} />;
  }

  // Si pas d'interface sélectionnée, afficher le sélecteur
  if (!selectedInterface) {
    return <InterfaceSelector onSelect={handleInterfaceSelect} user={user} />;
  }

  // Définir les onglets selon l'interface sélectionnée
  const getTabsForInterface = () => {
    switch (selectedInterface) {
      case 'demandeur':
        return [
          { 
            id: 'operator', 
            label: 'Nouvelle Demande', 
            icon: '📝',
          },
          { 
            id: 'notifications', 
            label: 'Mes Notifications', 
            icon: '🔔',
          },
        ];
      case 'maintenance':
        return [
          { 
            id: 'maintenance', 
            label: 'Demandes d\'Intervention', 
            icon: '🔧',
          },
        ];
      case 'admin':
        return [
          { 
            id: 'operator', 
            label: 'Interface Demandeur', 
            icon: '📝',
          },
          { 
            id: 'maintenance', 
            label: 'Équipe Maintenance', 
            icon: '🔧',
          },
          { 
            id: 'analytics', 
            label: 'Tableau de Bord', 
            icon: '📊',
          },
          { 
            id: 'notifications', 
            label: 'Notifications', 
            icon: '🔔',
          },
        ];
      default:
        return [];
    }
  };

  const availableTabs = getTabsForInterface();

  const renderContent = () => {
    switch (activeTab) {
      case 'operator':
        return <OperatorInterface user={user} equipmentStatuses={equipmentStatuses} />;
      case 'maintenance':
        return <MaintenanceInterface user={user} onStatusUpdate={setEquipmentStatuses} />;
      case 'analytics':
        return <AnalyticsInterface user={user} />;
      case 'notifications':
        return <NotificationsInterface user={user} />;
      default:
        return <OperatorInterface user={user} equipmentStatuses={equipmentStatuses} />;
    }
  };

  const getInterfaceTitle = () => {
    switch (selectedInterface) {
      case 'demandeur':
        return 'Interface Demandeur';
      case 'maintenance':
        return 'Interface Maintenance';
      case 'admin':
        return 'Interface Administrateur';
      default:
        return 'GMAO';
    }
  };

  const showUserActions = selectedInterface === 'maintenance' || selectedInterface === 'admin';

  return (
    <div className="app">
      {/* Afficher les notifications uniquement pour l'interface demandeur */}
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