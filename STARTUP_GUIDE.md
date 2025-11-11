# Project Startup Guide | 项目启动指南

## 🚀 Quick Start | 快速开始

### **Prerequisites | 前置要求**

**English**:
- Node.js 14+ installed
- MongoDB installed and running
- Git installed

**中文**:
- 已安装 Node.js 14+
- 已安装并运行 MongoDB
- 已安装 Git

---

## 📦 Installation | 安装

### **1. Install Dependencies | 安装依赖**

```bash
# Backend | 后端
cd backend
npm install

# Frontend | 前端
cd ..
npm install
```

### **2. Configure Environment | 配置环境**

**English**: Create `.env` file in `backend/` folder:

**中文**: 在 `backend/` 文件夹中创建 `.env` 文件：

```env
# MongoDB Connection | MongoDB 连接
MONGODB_URI=mongodb://localhost:27017/volunteer-system

# JWT Secret | JWT 密钥
JWT_SECRET=your-secret-key-here

# Server Port | 服务器端口
PORT=5000

# Admin Email | 管理员邮箱
ADMIN_EMAIL=admin@admin.com

# CORS Origin | 跨域源
CORS_ORIGIN=http://localhost:3000
```

---

## 🎬 Running the Application | 运行应用

### **Option 1: Use Startup Scripts | 选项1：使用启动脚本**

```bash
# Windows PowerShell
.\start-complete.ps1

# Windows Command Prompt
start-complete.bat
```

### **Option 2: Manual Start | 选项2：手动启动**

```bash
# Terminal 1 - Backend | 终端1 - 后端
cd backend
npm run dev

# Terminal 2 - Frontend | 终端2 - 前端
npm start
```

**URLs | 访问地址**:
- Frontend | 前端: `http://localhost:3000`
- Backend | 后端: `http://localhost:5000`

---

## 🗄️ Database Setup | 数据库设置

```bash
cd backend

# Initialize categories | 初始化分类
node init-categories.js

# Generate test data (optional) | 生成测试数据（可选）
node generate-test-data.js
```

---

## 🔑 Default Login | 默认登录

### **Admin | 管理员**
- Email | 邮箱: `admin@admin.com`
- Password | 密码: Set on first registration | 首次注册时设置

### **Test Users | 测试用户**
After running `generate-test-data.js` | 运行测试数据生成后:
- PIN: `pin1@test.com` / `password123`
- CSR: `csr1@test.com` / `password123`

---

## 🌐 User Roles & Access | 用户角色与权限

### **PIN Users | PIN 用户**
**English**: Persons In Need - Request volunteer services

**中文**: 需要帮助的人 - 请求志愿服务

- Create service requests | 创建服务请求
- View own requests | 查看自己的请求
- Select volunteers | 选择志愿者
- Rate completed services | 评价完成的服务

### **CSR Users | CSR 用户**
**English**: Community Service Representatives - Provide volunteer services

**中文**: 社区服务代表 - 提供志愿服务

- Browse available requests | 浏览可用请求
- Apply for requests | 申请请求
- Manage shortlist | 管理收藏夹
- View service history | 查看服务历史

### **Admin Users | 管理员**
**English**: System administrators

**中文**: 系统管理员

- Manage users | 管理用户
- View system reports | 查看系统报告
- Manage categories | 管理分类
- System configuration | 系统配置

---

## 📂 Project Structure | 项目结构

```
CSIT314-GP/
├── backend/                   # Backend (Node.js + Express) | 后端
│   ├── controllers/          # Business logic | 业务逻辑
│   ├── models/              # Database models | 数据库模型
│   ├── routes/              # API routes | API 路由
│   ├── middleware/          # Middleware | 中间件
│   └── server.js           # Entry point | 入口文件
│
├── src/                      # Frontend (React) | 前端
│   ├── components/          # Components | 组件
│   ├── pages/              # Pages | 页面
│   ├── services/           # API services | API 服务
│   └── App.jsx            # Main app | 主应用
│
└── BCE_ARCHITECTURE.md      # Architecture guide | 架构指南
```

---

## 🛠️ Common Commands | 常用命令

### **Development | 开发**

```bash
# Start backend in dev mode | 启动后端开发模式
cd backend && npm run dev

# Start frontend | 启动前端
npm start

# Run tests | 运行测试
npm test
```

### **Database | 数据库**

```bash
cd backend

# Initialize data | 初始化数据
node init-categories.js

# Generate test data | 生成测试数据
node generate-test-data.js

# Clear test data | 清除测试数据
node clear-test-data.js

# View admin info | 查看管理员信息
node show-admin-info.js
```

---

## 🔧 Troubleshooting | 故障排除

### **MongoDB not running | MongoDB 未运行**
```bash
# Start MongoDB | 启动 MongoDB
mongod

# Or use MongoDB Compass | 或使用 MongoDB Compass
```

### **Port already in use | 端口被占用**
```bash
# Change backend port in .env | 修改后端端口
PORT=5001

# Change frontend port | 修改前端端口
set PORT=3001 && npm start  # Windows
PORT=3001 npm start         # Mac/Linux
```

### **Module not found | 模块未找到**
```bash
# Reinstall dependencies | 重新安装依赖
rm -rf node_modules package-lock.json
npm install
```

---

## 📊 API Testing | API 测试

### **Using curl | 使用 curl**

```bash
# Register | 注册
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"123456","userType":"pin"}'

# Login | 登录
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

### **Using Postman | 使用 Postman**

**English**: Import the API collection or test manually at:

**中文**: 导入 API 集合或手动测试：

Base URL | 基础地址: `http://localhost:5000/api`

---

## 📖 Documentation | 文档

- **BCE Architecture | BCE 架构**: See `BCE_ARCHITECTURE.md`
- **API Endpoints | API 端点**: Check backend routes files
- **Components | 组件**: See `src/components/`

---

## 💡 Tips | 提示

**English**:
1. Always start MongoDB before backend
2. Use Chrome DevTools for frontend debugging
3. Check browser console for errors
4. Use `npm run dev` for auto-reload during development

**中文**:
1. 启动后端前始终先启动 MongoDB
2. 使用 Chrome 开发者工具调试前端
3. 检查浏览器控制台的错误
4. 开发时使用 `npm run dev` 启用自动重载

---

## 🎯 Next Steps | 下一步

**English**:
1. Start the application
2. Register as different user types
3. Explore the features
4. Read `BCE_ARCHITECTURE.md` for technical details

**中文**:
1. 启动应用程序
2. 注册不同类型的用户
3. 探索功能
4. 阅读 `BCE_ARCHITECTURE.md` 了解技术细节

---

**Version | 版本**: 1.0  
**Last Updated | 最后更新**: 2025-11-11
