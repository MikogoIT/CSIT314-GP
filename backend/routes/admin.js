/**
 * Admin Routes - BCE架构 Boundary层
 * 
 * 管理员路由，包含两种管理员角色：
 * 1. System Admin (系统管理员) - 技术保障与系统维护
 * 2. Platform Manager (平台管理者) - 业务运营与战略分析
 * 
 * 注意：不再使用通用的 'admin' 类型，所有管理员必须是以下之一：
 * - system_admin
 * - platform_manager
 */

const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, systemAdminOnly, platformManagerOnly, anyAdminType, adminOnly } = require('../middleware/auth');
const { 
  body, 
  param, 
  query, 
  validationResult 
} = require('express-validator');

// Import Admin Controller
const {
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
} = require('../controllers/adminController');

const router = express.Router();

// 所有路由都需要认证
router.use(authenticate);

// 验证错误处理中间件
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }
  next();
};

// ==================== 通用管理员路由 (Both Admin Types) ====================

/**
 * @route   GET /api/admin/dashboard
 * @desc    获取系统仪表板统计数据
 * @access  Private (Any Admin)
 */
router.get(
  '/dashboard',
  adminOnly,
  asyncHandler(getDashboardStats)
);

// ==================== System Admin 专属路由 ====================

/**
 * @route   GET /api/admin/users
 * @desc    获取所有用户列表 (#50)
 * @access  Private (System Admin)
 */
router.get(
  '/users',
  systemAdminOnly,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 10000 }).withMessage('Limit must be between 1 and 10000'),
    query('userType')
      .optional()
      .isIn(['pin', 'csr', 'system_admin', 'platform_manager'])
      .withMessage('Invalid user type'),
    query('status').optional().isIn(['active', 'suspended', 'deleted']).withMessage('Invalid status')
  ],
  handleValidationErrors,
  asyncHandler(getAllUsers)
);

/**
 * @route   POST /api/admin/users
 * @desc    创建新用户 (#55, #70)
 * @access  Private (System Admin)
 */
router.post(
  '/users',
  systemAdminOnly,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('userType')
      .isIn(['pin', 'csr', 'system_admin', 'platform_manager'])
      .withMessage('Invalid user type'),
    body('phone').optional().trim(),
    body('address').optional().trim()
  ],
  handleValidationErrors,
  asyncHandler(createUser)
);

/**
 * @route   PUT /api/admin/users/:userId
 * @desc    更新用户信息 (#70)
 * @access  Private (System Admin)
 */
router.put(
  '/users/:userId',
  systemAdminOnly,
  [
    param('userId').isMongoId().withMessage('Invalid user ID'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Invalid email format'),
    body('userType')
      .optional()
      .isIn(['pin', 'csr', 'system_admin', 'platform_manager'])
      .withMessage('Invalid user type'),
    body('phone').optional().trim(),
    body('address').optional().trim(),
    body('status').optional().isIn(['active', 'suspended', 'deleted']).withMessage('Invalid status')
  ],
  handleValidationErrors,
  asyncHandler(updateUser)
);

/**
 * @route   PATCH /api/admin/users/:userId/status
 * @desc    停用/激活用户账户 (#52)
 * @access  Private (System Admin)
 */
router.patch(
  '/users/:userId/status',
  systemAdminOnly,
  [
    param('userId').isMongoId().withMessage('Invalid user ID'),
    body('status').isIn(['active', 'suspended', 'deleted']).withMessage('Invalid status'),
    body('reason').optional().trim()
  ],
  handleValidationErrors,
  asyncHandler(updateUserStatus)
);

/**
 * @route   DELETE /api/admin/users/:userId
 * @desc    永久删除用户
 * @access  Private (System Admin)
 */
router.delete(
  '/users/:userId',
  systemAdminOnly,
  [
    param('userId').isMongoId().withMessage('Invalid user ID')
  ],
  handleValidationErrors,
  asyncHandler(deleteUser)
);

/**
 * @route   GET /api/admin/system/logs
 * @desc    获取系统日志和活动监控 (#51)
 * @access  Private (System Admin)
 */
router.get(
  '/system/logs',
  systemAdminOnly,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100'),
    query('type').optional().trim(),
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date')
  ],
  handleValidationErrors,
  asyncHandler(getSystemLogs)
);

