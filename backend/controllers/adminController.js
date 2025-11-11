/**
 * Admin Controller - BCE架构 Control层
 * 
 * 管理员控制器，处理两种管理员角色的业务逻辑：
 * 1. System Admin (系统管理员) - 技术保障与系统维护
 * 2. Platform Manager (平台管理者) - 业务运营与战略分析
 * 
 * 注意：userType 直接使用 'system_admin' 和 'platform_manager'，
 *      不再有通用的 'admin' 类型
 */

const User = require('../models/User');
const Request = require('../models/Request');
const Category = require('../models/Category');
const Shortlist = require('../models/Shortlist');
const { createError } = require('../middleware/errorHandler');

// ==================== 通用管理员功能 ====================

/**
 * @desc    获取系统总览统计 (Both roles)
 * @access  Private (Admin)
 */
const getDashboardStats = async (req, res) => {
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
  const lastMonthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
  
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

    // 最近活动
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
    system_admin: { total: 0, active: 0, suspended: 0 },
    platform_manager: { total: 0, active: 0, suspended: 0 }
  };

  userStats.forEach(stat => {
    userStatsFormatted.total += stat.count;
    if (userStatsFormatted[stat._id]) {
      userStatsFormatted[stat._id] = {
        total: stat.count,
        active: stat.active,
        suspended: stat.suspended
      };
    }
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

  const [todayUsers, todayRequests, todayMatched, todayCompleted] = todayStats;
  const [
    thisMonthUsers, lastMonthUsers, 
    thisMonthRequests, lastMonthRequests,
    thisMonthCompleted, lastMonthCompleted
  ] = monthlyGrowth;

  const calculateGrowth = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const [recentUsers, recentRequests] = recentActivity;
  const combinedActivity = [];

  recentUsers.forEach(user => {
    combinedActivity.push({
      type: 'user_registration',
      title: `新用户注册 - ${user.name}`,
      user: user.name,
      userType: user.userType,
      timestamp: user.createdAt
    });
  });

  recentRequests.forEach(request => {
    combinedActivity.push({
      type: 'request_update',
      title: request.title,
      status: request.status,
      requester: request.requester?.name,
      volunteer: request.volunteer?.name,
      timestamp: request.matchedAt || request.completedAt || request.createdAt
    });
  });

  combinedActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  res.status(200).json({
    success: true,
    data: {
      users: userStatsFormatted,
      requests: requestStatsFormatted,
      today: {
        newUsers: todayUsers,
        newRequests: todayRequests,
        matched: todayMatched,
        completed: todayCompleted
      },
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
      recentActivity: combinedActivity.slice(0, 10),
      pendingApprovals
    }
  });
};

// ==================== System Admin 专属功能 ====================
// 核心职责：技术保障与系统维护
// 用户故事：#48 (配置警报), #50 (查看用户列表), #51 (监控登录), 
//           #52 (停用账户), #55/#70 (创建/更新用户), #56 (文件限制)

/**
 * @desc    获取所有用户列表 (#50)
 * @access  Private (System Admin only)
 */
const getAllUsers = async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    userType, 
    status, 
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const query = {};
  
  if (userType) query.userType = userType;
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const [users, total] = await Promise.all([
    User.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-password'),
    User.countDocuments(query)
  ]);

  res.status(200).json({
    success: true,
    data: {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
};

/**
 * @desc    创建新用户 (#55, #70)
 * @access  Private (System Admin only)
 */
const createUser = async (req, res) => {
  const { email, userType } = req.body;

  // 检查邮箱是否已存在
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw createError('Email already registered', 400, 'EMAIL_EXISTS');
  }

  // 创建用户
  const user = await User.create(req.body);

  // 不返回密码
  const userResponse = user.toObject();
  delete userResponse.password;

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: { user: userResponse }
  });
};

/**
 * @desc    更新用户信息 (#70)
 * @access  Private (System Admin only)
 */
