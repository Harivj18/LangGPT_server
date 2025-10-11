
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const users = require('../models/ThirdPartyUserLoginModel');
require('dotenv').config();

console.log('process.env.GITHUB_LOGIN_CLIENT_ID',process.env.GITHUB_LOGIN_CLIENT_ID);
console.log('process.env.GITHUB_LOGIN_CLIENT_SECRET',process.env.GITHUB_LOGIN_CLIENT_SECRET);


passport.use(
    new GitHubStrategy ({
        clientID: process.env.GITHUB_LOGIN_CLIENT_ID,
        clientSecret: process.env.GITHUB_LOGIN_CLIENT_SECRET,
        callbackURL: "/github/auth/callback"
    },
    async (accessToken, refreshToken, profile, cb) => {
        try {
            let oldUser = await users.findOne({userName: profile.username});

            if(!oldUser) {
                oldUser = new users({
                    userName: profile.username,
                    userId: profile.id,
                    profilePic: profile.photos[0].value
                })

                await oldUser.save()
            }

            return cb(null, oldUser)
        } catch (error) {
            console.log('Error while authenticating github account using githubStrategy', error);
            return cb(error, null)
        }
    }
    )
)

passport.serializeUser((userInfo, cb) => {
    cb(null, userInfo.id)
})

passport.deserializeUser(async (userInfo, cb) => {
    try {
        const userData = await users.findById(userInfo.id)
        cb(null, userData)
    } catch (error) {
        cb(error, null)
    }
})



const githubLogin = (req, res, next) => {
    try {
        passport.authenticate('github', {scope: ["profile", "email"]})(req, res, next);
    } catch (error) {
        console.log('Error while SignUp using Github Account',error);
        return res.status(500).send({
            "status": "Failed",
            "message": error
        })
    }
}

const githubLoginAuth = (req, res, next) => {
    try {
        passport.authenticate('github', {
            successRedirect: `${process.env.CLIENT_URL1}/home`,
            failureRedirect: `${process.env.CLIENT_URL1}/login`
        })(req, res, next)
    } catch (error) {
        console.log('Error while Authorizing github Account for Signing In', error);
        return res.status(500).send({
            "status": "Failed",
            "message": error
        })
    }
}

module.exports = {githubLogin, githubLoginAuth}