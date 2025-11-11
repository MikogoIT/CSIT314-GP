// 管理员仪表板数据服务
// src/services/adminDashboardService.js

export class AdminDashboardService {
  // 获取用户统计数据
  static getUserStats() {
    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const deletedUsers = JSON.parse(localStorage.getItem('deletedUsers') || '[]');
    
    // 计算活跃用户（非删除状态）
    const activeUsers = registeredUsers.filter(user => 
      user.status !== 'deleted' && user.status !== 'suspended'
    );
    
    // 获取上月数据进行对比（模拟）
    const currentMonth = new Date().getMonth();
    const thisMonthUsers = registeredUsers.filter(user => {
      const userDate = new Date(user.registeredAt || user.createdAt || Date.now());
      return userDate.getMonth() === currentMonth;
    });
    
    return {
      total: activeUsers.length,
      change: thisMonthUsers.length,
      trend: thisMonthUsers.length > 0 ? 'up' : 'neutral'
    };
  }
  
  // 获取请求统计数据
  static getRequestStats() {
    const requests = JSON.parse(localStorage.getItem('requests') || '[]');
    
    // 计算活跃请求（pending, matched状态）
    const activeRequests = requests.filter(request => 
      request.status === 'pending' || request.status === 'matched'
    );
    
    // 本月新增请求
    const currentMonth = new Date().getMonth();
    const thisMonthRequests = requests.filter(request => {
      const requestDate = new Date(request.createdAt || Date.now());
      return requestDate.getMonth() === currentMonth;
    });
    
    return {
      total: activeRequests.length,
      change: thisMonthRequests.length,
      trend: thisMonthRequests.length > 0 ? 'up' : 'neutral'
    };
  }
  
  // 获取今日匹配统计
  static getTodayMatchStats() {
    const requests = JSON.parse(localStorage.getItem('requests') || '[]');
    const shortlists = JSON.parse(localStorage.getItem('shortlists') || '[]');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 今日已匹配的请求
    const todayMatched = requests.filter(request => {
      if (request.status !== 'matched') return false;
      const matchDate = new Date(request.matchedAt || request.updatedAt || request.createdAt);
      matchDate.setHours(0, 0, 0, 0);
      return matchDate.getTime() === today.getTime();
    });
    
    // 本月匹配总数
    const currentMonth = new Date().getMonth();
    const thisMonthMatched = requests.filter(request => {
      if (request.status !== 'matched') return false;
      const matchDate = new Date(request.matchedAt || request.updatedAt || request.createdAt);
      return matchDate.getMonth() === currentMonth;
    });
    
    return {
      total: todayMatched.length,
      change: thisMonthMatched.length,
      trend: thisMonthMatched.length > 0 ? 'up' : 'neutral'
    };
  }
  
  // 获取待审核统计
  static getPendingStats() {
    const requests = JSON.parse(localStorage.getItem('requests') || '[]');
    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    
    // 待审核的请求
    const pendingRequests = requests.filter(request => 
      request.status === 'pending'
    );
    
    // 待审核的用户（可能有账户激活等）
    const pendingUsers = registeredUsers.filter(user => 
      user.status === 'pending' || user.emailVerified === false
    );
    
    const totalPending = pendingRequests.length + pendingUsers.length;
    
    // 对比上周（模拟）
    const lastWeekPending = Math.max(0, totalPending - 2); // 简单模拟
    const change = totalPending - lastWeekPending;
    
    return {
      total: totalPending,
      change: change,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
    };
  }
  
  // 获取最近活动
  static getRecentActivities() {
    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const requests = JSON.parse(localStorage.getItem('requests') || '[]');
    const shortlists = JSON.parse(localStorage.getItem('shortlists') || '[]');
    
    const activities = [];
    
    // 最近注册的用户
    const recentUsers = registeredUsers
      .sort((a, b) => new Date(b.registeredAt || b.createdAt || 0) - new Date(a.registeredAt || a.createdAt || 0))
      .slice(0, 3);
    
    recentUsers.forEach(user => {
      const timeAgo = this.getTimeAgo(user.registeredAt || user.createdAt);
      activities.push({
        icon: '👤',
        content: `新用户注册 - ${user.name}`,
        time: timeAgo,
        type: 'user_register'
      });
    });
    
    // 最近的请求
    const recentRequests = requests
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 3);
    
