import React, { useState } from 'react';
import './NotificationsInterface.css';

const NotificationsInterface = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const notifications = [
    {
      id: '1',
      type: 'status_update',
      title: 'Intervention terminée',
      message: 'Presse hydraulique #1 - Réparation terminée avec succès',
      equipment: 'Presse hydraulique #1',
      timestamp: '2024-01-15T14:30:00Z',
      read: false,
      priority: 'high',
      icon: '✅',
      details: {
        duration: '2.5h',
        technician: 'Marc Dubois',
        parts: 'Joint hydraulique, filtre'
      }
    },
    
  ];

  const filters = [
    { label: 'Toutes', value: 'all', count: notifications.length },
    { label: 'Non lues', value: 'unread', count: notifications.filter(n => !n.read).length },
    { label: 'Urgentes', value: 'urgent', count: notifications.filter(n => n.priority === 'high').length },
    { label: 'Terminées', value: 'completed', count: notifications.filter(n => n.type === 'status_update' && n.title.includes('terminée')).length },
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getPriorityBg = (priority) => {
    switch (priority) {
      case 'high': return '#fef2f2';
      case 'medium': return '#fffbeb';
      case 'low': return '#f0fdf4';
      default: return '#f9fafb';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now - time) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Il y a moins d\'une heure';
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (selectedFilter) {
      case 'unread':
        return !notification.read;
      case 'urgent':
        return notification.priority === 'high';
      case 'completed':
        return notification.type === 'status_update' && notification.title.includes('terminée');
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notifications-interface">
      <div className="interface-header">
        <div className="header-content">
          <h2>🔔 Notifications</h2>
          {unreadCount > 0 && (
            <div className="notification-badge">
              {unreadCount}
            </div>
          )}
        </div>
        <p>Suivi des interventions et alertes équipements</p>
      </div>

      <div className="notifications-content">
        {/* Filtres */}
        <div className="filter-container">
          {filters.map((filter) => (
            <button
              key={filter.value}
              className={`filter-button ${selectedFilter === filter.value ? 'active' : ''}`}
              onClick={() => setSelectedFilter(filter.value)}
            >
              <span className="filter-label">{filter.label}</span>
              <span className="filter-count">{filter.count}</span>
            </button>
          ))}
        </div>

        {/* Liste des notifications */}
        <div className="notifications-list">
          {filteredNotifications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔔</div>
              <h3>Aucune notification</h3>
              <p>Vous n'avez pas de notifications pour le moment</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-card ${!notification.read ? 'unread' : ''}`}
                style={{ backgroundColor: getPriorityBg(notification.priority) }}
              >
                <div className="notification-header">
                  <div className="notification-icon">
                    {notification.icon}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title-row">
                      <h4 className="notification-title">{notification.title}</h4>
                      {!notification.read && (
                        <div className="unread-indicator"></div>
                      )}
                    </div>
                    <p className="notification-message">{notification.message}</p>
                    <div className="notification-meta">
                      <span className="equipment-name">📍 {notification.equipment}</span>
                      <span 
                        className="priority-badge"
                        style={{ 
                          color: getPriorityColor(notification.priority),
                          backgroundColor: getPriorityColor(notification.priority) + '20'
                        }}
                      >
                        Priorité {notification.priority === 'high' ? 'élevée' : notification.priority === 'medium' ? 'moyenne' : 'basse'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Détails supplémentaires */}
                <div className="notification-details">
                  {Object.entries(notification.details).map(([key, value]) => (
                    <div key={key} className="detail-item">
                      <span className="detail-label">
                        {key === 'duration' ? 'Durée' :
                         key === 'technician' ? 'Technicien' :
                         key === 'parts' ? 'Pièces' :
                         key === 'requestedBy' ? 'Demandé par' :
                         key === 'type' ? 'Type' :
                         key === 'urgency' ? 'Urgence' :
                         key === 'estimatedTime' ? 'Temps estimé' :
                         key === 'scheduledDate' ? 'Date prévue' :
                         key === 'assignedBy' ? 'Assigné par' :
                         key === 'deadline' ? 'Échéance' :
                         key === 'alertType' ? 'Type d\'alerte' :
                         key === 'action' ? 'Action' :
                         key === 'checkRequired' ? 'Vérification' :
                         key}:
                      </span>
                      <span className="detail-value">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="notification-footer">
                  <span className="notification-time">
                    {formatTimeAgo(notification.timestamp)}
                  </span>
                  <div className="notification-actions">
                    {!notification.read && (
                      <button className="action-button mark-read">
                        Marquer comme lu
                      </button>
                    )}
                    <button className="action-button view-details">
                      Voir détails
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsInterface;