import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

console.log('MongoDB Connection Test');
console.log('=======================\n');

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ MONGODB_URI is not set in .env file');
  console.log('\n📝 Add one of these to your .env file:\n');
  console.log('Option 1 - Local MongoDB:');
  console.log('MONGODB_URI=mongodb://localhost:27017/tradon\n');
  console.log('Option 2 - MongoDB Atlas (Cloud):');
  console.log('MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tradon\n');
  process.exit(1);
}

console.log('URI (masked):', uri.replace(/\/\/.*:.*@/, '//***:***@'));
console.log('Testing connection...\n');

mongoose.connect(uri, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => {
    console.log('✅ CONNECTION SUCCESSFUL!');
    console.log('Database name:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
    console.log('Port:', mongoose.connection.port);
    
    // List collections
    mongoose.connection.db.listCollections().toArray((err, collections) => {
      if (err) {
        console.error('Error listing collections:', err);
      } else {
        console.log('\nCollections in database:');
        collections.forEach(col => console.log('  -', col.name));
      }
      mongoose.disconnect();
      process.exit(0);
    });
  })
  .catch(err => {
    console.error('❌ CONNECTION FAILED');
    console.error('\nError Type:', err.name);
    console.error('Error Message:', err.message);
    console.error('Error Code:', err.code);
    
    console.log('\n🔍 Troubleshooting:');
    
    if (err.message.includes('ENOTFOUND') || err.message.includes('getaddrinfo')) {
      console.log('➜ Cannot resolve MongoDB hostname');
      console.log('  - Check if hostname is correct');
      console.log('  - For local: use mongodb://localhost:27017');
      console.log('  - For Atlas: copy connection string from MongoDB Atlas dashboard');
    } else if (err.message.includes('ECONNREFUSED')) {
      console.log('➜ Connection refused - MongoDB server is not running');
      console.log('  - Start MongoDB: mongod (local)');
      console.log('  - Or check if MongoDB service is running');
    } else if (err.message.includes('authentication failed')) {
      console.log('➜ Authentication failed');
      console.log('  - Check username and password');
      console.log('  - Make sure user has access to the database');
    } else if (err.message.includes('timed out')) {
      console.log('➜ Connection timed out');
      console.log('  - Check network connectivity');
      console.log('  - For MongoDB Atlas: check IP whitelist in security settings');
    }
    
    console.error('\n\nFull error:', err);
    process.exit(1);
  });
