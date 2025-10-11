const express = require('express');
const routes = express.Router();
const {googleLogin, googleLoginAuth} = require('../controllers/googleLoginController');

routes.get('/google', googleLogin);
routes.get('/google/callback',googleLoginAuth)

module.exports = routes;