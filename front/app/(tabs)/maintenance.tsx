import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, Wrench, User, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Send } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';

export default function MaintenanceScreen() {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [fixDuration, setFixDuration] = useState('');
  const [machineHours, setMachineHours] = useState('');
  const [fixDescription, setFixDescription] = useState('');
  const [changedParts, setChangedParts] = useState('');
  const [fixType, setFixType] = useState('');
  const [status, setStatus] = useState('');
  const [forwardTo, setForwardTo] = useState('');

  const requests = [
    {
      id: '1',
      stopType: 'AM',
      equipment: 'Presse hydraulique #1',
      interventionType: 'Mécanique',
      description: 'Fuite d\'huile importante au niveau du vérin principal',
      timestamp: '2024-01-15T08:30:00Z',
      status: 'EN_ATTENTE',
      priority: 'ELEVEE',
      operator: 'Jean Dupont',
    },
    {
      id: '2',
      stopType: 'AP',
      equipment: 'Compresseur d\'air',
      interventionType: 'Pneumatique',
      description: 'Pression insuffisante dans le circuit principal',
      timestamp: '2024-01-15T09:15:00Z',
      status: 'EN_COURS',
      priority: 'MOYENNE',
      operator: 'Marie Martin',
    },
    {
      id: '3',
      stopType: 'AN',
      equipment: 'Système de refroidissement',
      interventionType: 'Électrique',
      description: 'Capteur de température défaillant',
      timestamp: '2024-01-15T10:00:00Z',
      status: 'EN_ATTENTE',
      priority: 'BASSE',
      operator: 'Pierre Leroy',
    },
  ];

  const specialists = [
    { label: 'Service Électrique', value: 'ELECTRIQUE' },
    { label: 'Service Hydraulique', value: 'HYDRAULIQUE' },
    { label: 'Service Pneumatique', value: 'PNEUMATIQUE' },
    { label: 'Service Mécanique', value: 'MECANIQUE' },
  ];

  const handleOpenModal = (request) => {
    setSelectedRequest(request);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedRequest(null);
    setFixDuration('');
    setMachineHours('');
    setFixDescription('');
    setChangedParts('');
    setFixType('');
    setStatus('');
    setForwardTo('');
  };

  const handleSubmitFix = () => {
    if (!fixDuration || !machineHours || !fixDescription || !status) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }

    Alert.alert('Succès', 'Intervention mise à jour avec succès!');
    handleCloseModal();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'EN_ATTENTE': return '#F59E0B';
      case 'EN_COURS': return '#3B82F6';
      case 'TERMINEE': return '#10B981';
      case 'REPORTEE': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'ELEVEE': return '#EF4444';
      case 'MOYENNE': return '#F59E0B';
      case 'BASSE': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'EN_ATTENTE': return 'En attente';
      case 'EN_COURS': return 'En cours';
      case 'TERMINEE': return 'Terminée';
      case 'REPORTEE': return 'Reportée';
      default: return status;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestion des Interventions</Text>
        <Text style={styles.subtitle}>Équipe de maintenance</Text>
      </View>

      <ScrollView style={styles.content}>
        {requests.map((request) => (
          <TouchableOpacity
            key={request.id}
            style={styles.requestCard}
            onPress={() => handleOpenModal(request)}
          >
            <View style={styles.requestHeader}>
              <View style={styles.requestInfo}>
                <Text style={styles.equipmentName}>{request.equipment}</Text>
                <Text style={styles.stopType}>{request.stopType} - {request.interventionType}</Text>
              </View>
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(request.status) }]} />
                <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                  {getStatusText(request.status)}
                </Text>
              </View>
            </View>

            <Text style={styles.description}>{request.description}</Text>

            <View style={styles.requestFooter}>
              <View style={styles.operatorInfo}>
                <User size={16} color="#6B7280" />
                <Text style={styles.operator}>{request.operator}</Text>
              </View>
              <View style={styles.priorityBadge}>
                <Text style={[styles.priorityText, { color: getPriorityColor(request.priority) }]}>
                  Priorité {request.priority.toLowerCase()}
                </Text>
              </View>
            </View>

            <View style={styles.timestamp}>
              <Clock size={14} color="#9CA3AF" />
              <Text style={styles.timestampText}>
                {new Date(request.timestamp).toLocaleString('fr-FR')}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Intervention</Text>
            <TouchableOpacity onPress={handleCloseModal}>
              <Text style={styles.closeButton}>Fermer</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedRequest && (
              <View style={styles.requestSummary}>
                <Text style={styles.summaryTitle}>{selectedRequest.equipment}</Text>
                <Text style={styles.summaryDescription}>{selectedRequest.description}</Text>
              </View>
            )}

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Durée de fixation (heures) *</Text>
              <TextInput
                style={styles.input}
                value={fixDuration}
                onChangeText={setFixDuration}
                placeholder="Ex: 2.5"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Heures machine à l'arrêt *</Text>
              <TextInput
                style={styles.input}
                value={machineHours}
                onChangeText={setMachineHours}
                placeholder="Ex: 5200"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Description de la réparation *</Text>
              <TextInput
                style={styles.textArea}
                value={fixDescription}
                onChangeText={setFixDescription}
                placeholder="Décrivez les actions effectuées..."
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Pièces changées</Text>
              <TextInput
                style={styles.textArea}
                value={changedParts}
                onChangeText={setChangedParts}
                placeholder="Listez les pièces remplacées..."
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Type de fixation</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={fixType}
                  onValueChange={setFixType}
                  style={styles.picker}
                >
                  <Picker.Item label="Sélectionnez le type" value="" />
                  <Picker.Item label="Temporaire" value="TEMPORAIRE" />
                  <Picker.Item label="Permanente" value="PERMANENTE" />
                </Picker>
              </View>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Transférer à un spécialiste</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={forwardTo}
                  onValueChange={setForwardTo}
                  style={styles.picker}
                >
                  <Picker.Item label="Aucun transfert" value="" />
                  {specialists.map((specialist) => (
                    <Picker.Item key={specialist.value} label={specialist.label} value={specialist.value} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Statut *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={status}
                  onValueChange={setStatus}
                  style={styles.picker}
                >
                  <Picker.Item label="Sélectionnez le statut" value="" />
                  <Picker.Item label="En cours" value="EN_COURS" />
                  <Picker.Item label="Terminée" value="TERMINEE" />
                  <Picker.Item label="Reportée" value="REPORTEE" />
                </Picker>
              </View>
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmitFix}>
              <CheckCircle size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Valider l'intervention</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#059669',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#E5E7EB',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
  },
  equipmentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  stopType: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
    lineHeight: 20,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  operatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  operator: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  timestamp: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestampText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    color: '#3B82F6',
    fontSize: 16,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  requestSummary: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  summaryDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  picker: {
    height: 50,
  },
  submitButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
});