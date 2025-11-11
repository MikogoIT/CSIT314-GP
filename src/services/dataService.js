// 统一数据服务 - 现在使用后端API而不是localStorage
// src/services/dataService.js

import apiService from './apiService';

export class DataService {
  // 缓存数据
  static cache = {
    categories: null,
    users: null,
    requests: null,
    shortlists: null,
    lastFetch: {}
  };

  // 缓存有效期（5分钟）
  static CACHE_DURATION = 5 * 60 * 1000;

  // 检查缓存是否有效
  static isCacheValid(key) {
    const lastFetch = this.cache.lastFetch[key];
    return lastFetch && (Date.now() - lastFetch) < this.CACHE_DURATION;
  }

  // 更新缓存
  static updateCache(key, data) {
    this.cache[key] = data;
    this.cache.lastFetch[key] = Date.now();
  }

  // 清空缓存
  static clearCache(key = null) {
    if (key) {
      this.cache[key] = null;
      delete this.cache.lastFetch[key];
    } else {
      this.cache = {
        categories: null,
        users: null,
        requests: null,
        shortlists: null,
        lastFetch: {}
      };
    }
  }

  // 分类数据
  static async getCategories() {
    try {
      // 检查缓存
      if (this.isCacheValid('categories') && this.cache.categories) {
        return this.cache.categories;
      }

      const categories = await apiService.getCategories();
      
      // 确保categories是数组
      if (!Array.isArray(categories)) {
        throw new Error('获取的分类数据格式不正确');
      }
      
      // 转换数据格式以兼容现有代码
      const formattedCategories = categories.map(cat => ({
        id: cat.name || cat._id,
        _id: cat._id, // 保留 MongoDB _id 用于删除等操作
        name: cat.name, // 保留原始 name 字段
        displayName: cat.displayName, // 保留 displayName 用于显示
        icon: cat.icon || '📁',
        color: this.getColorFromHex(cat.color || '#42a5f5')
      }));

      this.updateCache('categories', formattedCategories);
      return formattedCategories;
    } catch (error) {
      console.error('获取分类失败，使用默认数据:', error);
      // 使用默认数据作为后备
      const defaultCategories = [
        { id: 'medical', name: 'category.medical', icon: '🏥' },
        { id: 'transportation', name: 'category.transport', icon: '🚗' },
        { id: 'shopping', name: 'category.shopping', icon: '🛒' },
        { id: 'household', name: 'category.household', icon: '🏠' },
        { id: 'companion', name: 'category.companion', icon: '👥' },
        { id: 'technology', name: 'category.technology', icon: '💻' },
        { id: 'education', name: 'category.education', icon: '📚' },
        { id: 'other', name: 'category.other', icon: '📝' }
      ];
      return defaultCategories;
    }
  }

  // 将十六进制颜色转换为语义化颜色名
  static getColorFromHex(hexColor) {
    const colorMap = {
      '#ff4757': 'danger',
      '#ffa726': 'warning', 
      '#42a5f5': 'primary',
      '#66bb6a': 'success',
      '#ab47bc': 'info',
      '#26c6da': 'secondary'
    };
    return colorMap[hexColor] || 'primary';
  }

  // 紧急程度数据（静态数据，无需API）
  static getUrgencyLevels() {
    return [
      { id: 'low', name: 'urgency.low', color: 'success' },
      { id: 'medium', name: 'urgency.medium', color: 'warning' },
      { id: 'high', name: 'urgency.high', color: 'danger' },
      { id: 'urgent', name: 'urgency.urgent', color: 'critical' }
    ];
  }

  // 状态数据（静态数据，无需API）
  static getStatusOptions() {
    return [
      { id: 'pending', name: 'status.pending', color: 'warning' },
      { id: 'matched', name: 'status.matched', color: 'success' },
      { id: 'completed', name: 'status.completed', color: 'info' },
      { id: 'cancelled', name: 'status.cancelled', color: 'danger' }
    ];
  }

  // 获取用户数据
  static async getUsers() {
    try {
      // 检查缓存
      if (this.isCacheValid('users') && this.cache.users) {
        return this.cache.users;
      }

      const users = await apiService.getAllUsers();
      this.updateCache('users', users);
      return users;
    } catch (error) {
      console.error('获取用户数据失败:', error);
      return [];
    }
  }

