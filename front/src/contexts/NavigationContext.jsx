// src/contexts/NavigationContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const NavigationContext = createContext();

export const useNavigation = () => {
    const context = useContext(NavigationContext);
    if (!context) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
};

export const NavigationProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [selectedInterface, setSelectedInterface] = useState(null);
    const [activeTab, setActiveTab] = useState('operator');
    const [navigationHistory, setNavigationHistory] = useState([]);

    useEffect(() => {
        // Load saved state from localStorage
        const savedUser = localStorage.getItem('carriprefa_user');
        const savedInterface = localStorage.getItem('carriprefa_interface');
        const savedTab = localStorage.getItem('carriprefa_active_tab');

        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                localStorage.removeItem('carriprefa_user');
            }
        }

        if (savedInterface) {
            setSelectedInterface(savedInterface);
        }

        if (savedTab) {
            setActiveTab(savedTab);
        }
    }, []);

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('carriprefa_user', JSON.stringify(userData));
        addToHistory('login', { user: userData });
    };

    const logout = () => {
        setUser(null);
        setSelectedInterface(null);
        setActiveTab('operator');
        localStorage.removeItem('carriprefa_user');
        localStorage.removeItem('carriprefa_interface');
        localStorage.removeItem('carriprefa_active_tab');
        setNavigationHistory([]);
        addToHistory('logout');
    };

    const selectInterface = (interfaceType) => {
        setSelectedInterface(interfaceType);
        localStorage.setItem('carriprefa_interface', interfaceType);
        
        // Set default tab based on interface
        const defaultTab = getDefaultTabForInterface(interfaceType);
        setActiveTab(defaultTab);
        localStorage.setItem('carriprefa_active_tab', defaultTab);
        
        addToHistory('interface_select', { interface: interfaceType, tab: defaultTab });
    };

    const changeTab = (tabId) => {
        setActiveTab(tabId);
        localStorage.setItem('carriprefa_active_tab', tabId);
        addToHistory('tab_change', { tab: tabId });
    };

    const backToInterfaceSelection = () => {
        setSelectedInterface(null);
        localStorage.removeItem('carriprefa_interface');
        localStorage.removeItem('carriprefa_active_tab');
        addToHistory('back_to_interface_selection');
    };

    const addToHistory = (action, data = {}) => {
        const historyEntry = {
            id: Date.now(),
            action,
            data,
            timestamp: new Date().toISOString(),
            interface: selectedInterface,
            tab: activeTab,
        };
        
        setNavigationHistory(prev => [...prev.slice(-9), historyEntry]); // Keep last 10 entries
    };

    const getDefaultTabForInterface = (interfaceType) => {
        switch (interfaceType) {
            case 'demandeur':
                return 'operator';
            case 'maintenance':
                return 'maintenance';
            case 'admin':
                return 'analytics';
            default:
                return 'operator';
        }
    };

    const getAvailableTabsForInterface = (interfaceType) => {
        const tabs = [];
        
        if (interfaceType === 'demandeur' || interfaceType === 'admin') {
            tabs.push({ 
                id: 'operator', 
                label: interfaceType === 'admin' ? 'Interface Demandeur' : 'Nouvelle Demande', 
                icon: '📝',
                requiredAuth: false,
            });
        }
        
        if (interfaceType === 'maintenance' || interfaceType === 'admin') {
            tabs.push({ 
                id: 'maintenance', 
                label: 'Équipe Maintenance', 
                icon: '🔧',
                requiredAuth: true,
            });
        }
        
        if (interfaceType === 'admin') {
            tabs.push({ 
                id: 'analytics', 
                label: 'Tableau de Bord', 
                icon: '📊',
                requiredAuth: true,
            });
        }
        
        if (interfaceType === 'demandeur' || interfaceType === 'admin') {
            tabs.push({ 
                id: 'notifications', 
                label: 'Notifications', 
                icon: '🔔',
                requiredAuth: false,
            });
        }
        
        return tabs;
    };

    const canAccessTab = (tabId, interfaceType) => {
        const tabs = getAvailableTabsForInterface(interfaceType);
        const tab = tabs.find(t => t.id === tabId);
        
        if (!tab) return false;
        if (!tab.requiredAuth) return true;
        return !!user;
    };

    const getInterfaceTitle = (interfaceType) => {
        switch (interfaceType) {
            case 'demandeur': return 'Interface Demandeur';
            case 'maintenance': return 'Interface Maintenance';
            case 'admin': return 'Interface Administrateur';
            default: return 'GMAO';
        }
    };

    const value = {
        // State
        user,
        selectedInterface,
        activeTab,
        navigationHistory,
        
        // Actions
        login,
        logout,
        selectInterface,
        changeTab,
        backToInterfaceSelection,
        
        // Helpers
        getAvailableTabsForInterface,
        getDefaultTabForInterface,
        canAccessTab,
        getInterfaceTitle,
        
        // Computed
        isAuthenticated: !!user,
        showUserActions: selectedInterface === 'maintenance' || selectedInterface === 'admin',
        availableTabs: selectedInterface ? getAvailableTabsForInterface(selectedInterface) : [],
    };

    return (
        <NavigationContext.Provider value={value}>
            {children}
        </NavigationContext.Provider>
    );
};