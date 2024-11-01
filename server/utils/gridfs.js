// gridfs.js
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

let gfs;

mongoose.connection.once('open', () => {
  gfs = new GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
  console.log('GridFSBucket connection established.');
});

const getGFSBucket = () => {
  if (!gfs) {
    throw new Error('GridFSBucket not initialized');
  }
  return gfs;
};

module.exports = getGFSBucket;
