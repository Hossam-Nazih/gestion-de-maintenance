import { useState, useEffect, useCallback, useMemo } from 'react';
import { technicienApi } from '../api';
import './MaintenanceInterface.css';

const STATUS_OPTIONS = [
  { value: 'en_attente', label: 'en_attente', color: '#6b7280' },
  { value: 'en_cours', label: 'en_cours', color: '#3b82f6' },
  { value: 'terminee', label: 'terminee', color: '#10b981' },
];

// Frontend status options (what users see) - FIXED: removed incorrect mapping
const FRONTEND_STATUS_OPTIONS = [
  { value: 'en_attente', label: 'en_attente', color: '#6b7280' },
  { value: 'en_cours', label: 'en_cours', color: '#3b82f6' },
  { value: 'terminee', label: 'terminee', color: '#10b981' },
];

const SPECIALISTS = [
  { value: 'ELECTRIQUE', label: 'Service Électrique' },
  { value: 'HYDRAULIQUE', label: 'Service Hydraulique' },
  { value: 'PNEUMATIQUE', label: 'Service Pneumatique' },
  { value: 'MECANIQUE', label: 'Service Mécanique' },
];

// FIXED: Status mapping functions - removed incorrect mapping
const mapFrontendToBackend = (frontendStatus) => {
  // Direct mapping since backend now supports en_attente
  return frontendStatus || 'en_attente';
};

const mapBackendToFrontend = (backendStatus) => {
  // Direct mapping since backend now supports en_attente
  return backendStatus || 'en_attente';
};

