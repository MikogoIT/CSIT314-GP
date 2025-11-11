// 6. CSR收藏夹页面
// src/pages/CSR/Shortlist.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Navbar from '../../components/Layout/Navbar';
import RequestDetailModal from '../../components/PIN/RequestDetailModal';
import '../../styles/shortlist.css';

const CSRShortlist = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [shortlistedRequests, setShortlistedRequests] = useState([]);
  const [showRequestDetail, setShowRequestDetail] = useState(null);

  useEffect(() => {
    if (user?.id) {
      const savedShortlist = JSON.parse(localStorage.getItem(`shortlist_${user.id}`) || '[]');
      setShortlistedRequests(savedShortlist);
    }
  }, [user?.id]);

  const handleRemoveFromShortlist = (requestId) => {
    if (window.confirm('确定要从收藏夹中移除这项请求吗？')) {
      const updatedShortlist = shortlistedRequests.filter(req => req.requestId !== requestId);
      setShortlistedRequests(updatedShortlist);
      localStorage.setItem(`shortlist_${user.id}`, JSON.stringify(updatedShortlist));
    }
  };

  const handleViewDetail = (request) => {
    setShowRequestDetail(request);
  };

  const getCategoryText = (category) => {
    // Use translation system for consistent category names
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
      <Navbar userType="csr" user={user} />
      
      <div className="main-content">
        <div className="shortlist-page">
          <div className="page-header">
            <div className="header-content">
              <h1 className="page-title">{t('csr.shortlist.title')}</h1>
              <p className="page-subtitle">管理您收藏的志愿服务机会</p>
            </div>
          </div>

          {shortlistedRequests.length > 0 ? (
            <div className="shortlist-grid">
              {shortlistedRequests.map((shortlistItem) => {
                const request = shortlistItem.request || shortlistItem;
                return (
                <div key={shortlistItem.id} className="request-card">
                  <div className="card-header">
                    <h3 className="request-title">{request.title}</h3>
                    <div className="request-meta">
                      <span className="category-badge">{getCategoryText(request.category)}</span>
                      <span className={`urgency-badge urgency-${getUrgencyColor(request.urgency)}`}>
                        {getUrgencyText(request.urgency)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="card-body">
                    <p className="request-description">{request.description}</p>
                    <div className="request-info">
                      <div className="location">📍 {request.location?.address || request.location || '待确定'}</div>
                      {request.expectedDate && (
                        <div className="timing">
                          🕒 {new Date(request.expectedDate).toLocaleDateString('zh-CN')}
                          {request.expectedTime && ` ${request.expectedTime}`}
                        </div>
                      )}
                      <div className="shortlisted-date">
                        ⭐ 收藏于: {new Date(shortlistItem.shortlistedAt).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="card-actions">
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleViewDetail(request)}
                    >
                      查看详情
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={() => handleRemoveFromShortlist(shortlistItem.requestId)}
                    >
                      移除收藏
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">⭐</div>
              <div className="empty-state-title">收藏夹为空</div>
              <div className="empty-state-description">
                您还没有收藏任何志愿服务机会。<br/>
                去搜索页面找到感兴趣的项目并添加到收藏夹吧！
              </div>
              <a href="/csr/search" className="btn btn-primary">
                浏览志愿机会
              </a>
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

export default CSRShortlist;