const updateUser = async (req, res) => {
  const { userId } = req.params;
  const updates = req.body;

  // 不允许通过此接口修改密码
  delete updates.password;

  // 检查用户是否存在
  const user = await User.findById(userId);
  if (!user) {
    throw createError('User not found', 404, 'USER_NOT_FOUND');
  }

  // 更新用户
  Object.assign(user, updates);
  await user.save();

  const userResponse = user.toObject();
  delete userResponse.password;

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: { user: userResponse }
  });
};

/**
 * @desc    停用/激活用户账户 (#52)
 * @access  Private (System Admin only)
 */
const updateUserStatus = async (req, res) => {
  const { userId } = req.params;
  const { status, reason } = req.body;

  if (!['active', 'suspended', 'deleted'].includes(status)) {
    throw createError('Invalid status value', 400, 'INVALID_STATUS');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw createError('User not found', 404, 'USER_NOT_FOUND');
  }

  // 防止停用自己
  if (userId === req.user._id.toString()) {
    throw createError('Cannot modify your own account status', 403, 'SELF_MODIFICATION_DENIED');
  }

  user.status = status;
  await user.save();

  res.status(200).json({
    success: true,
    message: `User status updated to ${status}`,
    data: { 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        status: user.status
      }
    }
  });
};

/**
 * @desc    删除用户 (物理删除)
 * @access  Private (System Admin only)
 */
const deleteUser = async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    throw createError('User not found', 404, 'USER_NOT_FOUND');
  }

  // 防止删除自己
  if (userId === req.user._id.toString()) {
    throw createError('Cannot delete your own account', 403, 'SELF_DELETION_DENIED');
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: 'User permanently deleted'
  });
};

/**
 * @desc    获取系统日志和活动监控 (#51)
 * @access  Private (System Admin only)
 */
const getSystemLogs = async (req, res) => {
  const { 
    page = 1, 
    limit = 50, 
    type,
    startDate,
    endDate
  } = req.query;

  const query = {};
  
  if (type) query.type = type;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  // 收集最近登录活动
  const recentLogins = await User.find({
    lastLogin: { $exists: true, $ne: null }
  })
    .sort({ lastLogin: -1 })
    .limit(parseInt(limit))
    .select('name email userType lastLogin');

  // 收集最近失败的操作
  const failedOperations = await User.find({
    status: 'suspended',
    'suspensionReason': { $exists: true }
  })
    .sort({ updatedAt: -1 })
    .limit(20)
    .select('name email status suspensionReason updatedAt');

  res.status(200).json({
    success: true,
    data: {
      recentLogins,
      failedOperations,
      summary: {
        totalLogins: recentLogins.length,
        suspendedAccounts: failedOperations.length
      }
    }
  });
};

/**
 * @desc    配置系统警报和通知 (#48)
 * @access  Private (System Admin only)
 */
const configureAlerts = async (req, res) => {
  const { alertType, threshold, recipients, enabled } = req.body;

  // 这里应该存储到配置表或环境变量中
  // 暂时返回成功响应
  res.status(200).json({
    success: true,
    message: 'Alert configuration updated successfully',
    data: {
      alertType,
      threshold,
      recipients,
      enabled,
      updatedBy: req.user.name,
      updatedAt: new Date()
    }
  });
};

/**
 * @desc    设置文件上传限制 (#56)
 * @access  Private (System Admin only)
 */
const setFileUploadLimits = async (req, res) => {
  const { maxFileSize, allowedTypes, maxFilesPerRequest } = req.body;

  // 验证参数
  if (maxFileSize && (maxFileSize < 1 || maxFileSize > 100)) {
    throw createError('File size must be between 1MB and 100MB', 400, 'INVALID_FILE_SIZE');
  }

  // 这里应该存储到配置表或环境变量中
  res.status(200).json({
    success: true,
    message: 'File upload limits updated successfully',
    data: {
      maxFileSize: maxFileSize || 10, // MB
      allowedTypes: allowedTypes || ['image/jpeg', 'image/png', 'application/pdf'],
      maxFilesPerRequest: maxFilesPerRequest || 5,
      updatedBy: req.user.name,
      updatedAt: new Date()
    }
  });
};

