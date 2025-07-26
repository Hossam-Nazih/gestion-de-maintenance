import React, { useState, useEffect } from 'react';
import './EquipmentStatusBar.css';
import { technicienApi } from '../api';

const EquipmentStatusBar = ({ equipmentStatuses: propEquipmentStatuses }) => {
  const [alerts, setAlerts] = useState([]);
  const [equipmentStatuses, setEquipmentStatuses] = useState(propEquipmentStatuses || []);
  const [loading, setLoading] = useState(!propEquipmentStatuses);
  const [error, setError] = useState(null);

  // Fetch data from API if not provided as props
  useEffect(() => {
    const fetchEquipmentStatus = async () => {
      if (propEquipmentStatuses) {
        return; // Use props data if available
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await technicienApi.getInterventionsStatusSimple();
        
        // Transform API response to match component structure
        const transformedData = response.data.map(item => ({
          id: item.id,
          name: item.equipmentName || item.name || `Équipement ${item.id}`,
          status: item.status,
          location: item.location || item.zone || 'Zone non spécifiée',
          estimatedRepairTime: item.estimatedRepairTime || item.duration,
          lastUpdate: item.lastUpdate || new Date().toISOString(),
          priority: item.priority || 'normal'
        }));
        
        setEquipmentStatuses(transformedData);
      } catch (err) {
        console.error('Erreur lors de la récupération du statut des équipements:', err);
        setError('Impossible de charger le statut des équipements');
        
        // Fallback data for development/testing
        setEquipmentStatuses([
          {
            id: 1,
            name: 'Concasseur Principal',
            status: 'EN_ARRET',
            location: 'Zone A - Carrière',
            estimatedRepairTime: '2h 30min',
            priority: 'high'
          },
          {
            id: 2, 
            name: 'Convoyeur Belt 3',
            status: 'MAINTENANCE',
            location: 'Zone B - Transport',
            estimatedRepairTime: '45min',
            priority: 'medium'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchEquipmentStatus();
  }, [propEquipmentStatuses]);

  // Filter equipment for alerts
  useEffect(() => {
    const currentAlerts = equipmentStatuses.filter(equipment =>
      equipment.status === 'EN_ARRET' ||
      equipment.status === 'MAINTENANCE' ||
      equipment.status === 'REPARE_RECENT' ||
      equipment.status === 'ALERTE'
    );
    setAlerts(currentAlerts);
  }, [equipmentStatuses]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (!propEquipmentStatuses) {
      const interval = setInterval(async () => {
        try {
          const response = await technicienApi.getInterventionsStatusSimple();
          const transformedData = response.data.map(item => ({
            id: item.id,
            name: item.equipmentName || item.name || `Équipement ${item.id}`,
            status: item.status,
            location: item.location || item.zone || 'Zone non spécifiée',
            estimatedRepairTime: item.estimatedRepairTime || item.duration,
            lastUpdate: item.lastUpdate || new Date().toISOString(),
            priority: item.priority || 'normal'
          }));
          setEquipmentStatuses(transformedData);
        } catch (err) {
          console.error('Erreur lors de la mise à jour automatique:', err);
        }
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [propEquipmentStatuses]);

  const getStatusInfo = (status, priority = 'normal') => {
    const baseInfo = {
      'EN_ARRET': {
        color: '#dc2626',
        bgColor: '#fef2f2',
        icon: '🚨',
        text: 'EN ARRÊT',
        message: 'Équipement hors service'
      },
      'MAINTENANCE': {
        color: '#f59e0b',
        bgColor: '#fffbeb',
        icon: '🔧',
        text: 'MAINTENANCE',
        message: 'Intervention en cours'
      },
      'REPARE_RECENT': {
        color: '#10b981',
        bgColor: '#f0fdf4',
        icon: '✅',
        text: 'DISPONIBLE',
        message: 'Équipement réparé et opérationnel'
      },
      'ALERTE': {
        color: '#ef4444',
        bgColor: '#fef2f2',
        icon: '⚠️',
        text: 'ALERTE',
        message: 'Attention requise'
      }
    };

    const info = baseInfo[status] || {
      color: '#6b7280',
      bgColor: '#f9fafb',
      icon: 'ℹ️',
      text: 'INFO',
      message: 'Information'
    };

    // Adjust colors based on priority
    if (priority === 'high') {
      info.color = '#dc2626';
      info.bgColor = '#fef2f2';
    } else if (priority === 'critical') {
      info.color = '#991b1b';
      info.bgColor = '#fef2f2';
    }

    return info;
  };

  const dismissAlert = (alertIndex) => {
    setAlerts(alerts.filter((_, i) => i !== alertIndex));
  };

  const dismissAllAlerts = () => {
    setAlerts([]);
  };

  if (loading) {
    return (
      <div className="equipment-status-bar loading">
        <div className="loading-indicator">
          <div className="spinner"></div>
          <span>Chargement du statut des équipements...</span>
        </div>
      </div>
    );
  }

  if (error && alerts.length === 0) {
    return (
      <div className="equipment-status-bar error">
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button 
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="equipment-status-bar">
      <div className="status-header">
        <div className="alerts-count">
          <span className="count-badge">{alerts.length}</span>
          <span>Alerte{alerts.length > 1 ? 's' : ''} actuelle{alerts.length > 1 ? 's' : ''}</span>
        </div>
        {alerts.length > 1 && (
          <button className="dismiss-all" onClick={dismissAllAlerts}>
            Tout masquer
          </button>
        )}
      </div>
      
      <div className="status-alerts">
        {alerts.map((equipment, index) => {
          const statusInfo = getStatusInfo(equipment.status, equipment.priority);
          return (
            <div
              key={equipment.id || index}
              className={`status-alert priority-${equipment.priority || 'normal'}`}
              style={{
                backgroundColor: statusInfo.bgColor,
                borderColor: statusInfo.color,
                color: statusInfo.color
              }}
            >
              <div className="alert-icon">{statusInfo.icon}</div>
              <div className="alert-content">
                <div className="alert-header">
                  <span className="equipment-name">{equipment.name}</span>
                  <span className="status-badge" style={{ backgroundColor: statusInfo.color }}>
                    {statusInfo.text}
                  </span>
                </div>
                <div className="alert-message">
                  {statusInfo.message} - {equipment.location}
                </div>
                {equipment.estimatedRepairTime && (
                  <div className="repair-time">
                    ⏱️ Temps estimé: {equipment.estimatedRepairTime}
                  </div>
                )}
                {equipment.lastUpdate && (
                  <div className="last-update">
                    🕒 Mis à jour: {new Date(equipment.lastUpdate).toLocaleTimeString('fr-FR')}
                  </div>
                )}
              </div>
              <button
                className="alert-close"
                onClick={(e) => {
                  e.stopPropagation();
                  dismissAlert(index);
                }}
                title="Masquer cette alerte"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EquipmentStatusBar;