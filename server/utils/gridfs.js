// gridfs.js
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

let gfs;

mongoose.connection.once('open', () => {
  if (!gfs) {
    gfs = new GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
    console.log('GridFSBucket connection established.');
  }
});

module.exports = { getGFSInstance: () => gfs };
