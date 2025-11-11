// Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../../components/Common/LanguageSwitcher';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    // Check if it's admin email
    const isAdmin = formData.email === 'mikogo@admin.com' || formData.email === 'admin@community-care.com';
    
    if (!formData.userType && !isAdmin) {
      setError(t('auth.login.error.userType'));
      setIsLoading(false);
      return;
    }
    
    try {
      // Call AuthContext's login method
      const result = await login(formData.email, formData.password, formData.userType);
      
      if (result.success) {
        // Login successful, navigate to appropriate page
        const userType = isAdmin ? 'admin' : formData.userType;
        switch (userType) {
          case 'pin':
            navigate('/pin/dashboard');
            break;
          case 'csr':
            navigate('/csr/search');
            break;
          case 'admin':
            navigate('/admin/dashboard');
            break;
          default:
            navigate('/');
        }
      } else {
        // Handle error codes and display corresponding translated messages
        let errorMessage = t('common.error');
        if (result.errorCode) {
          switch (result.errorCode) {
            case 'USER_NOT_EXISTS':
              errorMessage = t('auth.login.error.userNotExists');
              break;
            case 'USER_SUSPENDED':
              errorMessage = t('auth.login.error.userSuspended');
              break;
            case 'INVALID_CREDENTIALS':
              errorMessage = '邮箱或密码错误';
              break;
            default:
              errorMessage = result.error || t('common.error');
          }
        } else {
          errorMessage = result.error || t('common.error');
        }
        setError(errorMessage);
      }
    } catch (error) {
      setError(t('common.error'));
      console.error('登录错误:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Check if current email is admin email
  const isAdminEmail = formData.email === 'mikogo@admin.com' || formData.email === 'admin@community-care.com';

  const userTypes = [
    { value: 'pin', label: t('userType.pin'), icon: '🙋', description: t('userType.pin.description') },
    { value: 'csr', label: t('userType.csr'), icon: '🤝', description: t('userType.csr.description') }
  ];
  
  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-hero">
          <div className="hero-icon">🤝</div>
          <h1 className="hero-title">{t('app.title')}</h1>
          <p className="hero-subtitle">{t('app.subtitle')}</p>
        </div>
      </div>
      
      <div className="auth-card">
        <div className="auth-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 className="auth-title">{t('auth.login.title')}</h2>
              <p className="auth-subtitle">{t('auth.login.subtitle')}</p>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
        
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            {error}
          </div>
        )}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          {!isAdminEmail && (
            <div className="form-group">
              <label className="form-label">{t('auth.login.userType')}</label>
              <div className="user-type-grid">
                {userTypes.map(type => (
                <label 
                  key={type.value}
                  className={`user-type-card ${
                    formData.userType === type.value ? 'selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="userType"
                    value={type.value}
                    checked={formData.userType === type.value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="user-type-icon">{type.icon}</div>
                  <div className="user-type-info">
                    <div className="user-type-label">{type.label}</div>
                    <div className="user-type-desc">{type.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          )}

          {isAdminEmail && (
            <div className="admin-login-notice">
              <div className="notice-icon">👨‍💼</div>
              <div className="notice-text">
                <strong>{t('auth.login.adminLogin')}</strong>
                <p>{t('auth.login.adminLoginDesc')}</p>
              </div>
            </div>
          )}
          
          <div className="form-group">
            <label className="form-label">{t('auth.login.email')}</label>
            <div className="input-with-icon">
              <span className="input-icon">📧</span>
              <input 
                type="email" 
                name="email"
                className="form-input"
                placeholder={t('auth.login.email')}
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">{t('auth.login.password')}</label>
            <div className="input-with-icon">
              <span className="input-icon">🔒</span>
              <input 
                type="password" 
                name="password"
                className="form-input"
                placeholder={t('auth.login.password')}
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            className={`btn btn-primary btn-full ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                {t('common.loading')}
              </>
            ) : (
              t('auth.login.submit')
            )}
          </button>
        </form>
        
        <div className="auth-footer">
          <p className="auth-link">
            {t('auth.login.noAccount')} <Link to="/register" className="link">{t('auth.login.registerNow')}</Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Login;