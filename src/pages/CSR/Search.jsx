// CSR搜索页面
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { DataService } from '../../services/dataService';
import Navbar from '../../components/Layout/Navbar';
import RequestDetailModal from '../../components/PIN/RequestDetailModal';
import '../../styles/search.css';
import '../../styles/modern-dashboard.css';

const CSRSearch = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedUrgency, setSelectedUrgency] = useState('');
  const [showRequestDetail, setShowRequestDetail] = useState(null);
  const [shortlistedRequests, setShortlistedRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // 加载所有请求和收藏夹
  useEffect(() => {
    let isMounted = true; // 防止组件卸载后更新状态
    
    const loadData = async () => {
      try {
        // 不调用initializeData，因为它会重复请求数据
        // 直接获取所需数据
        
        // 获取所有待处理的请求
        const allRequests = await DataService.getRequests();
        if (!isMounted) return;
        
        // 过滤出待处理且未被当前用户拒绝的请求
        const pendingRequests = (allRequests || []).filter(request => {
          if (request.status !== 'pending') return false;
          // 检查当前用户是否已拒绝此请求
          const rejected = request.rejectedVolunteers?.some(
            r => r.volunteer === user?.id || r.volunteer?.id === user?.id
          );
          return !rejected;
        });
        
        setRequests(pendingRequests);
        setFilteredRequests(pendingRequests);
        
        // 加载分类数据
        const allCategories = await DataService.getCategories();
        if (!isMounted) return;
        
        setCategories(allCategories || []);
        
        // 加载用户的收藏夹
        if (user?.id) {
          const savedShortlist = localStorage.getItem(`shortlist_${user.id}`);
          const userShortlists = savedShortlist ? JSON.parse(savedShortlist) : [];
          setShortlistedRequests(userShortlists);
        }
      } catch (error) {
        console.error('加载数据失败:', error);
        if (!isMounted) return;
        
        setRequests([]);
        setFilteredRequests([]);
        setShortlistedRequests([]);
        setCategories([]);
      }
    };
    
    loadData();
    
    // 清理函数
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // 搜索和过滤逻辑
  useEffect(() => {
    const filters = {
      searchText: searchTerm,
      category: selectedCategory === '' ? 'all' : selectedCategory,
      urgency: selectedUrgency === '' ? 'all' : selectedUrgency
    };
    
    const filtered = DataService.filterRequests(requests, filters);
    setFilteredRequests(filtered);
  }, [requests, searchTerm, selectedCategory, selectedUrgency]);

  // 处理查看请求详情
  const handleViewDetail = async (request) => {
    setShowRequestDetail(request);
    
    // 调用API获取完整详情（会自动增加浏览量）
    try {
      await DataService.getRequestById(request.id);
      // 重新加载请求列表以更新浏览量
      const updatedRequests = await DataService.getRequests();
      const pendingRequests = (updatedRequests || []).filter(req => req.status === 'pending');
      setRequests(pendingRequests);
    } catch (error) {
      console.error('获取请求详情失败:', error);
    }
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
      // 移除收藏
      updatedShortlist = shortlistedRequests.filter(req => req.requestId !== request.id);
      alert(t('csr.search.removeFromShortlist'));
    } else {
      // 添加收藏
      const shortlistItem = {
        id: Date.now(),
        userId: user.id,
        requestId: request.id,
        request: request,
        shortlistedAt: new Date().toISOString()
      };
      updatedShortlist = [...shortlistedRequests, shortlistItem];
      alert(t('csr.search.addToShortlist'));
    }

    setShortlistedRequests(updatedShortlist);
    
    // 更新本地存储
    localStorage.setItem(`shortlist_${user.id}`, JSON.stringify(updatedShortlist));
  };

  // 检查请求是否已收藏
  const isRequestShortlisted = (requestId) => {
    return shortlistedRequests.some(req => req.requestId === requestId);
  };

  // 检查当前用户是否已申请该请求
  const hasUserApplied = (request) => {
    if (!user || !user.id) return false;
    // 检查interestedVolunteers数组中是否包含当前用户
    return request.interestedVolunteers?.some(v => v.id === user.id) || false;
  };

  // 处理申请志愿服务
  const handleApplyVolunteer = async (requestId) => {
    if (!user || !user.email) {
      alert(t('csr.search.loginRequired'));
      return;
    }

    // 调试信息
    console.log('Applying for request:', {
      requestId,
      idLength: requestId?.length,
      idType: typeof requestId,
      isValid: /^[0-9a-fA-F]{24}$/.test(requestId)
    });

    if (window.confirm(t('csr.search.confirmApply'))) {
      try {
        // 使用专门的申请API
        await DataService.applyForRequest(requestId);
        
        // 更新本地状态 - 不从列表中移除,因为只是申请还未匹配
        // 可以选择刷新数据或显示"已申请"状态
        const updatedRequests = await DataService.getRequests();
        setRequests(updatedRequests);
        
        alert(t('csr.search.applySuccess'));
      } catch (error) {
        console.error('申请志愿服务时出错:', error);
        alert(error.message || t('csr.search.applyError'));
      }
    }
  };

  const handleCancelApplication = async (requestId) => {
    if (window.confirm(t('csr.search.confirmCancel') || '确认取消申请？')) {
      try {
        await DataService.cancelApplication(requestId);
        
        // 刷新请求列表
        const updatedRequests = await DataService.getRequests();
        setRequests(updatedRequests);
        
        alert(t('csr.search.cancelSuccess') || '已取消申请');
      } catch (error) {
        console.error('取消申请时出错:', error);
        alert(error.message || t('csr.search.cancelError') || '取消申请失败');
      }
    }
  };

  // 检查当前用户是否已拒绝该请求
  const hasUserRejected = (request) => {
    if (!user || !user.id) return false;
    return request.rejectedVolunteers?.some(r => r.volunteer === user.id || r.volunteer?.id === user.id) || false;
  };

  // 打开拒绝模态框
  const handleOpenRejectModal = (request) => {
    setRejectingRequest(request);
    setRejectReason('');
    setShowRejectModal(true);
  };

  // 拒绝请求
  const handleRejectRequest = async () => {
    if (!rejectingRequest) return;

    try {
      await DataService.rejectRequest(rejectingRequest.id, rejectReason);
      
      // 刷新请求列表并过滤掉被拒绝的请求
      const updatedRequests = await DataService.getRequests();
      const pendingRequests = (updatedRequests || []).filter(
        req => req.status === 'pending' && !hasUserRejected(req)
      );
      setRequests(pendingRequests);
      setFilteredRequests(pendingRequests);
      
      alert(t('csr.search.rejectSuccess'));
      setShowRejectModal(false);
      setRejectingRequest(null);
      setRejectReason('');
    } catch (error) {
      console.error('拒绝请求时出错:', error);
      alert(error.message || t('csr.search.rejectError'));
    }
  };
  
  return (
    <div className="modern-admin-container">
      <Navbar userType="csr" user={user} />
      <div className="modern-main-content">
        <div className="dashboard">
          <div className="modern-dashboard-header">
            <div className="header-background">
              <div className="header-content">
                <div className="modern-header-content">
                  <div className="modern-header-left">
                    <h1 className="modern-header-title">{t('csr.search.title')}</h1>
                    <p className="modern-header-subtitle">{t('csr.search.subtitle')}</p>
                  </div>
                  <div className="modern-header-avatar">
                    <div className="modern-avatar-container">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} />
                      ) : (
                        user?.name?.charAt(0).toUpperCase() || '🎯'
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 搜索和过滤器 */}
          <div className="modern-card" style={{ marginBottom: '2rem' }}>
            <div className="card-content">
              <div className="search-filters">
                <div className="search-bar">
                  <input
                    type="text"
                    placeholder={t('csr.search.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input"
                    style={{ flex: 1 }}
                  />
                </div>
                
                <div className="filter-row" style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="form-select"
                  >
                    <option value="">{t('csr.search.allCategories')}</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {t(category.name)}
                      </option>
                    ))}
                  </select>
                  
                  <select
                    value={selectedUrgency}
                    onChange={(e) => setSelectedUrgency(e.target.value)}
                    className="form-select"
                  >
                    <option value="">{t('csr.search.allUrgency')}</option>
                    {DataService.getUrgencyLevels().map(urgency => (
                      <option key={urgency.id} value={urgency.id}>
                        {t(urgency.name)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 统计信息 */}
          <div className="modern-stats-grid" style={{ marginBottom: '2rem' }}>
            <div className="modern-stat-card info">
              <div className="stat-content">
                <div className="stat-header">
                  <div className="stat-icon">🔍</div>
                  <div className="stat-trend">📈</div>
                </div>
                <div className="stat-body">
                  <div className="stat-value">{filteredRequests.length}</div>
                  <div className="stat-title">{t('stats.availableOpportunities')}</div>
                </div>
              </div>
              <div className="stat-glow"></div>
            </div>
            <div className="modern-stat-card warning">
              <div className="stat-content">
                <div className="stat-header">
                  <div className="stat-icon">🚨</div>
                  <div className="stat-trend">📈</div>
                </div>
                <div className="stat-body">
                  <div className="stat-value">{filteredRequests.filter(r => r.urgency === 'urgent').length}</div>
                  <div className="stat-title">{t('stats.urgentRequests')}</div>
                </div>
              </div>
              <div className="stat-glow"></div>
            </div>
          </div>
          
          {/* 请求列表 */}
          <div className="modern-card main-card">
            <div className="card-header">
              <div className="card-title">
                <span className="card-icon">🎯</span>
                <h3>{t('csr.search.opportunities')}</h3>
              </div>
              <div className="card-subtitle">{t('csr.search.opportunitiesDesc')}</div>
            </div>
            <div className="card-content">
              {filteredRequests.length > 0 ? (
                <div className="request-list">
                  {filteredRequests.map(request => (
                    <div key={request.id} className="request-item">
                      <div className="request-header">
                        <h4 className="request-title">{request.title}</h4>
                        <div className={`urgency-badge ${request.urgency}`}>
                          {t(DataService.getUrgencyById(request.urgency).name)}
                        </div>
                      </div>
                      
                      <div className="request-meta">
                        <span className="category-tag">{t(DataService.getCategoryById(request.category).name)}</span>
                        <span className="meta-item">📍 {request.location?.address || request.location || '待确定'}</span>
                        <span className="meta-item">👤 {request.requesterName}</span>
                        <span className="meta-item">{DataService.getTimeAgo(request.createdAt, t)}</span>
                      </div>

                      <div className="request-description">
                        {request.description}
                      </div>

                      {request.expectedDate && (
                        <div className="request-timing">
                          <strong>{t('request.form.expectedDate')}：</strong>
                          {new Date(request.expectedDate).toLocaleDateString()}
                          {request.expectedTime && ` ${request.expectedTime}`}
                        </div>
                      )}

                      <div className="request-actions">
                        {hasUserApplied(request) ? (
                          <button 
                            className="btn btn-danger"
                            onClick={() => handleCancelApplication(request.id)}
                          >
                            ✗ {t('csr.search.cancelApplication') || '取消申请'}
                          </button>
                        ) : (
                          <button 
                            className="btn btn-primary"
                            onClick={() => handleApplyVolunteer(request.id)}
                          >
                            {t('csr.search.applyVolunteer')}
                          </button>
                        )}
                        <button 
                          className={`btn ${isRequestShortlisted(request.id) ? 'btn-warning' : 'btn-outline'}`}
                          onClick={() => handleToggleShortlist(request)}
                        >
                          {isRequestShortlisted(request.id) ? `⭐ ${t('csr.search.shortlisted')}` : `☆ ${t('csr.search.shortlist')}`}
                        </button>
                        <button 
                          className="btn btn-secondary"
                          onClick={() => handleViewDetail(request)}
                        >
                          {t('csr.search.viewDetails')}
                        </button>
                        <button 
                          className="btn btn-danger btn-outline"
                          onClick={() => handleOpenRejectModal(request)}
                          title={t('csr.search.rejectRequest')}
                        >
                          🚫 {t('csr.search.rejectRequest')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">🔍</div>
                  <div className="empty-state-title">
                    {requests.length === 0 ? t('csr.search.noOpportunities') : t('csr.search.noResults')}
                  </div>
                  <div className="empty-state-description">
                    {requests.length === 0 
                      ? t('csr.search.noOpportunitiesDesc')
                      : t('csr.search.noResultsDesc')
                    }
                  </div>
                  {requests.length > 0 && (
                    <button 
                      className="btn btn-secondary"
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedCategory('');
                        setSelectedUrgency('');
                      }}
                    >
                      {t('csr.search.clearFilters')}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 请求详情模态框 */}
      {showRequestDetail && (
        <RequestDetailModal 
          request={showRequestDetail}
          onClose={() => setShowRequestDetail(null)}
        />
      )}

      {/* 拒绝请求模态框 */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🚫 {t('csr.search.rejectRequest')}</h2>
              <button 
                className="modal-close"
                onClick={() => setShowRejectModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '1rem', color: '#64748b' }}>
                {t('csr.search.confirmReject')}
              </p>
              {rejectingRequest && (
                <div style={{ 
                  padding: '1rem', 
                  background: '#f8fafc', 
                  borderRadius: '8px',
                  marginBottom: '1rem'
                }}>
                  <strong>{rejectingRequest.title}</strong>
                  <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem' }}>
                    {t(DataService.getCategoryById(rejectingRequest.category).name)}
                  </div>
                </div>
              )}
              <div className="form-group">
                <label htmlFor="rejectReason">
                  {t('csr.search.rejectReason')}
                </label>
                <textarea
                  id="rejectReason"
                  className="form-textarea"
                  rows="4"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={t('csr.search.rejectReasonPlaceholder')}
                  maxLength="500"
                />
                <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                  {rejectReason.length}/500
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowRejectModal(false)}
              >
                取消
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleRejectRequest}
              >
                🚫 确认拒绝
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 硬编码函数已移除，现在使用DataService和国际化

export default CSRSearch;