// System Alerts - 系统警报配置页面 (System Admin Only)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Navbar from '../../components/Layout/Navbar';
import { isSystemAdmin } from '../../utils/permissions';
import '../../styles/user-management.css';

const SystemAlerts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);

  // 权限检查 - 只有 System Admin 可以访问
  useEffect(() => {
    if (!isSystemAdmin(user)) {
      alert(t('permission.denied') || 'Access Denied: System Admin only');
      navigate('/admin/dashboard');
    }
  }, [user, navigate, t]);

  // 初始化警报配置
  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = () => {
    // 模拟警报配置数据
    const mockAlerts = [
      {
        id: 1,
        name: '失败登录警报',
        type: 'security',
        condition: 'failed_login_attempts',
        threshold: 5,
        enabled: true,
        recipients: ['admin@system.com', 'security@system.com'],
        description: '当用户连续失败登录超过阈值时触发',
        lastTriggered: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        triggerCount: 3
      },
      {
        id: 2,
        name: '系统资源警报',
        type: 'system',
        condition: 'high_memory_usage',
        threshold: 85,
        enabled: true,
        recipients: ['admin@system.com', 'ops@system.com'],
        description: '当系统内存使用率超过85%时触发',
        lastTriggered: null,
        triggerCount: 0
      },
      {
        id: 3,
        name: '用户注册激增',
        type: 'user',
        condition: 'high_registration_rate',
        threshold: 50,
        enabled: false,
        recipients: ['admin@system.com'],
        description: '当每小时注册用户超过50人时触发',
        lastTriggered: null,
        triggerCount: 0
      },
      {
        id: 4,
        name: '数据库连接失败',
        type: 'system',
        condition: 'database_connection_failed',
        threshold: 1,
        enabled: true,
        recipients: ['admin@system.com', 'ops@system.com', 'tech@system.com'],
        description: '数据库连接失败时立即触发',
        lastTriggered: null,
        triggerCount: 0
      },
      {
        id: 5,
        name: '可疑IP活动',
        type: 'security',
        condition: 'suspicious_ip_activity',
        threshold: 10,
        enabled: true,
        recipients: ['security@system.com', 'admin@system.com'],
        description: '当同一IP在短时间内有异常请求时触发',
        lastTriggered: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        triggerCount: 1
      }
    ];

    setAlerts(mockAlerts);
  };

  const handleToggleAlert = (alertId) => {
    setAlerts(alerts.map(alert =>
      alert.id === alertId ? { ...alert, enabled: !alert.enabled } : alert
    ));
  };

  const handleDeleteAlert = (alertId) => {
    if (window.confirm(t('admin.alerts.confirmDelete') || '确认删除此警报配置？')) {
      setAlerts(alerts.filter(alert => alert.id !== alertId));
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      security: 'status-suspended',
      system: 'status-active',
      user: 'user-type-badge primary'
    };
    return colors[type] || 'user-type-badge';
  };

  const getTypeIcon = (type) => {
    const icons = {
      security: '🔒',
      system: '⚙️',
      user: '👥'
    };
    return icons[type] || '📋';
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return t('common.never') || '从未';
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
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
                🔔 {t('admin.alerts.title') || '系统警报配置'}
              </h1>
              <p className="page-subtitle">
                {t('admin.alerts.subtitle') || '配置系统监控和通知规则'}
              </p>
            </div>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            + {t('admin.alerts.createNew') || '创建新警报'}
          </button>
        </div>

        {/* 统计卡片 */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-label">{t('admin.alerts.totalAlerts') || '总警报数'}</div>
              <div className="stat-value">{alerts.length}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-label">{t('admin.alerts.activeAlerts') || '已启用'}</div>
              <div className="stat-value">{alerts.filter(a => a.enabled).length}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔔</div>
            <div className="stat-content">
              <div className="stat-label">{t('admin.alerts.triggered') || '今日触发'}</div>
              <div className="stat-value">{alerts.reduce((sum, a) => sum + a.triggerCount, 0)}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔒</div>
            <div className="stat-content">
              <div className="stat-label">{t('admin.alerts.securityAlerts') || '安全警报'}</div>
              <div className="stat-value">{alerts.filter(a => a.type === 'security').length}</div>
            </div>
          </div>
        </div>

        {/* 警报列表 */}
        <div className="table-container">
          {alerts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔔</div>
              <h3>{t('admin.alerts.noAlerts') || '暂无警报配置'}</h3>
              <p>{t('admin.alerts.noAlertsDesc') || '点击上方按钮创建新的警报规则'}</p>
            </div>
          ) : (
            <div className="alerts-grid">
              {alerts.map((alert) => (
                <div key={alert.id} className="alert-card">
                  <div className="alert-header">
                    <div className="alert-title-section">
                      <span className="alert-icon">{getTypeIcon(alert.type)}</span>
                      <div>
                        <h3 className="alert-title">{alert.name}</h3>
                        <span className={`type-badge ${getTypeColor(alert.type)}`}>
                          {alert.type === 'security' ? '安全' : alert.type === 'system' ? '系统' : '用户'}
                        </span>
                      </div>
                    </div>
                    <div className="alert-actions">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={alert.enabled}
                          onChange={() => handleToggleAlert(alert.id)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  <div className="alert-body">
                    <p className="alert-description">{alert.description}</p>
                    
                    <div className="alert-details">
                      <div className="detail-item">
                        <span className="detail-label">📊 {t('admin.alerts.threshold') || '阈值'}:</span>
                        <span className="detail-value">{alert.threshold}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">📧 {t('admin.alerts.recipients') || '接收人'}:</span>
                        <span className="detail-value">{alert.recipients.length} 人</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">🔔 {t('admin.alerts.lastTriggered') || '最后触发'}:</span>
                        <span className="detail-value">{formatTimestamp(alert.lastTriggered)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">📈 {t('admin.alerts.triggerCount') || '触发次数'}:</span>
                        <span className="detail-value">{alert.triggerCount} 次</span>
                      </div>
                    </div>

                    <div className="alert-recipients">
                      <strong>{t('admin.alerts.notifyList') || '通知列表'}:</strong>
                      <div className="recipients-list">
                        {alert.recipients.map((email, index) => (
                          <span key={index} className="recipient-badge">
                            📧 {email}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="alert-footer">
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setEditingAlert(alert);
                        setShowCreateModal(true);
                      }}
                    >
                      ✏️ {t('common.edit') || '编辑'}
                    </button>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteAlert(alert.id)}
                    >
                      🗑️ {t('common.delete') || '删除'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 创建/编辑警报模态框 */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingAlert ? t('admin.alerts.editAlert') || '编辑警报' : t('admin.alerts.createAlert') || '创建警报'}</h2>
                <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="empty-state">
                  <div className="empty-icon">🚧</div>
                  <h3>{t('admin.alerts.comingSoon') || '功能开发中'}</h3>
                  <p>{t('admin.alerts.comingSoonDesc') || '警报创建和编辑功能即将推出'}</p>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  {t('common.close') || '关闭'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .alerts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 1.5rem;
          padding: 1rem;
        }

        .alert-card {
          background: white;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .alert-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .alert-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        }

        .alert-title-section {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .alert-icon {
          font-size: 2rem;
        }

        .alert-title {
          margin: 0 0 0.5rem 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .type-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 24px;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: 0.4s;
          border-radius: 24px;
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.4s;
          border-radius: 50%;
        }

        input:checked + .toggle-slider {
          background-color: #10b981;
        }

        input:checked + .toggle-slider:before {
          transform: translateX(26px);
        }

        .alert-body {
          padding: 1.5rem;
        }

        .alert-description {
          color: #666;
          margin-bottom: 1rem;
          line-height: 1.6;
        }

        .alert-details {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 1rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .detail-label {
          font-size: 0.85rem;
          color: #666;
          font-weight: 500;
        }

        .detail-value {
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
        }

        .alert-recipients {
          margin-top: 1rem;
        }

        .recipients-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .recipient-badge {
          padding: 0.25rem 0.75rem;
          background: #e0f2fe;
          color: #0369a1;
          border-radius: 12px;
          font-size: 0.85rem;
        }

        .alert-footer {
          display: flex;
          gap: 0.5rem;
          padding: 1rem 1.5rem;
          border-top: 1px solid #e5e7eb;
          background: #f8f9fa;
        }

        .btn-sm {
          padding: 0.5rem 1rem;
          font-size: 0.9rem;
        }

        .btn-danger {
          background-color: #ef4444;
          color: white;
        }

        .btn-danger:hover {
          background-color: #dc2626;
        }
      `}</style>
    </div>
  );
};

export default SystemAlerts;