// ==================== Platform Manager 专属功能 ====================
// 核心职责：业务运营与战略分析
// 用户故事：#57 (服务类别管理), #58 (生成报告), #59 (监控参与度),
//           #60 (查看统计数据), #62 (跟踪CSR绩效)

/**
 * @desc    创建/编辑/删除服务类别 (#57)
 * @access  Private (Platform Manager only)
 */
const manageCategory = async (req, res) => {
  const { action } = req.params; // create, update, delete
  const { categoryId, name, description, icon, isActive } = req.body;

  switch (action) {
    case 'create':
      const existingCategory = await Category.findOne({ name });
      if (existingCategory) {
        throw createError('Category already exists', 400, 'CATEGORY_EXISTS');
      }
      
      const category = await Category.create({ name, description, icon, isActive });
      
      return res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: { category }
      });

    case 'update':
      if (!categoryId) {
        throw createError('Category ID is required', 400, 'CATEGORY_ID_REQUIRED');
      }
      
      const updatedCategory = await Category.findByIdAndUpdate(
        categoryId,
        { name, description, icon, isActive },
        { new: true, runValidators: true }
      );
      
      if (!updatedCategory) {
        throw createError('Category not found', 404, 'CATEGORY_NOT_FOUND');
      }
      
      return res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        data: { category: updatedCategory }
      });

    case 'delete':
      if (!categoryId) {
        throw createError('Category ID is required', 400, 'CATEGORY_ID_REQUIRED');
      }
      
      // 检查是否有请求使用此类别
      const requestsUsingCategory = await Request.countDocuments({ category: categoryId });
      if (requestsUsingCategory > 0) {
        throw createError(
          `Cannot delete category. ${requestsUsingCategory} requests are using this category`,
          400,
          'CATEGORY_IN_USE'
        );
      }
      
      const deletedCategory = await Category.findByIdAndDelete(categoryId);
      if (!deletedCategory) {
        throw createError('Category not found', 404, 'CATEGORY_NOT_FOUND');
      }
      
      return res.status(200).json({
        success: true,
        message: 'Category deleted successfully'
      });

    default:
      throw createError('Invalid action', 400, 'INVALID_ACTION');
  }
};

/**
 * @desc    生成服务请求和匹配报告 (#58)
 * @access  Private (Platform Manager only)
 */
