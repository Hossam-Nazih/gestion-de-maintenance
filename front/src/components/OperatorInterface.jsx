import './OperatorInterface.css';
import React, { useState, useEffect } from 'react';
import { equipmentApi, technicienApi } from '../api';
import axios from 'axios';
import { interventionApi } from '../api';
import NotificationsInterface from './NotificationsInterface';
import EquipmentStatusBar from './EquipmentStatusBar';

const OperatorInterface = ({ equipmentStatuses = [] }) => {
  const [equipments, setEquipments] = useState([]);
  const [formData, setFormData] = useState({
    stopType: '',
    equipment: '',
    description: '',
    photo: null,
    demandeurNom: '',
    demandeurEmail: '',
    demandeurTelephone: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [interventionRef, setInterventionRef] = useState('');
  const [notificationCount, setNotificationCount] = useState(0);
  const [currentView, setCurrentView] = useState('demande'); // 'demande' or 'notifications'

  // Fetch notification count
  const fetchNotificationCount = async () => {
    try {
      const response = await technicienApi.getInterventionsStatus();
      if (response.data) {
        const interventions = response.data.interventions || response.data;
        if (Array.isArray(interventions)) {
          const unreadCount = interventions.filter(intervention => 
            intervention.intervention_status !== 'terminee' && 
            intervention.intervention_status !== 'completed'
          ).length;
          setNotificationCount(unreadCount);
        }
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  useEffect(() => {
    console.log('🚀 OperatorInterface useEffect triggered');
    
    const fetchEquipments = async () => {
      try {
        const response = await equipmentApi.getEquipments();
        setEquipments(response.data.map(eq => ({
          value: eq.id,
          label: eq.nom,
          location: eq.localisation || 'Non spécifié',
          type: eq.type,
          priority: determinePriority(eq.type)
        })));
      } catch (error) {
        console.error("Impossible de charger la liste des équipements.", error);
        // Fallback data
        setEquipments([
  { value: 1, label: 'Presse Hydraulique PH-001', type: 'Presse', priority: 'elevee' },
  { value: 2, label: 'Malaxeur MLX-002', type: 'Malaxeur', priority: 'moyenne' },
  { value: 3, label: 'Convoyeur CV-003', type: 'Convoyeur', priority: 'moyenne' },
  { value: 4, label: 'Four Séchage FS-004', type: 'Four', priority: 'moyenne' },
  { value: 5, label: 'Pompe Principale PP-005', type: 'Pompe', priority: 'moyenne' },
  { value: 6, label: 'Compresseur CP-006', type: 'Compresseur', priority: 'moyenne' },
  { value: 9, label: 'Centrale à Béton Principal', type: 'Production', priority: 'elevee' },
  { value: 10, label: 'Malaxeur Industriel 2500L', type: 'Production', priority: 'elevee' },
  { value: 11, label: 'Système Dosage Automatique', type: 'Production', priority: 'elevee' },
  { value: 19, label: 'Pont Roulant 10T-A', type: 'Manutention', priority: 'moyenne' },
  { value: 21, label: 'Chariot Élévateur Diesel', type: 'Manutention', priority: 'moyenne' },
  { value: 27, label: 'Compresseur Atlas 30kW', type: 'Utilité', priority: 'moyenne' },
  { value: 29, label: 'Groupe Électrogène 500kVA', type: 'Utilité', priority: 'elevee' },
  { value: 28, label: 'Compresseur Backup 15kW', type: 'Utilité', priority: 'basse' },
  { value: 30, label: 'Presse Compression', type: 'Laboratoire', priority: 'basse' },
  { value: 31, label: 'Étuve Séchage', type: 'Laboratoire', priority: 'basse' },
  { value: 32, label: 'Tamiseuse', type: 'Laboratoire', priority: 'basse' },
  { value: 22, label: 'Chariot Élévateur Électrique', type: 'Manutention', priority: 'basse' }
]);
      }
    };

    const initializeData = async () => {
      console.log('📋 Initializing operator interface data...');
      await fetchEquipments();
      await fetchNotificationCount();
    };

    initializeData();
    
    // Update notification count every 30 seconds
    const interval = setInterval(() => {
      console.log('🔄 Interval refresh triggered');
      fetchNotificationCount();
    }, 30000);
    
    return () => {
      console.log('🧹 Cleaning up interval');
      clearInterval(interval);
    };
  }, []);

  const determinePriority = (equipmentType) => {
    const priorityMap = {
      'production': 'elevee',
      'transport': 'moyenne',
      'utilité': 'basse',
      'default': 'moyenne'
    };
    return priorityMap[equipmentType] || priorityMap.default;
  };

  const stopTypes = [
    { value: 'AM', label: 'Arrêt de Maintenance (AM)', description: 'Maintenance préventive ou corrective' },
    { value: 'AP', label: 'Arrêt de Production (AP)', description: 'Problème affectant la production' },
    { value: 'AN', label: 'Arrêt Non Planifié (AN)', description: 'Panne inattendue' },
    { value: 'CM', label: 'Changement de Moule (CM)', description: 'Changement d\'outillage' },
  ];

  const selectedEquipment = equipments.find(eq => eq.value === parseInt(formData.equipment));

  const detectInterventionType = (description) => {
    const keywords = {
      mecanique: ['fuite', 'usure', 'cassé', 'bloqué', 'vibration', 'bruit', 'graissage', 'roulement', 'courroie'],
      electrique: ['court-circuit', 'fusible', 'câble', 'moteur', 'électrique', 'tension', 'disjoncteur', 'capteur'],
      pneumatique: ['pression', 'air', 'vérin', 'pneumatique', 'compresseur', 'fuite d\'air'],
      hydraulique: ['huile', 'hydraulique', 'pompe', 'vérin hydraulique', 'pression hydraulique', 'fuite d\'huile'],
    };

    const desc = description.toLowerCase();
    for (const [type, words] of Object.entries(keywords)) {
      if (words.some(word => desc.includes(word))) {
        return type;
      }
    }
    return 'mecanique';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        photo: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.stopType || !formData.equipment || !formData.description.trim()) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (!formData.demandeurNom || !formData.demandeurEmail) {
      alert('Veuillez renseigner vos informations de contact.');
      return;
    }

    const selectedEquipment = equipments.find(eq => eq.value === parseInt(formData.equipment));
    if (!selectedEquipment) {
      alert("Équipement non trouvé.");
      return;
    }

    const detectedType = detectInterventionType(formData.description);
    setLoading(true);

    try {
      const interventionData = {
        equipement_id: selectedEquipment.value,
        type_arret: formData.stopType,
        description: formData.description,
        priorite: selectedEquipment.priority,
        type_probleme: detectedType,
        demandeur_nom: formData.demandeurNom,
        demandeur_email: formData.demandeurEmail,
        demandeur_telephone: formData.demandeurTelephone || null,
        photo_path: null
      };

      const response = await interventionApi.createIntervention(interventionData);

      setInterventionRef(response.data.reference);
      setSubmitted(true);
      
      // Refresh notification count
      fetchNotificationCount();
      
      // Reset form
      setFormData({ 
        stopType: '', 
        equipment: '', 
        description: '', 
        photo: null,
        demandeurNom: '',
        demandeurEmail: '',
        demandeurTelephone: '',
      });
      
      const fileInput = document.getElementById('photo-upload');
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Erreur:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'Erreur inconnue';
      alert(`Erreur lors de la création de la demande: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleNewRequest = () => {
    setSubmitted(false);
    setInterventionRef('');
  };

  const renderSuccessMessage = () => (
    <div className="success-message">
      <div className="success-icon">✅</div>
      <h2>Demande d'intervention créée avec succès!</h2>
      <div className="reference-info">
        <p>Référence de votre demande:</p>
        <div className="reference-number">{interventionRef}</div>
        <p>Vous pouvez utiliser cette référence pour suivre l'avancement de votre demande.</p>
      </div>
      <button onClick={handleNewRequest} className="new-request-button">
        ➕ Nouvelle demande
      </button>
    </div>
  );

  const renderRequestForm = () => (
    <div className="operator-content">
      <form onSubmit={handleSubmit} className="intervention-form">
        <div className="form-section">
          <label className="form-label">Type d'arrêt <span className="required">*</span></label>
          <div className="radio-group">
            {stopTypes.map((type) => (
              <label key={type.value} className="radio-option">
                <input
                  type="radio"
                  name="stopType"
                  value={type.value}
                  checked={formData.stopType === type.value}
                  onChange={handleInputChange}
                />
                <div className="radio-content">
                  <span className="radio-label">{type.label}</span>
                  <span className="radio-description">{type.description}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="form-section">
          <label className="form-label" htmlFor="equipment">
            Équipement concerné <span className="required">*</span>
          </label>
          <select
            id="equipment"
            name="equipment"
            value={formData.equipment}
            onChange={handleInputChange}
            className="form-select"
          >
            <option value="">Sélectionnez un équipement</option>
            {equipments.map((equipment) => (
              <option key={equipment.value} value={equipment.value}>
                {equipment.label} - {equipment.location}
              </option>
            ))}
          </select>

          {selectedEquipment && (
            <div className="equipment-info">
              <div className="equipment-details">
                <span className="equipment-type">Type: {selectedEquipment.type}</span>
                <span className="equipment-location">📍 {selectedEquipment.location}</span>
                <span className={`equipment-priority priority-${selectedEquipment.priority.toLowerCase()}`}>
                  Priorité: {selectedEquipment.priority}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="form-section">
          <label className="form-label" htmlFor="description">
            Description du problème <span className="required">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Décrivez en détail le problème rencontré (ex: fuite d'huile, bruit anormal, panne électrique...)"
            className="form-textarea"
            rows="4"
          />
          {formData.description && (
            <div className="intervention-type-preview">
              <span className="type-label">Type d'intervention détecté:</span>
              <span className="detected-type">{detectInterventionType(formData.description)}</span>
            </div>
          )}
        </div>

        <div className="form-section">
          <label className="form-label demandeur-label" htmlFor="demandeurNom">
            Nom du demandeur <span className="required">*</span>
          </label>
          <input
            type="text"
            id="demandeurNom"
            name="demandeurNom"
            value={formData.demandeurNom}
            onChange={handleInputChange}
            placeholder="Votre nom complet"
            className="form-input"
            required
          />
        </div>

        <div className="form-section">
          <label className="form-label demandeur-label" htmlFor="demandeurEmail">
            Email du demandeur <span className="required">*</span>
          </label>
          <input
            type="email"
            id="demandeurEmail"
            name="demandeurEmail"
            value={formData.demandeurEmail}
            onChange={handleInputChange}
            placeholder="votre.email@example.com"
            className="form-input"
            required
          />
        </div>

        <div className="form-section">
          <label className="form-label optional-label" htmlFor="demandeurTelephone">
            Téléphone du demandeur (optionnel)
          </label>
          <input
            type="tel"
            id="demandeurTelephone"
            name="demandeurTelephone"
            value={formData.demandeurTelephone}
            onChange={handleInputChange}
            placeholder="06 XX XX XX XX"
            className="form-input"
          />
        </div>

        <div className="form-section">
          <label className="form-label" htmlFor="photo-upload">Photo (optionnel)</label>
          <div className="photo-upload-container">
            <input
              type="file"
              id="photo-upload"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="photo-input"
            />
            <label htmlFor="photo-upload" className="photo-upload-button">
              📷 Ajouter une photo
            </label>
            {formData.photo && (
              <div className="photo-preview">
                <span className="photo-name">📎 {formData.photo.name}</span>
              </div>
            )}
          </div>
        </div>

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? (
            <>⏳ Envoi en cours...</>
          ) : (
            <>✉️ Envoyer la demande d'intervention</>
          )}
        </button>
      </form>
    </div>
  );

  return (
    <div className="operator-interface">
      {/* Use EquipmentStatusBar component for the notification */}
      <EquipmentStatusBar />

      {/* Header with title and navigation buttons */}
      <div className="interface-header">
        <h1 className="interface-title">Operator Interface</h1>
        <div className="header-buttons">
          <button 
            className={`header-button ${currentView === 'demande' ? 'active' : ''}`}
            onClick={() => {
              setCurrentView('demande');
              setSubmitted(false);
            }}
          >
            📝 Demande
          </button>
          <button 
            className={`header-button notification-button ${currentView === 'notifications' ? 'active' : ''}`}
            onClick={() => setCurrentView('notifications')}
          >
            🔔 Notifications
            {notificationCount > 0 && (
              <span className="notification-badge">{notificationCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Content based on current view */}
      <div className="interface-content">
        {currentView === 'notifications' ? (
          <NotificationsInterface />
        ) : (
          submitted ? renderSuccessMessage() : renderRequestForm()
        )}
      </div>
    </div>
  );
};

export default OperatorInterface;