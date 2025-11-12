import apiService from './apiService';

export class DataService {
  static cache = {
    categories: null,
    users: null,
    requests: null,
    shortlists: null,
    lastFetch: {}
  };

  static CACHE_DURATION = 5 * 60 * 1000;

  static isCacheValid(key) {
    const lastFetch = this.cache.lastFetch[key];
    return lastFetch && (Date.now() - lastFetch) < this.CACHE_DURATION;
  }

  static updateCache(key, data) {
    this.cache[key] = data;
    this.cache.lastFetch[key] = Date.now();
  }

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

  static async getCategories() {
    try {
      if (this.isCacheValid('categories') && this.cache.categories) {
        return this.cache.categories;
      }

      const categories = await apiService.getCategories();
      
      if (!Array.isArray(categories)) {
        throw new Error('Invalid category data format');
      }
      
      const formattedCategories = categories.map(cat => ({
        id: cat.name || cat._id,
        _id: cat._id,
        name: cat.name,
        displayName: cat.displayName,
        icon: cat.icon || '📁',
        color: this.getColorFromHex(cat.color || '#42a5f5')
      }));

      this.updateCache('categories', formattedCategories);
      return formattedCategories;
    } catch (error) {
      console.error('Failed to load categories, using defaults:', error);
      const defaultCategories = [
        { id: 'medical', name: 'medical', displayName: 'Medical', icon: '🏥', color: 'danger' },
        { id: 'transportation', name: 'transportation', displayName: 'Transportation', icon: '🚗', color: 'primary' },
        { id: 'shopping', name: 'shopping', displayName: 'Shopping', icon: '🛒', color: 'warning' },
        { id: 'household', name: 'household', displayName: 'Household', icon: '🏠', color: 'success' },
        { id: 'companion', name: 'companion', displayName: 'Companion', icon: '👥', color: 'info' },
        { id: 'technology', name: 'technology', displayName: 'Technology', icon: '💻', color: 'secondary' },
        { id: 'education', name: 'education', displayName: 'Education', icon: '📚', color: 'primary' },
        { id: 'other', name: 'other', displayName: 'Other', icon: '📝', color: 'default' }
      ];
      this.updateCache('categories', defaultCategories);
      return defaultCategories;
    }
  }

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

  static getUrgencyLevels() {
    return [
      { id: 'low', name: 'urgency.low', color: 'success' },
      { id: 'medium', name: 'urgency.medium', color: 'warning' },
      { id: 'high', name: 'urgency.high', color: 'danger' },
      { id: 'urgent', name: 'urgency.urgent', color: 'critical' }
    ];
  }

  static getStatusOptions() {
    return [
      { id: 'pending', name: 'status.pending', color: 'warning' },
      { id: 'matched', name: 'status.matched', color: 'success' },
      { id: 'completed', name: 'status.completed', color: 'info' },
      { id: 'cancelled', name: 'status.cancelled', color: 'danger' }
    ];
  }

