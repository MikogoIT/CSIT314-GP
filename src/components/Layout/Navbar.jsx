import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../Common/LanguageSwitcher';
import { isSystemAdmin, isPlatformManager } from '../../utils/permissions';

const Navbar = ({ userType, user }) => {
  const { logout } = useAuth();
  const { t } = useLanguage();
  
  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const getDashboardLink = () => {
    switch (userType) {
      case 'pin':
        return '/pin/dashboard';
      case 'csr':
        return '/csr/search';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/login';
    }
  };
  
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to={getDashboardLink()} className="nav-brand">
          <div className="nav-brand-icon">C</div>
          {t('app.title')}
        </Link>
        
        <div className="nav-main">
          <ul className="nav-links">
            {userType === 'pin' && (
              <>
                <li><Link to="/pin/dashboard" className="nav-link">{t('nav.pin.dashboard')}</Link></li>
                <li><Link to="/pin/history" className="nav-link">{t('nav.pin.history')}</Link></li>
              </>
            )}
            
            {userType === 'csr' && (
              <>
                <li><Link to="/csr/search" className="nav-link">{t('nav.csr.search')}</Link></li>
                <li><Link to="/csr/shortlist" className="nav-link">{t('nav.csr.shortlist')}</Link></li>
                <li><Link to="/csr/history" className="nav-link">{t('nav.csr.history')}</Link></li>
              </>
            )}
            
            {(userType === 'system_admin' || userType === 'platform_manager') && (
              <>
                <li><Link to="/admin/dashboard" className="nav-link">{t('nav.admin.dashboard')}</Link></li>
                
                {/* System Admin 专属菜单 */}
                {isSystemAdmin(user) && (
                  <>
                    <li><Link to="/admin/users" className="nav-link">{t('nav.admin.users') || 'User Management'}</Link></li>
                    <li><Link to="/admin/system-logs" className="nav-link">{t('nav.admin.systemLogs') || 'System Logs'}</Link></li>
                    <li><Link to="/admin/alerts" className="nav-link">{t('nav.admin.alerts') || 'Alerts'}</Link></li>
                  </>
                )}
                
                {/* Platform Manager 专属菜单 */}
                {isPlatformManager(user) && (
                  <>
                    <li><Link to="/admin/categories" className="nav-link">{t('nav.admin.categories') || 'Categories'}</Link></li>
                    <li><Link to="/admin/reports" className="nav-link">{t('nav.admin.reports') || 'Reports'}</Link></li>
                    <li><Link to="/admin/performance" className="nav-link">{t('nav.admin.performance') || 'CSR Performance'}</Link></li>
                  </>
                )}
              </>
            )}
          </ul>
          
          <div className="nav-user">
            <LanguageSwitcher />
            <div className="user-profile-section">
              <Link to="/profile" className="user-avatar" title={t('nav.viewProfile') || '查看个人资料'}>
                {user?.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="avatar-image" />
                ) : (
                  <span className="avatar-text">{user?.name?.charAt(0) || 'U'}</span>
                )}
              </Link>
              <div className="user-info">
                <div className="user-name">{user?.name || t('nav.profile')}</div>
              </div>
            </div>
            <button onClick={handleLogout} className="btn btn-secondary">
              {t('nav.logout')}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;