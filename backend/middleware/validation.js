// 数据验证中间件 - Boundary Layer
const { body, query, validationResult } = require('express-validator');

// 验证错误处理中间件
exports.handleValidationErrors = (req, res, next) => {
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

// 常用验证规则
const commonValidations = {
  // 邮箱验证
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('请输入有效的邮箱地址'),

  // 密码验证
  password: body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('密码长度必须在6-128字符之间'),

  // 手机号验证
  phone: body('phone')
    .optional()
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('请输入有效的手机号码'),

  // 姓名验证
  name: body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('姓名长度必须在2-50字符之间')
    .matches(/^[\u4e00-\u9fa5a-zA-Z\s]+$/)
    .withMessage('姓名只能包含中文、英文和空格'),

  // 用户类型验证
  userType: body('userType')
    .isIn(['pin', 'csr', 'system_admin', 'platform_manager'])
    .withMessage('用户类型必须是pin、csr、system_admin或platform_manager'),

  // MongoDB ObjectId验证
  mongoId: (field) => body(field)
    .isMongoId()
    .withMessage(`${field}必须是有效的ID格式`),

  // 日期验证
  date: (field) => body(field)
    .isISO8601()
    .toDate()
    .withMessage(`${field}必须是有效的日期格式`),

  // 分页验证
  pagination: {
    page: body('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('页码必须是正整数'),
    limit: body('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('每页数量必须在1-100之间')
  }
};

// 请求相关验证
const requestValidations = {
  create: [
    body('title')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('标题长度必须在5-200字符之间'),
    body('description')
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('描述长度必须在10-1000字符之间'),
    body('category')
      .isIn(['medical', 'transportation', 'shopping', 'household', 'technology', 'companion', 'other'])
      .withMessage('服务类型无效'),
    body('urgency')
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('紧急程度无效'),
    body('location.address')
      .trim()
      .notEmpty()
      .withMessage('地址不能为空')
      .isLength({ max: 500 })
      .withMessage('地址不能超过500个字符'),
    body('location.coordinates.latitude')
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('纬度必须在-90到90之间'),
    body('location.coordinates.longitude')
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('经度必须在-180到180之间'),
    body('expectedDate')
      .isISO8601()
      .toDate()
      .custom((value) => {
        if (value < new Date()) {
          throw new Error('期望日期不能是过去的时间');
        }
        return true;
      }),
    body('expectedTime')
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('时间格式应为HH:MM'),
    body('volunteersNeeded')
      .isInt({ min: 1, max: 10 })
      .withMessage('需要的志愿者数量必须在1-10之间'),
    body('contactMethod')
      .optional()
      .isIn(['phone', 'email', 'both'])
      .withMessage('联系方式必须是phone、email或both'),
    body('additionalNotes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('额外说明不能超过500个字符')
  ],

  update: [
    body('title')
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('标题长度必须在5-200字符之间'),
    body('description')
      .optional()
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('描述长度必须在10-1000字符之间'),
    body('category')
      .optional()
      .isIn(['medical', 'transportation', 'shopping', 'household', 'technology', 'companion', 'other'])
      .withMessage('服务类型无效'),
    body('urgency')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('紧急程度无效'),
    body('expectedDate')
      .optional()
      .isISO8601()
      .toDate()
      .custom((value) => {
        if (value < new Date()) {
          throw new Error('期望日期不能是过去的时间');
        }
        return true;
      }),
    body('volunteersNeeded')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('需要的志愿者数量必须在1-10之间')
  ],

  apply: [
    body('message')
      .optional()
      .trim()
      .isLength({ max: 300 })
      .withMessage('申请留言不能超过300个字符')
  ],

  complete: [
    body('rating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('评分必须在1-5之间'),
    body('feedback')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('反馈不能超过500个字符'),
    body('actualDuration')
      .optional()
      .isFloat({ min: 0.1, max: 24 })
      .withMessage('实际时长必须在0.1-24小时之间')
  ]
};

// 用户相关验证
const userValidations = {
  register: [
    commonValidations.name,
    commonValidations.email,
    commonValidations.password,
    commonValidations.userType,
    commonValidations.phone,
    body('address')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('地址不能超过500个字符'),
    body('emergencyContact.name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('紧急联系人姓名长度必须在2-50字符之间'),
    body('emergencyContact.phone')
      .optional()
      .matches(/^1[3-9]\d{9}$/)
      .withMessage('请输入有效的紧急联系人电话'),
    body('organization')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('组织名称不能超过200个字符'),
    body('skills')
      .optional()
      .isArray()
      .withMessage('技能必须是数组格式'),
    body('skills.*')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('单个技能描述不能超过100个字符')
  ],

  login: [
    commonValidations.email,
    body('password')
      .notEmpty()
      .withMessage('密码不能为空'),
    body('userType')
      .optional()
      .isIn(['pin', 'csr'])
      .withMessage('用户类型必须是pin或csr')
  ],

  updateProfile: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('姓名长度必须在2-50字符之间'),
    commonValidations.phone,
    body('address')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('地址不能超过500个字符'),
    body('organization')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('组织名称不能超过200个字符'),
    body('skills')
      .optional()
      .isArray()
      .withMessage('技能必须是数组格式')
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('当前密码不能为空'),
    body('newPassword')
      .isLength({ min: 6, max: 128 })
      .withMessage('新密码长度必须在6-128字符之间'),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('确认密码与新密码不匹配');
        }
        return true;
      })
  ]
};

// 收藏夹相关验证
const shortlistValidations = {
  add: [
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('备注不能超过500个字符'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('标签必须是数组格式'),
    body('tags.*')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('单个标签不能超过50个字符')
  ]
};

// 自定义验证函数
const customValidators = {
  // 验证日期范围
  dateRange: (startField, endField) => {
    return body(endField).custom((endDate, { req }) => {
      const startDate = req.body[startField];
      if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
        throw new Error(`${endField}必须晚于${startField}`);
      }
      return true;
    });
  },

  // 验证文件类型
  fileType: (allowedTypes) => {
    return (req, res, next) => {
      if (req.file) {
        const fileType = req.file.mimetype;
        if (!allowedTypes.includes(fileType)) {
          return res.status(400).json({
            success: false,
            error: `不支持的文件类型，允许的类型：${allowedTypes.join(', ')}`,
            code: 'INVALID_FILE_TYPE'
          });
        }
      }
      next();
    };
  },

  // 验证文件大小
  fileSize: (maxSize) => {
    return (req, res, next) => {
      if (req.file && req.file.size > maxSize) {
        return res.status(400).json({
          success: false,
          error: `文件大小不能超过 ${maxSize / 1024 / 1024}MB`,
          code: 'FILE_TOO_LARGE'
        });
      }
      next();
    };
  },

  // 验证数组长度
  arrayLength: (field, min = 0, max = 100) => {
    return body(field)
      .optional()
      .isArray({ min, max })
      .withMessage(`${field}数组长度必须在${min}-${max}之间`);
  },

  // 验证枚举值
  enum: (field, values, optional = false) => {
    const validator = body(field).isIn(values).withMessage(`${field}必须是以下值之一：${values.join(', ')}`);
    return optional ? validator.optional() : validator;
  }
};

// 业务逻辑验证
const businessValidations = {
  // 验证用户是否有权限访问资源
  resourceOwnership: (resourceField = 'user') => {
    return (req, res, next) => {
      const adminTypes = ['system_admin', 'platform_manager'];
      if (adminTypes.includes(req.user.userType)) {
        return next();
      }

      const userId = req.user._id.toString();
      const resourceUserId = req.params[resourceField] || req.body[resourceField];

      if (resourceUserId && resourceUserId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          error: '您只能访问自己的资源',
          code: 'RESOURCE_ACCESS_DENIED'
        });
      }

      next();
    };
  },

  // 验证请求状态是否允许操作
  requestStatus: (allowedStatuses) => {
    return async (req, res, next) => {
      try {
        const Request = require('../models/Request');
        const request = await Request.findById(req.params.id);

        if (!request) {
          return res.status(404).json({
            success: false,
            error: '请求未找到',
            code: 'REQUEST_NOT_FOUND'
          });
        }

        if (!allowedStatuses.includes(request.status)) {
          return res.status(400).json({
            success: false,
            error: `请求状态为${request.status}，不允许此操作`,
            code: 'INVALID_REQUEST_STATUS'
          });
        }

        req.request = request;
        next();
      } catch (error) {
        next(error);
      }
    };
  }
};

