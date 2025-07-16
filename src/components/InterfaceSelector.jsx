import React from 'react';
import './InterfaceSelector.css';

const InterfaceSelector = ({ onSelect, user }) => {
  const interfaces = [
    {
      id: 'demandeur',
      title: 'Interface Demandeur',
      description: 'Créer et suivre vos demandes d\'intervention (Accès libre)',
      icon: '📝',
      color: '#3b82f6',
      features: [
        'Créer une nouvelle demande d\'intervention',
        'Sélectionner le type d\'arrêt et l\'équipement',
        'Ajouter une description détaillée',
        'Joindre des photos (optionnel)',
        'Recevoir des notifications en temps réel',
        'Voir l\'état des équipements',
        'Aucune authentification requise'
      ]
    },
    {
      id: 'maintenance',
      title: 'Interface Maintenance',
      description: 'Gérer et traiter les demandes d\'intervention (Connexion requise)',
      icon: '🔧',
      color: '#059669',
      features: [
        'Voir toutes les demandes d\'intervention',
        'Traiter les demandes en cours',
        'Ajouter la durée de fixation',
        'Enregistrer les pièces changées',
        'Transférer vers d\'autres spécialistes',
        'Mettre à jour le statut des interventions',
        'Authentification obligatoire'
      ],
      requiresAuth: true
    }
  ];

  return (
    <div className="interface-selector">
      <div className="selector-background">
        <div className="selector-overlay"></div>
      </div>
      
      <div className="selector-content">
        <div className="selector-header">
          <div className="company-logo">
            <div className="logo-icon">🏗️</div>
            <div className="company-info">
              <h1>CARRIPREFA</h1>
              <p>SOCIÉTÉ D'EXPLOITATION DE CARRIÈRES ET PRÉFABRIQUÉS</p>
            </div>
          </div>
          <div className="selector-title">
            <h2>Choisissez votre Interface</h2>
            <p>Sélectionnez l'interface adaptée à votre rôle</p>
          </div>
        </div>

        <div className="interfaces-grid">
          {interfaces.map((interface_item) => (
            <div
              key={interface_item.id}
              className="interface-card"
              style={{ borderColor: interface_item.color }}
              onClick={() => onSelect(interface_item.id)}
            >
              <div className="card-header" style={{ backgroundColor: interface_item.color }}>
                <div className="card-icon">{interface_item.icon}</div>
                <div className="card-title-section">
                  <h3>{interface_item.title}</h3>
                  <p>{interface_item.description}</p>
                </div>
              </div>

              <div className="card-content">
                <div className="features-list">
                  {interface_item.features.map((feature, index) => (
                    <div key={index} className="feature-item">
                      <span className="feature-icon">✓</span>
                      <span className="feature-text">{feature}</span>
                    </div>
                  ))}
                </div>

                {interface_item.requiresAuth && !user ? (
                  <button 
                    className="select-button auth-required"
                    style={{ backgroundColor: interface_item.color }}
                    onClick={() => onSelect(interface_item.id)}
                  >
                    🔐 Se connecter pour accéder
                  </button>
                ) : (
                  <button 
                    className="select-button"
                    style={{ backgroundColor: interface_item.color }}
                    onClick={() => onSelect(interface_item.id)}
                  >
                    {interface_item.requiresAuth ? 'Accéder à cette interface' : 'Accès libre - Commencer'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {user && (
          <div className="user-info-section">
            <div className="current-user">
              <span className="user-icon">👤</span>
              <div className="user-details">
                <span className="user-name">{user.firstName} {user.lastName}</span>
                <span className="user-role">
                  {user.role === 'OPERATOR' ? 'Opérateur' : 
                   user.role === 'MAINTENANCE' ? 'Maintenance' : 'Administrateur'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterfaceSelector;