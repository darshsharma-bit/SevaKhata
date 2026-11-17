/**
 * config/db.js — MongoDB connection manager via Mongoose.
 * 
 * Responsibilities:
 * - Reads MONGODB_URI from process.env
 * - Asynchronously connects with retry/error handling
 * - Exposes connection state (isConnected) so the server never falsely claims availability
 */
const mongoose = require('mongoose');

let isConnected = false;
let listenersBound = false;

function bindConnectionEvents(connectionString) {
  if (listenersBound) return;
  listenersBound = true;

  mongoose.connection.on('connected', () => {
    isConnected = true;
    console.log('  MongoDB connected    ->  ' + connectionString.replace(/\/\/[^@]+@/, '//***:***@'));
  });

  mongoose.connection.on('error', (err) => {
    isConnected = false;
    if (process.env.DEBUG_MONGO) {
      console.error('  MongoDB runtime error -> ' + err.message);
    }
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
  });
}

async function connectDB(uri) {
  const connectionString = uri || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sevakhata';
  bindConnectionEvents(connectionString);

  try {
    await mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: 15000,
    });
    isConnected = true;
    return mongoose.connection;
  } catch (err) {
    isConnected = false;
    throw err;
  }
}

async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
  }
}

module.exports = {
  connectDB,
  disconnectDB,
  isConnected: () => isConnected && mongoose.connection.readyState === 1,
  getConnection: () => mongoose.connection,
};
