const { MongoDBChatMessageHistory } = require('@langchain/mongodb');
const { ConversationSummaryBufferMemory } = require('langchain/memory');
const mongoose = require('mongoose');
const { v4: uuid } = require('uuid');
const { getModelLLM, resultParser } = require('../utils/helperMethods');
const { ConversationChain } = require('langchain/chains');
const { PromptTemplate } = require('@langchain/core/prompts');
const { RunnableSequence } = require('@langchain/core/runnables');
const { th } = require('zod/v4/locales');

class customChatHistory extends MongoDBChatMessageHistory {
    async addUserMessage(message) {
        await this.collection.insertOne({
            _id: `LangGPT_2_${uuid()}`,
            sessionId: this.sessionId,
            type: "chatHistory",
            content: message,
            role: "user",
            created_on: new Date()
        })
    }

    async addAIMessage(message) {
        await this.collection.insertOne({
            _id: `LangGPT_2_${uuid()}`,
            sessionId: this.sessionId,
            type: "chatHistory",
            content: message,
            role: "ai",
            created_on: new Date()
        })
    }
}

class CombinedChatHistory {
    constructor({ collection, sessionId }) {
        this.collection = collection;
        this.sessionId = sessionId;
    }

    async addConversation(userMessage, aiMessage, newChat) {
        let title = aiMessage.slice(0, 15);
        console.log('addConversation');
        if (newChat && newChat !== 'new') {

            let llm = await getModelLLM('flash', 1);
            const prompt = PromptTemplate.fromTemplate(`
                You're a helpful AI assistant, based on given context provide the title for this input
    
                context: {context}
            `)
            const parser = await resultParser('');

            const chain = RunnableSequence.from([
                prompt,
                llm,
                parser
            ])
            title = await chain.invoke({
                context: aiMessage
            })

            console.log('AI Agent Title', title);

            await this.collection.insertOne({
                _id: `LangGPT_2_${uuid()}`,
                sessionId: this.sessionId,
                type: "chatHistory",
                title,
                messages: [
                    { type: "human", data: { content: userMessage } },
                    { type: "ai", data: { content: aiMessage } },
                ],
                created_on: new Date(),
                updated_on: new Date(),
            });
        } else {
            const doc = await this.collection.updateOne(
                { sessionId: this.sessionId, type: "chatHistory" },
                {
                    $push: {
                        messages: {
                            $each: [
                                { type: "human", data: { content: userMessage } },
                                { type: "ai", data: { content: aiMessage } },
                            ],
                        },
                    },
                    $set: { updated_on: new Date() },
                },
                {
                    returnDocument: 'after'
                }
            );
            console.log('updated doc', doc);

        }

    }

    async getMessages() {
        const doc = await this.collection.findOne({ sessionId: this.sessionId });
        console.log('doc', doc);
        console.log('this.sessionId', this.sessionId);

        if (!doc || !doc.messages) return [];

        return doc?.messages.map((m, idx) => ({
            id: `${idx}`,
            role: m.type === "human" ? "user" : "assistant",
            type: "text",
            content: m.data.content,
            created_on: doc.created_on.toLocaleTimeString(),
            updated_on: doc.updated_on ? doc.updated_on.toLocaleTimeString() : doc.created_on.toLocaleTimeString()
        }));
    }

    async getTitles() {
        const doc = await this.collection.find().project({ title: 1, created_on: 1, sessionId: 1 })
            .toArray();
        console.log('doc', doc);

        if (!doc || doc.length <= 0) return [];

        return doc
    }

    async updateTitle(newTitle) {
        const updatedTitle = await this.collection.updateOne(
            {
                sessionId: this.sessionId
            },
            {
                $set: {
                    title: newTitle,
                    updated_on: new Date()
                }
            },
            {
                returnDocument: 'after'
            }
        )
        console.log('updatedTitle',updatedTitle);
        
    }

    async deleteThread() {
        const deleteTitle = await this.collection.deleteOne(
            { sessionId: this.sessionId }
        )
        console.log('deleteTitle',deleteTitle);
    }
}

const storeMessageHistory = (sessionId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const messageHistory = new CombinedChatHistory({
                collection: mongoose.connection.collection('chat_history'),
                sessionId
            })
            resolve(messageHistory)
        } catch (error) {
            console.error('chatHistory.js : storeMessageHistory => Unable to save chat history into mongo', error);
            reject(error)
        }
    })
}

const retrieveMessages = (chatId) => {
    return new Promise((resolve, reject) => {
        try {
            await
        } catch (error) {
            console.error('chatHistory.js : retrieveMessages => Something isn`t seems right, while fetching messages', error);
            reject(error)
        }
    })
}

const dummyRef = () => {
    // if (mode === 'memory') {
    //     chatMemory = new ConversationSummaryBufferMemory({
    //         llm,
    //         returnMessages: true,
    //         messageKey: 'chat_history',
    //         chatHistory: messageHistory
    //     })
    // }
    // const parser = await resultParser(input)
    // const chain = new ConversationChain({
    //     llm,
    //     memory: chatMemory
    // })

    // let chatMemory;
    // const llm = await getModelLLM('flash');

}

module.exports = {
    storeMessageHistory,
    customChatHistory
}