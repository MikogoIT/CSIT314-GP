# BCE 架构重构说明文档

## 📋 概述

本项目已按照 **BCE (Boundary-Control-Entity)** 架构模式进行重构，将业务逻辑从路由层分离到控制器层，实现清晰的分层架构。

## 🏗️ BCE 架构层次

### **Entity 层 (实体层)** ✅
**位置**: `backend/models/`

负责数据模型定义和数据库交互。

```
backend/models/
├── User.js          # 用户实体
├── Request.js       # 请求实体
├── Category.js      # 分类实体
└── Shortlist.js     # 收藏夹实体
```

**职责**:
- 定义数据结构和 Schema
- 数据验证规则
- 数据库操作方法
- 实体间关系定义

**示例**:
```javascript
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  userType: { type: String, enum: ['pin', 'csr', 'admin'] }
});
```

---

### **Boundary 层 (边界层)** ✅
**位置**: `backend/routes/` + `backend/middleware/`

负责处理外部请求和响应，包括路由映射和输入验证。

```
backend/
├── routes/                    # 路由定义（只做映射）
│   ├── auth.js               # 认证路由
│   ├── users.js              # 用户管理路由
│   ├── requests.js           # 请求管理路由
│   ├── admin.js              # 管理员路由
│   └── categories.js         # 分类管理路由
│
└── middleware/               # 中间件
    ├── auth.js              # 认证授权中间件
    ├── validation.js        # 输入验证规则
    └── errorHandler.js      # 错误处理中间件
```

**职责**:
- 路由定义和映射
- 请求参数验证
- 认证和授权检查
- 错误处理和响应格式化

**示例** (auth.js 路由):
```javascript
const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { registerValidation, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// 用户注册 - 只负责路由映射
router.post('/register', 
  registerValidation,           // Boundary: 输入验证
  handleValidationErrors,       // Boundary: 错误处理
  authController.register       // Control: 业务逻辑
);

module.exports = router;
```

---

### **Control 层 (控制层)** ✅
**位置**: `backend/controllers/`

负责业务逻辑处理，协调 Entity 层和 Boundary 层。

```
backend/controllers/
├── authController.js         # 认证业务逻辑
├── userController.js         # 用户管理业务逻辑
├── requestController.js      # 请求管理业务逻辑（待完成）
├── adminController.js        # 管理员业务逻辑（待完成）
└── categoryController.js     # 分类管理业务逻辑（待完成）
```

**职责**:
- 业务逻辑实现
- 调用 Entity 层进行数据操作
- 业务规则验证
- 返回处理结果

**示例** (authController.js):
```javascript
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { asyncHandler, createError } = require('../middleware/errorHandler');

// 用户注册 - 包含完整业务逻辑
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, userType } = req.body;

  // 业务逻辑：检查邮箱是否已存在
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw createError.conflict('该邮箱已被注册');
  }

  // 业务逻辑：创建用户
  const user = await User.create({ name, email, password, userType });

  // 业务逻辑：生成 token
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: '注册成功',
    data: { token, user }
  });
});
```

---

## ✅ 已完成的重构

### 1. **认证模块** (Auth)
- ✅ `controllers/authController.js` - 业务逻辑
- ✅ `routes/auth.js` - 路由映射
- ✅ `middleware/validation.js` - 验证规则

**包含功能**:
- 用户注册
- 用户登录
- 获取当前用户信息
- 更新个人资料
- 修改密码
- 用户登出

### 2. **用户管理模块** (Users)
- ✅ `controllers/userController.js` - 业务逻辑
- ✅ `routes/users.js` - 路由映射

**包含功能**:
- 获取用户列表
- 获取单个用户信息
- 更新用户状态
- 删除用户
- 获取用户统计
- 收藏夹管理（CSR）
- 历史记录查询

### 3. **验证中间件统一管理**
- ✅ `middleware/validation.js` - 所有验证规则集中管理

---

## 🚧 待完成的重构

### 1. **请求管理模块** (Requests)
需要创建:
- `controllers/requestController.js`
- 更新 `routes/requests.js`

**建议方法**:
```javascript
// controllers/requestController.js
exports.getRequests = asyncHandler(async (req, res) => { ... });
exports.getRequestById = asyncHandler(async (req, res) => { ... });
exports.createRequest = asyncHandler(async (req, res) => { ... });
exports.updateRequest = asyncHandler(async (req, res) => { ... });
exports.deleteRequest = asyncHandler(async (req, res) => { ... });
exports.applyForRequest = asyncHandler(async (req, res) => { ... });
exports.assignVolunteer = asyncHandler(async (req, res) => { ... });
exports.completeRequest = asyncHandler(async (req, res) => { ... });
exports.cancelRequest = asyncHandler(async (req, res) => { ... });
```

