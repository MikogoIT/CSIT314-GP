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
  userType: { type: String, enum: ['pin', 'csr', 'admin'] }
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
**Version | 版本**: 1.0  
**Status | 状态**: Production Ready | 生产就绪
