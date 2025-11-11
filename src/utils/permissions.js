/**
 * 权限管理工具
 * 根据用户类型检查权限
 */

// System Admin 权限
export const SYSTEM_ADMIN_PERMISSIONS = {
  // 用户管理
  VIEW_ALL_USERS: 'view_all_users', // #50
  CREATE_USER: 'create_user', // #70, #55
  UPDATE_USER: 'update_user', // #70
  SUSPEND_USER: 'suspend_user', // #52
  DELETE_USER: 'delete_user',
  
  // 系统监控
  VIEW_SYSTEM_LOGS: 'view_system_logs', // #51
  VIEW_LOGIN_ACTIVITY: 'view_login_activity', // #51
  CONFIGURE_ALERTS: 'configure_alerts',
  
  // 系统设置
  SET_FILE_LIMITS: 'set_file_limits', // #56
  CONFIGURE_SYSTEM: 'configure_system',
};

// Platform Manager 权限
export const PLATFORM_MANAGER_PERMISSIONS = {
  // 类别管理
  MANAGE_CATEGORIES: 'manage_categories', // #57
  CREATE_CATEGORY: 'create_category', // #57
  EDIT_CATEGORY: 'edit_category', // #57
  DELETE_CATEGORY: 'delete_category', // #57
  
  // 报告和分析
  GENERATE_REPORTS: 'generate_reports', // #58
  VIEW_PARTICIPATION_METRICS: 'view_participation_metrics', // #59
  VIEW_EFFICIENCY_METRICS: 'view_efficiency_metrics', // #60
  VIEW_CSR_PERFORMANCE: 'view_csr_performance', // #62
  
  // 统计数据
  VIEW_SYSTEM_STATS: 'view_system_stats', // #60
};

// 共享权限（两种管理员都有）
export const SHARED_ADMIN_PERMISSIONS = {
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_BASIC_STATS: 'view_basic_stats',
};

/**
 * 检查用户是否有特定权限
 * @param {Object} user - 用户对象
 * @param {string} permission - 权限名称
 * @returns {boolean}
 */
export const hasPermission = (user, permission) => {
  if (!user || !user.userType) return false;
  
  const userType = user.userType;
  
  // 检查共享权限
  if (Object.values(SHARED_ADMIN_PERMISSIONS).includes(permission)) {
    return userType === 'system_admin' || userType === 'platform_manager';
  }
  
  // 检查 System Admin 权限
  if (Object.values(SYSTEM_ADMIN_PERMISSIONS).includes(permission)) {
    return userType === 'system_admin';
  }
  
  // 检查 Platform Manager 权限
  if (Object.values(PLATFORM_MANAGER_PERMISSIONS).includes(permission)) {
    return userType === 'platform_manager';
  }
  
  return false;
};

/**
 * 检查用户是否是系统管理员
 */
export const isSystemAdmin = (user) => {
  return user?.userType === 'system_admin';
};

/**
 * 检查用户是否是平台管理者
 */
export const isPlatformManager = (user) => {
  return user?.userType === 'platform_manager';
};

/**
 * 检查用户是否是任意类型的管理员
 */
export const isAnyAdmin = (user) => {
  return isSystemAdmin(user) || isPlatformManager(user);
};

/**
 * 获取用户的所有权限列表
 */
export const getUserPermissions = (user) => {
  if (!user) return [];
  
  const permissions = [...Object.values(SHARED_ADMIN_PERMISSIONS)];
  
  if (isSystemAdmin(user)) {
    permissions.push(...Object.values(SYSTEM_ADMIN_PERMISSIONS));
  }
  
  if (isPlatformManager(user)) {
    permissions.push(...Object.values(PLATFORM_MANAGER_PERMISSIONS));
  }
  
  return permissions;
};

/**
 * 获取用户角色的显示名称
 */
export const getRoleDisplayName = (userType, t) => {
  const roleNames = {
    system_admin: t ? t('roles.systemAdmin') : 'System Admin',
    platform_manager: t ? t('roles.platformManager') : 'Platform Manager',
    pin: t ? t('roles.pin.name') : 'PIN',
    csr: t ? t('roles.csr.name') : 'CSR'
  };
  
  return roleNames[userType] || userType;
};
