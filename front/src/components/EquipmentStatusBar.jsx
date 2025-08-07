import React, { useState, useEffect } from 'react';
import './EquipmentStatusBar.css';
import { technicienApi } from '../api';

const EquipmentStatusBar = ({ equipmentStatuses: propEquipmentStatuses, showAsNotification = true }) => {
  const [alerts, setAlerts] = useState([]);
  const [equipmentStatuses, setEquipmentStatuses] = useState(propEquipmentStatuses || []);
  const [loading, setLoading] = useState(!propEquipmentStatuses);
  const [error, setError] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationData, setNotificationData] = useState([]);
  const [activeNotifications, setActiveNotifications] = useState([]);

  // Fetch data from /tech/interventions-status-simple
  const fetchEquipmentStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching from /tech/interventions-status-simple...');
      
      // Try the technicienApi first
      let response;
      try {
        response = await technicienApi.getInterventionsStatusSimple();
        console.log('✅ technicienApi success:', response);
      } catch (apiError) {
        console.log('⚠️ technicienApi failed:', apiError);
        console.log('🔄 Trying direct fetch...');
        // Fallback to direct fetch
        const directResponse = await fetch('http://127.0.0.1:5000/api/tech/interventions-status-simple');
        if (!directResponse.ok) {
          throw new Error(`HTTP error! status: ${directResponse.status}`);
        }
        const directData = await directResponse.json();
        response = { data: directData };
        console.log('✅ Direct fetch success:', response);
      }
      
      console.log('📡 Raw API Response:', JSON.stringify(response, null, 2));
      
      // Handle different response formats
      let dataArray = response.data;
      console.log('📋 Initial dataArray:', dataArray);
      
      // Check if the response has an equipments array
      if (response.data && response.data.equipments && Array.isArray(response.data.equipments)) {
        dataArray = response.data.equipments;
        console.log('📋 Using equipments array:', dataArray);
      } else if (response.data && response.data.interventions && Array.isArray(response.data.interventions)) {
        dataArray = response.data.interventions;
        console.log('📋 Using interventions array:', dataArray);
      } else if (!Array.isArray(dataArray)) {
        console.log('📋 No valid array found, creating empty array');
        dataArray = [];
      }
      
      console.log('📋 Final dataArray before transform:', dataArray);
      
      // Transform API response to match component structure
      const transformedData = dataArray.map((item, index) => {
        console.log(`🔧 Transforming item ${index}:`, item);
        
        const transformed = {
          id: item.id || item.equipment_id || item.equipement_id || index,
          name: item.equipmentName || item.equipment_name || item.equipement_name || item.name || `Équipement ${item.id || index}`,
          status: item.status || item.current_status || item.intervention_status || item.statut,
          location: item.location || item.zone || item.localisation || 'Zone non spécifiée',
          estimatedRepairTime: item.estimatedRepairTime || item.estimated_repair_time || item.duration || item.duree_estimee,
          lastUpdate: item.lastUpdate || item.last_update || item.date_creation || new Date().toISOString(),
          priority: item.priority || item.priorite || 'normal'
        };
        
        console.log(`✅ Transformed item ${index}:`, transformed);
        return transformed;
      });
      
      console.log('✅ All transformed equipment data:', transformedData);
      setEquipmentStatuses(transformedData);

      // If showing as notification, check for equipment that are "en arrêt" (en_cours or en_attente)
      if (showAsNotification) {
        console.log('🔔 Checking for notification data...');
        console.log('📊 All equipment statuses:', transformedData.map(item => ({ name: item.name, status: item.status })));
        
        const equipmentsInArret = transformedData
          .filter(item => {
            const status = item.status;
            console.log(`🔧 Equipment "${item.name}": status = "${status}" (type: ${typeof status})`);
            
            // Filter for equipment that are in progress (en_cours) or waiting (en_attente)
            // These indicate equipment is "en arrêt" (stopped for maintenance)
            const isInArret = status === 'en_cours' || status === 'en_attente' || 
                             status === 'EN_COURS' || status === 'EN_ATTENTE' ||
                             // Also check for other common variations
                             status === 'encours' || status === 'en cours' ||
                             status === 'enattente' || status === 'en attente';
            
            console.log(`${isInArret ? '✅' : '❌'} Equipment "${item.name}" ${isInArret ? 'WILL' : 'will NOT'} be shown in notification`);
            
            return isInArret;
          })
          .slice(-3); // Get last 3 max

        console.log('🚨 Final equipments for notification:', equipmentsInArret);

        if (equipmentsInArret.length > 0) {
          console.log('✅ Setting notification data - will show notifications');
          
          // Create individual notifications for each equipment
          const notifications = equipmentsInArret.map((equipment, index) => ({
            id: `notification-${equipment.id}-${Date.now()}-${index}`,
            equipment: equipment,
            timestamp: Date.now()
          }));
          
          setActiveNotifications(notifications);
          
          // Auto-hide each notification after 9 seconds with staggered timing
          notifications.forEach((notification, index) => {
            setTimeout(() => {
              console.log(`⏰ Auto-hiding notification for ${notification.equipment.name}`);
              handleCloseIndividualNotification(notification.id);
            }, 9000 + (index * 1000)); // 9 seconds + stagger by 1 second each
          });
        } else {
          console.log('❌ No equipment found for notification');
          setActiveNotifications([]);
        }
      }

    } catch (err) {
      console.error('❌ Error fetching equipment status:', err);
      setError('Impossible de charger le statut des équipements');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and setup auto-refresh
  useEffect(() => {
    if (!propEquipmentStatuses) {
      fetchEquipmentStatus();
      
    }
  }, [propEquipmentStatuses, showAsNotification]);

  // Update equipment statuses when props change
  useEffect(() => {
    if (propEquipmentStatuses) {
      console.log('📥 Using equipment statuses from props:', propEquipmentStatuses);
      setEquipmentStatuses(propEquipmentStatuses);
      
      // If showing as notification and we have prop data, check for equipment in arrêt
      if (showAsNotification) {
        const equipmentsInArret = propEquipmentStatuses
          .filter(item => {
            const status = item.status;
            return status === 'en_cours' || status === 'en_attente' || 
                   status === 'EN_COURS' || status === 'EN_ATTENTE';
          })
          .slice(-3);

        if (equipmentsInArret.length > 0) {
          const notifications = equipmentsInArret.map((equipment, index) => ({
            id: `prop-notification-${equipment.id}-${Date.now()}-${index}`,
            equipment: equipment,
            timestamp: Date.now()
          }));
          setActiveNotifications(notifications);
          notifications.forEach((notification, index) => {
            setTimeout(() => handleCloseIndividualNotification(notification.id), 9000 + (index * 1000));
          });
        }
      }
    }
  }, [propEquipmentStatuses, showAsNotification]);

  // Filter equipment for alerts (for the original alert bar functionality)
  useEffect(() => {
    if (!showAsNotification) {
      console.log('🔧 Processing equipment statuses for alerts:', equipmentStatuses);
      
      if (!equipmentStatuses || !Array.isArray(equipmentStatuses)) {
        console.warn('⚠️ equipmentStatuses is not a valid array');
        setAlerts([]);
        return;
      }

      // Filter equipment in arrêt (en_cours or en_attente) or recently finished (terminee)
      const currentAlerts = equipmentStatuses.filter(equipment => {
        if (!equipment || !equipment.status) {
          console.warn('⚠️ Invalid equipment data:', equipment);
          return false;
        }
        
        const isAlert = equipment.status === 'en_cours' ||
                       equipment.status === 'en_attente' ||
                       equipment.status === 'EN_COURS' ||
                       equipment.status === 'EN_ATTENTE' ||
                       equipment.status === 'terminee' ||
                       equipment.status === 'TERMINEE';
        
        if (isAlert) {
          console.log(`🚨 Alert equipment: ${equipment.name} - ${equipment.status}`);
        }
        
        return isAlert;
      });
      
      console.log('📊 Total alerts found:', currentAlerts.length);
      setAlerts(currentAlerts);
    }
  }, [equipmentStatuses, showAsNotification]);

  const handleCloseNotification = () => {
    setActiveNotifications([]);
  };

  const handleCloseIndividualNotification = (notificationId) => {
    setActiveNotifications(current => 
      current.filter(notification => notification.id !== notificationId)
    );
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      'en_cours': {
        color: '#dc2626',
        bgColor: '#fef2f2',
        icon: '🔧',
        text: 'EN COURS',
        message: 'Intervention en cours - Équipement arrêté',
        className: 'status-en-cours'
      },
      'EN_COURS': {
        color: '#dc2626',
        bgColor: '#fef2f2',
        icon: '🔧',
        text: 'EN COURS',
        message: 'Intervention en cours - Équipement arrêté',
        className: 'status-en-cours'
      },
      'en_attente': {
        color: '#f59e0b',
        bgColor: '#fffbeb',
        icon: '⏳',
        text: 'EN ATTENTE',
        message: 'En attente d\'intervention - Équipement arrêté',
        className: 'status-en-attente'
      },
      'EN_ATTENTE': {
        color: '#f59e0b',
        bgColor: '#fffbeb',
        icon: '⏳',
        text: 'EN ATTENTE',
        message: 'En attente d\'intervention - Équipement arrêté',
        className: 'status-en-attente'
      },
      'terminee': {
        color: '#10b981',
        bgColor: '#f0fdf4',
        icon: '✅',
        text: 'TERMINÉE',
        message: 'Intervention terminée - Équipement disponible',
        className: 'status-terminee'
      },
      'TERMINEE': {
        color: '#10b981',
        bgColor: '#f0fdf4',
        icon: '✅',
        text: 'TERMINÉE',
        message: 'Intervention terminée - Équipement disponible',
        className: 'status-terminee'
      },
      'panne': {
        color: '#dc2626',
        bgColor: '#fef2f2',
        icon: '⚠️',
        text: 'EN PANNE',
        message: 'Équipement en panne - Réparation nécessaire',
        className: 'status-en-cours'
      },
      'PANNE': {
        color: '#dc2626',
        bgColor: '#fef2f2',
        icon: '⚠️',
        text: 'EN PANNE',
        message: 'Équipement en panne - Réparation nécessaire',
        className: 'status-en-cours'
      },
      'maintenance': {
        color: '#3b82f6',
        bgColor: '#eff6ff',
        icon: '🔩',
        text: 'MAINTENANCE',
        message: 'Maintenance préventive en cours',
        className: 'status-en-cours'
      },
      'MAINTENANCE': {
        color: '#3b82f6',
        bgColor: '#eff6ff',
        icon: '🔩',
        text: 'MAINTENANCE',
        message: 'Maintenance préventive en cours',
        className: 'status-en-cours'
      },
      'operationnel': {
        color: '#10b981',
        bgColor: '#f0fdf4',
        icon: '🟢',
        text: 'OPÉRATIONNEL',
        message: 'Équipement opérationnel',
        className: 'status-terminee'
      },
      'OPERATIONNEL': {
        color: '#10b981',
        bgColor: '#f0fdf4',
        icon: '🟢',
        text: 'OPÉRATIONNEL',
        message: 'Équipement opérationnel',
        className: 'status-terminee'
      }
    };

    return statusMap[status] || {
      color: '#6b7280',
      bgColor: '#f9fafb',
      icon: '❓',
      text: status?.toUpperCase() || 'INCONNU',
      message: 'Statut inconnu',
      className: 'status-unknown'
    };
  };

  const dismissAlert = (alertIndex) => {
    setAlerts(currentAlerts => currentAlerts.filter((_, i) => i !== alertIndex));
  };

  const dismissAllAlerts = () => {
    setAlerts([]);
  };

  // Render notification style (for OperatorInterface)
  if (showAsNotification) {
    console.log('🎨 Render check - activeNotifications:', activeNotifications);
    
    if (!activeNotifications || activeNotifications.length === 0) {
      console.log('❌ Not showing notifications - no active notifications');
      return null;
    }

    console.log('✅ Rendering individual notifications:', activeNotifications.length);

    return (
      <div className="equipment-notifications-container">
        {activeNotifications.map((notification, index) => {
          const { equipment } = notification;
          const statusInfo = getStatusInfo(equipment.status);
          
          console.log(`🏷️ Rendering notification ${index}:`, equipment.name, statusInfo.text);
          
          return (
            <div 
              key={notification.id} 
              className={`equipment-notification individual-notification ${statusInfo.className}`}
              tyle={{
                animationDelay: `${index * 0.3}s`,
                '--bg-color': statusInfo.bgColor,
                '--border-color': statusInfo.color
                   }}
            >
              <div className="notification-content">
                <div className="notification-icon">
                  {statusInfo.icon}
                </div>
                <div className="notification-text">
                  <div className="notification-header">
                    <div className="equipment-info">
                      <strong className="equipment-name">{equipment.name}</strong>
                      <div className="status-text">{statusInfo.message}</div>
                    </div>
                    <span className="status-badge" style={{
                      backgroundColor: statusInfo.color,
                      color: 'white'
                    }}>
                      {statusInfo.text}
                    </span>
                  </div>
                </div>
                <button 
                  className="notification-close"
                  onClick={() => handleCloseIndividualNotification(notification.id)}
                  title="Fermer"
                  aria-label="Fermer la notification"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
        
        {/* Close all button when multiple notifications */}
        {activeNotifications.length > 1 && (
          <div 
            className="close-all-notifications"
            style={{
              top: `${20 + (activeNotifications.length * 100) + 20}px` // Position below all notifications
            }}
          >
            <button 
              onClick={handleCloseNotification}
              className="close-all-button"
            >
              Fermer toutes les notifications
            </button>
          </div>
        )}
      </div>
    );
  }

  // Original alert bar functionality (for App.js)
  // Don't render if loading initially or no alerts
  if (loading && !propEquipmentStatuses) {
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
            onClick={fetchEquipmentStatus}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
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
          // Validation for each equipment
          if (!equipment) {
            console.warn(`EquipmentStatusBar: Invalid equipment at index ${index}`);
            return null;
          }

          const statusInfo = getStatusInfo(equipment.status);
          
          return (
            <div
              key={equipment.id || `alert-${index}`}
              className={`status-alert ${statusInfo.className}`}
              style={{
                backgroundColor: statusInfo.bgColor,
                borderColor: statusInfo.color,
                color: statusInfo.color,
                '--border-color': statusInfo.color
              }}
            >
              <div className="alert-icon">{statusInfo.icon}</div>
              <div className="alert-content">
                <div className="alert-header">
                  <span className="equipment-name">
                    {equipment.name || equipment.equipmentName || `Équipement ${equipment.id || index + 1}`}
                  </span>
                  <span className="status-badge" style={{ backgroundColor: statusInfo.color }}>
                    {statusInfo.text}
                  </span>
                </div>
                <div className="alert-message">
                  {statusInfo.message} - {equipment.location || 'Localisation non spécifiée'}
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
                {equipment.priority && equipment.priority !== 'normal' && (
                  <div className="priority-info">
                    🔥 Priorité: {equipment.priority}
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
                aria-label="Fermer l'alerte"
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