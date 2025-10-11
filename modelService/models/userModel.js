const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        userName: {
            type: String,
            required: true,
            unique: true,
        },
        firstName: {
            type: String
        },
        lastName: {
            type: String
        },
        password: {
            type: String,
            required: true,
            minLength: 6
        },
        gender: {
            type: String,
            required: true,
            enum: ['male', 'female','other']
        },
        emailId: {
            type: String,
            trim: true,
            lowercase: true,
            unique: true,
            required: 'Email address is required',
        },
        mobile: {
            type: Number,
            required: true
        },
        profilePic: {
            type: String
        },
        resetToken: {
            type: String
        },
        resetTokenExpiration: {
            type: String
        },
        otp: {
            type: String
        }
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model('Users',userSchema);