const MaintenanceInterface = () => {
  // Main state
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState({
    initial: true,
    modal: false,
    refresh: false
  });
  const [error, setError] = useState(null);
  
  // Modal state
  const [modalData, setModalData] = useState({
    visible: false,
    request: null,
    existingTreatment: null,
    form: {
      fixDuration: '',
      machineHours: '',
      fixDescription: '',
      changedParts: '',
      fixType: '',
      forwardTo: '',
      status: 'en_attente',
    }
  });

  // FIXED: Enhanced data extraction with proper demandeur name handling
  const safeMapIntervention = useCallback((int) => {
    if (!int || typeof int !== 'object') {
      console.warn('Invalid intervention object:', int);
      return null;
    }

    const interventionId = int.intervention_id ?? `temp_${Date.now()}_${Math.random()}`;
    
    // Safe status extraction
    let statusValue = 'en_attente';
    if (int.intervention_status) {
      if (typeof int.intervention_status === 'string') {
        statusValue = int.intervention_status.toLowerCase().trim();
      } else if (typeof int.intervention_status === 'object' && int.intervention_status.value) {
        statusValue = String(int.intervention_status.value).toLowerCase().trim();
      }
    }

    // Safe priority extraction
    let priorityValue = 'MOYENNE';
    if (int.intervention_priority) {
      if (typeof int.intervention_priority === 'string') {
        priorityValue = int.intervention_priority.toUpperCase().trim();
      } else if (typeof int.intervention_priority === 'object' && int.intervention_priority.value) {
        priorityValue = String(int.intervention_priority.value).toUpperCase().trim();
      }
    }

    // Safe equipment info extraction
    let equipmentInfo = {
      label: 'Équipement inconnu',
      location: 'Lieu inconnu',
      type: 'Type inconnu',
      priority: priorityValue
    };

    if (int.equipment_info && typeof int.equipment_info === 'object') {
      equipmentInfo = {
        label: int.equipment_info.equipment_name || int.equipment_info.name || 'Équipement inconnu',
        location: int.equipment_info.equipment_location || int.equipment_info.location || 'Lieu inconnu',
        type: int.equipment_info.equipment_type || int.equipment_info.type || 'Type inconnu',
        priority: priorityValue
      };
    }

    // FIXED: Extract demandeur name from different possible sources
    let demandeurName = 'Demandeur non spécifié';
    
    // Try to get demandeur name from various possible fields in the intervention data
    if (int.demandeur_nom) {
      demandeurName = String(int.demandeur_nom).trim();
    } else if (int.demandeur_name) {
      demandeurName = String(int.demandeur_name).trim();
    } else if (int.operator_name) {
      demandeurName = String(int.operator_name).trim();
    } else if (int.demandeur_email) {
      // Extract name from email if available
      const emailPart = String(int.demandeur_email).split('@')[0];
      if (emailPart.includes('.')) {
        demandeurName = emailPart.split('.').map(part => 
          part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        ).join(' ');
      } else {
        demandeurName = emailPart;
      }
    } else if (int.demandeur && typeof int.demandeur === 'object') {
      // If demandeur is an object, try to extract name from it
      if (int.demandeur.nom) {
        demandeurName = String(int.demandeur.nom).trim();
      } else if (int.demandeur.name) {
        demandeurName = String(int.demandeur.name).trim();
      } else if (int.demandeur.username) {
        demandeurName = String(int.demandeur.username).trim();
      }
    }

    const safeString = (value, fallback = '') => {
      return value !== null && value !== undefined ? String(value).trim() || fallback : fallback;
    };

    return {
      id: interventionId,
      stopType: safeString(int.type_arret || int.intervention_type_arret, 'N/A'),
      equipment: equipmentInfo,
      interventionType: safeString(int.type_probleme || int.intervention_title, 'Intervention'),
      description: safeString(int.intervention_description, 'Aucune description'),
      timestamp: int.intervention_date || new Date().toISOString(),
      status: statusValue,
      // FIXED: Use the extracted demandeur name
      operator: demandeurName,
      demandeurEmail: safeString(int.demandeur_email),
      demandeurTelephone: safeString(int.demandeur_telephone),
      treatment: int.latest_treatment || null,
      hasTraitement: Boolean(int.latest_treatment)
    };
  }, []);

  // Load interventions
  const fetchInterventions = useCallback(async () => {
    setLoading(prev => ({ ...prev, initial: true }));
    setError(null);
    
    try {
      const response = await technicienApi.getInterventionsStatus();
      
      if (!response || !response.data) {
        throw new Error('Réponse API invalide: données manquantes');
      }
      
      let interventions = [];
      if (Array.isArray(response.data)) {
        interventions = response.data;
      } else if (response.data.interventions && Array.isArray(response.data.interventions)) {
        interventions = response.data.interventions;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        interventions = response.data.data;
      }
      
      const mappedRequests = interventions
        .map(int => safeMapIntervention(int))
        .filter(Boolean);

      setRequests(mappedRequests);
    } catch (error) {
      console.error("Error fetching interventions:", error);
      setError(error.message || 'Erreur inconnue lors du chargement');
      setRequests([]);
    } finally {
      setLoading(prev => ({ ...prev, initial: false }));
    }
  }, [safeMapIntervention]);

  useEffect(() => {
    fetchInterventions();
  }, [fetchInterventions]);

  const formatTimeAgo = useCallback((timestamp) => {
    if (!timestamp) return 'Date non disponible';
    
    try {
      const now = new Date();
      const time = new Date(timestamp);
      
      if (isNaN(time.getTime())) return 'Date invalide';
      
      const diffInHours = Math.floor((now - time) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return 'Il y a moins d\'une heure';
      if (diffInHours < 24) return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
    } catch {
      return 'Date invalide';
    }
  }, []);

  const getStatusColor = useCallback((statusParam) => {
    if (!statusParam) return '#6b7280';
    const normalizedStatus = String(statusParam).toLowerCase().trim();
    const statusOption = STATUS_OPTIONS.find(s => s.value === normalizedStatus);
    return statusOption?.color || '#6b7280';
  }, []);

  const getStatusText = useCallback((statusParam) => {
    if (!statusParam) return 'Statut inconnu';
    const normalizedStatus = String(statusParam).toLowerCase().trim();
    const statusOption = STATUS_OPTIONS.find(s => s.value === normalizedStatus);
    return statusOption?.label || normalizedStatus;
  }, []);

  const getPriorityColor = useCallback((priority) => {
    if (!priority) return '#6b7280';
    const normalizedPriority = String(priority).toUpperCase().trim();
    switch (normalizedPriority) {
      case 'ELEVEE': 
      case 'HIGH': 
      case 'HAUTE': 
        return '#ef4444';
      case 'MOYENNE': 
      case 'MEDIUM': 
      case 'MOYEN': 
        return '#f59e0b';
      case 'BASSE': 
      case 'LOW': 
      case 'BAS': 
        return '#10b981';
      default: 
        return '#6b7280';
    }
  }, []);

  const handleOpenModal = useCallback(async (request) => {
    if (!request?.id) {
      console.error('Invalid request object:', request);
      return;
    }

    setLoading(prev => ({ ...prev, modal: true }));
    setModalData(prev => ({
      ...prev,
      visible: true,
      request,
      existingTreatment: null,
      form: {
        fixDuration: '',
        machineHours: '',
        fixDescription: '',
        changedParts: '',
        fixType: '',
        forwardTo: '',
        status: mapBackendToFrontend(request.status) || 'en_attente',
      }
    }));

    try {
      const traitementResponse = await technicienApi.getTraitementByInterventionId(request.id);
      const traitement = traitementResponse?.data;

      if (traitement?.id) {
        setModalData(prev => ({
          ...prev,
          existingTreatment: traitement,
          form: {
            fixDuration: String(traitement.duree_fixation || ''),
            machineHours: String(traitement.heures_arret_machine || ''),
            fixDescription: String(traitement.description_reparation || ''),
            changedParts: String(traitement.pieces_changees || ''),
            fixType: String(traitement.type_fixation || ''),
            forwardTo: traitement.transfert_specialiste ? 'true' : '',
            status: mapBackendToFrontend(String(traitement.statut_final || request.status || 'en_attente')),
          }
        }));
      }
    } catch (error) {
      console.warn("No existing treatment found or error:", error);
    } finally {
      setLoading(prev => ({ ...prev, modal: false }));
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalData({
      visible: false,
      request: null,
      existingTreatment: null,
      form: {
        fixDuration: '',
        machineHours: '',
        fixDescription: '',
        changedParts: '',
        fixType: '',
        forwardTo: '',
        status: 'en_attente',
      }
    });
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setModalData(prev => ({
      ...prev,
      form: {
        ...prev.form,
        [name]: value
      }
    }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    const { form, request, existingTreatment } = modalData;
    
    if (!form.fixDuration || !form.machineHours || !form.fixDescription || !form.status) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setLoading(prev => ({ ...prev, modal: true }));

    try {
      // FIXED: Use direct status mapping
      const backendStatus = mapFrontendToBackend(form.status);
      
      // FIXED: Technician decides type for both new and updates
      // If input has decimal point → float, otherwise → integer
      let parsedDuration;
      if (form.fixDuration.indexOf('.') === -1) {
        parsedDuration = parseInt(form.fixDuration, 10);
      } else {
        parsedDuration = parseFloat(form.fixDuration);
      }
      
      const parsedMachineHours = parseFloat(form.machineHours);
      
      if (isNaN(parsedDuration) || parsedDuration < 0) {
        alert('La durée de fixation doit être un nombre positif.');
        return;
      }
      
      if (isNaN(parsedMachineHours) || parsedMachineHours < 0) {
        alert('Les heures machine doivent être un nombre positif.');
        return;
      }
      
      const traitementData = {
        intervention_id: request.id,
        duree_fixation: parsedDuration, // Smart type preservation/detection
        heures_arret_machine: parsedMachineHours,
        description_reparation: form.fixDescription.trim(),
        pieces_changees: form.changedParts ? form.changedParts.trim() : null,
        type_fixation: form.fixType || null,
        transfert_specialiste: form.forwardTo ? true : false,
        statut_final: backendStatus // FIXED: Now correctly maps statuses
      };

      console.log('Sending traitement data:', traitementData);

      if (existingTreatment) {
        await technicienApi.updateTraitement(existingTreatment.id, traitementData);
      } else {
        await technicienApi.createTraitement(traitementData);
      }

      // Update local state with backend status
      setRequests(prev => prev.map(req => 
        req.id === request.id 
          ? { 
              ...req, 
              status: backendStatus,
              lastUpdate: new Date().toISOString(),
              hasTraitement: true
            }
          : req
      ));
      
      handleCloseModal();
      alert(`Traitement ${existingTreatment ? 'mis à jour' : 'créé'} avec succès!`);
    } catch (error) {
      console.error('Treatment operation error:', error);
      
      // Enhanced error handling
      let errorMessage = 'Erreur inconnue';
      
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          if (Array.isArray(error.response.data.detail)) {
            // Handle validation errors array
            errorMessage = error.response.data.detail.map(err => 
              `${err.loc ? err.loc.join('.') + ': ' : ''}${err.msg}`
            ).join(', ');
          } else {
            errorMessage = error.response.data.detail;
          }
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`Erreur: ${errorMessage}`);
    } finally {
      setLoading(prev => ({ ...prev, modal: false }));
    }
  }, [modalData, handleCloseModal]);

  const refreshInterventions = useCallback(async () => {
    setLoading(prev => ({ ...prev, refresh: true }));
    setError(null);
    
    try {
      await fetchInterventions();
    } catch (error) {
      setError(`Erreur lors du rafraîchissement: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, refresh: false }));
    }
  }, [fetchInterventions]);

  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) => {
      // Sort by priority first (HIGH > MEDIUM > LOW)
      const priorityOrder = { 'ELEVEE': 1, 'HAUTE': 1, 'HIGH': 1, 'MOYENNE': 2, 'MEDIUM': 2, 'MOYEN': 2, 'BASSE': 3, 'LOW': 3, 'BAS': 3 };
      const aPriority = priorityOrder[a.equipment?.priority?.toUpperCase()] || 4;
      const bPriority = priorityOrder[b.equipment?.priority?.toUpperCase()] || 4;
      
      if (aPriority !== bPriority) return aPriority - bPriority;
      
      // Then sort by timestamp (newest first)
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  }, [requests]);

  if (loading.initial) {
    return (
      <div className="maintenance-interface">
        <div className="loading-container">
          <div className="loading-spinner">⏳</div>
          <p>Chargement des interventions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="maintenance-interface">
        <div className="error-container">
          <h3>❌ Erreur de chargement</h3>
          <p>{error}</p>
          <button onClick={refreshInterventions} className="retry-button">
            🔄 Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="maintenance-interface">
      <div className="interface-header">
        <h2>🔧 Équipe de Maintenance</h2>
        <p>Gestion des demandes d'intervention</p>
        <button 
          onClick={refreshInterventions} 
          className="refresh-button"
          disabled={loading.refresh}
        >
          {loading.refresh ? '⏳ Actualisation...' : '🔄 Actualiser'}
        </button>
      </div>

      <div className="requests-container">
        <div className="requests-header">
          <h3>Demandes d'intervention ({requests.length})</h3>
          <div className="status-legend">
            {STATUS_OPTIONS.map(status => (
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
          {sortedRequests.map((request) => (
            <div 
              key={request.id} 
              className={`request-card ${request.hasTraitement ? 'has-treatment' : ''}`}
              onClick={() => handleOpenModal(request)}
            >
              <div className="request-header">
                <div className="request-info">
                  <h4 className="equipment-name">
                    {request.equipment?.label || 'Équipement inconnu'}
                    {request.hasTraitement && <span className="treatment-indicator">✅</span>}
                  </h4>
                  <div className="request-meta">
                    <span className="stop-type">{request.stopType}</span>
                    <span className="intervention-type">{request.interventionType}</span>
                    <span className="location">📍 {request.equipment?.location || 'Lieu inconnu'}</span>
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
                    style={{ color: getPriorityColor(request.equipment?.priority) }}
                  >
                    Priorité {String(request.equipment?.priority || 'inconnue').toLowerCase()}
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
      {modalData.visible && modalData.request && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {modalData.existingTreatment ? '✏️ Modifier le traitement' : '➕ Nouveau traitement'}
              </h3>
              <button className="close-button" onClick={handleCloseModal}>✕</button>
            </div>

            <div className="modal-body">
              <div className="request-summary">
                <h4>{modalData.request.equipment?.label || 'Équipement inconnu'}</h4>
                <p className="summary-description">{modalData.request.description}</p>
                <div className="summary-meta">
                  <span>Type: {modalData.request.interventionType}</span>
                  <span>Priorité: {modalData.request.equipment?.priority || 'inconnue'}</span>
                  <span>Demandeur: {modalData.request.operator}</span>
                  <span>ID: {modalData.request.id}</span>
                </div>
                {modalData.existingTreatment && (
                  <div className="update-notice">
                    ℹ️ Vous modifiez un traitement existant
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="intervention-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Durée de fixation (heures) *</label>
                    <input
                      type="number"
                      name="fixDuration"
                      value={modalData.form.fixDuration}
                      onChange={handleInputChange}
                      placeholder="Ex: 2.5"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Heures machine à l'arrêt *</label>
                    <input
                      type="number"
                      name="machineHours"
                      value={modalData.form.machineHours}
                      onChange={handleInputChange}
                      placeholder="Ex: 5200"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Description de la réparation *</label>
                  <textarea
                    name="fixDescription"
                    value={modalData.form.fixDescription}
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
                    value={modalData.form.changedParts}
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
                      value={modalData.form.fixType}
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
                      value={modalData.form.forwardTo}
                      onChange={handleInputChange}
                    >
                      <option value="">Aucun transfert</option>
                      {SPECIALISTS.map((specialist) => (
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
                    value={modalData.form.status}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Sélectionnez le statut</option>
                    {FRONTEND_STATUS_OPTIONS.map((status) => (
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
                  <button 
                    type="submit" 
                    className="submit-button" 
                    disabled={loading.modal}
                  >
                    {loading.modal ? (
                      '⏳ Traitement...'
                    ) : modalData.existingTreatment ? (
                      '✏️ Mettre à jour'
                    ) : (
                      '✅ Créer le traitement'
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