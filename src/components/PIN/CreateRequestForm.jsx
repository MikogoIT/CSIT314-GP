// PIN创建请求表单
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const CreateRequestForm = ({ onClose, onSubmit, initialData = null, isEditing = false }) => {
  const { user } = useAuth();
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
      
      await onSubmit(requestData);
      onClose();
    } catch (error) {
      console.error('创建请求失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal form-modal">
        <div className="modal-header">
          <h3 className="modal-title">
            {isEditing ? '编辑求助请求' : '创建新的求助请求'}
          </h3>
          <button className="modal-close" onClick={onClose} type="button">
            ✕
          </button>
        </div>
        
        <div className="modal-body">
          <form onSubmit={handleSubmit} className="form">
            <div className="form-section">
              <h4 className="form-section-title">基本信息</h4>
              
              <div className="form-grid cols-2">
                <div className="form-group">
                  <label className="form-label required">请求标题 <small>(至少5个字符)</small></label>
                  <input 
                    type="text" 
                    name="title"
                    className="form-input"
                    placeholder="请用至少5个字符简要描述您的需求" 
                    value={formData.title}
                    onChange={handleChange}
                    minLength="5"
                    maxLength="200"
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label required">服务类型</label>
                  <select 
                    name="category"
                    className="form-select"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">选择服务类型</option>
                    <option value="medical">医疗陪同</option>
                    <option value="transportation">交通帮助</option>
                    <option value="shopping">购物协助</option>
                    <option value="household">家务帮助</option>
                    <option value="companion">陪伴服务</option>
                    <option value="technology">技术支持</option>
                    <option value="other">其他</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group full-width">
                <label className="form-label required">详细描述 <small>(至少10个字符)</small></label>
                <textarea 
                  name="description"
                  className="form-textarea"
                  placeholder="请用至少10个字符详细描述您的需求，包括具体要求、注意事项等"
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
                  <label className="form-label required">服务地点</label>
                  <input 
                    type="text" 
                    name="location"
                    className="form-input"
                    placeholder="详细地址或区域" 
                    value={formData.location}
                    onChange={handleChange}
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">紧急程度</label>
                  <select 
                    name="urgency"
                    className="form-select"
                    value={formData.urgency}
                    onChange={handleChange}
                  >
                    <option value="low">一般 - 可以等待</option>
                    <option value="medium">中等 - 一周内</option>
                    <option value="high">紧急 - 三天内</option>
                    <option value="urgent">非常紧急 - 24小时内</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4 className="form-section-title">时间安排与其他要求</h4>
              
              <div className="form-grid cols-2">
                <div className="form-group">
                  <label className="form-label">期望日期</label>
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
                  <label className="form-label">期望时间</label>
                  <select 
                    name="expectedTime"
                    className="form-select"
                    value={formData.expectedTime}
                    onChange={handleChange}
                  >
                    <option value="">任意时间</option>
                    <option value="morning">上午 (9:00-12:00)</option>
                    <option value="afternoon">下午 (12:00-18:00)</option>
                    <option value="evening">晚上 (18:00-21:00)</option>
                  </select>
                </div>
              </div>
              
              <div className="form-grid cols-2">
                <div className="form-group">
                  <label className="form-label">需要志愿者人数</label>
                  <select 
                    name="volunteersNeeded"
                    className="form-select"
                    value={formData.volunteersNeeded}
                    onChange={handleChange}
                  >
                    <option value={1}>1人</option>
                    <option value={2}>2人</option>
                    <option value={3}>3人</option>
                    <option value={4}>4人</option>
                    <option value={5}>5人或以上</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">联系方式偏好</label>
                  <select 
                    name="contactMethod"
                    className="form-select"
                    value={formData.contactMethod}
                    onChange={handleChange}
                  >
                    <option value="phone">电话</option>
                    <option value="email">邮箱</option>
                    <option value="both">电话和邮箱</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group full-width">
                <label className="form-label form-label-optional">补充说明</label>
                <textarea 
                  name="additionalNotes"
                  className="form-textarea"
                  placeholder="任何其他需要说明的信息..."
                  rows="3"
                  value={formData.additionalNotes}
                  onChange={handleChange}
                />
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
            取消
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting && <span className="loading-spinner"></span>}
            {isSubmitting ? '发布中...' : '发布请求'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateRequestForm;