const express = require('express');
const { body, query } = require('express-validator');
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { 
  getUsersValidation, 
  updateUserValidation,
  handleValidationErrors 
} = require('../middleware/validation');

const router = express.Router();

/**
 * Boundary Layer - 用户路由
 * 负责路由映射和中间件组织，不包含业务逻辑
 */

// @desc    获取用户列表
// @route   GET /api/users
// @access  Private (Admin only)
router.get('/', 
  authorize('admin'),
  getUsersValidation,
  handleValidationErrors,
  userController.getUsers
);

// @desc    获取用户收藏夹
// @route   GET /api/users/shortlist
// @access  Private (CSR users only)
router.get('/shortlist',
  authorize('csr'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 })
  ],
  handleValidationErrors,
  userController.getShortlist
);

// @desc    获取用户历史记录
// @route   GET /api/users/history
// @access  Private
router.get('/history',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('category').optional().isIn(['medical', 'transportation', 'shopping', 'household', 'technology', 'companion', 'other']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  handleValidationErrors,
  userController.getHistory
);

// @desc    检查是否已收藏
// @route   GET /api/users/shortlist/:requestId/check
// @access  Private (CSR users only)
router.get('/shortlist/:requestId/check',
  authorize('csr'),
  userController.checkShortlist
);

// @desc    获取单个用户信息
// @route   GET /api/users/:id
// @access  Private (Owner or Admin)
router.get('/:id', 
  userController.getUserById
);

// @desc    获取用户统计信息
// @route   GET /api/users/:id/stats
// @access  Private (Owner or Admin)
router.get('/:id/stats', 
  userController.getUserStats
);

// @desc    更新用户状态
// @route   PUT /api/users/:id/status
// @access  Private (Admin only)
router.put('/:id/status',
  authorize('admin'),
  [
    body('status')
      .isIn(['active', 'suspended', 'deleted'])
      .withMessage('状态必须是 active, suspended 或 deleted')
  ],
  handleValidationErrors,
  userController.updateUserStatus
);

// @desc    添加到收藏夹
// @route   POST /api/users/shortlist/:requestId
// @access  Private (CSR users only)
router.post('/shortlist/:requestId',
  authorize('csr'),
  [
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('备注不能超过500个字符'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('标签必须是数组格式')
  ],
  handleValidationErrors,
  userController.addToShortlist
);

// @desc    更新收藏项备注
// @route   PUT /api/users/shortlist/:requestId
// @access  Private (CSR users only)
router.put('/shortlist/:requestId',
  authorize('csr'),
  [
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('备注不能超过500个字符'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('标签必须是数组格式')
  ],
  handleValidationErrors,
  userController.updateShortlist
);

// @desc    从收藏夹移除
// @route   DELETE /api/users/shortlist/:requestId
// @access  Private (CSR users only)
router.delete('/shortlist/:requestId',
  authorize('csr'),
  userController.removeFromShortlist
);

// @desc    删除用户
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
router.delete('/:id',
  authorize('admin'),
  userController.deleteUser
);

module.exports = router;