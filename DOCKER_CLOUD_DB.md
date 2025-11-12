# Docker 连接云端数据库配置指南

## 🌐 使用云端MongoDB数据库

Docker完全支持连接云端数据库（如MongoDB Atlas）。以下是配置步骤：

### 📝 步骤1：获取MongoDB连接字符串

从你的MongoDB Atlas（或其他云端MongoDB服务）获取连接字符串，格式如下：

```
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

### 🔧 步骤2：配置环境变量

编辑项目根目录的 `.env` 文件：

```bash
# MongoDB Configuration (使用云端数据库)
MONGODB_URI=mongodb+srv://你的用户名:你的密码@你的集群.mongodb.net/csit314?retryWrites=true&w=majority

# JWT密钥
JWT_SECRET=CSIT314GROUP-CODESTORM

# 应用环境
NODE_ENV=production

# 端口配置
API_PORT=5000
FRONTEND_PORT=3000
```

**重要提示**：
- 替换 `你的用户名`、`你的密码` 和 `你的集群` 为实际值
- 确保密码中的特殊字符已经URL编码
- 数据库名称建议使用 `csit314` 或你现有的数据库名

### 🚀 步骤3：重启Docker服务

```powershell
# 停止所有服务
docker-compose down

# 重新启动（使用云端数据库）
docker-compose up -d
```

### ✅ 步骤4：验证连接

查看后端日志确认连接成功：

```powershell
docker logs csit314-backend
```

你应该看到类似这样的输出：
```
MongoDB Connected: cluster0-shard-00-00.xxxxx.mongodb.net
🚀 CSR Volunteer Matching System Backend Started
```

### 📊 当前架构

使用云端数据库后的架构：

```
┌─────────────────────────────────────────────┐
│          Docker Containers                  │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌─────────────┐     │
│  │   Frontend   │─────▶│   Backend   │     │
│  │  (Port 3000) │      │ (Port 5000) │     │
│  └──────────────┘      └──────┬──────┘     │
│                               │             │
└───────────────────────────────┼─────────────┘
                                │
                                ↓
                    ┌───────────────────────┐
                    │   Cloud MongoDB       │
                    │   (MongoDB Atlas)     │
                    └───────────────────────┘
```

### 🔍 故障排除

#### 1. 连接超时

**问题**：无法连接到MongoDB Atlas

**解决方案**：
- 检查MongoDB Atlas的网络访问设置
- 添加 `0.0.0.0/0` 到IP白名单（允许所有IP访问）
- 或者添加你的公网IP地址

#### 2. 认证失败

**问题**：`Authentication failed`

**解决方案**：
- 确认用户名和密码正确
- 确认数据库用户有适当的权限
- 检查密码中的特殊字符是否需要URL编码

**常见特殊字符编码**：
- `@` → `%40`
- `:` → `%3A`
- `/` → `%2F`
- `?` → `%3F`
- `#` → `%23`

#### 3. 连接字符串格式错误

**错误示例**：
```bash
# ❌ 错误 - 使用了本地连接格式
MONGODB_URI=mongodb://localhost:27017/csit314

# ✅ 正确 - 使用MongoDB Atlas格式
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/csit314
```

### 📋 完整示例

假设你的MongoDB Atlas信息如下：
- **用户名**: `mikogo`
- **密码**: `MyPassword123!`
- **集群**: `cluster0.abc12.mongodb.net`
- **数据库**: `csit314`

则 `.env` 配置为：

```bash
MONGODB_URI=mongodb+srv://mikogo:MyPassword123!@cluster0.abc12.mongodb.net/csit314?retryWrites=true&w=majority
JWT_SECRET=CSIT314GROUP-CODESTORM
NODE_ENV=production
API_PORT=5000
FRONTEND_PORT=3000
```

如果密码包含特殊字符，需要编码：

```bash
# 原密码: MyPass@123!
# 编码后: MyPass%40123!
MONGODB_URI=mongodb+srv://mikogo:MyPass%40123!@cluster0.abc12.mongodb.net/csit314?retryWrites=true&w=majority
```

### 🎯 优势

使用云端数据库的优势：

1. ✅ **数据持久化**: 数据不会因Docker容器重启而丢失
2. ✅ **远程访问**: 可以从任何地方访问数据
3. ✅ **自动备份**: MongoDB Atlas提供自动备份
4. ✅ **高可用性**: 云端数据库通常有更好的可用性
5. ✅ **性能监控**: Atlas提供详细的性能监控
6. ✅ **节省资源**: 不需要在本地运行MongoDB容器

### 🔄 切换回本地数据库

如果需要切换回本地MongoDB：

1. 取消注释 `docker-compose.yml` 中的 mongodb 服务
2. 修改 `.env` 中的连接字符串：
   ```bash
   MONGO_ROOT_USER=mikogo
   MONGO_ROOT_PASSWORD=msl201215
   ```
3. 修改 `docker-compose.yml` 中backend的环境变量：
   ```yaml
   MONGODB_URI: mongodb://${MONGO_ROOT_USER}:${MONGO_ROOT_PASSWORD}@mongodb:27017/csit314?authSource=admin
   ```
4. 重启服务：
   ```powershell
   docker-compose down
   docker-compose up -d
   ```

---

**最后更新**: 2025-11-12
**维护者**: CSIT314 Team
