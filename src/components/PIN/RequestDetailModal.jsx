import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../services/dataService';

const RequestDetailModal = ({ request, onClose }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState({});
  const [localRatings, setLocalRatings] = useState({});
  const [localFeedbacks, setLocalFeedbacks] = useState({});
  
  if (!request) return null;

  const getCategoryName = (category) => {
    return t(`category.${category}`) || category;
  };

  const getUrgencyName = (urgency) => {
    const urgencyMap = {
      low: '低',
      medium: '中',
      high: '高',
      urgent: '紧急'
    };
    return urgencyMap[urgency] || urgency;
  };

  const formatDateTime = (dateString, timeString) => {
    if (dateString) {
      const date = new Date(dateString);
      const formattedDate = date.toLocaleDateString('zh-CN');
      
      // 处理时间段
      let timeDisplay = '';
      if (timeString) {
        const timeMap = {
          'morning': '上午 (9:00-12:00)',
          'afternoon': '下午 (12:00-18:00)', 
          'evening': '晚上 (18:00-21:00)'
        };
        timeDisplay = timeMap[timeString] || timeString;
        return `${formattedDate} ${timeDisplay}`;
      }
      
      return formattedDate;
    }
    return '待定';
  };

  return (
    <div className="modal-backdrop">
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3 className="modal-title">请求详情</h3>
          <button className="modal-close" onClick={onClose} type="button">
            ✕
          </button>
        </div>
        
        <div className="modal-body">
          <div className="request-detail">
            {/* 基本信息 */}
            <div className="detail-section">
              <h4 className="detail-section-title">基本信息</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <label className="detail-label">请求标题</label>
                  <div className="detail-value">{request.title}</div>
                </div>
                <div className="detail-item">
                  <label className="detail-label">服务类型</label>
                  <div className="detail-value">
                    <span className="category-tag">{getCategoryName(request.category)}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <label className="detail-label">紧急程度</label>
                  <div className="detail-value">
                    <span className={`urgency-badge ${request.urgency}`}>
                      {getUrgencyName(request.urgency)}
                    </span>
                  </div>
                </div>
                <div className="detail-item">
                  <label className="detail-label">状态</label>
                  <div className="detail-value">
                    <span className={`status-badge ${request.status}`}>
                      {request.status === 'matched' ? '已匹配' : 
                       request.status === 'pending' ? '等待匹配' : 
                       request.status === 'completed' ? '已完成' : '未知状态'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 详细描述 */}
            <div className="detail-section">
              <h4 className="detail-section-title">详细描述</h4>
              <div className="detail-description">
                {request.description || '无详细描述'}
              </div>
            </div>

            {/* 时间和地点 */}
            <div className="detail-section">
              <h4 className="detail-section-title">时间和地点</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <label className="detail-label">服务地点</label>
                  <div className="detail-value">
                    {request.location?.address || request.location || '待确定'}
                  </div>
                </div>
                <div className="detail-item">
                  <label className="detail-label">期望日期</label>
                  <div className="detail-value">
                    {formatDateTime(request.expectedDate, request.expectedTime)}
                  </div>
                </div>
                <div className="detail-item">
                  <label className="detail-label">需要志愿者数量</label>
                  <div className="detail-value">{request.volunteersNeeded || 1} 人</div>
                </div>
                <div className="detail-item">
                  <label className="detail-label">联系方式</label>
                  <div className="detail-value">
                    {request.contactMethod === 'phone' ? '电话' : 
                     request.contactMethod === 'email' ? '邮箱' : 
                     request.contactMethod === 'both' ? '电话和邮箱' : '其他'}
                  </div>
                </div>
              </div>
            </div>

            {/* 请求人信息 */}
            <div className="detail-section">
              <h4 className="detail-section-title">请求人信息</h4>
              <div className="requester-info">
                <div className="requester-avatar">👤</div>
                <div className="requester-details">
                  <div className="requester-name">{request.requesterName || '未知用户'}</div>
                  {request.requesterEmail && (
                    <div className="requester-contact">📧 {request.requesterEmail}</div>
                  )}
                  {request.requesterPhone && (
                    <div className="requester-contact">📞 {request.requesterPhone}</div>
                  )}
                  {request.requesterAddress && (
                    <div className="requester-contact">📍 {request.requesterAddress}</div>
                  )}
                </div>
              </div>
            </div>

            {/* 统计信息 */}
            <div className="detail-section">
              <h4 className="detail-section-title">统计信息</h4>
              <div className="stats-row">
                <div className="stat-item">
                  <span className="stat-label">浏览次数</span>
                  <span className="stat-value">👁️ {request.viewCount || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">收藏次数</span>
                  <span className="stat-value">⭐ {request.shortlistCount || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">创建时间</span>
                  <span className="stat-value">
                    {request.createdAt ? new Date(request.createdAt).toLocaleString('zh-CN') : '未知'}
                  </span>
                </div>
              </div>
            </div>

            {/* 附加信息 */}
            {request.additionalNotes && (
              <div className="detail-section">
                <h4 className="detail-section-title">附加说明</h4>
                <div className="detail-notes">
                  {request.additionalNotes}
                </div>
              </div>
            )}

            {/* 已分配志愿者信息（如果已匹配或已完成） */}
            {(request.status === 'matched' || request.status === 'completed') && 
             request.assignedVolunteers && 
             request.assignedVolunteers.length > 0 && (
              <div className="detail-section">
                <h4 className="detail-section-title">
                  已分配志愿者 ({request.assignedVolunteers.length}人)
                </h4>
                {request.assignedVolunteers.map((volunteer, index) => (
                  <div key={index} className="volunteer-info" style={{ marginBottom: index < request.assignedVolunteers.length - 1 ? '15px' : '0' }}>
                    <div className="volunteer-avatar">
                      {volunteer.name?.charAt(0).toUpperCase() || '👤'}
                    </div>
                    <div className="volunteer-details">
                      <div className="volunteer-name">{volunteer.name || '未知志愿者'}</div>
                      {volunteer.email && (
                        <div className="volunteer-contact" style={{ fontSize: '0.9em', color: '#666' }}>
                          📧 {volunteer.email}
                        </div>
                      )}
                      {volunteer.phone && (
                        <div className="volunteer-contact" style={{ fontSize: '0.9em', color: '#666' }}>
                          📞 {volunteer.phone}
                        </div>
                      )}
                      <div className="volunteer-status" style={{ fontSize: '0.85em', color: '#888', marginTop: '5px' }}>
                        分配时间: {volunteer.assignedAt ? new Date(volunteer.assignedAt).toLocaleString('zh-CN') : '未知'}
                      </div>
                      {volunteer.completedAt && (
                        <div className="volunteer-status" style={{ fontSize: '0.85em', color: '#4caf50', marginTop: '3px' }}>
                          ✅ 完成时间: {new Date(volunteer.completedAt).toLocaleString('zh-CN')}
                        </div>
                      )}
                      {volunteer.rating && (
                        <div className="volunteer-rating" style={{ marginTop: '5px' }}>
                          {'⭐'.repeat(volunteer.rating)} ({volunteer.rating}/5)
                        </div>
                      )}
                      {/* 如果请求已完成且当前用户是请求者，并且该志愿者还没有评分，显示评分表单 */}
                      {request.status === 'completed' && user && (user.id === request.requesterId || user._id === request.requesterId || user.id === request.requester) && !volunteer.rating && (
                        <div className="volunteer-rating-form" style={{ marginTop: '8px' }}>
                          <label style={{ display: 'block', marginBottom: '6px' }}>{t('request.rating.leaveRatingFor', { name: volunteer.name || t('common.volunteer') })}</label>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                            <select
                              value={localRatings[volunteer.id] || ''}
                              onChange={e => setLocalRatings(prev => ({ ...prev, [volunteer.id]: parseInt(e.target.value) }))}
                            >
                              <option value="">{t('request.rating.select')}</option>
                              <option value={1}>1</option>
                              <option value={2}>2</option>
                              <option value={3}>3</option>
                              <option value={4}>4</option>
                              <option value={5}>5</option>
                            </select>
                            <button
                              className="btn btn-primary"
                              disabled={submitting[volunteer.id] || !localRatings[volunteer.id]}
                              onClick={async () => {
                                const rating = localRatings[volunteer.id];
                                const feedback = localFeedbacks[volunteer.id] || '';
                                if (!rating) return;
                                try {
                                  setSubmitting(prev => ({ ...prev, [volunteer.id]: true }));
                                  await DataService.completeRequest(request.id, { rating, feedback, volunteerId: volunteer.id });
                                  // reflect locally
                                  volunteer.rating = rating;
                                  if (feedback) volunteer.feedback = feedback;
                                } catch (err) {
                                  console.error('提交评分失败', err);
                                  alert(t('error.submitRating') || '提交评分失败');
                                } finally {
                                  setSubmitting(prev => ({ ...prev, [volunteer.id]: false }));
                                }
                              }}
                            >
                              {submitting[volunteer.id] ? t('common.saving') : t('request.rating.submit')}
                            </button>
                          </div>
                          <textarea
                            placeholder={t('request.rating.feedbackPlaceholder')}
                            value={localFeedbacks[volunteer.id] || ''}
                            onChange={e => setLocalFeedbacks(prev => ({ ...prev, [volunteer.id]: e.target.value }))}
                            rows={3}
                            style={{ width: '100%', marginTop: '6px' }}
                          />
                        </div>
                      )}
                      {volunteer.feedback && (
                        <div className="volunteer-feedback" style={{ 
                          marginTop: '8px', 
                          padding: '8px', 
                          backgroundColor: '#f5f5f5', 
                          borderRadius: '4px',
                          fontSize: '0.9em'
                        }}>
                          💬 {volunteer.feedback}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestDetailModal;