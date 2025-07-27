import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, Upload, Send } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';

export default function OperatorScreen() {
  const [selectedStopType, setSelectedStopType] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [selectedInterventionType, setSelectedInterventionType] = useState('');
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState('');

  const stopTypes = [
    { label: 'Arrêt Mécanique (AM)', value: 'AM' },
    { label: 'Arrêt Pneumatique (AP)', value: 'AP' },
    { label: 'Arrêt Anticipé (AN)', value: 'AN' },
    { label: 'Changement de Moule (CM)', value: 'CM' },
  ];

  const equipments = [
    { label: 'Presse hydraulique #1', value: 'PRESSE_01' },
    { label: 'Convoyeur principal', value: 'CONV_01' },
    { label: 'Compresseur d\'air', value: 'COMP_01' },
    { label: 'Système de refroidissement', value: 'COOL_01' },
    { label: 'Robot de soudage', value: 'ROBOT_01' },
  ];

  const interventionTypes = [
    { label: 'Mécanique', value: 'MECANIQUE' },
    { label: 'Électrique', value: 'ELECTRIQUE' },
    { label: 'Pneumatique', value: 'PNEUMATIQUE' },
    { label: 'Hydraulique', value: 'HYDRAULIQUE' },
  ];

  const handleSubmit = () => {
    if (!selectedStopType || !selectedEquipment || !selectedInterventionType || !description) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const newRequest = {
      id: Date.now().toString(),
      stopType: selectedStopType,
      equipment: selectedEquipment,
      interventionType: selectedInterventionType,
      description,
      photo: photoUri,
      timestamp: new Date().toISOString(),
      status: 'EN_ATTENTE',
      priority: selectedEquipment.includes('PRESSE') ? 'ELEVEE' : 'MOYENNE',
    };

    // Simuler l'envoi de la demande
    Alert.alert('Succès', 'Demande d\'intervention envoyée avec succès!');
    
    // Réinitialiser le formulaire
    setSelectedStopType('');
    setSelectedEquipment('');
    setSelectedInterventionType('');
    setDescription('');
    setPhotoUri('');
  };

  const handlePhotoUpload = () => {
    // Simuler l'upload de photo
    setPhotoUri('https://images.pexels.com/photos/1427541/pexels-photo-1427541.jpeg?auto=compress&cs=tinysrgb&w=400');
    Alert.alert('Info', 'Photo ajoutée avec succès!');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Nouvelle Demande d'Intervention</Text>
          <Text style={styles.subtitle}>Signaler un arrêt d'équipement</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.section}>
            <Text style={styles.label}>Type d'arrêt *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedStopType}
                onValueChange={(value) => setSelectedStopType(value)}
                style={styles.picker}
              >
                <Picker.Item label="Sélectionnez un type d'arrêt" value="" />
                {stopTypes.map((type) => (
                  <Picker.Item key={type.value} label={type.label} value={type.value} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Équipement concerné *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedEquipment}
                onValueChange={(value) => setSelectedEquipment(value)}
                style={styles.picker}
              >
                <Picker.Item label="Sélectionnez un équipement" value="" />
                {equipments.map((equipment) => (
                  <Picker.Item key={equipment.value} label={equipment.label} value={equipment.value} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Type d'intervention *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedInterventionType}
                onValueChange={(value) => setSelectedInterventionType(value)}
                style={styles.picker}
              >
                <Picker.Item label="Sélectionnez le type d'intervention" value="" />
                {interventionTypes.map((type) => (
                  <Picker.Item key={type.value} label={type.label} value={type.value} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Description du problème *</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              placeholder="Décrivez le problème rencontré..."
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Photo (optionnel)</Text>
            <TouchableOpacity style={styles.photoButton} onPress={handlePhotoUpload}>
              <Upload size={20} color="#3B82F6" />
              <Text style={styles.photoButtonText}>Ajouter une photo</Text>
            </TouchableOpacity>
            {photoUri && (
              <Image source={{ uri: photoUri }} style={styles.previewImage} />
            )}
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Send size={20} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>Envoyer la demande</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#3B82F6',
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
  form: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  picker: {
    height: 50,
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
    padding: 12,
    justifyContent: 'center',
  },
  photoButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    marginLeft: 8,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 12,
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