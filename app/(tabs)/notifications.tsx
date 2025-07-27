import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Clock, User, Wrench } from 'lucide-react-native';

export default function NotificationsScreen() {
  const [refreshing, setRefreshing] = useState(false);
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
      icon: 'CheckCircle',
    },
    {
      id: '2',
      type: 'new_request',
      title: 'Nouvelle demande d\'intervention',
      message: 'Compresseur d\'air - Pression insuffisante signalée',
      equipment: 'Compresseur d\'air',
      timestamp: '2024-01-15T13:45:00Z',
      read: false,
      priority: 'medium',
      icon: 'AlertCircle',
    },
    {
      id: '3',
      type: 'status_update',
      title: 'Intervention en cours',
      message: 'Système de refroidissement - Maintenance préventive démarrée',
      equipment: 'Système de refroidissement',
      timestamp: '2024-01-15T12:20:00Z',
      read: true,
      priority: 'low',
      icon: 'Wrench',
    },
    {
      id: '4',
      type: 'reminder',
      title: 'Rappel de maintenance',
      message: 'Robot de soudage - Maintenance programmée dans 2 jours',
      equipment: 'Robot de soudage',
      timestamp: '2024-01-15T11:00:00Z',
      read: true,
      priority: 'medium',
      icon: 'Clock',
    },
    {
      id: '5',
      type: 'assignment',
      title: 'Nouvelle assignation',
      message: 'Vous avez été assigné à l\'intervention sur le convoyeur principal',
      equipment: 'Convoyeur principal',
      timestamp: '2024-01-15T10:15:00Z',
      read: false,
      priority: 'high',
      icon: 'User',
    },
  ];

  const filters = [
    { label: 'Toutes', value: 'all' },
    { label: 'Non lues', value: 'unread' },
    { label: 'Urgentes', value: 'urgent' },
    { label: 'Terminées', value: 'completed' },
  ];

  const getIconComponent = (iconName) => {
    switch (iconName) {
      case 'CheckCircle': return CheckCircle;
      case 'AlertCircle': return AlertCircle;
      case 'Wrench': return Wrench;
      case 'Clock': return Clock;
      case 'User': return User;
      default: return Bell;
    }
  };

  const getIconColor = (priority) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#FEF2F2';
      case 'medium': return '#FFFBEB';
      case 'low': return '#F0FDF4';
      default: return '#F9FAFB';
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

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <Text style={styles.subtitle}>État des équipements et interventions</Text>
      </View>

      {/* Filtres */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.value}
              style={[
                styles.filterButton,
                selectedFilter === filter.value && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFilter(filter.value)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === filter.value && styles.filterButtonTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>Aucune notification</Text>
            <Text style={styles.emptyStateSubtext}>
              Vous n'avez pas de notifications pour le moment
            </Text>
          </View>
        ) : (
          filteredNotifications.map((notification) => {
            const IconComponent = getIconComponent(notification.icon);
            return (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationCard,
                  !notification.read && styles.notificationCardUnread,
                  { backgroundColor: getPriorityColor(notification.priority) },
                ]}
              >
                <View style={styles.notificationHeader}>
                  <View style={styles.notificationIcon}>
                    <IconComponent
                      size={20}
                      color={getIconColor(notification.priority)}
                    />
                  </View>
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>
                      {notification.title}
                    </Text>
                    <Text style={styles.notificationMessage}>
                      {notification.message}
                    </Text>
                    <Text style={styles.notificationEquipment}>
                      Équipement: {notification.equipment}
                    </Text>
                  </View>
                  {!notification.read && (
                    <View style={styles.unreadIndicator} />
                  )}
                </View>
                <Text style={styles.notificationTime}>
                  {formatTimeAgo(notification.timestamp)}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
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
    backgroundColor: '#DC2626',
    padding: 20,
    paddingTop: 40,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  badge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  subtitle: {
    fontSize: 16,
    color: '#FEE2E2',
  },
  filterContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#E5E7EB',
  },
  notificationCardUnread: {
    borderLeftColor: '#3B82F6',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 4,
  },
  notificationEquipment: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginLeft: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});