import React, { useState, useEffect } from 'react';
import './NotificationsInterface.css';

const NotificationsInterface = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInterventions = async () => {
    try {
      setLoading(true);
      
      // Try different possible API endpoints
      let response;
      const possibleEndpoints = [
        'http://127.0.0.1:5000/api/tech/interventions-status'
      ];
      
      let lastError;
      for (const endpoint of possibleEndpoints) {
        try {
          response = await fetch(endpoint);
          if (response.ok) {
            break;
          }
          lastError = `HTTP ${response.status}: ${response.statusText}`;
        } catch (err) {
          lastError = err.message;
          continue;
        }
      }
      
      if (!response || !response.ok) {
        throw new Error(`API not accessible. Last error: ${lastError}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Received non-JSON response:', text.substring(0, 200));
        throw new Error('Server returned HTML instead of JSON. Check if the API endpoint exists.');
      }
      
      const data = await response.json();
      
      // Check if we have the expected data structure
      if (!data || !data.interventions) {
        console.error('Unexpected API response structure:', data);
        // Fallback to simple status endpoint
        const fallbackResponse = await fetch('/api/tech/interventions-status-simple');
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          if (fallbackData.equipments) {
            // Transform simple equipment data to notifications
            const transformedNotifications = fallbackData.equipments.map(equipment => ({
              id: equipment.equipment_id.toString(),
              type: getNotificationType(equipment.current_status),
              title: getNotificationTitle(equipment.current_status),
              message: `${equipment.equipment_name} - Status: ${equipment.current_status}`,
              equipment: equipment.equipment_name,
              timestamp: equipment.last_intervention_date || new Date().toISOString(),
              read: equipment.current_status === 'terminee',
              priority: getPriorityFromStatus(equipment.current_status),
              icon: getStatusIcon(equipment.current_status),
              details: {
                status: equipment.current_status,
                equipmentId: equipment.equipment_id,
                lastUpdate: equipment.last_intervention_date ? new Date(equipment.last_intervention_date).toLocaleDateString() : 'Non disponible'
              }
            }));
            setNotifications(transformedNotifications);
            return;
          }
        }
        throw new Error('No valid data found in API response');
      }
      
      // Transform interventions data into notifications format
      const transformedNotifications = data.interventions.map(intervention => ({
        id: intervention.intervention_id.toString(),
        type: getNotificationType(intervention.intervention_status),
        title: getNotificationTitle(intervention.intervention_status),
        message: `${intervention.equipment_info?.equipment_name || 'Équipement inconnu'} - ${intervention.intervention_description}`,
        equipment: intervention.equipment_info?.equipment_name || 'Équipement inconnu',
        timestamp: intervention.intervention_date || new Date().toISOString(),
        read: intervention.intervention_status === 'terminee',
        priority: getPriorityFromStatus(intervention.intervention_status, intervention.intervention_priority),
        icon: getStatusIcon(intervention.intervention_status),
        details: {
          ...(intervention.latest_treatment?.repair_duration && {
            duree_fixation: `${intervention.latest_treatment.repair_duration}h`
          }),
          statut: intervention.intervention_status,
          type: intervention.equipment_info?.equipment_type || 'Non spécifié'
        }
      }));

      setNotifications(transformedNotifications);
    } catch (err) {
      setError(`Erreur de connexion à l'API: ${err.message}`);
      console.error('Error fetching interventions:', err);
      
      // Try to load some demo data as fallback
      const demoNotifications = [
        {
          id: 'demo-1',
          type: 'status_update',
          title: 'Données de démonstration',
          message: 'Impossible de se connecter à l\'API. Données de test affichées.',
          equipment: 'Système de démonstration',
          timestamp: new Date().toISOString(),
          read: false,
          priority: 'medium',
          icon: '🔧',
          details: {
            statut: 'demo',
            type: 'Démonstration',
            duree_fixation: 'N/A'
          }
        }
      ];
      setNotifications(demoNotifications);
    } finally {
      setLoading(false);
    }
  };

  // Fetch interventions data from API
  useEffect(() => {
    fetchInterventions();
    
    // Set up polling to refresh data every 30 seconds (only if no error)
    const interval = setInterval(() => {
      if (!error) {
        fetchInterventions();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [error]);

  // Refresh function for manual refresh
  const refreshData = async () => {
    setError(null);
    await fetchInterventions();
  };

  // Helper functions to transform API data
  const getNotificationType = (status) => {
    switch (status) {
      case 'terminee': return 'status_update';
      case 'en_cours': return 'in_progress';
      case 'en_attente': return 'pending';
      case 'problematique': return 'issue';
      case 'annulee': return 'cancelled';
      default: return 'general';
    }
  };

  const getNotificationTitle = (status) => {
    switch (status) {
      case 'terminee': return 'Intervention terminée';
      case 'en_cours': return 'Intervention en cours';
      case 'en_attente': return 'Intervention en attente';
      case 'problematique': return 'Problème détecté';
      case 'annulee': return 'Intervention annulée';
      default: return 'Mise à jour intervention';
    }
  };

  const getPriorityFromStatus = (status, priority) => {
    if (priority) return priority;
    switch (status) {
      case 'problematique': return 'high';
      case 'en_cours': return 'medium';
      case 'en_attente': return 'medium';
      case 'terminee': return 'low';
      case 'annulee': return 'low';
      default: return 'medium';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'terminee': return '✅';
      case 'en_cours': return '🔧';
      case 'en_attente': return '⏳';
      case 'problematique': return '⚠️';
      case 'annulee': return '❌';
      default: return '📋';
    }
  };

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
      case 'completed':
        return notification.type === 'status_update' && notification.title.includes('terminée');
      case 'in_progress':
        return notification.details.statut === 'en_cours';
      case 'pending':
        return notification.details.statut === 'en_attente';
      default:
        return true;
    }
  });

  const filters = [
    { label: 'Toutes', value: 'all', count: notifications.length },
    { label: 'Non lues', value: 'unread', count: notifications.filter(n => !n.read).length },
    { label: 'En cours', value: 'in_progress', count: notifications.filter(n => n.details.statut === 'en_cours').length },
    { label: 'En attente', value: 'pending', count: notifications.filter(n => n.details.statut === 'en_attente').length },
    { label: 'Terminées', value: 'completed', count: notifications.filter(n => n.type === 'status_update' && n.title.includes('terminée')).length },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (notificationId) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  };

  const viewDetails = (notification) => {
    // You can implement navigation to intervention details here
    console.log('View details for intervention:', notification.id);
    // Example: navigate(`/interventions/${notification.id}`);
  };

  if (loading) {
    return (
      <div className="notifications-interface">
        <div className="interface-header">
          <div className="header-content">
            <h2>🔔 Notifications</h2>
          </div>
          <p>Chargement des notifications...</p>
        </div>
        <div className="notifications-content">
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ 
              width: '50px', 
              height: '50px', 
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #dc2626',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <p>Chargement en cours...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="notifications-interface">
        <div className="interface-header">
          <div className="header-content">
            <h2>⚠️ Erreur de chargement</h2>
          </div>
          <p>Impossible de charger les notifications</p>
        </div>
        <div className="notifications-content">
          <div style={{ 
            background: '#fef2f2', 
            border: '2px solid #fecaca', 
            borderRadius: '12px', 
            padding: '2rem',
            textAlign: 'center'
          }}>
            <div style={{ color: '#ef4444', fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h3 style={{ color: '#b91c1c', marginBottom: '1rem' }}>Erreur de chargement</h3>
            <p style={{ color: '#ef4444', marginBottom: '1.5rem' }}>{error}</p>
            <div style={{ marginBottom: '1.5rem', textAlign: 'left', color: '#7f1d1d' }}>
              <p><strong>Solutions possibles:</strong></p>
              <ul style={{ paddingLeft: '1.5rem' }}>
                <li>Vérifiez que votre serveur backend est démarré</li>
                <li>Confirmez que l'endpoint API est accessible: <code style={{background: '#fecaca', padding: '0.2rem', borderRadius: '4px'}}>/api/tech/interventions-status</code></li>
                <li>Vérifiez la configuration CORS si nécessaire</li>
                <li>Consultez la console du navigateur pour plus de détails</li>
              </ul>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={refreshData}
                disabled={loading}
                className="action-button view-details"
                style={{ opacity: loading ? 0.5 : 1 }}
              >
                {loading ? 'Rechargement...' : 'Réessayer'}
              </button>
              <button 
                onClick={() => window.open('/api/tech/interventions-status', '_blank')}
                className="action-button mark-read"
              >
                Tester l'API
              </button>
            </div>
          </div>
          
          {/* Show demo data if available */}
          {notifications.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Données de démonstration:</h3>
              <div className="notifications-list">
                {notifications.map((notification) => (
                  <div key={notification.id} className="notification-card" style={{
                    background: '#fffbeb',
                    borderColor: '#fbbf24'
                  }}>
                    <div className="notification-header">
                      <div className="notification-icon">{notification.icon}</div>
                      <div className="notification-content">
                        <div className="notification-title-row">
                          <h4 className="notification-title">{notification.title}</h4>
                        </div>
                        <p className="notification-message">{notification.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

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
          <button 
            onClick={refreshData}
            disabled={loading}
            style={{
              padding: '0.5rem 1rem',
              background: loading ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginLeft: 'auto'
            }}
          >
            <span style={{ transform: loading ? 'rotate(360deg)' : 'none', transition: 'transform 1s' }}>🔄</span>
            {loading ? 'Actualisation...' : 'Actualiser'}
          </button>
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
                {Object.keys(notification.details).length > 0 && (
                  <div className="notification-details">
                    {Object.entries(notification.details).map(([key, value]) => (
                      <div key={key} className="detail-item">
                        <span className="detail-label">
                          {key === 'duree_fixation' ? 'Durée fixation' :
                           key === 'statut' ? 'Statut' :
                           key === 'type' ? 'Type' :
                           key}:
                        </span>
                        <span className="detail-value">{value}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="notification-footer">
                  <span className="notification-time">
                    {formatTimeAgo(notification.timestamp)}
                  </span>
                  <div className="notification-actions">
                    {!notification.read && (
                      <button 
                        onClick={() => markAsRead(notification.id)}
                        className="action-button mark-read"
                      >
                        Marquer comme lu
                      </button>
                    )}
                    <button 
                      onClick={() => viewDetails(notification)}
                      className="action-button view-details"
                    >
                      Voir détails
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default NotificationsInterface;