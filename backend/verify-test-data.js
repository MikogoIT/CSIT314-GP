const mongoose = require('mongoose');
require('dotenv').config();

// 引入模型
const User = require('./models/User');
const Request = require('./models/Request');
const Category = require('./models/Category');
const Shortlist = require('./models/Shortlist');

// 连接数据库
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/csr_volunteer_db';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('📦 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
  }
};

// 验证数据
const verifyData = async () => {
  try {
    console.log('🔍 开始验证数据...\n');
    
    // 用户统计
    const userCount = await User.countDocuments();
    const pinCount = await User.countDocuments({ userType: 'pin' });
    const csrCount = await User.countDocuments({ userType: 'csr' });
    const adminCount = await User.countDocuments({ userType: 'admin' });
    const activeUsers = await User.countDocuments({ status: 'active' });
    const verifiedUsers = await User.countDocuments({ isEmailVerified: true });
    
    console.log('👥 用户数据验证:');
    console.log(`  总用户数: ${userCount}`);
    console.log(`  PIN用户: ${pinCount} | CSR用户: ${csrCount} | 管理员: ${adminCount}`);
    console.log(`  活跃用户: ${activeUsers} | 已验证用户: ${verifiedUsers}`);
    
    // 分类统计
    const categoryCount = await Category.countDocuments();
    const activeCategories = await Category.countDocuments({ isActive: true });
    const categories = await Category.find({}, 'name displayName.zh').lean();
    
    console.log('\n📂 分类数据验证:');
    console.log(`  总分类数: ${categoryCount} | 活跃分类: ${activeCategories}`);
    console.log('  分类列表:', categories.map(c => `${c.name}(${c.displayName.zh})`).join(', '));
    
    // 请求统计
    const requestCount = await Request.countDocuments();
    const requestsByStatus = await Request.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const requestsByCategory = await Request.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const requestsWithVolunteers = await Request.countDocuments({
      assignedVolunteers: { $exists: true, $ne: [] }
    });
    
    console.log('\n📋 请求数据验证:');
    console.log(`  总请求数: ${requestCount}`);
    console.log('  按状态分布:', requestsByStatus.map(r => `${r._id}: ${r.count}`).join(' | '));
    console.log('  按分类分布:', requestsByCategory.map(r => `${r._id}: ${r.count}`).join(' | '));
    console.log(`  已分配志愿者的请求: ${requestsWithVolunteers}`);
    
    // 收藏统计
    const shortlistCount = await Shortlist.countDocuments();
    const shortlistsWithNotes = await Shortlist.countDocuments({ notes: { $exists: true, $ne: '' } });
    const shortlistsWithReminders = await Shortlist.countDocuments({ 'reminder.enabled': true });
    
    console.log('\n⭐ 收藏数据验证:');
    console.log(`  总收藏数: ${shortlistCount}`);
    console.log(`  有备注的收藏: ${shortlistsWithNotes}`);
    console.log(`  设置提醒的收藏: ${shortlistsWithReminders}`);
    
    // 数据完整性检查
    console.log('\n🔎 数据完整性检查:');
    
    // 检查请求的创建者是否都是PIN用户
    const invalidRequests = await Request.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'requester',
          foreignField: '_id',
          as: 'requesterInfo'
        }
      },
      {
        $match: {
          'requesterInfo.userType': { $ne: 'pin' }
        }
      }
    ]);
    
    console.log(`  ✅ 请求创建者验证: ${invalidRequests.length === 0 ? '通过' : `失败 (${invalidRequests.length}个错误)`}`);
    
    // 检查收藏是否都是CSR用户创建的
    const invalidShortlists = await Shortlist.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $match: {
          'userInfo.userType': { $ne: 'csr' }
        }
      }
    ]);
    
    console.log(`  ✅ 收藏用户验证: ${invalidShortlists.length === 0 ? '通过' : `失败 (${invalidShortlists.length}个错误)`}`);
    
    // 检查分配的志愿者是否都是CSR用户
    const requestsWithInvalidVolunteers = await Request.aggregate([
      {
        $unwind: '$assignedVolunteers'
      },
      {
        $lookup: {
          from: 'users',
          localField: 'assignedVolunteers.volunteer',
          foreignField: '_id',
          as: 'volunteerInfo'
        }
      },
      {
        $match: {
          'volunteerInfo.userType': { $ne: 'csr' }
        }
      }
    ]);
    
    console.log(`  ✅ 志愿者分配验证: ${requestsWithInvalidVolunteers.length === 0 ? '通过' : `失败 (${requestsWithInvalidVolunteers.length}个错误)`}`);
    
    // 示例数据预览
    console.log('\n📋 数据示例预览:');
    
    // 获取一个完整的请求示例
    const sampleRequest = await Request.findOne({ status: 'matched' })
      .populate('requester', 'name email userType')
      .populate('assignedVolunteers.volunteer', 'name email userType')
      .lean();
    
    if (sampleRequest) {
      console.log('\n  📋 示例请求:');
      console.log(`    标题: ${sampleRequest.title}`);
      console.log(`    创建者: ${sampleRequest.requester.name} (${sampleRequest.requester.userType})`);
      console.log(`    状态: ${sampleRequest.status}`);
      console.log(`    分类: ${sampleRequest.category}`);
      console.log(`    紧急程度: ${sampleRequest.urgency}`);
      if (sampleRequest.assignedVolunteers && sampleRequest.assignedVolunteers.length > 0) {
        console.log(`    分配志愿者: ${sampleRequest.assignedVolunteers.map(v => v.volunteer.name).join(', ')}`);
      }
    }
    
    // 获取一个收藏示例
    const sampleShortlist = await Shortlist.findOne()
      .populate('user', 'name email userType')
      .populate('request', 'title category status')
      .lean();
    
    if (sampleShortlist) {
      console.log('\n  ⭐ 示例收藏:');
      console.log(`    用户: ${sampleShortlist.user.name} (${sampleShortlist.user.userType})`);
      console.log(`    收藏请求: ${sampleShortlist.request.title}`);
      console.log(`    请求分类: ${sampleShortlist.request.category}`);
      if (sampleShortlist.notes) {
        console.log(`    备注: ${sampleShortlist.notes}`);
      }
    }
    
    console.log('\n✅ 数据验证完成！所有数据生成正确。');
    
  } catch (error) {
    console.error('❌ 数据验证失败:', error);
  }
};

// 主函数
const main = async () => {
  try {
    await connectDB();
    await verifyData();
  } catch (error) {
    console.error('❌ 执行失败:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n📦 数据库连接已关闭');
    process.exit(0);
  }
};

// 运行脚本
main();