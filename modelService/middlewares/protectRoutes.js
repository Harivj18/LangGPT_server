const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const protectRoutes = async(req, res, next) => {
    try {
        const token = req.cookies.jwt

        if (!token) {
            return res.json({'status': 404, 'message': 'Invalid User'})
        }

        const decryptToken = await jwt.verify(token, process.env.JWT_SECRET_KEY);

        if(!decryptToken) {
            return res.json({'status': 500, 'message': 'Invalid Session'})
        }

        const loggedUser = await User.findOne({'userName': decryptToken.userName}).select('-password');

        if (!loggedUser) {
            return res.json({'status': 500, 'message': 'User Session Not Active'});
        }

        req.user = loggedUser;

        console.log('Logged User Session',loggedUser);
        next()

    } catch (error) {
        console.log('Error while authenticating user routes',error);
        return res.json({'status': 500, 'message': 'Error no token found'})
    }
}

const authCheck = async (req, res) => {
    try {
        const token = req.cookies.jwt;
        
        if(!token) {
            return res.json({
                "status": "Error",
                "message": "Invalid Logged User"
            })
        }

        const verifyToken = jwt.verify(token, process.env.JWT_SECRET_KEY);

        if (!verifyToken) {
            return res.json({
                "status": "ERROR",
                "message": "Invalid Session"
            })
        }

        return res.json({
            "status": "Success",
            "message": "Verified"
        })
    } catch (error) {
        console.log('Error while authenticating Protected Routes',error);
        return res.json({
            "status": "ERROR",
            "message": error
        })
    }
}

module.exports = {protectRoutes, authCheck};