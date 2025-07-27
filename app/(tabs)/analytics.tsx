import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChartBar as BarChart3, TrendingUp, Clock, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  const periods = [
    { label: 'Semaine', value: 'week' },
    { label: 'Mois', value: 'month' },
    { label: 'Trimestre', value: 'quarter' },
  ];

  const stats = {
    totalInterventions: 147,
    averageRepairTime: 2.3,
    equipmentAvailability: 94.2,
    urgentInterventions: 12,
    completedInterventions: 135,
    pendingInterventions: 12,
  };

  const interventionsByType = [
    { type: 'Mécanique', count: 45, percentage: 30.6 },
    { type: 'Électrique', count: 38, percentage: 25.9 },
    { type: 'Pneumatique', count: 32, percentage: 21.8 },
    { type: 'Hydraulique', count: 32, percentage: 21.8 },
  ];

  const equipmentStatus = [
    { name: 'Presse hydraulique #1', status: 'EN_COURS', downtime: '4h 30min' },
    { name: 'Convoyeur principal', status: 'OPERATIONNEL', downtime: '0h' },
    { name: 'Compresseur d\'air', status: 'OPERATIONNEL', downtime: '0h' },
    { name: 'Système de refroidissement', status: 'MAINTENANCE', downtime: '2h 15min' },
    { name: 'Robot de soudage', status: 'OPERATIONNEL', downtime: '0h' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPERATIONNEL': return '#10B981';
      case 'EN_COURS': return '#F59E0B';
      case 'MAINTENANCE': return '#EF4444';
      case 'ARRET': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'OPERATIONNEL': return 'Opérationnel';
      case 'EN_COURS': return 'En cours';
      case 'MAINTENANCE': return 'Maintenance';
      case 'ARRET': return 'Arrêt';
      default: return status;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tableau de Bord</Text>
        <Text style={styles.subtitle}>Analytique des interventions</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Période de sélection */}
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.value}
              style={[
                styles.periodButton,
                selectedPeriod === period.value && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period.value)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period.value && styles.periodButtonTextActive,
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Statistiques principales */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <BarChart3 size={24} color="#3B82F6" />
            <Text style={styles.statNumber}>{stats.totalInterventions}</Text>
            <Text style={styles.statLabel}>Interventions totales</Text>
          </View>

          <View style={styles.statCard}>
            <Clock size={24} color="#10B981" />
            <Text style={styles.statNumber}>{stats.averageRepairTime}h</Text>
            <Text style={styles.statLabel}>Temps moyen</Text>
          </View>

          <View style={styles.statCard}>
            <TrendingUp size={24} color="#059669" />
            <Text style={styles.statNumber}>{stats.equipmentAvailability}%</Text>
            <Text style={styles.statLabel}>Disponibilité</Text>
          </View>

          <View style={styles.statCard}>
            <AlertTriangle size={24} color="#EF4444" />
            <Text style={styles.statNumber}>{stats.urgentInterventions}</Text>
            <Text style={styles.statLabel}>Urgentes</Text>
          </View>
        </View>

        {/* Répartition par type d'intervention */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Répartition par type d'intervention</Text>
          <View style={styles.chartContainer}>
            {interventionsByType.map((item, index) => (
              <View key={index} style={styles.chartItem}>
                <View style={styles.chartItemHeader}>
                  <Text style={styles.chartItemType}>{item.type}</Text>
                  <Text style={styles.chartItemCount}>{item.count}</Text>
                </View>
                <View style={styles.chartBar}>
                  <View
                    style={[
                      styles.chartBarFill,
                      { width: `${item.percentage}%` },
                    ]}
                  />
                </View>
                <Text style={styles.chartItemPercentage}>{item.percentage}%</Text>
              </View>
            ))}
          </View>
        </View>

        {/* État des équipements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>État des équipements</Text>
          <View style={styles.equipmentList}>
            {equipmentStatus.map((equipment, index) => (
              <View key={index} style={styles.equipmentItem}>
                <View style={styles.equipmentInfo}>
                  <Text style={styles.equipmentName}>{equipment.name}</Text>
                  <View style={styles.equipmentStatus}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: getStatusColor(equipment.status) },
                      ]}
                    />
                    <Text style={styles.statusText}>
                      {getStatusText(equipment.status)}
                    </Text>
                  </View>
                </View>
                <View style={styles.downtimeContainer}>
                  <Clock size={16} color="#6B7280" />
                  <Text style={styles.downtimeText}>{equipment.downtime}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Indicateurs de performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Indicateurs de performance</Text>
          <View style={styles.performanceGrid}>
            <View style={styles.performanceCard}>
              <CheckCircle size={20} color="#10B981" />
              <Text style={styles.performanceNumber}>{stats.completedInterventions}</Text>
              <Text style={styles.performanceLabel}>Terminées</Text>
            </View>
            <View style={styles.performanceCard}>
              <Clock size={20} color="#F59E0B" />
              <Text style={styles.performanceNumber}>{stats.pendingInterventions}</Text>
              <Text style={styles.performanceLabel}>En attente</Text>
            </View>
          </View>
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
    backgroundColor: '#7C3AED',
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
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#3B82F6',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: (width - 48) / 2,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartItem: {
    marginBottom: 16,
  },
  chartItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chartItemType: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  chartItemCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  chartBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 4,
  },
  chartBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  chartItemPercentage: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
  },
  equipmentList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  equipmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  equipmentInfo: {
    flex: 1,
  },
  equipmentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  equipmentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
  },
  downtimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  downtimeText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  performanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  performanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: (width - 48) / 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  performanceNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  performanceLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});