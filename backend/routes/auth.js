const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { 
  registerValidation, 
  loginValidation, 
  updateProfileValidation, 
  changePasswordValidation,
  handleValidationErrors 
} = require('../middleware/validation');

const router = express.Router();

/**
 * Boundary Layer - 认证路由
 * 负责路由映射和中间件组织，不包含业务逻辑
 */

// @desc    用户注册
// @route   POST /api/auth/register
// @access  Public
router.post('/register', 
  registerValidation, 
  handleValidationErrors, 
  authController.register
);

// @desc    用户登录
// @route   POST /api/auth/login
// @access  Public
router.post('/login', 
  loginValidation, 
  handleValidationErrors, 
  authController.login
);

// @desc    获取当前用户信息
// @route   GET /api/auth/me
// @access  Private
router.get('/me', 
  authenticate, 
  authController.getCurrentUser
);

// @desc    更新用户资料
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', 
  authenticate,
  updateProfileValidation,
  handleValidationErrors,
  authController.updateProfile
);

// @desc    修改密码
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password',
  authenticate,
  changePasswordValidation,
  handleValidationErrors,
  authController.changePassword
);

// @desc    登出（客户端处理，服务端记录）
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', 
  authenticate, 
  authController.logout
);

module.exports = router;