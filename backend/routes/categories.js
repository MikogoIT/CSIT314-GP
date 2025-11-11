const express = require('express');
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const { asyncHandler, createError } = require('../middleware/errorHandler');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

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

// 分类验证规则
const categoryValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('分类名称长度必须在2-100字符之间')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('分类名称只能包含字母、数字、下划线和连字符'),
  body('displayName.zh')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('中文显示名称长度必须在2-50字符之间'),
  body('displayName.en')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('英文显示名称长度必须在2-50字符之间'),
  body('description.zh')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('中文描述不能超过500个字符'),
  body('description.en')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('英文描述不能超过500个字符'),
  body('icon')
    .optional()
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('图标长度必须在1-10字符之间'),
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('请输入有效的颜色代码'),
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('排序权重必须是非负整数')
];

// @desc    获取所有分类
// @route   GET /api/categories
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
  const { includeInactive = false, includeStats = false } = req.query;

  const query = includeInactive === 'true' ? {} : { status: 'active' };
  
  let categories = await Category.find(query)
    .populate('subcategories')
    .sort({ sortOrder: 1, name: 1 });

  // 如果需要统计信息
  if (includeStats === 'true') {
    const Request = require('../models/Request');
    
    for (let category of categories) {
      await category.updateStats();
    }
    
    // 重新查询以获取更新后的统计信息
    categories = await Category.find(query)
      .populate('subcategories')
      .sort({ sortOrder: 1, name: 1 });
  }

  res.json({
    success: true,
    data: { categories }
  });
}));

// @desc    获取分类树结构
// @route   GET /api/categories/tree
// @access  Private
router.get('/tree', asyncHandler(async (req, res) => {
  const categoryTree = await Category.getCategoryTree();

  res.json({
    success: true,
    data: { categoryTree }
  });
}));

// @desc    根据ID获取单个分类
// @route   GET /api/categories/:id
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id)
    .populate('subcategories')
    .populate('parent');

  if (!category) {
    throw createError.notFound('分类未找到');
  }

  res.json({
    success: true,
    data: { category }
  });
}));

// @desc    创建新分类
// @route   POST /api/categories
// @access  Private (Admin only)
router.post('/',
  authorize('admin'),
  categoryValidation,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    // 检查分类名称是否已存在
    const existingCategory = await Category.findOne({ name: req.body.name });
    if (existingCategory) {
      throw createError.conflict('分类名称已存在');
    }

    // 如果指定了父分类，检查父分类是否存在
    if (req.body.parent) {
      const parentCategory = await Category.findById(req.body.parent);
      if (!parentCategory) {
        throw createError.badRequest('指定的父分类不存在');
      }
    }

    const category = await Category.create(req.body);

    res.status(201).json({
      success: true,
      message: '分类创建成功',
      data: { category }
    });
  })
);

// @desc    更新分类
// @route   PUT /api/categories/:id
// @access  Private (Admin only)
router.put('/:id',
  authorize('admin'),
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('分类名称长度必须在2-100字符之间')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('分类名称只能包含字母、数字、下划线和连字符'),
    body('displayName.zh')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('中文显示名称长度必须在2-50字符之间'),
    body('displayName.en')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('英文显示名称长度必须在2-50字符之间'),
    body('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('状态必须是 active 或 inactive')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
      throw createError.notFound('分类未找到');
    }

    // 如果更新名称，检查是否与其他分类冲突
    if (req.body.name && req.body.name !== category.name) {
      const existingCategory = await Category.findOne({ 
        name: req.body.name,
        _id: { $ne: req.params.id }
      });
      
      if (existingCategory) {
        throw createError.conflict('分类名称已存在');
      }
    }

    // 如果更新父分类，检查是否会造成循环引用
    if (req.body.parent) {
      const parentCategory = await Category.findById(req.body.parent);
      if (!parentCategory) {
        throw createError.badRequest('指定的父分类不存在');
      }

      // 简单的循环检查：父分类不能是当前分类的子分类
      const subcategories = await Category.find({ parent: req.params.id });
      const subcategoryIds = subcategories.map(sub => sub._id.toString());
      
      if (subcategoryIds.includes(req.body.parent)) {
        throw createError.badRequest('不能将子分类设置为父分类');
      }
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: '分类更新成功',
      data: { category: updatedCategory }
    });
  })
);

// @desc    删除分类
// @route   DELETE /api/categories/:id
// @access  Private (Admin only)
router.delete('/:id',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
      throw createError.notFound('分类未找到');
    }

    // 检查是否有相关请求
    const Request = require('../models/Request');
    const requestCount = await Request.countDocuments({ category: category.name });
    
    if (requestCount > 0) {
      throw createError.badRequest(`无法删除分类：还有 ${requestCount} 个相关请求`);
    }

    // 检查是否有子分类
    const subcategoryCount = await Category.countDocuments({ parent: category._id });
    
    if (subcategoryCount > 0) {
      throw createError.badRequest(`无法删除分类：还有 ${subcategoryCount} 个子分类`);
    }

    await category.deleteOne();

    res.json({
      success: true,
      message: '分类删除成功'
    });
  })
);

