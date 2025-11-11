/**
 * 权限包装组件
 * 根据用户权限控制子组件的显示
 */
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';

/**
 * 权限守卫组件 - 有权限才显示子组件
 */
export const PermissionGuard = ({ permission, fallback = null, children }) => {
  const { user } = useAuth();
  
  if (!hasPermission(user, permission)) {
    return fallback;
  }
  
  return <>{children}</>;
};

/**
 * 角色守卫组件 - 指定角色才显示
 */
export const RoleGuard = ({ roles, fallback = null, children }) => {
  const { user } = useAuth();
  
  if (!user || !roles.includes(user.userType)) {
    return fallback;
  }
  
  return <>{children}</>;
};

/**
 * System Admin 专属组件
 */
export const SystemAdminOnly = ({ fallback = null, children }) => {
  return <RoleGuard roles={['system_admin']} fallback={fallback}>{children}</RoleGuard>;
};

/**
 * Platform Manager 专属组件
 */
export const PlatformManagerOnly = ({ fallback = null, children }) => {
  return <RoleGuard roles={['platform_manager']} fallback={fallback}>{children}</RoleGuard>;
};

/**
 * 任意管理员可见组件
 */
export const AdminOnly = ({ fallback = null, children }) => {
  return <RoleGuard roles={['system_admin', 'platform_manager']} fallback={fallback}>{children}</RoleGuard>;
};

export default PermissionGuard;
