const express = require('express');
const router = express.Router();
const { sendEmail } = require('../utils/EmailUtils.js');

// Route to send an email
router.post('/send-email', async (req, res) => {
  const { recipientEmail, subject, content } = req.body;

  try {
    await sendEmail(recipientEmail, subject, content);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Error sending email' });
  }
});

module.exports = router;