// ============ 认证相关验证规则 ============

exports.registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('姓名长度必须在2-100字符之间'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码至少需要6个字符'),
  body('userType')
    .isIn(['pin', 'csr'])
    .withMessage('用户类型必须是pin或csr'),
  body('phone')
    .optional()
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('请输入有效的电话号码')
];

exports.loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
];

exports.updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('姓名长度必须在2-100字符之间'),
  body('phone')
    .optional()
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('请输入有效的电话号码'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('地址不能超过500个字符')
];

exports.changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('当前密码不能为空'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('新密码至少需要6个字符'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('确认密码与新密码不匹配');
      }
      return true;
    })
];

// ============ 用户管理相关验证规则 ============

exports.getUsersValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('userType').optional().isIn(['pin', 'csr', 'system_admin', 'platform_manager']),
  query('status').optional().isIn(['active', 'suspended', 'deleted'])
];

exports.updateUserValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('姓名长度必须在2-100字符之间'),
  body('status')
    .optional()
    .isIn(['active', 'suspended', 'deleted'])
    .withMessage('状态必须是 active, suspended 或 deleted'),
  body('userType')
    .optional()
    .isIn(['pin', 'csr', 'system_admin', 'platform_manager'])
    .withMessage('用户类型必须是 pin, csr, system_admin 或 platform_manager')
];

