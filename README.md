# Volunteer Service Matching System | 志愿服务匹配系统

## 📖 Project Overview | 项目概述

**English**: A web-based volunteer service matching platform that connects Persons In Need (PIN) with Community Service Representatives (CSR) to facilitate community support and assistance.

**中文**: 一个基于 Web 的志愿服务匹配平台，连接需要帮助的人（PIN）与社区服务代表（CSR），促进社区支持和互助。

---

## ✨ Key Features | 主要功能

### **For PIN Users | 面向 PIN 用户**
- 📝 Create service requests | 创建服务请求
- 👥 Select volunteers | 选择志愿者
- ⭐ Rate services | 评价服务
- 📊 Track request history | 跟踪请求历史

### **For CSR Users | 面向 CSR 用户**
- 🔍 Browse requests | 浏览请求
- 💼 Apply for services | 申请服务
- 📌 Manage shortlist | 管理收藏夹
- 📈 View service statistics | 查看服务统计

### **For Admins | 面向管理员**
- 👨‍💼 User management | 用户管理
- 📊 System reports | 系统报告
- 🏷️ Category management | 分类管理
- ⚙️ System configuration | 系统配置

---

## 🏗️ Architecture | 系统架构

**English**: This project follows the **BCE (Boundary-Control-Entity)** architecture pattern.

**中文**: 本项目遵循 **BCE (Boundary-Control-Entity)** 架构模式。

```
┌─────────────────────────────────────────┐
│         Boundary Layer | 边界层         │
│    (Routes + Validation | 路由+验证)    │
├─────────────────────────────────────────┤
│         Control Layer | 控制层          │
│    (Controllers | 控制器 - 业务逻辑)    │
├─────────────────────────────────────────┤
│         Entity Layer | 实体层           │
│       (Models | 模型 - 数据操作)        │
└─────────────────────────────────────────┘
```

**📚 Detailed Documentation | 详细文档**: See `BCE_ARCHITECTURE.md`

---

## 🚀 Quick Start | 快速开始

### **1. Installation | 安装**

```bash
# Clone repository | 克隆仓库
git clone <repository-url>
cd CSIT314-GP

# Install dependencies | 安装依赖
cd backend && npm install
cd .. && npm install
```

### **2. Configuration | 配置**

Create `.env` file in `backend/` folder | 在 `backend/` 文件夹创建 `.env` 文件:

```env
MONGODB_URI=mongodb://localhost:27017/volunteer-system
JWT_SECRET=your-secret-key
PORT=5000
ADMIN_EMAIL=admin@admin.com
CORS_ORIGIN=http://localhost:3000
```

### **3. Start Application | 启动应用**

```bash
# Windows PowerShell (Recommended | 推荐)
.\start-complete.ps1

# Windows Command Prompt
start-complete.bat

# Manual Start | 手动启动 (Open 2 terminals | 打开2个终端)
cd backend && npm run dev  # Terminal 1 | 终端1
npm start                  # Terminal 2 | 终端2
```

**📚 Detailed Guide | 详细指南**: See `STARTUP_GUIDE.md`

---

## 🛠️ Technology Stack | 技术栈

### **Frontend | 前端**
- ⚛️ React 18
- 🎨 CSS3 (Custom styling)
- 🌐 React Router
- 🔄 Context API

### **Backend | 后端**
- 🟢 Node.js
- 🚂 Express.js
- 🍃 MongoDB + Mongoose
- 🔐 JWT Authentication
- ✅ Express Validator

---

## 📂 Project Structure | 项目结构

```
CSIT314-GP/
├── backend/                      # Backend application | 后端应用
│   ├── controllers/             # Business logic | 业务逻辑
│   │   ├── authController.js   # ✅ Completed | 已完成
│   │   └── userController.js   # ✅ Completed | 已完成
│   ├── models/                  # Data models | 数据模型
│   │   ├── User.js
│   │   ├── Request.js
│   │   ├── Category.js
│   │   └── Shortlist.js
│   ├── routes/                  # API routes | API 路由
│   │   ├── auth.js             # ✅ Refactored | 已重构
│   │   ├── users.js            # ✅ Refactored | 已重构
│   │   ├── requests.js
│   │   ├── admin.js
│   │   └── categories.js
│   ├── middleware/              # Middleware | 中间件
│   │   ├── auth.js
│   │   ├── validation.js       # ✅ Enhanced | 已增强
│   │   └── errorHandler.js
│   └── server.js               # Entry point | 入口文件
│
├── src/                         # Frontend source | 前端源码
│   ├── components/             # React components | React 组件
│   ├── pages/                  # Page components | 页面组件
│   ├── services/               # API services | API 服务
│   ├── context/                # React context | React 上下文
│   ├── styles/                 # CSS styles | CSS 样式
│   └── App.jsx                 # Main app | 主应用
│
├── public/                      # Static files | 静态文件
├── BCE_ARCHITECTURE.md         # 📖 Architecture docs | 架构文档
├── STARTUP_GUIDE.md            # 📖 Startup guide | 启动指南
└── README.md                   # 📖 This file | 本文件
```

---

## 🎯 User Roles | 用户角色

### **PIN (Person In Need) | 需要帮助的人**
**English**: Individuals who need community assistance and volunteer services.

**中文**: 需要社区帮助和志愿服务的个人。

**Access | 权限**:
- ✅ Create service requests | 创建服务请求
- ✅ Manage own requests | 管理自己的请求
- ✅ Select volunteers | 选择志愿者
- ✅ View request history | 查看请求历史

