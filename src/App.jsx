// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/index.css';

// 导入上下文
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

// 导入页面组件
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import PINDashboard from './pages/PIN/Dashboard';
import CSRDashboard from './pages/CSR/Dashboard';
import CSRSearch from './pages/CSR/Search';
import AdminDashboard from './pages/Admin/Dashboard_new';
import CategoryManagement from './pages/Admin/CategoryManagement';
import Reports from './pages/Admin/Reports_new';
import UserManagement from './pages/Admin/UserManagement';
import Help from './pages/Common/Help';
import Profile from './pages/Common/Profile';
import PINHistory from './pages/PIN/History';
import CSRShortlist from './pages/CSR/Shortlist';
import CSRHistory from './pages/CSR/History';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
        <div className="app">
          <Routes>
            {/* 公共路由 */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* PIN用户路由 */}
            <Route path="/pin/dashboard" element={<PINDashboard />} />
            <Route path="/pin/history" element={<PINHistory />} />
            
            {/* CSR代表路由 */}
            <Route path="/csr/dashboard" element={<CSRDashboard />} />
            <Route path="/csr/search" element={<CSRSearch />} />
            <Route path="/csr/shortlist" element={<CSRShortlist />} />
            <Route path="/csr/history" element={<CSRHistory />} />
            
            {/* 管理员路由 */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/categories" element={<CategoryManagement />} />
            <Route path="/admin/reports" element={<Reports />} />
            <Route path="/admin/users" element={<UserManagement />} />
            
            {/* 公共页面 */}
            <Route path="/help" element={<Help />} />
            <Route path="/profile" element={<Profile />} />
            
            {/* 默认重定向 */}
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;