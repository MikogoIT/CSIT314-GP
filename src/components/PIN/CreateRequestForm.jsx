// PIN创建请求表单
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const CreateRequestForm = ({ onClose, onSubmit, initialData = null, isEditing = false }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    category: initialData?.category || '',
    description: initialData?.description || '',
    location: initialData?.location || '',
    urgency: initialData?.urgency || 'medium',
    expectedDate: initialData?.expectedDate || '',
    expectedTime: initialData?.expectedTime || '',
    volunteersNeeded: initialData?.volunteersNeeded || 1,
    contactMethod: initialData?.contactMethod || 'phone',
    additionalNotes: initialData?.additionalNotes || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // 前端验证
      if (!formData.title || formData.title.trim().length < 5) {
        alert('请求标题至少需要5个字符');
        return;
      }
      
      if (!formData.description || formData.description.trim().length < 10) {
        alert('详细描述至少需要10个字符');
        return;
      }
      
      if (!formData.category) {
        alert('请选择服务类型');
        return;
      }
      
      if (!formData.location || formData.location.trim().length === 0) {
        alert('请填写服务地点');
        return;
      }
      
      // 如果选择了日期，验证不能是过去的时间
      if (formData.expectedDate) {
        const selectedDate = new Date(formData.expectedDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // 设置为今天的开始时间
        
        if (selectedDate < today) {
          alert('期望日期不能是过去的时间');
          return;
        }
      }
      
      // 创建或更新请求对象
      const requestData = isEditing ? {
        ...initialData,
        ...formData,
        // 保持原有的创建信息，只更新表单数据
        updatedAt: new Date().toISOString()
      } : {
        ...formData,
        // PIN用户身份信息（仅新建时）
        requesterId: user.id,
        requesterName: user.name,
        requesterEmail: user.email,
        requesterPhone: user.phone || '',
        requesterAddress: user.address || formData.location,
        // 请求状态
        status: 'pending',
        createdAt: new Date().toISOString(),
        viewCount: 0,
        shortlistCount: 0,
        assignedCSR: null,
        matchedVolunteers: []
      };
      // 如果有附件，则把 File 对象传递给上层（DataService 将使用 multipart 上传）
      if (attachments && attachments.length > 0) {
        requestData.attachments = attachments;
      }
      
      await onSubmit(requestData);
      onClose();
    } catch (error) {
      console.error('创建请求失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    // 合并到当前附件列表（限制可通过后端限制环境变量控制）
    setAttachments(prev => [...prev, ...files]);
    // 清空输入以允许再次选择相同文件名
    e.target.value = '';
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="modal-backdrop">
      <div className="modal form-modal">
        <div className="modal-header">
            <h3 className="modal-title">
              {isEditing ? t('request.form.edit') : t('request.form.create')}
            </h3>
            <button className="modal-close" onClick={onClose} type="button">
              ✕
            </button>
          </div>
        
        <div className="modal-body">
          <form onSubmit={handleSubmit} className="form">
            <div className="form-section">
              <h4 className="form-section-title">{t('request.section.basicInfo')}</h4>
              
              <div className="form-grid cols-2">
                <div className="form-group">
                  <label className="form-label required">{t('request.form.title')} <small>({t('request.validation.titleMinHint')})</small></label>
                  <input 
                    type="text" 
                    name="title"
                    className="form-input"
                    placeholder={t('request.form.titlePlaceholder')}
                    value={formData.title}
                    onChange={handleChange}
                    minLength="5"
                    maxLength="200"
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label required">{t('request.form.category')}</label>
                  <select 
                    name="category"
                    className="form-select"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">{t('common.all')}</option>
                    <option value="medical">{t('category.medical')}</option>
                    <option value="transportation">{t('category.transportation')}</option>
                    <option value="shopping">{t('category.shopping')}</option>
                    <option value="household">{t('category.household')}</option>
                    <option value="companion">{t('category.companion')}</option>
                    <option value="technology">{t('category.technology')}</option>
                    <option value="other">{t('category.other')}</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group full-width">
                <label className="form-label required">{t('request.form.description')} <small>({t('request.validation.descriptionMinHint')})</small></label>
                <textarea 
                  name="description"
                  className="form-textarea"
                  placeholder={t('request.form.descriptionPlaceholder')}
                  rows="4"
                  value={formData.description}
                  onChange={handleChange}
                  minLength="10"
                  maxLength="1000"
                  required
                />
              </div>
              
              <div className="form-grid cols-2">
                <div className="form-group">
                  <label className="form-label required">{t('request.form.location')}</label>
                  <input 
                    type="text" 
                    name="location"
                    className="form-input"
                    placeholder={t('request.form.locationPlaceholder')}
                    value={formData.location}
                    onChange={handleChange}
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">{t('request.form.urgency')}</label>
                  <select 
                    name="urgency"
                    className="form-select"
                    value={formData.urgency}
                    onChange={handleChange}
                  >
                    <option value="low">{t('urgency.low')}</option>
                    <option value="medium">{t('urgency.medium')}</option>
                    <option value="high">{t('urgency.high')}</option>
                    <option value="urgent">{t('urgency.urgent')}</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4 className="form-section-title">{t('request.section.timing')}</h4>
              
              <div className="form-grid cols-2">
                <div className="form-group">
                  <label className="form-label">{t('request.form.expectedDate')}</label>
                  <input 
                    type="date" 
                    name="expectedDate"
                    className="form-input"
                    value={formData.expectedDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">{t('request.form.expectedTime')}</label>
                  <select 
                    name="expectedTime"
                    className="form-select"
                    value={formData.expectedTime}
                    onChange={handleChange}
                  >
                    <option value="">{t('common.all')}</option>
                    <option value="morning">{t('time.morning')} (9:00-12:00)</option>
                    <option value="afternoon">{t('time.afternoon')} (12:00-18:00)</option>
                    <option value="evening">{t('time.evening')} (18:00-21:00)</option>
                  </select>
                </div>
              </div>
              
              <div className="form-grid cols-2">
                <div className="form-group">
                  <label className="form-label">{t('request.form.volunteersNeeded')}</label>
                  <select 
                    name="volunteersNeeded"
                    className="form-select"
                    value={formData.volunteersNeeded}
                    onChange={handleChange}
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={5}>5+</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">{t('request.form.contactMethod')}</label>
                  <select 
                    name="contactMethod"
                    className="form-select"
                    value={formData.contactMethod}
                    onChange={handleChange}
                  >
                    <option value="phone">{t('contact.phone')}</option>
                    <option value="email">{t('contact.email')}</option>
                    <option value="both">{t('contact.both')}</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group full-width">
                <label className="form-label form-label-optional">{t('request.form.additionalNotes')}</label>
                <textarea 
                  name="additionalNotes"
                  className="form-textarea"
                  placeholder={t('request.form.additionalNotesPlaceholder')}
                  rows="3"
                  value={formData.additionalNotes}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">
                  {t('request.form.attachments')}
                  <small className="form-hint"> {t('request.form.attachmentsHint')}</small>
                </label>
                <input
                  type="file"
                  name="attachments"
                  aria-label={t('request.form.attachments')}
                  className="form-input"
                  onChange={handleFileChange}
                  multiple
                  accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                />

                {attachments && attachments.length > 0 && (
                  <div className="attachment-list">
                    {attachments.map((f, idx) => (
                      <div key={idx} className="attachment-item">
                        <span className="attachment-name">{f.name}</span>
                        <button type="button" className="attachment-remove" onClick={() => removeAttachment(idx)}>{t('common.delete')}</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
        
        <div className="modal-footer">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {t('common.cancel')}
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting && <span className="loading-spinner"></span>}
            {isSubmitting ? t('request.form.submitting') : t('common.submit')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateRequestForm;