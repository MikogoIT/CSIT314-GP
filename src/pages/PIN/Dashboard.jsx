// Dashboard.jsx (PIN Dashboard)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { DataService } from '../../services/dataService';
import Navbar from '../../components/Layout/Navbar';
import CreateRequestForm from '../../components/PIN/CreateRequestForm';
import RequestDetailModal from '../../components/PIN/RequestDetailModal';
import '../../styles/pin-dashboard.css';

const PINDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showRequestDetail, setShowRequestDetail] = useState(null);
  const [editingRequest, setEditingRequest] = useState(null);
  
  const [requests, setRequests] = useState([]);

  // 初始化数据和加载用户请求
  useEffect(() => {
    const loadUserData = async () => {
      try {
        await DataService.initializeData();
        if (user?.id) {
          const userRequests = await DataService.getUserRequests(user.id);
          setRequests(userRequests || []); // 确保是数组
        }
      } catch (error) {
        console.error('加载用户数据失败:', error);
        setRequests([]); // 设置为空数组防止错误
      }
    };
    
    loadUserData();
  }, [user?.id]);

  // 使用数据服务获取统计信息
  const stats = [
    { 
      id: 'total', 
      title: t('stats.totalRequests'), 
      value: requests.length, 
      icon: '📋', 
      color: 'primary'
    },
    { 
      id: 'matched', 
      title: t('stats.matched'), 
      value: requests.filter(r => r.status === 'matched').length, 
      icon: '✅', 
      color: 'success'
    },
    { 
      id: 'pending', 
      title: t('stats.pending'), 
      value: requests.filter(r => r.status === 'pending').length, 
      icon: '⏳', 
      color: 'warning'
    },
    { 
      id: 'views', 
      title: t('stats.totalViews'), 
      value: requests.reduce((sum, r) => sum + (r.viewCount || 0), 0), 
      icon: '👀', 
      color: 'info'
    }
  ];

  // 处理创建新请求
  const handleCreateRequest = async (newRequest) => {
    try {
      const requestWithUser = {
        ...newRequest,
        // 修正location格式为后端期望的结构
        location: {
          address: newRequest.location
        },
        // 确保日期格式正确，只有当日期存在且不为空字符串时才处理
        expectedDate: newRequest.expectedDate && newRequest.expectedDate.trim() !== '' ? 
          new Date(newRequest.expectedDate).toISOString() : undefined,
        // 确保志愿者数量是数字类型
        volunteersNeeded: parseInt(newRequest.volunteersNeeded) || 1,
        requesterId: user.id,
        requesterName: user.name,
        requesterEmail: user.email,
        requesterPhone: user.phone || '',
        requesterAddress: user.address || newRequest.location,
      };
      
      // 使用数据服务创建请求
      const createdRequest = await DataService.createRequest(requestWithUser);
      
      // 更新本地状态
      setRequests(prev => [createdRequest, ...prev]);
      
    } catch (error) {
      console.error('创建请求失败:', error);
      alert(t('error.createRequestFailed') || '创建请求失败');
    }
  };

  // 处理查看请求详情
  const handleViewDetail = (request) => {
    setShowRequestDetail(request);
  };

  // 处理编辑请求
  const handleEditRequest = (request) => {
    setEditingRequest(request);
    setShowCreateForm(true); // 复用创建表单进行编辑
  };

  // 处理更新请求
  const handleUpdateRequest = async (updatedRequest) => {
    try {
      const requestWithUser = { ...updatedRequest, requesterId: user.id };
      
      // 使用数据服务更新
      await DataService.updateRequest(updatedRequest.id, requestWithUser);
      
      // 更新本地状态
      setRequests(prev => prev.map(req => 
        req.id === updatedRequest.id ? requestWithUser : req
      ));
      
      setEditingRequest(null);
      
    } catch (error) {
      console.error('更新请求失败:', error);
      alert(t('error.updateRequestFailed') || '更新请求失败');
    }
  };

  // 处理删除请求
  const handleDeleteRequest = async (requestId) => {
    if (window.confirm(t('common.confirm') + '？')) {
      try {
        // 使用数据服务删除
        await DataService.deleteRequest(requestId);
        
        // 更新本地状态
        setRequests(prev => prev.filter(req => req.id !== requestId));
        
      } catch (error) {
        console.error('删除请求失败:', error);
        alert(t('error.deleteRequestFailed') || '删除请求失败');
      }
    }
  };

  return (
    <div className="pin-dashboard-container">
      <Navbar userType="pin" user={user} />
      <div className="pin-main-content">
        <div className="dashboard">
          {/* 全新的渐变头部设计 */}
          <div className="pin-hero-section">
            <div className="pin-hero-background">
              <div className="pin-hero-pattern"></div>
              <div className="pin-hero-content">
                <div className="pin-hero-left">
                  <div className="pin-welcome-badge">
                    <span className="badge-icon">🌟</span>
                    <span>{t('pin.dashboard.welcomeBack')}</span>
                  </div>
                  <h1 className="pin-hero-title">
                    {t('pin.dashboard.hello')} <span className="name-highlight">{user?.name}</span>
                  </h1>
                  <p className="pin-hero-subtitle">{t('pin.dashboard.heroSubtitle')}</p>
                  <div className="pin-hero-actions">
                    <button 
                      className="pin-hero-btn primary"
                      onClick={() => setShowCreateForm(true)}
                    >
                      <span className="btn-icon">✨</span>
                      {t('pin.dashboard.createRequest')}
                    </button>
                    <button className="pin-hero-btn secondary">
                      <span className="btn-icon">📊</span>
                      {t('pin.dashboard.viewAnalytics')}
                    </button>
                  </div>
                </div>
                <div className="pin-hero-right">
                  <div className="pin-hero-avatar">
                    <div className="avatar-glow"></div>
                    <div className="avatar-circle">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} className="avatar-image" />
                      ) : (
                        <div className="avatar-placeholder">
                          {user?.name?.charAt(0).toUpperCase() || '👤'}
                        </div>
                      )}
                    </div>
                    <div className="avatar-status-badge">
                      <span className="status-dot"></span>
                      <span className="status-text">{t('common.online')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 重新设计的统计卡片 */}
          <div className="pin-stats-section">
            <div className="pin-stats-header">
              <h2 className="stats-title">{t('pin.dashboard.yourImpact')}</h2>
              <p className="stats-subtitle">{t('pin.dashboard.impactSubtitle')}</p>
            </div>
            <div className="pin-stats-grid">
              {stats.map((stat, index) => (
                <div key={stat.id} className={`pin-stat-card ${stat.color}`} style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="stat-card-background"></div>
                  <div className="stat-card-content">
                    <div className="stat-icon-container">
                      <div className="stat-icon-circle">
                        <span className="stat-icon">{stat.icon}</span>
                      </div>
                    </div>
                    <div className="stat-info">
                      <div className="stat-value-container">
                        <span className="stat-value">{stat.value}</span>
                        {stat.trend && (
                          <div className="stat-growth">
                            <span className="growth-icon">{stat.trend > 0 ? '📈' : '📉'}</span>
                            <span className="growth-text">
                              {stat.trend > 0 ? '+' : ''}{stat.trend}%
                            </span>
                          </div>
                        )}
                      </div>
                      <h3 className="stat-title">{stat.title}</h3>
                      <p className="stat-description">{t(`pin.dashboard.stat.${stat.id}.description`)}</p>
                    </div>
                  </div>
                  <div className="stat-card-glow"></div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 重新设计的内容区域 */}
          <div className="pin-content-section">
            <div className="pin-content-grid">
              {/* 主要内容区域 - 我的请求 */}
              <div className="pin-main-content-card">
                <div className="pin-card-header">
                  <div className="pin-card-title-group">
                    <div className="pin-card-icon">
                      <span>📋</span>
                    </div>
                    <div className="pin-card-title-content">
                      <h3 className="pin-card-title">{t('pin.dashboard.myRequests')}</h3>
                      <p className="pin-card-subtitle">{t('pin.dashboard.manageYourRequests')}</p>
                    </div>
                  </div>
                  <div className="pin-card-badge">
                    <span className="badge-count">{requests.length}</span>
                    <span className="badge-label">{t('common.total')}</span>
                  </div>
                </div>
                
                <div className="pin-card-content">
                  {requests.length > 0 ? (
                    <div className="pin-requests-grid">
                      {requests.map((request, index) => (
                        <div key={request.id || `request-${index}`} className="pin-request-card">
                          <div className="request-card-header">
                            <div className="request-priority-indicator">
                              <div className={`priority-dot ${request.urgency || 'medium'}`}></div>
                            </div>
                            <div className={`request-status-badge ${request.status}`}>
                              <span className="status-icon">
                                {request.status === 'matched' ? '✅' : request.status === 'pending' ? '⏳' : '🔄'}
                              </span>
                              <span className="status-text">
                                {request.status === 'matched' ? t('pin.dashboard.status.matched') : 
                                 request.status === 'pending' ? t('pin.dashboard.status.pending') : 
                                 t('pin.dashboard.status.processing')}
                              </span>
                            </div>
                          </div>
                          
                          <div className="request-card-body">
                            <h4 className="request-title">{request.title}</h4>
                            <p className="request-description">{request.description}</p>
                            
                            <div className="request-meta-info">
                              <div className="meta-item">
                                <span className="meta-icon">🏷️</span>
                                <span className="meta-text">{t(`category.${request.category}`)}</span>
                              </div>
                              <div className="meta-item">
                                <span className="meta-icon">📅</span>
                                <span className="meta-text">{DataService.getTimeAgo(request.createdAt, t)}</span>
                              </div>
                            </div>
                            
                            <div className="request-stats-row">
                              <div className="stat-item">
                                <span className="stat-icon">👁️</span>
                                <span className="stat-number">{request.viewCount || 0}</span>
                                <span className="stat-label">{t('common.views')}</span>
                              </div>
                              <div className="stat-item">
                                <span className="stat-icon">⭐</span>
                                <span className="stat-number">{request.shortlistCount || 0}</span>
                                <span className="stat-label">{t('common.shortlisted')}</span>
                              </div>
                            </div>

                            {request.status === 'matched' && request.volunteer && (
                              <div className="matched-volunteer-card">
                                <div className="volunteer-avatar-small">
                                  <span>👤</span>
                                </div>
                                <div className="volunteer-info-small">
                                  <p className="volunteer-name">{t('pin.dashboard.matchedWith', { name: request.volunteer })}</p>
                                  <button className="contact-volunteer-btn">
                                    <span>💬</span>
                                    {t('pin.dashboard.contact')}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="request-card-actions">
                            <button 
                              className="pin-action-btn view"
                              onClick={() => handleViewDetail(request)}
                            >
                              <span className="action-icon">👁️</span>
                              {t('common.view')}
                            </button>
                            <button 
                              className="pin-action-btn edit"
                              onClick={() => handleEditRequest(request)}
                            >
                              <span className="action-icon">✏️</span>
                              {t('common.edit')}
                            </button>
                            <button 
                              className="pin-action-btn delete"
                              onClick={() => handleDeleteRequest(request.id)}
                            >
                              <span className="action-icon">🗑️</span>
                              {t('common.delete')}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="pin-empty-state">
                      <div className="empty-state-visual">
                        <div className="empty-icon-circle">
                          <span className="empty-icon">📝</span>
                        </div>
                        <div className="empty-sparkles">
                          <span className="sparkle">✨</span>
                          <span className="sparkle">⭐</span>
                          <span className="sparkle">💫</span>
                        </div>
                      </div>
                      <div className="empty-state-content">
                        <h3 className="empty-state-title">{t('pin.dashboard.noRequestsYet')}</h3>
                        <p className="empty-state-description">{t('pin.dashboard.createFirstRequest')}</p>
                        <button 
                          className="pin-cta-button"
                          onClick={() => setShowCreateForm(true)}
                        >
                          <span className="cta-icon">🚀</span>
                          <span className="cta-text">{t('pin.dashboard.getStarted')}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 侧边栏 - 快速操作和帮助 */}
              <div className="pin-sidebar">
                <div className="pin-sidebar-card quick-actions-card">
                  <div className="sidebar-card-header">
                    <div className="sidebar-card-icon">⚡</div>
                    <h3 className="sidebar-card-title">{t('pin.dashboard.quickActions')}</h3>
                  </div>
                  <div className="sidebar-card-content">
                    <div className="quick-actions-grid">
                      <button 
                        className="quick-action-item create"
                        onClick={() => setShowCreateForm(true)}
                      >
                        <div className="quick-action-icon">➕</div>
                        <div className="quick-action-content">
                          <span className="quick-action-title">{t('pin.dashboard.newRequest')}</span>
                          <span className="quick-action-desc">{t('pin.dashboard.createNewRequest')}</span>
                        </div>
                      </button>
                      
                      <a href="/pin/history" className="quick-action-item history">
                        <div className="quick-action-icon">📊</div>
                        <div className="quick-action-content">
                          <span className="quick-action-title">{t('pin.dashboard.history')}</span>
                          <span className="quick-action-desc">{t('pin.dashboard.viewHistory')}</span>
                        </div>
                      </a>
                      
                      <a href="/help" className="quick-action-item help">
                        <div className="quick-action-icon">❓</div>
                        <div className="quick-action-content">
                          <span className="quick-action-title">{t('common.help')}</span>
                          <span className="quick-action-desc">{t('pin.dashboard.getHelp')}</span>
                        </div>
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="pin-sidebar-card tips-card">
                  <div className="sidebar-card-header">
                    <div className="sidebar-card-icon">💡</div>
                    <h3 className="sidebar-card-title">{t('pin.dashboard.tips')}</h3>
                  </div>
                  <div className="sidebar-card-content">
                    <div className="tips-list">
                      <div className="tip-item">
                        <div className="tip-icon">🎯</div>
                        <p className="tip-text">{t('pin.dashboard.tip1')}</p>
                      </div>
                      <div className="tip-item">
                        <div className="tip-icon">📸</div>
                        <p className="tip-text">{t('pin.dashboard.tip2')}</p>
                      </div>
                      <div className="tip-item">
                        <div className="tip-icon">🤝</div>
                        <p className="tip-text">{t('pin.dashboard.tip3')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {showCreateForm && (
        <CreateRequestForm 
          onClose={() => {
            setShowCreateForm(false);
            setEditingRequest(null);
          }}
          onSubmit={editingRequest ? handleUpdateRequest : handleCreateRequest}
          initialData={editingRequest}
          isEditing={!!editingRequest}
        />
      )}

      {showRequestDetail && (
        <RequestDetailModal 
          request={showRequestDetail}
          onClose={() => setShowRequestDetail(null)}
        />
      )}
    </div>
  );
};

// 硬编码函数已移除，现在使用DataService和国际化

export default PINDashboard;