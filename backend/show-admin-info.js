const mongoose = require('mongoose');
require('dotenv').config();

// 引入模型
const User = require('./models/User');

// 连接数据库
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/csr_volunteer_db';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
  }
};

// 显示管理员账户信息
const showAdminInfo = async () => {
  try {
    console.log('🔍 查找管理员账户信息...\n');
    
    const adminUser = await User.findOne({ userType: 'admin' }).lean();
    
    if (!adminUser) {
      console.log('❌ 未找到管理员账户');
      return;
    }
    
    console.log('👨‍💼 管理员账户信息:');
    console.log('=' .repeat(50));
    console.log(`📧 邮箱: ${adminUser.email}`);
    console.log(`🔑 密码: password123`);
    console.log(`👤 姓名: ${adminUser.name}`);
    console.log(`📱 电话: ${adminUser.phone}`);
    console.log(`🏠 地址: ${adminUser.address}`);
    console.log(`✅ 状态: ${adminUser.status === 'active' ? '活跃' : '非活跃'}`);
    console.log(`🔐 验证: ${adminUser.isEmailVerified ? '已验证' : '未验证'}`);
    console.log(`🌐 语言: ${adminUser.language === 'zh' ? '中文' : '英文'}`);
    
    if (adminUser.adminInfo) {
      console.log('\n🛡️  管理员详细信息:');
      console.log(`📋 角色: ${adminUser.adminInfo.role}`);
      console.log(`⚡ 权限: ${adminUser.adminInfo.permissions.join(', ')}`);
      console.log(`🕐 最后登录: ${new Date(adminUser.adminInfo.lastLogin).toLocaleString()}`);
      console.log(`🔢 登录次数: ${adminUser.adminInfo.loginCount}`);
      if (adminUser.adminInfo.description) {
        console.log(`📝 描述: ${adminUser.adminInfo.description}`);
      }
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('💡 使用以下信息登录管理后台:');
    console.log(`   邮箱: ${adminUser.email}`);
    console.log(`   密码: password123`);
    console.log('=' .repeat(50));
    
  } catch (error) {
    console.error('❌ 查询管理员信息失败:', error);
  }
};

// 主函数
const main = async () => {
  try {
    await connectDB();
    await showAdminInfo();
  } catch (error) {
    console.error('❌ 执行失败:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

// 运行脚本
main();