### 2. **管理员模块** (Admin)
需要创建:
- `controllers/adminController.js`
- 更新 `routes/admin.js`

### 3. **分类管理模块** (Categories)
需要创建:
- `controllers/categoryController.js`
- 更新 `routes/categories.js`

---

## 📐 重构步骤模板

为每个模块重构，请按照以下步骤：

### Step 1: 创建 Controller
```javascript
// backend/controllers/xxxController.js
const Model = require('../models/Model');
const { asyncHandler, createError } = require('../middleware/errorHandler');

exports.methodName = asyncHandler(async (req, res) => {
  // 1. 从 req 获取参数
  // 2. 业务逻辑处理
  // 3. 调用 Model 进行数据操作
  // 4. 返回响应
  res.json({ success: true, data: {...} });
});
```

### Step 2: 更新 Route
```javascript
// backend/routes/xxx.js
const express = require('express');
const controller = require('../controllers/xxxController');
const { authenticate, authorize } = require('../middleware/auth');
const { validationRules, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

router.get('/', 
  authenticate,              // 认证中间件
  validationRules,          // 验证中间件
  handleValidationErrors,   // 错误处理
  controller.methodName     // 控制器方法
);

module.exports = router;
```

### Step 3: 添加验证规则到 validation.js
```javascript
// backend/middleware/validation.js
exports.xxxValidation = [
  body('field').validation().withMessage('错误信息'),
  // ...
];
```

---

## 🎯 架构优势

### 1. **关注点分离**
- Routes 只负责路由映射
- Controllers 只负责业务逻辑
- Models 只负责数据操作
- Middleware 负责通用功能

### 2. **易于维护**
- 代码结构清晰
- 修改某个功能只需修改对应的 Controller
- 不影响其他模块

### 3. **可测试性**
- Controller 可以独立测试
- 可以 mock Entity 层进行单元测试

### 4. **可扩展性**
- 添加新功能只需添加新的 Controller 方法
- 路由映射保持简洁

### 5. **代码复用**
- 验证规则集中管理
- 中间件可重复使用

---

## 📝 使用示例

### 前端调用 API
```javascript
// 用户注册
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    userType: 'pin'
  })
});
```

### API 请求流程
```
1. 客户端请求 → 
2. Route (Boundary) → 验证中间件 → 认证中间件 → 
3. Controller (Control) → 业务逻辑处理 → 
4. Model (Entity) → 数据库操作 → 
5. Controller → 返回响应 → 
6. 客户端接收
```

---

## 🔍 代码检查清单

在重构每个模块时，请确保：

- [ ] Controller 中没有直接的 Express 中间件逻辑
- [ ] Route 中没有业务逻辑代码
- [ ] 所有验证规则都在 validation.js 中定义
- [ ] Controller 方法使用 asyncHandler 包装
- [ ] 错误使用 createError 统一处理
- [ ] 所有响应格式一致：`{ success, message?, data?, error? }`
- [ ] 添加了清晰的注释和 @desc/@route/@access 标记

---

## 🚀 下一步建议

1. **完成剩余模块重构**
   - 按照模板创建 requestController.js
   - 按照模板创建 adminController.js
   - 按照模板创建 categoryController.js

2. **测试所有 API 端点**
   - 使用 Postman 或类似工具测试
   - 确保所有端点正常工作

3. **添加单元测试**
   - 为 Controller 添加单元测试
   - 测试业务逻辑正确性

4. **文档完善**
   - 添加 API 文档
   - 补充代码注释

---

## 📚 参考资料

- [BCE 架构模式介绍](https://en.wikipedia.org/wiki/Boundary-Control-Entity)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Node.js Design Patterns](https://www.nodejsdesignpatterns.com/)

---

## 👥 团队协作建议

1. **代码审查**: 每次提交前检查是否符合 BCE 架构
2. **命名规范**: Controller 方法使用动词开头 (get, create, update, delete)
3. **错误处理**: 统一使用 createError 和 asyncHandler
4. **文档更新**: 每次添加新功能时更新此文档

---

**重构日期**: 2025-11-11
**重构状态**: 进行中 (40% 完成)
**最后更新**: Auth 和 User 模块已完成重构
