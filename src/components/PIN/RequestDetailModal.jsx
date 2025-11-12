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
    return t(`urgency.${urgency}`) || urgency;
  };

  const formatDateTime = (dateString, timeString) => {
    if (dateString) {
      const date = new Date(dateString);
      const locale = t('common.locale');
      const formattedDate = date.toLocaleDateString(locale);
      
      // 处理时间段
      let timeDisplay = '';
      if (timeString) {
        const timeLabel = t(`time.${timeString}`);
        timeDisplay = `${timeLabel} (${timeString === 'morning' ? '9:00-12:00' : timeString === 'afternoon' ? '12:00-18:00' : '18:00-21:00'})`;
        return `${formattedDate} ${timeDisplay}`;
      }
      
      return formattedDate;
    }
    return t('common.unknown');
  };

  return (
    <div className="modal-backdrop">
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3 className="modal-title">{t('request.detail.title')}</h3>
          <button className="modal-close" onClick={onClose} type="button">
            ✕
          </button>
        </div>
        
        <div className="modal-body">
          <div className="request-detail">
            {/* 基本信息 */}
            <div className="detail-section">
              <h4 className="detail-section-title">{t('request.detail.basicInfo')}</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <label className="detail-label">{t('request.form.title')}</label>
                  <div className="detail-value">{request.title}</div>
                </div>
                <div className="detail-item">
                  <label className="detail-label">{t('request.form.category')}</label>
                  <div className="detail-value">
                    <span className="category-tag">{getCategoryName(request.category)}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <label className="detail-label">{t('request.form.urgency')}</label>
                  <div className="detail-value">
                    <span className={`urgency-badge ${request.urgency}`}>
                      {getUrgencyName(request.urgency)}
                    </span>
                  </div>
                </div>
                <div className="detail-item">
                  <label className="detail-label">{t('status.label')}</label>
                  <div className="detail-value">
                    <span className={`status-badge ${request.status}`}>
                      {t(`status.${request.status}`)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 详细描述 */}
            <div className="detail-section">
              <h4 className="detail-section-title">{t('request.detail.description')}</h4>
              <div className="detail-description">
                {request.description || t('request.noDescription')}
              </div>
            </div>

            {/* 时间和地点 */}
            <div className="detail-section">
              <h4 className="detail-section-title">{t('request.detail.timing')}</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <label className="detail-label">{t('request.form.location')}</label>
                  <div className="detail-value">
                    {request.location?.address || request.location || t('common.unknown')}
                  </div>
                </div>
                <div className="detail-item">
                  <label className="detail-label">{t('request.form.expectedDate')}</label>
                  <div className="detail-value">
                    {formatDateTime(request.expectedDate, request.expectedTime)}
                  </div>
                </div>
                <div className="detail-item">
                  <label className="detail-label">{t('request.form.volunteersNeeded')}</label>
                  <div className="detail-value">{request.volunteersNeeded || 1} {t('request.volunteers')}</div>
                </div>
                <div className="detail-item">
                  <label className="detail-label">{t('request.form.contactMethod')}</label>
                  <div className="detail-value">
                    {request.contactMethod === 'phone' ? t('contact.phone') : 
                     request.contactMethod === 'email' ? t('contact.email') : 
                     request.contactMethod === 'both' ? t('contact.both') : t('contact.other')}
                  </div>
                </div>
              </div>
            </div>

            {/* 请求人信息 */}
            <div className="detail-section">
              <h4 className="detail-section-title">{t('request.detail.requester')}</h4>
              <div className="requester-info">
                <div className="requester-avatar">👤</div>
                <div className="requester-details">
                  <div className="requester-name">{request.requesterName || t('common.unknown')}</div>
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
              <h4 className="detail-section-title">{t('request.detail.statistics')}</h4>
              <div className="stats-row">
                <div className="stat-item">
                  <span className="stat-label">{t('request.detail.viewCount')}</span>
                  <span className="stat-value">👁️ {request.viewCount || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">{t('request.detail.shortlistCount')}</span>
                  <span className="stat-value">⭐ {request.shortlistCount || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">{t('request.detail.createdAt')}</span>
                  <span className="stat-value">
                    {request.createdAt ? new Date(request.createdAt).toLocaleString(t('common.locale')) : t('common.unknown')}
                  </span>
                </div>
              </div>
            </div>

            {/* 附加信息 */}
            {request.additionalNotes && (
              <div className="detail-section">
                <h4 className="detail-section-title">{t('request.form.additionalNotes')}</h4>
                <div className="detail-notes">
                  {request.additionalNotes}
                </div>
              </div>
            )}

            {/* 附件 */}
            {request.attachments && request.attachments.length > 0 && (
              <div className="detail-section">
                <h4 className="detail-section-title">{t('request.form.attachments')} ({request.attachments.length})</h4>
                <div className="attachments-list">
                  {request.attachments.map((attachment, index) => {
                    // 构建文件URL - 去掉API路径，只保留服务器地址
                    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
                    const serverUrl = apiUrl.replace(/\/api\/?$/, '');
                    const fileUrl = `${serverUrl}${attachment.url}`;
                    
                    return (
                      <div key={index} className="attachment-item-view">
                        <div className="attachment-icon">
                          {attachment.mimetype?.startsWith('image/') ? '🖼️' : '📄'}
                        </div>
                        <div className="attachment-info">
                          <div className="attachment-name">{attachment.originalName || attachment.filename}</div>
                          <div className="attachment-meta">
                            {attachment.size && (
                              <span className="attachment-size">
                                {(attachment.size / 1024).toFixed(2)} KB
                              </span>
                            )}
                            {attachment.uploadedAt && (
                              <span className="attachment-date">
                                {new Date(attachment.uploadedAt).toLocaleDateString(t('common.locale'))}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="attachment-actions">
                          {attachment.url && (
                            <>
                              <a 
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-secondary"
                              >
                                {t('attachment.preview')}
                              </a>
                              <a 
                                href={fileUrl}
                                download={attachment.originalName}
                                className="btn btn-sm btn-primary"
                              >
                                {t('common.download')}
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 已分配志愿者信息（如果已匹配或已完成） */}
            {(request.status === 'matched' || request.status === 'completed') && 
             request.assignedVolunteers && 
             request.assignedVolunteers.length > 0 && (
              <div className="detail-section">
                <h4 className="detail-section-title">
                  {t('request.assignedVolunteers')} ({request.assignedVolunteers.length}{t('request.volunteers')})
                </h4>
                {request.assignedVolunteers.map((volunteer, index) => (
                  <div key={index} className="volunteer-info" style={{ marginBottom: index < request.assignedVolunteers.length - 1 ? '15px' : '0' }}>
                    <div className="volunteer-avatar">
                      {volunteer.name?.charAt(0).toUpperCase() || '👤'}
                    </div>
                    <div className="volunteer-details">
                      <div className="volunteer-name">{volunteer.name || t('request.unknownVolunteer')}</div>
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
                        {t('request.assignedTime')}: {volunteer.assignedAt ? new Date(volunteer.assignedAt).toLocaleString(t('common.locale')) : t('common.unknown')}
                      </div>
                      {volunteer.completedAt && (
                        <div className="volunteer-status" style={{ fontSize: '0.85em', color: '#4caf50', marginTop: '3px' }}>
                          ✅ {t('request.completedTime')}: {new Date(volunteer.completedAt).toLocaleString(t('common.locale'))}
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
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestDetailModal;