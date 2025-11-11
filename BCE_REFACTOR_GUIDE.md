# BCE 架构重构 - 快速实施指南

## 🎯 当前进度

✅ **已完成** (40%):
- ✅ Auth 模块 (认证相关)
- ✅ User 模块 (用户管理)
- ✅ 验证中间件统一管理

⏳ **待完成** (60%):
- ⏳ Request 模块 (请求管理)
- ⏳ Admin 模块 (管理员功能)
- ⏳ Category 模块 (分类管理)

---

## 🚀 快速完成剩余重构

### 方案一：使用 AI 辅助完成

向 AI 助手说：
```
"请帮我为 backend/routes/requests.js 创建对应的 requestController.js，
并按照 BCE 架构重构 routes/requests.js 文件。
参考 authController.js 和 routes/auth.js 的模式。"
```

### 方案二：手动完成（推荐理解架构）

按照以下模板完成每个模块：

---

## 📋 Request 模块重构模板

### 1. 创建 `backend/controllers/requestController.js`

```javascript
const Request = require('../models/Request');
const User = require('../models/User');
const { asyncHandler, createError } = require('../middleware/errorHandler');

/**
 * Control Layer - 请求控制器
 */

// 获取所有请求
exports.getRequests = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, category, urgency, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  // 构建查询条件（从 routes/requests.js 复制业务逻辑）
  const query = {};
  
  if (req.user.userType === 'pin') {
    query.requester = req.user._id;
  } else if (req.user.userType === 'csr') {
    query.status = { $in: ['pending', 'matched'] };
  }

  if (category) query.category = category;
  if (urgency) query.urgency = urgency;
  if (status && req.user.userType !== 'csr') query.status = status;

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { 'location.address': { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const [requests, total] = await Promise.all([
    Request.find(query)
      .populate('requester', 'name email phone userType')
      .populate('assignedVolunteers.volunteer', 'name email phone organization')
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
});

// 获取单个请求详情
exports.getRequestById = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id)
    .populate('requester', 'name email phone address userType')
    .populate('interestedVolunteers.volunteer', 'name email phone organization skills')
    .populate('assignedVolunteers.volunteer', 'name email phone organization skills');

  if (!request) {
    throw createError.notFound('请求未找到');
  }

  if (req.user.userType === 'pin' && request.requester._id.toString() !== req.user._id.toString()) {
    throw createError.forbidden('您只能查看自己的请求');
  }

  if (req.user.userType === 'csr') {
    await request.incrementViewCount();
  }

  res.json({
    success: true,
    data: { request }
  });
});

// 创建新请求
exports.createRequest = asyncHandler(async (req, res) => {
  const requestData = {
    ...req.body,
    requester: req.user._id
  };

  const request = await Request.create(requestData);
  
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
});

// 更新请求
exports.updateRequest = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id);

  if (!request) {
    throw createError.notFound('请求未找到');
  }

  if (req.user.userType !== 'admin' && request.requester.toString() !== req.user._id.toString()) {
    throw createError.forbidden('您只能修改自己的请求');
  }

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
});

// 删除请求
exports.deleteRequest = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id);

  if (!request) {
    throw createError.notFound('请求未找到');
  }

  const requesterId = request.requester._id || request.requester;
  if (req.user.userType !== 'admin' && requesterId.toString() !== req.user._id.toString()) {
    throw createError.forbidden('您只能删除自己的请求');
  }

  if (request.interestedVolunteers?.length > 0 || request.assignedVolunteers?.length > 0) {
    throw createError.badRequest('已有志愿者申请的请求不能删除，请取消请求');
  }

  await Request.findByIdAndDelete(req.params.id);

  await User.findByIdAndUpdate(request.requester, {
    $inc: { 'stats.totalRequests': -1 }
  });

  res.json({
    success: true,
    message: '请求删除成功'
  });
});

// 申请志愿服务
exports.applyForRequest = asyncHandler(async (req, res) => {
  const { message = '' } = req.body;
  const request = await Request.findById(req.params.id);

  if (!request) {
    throw createError.notFound('请求未找到');
  }

  if (request.status !== 'pending') {
    throw createError.badRequest('只能申请待处理的请求');
  }

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
});

// 取消申请
exports.cancelApplication = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id);

  if (!request) {
    throw createError.notFound('请求未找到');
  }

  request.interestedVolunteers = request.interestedVolunteers.filter(
    interest => interest.volunteer.toString() !== req.user._id.toString()
  );

  await request.save();

  res.json({
    success: true,
    message: '申请已取消'
  });
});

// 分配志愿者
exports.assignVolunteer = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id);

  if (!request) {
    throw createError.notFound('请求未找到');
  }

  if (req.user.userType !== 'admin' && request.requester.toString() !== req.user._id.toString()) {
    throw createError.forbidden('只有请求发布者可以分配志愿者');
  }

  const volunteer = await User.findById(req.params.volunteerId);
  if (!volunteer || volunteer.userType !== 'csr') {
    throw createError.badRequest('志愿者不存在或类型错误');
  }

  await request.assignVolunteer(req.params.volunteerId);

  await User.findByIdAndUpdate(req.params.volunteerId, {
    $inc: { 'stats.totalVolunteered': 1 }
  });

  res.json({
    success: true,
    message: '志愿者分配成功'
  });
});

// 完成请求
exports.completeRequest = asyncHandler(async (req, res) => {
  const { rating, feedback, actualDuration } = req.body;
  const request = await Request.findById(req.params.id);

  if (!request) {
    throw createError.notFound('请求未找到');
  }

  if (req.user.userType !== 'admin' && request.requester.toString() !== req.user._id.toString()) {
    throw createError.forbidden('只有请求发布者可以完成请求');
  }

  if (request.status !== 'matched') {
    throw createError.badRequest('只能完成已匹配的请求');
  }

  await request.markCompleted({ rating, feedback, actualDuration });

  await Promise.all([
    User.findByIdAndUpdate(request.requester, {
      $inc: { 'stats.completedRequests': 1 }
    }),
    ...request.assignedVolunteers.map(assignment => 
      User.findByIdAndUpdate(assignment.volunteer, {
        $inc: { 'stats.completedServices': 1 }
      })
    )
  ]);

  res.json({
    success: true,
    message: '请求已完成'
  });
});

// 取消请求
exports.cancelRequest = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const request = await Request.findById(req.params.id);

  if (!request) {
    throw createError.notFound('请求未找到');
  }

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
});

module.exports = exports;
```

