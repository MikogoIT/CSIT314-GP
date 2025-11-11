const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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
    await mongoose.connect(mongoUri);
    console.log('📦 Database connected successfully');
    console.log(`🔗 Connection: ${mongoUri}`);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// 随机生成器函数
const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];
const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// 模拟数据常量
const chineseFirstNames = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗'];
const chineseLastNames = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '涛', '明', '超', '秀兰', '霞', '平'];
const englishFirstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Lisa', 'Robert', 'Emma', 'William', 'Olivia', 'James', 'Sophia', 'Benjamin', 'Isabella', 'Daniel', 'Charlotte'];
const englishLastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas'];

const addresses = [
  '北京市朝阳区三里屯街道', '上海市浦东新区陆家嘴金融区', '深圳市南山区科技园',
  '广州市天河区珠江新城', '杭州市西湖区文三路', '南京市鼓楼区中山路',
  '成都市锦江区春熙路', '武汉市洪山区光谷', '西安市雁塔区高新区',
  '天津市和平区南京路', '重庆市渝中区解放碑', '青岛市市南区香港中路'
];

const cities = ['北京', '上海', '深圳', '广州', '杭州', '南京', '成都', '武汉', '西安', '天津'];
const districts = ['朝阳区', '浦东新区', '南山区', '天河区', '西湖区', '鼓楼区', '锦江区', '洪山区', '雁塔区', '和平区'];

const requestTitles = [
  '需要帮助购买日用品', '陪同就医看病', '家电维修协助', '搬家帮忙',
  '电脑技术支持', '陪伴聊天散步', '购买药品', '清洁卫生帮助',
  '接送服务', '烹饪协助', '文件翻译', '在线课程辅导',
  '宠物照看', '花园打理', '购物代买', '医院陪护',
  '技术设备设置', '阅读陪伴', '运动健身指导', '法律咨询协助'
];

const requestDescriptions = [
  '由于行动不便，需要志愿者帮助购买一些日常生活用品，包括食物和清洁用品。',
  '需要陪同前往医院看病，因为对医院环境不熟悉，希望有人能够协助。',
  '家里的洗衣机出现故障，需要有经验的志愿者协助联系维修或提供技术指导。',
  '计划近期搬家，需要志愿者帮助搬运一些重物和家具。',
  '电脑出现问题无法正常使用，希望有技术背景的志愿者能够提供远程或现场支持。',
  '独居老人，希望有志愿者能够定期陪伴聊天，一起散步锻炼。',
  '需要购买处方药品，但无法亲自前往药店，希望志愿者代为购买。',
  '家里需要深度清洁，由于身体原因无法完成，需要志愿者协助。',
  '需要接送服务前往银行办理业务，公共交通不便。',
  '希望学习一些简单的烹饪技巧，需要有经验的志愿者指导。'
];

// 预定义分类数据
const predefinedCategories = [
  {
    name: 'medical',
    displayName: { zh: '医疗健康', en: 'Medical & Health' },
    description: { zh: '医疗陪护、买药、健康咨询等服务', en: 'Medical care, pharmacy, health consultation services' },
    icon: '🏥',
    color: '#e91e63'
  },
  {
    name: 'transportation',
    displayName: { zh: '出行交通', en: 'Transportation' },
    description: { zh: '接送服务、陪同出行等交通相关服务', en: 'Pick-up services, travel assistance and transportation' },
    icon: '🚗',
    color: '#2196f3'
  },
  {
    name: 'shopping',
    displayName: { zh: '购物代办', en: 'Shopping' },
    description: { zh: '代购日用品、食品、药品等购物服务', en: 'Shopping for daily necessities, food, medicine' },
    icon: '🛒',
    color: '#4caf50'
  },
  {
    name: 'household',
    displayName: { zh: '家政服务', en: 'Household' },
    description: { zh: '清洁、维修、搬家等家庭服务', en: 'Cleaning, repair, moving and household services' },
    icon: '🏠',
    color: '#ff9800'
  },
  {
    name: 'technology',
    displayName: { zh: '技术支持', en: 'Technology' },
    description: { zh: '电脑、手机、网络等技术问题解决', en: 'Computer, mobile, internet technical support' },
    icon: '💻',
    color: '#9c27b0'
  },
  {
    name: 'companion',
    displayName: { zh: '陪伴服务', en: 'Companion' },
    description: { zh: '聊天陪伴、散步、阅读等精神慰藉', en: 'Chat, walking, reading and emotional support' },
    icon: '👥',
    color: '#00bcd4'
  },
  {
    name: 'other',
    displayName: { zh: '其他服务', en: 'Other' },
    description: { zh: '其他类型的志愿服务', en: 'Other types of volunteer services' },
    icon: '🤝',
    color: '#607d8b'
  }
];