// ============ 请求管理相关验证规则 ============

exports.createRequestValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('标题长度必须在5-200字符之间'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('描述长度必须在10-1000字符之间'),
  body('category')
    .isIn(['medical', 'transportation', 'shopping', 'household', 'technology', 'companion', 'other'])
    .withMessage('无效的服务类型'),
  body('urgency')
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('无效的紧急程度'),
  body('location.address')
    .trim()
    .notEmpty()
    .withMessage('地址不能为空'),
  body('expectedDate')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .toDate()
    .custom((value) => {
      if (value && value < new Date()) {
        throw new Error('期望日期不能是过去的时间');
      }
      return true;
    }),
  body('expectedTime')
    .optional({ checkFalsy: true })
    .isIn(['', 'morning', 'afternoon', 'evening'])
    .withMessage('时间段必须是 morning, afternoon, evening 或留空'),
  body('volunteersNeeded')
    .isInt({ min: 1, max: 10 })
    .withMessage('需要的志愿者数量必须在1-10之间'),
  body('contactMethod')
    .optional()
    .isIn(['phone', 'email', 'both'])
    .withMessage('联系方式必须是 phone, email 或 both')
];

exports.getRequestsValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
  query('category').optional().isIn(['medical', 'transportation', 'shopping', 'household', 'technology', 'companion', 'other']),
  query('urgency').optional().isIn(['low', 'medium', 'high', 'urgent']),
  query('status').optional().isIn(['pending', 'matched', 'completed', 'cancelled', 'expired'])
];

exports.updateRequestValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('标题长度必须在5-200字符之间'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('描述长度必须在10-1000字符之间'),
  body('status')
    .optional()
    .isIn(['pending', 'matched', 'completed', 'cancelled', 'expired'])
    .withMessage('无效的状态'),
  body('urgency')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('无效的紧急程度')
];

// ============ 分类管理相关验证规则 ============

exports.createCategoryValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('分类名称不能为空')
    .isLength({ min: 2, max: 50 })
    .withMessage('分类名称长度必须在2-50字符之间'),
  body('displayName')
    .trim()
    .notEmpty()
    .withMessage('显示名称不能为空')
    .isLength({ min: 2, max: 50 })
    .withMessage('显示名称长度必须在2-50字符之间'),
  body('icon')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('图标长度不能超过10个字符'),
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('颜色必须是有效的十六进制颜色代码')
];

exports.updateCategoryValidation = [
  body('displayName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('显示名称长度必须在2-50字符之间'),
  body('icon')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('图标长度不能超过10个字符'),
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('颜色必须是有效的十六进制颜色代码'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive必须是布尔值')
];

module.exports.commonValidations = commonValidations;
module.exports.businessValidations = businessValidations;