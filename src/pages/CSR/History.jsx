import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { DataService } from '../../services/dataService';
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

  useEffect(() => {
    if (user?.id) {
      loadServiceRecords();
    }
  }, [user?.id]);

  useEffect(() => {
    applyFilters();
  }, [serviceRecords, filters]);

  const loadServiceRecords = async () => {
    try {
      await DataService.initializeData();
      const allRequests = await DataService.getRequests();
      
      const userServiceRecords = (allRequests || []).filter(request => 
        request.volunteerId === user.id &&
        (request.status === 'matched' || request.status === 'completed') &&
        request.matchedAt
      );

      const sortedRecords = userServiceRecords.sort((a, b) => 
        new Date(b.matchedAt) - new Date(a.matchedAt)
      );

      setServiceRecords(sortedRecords);
    } catch (error) {
      console.error('Failed to load service history:', error);
      setServiceRecords([]);
    }
  };

  const applyFilters = () => {
    let filtered = [...serviceRecords];

    if (filters.serviceType) {
      filtered = filtered.filter(record => record.category === filters.serviceType);
    }

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
    return t(`category.${category}`) || category;
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
              <p className="page-subtitle">{t('csr.history.subtitle')}</p>
            </div>
          </div>

          {/* 服务统计 */}
          {serviceRecords.length > 0 && (
            <div className="stats-section">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-number">{stats.totalServices}</div>
                  <div className="stat-label">{t('csr.history.totalServices')}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{Object.keys(stats.categoriesCount).length}</div>
                  <div className="stat-label">{t('csr.history.serviceTypes')}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{getCategoryText(stats.mostActiveCategory)}</div>
                  <div className="stat-label">{t('csr.history.mostActive')}</div>
                </div>
              </div>
            </div>
          )}

          {/* 筛选器 */}
          <div className="filters-section">
            <div className="filters">
              <div className="filter-group">
                <label>{t('csr.history.filterByType')}</label>
                <select 
                  value={filters.serviceType} 
                  onChange={(e) => handleFilterChange('serviceType', e.target.value)}
                  className="filter-select"
                >
                  <option value="">{t('csr.history.allServiceTypes')}</option>
                  <option value="medical">{t('category.medical')}</option>
                  <option value="transportation">{t('category.transportation')}</option>
                  <option value="shopping">{t('category.shopping')}</option>
                  <option value="household">{t('category.household')}</option>
                  <option value="companion">{t('category.companion')}</option>
                  <option value="technology">{t('category.technology')}</option>
                  <option value="education">{t('category.education')}</option>
                  <option value="other">{t('category.other')}</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>{t('csr.history.startDate')}</label>
                <input 
                  type="date" 
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="filter-input"
                />
              </div>
              
              <div className="filter-group">
                <label>{t('csr.history.endDate')}</label>
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
                  {t('csr.history.clearFilters')}
                </button>
              </div>
            </div>
            
            <div className="results-count">
              {t('csr.history.resultsFound', { count: filteredRecords.length })}
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
                          {t(`urgency.${record.urgency || 'medium'}`)}
                        </span>
                      </div>
                    </div>
                    <div className="service-info">
                      <div className="requester-name">
                        👤 {t('csr.history.serviceObject')}: {record.requesterName || t('csr.history.unknown')}
                      </div>
                      <div className="service-date">
                        🤝 {t('csr.history.serviceDate')}: {new Date(record.matchedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="card-body">
                    <p className="description">{record.description}</p>
                    <div className="service-details">
                      <div className="detail-item">
                        <span className="label">📍 {t('csr.history.serviceLocation')}:</span>
                        <span className="value">{record.location?.address || record.location || t('csr.history.toBeConfirmed')}</span>
                      </div>
                      {record.expectedDate && (
                        <div className="detail-item">
                          <span className="label">🕒 {t('csr.history.expectedTime')}:</span>
                          <span className="value">
                            {new Date(record.expectedDate).toLocaleDateString()}
                            {record.expectedTime && ` ${record.expectedTime}`}
                          </span>
                        </div>
                      )}
                      <div className="detail-item">
                        <span className="label">📞 {t('csr.history.contactInfo')}:</span>
                        <span className="value">{record.requesterPhone || record.requesterEmail}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="card-actions">
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleViewDetail(record)}
                    >
                      {t('common.viewDetails')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🤝</div>
              <div className="empty-state-title">
                {serviceRecords.length === 0 ? t('csr.history.noRecords') : t('csr.history.noFilteredRecords')}
              </div>
              <div className="empty-state-description">
                {serviceRecords.length === 0 
                  ? t('csr.history.noRecordsDesc')
                  : t('csr.history.noFilteredRecordsDesc')
                }
              </div>
              {serviceRecords.length === 0 && (
                <a href="/csr/search" className="btn btn-primary">
                  {t('csr.history.browseOpportunities')}
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