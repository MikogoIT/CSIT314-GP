// 8. 管理员仪表板
// src/pages/Admin/Dashboard.jsx
import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const AdminDashboard = () => {
  const { t } = useLanguage();
  return (
    <div className="admin-dashboard">
      <h1>{t('admin.dashboard.title')}</h1>
      
      <div className="admin-tabs">
        <button>{t('admin.dashboard.userManagement')}</button>
        <button>{t('admin.dashboard.serviceCategories')}</button>
        <button>{t('admin.dashboard.dataReports')}</button>
      </div>
      
      {/* 动态内容区域 */}
      <div className="admin-content">
        {/* 根据选中的标签显示不同内容 */}
      </div>
    </div>
  );
};
