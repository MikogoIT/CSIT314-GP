const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    
    return headers;
  }

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

  async get(endpoint, options = {}) {
    let url = endpoint;
    if (options.params) {
      const queryString = new URLSearchParams(options.params).toString();
      url = `${endpoint}${endpoint.includes('?') ? '&' : '?'}${queryString}`;
    }
    return this.request(url, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  async getUsers() {
    const response = await this.get('/users');
    return response.data || [];
  }

  async getAllUsers(params = {}) {
    const queryParams = {
      limit: 1000,
      page: 1,
      ...params
    };
    const response = await this.get('/admin/users', { params: queryParams });
    return response.data?.users || [];
  }

  async batchUpdateUsers(action, userIds) {
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

  async getRequests(params = {}) {
    const queryParams = {
      limit: 1000,
      page: 1,
      ...params
    };
    const response = await this.get('/requests', { params: queryParams });
    return response.data || [];
  }

  async getAllRequests(params = {}) {
    const queryParams = {
      limit: 1000,
      page: 1,
      ...params
    };
    const response = await this.get('/requests', { params: queryParams });
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

  async createRequestWithFiles(requestData) {
    const url = `${API_BASE_URL}/requests`;
    const token = this.token;

    const formData = new FormData();

    const appendFormField = (key, value) => {
      if (value === undefined || value === null) return;
      if (value instanceof File) {
        formData.append(key, value);
        return;
      }
      if (typeof value === 'object' && !Array.isArray(value)) {
        Object.entries(value).forEach(([subKey, subValue]) => {
          if (typeof subValue === 'object' && subValue !== null) {
            formData.append(`${key}[${subKey}]`, JSON.stringify(subValue));
          } else {
            formData.append(`${key}[${subKey}]`, subValue);
          }
        });
      } else if (Array.isArray(value)) {
        value.forEach(item => formData.append(`${key}[]`, typeof item === 'object' ? JSON.stringify(item) : item));
      } else {
        formData.append(key, value);
      }
    };

    Object.entries(requestData).forEach(([key, value]) => {
      if (key === 'attachments') return;
      appendFormField(key, value);
    });

    if (requestData.attachments && requestData.attachments.length) {
      for (const file of requestData.attachments) {
        formData.append('attachments', file);
      }
    }

    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `HTTP error! status: ${response.status}`);
    return data.data;
  }

  async updateRequest(id, requestData) {
    const response = await this.put(`/requests/${id}`, requestData);
    return response.data;
  }

  async deleteRequest(id) {
    await this.delete(`/requests/${id}`);
  }

  async getUserRequests(userId) {
    const response = await this.get('/requests');
    return response.data?.requests || [];
  }

  async matchRequest(requestId, volunteerId) {
    const response = await this.post(`/requests/${requestId}/assign/${volunteerId}`);
    return response.data;
  }

  async completeRequest(requestId, payload = {}) {
    const response = await this.post(`/requests/${requestId}/complete`, payload);
    return response.data;
  }

  async applyForRequest(requestId, message = '') {
    const response = await this.post(`/requests/${requestId}/apply`, { message });
    return response;
  }

  async cancelApplication(requestId) {
    const response = await this.delete(`/requests/${requestId}/apply`);
    return response;
  }

  async rejectRequest(requestId, reason = '') {
    const response = await this.post(`/requests/${requestId}/reject`, { reason });
    return response;
  }

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

  async getAdminStats() {
    const response = await this.get('/admin/stats');
    return response.data;
  }

  async getAdminActivities() {
    const response = await this.get('/admin/activities');
    return response.data || [];
  }

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

const apiService = new ApiService();

export default apiService;