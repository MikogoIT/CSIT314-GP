const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT认证中间件
const authenticate = async (req, res, next) => {
  try {
    let token;
    
    // 从请求头获取token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // 检查token是否存在
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }
    
    try {
      // 验证token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // 查找用户
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Token is valid but user not found',
          code: 'USER_NOT_FOUND'
        });
      }
      
      // 检查用户状态
      if (user.status !== 'active') {
        return res.status(401).json({
          success: false,
          error: 'User account is suspended or deleted',
          code: 'USER_SUSPENDED'
        });
      }
      
      // 将用户信息添加到请求对象
      req.user = user;
      next();
      
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

// 角色权限中间件
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    if (!roles.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required roles: ${roles.join(', ')}`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    
    next();
  };
};

// 仅管理员权限
const adminOnly = authorize('admin');

// 超级管理员权限检查
const superAdminOnly = (req, res, next) => {
  if (!req.user || req.user.userType !== 'admin' || !req.user.isSuper) {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Super administrator privileges required.',
      code: 'SUPER_ADMIN_REQUIRED'
    });
  }
  next();
};

// 权限检查中间件
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    // 超级管理员拥有所有权限
    if (req.user.isSuper) {
      return next();
    }

    // 检查用户是否有指定权限
    if (!req.user.hasPermission || !req.user.hasPermission(permission)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required permission: ${permission}`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

// PIN用户权限
const pinOnly = authorize('pin');

// CSR用户权限
const csrOnly = authorize('csr');

// PIN或CSR用户权限
const userOnly = authorize('pin', 'csr');

// 资源所有者权限（用户只能访问自己的资源）
const ownerOrAdmin = (resourceField = 'user') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    // 管理员可以访问所有资源
    if (req.user.userType === 'admin') {
      return next();
    }
    
    // 检查资源所有权
    const userId = req.user._id.toString();
    const resourceUserId = req.params[resourceField] || req.body[resourceField] || req.query[resourceField];
    
    if (resourceUserId && resourceUserId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only access your own resources.',
        code: 'RESOURCE_ACCESS_DENIED'
      });
    }
    
    next();
  };
};

// JWT token生成工具
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRE || '7d',
      issuer: 'csr-volunteer-system',
      audience: 'csr-users'
    }
  );
};

// 验证token工具（不需要中间件）
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// 从请求中提取用户ID
const extractUserId = (req) => {
  return req.user ? req.user._id : null;
};

// Check if email is an admin email
const isAdminEmail = (email) => {
  const adminEmails = [
    'mikogo@admin.com',
    'admin@community-care.com'
  ];
  const adminDomain = process.env.ADMIN_EMAIL_DOMAIN || '@admin.com';
  return adminEmails.includes(email) || email.endsWith(adminDomain);
};

module.exports = {
  authenticate,
  authorize,
  adminOnly,
  superAdminOnly,
  checkPermission,
  pinOnly,
  csrOnly,
  userOnly,
  ownerOrAdmin,
  generateToken,
  verifyToken,
  extractUserId,
  isAdminEmail
};