  // 获取请求数据
  static async getRequests() {
    try {
      // 检查缓存
      if (this.isCacheValid('requests') && this.cache.requests) {
        return this.cache.requests;
      }

      // 检查用户类型，管理员使用不同的API
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      let requests = [];
      
      if (currentUser.userType === 'system_admin' || currentUser.userType === 'platform_manager') {
        // 管理员使用getAllRequests获取所有请求
        const allRequests = await apiService.getAllRequests();
        requests = allRequests || [];
      } else {
        // 普通用户使用getRequests，后端会根据用户类型过滤
        const response = await apiService.getRequests();
        requests = response.requests || response || [];
      }
      
      // 转换数据格式以兼容现有代码
      const formattedRequests = requests.map(req => {
        // 处理已分配的志愿者信息
        const assignedVolunteers = req.assignedVolunteers || [];
        const volunteersList = assignedVolunteers.map(av => ({
          id: av.volunteer?._id || av.volunteer,
          name: av.volunteer?.name || 'Unknown',
          email: av.volunteer?.email,
          phone: av.volunteer?.phone,
          assignedAt: av.assignedAt,
          completedAt: av.completedAt,
          rating: av.rating,
          feedback: av.feedback
        }));
        
        return {
          id: req._id,
          title: req.title,
          description: req.description,
          category: req.category?.name || req.category,
          urgency: req.urgency,
          location: req.location,
          expectedDate: req.expectedDate ? new Date(req.expectedDate).toISOString().split('T')[0] : null,
          expectedTime: req.expectedTime,
          volunteersNeeded: req.volunteersNeeded,
          status: req.status,
          // Requester information
          requesterId: req.requester?._id || req.requesterId || req.requester,
          requesterName: req.requester?.name || req.requesterId?.name || req.requesterName || 'Unknown',
          requesterEmail: req.requester?.email || req.requesterId?.email || req.requesterEmail,
          requesterPhone: req.requester?.phone || req.requesterId?.phone || req.requesterPhone,
          requesterAddress: req.requester?.address || req.requesterId?.address || req.requesterAddress,
          // Assigned volunteers information
          assignedVolunteers: volunteersList,
          volunteer: volunteersList.length > 0 ? volunteersList[0].name : (req.assignedVolunteer?.name || req.volunteer),
          volunteerEmail: volunteersList.length > 0 ? volunteersList[0].email : null,
          volunteerPhone: volunteersList.length > 0 ? volunteersList[0].phone : null,
          viewCount: req.viewCount || req.stats?.viewCount || 0,
          shortlistCount: req.shortlistCount || req.stats?.shortlistCount || 0,
          createdAt: req.createdAt,
          matchedAt: req.matchedAt
        };
      });

      this.updateCache('requests', formattedRequests);
      return formattedRequests;
    } catch (error) {
      console.error('获取请求数据失败:', error);
      return [];
    }
  }

  // 获取收藏夹数据
  static async getShortlists() {
    try {
      // 检查缓存
      if (this.isCacheValid('shortlists') && this.cache.shortlists) {
        return this.cache.shortlists;
      }

      // 从localStorage获取所有用户的收藏夹数据
      const allShortlists = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('shortlist_')) {
          try {
            const shortlist = JSON.parse(localStorage.getItem(key));
            if (Array.isArray(shortlist)) {
              allShortlists.push(...shortlist);
            }
          } catch (parseError) {
            console.warn(`Failed to parse shortlist data for key ${key}`);
          }
        }
      }
      
