const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { htmlToText } = require('html-to-text');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT == 465, 
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const voteNotificationQueue = {};

const addVoteToQueue = (proposalId, proposal, vote) => {
  if (!voteNotificationQueue[proposalId]) {
    voteNotificationQueue[proposalId] = { votes: [], timer: null };
  }

  // Check if a previous vote with the same ID exists in the queue
  const existingVoteIndex = voteNotificationQueue[proposalId].votes.findIndex(
    v => v.id === vote.id // Use `id` to uniquely identify the vote
  );

  if (existingVoteIndex > -1) {
    // Update the existing vote with the new data
    voteNotificationQueue[proposalId].votes[existingVoteIndex] = vote;
  } else {
    // Otherwise, push a new vote to the queue
    voteNotificationQueue[proposalId].votes.push(vote);
  }

  // Set a timer to process the queued votes if it hasn't been set yet
  if (!voteNotificationQueue[proposalId].timer) {
    voteNotificationQueue[proposalId].timer = setTimeout(async () => {
      const votes = voteNotificationQueue[proposalId].votes;
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
  let emailContent = `<p>Multiple votes have been submitted for your proposal titled "<strong>${proposal.title}</strong>".</p>`;
    votes.forEach(vote => {
      emailContent += `
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