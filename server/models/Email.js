const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema ({
    recipientEmail: {
        type: String,
        required: true,
    },
    subject: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
});

module.exports = mongoose.model('Email', emailSchema);