      this.updateCache('shortlists', allShortlists);
      return allShortlists;
    } catch (error) {
      console.error('获取收藏夹数据失败:', error);
      return [];
    }
  }

  // 保存分类数据
  static async saveCategories(categories) {
    try {
      // 注意：这里需要管理员权限
      await apiService.updateCategory(categories);
      this.clearCache('categories');
    } catch (error) {
      console.error('保存分类数据失败:', error);
      throw error;
    }
  }

  // 保存用户数据
  static async saveUsers(users) {
    try {
      // 注意：这里需要管理员权限
      // 实际实现中，用户数据通常不会批量保存
      this.clearCache('users');
    } catch (error) {
      console.error('保存用户数据失败:', error);
      throw error;
    }
  }

  // 保存请求数据
  static async saveRequests(requests) {
    try {
      // 注意：通常不会批量保存请求，而是单个创建/更新
      this.clearCache('requests');
    } catch (error) {
      console.error('保存请求数据失败:', error);
      throw error;
    }
  }

  // 保存收藏夹数据
  static async saveShortlists(shortlists) {
    try {
      // 注意：通常不会批量保存收藏夹
      this.clearCache('shortlists');
    } catch (error) {
      console.error('保存收藏夹数据失败:', error);
      throw error;
    }
  }

  // 根据分类ID获取分类名称
  static async getCategoryById(categoryId) {
    try {
      const categories = await this.getCategories();
      const category = categories.find(cat => cat.id === categoryId);
      return category || { id: categoryId, name: 'category.other', icon: '📝' };
    } catch (error) {
      console.error('获取分类失败:', error);
      return { id: categoryId, name: 'category.other', icon: '📝' };
    }
  }

  // 根据紧急程度ID获取紧急程度
  static getUrgencyById(urgencyId) {
    const urgencyLevels = this.getUrgencyLevels();
    return urgencyLevels.find(level => level.id === urgencyId) || 
           { id: urgencyId, name: 'urgency.medium', color: 'warning' };
  }

  // 根据状态ID获取状态
  static getStatusById(statusId) {
    const statuses = this.getStatusOptions();
    return statuses.find(status => status.id === statusId) || 
           { id: statusId, name: 'status.pending', color: 'warning' };
  }

  // 获取用户的请求
  static async getUserRequests(userId) {
    try {
      const requests = await apiService.getUserRequests(userId);
      
      if (!Array.isArray(requests)) {
        console.error('获取的请求数据不是数组:', requests);
        return [];
      }
      
      const mappedRequests = requests.map(req => ({
        id: req._id,
        title: req.title,
        description: req.description,
        category: req.category,
        urgency: req.urgency,
        location: req.location?.address || req.location,
        expectedDate: req.expectedDate ? new Date(req.expectedDate).toISOString().split('T')[0] : null,
        expectedTime: req.expectedTime,
        volunteersNeeded: req.volunteersNeeded,
        status: req.status,
        contactMethod: req.contactMethod,
        additionalNotes: req.additionalNotes,
        requesterId: req.requester?._id || req.requesterId,
        requesterName: req.requester?.name || req.requesterName,
        requesterEmail: req.requester?.email || req.requesterEmail,
        requesterPhone: req.requester?.phone || req.requesterPhone,
        volunteer: req.assignedVolunteers?.[0]?.volunteer?.name || req.volunteer,
        viewCount: req.stats?.viewCount || req.viewCount || 0,
        shortlistCount: req.stats?.shortlistCount || req.shortlistCount || 0,
        createdAt: req.createdAt,
        matchedAt: req.matchedAt
      }));
      
      return mappedRequests;
    } catch (error) {
      console.error('获取用户请求失败:', error);
      return [];
    }
  }

  // 获取用户的收藏夹
  static async getUserShortlists(userId) {
    try {
      const savedShortlist = localStorage.getItem(`shortlist_${userId}`);
      return savedShortlist ? JSON.parse(savedShortlist) : [];
    } catch (error) {
      console.error('获取用户收藏夹失败:', error);
      return [];
    }
  }

  // 时间格式化工具
  static getTimeAgo(dateString, t = null) {
    if (!dateString) return t ? t('common.unknown') : '未知';
    
    const now = new Date();
    const past = new Date(dateString);
    const diffInMinutes = Math.floor((now - past) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInMinutes < 1) {
      return t ? t('time.justNow') : '刚刚';
    }
    
    if (diffInMinutes < 60) {
      return t ? t('time.minutesAgo', { count: diffInMinutes }) : `${diffInMinutes}分钟前`;
    }
    
    if (diffInHours < 24) {
      return t ? t('time.hoursAgo', { count: diffInHours }) : `${diffInHours}小时前`;
    }
    
    if (diffInDays < 7) {
      return t ? t('time.daysAgo', { count: diffInDays }) : `${diffInDays}天前`;
    }
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return t ? t('time.weeksAgo', { count: diffInWeeks }) : `${diffInWeeks}周前`;
  }

  // 初始化示例数据（现在通过数据库脚本完成）
  static async initializeData() {
    try {
      // 检查数据库是否已有数据
      const users = await this.getUsers();
      const requests = await this.getRequests();
      
      if (users.length === 0 || requests.length === 0) {
        console.warn('数据库中没有足够的数据。请运行后端的数据库初始化脚本：');
        console.warn('cd backend && node init-database.js');
        console.warn('或者使用 npm run init-db 命令');
      }
    } catch (error) {
      console.error('检查数据库数据失败:', error);
      console.warn('请确保后端服务正在运行，并初始化数据库数据');
    }
  }

  // 搜索和过滤功能
  static filterRequests(requests, filters) {
    return requests.filter(request => {
      // 搜索文本过滤
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        const matchesText = 
          request.title.toLowerCase().includes(searchLower) ||
          request.description.toLowerCase().includes(searchLower) ||
          request.location.toLowerCase().includes(searchLower);
        if (!matchesText) return false;
      }

      // 分类过滤
      if (filters.category && filters.category !== 'all') {
        if (request.category !== filters.category) return false;
      }

      // 紧急程度过滤
      if (filters.urgency && filters.urgency !== 'all') {
        if (request.urgency !== filters.urgency) return false;
      }

      // 状态过滤
      if (filters.status && filters.status !== 'all') {
        if (request.status !== filters.status) return false;
      }

      return true;
    });
  }

  // 获取统计数据
  static async getStatistics(userId = null) {
    try {
      const users = await this.getUsers();
      const requests = await this.getRequests();
      const shortlists = await this.getShortlists();

      if (userId) {
        // 用户个人统计
        const userRequests = requests.filter(r => r.requesterId === userId);
        const userShortlists = shortlists.filter(s => s.userId === userId);
        
        return {
          totalRequests: userRequests.length,
          matched: userRequests.filter(r => r.status === 'matched').length,
          pending: userRequests.filter(r => r.status === 'pending').length,
          completed: userRequests.filter(r => r.status === 'completed').length,
          totalViews: userRequests.reduce((sum, r) => sum + (r.viewCount || 0), 0),
          totalShortlists: userShortlists.length
        };
      } else {
        // 系统整体统计
        return {
          totalUsers: users.length,
          activeUsers: users.filter(u => u.status === 'active').length,
          totalRequests: requests.length,
          activeRequests: requests.filter(r => r.status === 'pending' || r.status === 'matched').length,
          matchedRequests: requests.filter(r => r.status === 'matched').length,
          completedRequests: requests.filter(r => r.status === 'completed').length,
          totalShortlists: shortlists.length
        };
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalRequests: 0,
        activeRequests: 0,
        matchedRequests: 0,
        completedRequests: 0,
        totalShortlists: 0
      };
    }
  }

  // 创建新请求
  static async createRequest(requestData) {
    try {
      let newRequest;
      // If attachments (File objects) exist, use multipart upload
      if (requestData.attachments && requestData.attachments.length) {
        newRequest = await apiService.createRequestWithFiles(requestData);
      } else {
        newRequest = await apiService.createRequest(requestData);
      }
      this.clearCache('requests');
      
      return {
        id: newRequest._id,
        title: newRequest.title,
        description: newRequest.description,
        category: newRequest.category?.name || newRequest.category,
        urgency: newRequest.urgency,
        location: newRequest.location,
        expectedDate: newRequest.expectedDate ? new Date(newRequest.expectedDate).toISOString().split('T')[0] : null,
        expectedTime: newRequest.expectedTime,
        volunteersNeeded: newRequest.volunteersNeeded,
        status: newRequest.status,
        requesterId: newRequest.requesterId,
        createdAt: newRequest.createdAt
      };
    } catch (error) {
      console.error('创建请求失败:', error);
      throw error;
    }
  }

  // 更新请求
  static async updateRequest(requestId, updateData) {
    try {
      const updatedRequest = await apiService.updateRequest(requestId, updateData);
      this.clearCache('requests');
      return updatedRequest;
    } catch (error) {
      console.error('更新请求失败:', error);
      throw error;
    }
  }

  // 删除请求
  static async deleteRequest(requestId) {
    try {
      await apiService.deleteRequest(requestId);
      this.clearCache('requests');
    } catch (error) {
      console.error('删除请求失败:', error);
      throw error;
    }
  }

  // 添加到收藏夹
  static async addToShortlist(requestId) {
    try {
      const result = await apiService.addToShortlist(requestId);
      this.clearCache('shortlists');
      return result;
    } catch (error) {
      console.error('添加到收藏夹失败:', error);
      throw error;
    }
  }

  // 从收藏夹移除
  static async removeFromShortlist(requestId) {
    try {
      await apiService.removeFromShortlist(requestId);
      this.clearCache('shortlists');
    } catch (error) {
      console.error('从收藏夹移除失败:', error);
      throw error;
    }
  }

  // 根据分类获取请求
  static async getRequestsByCategory(categoryId) {
    try {
      console.log('DataService.getRequestsByCategory 调用，categoryId:', categoryId);
      
      // 尝试直接通过API搜索
      const requests = await apiService.searchRequests({ category: categoryId });
      console.log('API搜索结果:', requests);
      
      if (!requests || requests.length === 0) {
        // 如果API搜索没有结果，尝试获取所有请求然后本地过滤
        console.log('API搜索无结果，尝试本地过滤');
        const allRequests = await this.getRequests();
        const filteredRequests = (allRequests || []).filter(req => 
          req.category === categoryId || 
          req.category?.id === categoryId ||
          req.category?.name === categoryId
        );
        console.log('本地过滤结果:', filteredRequests);
        return filteredRequests;
      }
      
      return requests.map(req => ({
        id: req._id,
        title: req.title,
        description: req.description,
        category: req.category?.name || req.category,
        urgency: req.urgency,
        location: req.location,
        expectedDate: req.expectedDate ? new Date(req.expectedDate).toISOString().split('T')[0] : null,
        expectedTime: req.expectedTime,
        volunteersNeeded: req.volunteersNeeded,
        status: req.status,
        requesterId: req.requesterId?._id || req.requesterId,
        requesterName: req.requesterId?.name || req.requesterName,
        createdAt: req.createdAt
      }));
    } catch (error) {
      console.error('获取分类请求失败:', error);
      return [];
    }
  }
}