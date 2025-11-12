const express = require('express');
const mongoose = require('mongoose');
const { body, query, validationResult } = require('express-validator');
const Request = require('../models/Request');
const User = require('../models/User');
const Shortlist = require('../models/Shortlist');
const { asyncHandler, createError } = require('../middleware/errorHandler');
const { authenticate, authorize, ownerOrAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Multer upload configuration
const UPLOAD_DIR = process.env.UPLOAD_PATH || path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    // Use timestamp + original name to avoid collisions
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const fileFilter = (req, file, cb) => {
  // allow images and common document types (pdf, doc, docx)
  const allowed = ['image/', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (file.mimetype.startsWith('image/') || allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_UPLOAD_SIZE || '5242880'), // default 5MB
    files: parseInt(process.env.MAX_UPLOAD_FILES || '5')
  }
});

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

// 创建请求验证规则
const createRequestValidation = [
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

// @desc    获取所有请求（带搜索和筛选）
// @route   GET /api/requests
// @access  Private
router.get('/', 
  [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('limit').optional().isInt({ min: 1, max: 10000 }).withMessage('每页数量必须在1-10000之间'),
    query('category').optional().isIn(['medical', 'transportation', 'shopping', 'household', 'technology', 'companion', 'other']),
    query('urgency').optional().isIn(['low', 'medium', 'high', 'urgent']),
    query('status').optional().isIn(['pending', 'matched', 'completed', 'cancelled', 'expired'])
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      urgency,
      status,
      userType,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // 构建查询条件
    const query = {};

    // 根据用户类型筛选
    if (req.user.userType === 'pin') {
      // PIN用户只能看到自己的请求
      query.requester = req.user._id;
    } else if (req.user.userType === 'csr') {
      // CSR用户只能看到待处理和已匹配的请求
      query.status = { $in: ['pending', 'matched'] };
    }
    // 管理员可以看到所有请求

    // 其他筛选条件
    if (category) query.category = category;
    if (urgency) query.urgency = urgency;
    if (status && req.user.userType !== 'csr') query.status = status;

    // 文本搜索
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } }
      ];
    }

    // 分页参数
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 排序参数
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // 执行查询
    const [requests, total] = await Promise.all([
      Request.find(query)
        .populate('requester', 'name email phone userType')
        .populate('interestedVolunteers.volunteer', 'name email phone organization skills')
        .populate('assignedVolunteers.volunteer', 'name email phone organization')
        .populate('rejectedVolunteers.volunteer', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Request.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        requests,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  })
);

// @desc    获取单个请求详情
// @route   GET /api/requests/:id
// @access  Private
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id)
    .populate('requester', 'name email phone address userType')
    .populate('interestedVolunteers.volunteer', 'name email phone organization skills')
    .populate('assignedVolunteers.volunteer', 'name email phone organization skills')
    .populate('rejectedVolunteers.volunteer', 'name email');

  if (!request) {
    throw createError.notFound('请求未找到');
  }

  // 权限检查
  if (req.user.userType === 'pin' && request.requester._id.toString() !== req.user._id.toString()) {
    throw createError.forbidden('您只能查看自己的请求');
  }

  // 增加浏览量（仅CSR用户）
  if (req.user.userType === 'csr') {
    await request.incrementViewCount();
  }

  res.json({
    success: true,
    data: { request }
  });
}));

// @desc    创建新请求
// @route   POST /api/requests
// @access  Private (PIN users only)
router.post('/', 
  authorize('pin'),
  // accept file uploads named 'attachments' (max files controlled by multer config)
  upload.array('attachments'),
  // Parse multipart text fields: convert JSON strings and bracket/dot notation into nested objects
  (req, res, next) => {
    try {
      // Convert keys like 'a[b]' or 'a.b' into nested objects on req.body
      const setNested = (obj, path, value) => {
        if (!path) return;
        // support bracket notation a[b][c]
        const parts = [];
        path.replace(/\[(.*?)\]|([^\[.]+)/g, (_, bracket, dot) => {
          parts.push(bracket === undefined ? dot : bracket);
          return '';
        });
        let cur = obj;
        for (let i = 0; i < parts.length; i++) {
          const p = parts[i];
          if (i === parts.length - 1) {
            cur[p] = value;
          } else {
            if (cur[p] === undefined || typeof cur[p] !== 'object') cur[p] = {};
            cur = cur[p];
          }
        }
      };

      // Iterate over req.body keys and parse JSON-like strings
      Object.keys(req.body || {}).forEach(key => {
        let val = req.body[key];
        // Try parse JSON strings
        if (typeof val === 'string') {
          const trimmed = val.trim();
          if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
            try {
              val = JSON.parse(trimmed);
            } catch (e) {
              // leave as string
            }
          }
        }

        // If key contains bracket or dot notation, map into nested object
        if (key.includes('[') || key.includes('.')) {
          setNested(req.body, key, val);
          // remove the original flat key
          delete req.body[key];
        } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          // already parsed object (e.g., JSON parsed) - assign back
          req.body[key] = val;
        } else {
          req.body[key] = val;
        }
      });
    } catch (e) {
      // ignore parsing errors; validation will handle malformed input
      console.warn('Failed to parse multipart fields', e);
    }
    next();
  },
  createRequestValidation,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    // req.body will contain text fields; req.files will contain uploaded files (if any)
    const requestData = {
      ...req.body,
      requester: req.user._id
    };

    // Process uploaded files and add metadata to requestData.attachments
    if (req.files && req.files.length > 0) {
      requestData.attachments = req.files.map(f => ({
        filename: f.filename,
        originalName: f.originalname,
        path: f.path,
        url: `/uploads/${f.filename}`,
        mimetype: f.mimetype,
        size: f.size,
        uploadedAt: new Date()
      }));
    }

    const request = await Request.create(requestData);
    
    // 更新用户统计
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.totalRequests': 1 }
    });

    const populatedRequest = await Request.findById(request._id)
      .populate('requester', 'name email phone');

    res.status(201).json({
      success: true,
      message: '请求创建成功',
      data: { request: populatedRequest }
    });
  })
);

// @desc    更新请求
// @route   PUT /api/requests/:id
// @access  Private (Owner or Admin)
router.put('/:id', 
  authenticate,
  [
    body('title').optional().trim().isLength({ min: 5, max: 200 }),
    body('description').optional().trim().isLength({ min: 10, max: 1000 }),
    body('category').optional().isIn(['medical', 'transportation', 'shopping', 'household', 'technology', 'companion', 'other']),
    body('urgency').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('expectedDate').optional().isISO8601().toDate(),
    body('volunteersNeeded').optional().isInt({ min: 1, max: 10 })
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    // 验证ObjectId格式
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      throw createError.badRequest('无效的请求ID格式');
    }

    const request = await Request.findById(req.params.id);

    if (!request) {
      throw createError.notFound('请求未找到');
    }

    // 权限检查
    if (req.user.userType !== 'admin' && request.requester.toString() !== req.user._id.toString()) {
      throw createError.forbidden('您只能修改自己的请求');
    }

    // 如果请求已经匹配或完成，限制修改
    if (['matched', 'completed'].includes(request.status)) {
      const allowedFields = ['additionalNotes'];
      const hasDisallowedUpdates = Object.keys(req.body).some(key => !allowedFields.includes(key));
      
      if (hasDisallowedUpdates) {
        throw createError.badRequest('请求已匹配或完成，只能修改备注信息');
      }
    }

    const updatedRequest = await Request.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('requester', 'name email phone');

    res.json({
      success: true,
      message: '请求更新成功',
      data: { request: updatedRequest }
    });
  })
);

// @desc    删除请求
// @route   DELETE /api/requests/:id
// @access  Private (Owner or Admin)
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  // 验证请求ID格式
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw createError.badRequest('无效的请求ID格式');
  }

  const request = await Request.findById(req.params.id);

  if (!request) {
    throw createError.notFound('请求未找到');
  }

  // 权限检查 - 确保requester是ObjectId
  const requesterId = request.requester._id || request.requester;
  if (req.user.userType !== 'admin' && requesterId.toString() !== req.user._id.toString()) {
    throw createError.forbidden('您只能删除自己的请求');
  }

  // 如果有志愿者已申请，不允许删除
  if (request.interestedVolunteers && request.interestedVolunteers.length > 0 || 
      request.assignedVolunteers && request.assignedVolunteers.length > 0) {
    throw createError.badRequest('已有志愿者申请的请求不能删除，请取消请求');
  }

  await Request.findByIdAndDelete(req.params.id);

  // 更新用户统计
  await User.findByIdAndUpdate(request.requester, {
    $inc: { 'stats.totalRequests': -1 }
  });

  res.json({
    success: true,
    message: '请求删除成功'
  });
}));

