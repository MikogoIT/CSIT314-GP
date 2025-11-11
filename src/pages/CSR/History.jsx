// 7. CSR历史记录页面
// src/pages/CSR/History.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Navbar from '../../components/Layout/Navbar';
import RequestDetailModal from '../../components/PIN/RequestDetailModal';
import '../../styles/history.css';

const CSRHistory = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [serviceRecords, setServiceRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [showRequestDetail, setShowRequestDetail] = useState(null);
  const [filters, setFilters] = useState({
    serviceType: '',
    startDate: '',
    endDate: ''
  });

  // 加载服务历史记录
  useEffect(() => {
    if (user?.id) {
      loadServiceRecords();
    }
  }, [user?.id]);

  // 应用过滤器
  useEffect(() => {
    applyFilters();
  }, [serviceRecords, filters]);

  const loadServiceRecords = () => {
    // 从localStorage获取所有请求
    const allRequests = JSON.parse(localStorage.getItem('userRequests') || '[]');
    
    // 过滤出当前CSR志愿者参与的已完成服务
    const userServiceRecords = allRequests.filter(request => 
      request.volunteerId === user.id &&
      request.status === 'matched' &&
      request.matchedAt // 确保有匹配时间
    );

    // 按匹配时间降序排序
    const sortedRecords = userServiceRecords.sort((a, b) => 
      new Date(b.matchedAt) - new Date(a.matchedAt)
    );

    setServiceRecords(sortedRecords);
  };

  const applyFilters = () => {
    let filtered = [...serviceRecords];

    // 按服务类型过滤
    if (filters.serviceType) {
      filtered = filtered.filter(record => record.category === filters.serviceType);
    }

    // 按日期范围过滤
    if (filters.startDate) {
      filtered = filtered.filter(record => {
        const matchDate = new Date(record.matchedAt);
        const startDate = new Date(filters.startDate);
        return matchDate >= startDate;
      });
    }

    if (filters.endDate) {
      filtered = filtered.filter(record => {
        const matchDate = new Date(record.matchedAt);
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999); // 包含结束日期的整天
        return matchDate <= endDate;
      });
    }

    setFilteredRecords(filtered);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleViewDetail = (record) => {
    setShowRequestDetail(record);
  };

  const getCategoryText = (category) => {
    // Use translation system directly for all categories
    return t(`category.${category}`) || category;
  };

  const getUrgencyText = (urgency) => {
    const urgencyMap = {
      low: '低',
      medium: '中',
      high: '高',
      urgent: '紧急'
    };
    return urgencyMap[urgency] || urgency;
  };

  const getUrgencyColor = (urgency) => {
    const colorMap = {
      low: 'success',
      medium: 'warning',
      high: 'danger',
      urgent: 'critical'
    };
    return colorMap[urgency] || 'default';
  };

  // 计算服务统计
  const getServiceStats = () => {
    const totalServices = serviceRecords.length;
    const categoriesCount = {};
    
    serviceRecords.forEach(record => {
      categoriesCount[record.category] = (categoriesCount[record.category] || 0) + 1;
    });

    const mostActiveCategory = Object.keys(categoriesCount).reduce((a, b) => 
      categoriesCount[a] > categoriesCount[b] ? a : b, '');

    return {
      totalServices,
      categoriesCount,
      mostActiveCategory
    };
  };

  const stats = getServiceStats();

  return (
    <div className="page-container">
      <Navbar userType="csr" user={user} />
      
      <div className="main-content">
        <div className="history-page">
          <div className="page-header">
            <div className="header-content">
              <h1 className="page-title">{t('csr.history.title')}</h1>
              <p className="page-subtitle">查看您完成的志愿服务记录和帮助历史</p>
            </div>
          </div>

          {/* 服务统计 */}
          {serviceRecords.length > 0 && (
            <div className="stats-section">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-number">{stats.totalServices}</div>
                  <div className="stat-label">完成服务</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{Object.keys(stats.categoriesCount).length}</div>
                  <div className="stat-label">服务类型</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{getCategoryText(stats.mostActiveCategory)}</div>
                  <div className="stat-label">最常服务</div>
                </div>
              </div>
            </div>
          )}

          {/* 筛选器 */}
          <div className="filters-section">
            <div className="filters">
              <div className="filter-group">
                <label>服务类型</label>
                <select 
                  value={filters.serviceType} 
                  onChange={(e) => handleFilterChange('serviceType', e.target.value)}
                  className="filter-select"
                >
                  <option value="">所有服务类型</option>
                  <option value="medical">{t('category.medical')}</option>
                  <option value="transport">{t('category.transport')}</option>
                  <option value="shopping">{t('category.shopping')}</option>
                  <option value="household">{t('category.household')}</option>
                  <option value="companion">{t('category.companion')}</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>开始日期</label>
                <input 
                  type="date" 
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="filter-input"
                />
              </div>
              
              <div className="filter-group">
                <label>结束日期</label>
                <input 
                  type="date" 
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="filter-input"
                />
              </div>
              
              <div className="filter-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setFilters({ serviceType: '', startDate: '', endDate: '' })}
                >
                  清除过滤器
                </button>
              </div>
            </div>
            
            <div className="results-count">
              找到 {filteredRecords.length} 条服务记录
            </div>
          </div>

          {/* 服务记录列表 */}
          {filteredRecords.length > 0 ? (
            <div className="history-list">
              {filteredRecords.map((record) => (
                <div key={record.id} className="history-card">
                  <div className="card-header">
                    <div className="card-title">
                      <h3>{record.title}</h3>
                      <div className="card-meta">
                        <span className="category-badge">{getCategoryText(record.category)}</span>
                        <span className={`urgency-badge urgency-${getUrgencyColor(record.urgency)}`}>
                          {getUrgencyText(record.urgency)}
                        </span>
                      </div>
                    </div>
                    <div className="service-info">
                      <div className="requester-name">
                        👤 服务对象: {record.requesterName || '未知'}
                      </div>
                      <div className="service-date">
                        🤝 服务时间: {new Date(record.matchedAt).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="card-body">
                    <p className="description">{record.description}</p>
                    <div className="service-details">
                      <div className="detail-item">
                        <span className="label">📍 服务地点:</span>
                        <span className="value">{record.location?.address || record.location || '待确定'}</span>
                      </div>
                      {record.expectedDate && (
                        <div className="detail-item">
                          <span className="label">🕒 预期时间:</span>
                          <span className="value">
                            {new Date(record.expectedDate).toLocaleDateString('zh-CN')}
                            {record.expectedTime && ` ${record.expectedTime}`}
                          </span>
                        </div>
                      )}
                      <div className="detail-item">
                        <span className="label">📞 联系方式:</span>
                        <span className="value">{record.requesterPhone || record.requesterEmail}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="card-actions">
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleViewDetail(record)}
                    >
                      查看详情
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🤝</div>
              <div className="empty-state-title">
                {serviceRecords.length === 0 ? '暂无服务记录' : '没有符合条件的记录'}
              </div>
              <div className="empty-state-description">
                {serviceRecords.length === 0 
                  ? '您还没有完成任何志愿服务。去搜索页面找到需要帮助的人，开始您的志愿服务之旅！'
                  : '尝试调整过滤条件查看更多记录'
                }
              </div>
              {serviceRecords.length === 0 && (
                <a href="/csr/search" className="btn btn-primary">
                  浏览志愿机会
                </a>
              )}
            </div>
          )}
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

export default CSRHistory;