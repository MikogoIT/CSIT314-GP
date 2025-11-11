const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // 基本信息
  name: {
    type: String,
    required: [true, '姓名是必填项'],
    trim: true,
    maxlength: [100, '姓名不能超过100个字符']
  },
  email: {
    type: String,
    required: [true, '邮箱是必填项'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请输入有效的邮箱地址']
  },
  password: {
    type: String,
    required: [true, '密码是必填项'],
    minlength: [6, '密码至少需要6个字符'],
    select: false // 默认查询时不返回密码
  },
  
  // 用户类型
  userType: {
    type: String,
    required: [true, '用户类型是必填项'],
    enum: {
      values: ['pin', 'csr', 'admin'],
      message: '用户类型必须是 pin, csr 或 admin'
    }
  },
  
  // 联系信息
  phone: {
    type: String,
    trim: true,
    match: [/^[\d\s\-\+\(\)]+$/, '请输入有效的电话号码']
  },
  address: {
    type: String,
    trim: true,
    maxlength: [500, '地址不能超过500个字符']
  },
  
  // PIN用户特有字段
  emergencyContact: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, '紧急联系人姓名不能超过100个字符']
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[\d\s\-\+\(\)]+$/, '请输入有效的紧急联系人电话']
    },
    relationship: {
      type: String,
      trim: true,
      maxlength: [50, '关系不能超过50个字符']
    }
  },
  
  // CSR用户特有字段
  organization: {
    type: String,
    trim: true,
    maxlength: [200, '组织名称不能超过200个字符']
  },
  skills: [{
    type: String,
    trim: true,
    maxlength: [100, '技能描述不能超过100个字符']
  }],
  availability: {
    weekdays: {
      type: Boolean,
      default: true
    },
    weekends: {
      type: Boolean,
      default: true
    },
    timeSlots: [{
      start: String,
      end: String
    }]
  },
  
  // 账户状态
  status: {
    type: String,
    enum: ['active', 'suspended', 'deleted'],
    default: 'active'
  },
  
  // 验证状态
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  // 密码重置
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // 统计信息
  stats: {
    // PIN用户统计
    totalRequests: {
      type: Number,
      default: 0
    },
    completedRequests: {
      type: Number,
      default: 0
    },
    
    // CSR用户统计
    totalVolunteered: {
      type: Number,
      default: 0
    },
    completedServices: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0
    }
  },
  
  // 管理员字段
  isSuper: {
    type: Boolean,
    default: false
  },
  permissions: [{
    type: String,
    enum: [
      'user_management',
      'request_management', 
      'category_management',
      'system_settings',
      'reports_view',
      'data_export',
      'admin_management'
    ]
  }],
  
  // 时间戳
  lastLogin: {
    type: Date
  },
  loginCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引
userSchema.index({ email: 1 });
userSchema.index({ userType: 1 });
userSchema.index({ status: 1 });
userSchema.index({ 'skills': 1 });

// 虚拟字段
userSchema.virtual('isAdmin').get(function() {
  return this.userType === 'admin';
});

userSchema.virtual('isPIN').get(function() {
  return this.userType === 'pin';
});

userSchema.virtual('isCSR').get(function() {
  return this.userType === 'csr';
});

userSchema.virtual('isSuperAdmin').get(function() {
  return this.userType === 'admin' && this.isSuper === true;
});

// 检查权限的方法
userSchema.methods.hasPermission = function(permission) {
  if (this.isSuper) return true; // 超级管理员拥有所有权限
  return this.permissions && this.permissions.includes(permission);
};

// 密码加密中间件
userSchema.pre('save', async function(next) {
  // 只有在密码被修改时才加密
  if (!this.isModified('password')) return next();
  
  try {
    // 生成盐值并加密密码
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 密码验证方法
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// 更新登录信息
userSchema.methods.updateLoginInfo = function() {
  this.lastLogin = new Date();
  this.loginCount += 1;
  return this.save();
};

// 生成邮箱验证token
userSchema.methods.generateEmailVerificationToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
    
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24小时
  
  return token;
};

// 生成密码重置token
userSchema.methods.generatePasswordResetToken = function() {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10分钟
  
  return resetToken;
};

// 静态方法：根据邮箱域名检查是否为管理员
userSchema.statics.isAdminEmail = function(email) {
  const adminDomain = process.env.ADMIN_EMAIL_DOMAIN || '@admin.com';
  return email.endsWith(adminDomain);
};

module.exports = mongoose.model('User', userSchema);