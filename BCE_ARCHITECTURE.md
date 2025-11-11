# BCE Architecture Guide | BCE 架构指南

## 📋 Overview | 概述

**English**: This project follows the **BCE (Boundary-Control-Entity)** architecture pattern, which separates the application into three distinct layers for better maintainability and scalability.

**中文**: 本项目采用 **BCE (Boundary-Control-Entity)** 架构模式，将应用程序分为三个独立的层次，以提高可维护性和可扩展性。

---

## 🏗️ Architecture Layers | 架构层次

### **Entity Layer (E) | 实体层** ✅

**English**: 
- **Location**: `backend/models/`
- **Responsibility**: Data models and database interactions
- **Contains**: MongoDB schemas, data validation, and database operations

**中文**:
- **位置**: `backend/models/`
- **职责**: 数据模型和数据库交互
- **包含**: MongoDB 模式、数据验证和数据库操作

```
backend/models/
├── User.js          # User entity | 用户实体
├── Request.js       # Request entity | 请求实体
├── Category.js      # Category entity | 分类实体
└── Shortlist.js     # Shortlist entity | 收藏夹实体
```

**Example | 示例**:
```javascript
// User entity with validation
// 用户实体与验证
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  userType: { 
    type: String, 
    enum: ['pin', 'csr', 'system_admin', 'platform_manager'] 
  }
});
```

---

### **Boundary Layer (B) | 边界层** ✅

**English**:
- **Location**: `backend/routes/` + `backend/middleware/`
- **Responsibility**: Handle HTTP requests/responses, routing, and validation
- **Contains**: Route definitions, input validation, authentication middleware

**中文**:
- **位置**: `backend/routes/` + `backend/middleware/`
- **职责**: 处理 HTTP 请求/响应、路由和验证
- **包含**: 路由定义、输入验证、认证中间件

```
backend/
├── routes/                    # Route mappings | 路由映射
│   ├── auth.js               # Auth routes | 认证路由
│   ├── users.js              # User routes | 用户路由
│   ├── requests.js           # Request routes | 请求路由
│   ├── admin.js              # Admin routes | 管理员路由
│   └── categories.js         # Category routes | 分类路由
│
└── middleware/               # Middleware | 中间件
    ├── auth.js              # Authentication | 认证中间件
    ├── validation.js        # Validation rules | 验证规则
    └── errorHandler.js      # Error handling | 错误处理
```

**Example | 示例**:
```javascript
// Route definition - Only mapping, no business logic
// 路由定义 - 只做映射，不含业务逻辑
router.post('/register', 
  registerValidation,        // Validate input | 验证输入
  handleValidationErrors,    // Handle errors | 处理错误
  authController.register    // Business logic | 业务逻辑
);
```

---

### **Control Layer (C) | 控制层** ✅

**English**:
- **Location**: `backend/controllers/`
- **Responsibility**: Business logic and coordination between layers
- **Contains**: Business rules, data processing, response formatting

**中文**:
- **位置**: `backend/controllers/`
- **职责**: 业务逻辑和层间协调
- **包含**: 业务规则、数据处理、响应格式化

