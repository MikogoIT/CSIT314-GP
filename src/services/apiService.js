// API数据服务 - 替代localStorage，使用后端API
// src/services/apiService.js

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  // 设置认证token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  // 获取请求头
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // 基础请求方法
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // GET请求
  async get(endpoint, options = {}) {
    // 处理查询参数
    let url = endpoint;
    if (options.params) {
      const queryString = new URLSearchParams(options.params).toString();
      url = `${endpoint}${endpoint.includes('?') ? '&' : '?'}${queryString}`;
    }
    return this.request(url, { method: 'GET' });
  }

  // POST请求
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT请求
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE请求
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // 用户相关API
  async getUsers() {
    const response = await this.get('/users');
    return response.data || [];
  }

  async getAllUsers(params = {}) {
    // 管理员获取所有用户的方法
    // 默认获取所有数据（limit=1000），除非指定了分页参数
    const queryParams = {
      limit: 1000,
      page: 1,
      ...params
    };
    const response = await this.get('/admin/users', { params: queryParams });
    // 后端返回的是 { users: [...], pagination: {...} }
    return response.data?.users || [];
  }

  async batchUpdateUsers(action, userIds) {
    // 批量操作用户：suspend, activate, delete
    const response = await this.post('/admin/users/batch', {
      action,
      userIds
    });
    return response.data;
  }

  async getUserById(id) {
    const response = await this.get(`/users/${id}`);
    return response.data;
  }

  async createUser(userData) {
    const response = await this.post('/users', userData);
    return response.data;
  }

  async updateUser(id, userData) {
    const response = await this.put(`/users/${id}`, userData);
    return response.data;
  }

  async deleteUser(id) {
    await this.delete(`/users/${id}`);
  }

  // 分类相关API
  async getCategories() {
    const response = await this.get('/categories');
    return response.data?.categories || [];
  }

  async getCategoryById(id) {
    const response = await this.get(`/categories/${id}`);
    return response.data;
  }

  async createCategory(categoryData) {
    const response = await this.post('/categories', categoryData);
    return response.data;
  }

  async updateCategory(id, categoryData) {
    const response = await this.put(`/categories/${id}`, categoryData);
    return response.data;
  }

  async deleteCategory(id) {
    await this.delete(`/categories/${id}`);
  }

  // 请求相关API
  async getRequests(params = {}) {
    // 默认获取所有数据（limit=1000），除非指定了分页参数
    const queryParams = {
      limit: 1000,
      page: 1,
      ...params
    };
    const response = await this.get('/requests', { params: queryParams });
    return response.data || [];
  }

  async getAllRequests(params = {}) {
    // 管理员获取所有请求的方法 - 使用通用的 /requests 端点
    // 默认获取所有数据（limit=1000），除非指定了分页参数
    const queryParams = {
      limit: 1000,
      page: 1,
      ...params
    };
    const response = await this.get('/requests', { params: queryParams });
    // 后端返回的是 { requests: [...], pagination: {...} }
    return response.data?.requests || [];
  }

  async getRequestById(id) {
    const response = await this.get(`/requests/${id}`);
    return response.data;
  }

  async createRequest(requestData) {
    const response = await this.post('/requests', requestData);
    return response.data;
  }

  async updateRequest(id, requestData) {
    const response = await this.put(`/requests/${id}`, requestData);
    return response.data;
  }

  async deleteRequest(id) {
    await this.delete(`/requests/${id}`);
  }

  async getUserRequests(userId) {
    // 对于PIN用户，后端会自动过滤到只显示该用户的请求
    // 不需要传递userId参数，因为后端从JWT token中获取用户信息
    const response = await this.get('/requests');
    return response.data?.requests || [];
  }

  async matchRequest(requestId, volunteerId) {
    const response = await this.post(`/requests/${requestId}/match`, {
      volunteerId
    });
    return response.data;
  }

  async completeRequest(requestId, feedback = null) {
    const response = await this.post(`/requests/${requestId}/complete`, {
      feedback
    });
    return response.data;
  }

  // 认证相关API
  async login(loginData) {
    const response = await this.post('/auth/login', loginData);
    if (response.data && response.data.token) {
      this.setToken(response.data.token);
    }
    return response;
  }

  async register(userData) {
    const response = await this.post('/auth/register', userData);
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async logout() {
    this.setToken(null);
  }

  async getCurrentUser() {
    const response = await this.get('/auth/me');
    return response.data;
  }

  // 管理员相关API
  async getAdminStats() {
    const response = await this.get('/admin/stats');
    return response.data;
  }

  async getAdminActivities() {
    const response = await this.get('/admin/activities');
    return response.data || [];
  }

  // 搜索相关API
  async searchRequests(filters = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const endpoint = `/requests/search${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await this.get(endpoint);
    return response.data || [];
  }

  // 收藏相关API
  async getShortlists(userId) {
    const response = await this.get(`/users/${userId}/shortlist`);
    return response.data || [];
  }

  async addToShortlist(userId, requestId) {
    const response = await this.post(`/users/${userId}/shortlist`, { requestId });
    return response.data;
  }

  async removeFromShortlist(userId, requestId) {
    await this.delete(`/users/${userId}/shortlist/${requestId}`);
  }
}

// 创建单例实例
const apiService = new ApiService();

export default apiService;