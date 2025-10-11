const express = require('express');
const routes = express.Router();
const {signup, login, logout, forgotPassword, resetPassword, verifyResetToken} = require('../controllers/authController');
const { authCheck } = require('../middlewares/protectRoutes')

routes.post('/signup',signup)
routes.post('/login',login)
routes.post('/logout',logout)
routes.post('/forgot-password',forgotPassword)
routes.post('/reset-password',resetPassword)
routes.post('/verify-token', verifyResetToken)
routes.get('/authCheck', authCheck)

module.exports = routes;