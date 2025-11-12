const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
console.log('Testing MongoDB connection...');
console.log('URI (first 50 chars):', uri ? uri.substring(0, 50) : 'NOT SET');

mongoose.connect(uri)
  .then(() => {
    console.log('✅ MongoDB connection successful!');
    console.log('Host:', mongoose.connection.host);
    console.log('Database:', mongoose.connection.name);
    mongoose.connection.close();
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ MongoDB connection failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.code) console.error('Error code:', error.code);
    process.exit(1);
  });
