# 管理员权限控制实现总结

## 权限分配

### System Admin (系统管理员) - 技术保障与系统维护

**权限功能：**
1. ✅ **查看所有用户列表** (#50)
   - 路由: `/admin/users`
   - API: `GET /api/admin/users`
   - 中间件: `systemAdminOnly`

2. ✅ **监控登录活动和失败尝试** (#51)
   - 路由: `/admin/system-logs`
   - API: `GET /api/admin/system/logs`
   - 中间件: `systemAdminOnly`

3. ✅ **停用账户** (#52)
   - API: `PATCH /api/admin/users/:userId/status`
   - 中间件: `systemAdminOnly`
   - 功能: 激活/停用/删除用户

4. ✅ **创建用户资料** (#55)
   - API: `POST /api/admin/users`
   - 中间件: `systemAdminOnly`

5. ✅ **设置文件上传限制** (#56)
   - API: `POST /api/admin/system/file-limits`
   - 中间件: `systemAdminOnly`

6. ✅ **更新用户资料** (#70)
   - API: `PUT /api/admin/users/:userId`
   - 中间件: `systemAdminOnly`

**前端菜单：**
- 📊 Dashboard (共享)
- 👥 User Management
- 📋 System Logs
- ⚙️ System Settings

---

### Platform Manager (平台管理者) - 业务运营与战略分析

**权限功能：**
1. ✅ **创建、编辑、删除服务类别** (#57)
   - 路由: `/admin/categories`
   - API: `POST /api/admin/categories/:action`
   - 中间件: `platformManagerOnly`
   - 操作: create, update, delete

2. ✅ **生成服务请求和匹配的报告** (#58)
   - 路由: `/admin/reports`
   - API: `GET /api/admin/reports`
   - 中间件: `platformManagerOnly`
   - 报告类型: requests, matching, participation

3. ✅ **监控用户参与度和增长机会** (#59)
   - 路由: `/admin/participation`
   - API: `GET /api/admin/metrics/participation`
   - 中间件: `platformManagerOnly`

4. ✅ **查看系统级统计数据以改进效率** (#60)
   - API: `GET /api/admin/metrics/efficiency`
   - 中间件: `platformManagerOnly`

5. ✅ **跟踪CSR代表绩效** (#62)
   - 路由: `/admin/performance`
   - API: `GET /api/admin/csr/performance`
   - 中间件: `platformManagerOnly`

**前端菜单：**
- 📊 Dashboard (共享)
- 📁 Service Categories
- 📊 Reports
- 📈 Participation Metrics
- ⭐ CSR Performance

---

## 实现细节

### 后端实现

#### 1. 中间件 (`backend/middleware/auth.js`)
```javascript
// System Admin 专属
const systemAdminOnly = (req, res, next) => {
  if (req.user.userType !== 'system_admin') {
    return res.status(403).json({ error: 'System Admin access required' });
  }
  next();
};

// Platform Manager 专属
const platformManagerOnly = (req, res, next) => {
  if (req.user.userType !== 'platform_manager') {
    return res.status(403).json({ error: 'Platform Manager access required' });
  }
  next();
};

// 任意管理员
const adminOnly = (req, res, next) => {
  if (!['system_admin', 'platform_manager'].includes(req.user.userType)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
```

#### 2. 路由保护 (`backend/routes/admin.js`)
- ✅ 所有路由都使用 `authenticate` 中间件
- ✅ System Admin 路由使用 `systemAdminOnly`
- ✅ Platform Manager 路由使用 `platformManagerOnly`
- ✅ 共享路由使用 `adminOnly`

### 前端实现

#### 1. 权限工具 (`src/utils/permissions.js`)
```javascript
// 权限常量
SYSTEM_ADMIN_PERMISSIONS = {
  VIEW_ALL_USERS, CREATE_USER, UPDATE_USER, SUSPEND_USER,
  VIEW_SYSTEM_LOGS, VIEW_LOGIN_ACTIVITY, SET_FILE_LIMITS, ...
}

PLATFORM_MANAGER_PERMISSIONS = {
  MANAGE_CATEGORIES, GENERATE_REPORTS, 
  VIEW_PARTICIPATION_METRICS, VIEW_EFFICIENCY_METRICS,
  VIEW_CSR_PERFORMANCE, ...
}

// 辅助函数
hasPermission(user, permission)
isSystemAdmin(user)
isPlatformManager(user)
```

#### 2. 权限守卫组件 (`src/components/PermissionGuard.jsx`)
```jsx
<SystemAdminOnly>
  {/* System Admin 专属内容 */}
</SystemAdminOnly>

<PlatformManagerOnly>
  {/* Platform Manager 专属内容 */}
</PlatformManagerOnly>
```

#### 3. 页面级权限检查
每个管理员页面都包含权限检查：
```javascript
useEffect(() => {
  if (!isSystemAdmin(user)) {
    alert('Access Denied: System Admin only');
    navigate('/admin/dashboard');
  }
}, [user, navigate]);
```

#### 4. 导航菜单 (`src/components/Layout/Navbar.jsx`)
根据用户类型动态显示菜单项：
- System Admin 看到: User Management, System Logs
- Platform Manager 看到: Categories, Reports, CSR Performance

#### 5. Dashboard (`src/pages/Admin/Dashboard_new.jsx`)
快捷功能卡片根据管理员类型动态生成

---

## 测试账户

### System Admin
- 邮箱: `mikogo@systemadmin.com`
- 密码: `msl201215`
- 权限: 用户管理、系统监控、系统设置

### Platform Manager
- 邮箱: `mikogo@pmanager.com`
- 密码: `msl201215`
- 权限: 类别管理、报告生成、绩效分析

---

## 安全特性

1. ✅ **后端验证**: 所有API路由都有中间件保护
2. ✅ **前端验证**: 页面级权限检查，防止误操作
3. ✅ **导航限制**: 菜单只显示有权限的功能
4. ✅ **自动重定向**: 无权限访问时重定向到 Dashboard
5. ✅ **JWT认证**: 所有请求都需要有效的 JWT token
6. ✅ **用户类型验证**: 后端严格验证 userType

---

## 文件清单

### 新增文件
- `src/utils/permissions.js` - 权限管理工具
- `src/components/PermissionGuard.jsx` - 权限守卫组件

### 修改文件
- `backend/routes/admin.js` - 添加权限中间件
- `backend/middleware/auth.js` - 新增权限检查函数
- `src/components/Layout/Navbar.jsx` - 动态菜单
- `src/pages/Admin/Dashboard_new.jsx` - 动态快捷功能
- `src/pages/Admin/UserManagement.jsx` - System Admin only
- `src/pages/Admin/CategoryManagement.jsx` - Platform Manager only
- `src/pages/Admin/Reports_new.jsx` - Platform Manager only

---

## 使用示例

### 在组件中检查权限
```jsx
import { hasPermission, SYSTEM_ADMIN_PERMISSIONS } from '../utils/permissions';
import { useAuth } from '../context/AuthContext';

const MyComponent = () => {
  const { user } = useAuth();
  
  if (hasPermission(user, SYSTEM_ADMIN_PERMISSIONS.VIEW_ALL_USERS)) {
    // 显示用户管理功能
  }
};
```

### 使用权限守卫
```jsx
import { SystemAdminOnly } from '../components/PermissionGuard';

<SystemAdminOnly fallback={<p>Access Denied</p>}>
  <UserManagementPanel />
</SystemAdminOnly>
```
