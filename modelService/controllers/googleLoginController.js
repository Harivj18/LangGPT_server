const passport = require('passport');
const OAuth2Strategy = require('passport-google-oauth2').Strategy;
const users = require('../models/ThirdPartyUserLoginModel'); 
require('dotenv').config(); 

passport.use(
    new OAuth2Strategy({
        clientID: process.env.GOOGLE_LOGIN_CLIENT_ID,
        clientSecret: process.env.GOOGLE_LOGIN_CLIENT_SECRET,
        callbackURL: '/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            console.log('profileprofile',profile);
             console.log('Google Access Token', accessToken);
            console.log('Google Refresh Token', refreshToken);
            
            let isUserExist = await users.findOne({ emailId: profile.emails[0].value });

            if (!isUserExist) {
                isUserExist = new users({
                    userName: profile.displayName,
                    userId: profile.id,
                    emailId: profile.emails[0].value,
                    profilePic: profile.photos[0].value
                });

                await isUserExist.save();
            }

            return done(null, isUserExist);
        } catch (error) {
            console.log('Error while Authenticating Google login User:', error);
            return done(error, null);
        }
    })
);

passport.serializeUser((user, done) => {
    done(null, user.id); 
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await users.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

const googleLogin = (req, res, next) => {
    try {
        passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
    } catch (error) {
        console.log('Error while Signin Using Google Account',error);
        return res.status(500).send({
            "status": "Failed",
            "message": error
        })
    }
};

const googleLoginAuth = (req, res, next) => {
    try {
        passport.authenticate('google', {
            successRedirect: `${process.env.CLIENT_URL1}/home`,
            failureRedirect: `${process.env.CLIENT_URL1}/login`,
        })(req, res, next);
    } catch (error) {
        console.log('Error while Signin Using Github Account',error);
        return res.status(500).send({
            "status": "Failed",
            "message": error
        })
    }
};

module.exports = { googleLogin, googleLoginAuth };
