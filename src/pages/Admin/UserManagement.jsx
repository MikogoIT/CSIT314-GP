// 用户管理页面 - 仅 System Admin 可访问
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Navbar from '../../components/Layout/Navbar';
import apiService from '../../services/apiService';
import { isSystemAdmin } from '../../utils/permissions';
import '../../styles/user-management.css';

const UserManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetail, setShowUserDetail] = useState(false);

  // 权限检查 - 只有 System Admin 可以访问
  useEffect(() => {
    if (!isSystemAdmin(user)) {
      alert(t('permission.denied') || 'Access Denied: System Admin only');
      navigate('/admin/dashboard');
    }
  }, [user, navigate, t]);

  // 格式化日期的辅助函数
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('zh-CN');
    } catch (error) {
      return 'N/A';
    }
  };

  const handleGoBack = () => {
    navigate(-1); // 返回上一页
  };

  // 加载用户数据
  useEffect(() => {
    loadUsers();
  }, []);

  // 过滤用户
  useEffect(() => {
    let filtered = users;
    
    // 按用户类型过滤
    if (filterType !== 'all') {
      filtered = filtered.filter(user => user.userType === filterType);
    }
    
    // 按搜索词过滤
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredUsers(filtered);
  }, [users, filterType, searchTerm]);

  // 获取用户的请求数量
  const getUserRequestCount = (userId, userEmail) => {
    const allRequests = JSON.parse(localStorage.getItem('userRequests') || '[]');
    return allRequests.filter(req => 
      req.requesterId === userId || 
      req.requesterEmail === userEmail
    ).length;
  };

  const loadUsers = async () => {
    try {
      // 从API获取最新的用户数据
      const apiUsers = await apiService.getAllUsers();
      
      // 转换MongoDB数据格式到前端需要的格式
      const formattedUsers = apiUsers.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        phone: user.phone,
        address: user.address,
        organization: user.organization,
        skills: user.skills,
        status: user.status,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        loginCount: user.loginCount
      }));
      
      // 过滤掉管理员用户
      const nonAdminUsers = formattedUsers.filter(u => u.userType !== 'admin');
      setUsers(nonAdminUsers);
      
      // 同时更新localStorage以保持兼容性
      localStorage.setItem('registeredUsers', JSON.stringify(nonAdminUsers));
    } catch (error) {
      console.error('加载用户数据失败:', error);
      // 如果API调用失败，回退到localStorage
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      setUsers(registeredUsers.filter(u => u.userType !== 'admin'));
    }
  };

  const handleDeleteUser = async (userId) => {
    // 首先获取要删除的用户信息
    const userToDelete = users.find(u => u.id === userId);
    
    let confirmMessage = t('admin.users.confirmDelete');
    
    if (window.confirm(confirmMessage)) {
      try {
        // 使用API删除用户（实际上是设置状态为deleted）
        await apiService.batchUpdateUsers('delete', [userId]);
        
        // 重新加载用户列表以获取最新状态
        await loadUsers();
        
        alert(t('admin.users.deleteSuccess'));
      } catch (error) {
        console.error('删除用户失败:', error);
        alert('删除用户失败，请稍后重试');
      }
    }
  };

  const handleToggleUserStatus = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'suspend';
    
    try {
      // 使用API更新用户状态
      await apiService.batchUpdateUsers(action, [userId]);
      
      // 重新加载用户列表以获取最新状态
      await loadUsers();
      
      const statusText = newStatus === 'active' ? '激活' : '暂停';
      alert(`用户已${statusText}`);
    } catch (error) {
      console.error('更新用户状态失败:', error);
      alert('更新用户状态失败，请稍后重试');
    }
  };

  const getUserTypeColor = (userType) => {
    switch (userType) {
      case 'pin': return 'user-type-pin';
      case 'csr': return 'user-type-csr';
      default: return 'user-type-default';
    }
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'status-active' : 'status-suspended';
  };

  return (
    <div className="page-container">
      <Navbar userType="admin" user={user} />
      
      <div className="main-content">
        <div className="user-management">
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
            <div className="header-content">
              <h1 className="page-title">{t('admin.users.title')}</h1>
              <p className="page-subtitle">{t('admin.users.subtitle')}</p>
            </div>
            <div className="header-stats">
              <div className="stat-item">
                <span className="stat-value">{users.length}</span>
                <span className="stat-label">{t('admin.users.totalUsers')}</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{users.filter(u => u.userType === 'pin').length}</span>
                <span className="stat-label">PIN {t('admin.users.users')}</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{users.filter(u => u.userType === 'csr').length}</span>
                <span className="stat-label">CSR {t('admin.users.users')}</span>
              </div>
            </div>
          </div>

          <div className="filters-section">
            <div className="search-box">
              <input
                type="text"
                placeholder={t('admin.users.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="filter-buttons">
              <button 
                className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
                onClick={() => setFilterType('all')}
              >
                {t('admin.users.allUsers')}
              </button>
              <button 
                className={`filter-btn ${filterType === 'pin' ? 'active' : ''}`}
                onClick={() => setFilterType('pin')}
              >
                PIN {t('admin.users.users')}
              </button>
              <button 
                className={`filter-btn ${filterType === 'csr' ? 'active' : ''}`}
                onClick={() => setFilterType('csr')}
              >
                CSR {t('admin.users.users')}
              </button>
            </div>
          </div>

          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>{t('admin.users.name')}</th>
                  <th>{t('admin.users.email')}</th>
                  <th>{t('admin.users.userType')}</th>
                  <th>{t('admin.users.status')}</th>
                  <th>{t('admin.users.requestCount')}</th>
                  <th>{t('admin.users.joinDate')}</th>
                  <th>{t('admin.users.lastLogin')}</th>
                  <th>{t('admin.users.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-details">
                          <div className="user-name">{user.name}</div>
                          <div className="user-phone">{user.phone || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {user.email}
                    </td>
                    <td>
                      <span className={`user-type-badge ${getUserTypeColor(user.userType)}`}>
                        {user.userType === 'pin' ? 'PIN' : 'CSR'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusColor(user.status || 'active')}`}>
                        {(user.status || 'active') === 'active' ? t('admin.users.active') : t('admin.users.suspended')}
                      </span>
                    </td>
                    <td>
                      <span className="request-count">
                        {getUserRequestCount(user.id, user.email)}
                      </span>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>{formatDate(user.lastLogin)}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn btn-sm btn-info"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserDetail(true);
                          }}
                        >
                          {t('admin.users.view')}
                        </button>
                        <button 
                          className={`btn btn-sm ${(user.status || 'active') === 'active' ? 'btn-warning' : 'btn-success'}`}
                          onClick={() => handleToggleUserStatus(user.id)}
                        >
                          {(user.status || 'active') === 'active' ? t('admin.users.suspend') : t('admin.users.activate')}
                        </button>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          {t('admin.users.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredUsers.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <div className="empty-title">{t('admin.users.noUsers')}</div>
                <div className="empty-description">{t('admin.users.noUsersDesc')}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 用户详情模态框 */}
      {showUserDetail && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowUserDetail(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('admin.users.userDetails')}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowUserDetail(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>{t('admin.users.name')}:</label>
                  <span>{selectedUser.name}</span>
                </div>
                <div className="detail-item">
                  <label>{t('admin.users.email')}:</label>
                  <span>{selectedUser.email}</span>
                </div>
                <div className="detail-item">
                  <label>{t('admin.users.userType')}:</label>
                  <span>{selectedUser.userType === 'pin' ? 'PIN' : 'CSR'}</span>
                </div>
                <div className="detail-item">
                  <label>{t('admin.users.phone')}:</label>
                  <span>{selectedUser.phone || 'N/A'}</span>
                </div>
                {selectedUser.userType === 'pin' && (
                  <>
                    <div className="detail-item">
                      <label>{t('admin.users.address')}:</label>
                      <span>{selectedUser.address || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <label>{t('admin.users.emergencyContact')}:</label>
                      <span>{selectedUser.emergencyContact || 'N/A'}</span>
                    </div>
                  </>
                )}
                {selectedUser.userType === 'csr' && (
                  <>
                    <div className="detail-item">
                      <label>{t('admin.users.organization')}:</label>
                      <span>{selectedUser.organization || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <label>{t('admin.users.skills')}:</label>
                      <span>{selectedUser.skills ? selectedUser.skills.join(', ') : 'N/A'}</span>
                    </div>
                  </>
                )}
                <div className="detail-item">
                  <label>{t('admin.users.status')}:</label>
                  <span className={`status-badge ${getStatusColor(selectedUser.status || 'active')}`}>
                    {(selectedUser.status || 'active') === 'active' ? t('admin.users.active') : t('admin.users.suspended')}
                  </span>
                </div>
                <div className="detail-item">
                  <label>{t('admin.users.joinDate')}:</label>
                  <span>{formatDate(selectedUser.createdAt)}</span>
                </div>
                <div className="detail-item">
                  <label>{t('admin.users.lastLogin')}:</label>
                  <span>{formatDate(selectedUser.lastLogin)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;