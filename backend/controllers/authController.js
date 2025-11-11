const User = require('../models/User');
const { generateToken, isAdminEmail } = require('../middleware/auth');
const { asyncHandler, createError } = require('../middleware/errorHandler');

/**
 * Control Layer - 认证控制器
 * 处理用户认证相关的业务逻辑
 */

// @desc    用户注册
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, userType, phone, address, emergencyContact, organization, skills } = req.body;

  // 检查邮箱是否已存在
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw createError.conflict('该邮箱已被注册', 'EMAIL_ALREADY_EXISTS');
  }

  // 检查是否为管理员邮箱
  if (isAdminEmail(email) && userType !== 'admin') {
    throw createError.badRequest('管理员邮箱只能注册管理员账户', 'ADMIN_EMAIL_INVALID_TYPE');
  }

  // 创建用户数据
  const userData = {
    name,
    email,
    password,
    userType: isAdminEmail(email) ? 'admin' : userType,
    phone,
    address
  };

  // 根据用户类型添加特定字段
  if (userType === 'pin' && emergencyContact) {
    userData.emergencyContact = emergencyContact;
  }

  if (userType === 'csr') {
    if (organization) userData.organization = organization;
    if (skills && Array.isArray(skills)) userData.skills = skills;
  }

  // 创建用户
  const user = await User.create(userData);

  // 生成JWT token
  const token = generateToken(user._id);

  // 移除密码字段
  user.password = undefined;

  res.status(201).json({
    success: true,
    message: '注册成功',
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        phone: user.phone,
        address: user.address,
        status: user.status,
        createdAt: user.createdAt
      }
    }
  });
});

// @desc    用户登录
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  const { email, password, userType } = req.body;

  // 查找用户（包含密码字段）
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw createError.unauthorized('用户不存在，请先注册', 'USER_NOT_EXISTS');
  }

  // 检查用户状态
  if (user.status !== 'active') {
    throw createError.unauthorized('您的账户已被暂停，请联系管理员', 'USER_SUSPENDED');
  }

  // 验证密码
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw createError.unauthorized('邮箱或密码错误', 'INVALID_CREDENTIALS');
  }

  // 对于非管理员用户，验证用户类型
  if (user.userType !== 'admin' && userType && user.userType !== userType) {
    throw createError.unauthorized('用户类型不匹配', 'USER_TYPE_MISMATCH');
  }

  // 更新登录信息
  await user.updateLoginInfo();

  // 生成JWT token
  const token = generateToken(user._id);

  // 移除密码字段
  user.password = undefined;

  res.json({
    success: true,
    message: '登录成功',
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        phone: user.phone,
        address: user.address,
        organization: user.organization,
        skills: user.skills,
        stats: user.stats,
        lastLogin: user.lastLogin,
        loginCount: user.loginCount,
        createdAt: user.createdAt
      }
    }
  });
});

// @desc    获取当前用户信息
// @route   GET /api/auth/me
// @access  Private
exports.getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        phone: user.phone,
        address: user.address,
        emergencyContact: user.emergencyContact,
        organization: user.organization,
        skills: user.skills,
        availability: user.availability,
        stats: user.stats,
        status: user.status,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin,
        loginCount: user.loginCount,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        // 管理员权限信息
        isSuper: user.isSuper || false,
        permissions: user.permissions || [],
        isAdmin: user.isAdmin,
        isSuperAdmin: user.isSuperAdmin
      }
    }
  });
});

// @desc    更新用户资料
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address, emergencyContact, organization, skills, availability } = req.body;

  const updateData = {};
  
  // 基本信息
  if (name) updateData.name = name;
  if (phone) updateData.phone = phone;
  if (address) updateData.address = address;

  // PIN用户特有字段
  if (req.user.userType === 'pin' && emergencyContact) {
    updateData.emergencyContact = emergencyContact;
  }

  // CSR用户特有字段
  if (req.user.userType === 'csr') {
    if (organization) updateData.organization = organization;
    if (skills && Array.isArray(skills)) updateData.skills = skills;
    if (availability) updateData.availability = availability;
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: '个人资料更新成功',
    data: { user }
  });
});

// @desc    修改密码
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // 获取用户（包含密码）
  const user = await User.findById(req.user._id).select('+password');

  // 验证当前密码
  const isCurrentPasswordCorrect = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordCorrect) {
    throw createError.badRequest('当前密码错误', 'INVALID_CURRENT_PASSWORD');
  }

  // 更新密码
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: '密码修改成功'
  });
});

// @desc    登出（客户端处理，服务端记录）
// @route   POST /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res) => {
  // 这里可以添加登出日志记录
  // 实际的token失效由客户端处理（删除本地存储的token）
  
  res.json({
    success: true,
    message: '登出成功'
  });
});