```
backend/controllers/
├── authController.js         # Auth logic | 认证逻辑
├── userController.js         # User management logic | 用户管理逻辑
└── adminController.js        # Admin operations logic | 管理员操作逻辑
```
├── userController.js         # User logic | 用户逻辑
├── requestController.js      # Request logic | 请求逻辑
├── adminController.js        # Admin logic | 管理员逻辑
└── categoryController.js     # Category logic | 分类逻辑
```

**Example | 示例**:
```javascript
// Controller with business logic
// 包含业务逻辑的控制器
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, userType } = req.body;

  // Business logic: Check if user exists
  // 业务逻辑：检查用户是否存在
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw createError.conflict('Email already exists | 邮箱已存在');
  }

  // Business logic: Create user
  // 业务逻辑：创建用户
  const user = await User.create({ name, email, password, userType });
  
  // Generate token and respond
  // 生成令牌并响应
  const token = generateToken(user._id);
  res.status(201).json({ success: true, data: { token, user } });
});
```

---

## 📊 Architecture Benefits | 架构优势

### **English**:
1. **Separation of Concerns**: Each layer has a single responsibility
2. **Maintainability**: Easy to locate and fix bugs
3. **Testability**: Controllers can be unit tested independently
4. **Scalability**: Easy to add new features without affecting existing code
5. **Code Reusability**: Validation rules and middleware can be reused

### **中文**:
1. **关注点分离**: 每层都有单一职责
2. **可维护性**: 易于定位和修复错误
3. **可测试性**: 控制器可以独立进行单元测试
4. **可扩展性**: 易于添加新功能而不影响现有代码
5. **代码复用**: 验证规则和中间件可以复用

---

## 🔄 Request Flow | 请求流程

**English**:
```
Client Request → Boundary (Routes + Validation) → 
Control (Business Logic) → Entity (Database) → 
Control → Boundary → Client Response
```

**中文**:
```
客户端请求 → 边界层（路由 + 验证）→ 
控制层（业务逻辑）→ 实体层（数据库）→ 
控制层 → 边界层 → 客户端响应
```

**Detailed Example | 详细示例**:
```
1. POST /api/auth/register (Client | 客户端)
   ↓
2. Route matches: auth.js (Boundary | 边界层)
   ↓
3. Validation: registerValidation (Boundary | 边界层)
   ↓
4. Business Logic: authController.register (Control | 控制层)
   ↓
5. Database: User.create() (Entity | 实体层)
   ↓
6. Response: JSON with token (Boundary | 边界层)
   ↓
7. Client receives response (Client | 客户端)
```

---

## ✅ Implementation Status | 实施状态

### **Completed | 已完成** ✅

| Module | 模块 | Status | 状态 |
|--------|------|--------|------|
| Auth | 认证 | ✅ Complete | 完成 |
| User Management | 用户管理 | ✅ Complete | 完成 |
| Validation | 验证 | ✅ Complete | 完成 |

**Files Created | 创建的文件**:
- `controllers/authController.js` (267 lines | 行)
- `controllers/userController.js` (422 lines | 行)
- Updated `routes/auth.js` (70 lines, -79% | 减少79%)
- Updated `routes/users.js` (150 lines, -72% | 减少72%)

---

## 📝 Code Standards | 代码规范

### **Naming Conventions | 命名规范**

**English**:
- Controllers: Use verb prefixes (`getUsers`, `createRequest`)
- Routes: Keep concise, delegate to controllers
- Middleware: Use descriptive names (`authenticate`, `validateInput`)

**中文**:
- 控制器：使用动词前缀（`getUsers`、`createRequest`）
- 路由：保持简洁，委托给控制器
- 中间件：使用描述性名称（`authenticate`、`validateInput`）

### **Response Format | 响应格式**

**English**: All API responses follow this format:

**中文**: 所有 API 响应遵循此格式：

```javascript
// Success | 成功
{
  "success": true,
  "message": "Operation successful | 操作成功",
  "data": { ... }
}

// Error | 错误
{
  "success": false,
  "error": "Error message | 错误消息",
  "code": "ERROR_CODE"
}
```

### **Error Handling | 错误处理**

**English**: Use unified error handling:

**中文**: 使用统一错误处理：

```javascript
// Use asyncHandler for all async operations
// 所有异步操作使用 asyncHandler
exports.someMethod = asyncHandler(async (req, res) => {
  // Use createError for exceptions
  // 使用 createError 抛出异常
  if (!data) {
    throw createError.notFound('Resource not found | 资源未找到');
  }
});
```

---

## 🚀 Getting Started | 快速开始

### **Development | 开发**

```bash
# Install dependencies | 安装依赖
cd backend
npm install

# Start development server | 启动开发服务器
npm run dev

# Start production server | 启动生产服务器
npm start
```

### **Testing API | 测试 API**

```bash
# Register user | 注册用户
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "userType": "pin"
}

# Login | 登录
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

---

## 📚 API Documentation | API 文档

### **Authentication Endpoints | 认证端点**

