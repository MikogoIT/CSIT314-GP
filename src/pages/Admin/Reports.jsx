// Reports.jsx
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ReportService } from '../../services/reportService';
import '../../styles/reports.css';

const Reports = () => {
  const { t } = useLanguage();
  const [reportType, setReportType] = useState('weekly');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateReport = () => {
    setLoading(true);
    try {
      const report = ReportService.generateComprehensiveReport(reportType);
      setReportData(report);
    } catch (error) {
      console.error('生成报告失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 页面加载时生成默认报告
  useEffect(() => {
    generateReport();
  }, []);
  
  return (
    <div className="admin-page">
      <div className="page-header">
        <h1 className="page-title">{t('admin.reports.title')}</h1>
      </div>
      
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">{t('admin.reports.config')}</h3>
        </div>
        <div className="card-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('admin.reports.reportType')}</label>
              <select 
                className="form-select"
                value={reportType} 
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="daily">{t('admin.reports.daily')}</option>
                <option value="weekly">{t('admin.reports.weekly')}</option>
                <option value="monthly">{t('admin.reports.monthly')}</option>
              </select>
            </div>
            <div className="form-group">
              <button 
                className="btn btn-primary" 
                onClick={generateReport}
                disabled={loading}
              >
                <span className="btn-icon">📊</span>
                {loading ? t('admin.reports.generating') : t('admin.reports.generate')}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {reportData && (
        <>
          <div className="stats-grid">
            <div className="stat-card primary">
              <div className="stat-header">
                <div className="stat-info">
                  <div className="stat-title">{t('admin.reports.totalMatches')}</div>
                  <div className="stat-value">{reportData.totalMatches}</div>
                </div>
                <div className="stat-icon primary">🤝</div>
              </div>
              <div className={`stat-change ${reportData.trends.matchGrowth >= 0 ? 'up' : 'down'}`}>
                {reportData.trends.matchGrowth >= 0 ? '↗' : '↘'} 
                {t('admin.reports.growthLastMonth')} {Math.abs(reportData.trends.matchGrowth)}%
              </div>
            </div>
            <div className="stat-card success">
              <div className="stat-header">
                <div className="stat-info">
                  <div className="stat-title">{t('admin.reports.newUsers')}</div>
                  <div className="stat-value">{reportData.newUsers}</div>
                </div>
                <div className="stat-icon success">👥</div>
              </div>
              <div className={`stat-change ${reportData.trends.userGrowth >= 0 ? 'up' : 'down'}`}>
                {reportData.trends.userGrowth >= 0 ? '↗' : '↘'} 
                {t('admin.reports.growthLastMonth')} {Math.abs(reportData.trends.userGrowth)}%
              </div>
            </div>
            <div className="stat-card warning">
              <div className="stat-header">
                <div className="stat-info">
                  <div className="stat-title">{t('admin.reports.activeRequests')}</div>
                  <div className="stat-value">{reportData.activeRequests}</div>
                </div>
                <div className="stat-icon warning">📋</div>
              </div>
              <div className="stat-change neutral">{t('admin.reports.currentActive')}</div>
            </div>
            <div className="stat-card info">
              <div className="stat-header">
                <div className="stat-info">
                  <div className="stat-title">{t('admin.reports.completionRate')}</div>
                  <div className="stat-value">{reportData.completionRate}</div>
                </div>
                <div className="stat-icon info">✅</div>
              </div>
              <div className="stat-change neutral">{t('admin.reports.periodCompletion')}</div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">{t('admin.reports.systemInfo')}</h3>
            </div>
            <div className="card-body">
              <div className="system-info-grid">
                <div className="info-item">
                  <span className="info-label">{t('admin.reports.reportType')}</span>
                  <span className="info-value">{reportData.reportType}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">{t('admin.reports.timeRange')}</span>
                  <span className="info-value">{reportData.dateRange}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">{t('admin.reports.generatedTime')}</span>
                  <span className="info-value">
                    {new Date(reportData.generatedAt).toLocaleString('zh-CN')}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">{t('admin.reports.totalUsers')}</span>
                  <span className="info-value">{reportData.systemInfo.totalUsers}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">{t('admin.reports.totalRequests')}</span>
                  <span className="info-value">{reportData.systemInfo.totalRequests}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">{t('admin.reports.systemStatus')}</span>
                  <span className="info-value status-good">
                    {reportData.systemInfo.systemHealth === 'good' ? t('admin.reports.statusGood') : t('admin.reports.statusNeedAttention')}
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