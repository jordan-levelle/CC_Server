const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

let gfs;

const initGFSBucket = () => {
  if (!gfs && mongoose.connection.readyState === 1) {
    gfs = new GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
    console.log('GridFSBucket connection established.');
  }
  return gfs;
};

const getGFSInstance = () => {
  if (!gfs) {
    throw new Error('GridFSBucket not initialized');
  }
  return gfs;
};

module.exports = { initGFSBucket, getGFSInstance };