### **CSR (Community Service Representative) | 社区服务代表**
**English**: Volunteers who provide assistance to community members.

**中文**: 为社区成员提供帮助的志愿者。

**Access | 权限**:
- ✅ Browse available requests | 浏览可用请求
- ✅ Apply for requests | 申请请求
- ✅ Manage shortlist | 管理收藏夹
- ✅ View service history | 查看服务历史

### **Admin | 管理员**
**English**: System administrators with full access.

**中文**: 具有完全访问权限的系统管理员。

**Access | 权限**:
- ✅ All PIN & CSR features | 所有 PIN 和 CSR 功能
- ✅ User management | 用户管理
- ✅ System reports | 系统报告
- ✅ Category management | 分类管理

---

## 📡 API Endpoints | API 端点

### **Base URL | 基础地址**
```
Development | 开发: http://localhost:5000/api
```

### **Main Endpoints | 主要端点**

| Method | Endpoint | Description | 描述 | Auth | 认证 |
|--------|----------|-------------|------|------|------|
| POST | `/auth/register` | Register user | 注册用户 | Public | 公开 |
| POST | `/auth/login` | User login | 用户登录 | Public | 公开 |
| GET | `/auth/me` | Get current user | 获取当前用户 | Private | 私有 |
| GET | `/users` | Get all users | 获取所有用户 | Admin | 管理员 |
| GET | `/requests` | Get requests | 获取请求 | Private | 私有 |
| POST | `/requests` | Create request | 创建请求 | PIN | PIN |
| POST | `/requests/:id/apply` | Apply for request | 申请请求 | CSR | CSR |

**📚 Full API Documentation | 完整 API 文档**: See `BCE_ARCHITECTURE.md`

---

## 🔒 Security Features | 安全功能

**English**:
- 🔐 JWT-based authentication
- 🔒 Password hashing with bcrypt
- ✅ Input validation on all endpoints
- 👮 Role-based access control (RBAC)
- 🚦 Rate limiting on API endpoints
- 🛡️ CORS protection

**中文**:
- 🔐 基于 JWT 的认证
- 🔒 使用 bcrypt 的密码哈希
- ✅ 所有端点的输入验证
- 👮 基于角色的访问控制（RBAC）
- 🚦 API 端点的速率限制
- 🛡️ CORS 保护

---

## 📊 Database Schema | 数据库架构

### **Collections | 集合**

```javascript
Users       // User accounts | 用户账户
Requests    // Service requests | 服务请求
Categories  // Request categories | 请求分类
Shortlists  // CSR saved requests | CSR 保存的请求
```

---

## 🧪 Testing | 测试

### **Test Data | 测试数据**

```bash
cd backend

# Generate test data | 生成测试数据
node generate-test-data.js

# Verify test data | 验证测试数据
node verify-test-data.js

# Clear test data | 清除测试数据
node clear-test-data.js
```

### **Test Accounts | 测试账户**

```
PIN Users | PIN 用户:
- pin1@test.com / password123
- pin2@test.com / password123

CSR Users | CSR 用户:
- csr1@test.com / password123
- csr2@test.com / password123

Admin | 管理员:
- admin@admin.com / (set on first registration | 首次注册时设置)
```

---

## 📚 Documentation | 文档

| Document | 文档 | Description | 描述 |
|----------|------|-------------|------|
| `README.md` | 本文件 | Project overview | 项目概述 |
| `BCE_ARCHITECTURE.md` | 架构文档 | Technical architecture | 技术架构 |
| `STARTUP_GUIDE.md` | 启动指南 | Installation & setup | 安装与设置 |

---

## 🐛 Troubleshooting | 故障排除

### **Common Issues | 常见问题**

1. **MongoDB not running | MongoDB 未运行**
   ```bash
   mongod
   ```

2. **Port already in use | 端口被占用**
   ```bash
   # Change port in .env | 修改 .env 中的端口
   PORT=5001
   ```

3. **Module not found | 模块未找到**
   ```bash
   npm install
   ```

**📚 More Help | 更多帮助**: See `STARTUP_GUIDE.md` → Troubleshooting section

---

## 🤝 Contributing | 贡献

**English**: Contributions are welcome! Please follow the BCE architecture pattern when adding new features.

**中文**: 欢迎贡献！添加新功能时请遵循 BCE 架构模式。

### **Development Guidelines | 开发指南**

1. Follow BCE architecture | 遵循 BCE 架构
2. Write clean, documented code | 编写清晰、有文档的代码
3. Test before committing | 提交前测试
4. Use consistent naming | 使用一致的命名

---

## 📝 License | 许可证

**English**: This project is for educational purposes.

**中文**: 本项目用于教育目的。

---

## 👥 Team | 团队

**Course | 课程**: CSIT314  
**Project | 项目**: Volunteer Service Matching System | 志愿服务匹配系统

---

## 📞 Support | 支持

**English**:
- 📖 Read documentation files
- 🐛 Check troubleshooting section
- 💬 Contact development team

**中文**:
- 📖 阅读文档文件
- 🐛 检查故障排除部分
- 💬 联系开发团队

---

## 🎉 Quick Links | 快速链接

- 📖 [Architecture Guide | 架构指南](./BCE_ARCHITECTURE.md)
- 🚀 [Startup Guide | 启动指南](./STARTUP_GUIDE.md)
- 🌐 Frontend: `http://localhost:3000`
- 🔌 Backend API: `http://localhost:5000/api`

---

**Version | 版本**: 1.0  
**Last Updated | 最后更新**: 2025-11-11  
**Status | 状态**: ✅ Production Ready | 生产就绪
