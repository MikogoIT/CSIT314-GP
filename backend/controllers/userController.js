const User = require('../models/User');
const Request = require('../models/Request');
const Shortlist = require('../models/Shortlist');
const { asyncHandler, createError } = require('../middleware/errorHandler');

exports.getUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    userType,
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const query = {};
  
  if (userType) query.userType = userType;
  if (status) query.status = status;

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { organization: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit)),
    User.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    }
  });
});

exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    throw createError.notFound('用户未找到');
  }

  if (req.user.userType !== 'admin' && req.user._id.toString() !== req.params.id) {
    throw createError.forbidden('您只能查看自己的信息');
  }

  res.json({
    success: true,
    data: { user }
  });
});

exports.updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  const user = await User.findById(req.params.id);

  if (!user) {
    throw createError.notFound('用户未找到');
  }

  if (user.userType === 'admin') {
    throw createError.forbidden('不能修改管理员账户状态');
  }

  user.status = status;
  await user.save();

  res.json({
    success: true,
    message: `用户状态已更新为 ${status}`,
    data: { user }
  });
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw createError.notFound('用户未找到');
  }

  if (user.userType === 'admin') {
    throw createError.forbidden('不能删除管理员账户');
  }

  const userRequests = await Request.countDocuments({
    $or: [
      { requester: user._id },
      { 'assignedVolunteers.volunteer': user._id }
    ]
  });

  if (userRequests > 0) {
    user.status = 'deleted';
    await user.save();
    
    res.json({
      success: true,
      message: `用户已被标记为删除（该用户有 ${userRequests} 个相关请求）`
    });
  } else {
    await user.remove();
    
    res.json({
      success: true,
      message: '用户已完全删除'
    });
  }
});

exports.getUserStats = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw createError.notFound('用户未找到');
  }

  if (req.user.userType !== 'admin' && req.user._id.toString() !== req.params.id) {
    throw createError.forbidden('您只能查看自己的统计信息');
  }

  let stats = { ...user.stats.toObject() };

  if (user.userType === 'pin') {
    const requestStats = await Request.aggregate([
      { $match: { requester: user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusCounts = {};
    requestStats.forEach(stat => {
      statusCounts[stat._id] = stat.count;
    });

    stats = {
      ...stats,
      pending: statusCounts.pending || 0,
      matched: statusCounts.matched || 0,
      completed: statusCounts.completed || 0,
      cancelled: statusCounts.cancelled || 0
    };
  } else if (user.userType === 'csr') {
    const volunteerStats = await Request.aggregate([
      { $match: { 'assignedVolunteers.volunteer': user._id } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    const categoryStats = {};
    volunteerStats.forEach(stat => {
      categoryStats[stat._id] = stat.count;
    });

    stats = {
      ...stats,
      categoryBreakdown: categoryStats
    };
  }

  res.json({
    success: true,
    data: { stats }
  });
});

exports.getShortlist = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [shortlistItems, total] = await Promise.all([
    Shortlist.find({ user: req.user._id })
      .populate({
        path: 'request',
        populate: {
          path: 'requester',
          select: 'name email phone'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Shortlist.countDocuments({ user: req.user._id })
  ]);

  res.json({
    success: true,
    data: {
      shortlist: shortlistItems,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    }
  });
});

exports.addToShortlist = asyncHandler(async (req, res) => {
  const { notes, tags } = req.body;
  const requestId = req.params.requestId;

  const request = await Request.findById(requestId);
  if (!request) {
    throw createError.notFound('请求未找到');
  }

  const existingShortlist = await Shortlist.findOne({
    user: req.user._id,
    request: requestId
  });

  if (existingShortlist) {
    throw createError.conflict('该请求已在收藏夹中');
  }

  const shortlistItem = await Shortlist.create({
    user: req.user._id,
    request: requestId,
    notes,
    tags
  });

  await Request.findByIdAndUpdate(requestId, {
    $inc: { 'stats.shortlistCount': 1 }
  });

  const populatedItem = await Shortlist.findById(shortlistItem._id)
    .populate('request')
    .populate('request.requester', 'name email phone');

  res.status(201).json({
    success: true,
    message: '已添加到收藏夹',
    data: { shortlistItem: populatedItem }
  });
});

exports.removeFromShortlist = asyncHandler(async (req, res) => {
  const requestId = req.params.requestId;

  const shortlistItem = await Shortlist.findOneAndDelete({
    user: req.user._id,
    request: requestId
  });

  if (!shortlistItem) {
    throw createError.notFound('收藏项未找到');
  }

  await Request.findByIdAndUpdate(requestId, {
    $inc: { 'stats.shortlistCount': -1 }
  });

  res.json({
    success: true,
    message: '已从收藏夹移除'
  });
});

exports.checkShortlist = asyncHandler(async (req, res) => {
  const isShortlisted = await Shortlist.exists({
    user: req.user._id,
    request: req.params.requestId
  });

  res.json({
    success: true,
    data: { isShortlisted: !!isShortlisted }
  });
});

exports.updateShortlist = asyncHandler(async (req, res) => {
  const { notes, tags } = req.body;
  const requestId = req.params.requestId;

  const shortlistItem = await Shortlist.findOneAndUpdate(
    { user: req.user._id, request: requestId },
    { notes, tags },
    { new: true }
  ).populate('request');

  if (!shortlistItem) {
    throw createError.notFound('收藏项未找到');
  }

  res.json({
    success: true,
    message: '收藏项已更新',
    data: { shortlistItem }
  });
});

exports.getHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, category, startDate, endDate } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);

  let query = {};
  
  if (req.user.userType === 'pin') {
    query = {
      requester: req.user._id,
      status: { $in: ['completed', 'matched'] }
    };
  } else if (req.user.userType === 'csr') {
    query = {
      'assignedVolunteers.volunteer': req.user._id,
      status: { $in: ['completed', 'matched'] }
    };
  }

  if (category) query.category = category;
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const [records, total] = await Promise.all([
    Request.find(query)
      .populate('requester', 'name email phone')
      .populate('assignedVolunteers.volunteer', 'name email phone organization')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Request.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: {
      records,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    }
  });
});