| Method | Endpoint | Description | 描述 |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | 注册新用户 |
| POST | `/api/auth/login` | User login | 用户登录 |
| GET | `/api/auth/me` | Get current user | 获取当前用户 |
| PUT | `/api/auth/profile` | Update profile | 更新资料 |
| PUT | `/api/auth/change-password` | Change password | 修改密码 |
| POST | `/api/auth/logout` | Logout | 登出 |

### **User Management Endpoints | 用户管理端点**

| Method | Endpoint | Description | 描述 | Access | 权限 |
|--------|----------|-------------|------|--------|------|
| GET | `/api/users` | Get users list | 获取用户列表 | Admin | 管理员 |
| GET | `/api/users/:id` | Get user by ID | 获取用户详情 | Owner/Admin | 本人/管理员 |
| PUT | `/api/users/:id/status` | Update user status | 更新用户状态 | Admin | 管理员 |
| DELETE | `/api/users/:id` | Delete user | 删除用户 | Admin | 管理员 |
| GET | `/api/users/:id/stats` | Get user stats | 获取用户统计 | Owner/Admin | 本人/管理员 |

---

## 🔒 Security | 安全性

**English**:
- JWT-based authentication
- Password hashing with bcrypt
- Input validation on all endpoints
- Role-based access control (RBAC)
- **Two-tier admin system**: System Admin and Platform Manager
- Rate limiting on API endpoints

**中文**:
- 基于 JWT 的认证
- 使用 bcrypt 的密码哈希
- 所有端点的输入验证
- 基于角色的访问控制（RBAC）
- **双层管理员系统**: 系统管理员和平台管理者
- API 端点的速率限制

---

## 👥 Admin Role System | 管理员角色系统

### **System Admin (系统管理员)** 🔧

