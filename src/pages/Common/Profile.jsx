import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Navbar from '../../components/Layout/Navbar';
import '../../styles/profile.css';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { t } = useLanguage();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    organization: '',
    emergencyContact: '',
    skills: [],
    avatar: ''
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [avatarPreview, setAvatarPreview] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        organization: user.organization || '',
        emergencyContact: user.emergencyContact || '',
        skills: user.skills || [],
        avatar: user.avatar || ''
      });
      setAvatarPreview(user.avatar || '');
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSkillsChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      skills: checked 
        ? [...prev.skills, value]
        : prev.skills.filter(skill => skill !== value)
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 检查文件大小 (最大2MB)
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ 
          type: 'error', 
          text: t('profile.avatarTooLarge') || '头像文件大小不能超过2MB' 
        });
        return;
      }

      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        setMessage({ 
          type: 'error', 
          text: t('profile.invalidImageType') || '请选择有效的图片文件' 
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        setAvatarPreview(base64);
        setFormData(prev => ({
          ...prev,
          avatar: base64
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // 这里可以调用API更新用户信息
      // 目前使用本地存储模拟
      const updatedUser = {
        ...user,
        ...formData,
        updatedAt: new Date().toISOString()
      };

      // 更新localStorage中的用户信息
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // 如果有updateProfile方法，调用它
      if (updateProfile) {
        await updateProfile(formData);
      }

      setMessage({ 
        type: 'success', 
        text: t('profile.updateSuccess') || '个人信息更新成功！' 
      });
      setIsEditing(false);
      
      // 刷新页面以更新navbar中的用户信息
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error('Profile update error:', error);
      setMessage({ 
        type: 'error', 
        text: t('profile.updateError') || '更新失败，请重试' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // 重置表单数据
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      organization: user.organization || '',
      emergencyContact: user.emergencyContact || '',
      skills: user.skills || [],
      avatar: user.avatar || ''
    });
    setAvatarPreview(user.avatar || '');
    setIsEditing(false);
    setMessage({ type: '', text: '' });
  };

  const getDefaultAvatar = () => {
    return user?.name?.charAt(0)?.toUpperCase() || 'U';
  };

  const availableSkills = [
    { value: 'medical', label: t('skills.medical') || '医疗护理' },
    { value: 'transport', label: t('skills.transport') || '交通出行' },
    { value: 'technology', label: t('skills.technology') || '技术支持' },
    { value: 'education', label: t('skills.education') || '教育培训' },
    { value: 'household', label: t('skills.household') || '家务服务' },
    { value: 'companion', label: t('skills.companion') || '陪伴关怀' }
  ];

  return (
    <div className="page-container">
      <Navbar userType={user?.userType} user={user} />
      
      <div className="main-content">
        <div className="profile-container">
          <div className="profile-header">
            <div className="profile-avatar-section">
              <div className="avatar-container">
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="Avatar" 
                    className="profile-avatar-image"
                  />
                ) : (
                  <div className="profile-avatar-placeholder">
                    {getDefaultAvatar()}
                  </div>
                )}
                {isEditing && (
                  <div className="avatar-upload">
                    <input
                      type="file"
                      id="avatar-upload"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="avatar-input"
                    />
                    <label htmlFor="avatar-upload" className="avatar-upload-btn">
                      <span className="upload-icon">📷</span>
                      {t('profile.changeAvatar') || '更换头像'}
                    </label>
                  </div>
                )}
              </div>
            </div>
            
            <div className="profile-info">
              <h1 className="profile-name">{user?.name || t('profile.noName')}</h1>
              <div className="profile-role">
                <span className={`role-badge role-${user?.userType}`}>
                  {user?.userType?.toUpperCase() || 'USER'}
                </span>
              </div>
              <div className="profile-actions">
                {!isEditing ? (
                  <button 
                    className="btn btn-primary"
                    onClick={() => setIsEditing(true)}
                  >
                    <span className="btn-icon">✏️</span>
                    {t('profile.editProfile') || '编辑资料'}
                  </button>
                ) : (
                  <div className="edit-actions">
                    <button 
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleCancel}
                      disabled={isLoading}
                    >
                      {t('common.cancel') || '取消'}
                    </button>
                    <button 
                      type="submit"
                      form="profile-form"
                      className="btn btn-primary"
                      disabled={isLoading}
                    >
                      {isLoading && <span className="loading-spinner"></span>}
                      {t('common.save') || '保存'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {message.text && (
            <div className={`alert alert-${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="profile-content">
            <form id="profile-form" onSubmit={handleSubmit} className="profile-form">
              {/* 基本信息 */}
              <div className="form-section">
                <h3 className="section-title">
                  <span className="section-icon">👤</span>
                  {t('profile.basicInfo') || '基本信息'}
                </h3>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">
                      {t('profile.name') || '姓名'}
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="form-input"
                      disabled={!isEditing}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {t('profile.email') || '邮箱'}
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="form-input"
                      disabled={true} // 邮箱通常不允许修改
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {t('profile.phone') || '电话'}
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="form-input"
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="form-group form-group-full">
                    <label className="form-label">
                      {t('profile.address') || '地址'}
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="form-input"
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>

              {/* 用户类型特定信息 */}
              {user?.userType === 'pin' && (
                <div className="form-section">
                  <h3 className="section-title">
                    <span className="section-icon">🆘</span>
                    {t('profile.emergencyInfo') || '紧急联系信息'}
                  </h3>
                  
                  <div className="form-group">
                    <label className="form-label">
                      {t('profile.emergencyContact') || '紧急联系人'}
                    </label>
                    <input
                      type="text"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                      className="form-input"
                      disabled={!isEditing}
                      placeholder={t('profile.emergencyContactPlaceholder') || '姓名和电话'}
                    />
                  </div>
                </div>
              )}

              {user?.userType === 'csr' && (
                <>
                  <div className="form-section">
                    <h3 className="section-title">
                      <span className="section-icon">🏢</span>
                      {t('profile.workInfo') || '工作信息'}
                    </h3>
                    
                    <div className="form-group">
                      <label className="form-label">
                        {t('profile.organization') || '所属机构'}
                      </label>
                      <input
                        type="text"
                        name="organization"
                        value={formData.organization}
                        onChange={handleInputChange}
                        className="form-input"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="form-section">
                    <h3 className="section-title">
                      <span className="section-icon">🛠️</span>
                      {t('profile.skills') || '技能专长'}
                    </h3>
                    
                    <div className="skills-grid">
                      {availableSkills.map(skill => (
                        <label key={skill.value} className="skill-checkbox">
                          <input
                            type="checkbox"
                            value={skill.value}
                            checked={formData.skills.includes(skill.value)}
                            onChange={handleSkillsChange}
                            disabled={!isEditing}
                          />
                          <span className="skill-label">{skill.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* 账户信息 */}
              <div className="form-section">
                <h3 className="section-title">
                  <span className="section-icon">ℹ️</span>
                  {t('profile.accountInfo') || '账户信息'}
                </h3>
                
                <div className="info-grid">
                  <div className="info-item">
                    <label>{t('profile.userType') || '用户类型'}:</label>
                    <span className={`user-type-badge ${user?.userType}`}>
                      {user?.userType?.toUpperCase() || 'N/A'}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>{t('profile.joinDate') || '注册时间'}:</label>
                    <span>
                      {user?.createdAt ? 
                        new Date(user.createdAt).toLocaleDateString('zh-CN') : 
                        'N/A'
                      }
                    </span>
                  </div>
                  <div className="info-item">
                    <label>{t('profile.lastUpdate') || '最后更新'}:</label>
                    <span>
                      {user?.updatedAt ? 
                        new Date(user.updatedAt).toLocaleDateString('zh-CN') : 
                        'N/A'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;