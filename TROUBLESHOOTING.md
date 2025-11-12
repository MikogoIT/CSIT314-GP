# 🔧 Docker部署故障排查指南

## 常见问题与解决方案

### 1. ❌ ERR_CONNECTION_REFUSED 错误

**错误信息：**
```
POST http://localhost:5000/api/auth/login net::ERR_CONNECTION_REFUSED
```

**原因：**
前端代码直接访问 `http://localhost:5000`，但在Docker环境下，`localhost` 指向的是浏览器所在的主机，而不是Docker容器网络。

**解决方案：**
✅ 已修复！现在使用相对路径 `/api`，所有请求通过nginx代理到后端。

**配置更改：**
1. `.env` 文件添加：
   ```env
   REACT_APP_API_URL=/api
   ```

2. `Dockerfile` 构建时传入环境变量：
   ```dockerfile
   ARG REACT_APP_API_URL=/api
   ENV REACT_APP_API_URL=$REACT_APP_API_URL
   ```

3. `docker-compose.yml` 传递构建参数：
   ```yaml
   frontend:
     build:
       args:
         REACT_APP_API_URL: /api
   ```

**重新构建：**
```bash
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

---

### 2. ⚠️ favicon.ico 404 错误

**错误信息：**
```
GET http://localhost:3000/favicon.ico 404 (Not Found)
```

**原因：**
浏览器自动请求网站图标，但项目中未提供 `favicon.ico` 文件。

**影响：**
仅影响浏览器标签栏图标显示，不影响功能。

**解决方案（可选）：**

**方法1：添加 favicon.ico**
1. 准备一个 16x16 或 32x32 的 ICO 图标文件
2. 放置到 `public/favicon.ico`
3. 重新构建前端容器

**方法2：在 index.html 中指定路径**
编辑 `public/index.html`：
```html
<link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
```

**方法3：忽略此错误**
不影响功能，可以不处理。

---

### 3. 🔐 MongoDB Atlas 认证失败

**错误信息：**
```
bad auth : authentication failed
```

**原因：**
- 用户名或密码错误
- 密码包含特殊字符未进行URL编码
- 数据库用户权限不足
- IP白名单未配置

**解决方案：**

**步骤1：检查密码特殊字符**
如果密码包含 `@`, `#`, `$`, `%`, `:`, `/` 等特殊字符，需要URL编码：

| 字符 | URL编码 |
|------|---------|
| @    | %40     |
| #    | %23     |
| $    | %24     |
| %    | %25     |
| :    | %3A     |
| /    | %2F     |

**示例：**
```
原密码：msl@2012#15
编码后：msl%402012%2315

连接字符串：
mongodb+srv://mikogo:msl%402012%2315@csit314.9j8jcrg.mongodb.net/csit314?retryWrites=true&w=majority
```

**步骤2：检查MongoDB Atlas用户配置**

