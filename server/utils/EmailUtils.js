const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { htmlToText } = require('html-to-text');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT == 465, // true for port 465, false for other ports
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendEmail = async (to, subject, htmlContent) => {
  try {
    const plainTextContent = htmlToText(htmlContent, { wordwrap: 130 });

    const recipients = Array.Array.isArray(to) ? to.join(','): to;

    const info = await transporter.sendMail({
      from: '"Consensus Check" <notifications@consensuscheck.com>', 
      to: recipients,
      subject: subject,
      text: plainTextContent, // Convert HTML to plain text
      html: htmlContent,
    });

  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// Function to generate a verification token based on user ID
const generateVerificationToken = (userId) => {
  const token = crypto.randomBytes(16).toString('hex');
  // Concatenate the user ID to the token to ensure uniqueness
  return token + userId;
};

module.exports = { generateVerificationToken, sendEmail };