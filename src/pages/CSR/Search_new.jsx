// CSR搜索页面
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Layout/Navbar';

const CSRSearch = () => {
  const { user } = useAuth();
  
  return (
    <div className="page-container">
      <Navbar userType="csr" user={user} />
      <div className="main-content">
        <div className="dashboard">
          <div className="dashboard-header">
            <h1 className="dashboard-title">搜索志愿机会</h1>
            <p className="dashboard-subtitle">寻找您可以参与的志愿服务机会</p>
          </div>
          
          <div className="card">
            <div className="card-body">
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <div className="empty-state-title">CSR搜索功能</div>
                <div className="empty-state-description">
                  这里将显示可搜索的志愿服务机会列表
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSRSearch;