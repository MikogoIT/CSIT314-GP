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
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingRequestId, setRatingRequestId] = useState(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, matched, completed
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, urgent

  // 初始化数据和加载用户请求
  useEffect(() => {
    let isMounted = true;
    
    const loadUserData = async () => {
      try {
        // PIN用户不需要调用initializeData，直接加载自己的请求
        if (user?.id && isMounted) {
          const userRequests = await DataService.getUserRequests(user.id);
          console.log('PIN Dashboard - 加载的请求数据:', userRequests);
          if (isMounted) {
            setRequests(userRequests || []); // 确保是数组
          }
        }
      } catch (error) {
        console.error('加载用户数据失败:', error);
        if (isMounted) {
          setRequests([]); // 设置为空数组防止错误
        }
      }
    };
    
    loadUserData();
    
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // 筛选和排序请求
  useEffect(() => {
    let filtered = [...requests];
    
    // 按状态筛选
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }
    
    // 排序
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'urgent') {
      const urgencyOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      filtered.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
    }
    
    setFilteredRequests(filtered);
  }, [requests, statusFilter, sortBy]);

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

  // 处理选择志愿者
  const handleSelectVolunteer = async (requestId, volunteerId) => {
    if (window.confirm(t('pin.dashboard.confirmSelect') || '确定选择这位志愿者吗？')) {
      try {
        // 调用匹配API
        await DataService.matchRequest(requestId, volunteerId);
        
        // 重新加载用户请求
        const userRequests = await DataService.getUserRequests(user.id);
        setRequests(userRequests || []);
        
        alert(t('pin.dashboard.selectSuccess') || '已成功匹配志愿者！');
      } catch (error) {
        console.error('选择志愿者失败:', error);
        alert(t('error.selectVolunteerFailed') || '选择志愿者失败，请重试');
      }
    }
  };

  // 处理完成请求
  const handleCompleteRequest = async (requestId) => {
    // 打开评分对话框
    setRatingRequestId(requestId);
    setRating(5);
    setFeedback('');
    setShowRatingModal(true);
  };

  const submitCompleteRequest = async () => {
    if (!ratingRequestId) return;
    
    try {
      // 调用完成请求API，传入评分和反馈
      await DataService.completeRequest(ratingRequestId, {
        rating,
        feedback: feedback.trim()
      });
      
      // 关闭对话框
      setShowRatingModal(false);
      setRatingRequestId(null);
      setRating(5);
      setFeedback('');
      
      // 重新加载用户请求
      const userRequests = await DataService.getUserRequests(user.id);
      setRequests(userRequests || []);
      
      alert(t('pin.dashboard.completeSuccess') || '请求已完成！感谢您的评价。');
    } catch (error) {
      console.error('完成请求失败:', error);
      alert(t('error.completeRequestFailed') || '完成请求失败，请重试');
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
                
                {/* 筛选和排序控件 */}
                {requests.length > 0 && (
                  <div className="pin-filters-section">
                    <div className="filter-group">
                      <label className="filter-label">
                        <span className="filter-icon">🔍</span>
                        {t('pin.dashboard.filterByStatus') || '按状态筛选'}
                      </label>
                      <select 
                        className="filter-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="all">{t('common.all') || '全部'} ({requests.length})</option>
                        <option value="pending">
                          {t('pin.dashboard.status.pending') || '待处理'} ({requests.filter(r => r.status === 'pending').length})
                        </option>
                        <option value="matched">
                          {t('pin.dashboard.status.matched') || '已匹配'} ({requests.filter(r => r.status === 'matched').length})
                        </option>
                        <option value="completed">
                          {t('pin.dashboard.status.completed') || '已完成'} ({requests.filter(r => r.status === 'completed').length})
                        </option>
                      </select>
                    </div>
                    
                    <div className="filter-group">
                      <label className="filter-label">
                        <span className="filter-icon">📅</span>
                        {t('pin.dashboard.sortBy') || '排序方式'}
                      </label>
                      <select 
                        className="filter-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                      >
                        <option value="newest">{t('pin.dashboard.sort.newest') || '最新创建'}</option>
                        <option value="oldest">{t('pin.dashboard.sort.oldest') || '最早创建'}</option>
                        <option value="urgent">{t('pin.dashboard.sort.urgent') || '按紧急程度'}</option>
                      </select>
                    </div>
                    
                    <div className="filter-results">
                      {t('pin.dashboard.showing') || '显示'}: <strong>{filteredRequests.length}</strong> / {requests.length}
                    </div>
                  </div>
                )}
                
                <div className="pin-card-content">
                  {filteredRequests.length > 0 ? (
                    <div className="pin-requests-grid">
                      {filteredRequests.map((request, index) => (
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
                              {request.interestedVolunteers && request.interestedVolunteers.length > 0 && (
                                <div className="stat-item highlight">
                                  <span className="stat-icon">🙋</span>
                                  <span className="stat-number">{request.interestedVolunteers.length}</span>
                                  <span className="stat-label">{t('pin.dashboard.applicants') || '申请者'}</span>
                                </div>
                              )}
                            </div>

                            {/* 显示已申请的志愿者 */}
                            {request.interestedVolunteers && request.interestedVolunteers.length > 0 && request.status === 'pending' && (
                              <div className="interested-volunteers-section">
                                <h5 className="section-title">
                                  <span>🙋</span> {t('pin.dashboard.interestedVolunteers') || '申请的志愿者'}
                                </h5>
                                <div className="volunteers-list">
                                  {request.interestedVolunteers.map((volunteer, idx) => (
                                    <div key={idx} className="volunteer-item">
                                      <div className="volunteer-info">
                                        <span className="volunteer-icon">👤</span>
                                        <span className="volunteer-name">{volunteer.name}</span>
                                      </div>
                                      <button 
                                        className="btn-select-volunteer"
                                        onClick={() => handleSelectVolunteer(request.id, volunteer.id)}
                                      >
                                        {t('pin.dashboard.selectVolunteer') || '选择'}
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

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
                            
                            {request.status === 'pending' && (
                              <button 
                                className="pin-action-btn edit"
                                onClick={() => handleEditRequest(request)}
                              >
                                <span className="action-icon">✏️</span>
                                {t('common.edit')}
                              </button>
                            )}
                            
                            {request.status === 'matched' && (
                              <button 
                                className="pin-action-btn complete"
                                onClick={() => handleCompleteRequest(request.id)}
                              >
                                <span className="action-icon">✅</span>
                                {t('pin.dashboard.complete') || '完成'}
                              </button>
                            )}
                            
                            {request.status === 'pending' && (
                              <button 
                                className="pin-action-btn delete"
                                onClick={() => handleDeleteRequest(request.id)}
                              >
                                <span className="action-icon">🗑️</span>
                                {t('common.delete')}
                              </button>
                            )}
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

      {/* 评分对话框 */}
      {showRatingModal && (
        <div className="modal-overlay" onClick={() => setShowRatingModal(false)}>
          <div className="modal-content rating-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('pin.dashboard.rateVolunteer') || '评价志愿者'}</h3>
              <button className="close-btn" onClick={() => setShowRatingModal(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="rating-section">
                <label className="form-label">
                  {t('pin.dashboard.serviceRating') || '服务评分'}
                  <span className="required">*</span>
                </label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      className={`star-btn ${star <= rating ? 'active' : ''}`}
                      onClick={() => setRating(star)}
                    >
                      ★
                    </button>
                  ))}
                  <span className="rating-text">
                    {rating === 1 && (t('rating.poor') || '很差')}
                    {rating === 2 && (t('rating.fair') || '一般')}
                    {rating === 3 && (t('rating.good') || '良好')}
                    {rating === 4 && (t('rating.veryGood') || '很好')}
                    {rating === 5 && (t('rating.excellent') || '优秀')}
                  </span>
                </div>
              </div>

              <div className="feedback-section">
                <label className="form-label">
                  {t('pin.dashboard.feedback') || '评价反馈'}
                  <span className="optional">({t('common.optional') || '可选'})</span>
                </label>
                <textarea
                  className="feedback-textarea"
                  placeholder={t('pin.dashboard.feedbackPlaceholder') || '分享您对志愿者服务的评价和建议...'}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  maxLength={500}
                />
                <div className="char-count">{feedback.length}/500</div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowRatingModal(false)}
              >
                {t('common.cancel') || '取消'}
              </button>
              <button 
                className="btn btn-primary"
                onClick={submitCompleteRequest}
              >
                {t('pin.dashboard.submitRating') || '提交评价'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 硬编码函数已移除，现在使用DataService和国际化

export default PINDashboard;