// 生成用户数据
const generateUsers = async (count) => {
  console.log(`🧑‍💼 Generating ${count} users...`);
  const users = [];
  
  // Calculate user counts per type
  const adminCount = 1; // Only 1 admin
  const remainingCount = count - adminCount;
  const pinCount = Math.floor(remainingCount * 0.4); // 40% PIN users
  const csrCount = remainingCount - pinCount; // Rest are CSR users
  
  console.log(`  Distribution: ${adminCount} admin, ${pinCount} PIN users, ${csrCount} CSR users`);
  
  let adminCreated = 0;
  let pinCreated = 0;
  let csrCreated = 0;
  
  for (let i = 0; i < count; i++) {
    let userType;
    
    // Determine user type
    if (adminCreated < adminCount) {
      userType = 'admin';
      adminCreated++;
    } else if (pinCreated < pinCount) {
      userType = 'pin';
      pinCreated++;
    } else {
      userType = 'csr';
      csrCreated++;
    }
    
    const isChineseName = Math.random() > 0.3; // 70% Chinese names
    
    let name, email, password;
    
    // Create fixed admin account
    if (userType === 'admin') {
      name = 'System Administrator';
      email = 'mikogo@admin.com';
      password = await bcrypt.hash('msl201215', 12);
    } else {
      if (isChineseName) {
        name = getRandomElement(chineseFirstNames) + getRandomElement(chineseLastNames) + (Math.random() > 0.5 ? getRandomElement(chineseLastNames) : '');
      } else {
        name = getRandomElement(englishFirstNames) + ' ' + getRandomElement(englishLastNames);
      }
      email = `user${i + 1}_${userType}@example.com`;
      password = await bcrypt.hash('password123', 12);
    }
    
    const userData = {
      name,
      email,
      password,
      userType,
      phone: `1${getRandomNumber(300000000, 999999999)}`,
      address: getRandomElement(addresses) + `${getRandomNumber(1, 999)}号`,
      profilePicture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      status: userType === 'admin' ? 'active' : getRandomElement(['active', 'active', 'active', 'suspended']),
      isEmailVerified: userType === 'admin' ? true : Math.random() > 0.2,
      language: userType === 'admin' ? 'zh' : (Math.random() > 0.3 ? 'zh' : 'en'),
    };

    // 根据用户类型添加特定字段
    if (userType === 'pin') {
      userData.emergencyContact = {
        name: getRandomElement(chineseFirstNames) + getRandomElement(chineseLastNames),
        phone: `1${getRandomNumber(300000000, 999999999)}`,
        relationship: getRandomElement(['子女', '配偶', '朋友', '邻居'])
      };
      userData.medicalInfo = {
        conditions: getRandomElement([
          ['高血压'], ['糖尿病'], ['关节炎'], ['心脏病'], 
          ['高血压', '糖尿病'], ['无特殊疾病'], ['轻微感冒'], ['腰椎问题']
        ]),
        medications: getRandomElement([
          ['降压药'], ['胰岛素'], ['止痛药'], ['心脏药物'], 
          ['维生素'], ['无'], ['钙片'], ['感冒药']
        ]),
        allergies: getRandomElement([['无'], ['青霉素'], ['花粉'], ['海鲜'], ['坚果']]),
        mobility: getRandomElement(['good', 'limited', 'wheelchair', 'walker'])
      };
      userData.preferences = {
        communicationMethod: getRandomElement(['phone', 'email', 'both']),
        availableTime: getRandomElement([
          ['morning'], ['afternoon'], ['evening'], 
          ['morning', 'afternoon'], ['afternoon', 'evening'], 
          ['morning', 'afternoon', 'evening']
        ]),
        genderPreference: getRandomElement(['none', 'male', 'female']),
        languagePreference: getRandomElement(['none', 'chinese', 'english'])
      };
    } else if (userType === 'csr') {
      userData.volunteerInfo = {
        skills: getRandomElement([
          ['医疗护理'], ['技术支持'], ['烹饪'], ['清洁'], 
          ['陪伴'], ['购物'], ['翻译'], ['驾驶'],
          ['医疗护理', '陪伴'], ['技术支持', '翻译'], 
          ['烹饪', '清洁'], ['购物', '驾驶']
        ]),
        experience: getRandomNumber(0, 10),
        availability: {
          days: getRandomElement([
            ['monday', 'wednesday', 'friday'],
            ['tuesday', 'thursday'],
            ['saturday', 'sunday'],
            ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            ['weekend']
          ]),
          timeSlots: getRandomElement([
            ['morning'], ['afternoon'], ['evening'],
            ['morning', 'afternoon'], ['afternoon', 'evening'],
            ['morning', 'afternoon', 'evening']
          ])
        },
        transportation: Math.random() > 0.4, // 60% 有交通工具
        maxDistance: getRandomNumber(5, 30),
        backgroundCheck: Math.random() > 0.2, // 80% 已通过背景调查
        certifications: getRandomElement([
          [], ['first_aid'], ['cpr'], ['nursing'], 
          ['first_aid', 'cpr'], ['driving'], ['cooking']
        ])
      };
      userData.rating = {
        average: (Math.random() * 2 + 3).toFixed(1), // 3.0 - 5.0
        count: getRandomNumber(0, 50)
      };
    } else if (userType === 'admin') {
      userData.adminInfo = {
        role: 'super_admin', // 唯一管理员拥有最高权限
        permissions: ['user_management', 'content_management', 'system_settings', 'data_management'],
        lastLogin: new Date(), // 最近登录
        loginCount: getRandomNumber(100, 1000),
        createdAt: new Date(2024, 0, 1), // 系统创建时就存在
        description: '系统超级管理员，负责整个平台的管理和维护'
      };
    }

    users.push(userData);
  }
    
  try {
    await User.insertMany(users);
    console.log(`✅ Successfully created ${count} users`);
    console.log(`   Admin account: mikogo@admin.com / msl201215`);
    return await User.find({}).limit(count);
  } catch (error) {
    console.error('❌ Failed to create users:', error);
    throw error;
  }
};