const generateReport = async (req, res) => {
  const { reportType, startDate, endDate, format = 'json' } = req.query;

  const dateQuery = {};
  if (startDate) dateQuery.$gte = new Date(startDate);
  if (endDate) dateQuery.$lte = new Date(endDate);

  let reportData = {};

  switch (reportType) {
    case 'requests':
      reportData = await Request.aggregate([
        { $match: startDate || endDate ? { createdAt: dateQuery } : {} },
        {
          $group: {
            _id: '$category',
            total: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            matched: { $sum: { $cond: [{ $eq: ['$status', 'matched'] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'categoryInfo'
          }
        }
      ]);
      break;

    case 'matching':
      const matchingStats = await Request.aggregate([
        { $match: { status: { $in: ['matched', 'completed'] } } },
        {
          $group: {
            _id: null,
            totalMatched: { $sum: 1 },
            avgMatchTime: {
              $avg: {
                $subtract: ['$matchedAt', '$createdAt']
              }
            }
          }
        }
      ]);
      reportData = matchingStats[0] || { totalMatched: 0, avgMatchTime: 0 };
      break;

    case 'participation':
      reportData = await User.aggregate([
        { $match: { userType: { $in: ['pin', 'csr'] } } },
        {
          $group: {
            _id: '$userType',
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } }
          }
        }
      ]);
      break;

    default:
      throw createError('Invalid report type', 400, 'INVALID_REPORT_TYPE');
  }

  res.status(200).json({
    success: true,
    data: {
      reportType,
      period: { startDate, endDate },
      generatedAt: new Date(),
      generatedBy: req.user.name,
      data: reportData
    }
  });
};

/**
 * @desc    监控用户参与度和增长机会 (#59)
 * @access  Private (Platform Manager only)
 */
const getParticipationMetrics = async (req, res) => {
  const { period = '30d' } = req.query;

  const daysAgo = parseInt(period) || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysAgo);

  const [
    userGrowth,
    requestTrends,
    engagementMetrics,
    inactiveUsers
  ] = await Promise.all([
    // 用户增长趋势
    User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            userType: '$userType'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]),

    // 请求趋势
    Request.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
        }
      },
      { $sort: { '_id': 1 } }
    ]),

    // 参与度指标
    Promise.all([
      User.countDocuments({ userType: 'pin', 'stats.totalRequests': { $gt: 0 } }),
      User.countDocuments({ userType: 'pin' }),
      User.countDocuments({ userType: 'csr', 'stats.totalVolunteered': { $gt: 0 } }),
      User.countDocuments({ userType: 'csr' })
    ]),

    // 不活跃用户
    User.find({
      userType: { $in: ['pin', 'csr'] },
      lastLogin: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }).countDocuments()
  ]);

  const [activePins, totalPins, activeCsrs, totalCsrs] = engagementMetrics;

  res.status(200).json({
    success: true,
    data: {
      period: `${daysAgo} days`,
      userGrowth,
      requestTrends,
      engagement: {
        pin: {
          active: activePins,
          total: totalPins,
          rate: totalPins > 0 ? ((activePins / totalPins) * 100).toFixed(2) : 0
        },
        csr: {
          active: activeCsrs,
          total: totalCsrs,
          rate: totalCsrs > 0 ? ((activeCsrs / totalCsrs) * 100).toFixed(2) : 0
        }
      },
      inactiveUsers,
      growthOpportunities: {
        message: inactiveUsers > 10 ? 'High number of inactive users detected' : 'User engagement is healthy',
        recommendation: inactiveUsers > 10 ? 'Consider re-engagement campaigns' : 'Continue current strategies'
      }
    }
  });
};

/**
 * @desc    查看系统级统计数据以改进效率 (#60)
 * @access  Private (Platform Manager only)
 */