// @desc    申请志愿服务
// @route   POST /api/requests/:id/apply
// @access  Private (CSR users only)
router.post('/:id/apply',
  authenticate,
  authorize('csr'),
  [
    body('message')
      .optional()
      .trim()
      .isLength({ max: 300 })
      .withMessage('申请留言不能超过300个字符')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { message = '' } = req.body;
    
    // 验证ObjectId格式
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      throw createError.badRequest('无效的请求ID格式');
    }
    
    const request = await Request.findById(req.params.id);

    if (!request) {
      throw createError.notFound('请求未找到');
    }

    if (request.status !== 'pending') {
      throw createError.badRequest('只能申请待处理的请求');
    }

    // 检查是否已经申请过
    const hasApplied = request.interestedVolunteers.some(
      interest => interest.volunteer.toString() === req.user._id.toString()
    );

    if (hasApplied) {
      throw createError.conflict('您已经申请过这个志愿服务');
    }

    await request.addInterest(req.user._id, message);

    res.json({
      success: true,
      message: '申请提交成功'
    });
  })
);

// @desc    取消申请
// @route   DELETE /api/requests/:id/apply
// @access  Private (CSR users only)
router.delete('/:id/apply',
  authenticate,
  authorize('csr'),
  asyncHandler(async (req, res) => {
    const request = await Request.findById(req.params.id);

    if (!request) {
      throw createError.notFound('请求未找到');
    }

    // 移除申请
    request.interestedVolunteers = request.interestedVolunteers.filter(
      interest => interest.volunteer.toString() !== req.user._id.toString()
    );

    await request.save();

    res.json({
      success: true,
      message: '申请已取消'
    });
  })
);

// @desc    拒绝请求（CSR认为请求不在其职责范围内）
// @route   POST /api/requests/:id/reject
// @access  Private (CSR users only)
router.post('/:id/reject',
  authenticate,
  authorize('csr'),
  [
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('拒绝原因不能超过500个字符')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { reason = '' } = req.body;
    
    // 验证ObjectId格式
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      throw createError.badRequest('无效的请求ID格式');
    }
    
    const request = await Request.findById(req.params.id);

    if (!request) {
      throw createError.notFound('请求未找到');
    }

    // 检查是否已经拒绝过
    const hasRejected = request.rejectedVolunteers?.some(
      rejection => rejection.volunteer.toString() === req.user._id.toString()
    );

    if (hasRejected) {
      throw createError.conflict('您已经拒绝过这个请求');
    }

    // 如果CSR已经申请了这个请求，先移除申请
    request.interestedVolunteers = request.interestedVolunteers.filter(
      interest => interest.volunteer.toString() !== req.user._id.toString()
    );

    // 添加到拒绝列表
    if (!request.rejectedVolunteers) {
      request.rejectedVolunteers = [];
    }
    
    request.rejectedVolunteers.push({
      volunteer: req.user._id,
      rejectedAt: new Date(),
      reason: reason
    });

    await request.save();

    res.json({
      success: true,
      message: '已拒绝该请求'
    });
  })
);

// @desc    分配志愿者（PIN用户选择志愿者）
// @route   POST /api/requests/:id/assign/:volunteerId
// @access  Private (Request owner or Admin)
router.post('/:id/assign/:volunteerId', authenticate, asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id);

  if (!request) {
    throw createError.notFound('请求未找到');
  }

  // 权限检查
  if (req.user.userType !== 'admin' && request.requester.toString() !== req.user._id.toString()) {
    throw createError.forbidden('只有请求发布者可以分配志愿者');
  }

  const volunteer = await User.findById(req.params.volunteerId);
  if (!volunteer || volunteer.userType !== 'csr') {
    throw createError.badRequest('志愿者不存在或类型错误');
  }

  await request.assignVolunteer(req.params.volunteerId);

  // 更新志愿者统计
  await User.findByIdAndUpdate(req.params.volunteerId, {
    $inc: { 'stats.totalVolunteered': 1 }
  });

  res.json({
    success: true,
    message: '志愿者分配成功'
  });
}));

