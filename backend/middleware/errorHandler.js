// 全局错误处理中间件
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // 记录错误到控制台（生产环境中应该使用专业的日志系统）
  console.error('Error:', err);

  // Mongoose验证错误
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = {
      statusCode: 400,
      message: message.join(', '),
      code: 'VALIDATION_ERROR'
    };
  }

  // Mongoose重复键错误
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    error = {
      statusCode: 400,
      message: `${field} '${value}' 已存在`,
      code: 'DUPLICATE_FIELD'
    };
  }

  // Mongoose错误的ObjectId
  if (err.name === 'CastError') {
    error = {
      statusCode: 404,
      message: '资源未找到',
      code: 'RESOURCE_NOT_FOUND'
    };
  }

  // JWT错误
  if (err.name === 'JsonWebTokenError') {
    error = {
      statusCode: 401,
      message: '无效的访问令牌',
      code: 'INVALID_TOKEN'
    };
  }

  // JWT过期错误
  if (err.name === 'TokenExpiredError') {
    error = {
      statusCode: 401,
      message: '访问令牌已过期',
      code: 'TOKEN_EXPIRED'
    };
  }

  // Multer文件上传错误
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = {
      statusCode: 400,
      message: '文件大小超出限制',
      code: 'FILE_TOO_LARGE'
    };
  }

  // 语法错误
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = {
      statusCode: 400,
      message: '请求数据格式错误',
      code: 'INVALID_JSON'
    };
  }

  // 默认错误
  const statusCode = error.statusCode || err.statusCode || 500;
  const message = error.message || '服务器内部错误';
  const code = error.code || 'INTERNAL_SERVER_ERROR';

  res.status(statusCode).json({
    success: false,
    error: message,
    code: code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// 异步错误捕获包装器
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 404处理中间件
const notFound = (req, res, next) => {
  const error = new Error(`路径 ${req.originalUrl} 未找到`);
  error.statusCode = 404;
  error.code = 'ROUTE_NOT_FOUND';
  next(error);
};

// API响应格式化中间件
const formatResponse = (req, res, next) => {
  // 保存原始的json方法
  const originalJson = res.json;

  // 重写json方法
  res.json = function(data) {
    // 如果数据已经是标准格式，直接返回
    if (data && (data.hasOwnProperty('success') || data.hasOwnProperty('error'))) {
      return originalJson.call(this, data);
    }

    // 格式化成功响应
    const formattedResponse = {
      success: true,
      data: data,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    };

    return originalJson.call(this, formattedResponse);
  };

  next();
};

// 自定义错误类
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 常用错误创建函数
const createError = {
  badRequest: (message = '请求参数错误', code = 'BAD_REQUEST') => 
    new AppError(message, 400, code),
    
  unauthorized: (message = '未授权访问', code = 'UNAUTHORIZED') => 
    new AppError(message, 401, code),
    
  forbidden: (message = '禁止访问', code = 'FORBIDDEN') => 
    new AppError(message, 403, code),
    
  notFound: (message = '资源未找到', code = 'NOT_FOUND') => 
    new AppError(message, 404, code),
    
  conflict: (message = '资源冲突', code = 'CONFLICT') => 
    new AppError(message, 409, code),
    
  internal: (message = '服务器内部错误', code = 'INTERNAL_ERROR') => 
    new AppError(message, 500, code)
};

module.exports = {
  errorHandler,
  asyncHandler,
  notFound,
  formatResponse,
  AppError,
  createError
};