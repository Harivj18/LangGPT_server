const jwt = require('jsonwebtoken');

const setTokenCookie = async (userName, res) => {
    try {
        const token = await jwt.sign({userName}, process.env.JWT_SECRET_KEY, {expiresIn: '15d'});
        // localStorage.setItem("userInfo", userName);
        res.cookie('jwt', token, {
            maxAge: 15 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: "Strict",
            secure:true
        })

    } catch (error) {
        console.log('Error while Set Cookies and Token',error);
        return {'status': 500, 'message': error};
    }
}

module.exports = setTokenCookie;