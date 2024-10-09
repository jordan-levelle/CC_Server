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

const voteNotificationQueue = {};

const addVoteToQueue = (proposalId, proposal, vote) => {
  if (!voteNotificationQueue[proposalId]) {
    voteNotificationQueue[proposalId] = [];
  }

  // Push vote to the queue for this proposal
  voteNotificationQueue[proposalId].push(vote);

  // Set a timer if not already set
  if (!voteNotificationQueue[proposalId].timer) {
    voteNotificationQueue[proposalId].timer = setTimeout(async () => {
      const votes = voteNotificationQueue[proposalId];
      delete voteNotificationQueue[proposalId]; // Clear the queue after sending the email

      if (proposal.email) {
        const { emailSubject, emailContent } = generateVoteEmailContent({ proposal, votes });

        // Send email with the queued votes
        await sendEmail(proposal.email, emailSubject, emailContent);
      }
    }, 120000); // 2-minute delay
  }
};


const generateVoteEmailContent = ({ proposal, votes}) => {
  if ( votes.length === 1) {
    //single vote sub/update
    const { name, opinion, comment, action } = votes[0];
    const actionVerb = action === 'submit' ? 'submitted' : 'updated';
    const actionTitle = action === 'submit' ? 'New Vote Submitted' : 'Vote Updated'

    const emailSubject = `${actionTitle}`;
    const emailContent = `
    <p>A vote has been ${actionVerb} for your proposal titled "<strong>${proposal.title}</strong>".</p>
    <p><strong>Submitted by:</strong> ${name}</p>
    <p><strong>Vote:</strong> ${opinion}</p>
    <p><strong>Comment:</strong> ${comment}</p>
    <p><a href="${process.env.ORIGIN}${proposal.uniqueUrl}">View Proposal</a></p>
  `;

  return { emailSubject, emailContent };
  
} else {
  const emailSubject = 'Multiple Vote Notifications';
  const emailContent = `<p>Multiple votes have been submitted for your proposal titled "<strong>${proposal.title}</strong>".</p>`;
    votes.forEach(vote => {
      emailContent = `
        <p><strong>Submitted by:</strong> ${vote.name}</p>
        <p><strong>Vote:</strong> ${vote.opinion}</p>
        <p><strong>Comment:</strong> ${vote.comment}</p>
        <hr>`;
    });
    emailContent += `<p><a href="${process.env.ORIGIN}${proposal.uniqueUrl}">View Proposal</a></p>`;

    return { emailSubject, emailContent };
  }
}

const sendEmail = async (to, subject, htmlContent) => {
  try {
    // Check if `to` is an array, if so, join it into a comma-separated string
    const recipients = Array.isArray(to) ? to.join(', ') : to;

    const plainTextContent = htmlToText(htmlContent, { wordwrap: 130 });

    const info = await transporter.sendMail({
      from: '"Consensus Check" <notifications@consensuscheck.com>',
      to: recipients,  // Use the comma-separated list of recipients
      subject: subject,
      text: plainTextContent,
      html: htmlContent,
    });

    console.log('Email sent successfully:', info);
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

module.exports = { addVoteToQueue, sendEmail, generateVoteEmailContent, generateVerificationToken };