const mongoose = require('mongoose');
require('dotenv').config();

const Request = require('./models/Request');

const checkData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/csr_volunteer_db';
    await mongoose.connect(mongoUri);
    console.log('✅ Database connected');

    // 获取所有请求
    const requests = await Request.find({}).limit(10);
    console.log(`\n📊 Found ${requests.length} requests (showing first 10):\n`);

    requests.forEach((req, index) => {
      console.log(`${index + 1}. ID: ${req._id}`);
      console.log(`   Title: ${req.title}`);
      console.log(`   Status: ${req.status}`);
      console.log(`   ID Length: ${req._id.toString().length}`);
      console.log(`   Is Valid ObjectId: ${mongoose.Types.ObjectId.isValid(req._id)}`);
      console.log('');
    });

    await mongoose.connection.close();
    console.log('✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkData();