/**
 * @route   POST /api/admin/system/alerts
 * @desc    配置系统警报和通知 (#48)
 * @access  Private (System Admin)
 */
router.post(
  '/system/alerts',
  systemAdminOnly,
  [
    body('alertType').notEmpty().withMessage('Alert type is required'),
    body('threshold').optional().isNumeric().withMessage('Threshold must be numeric'),
    body('recipients').optional().isArray().withMessage('Recipients must be an array'),
    body('enabled').optional().isBoolean().withMessage('Enabled must be boolean')
  ],
  handleValidationErrors,
  asyncHandler(configureAlerts)
);

/**
 * @route   POST /api/admin/system/file-limits
 * @desc    设置文件上传限制 (#56)
 * @access  Private (System Admin)
 */
router.post(
  '/system/file-limits',
  systemAdminOnly,
  [
    body('maxFileSize').optional().isInt({ min: 1, max: 100 }).withMessage('File size must be 1-100 MB'),
    body('allowedTypes').optional().isArray().withMessage('Allowed types must be an array'),
    body('maxFilesPerRequest').optional().isInt({ min: 1, max: 20 }).withMessage('Max files must be 1-20')
  ],
  handleValidationErrors,
  asyncHandler(setFileUploadLimits)
);

// ==================== Platform Manager 专属路由 ====================

/**
 * @route   POST /api/admin/categories/:action
 * @desc    创建/编辑/删除服务类别 (#57)
 * @access  Private (Platform Manager)
 */
router.post(
  '/categories/:action',
  platformManagerOnly,
  [
    param('action').isIn(['create', 'update', 'delete']).withMessage('Invalid action'),
    body('categoryId')
      .if(param('action').isIn(['update', 'delete']))
      .isMongoId()
      .withMessage('Valid category ID required for update/delete'),
    body('name')
      .if(param('action').isIn(['create', 'update']))
      .trim()
      .notEmpty()
      .withMessage('Category name is required'),
    body('description').optional().trim(),
    body('icon').optional().trim(),
    body('isActive').optional().isBoolean().withMessage('isActive must be boolean')
  ],
  handleValidationErrors,
  asyncHandler(manageCategory)
);

/**
 * @route   GET /api/admin/reports
 * @desc    生成服务请求和匹配报告 (#58)
 * @access  Private (Platform Manager)
 */
router.get(
  '/reports',
  platformManagerOnly,
  [
    query('reportType')
      .isIn(['requests', 'matching', 'participation'])
      .withMessage('Invalid report type'),
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date'),
    query('format').optional().isIn(['json', 'csv']).withMessage('Invalid format')
  ],
  handleValidationErrors,
  asyncHandler(generateReport)
);

/**
 * @route   GET /api/admin/metrics/participation
 * @desc    监控用户参与度和增长机会 (#59)
 * @access  Private (Platform Manager)
 */
router.get(
  '/metrics/participation',
  platformManagerOnly,
  [
    query('period').optional().matches(/^\d+d$/).withMessage('Period must be in format like "30d"')
  ],
  handleValidationErrors,
  asyncHandler(getParticipationMetrics)
);

/**
 * @route   GET /api/admin/metrics/efficiency
 * @desc    查看系统级统计数据以改进效率 (#60)
 * @access  Private (Platform Manager)
 */
router.get(
  '/metrics/efficiency',
  platformManagerOnly,
  asyncHandler(getEfficiencyMetrics)
);

/**
 * @route   GET /api/admin/csr/performance
 * @desc    跟踪CSR代表绩效 (#62)
 * @access  Private (Platform Manager)
 */
router.get(
  '/csr/performance',
  platformManagerOnly,
  [
    query('sortBy')
      .optional()
      .isIn(['completedServices', 'totalVolunteered', 'rating'])
      .withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Invalid sort order'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100')
  ],
  handleValidationErrors,
  asyncHandler(getCsrPerformance)
);

// ==================== 共享路由 (Both Admin Types Can Access) ====================

/**
 * @route   GET /api/admin/stats
 * @desc    获取快速统计摘要
 * @access  Private (Any Admin)
 */
router.get(
  '/stats',
  adminOnly,
  asyncHandler(getDashboardStats)
);

module.exports = router;