// @desc    完成请求
// @route   POST /api/requests/:id/complete
// @access  Private (Request owner or Admin)
router.post('/:id/complete',
  authenticate,
  [
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('评分必须在1-5之间'),
    body('feedback').optional().trim().isLength({ max: 500 }).withMessage('反馈不能超过500个字符'),
    body('volunteerId').optional().isMongoId().withMessage('无效的志愿者ID')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { rating, feedback, actualDuration, volunteerId } = req.body;
    
    const request = await Request.findById(req.params.id);

    if (!request) {
      throw createError.notFound('请求未找到');
    }

    // 权限检查
    if (req.user.userType !== 'admin' && request.requester.toString() !== req.user._id.toString()) {
      throw createError.forbidden('只有请求发布者可以完成请求');
    }

    if (request.status !== 'matched') {
      throw createError.badRequest('只能完成已匹配的请求');
    }

    await request.markCompleted({
      rating,
      feedback,
      actualDuration
    });

    // 更新统计信息
      // 增加请求者已完成请求计数
      await User.findByIdAndUpdate(request.requester, {
        $inc: { 'stats.completedRequests': 1 }
      });

      // 为每个已分配的志愿者更新完成次数，并记录评分/反馈（如果提供）
      for (const assignment of request.assignedVolunteers) {
        try {
          // 更新志愿者统计的完成服务计数
          await User.findByIdAndUpdate(assignment.volunteer, {
            $inc: { 'stats.completedServices': 1 }
          });

          // 如果评价存在，把评价写入 assignment，并更新用户平均评分
          if (typeof rating !== 'undefined' && rating !== null) {
            // 如果指定了 volunteerId，则只为该志愿者记录评分
            if (!volunteerId || assignment.volunteer.toString() === volunteerId.toString()) {
              // 写入到请求的分配条目
              assignment.rating = rating;
              if (feedback) assignment.feedback = feedback;

              // 更新志愿者用户的评分统计（计算新的平均）
              const volunteerUser = await User.findById(assignment.volunteer);
              if (volunteerUser) {
                const prevCount = volunteerUser.stats?.totalRatings || 0;
                const prevAvg = volunteerUser.stats?.rating || 0;
                const newCount = prevCount + 1;
                const newAvg = ((prevAvg * prevCount) + rating) / newCount;

                volunteerUser.stats = volunteerUser.stats || {};
                volunteerUser.stats.totalRatings = newCount;
                volunteerUser.stats.rating = Math.round(newAvg * 10) / 10; // keep one decimal
                await volunteerUser.save();
              }
            }

            // 更新志愿者用户的评分统计（计算新的平均）
            const volunteerUser = await User.findById(assignment.volunteer);
            if (volunteerUser) {
              const prevCount = volunteerUser.stats?.totalRatings || 0;
              const prevAvg = volunteerUser.stats?.rating || 0;
              const newCount = prevCount + 1;
              const newAvg = ((prevAvg * prevCount) + rating) / newCount;

              volunteerUser.stats = volunteerUser.stats || {};
              volunteerUser.stats.totalRatings = newCount;
              volunteerUser.stats.rating = Math.round(newAvg * 10) / 10; // keep one decimal
              await volunteerUser.save();
            }
          }
        } catch (err) {
          console.warn('Failed to update volunteer stats for assignment', assignment, err);
        }
      }

      // 如果我们修改了 assignment 的 rating/feedback，需要保存 request
      await request.save();

    res.json({
      success: true,
      message: '请求已完成'
    });
  })
);

// @desc    取消请求
// @route   POST /api/requests/:id/cancel
// @access  Private (Request owner or Admin)
router.post('/:id/cancel',
  authenticate,
  [
    body('reason')
      .trim()
      .notEmpty()
      .withMessage('取消原因不能为空')
      .isLength({ max: 200 })
      .withMessage('取消原因不能超过200个字符')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { reason } = req.body;
    
    const request = await Request.findById(req.params.id);

    if (!request) {
      throw createError.notFound('请求未找到');
    }

    // 权限检查
    if (req.user.userType !== 'admin' && request.requester.toString() !== req.user._id.toString()) {
      throw createError.forbidden('只有请求发布者可以取消请求');
    }

    if (request.status === 'completed') {
      throw createError.badRequest('已完成的请求不能取消');
    }

    request.status = 'cancelled';
    request.cancellationReason = reason;
    request.cancelledBy = req.user._id;
    request.cancelledAt = new Date();

    await request.save();

    res.json({
      success: true,
      message: '请求已取消'
    });
  })
);

module.exports = router;