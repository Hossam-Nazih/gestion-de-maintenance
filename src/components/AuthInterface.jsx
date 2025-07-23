import React, { useState } from 'react';
import './AuthInterface.css';
import { login, register, logout } from '../api';
const AuthInterface = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'technicien'
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

// Update the handleSubmit function in AuthInterface.jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    if (isLogin) {
      const response = await authApi.login({
        username: formData.email, // Assuming email is used as username
        password: formData.password
      });
      localStorage.setItem('carriprefa_user', JSON.stringify(response.data.user));
      onLogin(response.data.user);
    } else {
      await authApi.register({
        email: formData.email,
        password: formData.password,
        username: formData.email, // Using email as username
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role.toLowerCase(),
      });
      alert('Inscription réussie ! Veuillez vous connecter.');
      setIsLogin(true);
    }
  } catch (err) {
    alert(`Erreur : ${err.response?.data?.detail || err.message}`);
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

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? (
                <span className="loading-spinner">⏳</span>
              ) : (
                isLogin ? '🔐 Se connecter' : '📝 S\'inscrire'
              )}
            </button>
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