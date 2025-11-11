const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  // 基本信息
  title: {
    type: String,
    required: [true, '标题是必填项'],
    trim: true,
    maxlength: [200, '标题不能超过200个字符']
  },
  description: {
    type: String,
    required: [true, '描述是必填项'],
    trim: true,
    maxlength: [1000, '描述不能超过1000个字符']
  },
  
  // 分类
  category: {
    type: String,
    required: [true, '服务类型是必填项'],
    enum: {
      values: ['medical', 'transportation', 'shopping', 'household', 'technology', 'companion', 'other'],
      message: '无效的服务类型'
    }
  },
  
  // 紧急程度
  urgency: {
    type: String,
    required: [true, '紧急程度是必填项'],
    enum: {
      values: ['low', 'medium', 'high', 'urgent'],
      message: '无效的紧急程度'
    }
  },
  
  // 位置信息
  location: {
    address: {
      type: String,
      required: [true, '地址是必填项'],
      trim: true,
      maxlength: [500, '地址不能超过500个字符']
    },
    coordinates: {
      latitude: {
        type: Number,
        min: [-90, '纬度必须在-90到90之间'],
        max: [90, '纬度必须在-90到90之间']
      },
      longitude: {
        type: Number,
        min: [-180, '经度必须在-180到180之间'],
        max: [180, '经度必须在-180到180之间']
      }
    },
    city: String,
    district: String,
    postalCode: String
  },
  
  // 时间安排
  expectedDate: {
    type: Date,
    required: false,
    validate: {
      validator: function(date) {
        if (!date) return true; // 如果没有日期，跳过验证
        return date >= new Date();
      },
      message: '期望日期不能是过去的时间'
    }
  },
  expectedTime: {
    type: String,
    enum: {
      values: ['', 'morning', 'afternoon', 'evening'],
      message: '时间段必须是 morning, afternoon, evening 或空字符串'
    }
  },
  estimatedDuration: {
    type: Number, // 预估时长（小时）
    min: [0.5, '预估时长至少0.5小时'],
    max: [24, '预估时长不能超过24小时']
  },
  
  // 志愿者需求
  volunteersNeeded: {
    type: Number,
    required: [true, '需要的志愿者数量是必填项'],
    min: [1, '至少需要1名志愿者'],
    max: [10, '最多需要10名志愿者']
  },
  
  // 联系方式偏好
  contactMethod: {
    type: String,
    enum: ['phone', 'email', 'both'],
    default: 'both'
  },
  
  // 额外说明
  additionalNotes: {
    type: String,
    trim: true,
    maxlength: [500, '额外说明不能超过500个字符']
  },

  // 附件（例如医生证明、照片等）
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    url: String,
    mimetype: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // 请求者信息
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '请求者信息是必填项']
  },
  
  // 状态管理
  status: {
    type: String,
    enum: ['pending', 'matched', 'completed', 'cancelled', 'expired'],
    default: 'pending'
  },
  
  // 志愿者相关
  interestedVolunteers: [{
    volunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    message: {
      type: String,
      maxlength: [300, '申请留言不能超过300个字符']
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    }
  }],
  
  // 匹配的志愿者
  assignedVolunteers: [{
    volunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: Date,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String
  }],
  
  // 统计信息
  stats: {
    viewCount: {
      type: Number,
      default: 0
    },
    shortlistCount: {
      type: Number,
      default: 0
    },
    applicationCount: {
      type: Number,
      default: 0
    }
  },
  
  // 完成信息
  completionDetails: {
    completedAt: Date,
    actualDuration: Number,
    notes: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String
  },
  
  // 取消/过期信息
  cancellationReason: String,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: Date,
  
  // 自动过期
  expiresAt: {
    type: Date,
    default: function() {
      // 默认30天后过期
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引
requestSchema.index({ status: 1 });
requestSchema.index({ category: 1 });
requestSchema.index({ urgency: 1 });
requestSchema.index({ expectedDate: 1 });
requestSchema.index({ requester: 1 });
requestSchema.index({ 'location.coordinates': '2dsphere' }); // 地理位置索引
requestSchema.index({ createdAt: -1 });
requestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL索引

// 虚拟字段
requestSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

requestSchema.virtual('isUrgent').get(function() {
  return this.urgency === 'urgent' || this.urgency === 'high';
});

requestSchema.virtual('availableSlots').get(function() {
  return this.volunteersNeeded - this.assignedVolunteers.length;
});

requestSchema.virtual('daysUntilExpected').get(function() {
  if (!this.expectedDate) return null;
  const diffTime = this.expectedDate - new Date();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// 中间件
requestSchema.pre('save', function(next) {
  // 更新统计信息
  this.stats.applicationCount = this.interestedVolunteers.length;
  
  // 如果有足够的志愿者且状态为pending，自动更新为matched
  if (this.status === 'pending' && this.assignedVolunteers.length >= this.volunteersNeeded) {
    this.status = 'matched';
  }
  
  next();
});

// 静态方法
requestSchema.statics.getActiveRequests = function() {
  return this.find({
    status: { $in: ['pending', 'matched'] },
    expectedDate: { $gte: new Date() }
  });
};

requestSchema.statics.getRequestsByCategory = function(category) {
  return this.find({ category, status: { $ne: 'cancelled' } });
};

requestSchema.statics.searchRequests = function(searchQuery, filters = {}) {
  const query = { status: { $ne: 'cancelled' } };
  
  // 文本搜索
  if (searchQuery) {
    query.$or = [
      { title: { $regex: searchQuery, $options: 'i' } },
      { description: { $regex: searchQuery, $options: 'i' } },
      { 'location.address': { $regex: searchQuery, $options: 'i' } }
    ];
  }
  
  // 筛选条件
  if (filters.category) query.category = filters.category;
  if (filters.urgency) query.urgency = filters.urgency;
  if (filters.status) query.status = filters.status;
  
  return this.find(query);
};

// 实例方法
requestSchema.methods.addInterest = function(volunteerId, message = '') {
  // 检查是否已经申请过
  const existingInterest = this.interestedVolunteers.find(
    interest => interest.volunteer.toString() === volunteerId.toString()
  );
  
  if (existingInterest) {
    throw new Error('您已经申请过这个志愿服务');
  }
  
  this.interestedVolunteers.push({
    volunteer: volunteerId,
    message: message
  });
  
  return this.save();
};

requestSchema.methods.assignVolunteer = function(volunteerId) {
  // 检查是否有可用名额
  if (this.assignedVolunteers.length >= this.volunteersNeeded) {
    throw new Error('志愿者名额已满');
  }
  
  // 从申请列表中移除
  this.interestedVolunteers = this.interestedVolunteers.filter(
    interest => interest.volunteer.toString() !== volunteerId.toString()
  );
  
  // 添加到分配列表
  this.assignedVolunteers.push({
    volunteer: volunteerId
  });
  
  return this.save();
};

requestSchema.methods.markCompleted = function(completionData = {}) {
  this.status = 'completed';
  this.completionDetails = {
    completedAt: new Date(),
    ...completionData
  };
  
  // 更新分配的志愿者完成时间
  this.assignedVolunteers.forEach(assignment => {
    if (!assignment.completedAt) {
      assignment.completedAt = new Date();
    }
  });
  
  return this.save();
};

requestSchema.methods.incrementViewCount = function() {
  this.stats.viewCount += 1;
  return this.save();
};

module.exports = mongoose.model('Request', requestSchema);