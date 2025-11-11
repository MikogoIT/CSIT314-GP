// 4. PIN历史记录页面
// src/pages/PIN/History.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Navbar from '../../components/Layout/Navbar';
import RequestDetailModal from '../../components/PIN/RequestDetailModal';
import '../../styles/history.css';

const PINHistory = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [historyRecords, setHistoryRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [showRequestDetail, setShowRequestDetail] = useState(null);
  const [filters, setFilters] = useState({
    serviceType: '',
    startDate: '',
    endDate: ''
  });

  // 加载历史记录
  useEffect(() => {
    if (user?.id) {
      loadHistoryRecords();
    }
  }, [user?.id]);

  // 应用过滤器
  useEffect(() => {
    applyFilters();
  }, [historyRecords, filters]);

  const loadHistoryRecords = () => {
    // 从localStorage获取所有请求
    const allRequests = JSON.parse(localStorage.getItem('userRequests') || '[]');
    
    // 过滤出当前用户已完成（matched）的请求
    const userCompletedRequests = allRequests.filter(request => 
      request.requesterId === user.id && 
      request.status === 'matched' &&
      request.matchedAt // 确保有匹配时间
    );

    // 按匹配时间降序排序
    const sortedRecords = userCompletedRequests.sort((a, b) => 
      new Date(b.matchedAt) - new Date(a.matchedAt)
    );

    setHistoryRecords(sortedRecords);
  };

  const applyFilters = () => {
    let filtered = [...historyRecords];

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

  return (
    <div className="page-container">
      <Navbar userType="pin" user={user} />
      
      <div className="main-content">
        <div className="history-page">
          <div className="page-header">
            <div className="header-content">
              <h1 className="page-title">{t('pin.history.title')}</h1>
              <p className="page-subtitle">查看您的历史匹配记录和完成的服务</p>
            </div>
          </div>

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
                  <option value="">{t('pin.history.allServiceTypes')}</option>
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
              找到 {filteredRecords.length} 条历史记录
            </div>
          </div>

          {/* 历史记录列表 */}
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
                    <div className="match-info">
                      <div className="volunteer-name">
                        👤 志愿者: {record.volunteer || '未知'}
                      </div>
                      <div className="match-date">
                        ✅ 匹配时间: {new Date(record.matchedAt).toLocaleDateString('zh-CN')}
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
                        <span className="label">📊 统计信息:</span>
                        <span className="value">
                          浏览 {record.viewCount || 0} 次 • 收藏 {record.shortlistCount || 0} 次
                        </span>
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
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">
                {historyRecords.length === 0 ? '暂无历史记录' : '没有符合条件的记录'}
              </div>
              <div className="empty-state-description">
                {historyRecords.length === 0 
                  ? '您还没有完成任何匹配的服务请求。创建请求并等待志愿者申请吧！'
                  : '尝试调整过滤条件查看更多记录'
                }
              </div>
              {historyRecords.length === 0 && (
                <a href="/pin/dashboard" className="btn btn-primary">
                  创建请求
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

export default PINHistory;