// 认证配置文件
export const AUTH_CONFIG = {
  // 默认管理员密码（生产环境应该从环境变量读取）
  DEFAULT_ADMIN_PASSWORD: 'admin123',
  
  // 管理员邮箱域名
  ADMIN_EMAIL_DOMAIN: '@admin.com',
  
  // 密码最小长度
  MIN_PASSWORD_LENGTH: 6,
  
  // JWT过期时间（前端模拟用）
  TOKEN_EXPIRY: '24h',
  
  // 密码验证规则
  PASSWORD_RULES: {
    minLength: 6,
    requireUppercase: false,
    requireLowercase: false,
    requireNumbers: false,
    requireSpecialChars: false
  }
};

// 验证密码强度
export const validatePassword = (password) => {
  const rules = AUTH_CONFIG.PASSWORD_RULES;
  const errors = [];
  
  if (password.length < rules.minLength) {
    errors.push(`密码至少需要${rules.minLength}个字符`);
  }
  
  if (rules.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('密码必须包含至少一个大写字母');
  }
  
  if (rules.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('密码必须包含至少一个小写字母');
  }
  
  if (rules.requireNumbers && !/\d/.test(password)) {
    errors.push('密码必须包含至少一个数字');
  }
  
  if (rules.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('密码必须包含至少一个特殊字符');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// 检查是否为管理员邮箱
export const isAdminEmail = (email) => {
  return email.endsWith(AUTH_CONFIG.ADMIN_EMAIL_DOMAIN);
};