1. 登录 [MongoDB Atlas](https://cloud.mongodb.com/)
2. 进入 **Database Access**
3. 确认用户 `mikogo` 存在
4. 检查权限（建议：`Atlas Admin` 或至少 `readWrite@csit314`）
5. 如需修改，点击 **Edit** → **Built-in Role** → 选择权限 → **Update User**

**步骤3：检查IP白名单**

1. 进入 **Network Access**
2. 确认有以下条目之一：
   - `0.0.0.0/0` （允许所有IP，开发环境用）
   - 你的服务器公网IP
3. 如没有，点击 **Add IP Address** → **Allow Access from Anywhere** → **Confirm**

**步骤4：测试连接字符串**

使用 MongoDB Compass 或 mongosh 测试：
```bash
mongosh "mongodb+srv://mikogo:<password>@csit314.9j8jcrg.mongodb.net/csit314?retryWrites=true&w=majority"
```

**步骤5：更新 .env 文件**
```env
MONGODB_URI=mongodb+srv://mikogo:<正确的密码>@csit314.9j8jcrg.mongodb.net/csit314?retryWrites=true&w=majority
```

**步骤6：重启后端服务**
```bash
docker-compose restart backend
docker-compose logs -f backend
```

---

### 4. 🌐 CORS 跨域错误

**错误信息：**
```
Access to fetch at 'http://localhost:5000/api/...' has been blocked by CORS policy
```

**原因：**
后端CORS配置不允许前端域名访问。

**解决方案：**
✅ 已配置！通过nginx代理统一在同一域名下，避免跨域问题。

**配置检查：**
`backend/server.js` 中：
```javascript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

**Docker环境下：**
前端和后端都在 `http://localhost:3000` 下访问，nginx负责转发 `/api` 请求到后端，无跨域问题。

---

### 5. 📦 Docker容器无法启动

**错误信息：**
```
Error response from daemon: Ports are not available
```

**原因：**
端口被占用。

**解决方案：**

**检查端口占用：**
```powershell
# Windows PowerShell
netstat -ano | findstr :3000
netstat -ano | findstr :5000
```

**停止占用端口的进程：**
```powershell
# 查看进程ID (PID)
Get-Process -Id <PID>

# 停止进程
Stop-Process -Id <PID> -Force
```

**修改端口映射：**
编辑 `docker-compose.yml`：
```yaml
frontend:
  ports:
    - "8080:80"  # 改为其他端口
```

---

### 6. 📂 前端构建失败

**错误信息：**
```
npm ERR! Cannot find module 'react-router-dom'
```

**原因：**
依赖未正确安装。

**解决方案：**

**清除缓存重新构建：**
```bash
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

**检查 package.json：**
确保所有依赖都在 `dependencies` 而不是 `devDependencies` 中。

---

### 7. 🔍 调试技巧

**查看容器日志：**
```bash
# 所有服务
docker-compose logs -f

# 特定服务
docker-compose logs -f backend
docker-compose logs -f frontend

# 最近100行
docker-compose logs --tail=100 backend
```

**进入容器内部：**
```bash
# 后端容器
docker exec -it csit314-backend sh

# 前端容器
docker exec -it csit314-frontend sh
```

**检查网络连接：**
```bash
# 在后端容器内测试MongoDB连接
docker exec -it csit314-backend node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('✅ Connected')).catch(e => console.log('❌ Error:', e.message))"
```

**重启服务：**
```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart backend

# 完全重建
docker-compose down -v
docker-compose up -d --build
```

---

## 🎯 当前配置总结

### 架构图
```
浏览器 (http://localhost:3000)
    ↓
前端容器 (nginx:80) → 静态文件
    ↓ /api/*
后端容器 (node:5000) → API服务
    ↓
MongoDB Atlas (云端数据库)
```

### 访问地址
- **前端:** http://localhost:3000
- **API:** http://localhost:3000/api (通过nginx代理)
- **数据库:** MongoDB Atlas云端

### 关键配置文件
1. `.env` - 环境变量（数据库连接、密钥）
2. `docker-compose.yml` - Docker编排配置
3. `nginx.conf` - 前端代理配置
4. `backend/server.js` - 后端服务器配置

---

## ✅ 完整重启流程

如果遇到问题，按以下步骤完全重启：

```bash
# 1. 停止并删除所有容器、网络、卷
docker-compose down -v

# 2. 清除Docker构建缓存（可选）
docker builder prune -f

# 3. 重新构建（不使用缓存）
docker-compose build --no-cache

# 4. 启动服务
docker-compose up -d

# 5. 查看日志
docker-compose logs -f

# 6. 检查服务状态
docker-compose ps
```

---

## 🚀 快速测试

**测试后端健康检查：**
```bash
curl http://localhost:5000/api/health
```

**测试前端访问：**
打开浏览器访问 http://localhost:3000

**测试API通过nginx代理：**
```bash
curl http://localhost:3000/api/health
```

---

## 📞 需要帮助？

如果以上方法都无法解决问题，请提供：

1. **完整错误日志：**
   ```bash
   docker-compose logs --tail=200 > logs.txt
   ```

2. **服务状态：**
   ```bash
   docker-compose ps
   ```

3. **环境变量（敏感信息打码）：**
   ```bash
   cat .env
   ```

4. **网络诊断：**
   ```bash
   docker network inspect csit314-gp_csit314-network
   ```
