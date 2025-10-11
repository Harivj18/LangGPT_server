const { storeMessageHistory } = require('../services/storeMessage')

const messageClassifier = (inputJson) => {
    return new Promise(async (resolve, reject) => {
        try {
            let {
                newChat
            } = inputJson;
            console.log('newChat',newChat);
            
            if (['add','edit'].includes(newChat)) {
                await saveConversation(inputJson)
            } else if (newChat === 'history') {
                await retrieveConversation(inputJson)
            } else {

            }
            resolve()
        } catch (error) {
            console.error('messageController.js : messageClassifier => Unable to decide DB Operation', error);
            reject(error)
        }
    })
}

const saveConversation = (inputJson) => {
    return new Promise(async (resolve, reject) => {
        try {
            let {
                chatId,
                query,
                llmOutput,
                newChat
            } = inputJson;
            console.log('saveConversation',newChat);
            
            const messageHistory = await storeMessageHistory(chatId);
            await messageHistory.addConversation(query, llmOutput, newChat);
            resolve('Message Stored ⚡')
        } catch (error) {
            console.error('messageController.js : saveConversation => Unable to store the convo', error);
            reject(error)
        }
    })
}

const retrieveConversation = () => {
    return new Promise(async(resolve, reject) => {
        try {
            let {
                chatId,
            } = inputJson;
            const messageHistory = await storeMessageHistory(chatId);
            const message = await messageHistory.getMessages();
            resolve()
        } catch (error) {
            console.error('messageController.js : retrieveConversation => Issue while fetching chat conversation', error);
            reject(error)
        }
    })
}

module.exports = { saveConversation, messageClassifier}