  static async getUsers() {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (currentUser.userType !== 'system_admin' && currentUser.userType !== 'platform_manager') {
        console.warn('getUsers() requires admin permissions');
        return [];
      }

      if (this.isCacheValid('users') && this.cache.users) {
        return this.cache.users;
      }

      const users = await apiService.getAllUsers();
      this.updateCache('users', users);
      return users;
    } catch (error) {
      console.error('Failed to load users:', error);
      return [];
    }
  }

  static async getRequests() {
    try {
      if (this.isCacheValid('requests') && this.cache.requests) {
        return this.cache.requests;
      }

      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      let requests = [];
      
      if (currentUser.userType === 'system_admin' || currentUser.userType === 'platform_manager') {
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
        
        const interestedVolunteers = req.interestedVolunteers || [];
        const interestedList = interestedVolunteers.map(iv => ({
          id: iv.volunteer?._id || iv.volunteer,
          name: iv.volunteer?.name || 'Unknown',
          email: iv.volunteer?.email,
          phone: iv.volunteer?.phone,
          message: iv.message,
          appliedAt: iv.appliedAt
        }));
        
        const rejectedVolunteers = req.rejectedVolunteers || [];
        const rejectedList = rejectedVolunteers.map(rv => ({
          volunteer: rv.volunteer?._id || rv.volunteer,
          rejectedAt: rv.rejectedAt,
          reason: rv.reason
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
          requesterId: req.requester?._id || req.requesterId || req.requester,
          requesterName: req.requester?.name || req.requesterId?.name || req.requesterName || 'Unknown',
          requesterEmail: req.requester?.email || req.requesterId?.email || req.requesterEmail,
          requesterPhone: req.requester?.phone || req.requesterId?.phone || req.requesterPhone,
          requesterAddress: req.requester?.address || req.requesterId?.address || req.requesterAddress,
          interestedVolunteers: interestedList,
          rejectedVolunteers: rejectedList,
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
      console.error('Failed to load requests:', error);
      return [];
    }
  }

  static async getRequestById(requestId) {
    try {
      const response = await apiService.getRequestById(requestId);
      return response.request || response;
    } catch (error) {
      console.error('Failed to load request details:', error);
      throw error;
    }
  }

  static async getShortlists() {
    try {
      if (this.isCacheValid('shortlists') && this.cache.shortlists) {
        return this.cache.shortlists;
      }

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
      console.error('Failed to load shortlists:', error);
      return [];
    }
  }

  static async saveCategories(categories) {
    try {
      await apiService.updateCategory(categories);
      this.clearCache('categories');
    } catch (error) {
      console.error('Failed to save categories:', error);
      throw error;
    }
  }

  static async saveUsers(users) {
    try {
      this.clearCache('users');
    } catch (error) {
      console.error('Failed to save users:', error);
      throw error;
    }
  }

  static async saveRequests(requests) {
    try {
      this.clearCache('requests');
    } catch (error) {
      console.error('Failed to save requests:', error);
      throw error;
    }
  }

  static async saveShortlists(shortlists) {
    try {
      this.clearCache('shortlists');
    } catch (error) {
      console.error('Failed to save shortlists:', error);
      throw error;
    }
  }

  static async getCategoryById(categoryId) {
    try {
      const categories = await this.getCategories();
      const category = categories.find(cat => cat.id === categoryId);
      return category || { id: categoryId, name: 'category.other', icon: '📝' };
    } catch (error) {
      console.error('Failed to get category:', error);
      return { id: categoryId, name: 'category.other', icon: '📝' };
    }
  }

  static getUrgencyById(urgencyId) {
    const urgencyLevels = this.getUrgencyLevels();
    return urgencyLevels.find(level => level.id === urgencyId) || 
           { id: urgencyId, name: 'urgency.medium', color: 'warning' };
  }

  static getStatusById(statusId) {
    const statuses = this.getStatusOptions();
    return statuses.find(status => status.id === statusId) || 
           { id: statusId, name: 'status.pending', color: 'warning' };
  }

  static async getUserRequests(userId) {
    try {
      const requests = await apiService.getUserRequests(userId);
      
      console.log('DataService - Original request data:', requests);
      
      if (!Array.isArray(requests)) {
        console.error('Request data is not an array:', requests);
        return [];
      }
      
      const mappedRequests = requests.map(req => {
        const interestedVolunteers = req.interestedVolunteers || [];
        console.log(`Request ${req._id} - interestedVolunteers:`, interestedVolunteers);
        
        const interestedList = interestedVolunteers.map(iv => ({
          id: iv.volunteer?._id || iv.volunteer,
          name: iv.volunteer?.name || 'Unknown',
          email: iv.volunteer?.email,
          phone: iv.volunteer?.phone,
          message: iv.message,
          appliedAt: iv.appliedAt
        }));
        
        console.log(`Request ${req._id} - 处理后的申请者:`, interestedList);
        
        return {
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
          interestedVolunteers: interestedList,
          viewCount: req.stats?.viewCount || req.viewCount || 0,
          shortlistCount: req.stats?.shortlistCount || req.shortlistCount || 0,
          createdAt: req.createdAt,
          matchedAt: req.matchedAt
        };
      });
      
      return mappedRequests;
    } catch (error) {
      console.error('Failed to load user requests:', error);
      return [];
    }
  }

  static async getUserShortlists(userId) {
    try {
      const savedShortlist = localStorage.getItem(`shortlist_${userId}`);
      return savedShortlist ? JSON.parse(savedShortlist) : [];
    } catch (error) {
      console.error('Failed to load user shortlists:', error);
      return [];
    }
  }

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

  static async initializeData() {
    try {
      const requests = await this.getRequests();
      
      if (requests.length === 0) {
        console.warn('No data in database. Please run backend initialization script:');
        console.warn('cd backend && node generate-test-data.js');
        console.warn('or use: npm run generate-data');
      }
    } catch (error) {
      console.error('Failed to check database data:', error);
    }
  }

  static filterRequests(requests, filters) {
    return requests.filter(request => {
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

  static async getStatistics(userId = null) {
    try {
      const users = await this.getUsers();
      const requests = await this.getRequests();
      const shortlists = await this.getShortlists();

      if (userId) {
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
      console.error('Failed to load statistics:', error);
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

  static async createRequest(requestData) {
    try {
      let result;
      if (requestData.attachments && requestData.attachments.length) {
        result = await apiService.createRequestWithFiles(requestData);
      } else {
        result = await apiService.createRequest(requestData);
      }
      this.clearCache('requests');
      
      const newRequest = result.request || result;
      
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
      console.error('Failed to create request:', error);
      throw error;
    }
  }

  static async updateRequest(requestId, updateData) {
    try {
      const updatedRequest = await apiService.updateRequest(requestId, updateData);
      this.clearCache('requests');
      return updatedRequest;
    } catch (error) {
      console.error('Failed to update request:', error);
      throw error;
    }
  }

  // 删除请求
  static async deleteRequest(requestId) {
    try {
      await apiService.deleteRequest(requestId);
      this.clearCache('requests');
    } catch (error) {
      console.error('Failed to delete request:', error);
      throw error;
    }
  }

  static async completeRequest(requestId, update = {}) {
    try {
      const response = await apiService.completeRequest(requestId, update);
      this.clearCache('requests');
      return response;
    } catch (error) {
      console.error('Failed to complete request:', error);
      throw error;
    }
  }

  static async matchRequest(requestId, volunteerId) {
    try {
      const response = await apiService.matchRequest(requestId, volunteerId);
      this.clearCache('requests');
      return response;
    } catch (error) {
      console.error('Failed to match volunteer:', error);
      throw error;
    }
  }

  static async applyForRequest(requestId, message = '') {
    try {
      const response = await apiService.applyForRequest(requestId, message);
      this.clearCache('requests');
      return response;
    } catch (error) {
      console.error('Failed to apply for request:', error);
      throw error;
    }
  }

  static async cancelApplication(requestId) {
    try {
      const response = await apiService.cancelApplication(requestId);
      this.clearCache('requests');
      return response;
    } catch (error) {
      console.error('Failed to cancel application:', error);
      throw error;
    }
  }

  static async rejectRequest(requestId, reason = '') {
    try {
      const response = await apiService.rejectRequest(requestId, reason);
      this.clearCache('requests');
      return response;
    } catch (error) {
      console.error('Failed to reject request:', error);
      throw error;
    }
  }

  static async addToShortlist(requestId) {
    try {
      const result = await apiService.addToShortlist(requestId);
      this.clearCache('shortlists');
      return result;
    } catch (error) {
      console.error('Failed to add to shortlist:', error);
      throw error;
    }
  }

  static async removeFromShortlist(requestId) {
    try {
      await apiService.removeFromShortlist(requestId);
      this.clearCache('shortlists');
    } catch (error) {
      console.error('Failed to remove from shortlist:', error);
      throw error;
    }
  }

  static async getRequestsByCategory(categoryId) {
    try {
      console.log('DataService.getRequestsByCategory called, categoryId:', categoryId);
      
      const requests = await apiService.searchRequests({ category: categoryId });
      console.log('API search result:', requests);
      
      if (!requests || requests.length === 0) {
        console.log('No API results, trying local filter');
        const allRequests = await this.getRequests();
        const filteredRequests = (allRequests || []).filter(req => 
          req.category === categoryId || 
          req.category?.id === categoryId ||
          req.category?.name === categoryId
        );
        console.log('Local filter result:', filteredRequests);
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
      console.error('Failed to get category requests:', error);
      return [];
    }
  }
}