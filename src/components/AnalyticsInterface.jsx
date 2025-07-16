import React, { useState } from 'react';
import './AnalyticsInterface.css';

const AnalyticsInterface = () => {
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
    { type: 'Mécanique', count: 45, percentage: 30.6, color: '#3b82f6' },
    { type: 'Électrique', count: 38, percentage: 25.9, color: '#f59e0b' },
    { type: 'Pneumatique', count: 32, percentage: 21.8, color: '#10b981' },
    { type: 'Hydraulique', count: 32, percentage: 21.8, color: '#ef4444' },
  ];

  const equipmentStatus = [
    { name: 'Presse hydraulique #1', status: 'EN_COURS', downtime: '4h 30min', location: 'Atelier A' },
    { name: 'Convoyeur principal', status: 'OPERATIONNEL', downtime: '0h', location: 'Ligne 1' },
    { name: 'Compresseur d\'air #1', status: 'OPERATIONNEL', downtime: '0h', location: 'Local technique' },
    { name: 'Système de refroidissement', status: 'MAINTENANCE', downtime: '2h 15min', location: 'Toiture' },
    { name: 'Robot de soudage #1', status: 'OPERATIONNEL', downtime: '0h', location: 'Atelier B' },
    { name: 'Robot de soudage #2', status: 'OPERATIONNEL', downtime: '0h', location: 'Atelier B' },
    { name: 'Climatisation bureau', status: 'OPERATIONNEL', downtime: '0h', location: 'Bureaux' },
    { name: 'Pont roulant', status: 'OPERATIONNEL', downtime: '0h', location: 'Atelier principal' },
  ];

  const monthlyTrends = [
    { month: 'Jan', interventions: 32, downtime: 45 },
    { month: 'Fév', interventions: 28, downtime: 38 },
    { month: 'Mar', interventions: 35, downtime: 52 },
    { month: 'Avr', interventions: 42, downtime: 61 },
    { month: 'Mai', interventions: 38, downtime: 48 },
    { month: 'Juin', interventions: 31, downtime: 42 },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPERATIONNEL': return '#10b981';
      case 'EN_COURS': return '#f59e0b';
      case 'MAINTENANCE': return '#ef4444';
      case 'ARRET': return '#dc2626';
      default: return '#6b7280';
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

  const operationalCount = equipmentStatus.filter(eq => eq.status === 'OPERATIONNEL').length;
  const totalEquipment = equipmentStatus.length;
  const availabilityPercentage = ((operationalCount / totalEquipment) * 100).toFixed(1);

  return (
    <div className="analytics-interface">
      <div className="interface-header">
        <h2>📊 Tableau de Bord</h2>
        <p>Analytique des interventions et performance des équipements</p>
      </div>

      <div className="analytics-content">
        {/* Sélecteur de période */}
        <div className="period-selector">
          {periods.map((period) => (
            <button
              key={period.value}
              className={`period-button ${selectedPeriod === period.value ? 'active' : ''}`}
              onClick={() => setSelectedPeriod(period.value)}
            >
              {period.label}
            </button>
          ))}
        </div>

        {/* Statistiques principales */}
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <div className="stat-number">{stats.totalInterventions}</div>
              <div className="stat-label">Interventions totales</div>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <div className="stat-number">{stats.averageRepairTime}h</div>
              <div className="stat-label">Temps moyen de réparation</div>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <div className="stat-number">{availabilityPercentage}%</div>
              <div className="stat-label">Disponibilité équipements</div>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <div className="stat-number">{stats.urgentInterventions}</div>
              <div className="stat-label">Interventions urgentes</div>
            </div>
          </div>
        </div>

        <div className="charts-grid">
          {/* Répartition par type d'intervention */}
          <div className="chart-card">
            <h3>Répartition par type d'intervention</h3>
            <div className="chart-container">
              {interventionsByType.map((item, index) => (
                <div key={index} className="chart-item">
                  <div className="chart-item-header">
                    <div className="chart-item-info">
                      <div 
                        className="chart-color-indicator"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="chart-item-type">{item.type}</span>
                    </div>
                    <span className="chart-item-count">{item.count}</span>
                  </div>
                  <div className="chart-bar">
                    <div
                      className="chart-bar-fill"
                      style={{ 
                        width: `${item.percentage}%`,
                        backgroundColor: item.color
                      }}
                    ></div>
                  </div>
                  <div className="chart-item-percentage">{item.percentage}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tendances mensuelles */}
          <div className="chart-card">
            <h3>Tendances mensuelles</h3>
            <div className="trend-chart">
              {monthlyTrends.map((data, index) => (
                <div key={index} className="trend-item">
                  <div className="trend-bars">
                    <div 
                      className="trend-bar interventions"
                      style={{ height: `${(data.interventions / 50) * 100}%` }}
                      title={`${data.interventions} interventions`}
                    ></div>
                    <div 
                      className="trend-bar downtime"
                      style={{ height: `${(data.downtime / 70) * 100}%` }}
                      title={`${data.downtime}h d'arrêt`}
                    ></div>
                  </div>
                  <div className="trend-label">{data.month}</div>
                </div>
              ))}
            </div>
            <div className="trend-legend">
              <div className="legend-item">
                <div className="legend-color interventions"></div>
                <span>Interventions</span>
              </div>
              <div className="legend-item">
                <div className="legend-color downtime"></div>
                <span>Temps d'arrêt (h)</span>
              </div>
            </div>
          </div>
        </div>

        {/* État des équipements */}
        <div className="equipment-section">
          <h3>État des équipements en temps réel</h3>
          <div className="equipment-grid">
            {equipmentStatus.map((equipment, index) => (
              <div key={index} className="equipment-card">
                <div className="equipment-header">
                  <div className="equipment-info">
                    <h4 className="equipment-name">{equipment.name}</h4>
                    <span className="equipment-location">📍 {equipment.location}</span>
                  </div>
                  <div className="equipment-status">
                    <div
                      className="status-indicator"
                      style={{ backgroundColor: getStatusColor(equipment.status) }}
                    ></div>
                    <span 
                      className="status-text"
                      style={{ color: getStatusColor(equipment.status) }}
                    >
                      {getStatusText(equipment.status)}
                    </span>
                  </div>
                </div>
                <div className="equipment-downtime">
                  <span className="downtime-icon">🕒</span>
                  <span className="downtime-text">
                    {equipment.downtime === '0h' ? 'Aucun arrêt' : `Arrêt: ${equipment.downtime}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Indicateurs de performance */}
        <div className="performance-section">
          <h3>Indicateurs de performance</h3>
          <div className="performance-grid">
            <div className="performance-card completed">
              <div className="performance-icon">✅</div>
              <div className="performance-content">
                <div className="performance-number">{stats.completedInterventions}</div>
                <div className="performance-label">Interventions terminées</div>
                <div className="performance-percentage">
                  {((stats.completedInterventions / stats.totalInterventions) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
            <div className="performance-card pending">
              <div className="performance-icon">⏳</div>
              <div className="performance-content">
                <div className="performance-number">{stats.pendingInterventions}</div>
                <div className="performance-label">En attente</div>
                <div className="performance-percentage">
                  {((stats.pendingInterventions / stats.totalInterventions) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
            <div className="performance-card efficiency">
              <div className="performance-icon">⚡</div>
              <div className="performance-content">
                <div className="performance-number">{stats.averageRepairTime}h</div>
                <div className="performance-label">Temps moyen</div>
                <div className="performance-trend">-15% vs mois dernier</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsInterface;