const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  // 基本信息
  name: {
    type: String,
    required: [true, '分类名称是必填项'],
    unique: true,
    trim: true,
    maxlength: [100, '分类名称不能超过100个字符']
  },
  
  // 多语言支持
  displayName: {
    zh: {
      type: String,
      required: [true, '中文显示名称是必填项'],
      trim: true
    },
    en: {
      type: String,
      required: [true, '英文显示名称是必填项'],
      trim: true
    }
  },
  
  // 描述
  description: {
    zh: {
      type: String,
      trim: true,
      maxlength: [500, '中文描述不能超过500个字符']
    },
    en: {
      type: String,
      trim: true,
      maxlength: [500, '英文描述不能超过500个字符']
    }
  },
  
  // 图标
  icon: {
    type: String,
    default: '🤝'
  },
  
  // 颜色主题
  color: {
    type: String,
    default: '#2196F3',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, '请输入有效的颜色代码']
  },
  
  // 状态
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  
  // 排序权重
  sortOrder: {
    type: Number,
    default: 0
  },
  
  // 父分类（支持层级分类）
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  
  // 统计信息
  stats: {
    totalRequests: {
      type: Number,
      default: 0
    },
    activeRequests: {
      type: Number,
      default: 0
    },
    completedRequests: {
      type: Number,
      default: 0
    }
  },
  
  // 配置选项
  config: {
    requiresSpecialMaterials: {
      type: Boolean,
      default: false
    },
    estimatedDurationRange: {
      min: {
        type: Number,
        default: 0.5
      },
      max: {
        type: Number,
        default: 8
      }
    },
    recommendedSkills: [{
      type: String,
      trim: true
    }],
    safetyNotes: {
      zh: String,
      en: String
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引
categorySchema.index({ name: 1 });
categorySchema.index({ status: 1 });
categorySchema.index({ sortOrder: 1 });
categorySchema.index({ parent: 1 });

// 虚拟字段
categorySchema.virtual('isRootCategory').get(function() {
  return !this.parent;
});

categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
});

// 静态方法
categorySchema.statics.getActiveCategories = function() {
  return this.find({ status: 'active' }).sort({ sortOrder: 1, name: 1 });
};

categorySchema.statics.getRootCategories = function() {
  return this.find({ 
    status: 'active', 
    parent: null 
  }).sort({ sortOrder: 1, name: 1 });
};

categorySchema.statics.getCategoryTree = async function() {
  const categories = await this.find({ status: 'active' })
    .populate('subcategories')
    .sort({ sortOrder: 1, name: 1 });
    
  return categories.filter(cat => cat.isRootCategory);
};

// 实例方法
categorySchema.methods.updateStats = async function() {
  const Request = mongoose.model('Request');
  
  const stats = await Request.aggregate([
    { $match: { category: this.name } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  let totalRequests = 0;
  let activeRequests = 0;
  let completedRequests = 0;
  
  stats.forEach(stat => {
    totalRequests += stat.count;
    if (['pending', 'matched'].includes(stat._id)) {
      activeRequests += stat.count;
    }
    if (stat._id === 'completed') {
      completedRequests += stat.count;
    }
  });
  
  this.stats = {
    totalRequests,
    activeRequests,
    completedRequests
  };
  
  return this.save();
};

// 中间件
categorySchema.pre('remove', async function(next) {
  // 检查是否有相关的请求
  const Request = mongoose.model('Request');
  const requestCount = await Request.countDocuments({ category: this.name });
  
  if (requestCount > 0) {
    const error = new Error(`无法删除分类：还有 ${requestCount} 个相关请求`);
    error.statusCode = 400;
    return next(error);
  }
  
  // 检查是否有子分类
  const subcategoryCount = await this.constructor.countDocuments({ parent: this._id });
  
  if (subcategoryCount > 0) {
    const error = new Error(`无法删除分类：还有 ${subcategoryCount} 个子分类`);
    error.statusCode = 400;
    return next(error);
  }
  
  next();
});

module.exports = mongoose.model('Category', categorySchema);