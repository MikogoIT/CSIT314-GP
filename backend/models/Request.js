const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
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

  category: {
    type: String,
    required: [true, '服务类型是必填项'],
    enum: {
      values: ['medical', 'transportation', 'shopping', 'household', 'technology', 'companion', 'other'],
      message: '无效的服务类型'
    }
  },

  urgency: {
    type: String,
    required: [true, '紧急程度是必填项'],
    enum: {
      values: ['low', 'medium', 'high', 'urgent'],
      message: '无效的紧急程度'
    }
  },

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

  expectedDate: {
    type: Date,
    required: false,
    validate: {
      validator: function(date) {
        if (!date) return true; 
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
    type: Number, 
    min: [0.5, '预估时长至少0.5小时'],
    max: [24, '预估时长不能超过24小时']
  },

  volunteersNeeded: {
    type: Number,
    required: [true, '需要的志愿者数量是必填项'],
    min: [1, '至少需要1名志愿者'],
    max: [10, '最多需要10名志愿者']
  },

  contactMethod: {
    type: String,
    enum: ['phone', 'email', 'both'],
    default: 'both'
  },

  additionalNotes: {
    type: String,
    trim: true,
    maxlength: [500, '额外说明不能超过500个字符']
  },

  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    url: String,
    mimetype: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now }
  }],

  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '请求者信息是必填项']
  },

  status: {
    type: String,
    enum: ['pending', 'matched', 'completed', 'cancelled', 'expired'],
    default: 'pending'
  },

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

  rejectedVolunteers: [{
    volunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rejectedAt: {
      type: Date,
      default: Date.now
    },
    reason: {
      type: String,
      maxlength: [500, '拒绝原因不能超过500个字符']
    }
  }],

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

  cancellationReason: String,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: Date,

  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

requestSchema.index({ status: 1 });
requestSchema.index({ category: 1 });
requestSchema.index({ urgency: 1 });
requestSchema.index({ expectedDate: 1 });
requestSchema.index({ requester: 1 });
requestSchema.index({ 'location.coordinates': '2dsphere' }); 
requestSchema.index({ createdAt: -1 });
requestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); 

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

requestSchema.pre('save', function(next) {
  this.stats.applicationCount = this.interestedVolunteers.length;
  
  if (this.status === 'pending' && this.assignedVolunteers.length >= this.volunteersNeeded) {
    this.status = 'matched';
  }
  
  next();
});

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

  if (searchQuery) {
    query.$or = [
      { title: { $regex: searchQuery, $options: 'i' } },
      { description: { $regex: searchQuery, $options: 'i' } },
      { 'location.address': { $regex: searchQuery, $options: 'i' } }
    ];
  }

  if (filters.category) query.category = filters.category;
  if (filters.urgency) query.urgency = filters.urgency;
  if (filters.status) query.status = filters.status;
  
  return this.find(query);
};

requestSchema.methods.addInterest = function(volunteerId, message = '') {
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
  if (this.assignedVolunteers.length >= this.volunteersNeeded) {
    throw new Error('志愿者名额已满');
  }
  
  this.interestedVolunteers = this.interestedVolunteers.filter(
    interest => interest.volunteer.toString() !== volunteerId.toString()
  );

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