// 生成分类数据
const generateCategories = async () => {
  console.log('📂 Generating categories...');
  
  try {
    // Clear existing categories first
    await Category.deleteMany({});
    
    const categories = [];
    for (const categoryData of predefinedCategories) {
      categories.push({
        ...categoryData,
        isActive: true,
        sortOrder: categories.length + 1,
        stats: {
          requestCount: getRandomNumber(10, 100),
          completedCount: getRandomNumber(5, 80),
          averageRating: (Math.random() * 2 + 3).toFixed(1)
        }
      });
    }
    
    await Category.insertMany(categories);
    console.log(`✅ Successfully created ${categories.length} categories`);
    return await Category.find({});
  } catch (error) {
    console.error('❌ Failed to create categories:', error);
    throw error;
  }
};

// 生成请求数据
const generateRequests = async (count, users, categories) => {
  console.log(`📋 Generating ${count} requests...`);
  const requests = [];
  
  // Get PIN users only (they are the ones who create requests)
  const pinUsers = users.filter(user => user.userType === 'pin');
  
  if (pinUsers.length === 0) {
    console.error('❌ No PIN users found to create requests!');
    return [];
  }
  
  console.log(`   Found ${pinUsers.length} PIN users to create requests`);
  
  for (let i = 0; i < count; i++) {
    const user = getRandomElement(pinUsers);
    const category = getRandomElement(categories);
    
    const requestData = {
      title: getRandomElement(requestTitles),
      description: getRandomElement(requestDescriptions),
      category: category.name,
      urgency: getRandomElement(['low', 'medium', 'high', 'urgent']),
      location: {
        address: getRandomElement(addresses) + `${getRandomNumber(1, 999)}号`,
        coordinates: [
          116.4074 + (Math.random() - 0.5) * 2, // longitude 经度
          39.9042 + (Math.random() - 0.5) * 2   // latitude 纬度 (北京周边)
        ],
        city: getRandomElement(cities),
        district: getRandomElement(districts),
        postalCode: `${getRandomNumber(100000, 999999)}`
      },
      expectedDate: Math.random() > 0.3 ? getRandomDate(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) : null,
      expectedTime: getRandomElement(['', 'morning', 'afternoon', 'evening']),
      estimatedDuration: getRandomElement([0.5, 1, 1.5, 2, 3, 4, 6, 8]),
      volunteersNeeded: getRandomNumber(1, 3),
      contactMethod: getRandomElement(['phone', 'email', 'both']),
      isUrgent: Math.random() > 0.8, // 20% 紧急
      requiredSkills: getRandomElement([
        [], ['驾驶'], ['医疗知识'], ['技术支持'], ['烹饪'], 
        ['陪伴'], ['翻译'], ['清洁'], ['购物']
      ]),
      equipmentNeeded: getRandomElement([
        [], ['交通工具'], ['清洁用品'], ['医疗设备'], 
        ['电脑'], ['购物袋'], ['工具箱']
      ]),
      status: getRandomElement(['pending', 'matched', 'completed', 'cancelled']),
      requester: user._id,
      assignedVolunteers: [], // 稍后分配
      interestedVolunteers: [], // 稍后分配
      isPublic: Math.random() > 0.1, // 90% 公开
      tags: getRandomElement([
        [], ['急需'], ['长期'], ['短期'], ['重复'], ['灵活时间'], 
        ['周末'], ['工作日'], ['老年人'], ['残障人士']
      ])
    };

    // 随机分配一些已完成的请求的完成时间
    if (requestData.status === 'completed') {
      requestData.completionDetails = {
        completedAt: getRandomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()),
        rating: getRandomNumber(3, 5),
        feedback: getRandomElement([
          '服务很好，志愿者很负责',
          '非常感谢志愿者的帮助',
          '及时有效的服务',
          '志愿者很专业',
          '满意的服务体验'
        ])
      };
    }

    requests.push(requestData);
  }
  
  try {
    await Request.insertMany(requests);
    console.log(`✅ Successfully created ${count} requests`);
    console.log(`   All requests have valid PIN user requesters`);
    return await Request.find({}).populate('requester');
  } catch (error) {
    console.error('❌ Failed to create requests:', error);
    throw error;
  }
};

