// 简单组件 - 用于测试
import React from 'react';
import Navbar from './Layout/Navbar';
import { useAuth } from '../context/AuthContext';

// PIN历史记录
export const PINHistory = () => {
  const { user } = useAuth();
  return (
    <div className="page-container">
      <Navbar userType="pin" user={user} />
      <div className="main-content">
        <div className="dashboard">
          <div className="dashboard-header">
            <h1 className="dashboard-title">历史记录</h1>
            <p className="dashboard-subtitle">查看您的所有请求历史</p>
          </div>
          <div className="card">
            <div className="card-body">
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-title">历史记录功能</div>
                <div className="empty-state-description">
                  您的历史请求记录将显示在这里
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// CSR收藏夹
export const CSRShortlist = () => {
  const { user } = useAuth();
  return (
    <div className="page-container">
      <Navbar userType="csr" user={user} />
      <div className="main-content">
        <div className="dashboard">
          <h1 className="dashboard-title">我的收藏夹</h1>
          <div className="card">
            <div className="card-body">
              <div className="empty-state">
                <div className="empty-state-icon">⭐</div>
                <div className="empty-state-title">收藏夹功能</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// CSR历史
export const CSRHistory = () => {
  const { user } = useAuth();
  return (
    <div className="page-container">
      <Navbar userType="csr" user={user} />
      <div className="main-content">
        <div className="dashboard">
          <h1 className="dashboard-title">服务历史</h1>
          <div className="card">
            <div className="card-body">
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <div className="empty-state-title">服务历史功能</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 管理员类别管理
export const CategoryManagement = () => {
  const { user } = useAuth();
  return (
    <div className="page-container">
      <Navbar userType="admin" user={user} />
      <div className="main-content">
        <div className="dashboard">
          <h1 className="dashboard-title">类别管理</h1>
          <div className="card">
            <div className="card-body">
              <div className="empty-state">
                <div className="empty-state-icon">🏷️</div>
                <div className="empty-state-title">类别管理功能</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 管理员报告
export const Reports = () => {
  const { user } = useAuth();
  return (
    <div className="page-container">
      <Navbar userType="admin" user={user} />
      <div className="main-content">
        <div className="dashboard">
          <h1 className="dashboard-title">数据报告</h1>
          <div className="card">
            <div className="card-body">
              <div className="empty-state">
                <div className="empty-state-icon">📈</div>
                <div className="empty-state-title">数据报告功能</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};