**English**:
- **Core Responsibility**: Technical maintenance and system security
- **Focus**: Backend infrastructure, user accounts, system stability
- **Key Functions**:
  - User and account management (#50, #52, #55, #70)
  - System security and log monitoring (#51)
  - Technical configuration and limits (#56)
  - Alert configuration (#48)
  - Database maintenance

**中文**:
- **核心职责**: 技术保障与系统维护
- **关注点**: 后台基础设施、用户账户、系统稳定性
- **主要功能**:
  - 用户和账户管理 (#50, #52, #55, #70)
  - 系统安全和日志监控 (#51)
  - 技术配置和限制 (#56)
  - 警报配置 (#48)
  - 数据库维护

**API Endpoints**:
```javascript
// System Admin only routes
GET    /api/admin/users                    // List all users | 查看所有用户
POST   /api/admin/users                    // Create user | 创建用户
PUT    /api/admin/users/:userId            // Update user | 更新用户
PATCH  /api/admin/users/:userId/status     // Suspend/activate | 停用/激活
DELETE /api/admin/users/:userId            // Delete user | 删除用户
GET    /api/admin/system/logs              // View system logs | 查看系统日志
POST   /api/admin/system/alerts            // Configure alerts | 配置警报
POST   /api/admin/system/file-limits       // Set file limits | 设置文件限制
```

---

### **Platform Manager (平台管理者)** 📊

**English**:
- **Core Responsibility**: Business operations and strategic analysis
- **Focus**: Content management, data analysis, platform growth
- **Key Functions**:
  - Service category management (#57)
  - Report generation (#58)
  - User participation monitoring (#59)
  - Efficiency metrics analysis (#60)
  - CSR performance tracking (#62)

**中文**:
- **核心职责**: 业务运营与战略分析
- **关注点**: 内容管理、数据分析、平台发展
- **主要功能**:
  - 服务类别管理 (#57)
  - 报告生成 (#58)
  - 用户参与度监控 (#59)
  - 效率指标分析 (#60)
  - CSR 绩效跟踪 (#62)

**API Endpoints**:
```javascript
// Platform Manager only routes
POST   /api/admin/categories/:action       // Manage categories | 管理类别
GET    /api/admin/reports                  // Generate reports | 生成报告
GET    /api/admin/metrics/participation    // Participation metrics | 参与度指标
GET    /api/admin/metrics/efficiency       // Efficiency metrics | 效率指标
GET    /api/admin/csr/performance          // CSR performance | CSR绩效
```

---

### **Shared Admin Functions | 共享管理员功能**

**Both admin types can access | 两种管理员都可访问**:
```javascript
GET    /api/admin/dashboard                // System dashboard | 系统仪表板
GET    /api/admin/stats                    // Quick stats | 快速统计
```

---

### **Permission Middleware | 权限中间件**

**English**: The system uses specialized middleware to enforce admin role separation:

**中文**: 系统使用专门的中间件来强制执行管理员角色分离：

```javascript
// middleware/auth.js

// System Admin only | 仅系统管理员
const systemAdminOnly = (req, res, next) => {
  if (req.user.userType !== 'system_admin' && !req.user.isSuper) {
    return res.status(403).json({ 
      error: 'System Administrator privileges required' 
    });
  }
  next();
};

// Platform Manager only | 仅平台管理者
const platformManagerOnly = (req, res, next) => {
  if (req.user.userType !== 'platform_manager' && !req.user.isSuper) {
    return res.status(403).json({ 
      error: 'Platform Manager privileges required' 
    });
  }
  next();
};

// Any admin type | 任意管理员类型
const anyAdminType = (...adminTypes) => {
  return (req, res, next) => {
    if (req.user.isSuper || adminTypes.includes(req.user.userType)) {
      return next();
    }
    return res.status(403).json({ error: 'Insufficient permissions' });
  };
};

// Both admin types | 两种管理员类型都可以
const adminOnly = (req, res, next) => {
  const adminTypes = ['system_admin', 'platform_manager'];
  if (!adminTypes.includes(req.user.userType) && !req.user.isSuper) {
    return res.status(403).json({ 
      error: 'Administrator privileges required' 
    });
  }
  next();
};
```

---

### **User Model Schema | 用户模型结构**

**English**: The system uses four distinct user types without a generic 'admin' type:

**中文**: 系统使用四种独立的用户类型，不再有通用的 'admin' 类型：

```javascript
// models/User.js
const userSchema = new mongoose.Schema({
  userType: {
    type: String,
    enum: ['pin', 'csr', 'system_admin', 'platform_manager'],
    required: true
  },
  
  // Super admin flag (has all permissions)
  // 超级管理员标志（拥有所有权限）
  isSuper: {
    type: Boolean,
    default: false
  }
});
```

**User Types | 用户类型**:
- `pin` - Person In Need (服务需求者)
- `csr` - Community Service Representative (志愿者)
- `system_admin` - System Administrator (系统管理员)
- `platform_manager` - Platform Manager (平台管理者)

---

## 🔒 Security | 安全性

**English**:
- JWT-based authentication
- Password hashing with bcrypt
- Input validation on all endpoints
- Role-based access control (RBAC)
- Rate limiting on API endpoints

**中文**:
- 基于 JWT 的认证
- 使用 bcrypt 的密码哈希
- 所有端点的输入验证
- 基于角色的访问控制（RBAC）
- API 端点的速率限制

---

## 📖 Reference | 参考资料

**English**:
- [BCE Architecture Pattern](https://en.wikipedia.org/wiki/Boundary-Control-Entity)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [RESTful API Design](https://restfulapi.net/)

**中文**:
- [BCE 架构模式](https://en.wikipedia.org/wiki/Boundary-Control-Entity)
- [Express.js 最佳实践](https://expressjs.com/en/advanced/best-practice-performance.html)
- [RESTful API 设计](https://restfulapi.net/)

---

## 💡 Tips | 提示

**English**:
1. Always use `asyncHandler` for async controller methods
2. Keep routes simple - delegate to controllers
3. Validate input at the boundary layer
4. Use descriptive error messages
5. Follow consistent naming conventions

**中文**:
1. 异步控制器方法始终使用 `asyncHandler`
2. 保持路由简单 - 委托给控制器
3. 在边界层验证输入
4. 使用描述性错误消息
5. 遵循一致的命名约定

---

**Last Updated | 最后更新**: 2025-11-11  
**Version | 版本**: 2.0  
**Status | 状态**: Production Ready | 生产就绪  
**Major Changes | 主要变更**: Added two-tier admin system (System Admin & Platform Manager) | 添加双层管理员系统（系统管理员和平台管理者）
