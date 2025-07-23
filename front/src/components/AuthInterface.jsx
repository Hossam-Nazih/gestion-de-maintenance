import React, { useState } from 'react';
import './AuthInterface.css';
import { authApi } from '../api';

const AuthInterface = ({ onLogin, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'MAINTENANCE'
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const response = await authApi.login({
          username: formData.email,
          password: formData.password
        });
        
        const userData = {
          ...response.data.user,
          token: response.data.token || response.data.access_token, // Handle different token field names
        };
        
        localStorage.setItem('carriprefa_user', JSON.stringify(userData));
        onLogin(userData);
      } else {
        // Validate password confirmation
        if (formData.password !== formData.confirmPassword) {
          alert('Les mots de passe ne correspondent pas');
          return;
        }

        await authApi.register({
          email: formData.email,
          password: formData.password,
          username: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
        });
        
        alert('Inscription réussie ! Veuillez vous connecter.');
        setIsLogin(true);
        setFormData({
          ...formData,
          password: '',
          confirmPassword: ''
        });
      }
    } catch (err) {
      console.error('Auth error:', err);
      alert(`Erreur : ${err.response?.data?.detail || err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-overlay"></div>
      </div>
      
      <div className="auth-content">
        <div className="auth-header">
          <div className="company-logo">
            <div className="logo-icon">🏗️</div>
            <div className="company-info">
              <h1>CARRIPREFA</h1>
              <p>SOCIÉTÉ D'EXPLOITATION DE CARRIÈRES ET PRÉFABRIQUÉS</p>
            </div>
          </div>
          <div className="auth-title">
            <h2>GMAO - Gestion des Interventions</h2>
            <p>Système de maintenance corrective</p>
          </div>
        </div>

        <div className="auth-form-container">
          <div className="auth-tabs">
            <button 
              className={`auth-tab ${isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(true)}
            >
              Connexion
            </button>
            <button 
              className={`auth-tab ${!isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(false)}
            >
              Inscription
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <div className="form-row">
                <div className="form-group">
                  <label>Prénom *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Votre prénom"
                    required={!isLogin}
                  />
                </div>
                <div className="form-group">
                  <label>Nom *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Votre nom"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="votre.email@carriprefa.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Mot de passe *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Votre mot de passe"
                required
              />
            </div>

            {!isLogin && (
              <>
                <div className="form-group">
                  <label>Confirmer le mot de passe *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirmez votre mot de passe"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Rôle</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                  >
                    <option value="OPERATOR">Opérateur</option>
                    <option value="MAINTENANCE">Équipe Maintenance</option>
                    <option value="ADMIN">Administrateur</option>
                  </select>
                </div>
              </>
            )}

            <div className="form-actions">
              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? (
                  <span className="loading-spinner">⏳</span>
                ) : (
                  isLogin ? '🔐 Se connecter' : '📝 S\'inscrire'
                )}
              </button>
              
              {onBack && (
                <button type="button" className="back-button" onClick={onBack}>
                  ← Retour à la sélection
                </button>
              )}
            </div>
          </form>

          <div className="auth-footer">
            <p>© 2024 CARRIPREFA - Tous droits réservés</p>
            <p>Système de gestion de maintenance assistée par ordinateur</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthInterface;