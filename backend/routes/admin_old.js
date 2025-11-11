const express = require('express');
const { body, query, validationResult } = require('express-validator');
const User = require('../models/User');
const Request = require('../models/Request');
const Category = require('../models/Category');
const { asyncHandler, createError } = require('../middleware/errorHandler');
const { authorize } = require('../middleware/auth');

const router = express.Router();

// 所有管理员路由都需要管理员权限
router.use(authorize('admin'));

// 验证错误处理
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return res.status(400).json({
      success: false,
      error: errorMessages.join(', '),
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }
  next();
};

// ==================== 系统统计和仪表板 ====================

// @desc    获取系统总览统计
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
router.get('/dashboard', asyncHandler(async (req, res) => {
  // 计算时间范围
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // 上月同期
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
  const lastMonthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
  
  // 本月
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const [
    userStats,
    requestStats,
    todayStats,
    monthlyGrowth,
    recentActivity,
    pendingApprovals
  ] = await Promise.all([
    // 总用户统计
    User.aggregate([
      {
        $group: {
          _id: '$userType',
          count: { $sum: 1 },
          active: {
            $sum: {
              $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
            }
          },
          suspended: {
            $sum: {
              $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0]
            }
          }
        }
      }
    ]),

    // 总请求统计
    Request.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]),

    // 今日统计
    Promise.all([
      User.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      Request.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      Request.countDocuments({ 
        status: 'matched', 
        matchedAt: { $gte: today, $lt: tomorrow } 
      }),
      Request.countDocuments({ 
        status: 'completed', 
        completedAt: { $gte: today, $lt: tomorrow } 
      })
    ]),

    // 月度增长统计
    Promise.all([
      User.countDocuments({ createdAt: { $gte: thisMonthStart } }),
      User.countDocuments({ createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd } }),
      Request.countDocuments({ createdAt: { $gte: thisMonthStart } }),
      Request.countDocuments({ createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd } }),
      Request.countDocuments({ 
        status: 'completed', 
        completedAt: { $gte: thisMonthStart } 
      }),
      Request.countDocuments({ 
        status: 'completed', 
        completedAt: { $gte: lastMonthStart, $lt: lastMonthEnd } 
      })
    ]),

    // 最近活动（混合用户注册和请求状态变更）
    Promise.all([
      User.find({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email userType createdAt'),
      Request.find({ 
        $or: [
          { status: 'matched', matchedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
          { status: 'completed', completedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
          { createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
        ]
      })
        .populate('requester', 'name email')
        .populate('volunteer', 'name email')
        .sort({ updatedAt: -1 })
        .limit(5)
        .select('title status category createdAt matchedAt completedAt requester volunteer')
    ]),

    // 待审核项目
    Request.countDocuments({ status: 'pending' })
  ]);

  // 格式化用户统计
  const userStatsFormatted = {
    total: 0,
    pin: { total: 0, active: 0, suspended: 0 },
    csr: { total: 0, active: 0, suspended: 0 },
    admin: { total: 0, active: 0, suspended: 0 }
  };

  userStats.forEach(stat => {
    userStatsFormatted.total += stat.count;
    userStatsFormatted[stat._id] = {
      total: stat.count,
      active: stat.active,
      suspended: stat.suspended
    };
  });

  // 格式化请求统计
  const requestStatsFormatted = {
    total: 0,
    pending: 0,
    matched: 0,
    completed: 0,
    cancelled: 0,
    expired: 0
  };

  requestStats.forEach(stat => {
    requestStatsFormatted.total += stat.count;
    requestStatsFormatted[stat._id] = stat.count;
  });

  // 解构今日统计数据
  const [todayUsers, todayRequests, todayMatched, todayCompleted] = todayStats;

  // 解构月度增长数据
  const [
    thisMonthUsers, lastMonthUsers, 
    thisMonthRequests, lastMonthRequests,
    thisMonthCompleted, lastMonthCompleted
  ] = monthlyGrowth;

  // 计算增长率
  const calculateGrowth = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // 格式化最近活动
  const [recentUsers, recentRequests] = recentActivity;
  const combinedActivity = [];

  // 添加用户注册活动
  recentUsers.forEach(user => {
    combinedActivity.push({
      type: 'user_registration',
      title: `新用户注册 - ${user.name}`,
      user: user.name,
      userType: user.userType,
      time: user.createdAt,
      icon: 'user',
      description: `${user.userType.toUpperCase()}用户 ${user.name} 已注册`
    });
  });

  // 添加请求活动
  recentRequests.forEach(request => {
    let title, icon, description;
    
    switch (request.status) {
      case 'pending':
        title = `新服务请求 - ${request.title}`;
        icon = 'file';
        description = `${request.requester?.name || '用户'} 创建了新的服务请求`;
        break;
      case 'matched':
        title = `服务请求已匹配 - ${request.title}`;
        icon = 'check';
        description = `${request.volunteer?.name || '志愿者'} 接受了服务请求`;
        break;
      case 'completed':
        title = `服务已完成 - ${request.title}`;
        icon = 'check-circle';
        description = `服务请求已成功完成`;
        break;
      default:
        title = `服务请求更新 - ${request.title}`;
        icon = 'activity';
        description = `服务请求状态已更新`;
    }

    combinedActivity.push({
      type: 'request_update',
      title,
      requestId: request._id,
      status: request.status,
      time: request.matchedAt || request.completedAt || request.createdAt,
      icon,
      description
    });
  });

  // 按时间排序并限制数量
  combinedActivity.sort((a, b) => new Date(b.time) - new Date(a.time));
  const limitedActivity = combinedActivity.slice(0, 10);

  res.json({
    success: true,
    data: {
      // 主要统计卡片
      stats: {
        totalUsers: {
          current: userStatsFormatted.total,
          growth: calculateGrowth(thisMonthUsers, lastMonthUsers),
          trend: thisMonthUsers >= lastMonthUsers ? 'up' : 'down'
        },
        activeRequests: {
          current: requestStatsFormatted.pending + requestStatsFormatted.matched,
          growth: calculateGrowth(thisMonthRequests, lastMonthRequests),
          trend: thisMonthRequests >= lastMonthRequests ? 'up' : 'down'
        },
        todayMatched: {
          current: todayMatched,
          growth: calculateGrowth(thisMonthCompleted, lastMonthCompleted),
          trend: thisMonthCompleted >= lastMonthCompleted ? 'up' : 'down'
        },
        pendingApprovals: {
          current: pendingApprovals,
          growth: 0, // 待审核项不显示增长
          trend: 'neutral'
        }
      },
      
      // 详细统计
      users: userStatsFormatted,
      requests: requestStatsFormatted,
      
      // 今日统计
      today: {
        newUsers: todayUsers,
        newRequests: todayRequests,
        matched: todayMatched,
        completed: todayCompleted
      },
      
      // 月度增长
      monthlyGrowth: {
        users: {
          current: thisMonthUsers,
          previous: lastMonthUsers,
          growth: calculateGrowth(thisMonthUsers, lastMonthUsers)
        },
        requests: {
          current: thisMonthRequests,
          previous: lastMonthRequests,
          growth: calculateGrowth(thisMonthRequests, lastMonthRequests)
        },
        completed: {
          current: thisMonthCompleted,
          previous: lastMonthCompleted,
          growth: calculateGrowth(thisMonthCompleted, lastMonthCompleted)
        }
      },
      
      // 最近活动
      recentActivity: limitedActivity,
      
      // 系统健康状态
      systemHealth: {
        totalUsers: userStatsFormatted.total,
        activeUsers: userStatsFormatted.pin.active + userStatsFormatted.csr.active,
        pendingRequests: requestStatsFormatted.pending,
        activeRequests: requestStatsFormatted.matched,
        completionRate: requestStatsFormatted.total > 0 
          ? Math.round((requestStatsFormatted.completed / requestStatsFormatted.total) * 100)
          : 0
      }
    }
  });
}));

// @desc    获取仪表板统计卡片数据
// @route   GET /api/admin/stats-cards
// @access  Private (Admin only)
router.get('/stats-cards', asyncHandler(async (req, res) => {
  // 计算时间范围
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // 上月同期
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
  const lastMonthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
  
  // 本月
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    activeRequests,
    todayMatched,
    pendingApprovals,
    monthlyGrowthData
  ] = await Promise.all([
    // 总用户数
    User.countDocuments(),
    
    // 活跃请求数（待匹配 + 已匹配）
    Request.countDocuments({ status: { $in: ['pending', 'matched'] } }),
    
    // 今日匹配数
    Request.countDocuments({ 
      status: 'matched', 
      matchedAt: { $gte: today, $lt: tomorrow } 
    }),
    
    // 待审核数
    Request.countDocuments({ status: 'pending' }),
    
    // 月度增长数据
    Promise.all([
      User.countDocuments({ createdAt: { $gte: thisMonthStart } }),
      User.countDocuments({ createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd } }),
      Request.countDocuments({ createdAt: { $gte: thisMonthStart } }),
      Request.countDocuments({ createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd } }),
      Request.countDocuments({ 
        status: 'matched', 
        matchedAt: { $gte: thisMonthStart } 
      }),
      Request.countDocuments({ 
        status: 'matched', 
        matchedAt: { $gte: lastMonthStart, $lt: lastMonthEnd } 
      })
    ])
  ]);

  // 解构月度增长数据
  const [
    thisMonthUsers, lastMonthUsers,
    thisMonthRequests, lastMonthRequests,
    thisMonthMatched, lastMonthMatched
  ] = monthlyGrowthData;

  // 计算增长率
  const calculateGrowth = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // 格式化卡片数据
  const statsCards = [
    {
      title: '总用户数',
      value: totalUsers,
      growth: calculateGrowth(thisMonthUsers, lastMonthUsers),
      trend: thisMonthUsers >= lastMonthUsers ? 'up' : 'down',
      icon: 'users',
      color: 'blue',
      subtitle: `+${thisMonthUsers} 本月`
    },
    {
      title: '活跃请求',
      value: activeRequests,
      growth: calculateGrowth(thisMonthRequests, lastMonthRequests),
      trend: thisMonthRequests >= lastMonthRequests ? 'up' : 'down',
      icon: 'activity',
      color: 'green',
      subtitle: `+${thisMonthRequests} 本月`
    },
    {
      title: '今日匹配',
      value: todayMatched,
      growth: calculateGrowth(thisMonthMatched, lastMonthMatched),
      trend: thisMonthMatched >= lastMonthMatched ? 'up' : 'down',
      icon: 'check-circle',
      color: 'teal',
      subtitle: `+${thisMonthMatched} 本月`
    },
    {
      title: '待审核',
      value: pendingApprovals,
      growth: 0, // 待审核不显示增长
      trend: 'neutral',
      icon: 'clock',
      color: 'orange',
      subtitle: '需要处理'
    }
  ];

  res.json({
    success: true,
    data: {
      cards: statsCards,
      lastUpdated: new Date(),
      period: '本月对比上月'
    }
  });
}));

// @desc    获取最近活动
// @route   GET /api/admin/recent-activity
// @access  Private (Admin only)
router.get('/recent-activity', 
  [
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('限制数量必须在1-50之间')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [recentUsers, recentRequests, recentMatches] = await Promise.all([
      // 新用户注册
      User.find({ createdAt: { $gte: twentyFourHoursAgo } })
        .sort({ createdAt: -1 })
        .limit(Math.ceil(limit / 3))
        .select('name email userType createdAt'),

      // 新请求
      Request.find({ createdAt: { $gte: twentyFourHoursAgo } })
        .populate('requester', 'name email')
        .sort({ createdAt: -1 })
        .limit(Math.ceil(limit / 3))
        .select('title category createdAt requester'),

      // 最近匹配和完成
      Request.find({ 
        $or: [
          { status: 'matched', matchedAt: { $gte: twentyFourHoursAgo } },
          { status: 'completed', completedAt: { $gte: twentyFourHoursAgo } }
        ]
      })
        .populate('requester', 'name email')
        .populate('volunteer', 'name email')
        .sort({ updatedAt: -1 })
        .limit(Math.ceil(limit / 3))
        .select('title status matchedAt completedAt requester volunteer')
    ]);

    // 格式化活动数据
    const activities = [];

    // 添加用户注册活动
    recentUsers.forEach(user => {
      activities.push({
        id: `user_${user._id}`,
        type: 'user_registration',
        title: `新用户注册 - ${user.name}`,
        description: `${user.userType.toUpperCase()}用户已注册`,
        user: {
          name: user.name,
          email: user.email,
          type: user.userType
        },
        timestamp: user.createdAt,
        icon: 'user-plus',
        color: 'blue',
        timeAgo: getTimeAgo(user.createdAt)
      });
    });

    // 添加新请求活动
    recentRequests.forEach(request => {
      activities.push({
        id: `request_${request._id}`,
        type: 'new_request',
        title: `新服务请求 - ${request.title}`,
        description: `${request.requester?.name || '用户'} 创建了新的服务请求`,
        request: {
          id: request._id,
          title: request.title,
          category: request.category
        },
        user: request.requester,
        timestamp: request.createdAt,
        icon: 'file-plus',
        color: 'green',
        timeAgo: getTimeAgo(request.createdAt)
      });
    });

    // 添加匹配和完成活动
    recentMatches.forEach(request => {
      if (request.status === 'matched') {
        activities.push({
          id: `match_${request._id}`,
          type: 'request_matched',
          title: `医疗陪同请求已匹配`,
          description: `${request.volunteer?.name || '志愿者'} 接受了服务请求`,
          request: {
            id: request._id,
            title: request.title
          },
          volunteer: request.volunteer,
          timestamp: request.matchedAt,
          icon: 'check',
          color: 'teal',
          timeAgo: getTimeAgo(request.matchedAt)
        });
      } else if (request.status === 'completed') {
        activities.push({
          id: `complete_${request._id}`,
          type: 'request_completed',
          title: `新服务请求 - 购物协助`,
          description: `服务请求已成功完成`,
          request: {
            id: request._id,
            title: request.title
          },
          timestamp: request.completedAt,
          icon: 'check-circle',
          color: 'green',
          timeAgo: getTimeAgo(request.completedAt)
        });
      }
    });

    // 按时间排序并限制数量
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const limitedActivities = activities.slice(0, limit);

    res.json({
      success: true,
      data: {
        activities: limitedActivities,
        total: activities.length,
        limit,
        lastUpdated: new Date()
      }
    });
  })
);

// 辅助函数：计算时间差
function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return date.toLocaleDateString('zh-CN');
}

// @desc    获取详细报告
// @route   GET /api/admin/reports
// @access  Private (Admin only)
router.get('/reports',
  [
    query('period').optional().isIn(['day', 'week', 'month', 'year']).withMessage('时间段必须是 day, week, month 或 year'),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { period = 'month', startDate, endDate } = req.query;
    
    // 计算时间范围
    let start, end;
    const now = new Date();
    
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      switch (period) {
        case 'day':
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
          break;
        case 'week':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          end = now;
          break;
        case 'month':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'year':
          start = new Date(now.getFullYear(), 0, 1);
          end = new Date(now.getFullYear() + 1, 0, 0);
          break;
      }
    }

    const [
      userRegistrations,
      requestsByCategory,
      requestsByUrgency,
      completionRates,
      topVolunteers,
      topRequesters
    ] = await Promise.all([
      // 用户注册趋势
      User.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]),

      // 请求分类统计
      Request.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            completed: {
              $sum: {
                $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
              }
            }
          }
        }
      ]),

      // 紧急程度统计
      Request.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: '$urgency',
            count: { $sum: 1 }
          }
        }
      ]),

      // 完成率统计
      Request.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: {
              $sum: {
                $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
              }
            },
            matched: {
              $sum: {
                $cond: [{ $eq: ['$status', 'matched'] }, 1, 0]
              }
            },
            cancelled: {
              $sum: {
                $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0]
              }
            }
          }
        }
      ]),

      // 活跃志愿者
      User.aggregate([
        {
          $match: {
            userType: 'csr',
            'stats.completedServices': { $gt: 0 }
          }
        },
        {
          $sort: { 'stats.completedServices': -1 }
        },
        {
          $limit: 10
        },
        {
          $project: {
            name: 1,
            email: 1,
            completedServices: '$stats.completedServices',
            totalVolunteered: '$stats.totalVolunteered'
          }
        }
      ]),

      // 活跃请求者
      User.aggregate([
        {
          $match: {
            userType: 'pin',
            'stats.totalRequests': { $gt: 0 }
          }
        },
        {
          $sort: { 'stats.totalRequests': -1 }
        },
        {
          $limit: 10
        },
        {
          $project: {
            name: 1,
            email: 1,
            totalRequests: '$stats.totalRequests',
            completedRequests: '$stats.completedRequests'
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        period: { start, end, type: period },
        userRegistrations,
        requestsByCategory,
        requestsByUrgency,
        completionRates: completionRates[0] || { total: 0, completed: 0, matched: 0, cancelled: 0 },
        topVolunteers,
        topRequesters
      }
    });
  })
);

// ==================== 用户管理 ====================

// @desc    获取所有用户列表（管理员视角）
// @route   GET /api/admin/users
// @access  Private (Admin only)
router.get('/users', asyncHandler(async (req, res) => {
  const users = await User.find({ 
    status: { $ne: 'deleted' } // 不返回已删除的用户
  }).select('-password').sort({ createdAt: -1 });
  
  res.json({
    success: true,
    data: users
  });
}));

// @desc    获取用户详细信息（管理员视角）
// @route   GET /api/admin/users/:id
// @access  Private (Admin only)
router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    throw createError.notFound('用户未找到');
  }

  // 获取用户相关的请求
  const userRequests = await Request.find({
    $or: [
      { requester: user._id },
      { 'assignedVolunteers.volunteer': user._id }
    ]
  }).populate('requester', 'name email')
    .populate('assignedVolunteers.volunteer', 'name email')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: {
      user,
      requests: userRequests
    }
  });
}));

// @desc    批量操作用户
// @route   POST /api/admin/users/batch
// @access  Private (Admin only)
router.post('/users/batch',
  [
    body('action').isIn(['suspend', 'activate', 'delete']).withMessage('操作必须是 suspend, activate 或 delete'),
    body('userIds').isArray({ min: 1 }).withMessage('用户ID列表不能为空'),
    body('userIds.*').isMongoId().withMessage('无效的用户ID')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { action, userIds } = req.body;

    // 检查是否包含管理员账户
    const users = await User.find({ _id: { $in: userIds } });
    const hasAdmin = users.some(user => user.userType === 'admin');

    if (hasAdmin) {
      throw createError.badRequest('不能对管理员账户执行批量操作');
    }

    let updateData = {};
    let message = '';

    switch (action) {
      case 'suspend':
        updateData = { status: 'suspended' };
        message = `${userIds.length} 个用户已被暂停`;
        break;
      case 'activate':
        updateData = { status: 'active' };
        message = `${userIds.length} 个用户已被激活`;
        break;
      case 'delete':
        updateData = { status: 'deleted' };
        message = `${userIds.length} 个用户已被删除`;
        break;
    }

    await User.updateMany(
      { _id: { $in: userIds } },
      updateData
    );

    res.json({
      success: true,
      message
    });
  })
);

// ==================== 请求管理 ====================

// @desc    获取所有请求列表（管理员视角）
// @route   GET /api/admin/requests
// @access  Private (Admin only)
router.get('/requests', asyncHandler(async (req, res) => {
  const requests = await Request.find({})
    .populate('requester', 'name email phone address userType')
    .populate('category', 'name')
    .populate('assignedVolunteers.volunteer', 'name email phone userType')
    .sort({ createdAt: -1 });
  
  res.json({
    success: true,
    data: requests
  });
}));

// @desc    强制完成请求
// @route   POST /api/admin/requests/:id/force-complete
// @access  Private (Admin only)
router.post('/requests/:id/force-complete', asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id);

  if (!request) {
    throw createError.notFound('请求未找到');
  }

  await request.markCompleted({
    notes: '管理员强制完成',
    completedBy: 'admin'
  });

  res.json({
    success: true,
    message: '请求已强制完成'
  });
}));

// @desc    管理员取消请求
// @route   POST /api/admin/requests/:id/cancel
// @access  Private (Admin only)
router.post('/requests/:id/cancel',
  [
    body('reason').trim().notEmpty().withMessage('取消原因不能为空')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { reason } = req.body;
    
    const request = await Request.findById(req.params.id);

    if (!request) {
      throw createError.notFound('请求未找到');
    }

    request.status = 'cancelled';
    request.cancellationReason = reason;
    request.cancelledBy = req.user._id;
    request.cancelledAt = new Date();

    await request.save();

    res.json({
      success: true,
      message: '请求已被管理员取消'
    });
  })
);

// ==================== 系统设置 ====================

// @desc    获取系统设置
// @route   GET /api/admin/settings
// @access  Private (Admin only)
router.get('/settings', asyncHandler(async (req, res) => {
  // 这里可以从配置文件或数据库获取系统设置
  const settings = {
    system: {
      maintenance: false,
      registrationEnabled: true,
      emailVerificationRequired: false,
      autoMatchEnabled: false
    },
    limits: {
      maxRequestsPerUser: 10,
      maxVolunteersPerRequest: 5,
      requestExpirationDays: 30
    },
    notifications: {
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true
    }
  };

  res.json({
    success: true,
    data: { settings }
  });
}));

// @desc    更新系统设置
// @route   PUT /api/admin/settings
// @access  Private (Admin only)
router.put('/settings',
  [
    body('system.maintenance').optional().isBoolean(),
    body('system.registrationEnabled').optional().isBoolean(),
    body('limits.maxRequestsPerUser').optional().isInt({ min: 1, max: 100 }),
    body('limits.maxVolunteersPerRequest').optional().isInt({ min: 1, max: 20 })
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    // 这里应该将设置保存到配置文件或数据库
    // 目前仅返回成功响应
    
    res.json({
      success: true,
      message: '系统设置已更新',
      data: { settings: req.body }
    });
  })
);

// ==================== 数据导出 ====================

// @desc    导出数据
// @route   GET /api/admin/export
// @access  Private (Admin only)
router.get('/export',
  [
    query('type').isIn(['users', 'requests', 'all']).withMessage('导出类型必须是 users, requests 或 all'),
    query('format').optional().isIn(['json', 'csv']).withMessage('格式必须是 json 或 csv')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { type, format = 'json' } = req.query;

    let data = {};

    switch (type) {
      case 'users':
        data.users = await User.find().select('-password');
        break;
      case 'requests':
        data.requests = await Request.find()
          .populate('requester', 'name email')
          .populate('assignedVolunteers.volunteer', 'name email');
        break;
      case 'all':
        data.users = await User.find().select('-password');
        data.requests = await Request.find()
          .populate('requester', 'name email')
          .populate('assignedVolunteers.volunteer', 'name email');
        break;
    }

    if (format === 'csv') {
      // 这里应该实现CSV导出逻辑
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}_${Date.now()}.csv"`);
      res.send('CSV导出功能待实现');
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${type}_${Date.now()}.json"`);
      res.json(data);
    }
  })
);

module.exports = router;