const getEfficiencyMetrics = async (req, res) => {
  const [
    avgMatchTime,
    avgCompletionTime,
    successRate,
    categoryPerformance,
    peakUsageHours
  ] = await Promise.all([
    // 平均匹配时间
    Request.aggregate([
      { $match: { status: { $in: ['matched', 'completed'] }, matchedAt: { $exists: true } } },
      {
        $group: {
          _id: null,
          avgTime: {
            $avg: {
              $subtract: ['$matchedAt', '$createdAt']
            }
          }
        }
      }
    ]),

    // 平均完成时间
    Request.aggregate([
      { $match: { status: 'completed', completedAt: { $exists: true } } },
      {
        $group: {
          _id: null,
          avgTime: {
            $avg: {
              $subtract: ['$completedAt', '$matchedAt']
            }
          }
        }
      }
    ]),

    // 成功率
    Promise.all([
      Request.countDocuments({ status: 'completed' }),
      Request.countDocuments()
    ]),

    // 类别性能
    Request.aggregate([
      {
        $group: {
          _id: '$category',
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          avgMatchTime: {
            $avg: {
              $cond: [
                { $and: [{ $ne: ['$matchedAt', null] }, { $ne: ['$createdAt', null] }] },
                { $subtract: ['$matchedAt', '$createdAt'] },
                null
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      }
    ]),

    // 高峰使用时段
    Request.aggregate([
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ])
  ]);

  const [completedRequests, totalRequests] = successRate;
  const matchTimeMs = avgMatchTime[0]?.avgTime || 0;
  const completionTimeMs = avgCompletionTime[0]?.avgTime || 0;

  res.status(200).json({
    success: true,
    data: {
      efficiency: {
        avgMatchTime: {
          milliseconds: matchTimeMs,
          hours: (matchTimeMs / (1000 * 60 * 60)).toFixed(2),
          days: (matchTimeMs / (1000 * 60 * 60 * 24)).toFixed(2)
        },
        avgCompletionTime: {
          milliseconds: completionTimeMs,
          hours: (completionTimeMs / (1000 * 60 * 60)).toFixed(2),
          days: (completionTimeMs / (1000 * 60 * 60 * 24)).toFixed(2)
        },
        successRate: {
          completed: completedRequests,
          total: totalRequests,
          percentage: totalRequests > 0 ? ((completedRequests / totalRequests) * 100).toFixed(2) : 0
        }
      },
      categoryPerformance,
      peakUsageHours,
      recommendations: {
        efficiency: matchTimeMs > 86400000 ? 'Match time exceeds 24 hours - consider improving matching algorithm' : 'Match time is within acceptable range',
        categories: 'Review low-performing categories for optimization opportunities'
      }
    }
  });
};

/**
 * @desc    跟踪CSR代表绩效 (#62)
 * @access  Private (Platform Manager only)
 */
const getCsrPerformance = async (req, res) => {
  const { 
    sortBy = 'completedServices', 
    sortOrder = 'desc',
    limit = 20
  } = req.query;

  const sortOptions = {};
  sortOptions[`stats.${sortBy}`] = sortOrder === 'desc' ? -1 : 1;

  const csrPerformance = await User.find({ userType: 'csr' })
    .sort(sortOptions)
    .limit(parseInt(limit))
    .select('name email stats organization skills createdAt');

  // 获取每个CSR的详细统计
  const detailedStats = await Promise.all(
    csrPerformance.map(async (csr) => {
      const [
        totalServices,
        completedServices,
        avgRating,
        recentServices
      ] = await Promise.all([
        Request.countDocuments({ volunteer: csr._id }),
        Request.countDocuments({ volunteer: csr._id, status: 'completed' }),
        Request.aggregate([
          { $match: { volunteer: csr._id, rating: { $exists: true } } },
          { $group: { _id: null, avgRating: { $avg: '$rating' } } }
        ]),
        Request.find({ volunteer: csr._id })
          .sort({ completedAt: -1 })
          .limit(5)
          .select('title status completedAt rating')
      ]);

      return {
        csr: {
          _id: csr._id,
          name: csr.name,
          email: csr.email,
          organization: csr.organization,
          skills: csr.skills,
          memberSince: csr.createdAt
        },
        performance: {
          totalServices,
          completedServices,
          completionRate: totalServices > 0 ? ((completedServices / totalServices) * 100).toFixed(2) : 0,
          avgRating: avgRating[0]?.avgRating?.toFixed(2) || 'N/A',
          recentServices
        }
      };
    })
  );

  res.status(200).json({
    success: true,
    data: {
      csrPerformance: detailedStats,
      summary: {
        totalCsrs: csrPerformance.length,
        topPerformers: detailedStats.slice(0, 5).map(stat => ({
          name: stat.csr.name,
          completedServices: stat.performance.completedServices,
          rating: stat.performance.avgRating
        }))
      }
    }
  });
};

module.exports = {
  // 通用管理员功能
  getDashboardStats,
  
  // System Admin 专属
  getAllUsers,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
  getSystemLogs,
  configureAlerts,
  setFileUploadLimits,
  
  // Platform Manager 专属
  manageCategory,
  generateReport,
  getParticipationMetrics,
  getEfficiencyMetrics,
  getCsrPerformance
};
