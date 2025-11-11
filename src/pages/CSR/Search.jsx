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

  // 加载所有请求和收藏夹
  useEffect(() => {
    const loadData = async () => {
      try {
        // 初始化数据
        await DataService.initializeData();
        
        // 获取所有待处理的请求
        const allRequests = await DataService.getRequests();
        const pendingRequests = (allRequests || []).filter(request => request.status === 'pending');
        setRequests(pendingRequests);
        setFilteredRequests(pendingRequests);
        
        // 加载分类数据
        const allCategories = await DataService.getCategories();
        setCategories(allCategories || []);
        
        // 加载用户的收藏夹
        if (user?.id) {
          const savedShortlist = localStorage.getItem(`shortlist_${user.id}`);
          const userShortlists = savedShortlist ? JSON.parse(savedShortlist) : [];
          setShortlistedRequests(userShortlists);
        }
      } catch (error) {
        console.error('加载数据失败:', error);
        setRequests([]);
        setFilteredRequests([]);
        setShortlistedRequests([]);
        setCategories([]);
      }
    };
    
    loadData();
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

  // 处理申请志愿服务
  const handleApplyVolunteer = async (requestId) => {
    if (!user || !user.email) {
      alert(t('csr.search.loginRequired'));
      return;
    }

    if (window.confirm(t('csr.search.confirmApply'))) {
      try {
        // 更新请求状态为已匹配
        const updateData = {
          status: 'matched',
          volunteer: user.name || user.email || 'CSR志愿者',
          volunteerId: user.id,
          matchedAt: new Date().toISOString()
        };
        
        await DataService.updateRequest(requestId, updateData);
        
        // 更新本地状态
        setRequests(prev => prev.filter(req => req.id !== requestId));
        setFilteredRequests(prev => prev.filter(req => req.id !== requestId));
        
        alert(t('csr.search.applySuccess'));
      } catch (error) {
        console.error('申请志愿服务时出错:', error);
        alert(t('csr.search.applyError'));
      }
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
                        <button 
                          className="btn btn-primary"
                          onClick={() => handleApplyVolunteer(request.id)}
                        >
                          {t('csr.search.applyVolunteer')}
                        </button>
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
    </div>
  );
};

// 硬编码函数已移除，现在使用DataService和国际化

export default CSRSearch;