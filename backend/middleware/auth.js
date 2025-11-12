const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Token is valid but user not found',
          code: 'USER_NOT_FOUND'
        });
      }

      if (user.status !== 'active') {
        return res.status(401).json({
          success: false,
          error: 'User account is suspended or deleted',
          code: 'USER_SUSPENDED'
        });
      }
      
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

const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }
  
  const adminTypes = ['system_admin', 'platform_manager'];
  if (!adminTypes.includes(req.user.userType) && !req.user.isSuper) {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Administrator privileges required.',
      code: 'ADMIN_REQUIRED'
    });
  }
  
  next();
};

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

const systemAdminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }
  
  if (req.user.userType !== 'system_admin' && !req.user.isSuper) {
    return res.status(403).json({
      success: false,
      error: 'Access denied. System Administrator privileges required.',
      code: 'SYSTEM_ADMIN_REQUIRED'
    });
  }
  
  next();
};

const platformManagerOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }
  
  if (req.user.userType !== 'platform_manager' && !req.user.isSuper) {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Platform Manager privileges required.',
      code: 'PLATFORM_MANAGER_REQUIRED'
    });
  }
  
  next();
};

const anyAdminType = (...adminTypes) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    if (req.user.isSuper) {
      return next();
    }
    
    if (!adminTypes.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required admin types: ${adminTypes.join(', ')}`,
        code: 'INSUFFICIENT_ADMIN_PERMISSIONS'
      });
    }
    
    next();
  };
};

const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    if (req.user.isSuper) {
      return next();
    }

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

const pinOnly = authorize('pin');

const csrOnly = authorize('csr');

const userOnly = authorize('pin', 'csr');

const ownerOrAdmin = (resourceField = 'user') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const adminTypes = ['system_admin', 'platform_manager'];
    if (adminTypes.includes(req.user.userType)) {
      return next();
    }
    
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

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const extractUserId = (req) => {
  return req.user ? req.user._id : null;
};
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
  systemAdminOnly,
  platformManagerOnly,
  anyAdminType,
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