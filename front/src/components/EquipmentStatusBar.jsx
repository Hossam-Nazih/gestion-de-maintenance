import React, { useState, useEffect } from 'react';
import './EquipmentStatusBar.css';

const EquipmentStatusBar = ({ equipmentStatuses }) => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Filtrer les équipements en arrêt ou récemment réparés
    const currentAlerts = equipmentStatuses.filter(equipment => 
      equipment.status === 'EN_ARRET' || 
      equipment.status === 'MAINTENANCE' || 
      equipment.status === 'REPARE_RECENT'
    );
    setAlerts(currentAlerts);
  }, [equipmentStatuses]);

  const getStatusInfo = (status) => {
    switch (status) {
      case 'EN_ARRET':
        return {
          color: '#dc2626',
          bgColor: '#fef2f2',
          icon: '🚨',
          text: 'EN ARRÊT',
          message: 'Équipement hors service'
        };
      case 'MAINTENANCE':
        return {
          color: '#f59e0b',
          bgColor: '#fffbeb',
          icon: '🔧',
          text: 'MAINTENANCE',
          message: 'Intervention en cours'
        };
      case 'REPARE_RECENT':
        return {
          color: '#10b981',
          bgColor: '#f0fdf4',
          icon: '✅',
          text: 'DISPONIBLE',
          message: 'Équipement réparé et opérationnel'
        };
      default:
        return {
          color: '#6b7280',
          bgColor: '#f9fafb',
          icon: 'ℹ️',
          text: 'INFO',
          message: 'Information'
        };
    }
  };

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="equipment-status-bar">
      <div className="status-alerts">
        {alerts.map((equipment, index) => {
          const statusInfo = getStatusInfo(equipment.status);
          return (
            <div
              key={index}
              className="status-alert"
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
              </div>
              <button 
                className="alert-close"
                onClick={() => setAlerts(alerts.filter((_, i) => i !== index))}
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