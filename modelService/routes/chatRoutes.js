const express = require('express');
const routes = express.Router();
const { 
    askLLM, 
    uploadUserDoc, 
    useThirdPartyTools ,
    oAuthVerification,
    chatHistory,
    chatTitles,
    editTitle,
    deleteChat
} = require('../controllers/chatBotController');
const { upload } = require('../middlewares/upload');
const { uploadDir } = require('../utils');

routes.post('/langGPT/chat', askLLM);

routes.get('/langGPT/titles/list', chatTitles);
routes.get('/langGPT/:chatId', chatHistory);
routes.put('/langGPT/edit/:chatId/title', editTitle);
routes.delete('/langGPT/delete/:chatId', deleteChat);

routes.post('/langGPT/RAG/uploadDocument', upload.single('file'), uploadUserDoc);
routes.use('/files', express.static(uploadDir));
routes.post('/langGPT/tools', useThirdPartyTools);
routes.get('/oauth2/googleapps', oAuthVerification);

module.exports = routes;