    recentRequests.forEach(request => {
      const timeAgo = this.getTimeAgo(request.createdAt);
      const icon = request.status === 'matched' ? '✅' : '📋';
      const content = request.status === 'matched' 
        ? `${request.category}请求已匹配`
        : `新服务请求 - ${request.category}`;
      
      activities.push({
        icon,
        content,
        time: timeAgo,
        type: request.status === 'matched' ? 'request_matched' : 'request_created'
      });
    });
    
    // 按时间排序，取最新的5个
    return activities
      .sort((a, b) => {
        // 这里简化处理，实际应该基于真实时间戳排序
        const timeOrder = { '刚刚': 0, '分钟前': 1, '小时前': 2, '天前': 3, '周前': 4 };
        const aTime = Object.keys(timeOrder).find(key => a.time.includes(key)) || '周前';
        const bTime = Object.keys(timeOrder).find(key => b.time.includes(key)) || '周前';
        return timeOrder[aTime] - timeOrder[bTime];
      })
      .slice(0, 5);
  }
  
  // 计算时间差
  static getTimeAgo(dateString) {
    if (!dateString) return '未知时间';
    
    const now = new Date();
    const date = new Date(dateString);
    const diff = now - date;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return `${Math.floor(days / 7)}周前`;
  }
  
  // 获取完整的仪表板数据
  static getDashboardData() {
    const userStats = this.getUserStats();
    const requestStats = this.getRequestStats();
    const matchStats = this.getTodayMatchStats();
    const pendingStats = this.getPendingStats();
    const recentActivities = this.getRecentActivities();
    
    return {
      stats: [
        {
          title: '总用户数',
          value: userStats.total.toLocaleString(),
          change: `+${userStats.change}`,
          trend: userStats.trend,
          icon: '👥',
          color: 'primary'
        },
        {
          title: '活跃请求',
          value: requestStats.total.toString(),
          change: `+${requestStats.change}`,
          trend: requestStats.trend,
          icon: '📋',
          color: 'secondary'
        },
        {
          title: '今日匹配',
          value: matchStats.total.toString(),
          change: `+${matchStats.change}`,
          trend: matchStats.trend,
          icon: '✅',
          color: 'success'
        },
        {
          title: '待审核',
          value: pendingStats.total.toString(),
          change: pendingStats.change >= 0 ? `+${pendingStats.change}` : pendingStats.change.toString(),
          trend: pendingStats.trend,
          icon: '⏳',
          color: 'warning'
        }
      ],
      activities: recentActivities
    };
  }
}

// 初始化一些示例数据（如果不存在的话）
export const initializeSampleData = () => {
  // 检查是否已有数据
  const existingUsers = localStorage.getItem('registeredUsers');
  const existingRequests = localStorage.getItem('requests');
  
  if (!existingUsers) {
    // 创建一些示例用户数据
    const sampleUsers = [
      {
        id: 1,
        name: '张三',
        email: 'zhang@example.com',
        userType: 'pin',
        status: 'active',
        registeredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7天前
        password: '123456'
      },
      {
        id: 2,
        name: '李四',
        email: 'li@example.com',
        userType: 'csr',
        status: 'active',
        registeredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3天前
        password: '123456'
      },
      {
        id: 3,
        name: '王五',
        email: 'wang@example.com',
        userType: 'pin',
        status: 'active',
        registeredAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1小时前
        password: '123456'
      }
    ];
    
    localStorage.setItem('registeredUsers', JSON.stringify(sampleUsers));
  }
  
  if (!existingRequests) {
    // 创建一些示例请求数据
    const sampleRequests = [
      {
        id: 1,
        category: '医疗陪同',
        status: 'matched',
        userId: 1,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        matchedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        category: '购物协助',
        status: 'pending',
        userId: 1,
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      {
        id: 3,
        category: '交通接送',
        status: 'matched',
        userId: 3,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        matchedAt: new Date().toISOString()
      }
    ];
    
    localStorage.setItem('requests', JSON.stringify(sampleRequests));
  }
};