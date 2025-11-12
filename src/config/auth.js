export const AUTH_CONFIG = {
  DEFAULT_ADMIN_PASSWORD: 'admin123',
 
  ADMIN_EMAIL_DOMAIN: '@admin.com',

  MIN_PASSWORD_LENGTH: 6,

  TOKEN_EXPIRY: '24h',

  PASSWORD_RULES: {
    minLength: 6,
    requireUppercase: false,
    requireLowercase: false,
    requireNumbers: false,
    requireSpecialChars: false
  }
};


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
  return email === 'mikogo@systemadmin.com' || email === 'mikogo@pmanager.com';
};