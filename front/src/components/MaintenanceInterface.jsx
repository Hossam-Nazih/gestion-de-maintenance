import React, { useState, useEffect } from 'react';
import { technicienApi } from '../api';
import './MaintenanceInterface.css';

const MaintenanceInterface = () => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fixDuration: '',
    machineHours: '',
    fixDescription: '',
    changedParts: '',
    fixType: '',
    forwardTo: '',
    status: '',
  });

  // Données des demandes
  const [requests, setRequests] = useState([]);

  const specialists = [
    { value: 'ELECTRIQUE', label: 'Service Électrique' },
    { value: 'HYDRAULIQUE', label: 'Service Hydraulique' },
    { value: 'PNEUMATIQUE', label: 'Service Pneumatique' },
    { value: 'MECANIQUE', label: 'Service Mécanique' },
  ];

  const statusOptions = [
    { value: 'EN_COURS', label: 'En cours', color: '#3b82f6' },
    { value: 'TERMINEE', label: 'Terminée', color: '#10b981' },
    { value: 'REPORTEE', label: 'Reportée', color: '#ef4444' },
    { value: 'EN_ATTENTE_PIECES', label: 'En attente pièces', color: '#f59e0b' },
  ];

  useEffect(() => {
    const fetchInterventions = async () => {
      try {
        const response = await technicienApi.getAvailableInterventions();
        setRequests(response.data.map(int => ({
          id: int.id,
          stopType: int.type_arret,
          equipment: {
            label: int.equipement?.nom || 'Unknown Equipment',
            location: int.equipement?.localisation || 'Unknown Location',
            type: int.equipement?.type || 'Unknown Type',
            priority: int.priorite?.toUpperCase() || 'MOYENNE'
          },
          interventionType: int.type_probleme?.toUpperCase(),
          description: int.description,
          timestamp: int.created_at,
          status: int.statut,
          operator: int.demandeur_nom || 'Unknown Operator'
        })));
      } catch (error) {
        console.error("Error fetching interventions:", error);
        // Set mock data if API fails
        setRequests([
          {
            id: '1',
            stopType: 'AP',
            equipment: {
              label: 'Presse hydraulique #1',
              location: 'Atelier A',
              type: 'production',
              priority: 'ELEVEE'
            },
            interventionType: 'HYDRAULIQUE',
            description: 'Fuite d\'huile importante au niveau du vérin principal, pression insuffisante',
            timestamp: '2024-01-15T08:30:00Z',
            status: 'EN_ATTENTE',
            operator: 'Jean Dupont'
          },
          {
            id: '3',
            stopType: 'AN',
            equipment: {
              label: 'Système de refroidissement',
              location: 'Toiture',
              type: 'climat',
              priority: 'BASSE'
            },
            interventionType: 'ELECTRIQUE',
            description: 'Capteur de température défaillant, disjoncteur qui saute',
            timestamp: '2024-01-15T10:00:00Z',
            status: 'EN_ATTENTE',
            operator: 'Marie Martin'
          },
        ]);
      }
    };

    fetchInterventions();
  }, []);

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

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption?.color || '#6b7280';
  };

  const getStatusText = (status) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption?.label || status;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'ELEVEE': return '#ef4444';
      case 'MOYENNE': return '#f59e0b';
      case 'BASSE': return '#10b981';
      default: return '#6b7280';
    }
  };

  const handleOpenModal = (request) => {
    setSelectedRequest(request);
    setModalVisible(true);
    setFormData({
      fixDuration: '',
      machineHours: '',
      fixDescription: '',
      changedParts: '',
      fixType: '',
      forwardTo: '',
      status: request.status,
    });
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedRequest(null);
    setFormData({
      fixDuration: '',
      machineHours: '',
      fixDescription: '',
      changedParts: '',
      fixType: '',
      forwardTo: '',
      status: '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.fixDuration || !formData.machineHours || !formData.fixDescription || !formData.status) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setLoading(true);

    try {
      await technicienApi.createTraitement({
        intervention_id: selectedRequest.id,
        duree_fixation: parseFloat(formData.fixDuration),
        heures_arret_machine: parseFloat(formData.machineHours),
        description_reparation: formData.fixDescription,
        pieces_changees: formData.changedParts,
        type_fixation: formData.fixType,
        transfert_specialiste: !!formData.forwardTo,
        statut_final: formData.status
      });

      alert('Intervention mise à jour avec succès!');
      
      // Update local state
      setRequests(prev => prev.map(req => 
        req.id === selectedRequest.id 
          ? { ...req, status: formData.status, lastUpdate: new Date().toISOString() }
          : req
      ));
      
      handleCloseModal();
    } catch (error) {
      console.error('Treatment error:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'Erreur inconnue';
      alert(`Erreur: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="maintenance-interface">
      <div className="interface-header">
        <h2>🔧 Équipe de Maintenance</h2>
        <p>Gestion des demandes d'intervention</p>
      </div>

      <div className="requests-container">
        <div className="requests-header">
          <h3>Demandes d'intervention ({requests.length})</h3>
          <div className="status-legend">
            {statusOptions.map(status => (
              <div key={status.value} className="legend-item">
                <div 
                  className="legend-dot" 
                  style={{ backgroundColor: status.color }}
                ></div>
                <span>{status.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="requests-grid">
          {requests.map((request) => (
            <div key={request.id} className="request-card" onClick={() => handleOpenModal(request)}>
              <div className="request-header">
                <div className="request-info">
                  <h4 className="equipment-name">{request.equipment.label}</h4>
                  <div className="request-meta">
                    <span className="stop-type">{request.stopType}</span>
                    <span className="intervention-type">{request.interventionType}</span>
                    <span className="location">📍 {request.equipment.location}</span>
                  </div>
                </div>
                <div className="status-badge">
                  <div 
                    className="status-dot" 
                    style={{ backgroundColor: getStatusColor(request.status) }}
                  ></div>
                  <span style={{ color: getStatusColor(request.status) }}>
                    {getStatusText(request.status)}
                  </span>
                </div>
              </div>

              <p className="description">{request.description}</p>

              <div className="request-footer">
                <div className="operator-info">
                  <span>👤 {request.operator}</span>
                </div>
                <div className="priority-badge">
                  <span 
                    className="priority-text"
                    style={{ color: getPriorityColor(request.equipment.priority) }}
                  >
                    Priorité {request.equipment.priority.toLowerCase()}
                  </span>
                </div>
              </div>

              <div className="timestamp">
                <span>🕒 {formatTimeAgo(request.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {modalVisible && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Traitement de l'intervention</h3>
              <button className="close-button" onClick={handleCloseModal}>✕</button>
            </div>

            <div className="modal-body">
              {selectedRequest && (
                <div className="request-summary">
                  <h4>{selectedRequest.equipment.label}</h4>
                  <p className="summary-description">{selectedRequest.description}</p>
                  <div className="summary-meta">
                    <span>Type: {selectedRequest.interventionType}</span>
                    <span>Priorité: {selectedRequest.equipment.priority}</span>
                    <span>Demandeur: {selectedRequest.operator}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="intervention-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Durée de fixation (heures) *</label>
                    <input
                      type="number"
                      name="fixDuration"
                      value={formData.fixDuration}
                      onChange={handleInputChange}
                      placeholder="Ex: 2.5"
                      step="0.1"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Heures machine à l'arrêt *</label>
                    <input
                      type="number"
                      name="machineHours"
                      value={formData.machineHours}
                      onChange={handleInputChange}
                      placeholder="Ex: 5200"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Description de la réparation *</label>
                  <textarea
                    name="fixDescription"
                    value={formData.fixDescription}
                    onChange={handleInputChange}
                    placeholder="Décrivez les actions effectuées..."
                    rows="4"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Pièces changées</label>
                  <textarea
                    name="changedParts"
                    value={formData.changedParts}
                    onChange={handleInputChange}
                    placeholder="Listez les pièces remplacées..."
                    rows="3"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Type de fixation</label>
                    <select
                      name="fixType"
                      value={formData.fixType}
                      onChange={handleInputChange}
                    >
                      <option value="">Sélectionnez le type</option>
                      <option value="TEMPORAIRE">Temporaire</option>
                      <option value="PERMANENTE">Permanente</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Transférer à un spécialiste</label>
                    <select
                      name="forwardTo"
                      value={formData.forwardTo}
                      onChange={handleInputChange}
                    >
                      <option value="">Aucun transfert</option>
                      {specialists.map((specialist) => (
                        <option key={specialist.value} value={specialist.value}>
                          {specialist.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Statut *</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Sélectionnez le statut</option>
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-actions">
                  <button type="button" onClick={handleCloseModal} className="cancel-button">
                    Annuler
                  </button>
                  <button type="submit" className="submit-button" disabled={loading}>
                    {loading ? (
                      <>⏳ Traitement...</>
                    ) : (
                      <>✅ Valider l'intervention</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceInterface;