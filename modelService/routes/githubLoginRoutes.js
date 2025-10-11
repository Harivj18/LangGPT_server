const express = require('express');
const routes = express.Router();
const {githubLogin, githubLoginAuth} = require('../controllers/githubLoginController');

routes.get('/auth', githubLogin);
routes.get('/auth/callback', githubLoginAuth);

module.exports = routes;