// @desc    更新分类统计信息
// @route   POST /api/categories/:id/update-stats
// @access  Private (Admin only)
router.post('/:id/update-stats',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
      throw createError.notFound('分类未找到');
    }

    await category.updateStats();

    res.json({
      success: true,
      message: '统计信息已更新',
      data: { 
        category: await Category.findById(req.params.id)
      }
    });
  })
);

// @desc    批量更新所有分类统计信息
// @route   POST /api/categories/update-all-stats
// @access  Private (Admin only)
router.post('/update-all-stats',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const categories = await Category.find({ status: 'active' });

    for (let category of categories) {
      await category.updateStats();
    }

    res.json({
      success: true,
      message: `已更新 ${categories.length} 个分类的统计信息`
    });
  })
);

// @desc    重新排序分类
// @route   POST /api/categories/reorder
// @access  Private (Admin only)
router.post('/reorder',
  authorize('admin'),
  [
    body('categoryOrders')
      .isArray({ min: 1 })
      .withMessage('分类排序列表不能为空'),
    body('categoryOrders.*.id')
      .isMongoId()
      .withMessage('无效的分类ID'),
    body('categoryOrders.*.sortOrder')
      .isInt({ min: 0 })
      .withMessage('排序权重必须是非负整数')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { categoryOrders } = req.body;

    // 批量更新排序
    const updatePromises = categoryOrders.map(({ id, sortOrder }) =>
      Category.findByIdAndUpdate(id, { sortOrder })
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: '分类排序已更新'
    });
  })
);

// @desc    初始化默认分类
// @route   POST /api/categories/init-defaults
// @access  Private (Admin only)
router.post('/init-defaults',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    // 检查是否已有分类
    const existingCategories = await Category.countDocuments();
    
    if (existingCategories > 0) {
      throw createError.badRequest('系统中已存在分类，无法初始化默认分类');
    }

    const defaultCategories = [
      {
        name: 'medical',
        displayName: { zh: '医疗护理', en: 'Medical Care' },
        description: { 
          zh: '医疗陪同、护理协助等健康相关服务',
          en: 'Medical accompaniment, nursing assistance and other health-related services'
        },
        icon: '🏥',
        color: '#f44336',
        sortOrder: 1
      },
      {
        name: 'transportation',
        displayName: { zh: '交通接送', en: 'Transportation' },
        description: { 
          zh: '出行接送、代步服务等交通协助',
          en: 'Travel pickup, mobility services and other transportation assistance'
        },
        icon: '🚗',
        color: '#2196f3',
        sortOrder: 2
      },
      {
        name: 'shopping',
        displayName: { zh: '购物代买', en: 'Shopping' },
        description: { 
          zh: '日用品采购、生活必需品代买等服务',
          en: 'Daily necessities procurement, life essentials shopping services'
        },
        icon: '🛒',
        color: '#4caf50',
        sortOrder: 3
      },
      {
        name: 'household',
        displayName: { zh: '家务协助', en: 'Household' },
        description: { 
          zh: '家庭清洁、整理收纳等家务帮助',
          en: 'Home cleaning, organizing and other household assistance'
        },
        icon: '🏠',
        color: '#ff9800',
        sortOrder: 4
      },
      {
        name: 'technology',
        displayName: { zh: '技术支持', en: 'Technology' },
        description: { 
          zh: '电脑维修、软件使用指导等技术服务',
          en: 'Computer repair, software guidance and other technical services'
        },
        icon: '💻',
        color: '#9c27b0',
        sortOrder: 5
      },
      {
        name: 'companion',
        displayName: { zh: '陪伴聊天', en: 'Companionship' },
        description: { 
          zh: '情感陪伴、聊天解闷等心理支持',
          en: 'Emotional companionship, chatting and other psychological support'
        },
        icon: '👥',
        color: '#607d8b',
        sortOrder: 6
      },
      {
        name: 'other',
        displayName: { zh: '其他服务', en: 'Other' },
        description: { 
          zh: '其他未分类的志愿服务需求',
          en: 'Other uncategorized volunteer service needs'
        },
        icon: '🤝',
        color: '#795548',
        sortOrder: 7
      }
    ];

    const createdCategories = await Category.insertMany(defaultCategories);

    res.status(201).json({
      success: true,
      message: `已创建 ${createdCategories.length} 个默认分类`,
      data: { categories: createdCategories }
    });
  })
);

module.exports = router;