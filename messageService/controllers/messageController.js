const { storeMessageHistory } = require('../services/storeMessage')


const saveConversation = (inputJson) => {
    return new Promise(async (resolve, reject) => {
        try {
            let {
                chatId,
                query,
                llmOutput,
                newChat
            } = inputJson;

            const messageHistory = await storeMessageHistory(chatId);
            await messageHistory.addConversation(query, llmOutput, newChat);
            resolve('Message Stored ⚡')
        } catch (error) {
            console.error('messageController.js : saveConversation => Unable to store the convo', error);
            reject(error)
        }
    })
}

module.exports = { saveConversation }