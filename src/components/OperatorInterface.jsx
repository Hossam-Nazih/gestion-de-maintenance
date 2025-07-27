import './OperatorInterface.css';
import React, { useState, useEffect } from 'react';

const OperatorInterface = () => {
  const [equipments, setEquipments] = useState([]);
  const [formData, setFormData] = useState({
    stopType: '',
    equipment: '',
    description: '',
    photo: null,
  });

  useEffect(() => {
  const fetchEquipments = async () => {
    try {
      const response = await equipmentApi.getEquipments();
      setEquipments(response.data.map(eq => ({
        value: eq.id,
        label: eq.nom,
        location: eq.localisation,
        type: eq.type,
        priority: eq.priorite || 'MOYENNE'
      })));
    } catch (error) {
      console.error("Impossible de charger la liste des équipements.", error);
    }
  };

  fetchEquipments();
}, []);



  const stopTypes = [
    { value: 'AM', label: 'Arrêt de Maintenance (AM)', description: 'Maintenance préventive ou corrective' },
    { value: 'AP', label: 'Arrêt de Production (AP)', description: 'Problème affectant la production' },
    { value: 'AN', label: 'Arrêt Non Planifié (AN)', description: 'Panne inattendue' },
    { value: 'CM', label: 'Changement de Moule (CM)', description: 'Changement d\'outillage' },
  ];

  const selectedEquipment = equipments.find(eq => eq.value === formData.equipment);

  const detectInterventionType = (description) => {
    const keywords = {
      MECANIQUE: ['fuite', 'usure', 'cassé', 'bloqué', 'vibration', 'bruit', 'graissage', 'roulement', 'courroie'],
      ELECTRIQUE: ['court-circuit', 'fusible', 'câble', 'moteur', 'électrique', 'tension', 'disjoncteur', 'capteur'],
      PNEUMATIQUE: ['pression', 'air', 'vérin', 'pneumatique', 'compresseur', 'fuite d\'air'],
      HYDRAULIQUE: ['huile', 'hydraulique', 'pompe', 'vérin hydraulique', 'pression hydraulique', 'fuite d\'huile'],
    };

    const desc = description.toLowerCase();
    for (const [type, words] of Object.entries(keywords)) {
      if (words.some(word => desc.includes(word))) {
        return type;
      }
    }
    return 'MECANIQUE';
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

  const selectedEquipment = equipments.find(eq => eq.value === formData.equipment);
  if (!selectedEquipment) {
    alert("Équipement non trouvé.");
    return;
  }

  const detectedType = detectInterventionType(formData.description);

  try {
    const response = await interventionApi.createIntervention({
      equipement_id: selectedEquipment.value,
      type_arret: formData.stopType,
      description: formData.description,
      priorite: selectedEquipment.priority.toLowerCase(),
      type_probleme: detectedType.toLowerCase(),
      demandeur_nom: "Current User", // Replace with actual user name
      demandeur_email: "user@example.com" // Replace with actual user email
    });

    alert('Demande d\'intervention créée avec succès !');
    setFormData({ stopType: '', equipment: '', description: '', photo: null });
    const fileInput = document.getElementById('photo-upload');
    if (fileInput) fileInput.value = '';
  } catch (error) {
    console.error('Erreur:', error);
    alert(`Erreur lors de la création de la demande: ${error.response?.data?.detail || error.message}`);
  }
};

  return (
    <div className="operator-interface">
      <div className="interface-header">
        <h2>🔧 Interface Demandeur</h2>
        <p>Créer une nouvelle demande d'intervention</p>
      </div>

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

        <button type="submit" className="submit-button">
          ✉️ Envoyer la demande d'intervention
        </button>
      </form>
    </div>
  );
};

export default OperatorInterface;