// 生成收藏夹数据
const generateShortlists = async (count, users, requests) => {
  console.log(`⭐ Generating ${count} shortlist records...`);
  
  // Get CSR users
  const csrUsers = users.filter(user => user.userType === 'csr');
  
  if (csrUsers.length === 0 || requests.length === 0) {
    console.warn('⚠️  Not enough CSR users or requests to create shortlists');
    return [];
  }
  
  const shortlists = [];
  const maxAttempts = count * 3; // Prevent infinite loop
  let attempts = 0;
  
  while (shortlists.length < count && attempts < maxAttempts) {
    attempts++;
    const user = getRandomElement(csrUsers);
    const request = getRandomElement(requests);
    
    // Check if this combination already exists
    const existingShortlist = shortlists.find(s => 
      s.user.toString() === user._id.toString() && 
      s.request.toString() === request._id.toString()
    );
    
    if (existingShortlist) {
      continue; // Skip duplicates
    }
    
    const shortlistData = {
      user: user._id,
      request: request._id,
      notes: Math.random() > 0.5 ? getRandomElement([
        '这个请求很适合我',
        '我有相关经验',
        '时间安排合适',
        '地点很方便',
        '想要帮助这位用户',
        '看起来很有意义'
      ]) : '',
      tags: getRandomElement([
        [], ['感兴趣'], ['有经验'], ['时间合适'], ['地点近'], 
        ['优先考虑'], ['等待联系'], ['已申请']
      ]),
      reminder: {
        enabled: Math.random() > 0.7, // 30% 设置提醒
        reminderDate: Math.random() > 0.5 ? getRandomDate(new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) : null,
        reminderSent: false
      }
    };
    
    shortlists.push(shortlistData);
  }
  
  try {
    if (shortlists.length > 0) {
      await Shortlist.insertMany(shortlists);
      console.log(`✅ Successfully created ${shortlists.length} shortlist records`);
    } else {
      console.log('⚠️  No shortlist records created');
    }
    return shortlists;
  } catch (error) {
    console.error('❌ Failed to create shortlist records:', error);
    throw error;
  }
};

