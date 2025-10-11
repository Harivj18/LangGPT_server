const mongoose = require('mongoose');

const ThirdPartyUserLoginModel = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true,
        unique: true
    },
    emailId: {
        type: String,
        trim: true,
        unique: true,
        // required: 'Email Address is required'   
    },
    profilePic: {
        type: String,
        required: true
    },
    mobile: {
        type: Number,
        // required: true
    },
    gender: {
        type: String,
        // required: true,
        enum: ['male', 'female']
    }
})

module.exports = mongoose.model('ThirdPartyLogin', ThirdPartyUserLoginModel);