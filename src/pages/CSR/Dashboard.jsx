// CSR Dashboard - 现代化设计
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { DataService } from '../../services/dataService';
import Navbar from '../../components/Layout/Navbar';
import RequestDetailModal from '../../components/PIN/RequestDetailModal';
import '../../styles/csr-dashboard.css';

const CSRDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [recentRequests, setRecentRequests] = useState([]);
  const [shortlistedRequests, setShortlistedRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showRequestDetail, setShowRequestDetail] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalRequests: 0,
    newToday: 0,
    shortlisted: 0,
    urgent: 0
  });

  // 加载仪表板数据
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        await DataService.initializeData();
        
        // 获取所有待处理的请求
        const allRequests = await DataService.getRequests();
        const pendingRequests = (allRequests || []).filter(request => request.status === 'pending');
        
        // 获取最近的请求（最多显示6个）
        const recent = pendingRequests
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 6);
        setRecentRequests(recent);
        
        // 加载分类数据
        const allCategories = await DataService.getCategories();
        setCategories(allCategories || []);
        
        // 加载用户的收藏夹
        let userShortlists = [];
        if (user?.id) {
          const savedShortlist = localStorage.getItem(`shortlist_${user.id}`);
          userShortlists = savedShortlist ? JSON.parse(savedShortlist) : [];
          setShortlistedRequests(userShortlists);
        }
        
        // 计算统计数据
        const today = new Date().toDateString();
        const newToday = pendingRequests.filter(req => 
          new Date(req.createdAt).toDateString() === today
        ).length;
        
        const urgent = pendingRequests.filter(req => 
          req.urgency === 'high' || req.urgency === 'urgent'
        ).length;
        
        setDashboardStats({
          totalRequests: pendingRequests.length,
          newToday: newToday,
          shortlisted: userShortlists.length,
          urgent: urgent
        });
        
      } catch (error) {
        console.error('加载仪表板数据失败:', error);
        setRecentRequests([]);
        setShortlistedRequests([]);
        setCategories([]);
      }
    };
    
    loadDashboardData();
  }, [user?.id]);

  // 处理查看请求详情
  const handleViewDetail = (request) => {
    setShowRequestDetail(request);
  };

  // 处理添加/移除收藏
  const handleToggleShortlist = (request) => {
    if (!user || !user.id) {
      alert(t('csr.search.loginRequired'));
      return;
    }

    const isShortlisted = shortlistedRequests.some(req => req.requestId === request.id);
    let updatedShortlist;

    if (isShortlisted) {
      updatedShortlist = shortlistedRequests.filter(req => req.requestId !== request.id);
    } else {
      const shortlistItem = {
        id: Date.now(),
        userId: user.id,
        requestId: request.id,
        request: request,
        shortlistedAt: new Date().toISOString()
      };
      updatedShortlist = [...shortlistedRequests, shortlistItem];
    }

    setShortlistedRequests(updatedShortlist);
    localStorage.setItem(`shortlist_${user.id}`, JSON.stringify(updatedShortlist));
    
    // 更新统计数据
    setDashboardStats(prev => ({
      ...prev,
      shortlisted: updatedShortlist.length
    }));
  };

  // 过滤请求根据选择的分类
  const filteredRequests = selectedCategory 
    ? recentRequests.filter(req => req.category === selectedCategory)
    : recentRequests;

  return (
    <div className="csr-dashboard-container">
      <Navbar userType="csr" user={user} />
      <div className="csr-main-content">
        <div className="dashboard">
          {/* 现代化英雄区域 */}
          <div className="csr-hero-section">
            <div className="csr-hero-background">
              <div className="csr-hero-pattern"></div>
              <div className="csr-hero-content">
                <div className="csr-hero-left">
                  <div className="csr-welcome-badge">
                    <span className="badge-icon">🤝</span>
                    <span>{t('csr.dashboard.welcomeVolunteer')}</span>
                  </div>
                  <h1 className="csr-hero-title">
                    {t('csr.dashboard.hello')} <span className="name-highlight">{user?.name}</span>
                  </h1>
                  <p className="csr-hero-subtitle">{t('csr.dashboard.heroSubtitle')}</p>
                  <div className="csr-hero-actions">
                    <a href="/csr/search" className="csr-hero-btn primary">
                      <span className="btn-icon">🔍</span>
                      {t('csr.dashboard.exploreRequests')}
                    </a>
                    <a href="/csr/shortlist" className="csr-hero-btn secondary">
                      <span className="btn-icon">⭐</span>
                      {t('csr.dashboard.myShortlist')}
                    </a>
                  </div>
                </div>
                <div className="csr-hero-right">
                  <div className="csr-hero-visual">
                    <div className="hero-icon-container">
                      <div className="hero-main-icon">🤝</div>
                      <div className="hero-floating-icons">
                        <span className="floating-icon" style={{ animationDelay: '0s' }}>❤️</span>
                        <span className="floating-icon" style={{ animationDelay: '1s' }}>🌟</span>
                        <span className="floating-icon" style={{ animationDelay: '2s' }}>🎯</span>
                        <span className="floating-icon" style={{ animationDelay: '3s' }}>💫</span>
                      </div>
                    </div>
                    <div className="hero-achievement-badge">
                      <span className="achievement-icon">🏆</span>
                      <div className="achievement-text">
                        <span className="achievement-title">{t('csr.dashboard.topVolunteer')}</span>
                        <span className="achievement-subtitle">{t('csr.dashboard.thisMonth')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 统计卡片区域 */}
          <div className="csr-stats-section">
            <div className="csr-stats-header">
              <h2 className="stats-title">{t('csr.dashboard.communityOverview')}</h2>
              <p className="stats-subtitle">{t('csr.dashboard.overviewSubtitle')}</p>
            </div>
            <div className="csr-stats-grid">
              <div className="csr-stat-card primary">
                <div className="stat-card-background"></div>
                <div className="stat-card-content">
                  <div className="stat-icon-container">
                    <div className="stat-icon-circle">
                      <span className="stat-icon">📋</span>
                    </div>
                    <div className="stat-trend">
                      <span className="trend-icon">�</span>
                      <span className="trend-text">{t('common.total')}</span>
                    </div>
                  </div>
                  <div className="stat-info">
                    <div className="stat-value">{dashboardStats.totalRequests}</div>
                    <h3 className="stat-title">{t('csr.dashboard.totalRequests')}</h3>
                    <p className="stat-description">{t('csr.dashboard.totalRequestsDesc')}</p>
                  </div>
                </div>
              </div>

              <div className="csr-stat-card success">
                <div className="stat-card-background"></div>
                <div className="stat-card-content">
                  <div className="stat-icon-container">
                    <div className="stat-icon-circle">
                      <span className="stat-icon">🆕</span>
                    </div>
                    <div className="stat-trend">
                      <span className="trend-icon">🔥</span>
                      <span className="trend-text">{t('common.new')}</span>
                    </div>
                  </div>
                  <div className="stat-info">
                    <div className="stat-value">{dashboardStats.newToday}</div>
                    <h3 className="stat-title">{t('csr.dashboard.newToday')}</h3>
                    <p className="stat-description">{t('csr.dashboard.newTodayDesc')}</p>
                  </div>
                </div>
              </div>

              <div className="csr-stat-card warning">
                <div className="stat-card-background"></div>
                <div className="stat-card-content">
                  <div className="stat-icon-container">
                    <div className="stat-icon-circle">
                      <span className="stat-icon">⭐</span>
                    </div>
                    <div className="stat-trend">
                      <span className="trend-icon">💝</span>
                      <span className="trend-text">{t('common.saved')}</span>
                    </div>
                  </div>
                  <div className="stat-info">
                    <div className="stat-value">{dashboardStats.shortlisted}</div>
                    <h3 className="stat-title">{t('csr.dashboard.myShortlist')}</h3>
                    <p className="stat-description">{t('csr.dashboard.shortlistDesc')}</p>
                  </div>
                </div>
              </div>

              <div className="csr-stat-card danger">
                <div className="stat-card-background"></div>
                <div className="stat-card-content">
                  <div className="stat-icon-container">
                    <div className="stat-icon-circle">
                      <span className="stat-icon">🚨</span>
                    </div>
                    <div className="stat-trend">
                      <span className="trend-icon">⚡</span>
                      <span className="trend-text">{t('common.urgent')}</span>
                    </div>
                  </div>
                  <div className="stat-info">
                    <div className="stat-value">{dashboardStats.urgent}</div>
                    <h3 className="stat-title">{t('csr.dashboard.urgentRequests')}</h3>
                    <p className="stat-description">{t('csr.dashboard.urgentDesc')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 主要内容区域 */}
          <div className="csr-content-section">
            <div className="csr-content-grid">
              {/* 近期请求 */}
              <div className="csr-main-content-card">
                <div className="csr-card-header">
                  <div className="csr-card-title-group">
                    <div className="csr-card-icon">
                      <span>🔥</span>
                    </div>
                    <div className="csr-card-title-content">
                      <h3 className="csr-card-title">{t('csr.dashboard.recentRequests')}</h3>
                      <p className="csr-card-subtitle">{t('csr.dashboard.latestHelpRequests')}</p>
                    </div>
                  </div>
                  <div className="csr-card-filters">
                    <select 
                      value={selectedCategory} 
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="category-filter"
                    >
                      <option value="">{t('common.allCategories')}</option>
                      {categories.map(category => (
                        <option key={category.id || category.name} value={category.id || category.name}>
                          {t(`category.${category.id || category.name}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="csr-card-content">
                  {filteredRequests.length > 0 ? (
                    <div className="csr-requests-grid">
                      {filteredRequests.map((request, index) => {
                        const isShortlisted = shortlistedRequests.some(req => req.requestId === request.id);
                        return (
                          <div key={request.id} className="csr-request-card" style={{ animationDelay: `${index * 0.1}s` }}>
                            <div className="request-card-header">
                              <div className="request-priority-indicator">
                                <div className={`priority-dot ${request.urgency || 'medium'}`}></div>
                                <span className="priority-label">
                                  {t(`common.${request.urgency || 'medium'}`)}
                                </span>
                              </div>
                              <button 
                                className={`shortlist-btn ${isShortlisted ? 'active' : ''}`}
                                onClick={() => handleToggleShortlist(request)}
                              >
                                <span className="shortlist-icon">
                                  {isShortlisted ? '⭐' : '☆'}
                                </span>
                              </button>
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
                                  <span className="meta-icon">📍</span>
                                  <span className="meta-text">{request.location?.address || request.location}</span>
                                </div>
                                <div className="meta-item">
                                  <span className="meta-icon">👥</span>
                                  <span className="meta-text">{request.volunteersNeeded || 1} {t('common.volunteers')}</span>
                                </div>
                              </div>
                              
                              <div className="request-footer">
                                <div className="request-time">
                                  <span className="time-icon">🕒</span>
                                  <span className="time-text">{DataService.getTimeAgo(request.createdAt, t)}</span>
                                </div>
                                <div className="request-requester">
                                  <div className="requester-avatar">
                                    {request.requesterName?.charAt(0).toUpperCase() || '👤'}
                                  </div>
                                  <span className="requester-name">{request.requesterName}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="request-card-actions">
                              <button 
                                className="csr-action-btn view primary"
                                onClick={() => handleViewDetail(request)}
                              >
                                <span className="action-icon">👁️</span>
                                <span>{t('common.viewDetails')}</span>
                              </button>
                              <button 
                                className="csr-action-btn volunteer success"
                                onClick={() => {/* TODO: Handle volunteer */}}
                              >
                                <span className="action-icon">🤝</span>
                                <span>{t('csr.dashboard.volunteer')}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="csr-empty-state">
                      <div className="empty-state-visual">
                        <div className="empty-icon-circle">
                          <span className="empty-icon">🔍</span>
                        </div>
                        <div className="empty-sparkles">
                          <span className="sparkle">✨</span>
                          <span className="sparkle">⭐</span>
                          <span className="sparkle">💫</span>
                        </div>
                      </div>
                      <div className="empty-state-content">
                        <h3 className="empty-state-title">
                          {selectedCategory ? t('csr.dashboard.noCategoryRequests') : t('csr.dashboard.noRecentRequests')}
                        </h3>
                        <p className="empty-state-description">
                          {selectedCategory ? t('csr.dashboard.tryDifferentCategory') : t('csr.dashboard.checkBackLater')}
                        </p>
                        <a href="/csr/search" className="csr-cta-button">
                          <span className="cta-icon">🔍</span>
                          <span className="cta-text">{t('csr.dashboard.exploreAll')}</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 侧边栏 */}
              <div className="csr-sidebar">
                <div className="csr-sidebar-card quick-actions-card">
                  <div className="sidebar-card-header">
                    <div className="sidebar-card-icon">⚡</div>
                    <h3 className="sidebar-card-title">{t('csr.dashboard.quickActions')}</h3>
                  </div>
                  <div className="sidebar-card-content">
                    <div className="quick-actions-grid">
                      <a href="/csr/search" className="quick-action-item search">
                        <div className="quick-action-icon">🔍</div>
                        <div className="quick-action-content">
                          <span className="quick-action-title">{t('csr.dashboard.searchRequests')}</span>
                          <span className="quick-action-desc">{t('csr.dashboard.findOpportunities')}</span>
                        </div>
                      </a>
                      
                      <a href="/csr/shortlist" className="quick-action-item shortlist">
                        <div className="quick-action-icon">⭐</div>
                        <div className="quick-action-content">
                          <span className="quick-action-title">{t('csr.dashboard.viewShortlist')}</span>
                          <span className="quick-action-desc">{t('csr.dashboard.savedRequests')}</span>
                        </div>
                      </a>
                      
                      <a href="/csr/history" className="quick-action-item history">
                        <div className="quick-action-icon">📊</div>
                        <div className="quick-action-content">
                          <span className="quick-action-title">{t('csr.dashboard.myHistory')}</span>
                          <span className="quick-action-desc">{t('csr.dashboard.pastActivities')}</span>
                        </div>
                      </a>
                      
                      <a href="/help" className="quick-action-item help">
                        <div className="quick-action-icon">❓</div>
                        <div className="quick-action-content">
                          <span className="quick-action-title">{t('common.help')}</span>
                          <span className="quick-action-desc">{t('csr.dashboard.getSupport')}</span>
                        </div>
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="csr-sidebar-card impact-card">
                  <div className="sidebar-card-header">
                    <div className="sidebar-card-icon">🌟</div>
                    <h3 className="sidebar-card-title">{t('csr.dashboard.yourImpact')}</h3>
                  </div>
                  <div className="sidebar-card-content">
                    <div className="impact-stats">
                      <div className="impact-item">
                        <div className="impact-number">12</div>
                        <div className="impact-label">{t('csr.dashboard.helpedPeople')}</div>
                      </div>
                      <div className="impact-item">
                        <div className="impact-number">48</div>
                        <div className="impact-label">{t('csr.dashboard.hoursVolunteered')}</div>
                      </div>
                      <div className="impact-item">
                        <div className="impact-number">95%</div>
                        <div className="impact-label">{t('csr.dashboard.satisfaction')}</div>
                      </div>
                    </div>
                    <div className="impact-message">
                      <p>{t('csr.dashboard.impactMessage')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {showRequestDetail && (
        <RequestDetailModal 
          request={showRequestDetail}
          onClose={() => setShowRequestDetail(null)}
        />
      )}
    </div>
  );
};

export default CSRDashboard;