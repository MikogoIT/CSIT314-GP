# Docker 部署指南 🐳

## 📋 快速开始

### 1. 环境准备

确保已安装：
- Docker Desktop (Windows)
- Docker Compose

```powershell
# 检查版本
docker --version
docker-compose --version
```

### 2. 配置环境变量

复制并编辑环境变量文件：

```powershell
Copy-Item .env.example .env
```

编辑 `.env` 文件：

```bash
# MongoDB 配置
MONGO_ROOT_USER=mikogo
MONGO_ROOT_PASSWORD=msl201215

# JWT 密钥（生产环境必须更改）
JWT_SECRET=CSIT314GROUP-CODESTORM

# 应用环境
NODE_ENV=production

# 端口配置
API_PORT=5000
FRONTEND_PORT=80
```

### 3. 启动服务

```powershell
# 构建并启动所有服务
docker-compose up -d --build

# 或者分步执行
docker-compose build --no-cache  # 清除缓存重新构建
docker-compose up -d              # 后台启动服务
```

### 4. 访问应用

部署成功后：

- 🌐 **前端应用**: http://localhost
- 🔧 **后端API**: http://localhost:5000
- 🗄️ **MongoDB**: localhost:27017

## 🏗️ 服务架构

项目包含三个Docker服务：

```
┌─────────────────────────────────────────────┐
│                  Nginx                      │
│          (前端 - 端口 80)                    │
│         React App + 静态文件                 │
└──────────────┬──────────────────────────────┘
               │ API请求代理
               ↓
┌─────────────────────────────────────────────┐
│              Node.js                        │
│          (后端 - 端口 5000)                  │
│         Express API Server                  │
└──────────────┬──────────────────────────────┘
               │ 数据存取
               ↓
┌─────────────────────────────────────────────┐
│              MongoDB                        │
│          (数据库 - 端口 27017)               │
│         Document Database                   │
└─────────────────────────────────────────────┘
```

### 服务详情

| 服务 | 镜像 | 端口 | 说明 |
|------|------|------|------|
| **frontend** | Node 18 + Nginx Alpine | 80 | React应用 + Nginx反向代理 |
| **backend** | Node 18 Alpine | 5000 | Express API服务器 |
| **mongodb** | MongoDB 6.0 | 27017 | NoSQL数据库 |

## 📝 常用命令

### 查看服务状态
```powershell
docker-compose ps
```

### 查看日志
```powershell
# 所有服务日志
docker-compose logs -f

# 特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### 重启服务
```powershell
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart backend
```

### 停止服务
```powershell
# 停止服务（保留数据）
docker-compose down

# 停止服务并删除数据卷
docker-compose down -v
```

### 重新构建
```powershell
# 重新构建并启动
docker-compose up -d --build

# 清除缓存重新构建
docker-compose build --no-cache
```

### 进入容器
```powershell
# 进入后端容器
docker exec -it csit314-backend sh

# 进入前端容器
docker exec -it csit314-frontend sh

# 进入MongoDB容器
docker exec -it csit314-mongodb mongosh
```

### 清理资源
```powershell
# 删除所有停止的容器
docker container prune

# 删除未使用的镜像
docker image prune -a

# 删除未使用的卷
docker volume prune
```

## 🔧 故障排除

### 1. 端口被占用

**问题**: 80或5000端口已被占用

**解决方案**: 修改 `docker-compose.yml` 中的端口映射

```yaml
services:
  frontend:
    ports:
      - "8080:80"  # 使用8080代替80
  backend:
    ports:
      - "5001:5000"  # 使用5001代替5000
```

### 2. 网络连接问题

**问题**: 无法拉取Docker镜像

**解决方案**: 已配置国内镜像源

- MongoDB使用阿里云镜像：`registry.cn-hangzhou.aliyuncs.com/library/mongo:6.0`
- 如仍有问题，可配置Docker镜像加速器

### 3. 构建失败

**问题**: `npm install` 依赖安装失败

**解决方案**:

```powershell
# 先在本地更新依赖
npm install
cd backend
npm install
cd ..

# 然后重新构建
docker-compose build --no-cache
```

### 4. 容器启动失败

**问题**: 容器无法启动或反复重启

**解决方案**:

```powershell
# 查看详细日志
docker-compose logs -f [service-name]

# 检查容器状态
docker-compose ps

# 检查健康状态
docker inspect csit314-mongodb | findstr "Health"
```

### 5. MongoDB连接失败

**问题**: 后端无法连接MongoDB

**解决方案**:

1. 确保MongoDB容器已启动并健康
```powershell
docker-compose ps mongodb
```

2. 检查MongoDB日志
```powershell
docker-compose logs mongodb
```

3. 验证连接字符串（在 `.env` 中）
```bash
MONGODB_URI=mongodb://mikogo:msl201215@mongodb:27017/csit314?authSource=admin
```

## 🔒 安全建议

### 生产环境配置

1. **更改默认密码**
```bash
MONGO_ROOT_PASSWORD=your-very-secure-password-here
JWT_SECRET=your-super-long-random-secret-key-here
```

2. **使用强JWT密钥**
```powershell
# 生成随机密钥（PowerShell）
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

3. **配置HTTPS**
   - 使用Nginx SSL配置
   - 配置Let's Encrypt证书
   - 或使用反向代理（如Caddy、Traefik）

4. **限制端口暴露**
```yaml
# 不暴露MongoDB端口到外网
mongodb:
  # ports:
  #   - "27017:27017"  # 注释掉此行
```

5. **配置防火墙规则**
   - 只允许必要的端口访问
   - 使用Docker网络隔离

## 📊 性能优化

### 1. 资源限制

编辑 `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          memory: 256M
```

### 2. 启用日志轮转

```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 3. 使用生产构建

确保环境变量正确：
```bash
NODE_ENV=production
```

## 🔄 数据备份

### 备份MongoDB数据

```powershell
# 导出数据
docker exec csit314-mongodb mongodump --uri="mongodb://mikogo:msl201215@localhost:27017/csit314?authSource=admin" --out=/tmp/backup

# 复制备份文件到主机
docker cp csit314-mongodb:/tmp/backup ./mongodb-backup
```

### 恢复MongoDB数据

```powershell
# 复制备份文件到容器
docker cp ./mongodb-backup csit314-mongodb:/tmp/backup

# 恢复数据
docker exec csit314-mongodb mongorestore --uri="mongodb://mikogo:msl201215@localhost:27017/?authSource=admin" /tmp/backup
```

## 🚀 CI/CD 兼容性

本Docker配置与GitHub Actions CI/CD完全兼容：

- ✅ CI流程使用 `npm install`（不依赖Docker）
- ✅ 本地Docker修改不影响GitHub Actions
- ✅ 镜像源配置仅用于本地开发
- ✅ 所有自动化测试正常运行

## 📚 更多资源

- [Docker官方文档](https://docs.docker.com/)
- [Docker Compose文档](https://docs.docker.com/compose/)
- [MongoDB Docker Hub](https://hub.docker.com/_/mongo)
- [Nginx Docker Hub](https://hub.docker.com/_/nginx)

## 🆘 获取帮助

如遇到问题：

1. 查看日志: `docker-compose logs -f`
2. 检查服务状态: `docker-compose ps`
3. 查看本文档的故障排除部分
4. 联系团队成员获取支持

---

**最后更新**: 2025-11-12
**维护者**: CSIT314 Team
