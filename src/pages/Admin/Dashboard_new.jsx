// Dashboard_new.jsx - 重新设计的现代化管理员仪表板
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { DataService } from '../../services/dataService';
import Navbar from '../../components/Layout/Navbar';
import '../../styles/modern-dashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [dashboardData, setDashboardData] = useState({
    stats: [],
    activities: []
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  useEffect(() => {
    // 加载仪表板数据
    const loadDashboardData = async () => {
      try {
        // 清空缓存，确保获取最新数据
        DataService.clearCache();
        
        // 初始化示例数据
        await DataService.initializeData();
        
        const statistics = await DataService.getStatistics();
        const users = await DataService.getUsers();
        const requests = await DataService.getRequests();
        
        // 计算本月新增
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const thisMonthUsers = (users || []).filter(user => {
          const userDate = new Date(user.registeredAt || user.createdAt || Date.now());
          return userDate.getMonth() === currentMonth && userDate.getFullYear() === currentYear;
        });
        
        const thisMonthRequests = (requests || []).filter(request => {
          const requestDate = new Date(request.createdAt || Date.now());
          return requestDate.getMonth() === currentMonth && requestDate.getFullYear() === currentYear;
        });
        
        // 今日匹配
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayMatched = (requests || []).filter(request => {
          if (request.status !== 'matched') return false;
          const matchDate = new Date(request.matchedAt || request.updatedAt || request.createdAt);
          matchDate.setHours(0, 0, 0, 0);
          return matchDate.getTime() === today.getTime();
        });
        
        const pendingRequests = (requests || []).filter(r => r.status === 'pending');
        
        const stats = [
          { 
            title: t('admin.dashboard.totalUsers'), 
            value: (users || []).length.toString(), 
            change: `+${thisMonthUsers.length}`, 
            trend: thisMonthUsers.length > 0 ? 'up' : 'neutral', 
            icon: '👥', 
            color: 'primary' 
          },
          { 
            title: t('admin.dashboard.activeRequests'), 
            value: (requests || []).filter(r => r.status === 'pending' || r.status === 'matched').length.toString(), 
            change: `+${thisMonthRequests.length}`, 
            trend: thisMonthRequests.length > 0 ? 'up' : 'neutral', 
            icon: '📋', 
            color: 'secondary' 
          },
          { 
            title: t('admin.dashboard.todayMatches'), 
            value: todayMatched.length.toString(), 
            change: `+${todayMatched.length}`, 
            trend: todayMatched.length > 0 ? 'up' : 'neutral', 
            icon: '✅', 
            color: 'success' 
          },
          { 
            title: t('admin.dashboard.pendingReview'), 
            value: pendingRequests.length.toString(), 
            change: `${pendingRequests.length > 5 ? '+' : ''}${pendingRequests.length}`, 
            trend: pendingRequests.length > 5 ? 'up' : pendingRequests.length > 0 ? 'neutral' : 'down', 
            icon: '⏳', 
            color: 'warning' 
          }
        ];
        
        // 最近活动
        const activities = [];
        
        // 最近的新用户
        const recentUsers = (users || [])
          .sort((a, b) => new Date(b.registeredAt || b.createdAt || 0) - new Date(a.registeredAt || a.createdAt || 0))
          .slice(0, 3);
        
        recentUsers.forEach(user => {
          activities.push({
            icon: '👤',
            content: `${t('common.newUser')} - ${user.name}`,
            time: DataService.getTimeAgo(user.registeredAt || user.createdAt, t)
          });
        });
        
        // 最近的请求
        const recentRequests = requests
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
          .slice(0, 2);
        
        // 获取所有分类以便后续查找
        const allCategories = await DataService.getCategories();
        
        recentRequests.forEach(request => {
          const icon = request.status === 'matched' ? '✅' : '📋';
          const category = (allCategories || []).find(cat => cat.id === request.category);
          const categoryName = category ? t(category.name) : request.category;
          const content = request.status === 'matched' 
            ? `${categoryName}${t('common.requestMatched')}`
            : `${t('common.newRequest')} - ${categoryName}`;
          
          activities.push({
            icon,
            content,
            time: DataService.getTimeAgo(request.createdAt, t)
          });
        });
        
        setDashboardData({ stats, activities });
        setLastUpdated(new Date());
      } catch (error) {
        console.error('加载仪表板数据失败:', error);
        setDashboardData({
          stats: [
            { title: t('admin.dashboard.totalUsers'), value: '0', change: '+0', trend: 'neutral', icon: '👥', color: 'primary' },
            { title: t('admin.dashboard.activeRequests'), value: '0', change: '+0', trend: 'neutral', icon: '📋', color: 'secondary' },
            { title: t('admin.dashboard.todayMatches'), value: '0', change: '+0', trend: 'neutral', icon: '✅', color: 'success' },
            { title: t('admin.dashboard.pendingReview'), value: '0', change: '+0', trend: 'neutral', icon: '⏳', color: 'warning' }
          ],
          activities: []
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
    
    // 定时刷新
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [t]);

  const quickActions = [
    { title: t('admin.dashboard.userManagement'), icon: '👥', path: '/admin/users', color: 'blue' },
    { title: t('admin.dashboard.serviceCategories'), icon: '📁', path: '/admin/categories', color: 'green' },
    { title: t('admin.dashboard.dataReports'), icon: '📊', path: '/admin/reports', color: 'purple' },
    { title: t('admin.dashboard.systemSettings'), icon: '⚙️', path: '/admin/settings', color: 'gray' }
  ];

  return (
    <div className="modern-admin-container">
      <Navbar userType="admin" user={user} />
      
      <div className="modern-main-content">
        {/* 现代化页面标题 */}
        <div className="modern-dashboard-header">
          <div className="header-background">
            <div className="header-content">
              <div className="header-main">
                <div className="header-avatar">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="User Avatar" className="avatar-image" />
                  ) : (
                    <div className="avatar-icon">{user?.name?.charAt(0)?.toUpperCase() || '👨‍💼'}</div>
                  )}
                  <div className="avatar-status"></div>
                </div>
                <div className="header-text">
                  <h1 className="modern-dashboard-title">
                    {t('admin.dashboard.title')}
                  </h1>
                  <p className="welcome-text">
                    {t('admin.dashboard.welcome') || '欢迎回来'}, <span className="user-name">{user?.name}</span>
                  </p>
                  <div className="dashboard-subtitle">
                    {t('admin.dashboard.description') || '系统管理与数据监控中心'}
                  </div>
                </div>
              </div>
              
              <div className="header-status">
                {lastUpdated && (
                  <div className="update-indicator">
                    <span className="update-icon">🔄</span>
                    <span className="update-text">
                      {t('time.updatedAt') || '更新于'}: {lastUpdated.toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 现代化操作按钮区域 */}
        <div className="dashboard-actions-card">
          <div className="actions-container">
            <button 
              className="modern-action-btn refresh-btn"
              onClick={() => {
                setLoading(true);
                setTimeout(() => {
                  window.location.reload();
                }, 500);
              }}
              disabled={loading}
            >
              <span className="btn-icon">{loading ? '⏳' : '🔄'}</span>
              <span className="btn-text">
                {loading ? (t('common.refreshing') || '刷新中') : (t('admin.dashboard.refreshData') || '刷新数据')}
              </span>
            </button>
            
            <button 
              className="modern-action-btn export-btn"
              onClick={async () => {
                try {
                  const statistics = await DataService.getStatistics();
                  const users = await DataService.getUsers();
                  const requests = await DataService.getRequests();
                  
                  const report = {
                    title: 'System Report',
                    generatedAt: new Date().toISOString(),
                    statistics,
                    summary: {
                      totalUsers: (users || []).length,
                      totalRequests: (requests || []).length,
                      activeRequests: (requests || []).filter(r => r.status === 'pending' || r.status === 'matched').length,
                      matchedRequests: (requests || []).filter(r => r.status === 'matched').length
                    }
                  };
                  
                  const dataStr = JSON.stringify(report, null, 2);
                  const dataBlob = new Blob([dataStr], { type: 'application/json' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(dataBlob);
                  link.download = `system_report_${new Date().toISOString().split('T')[0]}.json`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  
                  alert(t('admin.dashboard.reportGenerated') || '报告已生成');
                } catch (error) {
                  console.error('生成报告失败:', error);
                  alert(t('admin.dashboard.reportError') || '生成报告失败');
                }
              }}
            >
              <span className="btn-icon">📊</span>
              <span className="btn-text">{t('admin.dashboard.generateReport') || '生成报告'}</span>
            </button>
          </div>
        </div>

        {/* 现代化统计卡片 */}
        <div className="modern-stats-section">
          <div className="stats-grid">
            {loading ? (
              // 加载状态
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="modern-stat-card loading">
                  <div className="stat-content">
                    <div className="stat-icon loading-icon">⏳</div>
                    <div className="stat-info">
                      <div className="stat-title">{t('common.loading') || '加载中'}</div>
                      <div className="stat-value">--</div>
                      <div className="stat-change">-- --</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              dashboardData.stats.map((stat, index) => (
                <div key={index} className={`modern-stat-card ${stat.color}`}>
                  <div className="stat-content">
                    <div className={`stat-icon ${stat.color}`}>
                      {stat.icon}
                    </div>
                    <div className="stat-info">
                      <div className="stat-title">{stat.title}</div>
                      <div className="stat-value">{stat.value}</div>
                      <div className={`stat-change ${stat.trend}`}>
                        {stat.trend === 'up' ? '↗' : stat.trend === 'down' ? '↘' : '→'} 
                        {stat.change} {t('admin.dashboard.thisMonth') || '本月'}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 现代化内容网格 */}
        <div className="modern-content-section">
          <div className="content-grid">
            {/* 快速操作卡片 */}
            <div className="modern-card">
              <div className="card-header">
                <div className="card-title-section">
                  <span className="card-icon">⚡</span>
                  <h3 className="card-title">{t('admin.dashboard.quickActions') || '快速操作'}</h3>
                </div>
              </div>
              <div className="card-body">
                <div className="modern-actions-grid">
                  {quickActions.map((action, index) => (
                    <Link key={index} to={action.path} className={`modern-action-card ${action.color}`}>
                      <div className="action-content">
                        <div className={`action-icon ${action.color}`}>
                          {action.icon}
                        </div>
                        <div className="action-title">{action.title}</div>
                        <div className="action-arrow">→</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* 最近活动卡片 */}
            <div className="modern-card">
              <div className="card-header">
                <div className="card-title-section">
                  <span className="card-icon">📈</span>
                  <h3 className="card-title">{t('admin.dashboard.recentActivity') || '最近活动'}</h3>
                </div>
              </div>
              <div className="card-body">
                {loading ? (
                  <div className="activity-loading">
                    <div className="loading-spinner">⏳</div>
                    <p>{t('common.loading') || '加载中'}</p>
                  </div>
                ) : dashboardData.activities.length > 0 ? (
                  <div className="modern-activity-list">
                    {dashboardData.activities.map((activity, index) => (
                      <div key={index} className="modern-activity-item">
                        <div className="activity-icon">{activity.icon}</div>
                        <div className="activity-content">
                          <p className="activity-text">{activity.content}</p>
                          <span className="activity-time">{activity.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-activity">
                    <div className="no-activity-icon">📊</div>
                    <p>{t('admin.dashboard.noRecentActivity') || '暂无最近活动'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;