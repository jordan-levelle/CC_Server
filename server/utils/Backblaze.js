const B2 = require('backblaze-b2');

const b2 = new B2({
  applicationKeyId: process.env.B2_KEY_ID,
  applicationKey: process.env.B2_APP_KEY
});

const initializeBackblaze = async () => {
  try {
    await b2.authorize();
    console.log('backblaze authorized');
  } catch (error) {
    console.error('Erro authorizing backblaze', error);
    throw error;
  }
}

module.exports = { b2, initializeBackblaze };
