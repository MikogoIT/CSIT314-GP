// CategoryManagement.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { DataService } from '../../services/dataService';
import apiService from '../../services/apiService';
import '../../styles/category-management.css';

const CategoryManagement = () => {
  const navigate = useNavigate();
  const { t, currentLanguage } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryRequests, setCategoryRequests] = useState([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestDetail, setShowRequestDetail] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);

  // 获取分类显示名称
  const getCategoryDisplayName = (category) => {
    // 如果有 displayName 字段，使用它
    if (category.displayName) {
      return currentLanguage === 'zh' ? category.displayName.zh : category.displayName.en;
    }
    // 否则尝试翻译（兼容旧数据）
    const translationKey = `category.${category.name}`;
    const translated = t(translationKey);
    // 如果翻译结果就是翻译键本身，说明没有翻译，直接返回 name
    return translated === translationKey ? category.name : translated;
  };

  const handleGoBack = () => {
    navigate(-1); // 返回上一页
  };

  // 加载类别数据
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const allCategories = await DataService.getCategories();
      const allRequests = await DataService.getRequests();
      
      // 计算每个类别的请求数量
      const categoriesWithCounts = (allCategories || []).map(category => ({
        ...category,
        count: (allRequests || []).filter(request => 
          request.category === category.id || request.category === category.name
        ).length
      }));
      
      setCategories(categoriesWithCounts);
    } catch (error) {
      console.error('加载类别数据失败:', error);
      setCategories([]);
    }
  };

  const handleAddCategory = async () => {
    if (newCategory.trim()) {
      try {
        // 生成英文标识符（移除中文字符，转换为拼音或使用时间戳）
        const generateName = (displayName) => {
          // 移除所有非字母数字字符，如果结果为空则使用时间戳
          let name = displayName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
          
          // 如果处理后为空（全是中文），使用 category_ + 时间戳
          if (!name || name.length === 0) {
            name = `category_${Date.now()}`;
          }
          
          return name;
        };
        
        // 创建新分类对象
        const newCategoryData = {
          name: generateName(newCategory),
          displayName: {
            zh: newCategory.trim(),
            en: newCategory.trim()
          },
          description: {
            zh: '',
            en: ''
          },
          icon: '🤝',
          status: 'active'
        };
        
        // 调用API创建新分类
        await apiService.createCategory(newCategoryData);
        
        // 清除缓存并重新加载
        DataService.clearCache('categories');
        await loadCategories();
        
        setNewCategory('');
        alert('分类添加成功');
      } catch (error) {
        console.error('添加分类失败:', error);
        alert('添加分类失败: ' + (error.message || '未知错误'));
      }
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('确定要删除这个分类吗？')) {
      return;
    }
    
    try {
      await apiService.deleteCategory(id);
      
      // 清除缓存并重新加载
      DataService.clearCache('categories');
      await loadCategories();
      
      alert('分类删除成功');
    } catch (error) {
      console.error('删除分类失败:', error);
      alert('删除分类失败: ' + (error.message || '未知错误'));
    }
  };

  const handleViewCategoryRequests = async (category) => {
    try {
      // 直接获取所有请求然后本地过滤，确保能获得结果
      const allRequests = await DataService.getRequests();
      
      // 对所有请求进行详细的分类匹配
      const requests = (allRequests || []).filter(request => {
        // 多种匹配方式
        return request.category === category.id || 
               request.category?.name === category.id ||
               request.category?.id === category.id ||
               (typeof request.category === 'string' && request.category === category.id);
      });
      
      setSelectedCategory(category);
      setCategoryRequests(requests || []);
      setShowRequestModal(true);
    } catch (error) {
      console.error('获取分类请求失败:', error);
      setCategoryRequests([]);
      setShowRequestModal(true);
    }
  };

  const closeRequestModal = () => {
    setShowRequestModal(false);
    setSelectedCategory(null);
    setCategoryRequests([]);
  };

  // 查看请求详情
  const handleViewRequestDetail = (request) => {
    setSelectedRequest(request);
    setShowRequestDetail(true);
  };

  // 编辑请求
  const handleEditRequest = (request) => {
    setEditingRequest({...request});
    setShowEditModal(true);
  };

  // 冻结/解冻请求
  const handleFreezeRequest = async (request) => {
    try {
      const newStatus = request.status === 'frozen' ? request.originalStatus || 'pending' : 'frozen';
      const updatedRequest = {
        ...request,
        status: newStatus,
        originalStatus: newStatus === 'frozen' ? request.status : undefined,
        frozenAt: newStatus === 'frozen' ? new Date().toISOString() : undefined,
        updatedAt: new Date().toISOString()
      };

      // 更新本地存储中的请求
      const allRequests = await DataService.getRequests();
      const updatedRequests = allRequests.map(r => 
        r.id === request.id ? updatedRequest : r
      );
      localStorage.setItem('serviceRequests', JSON.stringify(updatedRequests));

      // 更新当前显示的请求列表
      setCategoryRequests(categoryRequests.map(r => 
        r.id === request.id ? updatedRequest : r
      ));

      // 重新加载类别数据以更新计数
      loadCategories();
    } catch (error) {
      console.error('冻结/解冻请求失败:', error);
      alert('操作失败，请重试');
    }
  };

  // 删除请求
  const handleDeleteRequest = async (request) => {
    if (window.confirm(t('admin.categories.confirmDelete') || `确定要删除请求 "${request.title}" 吗？此操作无法撤销。`)) {
      try {
        const allRequests = await DataService.getRequests();
        const filteredRequests = allRequests.filter(r => r.id !== request.id);
        localStorage.setItem('serviceRequests', JSON.stringify(filteredRequests));

        // 更新当前显示的请求列表
        setCategoryRequests(categoryRequests.filter(r => r.id !== request.id));

        // 重新加载类别数据以更新计数
        loadCategories();
      } catch (error) {
        console.error('删除请求失败:', error);
        alert('删除失败，请重试');
      }
    }
  };

  // 保存编辑的请求
  const handleSaveEditedRequest = async () => {
    if (!editingRequest) return;

    try {
      const updatedRequest = {
        ...editingRequest,
        updatedAt: new Date().toISOString()
      };

      const allRequests = await DataService.getRequests();
      const updatedRequests = allRequests.map(r => 
        r.id === editingRequest.id ? updatedRequest : r
      );
      localStorage.setItem('serviceRequests', JSON.stringify(updatedRequests));

      // 更新当前显示的请求列表
      setCategoryRequests(categoryRequests.map(r => 
        r.id === editingRequest.id ? updatedRequest : r
      ));

      setShowEditModal(false);
      setEditingRequest(null);
      loadCategories();
    } catch (error) {
      console.error('保存请求失败:', error);
      alert('保存失败，请重试');
    }
  };

  // 关闭详情模态框
  const closeRequestDetail = () => {
    setShowRequestDetail(false);
    setSelectedRequest(null);
  };

  // 关闭编辑模态框
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingRequest(null);
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <div className="page-nav">
          <button 
            className="btn btn-back"
            onClick={handleGoBack}
            title={t('common.back') || '返回'}
          >
            <span className="btn-icon">←</span>
            {t('common.back') || '返回'}
          </button>
        </div>
        <h1 className="page-title">{t('admin.categories.title')}</h1>
        <p className="page-subtitle">{t('admin.categories.subtitle')}</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">{t('admin.categories.addNew')}</h3>
        </div>
        <div className="card-body">
          <div className="input-group">
            <input 
              type="text" 
              className="form-input"
              placeholder={t('admin.categories.placeholder')}
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <button 
              className="btn btn-primary"
              onClick={handleAddCategory}
              disabled={!newCategory.trim()}
            >
              <span className="btn-icon">+</span>
              {t('admin.categories.add')}
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">{t('admin.categories.existing')}</h3>
          <span className="badge">{categories.length} {t('admin.categories.count')}</span>
        </div>
        <div className="card-body">
          <div className="category-list">
            {categories.map(category => (
              <div 
                key={category.id} 
                className="category-item"
                onClick={() => handleViewCategoryRequests(category)}
                title={category.count > 0 ? (t('admin.categories.clickToView') || '点击查看相关请求') : ''}
              >
                <div className="category-info">
                  <div className="category-icon">📁</div>
                  <div className="category-details">
                    <h4 className="category-name">{getCategoryDisplayName(category)}</h4>
                    <p className="category-count">
                      {category.count} {t('admin.categories.relatedRequests')}
                      {category.count > 0 && (
                        <span className="click-hint"> • {t('admin.categories.clickHint') || '点击查看'}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="category-actions">
                  <button 
                    className="btn btn-danger btn-sm delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(category._id || category.id);
                    }}
                    title={t('common.delete') || '删除'}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 请求列表模态框 */}
      {showRequestModal && selectedCategory && (
        <div className="modal-overlay" onClick={closeRequestModal}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {getCategoryDisplayName(selectedCategory)} - {t('admin.categories.requestList') || '请求列表'}
              </h3>
              <button className="modal-close" onClick={closeRequestModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="request-stats">
                <div className="stat-item">
                  <span className="stat-label">{t('admin.categories.totalRequests') || '总请求数'}:</span>
                  <span className="stat-value">{categoryRequests.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">{t('admin.categories.pendingRequests') || '待处理'}:</span>
                  <span className="stat-value">
                    {categoryRequests.filter(r => r.status === 'pending').length}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">{t('admin.categories.matchedRequests') || '已匹配'}:</span>
                  <span className="stat-value">
                    {categoryRequests.filter(r => r.status === 'matched').length}
                  </span>
                </div>
              </div>
              {categoryRequests.length > 0 ? (
                <div className="requests-list">
                  {categoryRequests.map(request => (
                    <div key={request.id} className="request-item">
                      <div className="request-header">
                        <h4 className="request-title">{request.title}</h4>
                        <div className="request-header-right">
                          <span className={`status-badge ${request.status}`}>
                            {request.status === 'frozen' ? '已冻结' : t(DataService.getStatusById(request.status).name)}
                          </span>
                          <div className="request-actions">
                            <button 
                              className="action-btn view-btn"
                              onClick={() => handleViewRequestDetail(request)}
                              title="查看详情"
                            >
                              👁️
                            </button>
                            <button 
                              className="action-btn edit-btn"
                              onClick={() => handleEditRequest(request)}
                              title="编辑请求"
                            >
                              ✏️
                            </button>
                            <button 
                              className={`action-btn ${request.status === 'frozen' ? 'unfreeze-btn' : 'freeze-btn'}`}
                              onClick={() => handleFreezeRequest(request)}
                              title={request.status === 'frozen' ? '解冻请求' : '冻结请求'}
                            >
                              {request.status === 'frozen' ? '🔓' : '❄️'}
                            </button>
                            <button 
                              className="action-btn delete-btn"
                              onClick={() => handleDeleteRequest(request)}
                              title="删除请求"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="request-details">
                        <p className="request-description">{request.description}</p>
                        <div className="request-meta">
                          <span className="meta-item">
                            <strong>{t('common.urgency') || '紧急程度'}:</strong> 
                            {t(DataService.getUrgencyById(request.urgency).name)}
                          </span>
                          <span className="meta-item">
                            <strong>{t('common.location') || '地点'}:</strong> 
                            {request.location?.address || request.location || '待确定'}
                          </span>
                          <span className="meta-item">
                            <strong>{t('common.createdAt') || '创建时间'}:</strong> 
                            {DataService.getTimeAgo(request.createdAt, t)}
                          </span>
                          {request.status === 'frozen' && request.frozenAt && (
                            <span className="meta-item frozen-info">
                              <strong>冻结时间:</strong> 
                              {DataService.getTimeAgo(request.frozenAt, t)}
                            </span>
                          )}
                        </div>
                        {request.volunteer && (
                          <div className="volunteer-info">
                            <strong>{t('common.volunteer') || '志愿者'}:</strong> {request.volunteer}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <h3>{t('admin.categories.noRequests') || '暂无请求'}</h3>
                  <p>{t('admin.categories.noRequestsDesc') || '该类别下还没有任何请求'}</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeRequestModal}>
                {t('common.close') || '关闭'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 请求详情模态框 */}
      {showRequestDetail && selectedRequest && (
        <div className="modal-overlay" onClick={closeRequestDetail}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>请求详情</h3>
              <button className="modal-close" onClick={closeRequestDetail}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h4>基本信息</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>标题:</label>
                    <span>{selectedRequest.title}</span>
                  </div>
                  <div className="detail-item">
                    <label>状态:</label>
                    <span className={`status-badge ${selectedRequest.status}`}>
                      {selectedRequest.status === 'frozen' ? '已冻结' : t(DataService.getStatusById(selectedRequest.status).name)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>紧急程度:</label>
                    <span>{t(DataService.getUrgencyById(selectedRequest.urgency).name)}</span>
                  </div>
                  <div className="detail-item">
                    <label>类别:</label>
                    <span>{selectedCategory ? getCategoryDisplayName(selectedCategory) : '未知'}</span>
                  </div>
                  <div className="detail-item">
                    <label>地点:</label>
                    <span>{selectedRequest.location?.address || selectedRequest.location || '待确定'}</span>
                  </div>
                  <div className="detail-item">
                    <label>创建时间:</label>
                    <span>{new Date(selectedRequest.createdAt).toLocaleString('zh-CN')}</span>
                  </div>
                  {selectedRequest.updatedAt && (
                    <div className="detail-item">
                      <label>更新时间:</label>
                      <span>{new Date(selectedRequest.updatedAt).toLocaleString('zh-CN')}</span>
                    </div>
                  )}
                  {selectedRequest.status === 'frozen' && selectedRequest.frozenAt && (
                    <div className="detail-item">
                      <label>冻结时间:</label>
                      <span>{new Date(selectedRequest.frozenAt).toLocaleString('zh-CN')}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="detail-section">
                <h4>详细描述</h4>
                <p className="request-description-full">{selectedRequest.description}</p>
              </div>

              {/* 已分配志愿者信息 */}
              {(selectedRequest.status === 'matched' || selectedRequest.status === 'completed') && 
               selectedRequest.assignedVolunteers && 
               selectedRequest.assignedVolunteers.length > 0 && (
                <div className="detail-section">
                  <h4>已分配志愿者 ({selectedRequest.assignedVolunteers.length}人)</h4>
                  {selectedRequest.assignedVolunteers.map((volunteer, index) => (
                    <div key={index} className="volunteer-card" style={{ 
                      marginBottom: '10px', 
                      padding: '12px', 
                      border: '1px solid #e0e0e0', 
                      borderRadius: '6px',
                      backgroundColor: '#f9f9f9'
                    }}>
                      <div className="detail-grid">
                        <div className="detail-item">
                          <label>姓名:</label>
                          <span>{volunteer.name || '未知'}</span>
                        </div>
                        <div className="detail-item">
                          <label>邮箱:</label>
                          <span>{volunteer.email || '未提供'}</span>
                        </div>
                        <div className="detail-item">
                          <label>电话:</label>
                          <span>{volunteer.phone || '未提供'}</span>
                        </div>
                        <div className="detail-item">
                          <label>分配时间:</label>
                          <span>{volunteer.assignedAt ? new Date(volunteer.assignedAt).toLocaleString('zh-CN') : '未知'}</span>
                        </div>
                        {volunteer.completedAt && (
                          <div className="detail-item">
                            <label>完成时间:</label>
                            <span>{new Date(volunteer.completedAt).toLocaleString('zh-CN')}</span>
                          </div>
                        )}
                        {volunteer.rating && (
                          <div className="detail-item">
                            <label>评分:</label>
                            <span>{'⭐'.repeat(volunteer.rating)}</span>
                          </div>
                        )}
                        {volunteer.feedback && (
                          <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                            <label>反馈:</label>
                            <span>{volunteer.feedback}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="detail-section">
                <h4>申请人信息</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>姓名:</label>
                    <span>{selectedRequest.requesterName || '未知'}</span>
                  </div>
                  <div className="detail-item">
                    <label>邮箱:</label>
                    <span>{selectedRequest.requesterEmail || '未提供'}</span>
                  </div>
                  <div className="detail-item">
                    <label>电话:</label>
                    <span>{selectedRequest.requesterPhone || '未提供'}</span>
                  </div>
                  <div className="detail-item">
                    <label>地址:</label>
                    <span>{selectedRequest.requesterAddress || '未提供'}</span>
                  </div>
                  <div className="detail-item">
                    <label>首选联系方式:</label>
                    <span>
                      {selectedRequest.contactMethod === 'phone' && '电话'}
                      {selectedRequest.contactMethod === 'email' && '邮箱'}
                      {selectedRequest.contactMethod === 'both' && '电话和邮箱'}
                      {!selectedRequest.contactMethod && '未设置'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeRequestDetail}>
                关闭
              </button>
              <button className="btn btn-primary" onClick={() => {
                closeRequestDetail();
                handleEditRequest(selectedRequest);
              }}>
                编辑请求
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑请求模态框 */}
      {showEditModal && editingRequest && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>编辑请求</h3>
              <button className="modal-close" onClick={closeEditModal}>×</button>
            </div>
            <div className="modal-body">
              <form className="edit-form">
                <div className="form-group">
                  <label>请求标题</label>
                  <input
                    type="text"
                    value={editingRequest.title}
                    onChange={(e) => setEditingRequest({
                      ...editingRequest,
                      title: e.target.value
                    })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>详细描述</label>
                  <textarea
                    value={editingRequest.description}
                    onChange={(e) => setEditingRequest({
                      ...editingRequest,
                      description: e.target.value
                    })}
                    className="form-textarea"
                    rows={4}
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>紧急程度</label>
                    <select
                      value={editingRequest.urgency}
                      onChange={(e) => setEditingRequest({
                        ...editingRequest,
                        urgency: e.target.value
                      })}
                      className="form-select"
                    >
                      <option value="low">低</option>
                      <option value="medium">中</option>
                      <option value="high">高</option>
                      <option value="urgent">紧急</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>状态</label>
                    <select
                      value={editingRequest.status}
                      onChange={(e) => setEditingRequest({
                        ...editingRequest,
                        status: e.target.value
                      })}
                      className="form-select"
                    >
                      <option value="pending">待处理</option>
                      <option value="matched">已匹配</option>
                      <option value="completed">已完成</option>
                      <option value="cancelled">已取消</option>
                      <option value="frozen">已冻结</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>服务地点</label>
                  <input
                    type="text"
                    value={editingRequest.location?.address || editingRequest.location || ''}
                    onChange={(e) => setEditingRequest({
                      ...editingRequest,
                      location: e.target.value
                    })}
                    className="form-input"
                  />
                </div>

                {editingRequest.status === 'matched' && (
                  <div className="form-group">
                    <label>志愿者</label>
                    <input
                      type="text"
                      value={editingRequest.volunteer || ''}
                      onChange={(e) => setEditingRequest({
                        ...editingRequest,
                        volunteer: e.target.value
                      })}
                      className="form-input"
                    />
                  </div>
                )}
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeEditModal}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleSaveEditedRequest}>
                保存更改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;