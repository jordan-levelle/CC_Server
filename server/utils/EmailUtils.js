const sgMail = require('@sendgrid/mail');
const crypto = require('crypto');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (emailValue, emailSubject, emailContent) => { 
  const msg = {
    to: emailValue,
    from: 'jordanlevelle13@gmail.com',
    subject: emailSubject,
    html: emailContent,
  };

  try {
    await sgMail.send(msg);
    console.log('Email Sent');
  } catch (error) {
    console.error('Error sending email:', error); // Add more detailed error logging
    throw new Error('Error sending email: ' + error.message);
  }
}

// Function to generate a verification token based on user ID
const generateVerificationToken = (userId) => {
  const token = crypto.randomBytes(16).toString('hex');
  // Concatenate the user ID to the token to ensure uniqueness
  return token + userId;
};

module.exports = { generateVerificationToken, sendEmail };