### 2. 更新 `backend/routes/requests.js`

```javascript
const express = require('express');
const requestController = require('../controllers/requestController');
const { authenticate, authorize } = require('../middleware/auth');
const { 
  createRequestValidation, 
  getRequestsValidation, 
  updateRequestValidation,
  handleValidationErrors 
} = require('../middleware/validation');
const { body } = require('express-validator');

const router = express.Router();

// 获取所有请求
router.get('/', 
  getRequestsValidation,
  handleValidationErrors,
  requestController.getRequests
);

// 获取单个请求详情
router.get('/:id', 
  requestController.getRequestById
);

// 创建新请求
router.post('/', 
  authorize('pin'),
  createRequestValidation,
  handleValidationErrors,
  requestController.createRequest
);

// 更新请求
router.put('/:id', 
  updateRequestValidation,
  handleValidationErrors,
  requestController.updateRequest
);

// 删除请求
router.delete('/:id', 
  authenticate, 
  requestController.deleteRequest
);

// 申请志愿服务
router.post('/:id/apply',
  authorize('csr'),
  [
    body('message').optional().trim().isLength({ max: 300 })
      .withMessage('申请留言不能超过300个字符')
  ],
  handleValidationErrors,
  requestController.applyForRequest
);

// 取消申请
router.delete('/:id/apply',
  authorize('csr'),
  requestController.cancelApplication
);

// 分配志愿者
router.post('/:id/assign/:volunteerId', 
  requestController.assignVolunteer
);

// 完成请求
router.post('/:id/complete',
  [
    body('rating').optional().isInt({ min: 1, max: 5 }),
    body('feedback').optional().trim().isLength({ max: 500 })
  ],
  handleValidationErrors,
  requestController.completeRequest
);

// 取消请求
router.post('/:id/cancel',
  [
    body('reason').trim().notEmpty().isLength({ max: 200 })
      .withMessage('取消原因不能为空且不能超过200个字符')
  ],
  handleValidationErrors,
  requestController.cancelRequest
);

module.exports = router;
```

---

## ✅ 完成后检查清单

- [ ] Controller 文件已创建并包含所有业务逻辑
- [ ] Route 文件已简化，只包含路由映射
- [ ] 所有验证规则已添加到 validation.js
- [ ] 运行 `npm start` 确保服务器启动正常
- [ ] 使用 Postman 测试几个关键 API
- [ ] 检查没有编译错误

---

## 🧪 测试建议

### 测试 Auth API
```bash
# 注册用户
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123",
  "userType": "pin"
}

# 登录
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

---

## 💡 提示

1. **复制业务逻辑时要小心**：确保所有的 `req.user` 和 `req.params` 都正确使用
2. **保持一致性**：所有响应格式应该一致
3. **错误处理**：使用 `asyncHandler` 和 `createError`
4. **测试优先**：每完成一个 Controller，立即测试对应的 API

---

## 📞 需要帮助？

如果遇到问题，可以：
1. 检查已完成的 `authController.js` 和 `userController.js` 作为参考
2. 查看 `BCE_ARCHITECTURE.md` 了解架构详情
3. 运行 `npm run dev` 查看错误日志

---

**祝重构顺利！** 🎉
