import { useState } from 'react';
import './AuthInterface.css';
import { authApi } from '../api';

const AuthInterface = ({ onLogin, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    loginField: '', // This will be used for both email and username login
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'technicien',
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
        console.log('Attempting login with:', {
          loginField: formData.loginField,
          isEmail: formData.loginField.includes('@'),
          password_length: formData.password.length
        });
        
        // Try login with the provided field (could be email or username)
        const response = await authApi.login({
          username: formData.loginField, // Backend expects 'username' field
          password: formData.password
        });
        
        console.log('Login response:', response);
        
        // Extract user data from response
        const userData = response.data.user;
        console.log('User data extracted:', userData);
        
        // Store user data in React state or context instead of localStorage
        // Note: localStorage is not supported in Claude artifacts
        // If you need persistence, implement this in your actual environment
        
        // Call the onLogin callback with user data
        onLogin(userData);
        
      } else {
        // Registration logic
        if (formData.password !== formData.confirmPassword) {
          alert('Les mots de passe ne correspondent pas');
          setLoading(false);
          return;
        }
        
        console.log('Sending registration request with:', {
          email: formData.email,
          username: formData.username,
          role: formData.role,
          password: '***'
        });
        
        const registerResponse = await authApi.register({
          email: formData.email,
          password: formData.password,
          username: formData.username || formData.email, // Use username if provided, otherwise email
          role: formData.role,
        });
        
        console.log('Registration response:', registerResponse);
        alert('Inscription réussie ! Veuillez vous connecter.');
        setIsLogin(true);
        setFormData({
          ...formData,
          password: '',
          confirmPassword: ''
        });
      }
    } catch (err) {
      console.error('Auth error details:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          data: err.config?.data
        }
      });
      
      let errorMessage = 'Une erreur est survenue';
      
      if (err.response?.status === 422) {
        errorMessage = 'Données invalides. Vérifiez vos informations.';
        if (err.response?.data?.detail) {
          errorMessage += ` Détails: ${JSON.stringify(err.response.data.detail)}`;
        }
      } else if (err.response?.status === 401) {
        errorMessage = 'Email ou mot de passe incorrect.';
        // Add more specific debugging for 401 errors
        console.error('Login failed - 401 Unauthorized:', {
          sentUsername: formData.loginField,
          sentPasswordLength: formData.password.length,
          backendResponse: err.response?.data
        });
      } else if (err.response?.status === 404) {
        errorMessage = 'Service non disponible.';
      } else if (err.response?.status === 500) {
        errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
      } else if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else {
          errorMessage = err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data);
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      alert(`Erreur : ${errorMessage}`);
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
              <>
                <div className="form-group">
                  <label>Nom d'utilisateur *</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Votre nom d'utilisateur"
                    required={!isLogin}
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="votre.email@carriprefa.com"
                    required={!isLogin}
                  />
                </div>
              </>
            )}

            {isLogin && (
              <div className="form-group">
                <label>Nom d'utilisateur *</label>
                <input
                  type="text"
                  name="loginField"
                  value={formData.loginField}
                  onChange={handleInputChange}
                  placeholder="Votre nom d'utilisateur"
                  required
                />
              </div>
            )}

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