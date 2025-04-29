const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const donationSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: false
    },
    pickupLocation: {
        type: String,
        required: true
    },
    publishedDate: {
        type: Date,
        default: Date.now
    },
    available: {
        type: Boolean,
        default: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true 
    }
});

const Donations = mongoose.model('Donations', donationSchema);

module.exports = Donations;