// 更新请求的志愿者分配
const updateRequestAssignments = async (requests, users) => {
  console.log('🔗 Updating request volunteer assignments...');
  
  const csrUsers = users.filter(user => user.userType === 'csr');
  
  if (csrUsers.length === 0) {
    console.warn('⚠️  No CSR users available for assignments');
    return;
  }
  
  let updateCount = 0;
  
  for (const request of requests) {
    // Randomly assign applicants (50% chance of having applicants)
    if (Math.random() > 0.5) {
      const applicantCount = getRandomNumber(1, Math.min(5, csrUsers.length));
      const applicants = [];
      const usedVolunteers = new Set();
      
      for (let i = 0; i < applicantCount; i++) {
        const volunteer = getRandomElement(csrUsers);
        
        // Avoid duplicate volunteers
        if (!usedVolunteers.has(volunteer._id.toString())) {
          usedVolunteers.add(volunteer._id.toString());
          applicants.push({
            volunteer: volunteer._id,
            appliedAt: getRandomDate(request.createdAt, new Date()),
            message: getRandomElement([
              'I have relevant experience and willing to help',
              'My schedule fits well, I can assist',
              'I live nearby and can provide help',
              'I would love to participate in this service',
              'Hope I can help you'
            ]),
            status: getRandomElement(['pending', 'accepted', 'rejected'])
          });
        }
      }
      
      request.interestedVolunteers = applicants;
      
      // If request is matched or completed, assign volunteers
      if ((request.status === 'matched' || request.status === 'completed') && applicants.length > 0) {
        const acceptedApplicants = applicants.filter(a => a.status === 'accepted');
        
        // Ensure at least one is accepted if status is matched/completed
        if (acceptedApplicants.length === 0 && applicants.length > 0) {
          applicants[0].status = 'accepted';
          acceptedApplicants.push(applicants[0]);
        }
        
        const assignedCount = Math.min(acceptedApplicants.length, request.volunteersNeeded);
        
        if (assignedCount > 0) {
          request.assignedVolunteers = acceptedApplicants
            .slice(0, assignedCount)
            .map(a => ({
              volunteer: a.volunteer,
              assignedAt: getRandomDate(a.appliedAt, request.completionDetails?.completedAt || new Date())
            }));
          
          // If completed, add completion details
          if (request.status === 'completed') {
            request.assignedVolunteers.forEach(assignment => {
              assignment.completedAt = request.completionDetails.completedAt;
              assignment.rating = getRandomNumber(3, 5);
              assignment.feedback = getRandomElement([
                'Great service attitude',
                'Very responsible',
                'Professional and reliable',
                'Helpful and kind',
                'Trustworthy'
              ]);
            });
          }
        }
      }
      
      await request.save();
      updateCount++;
    }
  }
  
  console.log(`✅ Successfully updated ${updateCount} requests with volunteer assignments`);
};

// 主函数
const generateTestData = async () => {
  try {
    console.log('🚀 Starting test data generation...\n');
    
    // Connect to database
    await connectDB();
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Request.deleteMany({});
    await Shortlist.deleteMany({});
    console.log('✅ Existing data cleared\n');
    
    // Generate data
    const users = await generateUsers(100);
    const categories = await generateCategories();
    const requests = await generateRequests(100, users, categories);
    const shortlists = await generateShortlists(100, users, requests);
    
    // Update request assignments
    await updateRequestAssignments(requests, users);
    
    // Display statistics
    console.log('\n📊 Data Generation Summary:');
    console.log(`👥 Users: ${users.length}`);
    console.log(`  - PIN users: ${users.filter(u => u.userType === 'pin').length}`);
    console.log(`  - CSR users: ${users.filter(u => u.userType === 'csr').length}`);
    console.log(`  - Admins: ${users.filter(u => u.userType === 'admin').length}`);
    console.log(`\n🔐 Admin Account:`);
    console.log(`  Email: mikogo@admin.com`);
    console.log(`  Password: msl201215`);
    console.log(`\n📂 Categories: ${categories.length}`);
    console.log(`📋 Requests: ${requests.length}`);
    console.log(`  - Pending: ${requests.filter(r => r.status === 'pending').length}`);
    console.log(`  - Matched: ${requests.filter(r => r.status === 'matched').length}`);
    console.log(`  - Completed: ${requests.filter(r => r.status === 'completed').length}`);
    console.log(`  - Cancelled: ${requests.filter(r => r.status === 'cancelled').length}`);
    console.log(`⭐ Shortlists: ${shortlists.length}`);
    
    console.log('\n🎉 Test data generation completed successfully!');
    console.log('\n💡 Login with: mikogo@admin.com / msl201215');
    
  } catch (error) {
    console.error('❌ Test data generation failed:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n📦 Database connection closed');
    process.exit(0);
  }
};

// Run script
generateTestData();