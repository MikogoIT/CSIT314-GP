const mongoose = require('mongoose');

const shortlistSchema = new mongoose.Schema({
  // 用户信息
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '用户信息是必填项']
  },
  
  // 收藏的请求
  request: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    required: [true, '请求信息是必填项']
  },
  
  // 收藏时的备注
  notes: {
    type: String,
    trim: true,
    maxlength: [500, '备注不能超过500个字符']
  },
  
  // 收藏时的标签
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, '标签不能超过50个字符']
  }],
  
  // 提醒设置
  reminder: {
    enabled: {
      type: Boolean,
      default: false
    },
    reminderDate: Date,
    reminderSent: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// 复合索引确保用户不能重复收藏同一个请求
shortlistSchema.index({ user: 1, request: 1 }, { unique: true });
shortlistSchema.index({ user: 1, createdAt: -1 });

// 静态方法
shortlistSchema.statics.getUserShortlist = function(userId, options = {}) {
  const query = this.find({ user: userId })
    .populate('request')
    .sort({ createdAt: -1 });
    
  if (options.limit) query.limit(options.limit);
  if (options.skip) query.skip(options.skip);
  
  return query;
};

shortlistSchema.statics.isShortlisted = function(userId, requestId) {
  return this.exists({ user: userId, request: requestId });
};

module.exports = mongoose.model('Shortlist', shortlistSchema);