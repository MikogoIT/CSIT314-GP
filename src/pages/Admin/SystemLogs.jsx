// System Logs - 系统日志页面 (System Admin Only)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Navbar from '../../components/Layout/Navbar';
import { isSystemAdmin } from '../../utils/permissions';
// import apiService from '../../services/apiService';
import '../../styles/user-management.css';

const SystemLogs = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // 权限检查 - 只有 System Admin 可以访问
  useEffect(() => {
    if (!isSystemAdmin(user)) {
      alert(t('permission.denied') || 'Access Denied: System Admin only');
      navigate('/admin/dashboard');
    }
  }, [user, navigate, t]);

  // 模拟日志数据
  useEffect(() => {
    loadSystemLogs();
  }, []);

  const loadSystemLogs = () => {
    setLoading(true);
    
    // 模拟系统日志数据
    const mockLogs = [
      {
        id: 1,
        type: 'login',
        action: 'User Login',
        user: 'john.doe@example.com',
        userType: 'pin',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        status: 'success',
        ipAddress: '192.168.1.100',
        details: 'Successful login from Chrome browser'
      },
      {
        id: 2,
        type: 'login',
        action: 'Failed Login Attempt',
        user: 'unknown@example.com',
        userType: 'unknown',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        status: 'failed',
        ipAddress: '192.168.1.105',
        details: 'Invalid credentials - 3 attempts'
      },
      {
        id: 3,
        type: 'system',
        action: 'User Account Created',
        user: 'admin@system.com',
        userType: 'system_admin',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        status: 'success',
        ipAddress: '192.168.1.1',
        details: 'Created new CSR account: jane.smith@example.com'
      },
      {
        id: 4,
        type: 'system',
        action: 'User Account Suspended',
        user: 'admin@system.com',
        userType: 'system_admin',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        status: 'success',
        ipAddress: '192.168.1.1',
        details: 'Suspended user account: spam.user@example.com - Reason: Policy violation'
      },
      {
        id: 5,
        type: 'login',
        action: 'User Login',
        user: 'volunteer@example.com',
        userType: 'csr',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        status: 'success',
        ipAddress: '192.168.1.102',
        details: 'Successful login from Firefox browser'
      },
      {
        id: 6,
        type: 'security',
        action: 'Password Reset',
        user: 'user@example.com',
        userType: 'pin',
        timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        status: 'success',
        ipAddress: '192.168.1.103',
        details: 'Password reset via email verification'
      },
      {
        id: 7,
        type: 'login',
        action: 'Failed Login Attempt',
        user: 'test@example.com',
        userType: 'unknown',
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        status: 'failed',
        ipAddress: '192.168.1.106',
        details: 'Account locked after 5 failed attempts'
      },
      {
        id: 8,
        type: 'system',
        action: 'Database Backup',
        user: 'system',
        userType: 'system',
        timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        status: 'success',
        ipAddress: 'localhost',
        details: 'Automated daily backup completed successfully'
      }
    ];

    setLogs(mockLogs);
    setFilteredLogs(mockLogs);
    setLoading(false);
  };

  // 过滤日志
  useEffect(() => {
    let filtered = logs;

    // 类型过滤
    if (filterType !== 'all') {
      filtered = filtered.filter(log => log.type === filterType);
    }

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  }, [filterType, searchTerm, logs]);

  const getStatusColor = (status) => {
    return status === 'success' ? 'status-active' : 'status-suspended';
  };

  const getTypeColor = (type) => {
    const colors = {
      login: 'user-type-badge primary',
      security: 'user-type-badge warning',
      system: 'user-type-badge secondary',
    };
    return colors[type] || 'user-type-badge';
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getTimeAgo = (timestamp) => {
    const now = Date.now();
    const diff = now - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}天前`;
    if (hours > 0) return `${hours}小时前`;
    if (minutes > 0) return `${minutes}分钟前`;
    return '刚刚';
  };

  return (
    <div className="user-management-container">
      <Navbar userType={user?.userType} user={user} />
      
      <div className="user-management-content">
        <div className="page-header">
          <div className="header-content">
            <button onClick={() => navigate('/admin/dashboard')} className="back-button">
              ← {t('common.back') || '返回'}
            </button>
            <div className="header-text">
              <h1 className="page-title">
                📋 {t('admin.systemLogs.title') || '系统日志'}
              </h1>
              <p className="page-subtitle">
                {t('admin.systemLogs.subtitle') || '监控系统活动和登录尝试'}
              </p>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-label">{t('admin.systemLogs.totalLogs') || '总日志数'}</div>
              <div className="stat-value">{logs.length}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-label">{t('admin.systemLogs.successfulLogins') || '成功登录'}</div>
              <div className="stat-value">
                {logs.filter(l => l.type === 'login' && l.status === 'success').length}
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">❌</div>
            <div className="stat-content">
              <div className="stat-label">{t('admin.systemLogs.failedAttempts') || '失败尝试'}</div>
              <div className="stat-value">
                {logs.filter(l => l.status === 'failed').length}
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔧</div>
            <div className="stat-content">
              <div className="stat-label">{t('admin.systemLogs.systemActions') || '系统操作'}</div>
              <div className="stat-value">
                {logs.filter(l => l.type === 'system').length}
              </div>
            </div>
          </div>
        </div>

        {/* 过滤和搜索 */}
        <div className="filters-section">
          <div className="filter-tabs">
            <button
              className={`filter-tab ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              {t('common.all') || '全部'} ({logs.length})
            </button>
            <button
              className={`filter-tab ${filterType === 'login' ? 'active' : ''}`}
              onClick={() => setFilterType('login')}
            >
              🔐 {t('admin.systemLogs.loginLogs') || '登录日志'} ({logs.filter(l => l.type === 'login').length})
            </button>
            <button
              className={`filter-tab ${filterType === 'security' ? 'active' : ''}`}
              onClick={() => setFilterType('security')}
            >
              🔒 {t('admin.systemLogs.securityLogs') || '安全日志'} ({logs.filter(l => l.type === 'security').length})
            </button>
            <button
              className={`filter-tab ${filterType === 'system' ? 'active' : ''}`}
              onClick={() => setFilterType('system')}
            >
              ⚙️ {t('admin.systemLogs.systemLogs') || '系统日志'} ({logs.filter(l => l.type === 'system').length})
            </button>
          </div>

          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder={t('admin.systemLogs.searchPlaceholder') || '搜索用户、操作或详情...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* 日志表格 */}
        <div className="table-container">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner">⏳</div>
              <p>{t('common.loading') || '加载中...'}</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>{t('admin.systemLogs.noLogs') || '暂无日志'}</h3>
              <p>{t('admin.systemLogs.noLogsDesc') || '没有找到匹配的日志记录'}</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('admin.systemLogs.time') || '时间'}</th>
                  <th>{t('admin.systemLogs.type') || '类型'}</th>
                  <th>{t('admin.systemLogs.action') || '操作'}</th>
                  <th>{t('admin.systemLogs.user') || '用户'}</th>
                  <th>{t('admin.systemLogs.status') || '状态'}</th>
                  <th>{t('admin.systemLogs.ipAddress') || 'IP地址'}</th>
                  <th>{t('admin.systemLogs.details') || '详情'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div className="timestamp-cell">
                        <div>{formatTimestamp(log.timestamp)}</div>
                        <small style={{ color: '#666' }}>{getTimeAgo(log.timestamp)}</small>
                      </div>
                    </td>
                    <td>
                      <span className={getTypeColor(log.type)}>
                        {log.type === 'login' ? '🔐 登录' : log.type === 'security' ? '🔒 安全' : '⚙️ 系统'}
                      </span>
                    </td>
                    <td>{log.action}</td>
                    <td>
                      <div>
                        {log.user}
                        {log.userType !== 'unknown' && log.userType !== 'system' && (
                          <div style={{ fontSize: '0.85em', color: '#666' }}>
                            {log.userType === 'pin' ? 'PIN' : log.userType === 'csr' ? 'CSR' : log.userType}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusColor(log.status)}`}>
                        {log.status === 'success' ? '✅ 成功' : '❌ 失败'}
                      </span>
                    </td>
                    <td><code>{log.ipAddress}</code></td>
                    <td className="details-cell">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemLogs;
