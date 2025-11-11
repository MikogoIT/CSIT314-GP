// Reports.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReportService } from '../../services/reportService';
import { useLanguage } from '../../context/LanguageContext';
import '../../styles/reports.css';

const Reports = () => {
  const navigate = useNavigate();
  const { currentLanguage, t } = useLanguage();

  const handleGoBack = () => {
    navigate(-1); // 返回上一页
  };

  const [reportType, setReportType] = useState('weekly');
  const [reportData, setReportData] = useState(null);
  const [reportDate, setReportDate] = useState(getDefaultDateForType('weekly'));
  const [loading, setLoading] = useState(false);

  // 格式化日期范围显示
  function formatDateRangeDisplay(dateRange, type) {
    if (!dateRange) return '';
    
    const [startStr, endStr] = dateRange.split(' - ');
    const startDate = new Date(startStr);
    const endDate = new Date(endStr);
    
    const formatOptions = { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    };
    
    switch (type) {
      case 'daily':
        return startDate.toLocaleDateString('zh-CN', formatOptions);
      case 'weekly':
        return `${startDate.toLocaleDateString('zh-CN', formatOptions)} - ${endDate.toLocaleDateString('zh-CN', formatOptions)} (第${Math.ceil((startDate.getTime() - new Date(startDate.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}周)`;
      case 'monthly':
        return `${startDate.getFullYear()}年${(startDate.getMonth() + 1).toString().padStart(2, '0')}月`;
      default:
        return dateRange;
    }
  }

  // 根据报告类型获取默认日期格式
  function getDefaultDateForType(type) {
    const now = new Date();
    switch (type) {
      case 'daily':
        return now.toISOString().split('T')[0]; // YYYY-MM-DD
      case 'weekly':
        // 获取当前周的格式 YYYY-W##
        const year = now.getFullYear();
        const firstDay = new Date(year, 0, 1);
        const days = Math.ceil((now - firstDay) / (24 * 60 * 60 * 1000));
        const week = Math.ceil(days / 7);
        return `${year}-W${week.toString().padStart(2, '0')}`;
      case 'monthly':
        return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`; // YYYY-MM
      default:
        return now.toISOString().split('T')[0];
    }
  }

  // 处理报告类型改变
  const handleReportTypeChange = (newType) => {
    setReportType(newType);
    setReportDate(getDefaultDateForType(newType));
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      let targetDate;
      
      switch (reportType) {
        case 'daily':
          targetDate = new Date(reportDate);
          break;
        case 'weekly':
          // 解析周格式 YYYY-W##
          if (reportDate.includes('-W')) {
            const [year, week] = reportDate.split('-W');
            const firstDayOfYear = new Date(year, 0, 1);
            const daysToAdd = (parseInt(week) - 1) * 7;
            targetDate = new Date(firstDayOfYear.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
          } else {
            targetDate = new Date(reportDate);
          }
          break;
        case 'monthly':
          // 解析月格式 YYYY-MM
          if (reportDate.includes('-') && reportDate.length === 7) {
            const [year, month] = reportDate.split('-');
            targetDate = new Date(parseInt(year), parseInt(month) - 1, 15); // 月中
          } else {
            targetDate = new Date(reportDate);
          }
          break;
        default:
          targetDate = new Date(reportDate);
      }
      
      const report = await ReportService.generateComprehensiveReport(reportType, targetDate);
      setReportData(report);
    } catch (error) {
      console.error('生成报告失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    if (reportData) {
      try {
        // 直接下载当前的报告数据
        ReportService.exportReport(reportData, 'system_report');
      } catch (error) {
        console.error('下载报告失败:', error);
        alert('下载报告失败，请重试');
      }
    }
  };

  // 页面加载时生成默认报告
  useEffect(() => {
    generateReport();
  }, []);

  // 当报告类型或日期改变时自动重新生成报告
  useEffect(() => {
    if (reportData) { // 只有在已经有报告数据时才自动重新生成
      generateReport();
    }
  }, [reportType, reportDate]);

  return (
    <div className="admin-page">
      <div className="modern-page-header">
        <div className="header-nav">
          <button 
            className="modern-back-btn"
            onClick={handleGoBack}
            title={t('common.back') || '返回'}
          >
            <span className="back-icon">←</span>
            <span className="back-text">{t('common.back') || '返回'}</span>
          </button>
        </div>
        
        <div className="header-content">
          <div className="header-main">
            <div className="header-icon">📊</div>
            <div className="header-text">
              <h1 className="modern-title">
                {t.reports || '数据报告'}
              </h1>
              <div className="report-type-badge">
                {reportType === 'daily' ? (t.dailyReport || '日报') :
                 reportType === 'weekly' ? (t.weeklyReport || '周报') :
                 (t.monthlyReport || '月报')}
              </div>
            </div>
          </div>
          <p className="modern-subtitle">{t.systemDataAnalysis || '系统运行数据统计与分析'}</p>
        </div>
      </div>

      <div className="report-config-card">
        <div className="config-header">
          <div className="config-title">
            <span className="config-icon">⚙️</span>
            <h3>{t.reportConfiguration || '报告配置'}</h3>
          </div>
          <div className="config-description">
            {t.configDescription || '选择报告类型和时间范围来生成详细的数据分析报告'}
          </div>
        </div>
        
        <div className="config-body">
          <div className="config-section">
            <div className="config-grid">
              <div className="config-item">
                <div className="item-header">
                  <span className="item-icon">📋</span>
                  <label className="item-label">{t.reportType || '报告类型'}</label>
                </div>
                <select 
                  className="config-select"
                  value={reportType} 
                  onChange={(e) => handleReportTypeChange(e.target.value)}
                >
                  <option value="daily">{t.dailyReport || '日报'}</option>
                  <option value="weekly">{t.weeklyReport || '周报'}</option>
                  <option value="monthly">{t.monthlyReport || '月报'}</option>
                </select>
              </div>

              <div className="config-item">
                <div className="item-header">
                  <span className="item-icon">📅</span>
                  <label className="item-label">
                    {reportType === 'daily' ? (t.selectDate || '选择日期') :
                     reportType === 'weekly' ? (t.selectWeek || '选择周') :
                     (t.selectMonth || '选择月份')}
                  </label>
                </div>
                <div className="date-input-container">
                  {reportType === 'daily' && (
                    <input 
                      type="date" 
                      className="config-input" 
                      value={reportDate}
                      onChange={(e) => setReportDate(e.target.value)}
                    />
                  )}
                  {reportType === 'weekly' && (
                    <>
                      <input 
                        type="week" 
                        className="config-input" 
                        value={reportDate}
                        onChange={(e) => setReportDate(e.target.value)}
                      />
                      <small className="input-help">
                        {t.weekHelp || '选择要查看的周'}
                      </small>
                    </>
                  )}
                  {reportType === 'monthly' && (
                    <>
                      <input 
                        type="month" 
                        className="config-input" 
                        value={reportDate}
                        onChange={(e) => setReportDate(e.target.value)}
                      />
                      <small className="input-help">
                        {t.monthHelp || '选择要查看的月份'}
                      </small>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="config-actions">
            <button 
              className="btn-generate"
              onClick={generateReport}
              disabled={loading}
            >
              <span className="btn-icon">
                {loading ? '⏳' : '📊'}
              </span>
              <span className="btn-text">
                {loading ? (t.generating || '生成中...') : (t.generateReport || '生成报告')}
              </span>
            </button>
            
            {reportData && (
              <button 
                className="btn-download"
                onClick={downloadReport}
              >
                <span className="btn-icon">💾</span>
                <span className="btn-text">{t.downloadReport || '下载报告'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {reportData && (
        <>
          <div className="card">
            <div className="card-body">
              <div className="report-info">
                <div className="report-period">
                  <strong>{t.reportPeriod || '报告周期'}:</strong> {formatDateRangeDisplay(reportData.dateRange, reportType)}
                </div>
                <div className="report-generated">
                  <strong>{t.generatedAt || '生成时间'}:</strong> {new Date().toLocaleString()}
                </div>
              </div>
            </div>
          </div>
          
          <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-header">
              <div className="stat-info">
                <div className="stat-title">{t.totalMatches || '总匹配数'}</div>
                <div className="stat-value">{reportData.totalMatches}</div>
              </div>
              <div className="stat-icon primary">🤝</div>
            </div>
            <div className={`stat-change ${reportData.trends.matchGrowth >= 0 ? 'up' : 'down'}`}>
              {reportData.trends.matchGrowth >= 0 ? '↗' : '↘'} 
              {reportType === 'daily' ? (t.dailyGrowth || '较昨日') : 
               reportType === 'weekly' ? (t.weeklyGrowth || '较上周') : 
               (t.monthlyGrowth || '较上月')} 
              {reportData.trends.matchGrowth >= 0 ? (t.growth || '增长') : (t.decrease || '下降')} {Math.abs(reportData.trends.matchGrowth)}%
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-header">
              <div className="stat-info">
                <div className="stat-title">{t.newUsers || '新注册用户'}</div>
                <div className="stat-value">{reportData.newUsers}</div>
              </div>
              <div className="stat-icon success">👥</div>
            </div>
            <div className={`stat-change ${reportData.trends.userGrowth >= 0 ? 'up' : 'down'}`}>
              {reportData.trends.userGrowth >= 0 ? '↗' : '↘'} 
              {reportType === 'daily' ? (t.dailyGrowth || '较昨日') : 
               reportType === 'weekly' ? (t.weeklyGrowth || '较上周') : 
               (t.monthlyGrowth || '较上月')} 
              {reportData.trends.userGrowth >= 0 ? (t.growth || '增长') : (t.decrease || '下降')} {Math.abs(reportData.trends.userGrowth)}%
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-header">
              <div className="stat-info">
                <div className="stat-title">{t.activeRequests || '活跃请求'}</div>
                <div className="stat-value">{reportData.activeRequests}</div>
              </div>
              <div className="stat-icon warning">📋</div>
            </div>
            <div className="stat-change neutral">
              {t.currentActive || '当前活跃'}
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-header">
              <div className="stat-info">
                <div className="stat-title">{t.completionRate || '完成率'}</div>
                <div className="stat-value">{reportData.completionRate}</div>
              </div>
              <div className="stat-icon info">✅</div>
            </div>
            <div className="stat-change neutral">
              {t.periodCompletion || '周期完成率'}
            </div>
          </div>
        </div>
        </>
      )}

      {reportData && reportData.details && (
        <>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">{t.categoryBreakdown || '分类统计'}</h3>
            </div>
            <div className="card-body">
              <div className="category-stats">
                {Object.entries(reportData.details.categoryBreakdown).map(([categoryId, data]) => (
                  <div key={categoryId} className="category-stat-item">
                    <div className="category-info">
                      <span className="category-name">{data.name}</span>
                      <span className="category-count">{data.count} {t.requests || '请求'}</span>
                    </div>
                    <div className="category-progress">
                      <div 
                        className="progress-bar"
                        style={{ 
                          width: `${data.count > 0 ? (data.matched / data.count) * 100 : 0}%`
                        }}
                      ></div>
                    </div>
                    <span className="match-rate">
                      {data.count > 0 ? Math.round((data.matched / data.count) * 100) : 0}% {t.matched || '已匹配'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {reportData.details.topPerformers && reportData.details.topPerformers.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">{t.topPerformers || '优秀志愿者'}</h3>
              </div>
              <div className="card-body">
                <div className="performers-list">
                  {reportData.details.topPerformers.map((performer, index) => (
                    <div key={performer.name} className="performer-item">
                      <div className="performer-rank">#{index + 1}</div>
                      <div className="performer-info">
                        <div className="performer-name">{performer.name}</div>
                        <div className="performer-stats">
                          {performer.matches} {t.matches || '次匹配'} • 
                          {performer.categories.length} {t.categories || '个分类'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">{t.systemInfo || '系统信息'}</h3>
            </div>
            <div className="card-body">
              <div className="system-info-grid">
                <div className="info-item">
                  <span className="info-label">{t.reportType || '报告类型'}</span>
                  <span className="info-value">{reportData.reportType}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">{t.dateRange || '时间范围'}</span>
                  <span className="info-value">{formatDateRangeDisplay(reportData.dateRange, reportType)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">{t.generatedAt || '生成时间'}</span>
                  <span className="info-value">
                    {new Date(reportData.generatedAt).toLocaleString(currentLanguage === 'zh' ? 'zh-CN' : 'en-US')}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">{t.totalUsers || '总用户数'}</span>
                  <span className="info-value">{reportData.systemInfo.totalUsers}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">{t.totalRequests || '总请求数'}</span>
                  <span className="info-value">{reportData.systemInfo.totalRequests}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">{t.systemHealth || '系统状态'}</span>
                  <span className="info-value status-good">
                    {reportData.systemInfo.systemHealth === 'good' ? 
                      (t.healthy || '良好') : 
                      (t.needsAttention || '需要关注')
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;