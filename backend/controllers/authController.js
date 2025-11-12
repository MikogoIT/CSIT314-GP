const User = require('../models/User');
const { generateToken, isAdminEmail } = require('../middleware/auth');
const { asyncHandler, createError } = require('../middleware/errorHandler');

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, userType, phone, address, emergencyContact, organization, skills } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw createError.conflict('该邮箱已被注册', 'EMAIL_ALREADY_EXISTS');
  }

  const adminTypes = ['system_admin', 'platform_manager'];
  
  if (isAdminEmail(email) && !adminTypes.includes(userType)) {
    throw createError.badRequest('管理员邮箱只能注册管理员账户', 'ADMIN_EMAIL_INVALID_TYPE');
  }

  const userData = {
    name,
    email,
    password,
    userType: isAdminEmail(email) && adminTypes.includes(userType) ? userType : userType,
    phone,
    address
  };

  if (userType === 'pin' && emergencyContact) {
    userData.emergencyContact = emergencyContact;
  }

  if (userType === 'csr') {
    if (organization) userData.organization = organization;
    if (skills && Array.isArray(skills)) userData.skills = skills;
  }

  const user = await User.create(userData);

  const token = generateToken(user._id);
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

exports.login = asyncHandler(async (req, res) => {
  const { email, password, userType } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw createError.unauthorized('用户不存在，请先注册', 'USER_NOT_EXISTS');
  }

  if (user.status !== 'active') {
    throw createError.unauthorized('您的账户已被暂停，请联系管理员', 'USER_SUSPENDED');
  }

  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw createError.unauthorized('邮箱或密码错误', 'INVALID_CREDENTIALS');
  }

  const adminTypes = ['system_admin', 'platform_manager'];
  
  if (!adminTypes.includes(user.userType) && userType && user.userType !== userType) {
    throw createError.unauthorized('用户类型不匹配', 'USER_TYPE_MISMATCH');
  }

  await user.updateLoginInfo();
  const token = generateToken(user._id);


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
        isSuper: user.isSuper || false,
        permissions: user.permissions || [],
        isAdmin: user.isAdmin,
        isSuperAdmin: user.isSuperAdmin
      }
    }
  });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address, emergencyContact, organization, skills, availability } = req.body;

  const updateData = {};
  
  if (name) updateData.name = name;
  if (phone) updateData.phone = phone;
  if (address) updateData.address = address;
  if (req.user.userType === 'pin' && emergencyContact) {
    updateData.emergencyContact = emergencyContact;
  }

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

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  const isCurrentPasswordCorrect = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordCorrect) {
    throw createError.badRequest('当前密码错误', 'INVALID_CURRENT_PASSWORD');
  }

  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: '密码修改成功'
  });
});

exports.logout = asyncHandler(async (req, res) => {
  
  res.json({
    success: true,
    message: '登出成功'
  });
});
