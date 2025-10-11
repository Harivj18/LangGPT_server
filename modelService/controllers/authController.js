const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const setTokenCookie = require('../utils/set_jwtandcookie');
const nodemailer = require('nodemailer');
const lodash = require('lodash');
const {
    randomBytes,
} = require('node:crypto');

const mailTransport = nodemailer.createTransport({
    'service': 'gmail',
    'secure': true,
    'port': 587,
    'auth': {
        'user': 'djangot1798@gmail.com',
        'pass': 'pfoepyyuxemqhfku'
    }
})

const signup = async (req, res) => {
    try {
        const {
            userName,
            firstName,
            lastName,
            password,
            confirm_password,
            gender,
            emailId,
            mobile,
            profilePic
        } = req.body;

        if (password !== confirm_password) {
            return res.json({ status: 500, message: "Passwords Does not match" })
        }

        const isUserExist = await User.findOne({ userName });

        if (isUserExist) {
            return res.json({ status: 500, message: "UserName Already Taken" })
        }
        console.log('+process.env.GENSALT', +process.env.GENSALT);

        const salt = await bcrypt.genSalt(++process.env.GENSALT)
        const hashedPassword = await bcrypt.hash(password, salt);

        const boyProfilePic = `https://avatar.iran.liara.run/public/boy?username=${userName}`;
        const girlProfilePic = `https://avatar.iran.liara.run/public/girl?username=${userName}`;

        const createUser = new User({
            userName,
            firstName,
            lastName,
            password: hashedPassword,
            gender,
            emailId,
            mobile,
            profilePic: gender === 'male' ? boyProfilePic : girlProfilePic
        })

        if (createUser) {

            await createUser.save();

            await setTokenCookie(userName, res)

            return res.json({
                _id: createUser._id,
                fullName: createUser.fullName,
                emailId: createUser.emailId,
                profilePic: createUser.profilePic
            })
        } else {
            return res.json({
                status: 201,
                message: "User Creation Unsuccessfull"
            })
        }

    } catch (error) {
        console.log('authController.js : signup => Error while creating user', error);
        return res.json({ status: 500, message: "Internal Server Error", reason: error })
    }
}

const login = async (req, res) => {
    try {
        const { userName, password } = req.body;

        const fetchUser = await User.findOne({ userName });

        if (fetchUser) {
            const decryptPassword = await bcrypt.compare(password, fetchUser.password)
            console.log('fetchuser', fetchUser);

            if (decryptPassword) {
                await setTokenCookie(userName, res);
                return res.json({ 'status': 200, 'message': 'Match Found', userName, 'userId': 777 })
            } else {
                return res.json({ 'status': 500, 'message': 'InCorrect Paasword' })
            }
        } else {
            return res.json({ 'status': 404, "message": 'Invalid User' })
        }


    } catch (error) {
        console.log('authController.js : login =>Error while login into langGPT', error);
        return res.json({ 'status': 500, 'message': error })
    }
}

const logout = (req, res) => {
    try {
        res.cookie('jwt', "", { maxAge: 0 });
        return res.json({ 'status': 200, 'message': 'User Logout Successful' })
    } catch (error) {
        console.log('authController.js : LOGOUT  =>Error while logging out from the langgpt', error);
        return res.json({ 'status': 500, 'message': error })
    }
}

const forgotPassword = async (req, res) => {
    try {
        const {
            userName,
            emailId,
            mobileNumber,
            resetType,
            resetOption
        } = req.body;
        console.log('resetTyperesetType', resetType);

        if (resetType) {
            if (resetType.toUpperCase() === 'MAIL') {
                if (userName !== undefined && emailId !== undefined) {
                    // const token = req.cookies.jwt;
                    // if (token) {
                    const user = await User.findOne({ emailId }).select('emailId');
                    if (!user) {
                        return res.status(500).send({
                            "status": "Failed",
                            "message": "User Does not exist"
                        })
                    }

                    const resetToken = randomBytes(20).toString('hex');
                    user.resetToken = resetToken;
                    user.resetTokenExpiration = Date.now() + 600000; // valid for 10 mins only

                    await user.save();

                    const recipientInfo = {
                        'from': 'djangot1798@gmail.com',
                        'to': `${emailId}`,
                        'subject': `Reset Password`,
                        'text': `Kindly Use the Link for resetting password ${process.env.CLIENT_URL1}/reset-password/${resetToken}`
                    }
                    mailTransport.sendMail(recipientInfo, (Info, message) => {
                        if (Info === null && message.hasOwnProperty('messageId')) {
                            console.log(`Mail Sent Successfully to ${userName}`);
                            res.json({
                                "status": 200,
                                "resetToken": resetToken,
                                "message": `Mail Sent to ${userName}`
                            })
                            res.end()
                        }
                    })
                    // } else {
                    //     return res.json({'status': 500, 'message': 'Invalid Session/ UserId'})
                    // }
                } else {
                    return res.status(404).send({
                        "status": "Failed",
                        "message": 'Invalid UserName / Email'
                    })
                }
            } else if (resetType.toUpperCase() === 'MAILOTP') {

            } else if (resetType.toUpperCase() === 'MOBILEOTP') {

            }
        } else {
            return res.status(500).json({
                "status": "Failed",
                "message": "Invalid Reset Option / Something Wrong Happened on Client"
            })
        }
    } catch (error) {
        console.log('authController.js : forgotPassword => Error while Forgot Password of user', error);
        return res.json({ 'status': 500, 'message': error })
    }
}

const resetPassword = async (req, res) => {
    try {
        console.log('resetPasswordresetPassword');

        const { resetToken, newPassword, confirmPassword } = req.body;
        console.log('newPasswordnewPassword', newPassword);
        console.log('confirmPasswordconfirmPassword', confirmPassword);
        console.log('resetTokenresetToken', resetToken);

        if (lodash.isEqual(newPassword, confirmPassword)) {
            const user = await User.findOne({ resetToken, resetTokenExpiration: { $gt: Date.now() } }).select('resetToken');
            console.log('useruser', user);

            if (!user) {
                return res.status(500).json({
                    "status": "Failed",
                    "message": "Invalid User or Session Expired"
                })
            }
            const salt = await bcrypt.genSalt(+process.env.GENSALT);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            user.password = hashedPassword;
            user.resetToken = null,
            user.resetTokenExpiration = null

            await user.save()

            return res.status(200).json({
                "status": "Success",
                "message": "Password Reset SuccessFull"
            })
        }
        return res.status(500).json({
            "status": "Failed",
            "message": "Password Mismatched"
        })
    } catch (error) {
        console.log('authController.js : resetPassword => Error while reseting password for user account', error);
        return res.status(500).json({
            "status": "Failed",
            "message": error
        })
    }
}

const verifyResetToken = async (req, res) => {
    const { token } = req.body;
    console.log('hii',token);
    
    if (!token) return res.status(400).json({ status: 'FAILED', message: 'Token is required' });

    try {
        const user = await User.findOne({ resetToken: token });
        console.log('http://localhost:3000/reset-password/0ec0daad81b33ab6c65b00d68f078cb077c3c9d9',user);
        
        if (!user) {
            return res.status(400).json({ status: 'FAILED', message: 'Invalid token' });
        }
        console.log('user.resetTokenExpiry < Date.now()',user.resetTokenExpiration < Date.now());
        
        if (!user.resetTokenExpiration || user.resetTokenExpiration < Date.now()) {
            return res.status(400).json({ status: 'FAILED', message: 'Token has expired' });
        }
        console.log('sss');
        
        return res.status(200).json({ status: 'SUCCESS', message: 'Token is valid' });
    } catch (err) {
        console.error('authController.js : verifyResetToken => Verify token error:', err);
        return res.status(500).json({ status: 'FAILED', message: 'Server error' });
    }
};

module.exports = { signup, login, logout, forgotPassword, resetPassword, verifyResetToken }